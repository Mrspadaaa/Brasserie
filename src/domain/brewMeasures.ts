import type { BrewDayReading, BrewDayState, BrewDayStep, RecipeSnapshot } from '../types';
import { cibleMesure, defaultReading, isFinalWort, isMash, sg, volumeTarget, type ReadingKind } from './brewDay';
import { nombreFr } from './nombreAffiche';
import { boilMinutes, isBoilStep } from './brewCompanion';

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
export const heureFr = (at: number) => {
  const d = new Date(at);
  return `${d.getHours()} h ${String(d.getMinutes()).padStart(2, '0')}`;
};
const heure = heureFr;

/**
 * Les 9 relevés d'une journée de brassage (p2c, « N relevés sur 9 ») : un identifiant par grandeur et par moment. La densité à la coupure
 * (fin d'ébullition, pour agir avant le refroidissement) n'est PAS l'OG (moût refroidi, au fermenteur) : deux cases, deux relevés.
 */
export type IdReleve =
  | 'eau-temp'
  | 'maische'
  | 'ph'
  | 'avant-volume'
  | 'avant-densite'
  | 'coupure'
  | 'og'
  | 'fermenteur'
  | 'ensemencement-temp';
export const IDS_RELEVES: IdReleve[] = ['eau-temp', 'maische', 'ph', 'avant-volume', 'avant-densite', 'coupure', 'og', 'fermenteur', 'ensemencement-temp'];

/** Les étapes où le moût vient de cesser de bouillir : la dernière étape d'ébullition, puis le whirlpool. La densité de coupure s'y relève. */
export const estEtapeCoupure = (s: BrewDayStep) => isBoilStep(s) || s.id === 'whirlpool';
const estEtapeEbullition = estEtapeCoupure;

/**
 * Le relevé de la journée de chaque grandeur : le dernier, à quelque étape qu'il ait été pris (un seul par jour). Rien n'est rempli à la
 * place du brasseur : une grandeur sans relevé n'a pas d'entrée. La classe d'un relevé suit son étape et son `measurementStage`.
 */
export function classerReleves(state: BrewDayState): Partial<Record<IdReleve, BrewDayReading>> {
  const rs = [...(state.readings ?? [])].sort((a, b) => a.at - b.at);
  const pas = (id?: string) => state.steps.find((s) => s.id === id);
  const sortie: Partial<Record<IdReleve, BrewDayReading>> = {};
  // La maische est le palier de saccharification (< 75 °C) ; le mashout ne le remplace pas, sauf s'il est seul.
  const paliers = state.steps.filter((s) => isMash(s.id) && (s.tempC ?? 0) < 75);
  const dePalier = (r: BrewDayReading) => paliers.length === 0 || paliers.some((s) => s.id === r.stepId);
  for (const r of rs) {
    const etape = pas(r.stepId);
    const bouillie = etape ? estEtapeEbullition(etape) : /^(boil|hop)-|^whirlpool$|^sucres$/.test(r.stepId ?? '');
    // Même règle que `finalBrewReadings` : une étape de moût refroidi n'est « finale » que sans `measurementStage` ; « après ébullition » est la coupure.
    const finale = r.measurementStage ? r.measurementStage === 'fermenter' || r.measurementStage === 'kettle-cold' : isFinalWort(r.stepId);
    const avant = r.stepId === 'preboil' || (r.measurementStage === 'preboil' && !bouillie && !finale);
    let id: IdReleve | undefined;
    if (r.kind === 'temperature') {
      if (r.stepId === 'eau') id = 'eau-temp';
      else if (isMash(r.stepId ?? '') && dePalier(r)) id = 'maische';
      else if (r.stepId === 'ensemencement') id = 'ensemencement-temp';
    } else if (r.kind === 'ph') {
      if (isMash(r.stepId ?? '')) id = 'ph';
    } else if (r.kind === 'volume') {
      if (avant) id = 'avant-volume';
      else if (r.measurementStage === 'fermenter' || (r.stepId === 'ensemencement' && !r.measurementStage)) id = 'fermenteur';
    } else if (r.kind === 'densite') {
      if (avant) id = 'avant-densite';
      else if (finale) id = 'og';
      else if (bouillie || r.measurementStage === 'postboil') id = 'coupure';
    }
    if (id) sortie[id] = r;
  }
  return sortie;
}

