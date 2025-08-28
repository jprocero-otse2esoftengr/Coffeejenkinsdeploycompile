const lib = require('../lib/lib');

describe("Service preferences", function() {

    it("does nothing for too short input", function() {
        expect(lib.gatherPreferences(['pref', 'x'])).toBeUndefined();
    });

    it("understands single string preference", function() {
        expect(lib.gatherPreferences(['pref', 'x', 'y'])).toEqual({x: 'y'});
    });

    it("understands single boolean preference", function() {
        expect(lib.gatherPreferences(['pref', 'x', 'true'])).toEqual({x: true});
    });

    it("understands many preferences", function() {
        expect(lib.gatherPreferences([
            'pref', 'x', 'y',
            'pref', 'z', 'abrakadabra',
            'pref', 'b', 'true',
            'pref', 'c', 'false',
        ])).toEqual({x: 'y', z: 'abrakadabra', b: true, c: false});
    });

    it("skips garbage", function() {
        expect(lib.gatherPreferences([
            'nothing',
            'pref', 'x', 'y',
            'garbage', 'z', 'abrakadabra',
            'pref', 'b', 'c',
        ])).toEqual({x: 'y', b: 'c'});
    });
});
