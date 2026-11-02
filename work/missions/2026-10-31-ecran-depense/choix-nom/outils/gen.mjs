#!/usr/bin/env node
// Voie c-nom (02.11) : écrit les 18 mini maquettes (6 options × dépense, stock, factures suivantes) en HTML statique, puis les capture à 390 px.
// Aspect repris de src/ui/depense/Ligne.tsx, Pictos.tsx, Liste.tsx, p3c.css et du plateau d'ExpenseSheet (thème clair, jetons de themes.css).
// Toutes les quantités, prix, montants et fournisseurs sont fictifs. Usage : node gen.mjs [--sans-captures]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const DOSSIER = path.resolve(ICI, '..');
const RACINE = path.resolve(DOSSIER, '..', '..', '..', '..');
const MAQ = path.join(DOSSIER, 'maquettes');
const IMG = path.join(DOSSIER, 'img');
fs.mkdirSync(MAQ, { recursive: true });
fs.mkdirSync(IMG, { recursive: true });

const CSS = `
:root{--c950:#fff;--c900:#f5f5f5;--c850:#ebebeb;--c800:#ddd;--c700:#bfbfbf;--c600:#9e9e9e;--c400:#666;--c200:#333;--c50:#111;
--att:rgb(156 112 32);--attT:rgb(127 91 16);--stock:rgb(76 107 42);--gold:#E0A02E;--hop:rgb(63 107 46)}
*{box-sizing:border-box}
body{margin:0;width:390px;background:#fff;color:var(--c50);font:14px/1.25 "Source Sans 3",system-ui,"Segoe UI",sans-serif;overflow:hidden}
.m{font-family:"IBM Plex Mono",ui-monospace,Consolas,monospace;font-variant-numeric:tabular-nums}
.cn-h{display:flex;align-items:center;gap:4px;height:40px;border-bottom:1px solid var(--c800);padding:0 4px}
.cn-h h2{flex:1;margin:0;font-size:16px;font-weight:600}
.cn-ic{width:32px;height:32px;display:flex;align-items:center;justify-content:center;color:var(--c200)}
.cn-champs{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:6px 8px}
.cn-champ{border:1px solid var(--c800);border-radius:10px;padding:3px 8px;min-height:40px}
.cn-champ small{display:block;font-size:12px;color:var(--c400)}
.cn-champ b{font-weight:400;font-size:14px}
.cn-bande{display:flex;align-items:center;gap:6px;height:28px;padding:0 10px;background:linear-gradient(rgb(224 160 46/.22),rgb(224 160 46/.22)),#fff}
.cn-bande strong{font-weight:600}
.cn-pt{width:10px;height:10px;border-radius:50%;background:var(--gold)}
.cn-nb{border:1px solid var(--c600);background:#fff;border-radius:10px;padding:0 6px;font-size:12px;line-height:18px;color:var(--c200)}
.cn-bande .q{margin-left:auto;margin-right:57px;font-size:12px;font-weight:600;color:var(--c200)}
.cn-bande .t{min-width:54px;text-align:right;font-weight:600}
.cn-li{border-bottom:1px solid var(--c800);border-left:4px solid var(--gold)}
.cn-li.dt{background:rgb(156 112 32/.05)}
.cn-r{display:flex;align-items:center;gap:6px;min-height:28px;padding:0 10px}
.cn-nom{flex:1;min-width:0;padding:2px 0;font-size:14px;line-height:1.2}
.cn-nom.rep{color:var(--attT);text-decoration:underline dotted var(--att);text-underline-offset:2px}
.cn-dq{flex:none;min-width:94px;display:inline-grid;grid-template-columns:minmax(37px,max-content) 7px 44px;column-gap:3px;font-size:12px;color:var(--c400);white-space:nowrap}
.cn-dq b{text-align:right;font-weight:600;color:var(--c400)} .cn-dq i{font-style:normal;text-align:center}
.cn-mt{width:54px;flex:none;text-align:right;font-size:14px}
.cn-pl{border-top:1px solid var(--c800);background:rgb(245 245 245/.6);padding:8px 10px 8px 32px;display:grid;gap:6px}
.cn-imp{font-size:12px;color:var(--c400)} .cn-imp span{color:var(--c200)}
.cn-calc{display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-size:14px;color:var(--c200)}
.cn-in{height:28px;border:1px solid var(--c600);border-radius:10px;background:#fff;padding:0 6px;display:inline-flex;align-items:center;font-size:14px;color:var(--c50)}
.cn-ok{display:inline-flex;align-items:center;min-height:24px;border:1px solid var(--c700);border-radius:10px;padding:0 6px;font-size:12px;color:var(--hop)}
.cn-seg{display:inline-flex;border:1px solid var(--c600);border-radius:10px;overflow:hidden;width:max-content}
.cn-seg span{min-height:28px;display:flex;align-items:center;padding:0 10px;font-size:14px;color:var(--c200)}
.cn-seg span.on{background:#111;color:#fff;font-weight:600}
.cn-art{display:flex;flex-wrap:wrap;align-items:center;gap:4px 6px;font-size:12px;color:var(--c200)}
.cn-art .cn-in{font-weight:500;min-width:120px}
.cn-art .cn-in.rep{border:1.5px dashed var(--att);color:var(--attT)}
.cn-bt{min-height:28px;border:1px solid var(--c600);border-radius:10px;padding:0 8px;display:inline-flex;align-items:center;font-size:14px;color:var(--c200);background:#fff}
.cn-bt.gar{border:1px dashed var(--att);color:var(--attT);font-weight:600}
.cn-bt.pri{background:#111;border-color:#111;color:#fff;font-weight:600}
.cn-plus{display:inline-flex;align-items:center;gap:4px;font-size:12px;color:var(--c200);width:max-content}.cn-plus u{text-decoration:underline dotted;text-underline-offset:2px}
.cn-fix{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:0 10px 4px 36px;font-size:12px;color:var(--attT)}
.cn-pied{position:absolute;left:0;right:0;bottom:0;display:flex;align-items:center;gap:8px;padding:8px;border-top:1px solid var(--c800);background:#fff}
.cn-pied .cn-seg span{padding:0 10px}
.cn-pied .conf{margin-left:auto;height:36px;border-radius:10px;background:#111;color:#fff;font-weight:600;font-size:15px;display:flex;align-items:center;padding:0 22px}
/* stock */
.cn-app{display:flex;align-items:center;gap:8px;height:40px;padding:0 10px}
.cn-logo{width:26px;height:26px;border-radius:7px;background:#111}
.cn-app b{font-weight:400;font-size:15px;flex:1}
.cn-rond{width:28px;height:28px;border:1px solid var(--c600);border-radius:10px;display:flex;align-items:center;justify-content:center}
.cn-tabs{display:flex;margin:0 10px 8px;border:1px solid var(--c800);border-radius:10px;padding:3px;background:var(--c900)}
.cn-tabs span{flex:1;text-align:center;font-size:14px;line-height:30px;color:var(--c200)}
.cn-tabs span.on{background:#111;color:#fff;border-radius:8px;font-weight:600}
.cn-sec{display:flex;justify-content:space-between;padding:4px 12px 4px;font-size:13px;font-weight:600;color:var(--c200);border-bottom:1px solid var(--c800);margin-bottom:6px}
.cn-sec span{font-weight:400;color:var(--c400)}
.cn-carte{margin:0 10px 6px;border:1px solid var(--c800);background:#f1f1f1;border-radius:10px;padding:7px 10px 6px}
.cn-carte .l1{display:flex;align-items:center;gap:8px}
.cn-carte .l1 b{flex:1;font-weight:400;font-size:14px}
.cn-carte .alias{font-size:12px;color:var(--c400);margin-top:1px}
.cn-carte .l2{display:flex;align-items:center;gap:8px;margin-top:4px;font-size:12px;color:var(--c400)}
.cn-carte .l2 i{width:52px;height:4px;border:1px dashed var(--c700);border-radius:2px}
.cn-carte .qt{font-size:14px;color:var(--c50)}
.cn-carte.neuf{border-color:var(--c600);background:#fff;box-shadow:0 1px 4px rgb(0 0 0/.08)}
.cn-voile{position:absolute;inset:0;background:rgb(0 0 0/.10)}
.cn-sheet{position:absolute;left:0;right:0;bottom:0;background:#fff;border-radius:16px 16px 0 0;box-shadow:0 -6px 20px rgb(0 0 0/.18);padding:6px 10px 10px}
.cn-poignee{width:36px;height:4px;border-radius:2px;background:var(--c700);margin:0 auto 6px}
.cn-sheet .tt{display:flex;align-items:flex-start;gap:8px}
.cn-sheet .tt div{flex:1} .cn-sheet .tt b{display:block;font-size:16px;font-weight:600} .cn-sheet .tt small{font-size:12px;color:var(--c400)}
.cn-boite{border:1px solid var(--c800);background:var(--c900);border-radius:10px;padding:6px 8px;margin:8px 0;display:flex;align-items:center}
.cn-boite div{flex:1} .cn-boite small{display:block;font-size:12px;color:var(--c400)} .cn-boite b{font-size:16px}
.cn-lab{font-size:12px;font-weight:600;color:var(--c200);margin-bottom:3px}
.cn-champ2{height:32px;border:1px solid var(--c600);border-radius:10px;padding:0 8px;display:flex;align-items:center;font-size:16px}
.cn-alias2{font-size:12px;color:var(--c400);margin-top:4px}
.cn-alias2 span{color:var(--c200)}
.cn-signal{margin:0 10px 8px;border:1.5px solid var(--att);border-radius:10px;background:rgb(156 112 32/.07);padding:8px 10px;display:grid;gap:6px}
.cn-signal p{margin:0;font-size:14px;font-weight:600;color:var(--c50)}
.cn-signal div{display:flex;gap:6px}
.cn-vise{outline:2.5px solid #2d5f8a;outline-offset:2px}
.cn-paire{outline:1.5px dashed var(--att);outline-offset:2px}
/* factures suivantes */
.cn-fac{display:flex;align-items:center;gap:6px;height:28px;padding:0 10px;background:var(--c900);border-bottom:1px solid var(--c800);font-size:13px;font-weight:600;color:var(--c200)}
.cn-fac .lg{margin-left:auto;border:1px solid var(--c600);border-radius:10px;padding:0 6px;font-size:12px;line-height:18px;font-weight:500;background:#fff}
.cn-gap{height:8px}
.cn-groupe{position:relative;margin:4px 6px 0;padding:6px 0 0;border:1.5px dashed var(--att);border-radius:12px}
.cn-groupe .tag{position:absolute;top:-10px;right:10px;background:#fff;padding:0 6px;font-size:12px;font-weight:600;color:var(--attT)}
.cn-groupe .cn-carte{margin:0 4px 6px}
.cn-groupe.un{border:1.5px solid rgb(86 127 69/.7)} .cn-groupe.un .tag{color:var(--hop)}
`;

