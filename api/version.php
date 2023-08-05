<?php
/*
* PandaFirm-PHP-Module "version.php"
* Version: 1.3.5
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
	private $url;
	private $zip;
	private $version;
	/* constructor */
	public function __construct()
	{
		$this->response=[];
		$this->url="https://api.github.com/repos/pandafirm/kumaneko/releases/latest";
		$this->zip="source.zip";
		$this->version=(!file_exists("ver.txt"))?"1.0.0":file_get_contents("ver.txt");
	}
	/* methods */
	protected function GET()
	{
		$ch=curl_init();
		curl_setopt_array($ch,array(
			CURLOPT_URL=>$this->url,
			CURLOPT_FOLLOWLOCATION=>true,
			CURLOPT_RETURNTRANSFER=>true,
			CURLOPT_SSL_VERIFYPEER=>false,
			CURLOPT_USERAGENT=>"ua",
			CURLOPT_CUSTOMREQUEST=>"GET"
		));
		$result=curl_exec($ch);
		if (curl_getinfo($ch,CURLINFO_RESPONSE_CODE)>=400) $this->callrequesterror(500,$result);
		$latest=json_decode($result)->tag_name;
		$this->response["latest"]=($latest==$this->version)?"":$latest;
		$this->response["my"]=$this->version;
		curl_close($ch);
		header("HTTP/1.1 200 OK");
		header('Content-Type: application/json; charset=utf-8');
		echo json_encode($this->response,JSON_UNESCAPED_UNICODE);
		exit(0);
	}
	protected function POST()
	{
		$ch=curl_init();
		curl_setopt_array($ch,array(
			CURLOPT_URL=>$this->url,
			CURLOPT_FOLLOWLOCATION=>true,
			CURLOPT_RETURNTRANSFER=>true,
			CURLOPT_SSL_VERIFYPEER=>false,
			CURLOPT_USERAGENT=>"ua",
			CURLOPT_CUSTOMREQUEST=>"GET"
		));
		$result=curl_exec($ch);
		if (curl_getinfo($ch,CURLINFO_RESPONSE_CODE)>=400) $this->callrequesterror(500,$result);
		$result=json_decode($result);
		$this->version=$result->tag_name;
		$ch=curl_init();
		curl_setopt_array($ch,array(
			CURLOPT_URL=>$result->zipball_url,
			CURLOPT_BINARYTRANSFER=>true,
			CURLOPT_FOLLOWLOCATION=>true,
			CURLOPT_RETURNTRANSFER=>true,
			CURLOPT_SSL_VERIFYPEER=>false,
			CURLOPT_USERAGENT=>"ua",
			CURLOPT_CUSTOMREQUEST=>"GET"
		));
		$result=curl_exec($ch);
		if (curl_getinfo($ch,CURLINFO_RESPONSE_CODE)>=400) $this->callrequesterror(500,$result);
		file_put_contents($this->zip,$result);
		$zip=new ZipArchive;
		if (!$zip) $this->callrequesterror(500,"Could not make ZipArchive object.");
		$zip->open($this->zip);
		if ($zip->numFiles>0)
		{
			$directory=$zip->getNameIndex(0);
			$zip->extractTo("./");
			$this->deploy("./{$directory}","../");
			$this->cleanup($directory);
		}
		$zip->close();
		unlink($this->zip);
		file_put_contents("ver.txt",$this->version);
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
	public function cleanup($arg_dir) {
		if (is_dir($arg_dir) && !is_link($arg_dir))
		{
			array_map(array($this,"cleanup"),glob("{$arg_dir}/*",GLOB_ONLYDIR));
			array_map("unlink",glob("{$arg_dir}/*"));
			rmdir($arg_dir);
		}
	}
	public function deploy($arg_source,$arg_destination){
		if (is_dir($arg_source) && !is_link($arg_source))
		{
			$files=array_filter(glob("{$arg_source}/*"),"is_file");
			$dirs=glob("{$arg_source}/*",GLOB_ONLYDIR);
			if (!file_exists($arg_destination)) mkdir($arg_destination);
			foreach ($files as $file)
				if (basename($file)!=basename(__FILE__))
					copy("{$arg_source}/".basename($file),"{$arg_destination}/".basename($file));
			foreach ($dirs as $dir)
				if (basename($dir)!="storage")
					$this->deploy($dir,"{$arg_destination}/".basename($dir));
		}
	}
}
$cls_request=new clsRequest();
$cls_request->checkmethod();
?>
