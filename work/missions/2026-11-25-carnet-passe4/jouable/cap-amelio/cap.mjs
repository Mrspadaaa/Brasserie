// Amélioration du 26.11 : captures « avant » / « après » à 390 × 844 et gestes, Chrome de débug 9222, onglet propre ; page.close() puis disconnect().
// window.claude simulé (sample : réponses de ../reponses ; db : journal, demandes, liens/ avec une image de banc servie par interception).
// node cap.mjs <fichier.html> <avant|apres>
import puppeteer from 'puppeteer-core';
import fs from 'fs'; import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url';
const ICI = path.dirname(fileURLToPath(import.meta.url)), J = path.join(ICI, '..');
const [, , FICHIER, MODE] = process.argv; const APRES = MODE === 'apres';
const index = JSON.parse(fs.readFileSync(path.join(J, 'reponses/index.json'), 'utf8'));
const REP = {}, AIDES = {}, APRESR = {};
for (const [t, f] of Object.entries(index)) { REP[t] = JSON.parse(fs.readFileSync(path.join(J, 'reponses', f.reponse), 'utf8')); if (f.aide) AIDES[t] = JSON.parse(fs.readFileSync(path.join(J, 'reponses', f.aide), 'utf8')); if (f.apres) APRESR[t] = f.apres.map(a => ({ si: a.si, rep: JSON.parse(fs.readFileSync(path.join(J, 'reponses', a.reponse), 'utf8')) })); }
const SIX = JSON.parse(fs.readFileSync(path.join(ICI, '600-six-offres.json'), 'utf8'));
(APRESR['ZZ TEST — 600 bouteilles 33 cl'] = APRESR['ZZ TEST — 600 bouteilles 33 cl'] || []).push({ si: 'Vetropack', rep: SIX });
const LIENSFIX = [
  { url: 'https://www.motlerhops.fr/collections/tous-nos-houblons/products/citra-us', titre: 'Citra US · houblon en pellets', lu: '2026-11-26T08:10:00Z', image: 'https://banc.test/citra-motler.svg', prix: [{ quantite: 100, unite: 'g', prix: 3.72, devise: '€' }], dispo: 'en stock', faits: [{ label: 'acides alpha', valeur: '10 % - 15 %' }, { label: 'arômes', valeur: 'citron vert, mangue, fruits tropicaux' }, { label: 'origine', valeur: 'États-Unis' }] },
  { url: 'https://www.brauundrauchshop.ch/citra-136-2', titre: 'Citra 13,6 % · Brau- und Rauchshop', lu: '2026-11-26T08:12:00Z', image: 'https://banc.test/citra-brau.svg', faits: [{ label: 'acides alpha', valeur: '13,6 %' }, { label: 'arômes', valeur: 'citron vert, mangue, fruits tropicaux' }] }
];
const SVG_BANC = c => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="#f3efe6"/><path d="M48 14c14 9 22 21 22 36s-8 25-22 32c-14-7-22-17-22-32s8-27 22-36z" fill="${c}"/><path d="M28 44h40M30 58h36M36 30h24" stroke="#f3efe6" stroke-width="3"/><text x="48" y="92" font-size="9" text-anchor="middle" fill="#555">image de banc</text></svg>`;
const sortie = { mode: MODE, gestes: [], mesures: {}, erreursPage: [] };
const att = ms => new Promise(r => setTimeout(r, ms));
const CAP = path.join(ICI, MODE); fs.mkdirSync(CAP, { recursive: true });
const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
async function nouvelle() {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  page.on('pageerror', e => sortie.erreursPage.push(String(e.message || e)));
  page.on('console', m => { if (m.type() === 'error' && !/banc\.test|ERR_/.test(m.text())) sortie.erreursPage.push('console : ' + m.text()); });
  await page.setRequestInterception(true);
  page.on('request', q => { const u = q.url(); if (u.startsWith('https://banc.test/')) q.respond({ status: 200, contentType: 'image/svg+xml', body: SVG_BANC(u.includes('brau') ? '#7aa35a' : '#9bc46b') }); else if (/^https?:/.test(u)) q.abort(); else q.continue(); });
  await page.evaluateOnNewDocument((REP, AIDES, APRESR, LIENSFIX) => {
    if (!sessionStorage.getItem('p4-propre')) { localStorage.clear(); sessionStorage.setItem('p4-propre', '1'); }
    window.__journal = []; window.__demandes = []; window.__tiers = [];
    const djb = u => { let x = 5381; for (let i = 0; i < u.length; i++) x = (Math.imul(x, 33) + u.charCodeAt(i)) >>> 0; return 'u' + x.toString(16); };
    const sample = { json: async (prompt, opts) => {
      await new Promise(r => setTimeout(r, window.__delai || 40));
      const t = (prompt.match(/\nCarnet : (.*)\n/) || [])[1], aide = /^Tu (aides|proposes)/.test(prompt);
      if (!aide) window.__tiers.push({ t, tier: (opts && opts.modelTier) || 'défaut' });
      let r = aide ? (AIDES[t] || { suggestions: [{ emoji: '', texte: 'Délai de livraison' }, { emoji: '', texte: 'Frais de port' }] }) : REP[t];
      if (!aide && APRESR[t]) { const v = APRESR[t].filter(a => prompt.includes(a.si)).pop(); if (v) r = v.rep; }
      if (!r) throw { code: 'empty_completion' };
      const out = JSON.parse(JSON.stringify(r)), L = prompt.split('\n').filter(l => /^\d+: /.test(l));
      const fix = o => { if (Array.isArray(o)) o.forEach(fix); else if (o && typeof o === 'object') { if (o.ligne === 'auto') { const k = L.findIndex(l => l.includes(o.citation || o.mot)); o.ligne = k >= 0 ? +L[k].split(':')[0] : null; } Object.values(o).forEach(fix); } };
      fix(out); return out;
    } };
    const db = { collection: n => ({ add: async d => { window.__journal.push(d); }, doc: id => ({ set: async d => { window.__demandes.push(Object.assign({ id }, d)); } }),
      onSnapshot: cb => { if (n === 'liens') setTimeout(() => cb({ docs: LIENSFIX.map(x => ({ id: djb(x.url), exists: true, data: () => x })) }), 20); return () => {}; } }) };
    window.claude = { use: async n => (n === 'sample' ? sample : n === 'db' ? db : null) };
  }, REP, AIDES, APRESR, LIENSFIX);
  await page.goto(pathToFileURL(path.resolve(FICHIER)).href, { waitUntil: 'load' });
  return page;
}
async function lu(page) { for (let i = 0; i < 200; i++) { if (await page.evaluate(() => { const l = window.__p4.lecture(); return !l.lecture && !l.file.length; })) return; await att(100); } }
function controle() {
  const vis = e => { const r = e.getBoundingClientRect(); return e.offsetParent !== null && r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight; };
  const zone = [...document.querySelectorAll('.vue.on, .m4b-feuille')];
  const dans = e => zone.some(z => z.contains(e));
  const petites = [...document.querySelectorAll('button, [role=button]')].filter(b => dans(b) && vis(b) && !b.disabled).filter(b => { const r = b.getBoundingClientRect(); return r.height < 43.5 || r.width < 43.5; })
    .map(b => (b.getAttribute('aria-label') || b.textContent).trim().slice(0, 22) + ' ' + Math.round(b.getBoundingClientRect().width) + '×' + Math.round(b.getBoundingClientRect().height));
  const coupes = [...document.querySelectorAll('.vue.on *, .m4b-feuille *')].filter(e => vis(e) && e.textContent.trim() && !e.closest('svg')).filter(e => { const cs = getComputedStyle(e);
    return (cs.textOverflow === 'ellipsis' && e.scrollWidth > e.clientWidth + 1) || (cs.webkitLineClamp !== 'none' && cs.webkitLineClamp && e.scrollHeight > e.clientHeight + 2); }).map(e => e.textContent.trim().slice(0, 40));
  return { petites, coupes };
}
sortie.controles = {};
const cap = async (page, nom) => { await att(120); await page.screenshot({ path: path.join(CAP, nom + '.png') }); if (APRES) sortie.controles[nom] = await page.evaluate(controle); };
const idDe = (page, bout) => page.evaluate(b => window.__p4.etat().carnets.find(c => c.titre.includes(b)).id, bout);
const ouvrir = async (page, bout) => { const id = await idDe(page, bout); await page.evaluate(i => window.__p4.ouvrir(i), id); await att(200); return id; };
const fermer = async page => { await page.evaluate(() => window.__p4.fermer()); await att(100); };
async function geste(nom, f) { try { const d = await f(); sortie.gestes.push({ nom, ok: d !== false, detail: d === false ? 'contrôle faux' : (d || '') }); } catch (e) { sortie.gestes.push({ nom, ok: false, detail: String(e.message || e).slice(0, 200) }); } }
const clicTexte = (page, sel, txt) => page.evaluate((sel, txt) => { const e = [...document.querySelectorAll(sel)].find(x => x.offsetParent !== null && x.textContent.includes(txt)); if (e) e.click(); return !!e; }, sel, txt);
function mesureOrg() {
  const top = document.querySelector('#v-carnet .m4b-top').getBoundingClientRect().bottom;
  const u = [...document.querySelectorAll('#p-org .a-tu, #p-org .p4-ech, #p-org .a-qgq, #p-org .p4-chf, #p-org .p4-face, #p-org .p4-cmp, #p-org .p4-jetons, #p-org .p4-jauge, #p-org .p4-att')].filter(e => e.offsetParent).map(e => e.getBoundingClientRect().top).sort((a, b) => a - b)[0];
  const emojiGrands = [...document.querySelectorAll('#v-carnet *')].filter(e => e.offsetParent && e.childNodes.length && [...e.childNodes].some(n => n.nodeType === 3 && /\p{Extended_Pictographic}/u.test(n.textContent)) && parseFloat(getComputedStyle(e).fontSize) > 20).length;
  const petites = [...document.querySelectorAll('#v-carnet button')].filter(b => { const r = b.getBoundingClientRect(); return b.offsetParent && r.width > 0 && (r.height < 36 || r.width < 36) && r.bottom > 0 && r.top < innerHeight; }).map(b => (b.getAttribute('aria-label') || b.textContent).trim().slice(0, 24) + ' ' + Math.round(b.getBoundingClientRect().width) + '×' + Math.round(b.getBoundingClientRect().height));
  return { utile: u == null ? null : Math.round(u - top), emojiGrands, petites: petites.slice(0, 8) };
}

let page = await nouvelle(); await lu(page);
await cap(page, '01-liste');
sortie.mesures.liste = await page.evaluate(() => {
  const l = document.getElementById('liste').getBoundingClientRect();
  const rows = [...document.querySelectorAll('#liste .p4-r')].map(r => r.getBoundingClientRect()).filter(b => b.top >= l.top - 1 && b.bottom <= l.bottom + 1);
  return { lignesVisibles: rows.length, hauteurMin: Math.round(Math.min(...rows.map(b => b.height))), sousCategories: [...document.querySelectorAll('#liste [data-sous]')].map(x => x.getAttribute('data-sous')) };
});
await page.$eval('#liste', l => { l.scrollTop = l.scrollHeight; }); await cap(page, '02-liste-bas'); await page.$eval('#liste', l => { l.scrollTop = 0; });
if (APRES) {
  await geste('Liste : ✦ ce que l’IA propose (sans appel)', async () => { await page.click('#l-sugg'); await att(150); await cap(page, '03-liste-sugg'); const n = await page.$$eval('.m4b-feuille .a-fs', x => x.length); await page.evaluate(() => document.querySelector('.m4b-voile') && document.querySelector('.m4b-voile').click()); await page.evaluate(() => { const b = [...document.querySelectorAll('.m4b-feuille button')].find(x => /Fermer/.test(x.textContent)); if (b) b.click(); }); await att(80); return n > 0 ? n + ' lignes' : false; });
  await geste('Liste : replier la sous-catégorie Conditionnement puis la déplier', async () => {
    const av = await page.$$eval('#liste .p4-r', r => r.length); await clicTexte(page, '#liste [data-sous]', 'Conditionnement'); await att(100); await cap(page, '04-liste-sous-repliee');
    const ap = await page.$$eval('#liste .p4-r', r => r.length); await clicTexte(page, '#liste [data-sous]', 'Conditionnement'); await att(80); return ap < av ? av + ' → ' + ap + ' lignes' : false; });
}
const CAS = [['écoulement', '10-ecoulement'], ['600 bouteilles', '12-bouteilles'], ['citra', '15-citra'], ['vapeur', '17-vapeur'], ['frigo de garde', '18-frigo'], ['assurance', '19-assurance'], ['fête de la bière', '29-fete'], ['CO2', '30-co2']];
for (const [b, nom] of CAS) {
  await ouvrir(page, b); await cap(page, nom); sortie.mesures[nom] = await page.evaluate(mesureOrg);
  if (nom === '10-ecoulement') { await page.$eval('#defil', d => { d.scrollTop = d.scrollHeight; }); await cap(page, '11-ecoulement-bas'); }
  if (APRES && nom === '12-bouteilles') {
    await geste('600 bouteilles : Comparer, vue dédiée', async () => {
      await clicTexte(page, '.a-gocmp', 'Comparer'); await att(150); await cap(page, '13-comparer');
      await page.$eval('#cmp-defil', d => { d.scrollTop = 600; }); await cap(page, '14-comparer-milieu');
      await page.$eval('#cmp-defil', d => { d.scrollTop = d.scrollHeight; }); await cap(page, '14b-comparer-bas');
      const m = await page.evaluate(() => window.__p4amelio.modele()); sortie.mesures.modele600 = m;
      return m && m.gagnants.includes('Fournisseur B') ? 'gagnants ' + JSON.stringify(m.gagnants) : false; });
    await geste('Comparer : classer par « Prix / bt » d’un toucher sur sa ligne, puis revenir', async () => {
      await page.$eval('#cmp-defil', d => { d.scrollTop = 0; }); await clicTexte(page, '.a-tab td button', 'Prix'); await att(120); await cap(page, '14c-comparer-prix-bt');
      const k = await page.evaluate(() => window.__p4amelio.modele().crit); await clicTexte(page, '.a-tab td button', 'Pour 600'); await att(80); return k === 0 ? 'critère 0 (Prix / bt)' : false; });
    await geste('Comparer : écarter Verallia → Écartés · 1, Reprendre', async () => {
      await page.evaluate(() => [...document.querySelectorAll('.a-tab .a-off')].find(x => /^Verallia/.test(x.getAttribute('aria-label'))).click()); await att(150); await clicTexte(page, '.m4b-feuille button', 'Écarter'); await att(150);
      await page.$eval('#cmp-defil', d => { d.scrollTop = d.scrollHeight; }); await cap(page, '14d-comparer-ecarte');
      const t = await page.$eval('#cmp-defil', d => d.textContent); await clicTexte(page, '.a-ec .a-act', 'Reprendre'); await att(100);
      return /Écartés · 1/.test(t) ? 'Écartés · 1 puis repris' : false; });
    await geste('Comparer : choisir Fournisseur B depuis sa colonne → « ✓ choisi » (Comparer et Organisé)', async () => {
      await page.$eval('#cmp-defil', d => { d.scrollTop = 0; }); await page.evaluate(() => [...document.querySelectorAll('.a-tab .a-off')].find(x => /^Fournisseur B/.test(x.getAttribute('aria-label'))).click()); await att(150); await cap(page, '14f-offre-feuille');
      await clicTexte(page, '.m4b-feuille button', 'Choisir'); await att(200); const t = await page.$eval('#cmp-defil', d => d.textContent); await page.evaluate(() => window.__p4amelio.fermerCmp()); await att(150);
      const o = await page.$eval('#p-org', d => d.textContent); await cap(page, '14g-choisi-organise'); await clicTexte(page, '.a-gocmp', 'Comparer'); await att(150);
      return /✓ choisi/.test(t) && /choisi/.test(o) ? 'choisi dans Comparer et Organisé' : false; });
    await geste('Comparer : ✦ Proposer une caractéristique (IA simulée)', async () => {
      await clicTexte(page, '.a-car button', 'Proposer'); await att(400); await page.$eval('#cmp-defil', d => { d.scrollTop = d.scrollHeight; }); await cap(page, '14e-comparer-proposer');
      const n = await page.$$eval('.a-sgl', x => x.map(e => e.textContent)); return n.length && !n.some(x => /port/i.test(x)) ? n.length + ' suggestion(s), sans doublon de Livraison' : false; });
    await page.evaluate(() => window.__p4amelio.fermerCmp()); await att(100);
  }
  if (APRES && nom === '15-citra') {
    await page.$eval('#defil', d => { d.scrollTop = d.scrollHeight; }); await cap(page, '15b-citra-liens');
    await geste('Citra : Comparer (2 offres, images liens/<id>.image)', async () => { await clicTexte(page, '.a-gocmp', 'Comparer'); await att(300); await cap(page, '16-citra-comparer'); const im = await page.$$eval('#cmp-defil img', x => x.filter(i => i.complete && i.naturalWidth > 0).length); await page.evaluate(() => window.__p4amelio.fermerCmp()); await att(100); return im ? im + ' images chargées' : false; });
    await geste('Citra : Relire un lien → demandes/<id> type relire, « 🔗 en lecture »', async () => {
      await page.$eval('#defil', d => { d.scrollTop = d.scrollHeight; }); await page.click('.a-lien .a-plusl'); await att(150); await cap(page, '27a-lien-menu'); await clicTexte(page, '.m4b-feuille button', 'Relire le lien'); await att(150); await cap(page, '27-citra-relire');
      const d = await page.evaluate(() => window.__demandes.slice(-1)[0]); const t = await page.$eval('#p-org', o => o.textContent);
      return d && d.type === 'relire' && /en lecture/.test(t) ? 'demande ' + d.id + ' relire · en lecture' : false; });
  }
  if (APRES && nom === '18-frigo') {
    await geste('Frigo : + vide → feuille d’ajout (piste, option, à faire, lien)', async () => { await page.click('#a-plus'); await att(150); await cap(page, '20-plus'); const n = await page.$$eval('.m4b-feuille .a-fs', x => x.length); await page.evaluate(() => { const b = [...document.querySelectorAll('.m4b-feuille .a-fs')][0]; b.click(); }); await att(100); const ph = await page.$eval('#pied-org input', i => i.placeholder); await page.evaluate(() => { const x = document.querySelector('.m4b-pour button'); if (x) x.click(); }); return n >= 4 && /piste/i.test(ph) ? n + ' choix · ' + ph : false; });
  }
  await fermer(page);
}
if (APRES) {
  await geste('Écoulement : Escalader à l’IA → sample modelTier complex, « IA forte »', async () => {
    await ouvrir(page, 'écoulement'); await page.$eval('#defil', d => { d.scrollTop = d.scrollHeight; });
    await clicTexte(page, '.a-lect .a-act', 'Escalader'); await lu(page); await att(150); await page.$eval('#defil', d => { d.scrollTop = d.scrollHeight; }); await cap(page, '26-escalader');
    const t = await page.evaluate(() => window.__tiers.slice(-1)[0]); const txt = await page.$eval('#p-org', o => o.textContent); await fermer(page);
    return t && t.tier === 'complex' && /IA forte/.test(txt) ? 'tier ' + t.tier + ' · IA forte' : false; });
  await geste('600 bouteilles : 3 offres tapées dans le champ du pouce → relu → 6 offres', async () => {
    await ouvrir(page, '600 bouteilles');
    for (const l of ['Bouteilles33.ch (exemple) : 0,70/bt livrée, 600 pile', 'Brouwland (exemple) : 0,65 €/bt, douane ?', 'Vetropack : 0,62/bt, livraison 60 CHF']) { await page.click('#pied-org input'); await page.type('#pied-org input', l); await page.click('#a-plus'); await att(120); }
    await lu(page); await att(200); await cap(page, '22-six-organise');
    await clicTexte(page, '.a-gocmp', 'Comparer'); await att(200); await cap(page, '23-six-comparer');
    await page.$eval('#cmp-defil', d => { d.scrollTop = 560; }); await cap(page, '24-six-cote-a-cote');
    const m = await page.evaluate(() => ({ n: document.querySelectorAll('.a-tab.rangs tbody tr').length, w: document.querySelector('#cmp-defil').scrollWidth <= 390, g: window.__p4amelio.modele().gagnants }));
    await page.evaluate(() => window.__p4amelio.fermerCmp()); await att(80);
    await ouvrir(page, '600 bouteilles'); await page.click('#t-notes'); await att(150); await cap(page, '28-mes-notes'); await page.click('#t-org'); await att(100); await fermer(page);
    sortie.mesures.six = m; return m.n === 6 && m.w ? '6 lignes, sans défilement horizontal · gagnants ' + JSON.stringify(m.g) : false; });
}
/* planches de trois captures à 390, pour les ouvrir côte à côte */
const P = await browser.newPage(); await P.setViewport({ width: 1190, height: 844, deviceScaleFactor: 1 });
const pngs = fs.readdirSync(CAP).filter(f => /^[0-9].*[.]png$/.test(f)).sort();
for (let i = 0; i < pngs.length; i += 3) {
  const g = pngs.slice(i, i + 3), html = '<body style="margin:0;background:#555;display:flex;gap:10px">' + g.map(f => '<figure style="margin:0;width:390px"><img style="width:390px;height:844px;display:block" src="data:image/png;base64,' + fs.readFileSync(path.join(CAP, f)).toString('base64') + '"></figure>').join('') + '</body>';
  await P.setContent(html, { waitUntil: 'load' }); await P.screenshot({ path: path.join(CAP, 'planche-' + String(i / 3 + 1).padStart(2, '0') + '.png') });
}
await P.close();
fs.writeFileSync(path.join(CAP, 'resultats.json'), JSON.stringify(sortie, null, 1));
await page.close(); browser.disconnect();
console.log('GESTES', sortie.gestes.filter(g => g.ok).length + '/' + sortie.gestes.length, '· ERREURS PAGE', sortie.erreursPage.length);
sortie.gestes.forEach(g => console.log((g.ok ? 'OK ' : 'KO ') + g.nom + ' — ' + g.detail));
console.log(JSON.stringify(sortie.mesures));
if (APRES) { const P = Object.entries(sortie.controles).filter(([, v]) => v.petites.length), C = Object.entries(sortie.controles).filter(([, v]) => v.coupes.length);
  console.log('CIBLES < 44 :', P.length ? P.map(([k, v]) => k + ' ' + v.petites.join(' ; ')).join(' | ') : 'aucune'); console.log('TEXTES COUPÉS :', C.length ? C.map(([k, v]) => k + ' ' + v.coupes.join(' ; ')).join(' | ') : 'aucun'); }
if (sortie.erreursPage.length) console.log(sortie.erreursPage.slice(0, 5).join('\n'));
