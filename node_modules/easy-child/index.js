/**
 * Copyright: E2E Technologies Ltd
 */
'use strict';


var cp = require('child_process');

module.exports.spawn = spawn;
module.exports.fork = fork;
module.exports.exec = exec;
module.exports.execFile = execFile;

function spawn(command, args, options, callback) {
    return run(cp.spawn.bind(this, command), args, options, callback);
}

function fork(modulePath, args, options, callback) {
    return run(cp.fork.bind(this, modulePath), args, options, callback);
}

function exec(command, options, callback) {
    return cp.exec(command, options, callback);
}

function execFile(file, args, options, callback) {
    return cp.execFile(file, args, options, callback);
}

function run(func, args, options, callback) {
    var childProcess;
    var errors = [];
    var output = [];
    if (typeof args === 'function') {
        callback = args;
        args = [];
        options = {};
    } else if (typeof options === 'function') {
        callback = options;
        options = {};
    }
    if (!callback) {
        callback = function () {};
    }
    childProcess = func(args, options);
    if (childProcess.stdout) {
        childProcess.stdout.on('data', function (data) {
            output.push(data);
        });
    }
    if (childProcess.stderr) {
        childProcess.stderr.on('data', function (data) {
            errors.push(data);
        });
    }
    childProcess.on('error', callback);
    childProcess.on('close', function (code, signal) {
        if (code === 0 && errors.length === 0) {
            callback(null, output.join(''));
        } else {
            var error = new Error(errors.join(''));
            error.code = code;
            if (output.length > 0) error.output = output.join('');
            callback(error);
        }
    });
    return childProcess;
}
