<?

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

function sortByFilemtime($array) {
	
	
	
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

function fg($f) {
	/*
	$fo = @fopen($f, "r");
	if (!$fo) { @fclose($fo); return false; }
	while($fg = @fgets($fo)) { $buffer .= $fg; }
	if ($buffer) { @fclose($fo); return $buffer; }
	@fclose($fo);
	return false;
	/**/
	return @file_get_contents($f);
}

?>