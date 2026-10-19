// Lot 21 · a1 · « Deux houblons, un dry hop » : qui apporte quoi, et pourquoi le total n'est pas la somme.
// Le brasseur : « Aussi explore la voie de l'ajout cumulé. 2 houblons en dry hopping. Et la bio Transfo et
// la levure ». Une ligne par famille (le nom se lit), la part de chaque houblon en motif (plein, rayé), la
// part de la levure en hachures, la somme de chacun seul en pointillé : l'écart, c'est la saturation
// partagée. Tout le simulé vient du moteur profil-simule (grillePaires, grille, cas K5) ; les vraies
// valeurs à côté : α, huile, dose, la saturation MESURÉE (E04), le rapport au seuil des cas K5 en bande
// log, la mesure publiée, et les trous de la recherche J. Usage : node generer-a1.mjs → a1/etat.html
import * as S from './socle.mjs';
const { R, ico, esc, leg } = S;
const H = R.houblons;
const E04 = R.comparatifs.etudes.find((e) => e.id === 'E04');
const OHAI = E04.mesures.filter((m) => /OHAI/.test(m.descripteur || '')).map((m) => [m.dose_gL, m.valeur]);
const LIN = E04.mesures.filter((m) => /linalol, part/.test(m.compose || '')).map((m) => [m.dose_gL, m.valeur]);
const E01 = R.comparatifs.etudes.find((e) => e.id === 'E01'), E06 = R.comparatifs.etudes.find((e) => e.id === 'E06');
const linE01 = E01.mesures.find((m) => /linalol/.test(m.compose || '')), linE06 = E06.mesures.find((m) => m.variete === 'Citra' && m.compose === 'linalol');
const HOPS = ['Citra', 'Galaxy', 'Idaho 7', 'Cascade', 'Motueka', 'Nelson Sauvin'];
const donnees = S.tranche({
  paires: (p) => p.doses_gL[0] === 2,
  grille: (g) => g.dose_gL === 4 && g.jours === 3 && (g.moment === 'dryPost' || g.moment === 'dryActive'),
  cas: (c) => c.groupe === 'K5',
});

