'use strict';

const E2EBridge = require('e2e-bridge-lib');
const fs = require('fs');
const fmt = require('./formatters');
const _ = require('lodash');
const util = require('./util');

const XUML_SERVICE_TYPE = 'xUML';
const NODE_SERVICE_TYPE = 'node';
const JAVA_SERVICE_TYPE = 'java';

const protocols = Object.freeze({
    HTTP: "http",
    HTTPS: "https"
})
module.exports.protocols = protocols;

const operations = Object.freeze({
    START: "start",
    STOP: "stop",
    KILL: "kill",
    REMOVE: "remove",
    DEPLOY: "deploy",
    PACK: "pack",
    SETTINGS: "settings",
    PREFERENCES: "preferences",
    MODELNOTES: "modelnotes",
    CUSTOMNOTES: "customnotes",
    SERVICES: "services",
    STATUS: "status",
    INFO: "info",
    SESSIONS: "sessions",
    CANCEL_SESSION: "cancel-session",
    RESOURCES: "resources",
    JAVA_RESOURCES: "java-resources",
    XSLT_RESOURCES: "xslt-resources",
    VARIABLES: "variables",
    REPOSITORY: "repository",
    DELIVER: "deliver",
    GROUPS: "groups",
    USERS: "users",
});
module.exports.operations = operations;

function helpText(message) {

    let help = '';

    if(message) {
        help = message + '\n';
    }

    help +=
        'Usage:\n' +
        'services [[-n|--nodejs]|[-j|--java]] [Bridge connection]\n' +
        'info ${ServiceName} [Bridge connection]\n' +
        'modelnotes ${ServiceName} [${NotesFileName}] [Bridge connection]\n' +
        'customnotes ${ServiceName} [[${OutputFile}]|[--upload ${InputFile}]] [Bridge connection]\n' +
        'preferences ${ServiceName} [[-n|--nodejs]|[-j|--java]] [pref ${PreferenceName} ${PreferenceValue}]... [Bridge connection]\n' +
        'status ${ServiceName} [[-n|--nodejs]|[-j|--java]] [Bridge connection]\n' +
        'start|remove ${ServiceName} [[-n|--nodejs]|[-j|--java]] [Bridge connection]\n' +
        'stop|kill ${ServiceName} [[-n|--nodejs]|[-j|--java]] [Bridge connection] [-o stop option]...\n' +
        'settings ${ServiceName} [set ${SettingsName} ${SettingValue}]... [Bridge connection]\n' +
        'settings ${ServiceName} [(--upload ${FilePath})|[set ${SettingsName} ${SettingValue}]...] (-n|--nodejs)  [Bridge connection]\n' +
        'sessions ${ServiceName} [Bridge connection]\n' +
        'cancel-session ${ServiceName} ${SessionId} [Bridge connection]\n' +
        'repository ${ServiceName} [${Destination}] [Bridge connection]\n' +
        'deploy [${path/to/repository}|${path/to/directory}] [Bridge connection] [-o deployment option]...\n' +
        'deliver --domain ${DomainName} [--node ${NodeName}]... [--solution ${SolutionName}]... [--service ${ServiceName}]... [--break-on-error] [--dry-run]\n' +
        'pack [${path/to/directory}] [${path/to/repository}] [-g|--git]\n' +
        'resources [[-d|--delete ${ResourceName}]|[--upload ${FilePath}]] [Bridge connection]\n' +
        'java-resources [[-d|--delete ${ResourceName}]|[--upload ${FilePath}]] [Bridge connection]\n' +
        'xslt-resources [[-d|--delete ${ResourceName}]|[--upload ${FilePath}]] [Bridge connection]\n' +
        'variables [Bridge connection]\n' +
        'groups [${id} [-d|--delete|([-m|--modify] --name ${GroupName} --role ${AssignedRole})] [Bridge connection]\n' +
        'users [${id} [-d|--delete|([-m|--modify] --name ${UserName} [--active [true|false]] --group ${GroupName} --user-password ${UserPassword} )] [Bridge connection]\n' +
        '--help\n\n' +
        'Bridge connection:\n' +
        '\t-s|--scheme (http|https)|--protocol (http|https) The scheme/protocol to be used. Defaults to https.\n' +
        '\t-h|--host <FQDN Bridge host> The host, that runs the Bridge. Defaults to localhost.\n' +
        '\t-p|--port <Bridge port> The port of the Bridge. Defaults to 8080.\n' +
        "\t-u|--user <Bridge user> User that has the right to perform the selected operation on the Bridge.\n" +
        "\t\tRequired. If not given, you'll be prompted for it.\n" +
        "\t-P|--password <password for Bridge user> Password for the user.\n" +
        "\t\tRequired. If not given, you'll be prompted for it, what is recommended as giving your password\n" +
        "\t\tin command line will expose it in your shell's history. Password is masked during prompt.\n\n" +
        'Deployment options:\n' +
        '\tstartup|overwrite|overwritePrefs Multiple options can be separated by comma, like: "-o startup,overwrite"+\n' +
        '\t\tstartup: Launch service after deployment.\n' +
        '\t\toverwrite: Overwrite existing service if one already exists.\n' +
        '\t\toverwritePrefs: Overwrite settings and preferences too.\n' +
        "\t\tnpmInstall: Run 'npm install' (Applies to Node.js services only).\n" +
        "\t\trunScripts: Run 'npm install' (running scripts too) (Applies to Node.js services only).\n" +
        "\tinstanceName=<instance name>: Choose a different instance name  (applies to Node.js services only)\n" +
        "\tpreserveNodeModules: Do not delete the 'node_modules' directory when re-deploying node service\n" +
        "\tstopTimeout=<seconds> (Since BridgeAPI 2.9.0): Allow at least that many seconds before assuming that stop command failed\n\n" +
        "\tallowKill (Since BridgeAPI 2.9.0): If stopping the service before deployment fails, try to kill it\n" +
        'Stop options:\n' +
        "\tstopTimeout=<seconds> (Since BridgeAPI 2.9.0): Allow at least that many seconds before assuming that stop command failed\n\n" +
        'Other:\n' +
        '\t-j|--java Assume that the service is a Java service.\n' +
        '\t-n|--nodejs Assume that the service is a Node.js service. This is ignored for "deploy" and illegal for "kill".\n' +
        '\t-g|--git Use "git archive" for building the repository. This is ignored for all commands but "pack".\n';

    return help;
}

