// node st3-build.mjs : écrit st3-<version>-<390|1280>.html, axe D4 refait (Autres stocks), 22.11.
// Son refus de d4b : « SI j'ai 30 additif différents ? Non je veux qqch de compact comme le reste ».
// Base : son étagère choisie (d2a à 390, d3b légende, d3a à 1280 ; D420). Décor et en-tête repris de st1-build.mjs
// (lu tel quel, sans copie) ; classes neuves préfixées a3-, b3-, c3- (L26).
// Données : 30 additifs, 15 emballages, 10 produits de nettoyage, noms et unités plausibles, aucun chiffre réel.
// Versions : a (froide) étagère jumelle ; b (tiède) casier nommé, rayons repliables ; c (chaude) tableau périodique.
// Filtres : dynamiques, comptés sur Autres stocks, zéros cachés, les plus utiles d'abord, une seule ligne (sa note du 22.11).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(ICI, 'st1-build.mjs'), 'utf8');
const corps = src.slice(src.indexOf('// ---------- icônes'), src.indexOf('let k = 0;'));
const S = new Function('ICI', 'fs', 'path', `${corps};return {P, ic, CSS, CSS_1280, CSS_D2, CSS_D2A, tete, tete1280, RAIL, onglets, fab, navBas, page, NB, fr};`)(ICI, fs, path);
const { P, ic, CSS_1280, CSS_D2, CSS_D2A, tete, tete1280, RAIL, onglets, fab, navBas, page, NB, fr } = S;
Object.assign(P, {
  bottle: '<path d="M10 2h4v4l2 3v12a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9l2-3z"/><path d="M8 13h8"/>',
  can: '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M6 7h12M6 17h12"/>',
  cap: '<circle cx="12" cy="12" r="6.5"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
  label: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 10h8M8 14h5"/>',
  carton: '<path d="M3 8l9-4 9 4v10l-9 4-9-4z"/><path d="M3 8l9 4 9-4M12 12v10"/>',
  spray: '<path d="M9 9h6v12H9z"/><path d="M10 9V6h4v3M14 6h3l1-2M18 7h2M18 4.5l1.5-1"/>',
});

