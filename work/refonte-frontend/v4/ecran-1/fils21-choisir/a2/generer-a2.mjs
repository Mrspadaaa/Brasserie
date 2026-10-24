// Lot 21 · a2 · « Ce que la levure en fait » : un flux, de ce que les houblons mettent dans la cuve à ce que
// la bière garde. Le brasseur : « Aussi ils nous faut un outil de dry hopping, bio Transfo, levure, ça a
// été demandé, c'est toujours pas là ». Les chiffres sont ceux du moteur profil-simule (cas K4 : Citra 2 g/L
// 3 j puis Idaho 7 2 g/L 5 j, quatre levures ; cas K5 : les deux ensemble, trois levures) :
//   - à gauche, ce que les houblons apportent, dry hop après fermentation, sans levure active (US-05) ;
//   - le CO₂ de la fermentation active emporte (le moteur divise les hydrocarbures par deux) ;
//   - la levure ajoute (Pomona : géraniol → citronellol ; Verdant et Diamond : thiols des précurseurs) ;
//   - à droite, ce que la bière en garde. Les vraies valeurs à côté. Usage : node generer-a2.mjs
import * as S from '../a1/socle.mjs';
const { R, ico, esc, leg } = S;
const H = R.houblons, L = R.levures;
const donnees = S.tranche({ cas: (c) => c.groupe === 'K4' || /^K5-citra\+idaho-7/.test(c.id) });
const thPlage = R.bio.thiolsPrecurseurs;

