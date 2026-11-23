// CARNET-COEUR (16.11 : « Le cœur du problème : … n'a pas été respecté », son scénario embouteillage, puis générique) : joué AU DOIGT à partir
// d'un carnet VIDE, sans aucune donnée de fixture (les entrées sont `[]` : seule la configuration de l'app est là). Chaque étape ne passe que par
// un geste que le brasseur a : une impossible, ou faite par la fixture, échoue. L'IA est la réponse simulée de `?dev-local` (jamais Gemini).
import { expect, test, type Page } from '@playwright/test';
import { CLE_CACHE, ouvrirCarnet, poserFixtureCarnet, surListe } from '../outils/carnet';

const champ = (page: Page) => page.locator('textarea').first();
/** Écrire dans le champ du bas et envoyer : le geste unique de tout ajout (toucher le champ, taper, toucher « Ajouter »). */
async function ecrire(page: Page, texte: string) {
  await champ(page).tap();
  await champ(page).pressSequentially(texte);
  await page.getByRole('button', { name: /^Ajouter$/ }).tap();
}
const doc = (page: Page, titre: RegExp) => page.evaluate(([k, src]) => {
  const re = new RegExp(src, 'i');
  return JSON.parse(localStorage.getItem(k) ?? '[]').map((e: any) => e.data).find((d: any) => d?.type === 'carnet' && re.test(d.title ?? '')) ?? null;
}, [CLE_CACHE, titre.source] as const);

test.describe('CARNET-COEUR : du carnet vide à la décision, puis les trois autres cas', () => {
  test.beforeEach(async ({ page }) => {
    const fx = await poserFixtureCarnet(page, 'clair', []);
    expect(fx.entrees.length, 'la fixture existe mais la page part sans aucune entrée').toBeGreaterThan(0);
    await ouvrirCarnet(page);
  });

  test('l’idée embouteillage, ses articles par lien, la comparaison, le choix, et le retrouver après rechargement', async ({ page }) => {
    expect(await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '[]').filter((e: any) => e.name === 'creativeItems').length, CLE_CACHE), 'aucun carnet au départ').toBe(0);
    await ecrire(page, 'embouteillage : par gravité ou par iso, critère minimiser l’oxygène');
    await expect.poll(() => surListe(page), { timeout: 15_000, message: 'l’idée devient un carnet' }).toBe('carnet');
    const carnet = page.locator('[data-carnets]');
    await expect(carnet, 'le critère de la phrase est posé').toContainText(/oxygène/i);
    await expect.poll(async () => (await doc(page, /embouteillage/))?.carnet?.criteres?.length ?? 0, { message: 'le critère est écrit en base' }).toBeGreaterThan(0);

    await ecrire(page, 'https://exemple.invalid/pompe-inox');
    await expect(carnet).toContainText(/Pompe de transfert inox/, { timeout: 15_000 });
    await ecrire(page, 'https://exemple.invalid/pompe-magnetique');
    await expect(carnet).toContainText(/Pompe magnétique/, { timeout: 15_000 });
    await ecrire(page, 'recherche : voir les valves de purge à l’azote');
    await expect(page.getByRole('button', { name: /^Note : / }), 'la recherche est notée').toHaveCount(1, { timeout: 15_000 });

    await page.getByRole('button', { name: /^Comparer/ }).first().tap();
    await expect(page.locator('.cn-tableau-comparer'), 'les articles se comparent').toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: 'Choisir', exact: true }).first().tap();
    await page.getByRole('button', { name: /^Choisir chez/ }).first().tap();
    await expect(carnet, 'le choix est dit').toContainText(/Choisi|Dans À venir/, { timeout: 15_000 });

    // plus tard : rechargement, et on retrouve le carnet, son critère, son choix
    await page.reload();
    await expect(page.locator('nav button').first()).toBeVisible({ timeout: 90_000 });
    await page.locator('nav button').filter({ hasText: 'Brassins' }).first().tap();
    await page.getByRole('button', { name: /^Atelier/ }).first().tap();
    await page.locator('[data-carnets]').getByText(/embouteillage/i).first().tap();
    await expect.poll(() => surListe(page), { timeout: 15_000 }).toBe('carnet');
    await expect(page.locator('[data-carnets]'), 'le critère et son pourquoi sont retrouvés').toContainText(/oxygène/i);
    await expect(page.locator('[data-carnets]'), 'le choix est retrouvé').toContainText(/Choisi|Dans À venir/);
  });

  for (const [phrase, titre] of [['frigo de garde pour les fûts', /frigo/i], ['ventilation de la salle de brassage', /ventilation/i], ['évier pour laver les fûts', /évier/i]] as const) {
    test(`refait de zéro : « ${phrase} » devient un carnet qu’on retrouve dans la liste`, async ({ page }) => {
      await ecrire(page, phrase);
      await expect.poll(() => surListe(page), { timeout: 15_000 }).toBe('carnet');
      await expect(page.locator('[data-carnets]')).toContainText(titre);
      await expect.poll(async () => (await doc(page, titre))?.title ?? null, { message: 'écrit en base' }).not.toBeNull();
      await page.getByRole('button', { name: 'Carnets', exact: true }).first().tap();
      await expect.poll(() => surListe(page)).toBe('liste');
      await expect(page.locator('[data-carnets]'), 'le carnet est dans la liste').toContainText(titre);
    });
  }
});
