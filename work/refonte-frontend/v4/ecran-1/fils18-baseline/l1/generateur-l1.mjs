// Lot 18 · l1 · Cave : q2b (fils15-s5-complexe/q2b, « C'est effectivement qb2 reprise le mieux ») dans
// l'identité réelle de l'app (DESIGN.md) : charbon chaud majoritaire (cave-950 la page, cave-900 les lignes
// actives, cave-850 la feuille), trois tons neutres de lecture (cave-50, 200, 400), le paille pour la seule
// action principale (Comparer), le cuivre de la production pour les moments du brassin, Source Sans 3 pour
// ce qui se dit et IBM Plex Mono pour ce qui se mesure. Les familles s'allument sur le charbon : le jeton
// base en trait et en barre, un jeton de texte recalculé pour le sombre.
// Usage : node generateur-l1.mjs ; écrit etat-b.html et planche.html.
import {
  V4, C, JET, BASE, ORDRE, ORDRE_STYLE, NOM, COURT, OBJ, OB, ALERTE, contraste, sur, melange, rgba, ecrire,
  bande, cran, DEG, r1, p, fr, sg, cl, crTxt, zone, viseeS, viseeA, niv, NIVMOT, V, nomVoie, momentDe, pctBar, crOf, arr, crans,
  reponses, MOT_VERDICT, groupes, AJOUTEES, sprite, ic, jc, MOMENT, STOCK, usageDe, FICHES_H, ficheHTML, FICHE_JS, PAGE_JS,
} from './donnees-q2b.mjs';

const OUT = V4 + '/ecran-1/fils18-baseline/l1';
// ---------- jetons de l'app (DESIGN.md) ----------
const K = { c950: '#12100E', c900: '#1A1613', c850: '#221D19', c800: '#2C2521', c700: '#3D342E', c600: '#574A42', c400: '#9A8A7E', c200: '#D8CEC5', c50: '#F5F0EA', paille: '#F2C14E', cuivre: '#E7A070', hop: '#6E9B5B' };
// Les familles sur le charbon. Le pastille (rond de 20 px) : le ton base à 20 % sur la surface ; le trait du
// picto : base s'il y tient 3:1, sinon le ton fond (petits fruits, épicé, résineux). Le texte coloré hors des
// éléments de famille : un ton recalculé (base éclairci vers cave-50) jusqu'à 4,6:1 sur cave-850.
const TRAIT = {}, TEXTE_SOMBRE = {};
for (const [f, j] of Object.entries(JET)) {
  TRAIT[f] = contraste(j.base, sur(j.base, 0.2, K.c900)) >= 3 ? j.base : j.fond;
  let t = j.base, k = 0; while (contraste(t, K.c850) < 4.6 && k < 60) { k++; t = melange(j.base, K.c50, k / 60); }
  TEXTE_SOMBRE[f] = t;
}
// Le nom d'un objectif (dans l'élément de famille) : un jeton de la famille, base s'il tient 4,6:1, sinon fond.
const TITRE = Object.fromEntries(OBJ.map((f) => [f, contraste(JET[f].base, K.c900) >= 4.6 ? JET[f].base : JET[f].fond]));

const picto = (f, w = 20, attrs = '') => `<svg class="pi pf-${f}" width="${w}" height="${w}" viewBox="-5 -5 34 34" ${attrs} aria-label="${NOM[f]}"><use href="#p-${f}" width="24" height="24"/></svg>`;
const usage = (h) => {
  const { u, src } = usageDe(h);
  const dit = src === 'fournisseur' ? 'attesté par le fournisseur' : 'déduit de l\'α, à valider';
  const des = { amérisant: jc('goutte'), aromatique: jc('arome'), double: jc('goutte') + jc('arome'), inconnu: '<b class="inc">?</b>' }[u];
  return `<span class="us${src === 'règle' ? ' deduit' : ''}" data-role="usage" data-usage="${u}" data-source="${src}" data-houblon="${h.houblon}" aria-label="${h.houblon} : ${u}, ${dit}" title="${h.houblon} : ${u}, ${dit}">${des}</span>`;
};
const usages = (v) => (v.fiches || []).map(usage).join('');
const stockMarque = (v) => (v.levureVers ? '' : `<span class="stk">${jc(STOCK[v.stock][1], STOCK[v.stock][0])}</span>`);
const pill = (id) => { const [t, i, lg] = MOMENT[id]; return `<span class="mo" data-role="moment" data-moment="${id}" aria-label="Moment : ${lg}">${jc(i)}<span>${t}</span></span>`; };

