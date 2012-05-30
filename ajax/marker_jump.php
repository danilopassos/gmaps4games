<?php
	include('../config.php');
    include('../class/mysql2json.class.php');
	
	session_start("map");
	begin();
	
    $query = "insert into " . $map_prefix . "log(log, log_date) values ( '" . print_r($_POST, true) . "', now())";
	//echo $query;
	@mysql_query($query); // or die(mysql_error());
	
	
	if (!is_numeric($_POST['x']) && !is_numeric($_POST['y']) && !is_numeric($_POST['map_id']) && !is_numeric($_POST['overlay_id']) && !is_numeric($_POST['category_id']) 
			&& !is_numeric($_POST['x2']) && !is_numeric($_POST['y2']) && !is_numeric($_POST['map_id2']) && !is_numeric($_POST['overlay_id2'])) {
		echo json_encode(array("success"=>false, "msg"=>"N&#227;o funcionar&#225;!"));
		exit();
	}
	if ($_SESSION['user_id'] != $_POST['user_id']) {
		echo json_encode(array("success"=>false, "msg"=>"N&#227;o funcionar&#225;!"));
		exit();	
	}	
	
	$reason = "ADD_MUTUAL_JUMPER";
	
	if (isset($_POST['marker_id2']) && $_POST['marker_id2'] != 0) {
		if (is_numeric($_POST['marker_id2'])) {
			$reason = "ADD_SINGLE_JUMPER";
		} else {
			echo json_encode(array("success"=>false, "msg"=>"N&#227;o funcionar&#225;!"));
			exit(0);
		}
	}
	
	if ($reason == "ADD_MUTUAL_JUMPER" ) {
		$query = "insert into " . $map_prefix . "marker_stg (
										   marker_id
										 , map_id
										 , marker_status_id
										 , marker_category_id
										 , user_id
										 , name
										 , description
										 , x
										 , y
										 , visible
										 , action
										 , insert_date
										 , reason
										 , overlay_id
								   ) VALUES (
										   null
										 , ".$_POST['map_id']."
										 , 1
										 , ".$_POST['category_id']."
										 , ".$_SESSION['user_id']."
										 , '" . addslashes(htmlentities(stripslashes($_POST['title']), ENT_QUOTES, "UTF-8")) . "'
										 , '" . addslashes(htmlentities(stripslashes($_POST['title']), ENT_QUOTES, "UTF-8")) . "'
										 , ".$_POST['x']."
										 , ".$_POST['y']."
										 , 1
										 , '" . $reason . "'
										 , now()
										 , '" . addslashes(htmlentities(stripslashes($_POST['reason']), ENT_QUOTES, "UTF-8")) . "'
										 , " . ($_POST['overlay_id'] == 0 ? "null" : $_POST['overlay_id'])  . "
								   )";

		//echo $query;
		$result = @mysql_query($query); // or die(mysql_error());
		$num = mysql_affected_rows();
		if ($result) {
			$marker_id = mysql_insert_id();
			
			$query = "insert into " . $map_prefix . "marker_stg (
											   marker_id
											 , map_id
											 , marker_status_id
											 , marker_category_id
											 , user_id
											 , name
											 , description
											 , x
											 , y
											 , visible
											 , action
											 , insert_date
											 , reason
											 , overlay_id
											 , jump_marker_id
									   ) VALUES (
											   null
											 , ".$_POST['map_id2']."
											 , 1
											 , ".$_POST['category_id']."
											 , ".$_SESSION['user_id']."
											 , '" . addslashes(htmlentities(stripslashes($_POST['title2']), ENT_QUOTES, "UTF-8")) . "'
											 , '" . addslashes(htmlentities(stripslashes($_POST['title2']), ENT_QUOTES, "UTF-8")) . "'
											 , ".$_POST['x2']."
											 , ".$_POST['y2']."
											 , 1
											 , '" . $reason . "'
											 , now()
											 , '" . addslashes(htmlentities(stripslashes($_POST['reason']), ENT_QUOTES, "UTF-8")) . "'
											 , " . ($_POST['overlay_id2'] == 0 ? "null" : $_POST['overlay_id2'])  . "
											 , " . $marker_id . "
									   )";
									   
			//echo $query;
			$result = @mysql_query($query); // or die(mysql_error());
			$num = mysql_affected_rows();
			
			if ($result) {
				$marker_id2 = mysql_insert_id();
						
				$query = "update " . $map_prefix . "marker_stg 
							 set jump_marker_id = " . $marker_id2 . "
						   WHERE marker_stg_id = " . $marker_id . "
							";
			
				//echo $query;
				$result = @mysql_query($query); // or die(mysql_error());
				$num = mysql_affected_rows();
				
				if ($result) {
					echo json_encode(array("success"=>true, "msg"=>"Marker inserted!"));
					commit();				
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
	} else {
		$query = "insert into " . $map_prefix . "marker_stg (
										   marker_id
										 , map_id
										 , marker_status_id
										 , marker_category_id
										 , user_id
										 , name
										 , description
										 , x
										 , y
										 , visible
										 , action
										 , insert_date
										 , reason
										 , overlay_id
										 , jump_marker_id
								   ) VALUES (
										   null
										 , ".$_POST['map_id']."
										 , 1
										 , ".$_POST['category_id']."
										 , ".$_SESSION['user_id']."
										 , '" . addslashes(htmlentities(stripslashes($_POST['title']), ENT_QUOTES, "UTF-8")) . "'
										 , '" . addslashes(htmlentities(stripslashes($_POST['title']), ENT_QUOTES, "UTF-8")) . "'
										 , ".$_POST['x']."
										 , ".$_POST['y']."
										 , 1
										 , '" . $reason . "'
										 , now()
										 , '" . addslashes(htmlentities(stripslashes($_POST['reason']), ENT_QUOTES, "UTF-8")) . "'
										 , " . ($_POST['overlay_id'] == 0 ? "null" : $_POST['overlay_id'])  . "
										 , " . $_POST['marker_id2'] . "
								   )";

		//echo $query;
		$result = @mysql_query($query); // or die(mysql_error());
		$num = mysql_affected_rows();
		if ($result) {
			$marker_id = mysql_insert_id();
			
			echo json_encode(array("success"=>true, "msg"=>"Marker inserted!"));
			commit();			
		} else {
			echo json_encode(array("success"=>false, "msg"=>mysql_error()));
			rollback();
		}
	}
	
	// REMOVE THIS IF NOT AUTO APPROVAL
	$mkrStg = $marker_id;
	include('admin_marker_approval.php');
?>