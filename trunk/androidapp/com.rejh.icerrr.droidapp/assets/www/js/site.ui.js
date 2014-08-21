
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
	
	loggr.log("site.ui.init()");
	
	if (!site.session.ui_pause_callbacks) { site.session.ui_pause_callbacks = []; }
	if (!site.session.ui_resume_callbacks) { site.session.ui_resume_callbacks = []; }
	
	// Add some events to ui || TODO: move this to site.ui ?
	$(".actionbar .icon_app").on("click", function() {
		site.lifecycle.onBackButton
	});
	
	/*
	$("#canvas_doodle").on("touchstart", function(e){ doo.touchBegin(e); });
	$("#canvas_doodle").on("touchmove",  function(e){ doo.touchMove(e); });
	$("#canvas_doodle").on("touchend",  function(e){ doo.touchEnd(e); });
	*/
	
	site.ui.hackActiveCssRule();
	
}

// ---> Sections

site.ui.gotosection = function(selector) {
	
	loggr.log("site.ui.showsection(): "+ selector);
	
	site.vars.currentSection = selector;
	site.lifecycle.add_section_history(selector);
	
	// Call close function
	if (!site.session.ui_pause_callbacks) { site.session.ui_pause_callbacks = []; }
	while (site.session.ui_pause_callbacks.length>0) {
		var func = site.session.ui_pause_callbacks.shift(); // same order as incoming..
		try { func(); } catch(e) { }
	}
	
	// Clean up ui_resume_callbacks
	while (site.session.ui_resume_callbacks.length>0) {
		site.session.ui_resume_callbacks.shift(); // same order as incoming..
	}
	
	// TODO: nice animations?
	// TODO: Settimeout is a workaround so that :active elements lose their active state..
	if (site.timeouts.gotosection) { clearTimeout(site.timeouts.gotosection); }
	//site.timeouts.gotosection = setTimeout(function(){
		$(".activatablel_active").removeClass("activatablel_active");
		$(".activatabled_active").removeClass("activatabled_active");
		$("section").css("display","none"); 
		$(selector).css("display","block");
		loggr.log(" > "+ selector +" display: "+$(selector).css("display"));
		setTimeout(site.lifecycle.onResize,10);
	//},100);
	
}

// ---> Loading

site.ui.showloading = function(message) {
	loggr.log("site.ui.showloading()");
	if (!message) { message = site.helpers.getRandomListEntry(site.data.strings.loading); }
	site.vars.isLoading = true;
	$("#loading.overlay_wrap .message").html(message);
	$("#loading.overlay_wrap").fadeIn(500); // TODO: animation gpu powered..
	
}


site.ui.hideloading = function() {
	loggr.log("site.ui.showloading()");
	site.vars.isLoading = false;
	$("#loading.overlay_wrap .message").html("");
	$("#loading.overlay_wrap").fadeOut(500); // TODO: animation gpu powered..
}

// ---> Hoverbox (toasts!)

site.ui.showtoast = function(msg, timeInSec) {
	loggr.log("site.ui.showtoast()");
	if (site.timeouts.ui_showtoast_hide) { clearTimeout(site.ui.ui_showtoast_hide); }
	if (!timeInSec) { timeInSec = 2.5; }
	var timeInMsec = timeInSec * 1000;
	$("#overlay_toast").html(msg);
	$("#overlay_toast").fadeIn(500,function() { site.ui.ui_showtoast_hide = setTimeout(function(){site.ui.hidetoast();},timeInMsec); });
}

site.ui.hidetoast = function() {
	loggr.log("site.ui.hidetoast()");
	$("#overlay_toast").fadeOut(500);
}

site.ui.createtoast = function() {
	loggr.log("site.ui.createtoast()");
	var snip = document.createElement("div");
	snip.id = "overlay_toast";
	$("body").append(snip);
}

// ---> Hacks... seufs

// Really ugly hack to prevent elements to stay ':active' when it's hidden WHEN it's in this state

