// Lot 21 · a2b · « Ce que la levure en fait », relancée d'après le critique (SYNTHESE §2 ; critique/a.md) :
// la réponse d'a2 (« la levure pèse peu, le CO₂ emporte plus ») en trois colonnes de barres lisibles,
// famille par famille, sur une même échelle : ce que la cuve apporte, ce que la levure ajoute, ce que le
// CO₂ emporte. Les retouches communes du §3 : départ en dry hop actif avec US-05, le geste au premier
// écran, les données restent et l'explication part (à un toucher), aucun code sans mot, rien de barré.
// Chiffres : cas K4 du moteur profil-simule (profils-simules.json à 4,75 % vol.) ; a2 reste intacte.
// Usage : node a2b/generer-a2b.mjs → a2b/etat.html
import * as S from '../a1/socle.mjs';
const { R, ico, esc, leg } = S;
const H = R.houblons, L = R.levures;
const donnees = S.tranche({ cas: (c) => c.groupe === 'K4' || c.id === 'K3-citra3-galaxy7' || c.id === 'K5-citra+galaxy-apres-us05', grille: (g) => g.jours === 3 && g.moment === 'dryPost' && g.levure === 'fermentis-us05' && (g.nom === 'Citra' || g.nom === 'Cascade') });
const E04 = R.comparatifs.etudes.find((e) => e.id === 'E04');
const OHAI = E04.mesures.filter((m) => /OHAI/.test(m.descripteur || '')).map((m) => [m.dose_gL, m.valeur]);
const thPlage = R.bio.thiolsPrecurseurs;
const FAIT = {
  us05: 'esters faibles, biotransformation non publiée',
  pomona: `${S.picto('floral', 14)}géraniol→citronellol${S.picto('citrus', 14)}, medium`,
  verdant: 'β-lyase qualitative',
  diamond: 'plus de thiols mesurés, moins de fruité (Samia 2026)',
};
const corps = `
  ${S.entete('Ce que la levure en fait', 'Citra puis Idaho 7')}
  <div class="rg lv2" role="radiogroup" aria-label="Levure">${['us05', 'pomona', 'verdant', 'diamond'].map((id) => `<button class="rg-b" role="radio" data-role="reglage" data-reglage="levure" data-levure="${id}" aria-checked="${id === 'us05'}">${esc(L[id].nom.replace(' IPA', ''))}</button>`).join('')}</div>
  <div class="outils">
    <div class="seg" role="radiogroup" aria-label="Moment du dry hop"><button role="radio" data-role="reglage" data-moment="actif" aria-checked="true">${ico('j-cuve-a', 14)}actif</button><button role="radio" data-role="reglage" data-moment="apres" aria-checked="false">${ico('j-cuve-p', 14)}après</button></div>
    ${S.lentille()}
  </div>
  <p class="fait" data-role="fait" data-nature="mesure" data-source=""></p>
  <section class="carte aj" data-role="ajout" aria-label="Le dry hop : Citra, puis Idaho 7">
    <span class="hw" data-voie="1" data-role="ligne-houblon"><span data-h="a"></span></span>
    <span class="hw" data-voie="2" data-role="ligne-houblon"><span data-h="b"></span></span>
  </section>
  <section class="carte" data-role="simulation" aria-label="Ce que la cuve apporte, ce que la levure ajoute, ce que le CO₂ emporte">
    <p class="repo" data-role="reponse"></p>
    <div class="tc" data-role="colonnes"></div>
    <p class="pl3" data-role="replie"></p>
  </section>
  <section class="carte" data-role="simulation" aria-label="La bière au style">
    <div class="ct"><span class="sv">~simulé</span>Au style 16D<span class="dr gris">sur 100</span></div>
    <div class="vbs" data-role="barres"></div>
    <p class="deg" data-role="degustation"></p>
  </section>
  <section class="carte"><details class="pl2" data-role="origine">
    <summary>D’où ça vient${ico('i-chev-d', 16).replace('<svg', '<svg class="chev"')}</summary>
    <div class="vr" hidden>
      <div class="vr-i"><span class="cf cf-estime">convention</span><span>CO₂ : en fermentation active, le moteur garde la moitié des hydrocarbures (${S.picto('green', 14)}myrcène, ${S.picto('resin', 14)}humulène) ; la part qui part est celle de la colonne.</span></div>
      <div class="vr-i"><span class="cf cf-estime">convention</span><span>Levure : Pomona convertit 50 % du géraniol (H41) ; Verdant et Diamond libèrent 0,1 % des précurseurs en thiols (H42) ; US-05 : 0 au centre.</span></div>
      <div class="vr-i">${S.picto('floral', 16)}<span>Géraniol dans l’huile : Idaho 7 <span class="mv" data-nature="mesure" data-source="${esc(H.idaho7.ger.sources.join(', '))}">${String(H.idaho7.ger.min).replace('.', ',')}–${String(H.idaho7.ger.max).replace('.', ',')} %</span>, Citra <span class="mv" data-nature="mesure" data-source="${esc(H.citra.ger.sources.join(', '))}">${String(H.citra.ger.min).replace('.', ',')}–${String(H.citra.ger.max).replace('.', ',')} %</span>.</span></div>
      <div class="vr-i">${S.picto('tropical', 16)}<span>Précurseurs de Citra <span class="mv" data-nature="mesure" data-source="${esc(H.citra.precurseurs.sources.join(', '))}">≈ 23 mg/kg</span> ; libérés <span class="mv" data-nature="mesure" data-source="${esc(thPlage.sources.join(', '))}">${String(thPlage.plage[0]).replace('.', ',')}–${String(thPlage.plage[1]).replace('.', ',')} %</span> sur précurseur de synthèse ; Idaho 7 : non publiés.</span></div>
      <div class="vr-i">${S.picto('citrus', 16)}<span>Citronellol au-dessus de son seuil dans une bière à cru au Citra <span class="cf cf-mesure">mesuré</span> (E01).</span></div>
      <div class="vr-i"><span class="cf cf-inconnu">inconnu</span><span>Aucune mesure ne croise variété, levure et dry hop (recherche J).</span></div>
      <div class="vr-i"><span class="cf cf-mesure">mesuré</span><span>Hop creep si la levure vit : <span class="mv" data-nature="mesure" data-source="H68, Young et Fox 2025">+0,92 % vol.</span> à 10 g/L, 7 j, T-90 (H68) ; pour ce brassin, non chiffré.</span></div>
    </div>
  </details></section>
  <section class="carte"><details class="pl2" data-role="lecons">
    <summary>Quatre leçons de brasseur${ico('i-chev-d', 16).replace('<svg', '<svg class="chev"')}</summary>
    <ol class="lec" data-role="lecons-liste" hidden></ol>
  </details></section>`;

