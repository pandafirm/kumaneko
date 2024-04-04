<?php
/*
* PandaFirm-PHP-Module "config.php"
* Version: 1.6.1
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
	private $project;
	private $response;
	/* constructor */
	public function __construct()
	{
		$this->response=[];
	}
	/* methods */
	protected function GET()
	{
		$this->body=$_GET;
		if (!isset($this->body["verify"]))
		{
			$file=dirname(__FILE__)."/storage/json/config.json";
			if (file_exists($file))
			{
				$this->response["file"]=json_decode(mb_convert_encoding(file_get_contents($file),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'));
				if (is_array($this->response["file"]->apps->user)) $this->response["file"]->apps->user=json_decode("{}");
				else
				{
					$modified=(!file_exists("modified.txt"))?"":file_get_contents("modified.txt");
					$version=(!file_exists("ver.txt"))?"1.0.0":file_get_contents("ver.txt");
					if ($modified!=$version)
					{
						$update=false;
						foreach ($this->response["file"]->apps->user as $key=>$value)
						{
							foreach ($value->fields as $fieldkey=>$fieldvalue)
							{
								switch ($fieldvalue->type)
								{
									case "lookup":
										if (!property_exists($fieldvalue,"table"))
										{
											$fieldvalue->table=[];
											$update=true;
										}
										break;
									case "table":
										foreach ($fieldvalue->fields as $tablekey=>$tablevalue)
										{
											switch ($tablevalue->type)
											{
												case "lookup":
													if (!property_exists($tablevalue,"table"))
													{
														$tablevalue->table=[];
														$update=true;
													}
													break;
											}
										}
										break;
								}
							}
							$value->actions=array_map(function($item) use (&$update){
								switch ($item->trigger)
								{
									case "button":
										if (!property_exists($item,"rows"))
										{
											$item->rows=["del"=>[],"fill"=>[]];
											$update=true;
										}
										if (!property_exists($item->mail,"format"))
										{
											$item->mail->format="html";
											$update=true;
										}
										break;
									case "value":
										if (!property_exists($item,"rows"))
										{
											$item->rows=["del"=>[],"fill"=>[]];
											$update=true;
										}
										if (!property_exists($item,"option"))
										{
											$item->option=[];
											$update=true;
										}
										break;
								}
								return $item;
							},$value->actions);
							$value->linkages=array_map(function($item) use (&$update){
								if (!property_exists($item,"bulk"))
								{
									$item->bulk=["enable"=>false,"caption"=>"","message"=>""];
									$update=true;
								}
								return $item;
							},$value->linkages);
							$value->views=array_map(function($item) use (&$update){
								switch ($item->type)
								{
									case "edit":
									case "list":
										if (!property_exists($item,"skip"))
										{
											$item->skip=false;
											$update=true;
										}
										break;
								}
								return $item;
							},$value->views);
							if (!property_exists($value,"injectors"))
							{
								$value->injectors=[];
								$update=true;
							}
						}
						foreach ($this->response["file"]->apps->system as $key=>$value)
						{
							switch ($key)
							{
								case "project":
									if (!property_exists($value->fields,"cli_path"))
									{
										$value->fields->cli_path=[
											"id"=>"cli_path",
											"type"=>"text",
											"caption"=>"The path to your PHP CLI binary",
											"required"=>false,
											"nocaption"=>false,
											"format"=>"text"
										];
										$value->layout[0]->rows[0]->fields[]="cli_path";
										$update=true;
										file_put_contents(dirname(__FILE__)."/storage/json/project.json",json_encode((function($project){
											$project["1"]["cli_path"]=["value"=>""];
											return $project;
										})(json_decode(mb_convert_encoding(file_get_contents(dirname(__FILE__)."/storage/json/project.json"),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),true))));
									}
									if (!property_exists($value->fields,"mapid"))
									{
										$value->fields->mapid=[
											"id"=>"mapid",
											"type"=>"text",
											"caption"=>"Map ID",
											"required"=>false,
											"nocaption"=>false,
											"format"=>"text"
										];
										array_splice($value->layout[1]->rows[0]->fields,1,0,"mapid");
										$update=true;
										file_put_contents(dirname(__FILE__)."/storage/json/project.json",json_encode((function($project){
											$project["1"]["mapid"]=["value"=>""];
											return $project;
										})(json_decode(mb_convert_encoding(file_get_contents(dirname(__FILE__)."/storage/json/project.json"),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),true))));
									}
									break;
								case "users":
									if (!in_array("Guest",array_column(array_column($value->fields->authority->options,"option"),"value")))
									{
										$value->fields->authority->options[]=["option"=>["value"=>"Guest"]];
										$update=true;
									}
									break;
							}
							if (!property_exists($value,"injectors"))
							{
								$value->injectors=[];
								$update=true;
							}
						}
						if (!property_exists($this->response["file"]->increments,"injector"))
						{
							$this->response["file"]->increments->injector=0;
							$update=true;
						}
						if ($update) file_put_contents($file,json_encode($this->response["file"],JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT));
						file_put_contents(dirname(__FILE__)."/modified.txt",$version);
					}
				}
				header("HTTP/1.1 200 OK");
				header('Content-Type: application/json; charset=utf-8');
				echo json_encode($this->response,JSON_UNESCAPED_UNICODE);
				exit(0);
			}
			else $this->callrequesterror(400,"File does not exist");
		}
		else
		{
			if ($this->body["verify"]=="verify")
			{
				if (file_exists(dirname(__FILE__)."/config_processing.error"))
				{
					$error=file_get_contents(dirname(__FILE__)."/config_processing.error");
					if (file_exists(dirname(__FILE__)."/config_processing.error")) unlink(dirname(__FILE__)."/config_processing.error");
					if (file_exists(dirname(__FILE__)."/config_processing.txt")) unlink(dirname(__FILE__)."/config_processing.txt");
					$this->callrequesterror(500,$error);
				}
				else
				{
					$this->response["result"]=(file_exists(dirname(__FILE__)."/config_processing.txt"))?"ng":"ok";
					header("HTTP/1.1 200 OK");
					header('Content-Type: application/json; charset=utf-8');
					echo json_encode($this->response,JSON_UNESCAPED_UNICODE);
					exit(0);
				}
			}
			else $this->callrequesterror(400);
		}
	}
	protected function POST()
	{
		$this->callrequesterror(400);
	}
	protected function PUT()
	{
		$this->body=json_decode(mb_convert_encoding(file_get_contents('php://input'),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'));
		$this->driver=new clsDriver(dirname(__FILE__)."/storage/json/",isset($this->body->{"timezone"})?$this->body->{"timezone"}:date_default_timezone_get());
		$this->project=$this->driver->record("project","1");
		if (!isset($this->body->{"config"})) $this->callrequesterror(400);
		if (!isset($this->body->{"type"})) $this->callrequesterror(400);
		else
		{
			if ($this->body->{"type"}!="mgt")
				if (!isset($this->body->{"app"})) $this->callrequesterror(400);
		}
		if (file_exists(dirname(__FILE__)."/config_processing.txt")) $this->response["result"]="ng";
		else
		{
			$file=dirname(__FILE__)."/storage/json/config.json";
			if ($this->body->{"type"}!="mgt")
				if (file_exists($file))
				{
					$config=json_decode(mb_convert_encoding(file_get_contents($file),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'));
					$before=[];
					$after=[];
					foreach ($config->apps->user as $key=>$value)
						if (property_exists($value,"injectors"))
							foreach ($value->injectors as $injector) $before[]=["app"=>$value->id,"id"=>$injector->id,"directory"=>$injector->directory];
					foreach ($config->apps->system as $key=>$value)
						if (property_exists($value,"injectors"))
							foreach ($value->injectors as $injector) $before[]=["app"=>$value->id,"id"=>$injector->id,"directory"=>$injector->directory];
					foreach ($this->body->{"config"}->apps->user as $key=>$value)
						if (property_exists($value,"injectors"))
							foreach ($value->injectors as $injector) $after[]=["app"=>$value->id,"id"=>$injector->id,"directory"=>$injector->directory];
					foreach ($this->body->{"config"}->apps->system as $key=>$value)
						if (property_exists($value,"injectors"))
							foreach ($value->injectors as $injector) $after[]=["app"=>$value->id,"id"=>$injector->id,"directory"=>$injector->directory];
					$deletes=array_udiff($before,$after,function($a,$b){
						return strcmp(serialize($a),serialize($b));
					});
					$creates=array_udiff($after,$before,function($a,$b){
						return strcmp(serialize($a),serialize($b));
					});
					foreach ($deletes as $value)
						if (!in_array($value["directory"],["api","static"]))
							if ($value["directory"]!="")
							{
								$directory=dirname(__DIR__)."/".$value["directory"];
								if (is_dir($directory) && !is_link($directory)) $this->cleanup($directory);
							}
					foreach ($creates as $value)
						if (!in_array($value["directory"],["api","static"]))
							if ($value["directory"]!="")
							{
								$directory=dirname(__DIR__)."/".$value["directory"];
								mkdir($directory);
								chmod($directory,0755);
								file_put_contents($directory."/index.php",$this->assign(dirname(__FILE__)."/injector.txt",$value,true));
							}
				}
			file_put_contents($file,json_encode($this->body->{"config"},JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT));
			if ($this->body->{"type"}!="mgt")
				if ($this->body->{"app"}!="")
				{
					switch ($this->body->{"type"})
					{
						case "upd":
							(function($php,$body){
								if (substr(php_uname(),0,7)=="Windows") pclose(popen("start /B {$php} config_processing.php ".$body->{"app"},"r"));
								else exec("nohup {$php} config_processing.php ".$body->{"app"}." > /dev/null &");
							})(($this->project["cli_path"]["value"]=="")?"php":$this->project["cli_path"]["value"],$this->body);
							break;
						case "del":
							if (file_exists(dirname(__FILE__)."/storage/json/".$this->body->{"app"}.".json")) unlink(dirname(__FILE__)."/storage/json/".$this->body->{"app"}.".json");
							break;
					}
				}
			$this->response["result"]="ok";
		}
		header("HTTP/1.1 200 OK");
		header('Content-Type: application/json; charset=utf-8');
		echo json_encode($this->response,JSON_UNESCAPED_UNICODE);
		exit(0);
	}
	protected function DELETE()
	{
		$this->callrequesterror(400);
	}
	public function cleanup($arg_dir) {
		if (is_dir($arg_dir) && !is_link($arg_dir))
		{
			array_map(array($this,"cleanup"),glob("{$arg_dir}/*",GLOB_ONLYDIR));
			array_map("unlink",glob("{$arg_dir}/*"));
			rmdir($arg_dir);
		}
	}
}
$cls_request=new clsRequest();
$cls_request->checkmethod();
?>
