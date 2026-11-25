// Jouable passe 4 : gestes, cas et mesures. Chrome de débug 9222, onglet propre, 390 × 844, dsf 2 ; page.close() puis disconnect().
// window.claude simulé : sample.json rend la réponse écrite à la main (reponses/index.json) du carnet nommé dans la consigne.
// node work/missions/2026-11-25-carnet-passe4/jouable/cap.mjs
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const CAP = path.join(ICI, 'cap');
const URL_P4 = pathToFileURL(path.join(ICI, 'p4.html')).href;
const index = JSON.parse(fs.readFileSync(path.join(ICI, 'reponses/index.json'), 'utf8'));
const REP = {}, AIDES = {}, APRES = {};
for (const [t, f] of Object.entries(index)) { REP[t] = JSON.parse(fs.readFileSync(path.join(ICI, 'reponses', f.reponse), 'utf8')); if (f.aide) AIDES[t] = JSON.parse(fs.readFileSync(path.join(ICI, 'reponses', f.aide), 'utf8')); if (f.apres) APRES[t] = f.apres.map(a => ({ si: a.si, rep: JSON.parse(fs.readFileSync(path.join(ICI, 'reponses', a.reponse), 'utf8')) })); }
const sortie = { gestes: [], cas: [], liste: null, erreursPage: [] };
const attendre = ms => new Promise(r => setTimeout(r, ms));
const slug = t => t.replace(/^ZZ TEST\s*—\s*/, '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32);

const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
async function nouvelle(panne) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  page.on('pageerror', e => sortie.erreursPage.push(String(e.message || e)));
  page.on('console', m => { if (m.type() === 'error') sortie.erreursPage.push('console : ' + m.text()); });
  await page.evaluateOnNewDocument((REP, AIDES, APRES, panne) => {
    if (!sessionStorage.getItem('p4-propre')) { localStorage.clear(); sessionStorage.setItem('p4-propre', '1'); }
    window.__journal = []; window.__panne = panne; window.__consignes = {};
    const sample = { json: async (prompt) => {
      await new Promise(r => setTimeout(r, window.__delai || 40));
      if (window.__panne) throw { code: 'upstream_error' };
      const t = (prompt.match(/\nCarnet : (.*)\n/) || [])[1];
      const aide = /^Tu aides/.test(prompt);
      if (!aide) window.__consignes[t] = prompt;
      let r = aide ? AIDES[t] : REP[t];
      if (!aide && APRES[t]) { const v = APRES[t].find(a => prompt.includes(a.si)); if (v) r = v.rep; }
      if (!r) throw { code: 'empty_completion' };
      const out = JSON.parse(JSON.stringify(r)), L = prompt.split('\n').filter(l => /^\d+: /.test(l));
      const fix = o => { if (Array.isArray(o)) o.forEach(fix); else if (o && typeof o === 'object') { if (o.ligne === 'auto') { const k = L.findIndex(l => l.includes(o.citation || o.mot)); o.ligne = k >= 0 ? +L[k].split(':')[0] : null; } Object.values(o).forEach(fix); } };
      fix(out); return out;
    } };
    const db = { collection: () => ({ add: async d => { window.__journal.push(d); } }) };
    window.claude = { use: async n => (n === 'sample' ? sample : n === 'db' ? db : null) };
  }, REP, AIDES, APRES, panne);
  await page.goto(URL_P4, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  return page;
}
async function lu(page) {
  for (let i = 0; i < 150; i++) {
    const f = await page.evaluate(() => { const l = window.__p4.lecture(); return !l.lecture && !l.file.length; });
    if (f) return; await attendre(100);
  }
}
const cap = (page, nom) => page.screenshot({ path: path.join(CAP, nom + '.png') });
const clic = (page, sel) => page.$eval(sel, e => e.click());
async function clicTexte(page, sel, txt) {
  const ok = await page.evaluate((sel, txt) => { const e = [...document.querySelectorAll(sel)].find(x => x.offsetParent !== null && x.textContent.includes(txt)); if (e) e.click(); return !!e; }, sel, txt);
  if (!ok) throw new Error('introuvable : ' + sel + ' « ' + txt + ' »');
}
const idDe = (page, bout) => page.evaluate(b => window.__p4.etat().carnets.find(c => c.titre.includes(b)).id, bout);
const ouvrir = async (page, bout) => { const id = await idDe(page, bout); await page.evaluate(i => window.__p4.ouvrir(i), id); await attendre(150); return id; };
const fermer = async page => { await page.evaluate(() => window.__p4.fermer()); await attendre(80); };
async function geste(nom, f) {
  try { const d = await f(); sortie.gestes.push({ nom, ok: d !== false, detail: d === false ? 'contrôle faux' : (d || '') }); }
  catch (e) { sortie.gestes.push({ nom, ok: false, detail: String(e.message || e) }); }
}
function mesure() {
  const carnet = document.getElementById('v-carnet');
  const barre = carnet.querySelector('.m4b-top').getBoundingClientRect().bottom, H = window.innerHeight;
  let mots = 0; const vus = [];
  const w = document.createTreeWalker(carnet, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) {
    const t = n.textContent; if (!t.trim()) continue;
    const el = n.parentElement; if (!el || el.closest('#tete-titre') || el.closest('[hidden]')) continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const r = document.createRange(); r.selectNodeContents(n);
    if (![...r.getClientRects()].some(b => b.width > 0 && b.height > 0 && b.bottom > barre && b.top < H)) continue;
    const k = t.split(/\s+/).filter(x => /[\p{L}\p{N}]/u.test(x)).length; mots += k; if (k) vus.push(t.trim());
  }
  const inp = carnet.querySelector('#pied-org:not([hidden]) input');
  if (inp && !inp.value) { const k = inp.placeholder.split(/\s+/).filter(x => /[\p{L}\p{N}]/u.test(x)).length; mots += k; vus.push('[' + inp.placeholder + ']'); }
  const sel = ['.p4-courbe', '.p4-var', '.p4-jetons', '.p4-chf', '.p4-dec', '.p4-face', '.p4-cmp', '.p4-jauge', '.p4-ech', '.m4b-per', '.p4-pq', '.p4-lus', '.p4-band', '.p4-manque', '.m4b-liste', '.p4-conseil', '.p4-att', '.m4b-carte', '.p4-svf'];
  const ys = [...document.querySelectorAll(sel.map(s => '#p-org ' + s).join(','))].map(e => e.getBoundingClientRect().top).sort((a, b) => a - b);
  const pleins = [...carnet.querySelectorAll('.p4-go,.m4b-btn.plein')].filter(e => e.offsetParent !== null).length;
  const defil = document.getElementById('defil');
  const enfants = [...document.querySelectorAll('#p-org > *')].filter(e => e.offsetParent !== null), bas = Math.max(barre, ...enfants.map(e => e.getBoundingClientRect().bottom));
  const act = document.getElementById('action'), haut = (act.hidden ? document.getElementById('pied-org') : act).getBoundingClientRect().top;
  return { mots, utile: ys.length ? Math.round(ys[0] - barre) : null, pleins, deborde: defil.scrollHeight > defil.clientHeight + 4, vide: Math.round(haut - bas), ample: document.getElementById('p-org').classList.contains('ample'), vus };
}

/* ===== A : exemples lus par l'IA simulée ===== */
let page = await nouvelle(false);
await lu(page);
await cap(page, '01-liste');
sortie.liste = await page.evaluate(() => {
  const l = document.getElementById('liste').getBoundingClientRect();
  const rows = [...document.querySelectorAll('#liste .p4-r')].map(r => r.getBoundingClientRect()).filter(b => b.top >= l.top - 1 && b.bottom <= l.bottom + 1);
  return { lignes: rows.length, part: Math.round(rows.reduce((s, b) => s + b.height, 0) / l.height * 100), hauteurListe: Math.round(l.height) };
});
await geste('Liste : 19 carnets rangés, arbre domaine › sous-domaines', async () => {
  const r = await page.evaluate(() => ({ n: window.__p4.etat().carnets.length, lus: window.__p4.etat().carnets.filter(c => c.org).length, dn: [...document.querySelectorAll('.p4-dn')].map(d => d.textContent.slice(0, 60)) }));
  return r.n === 19 && r.lus === 19 ? r.lus + '/19 lus · ' + r.dn.join(' | ') : false;
});
await page.$eval('#liste', l => { l.scrollTop = l.scrollHeight; }); await attendre(80); await cap(page, '02-liste-bas'); await page.$eval('#liste', l => { l.scrollTop = 0; });
await geste('Filtre « cherche » puis replier un domaine sous filtre', async () => {
  await clic(page, '#oeil .cherche'); await attendre(80); await cap(page, '03-filtre-cherche');
  const avant = await page.$$eval('#liste .p4-r', r => r.length);
  await clicTexte(page, '.p4-dn .pli', 'Brasserie'); await attendre(80); await cap(page, '04-filtre-replie');
  const apres = await page.$$eval('#liste .p4-r', r => r.length);
  await clicTexte(page, '.p4-dn .pli', 'Brasserie'); await clic(page, '#oeil .cherche'); await attendre(80);
  return apres < avant ? avant + ' lignes → ' + apres + ' après repli' : false;
});
await geste('Ranger dans… d’un toucher (Bar du Centre → Brasserie), toast Annuler', async () => {
  const id = await idDe(page, 'Bar du Centre');
  await page.$eval(`.p4-r[data-id="${id}"] .p4-r-em`, e => e.click()); await attendre(100); await cap(page, '05-ranger-feuille');
  await clicTexte(page, '.m4b-feuille .m4b-puce-c', '🍺 Brasserie'); await attendre(120); await cap(page, '06-range-toast');
  const cat = await page.evaluate(i => window.__p4.etat().carnets.find(c => c.id === i).cat, id);
  return cat && cat.nom === 'Brasserie' ? 'rangé : ' + cat.nom : false;
});
await geste('À faire : ligne de temps, décision sur place + Annuler, cocher + Annuler', async () => {
  await clic(page, '#tab-afaire'); await attendre(100); await cap(page, '07-afaire');
  const t07 = await page.$('.m4b-toast');
  const fr = await idDe(page, 'frigo de garde');
  await clicTexte(page, '.p4-deci .duo button', '480'); await attendre(120); await cap(page, '08-afaire-decide');
  const r1 = await page.evaluate(i => window.__p4.etat().carnets.find(c => c.id === i).org.retenus.slice(), fr);
  await clic(page, '.m4b-toast-a'); await attendre(120); await cap(page, '09-afaire-annule');
  const r2 = await page.evaluate(i => window.__p4.etat().carnets.find(c => c.id === i).org.retenus.slice(), fr);
  await clic(page, '.p4-afr .case'); await attendre(120); await cap(page, '10-afaire-coche');
  await clic(page, '.m4b-toast-a'); await attendre(80);
  await clic(page, '#tab-carnets'); await attendre(80);
  return r1.length === 1 && r2.length === 0 && !t07 ? 'aucun toast du rangement sur À faire ; retenu [' + r1 + '] puis annulé []' : false;
});
/* ===== chaque exemple : Organisé, mesures ===== */
const titres = await page.evaluate(() => window.__p4.etat().carnets.map(c => ({ id: c.id, titre: c.titre })));
for (const t of titres) {
  await page.evaluate(i => window.__p4.ouvrir(i), t.id); await attendre(150);
  const s = slug(t.titre);
  await cap(page, 'org-' + s + '-1');
  const m = await page.evaluate(mesure);
  if (m.deborde) { await page.$eval('#defil', d => { d.scrollTop = d.scrollHeight; }); await attendre(60); await cap(page, 'org-' + s + '-2'); }
  const v = await page.evaluate((i, rep) => { const c = window.__p4.etat().carnets.find(x => x.id === i); const r = window.__p4.valider(rep, window.__p4.lignesDe(i), window.__p4.pagesDe(i)); return { erreurs: r.erreurs, fausses: r.fausses, consigne: (window.__consignes[c.titre] || '').length }; }, t.id, REP[t.titre]);
  sortie.cas.push({ titre: t.titre, capture: 'org-' + s + '-1' + (m.deborde ? ' (+ -2)' : ''), mots: m.mots, utile: m.utile, pleins: m.pleins, vide: m.vide, ample: m.ample, vus: m.vus, ...v });
  await fermer(page);
}
/* ===== gestes dans un carnet ===== */
await geste('Toucher un jeton → sa ligne surlignée, puis Revenir', async () => {
  await ouvrir(page, 'écoulement qui fuit');
  await clicTexte(page, '.p4-jeton', 'joint'); await attendre(150); await cap(page, '20-jeton-ligne');
  const surl = await page.$eval('#doc .surl', e => e.textContent).catch(() => null);
  await clic(page, '.m4b-retour'); await attendre(120); await cap(page, '21-revenir');
  const vue = await page.$eval('#v-carnet', e => e.getAttribute('data-vue'));
  return surl && vue === 'org' ? 'surligné : « ' + surl.slice(0, 50) + ' » ; retour Organisé' : false;
});
await geste('Retenir « toi » + Annuler', async () => {
  await clicTexte(page, '.p4-face .p4-ret', 'retenir'); await attendre(120); await cap(page, '22-retenir-toast');
  const a22 = await page.$eval('#action', e => e.hidden ? '' : e.innerText.replace(/\s+/g, ' '));
  const e1 = await page.evaluate(() => window.__p4.etat().carnets.find(c => c.id === window.__p4.etat().courant).etat);
  await clic(page, '.m4b-toast-a'); await attendre(120); await cap(page, '23-retenir-annule');
  const e2 = await page.evaluate(() => window.__p4.etat().carnets.find(c => c.id === window.__p4.etat().courant).etat);
  return e1 === 'decide' && e2 === 'cherche' && /Changer le joint/.test(a22) && !/Contacter/.test(a22) ? 'état decide → cherche ; pouce après Retenir : « ' + a22 + ' »' : false;
});
await geste('Action sous le pouce : fait, puis Annuler', async () => {
  await clic(page, '#action .p4-go'); await attendre(120); await cap(page, '24-action-fait');
  const a24 = await page.$eval('#action', e => e.hidden ? '' : e.innerText.replace(/\s+/g, ' '));
  const f = await page.evaluate(() => window.__p4.etat().carnets.find(c => c.id === window.__p4.etat().courant).org.tacheFaite);
  await clic(page, '.m4b-toast-a'); await attendre(100);
  const g = await page.evaluate(() => window.__p4.etat().carnets.find(c => c.id === window.__p4.etat().courant).org.tacheFaite);
  return f === true && g === false && a24 && !/Contacter/.test(a24) ? 'tâche faite puis rétablie ; pouce après Fait : « ' + a24 + ' »' : false;
});
await geste('Aide : feuille ✓ ☐ 💡, Garder, Non merci', async () => {
  await clic(page, '.m4b-aidebtn'); await attendre(250); await cap(page, '25-aide');
  const n0 = await page.$$eval('.m4b-feuille .p4-ai', x => x.length);
  await clicTexte(page, '.m4b-feuille .p4-ai .m4b-btn', 'Garder'); await attendre(150); await cap(page, '26-aide-garde');
  await clicTexte(page, '.m4b-feuille .p4-ai .m4b-btn', 'Non merci'); await attendre(150); await cap(page, '27-aide-non-merci');
  await clicTexte(page, '.m4b-feuille .p4-ai .m4b-btn', 'Garder'); await attendre(150); await cap(page, '28-aide-fin');
  const r = await page.evaluate(() => { const c = window.__p4.etat().carnets.find(c => c.id === window.__p4.etat().courant); return { miens: c.miens.map(m => m.type + ':' + m.texte), refus: c.refus.slice(), feuille: !!document.querySelector('.m4b-feuille') }; });
  return n0 === 3 && r.miens.length === 2 && r.refus.some(x => /aide/.test(x)) && !r.feuille ? '3 proposées → gardées ' + r.miens.join(', ') + ' ; refusée ' + r.refus.join(', ') : false;
});
await geste('« + » : ajouter une piste depuis Organisé, elle arrive dans Mes notes', async () => {
  await clic(page, '.p4-jeton.plus'); await page.type('#pied-org input', 'Bonde bouchée'); await page.keyboard.press('Enter'); await lu(page); await attendre(150); await cap(page, '29-plus-piste');
  await clic(page, '#t-notes'); await attendre(120); await cap(page, '30-mes-notes-ajout');
  const l = await page.evaluate(() => window.__p4.lignesDe(window.__p4.etat().courant));
  await clic(page, '#t-org'); await lu(page); await attendre(100);
  return l.includes('Piste : Bonde bouchée') ? 'ligne ' + l.length + ' : « Piste : Bonde bouchée »' : false;
});
await geste('Écrire depuis Organisé : « prix du joint ? » → Noter', async () => {
  await clicTexte(page, '.p4-manque .p4-noter', 'Noter'); await page.type('#pied-org input', '6 CHF au magasin'); await attendre(60); await cap(page, '31-noter-saisie');
  await page.evaluate(() => { window.__delai = 4000; }); await page.keyboard.press('Enter'); await attendre(250);
  const loc = await page.evaluate(() => ({ cell: [...document.querySelectorAll('.p4-face .p4-c.note')].map(e => e.innerText.replace(/\s+/g, ' ')).join('|'), manque: [...document.querySelectorAll('.p4-manque')].map(e => e.innerText.replace(/\s+/g, ' ')).join('|') }));
  await cap(page, '32a-noter-local');
  await lu(page); await page.evaluate(() => { window.__delai = 0; }); await attendre(150); await cap(page, '32-noter-fait');
  const ia = await page.evaluate(() => ({ cell: [...document.querySelectorAll('.p4-face .p4-c')].map(e => e.innerText.replace(/\s+/g, ' ')).join('|'), manque: document.querySelectorAll('.p4-manque').length }));
  const l = await page.evaluate(() => window.__p4.lignesDe(window.__p4.etat().courant));
  return l.includes('prix du joint : 6 CHF au magasin') && /6 CHF/.test(loc.cell) && !/Noter/.test(loc.manque) && /6 CHF/.test(ia.cell) && !ia.manque ? 'tout de suite : case « ' + loc.cell + ' », manque « ' + loc.manque + ' » ; après l’IA : « ' + ia.cell + ' », 0 manque' : (() => { throw new Error('KO : ' + JSON.stringify({ loc, ia, l: l.slice(-2) })); })();
});
await geste('⋯ puis feuille « Changé par l’IA »', async () => {
  await clic(page, '#k-menu'); await attendre(100); await cap(page, '33-menu');
  await clicTexte(page, '.m4b-feuille .m4b-mi', 'Changé par l’IA'); await attendre(120); await cap(page, '34-change-ecoulement');
  const n = await page.$$eval('.m4b-feuille .m4b-ch', x => x.length);
  await page.evaluate(() => document.querySelector('.m4b-voile').click()); await fermer(page);
  return n > 0 ? n + ' cases' : false;
});
await geste('Décider (frigo) : Retenir au pouce, toast, Annuler', async () => {
  await ouvrir(page, 'frigo de garde'); await cap(page, '40-decider');
  await clic(page, '#action .p4-b[aria-label^="Retenir"]'); await attendre(120); await cap(page, '41-decider-retenu');
  const a41 = await page.$eval('#action', e => e.hidden ? '' : e.innerText.replace(/\s+/g, ' '));
  const r1 = await page.evaluate(() => window.__p4.etat().carnets.find(c => c.id === window.__p4.etat().courant).org.retenus.slice());
  await clic(page, '.m4b-toast-a'); await attendre(120); await cap(page, '42-decider-annule');
  const r2 = await page.evaluate(() => window.__p4.etat().carnets.find(c => c.id === window.__p4.etat().courant).org.retenus.slice());
  await clic(page, '#action .p4-b[aria-label^="Retenir"]'); await attendre(100);
  await clic(page, '#action .p4-go'); await attendre(100); await cap(page, '41b-decider-fait'); const a41b = await page.$eval('#action', e => e.hidden ? '' : e.innerText.replace(/\s+/g, ' '));
  await clic(page, '#action .p4-go'); await attendre(100); await cap(page, '41c-decider-regle'); const a41c = await page.$eval('#action', e => e.hidden ? '' : e.innerText.replace(/\s+/g, ' '));
  const e41 = await page.evaluate(() => window.__p4.etat().carnets.find(c => c.id === window.__p4.etat().courant).etat);
  await clic(page, '#action .p4-go'); await attendre(80); await fermer(page);
  return r1.length === 1 && !r2.length && /Réparer/.test(a41) && /Réglé/.test(a41b) && /Rouvrir/.test(a41c) && e41 === 'resolu' ? 'retenu ' + r1 + ', annulé ; pouce : « ' + a41 + ' » → fait : « ' + a41b + ' » → réglé : « ' + a41c + ' »' : false;
});
await geste('L’IA se trompe (chaudière « Décidé ») : il coupe dans « Changé par l’IA »', async () => {
  await ouvrir(page, 'Chaudière'); await cap(page, '43-chaudiere-ia-decide');
  const e1 = await page.evaluate(() => window.__p4.etat().carnets.find(c => c.id === window.__p4.etat().courant).etat);
  await clic(page, '.p4-chg'); await attendre(120); await cap(page, '44-change-chaudiere');
  await page.evaluate(() => { const r = [...document.querySelectorAll('.m4b-feuille .m4b-ch')].find(x => x.textContent.includes('État')); r.querySelector('.m4b-sw').click(); });
  await attendre(60); await cap(page, '45-change-coupe');
  await clicTexte(page, '.m4b-feuille .m4b-btn.plein', 'Garder'); await attendre(120); await cap(page, '46-chaudiere-corrige');
  const e2 = await page.evaluate(() => { const c = window.__p4.etat().carnets.find(c => c.id === window.__p4.etat().courant); return { etat: c.etat, refus: c.refus.slice(), fausses: c.org.fausses }; });
  await fermer(page);
  return e1 === 'decide' && e2.etat === 'note' ? 'decide → note ; refus ' + e2.refus.join(', ') + ' ; citations fausses retirées ' + e2.fausses : false;
});
await geste('Achat (citra) : écarter un article, Annuler ; choisir', async () => {
  await ouvrir(page, 'Houblons citra');
  await page.evaluate(() => document.querySelector('.p4-art .p4-x').click()); await attendre(120); await cap(page, '47-citra-ecarte');
  const a = await page.evaluate(() => window.__p4.etat().carnets.find(c => c.id === window.__p4.etat().courant).org.artEcart.slice());
  await clic(page, '.m4b-toast-a'); await attendre(100);
  await clic(page, '.p4-art .p4-ret[aria-label^="Choisir"]'); await attendre(120); await cap(page, '48-citra-choisi');
  const a48 = await page.$eval('#action', e => e.hidden ? '' : e.innerText.replace(/\s+/g, ' '));
  const c48 = await page.evaluate(() => ({ variete: !!document.querySelector('.p4-var'), prix: [...document.querySelectorAll('.p4-cmp .p4-c')].map(e => e.innerText.replace(/\s+/g, ' ')).filter(t => /3,72/.test(t)).join('|'), toast: !!document.querySelector('.m4b-toast') }));
  const b = await page.evaluate(() => window.__p4.etat().carnets.find(c => c.id === window.__p4.etat().courant).org.artRet.slice());
  await fermer(page);
  return a.length === 1 && b.length === 1 && /Commander/.test(a48) && !/Brau/.test(a48) && c48.variete && /3,72 € \?/.test(c48.prix) && c48.toast ? 'écarté ' + a + ' (annulé), choisi ' + b + ' ; pouce : « ' + a48 + ' » ; prix « ' + c48.prix + ' » ; variété au-dessus' : false;
});
await geste('Échéance (assurance) : cocher une pièce', async () => {
  await ouvrir(page, 'assurance'); const t49 = await page.$('.m4b-toast'); await clic(page, '.m4b-li .c'); await attendre(100); await cap(page, '49-assurance-coche');
  const n = await page.evaluate(() => Object.keys(window.__p4.etat().carnets.find(c => c.id === window.__p4.etat().courant).org.coches).length);
  await fermer(page); return n === 1 && !t49 ? '1/3 ; le toast « Choisi » de Citra n’a pas suivi' : false;
});
await geste('Relecture (malt) : Toujours le bon choix ? Oui', async () => {
  await ouvrir(page, 'malt pilsner'); await clic(page, '#action .p4-b[aria-label^="Oui"]'); await attendre(100); await cap(page, '50-malt-oui');
  const b = await page.evaluate(() => window.__p4.etat().carnets.find(c => c.id === window.__p4.etat().courant).org.bonChoix);
  await fermer(page); return b === 'oui' ? 'oui' : false;
});
await geste('Comparaison (600) : couronne au seul total complet qui couvre le besoin ; livraison inconnue marquée', async () => {
  await ouvrir(page, '600 bouteilles');
  const r = await page.evaluate(() => ({ win: [...document.querySelectorAll('.p4-cmp .p4-c.win')].map(e => e.innerText.replace(/\s+/g, ' ')), liv: [...document.querySelectorAll('.p4-cmp .p4-c')].filter(e => /🚚/.test(e.innerText)).map(e => e.innerText.replace(/\s+/g, ' ')), court: document.querySelectorAll('.p4-cmp .p4-c.court').length }));
  await fermer(page);
  return r.win.length === 1 && /410/.test(r.win[0]) && r.liv.some(t => /504/.test(t)) && r.court === 1 ? 'couronne : « ' + r.win[0] + ' » ; ' + r.liv.join(', ') + ' ; 1 offre qui ne couvre pas 600' : false;
});
await geste('Ligne cassée (soufre) : jamais en carte de tête, gardée dans Mes notes', async () => {
  await ouvrir(page, 'odeur de soufre');
  const r = await page.evaluate(() => ({ att: [...document.querySelectorAll('#p-org .p4-att')].map(e => e.innerText).join('|'), tete: (document.querySelector('#p-org > :nth-child(2)') || {}).className, notes: window.__p4.lignesDe(window.__p4.etat().courant).some(l => /fût\.EST/.test(l)) }));
  await fermer(page);
  return !/fût\.EST/.test(r.att) && r.notes ? 'aucune carte « fût.EST » ; tête : ' + r.tete + ' ; ligne gardée dans Mes notes' : false;
});
await geste('Période (embouteillage) : « auj. » avant le début', async () => {
  await ouvrir(page, 'Embouteillage');
  const r = await page.evaluate(() => { const b = document.querySelector('.m4b-per .bar b').getBoundingClientRect(), u = document.querySelector('.m4b-per .bar u').getBoundingClientRect(), du = document.querySelector('.p4-per-lb .du').getBoundingClientRect(), aj = document.querySelector('.p4-per-lb .auj'); return { u: Math.round(u.left), b: Math.round(b.left), du: Math.round(du.right), auj: aj ? Math.round(aj.getBoundingClientRect().left) : null }; });
  await fermer(page);
  return r.u < r.b - 100 && r.auj != null && r.auj < r.b && Math.abs(r.du - r.b) < 4 ? 'repère auj. à ' + r.u + ' px, début de la barre à ' + r.b + ' px, date de début finit à ' + r.du + ' px' : false;
});
await geste('Hors ligne : l’Organisé lu reste, daté ; la note règle la tâche (proposé) ; l’IA confirme au retour', async () => {
  await ouvrir(page, 'Levure récoltée');
  await page.setOfflineMode(true); await attendre(100);
  await clic(page, '#t-notes'); await attendre(80);
  await page.evaluate(() => { const d = document.getElementById('doc'); d.focus(); const r = document.createRange(); r.selectNodeContents(d); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); });
  await page.keyboard.press('Enter'); await page.keyboard.type('Starter lancé ce soir');
  await clic(page, '#t-org'); await attendre(150); await cap(page, '62-hors-ligne');
  const h62 = await page.evaluate(() => ({ lu: !!document.querySelector('#p-org .p4-chf, #p-org .p4-courbe, #p-org .p4-jetons'), band: (document.querySelector('.p4-band.hors') || {}).innerText || '', prop: !!document.querySelector('#action .p4-go.prop'), att: window.__p4.etat().carnets.find(c => c.id === window.__p4.etat().courant).attente }));
  await page.setOfflineMode(false); await attendre(300); await lu(page); await attendre(150); await cap(page, '63-retour-reseau');
  const h63 = await page.evaluate(() => ({ starter: [...document.querySelectorAll('.p4-jeton.oui')].some(e => /starter/.test(e.innerText)), action: document.getElementById('action').innerText.replace(/\s+/g, ' ') }));
  const l = await page.evaluate(() => window.__p4.lignesDe(window.__p4.etat().courant));
  await fermer(page);
  return h62.lu && /lu .*relira/.test(h62.band.replace(/\s+/g, ' ')) && h62.prop && h62.att && h63.starter && /Ensemencer/.test(h63.action) && l.includes('Starter lancé ce soir') ? 'hors ligne : lecture gardée, « ' + h62.band.replace(/\s+/g, ' ') + ' », starter proposé fait ; au retour : jeton starter ✓, pouce « ' + h63.action + ' »' : false;
});
await geste('« + » liste : noter un carnet neuf depuis la liste', async () => {
  await page.type('#noter', 'Commander des capsules 26 mm'); await clic(page, '#nouveau'); await lu(page); await attendre(150); await cap(page, '51-noter-liste');
  return await page.evaluate(() => { const c = window.__p4.etat().carnets.find(c => /capsules/.test(c.html)); return c ? (c.orgErreur ? 'créé, IA : ' + c.orgErreur.code : 'créé') : false; });
});
sortie.journal = await page.evaluate(() => window.__journal.length);
await page.close();

