#!/usr/bin/env node
// Voie e-ecran (lenteur D, D308) : l'écran « Nouvelle dépense » servi sur les états d'aperçu SIMULÉS `lenteur-*` (Brauhaus Ouest, de ses maquettes), à 390 tactile et à 1280, thème clair ; sombre pour `lenteur-lue`.
// Chaque capture de l'app est écrite côte à côte avec la vue de sa maquette (`cote-<mode>-<état>-<thème>.png` : app | maquette). Mesures : hauteur du fil (22 px), place de la puce « ↻ N corrigées » (sur la rangée
// des puces, à droite de « à remplir », même hauteur qu'elles), bandeau des lignes pas retrouvées au-dessus du pied, aucun débordement horizontal, aucune erreur de console, aucune requête hors localhost.
// Fixtures seulement, aucun Gemini, aucune écriture. Usage (depuis la racine du dépôt ; le serveur tourne dans la copie isolée) :
//   node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs "node scripts/with_server.mjs --server \"npm run dev -- --port 3471 --strictPort\" --port 3471 --env VITE_FIREBASE_API_KEY=fake -- node <chemin absolu de ce script> --sortie=<dossier>"
// Sortie : « ECRAN-D OK » (code 0) ou « ECRAN-D ECHEC n » et la liste.
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
const MISSION = path.resolve(import.meta.dirname, '..', '..');
fs.mkdirSync(SORTIE, { recursive: true });
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const MODES = [{ id: 'tactile390', l: 390, h: 844, tactile: true, echelle: 2 }, { id: 'pc1280', l: 1280, h: 800, tactile: false, echelle: 1 }];
const local = (u) => ['http://localhost', 'http://127.0.0.1', 'ws://localhost', 'ws://127.0.0.1', 'data:', 'blob:', 'about:', 'file:'].some((d) => u.startsWith(d));
const POLICES = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const fautes = [], horsLocal = [];
const noter = (ok, texte) => { console.error((ok ? 'ok ' : 'ECHEC ') + texte.slice(0, 260)); if (!ok) fautes.push(texte); };

