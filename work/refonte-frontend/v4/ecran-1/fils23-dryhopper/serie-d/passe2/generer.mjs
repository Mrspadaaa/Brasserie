// d8b, « Le ruban de ta stout », passe 2 (voie r7d2-passe2, lot 23). La v0 (../d8/etat.html) reste intacte.
// Usage : node generer.mjs   → d8/etat.html
//
// Retouches du critique (tri/SYNTHESE.md, « Candidates », d8) :
//   1. la part emportée est nommée (« emporté par la chaleur / par le CO₂ ») et dessinée famille par famille,
//      à sa vraie longueur (centre « à froid » − centre au moment), en hachuré à la couleur de la famille ;
//   2. α du lot puis plage des fiches (déjà là), plus le stock en icône (D23 ter) ;
//   3. un toucher sur un segment du ruban ouvre les barres l5b des 12 familles (celle touchée en avant).
// Greffes : barres divergentes « contre après » (g8) en bascule des mini-rubans ; l'allure de la levure sur le
// rail pour tracer actif / après (f5, g6) ; la chaîne « Ma bière → + Idaho 7 → Levure › » (b2) ; hachure
// « à cru, IBU ? » sur la jauge d'amertume (g1) ; sauts 60′ / WP / actif / après et loupe (a1, b1) ; « 2 j
// sans gain » sur les jours (e2) ; teneur du lot dans la fiche (d5).
// Acquis de Dryhopper balisés : geste (rail par 5′, data-pas), frise (étapes puis jours en bout), valeurs
// (mesure sourcée qui suit le moment), levure (dernière étape, data-forme="etape").
// Code client assemblé par concaténation ; classes préfixées d8- (L26) et dx- (socle).
import fs from 'node:fs';
import path from 'node:path';
import { ici, SYMBOLES, MOMENTS as M, DEPART, MEILLEUR, AVANT, AVANT_INC, BANDE, JET, COURT, ORDRE, ROUE, contexte, fiche } from './socle.mjs';

const STAGES = [...M.slice(0, 11).map((p) => p.lib), 'WP', 'actif', 'après']; // 14 crans du rail
const LEGENDE = [
  'ruban : une longueur par famille, au style ; trait gris dessous : dans le style, orangé : au-delà',
  'hachuré au bout, à la couleur de la famille : ce que la chaleur ou le CO₂ emporte',
  'touche un segment : les 12 barres ; « contre après » : ce que ce moment change contre un dry hop après, mêmes jours',
  'bosse sur « actif » : la levure travaille encore (allure, à confirmer à la densité)',
  '~ simulé ; ≈ interpolé entre 60′ et 10′ ; ? inconnu, jamais 0',
  'rond violet : meilleur pour ta demande (actif · 2 j, 0,01 devant 3 j) ; au-delà de 2 j, sans gain simulé',
];

