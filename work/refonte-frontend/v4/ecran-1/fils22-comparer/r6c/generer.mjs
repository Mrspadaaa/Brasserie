// Lot 22 · r6c « Le podium des agrumes » (mission 2026-10-22-reprise-lot21, voie r6c-podium-agrumes).
// Question : « Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ? ». Base : effet égal sur les agrumes
// (référence Cascade 4 g/L, dry hop après fermentation, 3 j, US-05). Radar r2, porte non, descripteurs A.
// Seule donnée : ../donnees/comparer-stout.json (voie r6e). Les titres des sources viennent du fichier
// des composés qu'il cite (sources.composes). Calculs faits ici, et seulement ceux-ci :
//   - interpolation linéaire de la grille (0 = ma bière, puis 1, 2, 4, 8 g/L) à la dose d'effet égal,
//     pour bas, centre et haut de chaque famille (même règle que egalites.effetEgal) ;
//   - crans : effet / cran du style (echelle.parFamille) ; « au-dessus » si l'après dépasse la bande ;
//   - grammes pour 20 L = dose × 20 ; mise à l'échelle des dessins (au style : domaine du style ;
//     absolu : 0–100).
// Pictos des familles et icônes : noyau du lot 18 (fils18-baseline/l8g), au trait.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { symboles, ic, JET, NOM, COURT, REPO } from '../../fils18-baseline/l8g/noyau.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const D = JSON.parse(fs.readFileSync(path.join(ICI, '../donnees/comparer-stout.json'), 'utf8'));
const KC = JSON.parse(fs.readFileSync(path.join(REPO, D.sources.composes), 'utf8'));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fr = (x, n = 1) => { const r = Math.round(x * 10 ** n) / 10 ** n; return String(r).replace('.', ',').replace('-', '−'); };
const plg = (a, b, n = 1) => (b == null ? '> ' + fr(a, n) : a == null ? '< ' + fr(b, n) : a === b ? fr(a, n) : fr(a, n) + '–' + fr(b, n));

// ---------- les houblons ----------
const ORDRE_H = ['Cascade', 'Idaho 7', 'Galaxy', 'Nelson Sauvin'];
const DEPART = ['Cascade', 'Idaho 7', 'Galaxy']; // la question ; Nelson Sauvin s'ajoute d'un toucher
// Couleurs des houblons : celles du lot 21 (v1, y3), une par houblon (D51) ; Nelson Sauvin en sarcelle.
const COUL = { Cascade: '#781838', 'Idaho 7': '#d0002b', Galaxy: '#681878', 'Nelson Sauvin': '#0b6e63' };
const EG = D.egalites.effetEgal.find((e) => e.famille === 'citrus');
const US05 = EG.levure;
const ROUE = ['citrus', 'tropical', 'melon', 'stoneFruit', 'pomeFruit', 'berries', 'floral', 'green', 'herbal', 'spice', 'earthy', 'resin'];
const LIGNES = ['citrus', ...D.style.ordre.filter((f) => f !== 'citrus')];
const AV = D.biere.avant;
const ACC = '#c2410c';

const domaine = (f) => D.echelle.parFamille[f].domaine[1];
const bande = (f) => D.style.zone[f].bande;
const cranDe = (f) => D.echelle.parFamille[f].cran;
const avInconnu = (f) => !!AV[f].inconnu;

const H = {};
for (const nom of ORDRE_H) {
  const h = D.houblons.find((x) => x.nom === nom);
  const dose = EG.doses[nom];
  const pts = [1, 2, 4, 8].map((d) => Object.values(h.grille).find((g) => g.moment === EG.moment && g.jours === EG.jours && g.levure === US05 && g.dose_gL === d));
  const i1 = [1, 2, 4, 8].findIndex((d) => d >= dose);
  const hautP = pts[i1], basP = i1 > 0 ? pts[i1 - 1] : null;
  const d0 = i1 > 0 ? [1, 2, 4, 8][i1 - 1] : 0, d1 = [1, 2, 4, 8][i1], t = (dose - d0) / (d1 - d0);
  const fam = {};
  for (const f of ROUE) {
    const a = basP ? basP.apres[f] : [AV[f].bas, AV[f].centre, AV[f].haut];
    const b = hautP.apres[f];
    const lerp = (k) => a[k] + (b[k] - a[k]) * t;
    const delta = (basP ? basP.delta[f] : 0) + (hautP.delta[f] - (basP ? basP.delta[f] : 0)) * t;
    const inconnu = hautP.delta[f] === 0 && b[4] === 'inconnu';
    const apres = AV[f].centre + delta;
    const bd = bande(f);
    fam[f] = { inconnu, delta, apres, bas: lerp(0), haut: lerp(2), dessus: !inconnu && apres > bd[1], crans: delta / cranDe(f) };
  }
  const aromes = Object.fromEntries(h.aromes.map((a) => [a.family, a]));
  const ret = h.alpha.retenu;
  const fiches = h.alpha.sources;
  const minF = Math.min(...fiches.map((s) => s.min)), maxF = Math.max(...fiches.map((s) => s.max));
  H[nom] = {
    nom, h, dose, g20: dose * 20, fam, aromes, couleur: COUL[nom],
    confiance: hautP.confiance, drapeaux: [...new Set([...(basP ? basP.drapeaux : []), ...hautP.drapeaux])],
    alpha: ret.value, alphaDe: ret.from, alphaHors: ret.value < minF || ret.value > maxF, fichesA: [minF, maxF], fichesSrc: fiches,
    role: h.role.value, roleFournisseur: /^fournisseur/.test(h.role.source), roleSrc: h.role.source,
  };
}
const rangDe = (noms) => [...noms].sort((a, b) => H[a].dose - H[b].dose);

