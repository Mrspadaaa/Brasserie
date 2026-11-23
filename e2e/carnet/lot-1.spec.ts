// Lot 1 du Carnet en ligne (LISTE.md, L-1) : le rangement de l'IA échoue après la lecture d'un lien (IA simulée en panne, `&ia=echec`) :
// l'article porte le nom, le prix et la photo lus, jamais « lecture… » une fois l'envoi fini, même après rechargement. Joué au doigt, sur
// un carnet vide de la fixture ; jamais Gemini.
import { expect, test, type Page } from '@playwright/test';
import { poserFixtureCarnet, surListe, URL_CARNET } from '../outils/carnet';

const champ = (page: Page) => page.locator('textarea').first();
async function ecrire(page: Page, texte: string) {
  await champ(page).tap();
  await champ(page).pressSequentially(texte);
  await page.getByRole('button', { name: /^Ajouter$/ }).tap();
}

test('L-1 : IA en panne après la lecture d’un lien : la page lue reste sur l’article, aucun « lecture… » sans fin', async ({ page }, info) => {
  await poserFixtureCarnet(page, 'clair', []);
  await page.goto(`${URL_CARNET}&ia=echec`);
  await expect(page.locator('nav button').first()).toBeVisible({ timeout: 90_000 });
  await page.locator('nav button').filter({ hasText: 'Brassins' }).first().tap();
  await page.getByRole('button', { name: /^Atelier/ }).first().tap();
  await expect.poll(() => surListe(page), { timeout: 30_000 }).toBe('liste');

  await ecrire(page, 'ZZ TEST — L1 — pompe de transfert');
  await expect.poll(() => surListe(page), { timeout: 15_000, message: 'le carnet est créé et ouvert' }).toBe('carnet');
  await ecrire(page, 'https://exemple.invalid/pompe-inox');

  const carnet = page.locator('[data-carnets]');
  await expect(page.locator('[data-avis="echec"]').first(), 'l’échec de l’IA est dit').toBeVisible({ timeout: 15_000 });
  await expect(carnet, 'le nom lu sur la page est sur l’article').toContainText(/Pompe de transfert inox/, { timeout: 5_000 });
  await expect(carnet, 'le prix lu sur la page est sur l’article').toContainText(/690/);
  await expect(carnet).not.toContainText(/lecture…/);
  await page.screenshot({ path: info.outputPath('l1-apres-echec.png') });

  await page.reload();
  await expect.poll(() => surListe(page), { timeout: 30_000 }).not.toBeNull();
  const ouvrir = page.getByText(/ZZ TEST — L1 — pompe de transfert/).first();
  if (await surListe(page) === 'liste') await ouvrir.tap();
  await expect(carnet).toContainText(/Pompe de transfert inox/, { timeout: 15_000 });
  await expect(carnet).not.toContainText(/lecture…/);
  await page.screenshot({ path: info.outputPath('l1-apres-rechargement.png') });
});
