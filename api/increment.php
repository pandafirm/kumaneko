<?php
/*
* PandaFirm-PHP-Module "increment.php"
* Version: 1.2.5
* Copyright (c) 2020 Pandafirm LLC
* Distributed under the terms of the GNU Lesser General Public License.
* https://opensource.org/licenses/LGPL-2.1
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
		$this->callrequesterror(400);
	}
	protected function PUT()
	{
		$this->body=json_decode(mb_convert_encoding(file_get_contents('php://input'),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),true);
		if (!isset($this->body["target"])) $this->callrequesterror(400);
		else
		{
			$file=dirname(__FILE__)."/storage/json/config.json";
			$this->response=json_decode(mb_convert_encoding(file_get_contents($file),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'));
			$this->response->{"increments"}->{$this->body["target"]}++;
			file_put_contents($file,json_encode($this->response,JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT));
			header("HTTP/1.1 200 OK");
			header('Content-Type: application/json; charset=utf-8');
			echo json_encode(["id"=>$this->response->{"increments"}->{$this->body["target"]}],JSON_UNESCAPED_UNICODE);
			exit(0);
		}
	}
	protected function DELETE()
	{
		$this->callrequesterror(400);
	}
}
$cls_request=new clsRequest();
$cls_request->checkmethod();
?>
