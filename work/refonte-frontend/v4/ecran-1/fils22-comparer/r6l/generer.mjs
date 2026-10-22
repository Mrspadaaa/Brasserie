// Lot 22 · r6l · « Des cartes à glisser » — Comparer : « Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ? »
// Un houblon en grand, les autres en vignettes : on glisse une vignette sur la grande carte (ou on la
// touche), on glisse la grande carte de côté pour passer au suivant. Nelson Sauvin, pas en stock, est
// épinglé en tête du rail : c'est la cible. Chaque candidat est posé à IBU égal (10 IBU à 10′, dose tirée
// des données), et ses barres bougent face aux repères fixes de la cible.
// Choix portés : Radar r2 · Base IBU égal · Porte oui (Nelson Sauvin) · Descripteurs A.
// Seule source : ../donnees/comparer-stout.json (voie r6e). Opérations faites ici, et rien d'autre :
//   - interpolation linéaire de la grille du moteur (moment b10, US-05) entre 0 (ta bière), 1, 2, 4 et
//     8 g/L, à la dose d'IBU égal ;
//   - mises à l'échelle (domaine au style de echelle.parFamille, ou 0–100 en absolu) ;
//   - sommes : l'écart à la cible = somme, sur les 12 familles, de |gain du candidat − gain de la cible| ;
//   - unions de plages publiées (min des bas, max des hauts) pour les composés ;
//   - option A : « groseille à maquereau » et « gooseberry » de Nelson Sauvin rangés en Petits fruits.
// Usage : node generer.mjs  →  etat.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(ICI, '../../../../../..');
const lire = (f) => fs.readFileSync(f, 'utf8');
const D = JSON.parse(lire(path.join(ICI, '../donnees/comparer-stout.json')));
const JET = JSON.parse(lire(path.join(REPO, 'work/refonte-frontend/v4/ecran-1/fils17-standard/jetons-familles.json')));
const V3 = lire(path.join(REPO, 'work/refonte-frontend/v4/ecran-1/fils17-standard/v3/planche.html'));

