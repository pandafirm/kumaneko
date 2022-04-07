<?php
/*
* PandaFirm-PHP-Module "ws.php"
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
		$this->callrequesterror(400);
	}
	protected function POST()
	{
		$this->body=json_decode(mb_convert_encoding(file_get_contents('php://input'),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'));
		$protocol="http";
		$host=$_SERVER["SERVER_NAME"];
		$uri=((strlen($_SERVER['REQUEST_URI'])!=0)?preg_replace("/\/[^\/]+$/s","",preg_replace("/^\//s","",$_SERVER['REQUEST_URI'])):"");
		if (isset($_SERVER["HTTPS"]))
			if ($_SERVER["HTTPS"]=="on") $protocol="https";
		if (substr(php_uname(),0,7)=="Windows")
		{
			if (file_exists(dirname(__FILE__)."/socket/pid.txt"))
			{
				exec("tasklist /fi \"PID eq ".file_get_contents(dirname(__FILE__)."/socket/pid.txt")."\"",$output,$result);
				if (preg_match("/".file_get_contents(dirname(__FILE__)."/socket/pid.txt")."/u",end($output)))
				{
					$this->response["result"]="ok";
					header("HTTP/1.1 200 OK");
					header('Content-Type: application/json; charset=utf-8');
					echo json_encode($this->response,JSON_UNESCAPED_UNICODE);
					exit(0);
				}
			}
		}
		else
		{
			exec("ps aux | grep /socket/index.php",$output,$result);
			if (count($output)<2)
			{
				$this->response["result"]="ok";
				header("HTTP/1.1 200 OK");
				header('Content-Type: application/json; charset=utf-8');
				echo json_encode($this->response,JSON_UNESCAPED_UNICODE);
				exit(0);
			}
		}
		if (!extension_loaded("sockets"))
		{
			$this->response["result"]="You need to enable PHP extension socket [".((substr(php_uname(),0,7)=="Windows")?"php_sockets.dll":"socket.so")."]";
			header("HTTP/1.1 200 OK");
			header('Content-Type: application/json; charset=utf-8');
			echo json_encode($this->response,JSON_UNESCAPED_UNICODE);
			exit(0);
		}
		if (substr(php_uname(),0,7)=="Windows") pclose(popen("start /B php ./socket/index.php {$protocol} ".$host." ".$uri." 8025","r"));
		else exec("nohup php ./socket/index.php {$protocol} ".$host." ".$uri." 8025 > /dev/null &");
		$this->response["result"]="ok";
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
