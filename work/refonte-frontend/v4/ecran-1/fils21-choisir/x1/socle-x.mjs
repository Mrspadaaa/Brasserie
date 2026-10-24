// Lot 21 · socle commun de x1 à x5 (un seul auteur). Rien d'inventé ici : le profil simulé vient du moteur
// profil-simule (donnees/profils-simules.json), les vraies valeurs de x1/valeurs-reelles.json (stock, fiches, moteur
// « pouvoir aromatique », H) et des comparatifs publiés (donnees/comparatifs-dryhop.json), la fiche des fiches g1.
// Le langage de la baseline l8g : pictos au trait de l2 (crayon léger, ton texte des jetons), la vraie fiche
// à l'appui long (runtime de l8g/noyau.mjs), l'α du lot d'abord puis le livre et la plage, l'usage en mot, la
// légende derrière le « ? », Source Sans 3 et IBM Plex Mono.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as N from '../../fils18-baseline/l8g/noyau.mjs';
import { CSS as HABILLAGE } from '../../fils18-baseline/l8g/habillage.mjs';
import { EXTRA as EXTRA_TRAIT, net } from '../../fils18-baseline/l8g/pictos-trait.mjs';

export const ICI = path.dirname(fileURLToPath(import.meta.url));
export const LOT = path.dirname(ICI);
export const REPO = N.REPO;
const lire = (f) => fs.readFileSync(f, 'utf8');
const lireJ = (f) => JSON.parse(lire(f));
export const { JET, ORDRE, NOM, COURT } = N;
export const ACC = '#c2410c';

// ---------- les données ----------
// Le profil simulé : le moteur profil-simule du pilote (donnees/profils-simules.json, « simulé », conventions à
// valider). Les vraies valeurs : x1/valeurs-reelles.json (node reelles.mjs). Le stub de l'auteur est retiré.
const V = lireJ(path.join(LOT, 'donnees/profils-simules.json'));
const R = lireJ(path.join(ICI, 'valeurs-reelles.json'));
export const STUB = false;
export const VSIM = V; // le fichier du moteur, tel quel (textes « §n », sources, conventions)
export const HB = R.houblons; // citra, cascade, galaxy, idaho7, nugget
export const LEV = R.levures;
export const MOM = R.moments;
export const MES = R.mesures; // les vraies valeurs liées, par cas (k1-citra-b60, k2-galaxy…)
const CLE = Object.fromEntries(Object.entries(HB).map(([k, h]) => [h.cle, k]));
export const LEVK = { 'fermentis-us05': 'us05', 'lalbrew-pomona': 'pomona', 'lalbrew-verdant-ipa': 'verdant', 'lalbrew-diamond': 'diamond' };
export const cleH = (c) => CLE[c] || null;
export const texte = (t) => (typeof t === 'string' && /^§\d+$/.test(t) ? V.textes[t] || t : t);
// Une famille du moteur : [bas, centre, haut, crans, largeur, hautPartiel] (grilles) ou { bas, centre, haut, crans, hautPartiel } (cas).
export const fam = (x) => (Array.isArray(x) ? { bas: x[0], centre: x[1], haut: x[2], crans: x[3], hp: !!x[5] } : { bas: x.bas, centre: x.centre, haut: x.haut, crans: x.crans, hp: !!(x.hautPartiel && x.hautPartiel.length), source: x.source });
const prof = (a) => Object.fromEntries(Object.entries(a).map(([f, x]) => [f, fam(x)]));
export const ZONES = Object.fromEntries(Object.entries(V.style.zone).map(([f, z]) => [f, { bande: z.bande, cran: Math.round((z.bande[1] - z.bande[0]) / 3 * 100) / 100, statut: z.statut }]));
export const AVANT = prof(V.biere.avant);
export const SEC = (m) => m === 'dryActive' || m === 'dryPost';
// Les cas du moteur, sous des identifiants courts : k1-citra-b60, k2-idaho7, k3-citra-galaxy, k4-pomona-dryActive, k5-citra-galaxy-dryPost-us05.
const ID = (id) => id.toLowerCase().replace(/idaho-7/g, 'idaho7').replace('k3-citra3-galaxy7', 'k3-citra-galaxy').replace('k3-citra3-idaho7-5', 'k3-citra-idaho7')
  .replace(/^k4-(\w+)-actif$/, 'k4-$1-dryActive').replace(/^k4-(\w+)-apres$/, 'k4-$1-dryPost').replace(/^k5-citra\+(\w+)-actif-(\w+)$/, 'k5-citra-$1-dryActive-$2').replace(/^k5-citra\+(\w+)-apres-(\w+)$/, 'k5-citra-$1-dryPost-$2')
  .replace(/-dryactive$/, '-dryActive').replace(/-drypost$/, '-dryPost').replace(/-dryactive-/, '-dryActive-').replace(/-drypost-/, '-dryPost-');
export const CAS = V.cas.map((c) => ({ ...c, cle: ID(c.id), apres: prof(c.apres), parJour: (c.parJour || []).map((j) => ({ jour: j.jour, jourRecette: j.jourRecette, profil: prof(j.familles) })),
  ajoutsX: c.ajouts.map((a) => ({ h: CLE[a.houblon], dose: a.dose_gL, moment: a.moment, jourDebut: a.jourDebut, jours: a.jours, levure: LEVK[a.levure] })), levureX: LEVK[c.levure] }));
