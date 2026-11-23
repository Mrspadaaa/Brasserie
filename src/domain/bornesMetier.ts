import { nombreFr } from '../domain/nombreAffiche';
// Les bornes métier d'une recette : une seule table, lue par la validation (`recipeValidation.ts`), les calculs (`hopBitterness.ts`,
// `brewingMath.efficiencyAtGravity`) et les écrans (étape Malts/sucres, champ α des houblons). À côté de la table famille × moment
// (`fermentables/moments.ts`). Audit métier du 08.11 : AM 3, AM 9, MV-44 à MV-47 (10 000 kg ou 50 kg de Pale Ale dans 20 L : OG 116,808 ;
// α 100 % : 469 IBU ; 99 999 g de Nugget : 112 477 IBU).
//
// Hors bornes : une saisie à confirmer (α : un extrait existe) ou une erreur claire. Jamais un calcul silencieux : l'IBU attend, la recette
// ne s'enregistre pas, l'écran le dit. Chaque borne cite sa source, ou se dit « estimée » avec son calcul.

export interface Borne { min?: number; max: number; unite: string; source: string }

export const BORNES = {
  /** Densité initiale. */
  og: {
    max: 1.13, unite: 'SG',
    source: 'BJCP 2021 : les styles les plus forts (English Barleywine, Wheatwine, Eisbock) s’arrêtent à 1,120 ; marge de 10 points pour une bière hors style.',
  },
  /** Masse de malt, sucre et extrait par litre de bière. */
  fermentescibleKgParL: {
    max: 0.7, unite: 'kg/L',
    source: 'Estimée : 1,130 à 65 % de rendement demandent ~0,6 kg/L d’un malt à 37 ppg (130 ÷ (37 × 2,2046 × 0,65 ÷ 0,26417)) ; marge de 15 %.',
  },
  /** Masse d'une ligne de fermentescible (10 t) : la saisie au-delà est ramenée là et dite (étape Malts/sucres, récapitulatif). */
  masseLigneKg: {
    max: 10000, unite: 'kg',
    source: 'Estimée : une brasserie artisanale ne brasse pas plus de 10 t de malt par ligne et par brassin ; au-delà, c’est une erreur de saisie (fuzzSaisie : 999999999999).',
  },
  /** Houblon de toute la recette (ébullition, whirlpool, à cru) par litre. */
  houblonGParL: {
    max: 40, unite: 'g/L',
    source: 'Estimée : ~15–20 g/L à cru pour une NEIPA chargée (Hieronymus, For the Love of Hops) plus ~10 g/L à chaud ; marge, soit 40 g/L au total.',
  },
  /** Alpha d'un lot de houblon. Au-delà : à confirmer (un extrait CO₂ dépasse 30 %). */
  alphaPct: {
    max: 30, unite: '%',
    source: 'Alpha commercial de ~2 % (nobles) à ~20–22 % (Apollo, CTZ) : fiches de lot Hopsteiner et Yakima Chief ; seuls les extraits dépassent 30 %.',
  },
  // Moments des houblons (audit métier du 08.11 : AM 14 à 19, TE-21, TE-22). Une durée ou un jour hors de ces bornes n'existe pas en brasserie :
  // erreur claire (l'IBU attend), jamais un nombre calculé en silence.
  /** Durée d'ébullition de la recette. 0 min : pas d'ébullition, donc aucune isomérisation. */
  ebullitionMin: {
    max: 240, unite: 'min',
    source: 'Estimée : les ébullitions longues du métier (Imperial stout, Scotch ale, Barleywine) vont de 2 à 3 h ; marge jusqu’à 4 h.',
  },
  /** Durée de contact d'un whirlpool ou hop stand. */
  whirlpoolMin: {
    max: 180, unite: 'min',
    source: 'Estimée : hop stand courant de 15 à 90 min (Hieronymus, For the Love of Hops, ch. 5) ; marge jusqu’à 3 h.',
  },
  /** Température d'un whirlpool : de l'arrêt du feu (jusqu'à 100 °C) au whirlpool refroidi, sous lequel ce n'est plus une isomérisation. */
  whirlpoolTempC: {
    min: 40, max: 100, unite: '°C',
    source: 'Estimée : hop stand de 60 à 100 °C ; « cool whirlpool » jusqu’à 40 °C ; en dessous, c’est un houblonnage à cru.',
  },
  /** Jour d'un houblonnage à cru, compté depuis J0 (l'ensemencement). */
  dryHopJour: {
    max: 60, unite: 'jours',
    source: 'Estimée : fermentation de 7 à 21 jours, garde de quelques semaines ; au-delà de 60 jours, ce n’est plus un houblonnage à cru d’un programme.',
  },
  /** Contact d'un houblonnage à cru. */
  dryHopContactH: {
    max: 720, unite: 'h',
    source: 'Estimée : un houblonnage à cru dure de quelques heures à 2 semaines (Hieronymus, ch. 9) ; marge jusqu’à 30 jours.',
  },
  /** Température d'un houblonnage à cru : de la garde à froid à une fermentation chaude (kveik). */
  dryHopTempC: {
    min: -2, max: 40, unite: '°C',
    source: 'Estimée : garde à froid jusqu’à −2 °C ; fermentation chaude (kveik) jusqu’à 40 °C.',
  },
} as const satisfies Record<string, Borne>;

