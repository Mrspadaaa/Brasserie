// Lot 20 · d1 · Planificateur de dry hop. Une frise des jours où sont posés les ajouts du moteur (Citra 2 g/L
// 3 j puis Galaxy 2 g/L 7 j, ou Citra 3 j puis Idaho 7 5 j, sur la stout S1 et son Nugget à 60′), puis la
// lecture par composé : charge cumulée et rapport au seuil de la recette, en plages, avec le repère central,
// face à la 16D (au style) ou seul (absolu). Drapeaux du moteur : au-delà de 3 j, saturation 4–8 g/L (Cascade
// seul), ordre, synergie, masquage. Les chiffres : fils19-choix/donnees/cas-*.json (moteur), l'α : le stock.
// Usage : node generateur-d1.mjs
import path from 'node:path';
import * as S from './socle-h.mjs';
import * as M from './moteur-h.mjs';
const { D, HB, PAR_CLE, num, inc, ent, nom, picto, hn, lentille, legende, page, ecrire, piste, CSS_PISTE, chev, srcTxt, fr, NOM, ic, signe, alpha, JET, repli } = S;

const SCEN = [{ id: 'cas-citra3-galaxy7', k: 'galaxy' }, { id: 'cas-citra3-idaho7-5', k: 'idaho7' }].map((s) => ({ ...s, ...M.cas(s.id) }));
const JMAX = 18, W = 366, dx = W / JMAX;
// Les composés du brief, et les familles qu'ils portent dans le moteur (spécification §6).
const CP = [['linalol', ['floral', 'citrus']], ['geraniol', ['floral']], ['4MMP', ['tropical', 'berries']], ['3MH', ['citrus', 'tropical']], ['myrcene', ['green', 'resin']]];
const lien = (srcs) => `<span class="src" data-ref>${srcTxt(srcs)}</span>`;
const pr = (t, srcs, niv = 'H') => `<span data-source="${srcTxt(srcs)}" data-niveau="${niv}">${t}</span>`;
const kOf = (a) => PAR_CLE[a.houblon];

// ---------- la frise : la levure jusqu'au dry hop, puis une ligne par ajout (nom, α), sa barre sur les jours ----------
function frise(sc) {
  const P = sc.P, dh = P.ajouts.filter((a) => a.jour != null), chaud = P.ajouts.filter((a) => a.jour == null);
  const debut = Math.min(...dh.map((a) => a.jour)), fin = Math.max(...dh.map((a) => a.jour + a.dureeJours));
  const marques = [...new Set(dh.map((a) => a.jour))].sort((a, b) => a - b);
  let s = `<div class="jl">${marques.map((j) => `<span style="left:${(j * dx).toFixed(1)}px" class="${j === 0 ? 'ga' : ''}">${ent('J' + j)}</span>`).join('')}</div>`;
  s += `<div class="jours" aria-hidden="true">${Array.from({ length: JMAX + 1 }, (_, j) => `<i style="left:${(j * dx).toFixed(1)}px"></i>`).join('')}<i class="fer" style="width:${(debut * dx).toFixed(1)}px"></i></div>`;
  for (const a of chaud) {
    const k = kOf(a), H = HB[k];
    s += `<div class="aj ch0"><div class="aj-t"><i class="pt" style="background:${H.couleur}" data-houblon="${H.cle}" data-couleur="${H.couleur}"></i>${hn(k)}${ent(a.momentLabel, 'e mo')}${alpha(k, { court: true })}<span class="lev" role="img" aria-label="fermentation de J0 à J${debut}">${ic('levure', 14)}</span></div></div>`;
  }
  dh.forEach((a, i) => {
    const k = kOf(a), H = HB[k], at = `data-houblon="${H.cle}" data-couleur="${H.couleur}"`, x0 = a.jour * dx;
    s += `<div class="aj" style="--c:${H.couleur}">
      <div class="aj-t"><i class="pt" style="background:${H.couleur}" ${at}></i>${hn(k)}${alpha(k)}</div>
      <div class="aj-b" role="img" aria-label="${H.nom}, ${fr(a.doseGL)} g/L, de J${a.jour} à J${a.jour + a.dureeJours}">
        <i class="b24" ${at} style="left:${x0.toFixed(1)}px;width:${dx.toFixed(1)}px"></i>
        <i class="b13" ${at} style="left:${(x0 + dx).toFixed(1)}px;width:${(Math.min(2, a.dureeJours - 1) * dx).toFixed(1)}px"></i>
        ${a.dureeJours > 3 ? `<i class="b3p" ${at} style="left:${(x0 + 3 * dx).toFixed(1)}px;width:${((a.dureeJours - 3) * dx).toFixed(1)}px"></i>` : ''}
        ${i === 0 ? `<span class="h24" style="left:${(x0 - 44).toFixed(1)}px">${ic('sablier', 12)}${num('24 h', ['[73]', '[20]'], 'S')}</span>` : ''}
      </div>
    </div>`;
  });
  return `<section class="frise" aria-label="Frise des ajouts, J0 à J${JMAX}">${s}</section>`;
}

