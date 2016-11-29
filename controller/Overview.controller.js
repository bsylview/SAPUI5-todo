sap.ui.define([
        "medicare/controller/BaseController",
        "sap/ui/model/json/JSONModel",
        "medicare/model/formatter"
    ], function (BaseController, JSONModel, formatter) {
        "use strict";

        return BaseController.extend("medicare.controller.Overview", {
			
			onInit: function(){
				this.getView().addEventDelegate({
					onBeforeFirstShow: function () {
						
					}.bind(this)
				});
			},
			
			onBeforeRendering: function(){
							
			},
			
			onAfterRendering: function(){
				var vBox = this.getView().byId("overviewVBoxId");
				vBox.addStyleClass("overviewScreenVBox");
				var hBox = this.getView().byId("overviewHBoxId");
				hBox.addStyleClass("overviewScreenHBox");
			},
			
			_routeToView: function(){
				
				var user = Server.getCurrentUser();
				if (user != null) {
				  user.providerData.forEach(function (profile) {
				    console.log("  Photo URL: "+profile.photoURL);
				  });
				}
				
				var userEmail = user.email;	
				var callback = function(data){
					this._admin = data.val().key;
					var ok = false;
					$.each(data.val(), function(key, item){
						if (userEmail === item.key){
							ok = true;
							return;
						}
					}.bind(this));
					
					if (ok){
						this.getRouter().navTo("App",{});
					}else{
						this.getRouter().navTo("ClientApp",{});
					}
					
				}.bind(this);
				Server.getAdmin(callback.bind(this));
  				
			},
			
			onLogIn: function(){				
				if (Server.checkUserSignedIn()){
             	   this._routeToView();
               }else{
              		Server.signIn().then(function(){
              			this._routeToView();
              		}.bind(this));
               }
			}

        });
        
    }
);
