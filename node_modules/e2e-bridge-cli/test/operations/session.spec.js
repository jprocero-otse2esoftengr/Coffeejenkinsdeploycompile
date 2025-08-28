'use strict';

const main = require('../../main');
const Bridge = require('e2e-bridge-lib');
const TestIOInterface = require('./TestIOInterface');
const c = require('./common');

describe('service session commands', function() {
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

    it('can list xUML service sessions', async function() {
        let listSessionsSpy = spyOn(Bridge.prototype, 'listXUMLServiceSessions')
            .and
            .callFake(function(service, callback) {
                return callback();
            });

        const {errors, settings} =
            main.createSettings('sessions', namedArgs, ['service-name']);
        expect(errors).toEqual([]);

        await main.main(settings, ioInterface);
        c.didSayWorking(ioInterface);
        c.didCreateInstance(bridgeCreate, settings);
        c.verifyLibCall(listSessionsSpy, bridgeInstance, settings.service);
    });

    it('can cancel an xUML service session', async function() {
        let cancelSessionsSpy = spyOn(Bridge.prototype, 'cancelXUMLServiceSession')
            .and
            .callFake(function(service, session, callback) {
                return callback();
            });

        const {errors, settings} =
            main.createSettings('cancel-session', namedArgs, ['service-name', 'session-id']);
        expect(errors).toEqual([]);

        await main.main(settings, ioInterface);
        c.didSayWorking(ioInterface);
        c.didCreateInstance(bridgeCreate, settings);
        c.verifyLibCall(cancelSessionsSpy, bridgeInstance, 'service-name', 'session-id');
    });
});
