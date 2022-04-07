<?php
/*
* PandaFirm-PHP-Module "socket/index.php" (WebSocket)
* Version: 1.0
* Copyright (c) 2020 TIS
* Released under the MIT License.
* http://pandafirm.jp/license.txt
*/
global $argv;
function handshake($header,$socket,$protocol,$host,$uri,$port)
{
	$headers=array();
	$lines=preg_split("/\r\n/",$header);
	foreach($lines as $line)
	{
		$line=chop($line);
		if(preg_match('/\A(\S+): (.*)\z/',$line,$matches)) $headers[$matches[1]]=$matches[2];
	}
	$accept=base64_encode(pack('H*',sha1($headers['Sec-WebSocket-Key'].'258EAFA5-E914-47DA-95CA-C5AB0DC85B11')));
	$upgrade="HTTP/1.1 101 Web Socket Protocol Handshake\r\n".
	"Upgrade: websocket\r\n".
	"Connection: Upgrade\r\n".
	"WebSocket-Origin: $protocol://$host\r\n".
	"WebSocket-Location: ".(($protocol=="https")?"wss":"ws")."://$host:$port/$uri/socket/\r\n".
	"Sec-WebSocket-Accept:$accept\r\n\r\n";
	if (!socket_write($socket,$upgrade,strlen($upgrade))) socket_close($socket);
}
function mask($data)
{
	$bit=0x80 | (0x1 & 0x0f);
	$len=strlen($data);
	if($len<=125) $header=pack('CC',$bit,$len);
	elseif($len>125 && $len<65536) $header=pack('CCn',$bit,126,$len);
	elseif($len>=65536) $header=pack('CCNN',$bit,127,$len);
	return $header.$data;
}
function unmask($data)
{
	$len=ord($data[1]) & 127;
	if($len==126)
	{
		$masks=substr($data,4,4);
		$value=substr($data,8);
	}
	elseif($len==127)
	{
		$masks=substr($data,10,4);
		$value=substr($data,14);
	}
	else
	{
		$masks=substr($data,2,4);
		$value=substr($data,6);
	}
	$data="";
	for ($i=0;$i<strlen($value);++$i) $data.=$value[$i]^$masks[$i%4];
	return $data;
}
function send($msg)
{
	global $clients;
	foreach($clients as $client)
	{
		@socket_write($client,$msg,strlen($msg));
	}
	return true;
}
if (count($argv)>1)
{
	try
	{
		if (substr(php_uname(),0,7)=="Windows") file_put_contents(dirname(__FILE__)."/pid.txt",getmypid());
		$null=NULL;
		$protocol=$argv[1];
		$host=$argv[2];
		$uri=$argv[3];
		$port=$argv[4];
		$socket=socket_create(AF_INET,SOCK_STREAM,SOL_TCP);
		if (!is_resource($socket)) throw new Exception(socket_strerror(socket_last_error()));
		if (!socket_set_option($socket,SOL_SOCKET,SO_REUSEADDR,1)) throw new Exception(socket_strerror(socket_last_error()));
		if (!socket_bind($socket,0,$port)) throw new Exception(socket_strerror(socket_last_error()));
		if (!socket_listen($socket)) throw new Exception(socket_strerror(socket_last_error()));
		$clients=array($socket);
		while (true)
		{
			$reads=$clients;
			socket_select($reads,$null,$null,0);
			if (in_array($socket,$reads,true))
			{
				$client=socket_accept($socket);
				if (is_resource($client))
				{
					$clients[]=$client;
					handshake(socket_read($client,2048),$client,$protocol,$host,$uri,$port);
					unset($reads[array_search($socket,$reads)]);
				}
				else socket_close($client);
			}
			foreach ($reads as $read)
			{
				while ($resp=@socket_recv($read,$buf,1024,0))
				{
					if (!$resp) break 2;
					send(mask(unmask($buf)));
					break 2;
				}
				$buf=@socket_read($read,1024,PHP_NORMAL_READ);
				if ($buf===false)
				{
					socket_close($read);
					unset($clients[array_search($read,$clients)]);
				}
			}
		}
		socket_close($socket);
	}
	catch (Exception $e)
	{
		file_put_contents(dirname(__FILE__)."/socket.error",$e->getMessage());
	}
}
exit(0);
?>
