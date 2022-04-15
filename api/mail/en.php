<?php
/*
* PandaFirm-PHP-Module "mail/en.php"
* Version: 1.0
* Copyright (c) 2020 TIS
* Released under the MIT License.
* http://pandafirm.jp/license.txt
*/
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;
require_once(dirname(__DIR__)."/lib/base.php");
require_once(dirname(__DIR__)."/lib/driver.php");
require_once(dirname(__FILE__)."/mailer/vendor/autoload.php");
mb_internal_encoding("UTF-8");
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
		$this->callrequesterror(400);
	}
	protected function POST()
	{
		$this->body=json_decode(mb_convert_encoding(file_get_contents('php://input'),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),true);
		$this->driver=new clsDriver(dirname(__DIR__)."/storage/json/",isset($this->body["timezone"])?$this->body["timezone"]:date_default_timezone_get());
		$this->project=$this->driver->record("project","1");
		if (!isset($this->body["from"])) $this->callrequesterror(400);
		if (!isset($this->body["to"])) $this->callrequesterror(400);
		if (!isset($this->body["subject"])) $this->callrequesterror(400);
		if (!isset($this->body["body"])) $this->callrequesterror(400);
		if (!isset($this->body["attachment"])) $this->callrequesterror(400);
		if ($this->project["smtp_host"]["value"]=="") $this->callrequesterror(500,"EMail settings are not made.");
		if ($this->project["smtp_port"]["value"]=="") $this->callrequesterror(500,"EMail settings are not made.");
		if ($this->project["smtp_user"]["value"]=="") $this->callrequesterror(500,"EMail settings are not made.");
		if ($this->project["smtp_pwd"]["value"]=="") $this->callrequesterror(500,"EMail settings are not made.");
		try
		{
			$mailer=new PHPMailer(true);
			$mailer->isSMTP();
			$mailer->Host=$this->project["smtp_host"]["value"];
			$mailer->SMTPAuth=true;
			$mailer->Username=$this->project["smtp_user"]["value"];
			$mailer->Password=$this->project["smtp_pwd"]["value"];
			switch ($this->project["smtp_secure"]["value"])
			{
				case "STARTTLS":
					$mailer->SMTPSecure=PHPMailer::ENCRYPTION_STARTTLS;
					$mailer->SMTPOptions=[
						"ssl"=>[
							"verify_peer"=>false,
							"verify_peer_name"=>false,
							"allow_self_signed"=>true
						]
					];
					break;
				case "SSL/TLS":
					$mailer->SMTPSecure=PHPMailer::ENCRYPTION_SMTPS;
					$mailer->SMTPOptions=[
						"ssl"=>[
							"verify_peer"=>false,
							"verify_peer_name"=>false,
							"allow_self_signed"=>true
						]
					];
					break;
				default:
					$mailer->SMTPSecure=false;
					$mailer->SMTPAutoTLS=false;
					break;
			}
			$mailer->Port=$this->project["smtp_port"]["value"];
			if ($this->body["from"]["name"]!="") $mailer->setFrom($this->body["from"]["mail"],mb_encode_mimeheader($this->body["from"]["name"]));
			else $mailer->setFrom($this->body["from"]["mail"]);
			$this->body["to"]=explode(",",$this->body["to"]);
			foreach ($this->body["to"] as $to) if ($to!="") $mailer->addAddress($to);
			if (isset($this->body["cc"]))
			{
				$this->body["cc"]=explode(",",$this->body["cc"]);
				foreach ($this->body["cc"] as $cc) if ($cc!="") $mailer->addCC($cc);
			}
			if (isset($this->body["bcc"]))
			{
				$this->body["bcc"]=explode(",",$this->body["bcc"]);
				foreach ($this->body["bcc"] as $bcc) if ($bcc!="") $mailer->addBCC($bcc);
			}
			if (is_array($this->body["attachment"]))
			{
				foreach ($this->body["attachment"] as $attachment)
					$mailer->AddStringAttachment(base64_decode($attachment["data"]),mb_encode_mimeheader(mb_convert_encoding($attachment["name"],"JIS","UTF-8")),"base64",$attachment["type"]);
			}
			$mailer->isHTML(true);
			$mailer->Subject=mb_encode_mimeheader($this->body["subject"]);
			$mailer->Body=mb_convert_encoding($this->body["body"],"JIS","UTF-8");
			$mailer->send();
			header("HTTP/1.1 200 OK");
			header('Content-Type: application/json; charset=utf-8');
			echo json_encode($this->response,JSON_UNESCAPED_UNICODE);
		}
		catch (Exception $e)
		{
			$this->callrequesterror(500,$mailer->ErrorInfo);
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
}
$cls_request=new clsRequest();
$cls_request->checkmethod();
?>