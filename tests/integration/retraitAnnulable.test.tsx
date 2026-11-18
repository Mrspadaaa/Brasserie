/* BR-30 (banc du 08.11) : double toucher sur la corbeille d'un palier ou d'une phase = DEUX retraits, sans message.
   Le témoin « ancien » rejoue l'expression exacte de BrewWizard.tsx (`items.filter((_, j) => j !== i)`, liste en `key={i}`) :
   il retire deux lignes. La liste « nouveau » passe par useRetraitAnnulable : un toucher, un retrait, et « Annuler ». */
import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AvisRetrait, DELAI_VERROU_MS, useRetraitAnnulable } from '../../src/ui/useRetraitAnnulable';

const PALIERS = ['Protéase', 'β-amylase', 'α-amylase', 'Mash-out'];
function Liste({ mode }: { mode: 'ancien' | 'nouveau' }) {
  const [items, setItems] = useState(PALIERS);
  const r = useRetraitAnnulable(items, setItems, s => s);
  return <div>
    <div data-testid="zone" className={mode === 'nouveau' && r.verrou ? 'pointer-events-none' : ''}>
      <ul>{items.map((s, i) => <li key={i}><span>{s}</span>
        <button type="button" aria-label={`Retirer le palier ${s}`} onClick={() => mode === 'ancien' ? setItems(items.filter((_, j) => j !== i)) : r.retirer(i)}>x</button></li>)}</ul>
    </div>
    {mode === 'nouveau' && <AvisRetrait dernier={r.dernier} onAnnuler={r.annuler} />}
  </div>;
}
const restants = () => Array.from(document.querySelectorAll('li > span')).map(n => n.textContent);
const corbeille = (nom: string) => screen.getByRole('button', { name: `Retirer le palier ${nom}` });

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('Témoin : l’expression actuelle de BrewWizard retire deux lignes au double toucher', () => {
  it('Protéase puis β-amylase partent ensemble', () => {
    render(<Liste mode="ancien" />);
    const bouton = corbeille('β-amylase');
    fireEvent.click(bouton); fireEvent.click(bouton);
    expect(restants()).toEqual(['Protéase', 'Mash-out']);
  });
});

describe('useRetraitAnnulable : un toucher = un retrait', () => {
  it('le double toucher retire une seule ligne, sur le même nœud comme sur un nœud réemployé', () => {
    render(<Liste mode="nouveau" />);
    const bouton = corbeille('β-amylase');
    fireEvent.click(bouton); fireEvent.click(bouton);
    expect(restants()).toEqual(['Protéase', 'α-amylase', 'Mash-out']);
    expect(screen.getByRole('status')).toHaveTextContent('« β-amylase » retiré.');
  });
  it('deux appels dans le même rendu ne retirent qu’une ligne', () => {
    let api!: ReturnType<typeof useRetraitAnnulable<string>>;
    function Sonde() { const [items, setItems] = useState(PALIERS); api = useRetraitAnnulable(items, setItems, s => s); return <p data-testid="n">{items.join('|')}</p>; }
    render(<Sonde />);
    act(() => { api.retirer(1); api.retirer(1); });
    expect(screen.getByTestId('n')).toHaveTextContent('Protéase|α-amylase|Mash-out');
  });
  it('le second toucher sur une ligne déjà retirée ne fait rien', () => {
    render(<Liste mode="nouveau" />);
    const derniere = corbeille('Mash-out');
    fireEvent.click(derniere); fireEvent.click(derniere);
    expect(restants()).toEqual(['Protéase', 'β-amylase', 'α-amylase']);
  });
  it('la zone se verrouille pendant le délai puis se rouvre : un second retrait volontaire passe', () => {
    render(<Liste mode="nouveau" />);
    fireEvent.click(corbeille('Protéase'));
    expect(screen.getByTestId('zone')).toHaveClass('pointer-events-none');
    act(() => { vi.advanceTimersByTime(DELAI_VERROU_MS + 10); });
    expect(screen.getByTestId('zone')).not.toHaveClass('pointer-events-none');
    fireEvent.click(corbeille('Mash-out'));
    expect(restants()).toEqual(['β-amylase', 'α-amylase']);
  });
  it('« Annuler » rend la ligne à son rang et efface l’avis', () => {
    render(<Liste mode="nouveau" />);
    fireEvent.click(corbeille('α-amylase'));
    expect(restants()).toEqual(['Protéase', 'β-amylase', 'Mash-out']);
    fireEvent.click(screen.getByRole('button', { name: 'Annuler le retrait de α-amylase' }));
    expect(restants()).toEqual(PALIERS);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
  it('l’avis s’éteint seul après dix secondes', () => {
    render(<Liste mode="nouveau" />);
    fireEvent.click(corbeille('Protéase'));
    expect(screen.getByRole('status')).toBeVisible();
    act(() => { vi.advanceTimersByTime(10_100); });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
  it('un retrait hors liste est ignoré', () => {
    let api!: ReturnType<typeof useRetraitAnnulable<string>>;
    function Sonde() { const [items, setItems] = useState(PALIERS); api = useRetraitAnnulable(items, setItems, s => s); return <p data-testid="n">{items.length}</p>; }
    render(<Sonde />);
    act(() => { api.retirer(9); api.retirer(-1); });
    expect(screen.getByTestId('n')).toHaveTextContent('4');
  });
});