export const casDe = (cle) => CAS.find((c) => c.cle === cle);
export const P = { style: { ...V.style, zones: ZONES, ibu: [50, 70], source: 'BJCP 2021 [39]' }, biere: V.biere, moments: MOM, levures: LEV, cas: CAS };
// La grille, compacte pour la page : « houblon|moment|dose|jours|levure » → 48 nombres (bas, centre, haut, borne haute partielle × 12).
// Les cas à un seul ajout la complètent (Verdant et Diamond n'existent que dans les cas K4).
export function grilleCompacte({ cumul = true } = {}) {
  const g = {}, put = (k, p) => { g[k] = ORDRE.flatMap((f) => { const x = fam(p[f]); return [x.bas, x.centre, x.haut, x.hp ? 1 : 0]; }); };
  for (const e of V.grille) if (CLE[e.houblon] && LEVK[e.levure]) put([CLE[e.houblon], e.moment, e.dose_gL, e.jours ?? '', LEVK[e.levure]].join('|'), e.apres);
  for (const c of V.cas) if (c.ajouts.length === 1) { const a = c.ajouts[0], k = [CLE[a.houblon], a.moment, a.dose_gL, SEC(a.moment) ? a.jours : '', LEVK[c.levure]].join('|'); if (!g[k]) put(k, c.apres); }
  if (cumul) {
    for (const e of V.grillePaires) if (e.houblons.every((h) => CLE[h]) && LEVK[e.levure]) { const hs = e.houblons.map((h) => CLE[h]); put([hs.join('+'), e.moment, e.doses_gL[0], e.jours ?? '', LEVK[e.levure]].join('|'), e.apres); put([[...hs].reverse().join('+'), e.moment, e.doses_gL[0], e.jours ?? '', LEVK[e.levure]].join('|'), e.apres); }
  }
  return g;
}
export const CMP = lireJ(path.join(LOT, 'donnees/comparatifs-dryhop.json'));
// Les mesures publiées d'une étude de comparatifs-dryhop.json, avec ses marques d'honnêteté.
export const etude = (id) => CMP.etudes.find((e) => e.id === id);
export const aVerifier = (m) => /vérifier/i.test(JSON.stringify(m));
export const refCourte = (e) => { const a = e.ref.split(',')[0].split(' ')[0]; const an = (e.ref.match(/(19|20)\d\d/) || [''])[0]; return a + ' ' + an + ' (' + e.id + ')'; };

// ---------- nombres ----------
export const fr = (x, d) => { if (x == null) return ''; const r = d == null ? (Math.abs(x) >= 100 ? Math.round(x) : Math.abs(x) >= 10 ? Math.round(x * 10) / 10 : Math.round(x * 100) / 100) : Math.round(x * 10 ** d) / 10 ** d; return String(r).replace('.', ',').replace('-', '−'); };
// Un facteur au seuil : deux chiffres significatifs, vers l'extérieur pour une borne.
export const fx = (x, sens) => { if (x == null) return null; const e = Math.floor(Math.log10(Math.abs(x))) - 1, p = 10 ** e, q = x / p; const r = sens === 'bas' ? Math.floor(q + 1e-9) : sens === 'haut' ? Math.ceil(q - 1e-9) : Math.round(q); return fr(Number((r * p).toPrecision(6))); };
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const crans = (f, v) => { const z = ZONES[f]; if (v == null) return null; if (v > z.bande[1]) return 4; return Math.max(0, Math.min(3, Math.round(v / z.cran))); };

