
// ---------------------------------------------
// BZZ

// ---> Compat

if (!console) { var console = {}; }
if (!console.log) { console.log = function(str) { }; }

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// REDIRECT

if (window.location.hostname.indexOf("www.rejh.nl")<0 && window.location.hostname.indexOf("localhost")<0) {
	window.location.href = "http://www.rejh.nl/icerrr/";
}

// ---------------------------------------------
// MAIN

site.main = {};

site.main.onload = function() {
	
	console.log("site.main.onload()");
	
	var shown = (site.cookweb.get("notice_playstore_shown")) ? site.cookweb.get("notice_playstore_shown") : 0;
	
	// Notice
	if (shown<2048) {
		
		site.cookweb.put("notice_playstore_shown",shown+1);
		//setTimeout(function(){$("#home .notice_playstore").fadeIn(500);},250);
		
	}
	
	setTimeout(function(){$("#home .notice_playstore").fadeIn(500);},250);
	
}


