<?

/*

	Icerrr API
	
	Examples:
	- GET
		- ?a=get&q={"get":"stations"[,"last_update_time_ms":[ms]]}
		- ?a=get&q={"get":"station_info","station_id":"[station_id]"[,"last_update_time_ms":[ms]]}
		- ?a=get&q={"get":"station_nowplaying","station_id":"[station_id]"[,"last_update_time_ms":[ms]]}
	
	Todos:
	- Implement HTTP 304 not modified
	- Error: also mail (me)?

*/

error_reporting(E_ERROR | E_PARSE);

include("s.config.php");
include("s.functions.php");

cleanupjson();

$action = $_GET["a"];
$query = urldecode($_GET["q"]);
$apikey = urldecode($_GET["apikey"]);

// Checkin'
if (!$action) { error("GET['action'] is not defined"); }

// Header
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

// Actions
switch($action) {

	// APP UPDATE
	
	case "checkappupdate":
		if (!$query) { error("GET['query'] is not defined for action '$action'"); }
		$queryobj = json_decode($query,true);
		$version_user = $queryobj["version"];
		$version_latest = floatval(fr("data/version.txt"));
		$res = array();
		if ($version_user < $version_latest) {
			$res["url"] = "http://{$_SERVER['HTTP_HOST']}/rookmelder/apks/RookAlarm.apk";
			$res["version_user"] = $version_user;
			$res["version_latest"] = $version_latest;
			$res["updateAvailable"] = 1;
		} else {
			$res["updateAvailable"] = 0;
		}
		$jsons = gzencode(json_encode($res));
		header('Content-Encoding: gzip');
		echo $jsons;
		break;
	
	// GET
	case "get":
		
		logg("GET > $query");
		
		if (!$query) { error("GET['query'] is not defined for action '$action'"); }
		
		// Query
		$queryobj = json_decode($query,true);
		switch($queryobj["get"]) {
		
			// stations
			// TODO: status 304 if not modified
			// TODO: work in queues? list may become quite large...
			case "stations":
				$filename = "../json/stations.json";
				$json["data"] = fr($filename);
				if (!$json["data"]) { error("Error: file '$filename' not found"); }
				$json["data"] = json_decode($json["data"],true);
				if (!$json["data"]) { error("Error decoding json string: ". getJsonError(json_last_error())); }
				$json["info"]["last_update_time_ms"] = filemtime($filename)*1000; // TODO: More info?
				$json["info"]["desc"] = $queryobj["get"];
				$jsons = gzencode(json_encode($json));
				header('Content-Encoding: gzip');
				echo $jsons;
				break;
				
			// station_info
			case "station_info":
				if (!$queryobj["station_id"]) { error("Error: 'station_id' not defined for get:station_info"); }
				$filename = "../json/station_info.".$queryobj["station_id"].".json";
				if (@filemtime($filename)<time()-15) { // refresh file every xx secs
					if (!$queryobj["station_port"]) { $queryobj["station_port"] = 80; }
					// $id3_reader_url = "http://". $_SERVER['HTTP_HOST'] ."/icerrr/php/tests/test-readid3.php?q="; // TODO: rejh.nl only opens fsock on port 80
					$id3_reader_url = $cfg["icerrr_local_url"] . "php/tests/test-readid3.php?q=";
					if ($queryobj["station_port"]==80) {
						$id3_reader_url = $cfg["icerrr_remote_url"] . "php/tests/test-readid3.php?q=";
					}
					// "http://www.rejh.nl/icerrr/php/tests/test-readid3.php?q=";
					$id3_reader_q = urlencode('{"station_id":"'. $queryobj["station_id"] .'","host":"'. $queryobj["station_host"] .'","port":'. $queryobj["station_port"] .',"path":"'. $queryobj["station_path"] .'"}');
					// retry this a couple of times..
					$fgjson = false;
					$whilenum = 0;
					while(!$fgjson) {
						logg(" >> Read stream... $whilenum $id3_reader_url");
						if ($whilenum>=1) { break; }
						$whilenum++;
						$fg = fg($id3_reader_url.$id3_reader_q);
						$fgjson = @json_decode($fg,true);
					}
					// logg($id3_reader_q);
					if (!$fg) { 
						error("Error talking to id3 reader: '".$id3_reader_url.$id3_reader_q."', '$fg', ". json_encode(error_get_last())); 
					}
					$fw = fw($filename,$fg);
					if (!$fw) { error("Could not write $filename"); }
				}
				// sleep(1);
				$fr = fr($filename);
				if (!$fr) { error("Error: could not read file '$filename'"); } // TODO: Generate file :D
				$json["data"] = json_decode($fr,true);
				if (!$json["data"]) { logg(" >> ".$fr); error("Error: could not parse json: '$filename'"); }
				//$json["data"] = json_decode($json["data"],true);
				$json["info"]["last_update_time_ms"] = filemtime($filename)*1000; // TODO: More info?
				$json["info"]["last_update_timeago_sec"] = time() - filemtime($filename);
				$json["info"]["last_update_date"] = date("Y-m-d H:i:s",filemtime($filename));
				$json["info"]["desc"] = $queryobj["get"];
				$jsons = json_encode($json);
				$jsons = gzencode($jsons);
				header('Content-Encoding: gzip');
				echo $jsons;
				break;
				
			// station_nowplaying
			case "station_nowplaying":
				if (!$queryobj["station_id"]) { error("Error: 'station_id' not defined for get:station_info"); }
				$filename = "../json/station_nowplaying.".$queryobj["station_id"].".json";
				$json["data"] = fr($filename);
				if (!$json["data"]) { error("Error: file '$filename' not found"); } // TODO: Generate file :D
				//$json["data"] = json_decode($json["data"],true);
				$json["info"]["last_update_time_ms"] = filemtime($filename)*1000; // TODO: More info?
				$json["info"]["desc"] = $queryobj["get"];
				$jsons = gzencode(json_encode($json));
				header('Content-Encoding: gzip');
				echo $jsons;
				break;
			
			// checkforupdates
			case "checkforupdates":
				if (!$queryobj["lookup"]) { error("Error: 'lookup' not defined for get:checkforupdates"); }
				if (!$queryobj["last_update_time_ms"]) { error("Error: 'last_update_time_ms' not defined for get:checkforupdates"); }
				if (!file_exists("../json/".$queryobj["lookup"].".json")) { error("Error: invalid lookup '".$queryobj["lookup"]."', file not found"); }
				$filemtime_ms = @filemtime("../json/".$queryobj["lookup"].".json")*1000;
				if ($queryobj["last_update_time_ms"] < filemtime_ms) { $json["data"] = 1; } // yes you need to update
				else { $json["data"] = 0; }
				$json["info"]["desc"] = $queryobj["get"];
				$jsons = json_encode($json);
				echo $json;
				break;
				
			// parse_playlist
			// - get stream(s) from pls and m3u files
			case "parse_playlist":
				if (!$queryobj["url"]) { error("Error: 'url' not defined for get:".$queryobj["get"]); }
				$fg = fg($queryobj["url"]);
				if (!$fg) { error("Error: Could not load url: '". $queryobj["url"] ."', {$php_errormsg}"); }
				$bgn = 0; $end = -1; $len = -1;
				$bgn = strpos($fg,"http");
				if ($bgn===FALSE) { error("Error: could not parse pls/m3u: '". $queryobj["url"] ."'"); }
				$end = strpos($fg,"\n",$bgn);
				$len = $end - $bgn;
				if ($end===FALSE) { $len = strlen($fg)-$bgn; }
				$url = trim( substr($fg,$bgn,$len), " \n\r\t");
				$json["data"] = $url;
				$json["info"] = array();
				$jsons = gzencode(json_encode($json));
				header('Content-Encoding: gzip');
				echo $jsons;
				break;
			
			// strings
			case "strings":
				error("Not implemented yet"); // TODO: todo
				break;
				
			// -- MESSAGES
			
			case "messages":
				$msgsStr = fg("{$cfg['icerrr_local_url']}api/data/messages.json");
				if (!msgsStr) { error("Could not load messages.json"); }
				$msgs = json_decode($msgsStr,true);
				if (!$msgs) { error("Could not parse messages.json: {$msgs}"); }
				
				$json["info"] = array();
				$json["data"] = $msgs;
				$jsons = gzencode(json_encode($json));
				header('Content-Encoding: gzip');
				echo $jsons;
				break;
				
			// -- EXTERNAL: Dirble api
			
			// search
			case "search_dirble":
				if (!$queryobj["search"]) { error("Error: 'search' not defined for get:{$queryobj['get']}"); }
				$dirble_url = "http://api.dirble.com/v1/search/apikey/{$cfg['dirble_apikey']}/search/";
				$dirble_query = rawurlencode("{$queryobj['search']}");
				$fg = fg($dirble_url.$dirble_query);
				if (!$fg) { error("Error running search on Dirble: '". $dirble_url.$dirble_query."'"); }
				$json["data"] = json_decode($fg,true);
				$json["info"] = array();
				// TODO: catch errors
				$jsons = gzencode(json_encode($json));
				header('Content-Encoding: gzip');
				echo $jsons;
				break;
			
			// search v2
			case "search_dirble_v2_o":
				if (!$queryobj["search"]) { error("Error: 'search' not defined for get:{$queryobj['get']}"); }
				$dirble_url = "http://api.dirble.com/v2/search/";
				$dirble_query = rawurlencode("{$queryobj['search']}");
				$fg = fg($dirble_url . $dirble_query . "?token={$cfg['dirble_apikey']}");
				if (!$fg) { error("Error running search on Dirble: '". $dirble_url.$dirble_query."'"); }
				$json["data"] = json_decode($fg,true);
				$json["info"] = array();
				// TODO: catch errors
				$jsons = gzencode(json_encode($json));
				header('Content-Encoding: gzip');
				echo $jsons;
				break;
				
			// search v2 -> more
			case "search_dirble_v2":
				
				// Prep
				if (!$queryobj["search"]) { error("Error: 'search' not defined for get:{$queryobj['get']}"); }
				$dirble_url = "http://api.dirble.com/v2/search/";
				$dirble_query = rawurlencode("{$queryobj['search']}");
				$drible_url = $dirble_url . $dirble_query . "?token={$cfg['dirble_apikey']}";
				$searchresults = array();
				$results_primary = array();
				$results_secundary = array();
				$page = 1;
				
				// First query
				$fg = fg($drible_url);
				if (!$fg) { error("Error running search on Dirble: '". $dirble_url.$dirble_query."'"); }
				$res = json_decode($fg,true);
				if (!$res) { $res = array(); }
				
				// Add results
				for ($i=0; $i<count($res); $i++) {
					if (!$res[$i]) { continue; }
					$namelower = strtolower($res[$i]["name"]);
					$querylower = strtolower($queryobj['search']);
					
					// Primary/secundary results..
					if (strpos($namelower,$querylower)!==FALSE) {
						$results_primary[] = $res[$i];
					} else {
						$results_secundary[] = $res[$i];
					}
				}
				
				// Keep getting results..
				while(count($res)>0) {
					
					$page++;
					$fg = fg($drible_url . "&page={$page}");
					if (!$fg) { error("Error running search on Dirble: '". $dirble_url.$dirble_query."'"); }
					$res = json_decode($fg,true);
					if (!$res) { $res = array(); }
					
					//header("Content-Type: text/plain");
					//print_r($res);
					// echo "oi<br>";
					
					// Add results
					for ($i=0; $i<count($res); $i++) {
						if (!$res[$i]) { continue; }
						$namelower = strtolower($res[$i]["name"]);
						$querylower = strtolower($queryobj['search']);
						
						// Primary/secundary results..
						if (strpos($namelower,$querylower)!==FALSE) {
							$results_primary[] = $res[$i];
						} else {
							$results_secundary[] = $res[$i];
						}
					}
					
					// Merge
					$searchresults = array_merge($results_primary,$results_secundary);
					
					// Count
					if (count($searchresults)>=64) {
						break;
					}
					
				}
				// Build response
				$json["data"] = $searchresults;
				$json["info"] = array();
				// TODO: catch errors
				$jsons = gzencode(json_encode($json));
				header('Content-Encoding: gzip');
				echo $jsons;
				break;
				
				
				break;
				
			case "nowplaying_dirble":
				if (!$queryobj["dirble_id"]) { error("Error: 'dirble_id' not defined for get:{$queryobj['get']}"); }
				$dirble_url = "http://api.dirble.com/v1/station/apikey/{$cfg['dirble_apikey']}/id/";
				$dirble_query = rawurlencode("{$queryobj['dirble_id']}");
				$fg = fg($dirble_url.$dirble_query);
				if (!$fg) { error("Error running query on Dirble: '". $dirble_url.$dirble_query."'"); }
				$json["data"] = json_decode($fg,true);
				$json["info"] = array();
				// TODO: catch errors
				$jsons = gzencode(json_encode($json));
				header('Content-Encoding: gzip');
				echo $jsons;
				break;
				
			case "nowplaying_dirble_v2":
				if (!$queryobj["dirble_id"]) { error("Error: 'dirble_id' not defined for get:{$queryobj['get']}"); }
				$dirble_url = "http://api.dirble.com/v2/station/id/";
				$dirble_query = rawurlencode("{$queryobj['dirble_id']}");
				$fg = fg($dirble_url.$dirble_query);
				if (!$fg) { error("Error running query on Dirble: '". $dirble_url.$dirble_query."'"); }
				$json["data"] = json_decode($fg,true);
				$json["info"] = array();
				// TODO: catch errors
				$jsons = gzencode(json_encode($json));
				header('Content-Encoding: gzip');
				echo $jsons;
				break;
			
			// default	
			default:
				error("Error in query: '$query', {$queryobj['get']}, {$queryobj}");
				break;


		}
		break; // <-- Important stuff
		
	// POST ...
	case "post":
		
		logg("POST > $query");
	
		if (!$query) { error("GET['query'] is not defined for action '$action'"); }
		if (!$apikey) { error("API key is not provided"); }
		if (strpos($apikey,"REJH_ICERRR_APIKEY-")===FALSE) { error("API key is invalid"); } // TODO: Haha lol I call this a api key? XD
		
		// Query
		$queryobj = json_decode($query,true);
		switch($queryobj["post"]) {
			
			// answers
			case "log":
				$id = $_POST["log_id"];
				$html = $_POST["log_html"];
				$text = $_POST["log_text"];
				if (!$id) { error("Error: !post[log_id]"); }
				if (!$html) { error("Error: !post[log_html]"); }
				$filenamehtml = "logs_users/html/{$id}.html";
				$filenametext = "logs_users/text/{$id}.txt";
				$html = "<html><style>body{font-family:sans-serif;font-size:10pt;}</style><body>{$html}</body></html>";
				$fw = fw($filenamehtml,$html);
				$fw = fw($filenametext,$text);
				if (!$fw) { error("Error: Could not write '$filename'"); }
				$json["data"] = json_decode('{"post":"ok"}',true);
				$json["info"] = array();
				$jsons = json_encode($json);
				logg($jsons);
				echo $jsons;
				sendEmail_log("http://www.rejh.nl/icerrr/api/{$filenamehtml}");
				break;
				
			case "stations":
				$id = $_POST["id"];
				$stations = $_POST["stations"];
				if (!$id || !$stations) { error("Error: !post[id] || !post[stations]"); }
				$filename = "stations_users/stations_{$id}.json";
				$fw = fw($filename,$stations);
				if (!$fw) { error("Error: Could not write '$filename'"); }
				$json["data"] = json_decode('{"post":"ok"}',true);
				$json["info"] = array();
				$jsons = json_encode($json);
				logg($jsons);
				echo $jsons;
				break;
				
			case "station":
				$id = $_POST["id"];
				$station = $_POST["station"];
				if (!$id || !$stations) { error("Error: !post[id] || !post[station]"); }
				$filename = "station_users/station_{$id}.json";
				$fw = fw($filename,$station);
				if (!$fw) { error("Error: Could not write '$filename'"); }
				$json["data"] = json_decode('{"post":"ok"}',true);
				$json["info"] = array();
				$jsons = json_encode($json);
				logg($jsons);
				echo $jsons;
				break;
			
			// default
			default:
				error("Error in query: '$query', {$queryobj['post']}, {$queryobj}");
				die();
		
		}
		break;
	
	// Default
	default:
		error("Action '{$action}' is not supported");
		die();
		
}


















?>