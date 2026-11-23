// Lot 7 (23.11) : champ du carnet et Choisir. L-48 (classe b) rejoué à 390 × 844 avec un clavier de 300 px ; L-45 et L-47 au doigt.
import { expect, test, type Page } from '@playwright/test';
import { ouvrirUnCarnet, poserFixtureCarnet, URL_CARNET } from '../outils/carnet';

const champ = (page: Page) => page.locator('textarea').first();

async function ouvrir(page: Page, clavier: number) {
  await poserFixtureCarnet(page);
  await page.goto(`${URL_CARNET}${clavier ? `&keyboard=${clavier}` : ''}`);
  await expect(page.locator('nav button').first()).toBeVisible({ timeout: 90_000 });
  await page.locator('nav button').filter({ hasText: 'Brassins' }).first().tap();
  await page.getByRole('button', { name: /^Atelier/ }).first().tap();
  await ouvrirUnCarnet(page, 'Frigo + congel');
}

test.describe('Lot 7 : champ du carnet', () => {
  test('L-48 : clavier de 300 px, texte tapé : dernière note et champ au-dessus du clavier, « Va dans » sans recouvrement', async ({ page }, info) => {
    test.skip(info.project.name !== 'android-390', 'se juge à 390 × 844');
    await ouvrir(page, 300);
    await champ(page).tap();
    await champ(page).pressSequentially('acheter des joints pour la porte');
    await page.waitForTimeout(600);
    const m = await page.evaluate(() => {
      const t = document.querySelector('textarea')!.getBoundingClientRect();
      const notes = [...document.querySelectorAll<HTMLElement>('.cn-note')].filter((n) => n.getBoundingClientRect().height > 0);
      const d = notes.at(-1)?.getBoundingClientRect() ?? null;
      const zone = document.querySelector('.cn-champ-zone')!.getBoundingClientRect();
      const va = document.querySelector<HTMLElement>('.cn-vadans')?.getBoundingClientRect() ?? null;
      return { H: innerHeight, champBas: t.bottom, champHaut: t.top, zoneHaut: zone.top, noteBas: d?.bottom ?? null, noteHaut: d?.top ?? null, va: !!va };
    });
    expect(m.champBas, 'le champ au-dessus du clavier').toBeLessThanOrEqual(m.H - 300 + 1);
    expect(m.va, '« Va dans » est montré').toBe(true);
    expect(m.noteBas ?? 0, 'la dernière note au-dessus de la zone du champ (« Va dans » compris)').toBeLessThanOrEqual(m.zoneHaut + 1);
    expect(m.noteHaut ?? 0, 'la dernière note dans l’écran').toBeGreaterThanOrEqual(0);
  });

  test('L-47 : après Ajouter, le focus reste dans le champ', async ({ page }) => {
    await ouvrir(page, 0);
    await champ(page).tap();
    await champ(page).pressSequentially('ZZ TEST — noter le prix du joint');
    await page.getByRole('button', { name: 'Ajouter', exact: true }).tap();
    await expect(champ(page)).toBeFocused();
  });

  test('L-45 : le brouillon du champ revient après un rechargement', async ({ page }) => {
    await ouvrir(page, 0);
    await champ(page).tap();
    await champ(page).pressSequentially('brouillon à garder');
    await page.reload();
    await expect(page.locator('nav button').first()).toBeVisible({ timeout: 90_000 });
    await page.locator('nav button').filter({ hasText: 'Brassins' }).first().tap();
    await page.getByRole('button', { name: /^Atelier/ }).first().tap();
    await ouvrirUnCarnet(page, 'Frigo + congel');
    await expect(champ(page)).toHaveValue('brouillon à garder');
  });
});
