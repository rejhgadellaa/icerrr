
// ---------------------------------------------
// BZZ

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

// ---> Data

site.installer.cfg = {}

site.installer.cfg.createfolders_folders = [
	site.cfg.paths.root,
	site.cfg.paths.json,
	site.cfg.paths.images,
	site.cfg.paths.logs,
	site.cfg.paths.other,
];
site.installer.cfg.delete_files = [
	{"file_path":site.cfg.paths.json,"file_name":"local.site_session.json","put":"{}"},
	{}
];
site.installer.cfg.downloadjson_files = [
	{"dest_path":site.cfg.paths.json,"dest_name":"stations.json","query":"{\"get\":\"stations\"}"},
	{}
];

site.installer.cfg.overwrite_versions = [0.014,0.019,0.027,0.035,0.036,0.037,0.038];

// ---> Init

site.installer.init = function(isUpdate) {
	
	loggr.debug("site.installer.init()");
	
	// Hide #home
	$("#home").css("display","none");
	
	if (!site.helpers.isConnected()) {
		navigator.notification.confirm(
			"Icerrr needs a working internet connection.\n\nYour current connections status is: "+ site.helpers.getConnType() +"\n\nPlease make sure you are connected and try again.",
			function(buttonIndex) {
				if (buttonIndex==1) { 
					site.installer.init(isUpdate)
				} else {
					site.lifecycle.exit();
				}
			},
			"Warning",
			"Continue,Exit"
		);
		return;
	}
	
	// Update?
	// - This mainly means that when the install fails we'll just finish up
	if (isUpdate) {
		site.installer.isUpdate = true;
		$("#install .log").html("<h1>Update!</h1>");
	}
	
	// Well let's start by showing some loading ui
	site.ui.gotosection("#install");
	
	// Clear (and prep) any vars
	site.installer.vars = {};
	
	// Bla
	site.installer.cfg.overwrite_version = site.installer.cfg.overwrite_versions.pop()
	
	// Initiate first step: create folders
	setTimeout(function(){site.installer.update();},1000);
	
}

// ---> Step -1: upgrade

site.installer.update = function() {
	
	loggr.debug("site.installer.update()");
	
	//site.installer.logger("Init or update defaults");
	
	// New installs
	if (!site.cookies.get("app_is_installed")) {
		
		// site.installer.logger("&nbsp;&gt; Settings...");
		loggr.log(" > Init settings for fresh install..");
		
		loggr.log(" >> Setting: 'useWifi' = true");
		window.mediaStreamer.setting("bool","useWifi",true,function(res){},function(error){loggr.error(error);});
		
		loggr.log(" >> Setting: 'sendLogs' = true");
		site.cookies.put("setting_sendLogs",1);
		
	}
	
	// Updates only
	else if (site.cookies.get("app_version")<=site.cfg.app_version) {
		
		loggr.log(" > Update from older version..");
		// ..
		
	}
	
	// Specific updates: 0.166
	if (site.cookies.get("app_version")<=0.166) {
		
		loggr.error(" > Update to 0.166..",{dontupload:true});
		
		loggr.log(" >> Setting: 'sendLogs' = true");
		site.cookies.put("setting_sendLogs",1);
		
	}
	
	// Specific updates: 0.193
	if (site.cookies.get("app_version")<=0.192) {
		
		loggr.error(" > Update to 0.193..",{dontupload:true});
		
		loggr.log(" >> Setting: 'useSpeakerForAlarms' = true");
		window.mediaStreamer.setting("bool","useSpeakerForAlarms",true,function(res){loggr.log(" > Stored: "+ res);},function(error){loggr.error(error);});
		
	}
	
	// Specific updates: installed + 0.175
	if (site.cookies.get("app_is_installed") && site.cookies.get("app_version")<=0.175) {
		
		loggr.error(" > Update to 0.176..",{dontupload:true});
		
		loggr.log(" >> Set flag to upgrade starred stations");
		site.cookies.put("upgrade_starred_stations",1);
		
	}
	
	setTimeout(function(){
		//site.installer.logger("&nbsp;&gt; Done");
		site.installer.deletefolders();
	},1000);
	
}

