// const assert = require('assert');

// describe('Example test', function () {
//   it('adds numbers', function () {
//     assert.strictEqual(1 + 1, 2);
//   });
// });

import assert from "node:assert";

describe("Array", function () {
    describe("#indexOf()", function () {
        it("should return -1 when the value is not present", function () {
            assert.equal([1, 2, 3].indexOf(4), -1);
        });
    });
});