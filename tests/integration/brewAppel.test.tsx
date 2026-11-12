// @vitest-environment jsdom
// Voie port-D : la carte d'appel de p2c (carte rouge, plein écran) et ses greffes G1 (sonne depuis, couper le son,
// « Ajouté · heure », annulable 10 s, Pas de Citra ?, Dans 1 min). Les mots sont ceux de work/missions/2026-11-11-brassage-zero/voies/p2/p2c/build.mjs.
import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import {
  BrewAppel,
  BrewAppelPlein,
  APPEL_ANNULATION_MS,
  heureAppel,
  type BrewAppelProps
} from '../../src/ui/BrewAppel';

const h = (hh: number, mm: number) => new Date(2026, 10, 12, hh, mm, 0, 0).getTime();

const base = (over: Partial<BrewAppelProps> = {}): BrewAppelProps => ({
  ajout: { id: 'hop-citra-5', nom: 'Citra', dose: '25 g', avantFinMin: 5, prevu: h(16, 15) },
  maintenant: h(16, 19),
  sonneDepuis: h(16, 15),
  suivant: { texte: 'Amarillo 43 g', heure: h(16, 20), moment: 'coupure du feu' },
  ajoute: null,
  onAjoute: vi.fn(),
  onAnnule: vi.fn(),
  onFini: vi.fn(),
  onReporte: vi.fn(),
  onRemplace: vi.fn(),
  onAutreDose: vi.fn(),
  onSaute: vi.fn(),
  onCoupeSon: vi.fn(),
  ...over
});

const texte = (el: HTMLElement) => (el.textContent ?? '').replace(/\s+/g, ' ').trim();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(h(16, 19));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('assistants de temps', () => {
  it('heureAppel : « 16 h 19 », sans zéro devant l’heure, « ? » si inconnue', () => {
    expect(heureAppel(h(16, 19))).toBe('16 h 19');
    expect(heureAppel(h(9, 5))).toBe('9 h 05');
    expect(heureAppel(null)).toBe('?');
    expect(heureAppel(Number.NaN)).toBe('?');
  });
});

