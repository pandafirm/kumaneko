<?php
/*
* PandaFirm-PHP-Module "crosstab.php"
* Version: 1.9.2
* Copyright (c) 2020 Pandafirm LLC
* Distributed under the terms of the GNU Lesser General Public License.
* https://opensource.org/licenses/LGPL-2.1
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
		$this->fields=(!isset($this->body["fields"]))?$this->driver->fields($this->body["app"]):$this->body["fields"];
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
			$this->operator
		);
		if (!is_array($this->records)) $this->callrequesterror(500,$this->driver->queryerror());
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
			$departments=$this->driver->records("departments");
			$groups=$this->driver->records("groups");
			$users=$this->driver->records("users");
			$this->queries["columns"]=$this->createquery($this->body["column"],isset($this->body["timezone"])?$this->body["timezone"]:date_default_timezone_get());
			foreach ($this->queries["columns"] as $key=>$value)
			{
				$caption=strval($value["caption"]);
				switch ($value["type"])
				{
					case "creator":
					case "modifier":
					case "user":
						$filter=array_filter($users,function($values,$key) use ($caption){
							return $values["__id"]["value"]==$caption;
						},ARRAY_FILTER_USE_BOTH);
						if (count($filter)!=0) $caption=array_values($filter)[0]["name"]["value"];
						break;
					case "department":
						$filter=array_filter($departments,function($values,$key) use ($caption){
							return $values["__id"]["value"]==$caption;
						},ARRAY_FILTER_USE_BOTH);
						if (count($filter)!=0) $caption=array_values($filter)[0]["name"]["value"];
						break;
					case "group":
						$filter=array_filter($groups,function($values,$key) use ($caption){
							return $values["__id"]["value"]==$caption;
						},ARRAY_FILTER_USE_BOTH);
						if (count($filter)!=0) $caption=array_values($filter)[0]["name"]["value"];
						break;
				}
				if (array_key_exists($this->body["value"]["field"],$this->fields))
				{
					$this->response["fields"][]=(function($field,$key,$caption){
						$field["id"]=strval($key);
						$field["caption"]=$caption;
						$field["required"]=false;
						$field["nocaption"]=true;
						return $field;
					})($this->fields[$this->body["value"]["field"]],$key,$caption);
				}
				else
				{
					$this->response["fields"][]=[
						"id"=>strval($key),
						"type"=>"number",
						"caption"=>$caption,
						"required"=>false,
						"nocaption"=>true,
						"demiliter"=>true,
						"decimals"=>"0",
						"unit"=>"",
						"unitposition"=>"Suffix"
					];
				}
			}
			$this->response["records"]=$this->createrecords(0,$this->body["value"],$this->records,$users,$departments,$groups);
		}
		else $this->callrequesterror(500,"The field specified in the \"Column\" section is not registered with the server.");
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
			case "department":
			case "group":
			case "modifier":
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
		$queries=[];
		foreach ($values as $item)
			if (isset($item))
			{
				$query="";
				$item=preg_replace("/\"/u","\\\"",$item);
				switch ($this->fields[$arg_config["field"]]["type"])
				{
					case "checkbox":
					case "creator":
					case "department":
					case "dropdown":
					case "group":
					case "modifier":
					case "radio":
					case "user":
						$query=$arg_config["field"]." in (\"{$item}\")";
						break;
					case "date":
						if ($format=="") $query=$arg_config["field"]." = \"{$item}\"";
						else
						{
							$timezone=new DateTimeZone($arg_timezone);
							$date=new DateTime($item,$timezone);
							$item=$date->format($format);
							switch ($format)
							{
								case "Y":
									$query=$arg_config["field"]." >= \"{$item}-01-01\" and ".$arg_config["field"]." <= \"{$item}-12-31\"";
									break;
								case "Y-m":
									$query=$arg_config["field"]." >= \"{$item}-01\" and ";
									$date=new DateTime($item."-01",$timezone);
									$date->modify("1 month")->modify("-1 day");
									$query.=$arg_config["field"]." <= \"".$date->format("Y-m-d")."\"";
									break;
								case "Y-m-d":
									$query=$arg_config["field"]." = \"{$item}\"";
									break;
							}
						}
						break;
					case "createdtime":
					case "datetime":
					case "modifiedtime":
						$timezone=new DateTimeZone($arg_timezone);
						$date=new DateTime($item,$timezone);
						if ($format=="")
						{
							$item=$date->format("Y-m-d\TH:i");
							$query=$arg_config["field"]." >= \"{$item}:00Z\" and ".$arg_config["field"]." <= \"{$item}:59Z\"";
							$item=$date->modify(strval($timezone->getOffset($date))." second")->format("Y-m-d H:i");
						}
						else
						{
							$item=$date->modify(strval($timezone->getOffset($date))." second")->format($format);
							switch ($format)
							{
								case "Y":
									$date=new DateTime($item."-01-01",$timezone);
									$date->modify(strval($timezone->getOffset($date)*-1)." second");
									$query=$arg_config["field"]." >= \"".$date->format("Y-m-d\TH:i:s")."Z\" and ";
									$date->modify("1 year")->modify("-1 second");
									$query.=$arg_config["field"]." <= \"".$date->format("Y-m-d\TH:i:s")."Z\"";
									break;
								case "Y-m":
									$date=new DateTime($item."-01",$timezone);
									$date->modify(strval($timezone->getOffset($date)*-1)." second");
									$query=$arg_config["field"]." >= \"".$date->format("Y-m-d\TH:i:s")."Z\" and ";
									$date->modify("1 month")->modify("-1 second");
									$query.=$arg_config["field"]." <= \"".$date->format("Y-m-d\TH:i:s")."Z\"";
									break;
								case "Y-m-d":
									$date=new DateTime($item,$timezone);
									$date->modify(strval($timezone->getOffset($date)*-1)." second");
									$query=$arg_config["field"]." >= \"".$date->format("Y-m-d\TH:i:s")."Z\" and ";
									$date->modify("1 day")->modify("-1 second");
									$query.=$arg_config["field"]." <= \"".$date->format("Y-m-d\TH:i:s")."Z\"";
									break;
							}
						}
						break;
					case "id":
					case "number":
						$item=strval($item);
						$query=$arg_config["field"]." = ".strval($item);
						break;
					case "time":
						if ($format=="") $query=$arg_config["field"]." = \"{$item}\"";
						else
						{
							$item=explode(":",$item)[0];
							$query=$arg_config["field"]." >= \"{$item}:00\" and ".$arg_config["field"]." <= \"{$item}:59\"";
						}
						break;
					default:
						$query=$arg_config["field"]." = \"{$item}\"";
						break;
				}
				$key=(strval($item)!="")?strval($item):$arg_config["field"]."empty";
				$queries[$key]=["caption"=>$item,"query"=>$query,"type"=>$this->fields[$arg_config["field"]]["type"]];
			}
		$res=[];
		foreach($queries as $key=>$value) if (!in_array($key,$res)) $res[$key]=$value;
		if ($arg_config["sort"]=="asc") ksort($res);
		else krsort($res);
		return $res;
	}
	public function createrecords($arg_index,$arg_config,$arg_records,$arg_users,$arg_departments,$arg_groups)
	{
		$res=[];
		if (count($this->queries["rows"])>$arg_index)
		{
			$row=$this->queries["rows"][$arg_index];
			foreach ($row as $key=>$value)
			{
				$records=$this->driver->filter($arg_records,$this->fields,$value["query"],"");
				if (count($records)!=0)
				{
					$caption=strval($value["caption"]);
					switch ($value["type"])
					{
						case "creator":
						case "modifier":
						case "user":
							$filter=array_filter($arg_users,function($values,$key) use ($caption){
								return $values["__id"]["value"]==$caption;
							},ARRAY_FILTER_USE_BOTH);
							if (count($filter)!=0) $caption=array_values($filter)[0]["name"]["value"];
							break;
						case "department":
							$filter=array_filter($arg_departments,function($values,$key) use ($caption){
								return $values["__id"]["value"]==$caption;
							},ARRAY_FILTER_USE_BOTH);
							if (count($filter)!=0) $caption=array_values($filter)[0]["name"]["value"];
							break;
						case "group":
							$filter=array_filter($arg_groups,function($values,$key) use ($caption){
								return $values["__id"]["value"]==$caption;
							},ARRAY_FILTER_USE_BOTH);
							if (count($filter)!=0) $caption=array_values($filter)[0]["name"]["value"];
							break;
					}
					$cells=$this->createrecords($arg_index+1,$arg_config,$records,$arg_users,$arg_departments,$arg_groups);
					if (count($cells)!=0) $res[$key]=["caption"=>$caption,"rows"=>$cells];
				}
			}
		}
		else
		{
			foreach ($this->queries["columns"] as $key=>$value)
			{
				$records=$this->driver->filter($arg_records,$this->fields,$value["query"],"");
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
