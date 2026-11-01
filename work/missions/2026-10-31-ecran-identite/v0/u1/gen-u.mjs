// Génère les 6 concepts u1 à u6 (série u, lot v0 Identité). Chaque page : classes préfixées, script en IIFE (L26).
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-10-31-ecran-identite/v0';

// ---------- Baseline commune (hors périmètre, J12) : en-tête, fil des 7 étapes, bandeau ----------
const ico = {
  back: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.64" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  imp: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.64" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4h6v3H9z"/><path d="M15 5.5h2a1.5 1.5 0 0 1 1.5 1.5v3"/><path d="M9 5.5H7A1.5 1.5 0 0 0 5.5 7v12A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5v-2"/><path d="M11 13.5h9.5M17.5 10.5l3 3-3 3"/></svg>',
  lune: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.64" stroke-linecap="round" stroke-linejoin="round"><path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/></svg>',
  chev: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
  plus: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  moins: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14"/></svg>',
  crayon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
};

const baseCss = (p) => `
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#fff}
body{width:390px;min-height:844px;margin:0 auto;font-family:"Source Sans 3",system-ui,sans-serif;color:#111;-webkit-font-smoothing:antialiased}
button,input{font:inherit;color:inherit}
button{background:none;border:0;cursor:pointer}
.${p}-mono{font-family:"IBM Plex Mono",ui-monospace,monospace;font-variant-numeric:tabular-nums}
.${p}-top{display:flex;align-items:center;gap:6px;height:50px;padding:0 8px 0 6px}
.${p}-ico{width:32px;height:32px;display:grid;place-items:center;border-radius:8px;color:#333}
.${p}-titre{font-size:20px;font-weight:700;margin-left:2px}
.${p}-titre span{font-weight:400;color:#666;font-size:16px;margin-left:4px}
.${p}-aband{margin-left:auto;font-size:16px;text-decoration:underline;text-underline-offset:3px;padding:4px 6px}
.${p}-fil{display:flex;justify-content:space-between;padding:0 12px;border-bottom:1px solid #DDD}
.${p}-fil a{font-size:14px;color:#666;text-decoration:none;padding:4px 0 8px;position:relative;white-space:nowrap}
.${p}-fil a::after{content:"";position:absolute;left:0;right:0;bottom:2px;height:4px;border-radius:2px;background:#DDD}
.${p}-fil a[aria-current]{color:#111;font-weight:600}
.${p}-fil a[aria-current]::after{background:#111}
.${p}-band{margin:8px 8px 0;height:36px;border:1px solid #DDD;background:#F5F5F5;border-radius:18px;display:flex;align-items:center;justify-content:space-between;padding:0 12px;font-size:14px;color:#666}
.${p}-band b{font-family:"IBM Plex Mono",monospace;font-variant-numeric:tabular-nums;font-weight:600;color:#111;margin-left:3px}
.${p}-ibu{display:inline-flex;align-items:center;gap:4px}
.${p}-ibu i{display:inline-block;width:40px;height:8px;border-radius:4px;background:#DDD;position:relative}
.${p}-ibu i::before{content:"";position:absolute;left:18px;width:12px;top:0;bottom:0;background:#9E9E9E;border-radius:4px}
.${p}-ibu i::after{content:"";position:absolute;left:28px;top:-3px;width:2px;height:14px;background:#111}
.${p}-ebc{display:inline-block;width:10px;height:10px;border-radius:50%;background:#E0A02E;margin:0 2px 0 4px}
`;

const baseHtml = (p) => `
<header class="${p}-top" data-commun="entete">
  <button class="${p}-ico" aria-label="Retour">${ico.back}</button>
  <h1 class="${p}-titre">Identité<span>1/7</span></h1>
  <button class="${p}-aband">Abandonner</button>
  <button class="${p}-ico" aria-label="Importer une recette">${ico.imp}</button>
  <button class="${p}-ico" aria-label="Thème">${ico.lune}</button>
</header>
<nav class="${p}-fil" data-commun="etapes" aria-label="Étapes">
  <a href="#" aria-current="step">Identité</a><a href="#">Malts/sucres</a><a href="#">Houblons</a><a href="#">Levure</a><a href="#">Paliers</a><a href="#">Eau</a><a href="#">Récap.</a>
</nav>
<div class="${p}-band" data-commun="bandeau">
  <span>Grain<b>8,6 kg</b></span><span>OG<b>1,080</b></span><span class="${p}-ibu">IBU<b>~93</b><i></i></span><span>EBC<span class="${p}-ebc"></span><b>9,5</b></span>
</div>`;

// Calculs honnêtes, partagés : évaporation de repli 10 %/h (estimée), fermenteur du matériel 30 L, repère 20 % (estimé).
const calc = `
  var FERM = 30;
  function evap(vol, min){ var k = 0.10 * min / 60; return vol / (1 - k) - vol; }
  function fmt(n){ return String(Math.round(n * 10) / 10).replace('.', ','); }
  function fmtE(n){ return String(Math.round(n)); }
`;

const page = (p, titre, css, body, js) => `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=390, initial-scale=1">
<title>${titre}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400;1,600&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>${baseCss(p)}${css}</style></head>
<body data-variante="${p}">
${baseHtml(p)}
${body}
<script>(function(){${calc}${js}})();</script>
</body></html>
`;

const pages = {};

