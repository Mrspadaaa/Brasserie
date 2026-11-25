// Banc du jouable v7 : Chrome de débug (9222), son propre onglet, 390 × 844 DPR 2, window.claude simulé (réponses écrites à la main).
// node cap.mjs [repos|gestes|sansia|malt4|tout]
import fs from 'node:fs';
import { createRequire } from 'node:module';
const puppeteer = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json')('puppeteer-core');
const M = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-25-carnet-document/jouable/';
const CAP = M + 'cap-v7/'; fs.mkdirSync(CAP, { recursive: true });
const OUTJ = new URL('./resultat.json', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const PHASE = process.argv[2] || 'tout';
const IDX = JSON.parse(fs.readFileSync(M + 'reponses-v7/index.json', 'utf8'));
const REP = {}, AIDE = {};
for (const t in IDX) { REP[t] = JSON.parse(fs.readFileSync(M + 'reponses-v7/' + IDX[t].rep, 'utf8')).reponse; if (IDX[t].aide) AIDE[t] = JSON.parse(fs.readFileSync(M + 'reponses-v7/' + IDX[t].aide, 'utf8')); }
const SLUG = {}; for (const t in IDX) SLUG[t] = IDX[t].rep.replace('.json', '');
const res = fs.existsSync(OUTJ) ? JSON.parse(fs.readFileSync(OUTJ, 'utf8')) : {};
const attendre = ms => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
const page = await browser.newPage();
const erreurs = [];
page.on('pageerror', e => erreurs.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') erreurs.push('console: ' + m.text()); });
try {
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  await page.evaluateOnNewDocument((REP, AIDE) => {
    window.__prompts = []; window.__journal = [];
    const db = { collection: () => ({ add: d => { window.__journal.push(d); return Promise.resolve({ id: 'x' }); } }) };
    const sample = (p, o) => Promise.resolve({ text: 'Réponse simulée.' });
    sample.json = async (prompt) => {
      window.__prompts.push(prompt);
      const t = (prompt.match(/^Carnet : (.*)$/m) || [])[1] || '';
      const ko = JSON.parse(localStorage.getItem('sim-ko') || '[]');
      await new Promise(r => setTimeout(r, 40));
      if (ko.some(k => t.indexOf(k) >= 0)) throw { code: 'upstream_error' };
      if (/^Tu aides un brasseur/.test(prompt)) return JSON.parse(JSON.stringify(AIDE[t] || { items: [] }));
      if (!REP[t]) throw { code: 'upstream_error' };
      return JSON.parse(JSON.stringify(REP[t]));
    };
    window.claude = { use: n => Promise.resolve(n === 'sample' ? sample : n === 'db' ? db : null) };
  }, REP, AIDE);
  const URL0 = 'file:///' + M + 'm4b-v7.html';
  async function neuf(ko) {
    await page.goto(URL0); await page.evaluate(k => { localStorage.clear(); if (k) localStorage.setItem('sim-ko', JSON.stringify(k)); }, ko || null);
    await page.goto(URL0, { waitUntil: 'load' });
    for (let i = 0; i < 100; i++) { const ok = await page.evaluate(() => window.__m4b && __m4b.etat().carnets.every(c => c.org || c.orgErreur)); if (ok) break; await attendre(100); }
    await attendre(200);
  }
  const mesure = () => page.evaluate(() => {
    const H = innerHeight, root = document.getElementById('v-carnet'), words = []; const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
    while ((n = tw.nextNode())) { const el = n.parentElement; if (!n.textContent.trim() || el.closest('.v7-tl .t,[hidden],.m4b-toast')) continue;
      const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      const r = document.createRange(); r.selectNodeContents(n); if (![...r.getClientRects()].some(x => x.width > 0 && x.bottom > 0 && x.top < H)) continue;
      words.push(...n.textContent.split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w))); }
    const inp = document.querySelector('#pied-org input'); if (inp && inp.offsetParent && !inp.value) words.push(...inp.placeholder.split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)));
    const u = document.querySelector('#p-org [data-utile]'), barre = document.querySelector('#v-carnet .m4b-top').getBoundingClientRect().bottom;
    const tronq = [...document.querySelectorAll('#p-org *')].filter(e => e.offsetParent && !e.closest('.v7-tl') && getComputedStyle(e).textOverflow === 'ellipsis' && e.scrollWidth > e.clientWidth + 1).map(e => e.textContent.slice(0, 40));
    const debord = document.documentElement.scrollWidth > innerWidth + 1 || [...document.querySelectorAll('#p-org *')].some(e => { const b = e.getBoundingClientRect(); return e.offsetParent && b.width && (b.right > innerWidth + 1 || b.left < -1); });
    const D = __m4b.modele();
    return { n: words.length, mots: words.join(' '), utileY: u ? Math.round(u.getBoundingClientRect().top) : null, barre: Math.round(barre), sousBarre: u ? Math.round(u.getBoundingClientRect().top - barre) : null, tronq, debord,
      boosters: [...document.querySelectorAll('#p-org [data-booster]')].map(e => e.dataset.booster), heros: (document.querySelector('#p-org .v7-hero .v7-act') || {}).textContent || null };
  });
  const cap = async (nom) => { await attendre(260); await page.screenshot({ path: CAP + nom + '.png' }); return nom; };
  const idDe = t => page.evaluate(t => __m4b.etat().carnets.filter(c => c.titre === t)[0].id, t);
  const ouvrir = async t => { await page.evaluate(i => __m4b.ouvrir(i), await idDe(t)); await attendre(200); };
  const fermer = () => page.evaluate(() => __m4b.fermer());
  const T = n => Object.keys(SLUG).find(t => SLUG[t] === n);
  const clic = async (sel) => { const el = await page.$(sel); if (!el) throw new Error('absent : ' + sel); await el.click(); await attendre(150); };

  if (PHASE === 'repos' || PHASE === 'tout') {
    await neuf();
    const val = await page.evaluate(() => __m4b.etat().carnets.map(c => ({ t: c.titre, fausses: c.org ? c.org.fausses : null, erreurs: c.org ? c.org.erreurs : ['ERREUR ' + (c.orgErreur && c.orgErreur.code)] })));
    res.validation = val;
    res.consigneV7 = await page.evaluate(() => { const p = window.__prompts[0] || ''; return ['"faits"', '"besoin"', '"offre"', '18. "tache"', '21. Coût total'].map(k => k + ':' + (p.indexOf(k) >= 0)); });
    await cap('00-liste');
    res.repos = {};
    for (const t of Object.keys(SLUG).filter(t => SLUG[t] !== 'malt4')) { await ouvrir(t); res.repos[SLUG[t]] = await mesure(); await cap('org-' + SLUG[t]); await fermer(); }
  }
  if (PHASE === 'gestes' || PHASE === 'tout') {
    await neuf(); res.gestes = {};
    const g = async (nom, f) => { try { await f(); res.gestes[nom] = { ok: true, m: await mesure() }; await cap(nom); } catch (e) { res.gestes[nom] = { ok: false, err: String(e.message || e) }; } };
    await ouvrir(T('co2'));
    await g('g01-co2-fait', () => clic('.v7-fait'));
    await fermer(); await ouvrir(T('bar'));
    await g('g02-bar-tard', () => clic('.v7-tard'));
    await fermer(); await ouvrir(T('bouteilles'));
    await g('g03-bouteilles-prendre', () => clic('.v7-prendre'));
    await g('g04-bouteilles-commande', () => clic('[data-act="commander"]'));
    await g('g05-bouteilles-rouvrir', async () => { await clic('[data-act="decommander"]'); await clic('[data-act="rouvrir-choix"]'); });
    await g('g06-bouteilles-colonne', () => clic('.v7-cmp .hd[data-k="C"]'));
    await fermer(); await ouvrir(T('pilsner'));
    await g('g07-pilsner-repos-puis-rouvrir', () => clic('[data-act="rouvrir"]'));
    await fermer(); await ouvrir(T('levure-lente'));
    await g('g08-levure-lente-detail', () => clic('[data-act="detail"]'));
    await fermer(); await ouvrir(T('ecoulement'));
    await g('g09-ecoulement-toucher', () => clic('.v7-p.ok'));
    await g('g10-ecoulement-sa-ligne', () => clic('.v7-bub [data-act="aller"]'));
    await page.evaluate(() => document.querySelector('.m4b-retour') && document.querySelector('.m4b-retour').click()); await attendre(200);
    await g('g11-ecoulement-refus', () => clic('.v7-o.ia .v7-x'));
    await page.evaluate(() => document.querySelectorAll('.m4b-toast').forEach(x => x.remove()));
    await g('g12-ecoulement-aide', async () => { await clic('.v7-aidebtn'); await attendre(250); });
    await g('g13-ecoulement-aide-suite', () => clic('.v7-pile [data-act="aide-suite"]'));
    await g('g14-ecoulement-aide-garde', () => clic('.v7-pile [data-act="aide-garde"]'));
    await page.evaluate(() => document.querySelectorAll('.m4b-toast').forEach(x => x.remove()));
    await g('g15-ecoulement-aide-non', () => clic('.v7-pile [data-act="aide-non"]'));
    await fermer(); await ouvrir(T('cave'));
    await g('g16-cave-coche', () => clic('.v7-l .q'));
    await g('g17-cave-meta', () => clic('[data-act="meta"]'));
    await fermer(); await ouvrir(T('co2'));
    await g('g18-co2-ecrire', async () => { await clic('[data-act="plus-piste"]'); await page.keyboard.type('Fuite au régulateur ?'); await page.keyboard.press('Enter'); await attendre(500); });
    await g('g19-co2-mes-notes', () => clic('#t-notes'));
    await fermer();
  }
  if (PHASE === 'malt4' || PHASE === 'tout') {
    if (PHASE === 'malt4') await neuf();
    res.malt4 = {};
    try {
      await page.evaluate(() => { if (__m4b.etat().courant) __m4b.fermer(); });
      await clic('#nouveau'); await attendre(200);
      await page.focus('#titre'); await page.keyboard.type('ZZ TEST — 50 kg de malt, 4 offres');
      await page.focus('#doc');
      const L = ['Malterie A : 1.90/kg, sac de 25 kg, livraison 30 CHF', 'Moulin B : 1.75/kg, 100 kg min, livraison offerte', 'Brouwland : 2.10/kg, livraison 15 CHF', 'Voisin brasseur : 1.50/kg, 40 kg seulement'];
      for (let i = 0; i < L.length; i++) { await page.keyboard.type(L[i]); if (i < L.length - 1) await page.keyboard.press('Enter'); }
      await attendre(200); await cap('g20-malt4-mes-notes');
      await clic('#t-org'); await attendre(900);
      res.malt4 = { m: await mesure(), fausses: await page.evaluate(() => { const c = __m4b.etat().carnets.filter(c => c.id === __m4b.etat().courant)[0]; return c.org ? [c.org.fausses, c.org.erreurs] : ['pas rangé', c.orgErreur]; }) };
      await cap('g21-malt4-organise');
      await clic('.v7-prendre'); res.malt4.prendre = await mesure(); await cap('g22-malt4-prendre');
    } catch (e) { res.malt4.err = String(e.message || e); }
  }
  if (PHASE === 'sansia' || PHASE === 'tout') {
    const KO = ['assurance', 'cave', 'bouteilles', 'co2', 'chaudiere', 'citra'];
    await neuf(KO.map(T)); res.sansia = {};
    for (const k of KO) { await ouvrir(T(k)); res.sansia[k] = await mesure(); await cap('sansia-' + k); await fermer(); }
    await ouvrir(T('cave'));
    try { await clic('.v7-li[data-n="1"]'); res.sansia.toucher = await mesure(); await cap('sansia-cave-toucher'); } catch (e) { res.sansia.toucherErr = String(e.message); }
    await fermer();
  }
} finally {
  res.erreurs = (res.erreurs || []).concat(erreurs.map(e => PHASE + ' ' + e)).slice(-30);
  fs.writeFileSync(OUTJ, JSON.stringify(res, null, 1));
  await page.close(); browser.disconnect();
}
console.log('fini', PHASE, 'erreurs', erreurs.length);
