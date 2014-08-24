
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

// ---> Queue

site.session.storage = {};
site.session.storage.queue = [];

// QueueStuff
// - Args: action='createfolder', 


site.storage.enqueue = function(action,args) {
	
	loggr.log("site.storage.enqueue(): "+action);
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
	
	loggr.log("site.storage.runqueue()");
	
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

// Create folder
// - Use to create a folder INSIDE site.cfg.paths.root
// - Returns directoryEntry to cb: http://docs.phonegap.com/en/2.7.0/cordova_file_file.md.html#DirectoryEntry

site.storage.createfolder = function(path,cb,errcb) {
	
	loggr.log("site.storage.createfolder(): "+path);
	
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
                { create: true, exclusive: false },
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
	
	loggr.log("site.storage.readfolder(): "+path);
	
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
	
	loggr.log("site.storage.writefile(): "+path+", "+filename+", ~"+site.helpers.calcStringToKbytes(data)+" kb");
	
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

// Read file (text)
// - Opts: opts.path are passed to getDirectory function, opts.file are passed to getFile function
// - Returns: string of file contents

site.storage.readfile = function(path,filename,cb,errcb,opts) {
	
	loggr.log("site.storage.readfile(): "+path+", "+filename);
	
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
	
	// Run
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
        function(fileSystem) {
            fileSystem.root.getDirectory(path,
                opts.path,
                function(directoryEntry) {
					directoryEntry.getFile(filename,opts.file,
						function(fileEntry) {
							fileEntry.file(
								function(file) {
									var fileReader = new FileReader();
									fileReader.onload = function(evt) { site.storage.isBusy=false; cb(evt.target.result); }
									fileReader.onabort = function(error) { site.storage.isBusy=false; errcb(error); }; // TODO: onabort != error..?
									fileReader.onerror = function(error) { site.storage.isBusy=false; errcb(error); };
									if (opts.file.readAsDataUrl) { fileReader.readAsDataURL(file); }
									else { fileReader.readAsText(file); }
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

// ---> Others

// Get Meta Data
// - Opts: opts.path are passed to getDirectory and/or getFile function, opts.type: 0=autodetect, 1=files, 2=folders || TODO: autodetect!
// - Returns: MetaData object: http://docs.phonegap.com/en/2.7.0/cordova_file_file.md.html#Metadata

site.storage.getmetadata = function(path,fileOrFolder,cb,errcb,opts) {
	
	loggr.log("site.storage.getmetadata(): "+path+", "+fileOrFolder);
	
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

