// Lot 21 · a3 · « Mon plan sur le déroulé » : on pose ses houblons sur le déroulé du brassin (60′, 10′,
// whirlpool, dry hop actif J+2, après J+7), on choisit la dose, les jours et la levure, et le profil de la
// bière bouge, au style, avec ce que ça change écrit et le plan d'avant en pointillé. Tout le simulé vient
// de la grille (un houblon) et des paires (deux houblons) du moteur profil-simule ; ce que la grille ne
// couvre pas se désactive et le dit. Les vraies valeurs à côté : α, dose, huile, charge d'huile, IBU (K1).
// Usage : node generer-a3.mjs → a3/etat.html
import * as S from '../a1/socle.mjs';
const { R, ico, esc, leg } = S;
const donnees = S.tranche({ grille: () => true, paires: () => true, cas: (c) => c.groupe === 'K1' });
const HOPS = ['Citra', 'Galaxy', 'Idaho 7', 'Cascade', 'Motueka', 'Nelson Sauvin'];
const SLOTS = [['b60', '60′', 'j-ebu'], ['b10', '10′', 'j-ebu'], ['wp', 'whirlpool', 'j-whirl'], ['dryActive', 'J+2 actif', 'j-cuve-a'], ['dryPost', 'J+7 après', 'j-cuve-p']];
const seg = (nom, vals, def, lab) => `<div class="seg rg-s" role="radiogroup" aria-label="${lab}" data-groupe="${nom}">${vals.map(([v, t]) => `<button role="radio" data-role="reglage" data-${nom}="${v}" aria-checked="${v === def}">${t}</button>`).join('')}</div>`;
const corps = `
  ${S.entete('Mon plan de houblonnage', 'Stout export 16D · Nugget 60′ déjà dans la recette')}
  <div class="outils">${S.lentille()}
    <div class="seg pre" role="radiogroup" aria-label="Plans tout faits, par audace">${[['sage', 'sage'], ['franc', 'franc'], ['ose', 'osé']].map(([v, t]) => `<button role="radio" data-role="reglage" data-plan="${v}" aria-checked="false">${t}</button>`).join('')}</div>
  </div>
  <section class="carte der" data-role="ajout" aria-label="Le déroulé du brassin et ses ajouts">
    <div class="dr-l" role="radiogroup" aria-label="Moment de l'ajout">
      <span class="dr-g"><span class="dr-t">brassage</span><span class="dr-ss">${SLOTS.slice(0, 3).map(([m, t, i]) => `<button class="sl" role="radio" data-role="reglage" data-moment="${m}" aria-checked="false">${ico(i, 14)}<span>${t}</span></button>`).join('')}</span></span>
      <span class="dr-g fe"><span class="dr-t">fermentation ${ico('j-levure', 14)}</span><span class="dr-ss">${SLOTS.slice(3).map(([m, t, i]) => `<button class="sl" role="radio" data-role="reglage" data-moment="${m}" aria-checked="${m === 'dryPost'}">${ico(i, 14)}<span>${t}</span></button>`).join('')}</span><span class="dr-ax" aria-hidden="true"><i style="left:0">J0</i><i style="left:22%">J+2</i><i style="left:58%">J+7</i><i style="left:84%">J+10</i></span></span>
    </div>
    <div class="ah" data-voie="1" data-role="ligne-houblon" data-slot="a"><i class="sw m-plein" aria-hidden="true"></i><span class="ah-i"></span></div>
    <div class="ah" data-voie="2" data-role="ligne-houblon" data-slot="b"><i class="sw m-raye" aria-hidden="true"></i><span class="ah-i"></span></div>
    <div class="regs">
      <span class="rl2"><span class="rg-l">dose</span>${seg('dose', [[1, '1'], [2, '2'], [4, '4'], [8, '8']], 2, 'Dose par houblon, g/L')}<span class="rg-l">g/L</span></span>
      <span class="rl2"><span class="rg-l">contact</span>${seg('jours', [[1, '1'], [2, '2'], [3, '3'], [5, '5'], [7, '7']], 3, 'Jours de contact')}<span class="rg-l">j</span></span>
      <span class="rl2"><span class="rg-l">levure</span>${seg('levure', [['us05', 'US-05'], ['pomona', 'Pomona'], ['verdant', 'Verdant']], 'us05', 'Levure').replace(/data-levure=/g, 'data-reglage="levure" data-levure=')}</span>
    </div>
    <p class="hors-g" data-role="hors-grille"></p>
    <div class="vraies" data-role="vraies"></div>
  </section>
  <section class="carte" data-role="simulation" aria-label="Le profil simulé de la bière">
    <div class="ct"><span class="sv">~ simulé</span><span class="cf cf-simule" data-role="confiance"></span><span class="dr gris">sur 100</span></div>
    <p class="chg" data-role="change"></p>
    <div class="vbs" data-role="barres"></div>
    <p class="drp" data-role="drapeaux"></p>
    <p class="drp bio3" data-role="biotransformation"></p>
  </section>
  <section class="carte" aria-label="Pourquoi à 10′ et pas à 60′">
    <div class="ct">Pourquoi à 10′ et pas à 60′ ?<span class="dr gris" data-role="mo-h"></span></div>
    <div class="mms" data-role="moments"></div>
    <p class="phr" data-role="mo-p"></p>
  </section>`;

