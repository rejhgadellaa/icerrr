<?

// ---> Logs and errors

function logg($line) {
	$logfile = "data/log.txt";
	$fr = fr($logfile);
	$lines = explode("\n",$fr);
	//array_pop($lines);
	//while (count($lines)>2048) { array_pop($lines); }
	array_unshift($lines,date("Y-m-d H:i:s")."    ".$line);
	fw($logfile, implode("\n",$lines));
}

function error($message) {
	$json = array(
		"error" => 1,
		"errormsg" => $message
	);
	header("Content-Type: application/json");
	header("Access-Control-Allow-Origin: *");
	echo json_encode($json);
	logg("Error: ".$message);
	die();
}

// ---> Json

function getJsonError($code) {
	
	switch($code) {
		
		case JSON_ERROR_NONE: return "JSON_ERROR_NONE";
		case JSON_ERROR_DEPTH: return "JSON_ERROR_DEPTH";
		case JSON_ERROR_STATE_MISMATCH: return "JSON_ERROR_STATE_MISMATCH";
		case JSON_ERROR_CTRL_CHAR: return "JSON_ERROR_CTRL_CHAR";
		case JSON_ERROR_SYNTAX: return "JSON_ERROR_SYNTAX";
		case JSON_ERROR_UTF8: return "JSON_ERROR_UTF8";
		case JSON_ERROR_RECURSION: return "JSON_ERROR_RECURSION";
		case JSON_ERROR_INF_OR_NAN: return "JSON_ERROR_INF_OR_NAN";
		case JSON_ERROR_UNSUPPORTED_TYPE: return "JSON_ERROR_UNSUPPORTED_TYPE";
		default: return "UNKNOWN";
		
	}
	
}

// ---> File i/o

function readJsonsFile($file) {
	// It's dead, jim? TODO: FIXME: IMPORTANT?
	// Reads file, strips comments and other non-json stuff, json_decodes it -> Returns a json STRING not an object
	$jsons = fr($file);
	if (!$jsons) { return false; }
	$linebreaks = goFigureLinebreaks($jsons);
	$jsonslines = explode($linebreaks,$jsons);
	$newjsonslines = array();
	foreach($jsonslines as $linenum => $line) {
		// remove comments > everything after // is removed
		$comment_pos = strpos($line,"//");
		if ($comment_pos!==FALSE) { 
			$line = substr($line,0,$comment_pos);
			$line = str_replace("  "," ",$line);
			if ($line=="" || $line==" ") { continue; }
		}
		// remove/skip tabs
		$line = str_replace("\t","",$line);
		// remove/skip empty lines
		$line = str_replace("  "," ",$line);
		if (!$line) { continue; }
		// store line
		$newjsonslines[] = $line;
	}
	$newjsons = implode($linebreaks,$newjsonslines);
	return $newjsons;
}

function getLastModifiedFileFromPath($path) {
	
	$rd = rd($path);
	$tmparr = array();

	foreach($rd as $fnum => $filename) {
		$filepath = "{$path}/{$filename}";
		if (is_array($filepath)) { continue; } // skip folders
		$tmparr[filemtime($filepath)] = $filepath;
	}
	
	ksort($tmparr);
	
	foreach($rd as $fnum => $filename) {
		$filepath = "{$path}/{$filename}";
	}
	
	return $filepath;
	
}

function rd($dir) {
	$filter = array(".","..","Thumbs.db");
	$od = @opendir($dir);
	while ($rd = @readdir($od)) {
		if (in_array($rd,$filter)) { continue; }
		// if (is_dir("$dir/$rd")) { continue; }
		if (is_dir("$dir/$rd")) {
			$res[$rd] = rd("$dir/$rd");
		} else {
			$res[] = $rd;
		}
	}
	return $res;
}

function fw($file,$data) {
	$fo = @fopen($file,"w");
	$fw = @fwrite($fo,$data);
	@fclose($fo);
	return $fw;
}

function fr($file) {
	$fo = @fopen($file,"r");
	$fr = @fread($fo,filesize($file));
	@fclose($fo);
	return $fr;
}

// ---> Other helpers

function goFigureLinebreaks($str) {
	$linebreaks = "\r\n";
	if (strpos($str,$linebreaks)===FALSE && strpos($str,"\n")!==FALSE) {
		$linebreaks = "\n";
	}
	return $linebreaks;
}





























?>