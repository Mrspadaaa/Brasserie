// Lot 6 du Carnet (23.11) : À venir (Stocks › Matériel) et la saisie des montants. Défauts L-36 à L-43 de
// work/missions/2026-11-23-carnet-en-ligne/LISTE.md (dépôt Brasserie). Fixture simulée (celle du Carnet, plus cinq projets « ZZ TEST » et le
// carnet du frigo renommé), jour figé 23.11.2026 ; tout au doigt (tap).
import { expect, test, type Page } from '@playwright/test';
import { demarrer, lireFixtureCarnet, poserFixtureCarnet } from '../outils/carnet';

const projet = (id: string, title: string, data: Record<string, unknown>, upgrade: Record<string, unknown>) => ({ name: 'financialPlans', id, data: {
  id, title, date: '', amountCents: 0, direction: 'out', category: 'materiel', source: 'equipment', status: 'draft', createdAt: '2026-11-10T10:00:00.000Z', ...data,
  upgrade: { version: 1, timing: 'soon', stage: 'idea', budgetKnown: false, datePrecision: 'month', estimateSource: 'estimate', ...upgrade } } });
const prix = (cents: number) => ({ amountCents: cents });
const pret = (cents: number, timing = 'soon') => ({ timing, stage: 'ready', budgetKnown: true, purchaseCents: cents });
export const TITRE_LONG = 'ZZ TEST — Achat brasserie : moulin à malt à rouleaux réglables';
export const RENOMME = 'ZZ TEST — Frigo renommé';

function entrees() {
  const fx = lireFixtureCarnet();
  const base = fx.entrees.map((e: any) => e.id === 'ZZ-CARNET-FRIGO' ? { ...e, data: { ...e.data, title: RENOMME } } : e);
  return [...base,
    projet('ZZ-L6-JUIL', TITRE_LONG, { ...prix(50000), date: '2026-07-01', status: 'active' }, pret(50000)),
    projet('ZZ-L6-2027', 'ZZ TEST — Embouteilleuse 2027', { ...prix(300000), date: '2027-07-01', status: 'active' }, pret(300000, 'next')),
    projet('ZZ-L6-ESTIMER', 'ZZ TEST — Hotte d’aspiration au-dessus de la cuve d’ébullition', {}, { timing: 'soon' }),
    projet('ZZ-L6-JOUR', 'ZZ TEST — Pompe de transfert inox', { ...prix(80000), date: '2027-01-11', status: 'active' }, { ...pret(80000, 'next'), datePrecision: 'day' }),
    projet('ZZ-L6-NOV', 'ZZ TEST — Chambre froide posée', { ...prix(50000), date: '2026-11-01', status: 'draft' }, pret(50000))];
}

async function materiel(page: Page, segment: RegExp) {
  await demarrer(page);
  await page.locator('nav button').filter({ hasText: 'Stocks' }).first().tap();
  await page.getByRole('button', { name: 'Matériel', exact: true }).first().tap();
  await page.getByRole('button', { name: segment }).first().tap();
}
const aVenir = async (page: Page) => { await materiel(page, /^À venir/); await expect(page.locator('.kh').first()).toBeVisible({ timeout: 15_000 }); };
const zone = (page: Page) => page.locator('[data-colonne-materiel]').first();