// ---------- données ----------
// q quantité ; u unité (pc = pièces, nombre nu) ; s seuil ; d DDM proche ; c à compter ; ne : manque pour NEIPA 28.11.
const ADD = [
  { g: 'Sels', l: [{ n: 'Gypse', sh: 'Gypse', sy: 'Gy', q: 500, u: 'g', s: 250 }, { n: 'Chlorure de calcium', sh: 'Chlorure', sy: 'Cl', q: 400, u: 'g', s: 200 }, { n: "Sel d'Epsom", sh: 'Epsom', sy: 'Ep', q: 250, u: 'g' }, { n: 'Sel de table', sh: 'Sel', sy: 'Na', q: 300, u: 'g' }, { n: 'Bicarbonate de sodium', sh: 'Bicarb.', sy: 'Bi', q: 0, u: 'g', s: 100 }, { n: 'Craie', sh: 'Craie', sy: 'Cr', q: 150, u: 'g' }, { n: 'Chaux éteinte', sh: 'Chaux', sy: 'Ch', q: 80, u: 'g', s: 100 }] },
  { g: 'Acides', l: [{ n: 'Acide lactique 80 %', sh: 'Lactique', sy: 'La', q: 0, u: 'ml', s: 250, ne: 1 }, { n: 'Acide phosphorique 75 %', sh: 'Phospho.', sy: 'Ph', q: 350, u: 'ml', s: 200 }, { n: 'Acide citrique', sh: 'Citrique', sy: 'Ci', q: 120, u: 'g' }] },
  { g: 'Clarif.', l: [{ n: 'Mousse irlandaise', sh: 'Mousse irl.', sy: 'Mi', q: 80, u: 'g', s: 100 }, { n: 'Whirlfloc (comprimés)', sh: 'Whirlfloc', sy: 'Wf', q: 18, u: 'pc', s: 10 }, { n: 'Gélatine', sh: 'Gélatine', sy: 'Gé', q: 0, u: 'g' }, { n: 'Biofine Clear', sh: 'Biofine', sy: 'Bf', q: 200, u: 'ml', d: '12.26' }, { n: 'Polyclar', sh: 'Polyclar', sy: 'Pc', q: 100, u: 'g' }, { n: 'Protofloc', sh: 'Protofloc', sy: 'Pf', q: 40, u: 'g' }, { n: 'Fermcap S', sh: 'Fermcap', sy: 'Fc', q: 25, u: 'ml' }] },
  { g: 'Levure', l: [{ n: 'Nutriment levure', sh: 'Nutriment', sy: 'Nu', q: 50, u: 'g', s: 30 }, { n: 'Servomyces (capsules)', sh: 'Servomyces', sy: 'Sv', q: 10, u: 'pc' }, { n: 'Zinc', sh: 'Zinc', sy: 'Zn', q: 0, u: 'g' }, { n: 'Brewers Clarex', sh: 'Clarex', sy: 'Cx', q: 10, u: 'ml' }, { n: 'Glucoamylase', sh: 'Glucoamyl.', sy: 'Gl', q: 20, u: 'ml', d: '12.26' }, { n: 'Alpha-amylase', sh: 'α-amylase', sy: 'Aa', q: 15, u: 'ml' }] },
  { g: 'Épices', l: [{ n: 'Coriandre', sh: 'Coriandre', sy: 'Co', q: 40, u: 'g', s: 60 }, { n: "Écorce d'orange amère", sh: 'Orange am.', sy: 'Or', q: 200, u: 'g' }, { n: 'Vanille (gousses)', sh: 'Vanille', sy: 'Va', q: 3, u: 'pc', c: 1 }, { n: 'Éclats de cacao', sh: 'Cacao', sy: 'Cc', q: 0, u: 'g' }, { n: 'Fève tonka', sh: 'Tonka', sy: 'Tk', q: 6, u: 'pc' }, { n: 'Sel de Gose', sh: 'Sel gose', sy: 'Sg', q: 500, u: 'g' }, { n: 'Gingembre séché', sh: 'Gingembre', sy: 'Gi', q: 50, u: 'g' }] },
];
const EMB = [
  { g: 'Bouteilles', p: 'bottle', l: [{ n: 'Bouteille 33 cl brune', sh: '33 cl', sy: '33', q: 200, u: 'pc', s: 300, ne: 1 }, { n: 'Bouteille 75 cl', sh: '75 cl', sy: '75', q: 48, u: 'pc' }, { n: 'Bouteille 50 cl', sh: '50 cl', sy: '50', q: 0, u: 'pc' }] },
  { g: 'Canettes', p: 'can', l: [{ n: 'Canette 44 cl', sh: '44 cl', sy: '44', q: 96, u: 'pc', s: 48 }, { n: 'Couvercle 44 cl', sh: 'Couvercle', sy: 'Cv', q: 120, u: 'pc' }] },
  { g: 'Capsules', p: 'cap', l: [{ n: 'Capsule 26 mm or', sh: '26 or', sy: '26', q: 850, u: 'pc', s: 300 }, { n: 'Capsule 26 mm noire', sh: '26 noire', sy: '26', q: 400, u: 'pc' }, { n: 'Capsule 29 mm', sh: '29 mm', sy: '29', q: 60, u: 'pc' }] },
  { g: 'Étiquettes', p: 'label', l: [{ n: 'Étiquette IPA', sh: 'IPA', sy: 'IP', q: 0, u: 'pc', s: 100 }, { n: 'Étiquette NEIPA', sh: 'NEIPA', sy: 'NE', q: 140, u: 'pc', s: 200, ne: 1 }, { n: 'Étiquette Stout', sh: 'Stout', sy: 'St', q: 60, u: 'pc' }, { n: 'Étiquette Saison', sh: 'Saison', sy: 'Sa', q: 35, u: 'pc' }, { n: 'Étiquette Gose', sh: 'Gose', sy: 'Go', q: 12, u: 'pc', s: 50 }] },
  { g: 'Cartons', p: 'carton', l: [{ n: 'Carton 6 × 33 cl', sh: '6×33', sy: '6×', q: 40, u: 'pc' }, { n: 'Carton 24 × 33 cl', sh: '24×33', sy: '24', q: 8, u: 'pc' }] },
];
const NET = [
  { g: 'Acides', l: [{ n: 'Acide peracétique', sh: 'Peracét.', sy: 'Pa', q: 1.5, u: 'L', s: 2 }, { n: 'Star San', sh: 'Star San', sy: 'SS', q: 0.8, u: 'L' }, { n: 'Détartrant acide', sh: 'Détartrant', sy: 'Dt', q: 0, u: 'L' }] },
  { g: 'Alcalins', l: [{ n: 'Soude caustique', sh: 'Soude', sy: 'So', q: 2, u: 'kg' }, { n: 'PBW', sh: 'PBW', sy: 'Pb', q: 0.4, u: 'kg', s: 1 }, { n: 'Chlore actif', sh: 'Chlore', sy: 'Jv', q: 5, u: 'L' }] },
  { g: 'Conso.', l: [{ n: 'Gants nitrile', sh: 'Gants', sy: 'Gn', q: 60, u: 'pc', s: 50 }, { n: 'Éponges', sh: 'Éponges', sy: 'Ép', q: 4, u: 'pc' }, { n: 'Joints tri-clamp', sh: 'Joints TC', sy: 'Jt', q: 12, u: 'pc' }, { n: 'Filtres à manche', sh: 'Filtres', sy: 'Fi', q: 3, u: 'pc' }] },
];
const RAY = [
  { k: 'add', nom: 'Additifs', gs: ADD, c: '#3f74a3', f: '#5b8db8', p: 'flask' },
  { k: 'emb', nom: 'Emballage', gs: EMB, c: '#b8692e', f: '#d08a4a', p: 'bottle' },
  { k: 'net', nom: 'Nettoyage', gs: NET, c: '#25786f', f: '#3c9a8f', p: 'spray' },
];
const tous = (gs) => gs.flatMap((g) => g.l.map((a) => ({ ...a, fam: g.g })));
const n = (gs) => tous(gs).length;
const ep = (a) => !a.q;
const bas = (a) => a.q && a.s && a.q < a.s;
const fq = (a, nu = false) => (!a.q ? '0' : a.u === 'pc' ? fr(a.q) : a.u === 'g' && a.q >= 1000 ? `${fr(a.q / 1000)}${NB}kg` : nu ? fr(a.q) : `${fr(a.q)}${NB}${a.u}`);
const fs_ = (a) => (a.u === 'pc' ? `${a.s}` : `${fr(a.s)}${NB}${a.u}`);
const niv = (a) => (!a.q ? 0 : a.s ? Math.min(1, a.q / (2 * a.s)) : 0.6); // le seuil tombe à mi-hauteur
const TOUT = RAY.flatMap((r) => tous(r.gs));
const NEP = TOUT.filter(ep).length, NBAS = TOUT.filter(bas).length, NDDM = TOUT.filter((a) => a.d).length, NCPT = TOUT.filter((a) => a.c).length, NNE = TOUT.filter((a) => a.ne).length;
const urg = (a) => (ep(a) ? 0 : bas(a) ? 1 : a.d ? 2 : a.c ? 3 : 4);
const etat = (a) => (ep(a) ? '<span class="rouge">épuisé</span>' : a.c ? '<span class="pt">à compter</span>' : a.s ? (bas(a) ? `<span class="brun">bas · seuil ${fs_(a)}</span>` : `assez · seuil ${fs_(a)}`) : 'sans seuil') + (a.d ? ` · <span class="a3-ddm">DDM ${a.d}</span>` : '');