// ---------- les drapeaux du moteur ----------
const dr = (sc, id) => sc.P.drapeaux.find((d) => d.id === id);
const drA = (sc, id) => sc.P.ajouts.flatMap((a) => (a.drapeaux || []).map((d) => ({ ...d, a }))).filter((d) => d.id === id);
function drapeauDuree(sc) {
  const L = drA(sc, 'duree-longue'); if (!L.length) return '';
  const d = L[0], H = HB[kOf(d.a)], hc = dr(sc, 'hop-creep');
  return repli(`<i class="hzs" style="--c:${H.couleur}" aria-hidden="true"></i><b>${ent('+' + (d.a.dureeJours - 3) + ' j')}</b>
      <span class="dr-i" role="img" aria-label="au-delà de 3 j : pas d'arôme mesuré en plus" data-source="${srcTxt(M.srcM(d.sources))}" data-niveau="S">${ic('fiole', 14)}${ic('egal', 14)}</span>
      <span class="dr-i" role="img" aria-label="végétal : inconnu (aucune donnée en fonction du temps)">${picto('green', 14)}<i class="hach"></i></span>
      <span class="dr-i" role="img" aria-label="hop creep si la levure est vivante">${ic('levure', 14)}</span>`, `<p data-source="${srcTxt(M.srcM(d.sources))}" data-niveau="moteur"><b>${sc.r(d.titre)}</b> ${lien(M.srcM(d.sources))}. ${sc.r(d.pourquoi)}</p>
      <p data-source="${srcTxt(M.srcM(hc.sources))}" data-niveau="moteur"><b>${sc.r(hc.titre)}</b> (${sc.r(hc.statut)}) ${lien(M.srcM(hc.sources))}. ${sc.r(hc.pourquoi)}</p><p>Végétal : ${inc('aucune donnée en fonction du temps', ['[22]'])} ; l'herbacé est lié à la dose ${lien(['[22]'])}.</p>`, 'drap');
}
function drapeauSaturation(sc) {
  const d = dr(sc, 'saturation'), tot = sc.P.doseACruGL, Z = D.saturation.zone_gL.v, G = 132, gx = (v) => (v / 16) * G;
  return repli(`${ic('balance', 14)}<span class="jg" aria-hidden="true"><i class="jz" style="left:${gx(Z[0])}px;width:${gx(Z[1]) - gx(Z[0])}px"></i><i class="jm" style="left:${(gx(tot) - 1.5).toFixed(1)}px"></i></span>
      <b>${ent(fr(tot) + ' g/L')}</b>`, `<p data-source="${srcTxt(M.srcM(d.sources))}" data-niveau="moteur"><b>${sc.r(d.titre)}</b> : ${sc.r(d.statut)} ${lien(M.srcM(d.sources))}. ${sc.r(d.pourquoi)}</p><p>Zone ${num(Z[0] + '–' + Z[1] + ' g/L', M.srcM(d.sources), 'P')}, preuve : Cascade seulement.</p>`, 'sat');
}
// Géraniol → citronellol : le drapeau du moteur pour le second ajout, s'il est évaluable (Idaho 7, riche en géraniol) ;
// le cas Pomona en fermentation active dit ce qui change quand la levure documente le glissement.
const POMONA = M.cas('cas-citra3-idaho7-5-pomona-actif');
function drapeauGeraniol(sc) {
  const a = sc.P.ajouts[sc.P.ajouts.length - 1], d = (a.drapeaux || []).find((x) => x.id === 'geraniol-citronellol');
  if (!d || /non évaluable/.test(d.statut)) return '';
  const pa = POMONA.P.ajouts.find((x) => x.houblon === a.houblon), pd = pa && (pa.drapeaux || []).find((x) => x.id === 'geraniol-citronellol');
  return repli(`<span class="dr-i" role="img" aria-label="géraniol vers citronellol">${picto('floral', 14)}${ic('chev-r', 12)}${picto('citrus', 14)}</span><span>${sc.r(d.statut)}</span>`,
    `<p data-source="${srcTxt(M.srcM(d.sources))}" data-niveau="moteur"><b>${sc.r(d.titre)}</b> ${lien(M.srcM(d.sources))}. ${sc.r(d.pourquoi)}</p>
    ${pd ? `<p data-source="${srcTxt(M.srcM(pd.sources))}" data-niveau="moteur"><b>Avec ${POMONA.P.levure.nom}, en fermentation active</b> : ${POMONA.r(pd.statut)}. ${POMONA.r(pd.pourquoi)}</p>` : ''}`, 'ger');
}
function inconnus(sc) {
  const xs = ['ordre', 'synergie', 'masquage'].map((id) => dr(sc, id));
  return repli(`<i class="hach"></i>ordre, synergie ${inc('aucune étude', [], 'inconnus')}`, `${xs.map((d) => `<p data-source="${srcTxt(M.srcM(d.sources))}" data-niveau="moteur"><b>${sc.r(d.titre)}</b> ${lien(M.srcM(d.sources))}. ${sc.r(d.pourquoi)}</p>`).join('')}`, 'incs');
}

