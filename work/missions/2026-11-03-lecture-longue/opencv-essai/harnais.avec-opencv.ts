// D381, banc hors ligne : le VRAI plan de découpe de l'app (`planifierImage`) sur une pièce piégée, et la même transformation jouée sur son masque
// (plus proche voisin). Une ligne visuelle (couleur du masque) ne doit jamais être sur deux morceaux sans que la coupe soit signalée (`coupeForcee`),
// et aucune ligne ne doit disparaître du recadrage. Servi par Vite (copie de banc) ; piloté par `controler.mjs`.
import { analyser, papierDuCadre, boiteGrandie, coupeBasseForcee, normaliser, recadrageSur, decouperPiece, dessinerNormalise, encreDetaillee, planifierImage, planifierImageDetaille, trouverPapierDetaille } from '../../../../src/services/decoupe';
import { libererPerspective, redresser, zonesPerspective } from '../../../../src/services/decoupePerspective';
import { linePitch as linePitchDe, planJonctions } from '../../../../functions/src/invoiceMorceaux';

const decoder = async (b64: string, type: string) => createImageBitmap(new Blob([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], { type }));
const etiquettes = (data: Uint8ClampedArray) => { const e = new Uint32Array(data.length / 4); for (let i = 0, j = 0; i < e.length; i++, j += 4) e[i] = data[j] + data[j + 1] * 256; return e; };

