export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'] as const;
export const SUITS = ['c', 'd', 'h', 's'] as const;

export type Rank = (typeof RANKS)[number];
export type Suit = (typeof SUITS)[number];
/** Carta como texto de 2 caracteres: 'As', 'Td', '2c'. */
export type Card = `${Rank}${Suit}`;

/** Devuelve un entero en [0, maxExclusive). El servidor inyecta `crypto.randomInt`. */
export type RandomInt = (maxExclusive: number) => number;

/** Valor numérico del rango: 2..14 (As = 14). */
export function rankValue(card: Card): number {
  return RANKS.indexOf(card[0] as Rank) + 2;
}

export function suitOf(card: Card): Suit {
  return card[1] as Suit;
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(`${rank}${suit}`);
    }
  }
  return deck;
}

/** Fisher-Yates. No modifica el mazo recibido. */
export function shuffle(deck: readonly Card[], randomInt: RandomInt): Card[] {
  const out = [...deck];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}
