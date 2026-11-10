// Capture d'une feuille du harnais : node capturer.mjs <s> <theme> <largeur> <hauteur> <fichier.png> [attente-ms] [selecteur-a-cliquer]
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ici = path.dirname(fileURLToPath(import.meta.url));
const [s, theme, largeur, hauteur, fichier, attente = '2500', clic] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
for (let essai = 1; essai <= 3; essai++) {
  try {
    const p = await b.newPage();
    await p.setViewport({ width: +largeur, height: +hauteur, hasTouch: +largeur < 600 });
    await p.goto(`http://localhost:5651/work/missions/2026-11-09-levure-port/voies/b-dep/harnais/index.html?s=${s}&theme=${theme}${process.env.ETAT ? `&etat=${process.env.ETAT}` : ""}`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, +attente));
    if (process.env.SCROLL) { await p.evaluate(sel => { const e = document.querySelector(sel); if (e) e.scrollTop = e.scrollHeight; }, process.env.SCROLL); await new Promise(r => setTimeout(r, 400)); }
    if (clic) { await p.click(clic); await new Promise(r => setTimeout(r, 500)); }
    await p.screenshot({ path: path.join(ici, fichier) });
    const texte = await p.evaluate(() => document.body.innerText.slice(0, 1500));
    console.log(texte.split('\n').filter(Boolean).slice(0, 40).join(' | '));
    break;
  } catch (e) { if (essai === 3) throw e; }
}
await b.close();
