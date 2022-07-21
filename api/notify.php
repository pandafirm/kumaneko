<?php
/*
* PandaFirm-PHP-Module "notify.php"
* Version: 1.0
* Copyright (c) 2020 TIS
* Distributed under the terms of the GNU Lesser General Public License.
* http://www.gnu.org/copyleft/lesser.html
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
		$file=dirname(__FILE__)."/webpush/keys.json";
		if (file_exists($file))
		{
			$keys=json_decode(mb_convert_encoding(file_get_contents($file),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),true);
			if (is_array($keys))
			{
				$this->response["key"]=$keys["publicKey"];
				header("HTTP/1.1 200 OK");
				header('Content-Type: application/json; charset=utf-8');
				echo json_encode($this->response,JSON_UNESCAPED_UNICODE);
				exit(0);
			}
			else $this->callrequesterror(500,"Key file is corrupted");
		}
		else $this->callrequesterror(500,"Key file does not exist");
	}
	protected function POST()
	{
		$this->body=json_decode(mb_convert_encoding(file_get_contents('php://input'),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),true);
		if (!isset($this->body["endpoint"])) $this->callrequesterror(400);
		if (!isset($this->body["publicKey"])) $this->callrequesterror(400);
		if (!isset($this->body["authToken"])) $this->callrequesterror(400);
		$file=dirname(__FILE__)."/webpush/subscriptions.json";
		$endpoint=$this->body["endpoint"];
		$publicKey=$this->body["publicKey"];
		$authToken=$this->body["authToken"];
		$subscriptions=(file_exists($file))?json_decode(mb_convert_encoding(file_get_contents($file),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),true):[];
		if (count(array_filter($subscriptions,function($value) use ($endpoint,$publicKey,$authToken){return $value["endpoint"]==$endpoint && $value["publicKey"]==$publicKey && $value["authToken"]==$authToken;}))==0)
		{
			$subscriptions[]=[
				"endpoint"=>$endpoint,
				"publicKey"=>$publicKey,
				"authToken"=>$authToken
			];
			file_put_contents($file,json_encode($subscriptions));
		}
		header("HTTP/1.1 200 OK");
		header('Content-Type: application/json; charset=utf-8');
		echo json_encode($this->response,JSON_UNESCAPED_UNICODE);
		exit(0);
	}
	protected function PUT()
	{
		$this->body=json_decode(mb_convert_encoding(file_get_contents('php://input'),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),true);
		if (!isset($this->body["payload"])) $this->callrequesterror(400);
		if (!isset($this->body["subject"])) $this->callrequesterror(400);
		if (substr(php_uname(),0,7)=="Windows") pclose(popen("start /B php notify_processing.php ".$this->body["payload"]." ".$this->body["subject"],"r"));
		else exec("nohup php notify_processing.php ".$this->body["payload"]." ".$this->body["subject"]." > /dev/null &");
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
