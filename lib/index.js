/*!
 * Copyright (C) Flávio Reis (MIT License)
 * @package php-parser
 * @version 1.0.3
 * @authors https://github.com/flavior121/uglify-php/graphs/contributors
 */

const engine = require('php-parser');
const uniqid = require('uniqid');
const fs = require('fs');
const path = require('path');

var MAX_PATH_LENGTH = 4096;

const parser = new engine({
	parser: {extractDoc: true},
	lexer: {all_tokens: true}
});

function isFileSync(aPath) {
	try {
		if (aPath.length > MAX_PATH_LENGTH || aPath.indexOf("<?php") !== -1) {
			return false;
		} else {
			return fs.statSync(aPath).isFile();
		}
	} catch (e) {
		if (e.code === "ENAMETOOLONG") {
			MAX_PATH_LENGTH = aPath.length; // so that we do not make the same mistake again
			return false;
		} else if (
			e.code === 'ENOENT' ||
			e.endsWith("TOOLONG") // for ENAMETOOLONG, WSAENAMETOOLONG, and any other future too-long error
		) {			
			return false;
		} else {
			throw e;
		}
	}
}

/*var options = {
	"excludes": [
		'$GLOBALS',
		'$_SERVER',
		'$_GET',
		'$_POST',
		'$_FILES',
		'$_REQUEST',
		'$_SESSION',
		'$_ENV',
		'$_COOKIE',
		'$php_errormsg',
		'$HTTP_RAW_POST_DATA',
		'$http_response_header',
		'$argc',
		'$argv',
		'$this'
	],
	"minify": {
	   "replace_variables": true,
	   "remove_whitespace": true,
		"remove_comments": true
	},
	"output": ""
}*/
function minifyPHP(synchronous, file_value, user_options) {
	// Options
	var options_excludes = [];
	
	var options_minify_replace_variables = true;
	var options_minify_remove_whitespace = true;
	var options_minify_remove_comments = true;
	
	var options_output = "";
	
	if(user_options){
		if (user_options.excludes && "indexOf" in user_options.excludes) options_excludes = user_options.excludes;
		if (user_options.minify){
			if(user_options.minify.propertyIsEnumerable("replace_variables")) options_minify_replace_variables = !!user_options.minify.replace_variables;
			if(user_options.minify.propertyIsEnumerable("remove_whitespace")) options_minify_remove_whitespace = user_options.minify.remove_whitespace;
			if(user_options.minify.propertyIsEnumerable("remove_comments")) options_minify_remove_comments = user_options.minify.remove_comments;
		}
		if (user_options.output) options_output = user_options.output;
	}
	// Minify & Obsfuscate Function
	function parseData(source_code) {
		let functions = [];
		let variables = [];
		let new_source = '';
			
		// Return an array of tokens (same as php function token_get_all) 
		let tokens = parser.tokenGetAll(source_code);

		tokens.forEach((token, key) => {
			if(!Array.isArray(token)){
				new_source += token;
				return;
			}

			if (token[0] == 'T_VARIABLE' && options_excludes.indexOf(token[1]) < 0) {
				if(!variables[token[1]]) variables[token[1]] = uniqid.time();
			}

			if (token[0] == 'T_STRING' && typeof tokens[key-2] !== 'undefined' && Array.isArray(tokens[key-2]) && tokens[key-2][1] == "$this") {
				if(!variables["$" + token[1]]) variables["$" + token[1]] = uniqid.time();
			}

			if (token[0] == 'T_STRING' && typeof tokens[key-2] !== 'undefined' && Array.isArray(tokens[key-2]) && tokens[key-2][1] == "function") {
				if(!functions[token[1]]) functions[token[1]] = token[1];
			}

			if (options_minify_remove_comments && (token[0] == 'T_COMMENT' || token[0] == 'T_DOC_COMMENT')) {
				return;
			}

			new_source += token[1];
		});

		// Minify and Obsfuscate
		tokens = parser.tokenGetAll(new_source);

		new_source = '';
		tokens.forEach((token, key) => {
			if(Array.isArray(token))
			{
				if(token[0] == 'T_VARIABLE' && options_minify_replace_variables && options_excludes.indexOf(token[1]) < 0) {
					new_source += "$" + variables[token[1]];
				} 
				else if(token[0] == 'T_WHITESPACE' && options_minify_remove_whitespace) {
					if(typeof tokens[key-1] !== 'undefined' && typeof tokens[key+1] !== 'undefined' 
						&& Array.isArray(tokens[key-1]) && Array.isArray(tokens[key+1]) 
						&& tokens[key-1][1].match(/[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/) 
						&& tokens[key-1][1].match(/[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/)
					){
						new_source += " ";
					}
				} 
				else if(token[0] == 'T_STRING' && typeof tokens[key-2] !== 'undefined' && Array.isArray(tokens[key-2]) && tokens[key-2][1] == "$this" && options_minify_replace_variables && options_excludes.indexOf(token[1]) < 0) 
				{
					if(!functions[token[1]]){
						new_source += variables["$" + token[1]];
					} else {
						new_source += token[1];
					}
				}
				else if(token[0] == 'T_CASE') {
					new_source += token[1] + " ";
				} 
				else if(token[0] == 'T_OPEN_TAG') {
					new_source += "<?php ";
				}
				else if (token[0] == 'T_CLOSE_TAG') {
					new_source += " ?>";
				}
				else if (token[0] == 'T_INLINE_HTML'){
					new_source += token[1].replace(/[\n\r]+/g, '').replace(/\s{2,10}/g, ' ');
				}
				else {
					new_source += token[1];
				}
			} else {
				new_source += token;
			}
		}, this);

		//  Finished
		if(options_output){
			if (synchronous) {
				fs.writeFileSync(options_output, new_source);
				return new_source;
			} else {
				return new Promise(function(resolve, reject) {
					fs.writeFile(options_output, new_source, function(err) {
						if (err) reject('Error: Can’t Write to File');
						resolve();
					});
				});
			}
		} else {
			return new_source;
		}
	}

	// Check if its a file path
	if (isFileSync(file_value)) {
		// Reads the file
		return synchronous ? parseData(fs.readFileSync(file_value, 'utf8')) : new Promise(function(resolve, reject) {
			fs.readFile(file_value, 'utf8', (err, file_data) => {
				if (err) reject('Error: Can’t Read From the Source File or Disk');

				// Check if its a .php file
				if (path.extname(file_value) != ".php")
					reject('Error: This is Not a PHP File');

				parseData(file_data).then(resolve, reject);
			});
		});
	} else {
		return synchronous ? parseData(file_value) : Promise.resolve(parseData(file_value));
	}
}

module.exports.minify = function(file_value, user_options) {
	return minifyPHP(false, file_value, user_options);
};
module.exports.minifySync = function(file_value, user_options) {
	return minifyPHP(true, file_value, user_options);
};
