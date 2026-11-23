// Lot 10 du Carnet en ligne (23.11) : Calendrier, fiches, feuilles, bandeau. L-65 à L-72.
import { expect, test, type Page } from '@playwright/test';
import { ouvrirCalendrier, poserFixture } from '../outils/calendrier';
import { Doigt } from '../outils/doigt';

async function plus(page: Page, ligne: RegExp) {
  await page.getByRole('button', { name: 'Actions rapides' }).tap();
  await page.getByRole('menuitem', { name: ligne }).first().tap();
  const feuille = page.getByRole('dialog').last();
  await expect(feuille).toBeVisible();
  return feuille;
}
/** Un achat posé par la feuille (nom, première puce de montant, Ajouter) ; rend sa ligne dans la frise. */
async function poserAchat(page: Page, nom: string) {
  const feuille = await plus(page, /^Prévoir un achat/);
  await feuille.locator('[data-feuille-nom]').fill(nom);
  await feuille.locator('[data-puce="montant"]').first().tap();
  await feuille.locator('[data-ajouter]').tap();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const ligne = page.locator('[data-frise]').getByText(nom).first();
  await expect(ligne).toBeVisible();
  return ligne;
}
const NOM_LONG = 'ZZ TEST Achat avec un titre vraiment très long pour la fiche du calendrier';

