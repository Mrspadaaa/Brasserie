// Les bornes du PROCÉDÉ d'une recette : empâtage, fermentation, levure, rendement, eau et sels. Une seule table, lue par la validation
// (`recipeValidation.ts`), qui rend la saisie impossible à enregistrer et la dit dès la frappe (`live`). À côté de `bornesMetier.ts`
// (matières : OG, malt, houblon, alpha), même règle : hors bornes, une erreur claire ; jamais un calcul silencieux sur une valeur qui
// n'existe pas en brasserie. Audit métier du 08.11 : AM-21 à AM-32, BR-23, BR-32, BR-33, BR-83, MV-23 à MV-33.
//
// Chaque borne cite sa source ou se dit « estimée ». Une borne « physique » sépare l'impossible du simplement inhabituel : l'inhabituel
// reste un conseil (`recipeAdvice`), il ne bloque rien.

import type { Recipe, SaltId, WaterIons } from '../types';
import { frBorne } from './bornesMetier';
import { ionsFromSalts } from './water/substances';
import { nombreFr } from '../domain/nombreAffiche';

export interface IssueProcede { field: string; step: 'identite' | 'levure' | 'paliers' | 'eau' | 'recap'; message: string; live: true }
/** Un conseil : une valeur possible mais inhabituelle, ou deux valeurs qui se contredisent. Il ne bloque jamais l'enregistrement. */
export interface ConseilProcede { field: string; step: 'paliers' | 'eau'; message: string }

