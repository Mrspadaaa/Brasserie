// Lot 21 · w3b · « Dessine ta bière », seconde passe (retenue par le critique ; w3 reste intacte).
// Le brasseur GLISSE sa cible sur les pistes de sa bière (loupe du demi-cran sous le doigt) ; la page répond
// en une phrase de recette (« Mets Citra 2 g/L actif 1 j avec US-05, seul »), dont les mots se touchent pour
// s'en écarter. Les mots fixés (moment, levure, seul / ensemble / puis) sont les siens, la page cherche le
// reste : houblon, dose, jours. Trois façons d'y aller, sage / franc / osé, sur la même piste ; un verdict en
// mots (« ça tient », « presque », « ne marchera pas », « on ne sait pas »). À un toucher : ton défi (ta
// dégustation du 18.10), « Tire une bière », la preuve.
// Départ : dry hop ACTIF avec US-05, un houblon, 4 g/L au plus, dans ta 16D ; cible : floral un cran (« je la
// veux plus floral »). Profil ~ simulé : profils-simules.json (4,75 % vol.) ; vraies valeurs sourcées.
// Usage : node generer-w3b.mjs  →  w3b/etat.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as S from '../w1/socle-w.mjs';

const { D, ORDRE, HOP, JET, fr, esc, ic, pic, alpha, usage, nomH, conf, V, bandeLog, seg, feuille, preuve, page, ecrire, MOMENT, MOTS_F, COURT, NOM, inconnu, STUB_MOT, compacter, JS_DEPLIER, profilLignes, LPX, LW } = S;
const ICI = path.dirname(fileURLToPath(import.meta.url));
const AV = D.AVANT;
const FAMS = ORDRE.filter((f) => f !== 'resin');

// ---------- l'espace des gestes : un houblon (grille), ensemble (paires), puis (K3, K4) ----------
const GESTES = [];
for (const g of D.PROFILS.grille) GESTES.push({ h: g.houblon, h2: '', a: 'seul', d: g.dose_gL, m: g.moment, j: g.jours, l: g.levure, p: compacter(g.profil), c: g.confiance });
for (const p of D.PROFILS.paires) GESTES.push({ h: p.noms[0], h2: p.noms[1], a: 'ensemble', d: 2, m: p.moment, j: p.jours, l: p.levure, p: compacter(p.profil), c: p.confiance, ap: p.noms.map((n) => ORDRE.map((f) => Math.round(p.apports[n][f] * 10) / 10)) });
const vus = new Set();
for (const c of D.PROFILS.cas.filter((x) => x.groupe === 'K3' || x.groupe === 'K4')) {
  const [a1, a2] = c.ajouts, k = [a1.moment, c.levure, a2.nom].join('|'); if (vus.has(k)) continue; vus.add(k);
  GESTES.push({ h: a1.nom, h2: a2.nom, a: 'puis', d: a1.dose_gL, d2: a2.dose_gL, m: a1.moment, j: a1.jours, j2: a2.jours, l: c.levure, p: compacter(c.apres), c: c.confiance.niveau, cas: c.id });
}
console.log(GESTES.length + ' gestes (' + GESTES.filter((g) => g.a === 'seul').length + ' seuls, ' + GESTES.filter((g) => g.a === 'ensemble').length + ' ensemble, ' + GESTES.filter((g) => g.a === 'puis').length + ' puis)');

// ---------- vraies valeurs : IBU de ta stout (calcul de l'app), IBU d'un ajout à chaud (moteur, mis à l'échelle) ----------
const C1 = JSON.parse(fs.readFileSync(D.REPO + '/work/refonte-frontend/v4/ecran-1/fils15-s5-complexe/donnees/c1.json', 'utf8'));
const IBU0 = { v: C1.ibu, src: 'IBU de ta stout : calcul de l’app (fils15-s5-complexe c1)' };
const ibuRef = Object.fromEntries(['b60', 'b10', 'wp'].map((m) => { const x = D.cas('K1-citra-' + m).mesures.find((y) => y.type === 'ibu'); return [m, x.valeur]; }));
const alphaRef = (h) => HOP[h].alpha.lot ?? (HOP[h].alpha.fiches[0] + HOP[h].alpha.fiches[1]) / 2;
const IBU = {}; // « h|m|d » → IBU ajoutés (calcul : moteur pour Citra 4 g/L, mis à l'échelle de la dose et de l'α)
for (const h of D.VALEURS.houblons) for (const m of ['b60', 'b10', 'wp']) for (const d of D.VALEURS.doses) IBU[h + '|' + m + '|' + d] = Math.round(ibuRef[m] * (d / 4) * (alphaRef(h) / 12.5));

// ---------- le mur des mesures (u5), la simulation face aux mesures, Lafontaine (K), les trous ----------
const E = (id, t) => D.mesureEtude(id, t);
const KISH = D.VERIFS.find((v) => v.id === 'kishimoto-linalol'), KISG = D.VERIFS.find((v) => v.id === 'kishimoto-geraniol'), L4 = D.VERIFS.find((v) => v.id === 'lafontaine-4mmp'), L3 = D.VERIFS.find((v) => v.id === 'lafontaine-3mh');
const cel = (val, src, o = {}) => `<td data-nature="mesure" data-source="${esc(src)}" class="${o.v ? 'av' : ''}"><b class="mono">${val}</b>${o.v ? '<i>à vérifier</i>' : ''}</td>`;
const trou = '<td class="trou"><i class="w-hach" aria-hidden="true"></i><span>trou</span></td>';
const e06 = (c) => E('E06', (m) => m.variete === 'Citra' && m.compose === c);
const MUR = `<table class="w3b-mur"><thead><tr><th></th><th>${pic('floral', 14)}linalol</th><th>${pic('floral', 14)}géraniol</th><th>${pic('green', 14)}myrcène</th><th>${pic('tropical', 14)}4MMP</th><th>${pic('citrus', 14)}3MH</th></tr></thead><tbody>
  <tr><th>${nomH('Citra')}</th>${cel(fr(e06('linalol').valeur) + ' µg/L', 'E06 · Feng 2015')}${cel(fr(e06('géraniol').valeur) + ' µg/L', 'E06 · Feng 2015', { v: e06('géraniol').aVerifier })}${cel(fr(e06('myrcène').valeur) + ' µg/L', 'E06 · Feng 2015')}${trou}${trou}</tr>
  <tr><th>${nomH('Cascade')}</th>${cel(fr(KISH.mesure.central) + ' µg/L', 'H12 · Kishimoto 2008')}${cel(fr(KISG.mesure.central) + ' µg/L', 'H12 · Kishimoto 2008')}${trou}${cel(fr(L4.mesure.min) + '–' + fr(L4.mesure.max) + ' ng/L', 'H20 · Lafontaine 2019')}${cel(L3.mesure.min + '–' + L3.mesure.max + ' ng/L', 'H20 · Lafontaine 2019')}</tr>
  <tr><th>${nomH('Galaxy')}</th>${trou}${trou}${trou}${trou}${trou}</tr>
  <tr><th>${nomH('Idaho 7')}</th>${cel(fr(E('E03', (m) => m.variete === 'Idaho-7' && m.compose === 'linalol').valeur * 1000) + ' µg/L', 'E03 · McCabe, au pitch', { v: true })}${trou}${cel(fr(E('E03', (m) => m.variete === 'Idaho-7' && m.compose === 'myrcène').valeur * 1000) + ' µg/L', 'E03 · McCabe, au pitch', { v: true })}${trou}${trou}</tr>
</tbody></table>`;
const JUSTE = [
  ['juste', 'Cascade 2 g/L, linalol', 'mesuré 56,9 µg/L (Kishimoto 2008)', 'moteur ~ 57 au centre'],
  ['trop haut', 'Citra, linalol', 'mesuré 144 µg/L (Feng 2015, dose non dite)', 'moteur ~ 460 à 4 g/L : 2 à 5 fois au-dessus ; la plage encadre'],
  ['plus rapide', 'contact', 'Eureka! : l’essentiel en 2 j (Schmidt 2019)', 'moteur : 97 % en 24 h'],
  ['plus lent', 'contact', 'Cascade 1 h = 96 h au nez (Titus 2021)', 'moteur : 13 % à 1 h'],
  ['sous la mesure', 'Cascade, 3MH', 'mesuré 67–141 ng/L (Lafontaine 2019)', 'calcul 7,8–18 ng/L : le 3MH monte au brassage, sans chiffre'],
];
const LAF = { ag: [1.9, 4.4, 5.8, 7.1, 7.0], he: [2.5, 4.3, 5.7, 7.4, 10.4], d: [0, 2, 3.86, 8, 16] };
const lafSvg = (() => { const W = 280, H = 90, X = (d) => (d / 16) * W, Y = (v) => H - (v / 12) * H; const L = (a, c, dash) => `<polyline fill="none" stroke="${c}" stroke-width="2.5"${dash ? ' stroke-dasharray="5 3"' : ''} points="${a.map((v, i) => X(LAF.d[i]) + ',' + Y(v)).join(' ')}"/>` + a.map((v, i) => `<circle cx="${X(LAF.d[i])}" cy="${Y(v)}" r="3" fill="${c}"/>`).join('');
  return `<svg class="w3b-laf" viewBox="-4 -6 ${W + 8} ${H + 22}" width="${W + 8}" height="${H + 22}" role="img" aria-label="Lafontaine 2018, Cascade 24 h : agrumes 1,9 à 7,0 sur 15, herbacé 2,5 à 10,4">${L(LAF.ag, JET.citrus.base)}${L(LAF.he, JET.herbal.base, true)}${LAF.d.map((d) => `<text x="${X(d)}" y="${H + 14}" font-size="11" text-anchor="middle" fill="#5b5b66">${fr(d, 2)}</text>`).join('')}</svg>`; })();