// ---------- la lecture par composé : la recette (cumul), et chaque ajout en filet ----------
const TW = 248;
function ligne(sc, [c, fams]) {
  const P = sc.P, X = P.composes[c], ZX = P.pouvoir.facteurEleve.valeur;
  const lec = (P.pouvoir.composes.find((x) => x.compose === c) || {}).lecture || { classe: 'inconnu' };
  const L = M.LEC[lec.classe] || 'inconnu';
  const fas = P.pouvoir.faceAuStyle, orange = /hors du style/.test(fas.statut) && fas.composes.includes(c);
  const src = M.srcM(X.rapport && X.rapport.sources), niv = M.nivM(X.rapport);
  const R = X.rapport && X.rapport.plage && !(X.rapport.plage.min == null && X.rapport.plage.max == null) ? X.rapport.plage : null;
  const mg = X.charge && X.charge.plage && X.charge.unite === 'µg/L' && (X.charge.plage.max || 0) >= 10000;
  const chargeTxt = X.charge && X.charge.plage ? M.txt(mg ? { ...X.charge.plage, min: X.charge.plage.min / 1000, max: X.charge.plage.max / 1000 } : X.charge.plage, { unite: mg ? 'mg/L' : X.charge.unite, src: M.srcM(X.charge.sources), niv: M.nivM(X.charge), motMax: false }) : inc(sc.r((X.charge && X.charge.inconnu) || 'non chiffré'), []);
  const rTxt = R ? M.txt({ ...R, minAuMoins: false }, { pre: '×', src, niv, motMax: false }) : inc(sc.r((X.rapport && X.rapport.inconnu) || 'rapport au seuil inconnu'), src);
  const barres = P.ajouts.map((a) => { const y = a.composes[c], p = y && y.rapport && y.rapport.plage; return { k: kOf(a), r: p && !(p.min == null && p.max == null) ? p : { inconnu: true } }; });
  const cel = (o) => (o && o.plage && !(o.plage.min == null && o.plage.max == null) ? M.txt(o.plage, { unite: o.unite === '× seuil' ? '' : o.unite, pre: o.unite === '× seuil' ? '×' : '', src: M.srcM(o.sources), niv: M.nivM(o), central: true }) : inc(sc.r((o && o.inconnu) || 'non chiffré'), []));
  const detail = `
    <table><tr><th></th><th>introduit</th><th>en bière</th><th>× seuil</th></tr>
    ${P.ajouts.map((a) => { const y = a.composes[c] || {}; return `<tr><td>${hn(kOf(a))} ${ent(a.momentLabel === '60′' ? '60′' : 'J' + a.jour, 'e g')}</td><td>${cel(y.charge)}</td><td>${cel(y.concentration)}</td><td>${cel(y.rapport)}</td></tr>`; }).join('')}
    <tr><td><b>recette</b></td><td>${cel(X.charge)}</td><td>${cel(X.concentration)}</td><td>${cel(X.rapport)}</td></tr></table>
    <p data-source="${srcTxt(src)}" data-niveau="moteur">${lec.texte ? sc.r(lec.texte) + '. ' : ''}${P.pouvoir.mention}${X.rapport && X.rapport.inconnu ? ' ' + sc.r(X.rapport.inconnu) + '.' : ''}</p>
    ${(X.rapport && X.rapport.hypotheses || []).length ? `<p data-source="H" data-niveau="H">Hypothèses [H] : ${X.rapport.hypotheses.map(sc.r).join(' ; ')}.</p>` : ''}`;
  return repli(`<span class="cps" data-compose="${c}"><span class="l1"><span class="pis">${fams.map((f) => picto(f, 14)).join('')}</span><b class="cn">${nom(X.nom.replace(/ \(.*\)/, ''))}</b>${orange ? `<span class="xs">${ic('alerte', 12)}${/peut-être/.test(fas.statut) ? 'peut-être hors du style' : 'hors du style'}</span>` : ''}<span class="ch">${!R && !(X.charge && X.charge.plage) ? '' : chargeTxt}</span></span>
      <span class="l2">${piste({ W: TW, f: fams[0], barres, total: R || { inconnu: true }, orange, zoneMax: ZX })}<span class="rt">${L !== 'inconnu' ? signe(L, 12) : ''}${rTxt}</span></span></span>`, detail, 'cp' + (orange ? ' hs' : ''));
}

