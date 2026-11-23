// Lot 22 · r6m · « La phrase et le radar » : « Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ? »
// Le parti : une phrase par houblon, en mots de brasseur, calculée sur le moteur (jamais écrite à la main),
// chiffrée par trois barres de gain (floral, résineux, ce qui vient avec) ; puis les radars r3 (un par
// houblon, et un pour ta stout aujourd'hui), avec l'intervalle bas–haut du moteur ; puis la chimie du cône
// rattachée aux familles, le panel OSU, et les vraies valeurs des fiches derrière un toucher.
// Base de comparaison : IBU égal (10 IBU à 10′, 20 L ; egalites.ibuEgal). Pas de porte « Je n'ai pas X ».
// Descripteurs : option B (part « autres » neutre, réglages du pilote marqués « à corriger par le brasseur »).
// Seule donnée : ../donnees/comparer-stout.json. La page n'en fait que des sommes, des mises à l'échelle et
// des interpolations linéaires (dose entre deux points de la grille, ou entre 0 et 1 g/L à partir de la
// bière avant). Le langage (pictos au trait, α, usage en mot, stock, légende « ? », fiche g1 à l'appui
// long) vient du socle du lot 21 (fils21-choisir/v1/socle.mjs), lu sans être modifié.
// Usage : node generer.mjs  →  r6m/etat.html
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOPS, ORDRE, COURT, JET, fr, esc, M, conf, ic, pic, hn, alpha, usage, stock, srcNom,
  barre, lentille, legende, li, LEG_FAMILLES, LEG_CONF, LEG_HOUBLON, page, ecrire, lireJSON } from '../../fils21-choisir/v1/socle.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const D = lireJSON(path.join(ici, '..', 'donnees', 'comparer-stout.json'));
const HD = Object.fromEntries(D.houblons.map((h) => [h.nom, h]));
const AV = D.biere.avant;
const ECH = D.echelle.parFamille;
const ZONE = D.style.zone;
const IBU = D.egalites.ibuEgal.find((e) => e.moment === 'b10');
const LEVURE = D.egalites.doseEgale.levure;
const CANDIDATS = ['Cascade', 'Idaho 7', 'Galaxy'];
const FRUITS = ['citrus', 'tropical', 'stoneFruit', 'pomeFruit', 'berries', 'melon'];
const r2 = (x) => Math.round(x * 100) / 100;

// ---------- le moteur : la bière après l'ajout, à la dose de 10 IBU à 10′ (interpolation linéaire) ----------
function apres(nom) {
  const H = HD[nom], dose = IBU.doses[nom];
  const g = H.grille.filter((x) => x.moment === IBU.moment && x.levure === LEVURE && x.jours == null);
  const pts = [[0, null], ...[1, 2, 4, 8].map((k) => [k, g.find((x) => x.dose_gL === k)])];
  let i = 1; while (i < pts.length - 1 && dose > pts[i][0]) i++;
  const [a, ga] = pts[i - 1], [b, gb] = pts[i], t = (dose - a) / (b - a);
  const val = (G, f, j) => (G ? G.apres[f][j] : [AV[f].bas, AV[f].centre, AV[f].haut][j]);
  const out = {};
  for (const f of ORDRE) {
    const v = [0, 1, 2].map((j) => val(ga, f, j) + t * (val(gb, f, j) - val(ga, f, j)));
    const inconnu = !!AV[f].inconnu && v.every((x) => x === 0);
    out[f] = { bas: v[0], c: v[1], haut: v[2], inconnu, gainP: v[1] - AV[f].centre, gainC: (v[1] - AV[f].centre) / ECH[f].cran };
  }
  return { dose, entre: [a, b], confiance: gb.confiance, drapeaux: gb.drapeaux, f: out };
}
const A = Object.fromEntries(CANDIDATS.map((n) => [n, apres(n)]));
const hors = (f, v) => v > ECH[f].bande[1];
// Ce qui s'écarte de la 16D : les gains des familles que le style n'attend pas (BJCP : terreux, herbacé, floral).
const ecart = (n) => ORDRE.filter((f) => ZONE[f].statut !== 'attendue').reduce((s, f) => s + Math.max(0, A[n].f[f].gainC), 0);
const fruit = (n) => FRUITS.reduce((s, f) => s + Math.max(0, A[n].f[f].gainC), 0);
const ORDRE_H = [...CANDIDATS].sort((x, y) => ecart(x) - ecart(y));

// ---------- la phrase : choisie par des règles sur ces chiffres, jamais écrite pour un houblon ----------
const DU = { citrus: 'des agrumes', tropical: 'du tropical', stoneFruit: 'du noyau', berries: 'des baies', spice: 'de l’épicé', green: 'du végétal', herbal: 'de l’herbacé', earthy: 'du terreux' };
function phrase(n) {
  const autres = CANDIDATS.filter((x) => x !== n);
  const g = (x, f) => A[x].f[f].gainC;
  const autre = ORDRE.filter((f) => f !== 'floral' && f !== 'resin').sort((p, q) => g(n, q) - g(n, p))[0];
  const minFruit = autres.every((x) => fruit(n) < fruit(x));
  const ratio = fruit(n) / (autres.reduce((s, x) => s + fruit(x), 0) / autres.length);
  const minRes = autres.every((x) => g(n, 'resin') < g(x, 'resin'));
  const maxRes = autres.every((x) => g(n, 'resin') > g(x, 'resin'));
  const maxFl = autres.every((x) => g(n, 'floral') > g(x, 'floral'));
  if (minFruit) return { autre, txt: 'Le plus sage, ' + (ratio <= 0.6 ? 'moitié moins' : 'moins') + ' de fruit.', cle: 'sage', ratio };
  if (minRes) return { autre, txt: 'Le moins résineux, mais ' + DU[autre] + '.', cle: 'moinsRes' };
  if (maxRes) return { autre, txt: (maxFl ? 'Un rien plus floral, ' : '') + 'le plus résineux.', cle: 'plusRes' };
  return { autre, txt: 'Surtout ' + DU[autre] + '.', cle: 'autre' };
}
const PH = Object.fromEntries(CANDIDATS.map((n) => [n, phrase(n)]));
const fl = CANDIDATS.map((n) => A[n].f.floral.gainC), flP = CANDIDATS.map((n) => A[n].f.floral.gainP);
const sg = (x, d = 1) => (x >= 0 ? '+' : '−') + fr(Math.abs(x), d);

