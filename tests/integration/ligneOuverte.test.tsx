import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { IdeesBieres, IdeesPrix } from '../../src/ui/atelier/LigneOuverte';
import type { CreativeItem } from '../../src/types';

afterEach(cleanup);
const biere = (id: string, title: string, extra: object = {}): CreativeItem => ({ id, type: 'recipe-idea', title, status: 'idea', ...extra } as CreativeItem);

describe('kb3 · Bières : la ligne s’ouvre sur place', () => {
  const props = () => ({ ajout: false, onAjout: vi.fn(), onCreer: vi.fn(), onMaj: vi.fn(), onPasser: vi.fn(() => "REC-T"), onSupprimer: vi.fn() });
  it('compte À essayer et En recette, ouvre une ligne sans fenêtre, voisines visibles ; « Passer » appelle le geste de l’app', () => {
    const p = props();
    const idees = [biere('a', 'NEIPA Motueka'), biere('b', 'Pils d’été'), biere('c', 'Brune d’hiver')];
    render(<IdeesBieres idees={idees} recettes={[{ id: 'R1', name: 'Brune d’hiver' }]} {...p} />);
    expect(screen.getByRole('button', { name: /À essayer 2/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /En recette 1/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /NEIPA Motueka/ }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Pils d’été')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ambrée' }));
    expect(p.onMaj).toHaveBeenCalledWith(expect.objectContaining({ id: 'a', couleur: 'ambre' }));
    fireEvent.click(screen.getByRole('button', { name: 'Passer dans mes recettes' }));
    expect(p.onPasser).toHaveBeenCalledWith(idees[0]);
    fireEvent.click(screen.getByRole('button', { name: /En recette 1/ }));
    fireEvent.click(screen.getByRole('button', { name: /Brune d’hiver/ }));
    expect(screen.getAllByRole('status').map((e) => e.textContent).join(' ')).toContain('Brouillon créé dans Recettes');
    expect(screen.getAllByRole('status').map((e) => e.textContent).join(' ')).toContain('En recette');
    expect(screen.queryByRole('button', { name: 'Ouvrir la recette' })).not.toBeInTheDocument();
  });
  it('vide : la première ligne s’écrit sur place ; « Garder l’idée » n’écrit qu’avec un titre', () => {
    const p = props();
    render(<IdeesBieres idees={[]} recettes={[]} {...p} />);
    expect(screen.getByText(/Aucune idée de bière encore/)).toBeInTheDocument();
    const garder = screen.getByRole('button', { name: 'Garder l’idée' });
    expect(garder).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Une idée de bière'), { target: { value: 'Stout au café' } });
    fireEvent.click(screen.getByRole('button', { name: 'Stout' }));
    fireEvent.click(garder);
    expect(p.onCreer).toHaveBeenCalledWith(expect.objectContaining({ type: 'recipe-idea', title: 'Stout au café', style: 'Stout', status: 'idea' }));
  });
});

describe('kb3 · Tarifs : l’idée de prix s’ouvre sur place', () => {
  const idee: CreativeItem = { id: 'p', type: 'pricing-test', title: 'Fût 20 L pour Bistrot Démo', status: 'idea', targetPrice: 140, contactName: 'Bistrot Démo', format: 'fut' } as CreativeItem;
  it('prix − / + au pas du format, « soit 7,00 le litre », coût « à poser » tant qu’il est inconnu', () => {
    const onMaj = vi.fn();
    render(<IdeesPrix idees={[idee, { ...idee, id: 'q', title: 'Bouteille 33 cl', targetPrice: undefined, format: '33cl' } as CreativeItem]} ajout={false} onAjout={vi.fn()} onCreer={vi.fn()} onMaj={onMaj} onSupprimer={vi.fn()} />);
    expect(screen.getByText('à estimer')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Fût 20 L pour Bistrot Démo/ }));
    expect(screen.getByRole('status')).toHaveTextContent('soit 7,00 le litre · pas de 5');
    expect(screen.getByLabelText('Coût en CHF')).toHaveAttribute('placeholder', 'à poser');
    expect(screen.getByText('· marge sans chiffre')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Plus 5,00' }));
    expect(onMaj).toHaveBeenCalledWith(expect.objectContaining({ id: 'p', targetPrice: 145 }));
    const fmt = screen.getByRole('group', { name: 'Format' });
    expect(within(fmt).getByRole('button', { name: 'Fût' })).toHaveAttribute('aria-pressed', 'true');
  });
  it('vide : la première idée de prix s’écrit sur place', () => {
    const onCreer = vi.fn();
    render(<IdeesPrix idees={[]} ajout={false} onAjout={vi.fn()} onCreer={onCreer} onMaj={vi.fn()} onSupprimer={vi.fn()} />);
    expect(screen.getByText(/Aucune idée de prix encore/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Garder l’idée' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Growler' }));
    fireEvent.change(screen.getByLabelText('Prix visé en CHF HT'), { target: { value: '18' } });
    fireEvent.blur(screen.getByLabelText('Prix visé en CHF HT'));
    fireEvent.click(screen.getByRole('button', { name: 'Garder l’idée' }));
    expect(onCreer).toHaveBeenCalledWith(expect.objectContaining({ type: 'pricing-test', format: 'growler', targetPrice: 18 }));
  });
});

