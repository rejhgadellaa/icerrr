
// ---------------------------------------------
// BZZ

// ---> Compat

if (!console) { var console = {}; }
if (!console.log) { console.log = function(str) { }; }

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// INSTALL

site.installer = {};

/*	
	NOTES: DOES IT NEED TO DO..?
	
	* Well, install stuff...
	* And maybe run an update...
	* And verrify if everything is installed correctly...
	
	1. WHAT DOES IT NEED TO INSTALL ?
	* Storage as specified in site.cfg.paths
	* Database? Do we have one?
	* Strings! YES! --> site.data.strings || TODO: No json/api for this
	
	2. WHAT NEEDS TO BE UPDATED ?
	* Radio stations?
	* Strings! YES! --> site.data.strings || TODO: No json/api for this
	* ...
	
	3. WHAT NEEDS TO BE VERIFIED ?
	* Well Oantinken had this problem with cookies getting lost ondestroy() 
	  or reboot or something... It LOOKS like this is fixed since I have no
	  such problem in apps like ScreenDoodle, ShortIt, etc.
	
	
*/

// ---> Step 1

site.installer.init = function() {
	
	console.log("site.installer.init()");
	
	
	
}

// ---------------------------------------------
// UPDATE

// ---------------------------------------------
// VERIFY