const css = `
  .outils { align-items: center; }
  .pre button { padding: 0 11px; }
  .der { gap: 6px; }
  .dr-l { display: grid; grid-template-columns: 1fr 1.25fr; gap: 6px; }
  .dr-g { display: flex; flex-direction: column; gap: 3px; position: relative; padding-bottom: 14px; }
  .dr-t { font-size: 12px; color: var(--gris); display: inline-flex; align-items: center; gap: 3px; }
  .dr-ss { display: flex; gap: 3px; }
  .sl { flex: 1; min-height: 40px; border-radius: 8px; background: #f3f4f7; box-shadow: inset 0 0 0 1px #d5d7de; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; font-size: 12px; font-weight: 600; color: var(--encre); padding: 2px; }
  .sl span { white-space: nowrap; }
  .sl[aria-checked="true"] { background: var(--encre); color: #fff; box-shadow: none; }
  .sl[aria-disabled="true"] { background: repeating-linear-gradient(135deg, #fff 0 3px, #eceef2 3px 6px); color: #55555f; }
  .dr-ax { position: absolute; left: 0; right: 0; bottom: 0; height: 12px; border-top: 1.5px solid #aeb3be; }
  .dr-ax i { position: absolute; top: 0; font: 400 12px var(--mono); color: var(--gris); font-style: normal; line-height: 12px; }
  .ah { display: flex; align-items: center; gap: 6px; min-height: 32px; flex-wrap: wrap; border-radius: 4px; }
  .ah-i { display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap; min-width: 0; flex: 1; }
  .ah .hv { margin-left: auto; display: inline-flex; gap: 6px; align-items: center; }
  .ch { position: relative; width: 28px; height: 28px; border-radius: 14px; background: #ececf1; display: inline-flex; align-items: center; justify-content: center; flex: none; }
  .ch select { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; font-size: 16px; }
  .ch:focus-within { outline: 2px solid #1d4ed8; outline-offset: 2px; }
  .aucun { font-size: 13px; color: var(--gris); }
  .regs { display: flex; flex-direction: column; gap: 4px; }
  .rl2 { display: flex; align-items: center; gap: 6px; }
  .rl2 .rg-l { min-width: 44px; }
  .rl2 .rg-l:last-child { min-width: 0; }
  .rg-s { border-radius: 16px; }
  .rg-s button { min-width: 34px; padding: 0 8px; height: 28px; border-radius: 14px; }
  .rg-s button[aria-disabled="true"] { color: #55555f; text-decoration: line-through; }
  .hors-g { font-size: 12px; color: var(--gris); display: flex; gap: 4px; align-items: center; flex-wrap: wrap; }
  .hors-g:empty { display: none; }
  .vraies { display: flex; flex-wrap: wrap; gap: 4px 10px; font-size: 12px; color: var(--gris); border-top: 1px solid var(--trait); padding-top: 5px; align-items: center; }
  .vraies .mv { font-size: 12px; }
  .chg { font-size: 13px; display: flex; flex-wrap: wrap; gap: 3px 8px; align-items: center; min-height: 20px; }
  .chg b { font-weight: 600; }
  .chg .pi { display: inline-block; vertical-align: -3px; }
  .drp { font-size: 12px; color: var(--gris); display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
  .drp .cf { font-size: 12px; }
  .vb.change .vb-v { background: #fff4c2; border-radius: 2px; }
  @media (prefers-reduced-motion: no-preference) { .vb.change .vb-v { animation: eclat 1.2s ease-out; } }
  @keyframes eclat { from { background: #ffe066; } to { background: #fff4c2; } }
  .mms { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; align-items: start; }
  .mm { display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 12px; }
  .mm-p { position: relative; width: 26px; height: 70px; }
  .mm-p::after { content: ''; position: absolute; left: -4px; right: -4px; bottom: -1px; height: 1.5px; background: var(--encre); }
  .mm-z { position: absolute; left: -4px; right: -4px; bottom: 0; background: var(--z); border-top: 1.5px solid var(--t); }
  .mm-b { position: absolute; left: 3px; right: 3px; bottom: 0; background: var(--c); border-radius: 2px 2px 0 0; }
  .mm-x { position: absolute; left: 3px; right: 3px; background: var(--acc); }
  .mm.cur .mm-n { font-weight: 700; }
  .mm-n { white-space: nowrap; }
  .mm .ibu { font: 400 12px var(--mono); color: var(--gris); }
`;

