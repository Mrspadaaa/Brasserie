// Lot 21 · v2 · « Pourquoi 10′, pas 60′ ? » (K1 : Citra contre Cascade, à 60′, 10′, whirlpool, dry hop actif,
// dry hop après). Le parti : le chemin du houblon. Une matrice moments × familles où chaque case est un verre
// rempli de la VRAIE part retrouvée en bière (H §8.2, H13, H30…), hachurée là où la borne basse n'est pas
// chiffrée, « inconnu » là où rien n'est mesuré ; en dessous, le verre de l'amertume (Tinseth, comme le moteur)
// face à la zone IBU de la 16D. Un toucher sur un moment : pourquoi, en une phrase sourcée, et le profil
// simulé de Citra et Cascade à ce moment ; en dry hop, la levure, la biotransformation et l'ajout cumulé.
// Usage : node generer.mjs  →  v2/etat.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JET, CH, C1, MOTEUR, HOPS, STY, PS, LEV, SIMU, grilleDe, pairesDe, casSim, COURT, SRC, srcNom, fr, esc, M, conf, ic, pic, pics, hn, alpha, usage, stock, point,
  barre, lentille, legende, li, LEG_FAMILLES, LEG_CONF, LEG_HOUBLON, LEG_SIM, page, ecrire, CLIENT } from '../v1/socle.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const T = MOTEUR('citra-contre-cascade');
const TX = (t) => (typeof t === 'string' && /^§\d+$/.test(t) ? T.textes[t] || t : t);
const MOMENTS = [['b60', '60′', 'ebu', 'ébullition 60′'], ['b10', '10′', 'ebu', 'ébullition 10′'], ['wp', 'whirlpool', 'whirl', 'whirlpool'], ['dryActive', 'actif', 'cuveA', 'dry hop en fermentation active'], ['dryPost', 'après', 'cuveP', 'dry hop après fermentation']];
const LIGNES = [
  ['linalol', ['floral', 'citrus'], 'Floral, agrumes', 'linalol'],
  ['4MMP', ['tropical', 'berries'], 'Tropical, cassis', '4MMP'],
  ['myrcene', ['green', 'resin'], 'Vert, résineux', 'myrcène'],
  ['geraniol', ['floral'], 'Floral, rose', 'géraniol'],
];
// La part retrouvée, par moment et par composé : le moteur (citra-contre-cascade.json, mêmes parts pour les deux houblons).
const part = (m, k) => { const r = T.table.find((x) => x.moment === m); const c = r.citra.composes[k]; const t = c.transfert; return { min: t && t.plage ? t.plage.min : null, max: t && t.plage ? t.plage.max : null, c: t && t.plage ? t.plage.central : null, src: (t && t.sources) || [], base: TX(t && t.base), inc: TX(t && t.inconnu) }; };
const pctTxt = (p) => (p.min == null && p.max == null ? 'inconnu' : p.min == null ? '≤' + fr(p.max) : p.min === p.max ? '≈' + fr(p.min) : fr(p.min) + '–' + fr(p.max));
const verre = (p, fams, k, m) => {
  const H = 40, h = (x) => Math.min(H, (x / 100) * H);
  const f = fams[0];
  let corps;
  if (p.min == null && p.max == null) corps = '<i class="v-inc"></i>';
  else if (p.min == null) corps = `<i class="v-hach" style="height:${h(p.max).toFixed(1)}px"></i>`;
  else corps = `<i class="v-plein" style="height:${h(p.min).toFixed(1)}px"></i><i class="v-plage" style="bottom:${h(p.min).toFixed(1)}px;height:${Math.max(1, h(p.max) - h(p.min)).toFixed(1)}px"></i>${p.max > 100 ? '<i class="v-deb"></i>' : ''}`;
  const nm = m === 'b60' ? '<span class="v-nm"><span class="inc" data-inconnu="arôme non mesuré à cette durée" data-source="H30 H13">inconnu</span></span>' : '';
  const lab = p.min == null && p.max == null ? `<span class="inc" data-inconnu="${esc(p.inc || 'non mesuré')}" data-source="${esc(p.src.join(' '))}">inconnu</span>` : M(pctTxt(p), p.src, 'v-t');
  return `<button type="button" class="cel" data-m="${m}" data-role="reglage" aria-label="${esc(COURT[f])}, ${m} : ${esc(pctTxt(p))} % retrouvé"><span class="verre" data-f="${f}">${corps}</span>${lab}${nm}</button>`;
};
const tete = `<div class="mx-h"><span></span>${MOMENTS.map(([m, l, icn]) => `<button type="button" class="mh" data-m="${m}" data-role="reglage" aria-label="Moment : ${esc(l)}">${ic(icn, 16)}<span>${l}</span></button>`).join('')}</div>`;
const lignes = LIGNES.map(([k, fams, nom, tag]) => `<div class="mx-l" style="--vb:${JET[fams[0]].base};--vf:${JET[fams[0]].fond}">
      <span class="mx-n">${pics(fams, 14)}<b>${esc(nom)}</b><small class="mono">${esc(tag)}</small></span>
      ${MOMENTS.map(([m]) => verre(part(m, k), fams, k, m)).join('')}
    </div>`).join('');

