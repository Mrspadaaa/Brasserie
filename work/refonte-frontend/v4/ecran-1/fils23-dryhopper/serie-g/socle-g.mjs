// Socle de la série G (voie r7g-dryhopper, lot 23) : données, briques et page commune des huit
// concepts « Quand ajouter Idaho 7 ? ». Classes du socle préfixées « gs- », celles d'un concept par
// son id (« g3- ») (L26). Aucun remplacement de chaîne pour assembler le code client.
//
// Données (aucune modifiée, aucun chiffre inventé) :
//   - ../../fils22-comparer/donnees/comparer-stout.json (vérifié D102) : la stout 16D, l'avant, la
//     grille simulée d'Idaho 7 (4 g/L, US-05 et Pomona ; b60, b10, wp, actif et après 1 à 7 j),
//     l'α du lot et des fiches, les IBU par gramme (b60, b30, b15, b10, wp), les bandes du style ;
//   - ../../fils21-choisir/donnees/comparatifs-dryhop.json : les études E03, E05, E07, E08, E10.
// Entre 60′ et 10′ (55′ … 15′), la grille n'a pas de point : arômes « ≈ interpolé » (linéaire en
// minutes, marqué), IBU interpolés entre les points du moteur (60′, 30′, 15′, 10′). À cru : IBU non
// modélisé (« ? »). Familles sans donnée (pépins, melon) : hachurées, jamais 0.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ici = path.dirname(fileURLToPath(import.meta.url));
const lire = (p) => JSON.parse(fs.readFileSync(path.join(ici, p), 'utf8'));
export const J = lire('../../fils22-comparer/donnees/comparer-stout.json');
export const E = lire('../../fils21-choisir/donnees/comparatifs-dryhop.json');
export const JETONS = lire('../../fils17-standard/jetons-familles.json');
const TEMOIN = fs.readFileSync(path.join(ici, '../../../tournoi/outils/temoins/une-question-ok/etat.html'), 'utf8');
export const symboles = TEMOIN.match(/<svg width="0" height="0"[^]*?<\/svg>/)[0];

export const COURT = { citrus: 'Agrumes', tropical: 'Tropicaux', stoneFruit: 'Noyau', pomeFruit: 'Pépins', berries: 'Baies', melon: 'Melon', floral: 'Floral', herbal: 'Herbacé', resin: 'Résineux', spice: 'Épicé', green: 'Végétal', earthy: 'Terreux' };
export const ORDRE = J.style.ordre; // floral, herbacé, terreux d'abord (attendues du 16D)
export const ROUE = ['citrus', 'tropical', 'melon', 'stoneFruit', 'pomeFruit', 'berries', 'floral', 'green', 'herbal', 'spice', 'earthy', 'resin'];
export const BANDE = Object.fromEntries(Object.entries(J.style.zone).map(([k, v]) => [k, v.bande[1]]));
export const ATTENDUES = Object.entries(J.style.zone).filter(([, v]) => v.statut === 'attendue').map(([k]) => k);
export const AVANT = Object.fromEntries(Object.entries(J.biere.avant).map(([k, v]) => [k, v.centre]));
export const H = J.houblons.find((h) => h.nom === 'Idaho 7');
export const COUL_I7 = '#5b3fa0'; // couleur d'Idaho 7 dans toute la base (D83 S1)
export const VOLUME = J.biere.recette.volumeL; // 20 L
export const DOSE = 4;
export const IBU_BASE = 60; // Nugget 46 g à 60′ (base v4.7, biere.html)
export const IBU_16D = [50, 70];
export const fr = (x, d = 0) => (Math.round(x * 10 ** d) / 10 ** d).toFixed(d).replace('.', ',');
export const signe = (x) => (x >= 0 ? '+' : '−') + fr(Math.abs(x));

