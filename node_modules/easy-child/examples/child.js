/**
 * Copyright: E2E Technologies Ltd
 */
'use strict';

process.on('message', function (message) {
    var that = this;
    console.log('message', message);
    if (message === 'Die!') {
        setTimeout(function () {
            that.exit(0);
        }, 10);
    }
});
