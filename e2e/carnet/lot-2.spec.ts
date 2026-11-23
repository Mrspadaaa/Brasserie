// Lot 2 du Carnet (23.11) : le lien carnet ↔ plan et le prix d'article, joués au doigt sur la fixture simulée (jamais de données réelles).
// L-9 (ses mots du 21.11 : « il y a même pas le prix de la chambre froide ?? »), L-11 (le carnet, À venir et le Calendrier disent la même
// date et le même prix), L-12 (le carnet dit l'état de son plan), L-13 (retour du téléphone), L-14 (Supprimer dit pourquoi), L-16 (suivant).
import { expect, test, type Page } from '@playwright/test';
import { CLE_CACHE, lireFixtureCarnet, ouvrirCarnet, ouvrirUnCarnet, poserFixtureCarnet, surListe } from '../outils/carnet';

const docs = (page: Page, collection: string) => page.evaluate(([k, c]) => JSON.parse(localStorage.getItem(k) ?? '[]').filter((e: any) => e.name === c).map((e: any) => e.data), [CLE_CACHE, collection] as const);
const plan = async (page: Page, re: RegExp) => (await docs(page, 'financialPlans')).find((p: any) => re.test(p?.title ?? '')) ?? null;
const carnet = (page: Page) => page.locator('[data-carnets]').first();
/** La fixture du jour, retouchée : `retouche(entree)` rend l'entrée changée, ou null pour la retirer. */
function fixtureRetouchee(retouche: (e: any) => any | null) {
  return lireFixtureCarnet().entrees.map((e) => retouche(JSON.parse(JSON.stringify(e)))).filter(Boolean);
}

