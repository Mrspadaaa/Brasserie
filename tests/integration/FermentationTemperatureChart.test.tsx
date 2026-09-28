import React, { useState } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { FermentationTemperatureChart, type FermentationChartEdit, type FermentationChartStep } from '../../src/ui/FermentationTemperatureChart';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
beforeAll(() => {
  // jsdom has no PointerEvent: fired pointer events would otherwise lose clientX/pointerId.
  if (typeof window.PointerEvent === 'undefined') {
    class PointerEventPolyfill extends MouseEvent {
      pointerId: number; pointerType: string;
      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init); this.pointerId = init.pointerId ?? 1; this.pointerType = init.pointerType ?? 'mouse';
      }
    }
    Object.defineProperty(window, 'PointerEvent', { value: PointerEventPolyfill, configurable: true, writable: true });
  }
});

const figure = () => screen.getByRole('figure', { name: 'Calendrier des températures de fermentation' });
/** Plot geometry published by the editable chart; jsdom has no layout, so pixels equal SVG units. */
const geometry = () => {
  const svg = figure().querySelector('svg[data-plot-left]')!;
  const read = (name: string) => Number(svg.getAttribute(`data-${name}`));
  const [left, right, top, bottom, end, min, max] = ['plot-left', 'plot-right', 'plot-top', 'plot-bottom', 'scale-end-day', 'scale-min', 'scale-max'].map(read);
  return { end, dayX: (day: number) => left + day / end * (right - left), tempY: (temp: number) => bottom - (temp - min) / (max - min) * (bottom - top) };
};
const frame = () => {
  const svg = figure().querySelector('svg[data-plot-left]')!;
  return Object.fromEntries(['plot-left', 'plot-right', 'plot-top', 'plot-bottom', 'scale-end-day', 'scale-min', 'scale-max']
    .map(name => [name, svg.getAttribute(`data-${name}`)]));
};
const setJSDOMChartLayout = () => {
  const surface = figure().querySelector('.yc-chart-surface')!;
  const svg = figure().querySelector('svg[data-plot-left]')!;
  const rect = (width: number, height: number) => ({ x: 0, y: 0, left: 0, top: 0, right: width, bottom: height, width, height, toJSON: () => ({}) }) as DOMRect;
  vi.spyOn(surface, 'getBoundingClientRect').mockReturnValue(rect(400, 400));
  vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue(rect(400, Number(svg.getAttribute('height'))));
};
const handlePoint = (handle: HTMLElement) => ({
  x: Number.parseFloat(handle.style.left) / 100 * 400,
  y: Number.parseFloat(handle.style.top),
});
const astra = (): FermentationChartStep[] => [
  { kind: 'primaire', name: 'Primaire', tempC: 19, days: 4 },
  { kind: 'reposDiacetyle', name: 'Repos', tempC: 21, days: 2 },
  { kind: 'garde', name: 'Garde', tempC: 3, days: 7 },
];
function EditableHost({ initial, selected = 0, onEdit }: { initial: FermentationChartStep[]; selected?: number; onEdit: (next: FermentationChartStep[], edit: FermentationChartEdit) => void }) {
  const [steps, setSteps] = useState(initial);
  const [index, setIndex] = useState(selected);
  return <FermentationTemperatureChart steps={steps} onSelectStep={setIndex} selectedStepIndex={index}
    onStepsChange={(next, edit) => { onEdit(next, edit); setSteps(next); }} />;
}