// ---------- la barre de gain (l5b couchée) : 0 = ta stout aujourd'hui ; au style en crans, absolu en points ----------
const BMAX_S = Math.max(1, Math.ceil(2 * Math.max(...CANDIDATS.flatMap((n) => ORDRE.map((f) => A[n].f[f].gainC)))) / 2);
const BMAX_A = Math.max(10, Math.ceil(Math.max(...CANDIDATS.flatMap((n) => ORDRE.map((f) => A[n].f[f].gainP))) / 5) * 5);
function gainBar(n, f) {
  const x = A[n].f[f], ho = hors(f, x.c);
  const ws = Math.max(2, (100 * Math.max(0, x.gainC)) / BMAX_S), wa = Math.max(2, (100 * Math.max(0, x.gainP)) / BMAX_A);
  const lab = COURT[f] + ' : ~' + sg(x.gainC) + ' cran de la 16D (' + sg(x.gainP) + ' points sur 100), simulé' + (ho ? ' ; déjà au-delà de la 16D' : '');
  return `<span class="gb" data-famille="${f}" aria-label="${esc(lab)}">${pic(f, 16)}<span class="gb-t" style="--f:${JET[f].fond}"><i class="gb-b${ho ? ' hst' : ''}" data-nature="simule" style="--b:${JET[f].base};--ws:${ws.toFixed(1)}%;--wa:${wa.toFixed(1)}%"></i></span><span class="gb-v st${ho ? ' hst' : ''}" data-nature="simule">~${sg(x.gainC)}</span><span class="gb-v ab${ho ? ' hst' : ''}" data-nature="simule">~${sg(x.gainP, 0)}</span></span>`;
}

// ---------- descripteurs, option B : l'empreinte des fiches, la part « autres » neutre ----------
const B = D.descripteurs.B;
function empreinte(n) {
  const H = HD[n], b = B.parts[n];
  const fams = H.aromes.filter((a) => a.level > 0).map((a) => ({ f: a.family, w: a.mots.reduce((s, m) => s + m.mots.length, 0) || 1 }));
  const tot = fams.reduce((s, x) => s + x.w, 0), reste = 1 - (b.visible ? b.partDessinee : 0);
  const segs = fams.map((x) => `<i class="em-s" data-famille="${x.f}" style="flex:${(reste * x.w / tot).toFixed(3)};background:${JET[x.f].base}"></i>`).join('');
  const aut = b.visible ? `<i class="em-a" data-role="autres" data-houblon="${esc(n)}" data-part="${String(b.partDessinee).replace('.', ',')}" style="flex:${b.partDessinee}" aria-label="autres : ${esc(b.concepts.join(', '))}, ${Math.round(100 * b.part)} % des mots de ses fiches, sans famille"></i>` : '';
  const lab = 'Ses fiches : ' + fams.map((x) => COURT[x.f].toLowerCase()).join(', ') + (b.visible ? ' ; autres (' + b.concepts.join(', ') + ')' : '');
  return `<span class="em" aria-label="${esc(lab)}">${ic('livre', 12)}<span class="em-b">${segs}${aut}</span>${b.visible ? '<span class="em-l">autres</span>' : ''}</span>`;
}

// ---------- la carte d'un houblon : nom, α, rôle, stock ; la dose ; la phrase ; les barres ; l'empreinte ----------
function carte(n, k) {
  const a = A[n], P = PH[n], g = Math.round(a.dose * IBU.volumeL);
  const ipg = HD[n].ibuParGramme.moments.find((m) => m.code === IBU.moment).ibuPerGram.value;
  return `<article class="hk${k === 0 ? ' avant' : ''}" data-houblon="${esc(n)}" data-hk="${esc(n)}" style="--hc:${HOPS[n].couleur}">
    <div class="hk-1">
      <button type="button" class="hk-t" data-role="reglage" aria-pressed="${k === 0}" aria-label="Mettre ${esc(n)} en avant"><i class="hpt plein" aria-hidden="true"></i>${hn(n)}${alpha(n, { plage: false })}${usage(n)}${stock(n)}</button>
      <span class="hk-d mono" data-nature="calcule" aria-label="${esc(fr(a.dose, 2) + ' g/L, ' + g + ' g pour ' + IBU.volumeL + ' L : ' + IBU.ibu + ' IBU à 10′ (' + fr(ipg, 2) + ' IBU par gramme, moteur)')}">${g} g</span>
      <button type="button" class="hk-x" aria-label="Retirer ${esc(n)}">${ic('x', 16)}</button>
    </div>
    <p class="hk-p">${esc(P.txt)}</p>
    <div class="hk-b">${gainBar(n, 'floral')}${gainBar(n, 'resin')}${gainBar(n, P.autre)}</div>
    ${empreinte(n)}
  </article>`;
}