// ---> Step 0 : delete folders

site.installer.deletefolders = function() {
	
	if (!site.cookies.get("app_is_installed") || site.installer.cfg.overwrite_version >= site.cfg.app_version) {
		
		// Check if an older folder exists on install..
		var opts = {
			create:false
		};
		site.storage.getFolderEntry(site.cfg.paths.root,
			function(entry) {
	
				//site.installer.logger("&nbsp;&gt; "+site.cfg.paths.root);
				site.installer.logger("Clear old folders...");
				
				site.storage.removefolder(site.cfg.paths.root,
					function(res) {
						site.installer.logger("&nbsp;&gt; Done");
						setTimeout(function(){site.installer.createfolders_init();},500);
					},
					function(fileError) {
						loggr.error(" > removefolder.Error: "+ site.storage.getErrorType(fileError),{dontupload:true});
						loggr.error(" > "+ fileError.message);
						site.installer.logger("&nbsp;&gt; Done");
						setTimeout(function(){site.installer.createfolders_init();},500);
					},
					{recursively:true}
				);
				
				
			},
			function(fileError) {
				console.error(fileError);
				site.installer.createfolders_init();
			},
			opts
		);
		
		
	} else {
		site.installer.createfolders_init();
	}
	
}

// ---> Step 1 : create folders

site.installer.createfolders_init = function() {
	site.installer.logger("Create folders...");
	setTimeout(function(){site.installer.createfolders_next();},500);
}

site.installer.createfolders_next = function() {
	
	loggr.info("site.installer.createfolders_next()");
	
	// Check pathsNum
	if (!site.installer.vars.pathNum && site.installer.vars.pathNum!==0) { site.installer.vars.pathNum = -1;	}
	site.installer.vars.pathNum++;
	
	// Get current path
	currentpath = site.installer.cfg.createfolders_folders[site.installer.vars.pathNum];
	loggr.log(" > currentpath: "+ currentpath);
	
	// Createfolders finished?
	if (!currentpath) { 
		site.installer.logger("&nbsp;&gt; Done");
		site.installer.deletefiles_init();
		return; // <- important stuff happening here.
	}
	
	// Some output..
	site.installer.logger("&nbsp;&gt; "+ currentpath);
	
	// Do it!
	site.storage.createfolder(currentpath,site.installer.createfolders_cb,site.installer.createfolders_errcb);
	
	
}

site.installer.createfolders_cb = function(directoryEntry) {
	loggr.info("site.installer.createfolders_cb()");
	site.installer.logger(" OK",{use_br:false});
	site.installer.createfolders_next();
}

site.installer.createfolders_errcb = function(error) {
	loggr.info("site.installer.createfolders_errcb()");
	site.installer.logger(" ERR",{use_br:false,is_e:true});
	site.installer.logger("&nbsp;&gt; "+site.storage.getErrorType(error)+"",{is_e:true});
	// TODO: YES.. What now..
}

// ---> Step 2 : delete files

// site.installer.cfg.delete_files
site.installer.deletefiles_init = function() {
	
	// skip deletefiles
	site.installer.downloadjson_init();
	
}

site.installer.deletefiles_next = function() {
	
	// TODO: deprecated?!
	
	loggr.info("site.installer.deletefiles_next()");
	
	// Check jsonNum
	if (!site.installer.vars.delNum && site.installer.vars.delNum!==0) { site.installer.vars.delNum = -1;	}
	site.installer.vars.delNum++;
	
	// Get current job
	currentjob = site.installer.cfg.delete_files[site.installer.vars.delNum];
	loggr.log(" > currentjob: "+ currentjob.file_name);
	
	// downloadjson finished?
	if (!currentjob.put) { 
		site.installer.logger("&nbsp;&gt; Done");
		site.installer.downloadjson_init();
		return; // <- important stuff happening here.
	}
	
	// Stuff
	var path = currentjob.file_path;
	var filename = currentjob.file_name;
	var data = currentjob.put;
	
	loggr.log(" > Path: "+ path);
	loggr.log(" > Filename: "+ filename);
	loggr.log(" > Data: "+ data);
	
	// Some output..
	site.installer.logger("&nbsp;&gt;&gt; Write: "+ path +"/"+ filename);
	
	// Do it
	site.storage.writefile(path,filename,data,
		function(res) {
			site.installer.deletefiles_next();
		},
		function(err) {
			loggr.error(" > Could not write/delete");
			loggr.error(err);
		}
	);
	
	
	
}

