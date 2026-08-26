<?php
/*
* PandaFirm-PHP-Module "unlock.php"
* Version: 2.1.3
* Copyright (c) 2026 Pandafirm LLC
* Distributed under the terms of the GNU Lesser General Public License.
* https://opensource.org/licenses/LGPL-2.1
*
* CLI-only tool to clear or inspect account lockouts.
* No separate configuration is required: the password entered is checked against
* the same users.json record that base.php itself authenticates against.
* Usage:
*   php unlock.php --list
*   php unlock.php --account=xxxxx
*/
if (php_sapi_name()!=='cli')
{
	header("HTTP/1.1 403 Forbidden");
	exit("Forbidden");
}

$options=getopt("",["account::","list"]);

$lockout_path=dirname(__FILE__)."/lib/lockout.json";
$fp=fopen($lockout_path,file_exists($lockout_path)?"r+":"w+");
flock($fp,LOCK_EX);
$content=stream_get_contents($fp);
$lockouts=$content?json_decode($content,true):[];

if (isset($options['list']))
{
	if (empty($lockouts)) fwrite(STDOUT,"No accounts are currently locked.\n");
	else foreach ($lockouts as $account=>$info)
		fwrite(STDOUT,sprintf(
			"%s\tlast_attempt=%s\tlast_ip=%s\tuser_agent=%s\n",
			$account,
			$info['last_attempt']??'',
			$info['last_ip']??'',
			$info['user_agent']??''
		));
	flock($fp,LOCK_UN);
	fclose($fp);
	exit(0);
}

if (!isset($options['account']) || $options['account']==='')
{
	fwrite(STDERR,"Specify --account=xxxxx or --list\n");
	flock($fp,LOCK_UN);
	fclose($fp);
	exit(1);
}

$account=$options['account'];
if (!isset($lockouts[$account]))
{
	fwrite(STDOUT,"Account '{$account}' is not currently locked.\n");
	flock($fp,LOCK_UN);
	fclose($fp);
	exit(0);
}

$users_path=dirname(__FILE__)."/storage/json/users.json";
if (!file_exists($users_path))
{
	fwrite(STDERR,"User is not registered\n");
	flock($fp,LOCK_UN);
	fclose($fp);
	exit(1);
}

$users=json_decode(mb_convert_encoding(file_get_contents($users_path),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),true);
$users=array_filter($users,function($values,$key) use ($account){
	return $values["account"]["value"]==$account;
},ARRAY_FILTER_USE_BOTH);

if (count($users)!=1)
{
	fwrite(STDERR,"Account '{$account}' was not found\n");
	flock($fp,LOCK_UN);
	fclose($fp);
	exit(1);
}
else $pwd=reset($users)["pwd"]["value"];

fwrite(STDOUT,"Password for '{$account}': ");
if (stripos(PHP_OS,'WIN')===0) $input=trim(fgets(STDIN));
else
{
	system('stty -echo');
	$input=trim(fgets(STDIN));
	system('stty echo');
	fwrite(STDOUT,"\n");
}

if ($input!==$pwd)
{
	fwrite(STDERR,"Incorrect password.\n");
	flock($fp,LOCK_UN);
	fclose($fp);
	exit(1);
}

unset($lockouts[$account]);
ftruncate($fp,0);
rewind($fp);
fwrite($fp,json_encode($lockouts));
flock($fp,LOCK_UN);
fclose($fp);

fwrite(STDOUT,"Account '{$account}' has been unlocked.\n");
?>
