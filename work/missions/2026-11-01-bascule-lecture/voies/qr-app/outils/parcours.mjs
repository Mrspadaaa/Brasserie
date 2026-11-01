// Parcours Chrome de la voie qr-app : le sceau QR de z2 dans l'écran en ligne, servi par la COPIE ISOLÉE (vite dans %TEMP%/qr-app-copie, jamais la jonction node_modules).
// Pièces fictives, VRAI décodeur (zxing-wasm, pdf.js) dans le navigateur, lecture Gemini simulée (`?dev-local&depense=qr-<état>`, apercuDev.ts).
// Usage : node parcours.mjs --url=http://localhost:3457 [--sortie=<dossier>] [--etats=confirme,contredit,…]
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const racine = path.resolve(ici, '..', '..', '..', '..', '..');
const require = createRequire(path.join(racine, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const arg = (nom, defaut) => (process.argv.find(a => a.startsWith(`--${nom}=`)) ?? `--${nom}=${defaut}`).split('=').slice(1).join('=');
const URL_APP = arg('url', 'http://localhost:3457').replace(/\/$/, '');
const SORTIE = path.resolve(arg('sortie', path.join(ici, '..', 'captures')));
const ETATS = arg('etats', 'confirme,contredit,partiel,illisible,ecart,invalide,sans,lecture,pdf,non-verifie').split(',');
fs.mkdirSync(SORTIE, { recursive: true });
const dormir = (ms) => new Promise(r => setTimeout(r, ms));
const rapport = { url: URL_APP, etats: {}, gestes: {}, erreurs: [], externes: [] };

const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
await nav.defaultBrowserContext().overridePermissions(URL_APP, ['clipboard-read', 'clipboard-write']);

async function ouvrir(etat, large = false) {
  const p = await nav.newPage();
  await p.setViewport(large ? { width: 1280, height: 800, deviceScaleFactor: 1 } : { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  p.on('pageerror', e => rapport.erreurs.push(`${etat}: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error' && !/ERR_BLOCKED_BY_CLIENT/.test(m.text())) rapport.erreurs.push(`${etat}: console ${m.text().slice(0, 200)}`); });
  // Hors de l'app, rien ne passe : toute adresse externe est BLOQUÉE et notée (la lecture du QR doit marcher sans réseau : wasm et worker sont ceux de l'app).
  await p.setRequestInterception(true);
  p.on('request', r => { const u = new globalThis.URL(r.url()); const local = /^(localhost|127.0.0.1)$/.test(u.hostname) || !u.protocol.startsWith('http'); if (local) r.continue(); else { rapport.externes.push(`${etat}: ${u.hostname}`); r.abort('blockedbyclient'); } });
  p.setDefaultNavigationTimeout(150000);
  const t0 = Date.now();
  let ouvert = false;
  for (let essai = 1; essai <= 3 && !ouvert; essai++) {
    // Vite recharge la page quand il découvre des dépendances (première ouverture) : jusqu'à trois essais.
    try {
      await p.goto(`${URL_APP}/?dev-local&depense=qr-${etat}`, { waitUntil: 'domcontentloaded' });
      await p.waitForFunction(() => document.querySelectorAll('button').length > 3, { timeout: 150000 });
      await dormir(800);
      await p.click('[aria-label="Actions rapides"]');
      await p.waitForFunction(() => [...document.querySelectorAll('button')].some(b => /Entrer une facture/.test(b.textContent)), { timeout: 20000 });
      await p.evaluate(() => [...document.querySelectorAll('button')].find(b => /Entrer une facture/.test(b.textContent)).click());
      await p.waitForFunction(() => document.body.dataset.apercu, { timeout: 45000 });
      ouvert = true;
    } catch (e) { if (essai === 3) { await p.screenshot({ path: path.join(SORTIE, `echec-ouverture-${etat}.png`) }); throw e; } }
  }
  return { p, t0: Date.now() };
}
const attendreQr = (p, etat) => etat === 'non-verifie' ? dormir(4000) : etat === 'lecture'
  ? p.waitForSelector('[data-dp="sceau-qr"]', { timeout: 30000 })
  : p.waitForFunction(() => { const s = document.querySelector('[data-dp="sceau-qr"]'); return (s && s.dataset.q !== 'wait') || document.querySelector('[data-dp="sans-qr"]'); }, { timeout: 30000 });
const lire = (p) => p.evaluate(() => {
  const s = document.querySelector('[data-dp="sceau-qr"]'), sans = document.querySelector('[data-dp="sans-qr"]'), b = document.querySelector('[data-dp="bandeau"]');
  const r = (e) => { if (!e) return null; const x = e.getBoundingClientRect(); return { x: Math.round(x.x), y: Math.round(x.y), w: Math.round(x.width), h: Math.round(x.height) }; };
  return { sceau: s ? { q: s.dataset.q, verdict: s.querySelector('b')?.textContent, nom: s.getAttribute('aria-label'), rect: r(s), contraste: (() => { const b = s.querySelector('b'), c = getComputedStyle(b); const lum = (css) => { const m = css.match(/[\d.]+/g).map(Number); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); }; const voile = /inset/.test(c.boxShadow) ? Number((c.boxShadow.match(/rgba\([^)]*?([\d.]+)\)/) || [0, 0])[1]) : 0; const fond = c.backgroundColor.match(/[\d.]+/g).slice(0, 3).map(n => Number(n) * (1 - voile)); const a = lum(c.color), d = lum('rgb(' + fond.join(',') + ')'); return Math.round(((Math.max(a, d) + 0.05) / (Math.min(a, d) + 0.05)) * 100) / 100; })() } : null, sansQr: Boolean(sans), bandeau: r(b),
    debordH: document.documentElement.scrollWidth > document.documentElement.clientWidth, duel: r(document.querySelector('[data-dp="duel"]')), total: document.querySelector('#purchase-total')?.value ?? null };
});
const toucher = async (p, sel) => { await p.waitForSelector(sel, { timeout: 8000 }); try { await p.tap(sel); } catch { await p.$eval(sel, e => e.click()); } await dormir(450); };
const photo = async (p, nom) => { await dormir(250); await p.screenshot({ path: path.join(SORTIE, nom) }); return nom; };

try {
  for (const etat of ETATS) try {
    const { p, t0 } = await ouvrir(etat);
    await attendreQr(p, etat);
    const ms = Date.now() - t0;
    await dormir(500);
    const vue = await lire(p);
    rapport.etats[etat] = { ...vue, msJusquAuSceau: ms };
    await photo(p, `z2-${etat}-390.png`);
    if (etat === 'confirme') {
      await toucher(p, '[data-dp="sceau-qr"]'); await photo(p, 'z2-confirme-ouvert-390.png');
      await p.evaluate(() => { const f = document.querySelector('[data-dp="qr-fiche"]'); f?.scrollIntoView({ block: 'end' }); });
      await p.evaluate(() => { window.__copies = []; const w = navigator.clipboard.writeText.bind(navigator.clipboard); navigator.clipboard.writeText = async (x) => { window.__copies.push(x); return w(x); }; });
      await toucher(p, '[data-dp="copier"][aria-label="Copier IBAN"]');
      const copie = await p.evaluate(() => window.__copies);
      rapport.gestes.copierIban = { copie, bouton: await p.$eval('[data-dp="copier"][aria-label="Copier IBAN"]', e => e.textContent) };
      await photo(p, 'z2-confirme-copie-390.png');
      await toucher(p, '[aria-label="Fermer ce que dit le QR"]');
      await toucher(p, '[data-dp="tuile-paye"]'); await photo(p, 'z2-confirme-tuile-390.png');
      await toucher(p, '[data-dp="tuile-paye"]');
      await toucher(p, '[aria-label="Détails de la lecture"]'); await photo(p, 'z2-confirme-preuve-390.png');
    }
    if (etat === 'contredit') {
      const avant = await lire(p);
      await toucher(p, '[data-dp-duel="qr"]'); const apres = await lire(p); await photo(p, 'z2-contredit-apres-390.png');
      await toucher(p, '[data-dp-duel="lu"]'); const retour = await lire(p);
      rapport.gestes.duel = { avant: avant.total, prendreQr: apres.total, verdictApres: apres.sceau?.verdict, reprendreLu: retour.total, verdictRetour: retour.sceau?.verdict };
      await toucher(p, '[data-dp="sceau-qr"]'); await photo(p, 'z2-contredit-ouvert-390.png');
      await toucher(p, '[aria-label="Fermer ce que dit le QR"]');
      await toucher(p, '[aria-label="Détails de la lecture"]'); await photo(p, 'z2-contredit-preuve-390.png');
    }
    if (['illisible', 'partiel', 'ecart', 'invalide'].includes(etat)) { await toucher(p, '[data-dp="sceau-qr"]'); await photo(p, `z2-${etat}-ouvert-390.png`); }
    if (etat === 'ecart') {
      await toucher(p, '[aria-label="Fermer ce que dit le QR"]');
      // Voie qr-ecart : la chip ouvre la feuille et ne règle RIEN ; seul un choix (deux touches de la rangée Date) règle la chip, efface la marque et écrit la date.
      const etatEcart = () => p.evaluate(() => {
        const b = document.querySelector('[data-dp="bandeau"]'), date = [...b.querySelectorAll('span')].find(s => /^\d{2}\.\d{2}\.\d{4}$/.test(s.textContent.trim()));
        const chip = document.querySelector('[data-dp-chip="qr:date"]'), tuile = document.querySelector('[data-dp="tuile-paye"]');
        const touches = [...document.querySelectorAll('[data-dp-duel-champ^="date:"]')].map(t => ({ texte: t.textContent, pressed: t.getAttribute('aria-pressed'), h: Math.round(t.getBoundingClientRect().height) }));
        return { date: date?.textContent.trim(), dateMarquee: /border-dotted/.test(date?.className ?? ''), chip: chip?.getAttribute('aria-label'), chipBarree: /line-through/.test(chip?.className ?? ''), sceau: document.querySelector('[data-dp="sceau-qr"] b')?.textContent, paiement: tuile?.textContent.replace(/\s+/g, ' ').trim(), feuille: Boolean(document.querySelector('[data-dp="qr-fiche"]')), touches, debordH: document.documentElement.scrollWidth > document.documentElement.clientWidth };
      });
      const g = rapport.gestes.ecart = { repos: await etatEcart() };
      await toucher(p, '[data-dp-chip="qr:date"]'); g.chipTouchee = await etatEcart(); await photo(p, 'z2-ecart-chip-390.png');
      await toucher(p, '[data-dp-duel-champ="date:qr"]'); g.prendreQr = await etatEcart(); await photo(p, 'z2-ecart-prendre-qr-390.png');
      await toucher(p, '[data-dp-duel-champ="date:lu"]'); g.reprendreLu = await etatEcart();
      await p.close();
      const seconde = await ouvrir('ecart'); await attendreQr(seconde.p, 'ecart'); await dormir(500);
      await toucher(seconde.p, '[data-dp-chip="qr:date"]');
      await toucher(seconde.p, '[data-dp-duel-champ="date:lu"]');
      g.garder = await seconde.p.evaluate(() => {
        const b = document.querySelector('[data-dp="bandeau"]'), date = [...b.querySelectorAll('span')].find(s => /^\d{2}\.\d{2}\.\d{4}$/.test(s.textContent.trim()));
        return { date: date?.textContent.trim(), dateMarquee: /border-dotted/.test(date?.className ?? ''), chip: document.querySelector('[data-dp-chip="qr:date"]')?.getAttribute('aria-label'), sceau: document.querySelector('[data-dp="sceau-qr"] b')?.textContent, paiement: document.querySelector('[data-dp="tuile-paye"]')?.textContent.replace(/\s+/g, ' ').trim() };
      });
      await photo(seconde.p, 'z2-ecart-garder-390.png');
      await seconde.p.close();
      continue;
    }
    if (etat === 'lecture') {
      await toucher(p, '[data-dp="sceau-qr"]');
      await p.waitForFunction(() => document.querySelector('[data-dp="qr-fiche"]')?.textContent.includes('lu en'), { timeout: 25000 });
      await photo(p, 'z2-lecture-ouvert-390.png');
    }
    await p.close();
  } catch (e) { rapport.erreurs.push(`${etat}: ECHEC ${String(e.message).slice(0, 120)}`); }
  if (ETATS.includes('confirme')) for (const etat of ['confirme', 'contredit']) {
    const { p } = await ouvrir(etat, true);
    await attendreQr(p, etat); await dormir(700);
    rapport.etats[`${etat}-1280`] = await lire(p);
    await photo(p, `z2-${etat}-1280.png`);
    await p.close();
  }
} finally { await nav.close(); }
fs.writeFileSync(path.join(SORTIE, 'parcours.json'), JSON.stringify(rapport, null, 2));
for (const [k, v] of Object.entries(rapport.etats)) console.log(k.padEnd(14), v.sceau ? `${v.sceau.q} « ${v.sceau.verdict} »` : v.sansQr ? 'sans QR (cercle)' : 'aucun sceau', `· sceau ${v.sceau?.rect ? v.sceau.rect.w + '×' + v.sceau.rect.h + ' contraste ' + v.sceau.contraste : '-'} · bandeau h ${v.bandeau?.h} · total ${v.total}${v.debordH ? ' · DÉBORD' : ''}${v.msJusquAuSceau ? ' · ' + v.msJusquAuSceau + ' ms' : ''}`);
console.log('gestes', JSON.stringify(rapport.gestes));
console.log('erreurs', rapport.erreurs.length, rapport.erreurs.slice(0, 6));
console.log('hôtes externes', [...new Set(rapport.externes)]);
