// D381 : OpenCV.js (build officielle 5.0.0, Apache-2.0, `src/vendor/opencv-5.0.0`) dans un worker à part, pour la découpe des longues pièces.
// La chaîne standard du « scanneur de document » : les 4 coins du papier (bords de Canny, ou région claire d'Otsu ; contour, enveloppe convexe,
// polygone à 4 sommets ou rectangle minimal), puis le redressement 4 points (`getPerspectiveTransform`, `warpPerspective`, bord répliqué).
// Ce worker ne décide rien : où couper, les bandes de contrôle et les garde-fous restent dans `decoupe.ts`.
// OpenCV.js crée ses liaisons par `new Function` : la CSP de CE worker seul autorise `'unsafe-eval'` (firebase.json) ; la page garde la sienne.
declare function importScripts(...urls: string[]): void;
type Rect = { x: number; y: number; w: number; h: number };
type Demande =
  | { id: number; type: 'charger'; url: string }
  | { id: number; type: 'source'; image: ImageBitmap }
  | { id: number; type: 'detecter' }
  | { id: number; type: 'rendre'; quad: number[]; largeur: number; hauteur: number; interieur: Rect; bandes: Array<[number, number]>; format: 'gris' | 'jpeg'; qualite?: number; fond?: number }
  | { id: number; type: 'liberer' };

const portee = self as unknown as { cv?: any; onmessage: ((e: MessageEvent<Demande>) => void) | null; postMessage(m: unknown, t?: Transferable[]): void };
let cv: any = null;
let source: OffscreenCanvas | null = null, ctxSource: OffscreenCanvasRenderingContext2D | null = null;

async function charger(url: string): Promise<void> {
  if (cv) return;
  importScripts(url);
  let m = portee.cv;
  if (m && typeof m.then === 'function') m = await m;
  else if (m && !m.Mat) await new Promise<void>(r => { m.onRuntimeInitialized = () => r(); });
  if (!m?.Mat) throw new Error('OpenCV.js non initialisé');
  cv = m;
}

/** Libère des Mat OpenCV (mémoire WASM, jamais ramassée seule). */
const liberer = (...mats: any[]) => { for (const m of mats) if (m && !m.isDeleted?.()) m.delete(); };
const aireDe = (p: number[]) => { let a = 0; for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; a += p[2 * i] * p[2 * j + 1] - p[2 * j] * p[2 * i + 1]; } return Math.abs(a) / 2; };
/**
 * Haut-gauche, haut-droite, bas-droite, bas-gauche : les sommets triés par angle autour de leur centre (sens des aiguilles d'une montre à l'écran),
 * puis le premier est celui de plus petite somme x + y. Les sommes et différences seules (méthode courte) donnent deux fois le même sommet à un
 * papier long et penché (piège h0005 : 254 lignes perdues).
 */
function ordonner(p: number[]): number[] {
  const pts = [0, 1, 2, 3].map(i => ({ x: p[2 * i], y: p[2 * i + 1] }));
  const cx = pts.reduce((s, q) => s + q.x, 0) / 4, cy = pts.reduce((s, q) => s + q.y, 0) / 4;
  pts.sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
  const premier = pts.reduce((m, q, i) => (q.x + q.y < pts[m].x + pts[m].y ? i : m), 0);
  return [0, 1, 2, 3].flatMap(k => { const q = pts[(premier + k) % 4]; return [q.x, q.y]; });
}
/** Un quadrilatère de papier plausible : convexe, angles de 60 à 120°, côtés opposés d'au moins 60 % l'un de l'autre, aucun côté minuscule. */
function formeDePapier(q: number[], cote: number): boolean {
  const v = (i: number) => { const j = (i + 1) % 4; return [q[2 * j] - q[2 * i], q[2 * j + 1] - q[2 * i + 1]]; };
  const cotes = [0, 1, 2, 3].map(i => Math.hypot(...v(i)));
  if (Math.min(...cotes) < 0.02 * cote) return false;
  if (Math.min(cotes[0], cotes[2]) < 0.6 * Math.max(cotes[0], cotes[2]) || Math.min(cotes[1], cotes[3]) < 0.6 * Math.max(cotes[1], cotes[3])) return false;
  let signe = 0;
  for (let i = 0; i < 4; i++) {
    const a = v((i + 3) % 4), b = v(i), croix = a[0] * b[1] - a[1] * b[0];
    if (signe && Math.sign(croix) !== signe) return false;
    signe = Math.sign(croix) || signe;
    const angle = Math.acos(Math.max(-1, Math.min(1, -(a[0] * b[0] + a[1] * b[1]) / (Math.hypot(...a) * Math.hypot(...b))))) * 180 / Math.PI;
    if (angle < 60 || angle > 120) return false;
  }
  return true;
}
function sommetsDuRectangle(r: { center: { x: number; y: number }; size: { width: number; height: number }; angle: number }): number[] {
  const a = r.angle * Math.PI / 180, c = Math.cos(a) / 2, s = Math.sin(a) / 2, w = r.size.width, h = r.size.height, x = r.center.x, y = r.center.y;
  return [x - c * w + s * h, y - s * w - c * h, x + c * w + s * h, y + s * w - c * h, x + c * w - s * h, y + s * w + c * h, x - c * w - s * h, y - s * w + c * h];
}

