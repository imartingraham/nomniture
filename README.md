# nomniture

This is a Node.js port of [ROmniture](https://github.com/msukmanowsky/ROmniture) by [msukmanowsky](https://github.com/msukmanowsky). 

## what is it
nomniture is a minimal Node.js module wrapper for [Omniture's REST API](http://developer.omniture.com).

There are two objects to use, `Client` and `Report`.  `Client` is the generic interface to the Omniture API.  `Report` adds a few helper methods to handle requesting a report and polling the Omniture API until the report is ready.  It then requests the report and returns the data.

Omniture's API is closed, you have to be a paying customer in order to access the data.

## installation
    [sudo] npm install nomniture

## initialization and authentication
nomniture requires you supply the `username`, `sharedSecret` and `environment` which you can access within the Company > Web Services section of the Admin Console.  The environment you'll use to connect to Omniture's API depends on which data center they're using to store your traffic data and will be one of:

* San Jose (https://api.omniture.com/admin/1.2/rest/)
* Dallas (https://api2.omniture.com/admin/1.2/rest/)
* London (https://api3.omniture.com/admin/1.2/rest/)
* San Jose Beta (https://beta-api.omniture.com/admin/1.2/rest/)
* Dallas (beta) (https://beta-api2.omniture.com/admin/1.2/rest/)
* Sandbox (https://api-sbx1.omniture.com/admin/1.2/rest/)

Here's an example of initializing with a few configuration options.

      // generic Client
      var Client = require('nomniture').Client;
      var c = new Client(username, sharedSecret, 'sanJose');

      // Report
      var Report = require('nomniture').Report;
      var r = new Report(username, sharedSecret, 'sanJose', {waitTime : 10}); // waitTime is optional, default is set to 5 seconds


## usage
There is only one core method for the user:
* request - handles all requests to the API.

For reference, I'd recommend keeping [Omniture's Developer Portal](http://developer.omniture.com) open as you code .  It's not the easiest to navigate but most of what you need is there.

The method takes three arguments:
* Report type - 'Report.QueueRanked', 'ReportSuite.GetAvailableMetrics'
* Parameters - These vary depending on the type of request.  This should be in an object.  If no data is needed, pass an empty object
* Callback function -  This function will be called when the request has finished.  This callback function has two arguments passessed: an error object (null, if no errors) and the response object.

If the response is a string or a number as it is for "Company.GetTokenCount", the response will be returned a such.  All other responses will be a parsed JSON object.

## examples
    // Get all available metrics using the Client object
    var Client = require('nomniture').Client,
        c = new Client(usernmae, sharedSecret, 'sanJose'),
        reportData = { "rsid_list": ["reportSuiteId"] }

    c.request('ReportSuite.GetAvailableMetrics', reportData, function(err, response){
      if(err){ throw new Error(err.message); }
      console.log(response);
    });

    // Use the Report object to get a pageView Overtime report
    var Report = require('nomniture').Report,
        option = {
          waitTime: 10, // optionally set the wait time between polling API
          log: true // default is false
        },
        reportData = {
          reportDescription: {
          reportSuiteID: "reportSuiteId",
          dateFrom: "2012-01-01",
          dateTo: "2012-01-31",
          metrics: [{ id: "pageviews" }],
          validate: "true"
        }
      };
    var r = new Report(username, sharedSecret, 'sanJose', options) // lets set our poll time to 10 seconds

    r.request("Report.QueueOvertime", reportData, function(err, response){
      if(err){ throw new Error(err.message); }
      console.log(response);
    });
    

