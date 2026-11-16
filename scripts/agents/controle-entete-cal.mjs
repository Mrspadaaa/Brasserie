// Contrôle CAL-GRAPH-PETIT (16.11) : « Graph trop petit donné date trop présente. Mais l'idée est bonne »
// En-tête du calendrier : la courbe (plus grand svg au-dessus de la frise) fait au moins 80 px de haut,
// et la bande des semaines (#fh : semaines, soldes, mouvements) au plus 40 px, sans disparaître (l'idée est bonne).
// node scripts/agents/controle-entete-cal.mjs <page.html> [--paysage] [...]  → ENTETE OK | ENTETE ECHEC
import { createRequire } from 'module'; import path from 'path'; import { pathToFileURL } from 'url';
const req = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = req('puppeteer-core');
const args = process.argv.slice(2); const pays = args.includes('--paysage'); const fichiers = args.filter((a) => !a.startsWith('--'));
if (!fichiers.length) { console.log('usage : <page.html> [--paysage]'); process.exit(2); }
const COURBE_MIN = pays ? 70 : 80, BANDE_MAX = 40;
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
let ko = 0;
for (const f of fichiers) {
  const p = await nav.newPage(); await p.setViewport(pays ? { width: 844, height: 390 } : { width: 390, height: 844 });
  await p.goto(pathToFileURL(path.resolve(f)).href, { waitUntil: 'load' }); await new Promise((r) => setTimeout(r, 500));
  const m = await p.evaluate(() => {
    const frise = document.querySelector('#fb') || document.querySelector('.frise');
    const haut = frise ? frise.getBoundingClientRect().top : innerHeight / 2;
    const svgs = [...document.querySelectorAll('svg')].filter((s) => s.getBoundingClientRect().bottom <= haut + 1 && s.getBoundingClientRect().width > 150);
    const traces = svgs.flatMap((s) => [...s.querySelectorAll('path, polyline, polygon')]).map((e) => e.getBoundingClientRect()).filter((r) => r.width > 150);
    const courbe = Math.max(0, ...traces.map((r) => Math.round(r.height)));
    const fh = document.querySelector('#fh, [data-bande-semaines]'); const vis = fh && fh.offsetParent !== null && fh.getBoundingClientRect().height > 0;
    return { courbe, bande: vis ? Math.round(fh.getBoundingClientRect().height) : 0, existe: !!vis, tete: Math.round(haut) };
  });
  const bon = m.courbe >= COURBE_MIN && ((pays && !m.existe) || (m.existe && m.bande <= BANDE_MAX)); if (!bon) ko++;
  console.log(`${bon ? 'ok' : 'KO'} ${path.basename(f)} : courbe ${m.courbe} px (min ${COURBE_MIN}), bande des semaines ${m.existe ? m.bande + ' px' : 'absente'} (max ${BANDE_MAX}, présente), en-tête ${m.tete} px`);
  await p.close();
}
await nav.close(); console.log(ko ? 'ENTETE ECHEC' : 'ENTETE OK'); process.exit(ko ? 1 : 0);
