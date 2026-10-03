// Muestra por consola un mazo nuevo, varias barajas y un reparto de ejemplo.
// Uso: npm run demo:cards
import { randomInt } from 'node:crypto';
import { createDeck, shuffle } from '../src/cards.ts';

const deck = createDeck();
console.log(`Mazo nuevo (${deck.length} cartas):`);
console.log(deck.join(' '));

for (let i = 1; i <= 3; i++) {
  const shuffled = shuffle(deck, randomInt);
  console.log(`\nBaraja ${i} (${shuffled.length} cartas, ${new Set(shuffled).size} únicas):`);
  console.log(shuffled.join(' '));
}

const dealt = shuffle(deck, randomInt);
console.log('\nReparto de ejemplo a 6 jugadores:');
for (let seat = 0; seat < 6; seat++) {
  console.log(`  Asiento ${seat}: ${dealt[seat]} ${dealt[seat + 6]}`);
}
console.log(`  Mesa: ${dealt.slice(12, 17).join(' ')}`);
