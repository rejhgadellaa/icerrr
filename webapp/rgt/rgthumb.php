<?

session_start();

include("rgt.config.php");
include("rgt.functions.php");
include("rgt.functions.cache.php");

set_exception_handler('error_exception');
set_error_handler('error_err');

setBusy();

switch ($_GET["cmd"]) {
	case "cache_setup": cache_setup(); die();
	case "cache_check": cache_check(); die();
	}

// ----------------------------------------------------------------------------

$imgFile = $_GET["f"];
if ($_GET["src"]) { $imgFile = $_GET["src"]; }

$imgFile = stripslashes($imgFile);

	// Some minor checking & stuff
	$realImgFile = $imgFile; // Save actual imgFile (imgFile itself may be modified later on..)
	if (strpos($imgFile,"ttp://")==1 || strpos($imgFile,"ttps://")==1) { $imgIsRemote=true; }

// ----------------------------------------------------------------------------

$thWidth = $_GET["w"]; $thHeight = $_GET["h"];
if ($_GET["width"]) { $thWidth = $_GET["width"]; }
if ($_GET["height"]) { $thWidth = $_GET["height"]; }
if (!$thWidth || !$thHeight) { error("Missing parameter(s): w={$thWidth} / h={$thHeight} ?"); }

$thZoom = $_GET["zoom"];
if ($_GET["zc"]) { $thZoom = $_GET["zc"]; }

$thTransparent = $_GET["transp"];

$thQuality = $_GET["jpg_quality"];
if (!$thQuality) { $thQuality = 100; }

$thCompress = $_GET["png_compr"];
if (!$thCompress) { $thCompress = 0; }

$thLowquality = $_GET["lq"];

$noCache = $_GET["nocache"];
if ($noCache) { $cfg["cacheEnabled"] = false; }

$force = $_GET["force"]; // ignore errors;

// ----------------------------------------------------------------------------

// File name + extension
$imgName = substr($imgFile, strrpos($imgFile,"/")+1);
$imgSrcExtension = strtolower(substr($imgFile, strrpos($imgFile,".")+1));

// Check Cache
if ($cfg["cacheEnabled"]) {

	// Check if image is available from cache, if so: show it
		$imgCache = cache_load($imgFile, $thWidth, $thHeight);
		if ($imgCache) { //header("location: $imgCache");
			$content = fr($imgCache);
			if (strtolower($imgSrcExtension)=="jpg") { $type = "jpeg"; }
			else { $type = strtolower($imgSrcExtension); }
			header("Content-Disposition: filename=\"{$imgName}\"");
			header("Content-type: image/{$type}");
			echo $content;
			setIdle();
			die();
			}

	}

// Handle if image is located on remote server
if ($imgIsRemote) {

	// It is: attempt to download to local server
	$srcFileExtension = substr($imgFile, strrpos($imgFile,".")+1);
	$tmpfilepath = "rgthumb.cachedimg.{$imgName}";
	$fg = fg(str_replace(" ","%20",$imgFile)); if (!$fg) { error("File could not be loaded.\nCheck if FREAD may access external files."); }
	$fw = fw($tmpfilepath,$fg); if (!$fw) { error("File could not be saved to local server.\nTmpFilePath: {$tmpfilepath}"); }
	$imgFile = $tmpfilepath;

	}

// Catch errors
if (!file_exists($imgFile)) { error("File doesn't exist."); }
if (!isImage($imgFile) && !$force) { error("File is not an image."); }

