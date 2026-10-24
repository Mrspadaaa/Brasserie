// Lot 18 · l2 · Carnet de brasseur : q2b (fils15-s5-complexe/q2b) écrit dans un carnet. Du papier ligné
// avec sa marge rouge, l'encre pour le texte, des titres en serif (Fraunces, Source Serif 4), des pictos
// duo comme dessinés au crayon (le trait au ton texte de la famille, un lavis au ton base), des barres
// hachurées au crayon de couleur, l'intensité en bâtons (un bâton par cran du style), et les notes du
// brasseur au stylo bleu dans la marge : le moment et la dose de chaque groupe. Le choix se coche dans une
// case, la lentille se lit au mot entouré. Socle commun : ../l1/donnees-q2b.mjs.
// Usage : node generateur-l2.mjs ; écrit etat-b.html.
import {
  V4, C, JET, BASE, ORDRE, ORDRE_STYLE, NOM, COURT, OBJ, OB, ALERTE, contraste, sur, melange, rgba, ecrire,
  bande, cran, DEG, r1, p, fr, sg, cl, crTxt, zone, viseeS, viseeA, niv, NIVMOT, V, nomVoie, momentDe, pctBar, crOf, arr, crans,
  reponses, MOT_VERDICT, groupes, AJOUTEES, sprite, ic, jc, MOMENT, STOCK, usageDe, FICHES_H, ficheHTML, FICHE_JS, PAGE_JS,
} from '../l1/donnees-q2b.mjs';

const OUT = V4 + '/ecran-1/fils18-baseline/l2';
const K = { papier: '#fbf7ee', bristol: '#fffdf8', encre: '#2b2219', encre2: '#5e5347', ligne: '#d7e0ee', marge: '#e0848f', bleu: '#1f3c88', mine: '#8a8072', ombre: '#e9e0cc' };
const TEXTE = Object.fromEntries(Object.entries(JET).map(([f, j]) => [f, j.texte]));

// Le picto dessiné : un lavis (tache d'aquarelle, ton base à 32 %) et le trait au ton texte, tremblé au crayon.
const TACHES = ['M12 2.6c5.6-.3 9.6 3.8 9.4 9.5-.2 5.4-4.4 9.6-9.8 9.3C6.3 21.2 2.4 17.1 2.7 11.8 3 6.6 6.7 2.9 12 2.6Z',
  'M11.4 2.4c5.5.1 10.1 4 9.9 9.9-.2 5.2-4.6 9.7-10 9.3-5.3-.4-9-4.5-8.8-9.8C2.7 6.3 6.2 2.3 11.4 2.4Z',
  'M12.6 2.8c5 .4 9 4.2 8.7 9.4-.3 5.6-4.5 9.4-9.9 9.1C6 21 2.6 16.7 2.9 11.5c.3-5.3 4.6-9 9.7-8.7Z'];
const lavis = (f, k = 0) => `<path class="lv" d="${TACHES[(ORDRE.indexOf(f) + k) % 3]}" fill="${rgba(BASE[f], 0.32)}"/>`;
const picto = (f, w = 22, attrs = '', avecLavis = true) => `<svg class="pi pf-${f}" width="${w}" height="${w}" viewBox="-4 -4 32 32" ${attrs} aria-label="${NOM[f]}">${avecLavis ? lavis(f) : ''}<use href="#p-${f}" width="24" height="24" filter="url(#crayon)"/></svg>`;
const usage = (h) => {
  const { u, src } = usageDe(h);
  const dit = src === 'fournisseur' ? 'attesté par le fournisseur' : 'déduit de l\'α, à valider';
  const des = { amérisant: jc('goutte'), aromatique: jc('arome'), double: jc('goutte') + jc('arome'), inconnu: '<b class="inc">?</b>' }[u];
  return `<span class="us${src === 'règle' ? ' deduit' : ''}" data-role="usage" data-usage="${u}" data-source="${src}" data-houblon="${h.houblon}" aria-label="${h.houblon} : ${u}, ${dit}" title="${h.houblon} : ${u}, ${dit}">${des}</span>`;
};
const usages = (v) => (v.fiches || []).map(usage).join('');
const stockMarque = (v) => (v.levureVers ? '' : `<span class="stk">${jc(STOCK[v.stock][1], STOCK[v.stock][0])}</span>`);
// La note de marge : le moment écrit à la main, au stylo bleu (le mot, jamais seulement une icône).
const COURT_MO = { dryActive: 'actif', dryPost: 'après' };
const noteMoment = (id) => { const [t0, , lg] = MOMENT[id], t = COURT_MO[id] || t0; return `<span class="mo" data-role="moment" data-moment="${id}" aria-label="Moment : ${lg}">${t}</span>`; };

// ---------- barres hachurées au crayon de couleur ----------
function hsSeg(f, b, side) {
  const z = zone(f); let s0, s1, a0, a1;
  if (z) { const zs = side === 'r' ? z.rS : z.lS, za = side === 'r' ? z.rA : z.lA; s0 = Math.min(zs, b.s); s1 = Math.max(0, b.s - zs); a0 = Math.min(za, b.a); a1 = Math.max(0, b.a - za); }
  else { s0 = Math.max(0, b.s - 5); s1 = Math.min(5, b.s); a0 = Math.max(0, b.a - 5); a1 = Math.min(5, b.a); }
  return `<i class="hs" style="--s0:${p(s0)};--s1:${p(s1)};--a0:${p(a0)};--a1:${p(a1)}"></i>`;
}
function bar(X, f, e, side, lab = '') {
  const b = pctBar(f, e), n = niv(X.v, f, e);
  let h = `<i class="bar ${n}${b.ds ? ' ds' : ''}${b.da ? ' da' : ''}" data-role="effet" data-famille="${f}" title="${NOM[f]} ${sg(e)} · ${NIVMOT[n]}" style="--c:${BASE[f]};--t:${TEXTE[f]};--l:${rgba(BASE[f], 0.34)};--s:${p(b.s)};--a:${p(b.a)}"></i>`;
  if (X.hs.has(f)) h += hsSeg(f, b, side);
  if (lab) h += `<span class="lab-i" style="--s:${p(b.s)};--a:${p(b.a)}">${lab}</span>`;
  return h;
}
const inconnu = (f) => `<i class="bar inconnu" data-role="effet" data-famille="${f}" title="${NOM[f]} : effet non établi"></i>`;
const ztEl = (f, s0, a0) => `<i class="zt${s0 > 100 ? ' cs' : ''}${a0 > 100 ? ' ca' : ''}" data-role="zone" style="--c:${rgba(BASE[f], 0.7)};--s:${p(cl(s0))};--a:${p(cl(a0))}"></i>`;
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

