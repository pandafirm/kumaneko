/*
* FileName "sw.js"
* Version: 1.8.3
* Copyright (c) 2020 Pandafirm LLC
* Distributed under the terms of the GNU Lesser General Public License.
* https://opensource.org/licenses/LGPL-2.1
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
