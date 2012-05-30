<?php
	include('../config.php');
    include('../class/mysql2json.class.php');

	session_start("map");
	//echo $_SESSION["map_container"];
    $query = 'select max(last_updated) as last_updated
                from ' . $map_prefix . 'marker m
				   , ' . $map_prefix . 'map mp
               where m.map_id = mp.map_id
				 and mp.map_container_id = ' . $_GET["map_container"] . '
				 and m.last_updated > \'' . $_SESSION["last_updated"] . '\';
    ';
	//echo $query . "\n";
    $result = @mysql_query($query) or die(mysql_error());
	
	$row = mysql_fetch_array($result, MYSQL_ASSOC);
	
	if ($row['last_updated'] != $_SESSION["last_updated"]
			&& $row['last_updated'] != "") {
		$temp = $row['last_updated'];
	} else {
		exit("[]");
	}	
	
	$query = "SET SESSION group_concat_max_len = 4294967295";
	$result = @mysql_query($query);
	
    $query = 'select m.marker_id
                   , m.map_id
                   , m.marker_category_id
                   , c.marker_category_type_id
                   , m.user_id as user_id
                   , u.username as user_name
                   , m.name
                   , m.description
                   , m.x
                   , m.y
                   , m.jump_marker_id
				   , GROUP_CONCAT(coalesce(t.marker_tab_id,\'\') ORDER BY t.marker_tab_id asc SEPARATOR \'<|>\') as tab_id
                   , GROUP_CONCAT(coalesce(t.tab_title,\'\') ORDER BY t.marker_tab_id asc SEPARATOR \'<|>\') as tab_title
                   , GROUP_CONCAT(coalesce(t.tab_text, \'\') ORDER BY t.marker_tab_id asc SEPARATOR \'<|>\') as tab_text
				   , GROUP_CONCAT(coalesce(t.user_id, \'\') ORDER BY t.marker_tab_id asc SEPARATOR \'<|>\') as tab_user_id
				   , GROUP_CONCAT(coalesce(t.username, \'\') ORDER BY t.marker_tab_id asc SEPARATOR \'<|>\') as tab_user_name
				   , m.visible
				   , m.overlay_id
				   , m.global
                from ' . $map_prefix . 'marker m
                left outer join (SELECT c.marker_tab_id
				                      , c.tab_title
									  , c.tab_text
									  , c.user_id
									  , u2.username
									  , c.marker_id
								   FROM ' . $map_prefix . 'marker_tab c
								   LEFT OUTER JOIN ' . $forum_prefix . 'users u2
								     ON c.visible = 1
									AND c.user_id = u2.user_id 
				   ) t
                  on m.marker_id = t.marker_id
                   , ' . $map_prefix . 'marker_category c
				   , ' . $map_prefix . 'map mp
				   , ' . $forum_prefix . 'users u   
               where c.marker_category_id = m.marker_category_id
				 and m.map_id = mp.map_id
				 and mp.map_container_id = ' . $_SESSION["map_container"] . '
				 and m.user_id = u.user_id
				 
				 and ((m.visible = 1 and m.last_updated > \'' . $_SESSION["last_updated"] . '\')
				  OR  (m.visible = 0 and \'' . $_SESSION["last_updated"] . '\' != \'1800-01-01 00:00:00\' and m.last_updated > \'' . $_SESSION["last_updated"] . '\'))
                 /*and m.last_updated > \'' . $_SESSION["last_updated"] . '\'*/
               group by m.marker_id;
    ';
	//echo $query . "\n";
    $result = @mysql_query($query) or die(mysql_error());

	$res = array();
	while ($row = mysql_fetch_array($result, MYSQL_ASSOC)) {
		$row["tab_title"] = html_entity_decode($row["tab_title"], ENT_QUOTES, "UTF-8");
		$row["tab_text"] = html_entity_decode($row["tab_text"], ENT_QUOTES, "UTF-8");
		$row["name"] = html_entity_decode($row["name"], ENT_QUOTES, "UTF-8");
		$row["description"] = html_entity_decode($row["description"], ENT_QUOTES, "UTF-8");
		$res[] = $row;
	}
    $mysql2json = new mysql2json();
    
    //$num = mysql_affected_rows();
    echo json_encode($res);
	
	$_SESSION["last_updated"] = $temp;
?>
