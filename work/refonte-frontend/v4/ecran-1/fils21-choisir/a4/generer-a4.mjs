// Lot 21 · a4 · « Le gramme suivant » : combien rapporte un gramme de plus ? Une petite courbe par famille,
// la dose en abscisse (1, 2, 4, 8 g/L, la grille du moteur), la zone du style en fond, la plage simulée en
// bande ; un curseur de dose traverse toutes les courbes à la fois, et chaque famille dit ce que la dose
// suivante ajoute. À côté, la courbe MESURÉE de Cascade (E04) et la part de linalol extraite qui baisse
// avec la dose : la saturation n'est pas une idée du moteur, elle est mesurée. Les deux houblons ensemble
// partagent la même saturation (lien vers la paire). Usage : node generer-a4.mjs → a4/etat.html
import * as S from '../a1/socle.mjs';
const { R, ico, esc, leg } = S;
const E04 = R.comparatifs.etudes.find((e) => e.id === 'E04');
const OHAI = E04.mesures.filter((m) => /OHAI/.test(m.descripteur || '')).map((m) => [m.dose_gL, m.valeur]);
const LIN = E04.mesures.filter((m) => /linalol, part/.test(m.compose || '')).map((m) => [m.dose_gL, m.valeur]);
const donnees = S.tranche({ grille: (g) => g.jours === 3 && (g.moment === 'dryPost' || g.moment === 'dryActive'), paires: (p) => p.levure !== 'lalbrew-verdant-ipa' });
const HOPS = ['Citra', 'Galaxy', 'Idaho 7', 'Cascade', 'Motueka', 'Nelson Sauvin'];
const corps = `
  ${S.entete('Le gramme suivant', 'dry hop 3 j · Stout export 16D')}
  <div class="outils">${S.lentille()}
    <div class="seg" role="radiogroup" aria-label="Moment du dry hop"><button role="radio" data-role="reglage" data-moment="actif" aria-checked="true">${ico('j-cuve-a', 14)}actif</button><button role="radio" data-role="reglage" data-moment="apres" aria-checked="false">${ico('j-cuve-p', 14)}après</button></div>
  </div>
  <section class="carte dz" data-role="ajout" aria-label="Le houblon et sa dose">
    <div class="ah" data-voie="1" data-role="ligne-houblon"><span class="ah-i"></span></div>
    <label class="cur"><span class="cur-v" data-role="dose-v"></span>
      <input type="range" min="0" max="3" step="1" value="1" data-role="reglage" aria-label="Dose en g/L : 1, 2, 4 ou 8">
      <span class="cur-t" aria-hidden="true"><i>1</i><i>2</i><i>4</i><i>8 g/L</i></span></label>
    <div class="rg lev" role="radiogroup" aria-label="Levure"><span class="rg-l">${ico('j-levure', 14)}levure</span>${['us05', 'pomona'].map((id) => `<button class="rg-b" role="radio" data-role="reglage" data-reglage="levure" data-levure="${id}" aria-checked="${id === 'us05'}">${esc(R.levures[id].nom)}</button>`).join('')}</div>
    <div class="avec" data-role="avec"></div>
    <p class="vraies" data-role="vraies"></p>
  </section>
  <section class="carte" data-role="simulation" aria-label="Les courbes simulées, une par famille">
    <div class="ct"><span class="sv">~ simulé</span><span class="cf cf-simule" data-role="confiance"></span><span class="dr gris">sur 100 · dose en g/L</span></div>
    <p class="repo" data-role="reponse"></p>
    <div class="sm" data-role="courbes"></div>
    <p class="drp" data-role="biotransformation"></p>
  </section>
  <section class="carte" aria-label="La saturation mesurée">
    <div class="ct">Mesuré : la saturation existe<span class="dr"><span class="cf cf-panel">panel</span></span></div>
    <div class="sm sm1" data-role="mesure"></div>
    <p class="phr">Cascade, panel entraîné, 24 h (E04) : l’intensité globale (0 à 15) ralentit dès 4 g/L ; la part de linalol extraite passe de <span class="mv" data-nature="mesure" data-source="E04, texte">${LIN[0][1]} %</span> à <span class="mv" data-nature="mesure" data-source="E04, texte">${LIN[1][1]} %</span> entre ${LIN[0][0]} et ${LIN[1][0]} g/L.</p>
    <p class="src-l"><span class="a-verif">à trancher</span> agrumes ou herbacé : lequel plafonne ? les deux lectures du tableau 3 divergent (H, recherche J).</p>
  </section>`;

