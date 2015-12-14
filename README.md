# express-params-loader

Loader for express [app.param()](http://expressjs.com/en/4x/api.html#app.param) and [router.param()](http://expressjs.com/en/4x/api.html#router.param) methods.
Extends [req](http://expressjs.com/en/4x/api.html#req) with object loaded from MongoDB or other source

[![NPM version](https://img.shields.io/npm/v/express-params-loader.svg)](https://npmjs.org/package/express-params-loader)
[![Build status](https://img.shields.io/travis/Jokero/express-params-loader.svg)](https://travis-ci.org/Jokero/express-params-loader)

**Note:** This plugin will only work with Node.js >= 4.0 and Mongoose >= 4.0.

## Installation

```sh
npm install express-params-loader
```

## Usage

To load object you can use custom load function or [Mongoose model](http://mongoosejs.com/docs/models.html):

### loadObject(modelOrLoadFunction, [options])

**Parameters**

* `modelOrLoadFunction` {Model | Function} - Mongoose model or custom load function that returns a promise
* `[options]` {Object}
  - `[fieldName=_id]` {String} - Field that is used to search for a document (only for model)
  - `[objectName]` {String} - `req` property for object loading. Default value: `lowercased model name` for model and `"object"` for load function
  - `[passErrorToNext=true]` {Boolean} - Should `next()` function be called with error if object not found?
  - `[errorFactory]` {Function} - Factory for error creation if object not found
  - `[errorMessage]` {String | Function} - Error message

### Examples

#### Mongoose model

```js
var express    = require('express');
var loadObject = require('express-params-loader');

var app = express();

app.param('id', loadObject(Book)); // Book is Mongoose model

app.get('/books/:id', function(req, res, next) {
  // req.book is loaded book
});
```

By default object is loaded to `req[<lowercased model name>]`. You can change it using `objectName` option:

```js
app.param('id', loadObject(Book, { objectName: 'loadedBook' }));

app.get('/books/:id', function(req, res, next) {
  // req.loadedBook
});
```

Loader finds a single document by its `_id` field. You can use another field with `fieldName` option:

```js
app.param('title', loadObject(Book, { fieldName: 'title' }));

app.get('/books/by-title/:title', function(req, res) {
    // req.book
});
```

#### Load function

```js
app.param('id', loadObject(function(req, id) {
    // load function must return promise
    return Promise.resolve({ id: 1, title: 'The Lord of the Rings' });
}));

app.get('/books/:id', function(req, res, next) {
  // req.object is loaded book
});
```

By default object is loaded to `req.object`. But you can change it using `objectName` too:

```js
app.param('id', loadObject(
    function(req, id) {
        return Promise.resolve({ id: 1, title: 'The Lord of the Rings' });
    },
    { objectName: 'book' }
));

app.get('/books/:id', function(req, res, next) {
  // req.book is loaded book
});
```

#### Custom default options

config.js:
```js
loadObject.options = { 
    objectName: 'loadedObject'
};
```

app.js:
```js
app.param('id', loadObject(Book));

app.get('/books/:id', function(req, res, next) {
  // req.loadedObject
});
```

## Tests

```sh
npm install
npm test
```

## License

[MIT](LICENSE)
