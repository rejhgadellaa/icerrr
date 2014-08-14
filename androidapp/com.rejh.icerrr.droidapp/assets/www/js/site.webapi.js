
// ---------------------------------------------
// BZZ

// ---> Compat

if (!console) { var console = {}; }
if (!console.log) { console.log = function(str) { }; }

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// WEBAPI

site.webapi = {};

// TODO: implement timeout!

// ---> Stuff

// Execute action
// - Returns: cb(results) || TODO: raw json or only json['data'] --> nope, it's going to be json (with data and info fields)

site.webapi.exec = function(apiaction,apiquerystr,cb,errcb) {
	
	console.log("site.webapi.exec()");
	
	// Parse apiquerystr || TODO: Important: how to handle urlencoding.. doing it here.. now..
	if (!apiquerystr) { apiquerystr = "{}"; }
	var apiqueryobj = JSON.parse(apiquerystr);
	var apiquery = encodeURIComponent(JSON.stringify(apiqueryobj));
	
	var apiurl = site.cfg.urls.api +"a="+ apiaction +"&q="+ apiquery +"&cache="+(new Date().getTime());
	console.log(" > "+apiurl);
	console.log(" > "+apiquerystr);
	
	$.getJSON(apiurl, function(results) {
		// ok
		if (results["error"]) {
			errcb({code:-1,message:results["errormsg"]});
			return;
		} else {
			results.info.size_kb = Math.ceil((JSON.stringify(results).length*8)/1024/10);
			console.log(" > site.webapi.exec().results: ~"+ results.info.size_kb +" kb");
			cb(results);
			return;
		}
	})
	.error(function(jqXHR, textStatus, errorThrown) { 
		// error
		console.error(" > site.webapi.exec().Error: "+ textStatus +", "+ errorThrown);
		errcb({jqXHR:jqXHR, textStatus:textStatus, errorThrown:errorThrown, code:-1, message:errorThrown, extra_fields:["jqXHR","textStatus","errorThrown"]}); 
	});
	
}

// Load stations

site.webapi.loadStations = function() {
	
	console.log("site.webapi.loadStations()");
	
	var apiquery = JSON.stringify({
		
	});
	
}