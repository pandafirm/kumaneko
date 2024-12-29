<?php
/*
* PandaFirm-PHP-Module "cleanup.php"
* Version: 1.8.3
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
		if (!isset($this->body["verify"])) $this->callrequesterror(400);
		else
		{
			if ($this->body["verify"]=="verify")
			{
				if (file_exists(dirname(__FILE__)."/cleanup_processing.error"))
				{
					$error=file_get_contents(dirname(__FILE__)."/cleanup_processing.error");
					if (file_exists(dirname(__FILE__)."/cleanup_processing.error")) unlink(dirname(__FILE__)."/cleanup_processing.error");
					if (file_exists(dirname(__FILE__)."/cleanup_processing.txt")) unlink(dirname(__FILE__)."/cleanup_processing.txt");
					$this->callrequesterror(500,$error);
				}
				else
				{
					$this->response["result"]=(file_exists(dirname(__FILE__)."/cleanup_processing.txt"))?"ng":"ok";
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
		$this->body=json_decode(mb_convert_encoding(file_get_contents('php://input'),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),true);
		$this->driver=new clsDriver(dirname(__FILE__)."/storage/json/",isset($this->body["timezone"])?$this->body["timezone"]:date_default_timezone_get());
		$this->project=$this->driver->record("project","1");
		if (file_exists(dirname(__FILE__)."/cleanup_processing.txt")) $this->response["result"]="ng";
		else
		{
			(function($php){
				if (substr(php_uname(),0,7)=="Windows") pclose(popen("start /B {$php} cleanup_processing.php 0","r"));
				else exec("nohup {$php} cleanup_processing.php 0 > /dev/null &");
			})(($this->project["cli_path"]["value"]=="")?"php":$this->project["cli_path"]["value"]);
			$this->response["result"]="ok";
		}
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
}
$cls_request=new clsRequest();
$cls_request->checkmethod();
?>
