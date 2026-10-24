// Série b, les trois tièdes : la forme de l'approche, « la réponse d'abord » (le meilleur remplaçant, pourquoi, gagné
// et perdu en un regard), chacune dans sa composition.
import { parCand, pied, ligneBiere, CSS_LB, bilan, compos, CSS_CP, jauge, CSS_JG, maxDelta, ajoute } from './briques-sbb.mjs';

// ---------------------------------------------------------------------------------------------------------------
// sbb3 · tiède · le verdict et son bilan : la réponse en grand, puis deux colonnes « tu gardes / tu perds » et l'inconnu.
export function sbb3(S) {
  const P = 'sbb3', L = S.CANDS.filter((c) => ['nelson-sauvin', 'galaxy', 'idaho-7', 'sabro', 'magnat', 'yeoman'].includes(c.k));
  const heros = (c) => `<div class="§-hero" data-houblon="${S.esc(c.nom)}" style="background:${c.coul}">
<p class="§-hn">${S.esc(c.nom)}</p>
<p class="§-hd"><span class="§-num">${S.fr(c.dose.grams)} g</span><span>à 60′, même IBU</span></p>
<p class="§-hl">${S.alphaTxt(c)}${S.usage(c)}${S.stock(c)}<span class="§-hs §-num">${c.score}<small> ${c.palier}</small></span></p>
<p class="§-hp"><span class="§-pk">${S.pictos(c.cites.slice(0, 6), 16)}</span>${S.autres(c, 30)}</p></div>`;
  const colonne = (titre, cls, l, signe) => `<div class="§-col ${cls}"><h2>${titre}</h2><ul>${l.map((x) => `<li><span class="§-sig">${signe}</span><span>${x}</span></li>`).join('')}</ul></div>`;
  const bloc = (c) => { const b = bilan(S, c); return `${heros(c)}
<div class="§-bil">${colonne('Tu gardes', '§-g', b.garde, S.ico('i-check'))}${colonne('Tu perds', '§-p', b.perd, '−')}</div>
<div class="§-inc"><h2>On ne sait pas</h2><ul>${b.inc.map((x) => `<li>${x}</li>`).join('')}</ul></div>
<div class="§-why"><h2>Pourquoi ${c.score}</h2>${compos(S, c)}</div>`; };
  const corps = `<main class="§-e">
<div class="§-tete"><header class="§-top">${S.croix(P)}<div><h1>Lequel à la place de Nugget ?</h1><p class="§-ctx" data-role="contexte"><span data-contexte="base">ta stout 16D</span> · <span data-contexte="moment">Nugget à 60′</span> · <span data-contexte="dose">46 g, 59,7 IBU</span> · ${S.stock(S.NUG)}</p></div></header>
${parCand(S, L, bloc)}</div>
<div class="§-alt"><span class="§-altl">Les autres</span><div data-libre="houblon" role="radiogroup" aria-label="Le remplaçant" class="§-als">${L.map((c) => `<button type="button" role="radio" aria-checked="${c.k === S.REP.k}" data-cand="${c.k}" class="${c.k === S.REP.k ? 'on' : ''}" style="--c:${c.coul}"><b>${S.esc(c.nom)}</b><span class="§-num">${c.score}</span></button>`).join('')}</div></div>
<div class="§-bi"><div class="§-bih"><h2>Ma bière</h2>${S.legendeBouton(P)}${S.lentille(P)}</div><div class="§-big3">${parCand(S, L, (c) => S.BIERE_FAM.map((f) => ligneBiere(S, f, c)).join(''))}</div></div>
</main>${pied(S, P, L)}`;
  const css = `${CSS_LB}${CSS_CP}
body { display:flex; flex-direction:column; min-height:100vh; }
.§-e { flex:1; max-width:390px; width:100%; margin:0 auto; padding:6px 12px 8px; display:flex; flex-direction:column; gap:8px; }
.§-big3 > div { display:flex; flex-direction:column; gap:5px; }
.§-why { display:flex; flex-direction:column; gap:4px; }
.§-why h2 { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; color:#555; }
.§-h { display:flex; align-items:center; gap:10px; }
.§-h h1 { font-size:15px; font-weight:600; color:#333; }
.§-ctx { font-size:12px; color:#555; display:flex; align-items:center; gap:4px; flex-wrap:wrap; }
.§-tete { display:flex; flex-direction:column; gap:8px; }
.§-tete > div[data-pour-cand] { display:flex; flex-direction:column; gap:8px; margin-top:-8px; }
.§-top { background:#111; color:#fff; border-radius:8px 8px 0 0; padding:8px 10px; display:flex; gap:10px; align-items:center; }
.§-top .§-x { background:#111; border-color:#777; }
.§-top .§-x .§-ic, .§-top .§-ic { color:#fff; }
.§-top h1 { font-size:16px; font-weight:600; color:#fff; }
.§-top .§-ctx, .§-top .§-stk { color:#e0e0e0; }
.§-hero { border-radius:0 0 8px 8px; padding:10px 12px; color:#fff; display:flex; flex-direction:column; gap:4px; }
.§-hero .§-ic, .§-hero .§-gr, .§-hero .§-stk { color:#fff; }
.§-hero .§-us { color:#fff; border-color:#fff; }
.§-hn { font-size:30px; font-weight:800; line-height:1.05; letter-spacing:-.01em; }
.§-hd { display:flex; align-items:baseline; gap:8px; font-size:14px; }
.§-hd .§-num { font-size:22px; font-weight:700; }
.§-hl { display:flex; align-items:center; gap:7px; font-size:13px; flex-wrap:wrap; }
.§-hs { margin-left:auto; font-size:20px; font-weight:700; word-spacing:0; }
.§-hs small { margin-left:4px; }
.§-hs small { font-family:"Source Sans 3","Segoe UI",sans-serif; font-size:12px; font-weight:400; }
.§-hp { display:flex; align-items:center; gap:8px; }
.§-pk { display:inline-flex; gap:3px; background:#fff; border-radius:999px; padding:3px 8px; }
.§-hero .§-aut { color:#fff; }
.§-hero .§-aut i { background:#9e9e9e; }
.§-bil { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.§-col { border-radius:8px; padding:7px 8px; display:flex; flex-direction:column; gap:4px; }
.§-col h2, .§-inc h2 { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; color:#555; }
.§-g { background:#f5f5f5; }
.§-p { background:#f5f5f5; }
.§-col ul, .§-inc ul { list-style:none; display:flex; flex-direction:column; gap:5px; font-size:13px; line-height:1.25; }
.§-col li { display:grid; grid-template-columns:14px 1fr; gap:4px; align-items:start; }
.§-sig { font-weight:800; font-size:15px; line-height:16px; color:#111; }
.§-g .§-ic { color:#0b6e63; margin-top:1px; }
.§-inc { border:1px dashed #bdbdbd; border-radius:8px; padding:6px 8px; display:flex; flex-direction:column; gap:3px; }
.§-inc li { display:flex; align-items:center; gap:5px; flex-wrap:wrap; }
.§-alt { display:flex; align-items:center; gap:8px; }
.§-altl { font-size:12px; color:#555; flex:none; }
.§-als { display:flex; gap:5px; overflow-x:auto; scrollbar-width:none; }
.§-als button { flex:none; display:inline-flex; align-items:center; gap:5px; height:32px; padding:0 10px; border-radius:999px; border:1px solid #d9d9d9; font-size:13px; }
.§-als button b { color:var(--c); }
.§-als button.on { border:2px solid var(--c); background:#f5f5f5; }
.§-bi { display:flex; flex-direction:column; gap:5px; border-top:1px solid #e0e0e0; padding-top:6px; }
.§-bih { display:flex; align-items:center; gap:8px; }
.§-bih h2 { font-size:14px; font-weight:700; margin-right:auto; }
.§-big > div { display:grid; grid-template-columns:1fr 1fr; gap:4px 12px; }
.§-big .§-lb { grid-template-columns:16px 38px 1fr 30px; gap:4px; }
`;
  return S.page(P, { titre: 'sbb3 · Lequel à la place de Nugget ? · le verdict et son bilan', corps, css, fiches: [S.NUG, ...L] });
}

