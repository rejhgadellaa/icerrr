
// ---------------------------------------------
// BZZ

// ---> Compat

if (!console) { var console = {}; }
if (!console.log) { console.log = function(str) { }; }

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// CONFIG

site.cfg = {};

// Urls
// Note: url paths should end with / if folder || TODO: check this..
site.cfg.urls = {};
site.cfg.urls.webapp = "http://94.208.216.239/icerrr/";
site.cfg.urls.api = "http://94.208.216.239/icerrr/api/?";

// Paths (local storage)
// Note: storage paths should NOT end with / || TODO: check this..
site.cfg.paths = {};
site.cfg.paths.root = "Icerrr";
site.cfg.paths.json = "__ROOT__/json";
site.cfg.paths.images = "__ROOT__/images";
site.cfg.paths.logs = "__ROOT__/logs";
site.cfg.paths.other = "__ROOT__/other";

// Files
site.cfg.files = {};
