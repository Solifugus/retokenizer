#!/usr/bin/nodejs

var {Retokenizer} = require('./retokenizer');

// Contract Logic Syntax 
syntax = {
	splitters:[' ','\n','if','then','else'], 
	removes:[' ','\t'],
	enclosures:[
		{
			label:'comment',
			opener:'/*',
			closer:'*/'
		},
		{
			label:'condition',
			opener:'(',
			escaper:'\\',
			closer:')',
			syntax:{
				splitters:[' ','and','or','not','>=','>','<=','<=','<','=','+','-','*','/',{type:'number',regex:'[0-9]+'}],
			removes:[' ','\t'],
				enclosures:[{ label:'string', opener:'"', 'escape':'\\', closer:'"' }]
			}
		}
	]
};
let tokenizer = new Retokenizer( syntax, { condense:true } );

let code = "/* some comment */\nif (plan = premium)\nthen (services = 509 * 301 )\n";
console.log( 'Code:\n====================\n' + code + '====================' );

// Simple array of mostly strings but also arrays for sub-syntaxes, and objects for regular expressions identified
console.log( '\n--------------------\nSimple tokens (default):\n' )
let tokens = tokenizer.tokenize( code );
console.log( JSON.stringify(tokens,null,'  ') );


