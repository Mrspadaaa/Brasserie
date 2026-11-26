// Liens lus (LIENS.md 26.11), PAS-DE-HARCELEMENT, LIENS-NON-LUS, TROP-ENFANTIN sur p4.html.
// window.claude simulé : sample.json rend les réponses écrites à la main (../reponses), citra selon ce que la consigne dit de ses liens ;
// db en mémoire : liens/<id> (Brau seul), demandes/, journal. Chrome de débug 9222, onglet propre, 390 × 844, dsf 2 ; page.close() puis disconnect().
// node work/missions/2026-11-25-carnet-passe4/jouable/cap-liens/cap.mjs
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
const ICI = path.dirname(fileURLToPath(import.meta.url)), J = path.dirname(ICI);
const URL_P4 = pathToFileURL(path.join(J, 'p4.html')).href;
const index = JSON.parse(fs.readFileSync(path.join(J, 'reponses/index.json'), 'utf8'));
const REP = {}, AIDES = {}, APRES = {};
for (const [t, f] of Object.entries(index)) { REP[t] = JSON.parse(fs.readFileSync(path.join(J, 'reponses', f.reponse), 'utf8')); if (f.aide) AIDES[t] = JSON.parse(fs.readFileSync(path.join(J, 'reponses', f.aide), 'utf8')); if (f.apres) APRES[t] = f.apres.map(a => ({ si: a.si, rep: JSON.parse(fs.readFileSync(path.join(J, 'reponses', a.reponse), 'utf8')) })); }
const CITRA = 'ZZ TEST — Houblons citra';
const MOTLER = 'https://www.motlerhops.fr/collections/tous-nos-houblons/products/citra-us', BRAU = 'https://www.brauundrauchshop.ch/citra-136-2';
const djb2 = u => { let x = 5381; for (let i = 0; i < u.length; i++) x = (Math.imul(x, 33) + u.charCodeAt(i)) >>> 0; return 'u' + x.toString(16); };
const LIEN_BRAU = { url: BRAU, titre: 'Citra 13,6 % — Brau- und Rauchshop', lu: '2026-11-26T09:00:00.000Z', par: 'Claude (session pilote)',
  faits: [{ label: 'Alpha', valeur: '13.6 %' }, { label: 'Prix au gramme', valeur: '0.1044 CHF/g' }],
  prix: [{ quantite: 5, unite: 'kg', prix: 245.70, devise: 'CHF' }, { quantite: 20, unite: 'kg', prix: 782.15, devise: 'CHF' }], dispo: '66 am Lager', livraison: null };
const crit = ['💶 5 kg', '💶 20 kg', '⚖️ Au gramme', '📦 Dispo', 'α Alpha'];
const base = { emoji: '🌿', categorie: { nom: 'Brasserie', sous: 'Matières premières' }, priorite: 'normale', etatPropose: 'cherche', genre: 'achat', pistes: [], options: [], echeance: null, periode: null, chiffres: [], liste: [], retenir: [], relecture: null,
  attention: [{ emoji: '⚠️', texte: 'Dur à obtenir', ligne: 3, citation: 'dur à obtenir' }], lectures: [{ ligne: 3, mot: 'dur à obtenir', type: 'pas_trouve' }] };
const q = () => ({ texte: '?', source: 'ia' });
const CITRA_SANS = { ...base, resume: 'Comparer les sites', tache: { emoji: '🔎', titre: 'Comparer les deux sites', ligne: 2, citation: 'brauundrauchshop.ch' },
  manque: [{ emoji: '💰', texte: 'prix suisse réel ?' }],
  comparaison: { criteres: crit, articles: [{ nom: 'MotlerHops', ligne: 1, citation: 'motlerhops.fr', valeurs: crit.map(q) }, { nom: 'Brau- und Rauchshop', ligne: 2, citation: 'brauundrauchshop.ch', valeurs: crit.map(q) }], gagnant: crit.map(() => null) } };
