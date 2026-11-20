// @vitest-environment jsdom
// Règle L9, problèmes 8 et 9 de la critique du port : un geste n'a qu'un Annuler, et il défait tout le geste (stock ET fût).
// 8 : « Tout marquer propre » affichait deux Annuler (la bande du tableau et le bandeau du bas) qui défaisaient des choses différentes.
// 9 : Annuler du bandeau, après « Marquer propre » sur la fiche, rendait le stock mais laissait le fût propre.
import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { KegItem } from '../../src/types';
import { KegBoard } from '../../src/ui/KegBoard';
import { BandeauEffets } from '../../src/ui/BandeauEffets';
import { EffetsGeste } from '../../src/services/effetsGeste';
import { effacerBandeau } from '../../src/ui/suppression/bandeau';

const banc = vi.hoisted(() => ({ stock: 2, mouvements: [] as { gesteId: string; libelle: string; geste: string; objet: string }[], ecrireFut: (_k: unknown) => {} }));

vi.mock('../../src/services/storage', async () => {
  const { EffetsGeste } = await import('../../src/services/effetsGeste');
  const { gesteIdDe } = await import('../../src/domain/consommation/gestes');
  return {
    StorageService: {
      updateKeg: (k: unknown) => banc.ecrireFut(k),
      getStocks: () => ({ rawMaterials: [], cleaning: [] }),
      getMouvementsGestes: () => banc.mouvements,
      /** Un décompte simulé : PBW 2 kg → 1,95 kg par geste, annoncé au bandeau comme le fait le vrai stockage. */
      enregistrerGeste: (geste: { type: string; objet: string; cycle: string | number; libelle: string }) => {
        const gesteId = gesteIdDe(geste);
        banc.stock = 1.95;
        banc.mouvements.push({ gesteId, libelle: geste.libelle, geste: geste.type, objet: geste.objet });
        EffetsGeste.annoncer({ geste: geste as never, gesteId, effets: [{ regleId: 'r1', stockItemRef: 'PBW', nom: 'PBW', unite: 'kg', avant: 2, apres: 1.95, repere: 2 }], manquantes: [], alertes: [] });
        return { gesteId, mouvements: [], effets: [], manquantes: [], alertes: [] };
      },
      annulerGeste: () => { banc.stock = 2; banc.mouvements = []; return { success: true, message: 'Annulé : le stock est rendu.' }; }
    }
  };
});

const H = (date: string, quoi: 'lave' | 'retour-vide') => ({ date, quoi });
const PARC: KegItem[] = [
  { id: 'ZZ-F7', capacityL: 30, state: 'lavage', historique: [H('13.11.2026', 'retour-vide')] },
  { id: 'ZZ-F8', capacityL: 30, state: 'lavage', historique: [H('13.11.2026', 'retour-vide')] },
  { id: 'ZZ-F9', capacityL: 20, state: 'propre', historique: [H('12.11.2026', 'lave')] }
];

/** Parc en mémoire : les écritures reviennent comme nouveau parc, comme le fait le stockage en direct. */
const Parc: React.FC = () => {
  const [parc, setParc] = useState(PARC);
  banc.ecrireFut = (k) => setParc(p => p.map(x => (x.id === (k as KegItem).id ? (k as KegItem) : x)));
  return <VirtuosoMockContext.Provider value={{ viewportHeight: 1400, itemHeight: 60 }}>
    <KegBoard kegs={parc} batches={[]} today="20.11.2026" onAddKegs={vi.fn()} />
    <BandeauEffets />
  </VirtuosoMockContext.Provider>;
};
const annuler = () => screen.queryAllByRole('button', { name: /^Annuler/ }).filter(b => b.closest('[data-bandeau-effets], .keg-bandeau'));
const etatDe = (id: string) => screen.getByRole('button', { name: `Ouvrir le fût ${id}` }).textContent;

beforeEach(() => { banc.stock = 2; banc.mouvements = []; });
afterEach(() => { act(() => { EffetsGeste.fermer(); effacerBandeau(); }); cleanup(); });

describe('L9 — un seul Annuler pour un geste, qui défait tout le geste', () => {
  it('8 : « Tout marquer propre » n’affiche qu’un Annuler, celui du bandeau du bas', () => {
    render(<Parc />);
    fireEvent.click(screen.getByRole('button', { name: 'Tout marquer propre' }));
    fireEvent.click(screen.getByRole('button', { name: 'Marquer propres' }));
    expect(document.querySelector('[data-bandeau-effets]')).not.toBeNull();
    expect(screen.getByText('2 fûts marqués propres')).toBeVisible();
    expect(annuler()).toHaveLength(1);
    expect(annuler()[0].closest('[data-bandeau-effets]')).not.toBeNull();
  });

  it('8 : cet unique Annuler rend le stock ET remet les fûts à laver', () => {
    render(<Parc />);
    fireEvent.click(screen.getByRole('button', { name: 'Tout marquer propre' }));
    fireEvent.click(screen.getByRole('button', { name: 'Marquer propres' }));
    expect(banc.stock).toBe(1.95);
    fireEvent.click(annuler()[0]);
    expect(banc.stock).toBe(2);
    expect(screen.queryByText('2 fûts marqués propres')).toBeNull();
    expect(screen.queryByRole('button', { name: /^Annuler/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'À laver 2' })).toBeVisible();
  });

  it('9 : Annuler après « Marquer propre » sur la fiche rend le stock ET remet le fût à laver', () => {
    render(<Parc />);
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le fût ZZ-F7' }));
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Fût ZZ-F7' })).getByRole('button', { name: 'Marquer propre' }));
    expect(banc.stock).toBe(1.95);
    expect(screen.getByRole('button', { name: 'Propres 2' })).toBeVisible();
    fireEvent.click(annuler()[0]);
    expect(banc.stock).toBe(2);
    expect(screen.getByRole('button', { name: 'À laver 2' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Propre 1' })).toBeVisible();
    expect(document.querySelector('[data-bandeau-effets]')?.textContent).toMatch(/stock est rendu.*fût.*à laver/);
  });

  it('critique 2, bloquant : le lot annulé par le bandeau, puis OK — la bande « fûts marqués propres · Annuler » ne revient pas', () => {
    render(<Parc />);
    fireEvent.click(screen.getByRole('button', { name: 'Tout marquer propre' }));
    fireEvent.click(screen.getByRole('button', { name: 'Marquer propres' }));
    fireEvent.click(annuler()[0]);
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(screen.queryByText('2 fûts marqués propres')).toBeNull();
    expect(screen.queryByRole('button', { name: /^Annuler/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'À laver 2' })).toBeVisible();
  });

  it('un fût touché depuis le geste : refus entier, rien n’est rendu (ni stock, ni fût)', () => {
    render(<Parc />);
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le fût ZZ-F7' }));
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Fût ZZ-F7' })).getByRole('button', { name: 'Marquer propre' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le fût ZZ-F7' }));
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Fût ZZ-F7' })).getByRole('button', { name: 'Remettre à laver' }));
    fireEvent.click(annuler()[0]);
    expect(banc.stock).toBe(1.95);
    expect(document.querySelector('[data-bandeau-effets]')?.textContent).toMatch(/impossible/);
  });
});