const css = `
  .lv2 { gap: 5px; }
  .lv2 .rg-b { flex: 1; justify-content: center; min-height: 34px; font-size: 14px; border-radius: 17px; }
  .outils { align-items: center; }
  .fait b { margin-right: 6px; } .pq { margin-right: 10px; display: inline-flex; gap: 3px; align-items: center; }
  .fait { font-size: 12px; color: var(--encre); display: flex; flex-wrap: wrap; gap: 3px; align-items: center; min-height: 18px; font-family: var(--sans); }
  .fait .pi { display: inline-block; vertical-align: -3px; }
  .aj { flex-direction: row; flex-wrap: wrap; gap: 4px 12px; padding: 6px 10px; align-items: center; }
  .hw { display: inline-flex; align-items: center; gap: 5px; min-height: 26px; border-radius: 4px; flex-wrap: wrap; }
  .hw > span { display: inline-flex; align-items: center; gap: 5px; flex-wrap: wrap; }
  .hw .q2 { font-size: 12px; color: var(--gris); }
  .repo { font-size: 15px; font-weight: 600; line-height: 1.35; }
  .repo .sv { font-size: 15px; }
  .tc { display: grid; grid-template-columns: 82px repeat(3, minmax(0, 1fr)); column-gap: 6px; row-gap: 5px; align-items: center; }
  .tc-h { font-size: 12px; font-weight: 600; line-height: 1.2; color: var(--encre); display: flex; flex-direction: column; gap: 1px; padding-bottom: 2px; border-bottom: 1px solid var(--trait); align-self: end; }
  .tc-h small { font-size: 12px; font-weight: 400; color: var(--gris); }
  .tc-h .sw2 { display: inline-block; width: 18px; height: 8px; border-radius: 2px; }
  .tc-n { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; color: var(--t); min-width: 0; white-space: nowrap; overflow: hidden; }
  .tc-c { display: flex; align-items: center; gap: 4px; min-width: 0; }
  .tc-p { position: relative; flex: 1; height: 12px; min-width: 0; }
  .tc-p::before { content: ''; position: absolute; left: 0; top: -2px; bottom: -2px; width: 1.5px; background: var(--encre); }
  .tc-b { position: absolute; left: 0; top: 1px; height: 10px; border-radius: 0 2px 2px 0; }
  .tc-b.cuve { background: var(--c); }
  .tc-b.lev { background: #fff; box-shadow: inset 0 0 0 1.5px var(--t); background-image: repeating-linear-gradient(0deg, var(--t) 0 1px, transparent 1px 3px); }
  .tc-b.co2 { background: #8a909b; }
  .tc-v { font: 500 12px var(--mono); min-width: 34px; text-align: right; color: var(--encre); }
  .tc-v.zero { color: var(--gris); }
  .tc-t { font-size: 12px; font-weight: 700; padding-top: 3px; border-top: 1px solid var(--trait); }
  .tc-t.tc-v { font-size: 13px; }
  .pl3 { font-size: 12px; color: var(--gris); display: flex; gap: 4px; flex-wrap: wrap; align-items: center; }
  .pl3 .pi { display: inline-block; vertical-align: -3px; }
  .deg { font-size: 12px; color: var(--gris); display: flex; gap: 4px; align-items: center; flex-wrap: wrap; }
  .deg .pi { display: inline-block; vertical-align: -3px; }
  .vbs { padding-top: 6px; }
  .vr { display: flex; flex-direction: column; gap: 6px; font-size: 13px; line-height: 1.3; padding-top: 6px; }
  .vr-i { display: flex; gap: 6px; align-items: flex-start; }
  .vr[hidden], .lec[hidden] { display: none; }
  .vr-i span .pi { display: inline-block; vertical-align: -3px; margin: 0 1px; }
  .lec { margin: 6px 0 0 18px; display: flex; flex-direction: column; gap: 6px; font-size: 13px; line-height: 1.3; }
  .lec b { font-weight: 600; }
  .lec .pi { display: inline-block; vertical-align: -3px; }
`;

