<?php
	include('../config.php');
    include('../class/mysql2json.class.php');
	
	session_start("map");
	$map_container = $_GET["map_container"];
    
    $query = "select ml.map_layer_id
				   , ml.map_id
				   , ml.tile_url
				   , ml.tile_ext
				   , ml.img404
				   , ml.title
				   , ml.control_visible
				   , ml.control_checked
				   , ml.type
                from " . $map_prefix . "map m
				   , " . $map_prefix . "layer ml
               where m.map_container_id = " . $map_container . "
				 and m.map_id = ml.map_id
				 and ml.visible = 1
               order by ml.layer_order
			       , ml.map_id;
    ";
	//echo $query;
    $result = @mysql_query($query) or die(mysql_error());

    $mysql2json = new mysql2json();
    
    $num = mysql_affected_rows();
    echo $mysql2json->getJSON2($result, $num);
?>
