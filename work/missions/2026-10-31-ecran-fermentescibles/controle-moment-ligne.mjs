// D218 : « Pas super ui », sur la pilule « ébullition ⌄ » de la ligne Dextrose (passe 5). Sur la ligne du ticket, le moment garde la même forme
// quel que soit sa valeur : ni fond ni bordure (empâtage, ébullition, fermentation). La couleur peut rester dans le mot ou dans un point.
// Usage : node controle-moment-ligne.mjs <etat.html>... [--captures=<dossier>] ; imprime MOMENT OK ou MOMENT ECHEC n.
// Joue, sur chaque maquette : l'état #sucre (Dextrose à l'ébullition), puis Weizenmalz passé en fermentation sur la ligne.
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { versUrl, existe } from '../../refonte-frontend/v4/tournoi/outils/lib/cible.mjs';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(ICI, '../../../package.json'));
const puppeteer = require('puppeteer-core');
// p8-port : la cible peut être une adresse servie (controle-choix.mjs --url=… --gabarit=…, lib/cible.mjs). L'app pose son état de banc
// (recette et stock de la maquette) en tâche asynchrone et le dit dans document.body.dataset.apercu : on l'attend. Réseau externe coupé.
const SERVI = !!process.env.AFFINEE_CIBLE_URL;
const attendre = async (p, etat) => {
  if (!SERVI) return;
  await p.waitForFunction((e) => document.body.dataset.apercu === (e || 'repos') && document.querySelector('[data-sel]') !== null, { timeout: 90000 }, etat || '');
  await new Promise((r) => setTimeout(r, 400));
};
const etatUrl = (u, h) => (SERVI ? (h ? u.split('malts=maquette').join('malts=' + h) : u) : u + (h ? '#' + h : ''));
const couper = async (p) => {
  if (!SERVI) return;
  await p.setRequestInterception(true);
  const local = (u) => ['http://localhost', 'http://127.0.0.1', 'ws://localhost', 'ws://127.0.0.1', 'data:', 'blob:', 'about:'].some((d) => u.startsWith(d));
  p.on('request', (r) => (local(r.url()) ? r.continue() : r.abort('blockedbyclient')));
};
const args = process.argv.slice(2);
const caps = args.find((a) => a.startsWith('--captures='))?.slice(11);
const pages = args.filter((a) => !a.startsWith('--'));
if (!pages.length) { console.log('MOMENT ECHEC 1 (aucune maquette)'); process.exit(1); }
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const p = await b.newPage();
await couper(p);
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const pret = () => p.evaluate(() => document.fonts.ready.then(() => new Promise((r) => setTimeout(r, 150))));
let echecs = 0;
for (const f of pages) {
  const nom = path.basename(path.dirname(path.resolve(f))) + '/' + path.basename(f);
  await p.goto(etatUrl(versUrl(path.resolve(f)).href, 'sucre')); await attendre(p, 'sucre'); await pret();
  // Weizenmalz (ligne 1) en fermentation, sur la ligne : par le menu (a) ou en deux touchers (b).
  if (await p.$('[data-role="moment-ligne"][aria-haspopup]')) {
    await p.tap('[data-ml="1"]'); await pret();
    const ch = await p.$$('[data-mc="1"]');
    for (const c of ch) if ((await c.evaluate((e) => e.textContent.trim())) === 'fermentation') { await c.tap(); break; }
    await pret();
  } else {
    await p.tap('[data-ml="1"]'); await pret(); await p.tap('[data-ml="1"]'); await pret();
    await new Promise((r) => setTimeout(r, 6600)); await pret();
  }
  await p.evaluate(() => document.activeElement?.blur());
  await pret();
  const mesures = await p.evaluate(() => [...document.querySelectorAll('[data-sel]')].map((li) => {
    const el = li.querySelector('.r4e-mf') || li.querySelector('[data-role="moment-ligne"]');
    const s = getComputedStyle(el);
    const vide = (c) => c === 'transparent' || /rgba\([^)]*,\s*0\)$/.test(c);
    return { nom: li.querySelector('[data-role="nom"]').textContent, mot: el.textContent.trim(), fond: s.backgroundColor, bord: s.borderTopColor,
      ok: vide(s.backgroundColor) && (vide(s.borderTopColor) || s.borderTopWidth === '0px') };
  }));
  const moments = mesures.map((m) => m.mot).join(' / ');
  if (!/ébullition/.test(moments) || !/J\+/.test(moments)) { echecs++; console.log(`ECHEC ${nom} : états non joués (${moments})`); }
  for (const m of mesures) {
    if (!m.ok) echecs++;
    console.log(`${m.ok ? 'OK   ' : 'ECHEC'} ${nom} ${m.nom} « ${m.mot} » : fond ${m.fond}, bordure ${m.bord}`);
  }
  if (caps) await p.screenshot({ path: path.join(caps, nom.replace(/[\/]/g, '-').replace('.html', '') + '-moments.png') });
}
await b.close();
console.log(echecs ? `MOMENT ECHEC ${echecs}` : 'MOMENT OK');
