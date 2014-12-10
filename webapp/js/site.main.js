
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

// --> Onload

site.main.onload = function() {
	
	console.log("site.main.onload()");
	
	site.main.loaded = true;
	
	var shown = (site.cookweb.get("notice_playstore_shown")) ? site.cookweb.get("notice_playstore_shown") : 0;
	
	// Notice
	if (shown<2048) {
		
		site.cookweb.put("notice_playstore_shown",shown+1);
		//setTimeout(function(){$("#home .notice_playstore").fadeIn(500);},250);
		
	}
	
	setTimeout(function(){$("#home .notice_playstore").fadeIn(500);},250);
	
	if (site.main.screenMouseOver) {
		site.main.showScreens();
	}
	
}

// --> Show/hide screens

site.main.showScreens = function() {
	
	console.log("site.main.showScreens()");
	
	site.main.screenMouseOver = true;
	
	if (!site.main.loaded) { return; }
	
	$(".screenwrap").css("bottom",0);
	
	if (site.main.timeout1) {
		clearTimeout(site.main.timeout1);
		clearTimeout(site.main.timeout2);
		clearTimeout(site.main.timeout3);
		clearTimeout(site.main.timeout4);
	}
	
	site.main.timeout1 = setTimeout(function(){ $(".screen.first").css("top",-192); },1);
	site.main.timeout2 = setTimeout(function(){ $(".screen.second").css("top",-192); },100);
	site.main.timeout3 = setTimeout(function(){ $(".screen.third").css("top",-192); },200);
	site.main.timeout4 = setTimeout(function(){ $(".screen.fourth").css("top",-192); },300);
	
}

site.main.hideScreens = function() {
	
	console.log("site.main.hideScreens()");
	
	site.main.screenMouseOver = false;
	
	if (!site.main.loaded) { return; }
	
	$(".screenwrap").css("bottom",0);
	
	if (site.main.timeout1) {
		clearTimeout(site.main.timeout1);
		clearTimeout(site.main.timeout2);
		clearTimeout(site.main.timeout3);
		clearTimeout(site.main.timeout4);
	}
	
	site.main.timeout1 = setTimeout(function(){ $(".screen.first").css("top",0); },1);
	site.main.timeout2 = setTimeout(function(){ $(".screen.second").css("top",0); },100);
	site.main.timeout3 = setTimeout(function(){ $(".screen.third").css("top",0); },200);
	site.main.timeout4 = setTimeout(function(){ $(".screen.fourth").css("top",0); },300);
	
	/**/
	
}
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	


