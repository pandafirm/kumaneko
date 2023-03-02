<?php
/*
* PandaFirm-PHP-Module "gantt.php"
* Version: 1.2.4
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
		if (!isset($this->body["task"])) $this->callrequesterror(400);
		else
		{
			if (!is_array($this->body["task"])) $this->callrequesterror(400);
		}
		$this->fields=$this->driver->fields($this->body["app"]);
		$this->queries=[
			"columns"=>[],
			"record"=>(function($column,$task,$fields,$timezone){
				$res=[];
				if (array_key_exists($task["start"],$fields) && array_key_exists($task["end"],$fields))
				{
					$start=[
						"start"=>($column["period"]=="month")?new DateTime($column["starting"]."-01",$timezone):new DateTime($column["starting"],$timezone),
						"end"=>($column["period"]=="month")?new DateTime($column["starting"]."-01",$timezone):new DateTime($column["starting"],$timezone)
					];
					$end=[
						"start"=>($column["period"]=="month")?new DateTime($column["starting"]."-01",$timezone):new DateTime($column["starting"],$timezone),
						"end"=>($column["period"]=="month")?new DateTime($column["starting"]."-01",$timezone):new DateTime($column["starting"],$timezone)
					];
					switch ($column["period"])
					{
						case "month":
							$start["end"]->modify($column["limit"]." month");
							$end["end"]->modify($column["limit"]." month");
							break;
						case "day":
							$start["end"]->modify($column["limit"]." day");
							$end["end"]->modify($column["limit"]." day");
							break;
					}
					$start["end"]->modify("-1 day");
					$end["end"]->modify("-1 day");
					switch ($fields[$task["start"]]["type"])
					{
						case "date":
							$start["start"]=$start["start"]->format('Y-m-d');
							$start["end"]=$start["end"]->format('Y-m-d');
							break;
						case "createdtime":
						case "datetime":
						case "modifiedtime":
							$start["start"]=$start["start"]->modify(strval($timezone->getOffset($start["start"])*-1)." second")->format("Y-m-d\TH:i:s")."Z";
							$start["end"]=$start["end"]->modify("1 day")->modify("-1 second")->modify(strval($timezone->getOffset($start["end"])*-1)." second")->format("Y-m-d\TH:i:s")."Z";
							break;
					}
					switch ($fields[$task["end"]]["type"])
					{
						case "date":
							$end["start"]=$end["start"]->format('Y-m-d');
							$end["end"]=$end["end"]->format('Y-m-d');
							break;
						case "createdtime":
						case "datetime":
						case "modifiedtime":
							$end["start"]=$end["start"]->modify(strval($timezone->getOffset($end["start"])*-1)." second")->format("Y-m-d\TH:i:s")."Z";
							$end["end"]=$end["end"]->modify("1 day")->modify("-1 second")->modify(strval($timezone->getOffset($end["end"])*-1)." second")->format("Y-m-d\TH:i:s")."Z";
							break;
					}
					$res[]="(".$task["start"]." >= \"".$start["start"]."\" and ".$task["start"]." <= \"".$start["end"]."\")";
					$res[]="(".$task["end"]." >= \"".$end["start"]."\" and ".$task["end"]." <= \"".$end["end"]."\")";
					$res[]="(".$task["start"]." < \"".$start["start"]."\" and ".$task["end"]." > \"".$end["end"]."\")";
				}
				return (count($res)!=0)?"(".implode(" or ",$res).")":"";
			})(
				$this->body["column"],
				$this->body["task"],
				$this->fields,
				new DateTimeZone(isset($this->body["timezone"])?$this->body["timezone"]:date_default_timezone_get())
			),
			"rows"=>[]
		];
		$this->records=$this->driver->records(
			$this->body["app"],
			mb_convert_encoding($this->body["query"].(($this->queries["record"]!="")?(($this->body["query"]!="")?" and ":"").$this->queries["record"]:""),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),
			(array_key_exists($this->body["task"]["start"],$this->fields))?$this->body["task"]["start"]." asc":"",
			0,
			0,
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
		if (array_key_exists($this->body["task"]["start"],$this->fields) && array_key_exists($this->body["task"]["end"],$this->fields) && array_key_exists($this->body["task"]["title"],$this->fields))
		{
			$departments=$this->driver->records("departments");
			$groups=$this->driver->records("groups");
			$users=$this->driver->records("users");
			$this->queries["columns"]=(function($column,$task,$fields,$timezone){
				$res=[];
				for ($i=0;$i<intval($column["limit"]);$i++)
				{
					$start=($column["period"]=="month")?new DateTime($column["starting"]."-01",$timezone):new DateTime($column["starting"],$timezone);
					$end=($column["period"]=="month")?new DateTime($column["starting"]."-01",$timezone):new DateTime($column["starting"],$timezone);
					switch ($column["period"])
					{
						case "month":
							$start->modify("{$i} month");
							$end->modify(strval($i+1)." month")->modify("-1 day");
							break;
						case "day":
							$start->modify("{$i} day");
							$end->modify("{$i} day");
							break;
					}
					$key="_".$start->format("Ymd");
					$this->response["fields"][]=[
						"id"=>$key,
						"caption"=>($column["period"]=="month")?$start->format('m'):$start->format('d'),
						"subcaption"=>($column["period"]=="month")?((intval($start->format("m"))==1 || $i==0)?$start->format("Y"):""):((intval($start->format("d"))==1 || $i==0)?$start->format("m"):"")
					];
					switch ($fields[$task["start"]]["type"])
					{
						case "date":
							switch ($i)
							{
								case 0:
									$res[$key]=$task["start"]." <= \"".$end->format('Y-m-d')."\"";
									break;
								default:
									$res[$key]=$task["start"]." >= \"".$start->format('Y-m-d')."\" and ".$task["start"]." <= \"".$end->format('Y-m-d')."\"";
									break;
							}
							break;
						case "createdtime":
						case "datetime":
						case "modifiedtime":
							$start->modify(strval($timezone->getOffset($start)*-1)." second");
							$end->modify("1 day")->modify("-1 second")->modify(strval($timezone->getOffset($end)*-1)." second");
							switch ($i)
							{
								case 0:
									$res[$key]=$task["start"]." <= \"".$end->format("Y-m-d\TH:i:s")."Z\"";
									break;
								default:
									$res[$key]=$task["start"]." >= \"".$start->format("Y-m-d\TH:i:s")."Z\" and ".$task["start"]." <= \"".$end->format("Y-m-d\TH:i:s")."Z\"";
									break;
							}
							break;
					}
				}
				return $res;
			})(
				$this->body["column"],
				$this->body["task"],
				$this->fields,
				new DateTimeZone(isset($this->body["timezone"])?$this->body["timezone"]:date_default_timezone_get())
			);
			if (count($this->records)==0)
			{
				header("HTTP/1.1 200 OK");
				header('Content-Type: application/json; charset=utf-8');
				echo json_encode($this->response,JSON_UNESCAPED_UNICODE);
				exit(0);
			}
			$this->response["records"]=$this->createrecords(0,$this->records,$users,$departments,$groups);
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
	public function createrecords($arg_index,$arg_records,$arg_users,$arg_departments,$arg_groups)
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
					$cells=$this->createrecords($arg_index+1,$records,$arg_users,$arg_departments,$arg_groups);
					if (count($cells)!=0) $res[$key]=["caption"=>$caption,"rows"=>$cells];
				}
			}
		}
		else
		{
			$timezone=new DateTimeZone(isset($this->body["timezone"])?$this->body["timezone"]:date_default_timezone_get());
			$start=($this->body["column"]["period"]=="month")?new DateTime($this->body["column"]["starting"]."-01",$timezone):new DateTime($this->body["column"]["starting"],$timezone);
			$end=($this->body["column"]["period"]=="month")?new DateTime($this->body["column"]["starting"]."-01",$timezone):new DateTime($this->body["column"]["starting"],$timezone);
			switch ($this->body["column"]["period"])
			{
				case "month":
					$end->modify($this->body["column"]["limit"]." month")->modify("-1 day");
					break;
				case "day":
					$end->modify($this->body["column"]["limit"]." day")->modify("-1 day");
					break;
			}
			foreach ($this->queries["columns"] as $key=>$value)
			{
				$res[$key]=[];
				$source=array_values($this->driver->filter($arg_records,$this->fields,$value,""));
				if (isset($this->body["sort"]))
				{
					if ($this->body["sort"]!="")
					{
						$sorts=explode(",",$this->body["sort"]);
						$params=[];
						foreach ($sorts as $sort)
						{
							$sort=explode(" ",$sort);
							$params[]=array_column(array_column($source,trim($sort[0])),"value");
							if (count($sort)==1) $params[]=SORT_ASC;
							else $params[]=(strtolower(trim($sort[1]))=="desc")?SORT_DESC:SORT_ASC;
						}
						$params[]=&$source;
						call_user_func_array('array_multisort',$params);
					}
				}
				foreach ($source as $value)
				{
					$taskstart=new DateTime($value[$this->body["task"]["start"]]["value"],$timezone);
					$taskend=new DateTime($value[$this->body["task"]["end"]]["value"],$timezone);
					switch ($this->fields[$this->body["task"]["start"]]["type"])
					{
						case "createdtime":
						case "datetime":
						case "modifiedtime":
							$taskstart=new DateTime($taskstart->modify(strval($timezone->getOffset($taskstart))." second")->format("Y-m-d"),$timezone);
							break;
					}
					switch ($this->fields[$this->body["task"]["end"]]["type"])
					{
						case "createdtime":
						case "datetime":
						case "modifiedtime":
							$taskend=new DateTime($taskend->modify(strval($timezone->getOffset($taskend))." second")->format("Y-m-d"),$timezone);
							break;
					}
					if ($taskstart<$start) $taskstart=clone $start;
					if ($taskend>$end) $taskend=clone $end;
					if ($taskstart<$taskend)
					{
						switch ($this->body["column"]["period"])
						{
							case "month":
								$value["__taskspan"]=["value"=>((intval($taskend->format('Y'))*12+intval($taskend->format('m')))-(intval($taskstart->format('Y'))*12+intval($taskstart->format('m'))))+1];
								break;
							case "day":
								$value["__taskspan"]=["value"=>$taskend->diff($taskstart)->days+1];
								break;
						}
					}
					else $value["__taskspan"]=["value"=>1];
					$res[$key][]=$value;
				}
			}
		}
		return $res;
	}
}
$cls_request=new clsRequest();
$cls_request->checkmethod();
?>