const PREUVE = feuille('preuve', 'La preuve', `
  <h3>${ic('labo', 14)}Le mur des mesures en bière</h3>${MUR}
  <p class="w3b-n">Une case pleine : une valeur publiée, avec sa source. Hachurée : personne ne l’a mesurée. Aucune ne compare deux houblons à dose égale.</p>
  <h3>${ic('cible', 14)}La simulation tombe-t-elle juste ?</h3>
  <ul class="w3b-juste">${JUSTE.map(([v, q, m, s]) => `<li><span class="w3b-jv ${v === 'juste' ? 'ok' : 'ko'}">${v}</span><b>${q}</b><span data-nature="mesure" data-source="${esc(m)}">${m}</span><span class="w3b-js">${conf('simule')}${s}</span></li>`).join('')}</ul>
  <h3>${ic('panel', 14)}Lafontaine 2018, Cascade 24 h, sur 15 ${conf('panel')}<span class="w3b-k">${ic('ok', 12)}lecture H, vérifiée sur l’article (K)</span></h3>
  ${lafSvg}<p class="w3b-n"><span class="w3b-li" style="background:${JET.citrus.base}"></span><span data-nature="mesure" data-source="E04 · Lafontaine 2018, tableau 3">agrumes 1,9 · 4,4 · 5,8 · 7,1 · 7,0 : ils plafonnent dès 8 g/L</span> <span class="w3b-li tir" style="background:${JET.herbal.base}"></span><span data-nature="mesure" data-source="E04 · Lafontaine 2018, tableau 3">herbacé 2,5 · 4,3 · 5,7 · 7,4 · 10,4 : il monte</span> (0 · 2 · 3,86 · 8 · 16 g/L)</p>
  ${bandeLog({ compose: 'linalol', familles: ['floral', 'citrus'], ...D.rapports('cas-citra.json').linalol, source: 'moteur pouvoir (fils19 cas-citra)', qui: 'Citra 4 g/L', couleur: HOP.Citra.couleur })}
  ${bandeLog({ compose: '4MMP', familles: ['tropical', 'berries'], ...D.rapports('cas-citra.json')['4MMP (4MSP)'], source: 'moteur pouvoir (fils19 cas-citra)', qui: 'Citra 4 g/L', couleur: HOP.Citra.couleur })}
  ${bandeLog({ compose: '4MMP', familles: ['tropical', 'berries'], ...D.rapports('cas-cascade.json')['4MMP (4MSP)'], source: 'moteur pouvoir (fils19 cas-cascade)', qui: 'Cascade 4 g/L', couleur: HOP.Cascade.couleur })}
  <h3>${ic('info', 14)}Les trous</h3>${['Citra contre Cascade en bière, à dose égale', 'Galaxy, chiffré', 'variété × levure × dry hop', 'l’ordre de deux dry hops', 'la perception dans une stout'].map((t) => `<p class="w-trou">${inconnu('aucune étude : ' + t, 'trou')}<span>${t}</span></p>`).join('')}
  <h3>${ic('reglages', 14)}Comment la page cherche</h3>
  <p class="w3b-n">${GESTES.length} gestes ~ simulés : ${D.PROFILS.grille.length} à un houblon, ${D.PROFILS.paires.length} ensemble (2 + 2 g/L, 3 j), ${GESTES.filter((g) => g.a === 'puis').length} l’un puis l’autre (cas K3, K4). Ce qui manque à ta cible compte plein, ce qui la dépasse moitié ; à écart égal, la dose la plus basse. Sage : le plus léger qui reste près de Franc. Franc : le plus proche dans ta 16D, un houblon, 4 g/L au plus. Osé : le plus proche sans limite. Aucun n’est « le meilleur ».</p>
  <p class="w3b-n">${conf('simule')} ${esc(D.PROFILS.mention)}</p>`);

// ---------- l'écran ----------
const corps = `
  ${S.tete('Dessine ta bière')}
  <section class="w3b-rep" id="rep" data-role="objectif" aria-label="La réponse">
    <p class="w3b-l1"><span id="vd" class="w3b-vd" data-nature="simule"></span><span id="cib" class="w3b-cib" data-nature="simule"></span></p>
    <p class="w3b-ph" id="phrase" data-role="ajout"></p>
    <p class="w3b-pq" id="pq" hidden></p>
    <div class="w3b-al" id="al"></div>
    <div class="w3b-bio" id="bio" data-role="biotransformation"></div>
    <div class="w3b-ec" id="ecart" hidden></div>
    <div class="w3b-regs">
      ${seg('moment', 'Moment', [{ v: 'dryActive', h: ic('cuveA', 14) + 'actif' }, { v: 'dryPost', h: ic('cuveP', 14) + 'après' }, { v: 'chaud', h: ic('ebu', 14) + 'à chaud' }], 'dryActive', 'w3b-seg')}
      ${seg('ajout-cumule', 'Assemblage', [{ v: 'seul', t: 'seul' }, { v: 'ensemble', t: 'ensemble' }, { v: 'puis', t: 'puis' }], 'seul', 'w3b-seg')}
      ${seg('levure', 'Levure', ['US-05', 'Pomona', 'Verdant', 'Diamond'].map((l) => ({ v: l, t: l })), 'US-05', 'w3b-seg')}
    </div>
    <p class="w3b-msg" id="msg" hidden></p>
  </section>
  <section class="w3b-fig" data-role="simulation" aria-label="Ta bière, ta cible, le geste">
    <div class="w3b-ft">${conf('simule')}<span class="w3b-lg"><i class="w3b-av"></i>ta bière</span><span class="w3b-lg"><i class="w3b-cbx"></i>ta cible</span><span class="w3b-lg"><i class="w3b-ap"></i>après</span><button type="button" class="w3b-tire" id="tire" data-role="reglage" data-reglage="tirage">${ic('melange', 14)}Tire une bière</button></div>
    <div class="w3b-pistes" id="pistes">${profilLignes(AV, AV, { id: 'prof', familles: FAMS })}
      <div class="w3b-res">${pic('resin', 16)}<span class="w-rn">Résineux</span><span class="w3b-hh">hors houblon (ta dégustation)</span></div>
      <div class="w3b-loupe" id="loupe" hidden><b id="loupe-t"></b><span class="w3b-loupe-r" id="loupe-r"></span></div>
    </div>
    <p class="w3b-tir" id="tir" hidden></p>
  </section>
  <section class="w3b-plans" id="plans" aria-label="Trois façons d’y aller"></section>
  <div class="w3b-act"><button type="button" class="w-pq" data-detail="defi">${ic('cible', 14)}<span>Ton défi</span></button><button type="button" class="w-pq" data-detail="preuve">${ic('labo', 14)}<span>Preuve</span></button></div>
  <section class="w3b-oeil" id="oeil" data-role="simulation" aria-label="Les trois sur une même piste"></section>
  <section class="w3b-proches"><h3 class="w3b-h3">Les plus proches ensuite</h3><p class="w3b-n">rangés par écart à ta cible : ce qui manque compte plein, ce qui dépasse moitié</p><div id="proches"></div></section>
  <p class="w3b-pied">${conf('simule')}<span>${STUB_MOT}</span><span>· ta 16D, Nugget 60′</span>${alpha('Nugget')}<span>· IBU de ta stout</span>${V(fr(IBU0.v, 0) + ' IBU', IBU0.src)}</p>`;