// ---------- l'amertume : Tinseth, comme le moteur ; la zone IBU de la 16D ----------
const og = MOTEUR('cas-citra').recette.og;
const IBU = Object.fromEntries(['Citra', 'Cascade'].map((n) => [n, Object.fromEntries(MOMENTS.map(([m]) => { const r = T.table.find((x) => x.moment === m)[n.toLowerCase()]; return [m, r.amertume.ibu ? { v: r.amertume.ibu.valeur, min: r.amertume.ibu.min, max: r.amertume.ibu.max } : null]; }))]));
const ALPHAS = { Citra: T.table[0].citra.amertume.alpha, Cascade: T.table[0].cascade.amertume.alpha };
const BASE = { ibu: C1.ibu, bande: C1.bandeIbu, src: 'fils15-s5-complexe/donnees/c1.json (Nugget 46 g à 60′)' };

// ---------- pourquoi, moment par moment : une phrase, ses chiffres et leurs sources ----------
const tr = CH.transferts, dur = CH.duree;
const POURQUOI = {
  b60: { t: 'À 60′, l’arôme part, l’amertume reste.', d: [[M('−91 %', 'H13'), 'du 4MMP en 60 min à 100 °C'], [INCm('part à 60′ non mesurée', 'H30'), 'pour le linalol : au plus celle d’un ajout tardif'], ['', TX('§5')]] },
  b10: { t: 'À 10′, une bonne part du linalol reste.', d: [[M('60–63 %', 'H30'), 'du linalol retrouvé en ajout tardif'], [INCm('non mesuré', 'H13'), 'le 4MMP à 10′'], [M('< 1 %', 'H30'), 'du myrcène']] },
  wp: { t: 'Au whirlpool, sous 100 °C, les thiols souffrent moins.', d: [[M('−23 %', 'H13'), 'du 4MMP à 90 °C (pas −91 %)'], [M('60–63 %', 'H30'), 'du linalol'], [M('< 1 %', 'H30'), 'du myrcène']] },
  dryActive: { t: 'En fermentation active, le CO₂ emporte une part, la levure transforme.', d: [[M('≈ 70 %', 'H11'), 'du 4MMP, dry hop statique'], ['', esc(tr.fermentationActive.texte.split(';')[0])], ['', 'biotransformation : voir la levure ci-dessous']] },
  dryPost: { t: 'Après fermentation, à froid, rien ne s’évapore : le plus d’arôme.', d: [[M('0,6–3,4 %', 'H31'), 'du myrcène (× 3 à chaud)'], [M('7–100 %', ['H30', 'H31', 'H32', 'H22']), 'du linalol, selon la base de mesure'], ['', esc(dur.essentiel24h.texte)]] },
};
function INCm(t, s) { return `<span class="inc" data-inconnu="${esc(t)}" data-source="${esc(s)}">inconnu</span>`; }

// ---------- le simulé : grille (Citra, Cascade), paires (Citra + Cascade) ----------
const GR = grilleDe(['Citra', 'Cascade']), PA = pairesDe(['Citra', 'Cascade']);
const LEVN = Object.fromEntries(Object.entries(LEV).map(([k, id]) => [k, CH.levures[id].nom]));
const LEVF = Object.fromEntries(Object.entries(LEV).map(([k, id]) => { const L = CH.levures[id]; return [k, { nom: L.nom, esters: L.esters, gc: L.geraniolCitronellol, betaLyase: L.betaLyase, notes: L.notes, src: L.sources }]; }));

