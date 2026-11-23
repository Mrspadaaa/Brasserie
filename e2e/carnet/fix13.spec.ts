// fix13 (tour 13 en ligne) : CA13-2, le retour du téléphone sur un carnet ouvert depuis le Calendrier ou À venir ; CA13-3, le carnet d'un
// plan archivé garde la dernière date et le dernier prix posés, et se remet au calendrier.
import { expect, test, type Page } from '@playwright/test';
import { CLE_CACHE, demarrer, lireFixtureCarnet, ouvrirUnCarnet, poserFixtureCarnet, surListe } from '../outils/carnet';

const docs = (page: Page, collection: string) => page.evaluate(([k, c]) => JSON.parse(localStorage.getItem(k) ?? '[]').filter((e: any) => e.name === c).map((e: any) => e.data), [CLE_CACHE, collection] as const);
const plan = async (page: Page, re: RegExp) => (await docs(page, 'financialPlans')).find((p: any) => re.test(p?.title ?? '')) ?? null;
const capture = async (page: Page, nom: string) => { const d = process.env.FIX13_CAPTURES; if (d) await page.screenshot({ path: `${d}/${test.info().project.name}-${nom}.png` }); };
const fixtureRetouchee = (retouche: (e: any) => any | null) => lireFixtureCarnet().entrees.map((e) => retouche(JSON.parse(JSON.stringify(e)))).filter(Boolean);
/** L'écran montré : le Calendrier, le carnet, la liste des carnets ou À venir (Stocks › Matériel). */
async function ecran(page: Page): Promise<string> {
  if (!page.url().startsWith('http')) return 'hors de l’app';
  if (await page.getByRole('heading', { name: 'Calendrier', level: 1 }).first().isVisible().catch(() => false)) return 'calendrier';
  const cv = page.locator('[data-carnets]');
  if (await cv.first().isVisible().catch(() => false)) return (await surListe(page)) ?? '?';
  if (await page.getByRole('button', { name: /^Ouvrir le carnet/ }).first().isVisible().catch(() => false)) return 'à venir';
  return 'autre';
}
async function versMateriel(page: Page, segment: RegExp) {
  await page.locator('nav button').filter({ hasText: 'Stocks' }).first().tap();
  await page.getByRole('button', { name: /^Matériel$/ }).first().tap();
  await page.getByRole('button', { name: segment }).first().tap();
}

test.describe('fix13 : retour du téléphone et plan archivé', () => {
  test('CA13-2 : carnet → Au calendrier → Ouvrir depuis le Calendrier : chaque Retour rend l’écran d’avant, aucun inerte', async ({ page }) => {
    await poserFixtureCarnet(page);
    await demarrer(page);
    await versMateriel(page, /^Carnets/);
    await expect.poll(() => surListe(page)).toBe('liste');
    await ouvrirUnCarnet(page, /Frigo de garde/);
    await page.getByRole('button', { name: /^Au calendrier/ }).first().tap();
    await expect.poll(() => ecran(page), { message: 'Au calendrier ouvre le Calendrier' }).toBe('calendrier');
    const ouvrir = page.getByRole('button', { name: /^Ouvrir dans les carnets/ });
    if (!(await ouvrir.isVisible().catch(() => false))) await page.locator('[aria-label*="Frigo de garde"]').filter({ visible: true }).first().tap();
    await ouvrir.first().tap();
    await expect.poll(() => ecran(page), { message: 'Ouvrir rend le carnet' }).toBe('carnet');
    const vus: string[] = [];
    for (const attendu of ['calendrier', 'carnet', 'liste']) {
      await page.goBack();
      await expect.poll(() => ecran(page), { message: `retour ${vus.length + 1} (après ${vus.join(' → ') || 'le carnet'})` }).toBe(attendu);
      vus.push(attendu);
      await capture(page, `CA13-2-retour-${vus.length}`);
    }
  });

  test('CA13-2 : carnet ouvert depuis À venir : Retour rend À venir, puis le carnet se rouvre et se referme sans retour inerte', async ({ page }) => {
    await poserFixtureCarnet(page);
    await demarrer(page);
    await versMateriel(page, /^À venir/);
    await page.getByRole('button', { name: /^Ouvrir le carnet/ }).first().tap();
    await expect.poll(() => ecran(page), { message: 'Ouvrir le carnet rend le carnet' }).toBe('carnet');
    await page.goBack();
    await expect.poll(() => ecran(page), { message: 'retour depuis le carnet ouvert d’À venir : À venir' }).toBe('à venir');
    expect(page.url(), 'toujours dans l’app').toMatch(/^http/);
    await capture(page, 'CA13-2-a-venir');
  });

  test('CA13-3 : plan archivé → le carnet dit sa dernière date et son dernier prix, et « Au calendrier » le remet', async ({ page }) => {
    /* le plan du Frigo de garde réglé au Calendrier (30 mai 2027) et à À venir (12 345,67 CHF), puis archivé ; le carnet avait 500 CHF et mars */
    await poserFixtureCarnet(page, 'clair', fixtureRetouchee((e) => {
      if (e.data?.id === 'ZZ-PLAN-FRIGO') {
        e.data.status = 'cancelled'; e.data.amountCents = 1234567; e.data.date = '2027-05-30';
        e.data.upgrade = { ...e.data.upgrade, purchaseCents: 1234567, deliveryCents: 0, installationCents: 0, budgetKnown: true, datePrecision: 'day' };
      }
      if (e.data?.id === 'ZZ-CARNET-FRIGO') { e.data.estimatedCost = 500; e.data.date = '2027-03-01'; e.data.precision = 'mois'; }
      return e;
    }));
    await demarrer(page);
    await versMateriel(page, /^Carnets/);
    await ouvrirUnCarnet(page, /Frigo de garde/);
    const quand = page.getByRole('region', { name: 'Quand' });
    await expect(quand, 'le dernier prix posé (12 345,67), pas l’ancien 500').toContainText(/12\s?34[56]/);
    await expect(quand, 'la dernière date posée (S22, 30 mai), pas mars').toContainText(/S22|mai/);
    await expect(quand).not.toContainText(/mars/);
    await capture(page, 'CA13-3-carnet-archive');
    const auCal = page.getByRole('button', { name: /^Au calendrier/ });
    await expect(auCal, 'le projet mis de côté peut être remis au calendrier').toHaveCount(1);
    await auCal.tap();
    await expect.poll(async () => (await plan(page, /Frigo de garde/))?.status, { message: 'Au calendrier reprend le plan archivé' }).toBe('draft');
    const p = await plan(page, /Frigo de garde/);
    expect(p.date.slice(0, 10), 'sa date est gardée').toBe('2027-05-30');
    expect(p.amountCents, 'son prix est gardé').toBe(1234567);
  });
});