export const BORNES_PROCEDE = {
  /** Volume d'un brassin adapté (fiche Volumes) : du plus petit essai à la plus grande cuve d'une micro-brasserie. */
  volumeBrassinL: {
    min: 0.5, max: 2000, unite: 'L',
    source: 'Estimée : 0,5 L = un essai de laboratoire ; 20 hL = la plus grande cuve de brassage d’une micro-brasserie (Brewers Association : micro < 15 000 barils/an).',
  },
  /** Température d'un palier d'empâtage. */
  empatageTempC: {
    min: 35, max: 80, unite: '°C',
    source: 'Palmer, How to Brew, ch. 14 : repos acide ou férulique dès 35–45 °C, protéase 50–55, β-amylase 55–65, α-amylase 66–72, mash-out 76–78 °C ; au-dessus de ~80 °C les amylases se dénaturent, sous 35 °C aucune enzyme ne travaille.',
  },
  /** Durée d'un palier d'empâtage (0 : un mash-out qu'on atteint sans maintenir). */
  empatageDureeMin: {
    max: 240, unite: 'min',
    source: 'Estimée : les paliers longs d\'une bière brune ou d\'un brassage fractionné vont de 90 à 120 min ; 240 min (4 h) laissent une marge de 100 %.',
  },
  /** Température d'une phase de fermentation, de garde ou de repos. */
  fermentationTempC: {
    min: -2, max: 40, unite: '°C',
    source: 'Kveik : jusqu\'à 40 °C ; garde de lager : 0 à −1 °C (une bière à 12 % vol. gèle vers −5 °C) ; la levure meurt au-dessus de ~45 °C.',
  },
  /** Durée d'une phase de fermentation, en jours. */
  fermentationJours: {
    max: 365, unite: 'j',
    source: 'Estimée : une garde longue (barley wine, lambic) dure 3 à 12 mois ; au-delà d\'un an, ce n\'est plus une phase de recette.',
  },
  /** Température d'ensemencement. */
  ensemencementTempC: {
    min: 0, max: 40, unite: '°C',
    source: 'Lager : 8–12 °C ; ale : 15–24 °C ; kveik : jusqu\'à 40 °C ; contact à froid NOLO : ~1 °C ; sous 0 °C le moût gèle.',
  },
  /** Atténuation apparente d'une levure (avec laquelle la FG se prédit). */
  attenuationPct: {
    min: 1, max: 99, unite: '%',
    source: 'Fiches Fermentis, Lallemand, White Labs : ~65 à 95 % apparent ; une levure sans maltose (NOLO) descend à quelques %. 0 % = levure inerte, 100 % = FG de 1,000 : aucune souche publiée.',
  },
  /** Rendement de brasserie (extrait en fermenteur rapporté au potentiel du grain). */
  rendementPct: {
    min: 30, max: 95, unite: '%',
    source: 'Brasseries artisanales : 65–80 % (BIAB 60–75, grande installation à filtre 85–92) ; Kunze : 95 % = maximum d\'un brasserie industrielle, jamais en fermenteur.',
  },
  /** Dose de levure par litre de bière : sèche (g/L), liquide ou crème (mL/L). */
  doseLevure: {
    gParL: 5, mlParL: 100, sachetsParL: 0.5,
    source: 'Fermentis : 50 à 100 g/hL de levure sèche (0,5–1 g/L), 150 g/hL pour une bière forte ; crème : ≤ 1 L/hL. Les maxima retenus valent 5 à 10 fois la pratique courante.',
  },
  /** Rapport eau/grain à l'empâtage. */
  rapportEmpatage: {
    min: 1.5, max: 12, unite: 'L/kg',
    source: 'Kunze : 2,5–4 L/kg ; empâtage épais 2,0 ; le grain retient ~1 L/kg : sous 1,5 L/kg il n\'est pas détrempé ; au-delà de 12 L/kg ce n\'est plus une maische (BIAB plein volume : 5–6).',
  },
  /** Eau totale (empâtage + rinçage) par litre de bière en fermenteur. */
  eauTotaleParL: {
    max: 3, unite: 'L/L',
    source: 'Estimée : ~1,35 L d\'eau par litre de bière (pertes, ébullition, drêches) ; 3 L/L = plus du double, pour un grain absorbant 1 L/kg et une longue ébullition.',
  },
  /** Plafond d'un ion apporté par les sels, en ppm dans l'eau où ils se dissolvent. */
  ionsSels: {
    ca: 500, mg: 125, na: 300, so4: 1000, cl: 600, hco3: 800,
    source: 'Burton-on-Trent (Ca 352, SO₄ 820 ppm) = la plus dure des eaux de brasserie ; Mg > 125 ppm purge ; Na > 300 ppm : une gose en use 250 ; plafonds à ~1,2 × la valeur extrême publiée (Palmer, Water, 2013 ; Kunze).',
  },
  /** Acide liquide (lactique 80 %, phosphorique 75 %) par litre d'eau traitée. */
  acideMlParL: {
    max: 3, unite: 'mL/L',
    source: 'Estimée : 0,2–1 mL/L neutralisent 120–600 ppm de HCO₃ ; 3 mL/L en neutraliseraient 1 800 : plus que n\'importe quelle eau du monde.',
  },
  /** pH d'empâtage visé. */
  phEmpatage: {
    min: 4.5, max: 6.5,
    source: 'Fenêtre de la maische 5,2–5,6 (Kunze, Palmer) ; hors de [4,5 ; 6,5] les enzymes et le houblon ne travaillent plus.',
  },
} as const;

const fr = (n: number, d = 0) => frBorne(n, d);
const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const hasValue = (n: unknown) => n != null && !(typeof n === 'number' && !Number.isFinite(n));

/** Un palier d'empâtage : température et durée. Les champs vides ou NaN restent à la charge de `recipeSaveIssues` (« renseigne une valeur »). */
export function empatageIssues(steps: ReadonlyArray<{ name?: string; tempC: number; durationMin: number }> | undefined): IssueProcede[] {
  const out: IssueProcede[] = [];
  const T = BORNES_PROCEDE.empatageTempC, D = BORNES_PROCEDE.empatageDureeMin;
  (steps ?? []).forEach((s, i) => {
    const nom = s.name?.trim() ? `Palier ${i + 1} (${s.name.trim().slice(0, 40)})` : `Palier ${i + 1}`;
    if (finite(s.tempC) && (s.tempC < T.min || s.tempC > T.max))
      out.push({ field: `wz-mash-temp-${i}`, step: 'paliers', live: true,
        message: `${nom} : ${fr(s.tempC, 1)} °C n’existe pas à l’empâtage. Entre ${T.min} et ${nombreFr(T.max, 1)} °C : les enzymes ne travaillent pas sous ${nombreFr(T.min, 1)} °C et meurent au-dessus de ${nombreFr(T.max, 1)} °C.` });
    if (finite(s.durationMin) && s.durationMin > D.max)
      out.push({ field: `wz-mash-duration-${i}`, step: 'paliers', live: true,
        message: `${nom} : ${fr(s.durationMin)} min de maintien, soit plus de ${D.max / 60} h. Vérifie la durée (au plus ${D.max} min).` });
  });
  return out;
}

