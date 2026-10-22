// Série B du lot 23 (Dryhopper, « Quand l'ajouter ? ») : la réponse d'abord.
// Huit concepts minimalistes, b1 à b8, sur la baseline (y1b, x3b réduit, a2b, écran Dryhopper de la carte).
// Un seul facteur libre : le moment. Tout le reste est fixé dans la ligne de contexte.
// Données : fils21-choisir/donnees/profils-simules.json (grille, Idaho 7, 4 g/L, US-05 ; Pomona pour le pont),
// comparatifs-dryhop.json (E03, E07, E08, E10), pack-fiches.json (fiche, α, IBU par gramme).
// Pictos : repris tels quels de l'écran Dryhopper de la carte (fils22-carte/dryhopper/etat.html).
// Assemblage par gabarits et concaténation, jamais par remplacement de chaîne (L26). Classes des concepts préfixées.
// Usage : node generer.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const racine = path.resolve(ici, '../../../../../..');
const lire = (p) => fs.readFileSync(path.join(racine, p), 'utf8');
const P = JSON.parse(lire('work/refonte-frontend/v4/ecran-1/fils21-choisir/donnees/profils-simules.json'));
const C = JSON.parse(lire('work/refonte-frontend/v4/ecran-1/fils21-choisir/donnees/comparatifs-dryhop.json'));
const PACK = JSON.parse(lire('prototypes/houblons-v4/data/pack-fiches.json'));
const CARTE = lire('work/refonte-frontend/v4/ecran-1/fils22-carte/dryhopper/etat.html');
const JET = JSON.parse(lire('work/refonte-frontend/v4/ecran-1/fils17-standard/jetons-familles.json'));

// ---------- données ----------
const NOM = 'Idaho 7', DOSE = 4, VOL = P.biere.recette.volumeL;
const H = PACK.fichesHoublons.find((h) => h.name === NOM);
const FAM = P.style.ordre; // floral, herbal, earthy, citrus, tropical, stoneFruit, pomeFruit, berries, melon, resin, spice, green
const NOMF = { floral: 'Floral', herbal: 'Herbacé', earthy: 'Terreux', citrus: 'Agrumes', tropical: 'Tropicaux', stoneFruit: 'Noyau', pomeFruit: 'Pépins', berries: 'Baies', melon: 'Melon', resin: 'Résineux', spice: 'Épicé', green: 'Végétal' };
const T = Object.fromEntries(FAM.map((f) => [f, JET[f].texte]));
const BA = Object.fromEntries(FAM.map((f) => [f, JET[f].base]));
const FOND = Object.fromEntries(FAM.map((f) => [f, JET[f].fond]));
const BANDE = Object.fromEntries(FAM.map((f) => [f, P.style.zone[f].bande[1]]));
const AV = Object.fromEntries(FAM.map((f) => [f, P.biere.avant[f].centre]));
const grille = (moment, jours, lev = 'fermentis-us05') => P.grille.find((e) => e.nom === NOM && e.dose_gL === DOSE && e.moment === moment && (e.jours ?? null) === jours && e.levure === lev);
const ipg = (code) => { const m = H.ibuParGramme.moments.find((x) => x.code === code); return m && m.ibuPerGram ? m.ibuPerGram.value : null; };
const r1 = (x) => Math.round(x * 100) / 100;
const lot = (e) => ({ v: Object.fromEntries(FAM.map((f) => [f, r1(e.apres[f][1])])), lo: Object.fromEntries(FAM.map((f) => [f, r1(e.apres[f][0])])), hi: Object.fromEntries(FAM.map((f) => [f, r1(e.apres[f][2])])), conf: e.confiance });
const INC = FAM.filter((f) => !(H.aromes.find((a) => a.family === f) || {}).level && grille('dryPost', 3).apres[f][1] === 0);

// Les moments de la frise : ébullition par 5′, whirlpool, dry hop actif et après par jours de contact.
const D = [];
for (let m = 60; m >= 0; m -= 5) D.push({ id: 'b' + m, lib: m + '′', dit: 'à ' + m + '′', court: m + '′', seg: 0, min: m });
D.push({ id: 'wp', lib: 'whirlpool', dit: 'au whirlpool', court: 'WP', seg: 1 });
for (const j of [1, 2, 3, 5, 7]) D.push({ id: 'dryActive|' + j, lib: 'actif · ' + j + ' j', dit: 'en actif, ' + j + ' j', court: 'J' + j, seg: 2, j });
for (const j of [1, 2, 3, 5, 7]) D.push({ id: 'dryPost|' + j, lib: 'après · ' + j + ' j', dit: 'après, ' + j + ' j', court: 'J' + j, seg: 3, j });
const calc = { b60: grille('b60', null), b10: grille('b10', null), wp: grille('wp', null) };
for (const p of D) {
  const [mo, j] = p.id.split('|');
  const e = calc[mo] || (j ? grille(mo, +j) : null);
  if (e) Object.assign(p, lot(e), { nat: 'simule' });
}
// Entre deux moments calculés : « ≈ interpolé » (comme y1b), jamais présenté comme un calcul du moteur.
const interp = (a, b, t) => { const o = {}; for (const k of ['v', 'lo', 'hi']) { o[k] = {}; for (const f of FAM) o[k][f] = r1(a[k][f] + (b[k][f] - a[k][f]) * t); } return o; };
const iB60 = D.findIndex((p) => p.id === 'b60'), iB10 = D.findIndex((p) => p.id === 'b10'), iWP = D.findIndex((p) => p.id === 'wp');
for (let i = iB60 + 1; i < iB10; i++) Object.assign(D[i], interp(D[iB60], D[iB10], (60 - D[i].min) / 50), { nat: 'interpole', conf: 'faible' });
for (let i = iB10 + 1; i < iWP; i++) Object.assign(D[i], interp(D[iB10], D[iWP], (10 - D[i].min) / 10), { nat: 'interpole', conf: 'faible' });
// IBU ajoutés par Idaho 7 (IBU par gramme × 4 g/L × 20 L) ; à cru : non modélisé.
const IBUK = {};
for (const p of D) { if (p.seg === 0 || p.seg === 1) { const g = ipg(p.seg === 1 ? 'wp' : p.id); if (g != null) IBUK[p.id] = Math.round(g * DOSE * VOL); } }
const connus = D.filter((p) => IBUK[p.id] != null && p.seg === 0);
for (const p of D) {
  if (p.seg >= 2) { p.ibu = null; continue; }
  if (IBUK[p.id] != null) { p.ibu = IBUK[p.id]; p.ibuNat = 'calcul'; continue; }
  const a = connus.filter((q) => q.min > p.min).pop(), b = connus.find((q) => q.min < p.min);
  p.ibu = Math.round(a.ibu ?? IBUK[a.id]) + Math.round((IBUK[b.id] - IBUK[a.id]) * (a.min - p.min) / (a.min - b.min)); p.ibuNat = 'interpole';
}
for (const p of D) { p.d = Object.fromEntries(FAM.map((f) => [f, r1(p.v[f] - AV[f])])); }
// La réponse : face à ta dégustation (« ma stout est trop résineuses, je la veux plus floral », 18.10), le plus
// de floral pour le moins de résineux, l'amertume dans la 16D (50–70 IBU ; la stout est à ~60 avec Nugget 60′).
// Convention de la maquette : solde = Δfloral − Δrésineux − dépassement d'IBU au-dessus de 70. Le plus court
// à 0,05 point près du meilleur (deux jours valent trois quand rien ne bouge).
const IBU0 = 60, IBUMAX = 70;
for (const p of D) p.solde = r1(p.d.floral - p.d.resin - Math.max(0, (p.ibu == null ? 0 : IBU0 + p.ibu) - IBUMAX));
const calcules = D.map((p, i) => i).filter((i) => D[i].nat === 'simule');
const meilleur = Math.max(...calcules.map((i) => D[i].solde));
const BEST = calcules.find((i) => D[i].solde >= meilleur - 0.05);
const APRES2 = D.findIndex((p) => p.id === 'dryPost|2');
const PO = lot(grille('dryActive', D[BEST].j, 'lalbrew-pomona'));
// Vraies valeurs (lire la ligne de la bonne variété, L14).
const etude = (id) => C.etudes.find((e) => e.id === id);
const E03 = etude('E03').mesures.find((m) => m.variete === 'Idaho-7' && m.compose === 'linalol');
const SEUIL_LI = 8; // µg/L, cité par E01
const E08 = etude('E08').mesures.find((m) => m.compose === 'linalol');
const E10 = etude('E10').mesures[0];
const E07 = etude('E07').mesures.find((m) => /cooked/.test(m.descripteur));
if (!E03 || !E08 || !E10 || !E07) throw new Error('vraie valeur introuvable');
const liUg = Math.round(E03.valeur * 1000), liEc = Math.round(E03.ecart * 1000);
const REEL = {
  E03: { court: 'Idaho 7 à la levure : linalol ' + liUg + ' ± ' + liEc + ' µg/L, ×' + (liUg / SEUIL_LI).toFixed(1).replace('.', ',') + ' le seuil', src: 'E03 McCabe 2023, à vérifier' },
  E08: { court: 'Eureka! : l’essentiel en 2 j', src: 'E08 Schmidt 2019' },
  E10: { court: 'Cascade : 1 h = 96 h au nez', src: 'E10 Titus 2021' },
  E07: { court: 'ébullition : cuit, végétal', src: 'E07 Sharp 2014, Simcoe' },
};

