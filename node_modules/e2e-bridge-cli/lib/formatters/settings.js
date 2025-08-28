/**
 * Copyright: Scheer E2E AG
 * @author: Jakub Zakrzewski <jakub.zakrzewski@scheer-group.com>
 */

'use strict';

const table = require('./table');
const c = require('clorox');

function formatValue(value, originalValue) {
    return value === originalValue
           ? value
           : c.bold(value);
}

function formatDefault(originalValue, value) {
    return originalValue === value
           ? originalValue
           : c.strikethrough(originalValue);
}

/** @type OutputFormatters */
module.exports = {

    responseFormatter: response => {
        const header = [
            {value: 'Setting', align: 'left'},
            {value: 'Value'},
            {value: 'Default'},
        ];
        const rows = (response['setting'] || [])
            .map(s => [
                `${s['label']} [${s['id']}]`,
                formatValue(s['currentValue'], s['originalValueInModel']),
                formatDefault(s['originalValueInModel'], s['currentValue']),
            ]);

        return table.renderTable(header, rows, {compact: false});
    }
};
