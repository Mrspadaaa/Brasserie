import type { BrewDayReading, BrewDayState, BrewDayStep, RecipeSnapshot } from '../types';
import { cibleMesure, isFinalWort, isMash, sg, volumeTarget, type ReadingKind } from './brewDay';
import { nombreFr } from './nombreAffiche';

/**
 * Les mesures qu'une étape attend (VB-1, 10.11 : « Ça invite pas aux mesures »). Elles viennent toutes de règles que le code porte déjà :
 * le pH d'empâtage 10 à 15 min après le départ (`readingPrompt`), la température de consigne du palier, l'OG et le volume au fermenteur
 * (`readingPrompt`, échelle de Mesurer). Une cible que la recette ne donne pas n'est pas inventée : la case n'en dit pas.
 */
export interface MesureAttendue {
  kind: ReadingKind;
  /** « Maische », « pH d'empâtage » : la grandeur telle que le brasseur la nomme à la cuve. */
  nom: string;
  /** Unité courte de la case : °C, pH, SG, L. */
  court: string;
  cible?: string;
  /** Vrai quand la mesure est à faire maintenant (ambre) ; faux quand elle viendra (gris). */
  due: boolean;
  /** « maintenant », « dès 13 h 15 », « une fois refroidi ». */
  quand: string;
  /** Le dernier relevé de cette étape, s'il existe : la case se remplit, jamais d'office. */
  reading?: BrewDayReading;
}

const MIN = 60000;
const heure = (at: number) => {
  const d = new Date(at);
  return `${d.getHours()} h ${String(d.getMinutes()).padStart(2, '0')}`;
};

export function mesuresAttendues(
  step: BrewDayStep,
  state: BrewDayState,
  recipe: RecipeSnapshot | undefined,
  now: number
): MesureAttendue[] {
  if (step.doneAt != null || state.finishedAt != null) return [];
  const dernier = (kind: ReadingKind) =>
    [...(state.readings ?? [])]
      // À Refroidissement, la case « Au fermenteur » ne reprend pas un volume de cuve (`kettle-cold`, relevé par la paire).
      .filter((r) => r.stepId === step.id && r.kind === kind && !(kind === 'volume' && r.measurementStage && r.measurementStage !== 'fermenter'))
      .sort((a, b) => a.at - b.at).at(-1);
  const mesure = (m: Omit<MesureAttendue, 'reading'>): MesureAttendue => ({ ...m, reading: dernier(m.kind) });
  const lance = step.startedAt != null;

  if (isMash(step.id)) {
    const temperature = mesure({
      kind: 'temperature',
      nom: 'Maische',
      court: '°C',
      cible: step.tempC != null ? `${nombreFr(step.tempC, 1)} °C` : undefined,
      due: lance,
      quand: lance ? 'maintenant' : 'au départ du palier'
    });
    // Le pH se prend 10 à 15 min après l'empâtage, sur un échantillon refroidi ; pas au mashout (≥ 75 °C).
    if (step.tempC != null && step.tempC >= 75) return [temperature];
    const phDes = lance ? step.startedAt! + 10 * MIN : undefined;
    const phDu = phDes != null && now >= phDes;
    return [
      temperature,
      mesure({
        kind: 'ph',
        nom: 'pH d’empâtage',
        court: 'pH',
        cible: '5,2–5,5',
        due: phDu,
        quand: phDu ? 'maintenant' : phDes != null ? `dès ${heure(phDes)}` : 'dès 10 min de palier'
      })
    ];
  }
  if (step.id === 'sparge')
    return [
      mesure({
        kind: 'temperature',
        nom: 'Eau de rinçage',
        court: '°C',
        cible: step.tempC != null ? `${nombreFr(step.tempC, 1)} °C` : undefined,
        due: lance,
        quand: lance ? 'maintenant' : 'avant de la verser'
      })
    ];
  if (step.id === 'preboil') {
    const v = volumeTarget(step, recipe);
    // 11 : la cible de densité vient de la recette (conservation des points, `densiteAvantEbullition`) ; une donnée manque : pas de cible.
    const bande = cibleMesure('densite', step, recipe);
    return [
      mesure({ kind: 'volume', nom: 'Volume avant ébullition', court: 'L', cible: v && v > 0 ? `≈ ${nombreFr(v, 1)} L` : undefined, due: true, quand: 'maintenant' }),
      mesure({ kind: 'densite', nom: 'Densité avant ébullition', court: 'SG', cible: bande ? `${sg(bande.min)}–${sg(bande.max)}` : undefined, due: true, quand: 'maintenant' })
    ];
  }
  if (isFinalWort(step.id)) {
    const og = recipe?.ogTarget && recipe.ogTarget > 1 ? sg(recipe.ogTarget) : undefined;
    const densite = mesure({
      kind: 'densite',
      nom: 'Densité initiale',
      court: 'SG',
      cible: og,
      due: step.id === 'ensemencement',
      quand: step.id === 'ensemencement' ? 'maintenant' : 'moût refroidi'
    });
    // m2 : à Refroidissement la case « Au fermenteur · cible 19 L · au transfert » existe déjà (grise) ; le volume relevé ici est celui du
    // fermenteur (`measurementStage: 'fermenter'` à l'enregistrement, voir BrewDayMeasurements), pas celui de la cuve.
    const v = volumeTarget(step, recipe);
    const refroidi = step.id === 'refroidissement';
    return [
      densite,
      mesure({
        kind: 'volume',
        nom: 'Au fermenteur',
        court: 'L',
        cible: v && v > 0 ? `${nombreFr(v, 1)} L` : undefined,
        due: !refroidi,
        quand: refroidi ? 'au transfert' : 'maintenant'
      })
    ];
  }
  return [];
}

/** « Pourquoi maintenant » : la raison de la mesure, à un toucher dans la feuille. Texte de brasseur, sans chiffre qui ne vienne du code. */
export function raisonMesure(kind: ReadingKind, step: BrewDayStep): string {
  if (kind === 'ph' && isMash(step.id))
    return '10 à 15 min après l’empâtage, le pH est stable. Entre 5,2 et 5,5, les enzymes travaillent bien ; au-dessus, une correction reste possible pendant la maische.';
  if (kind === 'temperature') {
    if (step.id === 'sparge') return 'L’eau de rinçage se contrôle à sa consigne avant de la verser : trop chaude, elle extrait des tanins.';
    if (isMash(step.id))
      return 'Montée finie : le palier se juge à cœur de la maische, pas à la cuve. Un écart décale le profil de la bière : sucres fermentescibles (plus secs) ou corps.';
    return 'Un relevé régulier rend la progression et l’arrivée estimée plus utiles.';
  }
  if (kind === 'densite')
    return step.id === 'preboil'
      ? 'Avant les houblons, c’est encore le moment de corriger la concentration.'
      : 'Moût refroidi, avant l’ensemencement : la densité initiale fixe l’alcool attendu et dit le rendement du brassin.';
  if (kind === 'volume')
    return step.id === 'preboil'
      ? 'Avant les houblons, c’est encore le moment de corriger le volume.'
      : 'Au transfert : le volume au fermenteur, avec la densité, donne le rendement et la part perdue en route.';
  return '';
}