test.describe('Lot 6 : À venir et montants', () => {
  test.beforeEach(async ({ page }) => { await poserFixtureCarnet(page, 'clair', entrees()); });

  test('L-40 : chaque mois d’À venir hors de l’année en cours, ou passé, dit son année ; un mois passé se signale', async ({ page }, info) => {
    await aVenir(page);
    await page.screenshot({ path: info.outputPath('l40-a-venir.png'), fullPage: true });
    const texte = await zone(page).innerText();
    expect(texte, 'aucun « juil. » sans année').not.toMatch(/juil(?:\.|let)(?!\s+20\d\d)/);
    expect(texte).toMatch(/juil(?:\.|let) 2026/);
    expect(texte).toMatch(/juil(?:\.|let) 2027/);
    await expect(zone(page).locator('[data-mois-passe]').first(), 'le mois passé est marqué').toBeVisible();
  });

  test('L-43 : le plan suit le titre du carnet renommé', async ({ page }) => {
    await aVenir(page);
    const texte = await zone(page).innerText();
    expect(texte).toContain(RENOMME);
    expect(texte).not.toContain('Frigo de garde pour fûts');
  });

  test('L-42 : le plan posé sur novembre est choisi sur novembre, et la fiche dit ce que compte le Calendrier', async ({ page }, info) => {
    await aVenir(page);
    await page.locator('.kh-rmain').filter({ hasText: 'Chambre froide posée' }).first().tap();
    const fiche = page.locator('.kh-sheet');
    await expect(fiche).toBeVisible();
    await page.screenshot({ path: info.outputPath('l42-fiche.png') });
    /* D431 : le mois se choisit sur la feuille de date partagée (puces raccourcis + frise) ; novembre est le mois posé, dit en toutes lettres et porté par la frise */
    await expect(fiche.locator('[data-choix-mois]'), 'novembre est le mois choisi').toHaveAttribute('data-valeur', '2026-11');
    await expect(fiche.locator('[data-mois-pose]'), 'novembre est dit').toHaveText(/nov/i);
    await expect(fiche).not.toContainText('mais hors de tes prévisions');
    await expect(fiche).toContainText(/Calendrier/);
  });

  test('L-41 : « Oui, supprimer » se voit en entier sans défiler', async ({ page }, info) => {
    await aVenir(page);
    await page.locator('.kh-rmain').filter({ hasText: 'Chambre froide posée' }).first().tap();
    await page.locator('.kh-sheet').getByRole('button', { name: /^Supprimer/ }).tap();
    await page.waitForTimeout(400);
    await page.screenshot({ path: info.outputPath('l41-supprimer.png') });
    await expect(page.getByRole('button', { name: 'Oui, supprimer' })).toBeInViewport({ ratio: 1 });
  });

  test('L-41 : les titres d’À venir sont entiers (ni rognés ni sous un prix), et chaque cible fait 24 px au moins', async ({ page }, info) => {
    await aVenir(page);
    await page.screenshot({ path: info.outputPath('l41-titres.png'), fullPage: true });
    const defauts = await zone(page).evaluate((racine) => {
      const out: string[] = [];
      for (const b of racine.querySelectorAll<HTMLElement>('button, a, [role=switch]')) {
        const r = b.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && (r.height < 24 || r.width < 24)) out.push(`cible ${Math.round(r.width)}×${Math.round(r.height)} : ${(b.getAttribute('aria-label') || b.textContent || '').trim().slice(0, 40)}`);
      }
      for (const t of racine.querySelectorAll<HTMLElement>('h2, h3, .kh-nm b, b, strong')) {
        if (!/ZZ TEST/.test(t.textContent ?? '')) continue;
        const st = getComputedStyle(t);
        if ((t.scrollWidth > t.clientWidth + 1 && st.textOverflow === 'ellipsis') || (st.webkitLineClamp !== 'none' && st.webkitLineClamp !== '' && t.scrollHeight > t.clientHeight + 1)) out.push(`rogné : ${t.textContent!.slice(0, 40)}`);
        const r = t.getBoundingClientRect();
        for (const p of racine.querySelectorAll<HTMLElement>('.kh-u, .kh-a')) {
          const q = p.getBoundingClientRect();
          if (q.width && r.right > q.left + 1 && r.left < q.right - 1 && r.bottom > q.top + 1 && r.top < q.bottom - 1) out.push(`sous « ${p.textContent?.trim()} » : ${t.textContent!.slice(0, 40)}`);
        }
      }
      return out;
    });
    expect(defauts).toEqual([]);
  });

  test('L-41 : la feuille du projet dit « Prévu le 11 janv. 2027 » et son titre n’est pas coupé sous le budget', async ({ page }, info) => {
    await aVenir(page);
    await page.getByRole('button', { name: 'Modifier ZZ TEST — Pompe de transfert inox' }).first().tap();
    const piste = page.locator('.pjd').first();
    await expect(piste).toBeVisible();
    await page.screenshot({ path: info.outputPath('l41-modifier.png') });
    await expect(piste).not.toContainText('Prévu en 11');
    await expect(piste).toContainText(/Prévu le\s*11 janv\. 2027/);
    const titre = piste.locator('.pjd-titre');
    const [tr, br] = [await titre.boundingBox(), await piste.locator('.pjd-b').boundingBox()];
    expect(tr && br && tr.x + tr.width <= br.x + 1, 'le titre s’arrête avant le budget').toBeTruthy();
    expect(await titre.evaluate((e: HTMLInputElement | HTMLTextAreaElement) => e.scrollWidth <= e.clientWidth + 1 && e.scrollHeight <= e.clientHeight + 1), 'le titre tient entier').toBeTruthy();
  });

  test('L-36 : « 12,345.67 » tapé dans le prix du plan donne 12 345,67', async ({ page }, info) => {
    await aVenir(page);
    await page.getByRole('button', { name: 'Modifier ZZ TEST — Pompe de transfert inox' }).first().tap();
    await page.locator('.pjd [data-station="research"] .pjd-ent').tap();
    const champ = page.getByLabel('Prix estimé TTC (CHF)');
    await champ.tap();
    await page.keyboard.press('Control+A');
    await page.keyboard.type('12,345.67');
    await page.locator('.pjd-titre').tap();
    await page.screenshot({ path: info.outputPath('l36-prix.png') });
    await expect(champ).toHaveValue('12345,67');
    await expect(page.locator('.pjd')).not.toContainText('n’est pas un nombre');
  });

  test('L-39 : recharger avec un prix tapé non enregistré avertit', async ({ page }) => {
    await aVenir(page);
    await page.getByRole('button', { name: 'Modifier ZZ TEST — Pompe de transfert inox' }).first().tap();
    await page.locator('.pjd [data-station="research"] .pjd-ent').tap();
    const champ = page.getByLabel('Prix estimé TTC (CHF)');
    await champ.tap();
    await page.keyboard.press('Control+A');
    await page.keyboard.type('777');
    let avertie = false;
    page.on('dialog', d => { if (d.type() === 'beforeunload') avertie = true; void d.dismiss(); });
    await page.reload({ timeout: 3000 }).catch(() => {});
    expect(avertie, 'le navigateur demande avant de perdre le brouillon').toBe(true);
  });

  test('L-37 : Réalisés dit la date de la facture, pas la date prévue', async ({ page }, info) => {
    await materiel(page, /^Réalisés/);
    await page.waitForTimeout(500);
    await page.screenshot({ path: info.outputPath('l37-realises.png'), fullPage: true });
    const ligne = page.locator('.upgrade-item').filter({ hasText: /Embouteill/ }).first();
    await expect(ligne).toContainText('16 nov. 2026');
  });
});