describe('repères métier du graphe de fermentation', () => {
  it('place le jour cumulé de bascule à J10 puis la fin de consigne à J20, même à température identique', () => {
    render(<FermentationTemperatureChart steps={[
      { kind: 'primaire', name: 'Départ', tempC: 18, days: 10 },
      { kind: 'garde', name: 'Maintien', tempC: 18, days: 10 },
    ]} />);
    const chart = screen.getByRole('figure', { name: 'Calendrier des températures de fermentation' });
    expect(chart).toHaveAttribute('data-total-days', '20');
    expect(chart.querySelector('[data-transition-day="10"]')).toHaveAttribute('data-transition-kind', 'same-temperature');
    expect(chart.querySelector('[data-programme-end-day="20"]')).toBeInTheDocument();
    expect(chart).toHaveTextContent('J10 · Maintien');
    expect(chart).toHaveTextContent('Fin de consigne J20');
    // Other consumers stay read-only: no edit command and no handle.
    expect(screen.queryByRole('button', { name: 'Régler sur le graphe' })).not.toBeInTheDocument();
    expect(chart.querySelector('[data-phase-handle]')).toBeNull();
  });

  it('garde la fin du programme J19 visible quand un contact indépendant prolonge l’axe jusqu’à J21', () => {
    render(<FermentationTemperatureChart steps={[
      { kind: 'primaire', name: 'Primaire', tempC: 18, days: 11 },
      { kind: 'garde', name: 'Garde', tempC: 4, days: 8 },
    ]} contacts={[{ name: 'À cru', dayOffset: 18, contactHours: 72, temperatureC: 4 }]} />);
    const chart = screen.getByRole('figure', { name: 'Calendrier des températures de fermentation' });
    expect(chart).toHaveAttribute('data-axis-end-day', '21');
    expect(chart.querySelector('[data-transition-day="11"]')).toBeInTheDocument();
    expect(chart.querySelector('[data-programme-end-day="19"]')).toBeInTheDocument();
    expect(chart).toHaveTextContent('Fin de consigne J19');
    expect(chart).toHaveTextContent('Contact à cru J18 → J21');
  });

  it('positionne un palier de 0 j à J0 et montre le début d’un contact dont la durée est inconnue', () => {
    render(<FermentationTemperatureChart steps={[{ kind: 'ajout', name: 'Palier ponctuel', tempC: 18, days: 0 }]}
      contacts={[{ name: 'À cru', dayOffset: 2 }]} onSelectStep={() => undefined} />);
    const chart = screen.getByRole('figure', { name: 'Calendrier des températures de fermentation' });
    expect(chart).toHaveAttribute('data-total-days', '0');
    expect(chart).toHaveTextContent('Fin de consigne J0');
    expect(chart.querySelector('[data-zero-step="0"]')).toBeInTheDocument();
    expect(chart.querySelector('[data-contact-start-day="2"]')).toBeInTheDocument();
    expect(chart).toHaveTextContent('Contact à cru J2 · fin inconnue');
  });

  it('garde J10 et J20 lisibles lorsque les températures des paliers manquent', () => {
    render(<FermentationTemperatureChart steps={[
      { kind: 'primaire', name: 'Primaire', tempC: undefined, days: 10 },
      { kind: 'garde', name: 'Garde', tempC: undefined, days: 10 },
    ]} onSelectStep={() => undefined} />);
    const chart = screen.getByRole('figure', { name: 'Calendrier des températures de fermentation' });
    expect(chart).toHaveTextContent('J10 · Garde · température inconnue');
    expect(chart).toHaveTextContent('Fin de consigne J20');
    expect(screen.getByRole('button', { name: /Sélectionner le palier 2/ })).toHaveTextContent('température inconnue · 10 j prévus');
    expect(chart).not.toHaveTextContent('durée nulle');
    expect(chart.querySelector('svg')).toBeNull();
  });

  it('ne perd pas un contact J0 à durée inconnue lorsque tous les paliers valent 0 j', () => {
    render(<FermentationTemperatureChart steps={[{ kind: 'ajout', name: 'Ponctuel', tempC: 18, days: 0 }]}
      contacts={[{ name: 'Houblon', dayOffset: 0 }]} />);
    const chart = screen.getByRole('figure', { name: 'Calendrier des températures de fermentation' });
    expect(chart).toHaveAttribute('data-total-days', '0');
    expect(chart.querySelector('[data-zero-step="0"]')).toBeInTheDocument();
    expect(chart.querySelector('[data-contact-start-day="0"]')).toBeInTheDocument();
    expect(chart).toHaveTextContent('Contact à cru J0 · fin inconnue');
  });
});

