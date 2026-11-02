#!/usr/bin/env node
// Voie r1-renovation (D306) : l'écran « Nouvelle dépense » servi sur deux états d'aperçu, SIMULÉS, à 390 tactile et à 1280, thème clair et sombre :
//   - `renovation` : une pièce de bricolage fictive (« Brico Fictif SA »), « Pour quoi ? » = renovation ; la bande Rénovation, en kaki, au repos puis ouverte ;
//   - `familles`   : la pièce de toutes les familles de p3c-bandes, qui ne doit pas bouger (onze bandes, pas de Rénovation, mêmes lignes dans les mêmes bandes).
// Fixtures seulement, aucun Gemini, aucune écriture. Usage (le serveur tourne dans la copie isolée) :
//   node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs "node scripts/with_server.mjs --server \"npm run dev -- --port 3463 --strictPort\" --port 3463 --env VITE_FIREBASE_API_KEY=fake -- node <ce script> --sortie=<dossier>"
// Sortie : « RENOVATION OK » (code 0) ou « RENOVATION ECHEC n » et la liste. Les fichiers vont dans --sortie (défaut : captures/ à côté de ce script).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const RACINE = path.resolve(process.cwd());
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const argv = process.argv.slice(2);
const valeur = (n) => argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const port = (process.env.WITH_SERVER_PORTS ?? '').split(',')[0];
const ADRESSE = (valeur('url') ?? `http://localhost:${port}`).replace(/\/$/, '');
const SORTIE = path.resolve(valeur('sortie') ?? path.join(import.meta.dirname, 'captures'));
fs.mkdirSync(SORTIE, { recursive: true });
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const MODES = [
  { id: 'tactile390', l: 390, h: 844, tactile: true, echelle: 2 },
  { id: 'pc1280', l: 1280, h: 800, tactile: false, echelle: 1 },
];
const local = (u) => ['http://localhost', 'http://127.0.0.1', 'ws://localhost', 'ws://127.0.0.1', 'data:', 'blob:', 'about:', 'file:'].some((d) => u.startsWith(d));
const POLICES = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const fautes = [], infos = [], horsLocal = [];
const noter = (ok, texte) => { console.error((ok ? 'ok ' : 'ECHEC ') + texte.slice(0, 220)); infos.push(`${ok ? 'OK   ' : 'ECHEC'} ${texte}`); if (!ok) fautes.push(texte); };

const ONZE = ['Malts', 'Houblons', 'Levures', 'Sucres', 'Additifs', 'Matériel de brassage', 'Emballage', 'Nettoyage', 'Consommables', 'Services', 'Autres'];
const SOUS_FAMILLES = ['Peinture et sols', 'Outillage', 'Quincaillerie', 'Électricité', 'Plomberie', 'Protection', 'Divers travaux'];

async function ouvrirApp(nav, mode, etat) {
  const p = await nav.newPage();
  await p.setViewport({ width: mode.l, height: mode.h, isMobile: mode.tactile, hasTouch: mode.tactile, deviceScaleFactor: mode.echelle });
  p.erreurs = [];
  p.on('pageerror', (e) => p.erreurs.push('PAGE ' + e.message.slice(0, 160)));
  p.on('console', (m) => { if (m.type() === 'error' && !/ERR_BLOCKED_BY_CLIENT|favicon|Failed to load resource/.test(m.text())) p.erreurs.push(m.text().slice(0, 160)); });
  await p.setRequestInterception(true);
  p.on('request', (r) => { if (local(r.url())) r.continue(); else { if (!POLICES.test(r.url())) horsLocal.push(r.url().slice(0, 90)); r.abort('blockedbyclient'); } });
  p.setDefaultNavigationTimeout(150000);
  for (let essai = 1; essai <= 3; essai++) {
    try {
      await p.goto(`${ADRESSE}/?dev-local&depense=${etat}`, { waitUntil: 'domcontentloaded' });
      await p.waitForFunction(() => document.querySelectorAll('button').length > 3, { timeout: 150000 });
      await dormir(800);
      await p.click('[aria-label="Actions rapides"]');
      await p.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => /Entrer une facture/.test(b.textContent)), { timeout: 20000 });
      await p.evaluate(() => [...document.querySelectorAll('button')].find((b) => /Entrer une facture/.test(b.textContent)).click());
      await p.waitForFunction((e) => document.body.dataset.apercu === e, { timeout: 45000 }, etat);
      break;
    } catch (e) {
      if (essai === 3) { await p.screenshot({ path: path.join(SORTIE, `echec-ouverture-${mode.id}-${etat}.png`) }); throw new Error(`l’écran ne s’est pas ouvert : ${String(e.message).slice(0, 100)} · ${p.erreurs.join(' / ')}`); }
    }
  }
  await dormir(600);
  return p;
}
const seule = async (mode, nom, app) => { await app.bringToFront(); await dormir(150); await app.screenshot({ path: path.join(SORTIE, `${mode.id}-${nom}.png`) }); };
const theme = (p, t) => p.evaluate((x) => { document.documentElement.dataset.theme = x; }, t).then(() => dormir(250));
const defiler = (p, cle) => p.evaluate((k) => { document.querySelector(`[data-dp-bande="${k}"]`).scrollIntoView({ block: 'start' }); }, cle).then(() => dormir(350));
const debordement = (p) => p.evaluate(() => { const d = document.querySelector('[role="dialog"]'); return Math.max(document.documentElement.scrollWidth - innerWidth, (d?.scrollWidth ?? 0) - (d?.clientWidth ?? 0)); });

