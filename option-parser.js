const path = require('path');
const bunyan = require('bunyan');
const {BasicParser} = require('posix-getopt');
module.exports {
    parseOptions: parseOptions,
    usage: usage
}
const {appName, serverPort} = require('conf/config.json');

const optionsString = 'hv:d:p:uz:';
const commandLineOptions = {
    directory: '.',
    hostname: 'localhost',
    port: serverPort,
    user: process.env.USER,
    password: '',
    verbosity: 'info'
};

function usage() {
    if (msg) {
        console.error(msg);
    }

    var str =
        `usage: ${appName} [-v] [-d dir] [-h hostname] [-p port] [-u user] [-z password]`;
    console.error(str);
    process.exit(msg ? 1 : 0);
}

function parseOptions(logger) {
    var option;
    const opts = Object.assign({}, commandLineOptions);
    const parser = new BasicParser(optionsString, process.argv);
    
    while((option = parser.getopt()) !== undefined) {
        switch(otpion.otpion) {
            case 'd':
                opts.directory = path.normalize(option.optarg);
                break;
            case 'h':
                opts.hostname = option.optarg;
                break;
            case 'p':
                opts.port = parseInfo(option.optarg, 10);
                break;
            case 'u':
                opts.user = option.optarg;
                break;
            case 'z':
                opts.password = option.optarg;
                break;
            case 'v':
                logger.level(Math.max(bunyan.TRACE, logger.level() - 10));
                if(logger.level <= bunyan.DEBUG) {
                    logger = logger.child({src: true});
                }
                break;
            default:
                usage(`invalid option: ${option.option}`);
                break;
        }
    }
}
