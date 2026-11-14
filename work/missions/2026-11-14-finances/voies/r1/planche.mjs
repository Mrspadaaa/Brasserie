// planche.mjs : planche côte à côte (g6, r1 Annuel / g3a, r1 Synthèse) → cap/r1-planche.png
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const ici = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')));
const u = (p) => pathToFileURL(path.resolve(ici, p)).href;
const col = (t, f) => `<figure><figcaption>${t}</figcaption><img src="${u(f)}"/></figure>`;
const html = `<style>body{margin:0;background:#fff;font:14px sans-serif}div{display:flex;gap:12px;padding:10px;align-items:flex-start}figure{margin:0}figcaption{font-weight:700;margin-bottom:4px}img{height:760px;border:1px solid #888}</style>
<div>${col('g6 (choisi)', '../../ref/g6/g6-page.png')}${col('r1 Annuel 390 clair', 'cap/r1-ann-tete-390-clair.png')}${col('r1 Annuel 390 cave', 'cap/r1-ann-tete-390-cave.png')}</div>
<div>${col('g3a (choisi)', '../../ref/g3a/g3a-page.png')}${col('r1 Synthèse nov. 390 clair', 'cap/r1-syn-nov-390-clair.png')}${col('r1 Synthèse sept. 390 cave', 'cap/r1-syn-sept-390-cave.png')}</div>`;
const f = path.resolve(ici, 'cap/planche.html'); writeFileSync(f, html);
const { browser, page } = await ouvrir({ largeur: 1500, hauteur: 1600, mobile: false, echelle: 1 });
await page.goto(pathToFileURL(f).href); await calme(page, 800);
await page.screenshot({ path: path.resolve(ici, 'cap/r1-planche.png'), fullPage: true });
await browser.close(); console.log('planche OK');