const fr = (x, d = 0) => (x < 0 ? '−' : '') + Math.abs(x).toFixed(d).replace('.', ',');
const sg = (x) => (x >= 0 ? '+' : '−') + fr(Math.abs(x));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const B = D[BEST], A2 = D[APRES2];
const alpha = H.alpha.retenu.value, aMin = H.alpha.sources[0].min, aMax = H.alpha.sources[0].max;
const COUL = '#5b3fa0'; // couleur d'Idaho 7 dans toute la base (carte, Comparer)

// ---------- pictos (au trait, repris de la carte) ----------
const SYMBOLES = CARTE.slice(CARTE.indexOf('<svg width="0" height="0"'), CARTE.indexOf('</svg>', CARTE.indexOf('<symbol id="p-green"')) + 6);
if (!SYMBOLES.includes('p-floral') || !SYMBOLES.includes('p-green')) throw new Error('pictos introuvables');
const pic = (f, s = 16, cls = 'pi') => `<svg class="${cls}" width="${s}" height="${s}" data-famille="${f}" aria-label="${NOMF[f]}"><use href="#p-${f}"/></svg>`;
const ico = {
  stock: `<svg class="ico" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#55555f" stroke-width="1.5" aria-hidden="true"><path d="M2 4.5 7 2l5 2.5v5L7 12 2 9.5z"/><path d="M2 4.5 7 7l5-2.5M7 7v5"/></svg>`,
  coeur: `<svg class="ico" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#16161a" stroke-width="1.5" aria-hidden="true"><path d="M8 13.5S2 10 2 6a3 3 0 0 1 6-1 3 3 0 0 1 6 1c0 4-6 7.5-6 7.5z"/></svg>`,
  ban: `<svg class="ico" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#16161a" stroke-width="1.5" aria-hidden="true"><circle cx="8" cy="8" r="5.5"/><path d="M4.2 11.8l7.6-7.6"/></svg>`,
  x: `<svg class="ico" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#16161a" stroke-width="1.5" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>`,
};

// ---------- la fiche (appui long sur Idaho 7) : fiche g1, courte ----------
const lv = Object.fromEntries(H.aromes.map((a) => [a.family, a.level]));
const AXES = FAM;
const ang = (i) => -Math.PI / 2 + i * 2 * Math.PI / AXES.length;
function radarFiche() {
  const r = 52, c = 66, pf = (i, k) => [c + k * r * Math.cos(ang(i)), c + k * r * Math.sin(ang(i))];
  let s = `<svg class="fi-r" data-radar data-objet="fiche" data-axes="${AXES.join(',')}" viewBox="0 0 132 132" width="124" height="124" role="img" aria-label="Silhouette d'Idaho 7 selon sa fiche ; hachuré : non décrit"><defs><pattern id="fi-h" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0v4" stroke="#c9cdd6" stroke-width="1.5"/></pattern></defs>`;
  for (const k of [0.5, 1]) s += `<polygon fill="none" stroke="#e3e5eb" stroke-width="1" points="${AXES.map((f, i) => pf(i, k).map((x) => x.toFixed(1)).join(',')).join(' ')}"/>`;
  AXES.forEach((f, i) => { if (!lv[f]) { const a = pf(i - 0.5, 1), b = pf(i + 0.5, 1); s += `<path fill="url(#fi-h)" d="M${c},${c}L${a[0].toFixed(1)},${a[1].toFixed(1)}L${b[0].toFixed(1)},${b[1].toFixed(1)}Z"/>`; } });
  s += `<polygon fill="${COUL}" fill-opacity=".18" stroke="${COUL}" stroke-width="1.5" points="${AXES.map((f, i) => pf(i, Math.max(0.08, (lv[f] || 0) / 2)).map((x) => x.toFixed(1)).join(',')).join(' ')}"/>`;
  AXES.forEach((f, i) => { const [x, y] = pf(i, 1.17); s += `<use href="#p-${f}" x="${(x - 6).toFixed(1)}" y="${(y - 6).toFixed(1)}" width="12" height="12"/>`; });
  return s + '</svg>';
}
const decrits = H.aromes.filter((a) => a.level > 0).sort((a, b) => b.level - a.level);
const nMots = H.aromes.reduce((s, a) => s + a.mots.reduce((t, m) => t + m.mots.length, 0), 0);
const FICHE = `<section class="fiche" role="dialog" aria-label="Fiche d'Idaho 7" data-role="fiche" data-pour="${NOM}" hidden>
<header class="fi-h"><i class="pt" style="background:${COUL}" aria-hidden="true"></i><h3>${NOM}</h3><span class="us" data-role="usage">mixte</span><small class="gris">rôle déduit de l’α</small><button class="fi-x" type="button" data-role="fermer-fiche" aria-label="Fermer la fiche">${ico.x}</button></header>
<p class="fi-a" data-role="fiche-alpha"><span class="num">α ${fr(alpha, 1)} %</span> lot · fiches <span class="num">${fr(aMin, 1)}–${fr(aMax, 1)} %</span> <small class="gris">Beer Maverick 2023</small></p>
<div class="fi-c">${radarFiche()}<ul class="fi-l">${decrits.map((a) => `<li data-role="fiche-arome">${pic(a.family, 14)}<b style="color:${T[a.family]}">${NOMF[a.family]}</b> <small class="gris">${a.sources}/${a.of} fiche</small> <span>${esc([...new Set(a.mots.flatMap((m) => m.mots))].slice(0, 2).join(', '))}</span></li>`).join('')}</ul></div>
<p class="fi-o"><i class="fi-aut" aria-hidden="true"></i>autres : 0 mot sur ${nMots}, tous rangés · ${FAM.length - decrits.length} familles non décrites (inconnu, pas zéro)</p>
<div class="fi-g" role="group" data-role="gout" aria-label="Mon goût pour ${NOM}"><button type="button" aria-pressed="false" aria-label="Aimer ${NOM}">${ico.coeur}</button><button type="button" aria-pressed="false" aria-label="Exclure ${NOM}">${ico.ban}</button></div>
</section>`;

// ---------- la légende (derrière « ? ») ----------
const LEGENDE = (plus = '') => `<div class="leg" id="leg" data-role="legende" role="dialog" aria-label="Légende" hidden><ul>
<li><b>~</b> simulé par le moteur (pas une mesure) ; <b>≈</b> interpolé entre deux moments calculés ; hachuré : inconnu.</li>
<li>Points sur 100 : l’échelle du panel (Lafontaine 2018). La zone pâle : ce que la 16D admet.</li>
<li><b>★ la réponse</b> : face à ta dégustation (« trop résineuse, je la veux plus florale »), le plus de floral pour le moins de résineux, amertume dans la 16D (50–70 IBU).</li>
<li>Autres mots (hors des 12 familles) : 0 sur ${nMots} pour Idaho 7.</li>${plus}
</ul></div>`;

// ---------- la coque commune ----------
const CTX = `<p class="ctx" data-role="contexte"><span class="fixe">fixé</span><span data-contexte="houblon"><i class="pt" style="background:${COUL}" aria-hidden="true"></i><span class="hb" data-houblon="${NOM}">${NOM}</span> <span class="num" data-role="alpha" data-source="lot">α ${fr(alpha, 1)}%</span> <span class="us" data-role="usage">mixte</span><span class="stk" role="img" aria-label="en stock : 20 g, il en faut 80">${ico.stock}</span></span><span data-contexte="dose">4 g/L</span><span data-contexte="levure">US-05</span><span data-contexte="base">Stout 16D</span></p>`;
const LENTILLE = (plus = '') => `<div class="lent"><button type="button" class="aide" data-role="legende-bouton" aria-expanded="false" aria-controls="leg" aria-label="Lire la légende">?</button>${LEGENDE(plus)}<span class="seg" data-lecture role="radiogroup" aria-label="lecture au style ou absolu"><button type="button" role="radio" aria-checked="true" data-e="style">Au style</button><button type="button" role="radio" aria-checked="false" data-e="absolu">Absolu</button></span></div>`;
const ETAPES = `<nav class="etapes" aria-label="Étapes de Dryhopper"><span class="et on">1 Quand</span><a class="et" href="#levure">2 Levure</a></nav>`;
const PONT_ETAPE = `<nav class="pont" aria-label="Pont"><a href="#levure">Puis la levure ›</a></nav>`;
const PONT_OUTIL = `<nav class="pont" aria-label="Pont vers l’outil Levure"><a class="second" href="#outil-levure"><span>Levure ›</span><small>Pomona : agrumes ~${sg(PO.v.citrus - B.v.citrus)}, floral ~${sg(PO.v.floral - B.v.floral)}</small></a></nav>`;
const SEG = [[0, 44], [44, 52], [52, 76], [76, 100]];
const FRISE = ({ cls = '', reperes = [[22, 'ébullition'], [48, 'WP'], [64, 'actif'], [88, 'après']], dessus = '' } = {}) => `<div class="frise ${cls}" data-libre="moment">${dessus}
  <div class="loupe" aria-hidden="true"></div>
  <div class="rail" role="slider" tabindex="0" aria-label="Moment de l'ajout" aria-valuemin="0" aria-valuemax="${D.length - 1}" aria-valuenow="${BEST}" aria-valuetext="${B.lib}">
  ${SEG.map((s, k) => `<span class="seg-z s${k}" style="left:${s[0]}%;width:${s[1] - s[0]}%"></span>`).join('')}
  <span class="epingle" aria-hidden="true">★ réponse</span>
  <span class="pouce"><span class="pouce-l">${B.lib}</span></span></div>
  <div class="rep">${reperes.map(([x, t]) => `<span style="left:${x}%">${t}</span>`).join('')}</div></div>`;
