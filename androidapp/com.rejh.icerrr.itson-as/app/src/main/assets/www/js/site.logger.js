loggr={};loggr.cfg={};loggr.cfg.maxlines=512;loggr.cfg.newline="\n";loggr.loglines=["-- BEGIN OF LOGGR --"];loggr.logtypes=[null];loggr.error=function(str,opts){if(!opts){opts={};}
opts.type="error";if(str!=null){str+="\nSTACKTRACE:\n"+loggr.getStackTrace();}
loggr.log(str,opts);if(!opts.dontupload){loggr.upload();}}
loggr.warn=function(str,opts){if(!opts){opts={};}
opts.type="warn";loggr.log(str,opts);if(!opts.dontsave){loggr.save();}}
loggr.debug=function(str,opts){if(!opts){opts={};}
opts.type="debug";loggr.log(str,opts);}
loggr.info=function(str,opts){if(!opts){opts={};}
opts.type="info";loggr.log(str,opts);}
loggr.log=function(str,opts){if(!str){str="";}
if(!opts){opts={};}
if(!opts.type){opts.type="log";}
if(opts.toconsole!==false){opts.toconsole=true;}
str=new Date().format("H:i:s")+"    "+str;if(opts.toconsole&&site.cookies.get("setting_enableLogCatDebugging")==1||opts.type=="error"||opts.type=="warn"){switch(opts.type){case"error":console.error(str);break;case"warn":console.warn(str);break;case"debug":console.debug(str);break;case"info":console.info(str);break;default:console.log(str);break;}}
if(!str){return;}
str=new Date().format("Y-m-d")+" "+str;loggr.loglines.push(str);loggr.logtypes.push(opts.type);while(loggr.loglines.length>loggr.cfg.maxlines){loggr.loglines.shift();loggr.logtypes.shift();}
if(opts.save){loggr.save();}}
loggr.gettext=function(){return loggr.loglines.join(loggr.cfg.newline);}
loggr.gethtml=function(maxlines){if(!maxlines||maxlines>loggr.loglines.length){maxlines=loggr.loglines.length;}
var html="";for(var i in loggr.loglines){if(loggr.loglines.length-i>maxlines){continue;}
var logline=loggr.loglines[i];var logtype=loggr.logtypes[i];if(typeof logline!=="string"){continue;}
try{logline=logline.split(" > ").join("&nbsp;&gt;&nbsp;");logline=logline.split("  ").join("&nbsp;&nbsp;");logline=logline.split(">").join("&gt;");logline=logline.split("<").join("&lt;");logline=logline.split(loggr.cfg.newline).join("<br>");}catch(e){}
switch(logtype){case"error":html+="<span style='color:#c00'>"+logline+"</span><br>\n";break;case"warn":html+="<span style='color:#f90'>"+logline+"</span><br>\n";break;case"info":html+="<span style='color:#00c'>"+logline+"</span><br>\n";break;case"debug":html+="<span style='color:#009'>"+logline+"</span><br>\n";break;default:html+="<span style='color:#333'>"+logline+"</span><br>\n";}}
return html;}
loggr.save=function(){var text=loggr.gettext();site.storage.writefile(site.cfg.paths.logs,"local.site_logger.txt",JSON.stringify(text),function(){loggr.log("loggr.save > OK");},function(err){loggr.log("loggr.save > FAILED");});}
loggr.upload=function(logcat_html,issuedByUser){if(!issuedByUser&&!site.cookies.get("setting_sendLogs")){loggr.error(" > Uploading logs automatically is disabled by user",{dontupload:true});return;}
if(loggr.uploading){console.log("loggr.uploading==true");return;}
loggr.uploading=true;loggr.log(" > Device: "+site.vars.deviceDesc);loggr.log(" > Screen: "+$(window).width()+" x "+$(window).height());loggr.log(" > Device Info: "
+"model: "+device.model
+", platform: "+device.platform
+" "+device.version
+", cordova: "+device.cordova);loggr.log(" > App version: "+site.cfg.app_version);setTimeout(function(){if(window.mediaStreamer&&!logcat_html){loggr.log(" > Get logcat..");window.mediaStreamer.getlog(function(res){var lines=res.split("\n");var outp="";outp="<table class='logcat'>";for(var i=0;i<lines.length;i++){var line=lines[i];var lineparts=line.split("(");if(!lineparts[0]){continue;}
if(!lineparts[0].length){continue;}
var linetd1=lineparts.shift();var linetd1_parts=linetd1.split(" ");var linetd1_date=linetd1_parts[0];var linetd1_time=linetd1_parts[1].substr(0,linetd1_parts[1].indexOf("."));linetd1=linetd1_parts[2];var linetd2=lineparts.join("(");if(!linetd2){continue;}
linetd1=linetd1.trim();linetd2=linetd2.trim();if(linetd1.toLowerCase().indexOf("i/chromium")>=0){continue;}
linetd2=linetd2.substr(linetd2.indexOf("):")+2).trim();var linetd2_orig=linetd2.split('"').join("'");if(linetd1.toLowerCase().indexOf("d/cordovalog")>=0&&linetd2.indexOf("    ")>=0){linetd2=linetd2.substr(11);}
if(linetd2_orig==linetd2.split('"').join("'")){linetd2_orig="-";}
if(linetd1.length>16){linetd1=linetd1.substr(0,14)+"..";}
var linetype=linetd1.substr(0,2);var rowcolor="#000";switch(linetype.toLowerCase()){case"e/":rowcolor="#f00";break;case"w/":rowcolor="#f60";break;case"i/":rowcolor="#00c";break;case"d/":rowcolor="#000";break;case"v/":rowcolor="#999";break;default:rowcolor="#090";break;}
outp+="<tr style='color:"+rowcolor+";'>"
+"<td valign='top'>"+linetd1_time+"&nbsp;&nbsp;</td>"
+"<td valign='top'>"+linetd1+"</td>"
+"<td valign='top' title=\""+linetd2_orig+"\">"+linetd2+"</td>"
+"</tr>";}
outp+="</table>";outp="<p><hr></p>"+outp;loggr.uploading=false;loggr.upload(outp,issuedByUser);},function(err){loggr.uploading=false;loggr.error(" > Could not get logcat: "+err,{dontupload:true});loggr.upload("--LOGCAT FAILED--",issuedByUser);});loggr.uploading=false;return;}
loggr.save();var html=loggr.gethtml(512);var text=loggr.gettext
if(logcat_html){loggr.log(" > Add logcat");html+=logcat_html;}
var html="<html>"
+"<head><style>"
+"html,body,table,td{ font-family:Roboto, sans-serif; font-size:10pt; }"
+"</style></head>"
+"<body>"+html+"</body>"
+"</html>";loggr.log(" >> "+html.length)
var apiqueryobj={"post":"log"}
var data={"log_id":site.helpers.getUniqueID(),"log_html":html,"log_text":text}
var apiaction="post";var apiquerystr=JSON.stringify(apiqueryobj);site.webapi.post(apiaction,apiquerystr,data,function(data){if(data["error"]){loggr.log("loggr.upload().OK");loggr.log(data["error"]);}else{loggr.log("loggr.upload().OK");loggr.uploading=false;}},function(error){if(error.message){loggr.log(error.message);}
else{loggr.log(error);}});},500);}
loggr.getStackTrace=function(){var obj={};Error.captureStackTrace(obj,loggr.getStackTrace);return obj.stack;};if(!console){var console={};}
if(!console.log){console.log=function(str){};}
window.onerror=function(message,file,line,column,errorObj){loggr.error(message+"\n > "+file+" at line "+line);if(errorObj){loggr.error(errorObj.stack);}}