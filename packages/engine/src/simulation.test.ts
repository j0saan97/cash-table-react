import { describe, test } from 'node:test';

// Criterio de salida de la fase 1: miles de manos con acciones legales
// aleatorias (generador con semilla fija) sin romper ninguna invariante.
describe('simulación', () => {
  test.todo('toda mano termina en un número acotado de acciones');
  test.todo('fichas totales de la mesa constantes mano tras mano');
  test.todo('ningún stack queda negativo ni con decimales');
  test.todo('reproducir las acciones registradas da el mismo resultado');
});
