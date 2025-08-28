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
            {value: 'File Name', align: 'left'},
            {value: 'Upload Date'},
            {value: 'File Size', align: 'right'}
        ];
        const rows = [
            ...(response.file || []),
            ...(response.directory || []).map(d => {
                d.name += '/';
                return d;
            })]
            .map(f => [f.name, f.date, f.fileSize || '-'])
            .sort((l, r) => l[0] > r[0] ? 1 : (l[0] < r[0] ? -1 : 0)); // lexicographically by name

        return table.renderTable(header, rows);
    }
};