function scenario(sc, i) {
  const xs = S.xLog(1, TW), xz = S.xLog(sc.P.pouvoir.facteurEleve.valeur, TW), fas = sc.P.pouvoir.faceAuStyle;
  return `<section class="scen" data-scenario="${sc.k}"${i ? ' hidden' : ''}>
    ${frise(sc)}
    <div class="drs">${drapeauDuree(sc)}${drapeauGeraniol(sc)}${drapeauSaturation(sc)}${inconnus(sc)}</div>
    <div class="tab" aria-label="Lecture par composé, toute la recette">
      <div class="th" aria-hidden="true"><span class="ths" style="left:${xs.toFixed(1)}px">seuil</span><span class="ths seulstyle" style="left:${xz.toFixed(1)}px">${num('×' + sc.P.pouvoir.facteurEleve.valeur, ['H'], 'H')}</span></div>
      ${CP.map((c) => ligne(sc, c)).join('')}
    </div>
    ${st16(sc)}
  </section>`;
}

const LEG = [
  ['<i class="lg-fer"></i>', 'fermentation (levure) jusqu\'au dry hop'],
  [`<i class="lg-b24" style="--c:${HB.citra.couleur}"></i><i class="lg-b13" style="--c:${HB.citra.couleur}"></i><i class="lg-b3p" style="--c:${HB.citra.couleur}"></i>`, 'premières 24 h · jusqu\'à 3 j · au-delà de 3 j', '[73] [20]', 'S'],
  [`${ic('fiole', 14)}${ic('egal', 14)}`, 'pas d\'arôme mesuré en plus'],
  [`${ic('levure', 14)}`, 'hop creep, si la levure est vivante'],
  [`${ic('balance', 14)}<i class="lg-jg"></i>`, 'dose à cru face à la zone de saturation (preuve : Cascade)'],
  ['<i class="hach"></i>', 'inconnu, jamais 0'],
  ['<i class="lg-sl"></i>', 'seuil de perception (plage des sources)'],
  [`<i class="lg-zn" style="--z:rgba(191,134,214,.3);--t:${JET.floral.texte}"></i>`, '16D : jusqu\'à ×10 le seuil, convention [H] à fixer par toi', 'moteur', 'H'],
  [`<i class="lg-bh" style="--c:${HB.citra.couleur}"></i>`, 'chaque ajout (couleur du houblon)'],
  [`<i class="lg-bt" style="--c:${JET.floral.base}"></i><i class="lg-ct"></i>`, 'la recette : plage et repère central'],
  [`${signe('dessus', 12)}${signe('autour', 12)}${signe('sous', 12)}`, 'au-dessus · autour · sous le seuil'],
  ['<i class="lg-hs"></i>', 'hors du style (orangé)'],
];
const st = D.style16D, sc0 = SCEN[0];
const dose = SCEN[0].P.ajouts.filter((a) => a.jour != null).map((a) => a.doseGL);
// Le 16D face au style : le verdict du moteur pour chaque scénario, et la règle [H] du facteur ×10.
const st16 = (sc) => { const p = sc.P.pouvoir, fas = p.faceAuStyle;
  return repli(`${nom('16D')}<span class="fas" data-source="moteur" data-niveau="H">${fas.statut.replace('au-dessus du seuil, facteur < N', '< ×' + p.facteurEleve.valeur).replace(' du seuil', '')}</span>`,
    `<p data-source="moteur" data-niveau="H">${sc.r(fas.texte)}</p>
    <p data-source="[39]" data-niveau="S">« ${p.style.citation} » ${lien(M.srcM(p.style.sources))}. Alcool ${num(sc.P.abv.plage.map(fr).join('–') + ' % vol.', ['[39]'], 'S')} (${sc.P.abv.base}).</p>
    <p><b>${sc.r(p.biereNoire)}</b></p>
    <p data-source="moteur" data-niveau="H">Hors du style : ×${p.facteurEleve.valeur}, ${sc.r(p.facteurEleve.convention)}. ${p.mention}</p>
    <p data-source="[74] stock" data-niveau="F">Citra : pas de lot en pellets ; en stock, du cryo (même huile avec 40 à 50 % de la masse ${lien(['[74]'])}).</p>`, 'st16'); };
