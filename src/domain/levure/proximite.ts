/**
 * Proximité de deux levures : distance de Gower (Gower 1971), la méthode standard pour des données mêlées avec des valeurs
 * manquantes. Chaque axe connu des DEUX levures contribue d'un écart entre 0 et 1 ; la moyenne est la distance.
 *  - plages (atténuation, °C, tolérance, g/L) : écart des milieux, divisé par l'étendue usuelle de l'axe ;
 *  - niveaux (esters, phénols, floculation…) : rangs faible / moyen / élevé = 0 / 0,5 / 1 ;
 *  - catégories (famille, STA1) : égalité (0) ou différence (1) ;
 *  - un axe lu d'un descripteur (« estimé ») compte pour moitié.
 * Peu d'axes en commun : l'inconnu n'est pas un accord. Sous 3 axes, le manque est compté pour un demi-écart.
 */
import type { IdAxe } from './contrat';
import type { Fiche } from './fiche';
import { ID_AXES } from './axes';
import { lire, position } from './valeurs';

/** Étendue usuelle d'un axe numérique (catalogue de bière : 65–95 %, 10–30 °C, 5–17 %). */
const ETENDUE: Partial<Record<IdAxe, number>> = { attenuation: 30, temperature: 25, tolerance: 12, rondeur: 25 };
const AXES_MIN = 3;

const niveau01 = (rang: number) => (Math.min(3, Math.max(1, rang)) - 1) / 2;

export function distance(a: Fiche, b: Fiche): number {
  let somme = 0, poids = 0;
  for (const axe of ID_AXES) {
    const la = lire(a, axe), lb = lire(b, axe);
    const pa = position(la), pb = position(lb);
    if (pa == null || pb == null) continue;
    const etendue = ETENDUE[axe];
    const ecart = etendue ? Math.min(1, Math.abs(pa - pb) / etendue) : Math.abs(niveau01(pa) - niveau01(pb));
    const w = la!.estime || lb!.estime ? 0.5 : 1;
    somme += w * ecart; poids += w;
  }
  somme += a.famille === b.famille ? 0 : 1; poids += 1;
  if (a.sta1 && b.sta1) { somme += a.sta1 === b.sta1 ? 0 : 1; poids += 1; }
  if (poids < AXES_MIN) { somme += 0.5 * (AXES_MIN - poids); poids = AXES_MIN; }
  return somme / poids;
}
