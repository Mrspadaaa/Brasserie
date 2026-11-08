import { describe, expect, it } from 'vitest';
import { deduireValeursMalt } from '../../src/domain/ingredientFacts';

// Contre-calcul du 08.11, CF-4 : l'extrait publié par le malteur est « sur sec » (wfr). Le PPG utile est celui du malt tel quel :
// PPG = 46,21 × extrait sur sec × (1 − humidité) (Palmer, How to Brew, ch. 18). Tolérance du rapport : ±2 %.
const reference = (extrait: number, humidite: number) => (extrait / 100) * (1 - humidite / 100) * 46.21;

describe('CF-4 — PPG déduit de l’extrait publié, humidité comprise', () => {
  it.each([[81, 4.5], [80, 5], [82, 4]])('extrait %s % sur sec, humidité %s % : à 2 % de la référence, humidité supposée à 4,5 %', (extrait, humidite) => {
    const ppg = deduireValeursMalt({ extractPct: extrait }).potentialPpg!;
    expect(Math.abs(ppg - reference(extrait, humidite)) / reference(extrait, humidite)).toBeLessThanOrEqual(0.02);
  });

  it.each([[81, 4.5], [80, 5], [82, 4]])('extrait %s % et humidité publiée %s % : à 0,5 % de la référence (le facteur 0,46 de l’app contre 46,21)', (extrait, humidite) => {
    const d = deduireValeursMalt({ extractPct: extrait, moisturePct: humidite });
    expect(Math.abs(d.potentialPpg! - reference(extrait, humidite)) / reference(extrait, humidite)).toBeLessThanOrEqual(0.006);
    expect(d.deduit.potentialPpg).toContain(`${String(humidite).replace('.', ',')} % d’humidité`);
  });

  it('un PPG publié gagne toujours : l’humidité n’y touche pas', () => {
    expect(deduireValeursMalt({ potentialPpg: 37, extractPct: 81, moisturePct: 5 }).potentialPpg).toBeUndefined();
  });

  it('une humidité absurde est ignorée (jamais 0, jamais négative) : la valeur supposée sert', () => {
    expect(deduireValeursMalt({ extractPct: 80, moisturePct: -3 }).potentialPpg).toBe(35.1);
    expect(deduireValeursMalt({ extractPct: 80, moisturePct: 99 }).potentialPpg).toBe(35.1);
  });
});
