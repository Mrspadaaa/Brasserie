// E-2 (LISTE du 23.11 ; M1-20, M2-8, M3-16, T10-M2-1, D429) : après une mise en ligne, recharger ou rouvrir l'app sert la nouvelle version.
// Vrai service worker (Workbox), deux versions servies avec les en-têtes de firebase.json et la réécriture « ** → /index.html ».
// Version A : le build de test des e2e. Version B : la même, avec une coquille marquée (`window.__build = 'B'`) et la révision de
// `index.html` changée dans `sw.js` : le navigateur y voit une nouvelle version, comme après `firebase deploy`.
// Le testeur (ou le brasseur) touche un champ dès que l'app s'affiche : la version qui arrive pendant ce temps reste en attente
// (bandeau, D429). Le rechargement ordinaire doit alors la prendre, sans fermer l'onglet.
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import { expect, test, type Page } from '@playwright/test';
import minimatch from 'minimatch';
import { lireFixtureCarnet, ouvrirCarnet, ouvrirUnCarnet, poserFixtureCarnet, surListe } from '../outils/carnet';

const REF = process.env.E2E_REF || '';
const NOM = REF ? REF.replace(/[^\w.-]+/g, '_') : 'arbre';
const BUILD = process.env.E2E_BUILD || path.join(os.tmpdir(), 'affinee-e2e', NOM);
const URL_APP = '/?dev-local&finance-demo=parcours-carnet';

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json', '.wasm': 'application/wasm',
};
type Bloc = { source: string; headers: { key: string; value: string }[] };
const ENTETES: Bloc[] = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase.json'), 'utf8')).hosting.headers;
const correspond = (source: string, p: string) => source.startsWith('/') ? minimatch(p, source) : minimatch(p.slice(1), source, { dot: true });

/** Deux racines : A (le build), B (A avec une coquille et un `sw.js` nouveaux). */
function preparerVersions() {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'affinee-e2-'));
  const A = path.join(base, 'A'), B = path.join(base, 'B');
  fs.cpSync(BUILD, A, { recursive: true });
  fs.cpSync(BUILD, B, { recursive: true });
  const html = fs.readFileSync(path.join(B, 'index.html'), 'utf8');
  fs.writeFileSync(path.join(B, 'index.html'), html.replace('<head>', "<head><script>window.__build='B'</script>"));
  const sw = fs.readFileSync(path.join(B, 'sw.js'), 'utf8');
  const sw2 = sw.replace(/(url:"index\.html",revision:")[^"]+"/, '$1version-b"');
  if (sw2 === sw) throw new Error('révision de index.html introuvable dans sw.js');
  fs.writeFileSync(path.join(B, 'sw.js'), sw2);
  return { A, B };
}

/** Serveur local fidèle à l'hébergement : en-têtes de firebase.json (le dernier bloc qui correspond l'emporte), réécriture vers /index.html. */
function servir(racines: Record<string, string>) {
  let courante = 'A';
  const serveur = http.createServer((req, res) => {
    const chemin = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
    let f = path.join(racines[courante], chemin);
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(racines[courante], 'index.html');
    const h: Record<string, string> = {};
    for (const b of ENTETES) if (correspond(b.source, chemin)) for (const x of b.headers) h[x.key] = x.value;
    delete h['Strict-Transport-Security'];
    h['Content-Type'] = TYPES[path.extname(f)] ?? 'application/octet-stream';
    res.writeHead(200, h);
    fs.createReadStream(f).pipe(res);
  });
  return {
    demarrer: () => new Promise<string>(r => serveur.listen(0, '127.0.0.1', () => r(`http://127.0.0.1:${(serveur.address() as AddressInfo).port}`))),
    passerA: (v: string) => { courante = v; },
    arreter: () => new Promise<void>(r => serveur.close(() => r())),
  };
}

const version = (page: Page) => page.evaluate(() => (window as unknown as { __build?: string }).__build ?? 'A');
const appAffichee = (page: Page) => expect(page.getByText('Bord', { exact: true }).last()).toBeVisible({ timeout: 30_000 });
const travailleur = (page: Page) => page.evaluate(async () => {
  const r = await navigator.serviceWorker.getRegistration();
  return { controle: !!navigator.serviceWorker.controller, actif: r?.active?.state ?? null, attente: !!r?.waiting };
});
/** Le testeur pressé : un champ prend le focus dès que l'app s'affiche (saisie en cours pour la politique D429). */
const toucherUnChamp = (page: Page) => page.evaluate(() => {
  const i = document.createElement('input');
  i.setAttribute('aria-label', 'champ du testeur');
  i.style.cssText = 'position:fixed;left:0;bottom:0;width:40px;opacity:.01'; // fixe : le focus ne fait pas défiler la page
  document.body.append(i);
  i.focus();
});

