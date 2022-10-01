<script>
	import Router from "svelte-spa-router"
	import Main from "./Components/Main.svelte"
	import Personal from "./Components/Personal.svelte"
	import Footer from "./Components/footer.svelte"
	import MyWork from "./Components/myWork.svelte"
</script>

<Router routes={{
	"/" : Main, 
	"/personal" : Personal,
	"/MyWork" : MyWork,
}}/>

<Footer/>