// ---------- barres divergentes (s5 de q2b) ----------
function hsSeg(f, b, side) {
  const z = zone(f); let s0, s1, a0, a1;
  if (z) { const zs = side === 'r' ? z.rS : z.lS, za = side === 'r' ? z.rA : z.lA; s0 = Math.min(zs, b.s); s1 = Math.max(0, b.s - zs); a0 = Math.min(za, b.a); a1 = Math.max(0, b.a - za); }
  else { s0 = Math.max(0, b.s - 5); s1 = Math.min(5, b.s); a0 = Math.max(0, b.a - 5); a1 = Math.min(5, b.a); }
  return `<i class="hs" style="--s0:${p(s0)};--s1:${p(s1)};--a0:${p(a0)};--a1:${p(a1)}"></i>`;
}
function bar(X, f, e, side, lab = '') {
  const b = pctBar(f, e), n = niv(X.v, f, e);
  let h = `<i class="bar ${n}${b.ds ? ' ds' : ''}${b.da ? ' da' : ''}" data-role="effet" data-famille="${f}" title="${NOM[f]} ${sg(e)} · ${NIVMOT[n]}" style="--c:${BASE[f]};--ci:${rgba(BASE[f], 0.42)};--s:${p(b.s)};--a:${p(b.a)}"></i>`;
  if (X.hs.has(f)) h += hsSeg(f, b, side);
  if (lab) h += `<span class="lab-i" style="--s:${p(b.s)};--a:${p(b.a)}">${lab}</span>`;
  return h;
}
const inconnu = (f) => `<i class="bar inconnu" data-role="effet" data-famille="${f}" title="${NOM[f]} : effet non établi"></i>`;
const ztEl = (f, s0, a0) => `<i class="zt${s0 > 100 ? ' cs' : ''}${a0 > 100 ? ' ca' : ''}" data-role="zone" style="--c:${rgba(BASE[f], 0.55)};--s:${p(cl(s0))};--a:${p(cl(a0))}"></i>`;
function zt(f, side) { const z = zone(f); if (!z) return ''; return ztEl(f, side === 'r' ? z.rS0 : z.lS0, side === 'r' ? z.rA0 : z.lA0); }
function couloirs(X, avecLab = false) {
  const e = X.v.effet; let la = '', lb = '', ra = '', rb = '';
  const lab = (f) => (avecLab && crOf(X, f) != null ? arr(crOf(X, f)) : '');
  if (!e.floral.etabli) ra = zt('floral', 'r') + inconnu('floral');
  else if (e.floral.central >= 0) ra = zt('floral', 'r') + bar(X, 'floral', e.floral.central, 'r', lab('floral'));
  else { ra = zt('floral', 'r'); la = zt('floral', 'l') + bar(X, 'floral', e.floral.central, 'l'); }
  rb = zt('citrus', 'r') + (e.citrus.etabli ? bar(X, 'citrus', e.citrus.central, 'r', lab('citrus')) : inconnu('citrus'));
  lb = e.resin.etabli ? bar(X, 'resin', e.resin.central, 'l') : inconnu('resin');
  return `<div class="bars"><div class="m re"><div class="ln a">${la}</div><div class="ln b">${lb}</div></div><div class="g"></div><div class="m fl"><div class="ln a">${ra}</div><div class="ln b">${rb}</div></div></div>`;
}

// ---------- intensité : une case par famille, pastille et jauge d'un trait par cran ----------
function jauge(c, hors) {
  const n = crans(c);
  return `<span class="jg${c < 0 ? ' bas' : ''}${hors ? ' xs' : ''}">${n ? Array.from({ length: n }, () => '<i></i>').join('') : '<i class="pt"></i>'}</span>`;
}
function caseFam(X, f, obj) {
  const t = X.v.tout.find((x) => x.famille === f);
  if (obj) {
    const e = X.v.effet[f];
    if (!e.etabli) return `<span class="cf o ne" data-famille="${f}" title="${NOM[f]} : effet non établi">${picto(f)}<span class="jg ne"><i></i></span></span>`;
    const c = t ? t.crans : 0, n = niv(X.v, f, e.central);
    return `<span class="cf o ${n}${e.central < 0 ? ' moins' : ''}" data-famille="${f}" data-crans="${c}" title="${NOM[f]} ${sg(e.central)} (${crTxt(c)}) · ${NIVMOT[n]}${X.hs.has(f) ? ' · hors du style' : ''}">${picto(f)}${jauge(c, X.hs.has(f))}</span>`;
  }
  if (!t || Math.abs(t.effet) < 0.5) return '<span class="cf vide"></span>';
  const n = niv(X.v, f, t.effet);
  return `<span class="cf ${n}${t.effet < 0 ? ' moins' : ''}" data-role="extra" data-famille="${f}" data-crans="${t.crans}" title="${NOM[f]} ${sg(t.effet)} (${crTxt(t.crans)}) · ${NIVMOT[n]}${X.hs.has(f) ? ' · hors du style' : ''}">${picto(f)}${jauge(t.crans, X.hs.has(f))}</span>`;
}
const casesVoie = (X, slots) => `<span class="cases"><span class="objs">${OBJ.map((f) => caseFam(X, f, true)).join('')}</span><span class="exs">${slots.map((f) => caseFam(X, f, false)).join('')}</span></span>`;

function bioPill(X) {
  const sig = (X.v.bio || []).flatMap((h) => h.signaux); if (!sig.length) return '';
  const has = (id) => sig.find((s) => s.id === id);
  const pf = (f) => picto(f, 18, `data-famille="${f}"`);
  let pic = '';
  if (has('geraniol-citronellol')) pic += `<span class="bt" title="${has('geraniol-citronellol').titre} (${has('geraniol-citronellol').statut})">${pf('floral')}${jc('fleche')}${pf('citrus')}</span>`;
  if (has('thiols')) pic += `<span class="bt" title="${has('thiols').titre} (${has('thiols').statut})">${pf('tropical')}${pf('berries')}</span>`;
  if (has('hop-creep')) pic += `<span class="bt mot" title="${has('hop-creep').titre} (${has('hop-creep').statut})">${jc('bulles')}<span>creep</span></span>`;
  const liste = sig.map((s) => `<li><b>${s.titre}</b> · ${s.statut}. <span class="src">${s.pourquoi}</span></li>`).join('');
  return `<details class="bio" data-role="bio"><summary aria-label="Biotransformation possible, ampleur non quantifiée">${pic}</summary><ul>${liste}</ul></details>`;
}

// ---------- haut de page, réponses ----------
const tete = () => `
  <header class="barre">
    <a class="retour" href="#" aria-label="Retour">${ic('chev-l')}</a>
    <div class="seg nav" role="radiogroup" aria-label="Partie">${['Ma bière', 'Suggestions', 'Comparer'].map((x) => `<button role="radio" aria-checked="${x === 'Suggestions'}">${x}</button>`).join('')}</div>
  </header>
  <div class="outils">
    <div class="seg lentille" role="radiogroup" aria-label="Lecture des familles"><button role="radio" data-e="style" aria-checked="true">Au style</button><button role="radio" data-e="absolu" aria-checked="false">Absolu</button></div>
    <div class="seg" role="radiogroup" aria-label="Vue"><button role="radio" aria-checked="true">${jc('barres')}Barres</button><button role="radio" aria-checked="false">${jc('radar')}Radar</button></div>
  </div>`;
