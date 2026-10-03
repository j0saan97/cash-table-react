import type { Card } from './cards.ts';

/** Fichas: siempre entero, en la unidad mínima. */
export type Chips = number;
export type SeatNo = 0 | 1 | 2 | 3 | 4 | 5;
export type PlayerId = string;
export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'complete';

export interface TableConfig {
  smallBlind: Chips;
  bigBlind: Chips;
  minBuyIn: Chips;
  maxBuyIn: Chips;
  maxSeats: number;
  /** Jugadores activos necesarios para repartir una mano. */
  minPlayersToDeal: number;
  /** Manos seguidas en sit-out antes de levantar al jugador. */
  maxSitOutHands: number;
}

export const DEFAULT_TABLE_RULES = {
  maxSeats: 6,
  minPlayersToDeal: 5,
  maxSitOutHands: 10,
} as const satisfies Partial<TableConfig>;

/**
 * `amount` en bet/raise es el total apostado por el jugador en la calle
 * ("subo A 300"), no el incremento. Un all-in es un call/bet/raise por todo el stack.
 */
export type Action =
  | { type: 'fold'; seat: SeatNo }
  | { type: 'check'; seat: SeatNo }
  | { type: 'call'; seat: SeatNo }
  | { type: 'bet'; seat: SeatNo; amount: Chips }
  | { type: 'raise'; seat: SeatNo; amount: Chips }
  | { type: 'timeout'; seat: SeatNo };

export interface HandPlayer {
  seat: SeatNo;
  playerId: PlayerId;
  stack: Chips;
  holeCards: [Card, Card];
  /** Apostado en la calle actual. */
  committedStreet: Chips;
  /** Apostado en toda la mano. */
  committedTotal: Chips;
  folded: boolean;
  allIn: boolean;
  /** Ha actuado desde la última apuesta o subida completa. */
  hasActed: boolean;
}

export interface Pot {
  amount: Chips;
  eligibleSeats: SeatNo[];
}

export interface HandState {
  handId: string;
  config: TableConfig;
  buttonSeat: SeatNo;
  street: Street;
  board: Card[];
  /** Cartas restantes por repartir. Nunca sale del servidor. */
  deck: Card[];
  players: HandPlayer[];
  pots: Pot[];
  /** Mayor apuesta total de la calle actual. */
  currentBet: Chips;
  /** Tamaño de la última apuesta o subida completa. */
  lastRaiseSize: Chips;
  toAct: SeatNo | null;
  lastAggressor: SeatNo | null;
}

export type GameEvent =
  | { type: 'HandStarted'; handId: string; buttonSeat: SeatNo }
  | { type: 'BlindsPosted'; smallBlind: { seat: SeatNo; amount: Chips }; bigBlind: { seat: SeatNo; amount: Chips } }
  | { type: 'CardsDealt'; seat: SeatNo; cards: [Card, Card] }
  | { type: 'PlayerActed'; seat: SeatNo; action: Action['type']; amount: Chips; allIn: boolean }
  | { type: 'StreetAdvanced'; street: Street; board: Card[] }
  | { type: 'UncalledBetReturned'; seat: SeatNo; amount: Chips }
  | { type: 'CardsShown'; seat: SeatNo; cards: [Card, Card] }
  | { type: 'PotAwarded'; potIndex: number; seat: SeatNo; amount: Chips }
  | { type: 'HandEnded'; handId: string };

export interface StepResult {
  state: HandState;
  events: GameEvent[];
}
