<?

// todo >> unlink before saving (if file is newer then cache)

function cache_save($srcpath, $thumbimg, $thumbw, $thumbh) {

	cache_clear();
	
	global $cfg, $imgName, $imgIsRemote;
	
	// GET data
	foreach($_GET as $k=>$v) { $get[] = "$k=$v"; }
	$get = "?".implode("&",$get);
	
	// Catch
	if ($cfg["cacheMaxImgW"] > 0 && $cfg["cacheMaxImgW"] < $thumbw) { return false; }
	if ($cfg["cacheMaxImgH"] > 0 && $cfg["cacheMaxImgH"] < $thumbh) { return false; }
	
	// Setup
	$time = time();
	$wh = "w".formatInt($thumbw)."h".formatInt($thumbh);
	$rand = rand(100000,999999);
	
		// Handle remote images
		if ($imgIsRemote) { $time = time() + ($cfg["cacheSustainability"]*24*60*60); }
	
	// Generate thumbname/-path
	$thumbpath = "cache/cachedimg.{$time}.{$wh}.{$rand}.{$imgName}";
	
	// Get data
	$data = fr("cache/cacheData.txt"); 
	if ($data) { $data = explode("####\r\n", $data); } else { $data = array(); }
	
	// Add data
	$data[] = "{$srcpath}##{$thumbpath}##{$thumbw}##{$thumbh}##{$time}";
	while (count($data)>$cfg["cacheMaxFiles"]) { 
		cache_log("CACHE_CLEANUP :: " . $srcpath);
		$arr = explode("##",array_shift($data));
		if (!file_exists($arr[1])) { continue; }
		if (!@unlink($arr[1])) { error("Cache failed: unlink({$arr[1]})"); return false; }
		}
	
	// Save data
	$data = implode("####\r\n", $data);
	$fw = fw("cache/cacheData.txt",$data);
	if (!$fw) { return false; }
	
	// Return thumbpath
	cache_log("CACHE_SAVE :: " . $srcpath);
	return $thumbpath;
	
	}

// ---
	
function cache_load($srcpath, $thumbw, $thumbh) {
	
	global $cfg, $imgIsRemote;
	
	cache_clear();
	
	// Setup
	if ($imgIsRemote) { $srctime = time(); }
	else { $srctime = @filemtime($srcpath); }
	if (!$srctime) { 
		return false;
		}
	
	// Get data
	$data = fr("cache/cacheData.txt"); 
	if ($data) { $data = explode("####\r\n", $data); } else { $data = array(); }
	
	// Search data
	for($i=count($data); $i>=0; $i--) {
		
		$values = explode("##",$data[$i]);
		if ($srcpath==$values[0] && $thumbw==$values[2] && $thumbh==$values[3]) {
			if ($srctime>=$values[4]) { cache_log("CACHE_RENEW :: " . $srcpath); cache_remove($srcpath); return false; }
			if (!file_exists($values[1])) { cache_remove($srcpath); return false; }
			cache_log("CACHE_LOAD :: " . $srcpath);
			return $values[1];
			}
		
		}
		
	return false;
	
	}

// ---

function cache_remove($srcpath) {
	
	// Get data
	$data = fr("cache/cacheData.txt"); 
	if ($data) { $data = explode("####\r\n", $data); } else { $data = array(); }
	
	// Walk data
	for($i=0; $i<count($data); $i++) {
		
		$values = explode("##",$data[$i]);
		if ($srcpath==$values[0] && file_exists($values[1])) {
			@unlink($values[1]);
			$removeString = $data[i];
			}
		
		}
		
	// Collapse data
	$data = implode("####\r\n", $data);
	
	// Update data
	if ($removeString) { $data = str_replace($removeString, "", $data); }
	
	// Save data
	$data = str_replace("####\r\n####\r\n", "####\r\n", $data);
	$fw = fw("cache/cacheData.txt",$data);
	if (!$fw) { cache_log("ERROR REMOVE :: !fw :: " . $srcpath); return false; }
	
	cache_log("REMOVE :: " . $srcpath);
	
	}

// ---

function cache_check() {
	
	$cachepath = "cache/";
	
	$outp = array();
		
	// Check Paths
	if (is_dir($cachepath)) { $outp[] = "* Path OK: $cachepath"; }
	if (file_exists($cachepath."cacheData.txt")) { $outp[] = "* Data OK: cacheData.txt"; }
	if (file_exists($cachepath."cacheDbg.txt")) { $outp[] = "* Dbg OK: cacheDbg.txt"; }
	
	// Clear cachefolder
	$od = opendir($cachepath);
	while($rd = readdir($od)) {
		$path = "{$cachepath}{$rd}";
		if (is_dir($path)) { continue; }
		$files[] = $path;
		}
		
	$outp[] = "* Files: ".count($files);
	
	// Complete
	error("CACHE_CHECK [OK]:\n".implode("\n",$outp));
	
	}

function cache_setup() {
	
	$cachepath = "cache/";
	$setupfile = "cacheSetup.txt";
		
	// Check Cachepath
	if (!is_dir($cachepath)) { mkdir($cachepath); }
	
	// Clear cachefolder
	$od = opendir($cachepath);
	while($rd = readdir($od)) {
		$path = "{$cachepath}{$rd}";
		if (is_dir($path)) { continue; }
		if (!@unlink($path)) { error("CACHESETUP()\n!UNLINK(cache/cachefile)"); }
		}
	
	fw($cachepath."cacheData.txt","null\r\n");
	fw($cachepath."cacheDbg.txt","null\r\n");
	
	// Complete
	error("CACHE_SETUP [OK]:\n* Cleared data files\n* Cleared cached images");
	
	}

function cache_clear() {

	/*
	
	// Get data
	$dataStr = fr("cache/cacheData.txt"); 
	
	// Get folder
	$filterOpendir = array(".","..","cacheData.txt","cacheDbg.txt");
	$od = opendir("cache");
	while($rd = readdir($od)) {
		if (in_array($rd,$filterOpendir)) { continue; }
		if (is_dir("cache/$rd")) { continue; }
		//if (strpos($rd,$dataStr)===FALSE) { @unlink("cache/$rd"); cache_log("CLEAR :: " . $rd); }
		}
		
	/**/
	
	}
	
// ---

function cache_log($txt) {
	
	if (file_exists("cache/cacheDbg.txt")) { if (@filesize("cache/cacheDbg.txt")>(2*1024*1024)) { @unlink("cache/cacheDbg.txt"); cache_log("-- CLEAN LOG"); } $log = fr("cache/cacheDbg.txt"); }
	
	$log = date("Y-m-d H:i:s") . " :: $txt\r\n".$log;
	fw("cache/cacheDbg.txt",$log);
	
	}
/**/






























?>