module.exports = {
    createGet,
    createPost,
    createUpdate,
    createDelete
}

const uuid = require('uuid').v4
const {Stopwatch} = require('node-stopwatch')
const restify = require('restify')
const Datastore = require('lokijs')
const dbEngine = new Datastore('contractsCollection')
const contractsDb = dbEngine.addCollection('contracts', { indices: ['id']})

const CORRELATION_ID_HEADER = 'x-correlation-id'

const ITEM_NOT_FOUND = 1
const BAD_REQUEST = 2


const contractRoute = 'contracts'
const contractDetailsRoute = '/contracts/:id'

const _generateHeaders = (correlationId, sw) => {
    return {
	'x-correlation-id': correlationId,
	'x-response-time': sw.elapsedTicks
    }
}

const _generateErrorResponse = (message, code=-1) => {
    return {
	error: {
	    message,
	    code
	}
    }
}

const notFound = (id) => {
    return {
	error: ITEM_NOT_FOUND,
	message: `contract ${id} not found`
    }
}

const badRequest = (message = 'bad request', code = BAD_REQUEST) => {
    return {code, message}
}

function createGet(server) {
    const fetchAllHandler = (request, response, next) => {
	const sw = Stopwatch.create()
	sw.start()
	const correlationId = request.header(CORRELATION_ID_HEADER, uuid())
	server.log.info('Start fetching all contracts')
	contracts = contractsDb.find()
	const duration = sw.elapsedTicks
	server.log.info(`[PERF:${duration}]`)
	response.send(200, contracts, _generateHeaders(correlationId, sw))
	sw.stop()
	return next()
    }
    const findByIdHandler = (request, response, next) => {
	const sw = Stopwatch.create()
	sw.start()
	const contractId = request.params.id
	const correlationId = request.header(CORRELATION_ID_HEADER, uuid())
	if(typeof(contractId) === 'undefined' || null === contractId) {
	    response.send(400, 
			  _generateErrorResponse('contract id must be defined', ITEM_NOT_FOUND),
			  _generateHeaders(correlationId, sw))
	    return next()
	}
	server.log.info(`Starting fetching contract ${id}`)
	contract = contractsDb.find({id: contractId})
	response.send(200, contract, _generateHeaders(correlationId, sw))
	server.log.debug(`response successfully served in ${sw.elapsedTicks}`)
	return next()
    }
    server.get(contractRoute, fetchAllHandler)
    server.head(contractRoute, fetchAllHandler)
    server.get(contractDetailsRoute, findByIdHandler)
    server.head(contractDetailsRoute, findByIdHandler)
    return server
}


function createPost(server) {
    server.post(contractRoute, (request, response, next) => {
	const sw = Stopwatch.create()
	sw.start()
	server.log.info('Starting contract creation')
	const correlationId = request.header(CORRELATION_ID_HEADER, uuid())
	const contract = request.body
	if (typeof(contract.id) === 'undefined') {
	    contact.id = uuid()
	}
	contractsDb.insert(contract)
	const content = {
	    url: `/contracts/${contract.id}`
	}
	response.json(201, content, _generateHeaders(correlationId, sw))
	sw.stop()
	return next()
    })
}

function createUpdate(server) {

    server.patch(contractDetailsRoute, (request, response, next) => {
	const sw = Stopwatch.create()
	sw.start()
	const correlationId = request.header(CORRELATION_ID_HEADER, uuid())
	const contractId = request.params.id
	request.log.info(`starting contract patching process for contract ${contractId}`)
	const contract = request.body
	if (typeof(contract.id) === 'undefined') {
	    response.send(400, badRequest('the contract must have an id'),
			  _generateHeaders(correlationId, sw))
	    sw.stop()
	    return next()
	}
	const original = contractsDb.findOne({id: contractId})
	if (null === original) {
	    response.send(404, notFound(contractId), _generateHeaders(correlationId, sw))
	    sw.stop()
	    return next()
	}
	const updatedContract = Object.assign({}, original, contract)
	try {
	    contractsDb.update(updatedContract)
	    response.send(200, updatedContract, _generateHeaders(correlationId, sw))
	} catch(err) {
	    const {message = err, code = 4} = err
	    response.send(500, {message, code}, _generateHeaders(correlationId, sw))
	}
	sw.stop()
	return next()
    })

    server.put(contractDetailsRoute, (request, response, next) => {
	const sw = Stopwatch.create()
	sw.start()
	const correlationId = request.header(CORRELATION_ID_HEADER, uuid())
	const contractId = request.params.id
	if (typeof(contractId) === 'undefined' || null == contractId) {
	    response.send(400, badRequest('the contract id must be defined'), _generateHeaders(correlationId, sw))
	    sw.stop()
	    return next()
	}
	request.log.info(`starting update process for contract ${contractId}`)
	const contractInfo = request.body
	const original = contractsDb.findOne({id: contractId})
	if (null == original) {
	    response.send(404, notFound(contractId), _generateHeaders(correlationId, sw))
	    sw.stop()
	    return next()
	}
	try {
	    contractsDb.update(contractInfo)
	    response.send(200, contractInfo, _generateHeaders(correlationId, sw))
	} catch(err) {
	    const {message = err, code = 4} = err
	    response.send(500, {message, code}, _generateHeaders(correlationId, sw))
	}
	sw.stop()
	return next()
    })
}

function createDelete(server) {
    server.del(contractDetailsRoute, (request, response, next) => {
	const sw = Stopwatch.create()
	sw.start()
	const correlationId = request.header(CORRELATION_ID_HEADER, uuid())
	const contractId = request.params.id
	if (typeof(contractId) === 'undefined') {
	    response.send(400, badRequest('the contract id must be defined'), _generateHeaders(correlationId, sw))
	    sw.stop()
	    return next()
	}
	const original = contractsDb.findOne({id: contractId})
	if (null === original) {
	    response.send(400, notFound(contractId), _generateHeaders(correlationId, sw))
	    sw.stop()
	    return next()
	}
	try {
	    contractsDb.removeWhere(c => {
		c.id === contractId
	    })
	    response.send(204, null, _generateHeaders(correlationId, sw))
	} catch(err) {
	    const {message = err, code = 4} = err
	    response.send(400, {message, code}, _generateHeaders(correlationId, sw))
	}
	sw.stop()
	return next()
    })
}