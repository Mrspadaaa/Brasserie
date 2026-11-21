#!/usr/bin/env node
// PRINCIPES (21.11, passe 2) — contrôles mécaniques de deux défauts transversaux, au doigt, 390×844 tactile, fixture « ZZ TEST »
// (scripts/parcours/fixtures/chaines.mjs ; jamais seedData.ts, aucun Gemini). Une page neuve par écran ou par création.
//
//   VUE-SAUTE  (DEFAUTS-RECURRENTS, 21.11 : « certaines actions … fait bouger toute la vue ») : sur chaque onglet et l'assistant
//              de recette, chaque action principale est jouée ; on suit, image par image (requestAnimationFrame), le haut du
//              premier bloc de contenu sous l'en-tête et l'élément sous le doigt, et on somme les `layout-shift` (PerformanceObserver,
//              entrées après geste comprises : c'est justement le geste qui fait sauter la vue).
//              KO si le premier bloc ou l'élément touché bouge de plus de 1 px (hors défilement voulu, hors changement d'écran),
//              ou si le CLS de l'action dépasse 0,02 ; et KO d'écran si le CLS de sa session d'actions dépasse 0,02.
//   NOM-OBLIGE (21.11 : « Taper un nom pour valider, ensuite sortir du mode clavier … C'est des actions en plus ») : chaque
//              création est ouverte deux fois. 1) sans rien taper : le nom a-t-il une valeur par défaut, « valider » est-il permis ?
//              2) nom tapé puis Entrée : la création est-elle confirmée (ou le champ suivant pris) ? On relève `enterkeyhint`.
//              KO si le champ de nom n'a pas d'enterkeyhint d'action, si Entrée ne fait rien, ou si la création exige un nom tapé.
//   Le texte au premier écran (phrases de 6 mots ou plus) est relevé pour l'analyse « trop de texte » : relevé, jamais bloquant.
//
//   node scripts/parcours/principes.mjs <dossier> [--build <dossier>] [--ref <tag>] [--controle VUE-SAUTE|NOM-OBLIGE] [--seul <id,…>]
//   Sortie : « PRINCIPES OK » (0) ou « PRINCIPES ECHEC (n) » et la liste (1) ; mesures dans <dossier>/principes.json, captures à côté.
//   Doit échouer sur en-ligne/2026-11-21-tour7 (Calendrier pour VUE-SAUTE ; Recette, carnet, client… pour NOM-OBLIGE).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..', '..');
const { lancerBanc, pageNeuve, sleep } = await import(pathToFileURL(path.join(ICI, 'chaines-outils.mjs')).href);
const { fixtureChaines } = await import(pathToFileURL(path.join(ICI, 'fixtures', 'chaines.mjs')).href);
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : null; };
const sortie = path.resolve(args.find((a, i) => !a.startsWith('--') && !['--build', '--ref', '--controle', '--seul'].includes(args[i - 1])) ?? path.join(os.tmpdir(), 'parcours-principes'));
fs.mkdirSync(sortie, { recursive: true });
const controles = (opt('controle') ?? 'VUE-SAUTE,NOM-OBLIGE').split(',');
const seuls = opt('seul') ? opt('seul').split(',') : null;
const SEUIL_PX = 1; const SEUIL_CLS = 0.02;
const echecs = []; const mesures = { vue: [], nom: [], texte: [] };
const echec = (c, m) => { echecs.push(`${c} : ${m}`); console.log(`  KO  ${c} : ${m}`); };
const ok = (c, m) => console.log(`  ok  ${c}${m ? ` : ${m}` : ''}`);

// ───────────── le build (même config de test que chaines.mjs ; un tag se construit dans une copie de os.tmpdir()) ─────────────
// (le déroulé est en fin de fichier : les tables ECRANS et CREATIONS doivent être posées avant)