// Réponse en une phrase : la série B ouvre sur elle.
const PH = {
  quand: 'Dry hop actif, ' + B.j + ' j',
  gain: `${pic('floral', 16)}<span style="color:${T.floral}">floral ~${sg(B.d.floral)}</span> · ${pic('resin', 16)}<span style="color:${T.resin}">résineux ~${sg(B.d.resin)}</span> <span class="gris">(après : ~${sg(A2.d.resin)})</span>`,
};
const REELP = (k, cls = '') => `<p class="reel ${cls}" data-nature="mesure" data-source="${k}"><span class="m">mesuré</span> ${REEL[k].court} <small>${REEL[k].src}</small></p>`;

// ---------- le code client commun ----------
const DONNEES = { D: D.map((p) => ({ id: p.id, lib: p.lib, dit: p.dit, court: p.court, seg: p.seg, j: p.j || null, min: p.min ?? null, v: p.v, lo: p.lo, hi: p.hi, d: p.d, nat: p.nat, ibu: p.ibu, ibuNat: p.ibuNat || null, solde: p.solde })), FAM, NOMF, T, BA, FOND, BANDE, AV, INC, BEST, APRES2, IBU0, IBUMAX, SEG, PO: PO.v };
const CLIENT = String.raw`
var $=function(s,r){return (r||document).querySelector(s)}, $$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
var D=DATA.D, FAM=DATA.FAM, NOMF=DATA.NOMF, T=DATA.T, BA=DATA.BA, FOND=DATA.FOND, BANDE=DATA.BANDE, AV=DATA.AV, INC=DATA.INC, BEST=DATA.BEST, SEG=DATA.SEG, N=D.length-1, ABS=false;
function fr(x,d){ d=d==null?0:d; return (x<0?'−':'')+Math.abs(x).toFixed(d).replace('.',','); }
function sg(x,d){ return (x>=0?'+':'−')+fr(Math.abs(x),d); }
function ti(p){ return p.nat==='simule'?'~':'≈'; }
function pic(f,s){ s=s||16; return '<svg class="pi" width="'+s+'" height="'+s+'" data-famille="'+f+'" aria-label="'+NOMF[f]+'"><use href="#p-'+f+'"/></svg>'; }
function inc(f){ return INC.indexOf(f)>=0; }
function echelle(f,x){ return ABS? x/110 : x/BANDE[f]/2; } /* au style : le haut de la zone de la 16D à mi-piste */
function ecart(i){ var p=D[i], b=D[BEST], t=ti(p);
  if(i===BEST) return '';
  var s='<b>'+p.dit+'</b>, contre ★ : <span style="color:'+T.floral+'">floral '+t+sg(p.d.floral-b.d.floral)+'</span> · <span style="color:'+T.resin+'">résineux '+t+sg(p.d.resin-b.d.resin)+'</span>';
  if(p.ibu!=null){ var tot=DATA.IBU0+p.ibu; s+=' · <span'+(tot>DATA.IBUMAX?' class="alerte"':'')+'>'+(p.ibuNat==='interpole'?'≈':'')+tot+' IBU'+(tot>DATA.IBUMAX?', trop amer':'')+'</span>'; }
  return s; }
function x(i){ var s=D[i].seg, idx=[], k; for(k=0;k<=N;k++) if(D[k].seg===s) idx.push(k); var n=idx.length, a=SEG[s][0], b=SEG[s][1];
  return n===1?(a+b)/2:a+(b-a)*(0.06+0.88*idx.indexOf(i)/(n-1)); }
var frise=$('.frise'), rail=$('.rail'), loupe=$('.loupe');
function cur(){ return +rail.getAttribute('aria-valuenow'); }
function graduations(i){ $$('.cran',rail).forEach(function(c){c.remove();});
  if(!frise.classList.contains('touche')) return;
  D.forEach(function(p,k){ if(p.seg!==D[i].seg) return; var c=document.createElement('i'); c.className='cran'; c.style.left=x(k)+'%'; rail.insertBefore(c, rail.firstChild); });
  loupe.innerHTML=''; var w=loupe.clientWidth, pas=64;
  for(var k=i-2;k<=i+2;k++){ if(k<0||k>N) continue; var s=document.createElement('span'); s.textContent=D[k].court; if(k===i) s.className='ici'; s.style.left=(w/2+(k-i)*pas)+'px'; loupe.appendChild(s); } }
function poser(i){ var p=D[i]; rail.setAttribute('aria-valuenow',i); rail.setAttribute('aria-valuetext',p.lib);
  $('.pouce').style.left=x(i)+'%'; $('.pouce-l').textContent=p.lib; $('.epingle').style.left=x(BEST)+'%';
  var e=$('#ecart'); if(e) e.innerHTML=ecart(i);
  document.body.classList.toggle('hors-reponse', i!==BEST);
  if(window.rendre) window.rendre(i); graduations(i); }
function depuisX(cx, el){ var r=el.getBoundingClientRect(), pct=(cx-r.left)/r.width*100, best=0, bd=1e9;
  for(var k=0;k<=N;k++){ var d=Math.abs(x(k)-pct); if(d<bd){bd=d;best=k;} } if(best!==cur()) poser(best); }
function brancher(el){ el.addEventListener('pointerdown',function(e){ el.setPointerCapture(e.pointerId); frise.classList.add('touche'); depuisX(e.clientX, rail); graduations(cur()); });
  el.addEventListener('pointermove',function(e){ if(e.buttons) depuisX(e.clientX, rail); });
  el.addEventListener('pointerup',function(){ frise.classList.remove('touche'); graduations(cur()); }); }
brancher(rail); $$('[data-scrub]').forEach(brancher);
rail.addEventListener('keydown',function(e){ var i=cur(); if(e.key==='ArrowRight') poser(Math.min(N,i+1)); if(e.key==='ArrowLeft') poser(Math.max(0,i-1)); });
$$('[data-e]').forEach(function(b){ b.addEventListener('click',function(){ $$('[data-e]').forEach(function(z){ z.setAttribute('aria-checked', String(z===b)); }); ABS=b.dataset.e==='absolu'; document.body.classList.toggle('abs',ABS); poser(cur()); }); });
var lb=$('[data-role="legende-bouton"]'), lg=$('[data-role="legende"]');
function legende(o){ lg.hidden=!o; lb.setAttribute('aria-expanded', String(o)); }
lb.addEventListener('click',function(e){ e.stopPropagation(); legende(lg.hidden); });
function fiche(n){ fermer(); var f=$('[data-role="fiche"][data-pour="'+n+'"]'); if(f) f.hidden=false; }
function fermer(){ $$('[data-role="fiche"]').forEach(function(f){ f.hidden=true; }); }
$$('[data-role="fermer-fiche"]').forEach(function(b){ b.addEventListener('click',function(e){ e.stopPropagation(); fermer(); }); });
$$('[data-role="gout"] button').forEach(function(b){ b.addEventListener('click',function(e){ e.stopPropagation(); var on=b.getAttribute('aria-pressed')!=='true'; $$('button',b.parentNode).forEach(function(z){ z.setAttribute('aria-pressed','false'); }); b.setAttribute('aria-pressed', String(on)); }); });
document.addEventListener('keydown',function(e){ if(e.key==='Escape'){ legende(false); fermer(); } });
$$('[data-houblon]').forEach(function(c){ var n=c.getAttribute('data-houblon'), t=null, x0=0, y0=0, hv=null;
  c.addEventListener('contextmenu',function(e){ e.preventDefault(); });
  c.addEventListener('pointerdown',function(e){ if(e.pointerType==='mouse') return; x0=e.clientX; y0=e.clientY; clearTimeout(t); t=setTimeout(function(){ fiche(n); },550); });
  c.addEventListener('pointermove',function(e){ if(t && Math.hypot(e.clientX-x0,e.clientY-y0)>12){ clearTimeout(t); t=null; } });
  ['pointerup','pointercancel'].forEach(function(k){ c.addEventListener(k,function(){ clearTimeout(t); t=null; }); });
  c.addEventListener('pointerenter',function(e){ if(e.pointerType!=='mouse') return; clearTimeout(hv); hv=setTimeout(function(){ fiche(n); },800); });
  c.addEventListener('pointerleave',function(e){ if(e.pointerType==='mouse') clearTimeout(hv); }); });
`;
const DEMARRER = String.raw`
var q=location.search.match(/moment=([^&]+)/), i0=q?D.findIndex(function(p){return p.id===decodeURIComponent(q[1]);}):BEST; poser(i0<0?BEST:i0);
if(/fiche/.test(location.search)) fiche('Idaho 7');
if(/legende/.test(location.search)) legende(true);
if(/absolu/.test(location.search)) $('[data-e="absolu"]').click();
`;