const CSS = `
:root { --encre:#16161a; --gris:#55555f; --trait:#e3e5eb; --mur:#eef0f4; --acc:#c2410c; --hop:#5b3fa0; --sans:"Source Sans 3",system-ui,-apple-system,"Segoe UI",sans-serif; --mono:"IBM Plex Mono",ui-monospace,Consolas,monospace; }
[hidden] { display:none !important; }
* { box-sizing:border-box; margin:0; padding:0; }
html, body { background:var(--mur); }
body { color:var(--encre); font:400 14px/1.25 var(--sans); -webkit-tap-highlight-color:transparent; }
::selection { background:#d9d0ef; }
button { font:inherit; color:inherit; background:none; border:0; cursor:pointer; }
a { color:inherit; text-decoration:none; }
svg { display:block; flex:none; }
:focus-visible { outline:2px solid var(--hop); outline-offset:2px; }
.num { font-family:var(--mono); font-variant-numeric:tabular-nums; }
.pi { width:16px; height:16px; }
.dx-ecran { max-width:390px; margin:0 auto; padding:4px 10px 112px; display:flex; flex-direction:column; gap:7px; }
.dx-barre { display:flex; align-items:center; gap:8px; min-height:36px; }
.dx-retour { width:28px; height:28px; border-radius:50%; background:#fff; border:1px solid var(--trait); display:inline-flex; align-items:center; justify-content:center; flex:none; font:600 20px/1 var(--sans); padding-bottom:2px; }
.dx-titre { font:600 17px/1.2 var(--sans); }
.dx-ctx { display:flex; flex-wrap:wrap; align-items:center; gap:4px; font-size:13px; color:var(--gris); }
.dx-fixe { font-size:12px; margin-right:2px; }
.dx-ctx [data-contexte] { display:inline-flex; align-items:center; gap:4px; height:22px; padding:0 8px; border-radius:11px; background:#e2e5eb; color:var(--encre); }
.dx-hop { display:inline-flex; align-items:center; gap:4px; font-weight:600; -webkit-user-select:none; user-select:none; -webkit-touch-callout:none; cursor:default; }
.dx-pt { width:10px; height:10px; border-radius:50%; display:inline-block; flex:none; }
.dx-al { font-size:13px; } .dx-pl { color:var(--gris); }
.dx-us { font-size:12px; font-weight:600; padding:0 5px; border-radius:9px; border:1px solid #9a9aa6; color:var(--gris); }
.dx-stk { display:inline-block; width:12px; height:12px; border:2px solid var(--encre); border-radius:2px; background:var(--encre); box-shadow:inset 0 0 0 2px #fff; }
.dx-lent { display:flex; justify-content:flex-end; align-items:center; gap:6px; position:relative; }
.dx-aide { width:26px; height:26px; border-radius:50%; border:1px solid #c9cad2; background:#fff; font-weight:700; color:var(--gris); margin-right:auto; }
.dx-leg { position:absolute; top:32px; left:0; z-index:15; background:#fff; border:1px solid #c9cad2; border-radius:8px; padding:8px 10px; font-size:13px; display:flex; flex-direction:column; gap:5px; width:330px; box-shadow:0 6px 18px rgba(22,22,26,.14); }
.dx-seg { display:inline-flex; background:#e2e5eb; border-radius:15px; padding:2px; }
.dx-seg button { height:26px; padding:0 10px; border-radius:13px; font-size:13px; color:var(--gris); }
.dx-seg button[aria-checked="true"] { background:#fff; color:var(--encre); font-weight:600; }
.dx-bloc { background:#fff; border-radius:8px; padding:8px 10px; }
.dx-src { font-size:12px; color:var(--gris); }
.dx-hors { color:var(--acc); font-weight:600; }
/* fiche (socle v0) */
.dx-fiche { position:fixed; left:0; right:0; bottom:0; max-width:390px; margin:0 auto; background:#fff; border-radius:8px 8px 0 0; box-shadow:0 -8px 28px rgba(0,0,0,.22); padding:10px 14px 14px; z-index:30; display:flex; flex-direction:column; gap:8px; }
.dx-fh { display:flex; align-items:center; gap:6px; } .dx-fh h3 { font-size:18px; color:var(--hop); }
.dx-fx { margin-left:auto; width:28px; height:28px; display:inline-flex; align-items:center; justify-content:center; border-radius:50%; background:#eef0f4; }
.dx-fa { font-size:13px; } .dx-fa small, .dx-fl small { color:var(--gris); font-size:12px; }
.dx-fc { display:flex; gap:8px; align-items:flex-start; }
.dx-fl { list-style:none; display:flex; flex-direction:column; gap:3px; font-size:13px; }
.dx-fl li { display:flex; align-items:center; gap:4px; flex-wrap:wrap; }
.dx-fm { color:var(--gris); font-size:12px; } .dx-fnd { color:var(--gris); }
.dx-fg { display:flex; gap:6px; } .dx-fg button { width:34px; height:30px; border-radius:15px; border:1px solid #c9cad2; display:inline-flex; align-items:center; justify-content:center; }
.dx-fg button[aria-pressed="true"] { background:var(--encre); color:#fff; }
/* le dock sous le pouce : rail par 5′, puis la frise (sauts) et les jours en bout */
.d8-dock { position:fixed; left:0; right:0; bottom:0; max-width:390px; margin:0 auto; background:#fff; border-top:1px solid var(--trait); padding:28px 14px 8px; z-index:10; display:flex; flex-direction:column; gap:6px; }
.d8-rail { position:relative; height:22px; cursor:pointer; touch-action:none; margin:0 4px; }
.d8-z { position:absolute; top:8px; height:6px; border-radius:2px; }
.d8-z0 { left:0; width:59%; background:#d9b8a0; } .d8-z1 { left:59%; width:11%; background:#c9cdd6; } .d8-z2 { left:70%; width:15%; background:#b9a9dc; } .d8-z3 { left:85%; width:15%; background:#9f8cc9; }
.d8-lev { position:absolute; left:70%; width:15%; top:-9px; height:14px; overflow:visible; }
.d8-best { position:absolute; top:3px; width:2px; height:16px; margin-left:-1px; background:var(--hop); }
.d8-cran { position:absolute; top:4px; width:1px; height:14px; background:var(--encre); }
.d8-pouce { position:absolute; top:2px; width:18px; height:18px; margin-left:-9px; border-radius:50%; background:var(--encre); border:2px solid #fff; box-shadow:0 1px 3px rgba(22,22,26,.35); transition:left .12s ease-out; }
.d8-pouce-l { position:absolute; bottom:22px; left:50%; transform:translateX(-50%); white-space:nowrap; background:var(--encre); color:#fff; font:600 13px var(--sans); padding:2px 8px; border-radius:11px; }
.d8-loupe { position:absolute; left:8px; right:8px; top:-46px; height:40px; display:none; background:#fff; border:1px solid #c9cad2; border-radius:8px; overflow:hidden; box-shadow:0 4px 12px rgba(22,22,26,.12); }
.d8-dock.d8-touche .d8-loupe { display:block; }
.d8-dock.d8-touche .d8-pouce-l { visibility:hidden; }
.d8-loupe span { position:absolute; top:7px; transform:translateX(-50%); font:600 14px var(--mono); color:var(--gris); white-space:nowrap; }
.d8-loupe span.ici { color:#fff; background:var(--encre); padding:0 6px; border-radius:4px; }
.d8-frise { display:flex; align-items:center; gap:4px; }
.d8-frise button { height:28px; padding:0 9px; border-radius:14px; border:1px solid #c9cad2; background:#fff; font-size:13px; font-weight:600; white-space:nowrap; }
.d8-frise [data-etape][aria-current="true"] { background:var(--encre); color:#fff; border-color:var(--encre); }
.d8-frise .d8-sep { flex:1; height:1px; background:#c9cad2; min-width:4px; }
.d8-jours { display:inline-flex; gap:3px; }
.d8-jours button { padding:0 7px; font-family:var(--mono); font-weight:600; }
.d8-jours button[aria-checked="true"] { background:var(--hop); color:#fff; border-color:var(--hop); }
.d8-jours button.d8-plat:not([aria-checked="true"]) { background:repeating-linear-gradient(135deg,#eef0f4 0 2px,#fff 2px 5px); }
.d8-jours[aria-disabled="true"] button { color:#55555f; border-style:dashed; }
/* le ruban */
.d8-bloc { display:flex; flex-direction:column; gap:3px; }
.d8-l { display:flex; align-items:baseline; gap:6px; font-size:13px; color:var(--gris); margin-top:2px; }
.d8-l b { color:var(--encre); font-size:14px; }
.d8-ch::before, .d8-lv::before { content:"→"; color:var(--gris); font-size:14px; }
.d8-ch b::before { content:"+ "; }
.d8-rub { position:relative; height:32px; display:flex; overflow:hidden; }
.d8-grand { height:58px; }
.d8-s { position:relative; height:100%; flex:none; display:flex; align-items:center; justify-content:center; overflow:hidden; padding:0; border-radius:0; transition:width .24s cubic-bezier(.2,.8,.2,1); }
.d8-s:first-child { border-radius:4px 0 0 4px; }
.d8-s .d8-pc { background:#fff; border-radius:4px; padding:1px; display:flex; }
.d8-s i.d8-zs { position:absolute; left:0; bottom:0; height:4px; background:#9a9aa6; }
.d8-s i.d8-o { position:absolute; bottom:0; height:4px; background:#c2410c; }
.d8-s[aria-expanded="true"] { box-shadow:inset 0 0 0 2px var(--encre); }
.d8-e { height:100%; flex:none; transition:width .24s; }
.d8-e:last-child { border-radius:0 4px 4px 0; }
.d8-res { display:flex; align-items:center; gap:5px; flex-wrap:wrap; font-size:14px; font-weight:600; min-height:20px; }
.d8-res .d8-emp { margin-left:auto; font-weight:400; font-size:13px; color:var(--gris); display:inline-flex; align-items:center; gap:4px; }
.d8-res .d8-emp i { width:16px; height:10px; border-radius:2px; background:repeating-linear-gradient(135deg,#8a8f99 0 2px,transparent 2px 5px); box-shadow:inset 0 0 0 1px #8a8f99; }
.d8-lv { display:flex; align-items:center; gap:6px; font-size:13px; }
.d8-lv a { display:inline-flex; align-items:center; height:30px; padding:0 12px; border-radius:15px; background:var(--encre); color:#fff; font-weight:600; font-size:14px; }
.d8-lv span { color:var(--gris); }
.d8-lv b { color:#856e0c; font-weight:600; }
/* les 12 barres, à un toucher */
.d8-bar { display:flex; flex-direction:column; gap:2px; }
.d8-r { display:grid; grid-template-columns:90px 1fr 44px; align-items:center; gap:6px; min-height:22px; font-size:13px; border-radius:4px; }
.d8-r.d8-ici { background:#f1eef9; font-weight:700; }
.d8-n { display:flex; align-items:center; gap:4px; }
.d8-p { position:relative; height:12px; background:#f1f2f5; border-radius:2px; overflow:hidden; }
.d8-p i { position:absolute; top:0; bottom:0; left:0; display:block; }
.d8-pz { background:#d9dce3; }
.d8-pf, .d8-pe { top:3px !important; bottom:3px !important; }
.d8-pf { border-radius:2px; }
.d8-pa { width:10px; height:10px; top:1px !important; border-radius:50%; border:2px solid var(--encre); background:#fff; margin-left:-5px; }
.d8-ph { right:0; background:repeating-linear-gradient(135deg,#c9cdd6 0 2px,transparent 2px 6px); }
.d8-v { text-align:right; font-family:var(--mono); font-size:13px; }
/* étapes ou contre après */
.d8-mini { display:flex; flex-direction:column; gap:5px; }
.d8-mt { display:flex; justify-content:space-between; align-items:center; }
.d8-mg { display:grid; grid-template-columns:50px 1fr; gap:5px 8px; align-items:center; font-size:13px; }
.d8-mg .d8-rub { height:20px; }
.d8-mr { display:flex; flex-direction:column; gap:3px; }
.d8-mi { position:relative; height:5px; background:#f1f2f5; border-radius:2px; overflow:hidden; }
.d8-mi i { position:absolute; top:0; bottom:0; display:block; }
.d8-ml { display:inline-flex; align-items:center; gap:4px; color:var(--gris); }
.d8-ml.d8-ici { font-weight:700; color:var(--encre); }
.d8-ml.d8-amer { color:var(--acc); }
.d8-dem { width:8px; height:8px; border-radius:50%; border:2px solid var(--hop); display:inline-block; }
.d8-dv { display:grid; grid-template-columns:20px 1fr 44px; gap:1px 6px; align-items:center; font-size:13px; }
.d8-dp { position:relative; height:12px; }
.d8-dp::before { content:""; position:absolute; left:50%; top:-2px; bottom:-2px; width:1px; background:#9a9aa6; }
.d8-dp i { position:absolute; top:2px; bottom:2px; border-radius:2px; }
/* amertume */
.d8-ibu { display:grid; grid-template-columns:auto 1fr auto; gap:8px; align-items:center; font-size:13px; }
.d8-j { position:relative; height:14px; background:#f1f2f5; border-radius:2px; overflow:hidden; }
.d8-j i { position:absolute; top:0; bottom:0; display:block; }
.d8-jz { left:${(50 / 170 * 100).toFixed(2)}%; width:${(20 / 170 * 100).toFixed(2)}%; background:#d9dce3; }
.d8-jb { left:0; width:${(60 / 170 * 100).toFixed(2)}%; top:3px !important; bottom:3px !important; background:#55555f; }
.d8-jh { left:${(60 / 170 * 100).toFixed(2)}%; top:3px !important; bottom:3px !important; background:var(--hop); transition:width .22s; }
.d8-jq { left:${(60 / 170 * 100).toFixed(2)}%; width:26px; top:3px !important; bottom:3px !important; background:repeating-linear-gradient(135deg,#9a9aa6 0 2px,transparent 2px 5px); }
.d8-pv { font-size:13px; display:flex; flex-wrap:wrap; gap:4px; align-items:baseline; }
`;

