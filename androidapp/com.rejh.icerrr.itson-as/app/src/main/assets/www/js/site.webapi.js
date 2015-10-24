
// ---------------------------------------------
// BZZ

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// WEBAPI

site.webapi = {};

// ---> Variables

site.webapi.ajaxRequests = {};
site.vars.downloadsInProgress = {};

// TODO: implement timeout!

// ---> Download

site.webapi.download = function(url,targetPath,targetFile,cb,errcb,progressCb) {
	
	loggr.log("site.webapi.download()");
	loggr.log(" > "+ url);
	
	if (!site.helpers.isConnected()) {
		errcb({code:-1,message:"No connection available"});
	}
	
	if (targetPath.indexOf("file://")>=0) {
		targetPath = targetPath.substr(targetPath.indexOf("file://"));
		var res = {
			fullPath : targetPath +"/"+ targetFile,
			name : targetFile
		};
		cb(res);
	}
	
	targetPath = encodeURI(targetPath);
	targetFile = targetFile;
	
	// Get file entry..
	site.storage.getFolderEntry(targetPath,
		function(folderEntry) {
			
			// Already downloaded?
			if (site.vars.downloadsInProgress[url] == targetFile) {
				loggr.error(" -> Already downloading: "+ url +" to "+ targetFile);
				return; // fail silently without calling errcb()??
			}
			site.vars.downloadsInProgress[url] = targetFile;
			
			// Go ahead, download it..
			loggr.log(" > Init download...");
			
			// Prep ..
			var fileTransfer = new FileTransfer();
			var dest = encodeURI(folderEntry.fullPath +"/"+ targetFile)
			
			// Test encoding.. (url)
			var uri = url;
			var url_decoded = decodeURI(url);
			if (url == url_decoded) {
				loggr.log(" -> Url needs encoding..");
				uri = encodeURI(url);
			}
			loggr.log(" >> "+ uri);
			
			// Progress?
			if (progressCb) {
				fileTransfer.onprogress = function(progressEvent) {
					progressCb(progressEvent);
				}
			}
		
			// A-go-go
			fileTransfer.download(
				uri,
				dest,
				function(entry) {
					// console.log("download complete: " + entry.fullPath);
					site.vars.downloadsInProgress[url] = false;
					cb(entry);
				},
				function(error) {
					loggr.error("download error source " + error.source, {dontupload:true});
					loggr.error("download error target " + error.target, {dontupload:true});
					loggr.error("download error code " + error.code, {dontupload:true});
					loggr.error(" > "+ site.storage.getFileTransferErrorType(error));
					site.vars.downloadsInProgress[url] = false;
					if (errcb) { errcb(error); }
				},
				true
			);
			
		},
		function(error) {
			loggr.error("Error: getFolderEntry?");
			loggr.error(" > "+ site.storage.getErrorType(error));
			console.error(error);
			errcb(error);
		}
	);
	
}

// ---> Ajax request

site.webapi.getajax = function(url,dataType,cb,errcb) {
	
	// -> http://www.sitepoint.com/web-foundations/mime-types-complete-list/
	
	loggr.debug("site.webapi.getajax()");
	loggr.log(" > "+url);
	
	if (!dataType) { dataType = "text/plain"; }
	
	var ajaxReqIdentifier = site.helpers.getUniqueID();
	var ajaxReq = $.ajax({
		url : url,
		dataType: dataType,
		success : function (data,textStatus,jqXHR ) {
			loggr.log(" > site.webapi.getajax().results: "+textStatus);
			cb(data,textStatus,jqXHR);
		}
	})
	.error(function(jqXHR, textStatus, errorThrown) { 
		// error
		loggr.error(" > site.webapi.getajax().Error: "+ textStatus +", "+ errorThrown);
		errcb({jqXHR:jqXHR, textStatus:textStatus, errorThrown:errorThrown, code:-1, message:errorThrown, extra_fields:["jqXHR","textStatus","errorThrown"]}); 
		site.webapi.cleanupAjaxRequests(ajaxReqIdentifier);
	});
	
	// Store apireq
	site.webapi.ajaxRequests[ajaxReqIdentifier] = ajaxReq;
	return ajaxReqIdentifier;
	
}

// ---> Stuff

// Execute action
// - Returns: cb(results) || TODO: raw json or only json['data'] --> nope, it's going to be json (with data and info fields)

