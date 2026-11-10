import { graduations } from '../finance/previsions/escalier';
import { r2, seuilsRegle } from './calculPrix';

/**
 * Géométrie du graphe de c7c : deux échelles verticales (par bouteille, par an) sur UN axe commun (même zéro, rapport = unités/an).
 * On fixe d'abord le maximum en CHF par bouteille, on en déduit le maximum par an, puis chacune se gradue (1-2-5, `graduations` de pv) dans sa propre plage :
 * un cran « par an » ne vaut donc jamais « cran par bouteille × unités » (3 636, 7 272…) mais 5 000, 10 000, 15 000 posés à `cran ÷ unités`.
 */
export interface Echelles {
  xMax: number; xCrans: number[];
  /** Maximum et pas de l'échelle par bouteille ; le bas de l'axe est −pas. */
  yMax: number; yPas: number; yCrans: number[];
  /** Crans par an, dans la plage de l'axe ; vide si le volume annuel est inconnu. */
  anCrans: number[];
}
const chf = (cents: number) => cents / 100;
export function echelles(cout: number, prix: number | null, unites: number | null): Echelles {
  const mince = seuilsRegle(cout).mince;
  // L'axe des prix s'arrête au premier cran qui couvre la donnée (c7c : 5,00 × 1,4 = 7 → 0 · 1 · … · 7), pas au cran d'après (`hautNice` donnait 8).
  const donneeX = Math.max(prix ?? 0, mince) * 1.4;
  const gx = graduations(0, Math.round(donneeX * 100), 8);
  const pasX = gx.ticks.length > 1 ? r2(chf(gx.ticks[1]) - chf(gx.ticks[0])) : 1;
  const xMax = r2(Math.max(pasX, Math.ceil(donneeX / pasX - 1e-9) * pasX));
  const xCrans = gx.ticks.map(chf).filter(v => v <= xMax + 1e-6);
  // L'axe du reste va exactement de zéro au reste du bord droit (la pente finit dans l'angle, comme la maquette) ; les crans sont ceux de `graduations`.
  const yMax = Math.max(1, r2(xMax - cout));
  const gy = graduations(0, Math.round(yMax * 100));
  const yCrans = gy.ticks.map(chf).filter(v => v <= yMax + 1e-6);
  const yPas = yCrans.length > 1 ? r2(yCrans[1] - yCrans[0]) : 1;
  let anCrans: number[] = [];
  if (unites !== null && unites > 0) {
    const plage = yMax * unites;
    anCrans = graduations(0, Math.round(plage * 100)).ticks.map(chf).filter(v => v <= plage + 1e-6);
  }
  return { xMax, xCrans: xCrans.filter(v => v <= xMax + 1e-6), yMax, yPas, yCrans, anCrans };
}

/** Repères du dessin (viewBox 390 × 318, comme la maquette). */
export interface Repere { X0: number; X1: number; T: number; Y0: number; YB: number }
export const REPERE_390: Repere = { X0: 74, X1: 372, T: 30, Y0: 186, YB: 220 };
export const xDe = (e: Echelles, r: Repere) => (p: number) => r.X0 + (p / e.xMax) * (r.X1 - r.X0);
export const yDe = (e: Echelles, r: Repere) => (v: number) => v >= 0 ? r.Y0 - (v / e.yMax) * (r.Y0 - r.T) : r.Y0 + (-v / e.yPas) * (r.YB - r.Y0);
/** Un cran « par an » se pose à `cran ÷ unités` sur l'axe par bouteille. */
export const anVersBouteille = (cranAn: number, unites: number) => cranAn / unites;
