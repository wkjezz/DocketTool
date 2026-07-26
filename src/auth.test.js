import test from 'node:test';
import assert from 'node:assert/strict';
import { isDiscordUserAuthorized, normalizeDiscordId } from './auth.js';

test('normalizes blank values to an empty string', () => {
  assert.equal(normalizeDiscordId(null), '');
  assert.equal(normalizeDiscordId('   '), '');
});

test('allows only the permitted Discord ID', () => {
  assert.equal(isDiscordUserAuthorized('1006310774035206244'), true);
  assert.equal(isDiscordUserAuthorized('1234567890'), false);
});
