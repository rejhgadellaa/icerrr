<?

include("s.functions.php");

$data_stations_urls = array();
$data_stations_urls_count = array();
$data_stations = array();
$data_station = array();
$device_ids = array();

$path_stations = "../../api/stations_users/";
$path_station = "../../api/station_users/";
$files_stations = rd($path_stations);
$files_station = rd($path_station);

// Get stations, remove duplicates
foreach ($files_stations as $file_stations) {
	
	$jsons_stations = fr($path_stations.$file_stations);
	$json_stations = json_decode($jsons_stations,true);
	
	if (!$json_stations) { continue; }
	
	$file_nameparts = explode("_",$file_stations);
	$device_id = $file_nameparts[1];
	
	foreach ($json_stations as $station) {
		
		if (!in_array($station["station_url"],$data_stations_urls)) {
			
			$data_stations_urls_count[$station["station_url"]]++;
			$data_stations_urls[] = $station["station_url"];
			$data_stations[] = $station;
			$device_ids[] = $device_id;
			
		} elseif (!in_array($device_id,$device_ids)) {
		
			$data_stations_urls_count[$station["station_url"]]++;
			
		}
		
	}
	
}

// $data_stations
echo "<table>";
foreach ($data_stations as $station) {

	$readid3 = '{"get":"station_info","station_id":"'. $station['station_id'] .'","host":"'. $station['station_host'] .'","port":"'. $station['station_port'] .'","path":"'. $station['station_path'] .'"}';
	$id3_reader_url = "http://". $_SERVER['HTTP_HOST'] ."/icerrr/php/tests/test-readid3.php?q=";
	$id3_reader_q = $readid3;
	
	$count = $data_stations_urls_count[$station["station_url"]];
	
	echo "<tr>";
	echo "<td>{$count} &nbsp;</td>";
	echo "<td>{$station['station_name']} &nbsp;</td>";
	echo "<td><a href='{$station['station_url']}' target='_blank'>{$station['station_url']}</a> &nbsp;</td>";
	echo "<td><a href='". $id3_reader_url.$id3_reader_q ."' target='_blank'>ReadID3</a></td>";
	echo "</tr>";
	
}








?>