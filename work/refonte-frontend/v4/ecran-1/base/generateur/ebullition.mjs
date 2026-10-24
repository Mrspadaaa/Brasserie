// La durée d'ébullition lue dans la recette (D37 révisé) : la même recette à 45′, 120′ et 200′
// (cas-ebu45, cas-ebu120, cas-ebu200). Vérifie le renvoi sans réglage, le rail de la durée à 0′
// (graduations b<durée> à b0, rien au-delà) et la ligne ramenée au début à 45′ ; captures dans base/captures.
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const BASE = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/refonte-frontend/v4/ecran-1/base';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
for (const c of [45, 120, 200]) {
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.goto(pathToFileURL(path.join(BASE, 'consolide', 'cas-ebu' + c + '.html')).href, { waitUntil: 'networkidle0' });
  const m = await p.evaluate((c) => {
    const e = document.querySelector('[data-role="ebullition"]');
    const b = [...document.querySelectorAll('[data-etape^="b"]')].map((x) => Number(x.dataset.etape.slice(1)));
    return { tete: e.innerText.replace(/\s+/g, ' '), renvoi: !!e.querySelector('a[data-action="renvoi-ebullition"]'), reglage: !!document.querySelector('[data-action^="ebullition-"], [data-role="ebullition"] input'),
      debut: Math.max(...b), fin: Math.min(...b), audela: b.filter((x) => x > c).length, ligne: document.querySelector('[data-role="ligne-houblon"]').innerText.replace(/\s+/g, ' ').slice(0, 70), ibu: document.querySelector('#ibu').textContent };
  }, c);
  console.log(c + '′', JSON.stringify(m));
  await p.screenshot({ path: path.join(BASE, 'captures', 'v4-ebullition-' + c + '.png') });
  await p.close();
}
await b.close();
