// Tour 25 (23.11) : la preuve sur un vrai rendu, à 390 px. TTC dit, millésime sans espace, colonnes non publiées en une phrase.
// Le carnet « Chambre froide » de la fixture reçoit : taxe TTC et un prix sur ses articles, « Erntejahr 2025 » sur le premier, un critère
// que ce premier article ne publie pas. Captures dans e2e/resultats/tour25/ (à OUVRIR et regarder, L12).
import { test, expect, type Page } from '@playwright/test';
import { lireFixtureCarnet, poserFixtureCarnet } from '../outils/carnet';
import { ECRANS } from '../outils/ecransCarnet';

async function poser(page: Page) {
  const entrees = structuredClone(lireFixtureCarnet().entrees);
  for (const entree of entrees) {
    const e = entree.data;
    if (e?.type !== 'carnet' || !/Chambre froide/.test(e.title)) continue;
    e.carnet.criteres.push({ id: 'ZZ-K-T25', texte: 'Stromanschluss', origine: 'vous', caracteristique: { nom: 'Stromanschluss', sens: 'plus' } });
    e.carnet.articles.forEach((a: any, i: number) => {
      a.taxe = 'ttc'; a.prixCentimes = a.prixCentimes ?? (i === 0 ? 276365 : 301000); a.devise = a.devise ?? 'CHF';
      if (i === 0) a.valeurs['Erntejahr'] = { valeur: '2025', origine: 'page', luLe: '2026-11-23' };
      else a.valeurs['Stromanschluss'] = { valeur: '230', unite: 'V', origine: 'page', luLe: '2026-11-23' };
    });
  }
  await poserFixtureCarnet(page, 'clair', entrees);
}
const texteDe = async (page: Page) => (await page.locator('[data-carnets]').first().innerText()).replace(/[  ]/g, ' ');

test('tour 25 : la fiche (TTC, millésime, non publié)', async ({ page }) => {
  await poser(page);
  await ECRANS.find((x) => x.id === 'fiche-article')!.aller(page);
  await expect(page.locator('.cn-carac')).toBeVisible();
  const texte = await texteDe(page);
  expect(texte).not.toContain('2 025');
  expect(texte).toContain('TTC');
  expect(texte).toContain('Non publié par le vendeur');
  await page.screenshot({ path: 'e2e/resultats/tour25/fiche-390.png' });
  await page.locator('.cn-carac-manque').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'e2e/resultats/tour25/fiche-390-bas.png' });
});

test('tour 25 : le carnet ouvert (carte, TTC sur la pastille)', async ({ page }) => {
  await poser(page);
  await ECRANS.find((x) => x.id === 'chambre-froide')!.aller(page);
  expect(await texteDe(page)).toContain('TTC');
  await page.screenshot({ path: 'e2e/resultats/tour25/carnet-390.png' });
});
