'use strict';

function SWController() {
    this.checkSetup();
};

SWController.prototype.checkSetup = function () {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('../sw.js')
            .then(
            	this.initialiseState()
            	)
            .catch(function (error) {
            	console.log('Service Worker Error :^(', error);
        });
    } else {
        console.warn('Service workers aren\'t supported in this browser.');
    }
};

SWController.prototype.initialiseState = function() {
    if (!('showNotification' in ServiceWorkerRegistration.prototype)) {
        console.warn('Notifications aren\'t supported.');
        return;
    }
    if (Notification.permission === 'denied') {
        console.warn('The user has blocked notifications.');
        return;
    }
    if (!('PushManager' in window)) {
        console.warn('Push messaging isn\'t supported.');
        return;
    }
    navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
        serviceWorkerRegistration.pushManager.getSubscription()
            .then(function(subscription) {
                window.Server.setSWRegistration(serviceWorkerRegistration);
                if (!subscription) {
                    return;
                }
                var sub =  JSON.stringify(subscription);
                const endpointSections =JSON.parse(sub).endpoint.split('/');
                const subscriptionId = endpointSections[endpointSections.length - 1];
                // Keep your server in sync with the latest subscriptionId
                window.Server.setCurrentSubscription(subscription);
                window.Server.setCurrentSubscriptionKey(subscriptionId);
            })
            .catch(function(err) {
                console.warn('Error during getSubscription()', err);
            });
    });
};