// ---------- les symboles : pictos au trait de l8g (v3, ton texte, crayon) et icônes lucide à 1,5 px ----------
const TAILLES = [12, 14, 16, 18, 20, 24];
const V3 = lire(REPO + '/work/refonte-frontend/v4/ecran-1/fils17-standard/v3/planche.html');
const SYMV3 = {}; for (const m of V3.matchAll(/<symbol id="p-([a-zA-Z]+)" viewBox="[^"]+"[^>]*>([\s\S]*?)<\/symbol>/g)) SYMV3[m[1]] = m[2];
const CRAYON = '<filter id="crayon" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="7"/><feDisplacementMap in="SourceGraphic" scale="0.8"/></filter>';
const lucide = (n) => { const t = lire(REPO + '/node_modules/lucide-react/dist/esm/icons/' + n + '.mjs').match(/const __iconNode = (\[[\s\S]*?\]);\nconst/)[1];
  return new Function('return ' + t)().map(([tag, a]) => '<' + tag + ' ' + Object.entries(a).filter(([k]) => k !== 'key').map(([k, v]) => k + '="' + v + '"').join(' ') + '/>').join(''); };
const PLUS = { sablier: 'hourglass', thermo: 'thermometer', fiole: 'flask-conical', balance: 'scale', alerte: 'triangle-alert', soleil: 'sun', nuage: 'cloud', eclaircie: 'cloud-sun', pluie: 'cloud-rain', bruine: 'cloud-drizzle', brume: 'cloud-fog', vent: 'wind',
  calendrier: 'calendar', bulle: 'message-circle', ampoule: 'lightbulb', minuteur: 'timer', jauge: 'gauge', etincelle: 'sparkles', aide2: 'circle-question-mark', droite: 'arrow-right', selon: 'arrow-down-up', glisser: 'move-horizontal', poignee: 'grip-vertical',
  moins: 'minus', melange: 'shuffle', cible: 'target', flamme: 'flame', flocon: 'snowflake', biere: 'beer', parapluie: 'umbrella', couches: 'layers', fusion: 'git-merge', triangle: 'triangle' };
const r3 = (x) => Math.round(x * 1000) / 1000;
export const SYMB = N.symboles({ trait: 1.5, tailles: TAILLES })
  .replace(/<symbol id="p-([a-zA-Z]+)"[\s\S]*?<\/symbol>/g, (m, f) => `<symbol id="p-${f}" viewBox="0 0 24 24" fill="none" stroke="${JET[f].texte}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><g filter="url(#crayon)">${net(SYMV3[f])}</g></symbol>`)
  .replace('</svg>', TAILLES.map((z) => Object.entries(PLUS).map(([k, n]) => `<symbol id="i-${k}-${z}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${r3(1.5 * 24 / z)}" stroke-linecap="round" stroke-linejoin="round">${lucide(n)}</symbol>`).join('')).join('') + '<defs>' + CRAYON + '</defs></svg>');
export const ic = (k, z = 16, cls = 'ic') => `<svg class="${cls}" width="${z}" height="${z}" aria-hidden="true"><use href="#i-${k}-${z}"/></svg>`;
export const picto = (f, z = 16, attrs = '') => `<svg class="pi" width="${z}" height="${z}" data-famille="${f}" ${attrs} role="img" aria-label="${NOM[f]}"><use href="#p-${f}"/></svg>`;

// ---------- un houblon : nom, α (lot d'abord, puis le livre et la plage), usage en mot, stock ----------
export const nomH = (k) => HB[k].nom;
export const hn = (k, { txt = HB[k].nom, cls = 'hn', attrs = '' } = {}) => `<span class="${cls}" data-houblon="${HB[k].nom}" ${attrs}>${txt}</span>`;
const pct = (x) => fr(x) + '%';
const plageP = (a) => (a[0] === a[1] ? pct(a[0]) : fr(a[0]) + '–' + pct(a[1]));
export function alpha(k, { fiches = true, lot = true } = {}) {
  const h = HB[k], cryo = h.lot && h.lot.forme === 'cryo';
  const l = lot && h.lot ? `<span class="al lot${h.horsFiches ? ' hors' : ''}" data-role="alpha" data-source="lot" data-nature="mesure" aria-label="α du lot en stock : ${fr(h.lot.alpha)} %${cryo ? ', cryo' : ''} (${esc(h.lot.de)})${h.horsFiches ? ' ; hors des plages de ses fiches' : ''}">${pct(h.lot.alpha)}${h.horsFiches ? ic('diff', 12) : ''}${cryo ? '<span class="pel">cryo</span>' : ''}</span>` : '';
  const fi = fiches || !h.lot ? `<span class="al fi" data-role="alpha" data-source="fiches" data-nature="mesure" aria-label="α des fiches${cryo ? ' du Citra en pellets ; celle du cryo manque' : ''} : ${plageP(h.alphaFiches)} (${esc(h.alphaFichesSrc)})">${ic('livre', 12)}${plageP(h.alphaFiches)}${cryo ? '<span class="pel">pellets</span>' : ''}</span>` : '';
  return `<span class="als">${l}${fi}</span>`;
}
const USAGE_MOT = { 'amérisant': 'amérisant', aromatique: 'aromatique', double: 'mixte' };
export const usage = (k) => { const h = HB[k], ded = h.usageSource === 'règle'; return `<span class="us us-mot${ded ? ' deduit' : ''}" data-role="usage" data-usage="${h.usage}" data-source="${h.usageSource}" aria-label="${h.nom} : ${USAGE_MOT[h.usage]}, ${ded ? 'déduit de l’α, à valider' : 'attesté par le fournisseur'}"><span class="us-m">${USAGE_MOT[h.usage]}</span></span>`; };
export const STOCK_IC = { suffisant: ['en stock', 'stock'], manque: ['stock insuffisant', 'manque'], 'à acheter': ['à acheter', 'achat'] };
export const etatStock = (k, dose, L = 20) => { const g = HB[k].lot ? HB[k].lot.grammes : 0; return !g ? 'à acheter' : g >= dose * L ? 'suffisant' : 'manque'; };
export const stock = (k, dose) => { const s = STOCK_IC[etatStock(k, dose)]; return `<span class="stk" role="img" aria-label="${s[0]}" data-stock-houblon="${k}">${ic(s[1], 14)}</span>`; };
// Une pastille de couleur du houblon (S1 : une couleur par houblon, partout).
export const pt = (k, cls = 'pt') => `<i class="${cls}" data-houblon="${HB[k].nom}" data-couleur="${HB[k].couleur}" style="background:${HB[k].couleur}" aria-hidden="true"></i>`;

// ---------- vraies valeurs et valeurs simulées ----------
// Une vraie valeur : data-nature="mesure", data-source, et son mot de confiance visible (mesuré, panel, fiche, calcul).
export const vrai = (txt, src, { mot = '', cls = 'vv', attrs = '', verifier = false, figure = false } = {}) => `<span class="${cls}" data-nature="mesure" data-source="${esc(src)}" ${attrs}>${txt}${mot ? `<span class="mot-c mot-${mot}">${mot}</span>` : ''}${verifier ? '<span class="mot-c mot-verif">à vérifier</span>' : ''}${figure ? '<span class="mot-c">lu sur figure</span>' : ''}</span>`;
export const sim = (txt, { cls = 'vs', attrs = '' } = {}) => `<span class="${cls}" data-nature="simule" ${attrs}>${txt}</span>`;
export const inconnu = (raison, mot = 'inconnu') => `<span class="inc" data-inconnu aria-label="${esc(mot + ' : ' + raison)}"><i class="hach" aria-hidden="true"></i>${mot}</span>`;

// ---------- la bande d'un rapport au seuil, en échelle log : l'incertitude énorme se voit ----------
export const LOGR = { lo: -2.5, hi: 3.5 }; // ×0,003 à ×3000 : six décades
export function bandeLog(r, { W = 200, f = 'citrus', seuil = true, dix = true, etiquettes = true } = {}) {
  const x = (v) => Math.max(0, Math.min(W, (Math.log10(v) - LOGR.lo) / (LOGR.hi - LOGR.lo) * W));
  if (!r || r.inconnu) return `<span class="blog inc-b" style="width:${W}px" data-role="incertitude" aria-label="rapport au seuil inconnu"><i class="blog-h"></i></span>`;
  const a = r.min == null ? 0 : x(r.min), b = r.max == null ? W : x(r.max);
  const fac = r.min != null && r.max != null ? r.max / r.min : null;
  const bornes = etiquettes ? `<span class="blog-b" style="left:${a}px">×${fx(r.min, 'bas') ?? '?'}</span><span class="blog-b d" style="left:${b}px">${r.max == null ? '?' : '×' + fx(r.max, 'haut')}</span>` : '';
  return `<span class="blog" style="width:${W}px;--c:${JET[f].base}" role="img" aria-label="rapport au seuil de ×${fx(r.min, 'bas')} à ${r.max == null ? 'borne haute inconnue' : '×' + fx(r.max, 'haut')}${fac ? ', un facteur ' + Math.round(fac) : ''}">
    <i class="blog-r"></i>${seuil ? `<i class="blog-s" style="left:${x(1)}px"></i>` : ''}${dix ? `<i class="blog-d" style="left:${x(10)}px"></i>` : ''}
    <i class="blog-band${r.max == null ? ' ouv' : ''}" data-role="incertitude" style="left:${a}px;width:${Math.max(4, b - a)}px"></i>
    ${r.central != null ? `<i class="blog-c" style="left:${x(r.central) - 1}px"></i>` : ''}${bornes}</span>`;
}
// Le texte d'un rapport : « ×0,06–2100 » (plage), « ≥ ×4 » (borne haute inconnue).
export const rapportTxt = (r) => (!r || r.inconnu ? 'inconnu' : r.max == null ? '≥ ×' + fx(r.min, 'bas') : '×' + fx(r.min, 'bas') + '–' + fx(r.max, 'haut'));

// ---------- les barres de l5b, enrichies : la zone du style, l'avant en pointillé, la moustache bas–haut ----------
// Au style : 1 cran = PXC px, la zone fait 3 crans, l'orangé au-delà ; absolu : 0–100 sur HA px.
export const BARRE = { PXC: 14, HC: 4.6, HA: 64 };
// La géométrie d'une barre : au style en crans (cap à HC crans, flèche « dépasse ») ; en absolu sur 0–100 (cap à 100,
// flèche). La moustache bas–haut n'est jamais rognée en silence : au-delà de l'échelle, elle s'ouvre (flèche) ; une
// borne haute partielle (composés sans borne publiée) porte « + ». Une famille sans rien de simulé (0, 0, 0) est
// « non simulée », hachurée : pas une preuve d'absence.
export function geomBarre(f, v, o = BARRE) {
  const z = ZONES[f], capS = o.HC * o.PXC, hS = (x) => Math.min(capS, (x / z.cran) * o.PXC), hA = (x) => Math.min(o.HA, (x / 100) * o.HA);
  return { zS: 3 * o.PXC, zA: hA(z.bande[1]), s: hS(v.centre), a: hA(v.centre), b0s: hS(v.bas), b1s: hS(v.haut), b0a: hA(v.bas), b1a: hA(v.haut),
    hors: v.centre > z.bande[1], ds: v.centre / z.cran > o.HC, os: v.haut / z.cran > o.HC, oa: v.haut > 100, hp: !!v.hp, nul: !(v.haut > 0) && !(v.centre > 0) };
}
export const varsBarre = (g, av) => `--zs:${g.zS.toFixed(1)}px;--za:${g.zA.toFixed(1)}px;--s:${g.s.toFixed(1)}px;--a:${g.a.toFixed(1)}px;--b0s:${g.b0s.toFixed(1)}px;--b1s:${g.b1s.toFixed(1)}px;--b0a:${g.b0a.toFixed(1)}px;--b1a:${g.b1a.toFixed(1)}px${av ? `;--gs:${av.s.toFixed(1)}px;--ga:${av.a.toFixed(1)}px` : ''}`;
export const clsBarre = (g) => ['col', g.hors && 'hors', g.ds && 'ds', g.os && 'os', g.oa && 'oa', g.hp && 'hp', g.nul && 'nul'].filter(Boolean).join(' ');
export function colonne(f, v, { avant = AVANT[f], o = BARRE, nom = true, cls = '' } = {}) {
  const g = geomBarre(f, v, o), ga = avant ? geomBarre(f, avant, o) : null;
  return `<span class="${clsBarre(g)} ${cls}" data-famille="${f}" data-col="${f}" style="--hs:${(o.HC * o.PXC + 6).toFixed(0)}px;--ha:${o.HA + 6}px">
    <span class="col-z" style="${varsBarre(g, ga)}"><i class="col-zone" data-role="zone" data-famille="${f}"></i>${ga ? '<i class="col-av"></i>' : ''}<i class="col-b" data-nature="simule" aria-label="${NOM[f]} ~ ${g.nul ? 'non simulé' : crans(f, v.centre) === 4 ? 'au-dessus du style' : crans(f, v.centre) + ' cran(s) du style'}, simulé"></i><i class="col-m"></i><i class="col-nul" aria-hidden="true"></i></span>
    ${picto(f, 16)}${nom ? `<span class="col-n">${COURT[f]}</span>` : ''}</span>`;
}
export const CSS_BARRE = `
  .cols { display: flex; justify-content: space-between; align-items: flex-start; gap: 2px; }
  .col { display: inline-flex; flex-direction: column; align-items: center; gap: 3px; flex: 1; min-width: 0; }
  .col-z { position: relative; width: 14px; height: var(--hs); margin-top: 0; }
  body.abs .col-z { height: var(--ha); }
  .col-z::after { content: ''; position: absolute; left: -3px; right: -3px; bottom: 0; height: 1px; background: var(--trait2); }
  .col-zone { position: absolute; left: -2px; right: -2px; bottom: 0; height: var(--zs); background: color-mix(in srgb, var(--b) 16%, transparent); border-top: 1.5px solid var(--t); }
  body.abs .col-zone { height: var(--za); }
  .col-av { position: absolute; left: -1px; right: -1px; bottom: 0; height: var(--gs); border: 1.5px dashed #8a8a96; border-bottom: 0; border-radius: 2px 2px 0 0; z-index: 2; }
  body.abs .col-av { height: var(--ga); }
  .col-b { position: absolute; left: 1px; right: 1px; bottom: 0; height: var(--s); background: linear-gradient(to top, var(--b) 0, var(--b) var(--zs), var(--acc) var(--zs)); border-radius: 2px 2px 0 0; z-index: 1; transition: height .25s; }
  body.abs .col-b { height: var(--a); background: var(--b); }
  .col:not(.hors) .col-b { background: var(--b); }
  .col-m { position: absolute; left: calc(100% + 2px); width: 0; bottom: var(--b0s); height: calc(var(--b1s) - var(--b0s)); border-left: 1.5px solid #5b5b66; z-index: 3; transition: all .25s; }
  .col-m::before, .col-m::after { content: ''; position: absolute; left: -3px; width: 4.5px; height: 1.5px; background: #5b5b66; }
  .col-m::before { top: 0; } .col-m::after { bottom: 0; }
  body.abs .col-m { bottom: var(--b0a); height: calc(var(--b1a) - var(--b0a)); }
  .col.os:not(.nul) .col-m::before, body.abs .col.oa .col-m::before { top: -5px; left: -4px; width: 0; height: 0; background: none; border: 3.5px solid transparent; border-bottom: 5px solid #5b5b66; border-top: 0; }
  body.abs .col.os:not(.oa) .col-m::before { top: 0; left: -3px; width: 4.5px; height: 1.5px; background: #5b5b66; border: 0; }
  .col.hp:not(.nul) .col-z::before { content: '+'; position: absolute; top: -13px; left: calc(100% - 1px); font: 600 12px/1 var(--sans); color: #5b5b66; }
  .col.ds .col-b::after { content: ''; position: absolute; left: 2px; top: 2px; border: 3px solid transparent; border-bottom: 4px solid #fff; border-top: 0; }
  body.abs .col.ds .col-b::after { display: none; }
  .col-nul { display: none; }
  .col.nul .col-nul { display: block; position: absolute; left: 0; right: 0; bottom: 0; height: 18px; background: repeating-linear-gradient(135deg, #fff 0 2px, #9aa0ab 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; border-radius: 2px; z-index: 2; }
  .col.nul .col-m, .col.nul .col-b { display: none; }
  .col-n { font-size: 12px; line-height: 1; color: var(--t); white-space: nowrap; writing-mode: vertical-rl; transform: rotate(180deg); }`;
// Le même calcul dans la page.
export const JS_BARRE = `
  const geom = (f, v, o = B) => { const z = Z[f], capS = o.HC * o.PXC, hS = (x) => Math.min(capS, (x / z.cran) * o.PXC), hA = (x) => Math.min(o.HA, (x / 100) * o.HA);
    return { zS: 3 * o.PXC, zA: hA(z.bande[1]), s: hS(v.centre), a: hA(v.centre), b0s: hS(v.bas), b1s: hS(v.haut), b0a: hA(v.bas), b1a: hA(v.haut), hors: v.centre > z.bande[1], ds: v.centre / z.cran > o.HC, os: v.haut / z.cran > o.HC, oa: v.haut > 100, hp: !!v.hp, nul: !(v.haut > 0) && !(v.centre > 0) }; };
  const poser = (col, f, v, o = B) => { const g = geom(f, v, o), z = col.querySelector('.col-z');
    for (const [k, x] of Object.entries({ zs: g.zS, za: g.zA, s: g.s, a: g.a, b0s: g.b0s, b1s: g.b1s, b0a: g.b0a, b1a: g.b1a })) z.style.setProperty('--' + k, x.toFixed(1) + 'px');
    for (const k of ['hors', 'ds', 'os', 'oa', 'hp', 'nul']) col.classList.toggle(k, !!g[k]);
    const b = col.querySelector('.col-b'); if (b) b.setAttribute('aria-label', f + ' ~ ' + (g.nul ? 'non simulé' : cr(f, v.centre) === 4 ? 'au-dessus du style' : cr(f, v.centre) + ' cran(s)') + ', simulé'); };`;

// ---------- la fiche g1 (runtime de l8g) ----------
const FH = lireJ(REPO + '/work/refonte-frontend/v4/ecran-1/fils20-dryhop/d1/fiches-h.json').fiches;
const PF = lireJ(REPO + '/prototypes/houblons-v4/data/pack-fiches.json').fichesHoublons;
const NOMS_H = { myrcene: 'myrcène', humulene: 'humulène', caryophyllene: 'caryophyllène', farnesene: 'farnésène', linalool: 'linalol' };
const plageSrc = (s) => ({ src: s.source, an: s.annee ?? null, min: s.min, max: s.max });
const minus = (xs) => { const vu = new Set(); return xs.filter((w) => { const k = w.toLowerCase(); if (vu.has(k)) return false; vu.add(k); return true; }).map((w) => w.toLowerCase()); };
function ficheDe(k) {
  const h = HB[k], f = FH.find((x) => x.key === h.cle) || PF.find((x) => x.key === h.cle);
  const comp = (f.huiles && f.huiles.composants) || {}, cryo = !!(h.lot && h.lot.forme === 'cryo');
  return { nom: h.nom, cryo, role: { v: f.role.value, src: /^fournisseur/.test(f.role.source) ? 'fournisseur' : 'règle', txt: f.role.source }, voie: null, ajout: null,
    stock: h.lot && h.lot.grammes > 0 ? 'suffisant' : 'à acheter', origine: f.origin || null,
    alphaC1: { lot: h.lot ? h.lot.alpha : null, fiches: h.alphaFiches, horsFiches: h.horsFiches },
    alpha: ((f.alpha && f.alpha.sources) || []).map(plageSrc), lot: h.lot ? h.lot.alpha : null,
    beta: ((f.beta && f.beta.sources) || []).map(plageSrc), huiles: ((f.huiles && f.huiles.totale && f.huiles.totale.sources) || []).map(plageSrc),
    composants: Object.entries(NOMS_H).map(([c, n]) => (comp[c] ? { nom: n, min: comp[c].min, max: comp[c].max, src: comp[c].source } : { nom: n, raison: comp[c + 'Raison'] || null })),
    aromes: (f.aromes || []).filter((a) => a.sources > 0).map((a) => ({ f: a.family, n: a.sources, of: a.of, auteurs: a.authors || [], mots: minus((a.mots || []).flatMap((m) => m.mots)), premier: a.sources === 1 && (a.premier || []).length > 0 })),
    of: ((f.aromes || [])[0] || {}).of || 0, sans: minus((f.motsSansFamille || []).map((x) => x.mot)),
    styles: (f.usage || []).flatMap((u) => u.styles || []), stylesSrc: (f.usage || []).map((u) => u.source).filter(Boolean), stylesRaison: f.usageRaison || null,
    desc: (f.descripteurs && f.descripteurs.beerMaverick) || [], subs: Array.isArray(f.substituts) ? f.substituts.map((x) => (typeof x === 'string' ? x : x.name || x.nom || '')).filter(Boolean) : [], subsRaison: f.substitutsRaison || null };
}
export const FICHES = Object.fromEntries(Object.keys(HB).map((k) => [HB[k].nom, ficheDe(k)]));
const LEGENDE_JS = `
document.querySelectorAll('[data-role="legende-bouton"]').forEach((b) => b.addEventListener('click', (e) => {
  e.stopPropagation();
  const l = document.getElementById(b.getAttribute('aria-controls')), o = b.getAttribute('aria-expanded') !== 'true';
  b.setAttribute('aria-expanded', String(o)); l.hidden = !o;
}));
document.addEventListener('click', (e) => { const b = document.querySelector('[data-role="legende-bouton"][aria-expanded="true"]'); if (b && !e.target.closest('[data-role="legende"]')) b.click(); });
document.addEventListener('keydown', (e) => { const b = document.querySelector('[data-role="legende-bouton"][aria-expanded="true"]'); if (e.key === 'Escape' && b) { b.click(); b.focus(); } });
if (/[?&]legende\\b/.test(location.search)) document.querySelector('[data-role="legende-bouton"]').click();`;
export const runtime = (extra = '') => N.runtime({ extra: LEGENDE_JS + extra })
  .replace(/const FD = [\s\S]*?;\nconst ROUE/, () => 'const FD = ' + JSON.stringify(FICHES) + ';\nconst ROUE')
  .replace(/DEMANDE = \[[^\]]*\]/, () => 'DEMANDE = ' + JSON.stringify(['earthy', 'herbal', 'floral'].map((f) => ({ f, s: 1 }))))
  .replace('cryo = /cryo$/i.test(F.nom)', 'cryo = F.cryo || /cryo$/i.test(F.nom)')
  .replace("' ' + (a ? (a.of === 1 ? '1 fiche' : a.n + '/' + a.of) : 'inconnu')", "' ' + (a ? (a.of === 1 ? '1 fiche' : a.n + '/' + a.of) : 'inconnu' + (F.of ? ' (' + F.of + ' fiche' + (F.of > 1 ? 's' : '') + ' lue' + (F.of > 1 ? 's' : '') + ')' : ''))");

