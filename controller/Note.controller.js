/*global location */
sap.ui.define([
        "medicare/controller/BaseController",
        "sap/ui/model/json/JSONModel",
        "medicare/model/formatter"
    ], function (BaseController, JSONModel, formatter) {
        "use strict";
		jQuery.sap.require('model.TodoPersistency');
        
        return BaseController.extend("medicare.controller.Note", {

            formatter: formatter,
            model: null,
			
            /* =========================================================== */
            /* lifecycle methods                                           */
            /* =========================================================== */
            onInit : function () {
				this._initModel();			
				this.getRouter().getRoute("NoteTile").attachPatternMatched(this._onObjectMatched, this);   
				this.getRouter().getRoute("ClientNoteTile").attachPatternMatched(this._onClientObjectMatched, this);
            },
            
            _initModel: function(){
				this.model = new JSONModel({}); 
				var oJsonData = {item: {key:""}, noteKey:{key:""}, todos:[]};  
				this.model.setData(oJsonData);  
				this.getView().setModel(this.model);
			},
			
 			/**
             * Event handler  for navigating back.
             * @public
             */
            onNavBack : function() {
            	if (sap.ui.Device.system.phone=== true && this.isClient === true){
            		this.getRouter().navTo("clientMaster");
            	}else{
            		this.getRouter().navTo("Detail", {objectId : this.getView().getModel().getData().item.key}, true);
            	}
            },
            
            _updateLocalStore: function(oNoteKey){
				this.store = new todo.TodoPersistency(oNoteKey);
				this.getView().getModel().getData().todos = [];
				var getToDosCallback = function(data){
						if (data !== undefined && data.val().data !== undefined){
							var data = data.val().data;
							this.model.getData().todos = data;
						}else{
							this.model.getData().todos = [];
						}
						this.model.updateBindings(true);
				}.bind(this);
				this.store.get(getToDosCallback);					
           },
	
			_processEvent: function(sObjectId, oNoteKey){
				
					this._initModel();
					this._updateLocalStore(oNoteKey);
					var oViewModel = this.getView().getModel();
					this.getView().getModel().setProperty("/noteTitle", "");	
					Server.getNoteByKey(oNoteKey,  function(data) {
	  					var sNoteTitle = data.val().title;
	  					this.getView().getModel().setProperty("/noteTitle", sNoteTitle);		
	  				}.bind(this));
					oViewModel.getData().item.key = sObjectId;	
					oViewModel.getData().noteKey.key = oNoteKey;		
					oViewModel.setProperty("/busy", false);	
				
			},
			
			_getEndpointCallback: function(data){
				this._currentEndpoint = JSON.parse(data.val().endpoint);
			},
			
			/**
			 * Binds the view to the object path and expands the aggregated line items.
			 * @function
			 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
			 * @private
			 */
			_onObjectMatched : function (oEvent) {
				this.isClient = false;
				var sObjectId =  oEvent.getParameter("arguments").objectId;
				var oNoteKey =  oEvent.getParameter("arguments").noteKey;
				oNoteKey = "-" + oNoteKey;
				this._currentNoteKey = oNoteKey;
				this._currentNoObjectFound = "DetailObjectNotFound";
				var hasEndpointAndNote = Server.hasEndpointAndNote(sObjectId, oNoteKey, this._onHasEndpointAndNoteCallback.bind(this));
				if ( hasEndpointAndNote === false){
					this.getRouter().navTo(this._currentNoObjectFound);
				}else{					
					this._processEvent(sObjectId,oNoteKey);	
					Server.getSubscriptionByKey(sObjectId, this._getEndpointCallback.bind(this));
					this.getView().getModel().setProperty("/showFooter", true);					
					this.getView().getModel().setProperty("/showNavButton", true);
				}
			},
			
			_onHasEndpointAndNoteCallback: function(data){
				var ok = false;
				$.each(data.val(), function(key, note){
					if (note.key === this._currentNoteKey){
						ok = true;
						return;
					}
				}.bind(this));
				
				if (ok){
					return true;
				}else{
					this.getRouter().navTo(this._currentNoObjectFound);
				}
			},
			
			/**
			 * Binds the view to the object path and expands the aggregated line items.
			 * @function
			 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
			 * @private
			 */
			_onClientObjectMatched : function (oEvent) {
				this.isClient = true;
				var sObjectId =  oEvent.getParameter("arguments").objectId;
				var oNoteKey =  oEvent.getParameter("arguments").noteKey;
				this._currentNoteKey = oNoteKey;
				this._currentNoObjectFound = "DetailNoObjectsAvailable";
				var hasEndpointAndNote = Server.hasEndpointAndNote(sObjectId, oNoteKey, this._onHasEndpointAndNoteCallback.bind(this));
				if ( hasEndpointAndNote === false){
					this.getRouter().navTo(this._currentNoObjectFound);
				}else{
					this._processEvent(sObjectId,oNoteKey);	
					this.getView().getModel().setProperty("/showFooter", false);	
					if (sap.ui.Device.system.phone){
							this.getView().getModel().setProperty("/showNavButton", true);
					}
					else{				
						this.getView().getModel().setProperty("/showNavButton", false);
					}	
				}	
			},
			
			onOpenNotificationPopover:function(oEvent){
				if (! this._oNotificationPopover) {
					this._oNotificationPopover = sap.ui.xmlfragment("medicare.view.NotificationTextPopover", this);
					this.getView().addDependent(this._oPopover);
				}; 
				var closeCallback = function(data){
					data.oSource.getContent()[0].setValue("");
				};
				this._oNotificationPopover.attachBeforeClose(closeCallback);
				this._oNotificationPopover.openBy(oEvent.getSource());
			},
			
			onNotificationInputEnter: function(oEvent){
				this._oNotificationPopover._endButton.firePress();
				this._oNotificationPopover.close();
			},
			
			onSendNotification: function(oEvent){
				var sNotificationMessage = this._oNotificationPopover.getContent()[0].getValue();
				if (sNotificationMessage !== null){
					try{
						Server.sendNotification(this._currentEndpoint, sNotificationMessage);
					}catch(error){
						console.error("Error sending notification!", error);
					}
					this._oNotificationPopover.getContent()[0].setValue("");
				 	this._oNotificationPopover.close();
				};			
			},
			
			// Create a new todo
			createTodo: function (todo) {
				todo = todo.trim();
				if (todo.length === 0) {
					return;
				};
				var todos = this.model.getProperty('/todos/');
				todos.push({
					id: jQuery.sap.uid(),
					done: false,
					text: todo
				});
				this.model.setProperty('/todos/', todos);
				this.store.set(this.model.getData());
				this.model.updateBindings(true);
			},
	
			// Clear todo
			clearTodo: function (todo) {
				var todos = this.model.getProperty('/todos/');
				for (var i = todos.length - 1; i >= 0; i--) {
					if (todos[i].id === todo.getProperty('id')) {
						todos.splice(i, 1);
					}
				};
				this.model.setProperty('/todos/', todos);
				this.store.set(this.model.getData());
				this.model.updateBindings(true);
			},
	
			// Clear all completed todos
			clearCompletedTodos: function () {
				var todos = this.model.getProperty('/todos/');
				for (var i = todos.length - 1; i >= 0; i--) {
					if (todos[i].done === true) {
						todos.splice(i, 1);
					}
				}
				this.model.setProperty('/todos/', todos);
				this.store.set(this.model.getData());
				this.model.updateBindings(true);
			},
	
			// Complete / reopen all todos
			toggleAll: function () {
				var todos = this.model.getProperty('/todos/');
				var hasOpenTodos = todos.some(function (element, index, array) {
					return element.done === false;
				});
				todos.forEach(function (todo) {
					todo.done = hasOpenTodos;
				});
				this.store.set(this.model.getData());
				this.model.updateBindings(true);
			},
	
			// Complete / reopen a todo
			todoToggled: function (todo) {
				this.store.set(this.model.getData());
				this.model.updateBindings(true);
			},
	
			// Rename a todo
			todoRenamed: function (todo) {
				var text = todo.getProperty('text').trim();
				if (text.length === 0) {
					this.clearTodo(todo);
				} else {
					todo.getModel().setProperty(todo.getPath() + '/text', text);
					this.store.set(this.model.getData());
					this.model.updateBindings(true);
				}
			},
	
			// Change model filter based on selection
			todosSelected: function (selectionMode) {
				if (selectionMode === 'AllTodos') {
					this.getView().changeSelection([]);
				} else if (selectionMode === 'ActiveTodos') {
					this.getView().changeSelection(
						[new sap.ui.model.Filter('done',
							sap.ui.model.FilterOperator.EQ, false)]);
				} else if (selectionMode === 'CompletedTodos') {
					this.getView().changeSelection(
						[new sap.ui.model.Filter('done',
							sap.ui.model.FilterOperator.EQ, true)]);
				}
			}

			
           
        });

    }
);
