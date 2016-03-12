
// ---------------------------------------------
// BZZ

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// CONFIG

site.cfg = {};

// ---> Important stuff

// App
site.cfg.app_version = 0.355; // Note: change causes install/update to run at launch
site.cfg.debugging = true; // TODO: Deprecated, see option in settings

// Urls
// Note: url paths should end with / if folder || TODO: check this..
site.cfg.urls = {};
site.cfg.urls.webapp = "https://www.rejh.nl/icerrr/";
site.cfg.urls.api = "https://www.rejh.nl/icerrr/api/?";
site.cfg.urls.apiNoHttps = "http://www.rejh.nl/icerrr/api/?";
// site.cfg.urls.api = "http://66.249.81.202/icerrr/api/?"; // debug

// Paths (local storage)
// Note: storage paths should NOT end with / || TODO: check this..
site.cfg.paths = {};
site.cfg.paths.root = "Icerrr";
site.cfg.paths.json = "Icerrr/json";
site.cfg.paths.images = "Icerrr/images";
site.cfg.paths.logs = "Icerrr/logs";
site.cfg.paths.other = "Icerrr/other";

site.cfg.nomediapaths = [
	site.cfg.paths.images,
	site.cfg.paths.other
]

// Files
site.cfg.files = {};

site.cfg.files.maxImagesCached = 96;
site.cfg.files.ignoreFilenames = [
	".nomedia"
]

// Notifs

site.cfg.notifs = {};
site.cfg.notifs.notifID_mediaplayer = 1;
site.cfg.notifs.notifID_cast = 2;
site.cfg.notifs.notifID_snoozed = 3;


// ---> Defaults

site.cfg.defaults = {};

// Strings
site.cfg.defaults.strings = {};
site.cfg.defaults.strings.loading = ["Loading...","Hold on...","Just a sec...","Working...","Busy..."];

// Userprefs
site.cfg.defaults.userprefs = {}

// ---> Other stuff

site.cfg.chlist = {};
site.cfg.chlist.maxItemsPerBatch = 32;

site.cfg.googleapis = {};
site.cfg.googleapis.searchapi = {};
site.cfg.googleapis.searchapi.clientid = "178363199832-dfee06qa7o58vjontdeb0ku89qhm3c0f.apps.googleusercontent.com";

// More
site.cfg.illegalchars = new Array("!","@","#","$","%","^","&","*","+","=","[","]","{","}","'",'"',"<",">",",","?","|"); // for files, at least