// `voie` : `affine` (sans OpenCV), `cv` (OpenCV), `cv-ombre` (OpenCV, image d'analyse divisée par son fond).
(window as any).__controler = async (photo64: string, masque64: string, voie = 'cv') => {
  const photo = await decoder(photo64, 'image/jpeg'), masque = await decoder(masque64, 'image/png');
  const t0 = performance.now();
  const plan = await planifierImage(photo, true, { opencv: voie !== 'affine', sansOmbre: voie === 'cv-ombre' }), msPlan = Math.round(performance.now() - t0);
  // Les lignes du masque d'origine et leur aire.
  const c0 = document.createElement('canvas'); c0.width = masque.width; c0.height = masque.height;
  const x0 = c0.getContext('2d', { willReadFrequently: true })!; x0.drawImage(masque, 0, 0);
  const aire0 = new Map<number, number>();
  for (const id of etiquettes(x0.getImageData(0, 0, c0.width, c0.height).data)) if (id) aire0.set(id, (aire0.get(id) ?? 0) + 1);
  if (!plan) return { morceaux: 1, lignes: aire0.size, msPlan, rien: true };
  const { g, perspective: p, finale } = plan;
  // Le masque normalisé (même géométrie que le dessin des morceaux), calculé ici au plus proche voisin EXACT : le canevas du navigateur, même sans lissage,
  // mêle les couleurs d'étiquettes sous une petite rotation (03.11 : des lignes « fantômes » à mille rangées de leur place). Voie OpenCV : la matrice
  // sortie → source de `warpPerspective` (centres de pixels aux entiers, arrondi au plus proche, comme INTER_NEAREST).
  const L = p ? p.largeur : g!.largeur, Hn = p ? p.hauteur : g!.hauteur;
  const e0 = etiquettes(x0.getImageData(0, 0, c0.width, c0.height).data), e = new Uint32Array(L * Hn);
  if (p) {
    const m = p.versSource;
    for (let v = 0; v < Hn; v++) for (let u = 0; u < L; u++) {
      const z = m[6] * u + m[7] * v + m[8], sx = Math.round((m[0] * u + m[1] * v + m[2]) / z), sy = Math.round((m[3] * u + m[4] * v + m[5]) / z);
      if (sx >= 0 && sx < c0.width && sy >= 0 && sy < c0.height) e[v * L + u] = e0[sy * c0.width + sx];
    }
  } else {
    const rad = g!.angle * Math.PI / 180, co = Math.cos(rad), si = Math.sin(rad);
    for (let v = 0; v < Hn; v++) {
      const dy = (v + 0.5 - Hn / 2) / g!.echelle;
      for (let u = 0; u < L; u++) {
        const dx = (u + 0.5 - L / 2) / g!.echelle;
        const sx = Math.floor(g!.cx + dx * co - dy * si), sy = Math.floor(g!.cy + dx * si + dy * co);
        if (sx >= 0 && sx < c0.width && sy >= 0 && sy < c0.height) e[v * L + u] = e0[sy * c0.width + sx];
      }
    }
  }
  const rangs = new Map<number, number[]>(), aire = new Map<number, number>();
  for (let y = 0; y < Hn; y++) {
    const vus = new Set<number>();
    for (let x = 0; x < L; x++) { const id = e[y * L + x]; if (id) { vus.add(id); aire.set(id, (aire.get(id) ?? 0) + 1); } }
    for (const id of vus) { const l = rangs.get(id) ?? []; l.push(y); rangs.set(id, l); }
  }
  const m = finale.morceaux, coupes = m.slice(0, -1).map(b => b.bottom);
  const forcees = m.map((b, i) => coupeBasseForcee(b, finale.rangees, i === m.length - 1));
  // Une ligne coupée : des rangées des deux côtés d'une coupe, au moins 25 % de sa hauteur de chaque côté (un bord d'un pixel ne compte pas).
  const coupees: Array<{ ligne: number; coupe: number; signalee: boolean }> = [];
  for (const [id, ys] of rangs) coupes.forEach((cut, i) => {
    const haut = ys.filter(y => y < cut).length, bas = ys.length - haut;
    if (Math.min(haut, bas) >= Math.max(1, 0.25 * ys.length)) coupees.push({ ligne: id - 1, coupe: i + 1, signalee: forcees[i] });
  });
  // Une ligne perdue ou rognée : absente du masque normalisé, ou moins de 80 % de son aire (à l'échelle près).
  // L'échelle des aires : celle du dessin, ou, redressé par ses coins, l'aire du papier en sortie sur son aire dans la photo.
  const aireQuad = (q: number[]) => { let a = 0; for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; a += q[2 * i] * q[2 * j + 1] - q[2 * j] * q[2 * i + 1]; } return Math.abs(a) / 2; };
  const e2 = p ? (p.interieur.w * p.interieur.h) / aireQuad(p.quad) : g!.echelle * g!.echelle, perdues: number[] = [], rognees: number[] = [];
  for (const [id, a] of aire0) { const b = aire.get(id) ?? 0; if (!b) perdues.push(id - 1); else if (b < 0.8 * a * e2) rognees.push(id - 1); }
  return {
    morceaux: m.length, lignes: aire0.size, msPlan, voie: p ? 'opencv' : 'affine', raison: plan.raison, angleGeo: p ? null : g!.angle, echelle: Math.sqrt(e2), largeur: L, hauteur: Hn,
    quad: p?.quad ?? null, msChargement: p?.msChargement ?? null, msDetection: p?.msDetection ?? null,
    forcees: forcees.filter(Boolean).length, jonctions: planJonctions(m, finale.rangees).length,
    coupeesSilencieuses: coupees.filter(x => !x.signalee).map(x => ({ ...x, rangees: [Math.min(...rangs.get(x.ligne + 1)!), Math.max(...rangs.get(x.ligne + 1)!)], cut: coupes[x.coupe - 1] })), coupeesSignalees: coupees.filter(x => x.signalee).length, perdues, rognees,
  };
};
(window as any).__pret = true;

