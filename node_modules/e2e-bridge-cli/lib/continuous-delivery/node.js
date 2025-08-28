/**
 * Copyright: Scheer E2E AG
 * @author: Jakub Zakrzewski <jakub.zakrzewski@scheer-group.com>
 */

'use strict';

/**
 * @typedef {Object} NodeConfig
 * @extends NamedObject
 * @property {string} name - Name of the node
 * @property {Array.<string>} label - Labels assigned to the node
 * @property {Location} location - Address and port
 * @property {?string} user
 * @property {?string} password
 */

/**
 * @typedef {Object} Location
 * @property {string} protocol
 * @property {string} host
 * @property {string|number} port
 */

/**
 * @typedef {Object} NodeLikeConfig
 * @property {?string|Array.<string>} label - Labels assigned to the node
 * @property {string} location - (DN|IP)[:port]
 * @property {?string} user
 * @property {?string} password
 */

const util = require('../util');

/**
 * Brings node-like object to a canonical representation
 * @param {NodeLikeConfig} node
 * @param {string} name Name of the node
 * @returns {NodeConfig} Node in canonical form
 */
function normalize(node, name) {
    return {
        name,
        label: util.makeStringArray(node.label),
        location: checkLocation(node.location),
        user: node.user || null,
        password: node.password || null
    };
}

/**
 * Check if location is given and is of right type
 * @param {string} value Value to check
 * @returns {Location} Valid value
 */
function checkLocation(value) {
    if(!value || typeof value !== 'string') {
        throw new TypeError('Missing \'location\' field.');
    }
    const [host, port] = value.split(':');
    return {protocol: 'https', host, port: +port || 8080};
}

module.exports.normalize = normalize;
module.exports.checkLocation = checkLocation;
