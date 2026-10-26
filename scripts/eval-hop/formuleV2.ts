// Formule du moteur v2 de Substituer (#181, voie e2) : fonctions pures, partagées par le banc hors ligne (moteur-v2.ts) et, en phase 2,
// recopiées à l'identique dans src/domain/hopIndex/v4/substitution.ts (un test compare les deux).
// Une ressemblance par variable (0 à 1, ou NaN si l'une des deux fiches l'ignore) ; moyenne pondérée des variables connues.
export type Moment3 = 'am' | 'ch' | 'fr';
export type R = [number, number];
export interface FicheV2 {
  alpha: R | null; beta: R | null; cohu: R | null; huile: R | null;
  myr: R | null; hum: R | null; car: R | null; far: R | null; lin: R | null; ger: R | null;
  role: string | null; aromaV: number[] | null; levels: number[]; mots: Set<string>; radar: number[] | null;
}
export const VARS = ['α', 'β', 'cohumulone', 'usage', 'huile totale', 'myrcène', 'humulène', 'caryophyllène', 'farnésène', 'linalol', 'géraniol', 'familles', 'mots', 'radar BM'] as const;
export const NV = VARS.length;
export const GROUPE = [
  { nom: 'amertume', ids: [0, 1, 2, 3] },
  { nom: 'huile', ids: [4, 5, 6, 7, 8, 9, 10] },
  { nom: 'arôme', ids: [11, 12, 13] },
];
/** Poids à l'intérieur de chaque groupe, fixés à la main selon le moment (la somme d'un groupe vaut 1). Ordres : [α, β, cohumulone, usage] et
 * [huile totale, myrcène, humulène, caryophyllène, farnésène, linalol, géraniol]. Arôme : familles, mots, radar (voir poidsV2). */
export const PROFILS: Record<Moment3, { amertume: number[]; huile: number[] }> = {
  am: { amertume: [0.4, 0.2, 0.2, 0.2], huile: [0.25, 0.05, 0.3, 0.25, 0.05, 0.05, 0.05] },
  ch: { amertume: [0.3, 0.2, 0.1, 0.4], huile: [0.2, 0.15, 0.15, 0.1, 0.1, 0.2, 0.1] },
  fr: { amertume: [0.25, 0.15, 0.1, 0.5], huile: [0.25, 0.1, 0.1, 0.05, 0.1, 0.25, 0.15] },
};
/** Poids d'une variable : poids du groupe × poids intérieur. `g` = [amertume, huile, arôme] ; `partMots` = part des mots dans l'arôme
 * (hors radar, fixé à 0,1) aux moments d'arôme. À l'amertume, seule compte la part étrangère des familles (comme aujourd'hui). */
export function poidsV2(mo: Moment3, g: [number, number, number], partMots: number): Float64Array {
  const w = new Float64Array(NV), p = PROFILS[mo];
  p.amertume.forEach((x, i) => { w[i] = g[0] * x; });
  p.huile.forEach((x, i) => { w[4 + i] = g[1] * x; });
  if (mo === 'am') w[11] = g[2];
  else { w[11] = g[2] * 0.9 * (1 - partMots); w[12] = g[2] * 0.9 * partMots; w[13] = g[2] * 0.1; }
  return w;
}

const mid = (r: R) => (r[0] + r[1]) / 2;
const half = (r: R) => (r[1] - r[0]) / 2;
export const ratioSim = (x: number, y: number) => Math.max(0, 1 - Math.abs(Math.log(x / y)) / Math.log(3));
const roleSim = (x: string, y: string) => (x === y ? 1 : x === 'double' || y === 'double' ? 0.5 : 0);
const CHAMPS: (keyof FicheV2)[] = ['alpha', 'beta', 'cohu', 'huile', 'myr', 'hum', 'car', 'far', 'lin', 'ger'];
const VAR_DE_CHAMP = [0, 1, 2, 4, 5, 6, 7, 8, 9, 10];

