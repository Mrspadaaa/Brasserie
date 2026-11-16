import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PlusSheet } from '../../src/components/navigation/PlusSheet';
import { plusMenuFor } from '../../src/domain/plusEcran';
import type { TabType } from '../../src/components/BottomNav';
import type { AnySubTab } from '../../src/domain/fabActions';

/** Jeu en ligne du 16.11 : « Nouvelle écriture » sur un écran, « Écriture » sur un autre (libellé plein au 1280, court au 390).
 *  Règle du pilote : un seul libellé par action commune, partout, aux deux largeurs. */
const ECRANS: Array<[TabType, AnySubTab]> = [
  ['dashboard', null], ['finances', null], ['production', 'batches'], ['production', 'recipes'], ['production', 'lab'], ['production', 'scaler'],
  ['stocks', 'stock'], ['stocks', 'courses'], ['stocks', 'futs'], ['stocks', 'materiel'], ['stocks', 'hops'],
  ['clients', 'crm'], ['clients', 'ofdf'], ['clients', 'tarifs']
];
const contexte = { prochainBrassin: 'LOT-004', prochainFut: 'F-007', aCommander: 2, enCuve: 2, enFermentation: { id: 'B-031', jours: 4 } };
const compagnon = { horsConnexion: false, attente: 0, occupe: false, contexte: 'écran', conversations: 0 };
const libelles = (tab: TabType, sub: AnySubTab, forme: 'feuille' | 'liste') => {
  const html = renderToStaticMarkup(React.createElement(PlusSheet, {
    menu: plusMenuFor(tab, sub, contexte), forme, compagnon, onChoisir: () => () => undefined, onCompagnon: () => undefined, onConversations: () => undefined
  }));
  const grille = html.split('data-zone="partout"')[1]?.split('data-zone="partout-titre"')[0] ?? '';
  return [...grille.matchAll(/<span class="plus-pp-t">([^<]*)<\/span>/g)].map((m) => m[1]);
};

describe('Le + : un seul libellé par action commune, partout', () => {
  it('« Partout » dit les mêmes mots au téléphone et à l’ordinateur, sur les 14 écrans', () => {
    const attendu = ['Écriture', 'Facture', 'Vente', 'Recette', 'Brassin', 'Compagnon'];
    for (const [tab, sub] of ECRANS) {
      for (const forme of ['feuille', 'liste'] as const) expect(libelles(tab, sub, forme), `${tab}/${sub}/${forme}`).toEqual(attendu);
    }
  });
});
