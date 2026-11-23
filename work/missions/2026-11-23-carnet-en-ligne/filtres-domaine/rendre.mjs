// Rend les mini maquettes statiques de la page « filtres par domaine » du Carnet (img/*.png, 390 px, ×2).
// Bandeau du haut et barre du bas : recadrés des captures en ligne du tour 12 (M1-01, M1-02). Liste : ses 20 vrais carnets
// (19 du Planning, fixture scripts/planning-vers-carnet/fixture-planning.json, et Chambre froide). Rien n'est écrit hors de ce dossier.
//   node work/missions/2026-11-23-carnet-en-ligne/filtres-domaine/rendre.mjs
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const url = (f) => 'file:///' + f.split(path.sep).join('/');
const F_A = path.join(ICI, '..', 'M1', 'captures', '01-carnet-liste-repos.png');
const CAP_A = url(F_A);
const CAP_B = url(path.join(ICI, '..', 'M4', '01-liste-fin-390x844.png'));
const CAP_C = url(path.join(ICI, '..', 'M1', 'captures', '02-chambre-froide-lecture.png'));
const IMG = path.join(ICI, 'img');
fs.mkdirSync(IMG, { recursive: true });

// Pictos des domaines (24 × 24, trait).
const P = {
  Local: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9v12h14V9"/><path d="M10 21v-6h4v6"/>',
  Brasserie: '<path d="M6 5a6 2 0 0 1 12 0v7l-6 5.5L6 12z"/><path d="M6 12v10M18 12v10"/><path d="M12 17.5V21"/>',
  Meuble: '<rect x="5" y="2.5" width="14" height="17" rx="1.5"/><path d="M12 2.5v17"/><path d="M10 10v2.5M14 10v2.5"/><path d="M6.5 19.5V22M17.5 19.5V22"/>',
  Outils: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
  Papiers: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8M10 9H8"/>',
};
const COUL = { Local: '#b5532d', Brasserie: '#2e6fa3', Meuble: '#8b5e34', Outils: '#555', Papiers: '#6b4fa0', Tous: '#1d1d1d' };
const picto = (d, t = 18, c = COUL[d]) => d === 'Tous' ? '' : `<svg class="pi" width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${P[d]}</svg>`;
const CAL = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4c6b2e" stroke-width="2" stroke-linecap="round"><rect x="3" y="4.5" width="18" height="16.5" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/><path d="m9 15 2 2 4-4"/></svg>';
const LOUPE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
const CHEV_D = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#444" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>';
const CHEV_B = CHEV_D.replace('m9 6 6 6-6 6', 'm6 9 6 6 6-6');
const COCHE = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#777" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';

