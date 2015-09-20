
// ---------------------------------------------
// BZZ

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// STORAGE

site.storage = {};

// TODO: All Cordova.File operations should return a FileError on failure but I'm not entirely sure.. so is it safe to use errcb for all errors?
//  --> Also, I've implemented some custom errors (code: -1, it puts a message in there as well)

// TODO: Check if opts.bla are setting default correctly

// ---> Timeouts
// It looks like cordova can get stuck on reading files so let's build a timeout that at least detects this behaviour..

site.storage.timeouts = {};

site.storage.addTimeout = function(action, time, args) {
	
	if (!time) { time = 2000; }
	
	var timeoutID = site.helpers.getUniqueID(action);
	
	loggr.debug("site.storage.addTimeout(): "+ action +", "+ timeoutID);
	
	site.storage.timeouts[timeoutID] = {};
	site.storage.timeouts[timeoutID].action = action
	site.storage.timeouts[timeoutID].args = args;
	site.storage.timeouts[timeoutID].timeout = setTimeout(function() {
		
		loggr.warn("site.storage timeout! Action: '"+action+"'",{dontupload:true});
		loggr.warn(JSON.stringify(args),{dontupload:true});
		
		// TODO || TMP: remove this line for prod.
		// alert("Storage timeout occured!");
		
		if (!site.storage.timeouts[timeoutID]) {
			loggr.warn("site.storage.timeouts["+ timeoutID +"] is null?");
			return;
		}
		
		// try aborting and retry..
		if (site.storage.timeouts[timeoutID].canAbort) {
			
			loggr.log(" > Can abort, will retry...");
			site.storage.timeouts[timeoutID].abortObj.abort();
			
			switch(action) {
				
				case "readfile":
					loggr.log(" > Retry action: "+ action);
					site.storage.removeTimeout(timeoutID);
					site.storage.readfile(args.path,args.filename,args.cb,args.errcb,args.opts);
					break;
				
				default:
					loggr.error(" > Could not retry action: '"+ action +"'");
					// site.ui.showtoast("An error accured. You may want to restart Icerrr.");
					
			}
			
		} else {
			loggr.warn(" > Cannot abort file operation, ask user to restart app");
			// site.ui.showtoast("An error accured. You may want to restart Icerrr.");
		}
		
		loggr.log(" > Endof storage.timeout");
		
		site.storage.removeTimeout(timeoutID);
		
	},time);
	
	return timeoutID;
	
}

site.storage.removeTimeout = function(timeoutID) {
	
	loggr.debug("site.storage.removeTimeout(): "+ timeoutID);
	
	if (!site.storage.timeouts[timeoutID]) {
		loggr.warn(" > site.storage.removeTimeout: "+timeoutID +" not found");
		return;
	}
	
	if (site.storage.timeouts[timeoutID].timeout) {
		clearTimeout(site.storage.timeouts[timeoutID].timeout);
	}
	
	site.storage.timeouts[timeoutID] = null;
	
	var foundActiveTimeout = false;
	for (var id in site.storage.timeouts) {
		if (site.storage.timeouts[id]) { foundActiveTimeout = true; break; }
	}
	if (!foundActiveTimeout) { site.storage.timeouts = {}; }
	
}

// ---> Pre-callback

site.storage.preCb = function(cb,res,timeoutID) {
	if (timeoutID) { site.storage.removeTimeout(timeoutID); }
	site.storage.isBusy = false;
	cb(res);
}

site.storage.preCbErr = function(cberr,err,timeoutID) {
	if (timeoutID) { site.storage.removeTimeout(timeoutID); }
	site.storage.isBusy = false;
	cberr(err);
}

// ---> Queue

site.session.storage = {};
site.session.storage.queue = [];

// QueueStuff
// - Args: action='createfolder', 


site.storage.enqueue = function(action,args) {
	
	loggr.debug("site.storage.enqueue(): "+action);
	loggr.log(" > "+ JSON.stringify(args));
	
	if (!site.session.storage) { site.session.storage = {}; }
	if (!site.session.storage.queue) { site.session.storage.queue = []; }
	
	// Check for duplicates
	for (var i=0; i<site.session.storage.queue.length; i++) {
		var queue_item = site.session.storage.queue[i];
		if (queue_item.action==action && JSON.stringify(queue_item.args)==JSON.stringify(args)) {
			loggr.log(" > Duplicate exists.. what now? we dont want UNLIMITED LOOPS!");
		}
	}
	
	// Push
	site.session.storage.queue.push({"action":action,"args":jQuery.extend(true, {}, args)});
	
	// Run queue if needed
	if (!site.timeouts.storage_queue) {
		site.timeouts.storage_queue = setTimeout(function(){
			site.storage.runqueue();
		},1);
	}
	
}

