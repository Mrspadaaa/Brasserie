/**
 * D437 : le domaine qu'un carnet sans domaine posé ni catégorie du Planning tire de ses mots (titre, puis phrase), comme sa vignette
 * (pictos.tsx). Une aide d'affichage, jamais une réponse de l'IA (B6 : aucun gabarit par objet dans src/domain/carnets).
 */
import { plier, type DomaineCarnet } from '../../domain/carnets/domaines';

const mots = (t: string): string[] => plier(t).split(/[^a-z0-9]+/).filter(Boolean);

/* « x* » : tout mot qui commence par x ; sinon le mot, ou son pluriel en s / x. Ordre : le premier domaine qui trouve gagne
   (« Armoire de rangement malte » est un meuble, « Évier pour les fûts » est au local). */
const MOTS: [DomaineCarnet, string[]][] = [
  ['papiers', ['dossier', 'autorisation*', 'assurance*', 'conformite*', 'administrati*', 'permis', 'saav', 'contrat', 'licence*', 'patente', 'douane*']],
  ['meuble', ['armoire', 'etagere', 'rangement', 'meuble', 'table', 'chaise', 'tabouret', 'comptoir', 'rayonnage', 'etabli', 'vestiaire', 'casier']],
  ['outils', ['outil', 'perceuse*', 'visseuse*', 'tournevis', 'scie', 'meuleuse*', 'pince', 'cle', 'marteau', 'niveau', 'echelle', 'escabeau', 'aspirateur*', 'nettoyeur*', 'karcher']],
  ['local', ['local', 'sol', 'mur', 'plafond', 'toit', 'evier', 'lavabo', 'robinet*', 'plomberie', 'tuyau', 'evacuation', 'electri*', 'prise', 'hotte', 'ventilation', 'ventilateur', 'extincteur', 'securite', 'porte', 'fenetre', 'peinture', 'beton', 'carrelage', 'chauffage', 'eclairage', 'lampe', 'isolation', 'douche*', 'wc', 'climatisation']],
  ['brasserie', ['brasserie', 'brassage', 'frigo', 'froid', 'froide', 'congel*', 'cuve', 'fermenteur', 'fermentation', 'moulin', 'concasseur', 'pompe', 'embouteill*', 'bouteille', 'soutireuse', 'isobarique', 'capsuleuse', 'etiqueteuse', 'fut', 'futs', 'keg', 'chaudiere', 'refroidisseur', 'echangeur', 'filtre', 'malt', 'houblon', 'levure', 'densimetre', 'refractometre', 'canette*', 'sertisseuse']]
];

const trouve = (liste: string[], ms: string[]) => liste.some(k => (k.endsWith('*') ? ms.some(m => m.startsWith(k.slice(0, -1))) : ms.some(m => m === k || m === `${k}s` || m === `${k}x`)));

/** Le domaine que disent les mots d'un texte ; `null` si aucun. */
export function domaineParMots(texte: string): DomaineCarnet | null {
  const ms = mots(texte);
  for (const [d, liste] of MOTS) if (trouve(liste, ms)) return d;
  return null;
}

