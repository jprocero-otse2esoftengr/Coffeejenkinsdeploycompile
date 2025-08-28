'use strict';

const lib = require('./lib/lib');
const path = require('path');
const cd = require('./lib/continuous-delivery');
const nodeUtil = require('util');
const E2EBridge = require('e2e-bridge-lib');
const clorox = require("clorox");
const fs = require('fs');

/**
 * Provides methods to write on the screen and prompt for data
 *
 * @interface IIOInterface
 */

/**
 * Output normal message
 * @function
 * @name IIOInterface#out
 * @param {string} str - Content to output
 */

/**
 * Output error message
 * @function
 * @name IIOInterface#error
 * @param {string} str - Content to output
 */

/**
 * Get data from external source
 * @function
 * @name IIOInterface#prompt
 * @param {Array.<object>} questions - The object has format accepted by the prompts module
 */

/**
 * A standard error
 * @typedef {object} CliError
 * @property {string} level
 * @property {string} message
 */

/**
 * Check if the given protocol is supported by the tool
 * @param {string} protocol - Name of the operation
 * @return {boolean}
 */
function isKnownProtocol(protocol) {
    return Object.values(lib.protocols).includes(protocol);
}

/**
 * Check if the given operation has any meaning for the tool
 * @param {string} operation - Name of the operation
 * @return {boolean}
 */
function isKnownOperation(operation) {
    return Object.values(lib.operations).includes(operation);
}

/**
 * Check if the given operation needs a connection to the bridge
 * @param {string} operation - Name of the operation
 * @return {boolean}
 */
function requiresConnection(operation) {
    return ![lib.operations.PACK, lib.operations.DELIVER].includes(operation);
}

/**
 * Transform CLI arguments into operation settings
 * @param {string} operation - Name of the operation
 * @param {object} namedArguments - Dictionary of CLI arguments, by their long names
 * @param {Array.<string>} positionalArguments -
 * @return {{errors: Array, settings}}
 */



function createSettings(operation, namedArguments, positionalArguments) {
    const settings = transformOperation(operation);
    let errors = checkNamedArgs(settings['operation'], namedArguments);
    if(errors.filter(e => e.level === 'error').length > 0) {
        return {errors, settings};
    }
    Object.assign(settings, namedArgsToSettings(settings['operation'], namedArguments));

    let posErrors = checkPositionalArgs(settings['operation'], settings, positionalArguments);
    errors = errors.concat(posErrors);
    if(posErrors.filter(e => e.level === 'error').length > 0) {
        return {errors, settings};
    }

    Object.assign(settings,
        positionalArgsToSettings(settings['operation'], settings, positionalArguments));

    Object.assign(settings, lib.getOutputFormatters(settings));

    return {errors, settings};
}

/**
 * Valid connection settings
 * @type {Readonly<{USER: string, PASSWORD: string, PORT: string, HOST: string, PROTOCOL: string}>}
 */
const CONNECTION_SETTINGS = Object.freeze({
    USER: 'user',
    PASSWORD: 'password',
    PORT: 'port',
    HOST: 'host',
    PROTOCOL: 'protocol'
});

/**
 * All operations that accept nodejs and java switch
 * @type {ReadonlyArray<string>}
 */
const TYPE_SWITCHABLE = Object.freeze([
    lib.operations.START,
    lib.operations.STOP,
    lib.operations.KILL,
    lib.operations.REMOVE,
    lib.operations.SERVICES,
    lib.operations.STATUS,
    lib.operations.PREFERENCES,
]);

/**
 * Return all operations except those listed and DELIVER
 * @param {Array.<string>} ops - Operations to exclude
 * @return {Array.<string>}
 */
function operationsExcept(...ops) {
    const excluded = [...ops, lib.operations.DELIVER];
    return Object.values(lib.operations).filter(o => !excluded.includes(o));
}

/**
 * Describe which operations can handle which switches
 * @type {Readonly<object.<string,Array.<string>>>}
 */
