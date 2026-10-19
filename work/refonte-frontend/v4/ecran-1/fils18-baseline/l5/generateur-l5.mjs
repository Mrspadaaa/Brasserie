// Lot 18 · l5 · Tuiles : q2b (c1) en widgets empilés, comme un écran d'accueil. Chaque objectif est
// un widget teinté de sa famille, avec sa piste au style ; chaque groupe au même effet est un widget
// large (la barre s5 dessinée une fois) suivi de ses houblons en petits widgets, deux par rangée ;
// les gestes seuls sont des widgets moyens. Dans chaque widget de voie, l'intensité est un petit
// graphique en barres (une barre par famille, à la hauteur exacte de ses crans du style, face au
// plafond du style), au lieu des traits arrondis de q2b. Le panier de Comparer est un dock flottant.
// Appui long (500 ms) ou survol (750 ms) sur un houblon : sa fiche g1, en widgets elle aussi.
// Usage : node generateur-l5.mjs
import * as K from './donnees-l5-l6.mjs';
const { C, J, V, OB, OBJ, ORDRE, NOM, COURT, picto, ico, esc, fr, sg, pc, cl, cran, zone, viseeS, viseeA, niv, NIVMOT, crOf, arr, nomVoie, momentDe, MOMENT, usageDe, STOCK_MOT, STOCK_ICO, bioDe, AJOUTEES, COUL_H, DEG, crTxt } = K;
const OUT = K.E1 + '/fils18-baseline/l5';
const rgba = (hex, a) => { const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)); return `rgba(${v.join(',')},${a})`; };

// ---------- petites marques ----------
const chip = (id) => { const m = MOMENT[id]; return `<span class="mo" data-role="moment" data-moment="${id}" aria-label="Moment : ${m.lg}">${ico(m.ic, 14)}<span>${m.court || m.t}</span></span>`; };
function usage(h) {
  const { u, src } = usageDe(h);
  const dit = src === 'fournisseur' ? 'attesté par le fournisseur' : 'déduit de l\'α, à valider';
  const ics = u === 'amérisant' ? ico('j-goutte', 14) : u === 'aromatique' ? ico('j-arome', 14) : u === 'double' ? ico('j-goutte', 14) + ico('j-arome', 14) : '<b class="inc">?</b>';
  return `<span class="us${src === 'règle' ? ' deduit' : ''}" data-role="usage" data-usage="${u}" data-source="${src}" data-houblon="${esc(h.houblon)}" role="img" aria-label="${esc(h.houblon)} : ${u}, ${dit}">${ics}${src === 'règle' ? '<i class="al">α</i>' : ''}</span>`;
}
const stockMarque = (v) => (v.levureVers ? '' : `<span class="stk" role="img" aria-label="${STOCK_MOT[v.stock]}">${ico(STOCK_ICO[v.stock], 14)}</span>`);
const nomHtml = (X) => {
  const v = X.v;
  if (v.levureVers) return `<span>${esc(v.levureVers)}</span>`;
  return v.actions.map((a) => `<span data-houblon="${esc(a.houblon)}">${esc(a.houblon)}</span>`).join(' + ');
};
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

// ---------- l'intensité : un petit graphique en barres par voie ----------
const HC = 36, PXC = 9; // 36 px = 4 crans du style (9 px par cran) ; en absolu, 36 px = 50 points
function colonne(X, f, obj) {
  const t = X.v.tout.find((x) => x.famille === f);
  let e, c;
  if (obj) {
    const ef = X.v.effet[f];
    if (!ef.etabli) return `<span class="mb o ne" data-famille="${f}" role="img" aria-label="${NOM[f]} : effet non établi"><span class="mb-z"><i class="mb-ne"></i></span>${picto(f, 14, { cls: 'o' })}</span>`;
    e = ef.central; c = t ? t.crans : 0;
  } else { e = t.effet; c = t.crans; }
  const n = niv(X.v, f, e), bas = e < 0, hs = X.hsCr[f] || 0;
  const hS = Math.min(HC, Math.max(2, Math.abs(c) * PXC)), hA = Math.min(HC, Math.max(2, Math.abs(e) / 50 * HC));
  const xs = hs ? `<i class="mb-x" style="--s:${Math.min(hS, hs * PXC).toFixed(1)}px;--a:${Math.min(hA, hs * cran(f) / 50 * HC).toFixed(1)}px"></i>` : '';
  const z = zone(f);
  let plaf = '';
  if (z && !bas) {
    const pS = z.rS0 * 3 / 100 * PXC, pA = z.rA0 / 100 * HC;
    plaf = `<i class="mb-p${pS > HC ? ' cs' : ''}${pA > HC ? ' ca' : ''}" data-role="zone" style="--t:${J[f].texte};--s:${Math.min(HC, pS).toFixed(1)}px;--a:${Math.min(HC, pA).toFixed(1)}px"></i>`;
  }
  const lib = `${NOM[f]} ${sg(e)} (${crTxt(c)}) · ${NIVMOT[n]}${X.hs.has(f) ? ' · hors du style' : ''}`;
  const dep = Math.abs(c) * PXC > HC ? ' ds' : '', depA = Math.abs(e) / 50 * HC > HC ? ' da' : '';
  return `<span class="mb ${n}${obj ? ' o' : ''}${bas ? ' bas' : ''}${dep}${depA}" data-famille="${f}" data-crans="${c}"${obj ? '' : ' data-role="extra"'} role="img" aria-label="${lib}" style="--c:${J[f].base};--cf:${rgba(J[f].base, 0.4)}"><span class="mb-z"><i class="mb-b" style="--s:${hS.toFixed(1)}px;--a:${hA.toFixed(1)}px">${xs}</i>${plaf}</span>${picto(f, 14, { cls: (obj ? 'o ' : '') + (n === 'mq' ? 'duo' : '') })}</span>`;
}
const barres = (X) => `<div class="mbs"><span class="mbs-o">${OBJ.map((f) => colonne(X, f, true)).join('')}</span>${X.extras.length ? `<span class="mbs-x">${X.extras.map((t) => colonne(X, t.famille, false)).join('')}</span>` : ''}</div>`;

