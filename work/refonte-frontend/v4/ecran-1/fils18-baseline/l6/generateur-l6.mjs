// Lot 18 · l6 · Jour de brassage : q2b (c1) rangé le long du brassin. Une colonne sombre, la
// « colonne du brassin », court de haut en bas : la visée d'abord, puis 60′, 10′, le whirlpool, le dry
// hop en fermentation active et la levure, chacun à sa place dans le temps ; chaque voie pend à son
// moment. La recette actuelle (Nugget 46 g à 60′) est posée à sa place, en repère. La meilleure voie de
// chaque objectif porte son moment au bout de sa barre. L'intensité de chaque famille est une jauge à
// crans (un cran du style par segment), à la longueur exacte des crans du moteur.
// Données : ../l5/donnees-l5-l6.mjs (c1.json, pack, base). Usage : node generateur-l6.mjs
import * as K from '../l5/donnees-l5-l6.mjs';
const { C, J, V, OB, OBJ, ORDRE, NOM, picto, ico, esc, fr, sg, pc, cl, cran, zone, viseeS, viseeA, niv, NIVMOT, crOf, arr, nomVoie, momentDe, MOMENT, usageDe, STOCK_MOT, STOCK_ICO, bioDe, AJOUTEES, COUL_H, DEG, crTxt } = K;
const OUT = K.E1 + '/fils18-baseline/l6';
const rgba = (hex, a) => { const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)); return `rgba(${v.join(',')},${a})`; };

// ---------- petites marques (le jeu v3, au trait de 1,5 px) ----------
const chip = (id) => { const m = MOMENT[id]; return `<span class="mo" data-role="moment" data-moment="${id}" aria-label="Moment : ${m.lg}">${ico(m.ic, 14)}<span>${m.court || m.t}</span></span>`; };
function usage(h) {
  const { u, src } = usageDe(h);
  const dit = src === 'fournisseur' ? 'attesté par le fournisseur' : 'déduit de l\'α, à valider';
  const ics = u === 'amérisant' ? ico('j-goutte', 14) : u === 'aromatique' ? ico('j-arome', 14) : u === 'double' ? ico('j-goutte', 14) + ico('j-arome', 14) : '<b class="inc">?</b>';
  return `<span class="us${src === 'règle' ? ' deduit' : ''}" data-role="usage" data-usage="${u}" data-source="${src}" data-houblon="${esc(h.houblon)}" role="img" aria-label="${esc(h.houblon)} : ${u}, ${dit}">${ics}${src === 'règle' ? '<i class="al">α</i>' : ''}</span>`;
}
const stockMarque = (v) => (v.levureVers ? '' : `<span class="stk" role="img" aria-label="${STOCK_MOT[v.stock]}">${ico(STOCK_ICO[v.stock], 14)}</span>`);
const nomHtml = (X) => (X.v.levureVers ? `<span>${esc(X.v.levureVers)}</span>` : X.v.actions.map((a) => `<span data-houblon="${esc(a.houblon)}">${esc(a.houblon)}</span>`).join(' + '));
const pastilleSel = (X) => (X.v.levureVers ? '' : X.v.actions.filter((a) => COUL_H[a.houblon]).map((a) => `<i class="sel" data-houblon-compare="${esc(a.houblon)}" data-couleur="${COUL_H[a.houblon]}" style="--h:${COUL_H[a.houblon]}" aria-hidden="true"></i>`).join(''));
const plus = (X) => { const { nom } = nomVoie(X.v), on = AJOUTEES.includes(X.n); return `<button class="plus" data-role="ajouter-comparer" aria-pressed="${on}" aria-label="${on ? 'Retirer ' + esc(nom) + ' de la comparaison' : 'Ajouter ' + esc(nom) + ' à la comparaison'}">${ico('i-plus', 16, 'class="i-p"')}${ico('i-check', 16, 'class="i-c"')}</button>`; };
function bioPill(X) {
  const sig = bioDe(X); if (!sig.length) return '';
  const has = (id) => sig.find((s) => s.id === id);
  let pic = '';
  if (has('geraniol-citronellol')) pic += `<span class="bt">${picto('floral', 14)}${ico('i-arrow-r', 12)}${picto('citrus', 14)}</span>`;
  if (has('thiols')) pic += `<span class="bt">${picto('tropical', 14)}${picto('berries', 14)}</span>`;
  if (has('hop-creep')) pic += '<span class="bt mot">creep</span>';
  const liste = sig.map((s) => `<li><b>${esc(s.titre)}</b> · ${s.statut}. <span class="src">${esc(s.pourquoi)}</span></li>`).join('');
  return `<details class="bio" data-role="bio"><summary aria-label="Biotransformation possible, ampleur non quantifiée : ${sig.map((s) => esc(s.titre)).join(' ; ')}">${pic}</summary><ul>${liste}</ul></details>`;
}

// ---------- la barre s5 (deux couloirs autour de ma bière), comme q2b ----------
function bar(X, f, e, side, lab = '') {
  const s0 = Math.abs(e) / cran(f) / 3 * 100, a0 = Math.abs(e) / 50 * 100, s = Math.min(s0, 100), a = Math.min(a0, 100), n = niv(X.v, f, e);
  let h = `<i class="cb ${n}${s0 > 100 ? ' ds' : ''}${a0 > 100 ? ' da' : ''}" data-role="effet" data-famille="${f}" aria-label="${NOM[f]} ${sg(e)} · ${NIVMOT[n]}" style="--c:${J[f].base};--cf:${rgba(J[f].base, 0.4)};--s:${pc(s)};--a:${pc(a)}"></i>`;
  if (X.hs.has(f)) {
    const z = zone(f); let q;
    if (z) { const zs = cl(side === 'r' ? z.rS0 : z.lS0), za = cl(side === 'r' ? z.rA0 : z.lA0); q = [Math.min(zs, s), Math.max(0, s - zs), Math.min(za, a), Math.max(0, a - za)]; }
    else q = [Math.max(0, s - 5), Math.min(5, s), Math.max(0, a - 5), Math.min(5, a)];
    h += `<i class="hs" style="--s0:${pc(q[0])};--s1:${pc(q[1])};--a0:${pc(q[2])};--a1:${pc(q[3])}"></i>`;
  }
  if (lab) h += `<span class="cb-l" style="--s:${pc(s)};--a:${pc(a)}">${lab}</span>`;
  return h;
}
const inconnu = (f) => `<i class="cb inconnu" data-role="effet" data-famille="${f}" aria-label="${NOM[f]} : effet non établi"></i>`;
const zt = (f, side) => { const z = zone(f); if (!z) return ''; const s0 = side === 'r' ? z.rS0 : z.lS0, a0 = side === 'r' ? z.rA0 : z.lA0; return `<i class="zt${s0 > 100 ? ' cs' : ''}${a0 > 100 ? ' ca' : ''}" data-role="zone" style="--z:${rgba(J[f].base, 0.55)};--t:${J[f].texte};--s:${pc(cl(s0))};--a:${pc(cl(a0))}"></i>`; };
function couloirs(X, avecLab) {
  const e = X.v.effet; let la = '', lb = '', ra = '', rb = '';
  const lab = (f) => (avecLab && crOf(X, f) != null ? arr(crOf(X, f)) : '');
  if (!e.floral.etabli) ra = zt('floral', 'r') + inconnu('floral');
  else if (e.floral.central >= 0) ra = zt('floral', 'r') + bar(X, 'floral', e.floral.central, 'r', lab('floral'));
  else { ra = zt('floral', 'r'); la = zt('floral', 'l') + bar(X, 'floral', e.floral.central, 'l'); }
  rb = zt('citrus', 'r') + (e.citrus.etabli ? bar(X, 'citrus', e.citrus.central, 'r', lab('citrus')) : inconnu('citrus'));
  lb = e.resin.etabli ? bar(X, 'resin', e.resin.central, 'l') : inconnu('resin');
  const vis = `<i class="cv a" style="--s:${pc(viseeS('floral'))};--a:${pc(viseeA('floral'))}"></i><i class="cv b" style="--s:${pc(viseeS('citrus'))};--a:${pc(viseeA('citrus'))}"></i>`;
  return `<div class="cx${avecLab ? ' lab' : ''}"><div class="cx-m g"><div class="ln a">${la}</div><div class="ln b">${lb}</div></div><i class="cx-rail" aria-hidden="true"></i><div class="cx-m d">${vis}<div class="ln a">${ra}</div><div class="ln b">${rb}</div></div></div>`;
}

