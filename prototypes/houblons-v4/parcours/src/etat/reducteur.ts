// Réducteur de l'état du parcours : un seul état de recette pour tous les écrans. Un outil travaille sur un
// brouillon ; « inscrire » le pose dans la recette, « abandonner » le jette (la recette reste intacte).
import { recetteDegustee } from '../donnees/cas';
import { ajouter, changerDose, changerMoment, choisirLevure, remplacer, retirer } from './operations';
import type { Action, EtatParcours, RecetteParcours } from './types';

export const etatInitial = (): EtatParcours => ({ recette: recetteDegustee(), brouillon: null, gestes: 0 });

function appliquer(r: RecetteParcours, a: Action): RecetteParcours {
  switch (a.type) {
    case 'ajouter': return ajouter(r, a.ajout);
    case 'moment': return changerMoment(r, a.ajoutId, a.quand);
    case 'dose': return changerDose(r, a.ajoutId, a.grams);
    case 'retirer': return retirer(r, a.ajoutId);
    case 'remplacer': return remplacer(r, a.ajoutId, a.hopKey);
    case 'levure': return choisirLevure(r, a.yeastId);
    default: return r;
  }
}

export function reducteur(etat: EtatParcours, a: Action): EtatParcours {
  const geste = (e: Omit<EtatParcours, 'gestes'>): EtatParcours => ({ ...e, gestes: etat.gestes + 1 });
  switch (a.type) {
    case 'ajouter': case 'moment': case 'dose': case 'retirer': case 'remplacer': case 'levure':
      if (a.sur === 'brouillon') {
        if (!etat.brouillon) return etat;
        return geste({ ...etat, brouillon: { ...etat.brouillon, recette: appliquer(etat.brouillon.recette, a) } });
      }
      return geste({ ...etat, recette: appliquer(etat.recette, a) });
    case 'brouillon/ouvrir': return geste({ ...etat, brouillon: a.brouillon });
    case 'brouillon/inscrire': return etat.brouillon ? geste({ recette: etat.brouillon.recette, brouillon: null }) : etat;
    case 'brouillon/abandonner': return etat.brouillon ? geste({ ...etat, brouillon: null }) : etat;
    case 'recommencer': return { ...etatInitial(), gestes: etat.gestes + 1 };
    case 'etat/poser': return a.etat;
  }
}