// ---------- les widgets ----------
const ligneHoublon = (X) => (!X.v.levureVers && X.v.actions.length === 1 ? ' data-role="ligne-houblon"' : '');
function petit(X) {
  const { q } = nomVoie(X.v);
  const dose = X.v.type === 'assemblage' ? '<span class="q">5+5 g ≈</span>' : q ? `<span class="q">${q}</span>` : '';
  return `<article class="tl" data-voie="${X.n}"${ligneHoublon(X)} aria-label="${esc(X.v.libelle)}">
      <div class="tl-h">${(X.v.fiches || []).map(usage).join('')}<div class="nmw"><b class="nm">${pastilleSel(X)}${nomHtml(X)}</b> <span class="tl-m">${dose}${stockMarque(X.v)}${bioPill(X)}</span></div>${plus(X)}</div>
      ${barres(X)}
    </article>`;
}
function moyen(X) {
  const { q } = nomVoie(X.v);
  const dose = X.v.type === 'assemblage' ? '<span class="q">5+5 g ≈</span>' : q ? `<span class="q">${q}</span>` : '';
  return `<article class="tl tl-l" data-voie="${X.n}"${ligneHoublon(X)} aria-label="${esc(X.v.libelle)}">
      <div class="tl-h">${(X.v.fiches || []).map(usage).join('')}<div class="nmw"><b class="nm">${pastilleSel(X)}${nomHtml(X)}</b> <span class="tl-m">${dose}${stockMarque(X.v)}${bioPill(X)}</span></div>${plus(X)}</div>
      <div class="tl-c">${couloirs(X, false)}${barres(X)}</div>
    </article>`;
}

// ---------- les objectifs : un widget teinté par famille, sa piste au style ----------
const R = K.reponses();
function piste(f) {
  const r = R[f];
  if (f === 'resin') {
    const s = Math.abs(r.effet) / cran(f) / 3 * 100, a = Math.abs(r.effet) / 50 * 100;
    const gap = DEG.min - OB.resin.visee, vS = gap / cran(f) / 3 * 100, vA = gap / 50 * 100;
    // La zone du style, vue de ma bière dégustée (66) : de 36 à 66 points vers la gauche.
    const zS0 = cl(vS), zA0 = cl(vA);
    return `<div class="piste moins" data-role="piste" data-famille="resin">
        <i class="pz${vS >= 100 ? ' cs' : ''}" data-role="zone" style="--z:${rgba(J.resin.base, 0.35)};--s0:${pc(zS0)};--a0:${pc(zA0)}"></i>
        <i class="pb" style="--s:${pc(s)};--a:${pc(a)}"></i>
        <i class="pv${vS > 100 ? ' loin' : ''}" style="--s:${pc(cl(vS))};--a:${pc(cl(vA))}"><span>${vS > 100 ? ico('i-chev-l', 12, 'class="pv-loin"') : ''}visée</span></i>
        <i class="prail"></i>
      </div>`;
  }
  const z = zone(f), s = r.effet / cran(f) / 3 * 100, a = r.effet / 50 * 100;
  return `<div class="piste" data-role="piste" data-famille="${f}">
        <i class="pz" data-role="zone" style="--z:${rgba(J[f].base, 0.35)};--s:${pc(cl(z.rS0))};--a:${pc(cl(z.rA0))}"></i>
        <i class="pb" style="--s:${pc(cl(s))};--a:${pc(cl(a))}"></i>
        <i class="pv" style="--s:${pc(viseeS(f))};--a:${pc(viseeA(f))}"><span>visée</span></i>
        <i class="prail"></i>
      </div>`;
}
function objectifs() {
  const r = R;
  const aria = (f) => { const x = r[f], { nom } = nomVoie(x.X.v); return f === 'resin' ? 'Moins résineux : ma bière est au-dessus du style d\'après la dégustation ; aucune voie houblon ne l\'y ramène' : `${x.titre} : la meilleure voie, ${nom}, ${K.VERDICT[x.verdict].toLowerCase()} la visée (${fr(OB[f].maBiere.central)} → ${fr(x.apres)}, visée ${fr(OB[f].visee)})`; };
  const tuile = (f) => {
    const x = r[f];
    return `<section class="ob" data-role="objectif" data-famille="${f}" aria-label="${esc(aria(f))}" style="--f:${J[f].fond};--t:${J[f].texte};--b:${J[f].base}">
      <div class="ob-h"><span class="app">${picto(f, 16)}${f === 'resin' ? '<i class="alerte"></i>' : ''}</span><span class="ob-t">${x.titre}</span>${f === 'resin' ? `<button class="hh-b" onclick="var d=document.getElementById('hh');d.open=true;d.scrollIntoView({behavior:'smooth'})">Hors houblon${ico('i-chev-r', 12)}</button>` : ''}<div class="rep v-${x.verdict}" data-role="reponse" data-famille="${f}" data-verdict="${x.verdict}">${K.VERDICT[x.verdict]}${f === 'resin' ? '<small>voie houblon</small>' : ''}</div></div>
      ${piste(f)}
    </section>`;
  };
  return `<div class="obs">${['resin', 'floral', 'citrus'].map(tuile).join('')}</div>`;
}