// ---------- l'intensité : une jauge à crans par famille (un segment par cran du style) ----------
const PXC = 6, MAXW = 27; // 6 px par cran du style, 4,5 crans au plus ; en absolu, 27 px = 50 points
function puce(X, f, obj) {
  const t = X.v.tout.find((x) => x.famille === f);
  let e, c;
  if (obj) {
    const ef = X.v.effet[f];
    if (!ef.etabli) return `<span class="px o ne" data-famille="${f}" role="img" aria-label="${NOM[f]} : effet non établi">${picto(f, 14, { cls: 'o' })}<span class="px-z"><i class="px-ne"></i></span></span>`;
    e = ef.central; c = t ? t.crans : 0;
  } else { e = t.effet; c = t.crans; }
  const n = niv(X.v, f, e), bas = e < 0, hs = X.hsCr[f] || 0;
  const wS = Math.min(MAXW, Math.max(3, Math.abs(c) * PXC)), wA = Math.min(MAXW, Math.max(3, Math.abs(e) / 50 * MAXW));
  const xs = hs ? `<i class="px-x" style="--s:${Math.min(wS, hs * PXC).toFixed(1)}px;--a:${Math.min(wA, hs * cran(f) / 50 * MAXW).toFixed(1)}px"></i>` : '';
  const z = zone(f);
  let plaf = '';
  if (z && !bas) {
    const pS = z.rS0 * 3 / 100 * PXC, pA = z.rA0 / 100 * MAXW;
    plaf = `<i class="px-p${pS > MAXW ? ' cs' : ''}${pA > MAXW ? ' ca' : ''}" data-role="zone" style="--t:${J[f].texte};--z:${rgba(J[f].base, 0.22)};--s:${Math.min(MAXW, pS).toFixed(1)}px;--a:${Math.min(MAXW, pA).toFixed(1)}px"></i>`;
  }
  const lib = `${NOM[f]} ${sg(e)} (${crTxt(c)}) · ${NIVMOT[n]}${X.hs.has(f) ? ' · hors du style' : ''}`;
  return `<span class="px ${n}${obj ? ' o' : ''}${bas ? ' bas' : ''}${Math.abs(c) < 0.5 ? ' pt' : ''}" data-famille="${f}" data-crans="${c}"${obj ? '' : ' data-role="extra"'} role="img" aria-label="${lib}" style="--c:${J[f].base};--cf:${rgba(J[f].base, 0.4)}">${picto(f, 14, { cls: (obj ? 'o ' : '') + (n === 'mq' ? 'duo' : '') })}<span class="px-z"><i class="px-b" style="--s:${wS.toFixed(1)}px;--a:${wA.toFixed(1)}px">${xs}</i>${plaf}</span></span>`;
}
const jauges = (X) => `<div class="fx"><span class="fx-o">${OBJ.map((f) => puce(X, f, true)).join('')}</span>${X.extras.map((t) => puce(X, t.famille, false)).join('')}</div>`;

// ---------- une voie : une ligne qui pend à son moment ----------
const ligneHoublon = (X) => (!X.v.levureVers && X.v.actions.length === 1 ? ' data-role="ligne-houblon"' : '');
function voie(X, seule) {
  const { q } = nomVoie(X.v);
  const dose = X.v.type === 'assemblage' ? '<span class="q">5+5 g ≈</span>' : q ? `<span class="q">${q}</span>` : '';
  return `<article class="vr${seule ? ' seule' : ''}" data-voie="${X.n}"${ligneHoublon(X)} aria-label="${esc(X.v.libelle)}">
        <div class="vr-h">${(X.v.fiches || []).map(usage).join('')}<div class="nmw"><b class="nm">${pastilleSel(X)}${nomHtml(X)}</b> <span class="vr-m">${dose}${stockMarque(X.v)}${bioPill(X)}</span></div>${plus(X)}</div>
        ${seule ? couloirs(X, false) : ''}
        ${jauges(X)}
      </article>`;
}

