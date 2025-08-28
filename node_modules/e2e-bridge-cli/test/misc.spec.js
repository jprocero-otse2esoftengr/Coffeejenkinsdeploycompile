const lib = require('../lib/lib');

describe("Argument parser", function() {
    describe("node.js", function() {
        it("from 'n'", function() {
            expect(lib.isNodeJS({n: true})).toEqual(true);
        });

        it("from 'N'", function() {
            expect(lib.isNodeJS({N: true})).toEqual(true);
        });

        it("from 'nodejs'", function() {
            expect(lib.isNodeJS({nodejs: true})).toEqual(true);
        });

        it("is false by default", function() {
            expect(lib.isNodeJS({})).toBeFalsy();
        });
    });

    describe("java", function() {
        it("from 'j'", function() {
            expect(lib.isJava({j: true})).toEqual(true);
        });

        it("from 'java'", function() {
            expect(lib.isJava({java: true})).toEqual(true);
        });

        it("is false by default", function() {
            expect(lib.isJava({})).toBeFalsy();
        });
    });

    describe("delete", function() {
        it("from 'd'", function() {
            expect(lib.doDelete({d: true})).toEqual(true);
        });

        it("from 'delete'", function() {
            expect(lib.doDelete({'delete': true})).toEqual(true);
        });

        it("is false by default", function() {
            expect(lib.doDelete({})).toBeFalsy();
        });
    });

    describe("upload", function() {
        it("from 'upload'", function() {
            expect(lib.doUpload({upload: true})).toEqual(true);
        });

        it("is false by default", function() {
            expect(lib.doUpload({})).toBeFalsy();
        });
    });

    describe("git", function() {
        it("from 'g'", function() {
            expect(lib.useGit({g: true})).toEqual(true);
        });

        it("from 'git'", function() {
            expect(lib.useGit({git: true})).toEqual(true);
        });

        it("is false by default", function() {
            expect(lib.useGit({})).toBeFalsy();
        });
    });
});
