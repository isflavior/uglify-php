# UglifyPHP
UglifyPHP is a JavaScript minifier and obfuscator for PHP files.

## How It Works
This package use a unique ID based on the current time to replace variables. You can include two minified files and don't have to worry with variable overwriting.

This package can minify `Classes` replace correctly variables and functions references with `$this`.

**This should not be used as a licensing solution.**

## Installation
    $ npm install uglify-php

## Usage

```js
const UglifyPHP = require('uglify-php');

UglifyPHP.minify("C:/web/file.php", { // optional options object
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
	"output": "C:/web/file_min.php" // If it's empty the promise will return the minified source code
}).then(function (source) {
    console.log(source);
});
```

## Example

Original Source Code:
```php
<?php
   class BaseClass {
      private $name = "Uglify-PHP";

      function __construct() {
         $this->sayHello();
      }

      // Comment Block
      public function sayHello(){
         echo "Hello " . $this->name;
      }
   }

   $obj = new BaseClass();
?>
```

Minified Source Code:
```php
<?php class BaseClass{private $j5lg3rhh="Uglify-PHP";function __construct(){$this->sayHello();}public function sayHello(){echo "Hello ".$this->j5lg3rhh;}}$j5lg3rhj=new BaseClass();?>
```