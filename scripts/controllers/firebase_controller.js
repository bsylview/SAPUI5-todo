'use strict';

function FirebaseController() {
    this.checkSetup();
    this.initFirebase();
}

// Sets up shortcuts to Firebase features and initiate firebase auth.
FirebaseController.prototype.initFirebase = function () {
    // Shortcuts to Firebase SDK features.
    this.auth = firebase.auth();
    this.database = firebase.database();
    this.storage = firebase.storage();
    this.endpointRef = this.database.ref('endpoints');
    this.messagesRef = this.database.ref('messages');
    this.notesRef = this.database.ref('notes');
    this.rolesRef = this.database.ref('roles');
};


// Checks that the Firebase SDK has been correctly setup and configured.
FirebaseController.prototype.checkSetup = function () {
    if (!window.firebase || !(firebase.app instanceof Function) || !window.config) {
        window.alert('You have not configured and imported the Firebase SDK. ' +
            'Make sure you go through the codelab setup instructions.');
    } else if (config.storageBucket === '') {
        window.alert('Your Firebase Storage bucket has not been enabled. Sorry about that. This is' +
            'actually a Firebase bug that occurs rarely.' +
            'Please go and re-generate the Firebase initialisation snippet (step 4 of the codelab)' +
            'and make sure the storageBucket attribute is not empty.');
    }
};


FirebaseController.prototype.getAuth = function () {
    return this.auth;
};

FirebaseController.prototype.getAdmin = function(callback){
	this.rolesRef.child("admin").on("value",callback.bind(this));
};

FirebaseController.prototype.getCurrentUser = function(){
	return this.auth.currentUser;
}

FirebaseController.prototype.pushMessageToDB = function (messageValue) {
    var currentUser = this.auth.currentUser;
    this.messagesRef.push({
        name: currentUser.displayName,
        text: messageValue,
        photoUrl: currentUser.photoURL || '/images/profile_placeholder.png'
    }).then(function () {
        return true;
    }.bind(this)).catch(function (error) {
        console.error('Error writing new message to Firebase Database', error);
    });
};

// Saves a new message containing an image URI in Firebase.
// This first saves the image in Firebase storage.
FirebaseController.prototype.saveImageMessageToDB = function (file, loadingImageURL) {
// We add a message with a loading icon that will get updated with the shared image.
    var currentUser = this.auth.currentUser;
    this.messagesRef.push({
        name: currentUser.displayName,
        imageUrl: loadingImageURL,
        photoUrl: currentUser.photoURL || '/images/profile_placeholder.png'
    }).then(function (data) {
        // Upload the image to Firebase Storage.
        var uploadTask = this.storage.ref(currentUser.uid + '/' + Date.now() + '/' + file.name)
            .put(file, {'contentType': file.type});
        // Listen for upload completion.
        uploadTask.on('state_changed', null, function (error) {
            console.error('There was an error uploading a file to Firebase Storage:', error);
        }, function () {
            // Get the file's Storage URI and update the chat message placeholder.
            var filePath = uploadTask.snapshot.metadata.fullPath;
            data.update({imageUrl: this.storage.ref(filePath).toString()});
        }.bind(this));
    }.bind(this));
};

FirebaseController.prototype.signIn = function () {
    var provider = new firebase.auth.GoogleAuthProvider();
   	return this.auth.signInWithPopup(provider).then(function(){
    	return true;
    });
};

FirebaseController.prototype.signOut = function () {
    this.auth.signOut();
};

FirebaseController.prototype.isUserSignedIn = function () {
    if (this.auth.currentUser) {
        return true;
    }
    return false;
};


FirebaseController.prototype.getCurrentSubscription = function () {
    return this.currentSubscription;
};


FirebaseController.prototype.setCurrentSubscription = function (sub) {
    this.currentSubscription = sub;
};

FirebaseController.prototype.getSubscriptionByKey = function (vSubscriptionKey, subscrCallback) {
	try{
		 this.endpointRef.off();
   		 this.endpointRef.child(vSubscriptionKey).on("value", subscrCallback);	 
   }catch(error) {
        console.error('Error getting subscription by key!', error);
    };
};


FirebaseController.prototype.getSubscriptions = function () {
    this.endpointRef.off();
    var getCallback = function (data) {
        var val = data.val();
        if (val.email === firebaseController.getAuth().currentUser.email && val.userAgent === navigator.userAgent &&
            val.userAgentPlatform === navigator.platform) {
            this.setCurrentSubscriptionKey(data.key);
            this.setCurrentSubscription(JSON.parse(val.endpoint));
            return true;
        }
    }.bind(this);
    let subscription = Promise.resolve(null);
    subscription = this.endpointRef.orderByChild("email").on('child_added', getCallback.bind(this));
};

