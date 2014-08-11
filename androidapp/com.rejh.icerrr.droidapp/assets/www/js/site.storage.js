
// ---------------------------------------------
// BZZ

// ---> Compat

if (!console) { var console = {}; }
if (!console.log) { console.log = function(str) { }; }

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// STORAGE

site.storage = {};

// TODO: All Cordova.File operations should return a FileError on failure but I'm not entirely sure.. so is it safe to use errcb for all errors?
//  --> Also, I've implemented some custom errors (code: -1, it puts a message in there as well)

// TODO: Check if opts.bla are setting default correctly

// ---> Folders

// Create folder
// - Use to create a folder INSIDE site.cfg.paths.root
// - Returns directoryEntry to cb: http://docs.phonegap.com/en/2.7.0/cordova_file_file.md.html#DirectoryEntry

site.storage.createfolder = function(path,cb,errcb) {
	
	console.log("site.storage.createfolder(): "+path);
	
	// Check path, should contain site.cfg.paths.root
	if (path.indexOf(site.cfg.paths.root)<0) { // TODO: Should be indexOf(..)!==0
		errcb({code:-1,message:"site.storage.createfolder().Error: Will not write outside of root directory: '"+path+"'"});
	}
	
	// Run
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
        function(fileSystem) {
            fileSystem.root.getDirectory(path,
                { create: true, exclusive: false },
                cb,
                errcb
            );
        },
        errcb
    );
	
}

// Read folder
// - Opts: opts.path are passed to getDirectory function, opts.mode: 0=all, 1=files, 2=folders
// - Returns an array of FileEntries and DirectoryEntries (also depends on opts.mode)

site.storage.readfolder = function(path,cb,errcb,opts) {
	
	console.log("site.storage.readfolder(): "+path);
	
	// Check path, should contain site.cfg.paths.root
	if (path.indexOf(site.cfg.paths.root)<0) { // TODO: Should be indexOf(..)!==0
		errcb({code:-1,message:"site.storage.readfolder().Error: Will not read outside of root directory: '"+path+"'"});
	}
	
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
							cb(res);
						},
						errcb
					);
				},
                errcb
            );
        },
        errcb
    );
	
}

// ---> Folders

// Write file (text)
// TODO: writefile for binary-ish? (!) not allowed on iOS?
// - Opts: opts.path are passed to getDirectory function, opts.file are passed to getFile function
// - Returns: evt? TODO: figure out!

site.storage.writefile = function(path,filename,data,cb,errcb) {
	
	console.log("site.storage.writefile(): "+path+", "+filename);
	
	// Check path, should contain site.cfg.paths.root
	if (path.indexOf(site.cfg.paths.root)<0) { // TODO: Should be indexOf(..)!==0
		errcb({code:-1,message:"site.storage.writefile().Error: Will not write outside of root directory: '"+path+"'"});
	}
	
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
									fileWriter.onwrite = cb;
									fileWriter.onabort = errcb; // TODO: onabort != error..?
									fileWriter.onerror = errcb;
									fileWriter.write(data);
								},
								errcb
							);
						},
						errcb
					);
				},
                errcb
            );
        },
        errcb
    );
	
}

// Read file (text)
// - Opts: opts.path are passed to getDirectory function, opts.file are passed to getFile function
// - Returns: string of file contents

site.storage.readfile = function(path,filename,cb,errcb) {
	
	console.log("site.storage.readfile(): "+path+", "+filename);
	
	// Check path, should contain site.cfg.paths.root
	if (path.indexOf(site.cfg.paths.root)<0) { // TODO: Should be indexOf(..)!==0
		errcb({code:-1,message:"site.storage.readfile().Error: Will not read outside of root directory: '"+path+"'"});
	}
	
	// Handle opts
	if (!opts) { opts = {}; }
	if (!opts.path) { opts.path = {}; }
	if (opts.path.create!==true) { opts.path.create = false; } // Note: defaults to FALSE - most other storage methods don't!
	if (opts.path.exclusive) { opts.path.exclusive = false; }
	if (!opts.file) { opts.file = {}; }
	if (opts.file.create!==true) { opts.file.create = false; } // Note: defaults to FALSE - most other storage methods don't!
	if (opts.file.exclusive!==true) { opts.file.exclusive = false; }
	
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
									fileReader.onload = function(evt) { cb(evt.target.result); }
									fileReader.onabort = errcb; // TODO: onabort != error..?
									fileReader.onerror = errcb;
									fileReader.readAsDataURL(file);
								},
								errcb
							);
						},
						errcb
					);
				},
                errcb
            );
        },
        errcb
    );
	
}

// ---> Others

// Get Meta Data
// - Opts: opts.path are passed to getDirectory and/or getFile function, opts.type: 0=autodetect, 1=files, 2=folders || TODO: autodetect!
// - Returns: MetaData object: http://docs.phonegap.com/en/2.7.0/cordova_file_file.md.html#Metadata

site.storage.getmetadata = function(path,fileOrFolder,opts,cb,errcb) {
	
	console.log("site.storage.getmetadata(): "+path+", "+fileOrFolder);
	
	// Check path, should contain site.cfg.paths.root
	if (path.indexOf(site.cfg.paths.root)<0) { // TODO: Should be indexOf(..)!==0
		errcb({code:-1,message:"site.storage.getmetadata().Error: Will not read outside of root directory: '"+path+"'"});
	}
	
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
					function(directoryEntry) {
						directoryEntry.getMetadata(cb,errcb);
					}
					errcb
				);
			} else if (opts.type==2) { // folder
				fileSystem.root.getDirectory(path,
					opts.path,
					function(directoryEntry) {
						directoryEntry.getMetadata(cb,errcb);
					}
					errcb
				);
			}
        },
        errcb
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

// Put

site.cookies.put = function(name,value) {
	try { window.localStorage.setItem(name, value); }
	catch(e) { console.warn(" > site.cookies.put failed: "+name+", "+value); return false; }
	return true;
}

// Get

site.cookies.get = function() {
	var res = false;
	try { res = window.localStorage.getItem(name); }
	catch(e) { res = false; }
	return res;
}

