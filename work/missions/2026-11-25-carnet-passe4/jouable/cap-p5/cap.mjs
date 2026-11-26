// Jouable passe 5 : gestes et captures. Chrome 9222, onglet propre, 390 × 844, DPR 2 ; page.close() puis disconnect().
// window.claude simulé : réponses de jouable/reponses (p4) + surcouche p5 ci-dessous (DONNEES.md, gestes neufs). node .../jouable/cap-p5/cap.mjs
import puppeteer from 'puppeteer-core';
import fs from 'fs'; import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url';
const ICI = path.dirname(fileURLToPath(import.meta.url)), J = path.dirname(ICI), CAP = ICI;
const URL5 = pathToFileURL(path.join(J, 'p5.html')).href;
const index = JSON.parse(fs.readFileSync(path.join(J, 'reponses/index.json'), 'utf8'));
const lr = f => JSON.parse(fs.readFileSync(path.join(J, 'reponses', f), 'utf8'));
const REP = {}, AIDES = {}, APRES = {};
for (const [t, f] of Object.entries(index)) { REP[t] = lr(f.reponse); if (f.aide) AIDES[t] = lr(f.aide); APRES[t] = (f.apres || []).map(a => ({ si: a.si, rep: lr(a.reponse) })); }
const T = b => Object.keys(REP).find(t => t.includes(b));
/* surcouche p5 : résumés de DONNEES.md (ce que l'IA simulée écrit), dates de tâche de ses fixtures */
const RES = { 'trop de vapeur': 'Achat du condenser', 'odeur de soufre': 'Lot 14 à resentir', 'frigo de garde': '480 CHF ou neuf ?', 'CO2 qui baisse': 'Raccord changé', 'Embouteillage': 'du 1.5 au 1.7.2027', 'Houblons citra': 'Dur à obtenir', 'écoulement': 'Devis attendu', 'inspection': 'Fusible 6,3 A', 'ranger la cave': 'Mémo · tâche', 'assurance': 'Police au 31.12', 'fête de la bière': 'Budget 1 500 CHF' };
for (const [b, r] of Object.entries(RES)) REP[T(b)].resume = r;
REP[T('inspection')].etatPropose = 'note';
/* les dates de tâche de ses fixtures (23.11, 30.11) ne sont pas dans ses lignes : le contrôle de la page les retirerait ; on garde celles de ses lignes */
const E = T('écoulement'), base = REP[E];
/* ses notes disent « l’entreprise X (exemple) pour un sanitaire » : l’IA simulée ne renomme pas l’entreprise */
base.options.forEach(o => { if (/sanitaire X/i.test(o.qui || '')) o.qui = 'entreprise X'; });
const lect = (mot, type) => ({ ligne: 'auto', mot, type });
const ec1 = JSON.parse(JSON.stringify(base));
ec1.options = [{ emoji: '', titre: 'Moi-même', qui: 'toi', cout: '9 CHF', source: 'notes', ligne: 'auto', citation: 'Joint 9 CHF', conseille: true }, { emoji: '', titre: 'Devis Entreprise X', qui: 'entreprise X', cout: '185 CHF', source: 'notes', ligne: 'auto', citation: '185 CHF', conseille: false }];
ec1.tache = { emoji: '', titre: 'Changer le joint du siphon', quand: 'samedi', ligne: 'auto', citation: 'je le change moi-même samedi' }; ec1.manque = [];
ec1.lectures = base.lectures.concat([lect('Devis reçu', 'devis'), lect('185 CHF', 'montant'), lect('Joint 9 CHF', 'montant')]); ec1.resume = 'Joint 9 CHF retenu ?';
const ec2 = JSON.parse(JSON.stringify(ec1)); ec2.etatPropose = 'resolu'; ec2.resolu = { question: 'La flaque n’est pas revenue' }; ec2.lectures = ec1.lectures.concat([lect('Plus de flaque', 'piste')]);
APRES[E] = [{ si: 'Plus de flaque', rep: ec2 }, { si: 'Joint 9 CHF', rep: ec1 }];
const V = T('trop de vapeur'), v1 = JSON.parse(JSON.stringify(REP[V]));
v1.tache = { emoji: '', titre: 'Acheter le Brewtools (B)', quand: 'fin du mois', ligne: 'auto', citation: 'Je le prends fin du mois' }; v1.lectures = v1.lectures.concat([lect('de nouveau en stock', 'piste'), lect('fin du mois', 'date')]);
APRES[V] = [{ si: 'Condenseur B de nouveau', rep: v1 }];
/* 600 bouteilles : six offres quand il en note trois de plus */
const B6 = T('600 bouteilles'), b6 = JSON.parse(JSON.stringify(REP[B6]));
b6.comparaison.articles.push(
  { nom: 'Bouteilles33.ch', ligne: 'auto', citation: 'Bouteilles33.ch', valeurs: [{ texte: '0.70/bt', source: 'notes' }, { texte: '× 600', source: 'notes' }, { texte: 'comprise', source: 'notes' }, { texte: '420 CHF', source: 'ia', detail: '600 × 0.70' }] },
  { nom: 'Brouwland', ligne: 'auto', citation: 'Brouwland', valeurs: [{ texte: '0.65/bt', source: 'notes' }, { texte: '× 600', source: 'notes' }, { texte: '?', source: 'ia' }, { texte: '≈ 390 CHF', source: 'ia', detail: '600 × 0.65' }] },
  { nom: 'Vetropack', ligne: 'auto', citation: 'Vetropack', valeurs: [{ texte: '?', source: 'ia' }, { texte: '?', source: 'ia' }, { texte: '?', source: 'ia' }, { texte: '?', source: 'ia' }] });
