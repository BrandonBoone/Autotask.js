//#Autotask.js
//
//JavaScript wrapper for the autotask SOAP API. 
//
//##Current Implementation
// - Allow the user to enter time related to projects
// - Allow the user to query any of the autotask objects. (conditions are not currently implemented)
//
//##Up Next
// - Allow the user to enter time against general tasks. 

	//For making SOAP requests to Autotask
var soap = require('soap'),
	//Promise/A+ implementation. See: http://promises-aplus.github.io/promises-spec/
	when = require('when'),
	//For converting an Object Literal into a Autotask Query XML.
	handlebars = require('handlebars'),
	//The pre-complied handlebars templates.
	templates = require('./templates')(handlebars);


var m_client; 

//Must be called first in order to use any other methods
module.exports.connect = function(url, username, password){
	return when.promise(function(resolve, reject, notify){
		soap.createClient(url, function(err, client) {
			m_client = client; 
			m_client.setSecurity(new soap.BasicAuthSecurity(username, password));
			if(err){
				reject(err);
			}else{
				resolve(m_client);	
			}
		});
	});
};

module.exports.getAccounts = function(accountName){
	return query(m_client, {
		Account: [
			{
				AccountName: {
					equals: accountName
				}
			}
		]
	}); 
}; 

module.exports.getProjects = function(accountId, beginswith){
	return query(m_client, {
		Project: [
			{
				AccountID: {
					equals: accountId
				}
			}, 
			{
				CompletedPercentage: {
					lessthan: 100
				}
			}, 
			{
				ProjectName: {
					beginswith: beginswith
				}
			}
		]
	}); 
}; 

module.exports.getResources = function(username){
	return query(m_client, {
		Resource:[{
			Email: {
				equals:username
			}
		}]
	}); 
};

module.exports.getRoles = function(){
	return query(m_client, {
		Role:[{
			id: {
				isnotnull:''
			}
		}]
	}); 
};

module.exports.getResourceRole = function(resourceId){
	return query(m_client, {
		ResourceRole:[{
			ResourceID: {
				equals:resourceId
			}
		}]
	}); 
};

module.exports.getThresholdAndUsageInfo = function(){
	return when.promise(function(resolve, reject, notify){
		m_client.ATWS.ATWSSoap.getThresholdAndUsageInfo({}, function(err, result) {
				if(err){
					reject(err);
				}else{
					resolve(result.getThresholdAndUsageInfoResult.EntityReturnInfoResults.EntityReturnInfo[0].Message);	
				}
			}
		);
	});
};

module.exports.getAllocationCodes = function(){
	return query(m_client, {
		AllocationCode: [
			{
				id: {
					IsNotNull: ''
				}
			}
		]
	}); 
};

module.exports.getDepartments = function(){
	return query(m_client, {
		Department: [
			{
				id: {
					IsNotNull: ''
				}
			}
		]
	}); 
};

module.exports.getTasks = function(projectId){
	return query(m_client, {
		Task: [
			{
				ProjectID: {
					equals: projectId
				}
			}
		]
	}); 
};

module.exports.getTimeEntries = function(resourceId){

	var curr = new Date(); // get current date
	var first = curr.getDate() - curr.getDay(); // First day is the day of the month - the day of the week
	var last = first + 7; // last day is the first day + 6 (+7 since using 0000 time)

	var firstday = formatDate(new Date(curr.setDate(first)));
	var lastday = formatDate(new Date(curr.setDate(last)));

	return query(m_client, {
		TimeEntry: [
			{
				Type: {
					equals: 6
				},
				ResourceID: {
					equals: resourceId
				},
				DateWorked:{
					greaterthanorequals: firstday, 
					lessthanorequals: lastday
				}
			}
		]
	}); 
};

module.exports.getEntityInfo = function(fieldName){
	return when.promise(function(resolve, reject, notify){
		m_client.ATWS.ATWSSoap.getEntityInfo(
			{}, 
			function(err, result) {
				err = err ? err : (result && result.queryResult && result.queryResult.ReturnCode === -1 ? result.queryResult.Errors : null);
				if(err){
					reject(err);
				}else{
					resolve(result);	
				}
			}
		);
	}); 
};

module.exports.getFieldInfo = function(fieldName){
	return when.promise(function(resolve, reject, notify){
		m_client.ATWS.ATWSSoap.GetFieldInfo(
			{
				psObjectType: fieldName
			}, function(err, result) {
				err = err ? err : (result && result.queryResult && result.queryResult.ReturnCode === -1 ? result.queryResult.Errors : null);
				if(err){
					reject(err);
				}else{
					resolve(result);	
				}
			}
		);
	}); 
};