// ---------------------------------------------------------------------------------------------------------------
// sbb4 · tiède · ma bière dit la réponse : les douze familles avant et après, l'IBU et la matière ; ce qui bouge se voit.
export function sbb4(S) {
  const P = 'sbb4', L = S.CANDS.filter((c) => ['nelson-sauvin', 'galaxy', 'idaho-7', 'sabro', 'magnat'].includes(c.k));
  const ORDRE = ['floral', 'herbal', 'earthy', 'resin', 'citrus', 'tropical', 'spice', 'green', 'stoneFruit', 'pomeFruit', 'berries', 'melon'];
  const verdict = (c) => { const md = maxDelta(S, c); return md < 1.5 ? 'ma bière ne bouge presque pas' : `ma bière bouge de ~${S.fr(md)} pt au plus`; };
  const rangee = (c, f) => { const att = S.M.style.statut[f] === 'attendue'; return `<div class="§-fr${att ? ' §-att' : ''}">${S.pic(f, 16)}<span class="§-fn" style="color:${S.T(f)}">${S.NOMF[f]}</span>${S.barre(f, c.apres.profil, S.NUG.profil)}${S.delta(f, c.apres.profil, S.NUG.profil)}</div>`; };
  const bloc = (c) => `<div class="§-rep" data-houblon="${S.esc(c.nom)}"><p class="§-r1"><span style="color:${c.coul}">${S.esc(c.nom)}</span> <span class="§-num">${S.fr(c.dose.grams)} g</span> : ${verdict(c)}.</p>
<p class="§-r2">${S.alphaTxt(c)} ${S.usage(c)} ${S.stock(c)} ${S.autres(c, 26)}</p></div>
<div class="§-why">${compos(S, c)}</div>
<div class="§-pf"><p class="§-pfh"><span>familles de la 16D</span><span class="§-gr">rond : avec Nugget</span></p>${ORDRE.slice(0, 4).map((f) => rangee(c, f)).join('')}<p class="§-pfh §-pfh2"><span>les autres</span></p>${ORDRE.slice(4).map((f) => rangee(c, f)).join('')}</div>
<div class="§-gx">
<div class="§-gl"><span class="§-gll">IBU</span>${jauge(S, { v: c.ibu, av: S.NUG.ibu, b0: 50, b1: 70, max: 100, coul: c.coul })}<span class="§-num">${S.fr(c.ibu, 1)}</span></div>
<div class="§-gl"><span class="§-gll">grammes</span>${jauge(S, { v: c.dose.grams, av: S.NUG.grams, b0: 0, b1: c.stock && c.stock.libre != null ? c.stock.libre : 0, max: 110, coul: c.coul })}<span class="§-num">${S.fr(c.dose.grams)}</span></div>
<p class="§-gn">IBU : zone 50–70 de la 16D · grammes : zone = ton stock${c.stock && c.stock.libre != null ? ' (' + S.fr(c.stock.libre) + ' g)' : ' (aucun)'} · rond : Nugget</p></div>`;
  const corps = `<main class="§-e">
<header class="§-h">${S.croix(P)}<div class="§-ht"><h1>Lequel à la place de Nugget ?</h1><p data-role="contexte" class="§-ctx"><span data-contexte="base">Stout 16D</span> · <span data-contexte="moment">à 60′</span> · <span data-contexte="dose">même IBU</span></p></div>${S.legendeBouton(P)}</header>
<div data-libre="houblon" role="radiogroup" aria-label="Le remplaçant" class="§-tabs">${L.map((c) => `<button type="button" role="radio" aria-checked="${c.k === S.REP.k}" data-cand="${c.k}" class="${c.k === S.REP.k ? 'on' : ''}" style="--c:${c.coul}">${S.esc(c.nom.split(' ')[0])}<small class="§-num">${c.score}</small></button>`).join('')}</div>
${parCand(S, L, bloc)}
<div class="§-ft"><p class="§-res">${S.pic('resin', 16)}<span>Le résineux reste hors du style : à 60′, aucun de ces remplaçants ne le corrige.</span></p>${S.lentille(P)}</div>
</main>${pied(S, P, L)}`;
  const css = `${CSS_JG}${CSS_CP}
.§-why { padding:0 2px; }
body { display:flex; flex-direction:column; min-height:100vh; }
.§-e { flex:1; max-width:390px; width:100%; margin:0 auto; padding:6px 12px 8px; display:flex; flex-direction:column; gap:7px; }
.§-h { display:flex; align-items:center; gap:10px; }
.§-ht { flex:1; }
.§-h h1 { font-size:16px; font-weight:600; }
.§-ctx { font-size:12px; color:#555; }
.§-tabs { display:grid; grid-template-columns:repeat(5,1fr); border:1px solid #d9d9d9; border-radius:8px; overflow:hidden; }
.§-tabs button { height:38px; display:flex; flex-direction:column; align-items:center; justify-content:center; font-size:13px; font-weight:600; line-height:1.1; border-left:1px solid #e0e0e0; color:#333; }
.§-tabs button:first-child { border-left:0; }
.§-tabs button small { font-size:12px; font-weight:400; color:#555; }
.§-tabs button.on { background:var(--c); color:#fff; }
.§-tabs button.on small { color:#fff; }
.§-rep { display:flex; flex-direction:column; gap:3px; }
.§-r1 { font-size:18px; font-weight:700; line-height:1.2; }
.§-r2 { display:flex; align-items:center; gap:6px; font-size:13px; flex-wrap:wrap; }
.§-pf { display:flex; flex-direction:column; gap:3px; background:#f5f5f5; border-radius:8px; padding:7px 9px; }
.§-pfh { display:flex; justify-content:space-between; font-size:12px; color:#555; font-weight:600; }
.§-pfh2 { margin-top:3px; }
.§-fr { display:grid; grid-template-columns:16px 70px 1fr 34px; align-items:center; gap:6px; min-height:23px; }
.§-fn { font-size:13px; }
.§-att .§-fn { font-weight:700; }
.§-fr .§-br { background:#fff; }
.§-fr .§-dl { text-align:right; }
.§-gx { display:flex; flex-direction:column; gap:4px; }
.§-gl { display:grid; grid-template-columns:64px 1fr 40px; align-items:center; gap:8px; font-size:13px; }
.§-gll { font-weight:600; }
.§-gl .§-num { text-align:right; font-size:13px; }
.§-gn { font-size:12px; color:#555; }
.§-ft { display:flex; align-items:center; gap:8px; border-top:1px solid #e0e0e0; padding-top:6px; }
.§-res { flex:1; display:flex; gap:6px; align-items:center; font-size:13px; }
`;
  return S.page(P, { titre: 'sbb4 · Lequel à la place de Nugget ? · ma bière dit la réponse', corps, css, fiches: [S.NUG, ...L] });
}

