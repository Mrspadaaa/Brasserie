// CAL-VENTE-FICHE (23.11, 1050-ventes) : « Clicker sur sur une vente renvoie directement sur la vente, au lieu d'afficher la vue normal sur
// tableau ». Toucher une vente de la rangée Ventes ouvre la fiche du Calendrier sous sa ligne, comme un brassin ou un achat ; l'écran de la vente
// (sa pièce) ne s'ouvre que par « Ouvrir la pièce ». Données : la fixture simulée (vente encaissée « Vente 6 × Pale Ale — Comptoir »). Rouge sur
// le tour 21.
import { expect, test } from '@playwright/test';
import { choisirPeriode, ouvrirCalendrier, poserFixture } from '../outils/calendrier';

test('CAL-VENTE-FICHE : toucher une vente ouvre la fiche du Calendrier ; « Ouvrir la pièce » ouvre la vente', async ({ page }, info) => {
  test.skip((page.viewportSize()?.width ?? 0) > 500, 'sa plainte : téléphone en portrait (390)');
  await poserFixture(page);
  await ouvrirCalendrier(page);
  await choisirPeriode(page, '6 sem.');
  const ventes = page.locator('[data-rangee="ventes"] [data-chose]').filter({ visible: true });
  await expect(ventes.first(), 'une vente dans la rangée Ventes').toBeVisible();
  const ids = await ventes.evaluateAll((l) => l.map((e) => e.getAttribute('data-chose') ?? ''));
  const id = ids.find((x) => x.includes('paiement-') || x.includes('invoice:')) ?? ids[0];
  const vente = page.locator(`[data-rangee="ventes"] [data-chose="${id}"]`).first();
  await vente.scrollIntoViewIfNeeded();
  await vente.tap();
  await page.waitForTimeout(500);
  await info.attach('vente-touchee', { body: await page.screenshot(), contentType: 'image/png' });
  await expect(page.locator('[data-calendrier]'), 'le Calendrier reste affiché').toBeVisible();
  const fiche = page.locator('[data-detail]');
  await expect(fiche, `la fiche de la vente « ${id} » s'ouvre`).toBeVisible();
  const ouvrir = fiche.getByRole('button', { name: /Ouvrir la pièce/ }).or(fiche.getByRole('link', { name: /Ouvrir la pièce/ }));
  await expect(ouvrir.first(), 'la fiche propose « Ouvrir la pièce »').toBeVisible();
  await ouvrir.first().tap();
  await expect(page.locator('[data-calendrier]'), '« Ouvrir la pièce » mène à la vente').toBeHidden({ timeout: 5_000 });
});