const lire = (p) => p.evaluate(() => [...document.querySelectorAll('[data-dp-bande]:not([data-dp-bande="papier"])')].map((b) => ({
  cle: b.getAttribute('data-dp-bande'), nom: b.querySelector('strong')?.textContent ?? '', compte: b.querySelector('[data-dp-bande-entete] span')?.textContent ?? '',
  montant: b.querySelector('[data-dp-sous-montant]')?.textContent ?? '',
  lignes: [...b.querySelectorAll('article[data-dp-ligne]')].map((a) => a.querySelector('[data-dp-nom]')?.textContent ?? ''),
  stocks: [...b.querySelectorAll('article[data-dp-ligne] select[aria-label^="Stock ligne"]')].map((s) => s.value),
  pastille: getComputedStyle(b.querySelector('[data-dp-bande-entete] i')).backgroundColor,
  teinte: getComputedStyle(b.querySelector('[data-dp-bande-entete]')).backgroundImage.slice(0, 70),
  filet: (() => { const a = b.querySelector('article[data-dp-ligne]'); return a ? getComputedStyle(a).borderLeftColor + ' ' + getComputedStyle(a).borderLeftWidth : ''; })(),
})));
const nombres = (t) => (t.match(/[\d.]+/g) ?? []).map(Number);
const lab = ([r, g, b]) => { const f = (c) => { c /= 255; return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92; }; const [R, G, B] = [f(r), f(g), f(b)];
  const X = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047, Y = 0.2126 * R + 0.7152 * G + 0.0722 * B, Z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883;
  const h = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116); return [116 * h(Y) - 16, 500 * (h(X) - h(Y)), 200 * (h(Y) - h(Z))]; };
const dE = (a, b) => { const A = lab(a), B = lab(b); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); };
const rougeAlerte = (p) => p.evaluate(() => { const s = document.createElement('span'); s.className = 'text-alert'; document.body.appendChild(s); const c = getComputedStyle(s).color; s.remove(); return c; });
const texteCorps = (p) => p.evaluate(() => document.body.innerText);

