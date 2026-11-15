// Assemble etat.html d'une variante de la voie s3 : jetons des deux thèmes, icônes au trait (SVG inline), écran de l'app
// estompé derrière la feuille. Le corps (corps.html) et le style (style.css) sont propres à chaque variante.
// Le préfixe « @- » devient « <id>- » par split/join (L26). Usage : node fabrique.mjs s3a [s3b …]
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ICI = dirname(fileURLToPath(import.meta.url));

const P = {
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  fil: '<path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/>',
  cloche: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  bouclier: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  zero: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  envoyer: '<path d="M14.54 21.69a.5.5 0 0 0 .94-.03l6.5-19a.5.5 0 0 0-.64-.63l-19 6.5a.5.5 0 0 0-.02.93l7.93 3.18a2 2 0 0 1 1.11 1.11z"/><path d="m21.85 2.15-10.94 10.94"/>',
  bas: '<path d="m6 9 6 6 6-6"/>',
  droite: '<path d="m9 18 6-6-6-6"/>',
  gauche: '<path d="m15 18-6-6 6-6"/>',
  ok: '<path d="M20 6 9 17l-5-5"/>',
  alerte: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
  horsligne: '<path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M5 12.86a10 10 0 0 1 5.17-2.69M19 12.86a10 10 0 0 0-2-1.52M2 8.82a15 15 0 0 1 4.18-2.64M22 8.82a15 15 0 0 0-11.29-3.76"/><path d="m2 2 20 20"/>',
  horloge: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  journal: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h8M8 11h6"/>',
  eclair: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
  loupe: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  thermo: '<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>',
  calcul: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01M8 10h.01M12 10h.01M16 10h.01"/>',
  crayon: '<path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"/>',
  relancer: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  fleche: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  telephone: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
  livre: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  relu: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  panier: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  feuille: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  pression: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
  question: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  panneau: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M15 3v18"/>',
  goutte: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
};
const sprite = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${Object.entries(P)
  .map(([k, v]) => `<symbol id="@-i-${k}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${v}</symbol>`)
  .join('')}</svg>`;

const jetons = `
:root{--page:#FFFFFF;--pan:#F5F5F5;--sur:#EBEBEB;--bord:#DDDDDD;--bordm:#BFBFBF;--trait:#9E9E9E;--t2:#666666;--t:#333333;--t0:#111111;
--act:#111111;--sur-act:#FFFFFF;--hop:#567F45;--hopt:#3F6B2E;--hopf:#EEF4EA;--eau:#4F7E9B;--eaut:#2F5F7D;--eauf:#EAF1F6;
--alr:#C8382F;--alrt:#A8291F;--alrf:#FBEBEA;--att:#9C7020;--attt:#7F5B10;--attf:#FBF3E2;--fin:#1F64A3;
--fond:#D4D4D4;--voile:rgba(17,17,17,.30);--ombre:0 -6px 24px rgba(0,0,0,.14);
--sans:"Source Sans 3","Source Sans Pro",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;--mono:"IBM Plex Mono",ui-monospace,"Cascadia Mono",Consolas,monospace;color-scheme:light}
[data-theme="cave"]{--page:#12100E;--pan:#1A1613;--sur:#221D19;--bord:#2C2521;--bordm:#3D342E;--trait:#574A42;--t2:#9A8A7E;--t:#D8CEC5;--t0:#F5F0EA;
--act:#F2C14E;--sur-act:#12100E;--hop:#6E9B5B;--hopt:#86B573;--hopf:#1B2417;--eau:#5B8AA6;--eaut:#5E8CA8;--eauf:#16202A;
--alr:#D6453D;--alrt:#DC5F58;--alrf:#2A1715;--att:#E3B55D;--attt:#E3B55D;--attf:#2A2114;--fin:#86B9E6;
--fond:#070605;--voile:rgba(0,0,0,.55);--ombre:0 -8px 32px rgba(0,0,0,.6);color-scheme:dark}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:var(--fond);font-family:var(--sans);color:var(--t);-webkit-font-smoothing:antialiased}
button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}
svg.@-i{width:16px;height:16px;flex:none}
.@-n{font-family:var(--mono);font-variant-numeric:tabular-nums}
.@-planche{display:flex;flex-wrap:wrap;gap:28px 20px;padding:20px;align-items:flex-start}
.@-cadre{display:flex;flex-direction:column;gap:8px}
.@-cadre>figcaption{font-size:14px;font-weight:600;color:var(--t0)}
.@-cadre>figcaption span{font-weight:400;color:var(--t2)}
.@-tel{position:relative;width:390px;height:760px;border-radius:28px;overflow:hidden;background:var(--page);border:1px solid var(--bordm);flex:none}
.@-tel.@-large{width:1280px}
.@-fond{position:absolute;inset:0;filter:blur(2.5px);pointer-events:none}
.@-voile{position:absolute;inset:0;background:var(--voile)}
.@-ap-tete{height:44px;display:flex;align-items:center;gap:8px;padding:0 12px;border-bottom:1px solid var(--bord);font-weight:700;color:var(--t0);font-size:16px}
.@-ap-ong{display:flex;gap:16px;padding:8px 12px;font-size:13px;color:var(--t2);border-bottom:1px solid var(--bord)}
.@-ap-ong b{color:var(--t0)}
.@-ap-gros{display:flex;align-items:baseline;gap:12px;padding:16px 12px 8px}
.@-ap-gros .@-n{font-size:40px;color:var(--t0)}
@media (max-width:600px){.@-planche{padding:0;gap:16px 0}.@-cadre>figcaption{padding:0 8px}.@-tel.@-large{width:390px}}
.@-ap-logo{width:20px;height:20px}
.@-ap-ligne{display:flex;justify-content:space-between;padding:10px 12px;border-bottom:1px solid var(--bord);font-size:14px}
.@-ap-barre{margin:12px;height:10px;border-radius:5px;background:var(--sur);position:relative}
.@-ap-barre i{position:absolute;inset:0 62% 0 0;border-radius:5px;background:var(--hop)}
`;

const fond = `<div class="@-fond" aria-hidden="true"><div class="@-ap-tete"><img class="@-ap-logo" alt="" width="20" height="20" src="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27%3E%3Ccircle cx=%2712%27 cy=%2712%27 r=%2710%27 fill=%27%23567F45%27/%3E%3C/svg%3E">Brassin 31 · New England IPA</div>
<div class="@-ap-ong"><span>Recette</span><span>Brassage</span><b>Fermentation</b><span>Journal</span></div>
<div class="@-ap-gros"><span class="@-n">19 °C</span><span>J+4 · 19 L</span></div><div class="@-ap-barre"><i></i></div>
<div class="@-ap-ligne"><span>Citra · dry hop J+2</span><span class="@-n">85 g</span></div>
<div class="@-ap-ligne"><span>Galaxy · dry hop J+6</span><span class="@-n">43 g</span></div>
<div class="@-ap-ligne"><span>Mosaic · dry hop J+9</span><span class="@-n">43 g</span></div>
<div class="@-ap-ligne"><span>DF relevée</span><span class="@-n">1,012</span></div>
<div class="@-ap-ligne"><span>pH de maische visé</span><span class="@-n">5,3</span></div></div><div class="@-voile"></div>`;

for (const id of process.argv.slice(2)) {
  const d = join(ICI, id);
  const corps = readFileSync(join(d, 'corps.html'), 'utf8');
  const style = readFileSync(join(d, 'style.css'), 'utf8');
  const titre = (corps.match(/<!--titre:(.*?)-->/) || [, id])[1];
  const html = `<!doctype html><html lang="fr" data-theme="clair"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${id} — compagnon brasseur — ${titre}</title><style>${jetons}${style}</style></head><body>${sprite}
<main class="@-planche">${corps.split('{{FOND}}').join(fond)}</main></body></html>`;
  writeFileSync(join(d, 'etat.html'), html.split('@-').join(`${id}-`));
  console.log(`${id}: etat.html écrit`);
}
