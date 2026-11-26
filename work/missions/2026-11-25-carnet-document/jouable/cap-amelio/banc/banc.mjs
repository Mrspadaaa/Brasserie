// Banc de l'amélioration du jouable v7 (26.11). Chrome de débug 9222, son propre onglet, 390 × 844 DPR 2, thème sombre.
// window.claude simulé : sample (réponses écrites à la main, reponses-v7/), db en mémoire (liens/, demandes/, journal/).
// node cap-amelio/banc/banc.mjs avant|apres   → captures dans cap-amelio/, mesures dans cap-amelio/banc/<mode>.json
import fs from 'node:fs';
import { createRequire } from 'node:module';
const RACINE = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/';
const puppeteer = createRequire(RACINE + 'package.json')('puppeteer-core');
const M = RACINE + 'work/missions/2026-11-25-carnet-document/jouable/', CAP = M + 'cap-amelio/';
const MODE = process.argv[2] || 'apres';
const FICHIER = process.env.BANC_FICHIER || (MODE === 'avant' ? CAP + 'src/base.html' : M + 'm4b-v7.html');
const OUT = process.env.BANC_SORTIE || CAP; // contre-épreuve : la version rejetée, sorties hors du dépôt
const attendre = ms => new Promise(r => setTimeout(r, ms));
function idLien(url) { let x = 5381; for (let i = 0; i < url.length; i++) x = (Math.imul(x, 33) + url.charCodeAt(i)) >>> 0; return 'u' + x.toString(16); }
const BRAU = 'https://www.brauundrauchshop.ch/citra-136-2';
const DOC_BRAU = { url: BRAU, titre: 'Citra 13.6 %', lu: '2026-11-26T08:00:00.000Z', par: 'Claude (session pilote)', image: 'https://img.affinee.test/citra.svg',
  faits: [{ label: 'Alpha', valeur: '13.6 %' }, { label: 'Prix au gramme', valeur: '0.1044 CHF/g' }],
  prix: [{ quantite: 5, unite: 'kg', prix: 245.70, devise: 'CHF' }, { quantite: 20, unite: 'kg', prix: 782.15, devise: 'CHF' }], dispo: '66 am Lager', livraison: null };
const IDX = JSON.parse(fs.readFileSync(M + 'reponses-v7/index.json', 'utf8')), REP = {}, AIDE = {};
for (const t in IDX) { const j = JSON.parse(fs.readFileSync(M + 'reponses-v7/' + IDX[t].rep, 'utf8')); REP[t] = j.reponse || j; if (IDX[t].aide) AIDE[t] = JSON.parse(fs.readFileSync(M + 'reponses-v7/' + IDX[t].aide, 'utf8')); }
const L = t => ({ texte: t, source: 'lien', lien: 2 });
const CITRA = 'ZZ TEST — Houblons citra';
const citraL = JSON.parse(JSON.stringify(REP[CITRA]));
Object.assign(citraL, { tache: null, conseil: null, resume: 'Comparer Citra', genre: 'achat', lectures: [],
  options: [{ emoji: '', titre: 'MotlerHops', cout: '?', source: 'notes', ligne: 1, citation: 'motlerhops.fr', conseille: false }, { emoji: '', titre: 'Brau und Rauchshop', cout: '245.70 CHF', source: 'ia', conseille: false }],
  comparaison: { criteres: ['💰 5 kg', '💰 20 kg', '⚖️ Prix CHF/g', '📦 Dispo', '🌿 Alpha'],
    articles: [{ nom: 'MotlerHops', ligne: 1, citation: 'motlerhops.fr', valeurs: [0, 1, 2, 3, 4].map(() => ({ texte: '?', source: 'notes' })) },
      { nom: 'Brau und Rauchshop', ligne: 2, citation: 'brauundrauchshop.ch', valeurs: [L('245.70 CHF'), L('782.15 CHF'), L('0.1044'), L('66 am Lager'), L('13.6 %')] }],
    gagnant: [null, null, null, null, null], compromis: 'Brau a du stock en Suisse ; le site français reste à lire.' } });
// le cas « 6 offres » (écrit au doigt par le banc, l'IA jouée à la main)
const SIX_T = 'ZZ TEST — 600 bouteilles, 6 offres';
const SIX_L = ['Verallia : 0.42/bt, palette de 1200 min', 'Fournisseur B : 0.55/bt par 600, livraison 80 CHF', 'Occasion sur annonce : 0.20/bt, à laver, 400 seulement',
  'Bouteilles33 : 0.62/bt, livraison offerte', 'Brouwland : 0.58/bt, livraison 45 CHF', 'Vetropack : prix à demander'];