const CITRA_AVEC = { ...base, resume: 'Commander chez Brau', tache: { emoji: '🛒', titre: 'Commander chez Brau- und Rauchshop', ligne: 2, citation: 'brauundrauchshop.ch' }, manque: [{ emoji: '💰', texte: 'prix MotlerHops ?' }],
  comparaison: { criteres: crit, articles: [
    { nom: 'MotlerHops', ligne: 1, citation: 'motlerhops.fr', valeurs: [{ texte: '3.72 €', source: 'lien' }, q(), q(), q(), q()] },
    { nom: 'Brau- und Rauchshop', ligne: 2, citation: 'brauundrauchshop.ch', valeurs: [{ texte: '245.70 CHF', source: 'lien' }, { texte: '782.15 CHF', source: 'lien' }, { texte: '0.1044 CHF/g', source: 'lien' }, { texte: '66 am Lager', source: 'lien', emoji: '✅' }, { texte: '13.6 %', source: 'lien' }] }],
    gagnant: crit.map(() => null) } };

const sortie = { gestes: [], cas: [], erreursPage: [] };
const attendre = ms => new Promise(r => setTimeout(r, ms));
const slug = t => t.replace(/^ZZ TEST\s*—\s*/, '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 28);
const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
const pages = [];
async function nouvelle(liensInit) {
  const page = await browser.newPage(); pages.push(page);
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  page.on('pageerror', e => sortie.erreursPage.push(String(e.message || e)));
  page.on('console', m => { if (m.type() === 'error') sortie.erreursPage.push('console : ' + m.text()); });
  await page.evaluateOnNewDocument((REP, AIDES, APRES, CITRA, SANS, AVEC, liensInit) => {
    localStorage.clear();
    window.__appels = {}; window.__consignes = {};
    const sample = { json: async (prompt) => {
      await new Promise(r => setTimeout(r, 40));
      const t = (prompt.match(/\nCarnet : (.*)\n/) || [])[1];
      if (/^Tu proposes/.test(prompt)) { window.__suggs = (window.__suggs || 0) + 1; const b = /des pistes/.test(prompt) ? 'piste' : /des options/.test(prompt) ? 'option' : 'tache';
        return { suggestions: { piste: [{ emoji: '🧽', texte: 'Siphon encrassé' }, { emoji: '🔩', texte: 'Bonde mal serrée' }, { texte: 'toi' }],
          option: [{ emoji: '🧰', texte: 'Poser un siphon neuf' }, { texte: 'Prix du siphon ?' }], tache: [{ emoji: '📸', texte: 'Photographier le joint usé' }, { emoji: '🛒', texte: 'Acheter un joint de rechange' }] }[b] }; }
      const aide = /^Tu aides/.test(prompt);
      if (!aide) { window.__consignes[t] = prompt; window.__appels[t] = (window.__appels[t] || 0) + 1; }
      let r = aide ? AIDES[t] : t === CITRA ? (prompt.includes('245.70 CHF') ? AVEC : SANS) : REP[t];
      if (!aide && t !== CITRA && APRES[t]) { const v = APRES[t].find(a => prompt.includes(a.si)); if (v) r = v.rep; }
      if (!r) throw { code: 'empty_completion' };
      const out = JSON.parse(JSON.stringify(r)), L = prompt.split('\n').filter(l => /^\d+: /.test(l));
      const fix = o => { if (Array.isArray(o)) o.forEach(fix); else if (o && typeof o === 'object') { if (o.ligne === 'auto') { const k = L.findIndex(l => l.includes(o.citation || o.mot)); o.ligne = k >= 0 ? +L[k].split(':')[0] : null; } Object.values(o).forEach(fix); } };
      fix(out); return out;
    } };
    const store = { liens: { ...liensInit }, demandes: {}, journal: {} }, ecoute = [];
    const snap = () => { const docs = Object.entries(store.liens).map(([id, d]) => ({ id, exists: true, data: () => Object.freeze(JSON.parse(JSON.stringify(d))), metadata: { fromCache: false, hasPendingWrites: false } })); return { docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: { fromCache: false, hasPendingWrites: false } }; };
    const db = { collection: nom => ({
      add: async d => { store[nom] = store[nom] || {}; store[nom]['j' + Object.keys(store[nom]).length] = d; return {}; },
      doc: id => ({ set: async d => { store[nom] = store[nom] || {}; store[nom][id] = d; } }),
      onSnapshot: (next) => { if (nom === 'liens') { ecoute.push(next); setTimeout(() => next(snap()), 60); } return () => {}; } }) };
    window.__store = store; window.__poserLien = (id, d) => { store.liens[id] = d; ecoute.forEach(f => f(snap())); };
    window.claude = { use: async n => (n === 'sample' ? sample : n === 'db' ? db : null) };
  }, REP, AIDES, APRES, CITRA, CITRA_SANS, CITRA_AVEC, liensInit);
  await page.goto(URL_P4, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  return page;
}
async function lu(page) { for (let i = 0; i < 200; i++) { const f = await page.evaluate(() => { const l = window.__p4.lecture(); return !l.lecture && !l.file.length; }); if (f) return; await attendre(100); } }
const cap = (page, nom) => page.screenshot({ path: path.join(ICI, nom + '.png') });
const ouvrir = async (page, bout) => { const id = await page.evaluate(b => window.__p4.etat().carnets.find(c => c.titre.includes(b)).id, bout); await page.evaluate(i => window.__p4.ouvrir(i), id); await attendre(200); return id; };
const fermer = async page => { await page.evaluate(() => window.__p4.fermer()); await attendre(80); };
async function geste(nom, f) { try { const d = await f(); sortie.gestes.push({ nom, ok: d !== false && !(d && d.ok === false), detail: d }); } catch (e) { sortie.gestes.push({ nom, ok: false, detail: String(e.message || e) }); } }
const basDefil = page => page.$eval('#defil', d => { d.scrollTop = d.scrollHeight; });
/* ce que montre la comparaison citra */
const lireCitra = page => page.evaluate(() => {
  const arts = [...document.querySelectorAll('#p-org .p4-art')].map(a => ({ nom: a.querySelector('.nom b').textContent, lect: !!a.querySelector('.p4-lect') }));
  const cases = [...document.querySelectorAll('#p-org .p4-cmp .p4-c')].map(c => ({ t: c.textContent, lk: !!c.querySelector('.lk'), lect: c.classList.contains('lect') }));
  const o = window.__p4.etat().carnets.find(c => /citra/.test(c.titre)).org;
  return { arts, cases, erreurs: o && o.erreurs, action: document.getElementById('action').textContent, incs: document.querySelectorAll('#p-org .p4-inc').length };
});

/* ===== A : Brau déjà lu dans liens/, MotlerHops non ===== */
const idB = djb2(BRAU), idM = djb2(MOTLER);
let page = await nouvelle({ [idB]: LIEN_BRAU });
await lu(page);
await geste('id djb2 de la page = celui du banc', async () => { const ids = await page.evaluate((a, b) => [window.__p4.idLien(a), window.__p4.idLien(b)], BRAU, MOTLER); return ids[0] === idB && ids[1] === idM ? idB + ' ' + idM : false; });
await ouvrir(page, 'citra');
await cap(page, 'a1-citra');
await basDefil(page); await attendre(80); await cap(page, 'a2-citra-bas');
await geste('A · citra rangé : valeurs 🔗 Brau, « 🔗 en lecture » MotlerHops, valeur inventée retirée', async () => {
  const r = await lireCitra(page);
  const brau = r.cases.filter((c, i) => i % 2 === 1), mot = r.cases.filter((c, i) => i % 2 === 0);
  const ok = brau.filter(c => c.lk).length === 5 && r.arts[0].lect && !r.arts[1].lect && mot.every(c => c.t === '?' && c.lect) && (r.erreurs || []).some(e => /3\.72 € » absente de liens/.test(e));
  r.html = await page.$eval('#p-org .p4-cmp', g => [...g.querySelectorAll('.p4-c')][1].outerHTML);
  return { ok, html: r.html, brau: brau.map(c => (c.lk ? '🔗' : '') + c.t).join(' | '), motler: mot.map(c => c.t + (c.lect ? '(lect)' : '')).join(' '), arts: r.arts, erreurs: r.erreurs };
});
await geste('A · consigne : « Ce que disent ses liens » avec Brau, MotlerHops en lecture', async () => {
  const p = await page.evaluate(t => window.__consignes[t], CITRA);
  const ok = /Ce que disent ses liens \(lus par Claude le 26 nov\./.test(p) && p.includes('5 kg = 245.70 CHF ; 20 kg = 782.15 CHF') && p.includes('dispo : 66 am Lager') && p.includes('Prix au gramme : 0.1044 CHF/g') && /Ligne 1 · motlerhops\.fr — pas encore lu \(🔗 en lecture\)/.test(p) && p.includes('"source":"lien"');
  return ok ? p.split('\n').filter(l => /^Ligne \d · /.test(l)).join(' // ') : false;
});
await geste('A · demande écrite pour MotlerHops seul', async () => {
  const d = await page.evaluate(() => window.__store.demandes);
  return d[idM] && !d[idB] && d[idM].url === MOTLER && d[idM].carnet === CITRA && !isNaN(Date.parse(d[idM].quand)) ? JSON.stringify(d) : false;
});
await geste('A · une seule lecture citra (aucune relance inutile)', async () => { const n = await page.evaluate(t => window.__appels[t], CITRA); return n === 1 ? 'appels ' + n : false; });
await geste('A · toucher « ? » en lecture : toast, pas de question au pouce', async () => {
  await page.evaluate(() => document.querySelector('#p-org .p4-c.inc.lect').click()); await attendre(150); await cap(page, 'a3-citra-toucher-lect');
  const t = await page.evaluate(() => (document.querySelector('.m4b-toast') || {}).textContent || document.body.innerText.match(/Claude lit cette page[^\n]*/)?.[0]);
  return /Claude lit cette page/.test(t || '') ? t : false;
});
await fermer(page);

/* ===== C : les 19 exemples (même page) : rien au pouce qu'une vraie action ; noms réels ===== */
const NOMS = '#tete-titre, .p4-qui b, .p4-art .nom b, .p4-jeton .mot, .p4-go b, .p4-col .n, .p4-bn, .p4-dn, .p4-tit';
const etatPouce = page => page.evaluate((NOMS) => {
  const act = document.getElementById('action'), carnet = document.getElementById('v-carnet');
  const zone = act.hidden ? '' : act.textContent.trim();
  const qui = [...document.querySelectorAll('#p-org .p4-qui b')].map(b => b.textContent.trim());
  const barre = carnet.querySelector('.m4b-top').getBoundingClientRect().bottom, H = window.innerHeight;
  let phrases = 0; const vus = [];
  const w = document.createTreeWalker(carnet, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) {
    const t = n.textContent; if (!t.trim()) continue; const el = n.parentElement;
    if (!el || el.closest('[hidden]') || el.closest(NOMS)) continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const r = document.createRange(); r.selectNodeContents(n);
    if (![...r.getClientRects()].some(b => b.width > 0 && b.height > 0 && b.bottom > barre && b.top < H)) continue;
    const k = t.split(/\s+/).filter(x => /\p{L}/u.test(x) && !/\d/.test(x)).length; phrases += k; if (k) vus.push(t.trim());
  }
  const texte = carnet.innerText;
  return { zone, question: /\?/.test(zone) || !!act.querySelector('.p4-mot, .p4-noter'), noter: document.querySelectorAll('#v-carnet [data-booster="noter-manque"], #v-carnet .p4-manque:not(.fait)').length,
    qui, toi: qui.filter(x => /^toi$/i.test(x)).length, double: !!(document.querySelector('#p-org .p4-face') && document.querySelector('#p-org .p4-cmp')),
    incs: [...document.querySelectorAll('#p-org .p4-inc')].map(b => b.textContent), phrases, vus, texte: texte.slice(0, 0) };
}, NOMS);
const titres = await page.evaluate(() => window.__p4.etat().carnets.map(c => c.titre));
for (const t of titres) {
  await ouvrir(page, t);
  const s1 = await etatPouce(page); const nom = 'c-' + slug(t);
  await cap(page, nom);
  const cas = { titre: t, avant: s1 };
  const tache = await page.evaluate(() => { const b = document.querySelector('#action .p4-go[data-booster="action"]'); if (b && b.querySelector('.case')) { b.click(); return true; } return false; });
  if (tache) { await attendre(250); cas.apres = await etatPouce(page); await cap(page, nom + '-apres'); }
  /* une manque répétée : son libellé deux fois dans Organisé */
  cas.repete = await page.evaluate(() => { const o = window.__p4.etat().carnets.find(c => c.id === window.__p4.etat().courant).org; const txt = document.getElementById('p-org').innerText + ' ' + document.getElementById('action').innerText;
    return ((o && o.rep.manque) || []).filter(m => txt.split(m.texte.replace(/\s*\?\s*$/, '')).length - 1 > 1).map(m => m.texte); });
  sortie.cas.push(cas);
  await fermer(page);
}
const mauvais = sortie.cas.filter(c => [c.avant, c.apres].filter(Boolean).some(s => s.question || s.noter || s.toi || s.double) || c.repete.length);
await geste('C · 19 exemples : aucune question au pouce, aucun « Noter » de manque, aucun « toi », pas deux fois la même comparaison, rien de répété', async () => (sortie.cas.length === 19 && !mauvais.length ? '19/19 · pouce : ' + sortie.cas.map(c => (c.avant.zone || '∅').slice(0, 28) + (c.apres ? ' → ' + (c.apres.zone || '∅').slice(0, 20) : '')).join(' | ') : { ok: false, n: sortie.cas.length, mauvais: mauvais.map(c => c.titre) }));
const trop = sortie.cas.filter(c => c.avant.phrases > 30);
await geste('C · phrases ≤ 30 mots (noms et chiffres non comptés)', async () => (!trop.length ? sortie.cas.map(c => slug(c.titre).slice(0, 10) + ' ' + c.avant.phrases).join(', ') : { ok: false, trop: trop.map(c => c.titre + ' ' + c.avant.phrases) }));
await page.close();

/* ===== D : ✦ suggestions de l'IA, bloc par bloc (écoulement : pistes, options, à faire) ===== */
page = await nouvelle({ [idB]: LIEN_BRAU });
await lu(page);
await ouvrir(page, 'écoulement');
const pouceAvant = await page.$eval('#action', a => a.hidden ? '' : a.textContent);
await cap(page, 'd0-ecoulement');
for (const [bloc, sel] of [['piste', '.p4-jetons .p4-sg'], ['option', '.p4-face + .p4-plus-bloc .p4-sg-p'], ['tache', '.p4-k .p4-plus-bloc .p4-sg-p']]) {
  /* « À faire » paraît quand la tâche du pouce est faite */
  if (bloc === 'tache') { await page.$eval('#action .p4-go[data-booster="action"]', b => b.click()); await attendre(200); }
  const pouceAvant = await page.$eval('#action', a => a.hidden ? '' : a.textContent);
  await geste('D · ✦ ' + bloc + ' : suggestions en place, ✦ IA, noms réels, rien au pouce', async () => {
    const n0 = await page.evaluate(() => window.__suggs || 0);
    await page.$eval(sel, b => b.click()); await attendre(15);
    const enCours = await page.$$eval('.p4-sugg.en', x => x.length); await attendre(250);
    const r = await page.evaluate(bloc => ({ items: [...document.querySelectorAll('.p4-suggs[data-bloc="' + bloc + '"] .p4-sugg:not(.en)')].map(x => x.textContent), pouce: document.getElementById('action').hidden ? '' : document.getElementById('action').textContent, n: window.__suggs }), bloc);
    await page.evaluate(bloc => document.querySelector('.p4-suggs[data-bloc="' + bloc + '"]').scrollIntoView({ block: 'center' }), bloc); await attendre(60);
    await cap(page, 'd-' + bloc + '-suggestions');
    const ok = r.n === n0 + 1 && r.items.length >= 1 && r.items.every(t => /^✦ IA/.test(t) && !/\btoi\b|\?/.test(t)) && r.pouce === pouceAvant;
    return ok ? r.items.join(' | ') + ' · en cours vu ' + enCours + ' · pouce inchangé « ' + pouceAvant + ' »' : { ok: false, r, pouceAvant };
  });
}
await geste('D · garder une piste (jeton ✦), écarter une autre (refus)', async () => {
  await page.evaluate(() => document.querySelector('.p4-suggs[data-bloc="piste"] .p4-sugg .g').click()); await attendre(150);
  await page.evaluate(() => document.querySelector('.p4-suggs[data-bloc="piste"] .p4-sugg .x').click()); await attendre(150);
  await page.$eval('#defil', d => { d.scrollTop = 0; }); await attendre(60); await cap(page, 'd-piste-gardee');
  const r = await page.evaluate(() => { const c = window.__p4.etat().carnets.find(x => x.id === window.__p4.etat().courant); return { miens: c.miens.map(m => m.type + ':' + m.texte + (m.ia ? ':ia' : '')), refus: c.refus, jetons: [...document.querySelectorAll('.p4-jeton.mien .mot')].map(x => x.textContent), restent: document.querySelectorAll('.p4-suggs[data-bloc="piste"] .p4-sugg').length }; });
  return r.miens.includes('piste:Siphon encrassé:ia') && r.refus.includes('suggestion : Bonde mal serrée') && r.jetons.includes('Siphon encrassé') && r.restent === 0 ? JSON.stringify(r) : { ok: false, r };
});
await page.close();

/* ===== B : liens/ vide au départ, Brau arrive ensuite ===== */
page = await nouvelle({});
await lu(page);
await ouvrir(page, 'citra');
await cap(page, 'b1-citra-avant-lien');
await geste('B · avant le lien : 1 lecture, demandes pour les deux liens, tout « 🔗 en lecture », pouce sans question', async () => {
  const n = await page.evaluate(t => window.__appels[t], CITRA), d = await page.evaluate(() => window.__store.demandes), r = await lireCitra(page);
  const ok = n === 1 && d[idB] && d[idM] && r.arts.every(a => a.lect) && r.cases.every(c => c.t === '?' && c.lect) && !/\?/.test(r.action) && r.incs === 0;
  return ok ? 'appels 1 · demandes ' + Object.keys(d).join(',') + ' · pouce « ' + r.action + ' »' : { ok: false, n, d: Object.keys(d), r };
});
await page.evaluate((id, d) => window.__poserLien(id, d), idB, LIEN_BRAU);
await attendre(300); await lu(page); await attendre(150);
await cap(page, 'b2-citra-lien-arrive');
await basDefil(page); await attendre(80); await cap(page, 'b3-citra-lien-arrive-bas');
await geste('B · liens/ arrive : relecture une fois, valeurs 🔗 Brau', async () => {
  const n = await page.evaluate(t => window.__appels[t], CITRA), r = await lireCitra(page);
  const ok = n === 2 && r.cases.filter(c => c.lk).length === 5 && r.arts[0].lect && !r.arts[1].lect;
  return ok ? 'appels 2 · Brau ' + r.cases.filter(c => c.lk).map(c => c.t).join(' | ') : { ok: false, n, r };
});
await page.evaluate((id, d) => window.__poserLien(id, { ...d, lu: '2026-11-26T10:00:00.000Z' }), idB, LIEN_BRAU);
await page.evaluate((id, d) => window.__poserLien(id, d), 'uautre', { url: 'https://exemple.ch/x', titre: 'autre', lu: '2026-11-26T10:00:00.000Z', faits: [], prix: [] });
await attendre(400); await lu(page);
await geste('B · Brau relu et autre lien : pas de deuxième relance', async () => { const n = await page.evaluate(t => window.__appels[t], CITRA); return n === 2 ? 'appels 2' : { ok: false, n }; });
await geste('B · journal : « lien lu, relecture » une fois', async () => { const j = await page.evaluate(() => Object.values(window.__store.journal).filter(x => x.geste === 'lien lu, relecture').length); return j === 1 ? 'une fois' : { ok: false, j }; });
await page.close();
browser.disconnect();

const ok = sortie.gestes.filter(g => g.ok).length;
fs.writeFileSync(path.join(ICI, 'resultats.json'), JSON.stringify(sortie, null, 1));
sortie.gestes.forEach(g => console.log((g.ok ? 'OK ' : 'KO ') + g.nom + ' :: ' + (typeof g.detail === 'string' ? g.detail : JSON.stringify(g.detail)).slice(0, 600)));
console.log('GESTES ' + ok + '/' + sortie.gestes.length, '· ERREURS PAGE ' + sortie.erreursPage.length, sortie.erreursPage.slice(0, 5).join(' / '));