const PHASE = { primaire: 'primaire', reposDiacetyle: 'repos diacétyle', garde: 'garde', refermentation: 'refermentation', ajout: 'ajout' } as const;
/** Une phase de fermentation : température et durée. */
export function fermentationIssues(phases: ReadonlyArray<{ name?: string; tempC: number; days: number }> | undefined): IssueProcede[] {
  const out: IssueProcede[] = [];
  const T = BORNES_PROCEDE.fermentationTempC, J = BORNES_PROCEDE.fermentationJours;
  (phases ?? []).forEach((s, i) => {
    const nom = s.name?.trim() ? s.name.trim().slice(0, 40) : `Phase ${i + 1}`;
    if (finite(s.tempC) && (s.tempC < T.min || s.tempC > T.max))
      out.push({ field: `wz-ferment-temp-${i}`, step: 'paliers', live: true,
        message: `${nom} : ${fr(s.tempC, 1)} °C. Entre ${T.min} et ${nombreFr(T.max, 1)} °C : la levure dort sous ${nombreFr(T.min, 1)} °C (la bière gèle) et meurt au-dessus de 45 °C.` });
    if (finite(s.days) && s.days > J.max)
      out.push({ field: `wz-ferment-days-${i}`, step: 'paliers', live: true,
        message: `${nom} : ${fr(s.days)} j, soit plus d’un an. Durée attendue : ${J.max} j au plus.` });
  });
  return out;
}

/** Levure : température d'ensemencement, atténuation, dose rapportée au volume de la bière. */
export function levureIssues(yeast: Recipe['yeast'] | undefined, volumeL: number): IssueProcede[] {
  const out: IssueProcede[] = [];
  if (!yeast) return out;
  const P = BORNES_PROCEDE.ensemencementTempC, A = BORNES_PROCEDE.attenuationPct, Q = BORNES_PROCEDE.doseLevure;
  if (finite(yeast.pitchTempC) && (yeast.pitchTempC < P.min || yeast.pitchTempC > P.max))
    out.push({ field: 'wz-yeast-pitch', step: 'levure', live: true,
      message: `Température d’ensemencement ${fr(yeast.pitchTempC, 1)} °C : entre ${P.min} et ${nombreFr(P.max, 1)} °C (lager 8–12 °C, ale 15–24 °C, kveik jusqu’à ${nombreFr(P.max, 1)} °C).` });
  if (finite(yeast.attenuationPct) && (yeast.attenuationPct < A.min || yeast.attenuationPct > A.max))
    out.push({ field: 'wz-yeast-range', step: 'levure', live: true,
      message: `Atténuation de la levure ${fr(yeast.attenuationPct, 1)} % : entre ${A.min} et ${nombreFr(A.max, 1)} %. 0 % ou 100 % n’existent pas (aucune souche publiée).` });
  if (finite(yeast.qty) && yeast.qty > 0 && finite(volumeL) && volumeL > 0) {
    const unite = (yeast.unit ?? '').trim().toLowerCase();
    let max: number | null = null, par = '';
    if (unite === 'g') { max = Q.gParL * volumeL; par = `${nombreFr(Q.gParL, 1)} g/L`; }
    else if (unite === 'kg') { max = Q.gParL * volumeL / 1000; par = `${nombreFr(Q.gParL, 1)} g/L`; }
    else if (unite === 'ml') { max = Q.mlParL * volumeL; par = `${nombreFr(Q.mlParL, 1)} mL/L`; }
    else if (unite === 'l') { max = Q.mlParL * volumeL / 1000; par = `${nombreFr(Q.mlParL, 1)} mL/L`; }
    else if (['sachet', 'sachets', 'paquet', 'paquets', 'pack', 'packs', 'flacon', 'flacons'].includes(unite)) { max = Math.max(1, Q.sachetsParL * volumeL); par = `${Q.sachetsParL} sachet par litre`; }
    if (max != null && yeast.qty > max + 1e-9)
      out.push({ field: 'wz-yeast-qty', step: 'levure', live: true,
        message: `${fr(yeast.qty, 2)} ${yeast.unit} de levure pour ${fr(volumeL, 1)} L de bière : au-delà de ${par} (${fr(max, 2)} ${yeast.unit}), erreur de saisie probable (une dose se rapporte au volume : 0,5 à 1 g/L en levure sèche).` });
  }
  return out;
}

