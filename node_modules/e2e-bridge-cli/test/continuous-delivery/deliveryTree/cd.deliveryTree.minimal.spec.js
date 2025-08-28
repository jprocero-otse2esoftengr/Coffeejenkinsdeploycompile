const cd = require('../../../lib/continuous-delivery');
const path = require('path');

const projectDir = path.resolve(__dirname, '../data/projects/minimal');

const configuration = require(projectDir + '/configuration.reference');
const deliveryTree = require(projectDir + '/deliveryTree.reference');

describe('Continuous delivery', function() {
    it('reads minimal configuration correctly', function(done) {
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

    it('transforms minimal configuration to delivery tree correctly', function() {
        const errors = [];
        const tree = cd.createDeliveryTree(configuration.domains, configuration.nodes,
            configuration.solutions, configuration.services, errors);
        expect(tree).toEqual(deliveryTree);
        expect(errors).toEqual([]);
    });
});
