// @vitest-environment jsdom
/*
 * Tour 30 (voie fix30), la part des composants : la saisie d'un lien mort (T30-2), la barre repliée qui dit le carnet du lien (T30-3), la réponse
 * « C'est le bon » gardée (T30-5), l'étape « Rangement » (T30-10). Rendu jsdom, aucun réseau, aucun Gemini ; la preuve visuelle se fait en ligne.
 */
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BarreLecture, LectureLien } from '../../src/ui/carnets/LectureLien';
import type { LectureEnCours } from '../../src/ui/carnets/rangement';

afterEach(() => cleanup());

const MORT: LectureEnCours = { url: 'https://brewtools.example/p/7', statut: 'introuvable', debut: 0, fin: 3000, etapes: [{ nom: 'page', statut: 'absent', detail: 'introuvable' }] };
const FIN: LectureEnCours = { url: 'https://hopfenmarkt.example/mosaic', statut: 'lue', debut: 0, fin: 9000, etapes: [
  { nom: 'page', statut: 'trouve' }, { nom: 'donnees', statut: 'trouve' }, { nom: 'prix', statut: 'douteux', detail: '2 prix sur la page' },
  { nom: 'photos', statut: 'trouve' }, { nom: 'caract', statut: 'trouve' }, { nom: 'controle', statut: 'trouve' }
] };

describe('T30-2 : « Compléter » un lien mort ouvre une saisie (nom, prix), jamais un simple toast', () => {
  const carte = (onCompleter: (s: { nom: string; prixCentimes?: number }) => void) =>
    render(<LectureLien lecture={MORT} phase="echec" onCompleter={onCompleter} onAutreLien={() => undefined} onRetirer={() => undefined} onEscalader={() => undefined} />);
  it('le toucher ouvre deux champs ; « Garder » rend le nom et le prix en centimes', () => {
    const rendu = vi.fn();
    carte(rendu);
    expect(screen.queryByLabelText('Nom de l’article')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Compléter/ }));
    expect(rendu).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Nom de l’article'), { target: { value: ' Brew Monk B40 ' } });
    fireEvent.change(screen.getByLabelText('Prix en francs'), { target: { value: '147,00' } });
    fireEvent.click(screen.getByRole('button', { name: /Garder/ }));
    expect(rendu).toHaveBeenCalledWith({ nom: 'Brew Monk B40', prixCentimes: 14700 });
  });
  it('sans nom, ou avec un prix illisible : dit, rien n’est gardé ; le prix reste facultatif', () => {
    const rendu = vi.fn();
    carte(rendu);
    fireEvent.click(screen.getByRole('button', { name: /Compléter/ }));
    fireEvent.click(screen.getByRole('button', { name: /Garder/ }));
    expect(screen.getByRole('alert').textContent).toMatch(/nom/);
    fireEvent.change(screen.getByLabelText('Nom de l’article'), { target: { value: 'X' } });
    fireEvent.change(screen.getByLabelText('Prix en francs'), { target: { value: 'cher' } });
    fireEvent.click(screen.getByRole('button', { name: /Garder/ }));
    expect(screen.getByRole('alert').textContent).toMatch(/pas un prix/);
    expect(rendu).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Prix en francs'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /Garder/ }));
    expect(rendu).toHaveBeenCalledWith({ nom: 'X' });
  });
  it('« Annuler » referme la saisie et rend les boutons', () => {
    carte(vi.fn());
    fireEvent.click(screen.getByRole('button', { name: /Compléter/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(screen.queryByLabelText('Nom de l’article')).toBeNull();
    expect(screen.getByRole('button', { name: /Compléter/ })).toBeTruthy();
  });
});

describe('T30-3 : la barre de fin vue d’un autre carnet dit le carnet du lien', () => {
  it('« Lu · Brew Monk » puis « dans « ZZ TEST » » sur sa seconde ligne ; dans son carnet, une ligne', () => {
    const { container, rerender } = render(<BarreLecture lecture={FIN} phase="fin" nom="Brew Monk" carnet="ZZ TEST — tour 30" onDeplier={() => undefined} onFermer={() => undefined} />);
    expect(container.querySelector('.cnl-barre')?.getAttribute('data-deux')).toBe('true');
    expect(container.textContent).toContain('Lu · Brew Monk');
    expect(container.textContent).toContain('dans « ZZ TEST — tour 30 »');
    rerender(<BarreLecture lecture={FIN} phase="fin" nom="Brew Monk" onDeplier={() => undefined} onFermer={() => undefined} />);
    expect(container.querySelector('.cnl-barre')?.getAttribute('data-deux')).toBeNull();
    expect(container.textContent).not.toContain('dans «');
  });
});

describe('T30-5 : « C’est le bon » est une réponse gardée', () => {
  it('la question « Prix · douteux » ne revient pas quand l’écran dit qu’elle est réglée', () => {
    const onBon = vi.fn();
    const { unmount } = render(<LectureLien lecture={FIN} phase="fin" onFermer={() => undefined} bons={[]} onBon={onBon} />);
    expect(screen.getByRole('button', { name: /C’est le bon/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /C’est le bon/ }));
    expect(onBon).toHaveBeenCalledWith('prix');
    unmount();
    render(<LectureLien lecture={FIN} phase="fin" onFermer={() => undefined} bons={['prix']} onBon={onBon} />);
    expect(screen.queryByRole('button', { name: /C’est le bon/ })).toBeNull();
  });
});

describe('T30-10 : l’étape qui tourne se voit jusqu’au rangement', () => {
  it('les six étapes trouvées, l’IA range : une ligne « Rangement » en cours', () => {
    const pages = { ...FIN, etapes: FIN.etapes!.map(e => ({ ...e, statut: 'trouve' as const })), rangement: true as const };
    const { container } = render(<LectureLien lecture={pages} phase="en-cours" />);
    expect(container.textContent).toContain('Rangement');
    /* C46-6 (D448) : le rangement n'est pas une septième étape de lecture ; le total reste six, comme à la fin (« 6 étapes sur 6 ») */
    expect(container.textContent).toMatch(/Lecture · 6 sur 6/);
    expect(container.textContent).not.toMatch(/sur 7/);
  });
});
