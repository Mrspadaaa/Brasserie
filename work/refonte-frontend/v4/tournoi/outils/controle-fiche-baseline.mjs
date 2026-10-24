// D93 (19.10, soir) : la fiche suit sa baseline. Les mots du brasseur, sur la fiche de l8e ouverte par
// l'appui long (g1 telle quelle) : « Pourquoi la fiche est pareil ??? C'est pas du tout la bonne, ça
// suit pas la Baseline, ça suit rien du tout ??? ». controle-fiche (D25) vérifiait qu'une fiche
// s'ouvre, pas qu'elle parle le langage de la page.
// Règle, sur la fiche ouverte par un appui long (650 ms) sur le premier houblon visible :
//   B1 chaque famille nommée dans la fiche ([data-famille] hors radar) porte un picto svg[data-famille]
//      qui reprend le <symbol> de la page pour cette famille (pas un carré de couleur) ;
//   B2 ces pictos passent la règle TRAIT (D88) : ni fond teinté, ni ombre, ni filtre ;
//   B3 l'α s'écrit comme sur les voies : [data-role="alpha"] avec data-source, et « lot » d'abord
//      quand la page montre un lot pour ce houblon ;
//   B4 aucune police de la fiche qui ne soit pas déjà sur la page (hors radar).
// Usage : node controle-fiche-baseline.mjs <dossier> [ids…] [--page=etat-b.html] ; imprime
// FICHE-BASELINE OK, ou FICHE-BASELINE ECHEC et la liste.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const dir = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const only = args.filter((a) => !a.startsWith('--')).slice(1);
const pg = (args.find((a) => a.startsWith('--page=')) || '--page=etat-b.html').slice(7);
const ids = (only.length ? only : fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, pg)))).sort();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const problems = [];
for (const id of ids) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(path.join(dir, id, pg)).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await wait(300);
  // Le langage de la page, relevé avant d'ouvrir la fiche.
  const avant = await page.evaluate(() => {
    const vis = (e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
    const sym = {};
    for (const s of document.querySelectorAll('svg[data-famille]')) {
      if (s.closest('[data-role="fiche"], [data-role="legende"]') || !vis(s)) continue;
      const u = s.querySelector('use'); const h = u && (u.getAttribute('href') || u.getAttribute('xlink:href'));
      if (h) (sym[s.dataset.famille] ||= []).includes(h) || sym[s.dataset.famille].push(h);
    }
    const polices = new Set();
    for (const e of document.querySelectorAll('[data-voie] *, [data-role="objectif"] *')) {
      if (!vis(e) || ![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      polices.add(getComputedStyle(e).fontFamily.split(',')[0].replace(/["']/g, '').trim().toLowerCase());
    }
    const lots = [...document.querySelectorAll('[data-role="alpha"][data-source="lot"]')].map((a) => (a.closest('[data-houblon]') || a.parentElement.querySelector('[data-houblon]') || {}).dataset?.houblon).filter(Boolean);
    return { sym, polices: [...polices], lots };
  });
  const hs = await page.$$('[data-houblon]');
  let h = null;
  for (const x of hs) { if (await x.evaluate((e) => { const r = e.getBoundingClientRect(); return r.height > 0 && r.top > 0 && r.bottom < innerHeight && !e.closest('[data-role="legende"]'); })) { h = x; break; } }
  if (!h) { problems.push(id + ' : aucun houblon visible'); await page.close(); continue; }
  const nom = await h.evaluate((e) => e.dataset.houblon || e.innerText.trim().split('\n')[0]);
  const t = await h.touchStart(); await wait(650); await t.end(); await wait(500);
  const r = await page.evaluate((avant, nom) => {
    const vis = (e) => { if (e.closest('[hidden]')) return false; const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
    const f = [...document.querySelectorAll('[data-role="fiche"]')].find(vis);
    if (!f) return { ouverte: false };
    const fautes = [];
    const horsRadar = (e) => !e.closest('svg[data-radar], [data-radar]');
    const plein = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c || ''); if (!m) return false; const p = m[1].split(',').map(Number); if (p.length > 3 && p[3] === 0) return false; return !(Math.min(p[0], p[1], p[2]) >= 245 && Math.max(p[0], p[1], p[2]) - Math.min(p[0], p[1], p[2]) <= 6); };
    // B1, B2
    const nommees = new Set([...f.querySelectorAll('[data-famille]')].filter((e) => vis(e) && horsRadar(e) && e.tagName.toLowerCase() !== 'svg').map((e) => e.dataset.famille));
    const pictos = [...f.querySelectorAll('svg[data-famille]')].filter((s) => vis(s) && horsRadar(s));
    for (const fam of nommees) {
      const p = pictos.filter((s) => s.dataset.famille === fam);
      if (!p.length) { fautes.push('B1 ' + fam + ' : pas de picto de la page (carré ou couleur seule)'); continue; }
      const refs = p.map((s) => { const u = s.querySelector('use'); return u && (u.getAttribute('href') || u.getAttribute('xlink:href')); });
      if (avant.sym[fam] && !refs.some((x) => avant.sym[fam].includes(x))) fautes.push('B1 ' + fam + ' : picto différent de celui de la page (' + refs[0] + ' contre ' + avant.sym[fam][0] + ')');
      for (const s of p) { const cs = getComputedStyle(s); if (plein(cs.backgroundColor) || cs.boxShadow !== 'none' || (cs.filter && cs.filter !== 'none')) { fautes.push('B2 ' + fam + ' : halo ou fond sur le picto'); break; } }
    }
    // B3
    const alphas = [...f.querySelectorAll('[data-role="alpha"]')].filter(vis);
    if (!alphas.length) fautes.push('B3 : pas d\'α balisé comme sur les voies (data-role="alpha")');
    else if (avant.lots.includes(nom) && alphas[0].dataset.source !== 'lot') fautes.push('B3 : l\'α des fiches passe avant celui du lot (' + (alphas[0].dataset.source || 'sans source') + ' d\'abord)');
    // B4
    const etrangeres = new Set();
    for (const e of f.querySelectorAll('*')) {
      if (!vis(e) || !horsRadar(e) || ![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      const p = getComputedStyle(e).fontFamily.split(',')[0].replace(/["']/g, '').trim().toLowerCase();
      if (!avant.polices.includes(p)) etrangeres.add(p);
    }
    if (etrangeres.size) fautes.push('B4 : police(s) absente(s) des voies : ' + [...etrangeres].join(', '));
    return { ouverte: true, familles: nommees.size, pictos: pictos.length, fautes };
  }, avant, nom);
  await page.close();
  if (!r.ouverte) { problems.push(id + ' : l\'appui long sur « ' + nom + ' » n\'ouvre pas de fiche'); continue; }
  for (const x of r.fautes) problems.push(id + ' fiche de ' + nom + ' : ' + x);
  console.log(id + ' · fiche de ' + nom + ' · ' + r.familles + ' familles nommées, ' + r.pictos + ' pictos · ' + r.fautes.length + ' faute(s)');
}
await browser.close();
if (problems.length) { console.log('FICHE-BASELINE ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exit(1); }
console.log('FICHE-BASELINE OK');
