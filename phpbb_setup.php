<?php
    define('IN_PHPBB', true);
    $phpbb_root_path = (defined('PHPBB_ROOT_PATH')) ? PHPBB_ROOT_PATH : PHPBB_PATH_FROM_THIS_FILE;
    $phpEx = substr(strrchr(__FILE__, '.'), 1);
    include($phpbb_root_path . 'common.' . $phpEx);
    include('config.php');
  
  
    // Start session management
    $user->session_begin();
    $auth->acl($user->data);
    $user->setup();
    
    function is_logged_in(){
      global $user;
      return $user->data['is_registered'];
    }
    
    function get_username(){
      global $user;
      if(is_logged_in())
        return $user->data['username_clean'];
      else
        return 0;
    }
    
    function get_userid(){
      global $user;
      if(is_logged_in())
        return $user->data['user_id'];
      else
        return 0;
    }
    // Set map permissions on $user
    
    if(is_logged_in())
    {
      $permissions = mysql_query('
        SELECT u.*
        FROM map_user u
        WHERE u.map_user_id = ' . get_userid() . '
        LIMIT 1; 
      ');
      
      $user->data['map_permissions'] = (array) mysql_fetch_assoc($permissions);
    }
    //print_r($user);
?>
