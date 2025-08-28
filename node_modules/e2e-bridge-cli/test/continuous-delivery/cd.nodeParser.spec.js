const n = require('../../lib/continuous-delivery/node');

describe("Continuous delivery", function() {
    describe("node parser", function() {
        describe("normalization", function() {
            it('rejects empty location', function() {
                expect(() => n.checkLocation(''))
                    .toThrowError('Missing \'location\' field.');
            });
        });
    });
});
