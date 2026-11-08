// Les bornes métier d'une recette : une seule table, lue par la validation (`recipeValidation.ts`), les calculs (`hopBitterness.ts`,
// `brewingMath.efficiencyAtGravity`) et les écrans (étape Malts/sucres, champ α des houblons). À côté de la table famille × moment
// (`fermentables/moments.ts`). Audit métier du 08.11 : AM 3, AM 9, MV-44 à MV-47 (10 000 kg ou 50 kg de Pale Ale dans 20 L : OG 116,808 ;
// α 100 % : 469 IBU ; 99 999 g de Nugget : 112 477 IBU).
//
// Hors bornes : une saisie à confirmer (α : un extrait existe) ou une erreur claire. Jamais un calcul silencieux : l'IBU attend, la recette
// ne s'enregistre pas, l'écran le dit. Chaque borne cite sa source, ou se dit « estimée » avec son calcul.

export interface Borne { max: number; unite: string; source: string }

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
  return `${frBorne(totalG)} g de houblon pour ${frBorne(volumeL)} L, soit ${frBorne(parL)} g/L : au-delà de ${BORNES.houblonGParL.max} g/L, erreur de saisie probable (des kg tapés en g ?).`;
}

export const ogHorsBornes = (og: number | null | undefined): boolean => typeof og === 'number' && Number.isFinite(og) && og > BORNES.og.max;
