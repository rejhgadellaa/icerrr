
// ---------------------------------------------
// BZZ

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// CHANNEL EDIT

site.chedit = {};

// ---> Init

site.chedit.init = function(station_id_to_edit, askedAboutStationName, askedAboutNowplaying, checkedPlayability, isPlayable) {
	
	loggr.debug("------------------------------------");
	loggr.debug("site.chedit.init()");
	
	site.ui.hideloading();
	
	// Add lifecycle history
	site.lifecycle.add_section_history("#editstation");
	
	// Show UI
	site.ui.gotosection("#editstation");
	
	
	
	
}