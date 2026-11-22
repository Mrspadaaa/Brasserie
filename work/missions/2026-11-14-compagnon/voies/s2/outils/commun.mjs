// Socle de présentation des mini maquettes s2 : jetons DESIGN.md (clair et cave), icônes au trait (style lucide),
// cadre de téléphone et fond d'écran estompé. Chaque classe porte le préfixe de la variante (« § » remplacé par l'id,
// par split/join, L26). Aucune ressource réseau.

const P = {
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  bell: '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  wifiOff: '<path d="M12 20h.01"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/><path d="M5 12.859a10 10 0 0 1 5.17-2.69"/><path d="M19 12.859a10 10 0 0 0-2.007-1.523"/><path d="M2 8.82a15 15 0 0 1 4.177-2.643"/><path d="M22 8.82a15 15 0 0 0-11.288-3.764"/><path d="m2 2 20 20"/>',
  convs: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  reset: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  send: '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  upRight: '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
  sliders: '<path d="M21 4h-7"/><path d="M10 4H3"/><path d="M21 12h-9"/><path d="M8 12H3"/><path d="M21 20h-5"/><path d="M12 20H3"/><path d="M14 2v4"/><path d="M8 10v4"/><path d="M16 18v4"/>',
  book: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  calc: '<rect width="16" height="20" x="4" y="2" rx="2"/><path d="M8 6h8"/><path d="M16 14v4"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  pen: '<path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  calClock: '<path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h5"/><path d="M17.5 17.5 16 16.3V14"/><circle cx="16" cy="16" r="6"/>',
  thermo: '<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>',
  phone: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
  arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  notebook: '<path d="M2 6h4"/><path d="M2 10h4"/><path d="M2 14h4"/><path d="M2 18h4"/><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M16 2v20"/>',
  sparkles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
  listChecks: '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
  hourglass: '<path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>',
  timer: '<line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/>',
  flag: '<path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  minus: '<path d="M5 12h14"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5 5.5 5.5 0 0 1-5.5 5.5H11"/>',
  loader: '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
  pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  msg: '<path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"/>',
};

export const icone = (nom, taille = 16, cls = '') =>
  `<svg class="§-ic ${cls}" width="${taille}" height="${taille}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[nom]}</svg>`;

