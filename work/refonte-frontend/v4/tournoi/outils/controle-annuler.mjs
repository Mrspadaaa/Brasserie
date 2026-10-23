#!/usr/bin/env node
// D120 (23.10, soir) : sur le pied de Substituer (« Lequel à la place de Idaho 7 ? », « 10 g de Simcoe »), mot pour mot :
// « Pas de bouton cancer ». Substituer n'avait que « Remplacer › » en pied (SPEC-BRASSEUR § 1, « Annuler »).
// Mesuré sur d332792c : pied de 28 px de haut, un seul bouton (« Remplacer › », « Ajouter à ma bière › », « Puis la
// levure »), aucun « Annuler » sur Substituer, Levure ni Dryhopper.
//
// Règle, pour chaque outil qui propose de changer la recette (substituer, levure, dryhopper), au repos, à 390 × 844
// tactile puis à 1280 × 800. L'action est le bouton du pied qui écrit dans la recette : `[data-role]` en pont-remplacer,
// pont-ajouter, pont-placer, pont-inscrire, pont-valider, ou un bouton dont le texte commence par « Remplacer »,
// « Ajouter à ma bière », « Placer », « Inscrire », « Valider », « Appliquer » ; ou, pour un outil qui n'écrit pas
// lui-même (Dryhopper), le pont du pied vers l'outil suivant : « Puis la levure › » ou tout `[data-role^="pont-"]` dans
// la moitié basse de l'écran. Annuler est `[data-role="annuler"]`, ou
// un bouton dont le nom accessible (aria-label, sinon texte) commence par « Annuler » (pas la croix « Fermer » de l'en-tête).
//   D120 présence : un « Annuler » visible au repos, entier dans l'écran, que rien ne recouvre au centre ;
//   D120 place    : à côté de l'action (moins de 48 px entre les deux boîtes) ; sans action trouvée, dans le tiers bas ;
//   D120 taille   : 44 px de haut au moins ;
//   D120 effet    : un toucher (clic à 1280) sur « Annuler » laisse `window.__parcours.etat.recette` identique (JSON),
//                   abandonne le brouillon (`etat.brouillon` nul), et l'outil se quitte (l'adresse change).
// Usage : node controle-annuler.mjs <dossier> [--routes=substituer,levure,dryhopper] [--page=etat.html]
// Imprime une ligne par route et largeur, puis ANNULER OK (n routes × 2 largeurs) (code 0), ou une ligne
// « - D120 <route> <largeur> : … » par manque puis ANNULER ECHEC (code 1) ; code 2 si une page manque.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ici, '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const args = process.argv.slice(2);
const opt = (nom, defaut) => { const a = args.find((x) => x.startsWith(`--${nom}=`)); return a ? a.slice(nom.length + 3) : defaut; };
const dossier = path.resolve(RACINE, args.find((a) => !a.startsWith('--')) ?? '.');
const routes = opt('routes', 'substituer,levure,dryhopper').split(',').map((r) => r.trim()).filter(Boolean);
const page = opt('page', 'etat.html');
const LARGEURS = [{ l: 390, h: 844, tactile: true }, { l: 1280, h: 800, tactile: false }];
const MIN_HAUT = 44, MAX_ECART = 48;

