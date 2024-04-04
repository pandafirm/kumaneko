<?php
/*
* PandaFirm-PHP-Module "driver.php"
* Version: 1.6.1
* Copyright (c) 2020 Pandafirm LLC
* Distributed under the terms of the GNU Lesser General Public License.
* https://opensource.org/licenses/LGPL-2.1
*/
class clsDriver
{
	/* valiable */
	private $dir;
	private $operator;
	private $resulterror;
	private $resultid;
	private $resultcount;
	private $resultnumbers;
	private $timezone;
	private $users;
	/* constructor */
	public function __construct($arg_dir,$arg_timezone)
	{
		$this->dir=$arg_dir;
		chmod($this->dir,0755);
		$this->timezone=$arg_timezone;
		$this->users=(file_exists($this->dir."users.json"))?json_decode(mb_convert_encoding(file_get_contents($this->dir."users.json"),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),true):[];
	}
	/* autonumber */
	public function autonumbers()
	{
		return $this->resultnumbers;
	}
	/* assign */
	public function assign($arg_destination,$arg_source,$arg_fields,$arg_tables,$arg_parent="")
	{
		$continue=false;
		$lookups=[];
		foreach ($arg_fields as $key=>$value)
		{
			switch ($arg_fields[$key]["type"])
			{
				case "checkbox":
				case "file":
					if (array_key_exists($key,$arg_source)) $arg_destination[$key]=["value"=>$arg_source[$key]["value"]];
					else
					{
						if (!array_key_exists($key,$arg_destination)) $arg_destination[$key]=["value"=>[]];
					}
					break;
				case "creator":
				case "createdtime":
				case "id":
				case "modifier":
				case "modifiedtime":
				case "spacer":
					break;
				case "department":
				case "group":
				case "user":
					if (array_key_exists($key,$arg_source)) $arg_destination[$key]=["value"=>array_map("strval",$arg_source[$key]["value"])];
					else
					{
						if (!array_key_exists($key,$arg_destination)) $arg_destination[$key]=["value"=>[]];
					}
					break;
				case "lookup":
					if (array_key_exists($key,$arg_source))
					{
						if (array_key_exists("lookup",$arg_source[$key]))
							if ($arg_source[$key]["lookup"]===true)
							{
								$lookups[$key]=$arg_fields[$key];
								break;
							}
						$arg_destination[$key]=["search"=>$arg_source[$key]["search"],"value"=>($arg_source[$key]["value"]=="")?null:intval($arg_source[$key]["value"])];
					}
					else
					{
						if (!array_key_exists($key,$arg_destination)) $arg_destination[$key]=["search"=>"","value"=>null];
					}
					break;
				case "number":
					if (array_key_exists($key,$arg_source)) $arg_destination[$key]=["value"=>($arg_source[$key]["value"]=="")?null:floatval($arg_source[$key]["value"])];
					else
					{
						if (!array_key_exists($key,$arg_destination)) $arg_destination[$key]=["value"=>null];
					}
					break;
				case "radio":
					if (array_key_exists($key,$arg_source)) $arg_destination[$key]=["value"=>($arg_source[$key]["value"]=="")?$arg_fields[$key]["options"][0]["option"]["value"]:$arg_source[$key]["value"]];
					else
					{
						if (!array_key_exists($key,$arg_destination)) $arg_destination[$key]=["value"=>$arg_fields[$key]["options"][0]["option"]["value"]];
					}
					break;
				case "table":
					if (array_key_exists($key,$arg_source))
					{
						$uid=array_reduce($arg_source[$key]["value"],function($result,$current){
							if (array_key_exists("__row_uid",$current))
								if (preg_match("/^[0-9]+$/u",$current["__row_uid"]["value"]))
									if ($result<intval($current["__row_uid"]["value"])) $result=intval($current["__row_uid"]["value"]);
							return $result;
						},-1)+1;
						$arg_rows=[];
						foreach ($arg_source[$key]["value"] as $row)
						{
							if (!array_key_exists("__row_rel",$row)) $row["__row_rel"]=["value"=>""];
							if (!array_key_exists("__row_uid",$row))
							{
								$row["__row_uid"]=["value"=>strval($uid)];
								$uid++;
							}
							[$arg_row,$arg_tables]=$this->assign([],$row,$arg_fields[$key]["fields"],$arg_tables,$key);
							$arg_rows[]=$arg_row;
						}
						$arg_destination[$key]=["value"=>$arg_rows];
					}
					else
					{
						if (!array_key_exists($key,$arg_destination))
						{
							[$arg_row,$arg_tables]=$this->assign([],["__row_rel"=>["value"=>""],"__row_uid"=>["value"=>"0"]],$arg_fields[$key]["fields"],$arg_tables,$key);
							$arg_destination[$key]=["value"=>[$arg_row]];
						}
					}
					break;
				default:
					if (array_key_exists($key,$arg_source)) $arg_destination[$key]=["value"=>$arg_source[$key]["value"]];
					else
					{
						if (!array_key_exists($key,$arg_destination)) $arg_destination[$key]=["value"=>""];
					}
					break;
			}
		}
		if (array_key_exists("__row_rel",$arg_source)) $arg_destination["__row_rel"]=["value"=>$arg_source["__row_rel"]["value"]];
		if (array_key_exists("__row_uid",$arg_source)) $arg_destination["__row_uid"]=["value"=>$arg_source["__row_uid"]["value"]];
		foreach ($lookups as $lookup)
		{
			$clear=true;
			$rel=$arg_parent.((array_key_exists("__row_uid",$arg_source))?$arg_source["__row_uid"]["value"]:"")."_".$lookup["id"];
			$source=$this->record($lookup["app"],$arg_source[$lookup["id"]]["value"]);
			if (is_array($source))
			{
				if (array_values($source)!==$source)
				{
					$arg_destination[$lookup["id"]]=["search"=>$source[$lookup["search"]]["value"],"value"=>($arg_source[$lookup["id"]]["value"]=="")?null:intval($arg_source[$lookup["id"]]["value"])];
					foreach ($lookup["mapping"] as $key=>$value)
					{
						if (array_key_exists($key,$source))
							if (array_key_exists($value,$arg_fields))
								switch ($arg_fields[$value]["type"])
								{
									case "lookup":
										if (!array_key_exists($value,$lookups))
										{
											$arg_destination[$value]=["lookup"=>true,"value"=>($source[$key]["value"]=="")?null:floatval($source[$key]["value"])];
											$continue=true;
										}
										break;
									case "number":
										$arg_destination[$value]=["value"=>($source[$key]["value"]=="")?null:floatval($source[$key]["value"])];
										break;
									default:
										$arg_destination[$value]=["value"=>$source[$key]["value"]];
										break;
								}
					}
					foreach ($lookup["table"] as $value)
					{
						if (array_key_exists($value["id"]["internal"],$arg_tables)) $arg_tables[$value["id"]["internal"]][$rel]=[];
						else
						{
							$arg_tables[$value["id"]["internal"]]=[];
							$arg_tables[$value["id"]["internal"]][$rel]=[];
						}
						if (array_key_exists($value["id"]["external"],$source))
						{
							$fields=$this->fields($lookup["app"])[$value["id"]["external"]]["fields"];
							$query=implode(" and ",array_values(array_filter(explode(" and ",$lookup["query"]),function($query) use ($fields){
								$res=false;
								if (preg_match("/^([^!><= ]+|(?:(?!(?:not match|match|not in|in|not like|like).)*))[ ]*([!><=]+|not match|match|not in|in|not like|like)[ ]*(.*)$/u",$query,$matches))
									$res=array_key_exists($matches[1],$fields);
								return $res;
							})));
							$rows=array_values($this->filter($source[$value["id"]["external"]]["value"],$fields,$query,$this->operator));
							foreach ($rows as $row)
							{
								$arg_tables[$value["id"]["internal"]][$rel][]=(function($row,$fields){
									$res=[];
									foreach ($fields as $field)
										if (array_key_exists($field["external"],$row)) $res[$field["internal"]]=["value"=>$row[$field["external"]]["value"]];
									return $res;
								})($row,$value["fields"]);
							}
						}
					}
					$clear=false;
				}
			}
			if ($clear)
			{
				$arg_destination[$lookup["id"]]=["search"=>"","value"=>null];
				foreach ($lookup["mapping"] as $key=>$value)
				{
					if (array_key_exists($value,$arg_fields))
						switch ($arg_fields[$value]["type"])
						{
							case "checkbox":
							case "department":
							case "file":
							case "group":
							case "user":
								$arg_destination[$value]=["value"=>[]];
								break;
							case "lookup":
								if (!array_key_exists($value,$lookups))
								{
									$arg_destination[$value]=["lookup"=>true,"search"=>"","value"=>null];
									$continue=true;
								}
								break;
							case "number":
								$arg_destination[$value]=["value"=>null];
								break;
							default:
								$arg_destination[$value]=["value"=>""];
								break;
						}
				}
				foreach ($lookup["table"] as $value)
				{
					if (!array_key_exists($value["id"]["internal"],$arg_tables)) $arg_tables[$value["id"]["internal"]]=[];
					$arg_tables[$value["id"]["internal"]][$rel]=[];
				}
			}
		}
		if ($continue) [$arg_destination,$arg_tables]=$this->assign($arg_destination,$arg_destination,$arg_fields,$arg_tables,$arg_parent);
		return [$arg_destination,$arg_tables];
	}
	/* attach */
	public function attach(&$arg_destination,$arg_fields,$arg_tables)
	{
		$continue=false;
		foreach ($arg_tables as $key=>$value)
			if (array_key_exists($key,$arg_destination))
			{
				$rels=array_keys($value);
				$arg_destination[$key]["value"]=array_values(array_filter($arg_destination[$key]["value"],function($row) use ($rels){
					return !in_array($row["__row_rel"]["value"],$rels);
				}));
				if (count($arg_destination[$key]["value"])!=0)
					if (!(function($row,$fields){
						$res=false;
						foreach ($row as $key=>$value)
						{
							switch ($key)
							{
								case "__row_rel":
									if ($value["value"]!="") $res=true;
									break;
								case "__row_uid":
									break;
								default:
									if ($value["value"]!=null)
									{
										if ($fields[$key]["type"]=="radio")
										{
											if ($value["value"]!=$fields[$key]["options"][0]["option"]["value"]) $res=true;
										}
										else
										{
											switch (gettype($value["value"]))
											{
												case "array":
													if (count($value["value"])!=0) $res=true;
													break;
												case "double":
												case "integer":
													if (strval($value["value"])!="") $res=true;
													break;
												case "string":
													if ($value["value"]!="") $res=true;
													break;
											}
										}
									}
									break;
							}
						}
						return $res;
					})(end($arg_destination[$key]["value"]),$arg_fields[$key]["fields"])) array_pop($arg_destination[$key]["value"]);
				$uid=array_reduce($arg_destination[$key]["value"],function($result,$current){
					if (preg_match("/^[0-9]+$/u",$current["__row_uid"]["value"]))
						if ($result<intval($current["__row_uid"]["value"])) $result=intval($current["__row_uid"]["value"]);
					return $result;
				},-1);
				foreach ($value as $rel=>$rows)
					foreach ($rows as $row)
					{
						$uid++;
						$arg_destination[$key]["value"][]=(function($destination,$source,$fields,&$continue){
							foreach ($fields as $field)
								if (array_key_exists($field["id"],$source))
									switch ($field["type"])
									{
										case "lookup":
											$destination[$field["id"]]=["lookup"=>true,"value"=>($source[$field["id"]]["value"]=="")?null:floatval($source[$field["id"]]["value"])];
											$continue=true;
											break;
										case "number":
											$destination[$field["id"]]=["value"=>($source[$field["id"]]["value"]=="")?null:floatval($source[$field["id"]]["value"])];
											break;
										default:
											$destination[$field["id"]]=["value"=>$source[$field["id"]]["value"]];
											break;
									}
							return $destination;
						})($this->assign([],["__row_rel"=>["value"=>$rel],"__row_uid"=>["value"=>strval($uid)]],$arg_fields[$key]["fields"],[],$key)[0],$row,$arg_fields[$key]["fields"],$continue);
					}
			}
		return $continue;
	}
	/* build */
	public function build($arg_destination,$arg_source,$arg_fields,$arg_records)
	{
		$continue=false;
		[$arg_destination,$arg_tables]=$this->assign($arg_destination,$arg_source,$arg_fields,[]);
		$continue=$this->attach($arg_destination,$arg_fields,$arg_tables);
		while ($continue)
		{
			[$arg_destination,$arg_tables]=$this->assign($arg_destination,$arg_destination,$arg_fields,[]);
			$continue=$this->attach($arg_destination,$arg_fields,$arg_tables);
		}
		foreach ($arg_fields as $key=>$value)
			if ($arg_fields[$key]["type"]=="table")
				if (array_key_exists($key,$arg_destination))
					$arg_destination[$key]["value"]=array_values(array_filter($arg_destination[$key]["value"],function($row) use ($arg_destination){
						$res=true;
						if (preg_match("/^(field_[0-9]+_)([0-9]+)_field_[0-9]+_$/u",$row["__row_rel"]["value"],$matches))
						{
							if (!array_key_exists($matches[1],$arg_destination)) $res=false;
							else $res=in_array($matches[2],array_column(array_column($arg_destination[$matches[1]]["value"],"__row_uid"),"value"));
						}
						return $res;
					}));
		if (array_key_exists("__autonumber",$arg_fields))
		{
			$fixed=$arg_fields["__autonumber"]["fixed"];
			$prefix=(function($destination,$fields){
				$res="";
				foreach ($fields["__autonumber"]["group"] as $group)
					if (array_key_exists($group,$fields))
						if (!is_null($destination[$group]["value"]))
							switch ($fields[$group]["type"])
							{
								case "id":
								case "number":
									$res.=strval($destination[$group]["value"]);
									break;
								default:
									$res.=$destination[$group]["value"];
									break;
							}
				return $res;
			})($arg_destination,$arg_fields);
			if (!preg_match("/^{$prefix}[0-9]{{$fixed}}$/u",$arg_destination["__autonumber"]["value"]))
			{
				$query="__autonumber like \"^{$prefix}[0-9]{{$fixed}}$\"";
				if (array_key_exists("__id",$arg_source))
					if (preg_match("/^[0-9]+$/u",$arg_source["__id"]["value"]))
						$query.=" and __id != {$arg_source["__id"]["value"]}";
				$filters=array_values($this->filter($arg_records,$arg_fields,$query,""));
				if (count($filters)!=0)
				{
					$params=[];
					$params[]=array_column(array_column($filters,"__autonumber"),"value");
					$params[]=SORT_DESC;
					$params[]=&$filters;
					call_user_func_array('array_multisort',$params);
					$increment=intval(($prefix)?preg_replace("/^{$prefix}/u","",$filters[0]["__autonumber"]["value"]):$filters[0]["__autonumber"]["value"]);
					$increment++;
					$arg_destination["__autonumber"]=["value"=>$prefix.sprintf("%0".$fixed."d",$increment)];
				}
				else $arg_destination["__autonumber"]=["value"=>$prefix.sprintf("%0".$fixed."d",1)];
			}
		}
		else $arg_destination["__autonumber"]=["value"=>""];
		return $arg_destination;
	}
	/* deduplications */
	public function deduplications($arg_file)
	{
		$file=$this->dir."config.json";
		if (file_exists($file))
		{
			$source=json_decode(mb_convert_encoding(file_get_contents($file),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),true);
			if (is_array($source))
			{
				$deduplications=null;
				if (array_key_exists($arg_file,$source["apps"]["user"])) $deduplications=$source["apps"]["user"][$arg_file]["deduplications"];
				if (array_key_exists($arg_file,$source["apps"]["system"])) $deduplications=$source["apps"]["system"][$arg_file]["deduplications"];
				if (!is_array($deduplications)) throw new Exception("{$arg_file} not found in Configuration file");
				return $deduplications;
			}
			else throw new Exception("Configuration file not found");
		}
		else throw new Exception("Configuration file not found");
	}
	/* delete */
	public function delete($arg_file,$arg_id="")
	{
		$file=$this->dir."{$arg_file}.json";
		try
		{
			$this->lock($arg_file);
			if ($arg_id=="")
			{
				$this->resulterror="You should specified ID for Delete";
				return false;
			}
			else
			{
				if (is_numeric($arg_id))
				{
					$arg_id=strval($arg_id);
					if (file_exists($file))
					{
						$source=json_decode(mb_convert_encoding(file_get_contents($file),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),true);
						if (is_array($source))
						{
							if (array_key_exists($arg_id,$source)) unset($source[$arg_id]);
							if (!is_array($source)) $source=[];
						}
						else $source=[];
						file_put_contents($file,json_encode($source));
						return true;
					}
					else
					{
						$this->resulterror="File does not exist";
						return false;
					}
				}
				else
				{
					$this->resulterror="ID must be specified numerically";
					return false;
				}
			}
		}
		catch (Exception $e)
		{
			$this->resulterror=$e->getMessage();
			return false;
		}
		finally
		{
			$this->unlock($arg_file);
		}
	}
	public function deletes($arg_file,$arg_query="",$arg_operator="")
	{
		$file=$this->dir."{$arg_file}.json";
		try
		{
			$this->lock($arg_file);
			if ($arg_query=="")
			{
				$this->resulterror="You should specified Key for Delete or use Trucate Function";
				return false;
			}
			else
			{
				if (file_exists($file))
				{
					$source=json_decode(mb_convert_encoding(file_get_contents($file),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),true);
					if (is_array($source))
					{
						$filters=$this->filter($source,$this->fields($arg_file),$arg_query,$arg_operator);
						foreach ($filters as $key=>$value) unset($source[$key]);
						if (!is_array($source)) $source=[];
					}
					else $source=[];
					file_put_contents($file,json_encode($source));
					return true;
				}
				else
				{
					$this->resulterror="File does not exist";
					return false;
				}
			}
		}
		catch (Exception $e)
		{
			$this->resulterror=$e->getMessage();
			return false;
		}
		finally
		{
			$this->unlock($arg_file);
		}
	}
	public function truncate($arg_file)
	{
		$file=$this->dir."{$arg_file}.json";
		try
		{
			$this->lock($arg_file);
			if (file_exists($file))
			{
				file_put_contents($file,json_encode([]));
				return true;
			}
			else
			{
				$this->resulterror="File does not exist";
				return false;
			}
		}
		catch (Exception $e)
		{
			$this->resulterror=$e->getMessage();
			return false;
		}
		finally
		{
			$this->unlock($arg_file);
		}
	}
	/* fields */
	public function fields($arg_file)
	{
		$file=$this->dir."config.json";
		if (file_exists($file))
		{
			$source=json_decode(mb_convert_encoding(file_get_contents($file),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),true);
			if (is_array($source))
			{
				$fields=null;
				if (array_key_exists($arg_file,$source["apps"]["user"])) $fields=$source["apps"]["user"][$arg_file]["fields"];
				if (array_key_exists($arg_file,$source["apps"]["system"])) $fields=$source["apps"]["system"][$arg_file]["fields"];
				if (!is_array($fields)) throw new Exception("{$arg_file} not found in Configuration file");
				return $fields;
			}
			else throw new Exception("Configuration file not found");
		}
		else throw new Exception("Configuration file not found");
	}
	/* filter */
	public function filter($arg_source,$arg_fields,$arg_query,$arg_operator)
	{
		set_error_handler(function($arg_errno,$arg_errstr,$arg_errfile,$arg_errline){throw new \ParseError();});
		$fields=$arg_fields;
		$query=$arg_query;
		$me=$this;
		try
		{
			if ($query!="")
			{
				foreach ($fields as $key=>$value)
				{
					switch ($fields[$key]["type"])
					{
						case "checkbox":
						case "department":
						case "group":
							$query=preg_replace(
								"/{$key}[ ]+(not in|in)[ ]+\(([^\)]*)\)/u",
								'$me->FILTER_MULTIPLE($record["'.$key.'"]["value"],"$1",[$2])',
								$query
							);
							break;
						case "creator":
						case "createdtime":
						case "id":
						case "modifier":
						case "modifiedtime":
						case "spacer":
							break;
						case "datetime":
							if (preg_match("/{$key}[ ]*([!><=]+)[ ]*TODAY\(\)/u",$query))
							{
								$query=preg_replace(
									"/{$key}[ ]*>[ ]*TODAY\(\)/u",
									'$record["'.$key.'"]["value"] >= FROM_TODAY("1","day","datetime")',
									$query
								);
								$query=preg_replace(
									"/{$key}[ ]*>=[ ]*TODAY\(\)/u",
									'$record["'.$key.'"]["value"] >= TODAY("datetime")',
									$query
								);
								$query=preg_replace(
									"/{$key}[ ]*<[ ]*TODAY\(\)/u",
									'$record["'.$key.'"]["value"] < TODAY("datetime")',
									$query
								);
								$query=preg_replace(
									"/{$key}[ ]*<=[ ]*TODAY\(\)/u",
									'$record["'.$key.'"]["value"] < FROM_TODAY("1","day","datetime")',
									$query
								);
								$query=preg_replace(
									"/{$key}[ ]*!=[ ]*TODAY\(\)/u",
									'($record["'.$key.'"]["value"] < TODAY("datetime") or $record["'.$key.'"]["value"] >= FROM_TODAY("1","day","datetime"))',
									$query
								);
								$query=preg_replace(
									"/{$key}[ ]*=[ ]*TODAY\(\)/u",
									'($record["'.$key.'"]["value"] >= TODAY("datetime") and $record["'.$key.'"]["value"] < FROM_TODAY("1","day","datetime"))',
									$query
								);
							}
							else
							{
								if (preg_match("/{$key}[ ]*([!><=]+)[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",$query))
								{
									$query=preg_replace(
										"/{$key}[ ]*>[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",
										'$record["'.$key.'"]["value"] >= FROM_$1($2,"datetime","1")',
										$query
									);
									$query=preg_replace(
										"/{$key}[ ]*>=[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",
										'$record["'.$key.'"]["value"] >= FROM_$1($2,"datetime")',
										$query
									);
									$query=preg_replace(
										"/{$key}[ ]*<[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",
										'$record["'.$key.'"]["value"] < FROM_$1($2,"datetime")',
										$query
									);
									$query=preg_replace(
										"/{$key}[ ]*<=[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",
										'$record["'.$key.'"]["value"] < FROM_$1($2,"datetime","1")',
										$query
									);
									$query=preg_replace(
										"/{$key}[ ]*!=[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",
										'($record["'.$key.'"]["value"] < FROM_$1($2,"datetime") or $record["'.$key.'"]["value"] >= FROM_$1($2,"datetime","1"))',
										$query
									);
									$query=preg_replace(
										"/{$key}[ ]*=[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",
										'($record["'.$key.'"]["value"] >= FROM_$1($2,"datetime") and $record["'.$key.'"]["value"] < FROM_$1($2,"datetime","1"))',
										$query
									);
								}
								else $query=preg_replace("/{$key}/u",'$record["'.$key.'"]["value"]',$query);
							}
							break;
						case "dropdown":
							$query=preg_replace(
								"/({$key})[ ]+(not in|in)[ ]+\(\)/u",
								'$1 $2 ("")',
								$query
							);
							$query=preg_replace("/(^|[ \(]{1}){$key}/u",'$1$record["'.$key.'"]["value"]',$query);
							break;
						case "file":
							$query=preg_replace(
								"/{$key}[ ]+(not like|like)[ ]+(\"[^\"]*\"|'[^']*')/u",
								'$me->FILTER_FILE($record["'.$key.'"]["value"],"$1",$2)',
								$query
							);
							break;
						case "lookup":
							if (preg_match("/{$key}[ ]*( not match | match )[ ]*[\"']{1}[0-9-]*[\"']{1}/u",$query))
							{
								$query=preg_replace(
									"/({$key})[ ]*( not match | match )[ ]*[\"']{1}([0-9-]*)[\"']{1}/u",
									'$1 $2 $3',
									$query
								);
							}
							if (preg_match("/{$key}[ ]*( not match | match )[ ]*( and | or |[\)]{1}|$)/u",$query))
							{
								$query=preg_replace(
									"/({$key})[ ]*( not match | match )[ ]*( and | or |[\)]{1}|$)/u",
									'$1 $2 null $3',
									$query
								);
							}
							$query=preg_replace("/(^|[ \(]{1}){$key}[ ]*( not match)/u",'$1$record["'.$key.'"]["value"] !=',$query);
							$query=preg_replace("/(^|[ \(]{1}){$key}[ ]*( match)/u",'$1$record["'.$key.'"]["value"] =',$query);
							$query=preg_replace("/(^|[ \(]{1}){$key}/u",'$1$record["'.$key.'"]["search"]',$query);
							break;
						case "number":
							if (preg_match("/{$key}[ ]*([!><=]+)[ ]*[\"']{1}[0-9-]*[\"']{1}/u",$query))
							{
								$query=preg_replace(
									"/({$key})[ ]*([!><=]+)[ ]*[\"']{1}([0-9-]*)[\"']{1}/u",
									'$1 $2 $3',
									$query
								);
							}
							if (preg_match("/{$key}[ ]*([!><=]+)[ ]*( and | or |[\)]{1}|$)/u",$query))
							{
								$query=preg_replace(
									"/({$key})[ ]*([!><=]+)[ ]*( and | or |[\)]{1}|$)/u",
									'$1 $2 null $3',
									$query
								);
							}
							$query=preg_replace("/(^|[ \(]{1}){$key}/u",'$1$record["'.$key.'"]["value"]',$query);
							break;
						case "table":
							$table=$key;
							foreach ($fields[$table]["fields"] as $key=>$value)
							{
								switch ($value["type"])
								{
									case "checkbox":
									case "department":
									case "group":
										$replacement='$me->FILTER_MULTIPLE($row["'.$key.'"]["value"],"$1",[$2])';
										$query=preg_replace(
											"/{$key}[ ]+(not in|in)[ ]+\(([^\)]*)\)/u",
											'$me->FILTER_ROW($record["'.$table.'"]["value"],function($row) use ($me){return '.$replacement.';})',
											$query
										);
										break;
									case "date":
										if (preg_match("/{$key}[ ]*([!><=]+)[ ]*TODAY\(\)/u",$query))
										{
											$query=preg_replace(
												"/{$key}[ ]*([!><=]+)[ ]*TODAY\(\)/u",
												'$me->FILTER_ROW($record["'.$table.'"]["value"],function($row) use ($me){return $row["'.$key.'"]["value"]$1TODAY();})',
												$query
											);
										}
										else
										{
											if (preg_match("/{$key}[ ]*([!><=]+)[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",$query))
											{
												$query=preg_replace(
													"/{$key}[ ]*([!><=]+)[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",
													'$me->FILTER_ROW($record["'.$table.'"]["value"],function($row) use ($me){return $row["'.$key.'"]["value"]$1FROM_$2($3);})',
													$query
												);
											}
											else
											{
												$query=preg_replace(
													"/{$key}[ ]*([!><=]+)[ ]*([^ \)]+)/u",
													'$me->FILTER_ROW($record["'.$table.'"]["value"],function($row) use ($me){return $row["'.$key.'"]["value"]$1$2;})',
													$query
												);
											}
										}
										break;
									case "datetime":
										$tablevalue='$record["'.$table.'"]["value"]';
										$fieldvalue='$row["'.$key.'"]["value"]';
										if (preg_match("/{$key}[ ]*([!><=]+)[ ]*TODAY\(\)/u",$query))
										{
											$query=preg_replace(
												"/{$key}[ ]*>[ ]*TODAY\(\)/u",
												'$me->FILTER_ROW('.$tablevalue.',function($row) use ($me){return '.$fieldvalue.' >= FROM_TODAY("1","day","datetime");})',
												$query
											);
											$query=preg_replace(
												"/{$key}[ ]*>=[ ]*TODAY\(\)/u",
												'$me->FILTER_ROW('.$tablevalue.',function($row) use ($me){return '.$fieldvalue.' >= TODAY("datetime");})',
												$query
											);
											$query=preg_replace(
												"/{$key}[ ]*<[ ]*TODAY\(\)/u",
												'$me->FILTER_ROW('.$tablevalue.',function($row) use ($me){return '.$fieldvalue.' < TODAY("datetime");})',
												$query
											);
											$query=preg_replace(
												"/{$key}[ ]*<=[ ]*TODAY\(\)/u",
												'$me->FILTER_ROW('.$tablevalue.',function($row) use ($me){return '.$fieldvalue.' < FROM_TODAY("1","day","datetime");})',
												$query
											);
											$query=preg_replace(
												"/{$key}[ ]*!=[ ]*TODAY\(\)/u",
												'$me->FILTER_ROW('.$tablevalue.',function($row) use ($me){return ('.$fieldvalue.' < TODAY("datetime") or '.$fieldvalue.' >= FROM_TODAY("1","day","datetime"));})',
												$query
											);
											$query=preg_replace(
												"/{$key}[ ]*=[ ]*TODAY\(\)/u",
												'$me->FILTER_ROW('.$tablevalue.',function($row) use ($me){return ('.$fieldvalue.' >= TODAY("datetime") and '.$fieldvalue.' < FROM_TODAY("1","day","datetime"));})',
												$query
											);
										}
										else
										{
											if (preg_match("/{$key}[ ]*([!><=]+)[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",$query))
											{
												$query=preg_replace(
													"/{$key}[ ]*>[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",
													'$me->FILTER_ROW('.$tablevalue.',function($row) use ($me){return '.$fieldvalue.' >= FROM_$1($2,"datetime","1");})',
													$query
												);
												$query=preg_replace(
													"/{$key}[ ]*>=[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",
													'$me->FILTER_ROW('.$tablevalue.',function($row) use ($me){return '.$fieldvalue.' >= FROM_$1($2,"datetime");})',
													$query
												);
												$query=preg_replace(
													"/{$key}[ ]*<[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",
													'$me->FILTER_ROW('.$tablevalue.',function($row) use ($me){return '.$fieldvalue.' < FROM_$1($2,"datetime");})',
													$query
												);
												$query=preg_replace(
													"/{$key}[ ]*<=[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",
													'$me->FILTER_ROW('.$tablevalue.',function($row) use ($me){return '.$fieldvalue.' < FROM_$1($2,"datetime","1");})',
													$query
												);
												$query=preg_replace(
													"/{$key}[ ]*!=[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",
													'$me->FILTER_ROW('.$tablevalue.',function($row) use ($me){return ('.$fieldvalue.' < FROM_$1($2,"datetime") or '.$fieldvalue.' >= FROM_$1($2,"datetime","1"));})',
													$query
												);
												$query=preg_replace(
													"/{$key}[ ]*=[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",
													'$me->FILTER_ROW('.$tablevalue.',function($row) use ($me){return ('.$fieldvalue.' >= FROM_$1($2,"datetime") and '.$fieldvalue.' < FROM_$1($2,"datetime","1"));})',
													$query
												);
											}
											else
											{
												$query=preg_replace(
													"/{$key}[ ]*([!><=]+)[ ]*([^ \)]+)/u",
													'$me->FILTER_ROW('.$tablevalue.',function($row) use ($me){return '.$fieldvalue.'$1$2;})',
													$query
												);
											}
										}
										break;
									case "dropdown":
										$query=preg_replace(
											"/({$key})[ ]+(not in|in)[ ]+\(\)/u",
											'$1 $2 ("")',
											$query
										);
										$query=preg_replace(
											"/{$key}[ ]*( not in | in )[ ]*\(([^\)]*)\)/u",
											'$me->FILTER_ROW($record["'.$table.'"]["value"],function($row) use ($me){return $row["'.$key.'"]["value"]$1($2);})',
											$query
										);
										break;
									case "file":
										$replacement='$me->FILTER_FILE($row["'.$key.'"]["value"],"$1",$2)';
										$query=preg_replace(
											"/{$key}[ ]+(not like|like)[ ]+(\"[^\"]*\"|'[^']*')/u",
											'$me->FILTER_ROW($record["'.$table.'"]["value"],function($row) use ($me){return '.$replacement.';})',
											$query
										);
										break;
									case "lookup":
										if (preg_match("/{$key}[ ]*( not match | match )[ ]*[\"']{1}[0-9-]*[\"']{1}/u",$query))
										{
											$query=preg_replace(
												"/({$key})[ ]*( not match | match )[ ]*[\"']{1}([0-9-]*)[\"']{1}/u",
												'$1 $2 $3',
												$query
											);
										}
										if (preg_match("/{$key}[ ]*( not match | match )[ ]*( and | or |[\)]{1}|$)/u",$query))
										{
											$query=preg_replace(
												"/({$key})[ ]*( not match | match )[ ]*( and | or |[\)]{1}|$)/u",
												'$1 $2 null $3',
												$query
											);
										}
										$query=preg_replace(
											"/{$key}[ ]*( not match )[ ]*([^ \)]+)/u",
											'$me->FILTER_ROW($record["'.$table.'"]["value"],function($row) use ($me){return $row["'.$key.'"]["value"] != $2;})',
											$query
										);
										$query=preg_replace(
											"/{$key}[ ]*( match )[ ]*([^ \)]+)/u",
											'$me->FILTER_ROW($record["'.$table.'"]["value"],function($row) use ($me){return $row["'.$key.'"]["value"] = $2;})',
											$query
										);
										$query=preg_replace(
											"/{$key}[ ]*([!><=]+| not like | like )[ ]*([^ \)]+)/u",
											'$me->FILTER_ROW($record["'.$table.'"]["value"],function($row) use ($me){return $row["'.$key.'"]["search"]$1$2;})',
											$query
										);
										break;
									case "number":
										if (preg_match("/{$key}[ ]*([!><=]+)[ ]*[\"']{1}[0-9-]*[\"']{1}/u",$query))
										{
											$query=preg_replace(
												"/({$key})[ ]*([!><=]+)[ ]*[\"']{1}([0-9-]*)[\"']{1}/u",
												'$1 $2 $3',
												$query
											);
										}
										if (preg_match("/{$key}[ ]*([!><=]+)[ ]*( and | or |[\)]{1}|$)/u",$query))
										{
											$query=preg_replace(
												"/({$key})[ ]*([!><=]+)[ ]*( and | or |[\)]{1}|$)/u",
												'$1 $2 null $3',
												$query
											);
										}
										$query=preg_replace(
											"/{$key}[ ]*([!><=]+)[ ]*([^ \)]+)/u",
											'$me->FILTER_ROW($record["'.$table.'"]["value"],function($row) use ($me){return $row["'.$key.'"]["value"]$1$2;})',
											$query
										);
										break;
									case "user":
										$replacement='$me->FILTER_USER($row["'.$key.'"]["value"],"$1",[$2])';
										$query=preg_replace(
											"/{$key}[ ]+(not in|in)[ ]+\(([^\)]*)\)/u",
											'$me->FILTER_ROW($record["'.$table.'"]["value"],function($row) use ($me){return '.$replacement.';})',
											$query
										);
										break;
									default:
										$query=preg_replace(
											"/{$key}[ ]*([!><=]+| not like | like )[ ]*([^ \)]+)/u",
											'$me->FILTER_ROW($record["'.$table.'"]["value"],function($row) use ($me){return $row["'.$key.'"]["value"]$1$2;})',
											$query
										);
										$query=preg_replace(
											"/{$key}[ ]*( not in | in )[ ]*\(([^\)]*)\)/u",
											'$me->FILTER_ROW($record["'.$table.'"]["value"],function($row) use ($me){return $row["'.$key.'"]["value"]$1($2);})',
											$query
										);
										break;
								}
							}
							break;
						case "user":
							$query=preg_replace(
								"/{$key}[ ]+(not in|in)[ ]+\(([^\)]*)\)/u",
								'$me->FILTER_USER($record["'.$key.'"]["value"],"$1",[$2])',
								$query
							);
							break;
						default:
							$query=preg_replace("/(^|[ \(]{1}){$key}/u",'$1$record["'.$key.'"]["value"]',$query);
							break;
					}
				}
				$reserved=["datetime"=>["__createdtime","__modifiedtime"],"id"=>["__id"],"user"=>["__creator","__modifier"]];
				foreach ($reserved["datetime"] as $key)
				{
					if (preg_match("/{$key}[ ]*([!><=]+)[ ]*TODAY\(\)/u",$query))
					{
						$query=preg_replace(
							"/{$key}[ ]*>[ ]*TODAY\(\)/u",
							'$record["'.$key.'"]["value"] >= FROM_TODAY("1","day","datetime")',
							$query
						);
						$query=preg_replace(
							"/{$key}[ ]*>=[ ]*TODAY\(\)/u",
							'$record["'.$key.'"]["value"] >= TODAY("datetime")',
							$query
						);
						$query=preg_replace(
							"/{$key}[ ]*<[ ]*TODAY\(\)/u",
							'$record["'.$key.'"]["value"] < TODAY("datetime")',
							$query
						);
						$query=preg_replace(
							"/{$key}[ ]*<=[ ]*TODAY\(\)/u",
							'$record["'.$key.'"]["value"] < FROM_TODAY("1","day","datetime")',
							$query
						);
						$query=preg_replace(
							"/{$key}[ ]*!=[ ]*TODAY\(\)/u",
							'($record["'.$key.'"]["value"] < TODAY("datetime") or $record["'.$key.'"]["value"] >= FROM_TODAY("1","day","datetime"))',
							$query
						);
						$query=preg_replace(
							"/{$key}[ ]*=[ ]*TODAY\(\)/u",
							'($record["'.$key.'"]["value"] >= TODAY("datetime") and $record["'.$key.'"]["value"] < FROM_TODAY("1","day","datetime"))',
							$query
						);
					}
					else
					{
						if (preg_match("/{$key}[ ]*([!><=]+)[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",$query))
						{
							$query=preg_replace(
								"/{$key}[ ]*>[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",
								'$record["'.$key.'"]["value"] >= FROM_$1($2,"datetime","1")',
								$query
							);
							$query=preg_replace(
								"/{$key}[ ]*>=[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",
								'$record["'.$key.'"]["value"] >= FROM_$1($2,"datetime")',
								$query
							);
							$query=preg_replace(
								"/{$key}[ ]*<[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",
								'$record["'.$key.'"]["value"] < FROM_$1($2,"datetime")',
								$query
							);
							$query=preg_replace(
								"/{$key}[ ]*<=[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",
								'$record["'.$key.'"]["value"] < FROM_$1($2,"datetime","1")',
								$query
							);
							$query=preg_replace(
								"/{$key}[ ]*!=[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",
								'($record["'.$key.'"]["value"] < FROM_$1($2,"datetime") or $record["'.$key.'"]["value"] >= FROM_$1($2,"datetime","1"))',
								$query
							);
							$query=preg_replace(
								"/{$key}[ ]*=[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",
								'($record["'.$key.'"]["value"] >= FROM_$1($2,"datetime") and $record["'.$key.'"]["value"] < FROM_$1($2,"datetime","1"))',
								$query
							);
						}
						else $query=preg_replace("/{$key}/u",'$record["'.$key.'"]["value"]',$query);
					}
				}
				foreach ($reserved["id"] as $key)
				{
					if (preg_match("/{$key}[ ]*([!><=]+)[ ]*[\"']{1}[0-9-]*[\"']{1}/u",$query))
					{
						$query=preg_replace(
							"/({$key})[ ]*([!><=]+)[ ]*[\"']{1}([0-9-]*)[\"']{1}/u",
							'$1 $2 $3',
							$query
						);
					}
					if (preg_match("/{$key}[ ]*([!><=]+)[ ]*( and | or |[\)]{1}|$)/u",$query))
					{
						$query=preg_replace(
							"/({$key})[ ]*([!><=]+)[ ]*( and | or |[\)]{1}|$)/u",
							'$1 $2 null $3',
							$query
						);
					}
				}
				foreach ($reserved["user"] as $key)
				{
					$query=preg_replace(
						"/{$key}[ ]+(not in|in)[ ]+\(([^\)]*)\)/u",
						'$me->FILTER_USER($record["'.$key.'"]["value"],"$1",[$2])',
						$query
					);
				}
				if ($arg_operator!="") $query=preg_replace("/LOGIN_USER/u",$arg_operator,$query);
				$query=preg_replace("/(^|[ \(]{1})__id/u",'$1$record["__id"]["value"]',$query);
				$query=preg_replace("/ and /u"," && ",$query);
				$query=preg_replace("/ or /u"," || ",$query);
				$query=preg_replace("/([^!><=]{1})=(?!=)/u","$1==",$query);
				$query=preg_replace("/([^_]{1})TODAY\(/u","$1\$me->TODAY(",$query);
				$query=preg_replace("/[ ]*FROM_/u"," \$me->FROM_",$query);
				$query=preg_replace("/([^ \(]+)[ ]+not in[ ]+\(([^\)]*)\)/u","!in_array($1,[$2],true)",$query);
				$query=preg_replace("/([^ \(]+)[ ]+in[ ]+\(([^\)]*)\)/u","in_array($1,[$2],true)",$query);
				$query=preg_replace("/([^ \(]+)[ ]+not like[ ]+\"((?:\\\\\"|[^\"])+)\"/u","!preg_match(\"/$2/u\",$1)",$query);
				$query=preg_replace("/([^ \(]+)[ ]+like[ ]+\"((?:\\\\\"|[^\"])+)\"/u","preg_match(\"/$2/u\",$1)",$query);
				$query=preg_replace("/([^ \(]+)[ ]+not like[ ]+'((?:\\\\'|[^'])+)'/u","!preg_match('/$2/u',$1)",$query);
				$query=preg_replace("/([^ \(]+)[ ]+like[ ]+'((?:\\\\'|[^'])+)'/u","preg_match('/$2/u',$1)",$query);
				$query=preg_replace("/([^ \(]+)[ ]+not like[ ]+(\"\"|'')/u","$1 != \"\"",$query);
				$query=preg_replace("/([^ \(]+)[ ]+like[ ]+(\"\"|'')/u","$1 == \"\"",$query);
			}
			return (function($records,$query,$me){
				$res=[];
				foreach ($records as $key=>$record)
				{
					$record["__id"]=["value"=>intval($key)];
					if (($query!="")?eval("return {$query};"):true) $res[$key]=$record;
				}
				return $res;
			})($arg_source,$query,$me);
		}
		catch (ParseError $e)
		{
			throw new Exception("Either Your query is incorrect or unregistered fields are used: ".$arg_query);
		}
		finally
		{
			restore_error_handler();
		}
	}
	/* insert */
	public function insert($arg_file,$arg_records,$arg_operator)
	{
		$error="";
		$file=$this->dir."{$arg_file}.json";
		$source=[];
		try
		{
			$this->lock($arg_file);
			$this->operator=$arg_operator;
			$this->resultid=0;
			$this->resultnumbers=[];
			if (file_exists($file))
			{
				$source=json_decode(mb_convert_encoding(file_get_contents($file),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),true);
				if (is_array($source))
				{
					end($source);
					$this->resultid=(!is_null(key($source)))?intval(key($source)):0;
				}
				else $source=[];
			}
			$deduplications=$this->deduplications($arg_file);
			$fields=$this->fields($arg_file);
			foreach ($arg_records as $record)
			{
				$timezone=new DateTimeZone($this->timezone);
				$now=new DateTime("now",$timezone);
				$time=$now->modify(strval($timezone->getOffset($now)*-1)." second")->format("Y-m-d\TH:i:s")."Z";
				$this->resultid++;
				$build=$this->build([],$record,$fields,$source);
				$build["__creator"]=["value"=>[strval($arg_operator)]];
				$build["__createdtime"]=["value"=>$time];
				$build["__modifier"]=["value"=>[strval($arg_operator)]];
				$build["__modifiedtime"]=["value"=>$time];
				foreach ($deduplications as $deduplication)
				{
					$queries=[];
					foreach ($deduplication["criteria"] as $criteria)
					{
						if (array_key_exists($criteria["external"],$fields) && array_key_exists($criteria["internal"],$fields))
							$queries[]=$this->query($fields[$criteria["external"]],$criteria["operator"],array_merge($record[$criteria["internal"]],["type"=>$fields[$criteria["internal"]]["type"]]));
					}
					if (count($this->filter($source,$fields,implode(" and ",$queries),$arg_operator))>0)
					{
						$error=$deduplication["message"];
						break;
					}
				}
				if ($error!="") break;
				$source[strval($this->resultid)]=$build;
				$this->resultnumbers[strval($this->resultid)]=$build["__autonumber"]["value"];
			}
			if ($error=="")
			{
				file_put_contents($file,json_encode($source));
				return true;
			}
			else
			{
				$this->resulterror=$error;
				return false;
			}
		}
		catch (Exception $e)
		{
			$this->resulterror=$e->getMessage();
			return false;
		}
		finally
		{
			$this->unlock($arg_file);
		}
	}
	public function insertid()
	{
		return $this->resultid;
	}
	/* lock */
	public function lock($arg_file)
	{
		$file="./record_processing_{$arg_file}.txt";
		$limit=60;
		$start=time();
		@set_time_limit($limit);
		while (file_exists($file))
		{
			usleep(500);
			if (file_exists($file))
				if (time()>filectime($file)+$limit)
				{
					$this->unlock($arg_file);
					break;
				}
			if (time()>$start+$limit-1) throw new Exception("Timed out because someone is manipulating records for this app");
		}
		file_put_contents($file,"");
		@set_time_limit($limit);
	}
	public function unlock($arg_file)
	{
		if ($this->resulterror!="Timed out because someone is manipulating records for this app")
		{
			$file="./record_processing_{$arg_file}.txt";
			if (file_exists($file)) unlink($file);
		}
	}
	/* query */
	public function query($arg_lhs,$arg_operator,$arg_rhs)
	{
		switch ($arg_rhs["type"])
		{
			case "canvas":
			case "file":
				$arg_rhs["value"]="\"\"";
				break;
			case "checkbox":
			case "creator":
			case "department":
			case "group":
			case "modifier":
			case "user":
				if (is_array($arg_rhs["value"]))
				{
					$arg_rhs["value"]=array_filter($arg_rhs["value"],function($values,$key){return strval($values)!="";},ARRAY_FILTER_USE_BOTH);
					$arg_rhs["value"]=array_map(function($item){return "\"".strval($item)."\"";},$arg_rhs["value"]);
					$arg_rhs["value"]="(".implode(",",$arg_rhs["value"]).")";
				}
				else $arg_rhs["value"]="()";
				break;
			case "dropdown":
			case "radio":
				$arg_rhs["value"]="(\"".((!is_null($arg_rhs["value"])?$arg_rhs["value"]:""))."\")";
				break;
			case "id":
			case "number":
				$arg_rhs["value"]=(is_numeric($arg_rhs["value"]))?$arg_rhs["value"]:"null";
				break;
			case "lookup":
				switch ($arg_lhs["type"])
				{
					case "id":
					case "number":
						$arg_rhs["value"]=(is_numeric($arg_rhs["value"]))?$arg_rhs["value"]:"null";
						break;
					default:
						if (preg_match("/match/u",$arg_operator)) $arg_rhs["value"]=(is_numeric($arg_rhs["value"]))?$arg_rhs["value"]:"null";
						else $arg_rhs["value"]="\"".((!is_null($arg_rhs["search"])?$arg_rhs["search"]:""))."\"";
						break;
				}
				break;
			default:
				$arg_rhs["value"]="\"".((!is_null($arg_rhs["value"])?$arg_rhs["value"]:""))."\"";
				break;
		}
		return $arg_lhs["id"]." ".$arg_operator." ".$arg_rhs["value"];
	}
	/* queries error */
	public function queryerror()
	{
		return $this->resulterror;
	}
	/* record */
	public function record($arg_file,$arg_id)
	{
		$file=$this->dir."{$arg_file}.json";
		$this->resultcount=0;
		try
		{
			if ($arg_id=="")
			{
				$this->resulterror="You should specified ID";
				return false;
			}
			else
			{
				if (is_numeric($arg_id))
				{
					$arg_id=strval($arg_id);
					if (file_exists($file))
					{
						$source=json_decode(mb_convert_encoding(file_get_contents($file),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),true);
						if (is_array($source))
						{
							if (array_key_exists($arg_id,$source))
							{
								$source[$arg_id]["__id"]=["value"=>intval($arg_id)];
								$this->resultcount=1;
								return $source[$arg_id];
							}
							else return [];
						}
						else return [];
					}
					else return [];
				}
				else
				{
					$this->resulterror="ID must be specified numerically";
					return false;
				}
			}
		}
		catch (Exception $e)
		{
			$this->resulterror=$e->getMessage();
			return false;
		}
	}
	public function records($arg_file,$arg_query="",$arg_sort="",$arg_offset=0,$arg_limit=0,$arg_operator="")
	{
		$file=$this->dir."{$arg_file}.json";
		$source=[];
		$response=[];
		$this->resultcount=0;
		try
		{
			if (file_exists($file))
			{
				$source=json_decode(mb_convert_encoding(file_get_contents($file),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),true);
				if (is_array($source))
				{
					if ($arg_query!="") $source=$this->filter($source,$this->fields($arg_file),$arg_query,$arg_operator);
					foreach ($source as $key=>$value)
					{
						$value["__id"]=["value"=>intval($key)];
						$response[]=$value;
					}
					$this->resultcount=count($response);
					if ($arg_sort!="")
					{
						$sorts=explode(",",$arg_sort);
						$params=[];
						foreach ($sorts as $sort)
						{
							$sort=explode(" ",$sort);
							$params[]=array_column(array_column($response,trim($sort[0])),"value");
							if (count($sort)==1) $params[]=SORT_ASC;
							else $params[]=(strtolower(trim($sort[1]))=="desc")?SORT_DESC:SORT_ASC;
						}
						$params[]=&$response;
						call_user_func_array('array_multisort',$params);
					}
					return ($arg_limit==0)?$response:array_slice($response,$arg_offset,$arg_limit);
				}
				else return [];
			}
			else return [];
		}
		catch (Exception $e)
		{
			$this->resulterror=$e->getMessage();
			return false;
		}
	}
	public function recordcount()
	{
		return $this->resultcount;
	}
	/* update */
	public function update($arg_file,$arg_records,$arg_operator)
	{
		$error="";
		$file=$this->dir."{$arg_file}.json";
		try
		{
			$this->lock($arg_file);
			$this->operator=$arg_operator;
			$this->resultid=0;
			$this->resultnumbers=[];
			if (file_exists($file))
			{
				$source=json_decode(mb_convert_encoding(file_get_contents($file),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),true);
				if (is_array($source))
				{
					$deduplications=$this->deduplications($arg_file);
					$fields=$this->fields($arg_file);
					foreach ($arg_records as $record)
					{
						if (array_key_exists("__id",$record))
						{
							if (array_key_exists(strval($record["__id"]["value"]),$source))
							{
								$timezone=new DateTimeZone($this->timezone);
								$now=new DateTime("now",$timezone);
								$time=$now->modify(strval($timezone->getOffset($now)*-1)." second")->format("Y-m-d\TH:i:s")."Z";
								$this->resultid=intval($record["__id"]["value"]);
								if (array_key_exists("__modifiedtime",$record))
									if ($source[strval($this->resultid)]["__modifiedtime"]["value"]>$record["__modifiedtime"]["value"])
									{
										$error="Someone has updated the record while you are editing";
										break;
									}
								$build=$this->build($source[strval($this->resultid)],$record,$fields,$source);
								$build["__modifier"]=["value"=>[strval($arg_operator)]];
								$build["__modifiedtime"]=["value"=>$time];
								foreach ($deduplications as $deduplication)
								{
									$queries=[];
									foreach ($deduplication["criteria"] as $criteria)
									{
										if (array_key_exists($criteria["external"],$fields) && array_key_exists($criteria["internal"],$fields))
											$queries[]=$this->query($fields[$criteria["external"]],$criteria["operator"],array_merge($record[$criteria["internal"]],["type"=>$fields[$criteria["internal"]]["type"]]));
									}
									$queries[]="__id != ".strval($record["__id"]["value"]);
									if (count($this->filter($source,$fields,implode(" and ",$queries),$arg_operator))>0)
									{
										$error=$deduplication["message"];
										break;
									}
								}
								if ($error!="") break;
								$source[strval($this->resultid)]=$build;
								$this->resultnumbers[strval($this->resultid)]=$build["__autonumber"]["value"];
							}
						}
						else
						{
							$error="The ID field with the ID of the record to update must be added to the record object";
							break;
						}
					}
					if ($error=="")
					{
						file_put_contents($file,json_encode($source));
						return true;
					}
					else
					{
						$this->resulterror=$error;
						return false;
					}
				}
				else
				{
					$this->resulterror="File does not exist";
					return false;
				}
			}
			else
			{
				$this->resulterror="File does not exist";
				return false;
			}
		}
		catch (Exception $e)
		{
			$this->resulterror=$e->getMessage();
			return false;
		}
		finally
		{
			$this->unlock($arg_file);
		}
	}
	/* filter functions */
	public function FILTER_FILE($arg_field,$arg_operator,$arg_value)
	{
		$res=false;
		switch ($arg_operator)
		{
			case 'not like':
				if (count($arg_field)>0) $res=$this->FILTER_FILE_COUNT($arg_field,$arg_value)==0;
				else $res=($arg_value!="");
				break;
			case 'like':
				if (count($arg_field)>0) $res=$this->FILTER_FILE_COUNT($arg_field,$arg_value)>0;
				else $res=($arg_value=="");
				break;
		}
		return $res;
	}
	public function FILTER_FILE_COUNT($arg_field,$arg_value)
	{
		return count(array_filter($arg_field,function($value) use ($arg_value){return ($arg_value=="")?$value["name"]=="":preg_match("/".$arg_value."/u",$value["name"]);}));
	}
	public function FILTER_MULTIPLE($arg_field,$arg_operator,$arg_value)
	{
		$res=false;
		switch ($arg_operator)
		{
			case 'not in':
				if (count($arg_field)>0) $res=$this->FILTER_MULTIPLE_COUNT($arg_field,$arg_value)==0;
				else $res=count($arg_value)!=0;
				break;
			case 'in':
				if (count($arg_field)>0) $res=$this->FILTER_MULTIPLE_COUNT($arg_field,$arg_value)>0;
				else $res=count($arg_value)==0;
				break;
		}
		return $res;
	}
	public function FILTER_MULTIPLE_COUNT($arg_field,$arg_value)
	{
		return count(array_filter($arg_field,function($value) use ($arg_value){return in_array(strval($value),$arg_value,true);}));
	}
	public function FILTER_ROW(&$arg_table,$arg_callback)
	{
		$res=0;
		foreach ($arg_table as &$row)
		{
			if ($arg_callback($row)) $res++;
			else $row["__row_cnd"]=["value"=>"skip"];
		}
		return $res>0;
	}
	public function FILTER_USER($arg_field,$arg_operator,$arg_value)
	{
		$res=false;
		switch ($arg_operator)
		{
			case 'not in':
				if (count($arg_field)>0) $res=$this->FILTER_USER_COUNT($arg_field,$arg_value)==0;
				else $res=count($arg_value)!=0;
				break;
			case 'in':
				if (count($arg_field)>0) $res=$this->FILTER_USER_COUNT($arg_field,$arg_value)>0;
				else $res=count($arg_value)==0;
				break;
		}
		return $res;
	}
	public function FILTER_USER_COUNT($arg_field,$arg_value)
	{
		$result=0;
		$departments=[];
		$groups=[];
		$users=[];
		foreach ($arg_value as $value)
		{
			$value=strval($value);
			switch (substr($value,0,1))
			{
				case "d":
					$departments[]=substr($value,1);
					break;
				case "g":
					$groups[]=substr($value,1);
					break;
				case "u":
					$users[]=substr($value,1);
					break;
				default:
					$users[]=$value;
					break;
			}
		}
		foreach ($arg_field as $field)
			if (array_key_exists($field,$this->users))
			{
				$result+=count(array_filter($this->users[$field]["department"]["value"],function($value) use ($departments){return in_array($value,$departments,true);}));
				$result+=count(array_filter($this->users[$field]["group"]["value"],function($value) use ($groups){return in_array($value,$groups,true);}));
				if (in_array($field,$users,true)) $result++;
			}
		return $result;
	}
	/* date functions */
	public function TODAY($arg_type="date",$arg_adddays="0")
	{
		$timezone=new DateTimeZone($this->timezone);
		$date=new DateTime(date("Y-m-d"),$timezone);
		return ($arg_type!="date")?$date->modify($arg_adddays." day")->modify(strval($timezone->getOffset($date)*-1)." second")->format("Y-m-d\TH:i:s")."Z":$date->format("Y-m-d");
	}
	public function FROM_TODAY($arg_interval,$arg_unit,$arg_type="date",$arg_adddays="0")
	{
		$timezone=new DateTimeZone($this->timezone);
		$date=new DateTime(date("Y-m-d"),$timezone);
		$date->modify($arg_interval." ".$arg_unit);
		return ($arg_type!="date")?$date->modify($arg_adddays." day")->modify(strval($timezone->getOffset($date)*-1)." second")->format("Y-m-d\TH:i:s")."Z":$date->format("Y-m-d");
	}
	public function FROM_THISWEEK($arg_interval,$arg_unit,$arg_type="date",$arg_adddays="0")
	{
		$timezone=new DateTimeZone($this->timezone);
		$date=new DateTime(date("Y-m-d"),$timezone);
		$date->modify("-".$date->format("w")." day")->modify($arg_interval." ".$arg_unit);
		return ($arg_type!="date")?$date->modify($arg_adddays." day")->modify(strval($timezone->getOffset($date)*-1)." second")->format("Y-m-d\TH:i:s")."Z":$date->format("Y-m-d");
	}
	public function FROM_THISMONTH($arg_interval,$arg_unit,$arg_type="date",$arg_adddays="0")
	{
		$timezone=new DateTimeZone($this->timezone);
		$date=new DateTime(date("Y-m-01"),$timezone);
		$date->modify($arg_interval." ".$arg_unit);
		return ($arg_type!="date")?$date->modify($arg_adddays." day")->modify(strval($timezone->getOffset($date)*-1)." second")->format("Y-m-d\TH:i:s")."Z":$date->format("Y-m-d");
	}
	public function FROM_THISYEAR($arg_interval,$arg_unit,$arg_type="date",$arg_adddays="0")
	{
		$timezone=new DateTimeZone($this->timezone);
		$date=new DateTime(date("Y-01-01"),$timezone);
		$date->modify($arg_interval." ".$arg_unit);
		return ($arg_type!="date")?$date->modify($arg_adddays." day")->modify(strval($timezone->getOffset($date)*-1)." second")->format("Y-m-d\TH:i:s")."Z":$date->format("Y-m-d");
	}
}
?>