const pt = (m, j, lev = 'fermentis-us05') => H.grille.find((x) => x.moment === m && x.jours === (j ?? null) && x.dose_gL === DOSE && x.levure === lev);
const centre = (g) => Object.fromEntries(Object.entries(g.apres).map(([k, v]) => [k, v[1]]));
export const INCONNUS = Object.entries(pt('b60').apres).filter(([, v]) => v[1] === 0 && v[2] === 0).map(([k]) => k);
const IPG = Object.fromEntries(H.ibuParGramme.moments.filter((m) => m.ibuPerGram).map((m) => [m.code, m.ibuPerGram.value]));
const ipgMinutes = (min) => {
  const P = [[60, IPG.b60], [30, IPG.b30], [15, IPG.b15], [10, IPG.b10]];
  for (let k = 0; k < P.length - 1; k++) { const [a, va] = P[k], [b, vb] = P[k + 1]; if (min <= a && min >= b) return { v: va + (vb - va) * (a - min) / (a - b), exact: min === a || min === b }; }
  return null;
};

// Les 22 moments : ébullition par 5′ (60′ … 10′), whirlpool, actif et après (1, 2, 3, 5, 7 j).
export const POS = [];
const b60 = centre(pt('b60')), b10 = centre(pt('b10'));
for (let m = 60; m >= 10; m -= 5) {
  const t = (60 - m) / 50, v = Object.fromEntries(Object.keys(b60).map((k) => [k, b60[k] + (b10[k] - b60[k]) * t]));
  const ip = ipgMinutes(m);
  POS.push({ id: 'b' + m, lib: m + '′', court: m + '′', seg: 'ebu', v, interp: m !== 60 && m !== 10, ibu: Math.round(IBU_BASE + ip.v * DOSE * VOLUME), ibuExact: ip.exact });
}
POS.push({ id: 'wp', lib: 'whirlpool', court: 'WP', seg: 'wp', v: centre(pt('wp')), interp: false, ibu: Math.round(IBU_BASE + IPG.wp * DOSE * VOLUME), ibuExact: true });
for (const [m, seg, mot] of [['dryActive', 'actif', 'actif'], ['dryPost', 'apres', 'après']]) for (const j of [1, 2, 3, 5, 7]) {
  const pom = pt(m, j, 'lalbrew-pomona');
  POS.push({ id: m + '|' + j, lib: mot + ' · ' + j + ' j', court: 'J' + j, seg, j, v: centre(pt(m, j)), vPomona: centre(pom), interp: false, ibu: null, ibuExact: false });
}
export const SEGS = { ebu: 'ébullition', wp: 'whirlpool', actif: 'dry hop actif', apres: 'dry hop après' };
// Le meilleur moment pour la demande du 18.10 (« trop résineuse, je la veux plus florale ») :
// le plus de floral, le moins de résineux ajouté, l'IBU dans la 16D (au-delà de 70 : exclu).
export const score = (p) => (p.ibu != null && p.ibu > IBU_16D[1] ? -99 : (p.v.floral - AVANT.floral) - 0.5 * (p.v.resin - AVANT.resin));
export const MEILLEUR = POS.reduce((b, p, i) => (score(p) > score(POS[b]) + 0.05 ? i : b), 0);
export const DEPART = POS.findIndex((p) => p.id === 'wp'); // départ neutre : le whirlpool, le choix « par défaut » d'un brasseur

// Vraies valeurs (comparatifs-dryhop.json), lues ligne de la bonne variété (L14).
const mesure = (id, pred) => { const e = E.etudes.find((x) => x.id === id); return { e, m: e.mesures.find(pred) }; };
export const VRAIES = {
  E08: { ...mesure('E08', (m) => m.compose === 'linalol'), court: 'l\'essentiel passe en 2 j', qui: 'Schmidt 2019, Eureka!, 2,5 g/L' },
  E07: { ...mesure('E07', (m) => /cooked/.test(m.descripteur || '')), court: 'à l\'ébullition : cuit, herbe, végétal', qui: 'Sharp 2014, panel de 12, 1,5 g/L' },
  E10: { ...mesure('E10', (m) => /temps de contact/.test(m.descripteur || '')), court: '1 h ou 96 h : même nez', qui: 'Titus 2021, Cascade, 1,43 g/L' },
  E05: { ...mesure('E05', (m) => m.variete === 'Cascade pastilles, passif' && m.compose === 'linalol, extraction'), court: 'linalol : 43 % extrait en 6 h', qui: 'Wolfe 2012, Cascade, 3,86 g/L' },
  E03: { ...mesure('E03', (m) => m.variete === 'Idaho-7' && m.compose === 'linalol'), court: 'Idaho 7 au pitch : linalol 38 ± 13 µg/L', qui: 'McCabe 2023, S-04, à vérifier' },
};
export const vraie = (k, cls = '') => { const x = VRAIES[k]; return `<p class="gs-vraie ${cls}" data-nature="mesure" data-source="${k} ${x.e.ref.split('.')[0].replace(/"/g, '')}"><span class="gs-mes">mesuré</span> ${x.court} <span class="gs-src">${x.qui} (${k})</span></p>`; };

