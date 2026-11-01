#!/usr/bin/env node
// D209 (31.10, Malts/sucres, r4c choisie), mot pour mot : « il faut plusieurs click pour faire des changements, c'est un peu un
// problème UX. Je voudrais aussi à la volée pouvoir facilement supprimer, ajouter, modifier sans ouvrir une "sous vue" mais si je
// click sur un, je peux avoir plus d'informations ou autre ». Dans r4c, changer une masse ou retirer une ligne passe par le plateau
// (toucher la ligne, puis la lecture ou la corbeille du plateau).
//
// Contrat de la page (une liste d'ingrédients, `[data-sel]` par ligne) :
//   data-role="kg-ligne" : la masse, sur la ligne ; un toucher y met le curseur, dans la ligne ;
//   data-role="retirer"  : sur la ligne, visible au repos ; data-role="annuler" : le retour du retrait ;
//   data-role="ajout"    : le champ d'ajout, visible au repos dans le premier écran ;
//   data-role="bal" ou "detail" : le détail d'une ligne (plateau, fiche), compté comme « sous-vue », avec role="dialog".
// Gestes, depuis le repos, à 390 × 844 tactile puis à 1280 × 800, pour chaque état donné :
//   MASSE   : un toucher sur la masse de la 2e ligne, « 2,5 », Entrée → la ligne dit 2,5 ; aucune sous-vue de plus ; champ jamais
//             type="number" (saisie-mobile) ;
//   RETRAIT : un toucher sur « retirer » de la 2e ligne → une ligne de moins, sans dialogue ; « Annuler » → la ligne revient à sa place ;
//   AJOUT   : « Cara 0,3 », Entrée → une ligne Cara à 0,3 ; « Munich », Entrée → le curseur est dans la masse de la ligne ajoutée (Munich, ou Münchner Malz par l'alias, D220) ;
//             aucune sous-vue de plus ;
//   DETAIL  : un toucher sur le nom de la 2e ligne → une sous-vue visible nomme cet ingrédient.
// Usage : node controle-gestes-ligne.mjs <etat.html> [--etats=,replie]   (état vide = la page sans ancre)
// Imprime une ligne par geste, largeur et état, puis GESTES OK (n) (code 0) ou GESTES ECHEC n (code 1) ; code 2 si la page manque.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { versUrl, existe } from './lib/cible.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ici, '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
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
const opt = (nom, defaut) => { const a = args.find((x) => x.startsWith(`--${nom}=`)); return a ? a.slice(nom.length + 3) : defaut; };
const fichier = path.resolve(process.cwd(), args.find((a) => !a.startsWith('--')) ?? 'etat.html');
if (!existe(fichier)) { console.log(`GESTES ECHEC : page absente ${fichier}`); process.exit(2); }
const etats = opt('etats', '').split(',').map((e) => e.trim());
const LARGEURS = [{ l: 390, h: 844, tactile: true }, { l: 1280, h: 800, tactile: false }];
const SOUS_VUES = '[data-role="bal"],[data-role="detail"],[role="dialog"],dialog[open]';

const navigateur = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const echecs = [];
let reussis = 0;
const noter = (ok, ligne) => { console.log(`${ok ? 'OK    ' : 'ECHEC '} ${ligne}`); if (ok) reussis++; else echecs.push(ligne); };

// Dans la page : l'état utile à un geste.
function lire(SOUS_VUES) {
  const visible = (el) => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && !el.closest('[hidden]'); };
  const lignes = [...document.querySelectorAll('[data-sel]')].filter(visible);
  const nom = (li) => (li.querySelector('[data-role="nom"]') || li.querySelector('b'))?.textContent.trim() ?? '';
  const masse = (li) => { const k = li.querySelector('[data-role="kg-ligne"]'); return k ? (k.value ?? '') + ' ' + k.textContent : ''; };
  const a = document.activeElement;
  const ligneActive = a?.closest?.('[data-sel]');
  return {
    noms: lignes.map(nom), masses: lignes.map(masse),
    sousVues: [...document.querySelectorAll(SOUS_VUES)].filter(visible).map((e) => e.innerText.replace(/\s+/g, ' ').slice(0, 200)),
    actif: { tag: a?.tagName, type: a?.getAttribute?.('type'), editable: !!(a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable)), ligne: ligneActive ? lignes.indexOf(ligneActive) : -1, role: a?.dataset?.role ?? '' },
    dialogues: [...document.querySelectorAll('[role="dialog"],[role="alertdialog"],dialog[open]')].filter(visible).length,
  };
}

