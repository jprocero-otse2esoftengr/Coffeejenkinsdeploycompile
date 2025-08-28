const s = require('../../lib/continuous-delivery/service');

describe("Continuous delivery", function() {
    describe("service parser", function() {
        describe("normalization", function() {
            it('of string guarded value works', function() {
                const input = 'gugus';
                const result = s.normalizeGuardedValue(input);
                expect(result).toEqual({
                    domain: [],
                    label: [],
                    node: [],
                    value: 'gugus'
                });
            });

            describe('of entire service', function() {
                it('without settings works', function() {
                    const input = {type: 'xUML', repository: 'Repo.rep'};
                    const result = s.normalize(input, 'srv', '/home/modeller/cd');
                    expect(result).toEqual({
                        name: 'srv',
                        type: 'xUML',
                        repository: '/home/modeller/cd/repositories/Repo.rep',
                        settings: {},
                        preferences: {},
                        deploymentOptions: {},
                    });
                });

                it('with wrong deployment option type throws', function() {
                    const input = {
                        type: 'xUML',
                        repository: 'Repo.rep',
                        deploymentOptions: {
                            startup: "true"
                        }
                    };
                    expect(() => s.normalize(input, 'srv', '/home/modeller/cd'))
                        .toThrowError(/The type of deployment option 'startup' is wrong\. Should be 'boolean' but found 'string'/);
                });

                it('with wrong deployment option name throws', function() {
                    const input = {
                        type: 'xUML',
                        repository: 'Repo.rep',
                        deploymentOptions: {
                            wrongOption: "true"
                        }
                    };
                    expect(() => s.normalize(input, 'srv', '/home/modeller/cd'))
                        .toThrowError(/The deployment option 'wrongOption' is unknown. Use one of 'startup','overwrite','overwritePrefs','npmInstall','runScripts','instanceName','preserveNodeModules'/);
                });

                it('with wrong type throws', function() {
                    const input = {type: 'gugus', repository: 'Repo.rep'};
                    expect(() => s.normalize(input))
                        .toThrowError(/Service type 'gugus' is unknown.*/);
                });

                it('without type throws', function() {
                    const input = {repository: 'Repo.rep'};
                    expect(() => s.normalize(input))
                        .toThrowError(/Service type 'undefined' is unknown.*/);
                });

                it('without repository throws', function() {
                    const input = {type: 'xUML'};
                    expect(() => s.normalize(input))
                        .toThrowError('Missing \'repository\' field.');
                });
            });
        });
    });
});
