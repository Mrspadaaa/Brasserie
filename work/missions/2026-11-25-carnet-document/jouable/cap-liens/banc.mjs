// Banc liens lus + liste compacte + champ Noter + style adulte (26.11). Chrome de débug 9222, son propre onglet, 390 × 844 DPR 2.
// window.claude simulé : sample (réponses écrites à la main, l'IA jouée) et db en mémoire (liens/, demandes/, journal/).
// node cap-liens/banc.mjs avant|apres
import fs from 'node:fs';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
const RACINE = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/';
const puppeteer = createRequire(RACINE + 'package.json')('puppeteer-core');
const REL = 'work/missions/2026-11-25-carnet-document/jouable/';
const M = RACINE + REL, CAP = M + 'cap-liens/';
const MODE = process.argv[2] || 'apres';
const attendre = ms => new Promise(r => setTimeout(r, ms));
function idLien(url) { let x = 5381; for (let i = 0; i < url.length; i++) x = (Math.imul(x, 33) + url.charCodeAt(i)) >>> 0; return 'u' + x.toString(16); }
const BRAU = 'https://www.brauundrauchshop.ch/citra-136-2', MOTLER = 'https://www.motlerhops.fr/collections/tous-nos-houblons/products/citra-us';
const NEUF_URL = 'https://www.example.ch/fut-20l';
const DOC_BRAU = { url: BRAU, titre: 'Citra 13.6 %', lu: '2026-11-26T08:00:00.000Z', par: 'Claude (session pilote)',
  faits: [{ label: 'Alpha', valeur: '13.6 %' }, { label: 'Prix au gramme', valeur: '0.1044 CHF/g' }],
  prix: [{ quantite: 5, unite: 'kg', prix: 245.70, devise: 'CHF' }, { quantite: 20, unite: 'kg', prix: 782.15, devise: 'CHF' }], dispo: '66 am Lager', livraison: null };
const ID_BRAU = idLien(BRAU), ID_MOTLER = idLien(MOTLER), ID_NEUF = idLien(NEUF_URL);

// réponses de l'IA jouée, par titre
function charger(fichier) {
  const html = fs.readFileSync(fichier, 'utf8'), ex = JSON.parse(html.match(/var EXEMPLES = (\[[\s\S]*?\]);\n/)[1]), REP = {};
  const v7 = /m4b-v7/.test(fichier);
  const idx = v7 ? JSON.parse(fs.readFileSync(M + 'reponses-v7/index.json', 'utf8')) : null;
  for (const x of ex) {
    const f = v7 ? M + 'reponses-v7/' + idx[x.titre].rep : M + 'reponses/' + x.src.split('/').pop();
    const j = JSON.parse(fs.readFileSync(f, 'utf8')); REP[x.titre] = j.reponse || j;
  }
  return { REP, titres: ex.map(x => x.titre) };
}
const L = (t) => ({ texte: t, source: 'lien', lien: 2 });
function citraLiens(base, faux) {
  const r = JSON.parse(JSON.stringify(base));
  const cit1 = 'motlerhops.fr', cit2 = 'brauundrauchshop.ch';
  r.tache = null; r.conseil = null; r.resume = 'Comparer Citra'; r.genre = 'achat'; r.lectures = [];
  r.options = [{ emoji: '', titre: 'MotlerHops', cout: '?', source: 'notes', ligne: 1, citation: cit1, conseille: false },
    { emoji: '', titre: 'Brau und Rauchshop', cout: '245.70 CHF', source: 'ia', conseille: false }];
  r.comparaison = { criteres: ['💰 5 kg', '💰 20 kg', '⚖️ Prix CHF/g', '📦 Dispo', '🌿 Alpha'],
    articles: [{ nom: 'MotlerHops', ligne: 1, citation: cit1, valeurs: [0, 1, 2, 3, 4].map(() => ({ texte: '?', source: 'notes' })) },
      { nom: 'Brau und Rauchshop', ligne: 2, citation: cit2, valeurs: [L(faux ? '199 CHF' : '245.70 CHF'), L('782.15 CHF'), L('0.1044'), L('66 am Lager'), L('13.6 %')] }],
    gagnant: [null, null, null, null, null], compromis: 'Brau a du stock ; MotlerHops en lecture.' };
  return r;
}
const NEUF_REP = { emoji: '🛢️', categorie: { nom: 'Brasserie', sous: 'Conditionnement' }, priorite: 'normale', resume: 'Lien en lecture', etatPropose: 'note', titre: 'Fûts 20 L',
  pistes: [], options: [], tache: null, echeance: null, periode: null, chiffres: [], liste: [], retenir: [], faits: [], lectures: [], comparaison: null, resolu: null, conseil: null, genre: 'achat' };

