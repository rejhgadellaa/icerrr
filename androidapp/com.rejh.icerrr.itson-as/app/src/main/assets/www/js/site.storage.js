if(!site){var site={};}
site.storage={};site.storage.timeouts={};site.storage.addTimeout=function(action,time,args){if(!time){time=2000;}
var timeoutID=site.helpers.getUniqueID(action);loggr.debug("site.storage.addTimeout(): "+action+", "+timeoutID);site.storage.timeouts[timeoutID]={};site.storage.timeouts[timeoutID].action=action
site.storage.timeouts[timeoutID].args=args;site.storage.timeouts[timeoutID].timeout=setTimeout(function(){loggr.warn("site.storage timeout! Action: '"+action+"'",{dontupload:true});loggr.warn(JSON.stringify(args),{dontupload:true});if(!site.storage.timeouts[timeoutID]){loggr.warn("site.storage.timeouts["+timeoutID+"] is null?");return;}
if(site.storage.timeouts[timeoutID].canAbort){loggr.log(" > Can abort, will retry...");site.storage.timeouts[timeoutID].abortObj.abort();switch(action){case"readfile":loggr.log(" > Retry action: "+action);site.storage.removeTimeout(timeoutID);site.storage.readfile(args.path,args.filename,args.cb,args.errcb,args.opts);break;default:loggr.error(" > Could not retry action: '"+action+"'");}}else{loggr.warn(" > Cannot abort file operation, ask user to restart app");}
loggr.log(" > Endof storage.timeout");site.storage.removeTimeout(timeoutID);},time);return timeoutID;}
site.storage.removeTimeout=function(timeoutID){loggr.debug("site.storage.removeTimeout(): "+timeoutID);if(!site.storage.timeouts[timeoutID]){loggr.warn(" > site.storage.removeTimeout: "+timeoutID+" not found");return;}
if(site.storage.timeouts[timeoutID].timeout){clearTimeout(site.storage.timeouts[timeoutID].timeout);}
site.storage.timeouts[timeoutID]=null;var foundActiveTimeout=false;for(var id in site.storage.timeouts){if(site.storage.timeouts[id]){foundActiveTimeout=true;break;}}
if(!foundActiveTimeout){site.storage.timeouts={};}}
site.storage.preCb=function(cb,res,timeoutID){if(timeoutID){site.storage.removeTimeout(timeoutID);}
site.storage.isBusy=false;cb(res);}
site.storage.preCbErr=function(cberr,err,timeoutID){if(timeoutID){site.storage.removeTimeout(timeoutID);}
site.storage.isBusy=false;cberr(err);}
site.session.storage={};site.session.storage.queue=[];site.storage.enqueue=function(action,args){loggr.debug("site.storage.enqueue(): "+action);loggr.log(" > "+JSON.stringify(args));if(!site.session.storage){site.session.storage={};}
if(!site.session.storage.queue){site.session.storage.queue=[];}
for(var i=0;i<site.session.storage.queue.length;i++){var queue_item=site.session.storage.queue[i];if(queue_item.action==action&&JSON.stringify(queue_item.args)==JSON.stringify(args)){loggr.log(" > Duplicate exists.. what now? we dont want UNLIMITED LOOPS!");}}
site.session.storage.queue.push({"action":action,"args":jQuery.extend(true,{},args)});if(!site.timeouts.storage_queue){site.timeouts.storage_queue=setTimeout(function(){site.storage.runqueue();},1);}}
site.storage.runqueue=function(){loggr.debug("site.storage.runqueue()");if(!site.session.storage){return;}
if(site.session.storage.queue.length<1){loggr.log(" > Queue empty, stop...");if(site.timeouts.storage_queue){clearTimeout(site.timeouts.storage_queue);}
return;}
var queue_item=site.session.storage.queue[0];var action=queue_item.action;var args=queue_item.args;if(site.timeouts.storage_queue){clearTimeout(site.timeouts.storage_queue);}
site.timeouts.storage_queue=setTimeout(function(){site.storage.runqueue();},1000);if(!site.storage.isBusy){switch(action){case"createfolder":site.storage.createfolder(args.path,args.cb,args.errcb);break;case"readfolder":site.storage.readfolder(args.path,args.cb,args.errcb,args.opts);break;case"writefile":site.storage.writefile(args.path,args.filename,args.data,args.cb,args.errcb,args.opts);break;case"readfile":site.storage.readfile(args.path,args.filename,args.cb,args.errcb,args.opts);break;case"getmetadata":site.storage.getmetadata(args.path,args.fileOrFolder,args.cb,args.errcb,args.opts);break;default:alert("site.storage.runqueue().Error: invalid value for 'action': "+action);loggr.log("site.storage.runqueue().Error: invalid value for 'action': "+action);loggr.log(action+", "+JSON.stringify(args));break;}
site.session.storage.queue.shift();}}
site.storage.runqueue_cb=function(){}
site.storage.removefolder=function(path,cb,errcb,opts){loggr.debug("site.storage.removefolder(): "+path);if(path.indexOf(site.cfg.paths.root)<0){errcb({code:-1,message:"site.storage.createfolder().Error: Will not write outside of root directory: '"+path+"'"});return; }
if(path.lastIndexOf("/")==path.length-1){path=path.substr(0,path.length-1);loggr.log(" > "+path);}
if(!opts){opts={};}
window.requestFileSystem(LocalFileSystem.PERSISTENT,0,function(fileSystem){fileSystem.root.getDirectory(path,{create:false},function(entry){if(opts.recursively){entry.removeRecursively(cb,errcb);}
else{entry.remove(cb,errcb);}
site.storage.isBusy=false;},function(error){site.storage.isBusy=false;errcb(error);});},function(){site.storage.isBusy=false;errcb();});}
site.storage.createfolder=function(path,cb,errcb){loggr.debug("site.storage.createfolder(): "+path);if(path.indexOf(site.cfg.paths.root)<0){errcb({code:-1,message:"site.storage.createfolder().Error: Will not write outside of root directory: '"+path+"'"});return; }
if(site.storage.isBusy){var args={path:path,cb:cb,errcb:errcb};}
site.storage.isBusy=true;window.requestFileSystem(LocalFileSystem.PERSISTENT,0,function(fileSystem){fileSystem.root.getDirectory(path,{create:true},function(entry){site.storage.isBusy=false;cb(entry);},function(error){site.storage.isBusy=false;errcb(error);});},function(error){site.storage.isBusy=false;errcb(error);});}
site.storage.readfolder=function(path,cb,errcb,opts){loggr.debug("site.storage.readfolder(): "+path);if(path.indexOf(site.cfg.paths.root)<0){errcb({code:-1,message:"site.storage.readfolder().Error: Will not read outside of root directory: '"+path+"'"});return; }
if(site.storage.isBusy){var args={path:path,cb:cb,errcb:errcb,opts:opts};}
site.storage.isBusy=true;if(!opts){opts={};}
if(!opts.path){opts.path={};}
if(opts.path.create!==false){opts.path.create=true;}
if(opts.path.exclusive!==false){opts.path.exclusive=false;}
if(!opts.mode){opts.mode=0;}
window.requestFileSystem(LocalFileSystem.PERSISTENT,0,function(fileSystem){fileSystem.root.getDirectory(path,opts.path,function(directoryEntry){var directoryReader=directoryEntry.createReader();directoryReader.readEntries(function(fileAndDirectoryEntries){var res=[];for(var i=0;i<fileAndDirectoryEntries.length;i++){if(opts.mode==1&&fileAndDirectoryEntries[i].isDirectory){continue;}
if(opts.mode==2&&fileAndDirectoryEntries[i].isFile){continue;}
res.push(fileAndDirectoryEntries[i]);}
site.storage.isBusy=false;cb(res);},function(error){site.storage.isBusy=false;errcb(error);});},function(error){site.storage.isBusy=false;errcb(error);});},function(error){site.storage.isBusy=false;errcb(error);});}
site.storage.writefile=function(path,filename,data,cb,errcb,opts){loggr.debug("site.storage.writefile(): "+path+", "+filename+", ~"+site.helpers.calcStringToKbytes(data)+" kb");if(path.indexOf(site.cfg.paths.root)<0){errcb({code:-1,message:"site.storage.writefile().Error: Will not write outside of root directory: '"+path+"'"});return; }
if(site.storage.isBusy){var args={path:path,filename:filename,data:data,cb:cb,errcb:errcb,opts:opts};}
site.storage.isBusy=true;if(!opts){opts={};}
if(!opts.path){opts.path={};}
if(opts.path.create!==false){opts.path.create=true;}
if(opts.path.exclusive!==true){opts.path.exclusive=false;}
if(!opts.file){opts.file={};}
if(opts.file.create!==false){opts.file.create=true;}
if(opts.file.exclusive!==true){opts.file.exclusive=false;}
window.requestFileSystem(LocalFileSystem.PERSISTENT,0,function(fileSystem){fileSystem.root.getDirectory(path,opts.path,function(directoryEntry){directoryEntry.getFile(filename,opts.file,function(fileEntry){var fileWriter=fileEntry.createWriter(function(fileWriter){fileWriter.onwrite=function(evt){site.storage.isBusy=false;cb(evt);};fileWriter.onabort=function(error){site.storage.isBusy=false;errcb(error);};fileWriter.onerror=function(error){site.storage.isBusy=false;errcb(error);};fileWriter.write(data);},function(error){site.storage.isBusy=false;errcb(error);});},function(error){site.storage.isBusy=false;errcb(error);});},function(error){site.storage.isBusy=false;errcb(error);});},function(error){site.storage.isBusy=false;errcb(error);});}
site.storage.deletefile=function(path,filename,cb,errcb,opts){loggr.debug("site.storage.deletefile(): "+path+", "+filename);if(path.indexOf(site.cfg.paths.root)<0){errcb({code:-1,message:"site.storage.deletefile().Error: Will not read outside of root directory: '"+path+"'"});return; }
if(site.storage.isBusy){}
site.storage.isBusy=true;if(!opts){opts={};}
if(!opts.path){opts.path={};}
if(opts.path.create!==true){opts.path.create=false;}
if(opts.path.exclusive){opts.path.exclusive=false;}
if(!opts.file){opts.file={};}
if(opts.file.create!==true){opts.file.create=false;}
if(opts.file.exclusive!==true){opts.file.exclusive=false;}
if(opts.file.readAsDataUrl!==true){opts.file.readAsDataUrl=false;}
site.storage.getFileEntry(path,filename,function(fileEntry){fileEntry.remove(cb,errcb);},function(error){errcb(error);},{path:{create:true},file:{create:true}});}
site.storage.readfile=function(path,filename,cb,errcb,opts){loggr.debug("site.storage.readfile(): "+path+", "+filename);if(path.indexOf(site.cfg.paths.root)<0&&opts&&opts.readOutsideRoot!==true){errcb({code:-1,message:"site.storage.readfile().Error: Will not read outside of root directory: '"+path+"'"});return; }
if(site.storage.isBusy){var args={path:path,filename:filename,cb:cb,errcb:errcb,opts:opts};}
site.storage.isBusy=true;if(!opts){opts={};}
if(!opts.path){opts.path={};}
if(opts.path.create!==true){opts.path.create=false;}
if(opts.path.exclusive){opts.path.exclusive=false;}
if(!opts.file){opts.file={};}
if(opts.file.create!==true){opts.file.create=false;}
if(opts.file.exclusive!==true){opts.file.exclusive=false;}
if(opts.file.readAsDataUrl!==true){opts.file.readAsDataUrl=false;}
var timeoutID=site.storage.addTimeout("readfile",null,{path:path,filename:filename,cb:cb,errcb:errcb,opts:opts});window.requestFileSystem(LocalFileSystem.PERSISTENT,0,function(fileSystem){fileSystem.root.getDirectory(path,opts.path,function(directoryEntry){directoryEntry.getFile(filename,opts.file,function(fileEntry){fileEntry.file(function(file){var fileReader=new FileReader();site.storage.timeouts[timeoutID].canabort=true;site.storage.timeouts[timeoutID].abortObj=fileReader;fileReader.onload=function(evt){if(!site.storage.timeouts[timeoutID]){loggr.warn(" > site.storage.readfile(): canceled action suddenly got fired");}
site.storage.preCb(cb,evt.target.result,timeoutID);}
fileReader.onerror=function(error){site.storage.preCbErr(errcb,error,timeoutID);};if(opts.file.readAsDataUrl){fileReader.readAsDataURL(file);}
if(opts.file.readAsBinaryString){fileReader.readAsBinaryString(file);}
if(opts.file.readAsBinaryString){fileReader.readAsArrayBuffer(file);}
else{fileReader.readAsText(file);}},function(error){site.storage.preCbErr(errcb,error,timeoutID);});},function(error){site.storage.preCbErr(errcb,error,timeoutID);});},function(error){site.storage.preCbErr(errcb,error,timeoutID);});},function(error){site.storage.preCbErr(errcb,error,timeoutID);});}
site.storage.copyfile=function(path,filename,destpath,destfilename,cb,errcb,opts){loggr.log("site.storage.getFileEntry(): "+path+", "+filename);if(path.indexOf(site.cfg.paths.root)<0&&opts&&opts.readOutsideRoot!==true){errcb({code:-1,message:"site.storage.getFileEntry().Error: Will not read outside of root directory: '"+path+"'"});return; }
if(site.storage.isBusy){var args={path:path,filename:filename,cb:cb,errcb:errcb,opts:opts};}
site.storage.isBusy=true;if(!opts){opts={};}
if(!opts.path){opts.path={};}
if(opts.path.create!==true){opts.path.create=false;}
if(opts.path.exclusive){opts.path.exclusive=false;}
if(!opts.file){opts.file={};}
if(opts.file.create!==true){opts.file.create=false;}
if(opts.file.exclusive!==true){opts.file.exclusive=false;}
if(opts.file.readAsDataUrl!==true){opts.file.readAsDataUrl=false;}
var timeoutID=site.storage.addTimeout("copyfile",null,{path:path,filename:filename,cb:cb,errcb:errcb,opts:opts});site.storage.getFileEntry(path,filename,function(fileEntry){fileEntry.copyTo(destpath,destfilename,function(fileEntry){site.storage.preCb(cb,fileEntry,timeoutID);},function(error){site.storage.preCbErr(errcb,error,timeoutID);});},function(error){site.storage.preCbErr(errcb,error,timeoutID);});}
site.storage.getFileEntry=function(path,filename,cb,errcb,opts){loggr.log("site.storage.getFileEntry(): "+path+", "+filename);if(path.indexOf(site.cfg.paths.root)<0&&opts&&opts.readOutsideRoot!==true){errcb({code:-1,message:"site.storage.getFileEntry().Error: Will not read outside of root directory: '"+path+"'"});return; }
if(site.storage.isBusy){var args={path:path,filename:filename,cb:cb,errcb:errcb,opts:opts};}
site.storage.isBusy=true;if(!opts){opts={};}
if(!opts.path){opts.path={};}
if(opts.path.create!==true){opts.path.create=false;}
if(opts.path.exclusive){opts.path.exclusive=false;}
if(!opts.file){opts.file={};}
if(opts.file.create!==true){opts.file.create=false;}
if(opts.file.exclusive!==true){opts.file.exclusive=false;}
if(opts.file.readAsDataUrl!==true){opts.file.readAsDataUrl=false;}
var timeoutID=site.storage.addTimeout("getFileEntry",null,{path:path,filename:filename,cb:cb,errcb:errcb,opts:opts});window.requestFileSystem(LocalFileSystem.PERSISTENT,0,function(fileSystem){loggr.log(" > Get directory entry: "+path);fileSystem.root.getDirectory(path,opts.path,function(directoryEntry){loggr.log(" > Get file entry: "+path+", "+filename);directoryEntry.getFile(filename,opts.file,function(fileEntry){loggr.log(" > Got file: "+fileEntry.fullPath);site.storage.preCb(cb,fileEntry,timeoutID);},function(error){loggr.error(" > Err on getFile",{dontupload:true});site.storage.preCbErr(errcb,error,timeoutID);});},function(error){loggr.error(" > Err on getDirectory",{dontupload:true});site.storage.preCbErr(errcb,error,timeoutID);});},function(error){site.storage.preCbErr(errcb,error,timeoutID);});}
site.storage.getFolderEntry=function(path,cb,errcb,opts){loggr.log("site.storage.getFolderEntry(): "+path);if(path.indexOf(site.cfg.paths.root)<0){errcb({code:-1,message:"site.storage.getFolderEntry().Error: Will not read outside of root directory: '"+path+"'"});return; }
if(site.storage.isBusy){}
site.storage.isBusy=true;if(!opts){opts={};}
if(!opts.path){opts.path={};}
if(opts.path.create!==true){opts.path.create=false;}
if(opts.path.exclusive!==true){opts.path.exclusive=false;}
var timeoutID=site.storage.addTimeout("getFolderEntry",null,{path:path,cb:cb,errcb:errcb,opts:opts});window.requestFileSystem(LocalFileSystem.PERSISTENT,0,function(fileSystem){fileSystem.root.getDirectory(path,opts.path,function(directoryEntry){site.storage.preCb(cb,directoryEntry,timeoutID);},function(error){site.storage.preCbErr(errcb,error,timeoutID);});},function(error){site.storage.preCbErr(errcb,error,timeoutID);});}
site.storage.listfiles=function(path,cb,errcb,opts){loggr.debug("site.storage.getFolderSize()");var hasSubFolder=false;var size=0;var entries=[];site.storage.getFolderEntry(path,function(folderEntry){loggr.log(" > Got folderEntry: "+folderEntry.fullPath);var reader=folderEntry.createReader();reader.readEntries(function(entries){cb(entries);return;},function(error){alert(error);errcb(error);});},function(error){alert(error);errcb(error);},{path:{create:true}});}
site.storage.getmetadata=function(path,fileOrFolder,cb,errcb,opts){loggr.debug("site.storage.getmetadata(): "+path+", "+fileOrFolder);if(path.indexOf(site.cfg.paths.root)<0){errcb({code:-1,message:"site.storage.getmetadata().Error: Will not read outside of root directory: '"+path+"'"});return; }
if(site.storage.isBusy){var args={path:path,fileOrFolder:fileOrFolder,cb:cb,errcb:errcb,opts:opts};}
site.storage.isBusy=true;if(!opts){opts={};}
if(!opts.path){opts.path={};}
if(opts.path.create!==true){opts.path.create=false;}
if(opts.path.exclusive){opts.path.exclusive=false;}
if(!opts.type){opts.type=1;}
window.requestFileSystem(LocalFileSystem.PERSISTENT,0,function(fileSystem){if(opts.type==0){errcb({code:-1,message:"site.storage.getmetadata().Error: autodetect not implemented"});}else if(opts.type==1){fileSystem.root.getFile(path,opts.path,function(entry){entry.getMetadata(function(metadata){site.storage.isBusy=false;cb(metadata);},function(error){site.storage.isBusy=false;errcb(error);});},function(error){site.storage.isBusy=false;errcb(error);});}else if(opts.type==2){fileSystem.root.getDirectory(path,opts.path,function(entry){entry.getMetadata(function(metadata){site.storage.isBusy=false;cb(metadata);},function(error){site.storage.isBusy=false;errcb(error);});},function(error){site.storage.isBusy=false;errcb(error);});}},function(error){site.storage.isBusy=false;errcb(error);});}
site.storage.getErrorType=function(error){var res="FileError.UNKNOWN";switch(error.code){case FileError.NOT_FOUND_ERR:res="FileError.NOT_FOUND_ERR";break;case FileError.SECURITY_ERR:res="FileError.SECURITY_ERR";break;case FileError.ABORT_ERR:res="FileError.ABORT_ERR";break;case FileError.NOT_READABLE_ERR:res="FileError.NOT_READABLE_ERR";break;case FileError.ENCODING_ERR:res="FileError.ENCODING_ERR";break;case FileError.NO_MODIFICATION_ALLOWED_ERR:res="FileError.NO_MODIFICATION_ALLOWED_ERR";break;case FileError.INVALID_STATE_ERR:res="FileError.INVALID_STATE_ERR";break;case FileError.SYNTAX_ERR:res="FileError.SYNTAX_ERR";break;case FileError.INVALID_MODIFICATION_ERR:res="FileError.INVALID_MODIFICATION_ERR";break;case FileError.QUOTA_EXCEEDED_ERR:res="FileError.QUOTA_EXCEEDED_ERR";break;case FileError.TYPE_MISMATCH_ERR:res="FileError.TYPE_MISMATCH_ERR";break;case FileError.PATH_EXISTS_ERR:res="FileError.PATH_EXISTS_ERR";break;case-1:if(error.message){res=error.message;}
break;}
return res;}
site.storage.getFileTransferErrorType=function(error){var res="FileTransferError.UNKNOWN";switch(error.code){case FileTransferError.NOT_FOUND_ERR:res="FileTransferError.NOT_FOUND_ERR";break;case FileTransferError.INVALID_URL_ERR:res="FileTransferError.INVALID_URL_ERR";break;case FileTransferError.CONNECTION_ERR:res="FileTransferError.CONNECTION_ERR";break;case FileTransferError.ABORT_ERR:res="FileTransferError.ABORT_ERR";break;case-1:if(error.message){res=error.message;}
break;}
return res;}
site.storage.getfilename=function(path){if(!path){path="";}
if(path.indexOf("/")>0){return path.substr(path.lastIndexOf("/")+1);}else{return path;}}
site.storage.getpath=function(path,mode){if(!path){path="";}
if(path.indexOf("/")>0){if(path.lastIndexOf("/")==path.length-1){path=path.substr(0,path.length-1);}
path=path.substr(0,path.lastIndexOf("/"));if(mode==1){path=site.helpers.replaceAll("file://","",path);}else if(mode==2){if(path.indexOf("file://")!=0){path="file://"+path;}}
return path;}else{return path;}}
site.cookies={};site.cookies.put=function(name,value){try{window.localStorage.setItem(name,value);}
catch(e){loggr.warn(" > site.cookies.put failed: "+name+", "+value);return false;}
return true;}
site.cookies.get=function(name){var res=false;try{res=window.localStorage.getItem(name);}
catch(e){res=false;}
return res;}
site.cookies.clear=function(){window.localStorage.clear();}