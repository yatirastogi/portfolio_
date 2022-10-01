<script>
    import MyWork from "./myWork.svelte";
</script>

<p class="p1">LATEST WORK</p>
<MyWork/>

<style>
    .p1{
        margin-top: 30px;
        text-align: center;
        padding-left: 50px;
        font-size: 20px;
        font-weight: 600;
        letter-spacing: 1px;
        color: rgb(0, 0, 0);
    }
    @media screen and (max-width:1080px){
        .p1{
            padding: 0;
            margin-bottom: 30px;
        }
    }
</style>