// ---------------------------------------------------------------------------------------------------------------
// sbb5 · tiède · trois réponses, trois raisons : sans rien acheter, le moins de matière, le plus proche.
export function sbb5(S) {
  const P = 'sbb5';
  const dispo = S.CANDS.filter((c) => c.stock && c.stock.suffisant);
  const sans = S.REP, leger = [...dispo].sort((a, b) => a.dose.grams - b.dose.grams)[0];
  const proche = S.CANDS.filter((c) => c.stock.etat === 'à acheter' && c.fiab === 'bonne').sort((a, b) => b.score - a.score)[0];
  const R = [[sans, 'Sans rien acheter', 'le premier de ton stock'], [leger, 'Le moins de matière', `α ${S.fr(leger.alpha.valeur, 1)} : ${S.fr(S.NUG.grams - leger.dose.grams)} g de moins`], [proche, 'Le plus proche', 'à acheter, tout connu']];
  const L = R.map((r) => r[0]);
  const carte = ([c, titre, raison], i) => `<button type="button" role="radio" aria-checked="${i === 0}" data-cand="${c.k}" class="§-cd${i === 0 ? ' on' : ''}" style="--c:${c.coul}">
<span class="§-ck">${titre}<span class="§-gr"> · ${raison}</span></span>
<span class="§-cn" data-houblon="${S.esc(c.nom)}">${S.esc(c.nom)}</span><span class="§-cg §-num">${S.fr(c.dose.grams)} g</span>
<span class="§-cl">${S.alphaTxt(c)}${S.usage(c)}${S.stock(c)}${S.autres(c, 24)}</span>
<span class="§-ca">${S.pictos(c.cites.slice(0, 7), 16)}</span>
<span class="§-cs"><b class="§-num">${c.score}</b><small>${c.palier}</small></span>
<span class="§-cc">${compos(S, c)}</span>
<span class="§-cx">${c.stock.etat === 'à acheter' ? 'à acheter' : c.stock.suffisant === false ? 'stock court' : `il t’en restera ${S.fr(c.reste)} g`} · <span class="§-num">${S.fr(c.ibu, 1)}</span> IBU${c.gagne.length ? ` · ajoute ${ajoute(S, c)}` : ''}</span></button>`;
  const corps = `<main class="§-e">
<header class="§-h">${S.croix(P)}<div><h1>Lequel à la place de Nugget ?</h1><p class="§-ctx" data-role="contexte"><span data-contexte="base">Stout 16D</span> · <span data-contexte="moment">à 60′</span> · <span data-contexte="dose">46 g, même IBU</span> · Nugget ${S.stock(S.NUG)}</p></div></header>
<div data-libre="houblon" role="radiogroup" aria-label="Le remplaçant" class="§-cds">${R.map(carte).join('')}</div>
<div class="§-bi"><div class="§-bih"><h2>Ma bière ${parCand(S, L, (c) => 'avec ' + S.esc(c.nom), 'span', sans.k)}</h2>${S.legendeBouton(P)}${S.lentille(P)}</div><div class="§-big">${parCand(S, L, (c) => S.BIERE_FAM.map((f) => ligneBiere(S, f, c, { court: true })).join(''), 'div', sans.k)}</div></div>
</main>${pied(S, P, L)}`;
  const css = `${CSS_LB}${CSS_CP}
body { display:flex; flex-direction:column; min-height:100vh; }
.§-e { flex:1; max-width:390px; width:100%; margin:0 auto; padding:6px 12px 8px; display:flex; flex-direction:column; gap:8px; }
.§-h { display:flex; align-items:center; gap:10px; }
.§-h h1 { font-size:17px; font-weight:600; }
.§-ctx { font-size:12px; color:#555; display:flex; gap:4px; align-items:center; flex-wrap:wrap; }
.§-cds { display:flex; flex-direction:column; gap:7px; }
.§-cd { display:grid; grid-template-columns:1fr auto; grid-template-areas:"k k" "n g" "l s" "a s" "c c" "x x"; gap:3px 8px; width:100%; padding:8px 10px 8px 12px; border-radius:8px; border:1px solid #d9d9d9; border-left:6px solid var(--c); background:#fff; }
.§-cd.on { border-color:var(--c); border-width:2px 2px 2px 6px; background:#f5f5f5; }
.§-ck { grid-area:k; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.03em; color:#333; }
.§-ck .§-gr { text-transform:none; letter-spacing:0; font-weight:400; }
.§-cn { grid-area:n; font-size:20px; font-weight:800; color:var(--c); line-height:1.1; }
.§-cg { grid-area:g; font-size:20px; font-weight:700; text-align:right; }
.§-cl { grid-area:l; display:flex; align-items:center; gap:6px; font-size:13px; flex-wrap:wrap; }
.§-ca { grid-area:a; display:flex; gap:3px; }
.§-cs { grid-area:s; display:flex; flex-direction:column; align-items:flex-end; justify-content:center; }
.§-cs b { font-size:22px; line-height:1; }
.§-cs small { font-size:12px; color:#555; }
.§-cc { grid-area:c; }
.§-cx { grid-area:x; display:flex; align-items:center; gap:4px; font-size:12px; color:#333; flex-wrap:wrap; }
.§-bi { display:flex; flex-direction:column; gap:5px; border-top:1px solid #e0e0e0; padding-top:6px; }
.§-bih { display:flex; align-items:center; gap:8px; }
.§-bih h2 { font-size:14px; font-weight:700; margin-right:auto; }
.§-big > div { display:grid; grid-template-columns:1fr 1fr; gap:4px 12px; }
.§-big .§-lb { grid-template-columns:16px 38px 1fr 30px; gap:4px; }
`;
  return S.page(P, { titre: 'sbb5 · Lequel à la place de Nugget ? · trois réponses, trois raisons', corps, css, fiches: [S.NUG, ...L],
    legendeLignes: [...S.LEG_COMMUNE, '« rien d’étranger » : à 60′, le moteur ne compte de l’arôme que ce que le remplaçant ajoute de neuf ; 100 = rien de cité en plus.'] });
}
