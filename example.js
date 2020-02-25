//Promise/A+ implementation. See: http://promises-aplus.github.io/promises-spec/
var when = require('when'), 
	autotask = require('./lib/autotask'); 

//TODO: This needs to be updated based on a call to: getZoneInfo()
var url = 'https://webservices3.autotask.net/atservices/1.5/atws.wsdl',
	username = 'username', 
	password = 'password',
	resource = null; 

autotask.connect(url, username, password)
//Get information on our usage stats. 
.then(autotask.getThresholdAndUsageInfo) 
.then(function(data){
	console.log(data);

	//Get information about the user that logged in.
	return autotask.getResources(username); 
})
.then(function(resources){
	resource = resources && resources.length === 1 ? resources[0]: null;
	if(resource === null){
		console.log('Could not find that user.');
		process.exit(); 
	} 
	console.log('Welcome ' + resource.FirstName);

	//Get account information 
	return autotask.getAccounts('YourAccountName');
})
.then(function(accounts){
	console.log(accounts); 
});
