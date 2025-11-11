import assert from 'node:assert/strict';
import { describe as nodeDescribe, it as nodeIt, test as nodeTest } from 'node:test';

function expect(received) {
  return {
    toBe(expected) {
      assert.strictEqual(received, expected);
    },
    toEqual(expected) {
      assert.deepStrictEqual(received, expected);
    },
    toHaveLength(expected) {
      assert.strictEqual(received.length, expected);
    },
    toBeDefined() {
      assert.notStrictEqual(received, undefined);
    },
    toBeGreaterThan(expected) {
      assert.ok(received > expected, `${received} is not greater than ${expected}`);
    },
    toBeCloseTo(expected, precision = 2) {
      const delta = Math.pow(10, -precision) * 1.5;
      assert.ok(Math.abs(received - expected) < delta, `${received} is not within ${delta} of ${expected}`);
    },
    toBeTruthy() {
      assert.ok(received);
    },
    toBeFalsy() {
      assert.ok(!received);
    }
  };
}

export const describe = nodeDescribe;
export const test = nodeTest;
export const it = nodeIt;
export { expect };
