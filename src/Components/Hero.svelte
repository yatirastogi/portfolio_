<script>
    import Button from "./Utils/Button.svelte"
</script>

<div class="main">
    <h1>
        Hi, I'm Yati Rastogi,<br/> 
        <div class="span">
            <div class='spanColor'/>
            <div class='text'>Web Designer</div>
        </div> and <br/> 
        <div class="highlight">
            <div class="h2">Web Developer</div>
        </div>
    </h1>
    <p>
        I design and build websites for businesses around the globe. If you need a modern and powerful website, send me an email. If we are a good fit, I will give you a time and cost estimate.
    </p>
     <div class="btn">
        <Button link={"/"}/>
     </div>
    <div class="scrollLabel">SCROLL</div>
</div>

<style>
    .btn{
        padding: 70px;
    }
    .span{
        position:relative;
        display: inline-block;
        height: 61px;
        width: 317px;
        margin-bottom: -12px;
    }
    .span .text {
        display: block;
        z-index: 10;
        position: absolute;
        width: max-content;
    }
    .spanColor{
        position: absolute;
        bottom: 0;
        z-index: 0;
        width: 103%;
        height: 40%;
        background-color: #ffe872;
        transition: all 0.25s linear;
    }
    .span:hover .spanColor {
        height: 100%;
    }
    .main{
        position: relative;
        margin: 0;
        font-family: 'Abril Fatface';
        background-color:#f9efe7;
        padding-bottom: 30px;
        margin-bottom: 70px;
    }
   h1{
        font-size: 53px;
        color:black;
        margin-left: 60px;
        padding-top: 60px;
    }
    p{
        max-width: 600px;
        font-size: 20px;
        margin-top: 80px;
        margin-left: 60px;
        letter-spacing: .5px;
        font-family: 'montserrat';
    }
    .scrollLabel{
        font-family:'montserrat';
        letter-spacing: 2px;
        font-weight:500;
        position:absolute;
        bottom:70px;
        right: 60px;
        transform:rotate(90deg)
    }
    .scrollLabel::after{
        position:absolute;
        top:40px;
        left:0px;
        content: "";
        height: 2px;
        width:100px;
        background-color: black;
        animation:myMove 3s infinite;
    }
    @keyframes myMove{
        from{width:0}
        to{width:100px}
    }
    .highlight{
        margin-top: 10px;
        position: relative;
        height: 30px;
        margin-bottom: 50px;
    }
    .highlight .h2{
        position: absolute;
        z-index: 10;
    }
    .h2::after{
        position: absolute;
        bottom: 0px;
        left:0px;
        content: "";
        height: 25px;
        width: 100%;
        background-color:#ffe872;
        z-index: -1;
        transition:all 0.3s
    }
    .highlight:hover > .h2::after{
        height: 60px;
    }
    @media screen and (max-width:950px){
         .main{
             padding: 0;
             margin: 0;
         }
         h1{
             padding: 15px;
             margin: 0;
         }
         p{
             padding: 15px;
             margin-bottom: 20px;
             margin: 0;
         }
         .btn{
             padding: 30px;
             padding-left: 20px;
            margin: 0;
         }
         .scrollLabel{
            bottom:70px;
            right: 20px;
         }
    }
    @media screen and (max-width:650px){
         p{
             padding: 7px;
             margin-bottom: 30px;
             font-size: 15px;
             margin: 0;
         }
         .btn{
             padding: 30px;
             padding-left: 20px;
            margin: 0;
         }
    .span{
        height: 49px;
        width: 250px;
        margin-bottom: -12px;
    }
    .highlight{
        margin-top: 10px;
        position: relative;
        height: 30px;
        margin-bottom: 20px;
    }
    .highlight .h2{
        position: absolute;
        z-index: 10;
    }
    .h2::after{
        position: absolute;
        bottom: 0px;
        left:0px;
        content: "";
        height: 15px;
        width: 100%;
        background-color:#ffe872;
        z-index: -1;
        transition:all 0.3s
    }
    .highlight:hover > .h2::after{
        height: 45px;
    }
        h1{
            font-size: 40px;
        }
        p{
            text-overflow:ellipsis;
        }
        .scrollLabel{
            display: none;
        }
    }
</style>