// ---------- la visée : trois objectifs, la meilleure voie et son moment au bout de la barre ----------
const R = K.reponses();
const tMo = (X) => MOMENT[momentDe(X.v)].court || MOMENT[momentDe(X.v)].t;
function piste(f) {
  const r = R[f];
  if (f === 'resin') {
    const s = Math.abs(r.effet) / cran(f) / 3 * 100, a = Math.abs(r.effet) / 50 * 100;
    const gap = DEG.min - OB.resin.visee, vS = gap / cran(f) / 3 * 100, vA = gap / 50 * 100;
    return `<div class="piste moins" data-role="piste" data-famille="resin">
        <i class="pz${vS >= 100 ? ' cs' : ''}" data-role="zone" style="--z:${rgba(J.resin.base, 0.3)};--s0:${pc(cl(vS))};--a0:${pc(cl(vA))}"></i>
        <i class="pb${s > 15 && a > 15 ? ' dedans' : ''}" style="--s:${pc(s)};--a:${pc(a)}"><span class="pm">${tMo(r.X)}</span></i>
        <i class="pv${vS > 100 ? ' loin' : ''}" style="--s:${pc(cl(vS))};--a:${pc(cl(vA))}"><span>${vS > 100 ? ico('i-chev-l', 12, 'class="pv-loin"') : ''}visée</span></i>
        <i class="prail"></i>
      </div>`;
  }
  const z = zone(f), s = r.effet / cran(f) / 3 * 100, a = r.effet / 50 * 100;
  return `<div class="piste" data-role="piste" data-famille="${f}">
        <i class="pz" data-role="zone" style="--z:${rgba(J[f].base, 0.3)};--s:${pc(cl(z.rS0))};--a:${pc(cl(z.rA0))}"></i>
        <i class="pb${s > 15 && a > 15 ? ' dedans' : ''}" style="--s:${pc(cl(s))};--a:${pc(cl(a))}"><span class="pm">${tMo(r.X)}</span></i>
        <i class="pv" style="--s:${pc(viseeS(f))};--a:${pc(viseeA(f))}"><span>visée</span></i>
        <i class="prail"></i>
      </div>`;
}
function objectifs() {
  const aria = (f) => { const x = R[f], { nom } = nomVoie(x.X.v); return f === 'resin' ? 'Moins résineux : ma bière est au-dessus du style d\'après la dégustation ; aucune voie houblon ne l\'y ramène ; la plus proche, ' + nom + ' à ' + tMo(x.X) : `${x.titre} : la meilleure voie, ${nom} à ${tMo(x.X)}, ${K.VERDICT[x.verdict].toLowerCase()} la visée (${fr(OB[f].maBiere.central)} → ${fr(x.apres)}, visée ${fr(OB[f].visee)})`; };
  return ['resin', 'floral', 'citrus'].map((f) => {
    const x = R[f];
    return `<section class="ob" data-role="objectif" data-famille="${f}" aria-label="${esc(aria(f))}" style="--f:${J[f].fond};--t:${J[f].texte};--b:${J[f].base}">
        <div class="ob-h"><span class="ob-p">${picto(f, 16, { cls: 'duo' })}${f === 'resin' ? '<i class="alerte"></i>' : ''}</span><span class="ob-tt"><span class="ob-t">${x.titre}</span>${f === 'resin' ? `<button class="hh-b" onclick="var d=document.getElementById('hh');d.open=true;d.scrollIntoView({behavior:'smooth'})">Hors houblon${ico('i-chev-r', 12)}</button>` : ''}</span><div class="rep v-${x.verdict}" data-role="reponse" data-famille="${f}" data-verdict="${x.verdict}">${K.VERDICT[x.verdict]}${f === 'resin' ? '<small>voie houblon</small>' : ''}</div></div>
        ${piste(f)}
      </section>`;
  }).join('');
}

// ---------- la colonne du brassin ----------
const STATIONS = [
  { id: 'b60', t: '60′', ic: 'j-ebu', lg: 'Ébullition, 60′', phase: 'chaud' },
  { id: 'b10', t: '10′', ic: 'j-ebu', lg: 'Ébullition, 10′', phase: 'chaud' },
  { id: 'wp', t: 'WP', ic: 'j-whirl', lg: 'Whirlpool', phase: 'tiede' },
  { id: 'dryActive', t: 'DH', ic: 'j-cuve-a', lg: 'Dry hop en fermentation active', phase: 'froid' },
  { id: 'levure', t: 'Lev.', ic: 'j-levure', lg: 'Levure : toute la fermentation', phase: 'froid' },
];
function brassin() {
  const { memes, gestes } = K.groupes();
  const parMoment = Object.fromEntries(STATIONS.map((s) => [s.id, []]));
  const ICU = { arome: ico('j-arome', 16), amer: ico('j-goutte', 16), '': '' };
  memes.forEach((g, gi) => parMoment[g.moment].push(`
      <div class="grp">
        <div class="grp-h">${ico('i-equal', 16)}<span>${gi ? 'même effet' : 'même effet sur tes objectifs'}</span><span class="q">${g.dose}</span></div>
        ${couloirs(g.voies[0], true)}
        <div class="vrs">${g.voies.map((X) => voie(X, false)).join('')}</div>
      </div>`));
  for (const g of gestes) parMoment[g.mo].push(`
      <div class="grp">
        <div class="grp-h">${ICU[g.usage]}<span>${g.t}${g.mo === 'dryActive' ? ' ' + MOMENT.dryActive.court : ''}</span>${g.est ? '<span class="est">estimé</span>' : ''}</div>
        <div class="vrs">${g.voies.map((X) => voie(X, true)).join('')}</div>
      </div>`);
  // La recette, à sa place : Nugget 46 g à 60′ (c1.ajouts), en repère.
  const rec = C.ajouts.map((a) => { const F = K.fiche('Nugget'); return `<div class="rec" aria-label="Dans ma recette : ${F.nom}, ${a.grammes} g à 60′"><span class="rec-t">${ico('j-ebu', 14)}</span><b data-houblon="${esc(F.nom)}">${esc(F.nom)}</b><span class="q">${a.grammes} g</span></div>`; }).join('');
  // L'ordre de q2b dans un moment : les groupes au même effet, puis les gestes.
  parMoment.b60.unshift(rec);
  const st = (s) => {
    const contenu = parMoment[s.id].join('');
    return `<section class="station ${s.phase}${contenu ? '' : ' vide'}" id="st-${s.id}" aria-label="${s.lg}">
      <div class="sp"><span class="sp-t">${s.t}</span>${ico(s.ic, 16)}</div>
      <div class="sc">${contenu || ''}</div>
    </section>`;
  };
  return `<div class="brassin">
    <section class="station plan" aria-label="Visée">
      <div class="sp"><span class="sp-ic">${ico('i-chev-d', 16)}</span></div>
      <div class="sc obs">${objectifs()}</div>
    </section>
    ${STATIONS.map(st).join('')}
  </div>`;
}

const tete = `
  <header class="barre">
    <a class="retour" href="#" aria-label="Retour">${ico('i-chev-l', 16)}</a>
    <nav class="onglets" role="radiogroup" aria-label="Partie">${['Ma bière', 'Suggestions', 'Comparer'].map((x) => `<button role="radio" aria-checked="${x === 'Suggestions'}">${x}</button>`).join('')}</nav>
  </header>
  <div class="outils">
    <div class="seg lentille" role="radiogroup" aria-label="Lecture des familles"><button role="radio" data-e="style" aria-checked="true">Au style</button><button role="radio" data-e="absolu" aria-checked="false">Absolu</button></div>
    <div class="seg" role="radiogroup" aria-label="Vue"><button role="radio" aria-checked="true">${ico('j-barres', 14)}Barres</button><button role="radio" aria-checked="false">${ico('j-radar', 14)}Radar</button></div>
  </div>`;
function plis() {
  const ib = V.map((X) => nomVoie(X.v).nom + ' ' + (MOMENT[momentDe(X.v)].court || MOMENT[momentDe(X.v)].t) + ' ' + fr(X.v.ibu.after)).join(' · ');
  const hh = C.horsModele.map((h) => h.pistes.map((x) => `<li><b>${esc(x.titre)}</b> : ${esc(x.action.charAt(0).toLowerCase() + x.action.slice(1))} <span class="src">${esc(x.preuve)}</span></li>`).join('')).join('');
  return `
  <details class="pli"><summary>IBU après chaque voie<span class="pli-n">ma bière ${fr(C.ibu)} ; style ${C.bandeIbu.join('–')}</span>${ico('i-chev-d', 16, 'class="chev"')}</summary><ul><li>${esc(ib)}</li></ul></details>
  <details class="pli" id="hh"><summary>Hors houblon · résineux<span class="pli-n">${C.horsModele[0].pistes.length} pistes</span>${ico('i-chev-d', 16, 'class="chev"')}</summary><ul>${hh}</ul></details>`;
}
const dock = () => `<nav class="dock" aria-label="Comparer"><span class="dock-p" aria-hidden="true">${AJOUTEES.map((n) => { const X = V[n - 1], a = X.v.actions[0]; return `<i style="--h:${COUL_H[a.houblon]}" data-houblon-compare="${esc(a.houblon)}" data-couleur="${COUL_H[a.houblon]}"></i>`; }).join('')}</span><a class="cmp" data-role="comparer" href="#">Comparer <b data-nb>(${AJOUTEES.length})</b>${ico('i-chev-r', 16)}</a></nav>`;