// ---------- briques ----------
export const pi = (f, t = 16) => `<svg class="gs-pi" width="${t}" height="${t}" data-famille="${f}" aria-label="${COURT[f]}"><use href="#p-${f}"/></svg>`;
const alphaI7 = () => { const s = H.alpha.sources[0]; return `<span class="gs-num" data-role="alpha" data-source="lot">α ${fr(H.alpha.retenu.value, 1)} %</span>`; };
export const contexte = (sans = []) => `<p class="gs-ctx" data-role="contexte"><span class="gs-fixe">fixé</span>${[
  ['houblon', `<b class="gs-h" data-houblon="Idaho 7" data-couleur="${COUL_I7}"><i class="gs-pt" style="background:${COUL_I7}"></i>Idaho 7</b> ${alphaI7()} <span class="gs-usage" data-role="usage">mixte</span>`],
  ['dose', '4 g/L'], ['levure', 'US-05'], ['base', 'Stout 16D']].filter(([k]) => !sans.includes(k)).map(([k, t]) => `<span data-contexte="${k}">${t}</span>`).join('')}</p>`;
export const tete = (titre, extra = '') => `<header class="gs-barre"><a class="gs-retour" aria-label="Retour" href="#">‹</a><h1 class="gs-titre">${titre}</h1>${extra}</header>`;
export const lentille = (idLeg, leg) => `<div class="gs-lent"><button type="button" class="gs-aide" data-role="legende-bouton" aria-expanded="false" aria-controls="${idLeg}" aria-label="Lire la légende">?</button><div class="gs-leg" id="${idLeg}" data-role="legende" hidden>${leg}</div><span class="gs-seg" data-lecture role="radiogroup" aria-label="lecture au style ou absolu"><button type="button" role="radio" aria-checked="true" data-e="style">Au style</button><button type="button" role="radio" aria-checked="false" data-e="absolu">Absolu</button></span></div>`;
// Pont vers la levure, deux formes (choix ouvert du brasseur, L24) : « étape » (dernière étape de
// Dryhopper) ou « outil » (un pont vers l'outil Levure). Le texte suit le moment (data-pont-lev).
export const pontLevure = (forme) => forme === 'etape'
  ? `<nav class="gs-pont" aria-label="Étape suivante"><a class="gs-etape" href="#levure"><span class="gs-pas">1 Quand · <b>2 Levure</b></span><span class="gs-lev" data-pont-lev></span><span class="gs-fl">›</span></a></nav>`
  : `<nav class="gs-pont" aria-label="Pont vers Levure"><a class="gs-outil" href="#levure"><span class="gs-lev" data-pont-lev></span><span class="gs-fl">Levure ›</span></a></nav>`;

