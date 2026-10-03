import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDeck, rankValue, shuffle, suitOf } from './cards.ts';

test('createDeck devuelve 52 cartas únicas', () => {
  const deck = createDeck();
  assert.equal(deck.length, 52);
  assert.equal(new Set(deck).size, 52);
});

test('rankValue y suitOf', () => {
  assert.equal(rankValue('2c'), 2);
  assert.equal(rankValue('Td'), 10);
  assert.equal(rankValue('As'), 14);
  assert.equal(suitOf('Kh'), 'h');
});

test('shuffle conserva las 52 cartas y no modifica el original', () => {
  const deck = createDeck();
  const original = [...deck];
  let seed = 1;
  const randomInt = (max: number) => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed % max;
  };
  const shuffled = shuffle(deck, randomInt);
  assert.deepEqual(deck, original);
  assert.notDeepEqual(shuffled, original);
  assert.deepEqual([...shuffled].sort(), [...original].sort());
});

test('shuffle es determinista con el mismo generador', () => {
  const fixed = () => 0;
  assert.deepEqual(shuffle(createDeck(), fixed), shuffle(createDeck(), fixed));
});