// La courbe MESURÉE de l'intensité globale de Cascade (E04, 24 h, 0 à 15) : les deux lectures du tableau 3
// (H et J) s'accordent sur cette ligne ; elles divergent sur « agrumes » et « herbacé/thé ».
function courbe() {
  const W = 330, Hh = 92, X = (d) => 26 + d / 16 * (W - 40), Y = (v) => Hh - 16 - v / 15 * (Hh - 26);
  const pts = OHAI.map(([d, v]) => `${X(d).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  const dots = OHAI.map(([d, v]) => `<circle cx="${X(d).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="3.2" fill="#16161a" stroke="#fff" stroke-width="1.5"/><text x="${X(d).toFixed(1)}" y="${(Y(v) - 7).toFixed(1)}" text-anchor="middle" font-size="12" fill="#16161a" font-family="IBM Plex Mono, monospace">${String(v).replace('.', ',')}</text>`).join('');
  const ax = [0, 2, 4, 8, 16].map((d) => `<text x="${X(d).toFixed(1)}" y="${Hh - 2}" text-anchor="middle" font-size="12" fill="#55555f" font-family="IBM Plex Mono, monospace">${d}</text>`).join('');
  return `<svg class="sat-g" width="${W}" height="${Hh}" viewBox="0 0 ${W} ${Hh}" data-nature="mesure" data-source="E04, Lafontaine et Shellhammer 2018, tableau 3 (OHAI, 0–15)" role="img" aria-label="Intensité aromatique globale de Cascade mesurée par un panel (0 à 15) : ${OHAI.map(([d, v]) => d + ' g/L : ' + v).join(', ')}">
    <rect x="${X(4).toFixed(1)}" y="6" width="${(X(8) - X(4)).toFixed(1)}" height="${Hh - 22}" fill="#eef0f4"/>
    <line x1="${X(0)}" y1="${Hh - 16}" x2="${W - 8}" y2="${Hh - 16}" stroke="#aeb3be" stroke-width="1"/>
    <g data-role="sat-reperes"></g>
    <polyline points="${pts}" fill="none" stroke="#16161a" stroke-width="2" stroke-linejoin="round"/>${dots}${ax}
    <text x="${W - 8}" y="${Hh - 20}" text-anchor="end" font-size="12" fill="#55555f">g/L</text>
  </svg>`;
}
const choixJs = "const HOPS = " + JSON.stringify(HOPS) + "; const choix = (slot, def) => '<span class=\"ch\">' + ico('i-chev-d', 14) + '<select class=\"hs-sel\" data-role=\"reglage\" data-reglage=\"ajout-cumule\" data-slot=\"' + slot + '\" aria-label=\"Changer le ' + (slot === 'a' ? 'premier' : 'second') + ' houblon\">' + HOPS.map((n) => '<option' + (n === def ? ' selected' : '') + '>' + esc(n) + '</option>').join('') + '</select></span>';";
const corps = `
  ${S.entete('Deux houblons, un dry hop', 'Stout export 16D · Nugget 60′')}
  <div class="outils">${S.lentille()}
    <div class="seg" role="radiogroup" aria-label="Moment du dry hop"><button role="radio" class="mo-b" data-role="reglage" data-moment="actif" aria-checked="true">${ico('j-cuve-a', 14)}actif</button><button role="radio" class="mo-b" data-role="reglage" data-moment="apres" aria-checked="false">${ico('j-cuve-p', 14)}après</button></div>
  </div>
  <section class="carte ajout" data-role="ajout" aria-label="Le dry hop : deux houblons ensemble, 3 jours">
    <div class="ah" data-voie="1" data-role="ligne-houblon" data-slot="a"><i class="sw m-plein" aria-hidden="true"></i><span class="ah-i"></span></div>
    <div class="ah" data-voie="2" data-role="ligne-houblon" data-slot="b"><i class="sw m-raye" aria-hidden="true"></i><span class="ah-i"></span></div>
    <div class="tot" data-role="total"></div>
  </section>
  <div class="rg lev" role="radiogroup" aria-label="Levure"><span class="rg-l">${ico('j-levure', 14)}levure</span>${['us05', 'pomona', 'verdant'].map((id) => `<button class="rg-b" role="radio" data-role="reglage" data-reglage="levure" data-levure="${id}" aria-checked="${id === 'us05'}">${esc(R.levures[id].nom)}</button>`).join('')}</div>
  <section class="carte" data-role="simulation" aria-label="Profil simulé de la bière après le dry hop">
    <div class="ct"><span class="sv">~ simulé</span><span class="cf cf-simule" data-role="confiance"></span><span class="dr"><span class="cle"></span></span></div>
    <div class="hls" data-role="lignes"></div>
    <p class="bio-l" data-role="biotransformation"></p>
    <div class="reste" data-role="reste"></div>
    <div class="rg"><button class="rg-b cmp-b" data-role="reglage" aria-pressed="false">${ico('i-equal', 14)}chacun seul à 4 g/L</button></div>
    <div class="seuls" data-role="seuls" hidden></div>
  </section>
  <section class="carte" aria-label="Le total n'est pas la somme : la saturation mesurée">
    <div class="ct">Doubler la dose ne double pas l’arôme<span class="dr"><span class="cf cf-panel">panel</span></span></div>
    <div class="sat">${courbe()}</div>
    <p class="phr">Intensité globale de Cascade (0 à 15), panel entraîné, 24 h (E04). <b class="sat-k"></b> La part de linalol extraite passe de <span class="mv" data-nature="mesure" data-source="E04, Lafontaine et Shellhammer 2018, texte">${LIN[0][1]} %</span> à <span class="mv" data-nature="mesure" data-source="E04, Lafontaine et Shellhammer 2018, texte">${LIN[1][1]} %</span> entre ${LIN[0][0]} et ${LIN[1][0]} g/L.</p>
    <p class="phr" data-role="sat-moteur"></p>
    <p class="src-l"><span class="a-verif">à trancher</span> Le même tableau 3 se lit de deux façons : agrumes qui plafonnent (H) ou herbacé qui plafonne (recherche J). Le moteur suit H.</p>
  </section>
  <section class="carte" aria-label="Ce qu'on ne sait pas">
    <div class="ct">Ce qu’on ne sait pas</div>
    <div class="inc-g">
      <span class="inc-i"><span class="cf cf-inconnu">inconnu</span><span><b>Synergie</b> : additive ou synergique en mélange modèle, pas en bière ; le moteur additionne (H67, H72).</span></span>
      <span class="inc-i"><span class="cf cf-inconnu">inconnu</span><span><b>Masquage</b> d’un houblon par l’autre, ou par la stout : aucune étude (H).</span></span>
      <span class="inc-i"><span class="cf cf-inconnu">inconnu</span><span><b>Aucune étude</b> ne compare Citra et Cascade en bière à dose égale ; aucune chiffrée pour Galaxy ; une seule pour Idaho 7 ; aucune ne croise variété, levure et dry hop (recherche J).</span></span>
    </div>
  </section>
  <section class="carte" data-role="vraies" aria-label="Les vraies valeurs : rapport au seuil et mesures en bière">
    <div class="ct">Rapport au seuil, pas une intensité<span class="dr"><span class="cf cf-estime">calcul du moteur</span></span></div>
    <div class="rap" data-role="rapports"></div>
    <p class="phr">Mesuré en bière, linalol : Citra <span class="mv" data-nature="mesure" data-source="E06, Feng, Qian et Qian, diapositive 17">${String(linE06.valeur).replace('.', ',')} µg/L</span> <span class="gris">(dose non publiée, E06)</span> ; cinq bières à cru <span class="mv" data-nature="mesure" data-source="E01, Kankolongo Cibaka et al. 2017, résumé">${linE01.valeur.replace('-', '–')} µg/L</span> <span class="gris">(E01)</span>.</p>
    <p class="src-l" data-role="lin-moteur"></p>
  </section>`;

const css = `
  .outils { align-items: center; }
  .mo-b { gap: 3px; }
  .ajout { gap: 4px; padding: 6px 10px 8px; }
  .ah { display: flex; align-items: center; gap: 6px; min-height: 32px; flex-wrap: wrap; border-radius: 4px; }
  .ah.appui { transform: scale(.985); }
  .ah-i { display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap; min-width: 0; flex: 1; }
  .ch { position: relative; width: 28px; height: 28px; border-radius: 14px; background: #ececf1; display: inline-flex; align-items: center; justify-content: center; flex: none; }
  .ch select { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; font-size: 16px; }
  .ch:focus-within { outline: 2px solid #1d4ed8; outline-offset: 2px; }
  .hs-sel-old { min-height: 32px; padding: 0 26px 0 10px; border-radius: 16px; border: 0; background: #ececf1 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2316161a' stroke-width='3' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 9px center; -webkit-appearance: none; appearance: none; font: 600 14px var(--sans); color: var(--encre); }
  .hs-sel:focus-visible { outline: 2px solid #1d4ed8; outline-offset: 2px; }
  .ah .hv { margin-left: auto; display: inline-flex; gap: 6px; align-items: center; }
  .tot { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--gris); border-top: 1px solid var(--trait); padding-top: 5px; flex-wrap: wrap; }
  .tot .mv { font-size: 12px; }
  .tot .zs { display: inline-flex; align-items: center; gap: 4px; }
  .tot-j { position: relative; width: 96px; height: 10px; flex: none; }
  .tot-j i { position: absolute; top: 3px; height: 4px; }
  .tot-j .t0 { left: 0; right: 0; background: #e3e5eb; border-radius: 2px; }
  .tot-j .tz { background: #c4c6ce; }
  .tot-j .tv { top: 0; width: 3px; height: 10px; border-radius: 1px; background: var(--encre); margin-left: -1.5px; }
  .lev { padding: 0 2px; }
  .lev .rg-l { display: inline-flex; align-items: center; gap: 3px; }
  .ct .cle { display: inline-flex; gap: 8px; font-size: 12px; font-weight: 400; color: var(--gris); flex-wrap: wrap; }
  .ct .cle span { display: inline-flex; align-items: center; gap: 3px; }
  .ct .cle .sw { width: 10px; height: 10px; }
  .hl { grid-template-columns: 92px var(--w) 1fr; }
  .hl-v { display: inline-flex; flex-direction: column; align-items: flex-end; line-height: 13px; }
  .hl-pl { font: 400 12px var(--mono); color: var(--gris); }
  .hls::before { content: 'sur 100 · plage'; align-self: flex-end; font-size: 12px; color: var(--gris); margin-bottom: -2px; }
  .hl-r.prev { border-left: 2px dashed #8a909b; }
  .hl.change .hl-v .sv { background: #fff4c2; border-radius: 2px; }
  @media (prefers-reduced-motion: no-preference) { .hl.change .hl-v .sv { animation: eclat 1.2s ease-out; } }
  @keyframes eclat { from { background: #ffe066; } to { background: #fff4c2; } }
  .bio-l { font-size: 12px; color: var(--encre); display: flex; flex-wrap: wrap; gap: 4px; align-items: center; line-height: 1.3; }
  .bio-l .bt2 { display: inline-flex; align-items: center; gap: 3px; flex-wrap: wrap; }
  .bio-l:empty { display: none; }
  .reste { display: flex; flex-direction: column; gap: 3px; font-size: 12px; color: var(--gris); }
  .reste .rl { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
  .reste .pi { width: 14px; height: 14px; }
  .reste b { color: var(--encre); font-weight: 600; }
  .rl-f { display: inline-flex; align-items: center; gap: 2px; margin-right: 4px; color: var(--encre); }
  .hors-t { color: #9a3412 !important; font-weight: 600; }
  .seuls { display: flex; flex-direction: column; gap: 3px; border-top: 1px solid var(--trait); padding-top: 6px; }
  .se-h, .se-r { display: grid; grid-template-columns: 1fr 74px 74px 74px; align-items: center; gap: 4px; font-size: 12px; }
  .se-h span { display: inline-flex; align-items: center; justify-content: flex-end; gap: 2px; color: var(--gris); white-space: nowrap; overflow: hidden; }
  .se-h .sw { width: 9px; height: 9px; }
  .se-r .sv, .se-r .gris { text-align: right; }
  .se-n { display: inline-flex; align-items: center; gap: 4px; font-weight: 600; color: var(--t); font-size: 13px; }
  .sat-g { display: block; max-width: 100%; }
  .inc-g { display: flex; flex-direction: column; gap: 6px; font-size: 13px; line-height: 1.3; }
  .inc-i { display: flex; gap: 6px; align-items: flex-start; }
  .inc-i b { font-weight: 600; }
  .rap { display: flex; flex-direction: column; gap: 6px; }
  .rp { display: grid; grid-template-columns: 104px 1fr; gap: 6px; align-items: center; }
  .rp-n { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; min-width: 0; }
  .rp-n b { font-weight: 600; color: var(--t); font-size: 13px; }
  .rp-n .rp-c { font-size: 12px; color: var(--gris); display: block; }
  .rp .bl { --w: 226px; }
  .hl-a.deg, .vb-a.deg { background: repeating-linear-gradient(135deg, #8a909b 0 2px, #c4c6ce 2px 4px); }
  .hl-fl { position: absolute; right: -6px; top: 3px; border: 5px solid transparent; border-left: 6px solid var(--encre); border-right: 0; z-index: 4; }
  .hl-inc { white-space: nowrap; font-weight: 600; }
`;

const js = `
${choixJs}
const { R, H, L, J, esc, fr0, fr1, frx, picto, ico, sim, mes, conf, CONFIANCE, texte, seul, paire, cas, profil, rapports, bandeLog, ligne, usage, alpha, stock, nom, motif, COURT, NOM, LEV, MOM } = V;
const ETAT = { a: 'Citra', b: 'Galaxy', moment: 'actif', levure: 'us05', comparer: false };
let AVANT = null;
const lent = () => (${S.lentilleCourante});
const ohai = ${JSON.stringify(OHAI)};
const huile = (n) => { const h = V.hop(n).huile; return mes(fr1(h.min) + '–' + fr1(h.max) + ' mL/100 g', 'huile : ' + h.sources.join(', '), { aria: 'huile totale de ' + n + ' : ' + fr1(h.min) + ' à ' + fr1(h.max) + ' mL/100 g' }); };
function redessiner() {
  const A = ETAT.a, B = ETAT.b, m = MOM[ETAT.moment];
  // Le même houblon deux fois : pas une paire du moteur ; le second change.
  if (A === B) { ETAT.b = B === 'Galaxy' ? 'Citra' : 'Galaxy'; return redessiner(); }
  for (const [s, n] of [['a', A], ['b', B]]) document.querySelector('.ah[data-slot="' + s + '"] .ah-i').innerHTML = nom(n) + choix(s, n) + usage(n) + alpha(n) + stock(n) + '<span class="hv">' + huile(n) + '</span>';
  const p = paire({ a: A, b: B, moment: m, levure: ETAT.levure }), ref = paire({ a: A, b: B, moment: m, levure: 'us05' });
  const tot = 4, X = (d) => Math.min(96, d / 16 * 96);
  document.querySelector('[data-role="total"]').innerHTML = mes('2 + 2 g/L', 'moteur : grillePaires, doses 2 + 2 g/L') + ' · ' + mes('3 j', 'moteur : grillePaires, 3 j') + ' · total ' + mes('4 g/L', 'somme des doses') +
    '<span class="zs"><span class="tot-j" aria-hidden="true"><i class="t0"></i><i class="tz" style="left:' + X(4) + 'px;width:' + (X(8) - X(4)) + 'px"></i><i class="tv" style="left:' + X(tot) + 'px"></i></span>saturation ' + mes('4–8 g/L', 'E04 (Cascade), H22') + '</span>';
  const s = profil(p, { ref, ordre: [A, B] });
  document.querySelector('[data-role="confiance"]').textContent = V.confiance(p.confiance);
  document.querySelector('.ct .cle').innerHTML = '<span>' + motif(0) + esc(A) + '</span><span>' + motif(1) + esc(B) + '</span>' + (ETAT.levure !== 'us05' && ETAT.moment === 'actif' ? '<span><i class="k-bio"></i>levure</span>' : '') + '<span><i class="k-som"></i>chacun seul</span>';
  // Chacun seul à 4 g/L (grille du moteur ; Verdant n'y est pas).
  const sA = seul({ nom: A, moment: m, dose: 4, jours: 3, levure: ETAT.levure }), sB = seul({ nom: B, moment: m, dose: 4, jours: 3, levure: ETAT.levure });
  const pA = sA && profil(sA), pB = sB && profil(sB);
  const len = lent(), fams = V.P.ordre;
  const bouge = fams.filter((f) => !s[f].rien && (Math.abs(s[f].delta) >= 1 || s[f].horsStyle));
  bouge.sort((f, g) => s[g].delta - s[f].delta);
  document.querySelector('[data-role="lignes"]').innerHTML = bouge.map((f) => ligne(f, s[f], { lentille: len, somme: true, w: 168, reperes: [
    ...(ETAT.comparer && pA ? [{ v: pA[f].centre }] : []), ...(ETAT.comparer && pB ? [{ v: pB[f].centre, cls: 'b' }] : []),
    ...(AVANT && Math.abs(AVANT[f].centre - s[f].centre) > 0.5 ? [{ v: AVANT[f].centre, cls: 'prev' }] : []),
  ] }).replace('class="hl', AVANT && Math.abs(AVANT[f].centre - s[f].centre) > 0.5 ? 'class="hl change' : 'class="hl')).join('');
  const rien = fams.filter((f) => s[f].rien), calme = fams.filter((f) => !s[f].rien && !bouge.includes(f)), hors = bouge.filter((f) => s[f].horsStyle);
  const nomsF = (l) => l.map((f) => '<span class="rl-f">' + picto(f, 14) + COURT[f] + '</span>').join(' ');
  const deg = V.P.biere.degustation;
  document.querySelector('[data-role="reste"]').innerHTML =
    (hors.length ? '<span class="rl"><b class="hors-t">Hors du style 16D</b> ' + nomsF(hors) + '</span>' : '<span class="rl"><b>Dans le style 16D</b></span>') +
    (hors.includes('resin') ? '<span class="rl">' + picto('resin', 14) + 'Résineux : ta dégustation ' + mes('« marqué »', 'dégustation du ' + deg.date + ' : « ' + deg.citation + ' »', { cls: 'mot' }) + ', déjà au-dessus</span>' : '') +
    (rien.length ? '<span class="rl">' + conf('inconnu', 'rien de simulé') + ' ' + nomsF(rien) + '</span>' : '') +
    (calme.length ? '<span class="rl"><b>≈ inchangé</b> ' + nomsF(calme) + '</span>' : '');
  // Un seul houblon à 4 g/L contre la paire (même dose totale).
  const SE = document.querySelector('[data-role="seuls"]');
  SE.hidden = !ETAT.comparer;
  if (ETAT.comparer) {
    const c = (x) => (x ? sim(fr0(x.centre)) : '<span class="gris">hors grille</span>');
    SE.innerHTML = '<div class="se-h"><span></span><span>' + motif(0) + motif(1) + 'ensemble</span><span>' + motif(0) + esc(A) + '</span><span>' + motif(1) + esc(B) + '</span></div>' +
      bouge.slice(0, 4).map((f) => '<div class="se-r" style="--t:' + J[f].texte + '"><span class="se-n">' + picto(f, 14) + COURT[f] + '</span>' + c(s[f]) + c(pA && pA[f]) + c(pB && pB[f]) + '</div>').join('') +
      '<p class="src-l">sur 100 ; la paire à 2 + 2 g/L contre chacun seul à 4 g/L, même dose totale' + (sA ? '' : ' ; ' + esc(L[ETAT.levure].nom) + ' : pas dans la grille d’un houblon seul') + '</p>';
  }
  // La levure : la biotransformation, en familles, avec son mot de confiance.
  const lv = L[ETAT.levure], K5 = cas('K5-' + [A, B].map((n) => n.toLowerCase().replace(/ /g, '-')).join('+') + '-' + ETAT.moment + '-' + ETAT.levure);
  let b = '';
  const gain = (f) => s[f].bio;
  if (ETAT.moment === 'actif' && ETAT.levure === 'pomona') b = '<span class="bt2">' + picto('floral', 14) + 'géraniol → citronellol' + picto('citrus', 14) + conf('fournisseur', 'fournisseur « medium »') + ' agrumes ' + sim(V.sgn(gain('citrus'))) + ', floral ' + sim(V.sgn(gain('floral'))) + '</span>';
  else if (ETAT.moment === 'actif' && ETAT.levure === 'verdant') b = '<span class="bt2">précurseurs → thiols' + picto('citrus', 14) + picto('tropical', 14) + conf('estime', 'rendement 0,1 %') + ' agrumes ' + sim(V.sgn(gain('citrus'))) + ', tropical ' + sim(V.sgn(gain('tropical'))) + '</span>';
  else if (ETAT.moment === 'actif') b = '<span class="bt2">' + picto('floral', 14) + 'US-05 : géraniol → citronellol et thiols ' + conf('inconnu', 'non documentés') + ' le moteur met 0 au centre, la plage garde le possible</span>';
  else b = '<span class="bt2">Après fermentation : le moteur ne simule aucune biotransformation ' + conf('inconnu', 'peu documenté') + '</span>';
  if (lv.estersFam.length) b += ' <span class="bt2">esters de sa fiche : ' + lv.estersFam.map((f) => picto(f, 14)).join('') + esc(lv.esters) + ' ' + conf('fournisseur') + ' non simulés</span>';
  if (K5 && K5.biotransformation && K5.biotransformation.actif) { const pa = K5.biotransformation.parAjout.filter((x) => x.raison); if (pa.length) b += ' <span class="bt2">' + conf('inconnu') + esc(texte(pa[0].raison).split(';')[0]) + '</span>'; }
  document.querySelector('.bio-l').innerHTML = b;
  // Sur la courbe mesurée : chaque houblon seul (2 g/L), puis la paire ensemble (4 g/L).
  { const Xs = (d) => 26 + Math.min(16, d) / 16 * (330 - 40);
    const rep = (d, pt, t) => '<line x1="' + Xs(d).toFixed(1) + '" y1="6" x2="' + Xs(d).toFixed(1) + '" y2="76" stroke="#16161a" stroke-width="1.5"' + (pt ? ' stroke-dasharray="3 3"' : '') + '/><text x="' + (Xs(d) + 3).toFixed(1) + '" y="14" font-size="12" fill="#16161a">' + t + '</text>';
    document.querySelector('[data-role="sat-reperes"]').innerHTML = rep(2, 1, 'seul') + rep(4, 0, 'ensemble');
    const v = (d) => ohai.find((x) => x[0] === d)[1], g1 = 6.3 - 3, g2 = 8.1 - 3;
    document.querySelector('.sat-k').innerHTML = 'De 2 à 3,86 g/L : ×' + fr1(g2 / g1) + ', pas ×2.';
    const fs = Object.entries(p.facteurSaturation || {}).filter(([f, x]) => x != null && x < 0.95).sort((x, y) => x[1] - y[1]).slice(0, 2);
    document.querySelector('[data-role="sat-moteur"]').innerHTML = fs.length ? 'Le moteur, pour ' + esc(A) + ' + ' + esc(B) + ' : ensemble, ' + fs.map(([f, x]) => picto(f, 14) + COURT[f].toLowerCase() + ' ' + sim(Math.round(x * 100) + ' %')).join(', ') + ' de la somme de chacun seul.' : ''; }
  // Les vraies valeurs : rapport au seuil, en bande log (cas K5 du moteur seulement).
  const raps = rapports(K5).filter((r) => ['linalol', '4MMP (4MSP)', 'myrcène'].includes(r.compose));
  const AX = V.axeLog(raps.map((r) => r.plage));
  document.querySelector('[data-role="rapports"]').innerHTML = raps.length ? raps.map((r) => '<div class="rp" style="--t:' + J[r.famille].texte + '"><span class="rp-n">' + picto(r.famille, 16) + '<span><b>' + COURT[r.famille] + '</b><span class="rp-c">' + esc(r.compose) + '</span></span></span>' + bandeLog(r.plage, { w: 226, lo: AX.lo, hi: AX.hi, src: 'moteur pouvoir, cas ' + K5.id + ' : ' + r.source, aria: COURT[r.famille] + ', ' + r.compose + ', rapport au seuil' }) + '</div>').join('')
    : '<p class="gris">Le moteur ne calcule le rapport au seuil que pour Citra avec Galaxy, Idaho 7 ou Cascade (cas K5). ' + conf('inconnu', 'pas pour cette paire') + '</p>';
  const lin = K5 && K5.mesures.find((x) => x.ajout === 'recette' && x.compose === 'linalol');
  document.querySelector('[data-role="lin-moteur"]').innerHTML = lin && lin.concentration.plage ? 'Le moteur, linalol de la paire : ' + sim(fr0(lin.concentration.plage.central) + ' µg/L') + ' au centre (' + sim(fr0(lin.concentration.plage.min) + '–' + fr0(lin.concentration.plage.max)) + ') : son centre est au-dessus des mesures publiées.' : '';
  AVANT = s;
}
window.redessiner = redessiner;
document.addEventListener('change', (e) => { const sl = e.target.closest('select[data-slot]'); if (!sl) return; ETAT[sl.dataset.slot] = sl.value; redessiner(); });
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-role="reglage"]'); if (!b || b.tagName === 'SELECT') return;
  if (b.dataset.moment) { ETAT.moment = b.dataset.moment; document.querySelectorAll('[data-moment]').forEach((x) => x.setAttribute('aria-checked', String(x === b))); }
  else if (b.dataset.levure) { ETAT.levure = b.dataset.levure; document.querySelectorAll('[data-levure]').forEach((x) => x.setAttribute('aria-checked', String(x === b))); }
  else if (b.classList.contains('cmp-b')) { ETAT.comparer = !ETAT.comparer; b.setAttribute('aria-pressed', String(ETAT.comparer)); }
  redessiner();
});
redessiner(); AVANT = null; redessiner();
`;
S.page({
  fichier: S.D21 + '/a1/etat.html',
  titre: 'Deux houblons, un dry hop',
  description: 'Lot 21 · a1 : deux houblons ensemble dans le même dry hop (paires du moteur, 2 + 2 g/L, 3 j), la part de chacun par famille, la part de la levure, la somme de chacun seul, la comparaison à un seul houblon à 4 g/L. Générée par a1/generer-a1.mjs (socle.mjs, reel.mjs, donnees.mjs, vue.js).',
  css, corps, js, donnees,
  legende: [S.LEG_FAMILLES, S.LEG_NATURE, ['Lignes', [
    leg.li('<i class="sw m-plein"></i>', 'part du 1er houblon'), leg.li('<i class="sw m-raye"></i>', 'part du 2nd houblon'),
    leg.li('<i class="k-som"></i>', 'chacun seul, additionnés : l’écart est la saturation'), leg.li('<i class="k-bio"></i>', 'part de la levure (contre US-05)'),
    leg.li('<i class="hl-legz"></i>', 'zone du style 16D'), leg.li('<i class="hl-legx"></i>', 'orangé : hors du style'),
    leg.li('<i class="hl-legr"></i>', 'trait : chacun seul à 4 g/L'), leg.li('<i class="hl-legw"></i>', 'trait fin : plage simulée'),
    leg.li('<i class="lg-b" style="background:repeating-linear-gradient(135deg,#8a909b 0 2px,#c4c6ce 2px 4px)"></i>', 'gris : ta bière avant ; hachuré : ta dégustation'), leg.li('<i class="hl-legr" style="border-left:2px dashed #8a909b"></i>', 'pointillé gris : avant ton dernier toucher'),
  ], 'l2'], S.LEG_HOUBLON],
});
