// D381, voie c-decoupe : l'encre par CONTRASTE LOCAL, le papier sur son fond, le redressement. Pur : des bitmaps fabriqués, aucun canvas.
// « Si la facture est pas blanche ? Si la tâche fait toute la facture ? Si la photo est un peu floue ? » (03.11)
// Témoin : `inkRows` (fond global, `invoiceMorceaux`) échoue sur la tache et le dégradé : c'est la version rejetée.
import { describe, expect, it } from 'vitest';
import { EMPTY_ROW_MAX, inkRows, planMorceaux, BAND_MAX_LINES, type Bitmap } from '../../../../functions/src/invoiceMorceaux';
import { analyser, cadrePourAngle, compterRangees, encreLocale, estimerAngle, encreDetaillee, normaliser, otsu, recadrageDe, sansTraitsVerticaux, trouverPapier } from '../../../../src/services/decoupe';

interface Spec {
  largeur?: number; lignes: number; pas?: number; hauteurLigne?: number; marge?: number;
  fond?: (x: number, y: number, h: number) => number;
  /** Rangées grisées une sur deux : la valeur du gris des lignes impaires (toute la largeur, tout le pas). */
  grises?: number;
  angle?: number; flou?: number;
}
const ENCRE = 20;
/** Un « texte » : des mots de 20 px, 8 px d'écart, hauteur 7 sur un pas de 16. Retourne le bitmap et la vérité (rangées des lignes, dans l'image droite). */
function fabriquer(spec: Spec): { bitmap: Bitmap; estLigne: (y: number) => boolean; hauteur: number } {
  const w = spec.largeur ?? 300, pas = spec.pas ?? 16, hl = spec.hauteurLigne ?? 7, marge = spec.marge ?? 24, h = marge * 2 + spec.lignes * pas;
  const rad = (spec.angle ?? 0) * Math.PI / 180, c = Math.cos(rad), s = Math.sin(rad);
  const gris = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - w / 2, dy = y - h / 2, u = dx * c + dy * s + w / 2, v = -dx * s + dy * c + h / 2;
      const li = Math.floor((v - marge) / pas), r = v - marge - li * pas;
      let valeur = spec.fond ? spec.fond(x, y, h) : 255;
      if (spec.grises !== undefined && li >= 0 && li < spec.lignes && li % 2 === 1) valeur = spec.grises;
      if (li >= 0 && li < spec.lignes && r < hl && u >= marge && u < w - marge && (u - marge) % 28 < 20) valeur = ENCRE;
      gris[y * w + x] = Math.max(0, Math.min(255, Math.round(valeur)));
    }
  }
  let bitmap: Bitmap = { width: w, height: h, gray: gris };
  for (let passe = 0; passe < (spec.flou ? 1 : 0); passe++) bitmap = flouter(bitmap, spec.flou!);
  return { bitmap, hauteur: h, estLigne: y => { const li = Math.floor((y - marge) / pas); return li >= 0 && li < spec.lignes && (y - marge) - li * pas < hl; } };
}
/** Flou de boîte de rayon `r` (séparable). */
function flouter(b: Bitmap, r: number): Bitmap {
  const { width: w, height: h } = b, a = new Float32Array(w * h), o = new Uint8Array(w * h), n = 2 * r + 1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let t = 0; for (let k = -r; k <= r; k++) t += b.gray[y * w + Math.min(w - 1, Math.max(0, x + k))]; a[y * w + x] = t / n; }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let t = 0; for (let k = -r; k <= r; k++) t += a[Math.min(h - 1, Math.max(0, y + k)) * w + x]; o[y * w + x] = Math.round(t / n); }
  return { width: w, height: h, gray: o };
}

