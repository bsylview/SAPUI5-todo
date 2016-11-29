/*global history */
sap.ui.define([
		"medicare/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"sap/ui/Device",
		"medicare/model/formatter",		
	], function (BaseController, JSONModel, Device, formatter) {
		"use strict";

		return BaseController.extend("medicare.controller.ClientMaster", {

			onInit : function () {
				this._oList = this.byId("clientList");
				
				this._initModel();
				Server.loadCurrentSubscription();
				
				this.getView().addEventDelegate({
					onBeforeFirstShow: function () {
						this._getAllNotes();
						// this.getOwnerComponent().oListSelector.setBoundMasterList(this._oList);
					}.bind(this)
				});
				
				
				// Makes sure that master view is hidden in split app
				// after a new list entry has been selected.
				this.getOwnerComponent().oListSelector.attachListSelectionChange(function () {
					this.byId("idAppControl").hideMaster();
				}, this);
				
				
				// Server.getNote(this._onRemoveNoteCallback.bind(this), this._onNewNoteCallback.bind(this));	
				this.getView().getModel().refresh();
			 	this._oList.getBinding("items").refresh();		
			},
			
			onRefresh: function(){
				this._initModel();
				this._getAllNotes();
				this.byId("pullToRefresh").hide();
			},
			
			onUpdateFinished : function (oEvent) {
				// hide pull to refresh if necessary
				this.byId("pullToRefresh").hide();
			},
			
			_onRemoveNoteCallback: function(data){
				var currentSubscription = Server.getDBCurrentSubscriptionKey();
				var note = data.val();
				if (note.endpoint === currentSubscription){
					$.each(this.getView().getModel().getData().notes, function(key, note){
						if (note.key === data.key){
							this.getView().getModel().getData().notes.splice(key,1);
						};
					}.bind(this));
				};
				this.getView().getModel().refresh();
			 	this._oList.getBinding("items").refresh();
			},
					
			
			_onNewNoteCallback: function(data){
				var currentSubscription = Server.getDBCurrentSubscriptionKey();
				var note = data.val();
				if (note.endpoint === currentSubscription){
					this.getView().getModel().getData().notes.push(
					{
						todosNo:note.todos.active+note.todos.completed, 
						title:note.title, 
						active:note.todos.active, 
						completed:note.todos.completed, 
						key:data.key
					});
					this.getView().getModel().getData().item.key = note.endpoint;
				}
			 	this._oList.getBinding("items").refresh();
			 	this._oList.setSelectedItem(this._oList.getItems()[0], true, true);
			},
						
			onExit: function(){
				this.onLogOut();	
			},
					
			onBeforeRendering: function(){
			},
			
			onLogOut: function(){
				Server.signOut();
				this.getRouter().navTo("overview",{});
			},

			onSettingsOKPress: function(oEvent){
				var getNotifSwitchVal = sap.ui.getCore().byId("notificationsSwitch").getState();
				
				if (getNotifSwitchVal === this._checkSubscription()){
					this._oPopover.close();
					return;
				};
				
				this.getView().getModel().setProperty("/receiveNotificationsState", getNotifSwitchVal);
				if (getNotifSwitchVal === true){
					Server.subscribeUser();
				}else{
					try{
						Server.unsubscribeUser();
						this.getRouter().navTo("DetailNoObjectsAvailable");
						this._initModel();
						this.getView().getModel().refresh();
						this._oList.getBinding("items").refresh();					
					}catch(error){
						console.error("Member cannot be unsubscribed", error);
					};
				}
				this._oPopover.close();
			},
			
			onSelectionChange : function (oEvent) {
				this._showDetail(oEvent.getParameter("listItem") || oEvent.getSource());
				this.getView().getParent().getParent().oPopup.close();
			},

			_initModel: function(){
				var oJsonData = {  item: {key:""}, notes:[],receiveNotificationsState:""};  
				var oViewModel = this._createViewModel();
				oViewModel.setData(oJsonData);  
				this.getView().setModel(oViewModel);
			},
			
			_getAllNotes : function(){
				var getNotesCallback = function (data) {
					var currentSubscription = Server.getDBCurrentSubscriptionKey();
					var notes = data.val();
					$.each(notes, function(key, note){
						if (note.endpoint === currentSubscription){
							this.getView().getModel().getData().notes.push({todosNo:note.todos.active+note.todos.completed, title:note.title, active:note.todos.active, completed:note.todos.completed, key:key});
							this.getView().getModel().getData().item.key = note.endpoint;
							this.getView().getModel().setProperty("/receiveNotificationsState", false);
						}
					}.bind(this));
			     	this._oList.getBinding("items").refresh();
			     	this._oList.setSelectedItem(this._oList.getItems()[0], true, true);
			    }.bind(this);		  
				Server.getNotes(getNotesCallback);
				
			},
			
			_checkSubscription: function(){
				return Server.hasSubscription();
			},
			
			onOpenSettingsePopover: function(oEvent){
				if (! this._oPopover) {
					this._oPopover = sap.ui.xmlfragment("medicare.view.ViewSettingsDialog", this.getView().getController());
					// this.getView().addDependent(this._oPopover);
				}; 
				
				if (this._checkSubscription()){
					this.getView().getModel().setProperty("/receiveNotificationsState", true);	
				}else{
					this.getView().getModel().setProperty("/receiveNotificationsState", false);
				};
				
				this._oPopover.setModel(this.getView().getModel());
				// this._oPopover.openBy(oEvent.getSource());
				this._oPopover.open(); 
			},
			
			_createViewModel : function() {
				return new JSONModel({
					isFilterBarVisible: false,
					filterBarLabel: "",
					delay: 0,
					title: this.getResourceBundle().getText("masterTitleCount", [0]),
					noDataText: this.getResourceBundle().getText("masterListNoDataText"),
					sortBy: "title",
					groupBy: "None"
				});
			},

			_showDetail : function (oItem) {
				var bReplace = !Device.system.phone;
				this.getRouter().navTo("ClientNoteTile",{
					objectId : this.getView().getModel().getData().item.key,
					noteKey : oItem.getBindingContext().getProperty("key"),
					noteTitle: oItem.getBindingContext().getProperty("title")
				}, bReplace);
		 		this._oList.getBinding("items").refresh();
			}
		});

	}
);
