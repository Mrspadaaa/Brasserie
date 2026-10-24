// Lot 21 · captures de w1 à w5, états compris : node captures-w.mjs [w1 w2 …]
// Chaque état : [suffixe, requête, hauteur, gestes] ; gestes = liste de ['clic', sélecteur] | ['appui', sélecteur]
// | ['curseur', sélecteur, valeur] | ['defile', y]. Sortie : fils21-choisir/captures/<v>-<suffixe>.png (390 px, ×2).
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const D = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const ETATS = {
  w1: [['390', '', 1688], ['haut-390', '', 844], ['tropical-390', '?envie=tropical', 1688], ['dose-390', '?d=6&h=Citra&j=3', 1688],
    ['cumul-390', '?h=Citra&h2=Galaxy&m=dryActive&l=Pomona', 1688], ['mot-390', '?ouvre=l', 844], ['preuve-390', '?detail=preuve-Citra', 1688], ['pistes-390', '?detail=pistes-citrus', 844],
    ['fiche-390', '', 844, [['appui', '[data-houblon]']]], ['legende-390', '?legende', 844], ['absolu-390', '?abs', 844]],
};
Object.assign(ETATS, {
  w2: [['390', '', 1688], ['haut-390', '', 844], ['ose-390', '?plan=2', 1688], ['sage-390', '?plan=0', 1688], ['tropical-390', '?envie=tropical&plan=2', 1688], ['preuve-390', '?detail=preuve-plans', 1688], ['fiche-390', '', 844, [['appui', '[data-houblon]']]], ['legende-390', '?legende', 844]],
});
Object.assign(ETATS, {
  w3: [['390', '', 1688], ['haut-390', '', 844], ['tropical-390', '?cible=tropical:4,citrus:3&contrainte=libre', 1688], ['floral-390', '?cible=floral:3', 1688], ['touche-390', '', 1688, [['clic', '#prof [data-famille="stoneFruit"] .w-z']]], ['preuve-390', '?detail=preuve-w3', 1688], ['fiche-390', '', 844, [['appui', '[data-houblon]']]]],
});
Object.assign(ETATS, {
  w4: [['390', '', 1688], ['haut-390', '', 844], ['q2-390', '?q=q2', 1688], ['q3-390', '?q=q3&j=4', 1688], ['q4-390', '?q=q4', 1688], ['q5-390', '?q=q5', 1688], ['q1-60-390', '', 1688, [['clic', '[data-reglage="moment"][data-v="b60"]']]], ['fiche-390', '?q=q2', 844, [['appui', '.w4-q.ouvert [data-houblon]']]]],
});
Object.assign(ETATS, {
  w5: [['390', '', 1688], ['haut-390', '', 844], ['pousse-390', '?i=i1&pas=0', 1688], ['i4-390', '?i=i4', 1688], ['i5-390', '?i=i5', 1688], ['i6-390', '?i=i6&pas=1', 1688], ['i8-390', '?i=i8', 1688], ['fiche-390', '', 844, [['appui', '.w5-i.ouvert [data-houblon]']]]],
});
Object.assign(ETATS, {
  w3b: [['390', '', 1688], ['haut-390', '', 844], ['ose-390', '?plan=ose', 1688], ['apres-390', '?m=dryPost', 1688], ['ensemble-390', '?a=ensemble', 1688], ['agrumes-390', '?cible=citrus:2,floral:1', 1688], ['mot-390', '', 844, [['clic', '[data-tok="h"]']]], ['defi-390', '?detail=defi', 1688], ['preuve-390', '?detail=preuve', 1688], ['fiche-390', '', 844, [['appui', '#phrase [data-houblon]']]], ['legende-390', '?legende', 844], ['absolu-390', '?abs', 844]],
});
const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(ETATS);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
for (const id of ids) for (const [suf, q, h, gestes = []] of ETATS[id] || []) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(path.join(D, id, 'etat.html')).href + q, { waitUntil: 'networkidle0', timeout: 30000 });
  await wait(400);
  for (const [g, sel, v] of gestes) {
    if (g === 'clic') { await page.click(sel); await wait(450); }
    if (g === 'appui') { const e = await page.$(sel); const t = await e.touchStart(); await wait(650); await t.end(); await wait(500); }
    if (g === 'curseur') { await page.$eval(sel, (e, v) => { e.value = String(v); e.dispatchEvent(new Event('input', { bubbles: true })); }, v); await wait(450); }
    if (g === 'defile') { await page.evaluate((y) => scrollTo(0, y), sel); await wait(300); }
  }
  const out = path.join(D, 'captures', id + '-' + suf + '.png');
  await page.screenshot({ path: out });
  console.log('SHOT ' + path.relative(D, out));
  await page.close();
}
await browser.close();
