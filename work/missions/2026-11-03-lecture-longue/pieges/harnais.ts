// D381, banc hors ligne : le VRAI plan de découpe de l'app (`planifierImage`) sur une pièce piégée, et la même transformation jouée sur son masque
// (plus proche voisin). Une ligne visuelle (couleur du masque) ne doit jamais être sur deux morceaux sans que la coupe soit signalée (`coupeForcee`),
// et aucune ligne ne doit disparaître du recadrage. Servi par Vite (copie de banc) ; piloté par `controler.mjs`.
import { analyser, boiteGrandie, coupeBasseForcee, decoupeAvant, lignesDeTexte, normaliser, recadrageSur, decouperPiece, dessinerNormalise, encreDetaillee, planifierImage, planifierImageDetaille, trouverPapierDetaille } from '../../../../src/services/decoupe';
import { jonctionConcorde, linePitch as linePitchDe, planJonctions } from '../../../../functions/src/invoiceMorceaux';

const decoder = async (b64: string, type: string) => createImageBitmap(new Blob([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], { type }));
const etiquettes = (data: Uint8ClampedArray) => { const e = new Uint32Array(data.length / 4); for (let i = 0, j = 0; i < e.length; i++, j += 4) e[i] = data[j] + data[j + 1] * 256; return e; };

