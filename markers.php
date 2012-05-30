<?php
	header('Content-type: text/css');
	
	include('config.php');

	session_start("map");
	
	// We need to select the markers icons and create the CSS according to each one (restriction of googlemaps).
    $query = 'SELECT c.marker_category_id, CONCAT( mc.marker_url, c.img ) as marker_url
				FROM ' . $map_prefix . 'marker_category c
				   , ' . $map_prefix . 'map_container mc	   
			   WHERE mc.map_container_id = ' . $_SESSION["map_container"] . '
			     AND c.visible = 1
			   GROUP BY 1';
    $result = @mysql_query($query) or die(mysql_error());

    while ($row = mysql_fetch_array($result)) {
		echo ".icnMrkr" . $row['marker_category_id'] . " {";
		echo "\tbackground-image: url(\"" . $row['marker_url'] . "\") !important;";
		echo "}\n"; 
	}
?>

.icnMrkr {
	background-size:100% 100%;
	-webkit-background-size: 100% 100%;
	-o-background-size: 100% 100%;
	-khtml-background-size: 100% 100%;
	-moz-background-size: 100% 100%;		
}