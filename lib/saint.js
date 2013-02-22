var util = require("util"),
		Client = require("./client");
		
		
var Saint = function(username, sharedSecret, environment, options){
	this.defaultWaitTime = 5;
	this.waitTime = (options && options.waitTime) ? options.waitTime : this.defaultWaitTime;
	this.methods = {
		exportCreateJob: 'Saint.ExportCreateJob',
		exportGetStatus: 'Saint.CheckJobStatus',
		exportGetFileSegment: 'Saint.ExportGetFileSegment',
		importCreateJob: 'Saint.ImportCreateJob',
		importPopulateJob: 'Saint.ImportPopulateJob',
		importCommitJob: 'Saint.ImportCommitJob'
	}

	this.init.apply(this, arguments);
}
util.inherits(Saint, Client);
var p = Saint.prototype;
p.clientRequest = Client.prototype.request;
p.getJob = function(parameters, callback){
	var self = this;
	this.clientRequest(this.methods.exportCreateJob, parameters, function(err, data){
		if(err){ callback(new Error(err.message)); }
		if(data.errors){
			callback(new Error(data.errors[0]));
		}else{
			self.getQueuedJob(data, callback);
		}
	});
}

p.getQueuedJob = function(jobId, callback){
	this.logger("info", "Getting Queued Job");
	var self = this,
			jobData = {"job_id" : jobId };
	this.clientRequest(this.methods.exportGetStatus, jobData, function(err, data){
		if(err){ 
			callback(err, data); 
		}else{
			var json = JSON.parse(data);

			if(json[0].status.toLowerCase() == 'completed' && json[1] && json[1].status.toLowerCase() == 'ready'){
				if(parseInt(json[1].viewable_pages,10) > 0){
					callback(null, json);
				}else{
					callback(new Error("There were no viable pages for SAINT job "+jobId));
				}
			}else if(json.status == "failed"){
				callback(new Error(json.status+": "+json.error_msg));
			}else{
				self.logger("info", "Job: "+jobId+" not ready yet");
				setTimeout(function(){
					self.logger("info", "Checking job: "+jobId+" status");
					self.getQueuedJob(jobId, callback);
				}, self.waitTime * 1000)
			}
		}
	});
};

p.getJobSegment = function(fileId, pageNum, callback){
	var self = this,
			segmentData = {"file_id": fileId, "segment_id": pageNum }
	this.clientRequest(this.methods.exportGetFileSegment, segmentData, function(err, data){
		if(err){ callback(new Error(err.message)); };
		var json = JSON.parse(data);
		if(json.length > 0){
			json = json[0];
			if(json.header == null || json.data == null){
				callback(new Error('No data was returned: ' + data));
			}else{
				callback(null, json);
			}
		}else{
			callback(new Error('Malformed formatted data response: '+ data));
		}
	});
}

p.importJob = function(jobDescription, jobData, callback){

}

p.importCreateJob = function(jobDescription, callback){
	var self = this;
	this.request(this.methods.importCreateJob, jobDescription, function(err, data){
		var json = JSON.parse(data);
		if(err || data.toLowerCase() == 'failed' || typeof json.errors != 'undefined'){ 
			var message = '';
			if(err && err.message){
				message = err.message;
			}else if (json.errors.length){
				message = json.errors[0];
			}else{
				message = "failed to create import job";
			}
			callback(new Error(message)); 
		}else{
			callback(null, data);
		}
	});	
}

p.importPopulateJob = function(populateData, callback){
		var self = this;
		this.request(this.methods.importPopulateJob, populateData, function(err, data){
			var json = JSON.parse(data);
			if(err || data.toLowerCase() == 'failed' || typeof json.errors != 'undefined'){
				var message = '';
				if(err && err.message){
					message = err.message;
				}else if (json.errors.length){
					message = json.errors[0];
				}else{
					message = "Failed to populate job " + jobId	
				}
				callback(new Error(message)); 
			}else{
				callback(null, data);
			}
		});
}

p.importCommitJob = function(jobId, callback){
	var self = this;
	this.request(this.methods.importCommitJob, {job_id: jobId}, function(err, data){
		var json = JSON.parse(data);
		if(err || data.toLowerCase() == 'failed' || typeof json.errors != 'undefined'){ 
			var message = '';
			if(err && err.message){
				message = err.message;
			}else if(json.errors){
				message = json.errors[0];
			}else{
				message = "SAINT JOB: "+jobId+" failed to import";
			}
			callback(new Error(message)); 
		}else{
			callback(null, data);
		}
	});
}

module.exports = Saint;
