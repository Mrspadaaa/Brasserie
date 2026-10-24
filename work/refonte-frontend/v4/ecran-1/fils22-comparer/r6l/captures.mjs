// r6l · captures sur un vrai rendu, gestes joués au doigt (puppeteer, 390 px, tactile).
// Usage : node captures.mjs  →  ../captures/r6l-*.png
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(ICI, '../../../../../../package.json'));
const puppeteer = require('puppeteer-core');
const URL0 = pathToFileURL(path.join(ICI, 'etat.html')).href;
const OUT = (n) => path.join(ICI, '../captures/r6l-' + n + '.png');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const neuve = async (q = '', h = 844) => {
  const p = await browser.newPage();
  await p.setViewport({ width: 390, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.goto(URL0 + q, { waitUntil: 'networkidle0' });
  await wait(400);
  return p;
};
const centre = async (p, sel) => { const b = await (await p.$(sel)).boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };
const errs = [];

// 1. premier écran et page entière, au repos
let p = await neuve();
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await p.screenshot({ path: OUT('premier-ecran') });
await p.screenshot({ path: OUT('390'), fullPage: true });

// 2. glisser Galaxy sur la grande carte : pendant (le fantôme au-dessus de la carte), puis après
const a = await centre(p, '.cands .vg[data-v="Galaxy"]');
const cible = await centre(p, '.hero .barres');
await p.touchscreen.touchStart(a.x, a.y);
for (let i = 1; i <= 12; i++) { await p.touchscreen.touchMove(a.x + (cible.x - a.x) * i / 12, a.y + (cible.y - 120 - a.y) * i / 12); await wait(16); }
await wait(120);
await p.screenshot({ path: OUT('glisser-pendant') });
await p.touchscreen.touchEnd();
await wait(450);
console.log('après glisser :', await p.$eval('.h-nom', (e) => e.textContent), '·', await p.$eval('.h-rg', (e) => e.textContent));
await p.screenshot({ path: OUT('glisser-apres') });

// 3. la grande carte glissée de côté (vers la gauche : le candidat suivant)
const hc = await centre(p, '.h-tete');
await p.touchscreen.touchStart(hc.x + 60, hc.y);
for (let i = 1; i <= 8; i++) { await p.touchscreen.touchMove(hc.x + 60 - i * 18, hc.y + 2); await wait(16); }
await p.touchscreen.touchEnd();
await wait(450);
console.log('après balayage :', await p.$eval('.h-nom', (e) => e.textContent));

// 4. un toucher : la chimie de Galaxy face à Nelson Sauvin
await p.close();
p = await neuve('?h=Galaxy');
await (await p.$('.ouvre [aria-controls="p-chimie"]')).tap();
await wait(400);
const ch = await p.$('#p-chimie');
await ch.evaluate((e) => e.scrollIntoView({ block: 'center' }));
await wait(200);
await p.screenshot({ path: OUT('toucher-390') });
await ch.screenshot({ path: OUT('chimie') });
await (await p.$('.ouvre [aria-controls="p-valeurs"]')).tap();
await wait(300);
await (await p.$('#p-valeurs')).screenshot({ path: OUT('valeurs') });
await p.close();
p = await neuve('?h=Cascade');
await (await p.$('.ouvre [aria-controls="p-osu"]')).tap();
await wait(300);
await (await p.$('#p-osu')).screenshot({ path: OUT('osu') });
await (await p.$('.ouvre [aria-controls="p-valeurs"]')).tap();
await wait(300);
await (await p.$('#p-valeurs')).screenshot({ path: OUT('valeurs-cascade') });
await p.close();

// 5. appui long (700 ms) sur Nelson Sauvin : sa fiche (choix A) ; puis sur la grande carte (Galaxy)
p = await neuve();
const ns = await centre(p, '.vg.cible .nm');
await p.touchscreen.touchStart(ns.x, ns.y); await wait(700); await p.touchscreen.touchEnd(); await wait(400);
await p.screenshot({ path: OUT('fiche-390') });
await p.keyboard.press('Escape'); await wait(200);
await p.close();
p = await neuve('?h=Galaxy');
const hb = await centre(p, '.hero .barres');
await p.touchscreen.touchStart(hb.x, hb.y); await wait(700); await p.touchscreen.touchEnd(); await wait(400);
await p.screenshot({ path: OUT('fiche-galaxy') });
await p.close();

// 6. absolu, et la légende ouverte
p = await neuve('?abs');
await p.screenshot({ path: OUT('absolu') });
await p.close();
p = await neuve();
await (await p.$('[data-role="legende-bouton"]')).tap(); await wait(300);
await p.screenshot({ path: OUT('legende') });
await p.close();

await browser.close();
console.log(errs.length ? 'ERREURS console : ' + errs.join(' | ') : 'console sans erreur');
