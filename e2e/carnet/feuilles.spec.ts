// Le Carnet à la frontière des autres écrans : T11-1 (Au calendrier : prix estimé, à dépenser, Annuler), PC-1 (un geste du Carnet n'écrit que
// chez lui : le stock, les brassins, les dépenses restent), GESTE-DATE-PARTOUT (tout choix de date passe par la frise partagée).
// Données : la fixture simulée du banc carnet.mjs ; tout au doigt.
import { expect, test, type Page } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { CLE_CACHE, demarrer, ouvrirCarnet, ouvrirUnCarnet, poserFixtureCarnet } from '../outils/carnet';

const onglet = (page: Page, nom: string) => page.locator('nav button').filter({ hasText: nom }).first().tap();
/** Le magasin recopié par la fixture (`parcours-carnet:cache`) : les documents d'une collection. */
const docs = (page: Page, collection: string) => page.evaluate(([k, c]) => JSON.parse(localStorage.getItem(k) ?? '[]').filter((e: any) => e.name === c).map((e: any) => ({ id: e.id, data: e.data })), [CLE_CACHE, collection] as const);
const planFrigo = async (page: Page) => (await docs(page, 'financialPlans')).find((p: any) => /^PLAN-CARNET-/.test(p.id) && /Frigo/.test(p.data?.title ?? ''))?.data ?? null;
const cle = (page: Page) => page.locator('[data-ent-cle]').first().innerText().then((t) => t.replace(/\s+/g, ' '));

