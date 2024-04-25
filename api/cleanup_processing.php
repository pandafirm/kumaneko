<?php
/*
* PandaFirm-PHP-Module "cleanup_processing.php"
* Version: 1.6.2
* Copyright (c) 2020 Pandafirm LLC
* Distributed under the terms of the GNU Lesser General Public License.
* https://opensource.org/licenses/LGPL-2.1
*/
global $argv;
register_shutdown_function(function(){
	$error=error_get_last();
	if ($error===null) return;
	file_put_contents("./cleanup_processing.error",$error["message"]);
	chmod("./cleanup_processing.error",0755);
	if (file_exists("./cleanup_processing.txt")) unlink("./cleanup_processing.txt");
});
if (count($argv)>1)
{
	try
	{
		file_put_contents("./cleanup_processing.txt","");
		$files=array_filter(glob(dirname(__FILE__)."/storage/attachment/*"),"is_file");
		foreach ($files as $file)
		{
			if (filemtime($file)<time()-60*60*24)
			{
				$result=array();
				if (substr(php_uname(),0,7)=="Windows") exec("findstr /m ".basename($file)." ".dirname(__FILE__)."\\storage\\json\\*.json",$result);
				else exec("grep -l ".basename($file)." ".dirname(__FILE__)."/storage/json/*.json",$result);
				if (count($result)==0) unlink($file);
			}
		}
	}
	catch (Exception $e)
	{
		file_put_contents("./cleanup_processing.error",$e->getMessage());
	}
	finally
	{
		if (file_exists("./cleanup_processing.txt")) unlink("./cleanup_processing.txt");
	}
}
exit(0);
?>
