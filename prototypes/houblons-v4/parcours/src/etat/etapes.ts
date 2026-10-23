// L'état du parcours à chaque étape : le brouillon qu'une route d'outil suppose, et l'état de départ d'une page
// <route>/etat.html (la page démarre dans l'état du parcours à cette étape, au moment de la carte).
import type { Route } from '../coquille/routes';
import { cleDe } from '../coquille/routes';
import { CONDITIONS, H } from '../donnees/cas';
import { ajouter, placer } from './operations';
import { etatInitial } from './reducteur';
import type { AjoutParcours, Brouillon, EtatParcours, RecetteParcours } from './types';

/** Les trois houblons de « Comparer les 3 » au moment de la carte. */
export const COMPARER_CARTE = [H.cascade, H.idaho7, H.galaxy];

/** Ajout neuf posé par « Placer <houblon> » : 4 g/L, dry hop en fermentation active, 3 j (carte : « actif · 3 j »). */
export function ajoutPlace(recette: RecetteParcours, id: string, hopKey: string): AjoutParcours {
  return placer({ id, hopKey, grams: CONDITIONS.doseGL * recette.volumeL, moment: 'dryActive' }, { type: 'dryhop', phase: 'actif', jours: CONDITIONS.jours }, recette);
}
/** Houblon d'un identifiant d'ajout neuf (« idaho-7-1 » → beermaverick-idaho-7). */
export const houblonDeAjout = (id: string) => cleDe(id.replace(/-\d+$/, '').replace(/-cryo$/, ':cryo'));

/** Le brouillon que suppose une route : 'garder' s'il convient déjà, null si la route n'en veut pas. */
export function brouillonPour(route: Route, etat: EtatParcours): Brouillon | null | 'garder' {
  const b = etat.brouillon;
  if (route.ecran === 'dryhopper' || route.ecran === 'levure') {
    if (b && b.outil !== 'substituer' && b.ajoutId === route.ajout) return 'garder';
    const existant = etat.recette.additions.find((a) => a.id === route.ajout);
    const recette = existant ? { ...etat.recette } : ajouter(etat.recette, ajoutPlace(etat.recette, route.ajout, houblonDeAjout(route.ajout)));
    return { outil: 'dryhopper', ajoutId: route.ajout, recette };
  }
  if (route.ecran === 'substituer') {
    if (b && b.outil === 'substituer' && b.remplace?.hopKey === route.houblon) return 'garder';
    const a = etat.recette.additions.find((x) => x.hopKey === route.houblon);
    return a ? { outil: 'substituer', ajoutId: a.id, recette: { ...etat.recette }, remplace: { ajoutId: a.id, hopKey: a.hopKey } } : null;
  }
  return null;
}

/** État de départ d'une page ouverte sur une route. */
export function etatDeDepart(route: Route): EtatParcours {
  const e = etatInitial();
  const b = brouillonPour(route, e);
  return b && b !== 'garder' ? { ...e, brouillon: b } : e;
}

/** Route de départ de chaque page <route>/etat.html. */
export function routeDePage(page: string): Route {
  switch (page) {
    case 'fiche': return { ecran: 'fiche', houblon: H.nugget };
    case 'suggerer': return { ecran: 'suggerer' };
    case 'comparer': return { ecran: 'comparer', houblons: COMPARER_CARTE };
    case 'dryhopper': return { ecran: 'dryhopper', ajout: 'idaho-7-1' };
    case 'levure': return { ecran: 'levure', ajout: 'idaho-7-1' };
    case 'substituer': return { ecran: 'substituer', houblon: H.nugget };
    default: return { ecran: 'ma-biere' };
  }
}