// ---------- les radars r3 : un par houblon, et ta stout aujourd'hui ----------
// Rayon en racine (r = R·√(v / max)) pour voir un gain d'un tiers de cran à côté de la résine à 8 crans ;
// au style en crans de la 16D, absolu en points sur 100. Pâle : de bas à haut (moteur). Filet : la 16D.
// Le bord du radar : 1,5 fois le haut de la 16D (3 crans) au style ; 100 points en absolu. Au-delà : sur le
// bord, point orangé (la valeur) ou rond creux (le haut de l'intervalle).
const VMAX = { st: 4.5, ab: 100 };
const W = 172, R = 64, C = W / 2, PAS = (2 * Math.PI) / ORDRE.length;
const pt = (k, r) => [C + Math.sin(k * PAS) * r, C - Math.cos(k * PAS) * r].map((x) => x.toFixed(1));
const rr = (v, L) => R * Math.sqrt(Math.max(0, Math.min(v, VMAX[L])) / VMAX[L]);
const enL = (f, v, L) => (L === 'st' ? v / ECH[f].cran : v);
const poly = (vals, L) => ORDRE.map((f, k) => pt(k, rr(enL(f, vals[k], L), L)).join(',')).join(' ');
let nPat = 0;
function radar(nom, prof, couleur, estAvant) {
  const id = 'h' + nPat++;
  const inc = ORDRE.filter((f) => prof[f].inconnu);
  const couche = (L) => {
    const vis = L === 'st' ? 'st' : 'ab';
    const web = (L === 'st' ? [0.5, 1, 2] : [5, 10, 30]).map((v) => `<polygon class="q-anneau" points="${ORDRE.map((f, k) => pt(k, rr(v, L)).join(',')).join(' ')}"/>`).join('');
    const zone = `<polygon class="q-zone" data-role="zone" points="${ORDRE.map((f, k) => pt(k, rr(enL(f, ECH[f].bande[1], L), L)).join(',')).join(' ')}"/>`;
    const sect = inc.map((f) => { const k = ORDRE.indexOf(f), a = pt(k - 0.5, R), b = pt(k + 0.5, R); return `<path class="q-inc" d="M${C},${C}L${a.join(',')}A${R},${R} 0 0 1 ${b.join(',')}Z" fill="url(#hach-${id})"/>`; }).join('');
    const band = ORDRE.map((f, k) => {
      if (prof[f].inconnu) return '';
      const a = pt(k, rr(enL(f, prof[f].bas, L), L)), b = pt(k, rr(enL(f, prof[f].haut, L), L)), deb = enL(f, prof[f].haut, L) > VMAX[L];
      return `<line class="q-int" data-role="intervalle" style="stroke:${couleur}" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>` + (deb ? `<circle class="q-deb" style="stroke:${couleur}" cx="${b[0]}" cy="${b[1]}" r="2.5"/>` : '');
    }).join('');
    const avantS = estAvant ? '' : `<g data-serie="Ta stout aujourd’hui" data-valeurs="${ORDRE.map((f) => r2(enL(f, AV[f].centre, L))).join(',')}"><polygon class="q-avant" points="${poly(ORDRE.map((f) => AV[f].centre), L)}"/></g>`;
    const serie = `<g data-serie="${esc(nom)}" data-valeurs="${ORDRE.map((f) => (prof[f].inconnu ? 0 : r2(enL(f, prof[f].c, L)))).join(',')}" data-inconnues="${inc.join(',')}"><polygon class="q-serie" style="fill:${couleur};stroke:${couleur}" points="${poly(ORDRE.map((f) => prof[f].c), L)}"/></g>`;
    const horsZ = ORDRE.map((f, k) => { if (!hors(f, prof[f].c)) return ''; const v = enL(f, prof[f].c, L), q = pt(k, v > VMAX[L] ? R + 4 : rr(v, L)); return `<circle class="q-hors" cx="${q[0]}" cy="${q[1]}" r="3.5"/>`; }).join('');
    return `<g class="${vis}">${zone}${web}${sect}${band}${avantS}${serie}${horsZ}</g>`;
  };
  const axes = ORDRE.map((f, k) => { const e = pt(k, R); return `<line class="q-axe" x1="${C}" y1="${C}" x2="${e[0]}" y2="${e[1]}"/>`; }).join('');
  const bord = `<polygon class="q-bord" points="${ORDRE.map((f, k) => pt(k, R).join(',')).join(' ')}"/>`;
  const pics = ORDRE.map((f, k) => { const q = pt(k, R + 11); return `<use href="#p-${f}" x="${(+q[0] - 6.5).toFixed(1)}" y="${(+q[1] - 6.5).toFixed(1)}" width="13" height="13" class="q-pi${inc.includes(f) ? ' inc' : ''}"/>`; }).join('');
  const lab = (estAvant ? 'Ta stout aujourd’hui' : nom + ' à 10 IBU, 10′') + ', simulé : ' + ORDRE.filter((f) => !prof[f].inconnu).map((f) => COURT[f].toLowerCase() + ' ~' + fr(enL(f, prof[f].c, 'st'), 1) + ' cran').join(', ') + (inc.length ? ' ; inconnus : ' + inc.map((f) => COURT[f].toLowerCase()).join(', ') : '');
  return `<svg class="rd" width="${W}" height="${W}" viewBox="0 0 ${W} ${W}" data-radar="" data-objet="comparer" data-axes="${ORDRE.join(',')}" role="img" aria-label="${esc(lab)}"><defs><pattern id="hach-${id}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" class="q-hach"/></pattern></defs>${bord}${axes}${couche('st')}${couche('ab')}${pics}</svg>`;
}
const PROF_AVANT = Object.fromEntries(ORDRE.map((f) => [f, { bas: AV[f].bas, c: AV[f].centre, haut: AV[f].haut, inconnu: !!AV[f].inconnu && AV[f].haut === 0 }]));
const radars = `<section class="carte rds" data-acquis="radar" aria-label="Radars : ta stout après chaque houblon, au style">
    
    <div class="rd-g">
      <figure class="rd-c rd-av"><figcaption><i class="hpt contour" style="--hc:#8a8a96" aria-hidden="true"></i>aujourd’hui</figcaption>${radar('Ta stout aujourd’hui', PROF_AVANT, '#8a8a96', true)}</figure>
      ${ORDRE_H.map((n) => `<figure class="rd-c" data-rd="${esc(n)}" style="--hc:${HOPS[n].couleur}"><figcaption>${hn(n)}</figcaption>${radar(n, A[n].f, HOPS[n].couleur, false)}</figure>`).join('')}
    </div>
  </section>`;