/** D381 : une vraie pièce (sans masque) dans la VRAIE découpe de l'app : déclencheur sans `force`, géométrie, morceaux et bandes (images JPEG). */
(window as any).__plan = async (b64: string, type: string, force = false, opencv = true) => {
  const blob = new Blob([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], { type });
  const image = await createImageBitmap(blob);
  const t0 = performance.now();
  const plan = await planifierImageDetaille(image, force, { opencv }), msPlan = Math.round(performance.now() - t0);
  const t1 = performance.now();
  const decoupe = await decouperPiece(blob, { force });
  const msDecoupe = Math.round(performance.now() - t1);
  let normalise: string | null = null;
  if (plan?.perspective) normalise = (await zonesPerspective(plan.perspective, [[0, plan.perspective.hauteur]], 0.8))[0];
  else if (plan?.g) { const c = document.createElement('canvas'); c.width = plan.g.largeur; c.height = plan.g.hauteur; dessinerNormalise(c, image, plan.g, 0); const d = c.toDataURL('image/jpeg', 0.8); normalise = d.slice(d.indexOf(',') + 1); }
  return {
    normalise, largeur: image.width, hauteur: image.height, msPlan, msDecoupe, g: plan?.g ?? null, raison: plan?.raison ?? null, quad: plan?.perspective?.quad ?? null, sortie: plan?.perspective ? [plan.perspective.largeur, plan.perspective.hauteur] : null, morceaux: plan?.finale.morceaux ?? null, papierFinal: plan?.finale.papier ?? null, colonnes: plan?.finale.colonnes ?? null,
    pas: plan ? linePitchDe(plan.finale.rangees) : null, minCoupes: plan ? plan.finale.morceaux.slice(0, -1).map(m => { let v = 1; for (let y = Math.max(0, m.bottom - 30); y < Math.min(plan.finale.rangees.length, m.bottom + 30); y++) v = Math.min(v, plan.finale.rangees[y]); return Number(v.toFixed(4)); }) : null,
    parties: decoupe?.parties.map(p => ({ k: p.morceau.k, n: p.morceau.n, coupeForcee: p.coupeForcee, data: p.file.data })) ?? null,
    jonctions: decoupe?.jonctions.map(j => ('sautDePage' in j ? { k: j.k, sautDePage: true } : { k: j.jonction.k, data: j.file.data })) ?? null,
  };
};

/** D381 : pourquoi le papier d'une vraie pièce est trouvé ou refusé, et ses cartes d'encre (nette, sensible) en PNG, sur l'image réduite de l'app. */
(window as any).__diagPapier = async (b64: string, type: string) => {
  const image = await createImageBitmap(new Blob([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], { type }));
  const s = Math.min(1, 1200 / Math.min(image.width, image.height)), w = Math.max(1, Math.round(image.width * s)), h = Math.max(1, Math.round(image.height * s));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true })!; x.drawImage(image, 0, 0, w, h);
  const rgba = x.getImageData(0, 0, w, h).data, gray = new Uint8Array(w * h);
  for (let i = 0, j = 0; i < gray.length; i++, j += 4) gray[i] = (rgba[j] * 77 + rgba[j + 1] * 150 + rgba[j + 2] * 29) >> 8;
  const bitmap = { width: w, height: h, gray }, { papier, raison } = trouverPapierDetaille(bitmap), e = encreDetaillee(bitmap, papier);
  const grandie = papier ? boiteGrandie(papier, e.ink, w, h, e.pas, e.coupe) : null, a = analyser(bitmap);
  const png = (carte: Uint8Array) => {
    const d = x.createImageData(w, h);
    for (let i = 0, j = 0; i < carte.length; i++, j += 4) { const v = carte[i] ? 0 : 255; d.data[j] = d.data[j + 1] = d.data[j + 2] = v; d.data[j + 3] = 255; }
    x.putImageData(d, 0, 0); const u = c.toDataURL('image/png'); return u.slice(u.indexOf(',') + 1);
  };
  return { w, h, raison, boite: papier?.boite ?? null, grandie, rapport: papier?.rapport ?? null, anglePapier: papier?.angle ?? null, fond: papier?.fond ?? null, crop: a.crop, angle: a.angle, pas: e.pas, seuil: e.seuil, ink: png(e.ink), coupe: png(e.coupe) };
};