// Le picto de lien au stock (Pictos.tsx), en SVG brut.
const COUL = { relie: 'rgb(17 17 17)', neuf: 'rgb(76 107 42)', propose: 'rgb(127 91 16)' };
function picto(lien, size = 18, propose = false) {
  const c = propose ? COUL.propose : COUL[lien];
  const sw = (30 / size).toFixed(2);
  const cube = '<path d="M10 2.5 17 6v8l-7 3.5L3 14V6z"/><path d="M3 6l7 3.5L17 6M10 9.5v8"/>';
  const g = `<g${propose ? ' stroke-dasharray="2.4 1.6"' : ''}>${cube}</g>`;
  const pastille = lien === 'relie'
    ? '<circle cx="15" cy="15" r="4.6" fill="currentColor" stroke="none"/><path d="M12.8 15.1l1.6 1.6 2.9-3" stroke="#fff"/>'
    : '<circle cx="15" cy="15" r="4.6" fill="currentColor" stroke="none"/><path d="M15 12.6v4.8M12.6 15h4.8" stroke="#fff"/>';
  return `<svg width="${size}" height="${size}" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="${sw}" style="color:${c};flex:none">${g}${pastille}</svg>`;
}
const X = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>';
const DOC = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/></svg>';
const ETOILE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="1.6"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/></svg>';
const LOUPE = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';