test.describe('E-2 : nouvelle version après une mise en ligne', () => {
  test.setTimeout(240_000);

  let srv: ReturnType<typeof servir>;
  let origine = '';
  test.beforeAll(async () => {
    srv = servir(preparerVersions());
    origine = await srv.demarrer();
  });
  test.afterAll(async () => { await srv?.arreter(); });

  test('E-2 : la version arrivée pendant une saisie est servie au rechargement ordinaire et à la réouverture', async ({ context }) => {
    test.skip(test.info().project.name !== 'android-390', 'une taille suffit : le service worker ne dépend pas de la mise en page');
    srv.passerA('A');
    let page = await context.newPage();
    await page.goto(origine + URL_APP);
    await appAffichee(page);
    await expect.poll(() => travailleur(page), { timeout: 60_000 }).toMatchObject({ controle: true, actif: 'activated' });
    expect(await version(page)).toBe('A');

    // Mise en ligne de B ; le testeur recharge et touche aussitôt un champ : B s'installe et attend (bandeau).
    srv.passerA('B');
    await page.reload();
    await appAffichee(page);
    expect(await version(page)).toBe('A'); // B n'était pas encore téléchargée à l'ouverture
    await toucherUnChamp(page);
    await expect.poll(() => travailleur(page), { timeout: 60_000 }).toMatchObject({ attente: true });
    await expect(page.getByText('Nouvelle version')).toBeVisible({ timeout: 10_000 });
    // L-55 (M3-16) : la bulle se tient sous l'en-tête, jamais dessus (elle cachait ‹ Nov. ›).
    const [bulle, entete] = await Promise.all([page.locator('[data-mise-a-jour]').boundingBox(), page.locator('header').first().boundingBox()]);
    expect(bulle!.y, 'la bulle commence sous l’en-tête').toBeGreaterThanOrEqual(entete!.y + entete!.height);
    await page.screenshot({ path: test.info().outputPath('l55-bulle.png') });

    // Rechargement ordinaire : B, avant que le testeur puisse de nouveau bloquer (il retouche un champ dès l'affichage).
    await page.reload();
    await appAffichee(page);
    await toucherUnChamp(page).catch(() => {});
    await expect.poll(() => version(page).catch(() => 'navigation'), { timeout: 10_000 }).toBe('B');
    await appAffichee(page);
    await page.screenshot({ path: test.info().outputPath('e2-apres-rechargement.png') });

    // Réouverture de l'onglet : B d'emblée.
    await page.close();
    page = await context.newPage();
    await page.goto(origine + URL_APP);
    await appAffichee(page);
    expect(await version(page)).toBe('B');
  });
});

