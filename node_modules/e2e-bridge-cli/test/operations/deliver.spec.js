'use strict';

const main = require('../../main');
const Bridge = require('e2e-bridge-lib');
const TestIOInterface = require('./TestIOInterface');
const c = require('./common');
const path = require('path');
const cd = require('../../lib/continuous-delivery');

describe('"deliver" command', function() {

    let ioInterface;

    let bridgeCreate;
    const bridgeInstance =
        new Bridge('https', 'localhost', 8080, 'local_user', 'local_pw');

    beforeEach(function() {
        ioInterface = new TestIOInterface();

        bridgeCreate = spyOn(Bridge, 'createInstance')
            .and
            .returnValue(bridgeInstance);
    });

    it('delivers on single node', async function() {

        const projectPath = path.resolve(__dirname, '../continuous-delivery/data/projects/tick_tok');
        const tickerRepository = path.resolve(projectPath, 'repositories/Ticker/Ticker.rep');
        const receiverRepository = path.resolve(projectPath, 'repositories/Ticker/Receiver.zip');

        let {errors: settingErrors, settings} = main.createSettings(
            'deliver',
            {domain: 'local'},
            [projectPath]);

        expect(settingErrors).toEqual([]);

        let deploySpy = c.makeTrivialSpy('deployService', 3);
        let setSettingsSpy = c.makeTrivialSpy('setServiceSettings', 4);
        let setPreferencesSpy = c.makeTrivialSpy('setServicePreferences', 4);
        let setStatusSpy = c.makeTrivialSpy('setServiceStatus', 4);

        await main.main(settings, ioInterface);
        expect(ioInterface.stdout).toContain('Reading configuration.\n');
        expect(ioInterface.stdout).toContain('Working, please wait.\n');
        expect(bridgeCreate)
            .toHaveBeenCalledWith('https', 'localhost', 8080, 'local_user', 'local_pw');

        // deployment
        const deploymentOptions = Object.assign({}, cd.defaultDeploymentOptions, {startup: false});
        expect(deploySpy).toHaveBeenCalledTimes(2);
        expect(deploySpy).toHaveBeenCalledWith(
            tickerRepository, deploymentOptions, jasmine.any(Function));
        expect(deploySpy).toHaveBeenCalledWith(
            receiverRepository, deploymentOptions, jasmine.any(Function));

        // settings
        const receiverSettings = {
            apiAlias: {
                Location: {
                    host: "${server_hostname}",
                    port: 1234
                }
            }
        };
        expect(setSettingsSpy).toHaveBeenCalledTimes(1);
        expect(setSettingsSpy).toHaveBeenCalledWith(
            'Receiver', 'node', receiverSettings, jasmine.any(Function));

        // preferences
        const tickerPreferences = {
            automaticStartup: true
        };
        expect(setPreferencesSpy).toHaveBeenCalledTimes(1);
        expect(setPreferencesSpy).toHaveBeenCalledWith(
            'Ticker', 'xUML', tickerPreferences, jasmine.any(Function));

        // startup
        expect(setStatusSpy).toHaveBeenCalledTimes(2);
        expect(setStatusSpy).toHaveBeenCalledWith('start', 'Ticker', 'xUML', jasmine.any(Function));
        expect(setStatusSpy).toHaveBeenCalledWith('start', 'Receiver', 'node', jasmine.any(Function));
    });

    it('requires "--domain" parameter', async function() {
        const projectPath = path.resolve(__dirname, '../continuous-delivery/data/projects/tick_tok');

        let {errors: settingErrors, settings} = main.createSettings(
            'deliver',
            [projectPath]);

        expect(settingErrors).toEqual([{
            level: "error",
            message: "Required argument 'domain' is missing"
        }]);
    });

    it('can perform a dry run', async function() {
        const projectPath = path.resolve(__dirname, '../continuous-delivery/data/projects/tick_tok');

        let {errors: settingErrors, settings} = main.createSettings(
            'deliver',
            {domain: 'local', 'dry-run': true},
            [projectPath]);

        expect(settingErrors).toEqual([]);

        await main.main(settings, ioInterface);
        expect(ioInterface.stdout).toContain('Reading configuration.\n');
        expect(bridgeCreate)
            .toHaveBeenCalledWith('https', 'localhost', 8080, 'local_user', 'local_pw');

        expect(ioInterface.stdout.match(/on .*localhost.* would run task\n/gm).length).toEqual(6);
    });
});
