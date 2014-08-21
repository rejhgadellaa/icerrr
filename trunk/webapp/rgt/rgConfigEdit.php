<?

function fr($file) {
	$fo = @fopen($file,"r");
	$fr = @fread($fo, filesize($file));
	return $fr;
	}
	
function fw($file, $content) {
	$fo = @fopen($file,"w");
	$fw = fwrite($fo, $content);
	if ($fw) { return true; } else { return false; }
	}
	
// ---------------------------------------------

$configfile = $_GET["file"];
if (!$configfile || !file_exists($configfile)) { die("Error: ?file=undefined"); }

// ---------------------------------------------

if ($_GET["save"] && $_POST) { 

	// Backup
	if (!is_dir("bin/")) { mkdir("bin/"); }
	$fr = fr($configfile); fw("bin/rgConfigEdit.bck.{$configfile}.".time().".txt",$fr);
	
	// Write
		
	$config = "<?\n\n";
	$config.= "// ".strtoupper($configfile)." / Edited with rgConfigEdit, ".date("Y-m-d H:i:s")."\n\n";
	
	foreach($_POST as $key => $val) {
		if ($key=="cfgArrayName") { $cfgArrayName = $val; continue; }
		$config.= "--cfgArrayName--[\"{$key}\"] = \"{$val}\";\n";
		}
		
	$config.= "--cfgArrayName--[\"cfgArrayName\"] = \"{$cfgArrayName}\";\n";
	$config.= "\n\n?>";
	
	$config = str_replace("\n","\r\n",$config);
	$config = str_replace("--cfgArrayName--", "\${$cfgArrayName}", $config);
	$config = stripslashes($config);
	$fw = fw($configfile, $config);
	
	if ($fw) { header("location: rgConfigEdit.php?file=$configfile"); }
	else { die("Error accured?<br><a href='javascript:history.back(1)'>Back</a>"); }
	
	die();
	
	}

// ---------------------------------------------

$config = fr($configfile);

$strStart = 1;
$strEnd = 0;
$strLen = 0;

$whileInt = 0;

while($strStart>0) {

	$key = ""; $val = "";
	
	if ($strStart>strlen($config)) { $strStart=-1; continue; }

	$whileInt++;
	if ($whileInt>256) { $strStart=-1; continue; }
	
	$strStart = strpos($config, '["', $strStart) + strlen('["');
	$strEnd = strpos($config, '"]', $strStart);
	$strLen = $strEnd - $strStart;
	
		if ($strStart<=strlen('["')) { $strStart=-1; continue; }
	
	$key = substr($config, $strStart, $strLen);
		
	$strStart = strpos($config, '"', $strEnd+1)+1;
	$strEnd = strpos($config, '"', $strStart);
	$strLen = $strEnd - $strStart;
	
	$val = substr($config, $strStart, $strLen);
		
	if (!$key || !$val) { $strStart=-1; continue; }
	if ($key=="cfgArrayName") { $cfgArrayName=$val; continue; }
	
	$configdata[$key] = $val;
	
	}
	
echo "<html><style>body, table { font-family:Segoe UI, Verdana; font-size:11px; }</style>";
echo "\n<body>";

echo "\n<p><strong style='font-size:14px;'>&nbsp;rgConfigEdit</strong> :: $configfile</p>";

echo "<form method='post' action='rgConfigEdit.php?file={$configfile}&save=true'>";
echo "\n\t<table>";

echo "\n\t<tr>";
echo "<td><strong>cfgArrayName&nbsp;</strong></td>";
echo "<td><input type='text' name=\"cfgArrayName\" value=\"{$cfgArrayName}\" style='width:300px; font-weight:bold;' /></td>";
echo "</tr>";

echo "\n\t<tr><td>&nbsp;</td></tr>";

foreach($configdata as $key => $val) {
	
	echo "\n\t";
	echo "<tr>";
	echo "<td>{$key}&nbsp;</td>";
	echo "<td><input type='text' name=\"{$key}\" value=\"{$val}\" style='width:300px;' /></td>";
	echo "</tr>";
	
	}
	
echo "\n";
echo "</table>";

echo "<p><input type='button' value='Save' onclick='document.forms[0].submit();' /> <input type='button' value='Close' onclick='window.close();'</p>";
echo "</form>";

echo "<p style='font-size:10px;'>Note: Backups will be saved to [relPath]/bin/rgConfigEdit.bck.$configfile.[time()].txt</p>";








?>