/** Rendement d'une recette : au-delà de 95 %, aucune installation ne l'atteint en fermenteur. */
export function rendementIssue(pct: number | undefined): IssueProcede | null {
  const R = BORNES_PROCEDE.rendementPct;
  if (!finite(pct) || (pct >= R.min && pct <= R.max)) return null;
  return { field: 'wz-efficiency', step: 'recap', live: true,
    message: `Rendement ${fr(pct, 1)} % : entre ${R.min} et ${nombreFr(R.max, 1)} %. Au-delà de ${nombreFr(R.max, 1)} %, aucune installation ne tire autant d’extrait du grain ; 65 à 80 % est la pratique.` };
}

/** Eau d'empâtage et de rinçage : rapport eau/grain, eau totale par litre de bière, doses de sels et d'acide, pH visé. */
export function eauIssues(recipe: Pick<Recipe, 'waterPlan' | 'totalGristKg' | 'volumeL' | 'nolo' | 'fermentables'>): IssueProcede[] {
  const plan = recipe.waterPlan;
  const out: IssueProcede[] = [];
  if (!plan) return out;
  const R = BORNES_PROCEDE.rapportEmpatage, T = BORNES_PROCEDE.eauTotaleParL;
  const grain = finite(recipe.totalGristKg) && recipe.totalGristKg > 0
    ? recipe.totalGristKg
    : (recipe.fermentables ?? []).reduce((s, f) => s + ((f.kind ?? 'grain') === 'grain' && finite(f.weightKg) && f.weightKg > 0 ? f.weightKg : 0), 0);
  // NOLO « seconds moûts » : l'eau y est une relance de drêches, sans le rapport d'un empâtage.
  const empatage = !(recipe.nolo?.enabled && recipe.nolo.process === 'secondRunnings');
  const mash = plan.mashWaterL, sparge = plan.spargeWaterL;
  // 0 L d'empâtage ET 0 L de rinçage : le plan d'eau n'est pas posé (l'inconnu n'est pas une quantité) ; c'est un manque (`procedeManques`).
  const planPose = !(finite(mash) && finite(sparge) && mash <= 0 && sparge <= 0);
  if (empatage && grain > 0 && finite(mash) && planPose) {
    const rapport = mash / grain;
    if (mash <= 0)
      out.push({ field: 'wz-mash-water', step: 'eau', live: true, message: `Eau d’empâtage 0 L pour ${fr(grain, 1)} kg de grain : sans eau, pas d’empâtage. Prévois au moins ${fr(grain * R.min, 1)} L.` });
    else if (rapport < R.min)
      out.push({ field: 'wz-mash-water', step: 'eau', live: true, message: `Eau d’empâtage ${fr(mash, 1)} L pour ${fr(grain, 1)} kg de grain, soit ${fr(rapport, 2)} L/kg : sous ${nombreFr(R.min, 1)} L/kg le grain n’est pas détrempé (il en retient ~1). Prévois au moins ${fr(grain * R.min, 1)} L.` });
    else if (rapport > R.max)
      out.push({ field: 'wz-mash-water', step: 'eau', live: true, message: `Eau d’empâtage ${fr(mash, 1)} L pour ${fr(grain, 1)} kg de grain, soit ${fr(rapport, 1)} L/kg : au-delà de ${nombreFr(R.max, 1)} L/kg ce n’est plus une maische (pratique : 2,5 à 4 L/kg). Erreur de saisie probable.` });
  }
  if (finite(mash) && finite(sparge) && finite(recipe.volumeL) && recipe.volumeL > 0) {
    const max = T.max * recipe.volumeL + 1.5 * grain;
    if (mash + sparge > max)
      out.push({ field: finite(sparge) && sparge > mash ? 'wz-sparge-water' : 'wz-mash-water', step: 'eau', live: true,
        message: `Eau totale ${fr(mash + sparge, 1)} L pour ${fr(recipe.volumeL, 1)} L de bière : au-delà de ${fr(max, 0)} L (${nombreFr(T.max, 1)} L d’eau par litre de bière), erreur de saisie probable.` });
  }
  // Sels : chaque ion apporté, dans l'eau où le sel se dissout (empâtage ou rinçage), a un plafond.
  const ceilings = BORNES_PROCEDE.ionsSels;
  const cote = (nom: 'mash' | 'sparge', litres: number, doses: Partial<Record<SaltId, number>> | undefined) => {
    if (!doses || !(litres > 0)) return;
    const apport: WaterIons = ionsFromSalts(doses, litres);
    for (const ion of ['ca', 'mg', 'na', 'so4', 'cl', 'hco3'] as const) {
      if (apport[ion] > ceilings[ion]) {
        out.push({ field: 'wz-salts', step: 'eau', live: true,
          message: `Sels de l’eau d’${nom === 'mash' ? 'empâtage' : 'rinçage'} : ${fr(apport[ion])} ppm de ${ION_NOM[ion]} apportés pour ${fr(litres, 1)} L, au-delà de ${nombreFr(ceilings[ion], 1)} ppm. C’est plus que l’eau de Burton, la plus dure de toutes : erreur de saisie probable (des grammes pour des dixièmes ?).` });
        return;
      }
    }
  };
  cote('mash', mash, plan.mash);
  cote('sparge', sparge, plan.sparge);
  const acide = plan.acid;
  if (acide && acide.id !== 'maltAcidule') {
    const A = BORNES_PROCEDE.acideMlParL;
    for (const [nom, mL, litres] of [['empâtage', acide.mash, mash], ['rinçage', acide.sparge, sparge]] as const) {
      if (finite(mL) && mL > 0 && finite(litres) && litres > 0 && mL / litres > A.max)
        out.push({ field: 'wz-acid', step: 'eau', live: true,
          message: `Acide de l’${nom} : ${fr(mL, 1)} mL pour ${fr(litres, 1)} L, soit ${fr(mL / litres, 1)} mL/L. Au-delà de ${nombreFr(A.max, 1)} mL/L, c’est plus d’acide que n’importe quelle alcalinité n’en demande (0,2 à 1 mL/L). Erreur de saisie probable.` });
    }
  }
  const ph = BORNES_PROCEDE.phEmpatage;
  if (finite(plan.targetPh) && (plan.targetPh < ph.min || plan.targetPh > ph.max))
    out.push({ field: 'wz-target-ph', step: 'eau', live: true,
      message: `pH d’empâtage visé ${fr(plan.targetPh, 2)} : entre ${fr(ph.min, 1)} et ${fr(ph.max, 1)} (fenêtre de la maische : 5,2 à 5,6).` });
  return out;
}
const ION_NOM: Record<keyof WaterIons, string> = { ca: 'calcium', mg: 'magnésium', na: 'sodium', so4: 'sulfate', cl: 'chlorure', hco3: 'bicarbonate' };

