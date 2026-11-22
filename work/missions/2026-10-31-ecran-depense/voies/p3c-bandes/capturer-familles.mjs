#!/usr/bin/env node
// Voie p3c-bandes : l'écran « Nouvelle dépense » servi (état d'aperçu `familles`, lecture SIMULÉE de toutes les familles) à 390 tactile et à 1280,
// repos, défilé, bande ouverte, thème clair et sombre ; chaque capture est écrite côte à côte avec p3c-3 (maquette choisie) au repos.
// Fixtures seulement. Usage (le serveur tourne dans la copie isolée) :
//   node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs "node scripts/with_server.mjs --server \"npm run dev -- --port 3462 --strictPort\" --port 3462 --env VITE_FIREBASE_API_KEY=fake -- node <ce script> --sortie=<dossier>"
// Sortie : « FAMILLES OK » (code 0) ou « FAMILLES ECHEC n » et la liste. Les fichiers de sortie vont dans --sortie (défaut : captures/ à côté de ce script).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(process.cwd());
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const argv = process.argv.slice(2);
const valeur = (n) => argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const port = (process.env.WITH_SERVER_PORTS ?? '').split(',')[0];
const ADRESSE = (valeur('url') ?? `http://localhost:${port}`).replace(/\/$/, '');
const SORTIE = path.resolve(valeur('sortie') ?? path.join(import.meta.dirname, 'captures'));
fs.mkdirSync(SORTIE, { recursive: true });
const MAQ = pathToFileURL(path.resolve(valeur('maquette') ?? path.join(import.meta.dirname, '..', '..', 'v3', 'p3c-3', 'etat.html'))).href;
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const MODES = [
  { id: 'tactile390', l: 390, h: 844, tactile: true, echelle: 2 },
  { id: 'pc1280', l: 1280, h: 800, tactile: false, echelle: 1 },
];
const local = (u) => ['http://localhost', 'http://127.0.0.1', 'ws://localhost', 'ws://127.0.0.1', 'data:', 'blob:', 'about:', 'file:'].some((d) => u.startsWith(d));
const POLICES = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const fautes = [], infos = [], horsLocal = [];
const noter = (ok, texte) => { console.error((ok ? 'ok ' : 'ECHEC ') + texte.slice(0, 200)); infos.push(`${ok ? 'OK   ' : 'ECHEC'} ${texte}`); if (!ok) fautes.push(texte); };

const BANDES_ATTENDUES = ['Malts', 'Houblons', 'Levures', 'Sucres', 'Additifs', 'Matériel de brassage', 'Emballage', 'Nettoyage', 'Consommables', 'Services', 'Autres'];

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
      if (essai === 3) { await p.screenshot({ path: path.join(SORTIE, `echec-ouverture-${mode.id}.png`) }); throw new Error(`l’écran ne s’est pas ouvert : ${String(e.message).slice(0, 100)} · ${p.erreurs.join(' / ')}`); }
    }
  }
  await dormir(600);
  return p;
}
async function ouvrirMaq(nav, mode) {
  const p = await nav.newPage();
  await p.setViewport({ width: mode.l, height: mode.h, isMobile: mode.tactile, hasTouch: mode.tactile, deviceScaleFactor: mode.echelle });
  await p.setRequestInterception(true);
  p.on('request', (r) => { if (local(r.url())) r.continue(); else r.abort('blockedbyclient'); });
  await p.goto(`${MAQ}?etat=repos`);
  await p.waitForSelector('#p3a3-root > *, body > *', { timeout: 30000 });
  await dormir(500);
  return p;
}
async function coteACote(nav, mode, nom, app, maq) {
  await app.bringToFront(); await dormir(150);
  const a = await app.screenshot({ encoding: 'base64' });
  let m = null;
  if (maq) { await maq.bringToFront(); await dormir(150); m = await maq.screenshot({ encoding: 'base64' }); }
  const q = await nav.newPage();
  await q.setViewport({ width: mode.l * (m ? 2 : 1) + 12, height: mode.h });
  await q.setContent(`<body style="margin:0;background:#888;display:flex;gap:12px"><img style="width:${mode.l}px" src="data:image/png;base64,${a}">${m ? `<img style="width:${mode.l}px" src="data:image/png;base64,${m}">` : ''}</body>`);
  await q.screenshot({ path: path.join(SORTIE, `${mode.id}-${nom}.png`) });
  await q.close();
}
const seule = async (mode, nom, app) => { await app.bringToFront(); await dormir(150); await app.screenshot({ path: path.join(SORTIE, `${mode.id}-${nom}.png`) }); };

