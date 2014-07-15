//#Autotask Console
//
//Mainly used as a driver for the development of the autotask.js library.
//Eventually autotask.js should be used in a web-application for ease of access. 
//Not everyone will have the node runtime on their machine when making a time entry.
//
//*Based on https://www.autotask.net/help/content/Userguides/T_WebServicesAPIv1_5.pdf*
//
//**TODO LIST**
// - Handle errors.... 
// - Handle bad input.... (wrong username, password)
// - Allow entering non-task related time. (Vacation, etc.)
// - Allow the user to pick the Role and cache it for future use
// - Allow the user to pick the AllocationId and cache it for future use
// - Allow the user to delete his saved preferences
// - Obfuscate/Encrypt the UserName/Password when saving to disk
// - Extend for other department use.

	//Promise/A+ implementation. See: http://promises-aplus.github.io/promises-spec/
var when = require('when'), 
	//Autotask API wrapper
	autotask = require('./lib/autotask'), 
	//Read with a promise wrapper 
	read = require('./lib/readPromise'), 
	//File system access
	fs = require('fs'),
	//For printing pretty tables in the console
	Table = require('cli-table'),
	//For iterating over arrays/objects
	_ = require('lodash-node'), 

	//*TODO:Break out the console into an evented obejct.*
	events = require('events'),
	eventEmitter = new events.EventEmitter();

//Custom extensions for integrating with completers
require('./lib/cli-table-extensions');

process.on ("SIGINT", function(){
	//gracefully handle shutdown via Ctlr+C
 	eventEmitter.emit('quit');
});

eventEmitter.on('quit', function(){
	console.log('goodbye'.cyan.inverse);
 	process.exit();
});

eventEmitter.on('start', function(){
	console.log('Press Ctrl+C to quit at any time.'.cyan.underline.inverse);
});


//The webservices URL to hit. 
//*TODO: This needs to be updated based on a call to: getZoneInfo()*
var url = 'https://webservices3.autotask.net/atservices/1.5/atws.wsdl';


//The preferences object to be written to disk
var m_prefs = {
	username: '', 
	password: ''
};

//*TODO:Can we get rid of these?*
//A time entry object
var m_timeEntry = {}; 
var m_resource = {}; 


function mainLoop(){

	eventEmitter.emit('start');

	//Read the cached file containing the username/password
	readFile('prefs.json')
	.then(loadPreferencesOrPromptUser)
	.then(function(){

		console.log('Connecting...'.green.inverse);
		return autotask.connect(url, m_prefs.username, m_prefs.password); 
	})
	//Get information on our usage stats. 
	.then(autotask.getThresholdAndUsageInfo) 
	.then(function(data){
		console.log(data.yellow);

		//Get information about the user that logged in.
		return autotask.getResources(m_prefs.username); 
	})
	.then(function(resources){
		m_resource = resources && resources.length === 1 ? resources[0]: null;
		if(m_resource === null){
			console.log('Could not find that user.');
			process.exit(); 
		} 
		console.log(('Welcome ' + m_resource.FirstName).cyan.inverse);

		//Get the resource roles. 
		return autotask.getResourceRole(m_resource.id); 
	})
	.then(function(resourceRole){
		//*TODO: This is not returning a single role, but a collection of roles. *
		m_resource.RoleId = resourceRole.RoleID;

		console.log('loading SRS data...'.green.inverse);
		//Get SRS infomation so we can query for projects. 
		return autotask.getAccounts('SRS');
	})
	.then(function(accounts){
		console.log('loading [Dev-Eng] projects...'.green.inverse);

		//Enter main loop for entering time.
		return when.promise(function(resolve, reject, notify){
			timeEntryLoop(resolve, accounts);
		}); 

	})
	.then(function(){
		eventEmitter.emit('quit');
	});

}

//##Time entry loop
//Iterate over this loop until the user is done entering his time.
function timeEntryLoop(resolve, accounts){

	when.promise(function(resolve, reject, notify){
		getTaskIdLoop(resolve, accounts);
	})
	.then(function(tasks){
		console.log(tasks.toString());

		return when.promise(function(resolve, reject, notify){
			getId(resolve, 'To make a time entry please enter an id from an above task: ', tasks.getCompleter(0));
		}); 
	})
	.then(function (taskId) {
		//Begin to build our time entry object. Not sure how to accomplish this without a global yet.
		//Perhaps we could pass the object into the asynchronous methods? 
		m_timeEntry = {}; 
		//The task ID we are going to add a time entry to
		m_timeEntry.taskId = taskId; 

		//Get the hours
		return when.promise(function(resolve, reject, notify){
			getHours(resolve);
		}); 
	})
	.then(function (hours) {
		//Add the hours to our time entry object
		m_timeEntry.hours = hours; 

		//Get the Comments
		return when.promise(function(resolve, reject, notify){
			getComment(resolve);
		}); 
	})
	.then(function (comment) {
		//Add the Comments to our time entry object
		m_timeEntry.comment = comment; 

		//*TODO: Get RoleId*
		return autotask.createTimeEntry(m_resource.id, null, m_timeEntry.hours, m_timeEntry.comment, m_timeEntry.taskId);
	}).
	then(function(result){
		//If we have a result then let the user know it was saved.
		if(result && result.createResult && result.createResult.ReturnCode === 1){
			console.log('saved'.green.inverse);
		}else{
			//Otherwise, let them know an error occurred. 
			console.log('Could not save due to error'.red.inverse);
		}

		//Ask if they'd like to make a second entry
		return when.promise(function(resolve, reject, notify){
			return askQuestion(resolve, 'Would you like to make a second entry');
		}); 
	}).then(function(input){
		//Yes
		if(input === '1'){
			//Re-enter time entry loop
			timeEntryLoop(resolve, accounts);
		}else{
			//No, then quit
			resolve();
		}
	});

}

