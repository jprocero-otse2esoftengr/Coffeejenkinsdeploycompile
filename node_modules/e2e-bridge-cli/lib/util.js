/**
 * Copyright: Scheer E2E AG
 * @author: Jakub Zakrzewski <jakub.zakrzewski@scheer-group.com>
 */

'use strict';

/**
 * Try to construct a string array with unique entries from input.
 * @param {?Array<string>|string} list
 * @returns {Array<string>}
 */
function makeStringArray(list) {
    if(!list) {
        return [];
    }

    if(typeof list === 'string') {
        return [list];
    }

    if(!Array.isArray(list)) {
        throw new TypeError(`expected list to be a string or an array but got ${typeof list}`);
    }

    list.forEach(s => {
        if(typeof s !== 'string') {
            throw new TypeError(`expected list element to be a string but got ${typeof s}`);
        }
    });
    return unique(list);
}

/**
 * Remove duplicates from the array. Order is not preserved.
 * @param {Array} array
 * @return {Array}
 */
function unique(array) {
    return [...new Set(array)];
}

/**
 * Partition an array according to a predicate.
 * @param {Array.<T>} array - Array to partition
 * @param {function(T):boolean} predicate - Group selector
 * @return {Array.<Array.<T>, Array.<T>>} - The first group matches the predicate, the second doesn't
 * @template T
 */
function partition(array, predicate) {
    return array.reduce((acc, e) => {
        acc[predicate(e)
            ? 0
            : 1].push(e);
        return acc;
    }, [[], []]);
}

module.exports.makeStringArray = makeStringArray;
module.exports.unique = unique;
module.exports.partition = partition;
