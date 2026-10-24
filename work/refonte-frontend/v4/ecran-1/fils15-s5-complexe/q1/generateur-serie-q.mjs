// Lot 15, série q : génère q1 (etat-b + comparer), q2, q3, q4 depuis donnees/c1.json (aucun chiffre recopié).
// Usage : node gen-q.mjs
import fs from 'node:fs';
import path from 'node:path';

const REPO = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie';
const BASE = REPO + '/work/refonte-frontend/v4/ecran-1/fils15-s5-complexe';
const C = JSON.parse(fs.readFileSync(BASE + '/donnees/c1.json', 'utf8'));
const PACK = JSON.parse(fs.readFileSync(REPO + '/prototypes/houblons-v4/data/pack-mini-protos.json', 'utf8'));
const PICTOS = fs.readFileSync(BASE + '/pictos-familles.html', 'utf8').match(/<svg id="pictos" [^>]*>[\s\S]*?<\/svg>/)[0];

const ORDRE = ['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'stoneFruit', 'pomeFruit', 'berries', 'melon', 'resin', 'spice', 'green'];
const NOM = { citrus: 'Agrumes', tropical: 'Fruits tropicaux', melon: 'Melon', stoneFruit: 'Fruits à noyau', pomeFruit: 'Fruits à pépins', berries: 'Petits fruits', floral: 'Floral', herbal: 'Herbacé', resin: 'Boisé et résineux', spice: 'Épicé', green: 'Végétal', earthy: 'Terreux' };
const COUL = { citrus: '#d9b414', tropical: '#ee9b2f', melon: '#6fc09b', stoneFruit: '#e88d68', pomeFruit: '#a3bd38', berries: '#9b3f74', floral: '#bf86d6', green: '#6aa33a', herbal: '#3f8a5f', spice: '#7a4e3a', earthy: '#9a8a66', resin: '#2f6b5f' };
const OBJ = ['floral', 'citrus', 'resin'];
const OB = Object.fromEntries(C.objectifs.map((o) => [o.famille, o]));
const BANDE = {}, AVANT = {};
for (const v of C.voies) for (const t of v.tout) { BANDE[t.famille] = t.bande; if (t.avant != null) AVANT[t.famille] = t.avant; }
const bande = (f) => BANDE[f] || [0, 30];
const cran = (f) => (OB[f] ? OB[f].cran : bande(f)[1] === 55 ? 18.3 : 10);
// Résineux : ma bière d'après la dégustation (pack S1, même recette et même dégustation que c1).
const DEG = PACK.scenarios.S1.tasting.axes.find((x) => x.family === 'resin').perceivedRange; // 66–100
const r1 = (x) => Math.round(x * 10) / 10;
const p = (x) => r1(x) + '%';
const fr = (x) => String(r1(x)).replace('.', ',').replace('-', '−');
const sg = (x) => (x > 0 ? '+' : '') + fr(x);
const cl = (x) => Math.max(0, Math.min(100, x));

// Zone du style autour de ma bière (en % de demi-piste : 3 crans au style, 50 points en absolu).
function zone(f) {
  if (f === 'resin') return null; // la zone est hors du graphique (ma bière au-dessus de la bande)
  const a = AVANT[f]; if (a == null) return undefined; // ma bière non située sur cette famille
  const [b0, b1] = bande(f), c = cran(f);
  const rS0 = (b1 - a) / c / 3 * 100, lS0 = (a - b0) / c / 3 * 100, rA0 = (b1 - a) / 50 * 100, lA0 = (a - b0) / 50 * 100;
  return { rS: cl(rS0), lS: cl(lS0), rA: cl(rA0), lA: cl(lA0), rS0, lS0, rA0, lA0 };
}
// La piste du style : un rail fin jusqu'à la fin de la bande ; le trait de fin seulement s'il est dans le graphique.
const ztEl = (f, s0, a0) => `<i class="zt${s0 > 100 ? ' cs' : ''}${a0 > 100 ? ' ca' : ''}" data-role="zone" style="--c:${COUL[f]};--s:${p(cl(s0))};--a:${p(cl(a0))}"></i>`;
const viseeS = (f) => (OB[f].visee - OB[f].maBiere.central) / OB[f].cran / 3 * 100;
const viseeA = (f) => (OB[f].visee - OB[f].maBiere.central) / 50 * 100;

// Le niveau des fiches : marqué (plein), cité (pâle), sans fiche (contour : levure, retrait du Nugget).
function niv(v, f, e) {
  if (e < 0) return 'sf';
  let best = null;
  for (const h of v.fiches || []) for (const x of h.familles) if (x.famille === f) best = x.niveau === 'marqué' ? 'mq' : best || 'ci';
  return best || 'sf';
}
const NIVMOT = { mq: 'marqué dans ses fiches', ci: 'cité par une fiche', sf: 'sans fiche (modèle seul)' };

const V = C.voies.map((v, i) => {
  const extras = v.tout.filter((t) => !t.visee && Math.abs(t.effet) >= 0.5).sort((a, b) => ORDRE.indexOf(a.famille) - ORDRE.indexOf(b.famille));
  return { n: i + 1, v, extras, hs: new Set((v.horsStyle || []).map((x) => x.family)) };
});
const nomVoie = (v) => {
  if (v.levureVers) return { nom: v.levureVers, q: '' };
  if (v.type === 'assemblage') return { nom: v.actions.map((a) => a.houblon).join(' + '), q: '' };
  if (v.type.startsWith('remplacer')) return { nom: v.actions[0].houblon, q: v.actions[0].grammes + ' g' };
  if (v.type === 'levure') return { nom: v.actions[0].houblon, q: v.actions[0].grammes + ' g' };
  return { nom: v.actions[0].houblon, q: '' };
};

// ---------- icônes ----------
const I = {
  stock: '<svg width="16" height="16" viewBox="0 0 18 18" aria-label="En stock"><rect x="2" y="5" width="14" height="11" rx="2" fill="#16161a"/><path d="M5 10.5 L8 13 L13 8" stroke="#fff" stroke-width="2" fill="none"/><rect x="4" y="2" width="10" height="3" rx="1" fill="#16161a"/></svg>',
  acheter: '<svg width="16" height="16" viewBox="0 0 18 18" aria-label="À acheter"><path d="M1 3 H4 L6 12 H14 L16 5 H5" fill="none" stroke="#16161a" stroke-width="2"/><circle cx="7" cy="15" r="1.6" fill="#16161a"/><circle cx="13" cy="15" r="1.6" fill="#16161a"/></svg>',
  manque: '<svg width="16" height="16" viewBox="0 0 18 18" aria-label="Stock insuffisant"><rect x="2" y="5" width="14" height="11" rx="2" fill="none" stroke="#16161a" stroke-width="2"/><rect x="2" y="11" width="14" height="5" rx="1" fill="#16161a"/><rect x="4" y="2" width="10" height="3" rx="1" fill="#16161a"/></svg>',
  arome: '<svg width="14" height="14" viewBox="0 0 14 14" aria-label="Arôme"><path d="M2 9 C4 4, 10 4, 12 9" fill="none" stroke="#16161a" stroke-width="2"/><circle cx="7" cy="10.5" r="2" fill="#16161a"/></svg>',
  amer: '<svg width="14" height="14" viewBox="0 0 14 14" aria-label="Amertume"><path d="M7 1 C9 5, 12 7, 12 9.5 A5 5 0 0 1 2 9.5 C2 7, 5 5, 7 1 Z" fill="#16161a"/></svg>',
  levure: '<svg width="16" height="14" viewBox="0 0 16 14" aria-hidden="true"><circle cx="6" cy="8" r="5" fill="none" stroke="#16161a" stroke-width="1.8"/><circle cx="12.2" cy="3.8" r="2.8" fill="none" stroke="#16161a" stroke-width="1.6"/><circle cx="5" cy="7" r="1.2" fill="#16161a"/></svg>',
  cuveActif: '<svg width="14" height="16" viewBox="0 0 14 16" aria-hidden="true"><path d="M2 1 H12 V9 L7 15 L2 9 Z" fill="none" stroke="#16161a" stroke-width="1.7" stroke-linejoin="round"/><circle cx="5.5" cy="7" r="1.2" fill="#16161a"/><circle cx="8.5" cy="4.5" r="1.2" fill="#16161a"/><circle cx="7.5" cy="9.5" r="1" fill="#16161a"/></svg>',
  cuve: '<svg width="14" height="16" viewBox="0 0 14 16" aria-hidden="true"><path d="M2 1 H12 V9 L7 15 L2 9 Z" fill="none" stroke="#16161a" stroke-width="1.7" stroke-linejoin="round"/></svg>',
  remous: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M7 7 m-1 0 a1 1 0 1 1 2 0 a3 3 0 1 1 -6 0 a5 5 0 1 1 10 0" fill="none" stroke="#16161a" stroke-width="1.6"/></svg>',
  egal: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><rect x="2" y="4" width="10" height="2.2" rx="1" fill="#16161a"/><rect x="2" y="8" width="10" height="2.2" rx="1" fill="#16161a"/></svg>',
  bulles: '<svg width="16" height="16" viewBox="0 0 16 16" aria-label="Hop creep : la fermentation peut reprendre"><circle cx="5" cy="12" r="2.6" fill="none" stroke="#3a3a42" stroke-width="1.6"/><circle cx="10.5" cy="8" r="2" fill="none" stroke="#3a3a42" stroke-width="1.5"/><circle cx="6.5" cy="4" r="1.5" fill="none" stroke="#3a3a42" stroke-width="1.4"/><path d="M13 6 V1.5 M11 3.5 L13 1.5 L15 3.5" stroke="#3a3a42" stroke-width="1.4" fill="none"/></svg>',
  fleche: '<svg width="12" height="10" viewBox="0 0 12 10" aria-hidden="true"><path d="M1 5 H10 M7 2 L10 5 L7 8" stroke="#16161a" stroke-width="1.6" fill="none"/></svg>',
  gauche: '<svg width="9" height="10" viewBox="0 0 9 10" aria-hidden="true"><path d="M7 1 L2 5 L7 9" stroke="#fff" stroke-width="2" fill="none"/></svg>',
  haut: '<svg width="9" height="9" viewBox="0 0 9 9" aria-label="à monter"><path d="M4.5 1 L8 7.5 H1 Z" fill="#16161a"/></svg>',
  bas: '<svg width="9" height="9" viewBox="0 0 9 9" aria-label="à baisser"><path d="M4.5 8 L8 1.5 H1 Z" fill="#16161a"/></svg>',
};
const stockIcone = (v) => (v.levureVers ? '' : v.stock === 'suffisant' ? I.stock : v.stock === 'à acheter' ? I.acheter : I.manque);
const MOMENT = {
  b60: ['60′', '', 'à 60′'], b10: ['10′', '', 'à 10′'], wp: ['WP', I.remous, 'au whirlpool'],
  dryActive: ['actif', I.cuveActif, 'dry hop en fermentation active'], dryPost: ['après', I.cuve, 'dry hop après fermentation'], levure: ['', I.levure, 'levure : toute la fermentation'],
};
const pill = (id) => { const [t, ic, lg] = MOMENT[id]; return `<span class="mo" data-role="moment" data-moment="${id}" title="${lg}" aria-label="Moment : ${lg}">${ic}${t ? '<span>' + t + '</span>' : ''}</span>`; };
const momentDe = (v) => (v.levureVers ? 'levure' : v.actions[0].momentId);
const picto = (f, w = 16) => `<svg class="pi" width="${w}" height="${w}" aria-label="${NOM[f]}"><use href="#p-${f}"/></svg>`;

// ---------- barres divergentes (s5) ----------
function pctBar(f, e) {
  let s = Math.abs(e) / cran(f) / 3 * 100, a = Math.abs(e) / 50 * 100;
  return { s: Math.min(s, 100), a: Math.min(a, 100), ds: s > 100, da: a > 100 };
}
function hsSeg(f, b, side) {
  const z = zone(f); let s0, s1, a0, a1;
  if (z) { const zs = side === 'r' ? z.rS : z.lS, za = side === 'r' ? z.rA : z.lA; s0 = Math.min(zs, b.s); s1 = Math.max(0, b.s - zs); a0 = Math.min(za, b.a); a1 = Math.max(0, b.a - za); }
  else { s0 = Math.max(0, b.s - 5); s1 = Math.min(5, b.s); a0 = Math.max(0, b.a - 5); a1 = Math.min(5, b.a); }
  return `<i class="hs" title="${NOM[f]} : hors du style après la voie" style="--s0:${p(s0)};--s1:${p(s1)};--a0:${p(a0)};--a1:${p(a1)}"></i>`;
}
function bar(X, f, e, side, extraAttr = '') {
  const b = pctBar(f, e), n = niv(X.v, f, e);
  let h = `<i class="bar ${n}${b.ds ? ' ds' : ''}${b.da ? ' da' : ''}" data-role="effet" data-famille="${f}" ${extraAttr} title="${NOM[f]} ${sg(e)} · ${NIVMOT[n]}" style="--c:${COUL[f]};--s:${p(b.s)};--a:${p(b.a)}"></i>`;
  if (X.hs.has(f)) h += hsSeg(f, b, side);
  return h;
}
const inconnu = (f) => `<i class="bar inconnu" data-role="effet" data-famille="${f}" title="${NOM[f]} : effet non établi"></i>`;
function zt(f, side) {
  const z = zone(f); if (!z) return '';
  return ztEl(f, side === 'r' ? z.rS0 : z.lS0, side === 'r' ? z.rA0 : z.lA0);
}
// Deux couloirs : en haut le floral (des deux côtés), en bas le résineux (à gauche) et les agrumes (à droite).
function couloirs(X, bio = '') {
  const e = X.v.effet; let la = '', lb = '', ra = '', rb = '';
  if (!e.floral.etabli) ra = zt('floral', 'r') + inconnu('floral');
  else if (e.floral.central >= 0) ra = zt('floral', 'r') + bar(X, 'floral', e.floral.central, 'r');
  else { ra = zt('floral', 'r'); la = zt('floral', 'l') + bar(X, 'floral', e.floral.central, 'l'); }
  rb = zt('citrus', 'r') + (e.citrus.etabli ? bar(X, 'citrus', e.citrus.central, 'r') : inconnu('citrus'));
  lb = e.resin.etabli ? bar(X, 'resin', e.resin.central, 'l') : inconnu('resin');
  return `<div class="bars"><div class="m re"><div class="ln a">${la}</div><div class="ln b">${lb}</div></div><div class="g"></div><div class="m fl"><div class="ln a">${ra}${bio && bio.floral ? bio.floral : ''}</div><div class="ln b">${rb}${bio && bio.citrus ? bio.citrus : ''}</div></div></div>`;
}

// ---------- extras en pictos ----------
function exPicto(X, t, w = 16) {
  const n = niv(X.v, t.famille, t.effet), hs = X.hs.has(t.famille);
  return `<span class="ex ${n}${t.effet < 0 ? ' moins' : ''}${hs ? ' xs' : ''}" data-role="extra" data-famille="${t.famille}" title="${NOM[t.famille]} ${sg(t.effet)} · ${NIVMOT[n]}${hs ? ' · hors du style' : ''}">${picto(t.famille, w)}</span>`;
}
const exPictos = (X) => `<span class="exs">${X.extras.map((t) => exPicto(X, t)).join('')}</span>`;

// ---------- biotransformation (voie 15) : des tendances hachurées, sans chiffre ----------
function bioPill(X) {
  const b = X.v.bio || []; if (!b.length) return '';
  const sig = b.flatMap((h) => h.signaux);
  const has = (id) => sig.find((s) => s.id === id);
  let pic = '';
  if (has('geraniol-citronellol')) pic += `<span class="bt" title="${has('geraniol-citronellol').titre} (${has('geraniol-citronellol').statut})">${picto('floral', 14)}${I.fleche}${picto('citrus', 14)}</span>`;
  if (has('thiols')) pic += `<span class="bt" title="${has('thiols').titre} (${has('thiols').statut})">${picto('tropical', 14)}${picto('berries', 14)}</span>`;
  if (has('hop-creep')) pic += `<span class="bt" title="${has('hop-creep').titre} (${has('hop-creep').statut})">${I.bulles}</span>`;
  const liste = sig.map((s) => `<li><b>${s.titre}</b> · ${s.statut}. <span class="src">${s.pourquoi}</span></li>`).join('');
  return `<details class="bio" data-role="bio"><summary aria-label="Biotransformation possible, ampleur non quantifiée">${pic}</summary><ul>${liste}</ul></details>`;
}

// ---------- haut de page ----------
const tete = (actif) => `
  <div class="barre">
    <a class="retour" href="${actif === 'Comparer' ? 'etat-b.html' : '#'}" aria-label="Retour"></a>
    <div class="seg" role="radiogroup" aria-label="Partie">
      ${['Ma bière', 'Suggestions', 'Comparer'].map((x) => `<button role="radio" aria-checked="${x === actif}">${x}</button>`).join('')}
    </div>
  </div>
  <div class="outils">
    <div class="seg lentille" role="radiogroup" aria-label="Lecture des familles">
      <button role="radio" data-e="style" aria-checked="true">Au style</button>
      <button role="radio" data-e="absolu" aria-checked="false">Absolu</button>
    </div>
    <div class="seg" role="radiogroup" aria-label="Vue">
      <button role="radio" aria-checked="true">Barres</button>
      <button role="radio" aria-checked="false">Radar</button>
    </div>
  </div>`;

function cible(frac, visee) { // petite piste de la tuile : la barre et la visée
  const w = 64, x = Math.round(visee * w), b = Math.round(Math.min(1, frac) * w);
  return `<svg class="cible" width="${w}" height="34" viewBox="0 0 ${w} 34" aria-hidden="true"><rect x="0" y="13" width="${w}" height="8" rx="4" fill="#fff"/><rect x="0" y="13" width="${b}" height="8" rx="4" fill="var(--k)"/><line x1="${x}" y1="4" x2="${x}" y2="30" stroke="#16161a" stroke-width="2.5" stroke-dasharray="4 3"/></svg>`;
}
// Réponses : meilleure voie qui garde ma bière dans le style (une voie qui sort du style n'est pas une réponse).
function meilleure(f, sens) {
  const c = V.filter((X) => X.v.effet[f].etabli && !X.hs.size);
  if (!c.length) return null;
  return c.reduce((b, X) => ((sens > 0 ? X.v.effet[f].central > b.v.effet[f].central : X.v.effet[f].central < b.v.effet[f].central) ? X : b));
}
function reponses() {
  const fl = meilleure('floral', 1), ci = meilleure('citrus', 1);
  const vFl = OB.floral.maBiere.central + fl.v.effet.floral.central, vCi = OB.citrus.maBiere.central + ci.v.effet.citrus.central;
  const verd = (f, v) => (v >= OB[f].visee ? 'atteint' : Math.abs(v - OB[f].visee) <= Math.abs(OB[f].maBiere.central - OB[f].visee) / 2 ? 'approche' : 'aucune');
  const dFl = verd('floral', vFl), dCi = verd('citrus', vCi);
  const MOT = { atteint: 'Atteint', approche: 'Approche', aucune: 'Aucune' };
  // Résineux : ma bière (dégustation) au-dessus de la bande ; la plus forte baisse houblon reste loin de la visée.
  const re = meilleure('resin', -1);
  const reApres = DEG.min + re.v.effet.resin.central;
  const dRe = reApres <= OB.resin.visee ? 'atteint' : 'aucune';
  const frFl = fl.v.effet.floral.central / OB.floral.cran, frCi = ci.v.effet.citrus.central / OB.citrus.cran;
  return `
  <div class="reps">
    <section class="tuile resin" data-role="objectif" data-famille="resin" aria-label="Moins résineux : ma bière est au-dessus du style d'après la dégustation ; aucune voie houblon ne l'y ramène">
      <span class="nom"><span class="pa">${picto('resin', 18)}<i class="alerte" title="Ma bière au-dessus du style (dégustation ${DEG.min}–${DEG.max}, bande ${bande('resin').join('–')})"></i></span>Moins résineux</span>
      <div class="rep v-${dRe}" data-role="reponse" data-famille="resin" data-verdict="${dRe}">${MOT[dRe]}<small>voie houblon</small></div>
      <button class="hors" onclick="var d=document.getElementById('hh');d.open=true;d.scrollIntoView({behavior:'smooth'})">Hors houblon<svg width="8" height="10" viewBox="0 0 8 10" aria-hidden="true"><path d="M2 1 L6 5 L2 9" fill="none" stroke="#1f5247" stroke-width="2"/></svg></button>
    </section>
    <section class="tuile floral" data-role="objectif" data-famille="floral" aria-label="Plus floral : la meilleure voie, ${nomVoie(fl.v).nom}, ${MOT[dFl].toLowerCase()} la visée (${fr(OB.floral.maBiere.central)} → ${fr(vFl)}, visée ${fr(OB.floral.visee)})" style="--k:#9f5cc0">
      <span class="nom">${picto('floral', 18)}Plus floral</span>
      <div class="rep v-${dFl}" data-role="reponse" data-famille="floral" data-verdict="${dFl}">${MOT[dFl]}</div>
      ${cible(frFl / 1.15, 1 / 1.15)}
    </section>
    <section class="tuile citrus" data-role="objectif" data-famille="citrus" aria-label="Plus agrumes : la meilleure voie, ${nomVoie(ci.v).nom}, ${MOT[dCi].toLowerCase()} la visée (${fr(OB.citrus.maBiere.central)} → ${fr(vCi)}, visée ${fr(OB.citrus.visee)})" style="--k:#c9a300">
      <span class="nom">${picto('citrus', 18)}Plus agrumes</span>
      <div class="rep v-${dCi}" data-role="reponse" data-famille="citrus" data-verdict="${dCi}">${MOT[dCi]}</div>
      ${cible(frCi / 1.7, 1 / 1.7)}
    </section>
  </div>`;
}

// Fond du graphique : deux demi-pistes, ma bière au centre ; les visées en tirets.
function fonds() {
  const flS = viseeS('floral'), flA = viseeA('floral'), ciA = viseeA('citrus');
  const fo0 = cl((DEG.min - OB.resin.visee) / 50 * 100);
  return `
    <div class="fonds">
      <div class="moitie re" data-role="piste" data-famille="resin">
        <i class="flou" style="--s0:100%;--s1:0%;--a0:${p(fo0)};--a1:${p(100 - fo0)}"></i>
        <i class="coupe" title="La zone du style, pour le résineux, est plus loin : ma bière y est de ${DEG.min} à ${DEG.max}, la bande va jusqu'à ${bande('resin')[1]}"></i>
      </div>
      <div class="gut"><span class="biere-l">ma bière</span></div>
      <div class="moitie fl" data-role="piste" data-famille="floral">
        <i class="ov" data-role="piste" data-famille="citrus"></i>
        <i class="vl" style="--s:${p(flS)};--a:${p(flA)}"></i>
        <i class="vl" style="--s:${p(viseeS('citrus'))};--a:${p(ciA)}"></i>
      </div>
    </div>
    <div class="tetes">
      <div class="m re"><span class="puce v gauche-v">${I.gauche}visée</span></div>
      <div class="g"></div>
      <div class="m fl"><span class="puce v sty-only" style="--s:${p(flS)}">visée</span>
        <span class="puce pv abs-only" style="--a:${p(flA)}">${picto('floral', 14)}</span><span class="puce pv abs-only" style="--a:${p(ciA)}">${picto('citrus', 14)}</span></div>
    </div>`;
}

const GROUPES = [
  { t: 'Ajouter 10 g', ic: I.arome, mo: 'b10', voies: [1, 2, 3, 4, 5, 7, 9, 10, 11] },
  { t: 'Assembler 5 + 5 g', ic: I.arome, mo: 'b10', est: true, voies: [6, 8] },
  { t: 'Remplacer Nugget', ic: I.amer, mo: 'b60', voies: [12, 13, 14] },
  { t: 'Dry hop', ic: I.arome, mo: 'dryActive', est: true, voies: [15] },
  { t: 'Changer de levure', ic: '', mo: 'levure', est: true, voies: [16, 17] },
];
const groupeTete = (g, texte) => `<div class="groupe"><span class="t">${g.ic}${texte || g.t}</span>${pill(g.mo)}${g.est ? '<span class="est">estimé</span>' : ''}</div>`;

function details() {
  const ib = GROUPES.map((g) => `<li>${g.t} (${MOMENT[g.mo][2]}) : ${g.voies.map((n) => nomVoie(C.voies[n - 1]).nom + ' ' + fr(C.voies[n - 1].ibu.after)).join(' · ')}</li>`).join('');
  const hh = C.horsModele.map((h) => h.pistes.map((x) => `<li><b>${x.titre}</b> : ${x.action.charAt(0).toLowerCase() + x.action.slice(1)} <span class="src">${x.preuve}</span></li>`).join('')).join('');
  return `
  <details>
    <summary>IBU après chaque voie (ma bière ${fr(C.ibu)} ; style ${C.bandeIbu.join('–')})</summary>
    <ul>${ib}</ul>
  </details>
  <details id="hh">
    <summary>Hors houblon · résineux (${C.horsModele[0].pistes.length} pistes)</summary>
    <ul>${hh}</ul>
  </details>`;
}

const CSS = `
  :root {
    --encre: #16161a; --gris: #5b5b66; --gris2: #6e6e78; --trait: #dcdce3; --fond: #f6f6f9;
    --acc: #c2410c;
    --floral-f: #7a3f9b; --resin-f: #1f5247; --citrus-f: #6f5a00;
    --gut: 22px;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #fff; color: var(--encre); }
  body { font: 400 14px/1.25 -apple-system, system-ui, "Segoe UI", Roboto, sans-serif; -webkit-tap-highlight-color: transparent; }
  button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
  .ecran { max-width: 390px; margin: 0 auto; padding: 8px 16px 24px; display: flex; flex-direction: column; gap: 12px; overflow-x: hidden; }
  .barre { display: flex; align-items: center; gap: 8px; height: 36px; }
  .retour { width: 28px; height: 28px; position: relative; flex: none; }
  .retour::before { content: ''; position: absolute; left: 10px; top: 9px; width: 9px; height: 9px; border-left: 2px solid var(--encre); border-bottom: 2px solid var(--encre); transform: rotate(45deg); }
  .seg { display: flex; background: #ececf1; border-radius: 16px; padding: 2px; flex: 1; }
  .seg button { flex: 1; height: 28px; border-radius: 14px; font-size: 13px; color: var(--gris); white-space: nowrap; }
  .seg button[aria-checked="true"] { background: #fff; color: var(--encre); font-weight: 650; box-shadow: 0 1px 2px rgba(0,0,0,.12); }
  .outils { display: flex; justify-content: space-between; gap: 8px; }
  .outils .seg { flex: none; }
  .outils .seg button { padding: 0 12px; }
  .lentille button[aria-checked="true"] { color: #fff; background: var(--encre); }

  .reps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .tuile { border-radius: 18px; padding: 10px 9px; display: flex; flex-direction: column; gap: 6px; min-height: 120px; position: relative; overflow: hidden; }
  .tuile.resin { background: linear-gradient(200deg, #f2f8f6, #cfe5de); }
  .tuile.floral { background: linear-gradient(160deg, #faf4fd, #e6d2f2); }
  .tuile.citrus { background: linear-gradient(160deg, #fdfaea, #f1e2a2); }
  .tuile .nom { display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 700; line-height: 1.1; }
  .tuile.resin .nom { color: var(--resin-f); } .tuile.floral .nom { color: var(--floral-f); } .tuile.citrus .nom { color: var(--citrus-f); }
  .nom .pa { position: relative; display: inline-flex; flex: none; }
  .alerte { position: absolute; right: -3px; bottom: -2px; width: 9px; height: 9px; border-radius: 50%; background: var(--acc); box-shadow: 0 0 0 1.5px #fff; }
  .rep { font-size: 19px; font-weight: 800; line-height: 1; letter-spacing: -.015em; }
  .rep small { display: block; font-size: 12px; font-weight: 700; margin-top: 3px; letter-spacing: 0; }
  .v-aucune { color: #475569; } .v-approche { color: #4f46e5; } .v-atteint { color: #0e7490; }
  .hors { margin-top: auto; height: 26px; padding: 0 8px; border-radius: 13px; background: #fff; font-size: 12px; font-weight: 700; color: var(--resin-f); display: inline-flex; align-items: center; gap: 3px; box-shadow: inset 0 0 0 1.5px #2f6b5f; align-self: flex-start; white-space: nowrap; }
  .cible { margin-top: auto; }

  .graph { position: relative; }
  .fonds { position: absolute; inset: 0; display: flex; pointer-events: none; }
  .moitie { position: relative; flex: 1; border-radius: 14px; overflow: hidden; }
  .moitie.re { background: #eef4f1; }
  .moitie.fl { background: #f7f5ef; }
  .moitie .ov { position: absolute; inset: 0; }
  .gut { width: var(--gut); flex: none; position: relative; }
  .gut::before { content: ''; position: absolute; top: 0; bottom: 0; left: 8px; width: 6px; border-radius: 3px; background: var(--encre); }
  .biere-l { position: absolute; top: -24px; left: 50%; transform: translateX(-50%); font-size: 12px; font-weight: 700; background: var(--encre); color: #fff; padding: 3px 9px; border-radius: 10px; white-space: nowrap; z-index: 2; }
  .vl { position: absolute; top: 0; bottom: 0; width: 0; border-left: 2px dashed var(--encre); left: var(--s); z-index: 1; }
  body.abs .vl { left: var(--a); }
  .flou { position: absolute; top: 0; bottom: 0; right: var(--s0); width: var(--s1); background: linear-gradient(270deg, rgba(47,107,95,.30), rgba(47,107,95,.05)); }
  body.abs .flou { right: var(--a0); width: var(--a1); }
  .coupe { position: absolute; top: 0; bottom: 0; left: 0; width: 7px; background: repeating-linear-gradient(180deg, #2f6b5f 0 6px, transparent 6px 10px); opacity: .55; }
  .tetes { position: relative; display: flex; height: 30px; margin-top: 30px; }
  .tetes .m { flex: 1; position: relative; }
  .tetes .g { width: var(--gut); flex: none; }
  .puce { position: absolute; top: 6px; font-size: 12px; font-weight: 700; padding: 2px 7px; border-radius: 9px; white-space: nowrap; background: var(--encre); color: #fff; display: inline-flex; align-items: center; gap: 3px; }
  .puce.gauche-v { left: 10px; }
  .fl .puce.v { left: calc(var(--s) - 21px); }
  .fl .puce.pv { left: calc(var(--a) - 12px); padding: 2px 5px; background: #fff; box-shadow: inset 0 0 0 1.5px var(--encre); }
  .abs-only { display: none !important; }
  body.abs .abs-only { display: inline-flex !important; }
  body.abs .sty-only { display: none !important; }

  .groupe { position: relative; display: flex; align-items: center; gap: 6px; min-height: 30px; padding: 0 6px; font-size: 13px; font-weight: 750; }
  .groupe > span.t { background: rgba(255,255,255,.9); padding: 2px 8px; border-radius: 9px; display: inline-flex; gap: 5px; align-items: center; white-space: nowrap; }
  .est { font-size: 12px; font-weight: 600; color: var(--gris); background: rgba(255,255,255,.9); padding: 1px 6px; border-radius: 8px; }
  .mo { display: inline-flex; align-items: center; gap: 3px; height: 22px; padding: 0 7px; border-radius: 11px; border: 1.5px dashed #7d7d86; background: #fff; font-size: 12px; font-weight: 700; white-space: nowrap; font-variant-numeric: tabular-nums; flex: none; }
  .rang { position: relative; padding: 0 0 10px; }
  .lbl { position: relative; display: flex; align-items: center; gap: 5px; min-height: 24px; padding: 0 6px; font-size: 14px; }
  .lbl b { font-weight: 700; background: rgba(255,255,255,.92); padding: 1px 6px; border-radius: 7px; white-space: nowrap; }
  .lbl .q { font-size: 13px; color: var(--gris); background: rgba(255,255,255,.92); padding: 1px 6px; border-radius: 7px; white-space: nowrap; }
  .lbl .stk { margin-left: auto; display: inline-flex; flex: none; }
  .bars { position: relative; display: flex; height: 32px; }
  .bars .m { position: relative; flex: 1; }
  .bars .g { width: var(--gut); flex: none; }
  .ln { position: absolute; left: 0; right: 0; height: 10px; }
  .ln.a { top: 0; } .ln.b { top: 16px; }
  .zt { position: absolute; bottom: -4px; height: 2.5px; width: var(--s); background: color-mix(in srgb, var(--c) 60%, #fff); }
  .zt::after { content: ''; position: absolute; top: -4px; width: 2.5px; height: 8px; border-radius: 1px; background: color-mix(in srgb, var(--c) 75%, #16161a); }
  .fl .zt, .cr .zt { left: 0; } .fl .zt::after, .cr .zt::after { right: -1px; }
  .re .zt, .cl .zt { right: 0; } .re .zt::after, .cl .zt::after { left: -1px; }
  .zt.cs::after { display: none; } body.abs .zt.cs::after { display: block; } body.abs .zt.ca::after { display: none; }
  body.abs .zt { width: var(--a); }
  .bar { position: absolute; top: 0; height: 10px; min-width: 3px; width: var(--s); background: var(--c); z-index: 1; }
  body.abs .bar:not(.inconnu) { width: var(--a); }
  .fl .bar { left: 0; border-radius: 0 4px 4px 0; } .re .bar { right: 0; border-radius: 4px 0 0 4px; }
  .bar.ci { background: color-mix(in srgb, var(--c) 40%, #fff); box-shadow: inset 0 0 0 1.5px var(--c); }
  .bar.sf { background: #fff; box-shadow: inset 0 0 0 1.5px var(--c); }
  .bar.inconnu { width: 24px; background: repeating-linear-gradient(135deg, #fff 0 3px, #b8bec8 3px 5px); box-shadow: inset 0 0 0 1.2px #8a909b; }
  .bar.ds::after, body.abs .bar.da::after { content: ''; position: absolute; top: 2px; right: 2px; border: 3.5px solid transparent; border-left: 5px solid #fff; }
  body.abs .bar.ds:not(.da)::after { display: none; }
  .hs { position: absolute; top: 0; height: 10px; left: var(--s0); width: var(--s1); background: var(--acc); z-index: 2; border-radius: 0 4px 4px 0; }
  .re .hs { left: auto; right: var(--s0); border-radius: 4px 0 0 4px; }
  body.abs .hs { left: var(--a0); width: var(--a1); }
  body.abs .re .hs { left: auto; right: var(--a0); }

  .exs { display: inline-flex; align-items: center; gap: 3px; background: rgba(255,255,255,.92); padding: 1px 4px; border-radius: 9px; }
  .ex { display: inline-flex; align-items: center; position: relative; border-radius: 50%; margin: 0 1px; }
  .ex .pi { display: block; }
  .ex.ci .pi { opacity: .38; }
  .ex.sf { outline: 1.3px dashed #8f8f99; outline-offset: 1px; }
  .ex.moins::before { content: ''; position: absolute; left: -4px; top: -2px; width: 8px; height: 3px; border-radius: 1.5px; background: var(--encre); box-shadow: 0 0 0 1px #fff; z-index: 1; }
  .ex.xs::after { content: ''; position: absolute; left: -1px; right: -1px; bottom: -5px; height: 3px; border-radius: 2px; background: var(--acc); }

  details.bio { display: inline-block; }
  details.bio summary { list-style: none; display: inline-flex; align-items: center; gap: 4px; height: 22px; padding: 0 6px; border-radius: 11px; background: repeating-linear-gradient(135deg, #fff 0 3px, #d5d7de 3px 5.5px); box-shadow: inset 0 0 0 1.2px #8a909b; cursor: pointer; }
  details.bio summary::-webkit-details-marker { display: none; }
  .bt { display: inline-flex; align-items: center; gap: 1px; background: #fff; border-radius: 8px; padding: 0 2px; }
  details.bio[open] ul { position: absolute; left: 6px; right: 6px; top: 26px; z-index: 6; background: #fff; border-radius: 12px; box-shadow: 0 6px 18px rgba(0,0,0,.18); padding: 10px 12px 10px 26px; font-size: 13px; display: flex; flex-direction: column; gap: 6px; }
  .src { color: var(--gris2); font-size: 12px; }

  details { border-radius: 14px; background: var(--fond); padding: 10px 12px; }
  details.bio { background: none; padding: 0; border-radius: 0; }
  summary { font-size: 14px; font-weight: 700; cursor: pointer; }
  details:not(.bio) ul { margin: 8px 0 0 16px; display: flex; flex-direction: column; gap: 6px; font-size: 13px; }
`;
const LENTILLE_JS = `
  document.querySelectorAll('.lentille [data-e]').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.lentille [data-e]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
    document.body.classList.toggle('abs', b.dataset.e === 'absolu');
  }));
  if (/[?&]abs\\b/.test(location.search)) document.querySelector('.lentille [data-e="absolu"]').click();`;

const page = (titre, commentaire, css, corps, js) => `<!doctype html>
<html lang="fr" data-cas="c1">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titre}</title>
<!-- ${commentaire} -->
<style>${CSS}${css}</style>
</head>
<body>
${PICTOS}
<main class="ecran">${corps}
</main>
<script>${LENTILLE_JS}${js || ''}</script>
</body>
</html>
`;
const ecrire = (f, s) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); console.log('écrit ' + path.relative(BASE, f) + ' (' + s.length + ' o)'); };