interface Candidat { quad: number[]; aire: number; remplissage: number; methode: string; bords: number; forme: boolean; affine?: number }

/**
 * Affine les côtés d'un quadrilatère approché sur les vrais bords (carte de Canny `bords`, image w × h) : pour chaque côté, les pixels de bord à moins
 * de `delta` de lui (hors des coins), une droite ajustée (`fitLine`, robuste de Huber), puis les coins aux intersections des droites voisines. Un côté
 * sans assez de bords garde sa droite. Rend le quadrilatère affiné et le nombre de côtés ajustés, ou le quadrilatère d'origine si un coin bouge trop.
 */
function affiner(q: number[], bords: Uint8Array, w: number, h: number): { quad: number[]; cotes: number } {
  const delta = Math.max(3, 0.015 * Math.min(w, h)), droites: Array<[number, number, number, number]> = [];
  let cotes = 0;
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4, ax = q[2 * i], ay = q[2 * i + 1], bx = q[2 * j], by = q[2 * j + 1], lx = bx - ax, ly = by - ay, l = Math.hypot(lx, ly);
    const ux = lx / l, uy = ly / l, pts: number[] = [];
    const x0 = Math.max(0, Math.floor(Math.min(ax, bx) - delta)), x1 = Math.min(w - 1, Math.ceil(Math.max(ax, bx) + delta));
    const y0 = Math.max(0, Math.floor(Math.min(ay, by) - delta)), y1 = Math.min(h - 1, Math.ceil(Math.max(ay, by) + delta));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!bords[y * w + x]) continue;
      const t = ((x - ax) * ux + (y - ay) * uy) / l, d = Math.abs((x - ax) * uy - (y - ay) * ux);
      if (t > 0.08 && t < 0.92 && d <= delta) pts.push(x, y);
    }
    if (pts.length / 2 < Math.max(20, 0.25 * l)) { droites.push([ux, uy, ax, ay]); continue; }
    const m = cv.matFromArray(pts.length / 2, 1, cv.CV_32FC2, pts), ligne = new cv.Mat();
    cv.fitLine(m, ligne, cv.DIST_HUBER, 0, 0.01, 0.01);
    const f = ligne.data32F as Float32Array;
    droites.push([f[0], f[1], f[2], f[3]]); cotes++;
    liberer(m, ligne);
  }
  const coin = (a: [number, number, number, number], b: [number, number, number, number]) => {
    const det = a[0] * b[1] - a[1] * b[0];
    if (Math.abs(det) < 1e-6) return null;
    const t = ((b[2] - a[2]) * b[1] - (b[3] - a[3]) * b[0]) / det;
    return [a[2] + t * a[0], a[3] + t * a[1]];
  };
  const sortie: number[] = [];
  for (let i = 0; i < 4; i++) {
    const p = coin(droites[(i + 3) % 4], droites[i]);
    if (!p || Math.hypot(p[0] - q[2 * i], p[1] - q[2 * i + 1]) > 4 * delta) return { quad: q, cotes: 0 };
    sortie.push(p[0], p[1]);
  }
  return { quad: sortie, cotes };
}

