// node st3-build.mjs : écrit st3-<version>-<390|1280>[-état].html, axe D4 refait (Autres stocks), 22.11.
// Son refus de d4b : « SI j'ai 30 additif différents ? Non je veux qqch de compact comme le reste ».
// Base : son étagère choisie (d2a à 390, d3b légende, d3a à 1280 ; D420). Décor et en-tête repris de st1-build.mjs
// (lu tel quel, sans copie) ; classes neuves préfixées a3-, b3-, c3-, x3- (L26).
// Données : 30 additifs, 15 emballages, 10 produits de nettoyage, noms et unités plausibles, aucun chiffre réel.
// Versions : a (froide) étagère jumelle ; b (tiède) casier nommé, rayons repliables ; c (chaude) tableau périodique.
// Filtres : dynamiques, comptés sur Autres stocks, zéros cachés, les plus utiles d'abord, une seule ligne (sa note du 22.11).
// Tour 2 (CRITIQUE-D4.md) : « Levure · enzymes » ; sans seuil, la jauge se lit contre le plus gros article de la famille
// (même unité), jamais une hauteur fixe ; A retouches 1 à 5 et greffes ; B 1 à 5 ; C 1 à 6 ; un état touché par version.
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
// sy : symbole du tableau de C (lettres seulement ; formule vraie pour les sels qui en ont une connue du brasseur).
const ADD = [
  { g: 'Sels', l: [{ n: 'Gypse', sh: 'Gypse', sy: 'Gy', q: 500, u: 'g', s: 250 }, { n: 'Chlorure de calcium', sh: 'Chlorure', sy: 'CaCl', q: 400, u: 'g', s: 200 }, { n: "Sel d'Epsom", sh: 'Epsom', sy: 'Ep', q: 250, u: 'g' }, { n: 'Sel de table', sh: 'Sel', sy: 'NaCl', q: 300, u: 'g' }, { n: 'Bicarbonate de sodium', sh: 'Bicarb.', sy: 'Bic', q: 0, u: 'g', s: 100 }, { n: 'Craie', sh: 'Craie', sy: 'Cr', q: 150, u: 'g' }, { n: 'Chaux éteinte', sh: 'Chaux', sy: 'Ch', q: 80, u: 'g', s: 100 }] },
  { g: 'Acides', l: [{ n: 'Acide lactique 80 %', sh: 'Lactique', sy: 'La', q: 0, u: 'ml', s: 250, ne: 1 }, { n: 'Acide phosphorique 75 %', sh: 'Ac. phosph.', sy: 'Ph', q: 350, u: 'ml', s: 200 }, { n: 'Acide citrique', sh: 'Citrique', sy: 'Ci', q: 120, u: 'g' }] },
  { g: 'Clarif.', l: [{ n: 'Mousse irlandaise', sh: 'Mousse irl.', sy: 'Mi', q: 80, u: 'g', s: 100 }, { n: 'Whirlfloc (comprimés)', sh: 'Whirlfloc', sy: 'Wf', q: 18, u: 'pc', s: 10 }, { n: 'Gélatine', sh: 'Gélatine', sy: 'Gé', q: 0, u: 'g' }, { n: 'Biofine Clear', sh: 'Biofine', sy: 'Bf', q: 200, u: 'ml', d: '12.26' }, { n: 'Polyclar', sh: 'Polyclar', sy: 'Pc', q: 100, u: 'g' }, { n: 'Protofloc', sh: 'Protofloc', sy: 'Pf', q: 40, u: 'g' }, { n: 'Fermcap S', sh: 'Fermcap', sy: 'Fc', q: 25, u: 'ml' }] },
  { g: 'Levure · enzymes', gc: 'Lev. · enz.', l: [{ n: 'Nutriment levure', sh: 'Nutriment', sy: 'Nu', q: 50, u: 'g', s: 30 }, { n: 'Servomyces (capsules)', sh: 'Servomyces', sy: 'Sv', q: 10, u: 'pc' }, { n: 'Zinc', sh: 'Zinc', sy: 'Zn', q: 0, u: 'g' }, { n: 'Brewers Clarex', sh: 'Clarex', sy: 'Cx', q: 10, u: 'ml' }, { n: 'Glucoamylase', sh: 'Glucoamyl.', sy: 'Gl', q: 20, u: 'ml', d: '12.26' }, { n: 'Alpha-amylase', sh: 'α-amylase', sy: 'Aa', q: 15, u: 'ml' }] },
  { g: 'Épices', l: [{ n: 'Coriandre', sh: 'Coriandre', sy: 'Co', q: 40, u: 'g', s: 60 }, { n: "Écorce d'orange amère", sh: 'Orange am.', sy: 'Or', q: 200, u: 'g' }, { n: 'Vanille (gousses)', sh: 'Vanille', sy: 'Va', q: 3, u: 'pc', c: 1 }, { n: 'Éclats de cacao', sh: 'Cacao', sy: 'Cc', q: 0, u: 'g' }, { n: 'Fève tonka', sh: 'Tonka', sy: 'Tk', q: 6, u: 'pc' }, { n: 'Sel de Gose', sh: 'Sel gose', sy: 'Sg', q: 500, u: 'g' }, { n: 'Gingembre séché', sh: 'Gingembre', sy: 'Gi', q: 50, u: 'g' }] },
];
const EMB = [
  { g: 'Bouteilles', p: 'bottle', l: [{ n: 'Bouteille 33 cl brune', sh: '33 cl', sy: 'Bo', q: 200, u: 'pc', s: 300, ne: 1 }, { n: 'Bouteille 75 cl', sh: '75 cl', sy: 'Bo', q: 48, u: 'pc' }, { n: 'Bouteille 50 cl', sh: '50 cl', sy: 'Bo', q: 0, u: 'pc' }] },
  { g: 'Canettes', p: 'can', l: [{ n: 'Canette 44 cl', sh: '44 cl', sy: 'Cn', q: 96, u: 'pc', s: 48 }, { n: 'Couvercle 44 cl', sh: 'Couvercle', sy: 'Cv', q: 120, u: 'pc' }] },
  { g: 'Capsules', p: 'cap', l: [{ n: 'Capsule 26 mm or', sh: '26 or', sy: 'Cp', q: 850, u: 'pc', s: 300 }, { n: 'Capsule 26 mm noire', sh: '26 noire', sy: 'Cp', q: 400, u: 'pc' }, { n: 'Capsule 29 mm', sh: '29 mm', sy: 'Cp', q: 60, u: 'pc' }] },
  { g: 'Étiquettes', p: 'label', l: [{ n: 'Étiquette IPA', sh: 'IPA', sy: 'Et', q: 0, u: 'pc', s: 100 }, { n: 'Étiquette NEIPA', sh: 'NEIPA', sy: 'Et', q: 140, u: 'pc', s: 200, ne: 1 }, { n: 'Étiquette Stout', sh: 'Stout', sy: 'Et', q: 60, u: 'pc' }, { n: 'Étiquette Saison', sh: 'Saison', sy: 'Et', q: 35, u: 'pc' }, { n: 'Étiquette Gose', sh: 'Gose', sy: 'Et', q: 12, u: 'pc', s: 50 }] },
  { g: 'Cartons', p: 'carton', l: [{ n: 'Carton 6 × 33 cl', sh: '6×33', sy: 'Ct', q: 40, u: 'pc' }, { n: 'Carton 24 × 33 cl', sh: '24×33', sy: 'Ct', q: 8, u: 'pc' }] },
];
const NET = [
  { g: 'Acides', l: [{ n: 'Acide peracétique', sh: 'Peracét.', sy: 'Pa', q: 1.5, u: 'L', s: 2 }, { n: 'Star San', sh: 'Star San', sy: 'SS', q: 0.8, u: 'L' }, { n: 'Détartrant acide', sh: 'Détartrant', sy: 'Dt', q: 0, u: 'L' }] },
  { g: 'Alcalins', l: [{ n: 'Soude caustique', sh: 'Soude', sy: 'So', q: 2, u: 'kg' }, { n: 'PBW', sh: 'PBW', sy: 'PBW', q: 0.4, u: 'kg', s: 1 }, { n: 'Chlore actif', sh: 'Chlore', sy: 'Cl', q: 5, u: 'L' }] },
  { g: 'Conso.', l: [{ n: 'Gants nitrile', sh: 'Gants', sy: 'Gn', q: 60, u: 'pc', s: 50 }, { n: 'Éponges', sh: 'Éponges', sy: 'Ép', q: 4, u: 'pc' }, { n: 'Joints tri-clamp', sh: 'Joints TC', sy: 'Jt', q: 12, u: 'pc' }, { n: 'Filtres à manche', sh: 'Filtres', sy: 'Fi', q: 3, u: 'pc' }] },
];
// Sans seuil : la jauge se lit contre le plus gros article de sa famille, même unité (critique D4, A5 et C5).
for (const gs of [ADD, EMB, NET]) for (const g of gs) for (const a of g.l) if (!a.s) a.mx = Math.max(1, ...g.l.filter((b) => b.u === a.u).map((b) => b.q));
// Couleur et forme par famille, comme les couleurs EBC et les sachets de son étagère : la famille se lit sans texte
// (son ajout du 22.11 : « Tu peux aussi utiliser, couleur et forme pour les stock autre »).
const FX = { add: [['#8e9fb3', 'grain'], ['#d4a020', 'flacon'], ['#3f9c96', 'goutte'], ['#a8814c', 'sachet'], ['#b5482b', 'hach']], emb: [['#6b4423', 'bouteille'], ['#8d969e', 'canette'], ['#c49a1c', 'disque'], ['#3e6fb0', 'etiq'], ['#b58a55', 'carton']], net: [['#c2ab14', 'flacon'], ['#7a5aa8', 'bidon'], ['#6d8a72', 'droit']] };
[[ADD, 'add'], [EMB, 'emb'], [NET, 'net']].forEach(([gs, k]) => gs.forEach((g, i) => { g.fx = FX[k][i]; g.l.forEach((a) => { a.fx = g.fx; }); }));
const fxs = (a, op = '') => `background-color:${a.fx[0]};${op}`;
const SH = ':is(.b,.b3-j,.jauge,.b3-mini) i';
const CSS_FX = `.fx-grain{background-image:radial-gradient(rgba(255,255,255,.95) .9px,transparent 1.3px);background-size:3.5px 3.5px}
.fx-sachet{background-image:repeating-linear-gradient(0deg,transparent 0 4px,rgba(255,255,255,.9) 4px 5.2px)}.fx-hach{background-image:repeating-linear-gradient(45deg,transparent 0 2px,rgba(255,255,255,.65) 2px 3.5px)}
.fx-disque{background-image:repeating-linear-gradient(0deg,transparent 0 2.2px,rgba(0,0,0,.3) 2.2px 3.2px)}.fx-etiq{background-image:linear-gradient(0deg,transparent 34%,rgba(255,255,255,.85) 34% 56%,transparent 56%)}
.fx-carton{background-image:linear-gradient(to top right,transparent 45%,rgba(0,0,0,.32) 46% 54%,transparent 55%)}
${SH}.fx-flacon{clip-path:polygon(30% 0,70% 0,70% 12%,100% 28%,100% 100%,0 100%,0 28%,30% 12%)}
${SH}.fx-bouteille{clip-path:polygon(36% 0,64% 0,64% 24%,100% 40%,100% 100%,0 100%,0 40%,36% 24%)}
${SH}.fx-goutte{border-radius:50% 50% 2px 2px/30% 30% 2px 2px}
${SH}.fx-canette{border-radius:3px 3px 1px 1px;box-shadow:inset 0 2px 0 rgba(0,0,0,.4)}
${SH}.fx-bidon{clip-path:polygon(0 12%,58% 12%,58% 0,94% 0,94% 7%,100% 12%,100% 100%,0 100%)}`;
const RAY = [
  { k: 'add', nom: 'Additifs', gs: ADD, c: '#3f74a3', f: '#5b8db8', p: 'flask' },
  { k: 'emb', nom: 'Emballage', gs: EMB, c: '#b8692e', f: '#d08a4a', p: 'bottle' },
  { k: 'net', nom: 'Nettoyage', gs: NET, c: '#25786f', f: '#3c9a8f', p: 'spray' },
];
const gl = (g, court) => (court && g.gc) || g.g;
const tous = (gs) => gs.flatMap((g) => g.l.map((a) => ({ ...a, fam: g.g, famc: g.gc })));
const n = (gs) => tous(gs).length;
const ep = (a) => !a.q;
const bas = (a) => a.q && a.s && a.q < a.s;
const fq = (a, nu = false) => (!a.q ? '0' : a.u === 'pc' ? fr(a.q) : a.u === 'g' && a.q >= 1000 ? `${fr(a.q / 1000)}${NB}kg` : nu ? fr(a.q) : `${fr(a.q)}${NB}${a.u}`);
const fs_ = (a) => (a.u === 'pc' ? `${a.s}` : `${fr(a.s)}${NB}${a.u}`);
const niv = (a) => (!a.q ? 0 : a.s ? Math.min(1, a.q / (2 * a.s)) : Math.max(0.12, (0.9 * a.q) / a.mx)); // le seuil tombe à mi-hauteur
const TOUT = RAY.flatMap((r) => tous(r.gs));
const NEP = TOUT.filter(ep).length, NBAS = TOUT.filter(bas).length, NDDM = TOUT.filter((a) => a.d).length, NCPT = TOUT.filter((a) => a.c).length, NNE = TOUT.filter((a) => a.ne).length;
const urg = (a) => (ep(a) ? 0 : bas(a) ? 1 : a.d ? 2 : a.c ? 3 : 4);
const ddm = (a) => `<span class="a3-ddm">⌛${NB}DDM ${a.d}</span>`;
const etat = (a) => (ep(a) ? '<span class="rouge">épuisé</span>' : a.c ? '<span class="pt">à compter</span>' : a.s ? (bas(a) ? `<span class="brun">bas · seuil ${fs_(a)}</span>` : `assez · seuil ${fs_(a)}`) : 'sans seuil') + (a.d ? ` · ${ddm(a)}` : '');
const LACT = ADD[1].l[0];
const enMots = (gs) => tous(gs).filter((a) => urg(a) < 2).sort((x, y) => urg(x) - urg(y)).map((a) => `<span class="${ep(a) ? 'rouge' : 'brun'}">${a.sh} <span class="mono">${fq(a)}</span></span>`).join('<i>·</i>');
const AGIR = TOUT.filter((a) => urg(a) < 3).sort((x, y) => urg(x) - urg(y));

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
.a3-ddm{color:#b4621a}.x3-cmd{display:inline-flex;align-items:center;gap:4px;height:36px;padding:0 12px;border-radius:999px;background:#111;color:#fff;font-size:14px;font-weight:600;white-space:nowrap}`;
const barre1280 = () => `${onglets(['Articles', 'Recompter', 'Courses', 'Fûts', 'Matériel'], 'Articles')}<div class="barre"><span class="rech">${ic('search', 18)}<span>Rechercher : nom, fournisseur…</span></span><span class="o">${ic('balance', 20)}</span>${FILTRES.map(([, t, k, c]) => `<span class="pl ${c}">${t} <b>${k}</b></span>`).join('')}<span class="o">${ic('star', 18)}</span><span class="seg clair" style="margin-left:auto;width:300px"><span>Ingrédients</span><span class="on">Autres stocks</span></span></div>`;

// ---------- A (froide) : l'étagère jumelle ----------
// Même mur que d2a : un rayon par rangée, une colonne par famille, un pot par article. La barre se lit contre le seuil
// (tiret à mi-hauteur) ; sans seuil, barre pâle contre le plus gros de la famille. Point orange = DDM proche. Sous chaque
// colonne, l'article le plus urgent (rouge épuisé, brun bas), sinon le compte ; Nettoyage : ce qui manque, en mots (greffe B).
function barreA(a, r, w, bh) {
  if (ep(a)) return `<span class="b" style="width:${w}px"><i class="ep"></i></span>`;
  const h = Math.round(a.c ? bh * 0.45 : Math.max(3, niv(a) * bh));
  return `<span class="b${a.c ? ' cpt' : ''}" style="width:${w}px"><i class="fx-${a.fx[1]}" style="height:${h}px;${a.c ? 'background:transparent;' : fxs(a)}${a.s ? '' : 'opacity:.5'}"></i>${a.d ? `<u class="a3-dd" style="bottom:${Math.max(1, h - 7)}px"></u>` : ''}</span>`;
}
function piedA(g) {
  const pire = tous([g]).sort((x, y) => urg(x) - urg(y))[0];
  if (urg(pire) > 1) return `<span class="tot" style="color:#777">${g.l.length}</span>`;
  return `<span class="tot a3-p ${ep(pire) ? 'rouge' : 'brun'}">${pire.sh}</span>`;
}
function rayonA(r, o = {}) {
  const w = o.w ?? { add: 6, emb: 8, net: 10 }[r.k], bh = o.bh ?? 22;
  const gs = r.gs.map((g) => `<div class="g"><em style="color:${r.c}">${gl(g, o.court)}</em><div class="bars" style="height:${bh}px">${g.l.map((a) => barreA(a, r, w, bh)).join('')}</div>${o.mots ? '' : piedA(g)}</div>`).join('');
  const rg = `<div class="rg a3-rg">${gs}</div>`;
  return `<div class="ray a3-r${o.actif ? ' actif' : ''}" style="--rc:${r.c}"><div class="rl"><b>${r.nom}</b><span class="rl2"><small class="mono">${n(r.gs)}</small>${o.leg ? '<span class="leg-q" aria-label="Légende">?</span>' : ''}</span></div>${o.mots ? `<div class="a3-rw">${rg}<div class="a3-m">${enMots(r.gs)}</div></div>` : rg}</div>`;
}
const ligneA = (a, r, o = {}) => `<div class="li${ep(a) ? ' z' : ''}${o.ouvert ? ' a3-sel' : ''}"><span class="jauge${a.c ? ' cpt' : ''}${a.s ? ' a3-js' : ''}"><i class="fx-${a.fx[1]}" style="height:${Math.round(niv(a) * 100)}%;${fxs(a, a.s ? '' : 'opacity:.55')}"></i></span><div class="nm"><b>${a.n}</b><small>${etat(a)}${a.ne ? ` · <span class="a3-nep">${ic('mug', 14)}NEIPA 28.11</span>` : ''}</small></div><span class="pil">${a.famc ?? a.fam}</span><span class="qt mono">${fq(a)}</span><span class="et">${o.ouvert ? ic('chevD', 20) : ic('star', 20)}</span></div>`;
const ouvertA = `<div class="a3-o"><div class="brun">${ic('mug', 15)} manque pour NEIPA 28.11 · 40${NB}ml</div><div class="a3-om">dernier achat 18.09 · 250${NB}ml · 9,80 CHF · Brouwland</div><div class="a3-oa"><span class="x3-cmd">${ic('cart', 16)} Commander 250${NB}ml</span><span class="chip" style="height:36px">${ic('star', 15)} Favori</span><span class="chip" style="height:36px;margin-left:auto">Fiche ${ic('chevR', 14)}</span></div></div>`;
const CSS_A = `.a3-rg{gap:6px}.a3-r .bars{position:relative}.a3-r .bars::before{content:"";position:absolute;left:-3px;right:-3px;bottom:50%;border-top:1.5px dashed #7d7d75}
.a3-r .rl b{font-size:13.5px;letter-spacing:-.35px}.a3-r .g{min-width:0}.a3-r .g em{font-size:12.5px;letter-spacing:-.2px}.a3-p{max-width:100%;overflow:hidden;text-overflow:ellipsis;font-family:"Source Sans 3",system-ui;font-weight:600;letter-spacing:-.2px}
.a3-r .b{position:relative}.a3-dd{position:absolute;left:50%;width:7px;height:7px;margin-left:-3.5px;border-radius:50%;background:#d9822b;box-shadow:0 0 0 1.5px #fff}
.mur .a3-r.actif::after{left:-4px;width:9px;height:9px;bottom:-6px}
.a3-rw{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.a3-m{font-size:14px;line-height:17px;display:flex;flex-wrap:wrap;gap:0 5px;padding:0 0 1px}.a3-m>i{color:#aaa;font-style:normal}
.a3-nep{display:inline-flex;align-items:center;gap:2px;color:#5a3d12;font-weight:600}.a3-nep svg{flex:none}
.a3-js{position:relative}.a3-js::after{content:"";position:absolute;left:-3px;right:-3px;top:50%;border-top:1.5px dashed #444}
.li.a3-sel{background:#fff;box-shadow:inset 3px 0 0 #3f74a3;border-bottom-color:transparent}
.a3-o{margin:0 0 0 0;padding:2px 10px 8px 34px;background:#fff;border-bottom:1px solid var(--line);box-shadow:inset 3px 0 0 #3f74a3;display:flex;flex-direction:column;gap:3px;font-size:14.5px}
.a3-o>div{display:flex;align-items:center;gap:4px}.a3-om{color:var(--mut)}.a3-oa{margin-top:3px;gap:6px!important}
.a3-b{display:flex;align-items:center;gap:6px;margin:4px 10px 0;padding:4px 0;border-bottom:2px solid var(--rc);font-size:15px}`;
const ADDS = tous(ADD).sort((x, y) => urg(x) - urg(y));
const A390 = (ouv) => page(`st3 A · étagère jumelle${ouv ? ' · ligne touchée' : ''}`, `${entree(4)}<div class="mur">${rayonA(RAY[0], { actif: 1, leg: 1, court: 1 })}${rayonA(RAY[1], { court: 1 })}${rayonA(RAY[2], { court: 1, mots: 1 })}</div>
<div class="a3-b" style="--rc:${RAY[0].c}"><span style="color:${RAY[0].c}">${ic('flask', 16)}</span><b>Additifs</b><span class="mono">30</span><span class="chip">${ic('sort', 14)} urgence</span></div>
${ADDS.slice(0, ouv ? 5 : 7).map((a) => (ouv && a.n === LACT.n ? ligneA(a, RAY[0], { ouvert: 1 }) + ouvertA : ligneA(a, RAY[0]))).join('')}${fab()}${navBas()}`, '', CSS_D2 + CSS_D2A + CSS_FX + CSS_COM + CSS_FX + CSS_A);

// 1280 : les trois rayons côte à côte (comme d3a), les tables dessous ; une teinte par zone, le tiret marque le seuil.
const ligneTbA = (a, r) => `<tr><td><span class="${ep(a) ? 'rouge' : bas(a) ? 'brun' : ''}${a.c ? ' pt' : ''}">${a.n}</span>${a.d ? ` <span class="s">${ddm(a)}</span>` : ''}${a.ne ? ` <span class="a3-nep s">${ic('mug', 13)}</span>` : ''}</td><td class="q${ep(a) ? ' rouge' : bas(a) ? ' brun' : ''}">${fq(a)}</td><td class="a3-jc"><div><span class="bar" style="background:${a.fx[0]}22"><i class="fx-${a.fx[1]}" style="width:${Math.round(niv(a) * 100)}%;${fxs(a)}"></i>${a.s ? '<u style="left:50%"></u>' : ''}</span><small>${a.s ? 'seuil ' + fs_(a) : ''}</small></div></td></tr>`;
const tableA = (gs, r, titre) => `<table class="tb"><tr><th>${titre}</th><th style="text-align:right">stock</th><th>jauge</th></tr>${gs.map((g) => `<tr class="fa"><td colspan="3" style="color:${r.c}">${g.g} <span class="mono">${g.l.length}</span></td></tr>${g.l.map((a) => ligneTbA(a, r)).join('')}`).join('')}</table>`;
const A1280 = () => page('st3 A 1280', `${tete1280()}${RAIL}<div class="zone">${barre1280()}
<div class="d3-col" style="grid-template-columns:1.7fr 1.35fr 1fr">
<div class="mur d3a-m">${rayonA(RAY[0], { w: 10, bh: 50, leg: 1, court: 1 })}</div><div class="mur d3a-m">${rayonA(RAY[1], { w: 10, bh: 50 })}</div><div class="mur d3a-m">${rayonA(RAY[2], { w: 12, bh: 50 })}</div></div>
<div class="d3-col a3-tbs" style="grid-template-columns:auto auto auto auto">
<div>${tableA(ADD.slice(0, 3), RAY[0], 'Additifs')}</div><div>${tableA(ADD.slice(3), RAY[0], '&nbsp;')}</div><div>${tableA(EMB, RAY[1], 'Emballage')}</div><div>${tableA(NET, RAY[2], 'Nettoyage')}</div>
</div></div>${fab()}`, 'l1280', CSS_1280 + CSS_FX + CSS_COM + CSS_FX + CSS_A + `.d3a-m{margin:0}.d3a-m .ray{min-height:84px;border-bottom:0}.d3a-m .g em{line-height:15px;font-size:13px}.d3a-m .tot{font-size:14px;line-height:17px}.d3a-m .a3-rg{gap:8px}
.tb{font-size:14px;width:100%}.tb td{padding:2px 5px;height:24px}.tb td.q{font-size:14px}.tb tr.fa td{font-weight:700;font-size:13px;padding-top:6px;border-bottom:1px solid var(--line2)}.tb .s{font-size:13px}.tb th{padding:2px 5px}
.tb .bar{height:12px;flex:1;min-width:20px}.tb .bar u{border-left-color:#444}.a3-jc{width:34%}.a3-jc>div{display:flex;align-items:center;gap:5px}.a3-jc small{font-size:12.5px;color:var(--mut);white-space:nowrap}.a3-tbs>div{min-width:0}.pl{height:30px}`);

// ---------- B (tiède) : le casier nommé ----------
// Un rayon ouvert = son casier : des colonnes de hauteur égale (les petites familles s'empilent), chaque article à son
// nom, sa quantité et sa jauge (tiret = seuil). Un rayon replié tient sur une ligne : ses pots en miniature et ce qui
// manque, en mots. 30 additifs à 390 sans défiler ; rien à toucher pour lire un nom.
const celluleB = (a, r, o = {}) => `<div class="b3-c${ep(a) ? ' z' : ''}${bas(a) ? ' bas' : ''}"><span class="b3-j${a.s ? ' s' : ''}${a.c ? ' cpt' : ''}"><i class="fx-${a.fx[1]}" style="height:${Math.round(niv(a) * 100)}%;${fxs(a, a.s ? '' : 'opacity:.5')}"></i></span><span class="b3-t"><b>${a.sh}</b><small class="mono">${a.d ? `<span class="a3-ddm">⌛</span>` : ''}${fq(a)}${a.ne ? `<span class="b3-ne">${ic('mug', 12)}</span>` : ''}${o.seuil && a.s ? `<span class="b3-x">seuil ${fs_(a)}</span>` : ''}${o.seuil && a.d ? `<span class="b3-x a3-ddm">DDM ${a.d}</span>` : ''}</small></span></div>`;
const resume = (gs) => { const t = tous(gs), e = t.filter(ep).length, b = t.filter(bas).length, d = t.filter((a) => a.d).length; return [e && `<span class="rouge">${e} épuisé${e > 1 ? 's' : ''}</span>`, b && `<span class="brun">${b} bas</span>`, d && `<span class="a3-ddm">${d} DDM</span>`].filter(Boolean).join(' · '); };
const colB = (gs, r, o) => `<div class="b3-col">${gs.map((g) => `<em>${g.p && o.pic ? ic(g.p, 13) : ''}${gl(g, o.court)}</em>${g.l.map((a) => celluleB(a, r, o)).join('')}`).join('')}</div>`;
const casierB = (r, o = {}) => { const cols = o.flow ? o.flow.map((ix) => ix.map((i) => r.gs[i])) : r.gs.map((g) => [g]); return `<section class="b3-r" style="--rc:${r.c}"><header><span class="b3-pi">${ic(r.p, 17)}</span><b>${r.nom}</b><span class="mono b3-n">${n(r.gs)}</span><span class="b3-s">${resume(r.gs)}</span><span class="b3-ch">${ic('chevD', 18)}</span></header>
<div class="b3-g" style="grid-template-columns:${o.cols ?? `repeat(${cols.length},minmax(0,1fr))`}">${cols.map((c) => colB(c, r, o)).join('')}</div></section>`; };
const replieB = (r) => `<section class="b3-r ferme" style="--rc:${r.c}"><header><span class="b3-pi">${ic(r.p, 17)}</span><b>${r.nom}</b><span class="mono b3-n">${n(r.gs)}</span><span class="b3-ch" style="transform:none">${ic('chevD', 18)}</span><span class="b3-mini">${r.gs.map((g) => `<span>${g.l.map((a) => `<i class="${ep(a) ? 'z' : 'fx-' + a.fx[1]}" style="height:${ep(a) ? 7 : Math.max(3, Math.round(niv(a) * 16))}px;${ep(a) ? 'background:#fff' : fxs(a, a.s ? '' : 'opacity:.5')}"></i>`).join('')}</span>`).join('')}</span></header>
<div class="b3-m">${enMots(r.gs)}</div></section>`;
const CSS_B = `.b3-r{margin:6px 10px 0;background:var(--mur);border-radius:10px;border-left:4px solid var(--rc);overflow:hidden}
.b3-r header{display:flex;align-items:center;gap:6px;padding:5px 6px 3px 8px;font-size:15px}.b3-r header b{color:var(--ink)}.b3-pi{color:var(--rc);display:grid}.b3-n{font-size:13px;color:var(--mut)}
.b3-s{margin-left:auto;font-size:13px;white-space:nowrap}.b3-ch{color:#555;display:grid;transform:rotate(180deg);width:30px;height:30px;place-items:center}
.b3-g{display:grid;gap:0 4px;padding:0 6px 5px 6px}.b3-col{display:flex;flex-direction:column;min-width:0}
.b3-col em{font-style:normal;font-weight:700;font-size:12.5px;color:var(--rc);border-bottom:2px solid #9c8a6b;line-height:15px;padding-bottom:1px;margin-bottom:1px;white-space:nowrap;display:flex;align-items:center;gap:2px}
.b3-col .b3-c+em{margin-top:5px}
.b3-c{display:flex;gap:3px;align-items:center;height:31px;min-width:0;border-bottom:1px solid #ebe7dd}.b3-c:last-child{border-bottom:0}
.b3-j{width:7px;height:24px;border:1.3px solid #8b7a5a;border-radius:1.5px;display:flex;align-items:flex-end;position:relative;flex:none;background:#fff}
.b3-j i{display:block;width:100%}.b3-j.s::after{content:"";position:absolute;left:-3px;right:-3px;top:50%;border-top:1.5px dashed #444}
.b3-j.cpt{border-style:dotted;border-width:1.5px}.b3-c.z .b3-j{border:1.5px solid var(--rouge)}
.b3-t{min-width:0;display:flex;flex-direction:column}.b3-t b{font-size:13px;font-weight:500;letter-spacing:-.45px;line-height:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--ink)}
.b3-t small{font-size:12.5px;line-height:14px;color:#333;white-space:nowrap;display:flex;align-items:center;gap:1px}
.b3-c.z b,.b3-c.z small{color:var(--rouge)}.b3-c.bas small{color:var(--brun);font-weight:600}.b3-ne{color:#8a5212;display:grid;margin-left:2px}
.b3-x{color:var(--mut);font-weight:400;font-family:"Source Sans 3",system-ui;font-size:13px;margin-left:7px}
.b3-r.ferme header{padding-bottom:2px}.b3-mini{display:flex;align-items:flex-end;gap:6px;margin-left:auto;height:18px;border-bottom:1.5px solid #9c8a6b;padding:0 2px}
.b3-mini span{display:flex;align-items:flex-end;gap:1.5px}.b3-mini i{display:block;width:5px;border-radius:1px 1px 0 0}.b3-mini i.z{border:1.3px solid var(--rouge);width:6px}
.b3-m{padding:0 8px 6px 31px;font-size:14px;display:flex;flex-wrap:wrap;gap:0 5px}.b3-m>i{color:#aaa;font-style:normal}`;
const COLS_ADD = 'minmax(0,.82fr) minmax(0,1.03fr) minmax(0,1.01fr) minmax(0,1.09fr) minmax(0,1.05fr)';
const B390 = (net) => page(`st3 B · casier nommé${net ? ' · Nettoyage ouvert' : ''}`, `${entree(4)}${casierB(RAY[0], { cols: COLS_ADD, court: 1 })}${net ? replieB(RAY[1]) + casierB(RAY[2]) : casierB(RAY[1], { flow: [[0, 1], [2, 4], [3]] }) + replieB(RAY[2])}${fab()}${navBas()}`, '', CSS_D2 + CSS_FX + CSS_COM + CSS_FX + CSS_B);

// 1280 : Additifs en tête sur toute la largeur (comme le premier rang de d3a), Emballage et Nettoyage côte à côte dessous.
const B1280 = () => page('st3 B 1280', `${tete1280()}${RAIL}<div class="zone">${barre1280()}
<div class="b3-l">${casierB(RAY[0], { seuil: 1, pic: 1 })}<div class="b3-l2">${casierB(RAY[1], { seuil: 1, pic: 1 })}${casierB(RAY[2], { seuil: 1, pic: 1 })}</div></div></div>${fab()}`, 'l1280', CSS_1280 + CSS_FX + CSS_COM + CSS_FX + CSS_B + `.pl{height:30px}
.b3-l{margin-top:8px}.b3-l .b3-r{margin:0 0 10px}.b3-l2{display:grid;grid-template-columns:5fr 3fr;gap:12px;align-items:start}
.l1280 .b3-r header{font-size:17px;padding:6px 10px 4px}.l1280 .b3-s{font-size:14px}.l1280 .b3-g{gap:0 18px;padding:0 10px 6px}
.l1280 .b3-c{height:41px;gap:7px}.l1280 .b3-j{width:10px;height:32px}.l1280 .b3-t b{font-size:14.5px;line-height:17px;letter-spacing:-.2px}.l1280 .b3-t small{font-size:14px;line-height:17px}.l1280 .b3-col em{font-size:14px;line-height:18px}`);

// ---------- C (chaude) : le tableau périodique ----------
// Un article = une case : symbole, nom court, quantité, comme une case de Mendeleïev ; une colonne par famille. La case
// se remplit avec le stock ; le tiret marque le seuil (comme en A) ; rouge vide = épuisé ; coin orange = DDM proche ;
// pointillé = à compter. Toucher une case ouvre sa feuille (stock, seuil, ce qui en dépend, Commander).
const nivC = (a) => (!a.q ? 0 : a.s ? Math.min(1, a.q / (3 * a.s)) : Math.max(0.12, (0.9 * a.q) / a.mx)); // seuil au tiers bas
const caseC = (a, r, o = {}) => `<div class="c3-t${ep(a) ? ' z' : ''}${bas(a) ? ' bas' : ''}${a.s ? ' s' : ''}${a.c ? ' cpt' : ''}${a.d ? ' dd' : ''}${o.sel === a.n ? ' sel' : ''}" style="--rc:${r.c}"><i class="c3-f fx-${a.fx[1]}" style="height:${Math.round(nivC(a) * 100)}%;background-color:${a.fx[0]}"></i><u class="c3-k"></u><b>${a.sy}</b><span class="mono">${fq(a)}</span><em>${a.sh}</em></div>`;
const blocC = (r, o = {}) => `<div class="c3-b" style="--rc:${r.c}"><div class="c3-bt"><span style="color:${r.c};display:grid">${ic(r.p, 15)}</span><b>${r.nom}</b><span class="mono">${n(r.gs)}</span>${o.leg ? '<span class="leg-q" aria-label="Légende">?</span>' : ''}</div><div class="c3-cols">${r.gs.map((g) => `<div class="c3-col"><em>${gl(g, true)}</em>${g.l.map((a) => caseC(a, r, o)).join('')}</div>`).join('')}</div></div>`;
const teteC = (grand) => `<div class="c3-dh">${caseC(LACT, RAY[0])}<div><b>Acide lactique 80${NB}%</b><small>Additifs · Acides</small></div>${grand ? '' : `<span class="o" style="width:36px;height:36px;margin-left:auto">${ic('x', 16)}</span>`}</div>
<div class="c3-dl"><span class="rouge">épuisé</span><span class="mono">0 / seuil 250${NB}ml</span></div><div class="c3-dl brun">${ic('mug', 14)} manque pour NEIPA 28.11 · 40${NB}ml</div><div class="c3-dl" style="color:#555">dernier achat 18.09 · 250${NB}ml · 9,80 CHF</div>
<div class="c3-da"><span class="x3-cmd">${ic('cart', 16)} Commander</span><span class="chip" style="height:36px">Fiche ${ic('chevR', 14)}</span></div>`;
const CSS_C = `.c3-b{display:flex;flex-direction:column}.c3-bt{display:flex;align-items:center;gap:4px;font-size:14px;padding:0 0 2px;white-space:nowrap}.c3-bt b{color:var(--ink)}.c3-bt .mono{font-size:13px;color:var(--mut)}.c3-bt .leg-q{margin-left:2px}
.c3-cols{display:flex;gap:4px;border-top:3px solid var(--rc);padding-top:2px}.c3-col{display:flex;flex-direction:column;gap:4px;width:66px}
.c3-col em{font-style:normal;font-weight:700;font-size:12.5px;letter-spacing:-.3px;color:var(--rc);text-align:center;height:16px;line-height:16px;white-space:nowrap}
.c3-t{position:relative;width:66px;height:54px;border:1.5px solid var(--rc);border-radius:5px;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;flex:none}
.c3-f{position:absolute;left:0;right:0;bottom:0;opacity:.5}
.c3-k{display:none}.c3-t.s .c3-k{display:block;position:absolute;left:3px;right:3px;bottom:33.3%;height:0;border-top:1.5px dashed #333}
.c3-t b,.c3-t em,.c3-t span{position:absolute;left:0;right:0;text-align:center;text-shadow:0 0 2px #fff,0 0 2px #fff}.c3-t b{top:2px}.c3-t span{top:18px}.c3-t em{bottom:2px;max-width:none!important}
.c3-t b{font:700 15px/15px "Source Sans 3",system-ui;color:var(--ink)}.c3-t span{font-size:12px;line-height:13px;color:#222}
.c3-t em{font-style:normal;font-size:12px;line-height:13px;letter-spacing:-.35px;color:#333;max-width:96%;white-space:nowrap}
.c3-t.z{border:2px solid var(--rouge);background:#fff}.c3-t.z b,.c3-t.z span,.c3-t.z em{color:var(--rouge)}.c3-t.bas span{color:var(--brun);font-weight:600}
.c3-t.dd::before{content:"";position:absolute;right:0;top:0;border-style:solid;border-width:0 11px 11px 0;border-color:transparent #d9822b transparent transparent}
.c3-t.cpt{border-style:dotted;border-width:2px}.c3-t.sel{outline:3px solid #111;outline-offset:1px}
.c3-dh{display:flex;gap:8px;align-items:center}.c3-dh>div:nth-child(2){display:flex;flex-direction:column;min-width:0}.c3-dh b{font-size:15px;line-height:18px;color:var(--ink);white-space:nowrap}.c3-dh small{font-size:13px;color:var(--mut)}
.c3-dl{font-size:14px;line-height:18px;display:flex;flex-wrap:wrap;gap:0 6px;align-items:center}.c3-da{display:flex;gap:6px;align-items:center;margin-top:3px}
.c3-ag1{display:flex;align-items:center;gap:0 5px;font-size:14px;white-space:nowrap;padding:1px 0 5px}.c3-ag1>b{color:var(--ink);margin-right:2px}.c3-ag1>i{color:#aaa;font-style:normal}
.c3-plus{margin-left:auto;display:inline-flex;align-items:center;height:30px;padding:0 9px;border-radius:999px;border:1.5px dashed #888;font-weight:600;color:#222}`;
const agir1 = (k) => `<div class="c3-ag1"><b>À agir <span class="mono">${AGIR.length}</span></b>${AGIR.slice(0, k).map((a) => `<span class="rouge">${a.sh} <span class="mono">0</span></span>`).join('<i>·</i>')}<span class="c3-plus">+${AGIR.length - k} ›</span></div>`;
const C390 = (sel) => page(`st3 C · tableau périodique${sel ? ' · case touchée' : ''}`, `${entree(4)}
<div class="c3-p">${agir1(3)}${blocC(RAY[0], { leg: 1, sel: sel ? LACT.n : '' })}${blocC(RAY[1])}${blocC(RAY[2])}</div>${sel ? `<div class="c3-sh">${teteC(false)}</div>` : fab()}${navBas()}`, '', CSS_D2 + CSS_FX + CSS_COM + CSS_FX + CSS_C + `.c3-p{margin:6px 10px 0;background:var(--mur);border-radius:10px;padding:4px 6px 8px;display:flex;flex-direction:column;gap:6px}
.c3-cols{gap:3px}.c3-col,.c3-t{width:62px}.c3-t em{letter-spacing:-.6px}
.c3-sh{position:absolute;left:0;right:0;bottom:62px;z-index:6;background:#fff;border-top:1.5px solid #111;border-radius:16px 16px 0 0;padding:8px 12px 10px;display:flex;flex-direction:column;gap:4px;box-shadow:0 -6px 18px rgba(0,0,0,.16)}`);

const C1280 = () => page('st3 C 1280', `${tete1280()}${RAIL}<div class="zone">${barre1280()}
<div class="c3-g">${blocC(RAY[0], { sel: LACT.n, leg: 1 })}<div class="c3-w"><div class="c3-w1">${blocC(RAY[1])}${blocC(RAY[2])}</div>
<div class="c3-side"><div class="c3-d">${teteC(true)}</div><div class="c3-ag"><b>À agir <span class="mono">${AGIR.length}</span></b>${AGIR.slice(0, 8).map((a) => `<div><span class="${ep(a) ? 'rouge' : bas(a) ? 'brun' : 'a3-ddm'}">${a.n}</span><span class="mono">${ep(a) ? '0' : a.d ? 'DDM ' + a.d : fq(a)}</span></div>`).join('')}<span class="c3-plus" style="margin:5px 0 0;align-self:flex-start">+${AGIR.length - 8} · tout voir ›</span></div></div></div></div></div>${fab()}`, 'l1280', CSS_1280 + CSS_FX + CSS_COM + CSS_FX + CSS_C + `.pl{height:30px}
.c3-g{display:flex;gap:16px;margin-top:10px;background:var(--mur);border-radius:12px;padding:10px 12px;align-items:flex-start}
.c3-col{width:74px}.c3-t{width:74px;height:62px;gap:1px}.c3-t b{font-size:19px;line-height:20px}.c3-t span{font-size:13px;line-height:15px;top:23px}.c3-t em{font-size:12px;letter-spacing:-.45px}.c3-col em{font-size:13px;height:20px;line-height:20px}
.c3-bt{font-size:16px;gap:6px;padding-bottom:4px}.c3-w{display:flex;flex-direction:column;gap:12px}.c3-w1{display:flex;gap:16px;align-items:flex-start}.c3-side{display:grid;grid-template-columns:300px 1fr;gap:14px;align-items:start}
.c3-d{border:1.5px solid #111;border-radius:12px;padding:8px 9px;background:#fff;display:flex;flex-direction:column;gap:4px;box-shadow:0 4px 14px rgba(0,0,0,.1)}.c3-dh .c3-t{width:56px;height:56px}.c3-dh b{font-size:14.5px}.c3-d .c3-dl{font-size:13.5px}
.c3-ag{display:flex;flex-direction:column;font-size:14px}.c3-ag b{font-size:15px;padding-bottom:3px;border-bottom:2px solid #9c8a6b;color:var(--ink)}
.c3-ag div{display:flex;justify-content:space-between;gap:6px;padding:3px 0;border-bottom:1px solid var(--line)}.c3-ag .mono{font-size:13px;color:#333}`);

const V = { 'a-390': () => A390(false), 'a-390-ligne': () => A390(true), 'a-1280': A1280, 'b-390': () => B390(false), 'b-390-net': () => B390(true), 'b-1280': B1280, 'c-390': () => C390(false), 'c-390-case': () => C390(true), 'c-1280': C1280 };
for (const [id, f] of Object.entries(V)) fs.writeFileSync(path.join(ICI, `st3-${id}.html`), f());
console.log(`${Object.keys(V).length} pages · additifs ${n(ADD)} · emballage ${n(EMB)} · nettoyage ${n(NET)} · à agir ${AGIR.length} · filtres ${FILTRES.map((f) => f[0] + ' ' + f[2]).join(', ')}`);