site.storage.runqueue = function() {
	
	loggr.debug("site.storage.runqueue()");
	
	if (!site.session.storage) { return; }
	
	// Stop when we can
	if (site.session.storage.queue.length<1) {
		loggr.log(" > Queue empty, stop...");
		if (site.timeouts.storage_queue) { clearTimeout(site.timeouts.storage_queue); }
		return;
	}
	
	// Get queue item
	var queue_item = site.session.storage.queue[0];
	var action = queue_item.action;
	var args = queue_item.args;
	
	// set timeout now so we have little delay for async shit to rain down upon us
	if (site.timeouts.storage_queue) { clearTimeout(site.timeouts.storage_queue); }
	site.timeouts.storage_queue = setTimeout(function(){
		site.storage.runqueue();
	},1000); // TODO: determine update freq
	
	if (!site.storage.isBusy) {
	
		switch(action) {
			
				// site.session.storage.queue
			case "createfolder":
				site.storage.createfolder(args.path,args.cb,args.errcb);
				break;
				
			case "readfolder":
				site.storage.readfolder(args.path,args.cb,args.errcb,args.opts);
				break;
				
			case "writefile":
				site.storage.writefile(args.path,args.filename,args.data,args.cb,args.errcb,args.opts);
				break;
				
			case "readfile":
				site.storage.readfile(args.path,args.filename,args.cb,args.errcb,args.opts);
				break;
				
			case "getmetadata":
				site.storage.getmetadata(args.path,args.fileOrFolder,args.cb,args.errcb,args.opts);
				break;
			
			default:
				alert("site.storage.runqueue().Error: invalid value for 'action': "+ action);
				loggr.log("site.storage.runqueue().Error: invalid value for 'action': "+ action);
				loggr.log(action+", "+JSON.stringify(args));
				break;
			
		}
		
		site.session.storage.queue.shift();
		
	}
	
}

site.storage.runqueue_cb = function() {
	
}

// ---> Folders

// RemoveFolder

site.storage.removefolder = function(path,cb,errcb,opts) {
	
	loggr.debug("site.storage.removefolder(): "+path);
	
	// Check path, should contain site.cfg.paths.root
	if (path.indexOf(site.cfg.paths.root)<0) { // TODO: Should be indexOf(..)!==0
		errcb({code:-1,message:"site.storage.createfolder().Error: Will not write outside of root directory: '"+path+"'"});
		return; // <- important...
	}
	
	// Remove last '/'
	if (path.lastIndexOf("/")==path.length-1) {
		path = path.substr(0,path.length-1);
		loggr.log(" > "+ path);
	}
	
	// Opts
	if (!opts) { opts = {}; }
	
	// Run
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
        function(fileSystem) {
            fileSystem.root.getDirectory(
				path,
                { create: false },
                function(entry) { 
					if (opts.recursively) { entry.removeRecursively(cb,errcb); }
					else { entry.remove(cb,errcb); }
					site.storage.isBusy=false; 
				},
                function(error) { 
					site.storage.isBusy=false; 
					errcb(error); 
				}
            );
        },
        function() { site.storage.isBusy=false; errcb(); }
    );
	
}

// Create folder
// - Use to create a folder INSIDE site.cfg.paths.root
// - Returns directoryEntry to cb: http://docs.phonegap.com/en/2.7.0/cordova_file_file.md.html#DirectoryEntry

site.storage.createfolder = function(path,cb,errcb) {
	
	loggr.debug("site.storage.createfolder(): "+path);
	
	// Check path, should contain site.cfg.paths.root
	if (path.indexOf(site.cfg.paths.root)<0) { // TODO: Should be indexOf(..)!==0
		errcb({code:-1,message:"site.storage.createfolder().Error: Will not write outside of root directory: '"+path+"'"});
		return; // <- important...
	}
	
	// Check busy
	if (site.storage.isBusy) { 
		// errcb({code:-1,message:"site.storage.error: isBusy"}); 
		var args = {path:path,cb:cb,errcb:errcb};
		//site.storage.enqueue("createfolder",args);
		//return; 
	}
	site.storage.isBusy = true;
	
	// Run
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
        function(fileSystem) {
            fileSystem.root.getDirectory(path,
                { create: true },
                function(entry) { site.storage.isBusy=false; cb(entry); },
                function(error) { site.storage.isBusy=false; errcb(error); }
            );
        },
        function(error) { site.storage.isBusy=false; errcb(error); }
    );
	
}