const js = `
const { R, H, L, J, esc, fr0, fr1, picto, ico, sim, mes, conf, texte, cas, seul, profil, lire, colonne, usage, alpha, stock, nom, COURT, NOM } = V;
const ETAT = { levure: 'us05', moment: 'actif' };
const FAIT = ${JSON.stringify(FAIT)};
const SRC = ${JSON.stringify(Object.fromEntries(Object.entries(R.levures).map(([k, x]) => [k, x.sources.join(', ') + ' (fiche)'])))};
const OHAI = ${JSON.stringify(OHAI)};
const lent = () => (${S.lentilleCourante});
const somme = (c, f) => c.apportsParHoublon.reduce((s, h) => s + h.apport[f], 0);
// En crans du style (au style) ou en points sur 100 (absolu).
const unite = () => (lent() === 'style' ? { k: (f) => V.cran(f), u: 'crans', f: fr1 } : { k: () => 1, u: 'points', f: fr0 });
function colonnes() {
  const id = (lev, m) => 'K4-' + lev + '-' + m;
  const base = cas(id('us05', 'apres')), ref = cas(id('us05', ETAT.moment)), c = cas(id(ETAT.levure, ETAT.moment));
  const U = unite();
  // Pour chaque famille : la cuve (dry hop après, sans levure active), le CO₂ (ce que la fermentation active
  // emporte), la levure (ce qu'elle ajoute contre US-05) ; cuve − CO₂ + levure = la bière du moteur.
  const rows = V.P.ordre.map((f) => { const L0 = somme(base, f), co2 = Math.max(0, L0 - somme(ref, f)), lv = somme(c, f) - somme(ref, f); return { f, cuve: L0 / U.k(f), co2: co2 / U.k(f), lev: lv / U.k(f), rien: V.lire(c.apres[f]).centre === 0 && V.lire(c.apres[f]).haut === 0 }; });
  const fortes = rows.filter((r) => !r.rien && Math.max(r.cuve, Math.abs(r.lev), r.co2) >= (U.u === 'crans' ? 0.3 : 3)).sort((a, b) => b.cuve - a.cuve);
  const faibles = rows.filter((r) => !r.rien && !fortes.includes(r)), riens = rows.filter((r) => r.rien);
  const max = Math.max(...fortes.map((r) => r.cuve), 0.1);
  const cell = (cls, v, signe, f) => { const w = Math.max(0, Math.abs(v)) / max * 100; const z = Math.abs(v) < (U.u === 'crans' ? 0.05 : 0.5); return '<span class="tc-c"><span class="tc-p">' + (z ? '' : '<i class="tc-b ' + cls + '" style="width:' + w.toFixed(1) + '%"></i>') + '</span><span class="tc-v' + (z ? ' zero' : '') + '" data-nature="simule" aria-label="' + NOM[f] + ', ' + (cls === 'cuve' ? 'la cuve apporte' : cls === 'lev' ? 'la levure ajoute' : 'le CO₂ emporte') + ' : ' + (z ? '0' : signe + U.f(Math.abs(v))) + ' ' + U.u + ' (simulé)">' + (z ? '0' : signe + U.f(Math.abs(v))) + '</span></span>'; };
  const tot = (k) => rows.reduce((s, r) => s + r[k], 0);
  const sw = (bg) => '<i class="sw2" style="' + bg + '"></i>';
  document.querySelector('[data-role="colonnes"]').innerHTML =
    '<span class="tc-h"><small>en ' + U.u + '</small></span>' +
    '<span class="tc-h">' + sw('background:#e88d68') + 'la cuve apporte</span><span class="tc-h">' + sw('box-shadow:inset 0 0 0 1.5px #9b5d0d;background-image:repeating-linear-gradient(0deg,#9b5d0d 0 1px,transparent 1px 3px)') + 'la levure ajoute</span><span class="tc-h">' + sw('background:#8a909b') + 'le CO₂ emporte</span>' +
    fortes.map((r) => '<span class="tc-n" data-famille="' + r.f + '" style="--t:' + J[r.f].texte + '">' + picto(r.f, 16) + COURT[r.f] + '</span><span style="display:contents;--c:' + J[r.f].base + ';--t:' + J[r.f].texte + '">' + cell('cuve', r.cuve, '+', r.f) + cell('lev', r.lev, r.lev < 0 ? '−' : '+', r.f) + cell('co2', r.co2, '−', r.f) + '</span>').join('') +
    '<span class="tc-t">en tout</span>' + [['cuve', '+'], ['lev', tot('lev') >= 0 ? '+' : '−'], ['co2', '−']].map(([k, sg]) => '<span class="tc-t tc-v" data-nature="simule">' + (Math.abs(tot(k)) < 0.05 ? '0' : '~' + sg + U.f(Math.abs(tot(k)))) + '</span>').join('');
  document.querySelector('[data-role="replie"]').innerHTML = (faibles.length ? '<span class="pq">' + faibles.map((r) => picto(r.f, 14) + COURT[r.f]).join(' ') + ' ≈0</span>' : '') + (riens.length ? '<span class="pq">' + riens.map((r) => picto(r.f, 14) + COURT[r.f]).join(' ') + ', rien de simulé</span>' : '');
  // La réponse en une ligne : combien la levure ajoute, combien le CO₂ emporte, contre la cuve.
  const lv = tot('lev'), co = tot('co2'), cu = tot('cuve');
  document.querySelector('[data-role="reponse"]').innerHTML = (ETAT.moment === 'apres'
    ? 'Après fermentation, ni levure ni CO₂ : tout vient de la cuve, ' + sim('+' + U.f(cu)) + ' ' + U.u + '.'
    : 'La cuve apporte ' + sim('+' + U.f(cu)) + ' ' + U.u + ', ' + esc(L[ETAT.levure].nom.replace(' IPA', '')) + (Math.abs(lv) < 0.05 ? ' n’ajoute rien' : ' ajoute ' + sim((lv >= 0 ? '+' : '−') + U.f(Math.abs(lv)))) + ', le CO₂ emporte ' + sim('−' + U.f(co)) + '.') + ' <span class="gris">' + V.confiance(c.confiance) + '</span>';
  return c;
}
function redessiner() {
  document.querySelectorAll('[data-levure]').forEach((x) => x.setAttribute('aria-checked', String(x.dataset.levure === ETAT.levure)));
  document.querySelectorAll('[data-moment]').forEach((x) => x.setAttribute('aria-checked', String(x.dataset.moment === ETAT.moment)));
  const F = document.querySelector('[data-role="fait"]'); F.innerHTML = '<b>' + esc(L[ETAT.levure].nom) + '</b><span>' + FAIT[ETAT.levure] + '</span>'; F.dataset.source = SRC[ETAT.levure];
  const c = colonnes(), a = c.ajouts;
  document.querySelector('[data-h="a"]').innerHTML = nom('Citra') + usage('Citra') + alpha('Citra') + '<span class="q2">' + mes(fr1(a[0].dose_gL) + ' g/L,', 'moteur : cas ' + c.id + ', jour ' + a[0].jourDebut) + ' ' + mes(a[0].jours + ' j', 'moteur : cas ' + c.id) + '</span>';
  document.querySelector('[data-h="b"]').innerHTML = '<span class="gris">puis</span>' + nom('Idaho 7') + usage('Idaho 7') + alpha('Idaho 7') + stock('Idaho 7') + '<span class="q2">' + mes(fr1(a[1].dose_gL) + ' g/L,', 'moteur : cas ' + c.id + ', jour ' + a[1].jourDebut) + ' ' + mes(a[1].jours + ' j', 'moteur : cas ' + c.id) + '</span>';
  const s = profil(c, { ref: cas('K4-us05-' + ETAT.moment), ordre: ['Citra', 'Idaho 7'] });
  document.querySelector('[data-role="barres"]').innerHTML = V.P.ordre.map((f) => colonne(f, s[f], { lentille: lent(), tilde: false })).join('');
  const deg = V.P.biere.degustation;
  document.querySelector('[data-role="degustation"]').innerHTML = picto('resin', 14) + 'Résineux, ' + mes('ta dégustation,', 'dégustation du ' + deg.date + ' : « ' + deg.citation + ' » (marqué)', { cls: 'mot' }) + ' déjà au-dessus';
}
// Les quatre leçons de la série, chacune avec ses chiffres et leur nature.
function lecons() {
  const g = (n, d) => seul({ nom: n, moment: 'dryPost', dose: d, jours: 3, levure: 'us05' });
  const ci = V.lire(g('Citra', 4).apres.citrus).centre, ct = V.lire(g('Citra', 4).apres.tropical).centre, ca = V.lire(g('Cascade', 8).apres.citrus).centre, cat = V.lire(g('Cascade', 8).apres.tropical).centre;
  const k3 = cas('K3-citra3-galaxy7'), k5 = cas('K5-citra+galaxy-apres-us05'), t3 = V.lire(k3.parJour.at(-1).familles.tropical).centre, t5 = V.lire(k5.parJour.at(-1).familles.tropical).centre;
  const k = 'K4-pomona-actif', c = cas(k), r = cas('K4-us05-actif'), b = cas('K4-us05-apres');
  const lv = V.P.ordre.reduce((s, f) => s + (somme(c, f) - somme(r, f)) / V.cran(f), 0), co = V.P.ordre.reduce((s, f) => s + Math.max(0, somme(b, f) - somme(r, f)) / V.cran(f), 0);
  document.querySelector('[data-role="lecons-liste"]').innerHTML = [
    '<b>Doubler la dose ne double pas l’arôme</b> : de 2 à 3,86 g/L, ' + mes('×' + fr1((OHAI[2][1] - OHAI[0][1]) / (OHAI[1][1] - OHAI[0][1])), 'E04, Lafontaine et Shellhammer 2018, tableau 3 (OHAI), lecture H vérifiée') + ', pas ×2 (Cascade, panel, mesuré).',
    '<b>La levure pèse peu, le CO₂ emporte plus</b> : Pomona ' + sim('+' + fr1(lv) + ' crans') + ', CO₂ ' + sim('−' + fr1(co) + ' crans') + ', toutes familles (cas K4).',
    '<b>À la suite : plus tard, pas plus</b> : Citra puis Galaxy, ou ensemble, ' + picto('tropical', 14) + sim(fr0(t3)) + ' contre ' + sim(fr0(t5)) + ' à la fin (cas K3, K5).',
    '<b>Cascade n’égale pas Citra</b> : à 8 g/L, ' + picto('citrus', 14) + sim(fr0(ca)) + ' contre ' + sim(fr0(ci)) + ' pour Citra 4 g/L, ' + picto('tropical', 14) + sim(fr0(cat)) + ' contre ' + sim(fr0(ct)) + ' (grille, après, 3 j).',
  ].map((x) => '<li>' + x + '</li>').join('');
}
window.redessiner = redessiner;
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-role="reglage"]'); if (!b) return;
  if (b.dataset.levure) ETAT.levure = b.dataset.levure; else if (b.dataset.moment) ETAT.moment = b.dataset.moment;
  redessiner();
});
redessiner(); lecons();
// Le contenu d'un pli fermé ne se mesure pas : il ne s'affiche qu'à l'ouverture.
document.querySelectorAll('details.pl2').forEach((d) => d.addEventListener('toggle', () => { const c = d.querySelector('.vr, .lec'); if (c) c.hidden = !d.open; }));
`;
S.page({
  fichier: S.D21 + '/a2b/etat.html',
  titre: 'Ce que la levure en fait',
  description: 'Lot 21 · a2b : la réponse d’a2 en trois colonnes de barres, famille par famille, sur une même échelle (la cuve apporte, la levure ajoute, le CO₂ emporte), cas K4 du moteur, profils-simules.json à 4,75 % vol. Générée par a2b/generer-a2b.mjs (../a1/socle.mjs).',
  css, corps, js, donnees,
  legende: [S.LEG_FAMILLES, S.LEG_NATURE, ['Colonnes', [
    leg.li('<i class="lg-b" style="background:#e88d68;width:16px;height:8px"></i>', 'la cuve : ce que les houblons apportent'), leg.li('<i class="lg-b" style="width:16px;height:8px;box-shadow:inset 0 0 0 1.5px #9b5d0d;background-image:repeating-linear-gradient(0deg,#9b5d0d 0 1px,transparent 1px 3px)"></i>', 'la levure : ce qu’elle ajoute'),
    leg.li('<i class="lg-b" style="background:#8a909b;width:16px;height:8px"></i>', 'le CO₂ : ce que la fermentation emporte'), leg.li('<span class="mv">0</span>', 'zéro : simulé à 0, pas inconnu'),
  ], 'l2'], ['Barres', [
    leg.li('<i class="lg-b" style="background:#fdf1e3;border-top:1.5px solid #9b5d0d"></i>', 'zone du style 16D'), leg.li('<i class="lg-b" style="background:var(--acc)"></i>', 'au-delà : hors du style'),
    leg.li('<i class="sw m-plein"></i>', 'Citra'), leg.li('<i class="sw m-raye"></i>', 'Idaho 7'),
    leg.li('<i class="k-bio"></i>', 'part de la levure'), leg.li('<i class="lg-w"></i>', 'plage simulée'),
  ], 'l2'], S.LEG_HOUBLON],
});
