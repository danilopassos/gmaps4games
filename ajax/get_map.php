<?php
	include('../config.php');
    include('../class/mysql2json.class.php');
	
	session_start("map");
	$map_container = $_GET["map_container"];
    
    $query = "select map_id
                   , mp.name as map_type_name
                   , mp.google_default
	               , m.name
				   , tile_url
				   , tile_ext
				   , marker_url
				   , marker_ext
				   , map_overlay_id
				   , map_overlay_name
				   , max_zoom
				   , map_copyright
				   , CASE WHEN mm.site_name IS NULL 
						THEN CONCAT('<A HREF=\"mailto:', mm.email, '\">', mm.name, '</A>')
						ELSE CONCAT('<A HREF=\"mailto:', mm.email, '\">', mm.name, '</A> from <A HREF=\"', mm.site_url, '\" target=\"new_\">', mm.site_name, '</A>')
				     END AS map_mapper
				   , default_map
				   , default_zoom
				   , img404
				   , empty_map
                from " . $map_prefix . "map m
				left outer join " . $map_prefix . "mapper mm
				  ON m.mapper_id = mm.mapper_id
                   , " . $map_prefix . "map_type mp
				   , " . $map_prefix . "map_container mc
               where m.map_container_id = " . $map_container . "
				 and mc.map_container_id = m.map_container_id
                 and m.map_type_id = mp.map_type_id
				 and m.visible = 1
               order by map_order
			       , map_id;
    ";
	//echo $query;
    $result = @mysql_query($query) or die(mysql_error());

    $mysql2json = new mysql2json();
    
    $num = mysql_affected_rows();
    echo $mysql2json->getJSON2($result, $num);
?>
