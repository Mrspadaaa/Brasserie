#!/usr/bin/env node
// D211 (31.10, Malts/sucres, r4d), sa plainte mot pour mot : « Mais ça inclus pas les besoins que j'ai à la volée ??? ».
// Dans r4d, seule la masse se tape sur la ligne ; le moment, la part du grain et la couleur « ? » passent par le plateau
// (toucher la ligne, puis la lecture du plateau). Une chose réglée « à la volée » se règle SUR LA LIGNE, en deux gestes au plus.
//
// Contrat de la page (une liste d'ingrédients, `[data-sel]` par ligne ; la 2e ligne n'est pas choisie au repos) :
//   data-role="kg-ligne"      : la masse, un champ sur la ligne ;
//   data-role="part-ligne"    : la part du grain, un champ sur la ligne (ou une barre graduée de 0 à 100 % sur sa largeur) ;
//   data-role="moment-ligne"  : le moment, un bouton sur la ligne ; un toucher ouvre un menu ancré à la ligne
//                               (data-role="moment-choix" + data-val="ebullition") ou fait tourner le moment (cycle sans menu) ;
//   data-role="couleur-ligne" : la couleur d'une ligne qui montre « ? », un champ sur la ligne (EBC) ;
//   data-role="bal" ou "detail" : le plateau / la fiche, compté comme « sous-vue » (aucune cible dedans) ;
//   un texte « N couleur(s) à renseigner » compte les lignes encore en « ? ».
// Gestes, depuis le repos (page rechargée pour chaque réglage), à 390 × 844 tactile puis à 1280 × 800 souris et clavier :
//   MASSE   : « 2,5 », Entrée sur la masse de la 2e ligne → la ligne lit 2,5 ;
//   PART    : « 30 », Entrée (ou la barre tirée) sur la part de la 2e ligne → la part lue sur la ligne vaut 30 % ± 1, la masse a changé ;
//   MOMENT  : un toucher sur le moment, puis au plus un choix « ébullition » (menu collé à la ligne) → la ligne lit « ébullition » ;
//   COULEUR : « 8 », Entrée sur la couleur d'une ligne en « ? » → le « ? » laisse place à une teinte, le compte « à renseigner » baisse de 1.
// Pour chaque réglage : deux gestes au plus (un toucher ou clic, puis la saisie ou un choix) ; aucune cible dans le plateau ou le détail ;
// le détail ne s'ouvre pas, aucun dialogue. Limite connue : si le moment de départ de la 2e ligne est déjà « ébullition », le geste ne
// prouve rien et le contrôle le dit (ECHEC).
// Usage : node controle-volee.mjs <etat.html> [--etats=,replie]   (état vide = la page sans ancre)
// Imprime une ligne par réglage, largeur et état (un échec n'arrête pas les suivants, M16), puis VOLEE OK (n) (code 0)
// ou VOLEE ECHEC n (code 1) ; code 2 si la page manque.
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
const fichier = path.resolve(process.cwd(), args.find((a) => !a.startsWith('--')) ?? 'etat.html');
if (!fs.existsSync(fichier)) { console.log(`VOLEE ECHEC : page absente ${fichier}`); process.exit(2); }
const etats = opt('etats', '').split(',').map((e) => e.trim());
const LARGEURS = [{ l: 390, h: 844, tactile: true }, { l: 1280, h: 800, tactile: false }];
const SOUS_VUES = '[data-role="bal"],[data-role="detail"],[role="dialog"],dialog[open]';
const PLATEAU = '[data-role="bal"],[data-role="detail"],[role="dialog"],dialog[open]';

const navigateur = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const echecs = [];
let reussis = 0;
const noter = (ok, ligne) => { console.log(`${ok ? 'OK    ' : 'ECHEC '} ${ligne}`); if (ok) reussis++; else echecs.push(ligne); };