//Get the [Dev-Eng] projects, but first check if we've already retrieved them
var getProjects = (function(){

	//Cache the project table incase of multiple time entries.
	var projectTable = null; 

	return function(accountId, force){

		if(force){
			projectTable = null; 
		}

		return when.promise(function(resolve, reject, notify){
			
			if(projectTable){
				resolve(projectTable);
			}else{
				autotask.getProjects(accountId, '[Dev-Eng]')
				.then(function(projects){
					var projArray = _.map(projects, function(project) { return [project.id, project.ProjectName]; });

					projectTable = new Table({ head: ['id', 'name'] });
					projectTable.push.apply(projectTable, projArray);

					resolve(projectTable);
				});
			}
		}); 
	};
})(); 


var getTasks = (function(){

	//Cache of tasks already returned from autotask
	var tasksTables = {}; 

	return function(projectId, force){

		if(force){
			delete tasksTables[projectId]; 
		}

		return when.promise(function(resolve, reject, notify){
			
			if(tasksTables[projectId]){
				resolve(tasksTables[projectId]);
			}else{
				autotask.getTasks(projectId)
				.then(function(tasks){

					if(tasks && tasks.length > 0){

						var taskArray = _.map(tasks, function(task) { return [task.id, task.Title]; });

						tasksTables[projectId] = new Table({ head: ['id', 'name'] });
						tasksTables[projectId].push.apply(tasksTables[projectId], taskArray);

						resolve(tasksTables[projectId]);
					}else{
						resolve();
					}

				});
			}
		}); 
	};
})(); 

//Iterate until we find a task ID
function getTaskIdLoop(resolve, accounts){
	getProjects(accounts[0].id)
	.then(function(projects){

		//Write out the resulting table
		console.log(projects.toString()); 

		return when.promise(function(resolve, reject, notify){
			getId(resolve, 'To make a time entry please enter an id from an above project: ', projects.getCompleter(0));
		}); 

	})
	.then(getTasks)
	.then(function(tasks){
		if(tasks){
			resolve(tasks);
		}else{
			console.log('No tasks were found, please enter another ID'.red.inverse);
			getTaskIdLoop(resolve, accounts);
		}
	});
}

//Use the preference data we already have or prompt the user for his username/password
function loadPreferencesOrPromptUser(data) {
	//If we have the data, use it. If not we'll have to prompt the user to enter it.
	if(data){
		m_prefs = data; 
	}else{
		//Get the username
		return read({ prompt: 'Username: '})
		.then(function(input){
			m_prefs.username = input; 

			//Get the password
			return read({ prompt: 'Password: ', silent: true });
		})
		.then(function(input){
			m_prefs.password = input; 

			return when.promise(function(resolve, reject, notify){
				askQuestion(resolve, 'Would you like me to remember that (plain text storage)');
			}); 
		})
		.then(function (input) {
			//If they choose to remember then write the file out.
			if(input === '1'){
				return writeFile('prefs.json', m_prefs);
			}
		});
	}
}


function getId(resolve, prompt, completer){
	read({ prompt: prompt, completer: completer})
	.then(function(input){
		var id = parseInt(input, 10);
		if(!isNaN(id) && id > 0){
			resolve(id); 
		}else{
			console.log('You must enter a number'.red.inverse);
			getId(resolve, prompt, completer);
		}
	});
}

//Prompts for hours and verifies they are correct, otherwise re-prompts.
function getHours(resolve){
	 read({ prompt: 'How much time did you spend: '})
	.then(function(input){
		var time = parseFloat(input, 10).toFixed(2);
		if(time > 0 && time <= 24){
			resolve(time); 
		}else{
			console.log('Time must be > 0 and <= 24'.red.inverse);
			getHours(resolve);
		}
	});
}

//Prompts for comments and verifies they are correct, otherwise re-prompts.
function getComment(resolve){
	 read({ prompt: 'Please make a comment about your time entry: '})
	.then(function(input){
		if(input.trim() !== ''){
			resolve(input); 
		}else{
			console.log('Comments are not optional'.red.inverse);
			getComment(resolve);
		}
	});
}

//Prompts with a Yes (1) or No (0) question and verifies if 1 or 0 was entered, otherwise re-prompts
function askQuestion(resolve, question){
	read({ prompt: question + '? [no:0,yes:1] '})
	.then(function(input){
		switch(input){
			case '0':
			case '1': 
				resolve(input);
				break;
			default: 
				console.log('Please enter 0 for no and 1 for yes.'.red.inverse);
				askQuestion(resolve, question);
		}
	});
}

//Writes a object to disk
function writeFile(fname, obj){
	return when.promise(function(resolve, reject, notify){
		fs.writeFile(fname, JSON.stringify(obj), function(err) {
		    if(err) {
		        reject(err);
		    } else {
		        resolve(true);
		    }
		});
	}); 
}

//Reads an object from disk
function readFile(fname){
	return when.promise(function(resolve, reject, notify){
		fs.readFile(fname, 'utf8', function (err,data) {
			if(err) {
		        resolve(null);
		    } else {
		        resolve(JSON.parse(data));
		    }
		});
	}); 
}

mainLoop();
