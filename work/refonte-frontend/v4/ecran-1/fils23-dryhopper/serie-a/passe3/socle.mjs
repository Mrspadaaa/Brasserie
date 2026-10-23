// Socle commun de la série A (lot 23, Dryhopper, « le geste d'abord ») : données, en-tête, contexte,
// lentille au style / absolu, légende, barres l5b, jauge d'amertume, fiche d'Idaho 7 à l'appui long.
// Classes du socle préfixées « s- » (L26) ; chaque concept préfixe les siennes (« a1- »…).
// Assemblage par concaténation, jamais par String.replace (L26).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const ECRAN = path.resolve(ici, '../../..');
// Le certificat du lot (CoA ID7-2573), repris du moteur du lot 20 (d4/d5).
const LOT20 = JSON.parse(fs.readFileSync(path.join(ECRAN, 'fils20-dryhop/d4/moteur-lot20.json'), 'utf8'));
const trouverLot = (o) => { if (o && typeof o === 'object') { if (o.lot === 'ID7-2573' && o.composes) return o; for (const v of Object.values(o)) { const r = trouverLot(v); if (r) return r; } } return null; };
const COA = trouverLot(LOT20); if (!COA) throw new Error('CoA ID7-2573 introuvable');
const teneur = (c) => COA.composes[c].teneur.plage.central;
const fr = (x) => String(x).split('.').join(',');
const carte = fs.readFileSync(path.join(ECRAN, 'fils22-carte/dryhopper/etat.html'), 'utf8');
const a2b = fs.readFileSync(path.join(ECRAN, 'fils21-choisir/a2b/etat.html'), 'utf8');

// Les pictos de famille au trait (ceux de la base, repris de l'écran de la carte).
const i0 = carte.indexOf('<svg width="0" height="0"');
const SYM0 = carte.slice(i0, carte.indexOf('</svg>', carte.indexOf('</defs>', i0)) + 6);
// Épicé : cannelle et clou croisés, le choix du brasseur (23.10), repris tel quel de la planche standard.
const planche = fs.readFileSync(path.join(ECRAN, 'fils17-standard/v3/planche.html'), 'utf8');
const ps = planche.indexOf('<symbol id="p-spice"');
const SPICE = planche.slice(ps, planche.indexOf('</symbol>', ps) + 9);
const os = SYM0.indexOf('<symbol id="p-spice"');
if (ps < 0 || os < 0 || !SPICE.includes('rotate(40')) throw new Error('picto épicé introuvable');
export const SYMBOLES = SYM0.slice(0, os) + SPICE + SYM0.slice(SYM0.indexOf('</symbol>', os) + 9);

// Les données : la grille simulée d'Idaho 7 à 4 g/L avec US-05 dans la stout 16D (profils-simules.json,
// reprise par l'écran de la carte, D102 vérifiée), plus les points « ≈ interpolés » entre deux points
// calculés (60′ → 10′ → whirlpool), comme y1b.
const ligne = carte.split('\n').find((l) => l.startsWith('var T = '));
const X = new Function(ligne + '; return { T, BA, D, AV, B };')();
const grille = JSON.parse(fs.readFileSync(path.join(ECRAN, 'fils21-choisir/donnees/profils-simules.json'), 'utf8')).grille;
{ // contrôle d'entrée : la grille et la carte disent la même chose (M07)
  const g = grille.find((e) => e.nom === 'Idaho 7' && e.moment === 'dryActive' && e.jours === 3 && e.dose_gL === 4 && e.levure === 'fermentis-us05');
  const c = X.D.find((p) => p.id === 'dryActive|3');
  if (Math.abs(g.apres.floral[1] - c.v.floral) > 0.01) throw new Error('entrée : floral actif 3 j diffère de la grille');
}
const minute = (p) => (p.id === 'wp' ? -10 : +p.id.slice(1));
const ref = (m) => X.D.find((p) => p.id === (m === -10 ? 'wp' : 'b' + m));
for (const p of X.D) {
  if (!p.id.startsWith('b')) continue;
  const m = minute(p);
  if (!p.v) {
    const [a, b] = m > 10 ? [ref(60), ref(10)] : [ref(10), ref(-10)];
    const t = (minute(a) - m) / (minute(a) - minute(b));
    p.v = {}; for (const f of Object.keys(a.v)) p.v[f] = +(a.v[f] + (b.v[f] - a.v[f]) * t).toFixed(2);
    p.inc = [...new Set([...a.inc, ...b.inc])]; p.interp = true;
  }
  if (p.ibu == null) {
    const k = [60, 30, 15, 10, 5, 0], hi = k.filter((x) => x > m).pop(), lo = k.find((x) => x < m);
    const a = ref(hi).ibu, b = ref(lo).ibu;
    p.ibu = Math.round(a + (b - a) * (hi - m) / (hi - lo)); p.ibuInterp = true;
  }
}
X.POMONA = {};
for (const e of grille.filter((g) => g.nom === 'Idaho 7' && g.dose_gL === 4 && g.levure === 'lalbrew-pomona')) {
  const k = e.moment + (e.jours ? '|' + e.jours : ''), u = grille.find((g) => g.nom === 'Idaho 7' && g.dose_gL === 4 && g.levure === 'fermentis-us05' && g.moment === e.moment && g.jours === e.jours);
  X.POMONA[k] = Object.fromEntries(Object.keys(e.apres).map((f) => [f, +(e.apres[f][1] - u.apres[f][1]).toFixed(2)]));
}
export const DONNEES = X;