const css = `
  .dz { gap: 6px; }
  .ah { display: flex; align-items: center; gap: 6px; min-height: 32px; flex-wrap: wrap; }
  .ah-i { display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap; flex: 1; }
  .ah .hv { margin-left: auto; }
  .ch { position: relative; width: 28px; height: 28px; border-radius: 14px; background: #ececf1; display: inline-flex; align-items: center; justify-content: center; flex: none; }
  .ch select { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; font-size: 16px; }
  .ch:focus-within { outline: 2px solid #1d4ed8; outline-offset: 2px; }
  .cur { display: grid; grid-template-columns: 74px 1fr; grid-template-rows: auto auto; align-items: center; column-gap: 8px; }
  .cur-v { grid-row: 1 / 3; font: 600 18px var(--mono); }
  .cur input { width: 100%; height: 32px; accent-color: var(--encre); margin: 0; }
  .cur-t { display: flex; justify-content: space-between; font: 400 12px var(--mono); color: var(--gris); padding: 0 6px; }
  .cur-t i { font-style: normal; }
  .lev .rg-l { display: inline-flex; align-items: center; gap: 3px; }
  .avec { font-size: 12px; color: var(--gris); display: flex; gap: 4px; align-items: center; flex-wrap: wrap; }
  .vraies { font-size: 12px; color: var(--gris); border-top: 1px solid var(--trait); padding-top: 5px; display: flex; flex-wrap: wrap; gap: 4px 8px; align-items: center; }
  .repo { font-size: 14px; font-weight: 600; line-height: 1.3; }
  .repo .sv { font-size: 14px; }
  .repo .pi { display: inline-block; vertical-align: -3px; }
  .sm { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 6px; }
  .sm1 { grid-template-columns: minmax(0, 1fr); }
  .mc { border-radius: 4px; padding: 3px 4px 4px; background: #fbfbfc; box-shadow: inset 0 0 0 1px #eceef2; display: flex; flex-direction: column; gap: 1px; min-width: 0; }
  .mc-h { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: var(--t); min-height: 18px; }
  .mc-h .sv { margin-left: auto; font-size: 13px; color: var(--encre); }
  .mc > svg { display: block; width: 100%; height: auto; }
  .mc-h .pi { width: 14px; height: 14px; }
  .mc-g { font-size: 12px; color: var(--gris); display: flex; gap: 3px; align-items: center; min-height: 16px; }
  .mc-g .sv { font-size: 12px; color: var(--encre); }
  .mc.hors .mc-h::after { content: 'hors du style'; font-size: 12px; font-weight: 600; color: #9a3412; margin-left: 4px; }
  .mc.rien { background: repeating-linear-gradient(135deg, #fff 0 4px, #f1f2f5 4px 7px); }
  .drp { font-size: 12px; color: var(--gris); display: flex; gap: 4px; align-items: center; flex-wrap: wrap; }
  .drp .pi { display: inline-block; vertical-align: -3px; }
`;