const FAIT = { us05: 'esters « low »', verdant: 'β-lyase : qualitative', pomona: 'géraniol → citronellol : medium', diamond: 'lager, 10–15 °C' };
const carteLevure = (id) => {
  const x = L[id];
  return `<button class="lv" role="radio" data-role="reglage" data-reglage="levure" data-levure="${id}" aria-checked="${id === 'pomona'}" aria-label="${esc(x.long)} : ${esc(FAIT[id])}">
    <span class="lv-n">${esc(x.nom)}</span>
    <span class="lv-e">${x.estersFam.length ? x.estersFam.map((f) => S.picto(f, 14)).join('') : '<span class="lv-0">neutre</span>'}</span>
    <span class="lv-f" data-nature="mesure" data-source="${esc(x.sources.join(', '))} (fiche)">${id === 'pomona' ? S.picto('floral', 12) : ''}${esc(FAIT[id])}${id === 'pomona' ? S.picto('citrus', 12) : ''}</span></button>`;
};
const corps = `
  ${S.entete('Ce que la levure en fait', 'dry hop · Stout export 16D')}
  <div class="outils">${S.lentille()}
    <div class="seg" role="radiogroup" aria-label="Moment du dry hop"><button role="radio" class="mo-b" data-role="reglage" data-moment="actif" aria-checked="true">${ico('j-cuve-a', 14)}actif</button><button role="radio" class="mo-b" data-role="reglage" data-moment="apres" aria-checked="false">${ico('j-cuve-p', 14)}après</button></div>
  </div>
  <div class="lvs" role="radiogroup" aria-label="Levure">${['us05', 'verdant', 'pomona', 'diamond'].map(carteLevure).join('')}</div>
  <section class="carte aj2" data-role="ajout" aria-label="Le dry hop : Citra et Idaho 7">
    <div class="aj2-l"><span class="ah2" data-voie="1" data-role="ligne-houblon"><span data-h="a"></span></span><span class="pl">+</span><span class="ah2" data-voie="2" data-role="ligne-houblon"><span data-h="b"></span></span></div>
    <div class="seg plan" role="radiogroup" aria-label="Les deux houblons : à la suite ou ensemble"><button role="radio" data-role="reglage" data-plan="suite" aria-checked="true">à la suite</button><button role="radio" data-role="reglage" data-plan="ensemble" aria-checked="false">ensemble</button></div>
    <p class="aj2-d" data-role="plan-d"></p>
  </section>
  <section class="carte flux-c" data-role="simulation" aria-label="Le flux simulé : ce que les houblons mettent, ce que la bière garde">
    <div class="ct"><span class="sv">~ simulé</span><span class="cf cf-simule" data-role="confiance"></span><span class="dr fl-t"><span>cuve</span>${ico('i-arrow-r', 14)}<span>bière, sur 100</span></span></div>
    <p class="fl-r" data-role="reponse"></p>
    <div class="flux" data-role="flux"></div>
    <p class="fl-n" data-role="flux-note"></p>
  </section>
  <section class="carte" data-role="simulation" aria-label="La bière, au style">
    <div class="ct"><span class="sv">~ simulé</span>Dans la 16D<span class="dr gris">sur 100</span></div>
    <div class="vbs" data-role="barres"></div>
  </section>
  <section class="carte" data-role="vraies" aria-label="Ce qui est mesuré, et ce qui ne l'est pas">
    <div class="ct">Ce qui est mesuré</div>
    <div class="vr">
      <div class="vr-i">${S.picto('floral', 16)}<span><b>Géraniol</b> dans l’huile : Idaho 7 <span class="mv" data-nature="mesure" data-source="${esc(H.idaho7.ger.sources.join(', '))}">${String(H.idaho7.ger.min).replace('.', ',')}–${String(H.idaho7.ger.max).replace('.', ',')} %</span>, Citra <span class="mv" data-nature="mesure" data-source="${esc(H.citra.ger.sources.join(', '))}">${String(H.citra.ger.min).replace('.', ',')}–${String(H.citra.ger.max).replace('.', ',')} %</span> ; c’est lui que Pomona change en citronellol.</span></div>
      <div class="vr-i">${S.picto('citrus', 16)}<span><b>Citronellol</b> au-dessus de son seuil dans une bière à cru au Citra <span class="cf cf-mesure">mesuré</span> <span class="gris">(E01, résumé)</span></span></div>
      <div class="vr-i">${S.picto('tropical', 16)}<span><b>Précurseurs</b> de Citra : <span class="mv" data-nature="mesure" data-source="${esc(H.citra.precurseurs.sources.join(', '))}">≈ 23 mg/kg</span> liés, contre <span class="mv" data-nature="mesure" data-source="${esc(H.citra.precurseurs.sources.join(', '))}">12 µg/kg</span> libres ; Idaho 7 <span class="cf cf-inconnu">non publiés</span>. Libérés : <span class="mv" data-nature="mesure" data-source="${esc(thPlage.sources.join(', '))}, ${esc(thPlage.base)}">${String(thPlage.plage[0]).replace('.', ',')}–${String(thPlage.plage[1]).replace('.', ',')} %</span> <span class="gris">sur précurseur de synthèse</span>.</span></div>
      <div class="vr-i">${S.picto('tropical', 16)}<span><b>Diamond</b> : le plus de thiols mesurés, le fruité perçu le plus faible <span class="cf cf-etude">étude</span> <span class="gris">(Samia 2026) ; le moteur lui donne la convention de Verdant</span></span></div>
      <div class="vr-i hc"><span class="hc-i">${ico('j-alerte', 16)}</span><span><b>Hop creep</b> si la levure vit : <span class="mv" data-nature="mesure" data-source="H68, Young et Fox 2025">+0,92 % vol.</span> <span class="gris">à 10 g/L, 7 j, T-90 (H68)</span> ; pour ce brassin <span class="cf cf-inconnu">non chiffré</span></span></div>
    </div>
    <p class="phr trou"><span class="cf cf-inconnu">inconnu</span> Aucune mesure ne croise variété, levure et dry hop (recherche J) : la part de la levure vient du fournisseur et des conventions du moteur.</p>
  </section>`;

