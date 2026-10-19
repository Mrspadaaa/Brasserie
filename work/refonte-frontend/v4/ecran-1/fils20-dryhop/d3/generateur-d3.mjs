// Lot 20 · d3 · Le pouvoir aromatique face à la 16D. Les quatre houblons de ses cas (Citra, Galaxy, Idaho 7,
// Cascade), à 4 g/L en dry hop après fermentation sur la stout S1 : pour chacun, la lecture ordinale du moteur
// par composé (sous, autour ou au-dessus du seuil, ×N en plage, repère central), face à ce que la 16D attend
// (« arôme de houblon faible et facultatif », BJCP 2021) et la règle ×10 du moteur (convention [H] à fixer par
// le brasseur). Mention : perception en bière noire non documentée. Une carte de matrice (l8b), une colonne par
// composé ; toucher une tête trie les houblons. Chiffres : fils19-choix/donnees/cas-*.json ; α : le stock.
// Usage : node generateur-d3.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as S from '../d1/socle-h.mjs';
import * as M from '../d1/moteur-h.mjs';
const { D, HB, num, inc, ent, nom, picto, hn, lentille, legende, page, ecrire, piste, CSS_PISTE, srcTxt, fr, ic, signe, alpha, JET, repli, xLog } = S;
const ICI = path.dirname(fileURLToPath(import.meta.url));

const CAS = [['citra', 'cas-citra'], ['galaxy', 'cas-galaxy'], ['idaho7', 'cas-idaho7'], ['cascade', 'cas-cascade']].map(([k, id]) => { const c = M.cas(id); return { k, id, ...c, A: c.P.ajouts[c.P.ajouts.length - 1] }; });
const COLS = [['linalol', 'floral', 'linalol'], ['geraniol', 'floral', 'géraniol'], ['4MMP', 'tropical', '4MMP'], ['myrcene', 'green', 'myrcène']];
const FAMS = { linalol: ['floral', 'citrus'], geraniol: ['floral'], '4MMP': ['tropical', 'berries'], myrcene: ['green', 'resin'] };
const P0 = CAS[0].A.pouvoir, ZX = P0.facteurEleve;
const TW = 82;
const lien = (s) => `<span class="src" data-ref>${srcTxt(s)}</span>`;
const rap = (y) => (y && y.rapport && y.rapport.plage && !(y.rapport.plage.min == null && y.rapport.plage.max == null) ? y.rapport.plage : null);
const cel = (o, u, r) => (o && o.plage && !(o.plage.min == null && o.plage.max == null) ? M.txt(o.plage, { unite: u, pre: u ? '' : '×', src: M.srcM(o.sources), niv: M.nivM(o), central: true }) : inc(r((o && o.inconnu) || 'non chiffré'), []));

function ligne(cs) {
  const { k, A, r } = cs, H = HB[k], p = A.pouvoir, fas = p.faceAuStyle;
  const hs = /hors du style/.test(fas.statut);
  const dom = p.dominant;
  const cells = COLS.map(([c, f]) => {
    const y = A.composes[c], R = rap(y), lec = (p.composes.find((x) => x.compose === c) || {}).lecture || { classe: 'inconnu' };
    const L = M.LEC[lec.classe] || 'inconnu', orange = hs && fas.composes.includes(c);
    const v = R ? (R.central != null ? R.central : R.max != null ? R.max : R.min) : -1;
    return `<span class="cel${orange ? ' hs' : ''}" data-col="${c}" data-v="${v}" role="img" aria-label="${(H.nom + ', ' + y.nom + ' : ' + r(lec.texte || 'inconnu')).replace(/"/g, '')}">${piste({ W: TW, f, barres: [], total: R || { inconnu: true }, orange, zoneMax: ZX.valeur })}<span class="sg">${L !== 'inconnu' ? signe(L, 12) : inc(r((y.rapport && y.rapport.inconnu) || 'inconnu'), M.srcM(y.rapport && y.rapport.sources), 'inconnu', 'inc q')}</span></span>`;
  }).join('');
  const domTxt = dom ? `<span class="dom">${nom(dom.nom.replace(/ \(.*\)/, ''))} ${M.txt({ ...dom.rapport, minAuMoins: false }, { pre: '×', src: ['moteur'], niv: dom.niveau || 'H', motMax: false })}</span>` : '';
  const detail = `<table><tr><th></th><th>introduit</th><th>en bière</th><th>× seuil</th></tr>
    ${COLS.map(([c, , lib]) => { const y = A.composes[c]; return `<tr><td>${nom(lib)}</td><td>${cel(y.charge, y.charge && y.charge.unite, r)}</td><td>${cel(y.concentration, y.concentration && y.concentration.unite, r)}</td><td>${cel(y.rapport, '', r)}</td></tr>`; }).join('')}</table>
    <p data-source="moteur" data-niveau="H"><b>${fas.statut.replace('facteur < N', '< ×' + p.facteurEleve.valeur)}</b> : ${r(fas.texte)}</p>
    ${dom ? `<p data-source="moteur" data-niveau="${dom.niveau || 'H'}">Domine : ${dom.nom}, ${r(dom.lecture.texte)}. ${p.mention}</p>` : ''}
    <p data-source="moteur" data-niveau="H">${A.momentLabel}, ${ent(fr(A.doseGL) + ' g/L')}, J${A.jour}, ${A.dureeJours} j ; forme : ${A.forme}.</p>`;
  return `<section class="hl" data-houblon-ligne="${k}">${repli(`<span class="hc"><span class="hh"><i class="pt" style="background:${H.couleur}" data-houblon="${H.cle}" data-couleur="${H.couleur}"></i>${hn(k)}${alpha(k)}${hs ? `<span class="xs">${ic('alerte', 12)}${/peut-être/.test(fas.statut) ? 'peut-être hors du style' : 'hors du style'}</span>` : domTxt}</span><span class="cels">${cells}</span></span>`, detail, 'hr')}</section>`;
}