// ---------- le haut de page, les plis, le dock ----------
const tete = `
  <header class="barre">
    <a class="retour" href="#" aria-label="Retour">${ico('i-chev-l', 16)}</a>
    <div class="seg onglets" role="radiogroup" aria-label="Partie">${['Ma bière', 'Suggestions', 'Comparer'].map((x) => `<button role="radio" aria-checked="${x === 'Suggestions'}">${x}</button>`).join('')}</div>
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
const dock = () => `<nav class="dock" aria-label="Comparer"><span class="dock-p" aria-hidden="true">${AJOUTEES.map((n) => { const a = V[n - 1].v.actions[0]; return `<i style="--h:${COUL_H[a.houblon]}" data-houblon-compare="${esc(a.houblon)}" data-couleur="${COUL_H[a.houblon]}"></i>`; }).join('')}</span><a class="cmp" data-role="comparer" href="#">Comparer <b data-nb>(${AJOUTEES.length})</b>${ico('i-chev-r', 16)}</a></nav>`;

// ---------- la fiche g1, en widgets ----------
const FICHES = {};
for (const nom of K.HOUBLONS) {
  const P = K.ficheParts(nom, { roue: { W: 318, id: nom.replace(/\W+/g, '') } });
  const F = P.F;
  const us = F.role ? (F.role.v === 'amérisant' ? ico('j-goutte', 14) : F.role.v === 'aromatique' ? ico('j-arome', 14) : ico('j-goutte', 14) + ico('j-arome', 14)) : '';
  FICHES[nom] = `<div class="fi-voile" data-k="voile" aria-hidden="true"></div>
  <section class="fi" data-role="fiche" role="dialog" tabindex="-1" aria-label="Fiche de ${esc(nom)}">
    <div class="fi-poignee" aria-hidden="true"></div>
    <header class="fi-t"><h2>${esc(nom)}</h2>{{STOCK}}<button class="fi-x" data-role="fermer-fiche" data-k="fermer" aria-label="Fermer la fiche de ${esc(nom)}">${ico('i-x', 16)}</button></header>
    <div class="fi-duo">
      <div class="w w-a">${P.alpha}${P.reglette}${P.note}</div>
      <div class="w w-r">${us ? `<span class="fi-us${/^règle/.test(F.role.src || '') ? ' deduit' : ''}">${us}</span>` : ''}${P.role}</div>
    </div>
    <div class="w w-ar" data-role="fiche-arome">${P.bande}${P.lignes}${P.sans}${P.nd}<div class="fi-r">${P.roue}</div>${P.demande}</div>
    <div class="fi-act"><span class="fi-g" role="group" data-role="gout" aria-label="Mon goût pour ${esc(nom)}"><button data-k="aimer" aria-pressed="false" aria-label="Aimer ${esc(nom)}">${ico('i-heart', 16)}</button><button data-k="exclure" aria-pressed="false" aria-label="Exclure ${esc(nom)}">${ico('i-ban', 16)}</button></span>{{ACTION}}<button class="fi-b" data-k="comparer" aria-label="Comparer ${esc(nom)} à d'autres houblons">Comparer</button></div>
    <div class="fi-replis" role="group" aria-label="Détail de la fiche">${P.sections.map(([id, t]) => `<button data-k="repli" data-sec="${id}" aria-expanded="false">${t}${ico('i-chev-d', 14)}</button>`).join('')}</div>
    ${P.sections.map(([id, t, corps]) => `<div class="w fi-sec" data-sec-corps="${id}" hidden aria-label="${t}">${corps}</div>`).join('')}
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
const CSS = `
  :root { --encre: #16161a; --gris: #55555f; --trait: #dfe1e8; --mur: #e6e9f1; --acc: #c2410c; --gut: 14px;
    --ombre: 0 1px 2px rgba(22,22,26,.07), 0 10px 22px -14px rgba(22,22,26,.42); --ombre2: 0 2px 4px rgba(22,22,26,.08), 0 16px 30px -16px rgba(22,22,26,.5); }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { background: var(--mur); }
  body { background-color: var(--mur); background-image: radial-gradient(60% 40% at 0% 8%, #d9d3f1 0%, rgba(217,211,241,0) 100%), radial-gradient(55% 35% at 100% 42%, #cfe7dd 0%, rgba(207,231,221,0) 100%), radial-gradient(70% 40% at 10% 85%, #d3e0f1 0%, rgba(211,224,241,0) 100%), linear-gradient(180deg, #e4e7f0, #e9e7ef); min-height: 100vh; color: var(--encre);
    font: 400 14px/1.25 -apple-system, system-ui, "Segoe UI", Roboto, sans-serif; -webkit-tap-highlight-color: transparent; font-variant-numeric: tabular-nums; }
  button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
  svg { display: block; flex: none; }
  .ecran { max-width: 390px; margin: 0 auto; padding: 8px 12px 92px; display: flex; flex-direction: column; gap: 10px; overflow-x: hidden; }

  /* Le chrome : une rangée, des pilules blanches posées sur le fond d'écran. */
  .barre { display: flex; align-items: center; gap: 6px; height: 36px; }
  .retour { width: 32px; height: 32px; border-radius: 50%; background: #fff; box-shadow: var(--ombre); display: inline-flex; align-items: center; justify-content: center; color: var(--encre); flex: none; }
  .seg { display: flex; background: rgba(255,255,255,.55); border-radius: 16px; padding: 2px; box-shadow: inset 0 0 0 1px rgba(22,22,26,.06); }
  .onglets { flex: 1; }
  .seg button { flex: 1; height: 28px; border-radius: 14px; font-size: 13px; color: var(--gris); white-space: nowrap; display: inline-flex; align-items: center; justify-content: center; gap: 4px; padding: 0 10px; }
  .seg button[aria-checked="true"] { background: #fff; color: var(--encre); font-weight: 650; box-shadow: 0 1px 3px rgba(22,22,26,.16); }
  .outils { display: flex; justify-content: space-between; gap: 8px; }
  .lentille button[aria-checked="true"] { background: var(--encre); color: #fff; }

  /* Les objectifs : trois widgets teintés de leur famille, chacun avec sa piste au style. */
  .obs { display: flex; flex-direction: column; gap: 8px; }
  .ob { background: var(--f); border-radius: 8px; padding: 8px 12px 10px; box-shadow: var(--ombre2); display: flex; flex-direction: column; gap: 6px; }
  .ob-h { display: flex; align-items: center; gap: 8px; min-height: 30px; }
  .app { width: 28px; height: 28px; border-radius: 8px; background: #fff; display: inline-flex; align-items: center; justify-content: center; flex: none; position: relative; box-shadow: 0 1px 2px rgba(22,22,26,.12); }
  .alerte { position: absolute; right: -3px; bottom: -3px; width: 10px; height: 10px; border-radius: 50%; background: var(--acc); box-shadow: 0 0 0 2px #fff; }
  .ob-t { font-size: 14px; font-weight: 750; color: var(--t); white-space: nowrap; }
  .rep { margin-left: auto; font-size: 18px; font-weight: 800; line-height: 1; letter-spacing: -.01em; color: var(--encre); text-align: right; }
  .rep small { display: block; font-size: 12px; font-weight: 650; margin-top: 2px; letter-spacing: 0; color: var(--encre); }
  .hh-b { height: 26px; padding: 0 6px 0 9px; border-radius: 13px; background: #fff; font-size: 12px; font-weight: 700; color: var(--t); display: inline-flex; align-items: center; gap: 2px; white-space: nowrap; box-shadow: 0 1px 2px rgba(22,22,26,.14); }
  .piste { position: relative; height: 30px; }
  .piste::before { content: ''; position: absolute; left: 0; right: 0; top: 17px; height: 8px; border-radius: 4px; background: rgba(255,255,255,.85); }
  .pz { position: absolute; top: 17px; height: 8px; left: 0; width: var(--s); background: var(--z); border-radius: 0 4px 4px 0; }
  .pz::after { content: ''; position: absolute; right: -1px; top: -3px; width: 2px; height: 14px; border-radius: 1px; background: var(--t); }
  body.abs .pz { width: var(--a); }
  .pb { position: absolute; top: 17px; height: 8px; left: 0; width: var(--s); background: var(--b); border-radius: 0 4px 4px 0; z-index: 1; }
  body.abs .pb { width: var(--a); }
  .pv { position: absolute; top: 0; bottom: 0; left: var(--s); border-left: 2px dashed var(--encre); z-index: 2; }
  body.abs .pv { left: var(--a); }
  .pv span { position: absolute; top: -1px; left: 4px; font-size: 12px; font-weight: 700; line-height: 14px; color: var(--encre); white-space: nowrap; display: inline-flex; align-items: center; }
  .prail { position: absolute; left: 0; top: 12px; bottom: 0; width: 3px; border-radius: 2px; background: var(--encre); z-index: 3; }
  .piste.moins .pz { left: auto; right: var(--s0); width: calc(100% - var(--s0)); border-radius: 4px 0 0 4px; }
  .piste.moins .pz.cs { display: none; }
  body.abs .piste.moins .pz { right: var(--a0); width: calc(100% - var(--a0)); display: block; }
  .piste.moins .pz::after { right: auto; left: auto; right: calc(100% - 1px); display: none; }
  .piste.moins .pb { left: auto; right: 0; border-radius: 4px 0 0 4px; }
  .piste.moins .pv { left: auto; right: var(--s); border-left: 0; border-right: 2px dashed var(--encre); }
  body.abs .piste.moins .pv { right: var(--a); }
  .piste.moins .pv span { left: auto; right: 4px; }
  .piste.moins .pv.loin { border-right-color: transparent; }
  .piste.moins .pv.loin span { right: auto; left: 0; }
  body.abs .piste.moins .pv.loin { border-right-color: var(--encre); }
  body.abs .piste.moins .pv.loin span { left: auto; right: 4px; }
  body.abs .pv-loin { display: none; }
  .piste.moins .prail { left: auto; right: 0; }

  /* Un groupe au même effet : un widget large (la barre s5, une fois), puis ses petits widgets. */
  .gw { background: #fff; border-radius: 8px; box-shadow: var(--ombre); padding: 8px 12px 10px; display: flex; flex-direction: column; gap: 8px; }
  .gw-h, .st { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 750; min-height: 26px; }
  .st { padding: 6px 2px 0; }
  .dose { font-size: 13px; font-weight: 650; color: var(--gris); }
  .est { font-size: 12px; font-weight: 650; color: var(--gris); background: rgba(255,255,255,.8); padding: 2px 8px; border-radius: 10px; }
  .mo { display: inline-flex; align-items: center; gap: 3px; height: 24px; padding: 0 8px 0 6px; border-radius: 12px; background: #fff; box-shadow: inset 0 0 0 1px #c4c4cc; font-size: 12px; font-weight: 700; white-space: nowrap; flex: none; }
  .grille { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

  .cx { position: relative; display: flex; height: 30px; }
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
  .d .cb { left: 0; border-radius: 0 4px 4px 0; } .g .cb { right: 0; border-radius: 4px 0 0 4px; }
  .cb.ci { background: var(--cf); box-shadow: inset 0 0 0 1.5px var(--c); }
  .cb.sf { background: #fff; box-shadow: inset 0 0 0 1.5px var(--c); }
  .cb.inconnu { width: 22px; background: repeating-linear-gradient(135deg, #fff 0 3px, #aeb3be 3px 5px); box-shadow: inset 0 0 0 1.2px #8a909b; }
  .cb.ds::after, body.abs .cb.da::after { content: ''; position: absolute; top: 2px; right: 2px; border: 3px solid transparent; border-left: 5px solid #fff; }
  body.abs .cb.ds:not(.da)::after { display: none; }
  .hs { position: absolute; top: 0; height: 10px; left: var(--s0); width: var(--s1); background: var(--acc); z-index: 2; border-radius: 0 4px 4px 0; }
  .g .hs { left: auto; right: var(--s0); border-radius: 4px 0 0 4px; }
  body.abs .hs { left: var(--a0); width: var(--a1); }
  .cb-l { position: absolute; top: -3px; left: calc(var(--s) + 4px); font-size: 12px; font-weight: 750; white-space: nowrap; line-height: 16px; z-index: 3; }
  body.abs .cb-l { left: calc(var(--a) + 4px); }
  .cv { position: absolute; left: var(--s); width: 0; border-left: 1.5px dashed var(--encre); z-index: 2; }
  .cv.a { top: -2px; height: 15px; } .cv.b { top: 14px; height: 18px; }
  body.abs .cv { left: var(--a); }

  /* Les widgets de voie. */
  .tl { background: #fff; border-radius: 8px; box-shadow: var(--ombre); padding: 8px 8px 8px 10px; display: flex; flex-direction: column; gap: 5px; position: relative; transition: transform .16s cubic-bezier(.2,.8,.2,1), box-shadow .16s; min-width: 0; }
  .tl.appui { transform: scale(.965); box-shadow: 0 1px 2px rgba(22,22,26,.1); }
  .tl.f-source { box-shadow: 0 0 0 2px var(--encre), var(--ombre); }
  .tl-h { display: flex; align-items: flex-start; gap: 4px; min-height: 28px; }
  .nmw { flex: 1; min-width: 0; padding-top: 5px; line-height: 1.15; }
  .nm { font-size: 14px; font-weight: 700; }
  .nmw .tl-m { display: inline-flex; vertical-align: -3px; margin-left: 2px; }
  .sel { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--h); margin: 0 4px 1px 0; vertical-align: middle; }
  .tl:has(.plus[aria-pressed="false"]) .sel { display: none; }
  .us { display: inline-flex; align-items: center; gap: 1px; height: 20px; margin-top: 4px; padding: 0 5px; border-radius: 10px; background: #ececf1; flex: none; color: var(--encre); }
  .us.deduit { background: none; padding: 0 2px; color: var(--gris); }
  .al { font-size: 12px; font-style: normal; font-weight: 700; margin-left: 1px; }
  .us .inc { font-size: 12px; color: var(--gris); }
  .plus { margin-left: auto; width: 28px; height: 28px; border-radius: 50%; background: #ececf1; display: inline-flex; align-items: center; justify-content: center; flex: none; color: var(--encre); }
  .plus .i-c { display: none; }
  .plus[aria-pressed="true"] { background: var(--encre); color: #fff; }
  .plus[aria-pressed="true"] .i-p { display: none; } .plus[aria-pressed="true"] .i-c { display: block; }
  .tl-m { display: flex; align-items: center; gap: 5px; color: var(--gris); }
  .q { font-size: 13px; font-weight: 650; color: var(--gris); white-space: nowrap; }
  .stk { display: inline-flex; color: var(--gris); }
  .tl-l .tl-h { align-items: center; }
  .tl-l .nmw { padding-top: 0; }
  
  .tl-c { display: flex; align-items: flex-end; gap: 12px; }
  .tl-c .cx { flex: 1; margin-bottom: 24px; }

  .mbs { position: relative; display: flex; gap: 6px; align-items: flex-end; }
  .mbs::before { content: ''; position: absolute; left: 0; right: 0; top: 37.25px; height: 1.5px; background: var(--encre); opacity: .9; }
  .mbs-o, .mbs-x { display: inline-flex; gap: 3px; }
  .mbs-o { padding-right: 6px; border-right: 1.5px dashed #c2c4cc; }
  .mb { width: 18px; display: inline-flex; flex-direction: column; align-items: center; gap: 3px; }
  .mb-z { position: relative; width: 12px; height: 44px; }
  .mb-b { position: absolute; left: 0; right: 0; bottom: 6px; height: var(--s); background: var(--c); border-radius: 2px 2px 0 0; }
  body.abs .mb-b { height: var(--a); }
  .mb.ci .mb-b { background: var(--cf); box-shadow: inset 0 0 0 1.5px var(--c); }
  .mb.sf .mb-b { background: #fff; box-shadow: inset 0 0 0 1.5px var(--c); }
  .mb.bas .mb-b { bottom: auto; top: 39px; height: min(var(--s), 5px); border-radius: 0 0 2px 2px; }
  body.abs .mb.bas .mb-b { height: min(var(--a), 5px); }
  .mb-x { position: absolute; left: 0; right: 0; top: 0; height: var(--s); background: var(--acc); border-radius: 2px 2px 0 0; }
  body.abs .mb-x { height: var(--a); }
  .mb.ds .mb-b::after, body.abs .mb.da .mb-b::after { content: ''; position: absolute; left: 3px; top: 2px; border: 3px solid transparent; border-bottom: 4px solid #fff; border-top: 0; }
  body.abs .mb.ds:not(.da) .mb-b::after { display: none; }
  .mb-p { position: absolute; left: -2px; right: -2px; bottom: calc(6px + var(--s)); height: 2px; border-radius: 1px; background: var(--t); z-index: 2; }
  body.abs .mb-p { bottom: calc(6px + var(--a)); }
  .mb-p.cs { display: none; } body.abs .mb-p.cs { display: block; } body.abs .mb-p.ca { display: none; }
  .mb-ne { position: absolute; left: 0; right: 0; bottom: 6px; height: 10px; border-radius: 2px; background: repeating-linear-gradient(135deg, #fff 0 2px, #9aa0ab 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; }
  .mb .pi { width: 16px; height: 16px; padding: 1px; }
  .mb .pi.duo { border-radius: 50%; background: var(--fp); }
  .mb .pi.o { border-radius: 50%; box-shadow: 0 0 0 1.5px #fff, 0 0 0 2.6px var(--encre); }
  ${ORDRE.map((f) => `.mb[data-famille="${f}"] { --fp: ${J[f].fond}; }`).join(' ')}

  details.bio { display: inline-block; }
  details.bio summary { list-style: none; display: inline-flex; align-items: center; gap: 3px; height: 24px; padding: 0 4px; border-radius: 12px; background: repeating-linear-gradient(135deg, #fff 0 3px, #dadce2 3px 5.5px); box-shadow: inset 0 0 0 1.2px #8a909b; cursor: pointer; }
  details.bio summary::-webkit-details-marker { display: none; }
  .bt { display: inline-flex; align-items: center; gap: 1px; background: #fff; border-radius: 8px; padding: 0 3px; height: 18px; color: var(--encre); }
  .bt.mot { font-size: 12px; font-weight: 700; padding: 0 5px; }
  details.bio[open] ul { position: absolute; left: 8px; right: 8px; top: 64px; z-index: 6; background: #fff; border-radius: 8px; box-shadow: var(--ombre2); padding: 10px 12px 10px 26px; font-size: 13px; display: flex; flex-direction: column; gap: 6px; color: var(--encre); }
  .src { color: var(--gris); font-size: 12px; }

  .pli { background: #fff; border-radius: 8px; box-shadow: var(--ombre); padding: 10px 12px; }
  .pli summary { list-style: none; display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 700; cursor: pointer; flex-wrap: wrap; }
  .pli summary::-webkit-details-marker { display: none; }
  .pli-n { font-size: 12px; font-weight: 600; color: var(--gris); }
  .pli .chev { margin-left: auto; transition: transform .15s; }
  .pli[open] .chev { transform: rotate(180deg); }
  .pli ul { margin: 8px 0 0 16px; display: flex; flex-direction: column; gap: 6px; font-size: 13px; }

  /* Le dock du panier : flottant, en verre dépoli. */
  .dock { position: fixed; z-index: 8; left: 50%; transform: translateX(-50%); bottom: 12px; width: 366px; max-width: calc(100% - 24px); height: 52px; border-radius: 26px; background: rgba(255,255,255,.74); -webkit-backdrop-filter: blur(14px) saturate(1.5); backdrop-filter: blur(14px) saturate(1.5); box-shadow: 0 10px 26px -12px rgba(22,22,26,.55), inset 0 0 0 1px rgba(255,255,255,.7); display: flex; align-items: center; gap: 8px; padding: 0 6px 0 16px; }
  .dock-p { display: inline-flex; }
  .dock-p i { width: 22px; height: 22px; border-radius: 50%; background: var(--h); box-shadow: 0 0 0 2px #fff; margin-right: -6px; }
  .cmp { margin-left: auto; height: 40px; padding: 0 12px 0 18px; border-radius: 20px; background: var(--encre); color: #fff; display: inline-flex; align-items: center; gap: 6px; font-size: 15px; font-weight: 700; text-decoration: none; }

  /* La fiche : une feuille de widgets. */
  #fiche-racine { position: relative; z-index: 20; }
  .fi-voile { position: fixed; inset: 0; background: rgba(22,22,26,.34); }
  .fi { position: fixed; left: 0; right: 0; bottom: 0; max-height: 90vh; overflow-y: auto; overscroll-behavior: contain; background: var(--mur); border-radius: 8px 8px 0 0; box-shadow: 0 -12px 40px -16px rgba(22,22,26,.6); padding: 6px 12px 16px; display: flex; flex-direction: column; gap: 8px; max-width: 390px; margin: 0 auto; }
  .mode-bulle .fi { left: calc(50% + 211px); right: auto; bottom: auto; top: 16px; width: 360px; max-height: calc(100vh - 32px); border-radius: 8px; box-shadow: 0 12px 40px -12px rgba(22,22,26,.55); margin: 0; }
  @media (max-width: 1000px) { .mode-bulle .fi { left: auto; right: 16px; } }
  .fi-poignee { width: 36px; height: 4px; border-radius: 2px; background: #b9bcc6; align-self: center; flex: none; }
  .mode-bulle .fi-poignee { display: none; }
  .fi-t { display: flex; align-items: center; gap: 6px; min-height: 32px; }
  .fi-t h2 { font-size: 18px; font-weight: 800; letter-spacing: -.01em; }
  .fi-x { margin-left: auto; width: 32px; height: 32px; border-radius: 50%; background: #fff; box-shadow: var(--ombre); display: inline-flex; align-items: center; justify-content: center; }
  .w { background: #fff; border-radius: 8px; box-shadow: var(--ombre); padding: 10px 12px; }
  .fi-duo { display: grid; grid-template-columns: 1.5fr 1fr; gap: 8px; }
  .w-a { display: flex; flex-direction: column; gap: 6px; }
  .fi-alpha { display: flex; align-items: baseline; gap: 5px; flex-wrap: wrap; }
  .fi-grec { font-size: 15px; color: var(--gris); }
  .fi-aa { font-size: 22px; font-weight: 800; letter-spacing: -.01em; }
  .fi-lot { font-size: 13px; color: var(--gris); }
  .fi-note { font-size: 12px; color: var(--gris); }
  .w-r { display: flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: 6px; }
  .fi-us { display: inline-flex; gap: 2px; padding: 3px 6px; border-radius: 10px; background: #ececf1; }
  .fi-us.deduit { background: none; padding: 3px 0; }
  .fi-role { font-size: 14px; font-weight: 700; padding: 3px 10px; border-radius: 12px; box-shadow: inset 0 0 0 1.5px var(--encre); }
  .fi-role.regle { box-shadow: none; outline: 1.5px dashed var(--gris); outline-offset: -1.5px; color: var(--encre); }
  .w-ar { display: flex; flex-direction: column; gap: 6px; }
  .fi-bande { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .fi-bande-c { display: inline-flex; gap: 2px; }
  .fi-c { width: 20px; height: 20px; border-radius: 4px; background: #ececf1; display: inline-block; flex: none; }
  .fi-c.sep { margin-left: 6px; }
  .fi-c.ci { background: var(--cf); }
  .fi-c.m { background: var(--cb); }
  ${ORDRE.map((f) => `.fi-c[data-famille="${f}"] { --cb: ${J[f].base}; --cf: ${rgba(J[f].base, 0.4)}; }`).join(' ')}
  .fi-seule { font-size: 12px; color: var(--gris); }
  .fi-lab { display: flex; align-items: flex-start; gap: 8px; }
  .fi-lab-t { display: block; font-size: 14px; line-height: 1.25; }
  .fi-lab-n { font-weight: 750; color: var(--t); }
  .fi-cpt { font-size: 13px; color: var(--gris); font-weight: 500; }
    .fi-mots { display: block; font-size: 13px; color: var(--encre); }
  .fi-sans, .fi-nd { font-size: 13px; color: var(--gris); }
  .fi-r { display: flex; justify-content: center; margin-top: 4px; }
  .fi-dem { display: flex; justify-content: center; gap: 16px; font-size: 13px; }
  .fi-act { display: flex; align-items: center; gap: 8px; }
  .fi-g { display: inline-flex; gap: 2px; background: #fff; border-radius: 16px; padding: 2px; box-shadow: var(--ombre); }
  .fi-g button { width: 28px; height: 28px; border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; color: var(--gris); }
  .fi-g button[aria-pressed="true"] { background: var(--encre); color: #fff; }
  .fi-b { height: 32px; padding: 0 14px; border-radius: 16px; background: #fff; box-shadow: var(--ombre); font-size: 13px; font-weight: 700; white-space: nowrap; }
  .fi-b1 { background: var(--encre); color: #fff; margin-left: auto; }
  .fi-replis { display: flex; gap: 6px; flex-wrap: wrap; }
  .fi-replis button { height: 28px; padding: 0 8px 0 11px; border-radius: 14px; background: rgba(255,255,255,.7); font-size: 13px; font-weight: 650; display: inline-flex; align-items: center; gap: 3px; color: var(--encre); box-shadow: inset 0 0 0 1px rgba(22,22,26,.08); }
  .fi-replis button[aria-expanded="true"] { background: var(--encre); color: #fff; }
  .fi-sec { display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
  .fi-sec[hidden] { display: none; }
  .fi-rg { display: flex; justify-content: space-between; gap: 8px; } .fi-rg span { color: var(--gris); }
  .fi-tags { display: flex; flex-wrap: wrap; gap: 4px; } .fi-tags span { padding: 2px 8px; border-radius: 10px; background: #ececf1; font-size: 12px; }
  .fi-gris { color: var(--gris); font-size: 12px; } .fi-txt { font-size: 13px; }
`;