// Filtres dynamiques : comptés sur Autres stocks, zéros cachés, triés par utilité ; le reste derrière « +n ».
const FILTRES = [
  ['neipa', `${ic('mug', 14)}NEIPA 28.11`, NNE, 'ne'], ['épuisés', 'épuisés', NEP, 'r'], ['bas', 'bas', NBAS, 'br'], ['DDM', 'DDM', NDDM, 'dd'], ['à compter', 'à compter', NCPT, 'cpt'],
].filter((f) => f[2]);
const filtres = (max, o = {}) => `<div class="filt a3-f" style="margin:5px 10px 0">${FILTRES.slice(0, max).map(([, t, k, c]) => `<span class="pl ${c}">${t} <b>${k}</b></span>`).join('')}${FILTRES.length > max ? `<span class="pl plus">+${FILTRES.length - max}</span>` : ''}<span class="o" style="width:34px;height:34px;margin-left:auto">${ic('star', 17)}</span>${o.apres ?? ''}</div>`;
const entree = (max = 4) => `${tete()}${onglets(['Articles', 'Recompter', 'Courses', 'Fûts', 'Matériel'], 'Articles')}
<div style="margin:6px 10px 0" class="filt"><span class="rech" style="height:38px">${ic('search', 18)}<span>Rechercher…</span></span><span class="o" style="width:38px;height:38px">${ic('balance', 19)}</span></div>
${filtres(max)}
<div class="seg clair" style="margin:6px 10px 0;padding:2px"><span style="height:32px">Ingrédients</span><span class="on" style="height:32px">Autres stocks</span></div>`;
const CSS_COM = `.pl.ne{border-color:#7a5a2a;color:#5a3d12;gap:3px}.pl.ne b{color:#8a5212}.pl.dd b{color:#b4621a}.pl.plus{border-style:dashed;color:#333;font-weight:600;padding:0 8px}
.a3-ddm{color:#b4621a}`;