// =====================================================================================================
// u1 — FROIDE — « Une ligne par réglage » : la fiche actuelle resserrée en lignes ; la valeur au bout du pouce.
pages.u1 = page('u1', 'u1 — Une ligne par réglage', `
.u1-main{padding:8px 8px 12px;display:flex;flex-direction:column;gap:8px}
.u1-coll{display:flex;align-items:center;gap:8px;height:44px;padding:0 12px;border:1px solid #BFBFBF;border-radius:8px;font-size:16px;color:#111}
.u1-grp{background:#F5F5F5;border-radius:8px;padding:0 12px}
.u1-row{display:flex;align-items:center;gap:8px;min-height:68px;border-bottom:1px solid #DDD}
.u1-row:last-child{border-bottom:0}
.u1-rp{gap:12px;font-size:14px;color:#666;line-height:1.35;padding:6px 0;text-align:right}
.u1-rp b{color:#111;font-weight:600}
.u1-k{font-size:18px;color:#111;font-weight:600;flex:0 1 auto;line-height:1.1}
.u1-k small{display:block;font-size:14px;color:#666;font-weight:400;margin-top:8px}
.u1-v{margin-left:auto;display:flex;align-items:center;gap:6px}
.u1-in{width:176px;height:40px;font-weight:600 !important;border:1px solid #BFBFBF;border-radius:8px;background:#fff;padding:0 10px;font-size:16px;text-align:right}
.u1-sel{display:flex;align-items:center;gap:6px;height:40px;padding:0 6px 0 12px;border:1px solid #BFBFBF;border-radius:8px;background:#fff;font-size:18px;font-weight:600}
.u1-step{display:flex;align-items:center;height:40px;border:1px solid #BFBFBF;border-radius:8px;background:#fff;overflow:hidden}
.u1-step button{width:40px;height:40px;display:grid;place-items:center;color:#333}
.u1-step button:active{background:#EBEBEB}
.u1-step output{min-width:76px;text-align:center;font-size:20px;font-weight:600;border-left:1px solid #DDD;border-right:1px solid #DDD;line-height:38px}
.u1-step output span{font-weight:400;color:#666;font-size:14px;margin-left:3px}
.u1-sw{width:48px;height:28px;border-radius:14px;background:#BFBFBF;position:relative;transition:background .18s}
.u1-sw::after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;transition:transform .18s}
.u1-sw[aria-checked="true"]{background:#3F6B2E}
.u1-sw[aria-checked="true"]::after{transform:translateX(20px)}
.u1-ferm{padding:10px 0 12px;border-bottom:1px solid #DDD;display:flex;flex-direction:column;gap:6px}
.u1-ferm-h{display:flex;justify-content:space-between;align-items:baseline;font-size:13px;color:#666}
.u1-bar{position:relative;height:72px;border-radius:8px;background:repeating-linear-gradient(135deg,#fff 0 6px,#EBEBEB 6px 12px);border:1px solid #BFBFBF;overflow:hidden}
.u1-fill{position:absolute;left:0;top:0;bottom:0;background:#111;color:#fff;display:flex;align-items:center;padding-left:10px;font-size:16px;font-weight:600;transition:width .2s;white-space:nowrap}
.u1-lib{font-size:14px;color:#333;font-weight:400}
.u1-lib b{font-family:"IBM Plex Mono",monospace;font-weight:600;color:#111;font-size:16px}
.u1-rep{position:absolute;top:0;bottom:0;width:0;border-left:2px dashed #9C7020}
.u1-haut .u1-fill{background:#7F5B10}
.u1-trop .u1-fill{background:#C8382F}
@media (prefers-reduced-motion: reduce){.u1-sw,.u1-sw::after,.u1-fill{transition:none}}
`, `
<main class="u1-main">
  <section class="u1-grp" aria-label="La bière">
    <div class="u1-row"><span class="u1-k">Style<small>22A · BJCP 2021</small></span><span class="u1-v"><button class="u1-sel" data-booster="style">Double IPA${ico.chev}</button></span></div>
    <div class="u1-row"><label class="u1-k" for="u1-nom">Nom</label><span class="u1-v"><input id="u1-nom" class="u1-in" type="text" value="neipa v3" autocomplete="off"></span></div>
  </section>
  <section class="u1-grp" aria-label="Le brassin">
    <div class="u1-row"><span class="u1-k">Volume<small>en fermenteur</small></span><span class="u1-v"><span class="u1-step" data-booster="volume"><button aria-label="Moins 1 litre" data-d="-1">${ico.moins}</button><output class="u1-mono" id="u1-vol">24<span>L</span></output><button aria-label="Plus 1 litre" data-d="1">${ico.plus}</button></span></span></div>
    <div class="u1-row"><span class="u1-k">Ébullition<small id="u1-evap">≈ 3 L évaporés, estimé</small></span><span class="u1-v"><span class="u1-step" data-booster="ebullition"><button aria-label="Moins 5 minutes" data-e="-5">${ico.moins}</button><output class="u1-mono" id="u1-min">60<span>min</span></output><button aria-label="Plus 5 minutes" data-e="5">${ico.plus}</button></span></span></div>
    <div class="u1-row"><span class="u1-k">NOLO<small>≤ 0,5 %</small></span><span class="u1-v"><button class="u1-sw" role="switch" aria-checked="false" aria-label="Objectif NOLO" data-booster="nolo"></button></span></div>
    <div class="u1-row"><span class="u1-k">Espace libre<small id="u1-cons">remplissage conseillé 24 L</small></span><span class="u1-v"><span class="u1-step" data-booster="espace-libre"><button aria-label="Moins 5 %" data-p="-5">${ico.moins}</button><output class="u1-mono" id="u1-pc">20<span>%</span></output><button aria-label="Plus 5 %" data-p="5">${ico.plus}</button></span></span></div>
    <div class="u1-ferm" id="u1-ferm">
      <div class="u1-ferm-h"><span>Fermenteur 30 L, <b class="u1-lib" id="u1-lib"><b>6 L</b> libres</b></span><span id="u1-repl">repère 24 L, estimé</span></div>
      <div class="u1-bar" aria-hidden="true"><div class="u1-fill u1-mono" id="u1-fill" style="width:80%">24 L</div><div class="u1-rep" id="u1-rep" style="left:80%"></div></div>
    </div>
    <div class="u1-row"><span class="u1-k">Cuve 45 L<small>avant ébullition, estimé</small></span><span class="u1-v"><b class="u1-mono" id="u1-cuve" style="font-size:16px">≈ 27 L</b></span></div>
    <div class="u1-row"><span class="u1-k">Matériel</span><span class="u1-v"><button class="u1-sel" style="font-weight:400" data-booster="materiel">Royal Catering${ico.chev}</button></span></div>
  </section>
</main>`, `
  var vol = 24, min = 60, pc = 20;
  var $ = function(id){ return document.getElementById(id); };
  function rendre(){
    var cons = Math.floor(FERM * (100 - pc) / 100), lib = FERM - vol;
    $('u1-vol').innerHTML = vol + '<span>L</span>';
    $('u1-min').innerHTML = min + '<span>min</span>';
    $('u1-pc').innerHTML = pc + '<span>%</span>';
    $('u1-evap').textContent = '≈ ' + fmtE(evap(vol, min)) + ' L évaporés, estimé';
    $('u1-cons').textContent = 'remplissage conseillé ' + cons + ' L';
    $('u1-fill').style.width = Math.min(100, vol / FERM * 100) + '%';
    $('u1-fill').textContent = vol + ' L';
    $('u1-rep').style.left = (cons / FERM * 100) + '%';
    $('u1-lib').innerHTML = '<b>' + Math.abs(lib) + ' L</b> ' + (lib >= 0 ? 'libres' : 'de trop'); $('u1-repl').textContent = 'repère ' + cons + ' L, estimé';
    $('u1-ferm').classList.toggle('u1-trop', lib < 0);
    $('u1-ferm').classList.toggle('u1-haut', lib >= 0 && vol > cons);
    $('u1-cuve').textContent = '≈ ' + fmtE(vol + evap(vol, min)) + ' L';
  }
  document.querySelectorAll('[data-d]').forEach(function(b){ b.onclick = function(){ vol = Math.max(1, vol + +b.dataset.d); rendre(); }; });
  document.querySelectorAll('[data-e]').forEach(function(b){ b.onclick = function(){ min = Math.max(0, Math.min(180, min + +b.dataset.e)); rendre(); }; });
  document.querySelectorAll('[data-p]').forEach(function(b){ b.onclick = function(){ pc = Math.max(0, Math.min(50, pc + +b.dataset.p)); rendre(); }; });
  document.querySelector('.u1-sw').onclick = function(){ this.setAttribute('aria-checked', this.getAttribute('aria-checked') !== 'true'); };
  rendre();
`);

