<?

// Documentation
//
// Example usage:
// - ?q={"station_id":"3fm","host":"icecast.omroep.nl","port":80,"path":"/3fm-sb-mp3"}

error_reporting(E_ERROR | E_PARSE);

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

// Handle query
$querys = urldecode($_GET["q"]);
$queryj = json_decode($querys,true);

	// -> Checks and such
	// if (!$queryj["station_id"]) { $queryj["station_id"] = "unknown"; }
	if (!$queryj["host"]) { $queryj["host"] = "null"; }
	if (!$queryj["port"]) { $queryj["port"] = 80; }
	if (!$queryj["path"]) { $queryj["path"] = "/"; }
	
$timebgn = time();

// Open a socket
$fsock = @fsockopen($queryj["host"],$queryj["port"],$errno,$errstr,5);
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
		error("Could not open socket: '".$queryj["host"]."' (dns lookup: '{$diddnslookup}', '{$host}'), '".$queryj["port"] ."', $errno $errstr"); 
		die();
	}
	
}

// Create http_request
$request = "GET ".$queryj["path"]." HTTP/1.0\r\nIcy-MetaData:1\r\n\r\n";

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
	if ($timerunning>16) { fclose($fsock); error("Exceeded 24 seconds of running time.."); }
	
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
		$end = strpos($line,";",$bgn)-1;
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
	
	// Skip?
	if (!$key || !$val) { continue; }
	
	// store
	$array[$key] = $val;
	
}

// Add title
$array["nowplaying"] = $title;

// Add station_id, timestamp
$array["station_id"] = $queryj["station_id"];
$array["time_ms"] = time()*1000;
// $array["querys"] = $querys;
$array["queryj"] = $queryj;
$array["time_read"] = time()-$timebgn;

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