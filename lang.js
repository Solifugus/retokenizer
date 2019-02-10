#!/usr/bin/nodejs

var Lexiparse = require('./lexiparse.js');

// ===================<< Language Support Functions >>=========================

function varVal( params ) {
	// TODO
	return 0;
}

function numLit( params ) {
	// TODO
	return 0;
}

function strLit( params ) {
	// TODO
	return '';
}

function booLit( params ) {
	// TODO
	return true;
}

function evalExpr( params ) {
	// TODO
	return 42;
}

function evalCond( params ) {
	// TODO
	return true;
}

function stmtInput( params ) {
	// TODO
}

function stmtOutput( params ) {
	// TODO
	console.log('output');
}

function stmtAssign( params ) {
	// TODO
}

function stmtIfThenElse( params ) {
	// TODO
}

function stmtIfThen( params ) {
	// TODO
}

function stmtExit( params ) {
	// TODO
}

// ======================<< Language Definition >>=============================
// segment_name: { options:[ string | [sequence array ending with func], func] }
let language = {
	'stmt':[
		[':var','=','input', stmtInput],
		['output','=',':expr', stmtOutput ],
		[':var','=',':expr', stmtAssign ],
		['if',':cond','then',':stmt','else',':stmt', stmtIfThenElse ],
		['if',':cond','then',':stmt', stmtIfThen ],
		['exit', stmtExit ],
	],
	'expr': [ 
		':var',
		':numlit',
		':strlit',
		':boolit',
		[':expr','+',':expr'], 
		[':expr','-',':expr'], 
		[':expr','*',':expr'], 
		[':expr','/',':expr'], 
		evalExpr
	],
	'cond':[ 
		':boolit',
		['not',':cond'],
		[':cond','and',':cond'],
		[':cond','or',':cond'],
		[':expr','=',':expr'],
		[':expr','<>',':expr'],
		[':expr','>',':expr'],
		[':expr','<',':expr']
		handler: evalCond
	],
	'var':    [/^[a-z][a-z0-9]*/i, varVal],
	'numlit': [':/\-?[0-9]*(\.[0-9]+)?', numLit],
	'strlit': [':/"[^"]*"', strLit],
	'boolit': ['true','false', booLit]
};

// ======================<< Sample Program >>=============================
let program = 'x = 5\noutput = x\n';


var interpreter = new Lexiparse( language, 'stmt', { caseful:false, ignore:[' ','\t','\n'] } );
interpreter.run( program );