const corps = () => {
  const { memes, gestes } = K.groupes();
  const blocMeme = (g, gi) => `
  <section class="gw" aria-label="${gi ? 'Même effet' : 'Même effet sur tes objectifs'}, ${g.dose}, ${MOMENT[g.moment].lg}">
    <div class="gw-h">${ico('i-equal', 16)}<span>${gi ? 'même effet' : 'même effet sur tes objectifs'}</span><span class="dose">${g.dose}</span>${chip(g.moment)}</div>
    ${couloirs(g.voies[0], true)}
  </section>
  <div class="grille">${g.voies.map(petit).join('')}</div>`;
  const USI = { arome: ico('j-arome', 16), amer: ico('j-goutte', 16), '': '' };
  const blocGeste = (g) => `
  <h3 class="st">${USI[g.usage]}${g.t}${chip(g.mo)}${g.est ? '<span class="est">estimé</span>' : ''}</h3>
  ${g.voies.map(moyen).join('')}`;
  return `${tete}${objectifs()}${memes.map(blocMeme).join('')}${gestes.map(blocGeste).join('')}${plis()}${dock()}`;
};

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
K.ecrire(OUT + '/etat-b.html', page('Tuiles · Suggestions', 'Lot 18 · l5 · Tuiles : q2b (c1) en widgets empilés. Générée par generateur-l5.mjs depuis donnees/c1.json, le pack et la base (fiches g1).', corps(), FICHE_JS));