// ---------- la fiche g1 : la même colonne sombre porte α et le rôle ----------
const SOMBRE_T = '#f5f0e8';
const FICHES = {};
for (const nom of K.HOUBLONS) {
  const P = K.ficheParts(nom, { roue: { W: 268, id: nom.replace(/\W+/g, '') }, regFond: '#57534e', regFort: '#f5f0e8', regPale: '#a8a29e', regLot: '#f5f0e8', regLotT: '#1c1917' });
  const F = P.F;
  const us = F.role ? (F.role.v === 'amérisant' ? ico('j-goutte', 14) : F.role.v === 'aromatique' ? ico('j-arome', 14) : ico('j-goutte', 14) + ico('j-arome', 14)) : '';
  FICHES[nom] = `<div class="fi-voile" data-k="voile" aria-hidden="true"></div>
  <section class="fi" data-role="fiche" role="dialog" tabindex="-1" aria-label="Fiche de ${esc(nom)}">
    <header class="fi-t"><h2>${esc(nom)}</h2>{{STOCK}}<button class="fi-x" data-role="fermer-fiche" data-k="fermer" aria-label="Fermer la fiche de ${esc(nom)}">${ico('i-x', 16)}</button></header>
    <div class="fi-c2">
      <aside class="fi-sp">${P.alpha}${P.reglette}${us ? `<span class="fi-us${/^règle/.test(F.role.src || '') ? ' deduit' : ''}">${us}</span>` : ''}${P.role}</aside>
      <div class="fi-cn">
        ${P.note}
        <div class="fi-ar" data-role="fiche-arome">${P.bande}${P.lignes}${P.sans}${P.nd}<div class="fi-r">${P.roue}</div>${P.demande}</div>
        <div class="fi-act"><span class="fi-g" role="group" data-role="gout" aria-label="Mon goût pour ${esc(nom)}"><button data-k="aimer" aria-pressed="false" aria-label="Aimer ${esc(nom)}">${ico('i-heart', 16)}</button><button data-k="exclure" aria-pressed="false" aria-label="Exclure ${esc(nom)}">${ico('i-ban', 16)}</button></span>{{ACTION}}<button class="fi-b" data-k="comparer" aria-label="Comparer ${esc(nom)} à d'autres houblons">Comparer</button></div>
        <div class="fi-replis" role="group" aria-label="Détail de la fiche">${P.sections.map(([id, t]) => `<button data-k="repli" data-sec="${id}" aria-expanded="false">${t}${ico('i-chev-d', 14)}</button>`).join('')}</div>
        ${P.sections.map(([id, t, corps]) => `<div class="fi-sec" data-sec-corps="${id}" hidden aria-label="${t}">${corps}</div>`).join('')}
      </div>
    </div>
  </section>`;
}
const VOIES = Object.fromEntries(V.map((X) => [X.n, { stock: X.v.levureVers ? null : X.v.stock, action: X.v.levureVers ? null : X.v.type === 'assemblage' || X.v.type === 'ajouter' ? 'Ajouter à ' + MOMENT[momentDe(X.v)].t : X.v.type.startsWith('remplacer') ? 'Remplacer Nugget' : 'Ajouter en ' + MOMENT[momentDe(X.v)].t, hs: X.v.actions.map((a) => a.houblon) }]));
const STOCK_HTML = Object.fromEntries(Object.keys(STOCK_MOT).map((k) => [k, `<span class="stk" role="img" aria-label="${STOCK_MOT[k]}">${ico(STOCK_ICO[k], 14)}</span>`]));
const FICHE_JS = `
const FICHES = ${JSON.stringify(FICHES)};
const VOIES = ${JSON.stringify(VOIES)};
const STOCK_HTML = ${JSON.stringify(STOCK_HTML)};
function rendFiche(nom, mode, voie) {
  const v = voie && VOIES[voie] && VOIES[voie].hs.includes(nom) ? VOIES[voie] : null;
  const html = FICHES[nom].replace('{{STOCK}}', v && v.stock ? STOCK_HTML[v.stock] : '').replace('{{ACTION}}', v && v.action ? '<button class="fi-b fi-b1" data-k="ajouter">' + v.action + '</button>' : '');
  RACINE.className = 'mode-' + mode;
  RACINE.innerHTML = mode === 'bulle' ? html.replace(/<div class="fi-voile"[^>]*><\\/div>/, '') : html;
}
${K.GESTE_JS}`;

