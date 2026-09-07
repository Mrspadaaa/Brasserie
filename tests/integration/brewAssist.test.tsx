import React from 'react';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BrewAssist } from '../../src/ui/BrewAssist';
import { brewState, recipe } from '../fixtures/brewCompanion';
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
afterEach(cleanup);
describe('Aides intégrées : états vivants et brouillons de simulation', () => {
  it('suit un ajustement extérieur mais conserve une simulation en cours de saisie', () => {
    const r = recipe();
    let state = brewState(r);
    const step =
      state.steps.find((s) => s.id.startsWith('hop-')) ??
      state.steps.find((s) => s.id.startsWith('boil'))!;
    const props = { recipe: r, step, now: Date.now(), update: vi.fn(), onMeasure: vi.fn() };
    const view = render(<BrewAssist {...props} state={state} />);
    fireEvent.click(screen.getByText('Aide à cette étape'));
    expect(screen.getByLabelText('Ébullition totale (min)')).toHaveValue('60');
    state = { ...state, boilDurationMin: 70 };
    view.rerender(<BrewAssist {...props} state={state} />);
    expect(screen.getByLabelText('Ébullition totale (min)')).toHaveValue('70');
    fireEvent.change(screen.getByLabelText('Ébullition totale (min)'), { target: { value: '80' } });
    state = { ...state, boilDurationMin: 75 };
    view.rerender(<BrewAssist {...props} state={state} />);
    expect(screen.getByLabelText('Ébullition totale (min)')).toHaveValue('80');
    state = { ...state, boilDurationMin: 80 };
    view.rerender(<BrewAssist {...props} state={state} />);
    state = { ...state, boilDurationMin: 85 };
    view.rerender(<BrewAssist {...props} state={state} />);
    expect(screen.getByLabelText('Ébullition totale (min)')).toHaveValue('85');
  });
  it('rend visible une surchauffe dès le badge fermé et donne un geste concret', () => {
    const r = recipe(),
      s = brewState(r),
      step = s.steps[2],
      now = Date.now();
    s.readings = [{ kind: 'temperature', at: now, stepId: step.id, value: 70, unit: '°C' }];
    render(
      <BrewAssist recipe={r} state={s} step={step} now={now} update={vi.fn()} onMeasure={vi.fn()} />
    );
    expect(screen.getByText('À ajuster')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Aide à cette étape'));
    expect(screen.getByText(/Réduis ou coupe la chauffe/)).toBeInTheDocument();
  });
});