// ───────────── mesures dans la page ─────────────
/* Pose l'observateur de layout-shift (une fois) et repère le premier bloc de contenu sous l'en-tête et l'élément sous le doigt. */
function armer(x, y) {
  if (!window.__pr) {
    window.__pr = { ls: [] };
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__pr.ls.push({ v: e.value, t: e.startTime, src: (e.sources || []).slice(0, 3).map((s) => (s.node && s.node.nodeType === 1 ? (s.node.getAttribute('aria-label') || s.node.className || s.node.tagName).toString().slice(0, 40) : '#')) }); }).observe({ type: 'layout-shift', buffered: false });
  }
  const vis = (e) => { const r = e.getBoundingClientRect(); const c = getComputedStyle(e); return r.width > 0 && r.height > 0 && c.visibility !== 'hidden' && c.opacity !== '0'; };
  // en-tête : le bas le plus bas des éléments fixes ou collants posés en haut de l'écran (barre du haut, sous-onglets collants)
  let haut = 0;
  for (const e of document.querySelectorAll('header, [class*=sticky], [class*=fixed], body *')) {
    if (e.closest('[role=dialog]')) continue;
    const c = getComputedStyle(e); if (c.position !== 'fixed' && c.position !== 'sticky') continue;
    const r = e.getBoundingClientRect(); if (r.top <= 4 && r.height > 0 && r.height < 200 && r.width > innerWidth * 0.6) haut = Math.max(haut, r.bottom);
  }
  const main = document.querySelector('main') || document.body;
  let bloc = null;
  for (const e of main.querySelectorAll('*')) {
    if (e.closest('[role=dialog], nav')) continue;
    const r = e.getBoundingClientRect(); const c = getComputedStyle(e);
    if (c.position === 'fixed' || c.position === 'sticky') continue;
    if (r.top >= haut - 1 && r.height >= 16 && r.width >= 150 && r.top < innerHeight && vis(e)) { bloc = e; break; }
  }
  let doigt = document.elementFromPoint(x, y);
  while (doigt && doigt.parentElement && !doigt.matches('button,a,[role],label,summary,li')) doigt = doigt.parentElement;
  window.__pr.bloc = bloc; window.__pr.doigt = doigt; window.__pr.n0 = window.__pr.ls.length;
  window.__pr.dialogs0 = document.querySelectorAll('[role=dialog]').length; window.__pr.href0 = location.href;
  const t = (e) => (e && e.isConnected ? e.getBoundingClientRect().top : null);
  window.__pr.t0 = { bloc: t(bloc), doigt: t(doigt), haut };
  window.__pr.max = { bloc: 0, doigt: 0 }; window.__pr.suivre = true;
  const boucle = () => {
    if (!window.__pr.suivre) return;
    const b = t(window.__pr.bloc); const d = t(window.__pr.doigt);
    if (b != null && window.__pr.t0.bloc != null) window.__pr.max.bloc = Math.max(window.__pr.max.bloc, Math.abs(b - window.__pr.t0.bloc));
    if (d != null && window.__pr.t0.doigt != null) window.__pr.max.doigt = Math.max(window.__pr.max.doigt, Math.abs(d - window.__pr.t0.doigt));
    requestAnimationFrame(boucle);
  };
  requestAnimationFrame(boucle);
  return { haut: Math.round(haut), bloc: bloc ? (bloc.getAttribute('aria-label') || bloc.innerText || bloc.tagName).replace(/\s+/g, ' ').slice(0, 40) : null, blocTop: Math.round(window.__pr.t0.bloc ?? -1) };
}
function relever() {
  const p = window.__pr; p.suivre = false;
  const t = (e) => (e && e.isConnected ? e.getBoundingClientRect().top : null);
  const nouvelles = p.ls.slice(p.n0);
  return {
    bloc: { remplace: !(p.bloc && p.bloc.isConnected), max: Math.round(p.max.bloc * 10) / 10, fin: t(p.bloc) == null || p.t0.bloc == null ? null : Math.round((t(p.bloc) - p.t0.bloc) * 10) / 10 },
    doigt: { remplace: !(p.doigt && p.doigt.isConnected), max: Math.round(p.max.doigt * 10) / 10, fin: t(p.doigt) == null || p.t0.doigt == null ? null : Math.round((t(p.doigt) - p.t0.doigt) * 10) / 10 },
    cls: Math.round(nouvelles.reduce((a, e) => a + e.v, 0) * 1000) / 1000,
    sources: [...new Set(nouvelles.flatMap((e) => e.src))].slice(0, 4),
    feuille: document.querySelectorAll('[role=dialog]').length > p.dialogs0
  };
}
/* Phrases en dur au premier écran : blocs de texte de 6 mots ou plus (hors champs), pour « trop de texte ». */
function phrases() {
  const vus = new Set(); const out = []; let mots = 0;
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) {
    const e = n.parentElement; if (!e || e.closest('nav, input, textarea, script, style')) continue;
    const r = e.getBoundingClientRect(); if (!r.width || r.bottom < 0 || r.top > innerHeight || getComputedStyle(e).visibility === 'hidden') continue;
    mots += (n.textContent.match(/[\p{L}\p{N}]+/gu) || []).length;
    const bloc = e.closest('p, li, span, div, button, label, h1, h2, h3, small') || e; if (vus.has(bloc)) continue; vus.add(bloc);
    const txt = (bloc.innerText || '').replace(/\s+/g, ' ').trim(); const nb = (txt.match(/[\p{L}]{2,}/gu) || []).length;
    if (nb >= 6 && txt.length < 260 && !bloc.querySelector('p, li')) out.push(`${Math.round(bloc.getBoundingClientRect().top)}: ${txt.slice(0, 140)}`);
  }
  return { mots, phrases: out.slice(0, 14) };
}

