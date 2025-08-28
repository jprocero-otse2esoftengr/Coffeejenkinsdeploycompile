'use strict';

const main = require('../../main');
const Bridge = require('e2e-bridge-lib');
const TestIOInterface = require('./TestIOInterface');
const c = require('./common');

describe('user groups commands', function() {
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

    it('can list user groups', async function() {
        let operationSpy = c.makeTrivialSpy('listGroups', 1);

        const {errors, settings} =
            main.createSettings('groups', namedArgs, []);
        expect(errors).toEqual([]);

        await main.main(settings, ioInterface);
        c.didSayWorking(ioInterface);
        c.didCreateInstance(bridgeCreate, settings);
        c.verifyLibCall(operationSpy, bridgeInstance);
    });

    it('can retrieve user group', async function() {
        let operationSpy = c.makeTrivialSpy('getGroup', 2);
        const id = 'gugus';

        const {errors, settings} =
            main.createSettings('groups', namedArgs, [id]);
        expect(errors).toEqual([]);

        await main.main(settings, ioInterface);
        c.didSayWorking(ioInterface);
        c.didCreateInstance(bridgeCreate, settings);
        c.verifyLibCall(operationSpy, bridgeInstance, id);
    });

    it('can remove user group', async function() {
        let operationSpy = c.makeTrivialSpy('removeGroup', 2);
        const id = 'gugus';
        const args = {...namedArgs, 'delete': true};

        const {errors, settings} =
            main.createSettings('groups', args, [id]);
        expect(errors).toEqual([]);

        await main.main(settings, ioInterface);
        c.didSayWorking(ioInterface);
        c.didCreateInstance(bridgeCreate, settings);
        c.verifyLibCall(operationSpy, bridgeInstance);
    });

    it('can create user group', async function() {
        let operationSpy = c.makeTrivialSpy('createGroup', 2);
        const id = 'gugus';
        const args = {...namedArgs, name: 'Gugus', role: 'ADMIN'};

        const {errors, settings} =
            main.createSettings('groups', args, [id]);
        expect(errors).toEqual([]);

        await main.main(settings, ioInterface);
        c.didSayWorking(ioInterface);
        c.didCreateInstance(bridgeCreate, settings);
        c.verifyLibCall(operationSpy, bridgeInstance, {id: 'gugus', name: 'Gugus', role: 'ADMIN'});
    });

    it('can modify user group', async function() {
        let operationSpy = c.makeTrivialSpy('modifyGroup', 2);
        const id = 'gugus';
        const args = {...namedArgs, name: 'Gugus', role: 'ADMIN', modify: true};

        const {errors, settings} =
            main.createSettings('groups', args, [id]);
        expect(errors).toEqual([]);

        await main.main(settings, ioInterface);
        c.didSayWorking(ioInterface);
        c.didCreateInstance(bridgeCreate, settings);
        c.verifyLibCall(operationSpy, bridgeInstance, {id: 'gugus', name: 'Gugus', role: 'ADMIN'});
    });
});
