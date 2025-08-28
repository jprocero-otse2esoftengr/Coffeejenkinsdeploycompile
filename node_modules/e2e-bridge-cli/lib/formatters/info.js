/**
 * Copyright: Scheer E2E AG
 * @author: Jakub Zakrzewski <jakub.zakrzewski@scheer-group.com>
 */

'use strict';

const table = require('./table');

function formatSoapPorts(ports) {
    const header = [
        {value: 'Port'},
        {value: 'Active'},
        {value: 'Shadow'},
        {value: 'URL', align: 'left'},
    ];
    const rows = ports
        .map(s => [s['port'], s['active'], s['shadowPort'], s['url']]);

    return table.renderTable(header, rows, {compact: false});
}

function formatRestPorts(ports) {
    const header = [
        {value: 'Port'},
        {value: 'Active'},
        {value: 'ID'},
        {value: 'URL', align: 'left'},
    ];
    const rows = ports
        .map(s => [s['port'], s['active'], s['id'], s['url']]);

    return table.renderTable(header, rows, {compact: false});
}

/** @type OutputFormatters */
module.exports = {

    responseFormatter: response => {

        let result = `Category: ${response['category'] || '?'}`;
        if(response['soapInfo'] && response['soapInfo'].length > 0) {
            result += '\n\nSOAP Ports:';
            result += formatSoapPorts(response['soapInfo']);
        }
        if(response['restInfo'] && response['restInfo'].length > 0) {
            result += '\n\nREST Ports:';
            result += formatRestPorts(response['restInfo']);
        }

        return result;
    }
};
