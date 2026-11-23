import {
  catalogNumber,
  catalogText,
  measuredProduction,
  type CatalogEntry
} from '../../../domain/productionCatalog';
import { abvFromGravities } from '../../../domain/gravityBounds';
import {
  batchOutcome,
  isPackaged,
  isProduced,
  joursDepuisBrassage,
  type OutcomeMetric
} from '../../../domain/productionInsights';

/**
 * Le bilan « Ai-je atteint ma cible ? » (maquette e7a, choix du 15.11).
 * Aucun calcul de brassage ici : les cibles et les mesures viennent de `batchOutcome`
 * et des données du brassin ; ce module ne fait que les ranger en verdicts lisibles.
 */

/** Ordre des quatre mesures dans la maquette e7a. */
export const BILAN_METRICS = ['og', 'fg', 'abv', 'volume'] as const;
export const BILAN_LABEL: Record<OutcomeMetric, string> = {
  og: 'OG',
  fg: 'FG',
  abv: 'Alcool',
  volume: 'Volume'
};
export const BILAN_QUESTION: Record<OutcomeMetric, string> = {
  og: 'Densité initiale',
  fg: 'Densité finale',
  abv: 'Alcool',
  volume: 'Volume en cuve'
};

/**
 * Tolérances PROPOSÉES (maquette e7a : « le code n'en a pas »). Une proposition, pas une règle de brassage :
 * densité ±0,002, alcool ±0,3 point de %, volume ±0,5 L. Le brasseur les valide ou les change (ACCORD à demander).
 */
export const BILAN_TOLERANCE: Record<OutcomeMetric, number> = {
  og: 0.002,
  fg: 0.002,
  abv: 0.3,
  volume: 0.5
};
/** Demi-largeur de l'échelle dessinée (la bande verte et le point restent dans cette échelle). */
export const BILAN_ECHELLE: Record<OutcomeMetric, number> = {
  og: 0.006,
  fg: 0.008,
  abv: 1,
  volume: 3
};

export type Verdict = 'ok' | 'sous' | 'sur' | 'cours';

export interface LigneBilan {
  entry: CatalogEntry;
  target: number;
  actual: number;
  /** réel − cible, dans l'unité de la mesure (densité en unités, pas en points) */
  diff: number;
  verdict: Verdict;
  /** Densité finale ou alcool d'un lot en garde : à confirmer à l'embouteillage. */
  aConfirmer: boolean;
}

const arrondi = (value: number) => Math.round(value * 10_000) / 10_000;

const verdictDe = (metric: OutcomeMetric, diff: number): Verdict => {
  const tol = BILAN_TOLERANCE[metric];
  if (Math.abs(diff) <= tol + 1e-9) return 'ok';
  return diff < 0 ? 'sous' : 'sur';
};

/** Dernier relevé de densité du journal, s'il y en a un ; jamais un zéro. */
const dernierReleve = (entry: CatalogEntry): number | undefined => {
  const log = entry.batch?.gravityLog ?? [];
  for (let i = log.length - 1; i >= 0; i--) {
    const sg = catalogNumber(log[i]?.sg);
    if (sg !== undefined && sg > 0) return sg;
  }
  return undefined;
};

export function lignesBilan(entries: CatalogEntry[], metric: OutcomeMetric): LigneBilan[] {
  const lignes: LigneBilan[] = [];
  for (const entry of entries) {
    const batch = entry.batch;
    if (!batch || !isProduced(batch)) continue;
    let target: number | undefined;
    let actual: number | undefined;
    if (metric === 'fg') {
      // La FG se lit sur la mesure finale, à défaut sur le dernier relevé du journal (lot encore en cuve).
      target = catalogNumber(batch.recipeSnapshot?.fgTarget);
      const mesuree = catalogNumber(batch.fg);
      actual = mesuree !== undefined && mesuree > 0 ? mesuree : dernierReleve(entry);
      if (target === undefined || target <= 0 || actual === undefined) continue;
    } else {
      const outcome = batchOutcome(entry, metric);
      if (outcome) {
        target = outcome.target;
        actual = outcome.actual;
      } else if (metric === 'abv' && batch.status !== 'fermentation') {
        // e7a : alcool non saisi, tiré de l'OG et de la FG mesurée (dernier relevé en garde), jamais pendant la fermentation ni sans mesure.
        target = catalogNumber(batch.recipeSnapshot?.abvTarget);
        const og = catalogNumber(batch.og);
        const fgMesuree = catalogNumber(batch.fg);
        const fg = fgMesuree !== undefined && fgMesuree > 0 ? fgMesuree : dernierReleve(entry);
        const tire = abvFromGravities(og !== undefined && og > 0 ? og : null, fg ?? null);
        if (target === undefined || target < 0 || tire === null) continue;
        actual = tire;
      } else continue;
    }
    const diff = arrondi(actual - target);
    const enCours = batch.status === 'fermentation' && (metric === 'fg' || metric === 'abv');
    lignes.push({
      entry,
      target,
      actual,
      diff,
      verdict: enCours ? 'cours' : verdictDe(metric, diff),
      aConfirmer: !enCours && batch.status === 'garde' && (metric === 'fg' || metric === 'abv')
    });
  }
  return lignes;
}

