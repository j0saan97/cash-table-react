import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomInt } from 'node:crypto';
import { createDeck, rankValue, shuffle, suitOf, type Card } from './cards.ts';
import { compareHands, evaluate, HAND_CATEGORY, type HandCategory } from './evaluator.ts';

const CATEGORY_NAME: Record<HandCategory, string> = {
  0: 'carta alta',
  1: 'pareja',
  2: 'doble pareja',
  3: 'trío',
  4: 'escalera',
  5: 'color',
  6: 'full',
  7: 'póker',
  8: 'escalera de color',
};

describe('evaluate', () => {
  test('reconoce cada categoría, de carta alta a escalera de color', () => {
    const cases: [Card[], HandCategory][] = [
      [['As', 'Kd', '9h', '7c', '4s', '3d', '2h'], HAND_CATEGORY.highCard],
      [['As', 'Ad', '9h', '7c', '4s', '3d', '2h'], HAND_CATEGORY.pair],
      [['As', 'Ad', '9h', '9c', '4s', '3d', '2h'], HAND_CATEGORY.twoPair],
      [['As', 'Ad', 'Ah', '9c', '4s', '3d', '2h'], HAND_CATEGORY.threeOfAKind],
      [['9s', '8d', '7h', '6c', '5s', 'Kd', '2h'], HAND_CATEGORY.straight],
      [['As', 'Js', '9s', '6s', '3s', 'Kd', '2h'], HAND_CATEGORY.flush],
      [['As', 'Ad', 'Ah', '9c', '9s', '3d', '2h'], HAND_CATEGORY.fullHouse],
      [['As', 'Ad', 'Ah', 'Ac', '9s', '3d', '2h'], HAND_CATEGORY.fourOfAKind],
      [['9s', '8s', '7s', '6s', '5s', 'Kd', '2h'], HAND_CATEGORY.straightFlush],
    ];
    for (const [cards, category] of cases) {
      assert.equal(evaluate(cards).category, category, cards.join(' '));
    }
  });

  test('elige las mejores 5 entre 7 cartas', () => {
    const hand = evaluate(['2c', '3d', 'Ks', 'Kh', 'Qd', 'Jc', '9s']);
    assert.deepEqual(hand.cards, ['Ks', 'Kh', 'Qd', 'Jc', '9s']);
    assert.deepEqual(hand.tiebreak, [13, 12, 11, 9]);
  });

  test('rueda A-2-3-4-5 es escalera con el 5 como carta alta', () => {
    const wheel = evaluate(['Ah', '2c', '3d', '4s', '5h', 'Kd', 'Qc']);
    assert.equal(wheel.category, HAND_CATEGORY.straight);
    assert.deepEqual(wheel.tiebreak, [5]);
    assert.deepEqual(wheel.cards, ['5h', '4s', '3d', '2c', 'Ah']);
    assert.ok(compareHands(evaluate(['2c', '3d', '4s', '5h', '6d', 'Kd', 'Qc']), wheel) > 0);
  });

  test('escalera de color tiene prioridad sobre color y escalera por separado', () => {
    // Escalera al 9 y color al As, pero no las mismas cinco cartas: es color.
    assert.equal(evaluate(['9s', '8s', '7s', '6s', '5d', 'As', '2s']).category, HAND_CATEGORY.flush);
    assert.equal(evaluate(['9s', '8s', '7s', '6s', '5s', 'Ad', 'Ah']).category, HAND_CATEGORY.straightFlush);
  });

  test('full: elige el mejor trío y la mejor pareja cuando hay dos tríos', () => {
    const hand = evaluate(['9s', '9d', '9h', 'Kc', 'Ks', 'Kd', '2h']);
    assert.equal(hand.category, HAND_CATEGORY.fullHouse);
    assert.deepEqual(hand.tiebreak, [13, 9]);
  });

  test('doble pareja con tres parejas: usa las dos mejores y el mejor kicker', () => {
    const hand = evaluate(['As', 'Ad', '9h', '9c', '4s', '4d', 'Kh']);
    assert.deepEqual(hand.tiebreak, [14, 9, 13]);
  });

  test('rechaza menos de 5 o más de 7 cartas', () => {
    assert.throws(() => evaluate(['As', 'Kd', '9h', '7c']));
  });
});