const voie = (n) => `<span class="hv" data-voie="${esc(n)}">${point(n, n === 'Citra' ? 'plein' : 'contour')}<span class="hb">${hn(n)}${alpha(n, { plage: HOPS[n].alpha.lot == null })}</span>${usage(n)}${stock(n)}</span>`;
const corps = `
  ${barre('Pourquoi 10′, pas 60′ ?')}
  <div class="outils">${lentille()}<span class="regl doses" role="group" aria-label="La dose">${[1, 2, 4, 8].map((d) => `<button type="button" class="chip" data-dose="${d}" data-role="reglage" aria-pressed="${d === 4}">${d} g/L</button>`).join('')}</span></div>
  <div class="voies">${voie('Citra')}${voie('Cascade')}</div>
  <p class="reponse" id="reponse"></p>
  <section class="carte mx" aria-label="Ce qui reste du houblon, moment par moment">
    <h2>Ce qui reste dans la bière ${conf('mesure')}<small>part retrouvée, en %, la même pour les deux</small></h2>
    ${tete}
    ${lignes}
    <div class="mx-l ibu" id="ibu"></div>
    <div class="minute"><span>${ic('ebu', 14)}Ébullition</span><button type="button" class="pas" data-min="-5" data-role="reglage" aria-label="5 minutes de moins">${ic('moins', 16)}</button><b class="mono" id="min">60′</b><button type="button" class="pas" data-min="5" data-role="reglage" aria-label="5 minutes de plus">${ic('plus2', 16)}</button><span class="gris petit" id="min-n"></span></div>
    <p class="src-l">Verre plein : la borne basse ; pâle : jusqu’à la borne haute ; hachuré : la borne basse n’est pas chiffrée. IBU : Tinseth, comme le moteur (DI ${String(og).replace('.', ',')}), ta bière part de ${M(fr(BASE.ibu) + ' IBU', BASE.src)} avec Nugget ; la 16D : ${M(BASE.bande.join('–') + ' IBU', 'H39')}.</p>
  </section>
  <section class="carte" id="moment" aria-label="Le moment choisi"><div id="moment-t"></div><div class="sim" data-role="simulation"><div class="sim-t" id="sim-t"></div><div id="reg-dry"><div class="regl" role="group" aria-label="L’ajout"><button type="button" class="chip" data-ens="0" data-role="reglage" aria-pressed="true">chacun seul</button><button type="button" class="chip" data-ens="1" data-role="reglage" data-reglage="ajout-cumule" aria-pressed="false">${ic('plus2', 14)}Citra + Cascade, 2 + 2 g/L</button></div><div class="regl" role="group" aria-label="La levure">${Object.keys(LEV).map((k) => `<button type="button" class="chip" data-lev="${k}" data-role="reglage" data-reglage="levure" aria-pressed="${k === 'us05'}">${ic('levure', 14)}${esc(LEVN[k].replace(/^(SafAle|LalBrew) /, '').replace(' IPA', ''))}</button>`).join('')}</div></div><div id="moment-c"></div></div></section>
  ${legende([LEG_FAMILLES, LEG_CONF, LEG_HOUBLON, ['Le verre', [li('<span class="lg-v"><i class="p"></i></span>', 'plein : retrouvé au moins'), li('<span class="lg-v"><i class="p"></i><i class="l"></i></span>', 'pâle : jusqu’à la borne haute'), li('<span class="lg-v"><i class="h"></i></span>', 'hachuré : borne basse inconnue'), li('<span class="lg-v"><i class="i"></i></span>', 'inconnu : non mesuré, pas zéro'), li('<span class="lg-v ibu"><i class="z"></i><i class="b"></i></span>', 'IBU : gris ta bière, couleur l’ajout, orangé au-delà de 70')], true], LEG_SIM])}`;

