<script>
    import {link} from "svelte-spa-router"
    let flag =  false;
    const clicked = () => {
        flag = !flag;
        if(flag){
            document.querySelector(".mobileHighlight").style.display = "flex";
        }else{
            document.querySelector(".mobileHighlight").style.display = "none";
        }
    }
</script>

<div class="navbar">
    <div class="leftNav">
        <p>Welcome.</p>
        <div class="elements">
            <div class="highlight">
                <a use:link href="/personal" class="h2">about me</a>
            </div>
            <div class="highlight">
                <a use:link href="/MyWork" class="h2">my work</a>
            </div>
            <div class="highlight">
                <a use:link href="/personal" class="h2">get in touch</a>
            </div>
        </div>
        <div class="burgerHolder" on:click={clicked}>
            <div>
                <div class="b1"></div>
                <div class="b1"></div>
                <div class="b1"></div>
            </div>
            <div class="cross">
                <div class="b2"></div>
                <div class="b3"></div>
            </div>
        </div>
    </div>
    <div class="mobileHighlight">
        <div class="highlight1">
            <a use:link href="/personal" class="h2">about me</a>
        </div>
        <div class="highlight1">
            <a use:link href="/MyWork" class="h2">my work</a>
        </div>
        <div class="highlight1">
            <a use:link href="/personal" class="h2">get in touch</a>
        </div>
    </div>
</div>

<style>
    .leftNav{
        display: flex;
        justify-content: space-between;
    }
    .mobileHighlight{
        display: none;
    }
    .burgerHolder{
        cursor: pointer;
        display: none;
    }
    .b1{
        margin: 8px;
        height: 3px;
        width: 40px;
        background-color: black;
    }
    a{
        text-decoration: none;
        color: black;
        font-size: 20px;
        font-weight: 500;
    }
    .navbar{
        width:100%;
        padding: 20px 60px;
        font-family: 'Muli',sans-serif;
        background-color: #f9efe7;
        display:flex;
        flex-direction: column;
        justify-content: space-between;
    }
    .navbar p{
        font-size: 22px;
        font-weight: 800;
        letter-spacing: .5px;
    }
    .elements{
        width: 400px;
        display: flex;
        justify-content: space-between;
        cursor: pointer;
    }
    .highlight{
        position: relative;
        height: 100%;
    }
    .highlight .h2{
        position: absolute;
        width: max-content;
        right:0px;
        z-index: 10;
    }
    .h2::after{
        position: absolute;
        bottom: -2px;
        left:0px;
        content: "";
        height: 9px;
        width: 100%;
        background-color:#ffe872;
        z-index: -1;
        transition:all 0.3s
    }
    .highlight:hover > .h2::after{
        height: 25px;
    }
    @media screen and (max-width:950px){
        .burgerHolder{
            display: block;
        }
        .cross{
            height: 60px;
        }
         .navbar{
             padding: 15px;
             justify-content: space-between;
         }      
         .elements{
             margin-top: 5px;
         }
         .burgerHolder{
             z-index: 100;
         }
         .elements{
             display: none;
         }
         .mobileHighlight{           
             background-color: rgba(202, 202, 202, 0.291);
             height: 70px;
             justify-content: space-between;
             align-items: center;
             display: none;
         }
         .highlight1 > .h2{
           padding: 10px;
        }
        .highlight1 > .h2:hover{
            background-color: rgb(225, 225, 225);
        }
         .highlight{
            text-align: center;
            padding: 20px 0 ;
            height: 100%;
        }
        .highlight .h2{
            width: max-content;
            right:0px;
            z-index: 10;
        }
        .h2::after{
            position: absolute;
            bottom: -2px;
            left:0px;
            content: "";
            height: 9px;
            width: 100%;
            background-color:#ffe872;
            z-index: -1;
            transition:all 0.3s
        }
        .highlight:hover > .h2::after{
            height: 25px;
        }   
    }
</style>