const v = (t) => ({ texte: t, source: 'notes' });
const SIX = JSON.parse(JSON.stringify(REP['ZZ TEST — 600 bouteilles 33 cl']));
Object.assign(SIX, { resume: 'Choisir parmi 6 offres', chiffres: [], tache: null, conseil: null,
  options: SIX_L.map((l, i) => ({ emoji: '', titre: l.split(' :')[0], cout: (l.match(/\d+\.\d+\/bt/) || ['?'])[0], source: 'notes', ligne: i + 1, citation: l.split(' :')[0], conseille: false })),
  comparaison: { criteres: ['💰 Prix/bt', '📦 Quantité', '🚚 Livraison', '🧽 État'],
    articles: [
      { nom: 'Verallia', ligne: 1, citation: 'Verallia', valeurs: [v('0.42/bt'), v('1200 min'), v('?'), v('?')], offre: { prix: '0.42/bt', min: '1200 min' } },
      { nom: 'Fournisseur B', ligne: 2, citation: 'Fournisseur B', valeurs: [v('0.55/bt'), v('par 600'), v('80 CHF'), v('?')], offre: { prix: '0.55/bt', livraison: 'livraison 80 CHF' } },
      { nom: 'Occasion', ligne: 3, citation: 'Occasion sur annonce', valeurs: [v('0.20/bt'), v('400 seulement'), v('?'), v('à laver')], offre: { prix: '0.20/bt', max: '400 seulement' } },
      { nom: 'Bouteilles33', ligne: 4, citation: 'Bouteilles33', valeurs: [v('0.62/bt'), v('?'), v('offerte'), v('?')], offre: { prix: '0.62/bt', livraison: 'livraison offerte' } },
      { nom: 'Brouwland', ligne: 5, citation: 'Brouwland', valeurs: [v('0.58/bt'), v('?'), v('45 CHF'), v('?')], offre: { prix: '0.58/bt', livraison: 'livraison 45 CHF' } },
      { nom: 'Vetropack', ligne: 6, citation: 'Vetropack', valeurs: [v('?'), v('?'), v('?'), v('?')] }],
    gagnant: [2, 1, 3, null], compromis: 'Bouteilles33 : livrée sans frais, 372 CHF pour 600 ; Brouwland suit à 393.', besoin: { quantite: 600, ligne: 0, citation: '600 bouteilles' } } });
REP[SIX_T] = SIX;
const HOP = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="#EFF3E6"/><g fill="#7FA650" stroke="#4E6E2E" stroke-width="2"><ellipse cx="48" cy="30" rx="14" ry="10"/><ellipse cx="40" cy="44" rx="13" ry="10"/><ellipse cx="56" cy="44" rx="13" ry="10"/><ellipse cx="48" cy="58" rx="13" ry="10"/><ellipse cx="48" cy="72" rx="9" ry="8"/></g><path d="M48 20V10" stroke="#4E6E2E" stroke-width="3"/></svg>';