export const ETAPE = '../../../../fils22-carte/levure-etape/etat.html';
export const OUTIL = '../../../../fils22-carte/levure-outil/etat.html';

// La silhouette d'Idaho 7 selon ses fiches (radar de la fiche a2b, au trait, inconnu hachuré).
const lf = a2b.split('\n').find((l) => l.startsWith('const FICHES = '));
const FI7 = new Function('return ' + lf.slice('const FICHES = '.length).replace(/;\s*$/, ''))()['Idaho 7'];
const fi = FI7.indexOf('<svg class="fi-roue"');
const RADAR = FI7.slice(fi, FI7.indexOf('</text></svg>', fi) + 13);
if (fi < 0 || !RADAR.includes('data-objet="fiche"')) throw new Error('radar de la fiche introuvable');

const I_STOCK = '<svg class="s-stk" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="en stock"><path d="M12 22V12"/><path d="m16 17 2 2 4-4"/><path d="M21 11.1V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l1.3-.8"/><path d="M3.3 7 12 12l8.7-5"/></svg>';
export const I_SABLIER = '<svg class="s-ic" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.57" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2h12M6 22h12M7 2v4l5 6-5 6v4M17 2v4l-5 6 5 6v4"/></svg>';

const MOTS_FICHE = [['floral', 'Floral', 'floral'], ['herbal', 'Herbacé', 'thé noir'], ['earthy', 'Terreux', 'terreux'], ['citrus', 'Agrumes', 'orange, pamplemousse'], ['tropical', 'Tropicaux', 'papaye'], ['stoneFruit', 'Noyau', 'abricot'], ['berries', 'Baies', 'cassis'], ['resin', 'Résineux', 'résine, pin']];
const FICHE = '<div class="fi-voile" data-k="voile" aria-hidden="true"></div>'
  + '<section class="fi" data-role="fiche" role="dialog" tabindex="-1" aria-label="Fiche d\'Idaho 7">'
  + '<header class="fi-t"><h2>Idaho 7</h2><span class="fi-us" data-role="usage" data-usage="double">mixte</span>' + I_STOCK
  + '<button class="fi-x" data-role="fermer-fiche" data-k="fermer" aria-label="Fermer la fiche d\'Idaho 7"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.57" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button></header>'
  + '<p class="fi-w" data-role="fiche-alpha"><b class="num">α 12,7 %</b> ton lot · <span class="num">9,5–14,9 %</span> ses fiches</p>'
  + '<div class="fi-w fi-ar" data-role="fiche-arome">'
  + MOTS_FICHE.map(([f, n, m]) => '<span class="fi-l"><svg class="s-pi" width="14" height="14" data-famille="' + f + '" aria-label="' + n + '"><use href="#p-' + f + '"/></svg><b class="fi-' + f + '">' + n + '</b> ' + m + '</span>').join('')
  + '<span class="fi-src">1 fiche : Beer Maverick · Pépins, Melon, Épicé, Végétal non décrits</span>'
  + '<div class="fi-r">' + RADAR + '</div></div>'
  + '<p class="fi-w fi-coa" data-nature="mesure" data-source="CoA ID7-2573">ton lot (certificat) : huile ' + fr(COA.huile.plage.central) + ' mL/100 g · linalol ' + fr(teneur('linalol')) + ' % · géraniol ' + fr(teneur('geraniol')) + ' % · myrcène ' + fr(teneur('myrcene')) + ' %</p>'
  + '<div class="fi-act"><span class="fi-g" role="group" data-role="gout" aria-label="Mon goût pour Idaho 7"><button data-k="aimer" aria-pressed="false" aria-label="Aimer Idaho 7"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.57" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/></svg></button><button data-k="exclure" aria-pressed="false" aria-label="Exclure Idaho 7"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.57" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m5.7 5.7 12.6 12.6"/></svg></button></span></div>'
  + '</section>';