const corps = `
  <header class="tete"><h1>Dry hop</h1><span class="chip" aria-label="${fr(dose[0])} g/L par ajout">${ent(fr(dose[0]) + ' g/L')}</span>${lentille()}${legende(LEG)}</header>
  <div class="tete t2"><span class="seg" role="radiogroup" aria-label="Second ajout">${SCEN.map((sc, i) => { const a = sc.P.ajouts[sc.P.ajouts.length - 1], k = kOf(a); return `<button role="radio" data-scen="${sc.k}" aria-checked="${i === 0}" aria-label="Citra puis ${HB[k].nom} ${a.dureeJours} j"><i class="pt" style="background:${HB[k].couleur}" data-houblon="${HB[k].cle}" data-couleur="${HB[k].couleur}"></i>${hn(k, HB[k].nom, 'hn sg')}<span class="sg-al">${alpha(k, { court: true })}</span></button>`; }).join('')}</span></div>
  ${SCEN.map(scenario).join('')}`;

const css = `${CSS_PISTE}
  .t2 { min-height: 28px; }
  .seg .sg { text-decoration: none; }
  .sg-al .al-l { font-size: 12px; }
  .seg button[aria-checked="true"] .sg-al { display: none; }
  .frise { position: relative; display: flex; flex-direction: column; gap: 2px; }
  .jl { position: relative; height: 14px; font-size: 12px; }
  .jl span { position: absolute; top: 0; transform: translateX(-50%); } .jl span.ga { transform: none; }
  .jl .e { color: var(--gris); }
  .jours { position: relative; height: 6px; border-top: 1px solid var(--trait); }
  .jours i { position: absolute; top: 0; width: 1px; height: 4px; background: var(--trait2); }
  .jours i.fer { left: 0; top: 1px; height: 4px; border-radius: 2px; background: #e4e4ea; }
  .aj { display: flex; flex-direction: column; gap: 1px; }
  .aj-t { display: flex; align-items: center; gap: 5px; min-height: 18px; font-size: 14px; }
  .aj-t .e.g { color: var(--gris); }
  .aj-t .mo { font-weight: 600; }
  .lev { margin-left: auto; display: inline-flex; align-items: center; gap: 3px; color: var(--gris); }
  .aj-b { position: relative; height: 14px; }
  .aj-b > i { position: absolute; top: 0; height: 14px; display: block; }
  .b24 { background: var(--c); border-radius: 4px 0 0 4px; }
  .b13 { background: color-mix(in srgb, var(--c) 30%, #fff); }
  .b3p { background: repeating-linear-gradient(135deg, var(--c) 0 2px, #fff 2px 5px); border-radius: 0 4px 4px 0; box-shadow: inset 0 0 0 1px var(--c); }
  .h24 { position: absolute; top: 0; height: 14px; display: inline-flex; align-items: center; gap: 2px; color: var(--encre); }
  .h24 .v { font-weight: 600; }
  .drs { display: flex; flex-direction: column; gap: 4px; }
  .drs summary { flex-wrap: wrap; row-gap: 2px; font-size: 12px; }
  .hzs { width: 18px; height: 10px; border-radius: 2px; background: repeating-linear-gradient(135deg, var(--c) 0 2px, #fff 2px 5px); box-shadow: inset 0 0 0 1px var(--c); flex: none; }
  .drs b .e { font-size: 12px; font-weight: 600; }
  .dr-i { display: inline-flex; align-items: center; gap: 3px; height: 22px; padding: 0 7px; border-radius: 11px; background: #fff; white-space: nowrap; }
  .jg { position: relative; width: 132px; height: 6px; border-radius: 2px; background: #fff; box-shadow: inset 0 0 0 1px var(--trait); flex: none; }
  .jg i { position: absolute; display: block; }
  .jz { top: 0; bottom: 0; background: repeating-linear-gradient(135deg, #8a909b 0 1.5px, transparent 1.5px 4px); }
  .jm { top: -4px; width: 3px; height: 14px; border-radius: 2px; background: var(--encre); }
  .tab { display: flex; flex-direction: column; margin-top: 2px; }
  .th { position: relative; height: 14px; font-size: 12px; color: var(--gris); }
  .ths { position: absolute; top: 0; transform: translateX(-50%); white-space: nowrap; }
  .ths .v { color: var(--gris); }
  .rp.cp { background: none; border-radius: 0; border-top: 1px solid var(--trait); }
  .rp.cp > .rp-s { padding: 5px 0; align-items: flex-start; }
  .rp.cp.ouvert { background: var(--doux); border-radius: 4px; }
  .rp.cp > .preuve { padding: 0 4px 8px; }
  .cps { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; }
  .rp.st16 .fas { color: var(--gris); }
  .cp > summary { display: flex; flex-direction: column; gap: 3px; padding: 5px 0 5px; }
  .l1, .l2 { display: flex; align-items: center; gap: 6px; min-width: 0; }
  .cn { font-weight: 600; font-size: 14px; }
  .ch { margin-left: auto; color: var(--gris); white-space: nowrap; }
  .ch .v { color: var(--gris); }
  .rt { margin-left: auto; display: inline-flex; align-items: center; gap: 3px; white-space: nowrap; }
  .rt .v { font-weight: 600; color: var(--encre); }
  .cp.hs .rt .v { color: var(--acc); }
  body.abs .cp.hs .rt .v { color: var(--encre); }
  .cp[open] { background: var(--doux); border-radius: 4px; padding: 0 4px; }
  .lg-v i { display: inline-block; }
  .lg-fer { width: 30px; height: 4px; border-radius: 2px; background: #e4e4ea; }
  .lg-b24, .lg-b13, .lg-b3p { width: 14px; height: 10px; } .lg-b24 { background: var(--c); border-radius: 2px 0 0 2px; } .lg-b13 { background: color-mix(in srgb, var(--c) 30%, #fff); } .lg-b3p { background: repeating-linear-gradient(135deg, var(--c) 0 2px, #fff 2px 5px); box-shadow: inset 0 0 0 1px var(--c); border-radius: 0 2px 2px 0; }
  .lg-jg { width: 30px; height: 6px; border-radius: 2px; background: repeating-linear-gradient(135deg, #8a909b 0 1.5px, #fff 1.5px 4px); box-shadow: inset 0 0 0 1px var(--trait); }
  .lg-zn { width: 30px; height: 5px; background: var(--z); border-radius: 2px 0 0 2px; box-shadow: 2px 0 0 var(--t); }
  .lg-sl { width: 2px; height: 14px; background: #9a9aa6; }
  .lg-bh { width: 24px; height: 3px; border-radius: 2px; background: var(--c); } .lg-bt { width: 30px; height: 5px; border-radius: 2px; background: var(--c); } .lg-ct { width: 2px; height: 9px; background: var(--encre); margin-left: -16px; }
  .lg-hs { width: 24px; height: 5px; border-radius: 2px; background: var(--acc); }
  .st16 summary { font-size: 12px; }`;

const js = `
document.querySelectorAll('[data-scen]').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('[data-scen]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
  document.querySelectorAll('[data-scenario]').forEach((s) => { s.hidden = s.dataset.scenario !== b.dataset.scen; });
}));
if (/[?&]idaho\\b/.test(location.search)) document.querySelector('[data-scen="idaho7"]').click();
`;

ecrire(path.join(S.ICI, 'etat.html'), page({ titre: 'Dry hop, planificateur', commentaire: 'Lot 20 · d1 · généré par generateur-d1.mjs depuis les sorties du moteur (fils19-choix/donnees), fiches-h.json et le stock du prototype ; ne pas éditer à la main.', css, corps, js }));
