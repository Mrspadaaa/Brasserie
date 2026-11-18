// @vitest-environment jsdom
/**
 * Rejeu en ligne de 88ebd641 (08.11, `work/missions/2026-11-08-rejeu-88eb/RAPPORT.md`) :
 * RV-1 « Citra · α non publié » en tête de liste ; RV-2 la référence interne « MP-6770960b-… » dans la liste ;
 * VI-9 à la recette (Eau et sels) : 99999 g de gypse annoncé « conservé » mais gardé dans le champ.
 */
import React from 'react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { HopVariety } from '../../functions/src/hopIndexSchema';
import { optionsReference } from '../../src/ui/hopIndex/pickerOptions';
import { refAffichable } from '../../src/domain/stock/regles';
import { SaltDoseControl, SEL_DOSE_MAX_G } from '../../src/ui/water/SaltDoseControl';
import { SALTS } from '../../src/domain/water';

afterEach(cleanup);

const source = { title: 'Fiche', author: 'Hopsteiner', year: 2024, kind: 'manufacturer', reference: 'x' } as const;
const alpha = (min: number, max: number) => ({ analyte: 'alpha', unit: 'percentMass', basis: 'asIs', kind: 'range', range: { min, max }, source, confidence: 'medium' }) as never;
const variete = (id: string, name: string, extra: Partial<HopVariety> = {}): HopVariety => ({ id, name, aliases: [], form: 'unknown', descriptions: [], analysis: [], ...extra } as HopVariety);

describe('RV-1 — un houblon phare n’est jamais « α non publié » quand une autre fiche de la variété publie son α', () => {
  const citraSansAlpha = variete('c1', 'Citra');
  const citra = variete('c2', 'Citra', { aliases: ['HBC 394'], analysis: [alpha(11, 13)] });
  const opts = optionsReference([citraSansAlpha, citra, variete('z', 'Zappa')], () => 'Catalogue');
  it('la fiche qui publie l’α passe devant', () => {
    expect(opts[0].value).toBe('ref:c2');
  });
  it('la fiche sans α montre celui de la variété, avec sa source', () => {
    const sans = opts.find(o => o.value === 'ref:c1')!;
    expect(sans.detail).toMatch(/^11–13 % α \(/);
    expect(sans.detail).not.toMatch(/α non publié/);
  });
  it('une variété qu’aucune fiche ne chiffre reste « α non publié » (jamais un chiffre inventé)', () => {
    expect(opts.find(o => o.value === 'ref:z')!.detail).toMatch(/^α non publié/);
  });
});

describe('RV-2 — un identifiant généré ne s’affiche jamais', () => {
  it('« MP-6770960b-d6da-…-24 » et « EQ-6c0b6340-dcdb-… » sont internes ; « MP-023 », « EQ-001 » se montrent', () => {
    expect(refAffichable('MP-6770960b-d6da-4840-929e-4b44ae641865-24')).toBe('');
    expect(refAffichable('EQ-6c0b6340-dcdb-4e5c-bb04-355931fc1d2e-0')).toBe('');
    expect(refAffichable('MP-023')).toBe('MP-023');
    expect(refAffichable('EQ-001')).toBe('EQ-001');
  });
});

describe('VI-9 à la recette — une dose de sel absurde rétablit la dose d’avant, comme le message le dit', () => {
  const gypse = (SALTS as Record<string, any>).gypse ?? Object.values(SALTS as Record<string, any>)[0];
  const monter = (grams: number, onDose = vi.fn()) => {
    render(<ul><SaltDoseControl id={'gypse' as never} def={gypse} grams={grams} off={false} active ions={[]} onDetails={vi.fn()} onDose={onDose} onToggle={vi.fn()} onActivate={vi.fn()} /></ul>);
    return onDose;
  };
  it('99999 g puis sortie du champ : la dernière dose remontée est 3,2 g, et le message nomme la valeur conservée', () => {
    const onDose = monter(3.2);
    const champ = screen.getByRole('textbox');
    fireEvent.focus(champ);
    fireEvent.change(champ, { target: { value: '99999' } });
    fireEvent.blur(champ);
    expect(onDose).toHaveBeenLastCalledWith(3.2);
    expect(screen.getByRole('alert')).toHaveTextContent(/au-delà de 500 g/);
    expect(screen.getByRole('alert')).toHaveTextContent(/La valeur précédente \(3,2 g\) est conservée/);
  });
  it('une dose plausible passe, sans message', () => {
    const onDose = monter(3.2);
    const champ = screen.getByRole('textbox');
    fireEvent.focus(champ);
    fireEvent.change(champ, { target: { value: '4,5' } });
    fireEvent.blur(champ);
    expect(onDose).toHaveBeenLastCalledWith(4.5);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(SEL_DOSE_MAX_G).toBe(500);
  });
});
