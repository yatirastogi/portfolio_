<script>
    import Button from "./Button.svelte"
    import Card from "./Card.svelte"
    export let websiteName;
    export let description;
    export let image;
    export let link;
    export let answer;
</script>

<h1>{websiteName}</h1>
<div class="mainHolder">
        <div class="left">
            <div class="card">
                <Card answer={answer}/>
            </div>
            <p class="p2">{description}</p>
            <div class="btn">
                <Button linkAdd={link}/>
            </div>
        </div>
        <div class="right">
            <img src={image} class="img" alt="right-view"/>
        </div>
</div>


<style>
    h1{
        padding-left: 50px;
    }
    .btn{
        margin: 40px 0;
    }
    .mainHolder{
        display: flex;
        align-items: center;
        justify-content:space-between;
        flex:1;
    }
    .left{
        padding: 50px;
        padding-right: 150px;
        flex-direction:column;
        display: flex;
        align-items: space-around;
    }
    .left .p1,.p2{
        margin: 10px 0;
        font-family: 'montserrat';
    }
    h1{
        font-size: 50px;
        margin: 20px 0;
    }
    .p2{
        letter-spacing: 0.5px;
    }
    .card{
        margin-top:10px;
        margin-bottom: 25px;
    }
    .right{
        width:100%;
        display:flex;
        align-items: center;
        justify-content: flex-end;
    }
    .img{
        cursor:pointer;
        width: 500px;
    }
    @media screen and (max-width:1080px){
        h1{
           padding-left: 0;
            text-align: center;
        }
        .btn{
            margin: auto;
            margin-bottom: 50px;
            margin-top: 20px;
        }
        .mainHolder{
            padding: 10px;
            flex-direction: column-reverse;
        }
        .left{
            padding: 0px;
        }
        .img{
            width: 100%;
        }
    }
</style>