// Read folder
// - Opts: opts.path are passed to getDirectory function, opts.mode: 0=all, 1=files, 2=folders
// - Returns an array of FileEntries and DirectoryEntries (also depends on opts.mode)

site.storage.readfolder = function(path,cb,errcb,opts) {
	
	loggr.debug("site.storage.readfolder(): "+path);
	
	// Check path, should contain site.cfg.paths.root
	if (path.indexOf(site.cfg.paths.root)<0) { // TODO: Should be indexOf(..)!==0
		errcb({code:-1,message:"site.storage.readfolder().Error: Will not read outside of root directory: '"+path+"'"});
		return; // <- important...
	}
	
	// Check busy
	if (site.storage.isBusy) { 
		// errcb({code:-1,message:"site.storage.error: isBusy"}); 
		var args = {path:path,cb:cb,errcb:errcb,opts:opts};
		//site.storage.enqueue("readfolder",args);
		//return; 
	}
	site.storage.isBusy = true;
	
	// Handle opts
	if (!opts) { opts = {}; }
	if (!opts.path) { opts.path = {}; }
	if (opts.path.create!==false) { opts.path.create = true; }
	if (opts.path.exclusive!==false) { opts.path.exclusive = false; }
	if (!opts.mode) { opts.mode = 0; }
	
	// Run
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
        function(fileSystem) {
            fileSystem.root.getDirectory(path,
                opts.path,
                function(directoryEntry) {
					var directoryReader = directoryEntry.createReader();
					directoryReader.readEntries(
						function(fileAndDirectoryEntries) {
							var res = [];
							for(var i=0; i<fileAndDirectoryEntries.length; i++) {
								if (opts.mode==1 && fileAndDirectoryEntries[i].isDirectory) { continue; } // mode 1: skip directories
								if (opts.mode==2 && fileAndDirectoryEntries[i].isFile) { continue; } // mode 2: skip files
								res.push(fileAndDirectoryEntries[i]);
							}
							site.storage.isBusy = false;
							cb(res);
						},
						function(error) { site.storage.isBusy=false; errcb(error); }
					);
				},
                function(error) { site.storage.isBusy=false; errcb(error); }
            );
        },
        function(error) { site.storage.isBusy=false; errcb(error); }
    );
	
}

// ---> Folders

// Write file (text)
// TODO: writefile for binary-ish? (!) not allowed on iOS?
// - Opts: opts.path are passed to getDirectory function, opts.file are passed to getFile function
// - Returns: evt? TODO: figure out!

site.storage.writefile = function(path,filename,data,cb,errcb,opts) {
	
	loggr.debug("site.storage.writefile(): "+path+", "+filename+", ~"+site.helpers.calcStringToKbytes(data)+" kb");
	
	// Check path, should contain site.cfg.paths.root
	if (path.indexOf(site.cfg.paths.root)<0) { // TODO: Should be indexOf(..)!==0
		errcb({code:-1,message:"site.storage.writefile().Error: Will not write outside of root directory: '"+path+"'"});
		return; // <- important...
	}
	
	// Check busy
	if (site.storage.isBusy) { 
		// errcb({code:-1,message:"site.storage.error: isBusy"}); 
		var args = {path:path,filename:filename,data:data,cb:cb,errcb:errcb,opts:opts};
		//site.storage.enqueue("writefile",args);
		//return; 
	}
	site.storage.isBusy = true;
	
	// Handle opts
	if (!opts) { opts = {}; }
	if (!opts.path) { opts.path = {}; }
	if (opts.path.create!==false) { opts.path.create = true; }
	if (opts.path.exclusive!==true) { opts.path.exclusive = false; }
	if (!opts.file) { opts.file = {}; }
	if (opts.file.create!==false) { opts.file.create = true; }
	if (opts.file.exclusive!==true) { opts.file.exclusive = false; }
	
	// Run
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
        function(fileSystem) {
            fileSystem.root.getDirectory(path,
                opts.path,
                function(directoryEntry) {
					directoryEntry.getFile(filename,opts.file,
						function(fileEntry) {
							var fileWriter = fileEntry.createWriter(
								function(fileWriter) {
									fileWriter.onwrite = function(evt) { site.storage.isBusy=false; cb(evt); };
									fileWriter.onabort = function(error) { site.storage.isBusy=false; errcb(error); }; // TODO: onabort != error..?
									fileWriter.onerror = function(error) { site.storage.isBusy=false; errcb(error); };
									fileWriter.write(data);
								},
								function(error) { site.storage.isBusy=false; errcb(error); }
							);
						},
						function(error) { site.storage.isBusy=false; errcb(error); }
					);
				},
                function(error) { site.storage.isBusy=false; errcb(error); }
            );
        },
        function(error) { site.storage.isBusy=false; errcb(error); }
    );
	
}