export const ADDITIF_UNITES = ['g', 'kg', 'mL', 'L', 'pastille', 'sachet', 'gousse', 'pièce'] as const;
/** Les moments où un additif entre, tels que l'app les range (le texte libre de l'import y est ramené à la lecture). */
export const ADDITIF_MOMENTS = ['Empâtage', 'Ébullition', 'Whirlpool', 'Fermenteur', 'Garde', 'Embouteillage'] as const;
const sansAccent = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
/** Ramène un moment écrit « Empattage », « fermentation », « fin d'ébullition »… à l'un des moments connus, ou `null` s'il n'en reconnaît aucun. */
export function momentAdditif(texte: string | undefined): (typeof ADDITIF_MOMENTS)[number] | null {
  const t = sansAccent(texte ?? '');
  if (!t) return null;
  if (/empat|mash/.test(t)) return 'Empâtage';
  if (/whirl|tourbillon|flame|flameout|knock/.test(t)) return 'Whirlpool';
  if (/ebull|boil|bouill/.test(t)) return 'Ébullition';
  if (/embouteill|bouteille|bottl|keg|refermentation|priming|conditionn/.test(t)) return 'Embouteillage';
  if (/garde|matur|lager|conditioning|cold/.test(t)) return 'Garde';
  if (/ferment|dry|cru/.test(t)) return 'Fermenteur';
  return null;
}
/** Unité d'additif reconnue, casse comprise (« ml » → « mL »), ou `null`. */
export function uniteAdditif(texte: string | undefined): (typeof ADDITIF_UNITES)[number] | null {
  const t = sansAccent(texte ?? '').replace(/\.$/, '');
  const table: Record<string, (typeof ADDITIF_UNITES)[number]> = {
    g: 'g', gr: 'g', gramme: 'g', grammes: 'g', kg: 'kg', kilo: 'kg', kilogramme: 'kg', kilogrammes: 'kg',
    ml: 'mL', millilitre: 'mL', millilitres: 'mL', l: 'L', litre: 'L', litres: 'L',
    pastille: 'pastille', pastilles: 'pastille', sachet: 'sachet', sachets: 'sachet', gousse: 'gousse', gousses: 'gousse', piece: 'pièce', pieces: 'pièce',
  };
  return table[t] ?? null;
}
/**
 * Additifs, épices et divers : une quantité finie, positive ou nulle. L'unité et le moment, texte libre à l'import, ne bloquent rien :
 * `normaliserAdditif` les ramène aux valeurs connues quand il les reconnaît, et les laisse tels quels sinon.
 */