// ---------- le style commun ----------
const CSS = `
:root { --encre:#16161a; --gris:#55555f; --trait:#e3e5eb; --mur:#eef0f4; --acc:#c2410c; --sans:"Source Sans 3",system-ui,-apple-system,"Segoe UI",sans-serif; --mono:"IBM Plex Mono",ui-monospace,Consolas,monospace; }
[hidden] { display:none !important; }
* { box-sizing:border-box; margin:0; padding:0; }
html, body { background:var(--mur); }
body { color:var(--encre); font:400 14px/1.25 var(--sans); -webkit-tap-highlight-color:transparent; }
button { font:inherit; color:inherit; background:none; border:0; cursor:pointer; }
a { color:inherit; text-decoration:none; }
svg { display:block; flex:none; }
.ecran { max-width:390px; margin:0 auto; padding:4px 10px 16px; display:flex; flex-direction:column; gap:8px; }
.barre { display:flex; align-items:center; gap:8px; min-height:40px; }
.retour { width:28px; height:28px; border-radius:50%; background:#fff; border:1px solid var(--trait); display:inline-flex; align-items:center; justify-content:center; flex:none; font:600 20px/1 var(--sans); padding-bottom:2px; }
h1.titre { font:600 17px/1.2 var(--sans); }
.etapes { display:flex; gap:4px; margin-left:auto; }
.etapes .et { display:inline-flex; align-items:center; height:24px; padding:0 8px; border-radius:12px; background:#e2e5eb; font-size:12px; color:var(--gris); }
.etapes .et.on { background:var(--encre); color:#fff; font-weight:600; }
.ctx { display:flex; flex-wrap:wrap; align-items:center; gap:4px; font-size:13px; color:var(--gris); }
.ctx .fixe { font-size:12px; color:var(--gris); margin-right:2px; }
.ctx [data-contexte] { display:inline-flex; align-items:center; gap:4px; height:22px; padding:0 8px; border-radius:11px; background:#e2e5eb; color:var(--encre); }
.ctx .hb { font-weight:600; user-select:none; -webkit-user-select:none; -webkit-touch-callout:none; }
.us { font-size:12px; color:var(--encre); border:1px solid #9a9aa3; border-radius:9px; padding:0 5px; line-height:15px; }
.stk { display:inline-flex; }
.pt { width:10px; height:10px; border-radius:50%; display:inline-block; flex:none; }
.lent { display:flex; justify-content:flex-end; align-items:center; gap:6px; position:relative; }
.seg { display:inline-flex; background:#e2e5eb; border-radius:15px; padding:2px; }
.seg button { height:26px; padding:0 10px; border-radius:13px; font-size:13px; color:var(--gris); }
.seg button[aria-checked="true"] { background:#fff; color:var(--encre); font-weight:600; }
.aide { width:26px; height:26px; border-radius:50%; border:1px solid #c9cad2; background:#fff; font-weight:700; color:var(--gris); margin-right:auto; }
.leg { position:absolute; top:32px; left:0; right:0; z-index:20; background:#fff; border:1px solid #c9cad2; border-radius:8px; padding:8px 10px; font-size:13px; }
.leg ul { list-style:none; display:flex; flex-direction:column; gap:5px; }
.bloc { background:#fff; border-radius:8px; padding:8px 10px; display:flex; flex-direction:column; gap:6px; }
.pi { width:16px; height:16px; }
.num { font-family:var(--mono); font-variant-numeric:tabular-nums; }
.gris { color:var(--gris); }
.alerte { color:var(--acc); font-weight:600; }
.reponse { background:#fff; border-radius:8px; padding:8px 10px; display:flex; flex-direction:column; gap:3px; border-left:4px solid var(--encre); }
.reponse .k { font-size:12px; color:var(--gris); display:flex; align-items:center; gap:3px; }
.reponse .q { font:700 20px/1.15 var(--sans); }
.reponse .g { display:flex; flex-wrap:wrap; align-items:center; gap:4px; font-size:14px; font-weight:600; }
.reponse .g .gris { font-weight:400; font-size:13px; }
.reponse .e { font-size:13px; color:var(--encre); }
.reponse .e:empty { display:none; }
.reel { font-size:12px; color:var(--encre); display:flex; flex-wrap:wrap; gap:0 4px; align-items:baseline; }
.reel .m { font-weight:700; color:#1d6b8a; }
.reel small { color:var(--gris); font-size:12px; }
nav.pont { display:flex; justify-content:flex-end; gap:6px; flex-wrap:wrap; }
nav.pont a { display:inline-flex; flex-direction:column; justify-content:center; min-height:34px; padding:2px 14px; border-radius:17px; background:var(--encre); color:#fff; font-weight:600; font-size:14px; }
nav.pont a.second { background:#fff; color:var(--encre); border:1px solid #c9cad2; border-radius:8px; }
nav.pont a small { font-weight:400; font-size:12px; color:var(--gris); }
/* la frise (le geste de y1b et de la carte) */
.frise { background:#fff; border-radius:8px; padding:30px 18px 6px; touch-action:none; position:relative; }
.rail { position:relative; height:18px; cursor:pointer; }
.seg-z { position:absolute; top:6px; height:6px; border-radius:2px; }
.seg-z.s0 { background:#c9cdd6; } .seg-z.s1 { background:#aeb4c1; } .seg-z.s2 { background:#c9cdd6; } .seg-z.s3 { background:#aeb4c1; }
.cran { position:absolute; top:2px; width:1px; height:14px; background:var(--encre); }
.pouce { position:absolute; top:0; width:18px; height:18px; margin-left:-9px; border-radius:50%; background:var(--encre); z-index:2; }
.pouce-l { position:absolute; bottom:22px; left:50%; transform:translateX(-50%); white-space:nowrap; background:var(--encre); color:#fff; font:600 13px var(--sans); padding:2px 8px; border-radius:11px; }
.epingle { display:none; position:absolute; top:-22px; transform:translateX(-50%); font:600 12px var(--sans); color:var(--encre); white-space:nowrap; }
body.hors-reponse .epingle { display:block; color:#7a4fb5; }
.frise.touche .epingle { display:none !important; }
.frise .rep { position:relative; height:16px; margin-top:16px; font-size:12px; color:var(--gris); }
.frise .rep span { position:absolute; transform:translateX(-50%); white-space:nowrap; }
.loupe { position:absolute; left:8px; right:8px; top:-40px; height:36px; display:none; background:#fff; border:1px solid #c9cad2; border-radius:8px; overflow:hidden; z-index:5; }
.frise.touche .loupe { display:block; }
.frise.touche .pouce-l { visibility:hidden; }
.loupe span { position:absolute; top:4px; transform:translateX(-50%); font:600 13px var(--mono); color:var(--gris); text-align:center; }
.loupe span::after { content:""; display:block; width:1px; height:8px; background:var(--gris); margin:2px auto 0; }
.loupe span.ici { color:#fff; background:var(--encre); padding:0 6px; border-radius:4px; }
.loupe span.ici::after { background:#fff; }
/* la fiche */
.fiche { position:fixed; left:0; right:0; bottom:0; max-width:390px; margin:0 auto; background:#fff; border-radius:8px 8px 0 0; box-shadow:0 -8px 28px rgba(0,0,0,.22); padding:10px 12px 14px; z-index:30; display:flex; flex-direction:column; gap:8px; }
.fi-h { display:flex; align-items:center; gap:6px; }
.fi-h h3 { font-size:18px; font-weight:700; color:${COUL}; }
.fi-h small { font-size:12px; }
.fi-x { margin-left:auto; width:28px; height:28px; display:inline-flex; align-items:center; justify-content:center; border-radius:50%; background:#eef0f4; }
.fi-a { font-size:13px; }
.fi-c { display:flex; gap:8px; align-items:flex-start; }
.fi-l { list-style:none; display:flex; flex-direction:column; gap:3px; font-size:13px; }
.fi-l li { display:flex; align-items:center; gap:4px; flex-wrap:wrap; }
.fi-l small { font-size:12px; }
.fi-o { font-size:12px; color:var(--gris); display:flex; align-items:center; gap:5px; }
.fi-aut { width:24px; height:8px; border-radius:2px; border:1px solid #9a968f; display:inline-block; }
.fi-g { display:flex; gap:8px; }
.fi-g button { width:32px; height:32px; border-radius:50%; border:1px solid #c9cad2; display:inline-flex; align-items:center; justify-content:center; }
.fi-g button[aria-pressed="true"] { background:#e2e5eb; }
`;

// ---------- les concepts ----------
const CONCEPTS = [];
const concept = (c) => CONCEPTS.push(c);