// ======================= q1 : cocher, puis Comparer =======================
const Q1_CHOIX = [1, 7, 9, 12];
{
  const rang = (X) => {
    const { nom, q } = nomVoie(X.v), on = Q1_CHOIX.includes(X.n);
    return `
    <div class="rang" data-voie="${X.n}">
      <div class="lbl"><button class="ch" data-role="choisir" aria-pressed="${on}" aria-label="Choisir ${nom} pour comparer"></button><b>${nom}</b>${q ? `<span class="q">${q}</span>` : ''}<span class="stk">${stockIcone(X.v)}</span></div>
      ${couloirs(X)}
    </div>`;
  };
  const corps = `${tete('Suggestions')}${reponses()}
  <div class="graph">${fonds()}
    ${GROUPES.map((g) => groupeTete(g) + g.voies.map((n) => rang(V[n - 1])).join('')).join('')}
    <div style="height:64px"></div>
  </div>
  ${details()}
  <a class="cmp" data-role="comparer" href="comparer.html"><span class="pts">${Q1_CHOIX.map(() => '<i></i>').join('')}</span>Comparer <b class="nb">(${Q1_CHOIX.length})</b></a>`;
  const css = `
  .ch { width: 22px; height: 22px; border-radius: 6px; background: #fff; box-shadow: inset 0 0 0 2px var(--encre); flex: none; position: relative; }
  .ch[aria-pressed="true"] { background: var(--encre); }
  .ch[aria-pressed="true"]::after { content: ''; position: absolute; left: 7px; top: 3px; width: 6px; height: 11px; border-right: 2.5px solid #fff; border-bottom: 2.5px solid #fff; transform: rotate(45deg); }
  .rang:has(.ch[aria-pressed="true"]) .lbl b { box-shadow: inset 0 0 0 1.5px var(--encre); }
  .cmp { position: fixed; z-index: 8; left: 50%; transform: translateX(-50%); bottom: 14px; width: 358px; max-width: calc(100% - 32px); height: 50px; border-radius: 25px; background: var(--encre); color: #fff; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 16px; font-weight: 700; text-decoration: none; box-shadow: 0 8px 22px rgba(0,0,0,.28); }
  .cmp .nb { font-weight: 800; }
  .ecran { padding-bottom: 84px; }
  .cmp .pts { display: inline-flex; gap: 3px; margin-right: 4px; }
  .cmp .pts i { width: 8px; height: 8px; border-radius: 2px; background: #fff; }`;
  const js = `
  document.querySelectorAll('[data-role="choisir"]').forEach((b) => b.addEventListener('click', () => {
    b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
    const n = document.querySelectorAll('[data-role="choisir"][aria-pressed="true"]').length;
    document.querySelector('.cmp .nb').textContent = '(' + n + ')';
    document.querySelector('.cmp .pts').innerHTML = '<i></i>'.repeat(n);
  }));`;
  ecrire(BASE + '/q1/etat-b.html', page('Cocher puis comparer', 'Lot 15 · q1 · le procédé du brasseur (c1). s5 à trois objectifs : à gauche le résineux qui baisse, à droite le floral (couloir du haut) et les agrumes (couloir du bas) qui montent, en crans du style (demi-piste = 3 crans) ; absolu : 50 points par demi-piste. On coche des voies, « Comparer (n) » ouvre comparer.html.', css, corps, js));
}

