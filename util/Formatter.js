jQuery.sap.declare("medicare.util.Formatter");


medicare.util.Formatter = {
	
	_statusStateMap : {
		"Neu" : "Warning",
		"Initial" : "Success"
	},
	
	statusState :  function (value) {
		var map = medicare.util.Formatter._statusStateMap;
		return (value && map[value]) ? map[value] : "None";
	},
	
	
	quantity :  function (value) {
		try {
			return (value) ? parseFloat(value).toFixed(0) : value;
		} catch (err) {
			return "Not-A-Number";
		}
	}
};