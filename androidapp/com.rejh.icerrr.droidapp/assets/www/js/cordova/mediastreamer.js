/*
* 
* by REJH Gadellaa
*  MIT license
*
*/

(function() {
		  
	console.log("Load plugin: MediaStreamer");
		  
    /* This increases plugin compatibility */
    // var cordovaRef = window.PhoneGap || window.Cordova || window.cordova; // old to new fallbacks
	cordovaRef = window.cordova;

    /**
    * The Java to JavaScript Gateway 'magic' class 
    */
    function MediaStreamer() { }

    /**
    * Start player
    */
    MediaStreamer.prototype.play = function(stream_url, win, fail) {
		console.log("MediaStreamer.prototype.play()");
        cordova.exec(win, fail, "MediaStreamer", "play", [stream_url]);
    };

    /**
    * Stop player
    */
    MediaStreamer.prototype.stop = function(win, fail) {
		console.log("MediaStreamer.prototype.stop()");
        cordova.exec(win, fail, "MediaStreamer", "stop", []);
    };

    /**
    * Stop player
    */
    MediaStreamer.prototype.getStatus = function(win, fail) {
		console.log("MediaStreamer.prototype.getStatus()");
        cordova.exec(win, fail, "MediaStreamer", "getStatus", []);
    };
	
	/**
	* Register the plugin
	*/
	try {
		window.mediaStreamer = new MediaStreamer();
	} catch(e) { console.error("MediaStreamer could not be loaded"); console.error(e); }

})(); 