// ---------- la chimie du cône, rattachée aux familles (vraies valeurs, sources) ----------
const COMPOSES = [
  { id: 'huile', nom: 'Huile totale', fams: [], unite: 'mL/100 g' },
  { id: 'linalol', nom: 'Linalol', fams: ['floral', 'citrus'], unite: '% huile' },
  { id: 'geraniol', nom: 'Géraniol', fams: ['floral'], unite: '% huile' },
  { id: 'myrcene', nom: 'Myrcène', fams: ['resin'], unite: '% huile' },
  { id: '4MMP', nom: '4MMP', fams: ['tropical', 'berries'], unite: 'µg/kg' },
];
function plage(n, id) {
  const C = HD[n].composes, vs = (id === 'huile' ? C.huile.valeurs : (C.composes[id] || {}).valeurs || []).filter((v) => v.portee === 'variété');
  if (!vs.length) return null;
  const los = vs.map((v) => v.plage[0]).filter((x) => x != null), his = vs.map((v) => v.plage[1]).filter((x) => x != null);
  return { min: los.length && los.length === vs.length ? Math.min(...los) : los.length ? Math.min(...los) : null, max: his.length === vs.length ? Math.max(...his) : null, minOuvert: los.length < vs.length, src: [...new Set(vs.flatMap((v) => v.sources))] };
}
const txtP = (p, u) => (p.min == null || p.minOuvert ? '≤' + fr(p.max) : p.max == null ? '≥' + fr(p.min) : fr(p.min) === fr(p.max) ? fr(p.min) : fr(p.min) + '–' + fr(p.max)) + ' ' + u;
function ligneCompose(c) {
  const ps = ORDRE_H.map((n) => [n, plage(n, c.id)]);
  const hi = Math.max(...ps.flatMap(([, p]) => (p ? [p.max ?? p.min * 2, p.min ?? 0] : [0])));
  const pc = (x) => (100 * x) / hi;
  const lignes = ps.map(([n, p]) => {
    if (!p) return `<div class="cp-h">${'<i class="hpt plein" style="--hc:' + HOPS[n].couleur + '" aria-hidden="true"></i>'}<span class="cp-t"></span><span class="inc" data-inconnu="aucune valeur publiée lue" data-source="H">inconnu</span></div>`;
    const lo = p.min == null || p.minOuvert ? 0 : pc(p.min), up = p.max == null ? 100 : pc(p.max);
    const ouv = (p.min == null || p.minOuvert ? ' ouv-g' : '') + (p.max == null ? ' ouv-d' : '');
    const sup = c.id === 'huile' ? `<small class="cp-ibu" data-nature="calcule">${fr(p.min * A[n].dose, 1)}–${fr(p.max * A[n].dose, 1)} mL/hL à 10 IBU</small>` : '';
    return `<div class="cp-h"><i class="hpt plein" style="--hc:${HOPS[n].couleur}" aria-hidden="true"></i><span class="cp-t"><i class="cp-b${ouv}" data-role="incertitude" style="left:${lo.toFixed(1)}%;width:${Math.max(2, up - lo).toFixed(1)}%;--hc:${HOPS[n].couleur}"></i></span>${M(txtP(p, c.unite), p.src, 'cp-v')}${sup}</div>`;
  }).join('');
  return `<div class="cp" data-compose="${c.id}"><div class="cp-n">${c.fams.map((f) => pic(f, 16)).join('')}<b>${c.nom}</b><small>${c.unite}</small></div>${lignes}</div>`;
}
const SRC_CHIMIE = [...new Set(COMPOSES.flatMap((c) => ORDRE_H.flatMap((n) => (plage(n, c.id) || { src: [] }).src)))];
const chimie = `<section class="carte" data-acquis="chimie" aria-label="La chimie du cône, rattachée aux familles">
    <h2>Dans le cône ${conf('mesure')}</h2>
    ${COMPOSES.map(ligneCompose).join('')}
    <p class="src-l">${esc([...new Set(SRC_CHIMIE.map((k) => srcNom(k)))].join(' · '))}. Plage de la plus petite à la plus grande valeur publiée pour la variété ; mL/hL = huile × dose de 10 IBU (calcul).</p>
  </section>`;

