import { BrewDayReading, BrewDayState, BrewDayStep, RecipeSnapshot } from '../types';
import { actualWater, boilScenario, lastWortPair, wortRescue } from './brewAssist';
import { boilMinutes, effectiveFermentables, measuredEfficiency } from './brewCompanion';
import { CibleMesure, densiteAvantEbullition, formatCible, sg, volumeTarget } from './brewDay';
import { nombreFr } from './nombreAffiche';

/**
 * Calculs du jour de brassage portés de p2c (A2) : infusion de la maische, zones « sous · dans · sur », rendement visé,
 * trois choix avant l'ébullition. Aucune formule doublée : le rendement passe par `measuredEfficiency`, bouillir et accepter par
 * `wortRescue` et `boilScenario`. Une donnée manquante donne `null`, jamais 0 ni une valeur devinée.
 *
 * État de l'art (L29, PLAN de la mission) : infusion = Palmer, How to Brew, « Infusion Mash Calculations » ; conservation des points de
 * densité = Palmer, « Extract Efficiency » et annexe « Gravity points » ; rendement = points recueillis ÷ points possibles.
 */

/** Chaleur massique relative du grain (Palmer : 0,41 en litres, kilos et °C). */
export const CHALEUR_GRAIN = 0.41;
/** Eau d'infusion chaude : 100 °C (aucun champ d'altitude : jamais moins). */
export const EAU_BOUILLANTE_C = 100;
/** Eau froide quand `coolingWaterC` n'est pas relevée : hypothèse, dite dans le texte. */
export const EAU_FROIDE_HYPOTHESE_C = 15;
/** Extrait sec (DME) : Palmer donne ≈ 42–44 PPG ; 42 quand ni le stock ni la recette n'en donne un. */
export const EXTRAIT_SEC_PPG_REFERENCE = 42;
/** PPG (points par livre et par gallon) → points par litre et par kilo : le même rapport que `measuredEfficiency`. */
const PPL_PAR_PPG = 2.2046226 / 0.26417205;

const fini = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const arrondi = (n: number, pas: number) => Math.round(n / pas) * pas;
const lit = (n: number) => nombreFr(n, 1);
const litresParC = (n: number) => (n > 0 && n < 0.05 ? '< 0,1' : lit(n));
/** « 16 h 40 », à l'heure locale de l'appareil. */
const heureFr = (ms: number) => {
  const d = new Date(ms);
  return `${d.getHours()} h ${String(d.getMinutes()).padStart(2, '0')}`;
};

/* ── 1. Infusion de la maische ─────────────────────────────────────────────────────────────────────────────────────────── */

export interface InfusionParDegre {
  /** Litres d'eau bouillante pour monter d'un °C jusqu'au bas de la bande ; `null` si l'équation n'a pas de solution. */
  chaudeLParC: number | null;
  /** Litres d'eau froide pour descendre d'un °C jusqu'au haut de la bande ; `null` si l'eau froide n'est pas plus froide. */
  froideLParC: number | null;
  chaudeC: number;
  froideC: number;
  /** Vrai quand `coolingWaterC` n'était pas relevée : le texte doit dire « supposés ». */
  froideHypothese: boolean;
  /** Eau + 0,41 × grain, en litres-équivalent (la masse thermique de la maische). */
  masseEquivalenteL: number;
}

/**
 * Palmer : `Wa = (T2 − T1) · (0,41 · G + Wm) / (Tw − T2)`. Par degré : T2 − T1 = 1, T2 = la borne de la bande qu'on veut atteindre
 * (le bas pour réchauffer, le haut pour refroidir). La correction totale est l'écart × ce nombre (l'équation est linéaire en T2 − T1).
 * Sans la masse de la cuve (aucun champ, comme chez Palmer).
 */
export function infusionParDegre(a: {
  eauL?: number | null;
  grainKg?: number | null;
  bordBasC?: number | null;
  bordHautC?: number | null;
  eauFroideC?: number | null;
  eauChaudeC?: number;
}): InfusionParDegre | null {
  if (!fini(a.eauL) || a.eauL <= 0 || !fini(a.grainKg) || a.grainKg <= 0) return null;
  if (!fini(a.bordBasC) && !fini(a.bordHautC)) return null;
  const chaudeC = a.eauChaudeC ?? EAU_BOUILLANTE_C;
  const froideConnue = fini(a.eauFroideC);
  const froideC = froideConnue ? a.eauFroideC! : EAU_FROIDE_HYPOTHESE_C;
  const masse = CHALEUR_GRAIN * a.grainKg + a.eauL;
  const chaudeLParC = fini(a.bordBasC) && chaudeC > a.bordBasC ? masse / (chaudeC - a.bordBasC) : null;
  const froideLParC = fini(a.bordHautC) && a.bordHautC > froideC ? masse / (a.bordHautC - froideC) : null;
  if (chaudeLParC == null && froideLParC == null) return null;
  return { chaudeLParC, froideLParC, chaudeC, froideC, froideHypothese: !froideConnue, masseEquivalenteL: masse };
}

