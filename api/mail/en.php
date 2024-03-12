<?php
/*
* PandaFirm-PHP-Module "mail/en.php"
* Version: 1.6.0
* Copyright (c) 2020 Pandafirm LLC
* Distributed under the terms of the GNU Lesser General Public License.
* https://opensource.org/licenses/LGPL-2.1
*/
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;
require_once(dirname(__DIR__)."/lib/base.php");
require_once(dirname(__DIR__)."/lib/driver.php");
require_once(dirname(__FILE__)."/mailer/autoload.php");
mb_internal_encoding("UTF-8");
class clsRequest extends clsBase
{
	/* valiable */
	private $body;
	private $driver;
	private $project;
	private $response;
	private $smtp;
	/* constructor */
	public function __construct()
	{
		$this->project=[];
		$this->response=[];
		$this->smtp=[];
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
		if (!isset($this->body["html"])) $this->callrequesterror(400);
		foreach ($this->project["smtp"]["value"] as $value)
			if ($value["smtp_mail"]["value"]==$this->body["from"])
			{
				$this->smtp=$value;
				break;
			}
		if (count($this->smtp)==0) $this->callrequesterror(500,"EMail settings are not made.");
		else
		{
			if ($this->smtp["smtp_host"]["value"]=="") $this->callrequesterror(500,"EMail settings are not made.");
			if ($this->smtp["smtp_port"]["value"]=="") $this->callrequesterror(500,"EMail settings are not made.");
			if ($this->smtp["smtp_user"]["value"]=="") $this->callrequesterror(500,"EMail settings are not made.");
			if ($this->smtp["smtp_pwd"]["value"]=="") $this->callrequesterror(500,"EMail settings are not made.");
		}
		try
		{
			$mailer=new PHPMailer(true);
			$mailer->CharSet="UTF-8";
			$mailer->Encoding="base64";
			$mailer->isSMTP();
			$mailer->Host=$this->smtp["smtp_host"]["value"];
			$mailer->SMTPAuth=true;
			$mailer->Username=$this->smtp["smtp_user"]["value"];
			$mailer->Password=$this->smtp["smtp_pwd"]["value"];
			switch ($this->smtp["smtp_secure"]["value"])
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
			$mailer->Port=$this->smtp["smtp_port"]["value"];
			if ($this->smtp["smtp_sender"]["value"]!="") $mailer->setFrom($this->body["from"],$this->smtp["smtp_sender"]["value"]);
			else $mailer->setFrom($this->body["from"]);
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
					$mailer->AddStringAttachment(base64_decode($attachment["data"]),$attachment["name"],"base64",$attachment["type"]);
			}
			$mailer->isHTML($this->body["html"]);
			$mailer->Subject=$this->body["subject"];
			$mailer->Body=$this->body["body"];
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
