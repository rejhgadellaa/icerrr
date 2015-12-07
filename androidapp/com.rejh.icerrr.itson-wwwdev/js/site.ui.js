
// ---------------------------------------------
// BZZ

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

	loggr.log("site.ui.gotosection(): "+ selector);

	site.vars.previousSection = site.vars.currentSection;

	site.vars.currentSection = selector;
	site.lifecycle.add_section_history(selector);

	// When leaving home: dismiss overflow menu
	if (selector!="#home" && site.home.overflowMenuIsVisible) {
		site.home.dismissOverflowMenu();
	}

	// Call close function
	if (!site.session.ui_pause_callbacks) { site.session.ui_pause_callbacks = []; }
	while (site.session.ui_pause_callbacks.length>0) {
		var func = site.session.ui_pause_callbacks.shift(); // same order as incoming..
		try { func(); } catch(e) { }
	}

	// Clean up ui_resume_callbacks
	if (!site.session.ui_resume_callbacks) { site.session.ui_resume_callbacks = []; }
	while (site.session.ui_resume_callbacks.length>0) {
		site.session.ui_resume_callbacks.shift(); // same order as incoming..
	}

	// TODO: nice animations?
	// TODO: Settimeout is a workaround so that :active elements lose their active state..
	if (site.timeouts.gotosection) { clearTimeout(site.timeouts.gotosection); }

	$(".activatablel_active").removeClass("activatablel_active");
	$(".activatabled_active").removeClass("activatabled_active");

	// Hide home when needed (because it is shown by default so body.onload does load it)
	if (selector!="#home") {
		$("#home").css("display","none");
	}

	if (site.vars.previousSection=="#splash") {
		// Resize .main
		$(site.vars.currentSection+" .main").css("height",$(window).height()-56);
		// Show..
		$(selector).css("display","block");
		// Translate splash
		$("#splash").on("transitionend webkitTransitionEnd",function(evt){
			$("#splash").off("transitionend webkitTransitionEnd");
			site.ui.fadeOut("#splash",250);
		});
		var translate = "translate3d(0px,"+ (-($(window).height()-$(".actionbar").height())) +"px,0px)";
		$("#splash").css({"transform":translate,"-webkit-transform":translate});
	} else {
		$("section").css("display","none");
		$(selector).css("display","block");
	}

	loggr.log(" > "+ selector +" display: "+$(selector).css("display"));
	setTimeout(site.lifecycle.onResize,10);

	site.ui.setLongclickHelp();

}

// ---> FabScroll

site.ui.initFabScroll = function(selector) {

	loggr.log("site.ui.initFabScroll()");

	if (!site.vars.fabscrolls) {
		site.vars.fabscrolls = {};
	}
	if (!site.vars.fabscrolls[selector]) {
		site.vars.fabscrolls[selector] = {};
		site.vars.fabscrolls[selector].scrolltop = 0;
		site.vars.fabscrolls[selector].time = 0;
		site.vars.fabscrolls[selector].lastDelata = 0;
	}

	// Reset all..
	$(".fab").css("bottom",16);
	// Reset current if toast is visible
	if (site.ui.ui_showtoast_hide && selector!="#home") {
		$(selector+" .fab").css("bottom",$("#overlay_toast").outerHeight()+16);
	}

	// Scroll listener -> Hide fab :D
	$(".main").off( 'scroll');
	$(selector+" .main").on( 'scroll', function(e) {

		// Delta..
		delta = site.vars.fabscrolls[selector].scrolltop - $(selector+" .main").scrollTop();
		if (!site.vars.fabscrolls[selector].lastDelata) { site.vars.fabscrolls[selector].lastDelata = -(delta); }

		// Scrolled to bottom?
		var selScrollHeight = $(selector+" .main")[0].scrollHeight;
		var selHeight = $(selector+" .main").height();
		var selScrollTop = $(selector+" .main").scrollTop();

		// Action!
		if (selScrollHeight <= (selHeight+selScrollTop)) {
			//scroll up
			if (site.ui.ui_showtoast_hide) {
				$(selector+" .fab").css("bottom",$("#overlay_toast").outerHeight()+16);
			} else {
				$(selector+" .fab").css("bottom",16);
			}
		}
		else if(delta > 0 && site.vars.fabscrolls[selector].lastDelata<0) {
			//scroll up
			if (site.ui.ui_showtoast_hide) {
				$(selector+" .fab").css("bottom",$("#overlay_toast").outerHeight()+16);
			} else {
				$(selector+" .fab").css("bottom",16);
			}
		}
		else if (delta<0 && site.vars.fabscrolls[selector].lastDelata>0) {
			//scroll down
			$(selector+" .fab").css("bottom",-64);
		}

		// Store..
		site.vars.fabscrolls[selector].scrolltop = $(selector+" .main").scrollTop();
		site.vars.fabscrolls[selector].lastDelata = delta;
		site.vars.fabscrolls[selector].time = new Date().getTime();

	});

}

