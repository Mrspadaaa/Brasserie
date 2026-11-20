// DC-1 : étude d'une pièce — pourquoi la boîte du papier ne grandit pas (densités des bandes voisines, seuils). Bancs seulement, jamais dans l'app.
import { boiteGrandie, encreDetaillee, trouverPapierDetaille } from '../../../../../src/services/decoupe';

const EMPTY = 0.003;
(window as any).__etude = async (b64: string, type: string) => {
  const image = await createImageBitmap(new Blob([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], { type }));
  const s = Math.min(1, 1200 / Math.min(image.width, image.height)), w = Math.max(1, Math.round(image.width * s)), h = Math.max(1, Math.round(image.height * s));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true })!; x.drawImage(image, 0, 0, w, h);
  const rgba = x.getImageData(0, 0, w, h).data, gray = new Uint8Array(w * h);
  for (let i = 0, j = 0; i < gray.length; i++, j += 4) gray[i] = (rgba[j] * 77 + rgba[j + 1] * 150 + rgba[j + 2] * 29) >> 8;
  const bitmap = { width: w, height: h, gray };
  const { papier, raison } = trouverPapierDetaille(bitmap);
  if (!papier) return { raison };
  const e = encreDetaillee(bitmap, papier);
  const g = boiteGrandie(papier, e.ink, w, h, e.pas, e.coupe);
  const dens = (carte: Uint8Array, y0: number, y1: number, x0: number, x1: number) => { let n = 0; for (let y = Math.max(0, y0); y < Math.min(h, y1); y++) for (let xx = x0; xx < x1; xx++) n += carte[y * w + xx]; return n / Math.max(1, (Math.min(h, y1) - Math.max(0, y0)) * (x1 - x0)); };
  const b = papier.boite, d = Math.max(8, Math.round(2 * (e.pas ?? Math.max(w, h) / 60)));
  const bandes = (yy: number, sens: number) => { const out: any[] = []; for (let k = 0; k < 6; k++) { const a = sens < 0 ? yy - d * (k + 1) : yy + d * k, z = a + d; const prof: number[] = []; for (let y = Math.max(0, a); y < Math.min(h, z); y++) { let n = 0; for (let xx = b.x; xx < b.x + b.w; xx++) n += e.coupe[y * w + xx]; prof.push(n / b.w); } out.push({ a, nette: +dens(e.ink, a, z, b.x, b.x + b.w).toFixed(4), sensible: +dens(e.coupe, a, z, b.x, b.x + b.w).toFixed(4), encrees: +(prof.filter(v => v > EMPTY).length / Math.max(1, prof.length)).toFixed(2) }); } return out; };
  let encre = 0, aire = 0;
  for (let by = 0; by < papier.bh; by++) { const l = papier.intervalles[2 * by], r = papier.intervalles[2 * by + 1]; if (r < l) continue; encre += dens(e.ink, by * papier.f, (by + 1) * papier.f, l * papier.f, (r + 1) * papier.f) * (r + 1 - l); aire += r + 1 - l; }
  const dPap = aire ? encre / aire : 0;
  return { w, h, boite: b, grandie: g, pas: e.pas, seuil: e.seuil, d, densitePapierNette: +dPap.toFixed(4), seuilNet: Math.max(0.008, 0.25 * dPap), haut: bandes(b.y, -1), bas: bandes(b.y + b.h, 1) };
};
(window as any).__pret = true;

