const lib = require('../lib/lib');
const main = require('../main');

describe("Input arguments", function() {

    describe("for 'deploy'", function() {

        it("sets 'file'", function() {
            const opts = main.positionalArgsToSettings(
                lib.operations.DEPLOY, {}, ['whatever']);
            expect(opts.file).toMatch(/^.*whatever$/);
        });
    });

    describe("for 'pack'", function() {

        it("sets 'file'", function() {
            const opts = main.positionalArgsToSettings(
                lib.operations.PACK, {}, ['whatever']);
            expect(opts.directory).toMatch(/^.*whatever$/);
        });

        it("sets 'output'", function() {
            const opts = main.positionalArgsToSettings(
                lib.operations.PACK, {}, ['whatever', 'somewhere']);
            expect(opts.output).toMatch(/^.*somewhere$/);
        });
    });

    describe("for 'modelnotes'", function() {

        it("sets 'filename'", function() {
            const opts = main.positionalArgsToSettings(
                lib.operations.MODELNOTES, {}, ['whatever', 'theNotes.txt']);
            expect(opts).toEqual({service: 'whatever', filename: 'theNotes.txt'});
        });

        it("does not set spurious 'filename'", function() {
            const opts = main.positionalArgsToSettings(
                lib.operations.MODELNOTES, {}, ['whatever']);
            expect(opts).toEqual({service: 'whatever'});
        });
    });

    describe("for 'groups'", function() {
        it("sets 'groupId'", function() {
            const opts = main.positionalArgsToSettings(
                lib.operations.GROUPS, {}, ['whatever']);
            expect(opts).toEqual({groupId: 'whatever'});
        });
    });

    describe("for anything else", function() {

        it("sets 'service'", function() {

            function srv(op) {
                return main.positionalArgsToSettings(op, {}, ['whatever']).service;
            }

            expect(srv(lib.operations.START)).toEqual('whatever');
            expect(srv(lib.operations.STOP)).toEqual('whatever');
            expect(srv(lib.operations.KILL)).toEqual('whatever');
            expect(srv(lib.operations.REMOVE)).toEqual('whatever');
            expect(srv(lib.operations.STATUS)).toEqual('whatever');
            expect(srv(lib.operations.SETTINGS)).toEqual('whatever');
            expect(srv(lib.operations.PREFERENCES)).toEqual('whatever');
        });
    });
});