module.exports.helpText = helpText;

function getMode(options) {
    return options.nodejs
           ? NODE_SERVICE_TYPE
           : options.java
             ? JAVA_SERVICE_TYPE
             : XUML_SERVICE_TYPE;
}

/**
 * Do the actual work.
 * Take the options we have calculated and do something useful at last.
 * @param options   Set of known options. Calculated from command line and prompt.
 * @param callback  Let others know, that we're done here.
 * @returns {*} Null or whatever the callback returns.
 */
module.exports.perform = function(options, callback) {
    const bridgeInstance =
        E2EBridge.createInstance(options.protocol, options.host, options.port, options.user, options.password);
    // noinspection FallThroughInSwitchStatementJS
    switch(options.operation) {
        case operations.KILL:
        case operations.STOP:
            bridgeInstance.setServiceStatus(options.operation, options.service, getMode(options), options.options, callback);
            return null;

        case operations.START:
            bridgeInstance.setServiceStatus(options.operation, options.service, getMode(options), callback);
            return null;

        case operations.REMOVE:
            bridgeInstance.removeService(options.service, getMode(options), callback);
            return null;

        case operations.STATUS:
            bridgeInstance.getServiceStatus(options.service, getMode(options), callback);
            return null;

        case operations.INFO:
            bridgeInstance.getXUMLServiceInfo(options.service, callback);
            return null;

        case operations.SESSIONS:
            bridgeInstance.listXUMLServiceSessions(options.service, callback);
            return null;

        case operations.CANCEL_SESSION:
            bridgeInstance.cancelXUMLServiceSession(options.service, options.session, callback);
            return null;

        case operations.DEPLOY:
            bridgeInstance.deployService(options.file, options.options, callback);
            return null;

        case operations.PACK:
            E2EBridge.pack(options.directory, options, callback);
            return null;

        case operations.PREFERENCES:
            if(options.preferences) {
                bridgeInstance.setServicePreferences(options.service, getMode(options), options.preferences, callback);
            } else {
                bridgeInstance.getServicePreferences(options.service, getMode(options), callback);
            }
            return null;
        case operations.SETTINGS:
            if(options.settings) {
                bridgeInstance.setServiceSettings(options.service, getMode(options), options.settings, callback);
            } else {
                bridgeInstance.getServiceSettings(options.service, getMode(options), callback);
            }
            return null;

        case operations.MODELNOTES:
            if(options.filename) {
                bridgeInstance.getXUMLModelNotes(options.service, options.filename, callback);
            } else {
                bridgeInstance.getXUMLModelNotesList(options.service, callback);
            }
            return null;

        case operations.CUSTOMNOTES:
            if(options.upload) {
                const file = fs.createReadStream(options.file);
                bridgeInstance.setXUMLCustomNotes(options.service, file, callback);
            } else {
                if(options.file) {
                    bridgeInstance.getXUMLCustomNotes(options.service, (err, content) => {
                        if(err) {
                            return callback(err);
                        }

                        fs.writeFile(options.file, content, callback);
                    });
                } else {
                    bridgeInstance.getXUMLCustomNotes(options.service, callback);
                }
            }
            return null;

        case operations.SERVICES:
            if(options.nodejs) {
                bridgeInstance.listNodeServices(callback);
            } else if(options.java) {
                bridgeInstance.listJavaServices(callback);
            } else {
                bridgeInstance.listXUMLServices(callback);
            }
            return null;

        case operations.RESOURCES:
            if(options['delete']) {
                bridgeInstance.deleteXUMLResources(options.resourceType, options.resource, callback);
            } else if(options.upload) {
                bridgeInstance.uploadXUMLResources(options.resourceType, options.resource, callback);
            } else {
                bridgeInstance.listXUMLResources(options.resourceType, callback);
            }
            return null;

        case operations.GROUPS:
            if(options['delete']) {
                bridgeInstance.removeGroup(options.groupId, callback);
            } else if(options.groupId) {
                if(options.name || options.role || options.modify) {
                    const group = {id: options.groupId, name: options.name, role: options.role};
                    if(options.modify) {
                        bridgeInstance.modifyGroup(group, callback);
                    } else {
                        bridgeInstance.createGroup(group, callback);
                    }
                } else {
                    bridgeInstance.getGroup(options.groupId, callback);
                }
            } else {
                bridgeInstance.listGroups(callback);
            }
            return null;

        case operations.USERS:
            if(options['delete']) {
                bridgeInstance.removeUser(options.userId, callback);
            } else if(options.userId) {
                if(options.name || (options.active !== null && options.active !== undefined) ||
                    options.group || options['user-password'] || options.modify) {
                    const user = {
                        id: options.userId,
                        name: options.name,
                        group: options.group,
                        password: options['user-password']
                    };
                    if(typeof (options.active) === 'boolean') {
                        user.active = options.active;
                    }
                    if(options.modify) {
                        bridgeInstance.modifyUser(user, callback);
                    } else {
                        bridgeInstance.createUser(user, callback);
                    }
                } else {
                    bridgeInstance.getUser(options.userId, callback);
                }
            } else {
                bridgeInstance.listUsers(callback);
            }
            return null;

        case operations.VARIABLES:
            bridgeInstance.listXUMLVariables(callback);
            return null;

        case operations.REPOSITORY:
            bridgeInstance.getXUMLServiceRepository(options.service, function(err, repo) {
                if(err) {
                    return callback(err);
                }

                fs.writeFile(options.file, repo, callback);
            });
            return null;

    }
    // Should not happen
    return callback({
        errorType: 'BUG',
        error: '"perform" fed with incorrect operation. Please report the problem. Please attach your command line invocation.'
    });
};

