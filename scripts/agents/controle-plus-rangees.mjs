// Contrôle CAL-PLUS-ALIGNE (16.11) : « + pas aligné ni sur la même ligne ??? »
// Le + de chaque rangée du calendrier : même colonne (x à 2 px près) et même ligne que le titre (centre à 2 px près).
// node scripts/agents/controle-plus-rangees.mjs <page.html> [...]  → PLUS OK | PLUS ECHEC
import { createRequire } from 'module'; import path from 'path'; import { pathToFileURL } from 'url';
const req = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = req('puppeteer-core');
const fichiers = process.argv.slice(2); if (!fichiers.length) { console.log('usage : <page.html>'); process.exit(2); }
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
let ko = 0;
for (const f of fichiers) {
  const p = await nav.newPage(); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await p.goto(pathToFileURL(path.resolve(f)).href, { waitUntil: 'load' }); await new Promise(r => setTimeout(r, 400));
  const m = await p.evaluate(() => [...document.querySelectorAll('.lane .lt')].filter(t => t.offsetParent).map(t => {
    const pl = t.querySelector('.k14-pl, .g2-c'); if (!pl || !pl.offsetParent) return null;
    const tn = [...t.childNodes].find(n => n.nodeType === 3 && n.textContent.trim()) || [...t.querySelectorAll('span,b,strong')].find(e => !e.contains(pl) && e.textContent.trim()); if (!tn) return null; const r = document.createRange(); r.selectNodeContents(tn);
    const a = r.getBoundingClientRect(), b = pl.getBoundingClientRect();
    return { nom: tn.textContent.trim(), x: Math.round(b.left + b.width / 2), dy: Math.round((b.top + b.height / 2) - (a.top + a.height / 2)) };
  }).filter(Boolean));
  const xs = m.map(o => o.x), ecart = Math.max(...xs) - Math.min(...xs), mal = m.filter(o => Math.abs(o.dy) > 2);
  const bon = m.length > 1 && ecart <= 2 && !mal.length; if (!bon) ko++;
  console.log(`${bon ? 'ok' : 'KO'} ${path.basename(f)} : ${m.length} rangées, colonnes du + écart ${ecart} px ; hors ligne : ${mal.map(o => o.nom + ' ' + o.dy + ' px').join(', ') || 'aucune'} ; x = ${xs.join(',')}`);
  await p.close();
}
await nav.close(); console.log(ko ? 'PLUS ECHEC' : 'PLUS OK'); process.exit(ko ? 1 : 0);