test.describe('Lot 10 : Calendrier, fiches, feuilles, bandeau', () => {
  test.beforeEach(async ({ page }) => { await poserFixture(page); await ouvrirCalendrier(page); });

  /* L-65 : non reproduit (garde) : Annuler du bandeau posé par la feuille, touché au doigt (CDP), retire l'achat */
  test('L-65 (garde) : « Annuler » du bandeau d’un achat posé se touche au doigt (CDP) et retire l’achat', async ({ page }) => {
    const feuille = await plus(page, /^Prévoir un achat/);
    await feuille.locator('[data-feuille-nom]').fill('ZZ TEST Achat L65');
    await feuille.locator('[data-puce="montant"]').first().tap();
    await feuille.locator('[data-ajouter]').tap();
    const message = page.locator('[data-message]');
    await expect(message).toBeVisible();
    await expect(page.locator('[data-frise]').getByText('ZZ TEST Achat L65')).toBeVisible();
    await page.waitForTimeout(500);
    const b = (await message.getByRole('button', { name: /Annuler/ }).boundingBox())!;
    await page.touchscreen.tap(Math.round(b.x + b.width / 2), Math.round(b.y + b.height / 2));
    await expect(page.locator('[data-frise]').getByText('ZZ TEST Achat L65'), 'Annuler retire l’achat').toHaveCount(0);
  });

  test('L-66 : le titre de la fiche se lit entier, jamais rogné', async ({ page }) => {
    const ligne = await poserAchat(page, NOM_LONG);
    await ligne.tap();
    const titre = page.locator('[data-detail] .cal-fi-nom');
    await expect(titre).toBeVisible();
    const m = await titre.evaluate((e) => ({ largeur: e.scrollWidth - e.clientWidth, hauteur: e.scrollHeight - e.clientHeight, texte: e.textContent, ellipse: getComputedStyle(e).textOverflow }));
    expect(m.texte).toContain('fiche du calendrier');
    expect(m.largeur, 'pas de débordement latéral').toBeLessThanOrEqual(1);
    expect(m.hauteur, 'pas de texte coupé en hauteur').toBeLessThanOrEqual(1);
    expect(m.ellipse).not.toBe('ellipsis');
  });

  test('L-67 et L-70 : l’achat dit « Date », la semaine et l’année une fois, jamais « Durée 1 j »', async ({ page }) => {
    const feuille = await plus(page, /^Prévoir un achat/);
    await feuille.getByRole('button', { name: '6 mois' }).tap();
    const quand = (await feuille.locator('[data-intention]').innerText()).trim();
    expect(quand, 'l’horizon lointain dit son année').toMatch(/20\d\d$/);
    const ligneQuand = (await feuille.locator('[data-intention]').locator('xpath=..').evaluate((e) => { const c = e.cloneNode(true) as HTMLElement; c.querySelectorAll('.sr-only').forEach((x) => x.remove()); return c.textContent ?? ''; })).replace(/\s+/g, ' ');
    expect(ligneQuand, 'la ligne Quand ne dit pas la semaine : la frise la dit').not.toMatch(/\bS\d+/);
    const texte = (await feuille.evaluate((e) => { const c = e.cloneNode(true) as HTMLElement; c.querySelectorAll('.sr-only').forEach((x) => x.remove()); return c.textContent ?? ''; })).replace(/\s+/g, ' ');
    expect(texte).not.toContain('Durée');
    expect(texte).not.toMatch(/\b1 j\b/);
    expect(texte).toMatch(/Date.*le S\d+ 20\d\d, \d+ \S+ 20\d\d/);
    expect((texte.match(/S\d+ 20\d\d/g) ?? []).length, 'la semaine dite une fois sur la ligne, une fois sur le bouton').toBeLessThanOrEqual(2);
  });

  test('L-68 : en Modifier, le × demande avant de jeter les changements', async ({ page }) => {
    const ligne = await poserAchat(page, 'ZZ TEST Achat L68');
    await ligne.tap();
    await page.locator('[data-detail]').getByRole('button', { name: 'Modifier', exact: true }).tap();
    const feuille = page.getByRole('dialog').last();
    await expect(feuille).toBeVisible();
    await feuille.locator('[data-feuille-nom]').fill('ZZ TEST Achat L68 changé');
    await feuille.getByRole('button', { name: /^Fermer/ }).first().tap();
    await expect(feuille.locator('[data-abandon]'), 'le × dit que les changements seraient perdus').toBeVisible();
    await feuille.getByRole('button', { name: 'Garder' }).tap();
    await expect(feuille.locator('[data-abandon]')).toHaveCount(0);
    await expect(feuille.locator('[data-feuille-nom]')).toHaveValue('ZZ TEST Achat L68 changé');
    await feuille.getByRole('button', { name: /^Fermer/ }).first().tap();
    await feuille.locator('[data-abandonner]').tap();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('L-69 : le brouillon d’une fête survit au rechargement, et part à l’ajout', async ({ page }) => {
    let feuille = await plus(page, /^Poser une fête/);
    await feuille.locator('[data-feuille-nom]').fill('ZZ TEST Fête brouillon');
    await page.reload();
    await ouvrirCalendrier(page);
    feuille = await plus(page, /^Poser une fête/);
    await expect(feuille.locator('[data-feuille-nom]')).toHaveValue('ZZ TEST Fête brouillon');
    await feuille.locator('[data-ajouter]').tap();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    feuille = await plus(page, /^Poser une fête/);
    await expect(feuille.locator('[data-feuille-nom]'), 'ajoutée : plus de brouillon').not.toHaveValue('ZZ TEST Fête brouillon');
  });

  test('L-71 : l’appui long d’une chose créée propose Supprimer, et ne range pas en rouge', async ({ page }) => {
    const ligne = await poserAchat(page, 'ZZ TEST Achat L71');
    const marque = page.locator('[data-frise] [data-chose^="argent-PLAN-"]').last();
    await marque.scrollIntoViewIfNeeded();
    const r = (await marque.boundingBox())!;
    const doigt = await Doigt.sur(page);
    await doigt.appuiLong({ x: r.x + r.width / 2, y: r.y + r.height / 2 }, 700);
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await menu.getByRole('menuitem', { name: 'Supprimer' }).tap();
    await expect(page.locator('[data-frise]').getByText('ZZ TEST Achat L71'), 'Supprimer retire la chose').toHaveCount(0);
    await expect(page.locator('[data-message]').getByRole('button', { name: /Annuler/ }), 'le message garde Annuler').toBeVisible();
  });

  test('L-72 : le plus après une semaine dépliée propose la semaine touchée', async ({ page }) => {
    const cible = page.locator('[data-bande-semaines] [data-semaine]').last();
    const s = 'S' + (await cible.getAttribute('data-semaine'));
    await cible.tap();
    await page.waitForTimeout(400);
    const feuille = await plus(page, /^Prévoir un achat/);
    expect((await feuille.innerText()).replace(/\s+/g, ' ')).toContain(`le ${s}`);
  });
});
