import type { Bilan } from '../reglages/regles';
import { MOIS_LONGS, titre, type Periode } from '../periode/periode';

/**
 * Les états écrits à droite des lignes de la page « Plus » (m3 : « ✓ Drive · IA Rapide », « ⚠ IBAN à corriger »,
 * « 23 en novembre »). Fonctions pures : l'état vient de l'app (Drive, niveau d'IA, bilan des Réglages, journal),
 * jamais d'un exemple ; ce que l'app ne sait pas ne s'écrit pas.
 */

export interface EtatLigne {
  texte: string;
  /** `ok` : voyant vert (✓) ; `alerte` : à corriger ou à renouveler (⚠) ; `neutre` : une information sans alarme. */
  niveau: 'ok' | 'alerte' | 'neutre';
}

/** Connexions cloud et IA : Drive d'abord (c'est lui qui peut manquer), puis le niveau d'IA par défaut quand tout va bien. */
export function etatConnexions(driveEtat: 'connecte' | 'a-renouveler' | 'a-connecter', niveauIa: 'fast' | 'max' | string): EtatLigne {
  if (driveEtat === 'a-renouveler') return { texte: 'Drive à renouveler', niveau: 'alerte' };
  if (driveEtat === 'a-connecter') return { texte: 'Drive à connecter', niveau: 'alerte' };
  return { texte: `Drive · IA ${niveauIa === 'max' ? 'Max' : 'Rapide'}`, niveau: 'ok' };
}

/**
 * Réglages : une erreur d'abord (« IBAN à corriger » quand c'est la seule, « 2 erreurs » sinon), puis les trous
 * (« 3 à saisir »), sinon « réglé ». Sans bilan, rien.
 */
export function etatReglages(bilan: Bilan | undefined): EtatLigne | null {
  if (!bilan) return null;
  const ko = bilan.points.filter(p => p.etat === 'ko');
  const to = bilan.points.filter(p => p.etat === 'to');
  if (ko.length === 1) return { texte: `${ko[0].libelle} à corriger`, niveau: 'alerte' };
  if (ko.length > 1) return { texte: `${ko.length} erreurs`, niveau: 'alerte' };
  if (to.length === 1) return { texte: `${to[0].libelle} à saisir`, niveau: 'neutre' };
  if (to.length > 1) return { texte: `${to.length} à saisir`, niveau: 'neutre' };
  return { texte: 'réglé', niveau: 'ok' };
}

/** Ce que dit le journal de la période : « en novembre » (m3), « en octobre 2025 » hors de l'année courante, ou le titre de la période. */
export function suffixeJournal(p: Periode, maintenant = new Date()): string {
  switch (p.genre) {
    case 'mois': return `en ${MOIS_LONGS[p.mois - 1].toLowerCase()}${p.annee === maintenant.getFullYear() ? '' : ` ${p.annee}`}`;
    case 'tout': return 'depuis le début';
    case 'annee': return `en ${p.annee}`;
    case 'trimestre': return `au ${titre(p).toLowerCase()}`;
    case 'dates': return titre(p).toLowerCase();
  }
}
