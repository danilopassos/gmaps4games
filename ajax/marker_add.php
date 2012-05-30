<?php
	include('../config.php');
    include('../class/mysql2json.class.php');
	
	session_start("map");
	begin();
	
    $query = "insert into " . $map_prefix . "log(log, log_date) values ( '" . print_r($_POST, true) . "', now())";
	//echo $query;
	@mysql_query($query); // or die(mysql_error());
	
	//$_POST['user_id'] = 25;
	
	if (!is_numeric($_POST['x']) && !is_numeric($_POST['y']) && !is_numeric($_POST['map_id']) && !is_numeric($_POST['category_id']) && !is_numeric($_POST['overlay_id'])) {
		echo json_encode(array("success"=>false, "msg"=>"N&#227;o funcionar&#225;!"));
		exit();
	}
	if (trim($_POST['action']) == "edit" && (!isset($_POST['id']) || !is_numeric($_POST['id']))) {
		echo json_encode(array("success"=>false, "msg"=>"N&#227;o funcionar&#225;!"));
		exit();		
	}
	if ($_SESSION['user_id'] != $_POST['user_id']) {
		echo json_encode(array("success"=>false, "msg"=>"N&#227;o funcionar&#225;!"));
		exit();	
	}	
	
	$max_tabs = $_POST['max_tab'] + 0;
	
	if (trim($_POST['action']) == "edit") {
		$action = "EDIT";		
		$marker_id = $_POST['id'];
		$reason = "Marker Edit";
	} else if (trim($_POST['action']) == "suggestion") {
		$action = "SUGGESTION";		
		$marker_id = $_POST['id'];
		$reason = "Marker Suggestion";
	} else if (trim($_POST['action']) == "add") {
		$action = "ADD";
		$marker_id = "null";
		$reason = "Marker Add";
	} else {
		echo json_encode(array("success"=>false, "msg"=>"Erro no action"));
		exit();
	}
	
    //----------------------------------------------------------//
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
									 , global
                               ) VALUES (
                                       ".$marker_id."
                                     , ".$_POST['map_id']."
                                     , 1
                                     , ".$_POST['category_id']."
                                     , ".$_SESSION['user_id']."
                                     , '" . addslashes(htmlentities(stripslashes($_POST['marker_title']), ENT_QUOTES, "UTF-8")) . "'
                                     , '" . addslashes(htmlentities(stripslashes($_POST['marker_title']), ENT_QUOTES, "UTF-8")) . "'
                                     , ".$_POST['x']."
                                     , ".$_POST['y']."
                                     , 1
                                     , '" . addslashes(htmlentities(stripslashes($action), ENT_QUOTES, "UTF-8")) . "'
                                     , now()
                                     , '" . addslashes(htmlentities(stripslashes($reason), ENT_QUOTES, "UTF-8")) . "'
									 , " . ($_POST['overlay_id'] == 0 ? "null" : $_POST['overlay_id']) . "
									 , " . (isset($_POST['global_marker']) && $_POST['global_marker'] == "on" ? 1 : 0) . "
                               )";

	//echo $query;
    $result = @mysql_query($query); // or die(mysql_error());
    $num = mysql_affected_rows();
    if ($result) {
    	$marker_id = mysql_insert_id();
    	$max_tabs = $_POST['max_tab'] + 1;
    	for ($i = 1; $i <= $max_tabs; $i++) {
			if ($action == "ADD") {
				if (!isset($_POST['tab' . $i . '_title']) || !isset($_POST['tab' . $i . '_text'])) {
					continue;
				} else {
					$tab_id = "null";
					$tab_text = $_POST['tab' . $i . '_text'];
				}
			} else if ($action == "EDIT") {
				// Se uma tab não possui título e corpo, é pq ela foi deletada.
				if (!isset($_POST['tab' . $i . '_title']) && !isset($_POST['tab' . $i . '_text'])) {
					continue;
				}
				// Se uma tab possui uma tab_id, significa que é um edit, e vai ser adicionada à tabela.
				if (isset($_POST['tab' . $i . '_id'])) {
					$tab_id = $_POST['tab' . $i . '_id'];
					if (trim($_POST['tab' . $i . '_text']) != "") {
						$tab_text = $_POST['tab' . $i . '_text'];
					} else {
						$tab_text = $_POST['tab' . $i . '_original_text'];
					}
				// Se uma tab não possui tab_id, significa q é uma nova tab, sendo adicionada à tabela.
				} else {
					$tab_id = "null";
					$tab_text = $_POST['tab' . $i . '_text'];
				}
			}
			
			//----------------------------------------------------------//
			$query = "insert into " . $map_prefix . "marker_tab_stg (
											   marker_stg_id
											 , marker_tab_id
											 , marker_tab_status_id
											 , user_id
											 , tab_title
											 , tab_text
											 , tab_order
											 , visible)
									   VALUES (
											   ".$marker_id."
											 , ".$tab_id."
											 , 1
											 , ".$_SESSION['user_id']."
											 , '" . addslashes(htmlentities(stripslashes($_POST['tab' . $i . '_title']), ENT_QUOTES, "UTF-8")) . "'
											 , '" . addslashes(htmlentities(stripslashes($tab_text), ENT_QUOTES, "UTF-8")) . "'
											 , 1
											 , 1)";	
			//echo $query;
			$result = @mysql_query($query); // or die(mysql_error());
			$num = mysql_affected_rows();										 
			
			if (!$result) {
				break;
			}
    	}
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
	
	// REMOVE THIS IF NOT AUTO APPROVAL
	$mkrStg = $marker_id;
	include('admin_marker_approval.php');
?>