// =====================================================================================================
// u2 — FROIDE — « Les trois questions » : les champs actuels rangés sous quelle bière, combien, comment.
pages.u2 = page('u2', 'u2 — Les trois questions', `
.u2-main{padding:6px 12px 12px 8px}
.u2-q{display:grid;grid-template-columns:32px 1fr;column-gap:8px;position:relative;padding-bottom:12px}
.u2-q::before{content:"";position:absolute;left:15px;top:30px;bottom:0;width:2px;background:#DDD}
.u2-q:last-child::before{display:none}
.u2-n{width:32px;height:32px;border-radius:50%;background:#111;color:#fff;display:grid;place-items:center;font-weight:700;font-size:16px;position:relative;z-index:1}
.u2-h{font-size:20px;font-weight:700;line-height:32px}
.u2-c{grid-column:2;display:flex;flex-direction:column;gap:6px;margin-top:2px}
.u2-style{display:flex;align-items:center;justify-content:space-between;height:56px;padding:0 10px 0 12px;border:1px solid #BFBFBF;border-radius:8px;background:#fff;font-size:20px;font-weight:700}
.u2-style em{font-style:normal;font-size:12px;font-weight:400;color:#666;margin-left:6px}
.u2-chips{display:flex;flex-wrap:wrap;gap:4px}
.u2-chip{height:28px;padding:0 8px;border-radius:14px;background:#F5F5F5;border:1px solid #DDD;font-size:15px;color:#333;display:inline-flex;align-items:center;gap:4px}
.u2-chip b{font-weight:600;color:#111}
.u2-nom{display:flex;align-items:center;gap:8px;height:36px;border-bottom:1px dashed #BFBFBF}
.u2-nom label{font-size:12px;color:#666}
.u2-nom input{flex:1;border:0;background:none;font-size:18px;font-weight:600;height:32px;outline-offset:2px}
.u2-big{display:flex;align-items:center;justify-content:space-between;background:#F5F5F5;border-radius:8px;padding:8px}
.u2-big button{width:64px;height:72px;border-radius:8px;background:#fff;border:1px solid #DDD;display:grid;place-items:center}
.u2-big button:active{background:#EBEBEB}
.u2-big output{font-size:64px;font-weight:600;text-align:center;line-height:1}
.u2-big output small{display:block;font-family:"Source Sans 3",sans-serif;font-size:14px;font-weight:400;color:#666;margin-top:2px}
.u2-ferm{display:flex;flex-direction:column;gap:4px;font-size:15px;color:#333}
.u2-ferm .u2-fh{display:flex;justify-content:space-between;align-items:baseline}
.u2-ferm .u2-fh small{font-size:13px;color:#666}
.u2-ferm .u2-bar{height:36px;border-radius:8px;background:repeating-linear-gradient(135deg,#fff 0 4px,#DDD 4px 8px);border:1px solid #BFBFBF;position:relative;overflow:hidden}
.u2-ferm .u2-bar i{position:absolute;left:0;top:0;bottom:0;background:#111;transition:width .2s}
.u2-ferm b{font-weight:600}
.u2-ferm.u2-trop .u2-bar i{background:#C8382F}
.u2-ferm.u2-trop b{color:#A8291F}
.u2-pair{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.u2-evap{font-size:13px;color:#666;text-align:center;margin-top:4px}
.u2-nolo{display:flex;flex-direction:column;align-items:flex-start;justify-content:space-between;background:#F5F5F5;border-radius:8px;padding:12px;height:100%;min-height:96px;gap:6px}
.u2-nolo span{font-size:16px;font-weight:600}
.u2-nolo span small{display:block;font-size:12px;font-weight:400;color:#666}
.u2-sw{width:48px;height:28px;border-radius:14px;background:#BFBFBF;position:relative;flex:0 0 auto}
.u2-sw::after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;transition:transform .18s}
.u2-sw[aria-checked="true"]{background:#3F6B2E}
.u2-sw[aria-checked="true"]::after{transform:translateX(20px)}
.u2-small{grid-template-columns:1fr}
.u2-esp{display:flex;align-items:center;gap:8px;font-size:15px;color:#333}
.u2-esp b{margin-left:auto;font-weight:600;font-size:15px;white-space:nowrap}
.u2-esp > span:first-child{white-space:nowrap}
.u2-pc{font-family:"IBM Plex Mono",monospace;font-size:14px;color:#666;margin-left:-4px}
.u2-seg{display:flex;border:1px solid #BFBFBF;border-radius:8px;overflow:hidden}
.u2-seg button{height:32px;min-width:36px;padding:0 6px;white-space:nowrap;font-family:"IBM Plex Mono",monospace;font-size:14px;border-left:1px solid #DDD}
.u2-seg button:first-child{border-left:0}
.u2-seg button[aria-checked="true"]{background:#111;color:#fff}
.u2-ferm.u2-haut .u2-bar i{background:#7F5B10}
.u2-cv{height:28px !important}
.u2-cv i{background:#666 !important}
.u2-mat{display:flex;align-items:center;gap:8px;height:48px;padding:0 10px 0 12px;border:1px solid #DDD;border-radius:8px;font-size:15px;color:#666;margin-top:4px}
.u2-mat b{margin-left:auto;font-weight:600;color:#111}
.u2-small .u2-big{padding:16px 8px}.u2-small .u2-big button{width:40px;height:40px}
.u2-small .u2-big output{font-size:40px}
@media (prefers-reduced-motion: reduce){.u2-sw::after,.u2-ferm i{transition:none}}
`, `
<main class="u2-main">
  <section class="u2-q" aria-labelledby="u2-h1"><span class="u2-n">1</span><h2 class="u2-h" id="u2-h1">Quelle bière ?</h2>
    <div class="u2-c">
      <button class="u2-style" data-booster="style"><span>Double IPA<em>22A, BJCP 2021</em></span>${ico.chev}</button>
      <div class="u2-chips" data-booster="reperes"><span class="u2-chip">OG <b class="u2-mono">1,065–1,085</b></span><span class="u2-chip">IBU <b class="u2-mono">60–100</b></span></div>
      <div class="u2-nom"><label for="u2-nom">Nom</label><input id="u2-nom" type="text" value="neipa v3" autocomplete="off">${ico.crayon}</div>
    </div>
  </section>
  <section class="u2-q" aria-labelledby="u2-h2"><span class="u2-n">2</span><h2 class="u2-h" id="u2-h2">Combien ?</h2>
    <div class="u2-c">
      <div class="u2-big" data-booster="volume"><button aria-label="Moins 1 litre" data-d="-1">${ico.moins}</button><output class="u2-mono" id="u2-vol">24 L</output><button aria-label="Plus 1 litre" data-d="1">${ico.plus}</button></div>
      <div class="u2-ferm" id="u2-ferm"><span class="u2-fh"><span>Fermenteur 30 L</span><b id="u2-lib"><span class="u2-mono">6 L</span> libres</b></span><span class="u2-bar"><i id="u2-fill" style="width:80%"></i><u id="u2-rep" style="position:absolute;top:0;bottom:0;left:80%;border-left:2px dashed #9C7020"></u></span><span class="u2-fh"><small>repère, estimé</small><small id="u2-cuve"></small></span></div>
      <div class="u2-esp" data-booster="espace-libre"><span>Espace libre</span><span class="u2-seg" role="radiogroup" aria-label="Espace libre en %"><button role="radio" data-p="15" aria-checked="false">15</button><button role="radio" data-p="20" aria-checked="true">20</button><button role="radio" data-p="25" aria-checked="false">25</button></span><span class="u2-pc">%</span><b id="u2-cons"><span class="u2-mono">24 L</span> conseillés</b></div>
    </div>
  </section>
  <section class="u2-q" aria-labelledby="u2-h3"><span class="u2-n">3</span><h2 class="u2-h" id="u2-h3">Comment ?</h2>
    <div class="u2-c">
      <div class="u2-pair">
        <div class="u2-small"><div class="u2-big" data-booster="ebullition"><button aria-label="Moins 5 minutes" data-e="-5">${ico.moins}</button><output class="u2-mono" id="u2-min">60<small>min d’ébullition</small></output><button aria-label="Plus 5 minutes" data-e="5">${ico.plus}</button></div><p class="u2-evap" id="u2-evap">≈ 3 L évaporés, estimé</p></div>
        <div class="u2-nolo"><span>NOLO<small>≤ 0,5 %</small></span><button class="u2-sw" role="switch" aria-checked="false" aria-label="Objectif NOLO" data-booster="nolo"></button></div>
      </div>
      <div class="u2-ferm"><span class="u2-fh"><span>Cuve 45 L, avant ébullition</span><b><span class="u2-mono" id="u2-cvv">≈ 27 L</span> estimé</b></span><span class="u2-bar u2-cv"><i id="u2-cvj" style="width:60%"></i></span></div>
    </div>
  </section>
</main>`, `
  var vol = 24, min = 60, pc = 20, $ = function(i){ return document.getElementById(i); };
  document.querySelectorAll('.u2-seg button').forEach(function(b){ b.onclick = function(){ pc = +b.dataset.p; document.querySelectorAll('.u2-seg button').forEach(function(x){ x.setAttribute('aria-checked', x === b); }); rendre(); }; });
  function rendre(){
    var cons = Math.floor(FERM * (100 - pc) / 100);
    $('u2-cons').innerHTML = '<span class="u2-mono">' + cons + ' L</span> conseillés';
    $('u2-rep').style.left = (cons / FERM * 100) + '%';
    $('u2-ferm').classList.toggle('u2-haut', vol > cons && vol <= FERM);
    $('u2-vol').innerHTML = vol + ' L';
    $('u2-min').innerHTML = min + '<small>min d’ébullition</small>';
    $('u2-evap').textContent = '≈ ' + fmtE(evap(vol, min)) + ' L évaporés, estimé';
    var lib = FERM - vol;
    $('u2-fill').style.width = Math.min(100, vol / FERM * 100) + '%';
    $('u2-lib').innerHTML = '<span class="u2-mono">' + Math.abs(lib) + ' L</span> ' + (lib >= 0 ? 'libres' : 'de trop'); $('u2-cuve').textContent = ''; var cv = vol + evap(vol, min); $('u2-cvv').textContent = '≈ ' + fmtE(cv) + ' L'; $('u2-cvj').style.width = Math.min(100, cv / 45 * 100) + '%';
    $('u2-ferm').classList.toggle('u2-trop', lib < 0);
  }
  document.querySelectorAll('[data-d]').forEach(function(b){ b.onclick = function(){ vol = Math.max(1, vol + +b.dataset.d); rendre(); }; });
  document.querySelectorAll('[data-e]').forEach(function(b){ b.onclick = function(){ min = Math.max(0, Math.min(180, min + +b.dataset.e)); rendre(); }; });
  document.querySelector('.u2-sw').onclick = function(){ this.setAttribute('aria-checked', this.getAttribute('aria-checked') !== 'true'); };
  rendre();
`);

