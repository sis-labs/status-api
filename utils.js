module.exports = {
    parseOptions,
    getLogger
}

const bunyan = require('bunyan')
const {BasicParser} = require('posix-getopt')
const restify = require('restify')
 
const defaultOptions = {
    hostname: 'localhost',
    port: 5300,
    verbose: true,
    level: 'info'
};

function usage() {
    console.log('node index.js -p 5342 -H localhost -v')
}
 
function parseOptions(configuration, argv = process.argv) {
    let options = Object.assign({}, defaultOptions);
    let option;
    const parser = new BasicParser('p:vH:hu', argv)
    while((option = parser.getopt()) != undefined) {
	switch(option.option) {
	case 'p': // port configuration
	    options.port = option.optarg
	    break
	case 'v':
	    options.level = 'debug'
	    break
	case 'H':
	    options.hostname = option.optarg
	    break
	case 'h':
	case 'u':
	    usage();
	    // TODO(mlefebvre): should exist the program gracefully
	    break
	default:
	    // error message emitted by the getopt ?
	    if (option.option !== '?') {
		// no!
		// TODO(mlefebvre): forward the error to the management stack
		console.log('an error occurred during the parsing process but the system is not able to diagnose the issue')
	    }
	    break
	}
    }
    if (parser.optind() >= argv.length) {
	usage();
	// TODO(mlefebvre): check if we have to exit here
    }
    return Object.assign({}, configuration, options);
}

function getLogger(name) {
    return bunyan.createLogger({
        name,
        streams: [
            {
                level: process.env.LOG_LEVEL || 'info',
                stream: process.stderr
            },
            {
                // This ensures that if we get a WARN or above all debug records
                // related to that request are spewed to stderr - makes it nice
                // filter out debug messages in prod, but still dump on user
                // errors so you can debug problems
                level: 'debug',
                type: 'raw',
                stream: new restify.bunyan.RequestCaptureStream({
                    level: bunyan.WARN,
                    maxRecords: 100,
                    maxRequestIds: 1000,
                    stream: process.stderr
                })
            }
        ],
        serializers: restify.bunyan.serializers
    });
}