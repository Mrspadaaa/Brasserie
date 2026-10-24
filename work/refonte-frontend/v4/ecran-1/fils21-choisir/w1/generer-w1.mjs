// Lot 21 · w1 · « La phrase qui répond » (la réponse d'abord).
// Le brasseur dit ce qu'il veut (plus d'agrumes, de tropical, de floral, de fruits à noyau) ; la page répond
// par UNE phrase de recette — « Mets Cascade 2 g/L après fermentation 3 j avec US-05 » — dont chaque mot se
// touche pour le changer (houblon, dose, moment, jours, levure, un 2e houblon dans le même dry hop). Sous
// la phrase : ce que ça change, en mots et en crans ; si ça reste dans ta 16D ; trois raisons avec les vraies
// valeurs ; le profil ~ simulé (moteur profil-simule) en lignes nommées ; « Si tu t'en écartes » : la même
// réponse, une chose changée à la fois. « Pourquoi ? » ouvre la preuve : une étude, une mesure.
// La piste montrée n'est pas « la meilleure » : sa règle est écrite, et les autres pistes sont à un toucher.
// Usage : node generer-w1.mjs  →  w1/etat.html
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as S from './socle-w.mjs';

const { D, ORDRE, HOP, fr, esc, ic, pic, hop, nomH, alpha, usage, verdict, verdictHtml, conf, V, bandeLog, seg, curseur, feuille, pourquoi, preuve, page, ecrire, MOMENT, MOTS_F, inconnu, STUB_MOT, compacter, JS_DEPLIER, profilLignes, deltaU } = S;
const ICI = path.dirname(fileURLToPath(import.meta.url));
const HOPS = D.VALEURS.houblons;
const MOMS = ['b60', 'b10', 'wp', 'dryActive', 'dryPost'];
const DOSES = D.VALEURS.doses, JOURS = D.VALEURS.jours;
const AV = D.AVANT;

// ---------- la grille et les paires, embarquées en compact ----------
const G = {};
for (const g of D.PROFILS.grille) G[[g.houblon, g.moment, g.dose_gL, g.jours ?? '', g.levure].join('|')] = { p: compacter(g.profil), d: g.drapeaux, c: g.confiance };
const pk = (a, b, m, l) => [a, b].sort().join('+') + '|' + m + '|' + l;
const PA = {};
for (const p of D.PROFILS.paires) PA[pk(p.noms[0], p.noms[1], p.moment, p.levure)] = { p: compacter(p.profil), ap: Object.fromEntries(p.noms.map((n) => [n, ORDRE.map((f) => p.apports[n][f])])), fs: ORDRE.map((f) => p.facteur[f]), d: p.drapeaux, c: p.confiance };
// Diamond n'est simulé que dans K4 (Citra 2 g/L 3 j puis Idaho 7 2 g/L 5 j) : on le garde pour cette paire, avec son vrai titre.
for (const m of ['dryActive', 'dryPost']) {
  const c = D.cas('K4-diamond-' + (m === 'dryActive' ? 'actif' : 'apres'));
  if (c) PA[pk('Citra', 'Idaho 7', m, 'Diamond')] = { p: compacter(c.apres), ap: Object.fromEntries(c.apports.map((a) => [a.nom, ORDRE.map((f) => a.apport[f])])), fs: ORDRE.map((f) => (c.saturation && c.saturation.facteur ? c.saturation.facteur[f] : null)), d: c.drapeaux.map((x) => x.id), c: c.confiance.niveau, k4: c.titre };
}
const D_BIO = { Diamond: D.cas('K4-diamond-actif').drapeaux.find((x) => x.id === 'biotransformation-thiols').texte.split(' ; ')[0] };

// ---------- la piste montrée pour chaque envie : une règle écrite, pas un score caché ----------
const ENVIES = ['citrus', 'tropical', 'floral', 'stoneFruit'];
const REGLE = 'le geste le plus léger (dose la plus basse, puis moment le plus tardif) qui donne au moins un cran et demi à ta famille sans faire sortir une autre famille de ta 16D';
function pistes(f) {
  const xs = [];
  for (const g of D.PROFILS.grille) {
    if (g.levure !== 'US-05' || !['b10', 'wp', 'dryPost'].includes(g.moment) || g.dose_gL > 4) continue;
    if (g.jours != null && ![2, 3].includes(g.jours)) continue;
    const v = verdict(g.profil), d = g.profil[f].inconnu ? null : g.profil[f].crans - AV[f].crans;
    if (d == null) continue;
    xs.push({ h: g.houblon, m: g.moment, dose: g.dose_gL, j: g.jours, d, v: v.k });
  }
  const rang = { dryPost: 0, wp: 1, b10: 2 };
  const ok = xs.filter((x) => x.v !== 'hors' && x.d >= 1.5).sort((a, b) => a.dose - b.dose || rang[a.m] - rang[b.m] || (a.j || 0) - (b.j || 0) || b.d - a.d);
  const choix = ok.find((x) => x.v === 'dans') || ok[0] || xs.filter((x) => x.v !== 'hors').sort((a, b) => b.d - a.d)[0];
  const autres = []; for (const x of [...ok, ...xs.filter((y) => y.v !== 'hors').sort((a, b) => b.d - a.d)]) if (x !== choix && x.h !== choix.h && !autres.some((y) => y.h === x.h)) autres.push(x);
  const loin = xs.filter((x) => x.v === 'hors').sort((a, b) => a.dose - b.dose || b.d - a.d)[0];
  return { choix, autres: autres.slice(0, 4), loin };
}
const PISTES = Object.fromEntries(ENVIES.map((f) => [f, pistes(f)]));
for (const f of ENVIES) console.log(f.padEnd(11), JSON.stringify(PISTES[f].choix), '| autres', PISTES[f].autres.map((x) => x.h + ' ' + x.dose + ' ' + x.m).join(', '), '| loin', PISTES[f].loin && PISTES[f].loin.h + ' ' + PISTES[f].loin.dose);