// =====================================================================================================
// u3 — TIÈDE — « Six tuiles » : une tuile par réponse ; la tuile est le contrôle.
pages.u3 = page('u3', 'u3 — Six tuiles', `
.u3-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:10px 8px 12px}
.u3-t{background:#F5F5F5;border-radius:8px;padding:12px;min-height:148px;display:flex;flex-direction:column;gap:4px;position:relative;text-align:left}
.u3-k{font-size:14px;color:#666;display:flex;justify-content:space-between;align-items:center}
.u3-v{font-size:40px;font-weight:600;line-height:1.05}
.u3-v small{font-size:16px;font-weight:400;color:#666;margin-left:3px}
.u3-wide{grid-column:span 2}
.u3-style{background:#111;color:#fff;min-height:132px;justify-content:space-between}
.u3-style .u3-k{color:#BFBFBF}
.u3-style .u3-v{font-family:"Source Sans 3",sans-serif;font-weight:700;font-size:40px}
.u3-style .u3-ranges{display:flex;gap:12px;font-size:12px;color:#DDD}
.u3-style .u3-ranges b{color:#fff;font-weight:500}
.u3-pm{display:flex;gap:6px;margin-top:auto}
.u3-pm button{flex:1;height:44px;border-radius:8px;background:#fff;border:1px solid #DDD;display:grid;place-items:center}
.u3-pm button:active{background:#EBEBEB}
.u3-evap{font-size:13px;color:#666}
.u3-ferm{flex-direction:row;align-items:stretch;gap:10px}
.u3-cuve{width:44px;flex:0 0 44px;border:2px solid #333;border-top-width:1px;border-radius:8px 6px 12px 12px;position:relative;overflow:hidden;background:repeating-linear-gradient(135deg,#fff 0 4px,#EBEBEB 4px 8px);min-height:140px}
.u3-cuve i{position:absolute;left:0;right:0;bottom:0;background:#E0A02E;transition:height .2s}
.u3-cuve u{position:absolute;left:-2px;right:-2px;height:0;border-top:2px dashed #7F5B10;text-decoration:none}
.u3-ferm-c{display:flex;flex-direction:column;gap:4px;min-width:0}
.u3-ferm .u3-v{font-size:32px}
.u3-repl{font-size:12px;color:#7F5B10}
.u3-nolo{cursor:pointer;justify-content:space-between}
.u3-nolo .u3-v{font-family:"Source Sans 3",sans-serif;font-size:24px;font-weight:700}
.u3-etat{display:inline-flex;align-items:center;gap:6px;font-size:14px;color:#333}
.u3-etat i{width:40px;height:24px;border-radius:8px;background:#BFBFBF;position:relative}
.u3-etat i::after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .18s}
.u3-nolo[aria-checked="true"]{background:#3F6B2E;color:#fff}
.u3-nolo[aria-checked="true"] .u3-k,.u3-nolo[aria-checked="true"] .u3-etat{color:#fff}
.u3-nolo[aria-checked="true"] .u3-etat i{background:#fff}
.u3-nolo[aria-checked="true"] .u3-etat i::after{transform:translateX(16px);background:#3F6B2E}
.u3-nom{flex-direction:row;align-items:center;gap:8px;min-height:64px}
.u3-nom input{flex:1;height:36px;border:0;border-bottom:1px solid #BFBFBF;background:none;font-size:20px;font-weight:600}
.u3-mat{flex-direction:row;align-items:center;justify-content:space-between;background:#fff;border:1px solid #DDD;font-size:14px;color:#333;padding:8px 12px;min-height:52px}
.u3-mat b{font-family:"IBM Plex Mono",monospace;font-weight:600;color:#111}
.u3-trop .u3-cuve i{background:#C8382F}
.u3-jauge{margin-top:auto;height:16px;border-radius:8px;border:1px solid #BFBFBF;background:#fff;overflow:hidden;display:block}
.u3-jauge i{display:block;height:100%;background:#333;transition:width .2s}
.u3-nom,.u3-mat{min-height:0 !important}
@media (prefers-reduced-motion: reduce){.u3-cuve i,.u3-etat i::after{transition:none}}
`, `
<main class="u3-grid">
  <button class="u3-t u3-wide u3-style" data-booster="style">
    <span class="u3-k"><span>22A · BJCP 2021</span>${ico.chev}</span>
    <span class="u3-v">Double IPA</span>
    <span class="u3-ranges u3-mono"><span>OG <b>1,065–1,085</b></span><span>IBU <b>60–100</b></span></span>
  </button>
  <div class="u3-t" data-booster="volume">
    <span class="u3-k">Volume</span>
    <span class="u3-v u3-mono" id="u3-vol">24<small>L</small></span>
    <span class="u3-pm"><button aria-label="Moins 1 litre" data-d="-1">${ico.moins}</button><button aria-label="Plus 1 litre" data-d="1">${ico.plus}</button></span>
  </div>
  <div class="u3-t" data-booster="ebullition">
    <span class="u3-k">Ébullition</span>
    <span class="u3-v u3-mono" id="u3-min">60<small>min</small></span>
    <span class="u3-evap" id="u3-evap">≈ 3 L évaporés · estimé</span>
    <span class="u3-pm"><button aria-label="Moins 5 minutes" data-e="-5">${ico.moins}</button><button aria-label="Plus 5 minutes" data-e="5">${ico.plus}</button></span>
  </div>
  <div class="u3-t u3-ferm" id="u3-fermt">
    <span class="u3-cuve" aria-hidden="true"><i id="u3-fill" style="height:80%"></i><u id="u3-rep" style="bottom:80%"></u></span>
    <span class="u3-ferm-c"><span class="u3-k">Fermenteur 30 L</span><span class="u3-v"><span class="u3-mono" id="u3-lib">6</span><small id="u3-libk">L libres</small></span><span class="u3-repl" id="u3-repl">repère 24 L · estimé</span></span>
  </div>
  <button class="u3-t u3-nolo" role="switch" aria-checked="false" data-booster="nolo">
    <span class="u3-k">Objectif</span>
    <span class="u3-v">NOLO</span>
    <span class="u3-etat"><i></i><span class="u3-mono">≤ 0,5 %</span></span>
  </button>
  <div class="u3-t u3-esp" data-booster="espace-libre">
    <span class="u3-k">Espace libre</span>
    <span class="u3-v u3-mono" id="u3-pc">20<small>%</small></span>
    <span class="u3-evap" id="u3-cons">24 L conseillés</span>
    <span class="u3-pm"><button aria-label="Moins 5 %" data-p="-5">${ico.moins}</button><button aria-label="Plus 5 %" data-p="5">${ico.plus}</button></span>
  </div>
  <div class="u3-t u3-cv">
    <span class="u3-k">Cuve 45 L</span>
    <span class="u3-v u3-mono" id="u3-cvv">≈ 27<small>L</small></span>
    <span class="u3-evap">avant ébullition · estimé</span>
    <span class="u3-jauge" aria-hidden="true"><i id="u3-cvj" style="width:60%"></i></span>
  </div>
  <div class="u3-t u3-wide u3-nom"><label class="u3-k" for="u3-nom">Nom</label><input id="u3-nom" type="text" value="neipa v3" autocomplete="off">${ico.crayon}</div>
  <button class="u3-t u3-wide u3-mat" data-booster="materiel"><span>Matériel · Royal Catering</span>${ico.chev}</button>
</main>`, `
  var vol = 24, min = 60, pc = 20, $ = function(i){ return document.getElementById(i); };
  document.querySelectorAll('[data-p]').forEach(function(b){ b.onclick = function(){ pc = Math.max(0, Math.min(50, pc + +b.dataset.p)); rendre(); }; });
  function rendre(){
    $('u3-vol').innerHTML = vol + '<small>L</small>';
    $('u3-min').innerHTML = min + '<small>min</small>';
    $('u3-evap').textContent = '≈ ' + fmtE(evap(vol, min)) + ' L évaporés · estimé';
    var lib = FERM - vol;
    $('u3-fill').style.height = Math.min(100, vol / FERM * 100) + '%';
    $('u3-lib').textContent = Math.abs(lib); $('u3-libk').textContent = lib >= 0 ? 'L libres' : 'L de trop'; var cv = vol + evap(vol, min), cons = Math.floor(FERM * (100 - pc) / 100); $('u3-cvv').innerHTML = '≈ ' + fmtE(cv) + '<small>L</small>'; $('u3-cvj').style.width = Math.min(100, cv / 45 * 100) + '%'; $('u3-pc').innerHTML = pc + '<small>%</small>'; $('u3-cons').textContent = cons + ' L conseillés'; $('u3-rep').style.bottom = (cons / FERM * 100) + '%'; $('u3-repl').textContent = 'repère ' + cons + ' L · estimé';
    $('u3-fermt').classList.toggle('u3-trop', lib < 0);
  }
  document.querySelectorAll('[data-d]').forEach(function(b){ b.onclick = function(){ vol = Math.max(1, vol + +b.dataset.d); rendre(); }; });
  document.querySelectorAll('[data-e]').forEach(function(b){ b.onclick = function(){ min = Math.max(0, Math.min(180, min + +b.dataset.e)); rendre(); }; });
  document.querySelector('.u3-nolo').onclick = function(){ this.setAttribute('aria-checked', this.getAttribute('aria-checked') !== 'true'); };
  rendre();
`);

