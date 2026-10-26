#!/usr/bin/env node
// Captures de contrôle des deux pages (à ouvrir, L12) : haut au téléphone, une rangée choisie, la visionneuse ouverte,
// et le premier écran à l'ordinateur. Sorties dans os.tmpdir()/affinee-galerie.
// Usage : node regarder.mjs <page.html> <préfixe> [#ancre] [n° de vignette à ouvrir]
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', '..', '..');
const puppeteer = createRequire(path.join(R, 'package.json'))('puppeteer-core');
const [page, prefixe, ancre = '', n = '0'] = process.argv.slice(2);
const T = path.join(os.tmpdir(), 'affinee-galerie');
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
try {
  const p = await nav.newPage();
  const url = pathToFileURL(path.resolve(R, page)).href;
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await p.goto(url, { waitUntil: 'networkidle0' });
  await p.screenshot({ path: path.join(T, `${prefixe}-tel-haut.png`) });
  await p.evaluate(() => scrollTo(0, 844));
  await p.screenshot({ path: path.join(T, `${prefixe}-tel-ecran2.png`) });
  if (ancre) {
    await p.evaluate((a) => document.querySelector(a).scrollIntoView(), ancre);
    await p.screenshot({ path: path.join(T, `${prefixe}-tel-rangee.png`) });
  }
  const boutons = await p.$$('.planche .ecran');
  const rang = /^[0-9]+$/.test(n) ? Number(n) : await p.evaluate((x) => [...document.querySelectorAll('.planche .ecran')].findIndex((b) => b.closest('figure').dataset.source.includes(x)), n);
  await boutons[rang].click();
  await new Promise((r) => setTimeout(r, 400));
  await p.screenshot({ path: path.join(T, `${prefixe}-tel-visionneuse.png`) });
  await p.keyboard.press('Escape');
  await p.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  await p.evaluate(() => scrollTo(0, 0));
  await p.screenshot({ path: path.join(T, `${prefixe}-ordi-haut.png`) });
  if (ancre) {
    await p.evaluate((a) => document.querySelector(a).scrollIntoView(), ancre);
    await p.screenshot({ path: path.join(T, `${prefixe}-ordi-rangee.png`) });
  }
  await boutons[rang].click();
  await new Promise((r) => setTimeout(r, 400));
  await p.screenshot({ path: path.join(T, `${prefixe}-ordi-visionneuse.png`) });
  console.log('captures dans', T);
} finally { await nav.close(); }
