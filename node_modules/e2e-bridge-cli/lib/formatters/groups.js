/**
 * Copyright: Scheer E2E AG
 * @author: Jakub Zakrzewski <jakub.zakrzewski@scheer-group.com>
 */

'use strict';

const table = require('./table');
const index = require('./index');

/** @type OutputFormatters */
module.exports = {

    responseFormatter: response => {

        if(!Array.isArray(response['group'])) {
            return index.default.responseFormatter(response);
        }

        const header = [
            {value: 'ID', align: 'left'},
            {value: 'Name'},
            {value: 'Role'},
            {value: 'Members'},
        ];
        const rows = (response['group'] || [])
            .map(g => [g['id'], g['name'], g['role'], g['members'].join(', ')]);

        return table.renderTable(header, rows);
    }
};
