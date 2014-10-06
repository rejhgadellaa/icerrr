
// ---------------------------------------------
// BZZ

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// CONFIG

site.cfg = {};

// ---> Important stuff

// App
site.cfg.app_version = 0.075; // TODO: Note: app bump causes install to run at launch

// Urls
// Note: url paths should end with / if folder || TODO: check this..
site.cfg.urls = {};
site.cfg.urls.webapp = "http://www.rejh.nl/icerrr/";
site.cfg.urls.api = "http://www.rejh.nl/icerrr/api/?";

// Paths (local storage)
// Note: storage paths should NOT end with / || TODO: check this..
site.cfg.paths = {};
site.cfg.paths.root = "Icerrr";
site.cfg.paths.json = "Icerrr/json";
site.cfg.paths.images = "Icerrr/images";
site.cfg.paths.logs = "Icerrr/logs";
site.cfg.paths.other = "Icerrr/other";

// Files
site.cfg.files = {};

// Notifs

site.cfg.notifs = {};
site.cfg.notifs.notifID_mediaplayer = 1;
site.cfg.notifs.notifID_cast = 2;


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
