# retokenizer

Retokenzier Version 1.0
Copyright (C) 2018 By Matthew C. Tedder
Licensed under the GNU GPL Version 2 (See LICENSE file)

DESCRIPTION

Retokenizer is a function that accepts some code and a syntax definition by
which to break it up into the terms you want to work with by.  Retokenizer 
is essentially a Lexical Analyzier but comes close to also being a Grammar
Parser... In fact, it could be quickly morphed into one by using sub-syntaxes
and looping them back on each other for infinite recursive parsing.

How is retokenizer different from other tokenizers?  Two aspects:
	(1) Retokenizer splits up your tokens but leaves the characters that 
        split them, so you can tell.  For example, if split by commas or
        semi-colons, you still have them so you can tell by which your
        code was split up by... hence act accordingly.
	(2) Retokenizer supports recursive sub-syntaxes.  So if parts of your
        Syntax is context dependent, you can account for that.  This 
        recursion could even loop back, if you need it to (such as for
        processing conditional logic in parenthesis).  

PRE-REQUISITE

Any version of Node.js should work fine.  Although the example uses the 
ES6 "let" directive requiring a more modern version.


USE

The included "example.js" file (executable) demonstrates how to use the
retokenizer in your own code.

The following example of a syntax definition illustrates.  This should
tokenize at the first level (labeled "statement") broken up by only 
commas and semi-colons.  However, there may be sub-syntax enclosed 
withing square brackets (labeled "condition") that breaks up tokens by 
various math and comparison operators.  The closing square bracket may be
escaped by a backslash or double-backslash for non-escape.  Under this 
still, a sub-sub syntax is defined with double-quotes that has no further 
sub-syntaxes under it.  And the backslash is similarly specified to
escaping a double-quote.

syntax = {
	label:'statement',        
	splitters:[',',';'], 
	enclosures:[{
		opener:'[',	escape:'\\', closer:']',
		syntax:{
			label:'condition',
			splitters:[' ','>=','>','<=','<=','<','=','+','-','*','/','%'],
			enclosures:[{ opener:'"', 'escape':'\\', closer:'"' }]
		}
	}]
};