b6.comparaison.gagnant = [2, null, null, 1]; b6.comparaison.compromis = 'Fournisseur B livre les 600 pour 410 CHF ; Brouwland ≈ 390 sans la livraison.';
APRES[B6] = [{ si: 'Vetropack', rep: b6 }];
/* Chambre froide : deux liens lus (fixture c78) */
const c78 = JSON.parse(fs.readFileSync(path.resolve(J, '../../../../tests/fixtures/c78/chambre-froide-releve.json'), 'utf8'));
const idLien = u => { let x = 5381; for (let i = 0; i < u.length; i++) x = (Math.imul(x, 33) + u.charCodeAt(i)) >>> 0; return 'u' + x.toString(16); };
const FAITS = ['Volume', 'Dimensions du produit', 'Dimensions intérieures (L x P x H)', 'Largeur de l\'unité', 'Hauteur de la porte', 'Largeur de la porte', 'Température', 'Performance', 'Fluide frigorigène', 'Épaisseur de l\'isolation', 'Couleur'];
const chf = c => (c / 100).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const LIENS = {}, arts = c78.carnet.carnet.articles;
arts.forEach(a => { LIENS[idLien(a.url)] = { url: a.url, titre: a.nom, lu: '2026-11-25T21:08:00.000Z', dispo: a.dispo, prix: [{ quantite: 1, unite: 'pièce', prix: a.prixCentimes / 100, devise: 'CHF' }], faits: [{ label: 'Prix TTC', valeur: chf(a.prixCentimes) + ' CHF' }].concat(FAITS.map(k => ({ label: k, valeur: a.valeurs[k].valeur }))) }; });
const crit = ['💰 Prix CHF TTC', '🧮 Prix au m³', '📦 Dispo'].concat(FAITS.map(k => k.replace(' (L x P x H)', '')));
const vol = a => parseFloat(a.valeurs.Volume.valeur.replace(',', '.'));
const REPCF = { pistes: [], options: [], tache: null, echeance: null, periode: null, chiffres: [], liste: [], retenir: [], manque: [], attention: [], relecture: null, lectures: [], emoji: '', categorie: { nom: 'Brasserie', sous: 'Froid' }, priorite: 'normale', resume: '2,6 ou 4,06 m³ ?', etatPropose: 'cherche', genre: 'achat',
  comparaison: { criteres: crit, articles: arts.map((a, i) => ({ nom: a.valeurs.Volume.valeur, ligne: i + 1, citation: a.url.replace('https://www.', ''), valeurs: [{ texte: chf(a.prixCentimes) + ' CHF', source: 'lien' }, { texte: Math.round(a.prixCentimes / 100 / vol(a)) + ' CHF/m³', source: 'ia', detail: chf(a.prixCentimes) + ' / ' + a.valeurs.Volume.valeur.replace(' m³', '') }, { texte: a.dispo, source: 'lien' }].concat(FAITS.map(k => ({ texte: a.valeurs[k].valeur, source: 'lien' }))) })),
    gagnant: [1, 0, null, 0].concat(FAITS.slice(1).map(() => null)), compromis: 'Le 2,6 m³ coûte 289,77 CHF de moins ; le 4,06 m³ donne 56 % de place en plus pour un prix au m³ plus bas.' } };