// ---------- ce qu'il apporte en plus : familles qui bougent d'un cran ou plus, et le résineux toujours ----------
// Le résineux est toujours montré : la dégustation du 18.10 (« ma stout est trop résineuses, je la veux
// plus floral ») ; le floral, son souhait, est montré dès qu'il bouge.
function enPlus(nom) {
  const F = H[nom].fam;
  const cands = ROUE.filter((f) => f !== 'citrus' && f !== 'resin' && !F[f].inconnu && Math.round(F[f].crans) >= 1)
    .sort((a, b) => (F[b].dessus - F[a].dessus) || (b === 'floral') - (a === 'floral') || F[b].crans - F[a].crans);
  return [...cands.slice(0, 2), 'resin'];
}
const signe = (x) => (x >= 0 ? '+' : '−') + fr(Math.abs(x), 0);
const valCrans = (F) => signe(Math.round(F.crans));
const valAbs = (F) => signe(F.delta);

// ---------- symboles et petites pièces ----------
const SYMB = symboles({ trait: 1.5, tailles: [12, 14, 16, 18, 20] });
const pic = (f, z = 16) => `<svg class="pi" width="${z}" height="${z}" data-famille="${f}" role="img" aria-label="${NOM[f]}"><use href="#p-${f}"/></svg>`;
const STOCK_TXT = (X) => (X.alphaDe === 'fiche de stock' ? 'en stock : α lu sur la fiche de stock' : 'en stock : α lu sur l’article du lot');
const stock = (X) => `<span class="stk" role="img" aria-label="${STOCK_TXT(X)}">${ic('stock', 14)}</span>`;
const alpha = (X) => `<span class="al" data-role="alpha" data-source="lot" data-nature="mesure" aria-label="α du lot : ${fr(X.alpha)} %${X.alphaHors ? ', hors des plages de ses fiches (' + plg(...X.fichesA) + ' %)' : ''}">α&#8239;${fr(X.alpha)}%${X.alphaHors ? ic('diff', 12) : ''}</span>`;
const usage = (X) => `<span class="us${X.roleFournisseur ? '' : ' deduit'}" data-role="usage" data-usage="${X.role}" aria-label="${X.role}, ${X.roleFournisseur ? 'dit par le fournisseur' : 'déduit de l’α, à valider'}">${X.role === 'double' ? 'double' : X.role}</span>`;

// ---------- le podium ----------
const HAUT_RANG = [120, 98, 80, 68];
function colonne(nom) {
  const X = H[nom];
  const items = enPlus(nom).map((f) => {
    const F = X.fam[f];
    const hors = F.dessus;
    return `<li class="ep${hors ? ' hors' : ''}" data-famille-ligne="${f}" aria-label="${NOM[f]} : ${valCrans(F)} cran${Math.abs(Math.round(F.crans)) >= 2 ? 's' : ''}${hors ? ', au-dessus du style' : ''}">${pic(f, 16)}<b class="v-st">${valCrans(F)}</b><b class="v-ab">${valAbs(F)}</b>${hors ? ic('haut', 12, 'ic hors-ic') : ''}</li>`;
  }).join('');
  return `<div class="col" data-col="${nom}" data-houblon-compare="${nom}" data-couleur="${X.couleur}" style="--h:${X.couleur}" ${DEPART.includes(nom) ? '' : 'hidden'}>
    <div class="haut"><div class="tete"><b class="nm" data-houblon="${nom}"><i class="sq" aria-hidden="true"></i>${nom}</b></div>
    <div class="id">${alpha(X)}${stock(X)}<button class="retirer" aria-label="Houblon ${nom} : retirer de la comparaison">${ic('x', 12)}</button></div>
    <div class="id2">${usage(X)}</div>
    <button class="marche" aria-pressed="false" aria-label="Houblon ${nom} : mettre en avant">
      <span class="rang" aria-hidden="true">1</span>
      <span class="dose" data-nature="simule"><span class="t">~${fr(X.dose)}</span><small>g/L</small></span>
      <span class="gr" data-nature="simule">${fr(X.g20, 0)} g</span>
    </button></div>
    <ul class="plus" aria-label="Ce qu’il apporte en plus, simulé">${items}</ul>
  </div>`;
}

