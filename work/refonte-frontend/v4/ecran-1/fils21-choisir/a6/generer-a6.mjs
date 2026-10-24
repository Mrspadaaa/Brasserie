// Lot 21 · a6 · « Ensemble ou à la suite ? » : le brasseur, « combinaison de 3j dryhopping Citra, 7j dry
// hopping Galaxy ; 3j citra - 5j idao7 […] C'est extrêmement complexe à voir ce qui est vraiment
// faisable », et « l'ajout cumulé ». Sur le calendrier du brassin, jour par jour (parJour des cas K3 et K5
// du moteur), les deux façons de faire : les deux houblons d'un coup, ou l'un après l'autre. Puis « combien
// de jours de contact ? » sur la grille (1 à 7 j). Les études à leur jour (24 h, 2 j, 3 j, 1 h ≈ 96 h).
// Usage : node generer-a6.mjs → a6/etat.html
import * as S from '../a1/socle.mjs';
const { R, ico, esc, leg } = S;
const donnees = S.tranche({ cas: (c) => c.groupe === 'K3' || /^K5-citra\+(galaxy|idaho-7)-apres-us05$/.test(c.id), grille: (g) => g.dose_gL === 4 && g.jours != null && (g.nom === 'Citra' || g.nom === 'Galaxy' || g.nom === 'Idaho 7') });
const AJS = R.ajoutsSuccessifs, DUR = R.duree;
const E10 = R.comparatifs.etudes.find((e) => e.id === 'E10'), E08 = R.comparatifs.etudes.find((e) => e.id === 'E08');
const FAMS = ['tropical', 'citrus', 'floral', 'stoneFruit'];
const corps = `
  ${S.entete('Ensemble ou à la suite ?', 'deux dry hops après fermentation · 16D')}
  <div class="outils">${S.lentille()}
    <div class="seg" role="radiogroup" aria-label="La paire"><button role="radio" data-role="reglage" data-paire="galaxy" aria-checked="true">+ Galaxy</button><button role="radio" data-role="reglage" data-paire="idaho7" aria-checked="false">+ Idaho 7</button></div>
  </div>
  <section class="carte" data-role="ajout" aria-label="Les deux façons de faire">
    <div class="pl2" data-role="plans"></div>
  </section>
  <section class="carte" data-role="simulation" aria-label="Jour par jour, simulé">
    <div class="ct"><span class="sv">~ simulé</span>jour par jour<span class="dr fams" role="radiogroup" aria-label="Famille suivie">${FAMS.map((f, i) => `<button class="fb" role="radio" data-role="reglage" data-fam="${f}" aria-checked="${i === 0}" style="--t:${S.J[f].texte}">${S.picto(f, 14)}${S.COURT[f]}</button>`).join('')}</span></div>
    <p class="repo" data-role="reponse"></p>
    <div class="tl" data-role="calendrier"></div>
    <div class="tf" data-role="final"></div>
    <p class="drp" data-role="drapeaux"></p>
  </section>
  <section class="carte" aria-label="Ce que disent les études">
    <div class="ct">Ce que disent les études</div>
    <div class="vr">
      <div class="vr-i"><span class="cf cf-etude">étude</span><span>Deux ajouts contre un (Centennial) : plus d’intensité sur six attributs en pilote, écart presque nul à l’échelle industrielle <span class="gris">(H76)</span>.</span></div>
      <div class="vr-i"><span class="cf cf-inconnu">inconnu</span><span>L’ordre (Citra puis Galaxy, ou l’inverse) : aucune étude ; et si le second s’extrait dans une bière déjà « saturée » <span class="gris">(H)</span>.</span></div>
      <div class="vr-i"><span class="cf cf-etude">étude</span><span>L’essentiel est extrait en 24 h ; au-delà de 3 j, rien de plus mesuré <span class="gris">(H73)</span>. Eureka! : l’essentiel en 2 jours <span class="gris">(E08)</span>.</span></div>
      <div class="vr-i"><span class="cf cf-panel">panel</span><span>Cascade <span class="mv" data-nature="mesure" data-source="E10, Titus et al.">1,43 g/L</span> : aucune différence perçue entre <span class="mv" data-nature="mesure" data-source="E10, Titus et al.">1 h</span> et <span class="mv" data-nature="mesure" data-source="E10, Titus et al.">96 h</span> dans une bière jeune <span class="gris">(E10)</span>.</span></div>
    </div>
  </section>
  <section class="carte" data-role="simulation" aria-label="Combien de jours de contact ?">
    <div class="ct"><span class="sv">~ simulé</span>Combien de jours de contact ?<span class="dr gris">4 g/L</span></div>
    <div class="cj">
      <div class="seg" role="radiogroup" aria-label="Houblon">${['Citra', 'Galaxy', 'Idaho 7'].map((h, i) => `<button role="radio" data-role="reglage" data-hj="${h}" aria-checked="${i === 0}">${h}</button>`).join('')}</div>
      <label class="cur"><span class="cur-v" data-role="jours-v"></span><input type="range" min="0" max="4" step="1" value="2" data-role="reglage" aria-label="Jours de contact : 1, 2, 3, 5 ou 7"><span class="cur-t" aria-hidden="true"><i>1</i><i>2</i><i>3</i><i>5</i><i>7 j</i></span></label>
      <div class="rg" role="radiogroup" aria-label="Levure, dry hop actif">${['us05', 'pomona'].map((l, i) => `<button class="rg-b" role="radio" data-role="reglage" data-reglage="levure" data-lj="${l}" aria-checked="${i === 0}">${esc(R.levures[l].nom)}</button>`).join('')}<span class="rg-l">dry hop actif</span></div>
    </div>
    <div class="jr" data-role="jours"></div>
    <p class="drp" data-role="biotransformation"></p>
  </section>`;