const rangee = (r) => `<article class="cn-li${r.douteux ? ' dt' : ''}"><div class="cn-r">${picto(r.lien, 18, r.propose)}<span class="cn-nom${r.rep ? ' rep' : ''}">${r.nom}</span>`
  + `<span class="cn-dq m"><b>${r.q}</b><i>×</i><span>${r.p}</span></span><span class="cn-mt m">${r.t}</span></div>${r.plateau ?? ''}${r.fix ?? ''}</article>`;

function plateau({ imprime, q, u, p, t, article, rep }) {
  return `<div class="cn-pl"><p class="cn-imp" style="margin:0">imprimé « <span class="m">${imprime}</span> »</p>
  <div class="cn-calc"><span class="cn-in m" style="width:64px;justify-content:flex-end">${q}</span><span class="cn-in m" style="width:44px;justify-content:center">${u}</span><span>×</span><span class="cn-in m" style="width:76px;justify-content:flex-end">${p}</span><span>=</span><span class="cn-in m" style="width:76px;justify-content:flex-end">${t}</span><span class="cn-ok">✓ au centime</span></div>
  <div class="cn-seg"><span class="on">Ingrédient</span><span>Service</span><span>Matériel</span></div>
  <div class="cn-art"><span>article «</span><span class="cn-in cn-vise${rep ? ' rep' : ''}">${article}</span>${rep ? '<span>»</span><span class="cn-bt gar">Garder</span>' : '<span>» · nouvel article</span>'}<span class="cn-bt" aria-label="autre article">⇄</span></div>
  <span class="cn-plus"><u>plus</u><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></span></div>`;
}