// ---------- A (froide) : l'étagère jumelle ----------
// Même mur que d2a : un rayon par rangée, une colonne par famille, un pot par article. Les unités diffèrent : la barre
// se lit contre le seuil (tiret à mi-hauteur) ; sans seuil, barre pâle à hauteur fixe. Sous chaque colonne, l'article
// le plus urgent de la famille (rouge épuisé, brun bas), sinon le compte. Toucher un rayon : ses articles dessous.
function barreA(a, r, w, bh) {
  if (ep(a)) return `<span class="b" style="width:${w}px"><i class="ep"></i></span>`;
  const h = a.s ? Math.max(3, niv(a) * bh) : bh * 0.6;
  return `<span class="b${a.c ? ' cpt' : ''}" style="width:${w}px"><i style="height:${Math.round(a.c ? bh * 0.45 : h)}px;background:${a.c ? 'transparent' : r.f};${a.s ? '' : 'opacity:.42'}"></i></span>`;
}
function piedA(g) {
  const pire = tous([g]).sort((x, y) => urg(x) - urg(y))[0];
  if (urg(pire) > 1) return `<span class="tot" style="color:#777">${g.l.length}</span>`;
  return `<span class="tot a3-p ${ep(pire) ? 'rouge' : 'brun'}">${pire.sh}</span>`;
}
function rayonA(r, o = {}) {
  const w = o.w ?? { add: 6, emb: 8, net: 10 }[r.k], bh = o.bh ?? 22;
  const gs = r.gs.map((g) => `<div class="g"><em style="color:${r.c}">${g.g}</em><div class="bars" style="height:${bh}px">${g.l.map((a) => barreA(a, r, w, bh)).join('')}</div>${piedA(g)}</div>`).join('');
  return `<div class="ray a3-r${o.actif ? ' actif' : ''}" style="--rc:${r.c}"><div class="rl"><b>${r.nom}</b><span class="rl2"><small class="mono">${n(r.gs)}</small>${o.leg ? '<span class="leg-q" aria-label="Légende">?</span>' : ''}</span></div><div class="rg a3-rg">${gs}</div></div>`;
}
const ligneA = (a, r) => `<div class="li${ep(a) ? ' z' : ''}"><span class="jauge${a.c ? ' cpt' : ''}"><i style="height:${Math.round(niv(a) * 100)}%;background:${r.f}"></i></span><div class="nm"><b>${a.n}</b><small>${etat(a)}</small></div>${a.ne ? `<span class="pil a3-ne">${ic('mug', 14)}NEIPA</span>` : `<span class="pil">${a.fam}</span>`}<span class="qt mono">${fq(a)}</span><span class="et">${ic('star', 20)}</span></div>`;
const CSS_A = `.a3-rg{gap:6px}.a3-r .bars{position:relative}.a3-r .bars::before{content:"";position:absolute;left:-3px;right:-3px;bottom:50%;border-top:1.5px dashed #7d7d75}
.a3-r .rl b{font-size:13.5px;letter-spacing:-.35px}.a3-r .g{min-width:0}.a3-r .g em{font-size:12.5px}.a3-p{max-width:100%;overflow:hidden;text-overflow:ellipsis;font-family:"Source Sans 3",system-ui;font-weight:600;letter-spacing:-.2px}
.a3-ne{border-color:#7a5a2a;color:#5a3d12;gap:2px;padding:1px 6px}.a3-b{display:flex;align-items:center;gap:6px;margin:4px 10px 0;padding:4px 0;border-bottom:2px solid var(--rc);font-size:15px}.a3-b .ech{margin-left:auto;font-size:13px;color:var(--mut)}`;
const ADDS = tous(ADD).sort((x, y) => urg(x) - urg(y));
const A390 = () => page('st3 A · étagère jumelle', `${entree(4)}<div class="mur">${rayonA(RAY[0], { actif: 1, leg: 1 })}${rayonA(RAY[1])}${rayonA(RAY[2])}</div>
<div class="a3-b" style="--rc:${RAY[0].c}"><span style="color:${RAY[0].c}">${ic('flask', 16)}</span><b>Additifs</b><span class="mono">30</span><span class="chip">${ic('sort', 14)} urgence</span><span class="ech">tiret = seuil</span></div>
${ADDS.slice(0, 7).map((a) => ligneA(a, RAY[0])).join('')}${fab()}${navBas()}`, '', CSS_D2 + CSS_D2A + CSS_COM + CSS_A);

// 1280 : les trois rayons côte à côte (comme d3a), les tables dessous ; Additifs sur deux colonnes, rangées par famille.
const barre1280 = () => `${onglets(['Articles', 'Recompter', 'Courses', 'Fûts', 'Matériel'], 'Articles')}<div class="barre"><span class="rech">${ic('search', 18)}<span>Rechercher : nom, fournisseur…</span></span><span class="o">${ic('balance', 20)}</span>${FILTRES.map(([, t, k, c]) => `<span class="pl ${c}">${t} <b>${k}</b></span>`).join('')}<span class="o">${ic('star', 18)}</span><span class="seg clair" style="margin-left:auto;width:300px"><span>Ingrédients</span><span class="on">Autres stocks</span></span></div>`;
const ligneTbA = (a, r) => `<tr><td>${a.n}${ep(a) ? ' <span class="rouge s">épuisé</span>' : a.c ? ' <span class="pt s">à compter</span>' : bas(a) ? ' <span class="brun s">bas</span>' : ''}${a.d ? ` <span class="a3-ddm s">DDM ${a.d}</span>` : ''}</td><td class="q">${fq(a)}</td><td style="width:34%"><span class="bar" style="background:${r.f}22"><i style="width:${Math.round(niv(a) * 100)}%;background:${r.f};${a.s ? '' : 'opacity:.42'}"></i>${a.s ? '<u style="left:50%"></u>' : ''}</span></td></tr>`;
const tableA = (gs, r, titre) => `<table class="tb"><tr><th>${titre}</th><th style="text-align:right">stock</th><th>jauge</th></tr>${gs.map((g) => `<tr class="fa"><td colspan="3" style="color:${r.c}">${g.g} <span class="mono">${g.l.length}</span></td></tr>${g.l.map((a) => ligneTbA(a, r)).join('')}`).join('')}</table>`;
const A1280 = () => page('st3 A 1280', `${tete1280()}${RAIL}<div class="zone">${barre1280()}
<div class="d3-col" style="grid-template-columns:1.75fr 1.4fr .85fr">
<div class="mur d3a-m">${rayonA(RAY[0], { w: 10, bh: 50, leg: 1 })}</div><div class="mur d3a-m">${rayonA(RAY[1], { w: 11, bh: 50 })}</div><div class="mur d3a-m">${rayonA(RAY[2], { w: 15, bh: 50 })}</div></div>
<div class="d3-col" style="grid-template-columns:1fr 1fr 1fr 1fr">
<div>${tableA(ADD.slice(0, 3), RAY[0], 'Additifs')}</div><div>${tableA(ADD.slice(3), RAY[0], '&nbsp;')}</div><div>${tableA(EMB, RAY[1], 'Emballage')}</div><div>${tableA(NET, RAY[2], 'Nettoyage')}</div>
</div></div>${fab()}`, 'l1280', CSS_1280 + CSS_COM + CSS_A + `.d3a-m{margin:0}.d3a-m .ray{min-height:84px;border-bottom:0}.d3a-m .g em{line-height:15px;font-size:13px}.d3a-m .tot{font-size:14px;line-height:17px}.d3a-m .a3-rg{gap:12px}
.tb{font-size:14px}.tb td{padding:2px 6px;height:24px}.tb td.q{font-size:14px}.tb tr.fa td{font-weight:700;font-size:13px;padding-top:6px;border-bottom:1px solid var(--line2)}.tb .s{font-size:13px}.tb th{padding:2px 6px}
.tb .bar{height:12px}.tb .bar u{border-left-color:#444}.pl{height:30px}`);

