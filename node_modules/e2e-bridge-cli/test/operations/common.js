'use strict';

const Bridge = require('e2e-bridge-lib');

function verifyLibCall(spy, that, ...args) {
    expect(spy.calls.count()).toEqual(1);
    const callData = spy.calls.mostRecent();
    expect(callData.object).toBe(that);
    for(let i = 0; i < args.length; ++i) {
        expect(callData.args[i]).toEqual(args[i]);
    }
}

module.exports.verifyLibCall = verifyLibCall;

function verifyCall(spy, ...args) {
    expect(spy.calls.count()).toEqual(1);
    const callData = spy.calls.mostRecent();
    for(let i = 0; i < args.length; ++i) {
        expect(callData.args[i]).toEqual(args[i]);
    }
}

module.exports.verifyCall = verifyCall;

function didSayWorking(ioInterface) {
    expect(ioInterface.stdout).toEqual('Working, please wait.\n');
}

module.exports.didSayWorking = didSayWorking;

function didCreateInstance(spy, settings) {
    expect(spy)
        .toHaveBeenCalledWith(settings.protocol, settings.host, settings.port, settings.user, settings.password);
}

module.exports.didCreateInstance = didCreateInstance;

function withNodeSwitch(namedArgs) {
    return Object.assign({}, namedArgs, {nodejs: true});
}

module.exports.withNodeSwitch = withNodeSwitch;

function withJavaSwitch(namedArgs) {
    return Object.assign({}, namedArgs, {java: true});
}

module.exports.withJavaSwitch = withJavaSwitch;

function makeTrivialSpy(functionName, numArgs) {
    return spyOn(Bridge.prototype, functionName)
        .and
        .callFake(function(...args) {
            return args[numArgs - 1]();
        });
}

module.exports.makeTrivialSpy = makeTrivialSpy;