const SETTING_ACCEPTANCE = Object.freeze({
    [CONNECTION_SETTINGS['PROTOCOL']]: operationsExcept(lib.operations.PACK),
    [CONNECTION_SETTINGS['HOST']]: operationsExcept(lib.operations.PACK),
    [CONNECTION_SETTINGS['PORT']]: operationsExcept(lib.operations.PACK),
    [CONNECTION_SETTINGS['USER']]: operationsExcept(lib.operations.PACK),
    [CONNECTION_SETTINGS['PASSWORD']]: operationsExcept(lib.operations.PACK),
    "delete": [lib.operations.GROUPS, lib.operations.RESOURCES, lib.operations.USERS],
    "git": [lib.operations.PACK],
    "java": [...TYPE_SWITCHABLE],
    "nodejs": [...TYPE_SWITCHABLE, lib.operations.SETTINGS],
    "options": [lib.operations.DEPLOY, lib.operations.KILL, lib.operations.STOP],
    "upload": [lib.operations.RESOURCES, lib.operations.CUSTOMNOTES, lib.operations.SETTINGS],
    "name": [lib.operations.GROUPS, lib.operations.USERS],
    "role": [lib.operations.GROUPS],
    "active": [lib.operations.USERS],
    "group": [lib.operations.USERS],
    "user-password": [lib.operations.USERS],

    "domain": [lib.operations.DELIVER],
    "node": [lib.operations.DELIVER],
    "label": [lib.operations.DELIVER],
    "solution": [lib.operations.DELIVER],
    "service": [lib.operations.DELIVER],
    "dry-run": [lib.operations.DELIVER],
    "break-on-error": [lib.operations.DELIVER],
});

/**
 * Make sure named CLI arguments are correct
 * @param {string} operation - Operation name
 * @param {object.<string,*>} namedArguments
 * @return {Array}
 */
function checkNamedArgs(operation, namedArguments) {
    const errors = [];
    Object.keys(SETTING_ACCEPTANCE).forEach(function(key) {
        if(namedArguments[key]) {
            if(!SETTING_ACCEPTANCE[key].includes(operation)) {
                errors.push({
                    level: 'error',
                    message: `'${operation}' does not expect '--${key}' argument`
                });
            }
        }
    });

    if(namedArguments[CONNECTION_SETTINGS['PORT']]) {
        const port = parseInt(namedArguments[CONNECTION_SETTINGS['PORT']]);
        if(isNaN(port)) {
            errors.push({
                level: 'error',
                message: 'Port has to be an integer number.'
            });
        }
    }

    if(namedArguments['nodejs'] + namedArguments['java'] > 1) {
        errors.push({
            level: 'error',
            message: 'Only one type switch is allowed. Pick one of --nodejs, or --java.'
        });
    }

    if(operation === lib.operations.SETTINGS &&
        namedArguments['upload'] && !namedArguments['nodejs']) {
        errors.push({
            level: 'error',
            message: 'Only Node.js settings can be uploaded from a JSON file'
        });
    }

    if(operation === lib.operations.DELIVER && !namedArguments['domain']) {
        errors.push({
            level: 'error',
            message: 'Required argument \'domain\' is missing'
        });
    }

    if(operation === lib.operations.DEPLOY) {
        const {error} = lib.gatherDeploymentOptions(namedArguments['options']);
        if(error) {
            errors.push(error);
        }
    }

    if(operation === lib.operations.KILL || operation === lib.operations.STOP) {
        const {error} = lib.gatherStopOptions(namedArguments['options']);
        if(error) {
            errors.push(error);
        }
    }
    return errors;
}

function namedArgsToSettings(operation, args) {
    const settings = {};

    settings[CONNECTION_SETTINGS['PORT']] = parseInt(args[CONNECTION_SETTINGS['PORT']], 10) || 8080;
    settings[CONNECTION_SETTINGS['USER']] = args[CONNECTION_SETTINGS['USER']];
    settings[CONNECTION_SETTINGS['PASSWORD']] = args[CONNECTION_SETTINGS['PASSWORD']];

    settings[CONNECTION_SETTINGS['HOST']] = args[CONNECTION_SETTINGS['HOST']] || 'localhost';

    settings[CONNECTION_SETTINGS['PROTOCOL']] = args[CONNECTION_SETTINGS['PROTOCOL']] || 'https';

    settings['nodejs'] = args['nodejs'];
    settings['java'] = args['java'];
    settings['git'] = args['git'];
    settings['delete'] = args['delete'];
    settings['upload'] = args['upload'];
    settings['name'] = args['name'];
    settings['role'] = args['role'];
    settings['modify'] = args['modify'];
    settings['active'] = args['active'];
    settings['group'] = args['group'];
    settings['user-password'] = args['user-password'];
    if(operation === lib.operations.DEPLOY) {
        settings['options'] = lib.gatherDeploymentOptions(args['options']).options;
    } else if(operation === lib.operations.KILL || operation === lib.operations.STOP) {
        settings['options'] = lib.gatherStopOptions(args['options']).options;
    }

    const toFilter = f => {
        if(Array.isArray(f)) {
            return f;
        } else {
            const s = '' + (f || '');
            return s
                   ? [s]
                   : [];
        }
    };

    settings['domain'] = args['domain'];
    settings['nodeFilter'] = toFilter(args['node']);
    settings['labelFilter'] = toFilter(args['label']);
    settings['solutionFilter'] = toFilter(args['solution']);
    settings['serviceFilter'] = toFilter(args['service']);
    settings['dry-run'] = args['dry-run'];
    settings['break-on-error'] = args['break-on-error'];

    Object.assign(settings, lib.getOutputFormatters(settings));
    return settings;
}