/** Les coupes de `planMorceaux` : aucune dans une ligne, aucune forcée ; les lignes encrées ont de l'encre, les blancs n'en ont pas. */
function verifierCoupes(rangees: number[], largeur: number, estLigne: (y: number) => boolean, attendu = 3) {
  const morceaux = planMorceaux(rangees, largeur, { maxLines: BAND_MAX_LINES });
  expect(morceaux.length).toBeGreaterThanOrEqual(attendu);
  for (const m of morceaux) expect(m.forced).toBe(false);
  morceaux.slice(1).forEach(m => {
    expect(estLigne(m.top - 1)).toBe(false);
    expect(estLigne(m.top)).toBe(false);
    expect(rangees[m.top - 1]).toBeLessThanOrEqual(EMPTY_ROW_MAX);
  });
  return morceaux;
}
function verifierRangees(rangees: number[], hauteur: number, estLigne: (y: number) => boolean) {
  let encrees = 0, blancs = 0, pires = 1;
  for (let y = 0; y < hauteur; y++) {
    if (estLigne(y)) { encrees++; pires = Math.min(pires, rangees[y]); expect(rangees[y]).toBeGreaterThan(EMPTY_ROW_MAX); }
  }
  // Un blanc franc : à au moins 3 rangées de toute ligne.
  for (let y = 0; y < hauteur; y++) if (![-3, -2, -1, 0, 1, 2, 3].some(d => estLigne(y + d))) { blancs++; expect(rangees[y]).toBeLessThanOrEqual(EMPTY_ROW_MAX); }
  expect(encrees).toBeGreaterThan(100);
  expect(blancs).toBeGreaterThan(100);
  expect(pires).toBeGreaterThan(0.2);
}

describe('encreLocale : où sont les blancs entre les lignes', () => {
  it('une page blanche : la référence', () => {
    const { bitmap, hauteur, estLigne } = fabriquer({ lignes: 100 });
    const rangees = encreLocale(bitmap);
    verifierRangees(rangees, hauteur, estLigne);
    verifierCoupes(rangees, bitmap.width, estLigne);
  });

  it('un papier gris (fond 180)', () => {
    const { bitmap, hauteur, estLigne } = fabriquer({ lignes: 100, fond: () => 180 });
    const rangees = encreLocale(bitmap);
    verifierRangees(rangees, hauteur, estLigne);
    verifierCoupes(rangees, bitmap.width, estLigne);
  });

  it('un dégradé d’ombre et une tache lisse sur toute la page : le texte reste de l’encre, le reste non', () => {
    const fond = (x: number, y: number, h: number) => 255 - 100 * (y / h) - 60 * Math.exp(-(((x - 150) ** 2 + (y - 0.5 * h) ** 2) / (2 * 90 ** 2)));
    const { bitmap, hauteur, estLigne } = fabriquer({ lignes: 100, fond });
    const rangees = encreLocale(bitmap);
    verifierRangees(rangees, hauteur, estLigne);
    verifierCoupes(rangees, bitmap.width, estLigne);
  });

  it('TÉMOIN : le fond global (`inkRows`) échoue sur ce même dégradé et cette tache — des coupes forcées, à travers des lignes', () => {
    const fond = (x: number, y: number, h: number) => 255 - 100 * (y / h) - 60 * Math.exp(-(((x - 150) ** 2 + (y - 0.5 * h) ** 2) / (2 * 90 ** 2)));
    const { bitmap, estLigne } = fabriquer({ lignes: 100, fond });
    const ancien = planMorceaux(inkRows(bitmap), bitmap.width, { maxLines: BAND_MAX_LINES });
    const abimees = ancien.slice(1).filter(m => m.forced || estLigne(m.top - 1) || estLigne(m.top));
    expect(abimees.length).toBeGreaterThan(0);
  });

  it('TÉMOIN : le fond global échoue aussi sur un simple dégradé de 100 niveaux', () => {
    const { bitmap } = fabriquer({ lignes: 100, fond: (_x, y, h) => 255 - 100 * (y / h) });
    const ancien = planMorceaux(inkRows(bitmap), bitmap.width, { maxLines: BAND_MAX_LINES });
    expect(ancien.some(m => m.forced)).toBe(true);
  });

  it('des rangées grisées une sur deux, claires (235, sous le plancher), ne sont pas de l’encre', () => {
    const { bitmap, hauteur, estLigne } = fabriquer({ lignes: 100, grises: 235 });
    const rangees = encreLocale(bitmap);
    verifierRangees(rangees, hauteur, estLigne);
    verifierCoupes(rangees, bitmap.width, estLigne);
  });

  it('des rangées grisées plus foncées (215) comptent pour la coupe : les coupes tombent dans les rangées blanches, jamais dans une ligne ni forcées', () => {
    const { bitmap, estLigne } = fabriquer({ lignes: 100, grises: 215 });
    verifierCoupes(encreLocale(bitmap), bitmap.width, estLigne);
  });

  it('une photo un peu floue (boîte de rayon 2) : les blancs sont trouvés, aucune coupe dans une ligne', () => {
    const { bitmap, hauteur, estLigne } = fabriquer({ lignes: 100, flou: 2 });
    const rangees = encreLocale(bitmap);
    // Les lignes restent de l’encre ; les blancs francs (3 rangées de toute ligne) restent blancs.
    for (let y = 0; y < hauteur; y++) if (estLigne(y)) expect(rangees[y]).toBeGreaterThan(EMPTY_ROW_MAX);
    verifierCoupes(rangees, bitmap.width, estLigne);
  });

  it('flou, papier gris, ombre et rangées grisées à la fois', () => {
    const { bitmap, estLigne } = fabriquer({ lignes: 100, fond: (_x, y, h) => 200 - 40 * (y / h), grises: 180, flou: 2 });
    verifierCoupes(encreLocale(bitmap), bitmap.width, estLigne);
  });

  it('un thème sombre (texte clair sur fond noir) est inversé d’abord', () => {
    const { bitmap, hauteur, estLigne } = fabriquer({ lignes: 60 });
    const inverse: Bitmap = { ...bitmap, gray: bitmap.gray.map(v => 255 - v) };
    const rangees = encreLocale(inverse);
    verifierRangees(rangees, hauteur, estLigne);
  });

  it('un grain de bruit isolé n’est pas de l’encre', () => {
    const { bitmap, hauteur, estLigne } = fabriquer({ lignes: 60 });
    const bruit: Bitmap = { ...bitmap, gray: bitmap.gray.slice() };
    // Un pixel noir isolé tous les 61 px, dans les blancs seulement.
    for (let y = 0; y < hauteur; y += 5) for (let x = 3; x < bitmap.width; x += 61) if (![-1, 0, 1].some(d => estLigne(y + d))) bruit.gray[y * bitmap.width + x] = 0;
    const rangees = encreLocale(bruit);
    for (let y = 0; y < hauteur; y++) if (![-3, -2, -1, 0, 1, 2, 3].some(d => estLigne(y + d))) expect(rangees[y]).toBeLessThanOrEqual(EMPTY_ROW_MAX);
  });

  it('otsu : deux classes nettes, le seuil est le sommet de la classe basse', () => {
    const h = new Uint32Array(256);
    h[0] = 900; h[30] = 80; h[200] = 20;
    expect(otsu(h).seuil).toBe(30);
  });
});

