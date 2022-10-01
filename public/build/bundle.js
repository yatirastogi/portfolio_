
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.48.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /**
     * @typedef {Object} WrappedComponent Object returned by the `wrap` method
     * @property {SvelteComponent} component - Component to load (this is always asynchronous)
     * @property {RoutePrecondition[]} [conditions] - Route pre-conditions to validate
     * @property {Object} [props] - Optional dictionary of static props
     * @property {Object} [userData] - Optional user data dictionary
     * @property {bool} _sveltesparouter - Internal flag; always set to true
     */

    /**
     * @callback AsyncSvelteComponent
     * @returns {Promise<SvelteComponent>} Returns a Promise that resolves with a Svelte component
     */

    /**
     * @callback RoutePrecondition
     * @param {RouteDetail} detail - Route detail object
     * @returns {boolean|Promise<boolean>} If the callback returns a false-y value, it's interpreted as the precondition failed, so it aborts loading the component (and won't process other pre-condition callbacks)
     */

    /**
     * @typedef {Object} WrapOptions Options object for the call to `wrap`
     * @property {SvelteComponent} [component] - Svelte component to load (this is incompatible with `asyncComponent`)
     * @property {AsyncSvelteComponent} [asyncComponent] - Function that returns a Promise that fulfills with a Svelte component (e.g. `{asyncComponent: () => import('Foo.svelte')}`)
     * @property {SvelteComponent} [loadingComponent] - Svelte component to be displayed while the async route is loading (as a placeholder); when unset or false-y, no component is shown while component
     * @property {object} [loadingParams] - Optional dictionary passed to the `loadingComponent` component as params (for an exported prop called `params`)
     * @property {object} [userData] - Optional object that will be passed to events such as `routeLoading`, `routeLoaded`, `conditionsFailed`
     * @property {object} [props] - Optional key-value dictionary of static props that will be passed to the component. The props are expanded with {...props}, so the key in the dictionary becomes the name of the prop.
     * @property {RoutePrecondition[]|RoutePrecondition} [conditions] - Route pre-conditions to add, which will be executed in order
     */

    /**
     * Wraps a component to enable multiple capabilities:
     * 1. Using dynamically-imported component, with (e.g. `{asyncComponent: () => import('Foo.svelte')}`), which also allows bundlers to do code-splitting.
     * 2. Adding route pre-conditions (e.g. `{conditions: [...]}`)
     * 3. Adding static props that are passed to the component
     * 4. Adding custom userData, which is passed to route events (e.g. route loaded events) or to route pre-conditions (e.g. `{userData: {foo: 'bar}}`)
     * 
     * @param {WrapOptions} args - Arguments object
     * @returns {WrappedComponent} Wrapped component
     */
    function wrap$1(args) {
        if (!args) {
            throw Error('Parameter args is required')
        }

        // We need to have one and only one of component and asyncComponent
        // This does a "XNOR"
        if (!args.component == !args.asyncComponent) {
            throw Error('One and only one of component and asyncComponent is required')
        }

        // If the component is not async, wrap it into a function returning a Promise
        if (args.component) {
            args.asyncComponent = () => Promise.resolve(args.component);
        }

        // Parameter asyncComponent and each item of conditions must be functions
        if (typeof args.asyncComponent != 'function') {
            throw Error('Parameter asyncComponent must be a function')
        }
        if (args.conditions) {
            // Ensure it's an array
            if (!Array.isArray(args.conditions)) {
                args.conditions = [args.conditions];
            }
            for (let i = 0; i < args.conditions.length; i++) {
                if (!args.conditions[i] || typeof args.conditions[i] != 'function') {
                    throw Error('Invalid parameter conditions[' + i + ']')
                }
            }
        }

        // Check if we have a placeholder component
        if (args.loadingComponent) {
            args.asyncComponent.loading = args.loadingComponent;
            args.asyncComponent.loadingParams = args.loadingParams || undefined;
        }

        // Returns an object that contains all the functions to execute too
        // The _sveltesparouter flag is to confirm the object was created by this router
        const obj = {
            component: args.asyncComponent,
            userData: args.userData,
            conditions: (args.conditions && args.conditions.length) ? args.conditions : undefined,
            props: (args.props && Object.keys(args.props).length) ? args.props : {},
            _sveltesparouter: true
        };

        return obj
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function parse(str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules\svelte-spa-router\Router.svelte generated by Svelte v3.48.0 */

    const { Error: Error_1, Object: Object_1, console: console_1$1 } = globals;

    // (251:0) {:else}
    function create_else_block(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 4)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(251:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (244:0) {#if componentParams}
    function create_if_block(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [{ params: /*componentParams*/ ctx[1] }, /*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*componentParams, props*/ 6)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
    					dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(244:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function wrap(component, userData, ...conditions) {
    	// Use the new wrap method and show a deprecation warning
    	// eslint-disable-next-line no-console
    	console.warn('Method `wrap` from `svelte-spa-router` is deprecated and will be removed in a future version. Please use `svelte-spa-router/wrap` instead. See http://bit.ly/svelte-spa-router-upgrading');

    	return wrap$1({ component, userData, conditions });
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf('#/');

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: '/';

    	// Check if there's a querystring
    	const qsPosition = location.indexOf('?');

    	let querystring = '';

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	set(getLocation());

    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener('hashchange', update, false);

    	return function stop() {
    		window.removeEventListener('hashchange', update, false);
    	};
    });

    const location = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);
    const params = writable(undefined);

    async function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != '/' && location.indexOf('#/') !== 0) {
    		throw Error('Invalid parameter location');
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	// Note: this will include scroll state in history even when restoreScrollState is false
    	history.replaceState(
    		{
    			...history.state,
    			__svelte_spa_router_scrollX: window.scrollX,
    			__svelte_spa_router_scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	window.location.hash = (location.charAt(0) == '#' ? '' : '#') + location;
    }

    async function pop() {
    	// Execute this code when the current call stack is complete
    	await tick();

    	window.history.back();
    }

    async function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != '/' && location.indexOf('#/') !== 0) {
    		throw Error('Invalid parameter location');
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	const dest = (location.charAt(0) == '#' ? '' : '#') + location;

    	try {
    		const newState = { ...history.state };
    		delete newState['__svelte_spa_router_scrollX'];
    		delete newState['__svelte_spa_router_scrollY'];
    		window.history.replaceState(newState, undefined, dest);
    	} catch(e) {
    		// eslint-disable-next-line no-console
    		console.warn('Caught exception while replacing the current page. If you\'re running this in the Svelte REPL, please note that the `replace` method might not work in this environment.');
    	}

    	// The method above doesn't trigger the hashchange event, so let's do that manually
    	window.dispatchEvent(new Event('hashchange'));
    }

    function link(node, opts) {
    	opts = linkOpts(opts);

    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != 'a') {
    		throw Error('Action "link" can only be used with <a> tags');
    	}

    	updateLink(node, opts);

    	return {
    		update(updated) {
    			updated = linkOpts(updated);
    			updateLink(node, updated);
    		}
    	};
    }

    // Internal function used by the link function
    function updateLink(node, opts) {
    	let href = opts.href || node.getAttribute('href');

    	// Destination must start with '/' or '#/'
    	if (href && href.charAt(0) == '/') {
    		// Add # to the href attribute
    		href = '#' + href;
    	} else if (!href || href.length < 2 || href.slice(0, 2) != '#/') {
    		throw Error('Invalid value for "href" attribute: ' + href);
    	}

    	node.setAttribute('href', href);

    	node.addEventListener('click', event => {
    		// Prevent default anchor onclick behaviour
    		event.preventDefault();

    		if (!opts.disabled) {
    			scrollstateHistoryHandler(event.currentTarget.getAttribute('href'));
    		}
    	});
    }

    // Internal function that ensures the argument of the link action is always an object
    function linkOpts(val) {
    	if (val && typeof val == 'string') {
    		return { href: val };
    	} else {
    		return val || {};
    	}
    }

    /**
     * The handler attached to an anchor tag responsible for updating the
     * current history state with the current scroll state
     *
     * @param {string} href - Destination
     */
    function scrollstateHistoryHandler(href) {
    	// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
    	history.replaceState(
    		{
    			...history.state,
    			__svelte_spa_router_scrollX: window.scrollX,
    			__svelte_spa_router_scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	// This will force an update as desired, but this time our scroll state will be attached
    	window.location.hash = href;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Router', slots, []);
    	let { routes = {} } = $$props;
    	let { prefix = '' } = $$props;
    	let { restoreScrollState = false } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
     */
    		constructor(path, component) {
    			if (!component || typeof component != 'function' && (typeof component != 'object' || component._sveltesparouter !== true)) {
    				throw Error('Invalid component object');
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == 'string' && (path.length < 1 || path.charAt(0) != '/' && path.charAt(0) != '*') || typeof path == 'object' && !(path instanceof RegExp)) {
    				throw Error('Invalid value for "path" argument - strings must start with / or *');
    			}

    			const { pattern, keys } = parse(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == 'object' && component._sveltesparouter === true) {
    				this.component = component.component;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    				this.props = component.props || {};
    			} else {
    				// Convert the component to a function that returns a Promise, to normalize it
    				this.component = () => Promise.resolve(component);

    				this.conditions = [];
    				this.props = {};
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, check if it matches the start of the path.
    			// If not, bail early, else remove it before we run the matching.
    			if (prefix) {
    				if (typeof prefix == 'string') {
    					if (path.startsWith(prefix)) {
    						path = path.substr(prefix.length) || '/';
    					} else {
    						return null;
    					}
    				} else if (prefix instanceof RegExp) {
    					const match = path.match(prefix);

    					if (match && match[0]) {
    						path = path.substr(match[0].length) || '/';
    					} else {
    						return null;
    					}
    				}
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				// In the match parameters, URL-decode all values
    				try {
    					out[this._keys[i]] = decodeURIComponent(matches[i + 1] || '') || null;
    				} catch(e) {
    					out[this._keys[i]] = null;
    				}

    				i++;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoading`, `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {string|RegExp} route - Route matched as defined in the route definition (could be a string or a reguar expression object)
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {object} [userData] - Custom data passed by the user
     * @property {SvelteComponent} [component] - Svelte component (only in `routeLoaded` events)
     * @property {string} [name] - Name of the Svelte component (only in `routeLoaded` events)
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {boolean} Returns true if all the conditions succeeded
     */
    		async checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!await this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;
    	let props = {};

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	async function dispatchNextTick(name, detail) {
    		// Execute this code when the current call stack is complete
    		await tick();

    		dispatch(name, detail);
    	}

    	// If this is set, then that means we have popped into this var the state of our last scroll position
    	let previousScrollState = null;

    	let popStateChanged = null;

    	if (restoreScrollState) {
    		popStateChanged = event => {
    			// If this event was from our history.replaceState, event.state will contain
    			// our scroll history. Otherwise, event.state will be null (like on forward
    			// navigation)
    			if (event.state && event.state.__svelte_spa_router_scrollY) {
    				previousScrollState = event.state;
    			} else {
    				previousScrollState = null;
    			}
    		};

    		// This is removed in the destroy() invocation below
    		window.addEventListener('popstate', popStateChanged);

    		afterUpdate(() => {
    			// If this exists, then this is a back navigation: restore the scroll position
    			if (previousScrollState) {
    				window.scrollTo(previousScrollState.__svelte_spa_router_scrollX, previousScrollState.__svelte_spa_router_scrollY);
    			} else {
    				// Otherwise this is a forward navigation: scroll to top
    				window.scrollTo(0, 0);
    			}
    		});
    	}

    	// Always have the latest value of loc
    	let lastLoc = null;

    	// Current object of the component loaded
    	let componentObj = null;

    	// Handle hash change events
    	// Listen to changes in the $loc store and update the page
    	// Do not use the $: syntax because it gets triggered by too many things
    	const unsubscribeLoc = loc.subscribe(async newLoc => {
    		lastLoc = newLoc;

    		// Find a route matching the location
    		let i = 0;

    		while (i < routesList.length) {
    			const match = routesList[i].match(newLoc.location);

    			if (!match) {
    				i++;
    				continue;
    			}

    			const detail = {
    				route: routesList[i].path,
    				location: newLoc.location,
    				querystring: newLoc.querystring,
    				userData: routesList[i].userData,
    				params: match && typeof match == 'object' && Object.keys(match).length
    				? match
    				: null
    			};

    			// Check if the route can be loaded - if all conditions succeed
    			if (!await routesList[i].checkConditions(detail)) {
    				// Don't display anything
    				$$invalidate(0, component = null);

    				componentObj = null;

    				// Trigger an event to notify the user, then exit
    				dispatchNextTick('conditionsFailed', detail);

    				return;
    			}

    			// Trigger an event to alert that we're loading the route
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick('routeLoading', Object.assign({}, detail));

    			// If there's a component to show while we're loading the route, display it
    			const obj = routesList[i].component;

    			// Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
    			if (componentObj != obj) {
    				if (obj.loading) {
    					$$invalidate(0, component = obj.loading);
    					componentObj = obj;
    					$$invalidate(1, componentParams = obj.loadingParams);
    					$$invalidate(2, props = {});

    					// Trigger the routeLoaded event for the loading component
    					// Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
    					dispatchNextTick('routeLoaded', Object.assign({}, detail, {
    						component,
    						name: component.name,
    						params: componentParams
    					}));
    				} else {
    					$$invalidate(0, component = null);
    					componentObj = null;
    				}

    				// Invoke the Promise
    				const loaded = await obj();

    				// Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
    				if (newLoc != lastLoc) {
    					// Don't update the component, just exit
    					return;
    				}

    				// If there is a "default" property, which is used by async routes, then pick that
    				$$invalidate(0, component = loaded && loaded.default || loaded);

    				componentObj = obj;
    			}

    			// Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    			// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    			if (match && typeof match == 'object' && Object.keys(match).length) {
    				$$invalidate(1, componentParams = match);
    			} else {
    				$$invalidate(1, componentParams = null);
    			}

    			// Set static props, if any
    			$$invalidate(2, props = routesList[i].props);

    			// Dispatch the routeLoaded event then exit
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick('routeLoaded', Object.assign({}, detail, {
    				component,
    				name: component.name,
    				params: componentParams
    			})).then(() => {
    				params.set(componentParams);
    			});

    			return;
    		}

    		// If we're still here, there was no match, so show the empty component
    		$$invalidate(0, component = null);

    		componentObj = null;
    		params.set(undefined);
    	});

    	onDestroy(() => {
    		unsubscribeLoc();
    		popStateChanged && window.removeEventListener('popstate', popStateChanged);
    	});

    	const writable_props = ['routes', 'prefix', 'restoreScrollState'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	function routeEvent_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('routes' in $$props) $$invalidate(3, routes = $$props.routes);
    		if ('prefix' in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ('restoreScrollState' in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		writable,
    		derived,
    		tick,
    		_wrap: wrap$1,
    		wrap,
    		getLocation,
    		loc,
    		location,
    		querystring,
    		params,
    		push,
    		pop,
    		replace,
    		link,
    		updateLink,
    		linkOpts,
    		scrollstateHistoryHandler,
    		onDestroy,
    		createEventDispatcher,
    		afterUpdate,
    		parse,
    		routes,
    		prefix,
    		restoreScrollState,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		props,
    		dispatch,
    		dispatchNextTick,
    		previousScrollState,
    		popStateChanged,
    		lastLoc,
    		componentObj,
    		unsubscribeLoc
    	});

    	$$self.$inject_state = $$props => {
    		if ('routes' in $$props) $$invalidate(3, routes = $$props.routes);
    		if ('prefix' in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ('restoreScrollState' in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    		if ('component' in $$props) $$invalidate(0, component = $$props.component);
    		if ('componentParams' in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ('props' in $$props) $$invalidate(2, props = $$props.props);
    		if ('previousScrollState' in $$props) previousScrollState = $$props.previousScrollState;
    		if ('popStateChanged' in $$props) popStateChanged = $$props.popStateChanged;
    		if ('lastLoc' in $$props) lastLoc = $$props.lastLoc;
    		if ('componentObj' in $$props) componentObj = $$props.componentObj;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
    			// Update history.scrollRestoration depending on restoreScrollState
    			history.scrollRestoration = restoreScrollState ? 'manual' : 'auto';
    		}
    	};

    	return [
    		component,
    		componentParams,
    		props,
    		routes,
    		prefix,
    		restoreScrollState,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$b.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get restoreScrollState() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set restoreScrollState(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Components\Navbar.svelte generated by Svelte v3.48.0 */
    const file$8 = "src\\Components\\Navbar.svelte";

    function create_fragment$a(ctx) {
    	let div17;
    	let div12;
    	let p;
    	let t1;
    	let div3;
    	let div0;
    	let a0;
    	let t3;
    	let div1;
    	let a1;
    	let t5;
    	let div2;
    	let a2;
    	let t7;
    	let div11;
    	let div7;
    	let div4;
    	let t8;
    	let div5;
    	let t9;
    	let div6;
    	let t10;
    	let div10;
    	let div8;
    	let t11;
    	let div9;
    	let t12;
    	let div16;
    	let div13;
    	let a3;
    	let t14;
    	let div14;
    	let a4;
    	let t16;
    	let div15;
    	let a5;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div17 = element("div");
    			div12 = element("div");
    			p = element("p");
    			p.textContent = "Welcome.";
    			t1 = space();
    			div3 = element("div");
    			div0 = element("div");
    			a0 = element("a");
    			a0.textContent = "about me";
    			t3 = space();
    			div1 = element("div");
    			a1 = element("a");
    			a1.textContent = "my work";
    			t5 = space();
    			div2 = element("div");
    			a2 = element("a");
    			a2.textContent = "get in touch";
    			t7 = space();
    			div11 = element("div");
    			div7 = element("div");
    			div4 = element("div");
    			t8 = space();
    			div5 = element("div");
    			t9 = space();
    			div6 = element("div");
    			t10 = space();
    			div10 = element("div");
    			div8 = element("div");
    			t11 = space();
    			div9 = element("div");
    			t12 = space();
    			div16 = element("div");
    			div13 = element("div");
    			a3 = element("a");
    			a3.textContent = "about me";
    			t14 = space();
    			div14 = element("div");
    			a4 = element("a");
    			a4.textContent = "my work";
    			t16 = space();
    			div15 = element("div");
    			a5 = element("a");
    			a5.textContent = "get in touch";
    			attr_dev(p, "class", "svelte-e8owje");
    			add_location(p, file$8, 15, 8, 398);
    			attr_dev(a0, "href", "/personal");
    			attr_dev(a0, "class", "h2 svelte-e8owje");
    			add_location(a0, file$8, 18, 16, 497);
    			attr_dev(div0, "class", "highlight svelte-e8owje");
    			add_location(div0, file$8, 17, 12, 457);
    			attr_dev(a1, "href", "/MyWork");
    			attr_dev(a1, "class", "h2 svelte-e8owje");
    			add_location(a1, file$8, 21, 16, 621);
    			attr_dev(div1, "class", "highlight svelte-e8owje");
    			add_location(div1, file$8, 20, 12, 581);
    			attr_dev(a2, "href", "/personal");
    			attr_dev(a2, "class", "h2 svelte-e8owje");
    			add_location(a2, file$8, 24, 16, 742);
    			attr_dev(div2, "class", "highlight svelte-e8owje");
    			add_location(div2, file$8, 23, 12, 702);
    			attr_dev(div3, "class", "elements svelte-e8owje");
    			add_location(div3, file$8, 16, 8, 422);
    			attr_dev(div4, "class", "b1 svelte-e8owje");
    			add_location(div4, file$8, 29, 16, 921);
    			attr_dev(div5, "class", "b1 svelte-e8owje");
    			add_location(div5, file$8, 30, 16, 960);
    			attr_dev(div6, "class", "b1 svelte-e8owje");
    			add_location(div6, file$8, 31, 16, 999);
    			add_location(div7, file$8, 28, 12, 899);
    			attr_dev(div8, "class", "b2");
    			add_location(div8, file$8, 34, 16, 1089);
    			attr_dev(div9, "class", "b3");
    			add_location(div9, file$8, 35, 16, 1128);
    			attr_dev(div10, "class", "cross svelte-e8owje");
    			add_location(div10, file$8, 33, 12, 1053);
    			attr_dev(div11, "class", "burgerHolder svelte-e8owje");
    			add_location(div11, file$8, 27, 8, 841);
    			attr_dev(div12, "class", "leftNav svelte-e8owje");
    			add_location(div12, file$8, 14, 4, 368);
    			attr_dev(a3, "href", "/personal");
    			attr_dev(a3, "class", "h2 svelte-e8owje");
    			add_location(a3, file$8, 41, 12, 1275);
    			attr_dev(div13, "class", "highlight1 svelte-e8owje");
    			add_location(div13, file$8, 40, 8, 1238);
    			attr_dev(a4, "href", "/MyWork");
    			attr_dev(a4, "class", "h2 svelte-e8owje");
    			add_location(a4, file$8, 44, 12, 1388);
    			attr_dev(div14, "class", "highlight1 svelte-e8owje");
    			add_location(div14, file$8, 43, 8, 1351);
    			attr_dev(a5, "href", "/personal");
    			attr_dev(a5, "class", "h2 svelte-e8owje");
    			add_location(a5, file$8, 47, 12, 1498);
    			attr_dev(div15, "class", "highlight1 svelte-e8owje");
    			add_location(div15, file$8, 46, 8, 1461);
    			attr_dev(div16, "class", "mobileHighlight svelte-e8owje");
    			add_location(div16, file$8, 39, 4, 1200);
    			attr_dev(div17, "class", "navbar svelte-e8owje");
    			add_location(div17, file$8, 13, 0, 343);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div17, anchor);
    			append_dev(div17, div12);
    			append_dev(div12, p);
    			append_dev(div12, t1);
    			append_dev(div12, div3);
    			append_dev(div3, div0);
    			append_dev(div0, a0);
    			append_dev(div3, t3);
    			append_dev(div3, div1);
    			append_dev(div1, a1);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div2, a2);
    			append_dev(div12, t7);
    			append_dev(div12, div11);
    			append_dev(div11, div7);
    			append_dev(div7, div4);
    			append_dev(div7, t8);
    			append_dev(div7, div5);
    			append_dev(div7, t9);
    			append_dev(div7, div6);
    			append_dev(div11, t10);
    			append_dev(div11, div10);
    			append_dev(div10, div8);
    			append_dev(div10, t11);
    			append_dev(div10, div9);
    			append_dev(div17, t12);
    			append_dev(div17, div16);
    			append_dev(div16, div13);
    			append_dev(div13, a3);
    			append_dev(div16, t14);
    			append_dev(div16, div14);
    			append_dev(div14, a4);
    			append_dev(div16, t16);
    			append_dev(div16, div15);
    			append_dev(div15, a5);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(link.call(null, a0)),
    					action_destroyer(link.call(null, a1)),
    					action_destroyer(link.call(null, a2)),
    					listen_dev(div11, "click", /*clicked*/ ctx[0], false, false, false),
    					action_destroyer(link.call(null, a3)),
    					action_destroyer(link.call(null, a4)),
    					action_destroyer(link.call(null, a5))
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div17);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Navbar', slots, []);
    	let flag = false;

    	const clicked = () => {
    		flag = !flag;

    		if (flag) {
    			document.querySelector(".mobileHighlight").style.display = "flex";
    		} else {
    			document.querySelector(".mobileHighlight").style.display = "none";
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Navbar> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ link, flag, clicked });

    	$$self.$inject_state = $$props => {
    		if ('flag' in $$props) flag = $$props.flag;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [clicked];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src\Components\Utils\Button.svelte generated by Svelte v3.48.0 */
    const file$7 = "src\\Components\\Utils\\Button.svelte";

    function create_fragment$9(ctx) {
    	let div1;
    	let div0;
    	let input;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			input = element("input");
    			attr_dev(input, "type", "button");
    			attr_dev(input, "target", "_blank");
    			input.value = "see it";
    			attr_dev(input, "class", "btn svelte-d8de5z");
    			attr_dev(input, "onclick", /*add2*/ ctx[0]);
    			add_location(input, file$7, 8, 12, 199);
    			attr_dev(div0, "class", "btnBack svelte-d8de5z");
    			add_location(div0, file$7, 7, 4, 165);
    			attr_dev(div1, "class", "btnContainer svelte-d8de5z");
    			add_location(div1, file$7, 6, 0, 134);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, input);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Button', slots, []);
    	let { linkAdd } = $$props;
    	const add2 = `window.open('${linkAdd}')`;
    	const writable_props = ['linkAdd'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('linkAdd' in $$props) $$invalidate(1, linkAdd = $$props.linkAdd);
    	};

    	$$self.$capture_state = () => ({ link, linkAdd, add2 });

    	$$self.$inject_state = $$props => {
    		if ('linkAdd' in $$props) $$invalidate(1, linkAdd = $$props.linkAdd);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [add2, linkAdd];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { linkAdd: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*linkAdd*/ ctx[1] === undefined && !('linkAdd' in props)) {
    			console.warn("<Button> was created without expected prop 'linkAdd'");
    		}
    	}

    	get linkAdd() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set linkAdd(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Components\Hero.svelte generated by Svelte v3.48.0 */
    const file$6 = "src\\Components\\Hero.svelte";

    function create_fragment$8(ctx) {
    	let div7;
    	let h1;
    	let t0;
    	let br0;
    	let t1;
    	let div2;
    	let div0;
    	let t2;
    	let div1;
    	let t4;
    	let br1;
    	let t5;
    	let div4;
    	let div3;
    	let t7;
    	let p;
    	let t9;
    	let div5;
    	let button;
    	let t10;
    	let div6;
    	let current;
    	button = new Button({ props: { link: "/" }, $$inline: true });

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			h1 = element("h1");
    			t0 = text("Hi, I'm Yati Rastogi,");
    			br0 = element("br");
    			t1 = space();
    			div2 = element("div");
    			div0 = element("div");
    			t2 = space();
    			div1 = element("div");
    			div1.textContent = "Web Designer";
    			t4 = text(" and ");
    			br1 = element("br");
    			t5 = space();
    			div4 = element("div");
    			div3 = element("div");
    			div3.textContent = "Web Developer";
    			t7 = space();
    			p = element("p");
    			p.textContent = "I design and build websites for businesses around the globe. If you need a modern and powerful website, send me an email. If we are a good fit, I will give you a time and cost estimate.";
    			t9 = space();
    			div5 = element("div");
    			create_component(button.$$.fragment);
    			t10 = space();
    			div6 = element("div");
    			div6.textContent = "SCROLL";
    			add_location(br0, file$6, 6, 29, 124);
    			attr_dev(div0, "class", "spanColor svelte-lexbn");
    			add_location(div0, file$6, 8, 12, 170);
    			attr_dev(div1, "class", "text svelte-lexbn");
    			add_location(div1, file$6, 9, 12, 207);
    			attr_dev(div2, "class", "span svelte-lexbn");
    			add_location(div2, file$6, 7, 8, 139);
    			add_location(br1, file$6, 10, 19, 263);
    			attr_dev(div3, "class", "h2 svelte-lexbn");
    			add_location(div3, file$6, 12, 12, 314);
    			attr_dev(div4, "class", "highlight svelte-lexbn");
    			add_location(div4, file$6, 11, 8, 278);
    			attr_dev(h1, "class", "svelte-lexbn");
    			add_location(h1, file$6, 5, 4, 90);
    			attr_dev(p, "class", "svelte-lexbn");
    			add_location(p, file$6, 15, 4, 379);
    			attr_dev(div5, "class", "btn svelte-lexbn");
    			add_location(div5, file$6, 18, 5, 591);
    			attr_dev(div6, "class", "scrollLabel svelte-lexbn");
    			add_location(div6, file$6, 21, 4, 654);
    			attr_dev(div7, "class", "main svelte-lexbn");
    			add_location(div7, file$6, 4, 0, 67);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, h1);
    			append_dev(h1, t0);
    			append_dev(h1, br0);
    			append_dev(h1, t1);
    			append_dev(h1, div2);
    			append_dev(div2, div0);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(h1, t4);
    			append_dev(h1, br1);
    			append_dev(h1, t5);
    			append_dev(h1, div4);
    			append_dev(div4, div3);
    			append_dev(div7, t7);
    			append_dev(div7, p);
    			append_dev(div7, t9);
    			append_dev(div7, div5);
    			mount_component(button, div5, null);
    			append_dev(div7, t10);
    			append_dev(div7, div6);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Hero', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Hero> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Button });
    	return [];
    }

    class Hero extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Hero",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\Components\Utils\Card.svelte generated by Svelte v3.48.0 */

    const { console: console_1 } = globals;
    const file$5 = "src\\Components\\Utils\\Card.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (8:4) {#each answer as a}
    function create_each_block(ctx) {
    	let div;
    	let p;
    	let t0_value = /*a*/ ctx[1] + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			add_location(p, file$5, 9, 8, 164);
    			attr_dev(div, "class", "card svelte-1qbuzfe");
    			add_location(div, file$5, 8, 4, 137);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, t0);
    			append_dev(div, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*answer*/ 1 && t0_value !== (t0_value = /*a*/ ctx[1] + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(8:4) {#each answer as a}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div;
    	let each_value = /*answer*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(div, file$5, 6, 0, 103);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*answer*/ 1) {
    				each_value = /*answer*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Card', slots, []);
    	let { answer } = $$props;
    	console.log(answer);
    	const writable_props = ['answer'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Card> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('answer' in $$props) $$invalidate(0, answer = $$props.answer);
    	};

    	$$self.$capture_state = () => ({ Body, answer });

    	$$self.$inject_state = $$props => {
    		if ('answer' in $$props) $$invalidate(0, answer = $$props.answer);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [answer];
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { answer: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*answer*/ ctx[0] === undefined && !('answer' in props)) {
    			console_1.warn("<Card> was created without expected prop 'answer'");
    		}
    	}

    	get answer() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set answer(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Components\Utils\BodyHelperComp.svelte generated by Svelte v3.48.0 */
    const file$4 = "src\\Components\\Utils\\BodyHelperComp.svelte";

    function create_fragment$6(ctx) {
    	let h1;
    	let t0;
    	let t1;
    	let div4;
    	let div2;
    	let div0;
    	let card;
    	let t2;
    	let p;
    	let t3;
    	let t4;
    	let div1;
    	let button;
    	let t5;
    	let div3;
    	let img;
    	let img_src_value;
    	let current;

    	card = new Card({
    			props: { answer: /*answer*/ ctx[4] },
    			$$inline: true
    		});

    	button = new Button({
    			props: { linkAdd: /*link*/ ctx[3] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t0 = text(/*websiteName*/ ctx[0]);
    			t1 = space();
    			div4 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			create_component(card.$$.fragment);
    			t2 = space();
    			p = element("p");
    			t3 = text(/*description*/ ctx[1]);
    			t4 = space();
    			div1 = element("div");
    			create_component(button.$$.fragment);
    			t5 = space();
    			div3 = element("div");
    			img = element("img");
    			attr_dev(h1, "class", "svelte-wq7ngu");
    			add_location(h1, file$4, 10, 0, 220);
    			attr_dev(div0, "class", "card svelte-wq7ngu");
    			add_location(div0, file$4, 13, 12, 307);
    			attr_dev(p, "class", "p2 svelte-wq7ngu");
    			add_location(p, file$4, 16, 12, 397);
    			attr_dev(div1, "class", "btn svelte-wq7ngu");
    			add_location(div1, file$4, 17, 12, 441);
    			attr_dev(div2, "class", "left svelte-wq7ngu");
    			add_location(div2, file$4, 12, 8, 276);
    			if (!src_url_equal(img.src, img_src_value = /*image*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "img svelte-wq7ngu");
    			attr_dev(img, "alt", "right-view");
    			add_location(img, file$4, 22, 12, 574);
    			attr_dev(div3, "class", "right svelte-wq7ngu");
    			add_location(div3, file$4, 21, 8, 542);
    			attr_dev(div4, "class", "mainHolder svelte-wq7ngu");
    			add_location(div4, file$4, 11, 0, 243);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div2);
    			append_dev(div2, div0);
    			mount_component(card, div0, null);
    			append_dev(div2, t2);
    			append_dev(div2, p);
    			append_dev(p, t3);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			mount_component(button, div1, null);
    			append_dev(div4, t5);
    			append_dev(div4, div3);
    			append_dev(div3, img);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*websiteName*/ 1) set_data_dev(t0, /*websiteName*/ ctx[0]);
    			const card_changes = {};
    			if (dirty & /*answer*/ 16) card_changes.answer = /*answer*/ ctx[4];
    			card.$set(card_changes);
    			if (!current || dirty & /*description*/ 2) set_data_dev(t3, /*description*/ ctx[1]);
    			const button_changes = {};
    			if (dirty & /*link*/ 8) button_changes.linkAdd = /*link*/ ctx[3];
    			button.$set(button_changes);

    			if (!current || dirty & /*image*/ 4 && !src_url_equal(img.src, img_src_value = /*image*/ ctx[2])) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div4);
    			destroy_component(card);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('BodyHelperComp', slots, []);
    	let { websiteName } = $$props;
    	let { description } = $$props;
    	let { image } = $$props;
    	let { link } = $$props;
    	let { answer } = $$props;
    	const writable_props = ['websiteName', 'description', 'image', 'link', 'answer'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<BodyHelperComp> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('websiteName' in $$props) $$invalidate(0, websiteName = $$props.websiteName);
    		if ('description' in $$props) $$invalidate(1, description = $$props.description);
    		if ('image' in $$props) $$invalidate(2, image = $$props.image);
    		if ('link' in $$props) $$invalidate(3, link = $$props.link);
    		if ('answer' in $$props) $$invalidate(4, answer = $$props.answer);
    	};

    	$$self.$capture_state = () => ({
    		Button,
    		Card,
    		websiteName,
    		description,
    		image,
    		link,
    		answer
    	});

    	$$self.$inject_state = $$props => {
    		if ('websiteName' in $$props) $$invalidate(0, websiteName = $$props.websiteName);
    		if ('description' in $$props) $$invalidate(1, description = $$props.description);
    		if ('image' in $$props) $$invalidate(2, image = $$props.image);
    		if ('link' in $$props) $$invalidate(3, link = $$props.link);
    		if ('answer' in $$props) $$invalidate(4, answer = $$props.answer);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [websiteName, description, image, link, answer];
    }

    class BodyHelperComp extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			websiteName: 0,
    			description: 1,
    			image: 2,
    			link: 3,
    			answer: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BodyHelperComp",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*websiteName*/ ctx[0] === undefined && !('websiteName' in props)) {
    			console.warn("<BodyHelperComp> was created without expected prop 'websiteName'");
    		}

    		if (/*description*/ ctx[1] === undefined && !('description' in props)) {
    			console.warn("<BodyHelperComp> was created without expected prop 'description'");
    		}

    		if (/*image*/ ctx[2] === undefined && !('image' in props)) {
    			console.warn("<BodyHelperComp> was created without expected prop 'image'");
    		}

    		if (/*link*/ ctx[3] === undefined && !('link' in props)) {
    			console.warn("<BodyHelperComp> was created without expected prop 'link'");
    		}

    		if (/*answer*/ ctx[4] === undefined && !('answer' in props)) {
    			console.warn("<BodyHelperComp> was created without expected prop 'answer'");
    		}
    	}

    	get websiteName() {
    		throw new Error("<BodyHelperComp>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set websiteName(value) {
    		throw new Error("<BodyHelperComp>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get description() {
    		throw new Error("<BodyHelperComp>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set description(value) {
    		throw new Error("<BodyHelperComp>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get image() {
    		throw new Error("<BodyHelperComp>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set image(value) {
    		throw new Error("<BodyHelperComp>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get link() {
    		throw new Error("<BodyHelperComp>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set link(value) {
    		throw new Error("<BodyHelperComp>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get answer() {
    		throw new Error("<BodyHelperComp>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set answer(value) {
    		throw new Error("<BodyHelperComp>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Components\myWork.svelte generated by Svelte v3.48.0 */

    function create_fragment$5(ctx) {
    	let bodyhelpercomp0;
    	let t0;
    	let bodyhelpercomp1;
    	let t1;
    	let bodyhelpercomp2;
    	let t2;
    	let bodyhelpercomp3;
    	let t3;
    	let bodyhelpercomp4;
    	let current;

    	bodyhelpercomp0 = new BodyHelperComp({
    			props: {
    				description: "A social media platform similar to Facebook and Instagram allowing users to follow,unfollow , view latest posts of other users, upload posts and cover and profile picture.",
    				websiteName: "SocialHub",
    				answer: ["web design", "react", "express js", "mongoDB", "nodeJS"],
    				image: "https://i.postimg.cc/Wb7d35zk/s1.png",
    				link: "https://github.com/yatirastogi/Social_Hub"
    			},
    			$$inline: true
    		});

    	bodyhelpercomp1 = new BodyHelperComp({
    			props: {
    				description: "This website was designed and developed all by myself, OnlineLibrary allows users to upload their books for rent on this platform along with their cost. Users can also search for people renting out books or a specific book near their prefered location",
    				websiteName: "OnlineLibrary",
    				answer: ["web design", "react", "express js", "mongoDB", "nodeJS"],
    				image: "https://i.postimg.cc/wTjr2TXL/archetecia-Mac.png'",
    				link: "https://github.com/yatirastogi/OnlineLibrary"
    			},
    			$$inline: true
    		});

    	bodyhelpercomp2 = new BodyHelperComp({
    			props: {
    				description: "In collaboration with my friend Adarsh Singh it was possibele to make this website for a company he was freelancing to, Dwellingo is a Real Estate Developer providing design-centered, serviced-home experiences to working professionals, students & seniors.",
    				websiteName: "Portfolio",
    				answer: ["web design", "Svelte"],
    				image: "https://i.postimg.cc/KzNbWG0L/dwellingo-Mac.png",
    				link: "https://www.dwellingo.in/"
    			},
    			$$inline: true
    		});

    	bodyhelpercomp3 = new BodyHelperComp({
    			props: {
    				description: "This website was designed and developed all by myself, Cosy Basket is a imaginary Stylist firm which deals with selling designer cloths",
    				websiteName: "Cosy Basket",
    				answer: ["web design", "vanila js"],
    				image: "https://i.postimg.cc/dV5wntSy/cosyMac.png",
    				link: "https://cosy-basket-e-com.pages.dev/"
    			},
    			$$inline: true
    		});

    	bodyhelpercomp4 = new BodyHelperComp({
    			props: {
    				description: "Developed using react, just here to demonstrate API integration",
    				websiteName: "Covid tracker",
    				answer: ["web design", "vanila js"],
    				image: "https://i.postimg.cc/g2gLRpVM/covid-Tracker-Mac.png",
    				link: "https://covid-tracker-react-js.pages.dev/"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(bodyhelpercomp0.$$.fragment);
    			t0 = space();
    			create_component(bodyhelpercomp1.$$.fragment);
    			t1 = space();
    			create_component(bodyhelpercomp2.$$.fragment);
    			t2 = space();
    			create_component(bodyhelpercomp3.$$.fragment);
    			t3 = space();
    			create_component(bodyhelpercomp4.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(bodyhelpercomp0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(bodyhelpercomp1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(bodyhelpercomp2, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(bodyhelpercomp3, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(bodyhelpercomp4, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(bodyhelpercomp0.$$.fragment, local);
    			transition_in(bodyhelpercomp1.$$.fragment, local);
    			transition_in(bodyhelpercomp2.$$.fragment, local);
    			transition_in(bodyhelpercomp3.$$.fragment, local);
    			transition_in(bodyhelpercomp4.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(bodyhelpercomp0.$$.fragment, local);
    			transition_out(bodyhelpercomp1.$$.fragment, local);
    			transition_out(bodyhelpercomp2.$$.fragment, local);
    			transition_out(bodyhelpercomp3.$$.fragment, local);
    			transition_out(bodyhelpercomp4.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(bodyhelpercomp0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(bodyhelpercomp1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(bodyhelpercomp2, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(bodyhelpercomp3, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(bodyhelpercomp4, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('MyWork', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<MyWork> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ BodyHelperComp, link });
    	return [];
    }

    class MyWork extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MyWork",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\Components\Body.svelte generated by Svelte v3.48.0 */
    const file$3 = "src\\Components\\Body.svelte";

    function create_fragment$4(ctx) {
    	let p;
    	let t1;
    	let mywork;
    	let current;
    	mywork = new MyWork({ $$inline: true });

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "LATEST WORK";
    			t1 = space();
    			create_component(mywork.$$.fragment);
    			attr_dev(p, "class", "p1 svelte-gzb3ps");
    			add_location(p, file$3, 4, 0, 62);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(mywork, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(mywork.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(mywork.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t1);
    			destroy_component(mywork, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Body', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Body> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ MyWork });
    	return [];
    }

    class Body extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Body",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\Components\Main.svelte generated by Svelte v3.48.0 */
    const file$2 = "src\\Components\\Main.svelte";

    function create_fragment$3(ctx) {
    	let main;
    	let navbar;
    	let t0;
    	let hero;
    	let t1;
    	let body;
    	let current;
    	navbar = new Navbar({ $$inline: true });
    	hero = new Hero({ $$inline: true });
    	body = new Body({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(navbar.$$.fragment);
    			t0 = space();
    			create_component(hero.$$.fragment);
    			t1 = space();
    			create_component(body.$$.fragment);
    			add_location(main, file$2, 6, 0, 135);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(navbar, main, null);
    			append_dev(main, t0);
    			mount_component(hero, main, null);
    			append_dev(main, t1);
    			mount_component(body, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(hero.$$.fragment, local);
    			transition_in(body.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(hero.$$.fragment, local);
    			transition_out(body.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(navbar);
    			destroy_component(hero);
    			destroy_component(body);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Main', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Main> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Navbar, Hero, Body });
    	return [];
    }

    class Main extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Main",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\Components\Personal.svelte generated by Svelte v3.48.0 */

    const file$1 = "src\\Components\\Personal.svelte";

    function create_fragment$2(ctx) {
    	let div18;
    	let div2;
    	let div1;
    	let div0;
    	let h1;
    	let t1;
    	let img0;
    	let img0_src_value;
    	let t2;
    	let h2;
    	let t3;
    	let span0;
    	let t5;
    	let t6;
    	let h30;
    	let span1;
    	let t8;
    	let img1;
    	let img1_src_value;
    	let t9;
    	let span2;
    	let a0;
    	let t11;
    	let img2;
    	let img2_src_value;
    	let t12;
    	let section0;
    	let h31;
    	let t14;
    	let div5;
    	let p0;
    	let t15;
    	let a1;
    	let t17;
    	let t18;
    	let p1;
    	let t20;
    	let p2;
    	let t22;
    	let div4;
    	let div3;
    	let img3;
    	let img3_src_value;
    	let t23;
    	let img4;
    	let img4_src_value;
    	let t24;
    	let p3;
    	let t26;
    	let section1;
    	let diV;
    	let t28;
    	let div6;
    	let h32;
    	let t30;
    	let p4;
    	let t31;
    	let br0;
    	let t32;
    	let br1;
    	let t33;
    	let br2;
    	let t34;
    	let t35;
    	let div7;
    	let h33;
    	let t37;
    	let p5;
    	let t38;
    	let br3;
    	let t39;
    	let br4;
    	let t40;
    	let br5;
    	let t41;
    	let br6;
    	let t42;
    	let t43;
    	let div8;
    	let h34;
    	let t45;
    	let p6;
    	let t46;
    	let br7;
    	let t47;
    	let br8;
    	let t48;
    	let br9;
    	let t49;
    	let br10;
    	let t50;
    	let t51;
    	let section2;
    	let h35;
    	let t53;
    	let div15;
    	let div10;
    	let div9;
    	let h36;
    	let p7;
    	let p8;
    	let br11;
    	let t57;
    	let div12;
    	let div11;
    	let h37;
    	let p9;
    	let p10;
    	let br12;
    	let t61;
    	let div14;
    	let div13;
    	let h38;
    	let p11;
    	let p12;
    	let br13;
    	let t65;
    	let div17;
    	let a2;
    	let t67;
    	let div16;
    	let img5;
    	let img5_src_value;
    	let t68;
    	let img6;
    	let img6_src_value;

    	const block = {
    		c: function create() {
    			div18 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Hello!";
    			t1 = space();
    			img0 = element("img");
    			t2 = space();
    			h2 = element("h2");
    			t3 = text("I'm\n            ");
    			span0 = element("span");
    			span0.textContent = "Yati Rastogi";
    			t5 = text(", a FullStack web developer focused on building beautiful interfaces & experiences right from scratch");
    			t6 = space();
    			h30 = element("h3");
    			span1 = element("span");
    			span1.textContent = "Contact Me";
    			t8 = space();
    			img1 = element("img");
    			t9 = space();
    			span2 = element("span");
    			a0 = element("a");
    			a0.textContent = "yatirastogi1739@gmail.com";
    			t11 = space();
    			img2 = element("img");
    			t12 = space();
    			section0 = element("section");
    			h31 = element("h3");
    			h31.textContent = "BACKGROUND";
    			t14 = space();
    			div5 = element("div");
    			p0 = element("p");
    			t15 = text("I am studying in ");
    			a1 = element("a");
    			a1.textContent = "Vellore institute of technology";
    			t17 = text(", Vellore.");
    			t18 = space();
    			p1 = element("p");
    			p1.textContent = "As a software engineer, I enjoy bridging the gap between engineering and design — combining my technical knowledge to create a beautiful product. My goal is to always build applications that are scalable and efficient under the hood while providing engaging, pixel-perfect user experiences.";
    			t20 = space();
    			p2 = element("p");
    			p2.textContent = "I'm a decent level coder having strong hold on C++, I love solving problems to keep learning new stuff..";
    			t22 = space();
    			div4 = element("div");
    			div3 = element("div");
    			img3 = element("img");
    			t23 = space();
    			img4 = element("img");
    			t24 = space();
    			p3 = element("p");
    			p3.textContent = "Currently seeking full-time opportunities!";
    			t26 = space();
    			section1 = element("section");
    			diV = element("diV");
    			diV.textContent = "SKILLS";
    			t28 = space();
    			div6 = element("div");
    			h32 = element("h3");
    			h32.textContent = "LANGUAGES";
    			t30 = space();
    			p4 = element("p");
    			t31 = text("C++");
    			br0 = element("br");
    			t32 = text("\n            JavaScript");
    			br1 = element("br");
    			t33 = text("\n            SQL");
    			br2 = element("br");
    			t34 = text("\n            ElectronJS");
    			t35 = space();
    			div7 = element("div");
    			h33 = element("h3");
    			h33.textContent = "FRAMEWORKS";
    			t37 = space();
    			p5 = element("p");
    			t38 = text("React");
    			br3 = element("br");
    			t39 = text("\n                Svelte");
    			br4 = element("br");
    			t40 = text("\n                NodeJS/Express");
    			br5 = element("br");
    			t41 = text("\n                Bootstrap");
    			br6 = element("br");
    			t42 = text("\n                JQuery");
    			t43 = space();
    			div8 = element("div");
    			h34 = element("h3");
    			h34.textContent = "TOOLS";
    			t45 = space();
    			p6 = element("p");
    			t46 = text("Git & Github");
    			br7 = element("br");
    			t47 = text("\n                VS Code");
    			br8 = element("br");
    			t48 = text("\n                Postman");
    			br9 = element("br");
    			t49 = text("\n                Figma");
    			br10 = element("br");
    			t50 = text("\n                MongoDB");
    			t51 = space();
    			section2 = element("section");
    			h35 = element("h3");
    			h35.textContent = "EXPERIENCE";
    			t53 = space();
    			div15 = element("div");
    			div10 = element("div");
    			div9 = element("div");
    			h36 = element("h3");
    			h36.textContent = "Holistic Group";
    			p7 = element("p");
    			p7.textContent = "Full Stack delveloper";
    			p8 = element("p");
    			p8.textContent = "August 2021 - October 2021";
    			br11 = element("br");
    			t57 = space();
    			div12 = element("div");
    			div11 = element("div");
    			h37 = element("h3");
    			h37.textContent = "IOTAgi";
    			p9 = element("p");
    			p9.textContent = "Lead Web delveloper";
    			p10 = element("p");
    			p10.textContent = "July 2021 - August 2021";
    			br12 = element("br");
    			t61 = space();
    			div14 = element("div");
    			div13 = element("div");
    			h38 = element("h3");
    			h38.textContent = "Protal";
    			p11 = element("p");
    			p11.textContent = "Frontend Web delveloper";
    			p12 = element("p");
    			p12.textContent = "May 2021 - June 2021";
    			br13 = element("br");
    			t65 = space();
    			div17 = element("div");
    			a2 = element("a");
    			a2.textContent = "View my resume";
    			t67 = space();
    			div16 = element("div");
    			img5 = element("img");
    			t68 = space();
    			img6 = element("img");
    			attr_dev(h1, "class", "svelte-62m881");
    			add_location(h1, file$1, 12, 16, 294);
    			if (!src_url_equal(img0.src, img0_src_value = /*hand*/ ctx[0])) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "hand wave");
    			attr_dev(img0, "class", "emoji svelte-62m881");
    			add_location(img0, file$1, 13, 16, 326);
    			attr_dev(div0, "class", "intro__hello svelte-62m881");
    			add_location(div0, file$1, 11, 12, 251);
    			attr_dev(span0, "class", "name svelte-62m881");
    			add_location(span0, file$1, 16, 12, 460);
    			attr_dev(h2, "class", "intro__tagline svelte-62m881");
    			add_location(h2, file$1, 15, 12, 417);
    			add_location(span1, file$1, 19, 12, 680);
    			if (!src_url_equal(img1.src, img1_src_value = /*pointHand*/ ctx[1])) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "right_hand_pointing");
    			attr_dev(img1, "class", "right_hand svelte-62m881");
    			add_location(img1, file$1, 20, 12, 716);
    			attr_dev(a0, "rel", "noreferrer");
    			attr_dev(a0, "href", "mailto:yatirastogi1739@gmail.com");
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "class", "highlight-link svelte-62m881");
    			add_location(a0, file$1, 22, 16, 819);
    			add_location(span2, file$1, 21, 12, 796);
    			attr_dev(h30, "class", "intro__contact svelte-62m881");
    			add_location(h30, file$1, 18, 12, 640);
    			attr_dev(div1, "class", "me svelte-62m881");
    			add_location(div1, file$1, 10, 8, 222);
    			if (!src_url_equal(img2.src, img2_src_value = /*me*/ ctx[3])) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "my_picture");
    			attr_dev(img2, "class", "svelte-62m881");
    			add_location(img2, file$1, 26, 8, 1010);
    			attr_dev(div2, "class", "head svelte-62m881");
    			add_location(div2, file$1, 9, 4, 195);
    			add_location(h31, file$1, 29, 8, 1098);
    			attr_dev(a1, "href", "https://vit.ac.in/");
    			attr_dev(a1, "target", "_");
    			attr_dev(a1, "class", "svelte-62m881");
    			add_location(a1, file$1, 31, 32, 1180);
    			attr_dev(p0, "class", "svelte-62m881");
    			add_location(p0, file$1, 31, 12, 1160);
    			attr_dev(p1, "class", "svelte-62m881");
    			add_location(p1, file$1, 32, 12, 1282);
    			attr_dev(p2, "class", "svelte-62m881");
    			add_location(p2, file$1, 35, 12, 1622);
    			if (!src_url_equal(img3.src, img3_src_value = /*right*/ ctx[2])) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "right");
    			attr_dev(img3, "class", "right_arrow svelte-62m881");
    			add_location(img3, file$1, 38, 20, 1824);
    			if (!src_url_equal(img4.src, img4_src_value = /*right*/ ctx[2])) attr_dev(img4, "src", img4_src_value);
    			attr_dev(img4, "alt", "right");
    			attr_dev(img4, "class", "right_arrow rr2 svelte-62m881");
    			add_location(img4, file$1, 39, 20, 1895);
    			attr_dev(div3, "class", "arrows svelte-62m881");
    			add_location(div3, file$1, 37, 16, 1783);
    			attr_dev(p3, "class", "svelte-62m881");
    			add_location(p3, file$1, 41, 16, 1989);
    			attr_dev(div4, "class", "status svelte-62m881");
    			add_location(div4, file$1, 36, 12, 1746);
    			attr_dev(div5, "class", "my_info svelte-62m881");
    			add_location(div5, file$1, 30, 8, 1126);
    			attr_dev(section0, "class", "my_background svelte-62m881");
    			add_location(section0, file$1, 28, 4, 1058);
    			attr_dev(diV, "class", "skills svelte-62m881");
    			add_location(diV, file$1, 46, 8, 2133);
    			add_location(h32, file$1, 50, 12, 2236);
    			add_location(br0, file$1, 51, 18, 2273);
    			add_location(br1, file$1, 52, 22, 2300);
    			add_location(br2, file$1, 53, 15, 2320);
    			attr_dev(p4, "class", "svelte-62m881");
    			add_location(p4, file$1, 51, 12, 2267);
    			attr_dev(div6, "class", "languages_div svelte-62m881");
    			add_location(div6, file$1, 49, 8, 2196);
    			add_location(h33, file$1, 58, 12, 2428);
    			add_location(br3, file$1, 59, 20, 2468);
    			add_location(br4, file$1, 60, 22, 2495);
    			add_location(br5, file$1, 61, 30, 2530);
    			add_location(br6, file$1, 62, 25, 2560);
    			attr_dev(p5, "class", "svelte-62m881");
    			add_location(p5, file$1, 59, 12, 2460);
    			attr_dev(div7, "class", "framework_div svelte-62m881");
    			add_location(div7, file$1, 57, 8, 2388);
    			add_location(h34, file$1, 67, 12, 2664);
    			add_location(br7, file$1, 68, 27, 2706);
    			add_location(br8, file$1, 69, 23, 2734);
    			add_location(br9, file$1, 70, 23, 2762);
    			add_location(br10, file$1, 71, 21, 2788);
    			attr_dev(p6, "class", "svelte-62m881");
    			add_location(p6, file$1, 68, 12, 2691);
    			attr_dev(div8, "class", "tools_div svelte-62m881");
    			add_location(div8, file$1, 66, 8, 2628);
    			attr_dev(section1, "class", "skills_section svelte-62m881");
    			add_location(section1, file$1, 45, 4, 2092);
    			add_location(h35, file$1, 77, 8, 2913);
    			add_location(h36, file$1, 79, 36, 3002);
    			add_location(p7, file$1, 79, 59, 3025);
    			add_location(div9, file$1, 79, 31, 2997);
    			add_location(p8, file$1, 79, 93, 3059);
    			attr_dev(div10, "class", "exp_1 svelte-62m881");
    			add_location(div10, file$1, 79, 12, 2978);
    			add_location(br11, file$1, 79, 132, 3098);
    			add_location(h37, file$1, 80, 36, 3139);
    			add_location(p9, file$1, 80, 51, 3154);
    			add_location(div11, file$1, 80, 31, 3134);
    			add_location(p10, file$1, 80, 83, 3186);
    			attr_dev(div12, "class", "exp_2 svelte-62m881");
    			add_location(div12, file$1, 80, 12, 3115);
    			add_location(br12, file$1, 80, 119, 3222);
    			add_location(h38, file$1, 81, 36, 3263);
    			add_location(p11, file$1, 81, 51, 3278);
    			add_location(div13, file$1, 81, 31, 3258);
    			add_location(p12, file$1, 81, 87, 3314);
    			attr_dev(div14, "class", "exp_2 svelte-62m881");
    			add_location(div14, file$1, 81, 12, 3239);
    			add_location(br13, file$1, 81, 120, 3347);
    			attr_dev(div15, "class", "experience svelte-62m881");
    			add_location(div15, file$1, 78, 8, 2941);
    			attr_dev(section2, "class", "experience_section svelte-62m881");
    			add_location(section2, file$1, 76, 4, 2868);
    			attr_dev(a2, "href", "/images/resume.pdf");
    			attr_dev(a2, "target", "_blank");
    			attr_dev(a2, "class", "svelte-62m881");
    			add_location(a2, file$1, 86, 8, 3524);
    			if (!src_url_equal(img5.src, img5_src_value = /*right*/ ctx[2])) attr_dev(img5, "src", img5_src_value);
    			attr_dev(img5, "alt", "right");
    			attr_dev(img5, "class", "right_arrow svelte-62m881");
    			add_location(img5, file$1, 88, 12, 3633);
    			if (!src_url_equal(img6.src, img6_src_value = /*right*/ ctx[2])) attr_dev(img6, "src", img6_src_value);
    			attr_dev(img6, "alt", "right");
    			attr_dev(img6, "class", "right_arrow rr2 svelte-62m881");
    			add_location(img6, file$1, 89, 12, 3696);
    			attr_dev(div16, "class", "arrows ar1 svelte-62m881");
    			add_location(div16, file$1, 87, 8, 3596);
    			attr_dev(div17, "class", "resume svelte-62m881");
    			add_location(div17, file$1, 85, 4, 3494);
    			attr_dev(div18, "class", "intro");
    			add_location(div18, file$1, 8, 0, 171);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div18, anchor);
    			append_dev(div18, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, h1);
    			append_dev(div0, t1);
    			append_dev(div0, img0);
    			append_dev(div1, t2);
    			append_dev(div1, h2);
    			append_dev(h2, t3);
    			append_dev(h2, span0);
    			append_dev(h2, t5);
    			append_dev(div1, t6);
    			append_dev(div1, h30);
    			append_dev(h30, span1);
    			append_dev(h30, t8);
    			append_dev(h30, img1);
    			append_dev(h30, t9);
    			append_dev(h30, span2);
    			append_dev(span2, a0);
    			append_dev(div2, t11);
    			append_dev(div2, img2);
    			append_dev(div18, t12);
    			append_dev(div18, section0);
    			append_dev(section0, h31);
    			append_dev(section0, t14);
    			append_dev(section0, div5);
    			append_dev(div5, p0);
    			append_dev(p0, t15);
    			append_dev(p0, a1);
    			append_dev(p0, t17);
    			append_dev(div5, t18);
    			append_dev(div5, p1);
    			append_dev(div5, t20);
    			append_dev(div5, p2);
    			append_dev(div5, t22);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, img3);
    			append_dev(div3, t23);
    			append_dev(div3, img4);
    			append_dev(div4, t24);
    			append_dev(div4, p3);
    			append_dev(div18, t26);
    			append_dev(div18, section1);
    			append_dev(section1, diV);
    			append_dev(section1, t28);
    			append_dev(section1, div6);
    			append_dev(div6, h32);
    			append_dev(div6, t30);
    			append_dev(div6, p4);
    			append_dev(p4, t31);
    			append_dev(p4, br0);
    			append_dev(p4, t32);
    			append_dev(p4, br1);
    			append_dev(p4, t33);
    			append_dev(p4, br2);
    			append_dev(p4, t34);
    			append_dev(section1, t35);
    			append_dev(section1, div7);
    			append_dev(div7, h33);
    			append_dev(div7, t37);
    			append_dev(div7, p5);
    			append_dev(p5, t38);
    			append_dev(p5, br3);
    			append_dev(p5, t39);
    			append_dev(p5, br4);
    			append_dev(p5, t40);
    			append_dev(p5, br5);
    			append_dev(p5, t41);
    			append_dev(p5, br6);
    			append_dev(p5, t42);
    			append_dev(section1, t43);
    			append_dev(section1, div8);
    			append_dev(div8, h34);
    			append_dev(div8, t45);
    			append_dev(div8, p6);
    			append_dev(p6, t46);
    			append_dev(p6, br7);
    			append_dev(p6, t47);
    			append_dev(p6, br8);
    			append_dev(p6, t48);
    			append_dev(p6, br9);
    			append_dev(p6, t49);
    			append_dev(p6, br10);
    			append_dev(p6, t50);
    			append_dev(div18, t51);
    			append_dev(div18, section2);
    			append_dev(section2, h35);
    			append_dev(section2, t53);
    			append_dev(section2, div15);
    			append_dev(div15, div10);
    			append_dev(div10, div9);
    			append_dev(div9, h36);
    			append_dev(div9, p7);
    			append_dev(div10, p8);
    			append_dev(div15, br11);
    			append_dev(div15, t57);
    			append_dev(div15, div12);
    			append_dev(div12, div11);
    			append_dev(div11, h37);
    			append_dev(div11, p9);
    			append_dev(div12, p10);
    			append_dev(div15, br12);
    			append_dev(div15, t61);
    			append_dev(div15, div14);
    			append_dev(div14, div13);
    			append_dev(div13, h38);
    			append_dev(div13, p11);
    			append_dev(div14, p12);
    			append_dev(div15, br13);
    			append_dev(div18, t65);
    			append_dev(div18, div17);
    			append_dev(div17, a2);
    			append_dev(div17, t67);
    			append_dev(div17, div16);
    			append_dev(div16, img5);
    			append_dev(div16, t68);
    			append_dev(div16, img6);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div18);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Personal', slots, []);
    	let hand = "images/wave.png";
    	let pointHand = "images/pointright.png";
    	let right = "images/rightArrow.png";
    	let me = "images/ME.jpg";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Personal> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ hand, pointHand, right, me });

    	$$self.$inject_state = $$props => {
    		if ('hand' in $$props) $$invalidate(0, hand = $$props.hand);
    		if ('pointHand' in $$props) $$invalidate(1, pointHand = $$props.pointHand);
    		if ('right' in $$props) $$invalidate(2, right = $$props.right);
    		if ('me' in $$props) $$invalidate(3, me = $$props.me);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [hand, pointHand, right, me];
    }

    class Personal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Personal",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\Components\footer.svelte generated by Svelte v3.48.0 */
    const file = "src\\Components\\footer.svelte";

    function create_fragment$1(ctx) {
    	let div1;
    	let p;
    	let t0;
    	let br;
    	let t1;
    	let t2;
    	let div0;
    	let a0;
    	let t4;
    	let a1;
    	let t6;
    	let a2;
    	let t8;
    	let a3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			p = element("p");
    			t0 = text("Designed and developed by ");
    			br = element("br");
    			t1 = text(" Yati Rastogi ©️ 2022");
    			t2 = space();
    			div0 = element("div");
    			a0 = element("a");
    			a0.textContent = "EMAIL";
    			t4 = space();
    			a1 = element("a");
    			a1.textContent = "INSTAGRAM";
    			t6 = space();
    			a2 = element("a");
    			a2.textContent = "GITHUB";
    			t8 = space();
    			a3 = element("a");
    			a3.textContent = "LINKEDIN";
    			add_location(br, file, 5, 33, 117);
    			add_location(p, file, 5, 4, 88);
    			attr_dev(a0, "href", "mailto:yatirastogi1739@gmail.com");
    			attr_dev(a0, "class", "svelte-1fn3li4");
    			add_location(a0, file, 7, 8, 179);
    			attr_dev(a1, "href", "https://www.instagram.com/rastogi_yati/");
    			attr_dev(a1, "target", "_");
    			attr_dev(a1, "class", "svelte-1fn3li4");
    			add_location(a1, file, 9, 8, 257);
    			attr_dev(a2, "href", "https://github.com/yatirastogi");
    			attr_dev(a2, "target", "_");
    			attr_dev(a2, "class", "svelte-1fn3li4");
    			add_location(a2, file, 10, 8, 349);
    			attr_dev(a3, "href", "https://www.linkedin.com/in/yati-rastogi-a470571b3/");
    			attr_dev(a3, "target", "_");
    			attr_dev(a3, "class", "svelte-1fn3li4");
    			add_location(a3, file, 11, 8, 429);
    			attr_dev(div0, "class", "links svelte-1fn3li4");
    			add_location(div0, file, 6, 4, 151);
    			attr_dev(div1, "class", "footer svelte-1fn3li4");
    			add_location(div1, file, 4, 0, 63);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, p);
    			append_dev(p, t0);
    			append_dev(p, br);
    			append_dev(p, t1);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, a0);
    			append_dev(div0, t4);
    			append_dev(div0, a1);
    			append_dev(div0, t6);
    			append_dev(div0, a2);
    			append_dev(div0, t8);
    			append_dev(div0, a3);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(link.call(null, a0)),
    					action_destroyer(link.call(null, a1)),
    					action_destroyer(link.call(null, a2)),
    					action_destroyer(link.call(null, a3))
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Footer', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ link });
    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.48.0 */

    function create_fragment(ctx) {
    	let router;
    	let t;
    	let footer;
    	let current;

    	router = new Router({
    			props: {
    				routes: {
    					"/": Main,
    					"/personal": Personal,
    					"/MyWork": MyWork
    				}
    			},
    			$$inline: true
    		});

    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(router.$$.fragment);
    			t = space();
    			create_component(footer.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(router, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(router, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(footer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Router, Main, Personal, Footer, MyWork });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