(window as any).__controler = async (photo64: string, masque64: string, verite: any = null) => {
  const photo = await decoder(photo64, 'image/jpeg'), masque = await decoder(masque64, 'image/png');
  const t0 = performance.now();
  const plan = await planifierImage(photo, true, { mesurerHaute: true }), msPlan = Math.round(performance.now() - t0);
  // Les lignes du masque d'origine et leur aire.
  const c0 = document.createElement('canvas'); c0.width = masque.width; c0.height = masque.height;
  const x0 = c0.getContext('2d', { willReadFrequently: true })!; x0.drawImage(masque, 0, 0);
  const aire0 = new Map<number, number>();
  for (const id of etiquettes(x0.getImageData(0, 0, c0.width, c0.height).data)) if (id) aire0.set(id, (aire0.get(id) ?? 0) + 1);
  if (!plan) return { morceaux: 1, lignes: aire0.size, msPlan, rien: true };
  const { g, finale } = plan;
  // Le masque normalisé (même géométrie que `dessinerNormalise`), calculé ici au plus proche voisin EXACT : le canevas du navigateur, même sans lissage,
  // mêle les couleurs d'étiquettes sous une petite rotation (03.11 : des lignes « fantômes » à mille rangées de leur place).
  const L = g.largeur, Hn = g.hauteur;
  const e0 = etiquettes(x0.getImageData(0, 0, c0.width, c0.height).data), e = new Uint32Array(L * Hn);
  const rad = g.angle * Math.PI / 180, co = Math.cos(rad), si = Math.sin(rad);
  for (let v = 0; v < Hn; v++) {
    const dy = (v + 0.5 - Hn / 2) / g.echelle;
    for (let u = 0; u < L; u++) {
      const dx = (u + 0.5 - L / 2) / g.echelle;
      const sx = Math.floor(g.cx + dx * co - dy * si), sy = Math.floor(g.cy + dx * si + dy * co);
      if (sx >= 0 && sx < c0.width && sy >= 0 && sy < c0.height) e[v * L + u] = e0[sy * c0.width + sx];
    }
  }
  // Le masque peint toute la TRANCHE d'une ligne (interligne compris, toute la largeur), et sur une rangée zébrée la bande grisée entière : une coupe
  // dans le blanc d'une tranche haute comptait « silencieuse » (07.11, graine 2). Une ligne n'occupe donc que les rangées où elle a de l'ENCRE : des
  // pixels de la photo normalisée nettement plus sombres (30 niveaux) que le fond de sa propre tranche (sa médiane). L'aire (perdue, rognée) reste celle de la tranche.
  const cg = document.createElement('canvas'); cg.width = L; cg.height = Hn;
  const rgba = dessinerNormalise(cg, photo, g, 0).getImageData(0, 0, L, Hn).data, gris = new Uint8Array(L * Hn);
  for (let i = 0, j = 0; i < gris.length; i++, j += 4) gris[i] = (rgba[j] * 77 + rgba[j + 1] * 150 + rgba[j + 2] * 29) >> 8;
  cg.width = 0; cg.height = 0;
  const histos = new Map<number, Uint32Array>(), aire = new Map<number, number>();
  for (let i = 0; i < e.length; i++) { const id = e[i]; if (!id) continue; aire.set(id, (aire.get(id) ?? 0) + 1); let h = histos.get(id); if (!h) histos.set(id, (h = new Uint32Array(256))); h[gris[i]]++; }
  const fond = new Map<number, number>();
  for (const [id, h] of histos) { const n = aire.get(id)!; let c = 0, v = 0; for (; v < 255; v++) { c += h[v]; if (c >= n / 2) break; } fond.set(id, v); }
  const rangs = new Map<number, number[]>();
  for (let y = 0; y < Hn; y++) {
    const encre = new Map<number, number>();
    for (let x = 0, i = y * L; x < L; x++, i++) { const id = e[i]; if (id && gris[i] < fond.get(id)! - 30) encre.set(id, (encre.get(id) ?? 0) + 1); }
    for (const [id, n] of encre) if (n >= 2) { const l = rangs.get(id) ?? []; l.push(y); rangs.set(id, l); }
  }
  const m = finale.morceaux, coupes = m.slice(0, -1).map(b => b.bottom);
  const forcees = m.map((b, i) => coupeBasseForcee(b, finale.rangees, i === m.length - 1));
  // Une ligne coupée : des rangées des deux côtés d'une coupe, au moins 25 % de sa hauteur de chaque côté (un bord d'un pixel ne compte pas).
  const coupees: Array<{ ligne: number; coupe: number; signalee: boolean }> = [];
  for (const [id, ys] of rangs) coupes.forEach((cut, i) => {
    const haut = ys.filter(y => y < cut).length, bas = ys.length - haut;
    if (Math.min(haut, bas) >= Math.max(1, 0.25 * ys.length)) coupees.push({ ligne: id - 1, coupe: i + 1, signalee: forcees[i] });
  });
  // Une ligne perdue ou rognée : absente du masque normalisé, ou moins de 80 % de l'aire de sa TRANCHE (à l'échelle près). Une mesure à l'encre a été
  // essayée le 07.11 et écartée : réduite et lissée, l'image perd des pixels sombres de traits fins sans rien perdre de lisible (1 157 « rognées »).
  // Diagnostic (08.11) : chaque coupe intérieure, son blanc (rangées presque vides autour de la coupe, dans le profil du plan) et si elle tranche une ligne.
  const pasPlan = linePitchDe(finale.rangees);
  const diagCoupes = coupes.map((cut, i) => {
    let a = cut - 1, b = cut - 1;
    const vide = (y: number) => (finale.rangees[y] ?? 1) <= 0.003;
    if (vide(cut - 1)) { while (a > 0 && vide(a - 1)) a--; while (b < Hn - 1 && vide(b + 1)) b++; }
    const tranchees = coupees.filter(x => x.coupe === i + 1).length;
    return { k: i + 1, cut, blanc: vide(cut - 1) ? b - a + 1 : 0, forcee: forcees[i], tranchees, pas: pasPlan, maxAutour: Math.max(...finale.rangees.slice(Math.max(0, cut - 4), cut + 3)) };
  });
  const e2 = g.echelle * g.echelle, perdues: number[] = [], rognees: number[] = [];
  for (const [id, a] of aire0) { const b = aire.get(id) ?? 0; if (!b) perdues.push(id - 1); else if (b < 0.8 * a * e2) rognees.push(id - 1); }
  // (a), 08.11 : la bande de contrôle attrape-t-elle une ligne perdue ou doublée à la coupe ? LECTEUR PARFAIT simulé (aucune IA) : une ligne
  // ENTIÈRE d'un côté est lue de ce côté ; la bande lit les lignes entières dans ses rangées. Un article = sa ligne qui porte le montant (« | »).
  // Pour chaque coupe : juste (aucune ligne à montant tranchée) → la bande concorde-t-elle (sinon : fausse alerte) ; ligne à montant tranchée →
  // les deux pires lectures (lue des deux côtés : doublée ; d'aucun : perdue) sont-elles attrapées ? Ligne tranchée sans montant : comptée à part.
  let bande: any = null;
  if (verite) {
    const montantDe = new Map<number, number>();
    verite.lignes.forEach((art: number | null, i: number) => { if (art !== null && String(verite.lignesTexte[i]).includes(' | ')) montantDe.set(i + 1, verite.articles[art].amountTTC); });
    const lignesMontant = [...montantDe.keys()].filter(id => rangs.has(id)).map(id => ({ id, a: Math.min(...rangs.get(id)!), b: Math.max(...rangs.get(id)!), item: { amountTTC: montantDe.get(id) } })).sort((x, y) => x.a - y.a);
    const jonctions = planJonctions(m, finale.rangees);
    bande = { justes: 0, faussesAlertes: 0, montantTranche: 0, doubleAttrape: 0, perteAttrapee: 0, sansMontantTranche: 0 };
    coupes.forEach((cut, i) => {
      const j = jonctions[i], lue = lignesMontant.filter(l => l.a >= j.top && l.b < j.bottom).map(l => l.item);
      const haut = lignesMontant.filter(l => l.b < cut).map(l => l.item), bas = lignesMontant.filter(l => l.a >= cut).map(l => l.item);
      const tranchees = lignesMontant.filter(l => l.a < cut && l.b >= cut && coupees.some(c => c.coupe === i + 1 && c.ligne === l.id - 1));
      const autres = coupees.filter(c => c.coupe === i + 1 && !montantDe.has(c.ligne + 1)).length;
      bande.sansMontantTranche += autres;
      if (!tranchees.length) {
        const entiers = lignesMontant.filter(l => l.a < cut && l.b >= cut).map(l => l.item);   // à cheval sans être tranchées (< 25 %) : lues en haut
        bande.justes++; if (!jonctionConcorde(lue, [...haut, ...entiers], bas)) bande.faussesAlertes++;
        return;
      }
      bande.montantTranche += tranchees.length;
      const t = tranchees.map(l => l.item);
      if (!jonctionConcorde(lue, [...haut, ...t], [...t, ...bas])) bande.doubleAttrape += tranchees.length;
      if (!jonctionConcorde(lue, haut, bas)) bande.perteAttrapee += tranchees.length;
    });
  }
  return {
    bande, haute: plan.haute, lignesTexte: lignesDeTexte(finale.rangees, finale.pas ?? null), avant: decoupeAvant(plan),
    morceaux: m.length, lignes: aire0.size, msPlan, angleGeo: g.angle, diagCoupes, echelle: g.echelle, largeur: L, hauteur: Hn,
    forcees: forcees.filter(Boolean).length, jonctions: planJonctions(m, finale.rangees).length,
    coupeesSilencieuses: coupees.filter(x => !x.signalee).map(x => ({ ...x, rangees: [Math.min(...rangs.get(x.ligne + 1)!), Math.max(...rangs.get(x.ligne + 1)!)], cut: coupes[x.coupe - 1] })), coupeesSignalees: coupees.filter(x => x.signalee).length, perdues, rognees,
  };
};
/** Diagnostic (08.11) : la photo normalisée autour d'une coupe (± 3 pas), la coupe en bleu, et à gauche, en rouge, les rangées où le masque dit
 *  qu'une ligne a de l'encre (critère du banc) ; en vert, les rangées encrées de la carte des coupes du plan. PNG en base 64. */