/** D381 : la passe finale d'une vraie pièce : l'image normalisée (fond noir), son papier, sa boîte grandie et sa carte des coupes en PNG, le profil. */
(window as any).__diagFinal = async (b64: string, type: string) => {
  const image = await createImageBitmap(new Blob([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], { type }));
  const plan = await planifierImageDetaille(image, true, { opencv: false });
  if (!plan?.g) return null;
  const { finale } = plan, g = plan.g, w = g.largeur, h = g.hauteur;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = dessinerNormalise(c, image, g, 0);
  const rgba = x.getImageData(0, 0, w, h).data, gray = new Uint8Array(w * h);
  for (let i = 0, j = 0; i < gray.length; i++, j += 4) gray[i] = (rgba[j] * 77 + rgba[j + 1] * 150 + rgba[j + 2] * 29) >> 8;
  const bitmap = { width: w, height: h, gray }, { papier, raison } = trouverPapierDetaille(bitmap), e = encreDetaillee(bitmap, papier);
  const b = papier ? boiteGrandie(papier, e.ink, w, h, e.pas, e.coupe) : null;
  x.setTransform(1, 0, 0, 1, 0, 0);
  const d = x.createImageData(w, h);
  for (let i = 0, j = 0; i < e.coupe.length; i++, j += 4) { const v = e.coupe[i] ? 0 : 255; d.data[j] = d.data[j + 1] = d.data[j + 2] = v; d.data[j + 3] = 255; }
  x.putImageData(d, 0, 0);
  x.lineWidth = 3;
  if (papier) {
    x.strokeStyle = '#f00'; x.strokeRect(papier.boite.x, papier.boite.y, papier.boite.w, papier.boite.h);
    x.fillStyle = 'rgba(255,0,0,0.6)';
    for (let by = 0; by < papier.bh; by++) { const l = papier.intervalles[2 * by], r = papier.intervalles[2 * by + 1]; if (r >= l) { x.fillRect(l * papier.f, by * papier.f, 3, papier.f); x.fillRect((r + 1) * papier.f - 3, by * papier.f, 3, papier.f); } }
  }
  if (b) { x.strokeStyle = '#00f'; x.strokeRect(b.x, b.y, b.w, b.h); }
  const u = c.toDataURL('image/png');
  const encrees = finale.rangees.filter(v => v > 0.004).length;
  const profil = Array.from({ length: Math.ceil(h / 8) }, (_, k) => Number(Math.min(...finale.rangees.slice(8 * k, 8 * k + 8)).toFixed(3)));
  return { w, h, raison, boite: papier?.boite ?? null, f: papier?.f ?? null, rapport: papier?.rapport ?? null, grandie: b, pasEncre: e.pas, seuil: e.seuil, encrees: encrees / h, colonnes: finale.colonnes, profil, png: u.slice(u.indexOf(',') + 1) };
};

