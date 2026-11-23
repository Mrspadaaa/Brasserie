import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PlusSheet } from '../../src/components/navigation/PlusSheet';
import { plusMenuFor, type EcranId } from '../../src/domain/plusEcran';
import type { TabType } from '../../src/components/BottomNav';
import type { AnySubTab } from '../../src/domain/fabActions';

/** BUGS 34 (nuit du 16.11) : « Partout » changeait d'un écran à l'autre (Atelier : écriture, facture, vente, recette ; Finances : recette, brassin). Règle du pilote : le commun est toujours identique, les actions de l'écran en tête. */
const ECRANS: Array<[EcranId, TabType, AnySubTab]> = [
  ['bord', 'dashboard', null], ['finances', 'finances', null],
  ['brassins', 'production', 'batches'], ['recettes', 'production', 'recipes'], ['atelier', 'production', 'lab'], ['volumes', 'production', 'scaler'],
  ['stock', 'stocks', 'stock'], ['courses', 'stocks', 'courses'], ['futs', 'stocks', 'futs'], ['materiel', 'stocks', 'materiel'], ['houblons', 'stocks', 'hops'],
  ['clients', 'clients', 'crm'], ['impot', 'clients', 'ofdf'], ['tarifs', 'clients', 'tarifs']
];
const contexte = { prochainBrassin: 'LOT-004', prochainFut: 'F-007', aCommander: 2, enCuve: 2, enFermentation: { id: 'B-031', jours: 4 } };
const compagnon = { horsConnexion: false, attente: 0, occupe: false, contexte: 'écran', conversations: 0 };
const rendre = (tab: TabType, sub: AnySubTab, forme: 'feuille' | 'liste') => renderToStaticMarkup(React.createElement(PlusSheet, {
  menu: plusMenuFor(tab, sub, contexte), forme, compagnon, onChoisir: () => () => undefined, onCompagnon: () => undefined, onConversations: () => undefined
}));
const grille = (html: string) => html.split('data-zone="partout"')[1]?.split('data-zone="partout-titre"')[0] ?? '';
const libelles = (html: string) => [...grille(html).matchAll(/<span class="plus-pp-t">([^<]*)<\/span>/g)].map((m) => m[1]);

describe('Le + : le commun « Partout » est identique sur tous les écrans (BUGS 34)', () => {
  for (const forme of ['feuille', 'liste'] as const) {
    it(`les mêmes gestes, dans le même ordre, sur les 14 écrans (${forme})`, () => {
      const reference = libelles(rendre('dashboard', null, forme));
      expect(reference.length).toBe(6);
      expect(reference[reference.length - 1]).toBe('Compagnon');
      for (const [id, tab, sub] of ECRANS) expect(libelles(rendre(tab, sub, forme)), id).toEqual(reference);
    });
  }

  it('Atelier et Finances (le constat) montrent les cinq gestes communs et le Compagnon', () => {
    for (const [tab, sub] of [['production', 'lab'], ['finances', null]] as Array<[TabType, AnySubTab]>) {
      expect(libelles(rendre(tab, sub, 'feuille'))).toEqual(['Écriture', 'Facture', 'Vente', 'Recette', 'Brassin', 'Compagnon']);
    }
  });

  it('un geste déjà monté « Sur cet écran » reste en « Partout », marqué d’un renvoi ↑', () => {
    const html = rendre('production', 'lab', 'feuille');
    expect(grille(html)).toMatch(/plus-pp--renvoi[^>]*>(?:(?!<\/button>).)*Brassin/);
    // Le renvoi n’existe que pour les gestes montés : Écriture n’en porte pas sur Atelier.
    expect(grille(html)).not.toMatch(/plus-pp--renvoi[^>]*>(?:(?!<\/button>).)*Écriture/);
  });

  it('les actions de l’écran restent en tête, avant « Partout »', () => {
    const html = rendre('finances', null, 'feuille');
    expect(html.indexOf('Nouvelle écriture')).toBeGreaterThanOrEqual(0);
    expect(html.indexOf('data-zone="ecran"')).toBeLessThan(html.indexOf('data-zone="partout"'));
    expect(html.indexOf('Estimer un brassin')).toBeLessThan(html.indexOf('data-zone="ecran"'));
  });
});