// Remove file
// - Returns: boolean or error

site.storage.deletefile = function(path,filename,cb,errcb,opts) {
	
	loggr.debug("site.storage.deletefile(): "+path+", "+filename);
	
	// Check path, should contain site.cfg.paths.root
	if (path.indexOf(site.cfg.paths.root)<0) { // TODO: Should be indexOf(..)!==0
		errcb({code:-1,message:"site.storage.deletefile().Error: Will not read outside of root directory: '"+path+"'"});
		return; // <- important...
	}
	
	// Check busy
	if (site.storage.isBusy) { 
		// errcb({code:-1,message:"site.storage.error: isBusy"}); 
		// var args = {path:path,filename:filename,cb:cb,errcb:errcb,opts:opts};
		//site.storage.enqueue("readfile",args);
		//return; 
	}
	site.storage.isBusy = true;
	
	// Handle opts
	if (!opts) { opts = {}; }
	if (!opts.path) { opts.path = {}; }
	if (opts.path.create!==true) { opts.path.create = false; } // Note: defaults to FALSE - most other storage methods don't!
	if (opts.path.exclusive) { opts.path.exclusive = false; }
	if (!opts.file) { opts.file = {}; }
	if (opts.file.create!==true) { opts.file.create = false; } // Note: defaults to FALSE - most other storage methods don't!
	if (opts.file.exclusive!==true) { opts.file.exclusive = false; }
	if (opts.file.readAsDataUrl!==true) { opts.file.readAsDataUrl = false; }
	
	// Go
	site.storage.getFileEntry(path,filename,
		function(fileEntry) {
			fileEntry.remove(cb,errcb);
		},
		function(error) {
			errcb(error);
		},
		{path:{create:true},file:{create:true}}
	);
	
}

// Read file (text)
// - Opts: opts.path are passed to getDirectory function, opts.file are passed to getFile function
// - Returns: string of file contents

