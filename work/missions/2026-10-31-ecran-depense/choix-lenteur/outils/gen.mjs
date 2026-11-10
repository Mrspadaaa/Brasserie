#!/usr/bin/env node
// Voie c-lenteur (02.11, D261c) : écrit les mini maquettes de la lenteur de la lecture, puis les capture à 390 px.
// Seul varie le moment où la 3e lecture (3.8 Flash) compte, et ce que l'écran montre en l'attendant.
// Aspect repris de l'écran Dépense actuel : état « lecture » d'ExpenseSheet (p3c-port/captures/tactile390-lecture.png),
// dépense lue (f3-rangees/captures/tactile390-clair-repos.png : en-tête, bandeau, preuve, puces, TVA/Règlement, bandes, pied).
// Thème clair. Fournisseur, articles, quantités, prix, montants : tous fictifs. Usage : node gen.mjs [--sans-captures]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const DOSSIER = path.resolve(ICI, '..');
const RACINE = path.resolve(DOSSIER, '..', '..', '..', '..');
const MAQ = path.join(DOSSIER, 'maquettes');
const IMG = path.join(DOSSIER, 'img');
fs.mkdirSync(MAQ, { recursive: true });
fs.mkdirSync(IMG, { recursive: true });
const HAUT = 700;

const CSS = `
:root{--c950:#fff;--c900:#f5f5f5;--c850:#ebebeb;--c800:#ddd;--c700:#bfbfbf;--c600:#9e9e9e;--c400:#666;--c200:#333;--c50:#111;
--att:rgb(156 112 32);--attT:rgb(127 91 16);--gold:#E0A02E;--hop:rgb(63 107 46);--lev:rgb(47 98 150);--suc:#c8742c;--rouge:#b3261e;--vise:#2d5f8a}
*{box-sizing:border-box}
body{margin:0;width:390px;height:${HAUT}px;background:#fff;color:var(--c50);font:14px/1.25 "Source Sans 3",system-ui,"Segoe UI",sans-serif;overflow:hidden;position:relative}
body.gris{background:var(--c900)}
.m{font-family:"IBM Plex Mono",ui-monospace,Consolas,monospace;font-variant-numeric:tabular-nums}
.cl-h{display:flex;align-items:center;gap:4px;height:40px;border-bottom:1px solid var(--c800);padding:0 4px;background:#fff}
.cl-h h2{flex:1;margin:0;font-size:16px;font-weight:600}
.cl-ic{width:32px;height:32px;display:flex;align-items:center;justify-content:center;color:var(--c200);border-radius:10px}
.cl-vise{outline:2.5px solid var(--vise);outline-offset:2px}
/* état « lecture » d'aujourd'hui */
.cl-lect{margin:8px;border:1px solid var(--c800);border-radius:14px;background:rgb(245 245 245/.6);padding:5px 10px 7px;display:grid;gap:4px}
.cl-lect .nom{display:flex;align-items:baseline;justify-content:space-between;gap:8px}
.cl-lect .nom b{font-size:16px;font-weight:600}
.cl-lect .nom span{font-size:12px;color:var(--c400)}
.cl-frise{display:flex;gap:6px;font-size:12px;color:var(--c400)}
.cl-frise span{flex:1;display:flex;flex-direction:column;gap:3px}
.cl-frise i{display:block;height:6px;border-radius:10px;background:var(--c800)}
.cl-frise .f1{color:var(--c200)} .cl-frise .f1 i{background:var(--c200)}
.cl-frise .f2{color:var(--c50);font-weight:600} .cl-frise .f2 i{background:repeating-linear-gradient(90deg,#333 0 6px,#ddd 6px 12px)}
.cl-arrivent{margin:0 8px;height:118px;border:1px dashed var(--c600);border-radius:14px;display:flex;align-items:center;justify-content:center;color:var(--c400);font-size:14px}
.cl-ligne{margin:0 12px;display:flex;min-height:36px;align-items:center;border-bottom:1px solid var(--c800);font-size:14px;color:var(--c200)}
.cl-ligne em{margin-left:auto;font-style:normal;font-size:12px;color:var(--c400)}
/* la marque « vérification en cours » (D, E) : la frise d'aujourd'hui, réduite à un fil sous l'en-tête */
.cl-fil{display:flex;align-items:center;gap:6px;height:22px;padding:0 10px;font-size:12px;color:var(--c50);font-weight:600;background:#fff;border-bottom:1px solid var(--c800)}
.cl-fil i{display:block;height:4px;border-radius:4px;background:var(--c200);width:36px}
.cl-fil i.cours{width:96px;background:repeating-linear-gradient(90deg,#333 0 6px,#ddd 6px 12px)}
/* dépense lue */
.cl-band{margin:8px 8px 0;border:1px solid var(--c800);border-radius:14px;background:rgb(245 245 245/.4);padding:5px 10px 7px;display:grid;gap:4px}
.cl-band .r1{display:flex;align-items:baseline;justify-content:space-between}
.cl-band .r1 b{font-size:16px;font-weight:600}
.cl-band .r1 span{font-size:14px;color:var(--c200);border-bottom:1px dashed var(--c600)}
.cl-band .r2{display:flex;align-items:center;gap:8px}
.cl-band .tot{font-size:28px;font-weight:600;line-height:1.1}
.cl-chip{margin-left:auto;min-height:28px;border:1px solid var(--c700);border-radius:10px;padding:0 8px;display:inline-flex;align-items:center;gap:4px;font-size:14px;color:var(--c200);background:#fff}
.cl-barre{display:flex;height:10px;border:1px solid var(--c800);border-radius:999px;overflow:hidden}
.cl-barre i{display:block;height:100%;border-right:1.5px solid #fff}
.cl-preuve{margin:6px 8px 0;border:1px solid var(--c800);border-radius:14px;padding:2px 8px 6px;display:grid;grid-template-columns:1.12fr 1fr;column-gap:8px}
.cl-preuve .rg{display:flex;align-items:center;gap:4px;min-height:26px;border-bottom:1px solid var(--c800);font-size:14px;color:var(--c200)}
.cl-preuve .rg b{margin-left:auto;font-weight:500;color:var(--c50)}
.cl-preuve .pu{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:6px;padding-top:6px}
.cl-pu{display:inline-flex;align-items:center;gap:4px;min-height:24px;padding:0 7px;border-radius:999px;font-size:13px;color:var(--c200);border:1px solid transparent}
.cl-pu b{font-weight:600}
.cl-pu.j{border:1.5px dashed var(--att);color:var(--attT);background:rgb(224 160 46/.08)}
.cl-pu.r{border:1.5px dashed var(--rouge);color:var(--rouge);background:rgb(179 38 30/.06)}
.cl-pu.c{border:1.5px solid var(--vise);color:var(--vise);background:rgb(45 95 138/.08)}
.cl-pts{display:inline-flex;gap:3px;align-items:center;margin-left:auto}
.cl-pts i{width:8px;height:8px;border-radius:50%;background:var(--c200)}
.cl-pts i.att{background:none;border:1.5px dashed var(--c200)}
.cl-duo{margin:6px 8px 0;display:grid;grid-template-columns:1fr 1fr;gap:6px}
.cl-duo div{border:1px solid var(--c800);border-radius:14px;padding:3px 8px 5px;font-size:12px;color:var(--c400);display:grid;gap:1px}
.cl-duo div b{font-size:14px;font-weight:500;color:var(--c50)}
.cl-bande{display:flex;align-items:center;gap:6px;height:28px;padding:0 10px}
.cl-bande strong{font-weight:600}
.cl-pt{width:10px;height:10px;border-radius:50%}
.cl-nb{border:1px solid var(--c600);background:#fff;border-radius:10px;padding:0 6px;font-size:12px;line-height:18px;color:var(--c200)}
.cl-bande .q{margin-left:auto;margin-right:57px;font-size:12px;font-weight:600;color:var(--c200)}
.cl-bande .t{min-width:54px;text-align:right;font-weight:600}
.cl-li{display:flex;align-items:center;gap:6px;min-height:28px;padding:0 10px;border-bottom:1px solid var(--c800);border-left:4px solid var(--gold)}
.cl-li.haute{min-height:40px}
.cl-li .n{flex:1;min-width:0;font-size:14px;display:flex;flex-direction:column;line-height:1.15}
.cl-li .n small{font-size:12px;color:var(--c400)}
.cl-li .n s{font-size:12px;color:var(--c400)}
.cl-dq{flex:none;min-width:94px;display:inline-grid;grid-template-columns:minmax(37px,max-content) 7px 44px;column-gap:3px;font-size:12px;color:var(--c400);white-space:nowrap;align-items:center}
.cl-dq b{text-align:right;font-weight:600} .cl-dq i{font-style:normal;text-align:center}
.cl-dq .j{border:1.5px dashed var(--att);border-radius:6px;padding:0 3px;color:var(--attT)}
.cl-dq .r{border:1.5px dashed var(--rouge);border-radius:6px;padding:0 3px;color:var(--rouge)}
.cl-dq .c{background:rgb(45 95 138/.14);border-radius:6px;padding:0 3px;color:var(--vise)}
.cl-mt{width:54px;flex:none;text-align:right;font-size:14px}
.cl-pied{position:absolute;left:0;right:0;bottom:0;display:flex;align-items:center;gap:8px;padding:8px;border-top:1px solid var(--c800);background:#fff}
.cl-seg{display:inline-flex;border:1px solid var(--c600);border-radius:10px;overflow:hidden}
.cl-seg span{min-height:28px;display:flex;align-items:center;padding:0 10px;font-size:14px;color:var(--c200)}
.cl-seg span.on{background:#111;color:#fff;font-weight:600}
.cl-conf{margin-left:auto;height:36px;border-radius:10px;background:#111;color:#fff;font-weight:600;font-size:15px;display:flex;align-items:center;gap:8px;padding:0 22px}
.cl-conf.attente{background:var(--c700);color:#fff}
.cl-conf.gris{background:#a6a6a6;height:36px;padding:0 18px}
`;