// Ses 20 carnets. ic : vignette vue en ligne [capture, y] ; sinon une lettre (vignette non vue sur les captures).
export const CARNETS = [
  { n: 20, t: 'Chambre froide', d: 'Brasserie', e: 'À comparer', sous: '2 articles', ic: ['A', 247] },
  { n: 1, t: 'Sol, murs & évacuation (béton, revêtement, peinture food-safe)', d: 'Local', e: 'Fait', ic: ['B', 405] },
  { n: 2, t: 'Rangement / étagères inox & déménagement', d: 'Meuble', e: 'Fait', ic: ['B', 455] },
  { n: 3, t: 'Robinetterie & tuyaux raccords (fait par soi-même)', d: 'Local', e: 'Fait', ic: ['B', 503] },
  { n: 4, t: 'Achat & installation évier principal + douchette', d: 'Local', e: 'Fait', ic: ['B', 552] },
  { n: 5, t: 'Refaire évier — bloqué (attendre vis pieds)', d: 'Local', e: 'Fait', ic: ['B', 601] },
  { n: 6, t: 'Sol — matières premières + outils (peut faire en 2x)', d: 'Local', e: 'Idée', ic: ['A', 350] },
  { n: 7, t: 'Achat brasserie : moulin à malt + bac etc.', d: 'Brasserie', e: 'Idée', ic: ['A', 399], av: 1 },
  { n: 8, t: 'Frigo + congel', d: 'Brasserie', e: 'Idée', ic: ['A', 491], av: 1 },
  { n: 9, t: 'Armoire de rangement malte', d: 'Meuble', e: 'Idée', ic: ['A', 584], av: 1 },
  { n: 10, t: 'Conformité — dossiers SAAV + SEn + assurances', d: 'Papiers', e: 'Idée', ic: ['A', 677] },
  { n: 11, t: 'Hotte recyclage', d: 'Local', e: 'Idée' },
  { n: 12, t: 'Armoire de rangement extérieur', d: 'Meuble', e: 'Idée' },
  { n: 13, t: 'Armoire de rangement toxique', d: 'Meuble', e: 'Idée' },
  { n: 14, t: 'Extincteur', d: 'Local', e: 'Idée' },
  { n: 15, t: 'Installation électrique 27A (2027)', d: 'Local', e: 'Idée' },
  { n: 16, t: 'Embouteillage — station complète (2027)', d: 'Brasserie', e: 'Idée', av: 1 },
  { n: 17, t: '2ème évier (2027)', d: 'Local', e: 'Idée', ic: ['B', 203] },
  { n: 18, t: 'Jalon — Peut brasser au local (sans autorisation vente)', d: 'Local', e: 'Idée', ic: ['B', 252] },
  { n: 19, t: 'Jalon — Conformité complète — Peut vendre officiellement', d: 'Papiers', e: 'Idée', ic: ['B', 301] },
];
const nb = (d) => d === 'Tous' ? CARNETS.length : CARNETS.filter((c) => c.d === d).length;
const vign = (c) => c.ic
  ? `<div class="vg" style="background:url('${c.ic[0] === 'A' ? CAP_A : CAP_B}') -33px -${c.ic[1] - 1}px / 390px 844px"></div>`
  : `<div class="vg lettre">${c.t[0]}</div>`;
const ligne = (c, { marque = '' } = {}) => `<div class="ln${c.e === 'Fait' && marque ? ' fait' : ''}">${vign(c)}<div class="tx"><div class="ti">${c.t}</div>${c.sous ? `<div class="so">${c.sous}</div>` : ''}</div>${marque}</div>`
  + (c.av ? `<div class="av">${CAL}<span>Dans À venir depuis le<br>20 nov.</span><b>Voir ›</b></div>` : '');
const PAS_ARTICLE = 'pas encore d’article';
const section = (etat, liste, droite = '') => liste.length ? `<div class="se"><span class="pil">${etat === 'Fait' ? COCHE + ' Faits' : etat} <b>${liste.length}</b></span><span class="dr">${droite}</span></div><div class="carte">${liste.map((c) => ligne(c)).join('')}</div>` : '';
const parEtat = (liste) => ['À comparer', 'Choisi', 'Idée', 'Fait'].map((e) => section(e, liste.filter((c) => c.e === e), e === 'Fait' ? 'du Planning' : e === 'Idée' ? PAS_ARTICLE : '')).join('');
const puce = (d, actif, { compte = true, cls = '' } = {}) => `<span class="pu ${actif ? 'on' : ''} ${cls}">${picto(d, 17, actif ? '#fff' : COUL[d])}${d}${compte ? ` <i>${nb(d)}</i>` : ''}</span>`;