/** Sauvola (1999) par images intégrales : seuil T = m (1 + k (s / R − 1)) sur une fenêtre carrée de côté 2·demi + 1 ; un pixel de gris < T est de l'encre. */
function sauvola(gris: Uint8Array, w: number, h: number, demi: number, k: number, R = 128): Uint8Array {
  const W1 = w + 1, S = new Float64Array(W1 * (h + 1)), Q = new Float64Array(W1 * (h + 1));
  for (let y = 0; y < h; y++) { let ls = 0, lq = 0; for (let x = 0; x < w; x++) { const v = gris[y * w + x]; ls += v; lq += v * v; S[(y + 1) * W1 + x + 1] = S[y * W1 + x + 1] + ls; Q[(y + 1) * W1 + x + 1] = Q[y * W1 + x + 1] + lq; } }
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - demi), y1 = Math.min(h, y + demi + 1);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - demi), x1 = Math.min(w, x + demi + 1), n = (x1 - x0) * (y1 - y0);
      const s = S[y1 * W1 + x1] - S[y0 * W1 + x1] - S[y1 * W1 + x0] + S[y0 * W1 + x0], q = Q[y1 * W1 + x1] - Q[y0 * W1 + x1] - Q[y1 * W1 + x0] + Q[y0 * W1 + x0];
      const m = s / n, sd = Math.sqrt(Math.max(0, q / n - m * m));
      out[y * w + x] = gris[y * w + x] < m * (1 + k * (sd / R - 1)) ? 1 : 0;
    }
  }
  return out;
}
(window as any).__sauvola = async (b64: string, type: string) => {
  const image = await createImageBitmap(new Blob([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], { type }));
  const s = Math.min(1, 1200 / Math.min(image.width, image.height)), w = Math.max(1, Math.round(image.width * s)), h = Math.max(1, Math.round(image.height * s));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true })!; x.drawImage(image, 0, 0, w, h);
  const rgba = x.getImageData(0, 0, w, h).data, gray = new Uint8Array(w * h);
  for (let i = 0, j = 0; i < gray.length; i++, j += 4) gray[i] = (rgba[j] * 77 + rgba[j + 1] * 150 + rgba[j + 2] * 29) >> 8;
  const { papier } = trouverPapierDetaille({ width: w, height: h, gray });
  const e = encreDetaillee({ width: w, height: h, gray }, papier);
  const out: any = { w, h, pas: e.pas };
  const x0 = Math.round(w * 0.1), x1 = Math.round(w * 0.9), pas = e.pas ?? 18;
  for (const k of [0.05, 0.1, 0.2]) {
    const t0 = performance.now(), sv = sauvola(gray, w, h, Math.round(pas), k), ms = Math.round(performance.now() - t0);
    const bandes: number[] = [];
    for (let y = 0; y + 128 <= h; y += 128) { let n = 0; for (let yy = y; yy < y + 128; yy++) for (let xx = x0; xx < x1; xx++) n += sv[yy * w + xx]; bandes.push(+(1000 * n / (128 * (x1 - x0))).toFixed(1)); }
    out['k' + k] = { ms, bandes };
  }
  const nette: number[] = [];
  for (let y = 0; y + 128 <= h; y += 128) { let n = 0; for (let yy = y; yy < y + 128; yy++) for (let xx = x0; xx < x1; xx++) n += e.coupe[yy * w + xx]; nette.push(+(1000 * n / (128 * (x1 - x0))).toFixed(1)); }
  out.nette = nette;
  return out;
};

/** Périodicité des lignes : profil des rangées (gris moyen sur les colonnes [x0, x1)), tendance retirée (moyenne glissante de 3 pas), autocorrélation normalisée
 *  maximale pour un décalage de 0,8 à 1,25 pas, par fenêtre de `fen` rangées. Du texte : proche de 1 ; une table, un grain, un dégradé : proche de 0. */
