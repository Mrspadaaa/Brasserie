// CAL-SANS-LECTURE (D436, 23.11) : « On avait dit plus de bulle. Et plus de lecture du graph au doigt. On en a pas besoin, il y a toutes les
// infos dessus... ». Variante B de Q-2 : le doigt glissé sur la courbe HORS du cadre fait défiler la frise (le passé arrive par la gauche).
// Rouge sur le tour 14 (la pastille lit la semaine sous le doigt, la fenêtre ne bouge pas), vert après. Fixture simulée seulement.
import { expect, test, type Page } from '@playwright/test';
import { Doigt } from '../outils/doigt';
import { boiteCadre, choisirPeriode, lireCoherence, ouvrirCalendrier, poserFixture, semaineAbsolue } from '../outils/calendrier';

/** Tout ce qui lit la courbe au doigt : la pastille de tête, le détail, le curseur (trait, colonne, marche). */
const LECTURE = '.ent-lit, .ent-lu, .ent-det, [data-curseur]';
const lectures = (page: Page) => page.locator(LECTURE).evaluateAll((l) => l.filter((e) => e.getBoundingClientRect().width > 0).map((e) => (e.textContent || e.getAttribute('class') || '').replace(/\s+/g, ' ').trim().slice(0, 40)));

async function debut(page: Page) {
  const c = await lireCoherence(page);
  expect(c.etiquette, `étiquette du cadre lisible (« ${c.label} »)`).not.toBeNull();
  return { abs: semaineAbsolue(c.etiquette!), label: c.label };
}

test.describe('CAL-SANS-LECTURE', () => {
  test.beforeEach(async ({ page }) => {
    await poserFixture(page);
    await ouvrirCalendrier(page);
    await choisirPeriode(page, '3 mois');
  });

  test('doigt posé hors du cadre puis glissé vers la droite : aucune lecture, la frise défile vers le passé', async ({ page }) => {
    const doigt = await Doigt.sur(page);
    const g = (await boiteCadre(page))!, avant = await debut(page);
    const x0 = Math.max(g.courbeL + 6, g.l - 40);
    expect(g.l - x0, 'le doigt est posé à plus de 22 px du cadre').toBeGreaterThan(22);
    let pendant: string[] = [];
    await doigt.glisser({ x: x0, y: g.y }, { x: x0 + 110, y: g.y }, { dureeMs: 400, avantLeve: async () => { pendant = await lectures(page); } });
    expect(pendant, 'doigt encore posé : aucune lecture de la courbe').toEqual([]);
    await page.waitForTimeout(500);
    expect(await lectures(page), 'doigt levé : aucune lecture de la courbe').toEqual([]);
    const apres = await debut(page);
    expect(apres.abs, `la frise a défilé vers le passé (« ${avant.label} » → « ${apres.label} »)`).toBeLessThan(avant.abs);
  });

  test('doigt posé dans le cadre, tenu 600 ms, puis glissé : aucune lecture de la courbe', async ({ page }) => {
    const doigt = await Doigt.sur(page);
    const g = (await boiteCadre(page))!, x0 = (g.l + g.r) / 2;
    let pendant: string[] = [];
    await doigt.glisser({ x: x0, y: g.y }, { x: x0 + 30, y: g.y }, { tenirMs: 600, dureeMs: 300, avantLeve: async () => { pendant = await lectures(page); } });
    expect(pendant, 'doigt encore posé : aucune lecture de la courbe').toEqual([]);
    await page.waitForTimeout(500);
    expect(await lectures(page), 'doigt levé : aucune lecture de la courbe').toEqual([]);
  });
});