// Lot 8 (LISTE du 23.11) : l'app autour du Carnet, sur la fixture, au doigt.
test.describe('Lot 8 : l’app autour du Carnet', () => {
  test.beforeEach(async ({ page }) => { await poserFixtureCarnet(page); await ouvrirCarnet(page); });

  // L-52 (M3-8) : « Nouvelle idée » depuis un carnet ouvert mettait le focus dans « Ajouter à Chambre… ».
  test('L-52 : « Nouvelle idée » depuis un carnet ouvert revient à la liste, focus dans le champ d’une idée neuve', async ({ page }) => {
    await ouvrirUnCarnet(page, /ZZ TEST — Chambre froide/);
    await page.getByRole('button', { name: /^Actions rapides/ }).first().tap();
    await page.locator('[role="menu"]').getByText(/Nouvelle idée/).first().tap();
    await expect.poll(() => surListe(page), { timeout: 10_000, message: 'retour à la liste' }).toBe('liste');
    const focus = await page.evaluate(() => { const a = document.activeElement as HTMLTextAreaElement | null; return a?.tagName === 'TEXTAREA' ? a.placeholder || a.getAttribute('aria-label') || '?' : `pas un champ : ${a?.tagName}`; });
    expect(focus).not.toMatch(/^pas un champ|Ajouter à/);
  });

  // L-54 (M2-19) : le message « Dans À venir. » était posé sur le champ du bas.
  test('L-54 : le message du choix se tient au-dessus du champ du bas', async ({ page }) => {
    await ouvrirUnCarnet(page, /ZZ TEST — Chambre froide/);
    await page.getByRole('button', { name: /^Comparer/ }).first().tap();
    await page.getByRole('button', { name: 'Choisir', exact: true }).first().tap();
    await page.getByRole('button', { name: /^Choisir chez/ }).first().tap();
    const toast = page.locator('[data-toast]').filter({ hasText: 'Dans À venir' });
    await expect(toast).toBeVisible({ timeout: 15_000 });
    const [t, z] = await Promise.all([toast.boundingBox(), page.locator('.cn-champ-zone').first().boundingBox()]);
    expect(t && z, 'message et champ mesurés').toBeTruthy();
    expect(t!.y + t!.height, 'le bas du message ne descend pas dans le champ').toBeLessThanOrEqual(z!.y + 1);
    await page.screenshot({ path: test.info().outputPath('l54-message.png') });
  });
  // L-51 (T11-18, M1-25) : « Ouvrir » d'une fiche du Calendrier menait à Stocks › Matériel › Carnets, pas au carnet. La fiche appelle
  // `onOpenCarnet(id)` de l'App, comme l'événement « affinee:ouvrir-carnet » joué ici depuis le Calendrier (même chemin `ouvrirCarnet`).
  test('L-51 : ouvrir un carnet depuis un autre écran rend ce carnet ouvert', async ({ page }) => {
    const id = lireFixtureCarnet().entrees.find((e: any) => e.data?.type === 'carnet' && /Chambre froide/.test(e.data.title))?.data.id;
    expect(id, 'le carnet Chambre froide de la fixture').toBeTruthy();
    await page.locator('nav button').filter({ hasText: 'Calendrier' }).first().tap();
    await page.evaluate((i) => window.dispatchEvent(new CustomEvent('affinee:ouvrir-carnet', { detail: { id: i }, cancelable: true })), id);
    await expect.poll(() => surListe(page), { timeout: 10_000, message: 'le carnet lui-même, pas la liste' }).toBe('carnet');
    await expect(page.locator('[data-carnets]')).toContainText(/Chambre froide/);
  });

  // L-50 (M1-24, M2-9) : au rechargement, le carnet ouvert est perdu (la liste revient). La vue du carnet vit dans CarnetsVue.tsx (Lot 2) :
  // hors lot, épreuve gardée en échec attendu jusqu'à ce que CarnetsVue garde son carnet ouvert.
  test('L-50 : le rechargement rouvre le carnet ouvert', async ({ page }) => {
    test.fail(true, 'hors lot : CarnetsVue.tsx (Lot 2) ne garde pas sa vue ; l’onglet, lui, est gardé');
    await ouvrirUnCarnet(page, /ZZ TEST — Chambre froide/);
    await page.reload();
    await expect(page.locator('nav button').first()).toBeVisible({ timeout: 90_000 });
    await expect.poll(() => surListe(page), { timeout: 10_000 }).toBe('carnet');
  });
  // L-53 (M3-9) : + › Écriture › Achat, le nom au crayon, Entrée : l'écriture partait « payé » sans toucher Payé. Entrée valide le nom seul.
  test('L-53 : Entrée dans le nom d’une écriture valide le nom, n’enregistre pas', async ({ page }) => {
    await page.getByRole('button', { name: /^Actions rapides/ }).first().tap();
    await page.locator('[role="menu"]').getByText(/écriture/i).first().tap();
    await page.locator('[data-saisie-genre="achat"]').first().tap();
    await page.getByLabel('Montant en CHF').first().fill('500');
    const nom = page.getByLabel('Nom, facultatif').first();
    await nom.tap();
    const champ = page.locator('input[aria-label="Nom, facultatif"]');
    await champ.fill('ZZ TEST — L-53');
    await champ.press('Enter');
    await page.waitForTimeout(800);
    await expect(page.getByLabel('Enregistré'), 'rien d’enregistré').toHaveCount(0);
    await expect(page.locator('[data-saisie-nom]').first(), 'le nom est gardé').toContainText('ZZ TEST — L-53');
    await page.screenshot({ path: test.info().outputPath('l53-nom.png') });
  });

  // L-56 (T11-13) : hors ligne, aucun signe. L-49 (M1-18, M2-12) : le bandeau d'enregistrement cachait ‹ Nov. › de l'en-tête.
  test('L-56 et L-49 : hors ligne, un signe, posé sous l’en-tête ; il part au retour du réseau', async ({ page, context }) => {
    await context.setOffline(true);
    const bandeau = page.locator('[data-bandeau-persistance]');
    await expect(bandeau).toContainText('Hors ligne', { timeout: 10_000 });
    const [b, h] = await Promise.all([bandeau.boundingBox(), page.locator('header').first().boundingBox()]);
    expect(b!.y, 'le bandeau commence sous l’en-tête').toBeGreaterThanOrEqual(h!.y + h!.height);
    await page.screenshot({ path: test.info().outputPath('l56-hors-ligne.png') });
    await context.setOffline(false);
    await expect(page.locator('[data-hors-ligne]')).toHaveCount(0, { timeout: 10_000 });
  });

});
