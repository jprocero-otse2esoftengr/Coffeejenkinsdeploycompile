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
            {value: 'Property', align: 'left'},
            {value: 'Value'},
        ];
        const preferences = response || [];
        const rows = Object.keys(preferences)
            .map(p => [p, preferences[p]]);

        return table.renderTable(header, rows);
    }
};