const CSS = `
*{box-sizing:border-box}body{margin:0}
.ecran{width:390px;height:844px;position:relative;overflow:hidden;background:#f7f6f3;font-family:"Source Sans 3","Segoe UI",system-ui,sans-serif;color:#1d1d1d}
.haut{position:absolute;top:0;left:0;width:390px;height:150px;background:url('${CAP_A}') 0 0/390px 844px;z-index:2}
.bas{position:absolute;left:0;bottom:0;width:390px;height:118px;background:url('${CAP_A}') 0 -726px/390px 844px;z-index:2}
.mil{position:absolute;top:150px;left:0;right:0;bottom:0;padding:4px 24px 0 24px}
.rang{display:flex;gap:7px;white-space:nowrap;overflow:hidden;margin:2px -24px 0 -24px;padding:3px 24px;-webkit-mask-image:linear-gradient(90deg,#000 88%,transparent)}
.pu{display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 13px;border:1px solid #d6d3cb;border-radius:999px;background:#fff;font-size:15px;font-weight:600;color:#2a2a2a;flex:none}
.pu i{font-style:normal;font-weight:700;font-size:14px;color:#555;background:#eeece6;border-radius:999px;padding:0 7px;line-height:20px}
.pu.on{background:#161616;border-color:#161616;color:#fff}.pu.on i{background:#3d3d3d;color:#fff}
.pu.cherche{color:#8a8a8a;font-weight:400}
.se{display:flex;justify-content:space-between;align-items:center;margin:12px 0 8px}
.pil{display:inline-flex;align-items:center;gap:6px;background:#e7ecdf;color:#3f5f2f;font-weight:700;font-size:16px;border-radius:999px;padding:4px 13px}
.pil b{font-weight:700;margin-left:2px}
.dr{color:#777;font-size:15px}
.carte{background:#fff;border:1px solid #e2dfd8;border-radius:14px;overflow:hidden}
.ln{display:flex;align-items:center;gap:9px;min-height:48px;padding:5px 12px 5px 10px;border-top:1px solid #ebe8e2}
.carte>.ln:first-child,.dom>.ln:first-of-type{border-top:0}
.vg{width:37px;height:37px;flex:none;border-radius:8px;overflow:hidden}
.vg.lettre{display:grid;place-items:center;background:#e9edf0;color:#2a2a2a;font-weight:700;font-size:18px}
.tx{min-width:0;flex:1}.ti{font-size:15.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.so{font-size:14px;color:#666}
.av{display:grid;grid-template-columns:22px 1fr auto;align-items:center;gap:8px;padding:6px 14px 6px 70px;border-top:1px dashed #d9d6ce;color:#4c6b2e;font-weight:600;font-size:15px;line-height:1.25}
.av b{color:#333;font-weight:600}
.anneau{outline:2.5px dashed #e0287d;outline-offset:3px;border-radius:12px}
.ln.fait{opacity:.62}.marque{font-size:14px;color:#3f5f2f;background:#e7ecdf;border-radius:999px;padding:1px 9px;font-weight:600;flex:none}
.marque.gris{background:#efede8;color:#666;display:inline-flex;gap:3px;align-items:center}
`;