// ---- q1 comparer.html : les voies choisies côte à côte, et la colonne « ensemble » ----
{
  const ENS = C.ensemble.find((e) => e.voies.join() === '1,12');
  const cols = Q1_CHOIX.map((n) => ({ X: V[n - 1], tout: V[n - 1].v.tout, effet: V[n - 1].v.effet }));
  // L'ensemble : la somme des deux voies (convention du moteur), niveaux des fiches de leurs houblons.
  const XE = { n: 'ensemble', v: { tout: ENS.tout, fiches: [...V[0].v.fiches, ...V[11].v.fiches], effet: Object.fromEntries(OBJ.map((f) => { const t = ENS.tout.find((x) => x.famille === f); return [f, { central: t ? t.effet : null, etabli: !!t }]; })), ibu: { after: ENS.ibu } }, hs: new Set(), extras: ENS.tout.filter((t) => !t.visee && Math.abs(t.effet) >= 0.5) };
  const all = [...cols.map((c) => c.X), XE];
  const bouge = new Set(all.flatMap((X) => X.extras.map((t) => t.famille)));
  const lignes = [...OBJ, ...ORDRE.filter((f) => !OBJ.includes(f) && bouge.has(f))];
  const rien = ORDRE.filter((f) => !OBJ.includes(f) && !bouge.has(f));
  // Cellule : à droite 2 crans (au style) ou 25 points (absolu), à gauche 0,5 cran ou 6,25 points (même échelle).
  const RS = 2, LS = 0.5, RA = 25, LA = 6.25;
  const cell = (X, f) => {
    const obj = OBJ.includes(f);
    const t = obj ? null : X.extras.find((x) => x.famille === f);
    const e = obj ? X.v.effet[f] : t ? { central: t.effet, etabli: true } : null;
    const a0 = AVANT[f], [b0, b1] = bande(f), c = cran(f);
    const z = f === 'resin' ? null : a0 == null ? undefined : { rS: (b1 - a0) / c / RS * 100, lS: (a0 - b0) / c / LS * 100, rA: (b1 - a0) / RA * 100, lA: (a0 - b0) / LA * 100 };
    const ztR = z ? ztEl(f, z.rS, z.rA) : '';
    const ztL = z ? ztEl(f, z.lS, z.lA) : '';
    let L = ztL, R = ztR;
    if (obj && f !== 'resin') R += `<i class="vt" style="--s:${p((OB[f].visee - OB[f].maBiere.central) / OB[f].cran / RS * 100)};--a:${p((OB[f].visee - OB[f].maBiere.central) / RA * 100)}"></i>`;
    if (e && !e.etabli) { if (f === 'resin') L += '<i class="nb-i" title="non établi"></i>'; else R += '<i class="nb-i" title="non établi"></i>'; }
    else if (e && e.central != null) {
      const n = niv(X.v, f, e.central);
      const s = Math.abs(e.central) / cran(f) / (e.central < 0 ? LS : RS) * 100, a = Math.abs(e.central) / (e.central < 0 ? LA : RA) * 100;
      const b = `<i class="cb ${n}" title="${NOM[f]} ${sg(e.central)} · ${NIVMOT[n]}" style="--c:${COUL[f]};--s:${p(Math.min(100, s))};--a:${p(Math.min(100, a))}"></i>`;
      if (e.central < 0) L += b; else R += b;
    }
    const ex = t ? ` data-role="extra" data-famille="${f}"` : '';
    return `<div class="cel${obj ? ' o' : ''}${z === undefined ? ' ns' : ''}"${ex}><div class="cl">${L}</div><div class="cr">${R}</div></div>`;
  };
  const tetes = {
    1: ['Motueka', 'b10', ''], 7: ['Citra cryo', 'b10', ''], 9: ['Nelson Sauvin', 'b10', ''], 12: ['Motueka', 'b60', '<span class="rp" title="remplace le Nugget, 74 g">⇄ Nugget</span>'],
  };
  const colonne = (X) => {
    const [nm, mo, plus] = tetes[X.n];
    return `<div class="col" data-voie="${X.n}" aria-label="${X.v.libelle}">
      <div class="hd"><b>${nm}</b>${plus}${pill(mo)}<span class="ib">${fr(X.v.ibu.after)}</span></div>
      <div class="corps">${lignes.map((f, i) => (i === OBJ.length ? '<div class="sep"></div>' : '') + cell(X, f)).join('')}</div>
    </div>`;
  };
  const colEns = `<div class="col ens" data-ensemble="1,12" aria-label="Ensemble : ${ENS.libelles.join(' et ')}">
      <div class="hd"><b>ensemble</b><span class="mos">${pill('b10')}${pill('b60')}</span><span class="ib">${fr(ENS.ibu)}</span></div>
      <div class="corps">${lignes.map((f, i) => (i === OBJ.length ? '<div class="sep"></div>' : '') + cell(XE, f)).join('')}</div>
    </div>`;
  const lab = `<div class="lab">
      <div class="hd"></div>
      ${lignes.map((f, i) => (i === OBJ.length ? '<div class="sep"></div>' : '') + `<div class="lf${OBJ.includes(f) ? ' o' : ''}"><span class="pa">${picto(f, OBJ.includes(f) ? 20 : 18)}${f === 'resin' ? '<i class="alerte" title="Ma bière au-dessus du style (dégustation)"></i>' : ''}</span>${OBJ.includes(f) ? (OB[f].crans > 0 ? I.haut : I.bas) : ''}</div>`).join('')}
    </div>`;
  const corps = `${tete('Comparer')}
  <div class="liste" data-role="style" data-code="16D">
    ${lab}
    <div class="mat">${all.slice(0, 4).map(colonne).join('')}${colEns}</div>
  </div>
  <div class="rien" aria-label="Aucune de ces voies ne fait bouger : ${rien.map((f) => NOM[f]).join(', ')}">${rien.map((f) => picto(f, 18)).join('')}</div>
  <details>
    <summary>Ensemble : ${ENS.voies.map((n) => nomVoie(C.voies[n - 1]).nom + ' ' + MOMENT[momentDe(C.voies[n - 1])][0]).join(' + ')}</summary>
    <ul><li>${ENS.libelles.join(' ; ')}.</li><li>Les apports des deux voies s'additionnent ; valable parce qu'elles touchent des moments différents. IBU de la recette : ${fr(ENS.ibu)} (style ${C.bandeIbu.join('–')}).</li></ul>
  </details>`;
  const css = `
  .liste { display: flex; gap: 4px; }
  .lab { width: 30px; flex: none; display: flex; flex-direction: column; }
  .mat { flex: 1; min-width: 0; display: flex; gap: 4px; }
  .col { flex: 1; min-width: 0; display: flex; flex-direction: column; border-radius: 12px; background: var(--fond); }
  .col.ens { flex: 1.25; background: #fff; box-shadow: inset 0 0 0 2px var(--encre); }
  .hd { height: 92px; display: flex; flex-direction: column; justify-content: flex-end; align-items: flex-start; gap: 3px; padding: 4px 4px 6px; }
  .hd b { font-size: 13px; font-weight: 750; line-height: 1.1; }
  .hd .rp { font-size: 12px; color: var(--gris); white-space: nowrap; }
  .hd .ib { font-size: 12px; color: var(--gris); font-variant-numeric: tabular-nums; }
  .hd .ib::before { content: 'IBU '; }
  .mos { display: inline-flex; gap: 2px; }
  .mos .mo { padding: 0 4px; }
  .corps { position: relative; padding-bottom: 6px; }
  .corps::before { content: ''; position: absolute; top: 0; bottom: 6px; left: calc(20% - 1.5px); width: 3px; background: var(--encre); border-radius: 2px; z-index: 2; }
  .sep, .lab .sep { height: 10px; border-top: 1.5px solid var(--trait); margin-top: 4px; }
  .cel, .lf { height: 30px; position: relative; }
  .lf { display: flex; align-items: center; gap: 1px; }
  .lf .pa { position: relative; display: inline-flex; }
  .cel .cl, .cel .cr { position: absolute; top: 7px; height: 12px; }
  .cel .cl { left: 0; width: calc(20% - 1.5px); }
  .cel .cr { left: calc(20% + 1.5px); right: 3px; }
  .cl .zt { right: 0; } .cr .zt { left: 0; }
  .cel.ns .cl { background: repeating-linear-gradient(135deg, transparent 0 3px, #d9dae0 3px 4.5px); border-radius: 3px; }
  .cb { position: absolute; top: 0; height: 12px; min-width: 3px; width: var(--s); background: var(--c); z-index: 1; }
  body.abs .cb { width: var(--a); }
  .cr .cb { left: 0; border-radius: 0 4px 4px 0; } .cl .cb { right: 0; border-radius: 4px 0 0 4px; }
  .cb.ci { background: color-mix(in srgb, var(--c) 40%, #fff); box-shadow: inset 0 0 0 1.5px var(--c); }
  .cb.sf { background: #fff; box-shadow: inset 0 0 0 1.5px var(--c); }
  .vt { position: absolute; top: -5px; bottom: -5px; left: var(--s); width: 0; border-left: 2px dashed var(--encre); z-index: 2; }
  body.abs .vt { left: var(--a); }
  .nb-i { position: absolute; top: 0; height: 12px; width: 14px; background: repeating-linear-gradient(135deg, #fff 0 3px, #b8bec8 3px 5px); box-shadow: inset 0 0 0 1.2px #8a909b; }
  .cr .nb-i { left: 0; border-radius: 0 4px 4px 0; } .cl .nb-i { right: 0; border-radius: 4px 0 0 4px; }
  .rien { display: flex; gap: 6px; padding: 0 0 0 34px; opacity: .28; }`;
  ecrire(BASE + '/q1/comparer.html', page('Comparer les voies', 'Lot 15 · q1 · Comparer : les voies cochées dans Suggestions (1, 7, 9, 12) côte à côte et la colonne « ensemble » (c1.ensemble [1, 12]). Une ligne par famille qui bouge, les objectifs en tête ; dans chaque case, ma bière au centre (trait noir), la zone du style teintée, la barre de la voie à la couleur de la famille : pleine si ses fiches la marquent, pâle si une seule la cite, en contour sans fiche (retrait du Nugget). Au style : 3 crans à droite, 1 à gauche ; absolu : 50 et 16,7 points.', css, corps));
}