describe('BrewAppel : la carte rouge de p2c', () => {
  it('porte les mots exacts de p2c et de G1', () => {
    render(<BrewAppel {...base()} />);
    const carte = screen.getByRole('group', { name: /Citra 25 g/ });
    expect(texte(carte)).toContain('En retard de 4 min · sonne chaque minute');
    expect(within(carte).getByText('Sonne depuis 16 h 15')).toBeTruthy();
    expect(within(carte).getByRole('button', { name: 'Couper le son' })).toBeTruthy();
    expect(within(carte).getByText('Citra')).toBeTruthy();
    expect(within(carte).getByText('25 g')).toBeTruthy();
    expect(within(carte).getByText('5′ · prévu à 16 h 15 · il est 16 h 19')).toBeTruthy();
    expect(within(carte).getByRole('button', { name: /Ajouté · 16 h 19/ })).toBeTruthy();
    expect(within(carte).getByText('un toucher, même mouillé · annulable 10 s')).toBeTruthy();
    expect(within(carte).getByText('Pas de Citra ?')).toBeTruthy();
    for (const nom of ['Remplacer', 'Autre dose', 'Sauter', 'Dans 1 min'])
      expect(within(carte).getByRole('button', { name: new RegExp(nom) })).toBeTruthy();
    expect(texte(within(carte).getByTestId('appel-suivant'))).toBe('ensuite Amarillo 43 g · 16 h 20 · dans 1 min');
  });

  it('moins d’une minute de retard : « À faire maintenant », jamais « 0 min »', () => {
    render(<BrewAppel {...base({ maintenant: h(16, 15) + 20_000 })} />);
    const carte = screen.getByRole('group', { name: /Citra 25 g/ });
    expect(texte(carte)).toContain('À faire maintenant · sonne chaque minute');
    expect(texte(carte)).not.toContain('0 min');
  });

  it('une heure inconnue reste « ? » : jamais 0 ni « 1 h 00 »', () => {
    render(<BrewAppel {...base({ suivant: { texte: 'Amarillo 43 g', heure: null, moment: 'coupure du feu' }, sonneDepuis: null })} />);
    expect(texte(screen.getByTestId('appel-suivant'))).toBe('ensuite Amarillo 43 g · ?');
    expect(screen.queryByText(/Sonne depuis/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Couper le son' })).toBeNull();
  });

  it('sans ajout suivant, la ligne « ensuite » disparaît', () => {
    render(<BrewAppel {...base({ suivant: null })} />);
    expect(screen.queryByTestId('appel-suivant')).toBeNull();
  });

  it('« Couper le son » ne coche rien', () => {
    const p = base();
    render(<BrewAppel {...p} />);
    fireEvent.click(screen.getByRole('button', { name: 'Couper le son' }));
    expect(p.onCoupeSon).toHaveBeenCalledTimes(1);
    expect(p.onAjoute).not.toHaveBeenCalled();
  });

  it('« Ajouté · heure » : un toucher, une seule écriture, à l’heure du toucher', () => {
    const p = base();
    render(<BrewAppel {...p} />);
    const bouton = screen.getByRole('button', { name: /Ajouté · 16 h 19/ });
    fireEvent.click(bouton);
    fireEvent.click(bouton); // doigt mouillé : second toucher aussitôt
    expect(p.onAjoute).toHaveBeenCalledTimes(1);
    expect(p.onAjoute).toHaveBeenCalledWith(h(16, 19));
  });

  it('l’annulation dans les 10 s remet l’ajout à faire', () => {
    const p = base();
    const { rerender } = render(<BrewAppel {...p} />);
    fireEvent.click(screen.getByRole('button', { name: /Ajouté · 16 h 19/ }));
    rerender(<BrewAppel {...p} ajoute={h(16, 19)} />);
    expect(screen.getByRole('button', { name: /Annuler/ })).toBeTruthy();
    expect(screen.getByText(/Ajouté · 16 h 19/)).toBeTruthy();
    act(() => { vi.advanceTimersByTime(APPEL_ANNULATION_MS - 1000); });
    fireEvent.click(screen.getByRole('button', { name: /Annuler/ }));
    expect(p.onAnnule).toHaveBeenCalledTimes(1);
    rerender(<BrewAppel {...p} ajoute={null} />);
    // remis à faire : le gros bouton revient, plus de fin de fenêtre
    expect(screen.getByRole('button', { name: /Ajouté · 16 h 19/ })).toBeTruthy();
    act(() => { vi.advanceTimersByTime(20_000); });
    expect(p.onFini).not.toHaveBeenCalled();
  });

  it('au bout de 10 s, la fenêtre d’annulation se ferme (onFini une fois)', () => {
    const p = base({ ajoute: h(16, 19) });
    render(<BrewAppel {...p} />);
    act(() => { vi.advanceTimersByTime(APPEL_ANNULATION_MS - 1); });
    expect(p.onFini).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(2); });
    expect(p.onFini).toHaveBeenCalledTimes(1);
    act(() => { vi.advanceTimersByTime(30_000); });
    expect(p.onFini).toHaveBeenCalledTimes(1);
  });

  it('« Dans 1 min » renvoie un report et ne coche rien', () => {
    const p = base();
    render(<BrewAppel {...p} />);
    fireEvent.click(screen.getByRole('button', { name: /Dans 1 min/ }));
    expect(p.onReporte).toHaveBeenCalledWith(1);
    expect(p.onAjoute).not.toHaveBeenCalled();
    expect(p.onSaute).not.toHaveBeenCalled();
  });

  it('Remplacer, Autre dose et Sauter sont trois gestes distincts, sans cocher', () => {
    const p = base();
    render(<BrewAppel {...p} />);
    fireEvent.click(screen.getByRole('button', { name: /Remplacer/ }));
    fireEvent.click(screen.getByRole('button', { name: /Autre dose/ }));
    fireEvent.click(screen.getByRole('button', { name: /Sauter/ }));
    expect(p.onRemplace).toHaveBeenCalledTimes(1);
    expect(p.onAutreDose).toHaveBeenCalledTimes(1);
    expect(p.onSaute).toHaveBeenCalledTimes(1);
    expect(p.onAjoute).not.toHaveBeenCalled();
  });

  it('aucun champ de saisie (jamais type="number")', () => {
    const { container } = render(<BrewAppel {...base()} />);
    expect(container.querySelectorAll('input')).toHaveLength(0);
  });
});