// ---------- la feuille de style ----------
const MONO = 'ui-monospace, "SF Mono", "Cascadia Mono", "Segoe UI Mono", Consolas, monospace';
const CSS = `
  :root { --encre: #1c1917; --gris: #57534e; --trait: #e7e5e4; --page: #fdfcfa; --col: #1c1917; --col-t: ${SOMBRE_T}; --col-g: #a8a29e; --acc: #c2410c; --gut: 14px; --sp: 52px; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: var(--page); color: var(--encre); }
  body { font: 400 14px/1.25 -apple-system, system-ui, "Segoe UI", Roboto, sans-serif; -webkit-tap-highlight-color: transparent; }
  button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
  svg { display: block; flex: none; }
  .ecran { max-width: 390px; margin: 0 auto; padding: 4px 12px 84px; display: flex; flex-direction: column; gap: 8px; overflow-x: hidden; }
  .q, .mo, .sp-t, .cb-l, .pm, .dose { font-family: ${MONO}; font-variant-numeric: tabular-nums; }

  /* Le chrome : des onglets soulignés et des réglages à angles vifs, comme une feuille de brassage. */
  .barre { display: flex; align-items: center; gap: 4px; height: 40px; border-bottom: 1px solid var(--trait); }
  .retour { width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; color: var(--encre); flex: none; }
  .onglets { display: flex; flex: 1; height: 100%; }
  .onglets button { flex: 1; font-size: 13px; color: var(--gris); position: relative; white-space: nowrap; }
  .onglets button[aria-checked="true"] { color: var(--encre); font-weight: 750; }
  .onglets button[aria-checked="true"]::after { content: ''; position: absolute; left: 12px; right: 12px; bottom: -1px; height: 3px; border-radius: 2px; background: var(--encre); }
  .outils { display: flex; justify-content: space-between; gap: 8px; }
  .seg { display: flex; border-radius: 4px; box-shadow: inset 0 0 0 1px #d6d3d1; }
  .seg button { height: 28px; padding: 0 10px; border-radius: 4px; font-size: 13px; color: var(--gris); white-space: nowrap; display: inline-flex; align-items: center; gap: 4px; }
  .seg button[aria-checked="true"] { background: var(--encre); color: var(--page); font-weight: 650; }

  /* La colonne du brassin : une bande sombre, le temps qui descend. */
  .brassin { position: relative; display: flex; flex-direction: column; }
  .station > .sp { background: var(--col); }
  .station:first-child > .sp { border-radius: 4px 4px 0 0; }
  .station:last-child > .sp { border-radius: 0 0 4px 4px; }
  .station { position: relative; display: grid; grid-template-columns: var(--sp) 1fr; column-gap: 10px; }
  .sp { position: relative; display: flex; flex-direction: column; align-items: center; gap: 3px; padding-top: 10px; color: var(--col-t); }
  .sp-t { font-size: 15px; font-weight: 800; letter-spacing: -.02em; color: var(--col-t); }
  .sp::after { content: ''; position: absolute; left: 50%; margin-left: -1px; top: 54px; bottom: 0; width: 2px; background: rgba(245,240,232,.38); }
  .station.froid .sp::after { background: repeating-linear-gradient(180deg, rgba(245,240,232,.5) 0 2px, transparent 2px 7px); }
  .station.plan .sp::after { top: 32px; background: rgba(245,240,232,.2); }
  .station.vide .sp::after { display: none; }
  .station.vide .sp { padding: 8px 0 10px; color: var(--col-g); }
  .station.vide .sp-t { color: var(--col-g); }
  .sp-ic { width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; box-shadow: inset 0 0 0 1.5px rgba(245,240,232,.5); }
  .station + .station { border-top: 0; }
  .station:not(.plan) .sc { border-top: 1px solid var(--trait); }
  .station:not(.plan)::after { content: ''; position: absolute; left: calc(var(--sp) - 6px); top: 15px; width: 14px; height: 2px; background: var(--col); }
  .station.vide::after { display: none; }
  .sc { min-width: 0; padding: 6px 0 10px; display: flex; flex-direction: column; gap: 6px; }

  /* La visée : trois objectifs, chacun sa piste au style ; le moment de la meilleure voie au bout. */
  .obs { gap: 0; padding: 0; }
  .ob { padding: 7px 0 8px; display: flex; flex-direction: column; gap: 4px; }
  .ob + .ob { border-top: 1px solid var(--trait); }
  .ob-h { display: flex; align-items: center; gap: 6px; min-height: 28px; }
  .ob-p { position: relative; display: inline-flex; flex: none; }
  .ob-p .pi { width: 22px; height: 22px; padding: 3px; border-radius: 50%; background: var(--f); }
  .alerte { position: absolute; right: -3px; bottom: -2px; width: 9px; height: 9px; border-radius: 50%; background: var(--acc); box-shadow: 0 0 0 1.5px var(--page); }
  .ob-tt { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
  .ob-t { font-size: 14px; font-weight: 750; color: var(--t); white-space: nowrap; }
  .rep { margin-left: auto; font-size: 17px; font-weight: 800; line-height: 1; color: var(--encre); text-align: right; }
  .rep small { display: block; font-size: 12px; font-weight: 650; margin-top: 2px; white-space: nowrap; }
  .hh-b { height: 24px; padding: 0 4px 0 8px; border-radius: 4px; font-size: 12px; font-weight: 700; color: var(--t); display: inline-flex; align-items: center; gap: 2px; white-space: nowrap; box-shadow: inset 0 0 0 1px currentColor; }
  .piste { position: relative; height: 32px; margin-right: 2px; }
  .piste::before { content: ''; position: absolute; left: 0; right: 0; top: 18px; height: 6px; border-radius: 2px; background: #f0eeeb; }
  .pz { position: absolute; top: 18px; height: 6px; left: 0; width: var(--s); background: var(--z); border-radius: 0 2px 2px 0; }
  .pz::after { content: ''; position: absolute; right: -1px; top: -4px; width: 2px; height: 14px; border-radius: 1px; background: var(--t); }
  body.abs .pz { width: var(--a); }
  .pb { position: absolute; top: 16px; height: 10px; left: 0; width: var(--s); background: var(--b); border-radius: 0 2px 2px 0; z-index: 1; }
  body.abs .pb { width: var(--a); }
  .pm { position: absolute; left: calc(100% + 3px); top: -3px; font-size: 12px; font-weight: 750; line-height: 16px; padding: 0 3px; border-radius: 2px; background: var(--encre); color: var(--page); white-space: nowrap; }
  .pv { position: absolute; top: 0; bottom: 0; left: var(--s); border-left: 2px dashed var(--encre); z-index: 2; }
  body.abs .pv { left: var(--a); }
  .pv span { position: absolute; top: -1px; left: 4px; font-size: 12px; font-weight: 650; line-height: 14px; color: var(--encre); white-space: nowrap; display: inline-flex; align-items: center; }
  .prail { position: absolute; left: 0; top: 12px; bottom: 2px; width: 3px; border-radius: 2px; background: var(--encre); z-index: 3; }
  .piste.moins .pz { left: auto; right: var(--s0); width: calc(100% - var(--s0)); border-radius: 2px 0 0 2px; }
  .piste.moins .pz.cs { display: none; }
  body.abs .piste.moins .pz { right: var(--a0); width: calc(100% - var(--a0)); display: block; }
  .piste.moins .pz::after { display: none; }
  .piste.moins .pb { left: auto; right: 0; border-radius: 2px 0 0 2px; }
  .piste.moins .pm { left: auto; right: calc(100% + 3px); }
  .pb.dedans .pm { left: auto; right: 2px; top: -3px; }
  .piste.moins .pb.dedans .pm { right: auto; left: 2px; }
  .piste.moins .pv { left: auto; right: var(--s); border-left: 0; border-right: 2px dashed var(--encre); }
  body.abs .piste.moins .pv { right: var(--a); }
  .piste.moins .pv span { left: auto; right: 4px; }
  .piste.moins .pv.loin { border-right-color: transparent; }
  .piste.moins .pv.loin span { right: auto; left: 0; }
  body.abs .piste.moins .pv.loin { border-right-color: var(--encre); }
  body.abs .piste.moins .pv.loin span { left: auto; right: 4px; }
  body.abs .pv-loin { display: none; }
  .piste.moins .prail { left: auto; right: 0; }

  /* Un groupe à son moment ; la recette en repère. */
  .rec { display: flex; align-items: center; gap: 6px; height: 28px; padding: 0 8px; border-radius: 4px; background: #f0eeeb; font-size: 13px; align-self: flex-start; }
  .rec-t { display: inline-flex; color: var(--gris); }
  .rec b { font-weight: 700; }
  .grp { display: flex; flex-direction: column; gap: 6px; }
  .grp + .grp, .rec + .grp { padding-top: 6px; border-top: 1px dashed #d6d3d1; }
  .grp-h { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 750; min-height: 24px; }
  .grp-h .q { font-size: 13px; font-weight: 600; color: var(--gris); }
  .est { font-size: 12px; font-weight: 650; color: var(--gris); padding: 1px 6px; border-radius: 4px; box-shadow: inset 0 0 0 1px #d6d3d1; }
  .mo { display: inline-flex; align-items: center; gap: 3px; height: 22px; padding: 0 6px; border-radius: 4px; box-shadow: inset 0 0 0 1px #a8a29e; font-size: 12px; font-weight: 700; white-space: nowrap; }
  .vrs { display: flex; flex-direction: column; }
  .vr { position: relative; padding: 5px 0 6px; display: flex; flex-direction: column; gap: 4px; transition: background .15s; border-radius: 4px; }
  .vr + .vr { border-top: 1px solid var(--trait); }
  .vr.appui { background: #f0eeeb; }
  .vr.f-source { background: #f0eeeb; box-shadow: -10px 0 0 #f0eeeb, inset 0 0 0 0 transparent; }
  .vr-h { display: flex; align-items: flex-start; gap: 4px; min-height: 28px; }
  .nmw { flex: 1; min-width: 0; padding-top: 5px; line-height: 1.15; }
  .nm { font-size: 14px; font-weight: 700; }
  .vr-m { display: inline-flex; align-items: center; gap: 4px; vertical-align: -3px; margin-left: 2px; color: var(--gris); }
  .q { font-size: 12px; font-weight: 600; color: var(--gris); white-space: nowrap; }
  .stk { display: inline-flex; color: var(--gris); }
  .sel { display: inline-block; width: 8px; height: 8px; border-radius: 2px; background: var(--h); margin: 0 4px 1px 0; vertical-align: middle; }
  .vr:has(.plus[aria-pressed="false"]) .sel { display: none; }
  .us { display: inline-flex; align-items: center; gap: 1px; height: 20px; margin-top: 4px; padding: 0 4px; border-radius: 4px; background: #f0eeeb; flex: none; color: var(--encre); }
  .us.deduit { background: none; padding: 0 2px; color: var(--gris); }
  .al { font-size: 12px; font-style: normal; font-weight: 700; margin-left: 1px; }
  .us .inc { font-size: 12px; color: var(--gris); }
  .plus { margin-left: auto; width: 28px; height: 28px; border-radius: 4px; box-shadow: inset 0 0 0 1.5px var(--encre); display: inline-flex; align-items: center; justify-content: center; flex: none; color: var(--encre); background: var(--page); }
  .plus .i-c { display: none; }
  .plus[aria-pressed="true"] { background: var(--encre); color: var(--page); }
  .plus[aria-pressed="true"] .i-p { display: none; } .plus[aria-pressed="true"] .i-c { display: block; }

  .cx { position: relative; display: flex; height: 30px; margin: 2px 0 4px; }
  .cx.lab { height: 32px; }
  .cx-m { position: relative; flex: 1; }
  .cx-rail { width: var(--gut); flex: none; position: relative; }
  .cx-rail::before { content: ''; position: absolute; top: -3px; bottom: -3px; left: 5.5px; width: 3px; border-radius: 2px; background: var(--encre); }
  .ln { position: absolute; left: 0; right: 0; height: 10px; }
  .ln.a { top: 2px; } .ln.b { top: 18px; }
  .zt { position: absolute; bottom: -4px; height: 3px; width: var(--s); background: var(--z); border-radius: 2px; }
  .zt::after { content: ''; position: absolute; top: -4px; width: 2px; height: 10px; border-radius: 1px; background: var(--t); }
  .d .zt { left: 0; } .d .zt::after { right: -1px; }
  .g .zt { right: 0; } .g .zt::after { left: -1px; }
  .zt.cs::after { display: none; } body.abs .zt.cs::after { display: block; } body.abs .zt.ca::after { display: none; }
  body.abs .zt { width: var(--a); }
  .cb { position: absolute; top: 0; height: 10px; min-width: 3px; width: var(--s); background: var(--c); z-index: 1; }
  body.abs .cb:not(.inconnu) { width: var(--a); }
  .d .cb { left: 0; border-radius: 0 2px 2px 0; } .g .cb { right: 0; border-radius: 2px 0 0 2px; }
  .cb.ci { background: var(--cf); box-shadow: inset 0 0 0 1.5px var(--c); }
  .cb.sf { background: #fff; box-shadow: inset 0 0 0 1.5px var(--c); }
  .cb.inconnu { width: 22px; background: repeating-linear-gradient(135deg, #fff 0 3px, #b0aca8 3px 5px); box-shadow: inset 0 0 0 1.2px #8c8782; }
  .cb.ds::after, body.abs .cb.da::after { content: ''; position: absolute; top: 2px; right: 2px; border: 3px solid transparent; border-left: 5px solid #fff; }
  body.abs .cb.ds:not(.da)::after { display: none; }
  .hs { position: absolute; top: 0; height: 10px; left: var(--s0); width: var(--s1); background: var(--acc); z-index: 2; border-radius: 0 2px 2px 0; }
  .g .hs { left: auto; right: var(--s0); border-radius: 2px 0 0 2px; }
  body.abs .hs { left: var(--a0); width: var(--a1); }
  .cb-l { position: absolute; top: -3px; left: calc(var(--s) + 4px); font-size: 12px; font-weight: 750; white-space: nowrap; line-height: 16px; z-index: 3; }
  body.abs .cb-l { left: calc(var(--a) + 4px); }
  .cv { position: absolute; left: var(--s); width: 0; border-left: 1.5px dashed var(--encre); z-index: 2; }
  .cv.a { top: -2px; height: 15px; } .cv.b { top: 14px; height: 18px; }
  body.abs .cv { left: var(--a); }

  /* La jauge à crans : le picto, puis un segment par cran du style, face au plafond du style. */
  .fx { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 6px; }
  .fx-o { display: inline-flex; gap: 4px; padding-right: 6px; border-right: 1.5px dashed #c9c5c1; }
  .px { display: inline-flex; align-items: center; gap: 2px; height: 20px; }
  .px .pi { width: 16px; height: 16px; padding: 1px; }
  .px .pi.duo { border-radius: 50%; background: var(--fp); }
  .px .pi.o { border-radius: 50%; box-shadow: 0 0 0 1.5px var(--page), 0 0 0 2.6px var(--encre); }
  ${ORDRE.map((f) => `.px[data-famille="${f}"] { --fp: ${J[f].fond}; }`).join(' ')}
  .px-z { position: relative; width: ${MAXW + 2}px; height: 12px; }
  .px-z::before { content: ''; position: absolute; left: 0; top: 5px; width: ${MAXW}px; height: 2px; background: #efedea; }
  .px-b { position: absolute; left: 0; top: 2px; height: 8px; width: var(--s); background: var(--c); border-radius: 0 2px 2px 0; background-image: repeating-linear-gradient(90deg, transparent 0 ${PXC - 1}px, rgba(255,255,255,.95) ${PXC - 1}px ${PXC}px); }
  body.abs .px-b { width: var(--a); background-image: none; }
  .px.ci .px-b { background-color: var(--cf); box-shadow: inset 0 0 0 1.5px var(--c); }
  .px.sf .px-b { background-color: #fff; box-shadow: inset 0 0 0 1.5px var(--c); background-image: none; }
  .px.bas .px-b { background: #fff; box-shadow: inset 0 0 0 1.5px var(--encre); }
  .px.pt .px-b { width: 5px; height: 5px; top: 3.5px; left: 1px; border-radius: 50%; background-image: none; box-shadow: none; }
  body.abs .px.pt .px-b { width: 5px; }
  .px.pt.bas .px-b { background: var(--encre); }
  .px-x { position: absolute; right: 0; top: 0; bottom: 0; width: var(--s); background: var(--acc); border-radius: 0 2px 2px 0; }
  body.abs .px-x { width: var(--a); }
  .px-p { position: absolute; top: 1px; left: 0; width: var(--s); height: 10px; background: var(--z); border-right: 2px solid var(--t); z-index: 0; }
  body.abs .px-p { width: var(--a); }
  .px-b { z-index: 1; }
  .px-p.cs { display: none; } body.abs .px-p.cs { display: block; } body.abs .px-p.ca { display: none; }
  .px-ne { position: absolute; left: 0; top: 2px; width: 14px; height: 8px; border-radius: 2px; background: repeating-linear-gradient(135deg, #fff 0 2px, #9c9792 2px 3.5px); box-shadow: inset 0 0 0 1px #8c8782; }
  .px.ne .px-z { width: 16px; } .px.ne .px-z::before { display: none; }

  details.bio { display: inline-block; vertical-align: middle; }
  details.bio summary { list-style: none; display: inline-flex; align-items: center; gap: 3px; height: 24px; padding: 0 4px; border-radius: 4px; background: repeating-linear-gradient(135deg, #fff 0 3px, #e2dfdb 3px 5.5px); box-shadow: inset 0 0 0 1.2px #8c8782; cursor: pointer; }
  details.bio summary::-webkit-details-marker { display: none; }
  .bt { display: inline-flex; align-items: center; gap: 1px; background: #fff; border-radius: 2px; padding: 0 3px; height: 18px; color: var(--encre); }
  .bt.mot { font-size: 12px; font-weight: 700; padding: 0 5px; }
  details.bio[open] ul { position: absolute; left: 0; right: 0; top: 34px; z-index: 6; background: #fff; border-radius: 4px; box-shadow: 0 8px 24px -12px rgba(28,25,23,.55), 0 0 0 1px var(--trait); padding: 10px 12px 10px 26px; font-size: 13px; display: flex; flex-direction: column; gap: 6px; color: var(--encre); }
  .src { color: var(--gris); font-size: 12px; }

  .pli { border-top: 1px solid var(--trait); padding: 10px 0 2px; }
  .pli summary { list-style: none; display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 700; cursor: pointer; flex-wrap: wrap; }
  .pli summary::-webkit-details-marker { display: none; }
  .pli-n { font-size: 12px; font-weight: 600; color: var(--gris); }
  .pli .chev { margin-left: auto; transition: transform .15s; }
  .pli[open] .chev { transform: rotate(180deg); }
  .pli ul { margin: 8px 0 0 16px; display: flex; flex-direction: column; gap: 6px; font-size: 13px; }

  /* Le panier : une barre basse, la couleur du brassin. */
  .dock { position: fixed; z-index: 8; left: 50%; transform: translateX(-50%); bottom: 10px; width: 366px; max-width: calc(100% - 24px); height: 48px; border-radius: 4px; background: var(--col); box-shadow: 0 8px 24px -12px rgba(28,25,23,.7); display: flex; align-items: center; gap: 8px; padding: 0 6px 0 12px; }
  .dock-p { display: inline-flex; gap: 3px; }
  .dock-p i { width: 14px; height: 14px; border-radius: 2px; background: var(--h); box-shadow: 0 0 0 1.5px var(--col-t); }
  .cmp { margin-left: auto; height: 36px; padding: 0 8px 0 14px; border-radius: 4px; background: var(--col-t); color: var(--col); display: inline-flex; align-items: center; gap: 6px; font-size: 15px; font-weight: 750; text-decoration: none; }

  /* La fiche : la même colonne sombre porte α et le rôle. */
  #fiche-racine { position: relative; z-index: 20; }
  .fi-voile { position: fixed; inset: 0; background: rgba(28,25,23,.38); }
  .fi { position: fixed; left: 0; right: 0; bottom: 0; max-height: 90vh; overflow-y: auto; overscroll-behavior: contain; background: var(--page); border-radius: 8px 8px 0 0; box-shadow: 0 -12px 40px -16px rgba(28,25,23,.7); padding: 8px 12px 16px; max-width: 390px; margin: 0 auto; }
  .mode-bulle .fi { left: calc(50% + 211px); right: auto; bottom: auto; top: 16px; width: 380px; max-height: calc(100vh - 32px); border-radius: 4px; box-shadow: 0 12px 40px -12px rgba(28,25,23,.6), 0 0 0 1px var(--trait); margin: 0; }
  @media (max-width: 1000px) { .mode-bulle .fi { left: auto; right: 16px; } }
  .fi-t { display: flex; align-items: center; gap: 6px; min-height: 36px; border-bottom: 1px solid var(--trait); margin-bottom: 8px; }
  .fi-t h2 { font-size: 18px; font-weight: 800; }
  .fi-x { margin-left: auto; width: 32px; height: 32px; border-radius: 4px; box-shadow: inset 0 0 0 1.5px var(--encre); display: inline-flex; align-items: center; justify-content: center; }
  .fi-c2 { display: grid; grid-template-columns: 80px 1fr; gap: 10px; }
  .fi-sp { background: var(--col); color: var(--col-t); border-radius: 4px; padding: 10px 4px; display: flex; flex-direction: column; align-items: center; gap: 8px; align-self: start; text-align: center; }
  .fi-alpha { display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .fi-grec { font-size: 15px; color: var(--col-g); }
  .fi-aa { font-family: ${MONO}; font-size: 13px; font-weight: 800; line-height: 1.2; word-break: break-word; color: var(--col-t); }
  .fi-lot { font-family: ${MONO}; font-size: 12px; color: var(--col-g); }
  .fi-sp .fi-reg { width: 52px; }
  .fi-us { display: inline-flex; gap: 2px; color: var(--col-t); }
  .fi-us.deduit { color: var(--col-g); }
  .fi-role { font-size: 12px; font-weight: 700; line-height: 1.2; padding: 3px 3px; border-radius: 4px; box-shadow: inset 0 0 0 1.5px var(--col-t); color: var(--col-t); }
  .fi-role.regle { box-shadow: none; outline: 1.5px dashed var(--col-g); outline-offset: -1.5px; }
  .fi-cn { min-width: 0; display: flex; flex-direction: column; gap: 8px; }
  .fi-note { font-size: 12px; color: var(--gris); }
  .fi-ar { display: flex; flex-direction: column; gap: 6px; }
  .fi-bande { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .fi-bande-c { display: inline-flex; gap: 2px; }
  .fi-c { width: 18px; height: 18px; border-radius: 2px; background: #efedea; display: inline-block; flex: none; }
  .fi-c.sep { margin-left: 5px; }
  .fi-c.ci { background: var(--cf); }
  .fi-c.m { background: var(--cb); }
  ${ORDRE.map((f) => `.fi-c[data-famille="${f}"] { --cb: ${J[f].base}; --cf: ${rgba(J[f].base, 0.4)}; }`).join(' ')}
  .fi-seule { font-size: 12px; color: var(--gris); }
  .fi-lab { display: flex; align-items: flex-start; gap: 6px; }
  .fi-lab-t { display: block; font-size: 14px; line-height: 1.25; }
  .fi-lab-n { font-weight: 750; color: var(--t); }
  .fi-cpt { font-size: 13px; color: var(--gris); }
  .fi-mots { display: block; font-size: 13px; }
  .fi-sans, .fi-nd { font-size: 13px; color: var(--gris); }
  .fi-r { display: flex; justify-content: center; }
  .fi-dem { display: flex; justify-content: center; gap: 14px; font-size: 13px; }
  .fi-act { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .fi-g { display: inline-flex; border-radius: 4px; box-shadow: inset 0 0 0 1px #d6d3d1; }
  .fi-g button { width: 30px; height: 30px; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; color: var(--gris); }
  .fi-g button[aria-pressed="true"] { background: var(--encre); color: var(--page); }
  .fi-b { height: 30px; padding: 0 12px; border-radius: 4px; box-shadow: inset 0 0 0 1.5px var(--encre); font-size: 13px; font-weight: 700; white-space: nowrap; }
  .fi-b1 { background: var(--encre); color: var(--page); }
  .fi-replis { display: flex; flex-wrap: wrap; gap: 0; border-top: 1px solid var(--trait); }
  .fi-replis button { height: 30px; padding: 0 8px 0 2px; font-size: 13px; font-weight: 650; display: inline-flex; align-items: center; gap: 2px; color: var(--encre); }
  .fi-replis button[aria-expanded="true"] { text-decoration: underline; text-underline-offset: 3px; }
  .fi-sec { display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
  .fi-sec[hidden] { display: none; }
  .fi-rg { display: flex; justify-content: space-between; gap: 8px; } .fi-rg span { color: var(--gris); }
  .fi-tags { display: flex; flex-wrap: wrap; gap: 4px; } .fi-tags span { padding: 2px 6px; border-radius: 2px; background: #efedea; font-size: 12px; }
  .fi-gris { color: var(--gris); font-size: 12px; } .fi-txt { font-size: 13px; }
`;

