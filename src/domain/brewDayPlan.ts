import type { BrewDayState, BrewDayStep, RecipeSnapshot } from '../types';
import { boilMinutes, isBoilStep, type BrewArea } from './brewCompanion';
import { isMash } from './brewDay';
import { thermalEstimate } from './brewThermal';
import { nombreFr } from './nombreAffiche';

/**
 * Les heures de la journée de brassage (maquette p2c : la frise, « ~17 h 30 estimé », les préparations « à côté »).
 *
 * Problème d'école : ordonnancement en série, somme des durées (PLAN.md, état de l'art n° 4). Pas de bibliothèque utile.
 * - le passé est réel (`startedAt`, `doneAt`, `boilStartedAt`…) ;
 * - le futur est la somme des durées de la recette, plus les montées en température au prix de la vitesse de chauffe ;
 * - une montée sans vitesse connue donne `null` (« ? ») et la suite reste `null` jusqu'à une étape réellement commencée ;
 * - une étape à venir n'est jamais estimée dans le passé : elle finit au plus tôt « maintenant ».
 *
 * Les étapes de la recette qui n'ont pas de durée (eau, rinçage, refroidissement, ensemencement) prennent une durée de
 * pratique : `attentes`. Si le brasseur n'en donne pas, le défaut est une hypothèse, et le résultat la dit (`hypotheses`).
 */

const MIN = 60_000;
type Ms = number | null;
const fini = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Minutes de pratique des étapes sans durée, et délais des préparations « à côté ». */
export interface AttentesPlan {
  eau: number;
  concassage: number;
  /** Du premier palier d'empâtage : verser l'eau et monter à la consigne. */
  empatage: number;
  sparge: number;
  refroidissement: number;
  /** Ensemencement, transfert, fin de journée. */
  ensemencement: number;
  /** L'eau de rinçage se chauffe cette durée avant le rinçage. */
  chauffeRincage: number;
  /** Le refroidisseur se désinfecte cette durée avant la fin de l'ébullition. */
  desinfectionAvantFin: number;
}
/** Valeurs de départ, des hypothèses dites comme telles dans `PlanJournee.hypotheses` (jamais une mesure). */
export const ATTENTES_DEFAUT: AttentesPlan = {
  eau: 60, concassage: 0, empatage: 15, sparge: 30, refroidissement: 30, ensemencement: 15,
  chauffeRincage: 25, desinfectionAvantFin: 25
};
const LIBELLE_HYPOTHESE: Record<keyof AttentesPlan, (min: number) => string> = {
  eau: (m) => `préparation de l’eau : ${m} min`,
  concassage: (m) => `concassage : ${m} min`,
  empatage: (m) => `empâtage jusqu’au palier : ${m} min`,
  sparge: (m) => `rinçage : ${m} min`,
  refroidissement: (m) => `refroidissement : ${m} min`,
  ensemencement: (m) => `ensemencement et transfert : ${m} min`,
  chauffeRincage: (m) => `eau de rinçage chauffée ${m} min avant`,
  desinfectionAvantFin: (m) => `refroidisseur désinfecté ${m} min avant la fin de l’ébullition`
};
const CLE_ATTENTE: Record<string, keyof AttentesPlan | undefined> = {
  eau: 'eau', concassage: 'concassage', sparge: 'sparge', refroidissement: 'refroidissement', ensemencement: 'ensemencement'
};

export interface ParametresPlan {
  attentes?: Partial<AttentesPlan>;
  /** °C/min ; sinon celle de la recette (palier, matériel). */
  heatingRateCPerMin?: number;
}

export interface HeureEtape {
  /** Début de la montée (ou de l'étape). */
  debut: Ms;
  /** Début du palier, une fois la température atteinte. */
  tenue: Ms;
  fin: Ms;
  origine: 'reel' | 'en-cours' | 'estime';
}

