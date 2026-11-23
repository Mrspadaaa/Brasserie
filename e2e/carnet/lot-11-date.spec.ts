// Lot 11 du Carnet (23.11) : D431, GESTE-DATE-PARTOUT (ses mots du 22.11 : « Plus je teste et plus je trouve des endroits où le geste au doigt choisi et
// porté PARTOUT n'a pas été porté »). Quatre lieux, tous au doigt, sur la feuille de date partagée (puces raccourcis + frise) :
//   2. À venir : « Fixer la date » et « Posé sur » (CA12-M4-20) ; 3. feuille Modifier du Calendrier : les jours (T11-22) ;
//   4. fiche du Calendrier d'un achat du Carnet : la pastille de date réagit (CA12-M4-19). Le lieu 1 (Quand du carnet, CA12-PW-2) est dans feuilles.spec.ts.
// Fixtures simulées (Carnet : un projet « ZZ TEST » sans date ; Calendrier : celle des bancs du parcours), jour figé 23.11.2026.
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';
import { HORIZONS } from '../../src/domain/horizons';
import { Doigt } from '../outils/doigt';
import { CLE_CACHE as CACHE_CARNET, demarrer, lireFixtureCarnet, poserFixtureCarnet } from '../outils/carnet';
import { CLE_CACHE as CACHE_CAL, choisirPeriode, dateChose, ouvrirCalendrier, poserFixture } from '../outils/calendrier';

const ID_PROJET = 'ZZ-L11-SANS-DATE';
const TITRE_PROJET = 'ZZ TEST — Étagère de cave sans date';

function entrees() {
  const fx = lireFixtureCarnet();
  const base = fx.entrees.filter((e: any) => e.name !== 'financialPlans');
  return [...base, { name: 'financialPlans', id: ID_PROJET, data: {
    id: ID_PROJET, title: TITRE_PROJET, date: '', amountCents: 50000, direction: 'out', category: 'materiel', source: 'equipment', status: 'draft', createdAt: '2026-11-10T10:00:00.000Z',
    upgrade: { version: 1, timing: 'soon', stage: 'ready', budgetKnown: true, purchaseCents: 50000, datePrecision: 'month', estimateSource: 'estimate' } } }];
}
const planDate = (page: Page) => page.evaluate(([k, id]) => JSON.parse(localStorage.getItem(k) ?? '[]').find((e: any) => e.id === id)?.data?.date ?? null, [CACHE_CARNET, ID_PROJET] as const);

/** Tire le repère de la frise partagée de `racine` de `n` unités (semaines ou jours), au doigt, comme le brasseur. */
async function tirer(page: Page, racine: Locator, n: number) {
  const poi = racine.locator('[data-date-point]').first();
  await poi.scrollIntoViewIfNeeded();
  const piste = racine.locator('.cal-f-duree-piste').first();
  const jour = (await racine.locator('.cal-f-duree').first().getAttribute('data-pas')) === 'jour';
  const px = Number(await piste.getAttribute(jour ? 'data-px-jour' : 'data-px-semaine'));
  const b = (await poi.boundingBox())!;
  const a = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  await (await Doigt.sur(page)).glisser(a, { x: a.x + n * px, y: a.y });
}
const jour = (iso: string, n: number) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
/** La capture attend la fin des transitions de la frise (200 ms) : un repère à mi-course se lirait comme un chevauchement. */
const capture = async (page: Page, info: TestInfo, nom: string) => { await page.waitForTimeout(450); await page.screenshot({ path: info.outputPath(`${nom}.png`) }); };
/** Une cible se touche à 44 px au moins (le plancher d'ici : 40 px pour une puce, la frise a 44). */
async function cibles(l: Locator, min = 36) {
  const bas: string[] = [];
  for (const b of await l.all()) { const r = await b.boundingBox(); if (r && r.height < min) bas.push(`${(await b.innerText()).trim()} ${Math.round(r.height)}px`); }
  return bas;
}

