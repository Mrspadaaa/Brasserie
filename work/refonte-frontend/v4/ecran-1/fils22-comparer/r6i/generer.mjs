// Lot 22 · r6i · « Remplacer Nelson Sauvin à effet égal » (Comparer, stout 16D).
// La porte « Je n'ai pas Nelson Sauvin » : Nelson est épinglé, pas en stock, et sert de cible. Chaque
// candidat (Cascade, Idaho 7, Galaxy) est montré à la dose qui donne le MÊME gain d'agrumes que Nelson
// Sauvin à 4 g/L (après fermentation, 3 j, US-05). La dose est un résultat, pas un réglage. Le seul
// facteur libre : le candidat mis en avant.
// Données : ../donnees/comparer-stout.json seulement (vérifié par r6e) ; le lien composé → familles vient
// de prototypes/houblons-v4/data/composes-houblon.json (familles.liens), la source citée par ce fichier.
// Calculs faits ici, et seulement ceux-ci :
//   - dose d'effet égal : interpolation linéaire du gain d'agrumes (delta) entre (0, 0) et les doses 1, 2,
//     4, 8 g/L de la grille, premier segment qui encadre la cible (la règle de extraire-comparer.mjs) ;
//   - profil à cette dose : interpolation linéaire de bas, centre et haut entre ta bière avant (0 g/L) et
//     les doses de la grille ;
//   - crans du style : valeur ÷ cran de la famille (echelle.parFamille) ;
//   - grammes pour 20 L : dose × 20 ; taux d'échange : dose du candidat ÷ dose de Nelson.
// Option A des descripteurs : « groseille à maquereau » et « gooseberry » rangés dans Petits fruits, sur
// la fiche de Nelson Sauvin (appui long) ; ailleurs, A ne change rien.
// Usage : node work/refonte-frontend/v4/ecran-1/fils22-comparer/r6i/generer.mjs  →  r6i/etat.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { symboles, JET, NOM, COURT, CSS_FAMILLES, CSS_FICHE, runtime, REPO } from '../../fils18-baseline/l8g/noyau.mjs';
import { CSS as HABILLAGE } from '../../fils18-baseline/l8g/habillage.mjs';
import { net } from '../../fils18-baseline/l8g/pictos-trait.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const D = JSON.parse(fs.readFileSync(path.join(ICI, '../donnees/comparer-stout.json'), 'utf8'));
const CH = JSON.parse(fs.readFileSync(REPO + '/prototypes/houblons-v4/data/composes-houblon.json', 'utf8'));

