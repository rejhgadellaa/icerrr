
// ---------------------------------------------
// BZZ

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// CHANNEL LIST

site.detailstation = {};

// ---> Init

site.detailstation.init = function(resultitem, forceRedraw) {
	
	loggr.debug("------------------------------------");
	loggr.debug("site.detailstation.init()");
	
	site.ui.hideloading();
	
	// Checks..
	if (!resultitem) { loggr.log(" > !resultitem"); return; }
	if (!resultitem.station_id) { loggr.log(" > !resultitem.station_id"); return; }
	
	// Station id..
	site.detailstation.station_id = resultitem.station_id;
	
	// Station..
	site.detailstation.station = site.helpers.session.getStationById(resultitem.station_id);
	
	// Add lifecycle history
	site.lifecycle.add_section_history("#detailstation");
	
	// Show UI
	site.ui.gotosection("#detailstation");
	
	// Resume + Pause callback for #home
	// Best for last :)
	site.lifecycle.addOnPauseCb(site.chlist.onpause);
	site.lifecycle.addOnResumeCb(site.chlist.onresume);
	
	// Update data..
	site.detailstation.updatedata();
	
}

// PAUSE RESUME
// - Important stuff: this is function that will be called whenever site.ui.gotosection is called

site.detailstation.onpause = function() {
	loggr.debug("site.chedit.onpause()");
}

site.detailstation.onresume = function() {
	loggr.log("site.chedit.site.home.()");
}

// ---> Update Data

site.detailstation.updatedata = function() {
	
	// For now just do play button -> selectstation
	// TODO: yea, do stuff..
	$("#detailstation .fab_header").off("click");
	$("#detailstation .fab_header").on("click",function(evt) {
		var tmpobj = {station_id:site.detailstation.station_id};
		site.chlist.selectstation(tmpobj);
	});
	
	$("#detailstation .recentlyplayed").off("click");
	$("#detailstation .recentlyplayed").on("click",function(evt) {
		alert("Not available at this moment :(");
	});
	
	$("#detailstation .editdetails").off("click");
	$("#detailstation .editdetails").on("click",function(evt) {
		site.chedit.init(site.detailstation.station_id);
	});
}

