// La jauge de l'objectif (L4) : la meilleure voie remplit la piste, la visée est un cran clair.
function jaugeObj(f, frac, visee) {
  const w = 96, x = Math.round(visee * w), b = Math.round(Math.min(1, frac) * w);
  return `<span class="jo" aria-hidden="true" style="--w:${w}px"><i class="jo-f" style="width:${b}px;background:${BASE[f]}"></i><i class="jo-v" style="left:${x - 1}px"></i></span>`;
}
function objectifs() {
  const R = reponses();
  const tuile = (f, lab, corps, aria) => `<section class="tuile" data-role="objectif" data-famille="${f}" aria-label="${aria}">
      <span class="nom" style="color:${TITRE[f]}">${f === 'resin' ? `<span class="pa">${picto('resin', 22)}<i class="alerte"></i></span>` : picto(f, 22)}${lab}</span>${corps}</section>`;
  const rep = (f, d, plus = '') => `<div class="rep v-${d}"${d === 'atteint' ? ` style="color:${TITRE[f]}"` : ''} data-role="reponse" data-famille="${f}" data-verdict="${d}">${MOT_VERDICT[d]}${plus}</div>`;
  return `<div class="reps">
    ${tuile('resin', 'Moins résineux', rep('resin', R.resin.verdict, '<small>voie houblon</small>') + `<button class="hh-b" onclick="var d=document.getElementById('hh');d.open=true;d.scrollIntoView({behavior:'smooth'})">Hors houblon${ic('chev-r')}</button>`, 'Moins résineux : ma bière est au-dessus du style d\'après la dégustation ; aucune voie houblon ne l\'y ramène')}
    ${tuile('floral', 'Plus floral', rep('floral', R.floral.verdict) + jaugeObj('floral', R.floral.frac / 1.15, 1 / 1.15), `Plus floral : la meilleure voie, ${R.floral.voie}, ${MOT_VERDICT[R.floral.verdict].toLowerCase()} la visée (${fr(R.floral.avant)} → ${fr(R.floral.apres)}, visée ${fr(R.floral.visee)})`)}
    ${tuile('citrus', 'Plus agrumes', rep('citrus', R.citrus.verdict) + jaugeObj('citrus', R.citrus.frac / 1.7, 1 / 1.7), `Plus agrumes : la meilleure voie, ${R.citrus.voie}, ${MOT_VERDICT[R.citrus.verdict].toLowerCase()} la visée (${fr(R.citrus.avant)} → ${fr(R.citrus.apres)}, visée ${fr(R.citrus.visee)})`)}
  </div>`;
}
function fonds() {
  const flS = viseeS('floral'), flA = viseeA('floral'), ciA = viseeA('citrus');
  const fo0 = cl((DEG.min - OB.resin.visee) / 50 * 100);
  return `
    <div class="fonds">
      <div class="moitie re" data-role="piste" data-famille="resin"><i class="flou" style="--s0:100%;--s1:0%;--a0:${p(fo0)};--a1:${p(100 - fo0)}"></i></div>
      <div class="gut"></div>
      <div class="moitie fl" data-role="piste" data-famille="floral"><i class="ov" data-role="piste" data-famille="citrus"></i><i class="vl" style="--s:${p(flS)};--a:${p(flA)}"></i><i class="vl" style="--s:${p(viseeS('citrus'))};--a:${p(ciA)}"></i></div>
    </div>
    <div class="tetes" aria-hidden="true">
      <div class="m re"><i class="axe g-ax"></i><span class="puce v gauche-v">${ic('chev-l')}visée</span></div>
      <div class="g"></div>
      <div class="m fl"><i class="axe d-ax"></i><span class="puce v sty-only" style="--s:${p(flS)}">visée</span><span class="puce pv abs-only" style="--a:${p(flA)}">${picto('floral', 18)}</span><span class="puce pv abs-only" style="--a:${p(ciA)}">${picto('citrus', 18)}</span></div>
    </div>`;
}
function details() {
  const ib = V.map((X) => nomVoie(X.v).nom + ' ' + MOMENT[momentDe(X.v)][0] + ' ' + fr(X.v.ibu.after)).join(' · ');
  const hh = C.horsModele.map((h) => h.pistes.map((x) => `<li><b>${x.titre}</b> : ${x.action.charAt(0).toLowerCase() + x.action.slice(1)} <span class="src">${x.preuve}</span></li>`).join('')).join('');
  return `
  <details class="pli"><summary>IBU après chaque voie <span class="mono">${fr(C.ibu)}</span> · style <span class="mono">${C.bandeIbu.join('–')}</span>${ic('chev-b')}</summary><ul><li>${ib}</li></ul></details>
  <details class="pli" id="hh"><summary>Hors houblon · résineux (${C.horsModele[0].pistes.length} pistes)${ic('chev-b')}</summary><ul>${hh}</ul></details>`;
}

// ---------- la page ----------
const { memes, gestes } = groupes();
const plus = (X) => { const { nom } = nomVoie(X.v), on = AJOUTEES.includes(X.n); return `<button class="ajc" data-role="ajouter-comparer" data-nom="${nom}" aria-pressed="${on}" aria-label="${on ? 'Retirer ' + nom + ' de la comparaison' : 'Ajouter ' + nom + ' à la comparaison'}">${ic('plus')}${ic('check')}</button>`; };
const nomEl = (X) => {
  const { nom } = nomVoie(X.v);
  if (X.v.levureVers) return `<b class="nm">${nom}</b>`;
  return `<b class="nm">${X.v.actions.map((a) => `<span data-houblon="${a.houblon}">${a.houblon}</span>`).join(' + ')}</b>`;
};
const ligne = (X, slots, cls = '') => {
  const { q } = nomVoie(X.v), on = AJOUTEES.includes(X.n);
  const dose = X.v.type === 'assemblage' ? '<span class="q mono">5+5 g ≈</span>' : q ? `<span class="q mono">${q}</span>` : '';
  return `<div class="vr${cls}${on ? ' on' : ''}" data-voie="${X.n}"${X.v.levureVers ? '' : ' data-role="ajout-rapide"'}>
        <div class="l1">${nomEl(X)}${usages(X.v)}<span class="gr">${dose}${stockMarque(X.v)}</span>${bioPill(X)}${plus(X)}</div>
        ${casesVoie(X, slots)}
      </div>`;
};
const blocMeme = (g, gi) => `<div class="groupe meme"><span class="t">${jc('egal')}${gi ? 'même effet' : 'même effet sur tes objectifs'}</span><span class="dose mono">${g.dose}</span>${pill(g.moment)}</div>
    <div class="rangee">${couloirs(g.tete, true)}</div>
    <div class="tab">${g.voies.map((X, i) => ligne(X, g.slots, g.coupe[i] ? ' coupe-l' : '')).join('')}</div>`;
