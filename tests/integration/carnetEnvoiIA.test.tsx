import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CreativeItem } from '../../src/types';

// Constat 13 (jeu en ligne 16.11) : un appel IA part-il à l'envoi d'une note ? Gemini n'est JAMAIS appelé ici : AiClient est simulé.
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
import { AiClient } from '../../src/services/aiClient';
import { NoteCarnet } from '../../src/ui/atelier/NoteCarnet';
import { assezPourIA, envoi, motsDe } from '../../src/domain/rangerNote';

const run = AiClient.run as unknown as ReturnType<typeof vi.fn>;

function Carnet({ mode = 'production' as 'production' | 'eteint' }) {
  const [items, setItems] = useState<CreativeItem[]>([]);
  return <NoteCarnet items={items} filtre="tout" onFiltre={() => {}} vues={{ bieres: null, contacts: null, afaire: null }} assistant={null} mode={mode}
    tarifs={[]} bieres={[]} onAjouter={(i) => setItems((l) => [...l, i])} onMaj={(i) => setItems((l) => l.map((x) => (x.id === i.id ? i : x)))}
    onRetirer={(id) => setItems((l) => l.filter((x) => x.id !== id))} onEdit={() => {}} onConvert={() => false} />;
}
const ecrire = (texte: string) => {
  fireEvent.change(screen.getByRole('textbox', { name: 'Noter' }), { target: { value: texte } });
};
const envoyer = () => fireEvent.click(screen.getByRole('button', { name: 'Envoyer la note' }));

beforeEach(() => { run.mockReset(); });
afterEach(() => cleanup());

describe('mots d’une note (la regex est exercée)', () => {
  it('compte les mots, pas les signes seuls', () => {
    expect(motsDe('  Appeler   Marc demain ')).toEqual(['Appeler', 'Marc', 'demain']);
    expect(motsDe('ok - … !')).toEqual(['ok']);
    expect(motsDe('2 fûts')).toHaveLength(2);
    expect(motsDe('')).toEqual([]);
    expect(assezPourIA('Appeler Marc')).toBe(false);
    expect(assezPourIA('Appeler Marc demain')).toBe(true);
  });
  it('envoi : sous 3 mots, jamais « ia » ni « attente » ; IA éteinte : brute', () => {
    expect(envoi('production', true, 'ok')).toBe('brute');
    expect(envoi('production', false, 'Appeler Marc')).toBe('brute');
    expect(envoi('production', true, 'Appeler Marc demain')).toBe('ia');
    expect(envoi('production', false, 'Appeler Marc demain')).toBe('attente');
    expect(envoi('eteint', true, 'Appeler Marc demain')).toBe('brute');
  });
});

describe('Carnet : l’envoi d’une note et l’appel IA', () => {
  it('une note d’un mot ou de deux mots : aucun appel, note gardée, message clair', async () => {
    render(<Carnet />);
    ecrire('ok'); envoyer();
    expect(await screen.findByText(/Gardée telle quelle : moins de 3 mots/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ranger' })).not.toBeInTheDocument();
    ecrire('Appeler Marc'); envoyer();
    await waitFor(() => expect(screen.getAllByText(/Gardée telle quelle : moins de 3 mots/).length).toBeGreaterThan(0));
    expect(run).not.toHaveBeenCalled();
  });

  it('une note vide ou d’espaces : rien n’est envoyé, aucun appel', () => {
    render(<Carnet />);
    expect(screen.getByRole('button', { name: 'Envoyer la note' })).toBeDisabled();
    ecrire('   ');
    expect(screen.getByRole('button', { name: 'Envoyer la note' })).toBeDisabled();
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Noter' }), { key: 'Enter' });
    expect(run).not.toHaveBeenCalled();
  });

  it('trois mots : un appel part, en Rapide (fast) ; une réponse vide dit « Gardée telle quelle », sans alarme', async () => {
    run.mockResolvedValue({ ok: true, data: { effets: [] } });
    render(<Carnet />);
    ecrire('Appeler Marc demain pour les fûts'); envoyer();
    expect(await screen.findByText(/Gardée telle quelle : rien à ranger/)).toBeInTheDocument();
    expect(run).toHaveBeenCalledTimes(1);
    expect(run.mock.calls[0][0]).toMatchObject({ task: 'rangerNote', tier: 'fast' });
    expect(screen.queryByText(/n’a rien proposé/)).not.toBeInTheDocument();
  });

  it('une panne du modèle : « n’a pas répondu », la note est gardée', async () => {
    run.mockResolvedValue({ ok: false, error: 'indisponible' });
    render(<Carnet />);
    ecrire('Appeler Marc demain pour les fûts'); envoyer();
    expect(await screen.findByText(/L’IA n’a pas répondu : ta note est gardée telle quelle/)).toBeInTheDocument();
  });

  it('l’indice sous le champ dit si l’envoi part à l’IA, sans nommer de modèle', () => {
    render(<Carnet />);
    expect(screen.queryByText(/IA/)).not.toBeInTheDocument();
    ecrire('ok');
    expect(screen.getByText('Moins de 3 mots : gardée telle quelle, sans IA.')).toBeInTheDocument();
    ecrire('Appeler Marc demain');
    expect(screen.getByText('Envoyer : l’IA lit ta note pour la ranger.')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Flash|Gemini|Hydrogen/i);
  });

  it('retouche finale n° 1 : sous 3 mots, ni « Ranger » ni « modèle plus précis » (on ne propose pas l’IA après avoir dit « sans IA »)', async () => {
    render(<Carnet />);
    ecrire('2 fûts'); envoyer();
    expect(await screen.findByText(/Gardée telle quelle : moins de 3 mots/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /modèle plus précis/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ranger' })).not.toBeInTheDocument();
    expect(run).not.toHaveBeenCalled();
  });

  it('IA éteinte : aucun indice, aucun appel', () => {
    render(<Carnet mode="eteint" />);
    ecrire('Appeler Marc demain pour les fûts');
    expect(screen.queryByText(/l’IA lit/)).not.toBeInTheDocument();
    envoyer();
    expect(run).not.toHaveBeenCalled();
  });
});

// Retouche finale n° 6 : la carte « Tarif » du Carnet prend la teinte de Tarifs (production), pas le bleu d'« À faire » (finances).
import { CarteChose } from '../../src/ui/atelier/NoteAiguillage';
describe('Carnet : teinte de la carte Tarif', () => {
  it('la carte d’une idée de prix n’a pas la teinte des événements', () => {
    const { container } = render(<CarteChose item={{ id: 'p', type: 'pricing-test', title: 'Fût 20 L', status: 'idea', targetPrice: 145, format: 'fut' } as CreativeItem} onOuvrir={() => {}} onDate={() => {}} />);
    const style = (container.querySelector('.nc-car') as HTMLElement).style.getPropertyValue('--c');
    expect(style).toBe('var(--a-prod)');
    const ev = render(<CarteChose item={{ id: 'e', type: 'event', title: 'Marché', status: 'todo' } as CreativeItem} onOuvrir={() => {}} onDate={() => {}} />);
    expect((ev.container.querySelector('.nc-car') as HTMLElement).style.getPropertyValue('--c')).toBe('var(--a-fin)');
  });
});