// ---------- famille par famille (barres de l5b, manière de w2) ----------
const pct = (x) => Math.max(0, Math.min(100, x)).toFixed(1) + '%';
// au style : le domaine du style (bande = 2/3 de la piste) ; élargi quand ma bière ou un après le dépasse
// (résineux : ta stout est déjà au-dessus), pour que l'effet reste lisible au lieu d'être rogné.
const domLigne = (f) => Math.max(domaine(f), 1.12 * Math.max(avInconnu(f) ? 0 : AV[f].centre, ...ORDRE_H.map((n) => (H[n].fam[f].inconnu ? 0 : H[n].fam[f].apres))));
const xs = (f, v) => (v / domLigne(f)) * 100;
const xa = (v) => v; // absolu : 0–100
function ligneFamille(f) {
  const bd = bande(f);
  const av = AV[f];
  const avI = avInconnu(f);
  const voies = ORDRE_H.map((nom) => {
    const F = H[nom].fam[f];
    if (F.inconnu) return `<span class="voie inc" data-h="${nom}" style="--h:${H[nom].couleur}" ${DEPART.includes(nom) ? '' : 'hidden'} aria-label="${nom} : effet inconnu, ce n’est pas zéro"><i class="hach"></i></span>`;
    const a0 = avI ? 0 : av.centre;
    const s0 = xs(f, a0), s1 = xs(f, F.apres), b0 = xs(f, F.bas), b1 = xs(f, F.haut);
    const o = Math.min(s1, 104), oa = xa(F.apres);
    return `<span class="voie" data-h="${nom}" style="--h:${H[nom].couleur};--s0:${pct(s0)};--s1:${pct(o)};--a0:${pct(xa(a0))};--a1:${pct(oa)};--i0:${pct(b0)};--i1:${pct(b1)};--j0:${pct(xa(F.bas))};--j1:${pct(xa(F.haut))}" ${DEPART.includes(nom) ? '' : 'hidden'} aria-label="${nom} : ${valCrans(F)} crans, ~${fr(F.apres, 0)} sur 100${F.dessus ? ', au-dessus du style' : ''}"><i class="seg"></i><i class="itv"></i>${s1 > 100 ? '<i class="deb" aria-hidden="true"></i>' : ''}</span>`;
  }).join('');
  const zS = xs(f, bd[1]), zA = xa(bd[1]);
  const biere = avI ? '' : `<i class="bt${xs(f, av.centre) > 100 ? ' dehors' : ''}" style="--b:${pct(Math.min(xs(f, av.centre), 101))};--ba:${pct(xa(av.centre))}" aria-hidden="true"></i>`;
  return `<li class="fl${f === 'citrus' ? ' ref' : ''}${domLigne(f) > domaine(f) ? ' large' : ''}" data-famille-ligne="${f}">
    <span class="fn">${pic(f, 16)}<span style="color:${JET[f].texte}">${COURT[f]}</span>${avI ? '<span class="q" aria-label="ma bière : non située">?</span>' : ''}</span>
    <span class="piste"><i class="zone" data-role="zone" style="--z:${pct(zS)};--za:${pct(zA)}" aria-hidden="true"></i>${biere}${voies}</span>
  </li>`;
}

