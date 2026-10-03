import type { Card } from './cards.ts';

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

/** Mejor mano de 5 entre 5, 6 o 7 cartas. */
export function evaluate(cards: readonly Card[]): HandRank {
  throw new Error('evaluate: no implementado');
}

/** > 0 si gana `a`, < 0 si gana `b`, 0 si empatan. */
export function compareHands(a: HandRank, b: HandRank): number {
  throw new Error('compareHands: no implementado');
}