const st = P0.style;
const LEG = [
  ['<i class="lg-sl"></i>', 'seuil de perception (plage des sources)'],
  [`<i class="lg-zn" style="--z:rgba(191,134,214,.3);--t:${JET.floral.texte}"></i>`, '16D : jusqu\'à ×10 le seuil, convention [H] du moteur, à fixer par toi', 'moteur', 'H'],
  [`<i class="lg-bt" style="--c:${JET.floral.base}"></i><i class="lg-ct"></i>`, 'rapport au seuil : plage des sources et repère central, pas une intensité'],
  ['<i class="lg-hz"></i>', 'borne inconnue (hachures), jamais 0'],
  [`${signe('dessus', 12)}${signe('autour', 12)}${signe('sous', 12)}`, 'au-dessus · autour · sous le seuil'],
  [`${picto('earthy', 14)}${picto('herbal', 14)}${picto('floral', 14)}`, 'ce que la 16D cite : terreux, herbacé, floral', '[39]', 'S'],
  ['<i class="lg-hs"></i>', 'hors du style (orangé) : au-delà de ×10'],
  [`${picto('tropical', 14)}${picto('berries', 14)}`, '4MMP : tropical, cassis ; linalol : floral, agrumes ; myrcène : vert, résineux', 'spec', 'H'],
];
const th = ([c, f, lib]) => `<button class="th" data-tri="${c}" aria-pressed="false" aria-label="Trier par ${lib}"><span class="pis">${FAMS[c].map((x) => picto(x, 12)).join('')}</span><span>${nom(lib)}</span></button>`;
const x1 = xLog(1, TW);
const corps = `
  <header class="tete"><h1>Pouvoir aromatique</h1><span class="chip">${ent(fr(CAS[0].A.doseGL) + ' g/L')}</span>${lentille()}${legende(LEG)}</header>
  <div class="st" data-role="style">${nom('16D')}<span class="pis">${D.style16D.arome.familles.map((f) => picto(f, 14)).join('')}</span><span data-source="${srcTxt(M.srcM(st.sources))}" data-niveau="S">faible et facultatif</span></div>
  <div class="mx">
    <div class="mh">${COLS.map(th).join('')}</div>
    <div class="axe-t" aria-hidden="true">${COLS.map((c, i) => `<span style="left:${(i * (TW + 8) + x1).toFixed(1)}px">${i === 0 ? 'seuil' : ''}</span>`).join('')}</div>
    <div class="hls">${CAS.map(ligne).join('')}</div>
  </div>
  <p class="mention" data-source="moteur" data-niveau="H">${ic('alerte', 12)}perception en bière noire non documentée ; pars de ta dégustation</p>
  ${repli(`${nom('16D')}<span class="gris" data-source="moteur" data-niveau="H">la règle ×${ZX.valeur}</span>`, `<p data-source="[39]" data-niveau="S">« ${st.citation} » ${lien(M.srcM(st.sources))} : ${CAS[0].r(st.attendu)}.</p>
    <p data-source="moteur" data-niveau="H">Hors du style : ×${ZX.valeur}, ${CAS[0].r(ZX.convention)}. « Peut-être » : le repère central dépasse ×${ZX.valeur}, la borne basse non.</p>
    <p data-source="moteur" data-niveau="H">${CAS[0].r(P0.biereNoire)} Alcool ${num(CAS[0].P.abv.plage.map(fr).join('–') + ' % vol.', ['[39]'], 'S')} : seuils du linalol ×2,5 et du géraniol ×2,2 de 5 à 10 % vol. ${lien(['[34]'])}.</p>
    <p data-source="moteur" data-niveau="H">Hypothèses [H] du moteur : densité des hydrocarbures (myrcène), transfert de l'humulène, du caryophyllène et du farnésène.</p>`, 'regle')}`;