// =====================================================================================================
// u4 — TIÈDE — « Lire en haut, régler en bas » : les réponses se lisent en haut ; un seul pupitre sous le pouce.
pages.u4 = page('u4', 'u4 — Lire en haut, régler en bas', `
.u4-main{display:flex;flex-direction:column;gap:10px;min-height:calc(844px - 146px);padding:8px 8px 8px}
.u4-lus{display:flex;flex-direction:column;gap:2px}
.u4-fl{display:flex;align-items:center;gap:8px;padding:0 16px 6px;min-height:24px}
.u4-fl span{font-size:14px;color:#666}
.u4-fl i{flex:1;height:20px;border-radius:8px;border:1px solid #BFBFBF;background:repeating-linear-gradient(135deg,#fff 0 4px,#DDD 4px 8px);position:relative;overflow:hidden}
.u4-fl i b{position:absolute;left:0;top:0;bottom:0;background:#111}
.u4-fl{background:none}
.u4-fl.u4-trop i b{background:#C8382F}
.u4-l{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:2px;min-height:64px;padding:4px 12px;border-radius:8px;text-align:left;border-left:4px solid transparent}
.u4-l .u4-v{font-size:36px;font-weight:600;line-height:1}
.u4-l .u4-k{font-size:12px;color:#666;order:-1}
.u4-ln2{display:flex;align-items:baseline;gap:8px;width:100%}
.u4-ln2 em{font-style:normal;margin-left:auto;font-size:14px;color:#333}
.u4-l[aria-pressed="true"]{background:#F5F5F5;border-left-color:#111}
.u4-l:active{background:#EBEBEB}
.u4-sty{font-family:"Source Sans 3",sans-serif !important;font-weight:700 !important}
.u4-off{color:#666}
.u4-on{color:#3F6B2E}
.u4-deck{margin-top:auto;background:#111;color:#F5F0EA;border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:8px}
.u4-dh{display:flex;align-items:baseline;justify-content:space-between}
.u4-dh span{font-size:14px;color:#D8CEC5}
.u4-dh output{font-size:40px;font-weight:600;line-height:1}
.u4-reg{position:relative;height:80px;touch-action:none;cursor:pointer;user-select:none}
.u4-reg svg{position:absolute;inset:0}
.u4-row{display:flex;align-items:center;gap:8px}
.u4-row button{width:48px;height:48px;border-radius:8px;background:#2C2521;border:1px solid #574A42;color:#F5F0EA;display:grid;place-items:center}
.u4-row button:active{background:#3D342E}
.u4-row .u4-reg{flex:1}
.u4-cuve{display:flex;align-items:center;gap:8px;font-size:14px;color:#D8CEC5}
.u4-cuve span{width:104px}
.u4-cuve > b{width:72px;white-space:nowrap;text-align:right;font-size:16px;color:#F5F0EA;font-weight:600}
.u4-fi{height:24px !important;background:repeating-linear-gradient(135deg,#1A1613 0 4px,#3D342E 4px 8px) !important}
.u4-fi b{background:#F2C14E !important}
.u4-cuve i{flex:1;height:20px;border-radius:8px;border:1px solid #574A42;background:#1A1613;overflow:hidden}
.u4-cuve i b{display:block;height:100%;background:#9A8A7E}
.u4-pied{display:flex;justify-content:space-between;font-size:12px;color:#9A8A7E}
.u4-pied b{color:#F5F0EA;font-weight:600;font-size:14px}
.u4-pied .u4-trop{color:#DC5F58}
.u4-chips{display:flex;flex-wrap:wrap;gap:6px}
.u4-chips button{height:36px;padding:0 12px;border-radius:18px;background:#2C2521;border:1px solid #574A42;color:#F5F0EA;font-size:14px}
.u4-chips button[aria-pressed="true"]{background:#F2C14E;color:#12100E;border-color:#F2C14E}
.u4-nomin{height:40px;border:1px solid #574A42;border-radius:8px;background:#221D19;color:#F5F0EA;padding:0 12px;font-size:16px}
`, `
<main class="u4-main">
  <div class="u4-lus" role="group" aria-label="Réponses">
    <button class="u4-l" data-f="style" aria-pressed="false" data-booster="lire-style"><span class="u4-ln2"><span class="u4-v u4-sty" id="u4-l-style">Double IPA</span></span><span class="u4-k" id="u4-l-code">22A, BJCP 2021</span></button>
    <button class="u4-l" data-f="vol" aria-pressed="true" data-booster="lire-volume"><span class="u4-v u4-mono" id="u4-l-vol">24 L</span><span class="u4-k">Volume en fermenteur</span></button>
    <button class="u4-l" data-f="min" aria-pressed="false" data-booster="lire-ebullition"><span class="u4-ln2"><span class="u4-v u4-mono" id="u4-l-min">60 min</span><em id="u4-ev">≈ 3 L évaporés, estimé</em></span><span class="u4-k">Ébullition</span></button>
    <button class="u4-l" data-f="pc" aria-pressed="false" data-booster="lire-espace"><span class="u4-ln2"><span class="u4-v u4-mono" id="u4-l-pc">20 %</span><em id="u4-l-cons">24 L conseillés</em></span><span class="u4-k">Espace libre</span></button>
    <button class="u4-l" data-f="nolo" aria-pressed="false" data-booster="nolo"><span class="u4-v u4-sty u4-off" id="u4-l-nolo">NOLO non</span><span class="u4-k">Objectif ≤ 0,5 %</span></button>
    <button class="u4-l" data-f="nom" aria-pressed="false" data-booster="lire-nom"><span class="u4-v u4-sty" id="u4-l-nom" style="font-weight:600 !important">neipa v3</span><span class="u4-k">Nom</span></button>
  </div>
  <section class="u4-deck" id="u4-deck" aria-live="polite"></section>
</main>`, `
  var st = { vol: 24, min: 60, pc: 20, nolo: false, style: 'Double IPA', nom: 'neipa v3', champ: 'vol' };
  var STYLES = [['21A','American IPA'],['21B','Specialty IPA'],['21C','Hazy IPA'],['22A','Double IPA'],['22B','American Strong Ale']];
  var $ = function(i){ return document.getElementById(i); };
  var deck = $('u4-deck');
  function regle(min, max, val, pas, marque){
    var W = 270, H = 56, x = function(v){ return 12 + (v - min) / (max - min) * (W - 24); };
    var s = '<svg viewBox="0 0 '+W+' '+H+'" width="100%" height="72" aria-hidden="true">';
    if (marque && marque.trop != null) s += '<rect x="'+x(marque.trop)+'" y="14" width="'+(x(max)-x(marque.trop))+'" height="18" fill="#4A2320"/>';
    for (var v = min; v <= max; v += pas){ var g = (v % (pas*5) === 0); s += '<line x1="'+x(v)+'" x2="'+x(v)+'" y1="'+(g?14:20)+'" y2="32" stroke="'+(g?'#D8CEC5':'#574A42')+'" stroke-width="1"/>'; if (g) s += '<text x="'+x(v)+'" y="48" text-anchor="middle" font-family="IBM Plex Mono" font-size="12" fill="#D8CEC5">'+v+'</text>'; }
    if (marque && marque.rep != null) s += '<line x1="'+x(marque.rep)+'" x2="'+x(marque.rep)+'" y1="8" y2="36" stroke="#E3B55D" stroke-width="2" stroke-dasharray="3 2"/>';
    s += '<rect x="12" y="22" width="'+(x(val)-12)+'" height="4" rx="2" fill="#F2C14E"/>';
    s += '<circle cx="'+x(val)+'" cy="24" r="11" fill="#F2C14E"/><circle cx="'+x(val)+'" cy="24" r="4" fill="#12100E"/></svg>';
    return s;
  }
  function pied(){
    var lib = 30 - st.vol;
    return '<div class="u4-cuve"><span>Fermenteur 30 L</span><i class="u4-fi"><b style="width:'+Math.min(100, st.vol/30*100)+'%"></b></i><b class="u4-mono">'+Math.abs(30-st.vol)+' L</b></div><div class="u4-cuve"><span>Cuve 45 L</span><i><b style="width:'+Math.min(100,(st.vol + evap(st.vol, st.min))/45*100)+'%"></b></i><b class="u4-mono">≈ '+fmtE(st.vol + evap(st.vol, st.min))+' L</b></div><div class="u4-pied"><span>'+(30-st.vol >= 0 ? 'libres' : 'de trop')+' · avant ébullition</span><span>estimé</span></div>';
  }
  function rendre(){
    $('u4-l-vol').textContent = st.vol + ' L'; 
    $('u4-l-min').textContent = st.min + ' min'; $('u4-ev').textContent = '≈ ' + fmtE(evap(st.vol, st.min)) + ' L évaporés, estimé'; $('u4-l-pc').textContent = st.pc + ' %'; $('u4-l-cons').textContent = Math.floor(30 * (100 - st.pc) / 100) + ' L conseillés';
    $('u4-l-nolo').textContent = st.nolo ? 'NOLO oui' : 'NOLO non';
    $('u4-l-nolo').className = 'u4-v u4-sty ' + (st.nolo ? 'u4-on' : 'u4-off');
    $('u4-l-style').textContent = st.style;
    $('u4-l-code').textContent = STYLES.filter(function(s){ return s[1] === st.style; })[0][0] + ', BJCP 2021';
    $('u4-l-nom').textContent = st.nom;
    document.querySelectorAll('.u4-l').forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.f === st.champ); });
    var h = '';
    if (st.champ === 'vol') {
      h = '<div class="u4-dh"><span>Volume</span><output class="u4-mono">'+st.vol+' L</output></div>'
        + '<div class="u4-row"><button data-pas="-1" aria-label="Moins 1 litre">'+MOINS+'</button><div class="u4-reg" data-booster="regle-volume" data-min="10" data-max="35" data-pas="1">'+regle(10,35,st.vol,1,{trop:30,rep:Math.floor(30 * (100 - st.pc) / 100)})+'</div><button data-pas="1" aria-label="Plus 1 litre">'+PLUS+'</button></div>' + pied();
    } else if (st.champ === 'min') {
      h = '<div class="u4-dh"><span>Ébullition</span><output class="u4-mono">'+st.min+' min</output></div>'
        + '<div class="u4-row"><button data-pas="-5" aria-label="Moins 5 minutes">'+MOINS+'</button><div class="u4-reg" data-booster="regle-ebullition" data-min="0" data-max="120" data-pas="5">'+regle(0,120,st.min,5,null)+'</div><button data-pas="5" aria-label="Plus 5 minutes">'+PLUS+'</button></div>'
        + '<div class="u4-pied"><span>≈ <b class="u4-mono">'+fmtE(evap(st.vol, st.min))+' L</b> évaporés</span><span>repli 10 %/h · estimé</span></div>';
    } else if (st.champ === 'pc') {
      h = '<div class="u4-dh"><span>Espace libre choisi</span><output class="u4-mono">'+st.pc+' %</output></div>'
        + '<div class="u4-row"><button data-pas="-5" aria-label="Moins 5 %">'+MOINS+'</button><div class="u4-reg" data-booster="regle-espace" data-min="0" data-max="50" data-pas="5">'+regle(0,50,st.pc,5,{rep:20})+'</div><button data-pas="5" aria-label="Plus 5 %">'+PLUS+'</button></div>'
        + '<div class="u4-pied"><span>Remplissage conseillé <b class="u4-mono">'+Math.floor(30 * (100 - st.pc) / 100)+' L</b></span><span>repère 20 % · estimé</span></div>';
    } else if (st.champ === 'style') {
      h = '<div class="u4-dh"><span>Style · BJCP 2021</span></div><div class="u4-chips">' + STYLES.map(function(s){ return '<button data-style="'+s[1]+'" aria-pressed="'+(s[1]===st.style)+'">'+s[1]+'</button>'; }).join('') + '</div>';
    } else if (st.champ === 'mat') {
      h = '<div class="u4-dh"><span>Matériel du plan</span></div><div class="u4-chips"><button aria-pressed="true">Royal Catering · 45 L</button></div>';
    } else if (st.champ === 'nom') {
      h = '<div class="u4-dh"><span>Nom de la bière</span></div><input class="u4-nomin" id="u4-nomin" type="text" value="'+st.nom+'" aria-label="Nom de la bière" autocomplete="off">';
    }
    deck.innerHTML = h;
    var r = deck.querySelector('.u4-reg');
    if (r) {
      var mn = +r.dataset.min, mx = +r.dataset.max, ps = +r.dataset.pas, k = st.champ;
      var poser = function(e){ var b = r.getBoundingClientRect(); var f = Math.max(0, Math.min(1, (e.clientX - b.left - 12 * b.width / 270) / (b.width * 246 / 270))); st[k] = Math.round((mn + f * (mx - mn)) / ps) * ps; rendre(); };
      r.onpointerdown = function(e){ poser(e); var mv = function(ev){ poser(ev); }; var up = function(){ window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); }; window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); };
    }
    deck.querySelectorAll('[data-pas]').forEach(function(b){ if (b.tagName !== 'BUTTON') return; b.onclick = function(){ var k = st.champ; st[k] = Math.max(k === 'vol' ? 1 : 0, Math.min(k === 'vol' ? 60 : k === 'pc' ? 50 : 180, st[k] + +b.dataset.pas)); rendre(); }; });
    deck.querySelectorAll('[data-style]').forEach(function(b){ b.onclick = function(){ st.style = b.dataset.style; rendre(); }; });
    var ni = $('u4-nomin'); if (ni) ni.oninput = function(){ st.nom = ni.value; $('u4-l-nom').textContent = st.nom; };
  }
  var MOINS = ${JSON.stringify(ico.moins)}, PLUS = ${JSON.stringify(ico.plus)};
  document.querySelectorAll('.u4-l').forEach(function(b){ b.onclick = function(){ if (b.dataset.f === 'nolo') { st.nolo = !st.nolo; } else { st.champ = b.dataset.f; } rendre(); }; });
  rendre();
`);

