'use strict';

const main = require('../../main');
const Bridge = require('e2e-bridge-lib');
const TestIOInterface = require('./TestIOInterface');
const c = require('./common');

describe('service management commands', function() {
    const namedArgs = {
        operation: '',
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

    describe('"deploy" command', function() {

        const localArgs = Object.assign({}, namedArgs, {
            options: ['startup', 'overwrite']
        });

        it('can deploy a repository', async function() {
            let deploySpy = spyOn(Bridge.prototype, 'deployService')
                .and
                .callFake(function(file, options, callback) {
                    return callback();
                });

            const {errors, settings} =
                main.createSettings('deploy', localArgs, ['/data/Service.rep']);
            expect(errors).toEqual([]);

            await main.main(settings, ioInterface);
            c.didSayWorking(ioInterface);
            c.didCreateInstance(bridgeCreate, settings);
            c.verifyLibCall(deploySpy, bridgeInstance, settings.file, settings.options);
        });

        it('handles errors gracefully', async function() {
            const errorObj = {
                errorType: "Bridge error",
                error: {
                    message: "Instance 'Service' exists!",
                    status: "500"
                }
            };

            let deploySpy = spyOn(Bridge.prototype, 'deployService')
                .and
                .callFake(function(file, options, callback) {
                    return callback(errorObj);
                });

            const {errors, settings} =
                main.createSettings('deploy', localArgs, ['/data/Service.rep']);
            expect(errors).toEqual([]);

            let exception = null;
            try {
                await main.main(settings, ioInterface);
            } catch(e) {
                exception = e;
            }

            c.didSayWorking(ioInterface);
            expect(exception).toEqual(errorObj);
            c.didCreateInstance(bridgeCreate, settings);
            c.verifyLibCall(deploySpy, bridgeInstance, settings.file);
        });

        it('asks for password', async function() {
            let deploySpy = spyOn(Bridge.prototype, 'deployService')
                .and
                .callFake(function(file, options, callback) {
                    return callback();
                });

            const {errors, settings} =
                main.createSettings('deploy', localArgs, ['/data/Service.rep']);
            expect(errors).toEqual([]);
            delete settings['user'];
            delete settings['password'];

            await main.main(settings, ioInterface);
            c.didSayWorking(ioInterface);

            expect(bridgeCreate)
                .toHaveBeenCalledWith(settings.protocol, settings.host, settings.port, 'admin', 'secret');

            c.verifyLibCall(deploySpy, bridgeInstance, settings.file, settings.options);
        });

        it('complains about unknown options', async function() {
            const badArgs = Object.assign({}, namedArgs, {
                options: ['startup', 'gugus']
            });

            const {errors, settings} =
                main.createSettings('deploy', badArgs, ['/data/Service.rep']);
            expect(errors).toEqual([{level: "error", message: "Unknown option \"gugus\"."}]);
        });
    });

    describe('"remove" command', function() {

        const {errors, settings} = main.createSettings('remove', namedArgs, ['SomeService']);
        let removeSpy;

        beforeEach(function() {
            expect(errors).toEqual([]);
            removeSpy = spyOn(Bridge.prototype, 'removeService')
                .and
                .callFake(function(service, serviceType, callback) {
                    return callback();
                });
        });

        it('can remove an xUML service', async function() {
            await main.main(settings, ioInterface);
            c.didSayWorking(ioInterface);
            c.didCreateInstance(bridgeCreate, settings);
            c.verifyLibCall(removeSpy, bridgeInstance, settings.service, 'xUML');
        });

        it('can remove a Node.js service', async function() {
            await main.main(Object.assign({}, settings, {nodejs: true}), ioInterface);
            c.didSayWorking(ioInterface);
            c.didCreateInstance(bridgeCreate, settings);
            c.verifyLibCall(removeSpy, bridgeInstance, settings.service, 'node');
        });

        it('can remove a java service', async function() {
            await main.main(Object.assign({}, settings, {java: true}), ioInterface);
            c.didSayWorking(ioInterface);
            c.didCreateInstance(bridgeCreate, settings);
            c.verifyLibCall(removeSpy, bridgeInstance, settings.service, 'java');
        });
    });

    describe('"info" command', function() {
        const {errors, settings} = main.createSettings('info', namedArgs, ['SomeService']);
        let getServiceInfoSpy;

        beforeEach(function() {
            expect(errors).toEqual([]);
            getServiceInfoSpy = spyOn(Bridge.prototype, 'getXUMLServiceInfo')
                .and
                .callFake(function(service, callback) {
                    return callback();
                });
        });

        it('can retrieve xUML service info', async function() {
            await main.main(settings, ioInterface);
            c.didSayWorking(ioInterface);
            c.didCreateInstance(bridgeCreate, settings);
            c.verifyLibCall(getServiceInfoSpy, bridgeInstance, settings.service);
        });
    });

    describe('"services" command', function() {

        it('can list xUML services', async function() {
            const {errors, settings} = main.createSettings('services', namedArgs, []);
            expect(errors).toEqual([]);
            let servicesSpy = c.makeTrivialSpy('listXUMLServices', 1);

            await main.main(settings, ioInterface);
            c.didSayWorking(ioInterface);
            c.didCreateInstance(bridgeCreate, settings);
            c.verifyLibCall(servicesSpy, bridgeInstance);
        });

        it('can list Node.js services', async function() {
            const {errors, settings} =
                main.createSettings('services', c.withNodeSwitch(namedArgs), []);
            expect(errors).toEqual([]);
            let servicesSpy = c.makeTrivialSpy('listNodeServices', 1);

            await main.main(Object.assign({}, settings, {nodejs: true}), ioInterface);
            c.didSayWorking(ioInterface);
            c.didCreateInstance(bridgeCreate, settings);
            c.verifyLibCall(servicesSpy, bridgeInstance);
        });

        it('can list java services', async function() {
            const {errors, settings} =
                main.createSettings('services', c.withJavaSwitch(namedArgs), []);
            expect(errors).toEqual([]);
            let servicesSpy = c.makeTrivialSpy('listJavaServices', 1);

            await main.main(Object.assign({}, settings, {java: true}), ioInterface);
            c.didSayWorking(ioInterface);
            c.didCreateInstance(bridgeCreate, settings);
            c.verifyLibCall(servicesSpy, bridgeInstance);
        });

        it('complains if Node.js and java switch used together', async function() {
            const {errors, settings} =
                main.createSettings('services', c.withNodeSwitch(c.withJavaSwitch(namedArgs)), []);
            expect(errors).toEqual([{
                level: "error",
                message: "Only one type switch is allowed. Pick one of --nodejs, or --java."
            }]);
        });

        it('complains if port is weird', async function() {
            const {errors, settings} =
                main.createSettings('services', Object.assign({}, namedArgs, {port: 'gugus'}), []);
            expect(errors).toEqual([{
                level: "error",
                message: "Port has to be an integer number."
            }]);
        });
    });
});

