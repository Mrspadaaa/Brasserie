import { WaterIons } from '../../types';
import { alkalinityAsCaCO3, ZERO, round1 } from './ions';

// --- Lire un profil d'eau écrit en toutes lettres -----------------------------

/**
 * Les noms sous lesquels un ion se présente dans une recette.
 *
 * ⚠️ L'ordre compte : les libellés LONGS d'abord. « calcium » avant « ca »,
 * sans quoi « calcium 110 » se ferait manger par le motif court et laisserait
 * « lcium 110 » derrière lui. Et le symbole court exige une frontière de mot
 * des deux côtés — sinon le « Ca » de « CaCl₂ » passerait pour du calcium.
 */
export const ION_PATTERNS: Array<[ion: keyof WaterIons, motif: RegExp]> = [
  ['ca', /\b(?:calcium|ca)\s*(?:2\+|²⁺|\+\+)?\s*(?:ions?)?\s*[:=]?\s*/i],
  ['mg', /\b(?:magn[ée]sium|magnesium|mg)\s*(?:2\+|²⁺|\+\+)?\s*(?:ions?)?\s*[:=]?\s*/i],
  ['na', /\b(?:sodium|na)\s*(?:\+|⁺)?\s*(?:ions?)?\s*[:=]?\s*/i],
  ['so4', /\b(?:sulfates?|sulphates?|so\s?4|so₄)\s*(?:2-|²⁻|--)?\s*[:=]?\s*/i],
  ['cl', /\b(?:chlorures?|chlorides?|cl)\s*(?:-|⁻)?\s*[:=]?\s*/i],
  [
    'hco3',
    // « TAC » (titre alcalimétrique complet, analyses suisses et françaises),
    // « Karbonathärte » / « KH » (analyses allemandes) désignent la même chose.
    /\b(?:bicarbonates?|hydrog[ée]nocarbonates?|hco\s?3|hco₃|alcalinit[ée]|alkalinity|carbonates?|tac|karbonath[äa]rte|kh)\s*(?:-|⁻)?\s*[:=]?\s*/i
  ]
];

export interface ParsedWaterTarget {
  ions: WaterIons;
  /** Les ions réellement TROUVÉS dans le texte. Les autres restent à zéro. */
  found: Array<keyof WaterIons>;
  /** L'alcalinité était-elle donnée en CaCO₃ plutôt qu'en HCO₃ ? */
  alkalinityAsCaCO3: boolean;
  /**
   * L'unité dans laquelle l'alcalinité était écrite.
   *
   * ⚠️ Les analyses suisses donnent le TAC en °fH, les allemandes en °dH.
   * 1 °fH = 10 mg/L de CaCO₃ = 12.2 ppm de HCO₃⁻ ; 1 °dH = 17.85 mg/L de
   * CaCO₃ = 21.8 ppm. Lire « 20.5 °fH » comme 20.5 ppm divisait l'alcalinité
   * de Fribourg par douze.
   */
  alkalinityUnit: 'hco3' | 'caco3' | 'fH' | 'dH';
}

/**
 * Lit un profil d'eau collé depuis une recette.
 *
 * ⚠️ Volontairement LOCAL et déterministe. Une recette qui donne son eau
 * l'écrit presque toujours de la même façon — « Ca 110 · Mg 5 · Na 12 · SO4 200
 * · Cl 55 · HCO3 0 » —, et faire un aller-retour réseau pour ça serait plus
 * lent, hors-ligne impossible, et exposerait à une valeur inventée là où il n'y
 * a rien à inventer. L'IA reste le RECOURS quand ce lecteur ne trouve rien.
 *
 * ⚠️ Deux pièges que le motif naïf ne voit pas :
 *
 * 1. **« mg/L » n'est pas du magnésium.** C'est l'unité, et elle suit chaque
 *    valeur. Un motif « mg » suivi d'un nombre attrapait donc le chiffre du
 *    VOISIN de gauche.
 * 2. **L'alcalinité s'écrit souvent en CaCO₃.** « Alkalinity 50 as CaCO3 » vaut
 *    61 ppm de bicarbonate, pas 50. Confondre les deux fausse la cible d'un
 *    cinquième et, en cascade, la dose d'acide.
 */
export function parseWaterTarget(text: string): ParsedWaterTarget {
  const ions: WaterIons = { ...ZERO };
  const found: Array<keyof WaterIons> = [];
  // « mg/L », « mg/l », « mg / L » : l'unité, jamais l'ion.
  const propre = (text || '').replace(/\bmg\s*\/\s*(?:l|kg)\b/gi, ' ');

  const enCaCO3 =
    /(?:alcalinit|alkalinity|carbonate)[^\n;]{0,40}?(?:ca\s?co\s?3|caco₃|as\s+caco)/i.test(propre);
  // « TAC 20.5 °fH », « alcalinité 20,5 °f », « Karbonathärte 11.5 °dH ».
  // ⚠️ Pas « [^.] » comme borne de recherche : « 20.5 » contient un point.
  const enFH = /(?:alcalinit|alkalinity|carbonat|\btac\b|\bkh\b)[^\n;]{0,40}?°\s?f(?:h\b|\b)/i.test(propre);
  const enDH = /(?:alcalinit|alkalinity|carbonat|karbonat|\btac\b|\bkh\b)[^\n;]{0,40}?°\s?dh\b/i.test(propre);

  ION_PATTERNS.forEach(([ion, motif]) => {
    const re = new RegExp(motif.source + '(-?\\d+(?:[.,]\\d+)?)', 'i');
    const m = propre.match(re);
    if (!m) return;
    const v = parseFloat(m[1].replace(',', '.'));
    if (!Number.isFinite(v)) return;
    ions[ion] = Math.max(0, v);
    found.push(ion);
  });

  /*
   * L'alcalinité exprimée en CaCO₃ se convertit en bicarbonate : c'est l'unité
   * dans laquelle vit tout le reste de ce fichier.
   */
  let alkalinityUnit: ParsedWaterTarget['alkalinityUnit'] = 'hco3';
  if (found.includes('hco3')) {
    if (enFH) {
      alkalinityUnit = 'fH';
      ions.hco3 = round1(ions.hco3 * 12.2);
    } else if (enDH) {
      alkalinityUnit = 'dH';
      ions.hco3 = round1(ions.hco3 * 21.8);
    } else if (enCaCO3) {
      alkalinityUnit = 'caco3';
      ions.hco3 = round1((ions.hco3 * 61) / 50);
    }
  }

  return { ions, found, alkalinityAsCaCO3: alkalinityUnit !== 'hco3', alkalinityUnit };
}

