// D104 (22.10, lot 22) : une variante « de reprise » reprend ce que le brasseur a noté bon ou intéressant.
// Ses mots : « r6a est le meilleur mais reprendre trop peu d'éléments que j'avais noté bon ou intéressant des
// autres variante, notamment la meilleure. » La « meilleure » est y1b (« y1b est de mon point de vue semble
// meilleur. », 20.10) : r6a n'en reprenait presque rien (« face à ta stout » gardé au geste, pastille de
// famille qui ouvre son choix, jauge d'amertume de la stout, dock sous le pouce).
//
// L'INVENTAIRE (versionné) : ecran-1/fils22-comparer/donnees/elements-notes.json, { maj, elements: [ … ] }.
// Un élément = une chose qu'on reprend sur un écran : id (kebab-case, unique, = marqueur data-element),
// variante, lot, date (AAAA-MM-JJ), mots (sa phrase mot pour mot, retrouvée dans SPEC-BRASSEUR.md, espaces
// normalisés), quoi, reserve (mot pour mot, ou ""), capture (chemin depuis la racine du dépôt, qui existe),
// facteur (« variété », « contexte » ou « outil : Dryhopper | Levure | Suggérer | fiche »).
//
// Usage :
//   node controle-reprise.mjs --inventaire [chemin]
//     → « INVENTAIRE OK (n éléments, v variantes) » (code 0) ou « INVENTAIRE ECHEC » et la liste (code 1).
//   node controle-reprise.mjs <dossier> <id> [--page=etat.html] [--premier-ecran] [--inventaire=chemin]
//     Lit <dossier>/<id>/NOTE.md et la page, rendue à 390 × 844, tactile. La NOTE a une section
//     « ## Reprise », une ligne par élément de l'inventaire :
//       - <id> : repris — <où>        (sur l'écran, adapté)
//       - <id> : en contexte — <où>   (facteur fixé, dans la ligne [data-role="contexte"], sans contrôle)
//       - <id> : en pont — <outil>    (un lien ou un bouton vers l'autre outil, dans l'élément marqué)
//       - <id> : écarté — <raison>    (six mots au moins ; un quart des éléments au plus)
//     Chaque élément repris, en contexte ou en pont porte [data-element~="<id>"] (plusieurs id séparés par
//     des espaces) et se voit au repos, ou après UN toucher sur un déclencheur visible au repos : <button>,
//     <summary> ou [role="button"] avec aria-controls vers un conteneur qui porte ou contient le marqueur,
//     ou data-ouvre-element="<id> …" (convention de controle-acquis.mjs). Le toucher est joué pour de vrai
//     (page rechargée, un seul tap) ; deux touchers ou plus, c'est absent.
//     --premier-ecran : chaque élément repris, en contexte ou en pont est visible AU REPOS dans les 844
//     premiers pixels (sans défiler, sans toucher).
//     → « REPRISE OK (r repris, c en contexte, p en pont, e écartés) » (code 0) ou « REPRISE ECHEC » (code 1).
// Témoins (temoins/) : reprise-r6a (copie de r6a du lot 22) → ECHEC ; reprise-ok → OK, et ECHEC avec
// --premier-ecran (un élément à un toucher) ; reprise-sans-raison (un écart sans raison) → ECHEC.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '../../../../..');
const SPEC = path.resolve(ICI, '../../SPEC-BRASSEUR.md');
const INVENTAIRE_DEFAUT = path.resolve(ICI, '../../ecran-1/fils22-comparer/donnees/elements-notes.json');
const FACTEUR = /^(variété|contexte|outil : (Dryhopper|Levure|Suggérer|fiche))$/;
const CHAMPS = ['id', 'variante', 'lot', 'date', 'mots', 'quoi', 'reserve', 'capture', 'facteur'];
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const sansAccent = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const args = process.argv.slice(2);
const pos = args.filter((a) => !a.startsWith('--'));
const optInv = args.find((a) => a.startsWith('--inventaire='));
const modeInventaire = args.includes('--inventaire') || (optInv && pos.length < 2);
const cheminInv = path.resolve(optInv ? optInv.slice(13) : (args.includes('--inventaire') && pos[0]) || INVENTAIRE_DEFAUT);