const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
const page = await browser.newPage();
const erreurs = [], res = { mode: MODE, ecrans: {}, gestes: {} };
page.on('pageerror', e => erreurs.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_/.test(m.text())) erreurs.push('console: ' + m.text()); });
try {
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  await page.setRequestInterception(true);
  page.on('request', r => { if (r.url().startsWith('https://img.affinee.test/')) r.respond({ status: 200, contentType: 'image/svg+xml', body: HOP }); else r.continue(); });
  await page.evaluateOnNewDocument((REP, AIDE, LIENS, CITRA_L) => {
    window.__prompts = []; window.__opts = [];
    const store = { liens: LIENS, demandes: {}, journal: [] }, subs = [];
    const snap = () => { const docs = Object.keys(store.liens).map(id => { const d = JSON.parse(JSON.stringify(store.liens[id])); return { id, exists: true, data: () => d, metadata: {} }; });
      return { docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: {} }; };
    const db = { collection: p => ({
      add: d => { store.journal.push(d); return Promise.resolve({ id: 'j' + store.journal.length }); },
      doc: id => ({ id, get: () => Promise.resolve({ id, exists: !!(store[p] || {})[id], data: () => (store[p] || {})[id] }), set: d => { (store[p] = store[p] || {})[id] = JSON.parse(JSON.stringify(d)); return Promise.resolve(); } }),
      onSnapshot: (next) => { if (p === 'liens') { subs.push(next); setTimeout(() => next(snap()), 30); } return () => {}; } }) };
    window.__store = store;
    const sample = () => Promise.resolve({ text: 'Réponse simulée.' });
    sample.json = async (prompt, o) => {
      window.__prompts.push(prompt.slice(0, 200)); window.__opts.push(o && o.modelTier || null);
      const t = (prompt.match(/^Carnet : (.*)$/m) || [])[1] || '';
      await new Promise(r => setTimeout(r, 40));
      if (/^Propose des caractéristiques/.test(prompt)) return { caracteristiques: ['Délai de livraison', 'Teinte du verre'] };
      if (/^Tu aides un brasseur/.test(prompt)) return JSON.parse(JSON.stringify(AIDE[t] || { items: [] }));
      if (/citra/i.test(t) && /245\.7/.test(prompt)) return JSON.parse(JSON.stringify(CITRA_L));
      if (REP[t]) return JSON.parse(JSON.stringify(REP[t]));
      throw { code: 'upstream_error' };
    };
    window.claude = { use: n => Promise.resolve(n === 'sample' ? sample : n === 'db' ? db : null) };
  }, REP, AIDE, { [idLien(BRAU)]: DOC_BRAU }, citraL);
  const URL0 = 'file:///' + FICHIER;
  await page.goto(URL0); await page.evaluate(() => localStorage.clear());
  await page.goto(URL0, { waitUntil: 'load' });
  for (let i = 0; i < 150; i++) { const ok = await page.evaluate(() => window.__m4b && __m4b.etat().carnets.every(c => c.org || c.orgErreur) && !__m4b.lecture().lecture); if (ok) break; await attendre(100); }
  await attendre(300);
  const mesure = () => page.evaluate(() => {
    const H = innerHeight, vue = document.querySelector('.vue.on'), words = [], petits = [], cibles = []; let minF = 99;
    const tw = document.createTreeWalker(vue, NodeFilter.SHOW_TEXT); let n;
    while ((n = tw.nextNode())) { const el = n.parentElement; if (!n.textContent.trim() || el.closest('[hidden],.m4b-toast,.am-nav')) continue;
      const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      const r = document.createRange(); r.selectNodeContents(n); if (![...r.getClientRects()].some(x => x.width > 0 && x.bottom > 0 && x.top < H)) continue;
      words.push(...n.textContent.split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)));
      const f = parseFloat(cs.fontSize); if (f < minF) minF = f; if (f < 13) petits.push(f + 'px « ' + n.textContent.trim().slice(0, 20) + ' »'); }
    vue.querySelectorAll('button,[role=button],a[href],input').forEach(b => { if (!b.offsetParent || b.closest('[hidden]')) return; const r = b.getBoundingClientRect(); if (r.bottom < 0 || r.top > H || !r.width) return;
      if (r.height < 43.5 && !b.closest('.am-crits,.am-tabw thead,.am-bar,.am-rr,.am-cat,.am-r')) cibles.push(Math.round(r.width) + '×' + Math.round(r.height) + ' ' + (b.getAttribute('aria-label') || b.textContent).trim().slice(0, 24)); });
    const debord = document.documentElement.scrollWidth > innerWidth + 1;
    const lb = document.getElementById('liste').getBoundingClientRect();
    const rows = [...document.querySelectorAll('#liste .m4j-r')].filter(r => { const b = r.getBoundingClientRect(); return b.height && b.top >= lb.top - 1 && b.bottom <= lb.bottom + 1; }).length;
    const u = document.querySelector('#p-org [data-utile]');
    const po = document.getElementById('p-org'); let phr = 0;
    if (po && !po.hidden) { const tw2 = document.createTreeWalker(po, NodeFilter.SHOW_TEXT); let n2;
      while ((n2 = tw2.nextNode())) { const el = n2.parentElement; if (!n2.textContent.trim() || el.closest('[hidden],[data-nom],.am-tag,.am-leg')) continue;
        const r2 = document.createRange(); r2.selectNodeContents(n2); if (![...r2.getClientRects()].some(x => x.width > 0 && x.bottom > 0 && x.top < H)) continue;
        phr += n2.textContent.split(/\s+/).filter(w => /\p{L}/u.test(w) && !/\d/.test(w) && !/^(l|j)\.?$/i.test(w)).length; } }
    return { mots: words.length, phrases: phr, minFont: minF, petits: petits.slice(0, 6), cibles44: cibles.slice(0, 8), nCibles: cibles.length, debord, carnetsVisibles: vue.id === 'v-liste' ? rows : undefined, utileY: u && !u.closest('[hidden]') ? Math.round(u.getBoundingClientRect().top) : null };
  });
  const cap = async (nom, garder) => { await attendre(300); if (!garder) await page.evaluate(() => document.querySelectorAll('.m4b-toast').forEach(x => x.remove())); await page.screenshot({ path: OUT + MODE + '-' + nom + '.png' }); res.ecrans[nom] = await mesure(); return nom; };
  const idDe = t => page.evaluate(t => (__m4b.etat().carnets.filter(c => c.titre === t)[0] || {}).id, t);
  const ouvrir = async t => { await page.evaluate(i => __m4b.ouvrir(i), await idDe(t)); await attendre(250); };
  const fermer = () => page.evaluate(() => __m4b.fermer());
  const clic = async (sel) => { const el = await page.$(sel); if (!el) throw new Error('absent : ' + sel); await el.click(); await attendre(220); };
  const defiler = (y) => page.evaluate(y => { document.getElementById('defil').scrollTop = y; }, y);
  const g = async (nom, f, garder) => { try { await f(); await cap(nom, garder); res.gestes[nom] = 'ok'; } catch (e) { res.gestes[nom] = 'KO ' + String(e.message || e); } };
  const T = { eco: 'ZZ TEST — écoulement qui fuit', co2: 'ZZ TEST — CO2 qui baisse vite dans un fût', bt: 'ZZ TEST — 600 bouteilles 33 cl', frigo: 'ZZ TEST — frigo de garde en panne', cave: 'ZZ TEST — ranger la cave', vap: 'ZZ TEST — trop de vapeur au brassage' };

  await cap('01-liste');
  for (const [k, t] of Object.entries({ eco: T.eco, co2: T.co2, bt: T.bt, citra: CITRA, frigo: T.frigo, cave: T.cave, vap: T.vap })) { await ouvrir(t); await cap('org-' + k); await fermer(); }
  await ouvrir(T.eco); await clic('#t-notes'); await cap('notes-eco'); await fermer();
  if (MODE === 'apres') {
    await page.evaluate(() => document.getElementById('liste').scrollTop = 2000); await cap('02-liste-bas'); await page.evaluate(() => document.getElementById('liste').scrollTop = 0);
    await g('03-liste-afaire', () => clic('.am-tog')); await clic('.am-tog');
    await g('04-liste-champ', async () => { await page.focus('#noter'); await page.keyboard.type('Condenseur B de nouveau en stock'); });
    await g('05-liste-suggestions', () => clic('#v-liste .am-carre.ia'));
    await page.evaluate(() => { document.querySelectorAll('.am-voile').forEach(x => x.click()); document.getElementById('noter').value = ''; document.activeElement.blur(); }); await attendre(150);
    // écoulement : action sous le pouce, précision
    await ouvrir(T.eco);
    await g('10-eco-ligne-option', () => clic('.am-opt[data-k]'));
    await g('11-eco-fait', () => clic('.am-act .p'), true);
    await g('12-eco-champ', async () => { await page.focus('#pied-org input'); await page.keyboard.type('Flaque encore ce matin'); });
    await g('13-eco-ajoute', () => clic('#pied-org .am-carre.act'), true);
    await g('14-eco-aide', () => clic('#pied-org .am-carre.ia'));
    await fermer();
    // bouteilles : qui gagne quoi, Comparer dédié, écarter, ajouter, proposer, prendre
    await ouvrir(T.bt);
    await g('20-bt-comparer', () => clic('[data-act="comparer"]'));
    await g('21-bt-comparer-cote', () => defiler(330));
    await g('22-bt-cellule', async () => { await clic('.am-cmp .cv[data-r="pu"][data-ci="0"]'); });
    await g('23-bt-ecarter', async () => { await clic('.am-bub [data-act="ecarter"]'); await defiler(2000); });
    await g('24-bt-ajout-crit', async () => { await clic('[data-act="crit-ajout"]'); await page.keyboard.type('Délai'); await page.keyboard.press('Enter'); await attendre(200); await defiler(2000); });
    await g('25-bt-proposer', async () => { await clic('[data-act="crit-proposer"]'); await attendre(400); await defiler(330); });
    await g('26-bt-crit-prix', async () => { await defiler(0); await clic('.am-crits [data-id="c0"]'); });
    await g('27-bt-prendre', () => clic('.am-act .p'), true);
    await g('28-bt-commande', () => clic('.am-act .p'), true);
    await fermer();
    // 6 offres
    await page.evaluate((t, L) => __m4b.ajouter(t, L), SIX_T, SIX_L);
    for (let i = 0; i < 50; i++) { const ok = await page.evaluate(t => { const c = __m4b.etat().carnets.filter(c => c.titre === t)[0]; return c && (c.org || c.orgErreur); }, SIX_T); if (ok) break; await attendre(100); }
    await ouvrir(SIX_T); await cap('30-six-org'); res.sixSections = await page.evaluate(() => [...document.querySelectorAll('#p-org .am-sec h3')].map(h => h.textContent.trim()));
    await g('31-six-comparer', () => clic('[data-act="comparer"]'));
    res.sixCols = await page.evaluate(() => { const th = [...document.querySelectorAll('.am-cmp thead th')].slice(1); return { premier: th[0] && th[0].textContent.trim(), visibles: th.filter(x => x.getBoundingClientRect().right <= innerWidth + 1).length, comp: (document.querySelector('.am-comp') || {}).textContent || '' }; });
    await g('32-six-cote', () => defiler(380));
    await g('33-six-cote-droite', () => page.evaluate(() => { document.querySelector('.am-tabw').scrollLeft = 400; }));
    await g('34-six-bas', () => defiler(3000));
    res.six = await page.evaluate(() => { const D = __m4b.modele(); return { offres: D.comp.arts.length, colonnes: document.querySelectorAll('.am-cmp thead th').length - 1, barres: document.querySelectorAll('.am-rk .am-rr').length }; });
    await fermer();
    // citra : image du lien, Relire, IA forte ; ⋯ du carnet
    await ouvrir(CITRA);
    await g('40-citra-liens', () => defiler(2000));
    await g('41-citra-lien-menu', async () => { const b = await page.$$('[data-act="lien-menu"]'); await b[b.length - 1].click(); await attendre(200); });
    await g('41b-citra-relire', () => clic('.am-feuille [data-x="relire"]'));
    await g('42-citra-meta', () => clic('.am-tete .am-b44'));
    await g('43-citra-escalader', async () => { await clic('.am-feuille [data-x="forte"]'); await attendre(900); await defiler(0); }, true);
    res.escalade = await page.evaluate(() => ({ opts: window.__opts.slice(-3), demandes: window.__store.demandes }));
    await g('44-citra-changes', async () => { await attendre(600); await clic('.am-tete .am-b44'); await clic('.am-feuille [data-x="chg"]'); });
    await page.evaluate(() => document.querySelectorAll('.m4b-voile, .am-voile').forEach(x => x.click())); await attendre(150);
    await fermer();
    // CO2 : en-tête utile, date ; cave : jour contredit
    await ouvrir(T.co2); await g('50-co2-source', () => clic('.am-t4.pro .am-src')); await fermer();
    await ouvrir(T.frigo); await g('52-frigo-comparer', () => clic('.am-act .p')); await fermer();
    await ouvrir(T.cave); await g('51-cave-date', () => defiler(0)); await fermer();
  }
  if (MODE === 'apres') {
    const V = []; res.verite = { defauts: V };
    for (const [k, t] of Object.entries({ eco: T.eco, co2: T.co2, bt: T.bt, frigo: T.frigo, cave: T.cave, vap: T.vap })) {
      await ouvrir(t);
      const r = await page.evaluate(() => { const c = __m4b.courant ? __m4b.courant() : null; const D = __m4b.modele(); const r = D.r;
        return { quand: (r.tache && r.tache.quand) || (r.echeance && r.echeance.quand) || null, dates: [...document.querySelectorAll('#p-org .am-d')].map(x => x.textContent.trim()), qg: (document.querySelector('#p-org .am-qg') || {}).textContent || '',
          bars: [...document.querySelectorAll('#p-org .am-bar')].map(b => ({ cl: b.className, w: (b.querySelector('.tr i') || {}).style ? b.querySelector('.tr i').style.width : null })) }; });
      await fermer();
      const q = String(r.quand || '').toLowerCase(), deduit = q && !/\d{1,2}\s+[a-zéû]+|\d\.\d|aujourd|demain/.test(q) || /avant le \d+ du mois/.test(q);
      if (deduit && r.dates.length && !r.dates.every(d => d.includes('≈'))) V.push(k + ' : date déduite sans ≈ (« ' + q + ' » → ' + r.dates.join(' | ') + ')');
      const mm = q.match(/avant\s+(janv|f[ée]v|mars|avr|mai|juin|juil|ao[uû]|sept|oct|nov|d[ée]c)/); if (mm) { const mo = ['janv','fév','mars','avr','mai','juin','juil','aoû','sept','oct','nov','déc'].findIndex(x => mm[1].normalize('NFD').replace(/[\u0300-\u036f]/g,'').startsWith(x.normalize('NFD').replace(/[\u0300-\u036f]/g,''))) + 1;
        if (r.dates.some(d => new RegExp('\\b\\d{1,2}\\.' + mo + '\\b').test(d))) V.push(k + ' : « ' + q + ' » affiché dans le mois nommé : ' + r.dates.join(' | ')); }
      if (/pas en stock/.test(r.qg) && !/Rien ne départage/.test(r.qg)) V.push(k + ' : « pas en stock » présenté comme un gain');
      if (r.bars.length) { const b0 = r.bars[0]; if (b0.w !== '100%') V.push(k + ' : la 1re barre n’est pas pleine (' + b0.w + ')'); if (r.bars.some(b => / m\b/.test(b.cl) && b.w)) V.push(k + ' : une offre hors besoin a une barre'); }
      res.verite = res.verite || {}; res.verite[k] = r;
    }
    let cp1 = '', cp2 = ''; try {
    await ouvrir(T.bt); await page.evaluate(() => { const o = __m4b.modele().o; o.ecartes = []; }); await fermer(); await ouvrir(T.bt); await clic('[data-act="comparer"]');
    cp1 = await page.evaluate(() => (document.querySelector('.am-comp') || {}).textContent || '');
    await clic('.am-cmp .cv[data-r="pu"][data-ci="0"]'); await clic('.am-bub [data-act="ecarter"]');
    cp2 = await page.evaluate(() => (document.querySelector('.am-comp') || {}).textContent || '');
    await page.evaluate(() => { const o = __m4b.modele().o; o.ecartes = []; }); await fermer(); } catch (e) { V.push('bt : ' + e.message); await fermer(); }
    if (/plus cher/.test(cp1) || !/410/.test(cp1) || !/94/.test(cp1)) V.push('bt : compromis faux : ' + cp1);
    if (/Verallia/.test(cp2) || cp1 === cp2) V.push('bt : compromis non recalculé après Écarter : ' + cp2);
    await ouvrir(SIX_T); await clic('#p-org [data-act="comparer"]'); await attendre(300);
    const sixVieux = await page.evaluate(() => { const th = [...document.querySelectorAll('.am-cmp thead th')].slice(1); return { premier: th[0] && th[0].textContent.trim(), visibles: th.filter(x => x.getBoundingClientRect().right <= innerWidth + 1).length, comp: (document.querySelector('.am-comp') || {}).textContent || '' }; });
    await fermer(); const six = res.sixCols;
    if (!/Bouteilles33/.test(six.premier) || six.visibles < 5) V.push('six : gagnant pas en 1re colonne ou < 5 colonnes visibles : ' + JSON.stringify(six));
    res.verite.cp = { cp1, cp2, six }; res.verite.defauts = V;
  }
  res.erreurs = erreurs;
} finally {
  fs.writeFileSync(OUT + (OUT === CAP ? 'banc/' : '') + MODE + '.json', JSON.stringify(res, null, 1));
  await page.close(); browser.disconnect();
}
console.log(JSON.stringify({ gestes: res.gestes, erreurs, six: res.six, esc: res.escalade && res.escalade.opts }, null, 0));
if (res.verite) console.log('VERITE', res.verite.defauts.length ? 'KO ' + JSON.stringify(res.verite.defauts) : 'OK', JSON.stringify(res.verite.cp));
for (const [k, m] of Object.entries(res.ecrans)) console.log(k, 'mots', m.mots, 'phrases', m.phrases, 'minF', m.minFont, 'cibles<44', m.nCibles, m.cibles44.slice(0, 3).join(' | '), 'debord', m.debord, m.carnetsVisibles != null ? 'visibles ' + m.carnetsVisibles : '', 'utileY', m.utileY);
