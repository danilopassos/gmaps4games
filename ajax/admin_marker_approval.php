<?php
	if (isset($_GET['mkrstg'])) {
		include('../config.php');
		include('../class/mysql2json.class.php');
		
		session_start("map");
		begin();		
	
		$mkrStg = $_GET['mkrstg'];		
	} else {
		if (!isset($mkrStg)) {
			exit(0);
		}
	}
	

    $query = 'select *
                from ' . $map_prefix . 'marker_stg m
               where marker_stg_id = ' . $mkrStg . '
    ';
	//echo $query   . "\n";
    $result = @mysql_query($query) or die(mysql_error());

	$marker = (mysql_fetch_array($result, MYSQL_ASSOC));
	//print_r($marker);
	//echo "<BR><BR>";
	
	// ------------------- DELETE
	if ($marker['action'] == "DELETE") {
		$query = 'UPDATE ' . $map_prefix . 'marker
					 SET visible = 0
					   , last_updated = now()
				   WHERE marker_id = ' . $marker['marker_id'] . '
				     AND user_id = ' . $marker['user_id'] . '
		;';
		//echo $query   . '<BR>';
		
		$result = @mysql_query($query); // or die(mysql_error());
		$num = mysql_affected_rows();
		
		if ($result) {					 		
			$query = 'UPDATE ' . $map_prefix . 'marker_stg
						 SET end_effective_date = now() - 1
					   WHERE end_effective_date = \'3000-12-31 00:00:00\'
						 AND start_effective_date <> \'1800-01-01 00:00:00\'
						 AND marker_id = ' . $marker['marker_id'] . '
						 AND user_id = ' . $marker['user_id'] . '
						 AND marker_stg_id <> ' . $mkrStg . '
			;';
			//echo $query   . '<BR>';
		
			$result = @mysql_query($query); // or die(mysql_error());
			$num = mysql_affected_rows();
			
			if ($result) {					 		
				$query = 'UPDATE ' . $map_prefix . 'marker_stg
							 SET start_effective_date = now()
						   WHERE marker_stg_id = ' . $mkrStg . '
				;';
				//echo $query   . '<BR>';

				$result = @mysql_query($query); // or die(mysql_error());
				$num = mysql_affected_rows();
				
				if ($result) {				
					commit();	
					echo json_encode(array("success"=>true, "msg"=>"Approved"));
				} else {
					echo json_encode(array("success"=>false, "msg"=>mysql_error()));
					rollback();
				}
			} else {
				echo json_encode(array("success"=>false, "msg"=>mysql_error()));
				rollback();
			}
		} else {
			echo json_encode(array("success"=>false, "msg"=>mysql_error()));
			rollback();
		}				
		
	// -------------- MOVE
	} else if ($marker['action'] == "MOVE") {
		$query = 'UPDATE ' . $map_prefix . 'marker
					 SET x = ' . $marker['x'] . '
					   , y = ' . $marker['y'] . '
					   , last_updated = now()
				   WHERE marker_id = ' . $marker['marker_id'] . '
				     AND user_id = ' . $marker['user_id'] . '
		;';
		 //echo $query   . '<BR>';
		
		$result = @mysql_query($query); // or die(mysql_error());
		$num = mysql_affected_rows();
		
		if ($result) {					 
			$query = 'UPDATE ' . $map_prefix . 'marker_stg
						 SET end_effective_date = now() - 1
					   WHERE end_effective_date = \'3000-12-31 00:00:00\'
						 AND start_effective_date <> \'1800-01-01 00:00:00\'
						 AND marker_id = ' . $marker['marker_id'] . '
						 AND user_id = ' . $marker['user_id'] . '
						 AND marker_stg_id <> ' . $mkrStg . '						 
			;';
			//echo $query   . '<BR>';
			
			$result = @mysql_query($query); // or die(mysql_error());
			$num = mysql_affected_rows();
			
			
			if ($result) {					
				$query = 'UPDATE ' . $map_prefix . 'marker_stg
							 SET start_effective_date = now()
						   WHERE marker_stg_id = ' . $mkrStg . '
				;';
				//echo $query   . '<BR>';	

				$result = @mysql_query($query); // or die(mysql_error());
				$num = mysql_affected_rows();
				
				if ($result) {				
					commit();	
					echo json_encode(array("success"=>true, "msg"=>"Approved"));
				} else {
					echo json_encode(array("success"=>false, "msg"=>mysql_error()));
					rollback();
				}
			} else {
				echo json_encode(array("success"=>false, "msg"=>mysql_error()));
				rollback();
			}
		} else {
			echo json_encode(array("success"=>false, "msg"=>mysql_error()));
			rollback();
		}
	
	// ------------------- ADD
	} else if ($marker['action'] == "ADD") {
		$query = 'INSERT INTO ' . $map_prefix . 'marker (
							  map_id
							, marker_status_id
							, marker_category_id
							, user_id
							, name
							, description
							, x
							, y
							, visible
							, jump_marker_id
							, last_updated
							, overlay_id
							, global
					 ) SELECT map_id
							, marker_status_id
							, marker_category_id
							, user_id
							, name
							, description
							, x
							, y
							, visible
							, jump_marker_id
							, now()
							, overlay_id
							, global
						 FROM ' . $map_prefix . 'marker_stg
						WHERE marker_stg_id = ' . $mkrStg . ' 
					 ;';
		//echo $query   . '<BR>';					 
					 
		$result = @mysql_query($query); // or die(mysql_error());
		$num = mysql_affected_rows();
		
		if ($result) {
			$marker_id = mysql_insert_id();					 
					 
			$query = 'INSERT INTO ' . $map_prefix . 'marker_tab (
								  marker_id
								, marker_tab_status_id
								, user_id
								, tab_title
								, tab_text
								, tab_order
								, visible
						 ) SELECT ' . $marker_id . '
								, marker_tab_status_id
								, user_id
								, tab_title
								, tab_text
								, tab_order
								, visible
							 FROM ' . $map_prefix . 'marker_tab_stg
							WHERE marker_stg_id = ' . $mkrStg . '
						 ;';
			//echo $query   . '<BR>';

			$result = @mysql_query($query); // or die(mysql_error());
			$num = mysql_affected_rows();
			
			if ($result) {
				$query = 'UPDATE ' . $map_prefix . 'marker_stg
							 SET start_effective_date = now()
							   , marker_id = ' . $marker_id . '
						   WHERE marker_stg_id = ' . $mkrStg . '
				;';
				//echo $query   . '<BR>';
				
				$result = @mysql_query($query); // or die(mysql_error());
				$num = mysql_affected_rows();
				
				if ($result) {				
					commit();	
//					echo json_encode(array("success"=>true, "msg"=>"Approved"));
				} else {
//					echo json_encode(array("success"=>false, "msg"=>mysql_error()));
					rollback();
				}
			} else {
//				echo json_encode(array("success"=>false, "msg"=>mysql_error()));
				rollback();
			}
		} else {
//			echo json_encode(array("success"=>false, "msg"=>mysql_error()));
			rollback();
		}
	// ------------------- EDIT
	} else if ($marker['action'] == "EDIT") {
	
	
		// REMOVENDO TABs 
		$query = 'UPDATE ' . $map_prefix . 'marker_tab t
					SET t.visible = 0
				  WHERE t.marker_id = ' . $marker['marker_id'] . '
				    AND t.marker_tab_id NOT IN (SELECT coalesce(marker_tab_id,-1)
												  FROM ' . $map_prefix . 'marker_tab_stg s
												 WHERE marker_id = ' . $marker['marker_id'] . ')
		;';
		
		//echo $query  . '<BR>';				
	
					 
		$result = @mysql_query($query); // or die(mysql_error());
		$num = mysql_affected_rows();
		
		if ($result) {			
			// ATUALIZANDO EXISTENTES
			$query = 'UPDATE ' . $map_prefix . 'marker_tab t
					   INNER JOIN ' . $map_prefix . 'marker_tab_stg s
						  ON t.marker_tab_id = s.marker_tab_id
						SET t.tab_title = s.tab_title
						  , t.tab_text = s.tab_text
					  WHERE t.marker_id = ' . $marker['marker_id'] . '
			;';
			//echo $query  . '<BR>';
			
			$result = @mysql_query($query); // or die(mysql_error());
			$num = mysql_affected_rows();
			
			if ($result) {			
				// ATUALIZANDO NOVAS TABs
				$query = 'INSERT INTO ' . $map_prefix . 'marker_tab (
									  marker_id
									, marker_tab_status_id
									, user_id
									, tab_title
									, tab_text
									, tab_order
									, visible
							 ) SELECT ' . $marker['marker_id'] . '
									, marker_tab_status_id
									, user_id
									, tab_title
									, tab_text
									, tab_order
									, visible
								 FROM ' . $map_prefix . 'marker_tab_stg
								WHERE marker_stg_id = ' . $mkrStg . '
								  AND marker_tab_id is null
							 ;';
				//echo $query  . '<BR>';							 
				
				$result = @mysql_query($query); // or die(mysql_error());
				$num = mysql_affected_rows();
				
				if ($result) {		
					// Atualizando marcador no stg
					$query = 'UPDATE ' . $map_prefix . 'marker_stg
								 SET end_effective_date = now() - 1
							   WHERE end_effective_date = \'3000-12-31 00:00:00\'
								 AND start_effective_date <> \'1800-01-01 00:00:00\'
								 AND marker_id = ' . $marker['marker_id'] . ' 
								 AND user_id = ' . $marker['user_id'] . '
								 AND marker_stg_id <> ' . $mkrStg . '						 
					;';
					//echo $query  . '<BR>';							 
					
					$result = @mysql_query($query); // or die(mysql_error());
					$num = mysql_affected_rows();
					
					if ($result) {
						$query = 'UPDATE ' . $map_prefix . 'marker_stg
									 SET start_effective_date = now()
								   WHERE marker_stg_id = ' . $mkrStg . '
						;';
						//echo $query  . '<BR>';				
						
						$result = @mysql_query($query); // or die(mysql_error());
						$num = mysql_affected_rows();
						
						if ($result) {
							$query = 'UPDATE ' . $map_prefix . 'marker m
							           INNER JOIN ' . $map_prefix . 'marker_stg s
										  ON m.marker_id = s.marker_id
										 AND s.marker_stg_id = ' . $mkrStg . '
										 SET m.name = s.name
										   , m.description = s.description 
										   , m.global = s.global										   
										   , m.last_updated = now()
									   WHERE m.marker_id = ' . $marker['marker_id'] . '
										 AND m.user_id = ' . $marker['user_id'] . '
							;';
							//echo $query  . '<BR>';				
							
							$result = @mysql_query($query); // or die(mysql_error());
							$num = mysql_affected_rows();
							
							if ($result) {
								commit();
//								echo json_encode(array("success"=>true, "msg"=>"Approved"));														
							} else {
//								echo json_encode(array("success"=>false, "msg"=>mysql_error()));											
								rollback();
							}
						} else {
//							echo json_encode(array("success"=>false, "msg"=>mysql_error()));											
							rollback();
						}
					} else {
//						echo json_encode(array("success"=>false, "msg"=>mysql_error()));									
						rollback();
					}
				} else {
//					echo json_encode(array("success"=>false, "msg"=>mysql_error()));				
					rollback();
				}
			} else {
//				echo json_encode(array("success"=>false, "msg"=>mysql_error()));
				rollback();
			}
		} else {
//			echo json_encode(array("success"=>false, "msg"=>mysql_error()));
			rollback();
		}
		
	// ------------------- MULTUAL JUMP MARKER
	} else if ($marker['action'] == "ADD_MUTUAL_JUMPER") {
		$query = 'INSERT INTO ' . $map_prefix . 'marker (
							  map_id
							, marker_status_id
							, marker_category_id
							, user_id
							, name
							, description
							, x
							, y
							, visible
							, last_updated
							, overlay_id
							, global
					 ) SELECT map_id
							, marker_status_id
							, marker_category_id
							, user_id
							, name
							, description
							, x
							, y
							, visible
							, now()
							, overlay_id
							, global
						 FROM ' . $map_prefix . 'marker_stg
						WHERE marker_stg_id = ' . $mkrStg . ' 
					 ;';
		//echo $query   . '<BR>';					 
					 
		$result = @mysql_query($query); // or die(mysql_error());
		$num = mysql_affected_rows();

		if ($result) {
			$marker_id = mysql_insert_id();
			
			$query = 'INSERT INTO ' . $map_prefix . 'marker (
								  map_id
								, marker_status_id
								, marker_category_id
								, user_id
								, name
								, description
								, x
								, y
								, visible
								, jump_marker_id
								, last_updated
								, overlay_id
								, global
						 ) SELECT map_id
								, marker_status_id
								, marker_category_id
								, user_id
								, name
								, description
								, x
								, y
								, visible
								, ' . $marker_id . '
								, now()
								, overlay_id
								, global
							 FROM ' . $map_prefix . 'marker_stg
							WHERE jump_marker_id = ' . $mkrStg . ' 
							  AND action = \'ADD_MUTUAL_JUMPER\'
						 ;';
			//echo $query   . '<BR>';					 
						 
			$result = @mysql_query($query); // or die(mysql_error());
			$num = mysql_affected_rows();
			
			if ($result) {
				$marker_id2 = mysql_insert_id();
			
				$query = "update " . $map_prefix . "marker
							 set jump_marker_id = " . $marker_id2 . "
						   WHERE marker_id = " . $marker_id . "
							";
				//echo $query   . '<BR>';					 
							 
				$result = @mysql_query($query); // or die(mysql_error());
				$num = mysql_affected_rows();
			
				if ($result) {
					commit();
					echo json_encode(array("success"=>true, "msg"=>"Approved"));																	
				} else {
					echo json_encode(array("success"=>false, "msg"=>mysql_error()));											
					rollback();
				}
			} else {
				echo json_encode(array("success"=>false, "msg"=>mysql_error()));											
				rollback();
			}
		} else {
			echo json_encode(array("success"=>false, "msg"=>mysql_error()));											
			rollback();
		}
	// ------------------- SINGLE JUMP MARKER	
	} else if ($marker['action'] == "ADD_SINGLE_JUMPER") {
		echo 1;
		$query = 'INSERT INTO ' . $map_prefix . 'marker (
							  map_id
							, marker_status_id
							, marker_category_id
							, user_id
							, name
							, description
							, x
							, y
							, visible
							, last_updated
							, overlay_id
							, jump_marker_id
							, global
					 ) SELECT map_id
							, marker_status_id
							, marker_category_id
							, user_id
							, name
							, description
							, x
							, y
							, visible
							, now()
							, overlay_id
							, jump_marker_id
							, global
						 FROM ' . $map_prefix . 'marker_stg
						WHERE marker_stg_id = ' . $mkrStg . ' 
					 ;';
		echo $query   . '<BR>';					 
					 
		$result = @mysql_query($query); // or die(mysql_error());
		$num = mysql_affected_rows();
		
		if ($result) {
			commit();
//				echo json_encode(array("success"=>true, "msg"=>"Approved"));														
		} else {
//				echo json_encode(array("success"=>false, "msg"=>mysql_error()));											
			rollback();
		}
	
	}
?>
