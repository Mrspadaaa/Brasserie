// @vitest-environment jsdom
/* T3B-5 (TE-49), vu EN LIGNE le 20.11 : la fiche Nelson Sauvin (390) disait encore, au premier plan, « Familles déclarées sur houblon brut »,
   « Descripteurs de la fiche (langue source) : White wine… », « Classe thiols Hopsteiner : forte », « Référence variété · Confiance faible ».
   Les pièces sont les vraies : la fiche Hopsteiner de Nelson Sauvin (src/data/hopManufacturerBootstrap.json), son texte tel que stocké. */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import manufacturer from '../../src/data/hopManufacturerBootstrap.json';

const state = vi.hoisted(() => ({ varieties: [] as any[], lots: [] as any[] }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
vi.mock('../../src/services/storage', () => ({ StorageService: {
  getHopVarieties: () => state.varieties, getHopLots: () => state.lots, getHopKnowledge: () => [], getHopPredictions: () => [], getHopTastings: () => [],
  isReady: () => true, importHopIndex: vi.fn(async () => 0), subscribe: () => () => {}, saveHopVariety: vi.fn(), saveHopLot: vi.fn(), saveHopKnowledge: vi.fn(),
} }));
import { HopIndexPanel } from '../../src/ui/hopIndex/HopIndexPanel';

const nelson = () => structuredClone((manufacturer as any).hopVarieties.find((v: any) => v.name === 'Nelson Sauvin'));
beforeEach(() => { state.varieties = [nelson()]; state.lots = []; });
afterEach(cleanup);

const ouvrir = () => { render(<HopIndexPanel />); fireEvent.click(screen.getByRole('button', { name: /Nelson Sauvin/ })); };
const texte = () => (document.body.textContent ?? '').replace(/\s+/g, ' ');
/** Le premier plan : tout ce qui n'est pas replié dans un « details » fermé. */
const premierPlan = () => {
  const dialogue = document.querySelector('[role="dialog"]') ?? document.body;
  const clone = dialogue.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('details:not([open])').forEach(d => [...d.children].filter(c => c.tagName !== 'SUMMARY').forEach(c => c.remove()));
  return (clone.textContent ?? '').replace(/\s+/g, ' ');
};

describe('T3B-5 — la fiche Nelson Sauvin en mots de brasseur', () => {
  it('aucun des termes du constat au premier plan', () => {
    ouvrir();
    const t = premierPlan();
    for (const mot of [/Familles déclarées/, /langue source/, /Classe thiols/, /Classe fabricant/, /Référence variété/, /Confiance faible/]) expect(t).not.toMatch(mot);
  });
  it('les arômes, les mots de la fiche et les thiols restent lisibles, avec leur valeur', () => {
    ouvrir();
    const t = premierPlan();
    expect(t).toMatch(/Arômes : Fruité, Agrumes, Épicé/);
    expect(t).toMatch(/Mots de la fiche : White wine, fruity, grape, gooseberry/);
    expect(t).toMatch(/Thiols : forte/);
    expect(t).toMatch(/Hopsteiner, 2025/);
  });
  it('l’origine des valeurs se dit une fois, en mots simples, sans perdre la fiabilité', () => {
    ouvrir();
    const t = texte();
    expect(screen.getAllByText('Valeurs de la variété', { selector: 'span' })).toHaveLength(1);
    expect(t.match(/Fiabilité faible/g)).toHaveLength(1);
  });
  it('la précaution sur les thiols reste à un toucher, sans le mot « Classe »', () => {
    ouvrir();
    const details = document.querySelector('[data-role="classe-thiols"]') as HTMLDetailsElement;
    expect(details).not.toBeNull();
    expect(details.textContent).toMatch(/ni un rendement de levure ni une intensité prédite en bière/);
    expect(details.textContent).not.toMatch(/Classe/);
  });
});