const lire = (p) => p.evaluate(() => [...document.querySelectorAll('[data-dp-bande]:not([data-dp-bande="papier"])')].map((b) => ({
  cle: b.getAttribute('data-dp-bande'), nom: b.querySelector('strong')?.textContent ?? '', compte: b.querySelector('[data-dp-bande-entete] span')?.textContent ?? '',
  qte: b.querySelector('[data-dp-sous-qte]')?.textContent ?? '', montant: b.querySelector('[data-dp-sous-montant]')?.textContent ?? '',
  lignes: [...b.querySelectorAll('article[data-dp-ligne]')].map((a) => a.querySelector('[data-dp-nom]')?.textContent ?? ''),
  teinte: getComputedStyle(b.querySelector('[data-dp-bande-entete]')).backgroundImage.slice(0, 60), point: getComputedStyle(b.querySelector('[data-dp-bande-entete] i')).backgroundColor,
  filet: (() => { const a = b.querySelector('article[data-dp-ligne]'); return a ? getComputedStyle(a).borderLeftColor + ' ' + getComputedStyle(a).borderLeftWidth : ''; })(),
})));
const alignement = (p) => p.evaluate(() => {
  const sorties = [];
  for (const b of document.querySelectorAll('[data-dp-bande]:not([data-dp-bande="papier"]):not([hidden])')) {
    const sq = b.querySelector('[data-dp-sous-qte]')?.getBoundingClientRect(), sm = b.querySelector('[data-dp-sous-montant]')?.getBoundingClientRect();
    if (!sq || !sm) continue;
    let ecartM = 0, n = 0;
    for (const a of b.querySelectorAll('article[data-dp-ligne]:not([hidden])')) {
      if (a.parentElement.closest('article[data-dp-ligne]')) continue;
      const m = a.querySelector('summary [data-dp-montant]'); if (!m) continue;
      n++; ecartM = Math.max(ecartM, Math.abs(m.getBoundingClientRect().right - sm.right));
    }
    sorties.push({ bande: b.getAttribute('data-dp-bande'), n, ecartM: Math.round(ecartM * 10) / 10 });
  }
  return sorties;
});
const debordement = (p) => p.evaluate(() => { const d = document.querySelector('[role="dialog"]'); return Math.max(document.documentElement.scrollWidth - innerWidth, (d?.scrollWidth ?? 0) - (d?.clientWidth ?? 0)); });
const defiler = (p, cle) => p.evaluate((k) => { document.querySelector(`[data-dp-bande="${k}"]`).scrollIntoView({ block: 'start' }); }, cle).then(() => dormir(350));
// La couleur RENDUE de chaque bande, par thème (critique du 01.11, défaut 5 : un contrôle qui compte des classes a laissé passer deux bandes identiques en sombre).
// Pastille : ΔE (CIE76, Lab) d'au moins 15 entre deux bandes quelconques. Fond d'en-tête (teinte composée sur la page) : ΔE d'au moins 3. Les 4 bandes qu'il a validées
// (Malts, Houblons, Levures, Autres) sont exemptées du rapport pastille/fond ; les sept autres : au moins 2,2:1 (l'ambre et l'or ne tiennent pas 3:1 sur leur fond).
const lab = ([r, g, b]) => { const f = (c) => { c /= 255; return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92; }; const [R, G, B] = [f(r), f(g), f(b)];
  const X = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047, Y = 0.2126 * R + 0.7152 * G + 0.0722 * B, Z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883;
  const h = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116); return [116 * h(Y) - 16, 500 * (h(X) - h(Y)), 200 * (h(Y) - h(Z))]; };
