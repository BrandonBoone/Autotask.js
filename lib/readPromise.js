var read = require('read'),
	when = require('when');

module.exports = function(options){
	return when.promise(function(resolve, reject, notify){
		read(options, function(er, input) {
			if(er){ 
				reject(er);
			}else{
				resolve(input);
			}
		});
	});
};