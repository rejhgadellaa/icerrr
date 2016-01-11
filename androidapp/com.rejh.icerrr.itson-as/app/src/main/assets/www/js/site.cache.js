if(!site){var site={};}
site.cache={};site.cache.db=[];site.cache.init=function(){loggr.debug("site.cache.init()");loggr.log(" > Nothing to init yet..?");}
site.cache.get=function(url,cb,optionalCbErr,optionalType,optionalFilename){loggr.debug("site.cache.get()");if(site.cache.isCachedFile(url)){return site.cache.getCachedFile(url);}
if(!optionalType){optionalType="other";}
if(!optionalFilename){optionalFilename=site.cache.getFilenameFromUrl(url);}
var filename=optionalFilename;var filepath=site.cfg.paths.root+optionalType;site.webapi.download=function(url,filepath,filename,cb,optionalCbErr,progressCb);var dbObj={};dbObj.url=url;dbObj.type=optionalType;dbObj.filename=optionalFilename;dbObj.localurl="";site.cache.db.push(dbObj);}
site.cache.isCachedFile=function(url){loggr.log("site.cache.isFileCached()");if(site.cache.getCachedFileIndex(url)>=0){return true;}else{return false;}}
site.cache.getCachedFile=function(url,alreadyChecked){loggr.log("site.cache.getFileCached()");if(!alreadyChecked){if(!site.cache.isFileCached(url)){return false;}}
var index=site.cache.getCachedFileIndex(url);if(index>=0){return site.cache.db[index];}else{loggr.warn(" > site.cache.getFileCached().w: index <= 0");return false;}}
site.cache.getCachedFileIndex=function(url){loggr.log("site.cache.getCachedFileIndex()");for(var i=0;i<site.cache.db.length;i++){var dbObj=site.cache.db[i];if(dbObj.url==url){return i;}}
return-1;}
site.cache.getFilenameFromUrl=function(url){loggr.log("site.cache.getFilenameFromUrl()");var filename=url.substr(url.lastIndexOf("/")+1);if(filename.indexOf("?")>0){filename=filename.substr(0,filename.lastIndexOf("?"));}
return filename;}