describe('redressement : l’angle des lignes', () => {
  for (const vrai of [2, -2, 0, 1, -1]) {
    it(`des lignes penchées de ${vrai}° : angle à 0,5° près`, () => {
      const { bitmap } = fabriquer({ lignes: 60, angle: vrai, largeur: 300, marge: 40 });
      const a = analyser(bitmap);
      expect(Math.abs(a.angle - vrai)).toBeLessThanOrEqual(0.5);
    });
  }

  it('sans encre, l’angle est 0 (jamais un redressement sans preuve)', () => {
    const vide: Bitmap = { width: 200, height: 400, gray: new Uint8Array(200 * 400).fill(255) };
    expect(analyser(vide).angle).toBe(0);
    expect(estimerAngle(encreDetaillee(vide).ink, 200, 400)).toBe(0);
  });

  it('après normalisation, les lignes sont droites : les blancs reviennent, plus aucune coupe forcée', () => {
    const { bitmap } = fabriquer({ lignes: 100, angle: 2, largeur: 400, marge: 40 });
    const a = analyser(bitmap);
    expect(a.angle).toBeGreaterThan(1);
    expect(a.morceaux.length).toBeGreaterThanOrEqual(3);
    for (const m of a.morceaux) expect(m.forced).toBe(false);
  });

  it('`normaliser` : angle 0 recopie le recadrage ; hors de l’image, `vide`', () => {
    const gris = Uint8Array.from({ length: 12 }, (_, i) => i * 10);
    expect(Array.from(normaliser(gris, 4, 3, { crop: { x: 1, y: 1, w: 2, h: 2 }, angle: 0 }))).toEqual([50, 60, 90, 100]);
    expect(Array.from(normaliser(gris, 4, 3, { crop: { x: 3, y: 2, w: 2, h: 2 }, angle: 0 }, { vide: 0 }))).toEqual([110, 0, 0, 0]);
  });

  it('`normaliser` d’un masque (plus proche voisin) ne crée aucune valeur intermédiaire', () => {
    const w = 60, h = 40, masque = new Uint8Array(w * h);
    for (let y = 10; y < 30; y++) for (let x = 15; x < 45; x++) masque[y * w + x] = 255;
    const sortie = normaliser(masque, w, h, { crop: { x: 0, y: 0, w, h }, angle: 3 }, { plusProche: true, vide: 0 });
    expect(new Set(sortie)).toEqual(new Set([0, 255]));
    expect(sortie.filter(v => v === 255).length).toBeGreaterThan(500);
  });

  it('`normaliser` : les lignes penchées de +2° deviennent horizontales (la même convention que `analyser`)', () => {
    const { bitmap } = fabriquer({ lignes: 40, angle: 2, largeur: 300, marge: 40 });
    const { crop, angle } = analyser(bitmap);
    const droit = normaliser(bitmap.gray, bitmap.width, bitmap.height, { crop, angle });
    const avant = encreLocale(bitmap), apres = encreLocale({ width: crop.w, height: crop.h, gray: droit });
    const blancs = (r: number[]) => r.filter(v => v <= EMPTY_ROW_MAX).length;
    expect(blancs(apres)).toBeGreaterThan(blancs(avant));
  });
});

