/**
 * Copyright: Scheer E2E AG
 * @author: Jakub Zakrzewski <jakub.zakrzewski@scheer-group.com>
 */

'use strict';

/**
 * @typedef {Object} DeliveryTreeError
 * @property {string} level
 * @property {string} message
 */

/**
 * @typedef {Object} NamedObject
 * @property {string} name
 */

/**
 * @typedef {Object} DeliveryConfigurationObject
 * @property {Array.<Domain>} domains
 * @property {Array.<NodeConfig>} nodes
 * @property {Array.<Solution>} solutions
 * @property {Array.<Service>} services
 */

/**
 * @typedef {object.<string,DomainDeliveryTree>} DeliveryTree
 */

/**
 * @typedef {object.<string,NodeDeliveryTree>} DomainDeliveryTree
 */

/**
 * @typedef {object.<string,Service>} NodeDeliveryTree
 */

const path = require('path');
const fs = require('fs');
const async = require('async');
const Domain = require('./domain');
const Node = require('./node');
const Service = require('./service');
const Solution = require('./solution');
const util = require('../util');
const nodeUtil = require('util');
const lib = require('../lib');
const bridge = require('e2e-bridge-lib');
const _ = require('lodash');

const defaultDeploymentOptions =
    Object.freeze(Object.assign({}, bridge.defaultDeploymentOptions, {
        [bridge.deploymentOptions.OVERWRITE]: true,
        [bridge.deploymentOptions.STARTUP]: true,
    }));

/**
 * Read and normalize configuration from the filesystem.
 *
 * @param {string} root - The root directory of the configuration
 * @param {function(?object, ?DeliveryConfigurationObject)} callback - Called when done.
 */
function readDefinitions(root, callback) {
    const read =
        (type, cb, optional) => async.apply(readFiles, path.resolve(root, type), optional, cb);
    async.parallel({
        domains: read('domains', Domain.normalize),
        nodes: read('nodes', Node.normalize),
        services: read('services', (s, name) => Service.normalize(s, name, root)),
        solutions: read('solutions', Solution.normalize, true),
    }, callback);
}

/**
 * Read and normalize configuration type from the filesystem.
 *
 * @param {string} root - The root directory of the configuration type
 * @param {boolean} optional - Don't error if directory does not exist.
 * @param {function(object, string)} normalizeCallback - Function that normalizes read config.
 * @param {function(?object, ?object=)} callback - Called when done.
 */
function readFiles(root, optional, normalizeCallback, callback) {
    fs.readdir(root, (err, files) => {
        if(err) {
            if(optional && err.code === 'ENOENT') {
                return callback(null, []);
            }
            return callback(err);
        }

        async.map(files.filter(n => path.extname(n) === '.json'), (f, cb) => {
            const filePath = path.resolve(root, f);
            let parsed = null;
            try {
                parsed = require(filePath);
            } catch(e) {
                return cb(e);
            }

            try {
                return cb(null, normalizeCallback(parsed, path.basename(f, '.json')));
            } catch(e) {
                e.message = filePath + ': ' + e.message;
                return cb(e);
            }
        }, callback);
    });
}

/**
 * Select nodes by label
 * @param {string} label
 * @param {Array.<NodeConfig>} nodes
 * @return {Array.<NodeConfig>} Resolved node names
 */
function selectNodesByLabel(label, nodes) {
    return nodes.filter(n => n.label.includes(label));
}

/**
 * Calculate a 'score' for a guarded value.
 *
 * @param {GuardedValue} value - The value being evaluated
 * @param {Domain} domain - The domain to use for the domain condition
 * @param {NodeConfig} node - The node to use for the node and label conditions
 */
function calculateValueScore(value, domain, node) {

    const calc = (arr, val) => {
        return arr.length === 0
               ? 0
               : arr.includes(val)
                 ? 1 / arr.length
                 : -1;
    };

    let domainScore = calc(value.domain, domain.name);
    let nodeScore = calc(value.node, node.name);

    let labelScore = value.label.length === 0
                     ? 0
                     : -1;
    if(labelScore === -1) {
        let matches = value.label.filter(l => node.label.includes(l)).length;
        if(matches > 0) {
            labelScore = 1 / matches;
        }
    }

    if(domainScore < 0 || nodeScore < 0 || labelScore < 0) {
        return -1;
    }

    return [domainScore, nodeScore, labelScore]
        .reduce((acc,v) => acc + (v > 0 ? 10 + v : 0));
}