// ---> Fades

site.ui.fadeIn = function(selector,timems,cb,opts) {

	loggr.log("site.ui.fadeIn(): "+ selector); // : "+ selector +", "+ timems +", cb:"+(cb)?"true":"none");

	var jqobj = $(selector);
	if (!jqobj) { loggr.warn(" > !jqobj"); return; }
	if (jqobj.length<1) { loggr.warn(" > jqobj < 1"); return; }

	if (!timems) { timems = 500; }
	if (!opts) { opts = {}; }

	// FadeOut running?
	if (!site.vars.fadeOuts) { site.vars.fadeOuts = {}; }
	if (site.vars.fadeOuts[selector] && site.vars.fadeOuts[selector].isBusy) {
		loggr.warn(" > FadeOut already running on selector: "+ selector +", cancel it",{dontsave:true});
		clearTimeout(site.vars.fadeOuts[selector].timeout);
		site.vars.fadeOuts[selector].isBusy = false;
	}

	// Already running?
	if (!site.vars.fadeIns) { site.vars.fadeIns = {}; }
	if (site.vars.fadeIns[selector] && site.vars.fadeIns[selector].isBusy) {
		loggr.warn(" > FadeIn already active: "+ selector,{dontsave:true});
		// -> check time
		if (new Date().getTime() > site.vars.fadeIns[selector].timeEnd) {
			loggr.warn(" -> Should have ended.. fadeIn anyway",{dontsave:true});
			clearTimeout(site.vars.fadeIns[selector].timeout);
			site.vars.fadeIns[selector].isBusy = false;
		} else {
			return;
		}
	}
	site.vars.fadeIns[selector] = {
		timeBgn:new Date().getTime(),
		timeEnd:new Date().getTime()+timems,
		timeDuration:timems,
		isBusy:true,
		timeout:null,
		originalTransition:(jqobj.css("transition"))?jqobj.css("transition"):"none", // TODO: for restoring later..
		originalOpacity:(jqobj.css("opacity"))?jqobj.css("opacity"):1.0 // TODO: for restoring later..
	};

	// Opac props first..
	jqobj.css("opacity",0.0);

	// Post delayed so opacity == 0
	if (site.vars.fadeOuts[selector] && site.vars.fadeOuts[selector].timeout) { clearTimeout(site.vars.fadeOuts[selector].timeout); }
	if (site.vars.fadeIns[selector].timeout) { clearTimeout(site.vars.fadeIns[selector].timeout); }
	site.vars.fadeIns[selector].timeout = setTimeout(function(){

		jqobj.css("transition","opacity "+ timems +"ms");
		jqobj.css("display","block");

		//loggr.error(jqobj.css("transition") +", "+ jqobj.css("opacity"),{dontupload:true}); // DEBUG

		if (site.vars.fadeIns[selector].timeout) { clearTimeout(site.vars.fadeIns[selector].timeout); }
		site.vars.fadeIns[selector].timeout = setTimeout(function(){

			site.vars.fadeIns[selector].timeout = setTimeout(function(){

				loggr.warn(" -> fadeIn "+ selector +" transitionend",{dontsave:true});
				if (jqobj.css("opacity")<=0.9) {
					loggr.warn(" -> opacity<=0.9?! "+ selector +" transitionend",{dontsave:true});
					//return;
				}

				site.vars.fadeIns[selector].isBusy = false;
				loggr.log("site.ui.fadeIn() > FadeIns: "+ selector +" "+ site.vars.fadeIns[selector],{dontupload:true});
				if (cb) { cb(); }

			},timems+50);

			jqobj.css("opacity", (opts.opacity)?opts.opacity:1.0 );

		},50);
	},50);

}