// ---------- familles ----------
const ROUE = ['citrus', 'tropical', 'melon', 'stoneFruit', 'pomeFruit', 'berries', 'floral', 'green', 'herbal', 'spice', 'earthy', 'resin'];
const ORDRE = ['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'stoneFruit', 'pomeFruit', 'berries', 'melon', 'resin', 'spice', 'green'];
const COURT = { floral: 'Floral', herbal: 'Herbacé', earthy: 'Terreux', citrus: 'Agrumes', tropical: 'Tropicaux', stoneFruit: 'Noyau', pomeFruit: 'Pépins', berries: 'Baies', melon: 'Melon', resin: 'Résineux', spice: 'Épicé', green: 'Végétal' };
const NOMF = Object.fromEntries(D.familles.map((f) => [f.id, f.nom]));
const ATTENDUES = Object.entries(D.style.zone).filter(([, z]) => z.statut === 'attendue').map(([f]) => f);

// ---------- houblons ----------
const CANDIDATS = ['Cascade', 'Idaho 7', 'Galaxy'];
const CIBLE = 'Nelson Sauvin';
const TOUS = [CIBLE, ...CANDIDATS];
// Une couleur par houblon (D51), hors du code des arômes ; la cible en charbon (cave-800 de DESIGN.md).
const COUL = { Cascade: '#781838', 'Idaho 7': '#0b6e8a', Galaxy: '#681878', [CIBLE]: '#2c2521' };
const H = Object.fromEntries(D.houblons.map((h) => [h.nom, h]));
const IBU = D.egalites.ibuEgal.find((e) => e.moment === 'b10');
const AV = D.biere.avant;

const r1 = (x) => Math.round(x * 10) / 10;
const fr = (x, n = 1) => String(Math.round(x * 10 ** n) / 10 ** n).replace('.', ',');
const plage = (a, b, n = 1) => (a == null && b == null ? 'inconnu' : a == null ? '< ' + fr(b, n) : b == null ? '> ' + fr(a, n) : a === b ? fr(a, n) : fr(a, n) + '–' + fr(b, n));

// Interpolation dans la grille (b10, US-05) ; dose 0 = ta bière (avant).
function aIbuEgal(h, dose) {
  const pts = h.grille.filter((e) => e.moment === 'b10' && e.levure === 'fermentis-us05').sort((a, b) => a.dose_gL - b.dose_gL)
    .map((e) => ({ d: e.dose_gL, apres: e.apres, delta: e.delta, conf: e.confiance }));
  const zero = { d: 0, apres: Object.fromEntries(ROUE.map((f) => [f, [AV[f].bas, AV[f].centre, AV[f].haut]])), delta: Object.fromEntries(ROUE.map((f) => [f, 0])) };
  const all = [zero, ...pts];
  let i = 0;
  while (i < all.length - 2 && all[i + 1].d < dose) i++;
  const a = all[i], b = all[i + 1], t = (dose - a.d) / (b.d - a.d);
  const L = (x, y) => x + t * (y - x);
  const out = { dose, entre: [a.d, b.d], conf: b.conf, f: {} };
  for (const f of ROUE) out.f[f] = { bas: L(a.apres[f][0], b.apres[f][0]), centre: L(a.apres[f][1], b.apres[f][1]), haut: L(a.apres[f][2], b.apres[f][2]), delta: L(a.delta[f], b.delta[f]) };
  return out;
}
const SIM = Object.fromEntries(TOUS.map((n) => [n, aIbuEgal(H[n], IBU.doses[n])]));
const ECART = Object.fromEntries(CANDIDATS.map((n) => [n, ROUE.reduce((s, f) => s + Math.abs(SIM[n].f[f].delta - SIM[CIBLE].f[f].delta), 0)]));
const RANG = [...CANDIDATS].sort((a, b) => ECART[a] - ECART[b]);
const CRAN = Object.fromEntries(ROUE.map((f) => [f, D.echelle.parFamille[f].cran]));
const maxCrans = Math.max(...CANDIDATS.flatMap((n) => ROUE.map((f) => Math.abs(SIM[n].f[f].delta - SIM[CIBLE].f[f].delta) / CRAN[f])));
console.log('écarts à la cible', JSON.stringify(ECART), 'rang', RANG.join(' > '), 'plus grand écart', fr(maxCrans, 2), 'cran');

// ---------- fiches (aromes du pack), option A ----------
function fiche(n) {
  const h = H[n];
  const fam = {};
  for (const a of h.aromes) fam[a.family] = { niv: a.level, n: a.sources, of: a.of, mots: [...new Set(a.mots.flatMap((m) => m.mots.map((x) => x.toLowerCase())))] };
  let sans = h.motsSansFamille.map((m) => m.mot.toLowerCase());
  let A = null;
  const eff = D.descripteurs.A.effets[n];
  if (eff && eff.deplaces.length) {
    const f = D.descripteurs.A.famille;
    const srcs = new Set(h.motsSansFamille.filter((m) => eff.deplaces.includes(m.mot.toLowerCase())).map((m) => m.source));
    const ns = srcs.size, of = fam[f].of;
    fam[f] = { niv: Math.min(2, ns), n: ns, of, mots: eff.deplaces, A: true };
    sans = sans.filter((m) => !eff.deplaces.includes(m));
    A = { famille: f, mots: eff.deplaces };
  }
  // Concepts sans famille, dédoublonnés (anglais et français d'un même mot, une fois).
  const PAIRES = { 'white wine': 'vin blanc', grape: 'raisin', fruity: 'fruité', gooseberry: 'groseille à maquereau' };
  sans = [...new Set(sans.map((m) => PAIRES[m] || m))];
  const of = h.aromes[0].of;
  const sources = [...new Set([...h.aromes.flatMap((a) => [...a.authors, ...a.mots.map((m) => m.source)]), ...h.motsSansFamille.map((m) => m.source)])];
  return { fam, sans, A, of, sources };
}
const FICHE = Object.fromEntries(TOUS.map((n) => [n, fiche(n)]));

// ---------- α, rôle, stock ----------
const ALPHA = Object.fromEntries(TOUS.map((n) => {
  const a = H[n].alpha, lo = Math.min(...a.sources.map((s) => s.min)), hi = Math.max(...a.sources.map((s) => s.max));
  const fiches = { lo, hi, txt: plage(lo, hi), src: a.sources.map((s) => s.source + ' ' + s.annee).join(', ') };
  if (n === CIBLE) return [n, { txt: fiches.txt + '%', source: 'fiches', fiches, horsFiches: false, note: 'pas en stock, plage des fiches ; sa dose d’IBU égal suit l’α ' + fr(a.retenu.value) + ' % lu sur l’article' + (a.retenu.value < lo || a.retenu.value > hi ? ', hors de ses fiches' : '') }];
  const v = a.retenu.value;
  return [n, { txt: fr(v) + '%', source: 'lot', fiches, horsFiches: v < lo || v > hi, from: a.retenu.from }];
}));
const ROLE = Object.fromEntries(TOUS.map((n) => [n, { mot: H[n].role.value, deduit: !/^fournisseur/.test(H[n].role.source) }]));

// ---------- chimie et vraies valeurs ----------
// Abréviations visibles, expliquées au pied du panneau : BM = Beer Maverick, HS = Hopsteiner.
const SRCNOM = (s) => (/^bm-/.test(s) ? 'BM' : /^hs-/.test(s) ? 'HS' : /^coa-/.test(s) ? 'COA' : s);
function union(vals) {
  if (!vals || !vals.length) return null;
  // Union des plages publiées : le plus petit bas, le plus grand haut ; une borne absente reste absente
  // (« < 10 » ou « > 10 »), jamais 0.
  const lo = vals.map((v) => v.plage[0]).filter((x) => x != null), hi = vals.map((v) => v.plage[1]).filter((x) => x != null);
  return { lo: lo.length ? Math.min(...lo) : null, hi: hi.length ? Math.max(...hi) : null, src: [...new Set(vals.flatMap((v) => v.sources).map(SRCNOM))] };
}
const COMPOSES = [
  { k: 'huile', nom: 'Huile', u: 'mL/100 g', fams: [] },
  { k: 'myrcene', nom: 'Myrcène', u: '% huile', fams: ['resin', 'green'] },
  { k: 'linalol', nom: 'Linalol', u: '% huile', fams: ['floral', 'citrus'] },
  { k: 'geraniol', nom: 'Géraniol', u: '% huile', fams: ['floral'] },
  { k: 'humulene', nom: 'Humulène', u: '% huile', fams: ['resin', 'spice'] },
  { k: 'caryophyllene', nom: 'Caryophyllène', u: '% huile', fams: ['spice'] },
  { k: 'farnesene', nom: 'Farnésène', u: '% huile', fams: ['green', 'herbal'] },
  { k: '4MMP', nom: '4MMP', u: 'µg/kg', fams: ['tropical', 'berries'] },
  { k: '3MH', nom: '3MH', u: 'µg/kg', fams: ['citrus', 'tropical'] },
];
const CHIMIE = Object.fromEntries(TOUS.map((n) => {
  const c = H[n].composes;
  return [n, Object.fromEntries(COMPOSES.map((k) => {
    if (k.k === 'huile') return [k.k, union(c.huile.valeurs)];
    const x = c.composes[k.k];
    if (x && x.valeurs) return [k.k, union(x.valeurs)];
    // Une somme publiée (3MH + 3M4MP > 10 µg/kg) dit « au moins une part », pas la valeur.
    return [k.k, x && x.raison ? { lo: null, hi: null, src: [], raison: k.nom + ' : ' + x.raison } : null];
  }))];
}));
const VRAIES = Object.fromEntries(TOUS.map((n) => {
  const h = H[n], c = h.composes;
  const r = [];
  const m = (lab, u, srcs) => ({ lab, u, lo: Math.min(...srcs.map((s) => s.min)), hi: Math.max(...srcs.map((s) => s.max)), src: srcs.map((s) => s.source + ' ' + s.annee).join(', ') });
  r.push({ k: 'alpha', ...m('α', '%', h.alpha.sources) });
  r.push({ k: 'beta', ...m('β', '%', h.beta.sources) });
  r.push({ k: 'huile', ...m('Huile', 'mL/100 g', h.huiles.totale.sources) });
  const lots = (c.lots || []).filter((l) => l.huile != null && /^coa-/.test(l.sources[0]));
  const lot = lots.length ? { lo: Math.min(...lots.map((l) => l.huile)), hi: Math.max(...lots.map((l) => l.huile)), n: lots.length, src: 'COA ' + lots.map((l) => l.id).join(', ') } : null;
  const biere = (c.mesuresEnBiere || []).filter((x) => x.unite === 'µg/L').map((x) => ({ compose: x.compose, v: x.plage[0], u: x.unite, dose: x.doseGL, moment: x.moment, src: x.sources.join(', '), texte: x.texte }));
  return [n, { lignes: r, lot, biere }];
}));
const PANEL = Object.fromEntries(TOUS.map((n) => [n, (H[n].composes.panel || []).map((p) => ({ t: p.texte, s: p.sources.join(', ') }))]));

// ---------- barres : familles montrées ----------
const ROWS = ORDRE.filter((f) => Math.max(...TOUS.map((n) => SIM[n].f[f].delta)) >= 2.5);
const AUTRES = ORDRE.filter((f) => !ROWS.includes(f));
const TOP = Object.fromEntries(TOUS.map((n) => [n, [...ROUE].filter((f) => SIM[n].f[f].delta > 0.5).sort((a, b) => SIM[n].f[b].delta - SIM[n].f[a].delta).slice(0, 4)]));
console.log('rangées', ROWS.join(','), '· autres', AUTRES.join(','));

// ---------- icônes ----------
const SYM = {};
for (const m of V3.matchAll(/<symbol id="(p-[a-zA-Z]+)" viewBox="([^"]+)"[^>]*>([\s\S]*?)<\/symbol>/g)) SYM[m[1]] = m[3];
function lucide(nom) {
  const t = lire(path.join(REPO, 'node_modules/lucide-react/dist/esm/icons/' + nom + '.mjs')).match(/const __iconNode = (\[[\s\S]*?\]);\nconst/)[1];
  return new Function('return ' + t)().map(([tag, a]) => '<' + tag + ' ' + Object.entries(a).filter(([k]) => k !== 'key').map(([k, v]) => k + '="' + v + '"').join(' ') + '/>').join('');
}
const ACT = { pin: 'pin', stock: 'package', achat: 'shopping-cart', x: 'x', retour: 'chevron-left', bas: 'chevron-down', fleche: 'arrow-right', coeur: 'heart', ban: 'ban', diff: 'equal-not', grip: 'grip-horizontal', inc: 'circle-question-mark' };
const TAILLES = [12, 14, 16, 18];
let SYMB = '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">';
for (const f of ROUE) SYMB += `<symbol id="p-${f}" viewBox="0 0 24 24" fill="none" stroke="${JET[f].base}" stroke-width="2.571" stroke-linecap="round" stroke-linejoin="round">${SYM['p-' + f]}</symbol>`;
// Une seule épaisseur rendue (1,5 px) à chaque taille (controle-standard S4).
for (const z of TAILLES) for (const [k, nom] of Object.entries(ACT)) SYMB += `<symbol id="i-${k}-${z}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${Math.round((1.5 * 24 / z) * 1000) / 1000}" stroke-linecap="round" stroke-linejoin="round">${lucide(nom)}</symbol>`;
SYMB += '</svg>';
const ic = (k, z = 14, cls = 'ic', lab = '') => `<svg class="${cls}" width="${z}" height="${z}" ${lab ? `role="img" aria-label="${lab}"` : 'aria-hidden="true"'}><use href="#i-${k}-${z}"/></svg>`;
const pic = (f, z = 16) => `<svg class="pi" width="${z}" height="${z}" data-famille="${f}" role="img" aria-label="${NOMF[f]}"><use href="#p-${f}"/></svg>`;

// ---------- données du client ----------
const CLIENT = {
  ROUE, ORDRE, COURT, NOMF, ATTENDUES, ROWS, AUTRES, CANDIDATS, CIBLE, COUL, RANG, TOP,
  JET: Object.fromEntries(ROUE.map((f) => [f, JET[f]])),
  DOM: Object.fromEntries(ROUE.map((f) => [f, D.echelle.parFamille[f].domaine[1]])),
  BANDE: Object.fromEntries(ROUE.map((f) => [f, D.echelle.parFamille[f].bande])),
  CRAN,
  AVANT: Object.fromEntries(ROUE.map((f) => [f, { c: r1(AV[f].centre), inconnu: !!AV[f].inconnu, source: AV[f].source }])),
  SIM: Object.fromEntries(TOUS.map((n) => [n, { dose: SIM[n].dose, g: Math.round(SIM[n].dose * 20), f: Object.fromEntries(ROUE.map((f) => [f, { c: Math.round(SIM[n].f[f].centre * 100) / 100, h: r1(SIM[n].f[f].haut), d: Math.round(SIM[n].f[f].delta * 100) / 100 }])) }])),
  ECART: Object.fromEntries(CANDIDATS.map((n) => [n, r1(ECART[n])])),
  FICHE, ALPHA, ROLE, COMPOSES, CHIMIE, VRAIES, PANEL,
  OSU: D.panelOSU,
  maxCrans: r1(maxCrans),
};

// ---------- HTML ----------
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const miniBarres = (n) => `<span class="mb" aria-hidden="true">${TOP[n].map((f) => `<span class="mbc"><i style="--h:${Math.max(3, Math.round(SIM[n].f[f].delta / 9.5 * 22))}px;--c:${JET[f].base}"></i>${pic(f, 12)}</span>`).join('')}</span>`;
const vignette = (n) => {
  const a = ALPHA[n];
  return `<button type="button" class="vg" role="radio" aria-checked="false" aria-label="${esc(n)} en grand" data-v="${esc(n)}" style="--hc:${COUL[n]}">
    <span class="vg-t"><i class="pt" aria-hidden="true"></i><span class="nm" data-houblon="${esc(n)}">${esc(n)}</span></span>
    <span class="vg-a"><span data-role="alpha" data-source="lot">α ${a.txt}</span>${a.horsFiches ? ic('diff', 12, 'ic dif', 'hors de ses fiches ' + a.fiches.txt + ' %') : ''}</span>
    <span class="vg-g"><b>${CLIENT.SIM[n].g}</b> g${ic('stock', 12, 'ic stk', 'en stock')}</span>
    ${miniBarres(n)}
    <span class="vg-vide" aria-hidden="true">${ic('bas', 16)}</span>
  </button>`;
};
const cibleVg = `<div class="vg cible" data-v="${CIBLE}" style="--hc:${COUL[CIBLE]}" aria-label="${CIBLE}, la cible, pas en stock">
    <span class="vg-t">${ic('pin', 12, 'ic pin', 'épinglé')}<span class="nm" data-houblon="${CIBLE}">Nelson Sauvin</span></span>
    <span class="vg-a"><span data-role="alpha" data-source="fiches">α ${ALPHA[CIBLE].txt}</span></span>
    <span class="vg-g"><b>cible</b>${ic('achat', 12, 'ic stk', 'pas en stock')}</span>
    ${miniBarres(CIBLE)}
  </div>`;

const rangees = `<div class="rg-h"><span class="sim" data-nature="simule">~ simulé</span><span class="gh"><span class="g1">1 cran</span></span><span class="zh">16D</span></div>` + ROWS.map((f) => `<div class="rg${ATTENDUES.includes(f) ? " att" : ""}" data-f="${f}">
    <span class="rg-n">${pic(f, 16)}<span class="rg-m" style="color:${JET[f].texte}">${COURT[f]}</span></span>
    <span class="rg-p" data-role="gain"><span class="gt"></span><span class="br" style="background:${JET[f].base}"></span><span class="ci" aria-hidden="true"></span></span>
    <span class="rg-z" data-role="piste"><span class="zo" data-role="zone" style="background:${JET[f].fond};border-color:${JET[f].base}"></span><span class="av" style="background:${JET[f].base}"></span><span class="hs"></span><span class="pl"></span><span class="tb"></span></span>
  </div>`).join("");

const legende = `<div id="leg" class="leg" data-role="legende" hidden>
  <p><b>~ simulé</b> : ce que chaque houblon ajoute à ta stout, dosé pour 10 IBU à 10′ (grille du moteur interpolée, US-05). <span class="lk"><i class="k-br"></i></span>sur un cran de ta 16D ; <span class="lk"><i class="k-ci"></i></span>Nelson Sauvin au même IBU, la cible.</p>
  <p>À droite, ta stout dans sa 16D : <span class="lk"><i class="k-zo"></i></span>la zone, <span class="lk"><i class="k-tb"></i></span>ta bière avant (<b>?</b> inconnue, jamais zéro), <span class="lk"><i class="k-hs"></i></span>hors du style, <span class="lk"><i class="k-pl"></i></span>plage possible, presque toute due à ta bière de départ (Nugget).</p>
  <p><b>Le plus proche</b> : la plus petite somme des écarts à Nelson Sauvin sur les 12 familles. Aucun écart ne dépasse ${fr(maxCrans)} cran : à 10′, ils restent dans l’incertitude.</p>
  <p><b>Radar</b> : ses fiches. Plein, ce que toutes disent ; pâle, ce qu’une seule dit ; <b>?</b> aucune fiche. Rôle « double » : déduit de l’α, à valider.</p>
  <p>Glisse une vignette sur la grande carte, ou la carte de côté. Appui long : la fiche.</p>
</div>`;

const corps = `
<header class="tete">
  <button type="button" class="rt" aria-label="Retour">${ic('retour', 18)}</button>
  <h1 data-role="titre">Lequel pour ma stout ?</h1>
  <span class="lens" data-lecture role="radiogroup" aria-label="Lecture"><button type="button" role="radio" data-e="style" aria-checked="true">Au style</button><button type="button" role="radio" data-e="absolu" aria-checked="false">Absolu</button></span>
  <button type="button" class="aide" data-role="legende-bouton" aria-expanded="false" aria-controls="leg" aria-label="Légende">?</button>
</header>
${legende}
<p class="ctx" data-role="contexte"><span data-contexte="biere">Stout 16D, 20 L</span><span data-contexte="base">10 IBU</span><span data-contexte="moment">10′</span><span data-contexte="levure">US-05</span></p>

<div class="rail">
  ${cibleVg}
  <div class="cands" data-libre="houblon" role="radiogroup" aria-label="Houblon en grand">${CANDIDATS.map(vignette).join('')}</div>
</div>

<section class="hero" data-role="ligne-houblon" aria-live="polite" style="--hc:#000">
  <div class="h-glisse">
    <div class="h-tete">
      <i class="pt" aria-hidden="true"></i><b class="h-nom" data-houblon=""></b>
      <span class="h-a" data-role="alpha" data-source="lot"></span><span class="h-dif"></span>
      <span class="h-u" data-role="usage"></span>${ic('stock', 14, 'ic stk', 'en stock')}
    </div>
    <div class="h-ar"></div>
    <div class="h-do"><span class="mo">10′</span><span class="h-gl"></span><b class="h-g"></b></div>
    <div class="h-ve"><span class="h-rg"></span></div>
  </div>
  <div class="barres">${rangees}</div>
  <p class="bulle" hidden></p>
  <nav class="pont" aria-label="Suite"><a href="#dryhopper" class="pont-a"><span class="pont-t">Dryhopper</span>${ic('fleche', 14)}</a></nav>
</section>

<section class="rad" data-acquis="radar" aria-label="Radar des fiches">
  <div class="rad-t"><b>Ses fiches</b><span class="rad-k"></span></div>
  <div class="rad-b"></div>
</section>

<div class="ouvre" role="group" aria-label="Détails">
  <button type="button" aria-expanded="false" aria-controls="p-valeurs">Vraies valeurs</button>
  <button type="button" aria-expanded="false" aria-controls="p-chimie">Chimie</button>
  <button type="button" aria-expanded="false" aria-controls="p-osu">Panel OSU</button>
</div>
<section id="p-valeurs" class="pan" data-acquis="valeurs" hidden></section>
<section id="p-chimie" class="pan" data-acquis="chimie" hidden></section>
<section id="p-osu" class="pan" data-acquis="osu" data-nature="mesure" data-source="${D.panelOSU.sources.join(' ')}" hidden></section>
<p class="pied">~ simulé : moteur profil-simulé, à valider · ${esc(D.style.code)} : BJCP 2021</p>

<div class="voile" hidden></div>
<section class="fiche" data-role="fiche" role="dialog" aria-modal="true" aria-label="Fiche du houblon" hidden></section>
<div class="fantome" aria-hidden="true" hidden></div>
`;

const css = lire(path.join(ICI, 'style.css'));
const js = lire(path.join(ICI, 'client.js'));
const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>r6l · Lequel pour ma stout ? · des cartes à glisser</title>
<!-- Lot 22 · r6l « Des cartes à glisser » · généré par generer.mjs depuis ../donnees/comparer-stout.json. Ne pas éditer à la main. -->
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=Source+Sans+3:wght@400;600;700&display=swap">
<style>${css}</style></head>
<body class="style">${SYMB}
<main class="page">${corps}</main>
<script>window.R6L=${JSON.stringify(CLIENT)};</script>
<script>${js}</script>
</body></html>`;
fs.writeFileSync(path.join(ICI, 'etat.html'), html);
console.log('écrit etat.html (' + html.length + ' o)');