// ---------- le panel OSU (mesuré, Cascade en dry hop), sans molette ----------
const OSU = D.panelOSU;
const osuSvg = (() => {
  const w = 320, h = 132, x0 = 20, x1 = 236, y0 = 112, y1 = 8, X = (d) => x0 + ((x1 - x0) * d) / 16, Y = (v) => y0 - ((y0 - y1) * v) / 15;
  const ser = [['agrumes', OSU.agrumes, JET.citrus.texte, 'agrumes'], ['herbaceThe', OSU.herbaceThe, JET.herbal.texte, 'herbacé'], ['intensite', OSU.intensite, '#16161a', 'intensité']];
  const lignes = ser.map(([k, v, c, lab]) => `<polyline points="${OSU.doses.map((d, i) => X(d).toFixed(1) + ',' + Y(v[i]).toFixed(1)).join(' ')}" fill="none" stroke="${c}" stroke-width="2"/>${OSU.doses.map((d, i) => `<circle cx="${X(d).toFixed(1)}" cy="${Y(v[i]).toFixed(1)}" r="3" fill="#fff" stroke="${c}" stroke-width="2"/>`).join('')}<text x="${(X(16) + 6).toFixed(1)}" y="${(Y(v[v.length - 1]) + 4).toFixed(1)}" class="o-lab" fill="${c}">${lab}</text>`).join('');
  const ax = [0, 4, 8, 16].map((d) => `<text x="${X(d).toFixed(1)}" y="${y0 + 16}" text-anchor="middle" class="o-ax">${d}</text>`).join('');
  return `<svg width="${w}" height="${h + 8}" viewBox="0 0 ${w} ${h + 8}" role="img" aria-label="Panel OSU, Cascade en dry hop, de 0 à 16 g/L, échelle 0–15 : agrumes ${OSU.agrumes.map((x) => fr(x)).join(', ')} ; herbacé, thé ${OSU.herbaceThe.map((x) => fr(x)).join(', ')} ; intensité ${OSU.intensite.map((x) => fr(x)).join(', ')}"><rect x="${X(OSU.zone[0]).toFixed(1)}" y="${y1}" width="${(X(OSU.zone[1]) - X(OSU.zone[0])).toFixed(1)}" height="${y0 - y1}" fill="#f0f0f4"/><line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y0}" stroke="#c4c4cc"/>${ax}<text x="${x1 + 16}" y="${y0 + 16}" class="o-ax">g/L</text>${lignes}</svg>`;
})();
const E04 = HD.Cascade.panels.find((p) => p.id === 'E04');
const panel = `<section class="carte" data-acquis="osu" data-nature="mesure" data-source="${esc(OSU.sources.join(' '))} E04" aria-label="Goûté : panel OSU">
    <h2>Goûté en dry hop : panel OSU ${conf('panel')}</h2>
    <div class="osu">${osuSvg}</div>
    <p class="petit">${hn('Cascade')} ${alpha('Cascade', { plage: false })} : les agrumes plafonnent à 8 g/L (${M(fr(OSU.agrumes[3]) + ' puis ' + fr(OSU.agrumes[4]) + ' sur 15', OSU.sources)}) ; l’herbacé monte jusqu’au bout. Les auteurs retiennent ${fr(OSU.zone[0])}–${fr(OSU.zone[1])} g/L.</p>
    <p class="petit gris">${esc(E04 ? E04.ref.split('.')[0] + ' (2018)' : srcNom('H22'))}, 24 h, 13–15 °C. ${esc(OSU.portee)} : pas de courbe de dose pour ${hn('Idaho 7')} ni ${hn('Galaxy')}.</p>
  </section>`;

// ---------- les vraies valeurs des fiches, derrière un toucher ----------
const vSrc = (s) => esc(s.source + (s.annee ? ' ' + s.annee : ''));
const lignesFiche = (n) => {
  const H = HD[n];
  const l = (lab, x, u) => (x && x.sources ? x.sources.map((s) => `<li class="ligne"><span class="vv-l">${lab}</span>${M(fr(s.min) + '–' + fr(s.max) + ' ' + u, s.source)}<span class="vv-s">${vSrc(s)}</span></li>`).join('') : '');
  const ipg = H.ibuParGramme.moments.find((m) => m.code === IBU.moment).ibuPerGram.value;
  return `<div class="vv-h" style="--hc:${HOPS[n].couleur}"><h3><i class="hpt plein" aria-hidden="true"></i>${hn(n)}${alpha(n, { plage: false })}<small>${esc(H.alpha.retenu.from)}</small></h3><ul>${l('α', H.alpha, '%')}${l('β', H.beta, '%')}${l('huile', H.huiles.totale, 'mL/100 g')}</ul>
    <p class="vv-calc" data-nature="calcule">${IBU.ibu} IBU ÷ ${fr(ipg, 2)} IBU/g = ${Math.round(IBU.ibu / ipg)} g (${fr(IBU.doses[n], 2)} g/L, ${IBU.volumeL} L, DI 1,066)</p></div>`;
};
const valeurs = `<div class="vv" id="vv" data-acquis="valeurs" hidden>${ORDRE_H.map(lignesFiche).join('')}
    <p class="src-l">Beer Maverick (2023) et Hopsteiner (2025), plages de la variété. α retenu : celui du lot ; Galaxy ${fr(HD.Galaxy.alpha.retenu.value, 1)} % sort de ses fiches (≠). Dose : moteur IBU, ${esc(HD.Cascade.ibuParGramme.base)}.</p></div>`;

