process.env.NODE_ENV = 'test'; // to disable express error logging

var loadObject = require('../index');
var request    = require('supertest-as-promised');
var express    = require('express');
var mongoose   = require('mongoose');
var expect     = require('chai').expect;

const MONGO_URI = 'mongodb://127.0.0.1/express_params_loader_test';


var BookSchema = new mongoose.Schema({
    _id:   Number,
    title: String
});

var Book = mongoose.model('Book', BookSchema);

const TEST_BOOK = {
    _id:   1,
    title: 'The Lord of the Rings'
};


describe('express-params-loader', function() {
    describe('loads object using Mongoose model', function() {
        before(function(done) {
            mongoose.connect(MONGO_URI, done);
        });

        before(function(done) {
            mongoose.connection.db.dropDatabase(done);
        });

        before(function() {
            return Book.create(TEST_BOOK);
        });

        afterEach(function() {
            delete loadObject.options;
        });

        var createApp = function() {
            var app = express();

            app.param('id', loadObject(Book));
            app.param('title', loadObject(Book, { fieldName: 'title' }));
            app.param('bestsellerId', loadObject(Book, { objectName: 'bestseller' }));
            app.param('popularBookId', loadObject(Book));

            app.get('/books/:id', function(req, res) {
                res.send(req.book);
            });

            app.get('/books/by-title/:title', function(req, res) {
                res.send(req.book);
            });

            app.get('/books/bestsellers/:bestsellerId', function(req, res) {
                res.send(req.bestseller);
            });

            app.get('/books/popular/:popularBookId', function(req, res) {
                res.send(req.loadedObject);
            });

            return app;
        };

        it('with default fieldName ("_id") and objectName (lowercased model name)', function() {
            return request(createApp())
                .get('/books/1')
                .expect(200)
                .then(function(res) {
                    expect(res.body._id).to.equal(TEST_BOOK._id);
                    expect(res.body.title).to.equal(TEST_BOOK.title);
                });
        });

        it('with custom fieldName', function() {
            return request(createApp())
                .get('/books/by-title/The Lord of the Rings')
                .expect(200)
                .then(function(res) {
                    expect(res.body._id).to.equal(TEST_BOOK._id);
                    expect(res.body.title).to.equal(TEST_BOOK.title);
                });
        });

        it('with custom objectName', function() {
            return request(createApp())
                .get('/books/bestsellers/1')
                .expect(200)
                .then(function(res) {
                    expect(res.body._id).to.equal(TEST_BOOK._id);
                    expect(res.body.title).to.equal(TEST_BOOK.title);
                });
        });

        it('with custom default options', function() {
            loadObject.options = { objectName: 'loadedObject' };

            return request(createApp())
                .get('/books/popular/1')
                .expect(200)
                .then(function(res) {
                    expect(res.body._id).to.equal(TEST_BOOK._id);
                    expect(res.body.title).to.equal(TEST_BOOK.title);
                });
        });
    });

    describe('loads object using loadFunction', function() {
        var createApp = function() {
            var app = express();

            var loadFunction = function(req, id) {
                return Promise.resolve(TEST_BOOK);
            };

            app.param('id', loadObject(loadFunction));
            app.param('bestsellerId', loadObject(loadFunction, { objectName: 'bestseller' }));

            app.get('/books/:id', function(req, res) {
                res.send(req.object);
            });

            app.get('/books/bestsellers/:bestsellerId', function(req, res) {
                res.send(req.bestseller);
            });

            return app;
        };

        it('with default objectName ("object")', function() {
            return request(createApp())
                .get('/books/1')
                .expect(200)
                .then(function(res) {
                    expect(res.body._id).to.equal(TEST_BOOK._id);
                    expect(res.body.title).to.equal(TEST_BOOK.title);
                });
        });

        it('with custom objectName', function() {
            return request(createApp())
                .get('/books/bestsellers/1')
                .expect(200)
                .then(function(res) {
                    expect(res.body._id).to.equal(TEST_BOOK._id);
                    expect(res.body.title).to.equal(TEST_BOOK.title);
                });
        });
    });

    describe('if object not found', function() {
        var createApp = function() {
            var app = express();

            app.param('id', loadObject(Book));
            app.param('bestsellerId', loadObject(Book, { passErrorToNext: false }));

            app.get('/books/:id', function(req, res) {
                res.send(req.book);
            });

            app.get('/books/bestsellers/:bestsellerId', function(req, res) {
                res.send(req.bestseller);
            });

            return app;
        };

        it('passes error to next() by default (passErrorToNext=true)', function() {
            return request(createApp())
                .get('/books/2')
                .expect(404);
        });

        it('does not pass error to next() if passErrorToNext is falsy', function() {
            return request(createApp())
                .get('/books/bestsellers/2')
                .expect(200)
                .then(function(res) {
                    expect(res.body).to.be.deep.equal({});
                });
        });
    });

    after(function(done) {
        mongoose.connection.db.dropDatabase(done);
    });

    after(function(done) {
        mongoose.disconnect(done);
    });
});