// ---------- l'intensité en bâtons : un bâton par cran du style ----------
function batons(c, hors) {
  const n = crans(c);
  return `<span class="jg${c < 0 ? ' bas' : ''}${hors ? ' xs' : ''}">${n ? Array.from({ length: n }, (x, i) => `<i style="--r:${[-6, 4, -3, 7][i]}deg"></i>`).join('') : '<i class="pt"></i>'}</span>`;
}
function caseFam(X, f, obj) {
  const t = X.v.tout.find((x) => x.famille === f);
  if (obj) {
    const e = X.v.effet[f];
    if (!e.etabli) return `<span class="cf o ne" data-famille="${f}" title="${NOM[f]} : effet non établi">${picto(f, 22, '', false)}<span class="jg ne"><i></i></span></span>`;
    const c = t ? t.crans : 0, n = niv(X.v, f, e.central);
    return `<span class="cf o ${n}${e.central < 0 ? ' moins' : ''}" data-famille="${f}" data-crans="${c}" title="${NOM[f]} ${sg(e.central)} (${crTxt(c)}) · ${NIVMOT[n]}${X.hs.has(f) ? ' · hors du style' : ''}">${picto(f, 22, '', n === 'mq')}${batons(c, X.hs.has(f))}</span>`;
  }
  if (!t || Math.abs(t.effet) < 0.5) return '<span class="cf vide"></span>';
  const n = niv(X.v, f, t.effet);
  return `<span class="cf ${n}${t.effet < 0 ? ' moins' : ''}" data-role="extra" data-famille="${f}" data-crans="${t.crans}" title="${NOM[f]} ${sg(t.effet)} (${crTxt(t.crans)}) · ${NIVMOT[n]}${X.hs.has(f) ? ' · hors du style' : ''}">${picto(f, 22, '', n === 'mq')}${batons(t.crans, X.hs.has(f))}</span>`;
}
const casesVoie = (X, slots) => `<span class="cases"><span class="objs">${OBJ.map((f) => caseFam(X, f, true)).join('')}</span><span class="exs">${slots.map((f) => caseFam(X, f, false)).join('')}</span></span>`;

function bioPill(X) {
  const sig = (X.v.bio || []).flatMap((h) => h.signaux); if (!sig.length) return '';
  const has = (id) => sig.find((s) => s.id === id);
  const pf = (f) => picto(f, 20, `data-famille="${f}"`);
  let pic = '';
  if (has('geraniol-citronellol')) pic += `<span class="bt" title="${has('geraniol-citronellol').titre} (${has('geraniol-citronellol').statut})">${pf('floral')}${jc('fleche')}${pf('citrus')}</span>`;
  if (has('thiols')) pic += `<span class="bt" title="${has('thiols').titre} (${has('thiols').statut})">${pf('tropical')}${pf('berries')}</span>`;
  if (has('hop-creep')) pic += `<span class="bt mot" title="${has('hop-creep').titre} (${has('hop-creep').statut})">${jc('bulles')}<span>creep</span></span>`;
  const liste = sig.map((s) => `<li><b>${s.titre}</b> · ${s.statut}. <span class="src">${s.pourquoi}</span></li>`).join('');
  return `<details class="bio" data-role="bio"><summary aria-label="Biotransformation possible, ampleur non quantifiée">${pic}</summary><ul>${liste}</ul></details>`;
}

// ---------- haut de page : onglets soulignés au crayon, choix entourés ----------
const tete = () => `
  <header class="barre">
    <a class="retour" href="#" aria-label="Retour">${ic('chev-l')}</a>
    <div class="onglets" role="radiogroup" aria-label="Partie">${['Ma bière', 'Suggestions', 'Comparer'].map((x) => `<button role="radio" aria-checked="${x === 'Suggestions'}">${x}</button>`).join('')}</div>
  </header>
  <div class="outils">
    <div class="choix lentille" role="radiogroup" aria-label="Lecture des familles"><button role="radio" data-e="style" aria-checked="true">Au style</button><span class="ou" aria-hidden="true">/</span><button role="radio" data-e="absolu" aria-checked="false">Absolu</button></div>
    <div class="choix" role="radiogroup" aria-label="Vue"><button role="radio" aria-checked="true">Barres</button><span class="ou" aria-hidden="true">/</span><button role="radio" aria-checked="false">Radar</button></div>
  </div>`;