const svg = (d, s = 20, sw = 2, c = 'currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const X = svg('<path d="M18 6 6 18M6 6l12 12"/>');
const DOC = svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/>');
const CHECK = (s = 14, c = 'rgb(63 107 46)') => svg('<path d="M20 6 9 17l-5-5"/>', s, 2.2, c);
const ALERTE = svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/>', 16, 2, 'var(--rouge)');
const REPRIS = svg('<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/>', 14, 2.2);
const ROUE = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="rgb(255 255 255/.45)" stroke-width="3"/><path d="M12 3a9 9 0 0 1 9 9" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>`;
const CUBE = `<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#111" stroke-width="1.67" style="flex:none"><path d="M10 2.5 17 6v8l-7 3.5L3 14V6z"/><path d="M3 6l7 3.5L17 6M10 9.5v8"/><circle cx="15" cy="15" r="4.6" fill="#111" stroke="none"/><path d="M12.8 15.1l1.6 1.6 2.9-3" stroke="#fff"/></svg>`;
const CUBE_P = `<svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M10 2.5 17 6v8l-7 3.5L3 14V6z"/><path d="M3 6l7 3.5L17 6M10 9.5v8"/></svg>`;

const tete = (vise = false) => `<header class="cl-h"><span class="cl-ic">${X}</span><h2>Nouvelle dépense</h2><span class="cl-ic">${DOC}</span></header>`;

// 1. L'état « lecture » d'aujourd'hui (ExpenseSheet, busy) : rien d'autre tant que la lecture n'a pas fini.
function lecture() {
  return `<header class="cl-h"><span class="cl-ic" style="color:var(--c600)">${X}</span><h2>Nouvelle dépense</h2></header>`
    + `<div class="cl-lect"><div class="nom"><b>facture-brauhaus.pdf</b><span class="m">0,8 Mo</span></div>`
    + `<div class="cl-frise"><span class="f1"><i></i>envoi ✓</span><span class="f2"><i></i>lecture</span><span><i></i>vérification</span></div></div>`
    + `<div class="cl-arrivent">Les lignes arrivent ici</div><div style="padding:4px 0 0"><div class="cl-ligne">Pour quoi ?<em>après la lecture</em></div><div class="cl-ligne">Règlement<em>Déjà payé · À payer</em></div></div>`
    + `<div class="cl-pied" style="background:#f5f5f5"><span class="cl-conf gris" style="margin-left:auto">✓&nbsp;Enregistrer</span></div>`;
}

// 2. La dépense. `etat` : 'premier' (deux lectures rapides seulement), 'final' (après la 3.8). `fil` : la marque « vérification
// en cours » (D, E). `corrige` : la 3.8 vient d'arriver et a changé des valeurs (D, E). Valeurs fictives : 7 lignes, 46,40.
function depense({ etat, fil = false, corrige = false, lectures }) {
  const prem = etat === 'premier';
  const cell = (txt, k) => k ? `<b class="${k}">${txt}</b>` : `<b>${txt}</b>`;
  const ligne = ({ nom, sous = '', q, qk, p, pk, m, c, vieux = '' }) => `<div class="cl-li${vieux ? ' haute' : ''}" style="border-left-color:${c}">${CUBE}`
    + `<span class="n"><span>${nom}${sous ? ` <small class="m">${sous}</small>` : ''}</span>${vieux ? `<s class="m">${vieux}</s>` : ''}</span>`
    + `<span class="cl-dq m">${cell(q, qk)}<i>×</i><span${pk ? ` class="${pk}"` : ''}>${p}</span></span><span class="cl-mt m">${m}</span></div>`;
  const C = corrige ? 'c' : '';
  const L = {
    pilsner: prem ? { nom: 'Malt Pilsner', q: '10 Kg', p: '1,45', m: '14,50' } : { nom: 'Malt Pilsner', q: '5 Kg', p: '2,90', m: '14,50', qk: C, pk: C, vieux: corrige ? '10 Kg × 1,45' : '' },
    munich: { nom: 'Malt de Munich', q: '4 Kg', p: '1,80', m: '7,20' },
    carapils: { nom: 'Carapils', q: '1 Kg', qk: 'j', p: '2,40', m: '2,40' },
    sabro: prem ? { nom: 'Sabro', sous: 'α 13,4', q: '30 ?', qk: 'r', p: '0,070', m: '2,10' } : { nom: 'Sabro', sous: 'α 13,4', q: '30 g', qk: C, p: '0,070', m: '2,10', vieux: corrige ? '30 ?' : '' },
    citra: prem ? { nom: 'Citra', sous: 'α 12,5', q: '50 ?', qk: 'r', p: '0,090', m: '4,50' } : { nom: 'Citra', sous: 'α 12,5', q: '50 g', qk: C, p: '0,090', m: '4,50', vieux: corrige ? '50 ?' : '' },
    levure: { nom: 'Levure Ale sèche', q: '2 sachets', qk: 'j', p: '4,90', m: '9,80' },
    sucre: { nom: 'Sucre candi', q: '1 ?', qk: 'r', p: '5,90', m: '5,90' },
  };
  const bandes = [
    { g: 'Malts', c: 'var(--gold)', t: 'rgb(224 160 46/.22)', q: prem ? '15 Kg' : '10 Kg', s: '24,10', r: [L.pilsner, L.munich, L.carapils] },
    { g: 'Houblons', c: 'var(--hop)', t: 'rgb(63 107 46/.2)', q: prem ? '80 ?' : '80 g', s: '6,60', r: [L.sabro, L.citra] },
    { g: 'Levures', c: 'var(--lev)', t: 'rgb(47 98 150/.2)', q: '2 sachets', s: '9,80', r: [L.levure] },
    { g: 'Sucres', c: 'var(--suc)', t: 'rgb(200 116 44/.2)', q: '1 ?', s: '5,90', r: [L.sucre] },
  ];
  const corps = bandes.map((b) => `<div class="cl-bande" style="background:linear-gradient(${b.t},${b.t}),#fff"><i class="cl-pt" style="background:${b.c}"></i><strong>${b.g}</strong><span class="cl-nb m">${b.r.length}</span><span class="q m">${b.q}</span><span class="t m">${b.s}</span></div>`
    + b.r.map((r) => ligne({ ...r, c: b.c })).join('')).join('');
  const barre = bandes.flatMap((b) => b.r.map((r) => `<i style="flex-grow:${parseFloat(r.m.replace(',', '.'))};background:${b.c}"></i>`)).join('');
  const rouges = prem ? 3 : 1;
  const pts = lectures === '2/3' ? `<span class="cl-pts"><i></i><i></i><i class="att"></i></span>` : `<b class="m">${lectures}</b>`;
  const puces = `<span class="cl-pu">${CUBE_P}<b class="m">6</b> reliés</span><span class="cl-pu j"><b class="m">2</b> à contrôler</span><span class="cl-pu r"><b class="m">${rouges}</b> à remplir</span>`
    + (corrige ? `<span class="cl-pu c cl-vise">${REPRIS}<b class="m">3</b> corrigées</span>` : '');
  const filHtml = fil ? `<div class="cl-fil cl-vise" style="outline-offset:-2px"><i></i><i></i><i class="cours"></i><span>vérification</span></div>` : '';
  const conf = fil ? `<span class="cl-conf attente cl-vise">${ROUE}Confirmer</span>` : `<span class="cl-conf">✓ Confirmer</span>`;
  return `${tete()}${filHtml}<section class="cl-band"><div class="r1"><b>Brauhaus Ouest</b><span class="m">21.10.2026</span></div>`
    + `<div class="r2"><span class="tot m">46,40</span><span style="font-size:12px;color:var(--c400)">CHF</span><span class="cl-chip">${ALERTE}<span class="m">7</span>&nbsp;lignes</span></div><div class="cl-barre">${barre}</div></section>`
    + `<section class="cl-preuve"><div class="rg">${CHECK()}Somme = imprimé<b class="m">46,40</b></div><div class="rg">${CHECK()}Qté × prix<b class="m">7/7</b></div>`
    + `<div class="rg" style="border:0${lectures === '2/3' ? ';outline:2.5px solid var(--vise);outline-offset:1px;border-radius:6px' : ''}">${lectures === '2/3' ? '' : CHECK()}Lectures${pts}</div><div class="rg" style="border:0"></div><div class="pu">${puces}</div></section>`
    + `<div class="cl-duo"><div>TVA<b>–</b></div><div>Règlement<b>Payé</b></div></div><div style="height:8px"></div>${corps}`
    + `<div class="cl-pied"><span class="cl-seg"><span class="on">Catégorie</span><span>Papier</span></span>${conf}</div>`;
}

// Les vues : 6 s, 15 s, lue. A : l'attente jusqu'au bout. B, C : l'attente, puis la dépense (déjà lue à 15 s).
// D, E : la dépense dès 6 s, provisoire (fil « vérification », Confirmer en attente), puis la 3.8 qui corrige.
const V = {
  lecture: () => [lecture(), 'gris'],
  finale: () => [depense({ etat: 'final', lectures: '3/3' }), ''],
  deux: () => [depense({ etat: 'premier', lectures: '2/2' }), ''],
  prov: () => [depense({ etat: 'premier', fil: true, lectures: '2/3' }), ''],
  corrigee: () => [depense({ etat: 'final', corrige: true, lectures: '3/3' }), ''],
};
const OPTIONS = {
  a: { '06': 'lecture', '15': 'lecture', lue: 'finale' },
  b: { '06': 'lecture', '15': 'finale', lue: 'finale' },
  c: { '06': 'lecture', '15': 'deux', lue: 'deux' },
  d: { '06': 'prov', '15': 'prov', lue: 'corrigee' },
  e: { '06': 'prov', '15': 'corrigee', lue: 'corrigee' },
};
const page = (titre, corps, classe) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${titre}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
<style>${CSS}</style></head><body class="${classe}">${corps}</body></html>`;

const fichiers = [];
for (const [id, o] of Object.entries(OPTIONS)) {
  for (const [vue, genre] of Object.entries(o)) {
    const nom = `${id}-${vue}`;
    const [corps, classe] = V[genre]();
    fs.writeFileSync(path.join(MAQ, `${nom}.html`), page(`Option ${id.toUpperCase()} · ${vue}`, corps, classe));
    fichiers.push(nom);
  }
}
console.log(`${fichiers.length} maquettes écrites dans ${MAQ}`);

if (!process.argv.includes('--sans-captures')) {
  const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
  const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const p = await nav.newPage();
  await p.setViewport({ width: 390, height: HAUT, deviceScaleFactor: 2 });
  const sommes = {};
  // Deux maquettes au même HTML (titre mis à part) partagent la même capture : « = X » sur la page veut dire identique au pixel.
  const deja = new Map();
  for (const nom of fichiers) {
    const h = crypto.createHash('md5').update(fs.readFileSync(path.join(MAQ, `${nom}.html`), 'utf8').replace(/<title>[^<]*<\/title>/, '')).digest('hex').slice(0, 8);
    const f = path.join(IMG, `${nom}.png`);
    if (deja.has(h)) { fs.copyFileSync(deja.get(h), f); console.log(`${nom}.png · copie de ${path.basename(deja.get(h))}`); }
    else {
      await p.goto(pathToFileURL(path.join(MAQ, `${nom}.html`)).href, { waitUntil: 'networkidle0', timeout: 30000 }).catch(() => {});
      await p.evaluate(() => document.fonts.ready);
      await new Promise((r) => setTimeout(r, 200));
      const d = await p.evaluate(() => [document.documentElement.scrollWidth, document.querySelector('.cl-pied')?.getBoundingClientRect().top ?? 0, Math.max(0, ...[...document.querySelectorAll('body > :not(.cl-pied), body > :not(.cl-pied) *')].map((e) => e.getBoundingClientRect().bottom))]);
      await p.screenshot({ path: f });
      deja.set(h, f);
      console.log(`${nom}.png · largeur ${d[0]} · haut du pied ${Math.round(d[1])} · bas du contenu ${Math.round(d[2])}`);
    }
    sommes[nom] = crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex').slice(0, 8);
  }
  await nav.close();
  fs.writeFileSync(path.join(IMG, 'md5.json'), JSON.stringify(sommes, null, 1));
}