describe('édition du programme sur le graphe', () => {
  it('sélectionne un palier au toucher et montre deux curseurs accessibles, chacun pour son axe', () => {
    const onEdit = vi.fn();
    render(<EditableHost initial={astra()} onEdit={onEdit} />);
    expect(screen.getByRole('figure', { name: 'Calendrier des températures de fermentation' })).toHaveAttribute('data-editing', 'true');
    expect(screen.queryByRole('button', { name: 'Régler sur le graphe' })).not.toBeInTheDocument();

    const temperature = screen.getByRole('slider', { name: 'Température du palier 1 · Primaire' });
    const duration = screen.getByRole('slider', { name: 'Durée du palier 1 · Primaire, poignée de fin' });
    expect(temperature).toHaveAttribute('data-handle-axis', 'temperature');
    expect(duration).toHaveAttribute('data-handle-axis', 'duration');
    expect(temperature).toHaveAttribute('aria-valuetext', '19 °C');
    expect(duration).toHaveAttribute('aria-valuetext', '4 j · fin J4');

    fireEvent.click(screen.getByRole('button', { name: /Sélectionner le palier 2 : Repos/ }));
    expect(screen.getByRole('slider', { name: 'Température du palier 2 · Repos' })).toHaveAttribute('data-phase-handle', '1');
    expect(screen.getByRole('slider', { name: 'Durée du palier 2 · Repos, poignée de fin' })).toHaveAttribute('data-phase-handle', '1');
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('déplace le curseur température sans changer les jours, même avec une dérive horizontale, et garde le cadre pendant le geste', () => {
    const onEdit = vi.fn();
    render(<EditableHost initial={astra()} onEdit={onEdit} />);
    setJSDOMChartLayout();
    const handle = screen.getByRole('slider', { name: 'Température du palier 1 · Primaire' });
    const { x, y } = handlePoint(handle), { tempY } = geometry(), frozen = frame();
    const dy = tempY(20.5) - tempY(19), pointerId = 31;
    fireEvent.pointerDown(handle, { pointerId, pointerType: 'touch', button: 0, clientX: x, clientY: y });
    fireEvent.pointerMove(handle, { pointerId, pointerType: 'touch', clientX: x + 18, clientY: y + dy });
    expect(frame()).toEqual(frozen);
    expect(figure().querySelector('[data-gesture-temp]')).toHaveAttribute('data-gesture-temp', '20.5');
    expect(onEdit).not.toHaveBeenCalled();
    fireEvent.pointerUp(handle, { pointerId, pointerType: 'touch', clientX: x + 18, clientY: y + dy });

    const [next, edit] = onEdit.mock.calls[0] as [FermentationChartStep[], FermentationChartEdit];
    expect(edit).toMatchObject({ index: 0, axis: 'temperature', source: 'pointer' });
    expect(next.map(step => step.tempC)).toEqual([20.5, 21, 3]);
    expect(next.map(step => step.days)).toEqual([4, 2, 7]);
    expect(figure()).toHaveAttribute('data-total-days', '13');
  });

  it('déplace la poignée durée à la fin du palier : J4 devient J6,5 et les autres valeurs restent exactes', () => {
    const onEdit = vi.fn();
    render(<EditableHost initial={astra()} onEdit={onEdit} />);
    setJSDOMChartLayout();
    const handle = screen.getByRole('slider', { name: 'Durée du palier 1 · Primaire, poignée de fin' });
    const { x, y } = handlePoint(handle), { dayX } = geometry(), frozen = frame();
    const dx = dayX(6.5) - dayX(4), pointerId = 32;
    fireEvent.pointerDown(handle, { pointerId, pointerType: 'touch', button: 0, clientX: x, clientY: y });
    fireEvent.pointerMove(handle, { pointerId, pointerType: 'touch', clientX: x + dx / 2, clientY: y + 16 });
    expect(frame()).toEqual(frozen);
    fireEvent.pointerMove(handle, { pointerId, pointerType: 'touch', clientX: x + dx, clientY: y + 16 });
    expect(frame()).toEqual(frozen);
    expect(figure()).toHaveAttribute('data-total-days', '15.5');
    expect(onEdit).not.toHaveBeenCalled();
    fireEvent.pointerUp(handle, { pointerId, pointerType: 'touch', clientX: x + dx, clientY: y + 16 });

    const [next, edit] = onEdit.mock.calls[0] as [FermentationChartStep[], FermentationChartEdit];
    expect(edit).toMatchObject({ index: 0, axis: 'duration', source: 'pointer' });
    expect(next.map(step => step.days)).toEqual([6.5, 2, 7]);
    expect(next.map(step => step.tempC)).toEqual([19, 21, 3]);
    expect(figure().querySelector('[data-transition-day="6.5"]')).toBeInTheDocument();
    expect(figure().querySelector('[data-transition-day="8.5"]')).toBeInTheDocument();
    expect(figure().querySelector('[data-programme-end-day="15.5"]')).toBeInTheDocument();
  });

  it('annule exactement une preview température par Échap et une preview durée par pointercancel', () => {
    const onEdit = vi.fn(), original = astra();
    render(<EditableHost initial={original} onEdit={onEdit} />);
    setJSDOMChartLayout();
    const values = () => screen.getAllByRole('slider').map(handle => [handle.getAttribute('data-handle-axis'), handle.getAttribute('aria-valuenow'), handle.getAttribute('aria-valuetext')]);
    const before = values();
    const temp = screen.getByRole('slider', { name: 'Température du palier 1 · Primaire' });
    const tempPoint = handlePoint(temp), { tempY, dayX } = geometry();
    const tempDy = tempY(22) - tempY(19);
    fireEvent.pointerDown(temp, { pointerId: 33, pointerType: 'touch', button: 0, clientX: tempPoint.x, clientY: tempPoint.y });
    fireEvent.pointerMove(temp, { pointerId: 33, pointerType: 'touch', clientX: tempPoint.x, clientY: tempPoint.y + tempDy });
    expect(figure().querySelector('[data-gesture-temp]')).toHaveAttribute('data-gesture-temp', '22');
    fireEvent.keyDown(temp, { key: 'Escape' });
    fireEvent.pointerUp(temp, { pointerId: 33, pointerType: 'touch', clientX: tempPoint.x, clientY: tempPoint.y + tempDy });
    expect(values()).toEqual(before);
    expect(figure().querySelector('[data-chart-readout]')).toHaveTextContent('Geste annulé · palier 1 inchangé.');
    expect(figure()).toHaveAttribute('data-total-days', '13');

    const duration = screen.getByRole('slider', { name: 'Durée du palier 1 · Primaire, poignée de fin' });
    const durationPoint = handlePoint(duration), dx = dayX(9) - dayX(4);
    fireEvent.pointerDown(duration, { pointerId: 34, pointerType: 'touch', button: 0, clientX: durationPoint.x, clientY: durationPoint.y });
    fireEvent.pointerMove(duration, { pointerId: 34, pointerType: 'touch', clientX: durationPoint.x + dx, clientY: durationPoint.y });
    expect(figure()).toHaveAttribute('data-total-days', '18');
    fireEvent.pointerCancel(duration, { pointerId: 34, pointerType: 'touch' });

    expect(onEdit).not.toHaveBeenCalled();
    expect(values()).toEqual(before);
    expect(figure()).toHaveAttribute('data-total-days', '13');
    expect(figure().querySelector('[data-transition-day="4"]')).toBeInTheDocument();
    expect(figure().querySelector('[data-transition-day="6"]')).toBeInTheDocument();
  });

  it('les flèches clavier suivent les axes : ↑ = +0,5 °C ; → = +0,5 j, sans toucher l’autre valeur', () => {
    const onEdit = vi.fn();
    render(<EditableHost initial={astra()} onEdit={onEdit} />);
    const temperature = screen.getByRole('slider', { name: 'Température du palier 1 · Primaire' });
    fireEvent.keyDown(temperature, { key: 'ArrowUp' });
    const [warmer, tempEdit] = onEdit.mock.calls[0] as [FermentationChartStep[], FermentationChartEdit];
    expect(tempEdit).toMatchObject({ axis: 'temperature', source: 'keyboard' });
    expect(warmer.map(step => [step.tempC, step.days])).toEqual([[19.5, 4], [21, 2], [3, 7]]);

    fireEvent.keyDown(screen.getByRole('slider', { name: 'Durée du palier 1 · Primaire, poignée de fin' }), { key: 'ArrowRight' });
    const [longer, dayEdit] = onEdit.mock.calls[1] as [FermentationChartStep[], FermentationChartEdit];
    expect(dayEdit).toMatchObject({ axis: 'duration', source: 'keyboard' });
    expect(longer.map(step => [step.tempC, step.days])).toEqual([[19.5, 4.5], [21, 2], [3, 7]]);
  });

  it('garde le point 0 j à J0 et ne crée aucune poignée pour une durée inconnue', () => {
    const onEdit = vi.fn();
    const punctual = render(<EditableHost initial={[{ kind: 'ajout', name: 'Prélèvement', tempC: 8, days: 0 }]} onEdit={onEdit} />);
    expect(figure()).toHaveAttribute('data-total-days', '0');
    expect(figure().querySelector('[data-zero-step="0"]')).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Température du palier 1 · Prélèvement' })).toHaveAttribute('aria-valuetext', '8 °C');
    expect(screen.getByRole('slider', { name: 'Durée du palier 1 · Prélèvement, poignée de fin' })).toHaveAttribute('aria-valuetext', '0 j · fin J0');
    expect(onEdit).not.toHaveBeenCalled();

    punctual.unmount();
    render(<EditableHost initial={[{ kind: 'primaire', name: 'Primaire', tempC: 8, days: undefined }]} onEdit={onEdit} />);
    expect(figure()).toHaveAttribute('data-total-days', 'inconnu');
    expect(figure().querySelector('[data-zero-step="0"]')).toBeNull();
    expect(figure().querySelector('[data-phase-handle]')).toBeNull();
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
    expect(within(figure()).getByRole('status')).toHaveTextContent('La fin du dernier palier reste inconnue tant que sa durée manque.');
    expect(onEdit).not.toHaveBeenCalled();
  });
});