/** Contrat de q0/PLAN.md (A3 → B, horloge, groupes), plus `etapes`, `hypotheses` et `phasesInconnues`. */
export interface PlanJournee {
  debut: number;
  /** Fin réelle si la journée est finie, sinon estimée ; `null` si une montée est inconnue. */
  finEstimee: number | null;
  /** Les phases dont les deux bornes sont connues ; les autres sont dans `phasesInconnues`. */
  phases: { area: BrewArea; debut: number; fin: number; ticks: number[] }[];
  aCote: { id: string; nom: string; heure: number | null; fait: boolean }[];
  /** Positif : en avance sur le plan du départ ; négatif : en retard. `null` si une fin est inconnue. */
  avanceMin: number | null;
  /** Fin du plan du départ (durées de la recette, sans les relevés du jour). */
  finPrevue: number | null;
  etapes: Record<string, HeureEtape>;
  hypotheses: string[];
  phasesInconnues: BrewArea[];
}

interface Parcours {
  etapes: Record<string, HeureEtape>;
  fin: Ms;
  debutMash: Ms;
  debutEbullition: Ms;
  debutBouillon: Ms;
  coupure: Ms;
  hasBoil: boolean;
  hyp: Set<keyof AttentesPlan>;
  att: (cle: keyof AttentesPlan) => number;
  /** Vrai si une montée a été comptée à la vitesse de départ (hypothèse), faute de vitesse connue. */
  vitesseHypothese: () => boolean;
}

/** Vitesse de chauffe de départ quand ni la recette ni le matériel n'en donnent : une hypothèse dite (« ~ »), jamais une mesure. */
export const VITESSE_CHAUFFE_DEFAUT = 1;

const vitesse = (recipe: RecipeSnapshot | undefined, cfg: ParametresPlan) => {
  const v = cfg.heatingRateCPerMin ?? recipe?.mash?.heatingRateCPerMin ?? recipe?.brewhouse?.equipment?.heatingRateCPerMin;
  return fini(v) && v > 0 ? v : undefined;
};