// Create Image

	// Setup
	$offset_top = 0;
	$offset_left = 0;

	// Dimensions
	list($imgoWidth, $imgoHeight) = @getimagesize("{$imgFile}");

	// Memory
	$memUsageAprox = ($imgoWidth * $imgoHeight) * 4;
	$memUsageAproxKb = round($memUsageAprox / (1024));

	$memLimitBytes = calculateBytes(get_cfg_var("memory_limit"));
	$memLimitKb = round($memLimitBytes/1024);

	/*
	if ($cfg["remotePreResizerEnabled"] && $memUsageAproxKb>$memLimitKb) {
		// Resize image using remote rgthumb (with more memory)
			// Is image on local server?
			if (strpos($imgFile,"http://")===FALSE) {
				// figure local host address
				$myPath = $_SERVER['PHP_SELF'];
				$myPath = substr($myPath,0,strrpos($myPath,"/"));
				$myPath.= "/{$imgFile}";
				}
			else { $myPath = $imgFile; }
			$tmpfilepath = $imgFile;
			$imgFile = $myPath;
			$args = "src={$imgFile}&w={$thWidth}&h={$thHeight}&zoom={$thZoom}&transp={$thTransparent}&jpg_quality={$thQuality}&png_compr={$thCompress}&lq={$thLowQuality}";
		$presized = fg( $cfg["remotePreResizerUrl"] . $args );
		$fw = fw("tmp.image",$presized);
		$deleteTmpImage = true;
		$imgFile = "tmp.image";
		}
	elseif ($memUsageAproxKb>$memLimitKb) { error("Image too large?\n[memUsageAproxKb>memLimitKb]\n .$filepath"); }
	/**/

	if ($memUsageAproxKb>$memLimitKb) { error("Image too large?\n[memUsageAproxKb>memLimitKb]\n .$filepath"); }

	// Load source image
	switch($imgSrcExtension) {

		case "jpg": case "jpeg":
		$imgSrc = @imagecreatefromjpeg($imgFile); break;

		case "png":
		$imgSrc = imagecreatefrompng($imgFile);
		imagealphablending($imgSrc, false); 	// setting alpha blending on
		imagesavealpha($imgSrc, true); 			// save alphablending setting (important)
		break;

		case "gif":
		$imgSrc = @imagecreatefromgif($imgFile); break;

		default:
		$imgSrc = @imagecreatefromjpeg($imgFile);
		if (!$imgSrc) { $imgSrc = @imagecreatefrompng("$imgFile"); }
		if (!$imgSrc) { $imgSrc = @imagecreatefromgif("$imgFile"); }
		break;

		}
	if (!$imgSrc) { error("ImageCreateFrom({$imgSrcExtension}) failed!"); die(); }

	// Calculate new dimensions
	if ($imgoWidth>=$imgoHeight) {

		$factor = $thWidth / $imgoWidth;
		$imgnWidth = $thWidth;
		$imgnHeight = round($imgoHeight * $factor);

		if ($imgnHeight>$thHeight) {
			$factor = $thHeight / $imgoHeight;
			$imgnHeight = $thHeight;
			$imgnWidth = round($imgoWidth*$factor);
			}

		}
	else {

		$factor = $thHeight / $imgoHeight;
		$imgnHeight = $thHeight;
		$imgnWidth = round($imgoWidth*$factor);

		if ($imgnWidth>$thWidth) {
			$factor = $thWidth / $imgoWidth;
			$imgnWidth = $thWidth;
			$imgnHeight = round($imgoHeight * $factor);
			}

		}

	// Handle Zoom
	if ($thZoom) {
		$imgnWidth = $thWidth;
		$imgnHeight = $thHeight;

		// Simple (Square)
		if ($thWidth==$thHeight) {
			if ($imgoWidth>=$imgoHeight) {
				$offset_left = ($imgoWidth-$imgoHeight) / 2;
				$imgoWidth = $imgoHeight;
				$imgoHeight = $imgoHeight;
				}
			else {
				$offset_top = ($imgoHeight-$imgoWidth) / 2;
				$imgoWidth = $imgoWidth;
				$imgoHeight = $imgoWidth;
				}
			}

		// Adv (Rect, no square)
		if ($thWidth!=$thHeight) {

			$widFactor = $imgoWidth / $thWidth;
			$heiFactor = $imgoHeight / $thHeight;

			if ($widFactor>=$heiFactor) {
				$nWidth = $thWidth*$heiFactor;
				$offset_left = ($imgoWidth/2) - ($nWidth/2);
				$imgoWidth = $nWidth;
				}
			else {
				$nHeight = $thHeight*$widFactor;
				$offset_top = ($imgoHeight/2) - ($nHeight/2);
				$imgoHeight = $nHeight;
				}

			}

		}

	// Create Empty Thumbnail Image
	$imgThumb = @imagecreatetruecolor($imgnWidth,$imgnHeight);
	if ($imgSrcExtension=="png") {
		imagealphablending($imgThumb, false); 	// setting alpha blending on
		imagesavealpha($imgThumb, true); 		// save alphablending setting (important)
		}

	// Copy ImageSrc to ImageThumb
	if ($thLowquality) { $image_isCopied = imagecopyresized ( $imgThumb, $imgSrc, 0, 0, $offset_left, $offset_top, $imgnWidth, $imgnHeight, $imgoWidth, $imgoHeight ); }
	if (!$thLowquality) { $image_isCopied = imagecopyresampled ( $imgThumb, $imgSrc, 0, 0, $offset_left, $offset_top, $imgnWidth, $imgnHeight, $imgoWidth, $imgoHeight ); }

	$str = "imagecopyresized ( imgThumb, imgSrc, 0, 0, $offset_left, $offset_top, $imgnWidth, $imgnHeight, $imgoWidth, $imgoHeight );";
	//error($str);

	if (!$image_isCopied) { error("ImageCopy() Failed!\n$php_errormsg"); }

// Save Cache

if ($cfg["cacheEnabled"]) {
	$imgCache = cache_save($realImgFile, $imgThumb, $thWidth, $thHeight);
	}

// Header

header("Content-Disposition: filename=\"{$imgName}\"");

// Output Thumb
switch(strtolower($imgSrcExtension)) {

	case "jpg": case "jpeg":
	header("Content-type: image/jpeg");
	imagejpeg($imgThumb, NULL, $thQuality);
	if ($imgCache) { imagejpeg($imgThumb, $imgCache, $thQuality); }
	break;

	case "png":
	header("Content-type: image/png");
	imagepng($imgThumb, NULL, $thCompress);
	if ($imgCache) { imagepng($imgThumb, $imgCache, $thCompress); }
	break;

	case "gif":
	imagegif($imgThumb, NULL);
	if ($imgCache) { imagegif($imgThumb, $imgCache); }
	break;

	default:
	header("Content-type: image/jpeg");
	imagejpeg($imgThumb, NULL, $thQuality);
	break;

	}

// Cleanup
imagedestroy($imgSrc);
imagedestroy($imgThumb);

if ($tmpfilepath) {
	unlink($tmpfilepath);
	}

if ($deleteTmpImage) {
	unlink("tmp.image");
	}

setIdle();












?>
