
// ---------------------------------------------
// BZZ

// ---> Compat

if (!console) { var console = {}; }
if (!console.log) { console.log = function(str) { }; }

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// CHANNEL EDIT

site.chedit = {};

// ---> Init

site.chedit.init = function() {
	
	console.log("site.chedit.init()");
	
	// Add lifecycle history
	site.lifecycle.add_section_history("#editstation");
	
	// Show UI
	site.ui.gotosection("#editstation");
	
}