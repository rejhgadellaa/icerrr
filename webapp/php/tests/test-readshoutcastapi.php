<?

// Documentation
//
// Help xml2json: http://lostechies.com/seanbiefeld/2011/10/21/simple-xml-to-json-with-php/
// Help shoutcast api: http://wiki.winamp.com/wiki/SHOUTcast_Radio_Directory_API
//
// Example usage:
// - ?q={"TODO":"Examples"}

// Function: fw
function fw($path,$content,$append=false) {
	if ($append) {
		$fo = @fopen($path,"r");
		$fr = @fread($fo,@filesize($path));
		@fclose($fo);
		$content = $fr.$content;
	}
	$fo = @fopen($path,"w");
	$fw = @fwrite($fo,$content);
	@fclose($fo);
	return $fw;
}

// Function: error
function error($message) {
	$json = array(
		"error" => 1,
		"errormsg" => $message
	);
	header("Content-Type: application/json");
	header("Access-Control-Allow-Origin: *");
	echo json_encode($json);
	die();
}

// Job

// Handle query
$querys = urldecode($_GET["q"]);
$queryj = json_decode($querys,true);

// Check
if (!$queryj['url']) { error("Query error: missing 'url' parameter"); }

// Get xml
$fileContents = file_get_contents($queryj['url']);
$fileContents = str_replace(array("\n", "\r", "\t"), '', $fileContents);
$fileContents = trim(str_replace('"', "'", $fileContents));
$simpleXml = simplexml_load_string($fileContents);

// Convert to json and back to str so we're sure all is fine
$json = json_encode($simpleXml);
if (!$json) { error("Could not convert simpleXml to json"); }

$jsons = json_decode($json,true);
if (!$jsons) { error("Could not convert json(simpleXml) to jsons"); }

// Output
header("Content-Type: application/json");
// header("Access-Control-Allow-Origin: *"); // TODO: enable this? Not needed because api.php is on same server (and ignores it anyway)
echo $jsons;













?>