/** `reel = false` : le plan du départ, qui ignore tout ce que le jour a fait. */
function parcours(state: BrewDayState, recipe: RecipeSnapshot | undefined, now: number, cfg: ParametresPlan, reel: boolean): Parcours {
  const etapes: Record<string, HeureEtape> = {};
  const hyp = new Set<keyof AttentesPlan>();
  const att = (cle: keyof AttentesPlan) => {
    const donnee = cfg.attentes?.[cle];
    if (fini(donnee) && donnee >= 0) return donnee;
    if (ATTENTES_DEFAUT[cle] > 0) hyp.add(cle);
    return ATTENTES_DEFAUT[cle];
  };
  const rateDonnee = vitesse(recipe, cfg);
  const rate = rateDonnee ?? VITESSE_CHAUFFE_DEFAUT;
  let vitesseHypothese = false;
  const futur = (v: number) => (reel ? Math.max(v, now) : v);
  const steps = state.steps;

  let cursor: Ms = state.startedAt ?? now;
  let derniereT: number | undefined;
  let premierPalier = true;
  const bloc: { v: { start: Ms; end: Ms; origine: HeureEtape['origine'] } | null } = { v: null };
  let debutMash: Ms = null, debutEbullition: Ms = null, coupure: Ms = null;

  const montePalier = (t: number | undefined): Ms => {
    if (!fini(t)) return 0;
    if (derniereT == null) return null;
    if (t === derniereT) return 0;
    if (!(t > derniereT)) return null;
    if (rateDonnee == null) vitesseHypothese = true;
    return Math.round((t - derniereT) / rate) * MIN;
  };
  const monteeEbullition = (): Ms => {
    if (derniereT == null) return null;
    if (rateDonnee == null) vitesseHypothese = true;
    return Math.max(0, Math.round((100 - derniereT) / rate)) * MIN;
  };
  const calculerBloc = () => {
    const rampe = monteeEbullition();
    const duree = boilMinutes(reel ? state : { ...state, boilDurationMin: undefined }, recipe);
    const lance = reel && state.boilStartedAt != null;
    const start: Ms = lance ? state.boilStartedAt! : cursor == null || rampe == null ? null : futur(cursor + rampe);
    const termine = reel && state.boilFinishedAt != null;
    const end: Ms = termine ? state.boilFinishedAt! : start == null ? null : futur(start + duree * MIN);
    debutEbullition = cursor;
    coupure = end;
    bloc.v = { start, end, origine: termine ? 'reel' : lance ? 'en-cours' : 'estime' };
    cursor = end;
  };

  for (const s of steps) {
    if (isBoilStep(s)) {
      if (!bloc.v) calculerBloc();
      const b = bloc.v!;
      const debut: Ms = b.start == null ? null : b.start + (s.boilElapsedMin ?? 0) * MIN;
      // le dernier segment suit la durée du jour (« bouillir +20 min »), pas celle de la recette
      const dernier = steps.filter(isBoilStep).at(-1) === s;
      const prevue = debut == null ? null : debut + s.durationMin * MIN;
      const fin: Ms = prevue == null ? null : b.end == null ? prevue : dernier ? Math.max(b.end, debut!) : Math.min(prevue, b.end);
      etapes[s.id] = { debut, tenue: debut, fin, origine: b.origine };
      continue;
    }
    if (s.id === 'preboil') {
      if (reel && s.doneAt != null) etapes[s.id] = { debut: s.doneAt, tenue: s.doneAt, fin: s.doneAt, origine: 'reel' };
      else {
        const rampe = monteeEbullition();
        const t: Ms = cursor == null || rampe == null ? null : futur(cursor + Math.round(rampe / MIN / 2) * MIN);
        etapes[s.id] = { debut: t, tenue: t, fin: t, origine: 'estime' };
      }
      continue;
    }

    const palier = isMash(s.id);
    const premier = palier && premierPalier;
    if (palier) premierPalier = false;
    const cle = CLE_ATTENTE[s.id];
    const duree = s.durationMin > 0 ? s.durationMin : null;
    const attente = () => (duree == null && cle ? att(cle) : 0);
    let h: HeureEtape;

    if (reel && s.doneAt != null) {
      h = { debut: s.rampStartedAt ?? s.startedAt ?? cursor, tenue: s.startedAt ?? s.holdStartedAt ?? s.rampStartedAt ?? cursor, fin: s.doneAt, origine: 'reel' };
      cursor = s.doneAt;
    } else if (reel && s.startedAt != null) {
      const pause = s.pausedAt != null ? Math.max(0, now - s.pausedAt) : 0;
      const fin = Math.max(s.startedAt + (duree ?? attente()) * MIN + pause, now);
      h = { debut: s.rampStartedAt ?? s.startedAt, tenue: s.startedAt, fin, origine: 'en-cours' };
      cursor = fin;
    } else if (reel && s.rampStartedAt != null && fini(s.tempC)) {
      // montée en cours : la mesure du moût d'abord, sinon l'entrée en température prévue
      const est = thermalEstimate(state, s, s.tempC, now, state.coolingWaterC, rateDonnee);
      let tenue: Ms;
      if (est.status === 'estimate') tenue = now + est.minutes * MIN;
      else if (est.status === 'reached') tenue = now;
      else {
        const rampe = premier ? att('empatage') * MIN : montePalier(s.tempC);
        tenue = rampe == null ? null : Math.max(now, s.rampStartedAt + rampe);
      }
      const fin: Ms = tenue == null ? null : tenue + (duree ?? 0) * MIN;
      h = { debut: s.rampStartedAt, tenue, fin, origine: 'en-cours' };
      cursor = fin;
    } else {
      const rampe: Ms = palier ? (premier ? att('empatage') * MIN : montePalier(s.tempC)) : 0;
      const tenue: Ms = cursor == null || rampe == null ? null : futur(cursor + rampe);
      const fin: Ms = tenue == null ? null : futur(tenue + (duree ?? attente()) * MIN);
      h = { debut: cursor, tenue, fin, origine: 'estime' };
      cursor = fin;
    }
    etapes[s.id] = h;
    if (palier && debutMash == null) debutMash = h.debut;
    if (palier && fini(s.tempC)) derniereT = s.tempC;
  }

  const b = bloc.v;
  return {
    etapes, fin: cursor, debutMash, debutEbullition, debutBouillon: b?.start ?? null, coupure,
    hasBoil: b != null, hyp, att, vitesseHypothese: () => vitesseHypothese
  };
}

const aire = (steps: BrewDayStep[], test: (s: BrewDayStep) => boolean) => steps.some(test);