/**
 * Check if the operation receives the right number of arguments
 * @param {string} operation - Operation name
 * @param {object.<string, *>} settings - So far processed settings (i.e. from named arguments)
 * @param {Array.<string>} positionalArguments - Arguments to check
 * @return {Array.<CliError>}
 */
function checkPositionalArgs(operation, settings, positionalArguments) {
    let error = undefined;

    function checkNbOfArgs(chk) {
        return chk(positionalArguments.length)
               ? undefined
               : {
                level: 'error',
                message: 'Incorrect number of arguments'
            };
    }

    // noinspection FallThroughInSwitchStatementJS
    switch(operation) {
        case lib.operations.START:
        case lib.operations.STOP:
        case lib.operations.KILL:
        case lib.operations.REMOVE:
        case lib.operations.STATUS:
        case lib.operations.INFO:
        case lib.operations.SESSIONS:
            error = checkNbOfArgs(n => n === 1);
            break;

        case lib.operations.CANCEL_SESSION:
            error = checkNbOfArgs(n => n === 2);
            break;

        case lib.operations.RESOURCES:
        case lib.operations.DEPLOY:
        case lib.operations.DELIVER:
            error = checkNbOfArgs(n => n <= 1);
            break;

        case lib.operations.GROUPS: {
            let hasArgs = ['delete', 'modify', 'name', 'role'].some(s => !!settings[s]);
            error = checkNbOfArgs(n => (n <= 1) && (!hasArgs || n === 1));
            break;
        }

        case lib.operations.USERS: {
            let hasArgs = ['delete', 'modify', 'name', 'active', 'group', 'user-password'].some(s => !!settings[s]);
            error = checkNbOfArgs(n => (n <= 1) && (!hasArgs || n === 1));
            break;
        }

        case lib.operations.SETTINGS:
            error = checkNbOfArgs(n => n >= 1 && ((n === 2) || ((n - 1) % 3 === 0)));
            break;

        case lib.operations.PREFERENCES:
            error = checkNbOfArgs(n => n >= 1 && (n - 1) % 3 === 0);
            break;

        case lib.operations.MODELNOTES:
        case lib.operations.CUSTOMNOTES:
        case lib.operations.REPOSITORY:
        case lib.operations.PACK:
            error = checkNbOfArgs(n => n >= 1 && n <= 2);
            break;

        case lib.operations.SERVICES:
        case lib.operations.VARIABLES:
            error = checkNbOfArgs(n => n === 0);
            break;
    }

    return error ? [error] : [];
}

/**
 * Create settings from positional CLI arguments for given operation
 * @param {string} operation - Operation name
 * @param {object.<string, *>} cliSettings - So far processed settings (i.e. from named arguments)
 * @param {Array.<string>} positionalArguments - Arguments to process
 */
