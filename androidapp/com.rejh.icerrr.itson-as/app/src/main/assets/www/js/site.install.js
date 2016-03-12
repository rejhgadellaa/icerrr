if(!site){var site={};}
site.installer={};site.installer.cfg={}
site.installer.cfg.createfolders_folders=[site.cfg.paths.root,site.cfg.paths.json,site.cfg.paths.images,site.cfg.paths.logs,site.cfg.paths.other,];site.installer.cfg.delete_files=[{"file_path":site.cfg.paths.json,"file_name":"local.site_session.json","put":"{}"},{}];site.installer.cfg.downloadjson_files=[{"dest_path":site.cfg.paths.json,"dest_name":"stations.json","query":"{\"get\":\"stations\"}"},{}];site.installer.cfg.overwrite_versions=[0.014,0.019,0.027,0.035,0.036,0.037,0.038];site.installer.init=function(isUpdate){loggr.debug("site.installer.init()");site.ui.showLoadbar();$("#home").css("display","none");if(!site.helpers.isConnected()){navigator.notification.confirm("Icerrr needs a working internet connection.\n\nYour current connections status is: "+site.helpers.getConnType()+"\n\nPlease make sure you are connected and try again.",function(buttonIndex){if(buttonIndex==1){site.installer.init(isUpdate)}else{site.lifecycle.exit();}},"Warning","Continue,Exit");return;}
if(isUpdate){site.installer.isUpdate=true;site.installer.logger("Just doing some routine checks. This shouldn't take long...<br><br>",{nobullet:true});}else{site.installer.logger("Icerrr needs to set up some stuff before it's ready to use...<br><br>",{nobullet:true});}
site.ui.gotosection("#install");site.installer.vars={};site.installer.cfg.overwrite_version=site.installer.cfg.overwrite_versions.pop()
if(!window.JSInterface.hasIcerrrPermissions()){site.ui.hideLoadbar();var msg="<span style='font-size:14pt'>"
+"<strong>Permission required: read/write external storage</strong><br><br>"
+"Please grant access to your external storage so Icerrr can write some files (and read them later on).<br><br>"
+"<a href='javascript:void(0);' onclick='window.JSInterface.requestIcerrrPermissions()'>Grant permission</a>";site.installer.logger(msg,{nobullet:true,nobr:true});site.lifecycle.add_section_history("#exit");return;}
setTimeout(function(){site.installer.update();},1000);}
site.installer.update=function(){loggr.debug("site.installer.update()");if(!site.cookies.get("app_is_installed")){loggr.log(" > Init settings for fresh install..");loggr.log(" >> Setting: 'useWifi' = true");window.mediaStreamer.setting("bool","useWifi",true,function(res){},function(error){loggr.error(error);});loggr.log(" >> Setting: 'sendLogs' = true");site.cookies.put("setting_sendLogs",1);}
else if(site.cookies.get("app_version")<=site.cfg.app_version){loggr.log(" > Update from older version..");}
if(site.cookies.get("app_version")<0.166){loggr.error(" > Update to 0.166..",{dontupload:true});loggr.log(" >> Setting: 'sendLogs' = true");site.cookies.put("setting_sendLogs",1);}
if(site.cookies.get("app_version")<0.192){loggr.error(" > Update to 0.193..",{dontupload:true});loggr.log(" >> Setting: 'useSpeakerForAlarms' = true");window.mediaStreamer.setting("bool","useSpeakerForAlarms",true,function(res){loggr.log(" > Stored: "+res);},function(error){loggr.error(error);});}
if(site.cookies.get("app_version")<0.206){loggr.error(" > Update to 0.207..",{dontupload:true});loggr.log(" >> Setting: 'showStationIcon' = true");site.cookies.put("setting_showStationIcon",1);window.mediaStreamer.setting("bool","showStationIcon",true,function(res){loggr.log(" > Stored: "+res);},function(error){loggr.error(error);});}
if(site.cookies.get("app_version")<0.249&&site.installer.isUpdate){loggr.error(" > Update to 0.250..",{dontupload:true});loggr.log(" >> Reset session.blacklistedAlbumArt");site.session.blacklistedAlbumArt={};site.helpers.storeSession();}
if(site.cookies.get("app_version")<0.255){loggr.error(" > Update to 0.256..",{dontupload:true});loggr.log(" >> Enable setting_colorizeAlbumArt");site.cookies.put("setting_colorizeAlbumArt",1)}
if(site.cookies.get("app_version")<0.315){loggr.error(" > Update to 0.316..",{dontupload:true});loggr.log(" >> Setting: 'turnOnScreenForAlarms' = true");window.mediaStreamer.setting("bool","turnOnScreenForAlarms",true,function(res){loggr.log(" > Stored: "+res);},function(error){loggr.error(error);});}
if(site.cookies.get("app_version")<0.315){loggr.error(" > Update to 0.316..",{dontupload:true});loggr.log(" >> Setting: 'turnOnScreenForAlarms' = true");window.mediaStreamer.setting("bool","turnOnScreenForAlarms",true,function(res){loggr.log(" > Stored: "+res);},function(error){loggr.error(error);});}
if(site.cookies.get("app_version")<0.349){loggr.error(" > Update to 0.350..",{dontupload:true});loggr.log(" >> Setting: 'enableCC' = true");site.cookies.put("setting_enableCC",1)}
if(site.cookies.get("app_is_installed")&&site.cookies.get("app_version")<0.175){loggr.error(" > Update to 0.176..",{dontupload:true});loggr.log(" >> Set flag to upgrade starred stations");site.cookies.put("upgrade_starred_stations",1);}
setTimeout(function(){site.installer.deletefolders();},500);}
site.installer.deletefolders=function(){if(!site.cookies.get("app_is_installed")||site.installer.cfg.overwrite_version>=site.cfg.app_version){var opts={create:false};site.storage.getFolderEntry(site.cfg.paths.root,function(entry){site.installer.logger("Clear old folders...");site.storage.removefolder(site.cfg.paths.root,function(res){setTimeout(function(){site.installer.createfolders_init();},500);},function(fileError){loggr.error(" > removefolder.Error: "+site.storage.getErrorType(fileError),{dontupload:true});loggr.error(" > "+fileError.message);setTimeout(function(){site.installer.createfolders_init();},500);},{recursively:true});},function(fileError){console.error(fileError);site.installer.createfolders_init();},opts);}else{site.installer.createfolders_init();}}
site.installer.createfolders_init=function(){if(!site.installer.isUpdate){site.installer.logger("Create folders...");}
else{site.installer.logger("Check folders...");}
site.installer.createfolders_next();}
site.installer.createfolders_next=function(){loggr.debug("site.installer.createfolders_next()");if(!site.installer.vars.pathNum&&site.installer.vars.pathNum!==0){site.installer.vars.pathNum=-1;}
site.installer.vars.pathNum++;currentpath=site.installer.cfg.createfolders_folders[site.installer.vars.pathNum];loggr.log(" > currentpath: "+currentpath);if(!currentpath){site.installer.deletefiles_init();return;}
site.storage.createfolder(currentpath,function(dirEntry){if(site.cfg.nomediapaths.indexOf(currentpath)>=0){site.storage.writefile(currentpath,".nomedia","/* this directory should not be scanned by android media scanner */",function(fileEntry){loggr.log(" -> Created .nomedia file");site.installer.createfolders_cb(dirEntry);},function(error){loggr.error(" -> Failed creating .nomedia file in "+currentpath);site.installer.createfolders_errcb(error);});}else{site.installer.createfolders_cb(dirEntry);}},site.installer.createfolders_errcb);}
site.installer.createfolders_cb=function(directoryEntry){loggr.debug("site.installer.createfolders_cb()");site.installer.createfolders_next();}
site.installer.createfolders_errcb=function(error){loggr.debug("site.installer.createfolders_errcb()");site.installer.logger(" ERR",{use_br:false,is_e:true});site.installer.logger("&nbsp;&gt; "+site.storage.getErrorType(error)+"",{is_e:true});}
site.installer.deletefiles_init=function(){site.installer.downloadjson_init();}
site.installer.deletefiles_next=function(){site.installer.downloadjson_init();}
site.installer.downloadjson_init=function(){if(!site.installer.isUpdate){site.installer.logger("Download station data...");}
else{site.installer.logger("Update station data...");}
site.installer.downloadjson_next();}
site.installer.downloadjson_next=function(){loggr.debug("site.installer.downloadjson_next()");if(!site.installer.vars.jsonNum&&site.installer.vars.jsonNum!==0){site.installer.vars.jsonNum=-1;}
site.installer.vars.jsonNum++;currentjob=site.installer.cfg.downloadjson_files[site.installer.vars.jsonNum];loggr.log(" > currentjob: "+currentjob.query);if(!currentjob.query){site.installer.finishup();return;}
if(currentjob.query=="{}"){site.installer.downloadjson_next();return;}
var apiquerystr=currentjob.query;var apiaction="get";site.webapi.exec(apiaction,apiquerystr,site.installer.downloadjson_cb,site.installer.downloadjson_errcb);}
site.installer.downloadjson_cb=function(res){loggr.debug("site.installer.downloadjson_cb(): "+site.helpers.countObj(res["data"]));site.datatemp=res;site.installer.downloadjson_read();}
site.installer.downloadjson_errcb=function(error){loggr.debug("site.installer.downloadjson_errcb()");site.installer.logger(" ERR",{use_br:false,is_e:true});site.installer.logger("&nbsp;&gt; "+error["message"]+"",{is_e:true});if(site.installer.isUpdate){site.installer.finishup();}
}
site.installer.downloadjson_read=function(){loggr.debug("site.installer.downloadjson_read()");if(!site.installer.vars.jsonNum&&site.installer.vars.jsonNum!==0){}
currentjob=site.installer.cfg.downloadjson_files[site.installer.vars.jsonNum];loggr.log(" > currentjob: "+currentjob.query);var path=currentjob.dest_path;var filename=currentjob.dest_name;loggr.log(" > Path: "+path);loggr.log(" > Filename: "+filename);site.storage.readfile(path,filename,function(datalocalstr){loggr.log(" > Read OK: ~"+site.helpers.calcStringToKbytes(datalocalstr)+" kb");if(!datalocalstr){loggr.log(" >> No datalocalstr, just write the file");site.installer.downloadjson_write();return;}
var datalocal=JSON.parse(datalocalstr);var dataremote=site.datatemp["data"];switch(site.datatemp["info"]["desc"]){case"stations":if(site.installer.cfg.overwrite_version<=site.cookies.get("app_version")||site.cookies.get("app_version")==site.cfg.app_version){site.datatemp["data"]=site.helpers.mergeStations(datalocal,dataremote);}else{site.datatemp["data"]=dataremote;}
site.data.stations=site.datatemp["data"];break;default:site.datatemp["data"]=dataremote
break;}
site.installer.downloadjson_write();},function(error){loggr.log("site.installer.downloadjson_read().Error");site.installer.logger(" ERR",{use_br:false,is_e:true});site.installer.logger("&nbsp;&gt; "+JSON.stringify(error)+"",{is_e:true});},{file:{create:true},end:true});}
site.installer.downloadjson_write=function(){loggr.debug("site.installer.downloadjson_write()");if(!site.installer.vars.jsonNum&&site.installer.vars.jsonNum!==0){}
currentjob=site.installer.cfg.downloadjson_files[site.installer.vars.jsonNum];loggr.log(" > currentjob: "+currentjob.query);var path=currentjob.dest_path;var filename=currentjob.dest_name;var data=JSON.stringify(site.datatemp["data"]);loggr.log(" > Path: "+path);loggr.log(" > Filename: "+filename);loggr.log(" > Data: "+data);site.storage.writefile(path,filename,data,site.installer.downloadjson_write_cb,site.installer.downloadjson_write_errcb);}
site.installer.downloadjson_write_cb=function(evt){loggr.debug("site.installer.downloadjson_write_cb()");site.installer.downloadjson_next();}
site.installer.downloadjson_write_errcb=function(error){loggr.debug("site.installer.downloadjson_write_errcb()");site.installer.logger(" ERR",{use_br:false,is_e:true});site.installer.logger("&nbsp;&gt; "+site.storage.getErrorType(error)+"",{is_e:true});}
site.installer.clearcache_init=function(){loggr.debug("site.installer.clearcache_init()");site.installer.logger(" ERR",{use_br:false,is_e:true});}
site.installer.finishup=function(){loggr.debug("site.installer.finishup()");if(site.installer.cfg.overwrite_version>=site.cfg.app_version&&site.cookies.get("app_version")!=site.cfg.app_version){site.installer.logger("&nbsp;&gt; Clear localstorage...");site.cookies.clear();}
var now=new Date().getTime();var then=now+(1000*60*60*24*14);site.cookies.put("app_updated_at_time",now);site.cookies.put("app_update_time",then);if(site.cookies.get("app_is_installed")!=1||site.cookies.get("app_version")<0.081){loggr.log(" > Create unique device ID");site.cookies.put("device_id",CryptoJS.MD5(device.uuid));}
setTimeout(function(){site.installer.logger("Done!");setTimeout(function(){site.cookies.put("app_version",site.cfg.app_version);site.cookies.put("app_is_installed",1);site.cookies.put("app_has_updated",(site.installer.isUpdate)?1:0);window.location.reload();},1000);},1000);}
site.installer.removefolder_cb=function(res){}
site.installer.removefolder_cberr=function(error){loggr.warn(" > removefolder.Error: "+site.storage.getErrorType(error));loggr.warn(" > "+error.message);}
site.installer.logger=function(msg,opts){if(!opts){opts={};}
if(opts.use_br!==false){opts.use_br=true;}
if(opts.is_e!==true){opts.is_e=false;}
loggr.log(" (i) "+msg);if(opts.is_e){msg="<span class='e'>"+msg+"</span>";}
if(!opts.nobullet){msg="<li>"+msg+"</li>";}
else if(!opts.nobr){msg="<br>"+msg;}
$("#install .log").append(msg);$("#install .main").scrollTop($("#install .main").height());if(opts.is_e){site.lifecycle.add_section_history("#exit");}}