/** L'eau d'empâtage et le grain de la journée : `mashContext` s'il existe, sinon l'eau réelle du plan et les grains d'empâtage. */
export function massesMaische(recipe: RecipeSnapshot, state: BrewDayState): { eauL: number; grainKg: number } | null {
  const eauL = state.mashContext?.waterL ?? actualWater(recipe, state, 'mash').litres;
  const grainKg =
    state.mashContext?.gristKg ??
    effectiveFermentables(recipe, state)
      .filter((f) => f.kind === 'grain' && f.use === 'empatage')
      .reduce((sum, f) => sum + f.weightKg, 0);
  return fini(eauL) && eauL > 0 && fini(grainKg) && grainKg > 0 ? { eauL, grainKg } : null;
}

/** `infusionParDegre` sur la maische du jour. `eauAjouteeL` : l'eau déjà versée en correction, qui s'ajoute à la masse. */
export function infusionPourMaische(
  recipe: RecipeSnapshot,
  state: BrewDayState,
  cible: CibleMesure | null,
  opts: { eauAjouteeL?: number } = {}
): InfusionParDegre | null {
  const m = massesMaische(recipe, state);
  if (!m || !cible) return null;
  return infusionParDegre({
    eauL: m.eauL + Math.max(0, opts.eauAjouteeL ?? 0),
    grainKg: m.grainKg,
    bordBasC: cible.min,
    bordHautC: cible.max,
    eauFroideC: state.coolingWaterC
  });
}

/* ── 2. Zones de la cible et « Et donc » ───────────────────────────────────────────────────────────────────────────────── */

export interface Zone {
  borne: 'sous' | 'dans' | 'sur';
  /** « sous 66 », « 66–68 », « sur 68 ». */
  libelle: string;
  etDonc: string | null;
}

/**
 * Les trois bandes d'une cible. Le « Et donc » n'existe que pour la maische (`contexte: 'maische'`, avec l'infusion et l'heure du pH)
 * et la densité avant ébullition (renvoi aux trois choix) ; partout ailleurs `null`.
 */
export function zonesDeCible(
  kind: BrewDayReading['kind'],
  cible: CibleMesure,
  opts: { contexte?: 'maische' | 'avant-ebullition'; infusion?: InfusionParDegre | null; phA?: string } = {}
): Zone[] {
  const bas = formatCible(kind, cible.min);
  const haut = formatCible(kind, cible.max);
  let sous: string | null = null;
  let dans: string | null = null;
  let sur: string | null = null;
  if (opts.contexte === 'maische' && kind === 'temperature') {
    const i = opts.infusion;
    if (i?.chaudeLParC != null) sous = `≈ ${litresParC(i.chaudeLParC)} L d’eau bouillante par °C, remuer`;
    dans = opts.phA ? `rien : l’horloge tourne, pH à ${opts.phA}` : 'rien : l’horloge tourne';
    if (i?.froideLParC != null)
      sur = `≈ ${litresParC(i.froideLParC)} L d’eau froide (${nombreFr(i.froideC, 1)} °C${i.froideHypothese ? ' supposés' : ''}) par °C, remuer`;
  } else if (opts.contexte === 'avant-ebullition' && kind === 'densite') {
    sous = sur = '3 choix : bouillir plus, extrait sec ou accepter';
  }
  return [
    { borne: 'sous', libelle: `sous ${bas}`, etDonc: sous },
    { borne: 'dans', libelle: `${bas}–${haut}`, etDonc: dans },
    { borne: 'sur', libelle: `sur ${haut}`, etDonc: sur }
  ];
}

/* ── 3. Rendement visé, grain pour le prochain ─────────────────────────────────────────────────────────────────────────── */

const ETAPE_AVANT_EBULLITION: BrewDayStep = { id: 'preboil', label: 'Avant ébullition', durationMin: 0 };

/** Le rendement d'empâtage visé, en %, par la même fonction que le lu (`measuredEfficiency`) appliquée aux cibles d'avant ébullition. */
export function rendementVise(recipe: RecipeSnapshot, state: BrewDayState): number | null {
  const volume = volumeTarget(ETAPE_AVANT_EBULLITION, recipe);
  const densite = densiteAvantEbullition(recipe);
  if (!volume || volume <= 0 || !densite) return null;
  const cibles: BrewDayReading[] = [
    { kind: 'volume', value: volume, unit: 'L', at: 0, stepId: 'preboil' },
    { kind: 'densite', value: densite, unit: 'SG', at: 0, stepId: 'preboil' }
  ];
  const e = measuredEfficiency(recipe, { ...state, readings: cibles }, 'preboil');
  return e.known && !e.questionable ? e.pct : null;
}