// ---------- la planche : l'écran en mini, la fiche ouverte, l'abécédaire ----------
const abc = `
  <div class="abc">
    <div class="it"><span class="sw" style="background:var(--mur);background-image:linear-gradient(172deg,#e3e7f3,#ebe7f3 34%,#e6efeb 70%,#ece9e2)"></span><span class="mt">fond</span></div>
    <div class="it"><span class="sw tile"></span><span class="mt">widget</span></div>
    <div class="it"><span class="sw" style="background:${J.floral.fond};box-shadow:var(--ombre2)"></span><span class="mt">objectif</span></div>
    <div class="it"><span class="tx"><b>Aa</b><span style="color:var(--gris)">Aa</span><span style="color:${J.floral.texte};font-weight:750">Aa</span></span><span class="mt">texte</span></div>
    <div class="it"><button class="plus" aria-pressed="false" aria-label="Ajouter">${ico('i-plus', 16)}</button><span class="mt">action</span></div>
    <div class="it"><span class="mb mq" data-famille="citrus" style="--c:${J.citrus.base};--cf:${rgba(J.citrus.base, 0.4)}"><span class="mb-z"><i class="mb-b" style="--s:11.2px"></i><i class="mb-p" style="--t:${J.citrus.texte};--s:15.8px"></i></span>${picto('citrus', 14, { cls: 'duo' })}</span><span class="mt">famille</span></div>
    <div class="it wide"><div class="ob mini" style="--f:${J.floral.fond};--t:${J.floral.texte};--b:${J.floral.base}"><div class="piste"><i class="pz" style="--z:${rgba(J.floral.base, 0.35)};--s:88%"></i><i class="pb" style="--s:29%"></i><i class="pv" style="--s:33.3%"><span>visée</span></i><i class="prail"></i></div></div><span class="mt">piste au style</span></div>
    <div class="it"><a class="cmp" href="#">Comparer</a><span class="mt">bouton</span></div>
  </div>`;
