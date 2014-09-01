
// ---------------------------------------------
// BZZ

// ---> Loggr

loggr = {};

// ---------------------------------------------
// LOGGER

// ---> Config

loggr.cfg = {};
loggr.cfg.maxlines = 512;
loggr.cfg.newline = "\n";

// Other

loggr.loglines = ["-- BEGIN OF LOGGR --"];
loggr.logtypes = [null];

// ---> Log

loggr.error = function(str,opts) {
	if (!opts) { opts = {}; }
	opts.type = "error";
	loggr.log(str,opts);
	loggr.upload();
}

loggr.warn = function(str,opts) {
	if (!opts) { opts = {}; }
	opts.type = "warn";
	loggr.log(str,opts);
	loggr.save();
}

loggr.debug = function(str,opts) {
	if (!opts) { opts = {}; }
	opts.type = "debug";
	loggr.log(str,opts);
}

loggr.info = function(str,opts) {
	if (!opts) { opts = {}; }
	opts.type = "info";
	loggr.log(str,opts);
}



loggr.log = function(str,opts) {
	
	if (!str) { str = ""; }
	
	if (!opts) { opts = {}; }
	if (!opts.type) { opts.type = "log"; }
	
	switch(opts.type) {
		case "error":
			console.error(str);
			break;
		case "warn":
			console.warn(str);
			break;
		case "debug":
			console.debug(str);
			break;
		case "info":
			console.info(str);
			break;
		default:
			console.log(str);
			break;
	}
	
	/**/
	
	if (!str) { return; }
	
	str = new Date().format("Y:m:d H:i:s") +"    "+ str;
	
	loggr.loglines.push(str);
	loggr.logtypes.push(opts.type);
	
	while(loggr.loglines.length>loggr.cfg.maxlines) {
		loggr.loglines.shift();
		loggr.logtypes.shift();
	}
	
	if (opts.save) {
		loggr.save();
	}
	
}

// ---> Makestring

loggr.gettext = function() {
	return loggr.loglines.join(loggr.cfg.newline);
}

// ---> Get html

loggr.gethtml = function(maxlines) {
	
	if (!maxlines) { maxlines = loggr.loglines.length; }
	
	var html = "";
	
	for (var i in loggr.loglines) {
		// if (loggr.loglines.length-i > maxlines) { continue; } // TODO: Implement
		var logline = loggr.loglines[i];
		var logtype = loggr.logtypes[i];
		if (typeof logline !=="string") { continue; }
		try { 
			logline = logline.split(" > ").join("&nbsp;&gt;&nbsp;"); 
			logline = logline.split("  ").join("&nbsp;&nbsp;"); 
			logline = logline.split(">").join("&gt;");
			logline = logline.split("<").join("&lt;");
			logline = logline.split(loggr.cfg.newline).join("<br>");
		} catch(e) { }
		switch(logtype) {
			case "error":
				html += "<span style='color:#c00'>"+ logline +"</span><br>\n";
				break;
			case "warn":
				html+= "<span style='color:#c60'>"+ logline +"</span><br>\n";
			case "debug":
				html+= "<span style='color:#333'>"+ logline +"</span><br>\n";
			case "info":
				html+= "<span style='color:#666'>"+ logline +"</span><br>\n";
			default:
				html+= "<span style='color:#999'>"+ logline +"</span><br>\n";
		}
	}
	
	return html;
	
}

// ---> Save

loggr.save = function() {
	
	var text = loggr.gettext();
	
	// Write logs
	site.storage.writefile(site.cfg.paths.logs,"local.site_logger.txt",JSON.stringify(text),
		function() {
			loggr.log("loggr.save > OK");
		},
		function(err) {
			loggr.warn("loggr.save > FAILED");
		}
	);

}

// ---> Upload

loggr.upload = function() {
	
	// TODO: Not ready for primetime
	
	if (loggr.uploading) {
		console.warn("loggr.uploading==true");
		return;
	}
	loggr.uploading = true;
	
	loggr.save();
	
	var html = loggr.gethtml(512); // last 512 lines
	var text = loggr.gettext
	
	loggr.log(" >> "+ html.length)
	
	// Webapi time!
	var apiqueryobj = {
		"post":"log"
	}
	var data = {
		"log_id":site.helpers.getUniqueID(),
		"log_html":html,
		"log_text":text
	}
	
	var apiaction = "post";
	var apiquerystr = JSON.stringify(apiqueryobj);
	
	site.webapi.post(apiaction,apiquerystr,data,
		function(data) {
			if (data["error"]) {
				loggr.warn("loggr.upload().OK");
				loggr.warn(data["error"]);
			} else {
				loggr.log("loggr.upload().OK");
				loggr.uploading = false;
			}
		},
		function(error) {
			if (error.message) { loggr.log(error.message); }
			else { loggr.log(error); }
		}
	);
	
	/**/
	
}

// ---------------------------------------------
// LOGGER : MORE

// ---> Override console.log, warn, error

/*
if (console) {
	
	// Let's assume that if console exists, we have .log also
	
	// Copy original objs
	loggr.console = jQuery.extend(true, {}, console);
	
	// Override
	console.log = loggr.log
	console.warn = loggr.warn;
	console.error = loggr.error;
	
}
/**/

if (!console) { var console = {}; }
if (!console.log) { console.log = function(str) { }; }

window.onerror = function(message, file, line, column, errorObj) {
    loggr.error(message+"\n > "+file+" at line "+line);
	if (errorObj) {
		loggr.error(errorObj.stack);
	}
}


















