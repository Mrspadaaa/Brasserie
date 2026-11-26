import puppeteer from 'puppeteer-core';
import path from 'path'; import { pathToFileURL } from 'url';
const IMG = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-17-carnet-retouches/maquettes/page2/img/';
const groupes = { comparer: ['g01-8','v03-4','g05-8','h04-7','h06-7'], choisi: ['g05-11','v03-7','v09-3','g05-9'], articles: ['h03-5','h06-5','h01-6','h05-9'] };
const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
for (const [g, ids] of Object.entries(groupes)) {
  const p = await b.newPage(); await p.setViewport({ width: ids.length * 400, height: 900, deviceScaleFactor: 1 });
  const html = '<body style="margin:0;background:#333;display:flex;gap:10px;align-items:flex-start">' + ids.map(i => `<figure style="margin:0;width:390px;color:#fff;font:14px sans-serif"><div>${i}</div><img src="${pathToFileURL(IMG + i + '.webp').href}" style="width:390px"></figure>`).join('') + '</body>';
  const fh = path.resolve('figes', g + '.html'); (await import('fs')).writeFileSync(fh, html); await p.goto(pathToFileURL(fh).href); await new Promise(r => setTimeout(r, 600));
  const h = await p.evaluate(() => document.body.scrollHeight); await p.setViewport({ width: ids.length * 400, height: h, deviceScaleFactor: 1 });
  await p.screenshot({ path: path.join('figes', g + '.png') }); console.log(g, h); await p.close();
}
b.disconnect();
