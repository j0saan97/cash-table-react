import { describe, test } from 'node:test';

describe('buildPots', () => {
  test.todo('sin all-ins: un único bote con todos los no retirados');
  test.todo('un all-in corto: bote principal + un secundario');
  test.todo('tres all-ins de distinto tamaño: tres botes con elegibles correctos');
  test.todo('las fichas de un jugador retirado cuentan en el bote pero no es elegible');
  test.todo('la suma de los botes es igual al total apostado');
});

describe('uncalledBet', () => {
  test.todo('devuelve el exceso de la apuesta más alta no igualada');
  test.todo('null cuando la apuesta más alta fue igualada');
});

describe('awardPots', () => {
  test.todo('un ganador se lleva todos los botes en los que es elegible');
  test.todo('el all-in corto gana el principal y otro jugador el secundario');
  test.todo('bote dividido a partes iguales');
  test.todo('ficha impar al primer ganador a la izquierda del botón');
  test.todo('la suma de premios es igual a la suma de botes');
});
