if(!site){var site={};}
site.ui={};site.ui.init=function(){loggr.log("site.ui.init()");if(!site.session.ui_pause_callbacks){site.session.ui_pause_callbacks=[];}
if(!site.session.ui_resume_callbacks){site.session.ui_resume_callbacks=[];}
$(".actionbar .icon_app").on("click",function(){site.lifecycle.onBackButton});site.ui.hackActiveCssRule();}
site.ui.gotosection=function(selector){loggr.log("site.ui.gotosection(): "+selector);site.vars.previousSection=site.vars.currentSection;site.vars.currentSection=selector;site.lifecycle.add_section_history(selector);if(selector!="#home"&&site.home.overflowMenuIsVisible){site.home.dismissOverflowMenu();}
if(!site.session.ui_pause_callbacks){site.session.ui_pause_callbacks=[];}
while(site.session.ui_pause_callbacks.length>0){var func=site.session.ui_pause_callbacks.shift();try{func();}catch(e){}}
if(!site.session.ui_resume_callbacks){site.session.ui_resume_callbacks=[];}
while(site.session.ui_resume_callbacks.length>0){site.session.ui_resume_callbacks.shift();}
if(site.timeouts.gotosection){clearTimeout(site.timeouts.gotosection);}
$("*").removeClass("activatablelh_active");$("*").removeClass("activatabledh_active");$("*").removeClass("activatablebh_active");$("*").removeClass("activatablewh_active");if(selector!="#home"){$("#home").css("display","none");}
if(site.vars.previousSection=="#splash"){$(site.vars.currentSection+" .main").css("height",$(window).height()-56);$(selector).css("display","block");$("#splash").on("transitionend webkitTransitionEnd",function(evt){$("#splash").off("transitionend webkitTransitionEnd");site.ui.fadeOut("#splash",250);});var translate="translate3d(0px,"+(-($(window).height()-$(".actionbar").height()))+"px,0px)";$("#splash").css({"transform":translate,"-webkit-transform":translate});}else{$("section").css("display","none");$(selector).css("display","block");}
loggr.log(" > "+selector+" display: "+$(selector).css("display"));setTimeout(site.lifecycle.onResize,10);site.ui.setLongclickHelp();}
site.ui.initFabScroll=function(selector){loggr.log("site.ui.initFabScroll()");if(!site.vars.fabscrolls){site.vars.fabscrolls={};}
if(!site.vars.fabscrolls[selector]){site.vars.fabscrolls[selector]={};site.vars.fabscrolls[selector].scrolltop=0;site.vars.fabscrolls[selector].time=0;site.vars.fabscrolls[selector].lastDelata=0;}
$(".fab").css("bottom",16);if(site.ui.ui_showtoast_hide&&selector!="#home"){$(selector+" .fab").css("bottom",$("#overlay_toast").outerHeight()+16);}
$(".main").off('scroll');$(selector+" .main").on('scroll',function(e){delta=site.vars.fabscrolls[selector].scrolltop-$(selector+" .main").scrollTop();if(!site.vars.fabscrolls[selector].lastDelata){site.vars.fabscrolls[selector].lastDelata=-(delta);}
var selScrollHeight=$(selector+" .main")[0].scrollHeight;var selHeight=$(selector+" .main").height();var selScrollTop=$(selector+" .main").scrollTop();if(selScrollHeight<=(selHeight+selScrollTop)){if(site.ui.ui_showtoast_hide){$(selector+" .fab").css("bottom",$("#overlay_toast").outerHeight()+16);}else{$(selector+" .fab").css("bottom",16);}}
else if(delta>0&&site.vars.fabscrolls[selector].lastDelata<0){if(site.ui.ui_showtoast_hide){$(selector+" .fab").css("bottom",$("#overlay_toast").outerHeight()+16);}else{$(selector+" .fab").css("bottom",16);}}
else if(delta<0&&site.vars.fabscrolls[selector].lastDelata>0){$(selector+" .fab").css("bottom",-64);}
site.vars.fabscrolls[selector].scrolltop=$(selector+" .main").scrollTop();site.vars.fabscrolls[selector].lastDelata=delta;site.vars.fabscrolls[selector].time=new Date().getTime();});}
site.ui.fadeIn=function(selector,timems,cb,opts){loggr.log("site.ui.fadeIn(): "+selector);var jqobj=$(selector);if(!jqobj){loggr.warn(" > !jqobj");return;}
if(jqobj.length<1){loggr.warn(" > jqobj < 1");return;}
if(!timems){timems=500;}
if(!opts){opts={};}
if(!site.vars.fadeOuts){site.vars.fadeOuts={};}
if(site.vars.fadeOuts[selector]&&site.vars.fadeOuts[selector].isBusy){loggr.warn(" > FadeOut already running on selector: "+selector+", cancel it",{dontsave:true});clearTimeout(site.vars.fadeOuts[selector].timeout);site.vars.fadeOuts[selector].isBusy=false;}
if(!site.vars.fadeIns){site.vars.fadeIns={};}
if(site.vars.fadeIns[selector]&&site.vars.fadeIns[selector].isBusy){loggr.warn(" > FadeIn already active: "+selector,{dontsave:true});if(new Date().getTime()>site.vars.fadeIns[selector].timeEnd){loggr.warn(" -> Should have ended.. fadeIn anyway",{dontsave:true});clearTimeout(site.vars.fadeIns[selector].timeout);site.vars.fadeIns[selector].isBusy=false;}else{return;}}
site.vars.fadeIns[selector]={timeBgn:new Date().getTime(),timeEnd:new Date().getTime()+timems,timeDuration:timems,isBusy:true,timeout:null,originalTransition:(jqobj.css("transition"))?jqobj.css("transition"):"none",originalOpacity:(jqobj.css("opacity"))?jqobj.css("opacity"):1.0};jqobj.css("opacity",0.0);if(site.vars.fadeOuts[selector]&&site.vars.fadeOuts[selector].timeout){clearTimeout(site.vars.fadeOuts[selector].timeout);}
if(site.vars.fadeIns[selector].timeout){clearTimeout(site.vars.fadeIns[selector].timeout);}
site.vars.fadeIns[selector].timeout=setTimeout(function(){jqobj.css("transition","opacity "+timems+"ms");jqobj.css("display","block");if(site.vars.fadeIns[selector].timeout){clearTimeout(site.vars.fadeIns[selector].timeout);}
site.vars.fadeIns[selector].timeout=setTimeout(function(){site.vars.fadeIns[selector].timeout=setTimeout(function(){loggr.warn(" -> fadeIn "+selector+" transitionend",{dontsave:true});if(jqobj.css("opacity")<=0.9){loggr.warn(" -> opacity<=0.9?! "+selector+" transitionend",{dontsave:true});}
site.vars.fadeIns[selector].isBusy=false;loggr.log("site.ui.fadeIn() > FadeIns: "+selector+" "+site.vars.fadeIns[selector],{dontupload:true});if(cb){cb();}},timems+50);jqobj.css("opacity",(opts.opacity)?opts.opacity:1.0);},50);},50);}
site.ui.fadeOut=function(selector,timems,cb,opts){if($(selector).css("display")=="none"){}
loggr.log("site.ui.fadeOut(): "+selector);var jqobj=$(selector);if(!jqobj){loggr.warn(" > !jqobj");return;}
if(jqobj.length<1){loggr.warn(" > jqobj < 1");return;}
if(!timems){timems=500;}
if(!opts){opts={};}
if(!site.vars.fadeIns){site.vars.fadeIns={};}
if(site.vars.fadeIns[selector]&&site.vars.fadeIns[selector].isBusy){loggr.warn(" > FadeIn already running on selector: "+selector+", cancel it",{dontsave:true});clearTimeout(site.vars.fadeIns[selector].timeout)
site.vars.fadeIns[selector].isBusy=false;}
if(!site.vars.fadeOuts){site.vars.fadeOuts={};}
if(site.vars.fadeOuts[selector]&&site.vars.fadeOuts[selector].isBusy){loggr.warn(" > FadeOut already active: "+selector,{dontsave:true});clearTimeout(site.vars.fadeOuts[selector].timeout)
}
site.vars.fadeOuts[selector]={timeBgn:new Date().getTime(),timeEnd:new Date().getTime()+timems,timeDuration:timems,isBusy:true,timeout:null};jqobj.css("transition","opacity "+timems+"ms");if(site.vars.fadeIns[selector]&&site.vars.fadeIns[selector].timeout){clearTimeout(site.vars.fadeIns[selector].timeout);}
if(site.vars.fadeOuts[selector].timeout){clearTimeout(site.vars.fadeOuts[selector].timeout);}
site.vars.fadeOuts[selector].timeout=setTimeout(function(){site.vars.fadeOuts[selector].timeout=setTimeout(function(){loggr.warn(" -> fadeOut "+selector+" transitionend",{dontsave:true});if(jqobj.css("opacity")>=0.1){loggr.warn(" -> opacity<=0.9?! "+selector+" transitionend",{dontsave:true});}
jqobj.css("display","none");jqobj.css("transition","none");jqobj.css("opacity",1.0);site.vars.fadeOuts[selector].isBusy=false;loggr.log("site.ui.fadeOut() > FadeOuts: "+selector+" "+site.vars.fadeOuts[selector],{dontupload:true});if(cb){cb();}},timems+50);jqobj.css("opacity",(opts.opacity)?opts.opacity:0.0);},50);}
site.ui.fadeTransitionEnd=function(evt){loggr.log("site.ui.fadeTransitionEnd()");var opac=jqobj.css("opacity");if(opac<0.1){loggr.warn(" -> FadeOut complete!");$(evt.originalTarget).css("display","none");$(evt.originalTarget).css("transition","none");$(evt.originalTarget).css("opacity",1.0);}else{}}
site.ui.showloading=function(message,submsg){loggr.log("site.ui.showloading()");if(!message){message=site.helpers.getRandomListEntry(site.data.strings.loading);}
if(submsg){message+="<br><span class='overlay_submsg'>"+submsg+"</span>";}
site.vars.isLoading=true;$("#loading.overlay_wrap .message").html(message);site.ui.fadeIn("#loading.overlay_wrap",500);}
site.ui.hideloading=function(){loggr.log("site.ui.hideloading()");site.vars.isLoading=false;$("#loading.overlay_wrap .message").html("");site.ui.fadeOut("#loading.overlay_wrap",500);}
site.ui.showLoadbar=function(optSelector){loggr.log("site.ui.showLoadbar()");if(optSelector){if(site.timeouts["fadeOutLoadbar_"+optSelector]){clearTimeout(site.timeouts["fadeOutLoadbar_"+optSelector]);}
$(optSelector+" .loadbar").css("opacity",1);$(optSelector+" .loadbar").css("display","block");}else{if(site.timeouts.fadeOutLoadbar){clearTimeout(site.timeouts.fadeOutLoadbar);}
$(".loadbar").css("opacity",1);$(".loadbar").css("display","block");}}
site.ui.hideLoadbar=function(optSelector){loggr.log("site.ui.hideLoadbar()");if(optSelector){if(site.timeouts["fadeOutLoadbar_"+optSelector]){clearTimeout(site.timeouts["fadeOutLoadbar_"+optSelector]);}
site.timeouts["fadeOutLoadbar_"+optSelector]=setTimeout(function(){site.ui.fadeOut(optSelector+" .loadbar",250);},1000);}else{if(site.timeouts.fadeOutLoadbar){clearTimeout(site.timeouts.fadeOutLoadbar);}
site.timeouts.fadeOutLoadbar=setTimeout(function(){site.ui.fadeOut(".loadbar",250);},1000);}}
site.ui.showtoast=function(msg,timeInSec,topMode){loggr.log("site.ui.showtoast()");loggr.log(" > "+msg);if(msg&&msg.trim().toLowerCase()=="abort"){return;}
if(site.ui.ui_showtoast_hide){clearTimeout(site.ui.ui_showtoast_hide);}
if(!timeInSec){timeInSec=1.5;}
var timeInMsec=timeInSec*1000;if(topMode&&!$("#overlay_toast").hasClass("top")){$("#overlay_toast").addClass("top");}
if(!topMode){$(".fab").css("bottom",$("#overlay_toast").outerHeight()+16);$("#overlay_toast").removeClass("top");}
$("#overlay_toast").html(msg);site.ui.fadeIn("#overlay_toast",250);site.ui.ui_showtoast_hide=setTimeout(function(){site.ui.hidetoast();},timeInMsec);}
site.ui.hidetoast=function(){loggr.log("site.ui.hidetoast()");if(site.ui.ui_showtoast_hide){clearTimeout(site.ui.ui_showtoast_hide);}
site.ui.ui_showtoast_hide=null;site.ui.fadeOut("#overlay_toast",250,function(){if($("#overlay_toast").hasClass("top")){$("#overlay_toast").removeClass("top");}});$(".fab").css("bottom",16);}
site.ui.createtoast=function(){loggr.log("site.ui.createtoast()");var snip=document.createElement("div");snip.id="overlay_toast";$("body").append(snip);}
site.ui.setLongclickHelp=function(){loggr.debug("site.ui.setLongclickHelp()");var selectors=[".actionbar .actions .action",".actionbar .actions paper-icon-button",".footer .button"];for(var i=0;i<selectors.length;i++){var selector=selectors[i];loggr.log(" > Longclick: "+selector+": "+$(selector).length+" element(s)");$(selector).longClick(function(obj){loggr.log(" > LongClick: "+(obj)?obj.title:"null?");if(!obj){loggr.warn("Event: '"+selector+"' taphold error: !ev");return;}
if(!obj.title){return;}
if(!site.vars.vibrateBusy){site.vars.vibrateBusy=true;navigator.notification.vibrate(50);setTimeout(function(){site.vars.vibrateBusy=false;},50);}
try{site.ui.showtoast("Info: "+obj.title);}catch(e){loggr.warn(" > Attribute missing: 'title' on "+obj);}},250);}}
site.ui.hackActiveCssRule=function(){loggr.log("site.ui.hackActiveCssRule()");try{var versionStr=device.version;loggr.log(" -> Android: "+versionStr);if(versionStr.split(".").length>2){versionStr=versionStr.substr(0,versionStr.lastIndexOf("."));loggr.log(" --> Parsed: "+versionStr);}
versionStr=parseFloat(versionStr);if(versionStr>=5.0){loggr.log(" > Android 5.0 or higher, no hackCss required");return; }}catch(e){loggr.error(" > site.ui.hackActiveCssRule().err parsing android version: "+e);}
var actls=$(".activatablel");for(var i=0;i<actls.length;i++){$(actls[i]).removeClass("activatablel");$(actls[i]).addClass("activatablelh");}
var actds=$(".activatabled");for(var i=0;i<actds.length;i++){$(actds[i]).removeClass("activatabled");$(actds[i]).addClass("activatabledh");}
var actds=$(".activatableb");for(var i=0;i<actds.length;i++){$(actds[i]).removeClass("activatableb");$(actds[i]).addClass("activatablebh");}
var actds=$(".activatablew");for(var i=0;i<actds.length;i++){$(actds[i]).removeClass("activatablew");$(actds[i]).addClass("activatablewh");}
$(".activatablelh,activatabledh,activatablebh,activatablewh").css("transition","none");var elems=[];elems=$(".activatablelh");for(var i in elems){var elem=elems[i];elem.ontouchstart=function(evt){if(!evt.target){return;}
var foundTheActualTarget=false;var thetarget=evt.target;var whilenum=0;while(!foundTheActualTarget){if(!thetarget){break;}
if(thetarget.className){if(thetarget.className.indexOf("activatablel")>=0){foundTheActualTarget=true;break;}}
thetarget=thetarget.parentNode;whilenum++;if(whilenum>256){break;}}
if(site.timeouts.activatablel_ontouchstart){clearTimeout(site.timeouts.activatable_ontouchstart);}
if(site.timeouts.activatabled_ontouchstart){clearTimeout(site.timeouts.activatabled_ontouchstart);}
site.timeouts.activatablel_ontouchstart=setTimeout(function(){if($(thetarget).hasClass("activatablelh_active")){return;}
$(thetarget).addClass("activatablelh_active");},25);};elem.ontouchend=function(evt){if(site.timeouts.activatablel_ontouchstart){clearTimeout(site.timeouts.activatable_ontouchstart);}
if(site.timeouts.activatabled_ontouchstart){clearTimeout(site.timeouts.activatabled_ontouchstart);}
if(site.timeouts.activatablel_ontouchend){clearTimeout(site.timeouts.activatablel_ontouchend);}
site.timeouts.activatablel_ontouchend=setTimeout(function(){$("*").removeClass("activatablelh_active");$("*").removeClass("activatabledh_active");$("*").removeClass("activatablebh_active");$("*").removeClass("activatablewh_active");},250);};elem.ontouchcancel=elem.ontouchend;}
elems=$(".activatabledh");for(var i in elems){var elem=elems[i];elem.ontouchstart=function(evt){if(!evt.target){return;}
var foundTheActualTarget=false;var thetarget=evt.target;var whilenum=0;while(!foundTheActualTarget){if(!thetarget){break;}
if(thetarget.className){if(thetarget.className.indexOf("activatabled")>=0){foundTheActualTarget=true;break;}}
thetarget=thetarget.parentNode;whilenum++;if(whilenum>256){break;}}
if(site.timeouts.activatablel_ontouchstart){clearTimeout(site.timeouts.activatable_ontouchstart);}
if(site.timeouts.activatabled_ontouchstart){clearTimeout(site.timeouts.activatabled_ontouchstart);}
site.timeouts.activatabled_ontouchstart=setTimeout(function(){if($(thetarget).hasClass("activatabledh_active")){return;}
$(thetarget).addClass("activatabledh_active");},25);};elem.ontouchend=function(evt){if(site.timeouts.activatablel_ontouchstart){clearTimeout(site.timeouts.activatable_ontouchstart);}
if(site.timeouts.activatabled_ontouchstart){clearTimeout(site.timeouts.activatabled_ontouchstart);}
if(site.timeouts.activatabled_ontouchend){clearTimeout(site.timeouts.activatabled_ontouchend);}
site.timeouts.activatabled_ontouchend=setTimeout(function(){$("*").removeClass("activatablelh_active");$("*").removeClass("activatabledh_active");$("*").removeClass("activatablebh_active");$("*").removeClass("activatablewh_active");},250);};elem.ontouchcancel=elem.ontouchend;}
elems=$(".activatablebh");for(var i in elems){var elem=elems[i];elem.ontouchstart=function(evt){if(!evt.target){return;}
var foundTheActualTarget=false;var thetarget=evt.target;var whilenum=0;while(!foundTheActualTarget){if(!thetarget){break;}
if(thetarget.className){if(thetarget.className.indexOf("activatableb")>=0){foundTheActualTarget=true;break;}}
thetarget=thetarget.parentNode;whilenum++;if(whilenum>256){break;}}
if(site.timeouts.activatablel_ontouchstart){clearTimeout(site.timeouts.activatable_ontouchstart);}
if(site.timeouts.activatabled_ontouchstart){clearTimeout(site.timeouts.activatabled_ontouchstart);}
site.timeouts.activatabled_ontouchstart=setTimeout(function(){if($(thetarget).hasClass("activatablebh_active")){return;}
$(thetarget).addClass("activatablebh_active");},25);};elem.ontouchend=function(evt){if(site.timeouts.activatablel_ontouchstart){clearTimeout(site.timeouts.activatable_ontouchstart);}
if(site.timeouts.activatabled_ontouchstart){clearTimeout(site.timeouts.activatabled_ontouchstart);}
if(site.timeouts.activatabled_ontouchend){clearTimeout(site.timeouts.activatabled_ontouchend);}
site.timeouts.activatabled_ontouchend=setTimeout(function(){$("*").removeClass("activatablelh_active");$("*").removeClass("activatabledh_active");$("*").removeClass("activatablebh_active");$("*").removeClass("activatablewh_active");},250);};elem.ontouchcancel=elem.ontouchend;}
elems=$(".activatablewh");for(var i in elems){var elem=elems[i];elem.ontouchstart=function(evt){if(!evt.target){return;}
var foundTheActualTarget=false;var thetarget=evt.target;var whilenum=0;while(!foundTheActualTarget){if(!thetarget){break;}
if(thetarget.className){if(thetarget.className.indexOf("activatablew")>=0){foundTheActualTarget=true;break;}}
thetarget=thetarget.parentNode;whilenum++;if(whilenum>256){break;}}
if(site.timeouts.activatablel_ontouchstart){clearTimeout(site.timeouts.activatable_ontouchstart);}
if(site.timeouts.activatabled_ontouchstart){clearTimeout(site.timeouts.activatabled_ontouchstart);}
site.timeouts.activatabled_ontouchstart=setTimeout(function(){if($(thetarget).hasClass("activatablewh_active")){return;}
$(thetarget).addClass("activatablewh_active");},25);};elem.ontouchend=function(evt){if(site.timeouts.activatablel_ontouchstart){clearTimeout(site.timeouts.activatable_ontouchstart);}
if(site.timeouts.activatabled_ontouchstart){clearTimeout(site.timeouts.activatabled_ontouchstart);}
if(site.timeouts.activatabled_ontouchend){clearTimeout(site.timeouts.activatabled_ontouchend);}
site.timeouts.activatabled_ontouchend=setTimeout(function(){$("*").removeClass("activatablelh_active");$("*").removeClass("activatabledh_active");$("*").removeClass("activatablebh_active");$("*").removeClass("activatablewh_active");},250);};elem.ontouchcancel=elem.ontouchend;}}