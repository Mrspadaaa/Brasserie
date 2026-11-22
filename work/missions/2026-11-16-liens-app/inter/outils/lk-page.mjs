// Planche de la part L1, L29, L14 : page-inter/part-l1-l29-l14.html (captures clair et cave, légendes).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const INTER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = path.resolve(INTER, '../page-inter');
const V = JSON.parse(fs.readFileSync(path.join(INTER, 'outils/lk-vues.json'), 'utf8'));
const TETE = {
  'l1-a': ['L1 · a', 'Par le + volant : « Idée » en tête de « Poser en S47 », dictée, semaine en puces. Trace : l’ampoule sur l’en-tête de la semaine ; un toucher, une bulle.'],
  'l1-b': ['L1 · b', 'Appui long sur une semaine : la bulle de dictée s’accroche à la semaine. Trace : l’ampoule ; un toucher ouvre l’idée au carnet.'],
  'l1-c': ['L1 · c', 'On glisse le + volant sur une semaine : la semaine vient du lâcher. Trace : l’ampoule, avec un compte si la semaine en a déjà une.'],
  'l29-a': ['L29 · a', 'Trois pastilles « lié à » sous le titre, « +2 » pour le reste ; une pastille mène à la fiche liée, à l’endroit concerné.'],
  'l29-b': ['L29 · b', 'Mêmes pastilles que a ; un toucher montre la chose sur place (aperçu), « Ouvrir » pour y aller.'],
  'l14-a': ['L14 · a', 'Dans Stocks (base C telle quelle) : le fournisseur en étiquette sur chaque ligne ; « Commander ces 3 » range par fournisseur, « Commandé » d’un toucher.'],
  'l14-b': ['L14 · b', 'Sur la fiche du fournisseur : une ligne d’en-tête dit ce qui est à commander chez lui ; « Commandé » pose la livraison attendue sous son délai appris.'],
};
const par = {};
for (const x of V) if (x.v !== 'l1-c') (par[x.v] ||= []).push(x);
const fig = (x, th) => `<figure><img src="../inter/cap/${x.v}-${x.f}-${th}.png" alt="${x.v} ${x.f} ${th}" loading="lazy"><figcaption><b>${x.f.replace(/^\d-/, (m) => m.slice(0, 1) + ' · ')}</b> ${x.legende}</figcaption></figure>`;
const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Liens · mini maquettes d’interaction · L1, L29, L14 · 16.11</title>
<style>
body{margin:0;background:#12100e;color:#f5f0ea;font:16px/1.4 "Source Sans 3","Segoe UI",system-ui,sans-serif}
header{padding:20px 20px 8px}h1{margin:0 0 4px;font-size:24px}header p{margin:0;color:#a8998d;max-width:900px}
section{padding:18px 20px 8px;border-top:1px solid #2c2521}h2{margin:0;font-size:21px;color:#f2c14e}section>p{margin:4px 0 12px;max-width:900px;color:#d9cfc5}
.rang{display:flex;gap:14px;overflow-x:auto;padding-bottom:12px}.th{font-size:14px;color:#a8998d;margin:2px 0 6px}
figure{margin:0;flex:none;width:300px}img{width:300px;display:block;border-radius:14px;border:1px solid #3d342e}
figcaption{font-size:14px;color:#d9cfc5;margin-top:6px}figcaption b{color:#f5f0ea}
</style></head><body>
<header><h1>Mini maquettes d’interaction : L1, L29, L14</h1>
<p>Statiques, 390 × 844, posées sur tes bases telles quelles (calendrier g-d1, lot v1, fournisseur v1, Stocks C, carnet c5). Le rond translucide est le doigt. Chaque version se lit de gauche à droite : le geste, puis ce qu’il produit. Clair, puis cave. Chiffres d’exemple.</p></header>
${Object.entries(par).map(([v, xs]) => `<section id="${v}"><h2>${TETE[v][0]}</h2><p>${TETE[v][1]}</p>
<div class="th">clair</div><div class="rang">${xs.map((x) => fig(x, 'clair')).join('')}</div>
<div class="th">cave</div><div class="rang">${xs.map((x) => fig(x, 'cave')).join('')}</div></section>`).join('\n')}
</body></html>`;
fs.mkdirSync(PAGE, { recursive: true });
fs.writeFileSync(path.join(PAGE, 'part-l1-l29-l14.html'), html);
console.log('page écrite', path.join(PAGE, 'part-l1-l29-l14.html'));