// ---------- trois raisons, chacune avec un mot et une vraie valeur ----------
const huileTxt = (h) => fr(HOP[h].huileH.min) + '–' + fr(HOP[h].huileH.max);
const mm = (h) => D.MMP4[h];
function raisons(h) {
  const r1 = `<span class="w1-r" data-detail="preuve-${esc(h)}"><span class="w1-rt">${ic('huile', 14)}huile</span>${V(huileTxt(h) + ' mL/100 g', 'fiches : ' + HOP[h].huileH.src)}</span>`;
  const t = mm(h);
  const r2 = `<span class="w1-r" data-detail="preuve-${esc(h)}"><span class="w1-rt">${pic('tropical', 14)}${pic('berries', 14)}4MMP</span>${t ? V(t.txt + ' µg/kg', t.src + ' · Schmidt 2024') : inconnu('non mesuré pour ' + h, 'inconnu')}</span>`;
  return r1 + r2;
}

// ---------- la preuve : une feuille par houblon ----------
const RC = { Citra: D.rapports('cas-citra.json'), Cascade: D.rapports('cas-cascade.json'), Galaxy: D.rapports('cas-galaxy.json'), 'Idaho 7': D.rapports('cas-idaho7.json') };
const bande = (h, comp, fams) => { const r = RC[h] && RC[h][comp]; return r && r.min != null ? bandeLog({ compose: comp.replace(/ \(.*\)/, ''), familles: fams, min: r.min, max: r.max, central: r.central, source: 'moteur pouvoir aromatique (fils19 cas-' + h.toLowerCase().replace(' ', '') + '), 4 g/L, 3 j après', qui: h + ' 4 g/L', couleur: HOP[h].couleur }) : `<div class="w-lg"><div class="w-lg-t">${fams.map((f) => pic(f, 14)).join('')}<b>${comp.replace(/ \(.*\)/, '')}</b><span class="w-lg-q">${h} 4 g/L</span>${inconnu(r ? r.texte : 'non calculé', 'inconnu')}</div></div>`; };
const TROUS = ['aucune étude lue ne mesure Citra contre Cascade en bière, à dose égale', 'aucune comparaison chiffrée pour Galaxy', 'une seule étude pour Idaho 7 (au pitch, pas en dry hop)', 'aucune mesure qui croise variété, levure et dry hop'];
const E06 = (c) => D.mesureEtude('E06', (m) => m.variete === 'Citra' && m.compose === c);
const E08 = D.mesureEtude('E08', (m) => m.compose === '4-MMP');
const E10 = D.mesureEtude('E10', (m) => /différence d'arôme entre les temps/.test(m.descripteur || ''));
const KISH = D.VERIFS.find((v) => v.id === 'kishimoto-linalol');
// Le centre ~ simulé du linalol de Citra est 2 à 5 fois au-dessus des mesures publiées (note du moteur) : on le montre à côté.
const LIN_CITRA = (D.cas('K2-citra').mesures.find((m) => m.type === 'compose' && m.compose === 'linalol') || {}).concentration;
function feuillePreuve(h) {
  const pv = [];
  if (h === 'Citra') {
    pv.push(preuve(E06('linalol'), { note: 'dry hop, dose non indiquée ; témoin sans houblon 46,8 µg/L' }));
    if (LIN_CITRA && LIN_CITRA.plage) pv.push(`<li class="w-pv" data-nature="simule">${pic('floral', 14)}<span class="w-pv-q">linalol · Citra 4 g/L, moteur</span><b class="mono">~ ${fr(LIN_CITRA.plage.central, 0)} µg/L</b><span class="w-pv-s">${conf('calcule')}<span class="w-ref">plage ${fr(LIN_CITRA.plage.min, 0)}–${fr(LIN_CITRA.plage.max, 0)} µg/L</span></span><span class="w-pv-n">le centre du moteur est 2 à 5 fois au-dessus des mesures publiées (72–178 µg/L sur cinq bières, Kankolongo 2017) : lis la mesure d’abord</span></li>`);
  }
  if (h === 'Cascade' && KISH) pv.push(`<li class="w-pv" data-nature="mesure" data-source="H12 · Kishimoto 2008">${pic('floral', 14)}<span class="w-pv-q">linalol · Cascade 2 g/L</span><b class="mono">${fr(KISH.mesure.central)} µg/L</b><span class="w-pv-s">${conf('mesure')}<span class="w-ref">Kishimoto 2008 · publié</span></span><span class="w-pv-n">ajouté au moût refroidi ; le moteur donne 57 µg/L au centre</span></li>`);
  if (h === 'Idaho 7') { const m = D.mesureEtude('E03', (x) => x.variete === 'Idaho-7' && x.compose === 'linalol'); if (m) pv.push(preuve(m, { qui: 'Idaho 7', note: 'au pitch avec S-04, pas un dry hop ; dose inconnue' })); }
  if (h === 'Galaxy' || h === 'Motueka' || h === 'Nelson Sauvin') pv.push(`<li class="w-trou">${inconnu('aucune étude chiffrée', 'aucune mesure')}<span>${h === 'Galaxy' ? 'Galaxy : le panel OSU le place près de « catty / sweaty », séparé de Citra (4 g/L, 3 j, sans chiffre)' : h + ' : thiols non chiffrés ; pas de comparaison en bière dans nos études'}</span></li>`);
  if (h === 'Nelson Sauvin') { const m = D.mesureEtude('E06', (x) => x.variete === 'Nelson Sauvin' && x.compose === 'linalol'); if (m) pv.push(preuve(m, { note: 'dry hop, dose non indiquée' })); }
  pv.push(preuve(E08, { quoi: '4MMP, contact', qui: 'Eureka! 2,5 g/L', note: 'cassis : « 2 jours conseillés » (même étude)' }));
  pv.push(preuve(E10, { quoi: '1 h contre 96 h', qui: 'Cascade 1,43 g/L', mot: 'panel' }));
  const calc = RC[h] ? `<h3>${ic('calc', 14)}Calculé : rapport au seuil, ${esc(h)} et Cascade, 4 g/L, 3 j</h3>
    ${bande(h, 'linalol', ['floral', 'citrus'])}${h !== 'Cascade' ? bande('Cascade', 'linalol', ['floral', 'citrus']) : ''}
    ${bande(h, '4MMP (4MSP)', ['tropical', 'berries'])}${h !== 'Cascade' ? bande('Cascade', '4MMP (4MSP)', ['tropical', 'berries']) : ''}
    <p class="w1-note">Les bandes du linalol se recouvrent sur plus de ×1000 : le seuil varie selon la source. L’écart entre houblons se lit sur le 4MMP.</p>` : `<p class="w-trou">${inconnu('pas de cas du moteur pouvoir', 'pas calculé')}<span>${esc(h)} : pas de rapport au seuil calculé dans nos fichiers</span></p>`;
  return feuille('preuve-' + h, 'Pourquoi ' + esc(h) + ' ?', `
    <h3>${ic('livre', 14)}Ses fiches</h3>
    <div class="w1-fi">${hop(h, { plage: true, pellets: true })}<span>${ic('huile', 14)}huile ${V(huileTxt(h) + ' mL/100 g', 'fiches : ' + HOP[h].huileH.src)}</span>${mm(h) ? `<span>${pic('tropical', 14)}${pic('berries', 14)}4MMP ${V(mm(h).txt + ' µg/kg', mm(h).src)}</span>` : ''}</div>
    <h3>${ic('labo', 14)}Mesuré en bière</h3><ul class="w-pvs">${pv.join('')}</ul>
    ${calc}
    <h3>${ic('info', 14)}Ce qu’on ne sait pas</h3>${TROUS.map((t) => `<p class="w-trou">${inconnu(t, 'trou')}<span>${t}</span></p>`).join('')}
    <h3>${ic('reglages', 14)}Le profil ~ simulé</h3><p class="w1-note">${conf('simule')} ${esc(D.PROFILS.mention)} Ancre : Cascade 3,86 g/L, 24 h = 26 points d’agrumes (Lafontaine 2018, lecture de H, à revérifier : J lit le tableau à l’inverse).</p>`);
}

// ---------- les autres pistes, une feuille par envie ----------
function feuillePistes(f) {
  const P = PISTES[f], ligneP = (x, cls = '') => {
    const g = D.point(x.h, x.m, x.dose, x.j, 'US-05');
    return `<li class="w1-pi ${cls}"><span class="w1-pi-h">${hop(x.h, { usage: false })}</span><span class="mono w1-pi-d">${fr(x.dose)} g/L</span>${S.moment(x.m)}${x.j ? `<span class="mono">${x.j} j</span>` : ''}<span class="w1-pi-v">${pic(f, 14)}<b class="mono" data-nature="simule">~ ${deltaU(x.d)}</b>${verdictHtml(g.profil).replace('w-vd', 'w-vd petit')}</span><button type="button" class="w1-prendre" data-prendre='${JSON.stringify({ h: x.h, m: x.m, d: x.dose, j: x.j || 3 })}'>Prendre</button></li>`;
  };
  return feuille('pistes-' + f, 'Plus de ' + MOTS_F[f] + ' : les pistes', `<p class="w1-note">La première suit la règle : ${REGLE}. Les autres : d’autres houblons, rangés par écart. Tu choisis.</p>
    <ul class="w1-pis">${[P.choix, ...P.autres].map((x) => ligneP(x)).join('')}${P.loin ? ligneP(P.loin, 'loin') : ''}</ul>
    ${P.loin ? '<p class="w1-note">La dernière ligne sort de ta 16D : c’est ce que ta bière ne tient pas.</p>' : ''}`);
}

// ---------- l'écran ----------
const C0 = PISTES.citrus.choix;
const etat0 = { envie: 'citrus', h: C0.h, d: C0.dose, m: C0.m, j: C0.j || 3, l: 'US-05', h2: '' };
const p0 = D.point(etat0.h, etat0.m, etat0.d, etat0.m.startsWith('dry') ? etat0.j : null, etat0.l).profil;
const tok = (k, inner, lab) => `<button type="button" class="w1-tok" data-tok="${k}" aria-expanded="false" aria-label="${esc(lab)}">${inner}${ic('chevb', 12)}</button>`;
const choix = (k, items, actif, reg) => `<div class="w1-pick" data-pick="${k}" hidden>${seg(reg, k, items, actif, 'w1-seg')}</div>`;
const corps = `
  ${S.tete('Que faire ?')}
  <div class="w1-envie"><span class="w1-lab">Plus de</span>${seg('objectif', 'Ce que tu veux', ENVIES.map((f) => ({ v: f, h: pic(f, 16) + MOTS_F[f], aria: 'Plus de ' + MOTS_F[f] })), 'citrus', 'w1-envies')}</div>
  <section class="w1-rep" data-role="objectif" aria-label="La réponse">
    <p class="w1-phrase" data-role="ajout">
      <span class="w1-m">Mets</span>${tok('h', `<span class="w1-th" id="t-h">${nomH(etat0.h)}</span>`, 'Changer de houblon')}
      <span class="w1-h2" id="t-h2" hidden><span class="w1-m">+</span><span id="t-h2n"></span></span>
      ${tok('d', `<b class="mono" id="t-d">${etat0.d} g/L</b>`, 'Changer la dose')}
      ${tok('m', `<span id="t-m">${S.moment(etat0.m)}</span>`, 'Changer le moment')}
      ${tok('j', `<b class="mono" id="t-j">${etat0.j} j</b>`, 'Changer les jours de contact')}
      <span class="w1-m">avec</span>${tok('l', `<b id="t-l">US-05</b>`, 'Changer de levure')}
      ${tok('h2', `${ic('cumul', 14)}<span class="w1-t2">2e houblon</span>`, 'Ajouter un deuxième houblon dans le même dry hop').replace('<button', '<button data-reglage="ajout-cumule"')}
    </p>
    <div class="w1-al" id="t-al">${alpha(etat0.h)}${usage(etat0.h)}</div>
    ${choix('h', HOPS.map((h) => ({ v: h, h: esc(h), aria: h })), etat0.h, 'houblon')}
    <div class="w1-pick" data-pick="d" hidden><div class="w1-cur"><span class="mono">${DOSES[0]}</span>${curseur('dose', 'Dose en g/L', { min: 0, max: DOSES.length - 1, value: DOSES.indexOf(etat0.d) })}<span class="mono">${DOSES[DOSES.length - 1]} g/L</span></div></div>
    ${choix('m', MOMS.map((m) => ({ v: m, h: ic(MOMENT[m].ic, 14) + MOMENT[m].court, aria: MOMENT[m].lg })), etat0.m, 'moment')}
    ${choix('j', JOURS.map((j) => ({ v: String(j), t: j + ' j' })), String(etat0.j), 'jours')}
    <div class="w1-pick" data-pick="l" hidden>${seg('levure-choix', 'Levure', ['US-05', 'Pomona', 'Verdant', 'Diamond'].map((l) => ({ v: l, t: l })), 'US-05', 'w1-seg')}<p class="w1-note" id="l-note"></p></div>
    ${choix('h2', [{ v: '', t: 'seul' }, ...HOPS.map((h) => ({ v: h, t: '+ ' + h }))], '', 'ajout-cumule')}
    <div class="w1-ver"><span id="r-vd">${verdictHtml(p0)}</span></div>
    <div class="w1-risque" id="r-rq" hidden>${ic('risque', 16)}<span>hop creep</span>${V('+0,39 % vol. en 2 j', 'H35 · Klimczak 2023')}</div>
  </section>
  <section class="w1-sim" data-role="simulation" aria-label="Profil simulé">
    <div class="w1-sim-t">${conf('simule')}<span class="w1-lg"><i class="w1-av"></i>ta bière</span><span class="w1-lg"><i class="w1-ap"></i>après</span><span class="w1-lg"><i class="w1-zz"></i>ta 16D</span><span class="w1-cf" id="r-cf" data-nature="simule">~ confiance</span></div>
    ${profilLignes(p0, AV, { id: 'prof', cible: 'citrus' })}
    <p class="w1-note w1-deja">${pic('resin', 14)}Résineux déjà au-dessus : ta dégustation du 18.10.</p>
    <div class="w1-rs" id="r-rs">${raisons(etat0.h)}<span class="w1-r" id="r-j" data-detail="preuve-${esc(etat0.h)}"><span class="w1-rt">${ic('timer', 14)}contact</span><span class="w-v w1-jt" id="r-jt" data-nature="mesure" data-source="H73 · Wolfe 2012 ; E08 · Schmidt 2019">24 h suffisent</span></span></div>
    <div class="w1-bio" data-role="biotransformation" id="r-bio">${ic('bio', 16)}<span id="r-biot"></span></div>
    <div class="w1-act">${pourquoi('preuve-' + etat0.h)}<button type="button" class="w-pq" data-detail="pistes-citrus" id="b-pistes">${ic('melange', 14)}<span>Autres pistes</span></button></div>
    <div class="w1-k5" id="r-k5" hidden>
      <h3 class="w1-h3">${ic('cumul', 14)}Ensemble dans le même dry hop : ce que chacun apporte</h3>
      <div id="k5-bars"></div>
      <div class="w1-k5-d"><span class="w1-k5-i">${ic('huile', 14)}Dose totale ${V('4 g/L', 'somme des deux ajouts')} : la saturation est partagée. Cascade, part du linalol extraite ${V('23 % à 2 g/L, 7 % à 16 g/L', 'E04 · Lafontaine 2018')} (mesuré).</span>
      <span class="w1-k5-i">${inconnu('synergie : aucune pondération transposable', 'synergie inconnue')}${inconnu('masquage : aucune étude', 'masquage inconnu')}${inconnu('ordre : aucune étude', 'ordre inconnu')}</span></div>
    </div>
    <div class="w1-aut" id="r-aut">
      <h3 class="w1-h3">${ic('reglages', 14)}Si tu t’en écartes <span class="w1-h3s">~ crans d’${MOTS_F.citrus} gagnés, et ta 16D</span></h3>
      ${['d', 'h', 'm', 'j', 'l'].map((k) => `<div class="w1-st" data-strip="${k}"><span class="w1-stl">${{ d: 'dose', h: 'houblon', m: 'moment', j: 'jours', l: 'levure' }[k]}</span><div class="w1-cs" id="s-${k}"></div></div>`).join('')}
    </div>
  </section>
  <p class="w1-pied">${conf('simule')}<span>${STUB_MOT}</span><span>· ta 16D, Nugget 60′</span>${alpha('Nugget')}</p>`;

const css = `
  .w1-envie { display: flex; align-items: center; gap: 6px; }
  .w1-lab { font-size: 14px; font-weight: 700; white-space: nowrap; }
  .w1-envies { overflow-x: auto; scrollbar-width: none; max-width: 100%; }
  .w1-envies button { padding: 0 9px 0 6px; font-size: 14px; }
  .w1-rep { display: flex; flex-direction: column; gap: 8px; padding: 10px 12px 12px; border-radius: 8px; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.14), inset 4px 0 0 var(--cible, #d9b414); }
  .w1-phrase { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 4px; font-size: 16px; line-height: 1.3; }
  .w1-m { font-size: 16px; color: var(--gris); }
  .w1-tok { display: inline-flex; align-items: center; gap: 3px; min-height: 34px; padding: 0 6px 0 8px; border-radius: 8px; background: #f3f3f6; box-shadow: inset 0 -2px 0 #c4c4cc; font-size: 16px; }
  .w1-tok[aria-expanded="true"] { background: #fff; box-shadow: inset 0 0 0 2px var(--encre); }
  .w1-tok b { font-weight: 600; } .w1-tok .hn { font-size: 16px; } .w1-tok .w-mo { font-size: 16px; font-weight: 600; }
  .w1-t2 { font-size: 14px; }
  .w1-h2 { display: inline-flex; align-items: center; gap: 4px; } .w1-h2 .hn { font-size: 16px; }
  .w1-al { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; min-height: 18px; }
  .w1-pick { padding: 2px 0; display: flex; flex-direction: column; gap: 4px; }
  .w1-seg { flex-wrap: wrap; border-radius: 8px; } .w1-seg button { border-radius: 8px; }
  .w1-seg button[aria-disabled="true"] { color: #8b8b95; text-decoration: line-through; }
  .w1-cur { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--gris); }
  .w1-ver { display: flex; flex-direction: column; gap: 4px; }
  .w1-rs { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }
  .w1-r { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; padding: 6px 6px 7px; border-radius: 8px; background: #f6f6f9; cursor: pointer; min-width: 0; }
  .w1-rt { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; font-weight: 700; }
  .w1-r .w-v { font-size: 12px; white-space: normal; font-weight: 600; }
  .w1-rs-s { font-size: 12px; color: var(--gris); }
  .w1-jt { font-family: var(--sans); letter-spacing: 0; }
  .w1-k5 .w1-h3 { flex-wrap: nowrap; align-items: flex-start; } .w1-k5 .w1-h3 .ic { margin-top: 2px; }
  #r-biot { display: inline-flex; align-items: center; gap: 4px; flex-wrap: wrap; }
  .w1-bio, .w1-risque { display: flex; align-items: center; gap: 6px; font-size: 14px; flex-wrap: wrap; }
  .w1-risque { color: var(--acc); font-weight: 600; } .w1-risque .w-v { color: var(--encre); font-weight: 500; }
  .w1-sim { display: flex; flex-direction: column; gap: 6px; }
  .w1-sim-t { display: flex; align-items: center; gap: 10px; font-size: 12px; color: var(--gris); flex-wrap: wrap; }
  .w1-lg { display: inline-flex; align-items: center; gap: 4px; }
  .w1-av { width: 2px; height: 12px; background: var(--encre); display: inline-block; border-radius: 2px; }
  .w1-ap { width: 14px; height: 8px; background: #d9b414; display: inline-block; border-radius: 0 2px 2px 0; }
  .w1-zz { width: 14px; height: 12px; background: rgba(217,180,20,.2); border-right: 1.5px solid #856e0c; display: inline-block; }
  .w1-cf { margin-left: auto; }
  .w1-deja { display: flex; align-items: center; gap: 4px; }
  .w1-act { display: flex; gap: 8px; flex-wrap: wrap; }
  .w1-h3 { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 700; margin-top: 6px; flex-wrap: wrap; }
  .w1-h3s { font-size: 12px; font-weight: 400; color: var(--gris); }
  .w1-aut { display: flex; flex-direction: column; gap: 6px; }
  .w1-st { display: grid; grid-template-columns: 56px 1fr; align-items: center; gap: 6px; }
  .w1-stl { font-size: 12px; color: var(--gris); }
  .w1-cs { display: flex; gap: 4px; }
  .w1-c { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 3px 2px; border-radius: 8px; background: #f6f6f9; }
  .w1-c[aria-checked="true"] { background: #fff; box-shadow: inset 0 0 0 2px var(--encre); }
  .w1-cz { height: 24px; width: 100%; display: flex; align-items: flex-end; justify-content: center; }
  .w1-cb { width: 14px; border-radius: 2px 2px 0 0; background: var(--cc, #d9b414); transition: height .25s; }
  .w1-cn { font: 600 12px var(--mono); }
  .w1-cl { font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .w1-cv { font-size: 12px; font-weight: 700; } .w1-c.hors .w1-cv { color: var(--acc); } .w1-c.dans .w1-cv { color: #2f6b4f; } .w1-c.bord .w1-cv { color: var(--gris); }
  .w1-k5 { display: flex; flex-direction: column; gap: 6px; padding: 8px 10px; border-radius: 8px; background: #f6f6f9; }
  .w1-k5-l { display: grid; grid-template-columns: 16px 82px 1fr 64px; align-items: center; gap: 6px; font-size: 14px; }
  .w1-k5-n { color: var(--t); font-weight: 600; font-size: 12px; }
  .w1-k5-b { display: flex; height: 12px; } .w1-k5-b i { display: block; height: 12px; } .w1-k5-b i:first-child { border-radius: 2px 0 0 2px; } .w1-k5-b i:last-child { border-radius: 0 2px 2px 0; }
  .w1-k5-v { font-size: 12px; text-align: right; }
  .w1-k5-lg { font-size: 12px; color: var(--gris); display: flex; align-items: center; gap: 4px; flex-wrap: wrap; } .w1-k5-lg i { width: 10px; height: 10px; border-radius: 2px; display: inline-block; }
  .w1-k5-d { display: flex; flex-direction: column; gap: 4px; font-size: 12px; } .w1-k5-i { display: block; line-height: 1.6; } .w1-k5-i .ic { display: inline-block; vertical-align: -2px; margin-right: 4px; } .w1-k5-i .w-inc { margin-right: 10px; } .w1-k5-i .w-v { white-space: normal; }
  .w1-pied { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 12px; color: var(--gris); }
  .w1-fi { display: flex; flex-direction: column; gap: 6px; } .w1-fi > span { display: inline-flex; align-items: center; gap: 6px; }
  .w1-note { font-size: 12px; color: var(--gris); }
  .w1-pis { list-style: none; display: flex; flex-direction: column; gap: 8px; }
  .w1-pi { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; padding: 8px 10px; border-radius: 8px; background: #f6f6f9; font-size: 14px; }
  .w1-pi.loin { background: #fdf0ea; }
  .w1-pi-h { flex-basis: 100%; }
  .w1-pi-v { display: inline-flex; align-items: center; gap: 4px; }
  .w-vd.petit { font-size: 12px; }
  .w1-prendre { margin-left: auto; min-height: 30px; padding: 0 12px; border-radius: 999px; background: var(--encre); color: #fff; font-weight: 700; font-size: 14px; }
`;

const js = `${JS_DEPLIER}
const G = ${JSON.stringify(G)}, PA = ${JSON.stringify(PA)};
const AV = SIM.AV;
const DOSES = ${JSON.stringify(DOSES)};
const MOMENT = ${JSON.stringify(MOMENT)};
const HOPS = ${JSON.stringify(Object.fromEntries(HOPS.map((h) => [h, { alpha: S.alpha(h), usage: S.usage(h), nom: S.nomH(h) }])))};
const HC = ${JSON.stringify(Object.fromEntries(HOPS.map((h) => [h, HOP[h].couleur])))};
const PISTES = ${JSON.stringify(Object.fromEntries(ENVIES.map((f) => [f, { h: PISTES[f].choix.h, m: PISTES[f].choix.m, d: PISTES[f].choix.dose, j: PISTES[f].choix.j || 3 }])))};
const RAISONS = ${JSON.stringify(Object.fromEntries(HOPS.map((h) => [h, raisons(h)])))};
const D_BIO = ${JSON.stringify(D_BIO)};
const E = ${JSON.stringify(etat0)};
const $ = (s) => document.querySelector(s);
const momHtml = (m) => '<span class="w-mo" data-role="moment" data-moment="' + m + '" aria-label="Moment : ' + MOMENT[m].lg + '">' + ICO(MOMENT[m].ic, 14) + '<span>' + MOMENT[m].t + '</span></span>';
const pk = (a, b, m, l) => [a, b].sort().join('+') + '|' + m + '|' + l;
const dispo = (st) => { const s = { ...E, ...st }; if (s.h2) return !!PA[pk(s.h, s.h2, s.m, s.l)]; return !!G[cle(s.h, s.m, s.d, s.m.startsWith('dry') ? s.j : '', s.l)]; };
function profilDe(s) {
  if (s.h2) { const x = PA[pk(s.h, s.h2, s.m, s.l)]; return x ? { p: deplier(x.p), d: x.d, c: x.c, pa: x } : null; }
  const g = G[cle(s.h, s.m, s.d, s.m.startsWith('dry') ? s.j : '', s.l)];
  return g ? { p: deplier(g.p), d: g.d, c: g.c } : null;
}
function rendre() {
  if (E.h2 === E.h) E.h2 = '';
  if (E.h2) { E.d = 2; E.j = 3; if (!E.m.startsWith('dry')) E.m = 'dryPost'; }
  if (!dispo({})) { if (E.h2 && E.l === 'Diamond') E.l = 'US-05'; else if (!E.h2 && !['US-05', 'Pomona'].includes(E.l)) E.l = 'US-05'; }
  const r = profilDe(E); if (!r) return;
  const dry = E.m.startsWith('dry');
  $('#t-h').innerHTML = HOPS[E.h].nom;
  $('#t-h2').hidden = !E.h2; $('#t-h2n').innerHTML = E.h2 ? HOPS[E.h2].nom : '';
  $('#t-d').textContent = (E.h2 ? '2 + 2' : String(E.d).replace('.', ',')) + ' g/L';
  $('#t-m').innerHTML = momHtml(E.m);
  $('[data-tok="j"]').hidden = !dry; $('#t-j').textContent = E.j + ' j';
  $('#t-l').textContent = E.l;
  $('#t-al').innerHTML = HOPS[E.h].alpha + HOPS[E.h].usage + (E.h2 ? '<span class="w-mo">+</span>' + HOPS[E.h2].alpha + HOPS[E.h2].usage : '');
  majProfil($('#prof'), r.p, AV);
  $('#r-vd').innerHTML = verdictHtml(r.p);
  $('#r-rs').querySelectorAll('.w1-r:not(#r-j)').forEach((x) => x.remove());
  $('#r-j').insertAdjacentHTML('beforebegin', RAISONS[E.h]);
  $('#r-jt').textContent = !dry ? (E.m === 'b60' ? 'à 60′ : surtout de l’amertume' : E.m === 'b10' ? 'à chaud : 4MMP −91 % en 60′' : 'à chaud : part des huiles retenue') : E.j > 3 ? 'rien de plus après 3 j' : '24 h suffisent, thiols en 2 j';
  
  const bio = E.m !== 'dryActive' ? '<span class="w-inc"><i class="w-hach" aria-hidden="true"></i>biotransformation : ' + (dry ? 'hors du cas, après fermentation' : 'pas de levure au contact') + '</span>'
    : E.l === 'Pomona' ? '<b>Pomona en actif</b>' + PIC('floral', 16) + ICO('fleche', 12) + PIC('citrus', 16) + '<span>géraniol → citronellol : ~ 50 % au centre, jusqu’à 87 %</span><span class="w-cf">convention, H41</span>'
    : E.l === 'Verdant' ? '<b>Verdant en actif</b>' + PIC('tropical', 16) + PIC('citrus', 16) + '<span>thiols libérés ~ 0,1 % (<span class="w-v mono" data-nature="mesure" data-source="H42">0,01–0,35 %</span> sur précurseur de synthèse)</span>'
    : E.l === 'Diamond' ? '<b>Diamond en actif</b>' + PIC('tropical', 16) + '<span>' + D_BIO.Diamond + '</span>'
    : '<span class="w-inc"><i class="w-hach" aria-hidden="true"></i>US-05 en actif : biotransformation non publiée (centre 0, pas une preuve d’absence)</span>';
  $('#r-biot').innerHTML = bio;
  $('#r-rq').hidden = E.m !== 'dryActive';
  $('#r-cf').textContent = '~ confiance ' + (r.c || '?');
  document.querySelectorAll('[data-detail^="preuve-"]').forEach((b) => (b.dataset.detail = 'preuve-' + E.h));
  $('#prof').querySelectorAll('.w-col').forEach((c) => c.classList.toggle('cible', c.dataset.famille === E.envie));
  for (const [k, v] of [['houblon', E.h], ['moment', E.m], ['jours', String(E.j)], ['levure-choix', E.l], ['ajout-cumule', E.h2]]) document.querySelectorAll('.w1-pick [data-reglage="' + k + '"][role="radio"]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.v === v)));
  document.querySelectorAll('.w1-pick [data-reglage="levure-choix"][role="radio"]').forEach((b) => b.setAttribute('aria-disabled', String(!dispo({ l: b.dataset.v }))));
  $('#l-note').textContent = E.h2 ? 'Diamond : simulé pour Citra + Idaho 7 seulement (cas K4).' : 'Verdant, Diamond : simulés seulement avec deux houblons ; Diamond pour Citra + Idaho 7.';
  const cur = $('[data-reglage="dose"]'); if (cur) cur.value = String(Math.max(0, DOSES.indexOf(E.d)));
  $('#r-k5').hidden = !r.pa;
  if (r.pa) {
    const [h1, h2] = Object.keys(r.pa.ap);
    const top = ORD.map((f, i) => ({ f, i, t: (r.pa.ap[h1][i] || 0) + (r.pa.ap[h2][i] || 0) })).filter((x) => x.t > 0.5).sort((a, b) => b.t - a.t).slice(0, 4);
    const W = 150;
    $('#k5-bars').innerHTML = top.map((x) => { const a = r.pa.ap[h1][x.i] || 0, b = r.pa.ap[h2][x.i] || 0, fs = r.pa.fs[x.i];
      return '<div class="w1-k5-l" data-famille="' + x.f + '">' + PIC(x.f, 16) + '<span class="w1-k5-n">' + MOTS_F[x.f] + '</span><span class="w1-k5-b"><i data-nature="simule" style="width:' + Math.min(W, a * 2.5) + 'px;background:' + HC[h1] + '"></i><i data-nature="simule" style="width:' + Math.min(W, b * 2.5) + 'px;background:' + HC[h2] + '"></i></span><b class="mono w1-k5-v" data-nature="simule">~ +' + Math.round(a + b) + ' pts' + (fs != null && fs < 0.98 ? '<br>' + Math.round(fs * 100) + ' %' : '') + '</b></div>'; }).join('')
      + '<p class="w1-k5-lg"><i style="background:' + HC[h1] + '"></i>' + h1 + '<i style="background:' + HC[h2] + '"></i>' + h2 + '<span>· points sur 100, ~ simulés ; « 71 % » : ensemble, ils donnent 71 % de la somme de chacun seul</span></p>' + (r.pa.k4 ? '<p class="w1-note">Cas K4 du moteur : ' + r.pa.k4 + '</p>' : '');
  }
  const cellule = (reg, v, lab, st, actif) => {
    const x = profilDe({ ...E, ...st }); if (!x) return '';
    const d = x.p[E.envie].inconnu ? null : x.p[E.envie].crans - AV[E.envie].crans, vd = verdict(x.p).k;
    const h = d == null ? 0 : Math.max(2, Math.min(5, d) * 5);
    return '<button type="button" class="w1-c ' + vd + '" data-role="reglage" data-reglage="' + reg + '" data-v="' + v + '" aria-checked="' + actif + '"><span class="w1-cz">' + (d == null ? '<i class="w-hach"></i>' : '<i class="w1-cb" data-nature="simule" style="height:' + h + 'px"></i>') + '</span>'
      + '<span class="w1-cn" data-nature="simule">' + (d == null ? '?' : (d >= 0 ? '+' : '−') + String(Math.round(Math.abs(d) * 10) / 10).replace('.', ',')) + '</span><span class="w1-cl">' + lab + '</span><span class="w1-cv">' + (vd === 'hors' ? 'hors' : vd === 'bord' ? 'bord' : 'dans') + '</span></button>'; };
  const k5 = !!E.h2;
  $('[data-strip="d"]').hidden = k5; $('[data-strip="j"]').hidden = k5 || !dry;
  $('#s-d').innerHTML = DOSES.map((d) => cellule('dose-pas', d, d + ' g/L', { d, h2: '' }, d === E.d)).join('');
  $('#s-h').innerHTML = k5 ? Object.keys(HOPS).filter((h) => h !== E.h).map((h) => cellule('second-pas', h, '+ ' + h, { h2: h }, h === E.h2)).join('') : Object.keys(HOPS).map((h) => cellule('houblon-pas', h, h, { h }, h === E.h)).join('');
  $('#s-m').innerHTML = (k5 ? ['dryActive', 'dryPost'] : ['b60', 'b10', 'wp', 'dryActive', 'dryPost']).map((m) => cellule('moment-pas', m, MOMENT[m].court, { m }, m === E.m)).join('');
  $('#s-j').innerHTML = [1, 2, 3, 5, 7].map((j) => cellule('jours-pas', j, j + ' j', { j }, j === E.j)).join('');
  const LV = E.h2 ? [['Pomona', 'dryActive'], ['Verdant', 'dryActive'], ['US-05', 'dryActive'], ['US-05', 'dryPost']] : [['Pomona', 'dryActive'], ['US-05', 'dryActive'], ['US-05', 'dryPost']];
  $('#s-l').innerHTML = LV.map(([l, m]) => cellule('levure', l + '|' + m, l + (m === 'dryActive' ? ' actif' : ' après'), { l, m }, E.l === l && E.m === m)).join('');
  $('[data-strip="l"]').hidden = !dry;
  document.querySelector('.w1-h3s').textContent = '~ crans de ' + MOTS_F[E.envie] + ' gagnés, et ta 16D';
  const cc = getComputedStyle(document.querySelector('#prof [data-famille="' + E.envie + '"]')).getPropertyValue('--c');
  document.querySelectorAll('.w1-c').forEach((c) => c.style.setProperty('--cc', cc));
}
function changeU(p, a, n) {
  return ORD.map((f) => ({ f, d: p[f].inconnu ? null : p[f].crans - a[f].crans })).filter((x) => x.d != null && Math.abs(x.d) >= 0.5).sort((x, y) => Math.abs(y.d) - Math.abs(x.d)).slice(0, n)
    .map((x) => '<span class="w-ch' + (p[x.f].centre > SIM.B[x.f][1] && a[x.f].centre <= SIM.B[x.f][1] ? ' hors' : '') + '" data-famille="' + x.f + '">' + PIC(x.f, 14) + '<b>~ ' + deltaU(x.d) + '</b> ' + MOTS_F[x.f] + '</span>').join('') || '<span class="w-ch">~ rien ne bouge d’un cran</span>';
}
document.addEventListener('click', (e) => { const c = e.target.closest('.w1-c'); if (!c) return; const v = c.dataset.v;
  ({ 'dose-pas': () => { E.d = Number(v); E.h2 = ''; }, 'houblon-pas': () => { E.h = v; }, 'second-pas': () => { E.h2 = v; }, 'moment-pas': () => { E.m = v; }, 'jours-pas': () => { E.j = Number(v); }, levure: () => { const [l, m] = v.split('|'); E.l = l; E.m = m; } })[c.dataset.reglage]();
  rendre(); });
document.querySelectorAll('[data-reglage="objectif"] [role="radio"]').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('[data-reglage="objectif"] [role="radio"]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
  E.envie = b.dataset.v; Object.assign(E, PISTES[E.envie]); E.l = 'US-05'; E.h2 = '';
  $('#b-pistes').dataset.detail = 'pistes-' + E.envie;
  document.querySelector('.w1-rep').style.setProperty('--cible', getComputedStyle(b.querySelector('svg')).getPropertyValue('--b') || '');
  rendre();
}));
document.querySelectorAll('.w1-tok').forEach((t) => t.addEventListener('click', () => {
  const k = t.dataset.tok, ouvert = t.getAttribute('aria-expanded') === 'true';
  document.querySelectorAll('.w1-tok').forEach((x) => x.setAttribute('aria-expanded', 'false'));
  document.querySelectorAll('.w1-pick').forEach((p) => (p.hidden = true));
  if (!ouvert) { t.setAttribute('aria-expanded', 'true'); document.querySelector('[data-pick="' + k + '"]').hidden = false; }
}));
const POSE = { houblon: (v) => (E.h = v), moment: (v) => (E.m = v), jours: (v) => (E.j = Number(v)), 'levure-choix': (v) => (E.l = v), 'ajout-cumule': (v) => (E.h2 = v) };
document.querySelectorAll('.w1-pick [role="radio"]').forEach((b) => b.addEventListener('click', () => { if (b.getAttribute('aria-disabled') === 'true') return; POSE[b.dataset.reglage](b.dataset.v); rendre(); }));
const cur = $('[data-reglage="dose"]');
cur && cur.addEventListener('input', () => { E.d = DOSES[Number(cur.value)]; E.h2 = ''; rendre(); });
document.addEventListener('click', (e) => { const p = e.target.closest('[data-prendre]'); if (!p) return; Object.assign(E, JSON.parse(p.dataset.prendre)); E.h2 = ''; fermerDetail(); rendre(); });
const q = new URLSearchParams(location.search);
if (q.get('envie')) document.querySelector('[data-reglage="objectif"] [data-v="' + q.get('envie') + '"]').click();
for (const k of ['h', 'm', 'l', 'h2']) if (q.get(k) != null) E[k] = q.get(k);
for (const k of ['d', 'j']) if (q.get(k)) E[k] = Number(q.get(k));
rendre();
if (q.get('ouvre')) document.querySelector('[data-tok="' + q.get('ouvre') + '"]').click();
`;

const feuilles = HOPS.map(feuillePreuve).join('\n') + ENVIES.map(feuillePistes).join('\n');
ecrire(path.join(ICI, 'etat.html'), page({
  titre: 'w1 · La phrase qui répond',
  commentaire: 'Lot 21 · w1 : la réponse en une phrase de recette dont chaque mot se touche ; profil ~ simulé (' + STUB_MOT + ') en lignes nommées ; vraies valeurs sourcées ; preuve à un toucher.',
  corps, css, js, feuilles, demande: [{ f: 'citrus', s: 1 }],
}));
