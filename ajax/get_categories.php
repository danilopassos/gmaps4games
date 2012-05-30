<?php
	include('../config.php');
    include('../class/mysql2json.class.php');

	session_start("map");
    
    $query = 'select marker_category_id
				   , marker_category_parent_id
				   , name
				   , default_checked as checked
				   , marker_category_type_id
				   , img
                from ' . $map_prefix . 'marker_category c
               where c.map_container_id = ' . $_GET["map_container"] . '
				 and visible = 1
               order by marker_category_parent_id desc, marker_category_id asc;
    ';
    $result = @mysql_query($query) or die(mysql_error());

    $mysql2json = new mysql2json();
    
    $num = mysql_affected_rows();
    echo $mysql2json->getJSON2($result, $num);
?>