describe('kb3 · passe 4 (critique de la passe 3)', () => {
  const props = () => ({ ajout: false, onAjout: vi.fn(), onCreer: vi.fn(), onMaj: vi.fn(), onPasser: vi.fn(() => 'REC-T'), onSupprimer: vi.fn() });
  it('N1 · « Ouvrir » du toast appelle la fonction COURANTE, pas celle d’avant la création de la recette', () => {
    const p = props();
    const avant = vi.fn(), apres = vi.fn();
    const idees = [biere('a', 'ZZ TEST Brune')];
    const { rerender } = render(<IdeesBieres idees={idees} recettes={[]} {...p} onOuvrirRecette={avant} />);
    fireEvent.click(screen.getByRole('button', { name: /ZZ TEST Brune/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Passer dans mes recettes' }));
    // l'app a rafraîchi ses recettes : une nouvelle fonction est passée avant le toucher sur « Ouvrir »
    rerender(<IdeesBieres idees={idees} recettes={[]} {...p} onOuvrirRecette={apres} />);
    fireEvent.click(within(document.querySelector('.lo-toast') as HTMLElement).getByRole('button', { name: 'Ouvrir' }));
    expect(avant).not.toHaveBeenCalled();
    expect(apres).toHaveBeenCalledWith('REC-T');
  });
  it('N2 · supprimer une idée archivée : la question remplace la rangée, « Supprimer » et « Garder » sont là, « Remettre » a disparu', () => {
    const p = props();
    const archivee = biere('a', 'Bière d’Hiver', { archivedAt: '2026-11-16T10:00:00Z' });
    render(<IdeesBieres idees={[archivee, biere('b', 'Pils')]} recettes={[]} {...p} />);
    fireEvent.click(screen.getByRole('button', { name: /Archivées 1/ }));
    fireEvent.click(screen.getByRole('button', { name: /Bière d’Hiver/ }));
    fireEvent.click(screen.getByRole('button', { name: /Supprimer « Bière d’Hiver »/ }));
    const q = screen.getByRole('alertdialog');
    expect(within(q).getByRole('button', { name: 'Oui, supprimer' })).toBeVisible();
    expect(within(q).getByRole('button', { name: 'Garder' })).toBeVisible();
    expect(screen.queryByRole('button', { name: /Remettre dans mes idées/ })).not.toBeInTheDocument();
    fireEvent.click(within(q).getByRole('button', { name: 'Garder' }));
    expect(screen.getByRole('button', { name: /Remettre dans mes idées/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Supprimer « Bière d’Hiver »/ }));
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Oui, supprimer' }));
    expect(p.onSupprimer).toHaveBeenCalledWith(archivee);
  });
  it('N3 · Tarifs : la liste n’a pas son propre « Noter » (celui de la frise suffit)', () => {
    const idee = { id: 'p', type: 'pricing-test', title: 'Fût 20 L', status: 'idea', targetPrice: 140, format: 'fut' } as CreativeItem;
    render(<IdeesPrix idees={[idee]} ajout={false} onAjout={vi.fn()} onCreer={vi.fn()} onMaj={vi.fn()} onSupprimer={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /Noter/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Mes idées de tarif/)).toBeInTheDocument();
  });
  it('N4 · « + » sur un prix vide ne pose jamais 1,00 : il part du prix déjà noté pour ce format, sinon il écrit rien et donne le champ', () => {
    const onMaj = vi.fn();
    const vide = { id: 'CR-3', type: 'pricing-test', title: 'Carton 12 × 33 cl', status: 'idea', format: 'carton' } as CreativeItem;
    const { unmount } = render(<IdeesPrix idees={[vide]} ajout={false} onAjout={vi.fn()} onCreer={vi.fn()} onMaj={onMaj} onSupprimer={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Carton 12 × 33 cl/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Plus 1,00' }));
    expect(onMaj).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Prix visé en CHF HT')).toHaveFocus();
    unmount();
    const noté = { id: 'CR-2', type: 'pricing-test', title: 'Carton 12 × 33 cl pour Bistrot', status: 'idea', format: 'carton', targetPrice: 36 } as CreativeItem;
    render(<IdeesPrix idees={[noté, vide]} ajout={false} onAjout={vi.fn()} onCreer={vi.fn()} onMaj={onMaj} onSupprimer={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Carton 12 × 33 cl.*à estimer/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Plus 1,00' }));
    expect(onMaj).toHaveBeenCalledWith(expect.objectContaining({ id: 'CR-3', targetPrice: 37 }));
  });
  it('N8 · une idée écrite au nom d’une recette existante bascule sur « En recette » et reste visible', () => {
    const p = { ...props(), ajout: true };
    render(<IdeesBieres idees={[biere('z', 'Autre idée')]} recettes={[{ id: 'R9', name: 'Pale Ale de septembre' }]} {...p} />);
    fireEvent.change(screen.getByLabelText('Une idée de bière'), { target: { value: 'Pale Ale de septembre' } });
    fireEvent.click(screen.getByRole('button', { name: 'Garder l’idée' }));
    expect(p.onCreer).toHaveBeenCalledWith(expect.objectContaining({ title: 'Pale Ale de septembre' }));
    expect(screen.getByRole('button', { name: /En recette/ })).toHaveAttribute('aria-pressed', 'true');
  });
});

// Retouches finales (critique de kb3, n° 2) : le toast « Idée archivée · Annuler » ne survit pas à la suppression de l'idée.
function BieresVivantes() {
  const [l, setL] = React.useState<CreativeItem[]>([biere('a', 'ZZ TEST Brune')]);
  return <IdeesBieres idees={l} recettes={[]} ajout={false} onAjout={vi.fn()} onCreer={vi.fn()} onPasser={vi.fn(() => 'R')} onSupprimer={(i) => setL((x) => x.filter((y) => y.id !== i.id))}
    onMaj={(i) => setL((x) => x.map((y) => (y.id === i.id ? i : y)))} />;
}
function PrixVivants() {
  const [l, setL] = React.useState<CreativeItem[]>([{ id: 'p', type: 'pricing-test', title: 'Fût 20 L', status: 'idea', targetPrice: 140, format: 'fut' } as CreativeItem]);
  return <IdeesPrix idees={l} ajout={false} onAjout={vi.fn()} onCreer={vi.fn()} onSupprimer={(i) => setL((x) => x.filter((y) => y.id !== i.id))}
    onMaj={(i) => setL((x) => x.map((y) => (y.id === i.id ? i : y)))} />;
}
describe('kb3 · retouches finales : toast périmé', () => {
  afterEach(() => cleanup());
  it('R2 · bière : après « Supprimer » confirmé, le toast « Idée archivée · Annuler » a disparu', () => {
    render(<BieresVivantes />);
    fireEvent.click(screen.getByRole('button', { name: /ZZ TEST Brune/ }));
    fireEvent.click(screen.getByRole('button', { name: /Archiver « ZZ TEST Brune »/ }));
    expect(screen.getByText('Idée archivée')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Archivées/ }));
    fireEvent.click(screen.getByRole('button', { name: /ZZ TEST Brune/ }));
    fireEvent.click(screen.getByRole('button', { name: /Supprimer « ZZ TEST Brune »/ }));
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Oui, supprimer' }));
    expect(screen.queryByText('Idée archivée')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Annuler' })).not.toBeInTheDocument();
  });
  it('R2 · prix : idem pour une idée de prix', () => {
    render(<PrixVivants />);
    fireEvent.click(screen.getByRole('button', { name: /Fût 20 L/ }));
    fireEvent.click(screen.getByRole('button', { name: /Archiver « Fût 20 L »/ }));
    expect(screen.getByText('Idée archivée')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Archivées/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Fût 20 L/ }));
    fireEvent.click(screen.getByRole('button', { name: /Supprimer « Fût 20 L »/ }));
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Oui, supprimer' }));
    expect(screen.queryByText('Idée archivée')).not.toBeInTheDocument();
  });
});