// état d'aperçu → [maquette (relative à la mission), légende]
const ETATS = [
  ['provisoire', 'choix-lenteur/img/d-06.png', 'd-06 : le fil, « Lectures ●●◌ », Confirmer gris avec sa roue'],
  ['lue', 'choix-lenteur/img/d-lue.png', 'd-lue : le fil part, « ↻ 3 corrigées », valeurs bleues, ancienne valeur barrée'],
  ['echec', 'choix-cas-38/img/q2-a.png', 'q2-a : la 3.8 coupée, « 2 lectures », « Lecture coupée »'],
  ['touchee', 'choix-lenteur/img/d-lue.png', 'd-lue (sa saisie : la quantité de Pilsner tapée n’est pas réécrite, sans bleu)'],
  ['sans-38', 'choix-cas-38/img/q2-avant.png', 'q2-avant : l’écran final d’emblée, sans fil'],
  ['ajoutee', 'choix-lignes-38/img/q1-b.png', 'q1-b : la ligne ajoutée (↻, rangée bleue)'],
  ['perdue', 'choix-lignes-38/img/q2-d-arrivee.png', 'q2-d-arrivee : la ligne pas retrouvée, barrée, bandeau au pouce'],
  ['perdues-2', 'choix-valider/img/b-arrivee.png', 'b-arrivee : « Tout valider », bandeau 1/2'],
  ['total', 'choix-cas-38/img/q1-a.png', 'q1-a : le total corrigé (bleu, 46,40 barré)'],
];

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
      // `touchee` : le final n'arrive qu'à 7 s : on tape d'abord (la rangée s'ouvre, la quantité de Pilsner passe à 12), puis on attend l'arrivée.
      if (etat === 'lenteur-touchee') {
        await p.waitForSelector('[data-dp="fil"]', { timeout: 45000 });
        // Le geste réel : toucher la rangée (son plateau s'ouvre par son propre toucher), puis taper dans la quantité du plateau ; le plateau reste ouvert jusqu'à l'arrivée du final.
        const sommaire = await p.waitForSelector('[data-dp-ligne="line-1"] summary');
        if (mode.tactile) await sommaire.tap(); else await sommaire.click();
        await p.waitForFunction(() => document.querySelector('[data-dp-ligne="line-1"] details')?.open === true, { timeout: 5000 });
        const champ = await p.waitForSelector('[data-dp-ligne="line-1"] [aria-label="Quantité ligne 1"]', { visible: true });
        await champ.click({ clickCount: 3 }); await p.keyboard.type('12'); await p.keyboard.press('Tab');
        p.qteTapee = await p.evaluate(() => document.querySelector('[data-dp-ligne="line-1"] [aria-label="Quantité ligne 1"]').value);
        await p.evaluate(() => { const d = document.querySelector('[data-dp-ligne="line-1"] details'); if (d?.open) d.querySelector('summary').click(); }); // referme le plateau par son toucher
      }
      await p.waitForFunction((e) => document.body.dataset.apercu === e, { timeout: 45000 }, etat);
      break;
    } catch (e) {
      if (essai === 3) { await p.screenshot({ path: path.join(SORTIE, `echec-ouverture-${mode.id}-${etat}.png`) }); throw new Error(`l’écran ne s’est pas ouvert : ${String(e.message).slice(0, 100)} · ${p.erreurs.join(' / ')}`); }
    }
  }
  await dormir(600);
  return p;
}
const theme = (p, t) => p.evaluate((x) => { document.documentElement.dataset.theme = x; }, t).then(() => dormir(250));
const uri = (f) => `data:image/png;base64,${fs.readFileSync(f).toString('base64')}`;
let pageCote = null;
async function capturer(nav, p, mode, nom, th, maquette, legende) {
  await p.bringToFront(); await dormir(150);
  const seule = path.join(SORTIE, `${mode.id}-${nom}-${th}.png`);
  await p.screenshot({ path: seule });
  pageCote ??= await nav.newPage();
  await pageCote.setViewport({ width: 2000, height: 900, deviceScaleFactor: 1 });
  const fond = th === 'cave' ? '#1c1a17' : '#ddd';
  await pageCote.setContent(`<body style="margin:0;padding:12px;background:${fond};font:14px sans-serif;color:${th === 'cave' ? '#eee' : '#222'}"><div style="display:flex;gap:16px;align-items:flex-start">
    <figure style="margin:0"><figcaption style="margin-bottom:6px"><b>L’app</b> · ${mode.id} · ${th} · ${nom}</figcaption><img src="${uri(seule)}" style="display:block;border:1px solid #888"></figure>
    <figure style="margin:0"><figcaption style="margin-bottom:6px"><b>Sa maquette</b> · ${maquette} · ${legende}</figcaption><img src="${uri(path.join(MISSION, maquette))}" style="display:block;border:1px solid #888"></figure></div></body>`);
  await pageCote.evaluate(() => Promise.all([...document.images].map((i) => i.decode())));
  const dim = await pageCote.evaluate(() => ({ w: document.body.scrollWidth, h: document.body.scrollHeight }));
  await pageCote.setViewport({ width: dim.w, height: dim.h, deviceScaleFactor: 1 });
  await pageCote.screenshot({ path: path.join(SORTIE, `cote-${mode.id}-${nom}-${th}.png`) });
}
const mesures = (p) => p.evaluate(() => {
  const r = (s) => document.querySelector(s)?.getBoundingClientRect();
  const fil = r('[data-dp="fil"]'), puce = r('[data-va="corrigees"]'), remplir = r('[data-va="remplir"]'), controler = r('[data-va="controler"]'), bandeau = r('[data-dp="perdues"]'), pied = r('footer'), dialog = document.querySelector('[role="dialog"]');
  return {
    fil: fil ? { h: fil.height, haut: fil.top } : null, puce: puce ? { top: puce.top, h: puce.height, gauche: puce.left, texte: document.querySelector('[data-va="corrigees"]').textContent } : null,
    puceDerniere: (() => { const p = document.querySelector('[data-va="corrigees"]'), autre = document.querySelector('[data-va="controler"], [data-va="remplir"], [data-va="relie"]'); return Boolean(p && autre && p.parentElement === autre.parentElement && p.parentElement.lastElementChild === p); })(),
    ligneDesPuces: [remplir, controler].filter(Boolean).map((x) => ({ top: x.top, droite: x.right })),
    bandeau: bandeau ? { bas: bandeau.bottom, hautPied: pied?.top ?? 0, h: bandeau.height } : null,
    debord: Math.max(document.documentElement.scrollWidth - innerWidth, (dialog?.scrollWidth ?? 0) - (dialog?.clientWidth ?? 0)),
    principal: (() => { const b = document.querySelector('button[data-primary]'); return b ? { off: b.disabled, aria: b.getAttribute('aria-label') } : null; })(),
    lectures: document.querySelector('[data-dp="preuve"]')?.textContent?.slice(0, 120) ?? null,
  };
});