describe('le papier sur son fond (photo posée sur une table)', () => {
  /** Une table gris 60 de 520 × 760, le papier (300 × 600) à (100, 80), ombre sur le papier (255 → 200), 30 lignes. */
  function photo() {
    const w = 520, h = 760, px = 100, py = 80, pw = 300, ph = 600;
    const gris = new Uint8Array(w * h).fill(60);
    for (let y = py; y < py + ph; y++) for (let x = px; x < px + pw; x++) {
      let v = 255 - 55 * ((y - py) / ph);
      const li = Math.floor((y - py - 20) / 18);
      if (li >= 0 && li < 30 && (y - py - 20) - li * 18 < 8 && x >= px + 20 && x < px + pw - 20 && (x - px - 20) % 28 < 20) v = 25;
      gris[y * w + x] = Math.round(v);
    }
    return { bitmap: { width: w, height: h, gray: gris } as Bitmap, px, py, pw, ph };
  }

  it('trouve le papier, le recadre avec une marge, sans en perdre un pixel', () => {
    const { bitmap, px, py, pw, ph } = photo();
    const papier = trouverPapier(bitmap);
    expect(papier).not.toBeNull();
    const a = analyser(bitmap, { redresser: false });
    expect(a.papier).toBe(true);
    expect(a.crop.x).toBeLessThanOrEqual(px);
    expect(a.crop.y).toBeLessThanOrEqual(py);
    expect(a.crop.x + a.crop.w).toBeGreaterThanOrEqual(px + pw);
    expect(a.crop.y + a.crop.h).toBeGreaterThanOrEqual(py + ph);
    // Le cadre garde aussi le liseré du bord (encre de contraste côté table) : quelques pas de ligne de plus, jamais la table entière.
    expect(a.crop.w).toBeLessThan(pw + 80);
    expect(a.crop.h).toBeLessThan(ph + 80);
  });

  it('le fond n’est pas de l’encre : coupes dans les blancs, jamais forcées ; TÉMOIN `inkRows` : il prend la table pour le fond et le papier pour de l’encre', () => {
    const { bitmap } = photo();
    const a = analyser(bitmap, { redresser: false, maxLines: 12 });
    expect(a.morceaux.length).toBeGreaterThanOrEqual(2);
    for (const m of a.morceaux) expect(m.forced).toBe(false);
    const ancien = planMorceaux(inkRows(bitmap), bitmap.width, { maxLines: 12 });
    // Le papier entier passe pour de l'encre : aucun blanc entre les lignes, le pas n'est pas trouvé, le plafond de lignes n'est pas tenu (30 lignes ici).
    expect(ancien.some(m => m.forced) || ancien.length < a.morceaux.length).toBe(true);
  });

  it('sans fond sombre (page blanche, ou page grise), rien n’est recadré ni masqué', () => {
    const { bitmap } = fabriquer({ lignes: 60 });
    expect(trouverPapier(bitmap)).toBeNull();
    const a = analyser(bitmap, { redresser: false });
    expect(a.crop).toEqual({ x: 0, y: 0, w: bitmap.width, h: bitmap.height });
    expect(a.papier).toBe(false);
    const grise = fabriquer({ lignes: 60, fond: () => 150 }).bitmap;
    expect(trouverPapier(grise)).toBeNull();
  });

  it('du texte hors de la région claire (moitié du papier à l’ombre) : prudence, ni recadrage ni masque', () => {
    const { bitmap } = fabriquer({ lignes: 60, fond: x => (x < 150 ? 120 : 255) });
    const a = analyser(bitmap, { redresser: false });
    expect(a.crop).toEqual({ x: 0, y: 0, w: bitmap.width, h: bitmap.height });
  });
});

