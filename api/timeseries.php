<?php
/*
* PandaFirm-PHP-Module "timeseries.php"
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
		if (!isset($this->body["values"])) $this->callrequesterror(400);
		else
		{
			if (!is_array($this->body["values"])) $this->callrequesterror(400);
		}
		if (intval((new DateTime($this->body["column"]["starting"],new DateTimeZone(isset($this->body["timezone"])?$this->body["timezone"]:date_default_timezone_get())))->format("d"))<29)
		{
			$this->fields=$this->driver->fields($this->body["app"]);
			$this->queries=[
				"columns"=>[],
				"record"=>(function($column,$fields,$previous,$timezone){
					$res="";
					if (array_key_exists($column["field"],$fields))
					{
						$start=new DateTime($column["starting"],$timezone);
						$end=new DateTime($column["starting"],$timezone);
						switch ($column["period"])
						{
							case "month":
								$end->modify("1 year");
								if ($previous) $start->modify("-1 year");
								break;
							case "day":
								$end->modify("1 month");
								if ($previous) $start->modify("-1 month");
								break;
						}
						$end->modify("-1 day");
						switch ($fields[$column["field"]]["type"])
						{
							case "date":
								$res=$column["field"]." >= \"".$start->format('Y-m-d')."\" and ".$column["field"]." <= \"".$end->format('Y-m-d')."\"";
								break;
							case "createdtime":
							case "datetime":
							case "modifiedtime":
								$start->modify(strval($timezone->getOffset($start)*-1)." second");
								$end->modify("1 day")->modify("-1 second")->modify(strval($timezone->getOffset($end)*-1)." second");
								$res=$column["field"]." >= \"".$start->format("Y-m-d\TH:i:s")."Z\" and ".$column["field"]." <= \"".$end->format("Y-m-d\TH:i:s")."Z\"";
								break;
						}
					}
					return $res;
				})(
					$this->body["column"],
					$this->fields,
					count(array_filter($this->body["values"],function($value){return preg_match("/^PP/u",$value["func"]);}))!=0,
					new DateTimeZone(isset($this->body["timezone"])?$this->body["timezone"]:date_default_timezone_get())
				)
			];
			$this->records=$this->driver->records(
				$this->body["app"],
				mb_convert_encoding($this->body["query"].(($this->queries["record"]!="")?(($this->body["query"]!="")?" and ":"").$this->queries["record"]:""),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),
				"",
				0,
				(isset($this->body["limit"]))?$this->body["limit"]:0,
				(isset($this->body["operator"]))?$this->body["operator"]:""
			);
			$this->response["fields"]=[
				[
					"id"=>"caption",
					"type"=>"text",
					"caption"=>"",
					"required"=>false,
					"nocaption"=>true,
					"format"=>"text"
				]
			];
			$this->response["records"]=[];
			$this->response["rows"]=[
				[
					"field"=>"caption"
				]
			];
			if (array_key_exists($this->body["column"]["field"],$this->fields))
			{
				$values=[];
				$this->queries["columns"]=$this->createquery($this->body["column"],isset($this->body["timezone"])?$this->body["timezone"]:date_default_timezone_get());
				function _IF($expression,$evaluates,$otherwise){
					return ($expression)?$evaluates:$otherwise;
				}
				function _AND(...$values){
					return array_reduce($values,function($a,$b){return $a && $b;},true);
				}
				function _OR(...$values){
					return array_reduce($values,function($a,$b){return $a || $b;},false);
				}
				function _CEIL($value,$precision=0){
					$value=ceil(($precision>0)?$value*(10**$precision):$value/(10**($precision*-1)));
					return ($precision>0)?$value/(10**$precision):$value*(10**($precision*-1));
				}
				function _CONCAT(...$values){
					return implode("",array_map(function($item){return strval($item);},$values));
				}
				function _FLOOR($value,$precision=0){
					$value=floor(($precision>0)?$value*(10**$precision):$value/(10**($precision*-1)));
					return ($precision>0)?$value/(10**$precision):$value*(10**($precision*-1));
				}
				function _FORMAT($value,$decimals=0){
					return number_format($value,$decimals);
				}
				function _ROUND($value,$precision=0){
					return round($value,$precision,($value>0)?PHP_ROUND_HALF_UP:PHP_ROUND_HALF_DOWN);
				}
				foreach ($this->queries["columns"] as $key=>$query)
				{
					$this->response["fields"][]=[
						"id"=>$key,
						"type"=>"text",
						"caption"=>$key,
						"required"=>false,
						"nocaption"=>true,
						"format"=>"text"
					];
					$values[$key]=$this->createvalues($this->body["values"],$query,$this->records,(isset($this->body["operator"]))?$this->body["operator"]:"");
				}
				set_error_handler(function(){
					throw new Exception('Formula Error!');
				});
				foreach ($this->body["rows"] as $row)
				{
					$record=[];
					foreach (array_keys($this->queries["columns"]) as $column)
					{
						try
						{
							$formula=preg_replace("/([^!><]{1})=/u","$1==",$row["formula"]);
							$record[$column]=eval("return ".preg_replace("/(IF\(|AND\(|OR\(|CEIL\(|CONCAT\(|FLOOR\(|FORMAT\(|ROUND\()/u",'_$1',preg_replace("/(F[0-9]+)/u",'$values[$column]["$1"]',$formula)).";");
						}
						catch (Exception $e)
						{
							$record[$column]=0;
						}
					}
					$this->response["records"][$row["caption"]]=["caption"=>$row["caption"],"rows"=>$record];
				}
				restore_error_handler();
			}
			else $this->callrequesterror(400);
		}
		else $this->callrequesterror(500,"Please specify a date less than 29 days.");
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
		$res=[];
		$timezone=new DateTimeZone($arg_timezone);
		switch ($arg_config["period"])
		{
			case "month":
				for ($i=0;$i<12;$i++)
				{
					$start=new DateTime($arg_config["starting"],$timezone);
					$end=new DateTime($arg_config["starting"],$timezone);
					$start->modify("{$i} month");
					$end->modify(strval($i+1)." month")->modify("-1 day");
					$key=(intval($start->format("m"))==1)?$start->format("Y-m"):$start->format("m");
					$res[$key]=array("current"=>"","previous"=>"");
					switch ($this->fields[$arg_config["field"]]["type"])
					{
						case "date":
							$res[$key]["current"]=$arg_config["field"]." >= \"".$start->format("Y-m-d")."\" and ";
							$res[$key]["current"].=$arg_config["field"]." <= \"".$end->format("Y-m-d")."\"";
							$start->modify("-1 year");
							$end->modify("-1 year");
							$res[$key]["previous"]=$arg_config["field"]." >= \"".$start->format("Y-m-d")."\" and ";
							$res[$key]["previous"].=$arg_config["field"]." <= \"".$end->format("Y-m-d")."\"";
							break;
						case "createdtime":
						case "datetime":
						case "modifiedtime":
							$start->modify(strval($timezone->getOffset($start)*-1)." second");
							$res[$key]["current"]=$arg_config["field"]." >= \"".$start->format("Y-m-d\TH:i:s")."Z\" and ";
							$end->modify("1 day")->modify("-1 second")->modify(strval($timezone->getOffset($end)*-1)." second");
							$res[$key]["current"].=$arg_config["field"]." <= \"".$end->format("Y-m-d\TH:i:s")."Z\"";
							$start->modify("-1 year");
							$end->modify("-1 year");
							$start->modify(strval($timezone->getOffset($start)*-1)." second");
							$res[$key]["previous"]=$arg_config["field"]." >= \"".$start->format("Y-m-d\TH:i:s")."Z\" and ";
							$end->modify("1 day")->modify("-1 second")->modify(strval($timezone->getOffset($end)*-1)." second");
							$res[$key]["previous"].=$arg_config["field"]." <= \"".$end->format("Y-m-d\TH:i:s")."Z\"";
							break;
					}
				}
				break;
			case "day":
				$start=new DateTime($arg_config["starting"],$timezone);
				$end=new DateTime($arg_config["starting"],$timezone);
				$end->modify("1 month");
				while ($start<$end)
				{
					$key=(intval($start->format("d"))==1)?$start->format("m-d"):$start->format("d");
					$res[$key]=array("current"=>"","previous"=>"");
					switch ($this->fields[$arg_config["field"]]["type"])
					{
						case "date":
							$res[$key]["current"]=$arg_config["field"]." = \"".$start->format("Y-m-d")."\"";
							$date=new DateTime($start->format("Y-m-d"),$timezone);
							$date->modify("-1 month");
							if ($date->format("d")!=$start->format("d")) $res[$key]["previous"]=$arg_config["field"]." = \"1900-01-01\"";
							else $res[$key]["previous"]=$arg_config["field"]." = \"".$date->format("Y-m-d")."\"";
							break;
						case "createdtime":
						case "datetime":
						case "modifiedtime":
							$date=new DateTime($start->format("Y-m-d"),$timezone);
							$date->modify(strval($timezone->getOffset($date)*-1)." second");
							$res[$key]["current"]=$arg_config["field"]." >= \"".$date->format("Y-m-d\TH:i:s")."Z\" and ";
							$date->modify("1 day")->modify("-1 second");
							$res[$key]["current"].=$arg_config["field"]." <= \"".$date->format("Y-m-d\TH:i:s")."Z\"";
							$date=new DateTime($start->format("Y-m-d"),$timezone);
							$date->modify("-1 month");
							$date->modify(strval($timezone->getOffset($date)*-1)." second");
							if ($date->format("d")!=$start->format("d")) $res[$key]["previous"]=$arg_config["field"]." = \"1900-01-01T00:00:00Z\"";
							else
							{
								$res[$key]["previous"]=$arg_config["field"]." >= \"".$date->format("Y-m-d\TH:i:s")."Z\" and ";
								$date->modify("1 day")->modify("-1 second");
								$res[$key]["previous"].=$arg_config["field"]." <= \"".$date->format("Y-m-d\TH:i:s")."Z\"";
							}
							break;
					}
					$start->modify("1 day");
				}
				break;
		}
		return $res;
	}
	public function createvalues($arg_config,$arg_query,$arg_records,$arg_operator)
	{
		$res=[];
		foreach ($arg_config as $value)
		{
			$records=$this->driver->filter(
				$arg_records,
				$this->fields,
				(($value["query"]!="")?$value["query"]." and ":"").(preg_match("/^PP/u",$value["func"])?$arg_query["previous"]:$arg_query["current"]),
				$arg_operator
			);
			if (substr($value["func"],-3)!="CNT")
			{
				$res[$value["id"]]=0;
				if (count($records)!=0)
					if (array_key_exists($value["field"],$this->fields))
					{
						$values=array_column(array_column($records,$value["field"]),"value");
						switch (substr($value["func"],-3))
						{
							case "SUM":
								$res[$value["id"]]=array_sum($values);
								break;
							case "AVG":
								$res[$value["id"]]=array_sum($values)/count($records);
								break;
							case "MAX":
								$res[$value["id"]]=max($values);
								break;
							case "MIN":
								$res[$value["id"]]=min($values);
								break;
						}
					}
			}
			else $res[$value["id"]]=count($records);
		}
		return $res;
	}
}
$cls_request=new clsRequest();
$cls_request->checkmethod();
?>
