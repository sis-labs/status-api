const bunyan = require('bunyan')
const restify = require('restify')

const {appName, serverPort} = require('./conf/config.json')
const version = '0.0.1' // TODO(mlefebvre): extract the version of the application from the package.json

const {parseOptions, getLogger} = require('./utils')
const {helper} = require('./helper')
const {createServer} = require('./lib/server')

process.env.APPLICATION_NAME || (process.env.APPLICATION = appName)

const appLogger = getLogger(appName)

const options = parseOptions()
appLogger.debug('command line successfully parsed, creating the server')
const server = createServer(Object.assign({}, {name: appName, log: appLogger, version}))
     
server.listen(serverPort, function () {
    appLogger.info(`${server.name} listening at ${server.url}`)
})

