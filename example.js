#!/usr/bin/nodejs

tokenizer = require('./retokenizer.js');

// Contract Logic Syntax 
syntax = {
	label:'statement',
	splitters:[' ','if','then','else'], 
	enclosures:[{
		opener:'(',	escaper:'\\', closer:')',
		syntax:{
			label:'condition',
			splitters:[' ','and','or','not','including','excluding','>=','>','<=','<=','<','=','+','-','*','/','%'],
			enclosures:[{ opener:'"', 'escape':'\\', closer:'"' }]
		}
	}]
};

let code = "if (plan = premium) then (services = best excluding exclusives)";
let tokens = tokenizer(code,syntax);
console.log( JSON.stringify(tokens,null,'  ') );

