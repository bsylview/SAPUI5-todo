'use strict';

// Initializes Server.
function Server() {
}

Server.prototype.getSubscriptionByKey = function(key, callback){
	 window.firebaseController.getSubscriptionByKey(key, callback);
};

Server.prototype.addNewNote = function(objectKey, title, callback){
	window.firebaseController.addNewNote(objectKey, title, callback);
};

Server.prototype.getNotes = function(callback){
	window.firebaseController.getNotes(callback);
};

Server.prototype.getNote = function(onRemoveNoteCallback, onNewNoteCallback){
	window.firebaseController.getNote(onRemoveNoteCallback,onNewNoteCallback);	
};

Server.prototype.getSubscriberNotes = function(subscriberKey, callback){
	window.firebaseController.getSubscriberNotes(subscriberKey, callback);	
};

Server.prototype.getNoteByKey = function(noteKey, callback){
	window.firebaseController.getNoteByKey(noteKey, callback);
};

Server.prototype.loadCurrentSubscription = function(){
	window.firebaseController.getSubscriptions();	
};

Server.prototype.getCurrentUser = function(){
	return window.firebaseController.getCurrentUser();
};

Server.prototype.getAdmin = function(callback){
	window.firebaseController.getAdmin(callback);
};

Server.prototype.getToDoList = function(noteKey, callback){
	window.firebaseController.getToDoList(noteKey, callback);
};

Server.prototype.saveTodoList = function(nActive, nCompleted, data, noteKey){
	window.firebaseController.saveTodoList(nActive, nCompleted, data, noteKey);
};

Server.prototype.deleteNote = function(objectKey, noteKey){
	window.firebaseController.removeNote(objectKey, noteKey);	
};

Server.prototype.removeNote = function(noteKey){
	window.firebaseController.removeNote(noteKey);
};

Server.prototype.updateSubscriptionWithNote = function(objectKey, noteKey){
	window.firebaseController.updateSubscriptionWithNote(objectKey, noteKey);
};

Server.prototype.hasEndpointAndNote = function(objectKey, noteKey, callback){
	try{
		this.getSubscriberNotes(objectKey, callback);
	}catch(error){
		console.error("Subscriber does not exist", error);
		return false;
	};
};

Server.prototype.loadSubscriptions = function(addChild, removeChild){
	  window.firebaseController.loadSubscriptions(addChild, removeChild);
};

Server.prototype.getAllSubscriptions = function(callback){
	window.firebaseController.getAllSubscriptions(callback);
};

Server.prototype.sendNotification = function (vSubscription, oMessage) {
	if (this.checkUserSignedIn()) {
	        if (vSubscription.endpoint.indexOf(
	                'https://android.googleapis.com/gcm/send') === 0) {
	                	if (oMessage !== ""){
	            				window.firebaseController.sendPushMessage(vSubscription, oMessage);
	            		}
	        } else {
	            $.post(vSubscription.endpoint);
	        }
	    }

};

Server.prototype.signIn = function () {
  	return window.firebaseController.signIn().then(function(){
        if (window.Server.checkUserSignedIn()) {
        	return true;
        };
       }
    );
};


Server.prototype.signOut = function () {
    window.firebaseController.signOut();
};

Server.prototype.checkUserSignedIn = function () {
    if (window.firebaseController.isUserSignedIn()) {
        return true;
    }
    return false;
};

Server.prototype.getDBIndexedNotificationData = function(){
	const dbName = "goldenPillsTreatment";
    var request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = function (event) {
        var db = event.target.result;
        var transaction = event.target.transaction;// the important part
        try {
            var objectStore = transaction.objectStore("notifications");
            objectStore.openCursor().onsuccess = function (event) {
                var cursor = event.target.result;
                if (cursor) {
                    alert("Notification Title: " + cursor.value.title);
                    alert("Notification Body: " + cursor.value.body);
                    // Display a message to the user using a Toast.
                    var data = {
                        message: cursor.value.title + "::" + cursor.value.body,
                        timeout: 2000
                    };
                    this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
                    cursor.continue();
                }
                else {
                    alert("No more entries!");
                }
            };
        }catch(e){
            alert(e);
        }
    };
};

Server.prototype.setSWRegistration = function (reg) {
    this.swRegistration = reg;
};

Server.prototype.getSWRegistration = function () {
    return this.swRegistration;
};

Server.prototype.setCurrentSubscription = function (sub) {
    this.currentSubscription = sub;
};

Server.prototype.getCurrentSubscription = function () {
    return this.currentSubscription;
};

Server.prototype.setCurrentSubscriptionKey = function (subKey) {
    this.currentSubscriptionKey = subKey;
};

Server.prototype.getCurrentSubscriptionKey = function () {
    return this.currentSubscriptionKey;
};

Server.prototype.getDBCurrentSubscriptionKey = function(){
	return window.firebaseController.getCurrentSubscriptionKey();
};


Server.prototype.subscribeUser = function () {
    this.getSWRegistration().pushManager.subscribe({userVisibleOnly: true}).then(function (pushSubscription) {
        window.Server.setCurrentSubscription(pushSubscription);
        window.Server.pushSubscription(JSON.stringify(window.Server.getCurrentSubscription()));
    }).catch(function(e) {
        if (Notification.permission === 'denied') {
            console.warn('Permission for Notifications was denied');
        } else {
        	console.error('Unable to subscribe to push.', e);
        }
    });
};

Server.prototype.unsubscribeUser = function () {
     navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
        serviceWorkerRegistration.pushManager.getSubscription().then(
            function(pushSubscription) {
                    if (!pushSubscription) {
	                    return;
	                }
	                var sub =  JSON.stringify(pushSubscription);
	                const endpointSections =JSON.parse(sub).endpoint.split('/');
	                const subscriptionId = endpointSections[endpointSections.length - 1];
	                window.Server.setCurrentSubscription(pushSubscription);
	                window.Server.removeSubscription();
	                pushSubscription.unsubscribe().then(function(successful) {
	                	
	                }).catch(function(e) {
	                    console.log('Unsubscription error: ', e);
	                });
            }).catch(function(e) {
            	console.error('Error thrown while unsubscribing from push messaging.', e);
        });
    });
};


Server.prototype.removeSubscription = function () {
	try{
   		window.firebaseController.removeSubscription(this.getCurrentSubscriptionKey());
    	window.firebaseController.removeNotesBySubscriptionKey(this.getCurrentSubscriptionKey());
    }catch(error){
   		console.error("Error removing subscription", error);
   	};
};

Server.prototype.pushSubscription = function (vSubscription) {
    window.firebaseController.pushSubscription(vSubscription);
};

Server.prototype.hasSubscription = function () {
    if (firebaseController.getCurrentSubscriptionKey()) {
        return true;
    }
    return false;
};

window.onload = function () {
     //to be loaded in this order
    window.swController = new SWController();
    window.firebaseController = new FirebaseController();
    window.Server = new Server();
};
