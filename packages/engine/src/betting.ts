import type { Action, Chips, HandState } from './types.ts';

export interface LegalActions {
  canFold: boolean;
  canCheck: boolean;
  /** Fichas que le cuesta igualar (limitado a su stack). 0 si no hay nada que igualar. */
  callAmount: Chips;
  /** Rango de bet/raise como total en la calle. `null` si no puede subir. */
  raiseTo: { min: Chips; max: Chips } | null;
}

/** Acciones legales del jugador en turno. */
export function legalActions(state: HandState): LegalActions {
  throw new Error('legalActions: no implementado');
}

/** Devuelve el motivo si la acción es ilegal, o `null` si es válida. */
export function validateAction(state: HandState, action: Action): string | null {
  throw new Error('validateAction: no implementado');
}

/** Todos los activos han igualado o están all-in. */
export function isBettingRoundClosed(state: HandState): boolean {
  throw new Error('isBettingRoundClosed: no implementado');
}