/**
 * Select the best matching value
 * It calculates scores for all the possible values
 * Highest score wins.
 *
 * @param {string} valueName - Value name
 * @param {Array.<GuardedValue>} values - Value array to choose the best from
 * @param {Domain} domain - The domain to use for the domain condition
 * @param {NodeConfig} node - The node to use for the node and label conditions
 * @param {Service} service - The service this setting is for
 * @param {Array.<DeliveryTreeError>} errors - Place to collect errors / warnings
 */
function selectBestValue(valueName, values, domain, node, service, errors) {
    let candidates = values.map(v => {
        return {
            value: v.value,
            score: calculateValueScore(v, domain, node)
        };
    }).filter(v => v.score >= 0).sort((l, r) => r.score - l.score);

    if(candidates.length === 0) {
        return undefined; // no matching value
    }

    const best = candidates.shift();
    candidates.filter(v => v.score === best.score && v.value !== best.value).forEach(v => {
        errors.push({
            level: 'warn',
            message: `domain '${domain.name}', service '${service.name}': '${valueName}': ` +
                `choosing ${nodeUtil.inspect(best.value)} over ${nodeUtil.inspect(v.value)} even though ` +
                `they both match with the same quality`
        });
    });
    return best.value;
}

/**
 * Resolve guarded values.
 *
 * @param {Object.<string,Array.<GuardedValue>>|Array.<GuardedValue>} values - Collection to process
 * @param {Domain} domain - Current domain
 * @param {NodeConfig} node - Current node
 * @param {Service} service - The service object the values are for
 * @param {Array.<DeliveryTreeError>} errors - Place to collect errors / warnings
 * @return {object} - Prepared delivery tree part for the given domain
 */
function selectGuardedValues(values, domain, node, service, errors) {
    if(Array.isArray(values)) {
        return selectBestValue('settings', values, domain, node, service, errors);
    }

    const newValues = {};
    Object.keys(values).forEach(name => {
        const value = selectBestValue(name, values[name], domain, node, service, errors);
        if(value !== undefined) {
            newValues[name] = value;
        }
    });
    return newValues;
}

/**
 * Create a tree structure from the configuration for single service.
 * The finished tree looks like Service but has all of the settings resolved
 * to a single concrete value.
 *
 * @param {Domain} domain - Current domain
 * @param {NodeConfig} node - Current node
 * @param {Service} service - The service object to transform
 * @param {Array.<DeliveryTreeError>} errors - Place to collect errors / warnings
 * @return {object} - Prepared delivery tree part for the given domain
 */
function createServiceDeliveryTree(domain, node, service, errors) {
    const tree = {
        ...service,
        settings: selectGuardedValues(service.settings, domain, node, service, errors),
        preferences: selectGuardedValues(service.preferences, domain, node, service, errors),
        deploymentOptions: selectGuardedValues(service.deploymentOptions, domain, node, service, errors),
    };

    if(service.type === bridge.NODE_SERVICE_TYPE) {
        tree.settings = Object.keys(tree.settings)
            .reduce((acc, k) => _.set(acc, k, tree.settings[k]), {});
    }

    return tree;
}

/**
 * Create a tree structure from the configuration for single node.
 * The finished tree looks like that:
 * {
 *     serviceName: Service
 * }
 * Service has all of the settings resolved.
 *
 * @param {Domain} domain - Domain for which to create the tree
 * @param {NodeConfig} node - Node for which to create the tree
 * @param {Array.<Service>} services - All the services
 * @param {Array.<string>} serviceNames - List of names of services assigned to the given node
 * @param {Array.<DeliveryTreeError>} errors - Place to collect errors / warnings
 * @return {object} - Prepared delivery tree part for the given domain
 */
function createNodeDeliveryTree(domain, node, services, serviceNames, errors) {
    const tree = {};
    const selectedServices = services.filter(s => serviceNames.includes(s.name));
    selectedServices.forEach(s => {
        tree[s.name] = createServiceDeliveryTree(domain, node, s, errors);
    });
    return tree;
}

/**
 * Create a tree structure from the configuration for single solution.
 * The finished tree looks like that (exactly like the domain tree):
 * {
 *     nodeName: {
 *         serviceName: Service
 *     }
 * }
 * Service has all of the settings resolved.
 *
 * @param {Domain} domain - Domain for which to create the tree
 * @param {Array.<NodeConfig>} nodes - All the nodes of the domain
 * @param {Solution} solution - Solution for which to create the tree
 * @param {Array.<Service>} services - All the services
 * @param {Array.<DeliveryTreeError>} errors - Place to collect errors / warnings
 * @return {object} - Prepared delivery tree part for the given domain
 */