test.describe('Lot 2 : carnet ↔ plan, prix d’article', () => {
  test('L-13 : le retour du téléphone remonte d’un écran (Comparer → carnet → liste), sans quitter l’app', async ({ page }) => {
    await poserFixtureCarnet(page);
    await ouvrirCarnet(page);
    await ouvrirUnCarnet(page, /Chambre froide/);
    await page.getByRole('button', { name: /^Comparer/ }).first().tap();
    await expect.poll(() => surListe(page)).toBe('comparer');
    await page.goBack();
    await expect.poll(() => surListe(page), { message: 'retour depuis Comparer : le carnet' }).toBe('carnet');
    await page.goBack();
    await expect.poll(() => surListe(page), { message: 'retour depuis le carnet : la liste' }).toBe('liste');
    expect(page.url(), 'toujours dans l’app').toContain('parcours-carnet');
  });

  test('L-9 : un article sans prix offre un geste pour le poser, et le prix tient', async ({ page }) => {
    await poserFixtureCarnet(page);
    await ouvrirCarnet(page);
    await ouvrirUnCarnet(page, /Chambre froide/);
    await carnet(page).locator('button.cn-tab-ligne[role=row]').first().tap();
    await expect.poll(() => surListe(page)).toBe('article');
    await page.getByRole('button', { name: /Poser le prix/ }).tap();
    await page.getByRole('textbox', { name: /Prix de l’article/ }).fill('3200');
    await page.getByRole('button', { name: /^OK$/ }).tap();
    await expect(carnet(page), 'le prix posé se lit sur l’offre').toContainText(/3\s?200 CHF/);
  });

  test('L-11 : le prix et la date posés au carnet suivent sur le plan d’À venir, et le carnet lit son plan', async ({ page }) => {
    /* le plan du Frigo de garde chiffré à 450 en mars, le carnet à 500 : le carnet dit 450 et mars */
    await poserFixtureCarnet(page, 'clair', fixtureRetouchee((e) => {
      if (e.data?.id === 'ZZ-PLAN-FRIGO') { e.data.amountCents = 45000; e.data.date = '2027-03-01'; e.data.upgrade = { ...e.data.upgrade, purchaseCents: 45000, deliveryCents: 0, installationCents: 0, budgetKnown: true, datePrecision: 'month' }; }
      if (e.data?.id === 'ZZ-CARNET-FRIGO') { e.data.estimatedCost = 500; e.data.date = '2026-12-07'; e.data.precision = 'mois'; }
      return e;
    }));
    await ouvrirCarnet(page);
    await ouvrirUnCarnet(page, /Frigo de garde/);
    const quand = page.getByRole('region', { name: 'Quand' });
    await expect(quand, 'le carnet lit le plan : 450, mars').toContainText(/450 CHF/);
    await expect(quand).toContainText(/mars/);
    await quand.getByRole('button', { name: /^Prix$/ }).tap();
    await page.getByRole('group', { name: 'Prix estimé' }).getByRole('button', { name: /1\s?000 CHF/ }).tap();
    await expect.poll(async () => (await plan(page, /Frigo de garde/))?.amountCents, { message: 'le prix posé au carnet est celui du plan' }).toBe(100000);
    await quand.getByRole('button', { name: /^1 mois$/ }).tap();
    await expect.poll(async () => (await plan(page, /Frigo de garde/))?.date, { message: 'la date posée au carnet est celle du plan' }).toMatch(/^2026-12/);
  });

  test('L-12 : plan réalisé sans achat → le carnet le dit, plus d’« Au calendrier » ; plan supprimé → jamais « Dans À venir »', async ({ page }) => {
    await poserFixtureCarnet(page, 'clair', fixtureRetouchee((e) => {
      if (e.data?.id === 'ZZ-PLAN-FRIGO') e.data.status = 'completed';
      return e;
    }));
    await ouvrirCarnet(page);
    await ouvrirUnCarnet(page, /Frigo de garde/);
    await expect(carnet(page)).toContainText(/Réalisé/);
    await expect(carnet(page)).not.toContainText(/Dans À venir/);
    await expect(page.getByRole('button', { name: /^Au calendrier/ })).toHaveCount(0);
  });

  test('L-12 : plan supprimé dans À venir → la liste ne dit plus « Dans À venir »', async ({ page }) => {
    await poserFixtureCarnet(page, 'clair', fixtureRetouchee((e) => (e.data?.id === 'ZZ-PLAN-FRIGO' ? null : e)));
    await ouvrirCarnet(page);
    const ligne = carnet(page).locator('button, li, article').filter({ hasText: /Frigo de garde/ }).first();
    await expect(ligne).not.toContainText(/Dans À venir/);
  });

  test('L-14 : Supprimer un carnet lié dit pourquoi, et offre de le supprimer avec son plan', async ({ page }) => {
    await poserFixtureCarnet(page);
    await ouvrirCarnet(page);
    await ouvrirUnCarnet(page, /Frigo de garde/);
    await carnet(page).getByRole('button', { name: 'Plus', exact: true }).tap();
    await page.getByRole('menuitem', { name: /Supprimer/ }).tap();
    const carte = page.locator('.cn-supprimer');
    await expect(carte, 'la raison est dite, pas seulement en info-bulle').toContainText(/Pour supprimer/);
    await carte.getByRole('button', { name: /avec son plan/ }).tap();
    await expect.poll(() => surListe(page)).toBe('liste');
    await expect.poll(() => plan(page, /Frigo de garde/), { message: 'le plan part avec le carnet' }).toBeNull();
  });

  test('L-16 : la fiche d’un article mène à la suivante, et son retour reste atteignable en défilant', async ({ page }) => {
    await poserFixtureCarnet(page);
    await ouvrirCarnet(page);
    await ouvrirUnCarnet(page, /Ventilation de la salle/);
    await carnet(page).locator('button.cn-tab-ligne[role=row]').first().tap();
    await expect.poll(() => surListe(page)).toBe('article');
    const titre = () => page.locator('.cn-fiche .cn-titre').innerText();
    const avant = await titre();
    await page.getByRole('button', { name: 'Article suivant' }).tap();
    await expect.poll(titre, { message: 'l’article suivant s’ouvre' }).not.toBe(avant);
    await page.locator('.cn-defile').evaluate((el) => el.scrollTo(0, el.scrollHeight));
    await expect(page.locator('.cn-fiche .cn-fil-ariane')).toBeInViewport();
  });
});
