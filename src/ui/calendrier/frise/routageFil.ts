/**
 * Paquet D n° 1 (18.11, « La ligne doit pas être dessus l'info ») : le fil d'un jalon à sa barre liée se trace dans une voie libre, à côté
 * des noms, des montants et des icônes, jamais à travers.
 *
 * État de l'art : c'est le routage orthogonal d'un connecteur entre obstacles rectangulaires (diagrammes : libavoid, Wybrow, Marriott et
 * Stuckey 2009 ; circuits : algorithme de Lee 1961). Méthode standard à cette échelle (un fil, quelques dizaines de boîtes) : plus court
 * chemin A* sur une grille, avec un coût par virage pour garder peu de coudes. Pas de bibliothèque : libavoid (WASM) ou elkjs pèsent plus
 * d'un mégaoctet pour un seul fil ; le calcul tient ici en quelques millisecondes, et seulement quand un fil est allumé.
 *
 * Traverser une info n'est pas interdit mais très cher : quand aucune voie n'existe (la fiche ouverte couvre toute la largeur), le fil passe
 * dessous au plus court, et le masque de la frise le coupe au bord de l'élément (CAL-FIL-SOUS-INFO).
 */

export interface BoiteRoute { left: number; top: number; right: number; bottom: number }

/** Le pas de la grille (px), la distance gardée à chaque info (px), le prix d'un pas sous une info et d'un virage (en pas). */
const PAS = 4;
const GARDE = 2;
const PRIX_SOUS_INFO = 60;
const PRIX_VIRAGE = 4;

const contient = (b: BoiteRoute, x: number, y: number) => x >= b.left && x <= b.right && y >= b.top && y <= b.bottom;
const touche = (a: BoiteRoute, b: BoiteRoute) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

/** Un tas binaire minimal (file de priorité de l'A*). */
class Tas {
  private cles: number[] = [];
  private prio: number[] = [];
  get taille() { return this.cles.length; }
  pousser(cle: number, p: number) {
    const c = this.cles, q = this.prio;
    c.push(cle); q.push(p);
    let i = c.length - 1;
    while (i > 0) {
      const m = (i - 1) >> 1;
      if (q[m] <= q[i]) break;
      [c[m], c[i]] = [c[i], c[m]]; [q[m], q[i]] = [q[i], q[m]];
      i = m;
    }
  }
  tirer(): number {
    const c = this.cles, q = this.prio;
    const haut = c[0];
    const dc = c.pop() as number, dq = q.pop() as number;
    if (c.length) {
      c[0] = dc; q[0] = dq;
      let i = 0;
      for (;;) {
        const g = 2 * i + 1, d = g + 1;
        let m = i;
        if (g < c.length && q[g] < q[m]) m = g;
        if (d < c.length && q[d] < q[m]) m = d;
        if (m === i) break;
        [c[m], c[i]] = [c[i], c[m]]; [q[m], q[i]] = [q[i], q[m]];
        i = m;
      }
    }
    return haut;
  }
}

