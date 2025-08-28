#!/usr/bin/env node

'use strict';

const app = require('./main');
const lib = require('./lib/lib');
const prompts = require('prompts');

/**
 * @implements IIOInterface
 */
class IOInterface {
    out(str) {
        return process.stdout.write(str);
    }

    error(str) {
        return process.stderr.write(str);
    }

    async prompt(questions) {
        return await prompts(questions);
    }
}

const ioInterface = new IOInterface();

/**
 * Displays usage help.
 * @param {?string=} message Additional message to display
 */
function showHelp(message) {
    ioInterface.out(lib.helpText(message));
}

function reportErrors(errors) {
    if((errors || []).some(e => {
        ioInterface.error(`${e.level}: ${e.message}\n`);
        return e.level === 'error';
    })) {
        process.exit(1);
    }
}

const cliParseSettings = require('./minimist.json');
const argErrors = [];
cliParseSettings['unknown'] = function unknownArg(arg) {
    if(/^(-|--)/.test(arg)) {
        argErrors.push({
            level: 'error',
            message: `${arg} not understood`
        });
        return false; // don't add to parsed args
    } else {
        return true;
    }
};

const argv = require('minimist')(process.argv.slice(2), cliParseSettings);

if(argv['help']) {
    showHelp();
    process.exit(0);
}

reportErrors(argErrors);

const positionalArguments = argv._;
delete argv._;

if(positionalArguments.length < 1) {
    showHelp('Incorrect number of arguments');
    process.exit(1);
}

let protocol = argv['protocol'];
if(!app.isKnownProtocol(protocol)) {
    showHelp(`Unsupported protocol: ${protocol}`);
    process.exit(1);
}

let operation = String.prototype.toLowerCase.call(positionalArguments.shift());
if(!app.isKnownOperation(operation)) {
    showHelp(`Unknown operation: ${operation}`);
    process.exit(1);
}

let {errors: settingErrors, settings} = app.createSettings(operation, argv, positionalArguments);
reportErrors(settingErrors);
operation = settings['operation']; // some operations map to different operation with parameter

app.main(settings, ioInterface)
    .catch(reason => {
        ioInterface.out(settings.statusFormatter('error', settings) + '\n');
        ioInterface.out(settings.errorFormatter(reason, settings) + '\n');
        process.exit(2);
    }).then(result => {
    ioInterface.out(settings.statusFormatter('success', settings) + '\n');
    if(result) {
        ioInterface.out(settings.responseFormatter(result, settings) + '\n');
    }
    process.exit(0);
});