const ecran = (corps, extra = '') => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>${CSS}${extra}</style></head><body><div class="ecran"><div class="haut"></div><div class="mil">${corps}</div><div class="bas"></div></div></body></html>`;

// A — une rangée de puces de domaines, avec leur nombre ; Local touché.
const domaines = ['Local', 'Brasserie', 'Meuble', 'Papiers'];
const rangDomaines = (actif, { anneau = true, decale = 0 } = {}) => `<div class="rang${anneau ? ' anneau' : ''}"><span class="pu cherche" style="margin-left:-${decale}px">${LOUPE}</span>${puce('Tous', actif === 'Tous')}${domaines.map((d) => puce(d, d === actif)).join('')}</div>`;
const A = ecran(rangDomaines('Local') + parEtat(CARNETS.filter((c) => c.d === 'Local')));

// B — sections de domaines repliables, sans filtre.
const resume = (d) => { const l = CARNETS.filter((c) => c.d === d); const f = l.filter((c) => c.e === 'Fait').length; const i = l.length - f; return [i && `${i} ${i > 1 ? 'idées' : 'idée'}`, f && `${f} ${f > 1 ? 'faits' : 'fait'}`].filter(Boolean).join(' · '); };
const tete = (d, ouvert) => `<div class="dt">${picto(d, 22)}<span class="dn">${d}</span><i>${nb(d)}</i><span class="rs">${ouvert ? '' : resume(d)}</span><span class="chev">${ouvert ? CHEV_B : CHEV_D}</span></div>`;
const marque = (c) => c.e === 'À comparer' ? '<span class="marque">à comparer</span>' : c.e === 'Fait' ? `<span class="marque gris">${COCHE}fait</span>` : '';
const rangE = (c) => (c.e === 'À comparer' ? 0 : c.e === 'Fait' ? 2 : 1);
const domOuvert = (d) => { const l = CARNETS.filter((c) => c.d === d).sort((a, b) => rangE(a) - rangE(b)); return `<div class="dom ouvert">${tete(d, true)}${l.map((c) => ligne(c, { marque: marque(c) })).join('')}</div>`; };
const B = ecran(`<div class="rang" style="-webkit-mask-image:none"><span class="pu cherche" style="flex:1">${LOUPE}Chercher un carnet</span></div><div class="anneau" style="margin-top:12px">`
  + `<div class="dom">${tete('Local', false)}</div>` + domOuvert('Brasserie') + `<div class="dom">${tete('Meuble', false)}</div><div class="dom">${tete('Papiers', false)}</div></div>`,
`.dom{background:#fff;border:1px solid #e2dfd8;border-radius:14px;overflow:hidden;margin-bottom:9px}.dom.ouvert .dt{border-bottom:1px solid #ebe8e2}
.dt{display:flex;align-items:center;gap:9px;height:50px;padding:0 14px}.dn{font-size:17px;font-weight:700}
.dt i{font-style:normal;font-weight:700;font-size:14px;color:#555;background:#eeece6;border-radius:999px;padding:0 7px;line-height:20px}
.rs{flex:1;text-align:right;color:#666;font-size:15px}.chev{font-size:20px;color:#444;width:14px;text-align:center}`);

// C — un bouton « Domaine ▾ » ; fermé (Meuble posé) et feuille ouverte.
const rangC = (actif) => `<div class="rang" style="-webkit-mask-image:none"><span class="pu cherche" style="flex:1">${LOUPE}Chercher un carnet</span><span class="pu ${actif ? 'on' : ''} anneau">${actif ? picto(actif, 17, '#fff') + actif : 'Domaine'} ▾</span></div>`;
const listeC = parEtat(CARNETS.filter((c) => c.d === 'Meuble'));
const C1 = ecran(rangC('Meuble') + listeC);
const feuille = `<div class="voile"></div><div class="feuille"><div class="poignee"></div><div class="ft">Domaine</div>
${['Tous', ...domaines].map((d) => `<div class="fl ${d === 'Meuble' ? 'on' : ''}"><span class="fp">${d === 'Tous' ? '' : picto(d, 22)}</span><span class="fn">${d}</span><i>${nb(d)}</i><span class="fc">${d === 'Meuble' ? '✓' : ''}</span></div>`).join('')}
<div class="ft2">État</div><div class="etats">${['Tous', 'À comparer', 'Idée', 'Choisi', 'Fait'].map((e, i) => `<span class="pu ${i === 0 ? 'on' : ''}">${e}</span>`).join('')}</div></div>`;
const C2 = ecran(rangC('Meuble') + listeC, `.voile{position:absolute;inset:0;background:rgba(0,0,0,.38);z-index:5}
.feuille{position:absolute;left:0;right:0;bottom:0;z-index:6;background:#fff;border-radius:18px 18px 0 0;padding:8px 18px 22px;box-shadow:0 -6px 24px rgba(0,0,0,.2)}
.poignee{width:40px;height:5px;border-radius:9px;background:#d0cdc6;margin:2px auto 8px}.ft{font-size:19px;font-weight:700;margin:2px 4px 6px}
.ft2{font-size:16px;font-weight:700;margin:14px 4px 8px;color:#444}
.fl{display:flex;align-items:center;gap:12px;height:52px;padding:0 6px;border-top:1px solid #efece6;font-size:17px;font-weight:600}
.fl.on{background:#f3f1ec;border-radius:10px}.fp{width:24px}.fn{flex:1}
.fl i{font-style:normal;font-weight:700;font-size:14px;color:#555;background:#eeece6;border-radius:999px;padding:0 8px;line-height:22px}
.fc{width:18px;color:#161616;font-weight:800}.etats{display:flex;gap:6px;flex-wrap:wrap}.etats .pu{height:34px;padding:0 11px}`).replace('<div class="bas"></div>', '<div class="bas"></div>' + feuille);

// D — puces de domaines, et l'état en second rang discret (texte) ; Brasserie et Idée posés.
const brass = CARNETS.filter((c) => c.d === 'Brasserie');
const n = (e) => brass.filter((c) => c.e === e).length;
const rang2 = `<div class="r2">${['À comparer', 'Idée', 'Choisi', 'Fait'].map((e) => `<span class="${e === 'Idée' ? 'on' : ''} ${n(e) ? '' : 'zero'}">${e} ${n(e)}</span>`).join('<span class="pt">·</span>')}</div>`;
const D = ecran(`<div class="anneau" style="margin:0 -6px;padding:0 6px 4px">${rangDomaines('Brasserie', { anneau: false, decale: 120 })}${rang2}</div>` + section('Idée', brass.filter((c) => c.e === 'Idée'), PAS_ARTICLE),
`.r2{display:flex;gap:7px;align-items:center;font-size:15px;color:#555;padding:7px 2px 2px}.r2 .on{color:#161616;font-weight:700;text-decoration:underline;text-underline-offset:4px;text-decoration-thickness:2px}.r2 .zero{color:#aaa}.r2 .pt{color:#bbb}`);

// Dans un carnet : le domaine, posé par l'IA, changé d'un toucher (sur la capture en ligne de Chambre froide).
const DOM = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>${CSS}
.fond{position:absolute;inset:0;background:url('${CAP_C}') 0 0/390px 844px}
.pd{position:absolute;left:150px;top:238px;z-index:3;display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 11px;border:1px solid #d6d3cb;border-radius:999px;background:#fff;font-size:15px;font-weight:600}
.menu{position:absolute;left:150px;top:278px;width:214px;z-index:3;background:#fff;border:1px solid #ddd9d0;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.18);padding:4px 0}
.mi{display:flex;align-items:center;gap:11px;height:46px;padding:0 14px;font-size:16px;font-weight:600}.mi.on{background:#f3f1ec}.mi .c{margin-left:auto;font-weight:800}
.ia{position:absolute;left:150px;top:530px;width:214px;font-size:14px;color:#555;z-index:3;line-height:1.3;padding:4px 2px}
</style></head><body><div class="ecran"><div class="fond"></div>
<span class="pd anneau">${picto('Brasserie', 17)}Brasserie ▾</span>
<div class="menu">${['Local', 'Brasserie', 'Meuble', 'Outils', 'Papiers'].map((d) => `<div class="mi ${d === 'Brasserie' ? 'on' : ''}">${picto(d, 20)}${d}<span class="c">${d === 'Brasserie' ? '✓' : ''}</span></div>`).join('')}</div>
<div class="ia">Posé par l'IA au rangement. Un toucher le change.</div></div></body></html>`;

const pages = { 'a-puces': A, 'b-sections': B, 'c-bouton': C1, 'c-feuille': C2, 'd-deux-rangs': D, 'carnet-domaine': DOM };
const nav = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--allow-file-access-from-files'] });
try {
  const p = await nav.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  for (const [id, html] of Object.entries(pages)) {
    const tmp = path.join(os.tmpdir(), `filtres-domaine-${id}.html`);
    fs.writeFileSync(tmp, html);
    await p.goto(url(tmp), { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(IMG, `${id}.png`), clip: { x: 0, y: 0, width: 390, height: 844 } });
    console.log('img/' + id + '.png');
  }
  fs.copyFileSync(F_A, path.join(IMG, 'actuel-liste.png'));
  console.log('img/actuel-liste.png');
} finally { await nav.close(); }
