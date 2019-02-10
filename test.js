#!/usr/bin/nodejs

tokenizer = require('./retokenizer.js');

// Contract Logic Syntax 
var syntax = {
	splitters:[
	' ','\t','\n',
	'<>','>=','<=','=','>','<',
	'not','and','or',
	'includes','excludes'
	],
	removes:[' ','\t'],
	enclosures:[
		{ opener:'"', escaper:'\\', closer:'"' },
		{ opener:'--', closer:'\n' }
	]
};
syntax.enclosures.push( { opener:'(', closer:')', syntax:syntax } );

let code = '"abc" > "def" or ("xyz" <> "pqr")';
console.log( 'Code:\n====================\n' + code + '====================' );

// Simple array of mostly strings but also arrays for sub-syntaxes, and objects for regular expressions identified
console.log( '\n--------------------\nSimple tokens (default):\n' )
let tokens = tokenizer( code, syntax );
console.log( JSON.stringify(tokens,null,'  ') );

// All tokens are turned into objects with line numbers added -- future versions of retokenizer may add more attributes
console.log( '\n--------------------\nRich tokens (default):\n' )
//tokens = tokenizer( code, syntax, { rich:true, condense:true } );
tokens = tokenizer( code, syntax, { rich:true, condense:true, betweens:'throw' } );
console.log( JSON.stringify(tokens,null,'  ') );