describe('compareHands', () => {
  test('categoría superior gana', () => {
    const flush = evaluate(['2s', '4s', '6s', '8s', 'Ts']);
    const straight = evaluate(['Ts', 'Jd', 'Qh', 'Kc', 'As']);
    assert.ok(compareHands(flush, straight) > 0);
    assert.ok(compareHands(straight, flush) < 0);
  });

  test('misma categoría: desempata por kickers en orden', () => {
    const board: Card[] = ['Ah', '8d', '5c', '3s', '2d'];
    const aceKing = evaluate(['As', 'Kd', ...board]);
    const aceQueen = evaluate(['Ac', 'Qd', ...board]);
    assert.ok(compareHands(aceKing, aceQueen) > 0);
  });

  test('empate exacto cuando el tablero juega para ambos', () => {
    const board: Card[] = ['Ts', 'Jd', 'Qh', 'Kc', 'As'];
    assert.equal(compareHands(evaluate(['2c', '3d', ...board]), evaluate(['4h', '5s', ...board])), 0);
  });

  test('el palo nunca desempata', () => {
    assert.equal(
      compareHands(evaluate(['As', 'Ks', 'Qs', 'Js', '9s']), evaluate(['Ah', 'Kh', 'Qh', 'Jh', '9h'])),
      0,
    );
  });
});

// --- All-in preflop con cartas al azar -------------------------------------
// Comprobación independiente del evaluador: puntúa las 21 combinaciones de
// 5 cartas con un algoritmo distinto y se queda con la mejor.

function scoreFive(cards: readonly Card[]): number[] {
  const values = cards.map(rankValue).sort((a, b) => b - a);
  const counts = new Map<number, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  const byCount = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const shape = byCount.map(([, count]) => count).join('');
  const ordered = byCount.map(([value]) => value);
  const isFlush = cards.every((card) => suitOf(card) === suitOf(cards[0]!));
  const isWheel = values.join() === '14,5,4,3,2';
  const isStraight = isWheel || (counts.size === 5 && values[0]! - values[4]! === 4);
  const straightTop = isWheel ? 5 : values[0]!;

  if (isStraight && isFlush) return [8, straightTop];
  if (shape === '41') return [7, ...ordered];
  if (shape === '32') return [6, ...ordered];
  if (isFlush) return [5, ...values];
  if (isStraight) return [4, straightTop];
  if (shape === '311') return [3, ...ordered];
  if (shape === '221') return [2, ...ordered];
  if (shape === '2111') return [1, ...ordered];
  return [0, ...values];
}

function compareScores(a: readonly number[], b: readonly number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function bestScoreOfSeven(cards: readonly Card[]): number[] {
  let best: number[] | null = null;
  for (let skipA = 0; skipA < cards.length; skipA++) {
    for (let skipB = skipA + 1; skipB < cards.length; skipB++) {
      const score = scoreFive(cards.filter((_, i) => i !== skipA && i !== skipB));
      if (best === null || compareScores(score, best) > 0) best = score;
    }
  }
  return best!;
}

/** Índices de los ganadores (varios si hay empate). */
function winnersOf<T>(items: readonly T[], compare: (a: T, b: T) => number): number[] {
  const best = items.reduce((top, item) => (compare(item, top) > 0 ? item : top));
  return items.flatMap((item, i) => (compare(item, best) === 0 ? [i] : []));
}

function dealThreeWayAllIn() {
  const deck = shuffle(createDeck(), randomInt);
  const holeCards: Card[][] = [0, 1, 2].map((i) => [deck[i]!, deck[i + 3]!]);
  const board = deck.slice(6, 11);
  return { holeCards, board };
}

describe('all-in preflop a 3 manos con cartas al azar', () => {
  test('determina el ganador de un reparto y lo muestra', () => {
    const { holeCards, board } = dealThreeWayAllIn();
    const hands = holeCards.map((hole) => evaluate([...hole, ...board]));
    const winners = winnersOf(hands, compareHands);

    console.log(`\n  Mesa: ${board.join(' ')}`);
    hands.forEach((hand, i) => {
      const mark = winners.includes(i) ? '  <- GANA' : '';
      console.log(
        `  Jugador ${i + 1}: ${holeCards[i]!.join(' ')}  ->  ${CATEGORY_NAME[hand.category]} (${hand.cards.join(' ')})${mark}`,
      );
    });
    console.log(winners.length > 1 ? `  Bote dividido entre ${winners.length} jugadores\n` : '');

    const expected = winnersOf(
      holeCards.map((hole) => bestScoreOfSeven([...hole, ...board])),
      compareScores,
    );
    assert.deepEqual(winners, expected);
  });

  test('5.000 repartos: mismo ganador que la comprobación independiente', () => {
    for (let n = 0; n < 5000; n++) {
      const { holeCards, board } = dealThreeWayAllIn();
      const hands = holeCards.map((hole) => evaluate([...hole, ...board]));
      const scores = holeCards.map((hole) => bestScoreOfSeven([...hole, ...board]));
      const context = `mesa ${board.join(' ')} | manos ${holeCards.map((h) => h.join(' ')).join(' / ')}`;

      hands.forEach((hand, i) => {
        assert.equal(hand.category, scores[i]![0], context);
        assert.equal(hand.cards.length, 5, context);
        assert.equal(compareScores(scoreFive(hand.cards), scores[i]!), 0, context);
      });
      assert.deepEqual(winnersOf(hands, compareHands), winnersOf(scores, compareScores), context);
    }
  });
});