const client = fs.readFileSync(path.join(ici, 'client-moments.js'), 'utf8');
const js = `(() => {
${CLIENT(PS)}
const GR = ${JSON.stringify(GR)};
const PA = ${JSON.stringify(PA)};
const IBU = ${JSON.stringify(IBU)};
const ALPHAS = ${JSON.stringify(ALPHAS)};
const BASE = ${JSON.stringify(BASE)};
const OG = ${og};
const MOMENTS = ${JSON.stringify(MOMENTS)};
const POURQUOI = ${JSON.stringify(Object.fromEntries(Object.entries(POURQUOI).map(([m, x]) => [m, { t: x.t, d: x.d }])))};
const LEVK = ${JSON.stringify(LEV)};
const LEVN = ${JSON.stringify(LEVN)};
const LEVF = ${JSON.stringify(LEVF)};
const BIO = ${JSON.stringify({ linalol: CH.biotransformation.linalol, thiols: CH.biotransformation.thiolsPrecurseurs, creep: CH.hopCreep.chiffres.find((c) => /10 g\/L, 7 j/.test(c.texte)), sat: CH.saturation.zone, satSrc: CH.saturation.sources })};
const COULEUR = ${JSON.stringify({ Citra: HOPS.Citra.couleur, Cascade: HOPS.Cascade.couleur })};
const SIMMENTION = ${JSON.stringify(SIMU.mention)};
${client}
})();`;