site.ui.fadeOut = function(selector,timems,cb,opts) {

	// Is it visible to begin with?
	if ($(selector).css("display")=="none") {
		// loggr.warn("OIOIOI",{dontsave:true}); // DEBUG
		//return; // silent..
	}

	loggr.log("site.ui.fadeOut(): "+selector); // : "+ selector +", "+ timems +", cb:"+(cb)?"true":"none");

	var jqobj = $(selector);
	if (!jqobj) { loggr.warn(" > !jqobj"); return; }
	if (jqobj.length<1) { loggr.warn(" > jqobj < 1"); return; }

	if (!timems) { timems = 500; }
	if (!opts) { opts = {}; }

	// FadeIn running?
	if (!site.vars.fadeIns) { site.vars.fadeIns = {}; }
	if (site.vars.fadeIns[selector] && site.vars.fadeIns[selector].isBusy) {
		loggr.warn(" > FadeIn already running on selector: "+ selector +", cancel it",{dontsave:true});
		clearTimeout(site.vars.fadeIns[selector].timeout)
		site.vars.fadeIns[selector].isBusy = false;
	}

	// Already running?
	if (!site.vars.fadeOuts) { site.vars.fadeOuts = {}; }
	if (site.vars.fadeOuts[selector] && site.vars.fadeOuts[selector].isBusy) {
		loggr.warn(" > FadeOut already active: "+ selector,{dontsave:true});
		clearTimeout(site.vars.fadeOuts[selector].timeout)
		//return;
	}
	site.vars.fadeOuts[selector] = {
		timeBgn:new Date().getTime(),
		timeEnd:new Date().getTime()+timems,
		timeDuration:timems,
		isBusy:true,
		timeout:null
	};

	// Opac props first..
	jqobj.css("transition","opacity "+ timems +"ms");

	// Post delayed so opacity == 0
	if (site.vars.fadeIns[selector] && site.vars.fadeIns[selector].timeout) { clearTimeout(site.vars.fadeIns[selector].timeout); }
	if (site.vars.fadeOuts[selector].timeout) { clearTimeout(site.vars.fadeOuts[selector].timeout); }
	site.vars.fadeOuts[selector].timeout = setTimeout(function(){

		site.vars.fadeOuts[selector].timeout = setTimeout(function(){

			loggr.warn(" -> fadeOut "+ selector +" transitionend",{dontsave:true});
			if (jqobj.css("opacity")>=0.1) {
				loggr.warn(" -> opacity<=0.9?! "+ selector +" transitionend",{dontsave:true});
				//return;
			}

			jqobj.css("display","none");

			jqobj.css("transition","none"); // TODO: restore..
			jqobj.css("opacity",1.0); // TODO: restore..

			site.vars.fadeOuts[selector].isBusy = false;
			loggr.log("site.ui.fadeOut() > FadeOuts: "+ selector +" "+ site.vars.fadeOuts[selector],{dontupload:true});
			if (cb) { cb(); }

		},timems+50);

		jqobj.css("opacity", (opts.opacity)?opts.opacity:0.0 );

	},50);

}

site.ui.fadeTransitionEnd = function(evt) {

	loggr.log("site.ui.fadeTransitionEnd()");

	var opac = jqobj.css("opacity");
	if (opac<0.1) {
		// fade out complete
		loggr.warn(" -> FadeOut complete!");
		$(evt.originalTarget).css("display","none");
		$(evt.originalTarget).css("transition","none"); // TODO: restore..
		$(evt.originalTarget).css("opacity",1.0); // TODO: restore..
	} else {
		// fade in complete
	}

}

// ---> Loading

site.ui.showloading = function(message,submsg) {
	loggr.log("site.ui.showloading()");
	if (!message) { message = site.helpers.getRandomListEntry(site.data.strings.loading); }
	if (submsg) { message += "<br><span class='overlay_submsg'>"+submsg+"</span>"; }
	site.vars.isLoading = true;
	$("#loading.overlay_wrap .message").html(message);
	//$("#loading.overlay_wrap").fadeIn(500); // TODO: animation gpu powered..
	site.ui.fadeIn("#loading.overlay_wrap",500);
}