// ---------- la page ----------
const LEG_PHRASE = ['La phrase et ses barres', [
  li('<span class="lg-gb"><i></i></span>', 'gain après l’ajout, ~ simulé : au style en crans de la 16D, en absolu en points sur 100'),
  li('<span class="lg-gb"><i class="x"></i></span>', 'orangé : famille déjà au-delà de la 16D (résineux, ta dégustation du 18.10)'),
  li('<b class="mono">22 g</b>', 'la dose qui donne 10 IBU à 10′ dans 20 L, avec l’α du lot'),
  li('<span class="lg-em"><i></i><i class="a"></i></span>', 'ce que disent ses fiches ; gris : autres, mots sans famille (option B)'),
  li('<span class="acorr">à corriger par le brasseur</span>', 'réglages proposés par le pilote : mots génériques écartés (' + B.generiques.join(', ') + '), seuil ' + Math.round(100 * B.seuil) + ' %, plafond ' + Math.round(100 * B.plafond) + ' %'),
], true];
const LEG_RADAR = ['Les radars', [
  li('<span class="lg-r s"></span>', 'plein : ta stout après le houblon, ~ simulé'),
  li('<span class="lg-r a"></span>', 'contour gris : ta stout aujourd’hui'),
  li('<span class="lg-r i"></span>', 'trait pâle : de bas à haut, ce que le moteur ne sait pas trancher (bière noire, seuil non mesuré) ; rond creux : le haut sort du radar'),
  li('<span class="lg-r z"></span>', 'filet : le haut de la 16D ; point orangé : au-delà'),
  li('<span class="lg-r h"></span>', 'hachuré : inconnu, pas zéro'),
  li('<span class="mono">√</span>', 'rayon en racine : un dixième de cran se voit ; le bord vaut une fois et demie le haut de la 16D'),
], true];
const flTxt = (L) => (L === 'st' ? '~' + sg(Math.min(...fl)) + ' à ' + sg(Math.max(...fl)) + ' cran' : '~' + sg(Math.min(...flP), 0) + ' à ' + sg(Math.max(...flP), 0) + ' points');
const corps = `
  ${barre('Lequel pour ma stout ?')}
  <div class="outils">${lentille()}</div>
  <p class="ctx-l" data-role="contexte"><span data-contexte="biere">16D trop résineuse</span><span data-contexte="base">${IBU.ibu} IBU</span><span data-contexte="moment">à 10′</span><span data-contexte="levure">US-05</span></p>
  <p class="verdict" data-nature="simule">${pic('floral', 16)}<span>Même floral, <b class="st">${flTxt('st')}</b><b class="ab">${flTxt('ab')}</b>.</span></p>
  <div class="hks" data-libre="houblon" role="group" aria-label="Houblons comparés">
    ${ORDRE_H.map(carte).join('')}
    <div class="hk-re" id="remettre"></div>
  </div>
  <nav class="pont" aria-label="Suite"><a href="#" id="pont" data-pont="dryhopper" aria-label="Le floral vient surtout du dry hop : ouvrir Dryhopper avec le houblon en avant">${ic('cuveP', 16)}<span><b id="pont-n">${esc(ORDRE_H[0])}</b> en dry hop</span>${ic('chev-r', 16)}</a></nav>
  ${radars}
  ${chimie}
  <section class="carte vvs" aria-label="Les vraies valeurs des fiches">
    <button type="button" class="vv-b" aria-expanded="false" aria-controls="vv">${ic('livre', 16)}<span>Les vraies valeurs des fiches</span>${ic('bas2', 16)}</button>
    ${valeurs}
  </section>
  ${panel}
  <p class="src-l">~ moteur profil-simulé (${esc(D.sources.profils.split('/').slice(-1)[0])}), confiance ${esc(A[ORDRE_H[0]].confiance === 'moyenne' ? 'moyenne' : A[ORDRE_H[0]].confiance)}, bière noire : ${esc(D.style.biereNoire)} Dose entre deux points de la grille : interpolation linéaire${A.Galaxy.entre[0] === 0 ? ' (Galaxy, sous 1 g/L : depuis ta stout sans ajout)' : ''}.</p>
  ${legende([['La réponse', LEG_PHRASE[1], true], LEG_RADAR, LEG_FAMILLES, LEG_HOUBLON, LEG_CONF])}`;

// La fiche (appui long) : option B à la place de la ligne « sans famille » de la fiche g1.
const BPARTS = Object.fromEntries(Object.entries(B.parts).map(([n, p]) => [n, { visible: p.visible, part: p.part, dessinee: p.partDessinee, concepts: p.concepts }]));
const JS = `
const BPARTS = ${JSON.stringify(BPARTS)};
const B_REGL = ${JSON.stringify({ seuil: B.seuil, plafond: B.plafond })};
function autresB(F) {
  const b = BPARTS[F.nom];
  if (!b || !b.visible) return F.sans.length ? h('p', { class: 'f-lab-sans' }, 'sans famille : ' + coupe(F.sans, MAXM)) : null;
  const tot = F.aromes.reduce((s, a) => s + Math.max(1, a.mots.length), 0);
  const bar = h('span', { class: 'f-aut-t' }, ...F.aromes.map((a) => h('i', { class: 'f-aut-f', 'data-famille': a.f, style: 'flex:' + ((1 - b.dessinee) * Math.max(1, a.mots.length) / tot).toFixed(3) + ';background:' + TONS[a.f].base })), h('i', { class: 'f-aut-p', 'data-role': 'autres', 'data-houblon': F.nom, 'data-part': String(b.dessinee).replace('.', ','), style: 'flex:' + b.dessinee, 'aria-label': 'autres : ' + Math.round(100 * b.part) + ' % des mots' }));
  return h('div', { class: 'f-aut', 'data-houblon': F.nom }, bar, h('p', { class: 'f-aut-m' }, h('b', {}, 'autres ' + Math.round(100 * b.part) + ' %'), ' : ' + b.concepts.slice(0, 4).join(', ')), h('p', { class: 'f-aut-c' }, 'seuil ' + Math.round(100 * B_REGL.seuil) + ' %, plafond ' + Math.round(100 * B_REGL.plafond) + ' % : à corriger par le brasseur'));
}
(() => {
  const cartes = [...document.querySelectorAll('.hk')], rds = [...document.querySelectorAll('.rd-c[data-rd]')], re = document.getElementById('remettre'), pontN = document.getElementById('pont-n');
  const enAvant = (n) => {
    cartes.forEach((c) => { const on = c.dataset.hk === n; c.classList.toggle('avant', on); c.querySelector('.hk-t').setAttribute('aria-pressed', String(on)); });
    rds.forEach((r) => r.classList.toggle('pale', !!n && r.dataset.rd !== n));
    if (n) pontN.textContent = n;
  };
  const maj = () => {
    const vis = cartes.filter((c) => !c.hidden);
    cartes.forEach((c) => { c.querySelector('.hk-x').disabled = vis.length <= 2; });
    rds.forEach((r) => { r.hidden = cartes.find((c) => c.dataset.hk === r.dataset.rd).hidden; });
    re.innerHTML = '';
    cartes.filter((c) => c.hidden).forEach((c) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'hk-plus'; b.setAttribute('aria-label', 'Remettre ' + c.dataset.hk); b.innerHTML = '+ ' + c.dataset.hk; b.onclick = () => { c.hidden = false; maj(); }; re.append(b); });
    if (!vis.some((c) => c.classList.contains('avant'))) enAvant(vis[0].dataset.hk);
  };
  cartes.forEach((c) => {
    c.querySelector('.hk-t').addEventListener('click', () => enAvant(c.dataset.hk));
    c.querySelector('.hk-x').addEventListener('click', () => { c.hidden = true; maj(); });
  });
  const vb = document.querySelector('.vv-b'), vv = document.getElementById('vv');
  vb.addEventListener('click', () => { vv.hidden = !vv.hidden; vb.setAttribute('aria-expanded', String(!vv.hidden)); });
  if (/[?&]fiches\\b/.test(location.search)) vb.click();
  maj();
})();`;