export interface ScoreBilan {
  /** lots dans la cible */
  ok: number;
  /** lots comparés (ceux « en cours » ne comptent pas) */
  n: number;
  /** teinte du compte : tous dans la cible, ou la direction des écarts */
  ton: 'ok' | 'sous' | 'sur' | 'aucun';
}

export function scoreBilan(lignes: LigneBilan[]): ScoreBilan {
  const comptes = lignes.filter((l) => l.verdict !== 'cours');
  const ok = comptes.filter((l) => l.verdict === 'ok').length;
  const sous = comptes.filter((l) => l.verdict === 'sous').length;
  const sur = comptes.filter((l) => l.verdict === 'sur').length;
  if (!comptes.length) return { ok: 0, n: 0, ton: 'aucun' };
  if (ok === comptes.length) return { ok, n: comptes.length, ton: 'ok' };
  return { ok, n: comptes.length, ton: sur === 0 && sous > 0 ? 'sous' : 'sur' };
}

export function titreBilan(metric: OutcomeMetric, score: ScoreBilan, lignes: number): string {
  if (!score.n) return lignes ? 'Rien de stable à comparer encore' : 'Pas encore de comparaison possible';
  const bande = metric === 'fg' ? 'dans la bande' : 'dans la cible';
  if (score.ok === score.n) {
    if (metric === 'fg') return score.n === 1 ? 'Le stable est dans la bande' : `Les ${score.n} stables sont dans la bande`;
    return score.n === 1 ? 'Le brassin est dans la cible' : `Les ${score.n} brassins sont dans la cible`;
  }
  const motOk = metric === 'fg' ? (score.ok > 1 ? 'stables' : 'stable') : score.ok > 1 ? 'brassins' : 'brassin';
  return `${score.ok} ${motOk} sur ${score.n} ${bande}`;
}

const nf = (value: number, min: number, max = min) =>
  value.toLocaleString('fr-CH', { minimumFractionDigits: min, maximumFractionDigits: max });
/** Chiffre à la virgule, signe moins typographique, sans zéro de trop. */
export const nombre = (value: number, digits = 1) => nf(value, 0, digits).replace('-', '−');
export const densite = (value: number) => nf(value, 3);
export const signe = (value: number, texte: string) => (value > 0 ? `+${texte}` : value < 0 ? `−${texte}` : texte);

/** Valeur de la mesure, telle qu'elle s'écrit (« 1,062 », « 5,9 % », « 24 L »). */
export function valeurDe(metric: OutcomeMetric, value: number): string {
  if (metric === 'og' || metric === 'fg') return densite(value);
  if (metric === 'abv') return `${nombre(value, 1)} %`;
  return `${nombre(value, 1)} L`;
}

/** L'écart, signé, dans l'unité de la mesure. */
export function ecartDe(metric: OutcomeMetric, diff: number): string {
  const abs = Math.abs(diff);
  if (metric === 'og' || metric === 'fg') return signe(diff, densite(abs));
  if (metric === 'abv') return signe(diff, `${nombre(abs, 1)} pt`);
  return signe(diff, `${nombre(abs, 1)} L`);
}

/** Texte sous la valeur de la ligne : la lecture d'un coup d'œil. */
export function legendeDe(metric: OutcomeMetric, ligne: LigneBilan): string {
  if (ligne.verdict === 'cours') return 'en cours';
  if (ligne.verdict === 'ok') {
    if (ligne.aConfirmer) return 'à confirmer';
    if (metric === 'fg') return 'dans la bande';
    return ligne.diff === 0 ? 'pile' : ecartDe(metric, ligne.diff);
  }
  return ecartDe(metric, ligne.diff);
}

/** Position du point sur l'échelle, en pourcentage de la zone (0 à 100, centre 50). */
export function positionSur(metric: OutcomeMetric, diff: number): number {
  const max = BILAN_ECHELLE[metric];
  return Math.min(100, Math.max(0, 50 + (diff / max) * 50));
}

export interface PastilleBilan {
  ton: 'water' | 'attention' | 'cours';
  texte: string;
}