// Dans la page : l'état utile à un réglage.
function lire(SOUS_VUES) {
  const visible = (el) => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && !el.closest('[hidden]'); };
  const sans = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  const nb = (s) => { const m = String(s).replace(',', '.').match(/\d+(\.\d+)?/); return m ? parseFloat(m[0]) : null; };
  const lignes = [...document.querySelectorAll('[data-sel]')].filter(visible);
  const nom = (li) => (li.querySelector('[data-role="nom"]') || li.querySelector('b'))?.textContent.trim() ?? '';
  const masse = (li) => { const k = li.querySelector('[data-role="kg-ligne"]'); return k ? (k.value ?? '') + ' ' + k.textContent : ''; };
  const kg = (li) => { const k = li.querySelector('[data-role="kg-ligne"]'); return k ? nb((k.value || '') || k.textContent) : null; };
  const part = (li) => {
    const e = li.querySelector('[data-role="part-ligne"]'); if (!e) return null;
    let v = e.value ?? ''; if (v === '') v = e.getAttribute('aria-valuenow') ?? ''; if (v === '') v = e.textContent;
    let n = nb(v);
    if (n == null) { const m = li.innerText.match(/(\d+(?:[.,]\d+)?)\s*%/); n = m ? nb(m[1]) : null; }
    return n;
  };
  const moment = (li) => { const e = li.querySelector('[data-role="moment-ligne"]'); return e ? sans((e.value ?? '') + ' ' + e.textContent) : ''; };
  const teinte = (li) => {
    const bl = (c) => { const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/); return !!m && (m[4] === undefined || parseFloat(m[4]) > 0) && !(+m[1] === 255 && +m[2] === 255 && +m[3] === 255); };
    return [...li.querySelectorAll('*')].some((e) => bl(getComputedStyle(e).backgroundColor) || (e.tagName === 'path' && e.getAttribute('fill') && !/^(none|#fff|#ffffff|white)$/i.test(e.getAttribute('fill'))));
  };
  const a = document.activeElement;
  const ligneActive = a?.closest?.('[data-sel]');
  const compteTxt = document.body.innerText.match(/(\d+)\s*(?:couleurs?\s*)?à\s*renseigner/i);
  return {
    noms: lignes.map(nom), masses: lignes.map(masse), kgs: lignes.map(kg), parts: lignes.map(part), moments: lignes.map(moment),
    inconnues: lignes.map((li) => li.innerText.includes('?')), teintes: lignes.map(teinte),
    courante: lignes.map((li) => li.getAttribute('aria-current') === 'true'),
    compte: compteTxt ? parseInt(compteTxt[1], 10) : null,
    sousVues: [...document.querySelectorAll(SOUS_VUES)].filter(visible).map((e) => e.innerText.replace(/\s+/g, ' ').slice(0, 300)),
    actif: { tag: a?.tagName, type: a?.getAttribute?.('type'), editable: !!(a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable)), ligne: ligneActive ? lignes.indexOf(ligneActive) : -1, role: a?.dataset?.role ?? '' },
    dialogues: [...document.querySelectorAll('[role="dialog"],[role="alertdialog"],dialog[open]')].filter(visible).length,
  };
}

// Les choix de moment visibles pour « ébullition », avec leur place par rapport à la ligne i.
function choixEbullition(i, PLATEAU) {
  const visible = (el) => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && !el.closest('[hidden]'); };
  const lignes = [...document.querySelectorAll('[data-sel]')].filter(visible);
  const li = lignes[i]; if (!li) return null;
  const lr = li.getBoundingClientRect();
  const tous = [...document.querySelectorAll('[data-role="moment-choix"]')].filter(visible);
  const eb = tous.filter((e) => e.dataset.val === 'ebullition');
  if (!eb.length) return { menu: tous.length > 0, trouve: false };
  const cand = eb.map((e) => { const r = e.getBoundingClientRect(); return { e, dans: li.contains(e), colle: r.top - lr.bottom <= 8 && lr.top - r.bottom <= 8 }; });
  const choisi = cand.find((c) => c.dans) || cand.find((c) => c.colle) || cand[0];
  const r = choisi.e.getBoundingClientRect();
  choisi.e.setAttribute('data-volee-cible', '1');
  return { menu: true, trouve: true, dans: choisi.dans, colle: choisi.colle, ecart: Math.round(r.top - lr.bottom), dansPlateau: !!choisi.e.closest(PLATEAU) };
}