describe('pièges du 03.11 (banc de 200 pièces tirées au hasard : 449 lignes coupées en silence, 117 perdues, 66 rognées)', () => {
  /** L'ancien estimateur (un seul profil sur toute la largeur), recopié pour témoin. */
  function angleGlobal(ink: Uint8Array, w: number, h: number): number {
    const r = Math.max(1, Math.floor(w / 400)), bw = Math.ceil(w / r), bh = Math.ceil(h / r), xs: number[] = [], ys: number[] = [], ps: number[] = [];
    for (let by = 0; by < bh; by++) for (let bx = 0; bx < bw; bx++) {
      let n = 0;
      for (let y = by * r; y < Math.min(h, (by + 1) * r); y++) for (let x = bx * r; x < Math.min(w, (bx + 1) * r); x++) n += ink[y * w + x];
      if (n) { xs.push(bx * r + r / 2 - w / 2); ys.push(by * r + r / 2 - h / 2); ps.push(n); }
    }
    const bacs = Math.ceil(Math.hypot(w, h) / r) + 4, dec = Math.hypot(w, h) / 2;
    const score = (d: number) => {
      const rad = d * Math.PI / 180, s = Math.sin(rad), c = Math.cos(rad), p = new Float64Array(bacs);
      for (let i = 0; i < xs.length; i++) p[Math.floor((-xs[i] * s + ys[i] * c + dec) / r)] += ps[i];
      let t = 0; for (const v of p) t += v * v; return t;
    };
    const zero = score(0); let m = 0, ms = zero;
    for (let a = -5; a <= 5 + 1e-9; a += 0.25) { const s = score(a); if (s > ms * (1 + 1e-9)) { m = a; ms = s; } }
    return ms > zero * 1.02 ? m : 0;
  }
  /** Une facture DROITE de 1 000 px : le nom sur une ligne (à gauche), les montants sur la suivante (à droite). */
  function factureDecalee(): Bitmap {
    const w = 1000, pas = 18, lignes = 200, h = 40 + lignes * pas, g = new Uint8Array(w * h).fill(250);
    for (let li = 0; li < lignes; li++) {
      const [a, b] = li % 2 ? [600, 960] : [40, 400];
      for (let y = 20 + li * pas; y < 30 + li * pas; y++) for (let x = a; x < b; x++) if ((x - a) % 9 < 6) g[y * w + x] = 30;
    }
    return { width: w, height: h, gray: g };
  }

  it('une facture droite dont les montants sont sur la ligne sous le nom : angle 0 ; TÉMOIN : le profil global la voit penchée', () => {
    const b = factureDecalee(), e = encreDetaillee(b);
    expect(estimerAngle(e.ink, b.width, b.height)).toBe(0);
    expect(analyser(b).angle).toBe(0);
    expect(Math.abs(angleGlobal(e.ink, b.width, b.height))).toBeGreaterThanOrEqual(1);
  });

  for (const vrai of [0.6, -0.75, 1.2]) {
    it(`une petite pente de ${vrai}° sur une page large (1 100 px) est mesurée au 0,1° près (0,5° y décalent une ligne de 10 px)`, () => {
      const { bitmap } = fabriquer({ lignes: 80, angle: vrai, largeur: 1100, marge: 60 });
      const e = encreDetaillee(bitmap);
      expect(Math.abs(estimerAngle(e.ink, bitmap.width, bitmap.height) - vrai)).toBeLessThanOrEqual(0.1);
    });
  }

  it('une ombre forte sur le bas du papier, avec du texte : le cadre garde toutes les lignes ; TÉMOIN : la boîte du papier seule les perd', () => {
    // Table 60, papier 300 × 600 à (100, 80) ; ses 240 dernières rangées à l'ombre (110), texte 45 dessus.
    const w = 520, h = 760, px = 100, py = 80, pw = 300, ph = 600, g = new Uint8Array(w * h).fill(60);
    let derniere = 0;
    for (let y = py; y < py + ph; y++) for (let x = px; x < px + pw; x++) {
      const ombre = y >= py + ph - 240;
      let v = ombre ? 110 : 250;
      const li = Math.floor((y - py - 20) / 18);
      if (li >= 0 && li < 31 && (y - py - 20) - li * 18 < 8 && x >= px + 20 && x < px + pw - 20 && (x - px - 20) % 28 < 20) { v = ombre ? 45 : 25; derniere = Math.max(derniere, y); }
      g[y * w + x] = v;
    }
    const bitmap: Bitmap = { width: w, height: h, gray: g };
    const papier = trouverPapier(bitmap);
    expect(papier).not.toBeNull();
    const temoin = recadrageDe(papier, w, h);
    expect(temoin.y + temoin.h).toBeLessThan(derniere);
    const a = analyser(bitmap, { redresser: false });
    expect(a.crop.y + a.crop.h).toBeGreaterThan(derniere);
  });

  it('redresser ne rogne jamais un coin de texte : le cadre grandit pour garder toute l’encre', () => {
    const w = 300, h = 1200, ink = new Uint8Array(w * h);
    for (const [x0, y0] of [[0, 0], [w - 20, 0], [0, h - 8], [w - 20, h - 8]]) for (let y = y0; y < y0 + 8; y++) for (let x = x0; x < x0 + 20; x++) ink[y * w + x] = 1;
    const cadre = cadrePourAngle(ink, w, h, 5);
    expect(cadre.w).toBeGreaterThan(w);
    expect(cadre.h).toBeGreaterThan(h);
    // L'encre tournée tient dans le cadre : rien ne sort.
    const crop = { x: -Math.floor((cadre.w - w) / 2), y: -Math.floor((cadre.h - h) / 2), w: cadre.w, h: cadre.h };
    const sortie = normaliser(ink.map(v => v * 255), w, h, { crop, angle: 5 }, { plusProche: true, vide: 0 });
    expect(sortie.filter(v => v === 255).length).toBeGreaterThanOrEqual(0.9 * 4 * 160);
    // TÉMOIN : dans le cadre d'origine, des coins sortent.
    const rogne = normaliser(ink.map(v => v * 255), w, h, { crop: { x: 0, y: 0, w, h }, angle: 5 }, { plusProche: true, vide: 0 });
    expect(rogne.filter(v => v === 255).length).toBeLessThan(0.5 * 4 * 160);
    // Sans encre près des bords, le cadre ne change pas.
    expect(cadrePourAngle(new Uint8Array(w * h), w, h, 5)).toEqual({ w, h });
  });

  it('une ligne pâlie (contraste 35) entre des lignes franches compte pour la coupe ; TÉMOIN : l’encre nette (seuil d’Otsu) ne la voit pas', () => {
    const { bitmap, estLigne } = fabriquer({ lignes: 100 });
    const g = bitmap.gray.slice(), w = bitmap.width;
    // La ligne 50 pâlie : son encre passe de 20 à 220.
    const y0 = 24 + 50 * 16;
    for (let y = y0; y < y0 + 7; y++) for (let x = 0; x < w; x++) if (g[y * w + x] === ENCRE) g[y * w + x] = 220;
    const e = encreDetaillee({ ...bitmap, gray: g });
    for (let y = y0; y < y0 + 7; y++) expect(e.rangees[y]).toBeGreaterThan(EMPTY_ROW_MAX);
    const nette = (y: number) => { let n = 0; for (let x = 0; x < w; x++) n += e.ink[y * w + x]; return n / w; };
    expect(nette(y0 + 3)).toBeLessThanOrEqual(EMPTY_ROW_MAX);
    verifierCoupes(e.rangees, w, estLigne);
  });

  it('un trait vertical sur toute la hauteur (bord du papier, filet) est retiré ; un trait de lettre reste', () => {
    const w = 50, h = 400, ink = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) ink[y * w + 5] = 1;
    for (let y = 100; y < 110; y++) ink[y * w + 30] = 1;
    expect(sansTraitsVerticaux(ink, w, h, 48).reduce((s, v) => s + v, 0)).toBe(10);
    // Une page avec un bord sombre sur toute la hauteur : les coupes restent propres.
    const { bitmap, estLigne } = fabriquer({ lignes: 100, fond: x => (x < 6 ? 40 : 255) });
    verifierCoupes(encreLocale(bitmap), bitmap.width, estLigne);
  });
});

describe('PDF : les rangées de texte', () => {
  it('compterRangees : des ordonnées voisines sont une seule rangée', () => {
    expect(compterRangees([700, 700.4, 699.8, 688, 688.5, 650])).toBe(3);
    expect(compterRangees([])).toBe(0);
    expect(compterRangees(Array.from({ length: 95 }, (_, i) => 800 - i * 8))).toBe(95);
  });
});
