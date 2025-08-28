/**
 * Copyright: Scheer E2E AG
 * @author: Jakub Zakrzewski <jakub.zakrzewski@scheer-group.com>
 */

'use strict';

const table = require('./table');
const index = require('./index');
const c = require('clorox');

/** @type OutputFormatters */
module.exports = {

    responseFormatter: response => {

        if(!Array.isArray(response['user'])) {
            return index.default.responseFormatter(response);
        }

        const header = [
            {value: 'ID', align: 'left'},
            {value: 'Name', align: 'left'},
            {value: 'Active'},
            {value: 'Group'},
            {value: 'Role'},
        ];
        const rows = (response['user'] || [])
            .map(g => [
                g['id'],
                g['name'],
                g['active']
                ? c.green('✔')
                : c.red('✘'),
                g['group'],
                g['role']]);

        return table.renderTable(header, rows);
    }
};