// ======================= q2 : regrouper les voies au même effet =======================
{
  const groupesEffet = [];
  for (const X of V) { const k = JSON.stringify(X.v.effet); const g = groupesEffet.find((x) => x.k === k); if (g) g.voies.push(X); else groupesEffet.push({ k, voies: [X] }); }
  const memes = groupesEffet.filter((g) => g.voies.length > 1);
  const seuls = new Set(groupesEffet.filter((g) => g.voies.length === 1).map((g) => g.voies[0].n));
  const momentPill = (X) => pill(momentDe(X.v));
  const blocMeme = (g, gi) => {
    const slots = ORDRE.filter((f) => g.voies.some((X) => X.extras.some((t) => t.famille === f)));
    // Les voies au même extra se suivent (dans l'ordre du moteur).
    const sig = (X) => X.extras.map((t) => t.famille).join();
    const ord = []; for (const X of g.voies) if (!ord.includes(X)) ord.push(...g.voies.filter((Y) => sig(Y) === sig(X) && !ord.includes(Y)));
    const lignes = ord.map((X, i) => {
      const { nom, q } = nomVoie(X.v); const prev = ord[i - 1];
      const cases = slots.map((f) => { const t = X.extras.find((x) => x.famille === f); return t ? exPicto(X, t, 18) : '<span class="vide"></span>'; }).join('');
      return `<div class="choix-l${prev && sig(prev) !== sig(X) ? ' coupe-l' : ''}" data-voie="${X.n}"><span class="nm"><b>${nom}</b>${X.v.type === 'assemblage' ? '<small title="5 g + 5 g, estimé">5+5 g ≈</small>' : ''}</span><span class="slots">${cases}</span><span class="stk">${stockIcone(X.v)}</span></div>`;
    }).join('');
    return `<div class="groupe meme"><span class="t">${I.egal}${gi ? 'même effet' : 'même effet sur tes objectifs'}</span>${momentPill(g.voies[0])}</div>
    <div class="rang commun">${couloirs(g.voies[0])}</div>
    <div class="choix">${lignes}</div>`;
  };
  const rangSeul = (X) => {
    const { nom, q } = nomVoie(X.v);
    return `<div class="rang" data-voie="${X.n}">
      <div class="lbl"><b>${nom}</b>${q ? `<span class="q">${q}</span>` : ''}${exPictos(X)}${bioPill(X)}<span class="stk">${stockIcone(X.v)}</span></div>
      ${couloirs(X)}
    </div>`;
  };
  const autres = GROUPES.map((g) => ({ ...g, voies: g.voies.filter((n) => seuls.has(n)) })).filter((g) => g.voies.length);
  const corps = `${tete('Suggestions')}${reponses()}
  <div class="graph">${fonds()}
    ${memes.map(blocMeme).join('')}
    ${autres.map((g) => groupeTete(g) + g.voies.map((n) => rangSeul(V[n - 1])).join('')).join('')}
    <div style="height:8px"></div>
  </div>
  ${details()}`;
  const css = `
  .rang.commun { padding-bottom: 4px; }
  .choix { position: relative; z-index: 3; margin: 0 4px 12px; border-radius: 14px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.10), inset 4px 0 0 var(--encre); padding: 4px 8px 4px 12px; }
  .choix-l { display: flex; align-items: center; gap: 5px; min-height: 30px; font-size: 14px; }
  .choix-l.coupe-l { border-top: 1px solid var(--trait); }
  .choix-l .nm { display: flex; flex-direction: column; min-width: 0; padding: 3px 0; }
  .choix-l b { font-weight: 700; line-height: 1.15; }
  .choix-l small { font-size: 12px; color: var(--gris); }
  .slots { margin-left: auto; display: inline-flex; gap: 4px; flex: none; }
  .slots > * { width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; }
  .slots .vide::after { content: ''; width: 4px; height: 4px; border-radius: 2px; background: #d6d6dd; }
  .choix-l .stk { display: inline-flex; flex: none; margin-left: 6px; }`;
  ecrire(BASE + '/q2/etat-b.html', page('Même effet, autre extra', 'Lot 15 · q2 · regrouper les voies au même effet (c1). Les voies 1 à 7 ont exactement le même effet sur les trois objectifs, et 9 à 11 aussi (c1.json, champ effet) : la barre est dessinée une fois ; dessous, chaque voie se distingue par ses extras, en pictos alignés par famille (plein : marqué ; pâle : cité). Les autres voies gardent leur ligne s5.', css, corps));
}

