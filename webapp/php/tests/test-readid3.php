<?

// Documentation
//
// Example usage:
// - ?q={"station_id":"3fm","host":"icecast.omroep.nl","port":80,"path":"/3fm-sb-mp3"}

error_reporting(E_ERROR | E_PARSE);

$localserver = "http://94.209.13.221:80/icerrr/php/tests/test-readid3.php?q=";

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

// Function: fr
function fr($path) {
	$fo = @fopen($path,"r");
	$fr = @fread($fo,@filesize($path));
	@fclose($fo);
	return $fr;
}

function fg($f) {

	$fo = @fopen($f, "r");
	if (!$fo) { @fclose($fo); return false; }
	while($fg = @fgets($fo)) { $buffer .= $fg; }
	@fclose($fo);
	if ($buffer) { return $buffer; }
	return false;
	/**/
	//return @file_get_contents($f);
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

// Unshorten url (get redirect url)
function unshorten_url($url){

	//global $queryj;

    $ch = curl_init();

    curl_setopt($ch, CURLOPT_HEADER, 1);
    curl_setopt($ch, CURLOPT_NOBODY, 1);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_URL, $url);
    $out = curl_exec($ch);

    $real_url = $url;//default.. (if no redirect)

    if (preg_match("/location: (.*)/i", $out, $redirect))
        $real_url = $redirect[1];

    if (strstr($real_url, "bit.ly"))//the redirect is another shortened url
        $real_url = unshorten_url($real_url);

    return $real_url;
    /**/
}

// Handle query
$querys = urldecode($_GET["q"]);
$queryj = json_decode($querys,true);

	// -> Checks and such
	// if (!$queryj["station_id"]) { $queryj["station_id"] = "unknown"; }
	if (!$queryj["host"]) { $queryj["host"] = "null"; }
	if (!$queryj["port"]) { $queryj["port"] = 80; }
	if (!$queryj["path"] || $queryj["path"]=="null") { $queryj["path"] = "/"; }

	// -> Hack: icecast.omroep.nl
	if ($queryj["host"]=="icecast.omroep.nl") {
		$queryj["path"] = str_replace("-sb-","-bb-",$queryj["path"]);
	}

// Prep blacklist..
$blacklist_filename = "blacklist_". str_replace(".","",$queryj["host"]) ."-". $queryj["port"] .".txt";
if (file_exists($blacklist_filename)) {

	if (filemtime($blacklist_filename) > time()-(60*60*24)) { // keep 24hrs

		//error("Stream has been blacklisted");
		$array["nowplaying"] = "";
		$array["station_id"] = $queryj["station_id"];
		$array["time_ms"] = time()*1000;
		$array["queryj"] = $queryj;
		$array["time_read"] = time()-$timebgn;
		$array["blacklisted"] = true;
		$jsons = json_encode($array);
		$filename2 = "../../json/station_info.". $queryj["station_id"].".json";
		$fw = fw($filename2,$jsons);

		// Output
		header("Content-Type: application/json");
		// header("Access-Control-Allow-Origin: *"); // TODO: enable this? Not needed because api.php is on same server (and ignores it anyway)
		echo $jsons;
		die();

	} else {

		@unlink($blacklist_filename);

	}

}

// Check for redirects
$url = $queryj["host"] .":". $queryj["port"] . $queryj["path"];
$rurl = unshorten_url($url);
if ($url!=$rurl) {
	// host..
	$rurl = substr($rurl,7);
	$host = $rurl;
	if (strpos($host,":")>0) {
		$host = substr($host,0,strpos($host,":"));
	} elseif (strpos($host,"/")>0) {
		$host = substr($host,0,strpos($host,"/"));
	}
	// port
	$port = 80;
	if (strpos($rurl,":")>0) {
		$port = substr($rurl,strpos($rurl,":")+1);
		if (strpos($port,"/")>0) {
			$port = substr($port,0,strpos($port,"/"));
		} elseif (strpos($port,"?")>0) {
			$port = substr($port,0,strpos($port,"?"));
		}
	}
	// path
	$path = "/";
	if (strpos($rurl,"/")>0) {
		$path = substr($rurl,strpos($rurl,"/"));
	}
	$queryj["host"] = trim($host);
	$queryj["port"] = intval(trim($port));
	$queryj["path"] = trim($path);
}

// Port?
if ($queryj["port"]!=80 && strpos($localserver,$_SERVER['HTTP_HOST'])===FALSE) {

	$query = $localserver . urlencode('{"station_id":"'. $queryj["station_id"] .'","host":"'. $queryj["host"] .'","port":"'. $queryj["port"] .'","path":"'. $queryj["path"] .'"}');
	$fg = fg($query);
	header("Content-Type: application/json");
	die($fg);

}