// Maquette 1 : la dépense de la facture allemande, la ligne du nouvel article ouverte (son plateau).
function depense(o) {
  const ligne1 = rangee({ lien: 'neuf', nom: o.rangNom, rep: o.rangRep, douteux: o.rangRep, q: '6 Kg', p: '1,60', t: '9,60',
    plateau: plateau({ imprime: 'Wiener Malz', q: '6', u: 'Kg', p: '1,60', t: '9,60', article: o.article, rep: o.articleRep }) });
  const ligne2 = rangee({ lien: 'relie', nom: 'CARABELGE', q: '1 Kg', p: '2,30', t: '2,30' });
  return `<header class="cn-h"><span class="cn-ic">${X}</span><h2>Nouvelle dépense</h2><span class="cn-ic">${DOC}</span></header>
  <div class="cn-fac">Malzhaus Nord<span class="lg m">DE</span></div>
  <div class="cn-bande"><i class="cn-pt"></i><strong>Malts</strong><span class="cn-nb m">2</span><span class="q m">7 Kg</span><span class="t m">11,90</span></div>
  ${ligne1}${ligne2}
  <div class="cn-pied"><span class="cn-seg"><span class="on">Catégorie</span><span>Papier</span></span><span class="conf">✓ Confirmer</span></div>`;
}