// ---------- B (tiède) : le casier nommé ----------
// Un rayon ouvert = son casier : une colonne par famille, chaque article à son nom, sa quantité et sa jauge (tiret =
// seuil). Un rayon replié tient sur une ligne : ses pots en miniature et ce qui manque, en mots. 30 additifs à 390 sans
// défiler ; rien à toucher pour lire un nom.
const celluleB = (a, r, o = {}) => `<div class="b3-c${ep(a) ? ' z' : ''}${bas(a) ? ' bas' : ''}"><span class="b3-j${a.s ? ' s' : ''}${a.c ? ' cpt' : ''}"><i style="height:${Math.round(niv(a) * 100)}%;background:${r.f};${a.s ? '' : 'opacity:.42'}"></i></span><span class="b3-t"><b>${a.sh}</b><small class="mono">${a.d ? `<span class="a3-ddm">⌛</span>` : ''}${fq(a)}${a.ne ? `<span class="b3-ne">${ic('mug', 12)}</span>` : ''}</small>${o.seuil ? `<small class="b3-x">${a.s ? 'seuil ' + fs_(a) : a.d ? 'DDM ' + a.d : 'sans seuil'}</small>` : ''}</span></div>`;
const resume = (gs) => { const t = tous(gs), e = t.filter(ep).length, b = t.filter(bas).length, d = t.filter((a) => a.d).length; return [e && `<span class="rouge">${e} épuisé${e > 1 ? 's' : ''}</span>`, b && `<span class="brun">${b} bas</span>`, d && `<span class="a3-ddm">${d} DDM</span>`].filter(Boolean).join(' · '); };
const casierB = (r, o = {}) => `<section class="b3-r" style="--rc:${r.c}"><header><span class="b3-pi">${ic(r.p, 17)}</span><b>${r.nom}</b><span class="mono b3-n">${n(r.gs)}</span><span class="b3-s">${resume(r.gs)}</span><span class="b3-ch">${ic('chevD', 18)}</span></header>
<div class="b3-g" style="grid-template-columns:${o.cols ?? `repeat(${r.gs.length},minmax(0,1fr))`}">${r.gs.map((g) => `<div class="b3-col"><em>${g.p && o.pic ? ic(g.p, 13) : ''}${g.g}</em>${g.l.map((a) => celluleB(a, r, o)).join('')}</div>`).join('')}</div></section>`;
const replieB = (r) => { const manque = tous(r.gs).filter((a) => urg(a) < 2).sort((x, y) => urg(x) - urg(y)); return `<section class="b3-r ferme" style="--rc:${r.c}"><header><span class="b3-pi">${ic(r.p, 17)}</span><b>${r.nom}</b><span class="mono b3-n">${n(r.gs)}</span><span class="b3-mini">${r.gs.map((g) => `<span>${g.l.map((a) => `<i class="${ep(a) ? 'z' : ''}" style="height:${ep(a) ? 7 : Math.max(3, Math.round(niv(a) * 16))}px;background:${ep(a) ? '#fff' : r.f};${a.s ? '' : 'opacity:.45'}"></i>`).join('')}</span>`).join('')}</span><span class="b3-ch" style="transform:none">${ic('chevD', 18)}</span></header>
<div class="b3-m">${manque.map((a) => `<span class="${ep(a) ? 'rouge' : 'brun'}">${a.sh} <span class="mono">${fq(a)}</span></span>`).join('<i>·</i>')}</div></section>`; };
const CSS_B = `.b3-r{margin:6px 10px 0;background:var(--mur);border-radius:10px;border-left:4px solid var(--rc);overflow:hidden}
.b3-r header{display:flex;align-items:center;gap:6px;padding:5px 6px 3px 8px;font-size:15px}.b3-r header b{color:var(--ink)}.b3-pi{color:var(--rc);display:grid}.b3-n{font-size:13px;color:var(--mut)}
.b3-s{margin-left:auto;font-size:13px;white-space:nowrap}.b3-ch{color:#555;display:grid;transform:rotate(180deg)}
.b3-g{display:grid;gap:0 4px;padding:0 6px 5px 6px}.b3-col{display:flex;flex-direction:column;min-width:0}
.b3-col em{font-style:normal;font-weight:700;font-size:12.5px;color:var(--rc);border-bottom:2px solid #9c8a6b;line-height:15px;padding-bottom:1px;margin-bottom:1px;white-space:nowrap;display:flex;align-items:center;gap:2px}
.b3-c{display:flex;gap:4px;align-items:center;height:31px;min-width:0;border-bottom:1px solid #ebe7dd}.b3-c:last-child{border-bottom:0}
.b3-j{width:7px;height:24px;border:1.3px solid #8b7a5a;border-radius:1.5px;display:flex;align-items:flex-end;position:relative;flex:none;background:#fff}
.b3-j i{display:block;width:100%}.b3-j.s::after{content:"";position:absolute;left:-3px;right:-3px;top:50%;border-top:1.5px dashed #444}
.b3-j.cpt{border-style:dotted;border-width:1.5px}.b3-c.z .b3-j{border:1.5px solid var(--rouge)}
.b3-t{min-width:0;display:flex;flex-direction:column}.b3-t b{font-size:13px;font-weight:500;letter-spacing:-.35px;line-height:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--ink)}
.b3-t small{font-size:12.5px;line-height:14px;color:#333;white-space:nowrap;display:flex;align-items:center;gap:1px}
.b3-c.z b,.b3-c.z small{color:var(--rouge)}.b3-c.bas small{color:var(--brun);font-weight:600}.b3-ne{color:#8a5212;display:grid;margin-left:2px}
.b3-r.ferme header{padding-bottom:2px}.b3-mini{display:flex;align-items:flex-end;gap:6px;margin-left:auto;height:18px;border-bottom:1.5px solid #9c8a6b;padding:0 2px}
.b3-mini span{display:flex;align-items:flex-end;gap:1.5px}.b3-mini i{display:block;width:5px;border-radius:1px 1px 0 0}.b3-mini i.z{border:1.3px solid var(--rouge);width:6px}
.b3-m{padding:0 8px 6px 31px;font-size:14px;display:flex;flex-wrap:wrap;gap:0 5px}.b3-m>i{color:#aaa;font-style:normal}`;
const B390 = () => page('st3 B · casier nommé', `${entree(4)}${casierB(RAY[0], { cols: 'minmax(0,.86fr) minmax(0,.9fr) minmax(0,1.06fr) minmax(0,1.12fr) minmax(0,1.06fr)' })}${casierB(RAY[1])}${replieB(RAY[2])}${fab()}${navBas()}`, '', CSS_D2 + CSS_COM + CSS_B);