// ---------- la lentille, la légende, l'en-tête ----------
export const lentille = () => `<span class="seg lentille" role="radiogroup" aria-label="Lecture"><button role="radio" data-e="style" aria-checked="true">Au style</button><button role="radio" data-e="absolu" aria-checked="false">Absolu</button></span>`;
export const legende = (items) => `<button class="lg-b" data-role="legende-bouton" aria-expanded="false" aria-controls="legende" aria-label="Légende">?</button>
  <div class="lg" id="legende" data-role="legende" hidden><ul>${items.map(([v, m]) => `<li><span class="lg-v">${v}</span><span>${m}</span></li>`).join('')}</ul></div>`;
export const LEGENDE_COMMUNE = [
  [picto('citrus', 16) + picto('tropical', 16) + picto('floral', 16), 'les familles d’arômes, au trait'],
  ['<span class="al lot">24,8%</span>', 'α du lot en stock, qui fait la dose'],
  ['<span class="al fi">' + ic('livre', 12) + '10–15%</span>', 'α des fiches de la variété'],
  ['<span class="us-mot">aromatique</span>', 'usage dit par le fournisseur ; pâle s’il est déduit de l’α'],
  ['<span class="vs">~</span>', 'simulé : un profil estimé, jamais mesuré'],
  ['<span class="mot-c mot-mesuré">mesuré</span>', 'une vraie valeur, avec sa source au toucher'],
  ['<span class="leg-zone"></span>', 'pâle : la zone de la 16D, l’orangé au-delà'],
  ['<span class="leg-m"></span>', 'la moustache : de la borne basse à la borne haute'],
  ['<span class="inc"><i class="hach"></i>inconnu</span>', 'pas de donnée : jamais zéro'],
  ['appui long', 'sur un houblon : sa fiche'],
];