const css = `
  .ecran { gap: 8px; }
  .w3b-rep { display: flex; flex-direction: column; gap: 6px; padding: 8px 10px 10px; border-radius: 8px; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.14), inset 4px 0 0 var(--pl, #2f6b4f); }
  .w3b-l1 { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; min-height: 22px; }
  .w3b-vd { display: inline-flex; align-items: center; gap: 3px; height: 22px; padding: 0 8px 0 5px; border-radius: 999px; font-size: 12px; font-weight: 700; white-space: nowrap; }
  .w3b-vd.tient { background: #e6f2ea; color: #2f6b4f; } .w3b-vd.presque { background: #fff; color: var(--encre); box-shadow: inset 0 0 0 1.5px var(--encre); }
  .w3b-vd.non { background: #16161a; color: #fff; } .w3b-vd.inc { background: #fff; color: var(--gris); box-shadow: inset 0 0 0 1.5px #8a909b; }
  .w3b-vd.sort { background: #fff; color: var(--acc); box-shadow: inset 0 0 0 1.5px var(--acc); }
  .w3b-cib { display: inline-flex; flex-wrap: wrap; gap: 2px 8px; font-size: 13px; }
  .w3b-cib > span { display: inline-flex; align-items: center; gap: 3px; } .w3b-cib b { font: 600 13px var(--mono); }
  .w3b-ph { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; font-size: 16px; line-height: 1.25; }
  .w3b-m { color: var(--gris); }
  .w3b-tok { display: inline-flex; align-items: center; gap: 2px; min-height: 30px; padding: 0 5px 0 7px; border-radius: 8px; background: #f3f3f6; box-shadow: inset 0 -2px 0 #c4c4cc; font-size: 16px; }
  .w3b-tok[aria-expanded="true"] { background: #fff; box-shadow: inset 0 0 0 2px var(--encre); }
  .w3b-tok.fixe { box-shadow: inset 0 0 0 1.5px var(--encre); }
  .w3b-tok .hn { font-size: 16px; } .w3b-tok b { font-weight: 600; }
  .w3b-fix { font-size: 12px; color: var(--gris); }
  .w3b-mot { display: inline-flex; align-items: center; gap: 3px; font-size: 16px; font-weight: 600; }
  .w3b-bio { display: flex; align-items: center; gap: 4px; font-size: 13px; flex-wrap: wrap; } .w3b-bio .w-inc { font-size: 12px; }
  .w3b-pq { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 13px; color: var(--gris); }
  .w3b-pq button { min-height: 28px; padding: 0 10px; border-radius: 999px; box-shadow: inset 0 0 0 1.5px #6a2c91; color: #6a2c91; font-weight: 700; font-size: 13px; }
  .w3b-al { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .w3b-regs { display: flex; flex-wrap: wrap; gap: 4px; }
  .w3b-seg button { min-height: 28px; padding: 0 8px; font-size: 13px; }
  .w3b-seg button .ic { margin-right: 1px; }
  .w3b-msg { font-size: 13px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .w3b-msg button { min-height: 28px; padding: 0 10px; border-radius: 999px; box-shadow: inset 0 0 0 1.5px var(--encre); font-weight: 600; }
  .w3b-ec { display: flex; flex-direction: column; gap: 4px; padding: 6px; border-radius: 8px; background: #f6f6f9; }
  .w3b-ec-t { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--gris); }
  .w3b-ec-t button { margin-left: auto; font-size: 12px; font-weight: 700; color: var(--encre); min-height: 26px; padding: 0 8px; border-radius: 999px; box-shadow: inset 0 0 0 1px var(--trait2); background: #fff; }
  .w3b-cs { display: flex; gap: 4px; }
  .w3b-c { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 3px 2px; border-radius: 8px; background: #fff; }
  .w3b-c[aria-checked="true"] { box-shadow: inset 0 0 0 2px var(--encre); }
  .w3b-c b { font: 600 12px var(--mono); } .w3b-c span { font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .w3b-c .vv { font-weight: 700; } .w3b-c.tient .vv { color: #2f6b4f; } .w3b-c.sort .vv { color: var(--acc); } .w3b-c.non .vv { color: var(--gris); }
  .w3b-fig { display: flex; flex-direction: column; gap: 4px; }
  .w3b-ft { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 12px; color: var(--gris); }
  .w3b-lg { display: inline-flex; align-items: center; gap: 4px; }
  .w3b-av { width: 2px; height: 12px; background: var(--encre); display: inline-block; }
  .w3b-cbx { width: 0; height: 14px; border-left: 2.5px solid var(--encre); display: inline-block; }
  .w3b-ap { width: 14px; height: 8px; background: #bf86d6; display: inline-block; border-radius: 0 2px 2px 0; }
  .w3b-tire { margin-left: auto; display: inline-flex; align-items: center; gap: 3px; min-height: 28px; padding: 0 8px; border-radius: 999px; box-shadow: inset 0 0 0 1.5px var(--encre); font-size: 12px; font-weight: 700; color: var(--encre); }
  .w3b-pistes { position: relative; display: flex; flex-direction: column; gap: 2px; }
  #prof { gap: 2px; }
  #prof .w-row { height: 22px; cursor: grab; touch-action: none; border-radius: 4px; }
  #prof .w-row .w-z { height: 16px; }
  /* la plage en pâle, une seule marque de borne partielle : la plage s'efface au bout */
  #prof .w-row .w-w { top: 1px; bottom: 1px; height: auto; margin: 0; background: rgba(22,22,26,.13); border-radius: 2px; z-index: 0; }
  #prof .w-row.hp .w-w { background: linear-gradient(90deg, rgba(22,22,26,.13) 72%, rgba(22,22,26,0)); }
  #prof .w-row .w-w::before, #prof .w-row .w-w::after { display: none; }
  #prof .w-row .w-b, #prof .w-row .w-x { top: 4px; height: 8px; }
  #prof .w-row.vise { background: color-mix(in srgb, var(--z) 70%, #fff); }
  .w3b-cb { position: absolute; top: -3px; bottom: -3px; width: 0; border-left: 2.5px solid var(--encre); z-index: 5; pointer-events: none; transition: left .15s; }
  .w3b-cb::after { content: ''; position: absolute; top: -3px; left: -5.25px; border: 4px solid transparent; border-top: 5px solid var(--encre); }
  .w3b-cb.ok { border-left-color: var(--t); } .w3b-cb.ok::after { border-top-color: var(--t); }
  .w3b-dot { position: absolute; top: 5px; width: 6px; height: 6px; margin-left: -3px; border-radius: 50%; background: var(--encre); box-shadow: 0 0 0 1px #fff; z-index: 6; pointer-events: none; }
  .w3b-dot.hors { background: var(--acc); }
  .w3b-res { display: flex; align-items: center; gap: 6px; height: 22px; color: var(--gris); }
  .w3b-res .w-rn { color: var(--gris); }
  .w3b-hh { font-size: 12px; }
  .w3b-loupe { position: absolute; z-index: 20; width: 168px; margin-left: -84px; height: 64px; border-radius: 8px; background: #fff; box-shadow: 0 2px 4px rgba(22,22,26,.1), 0 10px 26px -10px rgba(22,22,26,.6); display: flex; flex-direction: column; align-items: center; overflow: hidden; pointer-events: none; }
  .w3b-loupe b { font: 700 16px/1.2 var(--sans); padding-top: 4px; white-space: nowrap; }
  .w3b-loupe-r { position: relative; width: 168px; height: 32px; }
  .w3b-loupe-r i { position: absolute; top: 2px; width: 2px; height: 10px; margin-left: -1px; background: #8a909b; }
  .w3b-loupe-r i.c { height: 14px; background: #16161a; }
  .w3b-loupe-r i.ici { top: 0; height: 18px; width: 3px; background: var(--acc); }
  .w3b-loupe-r i.zone { top: 14px; height: 3px; width: auto; margin: 0; background: rgba(217,180,20,.35); }
  .w3b-loupe-r span { position: absolute; top: 18px; transform: translateX(-50%); font: 500 12px/1 var(--mono); color: var(--gris); }
  .w3b-tir { font-size: 12px; display: flex; flex-wrap: wrap; gap: 4px 10px; align-items: center; }
  .w3b-tir b { font: 600 12px var(--mono); }
  .w3b-plans { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .w3b-pl { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; text-align: left; padding: 6px 7px 7px; border-radius: 8px; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.13), inset 0 3px 0 var(--pl); min-width: 0; }
  .w3b-pl[aria-checked="true"] { box-shadow: inset 0 0 0 2px var(--pl), 0 2px 8px rgba(0,0,0,.16); }
  .w3b-pl b.n { font-size: 14px; color: var(--pl); display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
  .w3b-pl .w3b-mk { background: var(--pl); }
  .w3b-sl { font-size: 12px; font-weight: 600; }
  .w3b-hp { font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; gap: 3px; }
  .w3b-hp::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: var(--hc); }
  .w3b-pl .r { font-size: 13px; display: flex; flex-wrap: wrap; gap: 0 4px; align-items: center; }
  .w3b-pl .r .hn { font-size: 13px; }
  .w3b-pl .r .mono { font-size: 12px; font-weight: 600; }
  .w3b-pl .v { font-size: 12px; font-weight: 700; } .w3b-pl .v.tient { color: #2f6b4f; } .w3b-pl .v.sort { color: var(--acc); } .w3b-pl .v.non, .w3b-pl .v.presque { color: var(--gris); }
  .w3b-act { display: flex; gap: 8px; }
  .w3b-oeil { display: flex; flex-direction: column; gap: 3px; }
  .w3b-h3 { font-size: 14px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .w3b-ol { display: flex; gap: 8px; flex-wrap: wrap; font-size: 12px; color: var(--gris); }
  .w3b-ol span { display: inline-flex; align-items: center; gap: 3px; }
  .w3b-mk { width: 16px; height: 16px; border-radius: 50%; background: var(--pl); color: #fff; font: 700 12px/16px var(--sans); text-align: center; font-style: normal; display: inline-block; }
  .w3b-or { display: grid; grid-template-columns: 16px 64px 1fr; align-items: center; gap: 6px; height: 24px; }
  .w3b-on { font-size: 12px; font-weight: 600; }
  .w3b-ot { position: relative; height: 20px; width: 220px; }
  .w3b-ot::before { content: ''; position: absolute; left: 0; right: 0; top: 9px; height: 2px; background: #ececf1; }
  .w3b-oz { position: absolute; left: 0; top: 3px; height: 14px; border-right: 1.5px solid var(--t); }
  .w3b-om { position: absolute; top: 2px; width: 16px; height: 16px; margin-left: -8px; border-radius: 50%; background: var(--pl); color: #fff; font: 700 12px/16px var(--sans); text-align: center; box-shadow: 0 0 0 1.5px #fff; transition: left .25s; }
  .w3b-om.hors { box-shadow: 0 0 0 2px var(--acc); }
  .w3b-oc { position: absolute; top: -2px; bottom: -2px; border-left: 2px solid var(--encre); }
  .w3b-proches { display: flex; flex-direction: column; gap: 4px; }
  .w3b-a { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 2px 8px; padding: 6px 10px; border-radius: 8px; background: #f6f6f9; text-align: left; font-size: 14px; width: 100%; }
  .w3b-a[aria-checked="true"] { background: #fff; box-shadow: inset 0 0 0 2px var(--encre); }
  .w3b-a .r { display: flex; flex-wrap: wrap; gap: 2px 6px; align-items: center; }
  .w3b-a .e { font: 600 12px var(--mono); white-space: nowrap; }
  .w3b-n { font-size: 12px; color: var(--gris); }
  .w3b-pied { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 12px; color: var(--gris); }
  .w3b-mur { border-collapse: collapse; font-size: 12px; width: 100%; }
  .w3b-mur th, .w3b-mur td { border: 1px solid var(--trait); padding: 3px 4px; vertical-align: top; text-align: left; }
  .w3b-mur thead th { font-weight: 600; } .w3b-mur thead th .pi { display: inline-block; vertical-align: -3px; margin-right: 2px; }
  .w3b-mur tbody th .hn { font-size: 12px; }
  .w3b-mur td b { font-size: 12px; font-weight: 600; } .w3b-mur td i { display: block; font-style: normal; color: var(--acc); font-weight: 600; }
  .w3b-mur td.trou { color: var(--gris); background: repeating-linear-gradient(135deg, #fff 0 3px, #ececf1 3px 5px); } .w3b-mur td.trou .w-hach { display: none; }
  .w3b-juste { list-style: none; display: flex; flex-direction: column; gap: 6px; font-size: 13px; }
  .w3b-juste li { display: flex; flex-wrap: wrap; gap: 2px 6px; align-items: center; }
  .w3b-jv { font-size: 12px; font-weight: 700; padding: 0 6px; border-radius: 999px; } .w3b-jv.ok { background: #e6f2ea; color: #2f6b4f; } .w3b-jv.ko { box-shadow: inset 0 0 0 1.5px var(--acc); color: var(--acc); }
  .w3b-js { display: inline-flex; gap: 4px; align-items: center; color: var(--gris); font-size: 12px; }
  .w3b-k { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; color: #2f6b4f; font-weight: 700; }
  .w3b-li { width: 14px; height: 3px; display: inline-block; vertical-align: middle; } .w3b-li.tir { height: 2px; }
  .w3b-defi { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .w3b-d { display: flex; flex-direction: column; gap: 3px; padding: 8px; border-radius: 8px; background: #f6f6f9; font-size: 13px; }
  .w3b-d b { font-size: 14px; display: inline-flex; align-items: center; gap: 4px; } .w3b-d .s { font-size: 12px; font-weight: 700; }
  .w3b-d.ok .s { color: #2f6b4f; } .w3b-d.ko .s { color: var(--acc); } .w3b-d.hh .s { color: var(--gris); }
`;