// Fiche au long appui (D25) : la vraie fiche courte, type g1 / Citra cryo (≤ 100 mots).
function radarFiche() {
  const t = 132, c = t / 2, r = c - 20, n = ROUE.length, niv = Object.fromEntries(H.aromes.map((a) => [a.family, a.level]));
  const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n, xy = (i, v) => [c + v * r * Math.cos(ang(i)), c + v * r * Math.sin(ang(i))];
  const vals = ROUE.map((f) => (niv[f] || 0) / 2);
  let s = `<svg width="${t}" height="${t}" viewBox="0 0 ${t} ${t}" data-radar data-objet="fiche" data-axes="${ROUE.join(',')}" role="img" aria-label="Silhouette d'Idaho 7">`;
  s += `<defs><pattern id="gs-hf" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="#c9cad2" stroke-width="1.5"/></pattern></defs>`;
  ROUE.forEach((f, i) => { if (niv[f]) return; const a0 = ang(i - 0.5), a1 = ang(i + 0.5); s += `<path d="M${c},${c} L${(c + r * Math.cos(a0)).toFixed(1)},${(c + r * Math.sin(a0)).toFixed(1)} A${r},${r} 0 0 1 ${(c + r * Math.cos(a1)).toFixed(1)},${(c + r * Math.sin(a1)).toFixed(1)} Z" fill="url(#gs-hf)"/>`; });
  s += `<polygon points="${ROUE.map((_, i) => xy(i, 1).map((z) => z.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="#e1e3e9"/>`;
  s += `<polygon points="${vals.map((v, i) => xy(i, v).map((z) => z.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="${COUL_I7}" stroke-width="2.5" stroke-linejoin="round"/>`;
  ROUE.forEach((f, i) => { const [x, y] = xy(i, 1.17); s += `<svg x="${(x - 7).toFixed(1)}" y="${(y - 7).toFixed(1)}" width="14" height="14" viewBox="0 0 24 24" data-famille="${f}" aria-label="${COURT[f]}"><use href="#p-${f}"/></svg>`; });
  return s + '</svg>';
}
export const fiche = () => {
  const cites = H.aromes.filter((a) => a.level > 0);
  const s = H.alpha.sources[0];
  return `<aside class="gs-fiche" data-role="fiche" hidden aria-label="Fiche d'Idaho 7">
  <div class="gs-fi-t"><b><i class="gs-pt" style="background:${COUL_I7}"></i>Idaho 7</b><span class="gs-usage">mixte</span><button type="button" class="gs-fermer" data-role="fermer-fiche" aria-label="Fermer la fiche">Fermer</button></div>
  <p class="gs-num" data-role="fiche-alpha">α ${fr(H.alpha.retenu.value, 1)} % ce lot · ${fr(s.min, 1)}–${fr(s.max, 1)} % ${s.source}</p>
  <div class="gs-fi-c">${radarFiche()}<div class="gs-fi-a" data-role="fiche-arome"><span class="gs-src">arômes : 1/1 fiche</span>${cites.map((a) => `<span>${pi(a.family, 14)}${a.mots.flatMap((m) => m.mots).slice(0, 2).join(', ')}</span>`).join('')}<span class="gs-src">huile 1–2 mL/100 g</span></div></div>
  <div class="gs-gout" role="group" data-role="gout" aria-label="Mon goût pour Idaho 7"><button type="button" aria-pressed="false">J'aime</button><button type="button" aria-pressed="false">Pas pour moi</button></div>
</aside>`;
};