/** Les lots à regarder : hors de la cible, ou encore en cours. */
export function pastillesBilan(metric: OutcomeMetric, lignes: LigneBilan[], maintenant = Date.now()): PastilleBilan[] {
  return lignes.flatMap((l): PastilleBilan[] => {
    if (l.verdict === 'cours') {
      const jours = l.entry.batch ? joursDepuisBrassage(l.entry.batch, maintenant) : undefined;
      const lecture = valeurDe(metric, l.actual);
      return [{ ton: 'cours', texte: `${l.entry.name} en cours · ${lecture}${jours !== undefined ? ` à J+${jours}` : ''}` }];
    }
    if (l.verdict === 'ok') return [];
    return [{ ton: l.verdict === 'sous' ? 'water' : 'attention', texte: `${l.entry.name} ${ecartDe(metric, l.diff)}` }];
  });
}

// ---------------------------------------------------------------------------------------------------------------------
// De la cuve à la bouteille : mêmes lots appariés que `packagingBalance` (lot conditionné, deux volumes connus).

export interface LotConditionne {
  entry: CatalogEntry;
  brewed: number;
  packaged: number;
}
export function lotsConditionnes(entries: CatalogEntry[]): LotConditionne[] {
  return entries.flatMap((entry) => {
    if (!entry.batch || !isPackaged(entry.batch)) return [];
    const brewed = catalogNumber(entry.batch.volumeBrewedL);
    const packaged = catalogNumber(entry.batch.volumePackagedL);
    return brewed !== undefined && brewed > 0 && packaged !== undefined && packaged >= 0
      ? [{ entry, brewed, packaged }]
      : [];
  });
}

// ---------------------------------------------------------------------------------------------------------------------
// Par mois de brassage.

export interface MoisBilan {
  mois: string;
  libelle: string;
  brewed: number;
  packaged: number;
}
export function moisBilan(entries: CatalogEntry[]): { mois: MoisBilan[]; brewed: number; undated: number; max: number } {
  const production = measuredProduction(entries);
  const annees = new Set(production.months.map((m) => m.month.slice(0, 4)));
  const mois = production.months.map((m) => {
    const date = new Date(`${m.month}-15T12:00:00`);
    const court = date.toLocaleDateString('fr-CH', { month: 'short' });
    return {
      mois: m.month,
      libelle: annees.size > 1 ? `${court} ${m.month.slice(2, 4)}` : court,
      brewed: m.brewed,
      packaged: m.packaged
    };
  });
  return {
    mois,
    brewed: production.brewed,
    undated: production.undated,
    max: Math.max(1, ...mois.flatMap((m) => [m.brewed, m.packaged]))
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// Houblons : grammes posés dans les recettes figées des lots du bilan ; sans poids connu, le nombre de lots.

export interface HoublonBilan {
  nom: string;
  grammes: number;
  fiches: number;
}
export function houblonsBilan(entries: CatalogEntry[]): HoublonBilan[] {
  const parNom = new Map<string, HoublonBilan>();
  for (const entry of entries) {
    const hops = entry.batch?.recipeSnapshot?.hops ?? entry.batch?.hops ?? entry.recipe?.hops ?? [];
    const vus = new Set<string>();
    for (const hop of hops) {
      const nom = hop.name?.trim();
      if (!nom) continue;
      const cle = catalogText(nom);
      const prev = parNom.get(cle) ?? { nom, grammes: 0, fiches: 0 };
      const g = catalogNumber(hop.weightG);
      prev.grammes += g !== undefined && g > 0 ? g : 0;
      if (!vus.has(cle)) {
        prev.fiches += 1;
        vus.add(cle);
      }
      parNom.set(cle, prev);
    }
  }
  return [...parNom.values()].sort((a, b) => b.grammes - a.grammes || b.fiches - a.fiches || a.nom.localeCompare(b.nom, 'fr'));
}

/** Lots hors bilan (planifiés, annulés), regroupés par état et style. */
export function horsBilan(entries: CatalogEntry[]): { status: 'planifie' | 'annule'; style: string; n: number }[] {
  const groupes = new Map<string, { status: 'planifie' | 'annule'; style: string; n: number }>();
  for (const e of entries) {
    const status = e.batch?.status;
    if (status !== 'planifie' && status !== 'annule') continue;
    const style = e.style?.trim() || e.name;
    const cle = `${status}|${catalogText(style)}`;
    const g = groupes.get(cle) ?? { status, style, n: 0 };
    g.n += 1;
    groupes.set(cle, g);
  }
  return [...groupes.values()];
}

/** Début d'une note de dégustation, pour une puce d'une ligne. */
export function resumeNote(note: string, max = 64): string {
  const propre = note.replace(/\s+/g, ' ').trim();
  if (propre.length <= max) return propre;
  // Coupe à la fin d'un mot entier, sans laisser un mot d'une ou deux lettres (« À ») pendre devant les points.
  const coupe = propre.slice(0, max).replace(/[\s,;:.]+\S*$/, '').replace(/[\s,;:.]+\S{1,2}$/, '');
  return `${coupe.replace(/[\s,;:.]+$/, '')}…`;
}
