const util = require('../../lib/util');

describe("Continuous delivery", function() {
    describe("utils", function() {
        describe("makeStringArray", function() {
            it('works when list is a string', function() {
                const result = util.makeStringArray('gugus');
                expect(result).toEqual(['gugus']);
            });

            it('works when list is an array', function() {
                const result = util.makeStringArray(['first', 'second']);
                expect(result).toEqual(['first', 'second']);
            });

            it('works when list is empty', function() {
                const result = util.makeStringArray(undefined);
                expect(result).toEqual([]);
            });

            it('throws when list is weird', function() {
                expect(() => util.makeStringArray({}))
                    .toThrowError('expected list to be a string or an array but got object');
            });

            it('throws when list has weird element', function() {
                expect(() => util.makeStringArray([{}]))
                    .toThrowError('expected list element to be a string but got object');
            });
        });

        describe('unique', function() {
            it('removes duplicated strings only', function() {
                expect(util.unique(['a', 'b', 'c', 'd', 'b', 'a', 'd', 'd']))
                    .toEqual(['a', 'b', 'c', 'd']);
            });
        });
    });
});
