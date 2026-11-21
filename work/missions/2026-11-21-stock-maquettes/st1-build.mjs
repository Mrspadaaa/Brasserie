// node st1-build.mjs : écrit st1-<version>-<état>.html, mini maquettes statiques du Stock, tour 1 (21.11, D416).
// Base : l'écran Stocks › Articles en ligne (tour 8), sa capture annotée 01 ; l'étagère (son « incroyable ») gardée partout.
// Axes : D1 entrée (d1a, d1b, d1c), D2 étagère compacte (d2a, d2b, d2c), D3 légende et 1280 (d3a, d3b), D8 Matériel et Fûts (d8a, d8b).
// Suffixe d'état : -660 = capture 390 × 660 (vrai téléphone) ; -1280 = capture 1280 × 800 ; sinon 390 × 844.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ICI = path.dirname(fileURLToPath(import.meta.url));

// ---------- icônes ----------
const P = {
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  star: '<path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  clip: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
  balance: '<path d="M12 3v18M5 21h14M3 7h18"/><path d="m6 7-3 7a3 3 0 0 0 6 0z"/><path d="m18 7-3 7a3 3 0 0 0 6 0z"/>',
  book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
  chevD: '<path d="m6 9 6 6 6-6"/>', chevR: '<path d="m9 18 6-6-6-6"/>', chevL: '<path d="m15 18-6-6 6-6"/>',
  plus: '<path d="M5 12h14M12 5v14"/>',
  cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
  sort: '<path d="m3 16 4 4 4-4M7 20V4M21 8l-4-4-4 4M17 4v16"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
  bord: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
  wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  mug: '<path d="M17 11h1a3 3 0 0 1 0 6h-1"/><path d="M9 12v6M13 12v6"/><path d="M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8"/><path d="M5 8c0-3 2-5 6-5s6 2 6 5"/>',
  boxes: '<path d="M7 16.5 2.5 14v5l4.5 2.5 5-2.5v-5zM17 16.5 12 14v5l5 2.5 4.5-2.5v-5zM12 8 7 5.5v5.5l5 3 5-3V5.5z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  grain: '<path d="M12 22V8"/><path d="M12 8c-2-1-3-3-3-5 2 1 3 3 3 5zM12 8c2-1 3-3 3-5-2 1-3 3-3 5z"/><path d="M12 13c-2-1-4-2-4-4 2 0 4 1 4 4zM12 13c2-1 4-2 4-4-2 0-4 1-4 4zM12 18c-2-1-4-2-4-4 2 0 4 1 4 4zM12 18c2-1 4-2 4-4-2 0-4 1-4 4z"/>',
  cone: '<path d="M12 2c-3 3-5 6-5 10a5 5 0 0 0 10 0c0-4-2-7-5-10z"/><path d="M8 9h8M7.3 13h9.4M8.5 17h7M12 2v20"/>',
  flask: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3"/><path d="M7 15h10"/>',
  keg: '<rect x="5" y="3" width="14" height="18" rx="3"/><path d="M5 9h14M5 15h14M10 3V1.5h4V3"/>',
  ferm: '<path d="M7 3h10v12l-5 6-5-6z"/><path d="M9 21h6M12 1v2"/>',
  pot: '<path d="M4 8h16v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z"/><path d="M2 8h20M8 4v4M16 4v4"/>',
  snow: '<path d="M12 2v20M4.9 4.9l14.2 14.2M2 12h20M4.9 19.1 19.1 4.9"/>',
  pump: '<circle cx="12" cy="13" r="6"/><path d="M12 13l3-3M2 13h4M18 13h4M12 7V3"/>',
  ext: '<path d="M15 3h6v6M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  drop: '<path d="M12 2.7 6.3 9.5a7 7 0 1 0 11.4 0z"/>',
  truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2M15 18H9M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
};
const ic = (k, s = 20, cls = '') => `<svg class="ic ${cls}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[k]}</svg>`;

// ---------- données d'exemple (« ZZ » non montré : noms de son stock, chiffres plausibles) ----------
// q : quantité (kg, g ou sachets) ; s : seuil ; e : EBC ; a : α ; z : épuisé ; c : à compter.
const MALTS = [
  { g: 'Base', l: [{ n: 'Pilsner', q: 25, s: 10, e: 3.5 }, { n: 'Pale Ale', q: 9, s: 5, e: 6 }, { n: 'Vienna', q: 4, e: 8 }, { n: 'Munich', q: 1.2, s: 2, e: 15 }, { n: 'Pils bio', q: 0, e: 3 }] },
  { g: 'Caramel', l: [{ n: 'Cara clair', q: 1, e: 20 }, { n: 'Cara 120', q: 0.6, e: 120 }, { n: 'Crystal', q: 0, e: 150 }] },
  { g: 'Torréfiés', l: [{ n: 'Chocolat', q: 0.5, e: 900 }, { n: 'Carafa III', q: 1, e: 1100 }, { n: 'Black', q: 0, e: 1300 }] },
  { g: 'Spéciaux', l: [{ n: 'Avoine', q: 4, e: 3 }, { n: 'Blé', q: 3, e: 4 }, { n: 'Seigle', q: 2, e: 6 }, { n: 'Acidulé', q: 0, e: 4 }, { n: 'Mélanoïdine', q: 0, e: 60 }, { n: 'Biscuit', q: 0, e: 50 }] },
];
const HOPS = [
  { g: 'Hazy', l: [{ n: 'Citra', q: 485, s: 250, a: 12.5 }, { n: 'Mosaic', q: 120, s: 100, a: 11.8 }, { n: 'Galaxy', q: 0, a: 14.2 }, { n: 'Nelson Sauvin', q: 60, a: 12 }, { n: 'Strata', q: 0, a: 11 }, { n: 'Idaho 7', q: 30, a: 13 }, { n: 'Cryo Citra 25g', q: 25, a: 24.8, c: 1 }] },
  { g: 'W. Coast', l: [{ n: 'Simcoe', q: 0, a: 13 }, { n: 'Columbus', q: 0, a: 15 }] },
  { g: 'Pale', l: [{ n: 'Cascade', q: 225, s: 100, a: 6.5 }, { n: 'Centennial', q: 0, a: 9.5 }, { n: 'Amarillo', q: 40, a: 8.6 }, { n: 'Chinook', q: 0, a: 12 }, { n: 'Saaz', q: 0, a: 3.5 }, { n: 'EKG', q: 0, a: 5 }] },
];
const YEASTS = [
  { g: 'IPA', l: [{ n: 'US-05', q: 3, k: 'U' }, { n: 'Verdant', q: 4, k: 'V' }] },
  { g: 'Anglaise', l: [{ n: 'S-04', q: 2, k: 'S' }] },
  { g: 'Blé', l: [{ n: 'WB-06', q: 0, k: 'W' }] },
  { g: 'Lager', l: [{ n: 'W-34/70', q: 1, k: 'W' }] },
  { g: 'Autres', l: [{ n: 'BE-256', q: 2, k: 'B' }, { n: 'Voss', q: 1, k: 'V' }, { n: 'K-97', q: 0, k: 'K' }] },
];
const nb = (gs) => gs.reduce((s, g) => s + g.l.length, 0);
const NM = nb(MALTS), NH = nb(HOPS), NY = nb(YEASTS);
const ebcCoul = (e) => (e < 5 ? '#f3d27a' : e < 10 ? '#e7b04f' : e < 25 ? '#cf8a35' : e < 80 ? '#a5602a' : e < 400 ? '#6e3a1c' : '#2c1a10');
const hopCoul = (a) => (a < 7 ? '#c7cdb0' : a < 11 ? '#a5ad86' : a < 13 ? '#7f8a5e' : '#5d6744');
const fr = (x) => String(x).replace('.', ',');
const kg = (q) => (q >= 1 ? `${fr(Math.round(q * 10) / 10)} kg` : `${Math.round(q * 1000)} g`);