/* ===== B : IA en erreur, puis hors ligne ===== */
page = await nouvelle(true);
await lu(page);
await geste('IA en erreur : ce que lit l’app seule, Réessayer au pouce', async () => {
  await ouvrir(page, 'écoulement qui fuit'); await cap(page, '60-ia-erreur');
  const m = await page.evaluate(mesure);
  sortie.cas.push({ titre: 'IA en erreur (écoulement)', capture: '60-ia-erreur', mots: m.mots, utile: m.utile, pleins: m.pleins, vus: m.vus, erreurs: [], fausses: 0 });
  const lus = await page.$$eval('.p4-lu b', x => x.map(e => e.textContent));
  await page.evaluate(() => { window.__panne = false; }); await clic(page, '#action .p4-go'); await lu(page); await attendre(150); await cap(page, '61-reessaye-ok');
  const ok = await page.evaluate(() => !!window.__p4.etat().carnets.find(c => c.id === window.__p4.etat().courant).org);
  return ok ? 'lu sans IA : ' + lus.join(', ') + ' ; Réessayer → rangé' : false;
});
await page.close();
browser.disconnect();
fs.writeFileSync(path.join(CAP, 'resultats.json'), JSON.stringify(sortie, null, 1));
const ok = sortie.gestes.filter(g => g.ok).length;
console.log('GESTES', ok + '/' + sortie.gestes.length);
sortie.gestes.filter(g => !g.ok).forEach(g => console.log('  KO', g.nom, '—', g.detail));
console.log('LISTE', JSON.stringify(sortie.liste));
for (const c of sortie.cas) console.log(String(c.mots).padStart(3), 'mots', String(c.utile).padStart(4), 'px', String(c.vide).padStart(4), 'vide', c.ample ? 'ample' : '     ', c.pleins, 'plein', c.fausses ? c.fausses + ' fausse(s)' : '', c.titre.replace('ZZ TEST — ', '').slice(0, 38), c.erreurs && c.erreurs.length ? '· ' + c.erreurs.join(' | ').slice(0, 140) : '');
console.log('ERREURS PAGE', sortie.erreursPage.length, sortie.erreursPage.slice(0, 5).join(' || '));