const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
const page = await browser.newPage();
const erreurs = [], res = { mode: MODE, ids: { ID_BRAU, ID_MOTLER, ID_NEUF } };
page.on('pageerror', e => erreurs.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') erreurs.push('console: ' + m.text()); });
try {
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  let PACK = null;
  await page.evaluateOnNewDocument(() => {
    window.__prompts = []; window.__appels = {};
    const store = { liens: JSON.parse(localStorage.getItem('sim-liens') || '{}'), demandes: {}, journal: [] }, subs = [];
    const fige = o => Object.freeze(JSON.parse(JSON.stringify(o)));
    const snap = () => { const docs = Object.keys(store.liens).map(id => { const d = fige(store.liens[id]); return { id, exists: true, data: () => d, metadata: { fromCache: false, hasPendingWrites: false } }; });
      return { docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: { fromCache: false, hasPendingWrites: false } }; };
    const db = { collection: p => ({
      add: d => { store.journal.push(d); return Promise.resolve({ id: 'j' + store.journal.length }); },
      doc: id => ({ id, path: p + '/' + id, get: () => Promise.resolve({ id, exists: !!(store[p] || {})[id], data: () => (store[p] || {})[id], metadata: {} }),
        set: d => { if (p === 'liens') return Promise.reject({ code: 'not_granted', message: 'admin' }); (store[p] = store[p] || {})[id] = JSON.parse(JSON.stringify(d)); return Promise.resolve(); } }),
      onSnapshot: (next) => { if (p === 'liens') { subs.push(next); setTimeout(() => next(snap()), 30); } return () => {}; } }) };
    window.__store = store; window.__dbPut = (id, d) => { store.liens[id] = d; subs.forEach(f => f(snap())); };
    const sample = () => Promise.resolve({ text: 'Réponse simulée.' });
    sample.json = async (prompt) => {
      window.__prompts.push(prompt);
      const t = (prompt.match(/^Carnet : (.*)$/m) || [])[1] || '';
      window.__appels[t] = (window.__appels[t] || 0) + 1;
      await new Promise(r => setTimeout(r, 40));
      const P = window.__PACK;
      if (/^Tu aides un brasseur/.test(prompt)) return { items: [] };
      if (/citra/i.test(t) && /Ce que disent ses liens[\s\S]*245\.7/.test(prompt)) return JSON.parse(JSON.stringify(localStorage.getItem('sim-faux') ? P.citraFaux : P.citraLiens));
      if (P.REP[t]) return JSON.parse(JSON.stringify(P.REP[t]));
      if (/propose "titre"/.test(prompt)) return JSON.parse(JSON.stringify(P.neuf));
      throw { code: 'upstream_error' };
    };
    window.claude = { use: n => Promise.resolve(n === 'sample' ? sample : n === 'db' ? db : null) };
  });
  let URL0 = '';
  async function neuf(seed, faux) {
    await page.goto(URL0); await page.evaluate((s, f) => { localStorage.clear(); if (s) localStorage.setItem('sim-liens', JSON.stringify(s)); if (f) localStorage.setItem('sim-faux', '1'); }, seed || null, !!faux);
    await page.evaluateOnNewDocument(p => { window.__PACK = p; }, PACK);
    await page.goto(URL0, { waitUntil: 'load' });
    for (let i = 0; i < 150; i++) { const ok = await page.evaluate(() => window.__m4b && __m4b.etat().carnets.every(c => c.org || c.orgErreur) && !__m4b.lecture().lecture && !__m4b.lecture().file.length); if (ok) break; await attendre(100); }
    await attendre(300);
  }
  const cap = async (nom) => { await attendre(260); await page.screenshot({ path: CAP + nom + '.png' }); return nom; };
  const sansToast = () => page.evaluate(() => document.querySelectorAll('.m4b-toast').forEach(x => x.remove()));
  const idDe = t => page.evaluate(t => (__m4b.etat().carnets.filter(c => c.titre === t)[0] || {}).id, t);
  const ouvrir = async (t, vue) => { await page.evaluate(i => __m4b.ouvrir(i), await idDe(t)); await attendre(200); await sansToast();
    if (vue) { await page.evaluate(v => { const b = document.getElementById(v === 'org' ? 't-org' : 't-notes'); if (b && !b.classList.contains('on')) b.click(); }, vue); await attendre(200); } };
  const fermer = () => page.evaluate(() => __m4b.fermer());
  const lignesVisibles = () => page.evaluate(() => {
    const pied = document.querySelector('#v-liste .m4b-pied').getBoundingClientRect().top, l = document.getElementById('liste').getBoundingClientRect().top;
    const rows = [...document.querySelectorAll('#liste .m4j-r')].filter(r => { const b = r.getBoundingClientRect(); return b.height && b.top >= l - 1 && b.bottom <= pied + 1; });
    return { n: rows.length, total: document.querySelectorAll('#liste .m4j-r').length, deuxEtages: [...document.querySelectorAll('#liste .m4j-r')].filter(r => r.getBoundingClientRect().height > 46).length };
  });
  // PAS-DE-HARCELEMENT : au pouce (barres et surcouches du bas), aucune question ni demande de noter
  const pouce = () => page.evaluate(() => {
    const H = innerHeight, out = [];
    const zones = [...document.querySelectorAll('#v-carnet .m4b-pied, #pied-org, #outils, .m4b-toast, .v7-pile, .m4b-feuille')].filter(z => z.offsetParent || getComputedStyle(z).position === 'fixed');
    for (const z of zones) { const b = z.getBoundingClientRect(); if (!b.height || b.top > H || b.bottom < H - 220) continue;
      const tx = (z.innerText || '') + ' ' + [...z.querySelectorAll('input,textarea')].map(i => i.placeholder).join(' ');
      if (/\?|noter\b|prix suisse|réel\s*\?/i.test(tx)) out.push((z.id || z.className) + ' : ' + tx.trim().slice(0, 80)); }
    // et rien de fixé au bas hors de ces zones
    for (const e of document.querySelectorAll('#v-carnet *')) { const cs = getComputedStyle(e); if (cs.position !== 'fixed' && cs.position !== 'sticky') continue; const b = e.getBoundingClientRect();
      if (b.height && b.top > H - 220 && b.top < H && /\?/.test(e.innerText || '') && !e.closest('#pied-org,#outils')) out.push('fixé : ' + (e.innerText || '').slice(0, 60)); }
    return out;
  });
  const fichiers = MODE === 'avant'
    ? ['m4b-v7.html', 'm4b.html'].map(f => { const p = os.tmpdir().replace(/\\/g, '/') + '/avant-' + f; fs.writeFileSync(p, execSync('git show HEAD:' + REL + f, { cwd: RACINE, maxBuffer: 64e6 })); return [f, p]; })
    : ['m4b-v7.html', 'm4b.html'].map(f => [f, M + f]);
  for (const [f, chemin] of fichiers) {
    const pre = (f === 'm4b-v7.html' ? 'v7' : 'm4b') + '-' + MODE + '-', R = res[f] = {};
    const { REP, titres } = charger(chemin), tCitra = titres.find(t => /citra/i.test(t));
    PACK = { REP, citraLiens: citraLiens(REP[tCitra]), citraFaux: citraLiens(REP[tCitra], true), neuf: NEUF_REP };
    URL0 = 'file:///' + chemin;
    // A. Brau lu, MotlerHops pas encore
    await neuf({ [ID_BRAU]: DOC_BRAU });
    R.liste = await lignesVisibles(); await sansToast(); await cap(pre + '01-liste');
    if (MODE === 'avant') { for (const t of titres.filter(t => /citra|coulement|bouteilles|frigo/i.test(t))) { await ouvrir(t, 'org'); await cap(pre + 'org-' + t.replace(/^ZZ TEST — /, '').slice(0, 12).replace(/\W+/g, '_')); await fermer(); } continue; }
    R.A = await page.evaluate((tc, IB, IM) => {
      const c = __m4b.etat().carnets.find(x => x.titre === tc), p = window.__prompts.find(x => x.indexOf('Carnet : ' + tc) >= 0) || '';
      const cp = c.org.rep.comparaison;
      return { appels: window.__appels[tc], promptLiens: /Ce que disent ses liens \(lus par Claude le/.test(p), prompt245: /20 kg = 782\.15 CHF/.test(p), promptDispo: /66 am Lager/.test(p),
        promptMotlerAttente: /motlerhops[^\n]*pas encore lu/.test(p), promptQuestion: /Jamais de question/.test(p),
        brau: cp && cp.articles[1].valeurs.map(v => v.texte + '/' + v.source), fausses: c.org.fausses, erreurs: c.org.erreurs,
        demandes: Object.keys(window.__store.demandes), demandeMotler: window.__store.demandes[IM], demandeBrau: !!window.__store.demandes[IB] };
    }, tCitra, ID_BRAU, ID_MOTLER);
    await ouvrir(tCitra, 'org');
    R.A.dom = await page.evaluate(() => { const o = document.getElementById('p-org'); return { enLecture: (o.innerText.match(/🔗 en lecture/g) || []).length, marques: o.querySelectorAll('.lk').length, txt245: /245\.70/.test(o.innerText), dispo: /66 am Lager/.test(o.innerText) }; });
    await cap(pre + '02-citra-brau-lu');
    await page.evaluate(() => document.getElementById('p-org').scrollTo(0, 99999)); await cap(pre + '03-citra-bas');
    await fermer();
    // aucune question au pouce, sur chaque exemple, Organisé et Mes notes
    R.pouce = {};
    for (const t of titres) { const v = []; for (const vue of ['org', 'notes']) { await ouvrir(t, vue); v.push(...(await pouce())); } await fermer(); if (v.length) R.pouce[t] = v; }
    R.pouceExemples = titres.length;
    for (const t of titres.filter(t => /coulement|bouteilles|frigo/i.test(t))) { await ouvrir(t, 'org'); await cap(pre + 'org-' + t.replace(/^ZZ TEST — /, '').slice(0, 12).replace(/\W+/g, '_')); await fermer(); }
    // le champ de la liste : un lien collé crée un carnet, l'IA le range et le titre, une demande part
    await page.click('#noter'); await page.keyboard.type(NEUF_URL); await cap(pre + '04-champ-tape');
    await page.keyboard.press('Enter');
    for (let i = 0; i < 60; i++) { const ok = await page.evaluate(() => { const c = __m4b.etat().carnets.slice(-1)[0]; return !!(c.org || c.orgErreur); }); if (ok) break; await attendre(100); }
    await attendre(300);
    R.champ = await page.evaluate((IN) => { const c = __m4b.etat().carnets.slice(-1)[0]; return { n: __m4b.etat().carnets.length, titre: c.titre, titreIA: !!c.titreIA, cat: c.org && c.org.rep.categorie, demande: window.__store.demandes[IN] || null, champVide: document.getElementById('noter').value === '' }; }, ID_NEUF);
    await cap(pre + '05-champ-range');
    await sansToast();
    // B. arrivée de liens/ : aucun lien lu au départ, puis Brau arrive
    await neuf({});
    R.B = await page.evaluate((tc, IB, IM) => ({ appels: window.__appels[tc], demandes: [IB, IM].map(i => !!window.__store.demandes[i]) }), tCitra, ID_BRAU, ID_MOTLER);
    await ouvrir(tCitra, 'org');
    R.B.domAvant = await page.evaluate(() => (document.getElementById('p-org').innerText.match(/🔗 en lecture/g) || []).length);
    await cap(pre + '06-citra-attente');
    await page.evaluate((IB, d) => window.__dbPut(IB, d), ID_BRAU, DOC_BRAU);
    await attendre(1500);
    R.B.apres = await page.evaluate(tc => window.__appels[tc], tCitra);
    await page.evaluate((IB, d) => window.__dbPut(IB, d), ID_BRAU, DOC_BRAU); await page.evaluate(() => window.__dbPut('uautre', { url: 'https://autre.example/x', lu: '2026-11-26T09:00:00Z' }));
    await attendre(2000);
    R.B.apres2 = await page.evaluate(tc => window.__appels[tc], tCitra);
    R.B.dom = await page.evaluate(() => { const o = document.getElementById('p-org'); return { enLecture: (o.innerText.match(/🔗 en lecture/g) || []).length, marques: o.querySelectorAll('.lk').length }; });
    await sansToast(); await cap(pre + '07-citra-arrivee');
    // C. une valeur « lien » inventée est retirée
    await neuf({ [ID_BRAU]: DOC_BRAU }, true);
    R.C = await page.evaluate(tc => { const c = __m4b.etat().carnets.find(x => x.titre === tc); return { premier: c.org.rep.comparaison.articles[1].valeurs[0], fausses: c.org.fausses, erreurs: c.org.erreurs.filter(e => /lien/.test(e)) }; }, tCitra);
  }
} finally {
  res.erreurs = erreurs;
  fs.writeFileSync(CAP + 'resultat-' + MODE + '.json', JSON.stringify(res, null, 1));
  await page.close(); browser.disconnect();
}
console.log(JSON.stringify(res, null, 1).slice(0, 6000));
