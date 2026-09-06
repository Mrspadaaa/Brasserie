import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { RatioSlider } from '../../src/ui/RatioSlider';

afterEach(cleanup);
describe('Le ratio réel reste distinct de la consigne', () => {
  it.each([0.39, 0.91])('rend visible un écart de bord masqué par l’arrondi : %s', (achieved) => {
    render(<RatioSlider value={0.9} achieved={achieved} target={{ min: 0.4, max: 0.9 }} onChange={() => {}} />);
    expect(screen.getByText(achieved.toFixed(2))).toBeVisible();
    expect(screen.getByText('Profil 0.4–0.9 · hors plage')).toBeVisible();
  });
  it('Black IPA : lit 1.9 réel, sans le confondre avec la consigne 2.8', () => {
    render(
      <RatioSlider value={2.8} achieved={1.9} target={{ min: 1.5, max: 2.5 }} onChange={() => {}} />
    );
    expect(screen.getByText('1.9')).toBeVisible();
    expect(screen.getByText('Consigne 2.8')).toBeVisible();
    expect(screen.getByText('Profil 1.5–2.5')).toBeVisible();
    expect(screen.getByRole('slider')).toHaveAttribute(
      'aria-valuetext',
      expect.stringContaining('Réel 1.90')
    );
    expect(document.body.textContent).not.toMatch(/Houblonnée|Amère/);
  });
  it('Gose : 0.9 est explicitement hors du profil 0.2–0.5', () => {
    render(
      <RatioSlider
        value={0.35}
        achieved={0.9}
        followingTarget={false}
        target={{ min: 0.2, max: 0.5 }}
        onChange={() => {}}
      />
    );
    expect(screen.getByText('Profil 0.2–0.5 · hors plage')).toBeVisible();
    expect(screen.getByRole('slider')).toHaveValue('0.9');
    expect(screen.queryByText(/Consigne/)).toBeNull();
  });
  it('ne fabrique pas de ratio sur une eau sans chlorure', () => {
    render(
      <RatioSlider
        value={0.4}
        achieved={null}
        ions={{ ca: 0, mg: 0, na: 0, so4: 0, cl: 0, hco3: 0 }}
        onChange={() => {}}
      />
    );
    expect(screen.getByText('—')).toBeVisible();
    expect(screen.getByText('Eau très peu minéralisée')).toBeVisible();
    expect(screen.queryByText('0.4')).toBeNull();
  });
  it('conserve le chiffre réel au-delà du bout de la piste', () => {
    render(<RatioSlider value={20} achieved={20} followingTarget={false} onChange={() => {}} />);
    expect(screen.getByText('20.0')).toBeVisible();
    expect(screen.getByRole('slider')).toHaveValue('9');
  });
});
