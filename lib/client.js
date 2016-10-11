var Client = function(username, sharedSecret, environment, options){
			this.init(username, sharedSecret, environment, options);
		};

var	crypto = require("crypto"),
		http = require("https"),
		p = Client.prototype;

p.init = function(username, sharedSecret, environment, options){	
	this.environments = {
      sanJose: "api.omniture.com",
      dallas: "api2.omniture.com",
      london: "api3.omniture.com",
      sanJoseBeta: "beta-api.omniture.com",
      dallasBeta: "beta-api2.omniture.com",
      sandbox: "api-sbx1.omniture.com"
    }
	this.username = username;
	this.sharedSecret = sharedSecret;
	this.environment = (environment) ? this.environments[environment] : this.environments.sanJose;
	this.nonce = null;
	this.created = null;
	this.version = +((options && options.version) || 1.3);
	this.path = "/admin/" + this.version + "/rest/";
	this.log = (options && options.log) ? true : false;
	this.proxy = options.proxy;
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

p.request = function(method, parameters, callback){
	var self = this;
	response = this.sendRequest(method, parameters, function(err,data){
		self.logger("info", "API Request Completed");
		// try to parse the data as JSON, if not, return the string of data
		if(err){
			callback(err);
		}else{
			try{
				var json = JSON.parse(data);
			}catch(e){ // if the string was not json, we just need to return it
				callback(null,data);
				return;
			}
			if(json.error){
				callback(new Error(json.error));
			}else{
				callback(null,json);
			}
		}
	});
}

p.sendRequest = function(method, parameters, callback){
	this.generateNonce();
	var self = this,
		options = {
			headers: this.requestHeaders(),
			rejectUnauthorized: false,
			requestCert: false,
			agent: false
		};
	if(self.proxy)
		options.proxy = self.proxy;	
	var request = require("request").defaults(options);
	request.post({url:"https://"+ this.environment+this.path+"?method="+method, form: parameters}, function (error, response, body) {
	  if (error || response.statusCode != 200) {
	  	callback(new Error(error));
	  	return;
	  }	
	  self.logger("info","HTTP Request Successful");
		var responseData = "";
		self.logger("info", "API Request Finished");
		callback(null,body);
	})
}

p.generateNonce = function(){
	// lets generate the strings we need for the header
	var randomString = Math.round((new Date().valueOf() * Math.random())) + "";
	this.created = this.formattedCurrentDate();
	this.nonce = crypto.createHash("md5").update(randomString).digest("hex");
	var combinedString = this.nonce+this.created+this.sharedSecret;
	var sha1String = crypto.createHash("sha1").update(combinedString).digest("hex");
	this.password = new Buffer(sha1String).toString("base64").replace(/\n/gi, "");
	this.logger("info", "Generated Nonce: "+ this.nonce);
}

p.formattedCurrentDate = function(){
	// The date formate needs to be %YYYY-%MM-%DDT%H:%M:%SZ
	return  new Date().toISOString().replace(/\.[\d]+Z$/, 'Z');
}

p.requestHeaders = function(){
	// set the header for the request
	this.headers = {
        "X-WSSE": "UsernameToken Username=\""+this.username+"\", "+
									"PasswordDigest=\""+this.password+"\", "+
									"Nonce=\""+this.nonce+"\", "+
									"Created=\""+this.created+"\""
      };
 return this.headers;
}

module.exports = Client;