export const CSS_SOCLE = `
:root { --encre:#16161a; --gris:#55555f; --trait:#e3e5eb; --mur:#eef0f4; --acc:#c2410c; --i7:#e80030; --sans:"Source Sans 3",system-ui,-apple-system,"Segoe UI",sans-serif; --mono:"IBM Plex Mono",ui-monospace,Consolas,monospace; }
[hidden] { display:none !important; }
* { box-sizing:border-box; margin:0; padding:0; }
html, body { background:var(--mur); }
body { color:var(--encre); font:400 14px/1.25 var(--sans); -webkit-tap-highlight-color:transparent; overflow-x:hidden; }
::selection { background:#d9c3e6; }
button { font:inherit; color:inherit; background:none; border:0; cursor:pointer; }
button:focus-visible, [tabindex]:focus-visible, a:focus-visible { outline:2px solid var(--encre); outline-offset:2px; }
a { color:inherit; text-decoration:none; }
svg { display:block; flex:none; }
.num { font-family:var(--mono); font-variant-numeric:tabular-nums; }
.s-ecran { max-width:390px; margin:0 auto; padding:4px 10px 16px; display:flex; flex-direction:column; gap:8px; }
.s-barre { display:flex; align-items:center; gap:8px; min-height:40px; }
.s-retour { width:28px; height:28px; border-radius:50%; background:#fff; border:1px solid var(--trait); display:inline-flex; align-items:center; justify-content:center; flex:none; font:600 20px/1 var(--sans); padding-bottom:2px; }
h1.s-titre { font:600 17px/1.2 var(--sans); }
.s-etapes { display:flex; gap:6px; font-size:13px; }
.s-et { display:inline-flex; align-items:center; height:24px; padding:0 10px; border-radius:12px; background:#e2e5eb; color:var(--gris); }
.s-et.s-on { background:var(--encre); color:#fff; font-weight:600; }
.s-ctx { display:flex; flex-wrap:wrap; align-items:center; gap:4px; font-size:13px; color:var(--gris); }
.s-ctx .s-fixe { font-size:12px; margin-right:2px; }
.s-ctx [data-contexte] { display:inline-flex; align-items:center; gap:4px; height:22px; padding:0 8px; border-radius:11px; background:#e2e5eb; color:var(--encre); }
.s-pt { width:9px; height:9px; border-radius:50%; display:inline-block; flex:none; background:var(--i7); }
.s-pl { color:var(--gris); }
.s-us { font-size:12px; font-weight:600; }
.s-stk { color:var(--gris); }
.s-lent { display:flex; justify-content:flex-end; align-items:center; gap:6px; position:relative; }
.s-aide { width:26px; height:26px; border-radius:50%; border:1px solid #c9cad2; background:#fff; font-weight:700; color:var(--gris); margin-right:auto; }
.s-leg { position:absolute; top:32px; left:0; z-index:30; background:#fff; border:1px solid #c9cad2; border-radius:8px; padding:8px 10px; font-size:13px; display:flex; flex-direction:column; gap:4px; width:270px; box-shadow:0 8px 24px -12px rgba(22,22,26,.4); }
.s-seg { display:inline-flex; background:#e2e5eb; border-radius:15px; padding:2px; }
.s-seg button { height:26px; padding:0 10px; border-radius:13px; font-size:13px; color:var(--gris); }
.s-seg button[aria-checked="true"] { background:#fff; color:var(--encre); font-weight:600; }
.s-bloc { background:#fff; border-radius:8px; padding:8px 10px; display:flex; flex-direction:column; gap:4px; }
.s-pi { width:16px; height:16px; }
.s-ic { color:var(--gris); }
.s-src { display:flex; align-items:center; gap:5px; font-size:12px; color:var(--gris); }
.s-src b { color:var(--encre); font-weight:600; }
.s-ba { display:grid; grid-template-columns:88px 1fr 40px; align-items:center; gap:6px; font-size:13px; min-height:18px; }
.s-ba-n { display:flex; align-items:center; gap:4px; white-space:nowrap; }
.s-ba-n.s-att { font-weight:700; }
.s-ba-v { text-align:right; font-size:12px; }
.s-piste { position:relative; height:12px; background:#f1f2f5; border-radius:2px; overflow:hidden; }
.s-piste i { position:absolute; top:0; bottom:0; left:0; display:block; }
.s-piste .s-zone { width:var(--ws); background:#d9dce3; }
.s-piste .s-rem { width:var(--ws); height:6px; top:3px; border-radius:2px; transition:width .18s cubic-bezier(.2,.8,.2,1); }
.s-interp .s-rem { opacity:.5; }
.s-piste .s-av { left:clamp(5px, var(--ws), calc(100% - 5px)); width:10px; height:10px; top:1px; border-radius:50%; border:2px solid var(--encre); background:#fff; margin-left:-5px; }
.s-piste .s-hach { right:0; background:repeating-linear-gradient(135deg,#c9cdd6 0 2px,transparent 2px 6px); }
body.abs .s-piste .s-zone, body.abs .s-piste .s-rem { width:var(--wa); }
body.abs .s-piste .s-av { left:clamp(5px, var(--wa), calc(100% - 5px)); }
.s-jauge { display:grid; grid-template-columns:auto 1fr; gap:3px 8px; align-items:center; font-size:13px; }
.s-jauge .s-jv { text-align:right; font-weight:600; }
.s-jauge .s-jv.s-h { color:var(--acc); }
.s-jp { grid-column:1 / -1; position:relative; height:10px; background:#f1f2f5; border-radius:2px; }
.s-jp i { position:absolute; top:0; bottom:0; display:block; border-radius:2px; }
.s-jp .s-jz { background:#d9dce3; }
.s-jp .s-jb { background:#8a8f9c; }
.s-jp .s-ja { background:var(--encre); transition:width .18s; }
.s-jp .s-ja.s-h { background:var(--acc); }
.s-jp .s-ja.s-ip { opacity:.55; }
nav.s-pont { display:flex; justify-content:flex-end; }
nav.s-pont a { display:inline-flex; align-items:center; height:32px; padding:0 14px; border-radius:16px; background:#fff; border:1px solid #c9cad2; color:var(--encre); font-weight:600; font-size:13px; }
/* La fiche (appui long sur Idaho 7). */
#s-fiche { position:relative; z-index:40; }
.fi-voile { position:fixed; inset:0; background:rgba(22,22,26,.32); }
.fi { position:fixed; left:0; right:0; bottom:0; max-height:88vh; overflow-y:auto; background:var(--mur); border-radius:8px 8px 0 0; box-shadow:0 -12px 40px -16px rgba(22,22,26,.6); padding:8px 10px 12px; display:flex; flex-direction:column; gap:6px; max-width:390px; margin:0 auto; }
.mode-bulle .fi { left:calc(50% + 211px); right:auto; bottom:auto; top:16px; width:360px; border-radius:8px; margin:0; box-shadow:0 8px 24px -12px rgba(22,22,26,.5); }
@media (max-width:1000px) { .mode-bulle .fi { left:auto; right:16px; } }
.fi-t { display:flex; align-items:center; gap:8px; min-height:30px; }
.fi-t h2 { font-size:16px; font-weight:700; }
.fi-us { font-size:13px; font-weight:600; }
.fi-x { margin-left:auto; width:28px; height:28px; border-radius:50%; background:#fff; border:1px solid var(--trait); display:inline-flex; align-items:center; justify-content:center; }
.fi-w { background:#fff; border-radius:8px; padding:8px 10px; font-size:13px; }
.fi-ar { display:flex; flex-wrap:wrap; gap:4px 12px; }
.fi-l { display:inline-flex; align-items:center; gap:4px; }
.fi-l b { font-weight:600; }
.fi-floral { color:#9840bc; } .fi-herbal { color:#377853; } .fi-earthy { color:#75694d; } .fi-citrus { color:#856e0c; }
.fi-tropical { color:#9b5d0d; } .fi-stoneFruit { color:#b5481c; } .fi-berries { color:#9b3f74; } .fi-resin { color:#2f6b5f; }
.fi-src { flex-basis:100%; font-size:12px; color:var(--gris); }
.fi-r { flex-basis:100%; display:flex; justify-content:center; }
.fi-r svg { width:300px; height:auto; }
.fi-r text { font-family:var(--sans); }
.fi-g { display:inline-flex; gap:2px; background:#fff; border-radius:15px; padding:2px; border:1px solid var(--trait); }
.fi-g button { width:28px; height:28px; border-radius:14px; display:inline-flex; align-items:center; justify-content:center; color:var(--gris); }
.fi-g button[aria-pressed="true"] { background:var(--encre); color:#fff; }
`;

