// « Aucun texte rogné, aucun chevauchement » sur chaque écran du Carnet, aux trois tailles (390 × 844, 844 × 340, 1280 × 800 : les projets
// de playwright.config.ts). Mesure du DOM (helpers de e2e/outils/carnet.ts), jamais un texte attendu. Écrans : e2e/outils/ecransCarnet.ts.
import { test, expect } from '@playwright/test';
import { chevauchements, poserFixtureCarnet, textesRognes } from '../outils/carnet';
import { ECRANS } from '../outils/ecransCarnet';

/** Défauts réels connus (CA12-PW-n, voir DEFAUTS.md) : `écran|règle|projet` → id. Ils restent rouges (test.fail) tant que l'app n'est pas corrigée. */
const CONNUS: Record<string, string> = {
  // CA12-PW-3 (rangée « Quand ») et CA12-PW-4 (colonnes du tableau) : corrigés par le lot 3 (L-18, L-19), épreuves rendues normales
};

test.describe('Carnet : aucun texte rogné ni chevauchement', () => {
  for (const ecran of ECRANS) {
    for (const [regle, mesurer] of [['rogne', textesRognes], ['chevauche', chevauchements]] as const) {
      test(`${ecran.id} : ${regle === 'rogne' ? 'aucun texte rogné' : 'aucun chevauchement'}`, async ({ page }, info) => {
        const id = CONNUS[`${ecran.id}|${regle}|${info.project.name}`];
        if (id) test.fail(true, `${id} : voir DEFAUTS.md`);
        await poserFixtureCarnet(page);
        await ecran.aller(page);
        expect(await mesurer(page, ecran.racine), `${ecran.id} à ${info.project.name}`).toEqual([]);
      });
    }
  }
});