const css = `
  .outils { align-items: center; }
  .pl2 { display: flex; flex-direction: column; gap: 6px; }
  .pp { display: grid; grid-template-columns: 74px 1fr; gap: 6px; align-items: center; }
  .pp-n { font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; }
  .pp-n .k { display: inline-block; width: 18px; height: 0; border-top: 2.5px solid var(--encre); }
  .pp-n .k.pt { border-top-style: dashed; }
  .pp-l { position: relative; height: 34px; }
  .pp-b { position: absolute; height: 15px; border-radius: 2px; display: flex; align-items: center; gap: 3px; padding: 0 4px; font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; }
  .pp-b .hn { font-size: 12px; }
  .pp-b.m-plein { background: #16161a; color: #fff; } .pp-b.m-plein .hn, .pp-b.m-plein .mv { color: #fff; }
  .hw { display: inline-flex; align-items: center; gap: 4px; }
  .hw .hn { font-size: 12px; }
  .pp-b.m-raye { background: repeating-linear-gradient(135deg, #e6e7ec 0 3px, #fff 3px 6px); box-shadow: inset 0 0 0 1.5px #16161a; color: var(--encre); }
  .pp-ax { position: absolute; left: 0; right: 0; bottom: -2px; height: 1px; background: #c4c6ce; }
  .ct .fams { gap: 3px; flex-wrap: wrap; justify-content: flex-end; }
  .fb { min-height: 26px; padding: 0 6px 0 4px; border-radius: 13px; display: inline-flex; align-items: center; gap: 3px; font-size: 12px; font-weight: 600; color: var(--t); background: #fff; box-shadow: inset 0 0 0 1px #d5d7de; }
  .fb[aria-checked="true"] { box-shadow: inset 0 0 0 2px var(--encre); }
  .repo { font-size: 14px; font-weight: 600; line-height: 1.35; }
  .repo .sv { font-size: 14px; }
  .tl svg { display: block; width: 100%; height: auto; }
  .tf { display: grid; grid-template-columns: 1fr auto auto; gap: 2px 10px; font-size: 12px; align-items: center; }
  .tf .h { color: var(--gris); }
  .tf .n { display: inline-flex; align-items: center; gap: 4px; font-weight: 600; color: var(--t); font-size: 13px; }
  .tf .sv { text-align: right; }
  .drp { font-size: 12px; color: var(--gris); display: flex; gap: 4px; align-items: center; flex-wrap: wrap; }
  .drp .pi { display: inline-block; vertical-align: -3px; }
  .vr { display: flex; flex-direction: column; gap: 6px; font-size: 13px; line-height: 1.3; }
  .vr-i { display: flex; gap: 6px; align-items: flex-start; }
  .cj { display: flex; flex-direction: column; gap: 6px; }
  .cur { display: grid; grid-template-columns: 60px 1fr; grid-template-rows: auto auto; align-items: center; column-gap: 8px; }
  .cur-v { grid-row: 1 / 3; font: 600 18px var(--mono); }
  .cur input { width: 100%; height: 32px; accent-color: var(--encre); margin: 0; }
  .cur-t { display: flex; justify-content: space-between; font: 400 12px var(--mono); color: var(--gris); padding: 0 6px; }
  .cur-t i { font-style: normal; }
  .jr { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px 10px; }
  .jr-i { display: flex; flex-direction: column; gap: 2px; }
  .jr-h { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: var(--t); }
  .jr-h .sv { margin-left: auto; color: var(--encre); font-size: 13px; }
  .jr-i > svg { display: block; width: 100%; height: auto; }
  .jr-h .pi { width: 14px; height: 14px; }
`;