const corps = `
<div class="d8-dock" data-libre="moment">
<div class="d8-loupe" aria-hidden="true"></div>
<div data-acquis="geste"><div class="d8-rail" role="slider" tabindex="0" data-pas="5" aria-label="Moment de l'ajout" aria-valuemin="0" aria-valuemax="${STAGES.length - 1}" aria-valuenow="12" aria-valuetext="${M[DEPART].lib}">
<span class="d8-z d8-z0"></span><span class="d8-z d8-z1"></span><span class="d8-z d8-z2"></span><span class="d8-z d8-z3"></span>
<svg class="d8-lev" viewBox="0 0 100 14" preserveAspectRatio="none" aria-hidden="true"><path d="M0 13 C 18 13, 22 2, 45 2 S 80 9, 100 13" fill="none" stroke="#7a7f8c" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>
<i class="d8-best" aria-hidden="true"></i><span class="d8-pouce"><span class="d8-pouce-l"></span></span></div></div>
<div class="d8-frise" data-acquis="frise" role="group" aria-label="Frise du brassin">
<button type="button" data-etape="ebullition" data-saut="0" aria-label="Moment 60′">60′</button><button type="button" data-etape="whirlpool" data-saut="11" aria-label="Moment whirlpool">WP</button><button type="button" data-etape="dry-actif" data-saut="12" aria-label="Moment actif">actif</button><button type="button" data-etape="dry-apres" data-saut="13" aria-label="Moment après">après</button><span class="d8-sep" aria-hidden="true"></span>
<span class="d8-jours" data-jours role="radiogroup" aria-label="Jours de contact">${[1, 2, 3, 5, 7].map((j) => `<button type="button" role="radio" aria-checked="${j === 3}" data-jour="${j}" aria-label="Jours de contact : ${j} j"${j > 2 ? ' class="d8-plat"' : ''}>${j}j</button>`).join('')}</span>
</div></div>
<section class="dx-bloc d8-bloc">
<p class="d8-l"><b>Ma bière</b></p><div class="d8-rub" id="d8-av"></div>
<p class="d8-l d8-ch"><b>Idaho 7</b></p><div class="d8-rub d8-grand" id="d8-ap"></div>
<p class="d8-res" id="d8-res" data-nature="simule"></p>
<nav class="d8-lv" data-acquis="levure" data-forme="etape" aria-label="Étape suivante : la levure"><a href="../../../../fils22-carte/levure-etape/etat.html">Levure ›</a><span id="d8-lv"></span></nav>
</section>
<section class="dx-bloc d8-bar" id="d8-barres" hidden></section>
<section class="dx-bloc d8-mini"><div id="d8-mc"></div></section>
<section class="dx-bloc d8-mini"><p class="dx-src">contre après</p><div id="d8-cv"></div></section>
<section class="dx-bloc d8-ibu"><span class="dx-src">IBU</span><div class="d8-j"><i class="d8-jz" data-role="zone"></i><i class="d8-jb"></i><i class="d8-jh" id="d8-jh"></i><i class="d8-jq" id="d8-jq"></i></div><b class="num" id="d8-ibu"></b></section>
<p class="d8-pv" data-acquis="valeurs"><span id="d8-pv" data-nature="mesure" data-source="E03"></span><span class="dx-src" id="d8-ps"></span></p>`;

