<?php
/*
* PandaFirm-PHP-Module "records.php"
* Version: 1.0
* Copyright (c) 2020 TIS
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
		if (isset($this->body["id"]))
		{
			$this->response["record"]=$this->driver->record(
				$this->body["app"],
				$this->body["id"]
			);
			$this->response["total"]=$this->driver->recordcount();
			if (!is_array($this->response["record"])) $this->callrequesterror(500,$this->driver->queryerror());
		}
		if (isset($this->body["query"]))
		{
			$this->response["records"]=$this->driver->records(
				$this->body["app"],
				mb_convert_encoding($this->body["query"],'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),
				(isset($this->body["sort"]))?$this->body["sort"]:"",
				(isset($this->body["offset"]))?$this->body["offset"]:0,
				(isset($this->body["limit"]))?$this->body["limit"]:0,
				$this->operator
			);
			$this->response["total"]=$this->driver->recordcount();
			if (!is_array($this->response["records"])) $this->callrequesterror(500,$this->driver->queryerror());
		}
		if (!array_key_exists("record",$this->response) && !array_key_exists("records",$this->response)) $this->callrequesterror(400);
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
		if ($this->driver->insert($this->body["app"],$this->body["records"],$this->operator))
		{
			$this->response["id"]=$this->driver->insertid();
			$this->response["autonumbers"]=$this->driver->autonumbers();
			header("HTTP/1.1 200 OK");
			header('Content-Type: application/json; charset=utf-8');
			echo json_encode($this->response,JSON_UNESCAPED_UNICODE);
			exit(0);
		}
		else $this->callrequesterror(500,$this->driver->queryerror());
	}
	protected function PUT()
	{
		$this->body=json_decode(mb_convert_encoding(file_get_contents('php://input'),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),true);
		$this->driver=new clsDriver(dirname(__FILE__)."/storage/json/",isset($this->body["timezone"])?$this->body["timezone"]:date_default_timezone_get());
		if (!isset($this->body["app"])) $this->callrequesterror(400);
		if (!isset($this->body["records"])) $this->callrequesterror(400);
		if ($this->driver->update($this->body["app"],$this->body["records"],$this->operator))
		{
			$this->response["autonumbers"]=$this->driver->autonumbers();
			header("HTTP/1.1 200 OK");
			header('Content-Type: application/json; charset=utf-8');
			echo json_encode($this->response,JSON_UNESCAPED_UNICODE);
			exit(0);
		}
		else $this->callrequesterror(500,$this->driver->queryerror());
	}
	protected function DELETE()
	{
		$this->body=json_decode(mb_convert_encoding(file_get_contents('php://input'),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),true);
		$this->driver=new clsDriver(dirname(__FILE__)."/storage/json/",isset($this->body["timezone"])?$this->body["timezone"]:date_default_timezone_get());
		if (!isset($this->body["app"])) $this->callrequesterror(400);
		if (isset($this->body["id"]))
		{
			if ($this->driver->delete($this->body["app"],$this->body["id"]))
			{
				header("HTTP/1.1 200 OK");
				header('Content-Type: application/json; charset=utf-8');
				echo json_encode($this->response,JSON_UNESCAPED_UNICODE);
				exit(0);
			}
			else $this->callrequesterror(500,$this->driver->queryerror());
		}
		if (isset($this->body["query"]))
		{
			if ($this->driver->deletes($this->body["app"],mb_convert_encoding($this->body["query"],'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),$this->operator))
			{
				header("HTTP/1.1 200 OK");
				header('Content-Type: application/json; charset=utf-8');
				echo json_encode($this->response,JSON_UNESCAPED_UNICODE);
				exit(0);
			}
			else $this->callrequesterror(500,$this->driver->queryerror());
		}
		if (isset($this->body["truncate"]))
		{
			if ($this->driver->truncate($this->body["app"]))
			{
				header("HTTP/1.1 200 OK");
				header('Content-Type: application/json; charset=utf-8');
				echo json_encode($this->response,JSON_UNESCAPED_UNICODE);
				exit(0);
			}
			else $this->callrequesterror(500,$this->driver->queryerror());
		}
		$this->callrequesterror(400);
	}
}
$cls_request=new clsRequest();
$cls_request->checkmethod();
?>
