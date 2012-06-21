<?php
	include('../config.php');
	include('../class/mysql2json.class.php');
	
	
	
	$map_container = 3;
	$map_name = 'Skull Woods';
	$map_tile_url = 'alttp/skull_woods/';
	$mapper = '5';
	$map_floor_min = -1;
	$map_floor_max = 1;
	$map_start_id = 350;
	$map_order = 9;

	$map_id = $map_start_id;
	
	$map_layers = array(
					array("title" => "BG",
					      "tile" => "bg",
						  "checked" => "1",
						  "visible" => "1",
						  "type" => "B"
						  ),
					array("title" => "Enemies",
					      "tile" => "enemies",
						  "checked" => "1",
						  "visible" => "1",
						  "type" => "F"
						  ),
					array("title" => "Secrets",
					      "tile" => "secrets",
						  "checked" => "0",
						  "visible" => "1",
						  "type" => "F"
						  )
					);
	

	$query = "INSERT INTO map_map (
						  map_id
						, map_container_id
						, map_type_id
						, mapper_id
						, name
						, tile_url
						, tile_ext
						, img404
						, default_zoom
						, max_zoom
						, map_overlay_id
						, map_overlay_name
						, map_order
						, map_copyright
						, empty_map
						, visible
				) values (
						  $map_id
						, $map_container
						, 1
						, $mapper
						, '$map_name'
						, ''
						, 'png'
						, 'blank'
						, 2
						, 6
						, $map_start_id
						, 'BASE'
						, $map_order
						, '(c) Nintendo'
						, 1
						, 1
				)
	;";
	echo $query . "<BR>";	
	
	$map_id++;
	
	
	for ($i = $map_floor_max; $i >= $map_floor_min; $i--) {
		if ($i == 0) { 
			continue; 
		}
		
		$map_tile_url_curr = $map_tile_url . ($i < 0 ? "b" : "") . abs($i) . "f/";
		
		$query = "INSERT INTO map_map (
							  map_id
							, map_container_id
							, map_type_id
							, mapper_id
							, name
							, tile_url
							, tile_ext
							, img404
							, default_zoom
							, max_zoom
							, map_overlay_id
							, map_overlay_name
							, map_order
							, map_copyright
							, empty_map
							, visible
					) values (
							  $map_id
							, $map_container
							, 1
							, $mapper
							, '$map_name'
							, '" . $map_tile_url_curr . "floor/'
							, 'png'
							, 'blank'
							, 2
							, 6
							, $map_start_id
							, '" . ($i < 0 ? "B" : "") . abs($i) . "F'
							, $map_order
							, '(c) Nintendo'
							, 0
							, 1
					)
		;";
		echo $query . "<BR>";
		
		for ($j = 0; $j < sizeof($map_layers); $j++) {
			$query = "INSERT INTO map_layer (
								  map_layer_id
								, map_id
								, name
								, tile_url
								, tile_ext
								, img404
								, title
								, control_visible
								, control_checked
								, type
								, layer_order
								, visible
						) values (
								  " . $map_container . str_pad($map_id , 5, "0", STR_PAD_LEFT) . $j . "
								, $map_id
								, '$map_name'
								, '" . $map_tile_url_curr . $map_layers[$j]["tile"] . "/'
								, 'png'
								, 'blank'
								, '" . $map_layers[$j]["title"] . "'
								, " . $map_layers[$j]["visible"] .  "
								, " . $map_layers[$j]["checked"] . "
								, '" . $map_layers[$j]["type"] . "'
								, $j
								, 1
						)
			;";
			echo $query . "<BR>";
		}
		
		$map_id++;
		
		
	}

//	echo "update map_layer set tile_url = 'alttp/hyrule_castle_tower/bg/' where map_layer_id >= 3003380 and title = 'BG';";
	echo "UPDATE  map_map SET  default_map =  '1' WHERE  map_id = 351;";
?>
