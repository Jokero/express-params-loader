/**
 * @param {Object|Function} modelOrLoadFunction - Mongoose model or load function that returns a promise
 * @param {Object}          [options]
 * @param {Function}          [options.errorFactory]
 * @param {String|Function}   [options.errorMessage]
 * @param {String}            [options.fieldName=_id] - Only for model
 * @param {String}            [options.objectName] - Required for load function
 * @param {Boolean}           [options.passErrorToNext=true]
 *
 * @returns {Function}
 */
function loadObject(modelOrLoadFunction, options) {
    options = Object.assign({}, loadObject.options, options);

    var errorMessageFunction = options.errorMessage instanceof Function ? options.errorMessage : function() {
        return options.errorMessage;
    };
    var errorFactory = options.errorFactory || function(message) {
        var err = new Error(message);
        err.status = 404;
        return err;
    };

    var objectName      = options.objectName;
    var passErrorToNext = options.hasOwnProperty('passErrorToNext') ? options.passErrorToNext : true;

    var loadFunction;

    if (modelOrLoadFunction.findOne instanceof Function) {
        var model     = modelOrLoadFunction;
        var fieldName = options.fieldName || '_id';

        if (!objectName) {
            objectName = model.modelName[0].toLowerCase() + model.modelName.slice(1);
        }

        loadFunction = function(req, value) {
            return model.findOne({ [fieldName]: value });
        };
    } else {
        loadFunction = modelOrLoadFunction;
        if (!objectName) {
            throw new Error('objectName for load function must be set');
        }
    }

    return function(req, res, next, value, name) {
        loadFunction(req, req.params[name])
            .then(function(object) {
                if (!object && passErrorToNext) {
                    var errorMessage = errorMessageFunction(req);
                    var err          = errorFactory(errorMessage);

                    return Promise.reject(err);
                }

                req[objectName] = object;

                next();
            })
            .catch(next);
    };
}

module.exports = loadObject;