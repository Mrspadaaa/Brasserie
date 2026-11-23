// CAL-SEMAINE-ENTRE-TRAITS (23.11, 1049-intervalles) : « une semaine, donc une durée est sur un trait alors que en théorie ça devrait être entre …
// pareil pour les moi, seul les jours sont fix ». Au grain semaine et mois, les traits marquent les limites (lundi 0 h, 1er du mois) et chaque nom
// est centré entre ses deux traits ; au grain jour, le chiffre reste sur sa ligne. Ses durées : 10 sem. (sa capture), 6 mois, An, 3 sem. (jours).
// Données : la fixture simulée. Rouge sur le tour 21.
import { expect, test } from '@playwright/test';
import { Doigt } from '../outils/doigt';
import { fautesTraits } from '../outils/axe';
import { choisirPeriode, fenetreDe, ouvrirCalendrier, poserFixture } from '../outils/calendrier';

test('CAL-SEMAINE-ENTRE-TRAITS : les traits aux limites, les noms de semaine et de mois entre deux traits', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) > 500, 'sa plainte : téléphone en portrait (390)');
  await poserFixture(page);
  await ouvrirCalendrier(page);
  const doigt = await Doigt.sur(page);
  const fautes: string[] = [];
  const voir = async (n: string) => { if (process.env.LOTCAL_DEBUG) await page.screenshot({ path: `${process.env.LOTCAL_DEBUG}/traits-${n.replace(/\W+/g, '')}.png` }); };
  const vue = await fenetreDe(page, doigt, 10, false); await page.waitForTimeout(600);
  fautes.push(...await fautesTraits(page, vue)); await voir(vue);
  for (const nom of ['6 mois', 'An']) { await choisirPeriode(page, nom); await page.waitForTimeout(600); fautes.push(...await fautesTraits(page, nom)); await voir(nom); }
  const v3 = await fenetreDe(page, doigt, 3, false); await page.waitForTimeout(600);
  fautes.push(...await fautesTraits(page, v3)); await voir(v3);
  expect(fautes).toEqual([]);
});