// ---------- le CSS commun ----------
export const POLICES = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=Source+Sans+3:wght@400;600;700&display=swap">';
const CSS_FICHE_PAGE = `
  .us { display: inline-flex; align-items: center; height: auto; color: var(--encre); }
  .us-mot { font-size: 12px; font-weight: 600; color: var(--encre); }
  .us-mot.deduit { font-weight: 400; color: var(--gris); }
  .al { display: inline-flex; align-items: center; gap: 2px; font: 600 12px/1 var(--mono); color: var(--encre); white-space: nowrap; }
  .al.lot::before { content: 'α'; font: 400 12px var(--sans); color: var(--gris); margin-right: 1px; }
  .al.fi { font-weight: 400; color: var(--gris); }
  .al .ic { color: var(--gris); }
  .al .pel { font: 400 12px var(--sans); margin-left: 3px; color: var(--gris); }
  .f-note { flex-basis: 100%; order: 9; font-size: 12px; color: var(--fi-gris); }
  .f-alpha { display: inline-flex; align-items: baseline; gap: 8px; }
  .f-alpha .al { font-size: 16px; } .f-alpha .al.fi { font-size: 14px; } .f-alpha .al.lot::before { font-size: 14px; }
  .f-bande { gap: 2px; align-items: flex-end; }
  .f-col { width: 20px; display: inline-flex; flex-direction: column; align-items: center; gap: 2px; }
  .f-colz { position: relative; width: 13px; height: 22px; }
  .f-colz::after { content: ''; position: absolute; left: -2px; right: -2px; bottom: 0; height: 1px; background: var(--trait2); }
  .f-colb { position: absolute; left: 0; right: 0; bottom: 1px; height: var(--h); background: var(--b); border-radius: 2px 2px 0 0; }
  .f-col.ci .f-colb { background: var(--f); box-shadow: inset 0 0 0 1.5px var(--b); }
  .f-col .pi { width: 14px; height: 14px; }
  .f-lab { grid-template-columns: 16px 1fr; }
  .f-lab .pi { grid-row: span 2; align-self: start; margin-top: 1px; }
  .r-pi.inc { opacity: .5; }
  .f-fiche { font-family: var(--sans); }
  .f-nom { font-size: 16px; font-weight: 700; } .f-cpt, .f-lab-mots, .f-lab-sans, .f-lab-nd, .f-seule, .f-dem, .f-repli, .f-sec, .f-tag { font-size: 12px; }
  .f-rg-v { font-family: var(--mono); } .f-act { font-size: 14px; } .r-lab { font-size: 12px; font-family: var(--sans); }
  @keyframes appui { from { background-size: 0 100%; } to { background-size: 100% 100%; } }
  .appui .hn, .appui.hn { background: linear-gradient(#e4e4ea, #e4e4ea) no-repeat; animation: appui 500ms linear forwards; border-radius: 2px; }`;
