<script>
    import {link} from "svelte-spa-router"
</script>

<div class="footer">
    <p>Designed and developed by <br> Yati Rastogi ©️ 2022</p>
    <div class="links">
        <a use:link href='mailto:yatirastogi1739@gmail.com'>EMAIL</a>
       
        <a use:link href='https://www.instagram.com/rastogi_yati/' target='_'>INSTAGRAM</a>
        <a use:link href="https://github.com/yatirastogi" target='_'>GITHUB</a>
        <a use:link href="https://www.linkedin.com/in/yati-rastogi-a470571b3/" target='_'>LINKEDIN</a>
    </div>
</div>

<style>
    .footer{
        background-color: #f9efe7;
        padding: 50px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .links{
        display: flex;
    }
    .links a{
        color: black;
        text-decoration:none;
        padding: 10px;
        margin: 0 30px;
        font-family: 'montserrat';
        font-weight: 500;
        cursor:pointer;  
    }
    a:hover{
        color: rebeccapurple;
    }
    @media screen and (max-width:870px){
        .links{
        flex-direction: column;
    }
    }
</style>