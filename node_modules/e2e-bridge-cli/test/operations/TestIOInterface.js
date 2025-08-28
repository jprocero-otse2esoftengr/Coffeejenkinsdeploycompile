'use strict';

/**
 * @implements IIOInterface
 */
class TestIOInterface {
    constructor() {
        this.stdout = '';
        this.stderr = '';
    }

    out(str) {
        this.stdout += str;
        return true;
    }

    error(str) {
        this.stderr += str;
        return true;
    }

    async prompt(questions) {
        return {user: 'admin', password: 'secret'};
    }
}

module.exports = TestIOInterface;
