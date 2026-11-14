/**
 * Le mur du stock (maquette sy/fA, choisie par le brasseur : « Implémente fA dans la vraie app », 14.11).
 * Fonctions pures : classement des houblons par style, échelles de clarté CIELAB, formes, ordre des colonnes, socle, pastilles vides.
 * Rien ici ne lit le stock ni l'écran. Une donnée inconnue reste inconnue (jamais 0).
 */

// ---------- CIELAB (D65), pour une clarté qui suit la grandeur et non un palier ----------
export type Lab = [number, number, number];
const versLineaire = (v: number) => (v > 0.04045 ? ((v + 0.055) / 1.055) ** 2.4 : v / 12.92);
const versSrgb = (v: number) => { const c = Math.max(0, Math.min(1, v)); return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; };

export function labDeHex(hex: string): Lab {
  const m = hex.replace('#', '').match(/../g);
  if (!m || m.length < 3) return [50, 0, 0];
  const [r, g, b] = m.slice(0, 3).map((v) => versLineaire(parseInt(v, 16) / 255));
  const t = (v: number) => (v > 216 / 24389 ? Math.cbrt(v) : ((24389 / 27) * v + 16) / 116);
  const X = t((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047), Y = t(0.2126 * r + 0.7152 * g + 0.0722 * b), Z = t((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883);
  return [116 * Y - 16, 500 * (X - Y), 200 * (Y - Z)];
}

function rgbLineaire(L: number, A: number, B: number): [number, number, number] {
  const fy = (L + 16) / 116, fx = fy + A / 500, fz = fy - B / 200;
  const inv = (t: number) => (t ** 3 > 216 / 24389 ? t ** 3 : (116 * t - 16) / (24389 / 27));
  const X = 0.95047 * inv(fx), Y = inv(fy), Z = 1.08883 * inv(fz);
  return [3.2406 * X - 1.5372 * Y - 0.4986 * Z, -0.9689 * X + 1.8758 * Y + 0.0415 * Z, 0.0557 * X - 0.204 * Y + 1.057 * Z];
}
const dansGamut = (L: number, A: number, B: number) => rgbLineaire(L, A, B).every((v) => v >= -0.001 && v <= 1.001);

export function hexDeLab(L: number, A: number, B: number): string {
  return '#' + rgbLineaire(L, A, B).map((v) => Math.round(versSrgb(v) * 255).toString(16).padStart(2, '0')).join('');
}

// ---------- échelles de clarté (L*) : plus la grandeur est forte, plus c'est foncé ----------
/** α du stock : 3,3 % → L* 92, 15,2 % → L* 22 (5,9 L* par point, sans coude). α inconnu : le milieu de l'échelle, signalé par un hachuré ailleurs. */
export const ALPHA_MIN = 3.3, ALPHA_MAX = 15.2;
export const lAlpha = (alpha: number | null | undefined): number => {
  const a = alpha == null ? (ALPHA_MIN + ALPHA_MAX) / 2 : alpha;
  return Math.max(22, Math.min(92, 92 - (70 * (a - ALPHA_MIN)) / (ALPHA_MAX - ALPHA_MIN)));
};
/** EBC : échelle logarithmique, 3 → L* 92, 1 400 → L* 14. */
export const lEbc = (ebc: number): number => Math.max(14, Math.min(92, 92 - (78 * Math.log(Math.max(ebc, 1) / 3)) / Math.log(1400 / 3)));
/** Atténuation : sur les levures du stock, la plus atténuante → L* 26, la moins → L* 88 ; une seule valeur : le milieu. */
export const lAttenuation = (att: number, bornes: { min: number; max: number }): number =>
  bornes.max > bornes.min ? 88 - (62 * (att - bornes.min)) / (bornes.max - bornes.min) : 57;
export const bornesAttenuation = (valeurs: Array<number | null | undefined>): { min: number; max: number } | null => {
  const v = valeurs.filter((x): x is number => typeof x === 'number' && Number.isFinite(x));
  return v.length ? { min: Math.min(...v), max: Math.max(...v) } : null;
};

/** Chemin de teinte d'un arôme : angle LCh au pâle puis au foncé, chroma conservée dans le foncé (jaune et orange restent vifs, l'épicé reste brun). */
const CHEMIN: Record<string, { hC: number; hF: number; kC: number; cMax?: number }> = {
  '#d9b414': { hC: 100, hF: 80, kC: 0.6 },
  '#ee9b2f': { hC: 66, hF: 44, kC: 0.6 },
  '#7a4e3a': { hC: 80, hF: 58, kC: 0.8, cMax: 24 },
};
/** Couleur d'un houblon : la teinte de son arôme (hex), à la clarté L* voulue. */
export function couleurALaClarte(hexArome: string, L: number): string {
  const q = CHEMIN[hexArome.toLowerCase()];
  const C0 = labDeHex(hexArome);
  const t = Math.max(0, Math.min(1, (L - 22) / 70));
  const h = q ? (((q.hF + (q.hC - q.hF) * t) * Math.PI) / 180) : Math.atan2(C0[2], C0[1]);
  let c = Math.hypot(C0[1], C0[2]) * (1 - (1 - (q ? q.kC : 0.4)) * t);
  if (q?.cMax) c = Math.min(c, q.cMax);
  while (c > 0 && !dansGamut(L, c * Math.cos(h), c * Math.sin(h))) c -= 0.5;
  c = Math.max(0, c);
  return hexDeLab(L, c * Math.cos(h), c * Math.sin(h));
}
export const couleurHoublon = (hexArome: string, alpha: number | null | undefined): string => couleurALaClarte(hexArome, lAlpha(alpha));

/** Malt : la teinte est interpolée entre les 4 repères de la légende EBC, à la clarté de l'EBC. */
const REPERES_EBC = ['#F2C14E', '#C87A2C', '#7B4A2A', '#3B1F14'];
export function couleurMalt(ebc: number): string {
  const L = lEbc(ebc), A = REPERES_EBC.map(labDeHex);
  let a: number, b: number;
  if (L >= A[0][0]) [, a, b] = A[0];
  else if (L <= A[A.length - 1][0]) [, a, b] = A[A.length - 1];
  else {
    const i = A.findIndex((x) => x[0] <= L), u = (A[i - 1][0] - L) / (A[i - 1][0] - A[i][0]);
    a = A[i - 1][1] + (A[i][1] - A[i - 1][1]) * u; b = A[i - 1][2] + (A[i][2] - A[i - 1][2]) * u;
  }
  let s = 1;
  while (s > 0 && !dansGamut(L, a * s, b * s)) s -= 0.01;
  return hexDeLab(L, a * Math.max(0, s), b * Math.max(0, s));
}
/** Levure : la teinte de la colonne, à la clarté de l'atténuation. */
export function couleurLevure(hexColonne: string, att: number | null | undefined, bornes: { min: number; max: number } | null): string {
  if (att == null || !bornes) return hexColonne;
  const L = lAttenuation(att, bornes), C = labDeHex(hexColonne);
  let s = 1;
  while (s > 0 && !dansGamut(L, C[1] * s, C[2] * s)) s -= 0.01;
  return hexDeLab(L, C[1] * Math.max(0, s), C[2] * Math.max(0, s));
}

// ---------- formes ----------
export type SommetHoublon = 'pointe' | 'dome' | 'creux' | 'plat';
export type FamilleBrasseur = 'modernes' | 'nobles' | 'classiques' | 'amerisants' | 'autre';
/** q10 : le sommet dit la famille de brasseur, quelle que soit la colonne de style. */
export const SOMMET: Record<FamilleBrasseur, SommetHoublon> = { modernes: 'pointe', nobles: 'dome', classiques: 'creux', amerisants: 'plat', autre: 'plat' };
export type FormeCereale = 'droite' | 'pointe' | 'biseau' | 'dome' | 'creux';
/** m1 : la forme dit la céréale. Orge droite, blé pointe, seigle biseau, avoine dôme, autres (épeautre, maïs, riz, sucre) creux. */
export function formeCereale(nom: string): FormeCereale {
  const n = nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (/seigle|rye|roggen/.test(n)) return 'biseau';
  if (/avoine|oat|hafer/.test(n)) return 'dome';
  if (/(^|[^a-z])(ble|wheat|weizen|froment|weiz)/.test(n)) return 'pointe';
  if (/epeautre|spelt|mais|corn|riz|rice|sucre|sugar|dextrose|miel|honey/.test(n)) return 'creux';
  return 'droite';
}
/** Tracé SVG d'une marque de houblon de hauteur h et de largeur w. */
export function traceHoublon(s: SommetHoublon, h: number, w = 8): string {
  const k = Math.min(5, h - 1);
  if (s === 'pointe') return `M0 ${h}V${k}L${w / 2} 0L${w} ${k}V${h}Z`;
  if (s === 'dome') return `M0 ${h}V${k}A${w / 2} ${k} 0 0 1 ${w} ${k}V${h}Z`;
  if (s === 'creux') return `M0 ${h}V0L${w / 2} ${Math.min(4.5, h - 1.5)}L${w} 0V${h}Z`;
  return `M0 ${h}V0H${w}V${h}Z`;
}
export function traceCereale(f: FormeCereale, h: number, w = 8): string {
  const k = Math.min(5, h - 1);
  if (f === 'pointe') return `M0 ${h}V${k}L${w / 2} 0L${w} ${k}V${h}Z`;
  if (f === 'biseau') return `M0 ${h}V${k}L${w} 0V${h}Z`;
  if (f === 'dome') return `M0 ${h}V${Math.min(4, h - 1)}A${w / 2} ${Math.min(4, h - 1)} 0 0 1 ${w} ${Math.min(4, h - 1)}V${h}Z`;
  if (f === 'creux') return `M0 ${h}V0L${w / 2} ${Math.min(4, h - 1)}L${w} 0V${h}Z`;
  return `M0 ${h}V0H${w}V${h}Z`;
}

// ---------- houblons : colonnes de style (jeu S3 de sx/STYLES.md) ----------
export interface ColonneStyle { id: string; nom: string; court: string; styles: string[] }
export const COLONNES_STYLE: readonly ColonneStyle[] = [
  { id: 'hazy', nom: 'NEIPA / Hazy', court: 'Hazy', styles: ['21C'] },
  { id: 'westcoast', nom: 'West Coast & Double IPA', court: 'W. Coast', styles: ['21A', '22A'] },
  { id: 'pale', nom: 'Pale & Session', court: 'Pale', styles: ['18B', '1A', '11B', '12C'] },
  { id: 'lager', nom: 'Lager & Pils', court: 'Lager', styles: ['3A', '3B', '4A', '5D', '5B', '7B'] },
  { id: 'belges', nom: 'Belges, Blés & Sours', court: 'Belge/Blé', styles: ['25A', '25B', '26C', '10A', '23A', '23G', '24A'] },
  { id: 'stouts', nom: 'Stouts & Porters', court: 'Stouts', styles: ['13C', '15B', '15C', '16A', '16B', '16C', '16D', '20A', '20B', '20C', '9C'] },
];
export const CAPACITE_COLONNE = 6;

/** Typicité d'un houblon dans une colonne : la plus grande part publiée sur ses styles. Aucune part publiée : inconnue (null), jamais 0. */
export function typiciteColonne(parts: Record<string, number> | null | undefined, col: ColonneStyle): number | null {
  if (!parts) return null;
  const v = col.styles.map((s) => parts[s]).filter((x): x is number => typeof x === 'number' && Number.isFinite(x));
  return v.length ? Math.max(...v) : null;
}

/**
 * Flot de coût minimum (plus courts chemins successifs, SPFA) : chaque ligne va dans une colonne, chaque colonne reçoit au plus cap[j] lignes.
 * Problème d'école : affectation avec capacités. Rend la colonne de chaque ligne (−1 si aucune place).
 */
export function flotMin(cout: number[][], cap: number[]): { cout: number; col: number[] } {
  const n = cout.length, k = cap.length, S = n + k, T = n + k + 1, N = n + k + 2;
  type Arete = { v: number; capa: number; cout: number; r: number };
  const g: Arete[][] = Array.from({ length: N }, () => []);
  const arete = (u: number, v: number, capa: number, c: number) => { g[u].push({ v, capa, cout: c, r: g[v].length }); g[v].push({ v: u, capa: 0, cout: -c, r: g[u].length - 1 }); };
  for (let i = 0; i < n; i++) { arete(S, i, 1, 0); for (let j = 0; j < k; j++) arete(i, n + j, 1, cout[i][j]); }
  for (let j = 0; j < k; j++) arete(n + j, T, cap[j], 0);
  let flot = 0, total = 0;
  while (flot < n) {
    const dist = new Array<number>(N).fill(Infinity), prec = new Array<[number, number] | null>(N).fill(null), dans = new Array<boolean>(N).fill(false);
    dist[S] = 0; const file = [S];
    while (file.length) {
      const u = file.shift()!; dans[u] = false;
      g[u].forEach((e, idx) => { if (e.capa > 0 && dist[u] + e.cout < dist[e.v] - 1e-12) { dist[e.v] = dist[u] + e.cout; prec[e.v] = [u, idx]; if (!dans[e.v]) { dans[e.v] = true; file.push(e.v); } } });
    }
    if (dist[T] === Infinity) break;
    for (let v = T; v !== S;) { const [u, idx] = prec[v]!; const e = g[u][idx]; e.capa -= 1; g[v][e.r].capa += 1; v = u; }
    flot += 1; total += dist[T];
  }
  const col = new Array<number>(n).fill(-1);
  for (let i = 0; i < n; i++) for (const e of g[i]) if (e.v >= n && e.v < n + k && e.capa === 0) col[i] = e.v - n;
  return { cout: total, col };
}

export interface HoublonAClasser { id: string; parts: Record<string, number> | null; famille?: FamilleBrasseur; origine?: string | null; alpha?: number | null }
/**
 * Typicité minimale (part des recettes d'un style qui contiennent le houblon, Beer Analytics) pour qu'un houblon passe par le flot. Sous 6 %, sa meilleure part
 * est du bruit (Motueka 3,8 % : Stouts, Aramis 0,6 %, Glacier 1,9 %) : le flot le rangeait là où il restait de la place. Réglé sur la moitié A des 55 houblons de
 * référence (ordre alphabétique, rangs pairs), vérifié sur la moitié B ; palier plat de 4 % à 8 % sur A et B, 6 % en son milieu, et au-dessus de Nelson Sauvin (5,5 %)
 * pour qu'il tombe toujours dans la même colonne. Voir work/missions/2026-11-11-stock/voies/ta/RESULTAT-2.md.
 */
export const SEUIL_TYPICITE = 0.06;
const meilleurePart = (h: HoublonAClasser): number | null => {
  const t = COLONNES_STYLE.map((c) => typiciteColonne(h.parts, c)).filter((x): x is number => x != null);
  return t.length ? Math.max(...t) : null;
};
/** Repli d'un houblon sans part publiée ou sous SEUIL_TYPICITE : sa famille de brasseur dit sa colonne la plus probable ; à défaut, Pale (la plus neutre). Dit « classé par défaut ». */
const COLONNE_PAR_FAMILLE: Record<FamilleBrasseur, string> = { modernes: 'hazy', classiques: 'westcoast', nobles: 'lager', amerisants: 'westcoast', autre: 'pale' };
/** La famille affinée par l'origine : un anglais va aux Pale & Session (bitter), un amérisant d'Europe centrale aux Lager, un américain d'α ≤ 6 % (Liberty, Mount Hood, Sterling) aux Pale & Session plutôt qu'en W. Coast. */
const colonneParDefaut = (h: HoublonAClasser): string => {
  const o = (h.origine ?? '').toUpperCase(); const f = h.famille ?? 'autre';
  if (o === 'UK' || o === 'GB') return 'pale';
  if (f === 'amerisants' && ['DE', 'CZ', 'SI', 'AT', 'PL'].includes(o)) return 'lager';
  if ((o === 'US' || o === 'CA') && h.alpha != null && h.alpha <= 6 && f !== 'modernes') return 'pale';
  return COLONNE_PAR_FAMILLE[f];
};

/**
 * Chaque houblon dans une colonne, six au plus par colonne, en perdant le moins de typicité (coût = 1 − typicité / meilleure typicité du houblon).
 * Un houblon dont la meilleure part publiée atteint SEUIL_TYPICITE est affecté par le flot ; un houblon hors table ou trop peu typé va à la colonne de sa famille (dit « par défaut »).
 * Au-delà de 36 houblons classés les colonnes ne peuvent plus tenir six : chacun va alors à sa colonne de plus forte typicité.
 */
export function classerHoublons(hs: HoublonAClasser[]): Record<string, { colonne: string; parDefaut: boolean; deplace: boolean }> {
  const sortie: Record<string, { colonne: string; parDefaut: boolean; deplace: boolean }> = {};
  const connus = hs.filter((h) => (meilleurePart(h) ?? 0) >= SEUIL_TYPICITE);
  for (const h of hs) if (!connus.includes(h)) sortie[h.id] = { colonne: colonneParDefaut(h), parDefaut: true, deplace: false };
  const cost = connus.map((h) => {
    const t = COLONNES_STYLE.map((c) => typiciteColonne(h.parts, c));
    const best = Math.max(...t.map((x) => x ?? 0));
    return t.map((x) => (x == null ? 1 : 1 - x / best));
  });
  const meilleure = connus.map((h) => { const t = COLONNES_STYLE.map((c) => typiciteColonne(h.parts, c) ?? -1); return t.indexOf(Math.max(...t)); });
  const cap = COLONNES_STYLE.map(() => (connus.length > CAPACITE_COLONNE * COLONNES_STYLE.length ? connus.length : CAPACITE_COLONNE));
  const { col } = flotMin(cost, cap);
  connus.forEach((h, i) => {
    const j = col[i] >= 0 ? col[i] : meilleure[i];
    sortie[h.id] = { colonne: COLONNES_STYLE[j].id, parDefaut: false, deplace: j !== meilleure[i] };
  });
  return sortie;
}

// ---------- ordre dans la colonne, socle, pastilles vides ----------
/** Du plus fort au moins fort ; valeur inconnue en dernier ; à valeur égale, la plus grande quantité d'abord. */
export function ordreColonne<T>(items: T[], force: (x: T) => number | null | undefined, quantite: (x: T) => number | null | undefined): T[] {
  return [...items].sort((p, q) => {
    const a = force(p), b = force(q);
    if (a == null && b != null) return 1;
    if (b == null && a != null) return -1;
    if (a != null && b != null && a !== b) return b - a;
    return (quantite(q) ?? 0) - (quantite(p) ?? 0);
  });
}
/** Teinte du socle sous une marque : l'encre de la colonne mêlée au blanc ; foncée = la plus forte de la colonne (22 % → 100 %). Valeur inconnue : pas de teinte. */
export function couleurSocle(encre: string, valeur: number | null | undefined, lo: number, hi: number): string | null {
  if (valeur == null) return null;
  const t = hi > lo ? 0.22 + 0.78 * Math.max(0, Math.min(1, (valeur - lo) / (hi - lo))) : 1;
  const C = labDeHex(encre);
  return hexDeLab(100 + (C[0] - 100) * t, C[1] * t, C[2] * t);
}
/** Les colonnes sans article d'un rayon, en pastilles : 3 au plus, les plus attendues d'abord. Un rayon plein n'en montre aucune. */
export function pastillesVides(toutes: string[], remplies: string[], max = 3): string[] {
  return toutes.filter((c) => !remplies.includes(c)).slice(0, max);
}
