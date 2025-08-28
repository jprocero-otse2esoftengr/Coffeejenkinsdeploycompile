/**
 * Copyright: Scheer E2E AG
 * @author: Jakub Zakrzewski <jakub.zakrzewski@scheer-group.com>
 */

'use strict';

const Table = require('tty-table');

const defaultOptions = {
    borderStyle: 1,
    borderColor: 'blue',
    headerAlign: 'center',
    align: 'center',
    headerColor: 'green',
    compact: true,
};

/**
 * Creates table object
 * @param {Array} header - Table header
 * @param {Array.<Array|Object.<string,string>>} rows - Table content
 * @param {Object.<string, string>=} options - Table styling options
 * @return {Object} The table object.
 */
function createTable(header, rows, options) {
    const o = Object.assign({}, defaultOptions, options);
    return Table(header, rows, o);
}

/**
 * Creates and renders a table in one go.
 * @param {Array} header - Table header
 * @param {Array.<Array|Object.<string,string>>} rows - Table content
 * @param {Object.<string, string>=} options - Table styling options
 * @return {Object} The table string.
 */
function renderTable(header, rows, options) {
    return createTable(header, rows, options).render();
}

module.exports.createTable = createTable;
module.exports.renderTable = renderTable;