export function additifsIssues(additifs: Recipe['adjuncts']): IssueProcede[] {
  const out: IssueProcede[] = [];
  (additifs ?? []).forEach((a, i) => {
    const nom = a.name?.trim() || `Additif ${i + 1}`;
    if (!finite(a.amount) || a.amount < 0)
      out.push({ field: `wz-adjunct-${i}`, step: 'recap', live: true, message: `Quantité de ${nom} : ${finite(a.amount) ? 'la valeur ne peut pas être négative' : 'renseigne une valeur'}.` });
  });
  return out;
}
/** Un additif lu d'un texte : unité et moment ramenés aux valeurs connues quand ils sont reconnus, sinon laissés tels quels. */
export function normaliserAdditif<T extends { unit: string; step: string }>(a: T): T {
  return { ...a, unit: uniteAdditif(a.unit) ?? a.unit, step: momentAdditif(a.step) ?? a.step };
}

/** Toutes les erreurs de procédé d'une recette (bloquantes à l'enregistrement, visibles dès la frappe). */
export function procedeIssues(recipe: Recipe): IssueProcede[] {
  // Une recette NOLO suit son propre modèle (extraction froide à 10 °C pendant 24 h, rendement de 25 %, volumes d'eau d'une relance) :
  // les bornes d'un empâtage, du rendement et de l'eau de brassage ne s'y appliquent pas.
  const nolo = !!recipe.nolo?.enabled;
  const out: IssueProcede[] = [
    ...(nolo ? [] : empatageIssues(recipe.mash?.steps)),
    ...fermentationIssues(recipe.fermentation),
    ...levureIssues(recipe.yeast, recipe.volumeL),
    ...(nolo ? [] : eauIssues(recipe)),
    ...additifsIssues(recipe.adjuncts),
  ];
  const r = nolo ? null : rendementIssue(recipe.efficiencyPct);
  if (r) out.push(r);
  return out;
}