const dE = (a, b) => { const A = lab(a), B = lab(b); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); };
const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const contraste = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const couleursRendues = (p) => p.evaluate(() => {
  const nombres = (t) => (t.match(/[\d.]+/g) ?? []).map(Number);
  return [...document.querySelectorAll('[data-dp-bande]:not([data-dp-bande="papier"])')].map((b) => {
    const e = b.querySelector('[data-dp-bande-entete]'), cs = getComputedStyle(e), base = nombres(cs.backgroundColor).slice(0, 3);
    const grad = nombres((cs.backgroundImage.match(/rgba?\([^)]*\)/) ?? [''])[0]), a = grad.length > 3 ? grad[3] : 1, tint = grad.slice(0, 3);
    const fond = base.map((c, i) => Math.round(c * (1 - a) + (tint[i] ?? c) * a));
    return { cle: b.getAttribute('data-dp-bande'), pastille: nombres(getComputedStyle(e.querySelector('i')).backgroundColor).slice(0, 3), fond };
  });
});
const ANCIEN = argv.includes('--ancien');
async function controlerCouleurs(app, mode, t) {
  if (ANCIEN) await app.evaluate((x) => { const s = document.createElement('style'); s.textContent = x === 'cave'
    ? "[data-theme='cave']{--dp-fam-emballage:107 58 30;--dp-fam-nettoyage:163 201 122;--dp-fam-consommable:154 138 126;--dp-fam-service:160 82 45}"
    : "[data-theme='clair']{--dp-fam-emballage:107 58 30;--dp-fam-nettoyage:76 107 42;--dp-fam-consommable:158 158 158;--dp-fam-service:160 82 45}"; document.head.appendChild(s); }, t);
  await dormir(200);
  const c = await couleursRendues(app), mal = [];
  for (let i = 0; i < c.length; i++) for (let j = i + 1; j < c.length; j++) {
    const dp = dE(c[i].pastille, c[j].pastille), df = dE(c[i].fond, c[j].fond);
    if (dp < 15) mal.push(`pastilles ${c[i].cle}/${c[j].cle} ΔE ${dp.toFixed(1)}`);
    if (df < 3) mal.push(`fonds ${c[i].cle}/${c[j].cle} ΔE ${df.toFixed(1)}`);
  }
  for (const x of c) { if (['malt', 'houblon', 'levure', 'autres'].includes(x.cle)) continue; const k = contraste(x.pastille, x.fond); if (k < 2.2) mal.push(`pastille/fond ${x.cle} ${k.toFixed(2)}:1`); }
  noter(mal.length === 0, `${mode.id} · COULEURS RENDUES ${t} : ${c.length} bandes, pastilles ΔE ≥ 15, fonds ΔE ≥ 3, pastille/fond ≥ 2,2:1${mal.length ? ' — ' + mal.join(' ; ') : ''}`);
}
const theme = (p, t) => p.evaluate((x) => { document.documentElement.dataset.theme = x; }, t).then(() => dormir(250));