/** L'heure de la coupure du feu : début réel de l'ébullition plus sa durée (celle du jour, sinon celle de la recette). `null` : l'ébullition n'a pas commencé. */
export function heureCoupure(state: BrewDayState, recipe: RecipeSnapshot | undefined): number | null {
  if (state.boilStartedAt == null) return null;
  const min = boilMinutes(state, recipe);
  return min > 0 ? state.boilStartedAt + min * MIN : null;
}

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
  const mesure = (m: Omit<MesureAttendue, 'reading'>, lu?: BrewDayReading): MesureAttendue => ({ ...m, reading: lu ?? dernier(m.kind) });
  const lance = step.startedAt != null;

  // p2c : l'eau d'empâtage se prend en °C à l'étape Eau, avant de la verser sur le grain. Aucune cible n'est inventée : la recette n'en donne pas.
  if (step.id === 'eau')
    return [
      mesure({ kind: 'temperature', nom: 'Eau d’empâtage', court: '°C', due: true, quand: 'avant de verser sur le grain' })
    ];

  // p2c : la densité à la coupure, relevée à la fin de l'ébullition (et au whirlpool) pour agir avant le refroidissement ; distincte de l'OG.
  if (estEtapeCoupure(step)) {
    const derniereEbullition = [...state.steps].reverse().find(isBoilStep);
    if (step.id === 'whirlpool' || derniereEbullition?.id === step.id) {
      const coupe = heureCoupure(state, recipe);
      const proche = step.id === 'whirlpool' || state.boilFinishedAt != null || (coupe != null && now >= coupe - 5 * MIN);
      return [
        mesure(
          {
            kind: 'densite',
            nom: 'Densité à la coupure',
            court: 'SG',
            cible: undefined,
            due: proche,
            quand: proche ? 'avant le refroidissement' : coupe != null ? `vers ${heure(coupe)}` : 'à la coupure du feu'
          },
          classerReleves(state).coupure
        )
      ];
    }
  }

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

/**
 * La mesure sur laquelle la feuille Mesurer s'ouvre (m2) : la première mesure due de l'étape qui n'a pas encore de relevé, dans l'ordre
 * des cases (Maische °C au palier avant le pH ; densité initiale à l'ensemencement). Sinon, la grandeur habituelle de l'étape
 * (`defaultReading` : le pH au palier tant que rien n'est dû, la température déjà relevée).
 */
export function mesureDue(
  step: BrewDayStep,
  state: BrewDayState,
  recipe: RecipeSnapshot | undefined,
  now: number
): ReadingKind {
  const aFaire = mesuresAttendues(step, state, recipe, now).filter((m) => m.due && !m.reading);
  // À l'avant-ébullition, volume et densité sont dues ensemble : la grandeur habituelle (densité) passe la première.
  if (step.id === 'preboil') return aFaire.find((m) => m.kind === 'densite')?.kind ?? aFaire[0]?.kind ?? defaultReading(step);
  return aFaire[0]?.kind ?? defaultReading(step);
}

/**
 * Les grandeurs qu'on peut relever à cette étape. La densité n'a pas de sens avant qu'il y ait du moût : Eau et sels, Concassage,
 * Empâtage, Mashout (m2). Un relevé de densité déjà au journal sur l'étape la garde visible.
 */
export function grandeursOuvertes(step: BrewDayStep, state: BrewDayState): ReadingKind[] {
  const sansMout = step.id === 'eau' || step.id === 'concassage' || isMash(step.id);
  const dejaLue = (state.readings ?? []).some((r) => r.stepId === step.id && r.kind === 'densite');
  return (['ph', 'temperature', 'densite', 'volume'] as const).filter((k) => k !== 'densite' || !sansMout || dejaLue);
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

