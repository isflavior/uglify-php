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

const parser = new engine({
	parser: {extractDoc: true},
	lexer: {all_tokens: true}
});

function isFileSync(aPath) {
	try {
		return fs.statSync(aPath).isFile();
	} catch (e) {
		if (e.code === 'ENOENT') {
			return false;
		} else {
			throw e;
		}
	}
}

var options = {
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
		"remove_comments": true,
		"minify_html": false
	},
	"output": ""
}

module.exports.minify = (file_value, user_options) => {
	// Options
	if(user_options){
		if(user_options.excludes) options.excludes = user_options.excludes;
		if (user_options.minify){
			if(typeof user_options.minify.replace_variables !== 'undefined') options.minify.replace_variables = user_options.minify.replace_variables;
			if(typeof user_options.minify.remove_whitespace !== 'undefined') options.minify.remove_whitespace = user_options.minify.remove_whitespace;
			if(typeof user_options.minify.remove_comments !== 'undefined') options.minify.remove_comments = user_options.minify.remove_comments;
			if(typeof user_options.minify.minify_html !== 'undefined') options.minify.minify_html = user_options.minify.minify_html;
		}
		if(user_options.output) options.output = user_options.output;
	}

	return new Promise((resolve, reject) => {
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

				if(token[0] == 'T_VARIABLE' && options.excludes.indexOf(token[1]) < 0)
					if(!variables[token[1]]) variables[token[1]] = uniqid.time();

				if(token[0] == 'T_STRING' && typeof tokens[key-2] !== 'undefined' && Array.isArray(tokens[key-2]) && tokens[key-2][1] == "$this")
					if(!variables["$" + token[1]]) variables["$" + token[1]] = uniqid.time();

				if(token[0] == 'T_STRING' && typeof tokens[key-2] !== 'undefined' && Array.isArray(tokens[key-2]) && tokens[key-2][1] == "function")
					if(!functions[token[1]]) functions[token[1]] = token[1];

				if(options.minify.remove_comments && (token[0] == 'T_COMMENT' || token[0] == 'T_DOC_COMMENT'))
					return;

				new_source += token[1];
			});

			// Minify and Obsfuscate
			tokens = parser.tokenGetAll(new_source);

			new_source = '';
			tokens.forEach((token, key) => {
				if(Array.isArray(token))
				{
					if(token[0] == 'T_VARIABLE' && options.minify.replace_variables && options.excludes.indexOf(token[1]) < 0) {
						new_source += "$" + variables[token[1]];
					} 
					else if(token[0] == 'T_WHITESPACE' && options.minify.remove_whitespace) {
						if(typeof tokens[key-1] !== 'undefined' && typeof tokens[key+1] !== 'undefined' 
							&& Array.isArray(tokens[key-1]) && Array.isArray(tokens[key+1]) 
							&& tokens[key-1][1].match(/[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/) 
							&& tokens[key-1][1].match(/[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/)
						){
							new_source += " ";
						}
					} 
					else if(token[0] == 'T_STRING' && typeof tokens[key-2] !== 'undefined' && Array.isArray(tokens[key-2]) && tokens[key-2][1] == "$this" && options.minify.replace_variables && options.excludes.indexOf(token[1]) < 0) 
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
			if(options.output){
				fs.writeFile(options.output, new_source, (err) => {
					if (err) reject('Error: Can’t Write to File');
					resolve();
				});
			} else {
				resolve(new_source);
			}
		}

		// Check if its a file path
		if (isFileSync(file_value)) {
			// Reads the file
			fs.readFile(file_value, 'utf8', (err, file_data) => {
				if (err) reject('Error: Can’t Read From the Source File or Disk');

				// Check if its a .php file
				if (path.extname(file_value) != ".php")
					reject('Error: This is Not a PHP File');

				parseData(file_data)
			});
		}
		else {
			parseData(file_value)
		}
	});
}