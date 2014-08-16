
// ---------------------------------------------
// BZZ

// ---> Compat

if (!console) { var console = {}; }
if (!console.log) { console.log = function(str) { }; }

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// UI

site.ui = {};

// ---> init

site.ui.init = function() {
	
	console.log("site.ui.init()");
	
	if (!site.session.ui_pause_callbacks) { site.session.ui_pause_callbacks = []; }
	if (!site.session.ui_resume_callbacks) { site.session.ui_resume_callbacks = []; }
	
	// Add some events to ui || TODO: move this to site.ui ?
	$(".actionbar .icon_app").on("click", function() {
		site.lifecycle.onBackButton
	});
	
}

// ---> Sections

site.ui.gotosection = function(selector) {
	
	console.log("site.ui.showsection(): "+ selector);
	
	site.vars.currentSection = selector;
	site.lifecycle.add_section_history(selector);
	
	// Call close function
	if (!site.session.ui_pause_callbacks) { site.session.ui_pause_callbacks = []; }
	while (site.session.ui_pause_callbacks.length>0) {
		var func = site.session.ui_pause_callbacks.shift(); // same order as incoming..
		try { func(); } catch(e) { }
	}
	
	// TODO: nice animations?
	$("section").css("display","none"); 
	$(selector).css("display","block");
	console.log(" > "+ selector +" display: "+$(selector).css("display"));
	
	setTimeout(site.lifecycle.onResize,10);
	
}

// ---> Loading

site.ui.showloading = function(message) {
	console.log("site.ui.showloading()");
	if (!message) { message = site.helpers.getRandomListEntry(site.data.strings.loading); }
	site.vars.isLoading = true;
	$("#loading.overlay_wrap .message").html(message);
	$("#loading.overlay_wrap").fadeIn(500); // TODO: animation gpu powered..
	
}


site.ui.hideloading = function() {
	console.log("site.ui.showloading()");
	site.vars.isLoading = false;
	$("#loading.overlay_wrap .message").html("");
	$("#loading.overlay_wrap").fadeOut(500); // TODO: animation gpu powered..
}

// ---> Hoverbox (toasts!)

site.ui.showtoast = function(msg, timeInSec) {
	console.log("site.ui.showtoast()");
	if (site.timeouts.ui_showtoast_hide) { clearTimeout(site.ui.ui_showtoast_hide); }
	if (!timeInSec) { timeInSec = 2.5; }
	var timeInMsec = timeInSec * 1000;
	$("#overlay_toast").html(msg);
	$("#overlay_toast").fadeIn(500,function() { site.ui.ui_showtoast_hide = setTimeout(function(){site.ui.hidetoast();},timeInMsec); });
}

site.ui.hidetoast = function() {
	console.log("site.ui.hidetoast()");
	$("#overlay_toast").fadeOut(500);
}

site.ui.createtoast = function() {
	console.log("site.ui.createtoast()");
	var snip = document.createElement("div");
	snip.id = "overlay_toast";
	$("body").append(snip);
}

// ---> Hacks... seufs

// Really ugly hack to prevent elements to stay ':active' when it's hidden WHEN it's in this state

site.ui.hackActiveCssRule = function() {
	
	/*
	setTimeout(function(){
		site.listOfActivatableItems = [];
		var itms = jQuery.extend(true, {}, $(".activatablel,.activatabled"));
		console.log(itms.length);
		for (var i=0; i<itms.length; i++) {
			var itm = itms[i];
			// tmp store..
			var index = site.listOfActivatableItems.push(itm)-1;
			var classname = "";
			if (itm.className.indexOf("activatablel")>=0) { classname = "activatablel"; }
			if (itm.className.indexOf("activatabled")>=0) { classname = "activatabled"; }
			$(itm).removeClass(classname);
			console.log(" > "+site.listOfActivatableItems[index] +", "+ index +", "+ classname);
			var execstr = '$(site.listOfActivatableItems['+ index +']).addClass("'+classname+'");';
			console.log(execstr);
			setTimeout(execstr,10);
		}
	},10);
	
	/**/
	
	// Doesn't work.. DA FAK
	/*
	$("body")
		.bind("touchend", function() {
			console.log("touchend! <-------------------")
			$("*").blur();
		}
	);
	/**/
	
}



















