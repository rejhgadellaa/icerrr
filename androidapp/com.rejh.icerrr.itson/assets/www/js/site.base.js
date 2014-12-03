

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// BASE

// nuff said.

site.vars = {};
site.data = {};
site.session = {};
site.loops = {}; // <- settimeouts that repeat || TODO: will be cleared on pause?
site.timeouts = {}; // <- settimeouts that DO NOT repeat || TODO: will be cleared on pause?
