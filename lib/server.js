module.exports = {
    createServer
}

const restify = require('restify')
const errors = require('restify-errors')
const assert = require('assert-plus')
const path = require('path')
const helper = require('../helper')
//const {authenticate} = require('./auth');

// TODO(mlefebvre): this approach doesn't work with pm2 and mocha, find a workaround
// can try to do something like: path.parse(process.mainModule.filename).dir
const {NODE_PATH:appDir = path.dirname(require.main.filename)} = process.env

// fetch all api endpoints
const {createGet, createPost, createUpdate, createDelete} = require('./api')

// set server options
const internalServerOptions = {
    name: process.env.APPLICATION_NAME,
    version: '0.0.1' // TODO(mlefebvre): information should be extracted from the package
    // support for http2
//    http2: {
//        cert: null,
//        key: null,
//        ca: null
//    }
}

// throttling options: 5 req/s per IP, burst to 10
const throllingOptions = {
    burst: 10,
    rate: 5,
    ip: true
}

// define generic errors
errors.makeConstructor('MissingContractError', {
    statusCode: 409,
    restCode: 'MissingContract',
    message: 'the contract is required'
})

errors.makeConstructor('ContractExistsError', {
    statusCode: 409,
    restCode: 'ContractExists',
    message: 'the contract already exists'
})

errors.makeConstructor('ContractNotFoundError', {
    statusCode: 404,
    restCode: 'ContractNotFound',
    message: 'the requested contract does not exists'
})

/**
 * Here is our own handlers for authentication/authorization
 * Here we only use basic auth, but really you should look
 * at https://github.com/joyent/node-http-signature
 *
 * @deprecated for now, we are delegating the request check
 * regarding security to the api manager
 */
function _enableAuthenticationSupport(server) {
    server.use((request, response, next) => {
        requset.dir = options.directory

        if (options.user && options.password) {
            request.allow = {
                user: options.user,
                password: options.password
            }
        }
        next()
    });
    server.use(authenticate)
}

function createServer(options) {
    assert.object(options, 'options')
    assert.object(options.log, 'options.log')
    
    const server = restify.createServer(Object.assign({}, internalServerOptions, options))
    helper.setupServer(server, {throllingOptions})
    helper.instrumentServer(server)

    // if authentication support, enable it
//    _enableAuthenticationSupport(server);
    
    // Add our contract handler so that we have a java like interceptor for our contract API
//    server.use(contractHandler);
    
    // set up CRUD
    createGet(server)
    createPost(server)
    createUpdate(server)
    createDelete(server)
//    server.post({path: '/todo', contentType: 'application/json'}, createContract);
    
    // All other endpoint must validate about the existence of the contract
//    server.use(contractExists);
//    server.get('/todo/{id}', findById);
//    server.head('/todo/{id}', findById);
//    server.put({path: '/todo/{id}', contentType: 'application/json'}, updateContract);
//    server.patch({path: '/todo/{id}', contentType: 'application/json'}, updateContract);
//    server.del('/todo/{id}', deleteContract);
    
    helper.registerOptionsHandler(server)
    return server
}
