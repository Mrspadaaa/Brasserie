// Série F du lot 23 (Dryhopper, « Quand ajouter Idaho 7 ? ») : huit concepts chauds, forme libre, sur la
// baseline. Un seul facteur libre : le moment (D98). Données : la grille d'Idaho 7 à 4 g/L (US-05 et
// Pomona) de fils21-choisir/donnees/profils-simules.json, les IBU par gramme du pack, les études E03,
// E05, E07, E08, E10 de comparatifs-dryhop.json (lues à la main, recopiées ci-dessous avec leur id).
// Usage : node generer-f.mjs  → f1/etat.html … f8/etat.html. Les classes sont préfixées par l'id (L26) ;
// le code client est assemblé par split/join, jamais par String.replace.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const ECRAN = path.resolve(ici, '../..');
const RACINE = path.resolve(ici, '../../../../../..');
const profils = JSON.parse(fs.readFileSync(path.join(ECRAN, 'fils21-choisir/donnees/profils-simules.json'), 'utf8'));
const pack = JSON.parse(fs.readFileSync(path.join(RACINE, 'prototypes/houblons-v4/data/pack-fiches.json'), 'utf8'));
const carte = fs.readFileSync(path.join(ECRAN, 'fils22-carte/dryhopper/etat.html'), 'utf8');
const PICTOS = carte.split('\n').find((l) => l.includes('<symbol id="p-floral"'));
const idaho = pack.fichesHoublons.find((h) => h.name === 'Idaho 7');