FirebaseController.prototype.setCurrentSubscriptionKey = function (vSubscriptionKey) {
    this.currentSubscriptionKey = vSubscriptionKey;
};

FirebaseController.prototype.getCurrentSubscriptionKey = function () {
    return this.currentSubscriptionKey;
};

// Loads the last 12 endpoints history and listens for upcoming ones.
FirebaseController.prototype.loadSubscriptions = function (addChild, removeChild) {
    this.endpointRef.off();
    this.endpointRef.limitToLast(12).on('child_added', addChild.bind(this));
    this.endpointRef.limitToLast(12).on('child_removed', removeChild.bind(this));
};

FirebaseController.prototype.getNote = function (onRemoveNoteCallback,onNewNoteCallback) {
    this.notesRef.on('child_added', onNewNoteCallback.bind(this));
     this.notesRef.on('child_removed', onRemoveNoteCallback.bind(this));
};

FirebaseController.prototype.getAllSubscriptions = function(callback){
	this.endpointRef.off();
    this.endpointRef.once("value", callback);
};

// Loads the last 12 history messages and listens for upcoming ones.
FirebaseController.prototype.loadMessages = function (addCallback) {
    this.messagesRef.off();
    this.messagesRef.limitToLast(12).on('child_added', addCallback.bind(this));
    this.messagesRef.limitToLast(12).on('child_changed', addCallback.bind(this));
};

FirebaseController.prototype.pushSubscription = function (vSubscription) {
	this.endpointRef.off();
    var currentUser = this.auth.currentUser;
    var photoUrl = "";
    if (currentUser != null) {
		  currentUser.providerData.forEach(function (profile) {
		    	photoUrl = profile.photoURL;
		  });
	};
    var sub =  JSON.parse(vSubscription);
    const endpointSections =sub.endpoint.split('/');
    const subscriptionId = endpointSections[endpointSections.length - 1];
    window.Server.setCurrentSubscriptionKey(subscriptionId);
    this.endpointRef.child(subscriptionId).set({
        name: currentUser.displayName,
        photoUrl: photoUrl,
        email: currentUser.email,
        userAgent: navigator.userAgent,
        userAgentPlatform: navigator.platform,
        endpoint: vSubscription
    });
};

FirebaseController.prototype.removeSubscription = function (vSubscriptionKey) {
	this.endpointRef.off();
    this.endpointRef.child(vSubscriptionKey).remove();
};

FirebaseController.prototype.addNewNote = function(objectKey, title, callback){
	this.notesRef.off();
	this.notesRef.push({
        title: title,
   		endpoint: objectKey,
   		todos:{
   			active:0,
   			completed:0
   		}
    }).then(callback.bind(this)).catch(function (error) {
        console.error('Error writing new message to Firebase Database', error);
    });
   
};

FirebaseController.prototype.updateSubscriptionWithNote = function(objectKey, noteKey) {
	 this.endpointRef.off();
	this.endpointRef.child(objectKey).child('notes').push({ key: noteKey }).then(function () {
        return true;
    }.bind(this)).catch(function (error) {
        console.error('Error updateSubscriptionWithNote', error);
    });;	
};

FirebaseController.prototype.getNotes = function(callback){
	this.notesRef.off();
	this.notesRef.once("value", callback);
};

FirebaseController.prototype.getNoteByKey = function(noteKey, callback){
	this.notesRef.off();
	this.notesRef.child(noteKey).once("value", callback);
};

FirebaseController.prototype.getSubscriberNotes = function(subscriberKey, callback){
	this.endpointRef.off();
	this.endpointRef.child(subscriberKey).child("notes").once("value", callback);
};

FirebaseController.prototype.getToDoList = function(noteKey, callback){
	this.notesRef.off();
	this.notesRef.child(noteKey).child('todos').once("value", callback);
};

FirebaseController.prototype.saveTodoList = function(nActive, nCompleted, data, noteKey){
	this.notesRef.off();
	this.notesRef.child(noteKey).child('todos').set({active:nActive, completed:nCompleted, data: data });
};

FirebaseController.prototype.removeNote = function(noteKey){
	this.notesRef.off();
	this.notesRef.child(noteKey).remove();
};

FirebaseController.prototype.removeNote = function(subscriberKey, noteKey){
	this.endpointRef.off();
	var callback = function(data){
		var notes = data.val();
		$.each(notes, function(key, item){
			if (item.key === noteKey){
				this.endpointRef.child(subscriberKey).child("notes").child(key).remove();
				this.notesRef.child(noteKey).remove();
			}		
		}.bind(this));		
	}.bind(this);
	this.endpointRef.child(subscriberKey).child("notes").once("value", callback);
};

