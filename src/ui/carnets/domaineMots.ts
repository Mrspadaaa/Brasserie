/**
 * D437 : le domaine qu'un texte (titre, phrase) dit par ses mots, et (C67-2, R57) la partie de la Brasserie. Une règle de SENS, pas une table d'exemples :
 * chaque famille de mots dit ce dont on parle (le bâtiment, le matériel qui fait la bière, un meuble, un outil, des papiers), et le domaine est celui dont le
 * texte parle le plus. Une aide d'affichage et de repli sans IA (vignette, filtre, rangement local), jamais une réponse du vrai modèle (B6 : aucun gabarit par
 * objet dans src/domain/carnets). L'IA simulée (`iaSimulee.ts`, exemptée de B6) la lit aussi : une seule règle, jamais deux qui divergent.
 */
import { plier, type DomaineCarnet } from '../../domain/carnets/domaines';

const mots = (t: string): string[] => plier(t).split(/[^a-z0-9]+/).filter(Boolean);

/* « x* » : tout mot qui commence par x ; sinon le mot, ou son pluriel en s / x. */
const trouve = (k: string, ms: string[]): boolean => (k.endsWith('*') ? ms.some(m => m.startsWith(k.slice(0, -1))) : ms.some(m => m === k || m === `${k}s` || m === `${k}x`));
const combien = (liste: readonly string[], ms: string[]): number => liste.filter(k => trouve(k, ms)).length;

/** Ce qui ne se confond pas avec la brasserie : le premier de ces trois domaines qui trouve un mot gagne (« Armoire de rangement malte » est un meuble). */
const NETS: [DomaineCarnet, string[]][] = [
  ['papiers', ['dossier', 'autorisation*', 'assurance*', 'conformite*', 'administrati*', 'permis', 'saav', 'contrat', 'licence*', 'patente', 'douane*']],
  ['meuble', ['armoire', 'etagere', 'rangement', 'meuble', 'table', 'chaise', 'tabouret', 'comptoir', 'rayonnage', 'etabli', 'vestiaire', 'casier']],
  ['outils', ['outil', 'perceuse*', 'visseuse*', 'tournevis', 'scie', 'meuleuse*', 'pince', 'cle', 'marteau', 'niveau', 'echelle', 'escabeau', 'aspirateur*', 'nettoyeur*', 'karcher']]
];

/** Le bâtiment. */
const LOCAL = ['local', 'sol', 'mur', 'plafond', 'toit', 'evier', 'lavabo', 'robinet*', 'plomberie', 'tuyau', 'evacuation', 'electri*', 'prise', 'hotte', 'ventilation', 'ventilateur',
  'extincteur', 'securite', 'porte', 'fenetre', 'peinture', 'beton', 'carrelage', 'chauffage', 'eclairage', 'lampe', 'isolation', 'douche*', 'wc', 'climatisation'];

/** Ce qui fait la bière : le matériel, et les gestes du jour de brassage (une hotte qui ne tire plus pendant l'ébullition est un souci de brassage). */
const BRASSERIE = ['brass*', 'ebullition', 'empatage', 'mout', 'whirlpool', 'frigo', 'froid', 'froide', 'congel*', 'cuve', 'fermenteur', 'fermentation', 'moulin', 'concasseur', 'pompe',
  'embouteill*', 'bouteille', 'soutireuse', 'isobarique', 'capsuleuse', 'etiqueteuse', 'fut', 'futs', 'keg', 'chaudiere', 'refroidisseur', 'echangeur', 'filtre', 'malt', 'houblon', 'levure',
  'densimetre', 'refractometre', 'canette*', 'sertisseuse'];

/** Le domaine que disent les mots d'un texte ; `null` si aucun. Entre le bâtiment et la brasserie, celui qui compte le plus de mots ; à égalité, le bâtiment. */
export function domaineParMots(texte: string): DomaineCarnet | null {
  const ms = mots(texte);
  for (const [d, liste] of NETS) if (combien(liste, ms)) return d;
  const local = combien(LOCAL, ms), brasserie = combien(BRASSERIE, ms);
  if (!local && !brasserie) return null;
  return brasserie > local ? 'brasserie' : local ? 'local' : 'brasserie';
}

/** Les parties du matériel de la brasserie (premier niveau du chemin) ; à égalité, la première de la liste. */
const PARTIES: [string, string[]][] = [
  ['Brassage', ['brass*', 'ebullition', 'empatage', 'mout', 'whirlpool', 'cuve', 'malt', 'houblon', 'moulin', 'concasseur', 'pompe', 'chaudiere', 'refroidisseur', 'echangeur', 'filtre']],
  ['Fermentation', ['fermenteur', 'fermentation', 'levure', 'frigo', 'froid', 'froide', 'congel*', 'densimetre', 'refractometre']],
  ['Conditionnement', ['embouteill*', 'bouteille', 'soutireuse', 'isobarique', 'capsuleuse', 'etiqueteuse', 'fut', 'futs', 'keg', 'canette*', 'sertisseuse']]
];

/** La partie de la brasserie dont parle un texte (« Brassage », « Fermentation », « Conditionnement ») ; `null` si aucun mot ne la dit. */
export function sousDomaineParMots(texte: string): string | null {
  const ms = mots(texte);
  let meilleur: string | null = null, n = 0;
  for (const [partie, liste] of PARTIES) { const c = combien(liste, ms); if (c > n) { n = c; meilleur = partie; } }
  return meilleur;
}