site.ui.hideloading = function() {
	loggr.log("site.ui.hideloading()");
	site.vars.isLoading = false;
	$("#loading.overlay_wrap .message").html("");
	//$("#loading.overlay_wrap").fadeOut(500); // TODO: animation gpu powered..
	site.ui.fadeOut("#loading.overlay_wrap",500);

}

// ---> Loadbar

site.ui.showLoadbar = function(optSelector) {

	loggr.log("site.ui.showLoadbar()");

	if (optSelector) {
		if (site.timeouts["fadeOutLoadbar_"+optSelector]) { clearTimeout(site.timeouts["fadeOutLoadbar_"+optSelector]); }
		$(optSelector +" .loadbar").css("opacity",1);
		$(optSelector +" .loadbar").css("display","block");
		//site.ui.fadeIn(".loadbar",250);
	} else {
		if (site.timeouts.fadeOutLoadbar) { clearTimeout(site.timeouts.fadeOutLoadbar); }
		$(".loadbar").css("opacity",1);
		$(".loadbar").css("display","block");
		//site.ui.fadeIn(".loadbar",250);
	}


}

site.ui.hideLoadbar = function(optSelector) {

	loggr.log("site.ui.hideLoadbar()");

	if (optSelector) {
		if (site.timeouts["fadeOutLoadbar_"+optSelector]) { clearTimeout(site.timeouts["fadeOutLoadbar_"+optSelector]); }
		site.timeouts["fadeOutLoadbar_"+optSelector] = setTimeout(function(){
				site.ui.fadeOut(optSelector +" .loadbar",250);
			}
		,1000);
	} else {
		if (site.timeouts.fadeOutLoadbar) { clearTimeout(site.timeouts.fadeOutLoadbar); }
		site.timeouts.fadeOutLoadbar = setTimeout(function(){
				site.ui.fadeOut(".loadbar",250);
			}
		,1000);
	}

}

// ---> Hoverbox (toasts!)

site.ui.showtoast = function(msg, timeInSec, topMode) {
	loggr.log("site.ui.showtoast()");
	loggr.log(" > "+ msg);
	if (msg && msg.trim().toLowerCase()=="abort") {
		// loggr.error(" > showtoast: 'abort', so where did this come frome?"); // debug
		return;
	}
	if (site.ui.ui_showtoast_hide) { clearTimeout(site.ui.ui_showtoast_hide); }
	if (!timeInSec) { timeInSec = 1.5; }
	var timeInMsec = timeInSec * 1000;
	if (topMode && !$("#overlay_toast").hasClass("top")) {
		$("#overlay_toast").addClass("top");
	}
	if (!topMode) {
		$(".fab").css("bottom",$("#overlay_toast").outerHeight()+16);
		$("#overlay_toast").removeClass("top");
	}
	$("#overlay_toast").html(msg);
	site.ui.fadeIn("#overlay_toast",250);
	site.ui.ui_showtoast_hide = setTimeout(function(){site.ui.hidetoast();},timeInMsec);
}

site.ui.hidetoast = function() {
	loggr.log("site.ui.hidetoast()");
	if (site.ui.ui_showtoast_hide) { clearTimeout(site.ui.ui_showtoast_hide); }
	site.ui.ui_showtoast_hide = null;
	site.ui.fadeOut("#overlay_toast",250,
		function(){
			if ($("#overlay_toast").hasClass("top")) {
				$("#overlay_toast").removeClass("top");
			}
		}
	);
	$(".fab").css("bottom",16);

}

site.ui.createtoast = function() {
	loggr.log("site.ui.createtoast()");
	var snip = document.createElement("div");
	snip.id = "overlay_toast";
	$("body").append(snip);
}

// ---> Longclick help

site.ui.setLongclickHelp = function() {

	loggr.debug("site.ui.setLongclickHelp()");

	// Bind actionbar longpress help stuff

	var selectors = [
		".actionbar .actions .action",
		".actionbar .actions paper-icon-button",
		".footer .button"
	];

	for (var i=0; i<selectors.length; i++) {

		var selector = selectors[i];

		loggr.log(" > Longclick: "+ selector +": "+ $(selector).length +" element(s)");

		$(selector).longClick(function(obj){

			loggr.log(" > LongClick: "+ (obj)?obj.title:"null?");

			// Checks
			if (!obj) { loggr.warn("Event: '"+ selector +"' taphold error: !ev"); return; }
			if (!obj.title) { return; }

			// Vib!
			if (!site.vars.vibrateBusy) {
				site.vars.vibrateBusy = true;
				navigator.notification.vibrate(50);
				setTimeout(function(){
					site.vars.vibrateBusy = false;
				},50);
			}

			// Info!
			try {
			site.ui.showtoast("Info: "+ obj.title);
			} catch(e) { loggr.warn(" > Attribute missing: 'title' on "+obj); }


		},250);

	}

}

