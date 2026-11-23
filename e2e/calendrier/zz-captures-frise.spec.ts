// Captures avant/après de la voie frise (D444) : 390, page entière, quatre vues (3 sem., 6 sem., 3 ans, 4 ans), sur la fixture simulée.
// CAPT_DIR : le dossier des captures ; CAPT_NOM : le préfixe (« avant », « apres »). Non joué par défaut (zz-).
import { test } from '@playwright/test';
import { aujourdhuiZurich, choisirPeriode, ouvrirCalendrier, poserFixture } from '../outils/calendrier';

test('captures de la frise', async ({ page }) => {
  test.skip(!process.env.CAPT_DIR, 'CAPT_DIR absent');
  test.setTimeout(240_000);
  await poserFixture(page);
  await ouvrirCalendrier(page);
  const auj = aujourdhuiZurich();
  const j = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;
  const plus = (n: number) => new Date(Date.parse(`${auj}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
  const lundi = plus(-((new Date(`${auj}T00:00:00Z`).getUTCDay() + 6) % 7));
  const decale = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
  const plage = async (du: string, au: string) => {
    await page.locator('[data-periode-pastille] .pr-ce').tap();
    await page.getByLabel('Du (jj.mm)').fill(j(du));
    await page.getByLabel('Au (jj.mm)').fill(j(au));
    await page.getByLabel('Au (jj.mm)').blur();
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    if (await page.getByRole('dialog').count()) await page.keyboard.press('Escape');
  };
  const vues: Array<[string, () => Promise<void>]> = [
    ['6sem', () => choisirPeriode(page, '6 sem.')],
    ['3sem', () => plage(lundi, decale(lundi, 20))],
    ['3ans', () => plage(lundi, decale(lundi, 3 * 364 - 1))],
    ['4ans', () => plage(decale(lundi, -364), decale(lundi, 3 * 364 - 1))]
  ];
  for (const [nom, agir] of vues) {
    await agir();
    await page.waitForTimeout(900);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `${process.env.CAPT_DIR}/${process.env.CAPT_NOM ?? 'capt'}-${nom}.png`, fullPage: true });
  }
});