function createSolutionDeliveryTree(domain, nodes, solution, services, errors) {

    return Object.keys(solution.services).map(s => {
        const tree = {};
        selectNodesByLabel(s, nodes).forEach(n => {
            tree[n.name] =
                createNodeDeliveryTree(domain, n, services, solution.services[s], errors);
        });
        return tree;
    }).reduce((result, tree) => mergeDomainDeliveryTree(domain.name, result, tree, errors));
}

/**
 * Create a tree structure from the configuration for single domain.
 * The finished tree looks like that:
 * {
 *     nodeName: {
 *         serviceName: Service
 *     }
 * }
 * Service has all of the settings resolved.
 *
 * @param {Domain} domain - Domain for which to create the tree
 * @param {Array.<NodeConfig>} nodes - All the nodes
 * @param {Array.<Solution>} solutions - All the solutions
 * @param {Array.<Service>} services - All the services
 * @param {Array.<DeliveryTreeError>} errors - Place to collect errors / warnings
 * @return {object} - Prepared delivery tree part for the given domain
 */
function createDomainDeliveryTree(domain, nodes, solutions, services, errors) {
    let tree = {};
    const selectedNodes = nodes.filter(n => domain.nodes.includes(n.name));
    selectedNodes.forEach(n => {
        tree[n.name] = createNodeDeliveryTree(domain, n, services, domain.services, errors);
    });

    const nodeNames = selectedNodes.map(n => n.name);
    const invalidNodes = domain.nodes.filter(n => !nodeNames.includes(n));
    invalidNodes.forEach(n => {
        errors.push({
            level: 'error',
            message: `Domain '${domain.name}' uses unknown node '${n}'`
        });
    });

    const selectedSolutions = solutions.filter(s => domain.solutions.includes(s.name));
    selectedSolutions.forEach(s => {
        const solutionTree = createSolutionDeliveryTree(domain, selectedNodes, s, services, errors);
        tree = mergeDomainDeliveryTree(domain.name, tree, solutionTree, errors);
    });
    return tree;
}

/**
 * Create a tree structure from the configuration.
 * The finished tree looks like that:
 * {
 *     domainName: {
 *         nodeName: {
 *             serviceName: Service
 *         }
 *     }
 * }
 * Service has all of the settings resolved.
 *
 * @param {Array.<Domain>} domains - All the domains
 * @param {Array.<NodeConfig>} nodes - All the nodes
 * @param {Array.<Solution>} solutions - All the solutions
 * @param {Array.<Service>} services - All the services
 * @param {Array.<DeliveryTreeError>} errors - Place to collect errors / warnings
 * @return {DeliveryTree} - Prepared delivery tree
 */
function createDeliveryTree(domains, nodes, solutions, services, errors) {
    const tree = {};
    domains.forEach(d => {
        tree[d.name] = createDomainDeliveryTree(d, nodes, solutions, services, errors);
    });
    return tree;
}

/**
 * Merges two domain delivery trees into one
 *
 * @param {string} name - Domain name
 * @param {object} lhs
 * @param {object} rhs
 * @param {Array.<DeliveryTreeError>} errors - Place to collect errors / warnings
 * @return {object} - Merged tree.
 */
function mergeDomainDeliveryTree(name, lhs, rhs, errors) {
    return util.unique([...Object.keys(lhs), ...Object.keys(rhs)]).reduce((merged, key) => {
        merged[key] = Object.assign({}, lhs[key], rhs[key]);
        return merged;
    }, {});
}

/**
 * Filter the list of things by their `name` property.
 *
 * @param {string} domainName - Name of the domain currently being processed
 * @param {string} type - The type of things being filtered
 * @param {Array.<string>} allowedFilters - List of names belonging to the domain
 * @param {Array.<string>} filter - The list of names to leave
 * @param {Array.<T>} things - The list of objects to filter
 * @param {Array.<DeliveryTreeError>} errors - Place to collect errors / warnings
 * @return {Array.<T>}
 * @template T
 */
function computeFilteredList(domainName, type, allowedFilters, filter, things, errors) {
    if(filter.length === 0) {
        filter = allowedFilters;
    }

    const [good, bad] = util.partition(filter, f => allowedFilters.includes(f));
    if(bad.length > 0) {
        bad.forEach(t => {
            errors.push({
                level: 'warn',
                message: `${type} '${t}' is not a part of the '${domainName}' domain`
            });
        });
        return [];
    }

    return things.filter(t => good.includes(t.name));
}

/**
 * Filter the list of solutions by name.
 *
 * @param {Domain} domain - Domain currently being processed
 * @param {Array.<string>} filter - The list of names to leave
 * @param {Array.<Solution>} solutions - The list of solutions to filter
 * @param {Array.<DeliveryTreeError>} errors - Place to collect errors / warnings
 * @return {Array.<Solution>} - Filtered solution list
 */
