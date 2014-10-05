<?

include("functions.php");

$rd = rd("html/");
asort($rd);

$lastdevice = -1;

// First: sort by device id
$byDeviceIds = array();
foreach($rd as $file) {
	$device = substr($file,0,strpos($file,"_"));
	$byDeviceIds[$device][] = $file;
}

// Now get device names
$res = "Unique devices: ". count($byDeviceIds);
foreach($byDeviceIds as $deviceId => $byDeviceId) {

	if ($lastdevice != $deviceId) { $res .= "<tr><td>&nbsp;</td></tr>"; }
	$lastdevice = $deviceId;
	
	// Find device name
	foreach ($byDeviceId as $file) {
	
		$path = "html/".$file;
		
		$filemtime = @filemtime($path);
		$date = date("Y-m-d H:i:s",$filemtime);
		$date_short = date("m-d H:i",$filemtime);
		
		$fr = fr($path);
		$lines = explode("\n",$fr);
		
		foreach($lines as $line) {
			if (strpos($line,"Device Info")!==FALSE) {
				$res .= "<tr><td>{$date_short}&nbsp;&nbsp;&nbsp;</td><td><a title='$date' href='{$path}'>$file</a></td><td>&nbsp;&nbsp;{$line}</td></tr>";
				break;
			}
		}
		
	}
	
}

echo "<table>";
echo $res;
echo "</table>";


/*
foreach($rd as $file) {

	$device = substr($file,0,strpos($file,"_"));
	if ($device != $lastdevice) { echo "<br>"; }
	$lastdevice = $device;

	$path = "html/".$file;
	$filemtime = @filemtime($path);
	$date = date("Y-m-d H:i:s",$filemtime);
	$date_short = date("m-d H:i",$filemtime);
	echo "{$date_short}&nbsp;&nbsp;&nbsp;<a title='$date' href='$path' target='_blank'>{$file}</a><br>";

}
/**/





?>