export const frBorne = (x: number, d = 0) => x.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: Math.max(d, 1) });

/** La masse de fermentescibles par litre, si elle dépasse la borne : le message ; sinon `null`. */
export function messageMasseParLitre(totalKg: number, volumeL: number): string | null {
  if (!(Number.isFinite(totalKg) && Number.isFinite(volumeL) && volumeL > 0)) return null;
  const parL = totalKg / volumeL;
  if (parL <= BORNES.fermentescibleKgParL.max) return null;
  return `${frBorne(totalKg)} kg de malt et sucre pour ${frBorne(volumeL)} L, soit ${frBorne(parL, 2)} kg/L : au-delà de ${frBorne(BORNES.fermentescibleKgParL.max, 1)} kg/L, aucune bière n’existe : erreur de saisie probable, vérifie les masses et le volume.`;
}

/** Le houblon par litre, s'il dépasse la borne : le message ; sinon `null`. */
export function messageHoublonParLitre(totalG: number, volumeL: number): string | null {
  if (!(Number.isFinite(totalG) && Number.isFinite(volumeL) && volumeL > 0)) return null;
  const parL = totalG / volumeL;
  if (parL <= BORNES.houblonGParL.max) return null;
  return `${frBorne(totalG)} g de houblon pour ${frBorne(volumeL)} L, soit ${frBorne(parL)} g/L : au-delà de ${nombreFr(BORNES.houblonGParL.max, 1)} g/L, erreur de saisie probable (des kg tapés en g ?).`;
}

export const ogHorsBornes = (og: number | null | undefined): boolean => typeof og === 'number' && Number.isFinite(og) && og > BORNES.og.max;

const nombre = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);

/**
 * Ce qu'une frappe sur une ligne de houblon peut retenir : un nombre négatif n'existe pour aucune de ces grandeurs (α, dose, minutes, jour,
 * contact), et « −2 » ne se retient pas en attendant la sortie du champ (MV-18 : α −2 %, TE-21 : minutes −5, BR-42 : dose −1 g). Seule la
 * température d'un houblonnage à cru peut descendre sous zéro (garde à froid).
 */
export function saisieHoublonRetenue<T extends Record<string, unknown>>(patch: T): Partial<T> {
  const net: Partial<T> = {};
  for (const [k, v] of Object.entries(patch) as Array<[keyof T & string, unknown]>) {
    if (nombre(v) && v < 0 && k !== 'aromaTemperatureC') continue;
    (net as Record<string, unknown>)[k] = v;
  }
  return net;
}

/**
 * Ce qu'une masse tapée au récapitulatif retient (BR-21 : « 99 999 kg » et « −1 kg » acceptés, vide = `undefined` dans la recette, d'où NaN à l'étape Malts/sucres) :
 * un négatif ne se retient pas (`null` : la valeur d'avant reste) ; un champ vidé ou illisible vaut 0 (« à compléter », comme à l'étape) ; au-delà de
 * 10 t, le plafond de la table. Une seule règle pour l'étape et le récapitulatif.
 */
export function masseLigneRetenue(v: unknown): number | null {
  if (!nombre(v)) return 0;
  if (v < 0) return null;
  return Math.min(BORNES.masseLigneKg.max, v);
}

/** L'ébullition de la recette hors bornes : le message ; sinon `null`. (0 min : pas d'ébullition, un houblon à chaud n'isomérise pas.) */
export function messageEbullition(boilMin: number | undefined): string | null {
  if (!nombre(boilMin)) return null;
  if (boilMin > BORNES.ebullitionMin.max) return `Durée d’ébullition de ${frBorne(boilMin)} min : au-delà de ${BORNES.ebullitionMin.max} min (4 h), aucune ébullition n’existe : erreur de saisie probable.`;
  if (boilMin === 0) return 'Durée d’ébullition de 0 min : sans ébullition, un houblon à chaud n’isomérise pas, et son IBU n’est pas calculé. Indique la durée, ou passe le houblon à cru.';
  return null;
}

