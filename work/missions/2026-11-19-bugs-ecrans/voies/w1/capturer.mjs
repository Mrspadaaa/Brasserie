// Voie w1 : captures APRÈS correctif (TL-7, TL-19, TL-16, TE-27, BK2-5). Fixtures du banc local `?dev-local&etape=houblons` (jamais Firestore réel).
// Usage : node scripts/with_server.mjs --server "npm run dev" --port 3103 --env PORT=3103 -- node work/missions/2026-11-19-bugs-ecrans/voies/w1/capturer.mjs
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const url = `http://localhost:${(process.env.WITH_SERVER_PORTS ?? '3103').split(',')[0]}`;
const SORTIE = path.join(import.meta.dirname, 'captures');
fs.mkdirSync(SORTIE, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const cliquer = (page, re, sel = 'button,[role=button],[role=switch],summary') => page.evaluate((src, s) => {
  const r = new RegExp(src, 'i');
  const b = [...document.querySelectorAll(s)].find((x) => r.test((x.getAttribute('aria-label') || x.textContent || '').trim()) && x.getClientRects().length);
  if (b) { b.click(); return true; } return false;
}, re.source, sel);
const ouvrirDepliant = (page, sel) => page.evaluate((s) => { const d = document.querySelector(s); if (d) { d.open = true; d.scrollIntoView({ block: 'center' }); return true; } return false; }, sel);
const photo = async (page, nom, mobile) => {
  await dormir(500);
  await page.screenshot({ path: path.join(SORTIE, `${nom}.png`), fullPage: !mobile ? false : false });
  if (mobile) { // « en défilant » : le bas de l'écran aussi
    await page.evaluate(() => { document.querySelectorAll('*').forEach((n) => { if (n.scrollHeight > n.clientHeight + 20 && /auto|scroll/.test(getComputedStyle(n).overflowY)) n.scrollTop = n.scrollHeight; }); window.scrollTo(0, 99999); });
    await dormir(400);
    await page.screenshot({ path: path.join(SORTIE, `${nom}-bas.png`) });
  }
};

async function une(largeur, theme) {
  const mobile = largeur < 600;
  const tag = `${largeur}-${theme}`;
  const { browser, page, journal } = await ouvrir({ largeur, hauteur: mobile ? 844 : 900, mobile, echelle: 1 });
  await page.evaluateOnNewDocument((t) => { try { localStorage.setItem('laffinee.theme', t); } catch { /* rien */ } }, theme);
  await page.goto(`${url}/?dev-local&etape=houblons&recette=identite`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!document.querySelector('[aria-current="step"]'), { timeout: 170000 });
  await dormir(2500);

  // TE-27 : l'étape Houblons, atelier fermé (puis ouvert).
  await photo(page, `w1-te27-houblons-${tag}`, mobile);
  console.log(tag, 'atelier fermé', await page.evaluate(() => { const d = document.querySelector('[data-role="atelier-houblons-v55"]'); return d ? !d.open : 'absent'; }));

  // TL-7 : NOLO allumé à l'Identité (le bloc), à la Levure (plus de titre répété), au Récap (bouton « Régler le NOLO »).
  await cliquer(page, /^Identité/); await dormir(1200);
  await cliquer(page, /Objectif NOLO/, '[role=switch]'); await dormir(1500);
  await photo(page, `w1-tl7-identite-${tag}`, mobile);
  console.log(tag, 'sections Objectif NOLO Identité', await page.evaluate(() => document.querySelectorAll('section[aria-label="Objectif NOLO"]').length));
  await cliquer(page, /^Levure/); await dormir(2000);
  await photo(page, `w1-tl7-levure-${tag}`, mobile);
  console.log(tag, 'sections Objectif NOLO Levure', await page.evaluate(() => document.querySelectorAll('section[aria-label="Objectif NOLO"]').length));
  await cliquer(page, /^Récap/); await dormir(2000);
  await cliquer(page, /^Plus/, 'summary'); await dormir(600);
  await photo(page, `w1-tl7-recap-${tag}`, mobile);
  console.log(tag, 'sections Objectif NOLO Récap', await page.evaluate(() => document.querySelectorAll('section[aria-label="Objectif NOLO"]').length));
  await cliquer(page, /Objectif NOLO/, '[role=switch]'); // retour sans NOLO (le switch n'est qu'à l'Identité : sans effet ici)

  // BK2-5 : la section Additifs (dépliée) sous les fermentescibles.
  await cliquer(page, /^Malts/); await dormir(2000);
  await ouvrirDepliant(page, '[data-role="additifs"]'); await dormir(400);
  await cliquer(page, /Ajouter un additif/); await dormir(500);
  await page.evaluate(() => {
    const champ = document.querySelector('[aria-label="Nom de l’additif 1"]');
    if (!champ) return;
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    set.call(champ, 'Coriandre'); champ.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await dormir(400);
  await page.evaluate(() => { const q = document.querySelector('[aria-label^="Quantité de Coriandre"]'); if (q) { q.focus(); } });
  await page.keyboard.type('12,5'); await dormir(500);
  await photo(page, `w1-bk25-additifs-${tag}`, mobile);
  console.log(tag, 'additif', await page.evaluate(() => document.querySelector('[data-additif="0"]')?.textContent?.slice(0, 80)));

  // TL-16 : l'étape Eau, une eau d'empâtage trop courte (l'alerte vraie, ambre, avec son recalcul).
  await cliquer(page, /^Eau/); await dormir(2500);
  await page.evaluate(() => { const c = document.getElementById('wz-mash-water'); if (c) { c.focus(); c.select?.(); } });
  await page.keyboard.type('12,0'); await page.keyboard.press('Tab'); await dormir(800);
  await photo(page, `w1-tl16-eau-${tag}`, mobile);
  console.log(tag, 'eau', JSON.stringify(await page.evaluate(() => {
    const m = document.querySelector('[data-role="messages-volumes"]'); const r = document.querySelector('[data-action="recaler-volumes"]');
    const cs = (n) => n && { bord: getComputedStyle(n).borderColor, fond: getComputedStyle(n).backgroundColor };
    return { msg: m?.textContent?.slice(0, 90), style: cs(m), recaler: r?.textContent?.slice(0, 60), styleRecaler: cs(r) };
  })));

  console.log(tag, 'erreurs', JSON.stringify(journal.erreurs.slice(0, 3)));
  await browser.close();
}

// TL-19 : reprise d'un brouillon (rechargement de la page), phrase lisible à l'écran.
async function reprise(largeur, theme) {
  const mobile = largeur < 600;
  const tag = `${largeur}-${theme}`;
  const { browser, page, journal } = await ouvrir({ largeur, hauteur: mobile ? 844 : 900, mobile, echelle: 1 });
  await page.evaluateOnNewDocument((t) => { try { localStorage.setItem('laffinee.theme', t); } catch { /* rien */ } }, theme);
  await page.goto(`${url}/?dev-local`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!document.querySelector('[aria-label="Actions rapides"]'), { timeout: 170000 });
  await dormir(2000);
  await cliquer(page, /Nouvelle recette|Créer une recette/); await dormir(2000);
  await page.waitForSelector('#wz-title', { timeout: 20000 });
  await page.type('#wz-title', 'ZZ TEST — reprise'); await dormir(1200);
  await cliquer(page, /^Fermer$/); await dormir(1200);
  await cliquer(page, /Nouvelle recette|Créer une recette/); await dormir(2500);
  console.log(tag, 'reprise', JSON.stringify(await page.evaluate(() => { const s = [...document.querySelectorAll('[role=status]')].find((n) => /Brouillon repris/.test(n.textContent || '')); return s ? { texte: s.textContent, srOnly: !!s.closest('.sr-only') } : 'absent'; })));
  await photo(page, `w1-tl19-reprise-${tag}`, mobile);
  console.log(tag, 'erreurs', JSON.stringify(journal.erreurs.slice(0, 3)));
  await browser.close();
}

// Les rechargements HMR (d'autres sessions éditent le même dépôt pendant le banc) détruisent le document : un parcours est rejoué, trois essais au plus.
for (const [l, t] of [[1280, 'clair'], [1280, 'cave'], [390, 'clair'], [390, 'cave']]) {
  for (const f of [une, reprise]) {
    for (let essai = 1; essai <= 3; essai++) {
      try { await f(l, t); break; } catch (e) { console.log(l, t, f.name, 'essai', essai, 'échec :', String(e?.message ?? e).slice(0, 160)); }
    }
  }
}
