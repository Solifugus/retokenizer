
// reTokenizer 1.0
// Copyright Matthew C. Tedder
// LICENSED UNDER The GNU GPL Version 2 (See included LICENSE file)

var lineNo;
function retokenizer( code, syntax, rich = false ) {
	var tokens = [];
	var token  = '';
	lineNo     = 1;

	// Push token but only if not among "removes"
	if( syntax.removes === undefined ) syntax.removes = [];
	this.pushToken = function pushToken( token, tokens, syntax, rich ) {
		// Count lines passing through
		for( var c = 0; c < token.value.length; c += 1 ) {
			if( token.value[c] === '\n' ) lineNo += 1;
		}
		token.lineNo = lineNo;

		// If token value is in removes, do not push 
		if( syntax.removes !== undefined && syntax.removes.indexOf(token.value) !== -1 ) return; 

		// Push the token..
		if( rich ) { tokens.push( token ); } else { tokens.push(token.value); }
	}

	for( var i = 0; i < code.length; i += 1 ) {
		var skipToNextChar;
		
		// Closure openned?
		skipToNextChar = false;
		for( var ii = 0; ii < syntax.enclosures.length; ii += 1 ) {
			var enclosure = syntax.enclosures[ii];
			if( code.substr(i,enclosure.opener.length) === enclosure.opener ) {
				if( token !== '' ) {
					this.pushToken(  {type:'string', value:token}, tokens, syntax, rich );
					token = '';
				}
				this.pushToken( {type:'opener', value:enclosure.opener}, tokens, syntax, rich );
				
				// If no closer, Get All to End as a single token
				if( enclosure.closer === undefined || enclosure.closer === '' ) {
					this.pushToken( {type:'unclosable', value:code.substr(i+1)}, tokens, syntax, rich );
					i = code.length;
					break;
				}

				// Get whole closure until closer as a single token..
				while( true ) {
					i += 1;

					// End of code without finding enclosed closer?  Then break out..
					if( i >= code.length ) {
						if( token !== '' ) this.pushToken( {type:'unclosed',value:token}, tokens, syntax, rich );
						token = '';
						break; 
					}

					// Found escaper?  Then translate..
					if( code.substr(i,enclosure.escaper.length) === enclosure.escaper ) {
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
								token = retokenizer( token,enclosure.syntax, rich );
							}
							// Store enclosure and move on.. TODO: if labelled, change type to label
							this.pushToken( {type:'enclosed', value:token}, tokens, syntax, rich );
							token = '';
						}
						this.pushToken( {type:'closer', value:enclosure.closer}, tokens, syntax, rich );
						i += enclosure.closer.length;  // BUG
						break;
					}
					token += code[i];
				}					
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
						this.pushToken( {type:'string', value:token}, tokens, syntax, rich );
						token = '';
					}
					let tokenType = splitter.type === undefined ? 'regex' : splitter.type;
					this.pushToken( {type:tokenType, value:found[0]}, tokens, syntax, rich );
					token = '';
					i += found[0].length-1;
					skipToNextChar = true;
					break;
				}
			}
			// If splitter is litteral string
			else if( code.substr(i,splitter.length) === splitter ) {
				if( token !== '' ) {
					this.pushToken( {type:'string', value:token}, tokens, syntax, rich );
					token = '';
				}
				this.pushToken( {type:'splitter', value:splitter}, tokens, syntax, rich );
				i += splitter.length-1;
				skipToNextChar = true;
				break;
			}
		}
		if( skipToNextChar ) continue;

		if( i < code.length ) token += code[i];
	}  // end of code (i) loop

	if( token !== '' ) this.pushToken( {type:'string', value:token}, tokens, syntax, rich );

	return tokens;

}  // end of retokenizer


module.exports = retokenizer;
