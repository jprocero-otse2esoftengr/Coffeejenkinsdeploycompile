const lib = require('../lib/lib');
const bridge = require('e2e-bridge-lib');

const optionNames = bridge.deploymentOptions;

describe("Deployment options", function() {

    it("returns default for empty input", function() {
        const options = lib.gatherDeploymentOptions();
        expect(options.options).toEqual(bridge.defaultDeploymentOptions);
        expect(options.error).toBeFalsy();
    });

    it("understands 'startup' option", function() {
        expect(lib.gatherDeploymentOptions([optionNames.STARTUP]).options.startup).toEqual(true);
    });

    it("understands 'overwrite' option", function() {
        expect(lib.gatherDeploymentOptions([optionNames.OVERWRITE]).options.overwrite).toEqual(true);
    });

    it("understands 'overwritePrefs' option", function() {
        expect(lib.gatherDeploymentOptions([optionNames.SETTINGS]).options.overwritePrefs).toEqual(true);
    });

    it("understands 'runScripts' option", function() {
        const options = lib.gatherDeploymentOptions([optionNames.NPM_SCRIPTS]).options;
        expect(options.runScripts).toEqual(true);
        expect(options.npmInstall).toEqual(true);
    });

    it("understands 'npmInstall' option", function() {
        expect(lib.gatherDeploymentOptions([optionNames.NPM_INSTALL]).options.npmInstall).toEqual(true);
    });

    it("understands 'instanceName' option", function() {
        expect(lib.gatherDeploymentOptions([optionNames.INSTANCE_NAME + '=gugus']).options.instanceName).toEqual('gugus');
    });

    it("understands 'preserveNodeModules' option", function() {
        const options = lib.gatherDeploymentOptions([optionNames.PRESERVE_NODE_MODULES]).options;
        expect(options.preserveNodeModules).toEqual(true);
    });

    it("understands 'stopTimeout' option", function() {
        expect(lib.gatherDeploymentOptions([optionNames.STOP_TIMEOUT + '=15']).options.stopTimeout).toEqual(15);
    });

    it("understands 'allowKill' option", function() {
        const options = lib.gatherDeploymentOptions([optionNames.ALLOW_KILL]).options;
        expect(options.allowKill).toEqual(true);
    });

    it("reports unknown option", function() {
        const error = lib.gatherDeploymentOptions(['gugus']).error;
        expect(error).toEqual({
            level: 'error',
            message: 'Unknown option "gugus".'
        });
    });
});