for (const L of LARGEURS) for (const etat of etats) {
  const p = await navigateur.newPage();
  await couper(p);
  await p.setViewport({ width: L.l, height: L.h, isMobile: L.tactile, hasTouch: L.tactile, deviceScaleFactor: 1 });
  const erreurs = []; p.on('pageerror', (e) => erreurs.push(e.message));
  const url = etatUrl(versUrl(fichier).href, etat);
  const ouvrir = async () => { await p.goto(url); await attendre(p, etat); await p.evaluate(() => document.fonts.ready.then(() => new Promise((r) => setTimeout(r, 150)))); };
  const pause = () => p.evaluate(() => new Promise((r) => setTimeout(r, 250)));
  const toucher = async (h) => { if (L.tactile) await h.tap(); else await h.click(); await pause(); };
  const dans = async (i, sel) => { const li = (await p.$$('[data-sel]'))[i]; return li ? li.$(sel) : null; };
  const nomEtat = `${L.l} ${etat || 'repos'}`;
  const st = () => p.evaluate(lire, SOUS_VUES);

  // MASSE
  await ouvrir();
  let avant = await st();
  if (avant.noms.length < 3) { noter(false, `MASSE ${nomEtat} : il faut 3 lignes au repos, ${avant.noms.length} trouvée(s)`); await p.close(); continue; }
  let h = await dans(1, '[data-role="kg-ligne"]');
  if (!h) noter(false, `MASSE ${nomEtat} : aucune masse sur la ligne (data-role="kg-ligne") — il faut passer par le plateau`);
  else {
    await toucher(h);
    const pendant = await st();
    if (!pendant.actif.editable || pendant.actif.ligne !== 1) noter(false, `MASSE ${nomEtat} : un toucher sur la masse ne met pas le curseur dans la ligne (actif : ${pendant.actif.tag} ${pendant.actif.role}, ligne ${pendant.actif.ligne})`);
    else if (pendant.actif.type === 'number') noter(false, `MASSE ${nomEtat} : champ type="number" (saisie-mobile)`);
    else {
      await p.keyboard.down('Control'); await p.keyboard.press('a'); await p.keyboard.up('Control');
      await p.keyboard.type('2,5'); await p.keyboard.press('Enter'); await pause();
      const apres = await st();
      const ok = /2,5/.test(apres.masses[1] ?? '') && apres.sousVues.length <= avant.sousVues.length && apres.dialogues === 0;
      noter(ok, `MASSE ${nomEtat} : ${ok ? '1 toucher, « 2,5 », Entrée' : `ligne 2 « ${(apres.masses[1] ?? '').trim()} », sous-vues ${avant.sousVues.length} → ${apres.sousVues.length}, dialogues ${apres.dialogues}`}`);
    }
  }

  // RETRAIT
  await ouvrir();
  avant = await st();
  h = await dans(1, '[data-role="retirer"]');
  if (!h) noter(false, `RETRAIT ${nomEtat} : aucun « retirer » sur la ligne au repos (data-role="retirer")`);
  else {
    await toucher(h);
    const apres = await st();
    const annuler = await p.$('[data-role="annuler"]');
    const retire = apres.noms.length === avant.noms.length - 1 && !apres.noms.includes(avant.noms[1]) && apres.dialogues === 0;
    if (!retire || !annuler) noter(false, `RETRAIT ${nomEtat} : ${apres.noms.length} lignes après (${avant.noms.length} avant), dialogues ${apres.dialogues}, Annuler ${annuler ? 'là' : 'absent'}`);
    else {
      await toucher(annuler);
      const revenu = await st();
      const ok = revenu.noms[1] === avant.noms[1] && revenu.noms.length === avant.noms.length;
      noter(ok, `RETRAIT ${nomEtat} : ${ok ? `1 toucher, « ${avant.noms[1]} » retiré puis rendu à sa place` : `Annuler ne rend pas la ligne (${revenu.noms.join(', ')})`}`);
    }
  }

  // AJOUT
  await ouvrir();
  avant = await st();
  h = await p.$('[data-role="ajout"]');
  const boite = h && await h.boundingBox();
  if (!h || !boite || boite.y + boite.height > L.h) noter(false, `AJOUT ${nomEtat} : champ d'ajout absent ou hors du premier écran`);
  else {
    await toucher(h);
    await p.keyboard.type('Cara 0,3'); await p.keyboard.press('Enter'); await pause();
    let apres = await st();
    const i = apres.noms.findIndex((n) => /^Cara/.test(n));
    const okMasse = i >= 0 && /0,3/.test(apres.masses[i] ?? '') && apres.sousVues.length <= avant.sousVues.length;
    const h2 = await p.$('[data-role="ajout"]'); await toucher(h2);
    await p.keyboard.type('Munich'); await p.keyboard.press('Enter'); await pause();
    apres = await st();
    // D220 : « Munich » peut ajouter Münchner Malz par l'alias du nom courant ; la ligne ajoutée compte, quel que soit son nom.
    const j = apres.noms.findIndex((n) => /^(Munich|Münchner)/.test(n));
    const okCurseur = j >= 0 && apres.actif.editable && apres.actif.ligne === j && apres.sousVues.length <= avant.sousVues.length;
    noter(okMasse && okCurseur, `AJOUT ${nomEtat} : ${okMasse ? '« Cara 0,3 » ajouté' : `« Cara 0,3 » : ligne ${i}, masse « ${(apres.masses[i] ?? '').trim()} »`} ; ${okCurseur ? 'Munich : curseur dans sa masse, sur la ligne' : `Munich : curseur ${apres.actif.tag} ${apres.actif.role} ligne ${apres.actif.ligne} (ligne Munich ${j}), sous-vues ${avant.sousVues.length} → ${apres.sousVues.length}`}`);
  }

  // DETAIL
  await ouvrir();
  avant = await st();
  h = (await dans(1, '[data-role="nom"]')) || (await dans(1, 'b'));
  if (!h) noter(false, `DETAIL ${nomEtat} : nom de la ligne introuvable`);
  else {
    await toucher(h);
    const apres = await st();
    const ok = apres.sousVues.some((t) => t.includes(avant.noms[1]));
    noter(ok, `DETAIL ${nomEtat} : ${ok ? `un toucher sur « ${avant.noms[1]} » ouvre son détail` : `aucune sous-vue ne nomme « ${avant.noms[1]} »`}`);
  }
  if (erreurs.length) noter(false, `PAGE ${nomEtat} : ${erreurs.join(' ; ')}`);
  await p.close();
}
await navigateur.close();
if (echecs.length) { console.log(`GESTES ECHEC ${echecs.length}`); process.exit(1); }
console.log(`GESTES OK (${reussis})`);