// =====================================================================================================
// u5 — CHAUDE — « L'affiche » : la bière posée en typographie d'affiche ; chaque mot se règle là où il est.
pages.u5 = page('u5', "u5 — L'affiche", `
.u5-aff{margin:10px 8px 12px;border-radius:8px;background:#fff;border:2px solid #111;overflow:hidden;display:flex;flex-direction:column}
.u5-ban{height:16px;background:linear-gradient(90deg,#F2C14E,#E0A02E)}
.u5-in{padding:14px 14px 16px;display:flex;flex-direction:column;gap:8px}
.u5-nom{display:flex;align-items:center;gap:6px;color:#666}
.u5-nom input{border:0;background:none;font-size:20px;font-style:italic;font-weight:600;color:#333;width:160px;height:32px;padding:0}
.u5-sty{display:flex;align-items:flex-end;justify-content:space-between;text-align:left;gap:8px}
.u5-sty b{font-size:72px;line-height:.92;font-weight:700;letter-spacing:-1px;color:#111}
.u5-sty span{display:grid;place-items:center;width:32px;height:32px;border-radius:50%;border:1px solid #BFBFBF;margin-bottom:4px;flex:0 0 32px}
.u5-cod{font-size:12px;color:#666;letter-spacing:.5px}
.u5-nums{display:grid;grid-template-columns:1fr 1fr;border-top:2px solid #111;border-bottom:2px solid #111;margin:6px -14px 0}
.u5-num{padding:12px 14px 14px;display:flex;flex-direction:column;gap:6px}
.u5-num + .u5-num{border-left:2px solid #111}
.u5-num output{font-size:64px;font-weight:600;line-height:1;letter-spacing:-2px}
.u5-num output small{font-size:20px;letter-spacing:0;margin-left:2px;font-weight:500}
.u5-num .u5-k{font-size:12px;color:#666}
.u5-pm{display:flex;gap:6px}
.u5-pm button{width:48px;height:40px;border-radius:20px;border:1px solid #111;display:grid;place-items:center}
.u5-pm button:active{background:#111;color:#fff}
.u5-ferm{display:flex;flex-direction:column;gap:4px;margin-top:6px}
.u5-fh{display:flex;justify-content:space-between;font-size:12px;color:#666}
.u5-bar{height:56px;border:2px solid #111;border-radius:8px;display:flex;overflow:hidden;background:repeating-linear-gradient(135deg,#fff 0 6px,#EBEBEB 6px 12px);position:relative}
.u5-bar i{display:flex;align-items:center;padding-left:10px;background:#111;color:#fff;font-style:normal;font-family:"IBM Plex Mono",monospace;font-size:14px;font-weight:600;transition:width .2s;white-space:nowrap}
.u5-bar em{position:absolute;right:10px;top:0;bottom:0;display:flex;align-items:center;font-style:normal;font-family:"IBM Plex Mono",monospace;font-size:14px;font-weight:600;color:#111}
.u5-bar u{position:absolute;top:0;bottom:0;border-left:2px dashed #9C7020}
.u5-bas{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:8px}
.u5-ev{font-size:14px;color:#333;line-height:1.35}
.u5-ev b{font-family:"IBM Plex Mono",monospace;font-weight:600}
.u5-ev small{display:block;font-size:12px;color:#666}
.u5-tamp{width:120px;height:120px;border-radius:50%;border:2px dashed #9E9E9E;color:#666;display:flex;flex-direction:column;align-items:center;justify-content:center;transform:rotate(-8deg);transition:all .2s;flex:0 0 120px}
.u5-tamp b{font-size:20px;font-weight:700;letter-spacing:1px}
.u5-tamp small{font-family:"IBM Plex Mono",monospace;font-size:12px}
.u5-tamp[aria-checked="true"]{border:3px solid #3F6B2E;color:#3F6B2E;background:#EEF4EA;transform:rotate(-8deg) scale(1.04)}
.u5-trop .u5-bar i{background:#C8382F}
.u5-esp{display:flex;align-items:center;justify-content:space-between;font-size:14px;color:#333;margin-top:2px}
.u5-seg{display:flex;border:2px solid #111;border-radius:18px;overflow:hidden}
.u5-seg button{height:32px;padding:0 10px;font-family:"IBM Plex Mono",monospace;font-size:14px;font-weight:600;border-left:2px solid #111}
.u5-seg button:first-child{border-left:0}
.u5-seg button[aria-checked="true"]{background:#111;color:#fff}
@media (prefers-reduced-motion: reduce){.u5-tamp,.u5-bar i{transition:none}}
`, `
<main>
  <article class="u5-aff">
    <div class="u5-ban" title="Teinte estimée · EBC 9,5" aria-hidden="true"></div>
    <div class="u5-in">
      <label class="u5-nom">${ico.crayon}<input type="text" value="neipa v3" aria-label="Nom de la bière" autocomplete="off"></label>
      <button class="u5-sty" data-booster="style"><b>Double<br>IPA</b><span>${ico.chev}</span></button>
      <span class="u5-cod">22A · BJCP 2021 · OG <span class="u5-mono">1,065–1,085</span></span>
      <div class="u5-nums">
        <div class="u5-num" data-booster="volume"><span class="u5-k">en fermenteur</span><output class="u5-mono" id="u5-vol">24<small>L</small></output><span class="u5-pm"><button aria-label="Moins 1 litre" data-d="-1">${ico.moins}</button><button aria-label="Plus 1 litre" data-d="1">${ico.plus}</button></span></div>
        <div class="u5-num" data-booster="ebullition"><span class="u5-k">ébullition</span><output class="u5-mono" id="u5-min">60<small>min</small></output><span class="u5-pm"><button aria-label="Moins 5 minutes" data-e="-5">${ico.moins}</button><button aria-label="Plus 5 minutes" data-e="5">${ico.plus}</button></span></div>
      </div>
      <div class="u5-ferm" id="u5-ferm">
        <div class="u5-fh"><span>Fermenteur 30 L</span><span id="u5-repl">repère 24 L · estimé</span></div>
        <div class="u5-bar"><i id="u5-fill" style="width:80%">24 L</i><u id="u5-rep" style="left:80%"></u><em id="u5-lib">6 L</em></div>
      </div>
      <div class="u5-esp" data-booster="espace-libre"><span>Espace libre</span><span class="u5-seg" role="radiogroup" aria-label="Espace libre"><button role="radio" data-p="15" aria-checked="false">15 %</button><button role="radio" data-p="20" aria-checked="true">20 %</button><button role="radio" data-p="25" aria-checked="false">25 %</button></span></div>
      <div class="u5-bas">
        <p class="u5-ev">≈ <b id="u5-evap">3 L</b> évaporés<small>repli 10 %/h · estimé</small>cuve 45 L · ≈ <b id="u5-cuve">27 L</b><small>Royal Catering</small></p>
        <button class="u5-tamp" role="switch" aria-checked="false" aria-label="Objectif NOLO" data-booster="nolo"><b>NOLO</b><small>≤ 0,5 %</small></button>
      </div>
    </div>
  </article>
</main>`, `
  var vol = 24, min = 60, pc = 20, $ = function(i){ return document.getElementById(i); };
  document.querySelectorAll('.u5-seg button').forEach(function(b){ b.onclick = function(){ pc = +b.dataset.p; document.querySelectorAll('.u5-seg button').forEach(function(x){ x.setAttribute('aria-checked', x === b); }); rendre(); }; });
  function rendre(){
    var cons = Math.floor(FERM * (100 - pc) / 100); $('u5-rep').style.left = (cons / FERM * 100) + '%'; $('u5-repl').textContent = 'repère ' + cons + ' L · estimé';
    $('u5-vol').innerHTML = vol + '<small>L</small>';
    $('u5-min').innerHTML = min + '<small>min</small>';
    $('u5-evap').textContent = fmtE(evap(vol, min)) + ' L'; $('u5-cuve').textContent = fmtE(vol + evap(vol, min)) + ' L';
    var lib = FERM - vol;
    $('u5-fill').style.width = Math.min(100, vol / FERM * 100) + '%';
    $('u5-fill').textContent = vol + ' L';
    $('u5-lib').textContent = lib >= 0 ? lib + ' L' : '+' + (-lib) + ' L';
    $('u5-ferm').classList.toggle('u5-trop', lib < 0);
  }
  document.querySelectorAll('[data-d]').forEach(function(b){ b.onclick = function(){ vol = Math.max(1, vol + +b.dataset.d); rendre(); }; });
  document.querySelectorAll('[data-e]').forEach(function(b){ b.onclick = function(){ min = Math.max(0, Math.min(180, min + +b.dataset.e)); rendre(); }; });
  document.querySelector('.u5-tamp').onclick = function(){ this.setAttribute('aria-checked', this.getAttribute('aria-checked') !== 'true'); };
  rendre();
`);