const JS = `
(function () {
  var M = ${JSON.stringify(M)}, AV = ${JSON.stringify(AVANT)}, AVI = ${JSON.stringify(AVANT_INC)}, B = ${JSON.stringify(BANDE)};
  var T = ${JSON.stringify(Object.fromEntries(ROUE.map((f) => [f, JET[f].texte])))}, BA = ${JSON.stringify(Object.fromEntries(ROUE.map((f) => [f, JET[f].base])))};
  var COURT = ${JSON.stringify(COURT)}, ORDRE = ${JSON.stringify(ORDRE)}, STAGES = ${JSON.stringify(STAGES)}, BEST = ${MEILLEUR};
  var fams = ORDRE.filter(function (f) { return f !== 'pomeFruit' && f !== 'melon'; });
  var cur = ${DEPART}, jour = 3, vue = 'etapes', ouverte = null;
  function $(s, r) { return (r || document).querySelector(s); } function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  function abs() { return document.body.classList.contains('abs'); }
  function fr(x, d) { d = d || 0; var k = Math.pow(10, d); return (Math.round(x * k) / k).toFixed(d).replace('.', ','); }
  function sg(x) { return (x >= 0 ? '+' : '−') + fr(Math.abs(x)); }
  function pic(f, t) { t = t || 16; return '<svg class="pi" width="' + t + '" height="' + t + '" data-famille="' + f + '" aria-label="' + COURT[f] + '"><use href="#p-' + f + '"/></svg>'; }
  function pc(x) { return Math.max(0, Math.min(100, x * 100)).toFixed(1) + '%'; }
  function idx(id) { for (var k = 0; k < M.length; k++) if (M[k].id === id) return k; return -1; }
  function stage(i) { var p = M[i]; return p.seg === 0 ? i : p.seg === 1 ? 11 : p.seg === 2 ? 12 : 13; }
  function deStage(s) { return s <= 11 ? s : idx((s === 12 ? 'dryActive|' : 'dryPost|') + jour); }
  function ref(p) { return M[idx('dryPost|' + (p.jours || 3))]; }
  // unités du ruban : une bande du style (au style) ou 55 points (absolu)
  function u(f, v) { return abs() ? v / 55 : v / B[f]; }
  function maxU() { var m = 0; M.forEach(function (p) { var t = 0; fams.forEach(function (f) { t += u(f, p.c[f] + p.emporte[f]); }); m = Math.max(m, t); }); return m; }
  function ruban(p, vals, o) { o = o || {}; var w0 = o.w, px = w0 / maxU(), s = '';
    fams.forEach(function (f, k) { var v = vals[k], w = u(f, v) * px; if (w < 0.6) return;
      var zw = Math.min(w, (abs() ? B[f] / 55 : 1) * px);
      var dedans = (o.pic && w >= 22 ? '<span class="d8-pc">' + pic(f, 15) + '</span>' : '') + (o.zone ? '<i class="d8-zs" data-role="zone" style="width:' + zw.toFixed(1) + 'px"></i>' + (zw < w - 0.5 ? '<i class="d8-o" style="left:' + zw.toFixed(1) + 'px;width:' + (w - zw).toFixed(1) + 'px"></i>' : '') : '');
      s += o.btn ? '<button type="button" class="d8-s" data-f="' + f + '" aria-expanded="' + (ouverte === f) + '" aria-controls="d8-barres" aria-label="' + COURT[f] + ' : les 12 barres" style="width:' + w.toFixed(1) + 'px;background:' + BA[f] + '">' + dedans + '</button>'
        : '<span class="d8-s" style="width:' + w.toFixed(1) + 'px;background:' + BA[f] + '">' + dedans + '</span>'; });
    if (o.emporte && p.perte) fams.forEach(function (f) { var e = (u(f, p.c[f] + p.emporte[f]) - u(f, p.c[f])) * px; if (e >= 0.8) s += '<span class="d8-e" style="width:' + e.toFixed(1) + 'px;background:repeating-linear-gradient(135deg,' + BA[f] + ' 0 2px,#fff 2px 5px)"></span>'; });
    return s; }
  function mibu(q) { var cru = q.ibu == null, ib = cru ? 60 : q.ibu;
    return '<div class="d8-mi" role="img" aria-label="amertume ' + (cru ? '60 et plus, à cru' : ib + ' IBU') + '"><i style="left:' + (50 / 1.7).toFixed(1) + '%;width:' + (20 / 1.7).toFixed(1) + '%;background:#d9dce3"></i><i style="left:0;width:' + (60 / 1.7).toFixed(1) + '%;background:#55555f"></i>' + (cru ? '<i style="left:' + (60 / 1.7).toFixed(1) + '%;width:16px;background:repeating-linear-gradient(135deg,#9a9aa6 0 2px,transparent 2px 5px)"></i>' : '<i style="left:' + (60 / 1.7).toFixed(1) + '%;width:' + ((ib - 60) / 1.7).toFixed(1) + '%;background:' + (ib > 70 ? '#c2410c' : '#5b3fa0') + '"></i>') + '</div>'; }
  // ---------- le dock ----------
  var rail = $('.d8-rail'), dock = $('.d8-dock'), loupe = $('.d8-loupe');
  function x(s) { return s <= 10 ? 2 + 54 * s / 10 : s === 11 ? 64.5 : s === 12 ? 77.5 : 92.5; }
  function graduations(s) { $$('.d8-cran', rail).forEach(function (c) { c.remove(); });
    if (!dock.classList.contains('d8-touche')) return;
    for (var k = 0; k <= 10; k++) { var c = document.createElement('i'); c.className = 'd8-cran'; c.style.left = x(k) + '%'; rail.insertBefore(c, rail.firstChild); }
    loupe.innerHTML = ''; var w = loupe.clientWidth, pas = 68;
    for (var k2 = s - 2; k2 <= s + 2; k2++) { if (k2 < 0 || k2 >= STAGES.length) continue; var e = document.createElement('span'); e.textContent = STAGES[k2]; if (k2 === s) e.className = 'ici'; e.style.left = (w / 2 + (k2 - s) * pas) + 'px'; loupe.appendChild(e); } }
  function depuis(ev) { var r = rail.getBoundingClientRect(), p = (ev.clientX - r.left) / r.width * 100, best = 0, bd = 1e9;
    for (var s = 0; s < STAGES.length; s++) { var d = Math.abs(x(s) - p); if (d < bd) { bd = d; best = s; } }
    if (best !== stage(cur)) poser(deStage(best)); }
  rail.addEventListener('pointerdown', function (e) { try { rail.setPointerCapture(e.pointerId); } catch (z) {} dock.classList.add('d8-touche'); depuis(e); graduations(stage(cur)); });
  rail.addEventListener('pointermove', function (e) { if (e.buttons || e.pointerType === 'touch') depuis(e); });
  ['pointerup', 'pointercancel'].forEach(function (k) { rail.addEventListener(k, function () { dock.classList.remove('d8-touche'); graduations(stage(cur)); }); });
  rail.addEventListener('keydown', function (e) { var s = stage(cur); if (e.key === 'ArrowRight') poser(deStage(Math.min(STAGES.length - 1, s + 1))); if (e.key === 'ArrowLeft') poser(deStage(Math.max(0, s - 1))); });
  $$('[data-saut]').forEach(function (b) { b.addEventListener('click', function () { poser(deStage(+b.dataset.saut)); }); });
  $$('[data-jour]').forEach(function (b) { b.addEventListener('click', function () { jour = +b.dataset.jour; var s = stage(cur); poser(deStage(s >= 12 ? s : 12)); }); });
  $('.d8-best').style.left = x(stage(BEST)) + '%';
  // ---------- rendre ----------
  function poser(i) {
    cur = i; var p = M[i], s = stage(i); if (p.jours) jour = p.jours;
    rail.setAttribute('aria-valuenow', s); rail.setAttribute('aria-valuetext', p.lib);
    $('.d8-pouce').style.left = x(s) + '%'; $('.d8-pouce-l').textContent = p.jours ? p.jours + ' j' : p.lib + (p.interp ? ' ≈' : '');
    $$('[data-etape]').forEach(function (b) { b.setAttribute('aria-current', String(+b.dataset.saut === (s <= 10 ? 0 : s) || (s <= 10 && b.dataset.saut === '0'))); });
    $('.d8-jours').setAttribute('aria-disabled', String(s <= 11));
    $$('[data-jour]').forEach(function (b) { b.setAttribute('aria-checked', String(s >= 12 && +b.dataset.jour === jour)); });
    graduations(s);
    var W = $('#d8-av').clientWidth - 2;
    $('#d8-av').innerHTML = ruban(p, fams.map(function (f) { return AV[f]; }), { w: W, pic: true, zone: true });
    $('#d8-ap').innerHTML = ruban(p, fams.map(function (f) { return p.c[f]; }), { w: W, pic: true, zone: true, emporte: true, btn: true });
    $$('#d8-ap .d8-s').forEach(function (b) { b.addEventListener('click', function () { ouverte = ouverte === b.dataset.f ? null : b.dataset.f; poser(cur); }); });
    var df = p.c.floral - AV.floral, dr = p.c.resin - AV.resin, tot = 0; fams.forEach(function (f) { tot += p.emporte[f]; });
    $('#d8-res').innerHTML = pic('floral', 16) + '<span style="color:' + T.floral + '">~' + sg(df) + '</span>' + pic('resin', 16) + '<span class="dx-hors">~' + sg(dr) + '</span>' +
      (p.perte && tot >= 0.5 ? '<span class="d8-emp"><i></i>emporté par ' + (p.perte === 'co2' ? 'le CO₂' : 'la chaleur') + '</span>' : '<span class="d8-emp">rien d’emporté</span>');
    var lev = p.levure ? p.levure.citrus : null;
    $('#d8-lv').innerHTML = lev != null ? 'US-05 ~0, Pomona <b>~' + sg(lev) + '</b> agrumes' : 'rien à cette étape';
    // les 12 barres, à un toucher
    var bar = $('#d8-barres'); bar.hidden = !ouverte;
    if (ouverte) bar.innerHTML = ORDRE.map(function (f) { var inc = p.inc.indexOf(f) >= 0, v = p.c[f], e = p.emporte[f], d = AVI.indexOf(f) >= 0 ? v : v - AV[f], S = function (y) { return abs() ? y / 110 : y / (2 * B[f]); }, Z = abs() ? B[f] / 110 : 0.5;
      return '<div class="d8-r' + (f === ouverte ? ' d8-ici' : '') + '"><span class="d8-n">' + pic(f, 15) + COURT[f] + '</span><span class="d8-p"><i class="d8-pz" data-role="zone" style="width:' + pc(Z) + '"></i>' + (inc ? '<i class="d8-ph" style="left:0"></i>' : '<i class="d8-pf" style="width:' + pc(S(v)) + ';background:' + BA[f] + '"></i>' + (p.perte && e > 0.3 ? '<i class="d8-pe" style="left:' + pc(S(v)) + ';width:' + pc(Math.min(S(v + e), 1) - Math.min(S(v), 1)) + ';background:repeating-linear-gradient(135deg,' + BA[f] + ' 0 2px,transparent 2px 5px)"></i>' : '') + (AVI.indexOf(f) < 0 ? '<i class="d8-pa" style="left:clamp(5px,' + pc(S(AV[f])) + ',calc(100% - 5px))"></i>' : '')) + '</span><span class="d8-v" style="color:' + (inc ? '#55555f' : v > B[f] ? '#c2410c' : T[f]) + '">' + (inc ? '?' : Math.abs(d) < 0.5 ? '≈' : '~' + (AVI.indexOf(f) >= 0 ? fr(v) : sg(d))) + '</span></div>'; }).join('');
    // étapes ou contre après
    var MINI = [['60′', 0, true], ['WP', 11, true], ['actif', idx('dryActive|' + jour), false], ['après', idx('dryPost|' + jour), false]];
    {
      var w2 = $('#d8-mc').clientWidth - 58;
      $('#d8-mc').innerHTML = '<div class="d8-mg">' + MINI.map(function (m, k) { var q = M[m[1]], ici = k === Math.min(3, Math.max(0, s - 10)) || (s <= 10 && k === 0);
        return '<span class="d8-ml' + (ici ? ' d8-ici' : '') + (m[2] ? ' d8-amer' : '') + '">' + (m[1] === BEST || (k === 2 && M[BEST].seg === 2) ? '<i class="d8-dem" aria-label="ta demande"></i>' : '') + m[0] + '</span><div class="d8-mr"><div class="d8-rub">' + ruban(q, fams.map(function (f) { return q.c[f]; }), { w: w2 }) + '</div>' + mibu(q) + '</div>'; }).join('') + '</div>';
    }
    {
      var r = ref(p);
      var ds = fams.map(function (f) { return { f: f, d: p.c[f] - r.c[f] }; }).filter(function (o) { return Math.abs(o.d) >= 0.5; }).sort(function (a, b) { return Math.abs(b.d) - Math.abs(a.d); }).slice(0, 6);
      var mx = 0; ds.forEach(function (o) { mx = Math.max(mx, Math.abs(o.d)); });
      $('#d8-cv').innerHTML = !ds.length ? '<p class="dx-src">le repère</p>' : '<div class="d8-dv">' + ds.map(function (o) { var w = Math.abs(o.d) / Math.max(mx, 1) * 50;
        return pic(o.f, 15) + '<span class="d8-dp"><i style="' + (o.d < 0 ? 'right:50%' : 'left:50%') + ';width:' + w.toFixed(1) + '%;background:' + BA[o.f] + '"></i></span><span class="d8-v" style="color:' + T[o.f] + '">~' + sg(o.d) + '</span>'; }).join('') + '</div>';
    }
    // amertume (y1b), à cru hachuré (g1)
    var cru = p.ibu == null, ib = cru ? 60 : p.ibu;
    $('#d8-jh').style.width = ((ib - 60) / 1.7).toFixed(1) + '%'; $('#d8-jh').style.background = !cru && ib > 70 ? '#c2410c' : '#5b3fa0'; $('#d8-jq').hidden = !cru;
    var iv = $('#d8-ibu'); iv.textContent = cru ? '≈ 60 + ? à cru' : '≈ ' + p.ibu + (p.ibu > 70 ? ' trop amer' : ' tenue'); iv.className = 'num' + (!cru && p.ibu > 70 ? ' dx-hors' : '');
    // la vraie valeur du moment
    var pv = $('#d8-pv'); var PV = [['4MMP −91 % en 60′', 'H13, mesuré'], ['4MMP −23 % à 90 °C', 'H13, mesuré'], ['linalol 38 ± 13 µg/L', 'E03, au pitch'], ['1 h ≈ 96 h au panel', 'E10, Cascade']][p.seg];
    pv.textContent = PV[0]; pv.setAttribute('data-source', p.preuve.s); $('#d8-ps').textContent = PV[1];
  }
  // lentille, bascule, légende, fiche
  $$('[data-e]').forEach(function (b) { b.addEventListener('click', function () { $$('[data-e]').forEach(function (z) { z.setAttribute('aria-checked', String(z === b)); }); document.body.classList.toggle('abs', b.dataset.e === 'absolu'); poser(cur); }); });
  $$('[data-role=legende-bouton]').forEach(function (b) { b.addEventListener('click', function () { var l = document.getElementById(b.getAttribute('aria-controls')); l.hidden = !l.hidden; b.setAttribute('aria-expanded', String(!l.hidden)); }); });
  function fiche(o) { $('[data-role="fiche"]').hidden = !o; }
  $$('[data-role="fermer-fiche"]').forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); fiche(false); }); });
  $$('[data-role="gout"] button').forEach(function (b) { b.addEventListener('click', function () { var on = b.getAttribute('aria-pressed') !== 'true'; $$('[data-role="gout"] button').forEach(function (z) { z.setAttribute('aria-pressed', 'false'); }); b.setAttribute('aria-pressed', String(on)); }); });
  addEventListener('keydown', function (e) { if (e.key !== 'Escape') return; fiche(false); $$('[data-role=legende]').forEach(function (l) { l.hidden = true; }); $$('[data-role=legende-bouton]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); }); });
  $$('[data-houblon]').forEach(function (c) { var t = null, hv = null, x0 = 0, y0 = 0;
    c.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    c.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse') return; x0 = e.clientX; y0 = e.clientY; clearTimeout(t); t = setTimeout(function () { fiche(true); }, 520); });
    c.addEventListener('pointermove', function (e) { if (t && Math.hypot(e.clientX - x0, e.clientY - y0) > 12) { clearTimeout(t); t = null; } });
    ['pointerup', 'pointercancel'].forEach(function (k) { c.addEventListener(k, function () { clearTimeout(t); t = null; }); });
    c.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'mouse') return; clearTimeout(hv); hv = setTimeout(function () { fiche(true); }, 700); });
    c.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') clearTimeout(hv); }); });
  window.DH = { M: M, AV: AV, cur: function () { return cur; }, poser: poser };
  var q = location.search.match(/moment=([^&]+)/); var i0 = q ? idx(decodeURIComponent(q[1])) : cur; poser(i0 < 0 ? cur : i0);
})();
`;

