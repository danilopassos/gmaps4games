<?php
	include('../config.php');
    include('../class/mysql2json.class.php');
	
	session_start("map");
	begin();

    $query = "insert into " . $map_prefix . "log(log, log_date) values ( '" . print_r($_POST, true) . "', now())";
	//echo $query;
	@mysql_query($query); // or die(mysql_error());

	
	if (!is_numeric($_POST['marker_id']) && !is_numeric($_POST['user_id'])) {
		echo json_encode(array("success"=>false, "msg"=>"Não funcionará!"));
		exit();
	}
	if ($_SESSION['user_id'] != $_POST['user_id']) {
		echo json_encode(array("success"=>false, "msg"=>"Não funcionará!"));
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
						 , jump_marker_id
						 , action
						 , insert_date
						 , reason
				  ) SELECT marker_id
						 , map_id
						 , marker_status_id
						 , marker_category_id
						 , ".$_SESSION['user_id']."
						 , name
						 , description
						 , x
						 , y
						 , visible
						 , jump_marker_id
						 , 'DELETE'
						 , now()
						 , '".addslashes(htmlentities(stripslashes($_POST['reason']), ENT_QUOTES, "UTF-8")) . "'
					  FROM " . $map_prefix . "marker
					 WHERE marker_id = ".$_POST['marker_id']."
					   AND user_id = ".$_POST['user_id']."
			";

	//echo $query;
    $result = @mysql_query($query); // or die(mysql_error());
    $num = mysql_affected_rows();
    if($result){
		// REMOVE THIS IF NOT AUTO APPROVAL
		$marker_id = mysql_insert_id();
		
		echo json_encode(array("success"=>true, "msg"=>"Marker inserted!"));
		commit();
	} else {
		echo json_encode(array("success"=>false, "msg"=>mysql_error()));
		rollback();
	}

	
	// REMOVE THIS IF NOT AUTO APPROVAL	
	$mkrStg = $marker_id;
	include('admin_marker_approval.php');		
?>
