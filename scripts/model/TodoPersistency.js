/*global jQuery, todo */
/*jshint unused:false */

(function () {
	'use strict';

	jQuery.sap.declare('todo.TodoPersistency');

	todo.TodoPersistency = function (oNoteKey) {
		this.key = oNoteKey;
	};

	todo.TodoPersistency.prototype = (function () {
		
		// var storage = window.localStorage;

		return {
			get: function (getToDosCallback) {
				// var getToDosCallback = function(data){
					// var data = data.val().data;
					// var model = JSON.parse(storage.getItem(this.key));
					// model.todos = data;
					// storage.setItem(this.key, JSON.stringify(model));
					// return JSON.parse(storage.getItem(this.key));
				// }.bind(this);
				Server.getToDoList(this.key, getToDosCallback);
				// return JSON.parse(storage.getItem(this.key));
			},
			set: function (data) {
				// storage.setItem(this.key, JSON.stringify(data));
				// var todos = JSON.parse(storage.getItem(this.key)).todos;
				var nActive = 0;
				$.each(data.todos, function(key, item){
					if (item.done === false){
						nActive++;
					}
				}.bind(this));
				var nCompleted = Object.keys(data.todos).length - nActive;
				
				Server.saveTodoList(nActive, nCompleted, data.todos, this.key);
				return this; // for method chaining
			},
			remove: function () {
				storage.removeItem(this.key);				
				var todos = JSON.parse(storage.getItem(this.key)).todos;
				Server.removeToDoList(this.key);
				return this; // for method chaining
			},
			isEmpty: function () {
				return !(this.get());
			}
		};
	}());
})();
