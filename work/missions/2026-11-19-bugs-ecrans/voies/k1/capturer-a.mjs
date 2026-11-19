// Voie k1, corrections A : captures et mesures (données SIMULÉES, rien vers Firebase réel).
// Usage (depuis port-carnet) :
//   node scripts/with_server.mjs --server "npx vite --port 3105 --strictPort" --port 3105 --timeout 300 -- node work/missions/2026-11-19-bugs-ecrans/voies/k1/capturer-a.mjs [feuille] [notes] [caisse]
// Sans argument : les trois. Sortie : captures-a/*.png et un journal ; code 1 si une mesure échoue.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');
const PORT = (process.env.WITH_SERVER_PORTS ?? '3105').split(',')[0];
const SORTIE = path.join(import.meta.dirname, 'captures-a');
fs.mkdirSync(SORTIE, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const sections = process.argv.slice(2).length ? process.argv.slice(2) : ['feuille', 'notes', 'caisse'];
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const LOCAL = /^(https?|ws)s?:\/\/(localhost|127\.0\.0\.1)/i;
const journal = [];
let echec = false;
const verdict = (ok, texte) => { journal.push(`${ok ? 'OK' : 'ÉCHEC'} ${texte}`); if (!ok) echec = true; };

async function ouvrirPage(browser, largeur, hauteur) {
  const page = await browser.newPage();
  const mobile = largeur < 600;
  await page.setViewport({ width: largeur, height: hauteur, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  page.setDefaultNavigationTimeout(240000);
  page.on('pageerror', (e) => journal.push(`pageerror ${String(e?.message ?? e).slice(0, 140)}`));
  await page.setRequestInterception(true);
  page.on('request', (r) => (LOCAL.test(r.url()) || /^(data|blob|about):/i.test(r.url()) ? r.continue() : r.abort('blockedbyclient')));
  return page;
}
const defilerVers = (page, sel) => page.evaluate((s) => { document.querySelector(s)?.scrollIntoView({ block: 'center' }); }, sel);
const clic = (page, re) => page.evaluate((src) => {
  const r = new RegExp(src, 'i');
  const b = [...document.querySelectorAll('button,[role=button],[role=menuitem],summary')].find((x) => r.test((x.getAttribute('aria-label') || x.textContent || '').trim()) && x.getClientRects().length);
  if (b) { b.scrollIntoView({ block: 'center' }); b.click(); return true; } return false;
}, re.source);

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });

if (sections.includes('feuille')) {
  const BASE = `http://localhost:${PORT}/work/missions/2026-11-19-bugs-ecrans/voies/b1/banc/banc.html`;
  const feuille = async (nom, theme, largeur, hauteur, action, cond) => {
    const page = await ouvrirPage(browser, largeur, hauteur);
    await page.goto(`${BASE}?vue=feuille&theme=${theme}${cond ? `&cond=${cond}` : ''}`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => (document.body.innerText || '').trim().length > 40, { timeout: 240000 });
    await dormir(2500);
    // La feuille se monte avec un temps de retard (portail) : on ouvre « Corriger les mesures » jusqu'à ce que la saisie existe.
    for (let t = 0; t < 6 && !(await page.$('details[open] [name="batch_sheet_og"]')); t++) { await clic(page, /^Corriger les mesures/); await dormir(800); }
    const lu = await action(page);
    await dormir(500);
    await page.screenshot({ path: path.join(SORTIE, `${nom}.png`) });
    await page.close();
    return lu;
  };
  const saisirOg = async (page) => {
    await page.focus('[name="batch_sheet_og"]');
    await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control');
    await page.keyboard.press('Backspace'); await page.keyboard.type('2,5'); await page.keyboard.press('Tab'); await dormir(400);
  };
  const lecture = (page) => page.evaluate(() => {
    const texte = document.body.innerText;
    const carte = [...document.querySelectorAll('div')].find((d) => /^Densité\s/.test((d.textContent || '').trim()) && d.children.length >= 1 && (d.textContent || '').length < 120);
    return {
      alertesVolume: (texte.match(/pour\s*[\d,.\s]+L\s*brassés/g) ?? []).length,
      carte: (carte?.textContent ?? '').trim().slice(0, 100),
      og: document.querySelector('[name="batch_sheet_og"]')?.value, fg: document.querySelector('[name="batch_sheet_fg"]')?.value,
      courbe: (document.querySelector('[aria-label="Courbe des densités mesurées"] p')?.textContent ?? '').trim(),
    };
  });
  // 1280 clair : OG 2,5 refusée.
  let lu = await feuille('p1-og-refusee-1280-clair', 'clair', 1280, 1500, async (page) => { await saisirOg(page); return lecture(page); });
  console.log('p1 1280 clair', JSON.stringify(lu));
  verdict(!/2,500/.test(lu.carte) && /OG 1,060/.test(lu.carte), `p1 résumé sans la valeur refusée : « ${lu.carte} »`);
  verdict(lu.fg === '1,012', `p3 densité finale à la virgule : « ${lu.fg} »`);
  verdict(/0 relevé/.test(lu.carte) && /0 relevé/.test(lu.courbe), `p2 même compte : « ${lu.carte} » / « ${lu.courbe} »`);
  verdict(lu.alertesVolume === 1, `p4 alertes de volume : ${lu.alertesVolume}`);
  // 390 cave tactile : OG refusée, puis le bas (volumes), en défilant.
  lu = await feuille('p1-og-refusee-390-cave-haut', 'cave', 390, 800, async (page) => { await saisirOg(page); await page.evaluate(() => { [...document.querySelectorAll('*')].filter((e) => e.scrollHeight > e.clientHeight + 40 && /auto|scroll/.test(getComputedStyle(e).overflowY)).forEach((e) => { e.scrollTop = 0; }); }); return lecture(page); });
  console.log('p1 390 cave', JSON.stringify(lu));
  lu = await feuille('p1-og-refusee-390-cave-champs', 'cave', 390, 800, async (page) => { await saisirOg(page); await defilerVers(page, '[name="batch_sheet_og"]'); return lecture(page); });
  lu = await feuille('p4-conditionne-390-cave-contenants', 'cave', 390, 800, async (page) => { await defilerVers(page, '[data-conditionne-trop]'); return lecture(page); });
  console.log('p4 390 cave', JSON.stringify(lu));
  verdict(lu.alertesVolume === 1, `p4 390 cave alertes de volume : ${lu.alertesVolume}`);
  lu = await feuille('p4-conditionne-390-cave-volumes', 'cave', 390, 800, async (page) => { await page.evaluate(() => { const l = [...document.querySelectorAll('p')].find((p) => /^Conditionné/.test((p.textContent || '').trim())); l?.scrollIntoView({ block: 'center' }); }); return lecture(page); });
}

if (sections.includes('notes')) {
  const page = await ouvrirPage(browser, 390, 800);
  await page.goto(`http://localhost:${PORT}/work/missions/2026-11-19-bugs-ecrans/voies/k1/banc/banc-notes.html?theme=cave`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => (document.body.innerText || '').trim().length > 40, { timeout: 240000 });
  await dormir(2500);
  await clic(page, /^Recette$/); await dormir(800);
  await clic(page, /^Programme et notes de recette/); await dormir(500);
  await defilerVers(page, '.brew-recipe-notes'); await dormir(400);
  const notes = await page.evaluate(() => document.querySelector('.brew-recipe-notes')?.textContent ?? null);
  await page.screenshot({ path: path.join(SORTIE, 'rl13-notes-390-cave.png') });
  console.log('RL-13 notes', JSON.stringify(notes));
  verdict(notes === 'OG 1,031 · 11,3 % AA · ensemencement 27,5 °C · Empâtage 22,8 L · enregistré le 05.09.2026', `RL-13 bloc de notes : « ${notes} »`);
  await page.close();
}

if (sections.includes('caisse')) {
  const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
  const url = `http://localhost:${PORT}`;
  const poser = (page) => page.evaluate(async () => {
    const { FirestoreRepo } = await import('/src/services/firestoreRepo.ts');
    const { StorageService } = await import('/src/services/storage.ts');
    const cfg = StorageService.getConfig();
    StorageService.saveConfig({ ...cfg, company: { ...cfg.company, name: 'Brasserie Test', uid: '', iban: 'CH93 0076 2011 6238 5295 7', adresse: { rue: 'Rue du Test', numero: '1', npa: '1700', localite: 'Fribourg', pays: 'CH' } }, fiscal: { ...cfg.fiscal, isTvaRegistered: false } });
    FirestoreRepo.put('clients', 'CL-006', { id: 'CL-006', name: 'ZZ TEST — Clients', type: 'Pro', contact: '', phone: '', email: '', adresse: { rue: 'Chemin des Fixtures', numero: '4', npa: '1700', localite: 'Fribourg', pays: 'CH' } });
    FirestoreRepo.put('batches', 'B1', { id: 'B1', name: 'Pale Ale', style: 'Pale Ale', status: 'conditionne', brewDate: '2026-09-05', volumeL: 30, volumePackagedL: 27, packaging: { bottles33: 96, bottles75: 24, kegIds: [] } });
    StorageService.saveTarifs([{ product: 'Pale Ale 33 cl', biere: 'Pale Ale', format: { id: '33cl', label: '33 cl', volumeL: 0.33 }, costIngredients: 0, costLabor: 0, costFixed: 0, costTotal: 0, priceHT: 3.96, marginCHF: 0, marginPercent: 0 }]);
  });
  const une = async (largeur, theme) => {
    const mobile = largeur < 600;
    const { browser: b2, page } = await ouvrir({ largeur, hauteur: mobile ? 844 : 900, mobile, echelle: 1 });
    await page.evaluateOnNewDocument((t) => { try { localStorage.setItem('laffinee.theme', t); } catch { /* rien */ } }, theme);
    await page.goto(`${url}/?dev-local`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!document.querySelector('[aria-label="Actions rapides"]'), { timeout: 240000 });
    await dormir(1500); await poser(page); await dormir(500);
    await clic(page, /^Actions rapides$/); await dormir(600);
    await clic(page, /^Vente$/);
    await page.waitForSelector('.cs', { timeout: 30000 }); await dormir(900);
    for (let i = 0; i < 3; i++) await clic(page, /^33 cl/);
    await clic(page, /^Espèces$/); await dormir(600);
    await page.evaluate(() => { document.querySelector('.om-bas')?.scrollIntoView({ block: 'center' }); }); await dormir(400);
    const m = await page.evaluate(() => {
      const bas = document.querySelector('.om-bas');
      if (!bas) return null;
      const opaque = (c) => { const x = c.match(/[\d.]+/g)?.map(Number) ?? []; return x.length < 4 || x[3] > 0.99; };
      const fond = (el) => { for (let n = el; n; n = n.parentElement) { const c = getComputedStyle(n).backgroundColor; if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') return { c, n: n.className.toString().slice(0, 40) }; } return { c: 'aucun', n: '' }; };
      return { bande: getComputedStyle(bas).backgroundColor, feuille: fond(bas.parentElement), bouton: document.querySelector('.cs-go')?.textContent };
    });
    console.log('caisse', largeur, theme, JSON.stringify(m));
    verdict(!!m && m.bande === m.feuille.c, `AM-69 rangée « Mon mois · Encaisser » ${largeur} ${theme} : bande ${m?.bande} / feuille ${m?.feuille?.c}`);
    await page.screenshot({ path: path.join(SORTIE, `c1-rangee-${largeur}-${theme}.png`) });
    await b2.close();
  };
  for (const [l, t] of [[390, 'clair'], [390, 'cave'], [1280, 'clair']]) {
    for (let essai = 1; essai <= 3; essai++) {
      try { await une(l, t); break; } catch (e) { console.log(l, t, 'essai', essai, 'échec :', String(e?.message ?? e).slice(0, 140)); }
    }
  }
}

console.log(journal.join('\n'));
await browser.close();
process.exit(echec ? 1 : 0);