const css = `
  .mo-b { gap: 3px; }
  .lvs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; }
  .lv { background: #fff; border-radius: 8px; box-shadow: var(--ombre); padding: 5px 5px 6px; display: flex; flex-direction: column; align-items: flex-start; gap: 3px; text-align: left; min-height: 78px; }
  .lv[aria-checked="true"] { box-shadow: 0 0 0 2px var(--encre), var(--ombre); }
  .lv[aria-disabled="true"] { opacity: 1; background: repeating-linear-gradient(135deg, #fff 0 4px, #f1f2f5 4px 7px); }
  .lv-n { font-size: 13px; font-weight: 700; }
  .lv-e { display: inline-flex; gap: 2px; min-height: 14px; align-items: center; }
  .lv-0 { font-size: 12px; color: var(--gris); }
  .lv-f .pi { display: inline-block; vertical-align: -2px; }
  .lv-f { font-family: var(--sans); font-size: 12px; line-height: 1.2; color: var(--encre); white-space: normal; }
  .aj2 { gap: 5px; padding: 6px 10px; }
  .aj2-l { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .ah2 { display: inline-flex; align-items: center; gap: 5px; min-height: 26px; border-radius: 4px; }
  .ah2 > span { display: inline-flex; align-items: center; gap: 5px; }
  .plan { align-self: flex-start; }
  .aj2-d { font-size: 12px; color: var(--gris); display: flex; gap: 4px; align-items: center; flex-wrap: wrap; }
  .fl-t { font-size: 12px; font-weight: 400; color: var(--gris); }
  .flux { position: relative; height: 290px; }
  .flux svg.fx { position: absolute; left: 0; top: 0; }
  .fx-l { position: absolute; display: flex; align-items: center; gap: 3px; font-size: 12px; white-space: nowrap; line-height: 14px; pointer-events: none; }
  .fx-l.g { left: 0; } .fx-l.d { right: 0; flex-direction: row-reverse; text-align: right; }
  .fx-l b { font-weight: 600; color: var(--t); font-size: 12px; }
  .fx-r { position: absolute; left: 50%; transform: translateX(-50%); display: inline-flex; align-items: center; gap: 3px; font-size: 12px; background: rgba(255,255,255,.94); border-radius: 4px; padding: 1px 4px; white-space: nowrap; box-shadow: 0 0 0 1px #e3e5eb; }
  .fx-r .cf { height: 16px; padding: 0 5px; }
  .fl-n { font-size: 12px; color: var(--gris); }
  .fx-g { color: var(--gris); font-weight: 400; }
  .fl-r { font-size: 14px; font-weight: 600; display: flex; gap: 6px; align-items: baseline; flex-wrap: wrap; }
  .fl-r .sv { font-size: 14px; }
  .vr { display: flex; flex-direction: column; gap: 6px; font-size: 13px; line-height: 1.3; }
  .vr-i { display: flex; gap: 6px; align-items: flex-start; }
  .vr-i > .pi { margin-top: 1px; }
  .vr-i b { font-weight: 600; }
  .hc-i { color: var(--acc); display: inline-flex; margin-top: 1px; }
  .trou { display: flex; gap: 6px; align-items: flex-start; font-size: 13px; }
  .vbs { padding-top: 6px; }
  .rb { opacity: .5; } .rb-lev { opacity: .9; } .rb-co2 { opacity: .85; }
`;

