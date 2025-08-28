/**
 * Copyright: Scheer E2E AG
 * @author: Jakub Zakrzewski <jakub.zakrzewski@scheer-group.com>
 */

'use strict';

/**
 * @typedef {Object} Domain
 * @extends NamedObject
 * @property {string} name - Name of the domain
 * @property {Array.<string>} nodes
 * @property {Array.<string>} services
 * @property {Array.<string>} solutions
 */

/**
 * @typedef {Object} LabelExpression
 * @property {string} label
 */

/**
 * @typedef {Object} DomainLike
 * @property {Array.<string>|string} nodes
 * @property {Array.<string>|string} services
 * @property {Array.<string>|string} solutions
 */

const util = require('../util');

/**
 * Brings domain-like object to a canonical representation
 * @param {DomainLike} domain
 * @param {string} name Name of the domain
 * @returns {Domain} Domain in canonical form
 */
function normalize(domain, name) {
    const result = {
        name,
        nodes: util.makeStringArray(domain.nodes),
        services: util.makeStringArray(domain.services),
        solutions: util.makeStringArray(domain.solutions)
    };

    if(result.nodes.length === 0) {
        throw new Error('no nodes defined');
    }

    if(result.services.length === 0 && result.solutions.length === 0) {
        throw new Error('no services defined');
    }

    return result;
}

module.exports.normalize = normalize;
