<script>
import Body from "../Body.svelte";
    export let answer;
    console.log(answer);
</script>

<div>
    {#each answer as a}
    <div class="card">
        <p>{a}</p>
    </div>
    {/each}
</div>

<style>
    .card{
        display: inline-block;
        margin: 5px 10px;
        background-color:#f9efe7 ;
        padding: 3px 10px;
        font-size: 15px;
        font-family: 'montserrat';
    }
</style>