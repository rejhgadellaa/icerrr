
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
    <script language="javascript" type="text/javascript" src="js/jquery/jquery-1.11.3.min.js"></script>

    <!-- Javascript: Things :D -->
    <script>
	if (window.location.hostname.indexOf("www.rejh.nl")<0 && window.location.hostname.indexOf("localhost")<0 && window.location.hostname.indexOf("192.168.")<0) {
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
            $(window).off( 'scroll');
            $(window).on( 'scroll', function(e) {

                if ($(window).scrollTop()<136) {
                    $(".header_sml .logo_sml").css("opacity",0);
                    $(".header").css("opacity",1);
                }
                if ($(window).scrollTop()>136) {
                    $(".header_sml .logo_sml").css("opacity",1);
                    $(".header").css("opacity",0);
                }

            });

            // Load readme..
            $( "#readme" ).load( "ajax/readme.html", function() {
              console.log( " -> Loaded readme" );
              $(".footer").css("display","block");
            });

        }

    </script>

</head>

<body onload="onload();">

<!-- Section: home -->
<section id="home">

    <!-- Header -->
	<div class="header">

        <div class="logo">
            <img src="img/web_hi_res_512_002-transparent.png" />
            <div class="title">ICERRR</div>
            <div class="subtitle"><span class="theapp">The (clock radio) icecast streaming app</span> <span class="forandroid">for Android</span></div>
        </div>

    </div>

    <!-- Header_sml -->
    <div class="header_sml shadow_z2">

        <div class="logo_sml">
            <img src="img/ic_launcher_w_48.png?c=<?=time();?>" />
            <div class="title">ICERRR</div>
            <div class="subtitle">The (clock radio) icecast streaming app</div>
        </div>

    </div>

    <!-- Main -->
    <div class="main">
        <div class="main_inner">

            <!--
            <div class="tabs">
                <div class="tab shadow_z2 round4 active">Home</div><div class="tabspace"></div><div class="tab shadow_z2 round4">Acknoledgements</div>
            </div>
            -->

            <!-- readme -->
            <div id="readme" class="readme"><p>Loading...</p></div>

            <!-- footer -->
            <div class="footer">

                <!-- Ruler -->
                <div class="ruler"></div>

                <!-- Legal -->
                <div class="legal">
                    <div class="item_wrap">Icerrr is open source and distributed under the MIT license</div>
                    <div class="item_wrap">Copyright &copy; 2015 <a href="http://www.rejh.nl/" target="_blank">REJH Gadellaa</a></div>

                </div>

                <!-- Social -->
                <div class="social">
                    <div class="item_wrap"><div class="g-plusone" data-href="http://www.rejh.nl/icerrr/" data-size="medium" data-annotation="inline" data-width="200"></div></div>
                    <div class="item_wrap"><a href="https://twitter.com/share" class="twitter-share-button" data-via="RGadellaa" data-count="none">Tweet</a></div>
                </div>

            </div>

        </div>
    </div>

    <!-- Guideline -->
    <div class="guideline one"></div>
    <div class="guideline two"></div>

</section>

<script>
// Google+
	(function() {
		var po = document.createElement('script'); po.type = 'text/javascript'; po.async = true;
		po.src = 'https://apis.google.com/js/plusone.js';
		var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(po, s);
	})();
	// Twitter
	!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src="//platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");
</script>

</html>
