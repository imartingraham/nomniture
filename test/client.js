var Client = require("../lib/client"),
		creds = require("./test-credentials");


module.exports.testSimpleRequest = function(test){
	var c = new Client(creds.username, creds.sharedSecret, 'sanJose', {log: false});
	c.request("Company.GetReportSuites", [], function(err,data){
		test.expect(1);
		if(err){
			test.ok(false, err.message);
		}else{
			test.ok(true, "Omniture request successful");
		}
		test.done();
	});
}

module.exports.testBadCredentials = function(test){
	var c = new Client(creds.username, creds.sharedSecret + '123', 'sanJose', {log: false});
	c.request("Company.GetTokenCount",[], function(err,data){
		test.expect(1);
		if(err){
			test.ok(true, "Request failed successfully: " + err.message);
		}else{
			test.ok(false, "Request was supposed to fail");
		}
		test.done();
	});
}

module.exports.testIncorrectDataInRequest = function(test){
	var c = new Client(creds.username, creds.sharedSecret, 'sanJose', {log: false}),
			requestData = {
				"rsid_list":[creds.reportSuiteId + "12"]
			}
	// we"re supplying an incorrect report suite. This should return an error
	c.request("ReportSuite.GetAvailableElements", requestData, function(err, data){
		test.expect(1);
		if(err){
			test.ok(true,"Request failed successfuly: "+err.message);
		}else{
			test.ok(false, "Request was supposed to fail");
		}
		test.done();
	});
}

module.exports.testReturnResponseBodyOnParseError = function(test){
	var c = new Client(creds.username, creds.sharedSecret, 'sanJose', {log: false});
	c.request("Company.GetTokenCount",[], function(err,data){
		test.expect(1);
		if(err){
			test.ok(false, err.message);
		}

		if(typeof data == "number"){
			test.ok(true, "Return value is "+data);
		}else{
			try{
				var json = JSON.parse(data);
				test.ok(false, "This should have not returned a JSON string");
			}catch(e){
				// invalid json response
				test.ok(true, data + " is not a JSON string");
			}
		}
		test.done();
	})
}
