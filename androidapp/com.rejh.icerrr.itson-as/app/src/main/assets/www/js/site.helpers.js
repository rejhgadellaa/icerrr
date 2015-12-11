if(!site){var site={};}
site.helpers={};site.helpers.addCachebust=function(src){if(src.toLowerCase().indexOf("http")>=0){if(src.indexOf("?")>=0){src+="&cache="+new Date().getTime();}
else{src+="?cache="+new Date().getTime();}}
return src;}
site.helpers.shouldDownloadImage=function(localVal,iconVal){if(!iconVal){iconVal="";}
if(!localVal){localVal="";}
if(iconVal.indexOf("file://")>=0){return false;}
if(!localVal){return true;}
if(localVal.indexOf("file://")<0){return true;}
if(localVal.indexOf(".base64")>0){return true;}
return false;}
site.helpers.mergeStations=function(stations1,stations2,forceOverwrite){loggr.debug("site.helpers.mergeStations()");var skipkeys=["station_icon_local","station_image_local"]
if(!stations1&&!stations2){return[];}
else if(!stations1){return stations2;}
else if(!stations2){return stations1;}
for(var i=0;i<stations2.length;i++){var station1=null;var station2=stations2[i];var station1index=site.helpers.session.getStationIndexById(station2.station_id,stations1);if(station1index<0||!station1index){loggr.log(" > New: "+station2.station_id);station2.station_icon_local=null;station2.station_image_local=null;stations1.push(station2);continue;}
station1=stations1[station1index];loggr.debug(" > Upd: "+station2.station_id);for(var key in station2){if(!station1.station_edited){station1.station_edited={};}
if(!station2.station_edited){station2.station_edited={};}
var edit1=station1.station_edited[key]
var edit2=station2.station_edited[key]
if(!edit1){edit1=0;}
if(!edit2){edit2=1;}
if(forceOverwrite){edit1=0;edit2=1;}
if(skipkeys.indexOf(key)>=0){loggr.warn(" >> Skipkey: "+key+", "+station1[key]+" != "+station2[key],{dontsave:true});if(!station1[key]||!station2[key]){station1[key]=null;}else{station1[key]==station2[key];}}
else if(!station1[key]||!edit1){loggr.log(" >> New key: "+station2.station_id+": "+key+", "+station1[key]+", "+edit1,{toconsole:site.cfg.debugging});loggr.log(" >>> Value: "+station2[key],{toconsole:site.cfg.debugging});if(key=="station_icon"&&station1[key]!=station2[key]){loggr.warn(" >>> Set null: station_icon_local, "+station1.station_icon_local,{dontsave:true});station1["station_icon_local"]=null;}
if(key=="station_image"&&station1[key]!=station2[key]){loggr.warn(" >>> Set null: station_image_local, "+station1.station_image_local,{dontsave:true});station1["station_image_local"]=null;}
station1[key]=station2[key];}
else if(station1[key]!=station2[key]&&edit1>edit2){loggr.log(" >> Conflict: "+station2.station_id+": "+key+", keep value1");loggr.log(" >>> Value1: "+station1[key]);loggr.log(" >>> Value2: "+station2[key]);continue;}
else if(station1[key]!=station2[key]&&edit1<edit2||station1[key]!=station2[key]&&!edit1){loggr.log(" >> Conflict: "+station2.station_id+": "+key+", overwrite value1");loggr.log(" >>> Value1: "+station1[key]);loggr.log(" >>> Value2: "+station2[key]);if(key=="station_icon"&&station1[key]!=station2[key]){loggr.warn(" ---> station_icon: "+station1[key]+" != "+station2[key],{dontsave:true});station1["station_icon_local"]=null;}
if(key=="station_image"&&station1[key]!=station2[key]){loggr.warn(" ---> station_image: "+station1[key]+" != "+station2[key],{dontsave:true});station1["station_image_local"]=null;}
station1[key]=station2[key];continue;}
else{}}
stations1[station1index]=station1;}
return stations1;}
site.helpers.getImgAvgColor=function(image,x1,y1,x2,y2){var canvas=document.createElement("canvas");canvas.width=x2-x1;canvas.height=y2-y1;var ctx=canvas.getContext("2d");ctx.drawImage(image,0,0);var pixelDataUpper=ctx.getImageData(x1,y1,x2,y2).data;var pixelDataUpperAveraged=site.helpers.calcAverageColor(pixelDataUpper);return pixelDataUpperAveraged;}
site.helpers.calcAverageColor=function(pixelArray){var r,g,b,a;var rt=gt=bt=0;at=0;for(var i=0;i<pixelArray.length;i+=4){rt+=pixelArray[i];gt+=pixelArray[i+1];bt+=pixelArray[i+2];at+=pixelArray[i+3];}
var len=pixelArray.length/4;r=parseInt(rt/len)
b=parseInt(bt/len);g=parseInt(gt/len);a=at/len;var ret=new Array(r,g,b,a);return ret;}
site.helpers.imageUrlToFilename=function(url,prefix,isBase64,dontUseTimestamp,onlyExtension){loggr.debug("site.helpers.imageUrlToFilename()");var filename="__noname__"+new Date().getTime();if(!url){url="__noname__"+new Date().getTime();}
if(!prefix){prefix="";}
if(url.indexOf("/")>=0){filename=url.substr(url.lastIndexOf("/")+1);}else{filename=url;}
if(filename.indexOf("?")>=0){filename=filename.substr(0,filename.lastIndexOf("?"));}
if(isBase64){filename+=".base64";}
filename=site.helpers.stripIllChars(filename);prefix=site.helpers.stripIllChars(prefix);if(onlyExtension){var ext=filename.substr(filename.lastIndexOf("."));filename=ext;}
if(!dontUseTimestamp&&prefix){filename=prefix+"_"+new Date().getTime()+"_"+filename;}else if(prefix){filename=prefix+"_"+filename;}
return filename;}
site.helpers.downloadImage=function(imgobj,filename,url,cb,cberr,cbprogress){loggr.log("site.helpers.downloadImage(): "+filename);site.webapi.download(url,site.cfg.paths.images,filename,function(fileEntry){if(imgobj){imgobj.src=fileEntry.fullPath+"?c="+new Date().getTime();}
cb(fileEntry,imgobj);},function(error){loggr.warn("site.webapi.download().Error: "+error);cberr(error,imgobj);},function(pEvent){if(cbprogress){cbprogress(pEvent);}});}
site.helpers.checkImageCache=function(){loggr.log("site.helpers.checkImageCache()");var imagelist=[];for(var i=0;i<site.data.stations.length;i++){var station=site.data.stations[i];if(station.station_image_local){imagelist.push(station.station_image_local);}
if(station.station_icon_local){imagelist.push(station.station_icon_local);}}
var nrOfFilesThatMayBeRemoved=0;site.storage.listfiles(site.cfg.paths.images,function(fileEntries){for(var i=0;i<fileEntries.length;i++){if(imagelist.indexOf(fileEntries[i].fullPath)<0){nrOfFilesThatMayBeRemoved++;}}
loggr.log(" > "+nrOfFilesThatMayBeRemoved+" of "+fileEntries.length+" file(s) may be removed..");if(nrOfFilesThatMayBeRemoved>site.cfg.files.maxImagesCached){loggr.log(" > NrOfFiles >= "+site.cfg.files.maxImagesCached+", start removing files");site.vars.fileNamesByDate={};for(var i=0;i<fileEntries.length;i++){var fileEntry=fileEntries[i];if(imagelist.indexOf(fileEntry.fullPath)>=0){continue;}
fileEntry.getMetadata(function(metadata){var date=metadata.modificationTime;site.vars.fileNamesByDate[date.format("YmdHis")]=fileEntry.name;},null);}
setTimeout(function(){site.helpers.trimImageCache();},1000);}else{loggr.log(" > NrOfFiles < "+site.cfg.files.maxImagesCached+", nothing to do");}},function(error){loggr.error(" > Could not get directory list",{dontupload:true});loggr.error(" > "+site.storage.getErrorType(error));});}
site.helpers.trimImageCache=function(){loggr.log("site.helpers.trimImageCache()");var fileNamesByDate=site.vars.fileNamesByDate;var keys=Object.keys(fileNamesByDate);keys.sort();keys.reverse();var fileNamesSorted=[];for(var i=0;i<keys.length;i++){fileNamesSorted.push(fileNamesByDate[keys[i]]);}
loggr.log(" > Nr of files: "+fileNamesSorted.length+", max: "+site.cfg.files.maxImagesCached);var removed=0;for(var i=site.cfg.files.maxImagesCached;i<fileNamesSorted.length;i++){var name=fileNamesSorted[i];var path=site.cfg.paths.images;if(site.cfg.files.ignoreFilenames.indexOf(name)>=0){loggr.log(" > Skip: "+name);continue;}
loggr.log(" > Remove: "+name);site.storage.deletefile(path,name,function(){},function(error){loggr.error(" > Could not delete '"+name+"'",{dontupload:true});loggr.error(" > "+site.storage.getErrorType(error));});removed++;}
loggr.log(" > Removed "+removed+" file(s)");}
site.helpers.calcImageAspect=function(imageObjOrWidth,height){var width;if(imageObjOrWidth instanceof Object){width=imageObjOrWidth.width;height=imageObjOrWidth.height;}else{width=imageObjOrWidth;}
if(width==height){return 1.0;} 
else if(width>height){return width/height;}
else{return height/width;}}
site.helpers.calcAutoByteStr=function(nrOfBytes){if(nrOfBytes<1024){return nrOfBytes+" bytes";}
nrOfBytes=Math.round(nrOfBytes/1024);if(nrOfBytes<1024){return nrOfBytes+" kb";}
nrOfBytes=Math.round(nrOfBytes/1024);if(nrOfBytes<1024){return nrOfBytes+" mb";}
return"alot";}
site.helpers.calcStringToKbytes=function(str){return Math.ceil(site.helpers.calcStringToBytes(str)/1024);}
site.helpers.calcStringToBytes=function(str){if(!str){str="";}
var m=encodeURIComponent(str).match(/%[89ABab]/g);return str.length+(m?m.length:0);}
site.helpers.stripIllChars=function(str){for(var i=0;i<site.cfg.illegalchars.length;i++){var illchar=site.cfg.illegalchars[i];if(str.indexOf(illchar)>=0){str=str.split(illchar).join("");}}
return str;}
site.sorts={};site.sorts.station_by_none=function(stations){return stations;}
site.sorts.station_by_id=function(stations){var newlist=[];var station_ids=[];var station_sort_indexes={};for(var i=0;i<stations.length;i++){if(!stations[i]){continue;}
station_ids.push(stations[i].station_id);station_sort_indexes[stations[i].station_id]=i;}
station_ids.sort();for(var i=0;i<station_ids.length;i++){newlist.push(stations[station_sort_indexes[station_ids[i]]]);}
return newlist;}
site.sorts.station_by_name=function(stations){if(!stations){loggr.error("site.sorts.station_by_name().Error: stations='"+station+"'");}
var newlist=[];var station_ids=[];var station_sort_indexes={};for(var i=0;i<stations.length;i++){if(!stations[i]){continue;}
station_ids.push(stations[i].station_name);station_sort_indexes[stations[i].station_name]=i;}
station_ids.sort();for(var i=0;i<station_ids.length;i++){newlist.push(stations[station_sort_indexes[station_ids[i]]]);}
return newlist;}
site.helpers.session={};site.helpers.storeSession=function(cb){loggr.debug("site.helpers.storeSession()");if(!site.session_ready){site.helpers.readSession();}
if(site.session_ready){site.cookies.put("site.session",JSON.stringify(site.session));site.storage.writefile(site.cfg.paths.json,"local.site_session.json",site.cookies.get("site.session"),function(){loggr.log("site.helpers.storeSession > write local site.session OK");if(cb){cb();}},function(err){loggr.error("site.helpers.storeSession > write local site.session Error");});}else{loggr.error(" > !site.session_ready ?!?!?!");}}
site.helpers.readSession=function(){loggr.debug("site.helpers.readSession()");loggr.log(" > Restore site.session via cookie..");var cookiedata=site.cookies.get("site.session")
if(!cookiedata){loggr.warn(" > Error getting session from cookie, trying storage...");site.session={};site.storage.readfile(site.cfg.paths.json,"local.site_session.json",function(data){loggr.log(" > Session read from storage, also writing now");site.session=JSON.parse(data);if(!site.session){site.session={};}
site.session_ready=true;site.helpers.storeSession();site.alarms.setAlarms();},function(err){loggr.warn(" > Could not read session from storage");site.session={};site.session_ready=true;});return false;}else{loggr.log(" -> OK: "+site.helpers.calcAutoByteStr(site.helpers.calcStringToBytes(cookiedata)));site.session=JSON.parse(cookiedata);site.session_ready=true;return true;}}
site.helpers.session.put=function(key,data,isarray){sessionelem=site.session[key];var newsessionelem=site.helpers.session.putRecursive(sessionelem,data,isarray);site.session[key]=newsessionelem;site.cookies.put("site.session",JSON.stringify(site.session));}
site.helpers.session.putRecursive=function(sessionelem,data,isarray){var newsessionelem=jQuery.extend(true,{},sessionelem);if(!newsessionelem&&!isarray){newsessionelem={};}
else if(!newsessionelem){newsessionelem=[];}
for(var elemkey in data){if(typeof data[elemkey]=="array"){newsessionelem[elemkey]=site.helpers.session.putRecursive(sessionelem[elemkey],data[elemkey],true);}else if(typeof data[elemkey]=="object"){newsessionelem[elemkey]=site.helpers.session.putRecursive(sessionelem[elemkey],data[elemkey]);}else{if(typeof newsessionelem=="array"){newsessionelem.push(data[elemkey]);}
else{newsessionelem[elemkey]=data[elemkey];}}}
return newsessionelem;}
site.helpers.session.getStationById=function(station_id,stations){if(!site.data.stations&&!stations){loggr.log("site.helpers.getStationById().Error: !site.data.stations");return-1;}
if(!stations){stations=site.data.stations;}
for(var index in stations){if(!stations[index]){continue;}
if(stations[index].station_id==station_id){return stations[index];}}
return null;}
site.helpers.session.getStationIndexById=function(station_id,stations){if(!site.data.stations&&!stations){loggr.log("site.helpers.getStationIndexById().Error: !site.data.stations");return-1;}
if(!stations){stations=site.data.stations;}
for(var index in stations){if(!stations[index]){continue;}
if(stations[index].station_id==station_id){return index;}}
return-1;}
site.helpers.flagdirtyfile=function(filepathandname){filepathandname=filepathandname.replace("//","/");var dirtyfiles=site.session.dirtyfiles;if(typeof dirtyfiles=="object"&&site.helpers.countObj(dirtyfiles)>0){loggr.log(" > site.helpers.flagdirtyfile.Huh? 'dirtyfiles'==object?");if(site.helpers.countObj(dirtyfiles)>0){var newdirtyfiles=[];for(var intstr in dirtyfiles){if(newdirtyfiles.indexOf(dirtyfiles[intstr])<0){newdirtyfiles.push(dirtyfiles[intstr]);}}
dirtyfiles=newdirtyfiles;loggr.log(" >> Solved it: "+dirtyfiles.length+" result(s) in 'dirtyfiles'");}else{loggr.log(" >> Just create a new list");dirtyfiles=false;}}
if(!dirtyfiles){dirtyfiles=[];}
if(dirtyfiles.indexOf(filepathandname)<0){dirtyfiles.push(filepathandname);}
site.helpers.session.put("dirtyfiles",dirtyfiles,true);}
site.helpers.countObj=function(obj){if(obj instanceof Array){return obj.length;}
if(typeof(obj)!="object"){return-1;}
var n=0;for(var key in obj){n++;}
return n;}
site.helpers.getRandomListEntry=function(list){var randomIndex=Math.ceil(Math.random()*list.length)-1;return list[randomIndex];}
site.helpers.capitalize=function(str,everyword){if(!str){loggr.warn("site.helpers.capitalize().err: !str");return"<span style='color:#f00;'>Null</span>";}
if(everyword){return site.helpers.capAll(str);}
str=str.substr(0,1).toUpperCase()+str.substr(1).toLowerCase();return str;}
site.helpers.capAll=function(str){if(!str){str="";}
var strs=str.split(" ");for(var i in strs){if(strs[i].length<2&&strs[i].toLowerCase()!="i"){continue;}
if(typeof strs[i]!="string"){continue;}
strs[i]=site.helpers.capitalize(strs[i]);}
return strs.join(" ");}
site.helpers.short=function(str,len){if(!len){len=64;}
if(!str){str="";}
if(str.length>len){str=str.substr(0,len)+"...";}
return str;}
site.helpers.getUniqueID=function(prefix,suffix){var res=CryptoJS.MD5(device.uuid);res+="_"+(new Date().getTime()).toString(16);res+="_"+Math.round((Math.random()*1024*1024)).toString(16);loggr.log("site.helpers.getUniqueID(): "+res);return res;}
site.helpers.genUniqueStationId=function(station_name){for(var i in site.cfg.illegalchars){var illchar=site.cfg.illegalchars[i];station_name=station_name.replace(illchar,"");}
station_name+="_"+site.helpers.getUniqueID();return station_name;}
site.helpers.getGoogleImageSearchBranding=function(){loggr.debug("site.helpers.getGoogleImageSearchBranding()");return google.search.Search.getBranding();}
site.helpers.googleImageSearch=function(searchstring,cb,cberr,opts,googleWasNull){loggr.debug("site.helpers.googleImageSearch()");site.gcis.googleImageSearch(searchstring,cb,cberr,opts)}
site.helpers.uploadStations=function(){loggr.log("site.helpers.uploadStations()");if(!site.data.stations){loggr.warn(" > !site.data.stations, return");return;}
var apiqueryobj={"post":"stations"}
var data={"id":site.cookies.get("device_id")+"_"+new Date().format("Y-m-d"),"stations":JSON.stringify(site.data.stations)}
var apiaction="post";var apiquerystr=JSON.stringify(apiqueryobj);site.webapi.post(apiaction,apiquerystr,data,function(data){if(data["error"]){loggr.log("loggr.upload().OK");loggr.log(data["error"]);}else{loggr.log("loggr.upload().OK");}},function(error){if(error.message){loggr.log(error.message);}
else{loggr.log(error);}});}
site.helpers.uploadStation=function(station){loggr.log("site.helpers.uploadStation()");var apiqueryobj={"post":"station"}
var data={"id":site.cookies.get("device_id")+"_"+station.station_id,"station":JSON.stringify(station)}
var apiaction="post";var apiquerystr=JSON.stringify(apiqueryobj);site.webapi.post(apiaction,apiquerystr,data,function(data){if(data["error"]){loggr.log("loggr.upload().OK");loggr.log(data["error"]);}else{loggr.log("loggr.upload().OK");}},function(error){if(error.message){loggr.log(error.message);}
else{loggr.log(error);}});}
site.helpers.getConnType=function(){var type=navigator.connection.type;switch(type){case Connection.UNKNOWN:return"UNKNOWN";case Connection.ETHERNET:return"ETHERNET";case Connection.WIFI:return"WIFI";case Connection.CELL_2G:return"CELL_2G";case Connection.CELL_3G:return"CELL_3G";case Connection.CELL_4G:return"CELL_4G";case Connection.CELL:return"CELL";case Connection.NONE:return"NONE";default:return"UNKNOWN";}}
site.helpers.isConnected=function(){var type=site.helpers.getConnType();switch(type){case"NONE":return false;default:return true;}}
site.helpers.isConnectedWifi=function(allowEthernet){if(allowEthernet!==false){allowEthernet=true;}
var type=site.helpers.getConnType();switch(type){case"ETHERNET":if(!allowEthernet){return false;}
case"WIFI":return true;default:return false;}}
site.helpers.masonryinit=function(selector,opts){}
site.helpers.masonryupdate=function(selector){loggr.debug("site.helpers.masonryupdate(): "+selector);}
site.helpers.masonryOnResize=function(){loggr.debug("site.vars.masonryOnResize()");if(!site.vars.masonries){return;}
for(var i=0;i<site.vars.masonries.length;i++){var selector=site.vars.masonries[i];if(!$(selector).is(":visible")||$(selector).length<1){continue;}
try{site.helpers.masonryupdate(selector);}
catch(e){loggr.warn(" > Error: "+e);}}}
site.helpers.formatNum=function(num,len){if(!len){len=2;}
num=""+num;while(num.length<len){num="0"+num;}
return num;}
site.helpers.formatFloat=function(num,len){if(!len){len=2;}
num=""+num;while(num.length<(len+2)){num=num+"0";}
return num;}
site.helpers.urlAddCachebust=function(url){if(url.indexOf("?")>=0){url+="&c=";}
else{url+="?c=";}
url+=(new Date().getTime());return url;}
site.helpers.replaceAll=function(look,repl,str){return str.replace(new RegExp(site.helpers.escapeRegExp(look),'g'),repl);}
site.helpers.escapeRegExp=function(string){return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g,"\\$1");}
site.helpers.arrToString=function(arr,depth,newline){var char="&nbsp;";if(!depth){depth=0;}
if(!newline){newline="<br>";}
if(newline=="\n"){char=" ";}
var res="";depth++;if(typeof(arr)=="string"){return arr;}else{for(var i in arr){if(typeof(arr[i])=="object"||typeof(arr[i])=="array"){res+=site.helpers.getIndents(depth,char)+i+newline;res+=site.helpers.arrToString(arr[i],depth,newline)+newline;}else{res+=site.helpers.getIndents(depth,char)+i+" = "+arr[i]+newline;}}}
return res;}
site.helpers.getIndents=function(depth,char){var res="";if(!char){char="&nbsp;";}
for(var i=0;i<depth;i++){res+=char+char+char+char;}
return res;}