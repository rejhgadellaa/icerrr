<?

// Errors
$cfg["errorEnabled"] = "true";			// Enables output of errors

// Cache options
$cfg["cacheEnabled"] = true;			// Enables caching. Set false or 0 to disable caching of produced images. Default: true
$cfg["cacheMaxFiles"] = 8192;			// If number of cached images exceeds CacheMaxFiles they will be deleted (fifo). Default: 512
$cfg["cacheMaxImgW"] = 0;				// Set 0 to disable. Default: 512
$cfg["cacheMaxImgH"] = 0;				// Set 0 to disable. Default: 512

$cfg["cacheRemoteFiles"] = true;		// Not functional yet.
$cfg["cacheSustainability"] = 1;		// Sets number of days before cached image will be updated. Set 0 to disable. / Works for remote files only (for now)

// Alpha / Not available yet
$cfg["remotePreResizerEnabled"] = true;	// Enables use of remote pre-resizing if aprox. memory usage > memory available.
$cfg["remotePreResizerUrl"] = "http://tools.rejh.nl/rgthumb/remotePreResizer/redirect.php?";




?>