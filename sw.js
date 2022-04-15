/*
* FileName "sw.js"
* Version: 1.0
* Copyright (c) 2020 PandaFirm
* Released under the MIT License.
* http://pandafirm.jp/license.txt
*/
'use strict';
self.addEventListener('install',(e) => {
	e.waitUntil(self.skipWaiting());
});
self.addEventListener('activate',(e) => {
	e.waitUntil(self.clients.claim());
});
self.addEventListener('push',(e) => {
	self.clients.matchAll().then((clients) => {
		clients.forEach((client) => client.postMessage(e.data.text()));
	});
});
