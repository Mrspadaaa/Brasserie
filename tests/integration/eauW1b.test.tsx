import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SaltSolver, type WaterState } from '../../src/ui/SaltSolver';
import { DEFAULT_WATER_SOURCE } from '../../src/domain/water';
import { WaterVolumes } from '../../src/ui/water/WaterVolumes';
import { WaterDilution } from '../../src/ui/water/WaterDilution';
import { computeWaterAnalysis } from '../../src/ui/water/computeWaterAnalysis';

afterEach(cleanup);

// L'onglet « 1. Eau » porté de la maquette w1b (15.11) : deux cuves graduées, l'osmosée en curseur avec son minimum, l'interrupteur du rinçage.
const vol = { mashWaterL: 28.7, spargeWaterL: 13.8, preBoilVolumeL: 34.8, grainAbsorptionL: 7.7, boilOffL: 4, hopLossL: 0, mashRatioLPerKg: 3.59, planningStatus: 'ready', issues: [] } as any;
const baseState = { diRatioPct: 50, styleCode: '21A', doses: {}, disabled: [], acidId: 'lactique', mashWaterL: 28.7, spargeWaterL: 13.8, autoTreatment: true } as any;

function volumes(over: Partial<{ hasSparge: boolean; set: any; onNoSpargeChange: any; onMashRatioChange: any }> = {}) {
  const props = { set: vi.fn(), onNoSpargeChange: vi.fn(), onMashRatioChange: vi.fn(), hasSparge: true, ...over };
  render(<WaterVolumes beerVolumeL={30} brew={{ totalGristKg: 8, boilMin: 60 } as any} mashRatioLPerKg={3.59} vol={vol}
    state={baseState} {...props} />);
  return props;
}
const juste = { feasible: true, pct: 45, reasons: ['bicarbonate du réseau à 250 ppm'], stepPct: 5 } as any;
function dilution(over: Record<string, any> = {}) {
  const props = { set: vi.fn(), onChange: vi.fn(), applyMinimum: vi.fn(), ...over };
  render(<WaterDilution state={baseState} totalWaterL={42.5} spargeDi={50} spargeLinked justEnough={juste} hasSparge
    totalOsmoseeL={21.3} totalReseauL={21.3} {...props} />);
  return props;
}

