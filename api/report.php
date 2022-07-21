<?php
/*
* PandaFirm-PHP-Module "report.php"
* Version: 1.0
* Copyright (c) 2020 TIS
* Distributed under the terms of the GNU Lesser General Public License.
* https://opensource.org/licenses/LGPL-2.1
*/
require_once(dirname(__FILE__)."/lib/base.php");
require_once(dirname(__FILE__)."/lib/driver.php");
require_once(dirname(__FILE__)."/google/sheet.php");
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
		$this->project=[];
		$this->response=[];
	}
	/* methods */
	protected function GET()
	{
		$this->body=$_GET;
		if (!isset($this->body["verify"]))
		{
			$this->driver=new clsDriver(dirname(__FILE__)."/storage/json/",isset($this->body["timezone"])?$this->body["timezone"]:date_default_timezone_get());
			$this->project=$this->driver->record("project","1");
			if (!isset($this->body["spreadsheet"])) $this->callrequesterror(400);
			if (!is_array($this->project["service_account_key"]["value"]) || count($this->project["service_account_key"]["value"])==0) $this->callrequesterror(500,"Google Settings are not made.");
			if (!file_exists(dirname(__FILE__)."/storage/google/".$this->project["service_account_key"]["value"][0]["filekey"])) $this->callrequesterror(500,"Google Settings are not made.");
			$service=new clsSheet(
				dirname(__FILE__)."/storage/google/".$this->project["service_account_key"]["value"][0]["filekey"],
				[
					clsSheet::SPREADSHEETS,
					clsSheet::DRIVE
				]
			);
			$response=$service->get($this->body["spreadsheet"]);
			$this->response["sheets"]=[];
			foreach ($response->sheets as $sheet) $this->response["sheets"][$sheet->properties->sheetId]=$sheet->properties->title;
			header("HTTP/1.1 200 OK");
			header('Content-Type: application/json; charset=utf-8');
			echo json_encode($this->response,JSON_UNESCAPED_UNICODE);
			exit(0);
		}
		else
		{
			if ($this->body["verify"]!="")
			{
				$file=$this->body["verify"];
				if (file_exists(dirname(__FILE__)."/report_processing_{$file}.error"))
				{
					$error=file_get_contents(dirname(__FILE__)."/report_processing_{$file}.error");
					if (file_exists(dirname(__FILE__)."/report_processing_{$file}.error")) unlink(dirname(__FILE__)."/report_processing_{$file}.error");
					if (file_exists(dirname(__FILE__)."/report_processing_{$file}.txt")) unlink(dirname(__FILE__)."/report_processing_{$file}.txt");
					$this->callrequesterror(500,$error);
				}
				else
				{
					$this->response["result"]=(file_exists(dirname(__FILE__)."/report_processing_{$file}.txt"))?"ng":"ok";
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
		if (!isset($this->body["app"])) $this->callrequesterror(400);
		if (!isset($this->body["spreadsheet"])) $this->callrequesterror(400);
		if (!isset($this->body["size"])) $this->callrequesterror(400);
		if (!isset($this->body["orientation"])) $this->callrequesterror(400);
		if (!isset($this->body["template"])) $this->callrequesterror(400);
		if (!isset($this->body["record"])) $this->callrequesterror(400);
		if (!is_array($this->body["template"])) $this->callrequesterror(400);
		if (!is_array($this->body["record"])) $this->callrequesterror(400);
		if (!is_array($this->project["service_account_key"]["value"]) || count($this->project["service_account_key"]["value"])==0) $this->callrequesterror(500,"Google Settings are not made.");
		if (!file_exists(dirname(__FILE__)."/storage/google/".$this->project["service_account_key"]["value"][0]["filekey"])) $this->callrequesterror(500,"Google Settings are not made.");
		if (!file_exists(dirname(__FILE__)."/storage/json/config.json")) $this->callrequesterror(500,"Not Found The configuration file.");
		if (!file_exists(dirname(__FILE__)."/storage/report/")) mkdir(dirname(__FILE__)."/storage/report/");
		$file=preg_replace("/[ .]/u","",microtime(true));
		$args=[
			"app"=>$this->body["app"],
			"spreadsheet"=>$this->body["spreadsheet"],
			"size"=>$this->body["size"],
			"orientation"=>$this->body["orientation"],
			"template"=>$this->body["template"],
			"record"=>$this->body["record"],
			"servicekey"=>$this->project["service_account_key"]["value"][0]["filekey"],
			"timezone"=>isset($this->body["timezone"])?$this->body["timezone"]:date_default_timezone_get()
		];
		file_put_contents(dirname(__FILE__)."/report_processing_{$file}.txt",json_encode($args));
		if (substr(php_uname(),0,7)=="Windows") pclose(popen("start /B php report_processing.php {$file}","r"));
		else exec("nohup php report_processing.php {$file} > /dev/null &");
		$this->response["filekey"]=$file;
		header("HTTP/1.1 200 OK");
		header('Content-Type: application/json; charset=utf-8');
		echo json_encode($this->response,JSON_UNESCAPED_UNICODE);
		exit(0);
	}
	protected function PUT()
	{
		$this->body=json_decode(mb_convert_encoding(file_get_contents('php://input'),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),true);
		if (!isset($this->body["filekey"])) $this->callrequesterror(400);
		if (file_exists(dirname(__FILE__)."/storage/report/".$this->body["filekey"])) unlink(dirname(__FILE__)."/storage/report/".$this->body["filekey"]);
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
