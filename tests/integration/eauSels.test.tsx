import React from 'react';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SaltSolver, type WaterState } from '../../src/ui/SaltSolver';
import { DEFAULT_WATER_SOURCE } from '../../src/domain/water';
import { reperesVisibles } from '../../src/ui/water/GradueSlider';
import { hautBoutonDocke } from '../../src/ui/water/useWaterControlsLayout';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

// EAU-1 (brasseur, 19.11) : « Gros problème sur la partie sel !!! ». « 2. Sels » paraissait choisi, mais l'onglet Eau restait affiché :
// `.ew { display: flex }` (eau.css, chargé après Tailwind) l'emportait sur la classe `hidden`.
function Demo() {
  const [state, setState] = React.useState<WaterState>({ styleCode: '21A', diRatioPct: 50, spargeDiRatioPct: 50, mashWaterL: 28.7, spargeWaterL: 13.8,
    doses: { gypsum: 2 }, disabled: [], acidId: 'lactique' } as WaterState);
  return <SaltSolver state={state} onChange={setState} source={DEFAULT_WATER_SOURCE} onSourceChange={() => {}} beerEbc={8.4} beerVolumeL={30}
    noSparge={false} onNoSpargeChange={() => {}}
    brew={{ style: 'IPA', totalGristKg: 8, grist: [{ name: 'Pilsner', kind: 'grain', use: 'empatage', weightKg: 8, colorEbc: 6 }], targetPh: 5.4 } as any} />;
}

describe('EAU-1 : « 2. Sels » montre les sels, et seulement eux', () => {
  it('passer à Sels cache l’onglet Eau ; revenir à Eau cache les sels (feuilles de l’app, dans leur ordre : Tailwind, puis eau.css)', () => {
    vi.stubGlobal('Worker', undefined);
    const style = document.createElement('style');
    style.textContent = '.hidden { display: none; }\n.block { display: block; }\n' + readFileSync(resolve(__dirname, '../../src/ui/water/eau.css'), 'utf8');
    document.head.appendChild(style);
    onTestFinished(() => style.remove());
    const { container } = render(<Demo />);
    const eau = container.querySelector('[data-ew-tab="eau"]') as HTMLElement;
    const pesee = screen.getByRole('list', { name: 'Sels à peser', hidden: true });
    expect(eau).toBeVisible();
    expect(pesee).not.toBeVisible();

    act(() => { fireEvent.click(screen.getByRole('button', { name: /^2\. Sels/ })); });
    expect(screen.getByRole('button', { name: /^2\. Sels/ })).toHaveAttribute('aria-pressed', 'true');
    expect(eau).not.toBeVisible();
    expect(pesee).toBeVisible();

    act(() => { fireEvent.click(screen.getByRole('button', { name: /^1\. Eau/ })); });
    expect(eau).toBeVisible();
    expect(pesee).not.toBeVisible();
  });

  it('la feuille de l’onglet Eau ne peut pas reprendre la main sur `.hidden` : `.ew.hidden` est masqué explicitement', () => {
    const css = readFileSync(resolve(__dirname, '../../src/ui/water/eau.css'), 'utf8');
    expect(css).toMatch(/\.ew\.hidden\s*\{\s*display:\s*none/);
  });
});

describe('EAU-2 : les repères chiffrés d’un curseur ne se chevauchent pas (« 32,235 »)', () => {
  const labels = [{ v: 0, text: '0' }, { v: 32.2, text: '32,2', borne: true }, { v: 35, text: '35' }];

  it('Empâtage à 390 px : la borne du matériel 32,2 garde sa place, l’extrémité 35 qui la touche s’efface', () => {
    expect(reperesVisibles(labels, 0, 35, 150).map(l => l.text)).toEqual(['0', '32,2']);
  });

  it('à 1280 px, assez de place : les trois repères restent', () => {
    expect(reperesVisibles(labels, 0, 35, 400).map(l => l.text)).toEqual(['0', '32,2', '35']);
  });

  it('largeur inconnue (premier rendu) : tous les repères, dans leur ordre', () => {
    expect(reperesVisibles(labels, 0, 35, 0).map(l => l.text)).toEqual(['0', '32,2', '35']);
  });
});

describe('EAU-3 : le « + » docké à côté de « 1. Eau | 2. Sels » reste dans la rangée', () => {
  it('centré dans la hauteur de la rangée, il n’en déborde ni en haut ni en bas', () => {
    const haut = hautBoutonDocke(216, 45);
    expect(haut).toBeGreaterThanOrEqual(216);
    expect(haut + 40).toBeLessThanOrEqual(216 + 45);
  });

  it('la rangée laisse au moins 6 px entre le segment et le bouton, avec ou sans pastille d’activité', () => {
    const css = readFileSync(resolve(__dirname, '../../src/ui/water/workshop.css'), 'utf8');
    // BOUTON-FLOTTANT-COUVRE (25.11) : la réserve ne vaut que pour le bouton docké (`data-has-water-sels` : page sans pied, l'atelier de l'eau).
    const pad = (attr: string) => Number(css.match(new RegExp(`body\\[${attr}\\]\\[data-has-water-sels\\] \\[data-water-step="sels"\\] \\.water-mobile-nav \\{\\s*padding-right: (\\d+)px`))?.[1]);
    // Rangée de 8 px à W − 8 : segment fini à W − 8 − padding. Bouton de 40 px à 14 px du bord (58 px avec la pastille).
    expect(pad('data-has-fab') - (14 + 40 - 8)).toBeGreaterThanOrEqual(6);
    expect(pad('data-has-activity-pill') - (58 + 40 - 8)).toBeGreaterThanOrEqual(6);
  });
});
