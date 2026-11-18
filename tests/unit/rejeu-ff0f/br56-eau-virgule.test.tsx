// @vitest-environment jsdom
// Rejeu en ligne ff0f822e (08.11), BR-56 : panneau « La bonne eau » d'un brassin : « 33.6 L au total », « 16.8 L osmosée + 16.8 L réseau » au point décimal.
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BrewAssist } from '../../../src/ui/BrewAssist';
import { roundFr } from '../../../src/domain/brewAssist';
import { brewState, recipe } from '../../fixtures/brewCompanion';

vi.mock('../../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
afterEach(cleanup);

describe('BR-56 — « La bonne eau » écrit les litres à la virgule', () => {
  it('roundFr arrondit comme round et écrit la virgule', () => {
    expect(roundFr(33.6)).toBe('33,6'.replace(',', ',') );
    expect(roundFr(16.84)).toBe('16,8');
    expect(roundFr(5)).toBe('5');
  });

  it('le panneau ne montre aucun nombre décimal au point', () => {
    const r = recipe({ waterPlan: { ...recipe().waterPlan!, mashWaterL: 33.6, diRatioPct: 50 } });
    const state = brewState(r);
    const step = state.steps.find((s) => s.id === 'eau' || s.id === 'sparge');
    expect(step).toBeTruthy();
    render(<BrewAssist recipe={r} state={state} step={step!} now={Date.now()} update={vi.fn()} onMeasure={vi.fn()} />);
    fireEvent.click(screen.getByText('Aide à cette étape'));
    const texte = document.body.textContent ?? '';
    expect(texte).toMatch(/33,6 L au total/);
    expect(texte).toMatch(/16,8 L osmosée \+ 16,8 L réseau/);
    expect(texte).not.toMatch(/\d\.\d+ L/);
  });
});