const js = `
const { R, H, L, J, esc, fr0, fr1, picto, ico, sim, mes, conf, CONFIANCE, texte, cas, profil, colonne, usage, alpha, stock, nom, COURT, NOM } = V;
const ETAT = { moment: 'actif', levure: 'pomona', plan: 'suite' };
const lent = () => (${S.lentilleCourante});
const ORD = ['floral', 'citrus', 'tropical', 'berries', 'stoneFruit', 'melon', 'herbal', 'earthy', 'spice', 'resin', 'green'];
const ruban = (x0, a0, a1, x1, b0, b1, cls, fill) => { const m = (x0 + x1) / 2; return '<path class="' + cls + '" d="M' + x0 + ',' + a0.toFixed(1) + ' C' + m + ',' + a0.toFixed(1) + ' ' + m + ',' + b0.toFixed(1) + ' ' + x1 + ',' + b0.toFixed(1) + ' L' + x1 + ',' + b1.toFixed(1) + ' C' + m + ',' + b1.toFixed(1) + ' ' + m + ',' + a1.toFixed(1) + ' ' + x0 + ',' + a1.toFixed(1) + ' Z" fill="' + fill + '"/>'; };
const idCas = (lev, mom) => ETAT.plan === 'suite' ? 'K4-' + lev + '-' + mom : 'K5-citra+idaho-7-' + mom + '-' + lev;
const somme = (c, f) => c.apportsParHoublon.reduce((s, h) => s + h.apport[f], 0);
const MECA = { pomona: 'géraniol → citronellol', verdant: 'précurseurs → thiols', diamond: 'précurseurs → thiols', us05: '' };
function flux() {
  const c = cas(idCas(ETAT.levure, ETAT.moment)), base = cas(idCas('us05', 'apres')), refM = cas(idCas('us05', ETAT.moment));
  const W = 370, HT = 290, XL = 88, XR = W - 88, BW = 10, G = 5;
  const Lh = Object.fromEntries(ORD.map((f) => [f, somme(base, f)]));
  const Rr = Object.fromEntries(ORD.map((f) => [f, somme(refM, f)]));
  const Rl = Object.fromEntries(ORD.map((f) => [f, somme(c, f)]));
  const fam = ORD.filter((f) => Math.max(Lh[f], Rl[f]) >= 4), autres = ORD.filter((f) => !fam.includes(f) && Math.max(Lh[f], Rl[f]) > 0.2);
  const grp = (o, f) => o[f];
  const GL = (f) => (f === 'autres' ? autres.reduce((s, g) => s + Lh[g], 0) : Lh[f]);
  const GRr = (f) => (f === 'autres' ? autres.reduce((s, g) => s + Rr[g], 0) : Rr[f]);
  const GRl = (f) => (f === 'autres' ? autres.reduce((s, g) => s + Rl[g], 0) : Rl[f]);
  const liste = autres.length ? [...fam, 'autres'] : fam;
  const co2 = Object.fromEntries(liste.map((f) => [f, Math.max(0, GL(f) - GRr(f))])), co2T = Object.values(co2).reduce((a, b) => a + b, 0);
  const lev = Object.fromEntries(liste.map((f) => [f, GRl(f) - GRr(f)])), levT = Object.values(lev).filter((v) => v > 0).reduce((a, b) => a + b, 0);
  const gauche = liste.reduce((s, f) => s + GL(f), 0) + levT, droite = liste.reduce((s, f) => s + GRl(f), 0) + co2T;
  const n = liste.length + 2, k = (HT - G * n - 4) / Math.max(gauche, droite, 1);
  const hh = (v) => (v > 0.05 ? Math.max(2, v * k) : 0);
  let y = 2; const BG = {}, BD = {};
  for (const f of liste) { BG[f] = { y, h: hh(GL(f)), o: 0 }; y += BG[f].h + G; }
  if (levT > 0.3) { BG.lev = { y, h: hh(levT), o: 0 }; y += BG.lev.h + G; }
  y = 2;
  for (const f of liste) { BD[f] = { y, h: hh(GRl(f)), o: 0 }; y += BD[f].h + G; }
  if (co2T > 0.3) { BD.co2 = { y, h: hh(co2T), o: 0 }; }
  const col = (f) => (f === 'autres' ? '#b8bbc4' : J[f].base);
  const rub = [];
  const flow = (from, to, v, cls, fill) => { const a = BG[from], b = BD[to]; if (!a || !b || v <= 0.05) return null; const t = Math.min(hh(v), a.h - a.o + 0.01), t2 = Math.min(hh(v), b.h - b.o + 0.01); rub.push(ruban(XL + BW, a.y + a.o, a.y + a.o + t, XR - BW, b.y + b.o, b.y + b.o + t2, cls, fill)); a.o += t; b.o += t2; return { ym: (a.y + a.o - t / 2 + b.y + b.o - t2 / 2) / 2 }; };
  for (const f of liste) flow(f, f, Math.min(GL(f), GRr(f)), 'rb', col(f));
  let pCo2 = null; for (const f of liste) if (co2[f] > 0.3) { const r = flow(f, 'co2', co2[f], 'rb rb-co2', '#c9ccd4'); pCo2 = pCo2 || r; }
  let pLev = null; for (const f of liste) if (lev[f] > 0.3) { const r = flow('lev', f, lev[f], 'rb rb-lev', 'url(#hx)'); pLev = pLev || r; }
  let svg = '<defs><pattern id="hx" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="4" fill="#fff"/><line x1="0" y1="0" x2="0" y2="4" stroke="#55555f" stroke-width="1.5"/></pattern></defs>' + rub.join('');
  for (const f of liste) { svg += '<rect x="' + XL + '" y="' + BG[f].y.toFixed(1) + '" width="' + BW + '" height="' + BG[f].h.toFixed(1) + '" rx="2" fill="' + col(f) + '"/><rect x="' + (XR - BW) + '" y="' + BD[f].y.toFixed(1) + '" width="' + BW + '" height="' + BD[f].h.toFixed(1) + '" rx="2" fill="' + col(f) + '"/>'; }
  if (BG.lev) svg += '<rect x="' + XL + '" y="' + BG.lev.y.toFixed(1) + '" width="' + BW + '" height="' + BG.lev.h.toFixed(1) + '" rx="2" fill="url(#hx)" stroke="#16161a" stroke-width="1.5"/>';
  if (BD.co2) svg += '<rect x="' + (XR - BW) + '" y="' + BD.co2.y.toFixed(1) + '" width="' + BW + '" height="' + BD.co2.h.toFixed(1) + '" rx="2" fill="#8a909b"/>';
  // Étiquettes : à gauche ce que les houblons mettent, à droite ce que la bière garde (sur 100, simulé).
  const lab = [], lieux = { g: [], d: [] };
  const place = (cote, yc) => { let y0 = yc - 7; for (const z of lieux[cote]) if (Math.abs(z - y0) < 14) y0 = z + 14; lieux[cote].push(y0); return y0; };
  for (const f of liste) {
    const nomF = f === 'autres' ? 'autres' : COURT[f];
    lab.push('<span class="fx-l g" style="top:' + place('g', BG[f].y + BG[f].h / 2).toFixed(1) + 'px;--t:' + (f === 'autres' ? '#55555f' : J[f].texte) + '">' + (f === 'autres' ? '' : picto(f, 14)) + '<b>' + nomF + '</b>' + sim(fr0(GL(f)), { cls: 'fx-g', aria: nomF + ' mis par les houblons : ' + fr0(GL(f)) + ' (simulé)' }) + '</span>');
    lab.push('<span class="fx-l d" style="top:' + place('d', BD[f].y + BD[f].h / 2).toFixed(1) + 'px">' + sim('+' + fr0(GRl(f)), { aria: nomF + ' gardé : +' + fr0(GRl(f)) + ' sur 100 (simulé)' }) + '</span>');
  }
  if (BG.lev) lab.push('<span class="fx-l g" style="top:' + place('g', BG.lev.y + BG.lev.h / 2).toFixed(1) + 'px"><b style="color:#16161a">' + esc(L[ETAT.levure].nom) + '</b>' + sim('+' + fr0(levT), { cls: 'fx-g', aria: 'ajouté par la levure : ' + fr0(levT) + ' points (simulé)' }) + '</span>');
  if (BD.co2) lab.push('<span class="fx-l d" style="top:' + place('d', BD.co2.y + BD.co2.h / 2).toFixed(1) + 'px"><b style="color:#3d3d44">CO₂</b>' + sim('−' + fr0(co2T), { aria: 'emporté par le CO₂ : ' + fr0(co2T) + ' points (simulé)' }) + '</span>');
  if (pLev) lab.push('<span class="fx-r" data-role="biotransformation" style="top:' + (pLev.ym - 10).toFixed(1) + 'px">' + (ETAT.levure === 'pomona' ? picto('floral', 14) + 'géraniol → citronellol' + picto('citrus', 14) + conf('fournisseur') : 'précurseurs → thiols' + picto('tropical', 14) + conf('estime', 'convention')) + '</span>');
  else if (ETAT.moment === 'actif') lab.push('<span class="fx-r" data-role="biotransformation" style="top:4px">' + picto('floral', 14) + esc(L[ETAT.levure].nom) + ' : biotransformation à 0 au centre' + conf('inconnu', 'non documentée') + '</span>');
  else lab.push('<span class="fx-r" data-role="biotransformation" style="top:4px">' + picto('floral', 14) + 'après fermentation : aucune biotransformation simulée' + conf('inconnu', 'peu documenté') + '</span>');
  if (pCo2) lab.push('<span class="fx-r" style="top:' + (BD.co2.y - 16).toFixed(1) + 'px">' + picto('green', 14) + 'myrcène emporté' + conf('estime', 'convention') + '</span>');
  const hT = liste.reduce((s, f) => s + GL(f), 0);
  document.querySelector('[data-role="reponse"]').innerHTML = 'Houblons ' + sim(fr0(hT)) + ' · levure ' + sim((levT > 0.5 ? '+' : '') + fr0(levT)) + ' · CO₂ ' + sim(co2T > 0.5 ? '−' + fr0(co2T) : '0') + ' <span class="gris">points, toutes familles</span>';
  document.querySelector('[data-role="flux"]').innerHTML = '<svg class="fx" width="' + W + '" height="' + HT + '" viewBox="0 0 ' + W + ' ' + HT + '" role="img" aria-label="Flux simulé : de ce que les houblons mettent à ce que la bière garde">' + svg + '</svg>' + lab.join('');
  const b = c.biotransformation, pa = (b && b.parAjout) || [];
  const cit = pa.find((x) => x.citronellol_ugL), th = pa.find((x) => x.thiolsLiberes_ngL), rai = pa.find((x) => x.raison);
  document.querySelector('[data-role="flux-note"]').innerHTML = [
    cit && cit.citronellol_ugL.haut ? picto('citrus', 14) + 'Citronellol de Citra : ' + sim(fr0(cit.citronellol_ugL.centre) + ' µg/L') + ' au centre, jusqu’à ' + sim(fr0(cit.citronellol_ugL.haut)) : '',
    th && th.thiolsLiberes_ngL.haut ? picto('tropical', 14) + 'thiols libérés : ' + sim(fr0(th.thiolsLiberes_ngL.centre) + ' ng/L') + ', jusqu’à ' + sim(fr0(th.thiolsLiberes_ngL.haut)) : '',
    rai ? esc(texte(rai.raison).split(';')[0]) : '',
  ].filter(Boolean).join(' · ') + (autres.length ? ' · autres : ' + autres.map((f) => COURT[f].toLowerCase()).join(', ') : '');
  document.querySelector('[data-role="confiance"]').textContent = V.confiance(c.confiance);
  return c;
}
function redessiner() {
  // Diamond n'est que dans K4 (à la suite) : dans « ensemble », il passe à Verdant, sa convention dans le moteur.
  const dia = document.querySelector('[data-levure="diamond"]');
  dia.setAttribute('aria-disabled', String(ETAT.plan === 'ensemble'));
  if (ETAT.plan === 'ensemble' && ETAT.levure === 'diamond') { ETAT.levure = 'verdant'; document.querySelectorAll('[data-levure]').forEach((x) => x.setAttribute('aria-checked', String(x.dataset.levure === 'verdant'))); }
  document.querySelector('[data-h="a"]').innerHTML = nom('Citra') + usage('Citra') + alpha('Citra');
  document.querySelector('[data-h="b"]').innerHTML = nom('Idaho 7') + usage('Idaho 7') + alpha('Idaho 7') + stock('Idaho 7');
  const c = flux(), aj = c.ajouts;
  document.querySelector('[data-role="plan-d"]').innerHTML = aj.map((a) => esc(a.nom) + ' ' + mes(fr1(a.dose_gL) + ' g/L', 'moteur : cas ' + c.id) + ' J+' + a.jourDebut + ', ' + mes(a.jours + ' j', 'moteur : cas ' + c.id)).join(' · ') + (ETAT.plan === 'ensemble' ? '' : ' ' + conf('inconnu', 'ordre'));
  const s = profil(c, { ref: cas(idCas('us05', ETAT.moment)), ordre: ['Citra', 'Idaho 7'] });
  document.querySelector('[data-role="barres"]').innerHTML = V.P.ordre.map((f) => colonne(f, s[f], { lentille: lent(), tilde: false })).join('');
}
window.redessiner = redessiner;
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-role="reglage"]'); if (!b) return;
  if (b.dataset.moment) { ETAT.moment = b.dataset.moment; document.querySelectorAll('[data-moment]').forEach((x) => x.setAttribute('aria-checked', String(x === b))); }
  else if (b.dataset.plan) { ETAT.plan = b.dataset.plan; document.querySelectorAll('[data-plan]').forEach((x) => x.setAttribute('aria-checked', String(x === b))); }
  else if (b.dataset.levure) { if (b.getAttribute('aria-disabled') === 'true') return; ETAT.levure = b.dataset.levure; document.querySelectorAll('[data-levure]').forEach((x) => x.setAttribute('aria-checked', String(x === b))); }
  redessiner();
});
redessiner();
`;
S.page({
  fichier: S.D21 + '/a2/etat.html',
  titre: 'Ce que la levure en fait',
  description: 'Lot 21 · a2 : un flux de la cuve à la bière, sur les cas K4 et K5 du moteur ; la levure ajoute (Pomona : géraniol → citronellol ; Verdant, Diamond : thiols), le CO₂ emporte (myrcène). Générée par a2/generer-a2.mjs (../a1/socle.mjs).',
  css, corps, js, donnees,
  legende: [S.LEG_FAMILLES, S.LEG_NATURE, ['Le flux', [
    leg.li('<i class="lg-b" style="background:#e88d68"></i>', 'à gauche : ce que les houblons mettent'), leg.li('<i class="lg-b" style="background:#e88d68"></i>', 'à droite : ce que la bière garde'),
    leg.li('<i class="lg-b lg-l"></i>', 'hachuré : ce que la levure ajoute'), leg.li('<i class="lg-b" style="background:#8a909b"></i>', 'gris : emporté par le CO₂'),
  ], 'l2'], ['Barres', [
    leg.li('<i class="lg-b" style="background:#fdf1e3;border-top:1.5px solid #9b5d0d"></i>', 'zone du style 16D'), leg.li('<i class="lg-b" style="background:var(--acc)"></i>', 'au-delà : hors du style'),
    leg.li('<i class="sw m-plein"></i>', 'Citra'), leg.li('<i class="sw m-raye"></i>', 'Idaho 7'),
    leg.li('<i class="k-bio"></i>', 'part de la levure'), leg.li('<i class="lg-w"></i>', 'plage simulée'),
  ], 'l2'], S.LEG_HOUBLON],
});