// Le code client commun : il expose window.S aux concepts.
function socleClient() {
  var X = window.S_DATA, D = X.D, AV = X.AV, B = X.B, T = X.T, BA = X.BA, N = D.length - 1;
  var NOM = { floral: 'Floral', herbal: 'Herbacé', earthy: 'Terreux', citrus: 'Agrumes', tropical: 'Tropicaux', stoneFruit: 'Noyau', pomeFruit: 'Pépins', berries: 'Baies', melon: 'Melon', resin: 'Résineux', spice: 'Épicé', green: 'Végétal' };
  var ORDRE = ['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'stoneFruit', 'pomeFruit', 'berries', 'melon', 'resin', 'spice', 'green'];
  var ATT = { floral: 1, herbal: 1, earthy: 1 };
  function pi(f, s) { s = s || 16; return '<svg class="s-pi" width="' + s + '" height="' + s + '" style="width:' + s + 'px;height:' + s + 'px" data-famille="' + f + '" aria-label="' + NOM[f] + '"><use href="#p-' + f + '"/></svg>'; }
  function inc(p, f) { return !p.v || p.inc.indexOf(f) >= 0; }
  function d(p, f) { return inc(p, f) ? null : p.v[f] - AV[f]; }
  function sg(p) { return p.interp ? '≈' : '~'; }
  function fmt(p, f) { var x = d(p, f); if (x == null) return '?'; if (Math.abs(x) < 0.5) return sg(p) + '0'; return sg(p) + (x > 0 ? '+' : '−') + Math.abs(Math.round(x)); }
  function hors(p, f) { return !inc(p, f) && p.v[f] > B[f]; }
  function ibu(p) {
    if (p.cru) return { n: 60, t: '60 IBU', s: 'tenue', h: false, cru: true };
    var n = 60 + p.ibu; return { n: n, t: (p.ibuInterp ? '≈' : '~') + n + ' IBU', s: n > 70 ? 'trop amer' : 'tenue', h: n > 70, ip: !!p.ibuInterp };
  }
  function idx(id) { for (var k = 0; k <= N; k++) if (D[k].id === id) return k; return -1; }
  function depart() { var q = location.search.match(/moment=([^&]+)/); var i = q ? idx(decodeURIComponent(q[1])) : -1; return i >= 0 ? i : idx('dryActive|3'); }
  function w(x, f, m) { return (m === 's' ? Math.min(100, x / B[f] / 2 * 100) : Math.min(100, x / 110 * 100)).toFixed(1) + '%'; }
  function barres(el, fams) {
    fams = fams || ORDRE;
    el.innerHTML = fams.map(function (f) {
      return '<div class="s-ba" data-f="' + f + '"><span class="s-ba-n' + (ATT[f] ? ' s-att' : '') + '">' + pi(f) + '<span>' + NOM[f] + '</span></span>'
        + '<span class="s-piste"><i class="s-zone" data-role="zone" style="--ws:50%;--wa:' + (B[f] / 110 * 100).toFixed(1) + '%"></i><i class="s-rem" style="background:' + BA[f] + '"></i>'
        + '<i class="s-av" style="--ws:' + w(AV[f], f, 's') + ';--wa:' + w(AV[f], f, 'a') + '"></i><i class="s-hach"></i></span><span class="s-ba-v num"></span></div>';
    }).join('');
    return function (p) {
      el.querySelectorAll('[data-f]').forEach(function (r) {
        var f = r.dataset.f, rem = r.querySelector('.s-rem'), h = r.querySelector('.s-hach'), v = r.querySelector('.s-ba-v'), u = inc(p, f);
        rem.hidden = u; h.hidden = !u; r.classList.toggle('s-interp', !!p.interp);
        if (!u) { rem.style.setProperty('--ws', w(p.v[f], f, 's')); rem.style.setProperty('--wa', w(p.v[f], f, 'a')); }
        v.textContent = fmt(p, f); v.style.color = u ? '#55555f' : (hors(p, f) ? '#c2410c' : T[f]);
      });
    };
  }
  function jauge(el, court) {
    var S = 170, pc = function (x) { return (x / S * 100).toFixed(1) + '%'; };
    el.className = 's-jauge';
    el.innerHTML = '<span>' + (court ? 'amertume' : 'amertume de ta stout') + '</span><span class="s-jv num"></span>'
      + '<span class="s-jp" aria-hidden="true"><i class="s-jz" style="left:' + pc(50) + ';width:' + pc(20) + '"></i><i class="s-jb" style="left:0;width:' + pc(60) + '"></i><i class="s-ja" style="left:' + pc(60) + '"></i></span>';
    var v = el.querySelector('.s-jv'), a = el.querySelector('.s-ja');
    return function (p) {
      var b = ibu(p); v.textContent = b.t + ' · ' + b.s + (b.cru ? ' (à cru ?)' : ''); v.classList.toggle('s-h', b.h);
      a.style.width = pc(Math.min(S, b.n) - 60); a.classList.toggle('s-h', b.h); a.classList.toggle('s-ip', !!b.ip);
    };
  }
  var lecteurs = [];
  document.querySelectorAll('[data-e]').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('[data-e]').forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
      document.body.classList.toggle('abs', b.dataset.e === 'absolu'); lecteurs.forEach(function (f) { f(); });
    });
  });
  function fermerLegendes() { document.querySelectorAll('[data-role=legende]').forEach(function (l) { l.hidden = true; }); document.querySelectorAll('[data-role=legende-bouton]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); }); }
  document.querySelectorAll('[data-role=legende-bouton]').forEach(function (b) {
    b.addEventListener('click', function () { var l = document.getElementById(b.getAttribute('aria-controls')); l.hidden = !l.hidden; b.setAttribute('aria-expanded', String(!l.hidden)); });
  });
  // La fiche : appui long (500 ms) ou survol long (750 ms) sur le nom d'Idaho 7.
  var R = document.getElementById('s-fiche'), ouverte = false, appui = null, avale = 0, survol = null, tFerme = null;
  function ouvrir(mode) { R.className = 'mode-' + mode; R.innerHTML = mode === 'bulle' ? X.FICHE.split('<div class="fi-voile" data-k="voile" aria-hidden="true"></div>').join('') : X.FICHE; ouverte = true; }
  function fermer() { R.innerHTML = ''; ouverte = false; }
  R.addEventListener('click', function (e) {
    var b = e.target.closest('[data-k]'); if (!b) return;
    if (b.dataset.k === 'fermer' || b.dataset.k === 'voile') { e.stopPropagation(); fermer(); return; }
    if (b.dataset.k === 'aimer' || b.dataset.k === 'exclure') b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
  });
  document.addEventListener('click', function (e) { if (performance.now() < avale) { e.stopPropagation(); e.preventDefault(); } }, true);
  document.addEventListener('pointerdown', function (e) {
    if (R.contains(e.target)) return;
    var h = e.target.closest && e.target.closest('[data-houblon]'); if (!h) return;
    var a = { x: e.clientX, y: e.clientY, id: e.pointerId };
    appui = a; a.t = setTimeout(function () { if (appui !== a) return; appui = null; avale = performance.now() + 600; ouvrir(e.pointerType === 'mouse' || innerWidth >= 700 ? 'bulle' : 'feuille'); }, 500);
  }, true);
  document.addEventListener('pointermove', function (e) { if (appui && e.pointerId === appui.id && Math.hypot(e.clientX - appui.x, e.clientY - appui.y) > 10) { clearTimeout(appui.t); appui = null; } }, true);
  document.addEventListener('pointerup', function () { if (appui) { clearTimeout(appui.t); appui = null; } }, true);
  document.addEventListener('contextmenu', function (e) { if (e.target.closest && e.target.closest('[data-houblon],[data-sans-menu]')) e.preventDefault(); });
  document.addEventListener('pointerover', function (e) {
    if (e.pointerType !== 'mouse') return;
    if (R.contains(e.target)) { clearTimeout(tFerme); return; }
    var h = e.target.closest && e.target.closest('[data-houblon]');
    if (!h) return; if (survol) return;
    survol = setTimeout(function () { survol = null; if (!ouverte) ouvrir('bulle'); }, 750);
  });
  document.addEventListener('pointerout', function (e) {
    if (e.pointerType !== 'mouse') return;
    var vers = e.relatedTarget, h = e.target.closest && e.target.closest('[data-houblon]');
    if (h && !(vers && h.contains(vers))) { clearTimeout(survol); survol = null; }
    if (ouverte && R.className === 'mode-bulle' && !(vers && (R.contains(vers) || (vers.closest && vers.closest('[data-houblon]'))))) { clearTimeout(tFerme); tFerme = setTimeout(fermer, 650); }
  });
  addEventListener('keydown', function (e) { if (e.key !== 'Escape') return; fermerLegendes(); if (ouverte) fermer(); });
  if (/fiche=1/.test(location.search)) ouvrir('feuille');
  if (/legende=1/.test(location.search)) document.querySelector('[data-role=legende-bouton]').click();
  window.S = { D: D, AV: AV, B: B, T: T, BA: BA, N: N, NOM: NOM, ORDRE: ORDRE, pi: pi, inc: inc, d: d, fmt: fmt, hors: hors, ibu: ibu, idx: idx, depart: depart, barres: barres, jauge: jauge, surLecture: function (f) { lecteurs.push(f); } };
}

const esc = (s) => s.split('&').join('&amp;').split('<').join('&lt;');

// Une page de concept. c : { id, titre, css, corps, script (fonction), levure: 'etape'|'pont', legende: [lignes] }
export function page(c) {
  const ctx = '<p class="s-ctx" data-role="contexte">'
    + '<span data-contexte="houblon"><i class="s-pt" data-couleur="#e80030" data-serie="Idaho 7"></i><span data-houblon="Idaho 7">Idaho 7</span>'
    + ' <span class="num" data-role="alpha" data-source="lot" data-houblon-alpha="Idaho 7">α 12,7 %</span><span class="num s-pl">9,5–14,9</span><span class="s-us" data-role="usage" data-usage="double">mixte</span>' + I_STOCK + '</span>'
    + '<span data-contexte="dose">4 g/L</span><span data-contexte="levure">US-05</span><span data-contexte="base">Stout 16D</span></p>';
  const etapes = c.levure === 'etape' ? '<nav class="s-etapes" aria-label="Étapes de Dryhopper"><span class="s-et s-on">1 · Quand</span><a class="s-et" href="' + ETAPE + '">2 · Levure ›</a></nav>' : '';
  const leg = '<div class="s-lent"><button type="button" class="s-aide" data-role="legende-bouton" aria-expanded="false" aria-controls="leg-' + c.id + '" aria-label="Lire la légende">?</button>'
    + '<div class="s-leg" id="leg-' + c.id + '" data-role="legende" hidden>' + c.legende.map((l) => '<span>' + l + '</span>').join('') + '</div>'
    + '<span class="s-seg" data-lecture role="radiogroup" aria-label="lecture au style ou absolu"><button type="button" role="radio" aria-checked="true" data-e="style">Au style</button><button type="button" role="radio" aria-checked="false" data-e="absolu">Absolu</button></span></div>';
  const pont = c.levure === 'pont' ? '<nav class="s-pont" aria-label="Pont vers Levure"><a href="' + OUTIL + '">Que change ma levure ? ›</a></nav>' : '';
  const donnees = Object.assign({}, DONNEES, { FICHE });
  return '<!doctype html>\n<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">\n'
    + '<title>' + esc(c.id + ' · ' + c.nom) + '</title>\n<style>' + CSS_SOCLE + c.css + '</style></head>\n<body class="' + c.id + '">\n'
    + SYMBOLES + '\n<main class="s-ecran">\n'
    + '<header class="s-barre"><a class="s-retour" aria-label="Retour" href="../../../../fils22-carte/carte.html">‹</a><h1 class="s-titre">' + c.titre + '</h1></header>\n'
    + etapes + ctx + '\n' + leg + '\n' + c.corps + '\n' + pont + '\n</main>\n<div id="s-fiche"></div>\n'
    + '<script>window.S_DATA = ' + JSON.stringify(donnees).split('</').join('<\\/') + ';\n(' + socleClient.toString() + ')();\n(' + c.script.toString() + ')();\n</script>\n</body></html>\n';
}
