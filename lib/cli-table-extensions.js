Table = require('cli-table');

Table.prototype.getCompleter = function(columnPosition){
	var completions = []; 
	for(var i = 0, l = this.length; i < l; i++){
		completions.push(this[i.toString()][columnPosition]);
	}

	return function(line) {
	  var hits = completions.filter(function(c) {
	    if (c.indexOf(line) === 0) {
	      // console.log('bang! ' + c);
	      return c;
	    }
	  });
	  return [hits && hits.length ? hits : completions, line];
	};

};