// ---------- radar r2 ----------
const RW = 358, RH = 330, CX = RW / 2, CY = RH / 2 + 2, R = 108;
const ang = (k) => (k * 2 * Math.PI) / ROUE.length;
const pt = (k, r) => [CX + Math.sin(ang(k)) * r, CY - Math.cos(ang(k)) * r];
const P = (xy) => xy.map((v) => v.toFixed(1)).join(',');
const rS = (f, v) => Math.min(v / domaine(f), 1.06) * R;
const rA = (v) => Math.min(v / 100, 1.06) * R;
const tousInconnus = (f) => ORDRE_H.every((n) => H[n].fam[f].inconnu) && avInconnu(f);
function radar() {
  let s = `<svg data-radar data-objet="comparer" data-axes="${ROUE.join(',')}" width="${RW}" height="${RH}" viewBox="0 0 ${RW} ${RH}" role="img" aria-label="Radar : chaque houblon à agrumes égaux ; le houblon mis en avant est plein, avec son intervalle">`;
  // secteurs inconnus pour tous (hachurés), anneaux, zone du style
  s += '<defs><pattern id="hach" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#cfc8c0" stroke-width="1.2"/></pattern></defs>';
  ROUE.forEach((f, k) => {
    if (!tousInconnus(f)) return;
    const a = pt(k - 0.5, R), b = pt(k + 0.5, R);
    s += `<path d="M${CX},${CY} L${P(a)} A${R},${R} 0 0 1 ${P(b)} Z" fill="url(#hach)" data-inconnu="${f}"/>`;
  });
  for (const q of [1 / 3, 2 / 3, 1]) s += `<polygon points="${ROUE.map((f, k) => P(pt(k, R * q))).join(' ')}" fill="none" stroke="#e4ded8" stroke-width="1"/>`;
  ROUE.forEach((f, k) => { s += `<line x1="${CX}" y1="${CY}" x2="${P(pt(k, R))[0] ? pt(k, R)[0].toFixed(1) : 0}" y2="${pt(k, R)[1].toFixed(1)}" stroke="#e4ded8" stroke-width="1"/>`; });
  s += `<polygon class="v-st" data-role="zone" points="${ROUE.map((f, k) => P(pt(k, rS(f, bande(f)[1])))).join(' ')}" fill="rgba(60,50,40,0.07)" stroke="#a89c90" stroke-width="1"/>`;
  s += `<polygon class="v-ab" points="${ROUE.map((f, k) => P(pt(k, rA(bande(f)[1])))).join(' ')}" fill="rgba(60,50,40,0.07)" stroke="#a89c90" stroke-width="1"/>`;
  // ma bière (avant) : contour sombre fin
  const avV = ROUE.map((f) => (avInconnu(f) ? 0 : AV[f].centre));
  for (const [cls, fn] of [['v-st', (f, v) => rS(f, v)], ['v-ab', (f, v) => rA(v)]]) {
    s += `<polygon class="${cls} biere" points="${ROUE.map((f, k) => P(pt(k, fn(f, avV[k])))).join(' ')}" fill="none" stroke="#2b2420" stroke-width="1.5"/>`;
  }
  // une série par houblon
  for (const nom of ORDRE_H) {
    const X = H[nom];
    const vals = ROUE.map((f) => (X.fam[f].inconnu ? 0 : X.fam[f].apres));
    const inc = ROUE.filter((f) => X.fam[f].inconnu);
    s += `<g data-serie="${nom}" data-couleur="${X.couleur}" data-valeurs="${vals.map((v, k) => (v / domaine(ROUE[k])).toFixed(3)).join(',')}" data-inconnus="${inc.join(',')}" class="serie" style="--h:${X.couleur}" ${DEPART.includes(nom) ? '' : 'hidden'}>`;
    for (const [cls, fn, fi, fb] of [['v-st', rS, (f) => rS(f, X.fam[f].bas), (f) => rS(f, X.fam[f].haut)], ['v-ab', (f, v) => rA(v), (f) => rA(X.fam[f].bas), (f) => rA(X.fam[f].haut)]]) {
      s += `<g class="${cls}">`;
      // intervalle (bas–haut) le long de chaque axe : visible seulement pour le houblon mis en avant
      s += '<g class="itv">' + ROUE.map((f, k) => (X.fam[f].inconnu ? '' : `<line x1="${pt(k, fi(f))[0].toFixed(1)}" y1="${pt(k, fi(f))[1].toFixed(1)}" x2="${pt(k, fb(f))[0].toFixed(1)}" y2="${pt(k, fb(f))[1].toFixed(1)}"/>`)).join('') + '</g>';
      s += `<polygon points="${ROUE.map((f, k) => P(pt(k, fn(f, vals[k])))).join(' ')}"/>`;
      s += ROUE.map((f, k) => {
        const [x, y] = pt(k, fn(f, vals[k]));
        if (X.fam[f].inconnu) return '';
        const hors = X.fam[f].dessus;
        return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${hors ? 3.6 : 2.6}" class="${hors ? 'som hors' : 'som'}"/>`;
      }).join('');
      s += '</g>';
    }
    s += '</g>';
  }
  // libellés : un « ? » gris quand aucune donnée ne situe la famille
  ROUE.forEach((f, k) => {
    const [x, y] = pt(k, R + 16);
    const sn = Math.sin(ang(k));
    const anchor = Math.abs(sn) < 0.2 ? 'middle' : sn > 0 ? 'start' : 'end';
    const inc = tousInconnus(f);
    s += `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${anchor}" class="lab${inc ? ' inc' : ''}" fill="${inc ? '#6b625b' : JET[f].texte}">${COURT[f]}${inc ? '?' : ''}</text>`;
  });
  return s + '</svg>';
}

