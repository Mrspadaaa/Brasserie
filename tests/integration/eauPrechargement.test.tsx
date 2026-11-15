import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { SaltSolver, type WaterState } from '../../src/ui/SaltSolver';
import { DEFAULT_WATER_SOURCE } from '../../src/domain/water';
import { computeWaterAnalysis } from '../../src/ui/water/computeWaterAnalysis';
import { clearPreloadedWaterAnalysis } from '../../src/ui/water/waterAnalysisCache';
import { useWaterPreload, WATER_PRELOAD_DELAY_MS } from '../../src/ui/water/useWaterPreload';

// 15.11 : « affiche maintenant 45 % en moins de 2 secondes — Ça semble assez lent ? ». L'assistant connaît la recette à l'étape d'avant :
// l'analyse de l'eau part alors, et l'onglet Eau a sa valeur dès son premier rendu (même fonction, même résultat).

const workers: FakeWorker[] = [];
/** Un worker sain : répond 20 ms après chaque demande, avec le vrai calcul. */
class FakeWorker {
  onmessage: ((e: { data: unknown }) => void) | null = null; onerror: unknown = null; onmessageerror: unknown = null;
  requests: Array<{ id: number; key: string; input: any }> = [];
  terminate = vi.fn();
  constructor() { workers.push(this); }
  postMessage(request: { id: number; key: string; input: any }) {
    this.requests.push(request);
    setTimeout(() => this.onmessage?.({ data: { kind: 'result', id: request.id, key: request.key, result: computeWaterAnalysis(request.input) } }), 20);
  }
}

const initial = { styleCode: '21A', diRatioPct: 50, spargeDiRatioPct: 50, mashWaterL: 28.7, spargeWaterL: 13.8, doses: {}, disabled: [], acidId: 'lactique' } as WaterState;
const brew = { style: 'IPA', totalGristKg: 8, grist: [{ name: 'Pilsner', kind: 'grain', use: 'empatage', weightKg: 8, colorEbc: 6 }], targetPh: 5.4 } as any;
const common = { source: DEFAULT_WATER_SOURCE, beerEbc: 8.4, beerVolumeL: 30, brew };

/** Deux étapes d'un assistant : « levure » (avant) puis « eau » (l'onglet). Le préchargement vit dans l'hôte, comme dans BrewWizard. */
function Hote({ etape, precharger = true }: { etape: 'levure' | 'eau'; precharger?: boolean }) {
  const [state, setState] = React.useState<WaterState>(initial);
  useWaterPreload({ ...common, state }, precharger && etape !== 'eau');
  return etape === 'eau'
    ? <SaltSolver {...common} state={state} onChange={setState} onSourceChange={() => {}} noSparge={false} onNoSpargeChange={() => {}} />
    : <p>étape levure</p>;
}
const bouton = () => screen.getByRole('button', { name: /Minimum trouvé d’osmosée/ });

describe('préchargement de l’analyse de l’eau', () => {
  beforeEach(() => { clearPreloadedWaterAnalysis(); workers.length = 0; vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] }); vi.stubGlobal('Worker', FakeWorker); });
  afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

  it('sans préchargement (l’état d’avant) : « — » au premier rendu de l’onglet Eau', () => {
    const vue = render(<Hote etape="levure" precharger={false} />);
    act(() => { vi.advanceTimersByTime(WATER_PRELOAD_DELAY_MS + 100); });
    vue.rerender(<Hote etape="eau" precharger={false} />);
    expect(bouton()).toHaveTextContent('—');
  });

  it('avec la recette déjà connue à l’étape d’avant : « 45 % » dès le premier rendu de l’onglet Eau, bouton actif, sans rien demander au worker de l’onglet', () => {
    const vue = render(<Hote etape="levure" />);
    expect(workers).toHaveLength(0); // rien avant la pause : une frappe ne relance pas l'analyse à chaque touche
    act(() => { vi.advanceTimersByTime(WATER_PRELOAD_DELAY_MS + 100); });
    expect(workers).toHaveLength(1);
    expect(workers[0].requests).toHaveLength(1);
    vue.rerender(<Hote etape="eau" />);
    expect(bouton()).toHaveTextContent('45 %'); // aucun temps simulé écoulé depuis le rendu de l'onglet
    expect(bouton()).toBeEnabled();
    act(() => { vi.advanceTimersByTime(10); });
    expect(bouton()).toHaveTextContent('45 %');
    expect(workers.flatMap(w => w.requests)).toHaveLength(1); // l'onglet n'a pas reposé la question
  });

  it('même résultat que le calcul de l’onglet : le préchargé égale computeWaterAnalysis de l’entrée courante', () => {
    const vue = render(<Hote etape="levure" />);
    act(() => { vi.advanceTimersByTime(WATER_PRELOAD_DELAY_MS + 100); });
    const demande = workers[0].requests[0];
    vue.rerender(<Hote etape="eau" />);
    expect(bouton()).toHaveTextContent(`${computeWaterAnalysis(demande.input).justEnough.pct} %`);
  });

  it('recette sans eau posée (volumes à zéro) : rien n’est précalculé', () => {
    function Vide() { useWaterPreload({ ...common, state: { ...initial, mashWaterL: 0, spargeWaterL: 0 } }, true); return null; }
    render(<Vide />);
    act(() => { vi.advanceTimersByTime(WATER_PRELOAD_DELAY_MS + 100); });
    expect(workers).toHaveLength(0);
  });

  it('un état d’eau sans acide connu (brouillon ancien) : le préchargement ne lève rien et ne précalcule rien', () => {
    function Ancien() { useWaterPreload({ ...common, state: { ...initial, acidId: undefined } as any }, true); return <p>ok</p>; }
    render(<Ancien />);
    act(() => { vi.advanceTimersByTime(WATER_PRELOAD_DELAY_MS + 100); });
    expect(screen.getByText('ok')).toBeInTheDocument();
    expect(workers).toHaveLength(0);
  });

  it('sans Worker du tout : pas de préchargement, l’onglet calcule sur place comme avant', () => {
    vi.stubGlobal('Worker', undefined);
    const vue = render(<Hote etape="levure" />);
    act(() => { vi.advanceTimersByTime(WATER_PRELOAD_DELAY_MS + 100); });
    vue.rerender(<Hote etape="eau" />);
    expect(bouton()).toHaveTextContent('45 %');
  });
});
