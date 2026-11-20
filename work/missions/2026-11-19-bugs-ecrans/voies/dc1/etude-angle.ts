// DC-1b : étude de l'angle. Pour une pièce : l'angle estimé sur l'encre nette (actuel) et sur d'autres cartes, au même recadrage que `analyser`. Bancs seulement.
import { sansTraitsHorizontaux, encreDetaillee, estimerAngle, recadrageSur, normaliser, trouverPapierDetaille } from '../../../../../src/services/decoupe';

(window as any).__angleEtude = async (b64: string, type: string) => {
  const image = await createImageBitmap(new Blob([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], { type }));
  const s = Math.min(1, 1200 / Math.min(image.width, image.height)), W = Math.max(1, Math.round(image.width * s)), H = Math.max(1, Math.round(image.height * s));
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d', { willReadFrequently: true })!; x.drawImage(image, 0, 0, W, H);
  const rgba = x.getImageData(0, 0, W, H).data, gray = new Uint8Array(W * H);
  for (let i = 0, j = 0; i < gray.length; i++, j += 4) gray[i] = (rgba[j] * 77 + rgba[j + 1] * 150 + rgba[j + 2] * 29) >> 8;
  const bitmap = { width: W, height: H, gray }, papier = trouverPapierDetaille(bitmap).papier, clair = papier !== null;
  const e0 = encreDetaillee(bitmap, papier, 0, 0, clair);
  const crop = recadrageSur(papier, e0.ink, W, H, e0.pas, e0.coupe, gray);
  const e = crop.w === W && crop.h === H ? e0 : encreDetaillee({ width: crop.w, height: crop.h, gray: normaliser(gray, W, H, { crop, angle: 0 }) }, papier, crop.x, crop.y, clair);
  const part = (m: Uint8Array) => { let n = 0; for (let i = 0; i < m.length; i++) n += m[i]; return +(n / m.length).toFixed(4); };
  const t0 = performance.now();
  const ink = estimerAngle(e.ink, crop.w, crop.h, papier?.angle ?? null), t1 = performance.now();
  const coupe = estimerAngle(e.coupe, crop.w, crop.h, papier?.angle ?? null), t2 = performance.now();
  const sh = sansTraitsHorizontaux(e.coupe, crop.w, crop.h, Math.max(64, Math.round(crop.w / 2)));
  const a1 = estimerAngle(sh, crop.w, crop.h, papier?.angle ?? null), a2 = part(e.ink) < 0.03 ? a1 : ink;
  return { ink, coupe, a1, a2, partInk: part(e.ink), partCoupe: part(e.coupe), w: crop.w, h: crop.h, msInk: Math.round(t1 - t0), msCoupe: Math.round(t2 - t1) };
};
/** Les scores par colonne (carte `ink` ou `coupe`) à chaque angle de -3 à 3 par 0,25, divisés par le score à 0°. */
(window as any).__angleColonnes = async (b64: string, type: string, carte: string) => {
  const image = await createImageBitmap(new Blob([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], { type }));
  const s = Math.min(1, 1200 / Math.min(image.width, image.height)), W = Math.max(1, Math.round(image.width * s)), H = Math.max(1, Math.round(image.height * s));
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d', { willReadFrequently: true })!; x.drawImage(image, 0, 0, W, H);
  const rgba = x.getImageData(0, 0, W, H).data, gray = new Uint8Array(W * H);
  for (let i = 0, j = 0; i < gray.length; i++, j += 4) gray[i] = (rgba[j] * 77 + rgba[j + 1] * 150 + rgba[j + 2] * 29) >> 8;
  const bitmap = { width: W, height: H, gray }, papier = trouverPapierDetaille(bitmap).papier, clair = papier !== null;
  const e0 = encreDetaillee(bitmap, papier, 0, 0, clair);
  const crop = recadrageSur(papier, e0.ink, W, H, e0.pas, e0.coupe, gray);
  const e = crop.w === W && crop.h === H ? e0 : encreDetaillee({ width: crop.w, height: crop.h, gray: normaliser(gray, W, H, { crop, angle: 0 }) }, papier, crop.x, crop.y, clair);
  const w = crop.w, hh = crop.h, m = carte === 'ink' ? e.ink : e.coupe, colonnes = Math.max(1, Math.round(w / 250));
  const bacs = Math.ceil(Math.hypot(w, hh)) + 4, dec = Math.hypot(w, hh) / 2;
  const sc = (d: number) => {
    const rad = d * Math.PI / 180, sn = Math.sin(rad), co = Math.cos(rad), p = new Float64Array(bacs * colonnes), masse = new Float64Array(colonnes);
    for (let y = 0; y < hh; y++) for (let x2 = 0; x2 < w; x2++) if (m[y * w + x2]) { const k = Math.min(colonnes - 1, Math.floor(x2 * colonnes / w)); p[Math.floor(-(x2 - w / 2) * sn + (y - hh / 2) * co + dec) * colonnes + k]++; masse[k]++; }
    const t = new Float64Array(colonnes); for (let i = 0; i < p.length; i++) t[i % colonnes] += p[i] * p[i];
    return { t, masse };
  };
  const s0 = sc(0), out: string[] = [];
  for (let a = -3; a <= 3.001; a += 0.25) { const r = sc(a); out.push(a.toFixed(2) + ' ' + Array.from(r.t).map((v, k) => (v / s0.t[k]).toFixed(3)).join(' ')); }
  return { w, hh, colonnes, masses: Array.from(s0.masse), lignes: out };
};
(window as any).__pret = true;