const blocGeste = (g) => `<div class="groupe"><span class="t">${g.ic ? jc(g.ic) : ''}${g.t}</span>${pill(g.mo)}${g.est ? '<span class="est">estimé</span>' : ''}</div>
    ${g.voies.map((X) => `<div class="tab seul">${ligne(X, g.slots)}<div class="rangee in">${couloirs(X, false)}</div></div>`).join('')}`;

// La fiche dans la Cave : feuille cave-850, cases au jeton de la famille, roue au trait clair.
const caseF = (f, n, sep) => `<i class="c${n >= 2 ? ' m' : n === 1 ? ' ci' : ''}${sep ? ' sep' : ''}" data-famille="${f}" aria-hidden="true" style="--c:${BASE[f]};--ci:${rgba(BASE[f], 0.45)}"></i>`;
const reglette = (F, a) => {
  const W = 60, x = (v) => 2 + Math.max(0, Math.min(1, v / 25)) * (W - 4);
  return `<svg class="f-reglette" width="${W}" height="12" aria-hidden="true"><rect x="2" y="4" width="${W - 4}" height="4" rx="2" fill="${K.c700}"/>${F.alpha.map((s) => `<rect x="${(x(s.min) - 1).toFixed(1)}" y="2" width="${Math.max(3, x(s.max) - x(s.min) + 2).toFixed(1)}" height="8" rx="2" fill="${s === a ? K.c200 : K.c600}"/>`).join('')}${F.lot != null ? `<rect x="${(x(F.lot) - 1.5).toFixed(1)}" y="0" width="3" height="12" rx="1" fill="${K.c50}" stroke="${K.c850}" stroke-width="1"/>` : ''}</svg>`;
};
const stockF = (F) => (F.stock ? `<span class="stk">${jc(STOCK[F.stock][1], STOCK[F.stock][0])}</span>` : '');
const ROUE_T = { texte: K.c200, gris: K.c400, grille: K.c700, serie: K.c50, serieFond: 'rgba(245,240,234,0.14)', marque: K.c50, marqueBord: K.c850, hach: K.c600, police: '\'Source Sans 3\', system-ui, sans-serif', gras: 700, axe: (f) => TRAIT[f] };
const fiches = Object.values(FICHES_H).map((F) => ficheHTML(F, { caseF, reglette, stockMarque: stockF, roue: ROUE_T })).join('\n');

