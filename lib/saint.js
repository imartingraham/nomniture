var util = require("util"),
		_ = require('underscore'),
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

			if(data[0].status.toLowerCase() == 'completed' && data[1] && data[1].status.toLowerCase() == 'ready'){
				if(parseInt(data[1].viewable_pages,10) > 0){
					callback(null, data);
				}else{
					callback(new Error("There were no viable pages for SAINT job "+jobId));
				}
			}else if(data.status == "failed"){
				callback(new Error(data.status+": "+data.error_msg));
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

		if(_.isArray(data) && data.length > 0){
			data = data[0];
			if(data.header == null || data.data == null){
				callback(new Error('No data was returned: ' + data));
			}else{
				callback(null, data);
			}
		}else{
			callback(new Error('Malformed formatted data response: '+ data));
		}
	});
}

p.importJob = function(jobDescription, jobData, callback){
	var self = this,
			populateData =[];
	while(jobData.length){
		populateData.push(jobData.splice(0,10000));
	}

	self.logger("info", "Creating Import Job");
	this.importCreateJob(jobDescription, function(err, data){
		if(err){ callback(new Error(err.message)); return; };
		var jobId = data;
		self.logger("Populating Job "+jobId);
		populateData.forEach(function(item, index){
			var reportData = {
				job_id: jobId,
				page: (index + 1),
				rows: item
			};
			self.importPopulateJob(reportData, function(err, data){
				self.logger("info", "Populated page "+ (index+1));
				if(err){ 
					callback(new Error(err.message)); 
				}else{
					if(index == populateData.length - 1){
						self.logger("info", "Committing job " + jobId);
						self.importCommitJob(jobId, function(err, data){
							if(err){ callback(new Error(err.message)); }
							callback(null, {status: data, jobId: jobId});
						});
					}
				}
			});
		});
	});
}

p.importCreateJob = function(jobDescription, callback){
	var self = this;
	this.request(this.methods.importCreateJob, jobDescription, function(err, data){
		if(err || (data.status && data.status.toLowerCase() == 'failed') || typeof data.errors != 'undefined'){ 
			var message = '';
			if(err && err.message){
				message = err.message;
			}else if (data.errors.length){
				message = data.errors[0];
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

		if(err || (data.status && data.status.toLowerCase() == 'failed') || typeof data.errors != 'undefined'){
			var message = '';
			if(err && err.message){
				message = err.message;
			}else if (data.errors.length){
				message = data.errors[0];
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

		if(err || (data.status && data.status.toLowerCase()) == 'failed' || typeof data.errors != 'undefined'){ 
			var message = '';
			if(err && err.message){
				message = err.message;
			}else if(data.errors){
				message = data.errors[0];
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