const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Le ruban de ta stout (d8b) · Quand ajouter Idaho 7 ?</title>
<style>${CSS}</style></head>
<body>
${SYMBOLES}
<main class="dx-ecran d8">
<header class="dx-barre"><a class="dx-retour" aria-label="Retour" href="../../../../fils22-carte/comparer/etat.html">‹</a><h1 class="dx-titre">Quand ajouter Idaho 7 ?</h1></header>
${contexte()}
<div class="dx-lent"><button type="button" class="dx-aide" data-role="legende-bouton" aria-expanded="false" aria-controls="leg-d8" aria-label="Lire la légende">?</button><div class="dx-leg" id="leg-d8" data-role="legende" hidden>${LEGENDE.map((l) => `<span>${l}</span>`).join('')}</div><span class="dx-seg" data-lecture role="radiogroup" aria-label="lecture au style ou absolu"><button type="button" role="radio" aria-checked="true" data-e="style">Au style</button><button type="button" role="radio" aria-checked="false" data-e="absolu">Absolu</button></span></div>
${corps}
</main>
${fiche()}
<script>${JS}</script>
</body></html>`;

fs.mkdirSync(path.join(ici, 'd8'), { recursive: true });
fs.writeFileSync(path.join(ici, 'd8', 'etat.html'), html);
console.log('d8b · passe 2 · ' + (html.length / 1024).toFixed(0) + ' Ko');
