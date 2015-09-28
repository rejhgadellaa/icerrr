
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
    <script language="javascript" type="text/javascript" src="js/jquery/jquery-1.11.3.min"></script>
    
    <!-- Javascript: Things :D -->
    <script>
	if (window.location.hostname.indexOf("www.rejh.nl")<0 && window.location.hostname.indexOf("localhost")<0) {
		window.location.href = "http://www.rejh.nl/icerrr/";
	}
	</script>
    
    <!-- Style / base -->
    <link rel="stylesheet" type="text/css" href="css/common.css" />
    <link rel="stylesheet" type="text/css" href="css/default.css" />
    
    <!-- Style / responsive -->
	<link rel="stylesheet" type="text/css" href="css/size.phone.css?c=<?=time();?>" media="screen and (max-width: 960px)" />
    
    <!-- Webfonts -->
    <link href='http://fonts.googleapis.com/css?family=Roboto:100,200,300,400' rel='stylesheet' type='text/css'>
    
    <!--[if lt IE 9]>
    	<script src="js/plugs/html5shiv.js"></script>
    <![endif]-->
	
</head>

<body>

<!-- Section: home -->
<section id="home">
	
    <!-- Header -->
	<div class="header">
    	
        <div class="logo">
            <img src="img/web_hi_res_512_002-transparent.png" />
            <div class="title">ICERRR</div>
            <div class="subtitle">The (clock radio) icecast streaming app</div>
        </div>
        
        <div class="subtitle">        </div>
    </div>
    
    <!-- Main -->
    <div class="main shadow_z2u">
    	
        <div class="download round5" onClick="window.open('https://www.dropbox.com/s/adr7g3acrcwl1i2/Icerrr.apk?dl=1');">
        	<div class="text">DOWNLOAD</div>
        </div>
        
        <div class="info">
        	<div class="line">Find the project on <a href="https://github.com/rejhgadellaa/icerrr/" target="_blank">GitHub</a></div>
            <div class="line">Copyright &copy; 2015 <a href="http://www.rejh.nl/" target="_blank">REJH Gadellaa</a></div>
        </div>
    </div>
    
    <!-- Social -->
    <div class="social">
        <div class="item_wrap"><div class="g-plusone" data-href="http://www.rejh.nl/icerrr/" data-size="medium" data-annotation="inline" data-width="200"></div></div>
        <div class="item_wrap"><a href="https://twitter.com/share" class="twitter-share-button" data-via="RGadellaa" data-count="none">Tweet</a></div>
    </div>
    
    <!-- Donate -->
    <div class="donate">
	<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
	<input type="hidden" name="cmd" value="_s-xclick">
	<input type="hidden" name="encrypted" value="-----BEGIN PKCS7-----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-----END PKCS7-----
	">
	<input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif" border="0" name="submit" alt="PayPal - The safer, easier way to pay online!">
	<img alt="" border="0" src="https://www.paypalobjects.com/nl_NL/i/scr/pixel.gif" width="1" height="1">
	</form>
	</div>
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

</body>

</html>