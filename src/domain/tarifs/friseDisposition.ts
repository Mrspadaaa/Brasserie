import { SANS_CLIENT, type GroupeFormat, type VenteAuLitre } from './ventesAuLitre';

/**
 * Disposition de la frise kxc (porté de figE, maquette v1/couv/kxa/build.mjs) : un couloir par format, une marque par prix ;
 * des prix égaux font un amas « ×n ». Placement : amas d'abord, puis prix seuls du moins cher au plus cher, sur des rangs
 * (0, −24, +24, puis −48, +48… tant qu'une marque en recouvre une autre), le premier sans chevauchement.
 * Le couloir fait 72 px tant que trois rangs suffisent (la maquette) ; il grandit quand « Toutes les bières » en demande plus
 * (passe 3 : 26 marques se recouvraient à 390 sur trois rangs).
 * Les écarts (> 12 % de la médiane du format) sont nommés là où ils ne cachent aucune marque, sauf une vente sans client : son nom
 * (« Sans client ») n'apprend rien.
 * Pur : l'échelle (CHF le litre → px) est passée par l'appelant.
 */
export const COULOIR = 72, HAUT = 20, PIED = 68, GOUTTIERE = 36;
const LARGEUR_CAR = 7, RANG = 24, DEMI = 12;
const DECALAGES = [0, -1, 1, -2, 2, -3, 3, -4, 4, -5, 5].map((k) => k * RANG);

export interface Marque { cle: string; ventes: VenteAuLitre[]; cx: number; py: number; largeur: number; couloir: number }
export interface Nom { texte: string; x: number; y: number }
export interface Couloir { cle: string; nom: string; formatId: string; y0: number; h: number; cy: number; xmin: number; xmax: number }
export interface Disposition { couloirs: Couloir[]; marques: Marque[]; noms: Nom[]; axe: number; hauteur: number }

/** Largeur d'un amas : 30 px + 17 par picto (deux au plus). */
export const largeurAmas = (pictos: number) => 30 + 17 * Math.min(2, Math.max(1, pictos));
const genresDe = (a: VenteAuLitre[]) => new Set(a.map((v) => v.genre)).size;

type Boite = [number, number, number, number];
const recouvre = (a: Boite, c: Boite) => Math.max(0, Math.min(a[2], c[2]) - Math.max(a[0], c[0])) * (Math.min(a[3], c[3]) - Math.max(a[1], c[1]) > 1 ? 1 : 0);

export function disposerFrise(groupes: readonly GroupeFormat[], x: (v: number) => number, W: number, x0: number): Disposition {
  // Phase 1 : dans chaque couloir, le rang de chaque marque (décalage vertical par rapport à l'axe du couloir).
  const brut = groupes.map((g) => {
    const boites: Boite[] = [];
    const chev = (b: Boite) => boites.reduce((t, c) => t + recouvre(b, c), 0);
    const amas: VenteAuLitre[][] = [];
    for (const v of g.ventes) { const a = amas.find((m) => m[0].prix === v.prix); if (a) a.push(v); else amas.push([v]); }
    amas.sort((p, c) => Number(c.length > 1) - Number(p.length > 1) || p[0].litre - c[0].litre);
    const places = amas.map((a) => {
      const cx = x(a[0].litre), larg = a.length > 1 ? largeurAmas(genresDe(a)) : 24, hw = larg / 2;
      let best = 0, pire = Infinity;
      for (const dy of DECALAGES) {
        const ch = chev([cx - hw + 1, dy - DEMI + 1, cx + hw - 1, dy + DEMI - 1]);
        if (ch < pire - 0.01) { pire = ch; best = dy; }
        if (ch === 0) break;
      }
      boites.push([cx - hw, best - DEMI, cx + hw, best + DEMI]);
      return { a, cx, larg, dy: best };
    });
    const maxAbs = places.reduce((m, p) => Math.max(m, Math.abs(p.dy)), 0);
    return { g, places, h: maxAbs <= RANG ? COULOIR : 2 * maxAbs + 3 * DEMI };
  });
  // Phase 2 : les couloirs prennent leur hauteur ; les marques passent en coordonnées de la page.
  const couloirs: Couloir[] = [], marques: Marque[] = [], noms: Nom[] = [];
  const boites: Boite[] = [];
  const ecarts: { v: VenteAuLitre; cx: number; py: number; bas: boolean }[] = [];
  let y = HAUT;
  brut.forEach(({ g, places, h }, i) => {
    const cy = y + h / 2;
    couloirs.push({ cle: g.cle, nom: g.nom, formatId: g.formatId, y0: y, h, cy, xmin: x(g.min), xmax: x(g.max) });
    for (const { a, cx, larg, dy } of places) {
      const py = cy + dy, hw = larg / 2;
      boites.push([cx - hw, py - DEMI, cx + hw, py + DEMI]);
      marques.push({ cle: `${g.cle}|${a[0].prix}`, ventes: a, cx, py, largeur: larg, couloir: i });
      if (a.length === 1 && a[0].qui !== SANS_CLIENT && Math.abs(a[0].litre - g.mediane) / g.mediane > 0.12) ecarts.push({ v: a[0], cx, py, bas: a[0].litre < g.mediane });
    }
    y += h;
  });
  const axe = y + 8;
  const borne = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
  for (const { v, cx, py, bas } of ecarts) {
    const hw = DEMI, w = LARGEUR_CAR * v.qui.length, xb = borne(cx - 14, x0, W - w - 2), xd = borne(cx + 14 - w, x0, W - w - 2);
    const cands: [number, number][] = [[cx + hw + 4, py + 4], [xb, py + hw + 15], [xb, py - hw - 5], [cx - hw - 4 - w, py + 4], [xd, py + hw + 15], [xd, py - hw - 5]];
    if (bas) cands.unshift(cands.splice(1, 1)[0]);
    const libre = (b: Boite) => boites.reduce((t, c) => t + recouvre(b, c), 0) === 0;
    const ok = cands.find(([tx, ty]) => tx >= x0 && tx + w <= W - 2 && ty - 11 >= 0 && ty <= axe - 4 && libre([tx - 1, ty - 11, tx + w + 1, ty + 3]));
    if (!ok) continue;
    boites.push([ok[0], ok[1] - 11, ok[0] + w, ok[1] + 3]);
    noms.push({ texte: v.qui, x: ok[0], y: ok[1] });
  }
  return { couloirs, marques, noms, axe, hauteur: axe + PIED };
}

/** La marque la plus proche d'un toucher dans un couloir (cible = le couloir entier). */
export function marqueProche(marques: readonly Marque[], couloir: number, px: number, py: number): Marque | null {
  let best: Marque | null = null, d = Infinity;
  for (const m of marques) {
    if (m.couloir !== couloir) continue;
    const dx = Math.max(0, Math.abs(px - m.cx) - m.largeur / 2), dy = py - m.py, e = dx * dx + dy * dy;
    if (e < d) { d = e; best = m; }
  }
  return best;
}
