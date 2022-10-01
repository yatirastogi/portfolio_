<script>
    let hand = "images/wave.png";
    let pointHand = "images/pointright.png";
    let right = "images/rightArrow.png";
    let me = "images/ME.jpg";
</script>


<div class="intro">
    <div class="head">
        <div class="me">
            <div class="intro__hello">
                <h1>Hello!</h1>
                <img src={hand} alt="hand wave" class="emoji"/>
            </div>            
            <h2 class="intro__tagline">I'm
            <span class="name">Yati Rastogi</span>, a FullStack web developer focused on building beautiful interfaces &amp; experiences right from scratch
            </h2>      
            <h3 class="intro__contact">
            <span>Contact Me</span>
            <img src={pointHand} alt="right_hand_pointing" class="right_hand"/>
            <span>
                <a rel="noreferrer" href="mailto:yatirastogi1739@gmail.com" target="_blank" class="highlight-link">yatirastogi1739@gmail.com</a>
            </span>
            </h3>
        </div> 
        <img src={me} alt="my_picture"/>
    </div>
    <section class="my_background">
        <h3>BACKGROUND</h3>
        <div class="my_info">
            <p>I am studying in <a href="https://vit.ac.in/" target="_">Vellore institute of technology</a>, Vellore.</p>
            <p>
                As a software engineer, I enjoy bridging the gap between engineering and design — combining my technical knowledge to create a beautiful product. My goal is to always build applications that are scalable and efficient under the hood while providing engaging, pixel-perfect user experiences.
            </p>
            <p>I'm a decent level coder having strong hold on C++, I love solving problems to keep learning new stuff..</p>
            <div class="status">
                <div class="arrows">
                    <img src={right} alt="right" class="right_arrow"/>
                    <img src={right} alt="right" class="right_arrow rr2"/>
                </div>
                <p>Currently seeking full-time opportunities!</p>
            </div>
        </div>
    </section>
    <section class="skills_section">
        <diV class="skills">
            SKILLS
        </diV>
        <div class="languages_div">
            <h3>LANGUAGES</h3>
            <p>C++<br>
            JavaScript<br>
            SQL<br>
            ElectronJS
            </p>
        </div>
        <div class="framework_div">
            <h3>FRAMEWORKS</h3>
            <p>React<br>
                Svelte<br>
                NodeJS/Express<br>
                Bootstrap<br>
                JQuery
            </p>
        </div>
        <div class="tools_div">
            <h3>TOOLS</h3>
            <p>Git & Github<br>
                VS Code<br>
                Postman<br>
                Figma<br>
                MongoDB
            </p>
        </div>
    </section>
    <section class="experience_section">
        <h3>EXPERIENCE</h3>
        <div class="experience">
            <div class="exp_1"><div><h3>Holistic Group</h3><p>Full Stack delveloper</p></div><p>August 2021 - October 2021</p></div><br>
            <div class="exp_2"><div><h3>IOTAgi</h3><p>Lead Web delveloper</p></div><p>July 2021 - August 2021</p></div><br>
            <div class="exp_2"><div><h3>Protal</h3><p>Frontend Web delveloper</p></div><p>May 2021 - June 2021</p></div><br>
            <!-- <div><div><h3>Freelance</h3><p>Web delveloper</p></div><p>Jan 2021 - Present</p></div> -->
        </div>
    </section>
    <div  class="resume">
        <a href="/images/resume.pdf" target="_blank">View my resume</a>
        <div class="arrows ar1">
            <img src={right} alt="right" class="right_arrow"/>
            <img src={right} alt="right" class="right_arrow rr2"/>
        </div>
    </div>
</div>
  
  <style>
    .ar1{
        margin-left: 20px;
    }
    .resume{
        display: flex;
        justify-content: center;
        width:100%;
        margin: 50px;
        align-items: center;
    }
    .resume > a{
        margin-bottom: 5px;
        font-size: 20px;
        text-decoration: none;
        color: black;
    }
    .exp_1, .exp_2{
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .experience{
        margin-left: 250px;
        width: 100%;
        display: flex;
        flex-direction: column;
    }
    .experience_section{
        background-color: #f9efe7;
        font-size: 20px;
        display: flex;
        justify-content: space-around;
        align-items: center;
        padding: 100px;
    }
    .head{
        display: flex;
        align-items: center;
    }
    .head > img{
        height: 500px;
        width: 500px;
        margin-right: 50px;
    }
    .me{
        padding: 50px;
    }
    .intro__hello{
        margin: 80px 0;
        display: flex;    
        align-items: center; 
    }
    .intro__hello > h1, .intro__tagline{
        font-weight: 100;
        font-size: 40px;
    }
    .intro__tagline{
        padding-right: 220px;
    }
    .name{
        font-weight: bold;
        animation-name: hand;
    }
    .emoji{
        margin-left: 20px;
        height: 50px;
        width: 50px;
        animation-name: hand;
        animation-duration: 0.4s;
        animation-iteration-count:infinite;
    }
    /* need work on it */
    @keyframes hand{ 
        from {transform:rotate(0deg);transform:translateX(-5px);}
        to {transform:rotate(40deg);transform:translateX(5px);}
    }
    .intro__contact{
        display: flex;
        align-items: center;
        margin-top: 100px;
        font-weight: 500;
        font-size: 20px;
        margin-bottom: 40px;
    }
    .right_hand{
        margin-left:10px;
        margin-right: 20px;
        height: 30px;
        width: 30px;
    }
    .highlight-link{
        text-decoration: none;
        color: black;
    }
    .highlight-link:hover{
        color: rgb(54, 54, 54);
        font-weight: 500;
    }
    .my_background{
        background-color: #f9efe7;
        width: 100%;
        display: flex;
        padding: 100px;
        justify-content: space-around;
        align-items: center;
        font-size: 20px;
    }
    .my_info{
        width: 700px;
        letter-spacing: 1px;
    }
    .my_info > p > a{
        text-decoration: none;
        font-weight: bold;
        color: black;
    }
    .my_info > p{
        padding: 20px;
    }
    .status{
        margin-top: 30px;
        padding: 0 15px;
        display: flex;
    }
    .arrows{
        width: 86px;
    }
    .status > p{
        font-weight: bold;
    }
    .right_arrow{
        height: 20px;
        width:20px;
        animation-name:move;
        animation-duration: 1s;
        animation-iteration-count: infinite;
    }
    .rr2{
        margin-right: 20px;
    }
    @keyframes move{
        from {margin-left: 0;}
        to {margin-left: 10px;}
    }
    .skills_section{
        display: flex;
        justify-content: space-between;
        padding: 150px;
        align-items: center;
    }
    .skills{
        font-size: 20px;
        font-weight: bold;
    }
    .tools_div, .framework_div, .languages_div{
        font-size: 20px;
        display: flex;
        flex-direction: column;
    }
    .tools_div > p, .framework_div > p, .languages_div > p{
        margin-top: 10px;
        font-size: 20px;
    }
  </style>