export const CSS = `
:root { --encre:#16161a; --gris:#55555f; --trait:#e3e5eb; --mur:#eef0f4; --acc:#c2410c; --i7:${COUL_I7}; --sans:"Source Sans 3",system-ui,-apple-system,"Segoe UI",sans-serif; --mono:"IBM Plex Mono",ui-monospace,Consolas,monospace; }
[hidden] { display:none !important; }
* { box-sizing:border-box; margin:0; padding:0; }
html, body { background:var(--mur); overflow-x:hidden; }
body { color:var(--encre); font:400 14px/1.25 var(--sans); -webkit-tap-highlight-color:transparent; }
::selection { background:#d9cdf0; }
button { font:inherit; color:inherit; background:none; border:0; cursor:pointer; }
a { color:inherit; text-decoration:none; }
svg { display:block; flex:none; }
.gs-ecran { max-width:390px; margin:0 auto; padding:4px 10px 12px; display:flex; flex-direction:column; gap:8px; }
.gs-barre { display:flex; align-items:center; gap:8px; min-height:38px; }
.gs-retour { width:28px; height:28px; border-radius:50%; background:#fff; border:1px solid var(--trait); display:inline-flex; align-items:center; justify-content:center; flex:none; font:600 20px/1 var(--sans); padding-bottom:2px; }
.gs-titre { font:600 17px/1.2 var(--sans); flex:1; }
.gs-ctx { display:flex; flex-wrap:wrap; align-items:center; gap:4px; font-size:13px; color:var(--gris); }
.gs-fixe { font-size:12px; margin-right:2px; }
.gs-ctx [data-contexte] { display:inline-flex; align-items:center; gap:4px; height:22px; padding:0 8px; border-radius:11px; background:#e2e5eb; color:var(--encre); }
.gs-h { display:inline-flex; align-items:center; gap:4px; font-weight:600; }
.gs-pt { width:10px; height:10px; border-radius:50%; display:inline-block; flex:none; }
.gs-usage { font-size:12px; color:var(--gris); }
.gs-num { font-family:var(--mono); font-variant-numeric:tabular-nums; font-size:13px; }
.gs-lent { display:flex; justify-content:flex-end; align-items:center; gap:6px; position:relative; }
.gs-seg { display:inline-flex; background:#e2e5eb; border-radius:15px; padding:2px; }
.gs-seg button { height:26px; padding:0 10px; border-radius:13px; font-size:13px; color:var(--gris); }
.gs-seg button[aria-checked="true"] { background:#fff; color:var(--encre); font-weight:600; }
.gs-aide { width:26px; height:26px; border-radius:50%; border:1px solid #c9cad2; background:#fff; font-weight:700; color:var(--gris); margin-right:auto; }
.gs-leg { position:absolute; top:32px; left:0; z-index:6; background:#fff; border:1px solid #c9cad2; border-radius:8px; padding:8px 10px; font-size:13px; display:flex; flex-direction:column; gap:4px; width:270px; }
.gs-bloc { background:#fff; border-radius:8px; padding:8px 10px; display:flex; flex-direction:column; gap:6px; }
.gs-pi { width:16px; height:16px; }
.gs-vraie { font-size:12px; color:var(--encre); line-height:1.3; }
.gs-mes { font-weight:700; color:#0f6b4f; }
.gs-src { font-size:12px; color:var(--gris); }
.gs-pont { display:flex; justify-content:flex-end; }
.gs-pont a { display:inline-flex; align-items:center; gap:8px; min-height:34px; padding:4px 6px 4px 12px; border-radius:999px; background:#fff; border:1px solid #c9cad2; font-size:13px; }
.gs-pont .gs-fl { display:inline-flex; align-items:center; height:26px; padding:0 10px; border-radius:13px; background:var(--encre); color:#fff; font-weight:600; }
.gs-pas { color:var(--gris); white-space:nowrap; }
.gs-pas b { color:var(--encre); }
.gs-lev { color:var(--encre); }
.gs-lev em { font-style:normal; font-weight:600; }
.gs-fiche { position:fixed; left:50%; transform:translateX(-50%); bottom:8px; width:370px; z-index:20; background:#fff; border:1px solid #c9cad2; border-radius:8px; padding:10px; display:flex; flex-direction:column; gap:6px; box-shadow:0 6px 18px rgba(22,22,26,.18); }
.gs-fi-t { display:flex; align-items:center; gap:8px; }
.gs-fi-t b { display:inline-flex; align-items:center; gap:6px; font-size:16px; }
.gs-fermer { margin-left:auto; height:28px; padding:0 10px; border-radius:14px; border:1px solid #c9cad2; font-size:13px; }
.gs-fi-c { display:flex; gap:10px; align-items:center; }
.gs-fi-a { display:flex; flex-direction:column; gap:3px; font-size:13px; }
.gs-fi-a span { display:flex; align-items:center; gap:4px; }
.gs-gout { display:flex; gap:6px; }
.gs-gout button { height:28px; padding:0 12px; border-radius:14px; border:1px solid #c9cad2; font-size:13px; }
.gs-gout button[aria-pressed="true"] { background:var(--encre); color:#fff; }
.gs-meilleur { font:600 12px var(--sans); color:#0f6b4f; }
`;