// Hauteur d'une barre : linéaire jusqu'au repère, resserrée au-delà (comme l'app).
const haut = (q, rep, max = 34, base = 22) => (q <= 0 ? 0 : q <= rep ? Math.max(3, (q / rep) * base) : Math.min(max, base + (Math.log10(q / rep) / Math.log10(40)) * (max - base) * 1.6));

function barre(a, sorte, opts = {}) {
  const w = opts.w ?? 9, bh = opts.bh ?? 22, base = Math.round(bh * 0.62);
  if (sorte === 'levure') {
    if (!a.q) return `<span class="lv vide" style="width:${w + 3}px"><i class="ep"></i></span>`;
    const pile = Array.from({ length: Math.min(a.q, 4) }, (_, i) => `<i class="sa"${i === 0 ? ` data-k="${a.k}"` : ''}></i>`).reverse().join('');
    return `<span class="lv" style="width:${w + 3}px">${pile}</span>`;
  }
  if (!a.q) return `<span class="b" style="width:${w}px"><i class="ep"></i></span>`;
  const h = sorte === 'malt' ? haut(a.q, 5, bh - 1, base) : haut(a.q, 250, bh - 1, base);
  const col = sorte === 'malt' ? ebcCoul(a.e) : hopCoul(a.a);
  return `<span class="b${a.c ? ' cpt' : ''}${opts.sel === a.n ? ' sel' : ''}" style="width:${w}px"><i style="height:${a.c ? Math.round(base * 0.75) : h}px;background:${a.c ? 'transparent' : col}"></i></span>`;
}
const total = (g, sorte) => (sorte === 'malt' ? kg(g.l.reduce((s, a) => s + a.q, 0)) : sorte === 'houblon' ? `${g.l.reduce((s, a) => s + a.q, 0)} g` : `${g.l.reduce((s, a) => s + a.q, 0)}`);

// Une rangée du mur. opts : mince (D2b), legende, sel (article touché), w (largeur de barre), lien (catalogue), actif.
function rayon(nom, n, sorte, groupes, opts = {}) {
  const coul = { malt: '#a97b3c', houblon: '#6f9435', levure: '#8b7350' }[sorte];
  const vides = { malt: ['Fumé'], houblon: ['Lager', 'Stouts'], levure: ['Saison'] }[sorte];
  const rep = { malt: '5 kg', houblon: '250 g', levure: '' }[sorte];
  const gs = groupes.map((g) => `<div class="g"><em>${g.g}</em><div class="bars">${g.l.map((a) => barre(a, sorte, opts)).join('')}</div>${opts.mince ? '' : `<span class="tot">${total(g, sorte)}</span>`}</div>`).join('');
  const lab = opts.mince
    ? `<div class="rl mi">${ic({ malt: 'grain', houblon: 'cone', levure: 'flask' }[sorte], 18)}<b>${n}</b></div>`
    : `<div class="rl"><b>${nom}</b><span class="rl2"><small class="mono">${n}</small>${opts.lien ? `<a class="cat">${ic('book', 13)}136</a>` : ''}</span></div>`;
  return `<div class="ray ${sorte}${opts.mince ? ' mince' : ''}${opts.actif ? ' actif' : ''}" style="--rc:${coul}">${lab}<div class="rg">${rep && !opts.mince ? `<span class="rep mono">${rep} –</span>` : ''}${gs}${opts.mince ? '' : `<span class="vides">${vides.map((v) => `<span>○ ${v}</span>`).join('')}${opts.legende ? '<span class="leg-b">Légende</span>' : ''}</span>`}</div></div>`;
}
const mur = (o = {}) => { const b = { mince: o.mince, sel: o.sel, w: o.w, bh: o.bh }; return `<div class="mur${o.mince ? ' mince' : ''}${o.cls ? ' ' + o.cls : ''}">${o.avant ?? ''}${rayon('Malts', NM, 'malt', MALTS, { ...b, actif: o.actif === 'malt' })}${o.entre?.malt ?? ''}${rayon('Houblons', NH, 'houblon', HOPS, { ...b, actif: o.actif === 'houblon', lien: o.lien })}${o.entre?.houblon ?? ''}${rayon('Levures', NY, 'levure', YEASTS, { ...b, actif: o.actif === 'levure', legende: o.legende })}${o.apres ?? ''}</div>`; };

// ---------- lignes de liste ----------
function ligne(a, sorte, o = {}) {
  const unite = sorte === 'malt' ? kg(a.q) : `${a.q} g`;
  const etat = !a.q ? '<span class="rouge">épuisé</span>' : a.c ? '<span class="pt">à compter</span>' : a.s ? (a.q < a.s ? `<span class="brun">bas · seuil ${sorte === 'malt' ? kg(a.s) : a.s + ' g'}</span>` : `assez · seuil ${sorte === 'malt' ? kg(a.s) : a.s + ' g'}`) : 'sans seuil';
  const ref = sorte === 'malt' ? `<span class="pil mono"><i style="background:${ebcCoul(a.e)}"></i>EBC ${fr(a.e)}</span>` : `<span class="pil mono">α ${fr(a.a)} %</span>`;
  const lvl = a.s ? Math.min(1, a.q / (a.s * 2)) : a.q ? 0.6 : 0;
  return `<div class="li${!a.q ? ' z' : ''}"><span class="jauge${a.c ? ' cpt' : ''}"><i style="height:${Math.round(lvl * 100)}%"></i></span><div class="nm"><b>${a.n}</b><small>${etat}</small></div>${o.sansRef ? '' : ref}<span class="qt mono">${a.c ? '1 Pck' : !a.q ? '0' : unite}</span>${o.sansEtoile ? '' : `<span class="et">${ic('star', 20)}</span>`}</div>`;
}
const triMalts = () => MALTS.flatMap((g) => g.l).sort((x, y) => x.e - y.e);
const triHops = () => HOPS.flatMap((g) => g.l).sort((x, y) => y.a - x.a);