// ---------- l'inventaire ----------
const lireInventaire = () => {
  const fautes = [];
  let doc;
  try { doc = JSON.parse(fs.readFileSync(cheminInv, 'utf8')); } catch (e) { return { fautes: ['inventaire illisible : ' + cheminInv + ' (' + e.message + ')'], elements: [] }; }
  const spec = norm(fs.readFileSync(SPEC, 'utf8'));
  const elements = Array.isArray(doc.elements) ? doc.elements : [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(doc.maj || '')) fautes.push('« maj » absente ou hors du format AAAA-MM-JJ');
  if (!elements.length) fautes.push('aucun élément');
  const vus = new Set();
  elements.forEach((e, k) => {
    const nom = (e && e.id) || '#' + (k + 1);
    for (const c of CHAMPS) {
      if (!e || !(c in e) || typeof e[c] !== 'string') fautes.push(nom + ' : champ « ' + c + ' » absent');
      else if (c !== 'reserve' && !e[c].trim()) fautes.push(nom + ' : champ « ' + c + ' » vide');
    }
    if (!e) return;
    if (typeof e.id === 'string') {
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(e.id)) fautes.push(nom + ' : id hors kebab-case');
      if (vus.has(e.id)) fautes.push(nom + ' : id en double');
      vus.add(e.id);
    }
    if (typeof e.date === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(e.date)) fautes.push(nom + ' : date hors du format AAAA-MM-JJ');
    if (typeof e.mots === 'string' && e.mots.trim() && !spec.includes(norm(e.mots))) fautes.push(nom + ' : ses mots ne se retrouvent pas dans SPEC-BRASSEUR (« ' + norm(e.mots).slice(0, 60) + ' »)');
    if (typeof e.reserve === 'string' && e.reserve.trim() && !spec.includes(norm(e.reserve))) fautes.push(nom + ' : sa réserve ne se retrouve pas dans SPEC-BRASSEUR (« ' + norm(e.reserve).slice(0, 60) + ' »)');
    if (typeof e.capture === 'string' && e.capture.trim() && !fs.existsSync(path.resolve(RACINE, e.capture))) fautes.push(nom + ' : capture absente (' + e.capture + ')');
    if (typeof e.facteur === 'string' && !FACTEUR.test(e.facteur)) fautes.push(nom + ' : facteur « ' + e.facteur + ' » (variété, contexte, ou « outil : Dryhopper | Levure | Suggérer | fiche »)');
  });
  return { fautes, elements };
};

const inv = lireInventaire();
if (modeInventaire) {
  if (inv.fautes.length) { console.log('INVENTAIRE ECHEC ' + inv.fautes.length + ' problème(s)'); for (const f of inv.fautes) console.log('  ' + f); process.exit(1); }
  const variantes = new Set(inv.elements.map((e) => e.variante));
  console.log('INVENTAIRE OK (' + inv.elements.length + ' éléments, ' + variantes.size + ' variantes)');
  process.exit(0);
}

// ---------- une variante de reprise ----------
const [dossier, id] = pos;
if (!dossier || !id) { console.log('Usage : node controle-reprise.mjs --inventaire [chemin] | <dossier> <id> [--page=etat.html] [--premier-ecran] [--inventaire=chemin]'); process.exit(2); }
const page = (args.find((a) => a.startsWith('--page=')) || '--page=etat.html').slice(7);
const premierEcran = args.includes('--premier-ecran');
const problemes = [];
if (inv.fautes.length) for (const f of inv.fautes) problemes.push('inventaire : ' + f);
const parId = new Map(inv.elements.map((e) => [e.id, e]));

