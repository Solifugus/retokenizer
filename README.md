# retokenizer

Retokenzier Version 1.0
Copyright (C) 2018, 2019 By Matthew C. Tedder
Licensed under the MIT license (See LICENSE file)

## DESCRIPTION

Retokenizer is an ES6 class that accepts some code and a syntax definition by
which to break it up into the terms you want to work with by.  Retokenizer 
is essentially a Lexical Analyzier but comes close to also being a Grammar
Parser... In fact, it could be quickly morphed into one by using sub-syntaxes
and looping them back on each other for infinite recursive parsing.

## How Retokenizer Differs from Other Tokenizers
* Retains the characters that split up tokens
* Facilitates recursive sub-syntaxes
* May also retain unrecognized portions
* May provide line an character position numbers

Retokenizer is an ES6 class for churning text into an array of tokens, as per
your specifications.  Most typically, this may be used for developing a 
programming language.  

Most other tokenizers merely split up text into tokens, discarding characters
used to split it and with no support for recursive or recursively different
syntaxes.  Granted, recursiveness is usually the job of the other major part
of any programming language -- the grammar parser.  However by doing this, 
Retokenizer eases the hand-coding of a parser and also facilitates writing 
context-sensitive parsers.  For example, context-insensitive languages 
typically use "=" for assignment operations and "==" for evaluations.  A 
context-sensitive lanauge would know that "=" in an open statement is an
assignment but in an if( .. ) condition, "=" is an evaluation.  Furthermore,
you may embed different sub-languages within each other.

Note:
  Retokenizer was developed for Node.js and is available as an npm.  Node.js
  is a not only fast to develop in but also jit-compiles to exceptionally 
  fast machine code.  To produce a programming language stand-alone 
  executable, you might use the "nexe" npm.  It produces cross-platform.

## PRE-REQUISITE

Retokenizer is written in and primarilly for Node.js, however, it has no
outside dependencies and would can be easily adapted to work in any browser
that supports ES6 (any modern Browser -- e.g., Edge or Chrome but not IE).

## USE

The included "example.js" file demonstrates how to use the
retokenizer in your own code.

## Developing a Syntax

The following illustrates:
```
syntax = {
    splitters:[' ','\n','if','then','else'],  // tokens will be split up by these (in this order of precidence)
    removes:[' ','\t'],                       // any of these will be excluded in the output of tokens
    enclosures:[
		{ opener:'"', closer:'"', escaper:'\\' },  // "quoted text" with backspace for escaping
		{ opener:'/*', closer:'*/' },              // /* multi-line capable */ comments
		{ opener:'//', closer:'\n' },              // single-line (to end of line) comments 
    ]
};
syntax.enclosures.push({ opener:'{', closer:'}', syntax:syntax });  // code block (recursive syntax definition)
let evalPerens = {
    splitters:[ ' ', '\n', '!=', '=','<>', '>', '<', 'and', 'or', 'not' ], 
	removes:[ ' ','\t','\n' ],
	enclosures:[];
}
evalPerens.enclosures.push({ opener:'(', closer:')', syntax:evalPerens });  // Make perenthesis recursive
syntax.enclosures.push( evalPerens );                                       // add perenthesis to main syntax
```
## Options

Retokenizer may be instantiation such as (for example):
```
let tokenizer = Retokenizer( syntax, { rich:true, betweens:'keep', condense:true, caseful:false } )
```

And the options you see there are described below.

### rich
 * = false (default), return tokens as simple strings
 * = true, return tokens as richly detailed objects
###    betweens
 * = 'keep', return tokens of strings found between splitters.
 * = 'remove', do not return tokens of strings found between splitter.
 * = 'throw', throw an error for any strings found between splitters.
###   condense
 * = false (default), return three tokens for each enclosure (opener, enclosed, and closer)
 * = true, return one token for each enclosure (adding opener and closer attributes to enclosed token, if rich)
###   caseful
 * = false (default), splitters are caseless
 * = false, splitters are caseful