// =====================================================================================================
// u6 — CHAUDE — « Les molettes » : style, volume et ébullition sur trois molettes, lus d'une seule ligne.
const lignes = (arr, cls) => arr.map((t) => `<li class="u6-it ${cls || ''}">${t}</li>`).join('');
const stylesM = ['American IPA', 'Specialty IPA', 'Hazy IPA', 'Double IPA', 'Strong Ale', 'Imperial Stout'];
const vols = []; for (let v = 10; v <= 40; v++) vols.push(v);
const mins = []; for (let m = 0; m <= 120; m += 5) mins.push(m);
pages.u6 = page('u6', 'u6 — Les molettes', `
.u6-main{padding:8px 8px 12px;display:flex;flex-direction:column;gap:10px}
.u6-nom{display:flex;align-items:center;gap:8px;height:40px;padding:0 12px;border-radius:8px;background:#F5F5F5}
.u6-nom label{font-size:12px;color:#666}
.u6-nom input{flex:1;border:0;background:none;font-size:20px;font-weight:600;height:36px}
.u6-roues{position:relative;display:grid;grid-template-columns:1.7fr 1fr 1fr;gap:4px;background:#12100E;border-radius:8px;padding:8px 6px}
.u6-tete{display:contents}
.u6-tete span{font-size:12px;color:#9A8A7E;text-align:center;padding-bottom:2px}
.u6-bande{position:absolute;left:6px;right:6px;top:calc(8px + 18px + 101px);height:36px;border-radius:8px;background:#2C2521;border:2px solid #F2C14E;pointer-events:none}
.u6-r{height:238px;overflow:hidden;list-style:none;position:relative;z-index:1;touch-action:none;cursor:grab;user-select:none;-webkit-mask-image:linear-gradient(#0003,#000 22%,#000 78%,#0003);mask-image:linear-gradient(#0003,#000 22%,#000 78%,#0003)}
.u6-r::-webkit-scrollbar{display:none}
.u6-it{height:34px;line-height:34px;text-align:center;scroll-snap-align:center;font-size:20px;color:#D8CEC5}
.u6-it.u6-sel{color:#F5F0EA;font-weight:700;font-size:26px}
.u6-num .u6-it{font-family:"IBM Plex Mono",monospace;font-variant-numeric:tabular-nums}
.u6-lecture{display:flex;flex-direction:column;gap:4px;padding:8px 12px;border:1px solid #DDD;border-radius:8px}
.u6-ln{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:52px;font-size:14px;color:#333}
.u6-ln b{font-family:"IBM Plex Mono",monospace;font-weight:600;color:#111;font-size:20px}
.u6-ln small{font-size:13px;color:#666;display:block;margin-top:6px}
.u6-ln > span:first-child{font-size:16px;line-height:1.1;color:#111;font-weight:600}
.u6-tube{flex:1;height:20px;border-radius:8px;background:repeating-linear-gradient(135deg,#fff 0 4px,#DDD 4px 8px);border:1px solid #BFBFBF;position:relative;overflow:hidden;margin:0 4px}
.u6-tube i{position:absolute;left:0;top:0;bottom:0;background:#111;transition:width .15s}
.u6-tube u{position:absolute;top:0;bottom:0;left:80%;border-left:2px dashed #9C7020}
.u6-trop .u6-tube i{background:#C8382F}
.u6-trop b{color:#A8291F}
.u6-sw{width:48px;height:28px;border-radius:14px;background:#BFBFBF;position:relative}
.u6-sw::after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;transition:transform .18s}
.u6-sw[aria-checked="true"]{background:#3F6B2E}
.u6-sw[aria-checked="true"]::after{transform:translateX(20px)}
.u6-sep{height:1px;background:#DDD}
.u6-ln b small.u6-mot{display:inline;font-family:"Source Sans 3",sans-serif;font-size:14px;margin:0;color:#333;font-weight:400}
.u6-seg{display:flex;border:1px solid #BFBFBF;border-radius:8px;overflow:hidden}
.u6-seg button{height:32px;min-width:40px;padding:0 8px;font-family:"IBM Plex Mono",monospace;font-size:14px;border-left:1px solid #DDD}
.u6-seg button:first-child{border-left:0}
.u6-seg button[aria-checked="true"]{background:#111;color:#fff}
@media (prefers-reduced-motion: reduce){.u6-sw::after,.u6-tube i{transition:none}.u6-r{scroll-behavior:auto}}
`, `
<main class="u6-main">
  <div class="u6-nom"><label for="u6-nom">Nom</label><input id="u6-nom" type="text" value="neipa v3" autocomplete="off">${ico.crayon}</div>
  <section class="u6-roues" aria-label="Molettes">
    <div class="u6-tete"><span>Style</span><span>Litres</span><span>Minutes</span></div>
    <div class="u6-bande"></div>
    <ul class="u6-r" id="u6-rs" data-booster="molette-style" tabindex="0" role="listbox" aria-label="Style"></ul>
    <ul class="u6-r u6-num" id="u6-rv" data-booster="molette-volume" tabindex="0" role="listbox" aria-label="Volume en fermenteur"></ul>
    <ul class="u6-r u6-num" id="u6-rm" data-booster="molette-ebullition" tabindex="0" role="listbox" aria-label="Ébullition"></ul>
  </section>
  <section class="u6-lecture">
    <div class="u6-ln"><span>Objectif NOLO <small>≤ 0,5 %</small></span><button class="u6-sw" role="switch" aria-checked="false" aria-label="Objectif NOLO" data-booster="nolo"></button></div>
    <div class="u6-sep"></div>
    <div class="u6-ln" id="u6-fl"><span>Fermenteur <small>30 L</small></span><span class="u6-tube"><i id="u6-fill" style="width:80%"></i><u id="u6-rep"></u></span><b id="u6-lib">6 L libres</b></div>
    <div class="u6-ln"><span>Évaporation <small>estimée</small></span><b id="u6-ev">≈ 3 L</b></div>
    <div class="u6-ln"><span>Cuve 45 L <small>estimé</small></span><b id="u6-cv">≈ 27 L</b></div>
    <div class="u6-sep"></div>
    <div class="u6-ln" data-booster="espace-libre"><span>Espace libre <small id="u6-cons">24 L</small></span><span class="u6-seg" role="radiogroup" aria-label="Espace libre"><button role="radio" data-p="15" aria-checked="false">15</button><button role="radio" data-p="20" aria-checked="true">20</button><button role="radio" data-p="25" aria-checked="false">25 %</button></span></div>
  </section>
</main>`, `
  var $ = function(i){ return document.getElementById(i); };
  var H = 34, st = { s: 3, v: 14, m: 12 };
  var R = { s: $('u6-rs'), v: $('u6-rv'), m: $('u6-rm') };
  var VOLS = [], MINS = []; for (var a = 10; a <= 40; a++) VOLS.push(a); for (var b = 0; b <= 120; b += 5) MINS.push(b);
  var LISTES = { s: ["American IPA","Specialty IPA","Hazy IPA","Double IPA","Strong Ale","Imperial Stout"], v: VOLS, m: MINS };
  function roue(k){
    var l = LISTES[k], h = '';
    for (var d = -3; d <= 3; d++) { var i = st[k] + d; h += '<li class="u6-it' + (d === 0 ? ' u6-sel' : '') + '" data-i="' + i + '" role="option" aria-selected="' + (d === 0) + '">' + (i >= 0 && i < l.length ? l[i] : '') + '</li>'; }
    R[k].innerHTML = h;
  }
  function marquer(){
    Object.keys(R).forEach(roue);
    var vol = VOLS[st.v], min = MINS[st.m], lib = FERM - vol;
    $('u6-fill').style.width = Math.min(100, vol / FERM * 100) + '%';
    $('u6-lib').innerHTML = Math.abs(lib) + ' L <small class="u6-mot">' + (lib >= 0 ? 'libres' : 'de trop') + '</small>';
    $('u6-fl').classList.toggle('u6-trop', lib < 0);
    $('u6-ev').textContent = '≈ ' + fmtE(evap(vol, min)) + ' L'; $('u6-cv').textContent = '≈ ' + fmtE(vol + evap(vol, min)) + ' L';
  }
  function poser(k, i){ st[k] = Math.max(0, Math.min(LISTES[k].length - 1, i)); marquer(); }
  Object.keys(R).forEach(function(k){
    var el = R[k], y0 = null, i0 = 0, bouge = false;
    el.addEventListener('pointerdown', function(e){ y0 = e.clientY; i0 = st[k]; bouge = false; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', function(e){ if (y0 === null) return; var d = Math.round((y0 - e.clientY) / H); if (Math.abs(y0 - e.clientY) > 12) bouge = true; if (i0 + d !== st[k]) poser(k, i0 + d); });
    el.addEventListener('pointerup', function(e){ if (!bouge) { var li = document.elementFromPoint(e.clientX, e.clientY); li = li && li.closest('[data-i]'); if (li && li.textContent) poser(k, +li.dataset.i); } y0 = null; });
    el.addEventListener('wheel', function(e){ e.preventDefault(); poser(k, st[k] + (e.deltaY > 0 ? 1 : -1)); }, { passive: false });
    el.addEventListener('keydown', function(e){ if (e.key === 'ArrowDown') { poser(k, st[k] + 1); e.preventDefault(); } if (e.key === 'ArrowUp') { poser(k, st[k] - 1); e.preventDefault(); } });
  });
  var pc = 20;
  document.querySelectorAll('.u6-seg button').forEach(function(b){ b.onclick = function(){ pc = +b.dataset.p; document.querySelectorAll('.u6-seg button').forEach(function(x){ x.setAttribute('aria-checked', x === b); }); $('u6-cons').textContent = Math.floor(FERM * (100 - pc) / 100) + ' L'; $('u6-rep').style.left = (Math.floor(FERM * (100 - pc) / 100) / FERM * 100) + '%'; }; });
  document.querySelector('.u6-sw').onclick = function(){ this.setAttribute('aria-checked', this.getAttribute('aria-checked') !== 'true'); };
  marquer();
`);

for (const [id, html] of Object.entries(pages)) {
  const d = path.join(OUT, id);
  fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(d, 'etat.html'), html);
}
console.log('écrit', Object.keys(pages).join(' '));
