import type { BrewDayReading, BrewDayState, BrewDayStep, RecipeSnapshot } from '../types';
import { cibleMesure, ecartHorsCible, isMash, READING, refroidiParDefaut, type CibleMesure } from './brewDay';
import { bornesPlausibles } from './measureSlider';
import { nombreFr } from './nombreAffiche';

/**
 * Le palier appelle la mesure (pm1, mission port-simplicité, 20.11) : au palier d'empâtage, deux cartes, la température du palier
 * et le pH d'empâtage, chacune avec un curseur déjà posé sur sa cible. Ce module décide ce que les cartes montrent et ce que
 * « Relever » écrit ; l'écran (`ui/brassage/AppelMesure.tsx`) ne calcule rien.
 *
 * Règles :
 *  - La cible vient des mêmes sources que le reste de la conduite (`cibleMesure` : une seule bande, une seule écriture d'écart).
 *    La valeur « proposée » est celle du palier de la recette (température) ou le pH visé de la recette (`waterPlan.targetPh`),
 *    à défaut le milieu de la bande documentée par le code. Cible inconnue : `null`, jamais une valeur inventée, jamais 0.
 *  - Rien n'est noté sans toucher : la température proposée est confirmée par « Relever » (« proposé, à confirmer ») ; le pH,
 *    qui se lit sur un pH-mètre, ne s'écrit que si le brasseur a posé le curseur.
 *  - Le pH se prend 15 min après l'empâtage (« à 15′ ») : la maquette choisie fixe 15′, dans la fenêtre « 10 à 15 min » du code
 *    (`raisonMesure`). L'empâtage = le premier palier lancé ; avec plusieurs paliers, le pH ne se recompte pas à chacun.
 */
export const PH_APRES_MIN = 15;
const MIN = 60000;

export type KindAppel = 'temperature' | 'ph';

export interface CarteAppel {
  kind: KindAppel;
  /** « Température du palier », « pH d'empâtage » : la grandeur telle que le brasseur la nomme à la cuve. */
  nom: string;
  /** La bande documentée par le code ; `null` quand la recette ne donne pas de cible. */
  cible: CibleMesure | null;
  /** Où le curseur attend, et où le repère vert se pose ; `null` : cible inconnue (« — »). */
  propose: number | null;
  /** Étendue du curseur, la même échelle que la feuille Mesurer. */
  echelle: { min: number; max: number };
  /** À relever maintenant (carte warn). Le pH ne l'est qu'à 15′. */
  due: boolean;
  /** Le relevé déjà au journal pour cette grandeur, s'il existe : la carte le dit, rien n'est rempli à la place du brasseur. */
  releve?: BrewDayReading;
}

export interface AppelPalier {
  temperature: CarteAppel;
  ph: CarteAppel | null;
}

const fini = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

/** « 5,3 », « 5,35 », « 5,0 » : la virgule suisse, une décimale au moins, jamais un zéro de trop. */
export function formatPh(v: number): string {
  let s = v.toFixed(2);
  if (s.endsWith('0')) s = s.slice(0, -1);
  return s.replace('.', ',');
}

export function appelPalier(
  step: BrewDayStep,
  state: BrewDayState,
  recipe: RecipeSnapshot | undefined,
  now: number
): AppelPalier | null {
  if (!isMash(step.id) || step.startedAt == null || step.doneAt != null || state.finishedAt != null) return null;
  const releves = state.readings ?? [];
  const mashIds = new Set(state.steps.filter((s) => isMash(s.id)).map((s) => s.id));
  mashIds.add(step.id);

  // Température : le palier de la recette, son relevé le plus récent (moût, pas l'eau de rinçage ni l'eau du serpentin).
  const cibleT = cibleMesure('temperature', step, recipe);
  const tempReleve = [...releves]
    .filter((r) => r.stepId === step.id && r.kind === 'temperature' && (r.medium == null || r.medium === 'wort'))
    .sort((a, b) => a.at - b.at)
    .at(-1);
  const proposeT = fini(step.tempC) && step.tempC > 0 ? step.tempC : null;
  const plausibleT = bornesPlausibles('temperature', step, recipe);
  const echelleT = cibleT && proposeT != null
    ? { min: proposeT - 6, max: proposeT + 6 }
    : { min: plausibleT.min, max: plausibleT.max };
  const temperature: CarteAppel = {
    kind: 'temperature',
    nom: 'Température du palier',
    cible: cibleT,
    propose: proposeT,
    echelle: echelleT,
    due: true,
    releve: tempReleve
  };

  // pH : pas au mashout (≥ 75 °C, règle de `mesuresAttendues`). Un relevé de pH de tout l'empâtage compte.
  if (fini(step.tempC) && step.tempC >= 75) return { temperature, ph: null };
  const cibleP = cibleMesure('ph', step, recipe);
  const viseRecette = recipe?.waterPlan?.targetPh;
  const plausibleP = bornesPlausibles('ph', step, recipe);
  const proposeP = fini(viseRecette) && viseRecette >= plausibleP.min && viseRecette <= plausibleP.max
    ? viseRecette
    : cibleP ? (cibleP.min + cibleP.max) / 2 : null;
  const empatageDepuis = Math.min(...state.steps.filter((s) => isMash(s.id) && s.startedAt != null).map((s) => s.startedAt!), step.startedAt);
  const phReleve = [...releves]
    .filter((r) => r.kind === 'ph' && r.stepId != null && mashIds.has(r.stepId))
    .sort((a, b) => a.at - b.at)
    .at(-1);
  const ph: CarteAppel = {
    kind: 'ph',
    nom: 'pH d’empâtage',
    cible: cibleP,
    propose: proposeP,
    echelle: { min: Math.min(5, (proposeP ?? 5) - 0.2), max: Math.max(5.8, (proposeP ?? 5.8) + 0.2) },
    due: now >= empatageDepuis + PH_APRES_MIN * MIN,
    releve: phReleve
  };
  return { temperature, ph };
}

