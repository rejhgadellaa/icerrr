addEventListener("load",function(event){document.getElementsByTagName("body")[0].className+=" "+
(navigator.userAgent.match(/Android/)?"android":"ios");});document.write('<script type="text/javascript" charset="utf-8" src="'+
(navigator.userAgent.match(/Android/)?"js/cordova/cordova-2.7.0-android-min.js":"js/cordova/cordova-2.7.0-ios.js")+'"></script>');