const page = (titre, commentaire, corpsHtml, js) => `<!doctype html>
<html lang="fr" data-cas="c1">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titre}</title>
<!-- ${commentaire} -->
<style>${CSS}</style>
</head>
<body>
<main class="ecran">${corpsHtml}
</main>
<div id="fiche-racine"></div>
<script>${K.LENTILLE_JS}${js}</script>
</body>
</html>
`;
K.ecrire(OUT + '/etat-b.html', page('Jour de brassage · Suggestions', 'Lot 18 · l6 · Jour de brassage : q2b (c1) rangé le long du brassin. Générée par generateur-l6.mjs depuis donnees/c1.json, le pack et la base (fiches g1).', `${tete}${brassin()}${plis()}${dock()}`, FICHE_JS));

// ---------- la planche ----------
const abc = `
  <div class="abc">
    <div class="it"><span class="sw" style="background:var(--page);box-shadow:inset 0 0 0 1px var(--trait)"></span><span class="mt">page</span></div>
    <div class="it"><span class="sw" style="background:var(--col)"></span><span class="mt">brassin</span></div>
    <div class="it"><span class="tx"><b>Aa</b><span style="color:var(--gris)">Aa</span><span class="mono">60′</span></span><span class="mt">texte</span></div>
    <div class="it"><button class="plus" aria-label="Ajouter">${ico('i-plus', 16)}</button><span class="mt">action</span></div>
    <div class="it"><span class="px mq" style="--c:${J.citrus.base};--cf:${rgba(J.citrus.base, 0.4)}" data-famille="citrus">${picto('citrus', 14, { cls: 'duo' })}<span class="px-z"><i class="px-b" style="--s:9.6px"></i><i class="px-p" style="--t:${J.citrus.texte};--s:13.6px"></i></span></span><span class="mt">famille</span></div>
    <div class="it wide"><div class="piste" style="--t:${J.floral.texte};--b:${J.floral.base}"><i class="pz" style="--z:${rgba(J.floral.base, 0.3)};--s:88%"></i><i class="pb" style="--s:29%"><span class="pm">10′</span></i><i class="pv" style="--s:33.3%"><span>visée</span></i><i class="prail"></i></div><span class="mt">piste au style</span></div>
    <div class="it"><a class="cmp" href="#">Comparer</a><span class="mt">bouton</span></div>
  </div>`;
