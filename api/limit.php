<?php
/*
* PandaFirm-PHP-Module "limit.php"
* Version: 1.2.1
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
		$this->body=$_GET;
		if (!isset($this->body["option"])) $this->callrequesterror(400);
		preg_match("/([0-9]+)[\s]*([a-zA-Z]+)/",trim(ini_get($this->body["option"])),$matches);
		$size=(isset($matches[1]))?intval($matches[1]):0;
		$metric=(isset($matches[2]))?strtolower($matches[2]):"b";
		switch($metric)
		{
			case "t":
			case "tb":
				$size*=1024;
			case "g":
			case "gb":
				$size*=1024;
			case "m":
			case "mb":
				$size*=1024;
			case "k":
			case "kb":
				$size*=1024;
		}
		$this->response["size"]=$size;
		$this->response["value"]=trim(ini_get($this->body["option"]));
		header("HTTP/1.1 200 OK");
		header('Content-Type: application/json; charset=utf-8');
		echo json_encode($this->response,JSON_UNESCAPED_UNICODE);
		exit(0);
	}
	protected function POST()
	{
		$this->callrequesterror(400);
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
