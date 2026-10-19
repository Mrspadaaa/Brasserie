// Lot 18 · l5 et l6 : les données communes de q2b (c1.json), des fiches (base v4.9) et du jeu v3 duo.
// Aucun chiffre recopié à la main : tout vient de donnees/c1.json, du pack (pack-mini-protos.json),
// de la base (base/consolide/fiche.html, objet D : fichesH, court, roue, direction) et de
// fils17-standard (planche v3, jetons-familles.json). Les règles de q2b (generateur-q2b.mjs) sont
// reprises telles quelles : groupes au même effet, meilleure voie, verdicts, zones, niveaux.
import fs from 'node:fs';
import path from 'node:path';

export const REPO = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie';
export const E1 = REPO + '/work/refonte-frontend/v4/ecran-1';
export const C = JSON.parse(fs.readFileSync(E1 + '/fils15-s5-complexe/donnees/c1.json', 'utf8'));
export const PACK = JSON.parse(fs.readFileSync(REPO + '/prototypes/houblons-v4/data/pack-mini-protos.json', 'utf8'));
export const J = JSON.parse(fs.readFileSync(E1 + '/fils17-standard/jetons-familles.json', 'utf8'));
const basePage = fs.readFileSync(E1 + '/base/consolide/fiche.html', 'utf8');
const i0 = basePage.indexOf('const D = ');
export const DB = JSON.parse(basePage.slice(i0 + 10, basePage.indexOf('\n', i0)).trim().replace(/;$/, ''));

