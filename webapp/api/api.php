<?

/*

	Icerrr API

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
		
			// file list -- example
			case "filelist":
				$files = rd($cfg["path_to_folder_containing_json_files"]);
				$jsons = json_encode($files);
				echo $jsons;
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