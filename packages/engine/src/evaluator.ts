import { rankValue, suitOf, type Card } from './cards.ts';

export const HAND_CATEGORY = {
  highCard: 0,
  pair: 1,
  twoPair: 2,
  threeOfAKind: 3,
  straight: 4,
  flush: 5,
  fullHouse: 6,
  fourOfAKind: 7,
  straightFlush: 8,
} as const;

export type HandCategory = (typeof HAND_CATEGORY)[keyof typeof HAND_CATEGORY];

export interface HandRank {
  category: HandCategory;
  /** Valores de desempate de mayor a menor importancia (rangos 2..14). */
  tiebreak: number[];
  /** Las 5 cartas que forman la mano. */
  cards: Card[];
}

/** Carta alta de la mejor escalera entre esos valores (5 para la rueda A-2-3-4-5), o `null`. */
function straightHigh(values: readonly number[]): number | null {
  const present = new Set(values);
  if (present.has(14)) present.add(1);
  for (let high = 14; high >= 5; high--) {
    let run = true;
    for (let v = high; v > high - 5; v--) {
      if (!present.has(v)) {
        run = false;
        break;
      }
    }
    if (run) return high;
  }
  return null;
}

/** Una carta por cada valor de la escalera, de la más alta a la más baja. */
function straightCards(sorted: readonly Card[], high: number): Card[] {
  const out: Card[] = [];
  for (let v = high; v > high - 5; v--) {
    const value = v === 1 ? 14 : v;
    out.push(sorted.find((card) => rankValue(card) === value)!);
  }
  return out;
}

/** Mejor mano de 5 entre 5, 6 o 7 cartas. */
export function evaluate(cards: readonly Card[]): HandRank {
  if (cards.length < 5 || cards.length > 7) {
    throw new Error(`evaluate: se esperaban entre 5 y 7 cartas, recibidas ${cards.length}`);
  }
  const sorted = [...cards].sort((a, b) => rankValue(b) - rankValue(a));

  const counts = new Map<number, number>();
  for (const card of sorted) {
    counts.set(rankValue(card), (counts.get(rankValue(card)) ?? 0) + 1);
  }
  // Rangos ordenados por repetición y, a igualdad, por valor.
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]).map(([value]) => value);
  const withCount = (n: number) => groups.filter((value) => counts.get(value)! >= n);

  const take = (value: number, n: number) => sorted.filter((card) => rankValue(card) === value).slice(0, n);
  const kickers = (exclude: readonly number[], n: number) =>
    sorted.filter((card) => !exclude.includes(rankValue(card))).slice(0, n);
  const result = (category: HandCategory, hand: Card[], tiebreak: number[]): HandRank => ({
    category,
    tiebreak,
    cards: hand,
  });

  const flushSuit = (['c', 'd', 'h', 's'] as const).find(
    (suit) => sorted.filter((card) => suitOf(card) === suit).length >= 5,
  );
  const suited = flushSuit ? sorted.filter((card) => suitOf(card) === flushSuit) : [];

  if (flushSuit) {
    const high = straightHigh(suited.map(rankValue));
    if (high !== null) {
      return result(HAND_CATEGORY.straightFlush, straightCards(suited, high), [high]);
    }
  }

  const quads = withCount(4)[0];
  if (quads !== undefined) {
    const kicker = kickers([quads], 1);
    return result(HAND_CATEGORY.fourOfAKind, [...take(quads, 4), ...kicker], [quads, ...kicker.map(rankValue)]);
  }

  const trips = withCount(3).sort((a, b) => b - a)[0];
  if (trips !== undefined) {
    const pair = withCount(2)
      .filter((value) => value !== trips)
      .sort((a, b) => b - a)[0];
    if (pair !== undefined) {
      return result(HAND_CATEGORY.fullHouse, [...take(trips, 3), ...take(pair, 2)], [trips, pair]);
    }
  }

  if (flushSuit) {
    const hand = suited.slice(0, 5);
    return result(HAND_CATEGORY.flush, hand, hand.map(rankValue));
  }

  const high = straightHigh(sorted.map(rankValue));
  if (high !== null) {
    return result(HAND_CATEGORY.straight, straightCards(sorted, high), [high]);
  }

  if (trips !== undefined) {
    const rest = kickers([trips], 2);
    return result(HAND_CATEGORY.threeOfAKind, [...take(trips, 3), ...rest], [trips, ...rest.map(rankValue)]);
  }

  const pairs = withCount(2).sort((a, b) => b - a);
  const [firstPair, secondPair] = pairs;
  if (firstPair !== undefined && secondPair !== undefined) {
    const kicker = kickers([firstPair, secondPair], 1);
    return result(
      HAND_CATEGORY.twoPair,
      [...take(firstPair, 2), ...take(secondPair, 2), ...kicker],
      [firstPair, secondPair, ...kicker.map(rankValue)],
    );
  }
  if (firstPair !== undefined) {
    const rest = kickers([firstPair], 3);
    return result(HAND_CATEGORY.pair, [...take(firstPair, 2), ...rest], [firstPair, ...rest.map(rankValue)]);
  }

  const hand = sorted.slice(0, 5);
  return result(HAND_CATEGORY.highCard, hand, hand.map(rankValue));
}

/** > 0 si gana `a`, < 0 si gana `b`, 0 si empatan. */
export function compareHands(a: HandRank, b: HandRank): number {
  if (a.category !== b.category) return a.category - b.category;
  for (let i = 0; i < a.tiebreak.length; i++) {
    const diff = a.tiebreak[i]! - (b.tiebreak[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}
