import type { Chips, PlayerId, SeatNo, TableConfig } from './types.ts';

export interface TableSeat {
  seat: SeatNo;
  playerId: PlayerId;
  stack: Chips;
  sittingOut: boolean;
  /** Manos seguidas en sit-out. */
  sitOutHands: number;
  /** Recién sentado: no recibe cartas hasta que le toque la ciega grande. */
  waitingForBigBlind: boolean;
}

export interface TableState {
  config: TableConfig;
  seats: (TableSeat | null)[];
  buttonSeat: SeatNo | null;
}

export function createTable(config: TableConfig): TableState {
  throw new Error('createTable: no implementado');
}

/** Sienta a un jugador. Lanza si el asiento está ocupado, ya está en la mesa o el buy-in está fuera de rango. */
export function sitDown(table: TableState, seat: SeatNo, playerId: PlayerId, buyIn: Chips): TableState {
  throw new Error('sitDown: no implementado');
}

/** Levanta a un jugador (solo entre manos). Devuelve la mesa y el stack a devolver al saldo. */
export function standUp(table: TableState, seat: SeatNo): { table: TableState; cashOut: Chips } {
  throw new Error('standUp: no implementado');
}

/** Recompra entre manos, hasta el buy-in máximo. */
export function rebuy(table: TableState, seat: SeatNo, amount: Chips): TableState {
  throw new Error('rebuy: no implementado');
}

export function setSittingOut(table: TableState, seat: SeatNo, sittingOut: boolean): TableState {
  throw new Error('setSittingOut: no implementado');
}

/** Hay al menos `config.minPlayersToDeal` jugadores con fichas y sin sit-out. */
export function canDeal(table: TableState): boolean {
  throw new Error('canDeal: no implementado');
}

/**
 * Prepara la siguiente mano: mueve el botón, decide quién recibe cartas
 * y levanta a quien supera `config.maxSitOutHands`.
 */
export function prepareNextHand(table: TableState): {
  table: TableState;
  buttonSeat: SeatNo;
  dealtSeats: SeatNo[];
  removed: { seat: SeatNo; cashOut: Chips }[];
} {
  throw new Error('prepareNextHand: no implementado');
}

/** Vuelca en la mesa los stacks finales de una mano terminada. */
export function applyHandResult(table: TableState, stacks: { seat: SeatNo; stack: Chips }[]): TableState {
  throw new Error('applyHandResult: no implementado');
}