// La jauge de l'objectif : une bande hachurée au crayon de la famille, la visée en trait d'encre.
function jaugeObj(f, frac, visee) {
  const w = 92, x = Math.round(visee * w), b = Math.round(Math.min(1, frac) * w);
  return `<span class="jo" aria-hidden="true" style="--w:${w}px"><i class="jo-f" style="width:${b}px;--c:${BASE[f]};--l:${rgba(BASE[f], 0.34)}"></i><i class="jo-v" style="left:${x - 1}px"></i></span>`;
}
function objectifs() {
  const R = reponses();
  const tuile = (f, lab, corps, aria) => `<section class="tuile" data-role="objectif" data-famille="${f}" aria-label="${aria}">
      <span class="nom">${f === 'resin' ? `<span class="pa">${picto('resin', 26)}<i class="alerte"></i></span>` : picto(f, 26)}${lab}</span>${corps}</section>`;
  const rep = (f, d, plus = '') => `<div class="rep v-${d}" data-role="reponse" data-famille="${f}" data-verdict="${d}">${MOT_VERDICT[d]}${plus}</div>`;
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
      <div class="m re"><i class="axe g-ax"></i><span class="puce v gauche-v">← visée</span></div>
      <div class="g"></div>
      <div class="m fl"><i class="axe d-ax"></i><span class="puce v sty-only" style="--s:${p(flS)}">visée</span><span class="puce pv abs-only" style="--a:${p(flA)}">${picto('floral', 20)}</span><span class="puce pv abs-only" style="--a:${p(ciA)}">${picto('citrus', 20)}</span></div>
    </div>`;
}
function details() {
  const ib = V.map((X) => nomVoie(X.v).nom + ' ' + MOMENT[momentDe(X.v)][0] + ' ' + fr(X.v.ibu.after)).join(' · ');
  const hh = C.horsModele.map((h) => h.pistes.map((x) => `<li><b>${x.titre}</b> : ${x.action.charAt(0).toLowerCase() + x.action.slice(1)} <span class="src">${x.preuve}</span></li>`).join('')).join('');
  return `
  <details class="pli"><summary>${ic('chev-r')}IBU après chaque voie (ma bière ${fr(C.ibu)} ; style ${C.bandeIbu.join('–')})</summary><ul><li>${ib}</li></ul></details>
  <details class="pli" id="hh"><summary>${ic('chev-r')}Hors houblon · résineux (${C.horsModele[0].pistes.length} pistes)</summary><ul>${hh}</ul></details>`;
}

// ---------- la page ----------
const { memes, gestes } = groupes();
// Cocher pour comparer : une case dessinée (lucide square / square-check-big), cochée au stylo bleu.
const coche = (X) => { const { nom } = nomVoie(X.v), on = AJOUTEES.includes(X.n); return `<button class="ajc" data-role="ajouter-comparer" data-nom="${nom}" aria-pressed="${on}" aria-label="${on ? 'Retirer ' + nom + ' de la comparaison' : 'Ajouter ' + nom + ' à la comparaison'}">${ic('case')}${ic('case-ok')}</button>`; };
const nomEl = (X) => (X.v.levureVers ? `<b class="nm">${nomVoie(X.v).nom}</b>` : `<b class="nm">${X.v.actions.map((a) => `<span data-houblon="${a.houblon}">${a.houblon}</span>`).join(' + ')}</b>`);
const ligne = (X, slots, cls = '') => {
  const { q } = nomVoie(X.v), on = AJOUTEES.includes(X.n);
  const dose = X.v.type === 'assemblage' ? '<span class="q">5+5 g ≈</span>' : q ? `<span class="q">${q}</span>` : '';
  return `<div class="vr${cls}${on ? ' on' : ''}" data-voie="${X.n}"${X.v.levureVers ? '' : ' data-role="ajout-rapide"'}>
        <div class="l1">${nomEl(X)}${usages(X.v)}<span class="gr">${dose}${stockMarque(X.v)}</span>${bioPill(X)}${coche(X)}</div>
        ${casesVoie(X, slots)}
      </div>`;
};
// Chaque groupe porte sa note de marge : le moment écrit à la main (et la dose quand elle est commune).
const marge = (mo, dose = '') => `<span class="marge" aria-hidden="false">${noteMoment(mo)}${dose ? `<span class="dose">${dose}</span>` : ''}</span>`;
const blocMeme = (g, gi) => `<div class="groupe meme">${marge(g.moment, g.dose)}<span class="t">${jc('egal')}${gi ? 'même effet' : 'même effet sur tes objectifs'}</span></div>
    <div class="rangee">${couloirs(g.tete, true)}</div>
    <div class="tab">${g.voies.map((X, i) => ligne(X, g.slots, g.coupe[i] ? ' coupe-l' : '')).join('')}</div>`;
const blocGeste = (g) => `<div class="groupe">${marge(g.mo)}<span class="t">${g.ic ? jc(g.ic) : ''}${g.t}</span>${g.est ? '<span class="est">estimé</span>' : ''}</div>
    ${g.voies.map((X) => `<div class="tab seul">${ligne(X, g.slots)}<div class="rangee in">${couloirs(X, false)}</div></div>`).join('')}`;

// La fiche du houblon : une fiche bristol, lignée bleu, filet rouge sous le nom ; la roue au crayon.
const caseF = (f, n, sep) => `<i class="c${n >= 2 ? ' m' : n === 1 ? ' ci' : ''}${sep ? ' sep' : ''}" data-famille="${f}" aria-hidden="true" style="--c:${BASE[f]};--t:${TEXTE[f]};--l:${rgba(BASE[f], 0.34)}"></i>`;
const reglette = (F, a) => {
  const W = 60, x = (v) => 2 + Math.max(0, Math.min(1, v / 25)) * (W - 4);
  return `<svg class="f-reglette" width="${W}" height="12" aria-hidden="true"><line x1="2" y1="6" x2="${W - 2}" y2="6" stroke="${K.mine}" stroke-width="1"/>${F.alpha.map((s) => `<rect x="${(x(s.min) - 1).toFixed(1)}" y="3" width="${Math.max(3, x(s.max) - x(s.min) + 2).toFixed(1)}" height="6" rx="2" fill="${s === a ? K.encre : K.ombre}" stroke="${K.encre2}" stroke-width=".8"/>`).join('')}${F.lot != null ? `<rect x="${(x(F.lot) - 1).toFixed(1)}" y="0" width="2" height="12" rx="1" fill="${K.bleu}"/>` : ''}</svg>`;
};
const stockF = (F) => (F.stock ? `<span class="stk">${jc(STOCK[F.stock][1], STOCK[F.stock][0])}</span>` : '');
const ROUE_T = { texte: K.encre, gris: K.encre2, grille: '#cfc6b4', serie: K.encre, serieFond: 'rgba(43,34,25,0.10)', marque: K.encre, marqueBord: K.bristol, hach: '#cbbfa6', police: '\'Source Serif 4\', Georgia, serif', gras: 700, axe: (f) => TEXTE[f] };
const fiches = Object.values(FICHES_H).map((F) => ficheHTML(F, { caseF, reglette, stockMarque: stockF, roue: ROUE_T })).join('\n');

const famCSS = Object.keys(JET).map((f) => `.pf-${f}{stroke:${TEXTE[f]}} .f-t-${f}{color:${K.encre}}`).join('\n  ');
const CSS = `
  :root { --papier:${K.papier}; --bristol:${K.bristol}; --encre:${K.encre}; --encre2:${K.encre2}; --ligne:${K.ligne}; --marge:${K.marge}; --bleu:${K.bleu}; --mine:${K.mine}; --ombre:${K.ombre};
    --acc:${ALERTE}; --gut: 22px; --mg: 50px;
    --titre: 'Fraunces', Georgia, 'Times New Roman', serif; --serif: 'Source Serif 4', Georgia, serif; --main: 'Caveat', 'Segoe Print', 'Ink Free', cursive; color-scheme: light; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { background: var(--papier); }
  /* Le papier : lignes bleues tous les 24 px, la marge rouge à 40 px (sur le corps seulement). */
  body { background-color: var(--papier); background-image: linear-gradient(90deg, transparent 44px, var(--marge) 44px, var(--marge) 45.5px, transparent 45.5px), repeating-linear-gradient(180deg, transparent 0 23px, var(--ligne) 23px 24px); background-position: 50% 0, 0 6px; background-size: 390px 100%, 100% 24px; background-repeat: repeat-y, repeat;
    color: var(--encre); font: 400 14px/1.3 var(--serif); -webkit-tap-highlight-color: transparent; -webkit-touch-callout: none; }
  button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
  svg { display: block; flex: none; }
  .ic, .jc { stroke: currentColor; }
  ::selection { background: #f3e3a6; }
  :focus-visible { outline: 2px solid var(--bleu); outline-offset: 2px; }
  .ecran { max-width: 390px; margin: 0 auto; padding: 4px 12px 84px var(--mg); display: flex; flex-direction: column; gap: 10px; overflow-x: hidden; }

  /* En-tête : des onglets en serif, l'actif souligné d'un trait de crayon. */
  .barre { display: flex; align-items: center; gap: 4px; height: 36px; margin-left: calc(12px - var(--mg)); }
  .retour { width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; color: var(--encre); }
  .onglets { flex: 1; display: flex; justify-content: space-between; }
  .onglets button { height: 30px; padding: 0 8px; font: 500 15px/1 var(--titre); color: var(--encre2); position: relative; }
  .onglets button[aria-checked="true"] { color: var(--encre); font-weight: 650; }
  .onglets button[aria-checked="true"]::after { content: ''; position: absolute; left: 4px; right: 4px; bottom: 2px; height: 3px; border-radius: 2px; background: var(--encre); transform: rotate(-1.2deg); }
  .outils { display: flex; justify-content: space-between; gap: 8px; }
  /* La lentille et la vue : le mot choisi est entouré à la main. */
  .choix { display: inline-flex; align-items: center; gap: 2px; }
  .choix button { height: 28px; padding: 0 9px; font: 400 14px/1 var(--serif); color: var(--encre2); position: relative; }
  .choix button[aria-checked="true"] { color: var(--encre); font-weight: 650; }
  .choix button[aria-checked="true"]::before { content: ''; position: absolute; inset: 1px -1px; border: 1.5px solid var(--bleu); border-radius: 50%; transform: rotate(-3deg); }
  .ou { color: var(--encre2); font-size: 14px; }

  /* Les trois objectifs : la réponse en italique, la famille en lavis. */
  .reps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; }
  .tuile { padding: 2px 8px 6px; display: flex; flex-direction: column; gap: 5px; min-height: 100px; }
  .tuile + .tuile { border-left: 1px solid var(--mine); }
  .tuile:first-child { padding-left: 2px; }
  .tuile .nom { display: flex; align-items: center; gap: 3px; font: 600 13px/1.1 var(--serif); color: var(--encre); }
  .nom .pa { position: relative; display: inline-flex; flex: none; }
  .alerte { position: absolute; right: 0; bottom: 1px; width: 8px; height: 8px; border-radius: 50%; background: var(--acc); box-shadow: 0 0 0 1.5px var(--papier); }
  .rep { font: italic 600 21px/1 var(--titre); letter-spacing: -.01em; color: var(--encre); }
  .rep small { display: block; font: 400 12px/1.2 var(--serif); margin-top: 3px; color: var(--encre2); font-style: normal; }
  .hh-b { margin-top: auto; height: 26px; padding: 0 2px 0 6px; border-radius: 4px; border: 1.5px solid var(--encre); font: 600 12px/1 var(--serif); color: var(--encre); display: inline-flex; align-items: center; gap: 1px; align-self: flex-start; white-space: nowrap; background: var(--papier); }
  .jo { margin-top: auto; position: relative; width: var(--w); height: 16px; display: block; }
  .jo::before { content: ''; position: absolute; left: 0; right: 0; top: 7px; height: 1.5px; background: var(--mine); }
  .jo-f { position: absolute; left: 0; top: 3px; height: 9px; border-radius: 2px; background-color: var(--l); background-image: repeating-linear-gradient(115deg, var(--c) 0 1.6px, transparent 1.6px 4px); }
  .jo-v { position: absolute; top: 0; width: 2px; height: 16px; border-radius: 2px; background: var(--encre); transform: rotate(4deg); }

  /* Le graphique de q2b : ma bière est le trait d'encre du milieu ; les visées, des tirets de mine. */
  .graph { position: relative; }
  .fonds { position: absolute; inset: 0; display: flex; pointer-events: none; }
  .moitie { position: relative; flex: 1; } .moitie .ov { position: absolute; inset: 0; }
  .gut { width: var(--gut); flex: none; position: relative; }
  .gut::before { content: ''; position: absolute; top: 0; bottom: 0; left: 9.5px; width: 2.5px; border-radius: 2px; background: var(--encre); }
  .vl { position: absolute; top: 0; bottom: 0; width: 0; border-left: 1.5px dashed var(--mine); left: var(--s); z-index: 1; }
  body.abs .vl { left: var(--a); }
  .flou { position: absolute; top: 0; bottom: 0; right: var(--s0); width: var(--s1); background: repeating-linear-gradient(115deg, rgba(47,107,95,.18) 0 1.5px, transparent 1.5px 6px); }
  body.abs .flou { right: var(--a0); width: var(--a1); }
  .tetes { position: relative; z-index: 2; display: flex; height: 34px; }
  .tetes .m { flex: 1; position: relative; } .tetes .g { width: var(--gut); flex: none; }
  .axe { position: absolute; top: 5px; height: 1.5px; background: var(--encre); }
  .g-ax { left: 2px; right: 0; } .d-ax { left: 0; right: 2px; }
  .g-ax::before, .d-ax::after { content: ''; position: absolute; top: -3.5px; border: 4.25px solid transparent; }
  .g-ax::before { left: -4px; border-right: 7px solid var(--encre); border-left: 0; }
  .d-ax::after { right: -4px; border-left: 7px solid var(--encre); border-right: 0; }
  .puce { position: absolute; top: 9px; font: 600 18px/22px var(--main); color: var(--bleu); white-space: nowrap; background: var(--papier); padding: 0 4px; border-radius: 4px; display: inline-flex; align-items: center; }
  .puce.gauche-v { left: 2px; }
  .fl .puce.v { left: calc(var(--s) - 20px); }
  .fl .puce.pv { left: calc(var(--a) - 13px); padding: 0; }
  .abs-only { display: none !important; } body.abs .abs-only { display: inline-flex !important; } body.abs .sty-only { display: none !important; }

  /* Les groupes : le titre en serif italique, la note de marge au stylo bleu. */
  .groupe { position: relative; z-index: 2; display: flex; align-items: center; gap: 6px; min-height: 32px; padding: 0 2px; }
  .groupe > span.t { background: var(--papier); padding: 1px 6px 1px 2px; border-radius: 4px; display: inline-flex; gap: 5px; align-items: center; white-space: nowrap; font: italic 600 16px/1.1 var(--titre); color: var(--encre); }
  .groupe .t .jc { color: var(--encre2); }
  .marge { position: absolute; right: calc(100% + 8px); top: 50%; transform: translateY(-50%) rotate(-4deg); width: calc(var(--mg) - 10px); display: flex; flex-direction: column; align-items: flex-end; gap: 0; text-align: right; }
  .mo { font: 600 18px/17px var(--main); color: var(--bleu); white-space: nowrap; }
  .marge .dose { font: 500 16px/15px var(--main); color: var(--bleu); white-space: nowrap; }
  .est { font: italic 400 13px/1 var(--serif); color: var(--encre2); background: var(--papier); padding: 1px 4px; border-radius: 4px; }
  .bars { position: relative; display: flex; height: 34px; }
  .bars .m { position: relative; flex: 1; } .bars .g { width: var(--gut); flex: none; }
  .ln { position: absolute; left: 0; right: 0; height: 11px; } .ln.a { top: 0; } .ln.b { top: 17px; }
  .zt { position: absolute; bottom: -4px; height: 1.5px; width: var(--s); background: var(--c); }
  .zt::after { content: ''; position: absolute; top: -4px; width: 1.5px; height: 9px; background: var(--encre); transform: rotate(5deg); }
  .fl .zt { left: 0; } .fl .zt::after { right: -1px; } .re .zt { right: 0; } .re .zt::after { left: -1px; }
  .zt.cs::after { display: none; } body.abs .zt.cs::after { display: block; } body.abs .zt.ca::after { display: none; }
  body.abs .zt { width: var(--a); }
  /* Une barre au crayon de couleur : marqué, hachures serrées sur un lavis ; cité, hachures lâches ; sans fiche, le contour. */
  .bar { position: absolute; top: 0; height: 11px; min-width: 3px; width: var(--s); z-index: 1; border-radius: 2px; background-color: var(--l); background-image: repeating-linear-gradient(115deg, var(--c) 0 1.8px, transparent 1.8px 3.6px); box-shadow: inset 0 0 0 1px var(--t); }
  body.abs .bar:not(.inconnu) { width: var(--a); }
  .fl .bar { left: 0; } .re .bar { right: 0; }
  .bar.ci { background-color: transparent; background-image: repeating-linear-gradient(115deg, var(--c) 0 1.4px, transparent 1.4px 5.5px); }
  .bar.sf { background-color: transparent; background-image: none; box-shadow: inset 0 0 0 1.2px var(--t); }
  .bar.inconnu { width: 24px; background: repeating-linear-gradient(45deg, transparent 0 2.5px, var(--mine) 2.5px 3.5px); box-shadow: inset 0 0 0 1px var(--mine); }
  .bar.ds::after, body.abs .bar.da::after { content: ''; position: absolute; top: 2px; right: 2px; border: 3.5px solid transparent; border-left: 5px solid var(--encre); }
  body.abs .bar.ds:not(.da)::after { display: none; }
  .hs { position: absolute; top: 0; height: 11px; left: var(--s0); width: var(--s1); z-index: 2; border-radius: 2px; background-color: rgba(194,65,12,.35); background-image: repeating-linear-gradient(115deg, var(--acc) 0 1.8px, transparent 1.8px 3.6px); box-shadow: inset 0 0 0 1px var(--acc); }
  .re .hs { left: auto; right: var(--s0); }
  body.abs .hs { left: var(--a0); width: var(--a1); } body.abs .re .hs { left: auto; right: var(--a0); }
  .lab-i { position: absolute; top: -6px; left: calc(var(--s) + 4px); font: 600 18px/20px var(--main); white-space: nowrap; color: var(--bleu); background: var(--papier); padding: 0 3px; border-radius: 4px; z-index: 3; }
  body.abs .lab-i { left: calc(var(--a) + 4px); }

  /* Le tableau des voies : à même le papier, un filet d'encre pointillé entre deux voies. */
  .tab { position: relative; z-index: 3; margin: 2px 0 12px; background: var(--papier); border-top: 1.5px solid var(--encre); border-bottom: 1.5px solid var(--encre); }
  .vr { padding: 5px 2px 6px; }
  .vr + .vr { border-top: 1px dashed var(--mine); }
  .vr.coupe-l { border-top: 1px solid var(--encre2); }
  .vr.appui, .vr.survol, .vr.f-source { background: #f3ead2; }
  .l1 { display: flex; align-items: center; gap: 5px; min-height: 28px; }
  .nm { font: 600 15px/1.15 var(--serif); color: var(--encre); }
  .nm [data-houblon] { text-decoration: underline dotted var(--mine); text-underline-offset: 3px; }
  .q { font: 600 17px/1 var(--main); color: var(--bleu); white-space: nowrap; }
  .gr { display: inline-flex; align-items: center; gap: 4px; }
  .stk { display: inline-flex; color: var(--encre2); }
  .us { display: inline-flex; align-items: center; height: 20px; padding: 0 3px; border-radius: 10px; border: 1px solid var(--encre); color: var(--encre); flex: none; }
  .us.deduit { border-color: transparent; color: var(--encre2); padding: 0 1px; }
  .us .inc { font-size: 12px; }
  .ajc { margin-left: auto; width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; color: var(--encre); flex: none; border-radius: 4px; }
  .ajc .ic + .ic { display: none; }
  .ajc[aria-pressed="true"] { color: var(--bleu); }
  .ajc[aria-pressed="true"] .ic:first-child { display: none; } .ajc[aria-pressed="true"] .ic + .ic { display: block; }
  .cases { display: flex; align-items: flex-start; gap: 7px; margin-top: 3px; }
  .objs, .exs { display: inline-flex; gap: 2px; }
  .objs { padding-right: 7px; border-right: 1px solid var(--mine); }
  .cf { width: 24px; height: 34px; display: inline-flex; flex-direction: column; align-items: center; gap: 2px; position: relative; }
  .pi { width: 22px; height: 22px; }
  .cf.o .pi { border-radius: 50%; box-shadow: 0 0 0 1.2px var(--encre); }
  .cf.ne .pi { opacity: .5; }
  .cf.vide::after { content: ''; width: 4px; height: 4px; border-radius: 2px; background: var(--mine); margin-top: 9px; opacity: .6; }
  .cf.moins::before { content: ''; position: absolute; left: -2px; top: 0; width: 7px; height: 2px; border-radius: 1px; background: var(--encre); z-index: 1; }
  .jg { display: inline-flex; gap: 2px; height: 8px; align-items: flex-end; }
  .jg i { width: 2px; height: 8px; border-radius: 1px; background: var(--encre); transform: rotate(var(--r, 0deg)); }
  .jg i.pt { width: 3px; height: 3px; border-radius: 2px; transform: none; }
  .jg.bas i { background: transparent; box-shadow: inset 0 0 0 1px var(--encre); width: 3px; } .jg.bas i.pt { background: var(--encre); }
  .jg.xs i { background: var(--acc); }
  .jg.ne i { width: 14px; height: 5px; background: repeating-linear-gradient(45deg, transparent 0 2px, var(--mine) 2px 3px); box-shadow: inset 0 0 0 1px var(--mine); transform: none; }
  .rangee { position: relative; padding: 2px 0 10px; }

  details.bio { display: inline-block; position: static; }
  .tab:has(details.bio[open]) { z-index: 7; }
  details.bio summary { list-style: none; display: inline-flex; align-items: center; gap: 2px; height: 26px; padding: 0 3px; border-radius: 4px; border: 1px dashed var(--encre2); cursor: pointer; }
  details.bio summary::-webkit-details-marker { display: none; }
  .bt { display: inline-flex; align-items: center; gap: 0; height: 22px; color: var(--encre); }
  .bt.mot span { font: 600 17px/1 var(--main); color: var(--bleu); margin: 0 2px; }
  details.bio[open] ul { position: absolute; left: 0; right: 0; z-index: 6; background: var(--bristol); border-radius: 4px; box-shadow: 0 8px 24px -12px rgba(43,34,25,.5), inset 0 0 0 1px var(--ombre); padding: 10px 12px 10px 26px; font-size: 13px; display: flex; flex-direction: column; gap: 6px; }
  .src { color: var(--encre2); font-size: 12px; font-style: italic; }
  details.pli { padding: 6px 0; border-top: 1px dashed var(--mine); }
  details.pli summary { list-style: none; font: italic 600 15px/1.25 var(--titre); cursor: pointer; display: flex; gap: 4px; align-items: flex-start; }
  details.pli summary .ic { margin-top: 1px; }
  details.pli summary::-webkit-details-marker { display: none; }
  details.pli[open] summary .ic { transform: rotate(90deg); }
  details.pli ul { margin: 8px 0 0 20px; display: flex; flex-direction: column; gap: 6px; font-size: 13px; }

  /* La seule action principale : un tampon à l'encre bleue. */
  .cmp { position: fixed; z-index: 8; left: 50%; transform: translateX(-50%) rotate(-1deg); bottom: 14px; height: 40px; padding: 0 20px; border-radius: 4px; background: var(--bleu); color: var(--bristol); display: flex; align-items: center; justify-content: center; gap: 6px; font: 600 17px/1 var(--titre); text-decoration: none; box-shadow: 0 8px 24px -12px rgba(31,60,136,.9), inset 0 0 0 2px rgba(255,253,248,.35); white-space: nowrap; }

  /* Les pictos de famille : le trait au ton texte de la famille, tremblé ; le lavis au ton base. */
  ${famCSS}

  /* La fiche : une fiche bristol au téléphone et à l'ordinateur. */
  .f-voile { position: fixed; inset: 0; z-index: 20; background: rgba(43,34,25,.28); }
  .f-fiche { position: fixed; z-index: 21; background-color: var(--bristol); background-image: repeating-linear-gradient(180deg, transparent 0 23px, var(--ligne) 23px 24px); background-position: 0 58px; color: var(--encre); box-shadow: 0 -12px 40px -16px rgba(43,34,25,.6); overflow-y: auto; overscroll-behavior: contain; font-family: var(--serif); }
  .f-feuille { left: 6px; right: 6px; bottom: 0; max-height: calc(100% - 60px); border-radius: 4px 4px 0 0; padding: 4px 14px 16px; }
  .f-bulle { width: 382px; max-height: calc(100% - 16px); border-radius: 4px; padding: 6px 14px 14px; box-shadow: 0 8px 24px -12px rgba(43,34,25,.6), inset 0 0 0 1px var(--ombre); }
  .f-poignee { width: 36px; height: 4px; border-radius: 2px; background: var(--ombre); margin: 2px auto 2px; }
  .f-bulle .f-poignee { display: none; }
  .f-tete { display: flex; align-items: center; gap: 6px; height: 40px; border-bottom: 1.5px solid var(--marge); margin-bottom: 4px; }
  .f-nom { font: 600 22px/1 var(--titre); }
  .f-fermer { margin-left: auto; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: var(--encre); }
  .f-ab { display: flex; align-items: center; gap: 8px; min-height: 30px; }
  .f-alpha { display: inline-flex; align-items: baseline; gap: 5px; }
  .f-grec { font: italic 17px/1 var(--titre); color: var(--encre2); }
  .f-aa { font: 600 20px/1 var(--titre); font-variant-numeric: tabular-nums lining-nums; }
  .f-lot { font: 600 17px/1 var(--main); color: var(--bleu); }
  .f-role { margin-left: auto; font: italic 14px/1 var(--serif); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--encre); }
  .f-role.regle { border-style: dashed; color: var(--encre2); }
  .f-note { font-size: 12px; color: var(--encre2); font-style: italic; }
  .f-labels { display: flex; flex-direction: column; gap: 4px; padding: 4px 0; }
  .f-bande { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .f-bande-c { display: inline-flex; gap: 3px; }
  .f-bande-c .c { width: 20px; height: 20px; }
  .f-bande-c .c.sep { margin-left: 6px; }
  .c { display: inline-block; width: 14px; height: 14px; border-radius: 2px; box-shadow: inset 0 0 0 1px var(--ombre); flex: none; }
  .c.m { background-color: var(--l); background-image: repeating-linear-gradient(115deg, var(--c) 0 1.8px, transparent 1.8px 3.6px); box-shadow: inset 0 0 0 1px var(--t); }
  .c.ci { background-image: repeating-linear-gradient(115deg, var(--c) 0 1.4px, transparent 1.4px 5px); box-shadow: inset 0 0 0 1px var(--t); }
  .f-seule { font-size: 12px; color: var(--encre2); font-style: italic; }
  .f-lab { display: grid; grid-template-columns: 16px 1fr; column-gap: 7px; align-items: baseline; font-size: 13px; color: var(--encre2); }
  .f-lab .c { align-self: center; }
  .f-lab-n { font: 600 15px/1.1 var(--titre); }
  .f-lab-mots { grid-column: 2; font: 600 17px/1 var(--main); color: var(--bleu); }
  .f-lab-sans, .f-lab-nd { font-size: 12px; color: var(--encre2); padding-left: 23px; font-style: italic; }
  .roue { margin: 0 auto; }
  .f-dem { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; font-size: 13px; color: var(--encre2); }
  .f-dem b { color: var(--encre); font-weight: 600; }
  .f-actions { display: flex; align-items: center; gap: 6px; margin-top: 10px; }
  .f-gout { display: inline-flex; gap: 2px; }
  .f-g { width: 30px; height: 30px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: var(--encre); }
  .f-g[aria-pressed="true"] { color: var(--bleu); box-shadow: inset 0 0 0 1.5px var(--bleu); }
  .f-act { height: 32px; padding: 0 12px; border-radius: 4px; border: 1.5px solid var(--encre); font: 600 14px/1 var(--serif); display: inline-flex; align-items: center; gap: 4px; background: var(--bristol); }
  .f-comparer { margin-left: auto; }
  .f-replis { display: flex; gap: 2px; margin-top: 10px; border-top: 1px dashed var(--mine); padding-top: 6px; }
  .f-repli { flex: 1; height: 28px; font: italic 14px/1 var(--serif); color: var(--encre); display: inline-flex; align-items: center; justify-content: center; gap: 1px; border-radius: 4px; }
  .f-repli[aria-expanded="true"] { font-weight: 600; text-decoration: underline; }
  .f-repli[aria-expanded="true"] .ic { transform: rotate(180deg); }
  .f-sec[hidden] { display: none; }
  .f-sec { padding: 6px 0 0; display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
  .f-rg { display: flex; justify-content: space-between; gap: 8px; } .f-rg-n { color: var(--encre2); } .f-rg-v { font-variant-numeric: tabular-nums; }
  .f-tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .f-tag { font: 600 17px/1 var(--main); color: var(--bleu); }
`;
const page = (corps) => `<!doctype html>
<html lang="fr" data-cas="c1">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Carnet · Suggestions</title>
<!-- Lot 18 · l2 · Carnet de brasseur : q2b (c1) écrit dans un carnet ligné à marge rouge. Encre pour le texte, Fraunces et Source Serif 4, notes de marge au stylo bleu (Caveat) : le moment et la dose de chaque groupe, les crans. Pictos duo dessinés (trait au ton texte de la famille, lavis au ton base, tremblé au crayon) ; barres hachurées au crayon de couleur ; intensité en bâtons ; « + » devenu case à cocher ; lentille au mot entouré. Appui long 500 ms (survol 750 ms) : la fiche g1 sur une fiche bristol. -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,600&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&display=swap">
<style>${CSS}</style>
</head>
<body>
${sprite('<filter id="crayon" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="7"/><feDisplacementMap in="SourceGraphic" scale="1.4"/></filter>')}
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
console.log('texte de famille sur papier (jeton texte) : ' + Object.entries(TEXTE).map(([f, t]) => f + ' ' + contraste(t, K.papier).toFixed(2)).join(', '));

// ---------- la planche : l'écran en mini (premier écran, fiche ouverte, plus bas, absolu) et l'abécédaire ----------
{
  const mini = (q, t) => `<figure class="mi"><div class="cadre"><iframe src="etat-b.html${q}" width="390" height="844" loading="eager" title="${t}" tabindex="-1"></iframe></div><figcaption>${t}</figcaption></figure>`;
  const cellule = (t, c) => `<div class="ab"><div class="ab-c">${c}</div><span class="ab-t">${t}</span></div>`;
  const X15 = V[14];
  const ab = [
    cellule('surfaces', `<span class="sw papier"></span><span class="sw" style="background:${K.bristol}"></span><span class="sw" style="background:${K.encre}"></span><span class="sw" style="background:${K.bleu}"></span>`),
    cellule('texte', `<span class="tx"><b class="rep">Approche</b><span style="font:600 15px/1.1 var(--serif)">Motueka <span class="q">10 g</span></span><span class="mo">60′</span></span>`),
    cellule('action', `<span class="ajc" aria-hidden="true">${ic('case')}</span><span class="ajc" aria-hidden="true" style="color:${K.bleu}">${ic('case-ok')}</span><span class="choix"><button role="radio" aria-checked="true" tabindex="-1">Au style</button></span>`),
    cellule('famille', `<span class="cf o mq" data-famille="floral">${picto('floral', 30)}</span><span class="cf mq" data-famille="resin">${picto('resin', 30)}</span><span class="cf ci" data-famille="citrus">${picto('citrus', 30, '', false)}</span>`),
    cellule('piste au style', `<div class="pst">${couloirs(X15, false)}</div><span class="jg"><i style="--r:-6deg"></i><i style="--r:4deg"></i></span><span class="jg xs"><i style="--r:-3deg"></i><i style="--r:5deg"></i><i style="--r:-4deg"></i></span>`),
    cellule('bouton', `<span class="cmp statique">Comparer <b class="nb">(2)</b></span>`),
  ].join('');
  const css = `
  body { padding: 10px 12px 16px; background-image: repeating-linear-gradient(180deg, transparent 0 23px, var(--ligne) 23px 24px); background-position: 0 6px; background-size: 100% 24px; }
  .pl { max-width: 366px; margin: 0 auto; display: flex; flex-direction: column; gap: 10px; }
  h1 { font: 600 20px/1 var(--titre); color: var(--encre); display: flex; gap: 8px; align-items: baseline; }
  h1 i { font: italic 600 20px/1 var(--serif); }
  h1 span { font: 600 19px/1 var(--main); color: var(--bleu); }
  .minis { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 12px; }
  .mi { display: flex; flex-direction: column; gap: 4px; }
  .cadre { width: 175px; height: 380px; overflow: hidden; border-radius: 2px; box-shadow: 0 6px 18px -10px rgba(43,34,25,.6), inset 0 0 0 1px var(--ombre); position: relative; background: var(--papier); }
  .cadre iframe { border: 0; transform: scale(.4487); transform-origin: 0 0; position: absolute; left: 0; top: 0; pointer-events: none; }
  figcaption { font: 600 17px/1 var(--main); color: var(--bleu); }
  .abc { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .ab { background: var(--bristol); border-radius: 2px; box-shadow: 0 6px 18px -12px rgba(43,34,25,.6), inset 0 0 0 1px var(--ombre); padding: 8px; display: flex; flex-direction: column; gap: 6px; min-height: 96px; }
  .ab:nth-child(5) { grid-column: span 2; }
  .ab-c { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; flex: 1; }
  .ab-t { font: 600 16px/1 var(--main); color: var(--bleu); }
  .sw { width: 22px; height: 40px; border-radius: 2px; box-shadow: inset 0 0 0 1px var(--ombre); }
  .sw.papier { background-color: var(--papier); background-image: repeating-linear-gradient(180deg, transparent 0 7px, var(--ligne) 7px 8px); }
  .tx { display: flex; flex-direction: column; gap: 3px; }
  .pst { position: relative; width: 100%; }
  .cmp.statique { position: static; transform: rotate(-1deg); height: 34px; padding: 0 12px; font-size: 15px; }`;
  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Carnet · planche</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,600&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&display=swap">
<style>${CSS}${css}</style>
</head>
<body>
${sprite('<filter id="crayon" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="7"/><feDisplacementMap in="SourceGraphic" scale="1.4"/></filter>')}
<div class="pl">
  <h1><i>l2</i> · Carnet <span>q2b au stylo et au crayon</span></h1>
  <div class="minis">${mini('', 'premier écran')}${mini('?fiche=Motueka', 'appui long : la fiche')}${mini('?y=1180', 'les autres gestes')}${mini('?abs', 'absolu')}</div>
  <div class="abc">${ab}</div>
</div>
</body>
</html>
`;
  ecrire(OUT + '/planche.html', html);
}