const carte = (c) => `<div class="cn-carte${c.neuf ? ' neuf cn-vise' : ''}${c.paire ? ' cn-paire' : ''}"><div class="l1"><b>${c.nom}</b><span class="qt m">${c.q}</span>${ETOILE}</div>${c.alias ? `<div class="alias">${c.alias}</div>` : ''}<div class="l2"><i></i>Niveau inconnu</div></div>`;
const appStock = `<div class="cn-app"><span class="cn-logo"></span><b>L'Affinée</b><span class="cn-rond">${LOUPE}</span></div>
  <div class="cn-tabs"><span class="on">Stock</span><span>Courses</span><span>Fûts</span><span>Matériel</span></div>`;

// Maquette 2 : la vue Stock après « Confirmer », et la fiche du nouvel article.
function stock(o) {
  const signal = o.fusion ? `<div class="cn-signal"><p>Haferflocken = Flocons d'Avoine ?</p><div><span class="cn-bt" style="font-weight:600;color:var(--c50);border-color:var(--c200)">Fusionner</span><span class="cn-bt">Garder les deux</span></div></div>` : '';
  const cartes = o.fusion
    ? [{ nom: "Flocons d'Avoine", q: '4 kg', paire: true }, { nom: 'Haferflocken', q: '2 kg', paire: true }, { nom: 'Malt Chocolat', q: '3 kg' }, { nom: 'Malt Maris Otter', q: '12 kg' }, { nom: 'Malt de Vienne', q: '6 kg', neuf: true }]
    : [{ nom: 'Malt Chocolat', q: '3 kg' }, { nom: 'Malt Maris Otter', q: '12 kg' }, { nom: o.nom, q: '6 kg', alias: o.aliasListe, neuf: true }];
  const fiche = o.fusion ? '' : `<div class="cn-voile"></div><div class="cn-sheet"><div class="cn-poignee"></div>
    <div class="tt"><div><b>${o.nom}</b><small>Malt</small></div><span class="cn-ic" style="width:24px;height:24px">${X}</span></div>
    <div class="cn-boite"><div><small>Stock actuel</small><b class="m">6 kg</b></div><span class="cn-bt">Corriger l'inventaire</span></div>
    <div class="cn-lab">Nom</div><div class="cn-champ2 cn-vise">${o.nom}</div>${o.aliasFiche ? `<div class="cn-alias2">Sur la facture : <span>${o.aliasFiche}</span></div>` : ''}</div>`;
  return `${appStock}${signal}<div class="cn-sec">Malt<span>${cartes.length}</span></div>${cartes.map(carte).join('')}${fiche}`;
}

// Maquette 3 : trois factures suivantes du même malt (allemand, anglais, français), puis ce que le stock en garde.
function suivantes(o) {
  const fac = (four, lg, r) => `<div class="cn-fac">${four}<span class="lg m">${lg}</span></div>${rangee(r)}`;
  const de = { lien: 'relie', nom: 'Malt de Vienne', q: '10 Kg', p: '1,55', t: '15,50' };
  const en = { lien: o.en, propose: o.propose, douteux: o.propose, nom: 'Malt de Vienne', q: '25 Kg', p: '1,40', t: '35,00' };
  const fr = { lien: o.fr, propose: o.propose, douteux: o.propose, nom: 'Malt de Vienne', q: '4 Kg', p: '1,70', t: '6,80' };
  if (o.propose) {
    const barre = '<div class="cn-fix"><span>article « <b style="font-weight:600">Malt de Vienne</b> » · proposé</span><span class="cn-bt gar">Garder</span><span class="cn-bt">⇄</span><span class="cn-bt">Retirer</span></div>';
    en.fix = barre; fr.fix = barre;
  }
  const bas = o.cartes.length > 1
    ? `<div class="cn-groupe"><span class="tag">${o.cartes.length} fiches du même malt</span>${o.cartes.map(carte).join('')}</div>`
    : `<div class="cn-groupe un"><span class="tag">1 fiche</span>${o.cartes.map(carte).join('')}</div>`;
  return `<header class="cn-h"><span class="cn-ic">${X}</span><h2>Factures suivantes</h2></header>
  ${fac('Malzhaus Nord', 'DE', de)}<div class="cn-gap"></div>${fac('Northfield Maltings', 'EN', en)}<div class="cn-gap"></div>${fac('Moulin du Jura', 'FR', fr)}
  <div class="cn-gap"></div><div class="cn-sec" style="margin-top:6px">${o.titreStock}<span>Malt</span></div>${bas}`;
}