const FILTRE = valeur('etats')?.split(',');
const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new', protocolTimeout: 240000, args: ['--no-sandbox'] });
try {
  for (const mode of MODES) {
    for (const [nom, maquette, legende] of ETATS) {
      if (FILTRE && !FILTRE.includes(nom)) continue;
      const e = (s) => `${mode.id} · ${nom} · ${s}`;
      let app = null;
      try {
        app = await ouvrirApp(nav, mode, `lenteur-${nom}`);
        await theme(app, 'clair');
        const m = await mesures(app);
        if (nom === 'provisoire') {
          noter(m.fil && Math.abs(m.fil.h - 22) <= 0.5, e(`le fil fait ${m.fil?.h} px (maquette : 22 px)`));
          noter(m.principal?.off === true && m.principal.aria === 'Vérification en cours', e(`Confirmer gris, aria « ${m.principal?.aria} »`));
          noter(/Lectures/.test(m.lectures ?? ''), e('la rangée « Lectures » de la preuve est là'));
        } else {
          noter(m.fil === null, e('le fil est parti'));
          noter(m.principal?.off === false, e('Confirmer est actif (noir)'));
        }
        if (['lue', 'touchee', 'ajoutee', 'perdue', 'perdues-2', 'total'].includes(nom)) {
          noter(Boolean(m.puce), e(`la puce « ↻ N corrigées » est là (« ${m.puce?.texte} »)`));
          // Sa maquette a quatre puces sur une rangée ; l'app en a jusqu'à six (proposés, nouveau…) : la puce est la DERNIÈRE de la même rangée de puces (elle passe dessous quand la ligne est pleine, le geste de filtre est celui des autres).
          noter(m.puceDerniere, e(`la puce est la dernière de la rangée des puces (haut ${m.puce?.top} ; autres ${m.ligneDesPuces.map((x) => x.top).join(',')})`));
        }
        if (nom === 'touchee') {
          // Sa saisie l'emporte (E2) : la quantité tapée pendant l'attente vaut 12, sans marque bleue ; son ancienne valeur n'est pas barrée ; le prix, lui, est corrigé ; la puce compte une correction de moins que `lue`.
          const t = await app.evaluate(() => { const l = document.querySelector('[data-dp-ligne="line-1"]'); return { qte: l.querySelector('[aria-label="Quantité ligne 1"]')?.value, qteBleue: l.querySelector('[data-dp-qte]')?.getAttribute('data-dp-corrige') === '1', prixBleu: l.querySelector('[data-dp-prix]')?.getAttribute('data-dp-corrige') === '1', avant: l.querySelector('[data-dp-avant]')?.textContent ?? null, qteAffichee: l.querySelector('[data-dp-qte]')?.textContent }; });
          noter(/^12/.test(app.qteTapee ?? ''), e(`la frappe a pris pendant l'attente (champ : « ${app.qteTapee} »)`));
          noter(/^12/.test(t.qte ?? '') && /^12/.test(t.qteAffichee ?? ''), e(`la quantité de Pilsner vaut 12 après le final (champ « ${t.qte} », rangée « ${t.qteAffichee} »)`));
          noter(!t.qteBleue, e('la quantité tapée n’a pas la marque bleue'));
          noter(t.prixBleu && /12/.test(t.avant ?? '') && !/10 Kg/.test(t.avant ?? ''), e(`l'ancienne quantité n'est pas barrée (avant : « ${t.avant} » : 12 est la sienne, seul l'ancien prix est barré) ; le prix, lui, est corrigé`));
          noter(/^3\D/.test(m.puce?.texte ?? ''), e(`la puce compte 3 : la rangée de Pilsner reste corrigée par son prix (1,45 → 2,90), seule sa quantité est la sienne (${m.puce?.texte})`));
        }
        if (nom === 'echec') noter(m.puce === null && /2 lectures/.test(m.lectures ?? ''), e(`aucune puce, « 2 lectures » : ${m.lectures}`));
        if (nom === 'sans-38') noter(m.puce === null && /Lectures/.test(m.lectures ?? ''), e('aucune puce, la rangée Lectures d’aujourd’hui'));
        if (nom === 'perdue' || nom === 'perdues-2') {
          noter(m.bandeau && m.bandeau.bas <= m.bandeau.hautPied + 1, e(`le bandeau est au-dessus du pied (bas ${m.bandeau?.bas}, pied ${m.bandeau?.hautPied}, ${m.bandeau?.h} px)`));
          const barrees = await app.evaluate(() => document.querySelectorAll('[data-dp-perdue]').length);
          noter(barrees === (nom === 'perdue' ? 1 : 2), e(`${barrees} rangée(s) barrée(s)`));
        }
        noter(m.debord <= 1, e(`aucun débordement horizontal (${m.debord} px)`));
        await capturer(nav, app, mode, nom, 'clair', maquette, legende);
        if (nom === 'lue') { await theme(app, 'cave'); await capturer(nav, app, mode, nom, 'cave', maquette, `${legende} (la maquette est claire : le sombre se juge sur ses jetons)`); }
        noter(app.erreurs.length === 0, e(`aucune erreur de console${app.erreurs.length ? ' (' + app.erreurs.join(' / ') + ')' : ''}`));
      } catch (err) { noter(false, e(String(err.message).slice(0, 220))); }
      finally { await app?.close().catch(() => {}); }
    }
  }
  noter(horsLocal.length === 0, `aucune requête hors localhost${horsLocal.length ? ' (' + [...new Set(horsLocal)].join(', ') + ')' : ''}`);
} finally { await nav.close(); }
if (fautes.length) { console.log(`ECRAN-D ECHEC ${fautes.length}`); for (const f of fautes) console.log(' - ' + f); process.exit(1); }
console.log('ECRAN-D OK');