function computeSolutionList(domain, filter, solutions, errors) {
    return computeFilteredList(domain.name, 'solution', domain.solutions,
        filter, solutions, errors);
}

/**
 * Filter the list of nodes by name.
 *
 * @param {Domain} domain - Domain currently being processed
 * @param {Array.<string>} names - The list of node names to leave
 * @param {Array.<string>} labels - The list of node labels to leave
 * @param {Array.<NodeConfig>} nodes - The list of nodes to filter
 * @param {Array.<DeliveryTreeError>} errors - Place to collect errors / warnings
 * @return {Array.<NodeConfig>} - Filtered node list
 */
function computeDomainNodeList(domain, names, labels, nodes, errors) {
    const list = computeFilteredList(domain.name, 'node', domain.nodes, names, nodes, errors);
    return labels.length > 0
           ? list.filter(n => n.label.some(l => labels.includes(l)))
           : list;
}

/**
 *
 * @param {string} domainName
 * @param {DomainDeliveryTree} tree
 * @param {Array<string>} serviceNames
 * @param {Array.<DeliveryTreeError>} errors - Place to collect errors / warnings
 * @return {Array<string>} - The correct filters
 */
function createServicesFilter(domainName, tree, serviceNames, errors) {
    const domainServices = util.unique(Object.keys(tree)
        .map(n => Object.keys(tree[n]))
        .reduce((acc, ss) => [...acc, ...ss], []));

    if(serviceNames.length === 0) {
        return domainServices;
    }

    const [good, bad] = util.partition(serviceNames, s => domainServices.includes(s));
    bad.forEach(s => {
        errors.push({
            level: 'warn',
            message: `service '${s}' is not a part of the '${domainName}' domain`
        });
    });
    return good;
}

/**
 * Filter delivery tree to leave only entries matching specific criteria
 *
 * @param {Domain} domain - Domain being filtered
 * @param {Array.<string>} nodes - Node names to leave
 * @param {Array.<string>} labels - Node labels to leave
 * @param {Array.<string>} solutions - Solutions to leave
 * @param {Array.<string>} services - Services to leave
 * @param {DomainDeliveryTree} tree - Tree to filter
 * @param {DeliveryConfigurationObject} definitions
 * @param {Array.<DeliveryTreeError>} errors - Place to collect errors / warnings
 * @return {DomainDeliveryTree} - Filtered delivery tree
 */
function filterDomainDeliveryTree(domain, nodes, labels, solutions, services, tree, definitions, errors) {

    const solutionList = computeSolutionList(domain, solutions, definitions.solutions, errors);

    if(solutionList.length === 0 && solutions.length > 0) {
        return /** @type {DomainDeliveryTree} */ {};
    }

    const labelDeployments = solutionList.reduce((acc, s) => {
        Object.keys(s.services).forEach(l => {
            if(acc[l]) {
                acc[l].push(...s.services[l]);
            } else {
                acc[l] = [...s.services[l]];
            }
        });
        return acc;
    }, {});

    const nodeList = computeDomainNodeList(domain, nodes, labels, definitions.nodes, errors);

    const deployments = Object.keys(labelDeployments)
        .map(l => ({label: l, services: labelDeployments[l]}))
        .reduce((acc, e) => {
            nodeList.filter(n => n.label.includes(e.label)).forEach(n => {
                if(!acc[n.name]) {
                    acc[n.name] = {};
                }
                e.services.forEach(s => acc[n.name][s] = tree[n.name][s]);
            });
            return acc;
        }, /** @type {DomainDeliveryTree} */ {});

    if(solutions.length === 0) {
        nodeList.forEach(n => {
            if(!deployments[n.name]) {
                deployments[n.name] = {};
            }
            domain.services.forEach(s => deployments[n.name][s] = tree[n.name][s]);
        });
    }

    services = createServicesFilter(domain.name, tree, services, errors);

    Object.keys(deployments).forEach(n => {
        Object.keys(deployments[n]).filter(s => !services.includes(s)).forEach(s => {
            delete deployments[n][s];
        });
        if(Object.keys(deployments[n]).length === 0) {
            delete deployments[n];
        }
    });

    return deployments;
}