// ---> Step 2 : download json

// Downloadjson...

site.installer.downloadjson_init = function() {
	site.installer.logger("Download data...");
	setTimeout(function(){site.installer.downloadjson_next();},1000);
}

site.installer.downloadjson_next = function() {
	
	loggr.info("site.installer.downloadjson_next()");
	
	// Check jsonNum
	if (!site.installer.vars.jsonNum && site.installer.vars.jsonNum!==0) { site.installer.vars.jsonNum = -1;	}
	site.installer.vars.jsonNum++;
	
	// Get current job
	currentjob = site.installer.cfg.downloadjson_files[site.installer.vars.jsonNum];
	loggr.log(" > currentjob: "+ currentjob.query);
	
	// downloadjson finished?
	if (!currentjob.query) { 
		site.installer.logger("&nbsp;&gt; Done");
		site.installer.finishup();
		return; // <- important stuff happening here.
	}
	
	// downloadjson finished?
	// TODO: what is this one doing here?
	if (currentjob.query=="{}") { 
		site.installer.logger("&nbsp;&gt; Done");
		site.installer.downloadjson_next();
		return; // <- important stuff happening here.
	}
		
	// Prep webapi exec
	var apiquerystr = currentjob.query;
	var apiaction = "get";
	
	// Some output..
	site.installer.logger("&nbsp;&gt; Download: "+ currentjob.dest_name);
	site.installer.logger("&nbsp;&gt;&gt; ?a="+ apiaction +"&amp;q="+ apiquerystr);
	
	// Do it!
	site.webapi.exec(apiaction,apiquerystr,site.installer.downloadjson_cb,site.installer.downloadjson_errcb);
	
	// tmp
	//site.installer.finishup();
	
}

site.installer.downloadjson_cb = function(res) {
	loggr.info("site.installer.downloadjson_cb(): "+ site.helpers.countObj(res["data"]));
	site.installer.logger(" OK",{use_br:false});
	site.datatemp = res; // TODO: look at this variable.. it's just sad
	site.installer.downloadjson_read();
}

site.installer.downloadjson_errcb = function(error) {
	loggr.info("site.installer.downloadjson_errcb()");
	site.installer.logger(" ERR",{use_br:false,is_e:true});
	site.installer.logger("&nbsp;&gt; "+error["message"]+"",{is_e:true});
	if (site.installer.isUpdate) { 
		site.installer.finishup();
	}
	// TODO: YES.. What now..
}

// downloadjson_read