REP['ZZ TEST — Chambre froide'] = REPCF; APRES['ZZ TEST — Chambre froide'] = [];

const sortie = { gestes: [], erreursPage: [], mesures: {} };
const attendre = ms => new Promise(r => setTimeout(r, ms));
const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
async function nouvelle(panne) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: false });
  page.on('pageerror', e => sortie.erreursPage.push(String(e.message || e)));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_|Failed to load/.test(m.text())) sortie.erreursPage.push('console : ' + m.text()); });
  await page.evaluateOnNewDocument((REP, AIDES, APRES, LIENS, panne) => {
    if (!sessionStorage.getItem('p5-propre')) { localStorage.clear(); sessionStorage.setItem('p5-propre', '1'); }
    window.__journal = []; window.__panne = panne; window.__tiers = []; window.__demandes = [];
    const sample = { json: async (prompt, opt) => {
      window.__tiers.push((opt && opt.modelTier) || 'défaut');
      await new Promise(r => setTimeout(r, window.__delai || 40));
      if (window.__panne) throw { code: 'upstream_error' };
      const t = (prompt.match(/\nCarnet : (.*)\n/) || [])[1], aide = /^Tu aides/.test(prompt);
      let r = aide ? AIDES[t] : REP[t];
      if (!aide && APRES[t]) { const v = APRES[t].find(a => prompt.includes(a.si)); if (v) r = v.rep; }
      if (!r) throw { code: 'empty_completion' };
      const out = JSON.parse(JSON.stringify(r)), L = prompt.split('\n').filter(l => /^\d+: /.test(l));
      const fix = o => { if (Array.isArray(o)) o.forEach(fix); else if (o && typeof o === 'object') { if (o.ligne === 'auto') { const k = L.findIndex(l => l.includes(o.citation || o.mot)); o.ligne = k >= 0 ? +L[k].split(':')[0] : null; } Object.values(o).forEach(fix); } };
      fix(out); return out;
    } };
    const db = { collection: n => ({ add: async d => { window.__journal.push(d); }, doc: id => ({ set: async d => { window.__demandes.push(Object.assign({ id, col: n }, d)); } }),
      onSnapshot: cb => { if (n === 'liens') setTimeout(() => cb({ docs: Object.entries(LIENS).map(([id, x]) => ({ id, exists: true, data: () => x })) }), 30); } }) };
    window.claude = { use: async n => (n === 'sample' ? sample : n === 'db' ? db : null) };
  }, REP, AIDES, APRES, LIENS, panne);
  await page.goto(URL5, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  return page;
}
async function lu(page) { for (let i = 0; i < 200; i++) { const f = await page.evaluate(() => { const l = window.__p5.lecture(); return !l.lecture && !l.file.length; }); if (f) return; await attendre(100); } }
const ecrire = async (f, buf) => { for (let k = 0; ; k++) { try { fs.writeFileSync(f, buf); return; } catch (e) { if (k >= 4) throw e; await new Promise(r => setTimeout(r, 400)); } } };
const cap = async (page, nom) => ecrire(path.join(CAP, nom + '.png'), await page.screenshot());
async function clicTexte(page, sel, txt) {
  const ok = await page.evaluate((sel, txt) => { const e = [...document.querySelectorAll(sel)].find(x => x.offsetParent !== null && x.textContent.includes(txt)); if (e) { e.scrollIntoView({ block: 'center' }); e.click(); } return !!e; }, sel, txt);
  if (!ok) throw new Error('introuvable : ' + sel + ' « ' + txt + ' »'); await attendre(120);
}
const idDe = (page, b) => page.evaluate(b => window.__p5.etat().carnets.find(c => c.titre.toLowerCase().includes(b.toLowerCase())).id, b);
const ouvrir = async (page, b) => { const id = await idDe(page, b); await page.evaluate(i => window.__p5.ouvrir(i), id); await attendre(200); return id; };
const fermer = async page => { await page.evaluate(() => window.__p5.fermer()); await attendre(100); };
const carnet = (page, id) => page.evaluate(i => { const c = window.__p5.etat().carnets.find(x => x.id === i); return { etat: c.etat, cat: c.cat, org: !!c.org, ret: c.org && c.org.retenus, art: c.org && c.org.artRet, tf: c.org && c.org.tacheFaite, gt: c.org && c.org.garde.tache, av: c.org && c.org.p5avenir, n: c.org && c.org.rep.comparaison && c.org.rep.comparaison.articles.length, err: c.orgErreur }; }, id);
async function geste(nom, f) { try { const d = await f(); sortie.gestes.push({ nom, ok: d !== false && d !== undefined, detail: d === false ? 'contrôle faux' : String(d) }); } catch (e) { sortie.gestes.push({ nom, ok: false, detail: String(e.message || e) }); } }
async function ajouter(page, t) { await page.focus('#pied-org input'); await page.keyboard.type(t); await page.keyboard.press('Enter'); await attendre(150); await lu(page); await attendre(150); }
const bas = page => page.evaluate(() => { const v = document.querySelector('.vue.on'), d = v.querySelector('#defil,#liste'), kids = [...d.querySelectorAll(':scope > *, :scope > * > *')].filter(e => e.offsetParent); const b = Math.max(...kids.map(e => e.getBoundingClientRect().bottom)); return Math.round(d.getBoundingClientRect().bottom - b); });
const deborde = page => page.evaluate(() => [...document.querySelectorAll('.vue.on *')].filter(e => { const r = e.getBoundingClientRect(); return r.width && r.right > 391 && getComputedStyle(e).position !== 'fixed' && !e.closest('.p5-cacw,.p5-classe,.p5-sous'); }).map(e => e.className).slice(0, 5));

