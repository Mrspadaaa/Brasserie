// @vitest-environment jsdom
// Lot 3 du Carnet (LISTE.md du 23.11) : L-20 (retirer un critère), L-21 (la rubrique Notes ne disparaît pas sous les yeux), L-22 (menu ⋯).
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CarnetOuvert, colonnesCarnet, type CarnetOuvertProps } from '../../src/ui/carnets/CarnetOuvert';
import { AIDES_ETEINTES, type CarnetV, type ContenuCarnetV } from '../../src/ui/carnets/EtatIA';

afterEach(cleanup);

const contenu = (x: Partial<ContenuCarnetV> = {}): ContenuCarnetV => ({ creeLe: '2026-11-20', phrase: 'chambre froide', criteres: [], facons: [], articles: [], notes: [], photos: [], ...x });
const carnet = (x: Partial<ContenuCarnetV> = {}, status: CarnetV['status'] = 'research'): CarnetV => ({ id: 'CARNET-1', title: 'Chambre froide', status, carnet: contenu(x) });
const props = (c: CarnetV, x: Partial<CarnetOuvertProps> = {}): CarnetOuvertProps => ({
  carnet: c, aides: AIDES_ETEINTES, liens: [], tableau: null, onRetour: vi.fn(), onRenommer: vi.fn(), onSupprimer: vi.fn(), onNote: vi.fn(),
  onOuvrirArticle: vi.fn(), onComparer: vi.fn(), ...x
});

const CRIT = [
  { id: 'CRIT-1', texte: '2,6 m³', origine: 'phrase' as const, caracteristique: { nom: 'volume', unite: 'm³', sens: 'plus' as const } },
  { id: 'CRIT-2', texte: 'porte à droite', origine: 'ia' as const }
];

describe('L-20 : un geste retire un critère', () => {
  it('⋯ de la ligne Critère montre chaque critère avec « Retirer », qui appelle onRetirerCritere avec son id', () => {
    const onRetirerCritere = vi.fn();
    render(<CarnetOuvert {...props(carnet({ criteres: CRIT as never }), { onRetirerCritere })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Critères, actions' }));
    const liste = screen.getByRole('list', { name: 'Critères' });
    expect(within(liste).getAllByRole('listitem')).toHaveLength(2);
    fireEvent.click(within(liste).getByRole('button', { name: 'Retirer le critère « porte à droite »' }));
    expect(onRetirerCritere).toHaveBeenCalledWith('CRIT-2');
  });

  it('sans onRetirerCritere, aucun ⋯ sur la ligne Critère (rien qui ne fait rien)', () => {
    render(<CarnetOuvert {...props(carnet({ criteres: CRIT as never }))} />);
    expect(screen.queryByRole('button', { name: 'Critères, actions' })).toBeNull();
  });
});

describe('L-21 : la mise en page ne change pas sous les yeux après le rangement', () => {
  it('la note rangée ailleurs (en critère) : la rubrique Notes reste, « aucune »', () => {
    const note = { id: 'NOTE-1', texte: 'prévoir 2 buses de rinçage', genre: 'note' as const, le: '2026-11-23' };
    const { rerender } = render(<CarnetOuvert {...props(carnet({ notes: [note] }))} />);
    expect(screen.getByRole('log', { name: 'Fil du carnet' })).toBeTruthy(); // D451 disparaît n° 4 : « Notes n » en cartes devient le fil
    const crit = { id: 'CRIT-9', texte: '2 buses de rinçage', origine: 'ia' as const };
    rerender(<CarnetOuvert {...props(carnet({ criteres: [crit] as never }), { rangee: { cible: 'critere', id: 'CRIT-9', phrase: 'prévoir 2 buses de rinçage', onAnnuler: vi.fn() } })} />);
    const notes = screen.getByRole('region', { name: 'Fil' }); // D451 disparaît n° 4 : la région « Notes » devient « Fil »
    expect(notes.textContent).toMatch(/aucune/);
  });

  it('un carnet ouvert sans note n’affiche pas de rubrique Notes vide', () => {
    render(<CarnetOuvert {...props(carnet({ criteres: CRIT as never }))} />);
    expect(screen.queryByRole('region', { name: 'Fil' })).toBeNull(); // D451 disparaît n° 4 : « Notes » devient « Fil »
  });
});

describe('L-19 : les colonnes du tableau du carnet', () => {
  const ligne = (id: string, cellules: Record<string, unknown>, prixCentimes?: number) => ({ articleId: id, nom: id, rang: 1, cellules, ...(prixCentimes ? { prixCentimes, devise: 'CHF' } : {}) });
  const tab = (colonnes: unknown[], lignes: unknown[]) => ({ colonnes, lignes, rangePar: null, aRelire: [] }) as never;

  it('une valeur en mots (« avec groupe frigorifique ») n’est pas une colonne ; une mesure l’est', () => {
    const t = tab(
      [{ nom: 'Exécution', sens: 'info' }, { nom: 'Volume', unite: 'm³', sens: 'info' }],
      [ligne('a', { Exécution: { valeur: 'avec groupe frigorifique', origine: 'page' }, Volume: { valeur: 4.06, unite: 'm³', origine: 'page' } }, 276365)]
    );
    expect(colonnesCarnet(t).map(c => c.cle)).toEqual(['Volume', '__prix']);
  });

  it('une colonne en CHF à côté du prix ne redit pas « CHF » (une seule colonne de monnaie)', () => {
    const t = tab(
      [{ nom: 'Budget', unite: 'CHF', sens: 'moins', critereId: 'CRIT-1' }],
      [ligne('a', {}, 249560), ligne('b', { Budget: { valeur: 3000, unite: 'CHF', origine: 'phrase' } }, 276365)]
    );
    expect(colonnesCarnet(t).map(c => c.cle)).toEqual(['__prix']);
  });

  it('prix en euros et en francs : l’en-tête dit CHF (pas « EUR » au-dessus de 3 350 CHF)', () => {
    const t = tab([], [{ ...ligne('a', {}, 251300), devise: 'EUR' }, ligne('b', {}, 335000)]);
    expect(colonnesCarnet(t).find(c => c.cle === '__prix')?.unite).toBe('CHF');
  });
});

describe('L-22 : le menu ⋯ dit le même mot dans chaque état', () => {
  for (const status of ['idea', 'research', 'validated'] as const) {
    it(`${status} : « Supprimer le carnet »`, () => {
      render(<CarnetOuvert {...props(carnet({}, status))} />);
      fireEvent.click(screen.getByRole('button', { name: 'Plus' }));
      expect(screen.getByRole('menuitem', { name: 'Supprimer le carnet' })).toBeTruthy();
    });
  }
});