/**
 * Le plan de la journée à l'instant `now`. `null` si le brassin n'a aucune étape.
 * `recipe` donne la vitesse de chauffe, la durée d'ébullition et la levure ; sans elle, les montées sont inconnues.
 */
export function planJournee(state: BrewDayState, recipe: RecipeSnapshot | undefined, now: number, cfg: ParametresPlan = {}): PlanJournee | null {
  if (!state.steps?.length) return null;
  const jour = parcours(state, recipe, now, cfg, true);
  const depart = parcours(state, recipe, now, cfg, false);
  const debut = state.startedAt ?? now;
  const finEstimee: Ms = state.finishedAt ?? jour.fin;
  const finPrevue = depart.fin;
  const avanceMin = finEstimee != null && finPrevue != null ? Math.round((finPrevue - finEstimee) / MIN) : null;
  const { etapes } = jour;
  const steps = state.steps;

  // Les bornes de la frise suivent la journée de p2c : le rinçage clôt l'empâtage, la coupure du feu ouvre « refroidir ».
  const coupureOuFin: Ms = jour.hasBoil ? jour.coupure
    : steps.map((s) => etapes[s.id]?.debut ?? null).find((_, i) => ['whirlpool', 'refroidissement', 'ensemencement'].includes(steps[i].id)) ?? null;
  const presentes: { area: BrewArea; debut: Ms }[] = [];
  if (aire(steps, (s) => ['eau', 'concassage'].includes(s.id))) presentes.push({ area: 'preparation', debut });
  if (aire(steps, (s) => isMash(s.id) || s.id === 'sparge')) presentes.push({ area: 'mash', debut: jour.debutMash });
  if (jour.hasBoil) presentes.push({ area: 'boil', debut: jour.debutEbullition });
  if (aire(steps, (s) => ['whirlpool', 'refroidissement', 'ensemencement'].includes(s.id))) presentes.push({ area: 'finish', debut: coupureOuFin });

  const phases: PlanJournee['phases'] = [];
  const phasesInconnues: BrewArea[] = [];
  presentes.forEach((p, i) => {
    const fin: Ms = i + 1 < presentes.length ? presentes[i + 1].debut : finEstimee;
    if (p.debut == null || fin == null) { phasesInconnues.push(p.area); return; }
    const marques: Ms[] = [];
    if (p.area === 'mash') for (const s of steps) if (isMash(s.id)) marques.push(etapes[s.id]?.debut ?? null, etapes[s.id]?.tenue ?? null);
    if (p.area === 'boil') marques.push(jour.debutBouillon);
    if (p.area === 'finish') marques.push(etapes.whirlpool?.fin ?? null);
    const ticks = [...new Set(marques.filter((t): t is number => t != null && t > p.debut! && t < fin))].sort((a, b) => a - b);
    phases.push({ area: p.area, debut: p.debut, fin, ticks });
  });

  const aCote: PlanJournee['aCote'] = [];
  const pose = (id: string, nom: string, heure: Ms) => aCote.push({ id, nom, heure, fait: state.preparations?.[id] === true });
  const sparge = steps.find((s) => s.id === 'sparge');
  if (sparge) {
    const d = etapes.sparge?.debut ?? null;
    pose('rinçage', fini(sparge.tempC) ? `rinçage ${nombreFr(sparge.tempC, 1)} °C` : 'rinçage',
      d == null ? null : d - jour.att('chauffeRincage') * MIN);
  }
  if (recipe?.yeast || aire(steps, (s) => s.id === 'ensemencement')) pose('levure', 'levure', jour.hasBoil ? jour.debutBouillon : null);
  if (jour.hasBoil) pose('froid', 'refroidisseur', jour.coupure == null ? null : jour.coupure - jour.att('desinfectionAvantFin') * MIN);

  return {
    debut, finEstimee, phases, aCote, avanceMin, finPrevue, etapes, phasesInconnues,
    hypotheses: [
      ...[...jour.hyp].map((k) => `${LIBELLE_HYPOTHESE[k](ATTENTES_DEFAUT[k])} (hypothèse)`),
      ...(jour.vitesseHypothese() ? [`vitesse de chauffe : ${nombreFr(VITESSE_CHAUFFE_DEFAUT, 1)} °C/min (hypothèse)`] : [])
    ]
  };
}
