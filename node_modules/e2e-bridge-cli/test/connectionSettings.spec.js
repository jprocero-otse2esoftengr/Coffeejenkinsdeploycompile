const lib = require('../lib/lib');

describe("Connection settings", function() {

    describe("port", function() {

        it("can be set with 'p'", function() {
            expect(lib.gatherConnectionSettings({p: '1234'}).settings.port).toEqual(1234);
        });

        it("can be set with 'port'", function() {
            expect(lib.gatherConnectionSettings({port: '1234'}).settings.port).toEqual(1234);
        });

        it("must be valid number", function() {
            expect(lib.gatherConnectionSettings({p: 'gugus'}).error).toBeTruthy();
        });

        it("defaults to 8080", function() {
            expect(lib.gatherConnectionSettings({}).settings.port).toEqual(8080);
        });
    });

    describe("user", function() {

        it("can be set with 'u'", function() {
            expect(lib.gatherConnectionSettings({u: 'testUser'}).settings.user).toEqual('testUser');
        });

        it("can be set with 'user'", function() {
            expect(lib.gatherConnectionSettings({user: 'testUser'}).settings.user).toEqual('testUser');
        });
    });

    describe("password", function() {

        it("can be set with 'P'", function() {
            expect(lib.gatherConnectionSettings({P: 'pw'}).settings.password).toEqual('pw');
        });

        it("can be set with 'password'", function() {
            expect(lib.gatherConnectionSettings({password: 'pw'}).settings.password).toEqual('pw');
        });
    });

    describe("host", function() {

        it("can be set with 'h'", function() {
            expect(lib.gatherConnectionSettings({h: 'test.host'}).settings.host).toEqual('test.host');
        });

        it("can be set with 'host'", function() {
            expect(lib.gatherConnectionSettings({host: 'test.host'}).settings.host).toEqual('test.host');
        });

        it("defaults to 'localhost'", function() {
            expect(lib.gatherConnectionSettings({}).settings.host).toEqual('localhost');
        });
    });

    describe("protocol", function() {
        it("can be set with 's'", function() {
            expect(lib.gatherConnectionSettings({s: 'https'}).settings.protocol).toEqual('https');
        });

        it("can be set with 'scheme'", function() {
            expect(lib.gatherConnectionSettings({scheme: 'https'}).settings.protocol).toEqual('https');
        });

        it("can be set with 'protocol'", function() {
            expect(lib.gatherConnectionSettings({protocol: 'https'}).settings.protocol).toEqual('https');
        });

        it("defaults to 'https'", function() {
            expect(lib.gatherConnectionSettings({}).settings.protocol).toEqual('https');
        });
    });
});
