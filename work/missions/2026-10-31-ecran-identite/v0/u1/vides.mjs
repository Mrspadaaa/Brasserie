// Bandes vides du premier écran (même règle que controle-panel : > 60 d'écart RVB au fond, > 2 % de la ligne).
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const p = await b.newPage();
for (const f of process.argv.slice(2)) {
  const r = await p.evaluate(async (url) => {
    const img = new Image(); await new Promise((ok) => { img.onload = ok; img.src = url; });
    const L = img.naturalWidth, H = Math.min(img.naturalHeight, Math.round(L * 844 / 390));
    const c = document.createElement('canvas'); c.width = L; c.height = H; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, L, H).data;
    const compte = new Map();
    for (let i = 0; i < d.length; i += 28) { const k = (d[i] >> 4) * 256 + (d[i + 1] >> 4) * 16 + (d[i + 2] >> 4); compte.set(k, (compte.get(k) || 0) + 1); }
    const fond = [...compte.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const fr = ((fond >> 8) & 15) * 16 + 8, fg = ((fond >> 4) & 15) * 16 + 8, fb = (fond & 15) * 16 + 8;
    let pleines = 0; const vides = []; let debut = -1;
    for (let y = 0; y < H; y++) {
      let diff = 0;
      for (let xx = 0; xx < L; xx++) { const i = (y * L + xx) * 4; if (Math.abs(d[i] - fr) + Math.abs(d[i + 1] - fg) + Math.abs(d[i + 2] - fb) > 60) diff++; }
      const plein = diff / L > 0.02; if (plein) pleines++;
      if (!plein && debut < 0) debut = y; if (plein && debut >= 0) { if (y - debut >= 10) vides.push(`${debut}-${y}`); debut = -1; }
    }
    if (debut >= 0) vides.push(`${debut}-${H}`);
    return { r: (pleines / H).toFixed(2), vides: vides.join(' ') };
  }, `data:image/png;base64,${fs.readFileSync(f).toString('base64')}`);
  console.log(f.split(/[\\/]/).pop(), r.r, r.vides);
}
await b.close();