site.ui.hackActiveCssRule = function() {
	
	// Reset transitions
	
	$(".activatablel,activatabled").css("transition","none");
	
	// Work..
	
	var elems = [];
	
	elems = $(".activatablel");
	
	for (var i in elems) {
		var elem = elems[i];
		elem.ontouchstart = function(evt) {
			// Now we have to find the ACTUAL element that bound this event 
			// because somebody decided it's useful to not do this &$*((@^#))_
			if (!evt.target) { return; }
			var foundTheActualTarget = false;
			var thetarget = evt.target;
			var whilenum = 0;
			while (!foundTheActualTarget) {
				if (!thetarget) { break; }
				if (thetarget.className) {
					if (thetarget.className.indexOf("activatablel")>=0) {
						foundTheActualTarget = true;
						break;
					}
				}
				thetarget = thetarget.parentNode;
				whilenum++;
				if (whilenum>256) { break; } // TODO: unless we intend to do this job in Reno, we're in Barney
			}
			if (site.timeouts.activatablel_ontouchstart) { clearTimeout(site.timeouts.activatable_ontouchstart); }
			if (site.timeouts.activatabled_ontouchstart) { clearTimeout(site.timeouts.activatabled_ontouchstart); }
			site.timeouts.activatablel_ontouchstart = setTimeout(function(){
				if ($(thetarget).hasClass("activatablel_active")) { return; }
				$(thetarget).addClass("activatablel_active");
				//setTimeout(function(){$(thetarget).css("transition","background-color 500ms");},1);
			},75);
		};
		elem.ontouchend = function(evt) {
			if (site.timeouts.activatablel_ontouchstart) { clearTimeout(site.timeouts.activatable_ontouchstart); }
			if (site.timeouts.activatabled_ontouchstart) { clearTimeout(site.timeouts.activatabled_ontouchstart); }
			if (site.timeouts.activatablel_ontouchend) { clearTimeout(site.timeouts.activatablel_ontouchend); }
			site.timeouts.activatablel_ontouchend = setTimeout(function() { 
				$("*").removeClass("activatablel_active");
				$("*").removeClass("activatabled_active");
				//$(".activatablel,activatabled").css("transition","background-color 500ms");
			},250);
				
		};
		elem.ontouchcancel = elem.ontouchend;
	}
	
	elems = $(".activatabled");
	
	for (var i in elems) {
		var elem = elems[i];
		elem.ontouchstart = function(evt) {
			// Now we have to find the ACTUAL element that bound this event 
			// because somebody decided it's useful to not do this &$*((@^#))_
			if (!evt.target) { return; }
			var foundTheActualTarget = false;
			var thetarget = evt.target;
			var whilenum = 0;
			while (!foundTheActualTarget) {
				if (!thetarget) { break; }
				if (thetarget.className) {
					if (thetarget.className.indexOf("activatabled")>=0) {
						foundTheActualTarget = true;
						break;
					}
				}
				thetarget = thetarget.parentNode;
				whilenum++;
				if (whilenum>256) { break; } // TODO: unless we intend to do this job in Reno, we're in Barney
			}
			if (site.timeouts.activatablel_ontouchstart) { clearTimeout(site.timeouts.activatable_ontouchstart); }
			if (site.timeouts.activatabled_ontouchstart) { clearTimeout(site.timeouts.activatabled_ontouchstart); }
			site.timeouts.activatabled_ontouchstart = setTimeout(function(){
				if ($(thetarget).hasClass("activatabled_active")) { return; }
				$(thetarget).addClass("activatabled_active");
				//setTimeout(function(){$(thetarget).css("transition","background-color 500ms");},1);
			},75);
		};
		elem.ontouchend = function(evt) {
			if (site.timeouts.activatablel_ontouchstart) { clearTimeout(site.timeouts.activatable_ontouchstart); }
			if (site.timeouts.activatabled_ontouchstart) { clearTimeout(site.timeouts.activatabled_ontouchstart); }
			if (site.timeouts.activatabled_ontouchend) { clearTimeout(site.timeouts.activatabled_ontouchend); }
			site.timeouts.activatabled_ontouchend = setTimeout(function() { 
				$("*").removeClass("activatablel_active");
				$("*").removeClass("activatabled_active");
				//$(".activatablel,activatabled").css("transition","background-color 500ms");
			},250);
		};
		elem.ontouchcancel = elem.ontouchend;
	}
	
}

















