if(!site){var site={};}
site.gcis={};site.gcis.IMAGESIZE_LARGE={min:1280,max:2048*2,imgSize:"xxlarge"};site.gcis.IMAGESIZE_MEDIUM={min:640,max:1280,imgSize:"large"};site.gcis.IMAGESIZE_SMALL={min:320,max:640,imgSize:"medium"};site.gcis.abort=function(){if(site.gcis.ajaxReqIdentifier){loggr.debug("site.gcis.abort()");site.webapi.abort(site.gcis.ajaxReqIdentifier);site.gcis.ajaxReqIdentifier=null}}
site.gcis.googleImageSearch=function(search,cb,cberr,opts){loggr.debug("site.gcis.googleImageSearch(): "+search);site.gcis.abort();if(!opts){opts={};}
var queryobj={"get":"gcisearch","search":search,}
if(opts.imagesize){queryobj.imgSize=opts.imagesize.imgSize;}
var action="get";var querystr=JSON.stringify(queryobj);site.gcis.ajaxReqIdentifier=site.webapi.exec(action,querystr,function(data){if(!data.data||!data.data.items||data.data.items.length==0){loggr.log(site.helpers.arrToString(data,0,"\n"));if(cberr){cberr([]);}
return;}
filteredresults=[];var ritems=data.data.items;loggr.log(" > GCISearch total results: "+ritems.length);if(opts.imagesize){loggr.log(" > GCISearch opts.imagesize: "+JSON.stringify(opts.imagesize));}
for(var i=0;i<ritems.length;i++){ritem=ritems[i];if(!ritem.image){continue;}
if(opts.imagesize&&!opts.imagesize.imgSize){var iw=ritem.image.width;var ih=ritem.image.height;var largestImageDim=(iw>ih)?iw:ih
if(opts.imagesize.min>largestImageDim&&opts.imagesize.max<largestImageDim){continue;}}
if(opts.maxresults&&filteredresults.length>opts.maxresults){break;}
loggr.log(" > GCISearch imagesize: "+ritem.image.width+" x "+ritem.image.height);filteredresults.push(ritem.link);}
loggr.log(" > GCISearch filtered results: "+filteredresults.length);site.gcis.ajaxReqIdentifier=null
cb(filteredresults);},function(errobj){site.gcis.ajaxReqIdentifier=null
if(errobj&&errobj.textStatus&&errobj.textStatus!="abort"){loggr.error("site.gcis.googleImageSearch.Error: "+e);console.error(e);if(cberr){cberr([]);}}});}