(window as any).__voirCoupe = async (photo64: string, masque64: string, k: number) => {
  const r = await (window as any).__controler(photo64, masque64);
  const photo = await decoder(photo64, 'image/jpeg');
  const plan = await planifierImage(photo, true);
  if (!plan) return null;
  const { g, finale } = plan, cut = finale.morceaux[k - 1].bottom, pas = Math.round(linePitchDe(finale.rangees) ?? 30);
  const y0 = Math.max(0, cut - 3 * pas), h = Math.min(g.hauteur - y0, 6 * pas);
  const c = document.createElement('canvas'); c.width = g.largeur; c.height = h;
  const x = dessinerNormalise(c, photo, g, y0);
  x.setTransform(1, 0, 0, 1, 0, 0);
  for (let y = 0; y < h; y++) if (finale.rangees[y0 + y] > 0.003) { x.fillStyle = '#0a0'; x.fillRect(12, y, 10, 1); }
  for (const s of r.coupeesSilencieuses ?? []) if (s.coupe === k) { x.fillStyle = 'rgba(255,0,0,0.8)'; x.fillRect(0, s.rangees[0] - y0, 10, s.rangees[1] - s.rangees[0] + 1); }
  x.fillStyle = '#00f'; x.fillRect(0, cut - y0, g.largeur, 1);
  const u = c.toDataURL('image/png');
  return u.slice(u.indexOf(',') + 1);
};
/** Diagnostic (08.11) : la photo d'ORIGINE, rangées [y0, y0 + h), avec en rouge les frontières des tranches du masque (changement de couleur). */
(window as any).__voirBrut = async (photo64: string, masque64: string, y0: number, h: number) => {
  const photo = await decoder(photo64, 'image/jpeg'), masque = await decoder(masque64, 'image/png');
  const c = document.createElement('canvas'); c.width = photo.width; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true })!; x.drawImage(masque, 0, -y0);
  const e = etiquettes(x.getImageData(0, 0, c.width, h).data);
  x.drawImage(photo, 0, -y0);
  const d = x.getImageData(0, 0, c.width, h);
  for (let y = 1; y < h; y++) for (let i = y * c.width; i < (y + 1) * c.width; i++) if (e[i] !== e[i - c.width] && e[i] && e[i - c.width]) { d.data[4 * i] = 255; d.data[4 * i + 1] = 0; d.data[4 * i + 2] = 0; }
  x.putImageData(d, 0, 0);
  const u = c.toDataURL('image/png');
  return u.slice(u.indexOf(',') + 1);
};
(window as any).__pret = true;

