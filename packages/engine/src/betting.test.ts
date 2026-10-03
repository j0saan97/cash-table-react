import { describe, test } from 'node:test';

describe('legalActions', () => {
  test.todo('sin apuesta previa: check y bet, mínimo una ciega grande');
  test.todo('con apuesta previa: fold, call y raise');
  test.todo('subida mínima = tamaño de la última apuesta o subida completa');
  test.todo('stack menor que el call: solo fold o call all-in');
  test.todo('stack menor que la subida mínima: puede ir all-in por menos');
  test.todo('la ciega grande puede subir preflop si nadie ha subido');
});

describe('validateAction', () => {
  test.todo('rechaza actuar fuera de turno');
  test.todo('rechaza check cuando hay apuesta por igualar');
  test.todo('rechaza subida por debajo del mínimo que no sea all-in');
  test.todo('rechaza importes no enteros o superiores al stack');
});

describe('isBettingRoundClosed', () => {
  test.todo('se cierra cuando todos los activos han igualado');
  test.todo('all-in por menos de una subida completa no reabre la acción');
  test.todo('all-in por una subida completa sí reabre la acción');
});