FirebaseController.prototype.removeNotesBySubscriptionKey = function(subscriberKey){
	this.notesRef.off();
	var callback = function(data){
		var notes = data.val();
		$.each(notes, function(key, item){
			if (item.endpoint === subscriberKey){
				this.notesRef.child(key).remove();
			}
		}.bind(this));
	}.bind(this);
	this.notesRef.once("value", callback);
};

FirebaseController.prototype.getGCMInfo = function (subscription, payload, apiKey) {
    const headers = {};

    headers.Authorization = `key=${apiKey}`;
    headers['Content-Type'] = `application/json`;

    const endpointSections = subscription.endpoint.split('/');
    const subscriptionId = endpointSections[endpointSections.length - 1];
    const gcmAPIData = {
        to: subscriptionId
    };

    if (payload) {
        gcmAPIData['raw_data'] = this.toBase64(payload.cipherText); // eslint-disable-line
        headers.Encryption = `salt=${payload.salt}`;
        headers['Crypto-Key'] = `dh=${payload.publicServerKey}`;
        headers['Content-Encoding'] = `aesgcm`;
    }

    return {
        headers: headers,
        body: JSON.stringify(gcmAPIData),
        endpoint: 'https://android.googleapis.com/gcm/send'
    };
};

FirebaseController.prototype.getWebPushInfo = function (subscription, payload, vapidHeaders) {
    let body = null;
    const headers = {};
    headers.TTL = 60;

    if (payload) {
        body = payload.cipherText;

        headers.Encryption = `salt=${payload.salt}`;
        headers['Crypto-Key'] = `dh=${payload.publicServerKey}`;
        headers['Content-Encoding'] = 'aesgcm';
    } else {
        headers['Content-Length'] = 0;
    }

    if (vapidHeaders) {
        headers.Authorization = `Bearer ${vapidHeaders.bearer}`;

        if (headers['Crypto-Key']) {
            headers['Crypto-Key'] = `${headers['Crypto-Key']}; ` +
                `p256ecdsa=${vapidHeaders.p256ecdsa}`;
        } else {
            headers['Crypto-Key'] = `p256ecdsa=${vapidHeaders.p256ecdsa}`;
        }
    }

    const response = {
        headers: headers,
        endpoint: subscription.endpoint
    };

    if (body) {
        response.body = body;
    }

    return response;
};

FirebaseController.prototype.sendPushMessage = function (subscription, payloadText) {
    // Let's look at payload
    this._API_KEY = 'AIzaSyBXxilQ3Zw6l76_mugJCdKuqDzfc6dyn9g';

    let payloadPromise = Promise.resolve(null);
    if (payloadText && payloadText.trim().length > 0) {
        payloadPromise = EncryptionHelperFactory.generateHelper()
            .then(encryptionHelper => {
                return encryptionHelper.encryptMessage(
                    subscription, payloadText);
            });
    }

    return Promise.all([
        payloadPromise
    ])
        .then(results => {
            const payload = results[0];
            const vapidHeaders = results[1];

            let infoFunction = this.getWebPushInfo;
            infoFunction = () => {
                return this.getWebPushInfo(subscription, payload,
                    vapidHeaders);
            };
            if (subscription.endpoint.indexOf(
                    'https://android.googleapis.com/gcm/send') === 0) {
                infoFunction = () => {
                    return this.getGCMInfo(subscription, payload,
                        this._API_KEY);
                };
            }
            const requestInfo = infoFunction();
            this.sendRequestToProxyServer(requestInfo);
        });
};

FirebaseController.prototype.sendRequestToProxyServer = function (requestInfo) {
    console.log('Sending XHR Proxy Server', requestInfo);
    const fetchOptions = {
        method: 'post',
        mode: 'no-cors'
    };

    if (requestInfo.body && requestInfo.body instanceof ArrayBuffer) {
        requestInfo.body = this.toBase64(requestInfo.body);
        fetchOptions.body = requestInfo;
    }
//http://firedemo-cb0b6.appspot.com/
//http://localhost:8080/
    fetchOptions.body = JSON.stringify(requestInfo);
    fetch('https://firedemo-cb0b6.appspot.com/', fetchOptions)
        .then(function (response) {
            if (response.status >= 400 && response.status < 500) {
                console.log('Failed web push response: ', response, response.status);
                throw new Error('Failed to send push message via web push protocol');
            }
        })
        .catch(err => {
            console.error(err);
        });
};

FirebaseController.prototype.toBase64 = function (arrayBuffer, start, end) {
    start = start || 0;
    end = end || arrayBuffer.byteLength;

    const partialBuffer = new Uint8Array(arrayBuffer.slice(start, end));
    return btoa(String.fromCharCode.apply(null, partialBuffer));
};

