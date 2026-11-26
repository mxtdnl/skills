import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newParticipantId, normaliseParticipantId, isParticipantId, newSittingId, newAttemptId, newSelfReportId, newRecordId } from '../src/core/ids.js';
import { validate } from '../src/core/schema.js';
import * as fx from './fixtures.mjs';

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

test('participant IDs are well formed, check-valid and accepted by the schema', () => {
  const seen = new Set();
  for (let i = 0; i < 500; i++) {
    const id = newParticipantId();
    assert.match(id, /^P-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{5}$/);
    assert.ok(isParticipantId(id));
    seen.add(id);
  }
  assert.equal(seen.size, 500);
  assert.deepEqual(validate('participant', fx.participant({ id: newParticipantId() })).errors, []);
});

test('the fixture ID is check-valid', () => {
  assert.ok(isParticipantId(fx.PID));
});

test('typed codes are normalised: case, spaces, hyphens and look-alike letters', () => {
  const id = newParticipantId();
  const typed = id.toLowerCase().replace(/-/g, ' ').replace(/0/g, 'o').replace(/1/g, 'l');
  assert.equal(normaliseParticipantId(typed), id);
  assert.equal(normaliseParticipantId('not a code'), null);
  assert.equal(normaliseParticipantId(42), null);
});

test('every single-character substitution in the body is detected', () => {
  const id = newParticipantId();
  const chars = id.replace(/-/g, '').slice(1); // 8 body + 1 check
  for (let pos = 0; pos < 8; pos++) {
    for (const c of ALPHABET) {
      if (c === chars[pos]) continue;
      const body = chars.slice(0, pos) + c + chars.slice(pos + 1, 8);
      const typed = `P${body}${chars[8]}`;
      assert.equal(normaliseParticipantId(typed), null, `substitution at ${pos} not detected`);
    }
  }
});

test('IDs never contain anything derived from personal data', () => {
  // The only input is the random source: a fixed source gives a fixed ID.
  const zeros = (b) => b.fill(0);
  assert.equal(newParticipantId(zeros), 'P-0000-00000');
  assert.equal(newSittingId(zeros), 'S-0000000000000000');
});

test('record IDs have their type prefix and pass the schema patterns', () => {
  assert.match(newSittingId(), /^S-[0-9A-HJKMNP-TV-Z]{16}$/);
  assert.match(newAttemptId(), /^A-[0-9A-HJKMNP-TV-Z]{16}$/);
  assert.match(newSelfReportId(), /^R-[0-9A-HJKMNP-TV-Z]{16}$/);
  assert.throws(() => newRecordId('X'), RangeError);
  assert.deepEqual(validate('sitting', fx.sitting({ id: newSittingId() })).errors, []);
});
