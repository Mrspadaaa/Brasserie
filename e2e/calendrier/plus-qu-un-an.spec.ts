// CAL-PLUS-QU-UN-AN (23.11) : « on peut maintenant que afficher 1 ans Max ??? » (plafond de 52 semaines posé au tour 11, FC-1/L-44). La
// fenêtre de la courbe va au-delà d'un an, jusqu'à l'horizon (+5 ans, D425). Rouge sur le tour 15 (le bouton reste « An », 52 semaines).
import { expect, test } from '@playwright/test';
import { Doigt } from '../outils/doigt';
import { fautesAxe } from '../outils/axe';
import { boutonPeriode, choisirPeriode, ouvrirCalendrier, poserFixture } from '../outils/calendrier';

const enMois = (t: string) => { const m = /^(\d+) (mois|ans)$/.exec(t.trim()); return m ? Number(m[1]) * (m[2] === 'ans' ? 12 : 1) : t.trim() === 'An' ? 12 : 0; };

test('CAL-PLUS-QU-UN-AN : depuis l\'An, la poignée de fin tenue au bord agrandit la fenêtre au-delà d\'un an', async ({ page }) => {
  await poserFixture(page);
  await ouvrirCalendrier(page);
  await choisirPeriode(page, 'An');
  const doigt = await Doigt.sur(page);
  const h = (await page.locator('[data-poignee="fin"]').first().boundingBox())!, y = h.y + h.height / 2;
  const largeur = page.viewportSize()!.width;
  await doigt.tenirAuBord({ x: h.x + h.width / 2, y }, { x: largeur - 3, y }, 3000, { mode: 'immobile' });
  await page.waitForTimeout(600);
  const t = (await boutonPeriode(page).innerText()).trim();
  expect(enMois(t), `la durée après le geste : « ${t} »`).toBeGreaterThan(13);
  const etiquette = (await page.locator('[data-cadre-etiquette]').first().innerText()).replace(/\s+/g, ' ');
  expect(etiquette, 'l\'étiquette du cadre dit une autre année que celle de son début').toMatch(/\d{4}/);
});

// Tour 20 en ligne : le début tiré jusqu'au bout du passé (la vue commence avant l'horizon) décalait la bande de la marge (2026 à 17 px, le
// cadre de nov. 2025 à 68 px) : la bande, la courbe et les rangées restent sur un seul axe (D441).
test('CAL-PLUS-QU-UN-AN : au-delà d’un an, passé compris jusqu’au bout, un seul axe', async ({ page }) => {
  await poserFixture(page);
  await ouvrirCalendrier(page);
  await choisirPeriode(page, 'An');
  const doigt = await Doigt.sur(page);
  const largeur = page.viewportSize()!.width;
  for (const [poignee, x] of [['fin', largeur - 3], ['debut', 3]] as const) {
    const h = (await page.locator(`[data-poignee="${poignee}"]`).first().boundingBox())!, y = h.y + h.height / 2;
    await doigt.tenirAuBord({ x: h.x + h.width / 2, y }, { x, y }, 3000, { mode: 'immobile' });
    await page.waitForTimeout(700);
  }
  const t = (await boutonPeriode(page).innerText()).trim();
  expect(enMois(t), `la durée après les deux gestes : « ${t} »`).toBeGreaterThan(13);
  expect(await fautesAxe(page, t)).toEqual([]);
});
