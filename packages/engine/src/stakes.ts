import { DEFAULT_TABLE_RULES, type Chips, type TableConfig } from './types.ts';

/** Buy-in permitido, en ciegas grandes. */
export const BUY_IN_BB = { min: 40, max: 100 } as const;

export interface Stake {
  id: string;
  smallBlind: Chips;
  bigBlind: Chips;
}

/**
 * Niveles de juego, de menor a mayor. Todas las mesas son 6-max No Limit Hold'em sin rake.
 * El nombre indica el buy-in máximo (100 ciegas grandes): NL10 = ciegas 5/10, buy-in hasta 1.000.
 */
export const STAKES = [
  { id: 'NL2', smallBlind: 1, bigBlind: 2 },
  { id: 'NL5', smallBlind: 2, bigBlind: 5 },
  { id: 'NL10', smallBlind: 5, bigBlind: 10 },
  { id: 'NL25', smallBlind: 10, bigBlind: 25 },
  { id: 'NL50', smallBlind: 25, bigBlind: 50 },
  { id: 'NL100', smallBlind: 50, bigBlind: 100 },
  { id: 'NL200', smallBlind: 100, bigBlind: 200 },
  { id: 'NL500', smallBlind: 200, bigBlind: 500 },
  { id: 'NL1000', smallBlind: 500, bigBlind: 1000 },
] as const satisfies readonly Stake[];

export type StakeId = (typeof STAKES)[number]['id'];

export function getStake(id: StakeId): Stake {
  return STAKES.find((stake) => stake.id === id)!;
}

/** Configuración completa de una mesa de ese nivel. */
export function tableConfigFor(id: StakeId): TableConfig {
  const { smallBlind, bigBlind } = getStake(id);
  return {
    ...DEFAULT_TABLE_RULES,
    smallBlind,
    bigBlind,
    minBuyIn: bigBlind * BUY_IN_BB.min,
    maxBuyIn: bigBlind * BUY_IN_BB.max,
  };
}