const planche = `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Tuiles · planche</title>
<style>${CSS}
  body { padding: 0; }
  .pl { max-width: 390px; margin: 0 auto; padding: 10px 12px 16px; display: flex; flex-direction: column; gap: 10px; }
  .pl h1 { font-size: 15px; font-weight: 800; }
  .minis { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; align-items: start; }
  .mini-c { display: flex; flex-direction: column; gap: 8px; }
  .fen { position: relative; overflow: hidden; border-radius: 8px; box-shadow: var(--ombre2); background: var(--mur); }
  .fen iframe { border: 0; transform-origin: 0 0; position: absolute; left: 0; top: 0; }
  .abc { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px 6px; padding: 10px; background: rgba(255,255,255,.5); border-radius: 8px; }
  .abc .it { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .abc .it.wide { grid-column: span 2; align-items: stretch; }
  .abc .mt { font-size: 12px; color: var(--gris); text-align: center; }
  .sw { width: 52px; height: 36px; border-radius: 8px; }
  .sw.tile { background: #fff; box-shadow: var(--ombre); }
  .tx { display: inline-flex; gap: 4px; font-size: 15px; height: 36px; align-items: center; }
  .ob.mini { padding: 6px 10px; }
  .abc .cmp { margin: 0; height: 34px; font-size: 13px; padding: 0 14px; }
</style></head>
<body><main class="pl">
  <h1>l5 · Tuiles</h1>
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