const FR = 'Malt de Vienne';
const UN = [{ nom: FR, q: '45 kg' }];
const OPTIONS = {
  a: { dep: { rangNom: FR, article: 'Wiener Malz' }, stock: { nom: 'Wiener Malz' },
    suiv: { en: 'neuf', fr: 'neuf', titreStock: 'Au stock', cartes: [{ nom: 'Wiener Malz', q: '16 kg' }, { nom: 'Vienna Malt', q: '25 kg' }, { nom: FR, q: '4 kg' }] } },
  b: { dep: { rangNom: FR, article: FR }, stock: { nom: FR, aliasFiche: 'Wiener Malz' },
    suiv: { en: 'relie', fr: 'relie', titreStock: 'Au stock', cartes: UN } },
  c: { dep: { rangNom: FR, article: FR }, stock: { nom: FR, aliasListe: 'Wiener Malz', aliasFiche: 'Wiener Malz' },
    suiv: { en: 'relie', fr: 'relie', titreStock: 'Au stock', cartes: [{ nom: FR, q: '45 kg', alias: 'Wiener Malz · Vienna Malt' }] } },
  d: { dep: { rangNom: FR, article: FR }, stock: { nom: FR, fusion: true },
    suiv: { en: 'relie', fr: 'relie', titreStock: 'Au stock', cartes: UN } },
  e: { dep: { rangNom: FR, rangRep: true, article: FR, articleRep: true }, stock: { nom: FR, aliasFiche: 'Wiener Malz' },
    suiv: { en: 'relie', fr: 'relie', titreStock: 'Au stock', cartes: UN } },
  f: { dep: { rangNom: FR, article: FR }, stock: { nom: FR, aliasFiche: 'Wiener Malz' },
    suiv: { en: 'relie', fr: 'relie', propose: true, titreStock: 'Au stock après « Garder »', cartes: UN } },
};
const HAUT = { depense: 446, stock: 520, suivantes: 472 };
const page = (titre, corps, haut) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${titre}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
<style>${CSS}body{height:${haut}px;position:relative}</style></head><body>${corps}</body></html>`;

const fichiers = [];
for (const [id, o] of Object.entries(OPTIONS)) {
  for (const [genre, f, d] of [['depense', depense, o.dep], ['stock', stock, o.stock], ['suivantes', suivantes, o.suiv]]) {
    const nom = `${id}-${genre}`;
    fs.writeFileSync(path.join(MAQ, `${nom}.html`), page(`Option ${id.toUpperCase()} · ${genre}`, f(d), HAUT[genre]));
    fichiers.push([nom, HAUT[genre]]);
  }
}
console.log(`${fichiers.length} maquettes écrites dans ${MAQ}`);

if (!process.argv.includes('--sans-captures')) {
  const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
  const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const p = await nav.newPage();
  for (const [nom, haut] of fichiers) {
    await p.setViewport({ width: 390, height: haut, deviceScaleFactor: 2 });
    await p.goto(pathToFileURL(path.join(MAQ, `${nom}.html`)).href, { waitUntil: 'networkidle0', timeout: 30000 }).catch(() => {});
    await p.evaluate(() => document.fonts.ready);
    const deborde = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.scrollHeight]);
    await p.screenshot({ path: path.join(IMG, `${nom}.png`) });
    console.log(`${nom}.png · contenu ${deborde[0]}×${deborde[1]}`);
  }
  await nav.close();
}