// ───────────── VUE-SAUTE ─────────────
/* Chaque écran : comment l'atteindre, puis ses actions principales (texte du bouton ; `p` : préfixe ; `nav` : l'action change d'écran). */
const ECRANS = [
  { id: 'calendrier', aller: [['Calendrier', { dans: 'nav button' }]], actions: [['S47', { p: 1 }], ['S48', { p: 1 }], ['S49', { p: 1 }], ['Masquer Fêtes'], ['Cacher la courbe'], ['ZZ TEST Commande de malt', { p: 1 }], ['Fermer'], ['Ajouter dans Travaux'], ['Fermer'], ['Période suivante'], ['Période précédente']] },
  { id: 'bord', aller: [['Bord', { dans: 'nav button' }]], actions: [['Échéances et démarches', { p: 1 }], ['Tous'], ['Période précédente'], ['Période suivante'], ['Actions rapides'], ['Actions rapides']] },
  { id: 'finances', aller: [['Finances', { dans: 'nav button' }]], actions: [['sept.'], ['oct.'], ['tout'], ['nov.'], ['Solde et paramètres financiers', { p: 1 }]] },
  { id: 'brassins', aller: [['Brassins', { dans: 'nav button' }]], actions: [['En cuve', { p: 1 }], ['À brasser', { p: 1 }], ['Tous', { p: 1 }], ['Filtrer'], ['Filtrer'], ['Épingler le brassin B-ZZ-PLAN'], ['Recettes', { p: 1, nav: 1 }], ['Atelier R&D', { nav: 1 }], ['Carnet', { nav: 1 }], ['Brassins (', { p: 1, nav: 1 }]] },
  { id: 'stocks', aller: [['Stocks', { dans: 'nav button' }]], actions: [['Recompter'], ['Étagère'], ['Autres stocks'], ['Ingrédients'], ['Épingler ZZ TEST Munich'], ['Replier Malts'], ['Courses', { nav: 1 }], ['Fûts', { nav: 1 }], ['Pleins', { p: 1 }], ['Livré', { p: 1 }], ['Matériel', { nav: 1 }], ['Houblons', { nav: 1 }], ['Articles', { nav: 1 }]] },
  { id: 'clients', aller: [['Clients', { dans: 'nav button' }]], actions: [['Prix', { nav: 1 }], ['Impôt bière', { nav: 1 }], ['Carnet', { nav: 1 }], ['Modifier ZZ TEST La Cigogne']] },
  { id: 'assistant-recette', aller: [['Bord', { dans: 'nav button' }], ['Actions rapides'], ['Recette'], ['@', 'textarea[aria-label="Nom de la bière"]', 'ZZ TEST Brune']], actions: [['Changer de fermenteur'], ['Suivant', { p: 1, nav: 1 }], ['ZZ TEST Caramünch', { c: 1 }], ['ZZ TEST Munich', { c: 1 }], ['Suivant', { p: 1, nav: 1 }], ['ZZ TEST Citra', { c: 1 }], ['Suivant', { p: 1, nav: 1 }]] }
];