const CSS = `
  .doses { flex-wrap: nowrap; gap: 4px; } .doses .chip { padding: 0 8px; }
  .voies { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .hv { display: flex; align-items: center; flex-wrap: wrap; gap: 3px 6px; padding: 6px 8px; border-radius: 8px; background: #fff; box-shadow: 0 0 0 1px var(--trait); }
  .hv .hb { display: inline-flex; align-items: baseline; gap: 4px; } .hv .hn { font-size: 15px; }
  .reponse { font-size: 14px; line-height: 1.3; } .reponse b { font-weight: 700; }
  .mx { gap: 2px; }
  .mx-h, .mx-l { display: grid; grid-template-columns: 74px repeat(5, 1fr); align-items: end; gap: 2px; }
  .mx-h { position: sticky; top: 0; z-index: 3; background: #fff; padding: 2px 0 4px; }
  .mh { display: flex; flex-direction: column; align-items: center; gap: 1px; font-size: 12px; font-weight: 600; min-height: 36px; justify-content: center; border-radius: 4px; }
  .mh[aria-pressed="true"], .cel[aria-pressed="true"] { background: #ececf1; }
  .mx-l { border-top: 1px solid var(--trait); padding: 3px 0; }
  .mx-n { display: flex; flex-direction: column; gap: 1px; font-size: 12px; line-height: 1.1; align-self: center; }
  .mx-n b { font-size: 12px; font-weight: 700; } .mx-n small { font-size: 12px; color: var(--gris); }
  .cel { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 3px 0; border-radius: 4px; min-height: 64px; justify-content: flex-end; }
  .verre { position: relative; width: 16px; height: 40px; border-radius: 2px 2px 4px 4px; box-shadow: inset 0 0 0 1.5px #9a9aa6; background: #fff; overflow: hidden; }
  .v-plein { position: absolute; left: 0; right: 0; bottom: 0; background: var(--vb, #5b5b66); }
  .v-plage { position: absolute; left: 0; right: 0; background: var(--vf, #e4e4ea); box-shadow: inset 0 0 0 1px var(--vb, #5b5b66); }
  .v-hach { position: absolute; left: 0; right: 0; bottom: 0; background: repeating-linear-gradient(135deg, #fff 0 2px, var(--vb, #5b5b66) 2px 3.5px); }
  .v-inc { position: absolute; inset: 0; background: repeating-linear-gradient(135deg, #fff 0 3px, #d5d7de 3px 5px); }
  .v-deb { position: absolute; left: 3px; top: 1px; border: 5px solid transparent; border-bottom: 6px solid var(--encre); border-top: 0; }
  .v-t { font-size: 12px; white-space: nowrap; }
  .v-nm { display: none; }
  .mx.autre-min .cel[data-m="b60"] .verre > i, .mx.autre-min .cel[data-m="b60"] .v-t { display: none; }
  .mx.autre-min .cel[data-m="b60"] .verre { background: repeating-linear-gradient(135deg, #fff 0 3px, #d5d7de 3px 5px); }
  .mx.autre-min .cel[data-m="b60"] .v-nm { display: block; }
  .cel .inc { font-size: 12px; height: 16px; padding: 0 3px; }
  .ibu .cel { min-height: 92px; }
  .ib { position: relative; display: flex; gap: 3px; align-items: flex-end; height: 64px; }
  .ib-z { position: absolute; left: -3px; right: -3px; height: var(--zh); bottom: var(--zb); background: #eceaf4; border-top: 1.5px solid #8a8a96; border-bottom: 1.5px solid #8a8a96; }
  body.abs .ib-z { display: none; }
  .ib-b { position: relative; width: 11px; height: var(--h); border-radius: 2px 2px 0 0; overflow: hidden; background: var(--hc); }
  .ib-b.contour { background: #fff; box-shadow: inset 0 0 0 2px var(--hc); }
  .ib-b .base { position: absolute; left: 0; right: 0; bottom: 0; height: var(--hb); background: #9a9aa6; }
  .ib-b .x { position: absolute; left: 0; right: 0; top: 0; height: var(--hx); background: var(--acc); }
  body.abs .ib-b .x { display: none; }
  .ib-v { display: flex; flex-direction: column; align-items: center; font-size: 12px; line-height: 1.15; }
  .ib-v .hst { color: var(--acc); font-weight: 700; }
  .minute { display: flex; align-items: center; gap: 6px; font-size: 12px; padding-top: 4px; }
  .minute > span:first-child { display: inline-flex; align-items: center; gap: 4px; font-weight: 600; }
  .pas { width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: #ececf1; }
  .mo-t { font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 6px; }
  .pq { display: flex; flex-direction: column; gap: 3px; font-size: 12px; line-height: 1.3; }
  .pq span .vm { margin-right: 4px; }
  .sb-leg { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 12px; align-items: center; } .sb-leg > span { display: inline-flex; align-items: center; gap: 4px; } .sb-leg .hn { font-size: 12px; }
  .ecart { font-size: 14px; line-height: 1.3; } .ecart b { font-weight: 700; }
  [data-role="ajout"] { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 12px; padding: 6px 8px; border-radius: 8px; background: #f6f6f9; }
  .courbe { position: relative; height: 120px; margin: 4px 0 0; }
  .cb-z { position: absolute; left: 0; right: 0; bottom: 0; height: var(--zh); background: #eceaf4; border-top: 1.5px solid #8a8a96; }
  body.abs .cb-z { display: none; }
  .cb-c { position: absolute; bottom: 0; top: 0; width: 20%; display: flex; justify-content: center; }
  .cb-r { position: absolute; width: 2px; background: var(--hc); opacity: .5; }
  .cb-p { position: absolute; width: 10px; height: 10px; margin-left: -5px; margin-bottom: -5px; border-radius: 50%; background: var(--hc); }
  .cb-p.contour { background: #fff; box-shadow: inset 0 0 0 2.5px var(--hc); }
  .cb-x { display: grid; grid-template-columns: repeat(5, 1fr); font-size: 12px; text-align: center; }
  .lg-v { position: relative; width: 14px; height: 24px; display: inline-block; flex: none; border-radius: 2px 2px 4px 4px; box-shadow: inset 0 0 0 1.5px #9a9aa6; overflow: hidden; }
  .lg-v i { position: absolute; left: 0; right: 0; bottom: 0; }
  .lg-v .p { height: 8px; background: #5b5b66; } .lg-v .l { bottom: 8px; height: 10px; background: #e4e4ea; box-shadow: inset 0 0 0 1px #5b5b66; }
  .lg-v .h { height: 18px; background: repeating-linear-gradient(135deg, #fff 0 2px, #5b5b66 2px 3.5px); } .lg-v .i { top: 0; background: repeating-linear-gradient(135deg, #fff 0 3px, #d5d7de 3px 5px); }
  .lg-v.ibu { box-shadow: none; overflow: visible; } .lg-v.ibu .z { bottom: 8px; height: 6px; background: #eceaf4; border-top: 1px solid #8a8a96; } .lg-v.ibu .b { left: 4px; right: 4px; height: 20px; background: linear-gradient(#c2410c 0 6px, #184078 6px 14px, #9a9aa6 14px); }`;
ecrire(path.join(ici, 'etat.html'), page({ titre: 'Pourquoi 10′ pas 60′', desc: 'Lot 21 · v2 · Le chemin du houblon : la vraie part retrouvée de chaque marqueur, moment par moment, dans un verre ; l’amertume face à la 16D ; le moment touché dit pourquoi et montre le profil simulé (profils-simules.json). Généré par v2/generer.mjs.', css: CSS, corps, js }));