const js = `
const { R, H, L, J, esc, fr0, fr1, picto, ico, sim, mes, conf, texte, seul, paire, profil, usage, alpha, stock, nom, COURT, NOM } = V;
const HOPS = ${JSON.stringify(HOPS)}, DOSES = [1, 2, 4, 8], OHAI = ${JSON.stringify(OHAI)};
const ETAT = { h: 'Citra', i: 1, moment: 'actif', levure: 'us05' };
const lent = () => (${S.lentilleCourante});
const choix = (n) => '<span class="ch">' + ico('i-chev-d', 14) + '<select data-role="reglage" aria-label="Changer le houblon">' + HOPS.map((h) => '<option' + (h === n ? ' selected' : '') + '>' + esc(h) + '</option>').join('') + '</select></span>';
const MOM = { actif: 'dryActive', apres: 'dryPost' };
// Une petite courbe : x = 1, 2, 4, 8 g/L (pas égaux, dose doublée à chaque pas), y = 0 à ymax.
function mini(f, pts, o) {
  const W = 168, Hh = 74, x0 = 6, x1 = W - 6, y0 = Hh - 4, ymax = o.ymax, X = (i) => x0 + i / 3 * (x1 - x0), Y = (v) => y0 - Math.min(v, ymax) / ymax * (y0 - 6);
  const top = V.top(f), zone = '<rect data-role="zone" x="' + x0 + '" y="' + Y(top).toFixed(1) + '" width="' + (x1 - x0) + '" height="' + (y0 - Y(top)).toFixed(1) + '" fill="' + J[f].fond + '"/><line x1="' + x0 + '" x2="' + x1 + '" y1="' + Y(top).toFixed(1) + '" y2="' + Y(top).toFixed(1) + '" stroke="' + J[f].texte + '" stroke-width="1.5"/>';
  const band = '<path d="M' + pts.map((p, i) => X(i).toFixed(1) + ',' + Y(p.haut).toFixed(1)).join(' L') + ' L' + pts.map((p, i) => [i, p]).reverse().map(([i, p]) => X(i).toFixed(1) + ',' + Y(p.bas).toFixed(1)).join(' L') + ' Z" fill="' + J[f].base + '" fill-opacity=".18" data-role="bande-simulee"/>';
  const ligne = '<polyline points="' + pts.map((p, i) => X(i).toFixed(1) + ',' + Y(p.centre).toFixed(1)).join(' ') + '" fill="none" stroke="' + J[f].base + '" stroke-width="2.5" stroke-linejoin="round"/>';
  const hors = pts.map((p, i) => (p.centre > top ? '<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(p.centre).toFixed(1) + '" r="3.5" fill="#c2410c"/>' : '<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(p.centre).toFixed(1) + '" r="3" fill="#fff" stroke="' + J[f].base + '" stroke-width="2"/>')).join('');
  const fl = pts.some((p) => p.haut > ymax) ? '<path d="M' + (x1 - 4) + ',8 l4,-6 l4,6 z" fill="#16161a"/>' : '';
  const cur = '<line x1="' + X(o.i).toFixed(1) + '" x2="' + X(o.i).toFixed(1) + '" y1="2" y2="' + y0 + '" stroke="#16161a" stroke-width="1.5" stroke-dasharray="3 2"/>';
  return '<svg viewBox="0 0 ' + W + ' ' + Hh + '" width="' + W + '" height="' + Hh + '" aria-hidden="true">' + zone + band + '<line x1="' + x0 + '" x2="' + x1 + '" y1="' + y0 + '" y2="' + y0 + '" stroke="#16161a" stroke-width="1.5"/>' + cur + ligne + hors + fl + '</svg>';
}
function redessiner() {
  const n = ETAT.h, m = MOM[ETAT.moment], d = DOSES[ETAT.i];
  document.querySelector('.ah .ah-i').innerHTML = nom(n) + choix(n) + usage(n) + alpha(n) + stock(n) + '<span class="hv">' + mes(fr1(V.hop(n).huile.min) + '–' + fr1(V.hop(n).huile.max) + ' mL/100 g', 'huile : ' + V.hop(n).huile.sources.join(', ')) + '</span>';
  document.querySelector('[data-role="dose-v"]').innerHTML = mes(fr1(d) + ' g/L', 'dose choisie (grille du moteur : 1, 2, 4, 8 g/L)');
  const es = DOSES.map((x) => seul({ nom: n, moment: m, dose: x, jours: 3, levure: ETAT.levure }));
  const ps = es.map((e) => profil(e)), cur = ps[ETAT.i];
  document.querySelector('[data-role="confiance"]').textContent = V.confiance(es[ETAT.i].confiance);
  const fams = V.P.ordre.filter((f) => !cur[f].rien && f !== 'resin' && Math.max(...ps.map((p) => p[f].delta)) >= 3);
  fams.sort((f, g) => ps[3][g].delta - ps[3][f].delta);
  const rien = V.P.ordre.filter((f) => cur[f].rien);
  const ymax = lent() === 'style' ? 60 : 100;
  // Le gramme suivant : de la dose choisie à la suivante, ce que chaque famille gagne.
  const next = Math.min(3, ETAT.i + 1), dn = DOSES[next];
  document.querySelector('[data-role="courbes"]').innerHTML = fams.map((f) => {
    const pts = ps.map((p) => ({ bas: p[f].bas, centre: p[f].centre, haut: p[f].haut })), g = ps[next][f].centre - cur[f].centre;
    return '<div class="mc' + (cur[f].horsStyle ? ' hors' : '') + '" data-famille="' + f + '" style="--t:' + J[f].texte + '"><span class="mc-h">' + picto(f, 14) + COURT[f] + sim(fr0(cur[f].centre), { aria: NOM[f] + ' à ' + d + ' g/L : ' + fr0(cur[f].centre) + ' sur 100 (simulé), de ' + fr0(cur[f].bas) + ' à ' + fr0(cur[f].haut) }) + '</span>' + mini(f, pts, { ymax, i: ETAT.i }) +
      '<span class="mc-g">' + (ETAT.i < 3 ? 'à ' + dn + ' g/L ' + sim(V.sgn(g)) + ' <span>(' + sim(fr1(g / (dn - d)), {}) + ' par g/L)</span>' : 'au bout de la grille') + '</span></div>';
  }).join('') + (rien.length ? '<div class="mc rien"><span class="mc-h" style="--t:#3d3d44">' + conf('inconnu', 'rien de simulé') + '</span><span class="mc-g">' + rien.map((f) => picto(f, 14) + COURT[f]).join(' ') + ' : pas une absence</span></div>' : '');
  const tot = (i) => fams.reduce((s, f) => s + ps[i][f].delta, 0);
  const nf = Math.max(1, fams.length), g1 = ETAT.i < 3 ? (tot(next) - tot(ETAT.i)) / (dn - d) / nf : null, g0 = tot(0) / nf;
  document.querySelector('[data-role="reponse"]').innerHTML = ETAT.i < 3 ? 'De ' + d + ' à ' + dn + ' g/L, chaque gramme rapporte ' + sim(fr1(g1)) + ' point par famille, contre ' + sim(fr1(g0)) + ' pour le tout premier gramme.' : 'De 4 à 8 g/L, le dernier pas de la grille : ' + sim(fr1((tot(3) - tot(2)) / 4 / nf)) + ' point par gramme et par famille, contre ' + sim(fr1(g0)) + ' pour le tout premier gramme.';
  // Les vraies valeurs de la dose : charge d'huile, saturation, et la paire à la même dose totale.
  const h = V.hop(n).huile;
  document.querySelector('[data-role="vraies"]').innerHTML = 'huile ' + mes(fr1(d * h.min) + '–' + fr1(d * h.max) + ' mL/hL', 'dose × huile publiée') + ' · saturation ' + mes('4–8 g/L', 'E04 (Cascade), H22') + (d >= 4 ? ' <b>atteinte</b>' : '') + (d >= 8 ? ' · ' + conf('inconnu', 'hop creep plus fort ?') : '');
  const autre = n === 'Citra' ? 'Galaxy' : 'Citra', pr = paire({ a: n, b: autre, moment: m, levure: ETAT.levure }), s4 = profil(seul({ nom: n, moment: m, dose: 4, jours: 3, levure: ETAT.levure }));
  document.querySelector('[data-role="avec"]').innerHTML = pr ? 'À 4 g/L au total : ' + esc(n) + ' + ' + nom(autre, 'span') + ' 2 + 2 g/L, agrumes ' + sim(fr0(V.lire(pr.apres.citrus).centre)) + ' ; ' + esc(n) + ' seul 4 g/L, ' + sim(fr0(s4.citrus.centre)) + ' : la saturation se partage.' : '';
  const ref = ETAT.levure !== 'us05' && ETAT.moment === 'actif' ? profil(seul({ nom: n, moment: m, dose: d, jours: 3, levure: 'us05' })) : null;
  document.querySelector('[data-role="biotransformation"]').innerHTML = ETAT.moment !== 'actif' ? 'Après fermentation : aucune biotransformation simulée ' + conf('inconnu', 'peu documenté') : ETAT.levure === 'pomona' ? picto('floral', 14) + 'géraniol → citronellol' + picto('citrus', 14) + conf('fournisseur', 'Pomona « medium »') + ' agrumes ' + sim(V.sgn(cur.citrus.centre - ref.citrus.centre)) + ' à cette dose' : 'US-05 : biotransformation à 0 au centre ' + conf('inconnu', 'non documentée');
  // La courbe mesurée (E04), sur les mêmes pas de dose.
  const Wm = 340, Hm = 80, X = (dd) => 8 + (dd <= 0 ? 0 : Math.log2(dd) + 1) / 5 * (Wm - 16), Y = (v) => Hm - 16 - v / 15 * (Hm - 26);
  document.querySelector('[data-role="mesure"]').innerHTML = '<div class="mc"><span class="mc-h" style="--t:#16161a">Cascade, intensité globale (0 à 15)' + '<span class="mv" data-nature="mesure" data-source="E04, Lafontaine et Shellhammer 2018, tableau 3" style="margin-left:auto">' + OHAI.map((p) => String(p[1]).replace('.', ',')).join(' · ') + '</span></span><svg viewBox="0 0 ' + Wm + ' ' + Hm + '" width="' + Wm + '" height="' + Hm + '" role="img" aria-label="Mesuré : intensité globale de Cascade ' + OHAI.map((p) => p[0] + ' g/L ' + p[1]).join(', ') + '"><line x1="8" x2="' + (Wm - 8) + '" y1="' + (Hm - 16) + '" y2="' + (Hm - 16) + '" stroke="#16161a" stroke-width="1.5"/><line x1="' + X(d).toFixed(1) + '" x2="' + X(d).toFixed(1) + '" y1="4" y2="' + (Hm - 16) + '" stroke="#16161a" stroke-width="1.5" stroke-dasharray="3 2"/><polyline points="' + OHAI.filter((p) => p[0] > 0).map((p) => X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1)).join(' ') + '" fill="none" stroke="#16161a" stroke-width="2"/>' + OHAI.filter((p) => p[0] > 0).map((p) => '<circle cx="' + X(p[0]).toFixed(1) + '" cy="' + Y(p[1]).toFixed(1) + '" r="3.2" fill="#16161a"/>').join('') + [1, 2, 4, 8, 16].map((dd) => '<text x="' + X(dd).toFixed(1) + '" y="' + (Hm - 3) + '" text-anchor="middle" font-size="12" fill="#55555f" font-family="IBM Plex Mono, monospace">' + dd + '</text>').join('') + '</svg></div>';
}
window.redessiner = redessiner;
document.addEventListener('input', (e) => { if (e.target.matches('input[type="range"]')) { ETAT.i = +e.target.value; redessiner(); } });
document.addEventListener('change', (e) => { if (e.target.matches('select')) { ETAT.h = e.target.value; redessiner(); } });
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-role="reglage"]'); if (!b || b.tagName === 'SELECT' || b.tagName === 'INPUT') return;
  if (b.dataset.moment) { ETAT.moment = b.dataset.moment; document.querySelectorAll('[data-moment]').forEach((x) => x.setAttribute('aria-checked', String(x === b))); }
  else if (b.dataset.levure) { ETAT.levure = b.dataset.levure; document.querySelectorAll('[data-levure]').forEach((x) => x.setAttribute('aria-checked', String(x === b))); }
  redessiner();
});
redessiner();
`;
S.page({
  fichier: S.D21 + '/a4/etat.html',
  titre: 'Le gramme suivant',
  description: 'Lot 21 · a4 : la dose sur la grille du moteur (1, 2, 4, 8 g/L), une courbe simulée par famille, ce que rapporte le gramme suivant, et la saturation mesurée (E04). Générée par a4/generer-a4.mjs (../a1/socle.mjs).',
  css, corps, js, donnees,
  legende: [S.LEG_FAMILLES, S.LEG_NATURE, ['Courbes', [
    leg.li('<i class="lg-b" style="background:#fdf1e3;border-top:1.5px solid #9b5d0d"></i>', 'zone du style 16D'), leg.li('<i class="lg-b" style="background:#ee9b2f;opacity:.35"></i>', 'bande : plage simulée'),
    leg.li('<svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="4" fill="#c2410c"/></svg>', 'point orangé : hors du style'), leg.li('<i class="hl-legr" style="border-left:2px dashed #16161a"></i>', 'pointillé : ta dose'),
  ], 'l2'], S.LEG_HOUBLON],
});
