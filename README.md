# UglifyPHP

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/6cc77c22407e464ebda5e318eb1ae42e)](https://app.codacy.com/app/flavior121/uglify-php?utm_source=github.com&utm_medium=referral&utm_content=flavior121/uglify-php&utm_campaign=Badge_Grade_Dashboard)

UglifyPHP is a JavaScript minifier and simple obfuscator for PHP files.

## How It Works
This package use a unique ID based on the current time to replace variables. You can use two minified files together and don't have to worry with variable overwriting.

This package can minify `Classes` and replace correctly variables and functions references with `$this`. It will not change any function name or create "junk code" for performance reasons.

**This should not be used as a licensing or code protection solution.**

## Installation
```sh
  npm install uglify-php
```

## Usage

```js
const UglifyPHP = require('uglify-php');

let options = {
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
  "output": "C:/web/file_min.php" // If it's empty the promise will return the minified source code
}

// You can use a path or the source code
UglifyPHP.minify("C:/web/file.php", options).then(function (source) {
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