// b1 · froide · y1b et la carte, la réponse posée sur le rail (étape Levure)
concept({
  id: 'b1', chaleur: 'froide', levure: 'étape', nom: 'La carte, réponse épinglée',
  haut: ETAPES,
  corps: () => `<section class="reponse" data-role="reponse" data-nature="simule"><p class="k">Face à ta stout, par ${pic('floral', 14)} floral</p><p class="q">${PH.quand}</p><p class="g">${PH.gain}</p><p class="e" id="ecart"></p></section>
${LENTILLE()}
<section class="bloc b1-ba" id="b1-barres">${FAM.map((f) => `<div class="b1-l" data-f="${f}"><span class="b1-n">${pic(f)}${NOMF[f]}</span><span class="b1-p"><i class="b1-z" data-role="zone"></i><i class="b1-r"></i><i class="b1-t" title=""></i><i class="b1-a"></i></span><span class="b1-v num"></span></div>`).join('')}
<div class="b1-ibu"><span class="b1-n">Amertume</span><span class="b1-j"><i class="b1-jz"></i><i class="b1-jn"></i><i class="b1-ji"></i></span><span class="b1-iv num"></span></div>
${REELP('E08')}</section>
${FRISE({ cls: 'b1-dock' })}
${PONT_ETAPE}`,
  css: `
.b1-ba { gap:3px; }
.b1-l, .b1-ibu { display:grid; grid-template-columns:88px 1fr 44px; align-items:center; gap:6px; font-size:13px; min-height:20px; }
.b1-n { display:flex; align-items:center; gap:4px; }
.b1-p, .b1-j { position:relative; height:12px; background:#f1f2f5; border-radius:2px; }
.b1-p i, .b1-j i { position:absolute; top:0; bottom:0; left:0; display:block; }
.b1-z { width:50%; background:#d9dce3; }
body.abs .b1-z { width:var(--wa); }
.b1-r { height:6px !important; top:3px !important; border-radius:2px; }
.b1-t { width:2px; top:-2px !important; bottom:-2px !important; background:var(--encre); opacity:0; }
body.hors-reponse .b1-t { opacity:1; }
.b1-a { width:8px; height:8px; top:2px !important; border-radius:50%; border:2px solid var(--encre); background:#fff; margin-left:-4px; }
.b1-p.inc { background:repeating-linear-gradient(135deg,#c9cdd6 0 2px,#f1f2f5 2px 6px); }
.b1-v { text-align:right; font-size:12px; }
.b1-jz { background:#d9dce3; }
.b1-jn { background:#7d7d87; height:6px; top:3px !important; }
.b1-ji { background:${COUL}; height:6px; top:3px !important; }
.b1-iv { text-align:right; font-size:12px; }
.b1-dock { position:sticky; bottom:0; z-index:4; box-shadow:0 -1px 0 var(--trait); }
`,
  js: String.raw`
window.rendre=function(i){ var p=D[i], b=D[BEST];
  $$('#b1-barres [data-f]').forEach(function(r){ var f=r.dataset.f, pis=$('.b1-p',r), v=$('.b1-v',r), rem=$('.b1-r',r), t=$('.b1-t',r), a=$('.b1-a',r);
    $('.b1-z',r).style.setProperty('--wa',(BANDE[f]/110*100)+'%');
    if(inc(f)){ pis.classList.add('inc'); rem.hidden=t.hidden=a.hidden=true; v.textContent='?'; v.style.color='#55555f'; return; }
    var w=Math.min(1,echelle(f,p.v[f]))*100, wb=Math.min(1,echelle(f,b.v[f]))*100, wa=Math.min(1,echelle(f,AV[f]))*100;
    rem.style.width=w+'%'; rem.style.background=BA[f]; t.style.left=wb+'%'; a.style.left=wa+'%';
    var hors=p.v[f]>BANDE[f]; v.textContent=Math.abs(p.d[f])>=0.5?ti(p)+sg(p.d[f]):''; v.style.color=hors?'#c2410c':T[f]; });
  var tot=DATA.IBU0+(p.ibu||0), sc=180; $('.b1-jz').style.cssText='left:'+(50/sc*100)+'%;width:'+(20/sc*100)+'%';
  $('.b1-jn').style.width=(60/sc*100)+'%'; $('.b1-ji').style.cssText='left:'+(60/sc*100)+'%;width:'+((p.ibu||0)/sc*100)+'%;background:#5b3fa0';
  var iv=$('.b1-iv'); iv.textContent=p.ibu==null?'tenue':(p.ibuNat==='interpole'?'≈':'')+tot; iv.className='b1-iv num'+(tot>DATA.IBUMAX?' alerte':''); };
`,
});

// b2 · froide · x3b réduit : ma bière → + Idaho 7 → levure ; la frise dit la levure active ou au repos (étape)
concept({
  id: 'b2', chaleur: 'froide', levure: 'étape', nom: 'Ma bière → +1 dry hop (x3b réduit)',
  corps: () => `<section class="reponse" data-role="reponse" data-nature="simule"><p class="q">${PH.quand}</p><p class="g">${PH.gain}</p><p class="e" id="ecart"></p></section>
<nav class="b2-ch" aria-label="Étapes de Dryhopper"><span class="b2-s b2-mb"><i></i>Ma bière</span><span class="b2-f">→</span><span class="b2-s b2-i7"><i></i>+ Idaho 7</span><span class="b2-f">→</span><a class="b2-s b2-lv" href="#levure">Levure ›</a></nav>
${LENTILLE()}
<section class="bloc b2-co" id="b2-co">${FAM.map((f) => `<div class="b2-c" data-f="${f}"><span class="b2-v num"></span><span class="b2-p"><i class="b2-z" data-role="zone"></i><i class="b2-m"></i><i class="b2-r"></i><i class="b2-h"></i></span>${pic(f)}</div>`).join('')}</section>
${FRISE({ cls: 'b2-fr', reperes: [[22, 'ébullition'], [48, 'WP'], [64, 'levure active'], [88, 'au repos']], dessus: '' })}
<p class="reel" data-nature="mesure" data-source="E08"><span class="m">mesuré</span> <i class="b2-cr" aria-hidden="true"></i>${REEL.E08.court} <small>${REEL.E08.src}</small></p>`,
  css: `
.b2-cr { display:inline-block; width:14px; height:6px; border:2px solid #1d6b8a; border-top:0; }
.b2-ch { display:flex; align-items:center; gap:4px; font-size:13px; }
.b2-s { display:inline-flex; align-items:center; gap:5px; height:28px; padding:0 10px; border-radius:14px; background:#fff; border:1px solid var(--trait); font-weight:600; }
.b2-s i { width:12px; height:8px; border-radius:2px; display:inline-block; }
.b2-mb i { background:#9a9aa3; } .b2-i7 i { background:${COUL}; }
.b2-lv { background:var(--encre); color:#fff; border-color:var(--encre); margin-left:auto; }
.b2-f { color:var(--gris); }
.b2-co { flex-direction:row; justify-content:space-between; align-items:flex-end; padding:8px 6px; gap:2px; }
.b2-c { display:flex; flex-direction:column; align-items:center; gap:3px; width:26px; }
.b2-v { font-size:12px; height:15px; white-space:nowrap; }
.b2-p { position:relative; width:14px; height:150px; background:#f1f2f5; border-radius:2px; }
.b2-p i { position:absolute; left:0; right:0; bottom:0; display:block; }
.b2-z { height:50%; background:#d9dce3; }
body.abs .b2-z { height:var(--ha); }
.b2-m { left:-3px !important; right:-3px !important; height:2px; background:#55555f; }
.b2-r { left:3px !important; right:3px !important; border-radius:2px 2px 0 0; }
.b2-h { height:6px; top:0; bottom:auto !important; background:var(--acc); opacity:0; }
.b2-p.hors .b2-h { opacity:1; }
.b2-p.inc { background:repeating-linear-gradient(135deg,#c9cdd6 0 2px,#f1f2f5 2px 6px); }
.b2-fr .seg-z.s2 { background:#bf86d6; } .b2-fr .seg-z.s3 { background:#d9dce3; }
.b2-e08 { position:absolute; top:20px; height:8px; border:2px solid #1d6b8a; border-top:0; border-radius:0 0 2px 2px; }
`,
  js: String.raw`
(function(){ var a=x(D.findIndex(function(p){return p.id==='dryActive|1';})), b=x(D.findIndex(function(p){return p.id==='dryActive|2';})); var e=document.createElement('i'); e.className='b2-e08'; e.setAttribute('aria-hidden','true'); e.style.left=(a-1)+'%'; e.style.width=(b-a+2)+'%'; rail.appendChild(e); })();
window.rendre=function(i){ var p=D[i];
  $$('#b2-co [data-f]').forEach(function(c){ var f=c.dataset.f, pis=$('.b2-p',c), v=$('.b2-v',c), r=$('.b2-r',c), m=$('.b2-m',c);
    $('.b2-z',c).style.setProperty('--ha',(BANDE[f]/110*100)+'%');
    if(inc(f)){ pis.classList.add('inc'); r.hidden=m.hidden=true; v.textContent='?'; v.style.color='#55555f'; return; }
    r.style.height=Math.min(1,echelle(f,p.v[f]))*100+'%'; r.style.background=BA[f]; m.style.bottom=Math.min(1,echelle(f,AV[f]))*100+'%';
    pis.classList.toggle('hors', p.v[f]>BANDE[f]);
    v.textContent=Math.abs(p.d[f])>=0.5?ti(p)+sg(p.d[f]):''; v.style.color=p.v[f]>BANDE[f]?'#c2410c':T[f]; }); };
`,
});

