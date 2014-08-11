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
				$json["data"] = readJsonsFile($filename);
				if (!$json["data"]) { error("Error: file '$filename' not found"); }
				$json["info"]["last_update_time_ms"] = filemtime($filename)*1000; // TODO: More info?
				$jsons = gzencode(json_encode($json));
				header('Content-Encoding: gzip');
				echo $jsons;
				break;
				
			// station_info
			case "station_info":
				$filename = "../json/station_info.".$queryobj["station_id"].".json"
				if (!$queryobj["station_id"]) { error("Error: 'station_id' not defined for get:station_info"); }
				$json["data"] = readJsonsFile($filename);
				if (!$json["data"]) { error("Error: file '$filename' not found"); } // TODO: Generate file :D
				$json["info"]["last_update_time_ms"] = filemtime($filename)*1000; // TODO: More info?
				$jsons = gzencode(json_encode($json));
				header('Content-Encoding: gzip');
				echo $jsons;
				break;
				
			// station_nowplaying
			case "station_nowplaying":
				$filename = "../json/station_nowplaying.".$queryobj["station_id"].".json"
				if (!$queryobj["station_id"]) { error("Error: 'station_id' not defined for get:station_info"); }
				$json["data"] = readJsonsFile($filename);
				if (!$json["data"]) { error("Error: file '$filename' not found"); } // TODO: Generate file :D
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
			
			// default	
			default:
				error("Error in query: '$query', {$queryobj['get']}, {$queryobj}");
				break;


		}
		
	// POST ...
	
	// Default
	default:
		error("Action '{$action}' is not supported");
		die();
		
}


















?>