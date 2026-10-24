// D116 (23.10, soir, sur « 16D hypothèse », étape Houblons de la maquette publiée) : « Pourquoi ?
// Qu'est-ce que ce champs apporter ?? Il faudra remplacer tout ça par le vrai Stepper de la vrai app ».
// Usage : node work/refonte-frontend/v4/tournoi/outils/controle-stepper.mjs <dossier construit> [--page=ma-biere/etat.html]
// L'en-tête de l'étape Houblons rend le fil d'étapes de l'app, tel que `src/ui/WizardStepBar.tsx` le rend :
//   WizardStepName : <p> avec le nom de l'étape et « 3/7 » ;
//   WizardStepRail : <nav aria-label="Étapes" class="wizard-step-rail"> de 7 <button aria-label="<étape>">,
//     celui de l'étape en cours porte aria-current="step".
// Aucun marqueur que l'app n'a pas n'est exigé. Les 7 étapes de BrewWizard (STEPS) : Identité, Fermentescibles,
// Houblons, Levure, Paliers, Eau et sels, Récapitulatif ; la 3e (Houblons) active.
// Contrôlé à 390 × 844 (tactile) puis à 1280 × 800 : le fil est visible dans l'en-tête (en haut de page), et aucun texte
// visible « hypothèse » (ni « 16D · hypothèse ») dans l'en-tête. Le nom et la position ne sont plus exigés (D58, 24.10).
// Imprime STEPPER OK, sinon STEPPER ECHEC et la liste (lignes « D116 … »).
import fs from 'node:fs';
import path from 'node:path';
import { versUrl, existe } from './lib/cible.mjs';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const dir = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const rel = (args.find((a) => a.startsWith('--page=')) || '').slice(7) || 'ma-biere/etat.html';
const fichier = path.join(dir, rel);
const ETAPES = ['Identité', 'Fermentescibles', 'Houblons', 'Levure', 'Paliers', 'Eau et sels', 'Récapitulatif'];
const ACTIVE = 2;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const problems = [];

if (!existe(fichier)) {
  console.log('STEPPER ECHEC ' + rel + ' absente dans ' + dir);
  process.exit(1);
}
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
for (const [w, h, mobile] of [[390, 844, true], [1280, 800, false]]) {
  const p = (m) => problems.push(w + ' px : D116 ' + m);
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  await page.goto(versUrl(fichier).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await wait(400);
  const r = await page.evaluate((ETAPES) => {
    const visible = (e) => {
      const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
      return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.1 && !e.closest('[inert], [aria-hidden="true"]');
    };
    const rails = [...document.querySelectorAll('nav[aria-label="Étapes"], .wizard-step-rail')].filter(visible);
    const rail = rails[0] || null;
    const out = { rail: !!rail, nb: 0, labels: [], active: -1, actives: 0, railTop: null, railBas: null, nom: false, position: false, hypothese: [], zoneBas: 130, entete: '' };
    let bas = 130;
    if (rail) {
      const b = [...rail.querySelectorAll('button')].filter(visible);
      out.nb = b.length;
      out.labels = b.map((x) => x.getAttribute('aria-label') || x.getAttribute('title') || x.innerText.trim());
      out.actives = b.filter((x) => x.getAttribute('aria-current') === 'step').length;
      out.active = b.findIndex((x) => x.getAttribute('aria-current') === 'step');
      const rr = rail.getBoundingClientRect();
      out.railTop = Math.round(rr.top); out.railBas = Math.round(rr.bottom);
      bas = Math.max(bas, rr.bottom);
      // l'étape active est dans l'écran (le rail défile localement sur téléphone)
      if (out.active >= 0) { const ra = b[out.active].getBoundingClientRect(); out.activeDansEcran = ra.left >= -1 && ra.right <= innerWidth + 1; }
    }
    // WizardStepName : le nom de l'étape et sa position « 3/7 » dans un même élément, en haut de page
    for (const e of document.querySelectorAll('p, div, span, h1, h2')) {
      if (!visible(e) || e.getBoundingClientRect().top > 130) continue;
      const tv = []; const tw = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
      while (tw.nextNode()) { const nd = tw.currentNode; const rg = document.createRange(); rg.selectNodeContents(nd); const q = rg.getBoundingClientRect(); const pe = nd.parentElement.getBoundingClientRect(); /* sr-only : 1 × 1 px, rogné */ if (/\S/.test(nd.textContent) && q.width > 2 && q.height > 2 && pe.width > 2 && pe.height > 2) tv.push(nd.textContent.trim()); }
      if (/^Houblons\s*3\s*\/\s*7$/.test(tv.join(' '))) { out.nom = true; out.position = true; break; }
    }
    // l'en-tête : tout ce qui est visible au-dessus du bas du fil (ou des 130 premiers px sans fil)
    out.zoneBas = Math.round(bas);
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const textes = [];
    while (w.nextNode()) {
      const n = w.currentNode; const e = n.parentElement;
      if (!e || !/\S/.test(n.textContent) || !visible(e) || e.getBoundingClientRect().width <= 2) continue;
      const rg = document.createRange(); rg.selectNodeContents(n); const q = rg.getBoundingClientRect();
      if (q.top >= bas || q.height === 0) continue;
      textes.push(n.textContent.trim());
      if (/hypoth[eè]se/i.test(n.textContent)) out.hypothese.push(n.textContent.trim());
    }
    out.entete = textes.join(' | ').slice(0, 160);
    return out;
  }, ETAPES);
  if (!r.rail) p('l\'en-tête n\'a pas le fil d\'étapes de l\'app (<nav aria-label="Étapes" class="wizard-step-rail"> de 7 boutons) ; en-tête vu : « ' + r.entete + ' »');
  else {
    if (r.nb !== 7) p('le fil a ' + r.nb + ' étape(s) visible(s), l\'app en a 7');
    else if (r.labels.join('/') !== ETAPES.join('/')) p('les étapes ne sont pas celles de l\'app : ' + r.labels.join(', ') + ' (attendu : ' + ETAPES.join(', ') + ')');
    if (r.actives !== 1) p(r.actives + ' étape(s) active(s) (aria-current="step"), il en faut 1');
    else if (r.active !== ACTIVE) p('l\'étape active est la ' + (r.active + 1) + 'e (' + (r.labels[r.active] || '?') + '), pas la 3e (Houblons)');
    else if (r.activeDansEcran === false) p('l\'étape active (Houblons) est hors de l\'écran dans le fil');
    if (r.railTop > 130) p('le fil est à ' + r.railTop + ' px du haut : ce n\'est pas l\'en-tête');
  }
  // D58 (24.10, soir, sur « Houblons 3/7 ») : « Text header inutile ». Le nom et la position ne sont plus exigés dans
  // l'en-tête : le fil d'étapes les dit (Houblons actif). Sa parole plus récente l'emporte sur D116 (D35).
  if (r.hypothese.length) p('texte « hypothèse » visible dans l\'en-tête : « ' + r.hypothese.join(' / ') + ' »');
  console.log(w + ' px · fil ' + (r.rail ? r.nb + ' étapes, active ' + (r.active + 1) + ', haut ' + r.railTop + ' px' : 'absent') + ' · nom/position ' + (r.nom ? 'oui' : 'non') + ' · « hypothèse » ' + r.hypothese.length);
  await page.close();
}
await browser.close();
if (problems.length === 0) console.log('STEPPER OK 2/2 largeurs');
else { console.log('STEPPER ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exitCode = 1; }