export const JETONS = `
:root{--pg:#FFFFFF;--pn:#F5F5F5;--su:#EBEBEB;--bd:#DDDDDD;--bdm:#BFBFBF;--tf:#9E9E9E;--t2:#666666;--t1:#333333;--t0:#111111;
--act:#111111;--acttx:#FFFFFF;--hop:#567F45;--hoptx:#3F6B2E;--hopbg:#EEF4EA;--att:#9C7020;--atttx:#7F5B10;--attbg:#FBF3E2;
--al:#C8382F;--altx:#A8291F;--albg:#FBEAE8;--eau:#4F7E9B;--eautx:#2F5F7D;--eaubg:#EAF1F6;--fin:#1F64A3;
--sh-sheet:0 -12px 40px -16px rgba(0,0,0,.28);--sh-lift:0 8px 24px -12px rgba(0,0,0,.3);--scrim:rgba(17,17,17,.30);
--planche:#7A7A7A;--planche-tx:#FFFFFF;
--sans:"Source Sans 3","Source Sans Pro",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
--mono:"IBM Plex Mono",ui-monospace,"Cascadia Mono",Consolas,monospace}
[data-theme=cave]{--pg:#12100E;--pn:#1A1613;--su:#221D19;--bd:#2C2521;--bdm:#3D342E;--tf:#574A42;--t2:#9A8A7E;--t1:#D8CEC5;--t0:#F5F0EA;
--act:#F2C14E;--acttx:#12100E;--hop:#6E9B5B;--hoptx:#7FAE6B;--hopbg:#1C2618;--att:#E3B55D;--atttx:#E3B55D;--attbg:#2A2113;
--al:#D6453D;--altx:#DC5F58;--albg:#2C1614;--eau:#5E8CA8;--eautx:#6F9CB8;--eaubg:#17222A;--fin:#86B9E6;
--sh-sheet:0 -12px 40px -16px rgba(0,0,0,.8);--sh-lift:0 8px 24px -12px rgba(0,0,0,.8);--scrim:rgba(0,0,0,.45);
--planche:#0A0908;--planche-tx:#D8CEC5}
*{box-sizing:border-box}
html,body{margin:0}
body{background:var(--planche);font-family:var(--sans);color:var(--t1);-webkit-font-smoothing:antialiased;padding:20px 20px 28px}
::selection{background:var(--hop);color:#fff}
.§-pl-titre{color:var(--planche-tx);font-size:18px;font-weight:700;margin:0 0 4px}
.§-pl-sous{color:var(--planche-tx);opacity:.85;font-size:14px;margin:0 0 16px}
.§-pl{display:flex;gap:24px;align-items:flex-start}
.§-pl-col{width:390px;flex:none}
.§-pl-lib{color:var(--planche-tx);font-size:14px;font-weight:600;margin:0 0 6px}
.§-pl-lib span{font-weight:400;opacity:.85}
.§-tel{width:390px;height:760px;position:relative;overflow:hidden;border-radius:14px;background:var(--pg);box-shadow:0 10px 30px -14px rgba(0,0,0,.6)}
.§-fond{position:absolute;inset:0;filter:blur(1.6px);opacity:.75;padding:10px 12px;color:var(--t1)}
.§-fond-b{display:flex;align-items:center;gap:8px;height:36px;font-weight:700;font-size:16px;color:var(--t0)}
.§-fond-t{display:flex;gap:6px;margin:4px 0 12px}
.§-fond-t i{flex:1;height:26px;border-radius:6px;background:var(--pn);border:1px solid var(--bd)}
.§-fond-t i:nth-child(2){background:var(--hopbg);border-color:var(--hop)}
.§-fond-big{font:600 28px var(--mono);color:var(--t0)}
.§-fond-r{height:30px;border-bottom:1px solid var(--bd)}
.§-scrim{position:absolute;inset:0;background:var(--scrim)}
.§-feuille{position:absolute;left:0;right:0;bottom:0;top:44px;background:var(--pg);border-radius:14px 14px 0 0;box-shadow:var(--sh-sheet);display:flex;flex-direction:column;overflow:hidden}
.§-poignee{width:36px;height:4px;border-radius:2px;background:var(--bdm);margin:6px auto 0;flex:none}
.§-ic{flex:none;display:block}
.§-mono{font-family:var(--mono);font-variant-numeric:tabular-nums;font-feature-settings:"tnum"}
.§-vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
.§-pl-titre{display:flex;align-items:center;gap:8px}
.§-pl-logo{width:20px;height:20px;flex:none}
@media (max-width:500px){body{padding:0 0 16px}.§-pl{flex-direction:column;gap:16px}.§-pl-titre,.§-pl-sous,.§-pl-lib{padding:0 8px}.§-pl-titre{padding-top:8px}.§-tel{border-radius:0}}
`;

// Marque de la planche, en image locale (data:, aucun réseau) : la feuille du compagnon au trait.
const LOGO = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#6E9B5B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>');

export const FOND = `<div class="§-fond" aria-hidden="true"><div class="§-fond-b">Brassin 31 · New England IPA</div>
<div class="§-fond-t"><i></i><i></i><i></i></div><div class="§-fond-big">19 °C</div>
<div class="§-fond-r"></div><div class="§-fond-r"></div><div class="§-fond-r"></div><div class="§-fond-r"></div></div><div class="§-scrim"></div>`;

// Assemble une page : 4 cadres côte à côte. cadres = [{ cadre, lib, aide, html }].
export function page({ id, titre, sous, css, cadres }) {
  const corps = cadres.map((c) => `<div class="§-pl-col"><p class="§-pl-lib">${c.lib} <span>· ${c.aide}</span></p>
<div class="§-tel" data-cadre="${c.cadre}">${FOND}<section class="§-feuille" aria-label="Compagnon brasseur"><div class="§-poignee"></div>${c.html}</section></div></div>`).join('\n');
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${id} — ${titre}</title><style>${JETONS}${css}</style></head><body>
<h1 class="§-pl-titre"><img class="§-pl-logo" src="${LOGO}" alt="" width="20" height="20">${id} — ${titre}</h1><p class="§-pl-sous">${sous}</p><div class="§-pl">${corps}</div></body></html>`;
  return html.split('§').join(id);
}