site.storage.readfile = function(path,filename,cb,errcb,opts) {
	
	loggr.debug("site.storage.readfile(): "+path+", "+filename);
	
	// Check path, should contain site.cfg.paths.root
	if (path.indexOf(site.cfg.paths.root)<0) { // TODO: Should be indexOf(..)!==0
		errcb({code:-1,message:"site.storage.readfile().Error: Will not read outside of root directory: '"+path+"'"});
		return; // <- important...
	}
	
	// Check busy
	if (site.storage.isBusy) { 
		// errcb({code:-1,message:"site.storage.error: isBusy"}); 
		var args = {path:path,filename:filename,cb:cb,errcb:errcb,opts:opts};
		//site.storage.enqueue("readfile",args);
		//return; 
	}
	site.storage.isBusy = true;
	
	// Handle opts
	if (!opts) { opts = {}; }
	if (!opts.path) { opts.path = {}; }
	if (opts.path.create!==true) { opts.path.create = false; } // Note: defaults to FALSE - most other storage methods don't!
	if (opts.path.exclusive) { opts.path.exclusive = false; }
	if (!opts.file) { opts.file = {}; }
	if (opts.file.create!==true) { opts.file.create = false; } // Note: defaults to FALSE - most other storage methods don't!
	if (opts.file.exclusive!==true) { opts.file.exclusive = false; }
	if (opts.file.readAsDataUrl!==true) { opts.file.readAsDataUrl = false; }
	
	// Prep timeout
	var timeoutID = site.storage.addTimeout("readfile",null,{path:path,filename:filename,cb:cb,errcb:errcb,opts:opts});
	
	// Run
	//loggr.log(" > Request File System");
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
        function(fileSystem) {
			//loggr.log(" > Get directory entry: "+path);
            fileSystem.root.getDirectory(path,
                opts.path,
                function(directoryEntry) {
					//loggr.log(" > Get file entry: "+filename);
					directoryEntry.getFile(filename,opts.file,
						function(fileEntry) {
							fileEntry.file(
								function(file) {
									//loggr.log(" > Read file...");
									var fileReader = new FileReader();
									site.storage.timeouts[timeoutID].canabort = true;
									site.storage.timeouts[timeoutID].abortObj = fileReader;
									fileReader.onload = function(evt) { 
										// check if aborted..
										if (!site.storage.timeouts[timeoutID]) { 
											loggr.warn(" > site.storage.readfile(): canceled action suddenly got fired");
											// return; 
										}
										site.storage.preCb(cb,evt.target.result,timeoutID); 
										}
									// fileReader.onabort = function(error) { site.storage.preCbErr(errcb,error,timeoutID); }; // TODO: onabort != error..?
									fileReader.onerror = function(error) { site.storage.preCbErr(errcb,error,timeoutID); };
									if (opts.file.readAsDataUrl) { fileReader.readAsDataURL(file); }
									else { fileReader.readAsText(file); }
								},
								function(error) { site.storage.preCbErr(errcb,error,timeoutID); }
							);
						},
						function(error) { site.storage.preCbErr(errcb,error,timeoutID); }
					);
				},
                function(error) { site.storage.preCbErr(errcb,error,timeoutID); }
            );
        },
        function(error) { site.storage.preCbErr(errcb,error,timeoutID); }
    );
	
}

// ---> Entries...

site.storage.getFileEntry = function(path,filename,cb,errcb,opts) {
	
	loggr.log("site.storage.getFileEntry(): "+ path +", "+ filename);
	
	// Check path, should contain site.cfg.paths.root
	if (path.indexOf(site.cfg.paths.root)<0) { // TODO: Should be indexOf(..)!==0
		errcb({code:-1,message:"site.storage.getFileEntry().Error: Will not read outside of root directory: '"+path+"'"});
		return; // <- important...
	}
	
	// Check busy
	if (site.storage.isBusy) { 
		// errcb({code:-1,message:"site.storage.error: isBusy"}); 
		var args = {path:path,filename:filename,cb:cb,errcb:errcb,opts:opts};
		//site.storage.enqueue("readfile",args);
		//return; 
	}
	site.storage.isBusy = true;
	
	// Handle opts
	if (!opts) { opts = {}; }
	if (!opts.path) { opts.path = {}; }
	if (opts.path.create!==true) { opts.path.create = false; } // Note: defaults to FALSE - most other storage methods don't!
	if (opts.path.exclusive) { opts.path.exclusive = false; }
	if (!opts.file) { opts.file = {}; }
	if (opts.file.create!==true) { opts.file.create = false; } // Note: defaults to FALSE - most other storage methods don't!
	if (opts.file.exclusive!==true) { opts.file.exclusive = false; }
	if (opts.file.readAsDataUrl!==true) { opts.file.readAsDataUrl = false; }
	
	// Prep timeout
	var timeoutID = site.storage.addTimeout("getFileEntry",null,{path:path,filename:filename,cb:cb,errcb:errcb,opts:opts});
	
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
        function(fileSystem) {
			loggr.log(" > Get directory entry: "+path);
            fileSystem.root.getDirectory(path,
                opts.path,
                function(directoryEntry) {
					loggr.log(" > Get file entry: "+path +", "+ filename);
					directoryEntry.getFile(filename,opts.file,
						function(fileEntry) {
							loggr.log(" > Got file: "+ fileEntry.fullPath);
							site.storage.preCb(cb,fileEntry,timeoutID); 
						},
						function(error) { loggr.error(" > Err on getFile",{dontupload:true}); site.storage.preCbErr(errcb,error,timeoutID); }
					);
				},
                function(error) { loggr.error(" > Err on getDirectory",{dontupload:true}); site.storage.preCbErr(errcb,error,timeoutID); }
            );
        },
        function(error) { site.storage.preCbErr(errcb,error,timeoutID); }
    );
	
}