// b3 · tiède · la balance : ce que tu gagnes (floral) contre ce que tu paies (résineux) (pont Levure)
concept({
  id: 'b3', chaleur: 'tiède', levure: 'pont', nom: 'La balance floral / résineux',
  corps: () => `<section class="reponse" data-role="reponse" data-nature="simule"><p class="q">${PH.quand}</p><p class="g">le floral l’emporte le plus sur le résineux</p><p class="e" id="ecart"></p></section>
${LENTILLE()}
<section class="bloc b3-b"><svg class="b3-svg" viewBox="0 0 360 150" width="100%" height="150" role="img" aria-label="Balance : résineux gagné à gauche, floral gagné à droite">
<g class="b3-fleau"><line x1="50" y1="40" x2="310" y2="40" stroke="#16161a" stroke-width="3" stroke-linecap="round"/>
<g class="b3-pg"><line x1="50" y1="40" x2="50" y2="64" stroke="#55555f" stroke-width="1.5"/></g><g class="b3-pd"><line x1="310" y1="40" x2="310" y2="64" stroke="#55555f" stroke-width="1.5"/></g></g>
<path d="M180 40 L166 120 L194 120 Z" fill="none" stroke="#16161a" stroke-width="2" stroke-linejoin="round"/><line x1="140" y1="120" x2="220" y2="120" stroke="#16161a" stroke-width="2" stroke-linecap="round"/>
</svg>
<div class="b3-plat b3-g" data-f="resin"><span class="b3-pt">${pic('resin', 20)}<b style="color:${T.resin}">Résineux</b></span><span class="b3-n num"></span><span class="b3-j"><i class="b3-z" data-role="zone"></i><i class="b3-av"></i><i class="b3-r" style="background:${BA.resin}"></i></span></div>
<div class="b3-plat b3-d" data-f="floral"><span class="b3-pt">${pic('floral', 20)}<b style="color:${T.floral}">Floral</b></span><span class="b3-n num"></span><span class="b3-j"><i class="b3-z" data-role="zone"></i><i class="b3-av"></i><i class="b3-r" style="background:${BA.floral}"></i></span></div>
<p class="b3-solde"><span class="gris">solde</span> <b class="num" id="b3-s"></b></p>
<div class="b3-reste" id="b3-reste"></div>
${REELP('E03')}</section>
${FRISE()}
${PONT_OUTIL}`,
  css: `
.b3-b { position:relative; padding-bottom:10px; }
.b3-svg { overflow:visible; }
.b3-fleau { transition:transform .25s; transform-origin:180px 40px; }
.b3-plat { position:absolute; top:76px; width:128px; display:flex; flex-direction:column; align-items:center; gap:2px; background:#fff; border:1px solid var(--trait); border-radius:8px; padding:4px 6px; transition:transform .25s; }
.b3-g { left:14px; } .b3-d { right:14px; }
.b3-pt { display:flex; align-items:center; gap:4px; font-size:14px; }
.b3-n { font-size:18px; font-weight:700; }
.b3-j { position:relative; width:100%; height:8px; background:#f1f2f5; border-radius:2px; }
.b3-j i { position:absolute; top:0; bottom:0; left:0; display:block; }
.b3-z { background:#d9dce3; }
.b3-r { height:4px; top:2px !important; border-radius:2px; }
.b3-av { width:2px; background:var(--encre); z-index:1; top:-2px !important; bottom:-2px !important; }
.b3-solde { text-align:center; font-size:14px; margin-top:-6px; }
.b3-reste { display:flex; flex-wrap:wrap; justify-content:center; gap:4px 10px; font-size:12px; }
.b3-reste span { display:inline-flex; align-items:center; gap:3px; }
`,
  js: String.raw`
window.rendre=function(i){ var p=D[i], t=ti(p), sol=p.d.floral-p.d.resin, a=Math.max(-14,Math.min(14,sol*1.6));
  $('.b3-fleau').style.transform='rotate('+a+'deg)';
  var dy=Math.sin(a*Math.PI/180)*130; $('.b3-g').style.transform='translateY('+(-dy)+'px)'; $('.b3-d').style.transform='translateY('+dy+'px)';
  ['resin','floral'].forEach(function(f){ var c=$('.b3-plat[data-f="'+f+'"]'); $('.b3-n',c).textContent=t+sg(p.d[f]); $('.b3-n',c).style.color=p.v[f]>BANDE[f]?'#c2410c':T[f];
    var sc=ABS?110:BANDE[f]*2; $('.b3-z',c).style.width=Math.min(100,BANDE[f]/sc*100)+'%'; $('.b3-av',c).style.left=Math.min(100,AV[f]/sc*100)+'%'; $('.b3-r',c).style.width=Math.min(100,p.v[f]/sc*100)+'%'; });
  $('#b3-s').textContent=t+sg(sol); $('#b3-s').style.color=sol>=0?T.floral:T.resin;
  $('#b3-reste').innerHTML=FAM.filter(function(f){ return f!=='floral'&&f!=='resin'&&!inc(f)&&Math.abs(p.d[f])>=0.5; }).map(function(f){ return '<span>'+pic(f,14)+'<b style="color:'+T[f]+'">'+t+sg(p.d[f])+'</b></span>'; }).join('')||'<span class="gris">le reste ne bouge pas</span>'; };
`,
});

// b4 · tiède · le classement des moments, la réponse en tête (pont Levure)
const RANG = ['dryActive|' + B.j, 'dryPost|2', 'wp', 'b10', 'b60'].map((id) => D.findIndex((p) => p.id === id)).sort((a, b) => D[b].solde - D[a].solde);
concept({
  id: 'b4', chaleur: 'tiède', levure: 'pont', nom: 'Le podium des moments',
  corps: () => `<section class="reponse" data-role="reponse" data-nature="simule"><p class="k">Le meilleur moment pour ta stout</p><p class="q">${PH.quand}</p><p class="e" id="ecart"></p></section>
${LENTILLE()}
<section class="bloc b4-l" id="b4-l"><div class="b4-t"><span></span><span class="b4-h">${pic('floral', 14)}floral</span><span class="b4-h">${pic('resin', 14)}résineux</span><span class="b4-h">IBU</span></div>
${RANG.map((k, r) => { const p = D[k]; const tot = p.ibu == null ? null : IBU0 + p.ibu; return `<div class="b4-r${k === BEST ? ' b4-best' : ''}" data-i="${k}"><span class="b4-m"><b class="b4-k num">${k === BEST ? '★' : r + 1}</b>${p.lib}</span>
<span class="b4-b" data-f="floral"><i class="b4-z" data-role="zone"></i><i class="b4-x" style="width:${Math.min(100, p.d.floral / 30 * 100)}%;background:${BA.floral}"></i><em class="num" style="color:${T.floral}">~${sg(p.d.floral)}</em></span>
<span class="b4-b" data-f="resin"><i class="b4-z" data-role="zone"></i><i class="b4-x" style="width:${Math.min(100, p.d.resin / 30 * 100)}%;background:${BA.resin}"></i><em class="num" style="color:${p.v.resin > BANDE.resin ? '#c2410c' : T.resin}">~${sg(p.d.resin)}</em></span>
<span class="b4-i num${tot > IBUMAX ? ' alerte' : ''}">${tot == null ? 'tenue' : tot}</span></div>`; }).join('')}
<div class="b4-r b4-toi" id="b4-toi" hidden></div>
<p class="reel" data-nature="mesure" data-source="E07"><span class="m">mesuré</span> 60′ ${REEL.E07.court} <small>${REEL.E07.src}</small></p></section>
${FRISE()}
${PONT_OUTIL}`,
  css: `
.b4-l { gap:4px; }
.b4-t, .b4-r { display:grid; grid-template-columns:104px 1fr 1fr 38px; gap:6px; align-items:center; font-size:13px; }
.b4-t { font-size:12px; color:var(--gris); }
.b4-h { display:flex; align-items:center; gap:3px; }
.b4-r { min-height:34px; padding:2px 4px; border-radius:8px; border:2px solid transparent; }
.b4-r.on { border-color:var(--encre); }
.b4-best { background:#f6f0fa; }
.b4-m { display:flex; align-items:center; gap:6px; font-weight:600; }
.b4-k { width:20px; height:20px; border-radius:50%; background:#e2e5eb; display:inline-flex; align-items:center; justify-content:center; font-size:12px; flex:none; }
.b4-best .b4-k { background:var(--encre); color:#fff; }
.b4-b { position:relative; height:22px; display:flex; align-items:center; }
.b4-b i { position:absolute; left:0; top:7px; height:8px; border-radius:2px; display:block; }
.b4-z { width:100%; background:#f1f2f5; }
body.abs .b4-z { background:#f7f7f9; }
.b4-b em { position:relative; margin-left:auto; font-style:normal; font-size:12px; font-weight:700; background:rgba(255,255,255,.9); padding:0 2px; border-radius:2px; }
.b4-i { text-align:right; font-size:12px; }
.b4-toi { background:#fff; border-color:var(--encre); }
`,
  js: String.raw`
window.rendre=function(i){ $$('#b4-l .b4-r[data-i]').forEach(function(r){ r.classList.toggle('on', +r.dataset.i===i); });
  var toi=$('#b4-toi'), p=D[i]; if($('#b4-l .b4-r[data-i="'+i+'"]')){ toi.hidden=true; return; }
  var t=ti(p), tot=p.ibu==null?null:DATA.IBU0+p.ibu;
  toi.innerHTML='<span class="b4-m"><b class="b4-k num">·</b>'+p.lib+'</span>'+['floral','resin'].map(function(f){ return '<span class="b4-b" data-f="'+f+'"><i class="b4-z" data-role="zone"></i><i class="b4-x" style="width:'+Math.min(100,p.d[f]/30*100)+'%;background:'+BA[f]+'"></i><em class="num" style="color:'+(f==='resin'&&p.v[f]>BANDE[f]?'#c2410c':T[f])+'">'+t+sg(p.d[f])+'</em></span>'; }).join('')+'<span class="b4-i num'+(tot>DATA.IBUMAX?' alerte':'')+'">'+(tot==null?'tenue':(p.ibuNat==='interpole'?'≈':'')+tot)+'</span>';
  toi.hidden=false; };
`,
});

