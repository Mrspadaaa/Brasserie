// Mission 2026-11-09-levure-retours, voie r2 : « dans la recherche clicker sur une levure n'importe où pas que son nom ouvre son
// sous menu » (09.11). Toute la ligne ouvre son détail, au clic, au toucher et au clavier ; les boutons de la ligne (« ⌕ ») gardent
// leur geste. API simulée (vues-simule.ts) : aucune donnée réelle.
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Chercher } from '../../../src/ui/etapeLevure/Chercher';
import type { PropsVue } from '../../../src/ui/etapeLevure/props';
import { apiSimulee, levureDe, reperes } from './vues-simule';

afterEach(cleanup);

function Hote({ spy = {} as Partial<PropsVue> }: { spy?: Partial<PropsVue> }) {
  const [comparees, setComparees] = useState<string[]>([]);
  return (
    <Chercher base={levureDe('us05')} reperes={reperes} comparees={comparees} api={apiSimulee}
      onChoisir={spy.onChoisir ?? vi.fn()} onComparees={(ids) => setComparees(ids)} onVue={vi.fn()} onChercherDonnee={spy.onChercherDonnee} />
  );
}

const ligne = (id: string) => document.querySelector(`[data-levure="${id}"]`) as HTMLElement;
const ouverte = () => screen.queryByRole('button', { name: 'Choisir pour ma recette' });

describe('Chercher : toute la ligne ouvre son détail', () => {
  it('un toucher sur les pistes ou les pastilles, hors du nom, ouvre la ligne ; un second la referme', () => {
    render(<Hote />);
    const l = ligne('verdant');
    expect(ouverte()).toBeNull();
    fireEvent.click(l.querySelector('[data-piste="attenuation"]')!);
    expect(ouverte()).not.toBeNull();
    fireEvent.click(l.querySelector('[data-piste="temperature"]')!);
    expect(ouverte()).toBeNull();
    // les pastilles d'arômes
    fireEvent.click(l.querySelector('.lvv-p')!);
    expect(ouverte()).not.toBeNull();
  });

  it('le fond de la ligne lui-même ouvre la ligne', () => {
    render(<Hote />);
    fireEvent.click(ligne('verdant'));
    expect(ouverte()).not.toBeNull();
  });

  it('au clavier : la ligne prend le focus, Entrée l’ouvre, Espace la referme', async () => {
    const u = userEvent.setup();
    render(<Hote />);
    const cible = ligne('verdant').querySelector<HTMLElement>('[aria-expanded]')!;
    cible.focus();
    expect(cible).toHaveFocus();
    await u.keyboard('{Enter}');
    expect(ouverte()).not.toBeNull();
    expect(cible).toHaveAttribute('aria-expanded', 'true');
    await u.keyboard(' ');
    expect(ouverte()).toBeNull();
  });

  it('le « ⌕ » d’une ligne garde son geste : il cherche la donnée sans ouvrir la ligne', async () => {
    const u = userEvent.setup();
    const onChercherDonnee = vi.fn();
    render(<Hote spy={{ onChercherDonnee }} />);
    const nd = ligne('us05').querySelector<HTMLElement>('.lvv-nd');
    expect(nd).not.toBeNull();
    await u.click(nd!);
    expect(onChercherDonnee).toHaveBeenCalledTimes(1);
    expect(ouverte()).toBeNull();
  });

  it('dans la ligne ouverte, « Comparer » garde son geste et ne referme pas la ligne', async () => {
    const u = userEvent.setup();
    render(<Hote />);
    fireEvent.click(ligne('verdant').querySelector('[data-piste="attenuation"]')!);
    await u.click(screen.getByRole('button', { name: 'Comparer' }));
    expect(ouverte()).not.toBeNull();
    expect(screen.getByRole('button', { name: /Dans Comparer/ })).toBeInTheDocument();
  });
});