// ---------- chimie rattachée aux familles ----------
const SRC = KC.sources;
const srcCourt = (id) => id;
const CHIMIE = [
  ['3M4MP', ['citrus'], 'µg/kg', 'pamplemousse'],
  ['3MH', ['citrus', 'tropical'], 'µg/kg', 'pamplemousse, passion'],
  ['geraniol', ['floral', 'citrus'], '% huile', 'rose ; agrumes avec la levure'],
  ['linalol', ['floral', 'citrus'], '% huile', 'floral, agrumes'],
  ['4MMP', ['tropical', 'berries'], 'µg/kg', 'cassis, passion'],
  ['myrcene', ['resin', 'green'], '% huile', 'résineux, vert'],
];
const NOMC = { '3M4MP': '3M4MP', '3MH': '3MH', geraniol: 'géraniol', linalol: 'linalol', '4MMP': '4MMP', myrcene: 'myrcène' };
function celluleCompose(nom, k, unite) {
  const c = H[nom].h.composes.composes[k];
  if (!c || !c.valeurs) {
    const nd = c && c.nonDetecte ? 'non détecté' : 'inconnu';
    return `<td data-h="${nom}" ${DEPART.includes(nom) ? '' : 'hidden'} class="inc">${nd}<small>${c && c.nonDetecte ? c.nonDetecte[0].sources.join(' ') : ''}</small></td>`;
  }
  const v = c.valeurs.find((x) => x.portee === 'variété') || c.valeurs[0];
  const txt = v.plage[0] != null && v.plage[1] != null ? plg(v.plage[0], v.plage[1]) : v.plage[0] != null ? '> ' + fr(v.plage[0]) : '< ' + fr(v.plage[1]);
  const conf = v.aConfirmer ? ' <span class="aconf">à confirmer</span>' : '';
  return `<td data-h="${nom}" ${DEPART.includes(nom) ? '' : 'hidden'}><span data-nature="mesure" data-source="${v.sources.join(' ')}" aria-label="${NOMC[k]} : ${txt} ${unite}">${txt}</span>${conf}<small>${v.sources.map(srcCourt).join(' ')}</small></td>`;
}
function chimie() {
  const tete = `<tr><th></th>${ORDRE_H.map((n) => `<th data-h="${n}" ${DEPART.includes(n) ? '' : 'hidden'} style="--h:${H[n].couleur}"><i class="sq"></i>${n}</th>`).join('')}</tr>`;
  const lignes = CHIMIE.map(([k, fams, u]) => `<tr data-compose="${NOMC[k]}"><th><span class="cp">${fams.map((f) => pic(f, 14)).join('')}<b>${NOMC[k]}</b></span><small>${u}</small></th>${ORDRE_H.map((n) => celluleCompose(n, k, u)).join('')}</tr>`).join('');
  const huile = `<tr data-compose="huile"><th><span class="cp"><b>huile</b></span><small>mL/100 g</small></th>${ORDRE_H.map((n) => { const v = H[n].h.composes.huile.valeurs.find((x) => x.portee === 'variété'); return `<td data-h="${n}" ${DEPART.includes(n) ? '' : 'hidden'}><span data-nature="mesure" data-source="${v.sources.join(' ')}">${plg(...v.plage)}</span><small>${v.sources.join(' ')}</small></td>`; }).join('')}</tr>`;
  return `<table class="chim">${tete}${lignes}${huile}</table>`;
}

// ---------- panel OSU (mesuré, Cascade seulement) ----------
function osu() {
  const O = D.panelOSU;
  const W = 230, Hh = 120, x = (d) => 22 + (d / 16) * (W - 30), y = (v) => Hh - 18 - (v / 15) * (Hh - 30);
  const ligne = (arr, c, cls) => `<polyline points="${O.doses.map((d, i) => x(d).toFixed(1) + ',' + y(arr[i]).toFixed(1)).join(' ')}" fill="none" stroke="${c}" stroke-width="2"/>` + O.doses.map((d, i) => `<circle cx="${x(d).toFixed(1)}" cy="${y(arr[i]).toFixed(1)}" r="3" fill="#fff" stroke="${c}" stroke-width="2" class="${cls}"/>`).join('');
  let s = `<svg width="${W}" height="${Hh}" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Panel OSU, Cascade : agrumes et herbacé selon la dose">`;
  s += `<rect x="${x(O.zone[0]).toFixed(1)}" y="8" width="${(x(O.zone[1]) - x(O.zone[0])).toFixed(1)}" height="${Hh - 26}" fill="#f1ece6"/>`;
  s += `<line x1="22" y1="${Hh - 18}" x2="${W - 8}" y2="${Hh - 18}" stroke="#b7aea6"/>`;
  s += `<line x1="${x(4).toFixed(1)}" y1="6" x2="${x(4).toFixed(1)}" y2="${Hh - 18}" stroke="${COUL.Cascade}" stroke-width="2"/>`;
  s += ligne(O.herbaceThe, JET.herbal.base, 'h') + ligne(O.agrumes, JET.citrus.texte, 'a');
  for (const d of [0, 4, 8, 12]) s += `<text x="${x(d).toFixed(1)}" y="${Hh - 4}" text-anchor="middle" class="ax">${d}</text>`;
  s += `<text x="${W - 4}" y="${Hh - 4}" text-anchor="end" class="ax">g/L</text>`;
  return s + '</svg>';
}