// ---------- jeu v3 duo (lucide-react 1.39.0 et pictos des familles) ----------
const PL = fs.readFileSync(E1 + '/fils17-standard/v3/planche.html', 'utf8');
export const SYM = {};
for (const m of PL.matchAll(/<symbol id="([^"]+)"[^>]*>([\s\S]*?)<\/symbol>/g)) SYM[m[1]] = m[2];
// Compléments lucide-react 1.39.0 (node_modules/lucide-react/dist/esm/icons) : heart, ban, chevron-down.
SYM['i-heart'] = '<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>';
SYM['i-ban'] = '<circle cx="12" cy="12" r="10"/><path d="M4.929 4.929 19.07 19.071"/>';
SYM['i-chev-d'] = '<path d="m6 9 6 6 6-6"/>';
SYM['i-arrow-r'] = '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>';
SYM['i-equal'] = '<line x1="5" x2="19" y1="9" y2="9"/><line x1="5" x2="19" y1="15" y2="15"/>';
const r3 = (x) => Math.round(x * 1000) / 1000;
// Une icône d'action : un seul trait rendu, 1,5 px, quelle que soit sa taille (S4).
export const ico = (id, size = 16, attrs = '') => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${r3(36 / size)}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${attrs ? ' ' + attrs : ''}>${SYM[id]}</svg>`;

export const ORDRE = ['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'stoneFruit', 'pomeFruit', 'berries', 'melon', 'resin', 'spice', 'green'];
export const NOM = { citrus: 'Agrumes', tropical: 'Fruits tropicaux', melon: 'Melon', stoneFruit: 'Fruits à noyau', pomeFruit: 'Fruits à pépins', berries: 'Petits fruits', floral: 'Floral', herbal: 'Herbacé', resin: 'Boisé et résineux', spice: 'Épicé', green: 'Végétal', earthy: 'Terreux' };
export const COURT = DB.court;
// Picto de famille, trait du ton base (ou d'un autre ton de la famille, en thème sombre), 1,5 px rendu.
export const picto = (f, size = 14, o = {}) => `<svg class="pi${o.cls ? ' ' + o.cls : ''}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${o.ton || J[f].base}" stroke-width="${r3(36 / size)}" stroke-linecap="round" stroke-linejoin="round" data-famille="${f}" role="img" aria-label="${NOM[f]}">${SYM['p-' + f]}</svg>`;

// ---------- les règles de q2b ----------
export const OBJ = ['floral', 'citrus', 'resin'];
export const OB = Object.fromEntries(C.objectifs.map((o) => [o.famille, o]));
const BANDE = {}, AVANTS = {};
for (const v of C.voies) for (const t of v.tout) { BANDE[t.famille] = t.bande; if (t.avant != null) AVANTS[t.famille] = t.avant; }
export const AVANT = AVANTS;
export const bande = (f) => BANDE[f] || [0, 30];
export const cran = (f) => (OB[f] ? OB[f].cran : bande(f)[1] === 55 ? 18.3 : 10);
export const DEG = PACK.scenarios.S1.tasting.axes.find((x) => x.family === 'resin').perceivedRange;
export const r1 = (x) => Math.round(x * 10) / 10;
export const pc = (x) => r1(x) + '%';
export const fr = (x) => String(r1(x)).replace('.', ',').replace('-', '−');
export const sg = (x) => (x > 0 ? '+' : '') + fr(x);
export const cl = (x) => Math.max(0, Math.min(100, x));
export const crTxt = (c) => (c > 0 ? '+' : '') + fr(c) + ' cran' + (Math.abs(c) >= 2 ? 's' : '');
export const arr = (c) => (Math.abs(c) < 0.5 ? (c < 0 ? '≈ −' : '≈ +') : (c > 0 ? '+' : '−') + Math.round(Math.abs(c)) + (Math.round(Math.abs(c)) >= 2 ? ' crans' : ' cran'));

// Place du style au-dessus (r) et au-dessous (l) de ma bière, au style (S, 3 crans) et en absolu (A, 50 points).
export function zone(f) {
  if (f === 'resin') return null;
  const a = AVANT[f]; if (a == null) return undefined;
  const [b0, b1] = bande(f), c = cran(f);
  return { rS0: (b1 - a) / c / 3 * 100, lS0: (a - b0) / c / 3 * 100, rA0: (b1 - a) / 50 * 100, lA0: (a - b0) / 50 * 100 };
}
export const viseeS = (f) => (OB[f].visee - OB[f].maBiere.central) / OB[f].cran / 3 * 100;
export const viseeA = (f) => (OB[f].visee - OB[f].maBiere.central) / 50 * 100;

export function niv(v, f, e) {
  if (e < 0) return 'sf';
  let best = null;
  for (const h of v.fiches || []) for (const x of h.familles) if (x.famille === f) best = x.niveau === 'marqué' ? 'mq' : best || 'ci';
  return best || 'sf';
}
export const NIVMOT = { mq: 'marqué dans ses fiches', ci: 'cité par une fiche', sf: 'sans fiche (modèle seul)' };

export const V = C.voies.map((v, i) => {
  const extras = v.tout.filter((t) => !t.visee && Math.abs(t.effet) >= 0.5).sort((a, b) => ORDRE.indexOf(a.famille) - ORDRE.indexOf(b.famille));
  return { n: i + 1, v, extras, hs: new Set((v.horsStyle || []).map((x) => x.family)), hsCr: Object.fromEntries((v.horsStyle || []).map((x) => [x.family, x.crans])) };
});
export const nomVoie = (v) => {
  if (v.levureVers) return { nom: v.levureVers, q: '' };
  if (v.type === 'assemblage') return { nom: v.actions.map((a) => a.houblon).join(' + '), q: '' };
  if (v.type.startsWith('remplacer') || v.type === 'levure') return { nom: v.actions[0].houblon, q: v.actions[0].grammes + ' g' };
  return { nom: v.actions[0].houblon, q: '' };
};
export const momentDe = (v) => (v.levureVers ? 'levure' : v.actions[0].momentId);
export const crOf = (X, f) => { const t = X.v.tout.find((x) => x.famille === f); return t && t.crans != null ? t.crans : null; };
export function meilleure(f, sens) {
  const c = V.filter((X) => X.v.effet[f].etabli && !X.hs.size);
  return c.length ? c.reduce((b, X) => ((sens > 0 ? X.v.effet[f].central > b.v.effet[f].central : X.v.effet[f].central < b.v.effet[f].central) ? X : b)) : null;
}
// Les trois réponses de q2b : la meilleure voie sans sortie du style, son verdict face à la visée.
export function reponses() {
  const fl = meilleure('floral', 1), ci = meilleure('citrus', 1), re = meilleure('resin', -1);
  const vFl = OB.floral.maBiere.central + fl.v.effet.floral.central, vCi = OB.citrus.maBiere.central + ci.v.effet.citrus.central;
  const verd = (f, v) => (v >= OB[f].visee ? 'atteint' : Math.abs(v - OB[f].visee) <= Math.abs(OB[f].maBiere.central - OB[f].visee) / 2 ? 'approche' : 'aucune');
  const dRe = DEG.min + re.v.effet.resin.central <= OB.resin.visee ? 'atteint' : 'aucune';
  return {
    resin: { f: 'resin', titre: 'Moins résineux', verdict: dRe, X: re, effet: re.v.effet.resin.central, apres: DEG.min + re.v.effet.resin.central },
    floral: { f: 'floral', titre: 'Plus floral', verdict: verd('floral', vFl), X: fl, effet: fl.v.effet.floral.central, apres: vFl },
    citrus: { f: 'citrus', titre: 'Plus agrumes', verdict: verd('citrus', vCi), X: ci, effet: ci.v.effet.citrus.central, apres: vCi },
  };
}
export const VERDICT = { atteint: 'Atteint', approche: 'Approche', aucune: 'Aucune' };

// Les groupes de q2b : au même effet sur les objectifs (la barre une fois), puis les gestes.
export function groupes() {
  const g = [];
  for (const X of V) { const k = JSON.stringify(X.v.effet); const x = g.find((y) => y.k === k); if (x) x.voies.push(X); else g.push({ k, voies: [X] }); }
  const sig = (X) => X.extras.map((t) => t.famille).join();
  const memes = g.filter((x) => x.voies.length > 1).map((x) => {
    const ord = []; for (const X of x.voies) if (!ord.includes(X)) ord.push(...x.voies.filter((Y) => sig(Y) === sig(X) && !ord.includes(Y)));
    return { voies: ord, dose: x.voies[0].v.actions[0].grammes + ' g', moment: momentDe(x.voies[0].v) };
  });
  const seuls = new Set(g.filter((x) => x.voies.length === 1).map((x) => x.voies[0].n));
  const gestes = [
    { t: 'Assembler 5 + 5 g', usage: 'arome', mo: 'b10', est: true, voies: [6, 8] },
    { t: 'Remplacer Nugget', usage: 'amer', mo: 'b60', voies: [12, 13, 14] },
    { t: 'Dry hop', usage: 'arome', mo: 'dryActive', est: true, voies: [15] },
    { t: 'Changer de levure', usage: '', mo: 'levure', est: true, voies: [16, 17] },
  ].map((x) => ({ ...x, voies: x.voies.filter((n) => seuls.has(n)).map((n) => V[n - 1]) })).filter((x) => x.voies.length);
  return { memes, gestes };
}

// Usage du houblon selon le moteur (hopRole) : fournisseur, ou règle rôle-α encore à valider.
export const usageDe = (h) => ({ u: h.role || 'inconnu', src: /^fournisseur/.test(h.roleSource || '') ? 'fournisseur' : 'règle' });
export const USAGE_MOT = { amérisant: 'amérisant', aromatique: 'aromatique', double: 'double usage', inconnu: 'usage inconnu' };
export const STOCK_MOT = { suffisant: 'en stock', 'à acheter': 'à acheter', manque: 'stock insuffisant' };
export const STOCK_ICO = { suffisant: 'j-stock', 'à acheter': 'j-achat', manque: 'j-manque' };
// Les moments : le mot écrit (D81) et l'icône v3.
export const MOMENT = {
  b60: { t: '60′', ic: 'j-ebu', lg: 'à 60′' }, b10: { t: '10′', ic: 'j-ebu', lg: 'à 10′' }, wp: { t: 'whirlpool', ic: 'j-whirl', lg: 'au whirlpool' },
  dryActive: { t: 'dry hop actif', court: 'actif', ic: 'j-cuve-a', lg: 'dry hop en fermentation active' }, dryPost: { t: 'dry hop après', court: 'après', ic: 'j-cuve-p', lg: 'dry hop après fermentation' },
  levure: { t: 'levure', ic: 'j-levure', lg: 'levure : toute la fermentation' },
};
// La biotransformation (voie 15) : chaque signal et son statut.
export const bioDe = (X) => (X.v.bio || []).flatMap((h) => h.signaux);
// Ce qui est ajouté à Comparer : les voies 1, 9 et 12 (le brief du lot 18, Comparer).
export const AJOUTEES = [1, 9, 12];
// Couleurs des houblons de la sélection (v3 : Motueka, puis la 5ᵉ teinte pour Nelson Sauvin).
export const COUL_H = { Motueka: '#4a1fd6', 'Nelson Sauvin': '#a0081f' };

// ---------- la fiche g1 (base v4.9, fiche.js) ----------
const ficheParNom = Object.fromEntries(Object.values(DB.fichesH).map((F) => [F.nom, F]));
const cleParNom = Object.fromEntries(Object.entries(DB.fichesH).map(([k, F]) => [F.nom, k]));
export const fiche = (nom) => ficheParNom[nom] || null;
export const nbF = (v) => String(v).replace('.', ',');
export const plageF = (s) => (s.min === s.max ? nbF(s.min) : nbF(s.min) + '–' + nbF(s.max));
export const recente = (arr) => (arr || []).reduce((a, s) => (!a || (s.an || 0) > (a.an || 0) ? s : a), null);
export const ROLE_MOT = { 'amérisant': 'amérisant', aromatique: 'aromatique', double: 'double usage' };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
export { esc };
// Les hôtes de la page : chaque houblon nommé dans une voie, et Nugget (ma recette).
export const HOUBLONS = [...new Set([...C.voies.flatMap((v) => v.actions.map((a) => a.houblon)), 'Nugget'])].filter((n) => fiche(n));

// Le contenu de la fiche, en morceaux que chaque langage compose (HTML) : même contenu que g1.
export function ficheParts(nom, o = {}) {
  const F = fiche(nom), cle = cleParNom[nom];
  const a = recente(F.alpha);
  const txt = a ? plageF(a) + ' %' : F.lot != null ? nbF(F.lot) + ' %' : 'non renseigné';
  const W = 60, x = (v) => 2 + Math.max(0, Math.min(1, v / 25)) * (W - 4);
  const reglette = a ? `<svg class="fi-reg" width="${W}" height="12" viewBox="0 0 ${W} 12" aria-hidden="true"><rect x="2" y="4" width="${W - 4}" height="4" rx="2" fill="${o.regFond || '#e4e4ea'}"/>${F.alpha.map((s) => `<rect x="${r3(x(s.min) - 1)}" y="2" width="${r3(Math.max(3, x(s.max) - x(s.min) + 2))}" height="8" rx="2" fill="${s === a ? (o.regFort || '#3d3d44') : (o.regPale || '#b4b4bc')}"/>`).join('')}${F.lot != null ? `<rect x="${r3(x(F.lot) - 1.5)}" y="0" width="3" height="12" rx="1" fill="${o.regLot || '#16161a'}" stroke="${o.regLotT || '#fff'}" stroke-width="1"/>` : ''}</svg>` : '';
  const alpha = `<span class="fi-alpha" data-role="fiche-alpha" aria-label="Acides alpha ${txt}${a ? ' (' + a.src + (a.an ? ' ' + a.an : '') + ')' : ''}${F.lot != null && a ? ', mon lot ' + nbF(F.lot) + ' %' : ''}"><span class="fi-grec">α</span><b class="fi-aa">${txt}</b>${a && F.lot != null ? `<span class="fi-lot">lot ${nbF(F.lot)} %</span>` : ''}</span>`;
  const role = F.role ? `<span class="fi-role${/^règle/.test(F.role.src || '') ? ' regle' : ''}" aria-label="Rôle : ${ROLE_MOT[F.role.v] || F.role.v}${F.role.src ? ', ' + esc(F.role.src) : ''}">${ROLE_MOT[F.role.v] || F.role.v}</span>` : '';
  const note = /:cryo$/.test(cle || '') ? `<p class="fi-note">α : plages de ${F.nom.replace(/\s*cryo$/i, '')} en pellets ; la fiche du cryo manque.</p>`
    : F.lot != null && F.alpha.length && F.alpha.every((s) => F.lot < s.min || F.lot > s.max) ? `<p class="fi-note">Mon lot ${nbF(F.lot)} % : hors des plages de ses fiches.</p>` : '';
  // La bande des carrés étiquetée, puis une ligne par famille décrite (g1, D72, D73).
  const par = Object.fromEntries(F.aromes.map((x) => [x.f, x]));
  const of = (F.aromes[0] || {}).of || 0;
  const seule = of === 1 ? (F.aromes.find((x) => x.n) || { auteurs: [] }).auteurs[0] : null;
  const decrites = DB.ordre.filter((f) => par[f] && par[f].n > 0), nd = DB.ordre.filter((f) => !par[f] || !par[f].n);
  const caseF = (f, n, sep) => `<i class="fi-c${n >= 2 ? ' m' : n === 1 ? ' ci' : ''}${sep ? ' sep' : ''}" data-famille="${f}" aria-hidden="true"></i>`;
  const bandeC = `<div class="fi-bande" role="img" aria-label="Les familles citées par les fiches de ${esc(F.nom)}"><span class="fi-bande-c">${DB.ordre.map((f, k) => caseF(f, par[f] ? par[f].n : 0, k === DB.attendues.length)).join('')}</span>${seule ? `<span class="fi-seule">1 seule fiche : ${esc(seule)}</span>` : ''}</div>`;
  const lignes = decrites.map((f) => {
    const x = par[f], cpt = x.of === 1 ? '' : x.n + '/' + x.of;
    const prem = x.n === 1 && (x.premier || []).length ? 'nommé en premier' : '';
    const mots = [...new Set((x.mots || []).flatMap((m) => m.mots).map((w) => w.toLowerCase()))];
    return `<div class="fi-lab" data-explique="${f}">${caseF(f, x.n)}<span class="fi-lab-t"><span class="fi-lab-n" style="--t:${o.texte ? o.texte(f) : J[f].texte}">${COURT[f]}</span>${[cpt, prem].filter(Boolean).length ? ' <span class="fi-cpt">' + [cpt, prem].filter(Boolean).join(' · ') + '</span>' : ''}${mots.length ? `<span class="fi-mots">${esc(mots.join(', '))}</span>` : ''}</span></div>`;
  }).join('');
  const sans = F.sansFamille || [];
  const sansP = sans.length ? `<p class="fi-sans">sans famille : ${esc(sans.map((s) => s.mot).join(', '))}</p>` : '';
  const ndP = nd.length ? `<p class="fi-nd">${nd.length} non décrite${nd.length > 1 ? 's' : ''} : ${nd.map((f) => COURT[f]).join(', ')}</p>` : '';
  const lv = Object.fromEntries(F.aromes.map((x) => [x.f, x]));
  const demande = (DB.direction || []).length ? `<p class="fi-dem" data-role="demande">${DB.direction.map((d) => { const x = lv[d.f]; return `<span><b>${d.sens > 0 ? '+ ' : '− '}${COURT[d.f]}</b> ${x && x.n ? (x.of === 1 ? '1 seule fiche' : x.n + '/' + x.of) : 'inconnu'}</span>`; }).join('')}</p>` : '';
  const srcTxt = (s) => s.src + (s.an ? ' ' + s.an : '');
  const rg = (n, v) => `<div class="fi-rg"><span>${esc(n)}</span><b>${esc(v)}</b></div>`;
  const tags = (arr) => `<div class="fi-tags">${arr.map((t) => `<span>${esc(t)}</span>`).join('')}</div>`;
  const SECTIONS = [
    ['styles', 'Styles', F.styles.length ? tags(F.styles) + (F.stylesSrc.length ? `<p class="fi-gris">${esc(F.stylesSrc.join(' ; '))}</p>` : '') : `<p class="fi-gris">${esc(F.stylesRaison || 'non renseigné')}</p>`],
    ['huiles', 'Huiles', (F.huiles.length ? F.huiles.map((s) => rg('totale, ' + srcTxt(s), plageF(s) + ' mL/100 g')).join('') : rg('totale', 'non renseigné')) + F.composants.map((c) => rg(c.nom, c.min != null ? plageF(c) + ' %' + (c.src ? ', ' + c.src : '') : c.raison || 'non renseigné')).join('')],
    ['sources', 'Sources', F.alpha.map((s) => rg('α ' + srcTxt(s), plageF(s) + ' %')).join('') + (F.lot != null ? rg('α mon lot', nbF(F.lot) + ' %') : '') + (F.beta.length ? F.beta.map((s) => rg('β ' + srcTxt(s), plageF(s) + ' %')).join('') : rg('β', 'non renseigné'))
      + `<p class="fi-txt">Origine : ${esc(F.origine || 'non renseigné')}</p>` + F.aromes.filter((x) => x.n > 0).map((x) => `<p class="fi-txt"><b>${COURT[x.f]}${x.of === 1 ? '' : ' ' + x.n + '/' + x.of}</b> ${esc(x.auteurs.join(', ') || 'non renseigné')}</p>`).join('') + (F.desc.length ? tags(F.desc) : '')],
    ['subs', 'Substituts', F.subsCalc && F.subsCalc.length ? tags(F.subsCalc) : F.subs.length ? tags(F.subs) : `<p class="fi-gris">${esc(F.subsRaison || 'non renseigné')}</p>`],
  ];
  return { F, nom: F.nom, alpha, reglette, role, note, bande: bandeC, lignes, sans: sansP, nd: ndP, demande, roue: roueSVG(F, o.roue || {}), sections: SECTIONS };
}

// La roue chiffrée de la fiche (radar.js, roue) : chaque famille au nombre de fiches qui la citent,
// « N/M » sous la famille, une famille non décrite au centre avec un secteur hachuré et « ? » ;
// axes aux couleurs des familles décrites ; ma demande fléchée au bord. Polygone fermé sur 12 axes.
export function roueSVG(F, o = {}) {
  const W = o.W || 330, ROUE = DB.roue.map((r) => r.f), N = ROUE.length, pas = (2 * Math.PI) / N;
  const ENC = o.encre || '#16161a', TXT = o.texte || '#16161a', GRIS = o.gris || '#62626c', GR = o.grille || '#dcdce3', FOND = o.fond || '#fff';
  const lv = Object.fromEntries(F.aromes.map((a) => [a.f, a]));
  const vals = ROUE.map((f) => (lv[f] && lv[f].n ? lv[f].n : null));
  const max = Math.max(2, ...vals.filter((v) => v != null)), min = -0.5;
  const dem = Object.fromEntries((DB.direction || []).map((d) => [d.f, d.sens]));
  const PX = 12, LH = 14, GAP = 8, PAD = 3;
  const larg = (t, gras) => t.length * (gras ? 7.1 : 6.5);
  const lib = ROUE.map((f, k) => {
    const inc = vals[k] == null, cpt = !inc && lv[f].of > 1 ? lv[f].n + '/' + lv[f].of : '';
    const nom = { t: COURT[f] + (inc ? '?' : ''), gras: !!dem[f], fill: inc ? GRIS : TXT };
    const s = Math.abs(Math.sin(k * pas));
    const li = !cpt ? [[nom]] : s > 0.45 ? [[nom], [{ t: cpt, fill: GRIS }]] : [[nom, { t: ' ' + cpt, fill: GRIS }]];
    return { li, w: Math.max(...li.map((l) => l.reduce((x, y) => x + larg(y.t, y.gras), 0))), ecart: dem[f] ? 20 : 0 };
  });
  let R = o.Rmax || 104;
  lib.forEach((l, k) => { const s = Math.abs(Math.sin(k * pas)); if (s > 0.1) R = Math.min(R, (W / 2 - 2 - l.w) / s - GAP - l.ecart); });
  const pos = lib.map((l, k) => {
    const a = k * pas, s = Math.sin(a), c = Math.cos(a), rr = R + GAP + l.ecart, x = s * rr, y = -c * rr, nl = l.li.length;
    const y0 = c > 0.9 ? y - (nl - 1) * LH - 3 : c < -0.9 ? y + 12 : y - ((nl - 1) * LH) / 2 + 4;
    return { x, y0, ancre: Math.abs(s) < 0.1 ? 'middle' : s > 0 ? 'start' : 'end', y1: y0 - 10, y2: y0 + (nl - 1) * LH + 3 };
  });
  const haut = Math.min(-R - 24, ...pos.map((p) => p.y1)), bas = Math.max(R + 24, ...pos.map((p) => p.y2));
  const H = Math.round(bas - haut + 2 * PAD), cx = W / 2, cy = PAD - haut;
  const r = (v) => ((Math.min(max, v) - min) / (max - min)) * R, RC = r(-0.25);
  const P = (k, v) => [cx + Math.sin(k * pas) * (v == null ? RC : r(v)), cy - Math.cos(k * pas) * (v == null ? RC : r(v))];
  const f2 = (x) => Math.round(x * 100) / 100;
  let s = `<svg class="fi-roue" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" data-radar="" data-objet="fiche" data-axes="${ROUE.join(',')}" role="img" aria-label="Silhouette de ${esc(F.nom)} selon ses fiches : ${ROUE.filter((f, k) => vals[k]).map((f) => COURT[f].toLowerCase() + ' ' + (lv[f].of === 1 ? 'une seule fiche' : lv[f].n + ' sur ' + lv[f].of)).join(', ') || 'aucun arôme décrit'} ; les autres familles sont inconnues, pas à zéro">`;
  s += `<defs><pattern id="hach-${o.id || 'r'}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="${FOND}"/><line x1="0" y1="0" x2="0" y2="5" stroke="${GR}" stroke-width="1.6"/></pattern></defs>`;
  // Secteurs hachurés des familles non décrites.
  ROUE.forEach((f, k) => {
    if (vals[k] != null) return;
    const a0 = (k - 0.5) * pas, a1 = (k + 0.5) * pas, p0 = [cx + Math.sin(a0) * R, cy - Math.cos(a0) * R], p1 = [cx + Math.sin(a1) * R, cy - Math.cos(a1) * R];
    s += `<path d="M${f2(cx)},${f2(cy)}L${f2(p0[0])},${f2(p0[1])}A${f2(R)},${f2(R)} 0 0 1 ${f2(p1[0])},${f2(p1[1])}Z" fill="url(#hach-${o.id || 'r'})" data-inconnu="${f}"/>`;
  });
  for (let v = 1; v <= max; v++) s += `<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(r(v))}" fill="none" stroke="${GR}" stroke-width="1"/>`;
  s += `<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(r(0))}" fill="none" stroke="${GR}" stroke-width="1" stroke-opacity=".6"/>`;
  ROUE.forEach((f, k) => { const [x, y] = [cx + Math.sin(k * pas) * R, cy - Math.cos(k * pas) * R]; s += `<line x1="${f2(cx)}" y1="${f2(cy)}" x2="${f2(x)}" y2="${f2(y)}" stroke="${vals[k] != null ? J[f].base : GR}" stroke-width="${vals[k] != null ? 1.5 : 1}"/>`; });
  const pts = ROUE.map((f, k) => P(k, vals[k]));
  s += `<g data-serie="${esc(F.nom)}" data-valeurs="${vals.map((v) => (v == null ? -0.25 : v)).join(',')}" data-inconnues="${ROUE.filter((f, k) => vals[k] == null).join(',')}" data-couleur="${ENC}"><path d="M${pts.map((p) => f2(p[0]) + ',' + f2(p[1])).join('L')}Z" fill="${ENC}" fill-opacity=".16" stroke="${ENC}" stroke-width="2" stroke-linejoin="round"/></g>`;
  ROUE.forEach((f, k) => {
    const v = vals[k]; if (v == null) return;
    const [x, y] = P(k, v);
    s += v >= 2 ? `<circle cx="${f2(x)}" cy="${f2(y)}" r="4.2" fill="${ENC}" stroke="${FOND}" stroke-width="1.5"/>` : `<circle cx="${f2(x)}" cy="${f2(y)}" r="3.6" fill="${FOND}" stroke="${ENC}" stroke-width="1.6"/>`;
  });
  // Ma demande : plus vers l'extérieur, moins vers le centre ; à l'encre, jamais l'orangé.
  ROUE.forEach((f, k) => {
    const sens = dem[f]; if (!sens) return;
    const t = `rotate(${f2((k * 360) / N)} ${f2(cx)} ${f2(cy)})`, y = (d) => f2(cy - (R + d));
    s += sens > 0 ? `<g transform="${t}" data-demande="${f}" data-sens="plus"><line x1="${f2(cx)}" y1="${y(5)}" x2="${f2(cx)}" y2="${y(13)}" stroke="${ENC}" stroke-width="2.5"/><path d="M${f2(cx)},${y(21)}L${f2(cx - 5)},${y(12)}L${f2(cx + 5)},${y(12)}Z" fill="${ENC}"/></g>`
      : `<g transform="${t}" data-demande="${f}" data-sens="moins"><line x1="${f2(cx)}" y1="${y(21)}" x2="${f2(cx)}" y2="${y(13)}" stroke="${ENC}" stroke-width="2.5"/><path d="M${f2(cx)},${y(5)}L${f2(cx - 5)},${y(14)}L${f2(cx + 5)},${y(14)}Z" fill="${ENC}"/></g>`;
  });
  lib.forEach((l, k) => {
    const p = pos[k];
    l.li.forEach((li, j) => {
      s += `<text x="${f2(cx + p.x)}" y="${f2(cy + p.y0 + j * LH)}" text-anchor="${p.ancre}" font-size="${PX}">${li.map((x) => `<tspan fill="${x.fill}"${x.gras ? ' font-weight="700"' : ''}>${esc(x.t)}</tspan>`).join('')}</text>`;
    });
  });
  return s + '</svg>';
}