const B1280 = () => page('st3 B 1280', `${tete1280()}${RAIL}<div class="zone">${barre1280()}
<div class="b3-l">${casierB(RAY[0], { seuil: 1, pic: 1 })}<div>${casierB(RAY[1], { seuil: 1, pic: 1 })}${casierB(RAY[2], { seuil: 1, pic: 1 })}</div></div></div>${fab()}`, 'l1280', CSS_1280 + CSS_COM + CSS_B + `.pl{height:30px}
.b3-l{display:grid;grid-template-columns:1.45fr 1fr;gap:12px;margin-top:8px;align-items:start}.b3-l .b3-r{margin:0 0 10px}
.l1280 .b3-r header{font-size:17px;padding:7px 10px 5px}.l1280 .b3-s{font-size:14px}.l1280 .b3-g{gap:0 14px;padding:0 10px 8px}
.l1280 .b3-c{height:54px;gap:7px}.l1280 .b3-j{width:10px;height:42px}.l1280 .b3-t b{font-size:14.5px;line-height:17px;letter-spacing:-.2px}.b3-x{color:var(--mut)!important;font-weight:400!important;font-family:"Source Sans 3",system-ui;font-size:13px!important}.l1280 .b3-t small{font-size:14px;line-height:17px}.l1280 .b3-col em{font-size:14px;line-height:18px}`);