test.describe('Lot 11 : le choix d’une date, partout, sur la frise partagée (D431)', () => {
  test.describe('À venir (CA12-M4-20)', () => {
    test.beforeEach(async ({ page }) => { await poserFixtureCarnet(page, 'clair', entrees()); });

    async function ouvrirAVenir(page: Page) {
      await demarrer(page);
      await page.locator('nav button').filter({ hasText: 'Stocks' }).first().tap();
      await page.getByRole('button', { name: 'Matériel', exact: true }).first().tap();
      await page.getByRole('button', { name: /^À venir/ }).first().tap();
      await expect(page.getByRole('region', { name: 'Prochain achat' }).or(page.locator('[aria-label="Prochain achat"]')).first()).toBeVisible({ timeout: 15_000 });
    }

    test('« Fixer la date » ouvre les puces raccourcis et la frise partagée, plus la grille de mois ; un raccourci puis un glisser datent le projet', async ({ page }, info) => {
      await ouvrirAVenir(page);
      const carte = page.locator('[data-prochain-carnet]');
      await capture(page, info, 'avenir-1-avant');
      await carte.getByRole('button', { name: 'Fixer la date' }).tap();
      await expect(carte.locator('.kh-mo'), 'plus de grille de mois maison').toHaveCount(0);
      const groupe = carte.getByRole('group', { name: /sur un mois/ });
      await expect(groupe).toBeVisible();
      const libelles = HORIZONS.map((h) => h.libelle);
      for (const t of await groupe.getByRole('button').allInnerTexts()) expect(libelles, `« ${t} » est une puce de Horizons`).toContain(t.trim());
      await expect(carte.locator('.cal-f-duree'), 'la frise partagée').toHaveCount(1);
      expect(await cibles(groupe.getByRole('button')), 'cibles des puces').toEqual([]);
      await capture(page, info, 'avenir-2-frise-ouverte');
      await groupe.getByRole('button', { name: '3 mois' }).tap();
      await expect.poll(() => planDate(page), { message: '« 3 mois » date le projet' }).toMatch(/^2027-0[1-3]-01$/);
      const d1 = await planDate(page);
      await carte.getByRole('button', { name: /^Date :/ }).tap();
      await expect(carte.locator('.cal-f-duree')).toHaveCount(1);
      await tirer(page, carte, 14);
      await expect.poll(() => planDate(page), { message: 'tirer le repère de 14 semaines déplace le mois' }).not.toBe(d1);
      expect((await planDate(page)) > d1, 'plus tard').toBe(true);
      await capture(page, info, 'avenir-3-apres');
    });

    test('« Posé sur » de la fiche du projet : puces raccourcis et frise partagée ; « Plus tard » retire la date', async ({ page }, info) => {
      await ouvrirAVenir(page);
      await page.locator('[data-prochain-carnet] h2 button').first().tap();
      const fiche = page.locator('.kh-sheet');
      await expect(fiche).toBeVisible();
      await expect(fiche.locator('.kh-mo'), 'plus de grille de mois maison').toHaveCount(0);
      await expect(fiche.locator('.cal-f-duree'), 'la frise partagée').toHaveCount(1);
      await capture(page, info, 'fiche-1-avant');
      await fiche.getByRole('group', { name: /sur un mois/ }).getByRole('button', { name: '1 mois' }).tap();
      await expect.poll(() => planDate(page), { message: '« 1 mois » date le projet' }).toMatch(/^2026-12-01$|^2027-01-01$/);
      const d1 = await planDate(page);
      await tirer(page, fiche, 12);
      await expect.poll(() => planDate(page), { message: 'le glisser déplace le mois' }).not.toBe(d1);
      await capture(page, info, 'fiche-2-apres');
      await fiche.getByRole('group', { name: /sur un mois/ }).getByRole('button', { name: 'Plus tard' }).tap();
      await expect.poll(() => planDate(page), { message: '« Plus tard » retire la date' }).toBe('');
    });
  });

  test.describe('Calendrier : feuille Modifier (T11-22) et fiche (CA12-M4-19)', () => {
    test.beforeEach(async ({ page }) => { await poserFixture(page); await ouvrirCalendrier(page); });

    async function ouvrirFiche(page: Page, suffixe: string) {
      /* en 844 × 340 la barre des Travaux (la plus basse des rangées) ne se touche pas sous l'en-tête fixe : jouée à 390 et 1280 */
      test.skip(test.info().project.name === 'paysage-844' && suffixe === 'P-ZZ-GESTE', 'barre des Travaux hors d’atteinte du doigt en 844 × 340');
      await choisirPeriode(page, '6 mois');
      const barre = page.locator(`[data-frise] [data-chose$="${suffixe}"]`).first();
      await barre.scrollIntoViewIfNeeded();
      const r = (await barre.boundingBox())!;
      await page.touchscreen.tap(r.x + Math.min(40, r.width / 2), r.y + r.height / 2);
      const fiche = page.locator('[data-detail]');
      await expect(fiche).toBeVisible();
      return fiche;
    }
    async function ouvrirModifier(page: Page, suffixe: string) {
      const fiche = await ouvrirFiche(page, suffixe);
      const direct = fiche.getByRole('button', { name: /^Modifier/ });
      if (!(await direct.count())) await fiche.getByRole('button', { name: 'Plus d’actions' }).tap();
      await fiche.getByRole('button', { name: /^Modifier/ }).first().tap();
      const feuille = page.locator('[data-feuille-rangee][data-mode="modifier"]');
      await expect(feuille).toBeVisible();
      return feuille;
    }

    test('Modifier une chose d’un jour : le jour se choisit sur la frise partagée au jour, avec le mois ; plus de rangée « L 8 … D 14 »', async ({ page }, info) => {
      const feuille = await ouvrirModifier(page, 'CR-NOEL');
      await expect(feuille.locator('[data-feuille-jours], .cal-f-jour'), 'plus de rangée de jours maison').toHaveCount(0);
      const choix = feuille.locator('[data-choix-date]');
      await expect(choix, 'un choix de date au jour').toHaveCount(1);
      const avant = (await choix.getAttribute('data-valeur'))!;
      expect(avant).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      await expect(feuille, 'le jour est dit avec son mois').toContainText(/\d{1,2} (janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc)/);
      await capture(page, info, 'modifier-1-jour-avant');
      await choix.locator('[data-choix-date-pastille]').tap();
      await expect(feuille.locator('.cal-f-duree-jour'), 'la frise au jour s’ouvre au toucher de la pastille').toHaveCount(1);
      await tirer(page, choix, 4);
      await expect.poll(() => choix.getAttribute('data-valeur'), { message: 'le jour est tiré de 4 jours' }).toBe(jour(avant, 4));
      await capture(page, info, 'modifier-2-jour-apres');
      await page.locator('[data-ajouter]').tap();
      await expect(feuille).toBeHidden();
      await expect.poll(() => dateChose(page, 'CR-NOEL'), { message: 'Enregistrer écrit le jour tiré' }).toBe(jour(avant, 4));
    });

    test('Modifier une chose à une seule date (papier) : la frise au jour est ouverte d’emblée, la frise de semaine n’y est plus', async ({ page }, info) => {
      const feuille = await ouvrirModifier(page, 'P-PAPIER');
      await expect(feuille.locator('[data-feuille-jours], .cal-f-jour'), 'plus de rangée de jours maison').toHaveCount(0);
      const choix = feuille.locator('[data-choix-date]');
      await expect(choix.locator('.cal-f-duree-jour'), 'la frise au jour est là').toHaveCount(1);
      await expect(feuille.locator('.cal-f-duree:not(.cal-f-duree-jour)'), 'plus de frise de semaine en double').toHaveCount(0);
      await expect(feuille.locator('[data-jour-dit]'), 'le jour est dit avec son mois, une fois').toContainText(/\d{1,2} (janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc)/);
      const avant = (await choix.getAttribute('data-valeur'))!;
      await capture(page, info, 'papier-1-avant');
      await tirer(page, choix, 2);
      await expect.poll(() => choix.getAttribute('data-valeur'), { message: 'le jour est tiré de 2 jours' }).toBe(jour(avant, 2));
      await capture(page, info, 'papier-2-apres');
      await page.locator('[data-ajouter]').tap();
      await expect.poll(() => dateChose(page, 'P-PAPIER'), { message: 'Enregistrer écrit le jour tiré' }).toBe(jour(avant, 2));
    });

    test('Modifier une chose de plusieurs semaines : le jour du début et celui de la fin se choisissent sur la frise au jour', async ({ page }, info) => {
      const feuille = await ouvrirModifier(page, 'P-ZZ-GESTE');
      await expect(feuille.locator('[data-feuille-jours], .cal-f-jour'), 'plus de rangées de jours maison').toHaveCount(0);
      const debut = feuille.locator('[data-choix-date-label="Jour du début"]');
      const fin = feuille.locator('[data-choix-date-label="Jour de la fin"]');
      await expect(debut).toHaveCount(1);
      await expect(fin).toHaveCount(1);
      await capture(page, info, 'plage-1-avant');
      const d0 = (await debut.getAttribute('data-valeur'))!, f0 = (await fin.getAttribute('data-valeur'))!;
      await debut.locator('[data-choix-date-pastille]').tap();
      await tirer(page, debut, 1);
      await expect.poll(() => debut.getAttribute('data-valeur'), { message: 'le jour du début avance de 1' }).toBe(jour(d0, 1));
      await fin.locator('[data-choix-date-pastille]').tap();
      await tirer(page, fin, -2);
      await expect.poll(() => fin.getAttribute('data-valeur'), { message: 'le jour de la fin recule de 2' }).toBe(jour(f0, -2));
      await capture(page, info, 'plage-2-apres');
    });

    test('la fiche d’un achat du Carnet : la pastille de date a l’air d’un bouton et déplace la chose', async ({ page }, info) => {
      const tab = (nom: string) => page.locator('nav button').filter({ hasText: nom }).first().tap();
      await tab('Brassins');
      await page.getByRole('button', { name: /^Atelier/ }).first().tap();
      await page.getByText('ZZ TEST Projet chambre froide').first().tap();
      await page.getByRole('button', { name: /^Au calendrier/ }).first().tap();
      const fiche = page.locator('[data-detail]');
      await expect(fiche).toBeVisible({ timeout: 15_000 });
      const pastille = fiche.locator('[data-pastille="debut"]');
      await expect(pastille, 'la pastille de date est un bouton').toHaveJSProperty('tagName', 'BUTTON');
      const plan = () => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '[]').find((x: any) => x.id === 'PLAN-CARNET-CARNET-ZZ-K2')?.data?.date ?? null, CACHE_CAL);
      await expect.poll(plan).not.toBeNull();
      const avant = (await plan()) as string;
      await capture(page, info, 'fiche-achat-1-avant');
      await pastille.tap();
      await expect(fiche.locator('.cal-f-duree-jour'), 'la frise au jour s’ouvre').toHaveCount(1);
      await capture(page, info, 'fiche-achat-2-frise');
      await tirer(page, fiche, 5);
      await expect.poll(plan, { message: 'tirer le repère déplace l’achat prévu' }).not.toBe(avant);
      await capture(page, info, 'fiche-achat-3-apres');
    });
  });
});