// ---------- le geste : appui long 500 ms, survol 750 ms, Échap (fiche.js de la base, D25, D49) ----------
// La page fournit FICHES (nom → HTML), VOIES (n → stock, action) et rendFiche(nom, mode, voie).
export const GESTE_JS = `
const APPUI_MS = 500, SURVOL_MS = 750;
const FICHE = { nom: null, mode: null, epingle: false, tFerme: null, source: null };
const RACINE = document.getElementById('fiche-racine');
const CARTE_H = '[data-role="ligne-houblon"]';
const COMMANDE_H = 'button, input, select, textarea, a, summary, [role="button"], [data-action], [data-role="gout"]';
function zoneHoublon(t) {
  if (!t || !t.closest || RACINE.contains(t)) return null;
  const e = t.closest('[data-houblon]');
  if (e && FICHES[e.dataset.houblon]) { const c = e.closest(CARTE_H); return { el: e, zone: c || e }; }
  const c = t.closest(CARTE_H);
  if (!c) return null;
  const cmd = t.closest(COMMANDE_H);
  if (cmd && c.contains(cmd)) return null;
  const n = c.querySelector('[data-houblon]');
  return n && FICHES[n.dataset.houblon] ? { el: n, zone: c } : null;
}
function ouvrirFiche(nom, o) {
  if (!FICHES[nom]) return;
  FICHE.nom = nom; FICHE.mode = o.mode; FICHE.source = o.source || null; FICHE.epingle = !!o.epingle;
  clearTimeout(FICHE.tFerme);
  const v = o.source && o.source.closest('[data-voie]');
  rendFiche(nom, o.mode, v ? +v.dataset.voie : null);
  document.body.classList.add('fiche-ouverte');
  const fe = RACINE.querySelector('[data-role="fiche"]');
  if (o.anim !== false && !matchMedia('(prefers-reduced-motion: reduce)').matches && fe) fe.animate(o.mode === 'feuille' ? [{ transform: 'translateY(30%)' }, { transform: 'none' }] : [{ opacity: 0, transform: 'scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'cubic-bezier(.2,.8,.2,1)' });
  for (const s of document.querySelectorAll('.f-source')) s.classList.remove('f-source');
  const src = o.source && (o.source.closest('[data-voie]') || o.source);
  if (src) src.classList.add('f-source');
}
function fermerFiche() {
  if (FICHE.nom == null) return;
  FICHE.nom = null; FICHE.epingle = false; clearTimeout(FICHE.tFerme);
  RACINE.replaceChildren(); document.body.classList.remove('fiche-ouverte');
  for (const s of document.querySelectorAll('.f-source')) s.classList.remove('f-source');
}
RACINE.addEventListener('click', (e) => {
  const b = e.target.closest('[data-k]'); if (!b) return;
  const k = b.dataset.k;
  if (k === 'fermer' || k === 'voile') { e.stopPropagation(); fermerFiche(); return; }
  if (k === 'aimer' || k === 'exclure') { const on = b.getAttribute('aria-pressed') !== 'true'; for (const x of RACINE.querySelectorAll('[data-k="aimer"],[data-k="exclure"]')) x.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-pressed', String(on)); return; }
  if (k === 'repli') { const id = b.dataset.sec, open = b.getAttribute('aria-expanded') !== 'true'; for (const x of RACINE.querySelectorAll('[data-k="repli"]')) x.setAttribute('aria-expanded', 'false'); for (const x of RACINE.querySelectorAll('[data-sec-corps]')) x.hidden = true; if (open) { b.setAttribute('aria-expanded', 'true'); const s = RACINE.querySelector('[data-sec-corps="' + id + '"]'); if (s) { s.hidden = false; s.scrollIntoView({ block: 'nearest' }); } } return; }
  if (k === 'comparer') { const v = FICHE.source && FICHE.source.closest('[data-voie]'); const p = v && v.querySelector('[data-role="ajouter-comparer"]'); if (p && p.getAttribute('aria-pressed') !== 'true') p.click(); fermerFiche(); return; }
  if (k === 'ajouter') { fermerFiche(); }
});
let APPUI = null, AVALE = 0;
document.addEventListener('click', (e) => { if (performance.now() < AVALE) { e.stopPropagation(); e.preventDefault(); } }, true);
document.addEventListener('contextmenu', (e) => { if ((APPUI && APPUI.type !== 'mouse') || performance.now() < AVALE) e.preventDefault(); });
function annulerAppui() { const a = APPUI; APPUI = null; if (a) { clearTimeout(a.timer); a.zone.classList.remove('appui'); } }
document.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  AVALE = 0;
  if (RACINE.contains(e.target)) { if (FICHE.mode === 'bulle') FICHE.epingle = true; return; }
  if (FICHE.nom != null && FICHE.mode === 'bulle') fermerFiche();
  if (APPUI) annulerAppui();
  const z = zoneHoublon(e.target); if (!z) return;
  const a = { el: z.el, zone: z.zone, nom: z.el.dataset.houblon, x: e.clientX, y: e.clientY, id: e.pointerId, type: e.pointerType, actif: false };
  APPUI = a; z.zone.classList.add('appui');
  a.timer = setTimeout(() => {
    if (APPUI !== a) return;
    a.actif = true; AVALE = performance.now() + 15000; z.zone.classList.remove('appui');
    try { if (navigator.vibrate) navigator.vibrate(8); } catch (x) {}
    ouvrirFiche(a.nom, { source: a.el, mode: a.type === 'mouse' || innerWidth >= 700 ? 'bulle' : 'feuille' });
  }, APPUI_MS);
}, true);
document.addEventListener('pointermove', (e) => { if (APPUI && e.pointerId === APPUI.id && !APPUI.actif && Math.hypot(e.clientX - APPUI.x, e.clientY - APPUI.y) > 10) annulerAppui(); }, true);
function relacher() { const a = APPUI; if (!a) return; if (!a.actif) { annulerAppui(); return; } APPUI = null; AVALE = performance.now() + 400; }
document.addEventListener('pointerup', (e) => { if (APPUI && e.pointerId === APPUI.id) relacher(); }, true);
document.addEventListener('pointercancel', (e) => { if (APPUI && e.pointerId === APPUI.id && !APPUI.actif) annulerAppui(); }, true);
document.addEventListener('touchend', () => { if (APPUI && APPUI.actif) relacher(); }, true);
document.addEventListener('touchmove', (e) => { if (APPUI && APPUI.actif) e.preventDefault(); }, { passive: false });
let SURVOL = null;
function finSurvol() { if (SURVOL) { clearTimeout(SURVOL.timer); SURVOL.zone.classList.remove('survol'); SURVOL = null; } }
document.addEventListener('pointerover', (e) => {
  if (e.pointerType !== 'mouse') return;
  if (RACINE.contains(e.target)) { clearTimeout(FICHE.tFerme); return; }
  const z = zoneHoublon(e.target);
  if (!z) { if (SURVOL && SURVOL.zone.contains(e.target)) finSurvol(); return; }
  if (SURVOL && SURVOL.el === z.el) return;
  finSurvol();
  if (FICHE.nom === z.el.dataset.houblon) { clearTimeout(FICHE.tFerme); SURVOL = { el: z.el, zone: z.zone }; return; }
  z.zone.classList.add('survol');
  SURVOL = { el: z.el, zone: z.zone, timer: setTimeout(() => { z.zone.classList.remove('survol'); if (FICHE.mode === 'feuille' && FICHE.nom != null) return; ouvrirFiche(z.el.dataset.houblon, { source: z.el, mode: 'bulle' }); }, SURVOL_MS) };
});
document.addEventListener('pointerout', (e) => {
  if (e.pointerType !== 'mouse') return;
  const vers = e.relatedTarget;
  if (SURVOL && SURVOL.zone.contains(e.target) && !(vers && SURVOL.zone.contains(vers))) finSurvol();
  if (FICHE.nom != null && FICHE.mode === 'bulle' && !FICHE.epingle) {
    const z = vers && zoneHoublon(vers);
    if (!(vers && RACINE.contains(vers)) && !(z && z.el.dataset.houblon === FICHE.nom)) { clearTimeout(FICHE.tFerme); FICHE.tFerme = setTimeout(() => { if (!FICHE.epingle) fermerFiche(); }, 650); }
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && FICHE.nom != null) { e.preventDefault(); fermerFiche(); return; }
  if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
    const a = document.activeElement, z = a && (zoneHoublon(a) || (a.querySelector && a.querySelector('[data-houblon]') && { el: a.querySelector('[data-houblon]') }));
    if (z && FICHES[z.el.dataset.houblon]) { e.preventDefault(); ouvrirFiche(z.el.dataset.houblon, { source: z.el, mode: innerWidth >= 700 ? 'bulle' : 'feuille', epingle: true }); }
  }
});
{ const q = new URLSearchParams(location.search).get('fiche'); if (q && FICHES[q]) { const s = document.querySelector('[data-houblon="' + q + '"]'); ouvrirFiche(q, { source: s, mode: innerWidth >= 700 ? 'bulle' : 'feuille', anim: false, epingle: true }); } }
`;

export const LENTILLE_JS = `
document.querySelectorAll('.lentille [data-e]').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('.lentille [data-e]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
  document.body.classList.toggle('abs', b.dataset.e === 'absolu');
}));
if (/[?&]abs\\b/.test(location.search)) document.querySelector('.lentille [data-e="absolu"]').click();
document.querySelectorAll('[data-role="ajouter-comparer"]').forEach((b) => b.addEventListener('click', () => {
  b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
  const n = document.querySelectorAll('[data-role="ajouter-comparer"][aria-pressed="true"]').length;
  for (const x of document.querySelectorAll('[data-nb]')) x.textContent = '(' + n + ')';
}));
`;

export const ecrire = (f, s) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); console.log('écrit ' + f.replace(E1, '') + ' (' + s.length + ' o)'); };