// Begin..
$timebgn = time();

// Open a socket
$fsock = @fsockopen($queryj["host"],$queryj["port"],$errno,$errstr,5);

// Start reading from socket (if not false)
if (!$fsock) {

	$diddnslookup = 0;

	// IP or nameserver?
	if (count(explode(".",$queryj["host"]))<4) {

		$diddnslookup = 1;

		// Try dns lookup
		$dns = dns_get_record ($queryj["host"]);
		if (!$dns) {
			error("Error getting dns record for host '". $queryj["host"] ."'");
			die();
		}

		$host = 0;
		for ($i=0; $i<count($dns); $i++) {
			if ($dns[$i]["ip"]) {
				$host = $dns[$i]["ip"];
				break;
			}
		}

		if (!$host) {
			header("Content-Type: application/json");
			header("Access-Control-Allow-Origin: *");
			$jsons = json_encode($dns);
			echo $jsons;
			die();
		}

		$fsock = fsockopen($host,$queryj["port"],$errno,$errstr,10);
		/**/

	}

	if (!$fsock) {
		error("Could not open socket: '".$queryj["host"]."' (dns lookup: '{$diddnslookup}', '{$host}'), '".$queryj["port"] .", ". $queryj["path"] ."', $errno $errstr");
		die();
	}

}

// Create http_request
$request = "GET ".$queryj["path"]." HTTP/1.0\r\n";

// http_request: Basic auth..?
if ($queryj["user"] && $queryj["pass"]) {
    $user = $queryj["user"];
    $pass = $queryj["pass"];
    $request .= "Authorization: Basic ". base64_encode("{$user}:{$pass}") ."\r\n";
}

// http_request: icy metadata..
$request .= "Icy-MetaData:1\r\n\r\n";

// Request a-go-go
$res = $querys."\n\n";
$headerFound = false;
$metaFound = false;
fwrite($fsock,$request);
$whilenum = 0;
while (!feof($fsock)) {

	$whilenum++;
	if ($whilenum>2048) { fclose($fsock); error("Whilenum exceeded at 'while (!feof($fsock))'"); }

	$timerunning = time() - $timebgn;
	if ($timerunning>16) {
		fclose($fsock);
		// blacklist..
		fw($blacklist_filename,"BLACKLISTED");
		// err
		error("Exceeded 16 seconds of running time..");
	}

	$line = fgets($fsock);
	$res .= $line;
	fw("outp.txt",$res);

	if (strpos($res,"\r\n\r\n") && !$headerFound) {
		// got the header
		$headerFound = true;
		$header = $res;
		fw("outp.header.txt",$res);
	}

	if (strpos($res,"StreamTitle") && $headerFound) {
		// got meta?
		$bgn = strpos($line,"StreamTitle='")+strlen("StreamTitle='");
		$end = strpos($line,"';",$bgn);
		$len = $end - $bgn;
		$title = substr($line,$bgn,$len);
		fw("outp.meta.txt",$title);
		break;
	}

}
fclose($fsock);

// Parse header
$array = array();
$lines = explode("\r\n",$header);
foreach($lines as $line) {

	// get the key/val
	$parts = explode(":",$line,2);
	$key = strtolower(trim($parts[0]));
	$val = strtolower(trim($parts[1]));

	if ($key=="location") { $val = trim($parts[1]); }

	// Skip?
	if (!$key || !$val) { continue; }

	// store
	$array[$key] = utf8_encode($val);

}

// Cleanup title
$title = str_replace("  "," ",$title);
$title = preg_replace_callback("/(&#[0-9]+;)/", function($m) { return mb_convert_encoding($m[1], "UTF-8", "HTML-ENTITIES"); }, title);
$title = str_replace("& #4","",$title);
$title = trim($title);
$title = utf8_encode($title);
$title = str_replace("  "," ",$title);
$title = str_replace("& #4","",$title);
$title = trim($title);

// Add title
$array["nowplaying"] = $title; //." & #4";

// Add station_id, timestamp
$array["station_id"] = $queryj["station_id"];
$array["time_ms"] = time()*1000;
$array["queryj"] = $queryj;
$array["time_read"] = time()-$timebgn;
// $array["read-id3-host"] = $_SESSION["HOST"];

// Write file
$filename = $queryj["station_id"].".json";
$jsons = json_encode($array);
// fw($filename,$jsons); // TODO: Cleanup

$filename2 = "../../json/station_info.". $queryj["station_id"].".json";
$fw = fw($filename2,$jsons);

// Output
header("Content-Type: application/json");
// header("Access-Control-Allow-Origin: *"); // TODO: enable this? Not needed because api.php is on same server (and ignores it anyway)
echo $jsons;























?>
