// Pièces communes de la série s1 : jetons des deux thèmes, icônes au trait (lucide), fond d'écran estompé, page de cadres.
// Seule la présentation (page, téléphone, fond) est partagée ; chaque variante écrit sa propre feuille.
const P = {
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  chev: '<path d="m6 9 6 6 6-6"/>',
  droite: '<path d="m9 18 6-6-6-6"/>',
  envoyer: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  fils: '<path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/>',
  menu: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  cloche: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  attention: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  ok: '<path d="M20 6 9 17l-5-5"/>',
  relu: '<path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/>',
  horloge: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  journal: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/><path d="M12 7v6M9 10h6"/>',
  horsligne: '<path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M2 2l20 20"/>',
  relancer: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  crayon: '<path d="M12 20h9"/><path d="M16.38 3.62a1 1 0 0 1 3 3L7.37 18.64a2 2 0 0 1-.86.5l-2.87.84a.5.5 0 0 1-.62-.62l.84-2.87a2 2 0 0 1 .5-.86z"/>',
  rapide: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  auto: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
  approfondi: '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65M22 12.65l-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  thermo: '<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>',
  lire: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M16 13H8M16 17H8M10 9H8"/>',
  calcul: '<rect width="16" height="20" x="4" y="2" rx="2"/><path d="M8 6h8M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',
  chercher: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  bouclier: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  fleche: '<path d="M7 7h10v10M7 17 17 7"/>',
  tourne: '<path d="M21 12a9 9 0 1 1-6.22-8.56"/>',
  appareil: '<rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/>',
  file: '<path d="M3 6h18M3 12h11M3 18h7"/><path d="m15 17 3 3 3-3M18 12v8"/>',
  geste: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  rediger: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  oeil: '<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/>',
};
export const ico = (n, s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;

// Fond : l'écran « Jour de brassage » sous la feuille, estompé (une image : verifier-page en exige une).
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="390" height="760" viewBox="0 0 390 760"><rect width="390" height="760" fill="#e9e9e9"/><rect x="12" y="10" width="130" height="14" rx="4" fill="#8a8a8a"/><circle cx="330" cy="17" r="8" fill="#a8a8a8"/><circle cx="362" cy="17" r="8" fill="#a8a8a8"/><g fill="#b4b4b4"><rect x="12" y="34" width="56" height="8" rx="3"/><rect x="78" y="34" width="70" height="8" rx="3"/><rect x="158" y="34" width="48" height="8" rx="3"/><rect x="216" y="34" width="60" height="8" rx="3"/><rect x="286" y="34" width="44" height="8" rx="3"/></g><rect x="12" y="56" width="366" height="150" rx="12" fill="#d6d6d6"/><rect x="290" y="70" width="70" height="44" rx="6" fill="#9c9c9c"/><rect x="24" y="150" width="340" height="10" rx="5" fill="#c4c4c4"/><rect x="24" y="150" width="190" height="10" rx="5" fill="#8fa884"/></svg>`;
export const FOND = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

export const jetons = `
:root{--c950:#FFFFFF;--c900:#F5F5F5;--c850:#EBEBEB;--c800:#DDDDDD;--c700:#BFBFBF;--c600:#9E9E9E;--c400:#666666;--c200:#333333;--c50:#111111;
--act:#111111;--sur-act:#FFFFFF;--hop:#567F45;--hop-t:#3F6B2E;--hop-f:rgba(86,127,69,.13);--eau:#4F7E9B;--eau-t:#2F5F7D;--eau-f:rgba(79,126,155,.12);
--al:#C8382F;--al-t:#A8291F;--al-f:rgba(200,56,47,.10);--at:#9C7020;--at-t:#7F5B10;--at-f:rgba(156,112,32,.13);--fin:#1F64A3;
--voile:rgba(17,17,17,.28);--ombre:0 -6px 24px rgba(0,0,0,.14);--paper:#7d7d7d;
--sans:"Source Sans 3","Source Sans Pro",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;--mono:"IBM Plex Mono",ui-monospace,"Cascadia Mono",Consolas,monospace}
[data-theme=cave]{--c950:#12100E;--c900:#1A1613;--c850:#221D19;--c800:#2C2521;--c700:#3D342E;--c600:#574A42;--c400:#9A8A7E;--c200:#D8CEC5;--c50:#F5F0EA;
--act:#F2C14E;--sur-act:#12100E;--hop:#6E9B5B;--hop-t:#8DB97A;--hop-f:rgba(110,155,91,.18);--eau:#5E8CA8;--eau-t:#7FA9C2;--eau-f:rgba(94,140,168,.18);
--al:#D6453D;--al-t:#DC5F58;--al-f:rgba(214,69,61,.16);--at:#E3B55D;--at-t:#E3B55D;--at-f:rgba(227,181,93,.15);--fin:#86B9E6;
--voile:rgba(0,0,0,.62);--ombre:0 -8px 28px rgba(0,0,0,.6);--paper:#2a2622}
*{box-sizing:border-box}html,body{margin:0}
::selection{background:var(--hop-f)}
`;

export function page({ id, titre, idee, chaleur, css, cadres }) {
  const p = id;
  const cad = cadres.map(({ cadre, nom, html }) => `
<section class="${p}-cad" data-cadre="${cadre}">
  <h2 class="${p}-cadnom">${nom}</h2>
  <div class="${p}-tel">
    <img class="${p}-fond" src="${FOND}" alt="" width="390" height="760">
    <div class="${p}-voile"></div>
    ${html}
  </div>
</section>`).join('');
  return `<!doctype html>
<html lang="fr" data-theme="clair">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${id} · ${titre} · 14.11</title>
<style>${jetons}
body{background:var(--paper);font-family:var(--sans);color:var(--c200);-webkit-font-smoothing:antialiased}
.${p}-page{padding:16px 0 24px}
.${p}-tete{color:#fff;font:600 15px/1.3 var(--sans);margin:0 12px 4px}
.${p}-idee{color:rgba(255,255,255,.85);font:400 13px/1.35 var(--sans);margin:0 12px 12px;max-width:760px}
.${p}-rang{display:flex;flex-wrap:wrap;gap:16px}
.${p}-cad{width:390px;max-width:100%}
.${p}-cadnom{color:#fff;font:600 13px/1 var(--sans);margin:0 12px 6px}
.${p}-tel{position:relative;width:390px;max-width:100%;height:760px;overflow:hidden;background:var(--c950);color:var(--c200)}
.${p}-fond{position:absolute;inset:0;width:100%;height:100%;opacity:.55;filter:blur(1.5px)}
[data-theme=cave] .${p}-fond{opacity:.16}
.${p}-voile{position:absolute;inset:0;background:var(--voile)}
:where(.${p}-tel) :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;text-align:left}
.${p}-tel :focus-visible{outline:2px solid var(--hop);outline-offset:2px}
.${p}-tel .${p}-n{font-family:var(--mono);font-variant-numeric:tabular-nums;letter-spacing:-.02em;word-spacing:-.3em}
.${p}-tel svg{flex:none}
${css}
</style></head>
<body><main class="${p}-page">
<h1 class="${p}-tete">${id} · ${titre} <span style="font-weight:400;opacity:.8">· ${chaleur}</span></h1>
<p class="${p}-idee">${idee}</p>
<div class="${p}-rang">${cad}
</div></main></body></html>`;
}
