<?php
/*
* PandaFirm-PHP-Module "driver.php"
* Version: 1.0
* Copyright (c) 2020 TIS
* Released under the MIT License.
* http://pandafirm.jp/license.txt
*/
class clsDriver
{
	/* valiable */
	private $dir;
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
	/* build */
	public function build($arg_destination,$arg_source,$arg_fields,$arg_records=null)
	{
		$lookups=[];
		foreach ($arg_fields as $key=>$value)
		{
			switch ($arg_fields[$key]["type"])
			{
				case "checkbox":
				case "file":
				case "group":
				case "organization":
				case "user":
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
				case "lookup":
					if (array_key_exists($key,$arg_source))
					{
						if (array_key_exists("lookup",$arg_source[$key]))
							if ($arg_source[$key]["lookup"]===true)
							{
								$lookups[$key]=$arg_fields[$key];
								break;
							}
						$arg_destination[$key]=["search"=>$arg_source[$key]["search"],"value"=>$arg_source[$key]["value"]];
					}
					else
					{
						if (!array_key_exists($key,$arg_destination)) $arg_destination[$key]=["search"=>null,"value"=>null];
					}
					break;
				case "number":
					if (array_key_exists($key,$arg_source)) $arg_destination[$key]=["value"=>($arg_source[$key]["value"]=="")?null:floatval($arg_source[$key]["value"])];
					else
					{
						if (!array_key_exists($key,$arg_destination)) $arg_destination[$key]=["value"=>null];
					}
					break;
				case "table":
					if (array_key_exists($key,$arg_source))
					{
						$arg_destination[$key]=["value"=>[]];
						foreach ($arg_source[$key]["value"] as $row) $arg_destination[$key]["value"][]=$this->build([],$row,$arg_fields[$key]["fields"]);
					}
					else
					{
						if (!array_key_exists($key,$arg_destination))
						{
							$arg_destination[$key]=["value"=>[]];
							$arg_destination[$key]["value"][]=$this->build([],[],$arg_fields[$key]["fields"]);
						}
					}
					break;
				default:
					if (array_key_exists($key,$arg_source)) $arg_destination[$key]=["value"=>$arg_source[$key]["value"]];
					else
					{
						if (!array_key_exists($key,$arg_destination))
						{
							if ($arg_fields[$key]["type"]=="radio") $arg_destination[$key]=["value"=>$arg_fields[$key]["options"][0]["option"]["value"]];
							else $arg_destination[$key]=["value"=>null];
						}
					}
					break;
			}
		}
		foreach ($lookups as $key=>$value)
		{
			$mapping=$value["mapping"];
			$source=$this->record($value["app"],$arg_source[$key]["value"]);
			if (is_array($source))
			{
				if (array_values($source)!==$source)
				{
					$arg_destination[$key]=["search"=>$source[$value["search"]]["value"],"value"=>$arg_source[$key]["value"]];
					foreach ($mapping as $mappingkey => $mappingvalue)
					{
						if (array_key_exists($mappingkey,$source))
							if (array_key_exists($mappingvalue,$arg_fields))
								switch ($arg_fields[$mappingvalue]["type"])
								{
									case "number":
										$arg_destination[$mappingvalue]=["value"=>($source[$mappingkey]["value"]=="")?null:floatval($source[$mappingkey]["value"])];
										break;
									default:
										$arg_destination[$mappingvalue]=["value"=>$source[$mappingkey]["value"]];
										break;
								}
					}
				}
				else $arg_destination[$key]=["search"=>null,"value"=>null];
			}
			else $arg_destination[$key]=["search"=>null,"value"=>null];
		}
		if (is_array($arg_records))
		{
			if (array_key_exists("__autonumber",$arg_fields))
			{
				$prefix="";
				foreach ($arg_fields["__autonumber"]["group"] as $group)
					if (array_key_exists($group,$arg_fields))
						if (!is_null($arg_destination[$group]["value"]))
							switch ($arg_fields[$group]["type"])
							{
								case "id":
								case "number":
									$prefix.=strval($arg_destination[$group]["value"]);
									break;
								default:
									$prefix.=$arg_destination[$group]["value"];
									break;
							}
				if (array_key_exists("__autonumber",$arg_source))
				{
					if ($prefix!="")
					{
						if (preg_match("/^{$prefix}/u",$arg_source["__autonumber"]["value"]))
						{
							$arg_destination["__autonumber"]=["value"=>$arg_source["__autonumber"]["value"]];
							return $arg_destination;
						}
					}
					else
					{
						if (preg_match("/^[0-9]+$/u",$arg_source["__autonumber"]["value"]))
						{
							$arg_destination["__autonumber"]=["value"=>$arg_source["__autonumber"]["value"]];
							return $arg_destination;
						}
					}
				}
				$filters=array_values($this->filter($arg_records,$arg_fields,($prefix)?"__autonumber like \"^{$prefix}\"":"__autonumber like \"^[0-9]+$\"",""));
				$fixed=$arg_fields["__autonumber"]["fixed"];
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
			else $arg_destination["__autonumber"]=["value"=>""];
		}
		return $arg_destination;
	}
	/* delete */
	public function delete($arg_file,$arg_id="")
	{
		$file=$this->dir."{$arg_file}.json";
		try
		{
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
	}
	public function deletes($arg_file,$arg_query="",$arg_operator="")
	{
		$file=$this->dir."{$arg_file}.json";
		try
		{
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
	}
	public function truncate($arg_file)
	{
		$file=$this->dir."{$arg_file}.json";
		try
		{
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
		set_error_handler(function($arg_errno,$arg_errstr,$arg_errfile,$arg_errline,$arg_errcontext){throw new \ParseError();});
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
						case "group":
						case "organization":
							$query=preg_replace(
								"/{$key}[ ]*( not in | in )[ ]*\(([^\)]*)\)/u",
								'$me->FILTER_MULTIPLE($values["'.$key.'"]["value"],\'$1\',[$2])',
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
									'$values["'.$key.'"]["value"] >= FROM_TODAY("1","day","datetime")',
									$query
								);
								$query=preg_replace(
									"/{$key}[ ]*>=[ ]*TODAY\(\)/u",
									'$values["'.$key.'"]["value"] >= TODAY("datetime")',
									$query
								);
								$query=preg_replace(
									"/{$key}[ ]*<[ ]*TODAY\(\)/u",
									'$values["'.$key.'"]["value"] < TODAY("datetime")',
									$query
								);
								$query=preg_replace(
									"/{$key}[ ]*<=[ ]*TODAY\(\)/u",
									'$values["'.$key.'"]["value"] < FROM_TODAY("1","day","datetime")',
									$query
								);
								$query=preg_replace(
									"/{$key}[ ]*!=[ ]*TODAY\(\)/u",
									'($values["'.$key.'"]["value"] < TODAY("datetime") or $values["'.$key.'"]["value"] >= FROM_TODAY("1","day","datetime"))',
									$query
								);
								$query=preg_replace(
									"/{$key}[ ]*=[ ]*TODAY\(\)/u",
									'($values["'.$key.'"]["value"] >= TODAY("datetime") and $values["'.$key.'"]["value"] < FROM_TODAY("1","day","datetime"))',
									$query
								);
							}
							else
							{
								if (preg_match("/{$key}[ ]*([!><=]+)[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",$query))
								{
									$query=preg_replace(
										"/{$key}[ ]*>[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",
										'$values["'.$key.'"]["value"] >= FROM_$1($2,"datetime","1")',
										$query
									);
									$query=preg_replace(
										"/{$key}[ ]*>=[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",
										'$values["'.$key.'"]["value"] >= FROM_$1($2,"datetime")',
										$query
									);
									$query=preg_replace(
										"/{$key}[ ]*<[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",
										'$values["'.$key.'"]["value"] < FROM_$1($2,"datetime")',
										$query
									);
									$query=preg_replace(
										"/{$key}[ ]*<=[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",
										'$values["'.$key.'"]["value"] < FROM_$1($2,"datetime","1")',
										$query
									);
									$query=preg_replace(
										"/{$key}[ ]*!=[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",
										'($values["'.$key.'"]["value"] < FROM_$1($2,"datetime") or $values["'.$key.'"]["value"] >= FROM_$1($2,"datetime","1"))',
										$query
									);
									$query=preg_replace(
										"/{$key}[ ]*=[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",
										'($values["'.$key.'"]["value"] >= FROM_$1($2,"datetime") and $values["'.$key.'"]["value"] < FROM_$1($2,"datetime","1"))',
										$query
									);
								}
								else $query=preg_replace("/{$key}/u",'$values["'.$key.'"]["value"]',$query);
							}
							break;
						case "file":
							$query=preg_replace(
								"/{$key}[ ]*( not like | like )[ ]*\"([^\"]*)\"/u",
								'$me->FILTER_FILE($values["'.$key.'"]["value"],\'$1\',\'$2\')',
								$query
							);
							break;
						case "lookup":
							$query=preg_replace("/(^|[ \(]{1}){$key}/u",'$1$values["'.$key.'"]["search"]',$query);
							break;
						case "number":
							if (preg_match("/{$key}[ ]*([!><=]+)[ ]*[\"]{1}[0-9-]*[\"]{1}/u",$query))
							{
								$query=preg_replace(
									"/({$key})[ ]*([!><=]+)[ ]*[\"]{1}([0-9-]*)[\"]{1}/u",
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
							$query=preg_replace("/(^|[ \(]{1}){$key}/u",'$1$values["'.$key.'"]["value"]',$query);
							break;
						case "table":
							$table=$key;
							foreach ($fields[$table]["fields"] as $key=>$value)
							{
								switch ($value["type"])
								{
									case "checkbox":
									case "group":
									case "organization":
										$replacement='$me->FILTER_MULTIPLE($values["'.$key.'"]["value"],\'$1\',[$2])';
										$query=preg_replace(
											"/{$key}[ ]*( not in | in )[ ]*\(([^\)]*)\)/u",
											'count(array_filter($values["'.$table.'"]["value"],function($values) use ($me){return '.$replacement.';}))>0',
											$query
										);
										break;
									case "date":
										if (preg_match("/{$key}[ ]*([!><=]+)[ ]*TODAY\(\)/u",$query))
										{
											$query=preg_replace(
												"/{$key}[ ]*([!><=]+)[ ]*TODAY\(\)/u",
												'count(array_filter($values["'.$table.'"]["value"],function($values) use ($me){return $values["'.$key.'"]["value"]$1TODAY();}))>0',
												$query
											);
										}
										else
										{
											if (preg_match("/{$key}[ ]*([!><=]+)[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",$query))
											{
												$query=preg_replace(
													"/{$key}[ ]*([!><=]+)[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",
													'count(array_filter($values["'.$table.'"]["value"],function($values) use ($me){return $values["'.$key.'"]["value"]$1FROM_$2($3);}))>0',
													$query
												);
											}
											else
											{
												$query=preg_replace(
													"/{$key}[ ]*([!><=]+)[ ]*([^ \)]+)/u",
													'count(array_filter($values["'.$table.'"]["value"],function($values){return $values["'.$key.'"]["value"]$1$2;}))>0',
													$query
												);
											}
										}
										break;
									case "datetime":
										$tablevalue='$values["'.$table.'"]["value"]';
										$fieldvalue='$values["'.$key.'"]["value"]';
										if (preg_match("/{$key}[ ]*([!><=]+)[ ]*TODAY\(\)/u",$query))
										{
											$query=preg_replace(
												"/{$key}[ ]*>[ ]*TODAY\(\)/u",
												'count(array_filter('.$tablevalue.',function($values) use ($me){return '.$fieldvalue.' >= FROM_TODAY("1","day","datetime");}))>0',
												$query
											);
											$query=preg_replace(
												"/{$key}[ ]*>=[ ]*TODAY\(\)/u",
												'count(array_filter('.$tablevalue.',function($values) use ($me){return '.$fieldvalue.' >= TODAY("datetime");}))>0',
												$query
											);
											$query=preg_replace(
												"/{$key}[ ]*<[ ]*TODAY\(\)/u",
												'count(array_filter('.$tablevalue.',function($values) use ($me){return '.$fieldvalue.' < TODAY("datetime");}))>0',
												$query
											);
											$query=preg_replace(
												"/{$key}[ ]*<=[ ]*TODAY\(\)/u",
												'count(array_filter('.$tablevalue.',function($values) use ($me){return '.$fieldvalue.' < FROM_TODAY("1","day","datetime");}))>0',
												$query
											);
											$query=preg_replace(
												"/{$key}[ ]*!=[ ]*TODAY\(\)/u",
												'count(array_filter('.$tablevalue.',function($values) use ($me){return ('.$fieldvalue.' < TODAY("datetime") or '.$fieldvalue.' >= FROM_TODAY("1","day","datetime"));}))>0',
												$query
											);
											$query=preg_replace(
												"/{$key}[ ]*=[ ]*TODAY\(\)/u",
												'count(array_filter('.$tablevalue.',function($values) use ($me){return ('.$fieldvalue.' >= TODAY("datetime") and '.$fieldvalue.' < FROM_TODAY("1","day","datetime"));}))>0',
												$query
											);
										}
										else
										{
											if (preg_match("/{$key}[ ]*([!><=]+)[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",$query))
											{
												$query=preg_replace(
													"/{$key}[ ]*>[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",
													'count(array_filter('.$tablevalue.',function($values) use ($me){return '.$fieldvalue.' >= FROM_$1($2,"datetime","1");}))>0',
													$query
												);
												$query=preg_replace(
													"/{$key}[ ]*>=[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",
													'count(array_filter('.$tablevalue.',function($values) use ($me){return '.$fieldvalue.' >= FROM_$1($2,"datetime");}))>0',
													$query
												);
												$query=preg_replace(
													"/{$key}[ ]*<[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",
													'count(array_filter('.$tablevalue.',function($values) use ($me){return '.$fieldvalue.' < FROM_$1($2,"datetime");}))>0',
													$query
												);
												$query=preg_replace(
													"/{$key}[ ]*<=[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",
													'count(array_filter('.$tablevalue.',function($values) use ($me){return '.$fieldvalue.' < FROM_$1($2,"datetime","1");}))>0',
													$query
												);
												$query=preg_replace(
													"/{$key}[ ]*!=[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",
													'count(array_filter('.$tablevalue.',function($values) use ($me){return ('.$fieldvalue.' < FROM_$1($2,"datetime") or '.$fieldvalue.' >= FROM_$1($2,"datetime","1"));}))>0',
													$query
												);
												$query=preg_replace(
													"/{$key}[ ]*=[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",
													'count(array_filter('.$tablevalue.',function($values) use ($me){return ('.$fieldvalue.' >= FROM_$1($2,"datetime") and '.$fieldvalue.' < FROM_$1($2,"datetime","1"));}))>0',
													$query
												);
											}
											else
											{
												$query=preg_replace(
													"/{$key}[ ]*([!><=]+)[ ]*([^ \)]+)/u",
													'count(array_filter('.$tablevalue.',function($values){return '.$fieldvalue.'$1$2;}))>0',
													$query
												);
											}
										}
										break;
									case "file":
										$replacement='$me->FILTER_FILE($values["'.$key.'"]["value"],\'$1\',\'$2\')';
										$query=preg_replace(
											"/{$key}[ ]*( not like | like )[ ]*\"([^\"]*)\"/u",
											'count(array_filter($values["'.$table.'"]["value"],function($values) use ($me){return '.$replacement.';}))>0',
											$query
										);
										break;
									case "lookup":
										$query=preg_replace(
											"/{$key}[ ]*([!><=]+| not like | like )[ ]*([^ \)]+)/u",
											'count(array_filter($values["'.$table.'"]["value"],function($values){return $values["'.$key.'"]["search"]$1$2;}))>0',
											$query
										);
										break;
									case "number":
										if (preg_match("/{$key}[ ]*([!><=]+)[ ]*[\"]{1}[0-9-]*[\"]{1}/u",$query))
										{
											$query=preg_replace(
												"/({$key})[ ]*([!><=]+)[ ]*[\"]{1}([0-9-]*)[\"]{1}/u",
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
											'count(array_filter($values["'.$table.'"]["value"],function($values){return $values["'.$key.'"]["value"]$1$2;}))>0',
											$query
										);
										break;
									case "user":
										$replacement='$me->FILTER_USER($values["'.$key.'"]["value"],\'$1\',[$2])';
										$query=preg_replace(
											"/{$key}[ ]*( not in | in )[ ]*\(([^\)]*)\)/u",
											'count(array_filter($values["'.$table.'"]["value"],function($values) use ($me){return '.$replacement.';}))>0',
											$query
										);
										break;
									default:
										$query=preg_replace(
											"/{$key}[ ]*([!><=]+| not like | like )[ ]*([^ \)]+)/u",
											'count(array_filter($values["'.$table.'"]["value"],function($values){return $values["'.$key.'"]["value"]$1$2;}))>0',
											$query
										);
										$query=preg_replace(
											"/{$key}[ ]*( not in | in )[ ]*\(([^\)]*)\)/u",
											'count(array_filter($values["'.$table.'"]["value"],function($values){return $values["'.$key.'"]["value"]$1($2);}))>0',
											$query
										);
										break;
								}
							}
							break;
						case "user":
							$query=preg_replace(
								"/{$key}[ ]*( not in | in )[ ]*\(([^\)]*)\)/u",
								'$me->FILTER_USER($values["'.$key.'"]["value"],\'$1\',[$2])',
								$query
							);
							break;
						default:
							$query=preg_replace("/(^|[ \(]{1}){$key}/u",'$1$values["'.$key.'"]["value"]',$query);
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
							'$values["'.$key.'"]["value"] >= FROM_TODAY("1","day","datetime")',
							$query
						);
						$query=preg_replace(
							"/{$key}[ ]*>=[ ]*TODAY\(\)/u",
							'$values["'.$key.'"]["value"] >= TODAY("datetime")',
							$query
						);
						$query=preg_replace(
							"/{$key}[ ]*<[ ]*TODAY\(\)/u",
							'$values["'.$key.'"]["value"] < TODAY("datetime")',
							$query
						);
						$query=preg_replace(
							"/{$key}[ ]*<=[ ]*TODAY\(\)/u",
							'$values["'.$key.'"]["value"] < FROM_TODAY("1","day","datetime")',
							$query
						);
						$query=preg_replace(
							"/{$key}[ ]*!=[ ]*TODAY\(\)/u",
							'($values["'.$key.'"]["value"] < TODAY("datetime") or $values["'.$key.'"]["value"] >= FROM_TODAY("1","day","datetime"))',
							$query
						);
						$query=preg_replace(
							"/{$key}[ ]*=[ ]*TODAY\(\)/u",
							'($values["'.$key.'"]["value"] >= TODAY("datetime") and $values["'.$key.'"]["value"] < FROM_TODAY("1","day","datetime"))',
							$query
						);
					}
					else
					{
						if (preg_match("/{$key}[ ]*([!><=]+)[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",$query))
						{
							$query=preg_replace(
								"/{$key}[ ]*>[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",
								'$values["'.$key.'"]["value"] >= FROM_$1($2,"datetime","1")',
								$query
							);
							$query=preg_replace(
								"/{$key}[ ]*>=[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",
								'$values["'.$key.'"]["value"] >= FROM_$1($2,"datetime")',
								$query
							);
							$query=preg_replace(
								"/{$key}[ ]*<[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",
								'$values["'.$key.'"]["value"] < FROM_$1($2,"datetime")',
								$query
							);
							$query=preg_replace(
								"/{$key}[ ]*<=[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",
								'$values["'.$key.'"]["value"] < FROM_$1($2,"datetime","1")',
								$query
							);
							$query=preg_replace(
								"/{$key}[ ]*!=[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",
								'($values["'.$key.'"]["value"] < FROM_$1($2,"datetime") or $values["'.$key.'"]["value"] >= FROM_$1($2,"datetime","1"))',
								$query
							);
							$query=preg_replace(
								"/{$key}[ ]*=[ ]*FROM_([^\(]+)\(([^\)]+)\)/u",
								'($values["'.$key.'"]["value"] >= FROM_$1($2,"datetime") and $values["'.$key.'"]["value"] < FROM_$1($2,"datetime","1"))',
								$query
							);
						}
						else $query=preg_replace("/{$key}/u",'$values["'.$key.'"]["value"]',$query);
					}
				}
				foreach ($reserved["id"] as $key)
				{
					if (preg_match("/{$key}[ ]*([!><=]+)[ ]*[\"]{1}[0-9-]*[\"]{1}/u",$query))
					{
						$query=preg_replace(
							"/({$key})[ ]*([!><=]+)[ ]*[\"]{1}([0-9-]*)[\"]{1}/u",
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
						"/{$key}[ ]*( not in | in )[ ]*\(([^\)]*)\)/u",
						'$me->FILTER_USER($values["'.$key.'"]["value"],\'$1\',[$2])',
						$query
					);
				}
				if ($arg_operator!="") $query=preg_replace("/\"LOGIN_USER\"/u",'"'.$arg_operator.'"',$query);
				$query=preg_replace("/(^|[ \(]{1})__id/u",'$1$values["__id"]["value"]',$query);
				$query=preg_replace("/ and /u"," && ",$query);
				$query=preg_replace("/ or /u"," || ",$query);
				$query=preg_replace("/([^!><]{1})=/u","$1==",$query);
				$query=preg_replace("/([^_]{1})TODAY\(/u","$1\$me->TODAY(",$query);
				$query=preg_replace("/[ ]*FROM_/u"," \$me->FROM_",$query);
				$query=preg_replace("/([^ \(]+)[ ]+not in[ ]+\(([^\)]*)\)/u","!in_array($1,[$2],true)",$query);
				$query=preg_replace("/([^ \(]+)[ ]+in[ ]+\(([^\)]*)\)/u","in_array($1,[$2],true)",$query);
				$query=preg_replace("/([^ \(]+)[ ]+not like[ ]+\"([^\"]+)\"/u","!preg_match(\"/$2/u\",$1)",$query);
				$query=preg_replace("/([^ \(]+)[ ]+like[ ]+\"([^\"]+)\"/u","preg_match(\"/$2/u\",$1)",$query);
				$query=preg_replace("/([^ \(]+)[ ]+not like[ ]+\"\"/u","$1 != \"\"",$query);
				$query=preg_replace("/([^ \(]+)[ ]+like[ ]+\"\"/u","$1 == \"\"",$query);
			}
			return array_filter($arg_source,function($values,$key) use ($query,$me){
				$values["__id"]=["value"=>intval($key)];
				return ($query!="")?eval("return {$query};"):true;
			},ARRAY_FILTER_USE_BOTH);
		}
		catch (ParseError $e)
		{
			throw new Exception("Your query is incorrect");
		}
		finally
		{
			restore_error_handler();
		}
	}
	/* insert */
	public function insert($arg_file,$arg_records,$arg_operator)
	{
		$file=$this->dir."{$arg_file}.json";
		$source=[];
		try
		{
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
			$fields=$this->fields($arg_file);
			foreach ($arg_records as $record)
			{
				$timezone=new DateTimeZone($this->timezone);
				$now=new DateTime("now",$timezone);
				$time=$now->modify(strval($timezone->getOffset($now)*-1)." second")->format("Y-m-d\TH:i:s")."Z";
				$this->resultid++;
				$build=$this->build([],$record,$fields,$source);
				$build["__creator"]=["value"=>[$arg_operator]];
				$build["__createdtime"]=["value"=>$time];
				$build["__modifier"]=["value"=>[$arg_operator]];
				$build["__modifiedtime"]=["value"=>$time];
				$source[strval($this->resultid)]=$build;
				$this->resultnumbers[strval($this->resultid)]=$build["__autonumber"]["value"];
			}
			file_put_contents($file,json_encode($source));
			return true;
		}
		catch (Exception $e)
		{
			$this->resulterror=$e->getMessage();
			return false;
		}
	}
	public function insertid()
	{
		return $this->resultid;
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
		$file=$this->dir."{$arg_file}.json";
		try
		{
			$this->resultid=0;
			$this->resultnumbers=[];
			if (file_exists($file))
			{
				$error="";
				$source=json_decode(mb_convert_encoding(file_get_contents($file),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),true);
				if (is_array($source))
				{
					$fields=$this->fields($arg_file);
					foreach ($arg_records as $record)
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
							$build["__modifier"]=["value"=>[$arg_operator]];
							$build["__modifiedtime"]=["value"=>$time];
							$source[strval($this->resultid)]=$build;
							$this->resultnumbers[strval($this->resultid)]=$build["__autonumber"]["value"];
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
	}
	/* filter functions */
	public function FILTER_FILE($arg_field,$arg_operator,$arg_value)
	{
		$res=false;
		switch ($arg_operator)
		{
			case ' not like ':
				if (count($arg_field)>0) $res=$this->FILTER_FILE_COUNT($arg_field,$arg_value)==0;
				else $res=($arg_value!="");
				break;
			case ' like ':
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
			case ' not in ':
				if (count($arg_field)>0) $res=$this->FILTER_MULTIPLE_COUNT($arg_field,$arg_value)==0;
				else $res=count($arg_value)!=0;
				break;
			case ' in ':
				if (count($arg_field)>0) $res=$this->FILTER_MULTIPLE_COUNT($arg_field,$arg_value)>0;
				else $res=count($arg_value)==0;
				break;
		}
		return $res;
	}
	public function FILTER_MULTIPLE_COUNT($arg_field,$arg_value)
	{
		return count(array_filter($arg_field,function($value) use ($arg_value){return in_array($value,$arg_value,true);}));
	}
	public function FILTER_USER($arg_field,$arg_operator,$arg_value)
	{
		$res=false;
		switch ($arg_operator)
		{
			case ' not in ':
				if (count($arg_field)>0) $res=$this->FILTER_USER_COUNT($arg_field,$arg_value)==0;
				else $res=count($arg_value)!=0;
				break;
			case ' in ':
				if (count($arg_field)>0) $res=$this->FILTER_USER_COUNT($arg_field,$arg_value)>0;
				else $res=count($arg_value)==0;
				break;
		}
		return $res;
	}
	public function FILTER_USER_COUNT($arg_field,$arg_value)
	{
		$result=0;
		$groups=[];
		$organizations=[];
		$users=[];
		foreach ($arg_value as $value)
			switch (substr($value,0,1))
			{
				case "g":
					$groups[]=substr($value,1);
					break;
				case "o":
					$organizations[]=substr($value,1);
					break;
				default:
					$users[]=$value;
					break;
			}
		foreach ($arg_field as $field)
			if (array_key_exists($field,$this->users))
			{
				$result+=count(array_filter($this->users[$field]["group"]["value"],function($value) use ($groups){return in_array($value,$groups,true);}));
				$result+=count(array_filter($this->users[$field]["organization"]["value"],function($value) use ($organizations){return in_array($value,$organizations,true);}));
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