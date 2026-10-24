// Série b, les trois chaudes : forme libre, toujours sur la baseline et la réponse d'abord.
import { parCand, pied, ligneBiere, CSS_LB, compos, CSS_CP, jauge, CSS_JG, maxDelta, ajoute, stockMot } from './briques-sbb.mjs';

const CSS_PAGE = `body { display:flex; flex-direction:column; min-height:100vh; }
.§-e { flex:1; max-width:390px; width:100%; margin:0 auto; padding:6px 12px 8px; display:flex; flex-direction:column; gap:8px; }
.§-h { display:flex; align-items:center; gap:10px; }`;

// ---------------------------------------------------------------------------------------------------------------
// sbb6 · chaude · le ticket : le remplacement comme un reçu, ligne à ligne, avec son total et son tampon.
export function sbb6(S) {
  const P = 'sbb6', L = S.CANDS.filter((c) => ['nelson-sauvin', 'galaxy', 'idaho-7', 'sabro', 'magnat'].includes(c.k));
  const tl = (lab, val, cls = '') => `<div class="§-tl ${cls}"><span class="§-tll">${lab}</span><i class="§-tld"></i><span class="§-tlv">${val}</span></div>`;
  const tampon = (c) => !c.stock || c.stock.etat === 'à acheter' ? 'à acheter' : c.stock.suffisant === false ? 'stock court' : 'en stock';
  const ticket = (c) => {
    const dI = Math.round(c.ibu * 10) / 10 - Math.round(S.NUG.ibu * 10) / 10, dg = c.dose.grams - S.NUG.grams, md = maxDelta(S, c);
    return `<div class="§-tk-l">
${tl('<b class="§-sgn">−</b> Nugget · 60′', `<span class="§-num">46 g · ${S.fr(S.NUG.ibu, 1)} IBU</span>`, '§-moins')}
<div class="§-tl §-plus"><span class="§-tll"><b class="§-sgn">+</b> <b data-houblon="${S.esc(c.nom)}" style="color:${c.coul}">${S.esc(c.nom)}</b> · 60′</span><i class="§-tld"></i><span class="§-tlv §-num"><b>${S.fr(c.dose.grams)} g</b> · ${S.fr(c.ibu, 1)} IBU</span></div>
<p class="§-tid">${S.alphaTxt(c)}${S.usage(c)}${S.stock(c)}<span class="§-pk">${S.pictos(c.cites.slice(0, 5), 15)}</span>${S.autres(c, 22)}</p>
<hr>
${tl('amertume', `<span class="§-num">${S.sg(dI, 1)} IBU</span> ${Math.abs(dI) < 1 ? S.ico('i-check') : ''}`)}
${tl('matière', `<span class="§-num">${S.sg(dg)} g</span> <span class="§-gr">α ${S.fr(c.alpha.valeur, 1)} contre 13</span>`)}
${tl('usage', `${S.usage(c)} <span class="§-gr">Nugget ${S.NUG.role}</span>`)}
${tl('huiles (proximité)', c.comp.huiles == null ? '<b>?</b> inconnues' : `<span class="§-num">${c.comp.huiles}</span>`)}
${tl('stock ' + S.esc(c.nom.split(' ')[0]), c.stock && c.stock.libre != null ? `<span class="§-num">${S.fr(c.stock.libre)} → ${c.reste >= 0 ? S.fr(c.reste) : '−' + S.fr(-c.reste)} g</span>` : 'aucun')}
${tl('arôme de ma bière', `<span class="§-num">${md < 1.5 ? '~±1' : '~' + S.fr(md)}</span>`)}
${tl('ajoute (fiches)', c.gagne.length ? ajoute(S, c) : 'rien de cité')}
${c.alpha.horsFiches ? tl('α du lot', `<span class="§-num">${S.fr(c.alpha.valeur, 1)}</span> hors fiches`) : ''}
${tl('cohumulone', '<b>?</b> pas dans nos fiches')}
<hr>
<p class="§-tbh">ma bière, au style</p><div class="§-tb">${S.BIERE_FAM.map((f) => ligneBiere(S, f, c)).join('')}</div>
<hr class="§-dbl">
<div class="§-tot"><span>proximité</span><b class="§-num">${c.score}</b><span class="§-gr">${c.palier}</span></div>
<span class="§-st" style="color:${c.coul};border-color:${c.coul}">${tampon(c)}</span></div>`;
  };
  const corps = `<main class="§-e">
<header class="§-h">${S.croix(P)}<div data-libre="houblon" role="radiogroup" aria-label="Le remplaçant" class="§-tabs">${L.map((c) => `<button type="button" role="radio" aria-checked="${c.k === S.REP.k}" data-cand="${c.k}" class="${c.k === S.REP.k ? 'on' : ''}" style="--c:${c.coul}">${S.esc(c.nom.split(' ')[0])}<b class="§-num">${c.score}</b></button>`).join('')}</div></header>
<section class="§-tk">
<h1 class="§-tkq">Lequel à la place de Nugget ?</h1>
<div class="§-tkh"><p class="§-tkt" data-role="contexte"><span data-contexte="base">STOUT 16D · 20 L</span> · <span data-contexte="moment">60′</span> · <span data-contexte="dose">même IBU</span></p>${S.legendeBouton(P)}${S.lentille(P)}</div>
${parCand(S, L, ticket)}
</section>
<div class="§-pile" data-libre="houblon" role="radiogroup" aria-label="Les autres tickets">${L.map((c) => `<button type="button" role="radio" aria-checked="${c.k === S.REP.k}" data-cand="${c.k}" class="§-pt${c.k === S.REP.k ? ' on' : ''}" style="--c:${c.coul}"><b>${S.esc(c.nom)}</b><span class="§-num">${S.fr(c.dose.grams)} g · ${S.fr(c.ibu, 1)} IBU</span><span class="§-num">${c.score}</span><i>${tampon(c)}</i></button>`).join('')}</div>
</main>${pied(S, P, L)}`;
  const css = `${CSS_PAGE}${CSS_LB}
.§-h h1 { font-size:17px; font-weight:600; }
.§-h { align-items:flex-end; }
.§-h .§-x { margin-bottom:6px; }
.§-tabs { flex:1; display:flex; gap:0; align-items:flex-end; }
.§-tkq { font:600 16px/1.2 "Source Sans 3","Segoe UI",sans-serif; text-align:center; padding:2px 0 4px; border-bottom:1px dashed #bdbdbd; }
.§-tabs button { flex:1; height:36px; display:flex; flex-direction:column; align-items:center; justify-content:center; font-size:13px; line-height:1.1; border:1px solid #d9d9d9; border-bottom:0; border-radius:8px 8px 0 0; background:#f5f5f5; color:#333; margin-right:-1px; }
.§-tabs button b { font-size:12px; }
.§-tabs button.on { height:42px; background:#fff; color:var(--c); font-weight:700; border-top:3px solid var(--c); }
.§-tk { position:relative; margin-top:-9px; background:#fff; border:1px solid #d9d9d9; border-radius:8px; padding:8px 12px 12px; display:flex; flex-direction:column; gap:6px; box-shadow:0 2px 10px rgba(0,0,0,.06); font-family:"IBM Plex Mono",ui-monospace,Consolas,monospace; font-size:13px; }
.§-tk::after { content:""; position:absolute; left:8px; right:8px; bottom:-7px; height:8px; background:radial-gradient(circle at 5px -1px,transparent 5px,#fff 5.5px) 0 0/10px 8px repeat-x; }
.§-tkh { display:flex; align-items:center; gap:6px; border-bottom:1px dashed #bdbdbd; padding-bottom:6px; }
.§-tkt { flex:1; font-size:12px; letter-spacing:.02em; color:#333; }
.§-tk-l { position:relative; display:flex; flex-direction:column; gap:4px; }
.§-tl { display:flex; align-items:baseline; gap:6px; min-height:22px; }
.§-tll { white-space:nowrap; font-family:"Source Sans 3","Segoe UI",sans-serif; font-size:14px; }
.§-tld { flex:1; border-bottom:1px dotted #9e9e9e; transform:translateY(-3px); min-width:10px; }
.§-tlv { white-space:nowrap; display:inline-flex; align-items:center; gap:4px; }
.§-sgn { display:inline-block; width:12px; }
.§-moins .§-tll, .§-moins .§-tlv { color:#555; text-decoration:line-through; text-decoration-color:#9e9e9e; }
.§-plus .§-tll { font-size:16px; }
.§-plus .§-tlv { font-size:14px; }
.§-tid { display:flex; align-items:center; gap:6px; flex-wrap:wrap; padding-left:18px; font-family:"Source Sans 3","Segoe UI",sans-serif; font-size:13px; }
.§-pk { display:inline-flex; gap:2px; }
.§-tk hr { border:0; border-top:1px dashed #bdbdbd; margin:2px 0; }
.§-tk hr.§-dbl { border-top:3px double #9e9e9e; }
.§-tb { display:flex; flex-direction:column; gap:5px; font-family:"Source Sans 3","Segoe UI",sans-serif; }
.§-tbh { font-size:12px; color:#555; text-transform:uppercase; letter-spacing:.05em; }
.§-tot { display:flex; align-items:baseline; gap:8px; font-size:14px; text-transform:uppercase; letter-spacing:.06em; }
.§-tot b { font-size:28px; letter-spacing:0; }
.§-tot .§-gr { text-transform:none; letter-spacing:0; font-size:13px; }
.§-pile { display:flex; flex-direction:column; margin-top:4px; }
.§-pt { display:grid; grid-template-columns:1fr 112px 26px 80px; align-items:center; gap:6px; height:28px; padding:0 10px; border:1px solid #d9d9d9; border-top:1px dashed #bdbdbd; margin-top:-1px; background:#fff; font-size:13px; }
.§-pt b { color:var(--c); }
.§-pt .§-num { font-size:12px; }
.§-pt i { font-style:normal; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; color:var(--c); text-align:right; }
.§-pt.on { background:#f5f5f5; }
.§-pt.on b { text-decoration:underline; }
.§-st { position:absolute; right:2px; bottom:4px; transform:rotate(-8deg); border:2px solid; border-radius:4px; padding:3px 9px; font:800 15px/1 "Source Sans 3","Segoe UI",sans-serif; text-transform:uppercase; letter-spacing:.08em; background:#fff; }
`;
  return S.page(P, { titre: 'sbb6 · Lequel à la place de Nugget ? · le ticket de remplacement', corps, css, fiches: [S.NUG, ...L] });
}