/** Va à l'écran : touchers, ou ['@', sélecteur, texte] pour écrire au doigt. Rend le nombre de gestes. */
async function aller(s, pas) {
  let n = 0;
  for (const x of pas) {
    if (x[0] === '@') { await s.ecrire(x[1], x[2]); n += 2; await sleep(500); continue; }
    const [t, o = {}] = x; await s.toucher(t, { prefixe: !!o.p, dans: o.dans, contient: !!o.c }); n++; await sleep(900);
  }
  return n;
}

async function vueSaute(banc, aujourdhui) {
  for (const ecran of ECRANS) {
    if (seuls && !seuls.includes(ecran.id)) continue;
    console.log(`VUE-SAUTE ${ecran.id}`);
    const s = await pageNeuve(banc, fixtureChaines(aujourdhui).entrees, sortie);
    let session = 0;
    try {
      await s.demarrer();
      await aller(s, ecran.aller);
      await sleep(800);
      mesures.texte.push({ ecran: ecran.id, ...(await s.p.evaluate(phrases)) });
      await s.cap(`vue-${ecran.id}-0`);
      let k = 0;
      for (const [t, o = {}] of ecran.actions) {
        k++;
        const c = await s.trouver(t, { prefixe: !!o.p, contient: !!o.c }).catch(() => null);
        if (!c) { console.log(`  --  ${ecran.id} « ${t} » absent, non joué`); mesures.vue.push({ ecran: ecran.id, action: t, absent: true }); continue; }
        await sleep(350);
        const avant = await s.p.evaluate(armer, c[0], c[1]);
        await s.p.touchscreen.tap(c[0], c[1]);
        await sleep(1100);
        const m = await s.p.evaluate(relever);
        session += m.cls;
        const nav = !!o.nav;
        const sautBloc = !m.bloc.remplace && !nav ? m.bloc.max : 0;
        const sautDoigt = !m.doigt.remplace && !m.feuille ? m.doigt.max : 0;
        const ligne = { ecran: ecran.id, action: t, ...avant, ...m, nav };
        mesures.vue.push(ligne);
        const d = `bloc ${m.bloc.remplace ? 'remplacé' : `${m.bloc.max} px`} · doigt ${m.doigt.remplace ? 'remplacé' : `${m.doigt.max} px`} · CLS ${m.cls}${m.feuille ? ' · feuille' : ''}${m.sources.length ? ` · ${m.sources.join(', ')}` : ''}`;
        if (sautBloc > SEUIL_PX || sautDoigt > SEUIL_PX || m.cls > SEUIL_CLS) { echec(`VUE-SAUTE ${ecran.id} « ${t} »`, d); await s.cap(`vue-${ecran.id}-${k}-saut`); }
        else ok(`${ecran.id} « ${t} »`, d);
      }
      session = Math.round(session * 1000) / 1000;
      mesures.vue.push({ ecran: ecran.id, session });
      if (session > SEUIL_CLS) echec(`VUE-SAUTE ${ecran.id} session`, `CLS ${session} > ${SEUIL_CLS}`); else ok(`${ecran.id} session`, `CLS ${session}`);
    } catch (err) { await s.cap(`vue-${ecran.id}-erreur`).catch(() => {}); echec(`VUE-SAUTE ${ecran.id}`, String(err.message ?? err).slice(0, 200)); }
    await s.fermer().catch(() => {});
  }
}

// ───────────── NOM-OBLIGE ─────────────
/* Chaque création : comment l'ouvrir ; `champ` : sélecteur du champ de nom s'il est connu (sinon le premier champ texte vide de la feuille) ;
    `contenu` : le texte EST la chose créée (une idée, le nom d'un client) : pas de nom par défaut exigé, Entrée et enterkeyhint restent contrôlés. */