site.storage.getFolderEntry = function(path,cb,errcb,opts) {
	
	loggr.log("site.storage.getFolderEntry(): "+ path);
	
	// Check path, should contain site.cfg.paths.root
	if (path.indexOf(site.cfg.paths.root)<0) { // TODO: Should be indexOf(..)!==0
		errcb({code:-1,message:"site.storage.getFolderEntry().Error: Will not read outside of root directory: '"+path+"'"});
		return; // <- important...
	}
	
	// Check busy
	if (site.storage.isBusy) { 
		// errcb({code:-1,message:"site.storage.error: isBusy"}); 
		// var args = {path:path,filename:filename,cb:cb,errcb:errcb,opts:opts};
		//site.storage.enqueue("readfile",args);
		//return; 
	}
	site.storage.isBusy = true;
	
	// Handle opts
	if (!opts) { opts = {}; }
	if (!opts.path) { opts.path = {}; }
	if (opts.path.create!==true) { opts.path.create = false; } // Note: defaults to FALSE - most other storage methods don't!
	if (opts.path.exclusive) { opts.path.exclusive = false; }
	
	// Prep timeout
	var timeoutID = site.storage.addTimeout("getFolderEntry",null,{path:path,cb:cb,errcb:errcb,opts:opts});
	
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
        function(fileSystem) {
			//loggr.log(" > Get directory entry: "+path);
            fileSystem.root.getDirectory(path,
                opts.path,
                function(directoryEntry) {
					site.storage.preCb(cb,directoryEntry,timeoutID); 
				},
                function(error) { site.storage.preCbErr(errcb,error,timeoutID); }
            );
        },
        function(error) { site.storage.preCbErr(errcb,error,timeoutID); }
    );
	
}



// ---> Others

// List files

site.storage.listfiles = function(path,cb,errcb,opts) {
	
	loggr.debug("site.storage.getFolderSize()");
	
	var hasSubFolder = false;
	var size = 0;
	var entries = [];
	
	// Get folderEntry
	site.storage.getFolderEntry(path,
		function(folderEntry) {
			
			loggr.log(" > Got folderEntry: "+ folderEntry.fullPath);
			
			var reader = folderEntry.createReader();
			reader.readEntries(
				function(entries) {
					
					cb(entries);
					return;
					
				},
				function(error) {
					alert(error);
					errcb(error);
				}
			);
			
		},
		function(error) {
			alert(error);
			errcb(error);
		},
		{path:{create:true}}
	);
	
}

// Get Meta Data
// - Opts: opts.path are passed to getDirectory and/or getFile function, opts.type: 0=autodetect, 1=files, 2=folders || TODO: autodetect!
// - Returns: MetaData object: http://docs.phonegap.com/en/2.7.0/cordova_file_file.md.html#Metadata

site.storage.getmetadata = function(path,fileOrFolder,cb,errcb,opts) {
	
	loggr.debug("site.storage.getmetadata(): "+path+", "+fileOrFolder);
	
	// Check path, should contain site.cfg.paths.root
	if (path.indexOf(site.cfg.paths.root)<0) { // TODO: Should be indexOf(..)!==0
		errcb({code:-1,message:"site.storage.getmetadata().Error: Will not read outside of root directory: '"+path+"'"});
		return; // <- important...
	}
	
	// Check busy
	if (site.storage.isBusy) { 
		// errcb({code:-1,message:"site.storage.error: isBusy"}); 
		var args = {path:path,fileOrFolder:fileOrFolder,cb:cb,errcb:errcb,opts:opts};
		//site.storage.enqueue("getmetadata",args);
		//return; 
	}
	site.storage.isBusy = true;
	
	// Handle opts
	if (!opts) { opts = {}; }
	if (!opts.path) { opts.path = {}; }
	if (opts.path.create!==true) { opts.path.create = false; } // Note: defaults to FALSE - most other storage methods don't!
	if (opts.path.exclusive) { opts.path.exclusive = false; }
	if (!opts.type) { opts.type = 1; } // Note: autodetect not yet implemented, defaulting to file!
	
	// Run
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
        function(fileSystem) {
			if (opts.type==0) {
				// autodetect o be implemented
				errcb({code:-1,message:"site.storage.getmetadata().Error: autodetect not implemented"});
			} else if (opts.type==1) { // file
				fileSystem.root.getFile(path,
					opts.path,
					function(entry) {
						entry.getMetadata(function (metadata) { site.storage.isBusy=false; cb(metadata); } ,function(error) { site.storage.isBusy=false; errcb(error); });
					},
					function(error) { site.storage.isBusy=false; errcb(error); }
				);
			} else if (opts.type==2) { // folder
				fileSystem.root.getDirectory(path,
					opts.path,
					function(entry) {
						entry.getMetadata(function (metadata) { site.storage.isBusy=false; cb(metadata); } ,function(error) { site.storage.isBusy=false; errcb(error); });
					},
					function(error) { site.storage.isBusy=false; errcb(error); }
				);
			}
        },
        function(error) { site.storage.isBusy=false; errcb(error); }
    );
	
}