// ---------- outils ----------
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fr = (x, d = 1) => (x == null || Number.isNaN(x) ? '' : String(Math.round(x * 10 ** d) / 10 ** d).replace('.', ',').replace('-', '−'));
const r2 = (x) => Math.round(x * 100) / 100;
const rgba = (h, a) => 'rgba(' + [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(',') + ',' + a + ')';
const ACC = '#c2410c';
const ENCRE = '#16161a';

// ---------- les houblons ----------
const CIBLE = 'Nelson Sauvin';
const CANDS = ['Cascade', 'Idaho 7', 'Galaxy']; // l'ordre de sa question
const TOUS = [CIBLE, ...CANDS];
const H = Object.fromEntries(D.houblons.map((h) => [h.nom, h]));
// Couleurs de Comparer (lot 20-21, donnees-h.json) ; Nelson, la cible, en encre (il n'est pas en stock).
const COUL = { Cascade: '#781838', 'Idaho 7': '#e80030', Galaxy: '#681878', [CIBLE]: ENCRE };
const ROLE = (h) => ({ aromatique: 'aromatique', 'amérisant': 'amérisant', double: 'mixte' }[h.role.value] || h.role.value);
const deduit = (h) => /^règle/.test(h.role.source || '');

// ---------- la grille : dry hop après fermentation, 3 j, US-05 ----------
const BASE = D.egalites.doseEgale; // { dose_gL: 4, moment: dryPost, jours: 3, levure }
const pt = (h, dose) => h.grille.find((g) => g.moment === BASE.moment && g.jours === BASE.jours && g.levure === BASE.levure && g.dose_gL === dose);
const DOSES = [1, 2, 4, 8];
const doseEffet = (h, fam, cible) => {
  const pts = [[0, 0], ...DOSES.map((x) => [x, pt(h, x).delta[fam]])];
  for (let i = 1; i < pts.length; i++) {
    const [d0, v0] = pts[i - 1], [d1, v1] = pts[i];
    if (cible >= v0 && cible <= v1 && v1 > v0) return d0 + ((cible - v0) / (v1 - v0)) * (d1 - d0);
  }
  return null;
};
const DOSE_NELSON = BASE.dose_gL; // 4 g/L : la dose égale du lot, posée pour la cible
const CIBLE_AGR = pt(H[CIBLE], DOSE_NELSON).delta.citrus;
const DOSE = { [CIBLE]: DOSE_NELSON };
for (const n of CANDS) DOSE[n] = doseEffet(H[n], 'citrus', CIBLE_AGR);
// Contrôle de robustesse : le même calcul à la cible du fichier (Cascade 4 g/L = Nelson 7,4 g/L).
const EE = D.egalites.effetEgal.find((e) => e.famille === 'citrus');
const TAUX = Object.fromEntries(CANDS.map((n) => [n, { a4: DOSE[n] / DOSE_NELSON, a74: EE.doses[n] / EE.doses[CIBLE] }]));

const FAM = D.familles.map((f) => f.id);
const AXES = ['citrus', 'tropical', 'melon', 'stoneFruit', 'pomeFruit', 'berries', 'floral', 'green', 'herbal', 'spice', 'earthy', 'resin'];
const ORDRE = D.style.ordre; // floral, herbacé, terreux (attendues par la 16D), puis les autres
const ECH = D.echelle.parFamille;
const AV = D.biere.avant;
function profil(h, dose) {
  const P = {};
  for (const f of FAM) {
    const pts = [[0, [AV[f].bas, AV[f].centre, AV[f].haut]], ...DOSES.map((x) => [x, pt(h, x).apres[f].slice(0, 3)])];
    let v = pts[pts.length - 1][1];
    for (let i = 1; i < pts.length; i++) { const [d0, a] = pts[i - 1], [d1, b] = pts[i]; if (dose <= d1) { const t = (dose - d0) / (d1 - d0); v = a.map((x, k) => x + (b[k] - x) * t); break; } }
    const inconnu = DOSES.every((x) => pt(h, x).apres[f][2] === 0) && AV[f].haut === 0;
    P[f] = { bas: v[0], centre: v[1], haut: v[2], crans: v[1] / ECH[f].cran, inconnu, hors: v[1] > ECH[f].bande[1] };
  }
  return P;
}
const PROF = Object.fromEntries(TOUS.map((n) => [n, profil(H[n], DOSE[n])]));
const CONF = Object.fromEntries(TOUS.map((n) => [n, pt(H[n], 4).confiance]));
// Écart à Nelson : somme des écarts en crans sur les familles connues des deux (simulé).
const connu2 = (n, f) => !PROF[n][f].inconnu && !PROF[CIBLE][f].inconnu;
const ECART = Object.fromEntries(CANDS.map((n) => [n, FAM.filter((f) => connu2(n, f)).reduce((s, f) => s + Math.abs(PROF[n][f].crans - PROF[CIBLE][f].crans), 0)]));
const PROCHE = CANDS.slice().sort((a, b) => ECART[a] - ECART[b])[0];
const PLUS = Object.fromEntries(CANDS.map((n) => [n, FAM.filter((f) => connu2(n, f) && PROF[n][f].crans - PROF[CIBLE][f].crans >= 0.75).sort((a, b) => (PROF[n][b].crans - PROF[CIBLE][b].crans) - (PROF[n][a].crans - PROF[CIBLE][a].crans)).slice(0, 3)]));
const MOINS = Object.fromEntries(CANDS.map((n) => [n, FAM.filter((f) => connu2(n, f) && PROF[CIBLE][f].crans - PROF[n][f].crans >= 0.75).slice(0, 2)]));
console.log('cible agrumes', r2(CIBLE_AGR), Object.fromEntries(TOUS.map((n) => [n, r2(DOSE[n])])), 'écarts', Object.fromEntries(CANDS.map((n) => [n, r2(ECART[n])])), 'plus', PLUS, 'moins', MOINS);

// ---------- α : le lot d'abord ; Nelson n'est pas en stock, ses fiches ----------
const ALPHA = Object.fromEntries(TOUS.map((n) => {
  const a = H[n].alpha, mi = Math.min(...a.sources.map((s) => s.min)), ma = Math.max(...a.sources.map((s) => s.max));
  const lot = n !== CIBLE && a.retenu ? a.retenu.value : null;
  return [n, { lot, de: a.retenu ? a.retenu.from : null, fiches: [mi, ma], hors: lot != null && (lot < mi || lot > ma) }];
}));
const STOCK = { Cascade: 'suffisant', Galaxy: 'suffisant', 'Idaho 7': null, [CIBLE]: 'à acheter' }; // α « fiche de stock » pour Cascade et Galaxy ; Idaho 7 : non renseigné

// ---------- icônes : les pictos au trait de la baseline (l8g, ton texte), actions lucide ----------
const V3 = fs.readFileSync(REPO + '/work/refonte-frontend/v4/ecran-1/fils17-standard/v3/planche.html', 'utf8');
const SYM = {};
for (const m of V3.matchAll(/<symbol id="p-([a-zA-Z]+)" viewBox="[^"]+"[^>]*>([\s\S]*?)<\/symbol>/g)) SYM[m[1]] = m[2];
const lucide = (nom) => {
  const t = fs.readFileSync(REPO + '/node_modules/lucide-react/dist/esm/icons/' + nom + '.mjs', 'utf8').match(/const __iconNode = (\[[\s\S]*?\]);\nconst/)[1];
  return new Function('return ' + t)().map(([tag, a]) => '<' + tag + ' ' + Object.entries(a).filter(([k]) => k !== 'key').map(([k, v]) => k + '="' + v + '"').join(' ') + '/>').join('');
};
const EN_PLUS = { labo: 'flask-conical', panel: 'users', chevb: 'chevron-down', vers: 'arrow-right' };
const TAILLES = [12, 14, 16, 18, 20];
const CRAYON = '<filter id="crayon" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="7"/><feDisplacementMap in="SourceGraphic" scale="0.8"/></filter>';
const SYMB = symboles({ trait: 1.5, tailles: TAILLES })
  .replace(/<symbol id="p-([a-zA-Z]+)"[\s\S]*?<\/symbol>/g, (m, f) => `<symbol id="p-${f}" viewBox="0 0 24 24" fill="none" stroke="${JET[f].texte}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><g filter="url(#crayon)">${net(SYM[f])}</g></symbol>`)
  .replace('</svg>', TAILLES.map((z) => Object.entries(EN_PLUS).map(([k, n]) => `<symbol id="i-${k}-${z}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${Math.round(1.5 * 24 / z * 1000) / 1000}" stroke-linecap="round" stroke-linejoin="round">${lucide(n)}</symbol>`).join('')).join('') + '<defs>' + CRAYON + '</defs></svg>');
const ic = (k, z = 16, cls = 'ic') => `<svg class="${cls}" width="${z}" height="${z}" aria-hidden="true"><use href="#i-${k}-${z}"/></svg>`;
const pic = (f, w = 16, extra = '') => `<svg class="pi" width="${w}" height="${w}" data-famille="${f}" role="img" aria-label="${NOM[f]}"${extra}><use href="#p-${f}"/></svg>`;

// ---------- petits éléments ----------
const nomEl = (n) => `<span class="hn" data-houblon="${esc(n)}" data-couleur="${COUL[n]}" tabindex="0"><i class="pt" style="background:${COUL[n]}" aria-hidden="true"></i>${esc(n)}</span>`;
const alphaEl = (n) => {
  const A = ALPHA[n];
  if (A.lot != null) return `<span class="al" data-role="alpha" data-source="lot" aria-label="α du lot : ${fr(A.lot)} %${A.hors ? ', hors des plages de ses fiches' : ''}">${fr(A.lot)}%${A.hors ? ic('diff', 12) : ''}</span>`;
  return `<span class="al fi" data-role="alpha" data-source="fiches" aria-label="α des fiches : ${fr(A.fiches[0])} à ${fr(A.fiches[1])} %">${ic('livre', 12)}${fr(A.fiches[0])}–${fr(A.fiches[1])}%</span>`;
};
const usageEl = (n) => `<span class="us${deduit(H[n]) ? ' deduit' : ''}" data-role="usage" aria-label="Usage : ${ROLE(H[n])}${deduit(H[n]) ? ', déduit de l’α, à valider' : ', attesté par le fournisseur'}">${ROLE(H[n])}</span>`;
const stockEl = (n) => {
  const s = STOCK[n];
  if (s === 'suffisant') return `<span class="stk" role="img" aria-label="En stock (fiche de stock)">${ic('stock', 14)}</span>`;
  if (s === 'à acheter') return `<span class="stk" role="img" aria-label="Pas en stock">${ic('achat', 14)}</span>`;
  return '';
};
const gL = (x) => fr(x, 1) + ' g/L';

// ---------- la dose : une piste 0–5 g/L, Nelson 4 g/L en repère ----------
const PMAX = 5, PW = 132;
const piste = (n) => {
  const w = Math.round((DOSE[n] / PMAX) * PW), xr = Math.round((DOSE_NELSON / PMAX) * PW);
  const cible = n === CIBLE;
  return `<span class="piste" aria-hidden="true"><i class="pz"></i>${[1, 2, 3, 4].map((g) => `<i class="pg" style="left:${Math.round((g / PMAX) * PW)}px"></i>`).join('')}<i class="pb${cible ? ' cib' : ''}" style="width:${w}px;--c:${COUL[n]}"></i><i class="pr" style="left:${xr - 1}px"></i></span>`;
};
const pictosFam = (fs_, signe, n) => (fs_.length ? `<span class="gain ${signe === '+' ? 'plus' : 'moins'}" aria-label="${signe === '+' ? 'Plus' : 'Moins'} que Nelson Sauvin : ${fs_.map((f) => NOM[f].toLowerCase()).join(', ')}"><b aria-hidden="true">${signe === '+' ? '+' : '−'}</b>${fs_.map((f) => pic(f, 16, PROF[n][f].hors && f === 'resin' && signe === '+' ? ' data-hors="1"' : '')).join('')}</span>` : '');

const ligneCible = `<div class="cible" data-voie="${CIBLE}" data-role="ligne-houblon" aria-label="Je n’ai pas Nelson Sauvin : la cible, 4 g/L">
  <span class="l1"><span class="porte">Je n’ai pas</span>${nomEl(CIBLE)}${alphaEl(CIBLE)}${usageEl(CIBLE)}${stockEl(CIBLE)}<b class="dose" data-nature="cible">${gL(DOSE_NELSON)}</b></span>
  <span class="l2">${piste(CIBLE)}<span class="gr">${fr(DOSE_NELSON * 20, 0)} g</span><span class="conf" data-nature="simule">~ ${CONF[CIBLE] === 'faible' ? 'peu sûr' : CONF[CIBLE]}</span></span>
</div>`;
const ligneCand = (n, i) => `<button type="button" class="cand" data-voie="${esc(n)}" aria-pressed="${i === 0}" style="--c:${COUL[n]}" aria-label="Mettre en avant ${esc(n)}" aria-describedby="dz-${i}">
  <span class="l1">${nomEl(n)}${alphaEl(n)}${usageEl(n)}${stockEl(n)}<b class="dose" id="dz-${i}" data-nature="simule">~${gL(DOSE[n])}</b></span>
  <span class="l2">${piste(n)}<span class="gr">${fr(DOSE[n] * 20, 0)} g</span>${n === PROCHE ? '<span class="proche" data-nature="simule">~plus proche</span>' : ''}${pictosFam(PLUS[n], '+', n)}${pictosFam(MOINS[n], '−', n)}</span>
</button>`;

// ---------- radar r3 : un petit radar par houblon, Nelson en silhouette sur chaque candidat ----------
const RW = 176, RC = RW / 2, RR = RW / 2 - 22, MAXC = 4;
const ang = (k) => (k * 2 * Math.PI) / AXES.length;
const P = (k, r) => [RC + Math.sin(ang(k)) * r, RC - Math.cos(ang(k)) * r].map((x) => Math.round(x * 10) / 10);
const rSt = (f, v) => (Math.min(Math.max(v, 0) / ECH[f].cran, MAXC) / MAXC) * RR;
const rAb = (f, v) => (Math.min(Math.max(v, 0), 100) / 100) * RR;
const pts = (fn) => AXES.map((f, k) => P(k, fn(f, k)).join(',')).join(' ');
const dLigne = (k, a, b) => { const p = P(k, a), q = P(k, b); return `M${p.join(',')}L${q.join(',')}`; };
function radar(n, focus) {
  const pr = PROF[n], c = COUL[n], id = 'rd-' + n.replace(/\W/g, '');
  const inc = AXES.filter((f) => pr[f].inconnu);
  const valeurs = AXES.map((f) => (pr[f].inconnu ? 0 : r2(pr[f].centre)));
  let s = `<svg width="${RW}" height="${RW}" viewBox="0 0 ${RW} ${RW}" data-radar data-objet="houblon" data-axes="${AXES.join(',')}" role="img" aria-label="${esc(n)}, ~ simulé à ${gL(DOSE[n])} : ${AXES.filter((f) => !pr[f].inconnu && pr[f].crans >= 0.75).map((f) => NOM[f].toLowerCase() + ' ' + fr(pr[f].crans) + ' crans').join(', ')}${inc.length ? ' ; inconnus, pas zéro : ' + inc.map((f) => NOM[f].toLowerCase()).join(', ') : ''}">`;
  s += `<defs><pattern id="h-${id}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="#b9bcc6" stroke-width="1.4"/></pattern></defs>`;
  // familles inconnues : secteur hachuré, jamais zéro
  for (const f of inc) { const k = AXES.indexOf(f), a = P(k - 0.5, RR), b = P(k + 0.5, RR); s += `<path d="M${RC},${RC}L${a.join(',')}A${RR},${RR} 0 0 1 ${b.join(',')}Z" fill="url(#h-${id})" opacity=".8"/>`; }
  s += `<polygon points="${pts(() => RR)}" fill="none" stroke="#c9ccd4" stroke-width="1"/>`;
  // la zone de ta 16D (3 crans au style ; la bande en absolu)
  s += `<g data-serie="zone" data-role="zone"><polygon class="zone" points="${pts((f) => (3 / MAXC) * RR)}" data-st="${pts((f) => (3 / MAXC) * RR)}" data-abs="${pts((f) => (ECH[f].bande[1] / 100) * RR)}"/></g>`;
  AXES.forEach((f, k) => { const e = P(k, RR); s += `<line x1="${RC}" y1="${RC}" x2="${e[0]}" y2="${e[1]}" stroke="#d6d8de" stroke-width="1"/>`; });
  // l'intervalle de chaque famille : une bande pâle de bas à haut (le haut sort souvent du cadre : il se voit)
  { const ring = (fn) => 'M' + AXES.map((f, k) => P(k, pr[f].inconnu ? 0 : fn(f, pr[f])).join(',')).join('L') + 'Z';
    const dSt = ring((f, v) => rSt(f, v.haut)) + ring((f, v) => rSt(f, v.bas)), dAb = ring((f, v) => rAb(f, v.haut)) + ring((f, v) => rAb(f, v.bas));
    s += `<path class="bande" d="${dSt}" data-st="${dSt}" data-abs="${dAb}" fill="${rgba(c === ENCRE ? '#55555f' : c, 0.13)}" fill-rule="evenodd" stroke="none"/>`; }
  // la silhouette de Nelson, en trait fin, sur chaque candidat
  if (n !== CIBLE) { const q = PROF[CIBLE];
    s += `<g data-serie="${CIBLE}" data-valeurs="${AXES.map((f) => (q[f].inconnu ? 0 : r2(q[f].centre))).join(',')}" data-inconnues="${AXES.filter((f) => q[f].inconnu).join(',')}"><polygon class="sil" points="${pts((f) => rSt(f, q[f].inconnu ? 0 : q[f].centre))}" data-st="${pts((f) => rSt(f, q[f].inconnu ? 0 : q[f].centre))}" data-abs="${pts((f) => rAb(f, q[f].inconnu ? 0 : q[f].centre))}" fill="none" stroke="${ENCRE}" stroke-width="1.5" stroke-linejoin="round"/></g>`; }
  const st = pts((f) => rSt(f, pr[f].inconnu ? 0 : pr[f].centre)), ab = pts((f) => rAb(f, pr[f].inconnu ? 0 : pr[f].centre));
  s += `<g data-serie="${esc(n)}" data-valeurs="${valeurs.join(',')}" data-inconnues="${inc.join(',')}" data-couleur="${c}"><polygon points="${st}" data-st="${st}" data-abs="${ab}" fill="${rgba(c, n === CIBLE ? 0.1 : 0.2)}" stroke="${c}" stroke-width="2" stroke-linejoin="round"/></g>`;
  AXES.forEach((f, k) => { const v = pr[f]; if (v.inconnu || v.centre < 0.5) return;
    const a = P(k, rSt(f, v.centre)), b = P(k, rAb(f, v.centre));
    s += `<circle cx="${a[0]}" cy="${a[1]}" r="${v.hors ? 3.6 : 2.6}" data-st="${a.join(',')}" data-abs="${b.join(',')}" fill="${v.hors ? ACC : c}"${v.hors ? ' data-hors="1"' : ''}/>`; });
  // les familles, en pictos seuls (radars m4 et h4 : sans légende écrite) ; « ? » si inconnue
  AXES.forEach((f, k) => { const q = P(k, RR + 12), z = 14;
    s += `<svg x="${q[0] - z / 2}" y="${q[1] - z / 2}" width="${z}" height="${z}" class="pi${pr[f].inconnu ? ' inc' : ''}" data-famille="${f}" role="img" aria-label="${NOM[f]}${pr[f].inconnu ? ', inconnu' : ''}"><use href="#p-${f}"/></svg>`; });
  return s + '</svg>';
}
const carteRadar = (n) => `<figure class="un-radar${n === CIBLE ? ' cib' : ''}" data-r="${esc(n)}" style="--c:${COUL[n]}"><figcaption>${nomEl(n)}</figcaption>${radar(n)}</figure>`;

// ---------- les barres de l5b : le candidat contre Nelson, famille par famille ----------
const TW = 150;
const xSt = (f, v) => Math.round((Math.min(Math.max(v, 0) / ECH[f].cran, MAXC) / MAXC) * TW);
const xAb = (f, v) => Math.round((Math.min(Math.max(v, 0), 100) / 100) * TW);
function barre(n, f) {
  const v = PROF[n][f], q = PROF[CIBLE][f], a = AV[f], J = JET[f];
  const vars = (k, x) => `--${k}-st:${x[0]}px;--${k}-ab:${x[1]}px`;
  const X = (fn, val) => [fn === 'st' ? xSt(f, val) : xAb(f, val)];
  const both = (val) => [xSt(f, val), xAb(f, val)];
  const zone = [Math.round((3 / MAXC) * TW), Math.round((ECH[f].bande[1] / 100) * TW)];
  const d = v.inconnu || q.inconnu ? null : Math.round(v.crans - q.crans);
  const dTxt = v.inconnu ? '?' : q.inconnu ? 'Nelson ?' : d === 0 ? '≈' : (d > 0 ? '+' : '−') + Math.abs(d);
  const style = [vars('z', zone), vars('c', both(v.inconnu ? 0 : v.centre)), vars('b', both(v.inconnu ? 0 : v.bas)), vars('h', both(v.inconnu ? 0 : v.haut)), vars('n', both(q.inconnu ? 0 : q.centre)), vars('a', both(a.centre))].join(';');
  const lab = `${NOM[f]} : ${v.inconnu ? 'inconnu, pas zéro' : '~ ' + fr(v.crans) + ' crans du style'}${q.inconnu ? ' ; Nelson Sauvin inconnu' : ' ; Nelson Sauvin ~ ' + fr(q.crans)}${v.hors ? ' ; hors de ta 16D' : ''}`;
  return `<div class="br${v.inconnu ? ' inc' : ''}${v.hors ? ' hors' : ''}${q.inconnu ? ' ninc' : ''}" data-famille="${f}" style="${style};--fb:${J.base};--ff:${J.fond};--ft:${J.texte}" role="img" aria-label="${esc(lab)}">
    ${pic(f, 16)}<span class="bn">${COURT[f]}</span>
    <span class="tr"><i class="tz"></i><i class="tb"></i><i class="tx"></i><i class="tw"></i>${q.inconnu ? '' : '<i class="tn"></i>'}<i class="ta"></i></span>
    <span class="bd${d != null && d !== 0 ? (d > 0 ? ' up' : ' dn') : ''}">${dTxt}</span></div>`;
}
const detail = (n, i) => `<section class="det" data-det="${esc(n)}"${i === 0 ? '' : ' hidden'} aria-label="${esc(n)} contre Nelson Sauvin">
  <h2 class="h2"><span class="pt" style="background:${COUL[n]}"></span>${esc(n)} ~${gL(DOSE[n])} <span class="contre">contre</span> Nelson ${gL(DOSE_NELSON)}</h2>
  <div class="brs" data-role="simulation">${ORDRE.map((f) => barre(n, f)).join('')}</div>
  <p class="src"><span class="sim">~ simulé</span> confiance ${CONF[n]} pour ${esc(n)}, ${CONF[CIBLE]} pour Nelson · écart total ~${fr(ECART[n])} crans</p>
  <nav class="pont" aria-label="Suite"><a href="#dryhopper" data-pont="${esc(n)}">${ic('vers', 16)}<span>Doser ${esc(n)} dans Dryhopper</span></a></nav>
</section>`;

// ---------- ce que Nelson garde pour lui (option A) ----------
const A = D.descripteurs.A;
const sansNelson = (() => { const vu = new Set(); return H[CIBLE].motsSansFamille.map((m) => m.mot.toLowerCase()).filter((m) => !A.mots.includes(m) && !vu.has(m) && vu.add(m)); })();
const GEN = new Set(D.descripteurs.B.generiques);
const sansConcepts = sansNelson.filter((m) => !GEN.has(m));
const blocNelson = `<section class="bloc garde" aria-label="Ce que Nelson Sauvin garde pour lui">
  <h2 class="h2">Ce qu’aucun ne remplace</h2>
  <p class="ligne-mots">${sansConcepts.filter((m) => !/^(white wine|grape)$/.test(m)).map((m) => `<span class="mot">${esc(m)}</span>`).join('')}</p>
  <p class="src">Nelson Sauvin : ${Math.round(A.effets[CIBLE].partSansFamilleA * 100)} % de ses mots hors des 12 familles, même avec A (« groseille à maquereau » rangée en ${pic('berries', 12)} Petits fruits). Ses thiols : classe « forte » chez Hopsteiner, sans chiffre. Le moteur ne les compte pas : ses barres Petits fruits restent « ? ».</p>
</section>`;

// ---------- panel OSU (mesuré), avec la dose d'effet égal de Cascade ----------
const O = D.panelOSU;
const OW = 214, OH = 92, OX0 = 8, OX1 = 150, OY0 = 80, OY1 = 8;
const ox = (d) => Math.round((OX0 + (d / 16) * (OX1 - OX0)) * 10) / 10, oy = (v) => Math.round((OY0 - (v / 15) * (OY0 - OY1)) * 10) / 10;
const serieOSU = (vals, coul) => `<polyline points="${O.doses.map((d, k) => ox(d) + ',' + oy(vals[k])).join(' ')}" fill="none" stroke="${coul}" stroke-width="1.6"/>` + O.doses.map((d, k) => `<circle cx="${ox(d)}" cy="${oy(vals[k])}" r="2.6" fill="${coul}"/>`).join('');
const blocOSU = `<section class="bloc" data-acquis="osu" data-nature="mesure" data-source="${O.sources.join(', ')} · Lafontaine 2018 (E04)" aria-label="Panel OSU, Cascade">
  <h2 class="h2">${ic('panel', 16)}Panel OSU, Cascade <span class="mes">mesuré</span></h2>
  <div class="osu-l"><svg class="osu" width="${OW}" height="${OH + 14}" viewBox="0 0 ${OW} ${OH + 14}" role="img" aria-label="Panel OSU, Cascade, 24 h, sur 15 : agrumes ${O.agrumes.map((v) => fr(v)).join(', ')} ; herbacé et thé ${O.herbaceThe.map((v) => fr(v)).join(', ')} ; aux doses ${O.doses.map((d) => fr(d, 2)).join(', ')} g/L ; trait : la dose d’effet égal de Cascade, ~${gL(DOSE.Cascade)}">
    <rect x="${ox(O.zone[0])}" y="${OY1}" width="${ox(O.zone[1]) - ox(O.zone[0])}" height="${OY0 - OY1}" fill="#f1f2f5"/>
    <line x1="${OX0}" y1="${OY0}" x2="${OX1}" y2="${OY0}" stroke="#c4c6ce" stroke-width="1"/>
    ${serieOSU(O.herbaceThe, JET.herbal.texte)}${serieOSU(O.agrumes, JET.citrus.texte)}
    <line x1="${ox(DOSE.Cascade)}" y1="${OY1 - 2}" x2="${ox(DOSE.Cascade)}" y2="${OY0}" stroke="${COUL.Cascade}" stroke-width="2"/>
    <text x="${ox(DOSE.Cascade) + 3}" y="${OY1 + 6}" class="ot" fill="${COUL.Cascade}">~${fr(DOSE.Cascade)}</text>
    <text x="${OX1 + 4}" y="${oy(O.agrumes[4]) + 4}" class="ot" fill="${JET.citrus.texte}">agrumes</text>
    <text x="${OX1 + 4}" y="${oy(O.herbaceThe[4]) + 4}" class="ot" fill="${JET.herbal.texte}">herbacé</text>
    ${[0, 4, 8, 16].map((d) => `<text x="${ox(d)}" y="${OY0 + 12}" class="ot g" text-anchor="middle">${d}</text>`).join('')}
  </svg>
  <p class="osu-t"><b class="num" data-nature="mesure" data-source="${O.sources.join(', ')} · Lafontaine 2018">agrumes ${fr(O.agrumes[0])} → ${fr(O.agrumes[3])} sur 15</b> à 8 g/L, puis plat ; l’herbacé monte encore.</p></div>
  <p class="src">Cascade seul, 24 h, 13–15 °C, g/L en abscisse : pas tes 3 j à l’US-05. Rien de mesuré pour Nelson, Idaho 7 ni Galaxy. H22 · Lafontaine et Shellhammer 2018 ; H77.</p>
</section>`;

// ---------- la chimie, rattachée aux familles (à un toucher) ----------
const LIENS = CH.familles.liens;
const famDe = (k) => [...new Set(LIENS.filter((l) => l.compose === k).flatMap((l) => l.familles))];
const UNITE = { huile: 'mL/100 g', terpene: '% huile', thiol: 'µg/kg' };
const COMP = [['huile', 'Huile totale', 'huile'], ['linalol', 'Linalol', 'terpene'], ['geraniol', 'Géraniol', 'terpene'], ['myrcene', 'Myrcène', 'terpene'], ['humulene', 'Humulène', 'terpene'], ['caryophyllene', 'Caryophyllène', 'terpene'], ['4MMP', '4MMP', 'thiol'], ['3MH', '3MH', 'thiol'], ['3M4MP', '3M4MP', 'thiol']];
function valeurCompose(n, k) {
  const c = H[n].composes, e = k === 'huile' ? c.huile : c.composes[k];
  if (!e || !e.valeurs) {
    const r = (e && e.raison) || 'non relevé';
    const nd = /non détecté/.test(r);
    return `<span class="vi${nd ? ' nd' : ''}" data-inconnu="${esc(r)}" aria-label="${esc(n)} : ${nd ? 'non détecté' : 'inconnu'}, ${esc(r)}">${nd ? 'non détecté' : '<i class="hach" aria-hidden="true"></i>inconnu'}</span>`;
  }
  const lo = e.valeurs.map((v) => v.plage[0]).filter((x) => x != null), hi = e.valeurs.map((v) => v.plage[1]).filter((x) => x != null);
  const src = [...new Set(e.valeurs.flatMap((v) => v.sources))];
  const conf = e.valeurs.some((v) => v.aConfirmer);
  const mi = lo.length ? Math.min(...lo) : null, ma = hi.length ? Math.max(...hi) : null;
  const t = mi != null && ma != null ? (mi === ma ? fr(mi, 2) : fr(mi, 2) + '–' + fr(ma, 2)) : mi != null ? '> ' + fr(mi, 2) : '< ' + fr(ma, 2);
  return `<b class="num" data-nature="mesure" data-source="${esc(src.join(', '))}" style="color:${n === CIBLE ? ENCRE : COUL[n]}">${t}${conf ? ' ?' : ''}</b>`;
}
const blocChimie = `<section id="p-chimie" hidden class="bloc" data-acquis="chimie" aria-label="Ce qui fait l’arôme">
  <h2 class="h2">Ce qui fait l’arôme</h2>
  <div class="ch-t"><span></span>${TOUS.map((n) => `<span class="ch-h">${nomEl(n)}</span>`).join('')}</div>
  ${COMP.map(([k, t, ty]) => `<div class="ch-r" data-compose="${k}"><span class="ch-n">${famDe(k).map((f) => pic(f, 14)).join('')}<span>${t}</span><small>${UNITE[ty]}</small></span>${TOUS.map((n) => `<span class="ch-v">${valeurCompose(n, k)}</span>`).join('')}</div>`).join('')}
  <p class="src">Plages publiées, de la plus petite à la plus grande valeur des sources (fiches Hopsteiner, Beer Maverick, YCH, Haas, HPA ; thiols : Schmidt 2024, H11, une seule méthode). « inconnu » : rien de publié au dépôt, jamais 0. Composé → familles : composes-houblon.json.</p>
</section>`;

// ---------- les vraies valeurs, mesurées en bière (à un toucher) ----------
const etude = (n, id) => H[n].panels.find((p) => p.id === id);
const E06 = (cmp) => etude(CIBLE, 'E06').mesures.find((m) => m.variete === CIBLE && m.compose === cmp);
const mb = (n, id) => H[n].composes.mesuresEnBiere.find((m) => m.id === id);
const E03m = etude('Idaho 7', 'E03').mesures.find((m) => m.variete === 'Idaho-7' && m.compose === 'myrcène');
const VRAIES = [
  { n: CIBLE, q: 'linalol', v: fr(E06('linalol').valeur) + ' µg/L', s: 'E06 · Feng 2015', c: 'dry hop, dose non publiée' },
  { n: CIBLE, q: 'géraniol', v: fr(E06('géraniol').valeur) + ' µg/L', s: 'E06 · Feng 2015', c: 'ligne à vérifier' },
  { n: CIBLE, q: 'myrcène', v: fr(E06('myrcène').valeur, 0) + ' µg/L', s: 'E06 · Feng 2015', c: 'dry hop, dose non publiée' },
  { n: 'Cascade', q: 'linalol', v: fr(mb('Cascade', 'kishimoto-linalol').plage[0]) + ' µg/L', s: 'H12 · Kishimoto 2008', c: '2 g/L, moût refroidi' },
  { n: 'Cascade', q: '3MH', v: mb('Cascade', 'lafontaine-3mh').plage.map((x) => fr(x, 0)).join('–') + ' ng/L', s: 'H20 · Lafontaine 2019', c: '3,86 g/L, 24 h' },
  { n: 'Idaho 7', q: 'myrcène', v: fr(E03m.valeur, 3).replace(/^0,/, '0,') + ' mg/L', s: 'E03 · McCabe 2023', c: 'au pitch, 14 j, à vérifier' },
];
const blocValeurs = `<section id="p-valeurs" hidden class="bloc" data-acquis="valeurs" aria-label="Mesuré en bière">
  <h2 class="h2">${ic('labo', 16)}Mesuré en bière</h2>
  ${VRAIES.map((x) => `<div class="vr"><span class="vr-q">${nomEl(x.n)}<span class="vr-c">${x.q} · ${x.c}</span></span><span class="vr-v"><b class="num" data-nature="mesure" data-source="${esc(x.s)}">${x.v}</b><span class="vr-s">${x.s}</span></span></div>`).join('')}
  <p class="src">Galaxy : aucune mesure en bière au dépôt (inconnu, pas 0). Doses, bières et méthodes différentes : ces points ne se comparent pas entre eux, ni à la dose de cette page.</p>
</section>`;

// ---------- la légende, derrière « ? » ----------
const legende = `<div class="voile" data-role="legende-voile" hidden></div><section class="leg" id="legende" data-role="legende" role="dialog" aria-label="Légende" hidden>
  <div class="leg-t"><b>Légende</b><button type="button" class="leg-x" data-role="legende-fermer" aria-label="Fermer la légende">${ic('x', 18)}</button></div>
  <p><b>La dose</b> : chaque candidat à la dose qui donne le même gain d’agrumes que Nelson Sauvin à 4 g/L, ~ simulé. Le trait noir de la piste : les 4 g/L de Nelson. Grammes pour 20 L.</p>
  <p><b>+ et −</b> : les familles où il donne au moins un cran de plus, ou de moins, que Nelson.</p>
  <p><b>Les radars</b> : zone grise, ta 16D ; surface, le candidat ; trait noir, Nelson ; moustache pâle, sa plage simulée ; point orangé, hors de ta 16D ; hachuré et « ? », inconnu, jamais zéro.</p>
  <p><b>Les barres</b> : zone pâle, ta 16D ; barre, le candidat ; trait noir, Nelson ; trait gris, ta bière avant ; chiffre, crans de plus ou de moins que Nelson.</p>
  <p>${ic('stock', 14)} en stock · ${ic('achat', 14)} pas en stock · ${ic('diff', 12)} α du lot hors de ses fiches · ${ic('livre', 12)} α des fiches. Appui long sur un nom : sa fiche.</p>
  <p><b>Descripteurs, option A</b> : « groseille à maquereau » rangée dans Petits fruits (fiche de Nelson Sauvin).</p>
</section>`;

// ---------- l'écran ----------
const corps = `
<header class="tete"><button class="retour" type="button" aria-label="Retour">${ic('chev-l', 20)}</button><h1>Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ?</h1><button type="button" class="leg-b" data-role="legende-bouton" aria-expanded="false" aria-controls="legende" aria-label="Légende">?</button></header>
<p class="ctx" data-role="contexte"><span data-contexte="base">agrumes de Nelson 4 g/L</span><span data-contexte="moment">après fermentation, 3 j</span><span data-contexte="levure">US-05</span><span data-contexte="biere">stout 16D</span></p>
<section class="doses" aria-label="La dose de chaque candidat">
  ${ligneCible}
  <div class="libre" role="group" aria-label="Candidats" data-libre="houblon">${CANDS.map(ligneCand).join('')}</div>
</section>
<section class="bloc radars" data-acquis="radar" aria-label="Profils simulés, un radar par houblon">
  <div class="rad-t"><span class="sim">~ simulé</span><span class="seg lentille" role="radiogroup" aria-label="Lecture" data-lecture><button role="radio" type="button" data-e="style" aria-checked="true">Au style</button><button role="radio" type="button" data-e="absolu" aria-checked="false">Absolu</button></span></div>
  <div class="multi">${TOUS.map(carteRadar).join('')}</div>
</section>
${CANDS.map(detail).join('')}
<p class="taux"><b>Pour 1 g de Nelson</b>${CANDS.map((n) => `<span><i class="pt" style="background:${COUL[n]}"></i>${fr(TAUX[n].a4, 2)} g ${esc(n)}</span>`).join('')}<span class="sim">~ le même à 4 et à 7,4 g/L de Nelson</span></p>
${blocNelson}
${blocOSU}
<div class="ouvre-l">
  <button type="button" class="ouvre" aria-controls="p-chimie" aria-expanded="false" data-ouvre-acquis="chimie">${pic('floral', 14)}${pic('tropical', 14)}<span>Ce qui fait l’arôme</span>${ic('chevb', 14)}</button>
  <button type="button" class="ouvre" aria-controls="p-valeurs" aria-expanded="false" data-ouvre-acquis="valeurs">${ic('labo', 14)}<span>Mesuré en bière</span>${ic('chevb', 14)}</button>
</div>
${blocChimie}
${blocValeurs}
<p class="pied"><span class="sim">~ simulé</span> moteur profil-simule (${esc(D.date)}), conventions à valider ; dose d’effet égal interpolée sur la grille 1, 2, 4, 8 g/L. Ta stout : ${esc(D.biere.titre.replace(/^Stout export 16D S1 \(lot 20\) : /, ''))} ; « ${esc(D.biere.degustation.citation)} » (${esc(D.biere.degustation.date.split('-').reverse().slice(0, 2).join('.'))}).</p>`;

const css = `
  :root { --mur: #eceef2; --gris: #55555f; }
  [hidden] { display: none !important; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { background: var(--mur); }
  body { min-height: 100vh; color: var(--encre); font: 400 14px/1.3 var(--sans); -webkit-tap-highlight-color: transparent; }
  button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; text-align: left; }
  svg { display: block; flex: none; }
  ${CSS_FAMILLES}
  .ecran { max-width: 390px; margin: 0 auto; padding: 2px 10px 32px; display: flex; flex-direction: column; gap: 8px; }
  .tete { display: flex; align-items: center; gap: 6px; min-height: 44px; }
  .retour { width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; flex: none; }
  .tete h1 { font: 700 17px/1.2 var(--sans); flex: 1; }
  .leg-b { width: 28px; height: 28px; border-radius: 50%; box-shadow: inset 0 0 0 1.5px #9a9aa6; font-weight: 700; color: var(--gris); display: inline-flex; align-items: center; justify-content: center; flex: none; text-align: center; }
  .ctx { display: flex; flex-wrap: wrap; gap: 4px; }
  .ctx [data-contexte] { display: inline-flex; align-items: center; height: 22px; padding: 0 8px; border-radius: 11px; background: #fff; box-shadow: inset 0 0 0 1px #d6d8de; font-size: 12px; color: var(--encre); }
  .ctx [data-contexte="base"] { font-weight: 700; box-shadow: inset 0 0 0 1.5px var(--encre); }
  .pt { display: inline-block; width: 8px; height: 8px; border-radius: 50%; flex: none; }
  .hn { display: inline-flex; align-items: center; gap: 5px; font-weight: 700; font-size: 14px; white-space: nowrap; border-radius: 2px; }
  .al { display: inline-flex; align-items: center; gap: 2px; font: 600 12px/1 var(--sans); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .al::before { content: 'α'; font: 400 12px var(--sans); color: var(--gris); margin-right: 2px; }
  .al.fi { font-weight: 400; color: var(--gris); }
  .al .ic { color: var(--gris); }
  .us { font-size: 12px; font-weight: 600; background: none; padding: 0; } .us.deduit { font-weight: 400; color: var(--gris); }
  .stk { display: inline-flex; color: var(--gris); }
  .doses { display: flex; flex-direction: column; gap: 4px; }
  .cible, .cand { display: flex; flex-direction: column; gap: 5px; padding: 9px 10px 8px; border-radius: 8px; background: #fff; width: 100%; }
  .cible { background: transparent; box-shadow: inset 0 0 0 1.5px #b9bcc6; }
  .cand { box-shadow: inset 3px 0 0 var(--c); }
  .cand[aria-pressed="true"] { box-shadow: inset 3px 0 0 var(--c), inset 0 0 0 2px var(--c); }
  .libre { display: flex; flex-direction: column; gap: 4px; }
  .l1, .l2 { display: flex; align-items: center; gap: 7px; min-width: 0; }
  .porte { font-size: 12px; font-weight: 700; color: var(--gris); white-space: nowrap; }
  .dose { margin-left: auto; font: 700 14px/1 var(--sans); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .proche { font-size: 12px; font-weight: 600; color: #2f6b4f; white-space: nowrap; }
  .piste { position: relative; width: ${PW}px; height: 12px; flex: none; }
  .piste .pz { position: absolute; left: 0; right: 0; top: 5px; height: 2px; background: #e3e5ea; border-radius: 2px; }
  .piste .pg { position: absolute; top: 4px; width: 1px; height: 4px; background: #c4c6ce; }
  .piste .pb { position: absolute; left: 0; top: 2px; height: 8px; border-radius: 2px; background: var(--c); }
  .piste .pb.cib { background: #fff; box-shadow: inset 0 0 0 1.5px var(--encre); }
  .piste .pr { position: absolute; top: -1px; width: 2px; height: 14px; background: var(--encre); }
  .gr { font: 600 12px/1 var(--sans); font-variant-numeric: tabular-nums; color: var(--gris); white-space: nowrap; width: 34px; }
  .conf { font-size: 12px; color: var(--gris); margin-left: auto; }
  .gain { display: inline-flex; align-items: center; gap: 2px; }
  .gain b { font: 700 14px/1 var(--sans); color: var(--gris); margin-right: 1px; }
  .gain.plus { margin-left: auto; }
  .gain.moins:first-of-type { margin-left: auto; }
  .bloc { background: #fff; border-radius: 8px; padding: 9px 10px; display: flex; flex-direction: column; gap: 7px; }
  .h2 { font: 700 14px/1.2 var(--sans); display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .h2 .contre { font-weight: 400; color: var(--gris); }
  .sim { display: inline-flex; align-items: center; height: 20px; padding: 0 7px; border-radius: 10px; background: #f1f2f5; font-size: 12px; color: var(--gris); white-space: nowrap; }
  .mes { font-size: 12px; font-weight: 600; color: #2f6b4f; }
  .radars { padding: 9px 6px; }
  .rad-t { padding: 0 4px; display: flex; align-items: center; justify-content: space-between; }
  .seg { display: inline-flex; }
  .seg button { height: 26px; padding: 0 10px; font-size: 12px; }
  .multi { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 4px; justify-items: center; }
  .un-radar { display: flex; flex-direction: column; align-items: center; }
  .un-radar figcaption { font-size: 14px; }
  .un-radar .pi.inc { opacity: .45; }
  .un-radar .zone { fill: #eef0f3; stroke: #c4c6ce; stroke-width: 1; }
  .rq { font: 700 12px var(--sans); fill: #55555f; }
  .taux { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; font-size: 12px; padding: 0 2px; }
  .taux b { font-size: 12px; } .taux span { display: inline-flex; align-items: center; gap: 4px; font-variant-numeric: tabular-nums; }
  .taux .sim { font-family: var(--sans); }
  .det { margin-top: 24px; background: #fff; border-radius: 8px; padding: 9px 10px; display: flex; flex-direction: column; gap: 6px; }
  .brs { display: flex; flex-direction: column; gap: 3px; }
  .br { display: grid; grid-template-columns: 16px 62px ${TW}px 1fr; align-items: center; column-gap: 6px; height: 20px; --z: var(--z-st); --c: var(--c-st); --b: var(--b-st); --h: var(--h-st); --n: var(--n-st); --a: var(--a-st); }
  body.abs .br { --z: var(--z-ab); --c: var(--c-ab); --b: var(--b-ab); --h: var(--h-ab); --n: var(--n-ab); --a: var(--a-ab); }
  .bn { font-size: 12px; color: var(--ft); font-weight: 600; white-space: nowrap; }
  .tr { position: relative; height: 14px; }
  .tr::before { content: ''; position: absolute; left: 0; right: 0; top: 6px; height: 2px; background: #eceef2; border-radius: 2px; }
  .tz { position: absolute; left: 0; top: 0; height: 14px; width: var(--z); background: var(--ff); border-radius: 2px; }
  .tb { position: absolute; left: 0; top: 3px; height: 8px; width: var(--c); background: var(--fb); border-radius: 2px; }
  .br.hors .tb { background: linear-gradient(90deg, var(--fb) 0 var(--z), ${ACC} var(--z)); }
  .tw { position: absolute; top: 6px; height: 2px; left: var(--b); width: calc(var(--h) - var(--b)); background: var(--ft); opacity: .45; }
  .tx { display: none; }
  .tn { position: absolute; top: -1px; height: 16px; width: 2px; left: calc(var(--n) - 1px); background: var(--encre); }
  .ta { position: absolute; top: 2px; height: 10px; width: 2px; left: calc(var(--a) - 1px); background: #8a8f99; }
  .br.inc .tz { background: repeating-linear-gradient(135deg, #fff 0 3px, #c4c6ce 3px 5px); }
  .bd { font: 600 12px/1 var(--sans); font-variant-numeric: tabular-nums; color: var(--gris); white-space: nowrap; }
  .bd.up { color: var(--encre); } .bd.dn { color: var(--encre); }
  .src { font-size: 12px; color: var(--gris); }
  .pont a { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px; border-radius: 16px; background: var(--encre); color: #fff; font-weight: 700; font-size: 14px; text-decoration: none; }
  .ligne-mots { display: flex; flex-wrap: wrap; gap: 4px; }
  .mot { display: inline-flex; align-items: center; height: 22px; padding: 0 8px; border-radius: 11px; box-shadow: inset 0 0 0 1px #9a9aa6; font-size: 12px; }
  .src .pi { display: inline-block; vertical-align: -2px; }
  .osu-l { display: flex; gap: 8px; align-items: flex-start; }
  .ot { font: 400 12px var(--sans); } .ot.g { fill: #55555f; }
  .osu-t { font-size: 12px; }
  .num { font: 600 12px/1.2 var(--sans); font-variant-numeric: tabular-nums; }
  .ouvre-l { display: flex; gap: 6px; flex-wrap: wrap; }
  .ouvre { display: inline-flex; align-items: center; gap: 5px; height: 32px; padding: 0 10px; border-radius: 16px; background: #fff; font-size: 14px; font-weight: 600; }
  .ouvre[aria-expanded="true"] .ic { transform: rotate(180deg); }
  .ch-t, .ch-r { display: grid; grid-template-columns: 1fr repeat(4, 58px); align-items: center; column-gap: 4px; }
  .ch-t .hn { font-size: 12px; white-space: normal; line-height: 1.1; }
  .ch-r { min-height: 26px; border-top: 1px solid #eceef2; }
  .ch-n { display: flex; align-items: center; gap: 2px; font-size: 12px; flex-wrap: wrap; }
  .ch-n span { margin-left: 2px; font-weight: 600; } .ch-n small { font-size: 12px; color: var(--gris); width: 100%; padding-left: 0; }
  .ch-v { font-size: 12px; }
  .vi { display: inline-flex; align-items: center; gap: 3px; color: var(--gris); font-size: 12px; }
  .hach { display: inline-block; width: 10px; height: 10px; border-radius: 2px; background: repeating-linear-gradient(135deg, #fff 0 2px, #9aa0ab 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; }
  .vr { display: flex; justify-content: space-between; gap: 8px; border-top: 1px solid #eceef2; padding-top: 5px; }
  .vr-q { display: flex; flex-direction: column; gap: 1px; } .vr-c, .vr-s { font-size: 12px; color: var(--gris); }
  .vr-v { display: flex; flex-direction: column; align-items: flex-end; } .vr-v .num { font-size: 14px; }
  .pied { font-size: 12px; color: var(--gris); }
  .voile { position: fixed; inset: 0; background: rgba(22,22,26,.3); z-index: 30; }
  .leg { position: fixed; left: 0; right: 0; bottom: 0; max-width: 390px; margin: 0 auto; max-height: 80vh; overflow: auto; background: #fff; border-radius: 8px 8px 0 0; padding: 10px 14px 16px; z-index: 31; display: flex; flex-direction: column; gap: 7px; font-size: 12px; }
  .leg p .ic { display: inline-block; vertical-align: -2px; }
  .leg-t { display: flex; align-items: center; justify-content: space-between; font-size: 14px; }
  .leg-x { width: 32px; height: 32px; border-radius: 50%; background: #ececf1; display: inline-flex; align-items: center; justify-content: center; }
`;

const JS = `
const LB = document.querySelector('[data-role="legende-bouton"]'), LG = document.getElementById('legende'), LV = document.querySelector('[data-role="legende-voile"]');
const legende = (on) => { LG.hidden = !on; LV.hidden = !on; LB.setAttribute('aria-expanded', String(on)); };
LB.addEventListener('click', () => legende(LB.getAttribute('aria-expanded') !== 'true'));
document.querySelector('[data-role="legende-fermer"]').addEventListener('click', () => legende(false));
LV.addEventListener('click', () => legende(false));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !LG.hidden) legende(false); });
if (/[?&]legende\\b/.test(location.search)) legende(true);
// Le candidat mis en avant : le seul facteur libre.
function mettreEnAvant(n) {
  document.querySelectorAll('.cand').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.voie === n)));
  document.querySelectorAll('[data-det]').forEach((d) => { d.hidden = d.dataset.det !== n; });
  document.querySelectorAll('.un-radar').forEach((r) => r.classList.toggle('vu', r.dataset.r === n));
}
document.querySelectorAll('.cand').forEach((b) => b.addEventListener('click', () => mettreEnAvant(b.dataset.voie)));
const qa = new URLSearchParams(location.search).get('avant'); if (qa) mettreEnAvant(qa);
// Les acquis à un toucher.
document.querySelectorAll('button[aria-controls]:not([data-role="legende-bouton"])').forEach((b) => b.addEventListener('click', () => {
  const c = document.getElementById(b.getAttribute('aria-controls')), ouvert = b.getAttribute('aria-expanded') === 'true';
  c.hidden = ouvert; b.setAttribute('aria-expanded', String(!ouvert));
}));
const qo = new URLSearchParams(location.search).get('ouvre'); if (qo) { const b = document.querySelector('[data-ouvre-acquis="' + qo + '"]'); if (b) { b.click(); setTimeout(() => document.getElementById(b.getAttribute('aria-controls')).scrollIntoView(), 0); } }
// Au style / absolu : les radars changent d'échelle (les barres suivent par CSS).
function lecture(abs) {
  document.querySelectorAll('[data-radar] [data-st]').forEach((e) => {
    const v = e.getAttribute(abs ? 'data-abs' : 'data-st');
    if (e.tagName === 'polygon') e.setAttribute('points', v);
    else if (e.tagName === 'path') e.setAttribute('d', v);
    else if (e.tagName === 'circle') { const [x, y] = v.split(','); e.setAttribute('cx', x); e.setAttribute('cy', y); }
  });
}
document.querySelectorAll('.lentille [data-e]').forEach((b) => b.addEventListener('click', () => setTimeout(() => lecture(document.body.classList.contains('abs')), 0)));
document.querySelectorAll('.pont a').forEach((a) => a.addEventListener('click', (e) => e.preventDefault()));
`;

// ---------- la fiche g1 (runtime de l8g), pour nos quatre houblons ; option A sur Nelson ----------
const uniq = (xs) => { const vu = new Set(); return xs.filter((w) => { const k = w.toLowerCase(); if (vu.has(k)) return false; vu.add(k); return true; }).map((w) => w.toLowerCase()); };
const NOMS_H = { myrcene: 'myrcène', humulene: 'humulène', caryophyllene: 'caryophyllène', farnesene: 'farnésène', linalool: 'linalol' };
const ps = (s) => ({ src: s.source, an: s.annee ?? null, min: s.min, max: s.max });
function ficheDe(n) {
  const f = H[n], comp = (f.huiles && f.huiles.composants) || {}, Al = ALPHA[n];
  let aromes = f.aromes.filter((a) => a.sources > 0).map((a) => ({ f: a.family, n: a.sources, of: a.of, auteurs: a.authors || [], mots: uniq((a.mots || []).flatMap((m) => m.mots)), premier: a.sources === 1 && (a.premier || []).length > 0 }));
  let sans = uniq((f.motsSansFamille || []).map((s) => s.mot));
  const dep = (f.motsSansFamille || []).filter((m) => A.mots.includes(m.mot.toLowerCase()));
  if (dep.length) { // option A : la groseille à maquereau rangée dans Petits fruits
    const auteurs = [...new Set(dep.map((m) => m.source))], of = (f.aromes[0] || {}).of || 0;
    aromes = aromes.filter((a) => a.f !== A.famille).concat([{ f: A.famille, n: auteurs.length, of, auteurs, mots: uniq(dep.map((m) => m.mot)), premier: false }]);
    sans = sans.filter((m) => !A.mots.includes(m));
  }
  return {
    nom: n, role: { v: f.role.value, src: deduit(f) ? 'règle' : 'fournisseur', txt: (f.role.source || '').replace(/^[^:]+ : /, '') }, voie: null, stock: STOCK[n], ajout: null,
    alphaC1: { lot: Al.lot, lotSource: Al.de, fiches: Al.fiches, horsFiches: Al.hors },
    origine: (f.composes && f.composes.origine) || null, alpha: f.alpha.sources.map(ps), lot: Al.lot,
    beta: ((f.beta && f.beta.sources) || []).map(ps), huiles: ((f.huiles && f.huiles.totale && f.huiles.totale.sources) || []).map(ps),
    composants: Object.entries(NOMS_H).map(([k, nm]) => (comp[k] ? { nom: nm, min: comp[k].min, max: comp[k].max, src: comp[k].source } : { nom: nm, raison: comp[k + 'Raison'] || null })),
    aromes, of: (f.aromes[0] || {}).of || 0, sans,
    styles: (f.usage || []).flatMap((u) => u.styles || []), stylesSrc: (f.usage || []).map((u) => u.source).filter(Boolean), stylesRaison: null,
    desc: [], subs: [], subsRaison: n === CIBLE ? 'cette page : Cascade, Idaho 7 ou Galaxy, à effet égal sur les agrumes' : 'non renseigné dans le pack',
  };
}
const FICHES = Object.fromEntries(TOUS.map((n) => [n, ficheDe(n)]));
const rt = runtime({ extra: '' })
  .replace(/const FD = [^\n]*;\nconst ROUE/, 'const FD = ' + JSON.stringify(FICHES) + ';\nconst ROUE')
  .replace(/DEMANDE = \[[^\]]*\]/, 'DEMANDE = ' + JSON.stringify([{ f: 'citrus', s: 1 }]));
if (!rt.includes('"Nelson Sauvin"')) throw new Error('fiches non injectées dans le runtime');

const FICHE_PLUS = `
  .f-fiche { font-family: var(--sans); }
  .f-nom { font-size: 17px; } .f-lot, .f-cpt, .f-lab-mots, .f-lab-sans, .f-lab-nd, .f-seule, .f-dem, .f-repli, .f-sec, .f-tag { font-size: 12px; }
  .f-alpha .al { font-size: 14px; }
  .f-note { flex-basis: 100%; font-size: 12px; color: var(--fi-gris); }
  .f-col { width: 20px; display: inline-flex; flex-direction: column; align-items: center; gap: 2px; }
  .f-colz { position: relative; width: 13px; height: 22px; }
  .f-colz::after { content: ''; position: absolute; left: -2px; right: -2px; bottom: 0; height: 1px; background: var(--trait2); }
  .f-colb { position: absolute; left: 0; right: 0; bottom: 1px; height: var(--h); background: var(--b); border-radius: 2px 2px 0 0; }
  .f-col.ci .f-colb { background: var(--f); box-shadow: inset 0 0 0 1.5px var(--b); }
  .f-col .pi { width: 14px; height: 14px; }
  .f-lab { grid-template-columns: 16px 1fr; }
  .f-lab .pi { grid-row: span 2; align-self: start; margin-top: 1px; }
  .r-pi.inc { opacity: .5; }`;

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ? (r6i, sans Nelson Sauvin, effet égal)</title>
<!-- Lot 22 · r6i · généré par generer.mjs depuis donnees/comparer-stout.json. Choix portés : radar r3 ; base effet égal (agrumes) ; porte oui (Nelson Sauvin) ; descripteurs A. -->
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
<style>${HABILLAGE}
${CSS_FICHE}
${FICHE_PLUS}
${css}</style>
</head>
<body>
${SYMB}
<main class="ecran">${corps}
</main>
${legende}
<script>${JS}</script>
<script>${rt}</script>
</body>
</html>
`;
const out = path.join(ICI, 'etat.html');
fs.writeFileSync(out, html);
console.log('écrit ' + path.relative(REPO, out).replace(/\\/g, '/') + ' (' + Math.round(html.length / 1024) + ' Ko)');
