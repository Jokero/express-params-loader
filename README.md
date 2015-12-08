# express-params-loader

Object loader for express [param()](http://expressjs.com/en/4x/api.html#app.param) function

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
  - `[fieldName=_id]` {String} - Only for model
  - `[objectName]` {String} - Default value: lowercased model name for model and "object" for load function
  - `[passErrorToNext=true]` {Boolean}
  - `[errorFactory]` {Function}
  - `[errorMessage]` {String | Function}

### Examples

#### Mongoose model

```js
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
var loadObject = require('express-params-loader');

var app = express();

app.param('id', loadObject(function(req, id) {
    // load function must return promise
    return Promise.resolve({ id: 1, title: 'The Lord of the Rings' });
}));

app.get('/books/:id', function(req, res, next) {
  // req.object is loaded book
});
```

By default object is loaded to `req.object`. But you can change it using `objectName` option:

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

### Model.paginate([query], [options], [callback])

Returns promise

**Parameters**

* `[query]` {Object} - Query criteria. [Documentation](https://docs.mongodb.org/manual/tutorial/query-documents)
* `[options]` {Object}
  - `[select]` {Object | String} - Fields to return (by default returns all fields). [Documentation](http://mongoosejs.com/docs/api.html#query_Query-select) 
  - `[sort]` {Object | String} - Sort order. [Documentation](http://mongoosejs.com/docs/api.html#query_Query-sort) 
  - `[populate]` {Array | Object | String} - Paths which should be populated with other documents. [Documentation](http://mongoosejs.com/docs/api.html#query_Query-populate)
  - `[lean=false]` {Boolean} - Should return plain javascript objects instead of Mongoose documents?  [Documentation](http://mongoosejs.com/docs/api.html#query_Query-lean)
  - `[leanWithId=true]` {Boolean} - If `lean` and `leanWithId` are `true`, adds `id` field with string representation of `_id` to every document
  - `[offset=0]` {Number} - Use `offset` or `page` to set skip position
  - `[page=1]` {Number}
  - `[limit=10]` {Number}
* `[callback(err, result)]` - If specified the callback is called once pagination results are retrieved or when an error has occurred

**Return value**

Promise fulfilled with object having properties:
* `docs` {Array} - Array of documents
* `total` {Number} - Total number of documents in collection that match a query
* `limit` {Number} - Limit that was used
* `[page]` {Number} - Only if specified or default `page`/`offset` values were used 
* `[pages]` {Number} - Only if `page` specified or default `page`/`offset` values were used 
* `[offset]` {Number} - Only if specified or default `page`/`offset` values were used

### Examples

#### Skip 20 documents and return 10 documents

```js
Model.paginate({}, { page: 3, limit: 10 }, function(err, result) {
    // result.docs
    // result.total
    // result.limit - 10
    // result.page - 3
    // result.pages
});
```

Or you can do the same with `offset` and `limit`:
```js
Model.paginate({}, { offset: 20, limit: 10 }, function(err, result) {
    // result.docs
    // result.total
    // result.limit - 10
    // result.offset - 20
});
```

With promise:
```js
Model.paginate({}, { offset: 20, limit: 10 }).then(function(result) {
    // ...
});
```

#### More advanced example

```js
var query   = {};
var options = {
    select:   'title date author',
    sort:     { date: -1 },
    populate: 'author',
    lean:     true,
    offset:   20, 
    limit:    10
};

Book.paginate(query, options).then(function(result) {
    // ...
});
```

#### Zero limit

You can use `limit=0` to get only metadata:

```js
Model.paginate({}, { offset: 100, limit: 0 }).then(function(result) {
    // result.docs - empty array
    // result.total
    // result.limit - 0
    // result.offset - 100
});
```

#### Set custom default options for all queries

config.js:
```js
var mongoosePaginate = require('mongoose-paginate');

mongoosePaginate.paginate.options = { 
    lean:  true,
    limit: 20
};
```

controller.js:
```js
Model.paginate().then(function(result) {
    // result.docs - array of plain javascript objects
    // result.limit - 20
});
```

## Tests

```sh
npm install
npm test
```

## License

[MIT](LICENSE)
