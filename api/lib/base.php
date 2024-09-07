<?php
/*
* PandaFirm-PHP-Module "base.php"
* Version: 1.7.1
* Copyright (c) 2020 Pandafirm LLC
* Distributed under the terms of the GNU Lesser General Public License.
* https://opensource.org/licenses/LGPL-2.1
*/
if (session_status()===PHP_SESSION_NONE) session_start();
class RequestError extends Exception{
	public $response="";
	public function __construct($arg_message,$arg_code=0)
	{
		parent::__construct($arg_message,$arg_code);
		$this->response=$arg_message;
	}
}
set_exception_handler(function($arg_exception){
	if ($arg_exception instanceof RequestError)
	{
		$message=sprintf("%d %s",$arg_exception->getCode(),$arg_exception->getMessage());
		header(sprintf("HTTP/1.1 %s",$message));
		header('Content-Type: application/json; charset=utf-8');
		echo json_encode(["message"=>$arg_exception->response,"error"=>["message"=>$arg_exception->response]],JSON_UNESCAPED_UNICODE);
	}
	else
	{
		header("HTTP/1.1 500 Internal Server Error");
		header('Content-Type: application/json; charset=utf-8');
		echo json_encode(["message"=>$arg_exception->getMessage(),"error"=>["message"=>$arg_exception->getMessage()]],JSON_UNESCAPED_UNICODE);
	}
	exit(0);
});
set_error_handler(function($arg_errno,$arg_errstr,$arg_errfile,$arg_errline){
	header("HTTP/1.1 {$arg_errno} Fatal Error");
	header('Content-Type: application/json; charset=utf-8');
	echo json_encode(["message"=>$arg_errstr,"error"=>["message"=>$arg_errstr]],JSON_UNESCAPED_UNICODE);
	exit(0);
});
abstract class clsBase
{
	protected $operator;
	abstract protected function GET();
	abstract protected function POST();
	abstract protected function PUT();
	abstract protected function DELETE();
	public function callrequesterror($arg_code,$arg_message="")
	{
		switch ($arg_code)
		{
			case 400:
				throw new RequestError((($arg_message==="")?"Bad Request":$arg_message),$arg_code);
				break;
			case 401:
				throw new RequestError((($arg_message==="")?"Unauthorized":$arg_message),$arg_code);
				break;
			case 404:
				throw new RequestError((($arg_message==="")?"Not Found":$arg_message),$arg_code);
				break;
			case 405:
				throw new RequestError((($arg_message==="")?"Method Not Allowed":$arg_message),$arg_code);
				break;
			case 405:
				throw new RequestError((($arg_message==="")?"Method Not Allowed":$arg_message),$arg_code);
				break;
			case 500:
				throw new RequestError((($arg_message==="")?"Internal Server Error":$arg_message),$arg_code);
				break;
			case 503:
				throw new RequestError((($arg_message==="")?"Service Unavailable":$arg_message),$arg_code);
				break;
		}
	}
	public function checkmethod()
	{
		if ($_SERVER["REQUEST_METHOD"]!="OPTIONS")
		{
			if (!isset($_SERVER['HTTP_X_AUTHORIZATION']) && !isset($_SESSION['PD_AUTH_TOKEN'])) $this->callrequesterror(500,"Authorization failed");
			else
			{
				$token=explode(":",base64_decode(isset($_SERVER['HTTP_X_AUTHORIZATION'])?$_SERVER['HTTP_X_AUTHORIZATION']:$_SESSION['PD_AUTH_TOKEN']));
				if (count($token)==2)
				{
					if (file_exists(dirname(__DIR__)."/storage/json/users.json"))
					{
						$account=$token[0];
						$pwd=$token[1];
						$users=json_decode(mb_convert_encoding(file_get_contents(dirname(__DIR__)."/storage/json/users.json"),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),true);
						$users=array_filter($users,function($values,$key) use ($account,$pwd){
							return $values["account"]["value"]==$account && $values["pwd"]["value"]==$pwd && $values["available"]["value"]=="available";
						},ARRAY_FILTER_USE_BOTH);
						if (count($users)==1)
						{
							$this->operator=array_key_first($users);
							switch ($_SERVER["REQUEST_METHOD"])
							{
								case "GET":
									$this->GET();
									break;
								case "POST":
									$this->POST();
									break;
								case "PUT":
									$this->PUT();
									break;
								case "DELETE":
									$this->DELETE();
									break;
							}
						}
						else $this->callrequesterror(500,"Authentication information is incorrect");
					}
					else $this->callrequesterror(500,"User is not registered");
				}
				else $this->callrequesterror(500,"Authorization failed");
			}
		}
	}
	public function assign($arg_src,$arg_assigns,$arg_layout=false)
	{
		if (!file_exists($arg_src)) return "File does not exist : {$arg_src}";
		$res=file_get_contents($arg_src);
		if ($res)
		{
			if (!$arg_layout) $res=preg_replace("/\n|\r|\r\n/","",$res);
			foreach ($arg_assigns as $key=>$value)
				if (!is_array($value))
				{
					$pattern=preg_quote("<!-- [@{$key}] -->");
					$res=preg_replace("/{$pattern}/s",$value,$res);
				}
			return $res;
		}
		else return "";
	}
	public function assign_pipe($arg_src,$arg_assigns,$arg_layout=false)
	{
		$res=$arg_src;
		if (!$arg_layout) $res=preg_replace("/\n|\r|\r\n/","",$res);
		foreach ($arg_assigns as $key=>$value)
		{
			$pattern=preg_quote("<!-- [@{$key}] -->");
			$res=preg_replace("/{$pattern}/s",$value,$res);
		}
		return $res;
	}
	public function hexcolor($arg_hex)
	{
		$res="";
		switch (strlen($arg_hex))
		{
			case 3:
				foreach (str_split($arg_hex) as $value) $res.=hexdec($value.$value).",";
				$res=preg_replace("/,$/","",$res);
				break;
			case 6:
				foreach (str_split($arg_hex,2) as $value) $res.=hexdec($value).",";
				$res=preg_replace("/,$/","",$res);
				break;
		}
		return $res;
	}
	public function issue($arg_src)
	{
		print<<<EOF
{$arg_src}
EOF;
	}
}
?>