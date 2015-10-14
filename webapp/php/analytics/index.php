<?

include("s.functions.php");

// Read data
$jsons = fr("../../api/data/analytics.json");
$json = json_decode($jsons,true);

$data = array();
$data["byid"] = array();
$data["byversion"] = array();
$data["bymodel"] = array();
$data["byplatform"] = array();
$data["installgraph"] = array();

foreach($json as $jsonk => $jsonv) {

    $newid = false;

    // By id
    $id = $jsonv["id"];
    if (!$data["byid"][$id]) {
        $data["byid"][$id] = $jsonv;
        $data["byid"][$id]["entries"] = 1;
        $newid = true;
    } else {
        $data["byid"][$id]["entries"] ++;
    }

    // By version
    $version = $jsonv["app_version"];
    if (!$data["byversion"][$version]) {
        $data["byversion"][$version] = array();
        $data["byversion"][$version]["ids"][] = $id;
        $data["byversion"][$version]["datas"][] = $jsonv;
        $data["byversion"][$version]["entries"] = 1;
    } else if (!in_array($id,$data["byversion"][$version]["ids"])) {
        $data["byversion"][$version]["ids"][] = $id;
        $data["byversion"][$version]["datas"][] = $jsonv;
        $data["byversion"][$version]["entries"] ++;
    }

    // By model
    $model = $jsonv["device_model"];
    if (!$data["bymodel"][$model]) {
        $data["bymodel"][$model] = array();
        $data["bymodel"][$model]["ids"][] = $id;
        $data["bymodel"][$model]["datas"][] = $jsonv;
        $data["bymodel"][$model]["entries"] = 1;
    } else if (!in_array($id,$data["bymodel"][$model]["ids"])) {
        $data["bymodel"][$model]["ids"][] = $id;
        $data["bymodel"][$model]["datas"][] = $jsonv;
        $data["bymodel"][$model]["entries"] ++;
    }

    // By platform
    $platform = $jsonv["device_platform"];
    if (!$data["byplatform"][$platform]) {
        $data["byplatform"][$platform] = array();
        $data["byplatform"][$platform]["ids"][] = $id;
        $data["byplatform"][$platform]["datas"][] = $jsonv;
        $data["byplatform"][$platform]["entries"] = 1;
    } else if (!in_array($id,$data["byplatform"][$platform]["ids"])) {
        $data["byplatform"][$platform]["ids"][] = $id;
        $data["byplatform"][$platform]["datas"][] = $jsonv;
        $data["byplatform"][$platform]["entries"] ++;
    }

}

?>


<!--

	ICERRR

	REJH Gadellaa 2015

-->

<!doctype html>

<html lang="en">

<head>

	<!-- UTF-8 -->
    <meta charset="utf-8">

    <!-- Title + Info -->
    <title>ICERRR Analytics</title>

    <!-- Style-->
    <link rel="stylesheet" type="text/css" href="default.css?c=<?=time();?>" />

    <!-- Webfonts -->
    <link href='http://fonts.googleapis.com/css?family=Roboto:100,200,300,400' rel='stylesheet' type='text/css'>

    <!-- Scripts -->
    <script>

        var data = {};
        data.byversions = '<? echo json_encode($data["byversion"]); ?>';
        data.bymodels = '<? echo json_encode($data["bymodel"]); ?>';
        data.byplatforms = '<? echo json_encode($data["byplatform"]); ?>';

    </script>
    <script src="script.js?c=<?=time();?>"></script>
    <script src="chartjs-min.js"></script>
    <script src="dateformat.js"></script>

</head>

<body onload="ch.init();">

<h2>By version:</h2>
<canvas id="chart_byversion"></canvas>

<h2>By model:</h2>
<canvas id="chart_bymodel"></canvas>

<h2>By platform:</h2>
<canvas id="chart_byplatform"></canvas>

<?

echo "<p>Unique device IDs: ". count($data["byid"]) ."</p>";

echo "<p>Versions: <br>";
foreach($data["byversion"] as $k => $v) {
    if ($k=="ids" || $k=="datas") { continue; }
    echo "&nbsp;&nbsp;". $k ." = ". $v["entries"] ."<br>";
    //echo count($data["byversion"][$k]["ids"]) ."<br>";
}
echo "</p>";

echo "<p>Models: <br>";
foreach($data["bymodel"] as $k => $v) {
    if ($k=="ids" || $k=="datas") { continue; }
    echo "&nbsp;&nbsp;". $k ." = ". $v["entries"] ."<br>";
    //echo count($data["bymodel"][$k]["ids"]) ."<br>";
}
echo "</p>";

echo "<p>Platforms: <br>";
foreach($data["byplatform"] as $k => $v) {
    if ($k=="ids" || $k=="datas") { continue; }
    echo "&nbsp;&nbsp;". $k ." = ". $v["entries"] ."<br>";
    //echo count($data["byplatform"][$k]["ids"]) ."<br>";
}
echo "</p>";

?>

</body>

</html>
