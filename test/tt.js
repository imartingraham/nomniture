var TT = require("../lib/tt")
		creds = require("./test-credentials"),
		t = new TT(creds.tt.client, creds.tt.emailAddress, creds.tt.password);


module.exports.testGoodrequest = function(test){
	var options = {
									"after" : "2013-02-28T00:00", 
									"state" : "activated", 
									"resolution" : "month",
									"version" : 2,
									"operation" : "campaignList"
								};
	t.request(options, function(err, data){
		test.expect(1);
		if(err){
			test.ok(false, err.message);
		}else{
			test.ok(true);
		}
		test.done();
	});
					
}

module.exports.testBadrequest = function(test){
	var options = {
									"after" : "2013-02-28T00:00", 
									"state" : "activated", 
									"resolution" : "month",
									"version" : 2,
									"operation" : "campaignList1" // purposefully bad operation
								};
	t.request(options, function(err, data){
		test.expect(1);
		if(err){
			test.ok(true, err.message);
		}else{
			test.ok(false, "This was supposed to fail");
		}
		test.done();
	});
}

module.exports.testGoodGetCampaignList = function(test){
	var options = {
									"after" : "2013-02-28T00:00", 
									"state" : "activated", 
									"resolution" : "month",
									"version" : 2
								};
	t.getCampaignList(options, function(err, data){
		test.expect(1);
		if(err){
			t.logger("error", err.message);
			test.ok(false, err.message);
		}else{
			// A successful return should have a campaigns object in the returne data
			if(typeof data.campaigns == 'undefined'){
				test.ok(false, "Response data should be object of campaigns");
			}else{
				test.ok(true);				
			}
		}
		test.done();
	});
}

module.exports.testGoodGetCampaign = function(test){
	var options = { id : creds.tt.testCampaign, version: 2 };
	t.getCampaign(options, function(err, data){
		test.expect(1);
		if(err){
			t.logger("error", err.message);
			test.ok(false, err.message);
		}else{
			test.ok(true);
		}
		test.done();
	});
}

module.exports.testBadGetCampaignIDMustBeNumber = function(test){
	var options = { id : "XXXXXXX", version: 2 };
	t.getCampaign(options, function(err, data){
		test.expect(1);
		if(err && err.message == "ID must be a number"){
			t.logger("error", err.message);
			test.ok(true, "This test should fail");
		}else{
			test.ok(false, "This test should return an error");
		}
		test.done();
	});
}

module.exports.testBadGetCampaignIncorrectVersion = function(test){
	var options = { id : creds.tt.testCampaign, version: 'asdf' };
	t.getCampaign(options, function(err, data){
		test.expect(1);
		if(err){
			t.logger("error", err.message);
			test.ok(true, err.message);
		}else{
			test.ok(false, "This test should fail");
		}
		test.done();
	});
}

module.exports.testGoodGetCampaignPerformance = function(test){
	var options = {
									"id": creds.tt.testCampaign,
									"start" : "2012-12-01T00:00", 
									"end" : "2013-02-28T11:59",
									"resolution" : "month"
								};
	t.getCampaignPerformance(options, function(err, response){
		test.expect(1);
		if(err){
			test.ok(false, err.message);
		}else{					
			test.ok(true);
		}
		test.done();
	});
}

module.exports.testBadGetCampaignPerformance = function(test){
	var options = {
									"id": creds.tt.testCampaign,
									"end" : "2013-02-28",
									"resolution" : "month"
								};
	t.getCampaignPerformance(options, function(err, response){
		test.expect(1);
		if(err){
			test.ok(true, err.message);
		}else{					
			test.ok(false, "This test should fail because there is no start options set");
		}
		test.done();
	});	
}

module.exports.testGoodAuditReport = function(test){
	var options = {
		"id": creds.tt.testCampaign,
		"start" : "2012-12-01T00:00", 
		"end" : "2013-02-28T11:59"
	};
	t.getAuditReport(options, function(err, response){
		test.expect(1);
		if(err){
			test.ok(false, err.message);
		}else{
			test.ok(true);
		}
		test.done();
	});
}

module.exports.testBadAuditReport = function(test){
	var options = {
		"id": creds.tt.testCampaign,
//		"start" : "2012-12-01T00:00", 
		"end" : "2013-02-28T11:59"
	};
	t.getAuditReport(options, function(err, response){
		test.expect(1);
		if(err){
			test.ok(true, "This test was supposed to fail");
		}else{
			test.ok(false, "This test was supposed to fail");
		}
		test.done();
	});
}
