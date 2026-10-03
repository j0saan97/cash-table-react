import { describe, test } from 'node:test';

describe('sitDown / standUp / rebuy', () => {
  test.todo('sienta a un jugador con buy-in dentro de rango');
  test.todo('rechaza asiento ocupado');
  test.todo('rechaza a un jugador que ya está en la mesa');
  test.todo('rechaza buy-in por debajo del mínimo o por encima del máximo');
  test.todo('standUp devuelve el stack completo');
  test.todo('rebuy no puede superar el buy-in máximo');
});

describe('canDeal', () => {
  test.todo('false con menos jugadores activos que minPlayersToDeal');
  test.todo('no cuenta jugadores en sit-out ni sin fichas');
});

describe('prepareNextHand', () => {
  test.todo('primera mano: asigna botón');
  test.todo('mueve el botón al siguiente asiento activo');
  test.todo('salta asientos vacíos y jugadores en sit-out');
  test.todo('jugador nuevo espera a la ciega grande para recibir cartas');
  test.todo('levanta a quien supera maxSitOutHands y devuelve su stack');
});

describe('applyHandResult', () => {
  test.todo('actualiza los stacks de los jugadores que jugaron la mano');
  test.todo('jugador que se queda sin fichas pasa a sit-out');
});
