// Bandes vides (en px CSS) du premier écran d'une capture, même règle que controle-panel (fond = couleur la plus fréquente).
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const p = await b.newPage();
for (const f of process.argv.slice(2)) {
  const r = await p.evaluate(async (url) => {
    const img = new Image(); await new Promise((ok) => { img.onload = ok; img.src = url; });
    const L = img.naturalWidth, H = Math.min(img.naturalHeight, Math.round((L * 844) / 390)), s = L / 390;
    const c = document.createElement('canvas'); c.width = L; c.height = H; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, L, H).data; const compte = new Map();
    for (let i = 0; i < d.length; i += 28) { const k = (d[i] >> 4) * 256 + (d[i + 1] >> 4) * 16 + (d[i + 2] >> 4); compte.set(k, (compte.get(k) || 0) + 1); }
    const fond = [...compte.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const fr = ((fond >> 8) & 15) * 16 + 8, fg = ((fond >> 4) & 15) * 16 + 8, fb = (fond & 15) * 16 + 8;
    const vides = []; let debut = -1, pleines = 0;
    for (let y = 0; y < H; y++) {
      let diff = 0; for (let xx = 0; xx < L; xx++) { const i = (y * L + xx) * 4; if (Math.abs(d[i] - fr) + Math.abs(d[i + 1] - fg) + Math.abs(d[i + 2] - fb) > 60) diff++; }
      const pl = diff / L > 0.02; if (pl) pleines++;
      if (!pl && debut < 0) debut = y; if (pl && debut >= 0) { if (y - debut > 6 * s) vides.push([Math.round(debut / s), Math.round((y - debut) / s)]); debut = -1; }
    }
    if (debut >= 0) vides.push([Math.round(debut / s), Math.round((H - debut) / s)]);
    return { fond: [fr, fg, fb], fill: pleines / H, vides };
  }, `data:image/png;base64,${fs.readFileSync(f).toString('base64')}`);
  console.log(f.split(/[\\/]/).pop(), r.fond.join(','), r.fill.toFixed(3), JSON.stringify(r.vides));
}
await b.close();