/** Ce qui manque pour dire une recette « prête » à brasser : un empâtage, une fermentation, un plan d'eau. */
export function procedeManques(recipe: Recipe): Array<{ field: string; step: 'paliers' | 'eau'; message: string }> {
  const out: Array<{ field: string; step: 'paliers' | 'eau'; message: string }> = [];
  if (!(recipe.mash?.steps?.length) && !(recipe.nolo?.enabled && recipe.nolo.process === 'secondRunnings'))
    out.push({ field: 'wz-mash-list', step: 'paliers', message: 'Empâtage : ajoute au moins un palier (température et durée).' });
  if (!(recipe.fermentation?.length))
    out.push({ field: 'wz-ferment-list', step: 'paliers', message: 'Fermentation : ajoute au moins une phase (température et durée).' });
  const eauPosee = !!recipe.waterPlan && ((recipe.waterPlan.mashWaterL ?? 0) > 0 || (recipe.waterPlan.spargeWaterL ?? 0) > 0);
  if (!eauPosee && !(recipe.nolo?.enabled && recipe.nolo.process === 'secondRunnings'))
    out.push({ field: 'wz-mash-water', step: 'eau', message: 'Eau : le plan d’eau (volumes, sels, acide) n’est pas encore posé.' });
  return out;
}

const fermentationOrdre = (kind: string) => kind === 'primaire' || kind === 'ajout' ? 1 : kind === 'reposDiacetyle' ? 2 : kind === 'garde' ? 3 : 0;
/**
 * Les conseils : des valeurs possibles mais qui se contredisent ou surprennent. Jamais bloquants.
 * - Un palier d'empâtage plus froid que le précédent : une infusion ne refroidit pas.
 * - Un « mash-out » sous 70 °C : il sert à arrêter les enzymes, vers 76–78 °C.
 * - Un repos diacétyle après la garde, ou une garde avant la primaire.
 */
export function recipeAdvice(recipe: Pick<Recipe, 'mash' | 'fermentation'>): ConseilProcede[] {
  const out: ConseilProcede[] = [];
  const steps = recipe.mash?.steps ?? [];
  steps.forEach((s, i) => {
    if (!finite(s.tempC)) return;
    const avant = steps[i - 1];
    if (avant && finite(avant.tempC) && s.tempC < avant.tempC - 0.5)
      out.push({ field: `wz-mash-temp-${i}`, step: 'paliers',
        message: `Palier ${i + 1} à ${fr(s.tempC, 1)} °C après ${fr(avant.tempC, 1)} °C : une maische ne refroidit pas d’un palier à l’autre (sauf à ajouter de l’eau froide). Range les paliers du plus froid au plus chaud.` });
    if (/mash.?out/i.test(s.name ?? '') && s.tempC < 70)
      out.push({ field: `wz-mash-temp-${i}`, step: 'paliers',
        message: `« ${s.name} » à ${fr(s.tempC, 1)} °C : un mash-out arrête les enzymes, vers 76–78 °C. À cette température, c’est un palier ordinaire.` });
  });
  const phases = recipe.fermentation ?? [];
  let maxOrdre = 0;
  phases.forEach((p, i) => {
    const ordre = fermentationOrdre(p.kind);
    if (ordre && ordre < maxOrdre) {
      const verbe = p.kind === 'reposDiacetyle' ? 'Un repos diacétyle' : 'Une phase de fermentation';
      out.push({ field: `wz-ferment-temp-${i}`, step: 'paliers',
        message: `${p.name || `Phase ${i + 1}`} : ${verbe.toLowerCase()} après une garde ne sert plus à rien (il se fait à la fin de la primaire, avant le froid). Remets les phases dans l’ordre : primaire, repos diacétyle, garde.` });
    }
    maxOrdre = Math.max(maxOrdre, ordre);
  });
  return out;
}