// Code client commun : lentille, légende, fiche (appui long 500 ms, survol 800 ms à la souris).
export const JS_COMMUN = `
<script>
document.querySelectorAll('[data-e]').forEach(function (b) { b.addEventListener('click', function () {
  document.querySelectorAll('[data-e]').forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
  document.body.classList.toggle('abs', b.dataset.e === 'absolu'); if (window.redessiner) window.redessiner(); }); });
document.querySelectorAll('[data-role=legende-bouton]').forEach(function (b) { b.addEventListener('click', function () {
  var l = document.getElementById(b.getAttribute('aria-controls')); l.hidden = !l.hidden; b.setAttribute('aria-expanded', String(!l.hidden)); }); });
var fiche = document.querySelector('[data-role=fiche]'), tm = null, dernierTouch = 0;
function ouvrir() { fiche.hidden = false; }
function fermer() { fiche.hidden = true; }
addEventListener('keydown', function (e) { if (e.key !== 'Escape') return; fermer(); document.querySelectorAll('[data-role=legende]').forEach(function (l) { l.hidden = true; }); document.querySelectorAll('[data-role=legende-bouton]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); }); });
document.querySelector('[data-role=fermer-fiche]').addEventListener('click', fermer);
document.querySelectorAll('[data-role=gout] button').forEach(function (b) { b.addEventListener('click', function () { b.parentNode.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b && x.getAttribute('aria-pressed') !== 'true')); }); }); });
document.querySelectorAll('[data-houblon]').forEach(function (h) {
  h.addEventListener('touchstart', function () { dernierTouch = Date.now(); clearTimeout(tm); tm = setTimeout(ouvrir, 500); }, { passive: true });
  h.addEventListener('touchend', function () { dernierTouch = Date.now(); clearTimeout(tm); });
  h.addEventListener('touchmove', function () { clearTimeout(tm); }, { passive: true });
  h.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  h.addEventListener('mouseenter', function () { if (Date.now() - dernierTouch < 1500) return; clearTimeout(tm); tm = setTimeout(ouvrir, 800); });
  h.addEventListener('mouseleave', function () { if (Date.now() - dernierTouch < 1500) return; clearTimeout(tm); });
});
// Le texte du pont vers la levure suit le moment : la levure ne change le nez que pendant l'actif.
window.pontLevure = function (p) { var el = document.querySelector('[data-pont-lev]'); if (!el) return;
  if (p.vPomona && p.seg === 'actif') { var d = p.vPomona.citrus - p.v.citrus; el.innerHTML = 'Pomona : <em style="color:#856e0c">agrumes ~+' + Math.round(d) + '</em>'; }
  else el.textContent = p.seg === 'apres' ? 'après fermentation, rien ne change' : 'la levure ne change rien ici'; };
</script>`;

export const page = (id, titre, corps, css = '', js = '') => `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${id} · ${titre}</title>
<style>${CSS}${css}</style></head>
<body>
${symboles}
<main class="gs-ecran ${id}">
${corps}
</main>
${fiche()}
${JS_COMMUN}
<script>
var D = ${JSON.stringify(POS)}, AV = ${JSON.stringify(AVANT)}, B = ${JSON.stringify(BANDE)}, INC = ${JSON.stringify(INCONNUS)}, N = D.length - 1, MEILLEUR = ${MEILLEUR};
var TX = ${JSON.stringify(Object.fromEntries(Object.entries(JETONS).map(([k, v]) => [k, v.texte])))}, BA = ${JSON.stringify(Object.fromEntries(Object.entries(JETONS).map(([k, v]) => [k, v.base])))}, COURT = ${JSON.stringify(COURT)};
function abs() { return document.body.classList.contains('abs'); }
function lire(f, x) { return abs() ? x / 110 : x / B[f]; }  // au style : 1 = haut de la bande du style
function delta(p, f) { return p.v[f] - AV[f]; }
function sg(x) { return (x >= 0 ? '+' : '−') + Math.abs(Math.round(x)); }
function ibuTxt(p) { return p.ibu == null ? 'IBU ~60 + ? (à cru : non modélisé)' : 'IBU ~' + p.ibu + (p.ibuExact ? '' : ' ≈'); }
function ibuEtat(p) { return p.ibu == null ? '' : p.ibu > ${IBU_16D[1]} ? ' · trop amer' : ' · dans la 16D'; }
</script>
${js}
</body></html>
`;
