
// ---------------------------------------------
// BZZ

// ---> Compat

if (!console) { var console = {}; }
if (!console.log) { console.log = function(str) { }; }

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// COOKIES

site.cookweb = {};

site.cookweb.get = function(Name) {
	var search = Name + "="
	var returnvalue = false;
	if (document.cookie.length > 0) {
		offset = document.cookie.indexOf(search)
		// if cookie exists
		if (offset != -1) { 
			offset += search.length
			// set index of beginning of value
			end = document.cookie.indexOf(";", offset);
			// set index of end of cookie value
			if (end == -1) end = document.cookie.length;
			returnvalue=unescape(document.cookie.substring(offset, end))
			}
		}
	return returnvalue;
}

// Write cookie
site.cookweb.put = function(key, value) {
	document.cookie = ""+key+"="+value+"";
}