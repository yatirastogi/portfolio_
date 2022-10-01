<script>
    import {link} from "svelte-spa-router";
    export let linkAdd;
    const add2 = `window.open('${linkAdd}')`;
</script>

<div class="btnContainer">
    <div class="btnBack">
            <input type='button' target="_blank" value='see it' class="btn" onclick={add2}/>
    </div>
</div>


<style>
     .btnContainer{
        position: relative;
        color: green;
        height: 60px;
        width: 200px;
    }
    .btnBack{
        position: absolute;
        top:0;
        right:0;
        height: 60px;
        width: 200px;
        border: 3px solid black;
    }
    .btn{
        position: absolute;
        font-family: 'montserrat';
        height: 60px;
        width: 200px;
        margin: 65px;
        top:-75px;
        left:-75px;
        outline: none;
        border: none;
        cursor: pointer;
        color: white;
        background-color: black;
        font-size: 20px;
        transition:all 0.2s
    }
    .btn:hover{
        top:-70px;
        left:-68px;
    }
</style>