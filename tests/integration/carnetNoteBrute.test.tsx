import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CreativeItem } from '../../src/types';

// Jeu en ligne 16.11 après-midi : une note de moins de 3 mots restait en carte « ta note » avec « Retirer » pour seule action,
// et le type « Tarif » restait offert dans la feuille d'édition d'une note. Gemini n'est jamais appelé : AiClient est simulé.
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
import { NoteCarnet } from '../../src/ui/atelier/NoteCarnet';
import { CreativeItemSheet, typesFeuille } from '../../src/ui/CreativeItemSheet';

afterEach(() => cleanup());

function Carnet({ onEdit }: { onEdit: (i: CreativeItem) => void }) {
  const [items, setItems] = useState<CreativeItem[]>([]);
  return <NoteCarnet items={items} filtre="tout" onFiltre={() => {}} vues={{ bieres: null, contacts: null, afaire: null }} assistant={null} mode="production"
    tarifs={[]} bieres={[]} onAjouter={(i) => setItems((l) => [...l, i])} onMaj={(i) => setItems((l) => l.map((x) => (x.id === i.id ? i : x)))}
    onRetirer={(id) => setItems((l) => l.filter((x) => x.id !== id))} onEdit={onEdit} onConvert={() => false} />;
}

describe('Carnet : une note brute s’ouvre', () => {
  it('une note de 2 mots s’ouvre dans sa feuille (pas seulement « Retirer »)', () => {
    const onEdit = vi.fn();
    render(<Carnet onEdit={onEdit} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Noter' }), { target: { value: 'ZZ TEST' } });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la note' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir la note « ZZ TEST »' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit.mock.calls[0][0]).toMatchObject({ title: 'ZZ TEST', type: 'note' });
  });
});

describe('Feuille d’édition : pas de type « Tarif » pour une note', () => {
  it('les types offerts à une note : Note, sans Tarif', () => {
    const v = typesFeuille('note').map((t) => t.label);
    expect(v).not.toContain('Tarif');
    expect(v[0]).toBe('Note');
    expect(typesFeuille('recipe-idea').map((t) => t.label)).not.toContain('Tarif');
    // Une idée de tarif déjà existante garde son type affiché (rien ne la change en silence).
    expect(typesFeuille('pricing-test').map((t) => t.label)).toContain('Tarif');
  });
  it('la feuille d’une note n’affiche pas « Tarif »', () => {
    const note = { id: 'CR-1', type: 'note', title: 'ZZ TEST', status: 'idea' } as unknown as CreativeItem;
    render(<CreativeItemSheet item={note} onClose={() => {}} onSave={() => {}} onDelete={() => {}} />);
    expect(screen.queryByText('Tarif')).not.toBeInTheDocument();
    expect(screen.getAllByText('Note').length).toBeGreaterThan(0);
  });
  it('la feuille d’une note ne demande ni coût ni prix (critique C2, n° 4)', () => {
    const note = { id: 'CR-2', type: 'note', title: 'ZZ TEST', status: 'idea' } as unknown as CreativeItem;
    render(<CreativeItemSheet item={note} onClose={() => {}} onSave={() => {}} onDelete={() => {}} />);
    expect(screen.queryByText('Coût estimé (CHF)')).not.toBeInTheDocument();
    expect(screen.queryByText('Prix visé (CHF)')).not.toBeInTheDocument();
  });
});
