import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { IdeesBieres, IdeesPrix } from '../../src/ui/atelier/LigneOuverte';
import { AVerifier } from '../../src/ui/atelier/TarifsFrise';
import type { VenteAuLitre } from '../../src/domain/tarifs/ventesAuLitre';
import type { CreativeItem } from '../../src/types';

afterEach(cleanup);

/* ───── Constat 31 : une idée de tarif archivée se supprime, la question sur place, comme les idées de bière ───── */

const tarif = (id: string, title: string, extra: object = {}): CreativeItem => ({ id, type: 'pricing-test', title, status: 'idea', targetPrice: 6, format: 'verre', ...extra } as CreativeItem);
function PrixVivants({ depart, onSupprimer }: { depart: CreativeItem[]; onSupprimer?: (i: CreativeItem) => void }) {
  const [l, setL] = React.useState<CreativeItem[]>(depart);
  return <IdeesPrix idees={l} ajout={false} onAjout={vi.fn()} onCreer={vi.fn()}
    onSupprimer={(i) => { onSupprimer?.(i); setL((x) => x.filter((y) => y.id !== i.id)); }}
    onMaj={(i) => setL((x) => x.map((y) => (y.id === i.id ? i : y)))} />;
}
const archivee = () => tarif('p', 'Verre 3 dl pour ZZ TEST client', { contactName: 'ZZ TEST client', archivedAt: '2026-11-16T10:00:00Z' });

describe('constat 31 · Archives de Mes idées de tarif', () => {
  it('T31-1 · « Supprimer » est visible sur la ligne archivée, sans l’ouvrir, avec la question sur place (« Garder » focalisé, « Oui, supprimer »), jamais confirm()', () => {
    const confirm = vi.spyOn(window, 'confirm');
    const sup = vi.fn();
    render(<PrixVivants depart={[archivee(), tarif('q', 'Fût 20 L')]} onSupprimer={sup} />);
    fireEvent.click(screen.getByRole('button', { name: /Archivées 1/ }));
    const decl = screen.getByRole('button', { name: /Supprimer « Verre 3 dl pour ZZ TEST client »/ });
    expect(decl).toBeVisible();
    fireEvent.click(decl);
    const q = screen.getByRole('alertdialog');
    expect(q).toHaveTextContent('Verre 3 dl pour ZZ TEST client');
    expect(within(q).getByRole('button', { name: 'Garder' })).toHaveFocus();
    fireEvent.click(within(q).getByRole('button', { name: 'Garder' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(sup).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Supprimer « Verre 3 dl pour ZZ TEST client »/ }));
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Oui, supprimer' }));
    expect(sup).toHaveBeenCalledWith(expect.objectContaining({ id: 'p' }));
    expect(confirm).not.toHaveBeenCalled();
    expect(screen.queryByText('Verre 3 dl pour ZZ TEST client')).not.toBeInTheDocument();
  });

  it('T31-2 · le toast « Idée archivée » disparaît avec l’idée supprimée', () => {
    render(<PrixVivants depart={[tarif('p', 'Fût 20 L', { format: 'fut', targetPrice: 140 })]} />);
    fireEvent.click(screen.getByRole('button', { name: /Fût 20 L/ }));
    fireEvent.click(screen.getByRole('button', { name: /Archiver « Fût 20 L »/ }));
    expect(screen.getByText('Idée archivée')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Archivées/ }));
    fireEvent.click(screen.getByRole('button', { name: /Supprimer « Fût 20 L »/ }));
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Oui, supprimer' }));
    expect(screen.queryByText('Idée archivée')).not.toBeInTheDocument();
  });

  it('T31-3 · la même question pour une idée de bière archivée (ligne ouverte) : « Oui, supprimer », « Garder » focalisé', () => {
    const sup = vi.fn();
    const b = { id: 'a', type: 'recipe-idea', title: 'Bière d’Hiver', status: 'idea', archivedAt: '2026-11-16T10:00:00Z' } as CreativeItem;
    render(<IdeesBieres idees={[b, { ...b, id: 'b', title: 'Pils', archivedAt: undefined } as CreativeItem]} recettes={[]} ajout={false} onAjout={vi.fn()} onCreer={vi.fn()} onMaj={vi.fn()} onPasser={vi.fn(() => 'R')} onSupprimer={sup} />);
    fireEvent.click(screen.getByRole('button', { name: /Archivées 1/ }));
    fireEvent.click(screen.getByRole('button', { name: /Bière d’Hiver/ }));
    fireEvent.click(screen.getByRole('button', { name: /Supprimer « Bière d’Hiver »/ }));
    const q = screen.getByRole('alertdialog');
    expect(within(q).getByRole('button', { name: 'Garder' })).toHaveFocus();
    fireEvent.click(within(q).getByRole('button', { name: 'Oui, supprimer' }));
    expect(sup).toHaveBeenCalledWith(b);
  });
});

/* ───── Constat 12 : l'entrée « à vérifier » dit pourquoi et ouvre la vente ───── */

const vente = (extra: Partial<VenteAuLitre> = {}): VenteAuLitre => ({
  cle: 'k', qui: 'ZZ Bar du Test', genre: 'pro', biere: 'Blonde', formatId: '75cl', litresUnite: 0.75, prix: 569.5, litre: 759.33,
  quantite: 10, montantLigne: 5695, date: '10.11.2026', transactionId: 'T3', demo: false, ...extra
});

describe('constat 12 · à vérifier', () => {
  it('V12-1 · une ligne dit pourquoi (« 10 × 75 cl à 5 695,00 : 569,50 la bouteille ») et porte « Ouvrir la vente »', () => {
    const ouvrir = vi.fn();
    render(<AVerifier ventes={[vente()]} onOuvrir={ouvrir} />);
    const g = screen.getByRole('group', { name: 'Prix à vérifier' });
    expect(g.textContent!.replace(/\s/g, ' ')).toContain('10 × 75 cl à 5 695,00 : 569,50 la bouteille');
    const b = within(g).getByRole('button', { name: /Ouvrir la vente/ });
    expect(b).toBeVisible();
    fireEvent.click(b);
    expect(ouvrir).toHaveBeenCalledWith(expect.objectContaining({ transactionId: 'T3' }));
  });
});
