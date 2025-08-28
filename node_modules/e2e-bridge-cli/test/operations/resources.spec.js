'use strict';

const main = require('../../main');
const Bridge = require('e2e-bridge-lib');
const TestIOInterface = require('./TestIOInterface');
const c = require('./common');
const fs = require('fs');

describe('service resource-related commands', function() {
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

    describe('"modelnotes" command', function() {
        it('can list model notes', async function() {
            let modelnotesSpy = c.makeTrivialSpy('getXUMLModelNotesList', 2);
            const {errors, settings} = main.createSettings('modelnotes', namedArgs, ['SomeService']);
            expect(errors).toEqual([]);

            await main.main(settings, ioInterface);
            c.didSayWorking(ioInterface);
            c.didCreateInstance(bridgeCreate, settings);
            c.verifyLibCall(modelnotesSpy, bridgeInstance, 'SomeService');
        });

        it('can retrieve model notes', async function() {
            const content = 'Notes! Notes! Notes!';
            let modelnotesSpy = spyOn(Bridge.prototype, 'getXUMLModelNotes')
                .and
                .callFake(function(service, filename, callback) {
                    return callback(null, content);
                });

            const {errors, settings} = main.createSettings(
                'modelnotes', namedArgs, ['SomeService', 'gugus.txt']);
            expect(errors).toEqual([]);

            const result = await main.main(settings, ioInterface);
            expect(result).toEqual(content);
            c.didSayWorking(ioInterface);
            c.didCreateInstance(bridgeCreate, settings);
            c.verifyLibCall(modelnotesSpy, bridgeInstance, 'SomeService', 'gugus.txt');
        });
    });

    describe('"customnotes" command', function() {

        it('can retrieve custom notes', async function() {
            const content = 'Notes! Notes! Notes!';
            let modelnotesSpy = spyOn(Bridge.prototype, 'getXUMLCustomNotes')
                .and
                .callFake(function(service, callback) {
                    return callback(null, content);
                });

            const {errors, settings} = main.createSettings('customnotes', namedArgs, ['SomeService']);
            expect(errors).toEqual([]);

            const result = await main.main(settings, ioInterface);
            expect(result).toEqual(content);
            c.didSayWorking(ioInterface);
            c.didCreateInstance(bridgeCreate, settings);
            c.verifyLibCall(modelnotesSpy, bridgeInstance, 'SomeService');
        });

        it('can write custom notes to file', async function() {
            const content = 'Notes! Notes! Notes!';
            let modelnotesSpy = spyOn(Bridge.prototype, 'getXUMLCustomNotes')
                .and
                .callFake(function(service, callback) {
                    return callback(null, content);
                });

            let fsWriteFileSpy = spyOn(fs, 'writeFile')
                .and
                .callFake(function(filename, data, callback) {
                    return callback();
                });

            const {errors, settings} = main.createSettings(
                'customnotes',
                namedArgs,
                ['SomeService', '/somewhere/gugus.txt']
            );
            expect(errors).toEqual([]);

            await main.main(settings, ioInterface);
            c.didSayWorking(ioInterface);
            c.didCreateInstance(bridgeCreate, settings);
            c.verifyLibCall(modelnotesSpy, bridgeInstance, 'SomeService');
            c.verifyCall(fsWriteFileSpy, '/somewhere/gugus.txt', content);
        });

        it('can upload custom notes', async function() {
            const content = 'Notes! Notes! Notes!';
            let modelnotesSpy = spyOn(Bridge.prototype, 'setXUMLCustomNotes')
                .and
                .callFake(function(service, data, callback) {
                    return callback();
                });

            const fakeStream = new (require('stream').PassThrough)();
            fakeStream.write(content);
            fakeStream.end();

            let fsCreateReadStreamSpy = spyOn(fs, 'createReadStream')
                .and
                .returnValue(fakeStream);

            const {errors, settings} = main.createSettings(
                'customnotes',
                Object.assign({}, namedArgs, {upload: true}),
                ['SomeService', '/somewhere/gugus.txt']
            );
            expect(errors).toEqual([]);

            await main.main(settings, ioInterface);
            c.didSayWorking(ioInterface);
            c.didCreateInstance(bridgeCreate, settings);
            c.verifyCall(fsCreateReadStreamSpy, '/somewhere/gugus.txt');
            expect(modelnotesSpy.calls.count()).toEqual(1);
            const callData = modelnotesSpy.calls.mostRecent();
            expect(callData.object).toBe(bridgeInstance);
            expect(callData.args[0]).toEqual('SomeService');
            expect(callData.args[1]).toBe(fakeStream);
        });
    });

    describe('"resources" command', function() {
        describe('for xUML resources', function() {
            it('can list', async function() {
                let listSpy = spyOn(Bridge.prototype, 'listXUMLResources')
                    .and
                    .callFake(function(type, callback) {
                        return callback();
                    });

                const {errors, settings} =
                    main.createSettings('resources', namedArgs, ['resource.txt']);
                expect(errors).toEqual([]);

                await main.main(settings, ioInterface);
                c.didSayWorking(ioInterface);
                c.didCreateInstance(bridgeCreate, settings);
                c.verifyLibCall(listSpy, bridgeInstance, 'resource');
            });

            it('can upload', async function() {
                const content = 'Resource content';
                let uploadSpy = spyOn(Bridge.prototype, 'uploadXUMLResources')
                    .and
                    .callFake(function(type, data, callback) {
                        return callback();
                    });

                const fakeStream = new (require('stream').PassThrough)();
                fakeStream.write(content);
                fakeStream.end();

                let fsCreateReadStreamSpy = spyOn(fs, 'createReadStream')
                    .and
                    .returnValue(fakeStream);

                const {errors, settings} = main.createSettings(
                    'resources',
                    Object.assign({}, namedArgs, {upload: true}),
                    ['/somewhere/resource.txt']
                );
                expect(errors).toEqual([]);

                await main.main(settings, ioInterface);
                c.didSayWorking(ioInterface);
                c.didCreateInstance(bridgeCreate, settings);
                c.verifyCall(fsCreateReadStreamSpy, '/somewhere/resource.txt');
                expect(uploadSpy.calls.count()).toEqual(1);
                const callData = uploadSpy.calls.mostRecent();
                expect(callData.object).toBe(bridgeInstance);
                expect(callData.args[0]).toEqual('resource');
                expect(callData.args[1]).toBe(fakeStream);
            });

            it('can delete', async function() {
                let deleteSpy = spyOn(Bridge.prototype, 'deleteXUMLResources')
                    .and
                    .callFake(function(type, name, callback) {
                        return callback();
                    });

                const {errors, settings} = main.createSettings(
                    'resources',
                    Object.assign({}, namedArgs, {delete: true}),
                    ['resource.txt']
                );
                expect(errors).toEqual([]);

                await main.main(settings, ioInterface);
                c.didSayWorking(ioInterface);
                c.didCreateInstance(bridgeCreate, settings);
                c.verifyLibCall(deleteSpy, bridgeInstance, 'resource', 'resource.txt');
            });
        });

        describe('for java resources', function() {

            it('can list', async function() {
                let listSpy = spyOn(Bridge.prototype, 'listXUMLResources')
                    .and
                    .callFake(function(type, callback) {
                        return callback();
                    });

                const {errors, settings} =
                    main.createSettings('java-resources', namedArgs, ['resource.txt']);
                expect(errors).toEqual([]);

                await main.main(settings, ioInterface);
                c.didSayWorking(ioInterface);
                c.didCreateInstance(bridgeCreate, settings);
                c.verifyLibCall(listSpy, bridgeInstance, settings.resourceType);
            });

            it('can upload', async function() {
                const content = 'Resource content';
                let uploadSpy = spyOn(Bridge.prototype, 'uploadXUMLResources')
                    .and
                    .callFake(function(type, data, callback) {
                        return callback();
                    });

                const fakeStream = new (require('stream').PassThrough)();
                fakeStream.write(content);
                fakeStream.end();

                let fsCreateReadStreamSpy = spyOn(fs, 'createReadStream')
                    .and
                    .returnValue(fakeStream);

                const {errors, settings} = main.createSettings(
                    'java-resources',
                    Object.assign({}, namedArgs, {upload: true}),
                    ['/somewhere/resource.txt']
                );
                expect(errors).toEqual([]);

                await main.main(settings, ioInterface);
                c.didSayWorking(ioInterface);
                c.didCreateInstance(bridgeCreate, settings);
                c.verifyCall(fsCreateReadStreamSpy, '/somewhere/resource.txt');
                expect(uploadSpy.calls.count()).toEqual(1);
                const callData = uploadSpy.calls.mostRecent();
                expect(callData.object).toBe(bridgeInstance);
                expect(callData.args[0]).toEqual('java');
                expect(callData.args[1]).toBe(fakeStream);
            });

            it('can delete', async function() {
                let deleteSpy = spyOn(Bridge.prototype, 'deleteXUMLResources')
                    .and
                    .callFake(function(type, name, callback) {
                        return callback();
                    });

                const {errors, settings} = main.createSettings(
                    'java-resources',
                    Object.assign({}, namedArgs, {delete: true}),
                    ['resource.txt']
                );
                expect(errors).toEqual([]);

                await main.main(Object.assign({}, settings, {'delete': true}), ioInterface);
                c.didSayWorking(ioInterface);
                c.didCreateInstance(bridgeCreate, settings);
                c.verifyLibCall(deleteSpy, bridgeInstance, 'java', 'resource.txt');
            });
        });

        describe('for xslt resources', function() {
            it('can list', async function() {
                let listSpy = spyOn(Bridge.prototype, 'listXUMLResources')
                    .and
                    .callFake(function(type, callback) {
                        return callback();
                    });

                const {errors, settings} =
                    main.createSettings('xslt-resources', namedArgs, ['resource.txt']);
                expect(errors).toEqual([]);

                await main.main(settings, ioInterface);
                c.didSayWorking(ioInterface);
                c.didCreateInstance(bridgeCreate, settings);
                c.verifyLibCall(listSpy, bridgeInstance, 'xslt');
            });

            it('can upload', async function() {
                const content = 'Resource content';
                let uploadSpy = spyOn(Bridge.prototype, 'uploadXUMLResources')
                    .and
                    .callFake(function(type, data, callback) {
                        return callback();
                    });

                const fakeStream = new (require('stream').PassThrough)();
                fakeStream.write(content);
                fakeStream.end();

                let fsCreateReadStreamSpy = spyOn(fs, 'createReadStream')
                    .and
                    .returnValue(fakeStream);

                const {errors, settings} = main.createSettings(
                    'xslt-resources',
                    Object.assign({}, namedArgs, {upload: true}),
                    ['/somewhere/resource.txt']
                );
                expect(errors).toEqual([]);

                await main.main(settings, ioInterface);
                c.didSayWorking(ioInterface);
                c.didCreateInstance(bridgeCreate, settings);
                c.verifyCall(fsCreateReadStreamSpy, '/somewhere/resource.txt');
                expect(uploadSpy.calls.count()).toEqual(1);
                const callData = uploadSpy.calls.mostRecent();
                expect(callData.object).toBe(bridgeInstance);
                expect(callData.args[0]).toEqual('xslt');
                expect(callData.args[1]).toBe(fakeStream);
            });

            it('can delete', async function() {
                let deleteSpy = spyOn(Bridge.prototype, 'deleteXUMLResources')
                    .and
                    .callFake(function(type, name, callback) {
                        return callback();
                    });

                const {errors, settings} = main.createSettings(
                    'xslt-resources',
                    Object.assign({}, namedArgs, {delete: true}),
                    ['resource.txt']
                );
                expect(errors).toEqual([]);

                await main.main(settings, ioInterface);
                c.didSayWorking(ioInterface);
                c.didCreateInstance(bridgeCreate, settings);
                c.verifyLibCall(deleteSpy, bridgeInstance, 'xslt', 'resource.txt');
            });
        });

    });

    describe('"repository" command', function() {

        const content = 'repository content';
        let modelnotesSpy;
        let fsWriteFileSpy;

        beforeEach(function() {
            modelnotesSpy = spyOn(Bridge.prototype, 'getXUMLServiceRepository')
                .and
                .callFake(function(service, callback) {
                    return callback(null, content);
                });

            fsWriteFileSpy = spyOn(fs, 'writeFile')
                .and
                .callFake(function(filename, data, callback) {
                    return callback();
                });
        });

        it('can download a repository', async function() {

            let fsStatSyncSpy = spyOn(fs, 'statSync')
                .and
                .returnValue({
                    isDirectory() {
                        return false;
                    }
                });

            const {errors, settings} =
                main.createSettings('repository', namedArgs, ['SomeService', '/tmp/gugus.rep']);
            expect(errors).toEqual([]);

            await main.main(settings, ioInterface);
            c.didSayWorking(ioInterface);
            c.didCreateInstance(bridgeCreate, settings);
            c.verifyLibCall(modelnotesSpy, bridgeInstance, 'SomeService');
            c.verifyCall(fsStatSyncSpy, '/tmp/gugus.rep');
            c.verifyCall(fsWriteFileSpy, '/tmp/gugus.rep', content);
        });

        it('can download a repository into a directory', async function() {

            let fsStatSyncSpy = spyOn(fs, 'statSync')
                .and
                .returnValue({
                    isDirectory() {
                        return true;
                    }
                });

            const {errors, settings} =
                main.createSettings('repository', namedArgs, ['SomeService', '/tmp']);
            expect(errors).toEqual([]);

            await main.main(settings, ioInterface);
            c.didSayWorking(ioInterface);
            c.didCreateInstance(bridgeCreate, settings);
            c.verifyLibCall(modelnotesSpy, bridgeInstance, 'SomeService');
            c.verifyCall(fsStatSyncSpy, '/tmp');
            c.verifyCall(fsWriteFileSpy, '/tmp/repository-SomeService.rep', content);
        });
    });
});