/**
 * Filter delivery tree to leave only entries matching specific criteria
 *
 * @param {string} domain - Domain name criterion
 * @param {Array.<string>} nodes - Node names to leave
 * @param {Array.<string>} labels - Node labels to leave
 * @param {Array.<string>} solutions - Solutions to leave
 * @param {Array.<string>} services - Services to leave
 * @param {DeliveryTree} tree - Tree to filter
 * @param {DeliveryConfigurationObject} definitions
 * @param {Array.<DeliveryTreeError>} errors - Place to collect errors / warnings
 * @return {DomainDeliveryTree} - Filtered delivery tree
 */
function filterDeliveryTree(domain, nodes, labels, solutions, services, tree, definitions, errors) {
    const domainObject = definitions.domains.find(d => d.name === domain);
    if(!domainObject) {
        errors.push({
            level: 'error',
            message: `domain '${domain}' is not defined in the configuration`
        });

        return /** @type {DomainDeliveryTree} */ {};
    }
    return filterDomainDeliveryTree(domainObject, nodes, labels, solutions,
        services, tree[domain], definitions, errors);
}

/**
 * @typedef {Object} Task
 * @property {string} type
 * @property {object.<string,*>} parameters
 */

/**
 * Creates a list of tasks to perform on given service
 * @param {Service} service
 * @return {Array.<Task>}
 */
function transformServiceToTaskGroup(service) {

    const options = Object.assign({}, defaultDeploymentOptions, service.deploymentOptions);

    // we don't use the startup-by-deployment
    // a separate task will be generated for that
    const startup = options[bridge.deploymentOptions.STARTUP];
    options[bridge.deploymentOptions.STARTUP] = false;

    const tasks = [
        {
            type: lib.operations.DEPLOY,
            parameters: {
                service: service.name,
                serviceType: service.type,
                repository: service.repository,
                deploymentOptions: options,
            }
        }
    ];
    if(Object.keys(service.settings).length > 0) {
        tasks.push({
            type: lib.operations.SETTINGS,
            parameters: {
                service: service.name,
                serviceType: service.type,
                settings: service.settings
            }
        });
    }
    if(Object.keys(service.preferences).length > 0) {
        tasks.push({
            type: lib.operations.PREFERENCES,
            parameters: {
                service: service.name,
                serviceType: service.type,
                preferences: service.preferences
            }
        });
    }
    if(startup) {
        tasks.push({
            type: lib.operations.START,
            parameters: {
                service: service.name,
                serviceType: service.type,
            }
        });
    }
    return tasks;
}

/**
 * @typedef {Object} NodeTaskList
 * @property {Node} nodeConfig
 * @property {Array.<Task>} serviceTasks
 */

/**
 * Creates a list of tasks to perform
 * @param {DomainDeliveryTree} deliveryTree - The description of what to do
 * @param {Array.<NodeConfig>} nodes - Configurations of used nodes
 * @return {Array.<NodeTaskList>}
 */
function transformToTaskList(deliveryTree, nodes) {
    return Object.keys(deliveryTree).map(n => {
        const nodeConfig = nodes.find(node => node.name === n);
        return /** @type NodeTaskList */ {
            nodeConfig: {
                name: nodeConfig.name,
                location: nodeConfig.location,
                user: nodeConfig.user,
                password: nodeConfig.password
            },
            serviceTasks: Object.keys(deliveryTree[n]).map(s => {
                return transformServiceToTaskGroup(deliveryTree[n][s]);
            })
        };
    });
}

module.exports.readDefinitions = readDefinitions;
module.exports.readFiles = readFiles;
module.exports.selectNodesByLabel = selectNodesByLabel;
module.exports.calculateSettingValueScore = calculateValueScore;
module.exports.selectBestValue = selectBestValue;
module.exports.selectServiceSettings = selectGuardedValues;
module.exports.createServiceDeliveryTree = createServiceDeliveryTree;
module.exports.createNodeDeliveryTree = createNodeDeliveryTree;
module.exports.createSolutionDeliveryTree = createSolutionDeliveryTree;
module.exports.createDomainDeliveryTree = createDomainDeliveryTree;
module.exports.createDeliveryTree = createDeliveryTree;
module.exports.mergeDomainDeliveryTree = mergeDomainDeliveryTree;
module.exports.computeFilteredList = computeFilteredList;
module.exports.computeSolutionList = computeSolutionList;
module.exports.computeDomainNodeList = computeDomainNodeList;
module.exports.createServicesFilter = createServicesFilter;
module.exports.filterDomainDeliveryTree = filterDomainDeliveryTree;
module.exports.filterDeliveryTree = filterDeliveryTree;
module.exports.transformServiceToTaskGroup = transformServiceToTaskGroup;
module.exports.transformToTaskList = transformToTaskList;
module.exports.defaultDeploymentOptions = defaultDeploymentOptions;