// ======================= q3 : la bande de 12 cases sous chaque voie =======================
{
  const bandeV = (X) => {
    const cases = ORDRE.map((f, i) => {
      const obj = OBJ.includes(f);
      const t = X.extras.find((x) => x.famille === f);
      let cls = 'c', attr = '', tt = NOM[f];
      if (obj) {
        const e = X.v.effet[f]; cls += ' obj';
        if (!e.etabli) { cls += ' ne'; tt += ' : objectif, effet non établi'; }
        else { const n = niv(X.v, f, e.central); cls += ' ' + n + (e.central < 0 ? ' moins' : ''); tt += ' : objectif ' + sg(e.central) + ' · ' + NIVMOT[n]; }
      } else if (t) { const n = niv(X.v, f, t.effet); cls += ' ' + n + (t.effet < 0 ? ' moins' : ''); attr = ` data-role="extra" data-famille="${f}"`; tt += ' ' + sg(t.effet) + ' · ' + NIVMOT[n]; }
      if (X.hs.has(f)) { cls += ' xs'; tt += ' · hors du style'; }
      if (i === 3) cls += ' sep';
      return `<i class="${cls}"${attr} style="--c:${COUL[f]}" title="${tt}"></i>`;
    }).join('');
    return `<div class="bd" role="img" aria-label="Ce que la voie fait bouger, dans l'ordre de la bande de la fiche">${cases}</div>`;
  };
  const rang = (X) => {
    const { nom, q } = nomVoie(X.v);
    return `<div class="rang" data-voie="${X.n}">
      <div class="lbl"><b>${nom}</b>${q ? `<span class="q">${q}</span>` : ''}${bioPill(X)}<span class="stk">${stockIcone(X.v)}</span></div>
      ${couloirs(X)}
      ${bandeV(X)}
    </div>`;
  };
  const corps = `${tete('Suggestions')}${reponses()}
  <div class="graph">${fonds()}
    ${GROUPES.map((g) => groupeTete(g) + g.voies.map((n) => rang(V[n - 1])).join('')).join('')}
    <div style="height:8px"></div>
  </div>
  ${details()}`;
  const css = `
  .rang { padding-bottom: 12px; }
  .bd { position: relative; z-index: 3; display: flex; align-items: center; gap: 3px; margin: 2px 6px 0; padding: 5px 6px 7px; border-radius: 9px; background: rgba(255,255,255,.94); width: max-content; }
  .bd .c { position: relative; display: block; width: 21px; height: 14px; border-radius: 3px; background: #e7e7ec; }
  .bd .c.sep { margin-left: 7px; }
  .bd .c.mq { background: var(--c); }
  .bd .c.ci { background: color-mix(in srgb, var(--c) 40%, #fff); }
  .bd .c.sf { background: #fff; box-shadow: inset 0 0 0 1.8px var(--c); }
  .bd .c.moins::before { content: ''; position: absolute; left: 6px; right: 6px; top: 6px; height: 2.2px; border-radius: 1px; background: var(--c); }
  .bd .c.ne { background: repeating-linear-gradient(135deg, #fff 0 2.5px, #b8bec8 2.5px 4.5px); }
  .bd .c.obj { outline: 2px solid var(--encre); outline-offset: 1.5px; }
  .bd .c.xs::after { content: ''; position: absolute; left: -1px; right: -1px; bottom: -6px; height: 3px; border-radius: 2px; background: var(--acc); }`;
  ecrire(BASE + '/q3/etat-b.html', page('Bande de la fiche', 'Lot 15 · q3 · sous chaque voie, la bande de 12 cases de la fiche (c1), dans son ordre (floral, herbacé, terreux | agrumes … végétal). Les objectifs sont cernés de noir ; les autres familles que la voie fait bouger sont à leur couleur : pleines si ses fiches les marquent, pâles si une seule les cite, en contour avec un trait si elles baissent (retrait du Nugget) ou sans fiche (levure) ; un trait orangé sous la case : hors du style après la voie.', css, corps));
}