/**
 * « Pour le prochain : ≈ +0,9 kg de grain » : `grain × (visé / lu − 1)` sur les grains d'empâtage (mise à l'échelle d'une recette).
 * Le lu est celui d'avant ébullition, non arrondi à l'entier (51,7 % et non 52 %). Négatif : le rendement lu dépasse le visé.
 */
export function grainPourProchain(
  recipe: RecipeSnapshot,
  state: BrewDayState
): { kg: number; luPct: number; visePct: number } | null {
  const lu = measuredEfficiency(recipe, state, 'preboil');
  const vise = rendementVise(recipe, state);
  if (!lu.known || lu.questionable || lu.pct <= 0 || vise == null) return null;
  const grain = effectiveFermentables(recipe, state)
    .filter((f) => f.kind === 'grain' && f.use === 'empatage')
    .reduce((sum, f) => sum + f.weightKg, 0);
  if (!(grain > 0)) return null;
  const kg = Math.round(grain * (vise / lu.pct - 1) * 10) / 10;
  return { kg: kg === 0 ? 0 : kg, luPct: lu.pct, visePct: vise };
}

/* ── 4. Trois choix avant l'ébullition ─────────────────────────────────────────────────────────────────────────────────── */

export interface OptionCorrection {
  id: 'bouillir' | 'extrait' | 'accepter';
  titre: string;
  detail: string;
  /** Durée **totale** de l'ébullition après le choix (l'horloge « 80:00 »), pas seulement le supplément. Seulement pour « bouillir ». */
  minutesEbullition?: number;
}

export interface CorrectionsAvantEbullition {
  options: OptionCorrection[];
  /** Ce qui a été supposé faute de donnée (potentiel de l'extrait sec), à dire à l'écran. */
  hypotheses: string[];
  /** « ≈ calculé par l'app · évaporation 4,5 L/h · rendement ≈ 52 %, visé ≈ 57 % » */
  note: string;
}

export interface PaireSansCible {
  /** Le dernier couple volume + densité d'avant ébullition, relevé sans qu'on puisse en tirer les trois choix. */
  paire: { volume: BrewDayReading; gravity: BrewDayReading };
  /** Pourquoi, en mots du brasseur (« évaporation du profil inconnue »). */
  raisons: string[];
  /** Les choix qui restent possibles sans cible : « Accepter » seul (bouillir plus se règle à l'horloge). */
  options: OptionCorrection[];
  /** La phrase de la carte : « Pas de cible calculable : … ». */
  note: string;
}

/**
 * E3 aux réglages par défaut (lot K2, n° 7) : un couple volume + densité est noté, mais `correctionsAvantEbullition` rend `null`
 * (pas de référence de température, pas d'évaporation, pas d'OG visée). Plutôt que le silence, la carte dit pourquoi et garde « Accepter ».
 * `null` : pas de couple (à une seule grandeur, ou séparé par un ajout), ou les trois choix existent déjà.
 */
export function paireSansCible(recipe: RecipeSnapshot, state: BrewDayState): PaireSansCible | null {
  // `lastWortPair` exige la référence de température ; on la lui prête pour retrouver le couple, puis on la contrôle nous-mêmes.
  const prete: BrewDayState = {
    ...state,
    readings: (state.readings ?? []).map((r) => (r.stepId === 'preboil' && (r.kind === 'volume' || r.kind === 'densite') ? { ...r, roomTemp: true } : r))
  };
  const prise = lastWortPair(prete, 'preboil');
  if (!prise) return null;
  const vrai = lastWortPair(state, 'preboil');
  const paire = (state.readings ?? []).filter((r) => r.stepId === 'preboil');
  const volume = paire.find((r) => r.id === prise.volume.id) ?? prise.volume;
  const gravity = paire.find((r) => r.id === prise.gravity.id) ?? prise.gravity;
  const raisons: string[] = [];
  if (!vrai) {
    raisons.push(
      volume.roomTemp && !gravity.roomTemp
        ? 'densité non refroidie ni corrigée à 20 °C'
        : !volume.roomTemp && gravity.roomTemp
          ? 'volume non ramené à 20 °C'
          : 'volume et densité sans référence de température (20 °C)'
    );
  }
  const og = recipe.ogTarget;
  if (!fini(og) || og <= 1) raisons.push('OG visée inconnue');
  const evap = state.boilOffLPerHour ?? recipe.brewhouse?.equipment?.boilOffLPerHour;
  if (!fini(evap)) raisons.push('évaporation inconnue (profil de brasserie)');
  if (!raisons.length) {
    // Le couple est à froid, la recette et l'équipement sont connus : si les trois choix existent, la carte normale parle.
    if (correctionsAvantEbullition(recipe, state)) return null;
    raisons.push('durée d’ébullition inconnue');
  }
  return {
    paire: { volume, gravity },
    raisons,
    options: [{ id: 'accepter', titre: 'Accepter', detail: 'garder ce moût · OG et volume finals non calculés' }],
    note: `Pas de cible calculable : ${raisons.join(' · ')}. Pour bouillir plus, règle l’horloge (+5).`
  };
}

