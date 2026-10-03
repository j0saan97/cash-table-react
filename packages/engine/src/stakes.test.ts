import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STAKES, tableConfigFor } from './stakes.ts';

test('niveles de NL2 a NL1000, únicos y ordenados por ciega grande', () => {
  assert.equal(STAKES[0].id, 'NL2');
  assert.equal(STAKES.at(-1)!.id, 'NL1000');
  assert.equal(new Set(STAKES.map((s) => s.id)).size, STAKES.length);
  for (let i = 1; i < STAKES.length; i++) {
    assert.ok(STAKES[i]!.bigBlind > STAKES[i - 1]!.bigBlind);
  }
});

test('ciegas enteras, SB menor que BB y nombre igual a la ciega grande', () => {
  for (const stake of STAKES) {
    assert.ok(Number.isInteger(stake.smallBlind) && stake.smallBlind > 0);
    assert.ok(Number.isInteger(stake.bigBlind));
    assert.ok(stake.smallBlind < stake.bigBlind);
    assert.equal(stake.id, `NL${stake.bigBlind}`);
  }
});

test('tableConfigFor: buy-in de 40 a 100 ciegas grandes y reglas de mesa', () => {
  assert.deepEqual(tableConfigFor('NL10'), {
    maxSeats: 6,
    minPlayersToDeal: 5,
    maxSitOutHands: 10,
    smallBlind: 5,
    bigBlind: 10,
    minBuyIn: 400,
    maxBuyIn: 1000,
  });
});