site.webapi.exec = function(apiaction,apiquerystr,cb,errcb) {
	
	loggr.log("site.webapi.exec()");
	
	if (apiaction=="post") {
		site.webapi.post(apiaction,apiquerystr,cb,errcb);
		return;
	}
	
	// Parse apiquerystr || TODO: Important: how to handle urlencoding.. doing it here.. now..
	if (!apiquerystr) { apiquerystr = "{}"; }
	var apiqueryobj = JSON.parse(apiquerystr);
	var apiquery = encodeURIComponent(JSON.stringify(apiqueryobj));
	
	var apiurl = site.cfg.urls.api +"a="+ apiaction +"&q="+ apiquery +"&cache="+(new Date().getTime());
	loggr.log(" > "+apiurl);
	loggr.log(" > "+apiquerystr);
	
	var ajaxReqIdentifier = site.helpers.getUniqueID();
	var ajaxReq = $.getJSON(apiurl, function(results) {
		// ok
		if (results["error"]) {
			errcb({code:-1,message:results["errormsg"]});
			site.webapi.cleanupAjaxRequests(ajaxReqIdentifier);
			return;
		} else {
			results.info.size_kb = Math.ceil((JSON.stringify(results).length*8)/1024/10);
			loggr.log(" > site.webapi.exec().results: ~"+ results.info.size_kb +" kb");
			cb(results);
			site.webapi.cleanupAjaxRequests(ajaxReqIdentifier);
			return;
		}
	})
	.error(function(jqXHR, textStatus, errorThrown) { 
		// error
		loggr.error(" > site.webapi.exec().Error: \nApi action: "+ apiaction +", "+ apiquerystr +"\n"+ textStatus +", "+ errorThrown);
		errcb({jqXHR:jqXHR, textStatus:textStatus, errorThrown:errorThrown, code:-1, message:errorThrown, extra_fields:["jqXHR","textStatus","errorThrown"]}); 
		site.webapi.cleanupAjaxRequests(ajaxReqIdentifier);
	});
	
	// Store apireq
	site.webapi.ajaxRequests[ajaxReqIdentifier] = ajaxReq;
	return ajaxReqIdentifier;
	
}

// Post

site.webapi.post = function(apiaction,apiquerystr,data,cb,errcb) {
	
	loggr.log("site.webapi.post()");
	
	// Parse apiquerystr || TODO: Important: how to handle urlencoding.. doing it here.. now..
	if (!apiquerystr) { apiquerystr = "{}"; }
	var apikey = "REJH_ICERRR_APIKEY-"+ site.helpers.getUniqueID();
	var apiqueryobj = JSON.parse(apiquerystr);
	var apiquery = encodeURIComponent(JSON.stringify(apiqueryobj));
	
	var apiurl = site.cfg.urls.api +"a="+ apiaction +"&q="+ apiquery +"&apikey="+ apikey +"&cache="+(new Date().getTime());
	loggr.log(" > "+apiurl);
	loggr.log(" > "+apiquerystr);
	
	var ajaxReqIdentifier = site.helpers.getUniqueID();
	var ajaxReq = $.post(apiurl, data, function(results) {
			// ok
			if (results["error"]) {
				errcb({code:-1,message:results["errormsg"]});
				site.webapi.cleanupAjaxRequests(ajaxReqIdentifier);
				return;
			} else {
				results.info.size_kb = Math.ceil((JSON.stringify(results).length*8)/1024/10);
				loggr.log(" > site.webapi.post().results: ~"+ results.info.size_kb +" kb");
				cb(results);
				site.webapi.cleanupAjaxRequests(ajaxReqIdentifier);
				return;
			} 
		}
	).error(function(jqXHR, textStatus, errorThrown) { 
		// error
		loggr.error(" > site.webapi.post().Error: \nApi action: "+ apiaction +", "+ apiquerystr +"\n"+ textStatus +", "+ errorThrown,{dontupload:true});
		errcb({jqXHR:jqXHR, textStatus:textStatus, errorThrown:errorThrown, code:-1, message:errorThrown, extra_fields:["jqXHR","textStatus","errorThrown"]}); 
		site.webapi.cleanupAjaxRequests(ajaxReqIdentifier);
	});
	
	// Store apireq
	site.webapi.ajaxRequests[ajaxReqIdentifier] = ajaxReq;
	return ajaxReqIdentifier;
	
}

// Cancel

site.webapi.abort = function(ajaxReqIdentifier) {
	
	loggr.debug("site.webapi.cancel(): "+ajaxReqIdentifier);
	
	loggr.log(" > Abort..");
	var ajaxReq = site.webapi.ajaxRequests[ajaxReqIdentifier];
	if (!ajaxReq) { loggr.warn(" > Ajax request does not exist (anymore)"); return; }
	ajaxReq.abort();
	
	loggr.log(" > Cleanup..");
	site.webapi.cleanupAjaxRequests(ajaxReqIdentifier);
	
}

// Cleanup

site.webapi.cleanupAjaxRequests = function(ajaxReqIdentifier) {
	
	loggr.debug("site.webapi.cleanupAjaxRequests(): "+ajaxReqIdentifier);
	
	var ajaxReq = site.webapi.ajaxRequests[ajaxReqIdentifier];
	if (!ajaxReq) { loggr.warn(" > Ajax request does not exist (anymore)"); return; }
	
	var newAjaxRequests = {};
	for (var id in site.webapi.ajaxRequests) {
		if (id==ajaxReqIdentifier) { continue; }
		if (!site.webapi.ajaxRequests[id]) { continue; }
		newAjaxRequests[id] = site.webapi.ajaxRequests[id];
	}
	
	loggr.log(" > Before: "+ site.helpers.countObj(site.webapi.ajaxRequests));
	loggr.log(" > After:  "+ site.helpers.countObj(newAjaxRequests));
	
	site.webapi.ajaxRequests = newAjaxRequests;
	
}















