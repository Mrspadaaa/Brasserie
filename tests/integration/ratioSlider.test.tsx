import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { RatioSlider } from '../../src/ui/RatioSlider';

const ions = (so4: number, cl: number) => ({ ca: 0, mg: 0, na: 0, hco3: 0, so4, cl });
const obtained = () => screen.getByLabelText('Rapport obtenu');
const setting = () => screen.getByLabelText('Rapport réglé');
const slider = () => screen.getByRole('slider', { name: 'SO₄ ⇄ Cl' });
const marker = () => document.querySelector('[data-ratio-obtained]');
afterEach(cleanup);

describe('Le réglage et le rapport obtenu restent distincts', () => {
  it.each([0.39, 0.91])('rend visible un écart de bord masqué par l’arrondi : %s', achieved => {
    render(<RatioSlider value={0.9} achieved={achieved} target={{ min: 0.4, max: 0.9 }} onChange={() => {}} />);
    expect(obtained()).toHaveTextContent(String(achieved).replace('.', ','));
    expect(screen.getByText('Profil 0,4–0,9 · obtenu hors plage')).toBeVisible();
    expect(marker()).toHaveAttribute('data-ratio', String(achieved));
  });

  it('Ttt affiche 75,9 / 93,6 = 0,81 avec un réglage distinct à 0,7', () => {
    render(<RatioSlider value={0.7} achieved={0.7} ions={ions(75.9, 93.6)} target={{ min: 0.4, max: 0.9 }} onChange={() => {}} />);
    expect(setting()).toHaveTextContent('0,7');
    expect(obtained()).toHaveTextContent('0,81');
    expect(screen.getByLabelText('Concentrations du rapport')).toHaveTextContent('SO₄ 75,9 ppm · Cl 93,6 ppm');
    expect(slider()).toHaveAttribute('aria-valuenow', '0.7');
    expect(slider()).toHaveValue('0.7');
    expect(Number(marker()!.getAttribute('data-ratio'))).toBeCloseTo(75.9 / 93.6, 10);
    expect(screen.getByText(/rapport différent du réglage/)).toBeVisible();
  });

  it('Black IPA lit 1,9 obtenu et 2,8 réglé sans promesse d’IBU', () => {
    render(<RatioSlider value={2.8} achieved={1.9} target={{ min: 1.5, max: 2.5 }} onChange={() => {}} />);
    expect(obtained()).toHaveTextContent('1,9');
    expect(setting()).toHaveTextContent('2,8');
    expect(slider()).toHaveAttribute('aria-valuetext', expect.stringContaining('Obtenu 1,9'));
    expect(document.body.textContent).not.toMatch(/Houblonnée|Amère/);
  });

  it('une dose manuelle initialise le réglage depuis le résultat sans effacer son repère exact', () => {
    render(<RatioSlider value={0.35} achieved={0.91} followingTarget={false} target={{ min: 0.2, max: 0.5 }} onChange={() => {}} />);
    expect(obtained()).toHaveTextContent('0,91');
    expect(setting()).toHaveTextContent('0,91');
    expect(slider()).toHaveAttribute('step', 'any');
    expect(slider()).toHaveAttribute('aria-valuenow', '0.91');
    expect(slider()).toHaveValue('0.91');
    expect(marker()).toHaveAttribute('data-ratio', '0.91');
    expect(screen.getByText(/initialisé depuis les doses actuelles/)).toBeVisible();
  });

  it('conserve un réglage sur une eau 0 / 0 sans inventer de rapport obtenu', () => {
    render(<RatioSlider value={0.4} achieved={null} ions={ions(0, 0)} onChange={() => {}} />);
    expect(setting()).toHaveTextContent('0,4');
    expect(obtained()).toHaveTextContent('Indéfini');
    expect(screen.getByText('Sulfate et chlorure absents')).toBeVisible();
    expect(marker()).toBeNull();
  });

  it('annonce un réglage non atteint en présence de sulfate sans chlorure', () => {
    render(<RatioSlider value={0.7} ions={ions(80, 0)} target={{ min: 0.4, max: 0.9 }} onChange={() => {}} />);
    expect(setting()).toHaveTextContent('0,7');
    expect(obtained()).toHaveTextContent('Sans chlorure');
    expect(Number(marker()!.getAttribute('data-ratio'))).toBe(Infinity);
    expect(screen.getByText(/rapport différent du réglage/)).toBeVisible();
    expect(screen.getByText(/obtenu hors plage/)).toBeVisible();
  });

  it('un profil sans chlorure place son réglage au bord sans afficher Infinity', () => {
    render(<RatioSlider value={Infinity} ions={ions(80, 0)} onChange={() => {}} />);
    expect(setting()).toHaveTextContent('Sans chlorure');
    expect(obtained()).toHaveTextContent('Sans chlorure');
    expect(slider()).toHaveValue('9');
    expect(slider()).not.toHaveAttribute('aria-valuetext', expect.stringContaining('Infinity'));
  });

  it('conserve le résultat au-delà de la piste sans l’utiliser comme valeur maximale', () => {
    render(<RatioSlider value={20} achieved={20} followingTarget={false} onChange={() => {}} />);
    expect(obtained()).toHaveTextContent('20');
    expect(slider()).toHaveValue('9');
    expect(slider()).toHaveAttribute('aria-valuenow', '9');
    expect(screen.getByText(/Rapport obtenu au-delà de la piste/)).toBeVisible();
    expect(setting()).toHaveTextContent('20');
  });

  it('ne masque pas un dépassement de 0,004 et classe l’orientation avant arrondi', () => {
    const view = render(<RatioSlider value={0.9} achieved={0.9} ions={ions(90.4, 100)} target={{ min: 0.4, max: 0.9 }} onChange={() => {}} />);
    expect(obtained()).toHaveTextContent('0,904');
    expect(screen.getByText(/obtenu hors plage/)).toBeVisible();
    view.rerender(<RatioSlider value={0.8} ions={ions(79.6, 100)} onChange={() => {}} />);
    expect(obtained()).toHaveTextContent('0,796');
    expect(screen.getByText('Côté rond')).toBeVisible();
    expect(screen.queryByText('SO₄ et Cl proches')).toBeNull();
  });

  it('ne qualifie pas toute l’eau de peu minéralisée avec Ca 200 et SO₄/Cl faibles', () => {
    render(<RatioSlider value={1} ions={{ ...ions(10, 10), ca: 200, hco3: 400 }} onChange={() => {}} />);
    expect(screen.getByText('Sulfate et chlorure faibles')).toBeVisible();
    expect(document.body.textContent).not.toMatch(/eau.*peu minéralisée/i);
  });

  it('conserve les unités du ratio dans le contrôle natif sans changer le résultat avant réception', () => {
    const changes: number[] = [];
    render(<RatioSlider value={1} achieved={1} onChange={ratio => changes.push(ratio)} />);
    fireEvent.change(slider(), { target: { value: '0.35' } });
    expect(changes).toEqual([0.35]);
    expect(obtained()).toHaveTextContent('1');
  });

  it('les flèches changent le ratio de 0,05 et Home/End respectent les bornes', () => {
    const changes: number[] = [];
    render(<RatioSlider value={1} achieved={1} onChange={ratio => changes.push(ratio)} />);
    for (const key of ['ArrowRight', 'ArrowLeft', 'Home', 'End']) fireEvent.keyDown(slider(), { key });
    expect(changes).toEqual([1.05, 0.95, 0, 9]);
    expect(slider()).toHaveAttribute('aria-valuemin', '0');
    expect(slider()).toHaveAttribute('aria-valuemax', '9');
  });

  it('ne confond pas un réglage seul avec une analyse disponible', () => {
    render(<RatioSlider value={1} onChange={() => {}} />);
    expect(obtained()).toHaveTextContent('Indéfini');
    expect(marker()).toBeNull();
  });
});
