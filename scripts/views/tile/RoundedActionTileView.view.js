jQuery.sap.require("tileController.RoundedActionTileController");
sap.ui.jsview("tile.RoundedActionTileView", {

	/**
	 * Specifies the Controller belonging to this View. In the case that it is
	 * not implemented, or that "null" is returned, this View does not have a
	 * Controller.
	 * 
	 * @memberOf prototypes.main
	 */
	getControllerName : function() {
		return "tileController.RoundedActionTileController";
	},
		

	/**
	 * Is initially called once after the Controller has been instantiated. It
	 * is the place where the UI is constructed. Since the Controller is given
	 * to this method, its event handlers can be attached right away.
	 * @memberOf prototypes.main
	 */
	createContent : function(oController){
		// var oTilesContainer = new sap.m.TileContainer('tileContainer');
		// oTilesContainer.setHeight("80%");
		// oTilesContainer.setVisible(true);
		var controls = [];
		for ( var c in this.getController().tiles) {
			var tileItem = new tile.RoundedActionTile();
			tileItem.setTitle(this.getController().tiles[c]["title"]);
			tileItem.setIcon("sap-icon://" + this.getController().tiles[c]["icon"]);
			if (this.getController().tiles[c]["cssClass"])
				tileItem.setCssClass(this.getController().tiles[c]["cssClass"]);
			if (this.getController().tiles[c]["iconColor"])
				tileItem.setIconColor(this.getController().tiles[c]["iconColor"]);
			if (this.getController().tiles[c]["options"]) {
				tileItem.setTileOptions(this.getController().tiles[c]["options"]);
			}
			this.getController().tiles[c].object = tileItem;
			tileItem.attachPress({
				index : c
			}, this.getController().showOptions, this);
			tileItem.attachActionPress(this.getController().handleAction, this);
			controls.push(tileItem);
			// oTilesContainer.addTile(.tileItem);
		}
		
		var tileWraper = new sap.ui.commons.layout.HorizontalLayout({
			content: [controls]
		});

	
		// controls.push(tileWraper);

		return tileWraper;
	}

});