const css = `${CSS_PISTE}
  .st { display: flex; align-items: center; gap: 6px; min-height: 28px; padding: 0 8px; border-radius: 8px; background: var(--doux); font-size: 14px; }
  .st .nmc { font-weight: 600; }
  .mx { display: flex; flex-direction: column; background: #fff; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,.12); padding: 2px 6px 6px; }
  .mh { display: grid; grid-template-columns: repeat(4, ${TW}px); column-gap: 8px; align-items: end; padding: 2px 0; }
  .th { display: flex; flex-direction: column; align-items: flex-start; gap: 1px; padding: 2px 2px 4px; border-radius: 4px; font-size: 12px; font-weight: 600; position: relative; }
  .th[aria-pressed="true"] { background: var(--doux); box-shadow: inset 0 -2px 0 var(--encre); }
  .axe-t { position: relative; height: 14px; font-size: 12px; color: var(--gris); }
  .axe-t span { position: absolute; top: 0; transform: translateX(-50%); }
  .hl { border-top: 1px solid var(--trait); padding: 2px 0 4px; }
  .rp.hr { background: none; }
  .rp.hr > .rp-s { padding: 2px 0; min-height: 26px; }
  .rp.hr.ouvert { background: var(--doux); border-radius: 4px; }
  .rp.hr > .preuve { padding: 0 4px 6px; }
  .hc { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; }
  .rp.hr > .rp-s { align-items: flex-start; }
  .hh { display: flex; align-items: center; gap: 5px; flex: 1; min-width: 0; font-size: 14px; flex-wrap: wrap; row-gap: 2px; }
  .dom { margin-left: auto; display: inline-flex; gap: 3px; align-items: baseline; font-size: 12px; color: var(--gris); }
  .dom .v { color: var(--encre); font-weight: 600; }
  .hh .xs { margin-left: auto; }
  .cels { display: grid; grid-template-columns: repeat(4, ${TW}px); column-gap: 8px; }
  .cel { display: flex; flex-direction: column; gap: 2px; }
  .cel .sg { display: inline-flex; align-items: center; min-height: 14px; }
  .inc.q { font-size: 12px; }
  .mention { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--encre); }
  .mention .ic { color: var(--gris); }
  .rp.regle .rp-s { color: var(--encre); }
  .lg-sl { width: 2px; height: 14px; background: #9a9aa6; }
  .lg-zn { width: 30px; height: 5px; background: var(--z); border-radius: 2px 0 0 2px; box-shadow: 2px 0 0 var(--t); }
  .lg-bt { width: 30px; height: 5px; border-radius: 2px; background: var(--c); } .lg-ct { width: 2px; height: 9px; background: var(--encre); margin-left: -16px; }
  .lg-hz { width: 30px; height: 5px; background: repeating-linear-gradient(135deg, #8a909b 0 1.5px, #fff 1.5px 4px); }
  .lg-hs { width: 24px; height: 5px; border-radius: 2px; background: var(--acc); }
  .lg-v i { display: inline-block; }`;

// Le tri au toucher : les houblons, du plus haut repère central du composé touché au plus bas ; retoucher rend l'ordre.
const js = `
const ordre = [...document.querySelectorAll('.hl')];
document.querySelectorAll('.th[data-tri]').forEach((b) => b.addEventListener('click', () => {
  const on = b.getAttribute('aria-pressed') !== 'true', c = b.dataset.tri, g = document.querySelector('.hls');
  document.querySelectorAll('.th[data-tri]').forEach((x) => x.setAttribute('aria-pressed', String(on && x === b)));
  const v = (r) => parseFloat(r.querySelector('[data-col="' + c + '"]').dataset.v);
  [...ordre].sort((a, z) => (on ? v(z) - v(a) : 0) || ordre.indexOf(a) - ordre.indexOf(z)).forEach((r) => g.append(r));
}));`;

ecrire(path.join(ICI, 'etat.html'), page({ titre: 'Pouvoir aromatique, 16D', commentaire: 'Lot 20 · d3 · généré par generateur-d3.mjs depuis cas-citra, cas-galaxy, cas-idaho7, cas-cascade (moteur) et le stock ; ne pas éditer à la main.', css, corps, js }));