// ---------- C (chaude) : le tableau périodique ----------
// Un article = une case à symbole, comme le tableau de Mendeleïev ; une colonne par famille ; la case se remplit
// avec le stock (tiret = seuil), rouge vide = épuisé, coin orange = DDM proche, pointillé = à compter. Les 55 articles
// d'un coup d'œil ; la case touchée s'ouvre à droite (nom, stock, seuil, ce qui en dépend, Commander).
const caseC = (a, r, o = {}) => `<div class="c3-t${ep(a) ? ' z' : ''}${bas(a) ? ' bas' : ''}${a.s ? ' s' : ''}${a.c ? ' cpt' : ''}${a.d ? ' dd' : ''}${o.sel === a.n ? ' sel' : ''}" style="--rf:${r.f};--rc:${r.c}"><u class="c3-k"></u><i class="c3-f" style="height:${Math.round(niv(a) * 100)}%;${a.s ? '' : 'opacity:.18'}"></i><b>${a.sy}</b>${o.nom ? `<em>${a.sh}</em>` : ''}<span class="mono">${o.nom ? fq(a) : fq(a, true)}</span></div>`;
const blocC = (r, o = {}) => `<div class="c3-b" style="--rc:${r.c}"><div class="c3-bt"><span style="color:${r.c};display:grid">${ic(r.p, 15)}</span><b>${r.nom}</b><span class="mono">${n(r.gs)}</span>${o.leg ? '<span class="leg-q" aria-label="Légende">?</span>' : ''}</div><div class="c3-cols">${r.gs.map((g) => `<div class="c3-col"><em title="${g.g}">${g.p ? ic(g.p, 15) : g.g}</em>${g.l.map((a) => caseC(a, r, o)).join('')}</div>`).join('')}</div></div>`;
const LACT = ADD[1].l[0];
const detailC = (grand) => grand ? `<div class="c3-d"><div class="c3-dh">${caseC(LACT, RAY[0], { nom: 1 })}<div><b>Acide lactique 80 %</b><small>Additifs · Acides</small></div></div>
<div class="c3-dl"><span class="rouge">épuisé</span><span class="mono">0 / seuil 250${NB}ml</span></div><div class="c3-dl brun">${ic('mug', 14)} manque pour NEIPA 28.11 · 40${NB}ml</div><div class="c3-dl" style="color:#555">dernier achat 18.09 · 250${NB}ml · 9,80 CHF</div>
<div class="c3-da"><span class="c3-cmd">${ic('cart', 16)} Commander</span><span class="chip">Fiche ${ic('chevR', 14)}</span></div></div>`
  : `<div class="c3-d pt3"><b>Acide lactique 80 %</b><div class="c3-dl"><span class="rouge">épuisé</span> · seuil 250${NB}ml</div><div class="c3-dl brun">${ic('mug', 14)} NEIPA 28.11 : 40${NB}ml</div><div class="c3-da"><span class="c3-cmd">${ic('cart', 16)} Commander</span><span class="o" style="width:34px;height:34px">${ic('chevR', 16)}</span></div></div>`;
const CSS_C = `.c3-b{display:flex;flex-direction:column}.c3-bt{display:flex;align-items:center;gap:4px;font-size:14px;padding:0 0 2px;white-space:nowrap}.c3-bt b{color:var(--ink)}.c3-bt .mono{font-size:13px;color:var(--mut)}.c3-bt .leg-q{margin-left:2px}
.c3-cols{display:flex;gap:3px;border-top:3px solid var(--rc);padding-top:2px}.c3-col{display:flex;flex-direction:column;gap:3px;width:38px}
.c3-col em{font-style:normal;font-weight:700;font-size:12px;letter-spacing:-.4px;color:var(--rc);text-align:center;height:16px;line-height:16px;white-space:nowrap;display:flex;justify-content:center;align-items:center}
.c3-t{position:relative;width:38px;height:38px;border:1.5px solid var(--rc);border-radius:5px;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;flex:none}
.c3-f{position:absolute;left:0;right:0;bottom:0;background:var(--rf);opacity:.42}
.c3-k{display:none}.c3-t.s .c3-k{display:block;position:absolute;left:0;right:0;bottom:50%;height:0}.c3-k::before,.c3-k::after{content:"";position:absolute;top:-1px;width:5px;border-top:2px solid #555}.c3-k::before{left:0}.c3-k::after{right:0}
.c3-t b{position:relative;font:700 15px/15px "Source Sans 3",system-ui;color:var(--ink)}.c3-t span{position:relative;font-size:12px;line-height:13px;color:#222}
.c3-t em{position:relative;font-style:normal;font-size:12.5px;line-height:14px;color:#333;max-width:92%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.c3-t.z{border:2px solid var(--rouge);background:#fff}.c3-t.z b,.c3-t.z span{color:var(--rouge)}.c3-t.bas span{color:var(--brun);font-weight:600}
.c3-t.dd::before{content:"";position:absolute;right:0;top:0;border-style:solid;border-width:0 10px 10px 0;border-color:transparent #d9822b transparent transparent}
.c3-t.cpt{border-style:dotted;border-width:2px}.c3-t.sel{outline:3px solid #111;outline-offset:1px}
.c3-d{border:1.5px solid #111;border-radius:12px;padding:7px 8px;background:#fff;display:flex;flex-direction:column;gap:4px;box-shadow:0 4px 14px rgba(0,0,0,.1)}
.c3-dh{display:flex;gap:7px;align-items:center}.c3-dh>div:last-child{display:flex;flex-direction:column;min-width:0}.c3-dh b{font-size:15px;line-height:17px;color:var(--ink)}.c3-dh small{font-size:13px;color:var(--mut)}
.c3-dl{font-size:13.5px;line-height:17px;display:flex;flex-wrap:wrap;gap:0 6px;align-items:center}.c3-da{display:flex;gap:6px;align-items:center;margin-top:2px}
.c3-cmd{display:inline-flex;align-items:center;gap:4px;height:34px;padding:0 10px;border-radius:999px;background:#111;color:#fff;font-size:14px;font-weight:600;white-space:nowrap}`;
const AGIR = TOUT.filter((a) => urg(a) < 3).sort((x, y) => urg(x) - urg(y));
const C390 = () => page('st3 C · tableau périodique', `${entree(4)}
<div class="c3-p"><div class="c3-gc">${blocC(RAY[0], { sel: LACT.n, leg: 1 })}${blocC(RAY[1])}</div>
<div class="c3-dc">${blocC(RAY[2])}${detailC(false)}<div class="c3-ag c3-ag3"><b>À agir <span class="mono">${AGIR.length}</span></b>${AGIR.slice(1, 7).map((a) => `<div><span class="${ep(a) ? 'rouge' : bas(a) ? 'brun' : 'a3-ddm'}">${a.sh}</span><span class="mono">${ep(a) ? '0' : a.d ? a.d : fq(a)}</span></div>`).join('')}</div></div></div>${fab()}${navBas()}`, '', CSS_D2 + CSS_COM + CSS_C + `.c3-p{margin:6px 10px 0;background:var(--mur);border-radius:10px;padding:5px 6px 7px}
.c3-p{display:flex;gap:10px;align-items:flex-start}.c3-gc,.c3-dc{display:flex;flex-direction:column;gap:7px}.c3-dc{flex:1;min-width:0}
.c3-col{width:35px}.c3-t{width:35px;height:34px}.c3-col,.c3-cols{gap:3px}.c3-col em{height:15px;line-height:15px}.c3-gc,.c3-dc{gap:5px}.c3-p{padding:4px 6px 4px}.c3-bt{padding:0}
.c3-d.pt3{padding:6px 7px;gap:3px}.c3-d.pt3>b{font-size:14.5px;line-height:17px;color:var(--ink)}.c3-d.pt3 .c3-dl{font-size:13px;line-height:16px}.c3-d.pt3 .c3-cmd{height:32px;padding:0 8px;font-size:13.5px}
.c3-ag{display:flex;flex-direction:column;font-size:14px}.c3-ag b{font-size:14px;padding-bottom:2px;border-bottom:2px solid #9c8a6b;color:var(--ink)}
.c3-ag div{display:flex;justify-content:space-between;gap:6px;padding:2px 0;border-bottom:1px solid var(--line);line-height:17px}.c3-ag .mono{font-size:13px;color:#333}`);