let page = await nouvelle(false); await lu(page);
await geste('Liste au repos : 15 carnets, arbre catégorie › sous-catégorie, n° = priorité', async () => {
  await cap(page, '01-liste');
  const r = await page.evaluate(() => ({ n: document.getElementById('liste-n').textContent, cats: [...document.querySelectorAll('.p5-cat-l b')].map(x => x.textContent), rangs: [...document.querySelectorAll('.p5-r .n')].slice(0, 7).map(x => x.textContent).join(''), oeil: document.getElementById('oeil').textContent, ad: document.getElementById('p5-adecider').textContent, af: document.getElementById('n-afaire').textContent }));
  sortie.mesures.liste = r; return r.n === '15' ? 'Carnets ' + r.n + ' · ' + r.cats.join(' / ') + ' · rangs ' + r.rangs + ' · ' + r.oeil + ' · ' + r.ad + ' · À faire ' + r.af : false;
});
await geste('Ranger en glissant : Inspection électrique (filtre notés) → Brasserie › Brassage', async () => {
  await clicTexte(page, '#oeil .p5-et', 'notés'); await cap(page, '02-filtre-notes');
  const id = await idDe(page, 'inspection');
  const a = await page.$eval(`.p5-r[data-id="${id}"]`, e => { const b = e.getBoundingClientRect(); return { x: b.left + 200, y: b.top + b.height / 2 }; });
  const t = await page.$eval('.p5-ss[data-sous="Brassage"]', e => { const b = e.getBoundingClientRect(); return { x: b.left + 120, y: b.top + b.height / 2 }; });
  await page.mouse.move(a.x, a.y); await page.mouse.down(); await attendre(520);
  for (let i = 1; i <= 12; i++) { await page.mouse.move(a.x, a.y + (t.y - a.y) * i / 12); await attendre(30); }
  await attendre(100); await cap(page, '03-glisse');
  const pill = await page.$eval(`.p5-r[data-id="${id}"] .pill`, e => e.textContent);
  await page.mouse.up(); await attendre(250); await cap(page, '04-range');
  const c = await carnet(page, id); await clicTexte(page, '#p5-filtre .p5-fx', '✕');
  return c.cat && c.cat.sous === 'Brassage' ? 'pastille « ' + pill + ' » → ' + c.cat.nom + ' › ' + c.cat.sous : false;
});
await geste('Noter vite : écrit dans le carnet visé (Trop de vapeur), puis note rangée', async () => {
  await page.focus('#noter'); await page.keyboard.type('Condenseur B de nouveau en stock aux États-Unis. Je le prends fin du mois.'); await attendre(250);
  await cap(page, '05-noter');
  const vise = await page.$eval('.p5-dans', e => e.textContent);
  await page.click('#nouveau'); await attendre(100); await lu(page); await attendre(300); await cap(page, '06-rangee');
  const f = await page.$$eval('.m4b-feuille .p5-chl', r => r.length);
  await clicTexte(page, '.m4b-feuille .p5-b.plein', 'Tout accepter'); await attendre(150);
  const id = await idDe(page, 'trop de vapeur'), L = await page.evaluate(i => window.__p5.lignesDe(i).slice(-1)[0], id);
  return /Condenseur B/.test(L) && /vapeur/i.test(vise) ? 'écrit dans « ' + vise + ' » · ' + f + ' changements proposés, acceptés' : false;
});
await geste('À faire, tous les carnets (v01) : cocher avec Annuler', async () => {
  await page.click('#tab-afaire'); await attendre(150); await cap(page, '17-afaire');
  const gr = await page.$$eval('.p5-gr', r => r.map(x => x.textContent).join(' | '));
  await page.evaluate(() => document.querySelector('.p5-af .rond').click()); await attendre(150); await cap(page, '17b-afaire-coche');
  const t = await page.$eval('.m4b-toast', e => e.textContent); await page.click('.m4b-toast-a'); await attendre(100);
  await page.click('#tab-afaire'); await attendre(100);
  return /Fait/.test(t) ? gr + ' · « ' + t + ' »' : false;
});
const idE = await ouvrir(page, 'écoulement');
await geste('Organisé (v04) : tuiles, trouvé / pas trouvé, chemin, pour régler', async () => {
  await cap(page, '07-organise'); sortie.mesures.organiseBas = await bas(page); sortie.mesures.deborde = await deborde(page);
  return await page.evaluate(() => [...document.querySelectorAll('#p-org .p5-tu .lab')].map(x => x.textContent).join(' / '));
});
await geste('Changé par l’IA (v05) : décocher une lecture, garder', async () => {
  await page.click('#p5-tampon'); await attendre(150); await cap(page, '08-change');
  const n = await page.$$eval('.m4b-feuille .p5-chl .p5-cb.on', r => r.length);
  await page.evaluate(() => { const b = [...document.querySelectorAll('.m4b-feuille .p5-chl')].filter(r => r.querySelector('button.p5-cb')); (b.find(r => /Le problème/.test(r.textContent)) || b.slice(-1)[0]).querySelector('button.p5-cb').click(); });
  const t = await page.$eval('.m4b-feuille .p5-acts .plein', e => e.textContent); await page.click('.m4b-feuille .p5-acts .plein'); await attendre(150);
  const off = await page.evaluate(i => window.__p5.etat().carnets.find(c => c.id === i).org.lecturesOff.length, idE);
  return off === 1 ? n + ' cochés → « ' + t + ' », 1 lecture coupée' : false;
});
await geste('Mes notes (v04) : on écrit, l’IA lit (carte Arrêter), Organisé suit', async () => {
  await page.click('#t-notes'); await attendre(150);
  await page.evaluate(() => { window.__delai = 1500; const d = document.getElementById('doc'); d.focus(); const r = document.createRange(); r.selectNodeContents(d); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); });
  await page.keyboard.press('Enter'); await page.keyboard.type('Flaque encore ce matin après le rinçage (exemple).'); await attendre(100); await cap(page, '09-notes-ecrit');
  await page.evaluate(() => document.getElementById('doc').blur()); await page.click('#t-org'); await attendre(400); await cap(page, '10-ia-lit');
  const lit = await page.$eval('#p-org', e => e.textContent.includes('L’IA lit'));
  await page.evaluate(() => { window.__delai = 40; }); await lu(page); await attendre(200);
  return lit ? 'carte « L’IA lit » vue, puis relu' : false;
});
await geste('Sa ligne retrouvée : l. 2 › ouvre Mes notes sur la ligne', async () => {
  await clicTexte(page, '#p-org .p5-tu.ok .so', 'l. 2'); await attendre(300); await cap(page, '11-notes-ligne');
  return await page.evaluate(() => document.getElementById('v-carnet').getAttribute('data-vue')) === 'notes' ? 'Mes notes, ligne 2 surlignée' : false;
});
await geste('Décider (v01) : devis 185 CHF ou moi-même 9 CHF, Retenir, tâche gardée puis cochée', async () => {
  await page.click('#t-org'); await attendre(150);
  await ajouter(page, 'Devis reçu de l’entreprise X : 185 CHF, pose comprise (exemple).');
  await ajouter(page, 'Joint 9 CHF chez Brico, je le change moi-même samedi (exemple).');
  await cap(page, '12-decider');
  await clicTexte(page, '#p-org .p5-dc', 'Moi-même'); await attendre(200); await cap(page, '13-retenu');
  await clicTexte(page, '#p-org .p5-prop .p5-b', 'Garder'); await attendre(150);
  await clicTexte(page, '#p-org .p5-tache .p5-cb', ''); await attendre(150); await cap(page, '14-tache-faite');
  const c = await carnet(page, idE); return c.ret && c.ret.length && c.tf ? 'retenu ' + JSON.stringify(c.ret) + ' · état ' + c.etat + ' · tâche cochée' : false;
});
await geste('Résoudre sur preuve (v01) puis Résolu', async () => {
  await ajouter(page, 'Plus de flaque après 2 nettoyages (exemple).'); await cap(page, '15-resoudre');
  await clicTexte(page, '#p-org .p5-resoudre .p5-b.plein', 'Résolu'); await attendre(200); await cap(page, '16-resolu');
  return (await carnet(page, idE)).etat === 'resolu' ? 'Résolu' : false;
});
await fermer(page);
const idB = await ouvrir(page, '600 bouteilles');
await geste('Options (O-options-a) puis 6 offres et Comparer (figé 17.11)', async () => {
  await cap(page, '18-options-3');
  await ajouter(page, 'Bouteilles33.ch : 0.70/bt livrée par 600 (exemple).');
  await ajouter(page, 'Brouwland : 0.65/bt par 600, douane ? (exemple)');
  await ajouter(page, 'Vetropack : demander un prix (exemple).');
  await cap(page, '19-options-6');
  const n = (await carnet(page, idB)).n;
  await clicTexte(page, '#p-org .p5-b.plein', 'Comparer les'); await attendre(200); await cap(page, '20-comparer');
  await page.$eval('#defil', d => { d.scrollTop = d.scrollHeight; }); await attendre(100); await cap(page, '21-comparer-bas');
  return n === 6 ? '6 offres, Comparer ouvert' : false;
});
await geste('Article ouvert (h01-6), Choisir, choisi (v09-3), envoyer dans À venir (h05-9)', async () => {
  await page.$eval('#defil', d => { d.scrollTop = 0; }); await clicTexte(page, '.p5-rk .l', 'Fournisseur B'); await attendre(200); await cap(page, '22-article');
  await clicTexte(page, '#p-org .p5-b.plein', 'Choisir'); await attendre(200); await cap(page, '23-choisi');
  await clicTexte(page, '#p-org .p5-b.plein', 'Envoyer dans À venir'); await attendre(150);
  await fermer(page); await page.click('#p5-avenir-t'); await attendre(150); await cap(page, '24-avenir');
  await page.evaluate(() => document.querySelector('.m4b-voile').click());
  const c = await carnet(page, idB); return c.art && c.art.length && c.av ? 'choisi ' + JSON.stringify(c.art) + ', dans À venir' : false;
});
const idC = await ouvrir(page, 'chambre froide');
await geste('Chambre froide : 2 articles lus, Comparer 17 lignes, Relire un lien', async () => {
  await cap(page, '25-chambre-org');
  await clicTexte(page, '#p-org .p5-b.plein', 'Comparer les'); await attendre(200); await cap(page, '26-chambre-comparer');
  await page.$eval('#defil', d => { d.scrollTop = 520; }); await attendre(100); await cap(page, '27-chambre-comparer-milieu');
  await page.$eval('#defil', d => { d.scrollTop = 0; }); await clicTexte(page, '.p5-cac th button', '2,6'); await attendre(200);
  await clicTexte(page, '.p5-src .p5-b', 'Relire'); await attendre(150); await cap(page, '28-article-relire');
  const d = await page.evaluate(() => window.__demandes.filter(x => x.type === 'relire').length), lignes = await page.$$eval('.p5-cac tr', r => r.length).catch(() => 0);
  return d === 1 ? 'demandes/<id> type relire écrit · puce « en lecture »' : false;
});
await geste('Escalader à l’IA : relecture avec modelTier complex, tampon « IA forte »', async () => {
  await page.evaluate(() => { const p = window.__p5.vueC(); }); await clicTexte(page, '.p5-src .p5-b', 'Escalader'); await lu(page); await attendre(200);
  await page.evaluate(() => { document.querySelector('.p5-retour') && document.querySelector('.p5-retour').click(); }); await attendre(150); await cap(page, '29-ia-forte');
  const t = await page.evaluate(() => window.__tiers.slice(-1)[0]), tp = await page.$eval('#p5-tampon', e => e.textContent);
  return t === 'complex' && /IA forte/.test(tp) ? 'modelTier ' + t + ' · tampon « ' + tp.trim() + ' »' : false;
});
await fermer(page);
await ouvrir(page, 'levure lente');
await geste('Relecture « pourquoi » (v03) sur un résolu', async () => { await cap(page, '30-relecture'); return await page.$eval('#p-org', e => /Pourquoi/.test(e.textContent) ? 'carte Pourquoi' : false); });
await fermer(page); await ouvrir(page, 'assurance');
await geste('Mémo (v02) : rien à faire, ses lignes, autres mémos', async () => { await cap(page, '31-memo'); return await page.$eval('#p-org', e => /Mémo/.test(e.textContent) && /TES LIGNES/.test(e.textContent) ? 'mémo' : false); });
await fermer(page);
await geste('Glisser repos (S-ranger-repos) : liste après les gestes', async () => { await cap(page, '32-liste-apres'); return 'capture'; });
await page.close();