// ---------- vraies valeurs (v1), à un toucher ----------
function valeurs() {
  const lig = (lab, unite, get) => `<tr><th>${lab}<small>${unite}</small></th>${ORDRE_H.map((n) => `<td data-h="${n}" ${DEPART.includes(n) ? '' : 'hidden'}>${get(H[n])}</td>`).join('')}</tr>`;
  const srcs = (arr, unite) => arr.map((s) => `<span class="vv" data-nature="mesure" data-source="${esc(s.source + ' ' + (s.annee || ''))}">${plg(s.min, s.max)}${unite ? '&#8239;' + unite : ''}<small>${s.source === 'Beer Maverick' ? 'Beer Maverick' : s.source} ${s.annee || ''}</small></span>`).join('');
  const tete = `<tr><th></th>${ORDRE_H.map((n) => `<th data-h="${n}" ${DEPART.includes(n) ? '' : 'hidden'} style="--h:${H[n].couleur}"><i class="sq"></i>${n}</th>`).join('')}</tr>`;
  return `<table class="vals">${tete}
    ${lig('α du lot', '%', (X) => `<span class="vv" data-nature="mesure" data-source="${X.alphaDe}">${fr(X.alpha)}&#8239;%${X.alphaHors ? ' ≠' : ''}<small>${X.alphaDe === 'fiche de stock' ? 'fiche de stock' : 'article du lot'}</small></span>`)}
    ${lig('α des fiches', '%', (X) => srcs(X.fichesSrc, '%'))}
    ${lig('β', '%', (X) => srcs(X.h.beta.sources, '%'))}
    ${lig('huile totale', 'mL/100 g', (X) => srcs(X.h.huiles.totale.sources, ''))}
  </table>`;
}

// ---------- à ces doses : dose, grammes, IBU, risques ----------
const DRAP = { 'hop-creep': 'hop creep', saturation: 'saturation' };
function aCesDoses() {
  return `<table class="doses">
    <tr><th></th>${ORDRE_H.map((n) => `<th data-h="${n}" ${DEPART.includes(n) ? '' : 'hidden'} style="--h:${H[n].couleur}"><i class="sq"></i>${n}</th>`).join('')}</tr>
    <tr><th>dose</th>${ORDRE_H.map((n) => `<td data-h="${n}" ${DEPART.includes(n) ? '' : 'hidden'}><span data-nature="simule">~${fr(H[n].dose)}&#8239;g/L</span></td>`).join('')}</tr>
    <tr><th>pour 20 L</th>${ORDRE_H.map((n) => `<td data-h="${n}" ${DEPART.includes(n) ? '' : 'hidden'}>~${fr(H[n].g20, 0)}&#8239;g</td>`).join('')}</tr>
    <tr><th>IBU</th><td colspan="4" class="inc">aucun calculé : à cru, non modélisé</td></tr>
    <tr><th>confiance</th>${ORDRE_H.map((n) => `<td data-h="${n}" ${DEPART.includes(n) ? '' : 'hidden'}>${H[n].confiance}</td>`).join('')}</tr>
    <tr><th>à surveiller</th>${ORDRE_H.map((n) => `<td data-h="${n}" ${DEPART.includes(n) ? '' : 'hidden'}>${H[n].drapeaux.filter((d) => DRAP[d]).map((d) => `<span class="dr">${DRAP[d]}</span>`).join('')}</td>`).join('')}</tr>
  </table><p class="pied">US-05 : géraniol → citronellol (agrumes), compté par le moteur pour les quatre.</p>`;
}

// ---------- la fiche (g1), données pour le client ----------
const A = D.descripteurs.A;
const FD = Object.fromEntries(ORDRE_H.map((nom) => {
  const X = H[nom], h = X.h;
  const deplaces = A.effets[nom].deplaces;
  const aromes = h.aromes.map((a) => ({ f: a.family, niv: a.level, label: a.label, n: a.sources, of: a.of, auteurs: a.authors, mots: [...new Set(a.mots.flatMap((m) => m.mots.map((w) => w.toLowerCase())))] }));
  if (deplaces.length) {
    const b = aromes.find((a) => a.f === A.famille);
    b.mots = [...new Set([...b.mots, ...deplaces])];
    if (b.niv === 0) { b.niv = 1; b.label = 'cité'; b.n = 1; b.regleA = true; }
  }
  const sans = [...new Set(h.motsSansFamille.map((m) => m.mot.toLowerCase()))].filter((w) => !deplaces.map((x) => x.toLowerCase()).includes(w) && !D.descripteurs.B.generiques.includes(w));
  return [nom, { nom, couleur: X.couleur, alpha: fr(X.alpha), alphaHors: X.alphaHors, fiches: plg(...X.fichesA), alphaDe: X.alphaDe, role: X.role, roleF: X.roleFournisseur, aromes, of: (h.aromes[0] || {}).of || 0, auteurs: [...new Set(h.aromes.flatMap((a) => a.authors))], sans, regleA: deplaces.length > 0 }];
}));

// ---------- page ----------
const NOMS_SRC = ['H11', 'H22', 'H2', 'H3', 'H26', 'H27', 'hs-cas', 'hs-nsn'].filter((k) => SRC[k]).map((k) => `<li><b>${k}</b> ${esc(SRC[k].titre.split(',').slice(0, 2).join(','))}</li>`).join('');
const css = fs.readFileSync(path.join(ICI, 'page.css'), 'utf8');
const client = fs.readFileSync(path.join(ICI, 'client.js'), 'utf8');
const CSS_FAM = ROUE.map((f) => `[data-famille="${f}"]{--b:${JET[f].base};--t:${JET[f].texte};--f:${JET[f].fond}}`).join('\n');

const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>r6c · Le podium des agrumes · Comparer (lot 22)</title>
<!-- Générée par generer.mjs ; données : ../donnees/comparer-stout.json (${D.version}, ${D.date}). Ne pas modifier à la main. -->
<style>:root{--acc:${ACC}}\n${CSS_FAM}\n${css}</style></head>
<body>
${SYMB}
<header class="barre">
  <button class="retour" aria-label="Retour">${ic('chev-l', 18)}</button>
  <h1 data-role="titre">Lequel pour ma stout&#8239;?</h1>
  <button class="aide" data-role="legende-bouton" aria-expanded="false" aria-controls="legende" aria-label="Légende">?</button>
</header>
<p class="ctx" data-role="contexte">
  <span data-contexte="base">${pic('citrus', 14)}agrumes = Cascade 4&#8239;g/L</span>
  <span data-contexte="moment">${ic('cuveP', 14)}après, 3&#8239;j</span>
  <span data-contexte="levure">US-05</span>
  <span data-contexte="biere">16D</span>
</p>
<div class="rangee">
  <div class="lentille" role="radiogroup" aria-label="Lecture" data-lecture>
    <button role="radio" data-e="style" aria-checked="true">Au style</button><button role="radio" data-e="absolu" aria-checked="false">Absolu</button>
  </div>
</div>

<section class="podium" data-libre="houblon" aria-label="Le podium : le moins de grammes pour les mêmes agrumes">
  <div class="cols">${ORDRE_H.map(colonne).join('')}</div>
  <div class="socle" aria-hidden="true"></div>
  <p class="en-plus" aria-hidden="true">~ en plus</p>
  <div class="ajouts">${ORDRE_H.map((n) => `<button class="ajout" data-ajout="${n}" aria-label="Houblon ${n} : ajouter à la comparaison" ${DEPART.includes(n) ? 'hidden' : ''}>${ic('plus', 14)}<span>${n}</span></button>`).join('')}</div>
</section>

<section class="familles">
  <h2 class="st">Famille par famille</h2>
  <ul class="lignes">${LIGNES.map(ligneFamille).join('')}</ul>
</section>

<section class="bloc" data-acquis="radar">
  <h2 class="st">Silhouettes, à agrumes égaux</h2>
  <div class="radar-cont">${radar()}</div>
  <div class="bascule" data-libre="houblon" role="group" aria-label="Houblon mis en avant">${ORDRE_H.map((n) => `<button class="bh" data-focus="${n}" aria-pressed="false" aria-label="Houblon ${n} : mettre en avant" style="--h:${H[n].couleur}" ${DEPART.includes(n) ? '' : 'hidden'}><i class="sq"></i>${n}</button>`).join('')}</div>
</section>

<section class="bloc" data-acquis="chimie">
  <h2 class="st">Ce qui fait les agrumes</h2>
  ${chimie()}
  <p class="pied">Fiches et analyses du houblon, pas de la bière. Inconnu ≠ 0.</p>
</section>

<section class="bloc" data-acquis="osu" data-nature="mesure" data-source="${D.panelOSU.sources.join(' ')}">
  <h2 class="st">Panel OSU · Cascade</h2>
  <div class="osu">${osu()}
    <ul class="osu-l">
      <li><i class="tr" style="background:${JET.citrus.texte}"></i>agrumes <b>${fr(D.panelOSU.agrumes[1])} → ${fr(D.panelOSU.agrumes[3])} → ${fr(D.panelOSU.agrumes[4])}</b></li>
      <li><i class="tr" style="background:${JET.herbal.base}"></i>herbacé <b>${fr(D.panelOSU.herbaceThe[1])} → ${fr(D.panelOSU.herbaceThe[4])}</b></li>
      <li class="m">sur 15 · plafond dès 8&#8239;g/L · ${D.panelOSU.sources.join(' ')}</li>
      <li class="m">Idaho 7, Galaxy : aucun panel de dose</li>
    </ul>
  </div>
</section>

<section class="bloc">
  <h2 class="st">À ces doses</h2>
  ${aCesDoses()}
</section>

<section class="bloc">
  <button class="preuves" aria-expanded="false" aria-controls="vraies">${ic('livre', 14)}<span>Les vraies valeurs</span>${ic('chev-r', 14, 'ic chev')}</button>
  <div id="vraies" data-acquis="valeurs" hidden>${valeurs()}<ul class="srcs">${NOMS_SRC}</ul></div>
</section>

<nav class="pont" aria-label="Suite"><a href="#" data-role="pont">${ic('fleche', 14)}<span>Doser <b class="pont-nom">Galaxy</b> dans Dryhopper</span></a></nav>
<p class="pied bas">~ simulé : moteur profil-simulé (${D.date}), doses interpolées entre 1, 2, 4 et 8&#8239;g/L. ${esc(KC.biereNoire.texte)}</p>

<div class="voile" data-role="legende-voile" hidden></div>
<aside id="legende" class="legende" data-role="legende" hidden aria-label="Légende">
  <h2 class="st">Lire le podium</h2>
  <ul>
    <li>Chaque houblon à la dose qui donne <b>les mêmes agrumes</b> que Cascade 4&#8239;g/L. Plus haut sur le podium = moins de grammes.</li>
    <li>${pic('tropical', 14)}<b>+3</b> : ce qu’il ajoute en plus, en crans du style 16D ; <span class="hors-t">orangé</span> = au-dessus du style.</li>
    <li>Le résineux est toujours montré : ta stout l’est déjà trop (dégustation du 18.10).</li>
    <li>~ simulé ; <span class="us deduit">double</span> = rôle déduit de l’α, à valider ; ${ic('diff', 12)} = α du lot hors de ses fiches ; ${ic('stock', 14)} = en stock.</li>
    <li>Barres : trait noir = ta stout ; fond = zone du style ; trait fin = intervalle du houblon mis en avant ; hachures et « ? » = inconnu, pas zéro. Résineux : échelle élargie, ta stout est déjà au-dessus.</li>
    <li>Descripteurs A : « groseille à maquereau » rangée dans Petits fruits (Nelson Sauvin seulement).</li>
  </ul>
</aside>

<div class="fiche-voile" hidden></div>
<section class="fiche" data-role="fiche" role="dialog" aria-modal="true" aria-label="Fiche du houblon" hidden></section>

<script>
const FD = ${JSON.stringify(FD)};
const H = ${JSON.stringify(Object.fromEntries(ORDRE_H.map((n) => [n, { dose: H[n].dose, g20: H[n].g20, couleur: H[n].couleur }])))};
const DEPART = ${JSON.stringify(DEPART)};
const HAUT_RANG = ${JSON.stringify(HAUT_RANG)};
const ROUE = ${JSON.stringify(ROUE)}, COURT = ${JSON.stringify(COURT)}, NOMF = ${JSON.stringify(NOM)};
const TONS = ${JSON.stringify(Object.fromEntries(ROUE.map((f) => [f, JET[f]])))};
${client}
</script>
</body></html>`;

fs.writeFileSync(path.join(ICI, 'etat.html'), html);
console.log('écrit r6c/etat.html (' + html.length + ' o)');
for (const n of ORDRE_H) console.log(n.padEnd(14), '~' + fr(H[n].dose) + ' g/L', fr(H[n].g20, 0) + ' g', enPlus(n).map((f) => COURT[f] + ' ' + valCrans(H[n].fam[f]) + (H[n].fam[f].dessus ? '!' : '')).join(', '));
