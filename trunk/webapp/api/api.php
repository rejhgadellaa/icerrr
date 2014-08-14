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

include("s.config.php");
include("s.functions.php");

$action = $_GET["a"];
$query = urldecode($_GET["q"]);

// Checkin'
if (!$action) { error("GET['action'] is not defined"); }

// Header
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

// Actions
switch($action) {
	
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
				$jsons = gzencode(json_encode($json));
				header('Content-Encoding: gzip');
				echo $jsons;
				break;
				
			// station_info
			case "station_info":
				if (!$queryobj["station_id"]) { error("Error: 'station_id' not defined for get:station_info"); }
				$filename = "../json/station_info.".$queryobj["station_id"].".json";
				if (@filemtime($filename)<time()-60) { // refresh file every xx secs
					$id3_reader_url = "http://". $_SERVER['HTTP_HOST'] ."/icerrr/php/tests/test-readid3.php?q=";
					$id3_reader_q = '{"station_id":"'. $queryobj["station_id"] .'","host":"'. $queryobj["station_host"] .'","port":'. $queryobj["station_port"] .',"path":"'. $queryobj["station_path"] .'"}';
					$fg = fg($id3_reader_url.$id3_reader_q);
					if (!$fg) { error("Error talking to id3 reader: '".$id3_reader_url.$id3_reader_q."', '$fg', ". json_encode(error_get_last())); }
					$fw = fw($filename,$fg);
					if (!$fw) { error("Could not write $filename"); }
				}
				$json["data"] = json_decode(fr($filename),true);
				if (!$json["data"]) { error("Error: file '$filename' not found"); } // TODO: Generate file :D
				//$json["data"] = json_decode($json["data"],true);
				$json["info"]["last_update_time_ms"] = filemtime($filename)*1000; // TODO: More info?
				$jsons = gzencode(json_encode($json));
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
				$jsons = json_encode($json);
				echo $json;
				break;
			
			// strings
			case "strings":
				error("Not implemented yet"); // TODO: todo
				break;
			
			// default	
			default:
				error("Error in query: '$query', {$queryobj['get']}, {$queryobj}");
				break;


		}
		break; // <-- Important stuff
		
	// POST ...
	
	// Default
	default:
		error("Action '{$action}' is not supported");
		die();
		
}


















?>