// b5 · tiède · la courbe : le pic floral au-dessus de la frise ; on gratte la courbe elle-même (étape)
concept({
  id: 'b5', chaleur: 'tiède', levure: 'étape', nom: 'La courbe et son pic',
  haut: ETAPES,
  corps: () => `<section class="reponse" data-role="reponse" data-nature="simule"><p class="q">${PH.quand}</p><p class="g">le floral plafonne là ; au-delà, rien de plus</p><p class="e" id="ecart"></p></section>
${LENTILLE()}
<section class="bloc b5-c"><div class="b5-w" data-scrub><svg class="b5-svg" id="b5-svg" viewBox="0 0 354 200" width="100%" height="200" preserveAspectRatio="none" role="img" aria-label="Floral et résineux selon le moment d’ajout"></svg>
<span class="b5-lab b5-lf" style="color:${T.floral}">${pic('floral', 14)}floral</span><span class="b5-lab b5-lr" style="color:${T.resin}">${pic('resin', 14)}résineux <em class="alerte">hors 16D</em></span><span class="b5-pic" id="b5-pic">★</span><span class="b5-zt" data-role="zone">zone florale de la 16D</span></div>
<div class="b5-reels">${REELP('E08')}${REELP('E10')}</div></section>
${FRISE({ cls: 'b5-fr' })}
${PONT_ETAPE}`,
  css: `
.b5-c { padding:8px 0 6px; }
.b5-w { position:relative; margin:0 18px; touch-action:none; cursor:pointer; }
.b5-svg { overflow:visible; }
.b5-lab { position:absolute; display:inline-flex; align-items:center; gap:3px; font-size:12px; font-weight:700; background:rgba(255,255,255,.85); border-radius:2px; padding:0 2px; }
.b5-pic { position:absolute; transform:translate(-50%,-100%); font-size:14px; font-weight:700; color:var(--encre); }
.b5-zt { position:absolute; left:0; font-size:12px; color:var(--gris); }
.b5-reels { padding:0 10px; display:flex; flex-direction:column; gap:2px; }
.b5-fr { padding-top:30px; }
`,
  js: String.raw`
var W=354, Hh=200, svg=$('#b5-svg');
function X(i){ return x(i)/100*W; }
function Y(v){ var m=ABS?110:Math.max(BANDE.resin*4,110); return Hh-Math.min(1,v/m)*Hh; }
function lignes(f){ var s='', pre=null; D.forEach(function(p,k){ var pt=X(k).toFixed(1)+','+Y(p.v[f]).toFixed(1); s+=(k?' L':'M')+pt; }); return s; }
window.rendre=function(i){ var p=D[i], h='';
  var zf=Y(BANDE.floral), zr=Y(BANDE.resin);
  h+='<rect x="0" y="'+zf+'" width="'+W+'" height="'+(Hh-zf)+'" fill="#f3e8f7"/>';
  [0,1,2,3].forEach(function(s){ var a=SEG[s][0]/100*W; if(s) h+='<line x1="'+a+'" x2="'+a+'" y1="0" y2="'+Hh+'" stroke="#e3e5eb" stroke-width="1"/>'; });
  var ib=D.findIndex(function(q){return q.id==='b60';}), i10=D.findIndex(function(q){return q.id==='b10';});
  h+='<rect x="'+X(ib+1)+'" y="0" width="'+(X(i10-1)-X(ib+1))+'" height="'+zf+'" fill="#f7f7f9"/>';
  h+='<text x="'+((X(ib+1)+X(i10-1))/2)+'" y="14" text-anchor="middle" font-size="12" fill="#55555f">≈ interpolé</text>';
  ['resin','floral'].forEach(function(f){ h+='<path d="'+lignes(f)+'" fill="none" stroke="'+(f==='floral'?BA.floral:BA.resin)+'" stroke-width="'+(f==='floral'?3:2)+'" stroke-linejoin="round"/>'; });
  h+='<line x1="'+X(i)+'" x2="'+X(i)+'" y1="0" y2="'+Hh+'" stroke="#16161a" stroke-width="1.5"/>';
  ['resin','floral'].forEach(function(f){ h+='<circle cx="'+X(i)+'" cy="'+Y(p.v[f])+'" r="5" fill="#fff" stroke="'+(f==='floral'?'#9840bc':'#2f6b5f')+'" stroke-width="2.5"/>'; });
  h+='<circle cx="'+X(BEST)+'" cy="'+Y(D[BEST].v.floral)+'" r="3" fill="#16161a"/>';
  svg.innerHTML=h;
  var w=$('.b5-w'), sx=w.clientWidth/W, sy=200/Hh;
  $('.b5-lf').style.cssText='left:'+(X(N)*sx-62)+'px;top:'+(Y(D[N].v.floral)*sy+6)+'px;color:#9840bc';
  $('.b5-lr').style.cssText='left:'+(X(N)*sx-140)+'px;top:'+(Y(D[N].v.resin)*sy-20)+'px;color:#2f6b5f';
  $('#b5-pic').style.cssText='left:'+(X(BEST)*sx)+'px;top:'+(Y(D[BEST].v.floral)*sy-4)+'px';
  $('.b5-zt').style.top=(zf*sy+2)+'px'; };
`,
});

// b6 · tiède · le radar face à ta stout (acquis m4 / h4, sans légende écrite) (pont Levure)
concept({
  id: 'b6', chaleur: 'tiède', levure: 'pont', nom: 'Le radar face à ta stout',
  corps: () => `<section class="reponse" data-role="reponse" data-nature="simule"><p class="q">${PH.quand}</p><p class="g">${PH.gain}</p><p class="e" id="ecart"></p></section>
${LENTILLE()}
<section class="bloc b6-b"><div data-acquis="radar"><svg id="b6-r" class="b6-r" viewBox="0 0 300 300" width="300" height="300" data-radar data-axes="${FAM.join(',')}" role="img" aria-label="Radar : ta stout (gris) et avec Idaho 7 (violet)"></svg></div>
${REELP('E03')}</section>
${FRISE()}
${PONT_OUTIL}`,
  css: `
.b6-b { align-items:center; padding:4px 8px 8px; }
.b6-r { overflow:visible; }
.b6-b .reel { align-self:stretch; }
`,
  js: String.raw`
var R=96, c=150; function ang(k){ return -Math.PI/2+k*2*Math.PI/FAM.length; }
function rv(f,v){ return ABS? Math.min(1.2,Math.sqrt(v/110)) : Math.min(1.2, Math.sqrt(v/BANDE[f])*0.6); }
function pf(k,r){ return [(c+r*R*Math.cos(ang(k))).toFixed(1),(c+r*R*Math.sin(ang(k))).toFixed(1)]; }
function poly(vals){ return FAM.map(function(f,k){ return pf(k,vals[k]).join(','); }).join(' '); }
window.rendre=function(i){ var p=D[i], b=D[BEST], h='<defs><pattern id="b6-hh" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0v5" stroke="#c9cdd6" stroke-width="2"/></pattern></defs>';
  [0.6,1.2].forEach(function(k){ h+='<polygon points="'+poly(FAM.map(function(){return k;}))+'" fill="none" stroke="#e3e5eb" stroke-width="1"/>'; });
  h+='<polygon data-role="zone" points="'+poly(FAM.map(function(f){ return ABS?Math.sqrt(BANDE[f]/110):0.6; }))+'" fill="#eef0f4" stroke="#c9cdd6" stroke-width="1"/>';
  FAM.forEach(function(f,k){ if(inc(f)){ var a=pf(k-0.5,1.2), z=pf(k+0.5,1.2); h+='<path d="M'+c+','+c+'L'+a.join(',')+'L'+z.join(',')+'Z" fill="url(#b6-hh)"/>'; } });
  h+='<g data-serie="biere" data-valeurs="'+FAM.map(function(f){ return inc(f)?0:rv(f,AV[f]).toFixed(3); }).join(',')+'"><polygon points="'+poly(FAM.map(function(f){ return inc(f)?0:rv(f,AV[f]); }))+'" fill="none" stroke="#7d7d87" stroke-width="2"/></g>';
  if(i!==BEST) h+='<polygon data-serie="reponse" points="'+poly(FAM.map(function(f){ return inc(f)?0:rv(f,b.v[f]); }))+'" fill="none" stroke="#16161a" stroke-width="1"/>';
  h+='<g data-serie="idaho7" data-valeurs="'+FAM.map(function(f){ return inc(f)?0:rv(f,p.v[f]).toFixed(3); }).join(',')+'"><polygon points="'+poly(FAM.map(function(f){ return inc(f)?0:rv(f,p.v[f]); }))+'" fill="#bf86d6" fill-opacity=".35" stroke="#9840bc" stroke-width="2"/></g>';
  FAM.forEach(function(f,k){ var q=pf(k,1.38); h+='<use href="#p-'+f+'" x="'+(q[0]-9)+'" y="'+(q[1]-9)+'" width="18" height="18"/>';
    if(!inc(f) && Math.abs(p.d[f])>=0.5){ var t=pf(k,1.38); var dy=(t[1]>c?22:-13); h+='<text x="'+t[0]+'" y="'+(+t[1]+dy)+'" text-anchor="middle" font-size="12" font-weight="700" fill="'+(p.v[f]>BANDE[f]?'#c2410c':T[f])+'">'+ti(p)+sg(p.d[f])+'</text>'; } });
  $('#b6-r').innerHTML=h; };
`,
});