export const CSS = `
  ${N.CSS_FAMILLES}
  ${HABILLAGE}
  ${EXTRA_TRAIT}
  ${N.CSS_FICHE}
  ${CSS_FICHE_PAGE}
  :root { --page: #fff; --encre: #16161a; --gris: #5b5b66; --trait: #dcdce3; --trait2: #c4c4cc; --piste: #ececf1; --doux: #f6f6f9; --acc: #c2410c; --acc-f: #fdf0ea;
    --sans: 'Source Sans 3', -apple-system, system-ui, 'Segoe UI', Roboto, sans-serif; --mono: 'IBM Plex Mono', ui-monospace, Consolas, monospace; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #fff; color: var(--encre); }
  body { font: 400 14px/1.25 var(--sans); -webkit-tap-highlight-color: transparent; font-variant-numeric: tabular-nums; }
  button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
  :focus-visible { outline: 2px solid var(--encre); outline-offset: 2px; }
  svg { display: block; flex: none; }
  .ecran { max-width: 390px; margin: 0 auto; padding: 6px 12px 28px; display: flex; flex-direction: column; gap: 10px; overflow-x: hidden; }
  .tete { display: flex; align-items: center; gap: 6px; min-height: 32px; position: relative; }
  h1 { font-size: 16px; font-weight: 700; white-space: nowrap; }
  .seg { display: inline-flex; background: var(--piste); border-radius: 16px; padding: 2px; flex: none; }
  .seg button { height: 28px; padding: 0 10px; border-radius: 14px; font-size: 12px; color: var(--gris); white-space: nowrap; display: inline-flex; align-items: center; justify-content: center; gap: 4px; }
  .seg button[aria-checked="true"], .seg button[aria-pressed="true"] { background: #fff; color: var(--encre); font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,.12); }
  .lentille { margin-left: auto; }
  .lentille button[aria-checked="true"] { background: var(--encre); color: #fff; }
  .hn { font-weight: 600; text-decoration: underline dotted #8a8a96; text-underline-offset: 3px; white-space: nowrap; -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
  .pt { display: inline-block; width: 8px; height: 8px; border-radius: 50%; flex: none; }
  .als { display: inline-flex; align-items: baseline; gap: 5px; }
  .stk { display: inline-flex; color: var(--gris); }
  .vv { font: 500 12px var(--mono); white-space: nowrap; display: inline-flex; align-items: baseline; gap: 4px; }
  .vs { font: 600 12px var(--mono); white-space: nowrap; }
  .vv.txt { font: 400 13px var(--sans); white-space: normal; }
  .mot-c { font: 400 12px var(--sans); color: var(--gris); white-space: nowrap; }
  .mot-mesuré { color: #0f5c3a; font-weight: 600; } .mot-panel { color: #1d4f8c; font-weight: 600; } .mot-calcul { color: #5b3a8c; font-weight: 600; } .mot-fiche { color: #5b5b66; font-weight: 600; }
  .mot-verif { color: var(--acc); font-weight: 600; }
  .estime { font: 600 12px var(--sans); color: var(--gris); white-space: nowrap; }
  .inc { display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; color: var(--gris); font-size: 12px; }
  .hach { display: inline-block; width: 14px; height: 6px; border-radius: 2px; background: repeating-linear-gradient(135deg, #fff 0 2px, #8a909b 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; flex: none; }
  .xs { display: inline-flex; align-items: center; gap: 3px; height: 20px; padding: 0 7px; border-radius: 4px; background: var(--acc-f); color: var(--acc); font-weight: 600; font-size: 12px; white-space: nowrap; }
  body.abs .xs { display: none; }
  .gris { color: var(--gris); }
  .lg-b { width: 24px; height: 24px; border-radius: 50%; background: var(--doux); color: var(--gris); font-size: 12px; font-weight: 600; flex: none; }
  .lg-b[aria-expanded="true"] { background: var(--encre); color: #fff; }
  .lg { position: absolute; z-index: 30; right: 0; top: 34px; width: 320px; max-width: calc(100vw - 24px); background: #fff; border-radius: 8px; box-shadow: 0 8px 24px -8px rgba(0,0,0,.35), 0 0 0 1px var(--trait); padding: 8px 10px; }
  .lg ul { list-style: none; display: flex; flex-direction: column; gap: 6px; font-size: 12px; }
  .lg li { display: flex; align-items: center; gap: 8px; }
  .lg-v { width: 72px; flex: none; display: inline-flex; align-items: center; justify-content: center; gap: 2px; font-size: 12px; }
  .leg-zone { display: inline-block; width: 18px; height: 14px; background: color-mix(in srgb, #d6a700 16%, transparent); border-top: 1.5px solid #856e0c; }
  .leg-m { display: inline-block; width: 8px; height: 16px; border-left: 1.5px solid var(--encre); position: relative; left: 4px; }
  [hidden] { display: none !important; }
  /* la bande log du rapport au seuil */
  .blog { position: relative; display: inline-block; height: 26px; flex: none; }
  .blog i { position: absolute; display: block; }
  .blog-r { left: 0; right: 0; top: 6px; height: 6px; border-radius: 3px; background: var(--piste); }
  .blog-s { top: 2px; height: 14px; width: 1.5px; background: var(--encre); }
  .blog-d { top: 4px; height: 10px; width: 0; border-left: 1.5px dashed #8a8a96; }
  .blog-band { top: 5px; height: 8px; border-radius: 4px; background: color-mix(in srgb, var(--c) 55%, #fff); box-shadow: inset 0 0 0 1.5px var(--c); }
  .blog-band.ouv { border-radius: 4px 0 0 4px; background: repeating-linear-gradient(90deg, color-mix(in srgb, var(--c) 55%, #fff) 0 6px, #fff 6px 9px); }
  .blog-c { top: 2px; height: 14px; width: 2px; background: var(--encre); border-radius: 1px; }
  .blog-b { position: absolute; top: 15px; transform: translateX(-50%); font: 500 12px/1 var(--mono); color: var(--encre); white-space: nowrap; }
  .blog-b.d { transform: translateX(-50%); }
  .inc-b .blog-h { left: 0; right: 0; top: 5px; height: 8px; background: repeating-linear-gradient(135deg, #fff 0 2px, #8a909b 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; border-radius: 2px; }
  .f-source { background: #fff; }
  .rp { background: var(--doux); border-radius: 8px; }
  .rp-s { width: 100%; display: flex; align-items: center; gap: 6px; min-height: 32px; padding: 2px 10px; text-align: left; font-size: 13px; }
  .rp-s .chev { margin-left: auto; color: var(--gris); transform: rotate(90deg); transition: transform .15s; }
  .rp-s[aria-expanded="true"] .chev { transform: rotate(-90deg); }
  .preuve { font-size: 13px; color: var(--encre); display: flex; flex-direction: column; gap: 4px; padding: 0 10px 10px; line-height: 1.4; }
  ${CSS_BARRE}`;

