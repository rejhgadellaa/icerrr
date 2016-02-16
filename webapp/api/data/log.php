<?

include("../s.functions.php");

header("Content-Type: text/plain");
header("Access-Control-Allow-Origin: *");

$fr = fr("log.txt");
echo $fr;

?>