const CREATIONS = [
  { id: 'recette', aller: [['Bord', { dans: 'nav button' }], ['Actions rapides'], ['Recette']], champ: 'textarea[aria-label="Nom de la bière"]' },
  { id: 'cal-travaux', aller: [['Calendrier', { dans: 'nav button' }], ['Ajouter dans Travaux']] },
  { id: 'cal-activites', aller: [['Calendrier', { dans: 'nav button' }], ['Ajouter dans Activités']] },
  { id: 'cal-papiers', aller: [['Calendrier', { dans: 'nav button' }], ['Ajouter dans Papiers']] },
  { id: 'idee-atelier', contenu: true, aller: [['Brassins', { dans: 'nav button' }], ['Atelier R&D']], champ: 'textarea[placeholder^="Une idée"], textarea[aria-label^="Une idée"]' },
  { id: 'client', contenu: true, aller: [['Clients', { dans: 'nav button' }], ['Actions rapides'], ['Nouveau client']] },
  { id: 'tarif', aller: [['Clients', { dans: 'nav button' }], ['Actions rapides'], ['Nouveau tarif']] },
  { id: 'materiel', aller: [['Stocks', { dans: 'nav button' }], ['Matériel'], ['Achat']] },
  { id: 'fournisseur', aller: [['Bord', { dans: 'nav button' }], ['Plus : saisie', { p: 1 }], ['Fournisseurs'], ['Plus']] },
  { id: 'brassin', aller: [['Bord', { dans: 'nav button' }], ['Actions rapides'], ['Brassin, sera', { p: 1 }]] }
];
const VALIDER = '^(\\+ ?)?(Ajouter|Poser|Créer|Enregistrer|Garder|Valider|Noter|OK|Suivant|Retenir)';

/* Le champ de nom : le sélecteur donné, sinon le premier champ texte d'une ligne de la feuille ouverte (hors montant, recherche, date). */
function champNom(sel) {
  const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
  const libre = (x) => { const r = x.getBoundingClientRect(); const h = document.elementFromPoint(Math.min(r.x + r.width / 2, innerWidth - 2), Math.min(Math.max(r.y + r.height / 2, 1), innerHeight - 2)); return !!h && (h === x || x.contains(h) || h.contains(x) || (h.closest('label') && h.closest('label').contains(x))); };
  const zone = document.body;
  let e = sel ? [...document.querySelectorAll(sel)].find(vis) : null;
  if (!e) e = [...zone.querySelectorAll('input, textarea')].filter((x) => vis(x) && libre(x)).find((x) => !/^(number|hidden|checkbox|radio|date|range|search|file)$/.test(x.type) && !/^(numeric|decimal|tel|email|url|search)$/.test(x.inputMode) && x.enterKeyHint !== 'search' && !/montant|chf|cherch|recherch|prix|quantit|volume|date|du \(|au \(/i.test(`${x.getAttribute('aria-label')} ${x.placeholder} ${x.name}`));
  if (!e) return null;
  e.setAttribute('data-principes-nom', '1');
  const r = e.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2, label: (e.getAttribute('aria-label') || e.closest('label')?.innerText || e.placeholder || e.name || e.id || '').replace(/s+/g, ' ').trim().slice(0, 40), valeur: e.value, hint: e.getAttribute('enterkeyhint') || '', tag: e.tagName.toLowerCase(), rows: e.getAttribute('rows') };
}
function boutonValider(re) {
  const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
  const zone = document.body;
  const libre = (x) => { const r = x.getBoundingClientRect(); const h = document.elementFromPoint(Math.min(r.x + r.width / 2, innerWidth - 2), Math.min(Math.max(r.y + r.height / 2, 1), innerHeight - 2)); return !!h && (h === x || x.contains(h)); };
  const rx = new RegExp(re, 'i');
  const b = [...zone.querySelectorAll('button, [type=submit]')].filter((x) => vis(x) && libre(x) && !x.closest('nav') && rx.test((x.innerText || x.getAttribute('aria-label') || '').trim())).at(-1);
  if (!b) return null;
  return { texte: (b.innerText || b.getAttribute('aria-label')).replace(/\s+/g, ' ').trim().slice(0, 40), desactive: b.disabled || b.getAttribute('aria-disabled') === 'true' };
}
const etat = () => ({ texte: document.body.innerText.length, vide: (document.querySelector('[data-principes-nom]')?.value ?? '') === '', nomVu: [...document.body.querySelectorAll('h1,h2,h3,[role=status],li,button,p,span')].some((e) => !e.closest('input,textarea') && (e.innerText || '').includes('ZZ TEST Nom')), champ: !!document.querySelector('[data-principes-nom]'), focus: document.activeElement && document.activeElement.hasAttribute('data-principes-nom'), autreChamp: !!document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName) && !document.activeElement.hasAttribute('data-principes-nom'), feuilles: document.querySelectorAll('[role=dialog]').length, alerte: [...document.querySelectorAll('[role=alert],[aria-invalid=true]')].map((e) => (e.innerText || e.getAttribute('aria-label') || 'invalide').slice(0, 60)).join(' | ') });

