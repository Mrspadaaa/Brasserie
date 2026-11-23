// Contrôle CAL-PAYS-COMPACT (16.11) : « Bien mais pas très compact » (paysage w3, grands vides entre les rangées).
// En 844×390, la hauteur médiane d'une rangée du calendrier (.lane) ne dépasse pas 48 px, et aucune rangée n'a plus
// de 40 % de sa surface vide de barre, d'étiquette ou de pastille (mesure grossière par bandes de 8 px).
// node scripts/agents/controle-pays-compact.mjs <page.html> [...] → COMPACT OK | COMPACT ECHEC
import { createRequire } from 'module'; import path from 'path'; import { pathToFileURL } from 'url';
const req = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = req('puppeteer-core');
const fichiers = process.argv.slice(2); if (!fichiers.length) { console.log('usage : <page.html>'); process.exit(2); }
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
let ko = 0;
for (const f of fichiers) {
  const p = await nav.newPage(); await p.setViewport({ width: 844, height: 390 });
  await p.goto(pathToFileURL(path.resolve(f)).href, { waitUntil: 'load' }); await new Promise((r) => setTimeout(r, 500));
  const m = await p.evaluate(() => {
    const lanes = [...document.querySelectorAll('.lane')].filter((l) => l.offsetParent && l.getBoundingClientRect().height > 0);
    const hs = lanes.map((l) => Math.round(l.getBoundingClientRect().height)).sort((a, b) => a - b);
    const med = hs.length ? hs[Math.floor(hs.length / 2)] : 0;
    const vides = lanes.map((l) => { const r = l.getBoundingClientRect(); const bandes = Math.max(1, Math.floor(r.height / 8)); let vide = 0;
      for (let i = 0; i < bandes; i++) { const y = r.top + i * 8 + 4; let plein = false; for (let x = r.left + 130; x < r.right - 4 && !plein; x += 16) { const e = document.elementFromPoint(x, y); if (e && e !== l && !e.classList.contains('col') && !e.classList.contains('lr') && !e.classList.contains('ps') && l.contains(e)) plein = true; } if (!plein) vide++; }
      return Math.round(100 * vide / bandes); });
    return { n: lanes.length, med, hs, pireVide: Math.max(0, ...vides.filter((v, i) => lanes[i].getBoundingClientRect().top < innerHeight)) };
  });
  const bon = m.n > 0 && m.med <= 48; if (!bon) ko++;
  console.log(`${bon ? 'ok' : 'KO'} ${path.basename(f)} : ${m.n} rangées, hauteur médiane ${m.med} px (max 48), hauteurs ${m.hs.join(',')}, rangée la plus vide ${m.pireVide} %`);
  await p.close();
}
await nav.close(); console.log(ko ? 'COMPACT ECHEC' : 'COMPACT OK'); process.exit(ko ? 1 : 0);
