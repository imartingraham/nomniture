var Report = require('../lib/report'),
		creds = require('./test-credentials');

module.exports.testGoodReport = function(test){
	var r = new Report(creds.username, creds.sharedSecret, 'sanJose', {log: false}),
			reportData =	{
				reportDescription: {
					reportSuiteID: "imprvdirectfaucet",
					dateFrom:"2012-01-01",
					dateTo:"2012-12-31",
					metrics:[{ id: "pageviews" }],
					"validate":"true"
				}
			};

	r.request('Report.QueueOvertime', reportData, function(err, data){
		test.expect(1);
		if(err){
			test.ok(false, err.message);
		}else{
			test.ok(true, "Status: "+ data.status + "\nMessage: "+ data.statusMsg )
		}
		test.done();
	});
}
	
module.exports.testBadReport = function(test){
	var r = new Report(creds.username, creds.sharedSecret, 'sanJose', {log: false}),
			reportData =	{
					reportDescription: {
						reportSuiteID: "imprvdirectfaucet",
						dateFrom:"2012-01-01",
						dateTo:"2012-12-31",
						metrics:[{ id: "pageviews" }],
						validate:"true"
					}
				};
	// Ranked reports need an element set in the request
	r.request('Report.QueueRanked', reportData, function(err, data){
		test.expect(1);
		// we want to get an error
		if(err){
			test.ok(true, err.message);
		}else{
			// we don't want this request to be successful.  It it's get's here
			// we haven't done our error handling correctly;
			test.ok(false, "Status: "+data.status + "\nMessage: "+data.statusMsg);
		}
		test.done();
	});
}