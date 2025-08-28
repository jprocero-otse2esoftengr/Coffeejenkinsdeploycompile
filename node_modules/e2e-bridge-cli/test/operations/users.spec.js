'use strict';

const main = require('../../main');
const Bridge = require('e2e-bridge-lib');
const TestIOInterface = require('./TestIOInterface');
const c = require('./common');

describe('user commands', function() {
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

    it('can list users', async function() {
        let operationSpy = c.makeTrivialSpy('listUsers', 1);

        const {errors, settings} =
            main.createSettings('users', namedArgs, []);
        expect(errors).toEqual([]);

        await main.main(settings, ioInterface);
        c.didSayWorking(ioInterface);
        c.didCreateInstance(bridgeCreate, settings);
        c.verifyLibCall(operationSpy, bridgeInstance);
    });

    it('can retrieve user', async function() {
        let operationSpy = c.makeTrivialSpy('getUser', 2);
        const id = 'gugus';

        const {errors, settings} =
            main.createSettings('users', namedArgs, [id]);
        expect(errors).toEqual([]);

        await main.main(settings, ioInterface);
        c.didSayWorking(ioInterface);
        c.didCreateInstance(bridgeCreate, settings);
        c.verifyLibCall(operationSpy, bridgeInstance, id);
    });

    it('can remove user', async function() {
        let operationSpy = c.makeTrivialSpy('removeUser', 2);
        const id = 'gugus';
        const args = {...namedArgs, 'delete': true};

        const {errors, settings} =
            main.createSettings('users', args, [id]);
        expect(errors).toEqual([]);

        await main.main(settings, ioInterface);
        c.didSayWorking(ioInterface);
        c.didCreateInstance(bridgeCreate, settings);
        c.verifyLibCall(operationSpy, bridgeInstance);
    });

    it('can create user', async function() {
        let operationSpy = c.makeTrivialSpy('createUser', 2);
        const id = 'gugus';
        const gugus = {name: 'Gugus', active: true, group: 'admin'};
        const args = {...namedArgs, ...gugus, 'user-password': 'something'};

        const {errors, settings} =
            main.createSettings('users', args, [id]);
        expect(errors).toEqual([]);

        await main.main(settings, ioInterface);
        c.didSayWorking(ioInterface);
        c.didCreateInstance(bridgeCreate, settings);
        c.verifyLibCall(operationSpy, bridgeInstance, {id, ...gugus, password: 'something'});
    });

    it('can modify user', async function() {
        let operationSpy = c.makeTrivialSpy('modifyUser', 2);
        const id = 'gugus';
        const gugus = {name: 'Not a Gugus', group: undefined, password: undefined, active: false};
        const args = {...namedArgs, ...gugus, modify: true};

        const {errors, settings} =
            main.createSettings('users', args, [id]);
        expect(errors).toEqual([]);

        await main.main(settings, ioInterface);
        c.didSayWorking(ioInterface);
        c.didCreateInstance(bridgeCreate, settings);
        c.verifyLibCall(operationSpy, bridgeInstance, {id, ...gugus});
    });
});
