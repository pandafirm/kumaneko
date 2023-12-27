<?php
/*
* PandaFirm-PHP-Module "service.php"
* Version: 1.5.2
* Copyright (c) 2020 Pandafirm LLC
* Distributed under the terms of the GNU Lesser General Public License.
* https://opensource.org/licenses/LGPL-2.1
*/
class clsService{
	/* valiable */
	protected $token;
	/* constructor */
	public function __construct($config,$scopes)
	{
		if (file_exists($config))
		{
			$config=json_decode(file_get_contents($config),true);
			$now=floor(time());
			$signature="";
			$url="https://www.googleapis.com/oauth2/v4/token";
			$claim=[
				"iss"=>$config["client_email"],
				"sub"=>$config["client_email"],
				"scope"=>implode(" ",$scopes),
				"aud"=>$url,
				"exp"=>(string)($now+3600),
				"iat"=>(string)$now
			];
			$data=base64_encode(json_encode(["alg"=>"RS256","typ"=>"JWT"],JSON_UNESCAPED_SLASHES)).".".base64_encode(json_encode($claim,JSON_UNESCAPED_SLASHES));
			openssl_sign($data,$signature,$config["private_key"],"SHA256");
			$jwt=$data.".".base64_encode($signature);
			$ch=curl_init();
			curl_setopt_array($ch,[
				CURLOPT_URL=>$url,
				CURLOPT_RETURNTRANSFER=>true,
				CURLOPT_POST=>true,
				CURLOPT_POSTFIELDS=>[
					"assertion"=>$jwt,
					"grant_type"=>"urn:ietf:params:oauth:grant-type:jwt-bearer"
				]
			]);
			$result=json_decode(curl_exec($ch),true);
			$this->token=$result["access_token"];
			curl_close($ch);
		}
		else throw new Exception("Key file does not exist.");
	}
	/* exception */
	public function exception($error)
	{
		throw new Exception($error->error->message);
	}
}
?>
