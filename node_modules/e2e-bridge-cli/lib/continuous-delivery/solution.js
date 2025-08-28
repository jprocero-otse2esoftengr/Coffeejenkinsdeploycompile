/**
 * Copyright: Scheer E2E AG
 * @author: Jakub Zakrzewski <jakub.zakrzewski@scheer-group.com>
 */

'use strict';

/**
 * @typedef {Object} Solution
 * @extends NamedObject
 * @property {string} name - Name of the solution
 * @property {Object.<string,Array.<string>>} services
 */

/**
 * @typedef {Object} SolutionLike
 * @property {Object.<string,Array.<string>>|string} services
 */

const util = require('../util');

/**
 * Brings solution-like object to a canonical representation
 * @param {SolutionLike} solution
 * @param {string} name Name of the solution
 * @returns {Solution} Solution in canonical form
 */
function normalize(solution, name) {
    return {
        name,
        services: normalizeServicesValue(solution.services)
    };
}

/**
 * Brings services to canonical representation
 * @param {?Object.<string,Array.<GuardedValueLike|string>>} services
 * @returns {Object.<string,Array.<string>>}
 */
function normalizeServicesValue(services) {
    if(!services || Object.keys(services).length === 0) {
        throw new TypeError('No services defined in solution.');
    }

    const result = {};
    Object.entries(services).forEach(([key, value]) => {
        const normalizedValue = util.makeStringArray(value);
        if(normalizedValue && normalizedValue.length > 0) {
            result[key] = normalizedValue;
        }
    });
    return result;
}

module.exports.normalize = normalize;
module.exports.normalizeServicesValue = normalizeServicesValue;