/**
 * Ce que « Relever » écrit, dans l'ordre des cartes. `posees` : les valeurs que le brasseur a posées au curseur.
 * La température se confirme (proposée, à confirmer) ; le pH ne s'écrit que posé. Une carte déjà relevée n'est pas réécrite.
 */
export function aEcrire(
  appel: AppelPalier,
  posees: Partial<Record<KindAppel, number | null>>
): { kind: KindAppel; value: number }[] {
  const sortie: { kind: KindAppel; value: number }[] = [];
  for (const carte of [appel.temperature, appel.ph]) {
    if (!carte || carte.releve) continue;
    const posee = posees[carte.kind];
    const valeur = fini(posee) ? posee : carte.kind === 'temperature' ? carte.propose : null;
    if (fini(valeur)) sortie.push({ kind: carte.kind, value: valeur });
  }
  return sortie;
}

/**
 * L'écriture : la forme des relevés que la carte « Maintenant » et la feuille Mesurer écrivent déjà (température : milieu « wort »,
 * rattachée à la série de chauffe ouverte ; pH : case « échantillon refroidi » à sa valeur par défaut). Sans valeur, l'état est rendu tel quel.
 */
export function ecrireReleves(
  state: BrewDayState,
  step: BrewDayStep,
  valeurs: { kind: KindAppel; value: number }[],
  at: number,
  nouvelId: () => string
): BrewDayState {
  if (!valeurs.length) return state;
  const serie = [...(state.thermalSegments ?? [])].reverse().find((s) => s.stepId === step.id && s.endedAt == null)?.id;
  const ajouts: BrewDayReading[] = valeurs.map(({ kind, value }) => ({
    id: nouvelId(),
    at,
    stepId: step.id,
    kind,
    value,
    unit: READING[kind].unit,
    ...(kind === 'ph'
      ? { roomTemp: refroidiParDefaut('ph', step.id) }
      : { medium: 'wort' as const, thermalSegmentId: serie })
  }));
  return { ...state, readings: [...(state.readings ?? []), ...ajouts] };
}

/** « 66,4 », « 5,3 » : la valeur d'une carte, sans unité (l'écran ajoute « °C »). */
export const valeurAppel = (kind: KindAppel, v: number) => (kind === 'ph' ? formatPh(v) : nombreFr(v, 1));

/** Vrai quand la valeur sort de la bande de la cible (la tolérance que la carte écrit : « cible 66 à 68 »). */
export function horsCible(carte: CarteAppel, valeur: number): boolean {
  return carte.cible != null && ecartHorsCible(carte.cible, valeur) != null;
}

/**
 * Ce que la valeur posée dit de la cible. Aucun chiffre que le brasseur ne peut recalculer de ce qu'il voit (critique pm1, n° 10) :
 *  - température : l'écart se compte à la cible affichée (68,5 contre 67 : « +1,5 au-dessus »), la tolérance est écrite à côté (« cible 66 à 68 ») ;
 *  - pH : l'écart se compte au bord de la bande écrite (« cible 5,2 à 5,5 ») ;
 *  - dans la bande : « dans la cible 66 à 68 ».
 * Vide sans cible : jamais un écart inventé.
 */
export function ecartTexte(carte: CarteAppel, valeur: number): string {
  if (!carte.cible) return '';
  const bande = texteCible(carte);
  const auBord = ecartHorsCible(carte.cible, valeur);
  if (auBord == null) return `dans la ${bande}`;
  const e = carte.kind === 'temperature' && carte.propose != null ? valeur - carte.propose : auBord;
  return `${e > 0 ? '+' : '−'}${nombreFr(Math.abs(e), 2)} ${e > 0 ? 'au-dessus' : 'sous'} · ${bande}`;
}

/** « cible 5,2 à 5,5 » : la bande du pH, à la manière de la maquette. */
export function texteCible(carte: CarteAppel): string {
  if (!carte.cible) return '';
  return `cible ${valeurAppel(carte.kind, carte.cible.min)} à ${valeurAppel(carte.kind, carte.cible.max)}`;
}
