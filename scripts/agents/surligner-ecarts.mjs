// Met en valeur ce qui change entre une capture de référence et une variante (16.11 : « Met en valeur les changements,
// genre avec un rectangle rouge »). Diff d'images par cases, tolérant aux décalages verticaux (une rangée descendue
// de 24 px n'est pas un changement) ; composantes connexes des cases changées ; un rectangle rouge par zone.
// node scripts/agents/surligner-ecarts.mjs <ref.png> <variante.png> <sortie.webp|png> [--case 12] [--decalage 48]
// Sortie : « ECARTS n zones » ; 0 zone = aucune différence visible.
import fs from 'fs'; import path from 'path'; import { createRequire } from 'module';
const req = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = req('puppeteer-core');
const a = process.argv.slice(2); const opt = (k, d) => { const i = a.indexOf(k); return i >= 0 ? Number(a[i + 1]) : d; };
const [ref, vari, out] = a.filter((x, i) => !x.startsWith('--') && !(a[i - 1] || '').startsWith('--'));
if (!out) { console.log('usage : <ref.png> <variante.png> <sortie>'); process.exit(2); }
const CASE = opt('--case', 12), DEC = opt('--decalage', 48);
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await nav.newPage();
const r = await p.evaluate(async (r64, v64, CASE, DEC, webp) => {
  const charge = async (s) => { const i = new Image(); i.src = 'data:image/png;base64,' + s; await i.decode(); const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); return { c, x, w: i.width, h: i.height, d: x.getImageData(0, 0, i.width, i.height).data }; };
  const R = await charge(r64), V = await charge(v64);
  const W = V.w, H = V.h, cw = Math.ceil(W / CASE), ch = Math.ceil(H / CASE);
  const px = (I, x, y) => (y < 0 || y >= I.h || x >= I.w) ? -1 : (y * I.w + x) * 4;
  // une case de la variante est inchangée si la même case de la référence, décalée de dy (|dy| ≤ DEC), lui ressemble
  const pareil = (cx, cy, dy) => { let bad = 0; for (let y = cy * CASE; y < Math.min(H, cy * CASE + CASE); y++) for (let x = cx * CASE; x < Math.min(W, cx * CASE + CASE); x++) { const i = px(V, x, y), j = px(R, x, y + dy); if (j < 0) return false; const dd = Math.abs(V.d[i] - R.d[j]) + Math.abs(V.d[i + 1] - R.d[j + 1]) + Math.abs(V.d[i + 2] - R.d[j + 2]); if (dd > 48 && ++bad > 3) return false; } return true; };
  const ch2 = new Uint8Array(cw * ch); let derniers = 0;
  for (let cy = 0; cy < ch; cy++) for (let cx = 0; cx < cw; cx++) {
    if (pareil(cx, cy, 0) || pareil(cx, cy, derniers)) continue;
    let ok = false; for (let k = 1; k <= DEC && !ok; k++) { if (pareil(cx, cy, k)) { ok = true; derniers = k; } else if (pareil(cx, cy, -k)) { ok = true; derniers = -k; } }
    if (!ok) ch2[cy * cw + cx] = 1;
  }
  // composantes connexes (8 voisins, avec un pont d'une case)
  const vu = new Uint8Array(cw * ch), zones = [];
  for (let s = 0; s < cw * ch; s++) { if (!ch2[s] || vu[s]) continue; const pile = [s]; vu[s] = 1; let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, n = 0;
    while (pile.length) { const t = pile.pop(), tx = t % cw, ty = (t / cw) | 0; n++; x0 = Math.min(x0, tx); y0 = Math.min(y0, ty); x1 = Math.max(x1, tx); y1 = Math.max(y1, ty);
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const nx = tx + dx, ny = ty + dy; if (nx < 0 || ny < 0 || nx >= cw || ny >= ch) continue; const u = ny * cw + nx; if (ch2[u] && !vu[u]) { vu[u] = 1; pile.push(u); } } }
    if (n >= 2) zones.push([x0 * CASE, y0 * CASE, (x1 + 1) * CASE, (y1 + 1) * CASE]); }
  // fusion des rectangles qui se chevauchent
  let fus = true; while (fus) { fus = false; for (let i = 0; i < zones.length && !fus; i++) for (let j = i + 1; j < zones.length && !fus; j++) { const A = zones[i], B = zones[j]; if (A[0] <= B[2] + 8 && B[0] <= A[2] + 8 && A[1] <= B[3] + 8 && B[1] <= A[3] + 8) { zones[i] = [Math.min(A[0], B[0]), Math.min(A[1], B[1]), Math.max(A[2], B[2]), Math.max(A[3], B[3])]; zones.splice(j, 1); fus = true; } } }
  const x = V.x, e = Math.max(4, Math.round(W / 200)); x.lineWidth = e; x.strokeStyle = '#e0201b'; x.shadowColor = '#fff'; x.shadowBlur = 0;
  for (const [a0, b0, a1, b1] of zones) { const m = e + 2; x.strokeStyle = '#fff'; x.lineWidth = e + 4; x.strokeRect(Math.max(e, a0 - m), Math.max(e, b0 - m), Math.min(W - 2 * e, a1 - a0 + 2 * m), Math.min(H - 2 * e, b1 - b0 + 2 * m)); x.strokeStyle = '#e0201b'; x.lineWidth = e; x.strokeRect(Math.max(e, a0 - m), Math.max(e, b0 - m), Math.min(W - 2 * e, a1 - a0 + 2 * m), Math.min(H - 2 * e, b1 - b0 + 2 * m)); }
  return { n: zones.length, zones, img: V.c.toDataURL(webp ? 'image/webp' : 'image/png', 0.86).split(',')[1] };
}, fs.readFileSync(ref).toString('base64'), fs.readFileSync(vari).toString('base64'), CASE, DEC, out.endsWith('.webp'));
await nav.close();
fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, Buffer.from(r.img, 'base64'));
console.log(`ECARTS ${r.n} zones ${path.basename(vari)} → ${out}${r.n ? ' : ' + r.zones.map((z) => z.join(',')).join(' ; ') : ''}`);