function positionalArgsToSettings(operation, cliSettings, positionalArguments) {

    const settings = {};

    if(operation === lib.operations.DEPLOY) {
        settings['file'] = path.resolve('' + (positionalArguments.shift() || '.'));
    } else if(operation === lib.operations.PACK) {
        settings['directory'] = path.resolve('' + positionalArguments.shift());

        let out = positionalArguments.shift();
        settings['output'] = out
                             ? path.resolve('' + out)
                             : null;
    } else if(operation === lib.operations.RESOURCES) {
        settings['resource'] = positionalArguments.shift();
        if(cliSettings['upload'] && settings['resource']) {
            settings['resource'] = fs.createReadStream(path.resolve('' + settings['resource']));
        }
    } else if(operation === lib.operations.DELIVER) {
        settings['projectRoot'] = path.resolve(positionalArguments.shift() || '.');
    } else if(operation === lib.operations.GROUPS) {
        settings['groupId'] = positionalArguments.shift();
    } else if(operation === lib.operations.USERS) {
        settings['userId'] = positionalArguments.shift();
    } else if(operation !== lib.operations.SERVICES) {
        settings['service'] = '' + positionalArguments.shift();
        if(operation === lib.operations.MODELNOTES) {
            const filename = positionalArguments.shift();
            if(filename) {
                settings['filename'] = '' + filename;
            }
        } else if(operation === lib.operations.CANCEL_SESSION) {
            settings['session'] = positionalArguments.shift();
        } else if(operation === lib.operations.REPOSITORY) {
            settings['file'] = path.resolve('' + (positionalArguments.shift() || '.'));
            if(fs.statSync(settings['file']).isDirectory()) {
                settings['file'] = path.join(settings['file'], `repository-${settings['service']}.rep`);
            }
        } else if(operation === lib.operations.CUSTOMNOTES) {
            const file = positionalArguments.shift();
            if(file) {
                settings['file'] = path.resolve('' + file);
            }
        } else if(operation === lib.operations.SETTINGS) {
            if(cliSettings['nodejs'] && cliSettings['upload']) {
                settings['file'] = positionalArguments.shift();
                if(settings['file']) {
                    settings['settings'] = JSON.parse(
                        fs.readFileSync(path.resolve('' + settings['file']), {encoding: 'utf-8'})
                    );
                }
            } else {
                settings['settings'] = lib.gatherSettings(positionalArguments, cliSettings);
            }
        } else if(operation === lib.operations.PREFERENCES) {
            settings['preferences'] = lib.gatherPreferences(positionalArguments);
        }
    }

    return settings;
}

/**
 * Transform operation name and infer additional settings if needed
 * @param operation - Operation name
 */
function transformOperation(operation) {
    const settings = {};
    const resourceOps = [
        lib.operations.JAVA_RESOURCES,
        lib.operations.XSLT_RESOURCES,
        lib.operations.RESOURCES
    ];

    if(resourceOps.includes(operation)) {
        settings['resourceType'] = operation.split('-').reverse()[1] || 'resource';
        settings['operation'] = lib.operations.RESOURCES;
    } else {
        settings['operation'] = operation;
    }
    return settings;
}

/**
 * Perform requested operation
 * @param {object.<string,*>} settings
 * @param {IIOInterface} ioInterface
 * @return {Promise<*>}
 */
function main(settings, ioInterface) {
    if(settings['operation'] === lib.operations.DELIVER) {
        return deliveryMain(settings, ioInterface);
    } else {
        return simpleMain(settings, ioInterface);
    }
}

/**
 * Perform delivery
 * @param {object.<string,*>} settings
 * @param {IIOInterface} ioInterface
 * @return {Promise<*>}
 */
function deliveryMain(settings, ioInterface) {
    return new Promise((resolve, reject) => {
        ioInterface.out('Reading configuration.\n');
        cd.readDefinitions(settings['projectRoot'], (err, cfg) => {
            if(!err) {
                if(!settings['dry-run']) {
                    ioInterface.out('Working, please wait.\n');
                }
                deliverConfiguration(cfg, settings, ioInterface)
                    .then(resolve)
                    .catch(reject);
            } else {
                reject(err);
            }
        });
    });
}

/**
 * Perform one-off action
 * @param {object.<string,*>} settings
 * @param {IIOInterface} ioInterface
 * @return {Promise<*>}
 */
async function simpleMain(settings, ioInterface) {
    if(requiresConnection(settings['operation']) && (!settings['user'] || !settings['password'])) {
        const questions = [
            {
                type: 'text',
                name: 'user',
                message: 'User',
                initial: settings['user']
            },
            {
                type: 'password',
                name: 'password',
                message: 'Password',
                initial: settings['password']
            },
        ];

        let credentials = await ioInterface.prompt(questions);
        Object.assign(settings, credentials);
    }

    ioInterface.out('Working, please wait.\n');

    return new Promise((resolve, reject) => {
        lib.perform(settings, function(error, result) {
            return error
                   ? reject(error)
                   : resolve(result);
        });
    });
}

