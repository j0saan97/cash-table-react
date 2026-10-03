import type { Card } from './cards.ts';
import type { Action, Chips, PlayerId, SeatNo, StepResult, TableConfig } from './types.ts';

export interface StartHandInput {
  handId: string;
  config: TableConfig;
  buttonSeat: SeatNo;
  /** Jugadores que reciben cartas, con el stack con el que empiezan la mano. */
  players: { seat: SeatNo; playerId: PlayerId; stack: Chips }[];
  /** Mazo ya barajado. El motor no genera aleatoriedad. */
  deck: Card[];
}

/** Pone ciegas, reparte y deja la mano esperando al primero en hablar preflop. */
export function startHand(input: StartHandInput): StepResult {
  throw new Error('startHand: no implementado');
}

/**
 * Aplica una acción y avanza la mano todo lo posible: cierre de ronda,
 * siguiente calle, reparto sin apuestas si todos están all-in, showdown y premios.
 * Lanza si la acción es ilegal; el estado recibido nunca se modifica.
 */
export function applyAction(state: StepResult['state'], action: Action): StepResult {
  throw new Error('applyAction: no implementado');
}
