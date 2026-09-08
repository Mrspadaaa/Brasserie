import { HopIngredient, HopStage } from '../types';

/**
 * Le moment d'ajout d'un houblon, déclaré une seule fois.
 *
 * ⚠️ Ce que ça règle : `HopIngredient.step` était une chaîne libre
 * (« 60 min », « Whirlpool 80°C », « Dry hop #1 »). L'éditeur de création ne la
 * saisissait pas, donc le moment se perdait, et le calcul d'amertume tombait
 * dans son cas par défaut : ébullition. Une NEIPA avec 170 g de houblonnage à
 * cru se voyait attribuer une centaine d'IBU qui n'existent pas.
 *
 * La table est un `Record<HopStage, …>` exhaustif : TypeScript refuse de
 * compiler si une étape est ajoutée sans être traitée partout.
 */

export interface StageStyle {
  /** Libellé affiché, en français de brasseur. */
  label: string;
  /** Ce que l'étape veut dire, en une ligne. */
  hint: string;
  /** Ordre chronologique dans la journée de brassage. */
  order: number;
  /** L'étape produit-elle de l'amertume ? */
  bitters: boolean;
  /** Le champ à demander en plus du poids. */
  ask: 'time' | 'timeAndTemp' | 'day' | 'none';
  /** Couleur de la pastille. Hors échelle bière : ce n'est pas une couleur de bière. */
  tone: string;
}

export const HOP_STAGE: Record<HopStage, StageStyle> = {
  firstWort: {
    label: 'Premier moût',
    hint: 'Versé dans la cuve avant le début de l’ébullition.',
    order: 0,
    bitters: true,
    ask: 'none',
    tone: 'text-ebc-amber border-ebc-amber/40 bg-ebc-amber/10'
  },
  boil: {
    label: 'Ébullition',
    hint: 'Compté en minutes AVANT la fin de l’ébullition.',
    order: 1,
    bitters: true,
    ask: 'time',
    tone: 'text-alert border-alert/40 bg-alert/10'
  },
  whirlpool: {
    label: 'Whirlpool',
    hint: 'Après l’arrêt du feu. La température pilote l’amertume extraite.',
    order: 2,
    bitters: true,
    ask: 'timeAndTemp',
    tone: 'text-water border-water/40 bg-water/10'
  },
  dryHop: {
    label: 'Houblonnage à cru',
    hint: 'En fermenteur. Cet ajout n’est pas compté dans les IBU calculés.',
    order: 3,
    bitters: false,
    ask: 'day',
    tone: 'text-hop border-hop/40 bg-hop/10'
  }
};

/** Étapes dans l'ordre de la journée. */
export const HOP_STAGES: HopStage[] = (Object.keys(HOP_STAGE) as HopStage[]).sort(
  (a, b) => HOP_STAGE[a].order - HOP_STAGE[b].order
);

/**
 * Déduit l'étape d'un ancien champ `step` en texte libre.
 *
 * Les valeurs rencontrées en base : « 60 min », « 15 min », « Boil »,
 * « Whirlpool 80°C », « Dry hop #1 », « Dry hop #2 », « Ébullition »,
 * « Empattage », et l'anglais des recettes importées.
 */
export function stageFromLegacy(step: string | undefined, timeMin?: number): HopStage {
  const s = (step || '').toLowerCase();

  if (s.includes('dry') || s.includes('cru') || s.includes('à froid')) return 'dryHop';
  if (s.includes('whirlpool') || s.includes('hop stand') || s.includes('flame out')) {
    return 'whirlpool';
  }
  if (s.includes('first wort') || s.includes('premier moût') || s.includes('fwh')) {
    return 'firstWort';
  }
  // Un ajout à 0 minute est un flameout, pas une ébullition.
  if (timeMin === 0 && s.includes('0')) return 'whirlpool';
  return 'boil';
}

/**
 * Ramène un houblon enregistré avant la refonte à la forme typée, sans jamais
 * réécrire la base : la normalisation se fait à la lecture.
 */
export function normalizeHop(hop: HopIngredient): HopIngredient {
  if (hop.stage) return hop;

  const stage = stageFromLegacy(hop.step, hop.timeMin);
  const normalized: HopIngredient = { ...hop, stage };

  if (stage === 'dryHop') {
    // L'ancien libellé « Dry hop #2 » portait le rang, pas le jour.
    const rank = Number(/#\s*(\d+)/.exec(hop.step || '')?.[1] ?? 1);
    normalized.dayOffset = hop.dayOffset ?? (rank - 1) * 3;
    delete normalized.timeMin;
  } else if (stage === 'whirlpool') {
    const temp = Number(/(\d+)\s*°?\s*c/i.exec(hop.step || '')?.[1] ?? NaN);
    if (!Number.isNaN(temp)) normalized.tempC = hop.tempC ?? temp;
  }

  return normalized;
}

/** Regroupe les houblons par étape, dans l'ordre de la journée. */
export function groupByStage(
  hops: HopIngredient[]
): Array<{ stage: HopStage; hops: HopIngredient[] }> {
  const normalized = hops.map(normalizeHop);
  return HOP_STAGES.map((stage) => ({
    stage,
    hops: normalized
      .filter((h) => h.stage === stage)
      // Dans l'ébullition, le plus long en premier ; à cru, le plus tôt.
      .sort((a, b) =>
        stage === 'dryHop'
          ? (a.dayOffset ?? 0) - (b.dayOffset ?? 0)
          : (b.timeMin ?? 0) - (a.timeMin ?? 0)
      )
  })).filter((g) => g.hops.length > 0);
}

/**
 * Description courte du moment, pour une ligne de tableau.
 * « 60 min », « 20 min à 80 °C », « J+3 », « avant ébullition ».
 */
export function describeMoment(hop: HopIngredient): string {
  switch (hop.stage) {
    case 'firstWort':
      return 'avant ébullition';
    case 'boil':
      return hop.timeMin === 0 ? 'flameout' : `${hop.timeMin ?? 0} min`;
    case 'whirlpool':
      return hop.tempC
        ? `${hop.timeMin ?? 20} min à ${hop.tempC} °C`
        : `${hop.timeMin ?? 20} min`;
    case 'dryHop':
      return hop.dayOffset ? `J+${hop.dayOffset}` : 'dès la mise en cuve';
  }
}
