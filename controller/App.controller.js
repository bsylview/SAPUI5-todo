sap.ui.define([
		"medicare/controller/BaseController",
		"sap/ui/model/json/JSONModel"
	], function (BaseController, JSONModel) {
		"use strict";

		return BaseController.extend("medicare.controller.App", {

			onInit : function () {
				this.getView().byId('idAppControl').setMode('PopoverMode');
				this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
			}

		});

	}
);