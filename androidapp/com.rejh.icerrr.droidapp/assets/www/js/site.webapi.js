
// ---------------------------------------------
// BZZ

// ---> Compat

if (!console) { var console = {}; }
if (!console.log) { console.log = function(str) { }; }

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// LIFECYCLE

site.webapi = {};

// Load stations

site.webapi.loadStations = function() {
	
	console.log("site.webapi.loadStations()");
	
	var apiquery = JSON.stringify({
		
	});
	
}