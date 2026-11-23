// Le calendrier global (focus 2 de la liste du tour 10, dépôt Brasserie, work/missions/2026-11-23-calendrier-en-ligne/LISTE.md) : les feuilles du +.
// Chaque test a été vu rouge sur l'arbre avant son correctif. Données : la fixture simulée des bancs du parcours.
import { expect, test, type Page } from '@playwright/test';
import { CLE_CACHE, ouvrirCalendrier, periodeApp, poserFixture } from '../outils/calendrier';

/** Le + volant du Calendrier, puis une ligne de sa pile (« Poser un brassin », « Noter une idée »…). */
async function plus(page: Page, ligne: RegExp) {
  await page.getByRole('button', { name: 'Actions rapides' }).tap();
  await page.getByRole('menuitem', { name: ligne }).first().tap();
  const feuille = page.getByRole('dialog').last();
  await expect(feuille).toBeVisible();
  return feuille;
}

/** Les groupes de boutons de semaine (« S47 … ») de plus de 8 boutons : un carrousel de puces de semaine, hors frise partagée. */
const carrousels = (page: Page) => page.evaluate(() => [...document.querySelectorAll('[role="dialog"] [role="group"]')]
  .map((g) => [...g.querySelectorAll('button')].filter((b) => /^S\d+/.test((b.textContent ?? '').trim())).length).filter((n) => n > 8));

