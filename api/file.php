<?php
/*
* PandaFirm-PHP-Module "file.php"
* Version: 1.6.3
* Copyright (c) 2020 Pandafirm LLC
* Distributed under the terms of the GNU Lesser General Public License.
* https://opensource.org/licenses/LGPL-2.1
*/
require_once(dirname(__FILE__)."/lib/base.php");
class clsRequest extends clsBase
{
	/* valiable */
	private $body;
	private $files;
	private $response;
	/* constructor */
	public function __construct()
	{
		$this->files=[];
		$this->response=[];
	}
	/* methods */
	protected function GET()
	{
		$this->body=$_GET;
		if (!isset($this->body["dir"])) $this->callrequesterror(400);
		if ($this->body["dir"]=="") $this->callrequesterror(400);
		$directory=dirname(__FILE__)."/storage/";
		$directories=explode("/",preg_replace("/^\//s","",preg_replace("/\/$/s","",$this->body["dir"])));
		for ($i=0;$i<count($directories);$i++) $directory.=$directories[$i]."/";
		if (isset($this->body["filekey"]))
		{
			$file=$directory.$this->body["filekey"];
			if (file_exists($file))
			{
				$fileinfo=new finfo(FILEINFO_MIME_TYPE);
				if (isset($this->body["type"]))
				{
					$this->response["type"]=$fileinfo->file($file);
					header("HTTP/1.1 200 OK");
					header('Content-Type: application/json; charset=utf-8');
					echo json_encode($this->response,JSON_UNESCAPED_UNICODE);
				}
				else
				{
					switch ($fileinfo->file($file))
					{
						case 'application/json':
						case 'text/plain':
						case 'text/html':
							$this->response["file"]=base64_encode(mb_convert_encoding(file_get_contents($file),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'));
							break;
						default:
							ob_end_clean();
							ob_start();
							if ($fp=fopen($file,"rb"))
							{
								if (isset($this->body["seek"])) fseek($fp,$this->body["seek"]);
								$contents='';
								$limit=8192;
								if (preg_match("@^(\d+)([KMGT])$@",ini_get("memory_limit"),$match))
								{
									$pow=0;
									switch($match[2])
									{
										case "K":
											$pow=1;
											break;
										case "M":
											$pow=2;
											break;
										case "G":
											$pow=3;
											break;
										case "T":
											$pow=4;
											break;
									}
									$limit=$match[1]*pow(1024,$pow);
								}
								while (!feof($fp))
								{
									set_time_limit(0);
									$contents.=fread($fp,8192);
									ob_flush();
									if (memory_get_usage()>$limit/10)
									{
										$this->response["seek"]=ftell($fp);
										break;
									}
								}
								fclose($fp);
								$this->response["file"]=base64_encode($contents);
							}
							else $this->callrequesterror(400,"Failed to open stream");
							break;
					}
					header("HTTP/1.1 200 OK");
					header('Content-Type: application/json; charset=utf-8');
					echo json_encode($this->response,JSON_UNESCAPED_UNICODE);
				}
				exit(0);
			}
			else $this->callrequesterror(400,"File does not exist");
		}
		else
		{
			$this->files=array_filter(glob("{$directory}*"),"is_file");
			$this->response["files"]=[];
		    foreach ($this->files as $value) $this->response["files"][]=basename($value);
			header("HTTP/1.1 200 OK");
			header('Content-Type: application/json; charset=utf-8');
			echo json_encode($this->response,JSON_UNESCAPED_UNICODE);
			exit(0);
		}
	}
	protected function POST()
	{
		$this->body=$_GET;
		if (!isset($this->body["name"])) $this->callrequesterror(400);
		if (!isset($this->body["dir"])) $this->callrequesterror(400);
		if ($this->body["name"]=="") $this->callrequesterror(400);
		if ($this->body["dir"]=="") $this->callrequesterror(400);
		if (isset($_FILES[$this->body["name"]]))
		{
			foreach ($_FILES[$this->body["name"]]["error"] as $key=>$error)
			{
				switch ($error)
				{
					case UPLOAD_ERR_INI_SIZE:
						$this->callrequesterror(400,"The uploaded file exceeds the upload_max_filesize(".ini_get('upload_max_filesize').") directive");
						break;
					case UPLOAD_ERR_FORM_SIZE:
						$this->callrequesterror(400,"The uploaded file exceeds the MAX_FILE_SIZE directive that was specified in the HTML form");
						break;
					case UPLOAD_ERR_NO_FILE:
						$this->callrequesterror(400,"No file was uploaded");
						break;
					case UPLOAD_ERR_OK:
						if (preg_match("/(?P<ext>.[^.]+)$/u",$_FILES[$this->body["name"]]["name"][$key],$matches)!=0)
						{
							$directory=dirname(__FILE__)."/storage/";
							$directories=explode("/",preg_replace("/^\//s","",preg_replace("/\/$/s","",$this->body["dir"])));
							for ($i=0;$i<count($directories);$i++)
							{
								$directory.=$directories[$i]."/";
								if (!file_exists($directory)) mkdir($directory);
							}
							chmod($directory,0755);
							$file=preg_replace("/[ .]/u","",microtime(true)).sprintf("%03d",$key+1).$matches["ext"];
							move_uploaded_file($_FILES[$this->body["name"]]["tmp_name"][$key],$directory.$file);
							if ($matches["ext"]==".jpg" || $matches["ext"]==".jpeg")
								if (function_exists("exif_read_data"))
								{
									$exif_data=@exif_read_data($directory.$file);
									if (is_array($exif_data))
										if (array_key_exists("Orientation",$exif_data))
											switch ($exif_data["Orientation"])
											{
												case 3:
													$this->rotate($directory.$file,180);
													break;
												case 6:
													$this->rotate($directory.$file,270);
													break;
												case 8:
													$this->rotate($directory.$file,90);
													break;
											}
								}
							$fileinfo=new finfo(FILEINFO_MIME_TYPE);
							switch ($matches["ext"])
							{
								case ".css":
									$filetype="text/css";
									break;
								case ".csv":
									$filetype="text/csv";
									break;
								case ".js":
									$filetype="application/javascript";
									break;
								default:
									$filetype=$fileinfo->file($directory.$file);
									break;
							}
							$this->files[]=["filekey"=>$file,"filetype"=>$filetype,"name"=>$_FILES[$this->body["name"]]["name"][$key]];
						}
						break;
					default:
						$this->callrequesterror(500,"Upload failed");
						break;
				}
			}
			$this->response["files"]=$this->files;
			header("HTTP/1.1 200 OK");
			header('Content-Type: application/json; charset=utf-8');
			echo json_encode($this->response,JSON_UNESCAPED_UNICODE);
			exit(0);
		}
		else $this->callrequesterror(400,"You should specified filename");
	}
	protected function PUT()
	{
		$this->callrequesterror(400);
	}
	protected function DELETE()
	{
		$this->body=json_decode(mb_convert_encoding(file_get_contents('php://input'),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),true);
		if (!isset($this->body["filekey"])) $this->callrequesterror(400);
		if (!isset($this->body["dir"])) $this->callrequesterror(400);
		if ($this->body["filekey"]=="") $this->callrequesterror(400);
		if ($this->body["dir"]=="") $this->callrequesterror(400);
		$directory=dirname(__FILE__)."/storage/";
		$directories=explode("/",preg_replace("/^\//s","",preg_replace("/\/$/s","",$this->body["dir"])));
		for ($i=0;$i<count($directories);$i++) $directory.=$directories[$i]."/";
		if (file_exists($directory.$this->body["filekey"]))
		{
			unlink($directory.$this->body["filekey"]);
			header("HTTP/1.1 200 OK");
			header('Content-Type: application/json; charset=utf-8');
			echo json_encode($this->response,JSON_UNESCAPED_UNICODE);
			exit(0);
		}
		else $this->callrequesterror(400,"File does not exist");
	}
	public function rotate($arg_file,$arg_rotate)
	{
		list($width,$height)=getimagesize($arg_file);
		$src=imagecreatefromjpeg($arg_file);
		$image=imagecreatetruecolor($width,$height);
		$image=imagerotate($src,$arg_rotate,imagecolorallocate($image,255,255,255));
		imagejpeg($image,$arg_file);
		imagedestroy($src);
		imagedestroy($image);
	}
}
$cls_request=new clsRequest();
$cls_request->checkmethod();
?>