// ---> Hacks... seufs

// Really ugly hack to prevent elements to stay ':active' when it's hidden WHEN it's in this state

site.ui.hackActiveCssRule = function() {

	loggr.log("site.ui.hackActiveCssRule()");
	//loggr.log(" > Don't.. we got polymer now");
	//return;

	// When android version >= 5.0: use normal :active method, else do stuff..
	// loggr.log("'"+ device.version +"'"+ typeof(device.version));
	try {

		var versionStr = device.version;
		loggr.log(" -> Android: "+ versionStr);

		// Parse float..
		if (versionStr.split(".").length>2) {
			// It's something like 5.1.1 so we can't directly parse it to a float, do magic first
			versionStr = versionStr.substr(0,versionStr.lastIndexOf("."));
			loggr.log(" --> Parsed: "+ versionStr);
		}
		versionStr = parseFloat(versionStr);

		// Okay check android version now
		if (versionStr>=5.0) {
			loggr.log(" > Android 5.0 or higher, no hackCss required");
			return; // <- leave things as they are
		}

	} catch(e) {
		loggr.error(" > site.ui.hackActiveCssRule().err parsing android version: "+ e);
	}

	// Change classnames..
	var actls = $(".activatablel");
	for (var i=0; i<actls.length; i++) {
		$(actls[i]).removeClass("activatablel");
		$(actls[i]).addClass("activatablelh");
	}
	var actds = $(".activatabled");
	for (var i=0; i<actds.length; i++) {
		$(actds[i]).removeClass("activatabled");
		$(actds[i]).addClass("activatabledh");
	}

	// Reset transitions
	$(".activatablelh,activatabledh").css("transition","none");

	// Work..

	var elems = [];

	elems = $(".activatablelh");

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
				if ($(thetarget).hasClass("activatablelh_active")) { return; }
				$(thetarget).addClass("activatablelh_active");
				//setTimeout(function(){$(thetarget).css("transition","background-color 500ms");},1);
			},25);
		};
		elem.ontouchend = function(evt) {
			if (site.timeouts.activatablel_ontouchstart) { clearTimeout(site.timeouts.activatable_ontouchstart); }
			if (site.timeouts.activatabled_ontouchstart) { clearTimeout(site.timeouts.activatabled_ontouchstart); }
			if (site.timeouts.activatablel_ontouchend) { clearTimeout(site.timeouts.activatablel_ontouchend); }
			site.timeouts.activatablel_ontouchend = setTimeout(function() {
				$("*").removeClass("activatablelh_active");
				$("*").removeClass("activatabledh_active");
				//$(".activatablel,activatabled").css("transition","background-color 500ms");
			},250);

		};
		elem.ontouchcancel = elem.ontouchend;
	}

	elems = $(".activatabledh");

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
				if ($(thetarget).hasClass("activatabledh_active")) { return; }
				$(thetarget).addClass("activatabledh_active");
				//setTimeout(function(){$(thetarget).css("transition","background-color 500ms");},1);
			},25);
		};
		elem.ontouchend = function(evt) {
			if (site.timeouts.activatablel_ontouchstart) { clearTimeout(site.timeouts.activatable_ontouchstart); }
			if (site.timeouts.activatabled_ontouchstart) { clearTimeout(site.timeouts.activatabled_ontouchstart); }
			if (site.timeouts.activatabled_ontouchend) { clearTimeout(site.timeouts.activatabled_ontouchend); }
			site.timeouts.activatabled_ontouchend = setTimeout(function() {
				$("*").removeClass("activatablelh_active");
				$("*").removeClass("activatabledh_active");
				//$(".activatablel,activatabled").css("transition","background-color 500ms");
			},250);
		};
		elem.ontouchcancel = elem.ontouchend;
	}

}
