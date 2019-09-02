#!/usr/bin/nodejs

// Get the Retokenizer class
var {Retokenizer} = require('./retokenizer');

// Define a Syntax
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

// Recursive Enclosures in the Syntax are Valid and Useful, Too
syntax.enclosures.push( { opener:'(', closer:')', syntax:syntax } );

// Instantiate the Retokenizer class with the Syntax
let tokenizer = new Retokenizer( syntax );

// A Code Sample To Test..
let code = '"abc" > "def" or ("xyz" <> "pqr")';
console.log( 'Code:\n====================\n' + code + '====================' );

// Tokenize Flat and Simple.. 
console.log( '\n--------------------\nSimple tokens (default):\n' )
let tokens = tokenizer.tokenize( code, syntax );
console.log( JSON.stringify(tokens,null,'  ') );

// Tokenize Rich and Condensed..
console.log( '\n--------------------\nRich tokens (default):\n' )
tokenizer = new Retokenizer( syntax, { rich:true, condense:true } );
tokens = tokenizer.tokenize( code );
console.log( JSON.stringify(tokens,null,'  ') );

