<?php
/*
* PandaFirm-PHP-Module "backup_processing.php"
* Version: 1.5.1
* Copyright (c) 2020 Pandafirm LLC
* Distributed under the terms of the GNU Lesser General Public License.
* https://opensource.org/licenses/LGPL-2.1
*/
global $argv;
register_shutdown_function(function(){
	$error=error_get_last();
	if ($error===null) return;
	file_put_contents("./backup_processing.error",$error["message"]);
	chmod("./backup_processing.error",0755);
	if (file_exists("./backup_processing.txt")) unlink("./backup_processing.txt");
});
function deploy($arg_source,$arg_dir,$arg_zip){
	if (is_dir($arg_source) && !is_link($arg_source))
	{
		$files=array_filter(glob("{$arg_source}/*"),"is_file");
		$dirs=glob("{$arg_source}/*",GLOB_ONLYDIR);
		foreach ($files as $file) $arg_zip->addFile($file,ltrim($arg_dir."/","/").basename($file));
		foreach ($dirs as $dir)
		{
			$arg_zip->addEmptyDir(ltrim($arg_dir."/","/").basename($dir));
			deploy($dir,ltrim($arg_dir."/","/").basename($dir),$arg_zip);
		}
	}
}
if (count($argv)>1)
{
	try
	{
		file_put_contents("./backup_processing.txt","");
		$backups=dirname(__FILE__)."/backups";
		$storage=dirname(__FILE__)."/storage";
		if (!file_exists($backups)) mkdir($backups);
		$zip=new ZipArchive;
		if (!$zip) throw new Exception("Could not make ZipArchive object.");
		if($zip->open($backups."/".gmdate("YmdHis").".zip",ZipArchive::CREATE))
		{
			deploy($storage,"",$zip);
			$zip->close();
			$files=array_filter(glob("{$backups}/*"),"is_file");
			$fileinfo=[];
			foreach ($files as $file) $fileinfo[$file]=filemtime($file);
			arsort($fileinfo);
			foreach (array_slice(array_keys($fileinfo),5) as $file) unlink($file);
		}
		else throw new Exception("ZipArchive open() failed");
	}
	catch (Exception $e)
	{
		file_put_contents("./backup_processing.error",$e->getMessage());
	}
	finally
	{
		if (file_exists("./backup_processing.txt")) unlink("./backup_processing.txt");
	}
}
exit(0);
?>
