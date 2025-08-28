const lib = require('../lib/lib');
const bridge = require('e2e-bridge-lib');

const optionNames = bridge.stopOptions;

describe("Stop options", function() {

    it("returns default for empty input", function() {
        const options = lib.gatherStopOptions();
        expect(options.options).toEqual(bridge.defaultStopOptions);
        expect(options.error).toBeFalsy();
    });

    it("understands 'stopTimeout' option", function() {
        expect(lib.gatherStopOptions([optionNames.STOP_TIMEOUT + '=15']).options.stopTimeout).toEqual(15);
    });

    it("reports unknown option", function() {
        const error = lib.gatherStopOptions(['gugus']).error;
        expect(error).toEqual({
            level: 'error',
            message: 'Unknown option "gugus".'
        });
    });
});