const js = `${JS_DEPLIER}
const G = ${JSON.stringify(GESTES)}.map((g, i) => ({ ...g, i, P: deplier(g.p) }));
const AV = SIM.AV, LPX = ${LPX}, LW = ${LW};
const MOMENT = ${JSON.stringify(MOMENT)};
const IBU = ${JSON.stringify(IBU)}, IBU0 = ${JSON.stringify(IBU0)};
const HOPS = ${JSON.stringify(Object.fromEntries(D.VALEURS.houblons.map((h) => [h, { nom: S.nomH(h), alpha: S.alpha(h), alphaP: S.alpha(h, { plage: true }), usage: S.usage(h), stock: HOP[h].stock }])))};
const hn = (h) => '<b class="w3b-hp" style="--hc:' + HC[h] + '">' + h + '</b>';
const ha = (h, p) => '<span class="w-hop">' + HOPS[h].nom + (p ? HOPS[h].alphaP : HOPS[h].alpha) + '</span>';
const HC = ${JSON.stringify(Object.fromEntries(D.VALEURS.houblons.map((h) => [h, HOP[h].couleur])))};
const PL = { sage: ['Sage', '#2f6b4f'], franc: ['Franc', '#16161a'], ose: ['Osé', '#6a2c91'] };
const $ = (s) => document.querySelector(s);
const ST = { cible: { floral: 1 }, m: 'dryActive', l: 'US-05', a: 'seul', pin: {}, plan: 'franc', choix: null, ouvert: null, tirs: [], cleTir: '' };
const q = new URLSearchParams(location.search);
if (q.get('cible')) { ST.cible = {}; for (const x of q.get('cible').split(',')) { const [f, v] = x.split(':'); ST.cible[f] = Number(v); } }
for (const k of ['m', 'l', 'a', 'plan']) if (q.get(k)) ST[k] = q.get(k);
const sortDe = (P) => ORD.filter((f) => !P[f].inconnu && P[f].centre > SIM.B[f][1] && AV[f].centre <= SIM.B[f][1]);
const mOK = (g) => (ST.m === 'chaud' ? ['b60', 'b10', 'wp'].includes(g.m) : g.m === ST.m);
const pinOK = (g) => Object.entries(ST.pin).every(([k, v]) => (k === 'h2' ? g.h2 === v : String(g[k]) === String(v)));
function ecart(g) { let e = 0; for (const [f, v] of Object.entries(ST.cible)) { const c = g.P[f].inconnu ? 0 : g.P[f].crans; e += c < v ? v - c : (c - v) * 0.5; } return e + (g.d + (g.d2 || (g.a === 'ensemble' ? 2 : 0))) * 0.03; }
const manque = (g) => Object.entries(ST.cible).reduce((s, [f, v]) => s + Math.max(0, v - (g.P[f].inconnu ? 0 : g.P[f].crans)), 0);
const dose = (g) => g.d + (g.d2 || (g.a === 'ensemble' ? 2 : 0));
function plans() {
  const base = G.filter((g) => mOK(g) && g.l === ST.l && pinOK(g));
  const contr = base.filter((g) => g.a === ST.a && dose(g) <= 4 && !sortDe(g.P).length).map((g) => ({ g, e: ecart(g) })).sort((x, y) => x.e - y.e);
  const libre = base.filter((g) => ST.a === 'seul' || g.a === ST.a).map((g) => ({ g, e: ecart(g) })).sort((x, y) => x.e - y.e);
  const franc = contr[0] || null;
  const sage = franc ? contr.filter((x) => x.e <= franc.e + 0.4).sort((x, y) => dose(x.g) - dose(y.g) || x.e - y.e)[0] : null;
  const ose = libre[0] || null;
  const proches = []; const vu = new Set(); for (const x of contr) { const k = [x.g.h, x.g.h2].sort().join('+'); if (vu.has(k)) continue; vu.add(k); proches.push(x); if (proches.length >= 5) break; }
  return { sage, franc, ose, proches, rien: !base.length };
}
const momHtml = (m, z) => '<span class="w-mo" data-role="moment" data-moment="' + m + '" aria-label="Moment : ' + MOMENT[m].lg + '">' + ICO(MOMENT[m].ic, z || 14) + '<span>' + MOMENT[m].t + '</span></span>';
const fr1 = (x) => String(Math.round(x * 10) / 10).replace('.', ',');
function verdictDe(g) {
  if (!g) return { k: 'inc', t: 'on ne sait pas' };
  if (Object.keys(ST.cible).some((f) => g.P[f].inconnu)) return { k: 'inc', t: 'on ne sait pas' };
  const s = manque(g);
  return s <= 0.25 ? { k: 'tient', t: 'ça tient' } : s <= 0.75 ? { k: 'presque', t: 'presque' } : { k: 'non', t: 'ne marchera pas' };
}
// la phrase-recette du geste : les mots fixés par toi (moment, levure, assemblage) et ceux que la page cherche
function phrase(g) {
  const tok = (k, inner, fixe) => '<button type="button" class="w3b-tok' + (fixe ? ' fixe' : '') + '" data-tok="' + k + '" aria-expanded="' + (ST.ouvert === k) + '" aria-label="Changer : ' + k + '">' + inner + ICO('chevb', 12) + '</button>';
  const dry = g.m.startsWith('dry');
  const seul = g.a === 'seul', dz = '<b class="mono">' + (g.a === 'ensemble' ? '2 + 2' : String(g.d).replace('.', ',')) + ' g/L</b>', jz = '<b class="mono">' + g.j + ' j</b>';
  let h = '<span class="w3b-m">Mets</span>' + tok('h', HOPS[g.h].nom, 'h' in ST.pin) + (seul ? tok('d', dz, 'd' in ST.pin) : '<span class="w3b-mot">' + dz + '</span>') + '<span class="w3b-mot">' + momHtml(g.m, 14) + '</span>';
  if (dry) h += seul ? tok('j', jz, 'j' in ST.pin) : '<span class="w3b-mot">' + jz + '</span>';
  if (g.a === 'ensemble') h += '<span class="w3b-mot">+</span>' + tok('h2', HOPS[g.h2].nom, 'h2' in ST.pin) + '<span class="w3b-mot">ensemble</span>';
  else if (g.a === 'puis') h += '<span class="w3b-mot">puis</span>' + '<span class="w3b-mot">' + HOPS[g.h2].nom + '</span><b class="mono">' + g.d2 + ' g/L ' + g.j2 + ' j</b>';
  else h += '<span class="w3b-mot">seul</span>';
  return h + '<span class="w3b-m">avec</span><span class="w3b-mot">' + g.l + '</span>';
}
// si tu t'en écartes : le même geste, un mot changé, et ce qu'il donne sur ta cible
function ecarts(g, k) {
  const f0 = Object.keys(ST.cible)[0] || 'floral';
  const variante = (o) => G.find((x) => x.a === g.a && x.h === (o.h || g.h) && x.h2 === (o.h2 !== undefined ? o.h2 : g.h2) && x.d === (o.d || g.d) && x.m === g.m && x.j === (o.j || g.j) && x.l === g.l);
  const vals = { h: Object.keys(HOPS).filter((x) => x !== g.h2), d: [1, 2, 4, 8], j: [1, 2, 3, 5, 7], h2: Object.keys(HOPS).filter((x) => x !== g.h) }[k];
  const lab = { h: (v) => v, d: (v) => v + ' g/L', j: (v) => v + ' j', h2: (v) => '+ ' + v }[k];
  const cells = vals.map((v) => { const x = variante({ [k]: v }); if (!x) return ''; const vd = sortDe(x.P).length ? 'sort' : verdictDe(x).k; const c = x.P[f0].inconnu ? null : x.P[f0].crans;
    return '<button type="button" class="w3b-c ' + vd + '" data-role="reglage" data-reglage="ecart-' + k + '" data-v="' + v + '" aria-checked="' + (String(g[k]) === String(v)) + '"><b data-nature="simule">~ ' + (c == null ? '?' : fr1(c)) + '</b><span>' + lab(v) + '</span><span class="vv">' + (vd === 'sort' ? 'sort' : vd === 'tient' ? 'tient' : vd === 'presque' ? 'presque' : 'loin') + '</span></button>'; }).join('');
  return '<div class="w3b-ec-t">' + ICO('reglages', 12) + '<span>si tu t’en écartes · ~ crans de ' + MOTS_F[f0] + '</span>' + (Object.keys(ST.pin).length ? '<button type="button" data-libere="1">tout libérer</button>' : '') + '</div><div class="w3b-cs">' + cells + '</div>';
}
function geste() { const P = plans(); ST._p = P; if (ST.choix != null) return G[ST.choix]; const x = P[ST.plan]; return x ? x.g : null; }
function rendre() {
  const P = plans(), g = geste(), msg = $('#msg');
  for (const k of ['moment', 'levure', 'ajout-cumule']) { const v = { moment: ST.m, levure: ST.l, 'ajout-cumule': ST.a }[k]; document.querySelectorAll('#rep [data-reglage="' + k + '"][role="radio"]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.v === v))); }
  if (!g) {
    msg.hidden = false;
    const pour = ST.l === 'Verdant' ? 'Verdant n’est simulée qu’à deux houblons' : ST.l === 'Diamond' ? 'Diamond n’est simulée que pour Citra puis Idaho 7' : 'aucun geste simulé avec ces mots';
    msg.innerHTML = '<span class="w3b-vd inc">on ne sait pas</span><span>' + pour + '</span>' + (ST.l === 'Verdant' && ST.a !== 'ensemble' ? '<button type="button" data-aller="a:ensemble">passer à ensemble</button>' : ST.l === 'Diamond' && ST.a !== 'puis' ? '<button type="button" data-aller="a:puis">passer à puis</button>' : '<button type="button" data-libere="1">tout libérer</button>');
    $('#phrase').innerHTML = ''; $('#al').innerHTML = ''; $('#vd').innerHTML = ''; $('#cib').innerHTML = ''; $('#plans').innerHTML = ''; $('#oeil').innerHTML = ''; $('#proches').innerHTML = '';
    return;
  }
  msg.hidden = true;
  const vd = verdictDe(g), sort = sortDe(g.P);
  $('#vd').className = 'w3b-vd ' + (vd.k === 'tient' && sort.length ? 'sort' : vd.k);
  $('#vd').innerHTML = ICO(vd.k === 'tient' ? 'ok' : vd.k === 'non' ? 'refus' : vd.k === 'inc' ? 'aide2' : 'cible', 14) + '~ ' + vd.t + (sort.length ? ', sort de ta 16D' : '');
  $('#cib').innerHTML = Object.entries(ST.cible).map(([f, v]) => { const c = g.P[f].inconnu ? null : g.P[f].crans; return '<span>' + PIC(f, 14) + MOTS_F[f] + ' <b>~ ' + (c == null ? '?' : fr1(c)) + '</b>pour<b>' + fr1(v) + ' cran' + (v >= 2 ? 's' : '') + '</b></span>'; }).join('') || '<span>touche une piste</span>';
  $('#phrase').innerHTML = phrase(g);
  const pq = $('#pq'), O = P.ose && P.ose.g, oFait = O && O !== g && manque(O) < manque(g) - 0.2;
  pq.hidden = vd.k === 'tient' || ST.choix != null || ST.plan === 'ose';
  if (!pq.hidden) pq.innerHTML = (vd.k === 'inc' ? '<span>pas de composé relié pour cette famille : rien de simulé</span>' : '<span>le plus proche dans ta 16D, à 4 g/L au plus</span>') + (oFait ? '<button type="button" data-role="reglage" data-reglage="plan" data-v="ose">fais plutôt : Osé, ~ ' + Object.keys(ST.cible).map((f) => fr1(O.P[f].crans)).join(', ') + (sortDe(O.P).length ? ', sort de ta 16D' : '') + '</button>' : '');
  const n = dose(g) * 20;
  $('#al').innerHTML = '<span class="w-hop">' + HOPS[g.h].nom + HOPS[g.h].alphaP + HOPS[g.h].usage + stockIc(g.h, g.a === 'ensemble' ? 40 : g.d * 20) + '</span>' + (g.h2 ? '<span class="w-hop">' + HOPS[g.h2].nom + HOPS[g.h2].alpha + HOPS[g.h2].usage + stockIc(g.h2, (g.d2 || 2) * 20) + '</span>' : '') + '<span class="w3b-n"><b class="mono" data-nature="mesure" data-source="dose × 20 L">' + n + ' g</b> pour 20 L</span>';
  $('#bio').innerHTML = ICO('bio', 14) + (g.m !== 'dryActive' ? '<span class="w-inc"><i class="w-hach"></i>biotransformation ' + (g.m.startsWith('dry') ? 'au repos' : 'à chaud : aucune') + '</span>' : g.l === 'Pomona' ? '<span>géraniol</span>' + PIC('floral', 14) + ICO('fleche', 12) + PIC('citrus', 14) + '<span>citronellol ~ 50 %</span>' : g.l === 'Verdant' || g.l === 'Diamond' ? '<span>thiols libérés ~ 0,1 %</span>' + PIC('tropical', 14) : '<span class="w-inc"><i class="w-hach"></i>biotransformation non publiée</span>');
  const e = $('#ecart'); e.hidden = !ST.ouvert || !g; if (ST.ouvert && g) e.innerHTML = ecarts(g, ST.ouvert);
  majProfil($('#prof'), g.P, AV);
  $('#prof').querySelectorAll('.w-row').forEach((r) => {
    const f = r.dataset.famille, v = ST.cible[f]; r.classList.toggle('vise', v != null);
    r.setAttribute('data-role', 'reglage'); r.setAttribute('data-reglage', 'cible'); r.setAttribute('tabindex', '0'); r.setAttribute('aria-label', NOMS[f] + (v != null ? ', cible ' + fr1(v) + ' cran' : '') + ' : glisse pour viser');
    let m = r.querySelector('.w3b-cb'); if (v == null) { if (m) m.remove(); return; }
    if (!m) { m = document.createElement('i'); m.className = 'w3b-cb'; r.querySelector('.w-z').append(m); }
    m.style.left = (Math.min(5, v) * LPX) + 'px'; m.classList.toggle('ok', !g.P[f].inconnu && g.P[f].crans >= v - 0.25);
  });
  document.querySelector('.w3b-rep').style.setProperty('--pl', PL[ST.choix != null ? 'franc' : ST.plan][1]);
  // trois façons d'y aller
  $('#plans').innerHTML = ['sage', 'franc', 'ose'].map((k) => { const x = P[k]; if (!x) return '<div class="w3b-pl" style="--pl:' + PL[k][1] + '"><b class="n">' + PL[k][0] + '</b><span class="w3b-n">aucun</span></div>'; const y = x.g, v2 = sortDe(y.P).length ? { k: 'sort', t: 'sort' } : verdictDe(y);
    return '<button type="button" class="w3b-pl" data-role="reglage" data-reglage="plan" data-v="' + k + '" aria-checked="' + (ST.choix == null && ST.plan === k) + '" style="--pl:' + PL[k][1] + '"><b class="n"><i class="w3b-mk">' + PL[k][0][0] + '</i>' + PL[k][0] + (k === 'ose' ? '<span class="w3b-sl">sans limite</span>' : '') + '</b><span class="r">' + hn(y.h) + (y.h2 ? '<span>' + (y.a === 'puis' ? 'puis' : '+') + '</span>' + hn(y.h2) : '') + '</span><span class="r"><span class="mono">' + dose(y) + ' g/L</span>' + (ST.m === 'chaud' || !mOK(y) ? MOMENT[y.m].t : '') + '<span class="v ' + v2.k + '" data-nature="simule">~ ' + v2.t + '</span></span></button>'; }).join('');
  // le coup d'œil : les trois sur une même piste, familles visées et familles qui sortent
  const fams = ORD.filter((f) => f !== 'resin' && (ST.cible[f] != null || ['sage', 'franc', 'ose'].some((k) => P[k] && sortDe(P[k].g.P).includes(f)))).slice(0, 6);
  const W = 220, px = W / 5;
  $('#oeil').innerHTML = fams.length ? '<h3 class="w3b-h3"><span class="w-cf simule">~ simulé</span>Sur la même piste</h3>' + fams.map((f) => '<div class="w3b-or">' + PIC(f, 16) + '<span class="w3b-on" style="color:' + SIM.T[f] + '">' + SIM.COURT[f] + '</span><span class="w3b-ot"><i class="w3b-oz" style="width:' + 3 * px + 'px;background:' + SIM.Z[f] + ';--t:' + SIM.T[f] + '"></i>' + (ST.cible[f] != null ? '<i class="w3b-oc" style="left:' + Math.min(5, ST.cible[f]) * px + 'px"></i>' : '') + ['sage', 'franc', 'ose'].map((k, i) => { const x = P[k]; if (!x) return ''; const c = x.g.P[f].crans, h = sortDe(x.g.P).includes(f); return '<i class="w3b-om' + (h ? ' hors' : '') + '" data-nature="simule" style="left:' + (Math.min(5, Math.max(0, c)) * px + (i - 1) * 4) + 'px;--pl:' + PL[k][1] + '" aria-label="' + PL[k][0] + ' ~ ' + fr1(c) + ' crans">' + PL[k][0][0] + '</i>'; }).join('') + '</span></div>').join('') : '';
  // les plus proches ensuite
  $('#proches').innerHTML = P.proches.map((x) => '<button type="button" class="w3b-a" data-role="reglage" data-reglage="choix" data-v="' + x.g.i + '" aria-checked="' + (g === x.g) + '"><span class="r">' + ha(x.g.h) + (x.g.h2 ? '<span>+</span>' + ha(x.g.h2) : '') + '<span class="mono">' + dose(x.g) + ' g/L</span>' + momHtml(x.g.m) + (x.g.j ? '<span class="mono">' + x.g.j + ' j</span>' : '') + '</span><span class="e" data-nature="simule">~ écart ' + fr1(x.e) + '</span></button>').join('');
  // tire une bière : les tirages restent tant que rien ne change
  const cle = [g.i, Object.entries(ST.cible).join()].join('|'); if (cle !== ST.cleTir) { ST.cleTir = cle; ST.tirs = []; }
  dessinerTirs(g);
  defi(g);
}
function stockIc(h, grammes) { const s = HOPS[h].stock; return '<span class="w-stk" role="img" aria-label="' + (s >= grammes ? 'en stock : ' + s + ' g' : 'à acheter') + '">' + ICO(s >= grammes ? 'stock' : 'achat', 14) + '</span>'; }
// ---------- « Tire une bière » : une bière possible dans la plage du moteur (tirage triangulaire autour du centre) ----------
function rng(s) { return () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hash = (t) => { let h = 2166136261; for (const c of t) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
function tirer(g) {
  const r = rng(hash(ST.cleTir + '#' + ST.tirs.length)), b = {};
  for (const f of ORD) { const v = g.P[f]; if (v.inconnu || f === 'resin') continue; const lo = v.bas, hi = Math.min(100, v.haut), c = v.centre, u = r();
    const F = hi > lo ? (c - lo) / (hi - lo) : 0.5; b[f] = hi > lo ? (u < F ? lo + Math.sqrt(u * (hi - lo) * (c - lo)) : hi - Math.sqrt((1 - u) * (hi - lo) * (hi - c))) : c; }
  ST.tirs.push(b);
}
function dessinerTirs(g) {
  document.querySelectorAll('.w3b-dot').forEach((x) => x.remove());
  const t = $('#tir'); t.hidden = !ST.tirs.length; if (!ST.tirs.length) return;
  const hors = {};
  for (const b of ST.tirs) for (const [f, v] of Object.entries(b)) { const r = document.querySelector('#prof [data-famille="' + f + '"] .w-z'); if (!r) continue; const k = (v - SIM.B[f][0]) / SIM.C[f], abs = document.body.classList.contains('abs');
    const x = abs ? Math.min(100, v) / 100 * LW : Math.min(5, Math.max(0, k)) * LPX, h = v > SIM.B[f][1] && AV[f].centre <= SIM.B[f][1]; if (h) hors[f] = (hors[f] || 0) + 1;
    const d = document.createElement('i'); d.className = 'w3b-dot' + (h ? ' hors' : ''); d.style.left = x + 'px'; r.append(d); }
  const hs = Object.entries(hors).sort((a, b) => b[1] - a[1]).slice(0, 3);
  t.innerHTML = '<span>' + ICO('melange', 12) + '<b>' + ST.tirs.length + '</b> bière' + (ST.tirs.length > 1 ? 's' : '') + ' tirée' + (ST.tirs.length > 1 ? 's' : '') + ' dans la plage ~ simulée</span>' + (hs.length ? '<span>hors de ta 16D : ' + hs.map(([f, n]) => MOTS_F[f] + ' <b>' + n + '</b> sur <b>' + ST.tirs.length + '</b>').join(', ') + '</span>' : '<span>aucune ne sort de ta 16D</span>') + '<span class="w3b-n">l’étendue du possible, pas une probabilité mesurée</span>';
}
// ---------- ton défi : ta dégustation du 18.10, en quatre cartes ----------
function defi(g) {
  const dfl = g.P.floral.crans - AV.floral.crans, dre = g.P.resin.centre - AV.resin.centre, sort = sortDe(g.P);
  const chaud = !g.m.startsWith('dry') && g.a === 'seul', ib = chaud ? (IBU[g.h + '|' + g.m + '|' + g.d] || 0) : 0, tot = Math.round(IBU0.v + ib);
  const carte = (k, titre, s, detail) => '<div class="w3b-d ' + k + '"><b>' + titre + '</b><span class="s" data-nature="simule">' + s + '</span><span>' + detail + '</span></div>';
  const t = document.querySelector('template[data-d="defi"]');
  t.innerHTML = '<div class="w-f-t"><b>Ton défi : ta dégustation du 18.10</b><button type="button" data-role="fermer-detail" aria-label="Fermer">' + ICO('x', 18) + '</button></div><div class="w-f-c"><p class="w3b-n">« ma stout est trop résineuse, je la veux plus floral » · pour : ' + g.h + (g.h2 ? (g.a === 'puis' ? ' puis ' : ' + ') + g.h2 : '') + ' ' + dose(g) + ' g/L ' + MOMENT[g.m].t + ', ' + g.l + '</p><div class="w3b-defi">'
    + carte(dfl >= 1 ? 'ok' : 'ko', PIC('floral', 16) + 'plus floral', dfl >= 1 ? 'atteint' : 'pas encore', '~ ' + (dfl >= 0 ? '+' : '') + fr1(dfl) + ' cran')
    + carte('hh', PIC('resin', 16) + 'moins résineux', 'hors houblon', '~ +' + Math.round(dre) + ' points : le houblon en ajoute')
    + carte(tot > 70 ? 'ko' : 'ok', ICO('goutte', 16) + 'amertume 50–70', tot > 70 ? 'trop amer' : 'tenue', '<span data-nature="mesure" data-source="' + IBU0.src + '">' + tot + ' IBU</span> (calcul' + (ib ? ', ajout à chaud mis à l’échelle' : '') + ')')
    + carte(sort.length ? 'ko' : 'ok', ICO('cible', 16) + 'dans ta 16D', sort.length ? sort.length + ' sort' + (sort.length > 1 ? 'ent' : '') : 'tenue', sort.length ? sort.map((f) => MOTS_F[f]).join(', ') : 'aucune famille ne sort')
    + '</div></div>';
}
// ---------- le geste : glisser la cible sur une piste, la loupe du demi-cran au-dessus du doigt ----------
const NOMS = SIM.NOM;
let TIRE = null;
function poser(r, e, glisse) {
  const z = r.querySelector('.w-z').getBoundingClientRect(), f = r.dataset.famille;
  const v = Math.max(0.5, Math.min(5, Math.round(((e.clientX - z.left) / LPX) * 2) / 2));
  const avant = ST.cible[f];
  if (avant !== v) { ST.cible[f] = v; ST.choix = null; rendre(); }
  if (glisse) loupe(r, v, e.clientX - r.parentElement.getBoundingClientRect().left);
}
function loupe(r, v, x) {
  const L = $('#loupe'), f = r.dataset.famille, Z = 3, W = 168, box = r.parentElement.getBoundingClientRect(), rr = r.getBoundingClientRect();
  L.hidden = false; L.style.left = Math.max(84, Math.min(box.width - 84, x)) + 'px'; L.style.top = (rr.top - box.top - 70) + 'px';
  $('#loupe-t').textContent = SIM.COURT[f] + ' · cible ' + fr1(v) + ' cran' + (v >= 2 ? 's' : '');
  let h = '<i class="zone" style="left:' + (W / 2 - v * LPX * Z) + 'px;width:' + 3 * LPX * Z + 'px"></i>';
  for (let k = 0; k <= 10; k++) { const c = k / 2, xx = W / 2 + (c - v) * LPX * Z; if (xx < -4 || xx > W + 4) continue; h += '<i class="' + (c === v ? 'ici' : Number.isInteger(c) ? 'c' : '') + '" style="left:' + xx.toFixed(1) + 'px"></i>' + (Number.isInteger(c) && c !== v ? '<span style="left:' + xx.toFixed(1) + 'px">' + c + '</span>' : ''); }
  $('#loupe-r').innerHTML = h;
}
$('#prof').addEventListener('pointerdown', (e) => {
  const r = e.target.closest('.w-row'); if (!r || (e.pointerType === 'mouse' && e.button !== 0)) return;
  TIRE = { id: e.pointerId, r, x0: e.clientX, bouge: false }; r.setPointerCapture(e.pointerId); e.preventDefault();
});
$('#prof').addEventListener('pointermove', (e) => { if (!TIRE || TIRE.id !== e.pointerId) return; if (Math.abs(e.clientX - TIRE.x0) > 4) TIRE.bouge = true; if (TIRE.bouge) poser(TIRE.r, e, true); });
const lacher = (e) => {
  if (!TIRE || TIRE.id !== e.pointerId) return; const t = TIRE; TIRE = null; $('#loupe').hidden = true;
  if (!t.bouge) { const f = t.r.dataset.famille, z = t.r.querySelector('.w-z').getBoundingClientRect(); if (e.clientX < z.left && ST.cible[f] != null) { delete ST.cible[f]; ST.choix = null; rendre(); } else poser(t.r, e, false); }
};
$('#prof').addEventListener('pointerup', lacher); $('#prof').addEventListener('pointercancel', lacher);
$('#prof').addEventListener('keydown', (e) => { const r = e.target.closest('.w-row'); if (!r || !['ArrowRight', 'ArrowLeft', 'Delete', 'Backspace'].includes(e.key)) return; const f = r.dataset.famille; if (e.key === 'Delete' || e.key === 'Backspace') delete ST.cible[f]; else ST.cible[f] = Math.max(0.5, Math.min(5, (ST.cible[f] || 0) + (e.key === 'ArrowRight' ? 0.5 : -0.5))); ST.choix = null; rendre(); e.preventDefault(); });
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-tok]'); if (t) { const k = t.dataset.tok; ST.ouvert = ST.ouvert === k ? null : k; rendre(); return; }
  const lib = e.target.closest('[data-libere]'); if (lib) { ST.pin = {}; ST.choix = null; rendre(); return; }
  const al = e.target.closest('[data-aller]'); if (al) { const [k, v] = al.dataset.aller.split(':'); ST[k] = v; ST.pin = {}; ST.choix = null; rendre(); return; }
  const b = e.target.closest('button[data-role="reglage"]'); if (!b) return;
  const k = b.dataset.reglage, v = b.dataset.v;
  if (k === 'moment') { ST.m = v; ST.choix = null; delete ST.pin.j; }
  else if (k === 'levure') { ST.l = v; ST.choix = null; }
  else if (k === 'ajout-cumule') { ST.a = v; ST.pin = {}; ST.choix = null; ST.ouvert = null; }
  else if (k === 'plan') { ST.plan = v; ST.choix = null; }
  else if (k === 'choix') ST.choix = Number(v);
  else if (k === 'tirage') { const g = geste(); if (g) tirer(g); dessinerTirs(g); return; }
  else if (k.startsWith('ecart-')) { const w = k.slice(6); ST.pin[w] = ['d', 'j'].includes(w) ? Number(v) : v; ST.choix = null; }
  rendre();
});
document.addEventListener('detail', () => {});
// ce que la page affiche, pour la preuve du geste (jouer-w3b.mjs)
window.__releve = () => { const g = geste(); const P = ST._p || plans(); return {
  cible: { ...ST.cible }, reglages: { moment: ST.m, levure: ST.l, assemblage: ST.a, plan: ST.choix != null ? 'choix' : ST.plan },
  verdict: $('#vd').textContent, phrase: $('#phrase').innerText.replace(/\\s+/g, ' ').trim(), cibleTexte: $('#cib').innerText.replace(/\\s+/g, ' ').trim(),
  crans: g ? Object.fromEntries(ORD.map((f) => [f, g.P[f].inconnu ? 'inconnu' : fr1(g.P[f].crans)])) : null,
  largeurs: Object.fromEntries([...document.querySelectorAll('#prof .w-row')].map((r) => [r.dataset.famille, Math.round(r.querySelector('.w-b').getBoundingClientRect().width + r.querySelector('.w-x').getBoundingClientRect().width)])),
  plans: Object.fromEntries(['sage', 'franc', 'ose'].map((k) => [k, P[k] ? [P[k].g.h, P[k].g.h2, dose(P[k].g) + ' g/L', MOMENT[P[k].g.m].t, P[k].g.l].filter(Boolean).join(' ') : null])),
  tirages: ST.tirs.length, tirTexte: $('#tir').hidden ? '' : $('#tir').innerText.replace(/\\s+/g, ' ').trim(),
  ibu: Math.round(IBU0.v) }; };
rendre();
if (qd === 'defi') ouvrirDetail(qd);
`;

const tplDefi = '<template data-d="defi"></template>';
ecrire(path.join(ICI, 'etat.html'), page({
  titre: 'w3b · Dessine ta bière',
  commentaire: 'Lot 21 · w3b : glisse ta cible (loupe du demi-cran) ; la page répond en une phrase de recette ; sage / franc / osé sur la même piste ; défi, tirage, preuve à un toucher ; profil ~ simulé (' + STUB_MOT + ', 4,75 % vol.).',
  corps, css, js, feuilles: PREUVE + tplDefi, demande: [{ f: 'floral', s: 1 }],
  sim: { T: Object.fromEntries(ORDRE.map((f) => [f, JET[f].texte])), Z: Object.fromEntries(ORDRE.map((f) => [f, S.rgba(JET[f].base, 0.2)])), COURT },
}));
