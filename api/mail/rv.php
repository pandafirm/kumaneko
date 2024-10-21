<?php
/*
* PandaFirm-PHP-Module "mail/rv.php"
* Version: 1.7.2
* Copyright (c) 2020 Pandafirm LLC
* Distributed under the terms of the GNU Lesser General Public License.
* https://opensource.org/licenses/LGPL-2.1
*/
require_once(dirname(__DIR__)."/lib/base.php");
class clsRequest extends clsBase
{
	/* valiable */
	private $body;
	private $passphrase;
	private $response;
	private $imap;
	/* constructor */
	public function __construct()
	{
		$this->passphrase="V4x9uF2ZaM7pR3sEo6n8C1kYbW5dT0Ih";
		$this->response=[];
		$this->imap=[];
	}
	/* methods */
	protected function GET()
	{
		$this->response["passphrase"]=$this->passphrase;
		header("HTTP/1.1 200 OK");
		header('Content-Type: application/json; charset=utf-8');
		echo json_encode($this->response,JSON_UNESCAPED_UNICODE);
		exit(0);
	}
	protected function POST()
	{
		$this->body=json_decode(file_get_contents('php://input'),true);
		if (!isset($this->body["data"])) $this->callrequesterror(400);
		if (!isset($this->body["iv"])) $this->callrequesterror(400);
		if (!isset($this->body["tag"])) $this->callrequesterror(400);
		try
		{
			$this->imap=json_decode(openssl_decrypt(base64_decode($this->body["data"]),"aes-256-gcm",$this->passphrase,OPENSSL_RAW_DATA,base64_decode($this->body["iv"]),base64_decode($this->body["tag"])),true);
			if (!is_array($this->imap)) $this->callrequesterror(500,"EMail settings are not made.");
			else
			{
				if (!isset($this->imap["host"])) $this->callrequesterror(400);
				if (!isset($this->imap["port"])) $this->callrequesterror(400);
				if (!isset($this->imap["option"])) $this->callrequesterror(400);
				if (!isset($this->imap["mailbox"])) $this->callrequesterror(400);
				if (!isset($this->imap["author"])) $this->callrequesterror(400);
				if (!isset($this->imap["pwd"])) $this->callrequesterror(400);
				if (!isset($this->imap["criteria"])) $this->callrequesterror(400);
			}
			set_error_handler(function($errno,$errstr,$errfile,$errline){
				throw new Exception($errstr, $errno);
			});
			$inbox=imap_open("{".$this->imap["host"].":".$this->imap["port"].$this->imap["option"]."}".$this->imap["mailbox"],$this->imap["author"],$this->imap["pwd"]);
			if (!$inbox) throw new Exception("Cannot connect to Mail: ".imap_last_error());
			$emails=imap_search($inbox,$this->imap["criteria"]);
			if ($emails)
			{
				foreach ($emails as $email)
				{
					$header=imap_headerinfo($inbox,$email);
					if (empty($header) || !isset($header->date) || !isset($header->fromaddress) || !isset($header->subject)) continue;
					$structure=imap_fetchstructure($inbox,$email);
					$fromaddress=(function($fromaddress){
						preg_match('/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/',$fromaddress,$matches);
						return isset($matches[0])?$matches[0]:"";
					})($header->fromaddress);
					$cc=(function($cc){
						$res="";
						if ($cc)
						{
							$res=implode(",",array_map(function($address){
								return $address->mailbox."@".$address->host;
							},$cc));
						}
						return $res;
					})(isset($header->cc)?$header->cc:null);
					$bcc=(function($bcc){
						$res="";
						if ($bcc)
						{
							$res=implode(",",array_map(function($address){
								return $address->mailbox."@".$address->host;
							},$bcc));
						}
						return $res;
					})(isset($header->bcc)?$header->bcc:null);
					$subject=(function($subject){
						$res="";
						foreach ($subject as $part)
						{
							$charset=strtoupper($part->charset);
							if ($charset!="DEFAULT") $res.=mb_convert_encoding($part->text,"UTF-8",$charset);
							else $res.=$part->text;
						}
						return $res;
					})(imap_mime_header_decode($header->subject));
					$body=$this->get_body($inbox,$email,$structure);
					$attachments=$this->get_attachments($inbox,$email,$structure);
					if ($fromaddress!="")
						$this->response[]=[
							"uid"=>imap_uid($inbox,$email),
							"from"=>$fromaddress,
							"cc"=>$cc,
							"bcc"=>$bcc,
							"date"=>$header->date,
							"subject"=>$subject,
							"body"=>$body,
							"attachment"=>$attachments
						];
				}
			}
			imap_close($inbox);
			restore_error_handler();
			header("HTTP/1.1 200 OK");
			header('Content-Type: application/json; charset=utf-8');
			echo json_encode($this->response,JSON_UNESCAPED_UNICODE);
		}
		catch (Exception $e)
		{
			$this->callrequesterror(500,$e->getMessage());
		}
	}
	protected function PUT()
	{
		$this->callrequesterror(400);
	}
	protected function DELETE()
	{
		$this->callrequesterror(400);
	}
	public function get_part($inbox,$email_number,$part_number,$encoding)
	{
		$res=imap_fetchbody($inbox,$email_number,$part_number);
		switch ($encoding)
		{
			case 3:
				$res=base64_decode($res);
				break;
			case 4:
				$res=quoted_printable_decode($res);
				break;
		}
		return $res;
	}
	public function get_body($inbox,$email_number,$structure,$part_number="")
	{
		$res="";
		if (isset($structure->parts) && count($structure->parts))
		{
			foreach ($structure->parts as $key=>$part)
			{
				$current_part_number=($part_number=="")?($key+1):($part_number.".".($key+1));
				if ($part->type==0 && in_array(strtolower($part->subtype),["plain","html"]))
				{
					$part_data=$this->get_part($inbox,$email_number,$current_part_number,$part->encoding);
					$charset="UTF-8";
					if (isset($part->parameters))
						foreach ($part->parameters as $param)
							if (strtolower($param->attribute)=="charset") $charset=$param->value;
					$part_data=mb_convert_encoding($part_data,"UTF-8",$charset);
					if (strtolower($part->subtype)=="plain") $res.=$part_data;
					else
					{
						if (strtolower($part->subtype)=="html") $res.=strip_tags($part_data);
					}
				}
				else
				{
					if (isset($part->parts) && count($part->parts))
						$res.=$this->get_body($inbox,$email_number,$part,$current_part_number);
				}
			}
		}
		else
		{
			if ($structure->type==0 && in_array(strtolower($structure->subtype),["plain","html"]))
			{
				$res=$this->get_part($inbox,$email_number,($part_number=="")?"1":$part_number,$structure->encoding);
				$charset="UTF-8";
				if (isset($structure->parameters))
					foreach ($structure->parameters as $param)
						if (strtolower($param->attribute)=="charset") $charset=$param->value;
				$res=mb_convert_encoding($res,"UTF-8",$charset);
			}
		}
		return $res;
	}
	public function get_attachments($inbox,$email_number,$structure,$part_number="")
	{
		$res=[];
		if (isset($structure->parts) && count($structure->parts))
		{
			foreach ($structure->parts as $key=>$part)
			{
				$current_part_number=($part_number=="")?($key+1):($part_number.".".($key+1));
				if ($part->ifdparameters || $part->ifparameters)
				{
					$files=[];
					foreach ($part->dparameters ?? $part->parameters as $object)
					{
						if (strtolower($object->attribute)=="filename" || strtolower($object->attribute)=="filename*" || strpos(strtolower($object->attribute),"filename*0")===0) $files[]="";
						if (strpos(strtolower($object->attribute),"filename*")===0) $files[count($files)-1].=rawurldecode($object->value);
						else
						{
							if (strtolower($object->attribute)=="filename")
								$files[count($files)-1]=$object->value;
						}
					}
					$file_index=0;
					foreach ($part->dparameters ?? $part->parameters as $object)
					{
						if (strtolower($object->attribute)=="filename" || strtolower($object->attribute)=="filename*" || strpos(strtolower($object->attribute),"filename*0")===0)
						{
							$body_part=imap_fetchbody($inbox,$email_number,$current_part_number);
							if ($body_part===false) continue;
							switch ($part->encoding)
							{
								case 3:
									$body_part=base64_decode($body_part);
									break;
								case 4:
									$body_part=quoted_printable_decode($body_part);
									break;
								default:
									break;
							}
							$filename="unknown";
							if (strpos($files[$file_index],"UTF-8''")===0) $filename=rawurldecode(substr($files[$file_index],7));
							else
							{
								if (strpos($files[$file_index],"=?")!==false) $filename=mb_decode_mimeheader($files[$file_index]);
								else $filename=rawurldecode($files[$file_index]);
							}
							$attachment=[
								"binary"=>base64_encode($body_part),
								"contentType"=>$part->type."/".strtolower($part->subtype),
								"filename"=>$filename
							];
							$res[]=$attachment;
							$file_index++;
						}
					}
				}
				if (isset($part->parts) && count($part->parts))
					$res=array_merge($res,$this->get_attachments($inbox,$email_number,$part,$current_part_number));
			}
		}
		return $res;
	}
}
$cls_request=new clsRequest();
$cls_request->checkmethod();
?>
