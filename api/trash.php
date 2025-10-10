<?php
/*
* PandaFirm-PHP-Module "trash.php"
* Version: 2.0.0
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
		$this->driver=new clsDriver(dirname(__FILE__)."/storage/json/",isset($this->body["timezone"])?$this->body["timezone"]:date_default_timezone_get());
		if (!isset($this->body["app"])) $this->callrequesterror(400);
		$this->response["records"]=$this->driver->records($this->body["app"]."_trash","","",0,0,$this->operator);
		$this->response["total"]=$this->driver->recordcount();
		if (!is_array($this->response["records"])) $this->callrequesterror(500,$this->driver->queryerror());
		header("HTTP/1.1 200 OK");
		header('Content-Type: application/json; charset=utf-8');
		echo json_encode($this->response,JSON_UNESCAPED_UNICODE);
		exit(0);
	}
	protected function POST()
	{
		$this->body=json_decode(mb_convert_encoding(file_get_contents('php://input'),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),true);
		$this->driver=new clsDriver(dirname(__FILE__)."/storage/json/",isset($this->body["timezone"])?$this->body["timezone"]:date_default_timezone_get());
		if (!isset($this->body["app"])) $this->callrequesterror(400);
		if (!isset($this->body["records"])) $this->callrequesterror(400);
		if (!isset($this->body["indexes"])) $this->callrequesterror(400);
		if ($this->driver->insert($this->body["app"],$this->body["records"],$this->operator))
		{
			$this->response["id"]=$this->driver->insertid();
			$this->response["autonumbers"]=$this->driver->autonumbers();
			try
			{
				$trash=dirname(__FILE__)."/storage/json/".$this->body["app"]."_trash.json";
				if (file_exists($trash))
				{
					$source=json_decode(mb_convert_encoding(file_get_contents($trash),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),true);
					if (is_array($source))
					{
						foreach ($source as $key=>$value) if (in_array($key,$this->body["indexes"])) unset($source[$key]);
						if (!is_array($source)) $source=[];
					}
					else $source=[];
					file_put_contents($trash,json_encode($source));
				}
			}
			catch (Exception $e)
			{
				$this->callrequesterror(500,$e->getMessage());
			}
			header("HTTP/1.1 200 OK");
			header('Content-Type: application/json; charset=utf-8');
			echo json_encode($this->response,JSON_UNESCAPED_UNICODE);
			exit(0);
		}
		else $this->callrequesterror(500,$this->driver->queryerror());
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