/**
 * Transform, filter, and, finally, execute delivery configuration
 * @param {DeliveryConfigurationObject} configuration
 * @param {object.<string,*>} settings
 * @param {IIOInterface} ioInterface
 * @return {Promise<*>}
 */
async function deliverConfiguration(configuration, settings, ioInterface) {

    const errors = [];

    const tree = cd.createDeliveryTree(configuration.domains, configuration.nodes,
        configuration.solutions, configuration.services, errors);

    const filtered = cd.filterDeliveryTree(settings['domain'], settings['nodeFilter'],
        settings['labelFilter'], settings['solutionFilter'], settings['serviceFilter'],
        tree, configuration, errors);

    const taskLists = cd.transformToTaskList(filtered, configuration.nodes);

    let stop = false;
    errors.forEach(({level, message}) => {
        console[level](`${level}: ${message}`);
        if(level === 'error') {
            stop = true;
        }
    });

    if(stop) {
        throw {
            errorType: 'configuration',
            message: 'Configuration errors detected. Skipping execution.'
        };
    }

    const executionErrors = [];
    for(const taskList of taskLists) {
        executionErrors.push(...await executeNodeTaskList(taskList, settings, ioInterface));
    }

    if(executionErrors.filter(e => e).length > 0) {
        throw {
            errorType: 'delivery',
            message: 'Some delivery actions were unsuccessful.'
        };
    }
}

/**
 * Execute all tasks assigned to given node
 * @param {NodeTaskList} taskList
 * @param {object.<string,*>} settings
 * @param {IIOInterface} ioInterface
 * @return {Promise<*>}
 */
async function executeNodeTaskList(taskList, settings, ioInterface) {
    let cfg = Object.assign({}, taskList.nodeConfig);
    if(!settings['dry-run'] && (!cfg.user || !cfg.password)) {
        const name = `${cfg.name} (${cfg.location.host}:${cfg.location.port})`;
        const questions = [
            {
                type: 'text',
                name: 'user',
                message: `User for ${name}`,
                initial: cfg['user']
            },
            {
                type: 'password',
                name: 'password',
                message: `Password for ${name}`,
                initial: cfg['password']
            },
        ];

        let credentials = await ioInterface.prompt(questions);
        Object.assign(cfg, credentials);
    }

    const instance = E2EBridge.createInstance(cfg.location.protocol, cfg.location.host, cfg.location.port,
        cfg.user, cfg.password);

    let promises = taskList.serviceTasks.map(async tasks => {
        let skip = false;
        let error = null;
        for(const task of tasks) {
            if(settings['dry-run']) {
                ioInterface.out(clorox.green('* ') + `on ${clorox.bold(cfg.name)} would run task\n`);
                ioInterface.out(nodeUtil.inspect(task, {depth: 10, color: true}) + '\n');
            } else {
                const text = `${task.parameters['service']} on ${clorox.bold(cfg.name)}: ${task.type}`;
                if(skip) {
                    ioInterface.out(`${clorox.yellow('⏩')} Skipped: ${text}\n`);
                    continue;
                }
                try {
                    await lib.executeTask(instance, task);
                    ioInterface.out(`${clorox.green('✔')} ${text}\n`);
                } catch(e) {
                    ioInterface.out(`${clorox.red('✘')} ${text}\n`);
                    if(settings['break-on-error']) {
                        throw e;
                    } else {
                        skip = true;
                        error = e;
                        ioInterface.out(settings['errorFormatter'](error, settings) + '\n');
                    }
                }
            }
        }

        if(error) {
            throw error;
        }
    });

    if(!settings['break-on-error']) {
        promises = promises.map(p => p.catch(e => e));
    }

    return await Promise.all(promises);
}


module.exports.isKnownProtocol = isKnownProtocol;
module.exports.isKnownOperation = isKnownOperation;
module.exports.requiresConnection = requiresConnection;
module.exports.createSettings = createSettings;
module.exports.positionalArgsToSettings = positionalArgsToSettings;
module.exports.main = main;
module.exports.deliveryMain = deliveryMain;
module.exports.simpleMain = simpleMain;
module.exports.deliverConfiguration = deliverConfiguration;