function periodicite(gris: Uint8Array, w: number, h: number, x0: number, x1: number, pas: number, fen: number): { y: number; score: number }[] {
  const prof = new Float64Array(h);
  for (let y = 0; y < h; y++) { let s = 0; for (let x = x0; x < x1; x++) s += gris[y * w + x]; prof[y] = s / (x1 - x0); }
  const demi = Math.round(1.5 * pas), det = new Float64Array(h);
  for (let y = 0; y < h; y++) { let s = 0, n = 0; for (let t = Math.max(0, y - demi); t <= Math.min(h - 1, y + demi); t++) { s += prof[t]; n++; } det[y] = prof[y] - s / n; }
  const out: { y: number; score: number }[] = [];
  for (let y = 0; y + fen <= h; y += fen / 2) {
    let best = 0;
    for (let lag = Math.round(0.8 * pas); lag <= Math.round(1.25 * pas); lag++) {
      let sab = 0, saa = 0, sbb = 0;
      for (let t = y; t + lag < y + fen; t++) { const a = det[t], b = det[t + lag]; sab += a * b; saa += a * a; sbb += b * b; }
      if (saa > 1e-9 && sbb > 1e-9) best = Math.max(best, sab / Math.sqrt(saa * sbb));
    }
    out.push({ y, score: +best.toFixed(2) });
  }
  return out;
}
(window as any).__periode = async (b64: string, type: string) => {
  const image = await createImageBitmap(new Blob([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], { type }));
  const s = Math.min(1, 1200 / Math.min(image.width, image.height)), w = Math.max(1, Math.round(image.width * s)), h = Math.max(1, Math.round(image.height * s));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true })!; x.drawImage(image, 0, 0, w, h);
  const rgba = x.getImageData(0, 0, w, h).data, gray = new Uint8Array(w * h);
  for (let i = 0, j = 0; i < gray.length; i++, j += 4) gray[i] = (rgba[j] * 77 + rgba[j + 1] * 150 + rgba[j + 2] * 29) >> 8;
  const { papier } = trouverPapierDetaille({ width: w, height: h, gray });
  const e = encreDetaillee({ width: w, height: h, gray }, papier), pas = e.pas ?? 18;
  const b = papier?.boite ?? { x: 0, y: 0, w, h };
  const sc = periodicite(gray, w, h, b.x + Math.round(0.1 * b.w), b.x + Math.round(0.6 * b.w), pas, 4 * pas);
  return { w, h, pas, boite: b, scores: sc.filter((_, i) => i % 2 === 0).map(v => [v.y, v.score]) };
};

/** Rapport texte / vide : écart-type du profil de rangées (tendance retirée) sur les colonnes du texte divisé par celui de colonnes vides du même papier. */
(window as any).__rapport = async (b64: string, type: string) => {
  const image = await createImageBitmap(new Blob([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], { type }));
  const s = Math.min(1, 1200 / Math.min(image.width, image.height)), w = Math.max(1, Math.round(image.width * s)), h = Math.max(1, Math.round(image.height * s));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true })!; x.drawImage(image, 0, 0, w, h);
  const rgba = x.getImageData(0, 0, w, h).data, gray = new Uint8Array(w * h);
  for (let i = 0, j = 0; i < gray.length; i++, j += 4) gray[i] = (rgba[j] * 77 + rgba[j + 1] * 150 + rgba[j + 2] * 29) >> 8;
  const { papier } = trouverPapierDetaille({ width: w, height: h, gray });
  const e = encreDetaillee({ width: w, height: h, gray }, papier), pas = e.pas ?? 18;
  const b = papier?.boite ?? { x: 0, y: 0, w, h };
  const profil = (xa: number, xb: number) => { const p = new Float64Array(h); for (let y = 0; y < h; y++) { let sm = 0; for (let xx = xa; xx < xb; xx++) sm += gray[y * w + xx]; p[y] = sm / (xb - xa); } const d = new Float64Array(h), demi = Math.round(1.5 * pas); for (let y = 0; y < h; y++) { let sm = 0, n = 0; for (let t = Math.max(0, y - demi); t <= Math.min(h - 1, y + demi); t++) { sm += p[t]; n++; } d[y] = p[y] - sm / n; } return d; };
  const A = profil(b.x + Math.round(0.08 * b.w), b.x + Math.round(0.36 * b.w)), B = profil(b.x + Math.round(0.45 * b.w), b.x + Math.round(0.73 * b.w));
  const fen = 4 * pas, out: any[] = [];
  for (let y = 0; y + fen <= h; y += fen) { let sa = 0, sb = 0; for (let t = y; t < y + fen; t++) { sa += A[t] * A[t]; sb += B[t] * B[t]; } out.push([y, +(Math.sqrt(sa / fen)).toFixed(2), +(Math.sqrt(sb / fen)).toFixed(2)]); }
  return { w, h, pas, boite: b, r: out };
};