// Dans la page : trouve l'action et « Annuler », les mesure, lit l'état avant le toucher.
function mesurer() {
  const visible = (el) => {
    const r = el.getBoundingClientRect(), s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
  };
  const nom = (el) => (el.getAttribute('aria-label') || el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
  const boite = (el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2, right: r.right, bottom: r.bottom }; };
  const boutons = [...document.querySelectorAll('button, a, [role="button"], [data-role]')].filter(visible);
  const roleAction = /^pont-(remplacer|ajouter|placer|inscrire|valider|appliquer)/;
  const texteAction = /^(remplacer|ajouter à ma bière|placer|inscrire|valider|appliquer)/i;
  // Un outil qui n'écrit pas lui-même (Dryhopper) mène à l'outil suivant : « Puis la levure › » ou un pont du pied.
  const texteSuite = /^puis/i;
  const dansPied = (el) => el.getBoundingClientRect().top >= innerHeight / 2;
  const estPont = (b) => /^pont-/.test(b.dataset.role ?? '') && dansPied(b);
  const actions = boutons.filter((b) => roleAction.test(b.dataset.role ?? '') || texteAction.test(nom(b)) || texteSuite.test(nom(b)) || estPont(b));
  const action = actions.sort((a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top)[0] ?? null;
  const annulers = boutons.filter((b) => b.dataset.role === 'annuler' || /^annuler\b/i.test(nom(b)));
  const annuler = annulers.sort((a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top)[0] ?? null;
  const P = window.__parcours;
  const sortie = {
    crochet: !!(P && P.etat), hash: location.hash, vh: innerHeight, vw: innerWidth,
    action: action ? { nom: nom(action).slice(0, 40), ...boite(action) } : null,
    annuler: null,
  };
  if (P && P.etat) { sortie.recette = JSON.stringify(P.etat.recette); sortie.brouillon = P.etat.brouillon == null ? null : 'ouvert'; }
  if (annuler) {
    const b = boite(annuler);
    const haut = document.elementFromPoint(b.cx, b.cy);
    sortie.annuler = {
      nom: nom(annuler).slice(0, 40), ...b,
      recouvert: !(haut && (haut === annuler || annuler.contains(haut))),
      dansEcran: b.x >= -0.5 && b.y >= -0.5 && b.right <= innerWidth + 0.5 && b.bottom <= innerHeight + 0.5,
    };
  }
  return sortie;
}

const lire = () => {
  const P = window.__parcours;
  return { hash: location.hash, recette: P && P.etat ? JSON.stringify(P.etat.recette) : null, brouillon: P && P.etat ? (P.etat.brouillon == null ? null : 'ouvert') : 'inconnu' };
};
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const arr = (v) => Math.round(v * 10) / 10;
const ecartBoites = (a, b) => {
  const dx = Math.max(0, a.x - b.right, b.x - a.right), dy = Math.max(0, a.y - b.bottom, b.y - a.bottom);
  return Math.hypot(dx, dy);
};
const diff = (a, b) => {
  let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
  return `…${a.slice(Math.max(0, i - 20), i + 40)}… contre …${b.slice(Math.max(0, i - 20), i + 40)}…`;
};

const manquantes = routes.map((r) => path.join(dossier, r, page)).filter((f) => !fs.existsSync(f));
if (manquantes.length) {
  for (const f of manquantes) console.log(`ANNULER PAGE ABSENTE : ${path.relative(RACINE, f)}`);
  process.exit(2);
}

const nav = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const problemes = [];
let bons = 0;
try {
  for (const route of routes) {
    for (const v of LARGEURS) {
      const p = await nav.newPage();
      const etiq = `${route} ${v.l}`;
      const fautes = [];
      try {
        await p.setViewport({ width: v.l, height: v.h, deviceScaleFactor: 1, hasTouch: v.tactile, isMobile: v.tactile });
        await p.goto(pathToFileURL(path.join(dossier, route, page)).href, { waitUntil: 'networkidle0' });
        await pause(500);
        const m = await p.evaluate(mesurer);
        const a = m.annuler;
        if (!m.action) fautes.push(`D120 ${etiq} : aucune action du pied qui change la recette (« Remplacer », « Ajouter à ma bière », « Placer »…) trouvée`);
        let effet = 'non testé';
        if (!a) {
          fautes.push(`D120 ${etiq} : pas de bouton « Annuler » dans la page${m.action ? ` (le pied n'a que « ${m.action.nom} », ${arr(m.action.w)} × ${arr(m.action.h)} px)` : ''}`);
        } else {
          if (a.h < MIN_HAUT - 0.5) fautes.push(`D120 ${etiq} : « Annuler » fait ${arr(a.h)} px de haut, ${MIN_HAUT} au moins`);
          if (!a.dansEcran) fautes.push(`D120 ${etiq} : « Annuler » déborde de l'écran (y ${arr(a.y)} à ${arr(a.bottom)}, écran ${m.vh} px)`);
          if (m.action) {
            const e = ecartBoites(a, m.action);
            if (e > MAX_ECART) fautes.push(`D120 ${etiq} : « Annuler » est à ${arr(e)} px de « ${m.action.nom} », ${MAX_ECART} au plus (pas à côté de l'action)`);
          } else if (a.cy < m.vh * (2 / 3)) fautes.push(`D120 ${etiq} : « Annuler » en y ${arr(a.cy)}, hors du pied (tiers bas de l'écran, ${m.vh} px)`);
          if (a.recouvert) {
            fautes.push(`D120 ${etiq} : le centre de « Annuler » (${Math.round(a.cx)}, ${Math.round(a.cy)}) est recouvert par un autre élément`);
            effet = 'recouvert';
          } else if (!m.crochet) {
            fautes.push(`D120 ${etiq} : window.__parcours.etat absent, l'effet de « Annuler » ne se lit pas`);
            effet = 'crochet absent';
          } else {
            if (v.tactile) await p.touchscreen.tap(a.cx, a.cy); else await p.mouse.click(a.cx, a.cy);
            let apres = await p.evaluate(lire);
            for (let i = 0; i < 12 && apres.hash === m.hash; i += 1) { await pause(100); apres = await p.evaluate(lire); }
            await pause(300);
            apres = await p.evaluate(lire);
            const ch = [];
            if (apres.recette !== m.recette) { fautes.push(`D120 ${etiq} : « Annuler » change la recette (${diff(m.recette ?? '', apres.recette ?? '')})`); ch.push('recette changée'); }
            if (apres.brouillon !== null) { fautes.push(`D120 ${etiq} : après « Annuler » le brouillon reste ouvert (etat.brouillon non nul)`); ch.push('brouillon ouvert'); }
            if (apres.hash === m.hash) { fautes.push(`D120 ${etiq} : « Annuler » ne quitte pas l'outil (l'adresse reste ${m.hash})`); ch.push('outil gardé'); }
            effet = ch.length ? ch.join(', ') : `recette identique, brouillon abandonné, ${m.hash} → ${apres.hash}`;
          }
        }
        console.log(`${etiq} · action ${m.action ? `« ${m.action.nom} » ${arr(m.action.w)}×${arr(m.action.h)}` : 'introuvable'} · annuler ${a ? `« ${a.nom} » ${arr(a.w)}×${arr(a.h)} en (${Math.round(a.cx)}, ${Math.round(a.cy)})` : 'absent'} · ${effet}`);
      } finally {
        await p.close();
      }
      if (fautes.length) problemes.push(...fautes); else bons += 1;
    }
  }
} finally {
  await nav.close();
}
for (const f of problemes) console.log(`  - ${f}`);
const total = routes.length * LARGEURS.length;
console.log(problemes.length ? `ANNULER ECHEC (${bons}/${total} conformes)` : `ANNULER OK (${routes.length} routes × ${LARGEURS.length} largeurs)`);
process.exitCode = problemes.length ? 1 : 0;
