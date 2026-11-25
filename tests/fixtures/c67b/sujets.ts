/**
 * Voie c67b-tests (25.11), R67 : des carnets de SUJETS neufs (jamais le sol de l'exemple) et, pour chacun, un mémo : un fait accompli, pas une idée.
 * Le mémo parle du MÊME sujet que le carnet (la pompe, la levure, la sonde) sans en recopier le titre ; il est long, comme une vraie note tapée.
 * Données de test (« ZZ TEST — »), aucune donnée réelle.
 */
export interface SujetMemo { sujet: string; carnetId: string; titre: string; phrase: string; notes: string[]; memo: string }

export const SUJETS_MEMO: SujetMemo[] = [
  {
    sujet: 'pompe', carnetId: 'ZZ-C67B-POMPE', titre: 'Pompe de transfert du moût', phrase: 'La pompe de transfert du moût',
    notes: ['Le joint de la pompe est à changer avant le prochain brassage'],
    memo: 'ZZ TEST — c67b mémo : la pompe a très bien tenu pendant tout le transfert de jeudi, le joint neuf est parfait et le débit est bon'
  },
  {
    sujet: 'levure', carnetId: 'ZZ-C67B-LEVURE', titre: 'Levure — stockage et repiquage', phrase: 'Stocker et repiquer la levure',
    notes: ['Repiquer la levure au plus tard trois semaines après la première culture'],
    memo: 'ZZ TEST — c67b mémo : la levure repiquée une troisième fois est bien repartie en quelques heures, la fermentation a démarré normalement ce matin'
  },
  {
    sujet: 'sonde', carnetId: 'ZZ-C67B-SONDE', titre: 'Sonde de température de la cave', phrase: 'La sonde de température de la cave',
    notes: ['La sonde de la cave affiche deux degrés de trop'],
    memo: 'ZZ TEST — c67b mémo : la sonde a été recalibrée hier avec le thermomètre de référence, elle affiche maintenant la bonne valeur, c’est réglé'
  }
];

/** Un carnet « idée » ancien, au format des documents du magasin (type, titre, carnet) : un seul sujet, une note. */
export function itemSujet(s: SujetMemo): Record<string, unknown> {
  const creeLe = '2026-10-20T12:00:00.000Z';
  return {
    id: s.carnetId, type: 'carnet', title: `ZZ TEST — ${s.titre}`, status: 'idea',
    carnet: {
      version: 1, creeLe, phrase: s.phrase, criteres: [], articles: [], facons: [], photos: [],
      notes: s.notes.map((texte, i) => ({ id: `${s.carnetId}-N${i + 1}`, texte, genre: 'note', modifieeLe: creeLe })),
      genre: { valeur: 'idee', origine: 'ia' }, domaine: { valeur: 'brasserie', origine: 'ia' }
    }
  };
}
