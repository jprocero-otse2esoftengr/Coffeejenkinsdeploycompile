/**
 * Copyright: Scheer E2E AG
 * @author: Jakub Zakrzewski <jakub.zakrzewski@scheer-group.com>
 */

'use strict';

const table = require('./table');

/** @type OutputFormatters */
module.exports = {

    responseFormatter: response => {
        const header = [
            {value: 'Service', align: 'left'},
            {value: 'Type'},
            {value: 'Status'},
        ];
        const rows = (response['service'] || [])
            .map(s => [s['name'], s['type'], s['status']]);

        return table.renderTable(header, rows);
    }
};
