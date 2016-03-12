<?

function fr($f) {
	$fo = @fopen($f, "r");
	$fr = @fread($fo, @filesize($f));
	if ($fo && $fr) { return $fr; }
	else { return false; }
	}

function fg($f) {
	$fo = @fopen($f, "r");
	while($fg = @fgets($fo)) { $buffer .= $fg; }
	if ($buffer) { return $buffer; }
	return false;
	}

function fw($f,$c) {
	$fo = @fopen($f, "w");
	$fw = @fwrite($fo, $c);
	if ($fo && $fw) { return true; }
	else { return false; }
	}

function calculateBytes($val) {
	$val = trim($val);
	$last = strtolower($val[strlen($val)-1]);
	switch($last) {
		case 'g': $val *= 1024;
		case 'm': $val *= 1024;
		case 'k': $val *= 1024;
	}
	return $val;
	}

// ==============================================================

function isImage($filepath) {

	// Test 1: File exists ?
	if (!file_exists($filepath)) { return false; }

	// Test two: GD2 compatible ?
	list($imgoWidth, $imgoHeight) = @getimagesize("{$filepath}");
	if (!$imgoWidth || !$imgoHeight) { return false; }

	return true;

	}

function imageText($im, $txt) {

	$black = imagecolorallocate($im, 0x00, 0x00, 0x00);
	$white = imagecolorallocate($im, 0xFF, 0xFF, 0xFF);

	$font_file = './verdana.ttf';

	imagefttext($im, 12, 0, 10, 20, $white, $font_file, "{$txt}");

	}

// ==============================================================

function setBusy() {
	//fw("bin/busy",time());
	}
function setIdle() {
	//@unlink("bin/busy");
	}

function chkBusy() {
	if (file_exists("bin/busy")) {
		if ( filemtime("bin/busy") > time()-(30*1000) ) { error("Please refresh..."); }
		else { @unlink("bin/busy"); }
		}
	}

// ==============================================================

function error($msg) {

	// TMP: return HTTP 500
	http_response_code(404);
	die();

	global $imgSrc, $imgThumb, $imgFile, $thWidth, $thHeight;

	if (!$thWidth || !$thHeight) { $thWidth = 640; $thHeight = 200; }

	if ($imgSrc) { imagedestroy($imgSrc); }
	if ($ImgThumb) { imagedestroy($ImgThumb); }

	// Create a 300x100 image
	$im = imagecreatetruecolor($thWidth, $thHeight);
	$black = imagecolorallocate($im, 0x00, 0x00, 0x00);
	$white = imagecolorallocate($im, 0xFF, 0xFF, 0xFF);

	// Make the background red
	imagefilledrectangle($im, 0, 0, 500, 100, $black);

	// Path to our ttf font file
	$font_file = './arial.ttf';

	// Draw the text
	imagefttext($im, 7, 0, 2, 10, $white, $font_file, "rgThumb.Err:\n{$msg}\n".$imgFile."\n".date("Ymd"));

	// Output image to the browser
	header('Content-Type: image/png');

	imagepng($im);
	imagedestroy($im);

	setIdle();

	die();

	}

function error_exception($exception) {
	if (!$cfg["errorEnabled"]) { error("Error accured\nError hidden (cfg[errorEnabled]=false)"); return; }
	$e = $exception->getMessage();
	error($e);
	}

function error_err($errn, $errs, $errf, $errl) {
	$ignoreErrn = array(8,2048);
	if (in_array($errn,$ignoreErrn)) { return; }
	// if (!$cfg["errorEnabled"]) { error("Error accured\nError hidden (cfg[errorEnabled]=false)"); return; }
	error("[{$errn}] {$errs}\nAt line {$errl}");
	}

// ==============================================================

function formatInt($int, $len=4) {
	while (strlen($int)<$len) { $int = "0{$int}"; }
	return $int;
	}






?>
