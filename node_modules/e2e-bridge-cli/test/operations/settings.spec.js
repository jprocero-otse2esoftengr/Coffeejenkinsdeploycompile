'use strict';

const main = require('../../main');
const Bridge = require('e2e-bridge-lib');
const TestIOInterface = require('./TestIOInterface');
const c = require('./common');
const fs = require('fs');

describe('setting-related commands', function() {
    const namedArgs = {
        host: 'localhost',
        port: 8080,
        user: 'usr',
        password: 'pw'
    };

    let ioInterface;

    let bridgeCreate;
    const bridgeInstance =
        new Bridge(namedArgs.protocol, namedArgs.host, namedArgs.port, namedArgs.user, namedArgs.password);

    beforeEach(function() {
        ioInterface = new TestIOInterface();

        bridgeCreate = spyOn(Bridge, 'createInstance')
            .and
            .returnValue(bridgeInstance);
    });

    describe('"variables" command', function() {
        it('can list variables', async function() {
            const {errors, settings} = main.createSettings('variables', namedArgs, []);
            expect(errors).toEqual([]);

            let listVariablesSpy = spyOn(Bridge.prototype, 'listXUMLVariables')
                .and
                .callFake(function(callback) {
                    return callback();
                });

            await main.main(settings, ioInterface);
            c.didSayWorking(ioInterface);
            c.didCreateInstance(bridgeCreate, settings);
            c.verifyLibCall(listVariablesSpy, bridgeInstance);
        });
    });

    describe('"settings" command', function() {
        describe('for xUML service', function() {
            it('can list settings', async function() {
                let listSpy = spyOn(Bridge.prototype, 'getServiceSettings')
                    .and
                    .callFake(function(service, type, callback) {
                        return callback();
                    });

                const {errors, settings} =
                    main.createSettings('settings', namedArgs, ['SomeService']);
                expect(errors).toEqual([]);

                await main.main(settings, ioInterface);
                c.didSayWorking(ioInterface);
                c.didCreateInstance(bridgeCreate, settings);
                c.verifyLibCall(listSpy, bridgeInstance, 'SomeService', 'xUML');
            });

            it('can set settings', async function() {
                let setSpy = spyOn(Bridge.prototype, 'setServiceSettings')
                    .and
                    .callFake(function(service, type, changedSettings, callback) {
                        return callback();
                    });

                const {errors, settings} = main.createSettings('settings', namedArgs, [
                    'SomeService',
                    'set', 'aaa', 'bbb',
                    'set', 'gugus', 'Morra'
                ]);
                expect(errors).toEqual([]);

                await main.main(settings, ioInterface);
                c.didSayWorking(ioInterface);
                c.didCreateInstance(bridgeCreate, settings);
                c.verifyLibCall(setSpy, bridgeInstance, 'SomeService', 'xUML', {
                    aaa: 'bbb',
                    gugus: 'Morra'
                });
            });

            it('cannot upload settings', async function() {
                const {errors, settings} = main.createSettings(
                    'settings',
                    Object.assign({}, namedArgs, {upload: true}),
                    ['SomeService', '/tmp/settings.json']
                );
                expect(errors).toEqual([{
                    level: "error",
                    message: "Only Node.js settings can be uploaded from a JSON file"
                }]);
            });
        });

        describe('for Node.js service', function() {

            const nodeArgs = Object.assign({}, namedArgs, {nodejs: true});

            it('can list settings', async function() {
                let listSpy = spyOn(Bridge.prototype, 'getServiceSettings')
                    .and
                    .callFake(function(service, type, callback) {
                        return callback();
                    });

                const {errors, settings} =
                    main.createSettings('settings', nodeArgs, ['SomeService']);
                expect(errors).toEqual([]);

                await main.main(settings, ioInterface);
                c.didSayWorking(ioInterface);
                c.didCreateInstance(bridgeCreate, settings);
                c.verifyLibCall(listSpy, bridgeInstance, 'SomeService', 'node');
            });

            it('can set settings', async function() {
                let setSpy = spyOn(Bridge.prototype, 'setServiceSettings')
                    .and
                    .callFake(function(service, type, changedSettings, callback) {
                        return callback();
                    });

                const {errors, settings} = main.createSettings('settings', nodeArgs, [
                    'SomeService',
                    'set', 'aaa', 'bbb',
                    'set', 'What', 'does the fox say'
                ]);
                expect(errors).toEqual([]);

                await main.main(settings, ioInterface);
                c.didSayWorking(ioInterface);
                c.didCreateInstance(bridgeCreate, settings);
                c.verifyLibCall(setSpy, bridgeInstance, 'SomeService', 'node', {
                    aaa: 'bbb',
                    What: 'does the fox say'
                });
            });

            it('can upload settings', async function() {
                let setSpy = spyOn(Bridge.prototype, 'setServiceSettings')
                    .and
                    .callFake(function(service, type, changedSettings, callback) {
                        return callback();
                    });

                const changedSettings = {
                    aaa: 'bbb',
                    What: 'does the fox say'
                };

                let fsReadFileSyncSpy = spyOn(fs, 'readFileSync')
                    .and
                    .returnValue(JSON.stringify(changedSettings));

                const {errors, settings} = main.createSettings(
                    'settings',
                    Object.assign({}, nodeArgs, {upload: true}),
                    ['SomeService', '/tmp/settings.json']
                );
                expect(errors).toEqual([]);

                await main.main(settings, ioInterface);
                c.didSayWorking(ioInterface);
                c.didCreateInstance(bridgeCreate, settings);
                expect(fsReadFileSyncSpy)
                    .toHaveBeenCalledWith('/tmp/settings.json', {encoding: 'utf-8'});
                c.verifyLibCall(setSpy, bridgeInstance, 'SomeService', 'node', changedSettings);
            });
        });
    });

    describe('"preferences" command', function() {
        describe('for xUML service', function() {
            it('can list preferences', async function() {
                let listSpy = spyOn(Bridge.prototype, 'getServicePreferences')
                    .and
                    .callFake(function(service, type, callback) {
                        return callback();
                    });

                const {errors, settings} =
                    main.createSettings('preferences', namedArgs, ['SomeService']);
                expect(errors).toEqual([]);

                await main.main(settings, ioInterface);
                c.didSayWorking(ioInterface);
                c.didCreateInstance(bridgeCreate, settings);
                c.verifyLibCall(listSpy, bridgeInstance, 'SomeService', 'xUML');
            });

            it('can set preferences', async function() {
                let setSpy = spyOn(Bridge.prototype, 'setServicePreferences')
                    .and
                    .callFake(function(service, type, changedPreferences, callback) {
                        return callback();
                    });

                const {errors, settings} = main.createSettings('preferences', namedArgs, [
                    'SomeService',
                    'pref', 'automaticStartup', 'true',
                    'pref', 'bridgeServerLogLevel', 'Info'
                ]);
                expect(errors).toEqual([]);

                await main.main(settings, ioInterface);
                c.didSayWorking(ioInterface);
                c.didCreateInstance(bridgeCreate, settings);
                c.verifyLibCall(setSpy, bridgeInstance, settings.service, 'xUML', {
                    automaticStartup: true,
                    bridgeServerLogLevel: "Info"
                });
            });
        });

        describe('for Node.js service', function() {
            it('can list preferences', async function() {
                let listSpy = spyOn(Bridge.prototype, 'getServicePreferences')
                    .and
                    .callFake(function(service, type, callback) {
                        return callback();
                    });

                const {errors, settings} =
                    main.createSettings('preferences', c.withNodeSwitch(namedArgs), ['SomeService']);
                expect(errors).toEqual([]);

                await main.main(settings, ioInterface);
                c.didSayWorking(ioInterface);
                c.didCreateInstance(bridgeCreate, settings);
                c.verifyLibCall(listSpy, bridgeInstance, 'SomeService', 'node');
            });

            it('can set preferences', async function() {
                let setSpy = spyOn(Bridge.prototype, 'setServicePreferences')
                    .and
                    .callFake(function(service, type, changedPreferences, callback) {
                        return callback();
                    });

                const {errors, settings} = main.createSettings(
                    'preferences',
                    c.withNodeSwitch(namedArgs),
                    [
                        'SomeService',
                        'pref', 'automaticStartup', 'true',
                        'pref', 'bridgeServerLogLevel', 'Debug'
                    ]
                );
                expect(errors).toEqual([]);

                await main.main(settings, ioInterface);
                c.didSayWorking(ioInterface);
                c.didCreateInstance(bridgeCreate, settings);
                c.verifyLibCall(setSpy, bridgeInstance, 'SomeService', 'node', {
                    automaticStartup: true,
                    bridgeServerLogLevel: "Debug"
                });
            });
        });

        describe('for java service', function() {
            it('can list preferences', async function() {
                let listSpy = spyOn(Bridge.prototype, 'getServicePreferences')
                    .and
                    .callFake(function(service, type, callback) {
                        return callback();
                    });

                const {errors, settings} =
                    main.createSettings('preferences', c.withJavaSwitch(namedArgs), ['SomeService']);
                expect(errors).toEqual([]);

                await main.main(settings, ioInterface);
                c.didSayWorking(ioInterface);
                c.didCreateInstance(bridgeCreate, settings);
                c.verifyLibCall(listSpy, bridgeInstance, 'SomeService', 'java');
            });

            it('can set preferences', async function() {
                let setSpy = spyOn(Bridge.prototype, 'setServicePreferences')
                    .and
                    .callFake(function(service, type, changedPreferences, callback) {
                        return callback();
                    });

                const {errors, settings} = main.createSettings(
                    'preferences',
                    c.withJavaSwitch(namedArgs),
                    [
                        'SomeService',
                        'pref', 'automaticStartup', 'true',
                        'pref', 'bridgeServerLogLevel', 'Error'
                    ]
                );
                expect(errors).toEqual([]);

                await main.main(settings, ioInterface);
                c.didSayWorking(ioInterface);
                c.didCreateInstance(bridgeCreate, settings);
                c.verifyLibCall(setSpy, bridgeInstance, 'SomeService', 'java', {
                    automaticStartup: true,
                    bridgeServerLogLevel: "Error"
                });
            });
        });
    });
});