/**
 * Le moût d'avant ébullition est sous la cible : bouillir plus (durée arrondie à 5 min), ajouter de l'extrait sec, ou accepter.
 * Les volumes et densités viennent de `wortRescue` (points recueillis, volume à la cible, évaporation) et de `boilScenario` (OG finale) ;
 * seul le nombre de minutes et la masse d'extrait se déduisent de leurs sorties. `null` : pas de paire volume-densité à froid, pas
 * d'OG visée, pas d'évaporation.
 * `finEbullitionMs` : la fin de l'ébullition à la durée prévue (A3) ; sans elle, pas de « fin ~ ».
 */
export function correctionsAvantEbullition(
  recipe: RecipeSnapshot,
  state: BrewDayState,
  opts: { finEbullitionMs?: number | null; extraitSec?: { nom?: string; potentialPpg: number } | null } = {}
): CorrectionsAvantEbullition | null {
  const og = recipe.ogTarget;
  if (!fini(og) || og <= 1) return null;
  const rescue = wortRescue(state, 'preboil', og, recipe);
  const paire = lastWortPair(state, 'preboil');
  const duree = boilMinutes(state, recipe);
  if (!rescue || !paire || rescue.evaporationL == null || !(duree > 0)) return null;
  const accepte = boilScenario(recipe, state, duree);
  if (!accepte || accepte.finalL == null || accepte.finalOg == null) return null;

  const options: OptionCorrection[] = [];
  const hypotheses: string[] = [];
  const parHeure = (rescue.evaporationL * 60) / duree; // L/h réellement évaporés, retrait à froid compris
  const dilue = accepte.finalL > rescue.targetL + 1e-9; // trop peu concentré : il faut concentrer ou ajouter du sucre

  if (dilue && parHeure > 0) {
    const total = arrondi(duree + ((accepte.finalL - rescue.targetL) * 60) / parHeure, 5);
    const plus = boilScenario(recipe, state, total);
    if (total > duree && plus && plus.finalL != null && plus.finalOg != null) {
      const fin = opts.finEbullitionMs != null ? ` · fin ~${heureFr(opts.finEbullitionMs + (total - duree) * 60000)}` : '';
      options.push({
        id: 'bouillir',
        titre: `Bouillir +${total - duree} min`,
        detail: `≈ ${lit(plus.finalL)} L à ${sg(plus.finalOg)}${fin}`,
        minutesEbullition: total
      });
    }
  }
  if (dilue) {
    const manquants = accepte.finalL * (og - 1) * 1000 - rescue.pointsLitres;
    const dme = opts.extraitSec?.potentialPpg ?? effectiveFermentables(recipe, state).find((f) => f.kind === 'extrait' && fini(f.potentialPpg))?.potentialPpg;
    const ppg = fini(dme) && dme > 0 ? dme : EXTRAIT_SEC_PPG_REFERENCE;
    if (!(fini(dme) && dme > 0))
      hypotheses.push(`extrait sec supposé à ${EXTRAIT_SEC_PPG_REFERENCE} PPG (Palmer : 42 à 44) faute de potentiel connu`);
    if (manquants > 0) {
      const g = Math.max(10, arrondi((manquants / (ppg * PPL_PAR_PPG)) * 1000, 10));
      options.push({
        id: 'extrait',
        titre: `Extrait sec ≈ ${g} g`,
        detail: `≈ ${lit(accepte.finalL)} L à ${sg(og)} · au premier bouillon`
      });
    }
  }
  options.push({ id: 'accepter', titre: 'Accepter', detail: `OG ≈ ${sg(accepte.finalOg)} · ≈ ${lit(accepte.finalL)} L` });

  const brut = state.boilOffLPerHour ?? recipe.brewhouse?.equipment?.boilOffLPerHour;
  const lu = measuredEfficiency(recipe, state, 'preboil');
  const vise = rendementVise(recipe, state);
  const morceaux = ['≈ calculé par l’app'];
  if (fini(brut)) morceaux.push(`évaporation ${nombreFr(brut, 1)} L/h`);
  if (lu.known && vise != null) morceaux.push(`rendement ≈ ${Math.round(lu.pct)} %, visé ≈ ${Math.round(vise)} %`);
  return { options, hypotheses, note: morceaux.join(' · ') };
}
