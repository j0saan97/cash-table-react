import type { Card } from './cards.ts';
import type { Chips, HandPlayer, Pot, SeatNo } from './types.ts';

export interface PotAward {
  potIndex: number;
  seat: SeatNo;
  amount: Chips;
}

/** Bote principal y secundarios a partir de lo apostado por cada jugador en la mano. */
export function buildPots(players: readonly HandPlayer[]): Pot[] {
  throw new Error('buildPots: no implementado');
}

/** Parte de la apuesta más alta que nadie igualó, a devolver a su dueño. `null` si no hay. */
export function uncalledBet(players: readonly HandPlayer[]): { seat: SeatNo; amount: Chips } | null {
  throw new Error('uncalledBet: no implementado');
}

/**
 * Reparte cada bote entre los mejores de sus elegibles.
 * La ficha impar va al primer ganador a la izquierda del botón.
 */
export function awardPots(
  pots: readonly Pot[],
  players: readonly HandPlayer[],
  board: readonly Card[],
  buttonSeat: SeatNo,
): PotAward[] {
  throw new Error('awardPots: no implementado');
}