/** D381 : la voie OpenCV d'une pièce, sans garde-fou : l'image redressée, sa carte des coupes (papier en rouge, boîte grandie en bleu) en PNG. */
(window as any).__diagCv = async (b64: string, type: string) => {
  const image = await createImageBitmap(new Blob([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], { type }));
  const r = await redresser(image);
  if ('raison' in r) return { raison: r.raison };
  const { p, gray } = r, w = p.largeur, h = p.hauteur, papier = papierDuCadre(p.interieur, w, h);
  const a = analyser({ width: w, height: h, gray }, { papier, redresser: false, recadrer: false }), e = encreDetaillee({ width: w, height: h, gray }, papier);
  const c = document.createElement('canvas'); c.width = 2 * w; c.height = h;
  const x = c.getContext('2d')!, d = x.createImageData(2 * w, h);
  for (let y = 0; y < h; y++) for (let u = 0; u < w; u++) {
    const i = y * w + u, j = 4 * (y * 2 * w + u), k = j + 4 * w, v = e.coupe[i] ? 0 : 255;
    d.data[j] = d.data[j + 1] = d.data[j + 2] = gray[i]; d.data[k] = d.data[k + 1] = d.data[k + 2] = v; d.data[j + 3] = d.data[k + 3] = 255;
  }
  x.putImageData(d, 0, 0); x.lineWidth = 3;
  x.strokeStyle = '#f00'; x.strokeRect(w + p.interieur.x, p.interieur.y, p.interieur.w, p.interieur.h);
  if (a.boiteTexte) { x.strokeStyle = '#00f'; x.strokeRect(w + a.boiteTexte.x, a.boiteTexte.y, a.boiteTexte.w, a.boiteTexte.h); }
  const u = c.toDataURL('image/png');
  await libererPerspective();
  return { raison: p.methode, quad: p.quad, w, h, interieur: p.interieur, boiteTexte: a.boiteTexte, colonnes: a.colonnes, seuil: e.seuil, pas: e.pas, morceaux: a.morceaux.length, png: u.slice(u.indexOf(',') + 1) };
};

/** D381 : les scores de l'angle (profil global, profil par colonnes de 250 px) de -5° à 5°, sur l'encre nette du recadrage du premier coup d'œil. */
(window as any).__diagAngle = async (b64: string, type: string) => {
  const image = await createImageBitmap(new Blob([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], { type }));
  const s = Math.min(1, 1200 / Math.min(image.width, image.height)), W = Math.max(1, Math.round(image.width * s)), H = Math.max(1, Math.round(image.height * s));
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d', { willReadFrequently: true })!; x.drawImage(image, 0, 0, W, H);
  const rgba = x.getImageData(0, 0, W, H).data, gray = new Uint8Array(W * H);
  for (let i = 0, j = 0; i < gray.length; i++, j += 4) gray[i] = (rgba[j] * 77 + rgba[j + 1] * 150 + rgba[j + 2] * 29) >> 8;
  const bitmap = { width: W, height: H, gray }, papier = trouverPapierDetaille(bitmap).papier, e0 = encreDetaillee(bitmap, papier);
  const crop = recadrageSur(papier, e0.ink, W, H, e0.pas, e0.coupe);
  const e = encreDetaillee({ width: crop.w, height: crop.h, gray: normaliser(gray, W, H, { crop, angle: 0 }) }, papier, crop.x, crop.y), w = crop.w, hh = crop.h, ink = e.ink;
  const colonnes = Math.max(1, Math.round(w / 250)), xs: number[] = [], ys: number[] = [], cs: number[] = [];
  for (let y = 0; y < hh; y++) for (let x2 = 0; x2 < w; x2++) if (ink[y * w + x2]) { xs.push(x2 - w / 2); ys.push(y - hh / 2); cs.push(Math.min(colonnes - 1, Math.floor(x2 * colonnes / w))); }
  const bacs = Math.ceil(Math.hypot(w, hh)) + 4, dec = Math.hypot(w, hh) / 2;
  const score = (d: number, k: number) => { const rad = d * Math.PI / 180, sn = Math.sin(rad), co = Math.cos(rad), p = new Float64Array(bacs * k); for (let i = 0; i < xs.length; i++) p[Math.floor(-xs[i] * sn + ys[i] * co + dec) * k + (k > 1 ? cs[i] : 0)]++; let t = 0; for (const v of p) t += v * v; return t; };
  const lignes: string[] = [];
  const g0 = score(0, 1), c0 = score(0, colonnes);
  for (let a = -5; a <= 5.001; a += 0.25) lignes.push(a.toFixed(2) + ' ' + (score(a, 1) / g0).toFixed(3) + ' ' + (score(a, colonnes) / c0).toFixed(3));
  return { W, H, crop, colonnes, encre: xs.length, papier: papier?.boite ?? null, lignes };
};