// ---------- données ----------
const FAM = ['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'stoneFruit', 'pomeFruit', 'berries', 'melon', 'resin', 'spice', 'green'];
const NOM = { floral: 'Floral', herbal: 'Herbacé', earthy: 'Terreux', citrus: 'Agrumes', tropical: 'Tropicaux', stoneFruit: 'Noyau', pomeFruit: 'Pépins', berries: 'Baies', melon: 'Melon', resin: 'Résineux', spice: 'Épicé', green: 'Végétal' };
const T = { citrus: '#856e0c', tropical: '#9b5d0d', melon: '#357a5b', stoneFruit: '#b5481c', pomeFruit: '#667623', berries: '#9b3f74', floral: '#9840bc', green: '#4f7a2b', herbal: '#377853', spice: '#7a4e3a', earthy: '#75694d', resin: '#2f6b5f' };
const BA = { citrus: '#d9b414', tropical: '#ee9b2f', melon: '#6fc09b', stoneFruit: '#e88d68', pomeFruit: '#a3bd38', berries: '#9b3f74', floral: '#bf86d6', green: '#6aa33a', herbal: '#3f8a5f', spice: '#7a4e3a', earthy: '#9a8a66', resin: '#2f6b5f' };
const BANDE = {}; for (const f of FAM) BANDE[f] = profils.style.zone[f].bande[1];
// Ma bière avant (stout 16D S1, Nugget 60′, dégustation : résineux marqué = 83) : lue sur la carte Dryhopper.
const AV = { citrus: 1.07, tropical: 0.52, stoneFruit: 0, pomeFruit: 0, berries: 0, melon: 0, floral: 1.58, herbal: 0.38, resin: 83, spice: 0.65, green: 0.37, earthy: 0.26 };
const grille = profils.grille.filter((e) => e.nom === 'Idaho 7' && e.dose_gL === 4);
const entree = (moment, jours, levure) => grille.find((e) => e.moment === moment && (e.jours ?? null) === jours && e.levure === levure);
const vals = (e) => { const v = {}, haut = {}, hp = {}; for (const f of FAM) { const a = e.apres[f]; v[f] = a[1]; haut[f] = a[2]; hp[f] = !!a[5]; } return { v, haut, hp, confiance: e.confiance }; };
const ibuG = {}; for (const m of idaho.ibuParGramme.moments) if (m.ibuPerGram && m.ibuPerGram.value != null) ibuG[m.code] = m.ibuPerGram.value;
const GRAMMES = 4 * 20; // 4 g/L dans 20 L
const ibuA = (code) => (ibuG[code] != null ? Math.round(ibuG[code] * GRAMMES) : null);
const D = [];
const b60 = vals(entree('b60', null, 'fermentis-us05')), b10 = vals(entree('b10', null, 'fermentis-us05'));
for (let m = 60; m >= 10; m -= 5) {
  const t = (60 - m) / 50; const v = {}, haut = {}, hp = {};
  for (const f of FAM) { v[f] = +(b60.v[f] + (b10.v[f] - b60.v[f]) * t).toFixed(2); haut[f] = +(b60.haut[f] + (b10.haut[f] - b60.haut[f]) * t).toFixed(1); hp[f] = b60.hp[f]; }
  const code = 'b' + m; let ibu = ibuA(code);
  if (ibu == null) { // interpolation entre les points publiés du pack
    const pts = Object.keys(ibuG).filter((k) => /^b\d+$/.test(k)).map((k) => [+k.slice(1), ibuG[k] * GRAMMES]).sort((a, b) => a[0] - b[0]);
    let lo = pts[0], hi = pts[pts.length - 1]; for (const p of pts) { if (p[0] <= m) lo = p; } for (const p of [...pts].reverse()) { if (p[0] >= m) hi = p; }
    ibu = Math.round(lo[1] + (hi[1] - lo[1]) * (m - lo[0]) / (hi[0] - lo[0] || 1));
  }
  D.push({ id: code, lib: m + '′', court: m + '′', seg: 0, min: m, v, haut, hp, approx: !(m === 60 || m === 10), ibu, confiance: m === 60 ? b60.confiance : b10.confiance, ibuApprox: ibuA(code) == null });
}
{ const w = vals(entree('wp', null, 'fermentis-us05')); D.push({ id: 'wp', lib: 'whirlpool', court: 'WP', seg: 1, ...w, approx: false, ibu: ibuA('wp') ?? 15, ibuApprox: ibuA('wp') == null }); }
for (const [seg, mom, lib] of [[2, 'dryActive', 'actif'], [3, 'dryPost', 'après']]) for (const j of [1, 2, 3, 5, 7]) {
  const e = entree(mom, j, 'fermentis-us05'), p = entree(mom, j, 'lalbrew-pomona');
  D.push({ id: mom + '|' + j, lib: lib + ' · J' + j, court: 'J' + j, seg, jours: j, ...vals(e), vp: vals(p).v, approx: false, ibu: null, cru: true });
}
const N = D.length; // 22 moments
const I_DEPART = D.findIndex((p) => p.id === 'dryActive|3');
const cranW = (f) => BANDE[f] / 3;
const r1 = (x) => (Math.round(x * 10) / 10).toLocaleString('fr-CH').replace('.', ',');
const crans = (f, v) => { const c = (v - AV[f]) / cranW(f); return c; };
const txtCrans = (c) => { const a = Math.abs(c); const s = a >= 1.5 ? String(Math.round(a)) : r1(a); return '~' + (c >= 0 ? '+' : '−') + s + ' cran' + (a >= 1.5 ? 's' : ''); };

// ---------- socle ----------
const CSS_SOCLE = `
:root { --encre:#16161a; --gris:#55555f; --trait:#e3e5eb; --mur:#eef0f4; --acc:#c2410c; --sans:"Source Sans 3",system-ui,-apple-system,"Segoe UI",sans-serif; --mono:"IBM Plex Mono",ui-monospace,Consolas,monospace; }
[hidden] { display:none !important; }
* { box-sizing:border-box; margin:0; padding:0; }
html, body { background:var(--mur); }
body { color:var(--encre); font:400 14px/1.25 var(--sans); -webkit-tap-highlight-color:transparent; }
button { font:inherit; color:inherit; background:none; border:0; cursor:pointer; }
a { color:inherit; text-decoration:none; }
svg { display:block; flex:none; }
.X-ecran { max-width:390px; margin:0 auto; padding:4px 10px 16px; display:flex; flex-direction:column; gap:8px; position:relative; }
.X-barre { display:flex; align-items:center; gap:8px; min-height:40px; }
.X-retour { width:28px; height:28px; border-radius:50%; background:#fff; border:1px solid var(--trait); display:inline-flex; align-items:center; justify-content:center; flex:none; font:600 20px/1 var(--sans); padding-bottom:2px; }
.X-titre { font:600 17px/1.2 var(--sans); flex:1; }
.X-aide { width:26px; height:26px; border-radius:50%; border:1px solid #c9cad2; background:#fff; font-weight:700; color:var(--gris); flex:none; }
.X-leg { position:absolute; top:44px; right:10px; z-index:5; background:#fff; border:1px solid #c9cad2; border-radius:8px; padding:8px 10px; font-size:13px; display:flex; flex-direction:column; gap:4px; width:270px; }
.X-ctx { display:flex; flex-wrap:wrap; align-items:center; gap:4px; font-size:13px; color:var(--gris); }
.X-ctx .X-fixe { font-size:12px; margin-right:2px; }
.X-ctx [data-contexte] { display:inline-flex; align-items:center; gap:5px; height:22px; padding:0 8px; border-radius:999px; background:#e2e5eb; color:var(--encre); }
.X-ctx .X-us { font-size:12px; color:var(--gris); }
.X-num { font-family:var(--mono); font-variant-numeric:tabular-nums; font-size:13px; }
.X-pl { color:var(--gris); font-size:12px; }
.X-stk { display:inline-block; width:12px; height:12px; border:2px solid #8a8a94; border-radius:2px; flex:none; }
.X-lent { display:flex; justify-content:flex-end; align-items:center; gap:6px; margin-top:-4px; }
.X-seg { display:inline-flex; background:#e2e5eb; border-radius:999px; padding:2px; }
.X-seg button { height:26px; padding:0 10px; border-radius:999px; font-size:13px; color:var(--gris); }
.X-seg button[aria-checked="true"] { background:#fff; color:var(--encre); font-weight:600; }
.X-bloc { background:#fff; border-radius:8px; padding:8px 10px; display:flex; flex-direction:column; gap:6px; }
.X-rep { font-size:14px; line-height:1.3; }
.X-rep b { font-weight:600; }
.X-hors { color:var(--acc); font-weight:600; }
.X-src { font-size:12px; color:var(--gris); }
.X-vrai { font-size:13px; line-height:1.3; }
.X-vrai .X-mes { font-weight:600; color:#1f5f99; }
.X-pi { width:16px; height:16px; }
.X-pont { display:flex; justify-content:flex-end; gap:6px; }
.X-pont a { display:inline-flex; align-items:center; height:34px; padding:0 14px; border-radius:999px; background:var(--encre); color:#fff; font-weight:600; font-size:14px; }
.X-top { display:flex; gap:6px; flex-wrap:wrap; }
.X-top span { display:inline-flex; align-items:center; gap:4px; height:22px; padding:0 8px; border-radius:999px; border:1.5px solid; font:600 12px var(--mono); }
.X-top svg { width:14px; height:14px; }
.X-etape { display:flex; gap:8px; align-items:flex-start; font-size:13px; }
.X-etape .X-n { width:22px; height:22px; border-radius:50%; background:var(--encre); color:#fff; font:600 12px/22px var(--sans); text-align:center; flex:none; }
.X-bulle { position:absolute; white-space:nowrap; background:var(--encre); color:#fff; font:600 13px var(--sans); padding:2px 8px; border-radius:999px; transform:translate(-50%,-100%); pointer-events:none; }
.X-rail { position:relative; height:20px; cursor:pointer; touch-action:none; }
.X-rail .X-z { position:absolute; top:7px; height:6px; border-radius:2px; }
.X-rail .X-z.s0 { background:#c9cdd6; } .X-rail .X-z.s1 { background:#aeb4c1; } .X-rail .X-z.s2 { background:#c9cdd6; } .X-rail .X-z.s3 { background:#aeb4c1; }
.X-rail .X-cran { position:absolute; top:3px; width:1px; height:14px; background:#8a8a94; }
.X-rail .X-pouce { position:absolute; top:1px; width:18px; height:18px; margin-left:-9px; border-radius:50%; background:var(--encre); }
.X-rep-rail { position:relative; height:16px; font-size:12px; color:var(--gris); }
.X-rep-rail span { position:absolute; transform:translateX(-50%); white-space:nowrap; }
.X-hach { background:repeating-linear-gradient(135deg,#c9cdd6 0 2px,transparent 2px 6px); }
/* fiche à l'appui long */
.X-voile { position:fixed; inset:0; background:rgba(22,22,26,.35); z-index:20; }
.X-fi { position:fixed; left:0; right:0; bottom:0; z-index:21; max-width:390px; margin:0 auto; background:#fff; border-radius:8px 8px 0 0; padding:10px 14px 16px; display:flex; flex-direction:column; gap:8px; font-size:13px; }
.X-fi h2 { font:600 18px/1.2 var(--sans); }
.X-fi-t { display:flex; align-items:center; gap:8px; }
.X-fi-t .X-us { font-size:12px; color:var(--gris); border:1px solid #c9cad2; border-radius:999px; padding:0 7px; height:20px; display:inline-flex; align-items:center; }
.X-fi-x { margin-left:auto; width:28px; height:28px; border-radius:50%; border:1px solid #c9cad2; display:inline-flex; align-items:center; justify-content:center; }
.X-fi-duo { display:flex; gap:10px; align-items:flex-start; }
.X-fi-duo p { flex:1; }
.X-gout { display:flex; gap:6px; }
.X-gout button { height:30px; padding:0 12px; border-radius:999px; border:1px solid #c9cad2; font-weight:600; font-size:13px; }
.X-gout button[aria-pressed="true"] { background:var(--encre); color:#fff; border-color:var(--encre); }
body.X-fiche-ouverte .X-ecran { pointer-events:none; }
body.X-fiche-ouverte .X-fi, body.X-fiche-ouverte .X-voile { pointer-events:auto; }
`;

const niveau = (a) => (a.label === 'marqué' ? 2 : a.label === 'cité' ? 1 : 0);
function ficheHTML() {
  const ar = idaho.aromes; const marq = ar.filter((a) => niveau(a) === 2), cit = ar.filter((a) => niveau(a) === 1);
  const mots = (a) => (a.mots[0] ? a.mots[0].mots.join(', ') : NOM[a.family].toLowerCase());
  const pts = FAM.map((f, k) => { const a = ar.find((x) => x.family === f); const r = 12 + 30 * (niveau(a) / 2); const ang = -Math.PI / 2 + k * Math.PI / 6; return [60 + r * Math.cos(ang), 60 + r * Math.sin(ang)]; });
  const axes = FAM.map((f, k) => { const ang = -Math.PI / 2 + k * Math.PI / 6; return `<line x1="60" y1="60" x2="${(60 + 44 * Math.cos(ang)).toFixed(1)}" y2="${(60 + 44 * Math.sin(ang)).toFixed(1)}" stroke="#e3e5eb" stroke-width="1"/>`; }).join('');
  const pictos = FAM.map((f, k) => { const ang = -Math.PI / 2 + k * Math.PI / 6; return `<svg class="X-pi" x="${(60 + 54 * Math.cos(ang) - 6).toFixed(1)}" y="${(60 + 54 * Math.sin(ang) - 6).toFixed(1)}" width="12" height="12" data-famille="${f}" aria-label="${NOM[f]}"><use href="#p-${f}"/></svg>`; }).join('');
  const h = idaho.huiles.composants;
  return `<div class="X-voile" data-role="fermer-fiche" hidden></div>
<section class="X-fi" data-role="fiche" role="dialog" aria-label="Fiche d'Idaho 7" hidden>
  <header class="X-fi-t"><h2>Idaho 7</h2><span class="X-us" data-role="usage" data-usage="double">double usage</span><span class="X-src">États-Unis</span><button type="button" class="X-fi-x" data-role="fermer-fiche" aria-label="Fermer la fiche"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button></header>
  <div class="X-fi-duo"><p data-role="fiche-alpha"><b>α 12,7 %</b> lu sur ton lot · fiches <span class="X-num">9,5–14,9 %</span> (Beer Maverick 2023) · huile <span class="X-num">1–2 mL/100 g</span></p>
  <svg data-radar data-objet="fiche" width="120" height="120" viewBox="0 0 120 120" aria-label="Silhouette des fiches d'Idaho 7">${axes}<polygon points="${pts.map((p) => p.map((x) => x.toFixed(1)).join(',')).join(' ')}" fill="rgba(22,22,26,.08)" stroke="#16161a" stroke-width="1.6"/>${pictos}</svg></div>
  <p data-role="fiche-arome"><b>${marq.map(mots).join(', ')}</b> marqué · ${cit.map(mots).join(', ')} cités — 1/1 fiche · autres mots : aucun</p>
  <p class="X-src">huile : myrcène ${h.myrcene.min}–${h.myrcene.max} %, humulène ${h.humulene.min}–${h.humulene.max} %, caryophyllène ${h.caryophyllene.min}–${h.caryophyllene.max} %</p>
  <div class="X-gout" data-role="gout"><button type="button" aria-pressed="false">j'aime</button><button type="button" aria-pressed="false">pas pour moi</button></div>
</section>`;
}

const JS_SOCLE = `
var FAM=${JSON.stringify(FAM)}, NOM=${JSON.stringify(NOM)}, T=${JSON.stringify(T)}, BA=${JSON.stringify(BA)}, BANDE=${JSON.stringify(BANDE)}, AV=${JSON.stringify(AV)};
var D=${JSON.stringify(D)}, N=D.length, SEG=[[0,44],[44,52],[52,76],[76,100]];
function cranW(f){ return BANDE[f]/3; }
function crans(f,v){ return (v-AV[f])/cranW(f); }
function r1(x){ return (Math.round(x*10)/10).toFixed(1).replace('.',','); }
function txtCrans(c){ var a=Math.abs(c), s=a>=1.5?String(Math.round(a)):r1(a); return '~'+(c>=0?'+':'−')+s+' cran'+(a>=1.5?'s':''); }
function x(i){ var s=D[i].seg, idx=[]; for(var k=0;k<N;k++) if(D[k].seg===s) idx.push(k); var n=idx.length,a=SEG[s][0],b=SEG[s][1]; return n===1?(a+b)/2:a+(b-a)*(0.06+0.88*idx.indexOf(i)/(n-1)); }
function amertume(p){ if(p.cru) return {tot:60, mot:'amertume tenue'}; var t=60+p.ibu; return {tot:t, mot: t<=70?'amertume tenue':t<=85?'un peu plus amère':'trop amère'}; }
function reponse(p){ var l=FAM.filter(function(f){return f!=='resin';}).map(function(f){return [f,crans(f,p.v[f])];}).sort(function(a,b){return b[1]-a[1];}).slice(0,2);
  var hors=FAM.filter(function(f){return f!=='resin'&&p.v[f]>BANDE[f];}).length; var am=amertume(p);
  return 'Face à ta stout : <b style="color:'+T[l[0][0]]+'">'+NOM[l[0][0]].toLowerCase()+' '+txtCrans(l[0][1])+'</b>, <span style="color:'+T[l[1][0]]+'">'+NOM[l[1][0]].toLowerCase()+' '+txtCrans(l[1][1])+'</span> · '+(hors?'<span class="X-hors">'+hors+' hors style</span>':'dans la 16D')+' · '+am.mot+(p.approx?' <span class="X-src">≈ interpolé</span>':''); }
function ibuTexte(p){ return p.cru ? 'IBU à cru : non modélisé' : '~ IBU 60 → '+(60+p.ibu)+(p.ibuApprox?' ≈':''); }
var S={i:${I_DEPART}};
function poser(i, pendant){ S.i=i; var p=D[i]; document.querySelectorAll('[role=slider]').forEach(function(r){ r.setAttribute('aria-valuenow', i); r.setAttribute('aria-valuetext', p.lib); }); RENDRE(i, !!pendant); }
function plusProche(val, posOf){ var best=0,bd=1e9; for(var k=0;k<N;k++){ var d=Math.abs(posOf(k)-val); if(d<bd){bd=d;best=k;} } return best; }
// un geste : pointeur → position → moment le plus proche
function brancher(el, lire){ el.addEventListener('pointerdown', function(e){ el.setPointerCapture(e.pointerId); el.classList.add('X-touche'); var k=lire(e); if(k!==S.i) poser(k,true); else RENDRE(S.i,true); e.preventDefault(); });
  el.addEventListener('pointermove', function(e){ if(!e.buttons) return; var k=lire(e); if(k!==S.i) poser(k,true); });
  function fin(){ el.classList.remove('X-touche'); RENDRE(S.i,false); }
  el.addEventListener('pointerup', fin); el.addEventListener('pointercancel', fin);
  el.addEventListener('keydown', function(e){ if(e.key==='ArrowRight'||e.key==='ArrowDown') poser(Math.min(N-1,S.i+1)); if(e.key==='ArrowLeft'||e.key==='ArrowUp') poser(Math.max(0,S.i-1)); }); }
function railHorizontal(rail, posOf){ posOf=posOf||x; rail.innerHTML=''; if(posOf===x) SEG.forEach(function(s,k){ var z=document.createElement('span'); z.className='X-z s'+k; z.style.left=s[0]+'%'; z.style.width=(s[1]-s[0])+'%'; rail.appendChild(z); }); else { var z0=document.createElement('span'); z0.className='X-z s0'; z0.style.left='0%'; z0.style.width='100%'; rail.appendChild(z0); }
  for(var k=0;k<N;k++){ var c=document.createElement('i'); c.className='X-cran'; c.style.left=posOf(k)+'%'; rail.appendChild(c); }
  var po=document.createElement('span'); po.className='X-pouce'; rail.appendChild(po);
  brancher(rail, function(e){ var r=rail.getBoundingClientRect(); return plusProche((e.clientX-r.left)/r.width*100, posOf); }); return po; }
// ce qu'il ajoute : les quatre familles qui montent le plus, en chips à leur couleur
function top4(el, p){ var l=FAM.filter(function(f){return f!=='resin';}).map(function(f){return [f,crans(f,p.v[f])];}).sort(function(a,b){return b[1]-a[1];}).slice(0,4);
  el.innerHTML=l.map(function(e){ return '<span style="color:'+T[e[0]]+';border-color:'+BA[e[0]]+'"><svg width="14" height="14" data-famille="'+e[0]+'" aria-label="'+NOM[e[0]]+'"><use href="#p-'+e[0]+'"/></svg>'+txtCrans(e[1]).replace(' crans','').replace(' cran','')+'</span>'; }).join(''); }
// lentille au style / absolu
document.querySelectorAll('[data-e]').forEach(function(b){ b.addEventListener('click', function(){ document.querySelectorAll('[data-e]').forEach(function(y){ y.setAttribute('aria-checked', String(y===b)); }); document.body.classList.toggle('X-abs', b.dataset.e==='absolu'); RENDRE(S.i,false); }); });
// légende
document.querySelectorAll('[data-role=legende-bouton]').forEach(function(b){ b.addEventListener('click', function(){ var l=document.getElementById(b.getAttribute('aria-controls')); l.hidden=!l.hidden; b.setAttribute('aria-expanded', String(!l.hidden)); }); });
addEventListener('keydown', function(e){ if(e.key!=='Escape') return; document.querySelectorAll('[data-role=legende]').forEach(function(l){ l.hidden=true; }); document.querySelectorAll('[data-role=legende-bouton]').forEach(function(b){ b.setAttribute('aria-expanded','false'); }); fermerFiche(); });
// fiche : appui long (650 ms) ou survol 900 ms à la souris ; un toucher court ne l'ouvre pas
var FI=document.querySelector('[data-role=fiche]'), VOILE=document.querySelector('.X-voile'), APPUI=null, SURVOL=null, AVALE=0;
var PAR_APPUI=false;
function ouvrirFiche(){ FI.hidden=false; VOILE.hidden=false; document.body.classList.add('X-fiche-ouverte'); }
// le clic synthétisé juste après le relâchement du doigt ne doit pas refermer la fiche qui vient de s'ouvrir
document.addEventListener('click', function(e){ if(performance.now()<AVALE){ e.stopPropagation(); e.preventDefault(); } }, true);
function fermerFiche(){ FI.hidden=true; VOILE.hidden=true; document.body.classList.remove('X-fiche-ouverte'); }
document.querySelectorAll('[data-role=fermer-fiche]').forEach(function(b){ b.addEventListener('click', function(e){ e.stopPropagation(); fermerFiche(); }); });
FI.querySelectorAll('[data-role=gout] button').forEach(function(b){ b.addEventListener('click', function(){ var on=b.getAttribute('aria-pressed')!=='true'; FI.querySelectorAll('[data-role=gout] button').forEach(function(y){ y.setAttribute('aria-pressed','false'); }); b.setAttribute('aria-pressed', String(on)); }); });
document.addEventListener('pointerdown', function(e){ var h=e.target.closest('[data-houblon]'); if(!h||FI.contains(e.target)) return; APPUI={x:e.clientX,y:e.clientY,t:setTimeout(function(){ APPUI=null; PAR_APPUI=true; ouvrirFiche(); },500)}; }, true);
document.addEventListener('pointermove', function(e){ if(APPUI&&Math.hypot(e.clientX-APPUI.x,e.clientY-APPUI.y)>10){ clearTimeout(APPUI.t); APPUI=null; } }, true);
function lacher(){ if(APPUI){ clearTimeout(APPUI.t); APPUI=null; } if(PAR_APPUI){ PAR_APPUI=false; AVALE=performance.now()+350; } }
document.addEventListener('pointerup', lacher, true); document.addEventListener('pointercancel', lacher, true);
document.addEventListener('contextmenu', function(e){ if(e.target.closest('[data-houblon]')) e.preventDefault(); });
document.addEventListener('pointerover', function(e){ if(e.pointerType!=='mouse'||innerWidth<700) return; var h=e.target.closest('[data-houblon]'); if(!h){ if(SURVOL){ clearTimeout(SURVOL); SURVOL=null; } return; } if(SURVOL) return; SURVOL=setTimeout(function(){ SURVOL=null; ouvrirFiche(); },650); });
document.addEventListener('pointerout', function(e){ if(e.pointerType!=='mouse') return; var h=e.target.closest('[data-houblon]'); if(h&&SURVOL&&!(e.relatedTarget&&h.contains(e.relatedTarget))){ clearTimeout(SURVOL); SURVOL=null; } });
`;

function tete(titre, legende) {
  return `<header class="X-barre"><a class="X-retour" aria-label="Retour" href="../../../fils22-carte/carte.html">‹</a><h1 class="X-titre">${titre}</h1><button type="button" class="X-aide" data-role="legende-bouton" aria-expanded="false" aria-controls="leg" aria-label="Lire la légende">?</button></header>
<div class="X-leg" id="leg" data-role="legende" hidden>${legende.map((l) => `<span>${l}</span>`).join('')}</div>
<p class="X-ctx" data-role="contexte"><span class="X-fixe">fixé</span><span data-contexte="houblon" data-houblon="Idaho 7">Idaho 7 <span class="X-num" data-role="alpha" data-source="lot">α 12,7 %</span><span class="X-pl">9,5–14,9</span><span class="X-us" data-role="usage" data-usage="double">double</span><i class="X-stk" role="img" aria-label="stock : 20 g en stock, 80 g à peser, à acheter"></i></span><span data-contexte="dose">4 g/L</span><span data-contexte="levure">US-05</span><span data-contexte="base">Stout 16D</span></p>`;
}
const LENT = `<div class="X-lent"><span class="X-seg" data-lecture role="radiogroup" aria-label="lecture au style ou absolu"><button type="button" role="radio" aria-checked="true" data-e="style">Au style</button><button type="button" role="radio" aria-checked="false" data-e="absolu">Absolu</button></span></div>`;
const PONT = `<nav class="X-pont" aria-label="Pont"><a href="../../../fils22-carte/levure-outil/etat.html">Levure ›</a></nav>`;

// barres l5b, réutilisées par f1 et f6
const CSS_BARRES = `
.X-ba { display:grid; grid-template-columns:16px 58px 1fr 44px; align-items:center; gap:5px; font-size:12px; min-height:19px; }
.X-ba-v { text-align:right; font-family:var(--mono); font-size:12px; }
.X-piste { position:relative; height:10px; background:#f1f2f5; border-radius:2px; overflow:hidden; }
.X-piste i { position:absolute; top:0; bottom:0; left:0; display:block; }
.X-piste .X-zone { width:var(--ws); background:#d9dce3; }
.X-piste .X-rem { width:var(--ws); height:6px; top:2px; border-radius:2px; }
.X-piste .X-perte { left:var(--ws); width:var(--wp); height:6px; top:2px; }
.X-piste .X-av { left:clamp(4px, var(--ws), calc(100% - 4px)); width:8px; height:8px; top:1px; border-radius:50%; border:2px solid var(--encre); background:#fff; margin-left:-4px; }
.X-piste .X-inc { right:0; }
body.X-abs .X-piste .X-zone, body.X-abs .X-piste .X-rem { width:var(--wa); }
body.X-abs .X-piste .X-perte { left:var(--wa); width:var(--wpa); }
body.X-abs .X-piste .X-av { left:clamp(4px, var(--wa), calc(100% - 4px)); }
`;
const htmlBarres = (perte) => FAM.map((f) => `<div class="X-ba" data-f="${f}"><svg class="X-pi" width="16" height="16" data-famille="${f}" aria-label="${NOM[f]}"><use href="#p-${f}"/></svg><span>${NOM[f]}</span><span class="X-piste"><i class="X-zone" data-role="zone" style="--ws:50%;--wa:${(BANDE[f] / 110 * 100).toFixed(1)}%"></i>${perte ? '<i class="X-perte X-hach" style="--ws:0%;--wp:0%;--wa:0%;--wpa:0%"></i>' : ''}<i class="X-rem" style="background:${BA[f]};--ws:0%;--wa:0%"></i><i class="X-av" style="--ws:${(AV[f] / BANDE[f] / 2 * 100).toFixed(1)}%;--wa:${(AV[f] / 110 * 100).toFixed(1)}%"></i></span><span class="X-ba-v"></span></div>`).join('');
const JS_BARRES = `
function majBarres(racine, p, ref){ racine.querySelectorAll('[data-f]').forEach(function(r){ var f=r.dataset.f, rem=r.querySelector('.X-rem'), v=r.querySelector('.X-ba-v'), pis=r.querySelector('.X-piste'), inc=r.querySelector('.X-inc'), perte=r.querySelector('.X-perte');
  var inconnu = p.v[f]===0 && p.haut[f]===0;
  if(inconnu){ rem.hidden=true; if(perte) perte.hidden=true; if(!inc){ inc=document.createElement('i'); inc.className='X-inc X-hach'; pis.appendChild(inc);} v.textContent='inconnu'; v.style.color='#55555f'; return; }
  if(inc) inc.remove(); rem.hidden=false; var x2=p.v[f]; rem.style.setProperty('--ws', Math.min(100, x2/BANDE[f]/2*100)+'%'); rem.style.setProperty('--wa', Math.min(100, x2/110*100)+'%');
  if(perte&&ref){ var hi=ref.v[f], d=Math.max(0,hi-x2); perte.hidden=d<0.3; perte.style.setProperty('--ws', Math.min(100,x2/BANDE[f]/2*100)+'%'); perte.style.setProperty('--wp', Math.min(100-x2/BANDE[f]/2*100, d/BANDE[f]/2*100)+'%'); perte.style.setProperty('--wa', Math.min(100,x2/110*100)+'%'); perte.style.setProperty('--wpa', Math.min(100-x2/110*100, d/110*100)+'%'); }
  var c=crans(f,x2); v.textContent = Math.abs(c)>=0.05 ? txtCrans(c).replace(' crans','').replace(' cran','') : ''; v.style.color = x2>BANDE[f] ? '#c2410c' : T[f]; }); }
`;

// ---------- concepts ----------
const C = {};

// f1 — La cuve en coupe : la journée en colonne, le jeton se glisse de la chaudière au fermenteur.
C.f1 = {
  titre: 'Quand ajouter Idaho 7 ?', chaleur: 'chaude', levure: 'pont',
  legende: ['colonne : la chaudière (100 °C), le whirlpool, puis la cuve de fermentation', 'glisse le jeton Idaho 7 de haut en bas : les barres suivent', 'rond creux : ma bière avant ; barre : avec Idaho 7 ; ~ simulé'],
  css: CSS_BARRES + `
.X-scene { display:flex; gap:8px; align-items:stretch; }
.X-cuve { width:118px; flex:none; position:relative; background:#fff; border-radius:8px; padding:6px 4px; touch-action:none; cursor:pointer; }
.X-cuve svg { width:110px; height:440px; }
.X-cote { flex:1; display:flex; flex-direction:column; gap:6px; }
.X-jeton { pointer-events:none; }
.X-t { font:600 12px var(--sans); fill:#55555f; }
.X-g { font:600 12px var(--mono); fill:#16161a; }
.X-g.X-faible { fill:#55555f; font-weight:400; }
.X-ibu { font-size:12px; color:var(--gris); text-align:right; font-family:var(--mono); }
`,
  html: `<section class="X-scene">
<div class="X-cuve" data-libre="moment"><svg viewBox="0 0 110 440" role="slider" tabindex="0" aria-label="Moment de l'ajout" aria-valuemin="0" aria-valuemax="${N - 1}" aria-valuenow="${I_DEPART}" aria-valuetext="actif · J3">
<path d="M18 14h58l6 150H12z" fill="#f7e9e3" stroke="#16161a" stroke-width="1.6"/><path d="M30 10c2-4 6-4 8 0M44 8c2-5 7-5 9 0M58 10c2-4 6-4 8 0" fill="none" stroke="#c2410c" stroke-width="1.6" stroke-linecap="round"/>
${[60, 50, 40, 30, 20, 10].map((m) => { const y = 36 + (60 - m) / 50 * 124; return `<line x1="20" y1="${y}" x2="26" y2="${y}" stroke="#16161a" stroke-width="1"/><text x="28" y="${y + 4}" class="X-g${m % 20 === 10 && m !== 10 ? ' X-faible' : ''}">${m}′</text>`; }).join('')}
<text x="94" y="158" class="X-t" text-anchor="end">100 °C</text>
<path d="M12 170h86l-30 30H42z" fill="#eef0f4" stroke="#16161a" stroke-width="1.6"/><path d="M40 180c6 8 24 8 30 0" fill="none" stroke="#55555f" stroke-width="1.6" stroke-linecap="round"/><text x="55" y="218" class="X-t" text-anchor="middle">whirlpool ~80 °C</text>
<text x="55" y="240" class="X-t" text-anchor="middle">cuve, 20 °C</text>
<path d="M22 246h66v154l-33 34-33-34z" fill="#f3f0ec" stroke="#16161a" stroke-width="1.6"/>
<path d="M24 262c8-6 14 6 22 0s14 6 22 0 14 6 18 0" fill="none" stroke="#9a8a66" stroke-width="1.6"/>
<line x1="22" y1="326" x2="88" y2="326" stroke="#aeb4c1" stroke-width="1"/>
<path d="M30 404h50l-25 24z" fill="#d9c9a3"/>
${[1, 2, 3, 5, 7].map((j, k) => `<text x="86" y="${274 + k * 12}" class="X-g X-faible" text-anchor="end">J${j}</text>`).join('')}
${[1, 2, 3, 5, 7].map((j, k) => `<text x="86" y="${344 + k * 12}" class="X-g X-faible" text-anchor="end">J${j}</text>`).join('')}
<text x="14" y="296" class="X-t" transform="rotate(-90 14 296)" text-anchor="middle">actif</text><text x="14" y="366" class="X-t" transform="rotate(-90 14 366)" text-anchor="middle">après</text>
<g class="X-jeton" id="jeton"><circle cx="50" cy="0" r="13" fill="#16161a"/><path d="M50-8c4 2 6 6 6 9s-2 7-6 8c-4-1-6-5-6-8s2-7 6-9z" fill="none" stroke="#fff" stroke-width="1.6"/><path d="M44 1h12M45-3h10" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></g>
</svg><div class="X-bulle" id="bulle">actif · J3</div></div>
<div class="X-cote"><div class="X-bloc"><p class="X-rep" id="rep"></p></div><div class="X-bloc" id="barres">${htmlBarres(false)}<p class="X-ibu" id="ibu"></p></div></div>
</section>
<div class="X-bloc"><p class="X-vrai"><span class="X-mes">mesuré</span> à l'ébullition, le jury sent végétal cuit, herbacé ; en dry hop 48 h, tropical, agrumes, noyau, pin <span class="X-src">· Simcoe 1,5 g/L, Sharp 2014 (E07)</span></p></div>
${PONT}`,
  js: JS_BARRES + `
function yDe(i){ var p=D[i]; if(p.seg===0) return 36+(60-p.min)/50*124; if(p.seg===1) return 185; var k=[1,2,3,5,7].indexOf(p.jours); return (p.seg===2?270:340)+k*12; }
var cuve=document.querySelector('.X-cuve'), svg=cuve.querySelector('svg');
function RENDRE(i, pendant){ var p=D[i]; var y=yDe(i); document.getElementById('jeton').setAttribute('transform','translate(0,'+y+')');
  var r=svg.getBoundingClientRect(), k=r.height/440; var b=document.getElementById('bulle'); b.style.left=(50*k+4)+'px'; b.style.top=(y*k-10)+'px'; b.textContent=p.lib+(p.approx?' ≈':'');
  document.getElementById('rep').innerHTML=reponse(p); document.getElementById('ibu').textContent=ibuTexte(p); majBarres(document.getElementById('barres'), p); }
brancher(svg, function(e){ var r=svg.getBoundingClientRect(); var y=(e.clientY-r.top)/r.height*440; return plusProche(y, yDe); });
poser(S.i);`,
};

// f2 — La balance de ta dégustation : plus floral, moins résineux (18.10) ; le moment fait pencher.
C.f2 = {
  titre: 'Quand ajouter Idaho 7 ?', chaleur: 'chaude', levure: 'étape',
  legende: ['ta dégustation du 18.10 : « trop résineuse, je la veux plus florale »', 'plateau gauche : le floral gagné ; plateau droit : le résineux ajouté ; la balance penche vers le plus lourd', 'glisse le moment : la balance bouge ; ~ simulé'],
  css: `
.X-bal { background:#fff; border-radius:8px; padding:6px 10px 2px; }
.X-bal svg { width:100%; height:auto; aspect-ratio:370/190; }
.X-pt { font:600 13px var(--sans); }
.X-pv { font:600 14px var(--mono); }
.X-obj { display:grid; grid-template-columns:16px 60px 1fr 60px; gap:6px; align-items:center; font-size:12px; }
.X-piste { position:relative; height:12px; background:#f1f2f5; border-radius:2px; overflow:hidden; }
.X-piste i { position:absolute; top:0; bottom:0; left:0; }
.X-piste .X-zone { width:var(--ws); background:#d9dce3; }
.X-piste .X-rem { width:var(--ws); height:6px; top:3px; border-radius:2px; }
.X-piste .X-av { left:clamp(5px, var(--ws), calc(100% - 5px)); width:10px; height:10px; top:1px; border-radius:50%; border:2px solid var(--encre); background:#fff; margin-left:-5px; }
.X-piste .X-vise { width:2px; left:var(--ws); background:#16161a; }
body.X-abs .X-piste .X-zone, body.X-abs .X-piste .X-rem { width:var(--wa); } body.X-abs .X-piste .X-av { left:clamp(5px, var(--wa), calc(100% - 5px)); } body.X-abs .X-piste .X-vise { left:var(--wa); }
.X-frise { background:#fff; border-radius:8px; padding:26px 16px 6px; position:relative; }
.X-verdict { font-weight:600; }
`,
  html: `<div class="X-bloc"><p class="X-rep" id="rep"></p><div class="X-top" id="top"></div></div>
<div class="X-bal"><svg viewBox="0 0 370 190" aria-label="Balance : floral gagné contre résineux ajouté">
<path d="M185 150V40" stroke="#16161a" stroke-width="2"/><path d="M160 160h50" stroke="#16161a" stroke-width="2"/>
<g id="fleau"><path d="M70 40H300" stroke="#16161a" stroke-width="2" stroke-linecap="round"/>
<g><path d="M70 40v60M70 100l-34 30h68z" fill="none" stroke="#9840bc" stroke-width="2"/><text x="70" y="150" text-anchor="middle" class="X-pv" fill="#9840bc" id="pg"></text></g>
<g><path d="M300 40v60M300 100l-34 30h68z" fill="none" stroke="#2f6b5f" stroke-width="2"/><text x="300" y="150" text-anchor="middle" class="X-pv" fill="#2f6b5f" id="pd"></text></g></g>
<circle cx="185" cy="40" r="5" fill="#16161a"/>
<text x="70" y="178" text-anchor="middle" class="X-pt" fill="#9840bc">floral gagné</text><text x="300" y="178" text-anchor="middle" class="X-pt" fill="#2f6b5f">résineux ajouté</text>
<text x="185" y="178" text-anchor="middle" class="X-pt" fill="#55555f" id="verdict"></text>
</svg></div>
<div class="X-bloc">
<div class="X-obj" data-role="objectif"><svg class="X-pi" width="16" height="16" data-famille="floral" aria-label="Floral"><use href="#p-floral"/></svg><span>plus floral</span><span class="X-piste"><i class="X-zone" data-role="zone" style="--ws:50%;--wa:50%"></i><i class="X-rem" id="rf" style="background:#bf86d6;--ws:0%;--wa:0%"></i><i class="X-av" style="--ws:1.4%;--wa:1.4%"></i><i class="X-vise" style="--ws:33%;--wa:36%"></i></span><span class="X-num" id="vf" style="color:#9840bc"></span></div>
<div class="X-obj" data-role="objectif"><svg class="X-pi" width="16" height="16" data-famille="resin" aria-label="Résineux"><use href="#p-resin"/></svg><span>moins résineux</span><span class="X-piste"><i class="X-zone" data-role="zone" style="--ws:50%;--wa:27%"></i><i class="X-rem" id="rr" style="background:#2f6b5f;--ws:0%;--wa:0%"></i><i class="X-av" style="--ws:100%;--wa:75.5%"></i><i class="X-vise" style="--ws:50%;--wa:27%"></i></span><span class="X-num" id="vr" style="color:#c2410c"></span></div>
<p class="X-src">trait noir : ta visée · rond creux : ta stout aujourd'hui (résineux déjà hors de la 16D, ta dégustation)</p>
</div>
<div class="X-frise" data-libre="moment"><div class="X-bulle" id="bulle"></div><div class="X-rail" role="slider" tabindex="0" aria-label="Moment de l'ajout" aria-valuemin="0" aria-valuemax="${N - 1}" aria-valuenow="${I_DEPART}" aria-valuetext="actif · J3"></div><div class="X-rep-rail"><span style="left:22%">ébullition</span><span style="left:48%">WP</span><span style="left:64%">actif</span><span style="left:88%">après</span></div></div>
<div class="X-bloc"><p class="X-vrai"><span class="X-mes">mesuré</span> en bière, Idaho 7 est peu résineux : myrcène <span class="X-num">0,085 ± 0,029 mg/L</span>, ×7 sous Azacca <span class="X-src">· au pitch, S-04, 14 j, McCabe 2023 (E03)</span> ; le moteur suit sa fiche (pin, résine)</p></div>
<div class="X-bloc X-etape"><span class="X-n">3</span><p id="lev"></p></div>`,
  js: `
var rail=document.querySelector('.X-rail'), pouce=railHorizontal(rail);
function RENDRE(i){ var p=D[i]; var cf=crans('floral',p.v.floral), cr=crans('resin',p.v.resin);
  pouce.style.left=x(i)+'%'; var b=document.getElementById('bulle'); b.style.left='calc('+x(i)+'% + 0px)'; b.style.top='22px'; b.textContent=p.lib+(p.approx?' ≈':'');
  var ang=Math.max(-14,Math.min(14,(cr-cf)*14)); document.getElementById('fleau').setAttribute('transform','rotate('+ang.toFixed(1)+' 185 40)');
  document.getElementById('pg').textContent=txtCrans(cf).replace(' crans','').replace(' cran',''); document.getElementById('pd').textContent=txtCrans(cr).replace(' crans','').replace(' cran','');
  document.getElementById('verdict').textContent = cr>cf+0.1 ? 'penche résineux' : cf>cr+0.1 ? 'penche floral' : 'à l\\'équilibre';
  document.getElementById('rf').style.setProperty('--ws', Math.min(100,p.v.floral/BANDE.floral/2*100)+'%'); document.getElementById('rf').style.setProperty('--wa', Math.min(100,p.v.floral/110*100)+'%');
  document.getElementById('rr').style.setProperty('--ws', Math.min(100,p.v.resin/BANDE.resin/2*100)+'%'); document.getElementById('rr').style.setProperty('--wa', Math.min(100,p.v.resin/110*100)+'%');
  document.getElementById('vf').textContent='~'+Math.round(p.v.floral); document.getElementById('vr').textContent='~'+Math.round(p.v.resin)+' hors style';
  var best=0,bs=-1e9; for(var k=0;k<N;k++){ var s=crans('floral',D[k].v.floral)-crans('resin',D[k].v.resin); if(s>bs){bs=s;best=k;} }
  document.getElementById('rep').innerHTML=(p.seg<2 ? 'À chaud, Idaho 7 ne change presque rien à ton floral ni à ton résineux : il fait surtout de l\\'amertume (<b>~+'+p.ibu+' IBU</b>, '+amertume(p).mot+').' : 'En dry hop, Idaho 7 ajoute <b>plus de résineux ('+txtCrans(cr)+') que de floral ('+txtCrans(cf)+')</b> : il va contre ta dégustation. '+(p.seg===2?'Actif vaut mieux qu\\'après : le CO₂ emporte du résineux.':'Après, rien n\\'emporte le résineux.'))+(p.approx?' <span class="X-src">≈ interpolé</span>':'');
  top4(document.getElementById('top'), p);
  var a3=D.find(function(q){return q.id==='dryActive|3';}), p3=D.find(function(q){return q.id==='dryPost|3';});
  document.getElementById('lev').innerHTML='<b>Levure, dernière étape.</b> US-05 '+(p.seg===2?'active : son CO₂ emporte '+txtCrans(crans('resin',a3.v.resin)-crans('resin',p3.v.resin))+' de résineux face à après':p.seg===3?'endormie : rien n\\'emporte le résineux (~'+Math.round(p3.v.resin-a3.v.resin)+' points de plus qu\\'en actif)':'pas encore là : à chaud, la vapeur emporte')+' · biotransformation : non publiée.'; }
poser(S.i);`,
};

// f3 — Le cadran : radar au centre, les moments en anneau, molette au doigt.
C.f3 = {
  titre: 'Quand ajouter Idaho 7 ?', chaleur: 'chaude', levure: 'pont',
  legende: ['anneau : la journée de brassage, de 60′ (en haut) au dry hop après fermentation', 'radar : trait fin, ma bière avant ; forme pleine, avec Idaho 7 ; gris, la zone de la 16D', 'tourne la molette : la forme change ; ~ simulé'],
  css: `
.X-cad { background:#fff; border-radius:8px; padding:4px; touch-action:none; position:relative; }
.X-cad svg { width:100%; height:auto; aspect-ratio:1; }
.X-arc { fill:none; stroke-width:16; stroke-linecap:butt; }
.X-arc.s0 { stroke:#c9cdd6; } .X-arc.s1 { stroke:#aeb4c1; } .X-arc.s2 { stroke:#c9cdd6; } .X-arc.s3 { stroke:#aeb4c1; }
.X-tick { stroke:#55555f; stroke-width:1; }
.X-lab { font:600 12px var(--sans); fill:#55555f; }
.X-ibu { font:12px var(--mono); fill:#55555f; }
`,
  html: `<div class="X-bloc"><p class="X-rep" id="rep"></p><div class="X-top" id="top"></div></div>
<div class="X-cad" data-libre="moment"><svg viewBox="0 0 350 350" role="slider" tabindex="0" aria-label="Moment de l'ajout" aria-valuemin="0" aria-valuemax="${N - 1}" aria-valuenow="${I_DEPART}" aria-valuetext="actif · J3">
<g id="anneau"></g>
<g id="radar"></g>
<g id="molette"><circle r="13" fill="#16161a"/><circle r="4" fill="#fff"/></g>
</svg><div class="X-bulle" id="bulle"></div><p class="X-src" id="ibu" style="text-align:right;font-family:var(--mono)"></p></div>
<div class="X-bloc"><p class="X-vrai"><span class="X-mes">mesuré</span> une heure de contact se sent déjà : à 30 j, le témoin diffère de tous les dry hops, dès 1 h <span class="X-src">· Cascade 1,43 g/L, Titus 2021 (E10)</span></p></div>
${PONT}`,
  js: `
var CX=175, CY=178, RB=70, RA=95, RR=140;
var ARCS=[[-90,30],[30,52],[52,160],[160,270]];
function angDe(i){ var p=D[i], s=p.seg, idx=[]; for(var k=0;k<N;k++) if(D[k].seg===s) idx.push(k); var n=idx.length,a=ARCS[s][0],b=ARCS[s][1]; return n===1?(a+b)/2:a+(b-a)*(0.08+0.84*idx.indexOf(i)/(n-1)); }
function pol(r,a){ var t=a*Math.PI/180; return [CX+r*Math.cos(t), CY+r*Math.sin(t)]; }
function arc(r,a,b){ var p=pol(r,a), q=pol(r,b); return 'M'+p[0].toFixed(1)+' '+p[1].toFixed(1)+'A'+r+' '+r+' 0 '+((b-a)>180?1:0)+' 1 '+q[0].toFixed(1)+' '+q[1].toFixed(1); }
var an=document.getElementById('anneau'), s='';
ARCS.forEach(function(a,k){ s+='<path class="X-arc s'+k+'" d="'+arc(RR,a[0]+0.5,a[1]-0.5)+'"/>'; });
for(var k=0;k<N;k++){ var a=angDe(k), p=pol(RR-8,a), q=pol(RR+8,a); s+='<line class="X-tick" x1="'+p[0].toFixed(1)+'" y1="'+p[1].toFixed(1)+'" x2="'+q[0].toFixed(1)+'" y2="'+q[1].toFixed(1)+'"/>'; }
[['60′',-90],['30′',-30],['10′',24],['WP',41],['actif',106],['après',215]].forEach(function(l){ var p=pol(RR+22,l[1]); s+='<text class="X-lab" x="'+p[0].toFixed(1)+'" y="'+(p[1]+4).toFixed(1)+'" text-anchor="middle">'+l[0]+'</text>'; });
an.innerHTML=s;
function poly(fn){ return FAM.map(function(f,k){ var a=-90+k*30; var p=pol(fn(f),a); return p[0].toFixed(1)+','+p[1].toFixed(1); }).join(' '); }
function RENDRE(i){ var p=D[i]; var abs=document.body.classList.contains('X-abs'); var ech=function(f,v){ return abs? Math.min(RA, v/110*RA) : Math.min(RA, v/BANDE[f]*RB); };
  var r='<polygon points="'+poly(function(f){return abs?BANDE[f]/110*RA:RB;})+'" fill="#e6e8ee" stroke="none" data-role="zone"/>';
  FAM.forEach(function(f,k){ var a=-90+k*30, q=pol(RA,a), t=pol(RA+14,a); r+='<line x1="'+CX+'" y1="'+CY+'" x2="'+q[0].toFixed(1)+'" y2="'+q[1].toFixed(1)+'" stroke="#c9cdd6" stroke-width="1"/><svg x="'+(t[0]-8).toFixed(1)+'" y="'+(t[1]-8).toFixed(1)+'" width="16" height="16" data-famille="'+f+'" aria-label="'+NOM[f]+'"><use href="#p-'+f+'"/></svg>'; });
  r+='<polygon points="'+poly(function(f){return ech(f,AV[f]);})+'" fill="none" stroke="#8a8a94" stroke-width="1.2"/>';
  r+='<polygon points="'+poly(function(f){return ech(f,p.v[f]);})+'" fill="rgba(22,22,26,.10)" stroke="#16161a" stroke-width="2"/>';
  FAM.forEach(function(f,k){ if(p.v[f]===0&&p.haut[f]===0){ var a=-90+k*30, q=pol(RB*0.5,a); r+='<text x="'+q[0].toFixed(1)+'" y="'+(q[1]+4).toFixed(1)+'" text-anchor="middle" class="X-lab">?</text>'; } });
  document.getElementById('radar').innerHTML=r;
  var m=pol(RR,angDe(i)); document.getElementById('molette').setAttribute('transform','translate('+m[0].toFixed(1)+','+m[1].toFixed(1)+')');
  var svg=document.querySelector('.X-cad svg'), rc=svg.getBoundingClientRect(), kx=rc.width/350; var b=document.getElementById('bulle'); b.style.left=(m[0]*kx+4)+'px'; b.style.top=(m[1]*kx-16+4)+'px'; b.textContent=p.lib+(p.approx?' ≈':'');
  document.getElementById('ibu').textContent=ibuTexte(p); document.getElementById('rep').innerHTML=reponse(p); top4(document.getElementById('top'), p); }
var svg=document.querySelector('.X-cad svg');
brancher(svg, function(e){ var rc=svg.getBoundingClientRect(); var px=(e.clientX-rc.left)/rc.width*350, py=(e.clientY-rc.top)/rc.height*350; var a=Math.atan2(py-CY,px-CX)*180/Math.PI; if(a<-90) a+=360; return plusProche(a, angDe); });
poser(S.i);`,
};

// f4 — La carte de chaleur : 12 familles × 12 moments d'un coup d'œil.
const COLS = ['b60', 'b10', 'wp', 'dryActive|1', 'dryActive|2', 'dryActive|3', 'dryActive|5', 'dryActive|7', 'dryPost|1', 'dryPost|3', 'dryPost|7'];
const NC = COLS.length;
C.f4 = {
  titre: 'Quand ajouter Idaho 7 ?', chaleur: 'chaude', levure: 'étape',
  legende: ['une ligne par famille, une colonne par moment : plus la case est pleine, plus Idaho 7 apporte', 'hachuré : non décrit, rien de simulé ; bord orangé : hors de la 16D', 'glisse le doigt sur l’en-tête : la colonne s’allume et les points de droite donnent les crans de la 16D'],
  css: `
.X-grille { background:#fff; border-radius:8px; padding:8px 8px 6px; }
.X-tete { display:grid; grid-template-columns:78px repeat(${NC}, 1fr) 40px; gap:2px; font:600 12px var(--mono); color:var(--gris); align-items:end; }
.X-tete span { text-align:center; }
.X-tete .X-grp { font-family:var(--sans); font-weight:400; }
.X-ligne { display:grid; grid-template-columns:78px repeat(${NC}, 1fr) 40px; gap:2px; align-items:center; min-height:20px; font-size:12px; }
.X-nom { display:flex; align-items:center; gap:3px; }
.X-cel { height:18px; border-radius:2px; border:1px solid transparent; }
.X-cel.X-choisi { outline:2px solid #16161a; outline-offset:-1px; }
.X-cel.X-inc { background:repeating-linear-gradient(135deg,#c9cdd6 0 2px,transparent 2px 6px); }
.X-cel.X-hors { border-color:#c2410c; }
.X-crans { display:flex; gap:2px; justify-content:flex-end; align-items:center; }
.X-crans i { width:7px; height:7px; border-radius:50%; border:1px solid #8a8a94; display:block; }
.X-crans i.X-on { background:#16161a; border-color:#16161a; }
.X-crans i.X-sup { border-color:#c2410c; } .X-crans i.X-sup.X-on { background:#c2410c; }
.X-crans .X-sep { width:1px; height:9px; background:#8a8a94; border-radius:0; border:0; }
.X-railz { position:relative; padding:24px 0 0; }
.X-rail { margin:0 40px 0 78px; }
.X-ibu { font-size:12px; color:var(--gris); text-align:right; font-family:var(--mono); }
`,
  html: `<div class="X-bloc"><p class="X-rep" id="rep"></p></div>
<div class="X-grille">
<div class="X-railz" data-libre="moment"><div class="X-bulle" id="bulle"></div><div class="X-rail" role="slider" tabindex="0" aria-label="Moment de l'ajout" aria-valuemin="0" aria-valuemax="${N - 1}" aria-valuenow="${I_DEPART}" aria-valuetext="actif · J3"></div></div>
<div class="X-tete"><span></span>${COLS.map((c) => { const p = D.find((d) => d.id === c); return `<span>${p.seg === 0 ? p.min : p.court}</span>`; }).join('')}<span>16D</span></div>
<div class="X-tete"><span></span><span class="X-grp" style="grid-column:2/4">min.</span><span class="X-grp" style="grid-column:4/5"></span><span class="X-grp" style="grid-column:5/10">actif</span><span class="X-grp" style="grid-column:10/13">après</span><span></span></div>
${FAM.map((f) => `<div class="X-ligne" data-f="${f}"><span class="X-nom"><svg class="X-pi" width="16" height="16" data-famille="${f}" aria-label="${NOM[f]}"><use href="#p-${f}"/></svg>${NOM[f]}</span>${COLS.map((c) => `<i class="X-cel" data-c="${c}"></i>`).join('')}<span class="X-crans" data-role="zone"><i></i><i></i><i></i><i class="X-sep"></i><i class="X-sup"></i></span></div>`).join('')}
<p class="X-ibu" id="ibu"></p>
</div>
<div class="X-bloc"><p class="X-vrai"><span class="X-mes">mesuré</span> l'essentiel passe en 2 jours de contact, peu après <span class="X-src">· Eureka! 2,5 g/L, −1 °C, Schmidt 2019 (E08)</span></p></div>
<div class="X-bloc X-etape"><span class="X-n">3</span><p id="lev"></p></div>`,
  js: `
var COLS=${JSON.stringify(COLS)};
function colDe(i){ var p=D[i]; if(p.seg===0) return (60-p.min)/50; if(p.seg===1) return 2; var J=[1,2,3,5,7]; if(p.seg===2) return 3+J.indexOf(p.jours); return 8+({1:0,2:0.5,3:1,5:1.5,7:2})[p.jours]; }
function colX(i){ return (colDe(i)+0.5)/COLS.length*100; }
var rail=document.querySelector('.X-rail'), pouce=railHorizontal(rail, colX);
function peindre(){ var abs=document.body.classList.contains('X-abs'); document.querySelectorAll('.X-ligne').forEach(function(l){ var f=l.dataset.f; l.querySelectorAll('.X-cel').forEach(function(c){ var p=D.find(function(d){return d.id===c.dataset.c;}); var v=p.v[f]; c.className='X-cel'; c.style.background='';
  if(v===0&&p.haut[f]===0){ c.classList.add('X-inc'); return; } var t=abs? v/110 : v/BANDE[f]; var a=Math.min(1, Math.max(0.06, t)); c.style.background='color-mix(in srgb, '+BA[f]+' '+Math.round(a*100)+'%, #fff)'; if(v>BANDE[f]) c.classList.add('X-hors'); }); }); }
peindre();
function RENDRE(i){ var p=D[i]; pouce.style.left=colX(i)+'%'; var b=document.getElementById('bulle'); b.style.top='22px'; b.textContent=p.lib+(p.approx?' ≈':'');
  var c=Math.round(colDe(i)); document.querySelectorAll('.X-cel').forEach(function(x2){ x2.classList.toggle('X-choisi', COLS.indexOf(x2.dataset.c)===c); });
  var b2=document.getElementById('bulle'); b2.style.left='calc(78px + ('+colX(i)+'/100) * (100% - 118px))';
  document.querySelectorAll('.X-ligne').forEach(function(l){ var f=l.dataset.f, cr=Math.max(0,Math.min(4, Math.round(p.v[f]/cranW(f)))); var dots=l.querySelectorAll('.X-crans i:not(.X-sep)'); dots.forEach(function(d,k){ d.classList.toggle('X-on', k<3 ? k<cr : cr>=4); }); });
  document.getElementById('rep').innerHTML=reponse(p); document.getElementById('ibu').textContent=ibuTexte(p);
  var a3=D.find(function(q){return q.id==='dryActive|3';}), p3=D.find(function(q){return q.id==='dryPost|3';});
  document.getElementById('lev').innerHTML='<b>Levure, dernière étape.</b> '+(p.seg===2?'US-05 active : son CO₂ emporte résineux '+txtCrans(crans('resin',a3.v.resin)-crans('resin',p3.v.resin))+' et végétal '+txtCrans(crans('green',a3.v.green)-crans('green',p3.v.green))+' face à après · biotransformation : non publiée.':p.seg===3?'US-05 endormie : rien ne part, rien ne se transforme.':'US-05 pas encore là : à chaud, la vapeur emporte l\\'arôme.'); }
document.querySelectorAll('[data-e]').forEach(function(b){ b.addEventListener('click', peindre); });
poser(S.i);`,
};

// f5 — L'agenda du brassin : heures du brassage, puis J+1 … J+12 ; la levure dessine la frontière actif / après.
C.f5 = {
  titre: 'Quand ajouter Idaho 7 ?', chaleur: 'chaude', levure: 'étape',
  legende: ['bande : le jour du brassage à gauche (minutes avant la fin de l’ébullition, whirlpool), puis les jours J+1 à J+12', 'courbe grise : l’activité d’US-05, à confirmer à la densité ; barre : les jours de contact d’Idaho 7', 'glisse le cône : le plan et les arômes suivent ; ~ simulé'],
  css: `
.X-agenda { background:#fff; border-radius:8px; padding:6px 8px 4px; touch-action:none; position:relative; }
.X-agenda svg { width:100%; height:auto; aspect-ratio:370/170; }
.X-jour { font:600 12px var(--mono); fill:#55555f; }
.X-tit { font:600 12px var(--sans); fill:#16161a; }
.X-pet { font:12px var(--sans); fill:#55555f; }
.X-plan { display:grid; grid-template-columns:auto 1fr; gap:4px 10px; font-size:13px; align-items:baseline; }
.X-plan dt { color:var(--gris); font-size:12px; }
.X-zone16 { display:inline-block; width:10px; height:10px; background:#d9dce3; border-radius:2px; vertical-align:middle; }
`,
  html: `<div class="X-bloc"><p class="X-rep" id="rep"></p></div>
<div class="X-agenda" data-libre="moment"><svg viewBox="0 0 370 170" role="slider" tabindex="0" aria-label="Moment de l'ajout" aria-valuemin="0" aria-valuemax="${N - 1}" aria-valuenow="${I_DEPART}" aria-valuetext="actif · J3">
<rect x="4" y="30" width="96" height="100" rx="4" fill="#f7e9e3"/><text x="52" y="22" text-anchor="middle" class="X-tit">J0 · brassage</text>
<text x="8" y="146" class="X-pet">60′</text><text x="62" y="146" class="X-pet">10′</text><text x="84" y="146" class="X-pet">WP</text>
${Array.from({ length: 11 }, (_, k) => `<line x1="${8 + k * 6}" y1="128" x2="${8 + k * 6}" y2="${k % 2 ? 124 : 120}" stroke="#16161a" stroke-width="1"/>`).join('')}
<path d="M86 118c4 6 10 6 14 0" fill="none" stroke="#55555f" stroke-width="1.6"/>
<rect x="104" y="30" width="262" height="100" rx="4" fill="#f3f0ec"/><text x="235" y="22" text-anchor="middle" class="X-tit">fermentation, puis garde</text>
${Array.from({ length: 12 }, (_, k) => `<text x="${115 + k * 21.8}" y="146" text-anchor="middle" class="X-jour">${k + 1}</text>`).join('')}
<text x="235" y="162" text-anchor="middle" class="X-pet">J+1 … J+12</text>
<path d="M104 125C120 60 150 44 170 48S215 90 230 112 270 126 366 128" fill="none" stroke="#aeb4c1" stroke-width="2"/>
<text x="196" y="44" class="X-pet">← US-05 active</text><text x="298" y="110" class="X-pet" text-anchor="middle">~ fin vers J+5 (densité)</text>
<rect id="contact" x="0" y="60" width="0" height="14" rx="2" fill="#9b3f74"/>
<g id="cone"><circle r="12" fill="#16161a"/><path d="M0-8c4 2 6 6 6 9s-2 7-6 8c-4-1-6-5-6-8s2-7 6-9z" fill="none" stroke="#fff" stroke-width="1.6"/></g>
</svg><div class="X-bulle" id="bulle"></div></div>
<div class="X-bloc"><dl class="X-plan"><dt>plan</dt><dd id="plan"></dd><dt>arômes</dt><dd class="X-top" id="top"></dd><dt>16D</dt><dd class="X-src"><i class="X-zone16" data-role="zone"></i> <span id="dans"></span> · <span id="ibu" class="X-num"></span></dd></dl></div>
<div class="X-bloc"><p class="X-vrai"><span class="X-mes">mesuré</span> l'essentiel passe en 2 jours de contact <span class="X-src">· Eureka! 2,5 g/L, Schmidt 2019 (E08)</span></p></div>
<div class="X-bloc X-etape"><span class="X-n">3</span><p id="lev"></p></div>`,
  js: `
var FIN=5; // ~ fin de fermentation d'US-05 (J+5), à confirmer
function xDe(i){ var p=D[i]; if(p.seg===0) return 8+(60-p.min)/50*60; if(p.seg===1) return 92; if(p.seg===2) return 115+(1+ (p.jours-1)*0.5 -1)*21.8 + 0; return 115+(FIN+0.5*(p.jours-1))*21.8 - 21.8*0; }
function debut(i){ var p=D[i]; if(p.seg===2) return 1; if(p.seg===3) return FIN; return null; }
var svg=document.querySelector('.X-agenda svg');
function RENDRE(i){ var p=D[i]; var cx, cy=67; var ct=document.getElementById('contact');
  if(p.seg<2){ cx=xDe(i); ct.setAttribute('width',0); } else { var d0=debut(i), x0=115+(d0-1)*21.8-10.9, w=p.jours*21.8; cx=x0+w/2; ct.setAttribute('x',x0); ct.setAttribute('width',w); ct.setAttribute('fill', p.seg===2?'#9b3f74':'#9b5d0d'); }
  document.getElementById('cone').setAttribute('transform','translate('+cx.toFixed(1)+','+cy+')');
  var rc=svg.getBoundingClientRect(), k=rc.width/370; var b=document.getElementById('bulle'); b.style.left=(cx*k+8)+'px'; b.style.top=(cy*k-10)+'px'; b.textContent=p.lib+(p.approx?' ≈':'');
  var plan = p.seg===0 ? 'dans la chaudière, '+p.lib+' avant la fin de l\\'ébullition' : p.seg===1 ? 'au whirlpool, cuve arrêtée' : p.seg===2 ? 'dans la cuve du J+1 au J+'+(1+p.jours)+', US-05 encore active'+(1+p.jours>FIN?' au début seulement':'') : 'dans la cuve du J+'+FIN+' au J+'+(FIN+p.jours)+', fermentation finie';
  document.getElementById('plan').textContent=plan;
  top4(document.getElementById('top'), p);
  var hors=FAM.filter(function(f){return f!=='resin'&&p.v[f]>BANDE[f];}).length; document.getElementById('dans').innerHTML=hors?'<span class="X-hors">'+hors+' hors style</span>':'dans la 16D'; document.getElementById('ibu').textContent=ibuTexte(p);
  document.getElementById('rep').innerHTML=reponse(p);
  var a3=D.find(function(q){return q.id==='dryActive|3';}), p3=D.find(function(q){return q.id==='dryPost|3';});
  document.getElementById('lev').innerHTML='<b>Levure, dernière étape.</b> Elle trace la frontière actif / après : US-05 '+(p.seg===2?'bulle encore, son CO₂ emporte '+txtCrans(crans('resin',a3.v.resin)-crans('resin',p3.v.resin))+' de résineux · biotransformation : non publiée.':p.seg===3?'a fini : rien ne part ; houblons sortis au J+'+(FIN+p.jours)+'.':'pas encore ensemencée.'); }
brancher(svg, function(e){ var rc=svg.getBoundingClientRect(); var px=(e.clientX-rc.left)/rc.width*370; return plusProche(px, function(k){ var p=D[k]; if(p.seg<2) return xDe(k); var d0=debut(k), x0=115+(d0-1)*21.8-10.9; return x0+p.jours*21.8/2; }); });
poser(S.i);`,
};

// f6 — Le barboteur : ce que la vapeur, le CO₂ ou rien emporte, hachuré sur chaque barre.
C.f6 = {
  titre: 'Quand ajouter Idaho 7 ?', chaleur: 'chaude', levure: 'étape',
  legende: ['dessin : la chaudière fume (ébullition, whirlpool), le barboteur bulle (fermentation active) ou se tait (après)', 'barre : ce qu’Idaho 7 apporte à ce moment ; hachuré : ce que ce moment lui emporte, face au dry hop après fermentation', 'glisse le moment ; ~ simulé, conventions du moteur'],
  css: CSS_BARRES + `
.X-haut { display:flex; gap:10px; align-items:center; }
.X-dess { width:84px; height:96px; flex:none; }
.X-dess svg { width:84px; height:96px; }
.X-mot { flex:1; font-size:14px; line-height:1.3; }
.X-frise { background:#fff; border-radius:8px; padding:26px 16px 6px; position:relative; }
.X-ibu { font-size:12px; color:var(--gris); text-align:right; font-family:var(--mono); }
`,
  html: `<div class="X-bloc X-haut"><div class="X-dess"><svg viewBox="0 0 84 96" aria-hidden="true">
<g id="chaud"><path d="M14 40h56l4 50H10z" fill="#f7e9e3" stroke="#16161a" stroke-width="1.6"/><g id="vap" stroke="#8a8a94" stroke-width="1.6" fill="none" stroke-linecap="round"><path d="M28 32c-4-6 4-10 0-16M42 30c-4-6 4-10 0-16M56 32c-4-6 4-10 0-16"/></g></g>
<g id="barb" style="display:none"><path d="M24 90V54c0-10 6-14 12-14s12 4 12 14v10c0 6 4 8 8 8s8-2 8-8V50" fill="none" stroke="#16161a" stroke-width="1.6"/><path d="M48 60h-8" stroke="#1f5f99" stroke-width="2"/><g id="bulles" fill="none" stroke="#1f5f99" stroke-width="1.6"><circle cx="62" cy="40" r="3"/><circle cx="66" cy="28" r="2.5"/><circle cx="60" cy="18" r="2"/></g></g>
</svg></div><p class="X-mot" id="mot"></p></div>
<div class="X-bloc" id="barres">${htmlBarres(true)}<p class="X-ibu" id="ibu"></p></div>
<div class="X-frise" data-libre="moment"><div class="X-bulle" id="bulle"></div><div class="X-rail" role="slider" tabindex="0" aria-label="Moment de l'ajout" aria-valuemin="0" aria-valuemax="${N - 1}" aria-valuenow="${I_DEPART}" aria-valuetext="actif · J3"></div><div class="X-rep-rail"><span style="left:22%">ébullition</span><span style="left:48%">WP</span><span style="left:64%">actif</span><span style="left:88%">après</span></div></div>
<div class="X-bloc"><p class="X-vrai"><span class="X-mes">mesuré</span> en dry hop, les hydrocarbures (résine, pin) culminent vers 3–6 h puis baissent ; les terpénols (floral) montent sur 24 h <span class="X-src">· Cascade 3,86 g/L, Wolfe 2012 (E05)</span></p></div>
<div class="X-bloc X-etape"><span class="X-n">3</span><p id="lev"></p></div>`,
  js: JS_BARRES + `
var rail=document.querySelector('.X-rail'), pouce=railHorizontal(rail); var REF=D.find(function(q){return q.id==='dryPost|7';});
function RENDRE(i){ var p=D[i]; pouce.style.left=x(i)+'%'; var b=document.getElementById('bulle'); b.style.left=x(i)+'%'; b.style.top='22px'; b.textContent=p.lib+(p.approx?' ≈':'');
  document.getElementById('chaud').style.display=p.seg>=2?'none':''; document.getElementById('barb').style.display=p.seg<2?'none':''; document.getElementById('vap').style.opacity=p.seg===0?1:0.5; document.getElementById('bulles').style.opacity=p.seg===2?1:0.15;
  var tot=0,n=0,pertes=[]; FAM.forEach(function(f){ if(REF.v[f]>0){ var q=Math.max(0,REF.v[f]-p.v[f])/REF.v[f]; tot+=q; n++; if(q>0.1) pertes.push([f,q]); } }); var part=Math.round(tot/n*100); pertes.sort(function(a,b){return b[1]-a[1];});
  var qui=pertes.slice(0,3).map(function(e){ return NOM[e[0]].toLowerCase(); }).join(', ');
  var mot = p.seg===0 ? '<b>La vapeur emporte ~'+part+' %</b> de l\\'arôme d\\'Idaho 7 à '+p.lib+'. Il reste surtout l\\'amertume.' : p.seg===1 ? '<b>Cuve arrêtée : la vapeur emporte encore ~'+part+' %</b>, moins d\\'amertume.' : p.seg===2 ? '<b>Le CO₂ emporte ~'+part+' %</b>, surtout '+qui+' ; le fruité reste.' : '<b>Rien ne part.</b> Tout ce qu\\'Idaho 7 donne reste dans la bière.';
  document.getElementById('mot').innerHTML=mot+(p.approx?' <span class="X-src">≈ interpolé</span>':'');
  majBarres(document.getElementById('barres'), p, REF); document.getElementById('ibu').textContent=ibuTexte(p);
  var a3=D.find(function(q){return q.id==='dryActive|3';}), p3=D.find(function(q){return q.id==='dryPost|3';});
  document.getElementById('lev').innerHTML='<b>Levure, dernière étape.</b> US-05 ne fait qu\\'emporter ('+txtCrans(crans('resin',a3.v.resin)-crans('resin',p3.v.resin))+' de résineux en actif), biotransformation non publiée ; Pomona convertirait le géraniol en citronellol : agrumes ~+'+Math.round(a3.vp.citrus-a3.v.citrus)+' points.'; }
poser(S.i);`,
};

// f7 — Le nez du verre : les arômes en bulles au-dessus de la stout, l'arc « haut du style ».
C.f7 = {
  titre: 'Quand ajouter Idaho 7 ?', chaleur: 'chaude', levure: 'pont',
  legende: ['verre : ta stout ; bulles : ce qu’Idaho 7 ajoute au nez, plus grosses quand c’est plus fort', 'anneau gris : le haut de la 16D ; une bulle qui remplit son anneau est au haut du style, au-delà elle passe en orangé', 'dock sous le pouce : glisse le moment ; ~ simulé'],
  css: `
.X-verre { background:#fff; border-radius:8px; padding:4px; position:relative; }
.X-verre svg { width:100%; height:auto; aspect-ratio:370/330; }
.X-bu { fill:#fff; stroke-width:2; }
.X-lab { font:600 12px var(--sans); fill:#55555f; }
.X-pct { font:600 12px var(--mono); }
.X-dock { position:fixed; left:0; right:0; bottom:0; background:#fff; border-top:1px solid var(--trait); padding:28px 16px 10px; max-width:390px; margin:0 auto; }
.X-dock .X-bulle { top:24px; }
.X-cale { height:84px; }
.X-ibu { font-size:12px; color:var(--gris); text-align:right; font-family:var(--mono); }
`,
  html: `<div class="X-bloc"><p class="X-rep" id="rep"></p><div class="X-top" id="top"></div></div>
<div class="X-verre"><svg viewBox="0 0 370 330" aria-label="Le nez de ta stout avec Idaho 7">
<g id="anneaux">${['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'stoneFruit', 'pomeFruit', 'berries', 'melon', 'resin', 'spice', 'green'].map((f, k) => `<circle cx="${40 + (k % 6) * 58}" cy="${k < 6 ? 44 : 112}" r="28" fill="none" stroke="#d9dce3" stroke-width="2"${k === 0 ? ' data-role="zone"' : ''}/>`).join('')}</g>
<g id="bulles"></g>
<text x="40" y="162" class="X-lab">le nez</text>
<path d="M135 196c-6 60 20 72 50 74 30-2 56-14 50-74z" fill="#2b2420" stroke="#16161a" stroke-width="1.6"/><path d="M135 196h100" stroke="#d9c9a3" stroke-width="4"/><path d="M185 270v30M160 302h50" stroke="#16161a" stroke-width="1.6"/>
<text x="250" y="240" class="X-lab">ta stout</text>
<text x="185" y="326" text-anchor="middle" class="X-lab" id="ibu"></text>
</svg></div>
<div class="X-bloc"><p class="X-vrai"><span class="X-mes">au nez d'un jury</span> (14–22 personnes) : tropical, ananas, papaye, mangue, lemongrass · linalol <span class="X-num">38 ± 13 µg/L</span> <span class="X-src">· Idaho 7 au pitch, S-04, 14 j, McCabe 2023 (E03)</span></p></div>
${PONT}
<div class="X-cale"></div>
<div class="X-dock" data-libre="moment"><div class="X-bulle" id="bulle"></div><div class="X-rail" role="slider" tabindex="0" aria-label="Moment de l'ajout" aria-valuemin="0" aria-valuemax="${N - 1}" aria-valuenow="${I_DEPART}" aria-valuetext="actif · J3"></div><div class="X-rep-rail"><span style="left:22%">ébullition</span><span style="left:48%">WP</span><span style="left:64%">actif</span><span style="left:88%">après</span></div></div>`,
  js: `
var rail=document.querySelector('.X-rail'), pouce=railHorizontal(rail);
// une place par famille autour du nez ; le résineux de ta dégustation reste au verre (dit dans la réponse)
var ORDRE=['floral','herbal','earthy','citrus','tropical','stoneFruit','pomeFruit','berries','melon','resin','spice','green'];
function placeDe(f){ var k=ORDRE.indexOf(f); return [40+(k%6)*58, k<6?44:112]; }
function RENDRE(i){ var p=D[i]; pouce.style.left=x(i)+'%'; var b=document.getElementById('bulle'); b.style.left=x(i)+'%'; b.textContent=p.lib+(p.approx?' ≈':'');
  var abs=document.body.classList.contains('X-abs'); var s='';
  document.querySelectorAll('#anneaux circle').forEach(function(c,k){ var f=ORDRE[k]; c.setAttribute('r', abs? (28*BANDE[f]/110).toFixed(1) : 28); });
  FAM.forEach(function(f){ var c=placeDe(f), v=p.v[f], inc=v===0&&p.haut[f]===0; var t=abs? v/110 : v/BANDE[f]; var r=inc?8:Math.max(7, Math.min(32, 28*t)); var hors=v>BANDE[f]; var col=hors?'#c2410c':BA[f];
    s+='<circle class="X-bu" cx="'+c[0]+'" cy="'+c[1]+'" r="'+r.toFixed(1)+'" stroke="'+col+'"'+(inc?' stroke-dasharray="2 3"':'')+'/>';
    if(inc) s+='<text x="'+c[0]+'" y="'+(c[1]+4)+'" text-anchor="middle" class="X-lab">?</text>'; else if(r>=9) s+='<svg x="'+(c[0]-8)+'" y="'+(c[1]-8)+'" width="16" height="16" data-famille="'+f+'" aria-label="'+NOM[f]+'"><use href="#p-'+f+'"/></svg>'; });
  document.getElementById('bulles').innerHTML=s; document.getElementById('ibu').textContent=ibuTexte(p)+' · résineux déjà hors style, ta dégustation'; document.getElementById('rep').innerHTML=reponse(p); top4(document.getElementById('top'), p); }
poser(S.i);`,
};

// f8 — Le compromis : amertume contre arôme, chaque moment un point sur la courbe, la 16D en rectangle.
C.f8 = {
  titre: 'Idaho 7 : quand, pour l’arôme ou l’amer ?', chaleur: 'chaude', levure: 'pont',
  legende: ['vers la droite : l’amertume ajoutée à ta stout (~IBU) ; vers le haut : le fruité ajouté, en crans de la 16D', 'chaque point est un moment ; le gris clair est la zone où ta stout reste dans la 16D (amertume 50–70, fruité ≤ 3 crans)', 'glisse le moment : le gros point se déplace ; ~ simulé ; à cru l’amertume n’est pas modélisée (points à gauche, en pointillé)'],
  css: `
.X-ch { background:#fff; border-radius:8px; padding:6px 6px 2px; }
.X-ch svg { width:100%; height:auto; aspect-ratio:370/260; }
.X-ax { font:600 12px var(--sans); fill:#55555f; }
.X-tk { font:12px var(--mono); fill:#55555f; }
.X-ptm { fill:#fff; stroke:#16161a; stroke-width:1.6; }
.X-frise { background:#fff; border-radius:8px; padding:26px 16px 6px; position:relative; }
`,
  html: `<div class="X-bloc"><p class="X-rep" id="rep"></p><div class="X-top" id="top"></div></div>
<div class="X-ch"><svg viewBox="0 0 370 260" aria-label="Amertume ajoutée contre fruité ajouté, par moment">
<rect id="zone" x="64" y="140" width="0" height="100" fill="#e6e8ee" data-role="zone"/>
<line x1="64" y1="240" x2="360" y2="240" stroke="#16161a" stroke-width="1"/><line x1="64" y1="20" x2="64" y2="240" stroke="#16161a" stroke-width="1"/>
${[0, 20, 40, 60, 80, 100].map((v) => `<text x="${64 + v / 110 * 292}" y="254" text-anchor="middle" class="X-tk">${v ? '+' + v : '0'}</text>`).join('')}
<text x="360" y="30" text-anchor="end" class="X-ax">amertume ajoutée (~IBU) →</text>
<g id="yax"></g><text x="70" y="30" class="X-ax">↑ fruité ajouté</text>
<path id="courbe" fill="none" stroke="#8a8a94" stroke-width="1.6"/>
<g id="pts"></g>
<g id="cur"><circle r="9" fill="#16161a"/></g>
<text id="lab" class="X-ax" fill="#16161a"></text>
</svg></div>
<div class="X-frise" data-libre="moment"><div class="X-bulle" id="bulle"></div><div class="X-rail" role="slider" tabindex="0" aria-label="Moment de l'ajout" aria-valuemin="0" aria-valuemax="${N - 1}" aria-valuenow="${I_DEPART}" aria-valuetext="actif · J3"></div><div class="X-rep-rail"><span style="left:22%">ébullition</span><span style="left:48%">WP</span><span style="left:64%">actif</span><span style="left:88%">après</span></div></div>
<div class="X-bloc"><p class="X-vrai"><span class="X-mes">mesuré</span> à dose égale (1,5 g/L), l'ébullition donne végétal cuit et herbacé ; le dry hop 48 h, tropical, agrumes, noyau, pin <span class="X-src">· Simcoe, Sharp 2014 (E07)</span></p></div>
${PONT}`,
  js: `
var rail=document.querySelector('.X-rail'), pouce=railHorizontal(rail);
function fruit(p){ var abs=document.body.classList.contains('X-abs'); var m=0; ['citrus','tropical','stoneFruit','berries','melon','pomeFruit'].forEach(function(f){ var v=abs? (p.v[f]-AV[f])/10 : crans(f,p.v[f]); if(v>m) m=v; }); return m; }
function X(p){ return 64+(p.cru?0:p.ibu)/110*292; } function Y(c){ return 240-Math.min(200, c/4.2*200); }
function RENDRE(i){ var p=D[i]; pouce.style.left=x(i)+'%'; var b=document.getElementById('bulle'); b.style.left=x(i)+'%'; b.style.top='22px'; b.textContent=p.lib+(p.approx?' ≈':'');
  var abs=document.body.classList.contains('X-abs'); var ya=''; [0,1,2,3,4].forEach(function(c){ ya+='<text x="58" y="'+(Y(c)+4)+'" text-anchor="end" class="X-tk">'+(abs? (c*10)+' pts' : c===4?'au-delà':c+' cr.')+'</text>'; }); document.getElementById('yax').innerHTML=ya;
  var z=document.getElementById('zone'); z.setAttribute('x',64); z.setAttribute('width', 10/110*292); z.setAttribute('y', Y(3)); z.setAttribute('height', 240-Y(3));
  var d='', pts=''; D.forEach(function(q,k){ var px=X(q), py=Y(fruit(q)); d+=(k?'L':'M')+px.toFixed(1)+' '+py.toFixed(1); pts+='<circle class="X-ptm" cx="'+px.toFixed(1)+'" cy="'+py.toFixed(1)+'" r="4"'+(q.cru?' stroke-dasharray="2 2"':'')+'/>'; });
  document.getElementById('courbe').setAttribute('d',d); document.getElementById('pts').innerHTML=pts;
  var cx=X(p), cy=Y(fruit(p)); document.getElementById('cur').setAttribute('transform','translate('+cx.toFixed(1)+','+cy.toFixed(1)+')');
  var lab=document.getElementById('lab'); lab.textContent=p.lib+' · '+(p.cru?'IBU à cru : ?':'~+'+p.ibu+' IBU')+' · fruité '+(abs? '~+'+Math.round(fruit(p)*10)+' pts' : txtCrans(fruit(p))); lab.setAttribute('x', Math.min(cx+12, 200)); lab.setAttribute('y', Math.max(cy-14, 44));
  document.getElementById('rep').innerHTML=reponse(p); top4(document.getElementById('top'), p); }
document.querySelectorAll('[data-e]').forEach(function(b){ b.addEventListener('click', function(){ RENDRE(S.i); }); });
poser(S.i);`,
};

// ---------- assemblage ----------
function page(id, c) {
  const pre = (s) => s.split('X-').join(id + '-');
  const corps = pre(tete(c.titre, c.legende)) + pre(LENT) + pre(c.html) + pre(ficheHTML());
  const css = pre(CSS_SOCLE + c.css);
  const js = pre(JS_SOCLE + c.js);
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dryhopper · série F · ${id}</title>
<style>${css}</style></head>
<body>
${PICTOS}
<main class="${id}-ecran">
${corps}
</main>
<script>
${js}
</script>
</body></html>
`;
}
for (const id of Object.keys(C)) {
  fs.mkdirSync(path.join(ici, id), { recursive: true });
  fs.writeFileSync(path.join(ici, id, 'etat.html'), page(id, C[id]));
  console.log(id, C[id].titre, '·', C[id].chaleur, '· levure :', C[id].levure);
}
console.log('moments', N, '· départ', D[I_DEPART].lib);
