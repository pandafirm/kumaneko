<?php
/*
* PandaFirm-PHP-Module "report_processing.php"
* Version: 1.3.11
* Copyright (c) 2020 Pandafirm LLC
* Distributed under the terms of the GNU Lesser General Public License.
* https://opensource.org/licenses/LGPL-2.1
*/
global $argv;
$config;
$departments;
$fields;
$groups;
$tables;
$users;
register_shutdown_function(function(){
	global $argv;
	$error=error_get_last();
	if ($error===null) return;
	file_put_contents("./report_processing_{$argv[1]}.error",$error["message"]);
	chmod("./report_processing_{$argv[1]}.error",0755);
	if (file_exists("./report_processing_{$argv[1]}.txt")) unlink("./report_processing_{$argv[1]}.txt");
});
require_once(dirname(__FILE__)."/lib/base.php");
require_once(dirname(__FILE__)."/lib/driver.php");
require_once(dirname(__FILE__)."/google/sheet.php");
function setupcell($arg_field,$arg_source)
{
	global $config,$departments,$groups,$users;
	$res="";
	switch ($arg_field["type"])
	{
		case "checkbox":
			$res=strip_tags(preg_replace("/<br[ \/].>/u","\n",implode(",",$arg_source[$arg_field["id"]]["value"])));
			break;
		case "creator":
		case "modifier":
		case "user":
			$res=[];
			foreach ($arg_source[$arg_field["id"]]["value"] as $value)
			{
				$filter=array_filter($users,function($values,$key) use ($value){
					return $values["__id"]["value"]==$value;
				},ARRAY_FILTER_USE_BOTH);
				if (count($filter)!=0) $res[]=array_values($filter)[0]["name"]["value"];
			}
			$res=implode(",",$res);
			break;
		case "department":
			$res=[];
			foreach ($arg_source[$arg_field["id"]]["value"] as $value)
			{
				$filter=array_filter($departments,function($values,$key) use ($value){
					return $values["__id"]["value"]==$value;
				},ARRAY_FILTER_USE_BOTH);
				if (count($filter)!=0) $res[]=array_values($filter)[0]["name"]["value"];
			}
			$res=implode(",",$res);
			break;
		case "group":
			$res=[];
			foreach ($arg_source[$arg_field["id"]]["value"] as $value)
			{
				$filter=array_filter($groups,function($values,$key) use ($value){
					return $values["__id"]["value"]==$value;
				},ARRAY_FILTER_USE_BOTH);
				if (count($filter)!=0) $res[]=array_values($filter)[0]["name"]["value"];
			}
			$res=implode(",",$res);
			break;
		case "lookup":
			$res=strip_tags(preg_replace("/<br[ \/].>/u","\n",$arg_source[$arg_field["id"]]["search"]));
			break;
		default:
			$res=strip_tags(preg_replace("/<br[ \/].>/u","\n",$arg_source[$arg_field["id"]]["value"]));
			break;
	}
	return $res;
}
function setuprow($arg_cells,$arg_rowindex,$arg_sheetindex)
{
	global $config,$fields,$tables;
	$res=[];
	foreach ($arg_cells as $cellindex=>$celldata)
	{
		$type="TEXT";
		if (isset($celldata->userEnteredFormat))
			if (isset($celldata->userEnteredFormat->numberFormat))
				$type=$celldata->userEnteredFormat->numberFormat->type;
		if (isset($celldata->userEnteredValue))
			if (isset($celldata->userEnteredValue->stringValue))
				if ($celldata->userEnteredValue->stringValue!="")
				{
					$cellvalue=$celldata->userEnteredValue->stringValue;
					foreach ($fields as $key=>$value)
						if (preg_match("/%{$key}%/u",$cellvalue))
						{
							$cellvalue=preg_replace_callback("/%{$key}%/u",function($matches) use (&$config,&$fields,&$tables,$value){
								$res="";
								if ($value["tableid"]!="")
								{
									if ($tables[$value["tableid"]][$value["id"]]["status"]!="complete")
									{
										$rows=$config["record"][$value["tableid"]]["value"];
										$tables[$value["tableid"]][$value["id"]]["index"]++;
										$tables[$value["tableid"]][$value["id"]]["status"]=($tables[$value["tableid"]][$value["id"]]["index"]==count($rows)-1)?"complete":"processing";
										$res=setupcell($value,$rows[$tables[$value["tableid"]][$value["id"]]["index"]]);
										$config["edited"]="table";
									}
								}
								else
								{
									$res=setupcell($value,$config["record"]);
									$config["edited"]="field";
								}
								return $res;
							},$cellvalue);
						}
					$cellvalue=strip_tags(preg_replace("/<br[ \/].>/u","\n",$cellvalue));
					switch ($type)
					{
						case 'DATE':
						case 'DATE_TIME':
						case 'TIME':
							if ($cellvalue!="")
							{
								try
								{
									$from=new DateTime('1899/12/30');
									$to=new DateTime($cellvalue);
									$rows=[["values"=>[["userEnteredValue"=>["numberValue"=>($to->format("U")-$from->format("U"))/(1000*60*60*24)]]]]];
								}
								catch (Exception $e)
								{
									$rows=[["values"=>[["userEnteredValue"=>["stringValue"=>$cellvalue]]]]];
								}
							}
							else $rows=[["values"=>[["userEnteredValue"=>["stringValue"=>$cellvalue]]]]];
							break;
						case 'NUMBER':
						case 'PERCENT':
						case 'CURRENCY':
						case 'SCIENTIFIC':
							$rows=[["values"=>[["userEnteredValue"=>(is_numeric($cellvalue))?["numberValue"=>floatval($cellvalue)]:["stringValue"=>$cellvalue]]]]];
							break;
						default:
							$rows=[["values"=>[["userEnteredValue"=>["stringValue"=>$cellvalue]]]]];
							break;
					}
					$res[]=[
						"updateCells"=>[
							"rows"=>$rows,
							"fields"=>"userEnteredValue",
							"range"=>[
								"sheetId"=>$arg_sheetindex,
								"startRowIndex"=>$arg_rowindex,
								"endRowIndex"=>$arg_rowindex+1,
								"startColumnIndex"=>$cellindex,
								"endColumnIndex"=>$cellindex+1
							]
						]
					];
				}
	}
	return $res;
}
function setupsheet($arg_sheet,$arg_last,$arg_id=0)
{
	global $config,$fields,$tables;
	$res=["delete"=>[],"update"=>[]];
	$rows=[];
	$config["edited"]="";
	if (is_array($arg_sheet->data))
		foreach ($arg_sheet->data as $data)
			if (is_array($data->rowData))
				foreach ($data->rowData as $rowindex=>$rowdata)
					if (property_exists($rowdata,"values"))
						if (is_array($rowdata->values)) $rows=array_merge($rows,setuprow($rowdata->values,$rowindex,$arg_sheet->properties->sheetId));
	if ($config["edited"]!="")
	{
		$res["update"]=array_merge($res["update"],$rows);
		$arg_id++;
	}
	else $res["delete"][]=["deleteSheet"=>["sheetId"=>$arg_sheet->properties->sheetId]];
	if ($arg_last)
		if ($config["edited"]=="table")
			foreach ($tables as $key=>$value)
				if (in_array("processing",array_column(array_values($value),"status"),true))
				{
					$res["update"][]=[
						"duplicateSheet"=>[
							"sourceSheetId"=>$arg_sheet->properties->sheetId,
							"insertSheetIndex"=>$arg_sheet->properties->index,
							"newSheetId"=>$arg_id,
							"newSheetName"=>$arg_sheet->properties->title.'_'.strval($arg_id)
						]
					];
					$arg_sheet->properties->index++;
					[$delete,$update]=setupsheet($arg_sheet,$arg_last,$arg_id);
					if (count($delete)!=0) $res["delete"]=array_merge($res["delete"],$delete);
					if (count($update)!=0) $res["update"]=array_merge($res["update"],$update);
					break;
				}
	return [$res["delete"],$res["update"]];
}
if (count($argv)>1)
{
	if (file_exists("./report_processing_{$argv[1]}.txt"))
	{
		$config=json_decode(mb_convert_encoding(file_get_contents("./report_processing_{$argv[1]}.txt"),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),true);
		try
		{
			$driver=new clsDriver(dirname(__FILE__)."/storage/json/",$config["timezone"]);
			$departments=$driver->records("departments");
			$groups=$driver->records("groups");
			$users=$driver->records("users");
			[$fields,$tables]=(function($fields){
				$res=[
					"fields"=>[],
					"tables"=>[]
				];
				foreach ($fields as $key=>$value)
					switch ($value["type"])
					{
						case "canvas":
						case "file":
						case "spacer":
							break;
						case "table":
							if (!array_key_exists($key,$res["tables"])) $res["tables"][$key]=[];
							foreach ($value["fields"] as $tablekey=>$tablevalue)
							{
								$tablevalue["tableid"]=$key;
								$res["fields"][$tablekey]=$tablevalue;
								$res["tables"][$key][$tablekey]=["index"=>-1,"status"=>"ready"];
							}
							break;
						default:
							$value["tableid"]="";
							$res["fields"][$key]=$value;
							break;
					}
				return [$res["fields"],$res["tables"]];
			})(json_decode(mb_convert_encoding(file_get_contents(dirname(__FILE__)."/storage/json/config.json"),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),true)["apps"]["user"][$config["app"]]["fields"]);
			$service=new clsSheet(
				dirname(__FILE__)."/storage/google/".$config["servicekey"],
				[
					clsSheet::SPREADSHEETS,
					clsSheet::DRIVE
				]
			);
			$response=$service->copy($config["spreadsheet"]);
			if ($response->id!="")
			{
				$fileid=$response->id;
				$response=$service->get($fileid,true);
				if ($response->spreadsheetId!="")
				{
					$requests=["delete"=>[],"update"=>[]];
					$sheets=[];
					foreach ($response->sheets as $sheet)
						if (in_array(strval($sheet->properties->sheetId),$config["template"],true)) $sheets[]=$sheet;
						else $requests["delete"][]=["deleteSheet"=>["sheetId"=>$sheet->properties->sheetId]];
					foreach ($sheets as $sheet)
					{
						[$delete,$update]=setupsheet($sheet,$sheet===end($sheets));
						if (count($delete)!=0) $requests["delete"]=array_merge($requests["delete"],$delete);
						if (count($update)!=0) $requests["update"]=array_merge($requests["update"],$update);
					}
					$response=$service->update($fileid,["requests"=>array_merge($requests["update"],$requests["delete"])]);
					if ($response->spreadsheetId!="")
					{
						$options=[
							"exportFormat=pdf",
							"format=pdf",
							"fzr=false",
							"fitw=true",
							"gridlines=false",
							"pagenum=UNDEFINED",
							"printtitle=false",
							"sheetnames=false",
							"portrait=".(($config["orientation"]=="portrait")?"true":"false"),
							"size=".$config["size"]
						];
						$response=$service->export($fileid,$options);
						file_put_contents(dirname(__FILE__)."/storage/report/{$argv[1]}.pdf",$response);
						$response=$service->delete($fileid);
					}
					else throw new Exception("Failed to update spreadsheet.");
				}
				else throw new Exception("Failed to get spreadsheet.");
			}
			else throw new Exception("Failed to copy spreadsheet.");
		}
		catch (Exception $e)
		{
			file_put_contents("./report_processing_{$argv[1]}.error",$e->getMessage());
		}
		finally
		{
			if (file_exists("./report_processing_{$argv[1]}.txt")) unlink("./report_processing_{$argv[1]}.txt");
		}
	}
}
exit(0);
?>