/** Écart-type des milieux de plage du catalogue, par variable de composition (indices 2 et 5 à 10 ; 0 ailleurs). */
export function sigmaDe(fiches: FicheV2[]): number[] {
  const out = new Array<number>(NV).fill(0);
  CHAMPS.forEach((c, k) => {
    const v = VAR_DE_CHAMP[k];
    if (v === 0 || v === 1 || v === 4) return;
    const xs = fiches.map((f) => f[c] as R | null).filter((r): r is R => !!r).map(mid);
    const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
    out[v] = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length);
  });
  return out;
}
/** Poids de rareté des mots (log((N+1)/(max(df, 8)+1)) : un mot compte comme s'il figurait dans 8 fiches au moins) et norme carrée, par houblon. */
export interface MotsPoids { w: Map<string, number>; n2: number }
export function motsPoids(fiches: FicheV2[], plafondDf = 8): MotsPoids[] {
  const df = new Map<string, number>();
  for (const f of fiches) for (const x of f.mots) df.set(x, (df.get(x) ?? 0) + 1);
  const N = fiches.length;
  return fiches.map((f) => { const w = new Map<string, number>(); let n2 = 0; for (const x of f.mots) { const y = Math.log((N + 1) / (Math.max(df.get(x) ?? 0, plafondDf) + 1)); w.set(x, y); n2 += y * y; } return { w, n2 }; });
}
const nan = Number.NaN;

/** Ressemblance de chaque variable entre l'original `a` et le candidat `b`, écrite dans out[off + v] (NaN : inconnue d'au moins un des deux).
 * `amertume` : contexte d'amertume (un α plus haut est permis ; amérisant et double tiennent le même rôle ; l'arôme est la part non étrangère). */
export function similitudes(a: FicheV2, b: FicheV2, amertume: boolean, sigma: number[], ma: MotsPoids, mb: MotsPoids, out: Float64Array, off: number): void {
  for (let v = 0; v < NV; v++) out[off + v] = nan;
  if (a.alpha && b.alpha) out[off] = amertume && mid(b.alpha) >= mid(a.alpha) ? 1 : ratioSim(mid(a.alpha), mid(b.alpha));
  if (a.beta && b.beta) out[off + 1] = ratioSim(mid(a.beta), mid(b.beta));
  if (a.role && b.role) out[off + 3] = amertume && a.role !== 'aromatique' && b.role !== 'aromatique' ? 1 : roleSim(a.role, b.role);
  if (a.huile && b.huile) out[off + 4] = ratioSim(mid(a.huile), mid(b.huile));
  CHAMPS.forEach((c, k) => {
    const v = VAR_DE_CHAMP[k];
    if (v === 0 || v === 1 || v === 4) return;
    const x = a[c] as R | null, y = b[c] as R | null;
    if (!x || !y || !sigma[v]) return;
    const gap = Math.max(0, Math.abs(mid(x) - mid(y)) - (half(x) + half(y)) / 2);
    out[off + v] = Math.max(0, 1 - gap / (2 * sigma[v]));
  });
  // Familles : cosinus ; à l'amertume, 1 − part du vecteur du candidat sur des familles que l'original ne cite pas.
  const A = a.aromaV, B = b.aromaV;
  if (A && B) {
    if (amertume) {
      let foreign = 0, total = 0;
      for (let i = 0; i < A.length; i++) { total += B[i]; if (a.levels[i] === 0) foreign += B[i]; }
      if (total) out[off + 11] = 1 - foreign / total;
    } else {
      let dot = 0, na = 0, nb = 0;
      for (let i = 0; i < A.length; i++) { dot += A[i] * B[i]; na += A[i] ** 2; nb += B[i] ** 2; }
      out[off + 11] = na && nb ? dot / Math.sqrt(na * nb) : 0;
    }
  }
  // Mots : cosinus pondéré par la rareté ; moins de 2 mots partagés : 0 (la garde de e1). Inconnu si l'une des fiches n'a aucun mot.
  if (ma.w.size && mb.w.size) {
    let dot = 0, n = 0;
    for (const [x, y] of ma.w) if (mb.w.has(x)) { dot += y * y; n++; }
    out[off + 12] = n < 2 ? 0 : ma.n2 && mb.n2 ? dot / Math.sqrt(ma.n2 * mb.n2) : 0;
  }
  // Radar Beer Maverick (9 axes) : un radar tout à zéro vaut « pas de donnée ».
  if (a.radar && b.radar) {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < 9; i++) { dot += a.radar[i] * b.radar[i]; na += a.radar[i] ** 2; nb += b.radar[i] ** 2; }
    if (na && nb) out[off + 13] = dot / Math.sqrt(na * nb);
  }
}
