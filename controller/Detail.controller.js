/*global location */
sap.ui.define([
		"medicare/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"medicare/model/formatter",
		"sap/m/MessageToast"
	], function (BaseController, JSONModel, formatter, MessageToast) {
		"use strict";

		return BaseController.extend("medicare.controller.Detail", {

			formatter: formatter,
	
			/* =========================================================== */
			/* lifecycle methods                                           */
			/* =========================================================== */
			onInit : function () {
				this._resetModel();				
				this.getRouter().getRoute("Detail").attachPatternMatched(this._onObjectMatched, this);             
				this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
			},
			
			_resetModel: function(){
				var oViewModel = new JSONModel({
					busy : false,
					delay : 0,
					lineItemListTitle : this.getResourceBundle().getText("detailLineItemTableHeading")
				}); 
				var oJsonData = {  item: {key:""}, notes:[]};  
				oViewModel.setData(oJsonData);  
				this.getView().setModel(oViewModel);
			},
			
			/**
			 * Navigate to Note View
			 * @param oEvent
			 * @public
             */
			onTilePress: function(oEvent){
				var sNoteTitle = ""; 
				var oNotes = this.getView().getModel().getData().notes;
				$.each(oNotes, function(key, note){
					if (note.key.substring(1) === oEvent.getParameters().id){
						sNoteTitle = note.title;
					}
				}.bind(this));
				
				this.getRouter().navTo("NoteTile",{
					objectId : this.getView().getModel().getData().item.key,
					noteKey : oEvent.getParameters().id,
					noteTitle: sNoteTitle		
				});
			},

			_clearNoteBlock: function(noteKey){
				var oObjectPageSubs = this.getView().byId("notesPage");  
				var oBlocks = oObjectPageSubs.getBlocks();
				$.each( oBlocks, function( key,item ) {
					if (item.sId === noteKey.substring(1)){
						item.setVisible(false);
					}					  	
				}.bind(this));
				
			},

			_drawNote: function(tileKey, tileTitle, activeTasks, completedTasks){
				var oObjectPageSubs = this.getView().byId("notesPage");
				if (typeof sap.ui.getCore().byId(tileKey.substring(1)) === "undefined"){
					var oTile = new sap.m.GenericTile(tileKey.substring(1));
	                var oTileContent = new sap.m.TileContent();
	                var oNewsContent = new sap.m.NewsContent();
	                oTileContent.setContent(oNewsContent);
			        oTile.addTileContent(oTileContent);
			        if (activeTasks === 0 && completedTasks !== 0){
			        	oTile.setBackgroundImage("./images/gr3.jpg");	
			        }else{
	                	oTile.setBackgroundImage("./images/bg.png");	
	               };
	                oTile.setFrameType("TwoByOne");
	                oTile.setHeader(tileTitle);
	                oTile.setSubheader("Active: " + activeTasks + "  Completed: " + completedTasks);
					oTile.attachPress(this.onTilePress.bind(this));
					oObjectPageSubs.addBlock(oTile);
				}else{
					var oTile = sap.ui.getCore().byId(tileKey.substring(1));
					oTile.setVisible(true);
					 if (activeTasks === 0 && completedTasks !== 0){
			        	oTile.setBackgroundImage("./images/gr3.jpg");	
			        }else{
	                	oTile.setBackgroundImage("./images/bg.png");	
	               };
				    oTile.setSubheader("Active: " + activeTasks + "  Completed: " + completedTasks);
					// oObjectPageSubs.addBlock(oTile);
				}
			},
			
			_handleAddNoteForm: function(oInputField){
				if (!oInputField.getValue()) {
					oInputField.setValueState("Error");
				}
				// check states of inputs
				var canContinue = true;
				if ("Error" === oInputField.getValueState()) {
					canContinue = false;
					return false;
				}
				// output result
				if (canContinue) {
					return oInputField.getValue();
				} else{
					
				}
			},
			
			_openAddNotePopover: function(oEvent){
				if (! this._oPopover) {
					this._oPopover = sap.ui.xmlfragment("medicare.view.AddNote", this);
					this.getView().addDependent(this._oPopover);
				}; 
				var closeCallback = function(data){
					data.oSource.getContent()[0].setValue("");
				};
				this._oPopover.attachBeforeClose(closeCallback);
				this._oPopover.openBy(oEvent.getSource());
			},
			
			onOpenDeleteNotesPopover:function(oEvent){
				if (! this._oDeletePopover) {
					this._oDeletePopover = sap.ui.xmlfragment("medicare.view.DeleteNotes", this);
					var clearSelectionsCallback = function(data){
						this._oDeletePopover.getModel().refresh();
						this._oDeletePopover.setModel(this.getView().getModel());
						data.oSource.getContent()[0].clearSelection();
					}.bind(this);
					this._oDeletePopover.setModel(this.getView().getModel());
					this._oDeletePopover.attachBeforeOpen(clearSelectionsCallback);
				};
				this.getView().addDependent(this._oDeletePopover);
				this._oDeletePopover.openBy(oEvent.getSource());
			},
			
			handleDeleteNotesSelectionFinish:function(oEvent){
				this.selectedDeleteItems = oEvent.getParameter("selectedItems");
			},
			
			onOpenAddNotePopover: function(oEvent){
				this._openAddNotePopover(oEvent);
			},
			
			onInputEnter: function(oEvent){
				this._oPopover._endButton.firePress();
			},
						
			_updateMasterList:function(count){
				this.oList = this.getOwnerComponent().oListSelector.getList();
				this.listItems = this.oList.getBinding("items").oList;
				$.each(this.listItems, function(key, item){
					if (item.key === this.getView().getModel().getData().item.key){
						this.listItems[key].notesNo = parseInt(this.listItems[key].notesNo) + count;
						this.email = item.email;
						
						this.oList.getItems().some(function (oItem) {
							var oEmail = oItem.getIntro();
							if (this.email === oEmail){
								oItem.setNumber(this.listItems[key].notesNo);
							}
						}.bind(this));
					};
				}.bind(this));
			},
			
			/**
			 * Add new empty note for the current person
			 * @public
			 */
			onAddNote: function(oEvent){		
				this._oPopover.getContent()[0].setValueState("Success");		
				var sNoteTitle = this._handleAddNoteForm(this._oPopover.getContent()[0]);
				if (sNoteTitle !== false){
					var callback = function (data) {
						var dataKey = data.key;
						Server.updateSubscriptionWithNote(this.getView().getModel().getData().item.key, dataKey);
						this.getView().getModel().getData().notes.push({key:dataKey, title: sNoteTitle});
						var nActive = 0;
						var nCompleted = 0; 				
						this._drawNote(dataKey, sNoteTitle, nActive, nCompleted);
					}.bind(this);
				 	Server.addNewNote(this.getView().getModel().getData().item.key, sNoteTitle, callback);
				 	this._updateMasterList(1);	
					this._oPopover.getContent()[0].setValue("");
				 	this._oPopover.close();
				}							
			},
			
			
			onDeleteNotes:function(oEvent){
				var notes = this.selectedDeleteItems;
				if (notes !== undefined && notes.length !== 0)	{
					$.each(notes, function(key, item){
						this._blockKey = item.getProperty("key");
						$.each(this.getView().getModel().getData().notes, function(key, item){
							if (item !== undefined && item.key === this._blockKey){
								Server.deleteNote(this.getView().getModel().getData().item.key,this._blockKey);
								this._updateMasterList(-1);
								this._clearNoteBlock(this._blockKey);
								this.getView().getModel().getData().notes.splice(key,1);
							};
						}.bind(this));
						this._oDeletePopover.setModel(this.getView().getModel());
					}.bind(this));					
				};
				this._oDeletePopover.close();
							
				// this._getNotes(this.getView().getModel().getData().item.key);
			},

			

			// /* =========================================================== */
			// /* event handlers                                              */
			// /* =========================================================== */
			// /**
			 // * Updates the item count within the line item table's header
			 // * @param {object} oEvent an event containing the total number of items in the list
			 // * @private
			 // */
			// onListUpdateFinished : function (oEvent) {
				// var sTitle,
					// iTotalItems = oEvent.getParameter("total"),
					// oViewModel = this.getModel();
// 
				// // only update the counter if the length is final
				// if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
					// if (iTotalItems) {
						// sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
					// } else {
						// //Display 'Line Items' instead of 'Line items (0)'
						// sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
					// }
					// oViewModel.setProperty("/lineItemListTitle", sTitle);
				// }
			// },

			/**
			 * Event handler  for navigating back.
			 * It there is a history entry we go one step back in the browser history
			 * If not, it will replace the current entry of the browser history with the master route.
			 * @public
			 */
			onNavBack : function() {				
				this.getRouter().navTo("master");				
			},

			_getNotes: function(oObjectKey){
				var callback = function(data){
					var data = data.val();					
					$.each( data, function( noteKey,item ) {
					  	var endpoint = item.endpoint;
					  	var title = item.title;
					  	var active = item.todos.active;
					  	var completed = item.todos.completed;  
					  	if (endpoint === oObjectKey){
					  		this.getView().getModel().getData().notes.push(
					  				{
					  					key:noteKey, 
					  					title: title, 
					  					active: active, 
					  					completed: completed
					  				});				
							this._drawNote(noteKey, title, active, completed);
						}else{
							this._clearNoteBlock(noteKey);
						}
						
					}.bind(this));
					var data = 	this.getView().getModel().getData(); 
				}.bind(this);
				Server.getNotes(callback);
			},
			
			/* =========================================================== */
			/* begin: internal methods                                     */
			/* =========================================================== */
			/**
			 * Binds the view to the object path and expands the aggregated line items.
			 * @function
			 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
			 * @private
			 */
			_onObjectMatched : function (oEvent) {
				var sObjectId =  oEvent.getParameter("arguments").objectId;
				this._resetModel();				
				var oViewModel = this.getView().getModel();
				this.getView().getModel().setProperty("/email", "");	
				var oSubscription = Server.getSubscriptionByKey(sObjectId,  function(data) {
					if (data.val() !== null){
  						var sEmail = data.val().email;
	  					this.getView().getModel().setProperty("/name", data.val().name);	
	  					this.getView().getModel().setProperty("/photoURL", data.val().photoUrl);
	  					this.getView().getModel().setProperty("/email", sEmail);
  					}else{
						this.getRouter().navTo("DetailObjectNotFound");
						return;
  					}	
  				}.bind(this));
				oViewModel.getData().item.key = sObjectId;	
				oViewModel.setProperty("/busy", false);
			
				this._getNotes(sObjectId);
				
			},

		
			_onMetadataLoaded : function () {
				// Store original busy indicator delay for the detail view
				var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
					oViewModel = this.getModel("detailView"),
					oLineItemTable = this.byId("lineItemsList"),
					iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();

				// Make sure busy indicator is displayed immediately when
				// detail view is displayed for the first time
				oViewModel.setProperty("/delay", 0);
				oViewModel.setProperty("/lineItemTableDelay", 0);

				oLineItemTable.attachEventOnce("updateFinished", function() {
					// Restore original busy indicator delay for line item table
					oViewModel.setProperty("/lineItemTableDelay", iOriginalLineItemTableBusyDelay);
				});

				// Binding the view will set it to not busy - so the view is always busy if it is not bound
				oViewModel.setProperty("/busy", true);
				// Restore original busy indicator delay for the detail view
				oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
			}

		});

	}
);