const CSS = `
  .ecran { gap: 8px; }
  .outils { justify-content: flex-start; gap: 8px; }
  .ctx-l { display: flex; flex-wrap: wrap; gap: 4px 12px; font: 500 13px var(--mono); color: var(--gris); margin-top: -2px; }
  .verdict { display: flex; align-items: center; gap: 6px; font-size: 15px; line-height: 1.25; }
  .verdict b { font-family: var(--mono); font-weight: 700; }
  body:not(.abs) .ab, body.abs .st { display: none !important; }
  .hks { display: flex; flex-direction: column; gap: 8px; }
  .hk { position: relative; background: #fff; border-radius: 8px; box-shadow: 0 0 0 1px var(--trait); padding: 6px 10px 8px; display: flex; flex-direction: column; gap: 4px; -webkit-touch-callout: none; user-select: none; }
  .hk.avant { box-shadow: 0 0 0 2px var(--hc); }
  .hk-1 { display: flex; align-items: center; gap: 6px; min-height: 32px; }
  .hk-t { display: inline-flex; align-items: center; gap: 6px; flex: 1; min-width: 0; min-height: 32px; text-align: left; flex-wrap: wrap; }
  .hk-t .hn { font-size: 16px; }
  .hk-t .hpt { background: var(--hc); }
  .hk-d { font-size: 15px; font-weight: 700; white-space: nowrap; }
  .hk-x { width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; color: var(--gris); border-radius: 4px; }
  .hk-x:disabled { opacity: .35; }
  .hk-p { font-size: 15px; font-weight: 600; line-height: 1.25; }
  .hk-b { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .gb { display: grid; grid-template-columns: 16px 1fr auto; align-items: center; gap: 4px; min-width: 0; }
  .gb-t { position: relative; height: 10px; border-radius: 2px; background: var(--f); overflow: hidden; }
  .gb-b { position: absolute; left: 0; top: 0; bottom: 0; width: var(--ws); background: var(--b); border-radius: 2px; }
  body.abs .gb-b { width: var(--wa); }
  .gb-b.hst { background: var(--acc); }
  .gb-v { font: 600 13px var(--mono); color: var(--encre); white-space: nowrap; }
  .gb-v.hst { color: var(--acc); }
  .em { display: flex; align-items: center; gap: 5px; color: var(--gris); }
  .em-b { flex: 1; display: flex; height: 6px; border-radius: 2px; overflow: hidden; gap: 1px; }
  .em-s, .em-a { display: block; height: 6px; min-width: 3px; }
  .em-a { background: #8a8a8a; min-width: 24px; }
  .em-l { font-size: 12px; color: var(--encre); }
  .hk-re:empty { display: none; }
  .hk-re { display: flex; gap: 6px; }
  .hk-plus { min-height: 32px; padding: 0 12px; border-radius: 16px; background: #ececf1; font-size: 13px; }
  .pont a { display: flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 12px; border-radius: 8px; background: var(--encre); color: #fff; font-size: 14px; text-decoration: none; }
  .pont a span { flex: 1; } .pont a .ic { color: #fff; }
  .rds h2 { margin-bottom: -2px; }
  .rd-g { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; justify-items: center; }
  .rd-c { margin: 0; display: flex; flex-direction: column; align-items: center; transition: opacity .15s; }
  .rd-c.pale { opacity: .45; }
  .rd-c figcaption { display: flex; align-items: center; gap: 6px; font-size: 13px; }
  .rd-c figcaption .mono { color: var(--gris); font-size: 12px; }
  .rd { display: block; overflow: visible; }
  .q-bord { fill: #fff; stroke: #c9c9d2; stroke-width: 1; }
  .q-anneau { fill: none; stroke: #e2e2e8; stroke-width: 1; }
  .q-axe { stroke: #e2e2e8; stroke-width: 1; }
  .q-zone { fill: #f2f1ec; stroke: #8a8a96; stroke-width: 1; }
  .q-int { stroke-width: 1.5; stroke-opacity: .3; stroke-linecap: round; }
  .q-deb { fill: #fff; stroke-width: 1.5; stroke-opacity: .8; }
  .q-avant { fill: none; stroke: #8a8a96; stroke-width: 1.5; }
  .q-serie { fill-opacity: .42; stroke-width: 2; stroke-linejoin: round; }
  .rd-av .q-serie { fill-opacity: .25; }
  .q-hors { fill: var(--acc); stroke: #fff; stroke-width: 1; }
  .q-hach { stroke: #c4c4cc; stroke-width: 1.2; }
  .q-pi.inc { opacity: .45; }
  .cp { padding: 6px 0 4px; border-top: 1px solid #ececf1; display: flex; flex-direction: column; gap: 2px; }
  .cp-n { display: flex; align-items: center; gap: 4px; font-size: 14px; }
  .cp-n small { font: 500 12px var(--mono); color: var(--gris); }
  .cp-n .cp-s { margin-left: auto; }
  .cp-h { display: grid; grid-template-columns: 10px 1fr 108px; gap: 6px; align-items: center; min-height: 18px; }
  .cp-h .hpt { background: var(--hc); }
  .cp-t { position: relative; height: 10px; background: #f0f0f4; border-radius: 2px; }
  .cp-b { position: absolute; top: 1px; height: 8px; border-radius: 4px; background: var(--hc); }
  .cp-b.ouv-d { border-top-right-radius: 0; border-bottom-right-radius: 0; -webkit-mask: linear-gradient(90deg, #000 70%, transparent); mask: linear-gradient(90deg, #000 70%, transparent); }
  .cp-b.ouv-g { border-top-left-radius: 0; border-bottom-left-radius: 0; -webkit-mask: linear-gradient(270deg, #000 70%, transparent); mask: linear-gradient(270deg, #000 70%, transparent); }
  .cp-v { font-size: 12px; text-align: right; white-space: nowrap; }
  .cp-ibu { grid-column: 2 / 4; font-size: 12px; color: var(--gris); text-align: right; }
  .vv-b { display: flex; align-items: center; gap: 6px; min-height: 36px; font-size: 14px; font-weight: 600; width: 100%; text-align: left; }
  .vv-b span { flex: 1; }
  .vv-b[aria-expanded="true"] .ic:last-child { transform: rotate(180deg); }
  .vv { display: flex; flex-direction: column; gap: 8px; }
  .vv[hidden] { display: none; }
  .vv-h h3 { display: flex; align-items: center; gap: 6px; font-size: 14px; flex-wrap: wrap; }
  .vv-h h3 .hpt { background: var(--hc); }
  .vv-h h3 small { font-weight: 400; font-size: 12px; color: var(--gris); }
  .vv-h ul { list-style: none; padding: 0; margin: 2px 0 0; }
  .vv-h .ligne { display: grid; grid-template-columns: 44px 1fr auto; gap: 6px; font-size: 13px; padding: 2px 0; border-top: 1px solid #f0f0f4; }
  .vv-l { color: var(--gris); } .vv-s { font-size: 12px; color: var(--gris); }
  .vv-calc { font: 500 12px var(--mono); color: var(--encre); margin-top: 2px; }
  .osu svg { display: block; width: 100%; height: auto; }
  .o-lab { font: 600 12px var(--sans); } .o-ax { font: 500 12px var(--mono); fill: #5b5b66; }
  .f-aut { display: flex; flex-direction: column; gap: 2px; margin-top: 2px; }
  .f-aut-t { display: flex; height: 8px; gap: 1px; border-radius: 2px; overflow: hidden; }
  .f-aut-f { display: block; }
  .f-aut-p { display: block; background: #8a8a8a; min-width: 24px; }
  .f-aut-m { font-size: 13px; } .f-aut-c { font-size: 12px; color: var(--gris); }
  .acorr { font-size: 12px; font-weight: 700; color: var(--encre); background: #fff4d6; padding: 0 4px; border-radius: 2px; }
  .lg-gb { position: relative; width: 44px; height: 10px; display: inline-block; flex: none; background: #f3e8f7; border-radius: 2px; }
  .lg-gb i { position: absolute; left: 0; top: 0; bottom: 0; width: 20px; background: #bf86d6; border-radius: 2px; } .lg-gb i.x { background: #c2410c; }
  .lg-em { display: inline-flex; width: 44px; height: 6px; gap: 1px; flex: none; } .lg-em i { flex: 3; background: #d9b414; } .lg-em i.a { flex: 1; background: #8a8a8a; }
  .lg-r { width: 20px; height: 14px; display: inline-block; flex: none; border-radius: 2px; }
  .lg-r.s { background: rgba(232,0,48,.42); box-shadow: inset 0 0 0 2px #e80030; } .lg-r.a { box-shadow: inset 0 0 0 1.5px #8a8a96; }
  .lg-r.i { height: 3px; background: rgba(232,0,48,.35); } .lg-r.z { background: #f2f1ec; box-shadow: inset 0 0 0 1px #8a8a96; }
  .lg-r.h { background: repeating-linear-gradient(135deg, #fff 0 3px, #c4c4cc 3px 4.5px); }`;

ecrire(path.join(ici, 'etat.html'), page({ titre: 'Lequel pour ma stout ? · r6m', desc: 'Lot 22 · r6m · La phrase et le radar : une phrase par houblon, calculée, chiffrée par trois barres de gain, à IBU égal (10 IBU à 10′) ; radars r3 avec intervalles ; chimie du cône rattachée aux familles ; panel OSU ; vraies valeurs à un toucher ; descripteurs option B. Généré par r6m/generer.mjs depuis donnees/comparer-stout.json.', css: CSS, corps, js: JS }).replace(
  "F.sans.length ? h('p', { class: 'f-lab-sans', title: F.sans.join(', ') }, 'sans famille : ' + coupe(F.sans, MAXM)) : null,",
  'autresB(F),'));
// Garde-fou : la fiche doit porter l'option B.
import fs from 'node:fs';
if (!fs.readFileSync(path.join(ici, 'etat.html'), 'utf8').includes('autresB(F),')) throw new Error('fiche : la ligne « sans famille » de la fiche g1 est introuvable, option B non branchée');
console.log('ordre : ' + ORDRE_H.map((n) => n + ' (écart ' + fr(ecart(n), 2) + ', ' + PH[n].cle + ')').join(' ; '));