async function nomOblige(banc, aujourdhui) {
  for (const cr of CREATIONS) {
    if (seuls && !seuls.includes(cr.id)) continue;
    console.log(`NOM-OBLIGE ${cr.id}`);
    const res = { creation: cr.id };
    // 1) sans rien taper
    let s = await pageNeuve(banc, fixtureChaines(aujourdhui).entrees, sortie);
    try {
      await s.demarrer(); let gestesOuvrir = 0;
      gestesOuvrir = await aller(s, cr.aller);
      await sleep(600);
      const ch = await s.p.evaluate(champNom, cr.champ ?? null);
      await s.cap(`nom-${cr.id}-ouvert`);
      if (!ch) { res.champ = null; mesures.nom.push(res); console.log(`  --  ${cr.id} : aucun champ de nom (création sans nom tapé)`); await s.fermer(); continue; }
      const bv = await s.p.evaluate(boutonValider, VALIDER);
      Object.assign(res, { gestesOuvrir, champ: ch.label, tag: ch.tag, defaut: ch.valeur, enterkeyhint: ch.hint, valider: bv });
      // valider sans taper : la création passe-t-elle ?
      if (bv && !bv.desactive) {
        const e0 = await s.p.evaluate(etat);
        await s.toucher(bv.texte, { prefixe: true, att: 1200 }).catch(() => {});
        const e1 = await s.p.evaluate(etat);
        res.sansNom = !e1.champ || e1.feuilles < e0.feuilles ? 'créé ou passé' : e1.alerte ? `refusé (${e1.alerte})` : 'rien';
        await s.cap(`nom-${cr.id}-sans-nom`);
      } else res.sansNom = bv ? 'bouton désactivé' : 'aucun bouton de validation';
    } catch (err) { res.erreur = String(err.message ?? err).slice(0, 200); }
    await s.fermer().catch(() => {});
    // 2) nom tapé, puis Entrée
    if (res.champ && !res.erreur) {
      s = await pageNeuve(banc, fixtureChaines(aujourdhui).entrees, sortie);
      try {
        await s.demarrer();
        await aller(s, cr.aller);
        await sleep(600);
        const ch = await s.p.evaluate(champNom, cr.champ ?? null);
        await s.p.touchscreen.tap(ch.x, ch.y); await sleep(300);
        if (ch.valeur) { await s.p.keyboard.down('Control'); await s.p.keyboard.press('KeyA'); await s.p.keyboard.up('Control'); }
        await s.p.keyboard.type('ZZ TEST Nom', { delay: 15 }); await sleep(400);
        const e0 = await s.p.evaluate(etat);
        await s.p.keyboard.press('Enter'); await sleep(1200);
        const e1 = await s.p.evaluate(etat);
        res.entree = !e1.champ || e1.feuilles < e0.feuilles || (e1.vide && e1.nomVu) ? 'confirme' : e1.autreChamp ? 'champ suivant' : !e1.focus ? 'ferme le clavier seulement' : (await s.p.evaluate(() => (document.querySelector('[data-principes-nom]')?.value || '').includes('\n'))) ? 'retour à la ligne' : 'rien';
        await s.cap(`nom-${cr.id}-entree`);
      } catch (err) { res.erreurEntree = String(err.message ?? err).slice(0, 200); }
      await s.fermer().catch(() => {});
    }
    mesures.nom.push(res);
    // verdict
    const fautes = [];
    if (res.erreur) fautes.push(`non joué : ${res.erreur}`);
    else if (res.champ) {
      if (!/^(done|go|send|next|enter)$/.test(res.enterkeyhint)) fautes.push(`enterkeyhint « ${res.enterkeyhint || 'absent'} »`);
      if (res.entree && !/^(confirme|champ suivant)$/.test(res.entree)) fautes.push(`Entrée : ${res.entree}`);
      if (!cr.contenu && !res.defaut && res.sansNom !== 'créé ou passé') fautes.push(`nom exigé, aucun nom par défaut (${res.sansNom})`);
    }
    const d = res.champ ? `champ « ${res.champ} » défaut « ${res.defaut || ''} » hint ${res.enterkeyhint || '-'} · sans nom : ${res.sansNom} · Entrée : ${res.entree ?? '?'}` : 'sans champ de nom';
    if (fautes.length) echec(`NOM-OBLIGE ${cr.id}`, `${fautes.join(' ; ')} — ${d}`); else ok(`${cr.id}`, d);
  }
}

