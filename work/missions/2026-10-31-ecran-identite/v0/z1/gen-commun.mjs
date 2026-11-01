// Génère les 6 concepts de la série z (Identité 1/7, lot v0). Sortie : work/missions/2026-10-31-ecran-identite/v0/z<n>/etat.html
import fs from 'node:fs';
import path from 'node:path';

const RACINE = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie';
const OUT = path.join(RACINE, 'work/missions/2026-10-31-ecran-identite/v0');

// ---------- chrome commun, hors périmètre (J12) : en-tête, fil, bandeau, pied, + ----------
const ICO = {
  back: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
  paste: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z"/><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M16 4h2a2 2 0 0 1 2 2v2M11 14h10"/><path d="m17 10 4 4-4 4"/></svg>',
  moon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
  chev: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  plus: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
};
const ETAPES = ['Identité', 'Malts/sucres', 'Houblons', 'Levure', 'Paliers', 'Eau', 'Récap.'];

function chrome(p) {
  return `
<header class="${p}-haut" data-commun="en-tete">
  <div class="${p}-titre">
    <button type="button" class="${p}-ico" aria-label="Fermer" data-role="fermer">${ICO.back}</button>
    <p class="${p}-nomEtape"><b>Identité</b> <span class="${p}-mono ${p}-pos">1/7</span></p>
    <button type="button" class="${p}-abandon" data-role="abandonner-brouillon">Abandonner</button>
    <button type="button" class="${p}-ico" aria-label="Coller une recette" data-role="import">${ICO.paste}</button>
    <button type="button" class="${p}-ico" aria-label="Thème" data-role="theme">${ICO.moon}</button>
  </div>
  <nav class="${p}-fil" aria-label="Étapes" data-commun="fil">
    ${ETAPES.map((e, i) => `<button type="button" ${i === 0 ? 'aria-current="step"' : ''}><span>${e}</span><i></i></button>`).join('')}
  </nav>
</header>
<div class="${p}-bandeau" data-commun="bandeau">
  <span class="${p}-bl">Grain <b class="${p}-mono">8,6 kg</b></span>
  <span class="${p}-bl">OG <b class="${p}-mono ${p}-og">1,080</b></span>
  <span class="${p}-bl">IBU <b class="${p}-mono">~93</b><i class="${p}-piste"><u></u><s></s></i></span>
  <span class="${p}-bl">EBC <i class="${p}-ebc"></i><b class="${p}-mono">9,5</b></span>
</div>`;
}
function pied(p) {
  return `
<footer class="${p}-pied" data-commun="pied">
  <button type="button" class="${p}-retour" disabled>Retour</button>
  <button type="button" class="${p}-suivant">Suivant — Malts/sucres</button>
</footer>
<button type="button" class="${p}-plus" aria-label="Actions rapides" data-commun="plus">${ICO.plus}</button>`;
}
// Plage du style (22A, BJCP 2021, catalogue brewingStylesBootstrap.json) avec la valeur de la recette dessus. Aucune valeur
// n'est réécrite : la recette est dans le bandeau. pos = position de la recette en % de l'axe ; bande = [début, fin] en %.
function plage(p, nom, bande, pos, hors) {
  return `<span class="${p}-pl"><span class="${p}-pln">${nom}</span><i class="${p}-plb"><u style="left:${bande[0]}%;width:${bande[1] - bande[0]}%"></u><s style="left:${pos}%" class="${hors ? p + '-hors' : ''}"></s></i></span>`;
}
// Axes : OG 1,040–1,100 ; IBU 0–140 ; EBC 0–40. Recette : OG 1,080 (66 %), IBU ~93 (66 %), EBC 9,5 (24 %, sous la bande 12–28 : hors).
const PLAGES = (p) => plage(p, 'OG', [42, 75], 66) + plage(p, 'IBU', [43, 71], 66) + plage(p, 'EBC', [30, 70], 24, true);

