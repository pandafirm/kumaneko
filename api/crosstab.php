<?php
/*
* PandaFirm-PHP-Module "crosstab.php"
* Version: 1.0
* Copyright (c) 2020 TIS
* Released under the MIT License.
* http://pandafirm.jp/license.txt
*/
require_once(dirname(__FILE__)."/lib/base.php");
require_once(dirname(__FILE__)."/lib/driver.php");
class clsRequest extends clsBase
{
	/* valiable */
	private $body;
	private $driver;
	private $fields;
	private $queries;
	private $records;
	private $response;
	/* constructor */
	public function __construct()
	{
		$this->fields=[];
		$this->queries=[];
		$this->records=[];
		$this->response=[];
	}
	/* methods */
	protected function GET()
	{
		$this->callrequesterror(400);
	}
	protected function POST()
	{
		$this->body=json_decode(mb_convert_encoding(file_get_contents('php://input'),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),true);
		$this->driver=new clsDriver(dirname(__FILE__)."/storage/json/",isset($this->body["timezone"])?$this->body["timezone"]:date_default_timezone_get());
		if (!isset($this->body["app"])) $this->callrequesterror(400);
		if (!isset($this->body["query"])) $this->callrequesterror(400);
		if (!isset($this->body["column"])) $this->callrequesterror(400);
		else
		{
			if (!is_array($this->body["column"])) $this->callrequesterror(400);
		}
		if (!isset($this->body["rows"])) $this->callrequesterror(400);
		else
		{
			if (!is_array($this->body["rows"])) $this->callrequesterror(400);
		}
		if (!isset($this->body["value"])) $this->callrequesterror(400);
		else
		{
			if (!is_array($this->body["value"])) $this->callrequesterror(400);
		}
		$this->fields=$this->driver->fields($this->body["app"]);
		$this->queries=[
			"columns"=>[],
			"rows"=>[]
		];
		$this->records=$this->driver->records(
			$this->body["app"],
			mb_convert_encoding($this->body["query"],'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),
			"",
			0,
			(isset($this->body["limit"]))?$this->body["limit"]:0,
			(isset($this->body["operator"]))?$this->body["operator"]:""
		);
		$this->response["fields"]=[];
		$this->response["records"]=[];
		$this->response["rows"]=$this->body["rows"];
		foreach ($this->body["rows"] as $row)
			if (array_key_exists($row["field"],$this->fields))
			{
				$this->response["fields"][]=[
					"id"=>$row["field"],
					"type"=>"text",
					"caption"=>$this->fields[$row["field"]]["caption"],
					"required"=>false,
					"nocaption"=>true,
					"format"=>"text"
				];
				$this->queries["rows"][]=$this->createquery($row,isset($this->body["timezone"])?$this->body["timezone"]:date_default_timezone_get());
			}
			else $this->callrequesterror(400);
		if (array_key_exists($this->body["column"]["field"],$this->fields))
		{
			$this->queries["columns"]=$this->createquery($this->body["column"],isset($this->body["timezone"])?$this->body["timezone"]:date_default_timezone_get());
			foreach (array_keys($this->queries["columns"]) as $column)
				if (array_key_exists($this->body["value"]["field"],$this->fields))
				{
					$this->response["fields"][]=(function($field,$column){
						$field["id"]=$column;
						$field["caption"]=$column;
						$field["required"]=false;
						$field["nocaption"]=true;
						return $field;
					})($this->fields[$this->body["value"]["field"]],$column);
				}
				else
				{
					$this->response["fields"][]=[
						"id"=>$column,
						"type"=>"number",
						"caption"=>$column,
						"required"=>false,
						"nocaption"=>true,
						"demiliter"=>true,
						"decimals"=>"0",
						"unit"=>"",
						"unitposition"=>"Suffix"
					];
				}
			$this->response["records"]=$this->createrecords(0,$this->body["value"],$this->records);
		}
		else $this->callrequesterror(400);
		header("HTTP/1.1 200 OK");
		header('Content-Type: application/json; charset=utf-8');
		echo json_encode($this->response,JSON_UNESCAPED_UNICODE);
		exit(0);
	}
	protected function PUT()
	{
		$this->callrequesterror(400);
	}
	protected function DELETE()
	{
		$this->callrequesterror(400);
	}
	public function createquery($arg_config,$arg_timezone)
	{
		$values=array_column(array_column($this->records,$arg_config["field"]),($this->fields[$arg_config["field"]]["type"]=="lookup")?"search":"value");
		switch ($this->fields[$arg_config["field"]]["type"])
		{
			case "checkbox":
			case "creator":
			case "group":
			case "modifier":
			case "organization":
			case "user":
				$values=array_unique(call_user_func_array("array_merge",$values));
				break;
			default:
				$values=array_unique($values);
				break;
		}
		switch ($arg_config["format"])
		{
			case "year":
				$format="Y";
				break;
			case "month":
				$format="Y-m";
				break;
			case "day":
				$format="Y-m-d";
				break;
			case "hour":
				$format="H";
				break;
			default:
				$format="";
				break;
		}
		$res=[];
		foreach ($values as $item)
			if (isset($item))
			{
				switch ($this->fields[$arg_config["field"]]["type"])
				{
					case "checkbox":
					case "creator":
					case "dropdown":
					case "group":
					case "modifier":
					case "organization":
					case "radio":
					case "user":
						$res[$item]=$arg_config["field"]." in (\"{$item}\")";
						break;
					case "date":
						if ($format=="") $res[$item]=$arg_config["field"]." = \"{$item}\"";
						else
						{
							$timezone=new DateTimeZone($arg_timezone);
							$date=new DateTime($item,$timezone);
							$item=$date->format($format);
							switch ($format)
							{
								case "Y":
									$res[$item]=$arg_config["field"]." >= \"{$item}-01-01\" and ".$arg_config["field"]." <= \"{$item}-12-31\"";
									break;
								case "Y-m":
									$res[$item]=$arg_config["field"]." >= \"{$item}-01\" and ";
									$date=new DateTime($item."-01",$timezone);
									$date->modify("1 month")->modify("-1 day");
									$res[$item].=$arg_config["field"]." <= \"".$date->format("Y-m-d")."\"";
									break;
								case "Y-m-d":
									$res[$item]=$arg_config["field"]." = \"{$item}\"";
									break;
							}
						}
						break;
					case "createdtime":
					case "datetime":
					case "modifiedtime":
						$timezone=new DateTimeZone($arg_timezone);
						$date=new DateTime($item,$timezone);
						if ($format=="") $res[$date->modify(strval($timezone->getOffset($date))." second")->format("Y-m-d H:i")]=$arg_config["field"]." = \"{$item}\"";
						else
						{
							$item=$date->modify(strval($timezone->getOffset($date))." second")->format($format);
							switch ($format)
							{
								case "Y":
									$date=new DateTime($item."-01-01",$timezone);
									$date->modify(strval($timezone->getOffset($date)*-1)." second");
									$res[$item]=$arg_config["field"]." >= \"".$date->format("Y-m-d\TH:i:s")."Z\" and ";
									$date->modify("1 year")->modify("-1 second");
									$res[$item].=$arg_config["field"]." <= \"".$date->format("Y-m-d\TH:i:s")."Z\"";
									break;
								case "Y-m":
									$date=new DateTime($item."-01",$timezone);
									$date->modify(strval($timezone->getOffset($date)*-1)." second");
									$res[$item]=$arg_config["field"]." >= \"".$date->format("Y-m-d\TH:i:s")."Z\" and ";
									$date->modify("1 month")->modify("-1 second");
									$res[$item].=$arg_config["field"]." <= \"".$date->format("Y-m-d\TH:i:s")."Z\"";
									break;
								case "Y-m-d":
									$date=new DateTime($item,$timezone);
									$date->modify(strval($timezone->getOffset($date)*-1)." second");
									$res[$item]=$arg_config["field"]." >= \"".$date->format("Y-m-d\TH:i:s")."Z\" and ";
									$date->modify("1 day")->modify("-1 second");
									$res[$item].=$arg_config["field"]." <= \"".$date->format("Y-m-d\TH:i:s")."Z\"";
									break;
							}
						}
						break;
					case "number":
						$res[strval($item)]=$arg_config["field"]." = ".strval($item);
						break;
					case "time":
						if ($format=="") $res[$item]=$arg_config["field"]." = \"{$item}\"";
						else
						{
							$item=explode(":",$item)[0];
							$res[$item]=$arg_config["field"]." >= \"{$item}:00\" and ".$arg_config["field"]." <= \"{$item}:59\"";
						}
						break;
					default:
						$res[$item]=$arg_config["field"]." = \"{$item}\"";
						break;
				}
			}
		$res=array_unique($res);
		if ($arg_config["sort"]=="asc") ksort($res);
		else krsort($res);
		return $res;
	}
	public function createrecords($arg_index,$arg_config,$arg_records)
	{
		$res=[];
		if (count($this->queries["rows"])>$arg_index)
		{
			$row=$this->queries["rows"][$arg_index];
			foreach ($row as $key=>$value)
			{
				$records=$this->driver->filter($arg_records,$this->fields,$value,"");
				if (count($records)!=0)
				{
					$cells=$this->createrecords($arg_index+1,$arg_config,$records);
					if (count($cells)!=0) $res[$key]=$cells;
				}
			}
		}
		else
		{
			foreach ($this->queries["columns"] as $key=>$value)
			{
				$records=$this->driver->filter($arg_records,$this->fields,$value,"");
				if ($arg_config["func"]!="CNT")
				{
					$res[$key]="";
					if (count($records)!=0)
						if (array_key_exists($arg_config["field"],$this->fields))
						{
							$values=array_column(array_column($records,$arg_config["field"]),"value");
							switch ($arg_config["func"])
							{
								case "SUM":
									$res[$key]=array_sum($values);
									break;
								case "AVG":
									$res[$key]=array_sum($values)/count($records);
									break;
								case "MAX":
									$res[$key]=max($values);
									break;
								case "MIN":
									$res[$key]=min($values);
									break;
							}
						}
				}
				else $res[$key]=count($records);
			}
		}
		return $res;
	}
}
$cls_request=new clsRequest();
$cls_request->checkmethod();
?>
