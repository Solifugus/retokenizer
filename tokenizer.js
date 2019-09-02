
// Tokenizer 
// Copyright Matthew C. Tedder
// LICENSED UNDER The GNU GPL Version 2 (See included LICENSE file)

/* Options:
 *    rich
 *        = false (default), return tokens as simple strings
 *        = true, return tokens as richly detailed objects
 *    betweens
 *        = 'keep', return tokens of strings found between splitters.
 *        = 'remove', do not return tokens of strings found between splitter.
 *        = 'throw', throw an error for any strings found between splitters.
 *    condense
 *        = false (default), return three tokens for each enclosure (opener, enclosed, and closer)
 *        = true, return one token for each enclosure (adding opener and closer attributes to enclosed token, if rich)
 *    caseful
 *        = false (default), splitters are caseless
 *        = false, splitters are caseful
 */

class Tokenizer {
	constructor( syntax, options = {} ) {
		this.syntax = syntax;
		this.option = {
			rich:     false,   // tokens are: false = raw strings; true = consolidated 
			betweens: 'keep',  // keep, remove, or 'throw'
			condense: false,   // false = all tokens in flat array; true = tokens recursed as per enclosure level
			caseful:  false,   // casefully match splitters, e.g. IF .. THEN, If .. Then, or if .. then
		}
		for( option in options ) { this.option[option] = options[option]; }
	}

	tokenize( code, syntax ) {
		if( typeof code !== 'string') { console.error('Tokenizer ERROR: code not given as a string but rather: ' + JSON.stringify(code)); return; }
		if( typeof syntax !== 'object') { console.error('Tokenizer ERROR: syntax not given as an object but rather: ' + JSON.stringify(code)); return; }
		if( syntax.splitters === undefined ) { syntax.splitters = []; } else { syntax.splitters.sort(function(a,b){ return b.length - a.length; }); }
	
		// Push token but only if not among "removes"
		if( syntax.removes === undefined ) syntax.removes = [];

		let enclosedIn = { syntax:syntax };  // initially in enclosure that's opener/closer are assumed start and end of program file 
		let recursions = [ enclosedIn ];     // path for backing out of recursions into enclosures
		let depth      = 0;                  // depth of recursion
		var tokens     = [[]];               // collection of tokens, at each depth (initial is zero) 
		var token      = '';                 // for collecting next prospective token in
		let enclosedTokens;

		// Loop through the code seeking tokens..
		this.code = code;
		for( let i = 0; i < code.length; i += 1 ) {

			// Found Enclosure Opener?
			if( syntax.enclosures === undefined ) syntax.enclosures = [];
			for( let ii = 0; ii < syntax.enclosures.length; ii += 1 ) {
				let enclosure = syntax.enclosures[ii];
				if( code.substr(i,enclosure.opener.length).toLowerCase() === enclosure.opener.toLowerCase() ) {
					if( token !== '' ) {
						this.pushToken(  { type:'string', value:token }, tokens[depth], i - token.length );
						token = '';
					}

					// Ensure position in code moved to after full length of the opener
					i += enclosure.opener.length;

					// Does just-opened enclosure not have a sub-syntax?
					if( enclosure.syntax === undefined ) {
						// No Sub-syntax found, so just grab everything up to closer 
						let collecting = true;
						i -= 1;
						while( collecting ) {
							i += 1;

							// Going past end of code then stop -- closer is missing. 
							if( i === code.length ) {
								this.warning('A opening "' + enclosuer.opener + '" was never closed with a "' + enclosure.closer + '".');
								break;
							}
							
							// Skip anything escaped
							if( code[i] === enclosure.escaper ) {
								i += 1; // escape
								continue;
							}

							// If closer found, collecting is finished
							if( code.substr(i,enclosure.closer.length).toLowerCase() === enclosure.closer.toLowerCase() ) {
								i += enclosure.closer.length;
								this.pushToken(  { type:'enclosure', enclosure:enclosure, value:token }, tokens[depth] );
								token = '';
								break;
							}
							
							token += code[i];
						}
					}
					else {
						// Sub-syntax found, so recurse into sub-syntax  -- and continue normal parsing (under proper closer found)
						depth += 1;                          // increase depth of tokens while in enclosure
						tokens.push([]);                     // add place to collect tokens of new depth
						recursions.push( enclosedIn );       // push the old enclosedIn (holds opener, closer, escaper, and syntax) 
						enclosedIn = enclosure;  // enter the new enclosure
						syntax = enclosedIn.syntax;          // convenience reference to the new enclosure's syntax 
						if( syntax.enclosures === undefined ) syntax.enclosures = [];
					}
				}
			} // end of syntax.enclosures loop..

			// Found closer of current enclosure?  Then back out of recursion.. 
			if( enclosedIn.closer !== undefined && code.substr(i,enclosedIn.closer.length).toLowerCase() === enclosedIn.closer.toLowerCase() ) {
				if( token !== '' ) {
					this.pushToken(  { type:'string', value:token }, tokens[depth] );
					token = '';
				}

				// Ensure position in code moved to after full length of the closer 
				i += enclosedIn.opener.length;

				// Move current depth of tokens collected into next level up..
				enclosedTokens = tokens.pop();
				depth -= 1;

				// Put enclosedTokens into tokens[depth] -- either flat (if not condensed) else recursed (if condensed)
				if( option.condense ) {
					// Move tokens as single object -- TODO: not sure if this will include opener/closer
					this.pushToken( { type:'enclosure', enclosure:enclosedIn, value:enclosedTokens }, tokens[depth] );
				}
				else {
					// Move tokens flatly -- TODO:not sure if this will include opener/closer
					this.pushToken( { type:'string', value:enclosedIn.opener }, tokens[depth] );
					for( let t = 0; t < enclosedTokens.length; t +=1 ) this.pushToken( { type:'string', value:enclosedTokens[t] }, tokens[depth] );
					this.pushToken( { type:'string', value:enclosedIn.closer }, tokens[depth] );
				}

				enclosedIn = recursions.pop();   // return to the old enclosedIn
				syntax     = enclosedIn.syntax;  // convenience reference to the old enclosure's syntax

			}


			// Hit a splitter?
			let skipToNextChar = false;
			for( var ii = 0; ii < syntax.splitters.length; ii += 1 ) {
				var splitter = syntax.splitters[ii];
				// If splitter is Regular Expresson string
				if( typeof splitter === 'object' && splitter.regex !== undefined ) {
					let str = '^' + splitter.regex;	
					let rgx = RegExp(str);	
					let found = rgx.exec( code.substr(i) );
					if( found !== null ) {
						if( token !== '' ) {
							this.pushToken( { type:'string', value:token }, tokens[depth] );
							token = '';
						}
						let tokenType = splitter.type === undefined ? 'regex' : splitter.type;
						this.pushToken( { type:tokenType, value:found[0] }, tokens[depth] );
						token = '';
						i += found[0].length-1;
						skipToNextChar = true;
						break;
					}
				}
				// If splitter is litteral string
				else if( (this.option.caseful && code.substr(i,splitter.length) === splitter) || (!this.option.caseful && code.substr(i,splitter.length).toLowerCase() === splitter.toLowerCase()) ) {
					if( token !== '' ) {
						this.pushToken( {type:'between', value:token}, tokens[depth] );
						token = '';
					}
					this.pushToken( {type:'splitter', value:splitter}, tokens[depth] );
					i += splitter.length-1;
					skipToNextChar = true;
					break;
				}
			}
			if( skipToNextChar ) continue;
	
			if( i < code.length ) token += code[i];
		}  // end of code (i) loop

		if( token !== '' ) this.pushToken( {type:'between', value:token}, tokens[depth] );

		// Return Final List of Tokens
		return tokens[0];  // final list of tokens should have all depths consolidated into zero 

	} // end of tokenize