// ======================= q4 : toucher une voie la projette sur toute ma bière =======================
{
  const OUVERTE = 2;
  const projLigne = (X, f, e, etabli, isExtra, bio) => {
    const z = zone(f);
    let L = '', R = '';
    if (z) { L += zt(f, 'l'); R += zt(f, 'r'); }
    if (!etabli) { if (f === 'resin') L += inconnu(f); else R += inconnu(f); }
    else if (e < 0) L += bar(X, f, e, 'l'); else R += bar(X, f, e, 'r');
    if (bio) R += bio;
    const ex = isExtra ? ` data-role="extra" data-famille="${f}"` : ` data-famille="${f}"`;
    return `<div class="pr${OBJ.includes(f) ? ' o' : ''}${z === undefined ? ' ns' : ''}"${ex}><span class="pp">${picto(f, 18)}</span><div class="bars one"><div class="m re"><div class="ln">${L}</div></div><div class="g"></div><div class="m fl"><div class="ln">${R}</div></div></div></div>`;
  };
  const tendance = (X, f, sens) => { const b = pctBar(f, X.v.tout.find((t) => t.famille === f)?.effet ?? X.v.effet[f].central); return `<i class="td ${sens}" title="Biotransformation : tendance possible, ampleur non quantifiée" style="--s:${p(b.s)};--a:${p(b.a)}"></i>`; };
  const projection = (X) => {
    const sig = (X.v.bio || []).flatMap((h) => h.signaux).map((s) => s.id);
    const geran = sig.includes('geraniol-citronellol'), thiol = sig.includes('thiols'), creep = sig.includes('hop-creep');
    let h = OBJ.map((f) => projLigne(X, f, X.v.effet[f].central, X.v.effet[f].etabli, false,
      geran && f === 'floral' ? tendance(X, 'floral', 'moins') : geran && f === 'citrus' ? tendance(X, 'citrus', 'plus') : '')).join('');
    h += '<div class="psep"></div>';
    h += X.extras.map((t) => projLigne(X, t.famille, t.effet, true, true, thiol && t.famille === 'tropical' ? tendance(X, 'tropical', 'plus') : '')).join('');
    if (thiol && !X.extras.some((t) => t.famille === 'berries')) h += `<div class="pr bio-l" data-role="bio" data-famille="berries" title="Thiols : cassis possible, sans chiffre"><span class="pp">${picto('berries', 18)}</span><div class="bars one"><div class="m re"></div><div class="g"></div><div class="m fl"><div class="ln"><i class="td seul" style="--s:0%;--a:0%"></i></div></div></div></div>`;
    if (creep) h += `<div class="pr bio-l" data-role="bio" title="Hop creep possible : refermentation, atténuation, diacétyle"><span class="pp">${I.bulles}</span><div class="bars one"><div class="m re"></div><div class="g"></div><div class="m fl"><div class="ln"><i class="td seul" style="--s:0%;--a:0%"></i></div></div></div></div>`;
    return `<div class="proj">${h}</div>`;
  };
  const rang = (X) => {
    const { nom, q } = nomVoie(X.v);
    return `<div class="rang${X.n === OUVERTE ? ' ouvert' : ''}" data-voie="${X.n}">
      <div class="lbl" role="button" aria-expanded="${X.n === OUVERTE}"><b>${nom}</b>${q ? `<span class="q">${q}</span>` : ''}<span class="ferme">${exPictos(X)}</span>${bioPill(X)}<span class="stk">${stockIcone(X.v)}</span><i class="chev"></i></div>
      <div class="court">${couloirs(X)}</div>
      ${projection(X)}
    </div>`;
  };
  const corps = `${tete('Suggestions')}${reponses()}
  <div class="graph">${fonds()}
    ${GROUPES.map((g) => groupeTete(g) + g.voies.map((n) => rang(V[n - 1])).join('')).join('')}
    <div style="height:8px"></div>
  </div>
  ${details()}`;
  const css = `
  .lbl[role="button"] { cursor: pointer; }
  .chev { width: 18px; height: 18px; border-radius: 9px; background: rgba(255,255,255,.92); position: relative; flex: none; }
  .chev::before { content: ''; position: absolute; left: 6px; top: 4px; width: 5px; height: 5px; border-right: 2px solid var(--encre); border-bottom: 2px solid var(--encre); transform: rotate(45deg); }
  .ouvert .chev::before { transform: rotate(-135deg); top: 7px; }
  .proj { display: none; position: relative; margin: 2px 0 2px; padding: 4px 0 4px; border-radius: 12px; }
  .ouvert .proj { display: block; }
  .ouvert .court, .ouvert .ferme { display: none; }
  .ouvert { background: rgba(255,255,255,.55); border-radius: 12px; box-shadow: inset 0 0 0 2px var(--encre); margin: 0 -2px 8px; padding-top: 2px; }
  .pr { position: relative; height: 22px; }
  .pr .pp { position: absolute; left: 6px; top: 2px; z-index: 3; display: inline-flex; background: rgba(255,255,255,.92); border-radius: 9px; padding: 0 1px; }
  .pr.o .pp { box-shadow: 0 0 0 1.6px var(--encre); }
  .bars.one { height: 22px; }
  .bars.one .ln { top: 5px; height: 12px; }
  .bars.one .bar, .bars.one .hs { height: 12px; }
  .pr.ns .g { background: repeating-linear-gradient(135deg, transparent 0 3px, #b8bec8 3px 5px); border-radius: 3px; position: relative; z-index: 2; }
  .psep { height: 7px; margin: 0 8px 3px 30px; border-bottom: 1.5px dashed #a9a9b3; }
  .td { position: absolute; top: -1px; height: 14px; width: 22px; z-index: 3; border-radius: 3px; background: repeating-linear-gradient(135deg, rgba(255,255,255,.9) 0 3px, #6e6e78 3px 5px); box-shadow: inset 0 0 0 1.2px #3a3a42; left: var(--s); }
  body.abs .td { left: var(--a); }
  .td.plus { margin-left: 2px; }
  .td.moins { margin-left: -22px; }
  .td.seul { left: 0; }
  .td.plus::after { content: ''; position: absolute; right: -6px; top: 3px; border: 4px solid transparent; border-left: 5px solid #3a3a42; }
  .td.moins::before { content: ''; position: absolute; left: -6px; top: 3px; border: 4px solid transparent; border-right: 5px solid #3a3a42; }`;
  const js = `
  document.querySelectorAll('.rang[data-voie] > .lbl').forEach((l) => l.addEventListener('click', (ev) => {
    if (ev.target.closest('details')) return;
    const r = l.parentElement, o = !r.classList.contains('ouvert');
    document.querySelectorAll('.rang.ouvert').forEach((x) => { x.classList.remove('ouvert'); x.querySelector('.lbl').setAttribute('aria-expanded', 'false'); });
    if (o) { r.classList.add('ouvert'); l.setAttribute('aria-expanded', 'true'); }
  }));
  const m = location.search.match(/[?&]v=(\\d+)/);
  if (m) { const r = document.querySelector('.rang[data-voie="' + m[1] + '"] > .lbl'); if (r) { r.click(); r.scrollIntoView({ block: 'start' }); } }`;
  ecrire(BASE + '/q4/etat-b.html', page('Projection sur ma bière', 'Lot 15 · q4 · toucher une voie la projette sur toute ma bière (c1). Fermée, la voie garde ses deux couloirs s5 et ses extras en pictos ; ouverte (Aurum, ici), une ligne divergente par famille qui bouge : les trois objectifs en tête (picto cerné), puis les autres, chacune face à la zone de son style. Voie 15 : la biotransformation en tendances hachurées, sans longueur.', css, corps, js));
}