const famCSS = Object.keys(JET).map((f) => `.pf-${f}{stroke:${TRAIT[f]};background:${rgba(BASE[f], 0.2)}} .f-t-${f}{color:${TEXTE_SOMBRE[f]}}`).join('\n  ');
const CSS = `
  :root { --c950:${K.c950}; --c900:${K.c900}; --c850:${K.c850}; --c800:${K.c800}; --c700:${K.c700}; --c600:${K.c600}; --c400:${K.c400}; --c200:${K.c200}; --c50:${K.c50};
    --paille:${K.paille}; --cuivre:${K.cuivre}; --hop:${K.hop}; --acc:${ALERTE}; --gut: 22px;
    --sans: 'Source Sans 3', 'Segoe UI', system-ui, sans-serif; --mono: 'IBM Plex Mono', ui-monospace, Consolas, monospace; color-scheme: dark; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { background: var(--c950); }
  body { background: var(--c950); color: var(--c200); font: 400 14px/1.25 var(--sans); -webkit-tap-highlight-color: transparent; -webkit-touch-callout: none; }
  button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
  svg { display: block; flex: none; }
  .ic, .jc { stroke: currentColor; }
  .mono { font-family: var(--mono); font-variant-numeric: tabular-nums; font-weight: 500; letter-spacing: -.01em; }
  ::selection { background: var(--c700); color: var(--c50); }
  :focus-visible { outline: 2px solid var(--c50); outline-offset: 2px; }
  .ecran { max-width: 390px; margin: 0 auto; padding: 6px 12px 84px; display: flex; flex-direction: column; gap: 10px; overflow-x: hidden; }

  /* Chrome compact : en-tête de 36 px, segments de 28 px, aucun aplat paille. */
  .barre { display: flex; align-items: center; gap: 6px; height: 36px; }
  .retour { width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; color: var(--c50); border-radius: 8px; }
  .seg { display: flex; background: var(--c900); border-radius: 8px; padding: 2px; box-shadow: inset 0 0 0 1px var(--c800); }
  .seg button { flex: 1; height: 26px; padding: 0 10px; border-radius: 4px; font-size: 13px; color: var(--c400); white-space: nowrap; display: inline-flex; align-items: center; justify-content: center; gap: 4px; }
  .seg button[aria-checked="true"] { background: var(--c700); color: var(--c50); font-weight: 600; }
  .nav { flex: 1; }
  .outils { display: flex; justify-content: space-between; gap: 8px; }

  /* Les trois objectifs : la réponse d'abord (16–19 px), la famille en pastille allumée. */
  .reps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .tuile { border-radius: 8px; padding: 8px 8px 9px; display: flex; flex-direction: column; gap: 6px; min-height: 100px; background: var(--c900); box-shadow: inset 0 0 0 1px var(--c800); }
  .tuile .nom { display: flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 700; line-height: 1.1; }
  .nom .pa { position: relative; display: inline-flex; flex: none; }
  .alerte { position: absolute; right: -2px; bottom: -1px; width: 8px; height: 8px; border-radius: 50%; background: var(--acc); box-shadow: 0 0 0 1.5px var(--c900); }
  .rep { font-size: 19px; font-weight: 700; line-height: 1; letter-spacing: -.01em; color: var(--c50); }
  .rep small { display: block; font-size: 12px; font-weight: 600; margin-top: 3px; letter-spacing: 0; color: var(--c400); }
  .v-aucune { color: var(--c200); }
  .hh-b { margin-top: auto; height: 26px; padding: 0 4px 0 8px; border-radius: 4px; background: var(--c850); box-shadow: inset 0 0 0 1px var(--c700); font-size: 12px; font-weight: 600; color: var(--c50); display: inline-flex; align-items: center; gap: 2px; align-self: flex-start; white-space: nowrap; }
  .jo { margin-top: auto; position: relative; width: var(--w); height: 14px; display: block; }
  .jo::before { content: ''; position: absolute; left: 0; right: 0; top: 4px; height: 6px; border-radius: 2px; background: var(--c700); }
  .jo-f { position: absolute; left: 0; top: 4px; height: 6px; border-radius: 2px; }
  .jo-v { position: absolute; top: 0; width: 2px; height: 14px; border-radius: 1px; background: var(--c50); }

  /* Le graphique de q2b : deux demi-pistes sans fond ; ma bière est le rail clair du milieu. */
  .graph { position: relative; }
  .fonds { position: absolute; inset: 0; display: flex; pointer-events: none; }
  .moitie { position: relative; flex: 1; }
  .moitie .ov { position: absolute; inset: 0; }
  .gut { width: var(--gut); flex: none; position: relative; }
  .gut::before { content: ''; position: absolute; top: 0; bottom: 0; left: 9.5px; width: 3px; border-radius: 2px; background: var(--c200); }
  .vl { position: absolute; top: 0; bottom: 0; width: 0; border-left: 1.5px dashed var(--c400); left: var(--s); z-index: 1; }
  body.abs .vl { left: var(--a); }
  .flou { position: absolute; top: 0; bottom: 0; right: var(--s0); width: var(--s1); background: linear-gradient(270deg, rgba(47,107,95,.30), rgba(47,107,95,.04)); }
  body.abs .flou { right: var(--a0); width: var(--a1); }
  .tetes { position: relative; z-index: 2; display: flex; height: 32px; }
  .tetes .m { flex: 1; position: relative; }
  .tetes .g { width: var(--gut); flex: none; }
  .axe { position: absolute; top: 4px; height: 1.5px; background: var(--c400); }
  .g-ax { left: 2px; right: 0; } .d-ax { left: 0; right: 2px; }
  .g-ax::before, .d-ax::after { content: ''; position: absolute; top: -3.5px; border: 4.25px solid transparent; }
  .g-ax::before { left: -4px; border-right: 6px solid var(--c400); border-left: 0; }
  .d-ax::after { right: -4px; border-left: 6px solid var(--c400); border-right: 0; }
  .puce { position: absolute; top: 10px; height: 20px; font-size: 12px; font-weight: 600; padding: 0 7px 0 5px; border-radius: 10px; white-space: nowrap; background: var(--c700); color: var(--c50); display: inline-flex; align-items: center; gap: 1px; }
  .puce .ic { width: 16px; height: 16px; }
  .puce.gauche-v { left: 4px; }
  .fl .puce.v { left: calc(var(--s) - 21px); padding: 0 7px; }
  .fl .puce.pv { left: calc(var(--a) - 13px); padding: 0 3px; background: var(--c950); box-shadow: inset 0 0 0 1px var(--c400); }
  .abs-only { display: none !important; } body.abs .abs-only { display: inline-flex !important; } body.abs .sty-only { display: none !important; }

  .groupe { position: relative; z-index: 2; display: flex; align-items: center; gap: 6px; min-height: 30px; padding: 0 2px; font-size: 14px; font-weight: 600; color: var(--c50); }
  .groupe > span.t { background: var(--c950); padding: 2px 6px 2px 2px; border-radius: 4px; display: inline-flex; gap: 5px; align-items: center; white-space: nowrap; }
  .groupe .t .jc { color: var(--c400); }
  .dose { font-size: 13px; color: var(--c200); background: var(--c950); padding: 1px 4px; border-radius: 4px; }
  .est { font-size: 12px; font-weight: 600; color: var(--c400); background: var(--c950); padding: 1px 6px; border-radius: 4px; }
  /* Les moments du brassin : le cuivre de la production. */
  .mo { display: inline-flex; align-items: center; gap: 3px; height: 22px; padding: 0 7px 0 5px; border-radius: 11px; background: var(--c950); box-shadow: inset 0 0 0 1px var(--cuivre); color: var(--cuivre); font: 600 12px/1 var(--sans); font-variant-numeric: tabular-nums; white-space: nowrap; flex: none; }
  .bars { position: relative; display: flex; height: 32px; }
  .bars .m { position: relative; flex: 1; } .bars .g { width: var(--gut); flex: none; }
  .ln { position: absolute; left: 0; right: 0; height: 10px; } .ln.a { top: 0; } .ln.b { top: 16px; }
  .zt { position: absolute; bottom: -4px; height: 2.5px; width: var(--s); background: var(--c); }
  .zt::after { content: ''; position: absolute; top: -4px; width: 2.5px; height: 8px; border-radius: 1px; background: var(--c200); }
  .fl .zt { left: 0; } .fl .zt::after { right: -1px; } .re .zt { right: 0; } .re .zt::after { left: -1px; }
  .zt.cs::after { display: none; } body.abs .zt.cs::after { display: block; } body.abs .zt.ca::after { display: none; }
  body.abs .zt { width: var(--a); }
  .bar { position: absolute; top: 0; height: 10px; min-width: 3px; width: var(--s); background: var(--c); z-index: 1; }
  body.abs .bar:not(.inconnu) { width: var(--a); }
  .fl .bar { left: 0; border-radius: 0 4px 4px 0; } .re .bar { right: 0; border-radius: 4px 0 0 4px; }
  .bar.ci { background: var(--ci); box-shadow: inset 0 0 0 1.5px var(--c); }
  .bar.sf { background: transparent; box-shadow: inset 0 0 0 1.5px var(--c); }
  .bar.inconnu { width: 24px; background: repeating-linear-gradient(135deg, var(--c900) 0 3px, var(--c600) 3px 5px); box-shadow: inset 0 0 0 1px var(--c600); }
  .bar.ds::after, body.abs .bar.da::after { content: ''; position: absolute; top: 2px; right: 2px; border: 3px solid transparent; border-left: 5px solid var(--c950); }
  body.abs .bar.ds:not(.da)::after { display: none; }
  .hs { position: absolute; top: 0; height: 10px; left: var(--s0); width: var(--s1); background: var(--acc); z-index: 2; border-radius: 0 4px 4px 0; }
  .re .hs { left: auto; right: var(--s0); border-radius: 4px 0 0 4px; }
  body.abs .hs { left: var(--a0); width: var(--a1); } body.abs .re .hs { left: auto; right: var(--a0); }
  .lab-i { position: absolute; top: -3px; left: calc(var(--s) + 5px); font: 600 12px/16px var(--mono); white-space: nowrap; background: var(--c950); color: var(--c50); padding: 0 4px; border-radius: 4px; z-index: 3; }
  body.abs .lab-i { left: calc(var(--a) + 5px); }

  /* Le tableau des voies : au fond de la page, filet cave-800 ; une voie ajoutée s'éclaire en cave-900. */
  .tab { position: relative; z-index: 3; margin: 2px 0 12px; border-radius: 8px; background: var(--c950); box-shadow: inset 0 0 0 1px var(--c800); padding: 1px; }
  .vr { padding: 6px 8px 7px 9px; border-radius: 8px; }
  .vr + .vr { border-top: 1px solid var(--c800); border-radius: 0; }
  .vr.coupe-l { border-top-color: var(--c600); }
  .vr.on { background: var(--c900); }
  .vr.appui, .vr.survol { background: var(--c850); }
  .vr.f-source { background: var(--c850); box-shadow: inset 2px 0 0 var(--c50); }
  .l1 { display: flex; align-items: center; gap: 6px; min-height: 28px; }
  .nm { font-size: 14px; font-weight: 600; line-height: 1.15; color: var(--c50); }
  .nm [data-houblon] { text-decoration: underline dotted var(--c600); text-underline-offset: 3px; }
  .q { font-size: 13px; color: var(--c400); white-space: nowrap; }
  .gr { display: inline-flex; align-items: center; gap: 4px; }
  .stk { display: inline-flex; color: var(--c400); }
  .us { display: inline-flex; align-items: center; height: 20px; padding: 0 4px; border-radius: 10px; background: var(--c800); color: var(--c200); flex: none; }
  .us.deduit { background: none; padding: 0 1px; color: var(--c400); }
  .us .inc { font-size: 12px; color: var(--c400); }
  .ajc { margin-left: auto; width: 28px; height: 28px; border-radius: 50%; background: var(--c850); box-shadow: inset 0 0 0 1px var(--c600); color: var(--c50); display: inline-flex; align-items: center; justify-content: center; flex: none; }
  .ajc .ic + .ic { display: none; }
  .ajc[aria-pressed="true"] { background: var(--c50); color: var(--c950); box-shadow: none; }
  .ajc[aria-pressed="true"] .ic:first-child { display: none; } .ajc[aria-pressed="true"] .ic + .ic { display: block; }
  .cases { display: flex; align-items: flex-start; gap: 8px; margin-top: 4px; }
  .objs, .exs { display: inline-flex; gap: 3px; }
  .objs { padding-right: 8px; border-right: 1px dashed var(--c600); }
  .cf { width: 24px; height: 31px; display: inline-flex; flex-direction: column; align-items: center; gap: 3px; position: relative; }
  .pi { width: 20px; height: 20px; border-radius: 50%; }
  .cf.ci .pi { background: none !important; }
  .cf.o .pi { box-shadow: 0 0 0 1.5px var(--c950), 0 0 0 2.5px var(--c200); }
  .cf.ne .pi { opacity: .45; }
  .cf.vide::after { content: ''; width: 4px; height: 4px; border-radius: 2px; background: var(--c700); margin-top: 8px; }
  .cf.moins::before { content: ''; position: absolute; left: -2px; top: -2px; width: 7px; height: 2.5px; border-radius: 1px; background: var(--c50); box-shadow: 0 0 0 1px var(--c950); z-index: 1; }
  .jg { display: inline-flex; gap: 2px; height: 6px; align-items: flex-end; }
  .jg i { width: 4px; height: 6px; border-radius: 2px; background: var(--c200); }
  .jg i.pt { width: 3px; height: 3px; border-radius: 2px; }
  .jg.bas i { background: transparent; box-shadow: inset 0 0 0 1.2px var(--c200); } .jg.bas i.pt { background: var(--c200); }
  .jg.xs i { background: var(--acc); }
  .jg.ne i { width: 14px; height: 5px; background: repeating-linear-gradient(135deg, var(--c900) 0 2px, var(--c600) 2px 3.5px); box-shadow: inset 0 0 0 1px var(--c600); }
  .rangee { position: relative; padding: 2px 0 10px; }

  details.bio { display: inline-block; position: static; }
  .tab:has(details.bio[open]) { z-index: 7; }
  details.bio summary { list-style: none; display: inline-flex; align-items: center; gap: 3px; height: 26px; padding: 0 4px; border-radius: 13px; background: repeating-linear-gradient(135deg, var(--c900) 0 3px, var(--c800) 3px 5.5px); box-shadow: inset 0 0 0 1px var(--c600); cursor: pointer; }
  details.bio summary::-webkit-details-marker { display: none; }
  .bt { display: inline-flex; align-items: center; gap: 1px; background: var(--c950); border-radius: 10px; padding: 0 2px; height: 20px; color: var(--c200); }
  .bt.mot span { font-size: 12px; font-weight: 600; margin: 0 2px; color: var(--c50); }
  details.bio[open] ul { position: absolute; left: 6px; right: 6px; z-index: 6; background: var(--c850); color: var(--c200); border-radius: 8px; box-shadow: 0 8px 24px -12px #000, inset 0 0 0 1px var(--c700); padding: 10px 12px 10px 26px; font-size: 13px; display: flex; flex-direction: column; gap: 6px; }
  .src { color: var(--c400); font-size: 12px; }
  details.pli { border-radius: 8px; background: var(--c900); box-shadow: inset 0 0 0 1px var(--c800); padding: 9px 10px; }
  details.pli summary { list-style: none; font-size: 14px; font-weight: 600; color: var(--c50); cursor: pointer; display: flex; align-items: center; gap: 4px; }
  details.pli summary::-webkit-details-marker { display: none; }
  details.pli summary .ic { margin-left: auto; color: var(--c400); }
  details.pli[open] summary .ic { transform: rotate(180deg); }
  details.pli ul { margin: 8px 0 0 16px; display: flex; flex-direction: column; gap: 6px; font-size: 13px; }

  /* La seule action principale : le paille. */
  .cmp { position: fixed; z-index: 8; left: 50%; transform: translateX(-50%); bottom: 14px; height: 40px; padding: 0 22px; border-radius: 20px; background: var(--paille); color: var(--c950); display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 15px; font-weight: 700; text-decoration: none; box-shadow: 0 8px 24px -12px #000; white-space: nowrap; }
  .cmp .nb { font-family: var(--mono); font-weight: 600; }

  /* Les familles allumées sur le charbon : pastille au ton base à 20 %, trait base (fond si base < 3:1). */
  ${famCSS}

  /* La fiche g1 : feuille cave-850 au téléphone, bulle à l'ordinateur. */
  .f-voile { position: fixed; inset: 0; z-index: 20; background: rgba(18,16,14,.55); }
  .f-fiche { position: fixed; z-index: 21; background: var(--c850); color: var(--c200); box-shadow: 0 -12px 40px -16px #000, inset 0 0 0 1px var(--c700); overflow-y: auto; overscroll-behavior: contain; }
  .f-feuille { left: 0; right: 0; bottom: 0; max-height: calc(100% - 64px); border-radius: 8px 8px 0 0; padding: 4px 12px 16px; }
  .f-bulle { width: 382px; max-height: calc(100% - 16px); border-radius: 8px; padding: 8px 12px 14px; box-shadow: 0 8px 24px -12px #000, inset 0 0 0 1px var(--c700); }
  .f-poignee { width: 36px; height: 4px; border-radius: 2px; background: var(--c600); margin: 2px auto 4px; }
  .f-bulle .f-poignee { display: none; }
  .f-tete { display: flex; align-items: center; gap: 6px; height: 36px; }
  .f-nom { font-size: 18px; font-weight: 600; color: var(--c50); }
  .f-fermer { margin-left: auto; width: 28px; height: 28px; border-radius: 50%; background: var(--c800); color: var(--c50); display: inline-flex; align-items: center; justify-content: center; }
  .f-ab { display: flex; align-items: center; gap: 8px; min-height: 30px; }
  .f-alpha { display: inline-flex; align-items: baseline; gap: 5px; }
  .f-grec { font-size: 15px; color: var(--c400); }
  .f-aa { font: 600 18px/1 var(--mono); color: var(--c50); }
  .f-lot { font: 500 13px/1 var(--mono); color: var(--c400); }
  .f-role { margin-left: auto; height: 24px; padding: 0 9px; border-radius: 12px; font-size: 13px; color: var(--c50); background: var(--c800); display: inline-flex; align-items: center; }
  .f-role.regle { background: none; box-shadow: inset 0 0 0 1px var(--c600); color: var(--c200); }
  .f-note { font-size: 12px; color: var(--c400); margin: 2px 0 4px; }
  .f-labels { display: flex; flex-direction: column; gap: 5px; padding: 8px; margin: 4px 0 2px; border-radius: 8px; background: var(--c900); }
  .f-bande { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .f-bande-c { display: inline-flex; gap: 2px; }
  .f-bande-c .c { width: 20px; height: 20px; }
  .f-bande-c .c.sep { margin-left: 6px; }
  .c { display: inline-block; width: 14px; height: 14px; border-radius: 2px; background: var(--c700); flex: none; }
  .c.m { background: var(--c); } .c.ci { background: var(--ci); }
  .f-seule { font-size: 12px; color: var(--c400); }
  .f-lab { display: grid; grid-template-columns: 16px 1fr; column-gap: 7px; align-items: baseline; font-size: 13px; color: var(--c400); }
  .f-lab .c { align-self: center; }
  .f-lab-n { font-weight: 700; font-size: 14px; }
  .f-lab-mots { grid-column: 2; color: var(--c200); }
  .f-lab-sans, .f-lab-nd { font-size: 12px; color: var(--c400); padding-left: 23px; }
  .f-arome { margin-top: 2px; }
  .roue { margin: 0 auto; }
  .f-dem { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; font-size: 13px; color: var(--c400); margin-top: -2px; }
  .f-dem b { color: var(--c50); font-weight: 600; }
  .f-actions { display: flex; align-items: center; gap: 6px; margin-top: 10px; }
  .f-gout { display: inline-flex; background: var(--c900); border-radius: 14px; padding: 0 2px; box-shadow: inset 0 0 0 1px var(--c700); }
  .f-g { width: 32px; height: 28px; border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; color: var(--c200); }
  .f-g[aria-pressed="true"] { background: var(--c50); color: var(--c950); }
  .f-act { height: 32px; padding: 0 12px; border-radius: 8px; background: var(--c800); color: var(--c50); font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; }
  .f-comparer { margin-left: auto; }
  .f-replis { display: flex; gap: 4px; margin-top: 10px; border-top: 1px solid var(--c700); padding-top: 8px; }
  .f-repli { flex: 1; height: 28px; border-radius: 4px; font-size: 13px; color: var(--c200); display: inline-flex; align-items: center; justify-content: center; gap: 2px; }
  .f-repli .ic { width: 16px; height: 16px; color: var(--c400); }
  .f-repli[aria-expanded="true"] { background: var(--c800); color: var(--c50); }
  .f-repli[aria-expanded="true"] .ic { transform: rotate(180deg); }
  .f-sec[hidden] { display: none; }
  .f-sec { padding: 8px 2px 0; display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
  .f-rg { display: flex; justify-content: space-between; gap: 8px; } .f-rg-n { color: var(--c400); } .f-rg-v { font-family: var(--mono); color: var(--c50); }
  .f-txt { color: var(--c200); } .f-txt b { color: var(--c50); }
  .f-tags { display: flex; flex-wrap: wrap; gap: 4px; }
  .f-tag { height: 22px; padding: 0 8px; border-radius: 11px; background: var(--c800); color: var(--c200); font-size: 12px; display: inline-flex; align-items: center; }
`;
const page = (corps) => `<!doctype html>
<html lang="fr" data-cas="c1">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cave · Suggestions</title>
<!-- Lot 18 · l1 · Cave : q2b (c1) dans l'identité réelle de l'app (DESIGN.md). Charbon chaud majoritaire, trois tons de lecture, paille pour la seule action principale (Comparer), cuivre de la production pour les moments, Source Sans 3 et IBM Plex Mono (mesures). Familles allumées : pastille au ton base à 20 %, trait base (fond pour petits fruits, épicé, résineux), texte recalculé pour le sombre. Appui long 500 ms (survol 750 ms) sur un nom ou sur sa ligne : la fiche g1 dans une feuille cave-850. -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=Source+Sans+3:wght@400;600;700&display=swap">
<style>${CSS}</style>
</head>
<body>
${sprite()}
<main class="ecran">${corps}
</main>
<div id="fiche-racine"></div>
${fiches}
<script>${PAGE_JS}${FICHE_JS}</script>
</body>
</html>
`;
const corps = `${tete()}${objectifs()}
  <div class="graph">${fonds()}
    ${memes.map(blocMeme).join('')}
    ${gestes.map(blocGeste).join('')}
  </div>
  ${details()}
  <a class="cmp" data-role="comparer" href="#">Comparer <b class="nb">(${AJOUTEES.length})</b></a>`;
