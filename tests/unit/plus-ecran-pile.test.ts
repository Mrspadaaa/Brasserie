import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PlusSheet } from '../../src/components/navigation/PlusSheet';
import { plusMenuFor, type EcranId } from '../../src/domain/plusEcran';
import type { TabType } from '../../src/components/BottomNav';
import type { AnySubTab } from '../../src/domain/fabActions';

/** La pile au pouce (b1s-b2) : action de l'écran contre le +, autres actions au-dessus, « Partout » en deux colonnes plus haut. */
const ECRANS: Array<[EcranId, TabType, AnySubTab]> = [
  ['bord', 'dashboard', null], ['finances', 'finances', null],
  ['brassins', 'production', 'batches'], ['recettes', 'production', 'recipes'], ['atelier', 'production', 'lab'], ['volumes', 'production', 'scaler'],
  ['stock', 'stocks', 'stock'], ['courses', 'stocks', 'courses'], ['futs', 'stocks', 'futs'], ['materiel', 'stocks', 'materiel'], ['houblons', 'stocks', 'hops'],
  ['clients', 'clients', 'crm'], ['impot', 'clients', 'ofdf'], ['tarifs', 'clients', 'tarifs']
];
const contexte = { prochainBrassin: 'LOT-004', prochainFut: 'F-007', aCommander: 2, enCuve: 2, enFermentation: { id: 'B-031', jours: 4 } };
const compagnon = { horsConnexion: true, attente: 0, occupe: false, contexte: 'écran', conversations: 0 };
const rendre = (id: EcranId, forme: 'feuille' | 'liste') => {
  const [, tab, sub] = ECRANS.find((e) => e[0] === id)!;
  const menu = plusMenuFor(tab, sub, contexte);
  const html = renderToStaticMarkup(React.createElement(PlusSheet, {
    menu, forme, compagnon, onChoisir: () => () => undefined, onCompagnon: () => undefined, onConversations: () => undefined
  }));
  return { menu, html };
};
const libellesDeLaGrille = (html: string) => {
  const grille = html.split('data-zone="partout"')[1]?.split('data-zone="partout-titre"')[0] ?? '';
  return [...grille.matchAll(/<span class="plus-pp-t">([^<]*)<\/span>/g)].map((m) => m[1]);
};

describe('La pile du + (b1s-b2 « La pile au pouce »)', () => {
  it('l’action de l’écran est la première entrée (elle s’affiche contre le +), puis ses autres actions, puis « Partout »', () => {
    const { html } = rendre('brassins', 'feuille');
    const ordre = ['Nouveau brassin', 'Saisir une densité', 'Courses', 'data-zone="ecran"', 'data-zone="partout"', 'data-zone="partout-titre"']
      .map((t) => html.indexOf(t));
    expect(ordre.every((i) => i >= 0)).toBe(true);
    expect([...ordre].sort((a, b) => a - b)).toEqual(ordre);
  });

  it('« Sur <écran> » nomme l’écran sans son chemin ; un écran qui ne crée rien le dit', () => {
    expect(rendre('recettes', 'feuille').html).toMatch(/Sur <em class="plus-ton-production">Recettes<\/em>/);
    const impot = rendre('impot', 'feuille').html;
    expect(impot).toContain('Impôt bière · rien à créer, le commun reste');
    expect(impot).not.toContain('plus-pp--pi');
    expect(impot).not.toContain('plus-pp--ps');
  });

  it('« Partout » : libellés courts au 390, pleins et lettrés au 1280, l’action montée n’est pas répétée, le Compagnon en dernier', () => {
    const court = libellesDeLaGrille(rendre('brassins', 'feuille').html);
    expect(court).toEqual(['Écriture', 'Facture', 'Vente', 'Recette', 'Compagnon']);
    const plein = rendre('brassins', 'liste').html;
    expect(libellesDeLaGrille(plein)).toEqual(['Nouvelle écriture', 'Entrer une facture', 'Encaisser une vente', 'Créer une recette', 'Compagnon']);
    expect(plein).toContain('<kbd aria-hidden="true">E</kbd>');
    expect(plein).toContain('<kbd aria-hidden="true">N</kbd>');
    expect(rendre('brassins', 'feuille').html).not.toContain('<kbd');
  });

  it('une pilule de plus que paire laisse la première seule en haut à droite ; un nombre pair, aucune', () => {
    // Brassins : 4 communs + Compagnon = 5 (impair) ; Matériel : 5 communs + Compagnon = 6 ; Bord : 4 + 1 = 5.
    expect(rendre('brassins', 'feuille').html.match(/plus-pp--seule/g)).toHaveLength(1);
    expect(rendre('finances', 'feuille').html.match(/plus-pp--seule/g)).toHaveLength(1);
    expect(rendre('materiel', 'feuille').html).not.toContain('plus-pp--seule');
  });

  it('le menu diffère d’un écran à l’autre au-delà de la première ligne (ET-PLUS)', () => {
    const signatures = ECRANS.map(([id]) => {
      const { html } = rendre(id, 'feuille');
      return [...html.matchAll(/<(?:b|span class="plus-pp-t")>([^<]*)<\/(?:b|span)>/g)].map((m) => m[1]).join('|');
    });
    expect(new Set(signatures).size).toBeGreaterThanOrEqual(11);
  });

  it('hors connexion se lit dans la pilule du Compagnon', () => {
    const { html } = rendre('bord', 'feuille');
    expect(html).toContain('title="hors connexion"');
    expect(html).toContain('Compagnon brasseur, hors connexion');
  });
});
