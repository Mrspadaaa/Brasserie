// Lot 11 du Carnet (intégration, 23.11) : les points « hors lot » des lots 1 à 10 (INTEGRATION.md), au doigt, sur la fixture du banc ;
// IA simulée (jamais Gemini). Les captures vont dans le dossier de sortie du test.
import { expect, test, type Page } from '@playwright/test';
import { ouvrirCarnet, ouvrirUnCarnet, poserFixtureCarnet, surListe, URL_CARNET } from '../outils/carnet';

const carnet = (page: Page) => page.locator('[data-carnets]');
const champ = (page: Page) => page.locator('textarea').first();
async function taper(page: Page, texte: string) {
  await champ(page).tap();
  await champ(page).pressSequentially(texte);
}
async function ecrire(page: Page, texte: string) {
  await taper(page, texte);
  await page.getByRole('button', { name: /^Ajouter$/ }).tap();
}
const capture = (page: Page, nom: string) => page.screenshot({ path: test.info().outputPath(`${nom}.png`) });

test.describe('Carnet, lot 11', () => {
  test('L-20 : Retirer un critère d’un toucher, avec Annuler', async ({ page }) => {
    await poserFixtureCarnet(page);
    await ouvrirCarnet(page);
    await ouvrirUnCarnet(page, /ZZ TEST — Évier inox/);
    await expect(carnet(page)).toContainText('2 bacs');
    await carnet(page).getByRole('button', { name: 'Critères, actions' }).first().tap();
    await carnet(page).getByRole('button', { name: 'Retirer le critère « 2 bacs »' }).tap();
    const bandeau = carnet(page).locator('[data-sorte="critere-retire"]');
    await expect(bandeau, 'le retrait est dit, avec Annuler').toBeVisible();
    await expect(carnet(page).getByRole('button', { name: 'Retirer le critère « 2 bacs »' })).toHaveCount(0);
    await capture(page, 'l20-critere-retire');
    await bandeau.getByRole('button', { name: /Annuler/ }).tap();
    await expect(carnet(page), 'Annuler rend le critère').toContainText('2 bacs');
  });

  test('L-4 : un lien non lu dit pourquoi dans le bandeau', async ({ page }) => {
    await poserFixtureCarnet(page);
    await ouvrirCarnet(page);
    await ouvrirUnCarnet(page, /ZZ TEST — Évier inox/);
    await ecrire(page, 'https://inconnu-l11.example/robinet-douchette');
    const bandeau = carnet(page).locator('[data-sorte="lien"]').first();
    await expect(bandeau).toBeVisible({ timeout: 15_000 });
    await expect(bandeau, 'la raison de la page non lue est dite').toContainText(/page non lue : \S/);
    await capture(page, 'l4-lien-raison');
  });

  test('L-1 : après un échec de l’IA, « Relire » repasse le message à l’IA', async ({ page }) => {
    await poserFixtureCarnet(page, 'clair', []);
    await page.goto(`${URL_CARNET}&ia=echec`);
    await expect(page.locator('nav button').first()).toBeVisible({ timeout: 90_000 });
    await page.locator('nav button').filter({ hasText: 'Brassins' }).first().tap();
    await page.getByRole('button', { name: /^Atelier/ }).first().tap();
    await expect.poll(() => surListe(page), { timeout: 30_000 }).toBe('liste');
    await ecrire(page, 'ZZ TEST — L11 — pompe de transfert');
    await expect.poll(() => surListe(page), { timeout: 15_000 }).toBe('carnet');
    await ecrire(page, 'https://exemple.invalid/pompe-inox');
    await expect(page.locator('[data-avis="echec"]').first()).toBeVisible({ timeout: 15_000 });
    const relire = carnet(page).locator('[data-relire]').first();
    await expect(relire, 'un geste « Relire » est offert').toBeVisible();
    await capture(page, 'l1-relire');
    await relire.tap();
    // l'IA simulée reste en panne : l'échec est redit, et « Relire » reste offert
    await expect(carnet(page).locator('[data-relire]').first()).toBeVisible({ timeout: 15_000 });
    await expect(carnet(page)).toContainText(/Pompe de transfert inox/);
  });

  test('L-50 : le rechargement garde le carnet ouvert', async ({ page }) => {
    await poserFixtureCarnet(page);
    await ouvrirCarnet(page);
    await ouvrirUnCarnet(page, /ZZ TEST — Évier inox/);
    await page.reload();
    await expect(page.locator('nav button').first()).toBeVisible({ timeout: 90_000 });
    await expect.poll(() => surListe(page), { timeout: 15_000 }).toBe('carnet');
    await expect(carnet(page)).toContainText(/Évier inox/);
    // revenu à la liste, un rechargement reste sur la liste
    await carnet(page).getByRole('button', { name: /Retour|Carnets/ }).first().tap();
    await expect.poll(() => surListe(page)).toBe('liste');
    await page.reload();
    await expect(page.locator('nav button').first()).toBeVisible({ timeout: 90_000 });
    await expect.poll(() => surListe(page), { timeout: 15_000 }).toBe('liste');
  });

  test('L-30 : « Y ajouter en façon » ajoute la phrase en façon du carnet proche', async ({ page }) => {
    await poserFixtureCarnet(page);
    await ouvrirCarnet(page);
    await taper(page, 'ZZ TEST — L11 — hotte inox au-dessus de la cuve');
    const bouton = carnet(page).getByRole('button', { name: /Y ajouter en façon/ });
    await expect(bouton, 'le cadre propose le carnet proche').toBeVisible({ timeout: 10_000 });
    await capture(page, 'l30-avant');
    await bouton.tap();
    await expect.poll(() => surListe(page), { timeout: 10_000 }).toBe('carnet');
    await expect(carnet(page), 'la façon est dans le carnet').toContainText(/hotte inox au-dessus de la cuve/i);
    await expect(champ(page), 'le champ est vidé').toHaveValue('');
    await capture(page, 'l30-apres');
  });

  test('L-2 : une phrase de la liste annoncée « Nouveau carnet » finit dans un carnet neuf, jamais rangée ailleurs', async ({ page }) => {
    await poserFixtureCarnet(page);
    await ouvrirCarnet(page);
    await taper(page, 'ZZ TEST — L11 — cellule de garde 2,6 m3');
    await expect(carnet(page).locator('[data-cadre="creer"]')).toBeVisible();
    await page.getByRole('button', { name: /^Ajouter$/ }).tap();
    await expect.poll(() => surListe(page), { timeout: 20_000 }).toBe('carnet');
    await expect(carnet(page).locator('[data-sorte="cree"]').first(), 'le bandeau dit « Carnet créé »').toBeVisible({ timeout: 15_000 });
    await expect(carnet(page)).toContainText(/cellule de garde/i);
    await capture(page, 'l2-carnet-neuf');
    const sug = carnet(page).locator('[data-suggestion]');
    if (await sug.count()) {
      // l'IA proposait un carnet existant : « Y ajouter ? » l'y range, Annuler rend le carnet neuf
      const titre = (await sug.locator('b').innerText()).trim();
      await sug.getByRole('button', { name: 'Y ajouter ?' }).tap();
      await expect(carnet(page)).toContainText(titre);
      await expect(carnet(page).locator('[data-sorte="ailleurs"]').first()).toBeVisible();
      await capture(page, 'l2-y-ajouter');
    }
  });

  test('Supprimer avec son plan : contour rouge', async ({ page }) => {
    await poserFixtureCarnet(page);
    await ouvrirCarnet(page);
    await ouvrirUnCarnet(page, /Frigo de garde/);
    await carnet(page).getByRole('button', { name: 'Plus', exact: true }).tap();
    await page.getByRole('menuitem', { name: /Supprimer/ }).tap();
    const b = page.locator('.cn-supprimer').getByRole('button', { name: /avec son plan/ });
    await expect(b).toBeVisible();
    const [bord, texte] = await b.evaluate((e) => { const s = getComputedStyle(e); return [s.borderTopColor, s.color]; });
    expect(bord, 'le contour a la couleur du texte rouge').toBe(texte);
    await capture(page, 'supprimer-avec-plan');
  });
});
