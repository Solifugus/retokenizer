
// reTokenizer 
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

// BUG -- When enclosure given a label, won't condense...

var lineNo;
function retokenizer( code, syntax, option = {} ) {
	if( typeof code !== 'string') { console.error('Retokenizer ERROR: code not given as a string.'); return; }
	if( typeof syntax !== 'object') { console.error('Retokenizer ERROR: syntax not given as an object.'); return; }
	if( syntax.splitters === undefined ) { syntax.splitters = []; } else { syntax.splitters.sort(function(a,b){ return b.length - a.length; }); }
	if( option.rich === undefined )     option.rich     = false;
	if( option.betweens === undefined ) option.betweens = 'keep';  // 'keep', 'remove', or 'throw'
	if( option.condense === undefined ) option.condense = false;
	if( option.caseful === undefined ) option.caseful   = false;   // caselessly match splitters
	var tokens = [];
	var token  = '';
	lineNo     = 1;

	// Push token but only if not among "removes"
	if( syntax.removes === undefined ) syntax.removes = [];
	this.pushToken = function pushToken( token, tokens, syntax, option ) {
		// Count lines passing through
		if( !Array.isArray(token.value) ) lineNo += (token.value.match(/\n/g) || []).length;
		if( token.opener !== undefined )  lineNo += (token.opener.match(/\n/g) || []).length;
		if( token.closer !== undefined )  lineNo += (token.closer.match(/\n/g) || []).length;
		token.lineNo = lineNo;

		// If token value is in removes, do not push 
		if( syntax.removes !== undefined && syntax.removes.indexOf(token.value) !== -1 ) return; 

		// Keep (default), remove, or throw error on betweens found?
		if( token.type === 'between' && option.betweens.toLowerCase() === 'throw' ) throw 'Unrecognized Syntax "' + token.value + '" at lineNo ' + lineNo + '.';
		if( token.type === 'between' && option.betweens.toLowerCase() === 'remove' ) return;

		// Else push the token..  Goal!  Score!
		if( option.rich ) { tokens.push( token ); } else { tokens.push(token.value); }
	}

	for( var i = 0; i < code.length; i += 1 ) {
		var skipToNextChar;

		// Closure openned?
		skipToNextChar = false;
		if( syntax.enclosures === undefined ) syntax.enclosures = [];
		for( var ii = 0; ii < syntax.enclosures.length; ii += 1 ) {
			var enclosure = syntax.enclosures[ii];
			var captured  = {};
			if( code.substr(i,enclosure.opener.length) === enclosure.opener ) {
				if( token !== '' ) {
					this.pushToken(  { type:'string', value:token }, tokens, syntax, option );
					token = '';
				}
				captured.label  = enclosure.label;
				captured.opener = { type:'opener', value:enclosure.opener }; 

				// Ensure position in code moved to after full length of the opener
				i += enclosure.opener.length - 1;
				
				// If no closer, Get All to End as a single token
				if( enclosure.closer === undefined || enclosure.closer === '' ) {
					let type = enclosure.label === undefined ? 'unclosable' : enclosure.label;
					captured.enclosed = { type:type, value:code.substr(i+1) }; 
					i = code.length;
					break;
				}

				// Get whole closure until closer as a single token..
				while( true ) {
					i += 1;

					// End of code without finding enclosed closer?  Then break out..
					if( i >= code.length ) {
						let type = enclosure.label === undefined ? 'unclosed' : enclosure.label;
						captured.enclosed = { type:type, value:token };
						token = '';
						break; 
					}

					// Found escaper?  Then translate..
					if( enclosure.escaper !== undefined && code.substr(i,enclosure.escaper.length) === enclosure.escaper ) {
						if( code.substr(i+enclosure.escaper.length,enclosure.escaper.length) === enclosure.escaper ) {
							// escape was escaped 
							token += enclosure.escaper;
							i += enclosure.escaper.length + enclosure.escaper.length - 1;
							continue;
						}
						else if( code.substr(i+enclosure.escaper.length,enclosure.closer.length) === enclosure.closer ) {
							// enclosure's closer was escaped
							token += enclosure.closer;
							i += enclosure.escaper.length + enclosure.closer.length - 1;
							continue;
						}
					}

					// Found closer of enclosure?
					if( code.substr(i,enclosure.closer.length) === enclosure.closer ) {
						if( token !== '' ) {
							// If syntax given for the enclosure then convert to tokens
							if( enclosure.syntax !== undefined ) {
								token = retokenizer( token,enclosure.syntax, option );
							}
							// Store enclosure and move on (changing type to label, if provided).. 
							let type = enclosure.label === undefined ? 'enclosed' : enclosure.label;
							captured.enclosed = { type:type, enclosed:true, value:token };
							token = '';
						}
						captured.closer = { type:'closer', value:enclosure.closer };
						i += enclosure.closer.length - 1; 
						ii = syntax.enclosures.length;  // don't check for more enclosure matches until next character in code
						break;
					}
					token += code[i];
				} // end of while( true )					
			} // end of enclosure capturing if..
			if( captured.opener !== undefined ) {
				if( option.condense ) {
					let condensed = { type:captured.enclosed.type, enclosed:true, opener:captured.opener.value, value:captured.enclosed.value };
					if( captured.closer !== undefined ) condensed.closer = captured.closer.value;
					this.pushToken( condensed, tokens, syntax, option );
				}
				else {
					this.pushToken( captured.opener, tokens, syntax, option );
					this.pushToken( captured.enclosed, tokens, syntax, option );
					if( captured.closer !== undefined ) this.pushToken( captured.closer, tokens, syntax, option );
				}
				skipToNextChar = true;
			}
		}
		if( skipToNextChar ) continue;

		// Hit a splitter?
		skipToNextChar = false;
		for( var ii = 0; ii < syntax.splitters.length; ii += 1 ) {
			var splitter = syntax.splitters[ii];
			// If splitter is Regular Expresson string
			if( typeof splitter === 'object' && splitter.regex !== undefined ) {
				let str = '^' + splitter.regex;	
				let rgx = RegExp(str);	
				let found = rgx.exec( code.substr(i) );
				if( found !== null ) {
					if( token !== '' ) {
						this.pushToken( {type:'string', value:token}, tokens, syntax, option );
						token = '';
					}
					let tokenType = splitter.type === undefined ? 'regex' : splitter.type;
					this.pushToken( {type:tokenType, value:found[0]}, tokens, syntax, option );
					token = '';
					i += found[0].length-1;
					skipToNextChar = true;
					break;
				}
			}
			// If splitter is litteral string
			else if( (option.caseful && code.substr(i,splitter.length) === splitter) || (!option.caseful && code.substr(i,splitter.length).toLowerCase() === splitter.toLowerCase()) ) {
				if( token !== '' ) {
					this.pushToken( {type:'between', value:token}, tokens, syntax, option );
					token = '';
				}
				this.pushToken( {type:'splitter', value:splitter}, tokens, syntax, option );
				i += splitter.length-1;
				skipToNextChar = true;
				break;
			}
		}
		if( skipToNextChar ) continue;

		if( i < code.length ) token += code[i];
	}  // end of code (i) loop

	if( token !== '' ) this.pushToken( {type:'between', value:token}, tokens, syntax, option );

	return tokens;

}  // end of retokenizer


module.exports = retokenizer;