function cssCommun(p) {
  return `
:root{--page:#fff;--panel:#F5F5F5;--surf:#EBEBEB;--bord:#DDD;--bord2:#BFBFBF;--t1:#111;--t2:#333;--t3:#666;
--hop:#567F45;--hopT:#3F6B2E;--water:#4F7E9B;--eau:#2F6E96;--waterT:#2F5F7D;--alert:#C8382F;--att:#9C7020;--attT:#7F5B10;--gold:#E0A02E;--goldT:#7A5A12;--violet:#6A4FB0;--violetT:#4E3A86}
*{box-sizing:border-box}
html,body{margin:0;background:var(--page);color:var(--t2)}
body{width:390px;min-height:844px;font:14px/18px 'Source Sans 3',system-ui,sans-serif;position:relative;padding-bottom:8px}
button,input{font:inherit;color:inherit}
button{background:none;border:0;padding:0;cursor:pointer}
.${p}-mono{font-family:'IBM Plex Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums;font-weight:600}
.${p}-haut{padding:0 8px;background:var(--page);border-bottom:1px solid var(--bord)}
.${p}-titre{display:flex;align-items:center;gap:6px;height:36px}
.${p}-ico{width:28px;height:28px;border-radius:4px;display:flex;align-items:center;justify-content:center;color:var(--t3);flex:none}
.${p}-nomEtape{flex:1;min-width:0;margin:0;display:flex;align-items:baseline;gap:6px;font-size:16px;color:var(--t1)}
.${p}-pos{font-size:14px;color:var(--t3);font-weight:400}
.${p}-abandon{height:28px;padding:0 6px;font-size:12px;color:var(--t2);text-decoration:underline;text-underline-offset:2px;border-radius:4px}
.${p}-fil{display:flex;gap:4px;height:32px;align-items:center}
.${p}-fil button{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:4px;padding:0 2px}
.${p}-fil span{font-size:12px;color:var(--t3);white-space:nowrap}
.${p}-fil i{display:block;height:6px;width:100%;border-radius:999px;background:var(--bord)}
.${p}-fil [aria-current] span{color:var(--t1);font-weight:600}
.${p}-fil [aria-current] i{background:var(--t1)}
.${p}-bandeau{margin:8px 8px 0;height:32px;padding:0 10px;background:var(--panel);border:1px solid var(--bord);border-radius:999px;display:flex;align-items:center;justify-content:space-between;gap:6px}
.${p}-bl{display:flex;align-items:center;gap:4px;color:var(--t3);font-size:14px;white-space:nowrap}
.${p}-bl b{color:var(--t1);font-size:14px}
.${p}-og{color:var(--goldT)}
.${p}-piste{position:relative;display:inline-block;width:46px;height:8px;border-radius:999px;background:var(--bord);margin-left:2px}
.${p}-piste u{position:absolute;left:46%;width:36%;top:0;bottom:0;background:var(--bord2);border-radius:999px}
.${p}-piste s{position:absolute;left:66%;top:-3px;width:2px;height:14px;background:var(--t1);border-radius:1px}
.${p}-ebc{display:inline-block;width:12px;height:12px;border-radius:50%;background:var(--gold)}
.${p}-pied{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:12px 8px 0;margin-right:72px}
.${p}-retour{height:28px;padding:0 10px;border-radius:4px;color:var(--t3);border:1px solid var(--bord);opacity:.6}
.${p}-suivant{height:32px;padding:0 10px;border-radius:4px;background:var(--t1);color:#fff;font-weight:600}
.${p}-plus{position:absolute;right:16px;bottom:16px;width:56px;height:56px;border-radius:50%;background:var(--t1);color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.25)}
.${p}-tag{display:inline-flex;align-items:center;gap:4px;height:28px;padding:0 10px;border-radius:999px;border:1px solid rgba(217,119,6,.4);background:rgba(251,191,36,.4);color:#6B3F05;font-weight:600;font-size:14px;white-space:nowrap}
.${p}-tiret{display:inline-flex;align-items:center;gap:4px;height:24px;padding:0 8px;border-radius:999px;border:1px dashed var(--bord2);color:var(--t3);font-size:12px;white-space:nowrap;list-style:none}
.${p}-tiret::-webkit-details-marker{display:none}
.${p}-champ{height:32px;border:1px solid var(--bord2);border-radius:4px;background:var(--page);padding:0 8px;font-size:16px;color:var(--t1);min-width:0}
.${p}-num{width:58px;text-align:right}
.${p}-sim{color:var(--t3)}
.${p}-pl{display:flex;align-items:center;gap:6px;min-height:20px}
.${p}-pln{width:30px;font-size:12px;color:var(--t3);flex:none}
.${p}-plb{position:relative;flex:1;height:8px;border-radius:999px;background:var(--bord)}
.${p}-plb u{position:absolute;top:0;bottom:0;background:var(--bord2);border-radius:999px}
.${p}-plb s{position:absolute;top:-4px;width:2px;height:16px;background:var(--t1);margin-left:-1px;border-radius:1px}
.${p}-plb s.${p}-hors{background:var(--att)}
`;
}
function page({ id, titre, css, corps, js = '' }) {
  return `<!doctype html>
<html lang="fr" data-theme="clair">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=390, initial-scale=1">
<title>${id} — ${titre} · Identité 1/7 (v0, 31.10)</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
<style>${cssCommun(id)}${css}</style>
</head>
<body class="${id}" data-concept="${id}">
${chrome(id)}
${corps}
${pied(id)}
<script>(function(){${js}})();</script>
</body>
</html>`;
}




export { OUT, ICO, PLAGES, plage, page };
