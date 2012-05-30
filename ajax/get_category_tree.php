<?php

    //----------------------------------------------------------//
	include('../config.php');
    include('../class/mysql2json.class.php');

    $arr_treeview = array();

	session_start("map");
	
	$map_container = $_GET["map_container"];
	
    $query = 'select *
			    from ' . $map_prefix . 'marker_category 
			   where marker_category_parent_id is null
			     and map_container_id = ' . $map_container . '
				 and visible = 1
			   order by marker_category_id
			  ';
			   
    $result = @mysql_query($query) or die(mysql_error());

    while ($row = mysql_fetch_array($result)) {
        $arr_child = array();
        $node['text'] = $row['name'];
		$node['iconCls'] = 'icnMrkr icnMrkr' . $row['marker_category_id'];
		$node['collapsedCls'] = $node['iconCls'];
        $node['checked'] = $row['default_checked'] == 1 ? true : false;
		$node['expanded'] = true;
		
		$node['id'] = $row['marker_category_id'];

        $query = 'select * 
				    from ' . $map_prefix . 'marker_category 
				   where marker_category_parent_id = ' . $row['marker_category_id'] . '
					 and map_container_id = ' . $map_container . '
				     and visible = 1
				   order by marker_category_id
				  ';
					 
        $result2 = mysql_query($query);
        if($result2){
            while ($row2 = mysql_fetch_array($result2)) {
                $children['text'] = $row2['name'];
                $children['id'] = $row2['marker_category_id'];
                $children['leaf'] = true;
                $children['checked'] = $row2['default_checked'] == 1 ? true : false;
				$children['iconCls'] = "icnMrkr icnMrkr" . $row2['marker_category_id'];
				$children['collapsedCls'] = $children['iconCls'];
                array_push($arr_child, $children);
            }
            $node['children'] = $arr_child;
        }
        array_push($arr_treeview, $node);
    }


    $mysql2json = new mysql2json();
    
    echo json_encode($arr_treeview);
?>