for (const L of LARGEURS) for (const etat of etats) {
  const p = await navigateur.newPage();
  await p.setViewport({ width: L.l, height: L.h, isMobile: L.tactile, hasTouch: L.tactile, deviceScaleFactor: 1 });
  const erreurs = []; p.on('pageerror', (e) => erreurs.push(e.message));
  const url = pathToFileURL(fichier).href + (etat ? '#' + etat : '');
  const ouvrir = async () => { await p.goto(url); await p.evaluate(() => document.fonts.ready.then(() => new Promise((r) => setTimeout(r, 150)))); };
  const pause = () => p.evaluate(() => new Promise((r) => setTimeout(r, 250)));
  const toucher = async (h) => { if (L.tactile) await h.tap(); else await h.click(); await pause(); };
  const dans = async (i, sel) => { const li = (await p.$$('[data-sel]'))[i]; return li ? li.$(sel) : null; };
  const st = () => p.evaluate(lire, SOUS_VUES);
  const suffixe = `${L.l}${etat ? ' ' + etat : ''}`;
  const tout = async (nom, fn) => { try { await fn(); } catch (e) { noter(false, `${nom} ${suffixe} : le geste a planté (${String(e.message).split('\n')[0]})`); } };
  const select = async () => { await p.keyboard.down('Control'); await p.keyboard.press('a'); await p.keyboard.up('Control'); };
  // Ce qui ne doit pas arriver, quel que soit le réglage : un détail qui s'ouvre, un dialogue, une cible dans le plateau.
  const horsPlateau = (h) => h.evaluate((e, P) => !e.closest(P), PLATEAU);
  const intrus = (avant, apres) => {
    const nom = avant.noms[1];
    const ouvert = apres.sousVues.some((t) => t.includes(nom)) && !avant.sousVues.some((t) => t.includes(nom));
    if (apres.sousVues.length > avant.sousVues.length) return `une sous-vue de plus (${avant.sousVues.length} → ${apres.sousVues.length})`;
    if (ouvert) return `le détail de « ${nom} » s'est ouvert`;
    if (apres.dialogues > 0) return `${apres.dialogues} dialogue(s) ouvert(s)`;
    return '';
  };

  // REPOS
  await ouvrir();
  let avant = await st();
  if (avant.noms.length < 3) { noter(false, `REPOS ${suffixe} : il faut 3 lignes au repos, ${avant.noms.length} trouvée(s)`); await p.close(); continue; }
  noter(!avant.courante[1], `REPOS ${suffixe} : ${avant.courante[1] ? 'la 2e ligne est déjà choisie au départ, le contrôle ne prouve rien' : '3 lignes, la 2e n\'est pas choisie'}`);

  // MASSE
  await tout('masse', async () => {
    await ouvrir(); avant = await st();
    const h = await dans(1, '[data-role="kg-ligne"]');
    if (!h) return noter(false, `masse ${suffixe} : aucune masse sur la ligne (data-role="kg-ligne")`);
    if (!(await horsPlateau(h))) return noter(false, `masse ${suffixe} : la cible est dans le plateau`);
    await toucher(h);
    const pendant = await st();
    if (!pendant.actif.editable || pendant.actif.ligne !== 1) return noter(false, `masse ${suffixe} : un toucher sur la masse ne met pas le curseur dans la ligne (actif : ${pendant.actif.tag} ${pendant.actif.role}, ligne ${pendant.actif.ligne})`);
    if (pendant.actif.type === 'number') return noter(false, `masse ${suffixe} : champ type="number" (saisie-mobile)`);
    await select(); await p.keyboard.type('2,5'); await p.keyboard.press('Enter'); await pause();
    const apres = await st();
    const lu = /(^|\D)2,5(\D|$)/.test(apres.masses[1] ?? '');
    const pb = intrus(avant, apres);
    const ok = lu && !pb;
    noter(ok, `masse ${suffixe} : ${ok ? '1 toucher, « 2,5 », Entrée, la ligne lit 2,5' : `ligne 2 « ${(apres.masses[1] ?? '').trim()} »${pb ? ', ' + pb : ''}`}`);
  });

  // PART
  await tout('part', async () => {
    await ouvrir(); avant = await st();
    const h = await dans(1, '[data-role="part-ligne"]');
    if (!h) return noter(false, `part ${suffixe} : aucune part sur la ligne (data-role="part-ligne") — il faut passer par le plateau`);
    if (!(await horsPlateau(h))) return noter(false, `part ${suffixe} : la cible est dans le plateau`);
    const champ = await h.evaluate((e) => e.tagName === 'INPUT' || e.tagName === 'TEXTAREA' || e.isContentEditable);
    let comment;
    if (champ) {
      await toucher(h);
      const pendant = await st();
      if (!pendant.actif.editable || pendant.actif.ligne !== 1) return noter(false, `part ${suffixe} : un toucher sur la part ne met pas le curseur dans la ligne (actif : ${pendant.actif.tag} ${pendant.actif.role}, ligne ${pendant.actif.ligne})`);
      if (pendant.actif.type === 'number') return noter(false, `part ${suffixe} : champ type="number" (saisie-mobile)`);
      await select(); await p.keyboard.type('30'); await p.keyboard.press('Enter'); await pause();
      comment = '1 toucher, « 30 », Entrée';
    } else {
      const b = await h.boundingBox();
      if (!b) return noter(false, `part ${suffixe} : la barre n'a pas de boîte visible`);
      const y = b.y + b.height / 2, x0 = b.x + 2, x1 = b.x + b.width * 0.3;
      if (L.tactile) {
        await p.touchscreen.touchStart(x0, y);
        for (let s = 1; s <= 8; s++) await p.touchscreen.touchMove(x0 + (x1 - x0) * s / 8, y);
        await p.touchscreen.touchEnd();
      } else {
        await p.mouse.move(x0, y); await p.mouse.down();
        await p.mouse.move(x1, y, { steps: 8 }); await p.mouse.up();
      }
      await pause();
      comment = 'la barre tirée à 30 % de sa largeur';
    }
    const apres = await st();
    const part = apres.parts[1];
    const pb = intrus(avant, apres);
    const okPart = part != null && Math.abs(part - 30) <= 1;
    const okMasse = apres.kgs[1] != null && apres.kgs[1] !== avant.kgs[1];
    const ok = okPart && okMasse && !pb;
    noter(ok, `part ${suffixe} : ${ok ? `${comment}, la part lit ${part} %, la masse passe de ${avant.kgs[1]} à ${apres.kgs[1]} kg` : `part lue ${part == null ? 'introuvable' : part + ' %'} (30 attendu), masse ${avant.kgs[1]} → ${apres.kgs[1]}${pb ? ', ' + pb : ''}`}`);
  });

  // MOMENT
  await tout('moment', async () => {
    await ouvrir(); avant = await st();
    const h = await dans(1, '[data-role="moment-ligne"]');
    if (!h) return noter(false, `moment ${suffixe} : aucun moment sur la ligne (data-role="moment-ligne") — il faut passer par le plateau`);
    if (!(await horsPlateau(h))) return noter(false, `moment ${suffixe} : la cible est dans le plateau`);
    if (/ebullition/.test(avant.moments[1])) return noter(false, `moment ${suffixe} : la 2e ligne est déjà en ébullition au départ, le geste ne prouve rien`);
    await toucher(h);
    let gestes = 1, comment = '1 toucher';
    let apres = await st();
    const info = await p.evaluate(choixEbullition, 1, PLATEAU);
    if (info && info.trouve) {
      if (info.dansPlateau) return noter(false, `moment ${suffixe} : le choix « ébullition » est dans le plateau`);
      if (!info.dans && !info.colle) return noter(false, `moment ${suffixe} : le menu s'ouvre loin de la ligne (son haut à ${info.ecart} px du bas de la ligne, 8 au plus)`);
      const cible = await p.$('[data-volee-cible="1"]');
      await toucher(cible); gestes = 2; comment = `1 toucher, 1 choix (menu ${info.dans ? 'dans la ligne' : `collé à la ligne, ${info.ecart} px`})`;
    } else if (info && info.menu) {
      return noter(false, `moment ${suffixe} : un menu s'ouvre mais sans choix data-val="ebullition"`);
    } else if (!/ebullition/.test(apres.moments[1])) {
      // Cycle sans menu : un second toucher au plus.
      const h2 = await dans(1, '[data-role="moment-ligne"]');
      await toucher(h2); gestes = 2; comment = '2 touchers (cycle sans menu)';
    }
    apres = await st();
    const pb = intrus(avant, apres);
    const ok = /ebullition/.test(apres.moments[1]) && gestes <= 2 && !pb;
    noter(ok, `moment ${suffixe} : ${ok ? `${comment}, la ligne lit « ${apres.moments[1]} »` : `la ligne lit « ${apres.moments[1]} » après ${gestes} geste(s)${pb ? ', ' + pb : ''}`}`);
  });

  // COULEUR
  await tout('couleur', async () => {
    await ouvrir(); avant = await st();
    const i = avant.inconnues[1] ? 1 : avant.inconnues.findIndex((x, k) => x && !avant.courante[k]);
    const j = i >= 0 ? i : avant.inconnues.findIndex(Boolean);
    if (j < 0) return noter(false, `couleur ${suffixe} : aucune ligne ne montre « ? » au repos, le geste ne se joue pas`);
    if (avant.compte == null) return noter(false, `couleur ${suffixe} : aucun compte « à renseigner » lisible au repos`);
    const h = await dans(j, '[data-role="couleur-ligne"]');
    if (!h) return noter(false, `couleur ${suffixe} : aucune couleur sur la ligne « ? » (data-role="couleur-ligne") — il faut passer par le plateau`);
    if (!(await horsPlateau(h))) return noter(false, `couleur ${suffixe} : la cible est dans le plateau`);
    await toucher(h);
    const pendant = await st();
    if (!pendant.actif.editable || pendant.actif.ligne !== j) return noter(false, `couleur ${suffixe} : un toucher sur la couleur ne met pas le curseur dans la ligne (actif : ${pendant.actif.tag} ${pendant.actif.role}, ligne ${pendant.actif.ligne})`);
    if (pendant.actif.type === 'number') return noter(false, `couleur ${suffixe} : champ type="number" (saisie-mobile)`);
    await select(); await p.keyboard.type('8'); await p.keyboard.press('Enter'); await pause();
    const apres = await st();
    const pb = intrus({ ...avant, noms: [avant.noms[0], avant.noms[j]] }, apres);
    const compte = apres.compte ?? 0;
    const ok = !apres.inconnues[j] && apres.teintes[j] && compte === avant.compte - 1 && !pb;
    noter(ok, `couleur ${suffixe} : ${ok ? `ligne ${j + 1}, 1 toucher, « 8 », Entrée, une teinte à la place du « ? », « à renseigner » ${avant.compte} → ${compte}` : `« ? » ${apres.inconnues[j] ? 'toujours là' : 'parti'}, teinte ${apres.teintes[j] ? 'là' : 'absente'}, « à renseigner » ${avant.compte} → ${compte}${pb ? ', ' + pb : ''}`}`);
  });

  if (erreurs.length) noter(false, `PAGE ${suffixe} : ${erreurs.join(' ; ')}`);
  await p.close();
}
await navigateur.close();
if (echecs.length) { console.log(`VOLEE ECHEC ${echecs.length}`); process.exit(1); }
console.log(`VOLEE OK (${reussis})`);
