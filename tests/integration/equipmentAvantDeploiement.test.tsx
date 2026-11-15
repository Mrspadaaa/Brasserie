// @vitest-environment jsdom
// Matériel, 3e correction avant déploiement (voie c3, verdict 059a8511) : chaque correction de logique, rouge avant, vert après. Valeurs simulées.
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { EquipmentItem } from '../../src/types';

vi.mock('../../src/services/storage', async () => {
  const actual = await vi.importActual<typeof import('../../src/services/storage')>('../../src/services/storage');
  const base: Record<string, unknown> = { getUiState: (_k: string, f: unknown) => f, setUiState: vi.fn() };
  return { ...actual, StorageService: new Proxy(base, { get: (cible, nom: string) => nom in cible ? cible[nom] : nom.startsWith('get') ? () => [] : undefined }) };
});

const { EquipmentDetail } = await import('../../src/ui/equipment/Detail');
const { NewEquipment } = await import('../../src/ui/equipment/NewEquipment');
const { filPanneau, etiquetteTampon } = await import('../../src/ui/equipment/DetailModel');
const { equipmentStatus } = await import('../../src/domain/equipment');

afterEach(cleanup);

const TODAY = '2026-11-14';
const lectures = (a: number, b: number) => [{ label: 'pH 7,00', expected: 7, read: a }, { label: 'pH 4,00', expected: 4, read: b }];
const quatre = [
  { date: '2026-07-08', kind: 'etalonnage' as const, readings: lectures(7.03, 4.05) },
  { date: '2026-08-10', kind: 'etalonnage' as const, readings: lectures(6.98, 4.02) },
  { date: '2026-09-12', kind: 'etalonnage' as const, readings: lectures(7.05, 4.04) },
  { date: '2026-10-11', kind: 'etalonnage' as const, readings: lectures(7.02, 4.03) },
];
const ph: EquipmentItem = { id: 'EQ-ph', ref: 'EQ-ph', name: 'pH-mètre', category: 'Mesure', state: 'Bon', task: 'Étalonner', rhythm: { every: 1, unit: 'mois' }, lastDone: '2026-10-11', history: quatre };
const phAJour: EquipmentItem = { ...ph, lastDone: TODAY, history: [...quatre, { date: TODAY, kind: 'etalonnage', readings: lectures(7.01, 4.02) }] };
const pompe: EquipmentItem = { id: 'EQ-p', ref: 'EQ-p', name: 'Pompe de recirculation', category: 'Brassage', state: 'À réparer', brokenSince: '2026-11-05', brokenNote: 'fuit au raccord' };

const rendre = (item: EquipmentItem, layout: 'sheet' | 'pane' = 'sheet') => {
  const props = { onChange: vi.fn(), onClose: vi.fn(), onPayMaintenance: vi.fn(), onDelete: vi.fn() };
  render(<EquipmentDetail item={item} batches={[]} transactions={[]} today={TODAY} layout={layout} {...props} />);
  return props;
};

describe('3 — un appareil à jour ne redemande pas son étalonnage', () => {
  it('à jour : ni formulaire ni « Étalonné » ; « Étalonner quand même » les rouvre', () => {
    rendre(phAJour);
    expect(screen.queryByLabelText(/Valeur lue/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Étalonné' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Étalonner quand même' }));
    expect(screen.getByLabelText('Valeur lue pour pH 7,00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Étalonné' })).toBeInTheDocument();
  });
  it('à étalonner : le formulaire et « Étalonné » restent là', () => {
    rendre(ph);
    expect(screen.getByLabelText('Valeur lue pour pH 7,00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Étalonné' })).toBeInTheDocument();
  });
});

describe('5 — l’historique complet', () => {
  it('quatre étalonnages = quatre lignes, chacune avec ses lectures', () => {
    rendre(ph);
    for (const d of ['11.10', '12.09', '10.08', '08.07']) expect(screen.getByText(d)).toBeInTheDocument();
    expect(screen.getByText('4,05 · 7,03')).toBeInTheDocument();
  });
});

describe('6 — « pH 7,00 »', () => {
  it('l’étiquette se lit sur la valeur attendue, même pour un étalonnage enregistré « pH 7 »', () => {
    expect(etiquetteTampon({ label: 'pH 7', expected: 7 }, 'pH')).toBe('pH 7,00');
    expect(etiquetteTampon({ label: 'pH 4', expected: 4 }, 'pH')).toBe('pH 4,00');
    expect(etiquetteTampon({ label: 'Eau 1,000', expected: 1 }, undefined)).toBe('Eau 1,000');
    const enregistre: EquipmentItem = { ...ph, calibration: { points: [{ label: 'pH 7', expected: 7 }, { label: 'pH 4', expected: 4 }], tolerance: 0.05, unit: 'pH' } };
    rendre(enregistre);
    expect(screen.getByLabelText('Valeur lue pour pH 7,00')).toBeInTheDocument();
  });
});

describe('8 — le menu ⋯ et le focus', () => {
  it('au toucher ou à la souris (detail 1) : le focus va au menu, pas à « Modifier » ; au clavier : à « Modifier »', () => {
    rendre(ph);
    const bouton = screen.getByRole('button', { name: /Gestion du matériel : modifier/ });
    fireEvent.click(bouton, { detail: 1 });
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(document.activeElement).not.toBe(screen.getByRole('menuitem', { name: 'Modifier' }));
    fireEvent.click(bouton, { detail: 1 }); // referme
    fireEvent.click(bouton, { detail: 0 });
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Modifier' }));
  });
});

describe('10 — « Dernier fait » seulement avec un entretien', () => {
  const monter = () => render(<NewEquipment open today={TODAY} refs={[]} onClose={vi.fn()} onAdd={vi.fn()} onBuy={vi.fn()} />);
  it('Entretien « aucun » : pas de « Dernier fait » ; « mois » le montre', () => {
    monter();
    expect(screen.queryByLabelText('Dernier fait')).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: 'Entretien : mois' }));
    expect(screen.getByLabelText('Dernier fait')).toBeInTheDocument();
  });
});

describe('11 et 12 — le fil de la pompe', () => {
  it('1280 : la panne (cause, 05.11) et « Réparer » aujourd’hui sont des points du fil', () => {
    const fil = filPanneau(pompe, equipmentStatus(pompe, { today: TODAY, batches: [] }), TODAY, 2, false);
    expect(fil.points.map(p => [p.date, p.texte, p.style])).toEqual([['2026-11-05', 'fuit au raccord', 'panne'], [TODAY, 'Réparer', 'jour']]);
    expect(fil.points[0].y).toBeLessThan(fil.points[1].y);
  });
  it('390 : « fuit au raccord » n’est écrit qu’une fois, et la panne a son point du 05.11', () => {
    rendre(pompe);
    expect(screen.getAllByText(/fuit au raccord/i)).toHaveLength(1);
    expect(screen.getByText('En panne')).toBeInTheDocument();
    expect(screen.getAllByText('05.11')).toHaveLength(2); // « depuis le 05.11 » du titre et le point du fil
  });
});