const js = `
const { R, H, L, J, esc, fr0, fr1, picto, ico, sim, mes, conf, texte, seul, paire, cas, profil, colonne, usage, alpha, stock, nom, COURT, NOM, LEV } = V;
const HOPS = ${JSON.stringify(HOPS)};
const ETAT = { a: 'Citra', b: null, moment: 'dryPost', dose: 2, jours: 3, levure: 'us05' };
let AVANT = null, ETAT_AVANT = null;
const lent = () => (${S.lentilleCourante});
const PLANS = { sage: { a: 'Cascade', b: 'Idaho 7', moment: 'dryPost', dose: 2, jours: 3, levure: 'us05' }, franc: { a: 'Citra', b: null, moment: 'dryPost', dose: 2, jours: 3, levure: 'us05' }, ose: { a: 'Citra', b: 'Galaxy', moment: 'dryActive', dose: 2, jours: 3, levure: 'verdant' } };
const DRY = (m) => m === 'dryActive' || m === 'dryPost';
const choix = (slot, n) => '<span class="ch">' + ico('i-chev-d', 14) + '<select data-role="reglage" data-reglage="ajout-cumule" data-slot="' + slot + '" aria-label="' + (slot === 'a' ? 'Changer le houblon' : 'Ajouter ou changer un second houblon') + '">' + (slot === 'b' ? '<option value=""' + (n ? '' : ' selected') + '>aucun</option>' : '') + HOPS.map((h) => '<option' + (h === n ? ' selected' : '') + '>' + esc(h) + '</option>').join('') + '</select></span>';
const huile = (n) => { const h = V.hop(n).huile; return mes(fr1(h.min) + '–' + fr1(h.max) + ' mL/100 g', 'huile : ' + h.sources.join(', ')); };
const MOTS = { 'hors-du-style': ['hors du style', 'simule'], saturation: ['saturation', 'estime'], 'saturation-partagee': ['saturation partagée', 'estime'], 'duree-longue': ['au-delà de 3 j : rien de plus, végétal ?', 'inconnu'], 'hop-creep': ['hop creep : levure vivante', 'inconnu'], 'biotransformation-geraniol': ['géraniol → citronellol', 'estime'], 'biotransformation-thiols': ['thiols libérés', 'estime'], amertume: ['surtout de l’amertume', 'estime'], 'biere-noire': ['perception en stout', 'inconnu'], ordre: ['ordre', 'inconnu'], synergie: ['synergie', 'inconnu'], masquage: ['masquage', 'inconnu'] };
function entree() {
  if (ETAT.b) return paire({ a: ETAT.a, b: ETAT.b, moment: ETAT.moment, levure: ETAT.levure });
  return seul({ nom: ETAT.a, moment: ETAT.moment, dose: ETAT.dose, jours: DRY(ETAT.moment) ? ETAT.jours : null, levure: ETAT.levure });
}
// Ce que la grille couvre : deux houblons → dry hop, 2 + 2 g/L, 3 j ; un houblon à chaud → sans jours ni levure ;
// Verdant → paires seulement. Un réglage hors de la grille se désactive et la page dit pourquoi.
function cadrer() {
  const notes = [];
  if (ETAT.b && !DRY(ETAT.moment)) { ETAT.moment = 'dryPost'; notes.push('deux houblons : dry hop seulement'); }
  if (ETAT.b) { ETAT.dose = 2; ETAT.jours = 3; }
  if (!ETAT.b && ETAT.levure === 'verdant') { ETAT.levure = 'us05'; notes.push('Verdant : paires seulement'); }
  if (!DRY(ETAT.moment) && ETAT.levure !== 'us05') { ETAT.levure = 'us05'; }
  document.querySelectorAll('[data-moment]').forEach((x) => { x.setAttribute('aria-checked', String(x.dataset.moment === ETAT.moment)); x.setAttribute('aria-disabled', String(!!ETAT.b && !DRY(x.dataset.moment))); });
  document.querySelectorAll('[data-dose]').forEach((x) => { x.setAttribute('aria-checked', String(+x.dataset.dose === ETAT.dose)); x.setAttribute('aria-disabled', String(!!ETAT.b && +x.dataset.dose !== 2)); });
  document.querySelectorAll('[data-jours]').forEach((x) => { x.setAttribute('aria-checked', String(DRY(ETAT.moment) && +x.dataset.jours === ETAT.jours)); x.setAttribute('aria-disabled', String(!DRY(ETAT.moment) || (!!ETAT.b && +x.dataset.jours !== 3))); });
  document.querySelectorAll('[data-levure]').forEach((x) => { x.setAttribute('aria-checked', String(x.dataset.levure === ETAT.levure)); x.setAttribute('aria-disabled', String((!ETAT.b && x.dataset.levure === 'verdant') || (!DRY(ETAT.moment) && x.dataset.levure !== 'us05'))); });
  if (ETAT.b) notes.push('paires du moteur : 2 + 2 g/L, 3 j');
  if (!DRY(ETAT.moment)) notes.push('à chaud : ni jours ni levure');
  document.querySelector('[data-role="hors-grille"]').innerHTML = notes.length ? conf('inconnu', 'hors grille') + ' ' + notes.join(' · ') : '';
}
function redessiner() {
  cadrer();
  for (const [s, n] of [['a', ETAT.a], ['b', ETAT.b]]) document.querySelector('.ah[data-slot="' + s + '"] .ah-i').innerHTML = n ? nom(n) + choix(s, n) + usage(n) + alpha(n) + stock(n) + '<span class="hv">' + huile(n) + '</span>' : '<span class="aucun">+ un second houblon</span>' + choix(s, null);
  const e = entree(); if (!e) return;
  const ref = ETAT.b && ETAT.levure !== 'us05' ? paire({ a: ETAT.a, b: ETAT.b, moment: ETAT.moment, levure: 'us05' }) : null;
  const s = profil(e, { ref, ordre: [ETAT.a, ETAT.b].filter(Boolean) });
  document.querySelector('[data-role="confiance"]').textContent = V.confiance(e.confiance);
  document.querySelector('[data-role="barres"]').innerHTML = V.P.ordre.map((f) => colonne(f, s[f], { lentille: lent(), avant: AVANT ? AVANT[f].centre : null, tilde: false }).replace('class="vb', AVANT && Math.abs(AVANT[f].centre - s[f].centre) > 0.5 ? 'class="vb change' : 'class="vb')).join('');
  // Ce que ça change, contre le plan d'avant (ou contre la bière sans ajout).
  const ref0 = AVANT || Object.fromEntries(V.P.ordre.map((f) => [f, { centre: s[f].avant }]));
  const ecarts = V.P.ordre.map((f) => [f, s[f].centre - ref0[f].centre]).filter(([, d]) => Math.abs(d) >= 1).sort((x, y) => Math.abs(y[1]) - Math.abs(x[1])).slice(0, 4);
  document.querySelector('[data-role="change"]').innerHTML = '<b>' + (AVANT ? 'Contre ton plan d’avant :' : 'Contre ta bière sans ajout :') + '</b> ' + (ecarts.length ? ecarts.map(([f, d]) => picto(f, 14) + COURT[f].toLowerCase() + ' ' + sim(V.sgn(d))).join(' · ') : '≈ rien') + ' <span class="gris">sur 100</span>';
  const dr = (e.drapeaux || []).map((d) => (typeof d === 'string' ? d : d.id)).filter((d) => MOTS[d]);
  const hors = V.P.ordre.filter((f) => s[f].horsStyle && f !== 'resin');
  document.querySelector('[data-role="drapeaux"]').innerHTML = (hors.length ? '<b class="hors-t">hors du style 16D</b> ' + hors.map((f) => picto(f, 14) + COURT[f].toLowerCase()).join(' ') + ' · ' : '<b>dans le style 16D</b> (résineux : ta dégustation) · ') + dr.filter((d) => d !== 'hors-du-style').map((d) => conf(MOTS[d][1], MOTS[d][0])).join(' ');
  // Les vraies valeurs du plan : dose, charge d'huile (dose × huile publiée), saturation.
  const hs = [ETAT.a, ETAT.b].filter(Boolean), d = ETAT.b ? 2 : ETAT.dose, tot = d * hs.length;
  const ch = hs.map((n) => { const h = V.hop(n).huile; return [d * h.min, d * h.max]; }), cmin = ch.reduce((x, c) => x + c[0], 0), cmax = ch.reduce((x, c) => x + c[1], 0);
  const k1 = !ETAT.b && ETAT.dose === 4 ? cas('K1-' + ETAT.a.toLowerCase() + '-' + ETAT.moment) : null, ibu = k1 && k1.mesures.find((m) => m.type === 'ibu');
  document.querySelector('[data-role="vraies"]').innerHTML = 'total ' + mes(fr1(tot) + ' g/L', 'dose du plan') + ' · huile ' + mes(fr1(cmin) + '–' + fr1(cmax) + ' mL/hL', 'dose × huile publiée (' + hs.join(', ') + ')') + (DRY(ETAT.moment) ? ' · saturation ' + mes('4–8 g/L', 'E04 (Cascade), H22') + (tot >= 4 ? ' <b>atteinte</b>' : '') : '') + (ibu ? ' · ' + mes('≈ ' + fr0(ibu.valeur) + ' IBU', 'moteur, cas ' + k1.id + ' : ' + texte(ibu.base)) : '');
  // La levure, en familles : ce que le moteur lui donne, et son mot de confiance.
  const bi = document.querySelector('.bio3');
  if (!DRY(ETAT.moment)) bi.innerHTML = 'À chaud : pas de levure en jeu.';
  else if (ETAT.moment === 'dryPost') bi.innerHTML = picto('floral', 14) + 'Après fermentation : aucune biotransformation simulée ' + conf('inconnu', 'peu documenté');
  else if (ETAT.levure === 'pomona') { const r0 = ETAT.b ? paire({ a: ETAT.a, b: ETAT.b, moment: ETAT.moment, levure: 'us05' }) : seul({ nom: ETAT.a, moment: ETAT.moment, dose: ETAT.dose, jours: ETAT.jours, levure: 'us05' }); bi.innerHTML = picto('floral', 14) + 'géraniol → citronellol' + picto('citrus', 14) + conf('fournisseur', 'Pomona « medium »') + ' agrumes ' + sim(V.sgn(s.citrus.centre - V.lire(r0.apres.citrus).centre)); }
  else if (ETAT.levure === 'verdant') { const r0 = paire({ a: ETAT.a, b: ETAT.b, moment: ETAT.moment, levure: 'us05' }); bi.innerHTML = 'précurseurs → thiols' + picto('tropical', 14) + conf('estime', 'rendement 0,1 %') + ' tropical ' + sim(V.sgn(s.tropical.centre - V.lire(r0.apres.tropical).centre)); }
  else bi.innerHTML = picto('floral', 14) + 'US-05 : biotransformation à 0 au centre ' + conf('inconnu', 'non documentée');
  moments();
  AVANT = s;
}
// Les cinq moments, pour le premier houblon à la dose du plan : la grille du moteur, famille la plus forte.
function moments() {
  const n = ETAT.a, d = ETAT.b ? 2 : ETAT.dose, f = 'citrus';
  const pts = [['b60', '60′'], ['b10', '10′'], ['wp', 'whirl.'], ['dryActive', 'actif'], ['dryPost', 'après']].map(([m, t]) => [m, t, seul({ nom: n, moment: m, dose: d, jours: DRY(m) ? 3 : null, levure: 'us05' })]);
  const max = V.cran(f) * 5, h = (v) => Math.min(70, v / max * 70), z = h(V.top(f));
  document.querySelector('[data-role="mo-h"]').innerHTML = picto(f, 14) + 'agrumes, ' + esc(n) + ' ' + fr1(d) + ' g/L';
  document.querySelector('[data-role="moments"]').innerHTML = pts.map(([m, t, e]) => { const x = V.lire(e.apres[f]); const k1 = d === 4 ? cas('K1-' + n.toLowerCase() + '-' + m) : null, ib = k1 && k1.mesures.find((q) => q.type === 'ibu');
    return '<span class="mm' + (m === ETAT.moment ? ' cur' : '') + '" style="--c:' + J[f].base + ';--t:' + J[f].texte + ';--z:' + J[f].fond + '"><span class="mm-p"><i class="mm-z" style="height:' + z.toFixed(1) + 'px"></i><i class="mm-b" style="height:' + h(x.centre).toFixed(1) + 'px"></i>' + (x.centre > V.top(f) ? '<i class="mm-x" style="bottom:' + z.toFixed(1) + 'px;height:' + (h(x.centre) - z).toFixed(1) + 'px"></i>' : '') + '</span><span class="mm-n">' + t + '</span>' + sim(fr0(x.centre)) + (ib ? '<span class="ibu" data-nature="mesure" data-source="moteur, ' + k1.id + '">' + fr0(ib.valeur) + ' IBU</span>' : '') + '</span>'; }).join('');
  const e60 = V.lire(pts[0][2].apres[f]), e10 = V.lire(pts[1][2].apres[f]);
  document.querySelector('[data-role="mo-p"]').innerHTML = 'À 60′, presque tout l’arôme part avec l’ébullition : ' + sim(fr0(e60.centre)) + ' contre ' + sim(fr0(e10.centre)) + ' à 10′ ; il reste surtout de l’amertume' + (d === 4 && (n === 'Citra' || n === 'Cascade') ? '' : ' (IBU : réglez 4 g/L, Citra ou Cascade)') + '. <span class="gris">Rétention à chaud : convention du moteur (H §8.2).</span>';
}
window.redessiner = redessiner;
document.addEventListener('change', (e) => { const sl = e.target.closest('select[data-slot]'); if (!sl) return; ETAT[sl.dataset.slot] = sl.value || null; if (ETAT.a === ETAT.b) ETAT.b = null; redessiner(); });
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-role="reglage"]'); if (!b || b.tagName === 'SELECT') return;
  if (b.getAttribute('aria-disabled') === 'true') { if (b.dataset.moment && ETAT.b) { ETAT.b = null; ETAT.moment = b.dataset.moment; redessiner(); } return; }
  if (b.dataset.plan) { Object.assign(ETAT, PLANS[b.dataset.plan]); document.querySelectorAll('[data-plan]').forEach((x) => x.setAttribute('aria-checked', String(x === b))); }
  else { document.querySelectorAll('[data-plan]').forEach((x) => x.setAttribute('aria-checked', 'false'));
    if (b.dataset.moment) ETAT.moment = b.dataset.moment; else if (b.dataset.dose) ETAT.dose = +b.dataset.dose; else if (b.dataset.jours) ETAT.jours = +b.dataset.jours; else if (b.dataset.levure) ETAT.levure = b.dataset.levure; }
  redessiner();
});
redessiner(); AVANT = null; redessiner();
`;
S.page({
  fichier: S.D21 + '/a3/etat.html',
  titre: 'Mon plan de houblonnage',
  description: 'Lot 21 · a3 : le plan complet sur le déroulé du brassin (moment, un ou deux houblons, dose, jours, levure) ; le profil simulé du moteur bouge au toucher, avec ce que ça change et le plan d’avant en pointillé. Générée par a3/generer-a3.mjs (../a1/socle.mjs).',
  css, corps, js, donnees,
  legende: [S.LEG_FAMILLES, S.LEG_NATURE, ['Barres', [
    leg.li('<i class="lg-b" style="background:#fdf1e3;border-top:1.5px solid #9b5d0d"></i>', 'zone du style 16D'), leg.li('<i class="lg-b" style="background:var(--acc)"></i>', 'au-delà : hors du style'),
    leg.li('<i class="sw m-plein"></i>', '1er houblon'), leg.li('<i class="sw m-raye"></i>', '2nd houblon'),
    leg.li('<i class="k-bio"></i>', 'part de la levure'), leg.li('<i class="lg-w"></i>', 'plage simulée'),
    leg.li('<i class="lg-b" style="background:transparent;border:1.5px dashed #55555f"></i>', 'pointillé : ton plan d’avant'), leg.li('<i class="lg-b" style="background:repeating-linear-gradient(135deg,#8a909b 0 2px,#c4c6ce 2px 4px)"></i>', 'gris : ta bière ; hachuré : ta dégustation'),
  ], 'l2'], ['Plans', [leg.li('<span class="cf cf-fournisseur">sage</span>', 'reste dans la 16D'), leg.li('<span class="cf cf-fournisseur">franc</span>', 'au bord du style'), leg.li('<span class="cf cf-fournisseur">osé</span>', 'sort du style'), leg.li('<span class="cf cf-inconnu">hors grille</span>', 'réglage que le moteur ne simule pas')], 'l2'], S.LEG_HOUBLON],
});