/**
 * Execute single task.
 * @param {Bridge} instance - Bridge instance to execute tasks on
 * @param {Task} task - task to execute
 */
module.exports.executeTask = function(instance, task) {
    return new Promise((resolve, reject) => {

        const wrapper = (err, data) => {
            return err
                   ? reject(err)
                   : resolve(data);
        };

        switch(task.type) {
            case operations.DEPLOY:
                instance.deployService(task.parameters['repository'],
                    task.parameters['deploymentOptions'], wrapper);
                return null;
            case operations.SETTINGS:
                instance.setServiceSettings(task.parameters['service'],
                    task.parameters['serviceType'], task.parameters['settings'], wrapper);
                return null;
            case operations.PREFERENCES:
                instance.setServicePreferences(task.parameters['service'],
                    task.parameters['serviceType'], task.parameters['preferences'], wrapper);
                return null;
            case operations.START:
                instance.setServiceStatus('start', task.parameters['service'],
                    task.parameters['serviceType'], wrapper);
                return null;

            default:
                // Should not happen
                return reject({
                    errorType: 'BUG',
                    error: '"executeTask" fed with incorrect operation. Please report the problem. Please attach your command line invocation.'
                });
        }
    });
};

module.exports.gatherPreferences = function(positionalArguments) {
    // scan for properties one may want to set
    if(positionalArguments.indexOf('pref') > -1 && positionalArguments.length >= 3) {
        const preferences = {};
        for(let i = 0; i < positionalArguments.length; i++) {
            if(positionalArguments[i] === 'pref') {
                let setName = positionalArguments[i + 1];
                let setValue = positionalArguments[i + 2];

                if(setValue === 'true') {
                    preferences[setName] = true;
                } else if(setValue === 'false') {
                    preferences[setName] = false;
                } else {
                    preferences[setName] = setValue;
                }
                i += 2;
            }
        }
        return preferences;
    }

    return undefined;
};

