
// reTokenizer 1.0
// Copyright Matthew C. Tedder
// LICENSED UNDER The GNU GPL Version 2 (See included LICENSE file)

function retokenizer( code, syntax ) {
	var tokens = [];
	var token  = '';
	for( var i = 0; i < code.length; i += 1 ) {
		var skipToNextChar;

		// Closure openned?
		skipToNextChar = false;
		for( var ii = 0; ii < syntax.enclosures.length; ii += 1 ) {
			var enclosure = syntax.enclosures[ii];
			if( code.substr(i,enclosure.opener.length) === enclosure.opener ) {
				if( token !== '' ) {
					tokens.push( token );
					token = '';
				}
				tokens.push( enclosure.opener );
				
				// If no closer, Get All to End as a single token
				if( enclosure.closer === undefined || enclosure.closer === '' ) {
					tokens.push( code.substr(i+1) );
					i = code.length;
					break;
				}

				// Get whole closure until closer as a single token..
				while( true ) {
					i += 1;

					// End of code without finding enclosed closer?  Then break out..
					if( i >= code.length ) {
						if( token !== '' ) tokens.push( token );
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
								token = retokenizer(token,enclosure.syntax);
							}
							// Store enclosure and move on..
							tokens.push(token);
							token = '';
						}
						tokens.push( enclosure.closer );
						i += enclosure.closer.length;
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
			if( code.substr(i,splitter.length) === splitter ) {
				if( token !== '' ) {
					tokens.push( token );
					token = '';
				}
				tokens.push( splitter );
				i += splitter.length-1;
				skipToNextChar = true;
				break;
			}
		}
		if( skipToNextChar ) continue;

		if( i < code.length ) token += code[i];
	}  // end of code (i) loop

	if( token !== '' ) tokens.push( token );

	return tokens;
}  // end of retokenizer

module.exports = retokenizer;
