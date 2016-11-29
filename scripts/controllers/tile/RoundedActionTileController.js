jQuery.sap.require("tile.RoundedActionTile");
sap.ui.controller("tileController.RoundedActionTileController", {
	
	tiles : [
				{
					title : "Tile 1",
					icon : "Chart-Tree-Map",
					options : [
								{
									title : "Browse",
									icon : "search",
									actionTag: "Tile 1 - Action 2"
								}, {
									icon : "delete",
									actionTag: "Tile 3 - Action 3"
								}
					]
				},
				{
					title : "Tile 2",
					icon : "Chart-Tree-Map",
					options : [
								{
									title : "Browse",
									icon : "search",
									actionTag: "Tile 1 - Action 2"
								}, {
									icon : "delete",
									actionTag: "Tile 3 - Action 3"
								}
					]
				}
	],
	
	onBeforeShow : function(oEvent) {
		for ( var c in this.tiles) {
			var tileItem = new tile.RoundedActionTile();
			tileItem.setTitle(this.tiles[c]["title"]);
			tileItem.setIcon("sap-icon://" + this.tiles[c]["icon"]);
			if (this.tiles[c]["cssClass"])
				tileItem.setCssClass(this.tiles[c]["cssClass"]);
			if (this.tiles[c]["iconColor"])
				tileItem.setIconColor(this.tiles[c]["iconColor"]);
			if (this.tiles[c]["options"]) {
				tileItem.setTileOptions(this.tiles[c]["options"]);
			}
			this.tiles[c].object = tileItem;
			tileItem.attachPress({
				index : c
			}.bind(this), this.showOptions.bind(this), this);
			tileItem.attachActionPress(this.handleAction, this);
			// this.getView().oTilesContainer.addTile(tileItem);
			// this.getView().byId("tilesContainer").addTile(tileItem);
		}
	},

	showOptions : function(oEvent, oParams) {
		var tiles = [
				{
					title : "Tile 1",
					icon : "Chart-Tree-Map",
					options : [
								{
									title : "Browse",
									icon : "search",
									actionTag: "Tile 1 - Action 2"
								}, {
									icon : "delete",
									actionTag: "Tile 3 - Action 3"
								}
					]
				},
				{
					title : "Tile 2",
					icon : "Chart-Tree-Map",
					options : [
								{
									title : "Browse",
									icon : "search",
									actionTag: "Tile 1 - Action 2"
								}, {
									icon : "delete",
									actionTag: "Tile 3 - Action 3"
								}
					]
				}
		];
		for ( var c in tiles) {
			oEvent.oSource.showActions(false);
		}
		if(tiles[oParams.index]["options"])
			oEvent.oSource.showActions(true);
		else
			this.handleAction(oEvent, oParams);
	},

	handleAction : function(oEvent, oParams) {
		if(oEvent.getParameter('action'))
			alert(oEvent.getParameter('action').actionTag);
		else
			alert(oEvent.getParameter('id'));
	}

});