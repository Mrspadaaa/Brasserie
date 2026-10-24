// Extrait complémentaire : la rangée des cartes d'objectif de Suggérer (contexte des traits, au-dessus du graphe).
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url'; import puppeteer from 'puppeteer-core';
const ici = path.dirname(fileURLToPath(import.meta.url));
const M = path.resolve(ici, '../../../../../../prototypes/houblons-v4/maquettes');
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await p.goto(pathToFileURL(path.join(M, 'parcours-suggerer/suggerer/etat.html')).href, { waitUntil: 'networkidle0' }); await new Promise((r) => setTimeout(r, 900));
const h = await p.evaluate(() => { const o = [...document.querySelectorAll('[data-role=objectif]')]; let x = o[0]; while (!x.contains(o[o.length - 1])) x = x.parentElement; return x.outerHTML; });
fs.writeFileSync(path.join(ici, 'extraits/gr5-objectifs.html'), h); console.log(Math.round(h.length / 1024) + ' ko');
await b.close();
