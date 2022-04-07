<?php
/*
* PandaFirm-PHP-Module "config.php"
* Version: 1.0
* Copyright (c) 2020 TIS
* Released under the MIT License.
* http://pandafirm.jp/license.txt
*/
require_once(dirname(__FILE__)."/lib/base.php");
class clsRequest extends clsBase
{
	/* valiable */
	private $body;
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
			file_put_contents($file,json_encode($this->body->{"config"},JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT));
			if ($this->body->{"type"}!="mgt")
				if ($this->body->{"app"}!="")
				{
					switch ($this->body->{"type"})
					{
						case "upd":
							if (substr(php_uname(),0,7)=="Windows") pclose(popen("start /B php config_processing.php ".$this->body->{"app"},"r"));
							else exec("nohup php config_processing.php ".$this->body->{"app"}." > /dev/null &");
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
}
$cls_request=new clsRequest();
$cls_request->checkmethod();
?>
