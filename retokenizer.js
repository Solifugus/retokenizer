
// reTokenizer 1.0
// Copyright Matthew C. Tedder
// LICENSED UNDER The GNU GPL Version 2 (See included LICENSE file)

function retokenizer( code, syntax, rich = false ) {
	var tokens = [];
	var token  = '';

	// Push token but only if not among "removes"
	if( syntax.removes === undefined ) syntax.removes = [];
	this.pushToken = function pushToken( token, tokens, syntax ) {
		if( typeof token === 'string' ) {
			// If in removes, do not push token
			if( syntax.removes !== undefined && syntax.removes.indexOf(token) !== -1 ) {
				return; 
			} 

			// If rich mode, ensure token is in object form
			if( rich && typeof token === 'string' ) token = { type:'litteral', value:token };

			// Add rich stuff to token before pushing..
			if( rich ) {
				let lineNo = 0;
				console.log( 'CODE: ' + code );
				token.lineNo = lineNo;
			}
		}

		// Now push the token..
		tokens.push( token );
	}

	for( var i = 0; i < code.length; i += 1 ) {
		var skipToNextChar;

		// Closure openned?
		skipToNextChar = false;
		for( var ii = 0; ii < syntax.enclosures.length; ii += 1 ) {
			var enclosure = syntax.enclosures[ii];
			if( code.substr(i,enclosure.opener.length) === enclosure.opener ) {
				if( token !== '' ) {
					this.pushToken( (rich ? { type:'string', value:token } : token), tokens, syntax );
					token = '';
				}
				this.pushToken( (rich ? { type:'opener', value:enclosure.opener } : enclosure.opener), tokens, syntax );
				
				// If no closer, Get All to End as a single token
				if( enclosure.closer === undefined || enclosure.closer === '' ) {
					this.pushToken( (rich ? { type:'unclosable', value:code.substr(i+1)} : code.substr(i+1)), tokens, syntax );
					i = code.length;
					break;
				}

				// Get whole closure until closer as a single token..
				while( true ) {
					i += 1;

					// End of code without finding enclosed closer?  Then break out..
					if( i >= code.length ) {
						if( token !== '' ) this.pushToken( (rich ? {type:'unclosed',value:token} : token), tokens, syntax );
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
							this.pushToken( (rich ? {type:'enclosed', value:token} : token), tokens, syntax );
							token = '';
						}
						this.pushToken( (rich ? {type:'closer', value:enclosure.closer} : enclosure.closer), tokens, syntax );
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
						this.pushToken( (rich ? {type:'string', value:token} : token), tokens, syntax );
						token = '';
					}
					let tokenType = splitter.type === undefined ? 'regex' : splitter.type;
					this.pushToken( (rich ? {type:tokenType, value:found[0]} : found[0]), tokens, syntax );
					token = '';
					i += found[0].length-1;
					skipToNextChar = true;
					break;
				}
			}
			// If splitter is litteral string
			else if( code.substr(i,splitter.length) === splitter ) {
				if( token !== '' ) {
					this.pushToken( (rich ? {type:'string', value:token} : token), tokens, syntax );
					token = '';
				}
				this.pushToken( (rich ? {type:'splitter', value:splitter} : splitter), tokens, syntax );
				i += splitter.length-1;
				skipToNextChar = true;
				break;
			}
		}
		if( skipToNextChar ) continue;

		if( i < code.length ) token += code[i];
	}  // end of code (i) loop

	if( token !== '' ) this.pushToken( (rich ? {type:'string', value:token} : token), tokens, syntax );

	return tokens;

}  // end of retokenizer


module.exports = retokenizer;
