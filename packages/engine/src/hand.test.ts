import { describe, test } from 'node:test';

describe('startHand', () => {
  test.todo('pone ciegas a la izquierda del botón y reparte 2 cartas a cada uno');
  test.todo('preflop habla primero el jugador a la izquierda de la ciega grande');
  test.todo('ciega con stack menor que la ciega queda all-in');
  test.todo('emite HandStarted, BlindsPosted y CardsDealt en orden');
});

describe('applyAction', () => {
  test.todo('no modifica el estado recibido');
  test.todo('lanza con una acción ilegal');
  test.todo('todos se retiran: gana el último sin showdown y sin mostrar cartas');
  test.todo('avanza preflop → flop → turn → river → showdown');
  test.todo('postflop habla primero el primer activo a la izquierda del botón');
  test.todo('todos all-in: reparte las calles restantes sin más apuestas');
  test.todo('devuelve la apuesta no igualada');
  test.todo('showdown: muestra primero el último agresor');
  test.todo('timeout: check si es posible, si no fold');
  test.todo('mismo estado y mismas acciones producen el mismo resultado');
  test.todo('fichas totales antes = fichas totales después');
});
