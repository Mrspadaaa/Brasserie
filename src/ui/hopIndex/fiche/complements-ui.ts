// d3b-affichage (#180) : les compléments des 18 sources (complements.json, voie d3a) côté écran. Un seul chargement à la demande,
// lancé à l'ouverture de Comparer et de la fiche ; les valeurs lues par compose(), huile() et la feuille Sources viennent de
// `complementsCharges()` (domaine). Ici : le lancement, l'attente qui ne fait rien sauter (on ne rend rien d'incomplet avant
// l'arrivée, au plus `attenteMax` ms), les noms courts des sources et le texte d'une valeur. Hors ligne ou en échec :
// le catalogue seul, sans erreur.
import { useEffect, useState, useSyncExternalStore } from 'react';
import { chargerComplements, complementsCharges, type Complements, type ValeurSource } from '../../../domain/hopIndex/v4/complements';

type Etat = 'attente' | 'pret' | 'echec';
let etat: Etat = complementsCharges() ? 'pret' : 'attente';
let enCours = false;
const ecouteurs = new Set<() => void>();
const emettre = () => ecouteurs.forEach((f) => f());
const abonner = (f: () => void) => { ecouteurs.add(f); return () => { ecouteurs.delete(f); }; };

/** Lance le chargement (une seule fois) ; sans effet s'il est fait ou en cours. Rend la promesse, jamais rejetée. */
export function lancerComplements(): void {
  if (etat === 'pret' || enCours) return;
  enCours = true;
  chargerComplements().then(
    () => { etat = 'pret'; enCours = false; emettre(); },
    () => { etat = 'echec'; enCours = false; emettre(); },
  );
}

/** `attente` : les compléments n'ont pas fini d'arriver et le délai n'est pas écoulé (ne rien afficher d'incomplet) ;
 * `c` : les compléments quand ils sont là, sinon null (catalogue seul). Un nouveau rendu quand ils arrivent. */
export function useComplements(attenteMax = 800): { attente: boolean; c: Complements | null } {
  lancerComplements();
  const e = useSyncExternalStore(abonner, () => etat, () => etat);
  const [delai, setDelai] = useState(false);
  useEffect(() => {
    if (e !== 'attente') return;
    const t = window.setTimeout(() => setDelai(true), attenteMax);
    return () => window.clearTimeout(t);
  }, [e, attenteMax]);
  return { attente: e === 'attente' && !delai, c: e === 'pret' ? complementsCharges() : null };
}

/** Pour les tests : remet l'état de chargement à ce que dit le domaine. */
export function __reinitialiserComplementsUi(): void {
  etat = complementsCharges() ? 'pret' : 'attente'; enCours = false;
}

/** Référence courte (celle des rangées de Comparer), nom court et titre complet de chaque source des compléments. */
export const SOURCES_COMPLEMENTS: Record<string, { ref: string; court: string; titre: string }> = {
  barthhaas: { ref: 'BH', court: 'BarthHaas', titre: 'BarthHaas, fiches variétales' },
  brewersfriend: { ref: 'BF', court: 'Brewer’s Friend', titre: 'Brewer’s Friend, index des houblons' },
  britishhops: { ref: 'BHA', court: 'British Hop Association', titre: 'British Hop Association, fiches variétales' },
  bsg: { ref: 'BSG', court: 'BSG', titre: 'BSG / RahrBSG Hops, fiches produits' },
  charlesfaram: { ref: 'CF', court: 'Charles Faram', titre: 'Charles Faram, Hop Oracle' },
  crosbyhops: { ref: 'CRO', court: 'Crosby Hops', titre: 'Crosby Hops, fiches produits et variétés' },
  hopdatabase: { ref: 'HD', court: 'HopDatabase', titre: 'HopDatabase (kasperg3), agrégat de fournisseurs' },
  hopsdirect: { ref: 'HDI', court: 'Hops Direct', titre: 'Hops Direct, fiches produits' },
  hopsjson: { ref: 'HJ', court: 'hops-json', titre: 'hops-json (stuartraetaylor)' },
  hopslist: { ref: 'HL', court: 'Hopslist', titre: 'Hopslist, annuaire de variétés' },
  hopsteiner: { ref: 'HS', court: 'Hopsteiner', titre: 'Hopsteiner, fiches variétales' },
  hpa: { ref: 'HPA', court: 'HPA', titre: 'Hop Products Australia, fiches variétales' },
  indiehops: { ref: 'IH', court: 'Indie Hops', titre: 'Indie Hops, fiches variétales' },
  johnihaas: { ref: 'JH', court: 'John I. Haas', titre: 'John I. Haas, spécifications' },
  nzhops: { ref: 'NZH', court: 'NZ Hops', titre: 'NZ Hops Ltd, fiches variétales' },
  usahops: { ref: 'USA', court: 'USA Hops', titre: 'USA Hops / Hop Growers of America' },
  usda: { ref: 'USDA', court: 'USDA', titre: 'USDA ARS, collection mondiale de houblons (Corvallis)' },
  yakimavalleyhops: { ref: 'YVH', court: 'Yakima Valley Hops', titre: 'Yakima Valley Hops, fiches produits' },
};
/** Nom court d'une référence (« BH » → « BarthHaas »), ou null si ce n'est pas une source des compléments ; le titre complet est `titre`. */
export const titreComplement = (ref: string): string | null => {
  for (const s of Object.values(SOURCES_COMPLEMENTS)) if (s.ref === ref) return s.court;
  return null;
};
export const refDe = (v: ValeurSource): string => SOURCES_COMPLEMENTS[v.source.id]?.ref ?? v.source.id;
export const nomCourt = (v: ValeurSource): string => SOURCES_COMPLEMENTS[v.source.id]?.court ?? v.source.nom;

const fr = (x: number) => String(Math.round(x * 100) / 100).replace('.', ',');
/** « 10–14,5 », « 12 », « jusqu’à 2 » (borne basse inconnue), « plus de 10 » (borne haute inconnue) ; jamais 0 pour un inconnu. */
export function texteBornes(min: number | null, max: number | null): string {
  if (min != null && max != null) return min === max ? fr(min) : `${fr(min)}–${fr(max)}`;
  if (max != null) return `jusqu’à ${fr(max)}`;
  if (min != null) return `plus de ${fr(min)}`;
  return '?';
}
/** L'unité d'un champ, avec sa base quand c'est un pourcentage (« % de l'huile », « mL/100 g », « note 0-5 »). */
export function texteUnite(champ: { unite: string | null; base: string }): string {
  if (champ.unite === '%') return champ.base;
  if (champ.unite) return champ.unite;
  return /sans unité/.test(champ.base) ? '' : champ.base;
}