const js = `
const { R, H, L, J, esc, fr0, fr1, picto, ico, sim, mes, conf, texte, seul, cas, profil, lire, nom, alpha, COURT, NOM } = V;
const ETAT = { paire: 'galaxy', fam: 'tropical', hj: 'Citra', ij: 2, lj: 'us05' };
const JOURS = [1, 2, 3, 5, 7];
const lent = () => (${S.lentilleCourante});
const ids = () => ETAT.paire === 'galaxy' ? ['K3-citra3-galaxy7', 'K5-citra+galaxy-apres-us05'] : ['K3-citra3-idaho7-5', 'K5-citra+idaho-7-apres-us05'];
function plans(cs) {
  const d0 = 7, d1 = 18, X = (j) => ((j - d0) / (d1 - d0) * 100).toFixed(1) + '%';
  return cs.map((c, k) => '<div class="pp"><span class="pp-n"><i class="k' + (k ? ' pt' : '') + '"></i>' + (k ? 'ensemble' : 'à la suite') + '</span><span class="pp-l">' + c.ajouts.map((a, i) => '<span class="pp-b ' + (i ? 'm-raye' : 'm-plein') + '" style="left:' + X(a.jourDebut) + ';width:calc(' + X(a.jourDebut + a.jours) + ' - ' + X(a.jourDebut) + ');top:' + (i * 17) + 'px">' + nom(a.nom, 'span') + ' ' + mes(a.jours + ' j', 'moteur : cas ' + c.id) + '</span>').join('') + '<i class="pp-ax"></i></span></div>').join('') +
    '<div class="pp"><span></span><span class="gris" style="display:flex;justify-content:space-between;font:400 12px var(--mono)"><span>J+7</span><span>J+10</span><span>J+14</span><span>J+17</span></span></div>' +
    '<p class="gris">Chacun ' + mes('2 g/L', 'moteur : doses des cas K3 et K5') + ' · ' + cs[0].ajouts.map((a, i) => '<span class="hw" data-voie="' + (i + 1) + '">' + nom(a.nom, 'span') + ' ' + alpha(a.nom) + '</span>').join(' · ') + '</p>';
}
// Le calendrier : x = jour du brassin (J+7 à J+17), y = la famille suivie, sur 100 (au style : 0 à 5 crans).
function calendrier(cs) {
  const f = ETAT.fam, W = 350, Hh = 170, x0 = 28, x1 = W - 8, y0 = Hh - 22, ymax = lent() === 'style' ? V.cran(f) * 5 : 100;
  const X = (j) => x0 + (j - 7) / 10 * (x1 - x0), Y = (v) => y0 - Math.min(v, ymax) / ymax * (y0 - 8);
  let s = '<rect data-role="zone" x="' + x0 + '" y="' + Y(V.top(f)).toFixed(1) + '" width="' + (x1 - x0) + '" height="' + (y0 - Y(V.top(f))).toFixed(1) + '" fill="' + J[f].fond + '"/><line x1="' + x0 + '" x2="' + x1 + '" y1="' + Y(V.top(f)).toFixed(1) + '" y2="' + Y(V.top(f)).toFixed(1) + '" stroke="' + J[f].texte + '" stroke-width="1.5"/><text x="' + (x0 + 3) + '" y="' + (Y(V.top(f)) - 3).toFixed(1) + '" font-size="12" fill="' + J[f].texte + '">haut du style 16D</text>';
  // Les repères des études, à leur jour (à partir du premier ajout, J+7).
  const rep = [[8, '24 h'], [9, '2 j'], [10, '3 j']];
  for (const [j, t] of rep) s += '<line x1="' + X(j).toFixed(1) + '" x2="' + X(j).toFixed(1) + '" y1="8" y2="' + y0 + '" stroke="#aeb3be" stroke-width="1" stroke-dasharray="2 3"/><text x="' + (X(j) + 2).toFixed(1) + '" y="18" font-size="12" fill="#55555f">' + t + '</text>';
  cs.forEach((c, k) => {
    const pts = c.parJour.map((p) => [p.jourRecette, lire(p.familles[f])]);
    s += '<path d="M' + pts.map(([j, x]) => X(j).toFixed(1) + ',' + Y(x.haut).toFixed(1)).join(' L') + ' L' + pts.slice().reverse().map(([j, x]) => X(j).toFixed(1) + ',' + Y(x.bas).toFixed(1)).join(' L') + ' Z" fill="' + J[f].base + '" fill-opacity="' + (k ? 0.1 : 0.16) + '"/>';
    s += '<polyline points="' + pts.map(([j, x]) => X(j).toFixed(1) + ',' + Y(x.centre).toFixed(1)).join(' ') + '" fill="none" stroke="#16161a" stroke-width="2.5"' + (k ? ' stroke-dasharray="6 4"' : '') + ' stroke-linejoin="round"/>';
    const last = pts[pts.length - 1][1];
    s += '<text x="' + (x1 - 2) + '" y="' + (Y(last.centre) + (k ? 14 : -5)).toFixed(1) + '" text-anchor="end" font-size="12" fill="#16161a" font-family="IBM Plex Mono, monospace">~' + fr0(last.centre) + '</text>';
  });
  s += '<line x1="' + x0 + '" x2="' + x1 + '" y1="' + y0 + '" y2="' + y0 + '" stroke="#16161a" stroke-width="1.5"/>' + [7, 10, 14, 17].map((j) => '<text x="' + X(j).toFixed(1) + '" y="' + (Hh - 6) + '" text-anchor="' + (j === 17 ? 'end' : j === 7 ? 'start' : 'middle') + '" font-size="12" fill="#55555f" font-family="IBM Plex Mono, monospace">J+' + j + '</text>').join('');
  const fin = cs.map((c) => lire(c.parJour[c.parJour.length - 1].familles[f]));
  return '<svg viewBox="0 0 ' + W + ' ' + Hh + '" width="' + W + '" height="' + Hh + '" data-nature="simule" role="img" aria-label="' + NOM[f] + ', jour par jour, simulé : à la suite ~' + fr0(fin[0].centre) + ', ensemble ~' + fr0(fin[1].centre) + ' sur 100 à J+17">' + s + '</svg>';
}
function redessiner() {
  const cs = ids().map((id) => cas(id)), f = ETAT.fam;
  document.querySelector('[data-role="plans"]').innerHTML = plans(cs);
  document.querySelector('[data-role="calendrier"]').innerHTML = calendrier(cs);
  // Le jour où chaque plan atteint son niveau final (à 1 point près).
  const atteint = (c) => { const fin = lire(c.parJour[c.parJour.length - 1].familles[f]).centre; const p = c.parJour.find((q) => lire(q.familles[f]).centre >= fin - 1); return p ? p.jourRecette : null; };
  const fa = lire(cs[0].parJour[cs[0].parJour.length - 1].familles[f]).centre, fb = lire(cs[1].parJour[cs[1].parJour.length - 1].familles[f]).centre;
  const ja = atteint(cs[0]), jb = atteint(cs[1]), b = cs[0].ajouts[1];
  document.querySelector('[data-role="reponse"]').innerHTML = (Math.abs(fa - fb) < 1 ? 'Même niveau à la fin ' + sim(fr0(fa)) : 'À la fin : ' + sim(fr0(fa)) + ' à la suite, ' + sim(fr0(fb)) + ' ensemble') + ' ; à la suite, atteint ' + sim('J+' + ja) + ' au lieu de ' + sim('J+' + jb) + ', et ' + esc(b.nom) + ' reste ' + mes(b.jours + ' j', 'moteur : cas ' + cs[0].id) + ' au contact.';
  // La fin, famille par famille, et la saturation partagée dans les deux cas.
  const P0 = profil(cs[0]), P1 = profil(cs[1]);
  const fams = V.P.ordre.filter((g) => !P0[g].rien && g !== 'resin' && Math.max(P0[g].delta, P1[g].delta) >= 3);
  document.querySelector('[data-role="final"]').innerHTML = '<span class="h">à J+17</span><span class="h">à la suite</span><span class="h">ensemble</span>' + fams.map((g) => '<span class="n" style="--t:' + J[g].texte + '">' + picto(g, 14) + COURT[g] + '</span>' + sim(fr0(P0[g].centre)) + sim(fr0(P1[g].centre))).join('');
  const sat = cs[0].saturation.facteur[f];
  document.querySelector('[data-role="drapeaux"]').innerHTML = conf('estime', 'saturation partagée') + ' ' + picto(f, 14) + COURT[f].toLowerCase() + ' ' + sim(Math.round(sat * 100) + ' %') + ' de la somme de chacun seul, dans les deux cas · ' + conf('inconnu', 'ordre') + conf('inconnu', 'synergie') + conf('inconnu', 'masquage') + ' · ' + conf('inconnu', 'au-delà de 3 j : végétal, hop creep ?');
  jours();
}
function jours() {
  const n = ETAT.hj, j = JOURS[ETAT.ij];
  document.querySelector('[data-role="jours-v"]').innerHTML = mes(j + ' j', 'jours de contact choisis (grille du moteur)');
  const es = JOURS.map((x) => seul({ nom: n, moment: 'dryActive', dose: 4, jours: x, levure: ETAT.lj }));
  const fams = ['citrus', 'tropical', 'floral', 'green'];
  document.querySelector('[data-role="jours"]').innerHTML = fams.map((f) => {
    const v = es.map((e) => lire(e.apres[f])), W = 160, Hh = 48, X = (i) => 6 + i / 4 * (W - 12), ym = Math.max(30, ...v.map((x) => x.centre)) * 1.15, Y = (c) => Hh - 4 - c / ym * (Hh - 10);
    return '<div class="jr-i" style="--t:' + J[f].texte + '"><span class="jr-h">' + picto(f, 14) + COURT[f] + sim(fr0(v[ETAT.ij].centre)) + '</span><svg viewBox="0 0 ' + W + ' ' + Hh + '" width="' + W + '" height="' + Hh + '" aria-hidden="true"><line x1="6" x2="' + (W - 6) + '" y1="' + (Hh - 4) + '" y2="' + (Hh - 4) + '" stroke="#16161a" stroke-width="1.5"/><line x1="' + X(ETAT.ij).toFixed(1) + '" x2="' + X(ETAT.ij).toFixed(1) + '" y1="2" y2="' + (Hh - 4) + '" stroke="#16161a" stroke-width="1.5" stroke-dasharray="3 2"/><polyline points="' + v.map((x, i) => X(i).toFixed(1) + ',' + Y(x.centre).toFixed(1)).join(' ') + '" fill="none" stroke="' + J[f].base + '" stroke-width="2.5"/>' + v.map((x, i) => '<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(x.centre).toFixed(1) + '" r="2.6" fill="' + J[f].base + '"/>').join('') + '</svg></div>';
  }).join('');
  const e = es[ETAT.ij], dr = (e.drapeaux || []).includes('duree-longue');
  const ref = ETAT.lj !== 'us05' ? seul({ nom: n, moment: 'dryActive', dose: 4, jours: j, levure: 'us05' }) : null;
  document.querySelector('[data-role="biotransformation"]').innerHTML = (dr ? conf('inconnu', 'au-delà de 3 j') + ' rien de plus dans le moteur ; végétal et hop creep : drapeaux sans chiffre · ' : 'Le moteur plafonne à 3 j (τ 2–12 h) · ') + (ETAT.lj === 'pomona' ? picto('floral', 14) + 'Pomona : géraniol → citronellol' + picto('citrus', 14) + ' agrumes ' + sim(V.sgn(lire(e.apres.citrus).centre - lire(ref.apres.citrus).centre)) + ' ' + conf('fournisseur') : 'US-05 : biotransformation à 0 au centre ' + conf('inconnu', 'non documentée'));
}
window.redessiner = redessiner;
document.addEventListener('input', (e) => { if (e.target.matches('input[type="range"]')) { ETAT.ij = +e.target.value; jours(); } });
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-role="reglage"]'); if (!b || b.tagName === 'INPUT') return;
  const grp = (k) => document.querySelectorAll('[data-' + k + ']').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
  if (b.dataset.paire) { ETAT.paire = b.dataset.paire; grp('paire'); }
  else if (b.dataset.fam) { ETAT.fam = b.dataset.fam; grp('fam'); }
  else if (b.dataset.hj) { ETAT.hj = b.dataset.hj; grp('hj'); }
  else if (b.dataset.lj) { ETAT.lj = b.dataset.lj; grp('lj'); }
  redessiner();
});
redessiner();
`;
S.page({
  fichier: S.D21 + '/a6/etat.html',
  titre: 'Ensemble ou à la suite',
  description: 'Lot 21 · a6 : deux dry hops ensemble ou l’un après l’autre, jour par jour sur le calendrier du brassin (cas K3 et K5 du moteur), puis combien de jours de contact (grille). Générée par a6/generer-a6.mjs (../a1/socle.mjs).',
  css, corps, js, donnees,
  legende: [S.LEG_FAMILLES, S.LEG_NATURE, ['Calendrier', [
    leg.li('<i class="k" style="display:inline-block;width:18px;border-top:2.5px solid #16161a"></i>', 'trait plein : à la suite'), leg.li('<i class="k" style="display:inline-block;width:18px;border-top:2.5px dashed #16161a"></i>', 'tirets : ensemble'),
    leg.li('<i class="lg-b" style="background:#ee9b2f;opacity:.3"></i>', 'bande : plage simulée'), leg.li('<i class="lg-b" style="background:#fdf1e3;border-top:1.5px solid #9b5d0d"></i>', 'zone du style 16D'),
    leg.li('<i class="lg-b" style="background:#16161a"></i>', 'plein : 1er houblon'), leg.li('<i class="lg-b" style="background:repeating-linear-gradient(135deg,#e6e7ec 0 3px,#fff 3px 6px);box-shadow:inset 0 0 0 1.5px #16161a"></i>', 'rayé : 2nd houblon'),
  ], 'l2'], S.LEG_HOUBLON],
});
