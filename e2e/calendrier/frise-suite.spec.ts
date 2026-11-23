// La frise du Calendrier, suite de la liste du tour 10 (dépôt Brasserie, work/missions/2026-11-23-calendrier-en-ligne/LISTE.md, classe (a)).
// Chaque test a été vu rouge sur l'arbre avant son correctif. Données : la fixture simulée des bancs du parcours.
import { expect, test, type Page } from '@playwright/test';
import { Doigt } from '../outils/doigt';
import { boiteCadre, boutonPeriode, choisirPeriode, ouvrirCalendrier, poserFixture } from '../outils/calendrier';

/** Le groupe « Échelle » du menu (Jour, Semaine, Mois) : le choix qui montre « Échelle … · Annuler ». */
async function choisirEchelle(page: Page, nom: 'Jour' | 'Semaine' | 'Mois') {
  await boutonPeriode(page).tap();
  const menu = page.getByRole('dialog', { name: 'Période et vue' });
  await menu.getByRole('group', { name: 'Échelle' }).getByRole('button', { name: nom, exact: true }).tap();
  await expect(menu).toBeHidden();
}

const etiquetteCadre = (page: Page) => page.evaluate(() => (document.querySelector('[data-cadre-etiquette]')?.textContent ?? '').replace(/\s+/g, ' ').trim());

test.describe('Frise du Calendrier, suite (tour 10)', () => {
  test.beforeEach(async ({ page }) => {
    await poserFixture(page);
    await ouvrirCalendrier(page);
  });

  /* L-11 (T10-11, M2-4) : le bandeau « Échelle … · Annuler » disparaissait vers 1,5 s ; le code dit 7 s (Message.tsx) */
  for (const defile of [false, true]) for (const depuis of ['6 sem.', '3 mois', '6 mois', 'An']) for (const ech of ['Jour', 'Semaine', 'Mois'] as const) {
    test(`L-11 : depuis ${depuis}${defile ? ', page descendue au bas des rangées' : ''}, échelle ${ech} : Annuler reste au moins 4 s, et touché alors il rend la fenêtre d'avant`, async ({ page }) => {
      await choisirPeriode(page, '2 sem.');
      await choisirPeriode(page, depuis);
      const e0 = await etiquetteCadre(page);
      /* le brasseur a descendu la liste des rangées : une échelle qui raccourcit la page fait défiler le navigateur de lui-même */
      if (defile) { await page.mouse.wheel(0, 3000); await page.waitForTimeout(400); }
      await choisirEchelle(page, ech);
      const annuler = page.locator('[data-message]').getByRole('button', { name: /Annuler/ });
      if (!(await annuler.count())) { test.skip(true, `${depuis} → ${ech} : aucun changement de période, aucun Annuler`); return; }
      await page.waitForTimeout(1500);
      await expect(annuler, 'Annuler est encore là à 1,5 s').toBeVisible();
      await page.waitForTimeout(2500);
      await expect(annuler, 'Annuler est encore là à 4 s').toBeVisible();
      await annuler.tap();
      await expect.poll(() => etiquetteCadre(page), { message: 'Annuler rend la fenêtre d’avant' }).toBe(e0);
    });
  }

  /* L-10 (T10-10, M5-8, M2 §5) : la même fenêtre « An » disait « nov. 2026 – nov. 2027 » par le menu et « S47 – S45 2027 » au chargement */
  test('L-10 : une fenêtre An dit la même étiquette par le menu et après un rechargement', async ({ page }) => {
    await choisirPeriode(page, 'An');
    const parMenu = await etiquetteCadre(page);
    await page.reload();
    await expect(page.locator('.ent-cadre')).toBeAttached({ timeout: 60_000 });
    await page.waitForTimeout(500);
    expect(await etiquetteCadre(page), `par le menu « ${parMenu} »`).toBe(parMenu);
  });

  /* L-13 (T10-13, M2-7) : à 1 semaine, glisser le corps de 110 px ne bougeait rien (la pose est à la semaine, 248 px, et le cadre n'était
     dessiné qu'aux semaines entières). Attendu (frise B R2) : le cadre accompagne le doigt, et se pose à la semaine au lâcher. */
  test('L-13 : à 1 semaine, le cadre suit le doigt pendant le glisser et se pose à la semaine au lâcher', async ({ page }) => {
    await choisirPeriode(page, '2 sem.');
    await choisirPeriode(page, '6 sem.');
    const doigt = await Doigt.sur(page);
    let g = (await boiteCadre(page))!;
    await doigt.glisser({ x: g.r - 1, y: g.y }, { x: g.l - 3, y: g.y });
    await page.waitForTimeout(400);
    g = (await boiteCadre(page))!;
    const e0 = await etiquetteCadre(page), largeur = g.r - g.l;
    expect(largeur, 'une semaine est large (pose à la semaine)').toBeGreaterThan(120);
    let pendant = g.l;
    await doigt.glisser({ x: (g.l + g.r) / 2, y: g.y }, { x: (g.l + g.r) / 2 + 60, y: g.y }, { dureeMs: 400, avantLeve: async () => { pendant = (await boiteCadre(page))!.l; } });
    expect(pendant - g.l, `le cadre a suivi le doigt de 60 px (${g.l} → ${pendant})`).toBeGreaterThanOrEqual(40);
    await page.waitForTimeout(500);
    const apres = (await boiteCadre(page))!;
    expect(Math.abs(apres.l - g.l), 'au lâcher (60 px < une demi-semaine), le cadre revient à sa semaine').toBeLessThanOrEqual(2);
    expect(await etiquetteCadre(page)).toBe(e0);
  });
});