test.describe('Carnet : au Calendrier, l’argent, les dates', () => {
  test.beforeEach(async ({ page }) => {
    await poserFixtureCarnet(page);
  });

  /* T11-1 (L-26 ; ses mots, 20.11 : « petit bouton ajouter calendrier … on peut aussi lui donner ou estimer directement un prix … En 1 bouton on a
     3 actions ») : « Au calendrier » pose l'achat prévu AVEC le prix estimé, « à dépenser » le compte, et un message offre Annuler */
  test('T11-1 : Carnet › projet › « Au calendrier » porte le prix estimé sur l’achat prévu, « à dépenser » le compte, Annuler le retire', async ({ page }) => {
    await demarrer(page);
    await onglet(page, 'Calendrier');
    await expect(page.locator('[data-calendrier]')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-ent-cle]').first()).toBeVisible();
    const avant = await cle(page);
    await ouvrirCarnet(page);
    await ouvrirUnCarnet(page, 'Frigo + congel');
    const puce = page.getByRole('group', { name: 'Prix estimé' }).getByRole('button').first();
    const centimes = Number(((await puce.innerText()).match(/(\d[\d'’\s ]*)/)?.[1] ?? '').replace(/\D/g, '')) * 100;
    expect(centimes, 'un prix lu sur la puce').toBeGreaterThan(0);
    await puce.tap();
    await page.getByRole('button', { name: /^Au calendrier/ }).first().tap();
    await expect(page.locator('[data-calendrier]')).toBeVisible({ timeout: 15_000 });
    await expect.poll(async () => (await planFrigo(page))?.amountCents ?? null, { message: 'l’achat prévu porte le prix estimé' }).toBe(centimes);
    expect((await planFrigo(page)).direction, 'une sortie (achat)').toBe('out');
    await expect.poll(() => cle(page), { message: '« à dépenser » compte l’achat' }).not.toBe(avant);
    const message = page.locator('[data-message]');
    await expect(message, 'un message suit le geste').toContainText(/Frigo/);
    await message.getByRole('button', { name: /Annuler/ }).tap();
    await expect.poll(() => planFrigo(page), { message: 'Annuler retire l’achat prévu' }).toBeNull();
    await expect.poll(() => cle(page), { message: '« à dépenser » revient' }).toBe(avant);
  });

  /* PC-1 (10.11 : « Le workflow au total a été testé ? … met à jour les stock ») côté Carnet : un geste du Carnet (note, achat prévu, Annuler)
     n'écrit que dans les carnets et les plans ; le brassin, la dépense, le stock, les clients restent identiques */
  test('PC-1 : une note, « Au calendrier » puis Annuler ne touchent ni brassin, ni dépense, ni stock, ni client', async ({ page }) => {
    await ouvrirCarnet(page);
    await ouvrirUnCarnet(page, 'Frigo + congel');
    const garde = async () => {
      const brut: any[] = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '[]'), CLE_CACHE);
      const par: Record<string, string> = {};
      for (const e of brut.filter((x) => !['creativeItems', 'financialPlans', 'auditLogs'].includes(x.name))) (par[e.name] ??= '');
      for (const n of Object.keys(par)) par[n] = JSON.stringify(brut.filter((x) => x.name === n).sort((a, b) => String(a.id).localeCompare(String(b.id))));
      return par;
    };
    await expect.poll(async () => Object.keys(await garde()).length, { message: 'le magasin est rempli' }).toBeGreaterThan(2);
    const avant = await garde();
    await page.locator('textarea').first().tap();
    await page.locator('textarea').first().pressSequentially('prendre un modèle à 2 portes, 180 cm');
    await page.getByRole('button', { name: /^Ajouter$/ }).tap();
    await expect(page.getByRole('button', { name: /^Note : Prendre un modèle à 2 portes/ })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('group', { name: 'Prix estimé' }).getByRole('button').first().tap();
    await page.getByRole('button', { name: /^Au calendrier/ }).first().tap();
    await expect(page.locator('[data-calendrier]')).toBeVisible({ timeout: 15_000 });
    await expect.poll(() => planFrigo(page)).not.toBeNull();
    await page.locator('[data-message]').getByRole('button', { name: /Annuler/ }).tap();
    await expect.poll(() => planFrigo(page)).toBeNull();
    const apres = await garde();
    for (const n of new Set([...Object.keys(avant), ...Object.keys(apres)])) expect(apres[n], `la collection « ${n} » n'a pas bougé`).toBe(avant[n]);
    expect(await docs(page, 'batches'), 'le brassin du Calendrier est là').not.toHaveLength(0);
  });

  /* GESTE-DATE-PARTOUT (22.11 : « Plus je teste et plus je trouve des endroits où le geste au doigt choisi et porté PARTOUT n'a pas été porté ») :
     tout choix de date ou de période utilise la frise partagée ; ici la rubrique « Quand » d'un carnet */
  test('GESTE-DATE-PARTOUT : le contrôle statique du dépôt ne voit aucun champ de date maison', async () => {
    const r = spawnSync(process.execPath, ['scripts/agents/controle-geste-date.mjs'], { cwd: process.cwd(), encoding: 'utf8' });
    expect(r.stdout, 'sortie du contrôle').toMatch(/GESTE-DATE OK/);
  });

  test('CA12-PW-2 GESTE-DATE-PARTOUT : la rubrique « Quand » d’un carnet choisit sa date sur la frise partagée, sans rangée de puces d’horizon', async ({ page }) => {
    test.fail(true, 'CA12-PW-2 : « Quand » est une rangée de puces (Aujourd’hui, 1 mois … 1 an, Plus tard), aucune frise partagée (.cal-f-duree) ; voir DEFAUTS.md');
    await ouvrirCarnet(page);
    await ouvrirUnCarnet(page, 'Frigo + congel');
    const quand = page.locator('[data-carnets] section[aria-label="Quand"]');
    await expect(quand).toBeVisible();
    await expect(quand.locator('.cal-f-duree'), 'la frise partagée est dans la rubrique').toHaveCount(1);
    const puces = await quand.getByRole('button').count();
    expect(puces, 'plus de 4 puces d’horizon : une réglette maison').toBeLessThanOrEqual(4);
  });

  test('GESTE-DATE-PARTOUT : la date posée par « Au calendrier » se retrouve sur la frise du Calendrier, à l’horizon choisi', async ({ page }) => {
    await ouvrirCarnet(page);
    await ouvrirUnCarnet(page, 'Frigo + congel');
    const quand = page.locator('[data-carnets] section[aria-label="Quand"]');
    await quand.getByRole('button', { name: '1 mois' }).tap();
    await page.getByRole('button', { name: /^Au calendrier/ }).first().tap();
    await expect(page.locator('[data-calendrier]')).toBeVisible({ timeout: 15_000 });
    await expect.poll(async () => (await planFrigo(page))?.date ?? null).not.toBeNull();
    const date = (await planFrigo(page)).date as string;
    const jours = (Date.parse(`${date}T12:00:00Z`) - Date.parse('2026-11-23T12:00:00Z')) / 86_400_000;
    expect(jours, `la date posée (${date}) est dans environ 1 mois`).toBeGreaterThan(20);
    expect(jours).toBeLessThan(45);
    await expect(page.locator('[data-frise] [data-chose$="PLAN-CARNET-CARNET-PLANNING-T-13"]').first(), 'la barre de l’achat est sur la frise').toBeAttached();
  });
});