// b7 · tiède · le plan floral × résineux : chaque moment est un point, la réponse est le plus haut à gauche (pont Levure)
concept({
  id: 'b7', chaleur: 'tiède', levure: 'pont', nom: 'Le plan floral × résineux',
  corps: () => `<section class="reponse" data-role="reponse" data-nature="simule"><p class="q">${PH.quand}</p><p class="g">le plus de ${pic('floral', 16)}<span style="color:${T.floral}">floral</span> pour le moins de ${pic('resin', 16)}<span style="color:${T.resin}">résineux</span></p><p class="e" id="ecart"></p></section>
${LENTILLE()}
<section class="bloc b7-b"><div class="b7-w"><svg id="b7-p" class="b7-p" viewBox="0 0 340 250" width="100%" height="250" role="img" aria-label="Plan : résineux en largeur, floral en hauteur ; un point par moment"></svg></div>
${REELP('E10')}</section>
${FRISE()}
${PONT_OUTIL}`,
  css: `
.b7-b { padding:6px 6px 8px; }
.b7-p { overflow:visible; }
`,
  js: String.raw`
var W=340, Hh=250, x0=44, y0=226, x1=330, y1=16;
function RX(v){ var a=ABS?78:78, b=106; return x0+(v-a)/(b-a)*(x1-x0); }
function FY(v){ var m=ABS?32:32; return y0-(v/m)*(y0-y1); }
window.rendre=function(i){ var p=D[i], b=D[BEST], h='';
  h+='<rect x="'+x0+'" y="'+y1+'" width="'+(x1-x0)+'" height="'+(y0-y1)+'" fill="#fff" stroke="#e3e5eb"/>';
  h+='<rect data-role="zone" x="'+(x0-30)+'" y="'+y1+'" width="22" height="'+(y0-y1)+'" fill="#d9dce3"/>';
  h+='<text x="'+(x0-19)+'" y="'+(y1+12)+'" text-anchor="middle" font-size="12" fill="#55555f">16D</text>';
  h+='<text x="'+(x0-19)+'" y="'+(y0+16)+'" text-anchor="middle" font-size="12" fill="#55555f">≤30</text>';
  h+='<path d="M'+(x0-6)+' '+(y0+4)+'l4 -8M'+(x0-2)+' '+(y0+4)+'l4 -8" stroke="#55555f" stroke-width="1.5"/>';
  h+='<rect x="'+x0+'" y="'+y1+'" width="'+(RX(84)-x0)+'" height="'+(y0-y1)+'" fill="#f3e8f7" opacity=".6"/>';
  h+='<text x="'+(x0+6)+'" y="'+(y1+16)+'" font-size="12" font-weight="700" fill="#9840bc">↖ ta demande</text>';
  h+='<text x="'+x1+'" y="'+(y0+16)+'" text-anchor="end" font-size="12" fill="#2f6b5f">résineux →</text>';
  h+='<text x="'+(x0+4)+'" y="'+(y0-6)+'" font-size="12" fill="#9840bc">↑ floral</text>';
  var seq=D.map(function(q,k){return k;}), path='M'+RX(AV.resin)+' '+FY(AV.floral);
  seq.forEach(function(k){ path+=' L'+RX(D[k].v.resin).toFixed(1)+' '+FY(D[k].v.floral).toFixed(1); });
  h+='<path d="'+path+'" fill="none" stroke="#c9cdd6" stroke-width="1.5"/>';
  D.forEach(function(q,k){ if(q.nat!=='simule') return; h+='<circle cx="'+RX(q.v.resin)+'" cy="'+FY(q.v.floral)+'" r="4" fill="'+['#c9cdd6','#aeb4c1','#bf86d6','#2f6b5f'][q.seg]+'"/>'; });
  h+='<circle cx="'+RX(AV.resin)+'" cy="'+FY(AV.floral)+'" r="6" fill="#fff" stroke="#55555f" stroke-width="2"/><text x="'+(RX(AV.resin)+10)+'" y="'+(FY(AV.floral)+16)+'" font-size="12" fill="#55555f">ta stout</text>';
  h+='<circle cx="'+RX(DATA.PO.resin)+'" cy="'+FY(DATA.PO.floral)+'" r="6" fill="#fff" stroke="#2563eb" stroke-width="2"/><text x="'+(RX(DATA.PO.resin)+9)+'" y="'+(FY(DATA.PO.floral)+4)+'" font-size="12" fill="#2563eb">avec Pomona</text>';
  h+='<text x="'+(RX(b.v.resin))+'" y="'+(FY(b.v.floral)-12)+'" text-anchor="middle" font-size="14" font-weight="700" fill="#16161a">★</text>';
  [['wp','WP · 10′'],['b60','60′'],['dryPost|2','après']].forEach(function(z){ var q=D[D.findIndex(function(o){return o.id===z[0];})]; h+='<text x="'+(RX(q.v.resin)+(z[0]==='dryPost|2'?-8:8))+'" y="'+(FY(q.v.floral)+(z[0]==='b60'?-8:4))+'" text-anchor="'+(z[0]==='dryPost|2'?'end':'start')+'" font-size="12" fill="#55555f">'+z[1]+'</text>'; });
  h+='<circle cx="'+RX(p.v.resin)+'" cy="'+FY(p.v.floral)+'" r="8" fill="#5b3fa0" stroke="#fff" stroke-width="2"/>';
  $('#b7-p').innerHTML=h; };
`,
});

// b8 · tiède · la carte de chaleur : douze familles × tous les moments, la colonne de la réponse cerclée (étape)
concept({
  id: 'b8', chaleur: 'tiède', levure: 'étape', nom: 'La carte de chaleur des moments',
  haut: ETAPES,
  corps: () => `<section class="reponse" data-role="reponse" data-nature="simule"><p class="q">${PH.quand}</p><p class="g">la colonne la plus florale, la moins résineuse</p><p class="e" id="ecart"></p></section>
${LENTILLE()}
<section class="bloc b8-b"><div class="b8-g" id="b8-g"></div>${REELP('E07')}</section>
${FRISE({ cls: 'b8-fr' })}
${PONT_ETAPE}`,
  css: `
.b8-b { padding:6px 0 8px; }
.b8-g { position:relative; display:grid; grid-template-columns:22px 1fr 40px; row-gap:2px; padding:0 4px; }
.b8-f { display:flex; align-items:center; height:17px; }
.b8-row { position:relative; height:17px; margin:0 14px; }
.b8-row i { position:absolute; top:1px; bottom:1px; display:block; border-radius:2px; }
.b8-row i.inc { background:repeating-linear-gradient(135deg,#c9cdd6 0 2px,#f1f2f5 2px 5px); }
.b8-row i.hors { box-shadow:inset 0 -3px 0 #c2410c; }
.b8-v { font-size:12px; text-align:right; height:17px; line-height:17px; }
.b8-col { position:absolute; top:-3px; bottom:-3px; border:2px solid var(--encre); border-radius:4px; pointer-events:none; }
.b8-col.rep { border-color:#9840bc; }
.b8-zone { grid-column:1 / -1; font-size:12px; color:var(--gris); padding:0 4px 2px; display:flex; justify-content:space-between; }
.b8-b .reel { padding:0 10px; margin-top:4px; }
`,
  js: String.raw`
window.rendre=function(i){ var g=$('#b8-g'), h='';
  FAM.forEach(function(f){ h+='<span class="b8-f">'+pic(f,16)+'</span><div class="b8-row" data-f="'+f+'" data-scrub>';
    D.forEach(function(p,k){ var w=k<N?(x(k+1)-x(k)):(x(k)-x(k-1)); var l=x(k)-w/2;
      if(inc(f)){ h+='<i class="inc" style="left:'+l+'%;width:'+w+'%"></i>'; return; }
      var a=Math.max(0.06,Math.min(1,ABS?p.v[f]/110:p.v[f]/BANDE[f]));
      h+='<i class="'+(p.v[f]>BANDE[f]?'hors':'')+'" style="left:'+l+'%;width:'+(w+0.3)+'%;background:'+BA[f]+';opacity:'+a.toFixed(2)+'"></i>'; });
    var p=D[i]; h+='</div><span class="b8-v num" style="color:'+(inc(f)?'#55555f':p.v[f]>BANDE[f]?'#c2410c':T[f])+'">'+(inc(f)?'?':Math.abs(p.d[f])>=0.5?ti(p)+sg(p.d[f]):'')+'</span>'; });
  var ib=D.findIndex(function(q){return q.id==='b55';}), i10=D.findIndex(function(q){return q.id==='b15';});
  g.innerHTML='<span class="b8-zone" data-role="zone"><span>≈ interpolé de 55′ à 15′</span><span>'+(ABS?'plein = 110 points':'plein = haut de la 16D')+'</span></span>'+h;
  var rows=$$('.b8-row',g), top=rows[0].offsetTop, bot=rows[rows.length-1].offsetTop+17, left=rows[0].offsetLeft, W=rows[0].clientWidth;
  [[BEST,'rep'],[i,'']].forEach(function(z){ if(z[1]===''&&i===BEST) return; var w=(z[0]<N?x(z[0]+1)-x(z[0]):x(z[0])-x(z[0]-1))/100*W; var c=document.createElement('span'); c.className='b8-col '+z[1]; c.style.cssText='left:'+(left+x(z[0])/100*W-w/2-2)+'px;width:'+(w+4)+'px;top:'+(top-3)+'px;height:'+(bot-top+6)+'px'; g.appendChild(c); });
  $$('[data-scrub]',g).forEach(function(el){ if(!el._b){ el._b=1; brancher(el);} }); };
`,
});

// ---------- écriture ----------
for (const c of CONCEPTS) {
  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dryhopper ${c.id} · ${esc(c.nom)}</title>
<style>${CSS}${c.css}</style></head>
<body data-concept="${c.id}" data-chaleur="${c.chaleur}">
${SYMBOLES}
<main class="ecran">
<header class="barre"><a class="retour" aria-label="Retour" href="#">‹</a><h1 class="titre">Quand ajouter Idaho 7 ?</h1>${c.haut || ''}</header>
${CTX}
${c.corps()}
</main>
${FICHE}
<script>var DATA=${JSON.stringify(DONNEES)};
${CLIENT}
${c.js}
${DEMARRER}</script>
</body></html>
`;
  fs.mkdirSync(path.join(ici, c.id), { recursive: true });
  fs.writeFileSync(path.join(ici, c.id, 'etat.html'), html);
}
fs.writeFileSync(path.join(ici, 'captures', 'travail', 'resume.json'), JSON.stringify({ BEST: D[BEST].id, solde: D.map((p) => [p.id, p.solde, p.nat, p.ibu]), A2: A2.id, PO: { floral: PO.v.floral, citrus: PO.v.citrus }, REEL }, null, 1));
console.log('écrit :', CONCEPTS.map((c) => c.id).join(' '), '· réponse :', D[BEST].lib, '· solde', D[BEST].solde, '· floral ~' + sg(B.d.floral), 'résineux ~' + sg(B.d.resin));