const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new', protocolTimeout: 240000, args: ['--no-sandbox'] });
try {
  for (const mode of MODES) {
    const e = (s) => `${mode.id} · ${s}`;
    const pastilles = { clair: {}, cave: {} };
    // ——— L'état « familles » : inchangé ———
    let app = null;
    try {
      app = await ouvrirApp(nav, mode, 'familles');
      await theme(app, 'clair');
      const bandes = await lire(app);
      noter(bandes.map((b) => b.nom).join('|') === ONZE.join('|'), e(`FAMILLES inchangé : les onze bandes, dans l’ordre, sans Rénovation (${bandes.map((b) => b.nom).join(' | ')})`));
      const attendu = {
        materiel: 'Fermzilla 27 L|Hop Spider Bag', emballage: 'Kronkorken 26 mm (100)', nettoyage: 'Chemipro OXI 1 kg', consommable: 'Handschuhe Nitril M', service: 'Analyse Wasserprobe', autres: 'Divers fictif XJ-17',
        levure: 'Omega OYL-200|SafAle US-05', sucre: 'Candi Syrup D-180', additif: 'Whirlfloc 10 Tabs|CaCl2 500 g',
      };
      for (const [cle, lignes] of Object.entries(attendu)) {
        const b = bandes.find((x) => x.cle === cle);
        noter(!!b && b.lignes.join('|').replace(/\s+/g, ' ') === lignes, e(`FAMILLES bande ${cle} : ${b?.lignes.join(' | ')}`));
      }
      for (const t of ['clair', 'cave']) { await theme(app, t); for (const b of await lire(app)) pastilles[t][b.cle] = nombres(b.pastille).slice(0, 3); }
      await theme(app, 'clair');
      noter((await debordement(app)) <= 1, e(`FAMILLES aucun débordement horizontal (${await debordement(app)} px)`));
      await seule(mode, 'familles-repos-clair', app);
      await theme(app, 'cave'); await seule(mode, 'familles-repos-sombre', app);
      noter(app.erreurs.length === 0, e(`FAMILLES aucune erreur de console${app.erreurs.length ? ' (' + app.erreurs.join(' / ') + ')' : ''}`));
    } catch (err) { noter(false, e(`familles : ${String(err.message).slice(0, 200)}`)); }
    finally { await app?.close().catch(() => {}); }

    // ——— L'état « renovation » ———
    app = null;
    try {
      app = await ouvrirApp(nav, mode, 'renovation');
      await theme(app, 'clair');
      const bandes = await lire(app);
      const noms = bandes.map((b) => b.nom);
      noter(noms.join('|') === ['Nettoyage', 'Rénovation'].join('|'), e(`RENOVATION : deux bandes seulement, Nettoyage puis Rénovation — ni « Autres » ni « Matériel de brassage » (${noms.join(' | ')})`));
      const ren = bandes.find((b) => b.cle === 'renovation'), net = bandes.find((b) => b.cle === 'nettoyage');
      noter(!!ren && ren.lignes.length === 16, e(`RENOVATION : 16 lignes en Rénovation (${ren?.lignes.length}) : ${ren?.lignes.join(' | ')}`));
      noter(!!net && net.lignes.length === 1 && /Détartrant/.test(net.lignes[0]), e(`RENOVATION : le détartrant est en Nettoyage (${net?.lignes.join(' | ')})`));
      noter(!!ren && ['Eimer', 'Brosse', 'Gants', 'Dübel', 'Presa', 'Mitigeur', 'Étagère'].every((m) => ren.lignes.some((l) => l.includes(m))), e('RENOVATION : le seau, la brosse, les gants, les chevilles, la prise, le mitigeur et l’étagère sans mot reconnu sont dans la bande'));
      noter(!!ren && ren.stocks.length === 0, e(`RENOVATION : aucune ligne de la bande n’est liée au stock (${ren?.stocks.length} sélecteurs, valeurs : ${[...new Set(ren?.stocks)].join(',')})`));
      const port = await app.evaluate(() => document.querySelector('[data-dp="port"]')?.textContent ?? '');
      noter(/9,90/.test(port), e(`RENOVATION : le port reste hors des bandes : « ${port} »`));
      const corps = await texteCorps(app);
      noter(!SOUS_FAMILLES.some((s) => corps.includes(s)), e('RENOVATION : aucune sous-famille n’est affichée (elle n’existe que dans la fonction pure)'));
      noter(/Rénovation/.test(corps) && /^\d/.test(ren?.montant ?? ''), e(`RENOVATION : la bande porte son compte (${ren?.compte}) et son sous-total (${ren?.montant})`));
      noter((await debordement(app)) <= 1, e(`RENOVATION aucun débordement horizontal (${await debordement(app)} px)`));
      // Couleur rendue : le kaki fixé par D306, par thème ; distincte des onze autres (ΔE ≥ 15) et du rouge d'alerte.
      const alerte = nombres(await rougeAlerte(app)).slice(0, 3);
      for (const [t, kaki] of [['clair', [120, 112, 28]], ['cave', [196, 186, 90]]]) {
        await theme(app, t);
        const r = (await lire(app)).find((b) => b.cle === 'renovation');
        const rendu = nombres(r.pastille).slice(0, 3);
        pastilles[t].renovation = rendu;
        noter(rendu.join(',') === kaki.join(','), e(`RENOVATION couleur ${t} : pastille rgb(${rendu.join(' ')}) = kaki fixé (${kaki.join(' ')})`));
        noter(/rgb/.test(r.filet) && nombres(r.filet).slice(0, 3).join(',') === kaki.join(','), e(`RENOVATION filet de gauche ${t} : ${r.filet}`));
        const mal = Object.entries(pastilles[t]).filter(([cle]) => cle !== 'renovation').map(([cle, c]) => [cle, dE(c, rendu)]).filter(([, d]) => d < 15);
        noter(mal.length === 0, e(`RENOVATION ΔE ${t} : le kaki est à ≥ 15 des onze autres pastilles${mal.length ? ' — trop proche de ' + mal.map(([c, d]) => `${c} ${d.toFixed(1)}`).join(', ') : ''}`));
        const dA = dE(alerte, rendu);
        noter(dA >= 15, e(`RENOVATION ΔE ${t} : le kaki est à ${dA.toFixed(1)} du rouge d’alerte (≥ 15)`));
      }
      // Repos, bande Rénovation, bande ouverte (un plateau), clair puis sombre.
      await theme(app, 'clair');
      await app.evaluate(() => { document.querySelector('.dp-p3c-corps').scrollTop = 0; }); await dormir(300);
      await seule(mode, 'renovation-repos-clair', app);
      await defiler(app, 'renovation'); await seule(mode, 'renovation-bande-clair', app);
      await app.evaluate(() => document.querySelector('[data-dp-bande="renovation"] article[data-dp-ligne] summary').click()); await dormir(400);
      noter(await app.evaluate(() => document.querySelector('[data-dp-bande="renovation"] article[data-dp-ligne] details').open), e('RENOVATION : toucher une rangée de la bande ouvre son plateau'));
      await seule(mode, 'renovation-ouvert-clair', app);
      await app.evaluate(() => document.querySelector('[data-dp-bande="renovation"] article[data-dp-ligne] summary').click()); await dormir(250);
      await theme(app, 'cave');
      await app.evaluate(() => { document.querySelector('.dp-p3c-corps').scrollTop = 0; }); await dormir(300);
      await seule(mode, 'renovation-repos-sombre', app);
      await defiler(app, 'renovation'); await seule(mode, 'renovation-bande-sombre', app);
      await app.evaluate(() => document.querySelector('[data-dp-bande="renovation"] article[data-dp-ligne] summary').click()); await dormir(400);
      await seule(mode, 'renovation-ouvert-sombre', app);
      // Aperçu long : toute la liste d'un seul regard (fenêtre haute, hors geste).
      await app.setViewport({ width: mode.l, height: mode.l > 600 ? 1500 : 2900, isMobile: mode.tactile, hasTouch: mode.tactile, deviceScaleFactor: mode.tactile ? 1.5 : 1 }); await dormir(500);
      await app.evaluate(() => { document.querySelector('.dp-p3c-corps').scrollTop = 0; }); await theme(app, 'clair');
      await seule(mode, 'renovation-long-clair', app);
      await theme(app, 'cave'); await seule(mode, 'renovation-long-sombre', app);
      noter(app.erreurs.length === 0, e(`RENOVATION aucune erreur de console${app.erreurs.length ? ' (' + app.erreurs.join(' / ') + ')' : ''}`));
    } catch (err) { noter(false, e(`renovation : ${String(err.message).slice(0, 200)}`)); }
    finally { await app?.close().catch(() => {}); }
  }
} finally { await nav.close(); }
noter(horsLocal.length === 0, `aucune requête hors localhost${horsLocal.length ? ' : ' + [...new Set(horsLocal)].slice(0, 4).join(', ') : ''}`);
fs.writeFileSync(path.join(SORTIE, 'rapport.txt'), infos.join('\n') + '\n');
console.log(fautes.length ? `RENOVATION ECHEC ${fautes.length}\n${fautes.map((f) => '- ' + f).join('\n')}` : 'RENOVATION OK');
process.exit(fautes.length ? 1 : 0);
