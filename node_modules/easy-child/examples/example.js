/**
 * Copyright: E2E Technologies Ltd
 */
'use strict';

var child = require('../index.js');

var f = child.fork('./child.js');
f.send('Hello, cruel world!');
f.send('Die!');

child.spawn('git', ['--version'], function (err, stdout) {
    if (err) {
        console.log(err, stdout);
    } else {
        console.log(stdout);
    }
});

if (process.platform === 'win32') {
    child.exec('dir', {cwd: 'D:/Temp'}, function (error, stdout, stderr) {
        if (error) {
            console.log(error, stderr);
        } else {
            console.log(stdout);
        }
    });
}