const planche = `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Jour de brassage · planche</title>
<style>${CSS}
  .pl { max-width: 390px; margin: 0 auto; padding: 10px 12px 16px; display: flex; flex-direction: column; gap: 10px; }
  .pl h1 { font-size: 15px; font-weight: 800; }
  .minis { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; align-items: start; }
  .mini-c { display: flex; flex-direction: column; gap: 8px; }
  .fen { position: relative; overflow: hidden; border-radius: 4px; box-shadow: 0 0 0 1px var(--trait), 0 8px 20px -12px rgba(28,25,23,.5); background: var(--page); }
  .fen iframe { border: 0; transform-origin: 0 0; position: absolute; left: 0; top: 0; }
  .abc { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px 6px; padding: 10px; border-top: 1px solid var(--trait); }
  .abc .it { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .abc .it.wide { grid-column: span 2; align-items: stretch; }
  .abc .mt { font-size: 12px; color: var(--gris); text-align: center; }
  .sw { width: 52px; height: 36px; border-radius: 4px; }
  .tx { display: inline-flex; gap: 4px; font-size: 15px; height: 36px; align-items: center; }
  .mono { font-family: ${MONO}; font-weight: 800; }
  .abc .plus { margin: 0; }
  .abc .cmp { margin: 0; height: 32px; font-size: 13px; padding: 0 12px; background: var(--col); color: var(--col-t); }
</style></head>
<body><main class="pl">
  <h1>l6 · Jour de brassage</h1>
  <div class="minis">
    <div class="fen" style="width:179px;height:778px"><iframe src="etat-b.html" width="390" height="1696" style="transform:scale(.459)" title="Suggestions, en entier"></iframe></div>
    <div class="mini-c">
      <div class="fen" style="width:179px;height:388px"><iframe src="etat-b.html?fiche=Motueka" width="390" height="844" style="transform:scale(.459)" title="La fiche de Motueka"></iframe></div>
      <div class="fen" style="width:179px;height:388px"><iframe src="etat-b.html?abs" width="390" height="844" style="transform:scale(.459)" title="Suggestions en absolu"></iframe></div>
    </div>
  </div>
  ${abc}
</main></body></html>
`;
K.ecrire(OUT + '/planche.html', planche);