/** Les points du chemin (repère de la frise), sans les points alignés ; `null` : le jalon et la barre se touchent en hauteur. */
export function routerFil(jalon: BoiteRoute, barre: BoiteRoute, obstacles: readonly BoiteRoute[], largeur: number): Array<[number, number]> | null {
  const monte = jalon.top > barre.bottom;
  if (!monte && !(jalon.bottom < barre.top)) return null;
  const cx = (jalon.left + jalon.right) / 2, cyJ = (jalon.top + jalon.bottom) / 2, cxB = (barre.left + barre.right) / 2, cyB = (barre.top + barre.bottom) / 2;
  const y0 = monte ? jalon.top : jalon.bottom, y1 = monte ? barre.bottom : barre.top;
  const xMin = barre.left + Math.min(6, (barre.right - barre.left) / 2), xMax = barre.right - Math.min(6, (barre.right - barre.left) / 2);
  /* les infos du jalon et de la barre eux-mêmes (leur nom, leur icône, ce qui les contient) ne sont pas des obstacles : le fil part d'eux */
  const murs = obstacles
    .filter(o => !contient(o, cx, cyJ) && !contient(o, cxB, cyB) && !touche(o, barre) && !touche(o, jalon))
    .map(o => ({ left: o.left - GARDE, top: o.top - GARDE, right: o.right + GARDE, bottom: o.bottom + GARDE }));

  /* la grille : une colonne passe par le centre du jalon ; les rangs vont du bord du jalon au bord de la barre */
  const ox = cx - Math.floor(cx / PAS) * PAS;
  const nx = Math.max(1, Math.floor((Math.max(largeur, cx) - ox) / PAS) + 1);
  const haut = Math.min(y0, y1), bas = Math.max(y0, y1);
  const ny = Math.max(1, Math.floor((bas - haut) / PAS));
  const oy = haut + ((bas - haut) - (ny - 1) * PAS) / 2;
  const X = (i: number) => ox + i * PAS, Y = (j: number) => oy + j * PAS;
  const sousInfo = new Uint8Array(nx * ny);
  for (const m of murs) {
    const i0 = Math.max(0, Math.ceil((m.left - ox) / PAS)), i1 = Math.min(nx - 1, Math.floor((m.right - ox) / PAS));
    const j0 = Math.max(0, Math.ceil((m.top - oy) / PAS)), j1 = Math.min(ny - 1, Math.floor((m.bottom - oy) / PAS));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) sousInfo[j * nx + i] = Math.min(255, sousInfo[j * nx + i] + 1);
  }
  const iDep = Math.round((cx - ox) / PAS), jDep = monte ? ny - 1 : 0, jArr = monte ? 0 : ny - 1;
  const arrivee = (i: number, j: number) => j === jArr && X(i) >= xMin && X(i) <= xMax;
  const hX = (i: number) => (X(i) < xMin ? Math.ceil((xMin - X(i)) / PAS) : X(i) > xMax ? Math.ceil((X(i) - xMax) / PAS) : 0);

  /* A* : un état = une case et son sens (0 vertical, 1 horizontal) ; le départ et l'arrivée sont verticaux */
  const n = nx * ny;
  const cout = new Float64Array(n * 2).fill(Infinity);
  const venu = new Int32Array(n * 2).fill(-1);
  const tas = new Tas();
  const dep = (jDep * nx + iDep) * 2;
  cout[dep] = sousInfo[jDep * nx + iDep] * PRIX_SOUS_INFO;
  tas.pousser(dep, cout[dep] + hX(iDep) + Math.abs(jArr - jDep));
  const fait = new Uint8Array(n * 2);
  let fin = -1;
  while (tas.taille) {
    const s = tas.tirer();
    if (fait[s]) continue;
    fait[s] = 1;
    const c = s >> 1, sens = s & 1, i = c % nx, j = (c - i) / nx;
    if (arrivee(i, j) && sens === 0) { fin = s; break; }
    for (const [di, dj] of [[0, -1], [0, 1], [-1, 0], [1, 0]] as const) {
      const a = i + di, b = j + dj;
      if (a < 0 || a >= nx || b < 0 || b >= ny) continue;
      const ns = dj ? 0 : 1;
      const cle = ((b * nx + a) << 1) | ns;
      const g = cout[s] + (1 + sousInfo[b * nx + a] * PRIX_SOUS_INFO) + (ns !== sens ? PRIX_VIRAGE : 0);
      if (g < cout[cle]) { cout[cle] = g; venu[cle] = s; tas.pousser(cle, g + hX(a) + Math.abs(jArr - b)); }
    }
    /* tourner sur place vers le vertical (pour finir à la verticale) */
    const v = c << 1;
    if (sens === 1 && cout[s] + PRIX_VIRAGE < cout[v]) { cout[v] = cout[s] + PRIX_VIRAGE; venu[v] = s; tas.pousser(v, cout[v] + hX(i) + Math.abs(jArr - j)); }
  }
  if (fin < 0) return null;
  const cases: Array<[number, number]> = [];
  for (let s = fin; s >= 0; s = venu[s]) { const c = s >> 1, i = c % nx; cases.push([X(i), Y((c - i) / nx)]); }
  cases.reverse();
  const brut: Array<[number, number]> = [[cx, y0], ...cases, [cases[cases.length - 1][0], y1]];
  /* sans doublons ni points alignés : un coude = un point */
  const pts: Array<[number, number]> = [];
  for (const p of brut) {
    const d = pts[pts.length - 1];
    if (d && Math.abs(d[0] - p[0]) < 0.01 && Math.abs(d[1] - p[1]) < 0.01) continue;
    const a = pts[pts.length - 2];
    if (a && d && ((Math.abs(a[0] - d[0]) < 0.01 && Math.abs(d[0] - p[0]) < 0.01) || (Math.abs(a[1] - d[1]) < 0.01 && Math.abs(d[1] - p[1]) < 0.01))) pts[pts.length - 1] = p;
    else pts.push(p);
  }
  return pts;
}

/** Le chemin SVG (M, puis H et V) des points d'un fil. */
export function cheminDePoints(pts: ReadonlyArray<readonly [number, number]>): string {
  const f = (v: number) => v.toFixed(1);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let k = 1; k < pts.length; k++) {
    const [x, y] = pts[k], [px] = pts[k - 1];
    d += Math.abs(x - px) < 0.01 ? `V${f(y)}` : `H${f(x)}`;
  }
  return d;
}

/** Le nombre d'obstacles qu'un chemin de points traverse (contrôle, tests). */
export function obstaclesTraverses(pts: ReadonlyArray<readonly [number, number]>, obstacles: readonly BoiteRoute[]): number {
  let n = 0;
  for (const o of obstacles) {
    for (let k = 1; k < pts.length; k++) {
      const [x1, y1] = pts[k - 1], [x2, y2] = pts[k];
      if (Math.max(x1, x2) > o.left && Math.min(x1, x2) < o.right && Math.max(y1, y2) > o.top && Math.min(y1, y2) < o.bottom) { n++; break; }
    }
  }
  return n;
}
