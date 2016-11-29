sap.ui.define([
		"medicare/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/m/GroupHeaderListItem",
		"sap/ui/Device",
		"medicare/model/formatter",		
	], function (BaseController, JSONModel, Filter, FilterOperator, GroupHeaderListItem, Device, formatter) {
		"use strict";

		return BaseController.extend("medicare.controller.Master", {

			formatter: formatter,

			/* =========================================================== */
			/* lifecycle methods                                           */
			/* =========================================================== */

			/**
			 * Called when the master list controller is instantiated. 
			 * It sets up the event handling for the master/detail communication 
			 * and other lifecycle tasks.
			 * @public
			 */
			onInit : function () {
				// Control state model
				var oList = this.byId("list"),
				oViewModel = this._createViewModel(),
				iOriginalBusyDelay = oList.getBusyIndicatorDelay();
				this._oList = oList;
				this._oListFilterState = {
					aSearch : []
				};
				var oJsonData = {  
					items: []
				};  
				oViewModel.setData(oJsonData);  
				this.getView().setModel(oViewModel);
		
				oList.attachEventOnce("updateFinished", function(){
					oViewModel.setProperty("/delay", iOriginalBusyDelay);
				});

				this.getView().addEventDelegate({
					onBeforeFirstShow: function () {
						var oViewModel = this.getView().getModel();			
						
						var callback = function (data) {
							var endpoints = data.val();
							$.each( endpoints, function( key,item ) {
								var notesNo = (item.notes !== undefined) ? Object.keys(item.notes).length : 0;
						     	this.getView().getModel().getData().items.push({
						     		photoUrl: item.photoUrl,
						     		agentPlatform: item.userAgentPlatform,
						     		agentName: item.name, 
						     		notesNo:notesNo,  
						     		email:item.email, 
						     		key:key
						     	});
						   		
					    	}.bind(this));
					    	this._oList.getBinding("items").refresh();
						   	this._oList.setSelectedItem(this._oList.getItems()[0], true, true);
					    }.bind(this);
					   
						Server.getAllSubscriptions(callback);
						this.getOwnerComponent().oListSelector.setBoundMasterList(oList);
						
					}.bind(this)
				});
				
				// Makes sure that master view is hidden in split app
				// after a new list entry has been selected.
				this.getOwnerComponent().oListSelector.attachListSelectionChange(function () {
					this.byId("idAppControl").hideMaster();
				}, this);
				
				
				// this._onMasterMatched();
				this.getRouter().attachBypassed(this.onBypassed, this);
			},
			
			onExit: function(){
				this.onLogOut();
			},
			
			/**
			 * 
			 */
			onLogOut: function(){
				Server.signOut();
				this.getRouter().navTo("overview",{});
			},

			/* =========================================================== */
			/* event handlers                                              */
			/* =========================================================== */

			/**
			 * After list data is available, this handler method updates the
			 * master list counter and hides the pull to refresh control, if
			 * necessary.
			 * @param {sap.ui.base.Event} oEvent the update finished event
			 * @public
			 */
			onUpdateFinished : function (oEvent) {
				this._oList.setSelectedItem(this._oList.getItems()[0], true, true);
				// update the master list object counter after new data is loaded
				this._updateListItemCount(oEvent.getParameter("total"));
				// hide pull to refresh if necessary
				this.byId("pullToRefresh").hide();
			},
			
			
			onRefresh : function () {
				this._oList.getBinding("items").refresh();
				this.byId("pullToRefresh").hide();
			},

			/**
			 * Event handler for the master search field. Applies current
			 * filter value and triggers a new search. If the search field's
			 * 'refresh' button has been pressed, no new search is triggered
			 * and the list binding is refresh instead.
			 * @param {sap.ui.base.Event} oEvent the search event
			 * @public
			 */
			onSearch : function (oEvent) {
			
			},

			



			/**
			 * Event handler for the list selection event
			 * @param {sap.ui.base.Event} oEvent the list selectionChange event
			 * @public
			 */
			onSelectionChange : function (oEvent) {
				// get the list item, either from the listItem parameter or from the event's source itself (will depend on the device-dependent mode).
				this._showDetail(oEvent.getParameter("listItem") || oEvent.getSource());
				this.getView().getParent().getParent().oPopup.close();
			},

			/**
			 * Event handler for the bypassed event, which is fired when no routing pattern matched.
			 * If there was an object selected in the master list, that selection is removed.
			 * @public
			 */
			onBypassed : function () {
				this._oList.removeSelections(true);
			},



			/**
			 * Event handler for navigating back.
			 * We navigate back in the browser historz
			 * @public
			 */
			onNavBack : function() {
				history.go(-1);
			},

			/* =========================================================== */
			/* begin: internal methods                                     */
			/* =========================================================== */
			_createViewModel : function() {
				return new JSONModel({
					isFilterBarVisible: false,
					filterBarLabel: "",
					delay: 0,
					title: this.getResourceBundle().getText("masterTitleCount", [0]),
					noDataText: this.getResourceBundle().getText("masterListNoDataText"),
					sortBy: "email",
					groupBy: "None"
				});
			},

			/**
			 * If the master route was hit (empty hash) we have to set
			 * the hash to to the first item in the list as soon as the
			 * listLoading is done and the first item in the list is known
			 * @private
			 */
			_onMatched :  function(){
				if (this.getView().getModel().getData().items.length === 0) {
					this.getRouter().getTargets().display("detailNoObjectsAvailable");
				}
				else{
					var sObjectId = this.getView().getModel().getData().items[0].key;
					this.getRouter().navTo("Detail", {objectId : sObjectId}, true);
				};
			},

			/**
			 * Shows the selected item on the detail page
			 * On phones an additional history entry is created
			 * @param {sap.m.ObjectListItem} oItem selected Item
			 * @private
			 */
			_showDetail : function (oItem) {
				var bReplace = !Device.system.phone;
				this.getRouter().navTo("Detail", {
					objectId : oItem.getBindingContext().getProperty("key")					
				}, bReplace);
			},

			/**
			 * Sets the item count on the master list header
			 * @param {integer} iTotalItems the total number of items in the list
			 * @private
			 */
			_updateListItemCount : function (iTotalItems) {
				var sTitle;
				// only update the counter if the length is final
				if (this._oList.getBinding("items").isLengthFinal()) {
					sTitle = this.getResourceBundle().getText("masterTitleCount", [iTotalItems]);
					this.getView().getModel().setProperty("/title", sTitle);
				}
				// this._onMasterMatched();
			},

			/**
			 * Internal helper method to apply both filter and search state together on the list binding
			 * @private
			 */
			_applyFilterSearch : function () {
				// var aFilters = this._oListFilterState.aSearch.concat(this._oListFilterState.aFilter),
					// oViewModel = this.getModel("masterView");
				// this._oList.getBinding("items").filter(aFilters, "Application");
				// // changes the noDataText of the list in case there are no filter results
				// if (aFilters.length !== 0) {
					// oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataWithFilterOrSearchText"));
				// } else if (this._oListFilterState.aSearch.length > 0) {
					// // only reset the no data text to default when no new search was triggered
					// oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataText"));
				// }
			},

		
			/**
			 * Internal helper method that sets the filter bar visibility property and the label's caption to be shown
			 * @param {string} sFilterBarText the selected filter value
			 * @private
			 */
			_updateFilterBar : function (sFilterBarText) {
				// var oViewModel = this.getModel("masterView");
				// oViewModel.setProperty("/isFilterBarVisible", (this._oListFilterState.aFilter.length > 0));
				// oViewModel.setProperty("/filterBarLabel", this.getResourceBundle().getText("masterFilterBarText", [sFilterBarText]));
			}

		});

	}
);