test.describe('Calendrier global : les feuilles du + (tour 10)', () => {
  test.beforeEach(async ({ page }) => {
    await poserFixture(page);
    await ouvrirCalendrier(page);
  });

  /* L-14 (T10-14, M3-5, GESTE-DATE-PARTOUT : « tout choix de date ou de période de l'app utilise la frise partagée ») : Poser un brassin n'avait
     que des puces d'horizon, Noter une idée 104 puces de semaine ; aucune frise */
  for (const [nom, ligne] of [['Poser un brassin', /^Poser un brassin/], ['Noter une idée', /^Noter une idée/]] as const) {
    test(`L-14 : « ${nom} » choisit sa date sur la frise partagée, sans carrousel de semaines`, async ({ page }) => {
      const feuille = await plus(page, ligne);
      await expect(feuille.locator('.cal-f-duree'), 'la frise partagée est dans la feuille').toHaveCount(1);
      expect(await carrousels(page), 'aucun groupe de plus de 8 boutons de semaine').toEqual([]);
    });
  }

  /* L-36 (T10-36, M4-2) : « Durée 1 semaine jusqu'à S47 » pour une chose posée sur un seul jour (T9-3) */
  for (const ligne of [/^Poser une fête/, /^Prévoir un achat/, /^Prévoir des travaux/]) {
    test(`L-36 : « ${ligne.source.slice(1)} » ouverte sans durée tirée dit « 1 j », jamais « 1 semaine »`, async ({ page }) => {
      const feuille = await plus(page, ligne);
      const duree = feuille.locator('[data-duree-texte]');
      if (await duree.count()) await expect(duree).toHaveText('1 j');
      await expect(feuille.getByText(/1 semaine/)).toHaveCount(0);
    });
  }

  /* L-37 (T10-37, M4-3, CAL-ENTETE : « il faudrait des tailles fix car SI non ça fait bouger le calendrier ») : une rafale sur ‹ de la période de
     l'app ne prenait que 2 pas sur 5 : le libellé change de largeur, le bouton glisse sous le doigt */
  test('L-37 : cinq touchers rapides au même endroit sur ‹ de l’app font cinq pas, le bouton ne bouge pas', async ({ page }) => {
    const prec = page.getByRole('button', { name: 'Période précédente' }).first();
    const b0 = (await prec.boundingBox())!;
    const x = b0.x + 6, y = b0.y + b0.height / 2; // le doigt vise le côté gauche du bouton, comme au pouce
    const vus = [await periodeApp(page)];
    for (let k = 0; k < 5; k++) {
      await page.touchscreen.tap(x, y);
      await page.waitForTimeout(180);
      const b = (await prec.boundingBox())!;
      expect(Math.abs(b.x - b0.x), `‹ reste en place après le pas ${k + 1} (${b0.x} → ${b.x})`).toBeLessThanOrEqual(1);
      vus.push(await periodeApp(page));
    }
    expect(new Set(vus).size, `cinq pas, six périodes : ${vus.join(' · ')}`).toBe(6);
  });

  /* L-26 (T10-26, M3-4 ; ses mots, 20.11 : « petit bouton ajouter calendrier, ça l'ajout à la date du jour, ça nous transférer sur le calendrier
     pour que on puisse le déplacer facilement, et on peut aussi lui donner ou estimer directement un prix... En 1 bouton on a 3 action ») :
     « Au calendrier » ne posait qu'une ampoule, aucun achat prévu, l'argent inchangé */
  test('L-26 : Carnet › projet › « Au calendrier » crée l’achat prévu du projet et le montre au Calendrier', async ({ page }) => {
    const tab = (nom: string) => page.locator('nav button').filter({ hasText: nom }).first().tap();
    await tab('Brassins');
    await page.getByRole('button', { name: /^Atelier/ }).first().tap();
    await page.getByText('ZZ TEST Projet chambre froide').first().tap();
    await page.getByRole('button', { name: /^Au calendrier/ }).first().tap();
    await expect(page.locator('[data-calendrier]')).toBeVisible({ timeout: 15_000 });
    const plan = () => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '[]').find((x: any) => x.id === 'PLAN-CARNET-CARNET-ZZ-K2')?.data ?? null, CLE_CACHE);
    await expect.poll(plan, { message: 'un achat prévu du projet est écrit' }).not.toBeNull();
    expect((await plan()).direction, 'une sortie (achat)').toBe('out');
    await expect(page.locator('[data-frise] [data-chose$="PLAN-CARNET-CARNET-ZZ-K2"]').first(), 'l’achat est montré au Calendrier').toBeAttached();
  });

  /* T11-1 (L-26, contre-épreuve du tour 11) : le prix estimé du projet (100 ou 200 CHF) n'était pas porté sur l'achat posé (« Noter le prix »),
     « à dépenser » ne bougeait pas, et aucun Annuler ne suivait « Au calendrier » */
  test('T11-1 : « Au calendrier » porte le prix estimé sur l’achat prévu, l’argent le compte, et Annuler le retire', async ({ page }) => {
    const cle = page.locator('[data-ent-cle]').first();
    await expect(cle).toBeVisible();
    const avant = (await cle.innerText()).replace(/\s+/g, ' ');
    const tab = (nom: string) => page.locator('nav button').filter({ hasText: nom }).first().tap();
    await tab('Brassins');
    await page.getByRole('button', { name: /^Atelier/ }).first().tap();
    await page.getByText('ZZ TEST Projet chambre froide').first().tap();
    /* le prix proposé (un achat semblable, ou un ordre de grandeur) : celui que l'achat prévu doit porter */
    const puce = page.getByRole('group', { name: 'Prix estimé' }).getByRole('button').first();
    const centimes = Number(((await puce.innerText()).match(/(\d[\d'’\s\u202f]*) CHF/)?.[1] ?? '').replace(/\D/g, '')) * 100;
    expect(centimes, 'un prix lu sur la puce').toBeGreaterThan(0);
    await puce.tap();
    await page.getByRole('button', { name: /^Au calendrier/ }).first().tap();
    await expect(page.locator('[data-calendrier]')).toBeVisible({ timeout: 15_000 });
    const plan = () => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '[]').find((x: any) => x.id === 'PLAN-CARNET-CARNET-ZZ-K2')?.data ?? null, CLE_CACHE);
    await expect.poll(async () => (await plan())?.amountCents ?? null, { message: 'l’achat prévu porte le prix estimé' }).toBe(centimes);
    await expect.poll(async () => (await page.locator('[data-ent-cle]').first().innerText()).replace(/\s+/g, ' '), { message: '« à dépenser » compte l’achat' }).not.toBe(avant);
    const message = page.locator('[data-message]');
    await expect(message, 'un message suit le geste').toContainText(/ZZ TEST Projet chambre froide/);
    await message.getByRole('button', { name: /Annuler/ }).tap();
    await expect.poll(plan, { message: 'Annuler retire l’achat prévu' }).toBeNull();
    await expect(page.locator('[data-frise] [data-chose$="PLAN-CARNET-CARNET-ZZ-K2"]'), 'la frise ne le montre plus').toHaveCount(0);
    await expect.poll(async () => (await page.locator('[data-ent-cle]').first().innerText()).replace(/\s+/g, ' '), { message: '« à dépenser » revient' }).toBe(avant);
  });

  /* L-28 (T10-28, M3-8 ; D412) : la fiche d'un brassin n'avait pas « … › Supprimer » ; un brassin PRÉVU se supprime, Annuler le rend */
  test('L-28 : la fiche d’un brassin prévu a « … › Supprimer », et Annuler le rend', async ({ page }) => {
    const barre = page.locator('[data-frise] [data-chose$="B-BLONDE"]').first();
    await barre.scrollIntoViewIfNeeded();
    const r = (await barre.boundingBox())!;
    await page.touchscreen.tap(r.x + Math.min(40, r.width / 2), r.y + r.height / 2);
    const fiche = page.locator('[data-detail]');
    await expect(fiche).toBeVisible();
    await fiche.getByRole('button', { name: 'Plus d’actions' }).tap();
    await fiche.locator('[data-supprimer]').tap();
    await expect(page.locator('[data-frise] [data-chose$="B-BLONDE"]'), 'la barre quitte la frise').toHaveCount(0);
    await page.locator('[data-message]').getByRole('button', { name: /Annuler/ }).tap();
    await expect(page.locator('[data-frise] [data-chose$="B-BLONDE"]').first(), 'Annuler rend le brassin').toBeAttached();
  });

  /* L-15 (T10-15, M5-9) : une date d'une autre année s'écrivait comme celle de l'année en cours (« 15 févr. » pour 2027) ; le + disait « S15 » */
  test('L-15 : la fiche d’une chose de l’an prochain dit son année', async ({ page }) => {
    const tab = (nom: string) => page.locator('nav button').filter({ hasText: nom }).first().tap();
    await tab('Brassins');
    await page.getByRole('button', { name: /^Atelier/ }).first().tap();
    await page.getByText('ZZ TEST Projet chambre froide').first().tap();
    await page.getByRole('button', { name: /^Au calendrier/ }).first().tap();
    const fiche = page.locator('[data-detail]');
    await expect(fiche).toBeVisible({ timeout: 15_000 });
    const an = new Date().getFullYear() + 1;
    await expect(fiche.locator('time').first(), 'la date de la fiche dit son année').toContainText(String(an));
    await fiche.getByRole('button', { name: /Fermer/ }).first().tap().catch(() => undefined);
  });
});
