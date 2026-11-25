import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const F = 'file:///C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-25-carnet-passe4/v01.html';
const OUT = process.argv[2] || '.';
const seul = process.argv[3]; // numéros de figures à capturer seules, ex. "1,9"
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await nav.newPage();
await p.setViewport({ width: 2094, height: 900, deviceScaleFactor: 1 });
await p.goto(F, { waitUntil: 'networkidle0' });
const figs = await p.$$('figure.p4-f');
if (seul) {
  for (const n of seul.split(',')) await figs[Number(n) - 1].screenshot({ path: `${OUT}/f${n}.png` });
} else {
  for (let r = 0; r * 5 < figs.length; r++) {
    const b = await figs[r * 5].boundingBox();
    await p.screenshot({ path: `${OUT}/rang${r + 1}.png`, clip: { x: 0, y: b.y, width: 2094, height: 880 }, captureBeyondViewport: true });
  }
}
const m = await p.evaluate(() => {
  const out = [];
  document.querySelectorAll('section.ecran').forEach((s, i) => {
    const r = s.getBoundingClientRect();
    const champ = s.querySelector('.g-saisie, .p4-tape, .p4-outils');
    const lim = champ ? champ.getBoundingClientRect().top : r.bottom;
    const rows = [...s.querySelectorAll('.contenu .a1-pb, .contenu .g-sd')].filter((e) => { const b = e.getBoundingClientRect(); return b.bottom <= lim && b.top >= r.top; }).length;
    const blocs = [...s.querySelectorAll('.contenu > *, .p4-pad > *, .p4-doc > *')];
    const coupes = blocs.filter((e) => { const b = e.getBoundingClientRect(); return b.bottom > lim + 1 && b.top < r.bottom && b.height > 0; }).map((e) => (e.innerText || '').slice(0, 28).replace(/\n/g, ' '));
    const bas = Math.max(0, ...blocs.map((e) => e.getBoundingClientRect().bottom).filter((y) => y < r.bottom));
    out.push(`${i + 1} ${s.dataset.nom} lignes=${rows} vide=${Math.round(lim - bas)} coupé: ${coupes.slice(0, 3).join(' | ')}`);
  });
  return out;
});
console.log(m.join('\n'));
await nav.close();
