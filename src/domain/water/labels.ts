import { WaterIons } from '../../types';


/**
 * ⚠️ `hco3` se lit « ALCALINITÉ », pas « bicarbonate ».
 *
 * Le champ porte l'alcalinité totale exprimée en équivalent HCO₃⁻, et tous ses
 * contributeurs ne sont pas du bicarbonate : la craie compte 2 équivalents par
 * mole, et la chaux n'apporte aucun HCO₃⁻ du tout — elle apporte des OH⁻, qui
 * neutralisent l'acidité de la maische exactement pareil. Étiqueter la colonne
 * « Bicarbonate » était déjà approximatif pour la craie ; avec la chaux, ce
 * serait faux.
 */
export const ION_LABEL: Record<keyof WaterIons, string> = {
  ca: 'Calcium',
  mg: 'Magnésium',
  na: 'Sodium',
  so4: 'Sulfate',
  cl: 'Chlorure',
  hco3: 'Alcalinité'
};

/**
 * Le symbole chimique — celui qui est écrit sur le sac et sur l'analyse.
 *
 * ⚠️ Il vivait en double, dans la toile et dans le tableau de comparaison. Deux
 * listes de six chaînes qui doivent dire la même chose finissent par diverger.
 */
export const ION_SYMBOL: Record<keyof WaterIons, string> = {
  ca: 'Ca²⁺',
  mg: 'Mg²⁺',
  na: 'Na⁺',
  so4: 'SO₄²⁻',
  cl: 'Cl⁻',
  hco3: 'HCO₃⁻'
};

/**
 * Le même symbole SANS sa charge, pour les endroits où la place manque.
 *
 * ⚠️ Trouvé en testant à 320 px : dans un tiers d'écran, « SO₄²⁻ Ca²⁺ » se
 * coupait en « SO₄²⁻ C… » — on perdait le second ion du sel, c'est-à-dire la
 * moitié de l'information. Les exposants pèsent près d'un tiers de la largeur
 * et n'apprennent rien à qui lit une étiquette de sachet : « SO₄ Ca » désigne
 * exactement la même chose et tient.
 */
export const ION_SYMBOL_SHORT: Record<keyof WaterIons, string> = {
  ca: 'Ca',
  mg: 'Mg',
  na: 'Na',
  so4: 'SO₄',
  cl: 'Cl',
  hco3: 'HCO₃'
};

/**
 * Ce qu'un ion fait VRAIMENT, tout seul.
 *
 * ⚠️ CORRIGÉ. La première version collait un goût à chaque axe — « houblon »
 * sur le sulfate, « rondeur » sur le chlorure. C'est faux, et Gaëtan l'a relevé
 * tout de suite : aucun de ces deux ions ne se goûte seul. Ce qui se goûte,
 * c'est leur RAPPORT, et il a déjà son propre curseur. Écrire « houblon » sous
 * 43 ppm de sulfate laissait croire qu'en monter ferait une bière plus
 * houblonnée, alors que doubler les deux ensemble ne déplace rien du tout.
 *
 * Ce qui reste ici, ce sont les faits qui tiennent debout ion par ion : un
 * SEUIL, ou une fonction. Le calcium fait floculer et fait baisser le pH ; le
 * sodium se goûte passé 150 ppm ; le magnésium nourrit la levure et tourne amer
 * passé 30. Le sulfate et le chlorure, eux, renvoient au curseur.
 */
export const ION_ROLE: Record<keyof WaterIons, string> = {
  ca: 'levure, pH — mini 40',
  mg: 'nutriment — amer > 30',
  na: 'se goûte > 150',
  so4: 'sec — avec le Cl',
  cl: 'rond — avec le SO₄',
  hco3: 'remonte le pH'
};

/**
 * L'échelle radiale de la toile : UNE SEULE, en ppm, partagée par les six axes.
 *
 * ⚠️ TROISIÈME ET DERNIÈRE VERSION. Les deux précédentes se trompaient de
 * question :
 *
 *   1. Six maxima FIXES (400 ppm de sulfate, 300 de calcium) taillés pour les
 *      cas extrêmes : toute bière normale se recroquevillait dans le tiers
 *      central du disque.
 *   2. Un axe normalisé PAR STYLE, le maximum de chaque fourchette tombant aux
 *      70 % du rayon. La forme remplissait enfin le disque — mais les six
 *      quartiers verts devenaient identiques et occupaient chacun les
 *      deux tiers de leur secteur. Gaëtan : « les zones vertes semblent
 *      immenses ». Elles ne disaient plus rien : normalisée, une fenêtre de
 *      15 ppm de magnésium a exactement la même taille qu'une de 200 ppm de
 *      chlorure.
 *
 * Une échelle COMMUNE rend au vert son information : la fenêtre du magnésium
 * est un mince liseré près du centre, celle du chlorure une large bande. C'est
 * la vérité — ces ions ne vivent pas aux mêmes concentrations —, et c'est le
 * choix de moneaudebrassage, dont Gaëtan préfère la lecture.
 *
 * Ce qu'on fait MIEUX qu'eux : leur échelle s'arrête à 200 et tout ce qui
 * dépasse sort du cadre — leur propre capture montre une eau à 367 ppm de
 * bicarbonate dessinée hors du cercle. Ici l'échelle monte au multiple de 50
 * qui contient tout ce qu'on doit montrer. Rien ne sort jamais du disque.
 */
export function radarScaleMax(values: number[]): number {
  const plus = Math.max(0, ...values.filter((v) => Number.isFinite(v)));
  /*
   * ⚠️ PLAFONNÉE, et ce n'est pas de la coquetterie : le fuzz de saisie a fait
   * tomber l'écran sur « Invalid array length ». Taper 999999999999 dans une
   * dose de gypse donnait une concentration astronomique, donc une échelle
   * astronomique, donc une boucle d'anneaux de vingt milliards de tours.
   *
   * 2000 ppm : aucune eau de brassage n'en approche — Burton, la plus minérale
   * des eaux historiques, titre 610 ppm de sulfate. Au-delà, le plafonnement du
   * tracé et la flèche ▲ disent déjà la vérité, et le chiffre écrit au coin de
   * la toile la dit en entier.
   *
   * Plancher à 100 ppm : sous ça, les anneaux se toucheraient.
   */
  return Math.min(2000, Math.max(100, Math.ceil(plus / 50) * 50));
}

