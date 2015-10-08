
<!--

	ICERRR

	REJH Gadellaa 2015

-->

<!doctype html>

<html lang="en">

<head>

	<!-- UTF-8 -->
    <meta charset="utf-8">

    <!-- Title + Info -->
    <title>ICERRR</title>

	<!-- Meta -->
	<meta content="True" name="HandheldFriendly" />
	<meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" name="viewport" />

    <meta name="title" content="ICERRR" />
    <meta name="description" content="The (clock radio) icecast streaming app.">
	<meta name="author" content="REJH Gadellaa">

    <!-- OpenGraph Snippet for fb, g+ -->
    <meta property="og:site_name" content="ICERRR" />
    <meta property="og:title" content="ICERRR" />
    <meta property="og:type" content="article" />
    <meta property="og:image" content="http://rejh.nl/icerrr/img/web_hi_res_512_002.jpg" />
    <meta property="og:description" content="The (clock radio) icecast streaming app." />

    <!-- IE: Use Chrome Frame if available, else latest IE9 renderer -->
    <meta http-equiv="X-UA-Compatible" content="IE=Edge,chrome=1">

	<!-- Icon -->
    <link rel="icon" href="img/ic_launcher.png" type="image/x-icon">

	<!-- Javascript: jQuery -->
    <script language="javascript" type="text/javascript" src="js/jquery/jquery-1.11.3.min?c=<?=time();?>"></script>

    <!-- Javascript: Things :D -->
    <script>
	if (window.location.hostname.indexOf("www.rejh.nl")<0 && window.location.hostname.indexOf("localhost")<0) {
		window.location.href = "http://www.rejh.nl/icerrr/"; // for prod
	}
	</script>
	</script>

    <!-- Style / base -->
    <link rel="stylesheet" type="text/css" href="css/common.css?c=<?=time();?>" />
    <link rel="stylesheet" type="text/css" href="css/default.css?c=<?=time();?>" />

    <!-- Style / responsive -->
	<link rel="stylesheet" type="text/css" href="css/size.phone.css?c=<?=time();?>" media="screen and (max-width: 960px)" />

    <!-- Webfonts -->
    <link href='http://fonts.googleapis.com/css?family=Roboto:100,200,300,400' rel='stylesheet' type='text/css'>

    <!--[if lt IE 9]>
    	<script src="js/plugs/html5shiv.js"></script>
    <![endif]-->

    <script>

        var vars = {};

        function onload() {

            console.log("onload()");

            // Scroll listener -> Hide fab :D
            $(".main").off( 'scroll');
            $(".main").on( 'scroll', function(e) {

                delta = vars.scrolltop - $(".main").scrollTop();
                if (!vars.lastDelata) { vars.lastDelata = -(delta); }

                if (delta<0 && vars.lastDelata>0) {
                    // scroll up
                    // ..
                    $(".main").css("top","56px");
                    $(".header").css("height","56px");
                    $(".header .logo").css("top","-192px");
                    if (vars.scrolltimeout) { clearTimeout(vars.scrolltimeout); }
                    vars.scrolltimeout = setTimeout(function(){
                        console.log("scroll");
                        $(".header .logo_sml").css("top","0");
                    },250);

                }
                if(delta >= 0 && vars.lastDelata<0) {
                    // scroll down
                    // ..
                    $(".main").css("top","192px");
                    $(".header").css("height","192px");
                    $(".header .logo_sml").css("top","-56px");
                    $(".header .logo").css("top","0");
                    if (vars.scrolltimeout) { clearTimeout(vars.scrolltimeout); }
                    vars.scrolltimeout = setTimeout(function(){
                        console.log("scroll");
                        $(".header .logo").css("top","0");
                    },250);
                }

                vars.scrolltop = $("main").scrollTop();
                vars.lastDelata = delta;

            });

            // Load readme..
            $( "#readme" ).load( "ajax/readme.html", function() {
              console.log( " -> Load was performed." );
            });
        }

    </script>

</head>

<body onload="onload();">

<!-- Section: home -->
<section id="home">

    <!-- Header -->
	<div class="header shadow_z2">

        <div class="logo">
            <img src="img/web_hi_res_512_002-transparent.png" />
            <div class="title">ICERRR</div>
            <div class="subtitle"><span class="theapp">The (clock radio) icecast streaming app</span> <span class="forandroid">for Android</span></div>
        </div>

        <div class="logo_sml">
            <img src="img/web_hi_res_512_002-transparent.png" />
            <div class="title">ICERRR</div>
            <div class="subtitle">The (clock radio) icecast streaming app</div>
        </div>

        <div class="subtitle">        </div>
    </div>

    <!-- Main -->
    <div class="main">
        <div class="main_inner">

            <!-- readme -->
            <div id="readme" class="readme">Loading...</div>

        </div>
    </div>

    <!-- Guideline -->
    <div class="guideline one"></div>
    <div class="guideline two"></div>

</section>

</html>
