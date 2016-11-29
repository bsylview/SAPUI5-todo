/*global location */
sap.ui.define([
		"medicare/controller/BaseController",
		"sap/ui/model/json/JSONModel"
	], function (BaseController, JSONModel) {
		"use strict";
	    
		return BaseController.extend("medicare.controller.ClientDetail", {
	
            model: null,
			
            /* =========================================================== */
            /* lifecycle methods                                           */
            /* =========================================================== */
            onInit : function () {
				this._initModel();			
				this.getRouter().getRoute("ClientDetail").attachPatternMatched(this._onObjectMatched, this);   
            },
            
            _initModel: function(){
				this.model = new JSONModel({}); 
				var oJsonData = {item: {key:""}, noteKey:{key:""}, todos:[]};  
				this.model.setData(oJsonData);  
				this.getView().setModel(this.model);
			},
			
			/**
			 * Event handler  for navigating back.
			 * It there is a history entry we go one step back in the browser history
			 * If not, it will replace the current entry of the browser history with the master route.
			 * @public
			 */
			onNavBack : function() {
				var sPreviousHash = History.getInstance().getPreviousHash();
				if (sPreviousHash !== undefined) {
					history.go(-1);
				} else {
					this.getRouter().navTo("master", {}, true);
				}
			},
			
			/**
			 * Binds the view to the object path and expands the aggregated line items.
			 * @function
			 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
			 * @private
			 */
			_onObjectMatched : function (oEvent) {
				var sObjectId =  oEvent.getParameter("arguments").objectId;
				var oNoteKey =  oEvent.getParameter("arguments").noteKey;
				
				this._initModel();
			
				var oViewModel = this.getView().getModel();
				this.getView().getModel().setProperty("/email", "");	
				var oSubscription = Server.getSubscriptionByKey(sObjectId,  function(data) {
  					var sEmail = data.val().email;
  					this.getView().getModel().setProperty("/email", sEmail);		
  				}.bind(this));
				oViewModel.getData().item.key = sObjectId;	
				oViewModel.getData().noteKey.key = oNoteKey;		
				oViewModel.setProperty("/busy", false);
			},
			
			
		});

	}
);
