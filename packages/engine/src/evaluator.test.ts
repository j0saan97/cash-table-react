import { describe, test } from 'node:test';

describe('evaluate', () => {
  test.todo('reconoce cada categoría, de carta alta a escalera de color');
  test.todo('elige las mejores 5 entre 7 cartas');
  test.todo('rueda A-2-3-4-5 es escalera con el 5 como carta alta');
  test.todo('escalera de color tiene prioridad sobre color y escalera por separado');
  test.todo('full: elige el mejor trío y la mejor pareja cuando hay dos tríos');
});

describe('compareHands', () => {
  test.todo('categoría superior gana');
  test.todo('misma categoría: desempata por kickers en orden');
  test.todo('empate exacto cuando el tablero juega para ambos');
  test.todo('el palo nunca desempata');
});
