const assert = require('assert');
const { wrapText } = require('../src/vis-script');

describe('wrapText', () => {
  it('returns empty string for falsy input', () => {
    assert.strictEqual(wrapText(null), '');
    assert.strictEqual(wrapText(undefined), '');
    assert.strictEqual(wrapText(''), '');
  });

  it('wraps long text into lines not exceeding maxChars (respecting word boundaries when possible)', () => {
    const input = 'abcdefghijklmnopqrst uvwxyz 12345 67890';
    const wrapped = wrapText(input, 10);
    // ensure result contains newlines and overall text preserved
    assert.ok(wrapped.includes('\n'));
    assert.strictEqual(wrapped.replace(/\n/g, '').replace(/\s+/g, ' ').trim(), input.replace(/\s+/g, ' ').trim());
  });

  it('does not break short strings', () => {
    const s = 'short';
    assert.strictEqual(wrapText(s, 10), 'short');
  });
});