module.exports.gatherSettings = function(positionalArguments, options) {
    // scan for settings that should be changed
    if(positionalArguments.indexOf('set') > -1 && positionalArguments.length >= 3) {
        const settings = {};
        for(let i = 0; i < positionalArguments.length; i++) {
            if(positionalArguments[i] === 'set') {
                const key = positionalArguments[i + 1];
                const value = positionalArguments[i + 2];
                if(options['nodejs']) {
                    let convertedValue = value;
                    if(value === 'true') {
                        convertedValue = true;
                    } else if(value === 'false') {
                        convertedValue = false;
                    } else if(/^[1-9]+(\.[0-9]+)?$/.test(value)) {
                        convertedValue = Number(value).valueOf();
                    }
                    _.set(settings, key, convertedValue);
                } else {
                    settings[key] = value;
                }
                i += 2;
            }
        }
        return settings;
    }
    return undefined;
};

module.exports.gatherDeploymentOptions = function(options) {

    const result = Object.assign({}, E2EBridge.defaultDeploymentOptions);
    let error = null;

    util.makeStringArray(options).forEach(function(option) {
        const o = option.split('=');
        switch(o[0]) {
            case E2EBridge.deploymentOptions.STARTUP:
                result.startup = true;
                break;
            case E2EBridge.deploymentOptions.OVERWRITE:
                result.overwrite = true;
                break;
            case E2EBridge.deploymentOptions.SETTINGS:
                result.overwritePrefs = true;
                break;
            case E2EBridge.deploymentOptions.NPM_SCRIPTS:
                result.runScripts = true;
            //noinspection FallThroughInSwitchStatementJS
            case E2EBridge.deploymentOptions.NPM_INSTALL:
                result.npmInstall = true;
                break;
            case E2EBridge.deploymentOptions.INSTANCE_NAME:
                result.instanceName = o[1];
                break;
            case E2EBridge.deploymentOptions.PRESERVE_NODE_MODULES:
                result.preserveNodeModules = true;
                break;
            case E2EBridge.deploymentOptions.STOP_TIMEOUT:
                result.stopTimeout = +o[1];
                break;
            case E2EBridge.deploymentOptions.ALLOW_KILL:
                result.allowKill = true;
                break;
            default:
                error = {
                    level: 'error',
                    message: 'Unknown option "' + option + '".'
                };
                break;
        }
    });

    return {options: result, error};
};

module.exports.gatherStopOptions = function(options) {

    const result = Object.assign({}, E2EBridge.defaultStopOptions);
    let error = null;

    util.makeStringArray(options).forEach(function(option) {
        const o = option.split('=');
        switch(o[0]) {
            case E2EBridge.deploymentOptions.STOP_TIMEOUT:
                result.stopTimeout = +o[1];
                break;
            default:
                error = {
                    level: 'error',
                    message: 'Unknown option "' + option + '".'
                };
                break;
        }
    });

    return {options: result, error};
};

module.exports.gatherConnectionSettings = function(argv) {
    const settings = {};
    const port = parseInt(argv['p'] || argv['port'] || '8080');
    if(isNaN(port)) {
        return {error: helpText('Port has to be an integer number.')};
    }
    settings['port'] = port || 8080;
    settings['user'] = argv['u'] || argv['user'];
    settings['password'] = argv['P'] || argv['password'];

    settings['host'] = argv['h'] || argv['host'] || 'localhost';

    settings['protocol'] = argv['s'] || argv['scheme'] || argv['protocol'] || 'https';

    return {settings};
};

module.exports.isNodeJS = function(argv) {
    return (argv['n'] || argv['N'] || argv['nodejs']) && true;
};

module.exports.isJava = function(argv) {
    return (argv['j'] || argv['java']) && true;
};

module.exports.useGit = function(argv) {
    return (argv['g'] || argv['git']) && true;
};

module.exports.doDelete = function(argv) {
    return (argv['d'] || argv['delete']) && true;
};

module.exports.doUpload = function(argv) {
    return argv['upload'] && true;
};

/**
 * Calculate which formatters should be used.
 * @param options   Set of known options. Calculated from command line.
 * @returns {OutputFormatters} The set of output formatters
 */
module.exports.getOutputFormatters = function(options) {
    const formatters = {
        [operations.RESOURCES]: fmt.resources,
        [operations.SETTINGS]: options['nodejs']
                               ? {}
                               : fmt.settings,
        [operations.PREFERENCES]: fmt.preferences,
        [operations.SERVICES]: fmt.services,
        [operations.INFO]: fmt.info,
        [operations.GROUPS]: fmt.groups,
        [operations.USERS]: fmt.users,
    }[options.operation] || {};
    return Object.assign({}, fmt.default, formatters);
};
