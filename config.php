<?php
	// LOCAL
	if ($_SERVER['SERVER_ADDR'] == "127.0.0.1") {		
		$dbms = 'mysql';
		$dbhost = 'localhost';
		$dbport = '';
		$dbname = 'zelda';
		$dbuser = 'root';
		$dbpasswd = '';	
		
		$map_prefix = "map_";
		$forum_prefix = "forum2_";
	// LIVE SERVER
	} else {
		$dbms = 'mysql';
		$dbhost = '';
		$dbport = '';
		$dbname = '';
		$dbuser = '';
		$dbpasswd = '';
		
		$map_prefix = "map_";
		$forum_prefix = "forum2_";
	}
	
    $connection = mysql_connect($dbhost, $dbuser, $dbpasswd) or die('Problemas de conexão com o banco.');
    mysql_select_db ($dbname, $connection) or die('Problemas de conexão com o banco.');
    mysql_query("SET NAMES 'utf8'");
    mysql_query('SET character_set_connection=utf8');
    mysql_query('SET character_set_client=utf8');
    mysql_query('SET character_set_results=utf8');
	
	function begin() {
		@mysql_query("BEGIN");
	}
	
	function commit() {
		@mysql_query("COMMIT");
	}
	
	function rollback()	{
		@mysql_query("ROLLBACK");
	}		
?>