	pushToken( token, tokens, c ) {
		// Count lines passing through
		token.lineNo = (this.code.slice(0,c).match(/\n/g) || []).length;

		// If token value is in removes, do not push 
		if( syntax.removes !== undefined && syntax.removes.indexOf(token.value) !== -1 ) return; 

		// Keep (default), remove, or throw error on betweens found?
		if( token.type === 'between' && this.option.betweens.toLowerCase() === 'throw' ) throw 'Unrecognized Syntax "' + token.value + '" at lineNo ' + lineNo + '.';
		if( token.type === 'between' && this.option.betweens.toLowerCase() === 'remove' ) return;

		// Else push the token..  Goal!  Score!
		if( this.option.rich ) { tokens.push( token ); } 
		else {
			// Not Rich
			if( token.type === 'enclosure' ) {
				tokens.push( token.enclosure.opener );
				tokens.push( token.value );
				tokens.push( token.enclosure.closer );
			}
			else { tokens.push(token.value); }
		}
	}

	warning( message ) {
		console.log( 'WARNING: ' + message );
	}

} // End of class

let tokenizer = new Tokenizer();

let syntax = {
	name:'main',
	splitters:['.',',','=','<>','>=','>','<=','<','and','or','not'],
	removes:[' ','\t'],
	enclosures:[
		{ opener:'"', closer:'"', escaper:'\\' },
		{ opener:'(', closer:')' },
		//{ opener:'[', closer:']', syntax:{
		//		name:'brackets',
		//		splitters:['.',',','=','<>','>=','>','<=','<','and','or','not'],
		//		removes:[' ','\t'],
		//	}
		//}
	]
};
syntax.enclosures.push({ opener:'[', closer:']', syntax:syntax });
let option = { condense:true };

//code = 'company.user.account(356)balance';
code = 'company.user[ one.two[ alpha.bravo.charlie ].three ].balance';

let tokens = tokenizer.tokenize( code, syntax, option );
console.log( JSON.stringify( tokens, null, '  ' ) );

