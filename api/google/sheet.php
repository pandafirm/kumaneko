<?php
/*
* PandaFirm-PHP-Module "sheet.php"
* Version: 2.0.0
* Copyright (c) 2020 Pandafirm LLC
* Distributed under the terms of the GNU Lesser General Public License.
* https://opensource.org/licenses/LGPL-2.1
*/
require_once(dirname(__FILE__)."/service.php");
class clsSheet extends clsService{
	/* constant */
	const DRIVE="https://www.googleapis.com/auth/drive";
	const DRIVE_FILE="https://www.googleapis.com/auth/drive.file";
	const DRIVE_READONLY="https://www.googleapis.com/auth/drive.readonly";
	const SPREADSHEETS="https://www.googleapis.com/auth/spreadsheets";
	const SPREADSHEETS_READONLY="https://www.googleapis.com/auth/spreadsheets.readonly";
	/* constructor */
	public function __construct($config,$scopes)
	{
		parent::__construct($config,$scopes);
	}
	/* copy sheets */
	public function copy($spreadsheetId){
		$ch=curl_init();
		curl_setopt_array($ch,array(
			CURLOPT_URL=>"https://www.googleapis.com/drive/v3/files/{$spreadsheetId}/copy?access_token=".$this->token,
			CURLOPT_HTTPHEADER=>[
				"Content-Type:application/json"
			],
			CURLOPT_RETURNTRANSFER=>true,
			CURLOPT_SSL_VERIFYPEER=>false,
			CURLOPT_CUSTOMREQUEST=>"POST",
			CURLOPT_POSTFIELDS=>"{}"
		));
		$result=json_decode(curl_exec($ch));
		if (curl_getinfo($ch,CURLINFO_RESPONSE_CODE)>=400) throw parent::exception($result);
		curl_close($ch);
		return $result;
	}
	/* delete sheets */
	public function delete($spreadsheetId){
		$ch=curl_init();
		curl_setopt_array($ch,array(
			CURLOPT_URL=>"https://www.googleapis.com/drive/v3/files/{$spreadsheetId}?access_token=".$this->token,
			CURLOPT_HTTPHEADER=>[
				"Content-Type:application/json"
			],
			CURLOPT_RETURNTRANSFER=>true,
			CURLOPT_SSL_VERIFYPEER=>false,
			CURLOPT_CUSTOMREQUEST=>"DELETE"
		));
		$result=json_decode(curl_exec($ch));
		if (curl_getinfo($ch,CURLINFO_RESPONSE_CODE)>=400) throw parent::exception($result);
		curl_close($ch);
		return $result;
	}
	/* export sheets */
	public function export($spreadsheetId,$options){
		$ch=curl_init();
		curl_setopt_array($ch,array(
			CURLOPT_URL=>"https://docs.google.com/spreadsheets/d/{$spreadsheetId}/export?".implode("&",$options),
			CURLOPT_FOLLOWLOCATION=>true,
			CURLOPT_HTTPHEADER=>[
				"Authorization: Bearer ".$this->token
			],
			CURLOPT_RETURNTRANSFER=>true,
			CURLOPT_SSL_VERIFYPEER=>false,
			CURLOPT_CUSTOMREQUEST=>"GET"
		));
		$result=curl_exec($ch);
		if (curl_getinfo($ch,CURLINFO_RESPONSE_CODE)>=400) throw parent::exception(json_decode($result));
		curl_close($ch);
		return $result;
	}
	/* get sheets */
	public function get($spreadsheetId,$includeGridData=false){
		$ch=curl_init();
		curl_setopt_array($ch,array(
			CURLOPT_URL=>"https://sheets.googleapis.com/v4/spreadsheets/{$spreadsheetId}?access_token=".$this->token."&includeGridData=".(($includeGridData)?"true":"false"),
			CURLOPT_HTTPHEADER=>[
				"Content-Type:application/json"
			],
			CURLOPT_RETURNTRANSFER=>true,
			CURLOPT_SSL_VERIFYPEER=>false,
			CURLOPT_CUSTOMREQUEST=>"GET"
		));
		$result=json_decode(curl_exec($ch));
		if (curl_getinfo($ch,CURLINFO_RESPONSE_CODE)>=400) throw parent::exception($result);
		curl_close($ch);
		return $result;
	}
	/* update sheets */
	public function update($spreadsheetId,$requests){
		$ch=curl_init();
		curl_setopt_array($ch,array(
			CURLOPT_URL=>"https://sheets.googleapis.com/v4/spreadsheets/{$spreadsheetId}:batchUpdate?access_token=".$this->token,
			CURLOPT_HTTPHEADER=>[
				"Content-Type:application/json"
			],
			CURLOPT_RETURNTRANSFER=>true,
			CURLOPT_SSL_VERIFYPEER=>false,
			CURLOPT_CUSTOMREQUEST=>"POST",
			CURLOPT_POSTFIELDS=>json_encode($requests)
		));
		$result=json_decode(curl_exec($ch));
		if (curl_getinfo($ch,CURLINFO_RESPONSE_CODE)>=400) throw parent::exception($result);
		curl_close($ch);
		return $result;
	}
}
?>