// ---------- décor ----------
const CSS = `
:root{--ink:#111;--txt:#2b2b29;--mut:#6a6a66;--line:#e2e2de;--line2:#c4c4bf;--s1:#f4f4f2;--s2:#ebebe8;--mur:#f6f5f1;--rouge:#b3261e;--brun:#8a5212;--vert:#3f6b2e;--bleu:#2b64a6}
*{box-sizing:border-box}html,body{margin:0}
body{width:390px;height:844px;overflow:hidden;position:relative;background:#fff;color:var(--txt);font:16px/1.25 "Source Sans 3","Segoe UI",system-ui,sans-serif}
body.h660{height:660px}
body.l1280{width:1280px;height:800px}
.mono{font-family:"IBM Plex Mono",ui-monospace,Consolas,monospace;font-variant-numeric:tabular-nums;letter-spacing:-.4px}
.ic{flex:none;vertical-align:middle}
header.app{height:50px;display:flex;align-items:center;gap:6px;padding:0 8px;border-bottom:1px solid var(--line)}
.logo{width:30px;height:30px;border-radius:8px;background:#1b1b1b;display:grid;place-items:center;color:#f2c14e;font-weight:800;font-size:15px}
.marque{font-size:15px;font-weight:600;color:var(--ink);flex:1}
.mois{display:flex;align-items:center;border:1.5px solid var(--line2);border-radius:10px;height:34px}
.mois span{padding:0 7px;display:grid;place-items:center;height:100%}
.mois .m{border-left:1.5px solid var(--line2);border-right:1.5px solid var(--line2);font-size:15px;font-weight:600;padding:0 12px;color:var(--ink)}
.rnd{width:34px;height:34px;border-radius:10px;border:1.5px solid var(--line2);display:grid;place-items:center;color:var(--ink);background:var(--s1)}
.av{display:flex}.av b{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-size:14px}
.av b:first-child{background:#111;color:#fff}.av b:last-child{background:#e3e3e3;color:#111;margin-left:-6px}
.seg{display:flex;background:var(--s2);border-radius:12px;padding:3px;gap:2px}
.seg>span{flex:1;display:flex;align-items:center;justify-content:center;gap:5px;height:36px;border-radius:9px;font-size:15px;color:#333;white-space:nowrap}
.seg>span.on{background:#111;color:#fff;font-weight:700}
.seg>span .n{font-size:14px;opacity:.75}
.seg.clair>span.on{background:#fff;color:#111;box-shadow:0 1px 2px rgba(0,0,0,.15)}
.tabs{margin:6px 10px 0}
.cmp{display:flex;align-items:center;justify-content:space-between;margin:6px 12px 0;padding:4px 0;border-bottom:1px solid var(--line);font-size:15px;color:var(--ink);font-weight:600}
.cmp small{font-weight:400;color:var(--mut);font-size:14px;display:flex;align-items:center;gap:3px}
.rech{display:flex;align-items:center;gap:8px;height:40px;border:1.5px solid var(--line2);border-radius:12px;padding:0 12px;color:#777;font-size:15px;background:#fff;flex:1;min-width:0}
.rech span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.filt{display:flex;gap:4px;align-items:center}
.pl{display:inline-flex;align-items:center;gap:2px;height:32px;padding:0 5px;border:1.5px solid var(--line2);border-radius:999px;font-size:13px;letter-spacing:-.2px;color:#333;background:#fff;white-space:nowrap}
.pl b{font-family:"IBM Plex Mono",Consolas,monospace;font-size:13px;color:#111}
.pl.r b{color:var(--rouge)}.pl.br b{color:var(--brun)}
.pl.zero{color:#999;border-style:dashed}.pl.zero b{color:#aaa}
.pl.cpt{border-style:dotted;border-width:2px}
.o{width:40px;height:40px;border-radius:50%;border:1.5px solid var(--line2);display:grid;place-items:center;color:#111;background:#fff;position:relative;flex:none}
.o.on{background:#111;color:#fff;border-color:#111}
.o:has(.bd){margin-right:4px}
.o .bd{position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;border-radius:9px;background:#2b64a6;color:#fff;font-size:12px;font-weight:700;display:grid;place-items:center;padding:0 4px;font-family:Consolas,monospace}
/* mur */
.mur{margin:6px 10px 0;background:var(--mur);border-radius:10px;padding:2px 0;overflow:hidden}
.ray{display:flex;border-left:4px solid var(--rc);border-bottom:1px solid #e4e1d8;padding:2px 6px 2px 5px;position:relative}
.ray:last-child{border-bottom:0}
.ray.actif{background:#fff;box-shadow:inset 0 0 0 2px var(--rc)}
.rl{width:58px;flex:none;display:flex;flex-direction:column;gap:2px;padding-top:2px}
.rl2{display:flex;align-items:center;gap:4px;white-space:nowrap}
.rl b{font-size:14px;color:var(--ink)}
.rl small{font-size:13px;color:var(--mut)}
.rl .cat{display:inline-flex;align-items:center;gap:1px;font-size:13px;color:var(--bleu);font-family:Consolas,monospace}
.leg-b{margin-top:2px;font-size:13px;line-height:16px;color:#333;border:1.5px solid var(--line2);border-radius:999px;padding:1px 7px;background:#fff;text-align:center}
.rg{flex:1;display:flex;align-items:flex-end;gap:8px;position:relative;min-width:0}
.rep{position:absolute;left:0;top:13px;font-size:12px;color:var(--mut);display:none}
.g{display:flex;flex-direction:column;position:relative}
.g em{font-style:normal;font-size:12.5px;font-weight:700;white-space:nowrap;display:block;line-height:13px}
.malt .g em{color:#9a6a2a}.houblon .g em{color:#5b7d2a}.levure .g em{color:#7a6040}
.bars{display:flex;align-items:flex-end;gap:2px;height:22px;border-bottom:2px solid #9c8a6b;position:relative}
.malt .bars::before,.houblon .bars::before{content:"";position:absolute;left:-3px;right:-3px;bottom:14px;border-top:1.5px dashed #7d7d75}
.b{display:flex;align-items:flex-end;height:100%}
.b i{display:block;width:100%;border-radius:2px 2px 0 0}
.b .ep{height:8px;border:1.5px solid var(--rouge);background:#fff;border-radius:1px}
.b.cpt i{border:2px dotted #333;border-bottom:0}
.b.sel i{outline:2.5px solid #111;outline-offset:1px}
.tot{font-size:12px;line-height:13px;color:#444;font-family:Consolas,monospace;white-space:nowrap}
.vides{display:flex;flex-direction:column;align-items:flex-end;align-self:flex-start;font-size:12px;line-height:14px;color:#999;margin-left:auto;gap:0;padding-top:2px}
.lv{display:flex;flex-direction:column;justify-content:flex-end;height:100%;gap:1px}
.lv .sa{display:block;height:3px;border-radius:2px 2px 1px 1px;background:#b59a6a}
.lv .sa[data-k]{height:11px;background:#6e5530;position:relative}
.lv .sa[data-k]::after{content:attr(data-k);position:absolute;inset:0;color:#fff;font:700 12px/11px system-ui;text-align:center}
.grand .lv .sa{height:7px}.grand .lv .sa[data-k]{height:13px}.grand .lv .sa[data-k]::after{line-height:13px}
.lv .ep{display:block;height:8px;border:1.5px solid var(--rouge);background:#fff}
.levure .bars::before{display:none}
.mur.mince .ray{min-height:38px;padding:2px 6px 2px 5px;align-items:center}
.mur.mince .rl{width:48px;flex-direction:row;align-items:center;gap:3px;color:var(--rc)}
.mur.mince .rl b{font-size:14px;font-family:Consolas,monospace;color:#333}
.mur.mince .rg{padding-top:0;gap:7px}
.mur.mince .g em{display:none}
.mur.mince .bars{height:24px}
.mur.mince .malt .bars::before,.mur.mince .houblon .bars::before{bottom:14px}
/* liste */
.gh{display:flex;align-items:center;gap:8px;margin:8px 12px 0;padding-bottom:4px}
.gh .pic{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:#f6ecd8;color:#9a6a2a}
.gh b{font-size:18px;color:var(--ink)}.gh small{font-size:14px;color:var(--mut)}
.gh .dr{margin-left:auto;display:flex;align-items:center;gap:6px;color:#333;font-size:14px}
.chip{display:inline-flex;align-items:center;gap:3px;height:30px;padding:0 10px;border-radius:999px;background:var(--s2);font-size:14px;color:#222;white-space:nowrap}
.echelle{display:flex;justify-content:space-between;margin:0 12px;font-size:13px;color:var(--mut);border-bottom:2px solid #b88a4a;padding:1px 0 2px 34px}
.li{display:flex;align-items:center;gap:8px;min-height:48px;padding:3px 6px 3px 12px;border-bottom:1px solid var(--line);margin:0 0 0 0}
.li .jauge{width:12px;height:30px;border:1.5px solid #8b7a5a;border-radius:2px;display:flex;align-items:flex-end;flex:none}
.li .jauge i{display:block;width:100%;background:#a97b3c}
.li .jauge.cpt{border-style:dotted}
.li.z .jauge{border-color:var(--rouge)}
.nm{flex:1;min-width:0;display:flex;flex-direction:column}
.nm b{font-weight:500;font-size:16px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nm small{font-size:14px;color:var(--mut)}
.rouge{color:var(--rouge)}.brun{color:var(--brun)}.pt{border-bottom:2px dotted #333}
.pil{display:inline-flex;align-items:center;gap:4px;border:1.5px solid var(--line2);border-radius:999px;padding:1px 7px;font-size:14px;white-space:nowrap}
.pil i{width:9px;height:9px;border-radius:50%;display:block}
.qt{font-size:17px;color:#111;min-width:52px;text-align:right;white-space:nowrap}
.et{width:36px;height:44px;display:grid;place-items:center;color:#777}
.fab{position:absolute;right:10px;bottom:76px;width:54px;height:54px;border-radius:16px;background:#111;color:#fff;display:grid;place-items:center;box-shadow:0 4px 10px rgba(0,0,0,.25)}
nav.bas{position:absolute;left:0;right:0;bottom:0;height:62px;border-top:1px solid var(--line);background:#fafafa;display:grid;grid-template-columns:repeat(6,1fr);z-index:5}
nav.bas span{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:13px;color:#444;position:relative}
nav.bas span.on{background:#e8eddf;color:#111;font-weight:700}
nav.bas .bd{position:absolute;top:5px;left:54%;min-width:18px;height:18px;border-radius:9px;background:#2b64a6;color:#fff;font-size:12px;display:grid;place-items:center;padding:0 4px}
.bulle{position:absolute;z-index:4;background:#fff;border:1.5px solid #111;border-radius:12px;box-shadow:0 8px 22px rgba(0,0,0,.18);padding:8px 10px}
`;
const NAV = [['bord', 'Bord'], ['wallet', 'Finances'], ['cal', 'Calendrier'], ['mug', 'Brassins'], ['boxes', 'Stocks'], ['users', 'Clients']];
const navBas = () => `<nav class="bas">${NAV.map(([k, t]) => `<span class="${t === 'Stocks' ? 'on' : ''}">${ic(k, 20)}${t}${t === 'Stocks' ? '<i class="bd">24</i>' : ''}</span>`).join('')}</nav>`;
const tete = () => `<header class="app"><span class="logo">A</span><span class="marque">L'Affinée</span><span class="mois"><span>${ic('chevL', 18)}</span><span class="m">Nov.</span><span>${ic('chevR', 18)}</span></span><span class="rnd">${ic('search', 18)}</span><span class="av"><b>G</b><b>A</b></span></header>`;
const onglets = (liste, actif) => `<div class="seg tabs">${liste.map((t) => `<span class="${t === actif ? 'on' : ''}">${t}</span>`).join('')}</div>`;
const fab = () => `<span class="fab">${ic('plus', 28)}</span>`;
const PILLS = [['manque', 6, 'br'], ['bas', 3, 'br'], ['épuisés', 17, 'r'], ['à compter', 1, 'cpt'], ['DDM', 0, '']];
const pills = (o = {}) => PILLS.filter(([t, n]) => !(o.sansZero && !n)).map(([t, n, c]) => `<span class="pl ${n ? c : 'zero'}">${t} <b>${n}</b></span>`).join('');
const page = (titre, corps, cls = '', css = '') => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${titre}</title><style>${CSS}${css}</style></head><body class="${cls}">${corps}</body></html>`;

const listeMalts = (n, o = {}) => triMalts().slice(0, n).map((a) => ligne(a, 'malt', o)).join('');
const listeHops = (n, o = {}) => triHops().slice(0, n).map((a) => ligne(a, 'houblon', o)).join('');
const enteteGroupe = (nom, n, pic, droite) => `<div class="gh"><span class="pic">${ic(pic, 18)}</span><b>${nom}</b><small class="mono">${n}</small><span class="dr">${droite}</span></div>`;
const echelleMalt = `<div class="echelle mono"><span>0</span><span>1</span><span>2,5</span><span><b>5 kg</b></span><span>⫽ 20</span><span>60</span><span>200</span></div>`;

// Recompter (état ouvert des D1) : bande de rayon et ses lignes, « il en reste » à la coche (acquis).
function recompter() {
  const rows = triMalts().slice(0, 8).map((a, i) => `<div class="rc-l"><div class="nm"><b>${a.n}</b><small class="mono"><i class="pt-e" style="background:${ebcCoul(a.e)}"></i>${fr(a.e)} EBC</small></div><span class="qt mono">${a.q ? kg(a.q) : '0'}</span><span class="ck${i < 2 ? ' on' : ''}">${ic('check', 20)}</span></div>`).join('');
  return `<div class="rc-b"><span class="pic">${ic('grain', 18)}</span><b>Malts</b><span class="mono rc-p"><i style="width:12%"></i></span><span class="mono">2/${NM}</span><span class="rc-go">${ic('check', 16)} Compter</span></div>${rows}`;
}
const CSS_RC = `.rc-b{display:flex;align-items:center;gap:8px;margin:8px 10px 0;background:#f7ecd9;border-radius:10px 10px 0 0;padding:8px 8px;font-size:15px}
.rc-b .pic{width:30px;height:30px;border-radius:50%;background:#fff;display:grid;place-items:center;color:#9a6a2a}
.rc-b b{font-size:17px}.rc-p{flex:1;height:8px;border-radius:4px;background:#e4d5bb;position:relative;overflow:hidden}.rc-p i{position:absolute;left:0;top:0;bottom:0;background:#8a5212}
.rc-go{display:inline-flex;align-items:center;gap:4px;height:36px;padding:0 10px;border-radius:9px;background:#fff;border:1.5px solid #111;font-weight:700;font-size:15px}
.rc-l{display:flex;align-items:center;gap:8px;min-height:50px;padding:2px 10px 2px 14px;border-bottom:1px solid var(--line);margin:0 10px;border-left:1px solid var(--line);border-right:1px solid var(--line)}
.rc-l small{display:flex;align-items:center;gap:4px}.pt-e{width:9px;height:9px;border-radius:50%;display:inline-block}
.ck{width:40px;height:40px;border-radius:50%;border:2px solid var(--line2);display:grid;place-items:center;color:#ccc}
.ck.on{background:#3f6b2e;border-color:#3f6b2e;color:#fff}`;

// ---------- versions ----------
const V = {};

// D1a : tout ce qu'il a dessiné. Recompter devient un onglet ; ★ épinglés dans le rond, place fixe.
V['d1a-repos'] = () => page('D1a', `${tete()}${onglets(['Articles', 'Recompter', 'Courses', 'Fûts', 'Matériel'], 'Articles')}
<div class="cmp">Comparer une recette<small>Besoin prévu face au stock ${ic('chevD', 16)}</small></div>
<div style="margin:8px 10px 0" class="filt"><span class="rech">${ic('search', 18)}<span>Rechercher : nom, fournisseur…</span></span></div>
<div class="filt" style="margin:6px 10px 0">${pills()}<span class="o" style="width:36px;height:36px;margin-left:auto">${ic('star', 18)}</span></div>
<div class="seg clair" style="margin:8px 10px 0"><span class="on">Ingrédients</span><span>Autres stocks</span></div>
${mur({ lien: true, legende: true })}
${enteteGroupe('Malts', NM, 'grain', `<span class="chip">couleur ${ic('chevD', 14)}</span>${ic('info', 20)}`)}
${echelleMalt}${listeMalts(4)}${fab()}${navBas()}`, '', '');

V['d1a-recompter'] = () => page('D1a Recompter', `${tete()}${onglets(['Articles', 'Recompter', 'Courses', 'Fûts', 'Matériel'], 'Recompter')}
<div style="margin:8px 10px 0" class="filt"><span class="rech">${ic('search', 18)}<span>Rechercher : nom, fournisseur…</span></span></div>
<div class="filt" style="margin:6px 10px 0">${pills()}<span class="o" style="width:36px;height:36px;margin-left:auto">${ic('star', 18)}</span></div>
<div class="seg clair" style="margin:8px 10px 0"><span class="on">Ingrédients</span><span>Autres stocks</span></div>
${recompter()}${navBas()}`, '', CSS_RC + '');

// D1b : quatre onglets ; Recompter vit dans le rond, à droite des filtres (son rond), avec le compte « à compter ».
const ongletsB = ['Articles', 'Courses', 'Fûts', 'Matériel'];
V['d1b-repos'] = () => page('D1b', `${tete()}${onglets(ongletsB, 'Articles')}
<div class="cmp">Comparer une recette<small>Besoin prévu face au stock ${ic('chevD', 16)}</small></div>
<div style="margin:8px 10px 0" class="filt"><span class="rech">${ic('search', 18)}<span>Rechercher : nom, fournisseur…</span></span></div>
<div class="filt" style="margin:6px 10px 0">${pills({ sansZero: true })}<span class="pl">★</span><span class="o" style="margin-left:auto">${ic('clip', 20)}<i class="bd">1</i></span></div>
<div class="seg clair" style="margin:8px 10px 0"><span class="on">Ingrédients</span><span>Autres stocks</span></div>
${mur({ lien: true, legende: true })}
${enteteGroupe('Malts', NM, 'grain', `<span class="chip">couleur ${ic('chevD', 14)}</span>${ic('info', 20)}`)}
${echelleMalt}${listeMalts(4)}${fab()}${navBas()}`);

V['d1b-recompter'] = () => page('D1b Recompter', `${tete()}${onglets(ongletsB, 'Articles')}
<div style="margin:8px 10px 0" class="filt"><span class="rech">${ic('search', 18)}<span>Rechercher : nom, fournisseur…</span></span></div>
<div class="filt" style="margin:6px 10px 0">${pills({ sansZero: true })}<span class="pl">★</span><span class="o on" style="margin-left:auto">${ic('clip', 20)}<i class="bd">1</i></span></div>
<div class="seg clair" style="margin:8px 10px 0"><span class="on">Ingrédients</span><span>Autres stocks</span></div>
${recompter()}${navBas()}`, '', CSS_RC);

// D1c : une seule rangée d'outils. Recherche + deux ronds : Comparer (balance) et Recompter ; filtres dessous, zéros repliés.
const outilsC = (on) => `<div class="filt" style="margin:8px 10px 0;gap:8px"><span class="rech">${ic('search', 18)}<span>Rechercher…</span></span><span class="o">${ic('balance', 20)}</span><span class="o${on ? ' on' : ''}">${ic('clip', 20)}<i class="bd">1</i></span></div>
<div class="filt" style="margin:6px 10px 0">${pills({ sansZero: true })}<span class="pl zero">DDM · ★</span></div>`;
V['d1c-repos'] = () => page('D1c', `${tete()}${onglets(ongletsB, 'Articles')}${outilsC(false)}
<div class="seg clair" style="margin:8px 10px 0"><span class="on">${ic('grain', 16)}Ingrédients</span><span>${ic('box', 16)}Autres stocks</span></div>
${mur({ lien: true, legende: true })}
${enteteGroupe('Malts', NM, 'grain', `<span class="chip">couleur ${ic('chevD', 14)}</span>${ic('info', 20)}`)}
${echelleMalt}${listeMalts(5)}${fab()}${navBas()}`);
V['d1c-recompter'] = () => page('D1c Recompter', `${tete()}${onglets(ongletsB, 'Articles')}${outilsC(true)}
<div class="seg clair" style="margin:8px 10px 0"><span class="on">${ic('grain', 16)}Ingrédients</span><span>${ic('box', 16)}Autres stocks</span></div>
${recompter()}${navBas()}`, '', CSS_RC);

// Entrée commune des D2 et D3 : celle de D1a (son dessin), Comparer en icône (D2).
const entreeD2 = () => `${tete()}${onglets(['Articles', 'Recompter', 'Courses', 'Fûts', 'Matériel'], 'Articles')}
<div style="margin:6px 10px 0" class="filt"><span class="rech" style="height:38px">${ic('search', 18)}<span>Rechercher…</span></span><span class="o" style="width:38px;height:38px">${ic('balance', 19)}</span></div>
<div class="filt" style="margin:5px 10px 0">${pills()}<span class="o" style="width:34px;height:34px;margin-left:auto">${ic('star', 17)}</span></div>
<div class="seg clair" style="margin:6px 10px 0;padding:2px"><span class="on" style="height:32px">Ingrédients</span><span style="height:32px">Autres stocks</span></div>`;
const CSS_D2 = '.pl{height:30px}.tabs span{height:34px}';

// D2a : le mur est l'en-tête de la liste. Toucher un rayon montre ses seuls articles ; le tri en pastille sur la même ligne.
const barreRayon = (nom, n, tri, pic) => `<div class="d2a-b"><span>${ic(pic, 16)} <b>${nom}</b> <span class="mono">${n}</span></span><span class="chip">${ic('sort', 14)} ${tri}</span><span class="mono ech">0 · 1 · <b>5 kg</b> ⫽ 200</span></div>`;
const CSS_D2A = `.d2a-b{display:flex;align-items:center;gap:6px;margin:4px 10px 0;padding:4px 0;border-bottom:2px solid #b88a4a;font-size:15px}.d2a-b .ech{margin-left:auto;font-size:13px;color:var(--mut)}
.mur .ray.actif::after{content:"";position:absolute;left:50%;bottom:-8px;width:14px;height:14px;background:#fff;transform:rotate(45deg);border-right:2px solid var(--rc);border-bottom:2px solid var(--rc);z-index:2}`;
V['d2a-repos-660'] = () => page('D2a', `${entreeD2()}${mur({ actif: 'malt', lien: true })}${barreRayon('Malts', NM, 'couleur', 'grain')}${listeMalts(6)}${fab()}${navBas()}`, 'h660', CSS_D2 + CSS_D2A);
V['d2a-houblons-660'] = () => page('D2a Houblons', `${entreeD2()}${mur({ actif: 'houblon', lien: true })}${barreRayon('Houblons', NH, 'α', 'cone').replace('0 · 1 · <b>5 kg</b> ⫽ 200', '0 · 100 · <b>250 g</b> ⫽ 1 kg')}${listeHops(6)}${fab()}${navBas()}`, 'h660', CSS_D2 + CSS_D2A + '.li .jauge i{background:#7f8a5e}');

// D2b : le mur mince. Trois lignes de 38 px, pictos au lieu des noms ; une seule bande collante tient rayon, tri et échelle.
V['d2b-repos-660'] = () => page('D2b', `${entreeD2()}${mur({ mince: true })}
<div class="d2b-s"><span class="pic">${ic('grain', 16)}</span><b>Malts</b><span class="chip">${ic('sort', 14)} couleur</span><span class="mono ech">0 1 <b>5 kg</b> ⫽ 200</span>${ic('info', 18)}</div>
${listeMalts(7)}${fab()}${navBas()}`, 'h660', CSS_D2 + `.d2b-s{display:flex;align-items:center;gap:6px;margin:6px 10px 0;padding:3px 0;border-bottom:2px solid #b88a4a;font-size:16px}.d2b-s .pic{color:#9a6a2a}.d2b-s .ech{margin-left:auto;font-size:13px;color:var(--mut)}`);
V['d2b-houblons-660'] = () => page('D2b Houblons défilé', `${tete()}${onglets(['Articles', 'Recompter', 'Courses', 'Fûts', 'Matériel'], 'Articles')}${mur({ mince: true, cls: 'colle' })}
<div class="d2b-s"><span class="pic">${ic('cone', 16)}</span><b>Houblons</b><span class="chip">${ic('sort', 14)} α</span><span class="mono ech">0 100 <b>250 g</b> ⫽ 1 kg</span>${ic('info', 18)}</div>
${listeHops(9)}${fab()}${navBas()}`, 'h660', CSS_D2 + `.d2b-s{display:flex;align-items:center;gap:6px;margin:6px 10px 0;padding:3px 0;border-bottom:2px solid #6f9435;font-size:16px}.d2b-s .pic{color:#5b7d2a}.d2b-s .ech{margin-left:auto;font-size:13px;color:var(--mut)}.colle{box-shadow:0 6px 10px -6px rgba(0,0,0,.35)}.li .jauge i{background:#7f8a5e}`);

// D2c : le mur seul. Sous lui, seulement ce qui demande un geste ; la liste entière derrière une ligne.
const agir = [
  { ...MALTS[0].l[3], sorte: 'malt', dit: 'manque 0,8 kg · IPA S49' },
  { ...HOPS[0].l[6], sorte: 'houblon', dit: 'à compter' },
  { ...HOPS[0].l[2], sorte: 'houblon', dit: 'épuisé · NEIPA S50' },
  { ...MALTS[2].l[2], sorte: 'malt', dit: 'épuisé · Stout S51' },
];
const ligneAgir = (a) => `<div class="li"><span class="jauge${a.c ? ' cpt' : ''}"><i style="height:${a.q ? 30 : 0}%;background:${a.sorte === 'malt' ? '#a97b3c' : '#7f8a5e'}"></i></span><span class="d2c-p">${ic(a.sorte === 'malt' ? 'grain' : 'cone', 18)}</span><div class="nm"><b>${a.n}</b><small class="${a.c ? '' : a.q ? 'brun' : 'rouge'}">${a.dit}</small></div><span class="qt mono">${a.c ? '1 Pck' : a.sorte === 'malt' ? kg(a.q) : a.q + ' g'}</span><span class="et">${ic('cart', 20)}</span></div>`;
const CSS_D2C = `.d2c-h{display:flex;align-items:center;gap:8px;margin:8px 12px 2px;font-size:16px}.d2c-h b{font-size:17px}.d2c-h .n{background:#111;color:#fff;border-radius:999px;padding:0 8px;font-size:14px}
.d2c-p{color:#8b7350}.tout{display:flex;align-items:center;justify-content:space-between;margin:0 12px;height:46px;font-size:16px;font-weight:600;color:var(--ink);border-bottom:1px solid var(--line)}`;
V['d2c-repos-660'] = () => page('D2c', `${entreeD2()}${mur({ lien: true, legende: true })}
<div class="d2c-h"><b>À faire</b><span class="n mono">4</span></div>${agir.slice(0, 3).map(ligneAgir).join('')}<div class="tout">Tout lister · ${NM + NH + NY} articles ${ic('chevR', 18)}</div>${fab()}${navBas()}`, 'h660', CSS_D2 + CSS_D2C);
const bulleCitra = `<div class="d2c-bu"><span class="jauge" style="width:14px;height:36px;border:1.5px solid #8b7a5a;border-radius:2px;display:flex;align-items:flex-end"><i style="display:block;width:100%;height:95%;background:#7f8a5e"></i></span><div class="nm"><b style="font-weight:700">Citra</b><small>α 12,5 % · seuil 250 g · Hazy</small></div><span class="qt mono" style="font-size:20px">485 g</span><span class="o" style="width:40px;height:40px">${ic('chevR', 20)}</span></div>`;
V['d2c-bulle-660'] = () => page('D2c touché', `${entreeD2()}${mur({ lien: true, legende: true, sel: 'Citra', entre: { houblon: bulleCitra } })}
<div class="d2c-h"><b>À faire</b><span class="n mono">4</span></div>${agir.slice(0, 3).map(ligneAgir).join('')}${fab()}${navBas()}`, 'h660', CSS_D2 + CSS_D2C + `.mur{position:relative}.d2c-bu{display:flex;align-items:center;gap:8px;background:#fff;border:2px solid #111;border-radius:10px;margin:0;left:6px;right:6px;padding:3px 6px 3px 10px;position:absolute;z-index:3;box-shadow:0 8px 18px rgba(0,0,0,.22)}.d2c-bu::before{content:"";position:absolute;top:-8px;left:84px;width:12px;height:12px;background:#fff;border-left:2px solid #111;border-top:2px solid #111;transform:rotate(45deg)}`);

// D3 : légende et 1280.
const LEG = [
  ['<span class="lg-s"><i style="height:16px;background:#cf8a35"></i><u></u></span>', 'seuil'],
  ['<span class="lg-s"><i class="lg-ep"></i></span>', 'épuisé'],
  ['<span class="lg-s"><i style="height:16px;border:2px dotted #333;border-bottom:0"></i></span>', 'à compter'],
  ['<span class="lg-s lg-y"><i></i><i></i><i class="k">U</i></span>', 'sachets'],
];
const CSS_LEG = `.lg-s{display:inline-flex;align-items:flex-end;width:14px;height:20px;position:relative;border-bottom:2px solid #9c8a6b}
.lg-s i{display:block;width:10px;margin:0 2px}.lg-s u{position:absolute;left:-3px;right:-3px;bottom:9px;border-top:1.5px dashed #555}
.lg-s .lg-ep{height:8px;border:1.5px solid var(--rouge);background:#fff}
.lg-y{flex-direction:column;justify-content:flex-end;align-items:center;gap:1px}.lg-y i{height:5px;background:#b59a6a;border-radius:2px}.lg-y i.k{height:12px;width:12px;background:#6e5530;color:#fff;font:700 12px/12px system-ui;text-align:center;font-style:normal}`;
const bandeLeg = () => `<div class="d3a-l">${LEG.map(([s, t]) => `<span>${s}${t}</span>`).join('')}</div>`;
V['d3a-repos'] = () => page('D3a', `${entreeD2()}${mur({ lien: true, apres: bandeLeg() })}
${enteteGroupe('Malts', NM, 'grain', `<span class="chip">${ic('sort', 14)} couleur</span>`)}${echelleMalt}${listeMalts(4)}${fab()}${navBas()}`, '', CSS_D2 + CSS_LEG + `.d3a-l{display:flex;justify-content:space-around;align-items:flex-end;padding:6px 4px 5px;border-top:1px solid #e4e1d8;font-size:14px;color:#333}.d3a-l>span{display:flex;align-items:flex-end;gap:5px}`);

const bulleLeg = () => `<div class="bulle d3b-bu">${LEG.map(([s, t]) => `<div>${s}<span>${t}</span></div>`).join('')}<div><span class="d3b-h mono">⫽</span><span>échelle resserrée</span></div></div>`;
V['d3b-legende'] = () => page('D3b légende', `${entreeD2()}${mur({ lien: true, avant: `<span class="o on d3b-q">${ic('help', 20)}</span>` })}${bulleLeg()}
${enteteGroupe('Malts', NM, 'grain', `<span class="chip">${ic('sort', 14)} couleur</span>`)}${echelleMalt}${listeMalts(4)}${fab()}${navBas()}`, '', CSS_D2 + CSS_LEG + `.mur{position:relative}.d3b-q{position:absolute;right:4px;top:4px;width:36px;height:36px;z-index:3}
.d3b-bu{top:276px;right:12px;width:200px;display:flex;flex-direction:column;gap:7px;font-size:15px}.d3b-bu>div{display:flex;align-items:flex-end;gap:10px}.d3b-bu::before{content:"";position:absolute;top:-8px;right:14px;width:12px;height:12px;background:#fff;border-left:1.5px solid #111;border-top:1.5px solid #111;transform:rotate(45deg)}.d3b-h{width:14px;text-align:center;font-weight:700}`);

// 1280 : rail à gauche (comme l'app), tout le reste de la largeur au stock.
const RAIL = `<aside class="rail">${NAV.map(([k, t]) => `<span class="${t === 'Stocks' ? 'on' : ''}">${ic(k, 22)}${t}</span>`).join('')}</aside>`;
const CSS_1280 = `body.l1280 header.app{height:46px}.rail{position:absolute;left:0;top:46px;bottom:0;width:86px;border-right:1px solid var(--line);display:flex;flex-direction:column;gap:6px;padding-top:12px}
.rail span{display:flex;flex-direction:column;align-items:center;font-size:14px;color:#333;padding:6px 0}.rail span.on{background:#e8eddf;font-weight:700;border-radius:12px;margin:0 8px}
.zone{position:absolute;left:96px;right:14px;top:52px;bottom:0}
.zone .tabs{margin:0}.barre{display:flex;align-items:center;gap:8px;margin-top:8px}.barre .rech{max-width:420px}
.d3-col{display:grid;gap:10px;margin-top:8px}
.tb{width:100%;border-collapse:collapse;font-size:15px}.tb th{font-weight:600;font-size:14px;color:var(--mut);text-align:left;padding:4px 6px;border-bottom:1px solid var(--line)}
.tb td{padding:6px;border-bottom:1px solid var(--line);white-space:nowrap}.tb td.q{font-family:Consolas,monospace;text-align:right;font-size:16px}
.tb .bar{display:block;height:14px;border-radius:2px;background:#e9dcc6;position:relative}.tb .bar i{position:absolute;left:0;top:0;bottom:0;background:#c9a36a;border-radius:2px}
.tb .bar u{position:absolute;top:-3px;bottom:-3px;border-left:2px dashed #555}`;
const ligneTb = (a, sorte, max) => {
  const q = sorte === 'malt' ? a.q : a.q / 1000, s = a.s ? (sorte === 'malt' ? a.s : a.s / 1000) : null;
  return `<tr><td>${a.n}${!a.q ? ' <span class="rouge" style="font-size:14px">épuisé</span>' : a.c ? ' <span class="pt" style="font-size:14px">à compter</span>' : ''}</td><td class="mono" style="font-size:14px">${sorte === 'malt' ? `<span class="pt-e" style="width:9px;height:9px;border-radius:50%;display:inline-block;background:${ebcCoul(a.e)}"></span> ${fr(a.e)}` : `α ${fr(a.a)}`}</td><td class="q">${a.c ? '1 Pck' : sorte === 'malt' ? kg(a.q) : a.q + ' g'}</td><td style="width:40%"><span class="bar"><i style="width:${Math.min(100, (q / max) * 100)}%"></i>${s ? `<u style="left:${(s / max) * 100}%"></u>` : ''}</span></td></tr>`;
};
const tete1280 = () => `<header class="app"><span class="logo">A</span><span class="marque">L'Affinée</span><span class="mois"><span>${ic('chevL', 18)}</span><span class="m">Nov.</span><span>${ic('chevR', 18)}</span></span><span class="rnd">${ic('search', 18)}</span><span class="av"><b>G</b><b>A</b></span></header>`;
const barre1280 = () => `${onglets(['Articles', 'Recompter', 'Courses', 'Fûts', 'Matériel'], 'Articles')}<div class="barre"><span class="rech">${ic('search', 18)}<span>Rechercher : nom, fournisseur…</span></span><span class="o">${ic('balance', 20)}</span>${pills()}<span class="o">${ic('star', 18)}</span><span class="seg clair" style="margin-left:auto;width:300px"><span class="on">Ingrédients</span><span>Autres stocks</span></span></div>`;

// D3a 1280 : les trois rayons côte à côte, pleine largeur ; une liste par rayon dessous, sans colonne vide.
V['d3a-1280'] = () => page('D3a 1280', `${tete1280()}${RAIL}<div class="zone">${barre1280()}
<div class="d3-col" style="grid-template-columns:1.12fr 1fr 1.05fr">
<div class="mur d3a-m grand">${rayon('Malts', NM, 'malt', MALTS, { w: 12, bh: 50 })}</div><div class="mur d3a-m grand">${rayon('Houblons', NH, 'houblon', HOPS, { w: 10, lien: true, bh: 50 })}</div><div class="mur d3a-m grand">${rayon('Levures', NY, 'levure', YEASTS, { w: 10, bh: 50 })}</div>
<div style="grid-column:1/-1">${bandeLeg()}</div>
<div><table class="tb"><tr><th>Malts</th><th>EBC</th><th style="text-align:right">stock</th><th>0 — 5 kg ⫽ 25</th></tr>${triMalts().slice(0, 9).map((a) => ligneTb(a, 'malt', 26)).join('')}</table></div>
<div><table class="tb"><tr><th>Houblons</th><th>α</th><th style="text-align:right">stock</th><th>0 — 500 g</th></tr>${triHops().slice(0, 9).map((a) => ligneTb(a, 'houblon', 0.5)).join('')}</table></div>
<div><table class="tb"><tr><th>Levures</th><th>sachets</th><th>DDM</th></tr>${YEASTS.flatMap((g) => g.l).map((a) => `<tr><td>${a.n}${a.q ? '' : ' <span class="rouge" style="font-size:14px">épuisé</span>'}</td><td class="mono">${'▮'.repeat(a.q) || '0'}</td><td class="mono" style="font-size:14px">${a.q ? '03.27' : '—'}</td></tr>`).join('')}</table></div>
</div></div>${fab()}`, 'l1280', CSS_1280 + CSS_LEG + `.d3a-m{margin:0}.d3a-m .ray{min-height:86px;border-bottom:0}.d3a-m .bars{height:50px}.d3a-m .bars::before{bottom:31px!important}.d3a-m .rl{width:64px}.d3a-m .g em{line-height:15px}.d3a-m .tot{font-size:13px;line-height:16px}.d3a-l{display:flex;gap:28px;justify-content:center;align-items:flex-end;font-size:14px;color:#333;padding:2px 0}.d3a-l>span{display:flex;align-items:flex-end;gap:6px}.tb tr:first-child th:first-child{font-size:16px;color:#111}`);

// D3b 1280 : le mur en colonne collante à gauche, la liste à droite ; légende au rond « ? ».
V['d3b-1280'] = () => page('D3b 1280', `${tete1280()}${RAIL}<div class="zone">${barre1280()}
<div class="d3-col" style="grid-template-columns:470px 1fr;align-items:start">
<div style="position:relative">${mur({ lien: true, w: 10, bh: 48, cls: 'grand', avant: `<span class="o d3b-q">${ic('help', 20)}</span>` })}</div>
<div><div class="gh" style="margin:0 0 4px"><span class="pic">${ic('grain', 18)}</span><b>Malts</b><small class="mono">${NM}</small><span class="dr"><span class="chip">${ic('sort', 14)} couleur</span><span class="chip">Brau- und Rauchshop</span></span></div>
<table class="tb"><tr><th>Article</th><th>EBC</th><th style="text-align:right">en stock</th><th>0 — 5 kg ⫽ 25 kg</th></tr>${triMalts().slice(0, 13).map((a) => ligneTb(a, 'malt', 26)).join('')}</table></div>
</div></div>${fab()}`, 'l1280', CSS_1280 + `.mur{margin:0;position:relative}.d3b-q{position:absolute;right:6px;top:6px;width:36px;height:36px;z-index:3}.mur .ray{min-height:90px}.mur .bars{height:48px}.mur .bars::before{bottom:30px!important}.mur .g em{line-height:15px}.mur .tot{font-size:13px;line-height:16px}`);

// D8 : Matériel et Fûts.
const MAT = [
  { n: 'Fermenteur 120 L', p: 'ferm', prix: '900 CHF', d: 'Parc' },
  { n: 'Cuve de brassage 70 L', p: 'pot', prix: '1 450 CHF', d: 'Parc' },
  { n: 'Refroidisseur à plaques', p: 'snow', prix: '?', d: 'Parc' },
  { n: 'Pompe magnétique', p: 'pump', prix: '160 CHF', d: 'Parc' },
];
const FUTS = { 'Pleins': ['#d9a23a', [['K1', 'IPA', 20], ['K4', 'NEIPA', 20], ['K7', 'Stout', 30]]], 'Livrés': ['#2b64a6', [['K2', 'Café du Pont', 20]]], 'À laver': ['#b3261e', [['K3', '', 20], ['K5', '', 30]]], 'Propres': ['#3f6b2e', [['K6', '', 20], ['K8', '', 20]]] };
const keg = (col, t, plein = 1, s = 1) => `<svg width="${30 * s}" height="${40 * s}" viewBox="0 0 30 40" aria-hidden="true"><rect x="2" y="4" width="26" height="34" rx="6" fill="${plein ? col : '#fff'}" stroke="${col}" stroke-width="2.5"/><path d="M2 14h26M2 28h26" stroke="${plein ? '#fff' : col}" stroke-width="2" opacity=".7"/><rect x="11" y="0.5" width="8" height="4" rx="1" fill="${col}"/>${t ? `<text x="15" y="25" text-anchor="middle" font-size="9" font-weight="700" fill="${plein ? '#fff' : col}" font-family="system-ui">${t}</text>` : ''}</svg>`;
const segMat = (a = 'Parc') => `<div class="seg" style="margin:8px 10px 0"><span class="${a === 'Parc' ? 'on' : ''}">Parc <span class="n mono">4</span></span><span>À venir <span class="n mono">1</span></span><span style="color:#aaa">Carnets</span><span style="color:#aaa">Réalisés</span></div>`;
const CSS_D8 = `.m-l{display:flex;align-items:center;gap:10px;min-height:58px;margin:0 10px;border-bottom:1px solid var(--line);padding:4px 2px}
.m-l .pi{width:42px;height:42px;border-radius:10px;background:#eef1f4;color:#4a5e72;display:grid;place-items:center}
.m-l .pr{font-family:Consolas,monospace;font-size:16px;color:#111}.m-l .pr.inc{color:#999;border-bottom:2px dotted #999}
.m-h{display:flex;align-items:center;gap:8px;margin:10px 12px 2px;font-size:15px;color:var(--mut)}.m-h b{color:#111;font-size:17px}`;
V['d8a-materiel'] = () => page('D8a Matériel', `${tete()}${onglets(['Articles', 'Recompter', 'Courses', 'Fûts', 'Matériel'], 'Matériel')}${segMat()}
<div class="m-h"><b>Parc</b><span class="mono">2 515 CHF</span><span style="margin-left:auto;display:flex;gap:8px"><span class="o">${ic('search', 18)}</span><span class="o">${ic('cart', 18)}</span></span></div>
${MAT.map((m) => `<div class="m-l"><span class="pi">${ic(m.p, 24)}</span><div class="nm"><b style="white-space:nowrap">${m.n}</b><small>${ic('wrench', 13)} 2 projets</small></div><span class="pr${m.prix === '?' ? ' inc' : ''}">${m.prix}</span>${ic('chevR', 18)}</div>`).join('')}
<div class="m-h" style="margin-top:14px"><b>À venir</b><span class="mono">1</span></div>
<div class="m-l"><span class="pi" style="background:#f6ecd8;color:#8a5212">${ic('snow', 24)}</span><div class="nm"><b>Chambre froide</b><small>carnet · 3 façons</small></div><span class="pr">dès 3 350</span>${ic('chevR', 18)}</div>
${fab()}${navBas()}`, '', CSS_D8 + '.seg>span{font-size:14px}');

V['d8a-futs'] = () => page('D8a Fûts', `${tete()}${onglets(['Articles', 'Recompter', 'Courses', 'Fûts', 'Matériel'], 'Fûts')}
<div class="f-t">${Object.entries(FUTS).map(([t, [c, l]], i) => `<span class="${i === 0 ? 'on' : ''}" style="--c:${c}">${keg(c, '', t !== 'Propres' && t !== 'À laver' ? 1 : 0)}<b class="mono">${l.length}</b><small>${t}</small></span>`).join('')}</div>
${Object.entries(FUTS).map(([t, [c, l]]) => l.map(([k, b, v]) => `<div class="m-l" style="border-left:4px solid ${c};padding-left:8px">${keg(c, k, t === 'Pleins' || t === 'Livrés' ? 1 : 0)}<div class="nm"><b>${k} · ${v} L</b><small>${b || t}${t === 'Pleins' ? ' · depuis 12.11' : t === 'Livrés' ? ' · 03.11' : ''}</small></div><span class="chip" style="background:#fff;border:1.5px solid ${c};color:${c}">${t === 'Pleins' ? 'Livrer' : t === 'Livrés' ? 'Retour' : t === 'À laver' ? 'Lavé' : 'Remplir'}</span></div>`).join('')).join('')}
${fab()}${navBas()}`, '', CSS_D8 + `.f-t{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:8px 10px 6px}.f-t span{display:flex;flex-direction:column;align-items:center;gap:1px;border:1.5px solid var(--line2);border-radius:12px;padding:6px 0 4px}.f-t span.on{border:2.5px solid var(--c);background:#fbf6ea}.f-t b{font-size:22px;color:var(--c)}.f-t small{font-size:14px;color:#333}`);

// D8b : vue d'ensemble. Matériel en tuiles à picto ; Fûts en râtelier (l'idée de l'étagère, pour les fûts).
V['d8b-materiel'] = () => page('D8b Matériel', `${tete()}${onglets(['Articles', 'Recompter', 'Courses', 'Fûts', 'Matériel'], 'Matériel')}${segMat()}
<div class="t-g">${MAT.map((m) => `<div class="t"><span class="pi">${ic(m.p, 34)}</span><b>${m.n}</b><span class="pr${m.prix === '?' ? ' inc' : ''}">${m.prix}</span></div>`).join('')}<div class="t a"><span class="pi" style="background:#f6ecd8;color:#8a5212">${ic('snow', 34)}</span><b>Chambre froide</b><span class="pr">à venir</span></div><div class="t plus">${ic('cart', 26)}<b>Achat</b></div></div>${fab()}${navBas()}`, '', `.t-g{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px}
.t{border:1.5px solid var(--line2);border-radius:14px;padding:10px;display:flex;flex-direction:column;gap:4px;min-height:132px}.t .pi{width:54px;height:54px;border-radius:12px;background:#eef1f4;color:#4a5e72;display:grid;place-items:center}
.t b{font-size:16px;color:#111;font-weight:600}.t .pr{font-family:Consolas,monospace;font-size:16px;margin-top:auto}.t .pr.inc{color:#999}.t.a{border-style:dashed}.t.plus{align-items:center;justify-content:center;color:#555;border-style:dashed;background:var(--s1)}.seg>span{font-size:14px}`);

V['d8b-futs'] = () => page('D8b Fûts', `${tete()}${onglets(['Articles', 'Recompter', 'Courses', 'Fûts', 'Matériel'], 'Fûts')}
<div class="ra">${Object.entries(FUTS).map(([t, [c, l]]) => `<div class="ra-c"><div class="ra-k">${l.map(([k]) => keg(c, k, t === 'Pleins' || t === 'Livrés' ? 1 : 0, 1.25)).join('')}</div><div class="ra-s" style="border-color:${c}"></div><b style="color:${c}">${t} <span class="mono">${l.length}</span></b></div>`).join('')}</div>
<div class="ra-leg"><span>${keg('#555', '', 1, 0.6)} plein</span><span>${keg('#555', '', 0, 0.6)} vide</span><span class="mono">20 L · 30 L</span></div>
<div class="m-h"><b>Pleins</b><span class="mono">3</span></div>
${FUTS.Pleins[1].map(([k, b, v]) => `<div class="m-l">${keg('#d9a23a', k, 1)}<div class="nm"><b>${b} · ${v} L</b><small>${k} · rempli le 12.11</small></div><span class="chip" style="background:#fff;border:1.5px solid #d9a23a;color:#8a5212">${ic('truck', 16)} Livrer</span></div>`).join('')}
${fab()}${navBas()}`, '', CSS_D8 + `.ra{display:grid;grid-template-columns:1.4fr .8fr 1fr 1fr;gap:6px;margin:10px 10px 0;background:var(--mur);border-radius:12px;padding:12px 8px 8px}
.ra-c{display:flex;flex-direction:column;align-items:center}.ra-k{display:flex;align-items:flex-end;justify-content:center;gap:2px;min-height:52px;flex-wrap:wrap}.ra-s{align-self:stretch;border-bottom:3px solid;margin:2px 0 4px}.ra-c b{font-size:14px;white-space:nowrap}
.ra-leg{display:flex;gap:16px;justify-content:center;align-items:center;font-size:14px;color:var(--mut);margin:6px 0 0}.ra-leg span{display:flex;align-items:center;gap:4px}`);

let k = 0;
for (const [id, f] of Object.entries(V)) { fs.writeFileSync(path.join(ICI, `st1-${id}.html`), f()); k++; }
console.log(`${k} pages écrites`);