const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new', protocolTimeout: 240000, args: ['--no-sandbox'] });
try {
  for (const mode of MODES) {
    const e = (s) => `${mode.id} · ${s}`;
    let app = null, maq = null;
    try {
      app = await ouvrirApp(nav, mode, 'familles');
      maq = await ouvrirMaq(nav, mode);
      // Repos, thème clair : côte à côte avec p3c-3.
      await theme(app, 'clair');
      const bandes = await lire(app);
      noter(bandes.map((b) => b.nom).join('|') === BANDES_ATTENDUES.join('|'), e(`les onze bandes, dans l’ordre (${bandes.map((b) => b.nom).join(' | ')})`));
      noter(bandes.find((b) => b.cle === 'autres')?.lignes.join('|') === 'Divers fictif XJ-17', e(`« Autres » ne reçoit que l’inclassable (${bandes.find((b) => b.cle === 'autres')?.lignes.join(' | ')})`));
      const attendu = {
        materiel: 'Fermzilla 27 L|Hop Spider Bag', emballage: 'Kronkorken 26 mm (100)', nettoyage: 'Chemipro OXI 1 kg', consommable: 'Handschuhe Nitril M', service: 'Analyse Wasserprobe',
        levure: 'Omega OYL-200|SafAle US-05', sucre: 'Candi Syrup D-180', additif: 'Whirlfloc 10 Tabs|CaCl2 500 g',
      };
      for (const [cle, lignes] of Object.entries(attendu)) {
        const b = bandes.find((x) => x.cle === cle);
        noter(!!b && b.lignes.join('|').replace(/\s+/g, ' ') === lignes, e(`bande ${cle} : ${b?.lignes.join(' | ')} · sous-total ${b?.montant} · qté ${b?.qte}`));
      }
      noter(bandes.every((b) => /^\d/.test(b.montant) && b.compte.length > 0), e(`chaque bande porte son compte et son sous-total (${bandes.map((b) => `${b.nom} ${b.compte} ${b.qte} ${b.montant}`).join(' | ')})`));
      await controlerCouleurs(app, mode, 'clair'); await theme(app, 'cave'); await controlerCouleurs(app, mode, 'cave'); await theme(app, 'clair');
      const port = await app.evaluate(() => document.querySelector('[data-dp="port"]')?.textContent ?? '');
      noter(/10,75/.test(port), e(`le port reste hors des bandes : « ${port} »`));
      // Récap : dans chaque rangée de la preuve (« Somme = imprimé 359,40 »), le libellé ne touche jamais sa valeur (relevé du bout en bout, critique défaut 6).
      const chevauche = await app.evaluate(() => [...document.querySelectorAll('[data-dp="preuve"] button')].map((b) => {
        const t = b.querySelector('span.min-w-0'), v = b.querySelector('b'); if (!t || !v) return null;
        const r = document.createRange(); r.selectNodeContents(t); const rt = r.getBoundingClientRect(), rv = v.getBoundingClientRect();
        return rt.right > rv.left + 0.5 && rt.bottom > rv.top && rt.top < rv.bottom ? `${t.textContent} / ${v.textContent}` : null;
      }).filter(Boolean));
      noter(chevauche.length === 0, e(`RECAP : aucun libellé de la preuve ne chevauche sa valeur${chevauche.length ? ' (' + chevauche.join(' ; ') + ')' : ''}`));
      const al = await alignement(app);
      for (const b of al) noter(b.n > 0 && b.ecartM <= 1.5, e(`ALIGNE ${b.bande} : ${b.n} rangées, montant à ${b.ecartM} px du sous-total`));
      noter((await debordement(app)) <= 1, e(`aucun débordement horizontal (${await debordement(app)} px)`));
      await coteACote(nav, mode, 'repos', app, maq);
      // Défilé : la bande du matériel, puis la fin.
      await defiler(app, 'materiel'); await coteACote(nav, mode, 'materiel', app, null);
      await defiler(app, 'nettoyage'); await seule(mode, 'nettoyage', app);
      await defiler(app, 'autres'); await seule(mode, 'fin', app);
      // Une bande ouverte : le plateau d'une ligne du matériel.
      await defiler(app, 'materiel');
      await app.evaluate(() => document.querySelector('[data-dp-bande="materiel"] article[data-dp-ligne] summary').click()); await dormir(400);
      noter(await app.evaluate(() => document.querySelector('[data-dp-bande="materiel"] article[data-dp-ligne] details').open), e('toucher une rangée du matériel ouvre son plateau'));
      await seule(mode, 'materiel-ouvert', app);
      await app.evaluate(() => document.querySelector('[data-dp-bande="materiel"] article[data-dp-ligne] summary').click()); await dormir(250);
      // Thème sombre : repos et fin.
      await theme(app, 'cave');
      await app.evaluate(() => { document.querySelector('.dp-p3c-corps').scrollTop = 0; }); await dormir(300);
      await seule(mode, 'sombre-repos', app);
      await defiler(app, 'sucre'); await seule(mode, 'sombre-sucre', app);
      await defiler(app, 'emballage'); await seule(mode, 'sombre-emballage', app);
      await defiler(app, 'autres'); await seule(mode, 'sombre-fin', app);
      // Aperçu long : toute la liste d'un seul regard (fenêtre haute, hors geste).
      await app.setViewport({ width: mode.l, height: mode.l > 600 ? 1500 : 2900, isMobile: mode.tactile, hasTouch: mode.tactile, deviceScaleFactor: mode.tactile ? 1.5 : 1 }); await dormir(500);
      await app.evaluate(() => { document.querySelector('.dp-p3c-corps').scrollTop = 0; }); await theme(app, 'clair');
      await seule(mode, 'long-clair', app);
      await theme(app, 'cave'); await seule(mode, 'long-sombre', app);
      noter(app.erreurs.length === 0, e(`aucune erreur de console${app.erreurs.length ? ' (' + app.erreurs.join(' / ') + ')' : ''}`));
    } catch (err) { noter(false, e(`${String(err.message).slice(0, 200)}`)); }
    finally { await app?.close().catch(() => {}); await maq?.close().catch(() => {}); }
  }
} finally { await nav.close(); }
noter(horsLocal.length === 0, `aucune requête hors localhost${horsLocal.length ? ' : ' + [...new Set(horsLocal)].slice(0, 4).join(', ') : ''}`);
fs.writeFileSync(path.join(SORTIE, 'rapport.txt'), infos.join('\n') + '\n');
console.log(fautes.length ? `FAMILLES ECHEC ${fautes.length}\n${fautes.map((f) => '- ' + f).join('\n')}` : 'FAMILLES OK');
process.exit(fautes.length ? 1 : 0);