export const page = ({ titre, commentaire, css = '', corps, js = '', donnees = null }) => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titre}</title>
<!-- ${commentaire} -->${POLICES}
<style>${CSS}
${css}</style>
</head>
<body>
${SYMB}
<main class="ecran">${corps}
</main>
${donnees ? `<script>window.DONNEES = ${JSON.stringify(donnees)};</script>` : ''}
<script>${runtime(js)}</script>
</body>
</html>
`;
export const ecrire = (f, s) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); console.log('écrit ' + path.relative(LOT, f) + ' (' + Math.round(s.length / 1024) + ' Ko)'); };
// Le bandeau « stub » : tant que le profil simulé vient du stub de l'auteur, la page le dit.
export const bandeauStub = () => (STUB ? '<p class="stub" role="note">profil simulé : stub de l’auteur, en attendant le moteur</p>' : '');
export const CSS_STUB = '.stub { font-size: 12px; color: var(--gris); border-left: 2px solid var(--trait2); padding-left: 6px; }';

// ---------- le script commun du simulateur (navigateur) : lecture de la grille et barres ----------
export const JS_SIM = `
const SIMX = (() => {
  const O = ${JSON.stringify(ORDRE)}, Z = ${JSON.stringify(ZONES)}, AV = ${JSON.stringify(AVANT)}, B = ${JSON.stringify(BARRE)};
  const G = (window.DONNEES && window.DONNEES.grille) || {};
  const cle = (h, m, dose, j, lv) => [h, m, dose, (m === 'dryActive' || m === 'dryPost') ? j : '', lv].join('|');
  const profil = (h, m, dose, j, lv) => { const a = G[cle(h, m, dose, j, lv)]; if (!a) return null; const p = {}; O.forEach((f, i) => { p[f] = { bas: a[4 * i], centre: a[4 * i + 1], haut: a[4 * i + 2], hp: !!a[4 * i + 3] }; }); return p; };
  const cr = (f, v) => (v > Z[f].bande[1] ? 4 : Math.max(0, Math.min(3, Math.round(v / Z[f].cran))));
  const ex = (f, v) => v / Z[f].cran;
${JS_BARRE}
  return { O, Z, AV, cle, profil, cr, ex, geom, poser };
})();`;
