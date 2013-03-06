var util = require("util"),
		Client = require("./client"),
		http = require("https")
		crypto = require("crypto"),
		parser = require("xml2json"),
		querystring = require("querystring"),
		_ = require("underscore");
		
		
var TT = function(client,email, password, environment){
			this.host = "testandtarget.omniture.com";
			this.path = "/api";
			if(typeof environment == 'undefined'){
				environment = 'Production';
			}
			this.requestVars = {
				client: client,
				email: email,
				password: password,
				environment: environment
			};

		};
		
var p = TT.prototype;

p.getCampaignList = function(options, callback){
	options.operation = 'campaignList';

	this.request(options, function(err, response){
		if(err){ 
			callback(new Error(err.message)); 
		}else{
			callback(null, response);				
		}
	});
}

p.getCampaign = function(options, callback){
	if(!_.isNumber(options.id)){
		callback(new Error("ID must be a number"));
		return;
	}
	if(_.isUndefined(options.version)){
		options.version = 3;
	}
	options.operation = "viewCampaign";
	
	this.request(options, function(err, response){
		if(err){
			callback(new Error(err.message));
		}else{
			callback(null, response);
		}
	});

}

p.getCampaignPerformance = function(options, callback){
	if(!_.isNumber(options.id)){
		callback(new Error("ID must be a number"));
		return;
	}
	options.operation = "report";
	// use version 2 of this report by default
	if(_.isUndefined(options.version)){
		options.version = 2;
	}
	// normalize the difference in T&T API asking for id on some calls and campaignId on others :\
	options.campaignId = options.id;
	delete options.id;

	// filter extreme orders by default
	if(_.isUndefined(options.filterExtremeOrders)){
		options.filterExtremeOrders = true;
	}
	// return all segments by default
	if(_.isUndefined(options.segments)){
		options.segments = "allSegments";
	}
	
	this.request(options, function(err, response){
		if(err){
			callback(new Error(err.message));
		}else{
			callback(null, response);
		}
	});
	
}

p.getAuditReport = function(options, callback){
	if(!_.isNumber(options.id)){
		callback(new Error("ID must be a number"));
		return;
	}
	options.operation = "auditReport";
	options.format = "csv";
	options.campaignId = options.id;
	delete options.id;
	
	if(_.isUndefined(options.version)){
		options.version = 1;
	}
	
	this.request(options, function(err, response){
		if(err){
			callback(new Error(err.message));
		}else{
			callback(null, response);
		}
	});
}

p.request = function(options, callback){

 	var self = this,
			requestVars = this.mergeRequestVars(options);
			queryString= querystring.stringify(requestVars),
 			requestOptions = {
 				host: this.host,
 				path: this.path+"?"+queryString,
 				method: "GET",
 				rejectUnauthorized: false,
 				requestCert: false,
 				agent: false
 			}
			
 	var request = http.request(requestOptions, function(response){
 		self.logger("info","HTTP Request Successful");
		
 		var responseData = "";
 		// concatenate the response data as we get it
 		response.on("data", function(chunk){
 			responseData += chunk.toString();
		});
		response.on("end", function(){
			if(requestVars.operation != "auditReport" || (requestVars.operation == "auditReport" && responseData.match('xml'))){
				responseData = self.parseXML(responseData);				
			}
			if((!_.isUndefined(responseData.operation) && responseData.operation.status == "FAIL") || (!_.isUndefined(responseData.error))){
				if(!_.isUndefined(responseData.operation) && responseData.operation.status == "FAIL"){					
					callback(new Error(responseData.operation.status+": "+ responseData.operation.cause));
				}else{
					callback(new Error(responseData.error.message));
				}
			}else{
				callback(null, responseData);				
			}
		});
		
 	});
 	// log the errors if the request failed
 	request.on("error", function(e){
 		callback(new Error(e.message));
 	});
 	// send the POST data we"re requesting
// 	request.write();
 	// finally send the request
 	request.end();
 }
 
 p.parseXML = function(xml){
	 data = parser.toJson(xml, {object: true});
	return data
 }
 
 p.mergeRequestVars = function(options){
	 var requestVars = _.clone(this.requestVars);
	 
	 for(var key in options){
		 requestVars[key] = options[key];
	 }
	 return requestVars;
}

 p.logger = function(level, message) {
 	if(this.log){
     var levels = ["error", "warn", "info"],
 				debugLevel = "warn"
     if (levels.indexOf(level) >= levels.indexOf(debugLevel) ) {
       if (typeof message !== "string") {
         message = JSON.stringify(message);
       };
       console.log(level+": "+message);
     }
 	}
 }
 module.exports = TT;