site.installer.downloadjson_read = function() {
	
	loggr.info("site.installer.downloadjson_read()");
	
	// Check jsonNum
	if (!site.installer.vars.jsonNum && site.installer.vars.jsonNum!==0) { 
		// TODO: Error...
	}
	
	// Get current job
	currentjob = site.installer.cfg.downloadjson_files[site.installer.vars.jsonNum];
	loggr.log(" > currentjob: "+ currentjob.query);
	
	// Stuff
	var path = currentjob.dest_path;
	var filename = currentjob.dest_name;
	
	loggr.log(" > Path: "+ path);
	loggr.log(" > Filename: "+ filename);
	
	// Some output..
	site.installer.logger("&nbsp;&gt;&gt; Read: "+ path +"/"+ filename);
	
	site.storage.readfile(path,filename,
		function(datalocalstr) {
			
			loggr.log(" > Read OK: ~"+ site.helpers.calcStringToKbytes(datalocalstr) +" kb");
			
			if (!datalocalstr) { 
				loggr.log(" >> No datalocalstr, just write the file");
				site.installer.logger(" NEW",{use_br:false});
				site.installer.downloadjson_write();
				return;
			}
			
			var datalocal = JSON.parse(datalocalstr);
			var dataremote = site.datatemp["data"];
			
			// Merge, others?
			//try {
			switch(site.datatemp["info"]["desc"]) {
				
				case "stations":
					if (site.installer.cfg.overwrite_version <= site.cookies.get("app_version") || site.cookies.get("app_version")==site.cfg.app_version) { 
						site.datatemp["data"] = site.helpers.mergeStations(datalocal,dataremote);  // merge
					} else {
						site.datatemp["data"] = dataremote; // overwrite
					}
					site.data.stations = site.datatemp["data"];
					break;
				
				default:
					site.datatemp["data"] = dataremote // TODO: Default always overwrite?!
					break;
					
			}
			// } catch(e) { loggr.warn(" > Switch switch(site.datatemp['info']['desc']) failed"); loggr.warn(e); }
			
			site.installer.logger(" OK",{use_br:false});
			
			// Write
			site.installer.downloadjson_write();
			
		},
		function(error) {
			loggr.log("site.installer.downloadjson_read().Error");
			site.installer.logger(" ERR",{use_br:false,is_e:true});
			site.installer.logger("&nbsp;&gt; "+JSON.stringify(error)+"",{is_e:true});
		},
		{ //opts
			file:{create:true},
			end:true
		}
	);
	
}

// Downloadjson_write

site.installer.downloadjson_write = function() {
	
	loggr.info("site.installer.downloadjson_write()");
	
	// Check jsonNum
	if (!site.installer.vars.jsonNum && site.installer.vars.jsonNum!==0) { 
		// TODO: Error...
	}
	
	// Get current job
	currentjob = site.installer.cfg.downloadjson_files[site.installer.vars.jsonNum];
	loggr.log(" > currentjob: "+ currentjob.query);
	
	// Stuff
	var path = currentjob.dest_path;
	var filename = currentjob.dest_name;
	var data = JSON.stringify(site.datatemp["data"]);
	
	loggr.log(" > Path: "+ path);
	loggr.log(" > Filename: "+ filename);
	loggr.log(" > Data: "+ data);
	
	// Some output..
	site.installer.logger("&nbsp;&gt;&gt; Write: "+ path +"/"+ filename);
	
	// Do it
	site.storage.writefile(path,filename,data,site.installer.downloadjson_write_cb,site.installer.downloadjson_write_errcb);
	
}

site.installer.downloadjson_write_cb = function(evt) {
	loggr.info("site.installer.downloadjson_write_cb()");
	site.installer.logger(" OK",{use_br:false});
	//loggr.log(" > target: \n > "+site.helpers.arrToString(evt.target,0,"\n"));
	site.installer.downloadjson_next();
}

site.installer.downloadjson_write_errcb = function(error) {
	loggr.info("site.installer.downloadjson_write_errcb()");
	site.installer.logger(" ERR",{use_br:false,is_e:true});
	site.installer.logger("&nbsp;&gt; "+site.storage.getErrorType(error)+"",{is_e:true});
	// TODO: YES.. What now..
}



// clearcache_init

site.installer.clearcache_init = function() {
	loggr.info("site.installer.clearcache_init()");
	site.installer.logger(" ERR",{use_br:false,is_e:true});
}


// ---> Step X : finish up