/** Les quadrilatères des plus grands contours d'une image binaire (image réduite w × h). */
function quadsDe(binaire: any, w: number, h: number, methode: string): Candidat[] {
  const contours = new cv.MatVector(), hierarchie = new cv.Mat();
  cv.findContours(binaire, contours, hierarchie, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  const grands: Array<{ i: number; aire: number }> = [];
  for (let i = 0; i < contours.size(); i++) { const c = contours.get(i), a = cv.contourArea(c); if (a >= 0.03 * w * h) grands.push({ i, aire: a }); c.delete(); }
  grands.sort((a, b) => b.aire - a.aire);
  const sortie: Candidat[] = [];
  for (const { i, aire } of grands.slice(0, 5)) {
    const c = contours.get(i), enveloppe = new cv.Mat(), approx = new cv.Mat();
    cv.convexHull(c, enveloppe, false, true);
    cv.approxPolyDP(enveloppe, approx, 0.02 * cv.arcLength(enveloppe, true), true);
    // 4 sommets : le papier ; sinon (bord déchiré, coin replié) son rectangle minimal.
    const quad = ordonner(approx.rows === 4 ? Array.from(approx.data32S as Int32Array) : sommetsDuRectangle(cv.minAreaRect(enveloppe)));
    const aq = aireDe(quad), marge = 0.01 * Math.min(w, h);
    const bords = [quad[0] <= marge && quad[6] <= marge, quad[1] <= marge && quad[3] <= marge, quad[2] >= w - 1 - marge && quad[4] >= w - 1 - marge, quad[5] >= h - 1 - marge && quad[7] >= h - 1 - marge].filter(Boolean).length;
    if (aq > 0) sortie.push({ quad, aire: aq / (w * h), remplissage: aire / aq, methode, bords, forme: formeDePapier(quad, Math.min(w, h)) });
    liberer(c, enveloppe, approx);
  }
  liberer(contours, hierarchie);
  return sortie;
}

/** Les coins du papier dans l'image source, ou `null` avec la raison. Les candidats sont rendus pour le banc. */
function detecter(): { quad: number[] | null; raison: string; candidats: Candidat[]; ms: number } {
  const t0 = performance.now();
  if (!source || !ctxSource) throw new Error('aucune source');
  const W = source.width, H = source.height, s = Math.min(1, Math.sqrt(1.2e6 / (W * H)));
  const w = Math.max(16, Math.round(W * s)), h = Math.max(16, Math.round(H * s));
  const petit = new OffscreenCanvas(w, h), cp = petit.getContext('2d', { willReadFrequently: true })!;
  cp.drawImage(source, 0, 0, w, h);
  const rgba = cv.matFromImageData(cp.getImageData(0, 0, w, h)), gris = new cv.Mat(), flou = new cv.Mat(), bords = new cv.Mat(), clair = new cv.Mat();
  const noyau3 = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3)), k = 2 * Math.max(1, Math.round(Math.min(w, h) / 80)) + 1;
  const noyauK = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(k, k));
  try {
    cv.cvtColor(rgba, gris, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gris, flou, new cv.Size(5, 5), 0);
    // 1. Les bords : Canny aux seuils tirés de la médiane (« auto Canny »), traits épaissis d'un pixel pour fermer le contour.
    const histo = new Uint32Array(256), d = flou.data as Uint8Array;
    for (let i = 0; i < d.length; i++) histo[d[i]]++;
    let cumul = 0, mediane = 0;
    for (; mediane < 255; mediane++) { cumul += histo[mediane]; if (cumul >= d.length / 2) break; }
    cv.Canny(flou, bords, Math.max(10, 0.66 * mediane), Math.max(30, Math.min(255, 1.33 * mediane)));
    const bruts = new Uint8Array(bords.data as Uint8Array);
    cv.dilate(bords, bords, noyau3);
    // 2. La région claire : Otsu, trous du texte fermés.
    cv.threshold(flou, clair, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
    cv.morphologyEx(clair, clair, cv.MORPH_CLOSE, noyauK);
    // Chaque quadrilatère approché est affiné sur les vrais bords, puis jugé de nouveau.
    const candidats = [...quadsDe(bords, w, h, 'bords'), ...quadsDe(clair, w, h, 'clair')].map(c => {
      const a = affiner(c.quad, bruts, w, h), quad = ordonner(a.quad);
      return { ...c, quad: quad.map(v => v / s), affine: a.cotes, forme: formeDePapier(quad, Math.min(w, h)), remplissage: c.remplissage * aireDe(c.quad) / Math.max(1e-9, aireDe(quad)) };
    });
    // Un papier : un quadrilatère convexe que son contour remplit (≥ 85 %), d'au moins 3 % de l'image, qui ne la remplit pas tout entière (4 bords
    // touchés : l'image EST le papier, rien à redresser par ses coins).
    const debout = (q: number[]) => Math.hypot(q[6] - q[0], q[7] - q[1]) + Math.hypot(q[4] - q[2], q[5] - q[3]) >= Math.hypot(q[2] - q[0], q[3] - q[1]) + Math.hypot(q[4] - q[6], q[5] - q[7]);
    const valides = candidats.filter(c => c.forme && debout(c.quad) && c.remplissage >= 0.85 && c.aire >= 0.03 && c.bords < 4);
    valides.sort((a, b) => b.aire - a.aire || b.remplissage - a.remplissage);
    const ms = Math.round(performance.now() - t0);
    if (!valides.length) return { quad: null, raison: candidats.some(c => c.bords === 4) ? 'papier plein cadre' : 'aucun papier à 4 coins', candidats, ms };
    return { quad: valides[0].quad, raison: `papier (${valides[0].methode}, ${valides[0].affine ?? 0} côtés affinés)`, candidats, ms };
  } finally { liberer(rgba, gris, flou, bords, clair, noyau3, noyauK); }
}

