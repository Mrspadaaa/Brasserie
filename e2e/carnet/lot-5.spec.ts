// Lot 5 du Carnet en ligne (23.11, LISTE.md § 4) : la liste des carnets, au doigt, sur la fixture du banc. L-30 à L-35.
// L-35 dit seulement ce que la recherche cache : ce qu'elle doit couvrir (Faits, articles, notes) attend son choix (Q-2).
import { expect, test, type Page } from '@playwright/test';
import { ouvrirCarnet, poserFixtureCarnet, surListe } from '../outils/carnet';

const liste = (page: Page) => page.locator('[data-carnets]').first();
const champ = (page: Page) => page.locator('textarea').first();
const ouvrirRecherche = async (page: Page) => { const l = page.getByRole('button', { name: 'Chercher un carnet' }); if (await l.count()) await l.tap(); };
const filtre = (page: Page, s: 'research' | 'idea' | 'validated') => page.locator(`[data-filtre="${s}"]`);

test.describe('Lot 5 : liste des carnets', () => {
  test.beforeEach(async ({ page }) => {
    await poserFixtureCarnet(page);
    await ouvrirCarnet(page);
  });

  test('L-31 : chaque titre de la liste se lit en entier', async ({ page }) => {
    const coupes = await liste(page).evaluate((r) => [...r.querySelectorAll<HTMLElement>('.cn-carnet-titre')]
      .filter((e) => e.getBoundingClientRect().height > 0 && e.scrollHeight > e.clientHeight + 1)
      .map((e) => e.innerText));
    expect(coupes).toEqual([]);
  });

  test('L-32 : « Dans À venir depuis le … · Voir » tient sur une ligne, rangée basse', async ({ page }) => {
    const rangs = await liste(page).evaluate((r) => [...r.querySelectorAll<HTMLElement>('.cn-avenir')].map((e) => {
      const tx = e.querySelector<HTMLElement>('.cn-sp')!;
      const lh = parseFloat(getComputedStyle(tx).lineHeight) || 18;
      return { h: Math.round(e.getBoundingClientRect().height), lignes: Math.round(tx.getBoundingClientRect().height / lh), texte: e.innerText.replace(/\s+/g, ' ') };
    }));
    expect(rangs.length, 'la fixture a des carnets envoyés à À venir').toBeGreaterThan(0);
    for (const r of rangs) {
      expect(r.lignes, r.texte).toBe(1);
      expect(r.h, r.texte).toBeLessThanOrEqual(32);
    }
  });

  test('L-33 : une carte Idée du Planning dit son coût et sa date', async ({ page }) => {
    // « Hotte recyclage » : budget du Planning et date (fixture-planning.json) ; aucun article
    const carte = liste(page).locator('.cn-carnet-bloc').filter({ hasText: 'Hotte recyclage' }).first();
    await expect(carte).toBeVisible();
    await expect(carte.locator('.cn-carnet-prix')).toContainText('CHF');
    await expect(carte).toContainText(/vers \S+|passé · S\d+|S\d+|cette semaine/);
  });

  test('L-34 : le champ de recherche se lit en entier et son anneau de focus n’est pas rogné', async ({ page }, info) => {
    await ouvrirRecherche(page);
    const recherche = page.getByRole('searchbox', { name: 'Chercher un carnet' });
    await recherche.tap();
    const m = await recherche.evaluate((e: HTMLInputElement) => {
      const cs = getComputedStyle(e);
      const ctx = document.createElement('canvas').getContext('2d')!;
      ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const place = e.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const bord = (parseFloat(cs.outlineWidth) || 0) + (parseFloat(cs.outlineOffset) || 0);
      const r = e.getBoundingClientRect(), p = e.parentElement!.getBoundingClientRect();
      return { texte: ctx.measureText(e.placeholder).width, place, bord, dedans: r.left - bord >= p.left - 0.5 && r.right + bord <= p.right + 0.5 && r.top - bord >= p.top - 0.5 && r.bottom + bord <= p.bottom + 0.5 };
    });
    expect(m.texte, `« Chercher un carnet » à ${info.project.name}`).toBeLessThanOrEqual(m.place);
    expect(m.bord, 'un anneau de focus existe').toBeGreaterThan(0);
    expect(m.dedans, 'l’anneau de focus tient dans la rangée qui défile').toBe(true);
  });

  test.skip('L-34 : un filtre d’état qui ne trouve rien le dit (puces d’état retirées par D437, 23.11)', async ({ page }) => {
    await filtre(page, 'idea').tap();
    await filtre(page, 'validated').tap();
    await ouvrirRecherche(page);
    await page.getByRole('searchbox', { name: 'Chercher un carnet' }).fill('Hotte');
    await expect(liste(page).locator('section[aria-label="Idée"]')).toBeVisible();
    await expect(liste(page).locator('[data-vide-filtre="validated"]')).toBeVisible();
    await expect(liste(page).locator('[data-vide-filtre="validated"]')).toContainText(/Choisi\s*0/);
  });

  test('L-35 : la recherche dit les carnets Faits qu’elle laisse de côté', async ({ page }) => {
    await expect(liste(page).locator('section[aria-label="Faits"]')).toBeVisible();
    const n = Number(await liste(page).locator('section[aria-label="Faits"] .cn-groupe .cn-mono').innerText());
    await ouvrirRecherche(page);
    await page.getByRole('searchbox', { name: 'Chercher un carnet' }).fill('évier');
    const dit = liste(page).locator('[data-faits-caches]');
    await expect(dit).toBeVisible();
    await expect(dit).toContainText(String(n));
    await dit.getByRole('button', { name: 'Tout montrer' }).tap();
    await expect(page.getByRole('searchbox', { name: 'Chercher un carnet' })).toHaveValue('');
    await expect(liste(page).locator('section[aria-label="Faits"]')).toBeVisible();
  });

  test('L-30 : une phrase qui dit plus que le titre d’un carnet n’ouvre pas ce carnet en jetant la phrase', async ({ page }) => {
    await champ(page).tap();
    await champ(page).pressSequentially('ZZ TEST — M3 — chambre froide 7,3 m3');
    await expect(liste(page).locator('[data-cadre="creer"]')).toBeVisible();
    await expect(liste(page).locator('[data-existant]'), 'le cadre n’annonce pas « Ouvrir ce carnet »').toHaveCount(0);
    await page.getByRole('button', { name: /^Ajouter$/ }).tap();
    // la phrase n'est pas jetée : un carnet la porte (neuf ou rangé), on l'y retrouve
    await expect.poll(async () => page.evaluate(() => JSON.stringify(localStorage).includes('7,3 m3')), { timeout: 15_000, message: 'la phrase est gardée' }).toBe(true);
    expect(await surListe(page)).not.toBeNull();
  });
});