page = await nouvelle(true); await lu(page);
const idE2 = await ouvrir(page, 'écoulement');
await geste('L’IA n’a pas pu lire (v01) : lignes gardées, lu sans l’IA, Réessayer', async () => {
  await cap(page, '33-ia-echec');
  const t = await page.$eval('#p-org', e => e.textContent);
  await page.evaluate(() => { window.__panne = false; }); await clicTexte(page, '#p-org .p5-b.plein', 'Réessayer'); await lu(page); await attendre(200); await cap(page, '34-reessaye');
  const c = await carnet(page, idE2); return /n’a pas pu lire/.test(t) && c.org ? 'erreur montrée, puis lu au 2e essai' : false;
});
await page.close();
browser.disconnect();
fs.writeFileSync(path.join(CAP, 'resultats.json'), JSON.stringify(sortie, null, 1));
const ok = sortie.gestes.filter(g => g.ok).length;
console.log('GESTES ' + ok + '/' + sortie.gestes.length + ' · ERREURS PAGE ' + sortie.erreursPage.length);
sortie.gestes.forEach(g => console.log((g.ok ? 'OK ' : 'KO ') + g.nom + ' — ' + g.detail.slice(0, 220)));
sortie.erreursPage.slice(0, 5).forEach(e => console.log('ERR ' + e.slice(0, 200)));
console.log(JSON.stringify(sortie.mesures));