const C1280 = () => page('st3 C 1280', `${tete1280()}${RAIL}<div class="zone">${barre1280()}
<div class="c3-g">${blocC(RAY[0], { nom: 1, sel: LACT.n, leg: 1 })}${blocC(RAY[1], { nom: 1 })}${blocC(RAY[2], { nom: 1 })}
<div class="c3-side">${detailC(true)}<div class="c3-ag"><b>À agir <span class="mono">${AGIR.length}</span></b>${AGIR.slice(0, 11).map((a) => `<div><span class="${ep(a) ? 'rouge' : bas(a) ? 'brun' : 'a3-ddm'}">${a.n}</span><span class="mono">${ep(a) ? '0' : a.d ? 'DDM ' + a.d : fq(a)}</span></div>`).join('')}</div></div></div></div>${fab()}`, 'l1280', CSS_1280 + CSS_COM + CSS_C + `.pl{height:30px}
.c3-g{display:flex;gap:22px;margin-top:10px;background:var(--mur);border-radius:12px;padding:10px 12px;align-items:flex-start}
.c3-col{width:64px;gap:4px}.c3-cols{gap:4px}.c3-t{width:64px;height:64px;gap:1px}.c3-t b{font-size:20px;line-height:20px}.c3-t span{font-size:13px;line-height:15px}.c3-col em{font-size:13px;height:20px}
.c3-bt{font-size:16px;gap:6px;padding-bottom:4px}.c3-side{margin-left:auto;width:250px;display:flex;flex-direction:column;gap:10px}
.c3-dh .c3-t{width:64px;height:64px}.c3-ag{display:flex;flex-direction:column;font-size:14px}.c3-ag b{font-size:15px;padding-bottom:3px;border-bottom:2px solid #9c8a6b;color:var(--ink)}
.c3-ag div{display:flex;justify-content:space-between;gap:6px;padding:3px 0;border-bottom:1px solid var(--line)}.c3-ag .mono{font-size:13px;color:#333}`);

const V = { 'a-390': A390, 'a-1280': A1280, 'b-390': B390, 'b-1280': B1280, 'c-390': C390, 'c-1280': C1280 };
for (const [id, f] of Object.entries(V)) fs.writeFileSync(path.join(ICI, `st3-${id}.html`), f());
console.log(`${Object.keys(V).length} pages · additifs ${n(ADD)} · emballage ${n(EMB)} · nettoyage ${n(NET)} · filtres ${FILTRES.map((f) => f[0] + ' ' + f[2]).join(', ')}`);
