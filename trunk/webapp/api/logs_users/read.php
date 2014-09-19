<?

include("functions.php");

$rd = rd("html/");
asort($rd);

$lastdevice = -1;
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





?>