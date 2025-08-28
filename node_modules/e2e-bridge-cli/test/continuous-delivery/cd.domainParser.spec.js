const d = require('../../lib/continuous-delivery/domain');

describe("Continuous delivery", function() {
    describe("domain parser", function() {
        describe("normalization", function() {
            it('rejects empty node list', function() {
                expect(() => d.normalize({services: 'srv1'}))
                    .toThrowError('no nodes defined');
            });

            it('rejects empty services & solutions list', function() {
                expect(() => d.normalize({nodes: 'node1'}))
                    .toThrowError('no services defined');
            });
        });
    });
});