/** Les jours d'un programme de fermentation (somme des phases), `null` si le programme est vide ou illisible. */
export function joursProgramme(fermentation: ReadonlyArray<{ days?: number }> | undefined): number | null {
  const total = (fermentation ?? []).reduce((s, p) => s + (nombre(p.days) && p.days > 0 ? p.days : 0), 0);
  return total > 0 ? total : null;
}

export interface LigneHoublonBornes {
  name?: string; stage: string; timeMin?: number; tempC?: number; dayOffset?: number;
  aromaTiming?: string; aromaContactHours?: number; aromaTemperatureC?: number;
}
export interface ContexteHoublon {
  /** Les jours du programme de fermentation (`joursProgramme`), quand il existe. */
  programmeJours?: number | null;
  /** Les jours de la phase de fermentation active (la première phase), quand elle existe. */
  actifJours?: number | null;
}
export interface ProblemeHoublon { champ: 'time' | 'temp' | 'day' | 'contact' | 'phase'; message: string }

/**
 * Les impossibles d'une ligne de houblon : durée et température d'un whirlpool, jour, contact et température d'un houblonnage à cru, phase contraire
 * à son jour. Une seule règle pour tous les moments (AM 14 à 18, TE-22) ; le champ nomme celui à corriger.
 */
export function problemesLigneHoublon(h: LigneHoublonBornes, ctx: ContexteHoublon = {}): ProblemeHoublon[] {
  const nom = h.name?.trim() || 'Ce houblon';
  const o: ProblemeHoublon[] = [];
  if (h.stage === 'whirlpool') {
    if (nombre(h.timeMin) && h.timeMin > BORNES.whirlpoolMin.max)
      o.push({ champ: 'time', message: `${nom} : un whirlpool de ${frBorne(h.timeMin)} min dépasse ${BORNES.whirlpoolMin.max} min : erreur de saisie probable.` });
    if (nombre(h.tempC) && (h.tempC < BORNES.whirlpoolTempC.min || h.tempC > BORNES.whirlpoolTempC.max))
      o.push({ champ: 'temp', message: `${nom} : un whirlpool se fait de ${BORNES.whirlpoolTempC.min} à ${nombreFr(BORNES.whirlpoolTempC.max, 1)} °C, pas à ${frBorne(h.tempC)} °C.` });
  }
  if (h.stage === 'dryHop') {
    if (nombre(h.dayOffset)) {
      if (h.dayOffset > BORNES.dryHopJour.max)
        o.push({ champ: 'day', message: `${nom} : J+${frBorne(h.dayOffset)} dépasse ${BORNES.dryHopJour.max} jours : erreur de saisie probable.` });
      else if (nombre(ctx.programmeJours) && h.dayOffset > ctx.programmeJours)
        o.push({ champ: 'day', message: `${nom} : J+${frBorne(h.dayOffset)} tombe après la fin du programme (J+${frBorne(ctx.programmeJours)}).` });
    }
    if (nombre(h.aromaContactHours) && h.aromaContactHours > BORNES.dryHopContactH.max)
      o.push({ champ: 'contact', message: `${nom} : un contact à cru de ${frBorne(h.aromaContactHours)} h dépasse ${BORNES.dryHopContactH.max} h (30 jours) : erreur de saisie probable.` });
    if (nombre(h.aromaTemperatureC) && (h.aromaTemperatureC < BORNES.dryHopTempC.min || h.aromaTemperatureC > BORNES.dryHopTempC.max))
      o.push({ champ: 'temp', message: `${nom} : un houblonnage à cru à ${frBorne(h.aromaTemperatureC)} °C n’existe pas (de ${BORNES.dryHopTempC.min} à ${nombreFr(BORNES.dryHopTempC.max, 1)} °C).` });
    // La phase dit la même chose que le jour : « fermentation active » après la fin de la fermentation, ou « après fermentation » à J0.
    if (nombre(h.dayOffset) && h.aromaTiming === 'fermentation' && nombre(ctx.actifJours) && h.dayOffset > ctx.actifJours)
      o.push({ champ: 'phase', message: `${nom} : « fermentation active » à J+${frBorne(h.dayOffset)}, alors que la fermentation active finit à J+${frBorne(ctx.actifJours)}.` });
    if (nombre(h.dayOffset) && h.aromaTiming === 'postFermentation' && h.dayOffset <= 0)
      o.push({ champ: 'phase', message: `${nom} : « après fermentation » à J0 : la fermentation n’a pas commencé.` });
  }
  return o;
}
