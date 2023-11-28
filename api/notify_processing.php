<?php
/*
* PandaFirm-PHP-Module "notify_processing.php"
* Version: 1.5.1
* Copyright (c) 2020 Pandafirm LLC
* Distributed under the terms of the GNU Lesser General Public License.
* https://opensource.org/licenses/LGPL-2.1
*/
global $argv;
require_once(dirname(__FILE__)."/webpush/autoload.php");
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;
register_shutdown_function(function(){
	$error=error_get_last();
	if ($error===null) return;
	file_put_contents("./notify_processing.error",$error["message"]);
});
if (count($argv)>1)
{
	try
	{
		$payload=$argv[1];
		$subject=$argv[2];
		$file=dirname(__FILE__)."/webpush/keys.json";
		if (file_exists($file))
		{
			$keys=json_decode(mb_convert_encoding(file_get_contents($file),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),true);
			if (is_array($keys))
			{
				$file=dirname(__FILE__)."/webpush/subscriptions.json";
				if (file_exists($file))
				{
					$subscriptions=json_decode(mb_convert_encoding(file_get_contents($file),'UTF8','ASCII,JIS,UTF-8,EUC-JP,SJIS-WIN'),true);
					if (is_array($subscriptions))
					{
						$webPush=new WebPush([
							"VAPID"=>[
								"subject"=>$subject,
								"publicKey"=>$keys["publicKey"],
								"privateKey"=>$keys["privateKey"]
							]
						]);
						foreach ($subscriptions as $subscription)
						{
							$webPush->queueNotification(
								Subscription::create([
									"endpoint"=>$subscription["endpoint"],
									"publicKey"=>$subscription["publicKey"],
									"authToken"=>$subscription["authToken"]
								]),
								$payload
							);
						}
						foreach ($webPush->flush() as $report)
							if (!$report->isSuccess())
							{
								$endpoint=$report->getRequest()->getUri()->__toString();
								$subscriptions=array_filter($subscriptions,function($value) use ($endpoint){return $value["endpoint"]!=$endpoint;});
							}
					}
					file_put_contents($file,json_encode($subscriptions));
				}
			}
		}
	}
	catch (Exception $e)
	{
		file_put_contents("./notify_processing.error",$e->getMessage());
	}
}
exit(0);
?>