// La NOTE : section « ## Reprise ».
const fNote = path.resolve(dossier, id, 'NOTE.md');
const fPage = path.resolve(dossier, id, page);
const lignes = new Map(); // id -> { statut, texte }
if (!fs.existsSync(fNote)) problemes.push('NOTE.md absente (' + path.relative(RACINE, fNote) + ')');
else {
  const note = fs.readFileSync(fNote, 'utf8');
  const m = note.match(/^##\s+Reprise\s*$([\s\S]*?)(?=^##\s|(?![\s\S]))/m);
  if (!m) problemes.push('NOTE : pas de section « ## Reprise »');
  else {
    const RE = /^\s*[-*]\s*`?([a-z0-9]+(?:-[a-z0-9]+)*)`?\s*:\s*(repris|en contexte|en pont|écartée|écarté|ecarté)(?=\s|[—–:-]|$)\s*(?:[—–:-]+\s*)?(.*)$/i;
    for (const l of m[1].split(/\r?\n/)) {
      if (!/^\s*[-*]\s/.test(l)) continue;
      const r = l.match(RE);
      if (!r) { problemes.push('NOTE : ligne illisible « ' + l.trim().slice(0, 70) + ' » (- <id> : repris | en contexte | en pont | écarté — …)'); continue; }
      const [, eid, st, texte] = r;
      const statut = /^[ée]cart/i.test(st) ? 'écarté' : st.toLowerCase();
      if (!parId.has(eid)) { problemes.push('NOTE : « ' + eid + ' » n\'est pas dans l\'inventaire'); continue; }
      if (lignes.has(eid)) problemes.push('NOTE : « ' + eid + ' » a deux lignes');
      lignes.set(eid, { statut, texte: texte.trim() });
    }
  }
}
for (const e of inv.elements) if (!lignes.has(e.id)) problemes.push(e.id + ' : pas de ligne dans « ## Reprise » (repris, en contexte, en pont ou écarté avec sa raison)');
const ecartes = [...lignes].filter(([, v]) => v.statut === 'écarté');
for (const [eid, v] of ecartes) {
  const n = (v.texte.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length;
  if (n < 6) problemes.push(eid + ' : écarté sans raison écrite (' + n + ' mot(s) ; six au moins, qui nomment la règle)');
}
if (inv.elements.length && ecartes.length * 4 > inv.elements.length) problemes.push(ecartes.length + ' éléments écartés sur ' + inv.elements.length + ' : plus d\'un quart');

// La page : rendu réel, au repos puis à un toucher.
const montres = [...lignes].filter(([, v]) => v.statut !== 'écarté').map(([eid]) => eid);
let compte = { repris: 0, contexte: 0, pont: 0 };
if (!fs.existsSync(fPage)) problemes.push('page absente (' + path.relative(RACINE, fPage) + ')');
else if (montres.length) {
  const { default: puppeteer } = await import('puppeteer-core');
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const p = await browser.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const DECL = 'button, summary, [role="button"]';
  const charger = async () => {
    await p.goto(pathToFileURL(fPage).href, { waitUntil: 'networkidle0', timeout: 30000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 300));
  };
  // Mesure, pour chaque id : visible ? dans le premier écran ? dans la ligne de contexte ? un lien vers l'outil ?
  const mesurer = (ids, DECL) => {
    const vis = (e) => !!e && e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().height > 0;
    const txt = (e) => ((e.innerText || e.textContent || '') + ' ' + (e.getAttribute('aria-label') || '') + ' ' + (e.getAttribute('href') || '') + ' ' + (e.getAttribute('data-outil') || '') + ' ' + (e.getAttribute('title') || '')).replace(/\s+/g, ' ');
    const out = {};
    for (const eid of ids) {
      const els = [...document.querySelectorAll('[data-element]')].filter((e) => e.getAttribute('data-element').split(/\s+/).includes(eid));
      const v = els.filter(vis);
      out[eid] = {
        balise: els.length > 0,
        visible: v.length > 0,
        haut: v.some((e) => e.getBoundingClientRect().top + window.scrollY < 844 && e.getBoundingClientRect().bottom + window.scrollY > 0),
        contexte: v.some((e) => !!e.closest('[data-role="contexte"]')),
        liens: v.flatMap((e) => [...(e.matches('a[href], button, [role="button"], [role="link"]') ? [e] : []), ...e.querySelectorAll('a[href], button, [role="button"], [role="link"]')]).filter(vis).map(txt),
      };
    }
    out.__declencheurs = [...document.querySelectorAll(DECL)].map((t, i) => {
      if (!vis(t)) return null;
      const claims = new Set((t.getAttribute('data-ouvre-element') || '').split(/[\s,;]+/).filter((k) => ids.includes(k)));
      for (const cid of (t.getAttribute('aria-controls') || '').split(/\s+/).filter(Boolean)) {
        const c = document.getElementById(cid);
        if (!c) continue;
        for (const eid of ids) {
          const has = (e) => (e.getAttribute('data-element') || '').split(/\s+/).includes(eid);
          if (has(c) || [...c.querySelectorAll('[data-element]')].some(has)) claims.add(eid);
        }
      }
      return claims.size ? { i, claims: [...claims] } : null;
    }).filter(Boolean);
    return out;
  };
  await charger();
  const repos = await p.evaluate(mesurer, montres, DECL);
  const apres = {};
  for (const t of repos.__declencheurs) {
    const aOuvrir = t.claims.filter((k) => !repos[k].visible);
    if (!aOuvrir.length) continue;
    await charger();
    const hs = await p.$$(DECL);
    if (!hs[t.i]) continue;
    await hs[t.i].tap().catch(() => {});
    await new Promise((r) => setTimeout(r, 450));
    const b = await p.evaluate(mesurer, aOuvrir, DECL);
    for (const k of aOuvrir) if (!apres[k] || (b[k].visible && !apres[k].visible)) apres[k] = { ...b[k], touche: true };
  }
  await browser.close();

  const outilDe = (eid) => (parId.get(eid).facteur.match(/^outil : (.+)$/) || [])[1];
  const lignesSortie = [];
  for (const eid of montres) {
    const { statut, texte } = lignes.get(eid);
    const r = repos[eid].visible ? { ...repos[eid], ou: 'au repos' } : apres[eid] && apres[eid].visible ? { ...apres[eid], ou: 'à un toucher' } : null;
    if (!r) {
      const pourquoi = !repos[eid].balise && !(apres[eid] && apres[eid].balise) ? 'aucun [data-element~="' + eid + '"] sur la page'
        : apres[eid] ? 'un seul toucher sur son déclencheur ne le montre pas (deux touchers ou plus : absent)'
        : 'caché au repos, sans déclencheur à un toucher (aria-controls vers son conteneur, ou data-ouvre-element="' + eid + '")';
      problemes.push(eid + ' (' + statut + ') : ' + pourquoi);
      continue;
    }
    if (statut === 'en contexte' && !r.contexte) problemes.push(eid + ' (en contexte) : hors de la ligne de contexte [data-role="contexte"]');
    if (statut === 'en pont') {
      const outil = outilDe(eid) || texte;
      const cle = sansAccent(outil).split(/[^a-z0-9]+/).filter((w) => w.length > 2);
      if (!r.liens.length) problemes.push(eid + ' (en pont) : aucun lien ni bouton dans l\'élément marqué');
      else if (cle.length && !r.liens.some((l) => cle.some((w) => sansAccent(l).includes(w)))) problemes.push(eid + ' (en pont) : aucun lien ni bouton qui nomme « ' + outil + ' » (texte, aria-label, href ou data-outil)');
    }
    if (premierEcran && !(repos[eid].visible && repos[eid].haut)) problemes.push(eid + ' (' + statut + ') : pas visible au repos dans les 844 premiers pixels (' + (repos[eid].visible ? 'plus bas' : r.ou) + ')');
    lignesSortie.push(eid + ' · ' + statut + ' · ' + r.ou);
    if (statut === 'repris') compte.repris++; else if (statut === 'en contexte') compte.contexte++; else compte.pont++;
  }
  for (const l of lignesSortie) console.log(l);
}
const resume = compte.repris + ' repris, ' + compte.contexte + ' en contexte, ' + compte.pont + ' en pont, ' + ecartes.length + ' écartés';
if (problemes.length) { console.log('REPRISE ECHEC ' + problemes.length + ' problème(s) (' + resume + ')'); for (const f of problemes) console.log('  ' + f); process.exit(1); }
console.log('REPRISE OK (' + resume + ')');