const produit = (a: number[], b: number[]) => [0, 1, 2].flatMap(i => [0, 1, 2].map(j => a[3 * i] * b[j] + a[3 * i + 1] * b[3 + j] + a[3 * i + 2] * b[6 + j]));
const image = (m: number[], x: number, y: number) => { const z = m[6] * x + m[7] * y + m[8]; return [(m[0] * x + m[1] * y + m[2]) / z, (m[3] * x + m[4] * y + m[5]) / z]; };
function enBase64(octets: Uint8Array): string {
  let s = '';
  for (let i = 0; i < octets.length; i += 0x8000) s += String.fromCharCode(...octets.subarray(i, i + 0x8000));
  return btoa(s);
}

/**
 * Le redressement : le quadrilatère `quad` (source) va sur `interieur` (sortie largeur × hauteur ; autour, la marge, prise dans la photo). Chaque bande
 * [y0, y1) de la sortie se calcule à part, depuis la seule zone de la source qui la couvre (mémoire bornée sur un téléphone). Rend la matrice
 * sortie → source (le banc y passe ses masques au plus proche voisin) et les bandes, en gris ou en JPEG (base64).
 */
async function rendre(d: Extract<Demande, { type: 'rendre' }>): Promise<{ versSource: number[]; versSortie: number[]; bandes: Array<Uint8Array | string> }> {
  if (!source || !ctxSource) throw new Error('aucune source');
  const W = source.width, H = source.height, i = d.interieur;
  const de = cv.matFromArray(4, 1, cv.CV_32FC2, d.quad), vers = cv.matFromArray(4, 1, cv.CV_32FC2, [i.x, i.y, i.x + i.w, i.y, i.x + i.w, i.y + i.h, i.x, i.y + i.h]);
  const M = cv.getPerspectiveTransform(de, vers), Minv = new cv.Mat();
  cv.invert(M, Minv, cv.DECOMP_LU);
  const m = Array.from(M.data64F as Float64Array), mi = Array.from(Minv.data64F as Float64Array);
  liberer(de, vers, M, Minv);
  const bandes: Array<Uint8Array | string> = [];
  for (const [y0, y1] of d.bandes) {
    const hb = Math.max(1, y1 - y0);
    const coins = [[0, y0], [d.largeur - 1, y0], [0, y0 + hb - 1], [d.largeur - 1, y0 + hb - 1]].map(([x, y]) => image(mi, x, y));
    const xs = coins.map(c => c[0]), ys = coins.map(c => c[1]);
    const rx0 = Math.min(W - 1, Math.max(0, Math.floor(Math.min(...xs)) - 3)), ry0 = Math.min(H - 1, Math.max(0, Math.floor(Math.min(...ys)) - 3));
    const rx1 = Math.max(rx0 + 1, Math.min(W, Math.ceil(Math.max(...xs)) + 4)), ry1 = Math.max(ry0 + 1, Math.min(H, Math.ceil(Math.max(...ys)) + 4));
    // La bande seule : sortie décalée de y0, source décalée de la zone lue.
    const mb = produit(produit([1, 0, 0, 0, 1, -y0, 0, 0, 1], m), [1, 0, rx0, 0, 1, ry0, 0, 0, 1]);
    const zone = cv.matFromImageData(ctxSource.getImageData(rx0, ry0, rx1 - rx0, ry1 - ry0)), Mb = cv.matFromArray(3, 3, cv.CV_64F, mb), sortie = new cv.Mat();
    try {
      cv.warpPerspective(zone, sortie, Mb, new cv.Size(d.largeur, hb), cv.INTER_LINEAR, cv.BORDER_REPLICATE, new cv.Scalar());
      if (d.format === 'gris') {
        const g = new cv.Mat();
        cv.cvtColor(sortie, g, cv.COLOR_RGBA2GRAY);
        bandes.push(new Uint8Array(g.data as Uint8Array));
        g.delete();
      } else {
        const canevas = new OffscreenCanvas(d.largeur, hb);
        canevas.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(sortie.data as Uint8Array), d.largeur, hb), 0, 0);
        const blob = await canevas.convertToBlob({ type: 'image/jpeg', quality: d.qualite ?? 0.85 });
        bandes.push(enBase64(new Uint8Array(await blob.arrayBuffer())));
      }
    } finally { liberer(zone, Mb, sortie); }
  }
  if (d.format === 'gris' && d.fond) return { versSource: mi, versSortie: m, bandes: [sansOmbre(bandes as Uint8Array[], d.largeur, d.fond)] };
  return { versSource: mi, versSortie: m, bandes };
}