/** D381 : une vraie pièce (sans masque) dans la VRAIE découpe de l'app : déclencheur sans `force`, géométrie, morceaux et bandes (images JPEG). */
(window as any).__plan = async (b64: string, type: string, force = false) => {
  const blob = new Blob([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], { type });
  const image = await createImageBitmap(blob);
  const t0 = performance.now();
  const plan = await planifierImageDetaille(image, force), msPlan = Math.round(performance.now() - t0);
  const t1 = performance.now();
  const decoupe = await decouperPiece(blob, { force });
  const msDecoupe = Math.round(performance.now() - t1);
  let normalise: string | null = null;
  if (plan) { const c = document.createElement('canvas'); c.width = plan.g.largeur; c.height = plan.g.hauteur; dessinerNormalise(c, image, plan.g, 0); const d = c.toDataURL('image/jpeg', 0.8); normalise = d.slice(d.indexOf(',') + 1); }
  return {
    lignesTexte: plan ? lignesDeTexte(plan.finale.rangees, plan.finale.pas ?? null) : null, haute: plan?.haute ?? null, coupee: !!decoupe,
    normalise, largeur: image.width, hauteur: image.height, msPlan, msDecoupe, g: plan?.g ?? null, morceaux: plan?.finale.morceaux ?? null, papierFinal: plan?.finale.papier ?? null, colonnes: plan?.finale.colonnes ?? null,
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
  const plan = await planifierImageDetaille(image, true);
  if (!plan) return null;
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