module.exports.getWsdlVersion = function(){
	return when.promise(function(resolve, reject, notify){
		m_client.ATWS.ATWSSoap.GetWsdlVersion(
			{}, 
			function(err, result) {
				err = err ? err : (result && result.queryResult && result.queryResult.ReturnCode === -1 ? result.queryResult.Errors : null);
				if(err){
					reject(err);
				}else{
					resolve(result);	
				}
			}
		);
	}); 
};

module.exports.getZoneInfo = function(username){
return when.promise(function(resolve, reject, notify){
		m_client.ATWS.ATWSSoap.getZoneInfo(
			{
				UserName: username
			}, 
			function(err, result) {
				err = err ? err : (result && result.queryResult && result.queryResult.ReturnCode === -1 ? result.queryResult.Errors : null);
				if(err){
					reject(err);
				}else{
					resolve(result);	
				}
			}
		);
	}); 
};


module.exports.createTimeEntry = function(resourceId, roleId, time, comment, taskId, allocationCode){
	return when.promise(function(resolve, reject, notify){
		m_client.ATWS.ATWSSoap.create(
			{
				Entities: [{
					Entity:{
						attributes:{
							'xsi:type':'TimeEntry'
						},
						TaskID: taskId, 
						DateWorked: formatDate(new Date()),
						ResourceID: resourceId,
						RoleID: roleId, 
						Type: 6, 
						HoursWorked: time, 
						SummaryNotes: comment,
						AllocationCodeID: allocationCode,
						InternalAllocationCodeID: allocationCode
					
					}
				}]
			}, function(err, result) {
				err = err ? err : (result && result.queryResult && result.queryResult.ReturnCode === -1 ? result.queryResult.Errors : null);
				if(err){
					reject(err);
				}else{
					resolve(result);	
				}
			}
		);
	}); 
};

module.exports.query = function(obj){
	return query(m_client, obj);
};

function query(client, obj){
	return when.promise(function(resolve, reject, notify){
		client.ATWS.ATWSSoap.query({
				sXML: templates["templates/query.hbr"](obj)
			}, function(err, result) {
				err = err ? err : (result && result.queryResult && result.queryResult.ReturnCode === -1 ? result.queryResult.Errors : null);
				if(err){
					reject(err);
				}else{
					resolve(convert(result));	
				}
			}
		);
	}); 
}

//Expose private functions through private API "_" for unit testing
module.exports._padZero = padZero; 
module.exports._padMiliSecs = padMiliSecs;
module.exports._convert = convert;
module.exports._flatten = flatten; 
module.exports._formatDate = formatDate; 

function formatDate(date){
	var hr = date.getHours(),
		min = date.getMinutes(),
		secs = date.getSeconds(),
		milSecs = date.getMilliseconds();

	return date.getFullYear() + "-" + 
			padZero(date.getMonth() + 1) + "-" + 
			padZero(date.getDate()) + 'T' + 
			padZero(hr) +':'+ 
			padZero(min) + ':' + 
			padZero(secs) + '.' + 
			padMiliSecs(milSecs) + 'Z';
}


function padZero(num){
	return parseInt(num, 10) < 10 ? "0" + num : num; 
}

function padMiliSecs(num){
	var returnVal = ""; 
	num = parseInt(num, 10);
	if(num < 100){
		returnVal += "0";
	}

	if(num < 10){
		returnVal += "0";
	}

	returnVal += num; 
	return returnVal; 
}

function convert(result){
	var data, results = [], i = 0, l = 0; 
	data = result.queryResult.EntityResults.Entity;
	
	if(!data){ return results; }

	for(i = 0, l = data.length; i < l; i++){
		results.push(flatten(data[i])); 
	}
	return results; 
}

function flatten(obj){
	var newObj = {}, key, tmp; 
	for(key in obj){
		tmp = obj[key];
		if(typeof tmp === 'string'){
			newObj[key] = tmp; 
		}else if(tmp.$value){
			if(tmp.attributes){
				switch(tmp.attributes['xsi:type']){
					case 'xsd:boolean':
						newObj[key] = Boolean(tmp.$value);
						break;
					case 'xsd:int':
					case 'xsd:decimal':
						newObj[key] = parseFloat(tmp.$value);
						break;
					case 'xsd:dateTime':
						newObj[key] = new Date(tmp.$value);
						break;
					default:
						newObj[key] = tmp.$value;
						break;
				}
			}else{
				newObj[key] = tmp.$value;
			}
		}
	}
	return newObj;
}