/**
 * L'image entière (bandes recollées), divisée par son fond : le fond est le plus clair du voisinage (dilatation, noyau `k` ≈ une ligne de texte, qui
 * efface le texte), lissé (médiane) ; gris / fond × 255. La normalisation d'éclairage d'école : une ombre ou un dégradé baissent le contraste du texte
 * en proportion, la division le lui rend (une soustraction le laisse bas : pièges h0023, h0062, texte flou sous l'ombre coupé en silence).
 */
function sansOmbre(bandes: Uint8Array[], largeur: number, k: number): Uint8Array {
  const total = bandes.reduce((s, b) => s + b.length, 0), gris = new cv.Mat(total / largeur, largeur, cv.CV_8UC1);
  let o = 0;
  for (const b of bandes) { (gris.data as Uint8Array).set(b, o); o += b.length; }
  const fond = new cv.Mat(), sortie = new cv.Mat(), noyau = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(k, k));
  try {
    cv.dilate(gris, fond, noyau);
    cv.medianBlur(fond, fond, 2 * Math.floor(k / 2) + 1);
    cv.divide(gris, fond, sortie, 255);
    return new Uint8Array(sortie.data as Uint8Array);
  } finally { liberer(gris, fond, sortie, noyau); }
}

portee.onmessage = async (e: MessageEvent<Demande>) => {
  const d = e.data;
  try {
    if (d.type === 'charger') { const t0 = performance.now(); await charger(d.url); portee.postMessage({ id: d.id, ok: true, ms: Math.round(performance.now() - t0) }); return; }
    if (!cv) throw new Error('OpenCV.js non chargé');
    if (d.type === 'source') {
      source = new OffscreenCanvas(d.image.width, d.image.height);
      ctxSource = source.getContext('2d', { willReadFrequently: true })!;
      ctxSource.drawImage(d.image, 0, 0); d.image.close();
      portee.postMessage({ id: d.id, ok: true, largeur: source.width, hauteur: source.height });
    } else if (d.type === 'detecter') portee.postMessage({ id: d.id, ok: true, ...detecter() });
    else if (d.type === 'rendre') {
      const r = await rendre(d);
      portee.postMessage({ id: d.id, ok: true, ...r }, r.bandes.filter((b): b is Uint8Array => typeof b !== 'string').map(b => b.buffer));
    } else if (d.type === 'liberer') { if (source) { source.width = 0; source.height = 0; } source = null; ctxSource = null; portee.postMessage({ id: d.id, ok: true }); }
  } catch (err) {
    portee.postMessage({ id: d.id, ok: false, erreur: err instanceof Error ? err.message : String(err) });
  }
};