describe('w1b : les deux cuves graduées', () => {
  it('Empâtage et Rinçage sont deux cuves, chacune avec son chiffre tapable et son curseur', () => {
    const p = volumes();
    const empatage = screen.getByRole('article', { name: 'Cuve d’empâtage' });
    const rincage = screen.getByRole('article', { name: 'Cuve de rinçage' });
    expect(within(empatage).getByRole('textbox', { name: 'Volume d’eau d’empâtage, en litres' })).toHaveValue('28,7');
    expect(within(rincage).getByRole('textbox', { name: 'Volume d’eau de rinçage, en litres' })).toHaveValue('13,8');
    const curseur = within(empatage).getByRole('slider', { name: /^Eau d’empâtage, 0 à 35 litres/ });
    fireEvent.change(curseur, { target: { value: '25' } });
    expect(p.set).toHaveBeenCalledWith({ mashWaterL: 25 });
    fireEvent.change(within(rincage).getByRole('slider', { name: /^Eau de rinçage, 0 à/ }), { target: { value: '10' } });
    expect(p.set).toHaveBeenCalledWith({ spargeWaterL: 10 });
  });

  it('l’épaisseur de maische reste un curseur nommé et un chiffre exact (L/kg)', () => {
    const p = volumes();
    fireEvent.change(screen.getByRole('slider', { name: 'Épaisseur de maische' }), { target: { value: '3.2' } });
    expect(p.onMashRatioChange).toHaveBeenCalledWith(3.2);
    expect(screen.getByLabelText('Rapport eau grain exact en litres par kilogramme')).toBeInTheDocument();
  });

  it('l’interrupteur du rinçage va dans le sens d’aujourd’hui : allumé = utilisé, un toucher = onNoSpargeChange(hasSparge)', () => {
    const p = volumes();
    const sw = screen.getByRole('switch', { name: 'Eau de rinçage — utilisée' });
    expect(sw).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(sw);
    expect(p.onNoSpargeChange).toHaveBeenCalledWith(true);
  });

  it('sans rinçage : cuve en pointillés, interrupteur éteint, phrase d’aujourd’hui, plus de chiffre de rinçage', () => {
    volumes({ hasSparge: false });
    expect(screen.getByRole('switch', { name: 'Eau de rinçage — aucune' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText('Sans rinçage — tout à l’empâtage.')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Volume d’eau de rinçage, en litres' })).not.toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Cuve de rinçage' }).className).toContain('ew-off');
  });

  it('« Comprendre » déplie les volumes (drêches, ébullition) ; « Avant ébullition » se lit sur la ligne des faits', () => {
    volumes();
    expect(screen.getByText(/^Avant ébullition/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Comprendre'));
    expect(screen.getByText(/7,7 L restent dans les drêches/)).toBeInTheDocument();
  });
});

describe('w1b : l’osmosée en curseur et son minimum', () => {
  it('le curseur d’osmosée et le chiffre en % commandent la même part', () => {
    const p = dilution();
    fireEvent.change(screen.getByRole('slider', { name: 'Osmosée — empâtage — curseur' }), { target: { value: '60' } });
    expect(p.set).toHaveBeenCalledWith({ diRatioPct: 60 });
    expect(screen.getByLabelText('Osmosée — empâtage')).toHaveValue('50');
    expect(screen.getByLabelText('Litres d’osmosée (Osmosée — empâtage)')).toHaveValue('14,4');
  });

  it('le bouton « Minimum trouvé d’osmosée » montre 45 % et applique applyMinimum au toucher', () => {
    const p = dilution();
    const bouton = screen.getByRole('button', { name: /Minimum trouvé d’osmosée/ });
    expect(bouton).toHaveTextContent('45 %');
    expect(bouton).toBeEnabled();
    fireEvent.click(bouton);
    expect(p.applyMinimum).toHaveBeenCalledTimes(1);
  });

  it('minimum déjà posé : « ✓ Minimum appliqué » ; jamais « Calcul… » : sans valeur, « — » et le bouton se grise', () => {
    cleanup();
    render(<WaterDilution state={{ ...baseState, diRatioPct: 45 }} onChange={vi.fn()} set={vi.fn()} totalWaterL={42.5} spargeDi={45} spargeLinked
      justEnough={juste} applyMinimum={vi.fn()} hasSparge totalOsmoseeL={19.1} totalReseauL={23.4} />);
    expect(screen.getByRole('button', { name: /Minimum trouvé d’osmosée/ })).toHaveTextContent('✓ Minimum appliqué');
    cleanup();
    render(<WaterDilution state={baseState} onChange={vi.fn()} set={vi.fn()} totalWaterL={42.5} spargeDi={50} spargeLinked
      justEnough={undefined} applyMinimum={vi.fn()} hasSparge totalOsmoseeL={21.3} totalReseauL={21.3} />);
    const b = screen.getByRole('button', { name: /Minimum trouvé d’osmosée/ });
    expect(b).toBeDisabled();
    expect(b).toHaveTextContent('—');
    expect(screen.queryByText(/Calcul…/)).not.toBeInTheDocument();
  });

  it('la phrase d’aujourd’hui (coupe en place, minimum, pourquoi) est un repli', () => {
    dilution();
    const repli = screen.getByText(/Coupe en place 50 %, minimum 45 %/).closest('details')!;
    expect(repli).not.toHaveAttribute('open');
    expect(repli).toHaveTextContent('descendre plus bas buterait sur : bicarbonate du réseau à 250 ppm');
  });
});

describe('w1b : chaque fonction de la carte reste atteinte', () => {
  it('Sels et acides suivent la recette : interrupteur visible dans la carte, sans déplier', () => {
    const p = dilution();
    const sw = screen.getByRole('switch', { name: 'Sels et acides suivent la recette' });
    expect(sw).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(sw);
    expect(p.set).toHaveBeenCalledWith({ autoTreatment: false });
  });

  it('osmosée disponible (repli), recalcul des doses manuelles, rinçage identique / à part, compromis', () => {
    const p = dilution({ justEnough: { ...juste, proposal: { volumes: { totalRoL: 19.1, tapL: 23.4 }, treatment: { treatedTotal: { mg: Number.NaN, na: Number.NaN } } } } });
    expect(screen.getByText('Osmosée disponible · sans limite')).toBeInTheDocument();
    expect(screen.getByLabelText('Osmosée disponible au total (L)')).toBeInTheDocument();
    expect(screen.getByText('Compromis de la proposition')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Rinçage réglé à part' }));
    expect(p.set).toHaveBeenCalledWith({ spargeDiRatioPct: 50 });
  });

  it('rinçage à part : un second curseur d’osmosée ; doses manuelles : « Recalculer aussi » rend la main au calcul', () => {
    const p = { set: vi.fn(), onChange: vi.fn(), applyMinimum: vi.fn() };
    render(<WaterDilution state={{ ...baseState, spargeDiRatioPct: 10, saltOverrides: { gypse: 1 } }} totalWaterL={42.5} spargeDi={10} spargeLinked={false}
      justEnough={juste} hasSparge totalOsmoseeL={21.3} totalReseauL={21.3} {...p} />);
    fireEvent.change(screen.getByRole('slider', { name: 'Osmosée — rinçage — curseur' }), { target: { value: '15' } });
    expect(p.set).toHaveBeenCalledWith({ spargeDiRatioPct: 15 });
    fireEvent.click(screen.getByRole('button', { name: 'Recalculer aussi les doses manuelles' }));
    expect(p.set).toHaveBeenCalledWith({ saltOverrides: undefined, acidOverride: undefined, autoTreatment: true });
  });

  it('Sels et acides suivent la recette : le même état qu’aujourd’hui (allumé seulement si autoTreatment est vrai), le même geste', () => {
    for (const [autoTreatment, attendu, apres] of [[undefined, 'false', true], [false, 'false', true], [true, 'true', false]] as const) {
      cleanup();
      const p = { set: vi.fn(), onChange: vi.fn(), applyMinimum: vi.fn() };
      render(<WaterDilution state={{ ...baseState, autoTreatment }} totalWaterL={42.5} spargeDi={50} spargeLinked justEnough={juste} hasSparge
        totalOsmoseeL={21.3} totalReseauL={21.3} {...p} />);
      const sw = screen.getByRole('switch', { name: 'Sels et acides suivent la recette' });
      expect(sw).toHaveAttribute('aria-checked', attendu);
      fireEvent.click(sw);
      expect(p.set).toHaveBeenCalledWith({ autoTreatment: apres });
    }
  });
});

// RC-1 : « Minimum trouvé d’osmosée » montrait « — » pour toujours quand le worker d’analyse ne répondait pas (banc Chrome à requêtes interceptées : 4 contextes sur 12).
// Le calcul lui-même coûte ~50 ms (mesuré, recette de démonstration) ; le bouton doit avoir sa valeur en moins de 2 s, worker muet compris.
class WorkerMuet {
  onmessage: unknown = null; onerror: unknown = null; onmessageerror: unknown = null;
  postMessage = vi.fn(); terminate = vi.fn();
}
function Demo() {
  const [state, setState] = React.useState<WaterState>({ styleCode: '21A', diRatioPct: 50, spargeDiRatioPct: 50, mashWaterL: 28.7, spargeWaterL: 13.8,
    doses: {}, disabled: [], acidId: 'lactique' } as WaterState);
  return <SaltSolver state={state} onChange={setState} source={DEFAULT_WATER_SOURCE} onSourceChange={() => {}} beerEbc={8.4} beerVolumeL={30}
    noSparge={false} onNoSpargeChange={() => {}}
    brew={{ style: 'IPA', totalGristKg: 8, grist: [{ name: 'Pilsner', kind: 'grain', use: 'empatage', weightKg: 8, colorEbc: 6 }], targetPh: 5.4 } as any} />;
}

describe('RC-1 : la valeur du minimum arrive en moins de 2 s, même si le worker ne répond jamais', () => {
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it('worker muet : « — » d’abord (jamais « Calcul… »), puis « 45 % » dès la course sur place (moins de 100 ms simulées), bouton actif', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    vi.stubGlobal('Worker', WorkerMuet);
    render(<Demo />);
    const bouton = () => screen.getByRole('button', { name: /Minimum trouvé d’osmosée/ });
    expect(bouton()).toHaveTextContent('—');
    expect(bouton()).toBeDisabled();
    expect(screen.queryByText(/Calcul…/)).not.toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(99); });
    expect(bouton()).toHaveTextContent('45 %');
    expect(bouton()).toBeEnabled();
    expect(screen.queryByText(/Calcul…/)).not.toBeInTheDocument();
    // Le chien de garde de 1,5 s arrête ensuite le worker muet sans rien changer à la valeur affichée.
    act(() => { vi.advanceTimersByTime(2000); });
    expect(bouton()).toHaveTextContent('45 %');
  });

  it('worker lent mais vivant (réponse à 400 ms) : la valeur est déjà là avant, et la réponse tardive ne change rien', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const lent: WorkerMuet[] = [];
    vi.stubGlobal('Worker', class extends WorkerMuet { constructor() { super(); lent.push(this); } });
    render(<Demo />);
    act(() => { vi.advanceTimersByTime(99); });
    expect(screen.getByRole('button', { name: /Minimum trouvé d’osmosée/ })).toHaveTextContent('45 %');
    const requete = lent[0].postMessage.mock.calls[0][0];
    const reponse = { kind: 'result', id: requete.id, key: requete.key, result: computeWaterAnalysis(requete.input) };
    act(() => { vi.advanceTimersByTime(300); (lent[0].onmessage as (e: unknown) => void)({ data: reponse }); });
    expect(screen.getByRole('button', { name: /Minimum trouvé d’osmosée/ })).toHaveTextContent('45 %');
  });

  it('sans Worker du tout : la valeur est là au premier rendu (calcul sur place, même résultat)', () => {
    vi.stubGlobal('Worker', undefined);
    render(<Demo />);
    expect(screen.getByRole('button', { name: /Minimum trouvé d’osmosée/ })).toHaveTextContent('45 %');
  });
});

describe('port : intitulés et pied de l’onglet Eau', () => {
  it('« Profil et pesée des sels » : pas de « & »', () => {
    vi.stubGlobal('Worker', undefined);
    render(<Demo />);
    expect(screen.getByText('Profil et pesée des sels')).toBeInTheDocument();
    expect(screen.queryByText(/Profil &/)).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('le « + » flottant se pose à droite de « Suivant » : la rangée de fin lui laisse 4,75 rem (4 rem de bouton + 0,75 rem de bord) sous 640 px, et il suit la page au-delà', () => {
    const css = readFileSync(resolve(__dirname, '../../src/ui/water/eau.css'), 'utf8');
    expect(css).toMatch(/\[data-page-end-actions\] \{ padding-right: 4\.75rem; \}/);
    expect(css).toMatch(/\.floating-actions\[data-floating-actions-docked="false"\] \{ right: max\(0\.75rem, calc\(50vw - 23.75rem\)\); \}/);
  });
});
