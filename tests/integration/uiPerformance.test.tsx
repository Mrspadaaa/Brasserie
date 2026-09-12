import React, { lazy } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { defaultConfig } from '../../src/services/storage';
import { fullRecipe } from '../fixtures/fullRecipe';
import * as recipeWater from '../../src/domain/recipeWater';
import { RatioSlider } from '../../src/ui/RatioSlider';
import { DeferredSurface, LazySurface } from '../../src/ui/LazySurface';

vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); });

describe('Interactive performance without stale calculations', () => {
  it('shows the same aggregate water volumes before saving without accumulating rounding', () => {
    const recipe = structuredClone(fullRecipe);
    recipe.waterPlan = { ...recipe.waterPlan!, autoTreatment: false, mashWaterL: 10.5, spargeWaterL: 28.7,
      diRatioPct: 50, spargeDiRatioPct: 50 };
    render(<BrewWizard seed={{ recipe }} stockItems={[]} config={defaultConfig} knownStyles={[]}
      onClose={() => {}} onSave={() => {}} onCreateStockItem={() => {}} onSaveWaterSource={() => {}} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Récapitulatif', exact: true })[0]);
    const volumes = within(screen.getByLabelText('Eaux à préparer'));
    expect(volumes.getAllByText('19,6 L')).toHaveLength(2);
    expect(volumes.queryByText('19,7 L')).not.toBeInTheDocument();
  });

  it('keeps reconstructed salt doses readable without rounding away fine manual amounts', () => {
    const recipe = structuredClone(fullRecipe);
    recipe.waterPlan = { ...recipe.waterPlan!, autoTreatment: false,
      mash: { gypse: 1.12, cacl2: 0.0123456789 }, sparge: { gypse: .58 } };
    render(<BrewWizard seed={{ recipe }} stockItems={[]} config={defaultConfig} knownStyles={[]}
      onClose={() => {}} onSave={() => {}} onCreateStockItem={() => {}} onSaveWaterSource={() => {}} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Eau et sels', exact: true })[0]);
    fireEvent.click(screen.getByRole('button', { name: /^2\. Sels/ }));
    expect(screen.getByRole('textbox', { name: 'Dose de Gypse en grammes', exact: true })).toHaveValue('1,7');
    expect(screen.getByRole('textbox', { name: 'Dose de Chlorure de calcium en grammes', exact: true })).toHaveValue('0,0123456789');
  });

  it('does not solve automatic water while renaming, but still solves after a volume change', () => {
    const solve = vi.spyOn(recipeWater, 'replanRecipeWater');
    const recipe = structuredClone(fullRecipe);
    recipe.waterPlan = { ...recipe.waterPlan!, autoTreatment: true, targetProfileId: '21C',
      targetIons: undefined, diRatioPct: 50 };
    render(<BrewWizard seed={{ recipe }} stockItems={[]} config={defaultConfig} knownStyles={[]}
      onClose={() => {}} onSave={() => {}} onCreateStockItem={() => {}} onSaveWaterSource={() => {}} />);
    expect(solve).toHaveBeenCalled();
    solve.mockClear();
    fireEvent.change(screen.getByRole('textbox', { name: 'Nom de la bière', exact: true }), { target: { value: 'IPA de septembre' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Nom de la bière', exact: true }), { target: { value: 'IPA de septembre 2' } });
    expect(solve).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole('textbox', { name: 'Volume en fermenteur', exact: true }), { target: { value: '22' } });
    expect(solve).toHaveBeenCalled();
    expect(solve.mock.calls.at(-1)?.[0].volumeL).toBe(22);
  });

  it('solves once per ratio graduation and still applies the first press in manual mode', () => {
    const changed = vi.fn();
    const { container } = render(<RatioSlider value={1} achieved={.8} followingTarget={false} onChange={changed} />);
    const track = container.querySelector<HTMLElement>('.ratio-track')!;
    vi.spyOn(track, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, right: 280, bottom: 28, width: 280, height: 28, x: 0, y: 0, toJSON: () => ({}) });
    track.setPointerCapture = vi.fn(); track.hasPointerCapture = () => true; track.releasePointerCapture = vi.fn();
    const pointer = (type: string, x: number) => {
      const event = new MouseEvent(type, { bubbles: true, button: 0, clientX: x });
      Object.defineProperty(event, 'pointerId', { value: 1 });
      fireEvent(track, event);
    };
    pointer('pointerdown', 140);
    for (const x of [140, 140.1, 140.2, 140]) pointer('pointermove', x);
    pointer('pointermove', 200);
    pointer('pointerup', 200);
    expect(changed.mock.calls.map(([ratio]) => ratio)).toEqual([.8, 2]);
    pointer('pointerdown', 200); pointer('pointerup', 200);
    expect(changed.mock.calls.map(([ratio]) => ratio)).toEqual([.8, 2, 2]);
    expect(screen.getByLabelText('Rapport obtenu')).toHaveTextContent('0,8');
  });
});

describe('Deferred screens', () => {
  it('loads a modal only when first opened and preserves its state across closing', async () => {
    function Editor({ open }: { open: boolean }) {
      const [value, setValue] = React.useState('');
      return open ? <input aria-label="Brouillon conservé" value={value} onChange={event => setValue(event.target.value)} /> : null;
    }
    const download = vi.fn(async () => ({ default: Editor }));
    const Modal = lazy(download);
    const renderModal = (open: boolean) => <DeferredSurface active={open} fallback={<p>Ouverture</p>}><Modal open={open} /></DeferredSurface>;
    const { rerender } = render(renderModal(false));
    expect(download).not.toHaveBeenCalled();
    await act(async () => { rerender(renderModal(true)); });
    fireEvent.change(screen.getByRole('textbox', { name: 'Brouillon conservé' }), { target: { value: 'Saisie en cours' } });
    rerender(renderModal(false));
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    rerender(renderModal(true));
    expect(screen.getByRole('textbox', { name: 'Brouillon conservé' })).toHaveValue('Saisie en cours');
    expect(download).toHaveBeenCalledOnce();
  });

  it('keeps navigation usable until the requested screen is ready', async () => {
    let complete!: (module: { default: React.ComponentType }) => void;
    const Screen = lazy(() => new Promise<{ default: React.ComponentType }>(resolve => { complete = resolve; }));
    const navigate = vi.fn();
    render(<><button onClick={navigate}>Navigation conservée</button><LazySurface><Screen /></LazySurface></>);
    expect(screen.getByRole('status')).toHaveTextContent('Chargement');
    fireEvent.click(screen.getByRole('button', { name: 'Navigation conservée' }));
    expect(navigate).toHaveBeenCalledOnce();
    await act(async () => { complete({ default: () => <p>Écran prêt</p> }); });
    expect(screen.getByText('Écran prêt')).toBeVisible();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('contains a failed screen and allows navigation to a working one', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const Broken = (): React.ReactNode => { throw Error('Synthetic failed screen download'); };
    const { rerender } = render(<LazySurface resetKey="first"><Broken /></LazySurface>);
    expect(screen.getByRole('alert')).toHaveTextContent('Impossible de charger cet écran');
    expect(screen.getByRole('button', { name: 'Recharger l’application' })).toBeEnabled();
    rerender(<LazySurface resetKey="next"><p>Autre écran</p></LazySurface>);
    expect(screen.getByText('Autre écran')).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
