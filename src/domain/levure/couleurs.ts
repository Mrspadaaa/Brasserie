/**
 * Couleurs des effets : la famille d'arôme de chaque descripteur, avec les 12 familles et les jetons des houblons
 * (src/domain/hopIndex/v4/families.ts, src/ui/hopIndex/familyTokens.ts : importés, jamais recopiés).
 * La voie u1 s'en sert pour les pastilles de l'étape, de Comparer et de Suggérer.
 */
import type { FamilyId } from '../hopIndex/v4/families';
import { COULEURS, COURT, type JetonFamille } from '../../ui/hopIndex/familyTokens';
import type { IdAxe } from './contrat';

export type FamilleArome = FamilyId;

/**
 * Le descripteur (en français, tel que `valeurAxe(...).mots` le rend) → sa famille d'arôme.
 * Un mot sans famille (« neutre », « fruité » seul, « sec ») n'a pas de couleur : la vue le laisse gris.
 */
const FAMILLE_DU_MOT: Array<[RegExp, FamilleArome]> = [
  [/banane|acétate d’isoamyle|chewing-gum|tropical|ananas|mangue|fruit de la passion|goyave|litchi/, 'tropical'],
  [/abricot|pêche|fruits? à noyau|prune|cerise|coco/, 'stoneFruit'],
  [/poire|pomme/, 'pomeFruit'],
  [/agrume|citron|orange|pamplemousse|lime/, 'citrus'],
  [/raisin|baie|fraise|framboise|cassis|myrtille|groseille/, 'berries'],
  [/melon/, 'melon'],
  [/floral|fleur|rose|sureau|lavande/, 'floral'],
  [/girofle|poivr|épic|phénol|vanille|cannelle|clou/, 'spice'],
  [/fum|terre|terreux/, 'earthy'],
  [/herbe|herbacé/, 'herbal'],
  [/résine|résineux|pin/, 'resin'],
  [/végétal|vert/, 'green']
];

export function familleArome(mot: string): FamilleArome | null {
  const m = mot.toLowerCase();
  for (const [re, f] of FAMILLE_DU_MOT) if (re.test(m)) return f;
  return null;
}

/** Le jeton (base, texte, fond) de la famille d'un descripteur, ou `null`. */
export function jetonArome(mot: string): JetonFamille | null {
  const f = familleArome(mot);
  return f ? COULEURS[f] : null;
}

/**
 * La famille qui porte la pastille d'un axe d'arôme, au plus près des teintes de la maquette l5b (esters orange, phénols brun,
 * thiols vert vif, terpènes vert olive). Les autres axes (corps, conduite) n'ont pas de couleur d'arôme.
 */
export const FAMILLE_DE_L_AXE: Partial<Record<IdAxe, FamilleArome>> = {
  esters: 'tropical', phenols: 'spice', thiols: 'melon', terpenes: 'green'
};

export const jetonDeAxe = (axe: IdAxe): JetonFamille | null => {
  const f = FAMILLE_DE_L_AXE[axe];
  return f ? COULEURS[f] : null;
};
export const nomFamille = (f: FamilleArome): string => COURT[f];
export { COULEURS as JETONS_FAMILLES };
export type { JetonFamille };