site.installer.finishup = function() {
	
	loggr.info("site.installer.finishup()");
	
	site.installer.logger("Finish up...");
	
	// Clear cookies..
	if (site.installer.cfg.overwrite_version >= site.cfg.app_version && site.cookies.get("app_version")!=site.cfg.app_version) {
		site.installer.logger("&nbsp;&gt; Clear localstorage...");
		site.cookies.clear();
	}
	
	// Set time for update
	var now = new Date().getTime();
	var then = now + (1000*60*60*24*14); // 1000*60*60*24 == 1 day
	
	site.cookies.put("app_updated_at_time",now);
	site.cookies.put("app_update_time",then);
	
	// Clean up directories...
	/* TODO: NOT HERE, we just created these folders :S
	site.storage.removefolder(site.cfg.paths.images,null,site.installer.removefolder_cberr,{recursively:true});
	if (!site.cookies.get("app_is_installed")) { 
		site.storage.removefolder(site.cfg.paths.json,null,site.installer.removefolder_cberr,{recursively:true});
	}
	/**/
	
	// Clean up image folder
	// Walk stations
	if (site.data.stations) {
		site.installer.logger("&nbsp;&gt; Clean up image cache...");
		var imagelist = [];
		for (var i=0; i<site.data.stations.length; i++) {
			var station = site.data.stations[i];
			if (station.station_image_local) { imagelist.push(station.station_image_local); }
			if (station.station_icon_local) { imagelist.push(station.station_icon_local); }
		}
		loggr.log(" > Found "+ imagelist.length +" image(s) in data");
		// Get files list
		site.storage.listfiles(site.cfg.paths.images,
			function(fileEntries) {
				var removed = 0;
				loggr.log(" > Found "+ fileEntries.length +" files on storage");
				for (var i=0; i<fileEntries.length; i++) {
					var fileEntry = fileEntries[i];
					if (fileEntry.isDirectory) { continue; }
					if (imagelist.indexOf(fileEntry.fullPath)<0) {
						var path = site.cfg.paths.images;
						var name = fileEntry.name;
						site.storage.deletefile(path,name,function(){},function(err){
							loggr.error(" > Could not delete '"+ fileEntry.fullPath +"'",{dontupload:true});
							loggr.error(" > "+ site.storage.getErrorType(error));
						});
						removed++;
					}
				}
				site.installer.logger("&nbsp;&gt; Removed "+ removed +" file(s)");
			},
			function(error) {
				loggr.error(" > Could not list files for cfg.paths.images",{dontupload:true});
				loggr.error(" > "+ site.storage.getErrorType(error));
			}
		);
	}
	
	// Create unique device ID
	if (site.cookies.get("app_is_installed")!=1 || site.cookies.get("app_version")<0.081) {
		loggr.log(" > Create unique device ID");
		site.cookies.put("device_id", CryptoJS.MD5(device.uuid));
	}
	
	// Wait a sec...
	setTimeout(function(){
						
		site.installer.logger("&nbsp;&gt; Done");
		site.ui.showloading("Restarting...");
		
		setTimeout(function() {
			
			site.cookies.put("app_version",site.cfg.app_version);
			site.cookies.put("app_is_installed",1);
			site.cookies.put("app_has_updated",1);
			window.location.reload(); // TODO: replace all 'window.location.reload();' with window.location.href=[current_host]/[path-to-file]
			
		},2500);
		
		//site.ui.gotosection("#home"); // TODO: no not go here, goto #firstlaunch
		
	},2500);
	
}

// ---------------------------------------------
// CALLBACKS

site.installer.removefolder_cb = function(res) {
	
}

site.installer.removefolder_cberr = function(error) {
	loggr.warn(" > removefolder.Error: "+ site.storage.getErrorType(error));
	loggr.warn(" > "+ error.message);
}

// ---------------------------------------------
// UPDATE

// ---------------------------------------------
// VERIFY

// ---------------------------------------------
// LOGGER

site.installer.logger = function(msg,opts) {
	
	if (!opts) { opts = {}; }
	if (opts.use_br!==false) { opts.use_br = true; }
	if (opts.is_e!==true) { opts.is_e = false; }
	
	loggr.log(" (i) "+msg);
	
	if (opts.is_e) { msg = "<span class='e'>"+msg+"</span>"; }
	if (opts.use_br) { msg = "<br>"+msg; }
	
	$("#install .log").append(msg);
	
	// TODO: doesn't work..
	$("#install .main").scrollTop( $("#install .main").height() );
	
	// hidden function: if 'e' set #exit
	if (opts.is_e) {
		site.lifecycle.add_section_history("#exit");
	}
	
}




















