const lib = require('../lib/lib');

describe("Service settings", function() {

    it("does nothing for too short input", function() {
        expect(lib.gatherSettings(['set', 'x'], {})).toBeUndefined();
    });

    it("understands single setting", function() {
        expect(lib.gatherSettings(['set', 'x', 'y'], {})).toEqual({x: 'y'});
    });

    it("understands many settings", function() {
        expect(lib.gatherSettings([
            'set', 'x', 'y',
            'set', 'z', 'abrakadabra',
            'set', 'b', 'c',
        ], {})).toEqual({x: 'y', z: 'abrakadabra', b: 'c'});
    });

    it("skips garbage", function() {
        expect(lib.gatherSettings([
            'nothing',
            'set', 'x', 'y',
            'garbage', 'z', 'abrakadabra',
            'set', 'b', 'c',
        ], {})).toEqual({x: 'y', b: 'c'});
    });

    describe('for Node.js', function() {

        function gatherSettings(args) {
            return lib.gatherSettings(args, {nodejs: true});
        }

        describe('converts setting type', function() {
            it("to boolean true", function() {
                expect(gatherSettings(['set', 'x', 'true'])).toEqual({x: true});
            });

            it("to boolean false", function() {
                expect(gatherSettings(['set', 'x', 'false'])).toEqual({x: false});
            });

            it("to integer", function() {
                expect(gatherSettings(['set', 'x', '125'])).toEqual({x: 125});
            });

            it("to double", function() {
                expect(gatherSettings(['set', 'x', '125.125'])).toEqual({x: 125.125});
            });
        });

        it('resolves setting paths', function() {
            expect(gatherSettings([
                'set', 'x', 'x',
                'set', 'y.z.a', 'b',
                'set', 'y.z.b[1]', 'c'
            ])).toEqual({
                x: 'x',
                y: {
                    z: {
                        a: 'b',
                        b: [undefined, 'c']
                    }
                }
            });
        });
    });
});
