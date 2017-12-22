const restify = require('restify')
const bunyan = require('bunyan')

module.exports = {
    setupServer,
    instrumentServer,
    formatContract,
    registerOptionsHandler,
    getOptionHandler
}

const defaultThrollignOptions = {
    burst: 10,
    rate: 5,
    ip: true
}

function setupServer(server, options) {
    let {useMetrics = false,
	 allowUpload = false,
	 throllingOptions = defaultThrollingOptions} = options
    if (allowUpload) {
	server.pre(restify.pre.pause())
    }
    server.pre(restify.pre.sanitizePath())
    server.pre(restify.pre.userAgentConnection())

    server.use(restify.plugins.acceptParser(server.acceptable))
    server.use(restify.plugins.dateParser())
    server.use(restify.plugins.authorizationParser())
    server.use(restify.plugins.queryParser())
    server.use(restify.plugins.gzipResponse())
    server.use(restify.plugins.bodyParser())
    if (useMetrics) {
	server.use(restify.plugins.metrics())
    }
    server.use(restify.plugins.requestLogger())
    server.use(
	restify.plugins.throttle(throllingOptions)
    )
}

function instrumentServer(server) {
    // build audit logger
    server.on('after', restify.plugins.auditLogger({
        event: 'after',
        body: true,
        log: bunyan.createLogger({
            name: 'audit',
            stream: process.stdout
        })
    }))
}


/**
 * This is a nonsensical custom content-type 'application/contract', just to
 * demonstrate how to support additional content-types.  Really this is
 * the same as text/plain, where we pick out 'task' if available.
 *
 * @param {object} request      the request
 * @param {object} response     the response
 * @param {object|string} body  the content of the response
 * @param {function} cb         the callback to invoke after the process
 * @return {mixed}              the result of the callback invocation
 */
function formatContract(request, response, body, cb) {
    if (body instanceof Error) {
        response.statusCode = body.statusCode || 500
        body = body.message
    } else if (typeof body === 'object') {
        body = body.task || JSON.stringify(body)
    } else {
        body = body.toString()
    }
    response.setHeader('Content-Length', Buffer.byteLength(body))
    return cb(null, body)
}

/**
 * Register all options enabled
 *
 * @param {object} server       the server to register option handler for
 * @param {function} handler    the optional handler to use
 * @param {Array} args          vararg of routes to attach the handler onto
 * @return {object} server      the server reference
 */
function registerOptionsHandler(server, handler, ...args) {
    const _handler = null === handler ? getOptionHandler() : handler;
    args.forEach(p => {
        server.options(p, _handler);
    });
    // return server object so that caller can use a chaining notation
    return server;
}

/**
 * Return the handler dedicated to manage OPTIONS request.
 * In normal situation, we have to manage information about the validity of
 * the referer.
 *
 * @return {function} the handler
 */
function getOptionHandler() {
    return (request, response, next) => {
        response.header('Access-Control-Allow-Origin', request.header('HOST'))
        response.header('Access-Control-Request-Method', 'GET,OPTIONS,POST,PUT,PATCH,HEAD') // TRACE,LINK
        response.header('Access-Control-Request-Headers', 'x-correlation-id', 'content-type')
        response.header('Access-Control-Max-Age', 86400)
        return next()
    }
}
