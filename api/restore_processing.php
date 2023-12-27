<?php
/*
* PandaFirm-PHP-Module "restore_processing.php"
* Version: 1.5.2
* Copyright (c) 2020 Pandafirm LLC
* Distributed under the terms of the GNU Lesser General Public License.
* https://opensource.org/licenses/LGPL-2.1
*/
global $argv;
register_shutdown_function(function(){
	$error=error_get_last();
	if ($error===null) return;
	file_put_contents("./restore_processing.error",$error["message"]);
	chmod("./restore_processing.error",0755);
	if (file_exists("./restore_processing.txt")) unlink("./restore_processing.txt");
});
function cleanup($arg_dir) {
	if (is_dir($arg_dir) && !is_link($arg_dir))
	{
		array_map("cleanup",glob("{$arg_dir}/*",GLOB_ONLYDIR));
		array_map("unlink",array_filter(array_filter(glob("{$arg_dir}/*"),"is_file"),function($file){
			return !in_array(basename($file),["config.json","departments.json","groups.json","project.json","users.json"]);
		}));
	}
}
if (count($argv)>1)
{
	try
	{
		file_put_contents("./restore_processing.txt","");
		$file=$argv[1];
		$backups=dirname(__FILE__)."/backups";
		$storage=dirname(__FILE__)."/storage";
		if (file_exists($backups."/".$file.".zip"))
		{
			$zip=new ZipArchive;
			if (!$zip) throw new Exception("Could not make ZipArchive object.");
			if ($zip->open($backups."/".$file.".zip"))
			{
				if ($zip->numFiles>0)
				{
					cleanup($storage);
					$zip->extractTo($storage);
				}
				$zip->close();
			}
			else throw new Exception("ZipArchive open() failed");
		}
		else throw new Exception("File does not exist");
	}
	catch (Exception $e)
	{
		file_put_contents("./restore_processing.error",$e->getMessage());
	}
	finally
	{
		if (file_exists("./restore_processing.txt")) unlink("./restore_processing.txt");
	}
}
exit(0);
?>