ecrire(OUT + '/etat-b.html', page(corps));
console.log('texte sombre recalculé : ' + Object.entries(TEXTE_SOMBRE).map(([f, t]) => f + ' ' + t + ' (' + contraste(t, K.c850).toFixed(2) + ':1 sur cave-850)').join(', '));
console.log('trait des pictos : ' + Object.entries(TRAIT).filter(([f, t]) => t !== BASE[f]).map(([f, t]) => f + ' ' + t).join(', ') + ' au ton fond');

// ---------- la planche : l'écran en mini (premier écran, fiche ouverte, plus bas, absolu) et l'abécédaire ----------
{
  const mini = (q, t) => `<figure class="mi"><div class="cadre"><iframe src="etat-b.html${q}" width="390" height="844" loading="eager" title="${t}" tabindex="-1"></iframe></div><figcaption>${t}</figcaption></figure>`;
  const cellule = (t, c) => `<div class="ab"><div class="ab-c">${c}</div><span class="ab-t">${t}</span></div>`;
  const X15 = V[14];
  const ab = [
    cellule('surfaces', `<span class="sw" style="background:${K.c950}"></span><span class="sw" style="background:${K.c900}"></span><span class="sw" style="background:${K.c850}"></span><span class="sw" style="background:${K.c700}"></span>`),
    cellule('texte', `<span class="tx"><b style="font-size:19px;color:${K.c50}">Approche</b><span style="color:${K.c200}">Motueka <span class="mono">10 g</span></span><span style="color:${K.c400};font-size:12px">voie houblon</span></span>`),
    cellule('action', `<span class="ajc" aria-hidden="true">${ic('plus')}</span><span class="ajc" aria-hidden="true" style="background:${K.c50};color:${K.c950};box-shadow:none">${ic('check')}</span>`),
    cellule('famille', `<span class="cf o mq" data-famille="floral">${picto('floral')}</span><span class="cf mq" data-famille="resin">${picto('resin')}</span><span class="cf ci" data-famille="citrus">${picto('citrus')}</span><span class="f-t-berries" style="font-weight:700">Baies</span>`),
    cellule('piste au style', `<div class="pst">${couloirs(X15, false)}</div>`),
    cellule('bouton', `<span class="mo">${jc('ebu')}<span>10′</span></span><span class="cmp statique">Comparer <b class="nb">(2)</b></span>`),
  ].join('');
  const css = `
  body { padding: 10px 12px 16px; }
  .pl { max-width: 366px; margin: 0 auto; display: flex; flex-direction: column; gap: 10px; }
  h1 { font-size: 15px; font-weight: 700; color: var(--c50); display: flex; gap: 8px; align-items: baseline; }
  h1 span { font-size: 12px; font-weight: 400; color: var(--c400); }
  .minis { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 12px; }
  .mi { display: flex; flex-direction: column; gap: 4px; }
  .cadre { width: 175px; height: 380px; overflow: hidden; border-radius: 8px; box-shadow: inset 0 0 0 1px var(--c700); position: relative; }
  .cadre iframe { border: 0; transform: scale(.4487); transform-origin: 0 0; position: absolute; left: 0; top: 0; pointer-events: none; }
  figcaption { font-size: 12px; color: var(--c400); }
  .abc { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .ab { background: var(--c900); border-radius: 8px; box-shadow: inset 0 0 0 1px var(--c800); padding: 8px; display: flex; flex-direction: column; gap: 6px; min-height: 96px; }
  .ab:nth-child(5) { grid-column: span 2; }
  .ab-c { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; flex: 1; }
  .ab-t { font-size: 12px; color: var(--c400); }
  .sw { width: 22px; height: 40px; border-radius: 4px; box-shadow: inset 0 0 0 1px var(--c700); }
  .tx { display: flex; flex-direction: column; gap: 3px; font-size: 13px; }
  .pst { position: relative; width: 100%; }
  .pst .bars { margin-top: 6px; }
  .cmp.statique { position: static; transform: none; height: 32px; padding: 0 12px; font-size: 13px; box-shadow: none; }`;
  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cave · planche</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=Source+Sans+3:wght@400;600;700&display=swap">
<style>${CSS}${css}</style>
</head>
<body>
${sprite()}
<div class="pl">
  <h1>l1 · Cave <span>q2b dans l'app réelle</span></h1>
  <div class="minis">${mini('', 'premier écran')}${mini('?fiche=Motueka', 'appui long : la fiche')}${mini('?y=1180', 'les autres gestes')}${mini('?abs', 'absolu')}</div>
  <div class="abc">${ab}</div>
</div>
</body>
</html>
`;
  ecrire(OUT + '/planche.html', html);
}
