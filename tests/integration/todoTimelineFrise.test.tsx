import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { TodoTimeline } from '../../src/ui/atelier/TodoTimeline';
import { ajouterJours, enSuisse } from '../../src/domain/todoTimeline';
import { poserDate } from '../helpers/poserDate';

/** D425 (22.11) : « Nouvelle tâche » (kd4) pose sa date à la frise partagée ; le fil et la perle neuve restent, la perle suit la frise. */
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

describe('TodoTimeline : la date de la tâche se pose à la frise', () => {
  it('Quoi + un jour tiré à la frise + Poser : la tâche part à ce jour (jj.mm.aaaa), sans champ natif ni perle à glisser', () => {
    const onCreate = vi.fn();
    render(<TodoTimeline items={[]} adding onAdding={() => undefined} onCreate={onCreate} onToggle={() => undefined} onEdit={() => undefined} />);
    const feuille = within(screen.getByRole('dialog', { name: 'Poser sur le fil' }));
    expect(document.querySelector('input[type="date"]')).toBeNull();
    expect(document.querySelector('.tl-gh [role="slider"]')).toBeNull();
    fireEvent.change(feuille.getByLabelText('Quoi'), { target: { value: 'ZZ TEST — Commander les capsules' } });
    const cible = ajouterJours(new Date(), 23);
    poserDate('Date de la tâche', iso(cible));
    // la perle neuve du fil suit la frise (23 jours)
    expect(screen.getByTestId('tl-jour-pose').textContent).toMatch(/dans 23 jours/);
    fireEvent.click(feuille.getByRole('button', { name: /^Poser au / }));
    expect(onCreate).toHaveBeenCalledWith('ZZ TEST — Commander les capsules', enSuisse(cible));
  });

  it('une tâche ne se pose pas au passé : la frise revient sur aujourd’hui', () => {
    const onCreate = vi.fn();
    render(<TodoTimeline items={[]} adding onAdding={() => undefined} onCreate={onCreate} onToggle={() => undefined} onEdit={() => undefined} dateDepart={iso(ajouterJours(new Date(), 2))} />);
    const feuille = within(screen.getByRole('dialog', { name: 'Poser sur le fil' }));
    fireEvent.change(feuille.getByLabelText('Quoi'), { target: { value: 'ZZ TEST — Passé' } });
    poserDate('Date de la tâche', iso(ajouterJours(new Date(), -3)));
    fireEvent.click(feuille.getByRole('button', { name: /^Poser au / }));
    expect(onCreate).toHaveBeenCalledWith('ZZ TEST — Passé', enSuisse(new Date()));
  });
});