// ---> Helpers

// Get Error Type
// - Note: expects the entire FileError obj!
// - Returns string of error code

site.storage.getErrorType = function(error) {
	var res = "FileError.UNKNOWN";
	switch(error.code) {
		case FileError.NOT_FOUND_ERR:
			res = "FileError.NOT_FOUND_ERR";
			break;
		case FileError.SECURITY_ERR:
			res = "FileError.SECURITY_ERR";
			break;
		case FileError.ABORT_ERR:
			res = "FileError.ABORT_ERR";
			break;
		case FileError.NOT_READABLE_ERR:
			res = "FileError.NOT_READABLE_ERR";
			break;
		case FileError.ENCODING_ERR:
			res = "FileError.ENCODING_ERR";
			break;
		case FileError.NO_MODIFICATION_ALLOWED_ERR:
			res = "FileError.NO_MODIFICATION_ALLOWED_ERR";
			break;
		case FileError.INVALID_STATE_ERR:
			res = "FileError.INVALID_STATE_ERR";
			break;
		case FileError.SYNTAX_ERR:
			res = "FileError.SYNTAX_ERR";
			break;
		case FileError.INVALID_MODIFICATION_ERR:
			res = "FileError.INVALID_MODIFICATION_ERR";
			break;
		case FileError.QUOTA_EXCEEDED_ERR:
			res = "FileError.QUOTA_EXCEEDED_ERR";
			break;
		case FileError.TYPE_MISMATCH_ERR:
			res = "FileError.TYPE_MISMATCH_ERR";
			break;
		case FileError.PATH_EXISTS_ERR:
			res = "FileError.PATH_EXISTS_ERR";
			break;
		case -1: // TODO: check if this code is not in use!
			if (error.message) { res = error.message; }
			break;
	}
	return res;
}

site.storage.getFileTransferErrorType = function(error) {
	
	/*
	FileTransferError.FILE_NOT_FOUND_ERR
	FileTransferError.INVALID_URL_ERR
	FileTransferError.CONNECTION_ERR
	FileTransferError.ABORT_ERR
	/**/
	
	var res = "FileTransferError.UNKNOWN";
	switch(error.code) {
		case FileTransferError.NOT_FOUND_ERR:
			res = "FileTransferError.NOT_FOUND_ERR";
			break;
		case FileTransferError.INVALID_URL_ERR:
			res = "FileTransferError.INVALID_URL_ERR";
			break;
		case FileTransferError.CONNECTION_ERR:
			res = "FileTransferError.CONNECTION_ERR";
			break;
		case FileTransferError.ABORT_ERR:
			res = "FileTransferError.ABORT_ERR";
			break;
		case -1: // TODO: check if this code is not in use!
			if (error.message) { res = error.message; }
			break;
			
	}
	return res;
}

// ---------------------------------------------
// COOKIES

site.cookies = {};

// Note: If testing for true/false, use 1/0 values when putting... ;)
//  -> this way you can simply test cookie as follows: if(site.cookies.get('barbapappa')){/*do stuff if true*/}

// Put

site.cookies.put = function(name,value) {
	try { window.localStorage.setItem(name, value); }
	catch(e) { loggr.warn(" > site.cookies.put failed: "+name+", "+value); return false; }
	return true;
}

// Get

site.cookies.get = function(name) {
	var res = false;
	try { res = window.localStorage.getItem(name); }
	catch(e) { res = false; }
	return res;
}

// Clear

site.cookies.clear = function() {
	window.localStorage.clear();
}

