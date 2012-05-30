<?php
/** 
* Filename: mysql2json.class.php 
* Purpose: Convert mysql resultset data into JSON(http://json.org) format
* Author: Adnan Siddiqi <kadnan@gmail.com> 
* License: PHP License 
* Date: Tuesday,June 21, 2006 
*
*/

class mysql2json{
    function getData($resultset){
        return json_encode($resultset);
    }


    function getJSON2($resultSet,$affectedRecords){
        $numberRows=0;
        $arrfieldName=array();
        $data=array();
        $i=0;
        $json="";
        $field="fields:[";

        while ($i < mysql_num_fields($resultSet))  {
            $meta = mysql_fetch_field($resultSet, $i);
            if (!$meta) {
            }else{
                $arrfieldName[$i]=$meta->name;
                $field .= "'".$meta->name."',";
            }
            $i++;
        }
        $field = substr($field, 0, strlen($field)-1) . '],';

        $i=0;
        $json="{".$field."\n\"data\": [\n";

        //$data[][];

        while($row=mysql_fetch_array($resultSet, MYSQL_NUM)) {
            $i++;
            //print("Ind ".$i."-$affectedRecords<br>");
            $json.="{\n";
            for($r=0;$r < count($arrfieldName);$r++) {
                $json.="\"$arrfieldName[$r]\" :	\"$row[$r]\"";
                if($r < count($arrfieldName)-1){
                    $json.=",\n";
                }else{
                    $json.="\n";
                }

                $datarow[$arrfieldName[$r]] = $row[$r];
//                if($r == 0)
//                    $datarow[$arrfieldName[$r]] = $row[$r];
//                else
//                    $datarow[$arrfieldName[$r]] = intval($row[$r])+20;
            }
            $data[$i-1] = $datarow;
            if($i!=$affectedRecords){
                $json.="\n},\n";
            }else{
                $json.="\n}\n";
            }
        }

        $json.="]\n}";
        //return json_encode($json);
        //return $json;

        $new['fields'] = $arrfieldName;
        $new['data'] = $data;
        //echo $arrfieldName;
        return json_encode($new);
    }

    function getJSON($resultSet,$affectedRecords){
        $numberRows=0;
        $arrfieldName=array();
        $i=0;
        $json="";
        $field="fields:[";
        
        //print("Test");
        while ($i < mysql_num_fields($resultSet))  {
            $meta = mysql_fetch_field($resultSet, $i);
            if (!$meta) {
            }else{
                $arrfieldName[$i]=$meta->name;
                $field .= "'".$meta->name."',";
            }
            $i++;
        }
        $field = substr($field, 0, strlen($field)-1) . '],';

        $i=0;
        $json="{".$field."\n\"data\": [\n";

        while($row=mysql_fetch_array($resultSet, MYSQL_NUM)) {
            $i++;
            //print("Ind ".$i."-$affectedRecords<br>");
            $json.="{\n";
            for($r=0;$r < count($arrfieldName);$r++) {
                $json.="\"$arrfieldName[$r]\" :	\"$row[$r]\"";
                if($r < count($arrfieldName)-1){
                    $json.=",\n";
                }else{
                    $json.="\n";
                }
            }

            if($i!=$affectedRecords){
                $json.="\n},\n";
            }else{
                $json.="\n}\n";
            }
        }

        $json.="]\n}";
        return json_encode($json);
        //return $json;
    }

    function getFlotData2($resultSet,$affectedRecords,$label){
        $data="{\n";
        $data.="label: '". $label . "',\n";

        $data.="data: [";
        while($row = mysql_fetch_array($resultSet)){
            $data .= '['.$row[0].', '.$row[1].'], ';
        }
        $data = substr($data, 0, strlen($data)-2) . ']';
        $data.="\n}";
        return json_encode($data);
    }

    function getFlotData($resultSet,$affectedRecords){
        $i=0;
        while($row = mysql_fetch_array($resultSet)){
            if($i==0){
                $json['label'] = $row[0];
            }
            $data[$i][0]= $row[1];
            $data[$i][1]= $row[2];
            $i++;
        }
        $json['data'] = $data;
        return json_encode($json);
    }

    function getFlotDataMultiSeries($resultSet,$affectedRecords){
        //get title row
        $row = mysql_fetch_array($resultSet);
        for($i=2;$i<count($row);$i++){
            $label[$i-2] = $row[$i];
        }

        $j=0;
        while($row = mysql_fetch_array($resultSet)){
            $label = $row[0];
            $axisX[$j] = $row[1];
            for($i=2;$i<count($row);$i++){
                $series[$i-2][$j] = $row[$i];
            }

            if($i==0){
                $json['label'] = $row[0];
            }
            $data[$j][0]= $row[1];
            $data[$j][1]= $row[2];
            $i++;
        }
        $json['data'] = $data;
        return json_encode($json);
    }
}
?>

