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
        $data["byversion"][$version] = $jsonv;
        $data["byversion"][$version]["ids"][] = $id;
        $data["byversion"][$version]["entries"] = 1;
    } else if (!in_array($id,$data["byversion"][$version]["ids"])) {
        $data["byversion"][$version]["entries"] ++;
    }

    // By model
    $model = $jsonv["device_model"];
    if (!$data["bymodel"][$model]) {
        $data["bymodel"][$model] = $jsonv;
        $data["bymodel"][$model]["ids"][] = $id;
        $data["bymodel"][$model]["entries"] = 1;
    } else if (!in_array($id,$data["bymodel"][$model]["ids"])) {
        $data["bymodel"][$model]["entries"] ++;
    }

    // By platform
    $platform = $jsonv["device_platform"];
    if (!$data["byplatform"][$platform]) {
        $data["byplatform"][$platform] = $jsonv;
        $data["byplatform"][$platform]["ids"][] = $id;
        $data["byplatform"][$platform]["entries"] = 1;
    } else if (!in_array($id,$data["byplatform"][$platform]["ids"])) {
        $data["byplatform"][$platform]["entries"] ++;
    }

}

echo "<p>Unique device IDs: ". count($data["byid"]) ."</p>";

echo "<p>Versions: <br>";
foreach($data["byversion"] as $k => $v) {
    echo "&nbsp;&nbsp;". $k ." = ". $v["entries"] ."<br>";
}
echo "</p>";

echo "<p>Models: <br>";
foreach($data["bymodel"] as $k => $v) {
    echo "&nbsp;&nbsp;". $k ." = ". $v["entries"] ."<br>";
}
echo "</p>";

echo "<p>Platforms: <br>";
foreach($data["byplatform"] as $k => $v) {
    echo "&nbsp;&nbsp;". $k ." = ". $v["entries"] ."<br>";
}
echo "</p>";





?>
