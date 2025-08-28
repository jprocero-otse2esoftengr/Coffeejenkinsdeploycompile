const cd = require('../../../lib/continuous-delivery/index');
const path = require('path');

const projectDir = path.resolve(__dirname, '../data/projects/basic');

const configuration = require(projectDir + '/configuration.reference');
const deliveryTree = require(projectDir + '/deliveryTree.reference');

describe('Continuous delivery', function() {
    it('reads configuration correctly', function(done) {
        cd.readDefinitions(projectDir,
            (err, result) => {
                expect(err).toBeFalsy();
                if(result) {
                    const pathBegin = new RegExp(projectDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                    result = JSON.parse(JSON.stringify(result).replace(pathBegin, ''));
                }
                expect(result).toEqual(configuration);
                done();
            });
    });

    it('transforms configuration to delivery tree correctly', function() {
        const errors = [];
        const tree = cd.createDeliveryTree(configuration.domains, configuration.nodes,
            configuration.solutions, configuration.services, errors);
        expect(tree).toEqual(deliveryTree);
        const badNodeError = {
            level: 'error',
            message: "Domain 'production' uses unknown node 'Morra'"
        };
        expect(errors).toEqual([badNodeError]);
    });

    it('can filter by node', function() {
        const errors = [];
        const filtered = cd.filterDeliveryTree(
            'production', ['prod2'], [], [], [], deliveryTree, configuration, errors);

        expect(errors).toEqual([]);
        expect(filtered).toEqual({
            prod2: {
                CollectorService: {
                    name: 'CollectorService',
                    type: 'xUML',
                    repository: '/repositories/CollectorService.rep',
                    settings: {},
                    preferences: {},
                    deploymentOptions: {},
                },
                Worker1Service: {
                    name: 'Worker1Service',
                    type: 'xUML',
                    repository: '/repositories/Worker1Service.rep',
                    settings: {},
                    preferences: {},
                    deploymentOptions: {},
                },
                Worker2Service: {
                    name: 'Worker2Service',
                    type: 'xUML',
                    repository: '/repositories/Worker2Service.rep',
                    settings: {},
                    preferences: {},
                    deploymentOptions: {},
                }
            }
        });
    });

    it('can filter by node and service', function() {
        const errors = [];
        const filtered = cd.filterDeliveryTree(
            'production', ['prod3'], [], [], ['Worker1Service'], deliveryTree, configuration, errors);

        expect(errors).toEqual([]);
        expect(filtered).toEqual({
            prod3: {
                Worker1Service: {
                    name: 'Worker1Service',
                    type: 'xUML',
                    repository: '/repositories/Worker1Service.rep',
                    settings: {},
                    preferences: {},
                    deploymentOptions: {},
                }
            }
        });
    });

    it('can filter by service', function() {
        const errors = [];
        const filtered = cd.filterDeliveryTree(
            'production', [], [], [], ['Worker2Service'], deliveryTree, configuration, errors);

        expect(errors).toEqual([]);
        expect(filtered).toEqual({
            prod2: {
                Worker2Service: {
                    name: 'Worker2Service',
                    type: 'xUML',
                    repository: '/repositories/Worker2Service.rep',
                    settings: {},
                    preferences: {},
                    deploymentOptions: {},
                }
            },
            prod3: {
                Worker2Service: {
                    name: 'Worker2Service',
                    type: 'xUML',
                    repository: '/repositories/Worker2Service.rep',
                    settings: {},
                    preferences: {},
                    deploymentOptions: {},
                }
            }
        });
    });

    it('can filter by solution and label', function() {
        const errors = [];
        const filtered = cd.filterDeliveryTree(
            'production', [], ['slave'], ['solution1'], [], deliveryTree, configuration, errors);

        expect(errors).toEqual([]);
        expect(filtered).toEqual({
            prod2: {
                Worker1Service: {
                    name: 'Worker1Service',
                    type: 'xUML',
                    repository: '/repositories/Worker1Service.rep',
                    settings: {},
                    preferences: {},
                    deploymentOptions: {},
                },
                Worker2Service: {
                    name: 'Worker2Service',
                    type: 'xUML',
                    repository: '/repositories/Worker2Service.rep',
                    settings: {},
                    preferences: {},
                    deploymentOptions: {},
                }
            },
            prod3: {
                Worker1Service: {
                    name: 'Worker1Service',
                    type: 'xUML',
                    repository: '/repositories/Worker1Service.rep',
                    settings: {},
                    preferences: {},
                    deploymentOptions: {},
                },
                Worker2Service: {
                    name: 'Worker2Service',
                    type: 'xUML',
                    repository: '/repositories/Worker2Service.rep',
                    settings: {},
                    preferences: {},
                    deploymentOptions: {},
                }
            }
        });
    });

    it('can filter by service', function() {
        const errors = [];
        const filtered = cd.filterDeliveryTree(
            'production', [], [], [], ['CollectorService'], deliveryTree, configuration, errors);

        expect(errors).toEqual([]);
        expect(filtered).toEqual({
            prod1: {
                CollectorService: {
                    name: 'CollectorService',
                    type: 'xUML',
                    repository: '/repositories/CollectorService.rep',
                    settings: {},
                    preferences: {},
                    deploymentOptions: {},
                }
            },
            prod2: {
                CollectorService: {
                    name: 'CollectorService',
                    type: 'xUML',
                    repository: '/repositories/CollectorService.rep',
                    settings: {},
                    preferences: {},
                    deploymentOptions: {},
                }
            },
            prod3: {
                CollectorService: {
                    name: 'CollectorService',
                    type: 'xUML',
                    repository: '/repositories/CollectorService.rep',
                    settings: {},
                    preferences: {},
                    deploymentOptions: {},
                }
            }
        });
    });

    it('errors when filtering by invalid domain', function() {
        const errors = [];
        const filtered = cd.filterDeliveryTree(
            'gugus', [], [], [], [], deliveryTree, configuration, errors);

        expect(errors).toEqual([{level: 'error', message: "domain 'gugus' is not defined in the configuration"}]);
        expect(filtered).toEqual({});
    });

    it('errors when filtering by invalid node', function() {
        const errors = [];
        const filtered = cd.filterDeliveryTree(
            'production', ['gugus'], [], [], [], deliveryTree, configuration, errors);

        expect(errors).toEqual([{level: 'warn', message: "node 'gugus' is not a part of the 'production' domain"}]);
        expect(filtered).toEqual({});
    });

    it('errors when filtering by invalid solution', function() {
        const errors = [];
        const filtered = cd.filterDeliveryTree(
            'production', [], [], ['gugus'], [], deliveryTree, configuration, errors);

        expect(errors).toEqual([{level: 'warn', message: "solution 'gugus' is not a part of the 'production' domain"}]);
        expect(filtered).toEqual({});
    });

    it('errors when filtering by invalid service', function() {
        const errors = [];
        const filtered = cd.filterDeliveryTree(
            'production', [], [], [], ['gugus'], deliveryTree, configuration, errors);

        expect(errors).toEqual([{level: 'warn', message: "service 'gugus' is not a part of the 'production' domain"}]);
        expect(filtered).toEqual({});
    });
});