describe('BrewAppelPlein : l’appel plein écran de p2c', () => {
  it('porte les mots exacts de p2c-e2-appel', () => {
    render(<BrewAppelPlein {...base()} />);
    const appel = screen.getByRole('alertdialog');
    expect(appel.getAttribute('aria-modal')).toBe('true');
    expect(texte(appel)).toContain('Il est 16 h 19 · en retard de 4 min');
    expect(within(appel).getByText('Citra')).toBeTruthy();
    expect(within(appel).getByText('25 g')).toBeTruthy();
    expect(within(appel).getByText('5′ avant la fin · prévu à 16 h 15')).toBeTruthy();
    expect(within(appel).getByRole('button', { name: /Ajouté · 16 h 19/ })).toBeTruthy();
    expect(within(appel).getByText('Pas de Citra ?')).toBeTruthy();
    expect(within(appel).getByRole('button', { name: /Remplacer/ })).toBeTruthy();
    expect(within(appel).getByRole('button', { name: 'Rappel dans 1 min' })).toBeTruthy();
    expect(texte(within(appel).getByTestId('appel-suivant'))).toBe('ensuite Amarillo 43 g · 16 h 20 · coupure du feu');
  });

  it('le gros bouton prend le focus à l’ouverture', () => {
    render(<BrewAppelPlein {...base()} />);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /Ajouté · 16 h 19/ }));
  });

  it('Ajouté écrit une fois ; « Rappel dans 1 min » reporte sans cocher', () => {
    const p = base();
    render(<BrewAppelPlein {...p} />);
    fireEvent.click(screen.getByRole('button', { name: 'Rappel dans 1 min' }));
    expect(p.onReporte).toHaveBeenCalledWith(1);
    expect(p.onAjoute).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Ajouté · 16 h 19/ }));
    expect(p.onAjoute).toHaveBeenCalledWith(h(16, 19));
  });

  it('après Ajouté : annulable 10 s, puis se ferme', () => {
    const p = base({ ajoute: h(16, 19) });
    render(<BrewAppelPlein {...p} />);
    fireEvent.click(screen.getByRole('button', { name: /Annuler/ }));
    expect(p.onAnnule).toHaveBeenCalledTimes(1);
  });
});

describe('Gabarit CSS (mesures de p2c)', () => {
  const css = readFileSync('src/ui/brew-appel.css', 'utf8');
  const bloc = (sel: string) => {
    const m = css.match(new RegExp(`${sel.replace(/[.]/g, '\\.')}\\s*\\{([^}]*)\\}`));
    return m ? m[1] : '';
  };
  it('le gros bouton « Ajouté » fait 96 px de haut dans la carte, 72 px minimum en plein écran', () => {
    expect(bloc('.bap-ok')).toMatch(/min-height:\s*96px/);
    expect(bloc('.bap-plein .bap-ok')).toMatch(/min-height:\s*72px/);
  });
  it('chaque bouton secondaire fait 44 px de haut au moins', () => {
    expect(bloc('.bap-alt button')).toMatch(/min-height:\s*44px/);
    expect(bloc('.bap-son button')).toMatch(/min-height:\s*44px/);
  });
  it('le nom et la dose du plein écran sont à 64 px', () => {
    expect(bloc('.bap-plein .bap-nom')).toMatch(/font-size:\s*64px/);
    expect(bloc('.bap-plein .bap-dose')).toMatch(/font-size:\s*64px/);
  });
  it('aucun texte sous 14 px', () => {
    const tailles = [...css.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].map((m) => Number(m[1]));
    expect(tailles.length).toBeGreaterThan(3);
    expect(Math.min(...tailles)).toBeGreaterThanOrEqual(14);
  });
});
