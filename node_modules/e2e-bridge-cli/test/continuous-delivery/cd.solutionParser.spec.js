const s = require('../../lib/continuous-delivery/solution');

describe("Continuous delivery", function() {
    describe("solution parser", function() {
        describe("normalization", function() {
            it('rejects empty list', function() {
                expect(() => s.normalizeServicesValue([]))
                    .toThrowError('No services defined in solution.');
            });
        });
    });
});