async function jouer(dir) {
  const banc = await lancerBanc(dir);
  const aujourdhui = new Date().toISOString().slice(0, 10);
  try {
    if (controles.includes('VUE-SAUTE')) await vueSaute(banc, aujourdhui);
    if (controles.includes('NOM-OBLIGE')) await nomOblige(banc, aujourdhui);
  } finally { await banc.fermer(); }
}

// ───────────── déroulé ─────────────
let dossierBuild = opt('build'); let copie = null; const aNettoyer = [];
try {
  if (!dossierBuild) {
    dossierBuild = fs.mkdtempSync(path.join(os.tmpdir(), 'principes-build-')); aNettoyer.push(dossierBuild);
    let racine = RACINE;
    if (opt('ref')) {
      copie = path.join(os.tmpdir(), `principes-copie-${Date.now()}`);
      const g = spawnSync('git', ['worktree', 'add', '--detach', copie, opt('ref')], { cwd: RACINE, encoding: 'utf8' });
      if (g.status !== 0) throw new Error(`git worktree add : ${g.stderr}`);
      fs.symlinkSync(path.join(RACINE, 'node_modules'), path.join(copie, 'node_modules'), 'junction');
      for (const n of fs.readdirSync(RACINE)) if (/^.env(..+)?$/.test(n) && !/example/.test(n)) fs.copyFileSync(path.join(RACINE, n), path.join(copie, n));
      fs.mkdirSync(path.join(copie, 'scripts', 'parcours', 'fixtures'), { recursive: true });
      for (const f of ['vite.parcours.config.mjs', path.join('fixtures', 'entree-app.mjs')]) fs.copyFileSync(path.join(ICI, f), path.join(copie, 'scripts', 'parcours', f));
      racine = copie;
    }
    console.log(`build ${opt('ref') ? `du tag ${opt('ref')}` : 'de l\'arbre de travail'} …`);
    const r = spawnSync('npx', ['vite', 'build', '--config', path.join(racine, 'scripts', 'parcours', 'vite.parcours.config.mjs'), '--outDir', dossierBuild, '--emptyOutDir', '--logLevel', 'error'],
      { cwd: racine, env: { ...process.env, PARCOURS_RACINE: racine }, encoding: 'utf8', shell: true, maxBuffer: 1 << 26 });
    if (r.status !== 0) throw new Error(`build en échec : ${(r.stdout + r.stderr).slice(-600)}`);
  }
  await jouer(path.resolve(dossierBuild));
} catch (e) { echec('principes', String(e.message ?? e).slice(0, 500)); }
finally {
  if (copie) { spawnSync('git', ['worktree', 'remove', '--force', copie], { cwd: RACINE }); fs.rmSync(copie, { recursive: true, force: true }); spawnSync('git', ['worktree', 'prune'], { cwd: RACINE }); }
  for (const d of aNettoyer) fs.rmSync(d, { recursive: true, force: true });
}
fs.writeFileSync(path.join(sortie, 'principes.json'), JSON.stringify(mesures, null, 1));
if (echecs.length) { console.log(`PRINCIPES ECHEC (${echecs.length})`); for (const e of echecs) console.log(`  - ${e}`); process.exit(1); }
console.log('PRINCIPES OK');
