<?php
/*
* PandaFirm-PHP-Module "config_processing.php"
* Version: 1.3.1
* Copyright (c) 2020 Pandafirm LLC
* Distributed under the terms of the GNU Lesser General Public License.
* https://opensource.org/licenses/LGPL-2.1
*/
global $argv;
register_shutdown_function(function(){
	$error=error_get_last();
	if ($error===null) return;
	file_put_contents("./config_processing.error",$error["message"]);
	chmod("./config_processing.error",0755);
	if (file_exists("./config_processing.txt")) unlink("./config_processing.txt");
});
function shave($arg_record,$arg_fields)
{
	$keys=array_keys($arg_record);
	foreach ($keys as $key)
		if (array_key_exists($key,$arg_fields))
		{
			switch ($arg_fields[$key]["type"])
			{
				case "table":
					foreach ($arg_record[$key]["value"] as $index=>$value) $arg_record[$key]["value"][$index]=shave($value,$arg_fields[$key]["fields"]);
					break;
			}
		}
		else
		{
			switch ($key)
			{
				case "__autonumber":
					$arg_record[$key]=["value"=>""];
					break;
				case "__creator":
				case "__createdtime":
				case "__id":
				case "__modifier":
				case "__modifiedtime":
				case "__row_rel":
				case "__row_uid":
					break;
				default:
					unset($arg_record[$key]);
					break;
			}
		}
	return $arg_record;
}
function grow($arg_record,$arg_fields)
{
	foreach ($arg_fields as $key=>$value)
	{
		switch ($arg_fields[$key]["type"])
		{
			case "autonumber":
			case "creator":
			case "createdtime":
			case "id":
			case "modifier":
			case "modifiedtime":
			case "spacer":
				break;
			case "checkbox":
			case "department":
			case "file":
			case "group":
			case "user":
				if (!array_key_exists($key,$arg_record)) $arg_record[$key]=["value"=>[]];
				break;
			case "lookup":
				if (!array_key_exists($key,$arg_record)) $arg_record[$key]=["search"=>"","value"=>null];
				break;
			case "number":
				if (!array_key_exists($key,$arg_record)) $arg_record[$key]=["value"=>null];
				break;
			case "radio":
				if (!array_key_exists($key,$arg_record)) $arg_record[$key]=["value"=>$arg_fields[$key]["options"][0]["option"]["value"]];
				break;
			case "table":
				if (array_key_exists($key,$arg_record))
				{
					foreach ($arg_record[$key]["value"] as $index=>$value) $arg_record[$key]["value"][$index]=grow($value,$arg_fields[$key]["fields"]);
				}
				else
				{
					if (!array_key_exists($key,$arg_record))
					{
						$arg_record[$key]=["value"=>[]];
						$arg_record[$key]["value"][]=grow([],$arg_fields[$key]["fields"]);
					}
				}
				break;
			default:
				if (!array_key_exists($key,$arg_record)) $arg_record[$key]=["value"=>""];
				break;
		}
	}
	return $arg_record;
}
if (count($argv)>1)
{
	$file=dirname(__FILE__)."/storage/json/config.json";
	if (file_exists($file))
	{
		try
		{
			file_put_contents("./config_processing.txt","");
			$config=json_decode(mb_convert_encoding(file_get_contents($file),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),true);
			$file=dirname(__FILE__)."/storage/json/$argv[1].json";
			if (file_exists($file))
			{
				if (array_key_exists($argv[1],$config["apps"]["user"]))
				{
					$fields=$config["apps"]["user"][$argv[1]]["fields"];
					$records=json_decode(mb_convert_encoding(file_get_contents($file),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),true);
					foreach ($records as $key=>$value) $records[$key]=shave($value,$fields);
					foreach ($records as $key=>$value) $records[$key]=grow($value,$fields);
					file_put_contents($file,json_encode($records));
				}
				else throw new Exception("{$argv[1]} not found in Configuration file");
			}
		}
		catch (Exception $e)
		{
			file_put_contents("./config_processing.error",$e->getMessage());
		}
		finally
		{
			if (file_exists("./config_processing.txt")) unlink("./config_processing.txt");
		}
	}
}
exit(0);
?>
