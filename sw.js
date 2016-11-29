'use strict';

console.log('Started', self);

self.addEventListener('install', function(e) {
	console.log('[ServiceWorker] Install');
});

self.addEventListener('activate', function(e) {
	console.log('[ServiceWorker] Activate');
	//comment.,..
});

var saveToIndexedDB = function(notificationData){
	const dbName = "goldenPillsTreatment";
	var request = indexedDB.open(dbName, 1);
	request.onerror = function(event) {
	};
	request.onupgradeneeded = function(event) {
		var db = event.target.result;
		var objStore = db.createObjectStore("notifications", { autoIncrement : true });
		objStore.createIndex("title", "title", { unique: false });
		objStore.createIndex("body", "body", { unique: false });
		var notificationObjectStore = db.transaction("notifications", "readwrite").objectStore("notifications");
		for (var i in notificationData) {
			notificationObjectStore.add(notificationData[i]);
		}
	};
};

self.addEventListener('push', function(event) {
	console.log('Received push');
	let notificationTitle = 'To Do!';
	const notificationOptions = {
		body: 'New item to review!',
		icon: './images/icon.png',
		tag: 'push-notification'
	};

	if (event.data) {
		const dataText = event.data.text();
		notificationTitle = 'New task!';
		notificationOptions.body = `'${dataText}'`;
		const notificationData = [
			{ title: notificationTitle, body: dataText}
		];
		// saveToIndexedDB(notificationData);
	}

	event.waitUntil(
		Promise.all([
			self.registration.showNotification(
				notificationTitle, notificationOptions)
		])
	);
});

self.addEventListener('notificationclick', function(event) {
	event.notification.close();
	event.waitUntil(
		clients.matchAll({
			type: "window"
		})
			.then(function(clientList) {
				for (var i = 0; i < clientList.length; i++) {
					var client = clientList[i];
					if (client.url == '/' && 'focus' in client)
						return client.focus();
				}
				if (clients.openWindow) {
					return clients.openWindow('/');
				}
			})
	);

});