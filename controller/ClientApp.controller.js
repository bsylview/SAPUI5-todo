sap.ui.define([
		"medicare/controller/BaseController",
		"sap/ui/model/json/JSONModel"
	], function (BaseController, JSONModel) {
		"use strict";

		return BaseController.extend("medicare.controller.ClientApp", {

			onInit : function () {
				this.getView().byId('idClientAppControl').setMode('PopoverMode');
		
				this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
			}

		});

	}
);