// ---------------------------------------------------------------------------------------------------------------
// sbb7 · chaude · la cible : Nugget au centre, chaque remplaçant à la distance de son score ; à gauche ton stock,
// à droite ce qu'il faut acheter. La réponse est le point de gauche le plus proche du centre qui suffit.
export function sbb7(S) {
  const P = 'sbb7', L = S.CANDS;
  // La cible : Nugget au centre ; plus près, plus proche (score du moteur). À gauche ton stock, à droite l'achat.
  // Les points sont le dessin ; les étiquettes en colonnes, reliées à leur point, sont les boutons (au doigt).
  const W = 366, H = 300, cx = 183, cy = 150, r0 = 26, k = 3.0;
  const rad = (s) => r0 + (100 - s) * k;
  const gauche = L.filter((c) => c.stock.etat !== 'à acheter'), droite = L.filter((c) => c.stock.etat === 'à acheter');
  const angG = { 'idaho-7': 214, 'nelson-sauvin': 168, galaxy: 192, sabro: 146 }, angD = { altus: -50, magnat: -16, trident: 16, yeoman: 50 };
  const pt = (c) => { const a = ((angG[c.k] ?? angD[c.k]) * Math.PI) / 180, r = rad(c.score); return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
  const plageR = (c) => c.comp.huiles == null ? [Math.round(0.2 * c.comp.arome + 0.6 * c.comp.amertume), Math.round(0.2 * c.comp.arome + 0.6 * c.comp.amertume + 20)] : null;
  // étiquettes : colonne gauche, colonne droite, ordonnées comme les points
  const ranger = (l) => [...l].sort((a, b) => pt(a)[1] - pt(b)[1]).map((c, i, t) => ({ c, y: 44 + i * ((H - 70) / Math.max(1, t.length - 1)) }));
  const EG = ranger(gauche), ED = ranger(droite);
  let svg = `<svg class="§-sv" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Cible : Nugget au centre, chaque remplaçant à la distance de son score">`;
  svg += `<rect x="0" y="0" width="${cx}" height="${H}" fill="#f5f5f5"/>`;
  for (const s of [95, 90, 85, 80]) svg += `<circle cx="${cx}" cy="${cy}" r="${rad(s)}" fill="none" stroke="${s === 80 ? '#9e9e9e' : '#d0d0d0'}" stroke-width="1"${s === 80 ? '' : ' stroke-dasharray="3 3"'}/>`;
  for (const s of [90, 80]) svg += `<text x="${cx + 2}" y="${cy + rad(s) - 3}" font-size="12" fill="#555">${s}</text>`;
  for (const c of droite) { const p = plageR(c); if (!p) continue; const a = (angD[c.k] * Math.PI) / 180;
    svg += `<line x1="${(cx + rad(p[1]) * Math.cos(a)).toFixed(1)}" y1="${(cy + rad(p[1]) * Math.sin(a)).toFixed(1)}" x2="${(cx + rad(p[0]) * Math.cos(a)).toFixed(1)}" y2="${(cy + rad(p[0]) * Math.sin(a)).toFixed(1)}" stroke="url(#sbb-hach)" stroke-width="10" stroke-linecap="round"/>`; }
  for (const { c, y } of [...EG, ...ED]) { const [x0, y0] = pt(c), g = c.stock.etat !== 'à acheter'; svg += `<path d="M${x0.toFixed(1)},${y0.toFixed(1)} L${g ? 106 : 260},${y.toFixed(1)}" fill="none" stroke="${c.coul}" stroke-width="1" opacity=".6"/>`; }
  svg += `<circle cx="${cx}" cy="${cy}" r="${r0}" fill="#fff" stroke="#111" stroke-width="2"/><text x="${cx}" y="${cy + 4}" font-size="12" font-weight="700" text-anchor="middle" fill="#111">Nugget</text>`;
  for (const c of L) { const [x, y] = pt(c), court = c.stock.suffisant === false, rep = c.k === S.REP.k;
    svg += rep ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="11" fill="none" stroke="#111" stroke-width="2"/>` : '';
    svg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6.5" fill="${court ? '#fff' : c.coul}" stroke="${c.coul}" stroke-width="${court ? 3 : 1}"/>`; }
  svg += '</svg>';
  const etiq = ({ c, y }, cote) => `<button type="button" role="radio" aria-checked="${c.k === S.REP.k}" data-cand="${c.k}" data-houblon="${S.esc(c.nom)}" class="§-lab §-l${cote}${c.k === S.REP.k ? ' on' : ''}" style="top:${(y - 20).toFixed(1)}px;--c:${c.coul}"><b>${S.esc(c.nom)}</b><span class="§-num">${S.fr(c.dose.grams)} g · ${c.score}</span></button>`;
  const carte = (c) => `<div class="§-cd" style="--c:${c.coul}"><div class="§-cdh"><span class="§-cdn">${S.esc(c.nom)}</span><span class="§-num §-cdg">${S.fr(c.dose.grams)} g</span><span class="§-num §-cds">${c.score}</span></div>
<p class="§-cdl">${S.alphaTxt(c)}${S.usage(c)}${S.stock(c)}<span class="§-pk">${S.pictos(c.cites.slice(0, 5), 15)}</span>${S.autres(c, 22)}</p>
<p class="§-cdx">${stockMot(S, c)} · <span class="§-num">${S.fr(c.ibu, 1)}</span> IBU${c.gagne.length ? ` · ajoute ${ajoute(S, c)}` : ''}</p>
${compos(S, c)}<div class="§-cdm">${S.BIERE_FAM.map((f) => ligneBiere(S, f, c)).join('')}</div><p class="§-cdi">On ne sait pas : cohumulone${c.comp.huiles == null ? ', huiles' : ''}${c.alpha.horsFiches ? ', l’α du lot sort des fiches' : ''}${c.sansF >= 0.25 ? `, ${S.fr(c.sansF * 100)} % de ses mots sans famille` : ''}.</p></div>`;
  const corps = `<main class="§-e">
<header class="§-h">${S.croix(P)}<div><h1>Lequel à la place de Nugget ?</h1><p class="§-ctx" data-role="contexte"><span data-contexte="base">Stout 16D</span> · <span data-contexte="moment">60′</span> · <span data-contexte="dose">46 g, même IBU</span></p></div></header>
<div class="§-ci"><p class="§-cot"><span>ton stock</span><span>à acheter</span></p>${svg}<div data-libre="houblon" role="radiogroup" aria-label="Le remplaçant">${EG.map((e) => etiq(e, 'g')).join('')}${ED.map((e) => etiq(e, 'd')).join('')}</div></div>
<div class="§-outils"><p class="§-leg3"><i class="§-d"></i>suffit <i class="§-d §-dc"></i>stock court <i class="§-hz"></i>huiles inconnues</p>${S.legendeBouton(P)}${S.lentille(P)}</div>
${parCand(S, L, carte)}
</main>${pied(S, P, L)}`;
  const css = `${CSS_PAGE}${CSS_LB}${CSS_CP}
.§-h h1 { font-size:17px; font-weight:600; }
.§-ctx { font-size:12px; color:#555; }
.§-ci { position:relative; width:${W}px; height:${H}px; border:1px solid #e0e0e0; border-radius:8px; overflow:hidden; }
.§-sv { position:absolute; left:0; top:0; }
.§-cot { position:absolute; left:0; right:0; top:4px; display:flex; justify-content:space-between; padding:0 8px; font-size:12px; font-weight:700; color:#333; z-index:2; pointer-events:none; }
.§-lab { position:absolute; width:104px; height:40px; display:flex; flex-direction:column; justify-content:center; padding:0 6px; border-radius:8px; background:#fff; border:1px solid #d9d9d9; line-height:1.15; z-index:3; }
.§-lg { left:2px; align-items:flex-start; }
.§-ld { right:2px; align-items:flex-end; }
.§-lab b { font-size:13px; color:var(--c); white-space:nowrap; }
.§-lab span { font-size:12px; color:#333; white-space:nowrap; }
.§-lab.on { border:2px solid #111; }
.§-outils { display:flex; align-items:center; gap:8px; }
.§-leg3 { flex:1; display:flex; align-items:center; gap:4px; font-size:12px; color:#555; flex-wrap:wrap; }
.§-d { display:inline-block; width:10px; height:10px; border-radius:50%; background:#555; margin-left:2px; }
.§-dc { background:#fff; border:2px solid #555; }
.§-hz { display:inline-block; width:16px; height:8px; border-radius:2px; border:1px solid #9e9e9e; background:repeating-linear-gradient(45deg,#9e9e9e 0 2px,#fff 2px 5px); margin-left:2px; }
.§-cd { border-left:4px solid var(--c); padding:2px 0 2px 10px; display:flex; flex-direction:column; gap:5px; }
.§-cdh { display:flex; align-items:baseline; gap:8px; }
.§-cdn { font-size:20px; font-weight:800; color:var(--c); }
.§-cdg { font-size:18px; font-weight:700; }
.§-cds { margin-left:auto; font-size:20px; font-weight:700; }
.§-cdl { display:flex; align-items:center; gap:6px; flex-wrap:wrap; font-size:13px; }
.§-cdx { display:flex; align-items:center; gap:4px; font-size:13px; color:#333; flex-wrap:wrap; }
.§-pk { display:inline-flex; gap:2px; }
.§-cdm { display:flex; flex-direction:column; gap:5px; }
.§-cdi { font-size:12px; color:#555; border-top:1px dashed #bdbdbd; padding-top:4px; }
`;
  return S.page(P, { titre: 'sbb7 · Lequel à la place de Nugget ? · la cible', corps, css, fiches: [S.NUG, ...L],
    legendeLignes: [...S.LEG_COMMUNE, 'Cible : plus près du centre, plus proche de Nugget (score 0–100 du moteur ; cercles 95, 90, 85, 80) ; rayon hachuré : score ouvert de 79 à 99, huiles inconnues (calcul de cette page).'] });
}

// ---------------------------------------------------------------------------------------------------------------
// sbb8 · chaude · la fiche de brassage corrigée : la réponse s'écrit sur la recette, Nugget barré, le remplaçant au-dessus,
// les notes dans la marge ; les autres corrections possibles sont crayonnées dessous.
export function sbb8(S) {
  const P = 'sbb8', L = S.CANDS.filter((c) => ['nelson-sauvin', 'galaxy', 'idaho-7', 'sabro', 'magnat'].includes(c.k));
  const notes = (c) => { const md = maxDelta(S, c), dg = c.dose.grams - S.NUG.grams; return [
    `même amertume : <b class="§-num">${S.fr(c.ibu, 1)}</b> IBU`,
    !c.stock || c.stock.etat === 'à acheter' ? 'à acheter' : c.stock.suffisant === false ? `il manque <b class="§-num">${S.fr(c.dose.grams - c.stock.libre)} g</b>` : `il t’en restera <b class="§-num">${S.fr(c.reste)} g</b>`,
    `<b class="§-num">${S.sg(dg)} g</b> de matière`,
    `arôme : <b class="§-num">${md < 1.5 ? '~±1' : '~' + S.fr(md)}</b>, l’ébullition l’emporte`]; };
  const correction = (c) => `<div class="§-co" style="--c:${c.coul}"><p class="§-cw"><span class="§-car">↳</span><span class="§-cn" data-houblon="${S.esc(c.nom)}">${S.esc(c.nom)}</span><span class="§-num">${S.fr(c.dose.grams)} g · 60′</span></p>
<p class="§-ci">${S.alphaTxt(c)}${S.usage(c)}${S.stock(c)}<span class="§-pk">${S.pictos(c.cites.slice(0, 6), 15)}</span>${S.autres(c, 22)}</p>
<ul class="§-mg">${notes(c).map((n) => `<li>${n}</li>`).join('')}</ul>
<div class="§-pq"><span class="§-pql">pourquoi ${c.score}</span>${compos(S, c)}</div></div>`;
  const corps = `<main class="§-e">
<header class="§-h">${S.croix(P)}<p class="§-sht">Fiche de brassage · <b>Stout export</b></p></header>
<section class="§-sh">
<div class="§-shh"><h1 class="§-q">Lequel à la place de Nugget ?</h1><p class="§-shs" data-role="contexte"><span data-contexte="base">16D</span> · 20 L · DI 1,066 · 70 EBC · US-05 · <span data-contexte="moment">houblon à 60′</span> · <span data-contexte="dose">même IBU</span></p></div>
<h2>Houblons</h2>
<p class="§-bar"><span class="§-barn">Nugget · 46 g · 60′ · <span class="§-num">${S.fr(S.NUG.ibu, 1)}</span> IBU</span>${S.stock(S.NUG)}</p>
${parCand(S, L, correction)}
<h2>Ou bien <span class="§-gr">· crayonné, touche pour corriger</span></h2>
<div data-libre="houblon" role="radiogroup" aria-label="Le remplaçant" class="§-ob">${L.map((c) => `<button type="button" role="radio" aria-checked="${c.k === S.REP.k}" data-cand="${c.k}" class="${c.k === S.REP.k ? 'on' : ''}" style="--c:${c.coul}"><span class="§-obn">${S.esc(c.nom)}</span><span class="§-num">${S.fr(c.dose.grams)} g</span><span class="§-obs">${c.stock.etat === 'à acheter' ? 'à acheter' : c.stock.suffisant === false ? S.fr(c.stock.libre) + ' g au stock' : 'au stock'}</span><b class="§-num">${c.score}</b></button>`).join('')}</div>
<div class="§-bl"><div class="§-blh"><h2>Bilan, au style</h2>${S.legendeBouton(P)}${S.lentille(P)}</div>
${parCand(S, L, (c) => `<div class="§-gl"><span>IBU</span>${jauge(S, { v: c.ibu, av: S.NUG.ibu, b0: 50, b1: 70, max: 100, coul: c.coul })}<span class="§-num">${S.fr(S.NUG.ibu, 1)} → ${S.fr(c.ibu, 1)}</span></div><div class="§-blb">${S.BIERE_FAM.map((f) => ligneBiere(S, f, c)).join('')}</div>`)}
</div>
</section>
</main>${pied(S, P, L)}`;
  const css = `${CSS_PAGE}${CSS_LB}${CSS_JG}
.§-h h1 { font-size:17px; font-weight:600; }
.§-sh { position:relative; border:1px solid #d9d9d9; border-radius:8px; padding:8px 12px 10px 30px; display:flex; flex-direction:column; gap:6px; background:#fff; }
.§-sh::before { content:""; position:absolute; left:21px; top:0; bottom:0; width:1px; background:#f0b4b4; }
.§-sh h2 { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:#333; border-bottom:1px solid #e0e0e0; padding-bottom:2px; }
.§-sh h2 .§-gr { text-transform:none; letter-spacing:0; font-weight:400; }
.§-sht { font-size:15px; }
.§-q { font-size:18px; font-weight:600; font-style:italic; color:#333; }
.§-shs { font-size:12px; color:#555; }
.§-bar { display:flex; align-items:center; gap:8px; font-size:15px; color:#555; }
.§-barn { text-decoration:line-through; text-decoration-thickness:2px; text-decoration-color:#111; }
.§-co { display:flex; flex-direction:column; gap:4px; margin-top:-2px; }
.§-cw { display:flex; align-items:baseline; gap:8px; font-style:italic; }
.§-car { color:var(--c); font-size:18px; font-style:normal; }
.§-cn { font-size:24px; font-weight:800; color:var(--c); letter-spacing:-.01em; }
.§-cw .§-num { font-size:15px; font-weight:600; font-style:normal; }
.§-ci { display:flex; align-items:center; gap:6px; flex-wrap:wrap; font-size:13px; padding-left:22px; }
.§-pk { display:inline-flex; gap:2px; }
.§-mg { list-style:none; display:flex; flex-direction:column; gap:3px; margin-left:22px; padding:5px 8px; border-left:3px solid var(--c); background:#f5f5f5; border-radius:0 4px 4px 0; font-size:13px; font-style:italic; }
.§-pq { display:grid; grid-template-columns:62px 1fr; gap:6px; align-items:start; margin-left:22px; }
.§-pql { font-size:12px; font-style:italic; color:#555; }
.§-ob { display:flex; flex-direction:column; }
.§-ob button { display:grid; grid-template-columns:1fr 48px 92px 26px; align-items:center; gap:6px; min-height:28px; padding:0 4px; border-bottom:1px dashed #d9d9d9; font-size:13px; color:#555; }
.§-ob button .§-obn { font-style:italic; font-weight:600; color:var(--c); }
.§-ob button.on { background:#f5f5f5; color:#111; }
.§-ob button.on .§-obn { text-decoration:underline; text-decoration-thickness:2px; }
.§-obs { font-size:12px; }
.§-ob b { text-align:right; color:#111; }
.§-bl { display:flex; flex-direction:column; gap:5px; }
.§-blh { display:flex; align-items:center; gap:8px; }
.§-blh h2 { flex:1; }
.§-gl { display:grid; grid-template-columns:30px 1fr 96px; align-items:center; gap:6px; font-size:13px; }
.§-gl .§-num { text-align:right; }
.§-blb { display:flex; flex-direction:column; gap:5px; margin-top:4px; }
`;
  return S.page(P, { titre: 'sbb8 · Lequel à la place de Nugget ? · la fiche de brassage corrigée', corps, css, fiches: [S.NUG, ...L] });
}
