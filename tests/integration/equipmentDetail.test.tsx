// @vitest-environment jsdom
// Fiche d'un appareil (za3, port 15.11) : étalonnage (virgule, écart contre la tolérance), gestes, Gestion, dépenses reliées. Valeurs de test, simulées.
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { EquipmentItem } from '../../src/types';

vi.mock('../../src/services/storage', async () => {
  const actual = await vi.importActual<typeof import('../../src/services/storage')>('../../src/services/storage');
  const base: Record<string, unknown> = { getUiState: (_k: string, f: unknown) => f, setUiState: vi.fn() };
  return { ...actual, StorageService: new Proxy(base, { get: (cible, nom: string) => nom in cible ? cible[nom] : nom.startsWith('get') ? () => [] : undefined }) };
});

const { EquipmentDetail } = await import('../../src/ui/equipment/Detail');

afterEach(cleanup);

const TODAY = '2026-11-14';
const ph: EquipmentItem = {
  id: 'EQ-ph', ref: 'EQ-ph', name: 'pH-mètre', category: 'Mesure', state: 'Bon', purchaseDate: '2025-01-10',
  rhythm: { every: 1, unit: 'mois' }, lastDone: '2026-10-11',
  history: [
    { date: '2026-10-11', kind: 'etalonnage', readings: [{ label: 'pH 7,00', expected: 7, read: 7.02 }, { label: 'pH 4,00', expected: 4, read: 4.03 }] },
  ],
};
const pompe: EquipmentItem = { id: 'EQ-p', ref: 'EQ-p', name: 'Pompe de recirculation', category: 'Brassage', state: 'À réparer', brokenSince: '2026-11-05', brokenNote: 'fuit au raccord' };
const frigo: EquipmentItem = { id: 'EQ-f', ref: 'EQ-f', name: 'Frigo levures', category: 'Stockage', state: 'Bon', task: 'Dégivrer', rhythm: { every: 1, unit: 'mois' }, lastDone: '2026-10-20' };

const rendre = (item: EquipmentItem, extra: Partial<React.ComponentProps<typeof EquipmentDetail>> = {}) => {
  const props = { onChange: vi.fn(), onClose: vi.fn(), onPayMaintenance: vi.fn(), onDelete: vi.fn() };
  render(<EquipmentDetail item={item} batches={[]} transactions={[]} today={TODAY} layout="sheet" {...props} {...extra} />);
  return props;
};

describe('Fiche d’un appareil — étalonnage', () => {
  it('dit « À étalonner · prévu le 11.11 » et saisit 7,01 puis 4,02 : écarts « +0,01 » et « +0,02 » dans la tolérance', () => {
    rendre(ph);
    expect(screen.getByText('À étalonner')).toBeInTheDocument();
    expect(screen.getByText('prévu le')).toBeInTheDocument();
    expect(screen.getByText('tolérance ±0,05')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Valeur lue pour pH 7,00'), { target: { value: '7,01' } });
    fireEvent.change(screen.getByLabelText('Valeur lue pour pH 4,00'), { target: { value: '4.02' } });
    expect(screen.getByLabelText('écart +0,01, dans la tolérance')).toHaveTextContent('+0,01');
    expect(screen.getByLabelText('écart +0,02, dans la tolérance')).toHaveTextContent('+0,02');
    expect(document.querySelector('input[type="number"]')).toBeNull();
  });

  it('une valeur hors tolérance se dit (✗) ; une saisie vide ne donne aucun écart', () => {
    rendre(ph);
    expect(screen.queryByLabelText(/^écart/)).toBeNull();
    fireEvent.change(screen.getByLabelText('Valeur lue pour pH 7,00'), { target: { value: '7,2' } });
    expect(screen.getByLabelText('écart +0,20, hors de la tolérance')).toBeInTheDocument();
  });

  it('« ✓ Étalonné » enregistre la date, l’historique et les lectures, annonce « à jour jusqu’au 14.12 » et ferme la feuille', () => {
    const { onChange, onClose } = rendre(ph);
    fireEvent.change(screen.getByLabelText('Valeur lue pour pH 7,00'), { target: { value: '7,01' } });
    fireEvent.change(screen.getByLabelText('Valeur lue pour pH 4,00'), { target: { value: '4,02' } });
    fireEvent.click(screen.getByRole('button', { name: 'Étalonné' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    const [fait, toast] = onChange.mock.calls[0];
    expect(fait.lastDone).toBe(TODAY);
    expect(fait.history).toHaveLength(2);
    expect(fait.history[1]).toEqual({ date: TODAY, kind: 'etalonnage', readings: [{ label: 'pH 7,00', expected: 7, read: 7.01 }, { label: 'pH 4,00', expected: 4, read: 4.02 }] });
    expect(toast).toBe("Étalonné · à jour jusqu'au 14.12");
    expect(ph.lastDone).toBe('2026-10-11');
    expect(onClose).toHaveBeenCalled();
  });

  it('sans valeur saisie, rien n’est inventé : l’étalonnage s’enregistre sans lectures', () => {
    const { onChange } = rendre(ph);
    fireEvent.click(screen.getByRole('button', { name: 'Étalonné' }));
    expect(onChange.mock.calls[0][0].history[1]).toEqual({ date: TODAY, kind: 'etalonnage' });
  });

  it('l’historique se lit : date, « Étalonné », lectures de la plus petite à la plus grande', () => {
    rendre(ph);
    expect(screen.getByText('4,03 · 7,02')).toBeInTheDocument();
    expect(screen.getByText('prochain, si étalonné')).toBeInTheDocument();
  });
});

describe('Fiche d’un appareil — gestes', () => {
  it('en panne : « Réparée » lève la panne', () => {
    const { onChange } = rendre(pompe);
    expect(screen.getByText('Fuit au raccord')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Réparée' }));
    const [repare, toast] = onChange.mock.calls[0];
    expect(repare.brokenSince).toBeUndefined();
    expect(repare.state).toBe('Bon');
    expect(toast).toBe('Réparée');
  });

  it('sans étalonnage : « Fait » (pas d’étapes, pas de saisie)', () => {
    const { onChange } = rendre(frigo);
    expect(screen.queryByText('rincer')).toBeNull();
    expect(screen.queryByLabelText(/Valeur lue/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Fait' }));
    expect(onChange.mock.calls[0][0].lastDone).toBe(TODAY);
    expect(onChange.mock.calls[0][1]).toBe("Fait · à jour jusqu'au 14.12");
  });

  it('rythme et état : une pastille écrit l’appareil, « À réparer » ouvre une panne datée d’aujourd’hui', () => {
    const { onChange } = rendre(frigo);
    fireEvent.click(screen.getByRole('radio', { name: '3 mois' }));
    expect(onChange.mock.calls[0][0].rhythm).toEqual({ every: 3, unit: 'mois' });
    fireEvent.click(screen.getByRole('radio', { name: 'À réparer' }));
    expect(onChange.mock.calls[1][0].brokenSince).toBe(TODAY);
    expect(onChange.mock.calls[1][0].state).toBe('À réparer');
  });

  it('« Payer un entretien » rend l’appareil à l’appelant', () => {
    const { onPayMaintenance } = rendre(ph);
    fireEvent.click(screen.getByRole('button', { name: 'Payer un entretien' }));
    expect(onPayMaintenance).toHaveBeenCalledWith(ph);
  });
});

describe('Fiche d’un appareil — Gestion', () => {
  const menu = () => fireEvent.click(screen.getByRole('button', { name: /Gestion du matériel/ }));

  it('Vendu sort l’appareil du parc, avec son historique, et ferme', () => {
    const { onChange, onClose } = rendre(ph);
    menu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Vendu' }));
    const [sorti, toast] = onChange.mock.calls[0];
    expect(sorti.retired).toEqual({ date: TODAY, reason: 'vendu' });
    expect(sorti.history.at(-1)).toEqual({ date: TODAY, kind: 'sortie', note: 'vendu' });
    expect(toast).toBe('pH-mètre · vendu');
    expect(onClose).toHaveBeenCalled();
  });

  it('Supprimer demande confirmation (nommément) avant de supprimer', () => {
    const { onDelete } = rendre(ph);
    menu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Supprimer' }));
    expect(onDelete).not.toHaveBeenCalled();
    const confirmation = screen.getByRole('dialog', { name: 'Supprimer ce matériel ?' });
    expect(within(confirmation).getByText(/pH-mètre — Mesure/)).toBeInTheDocument();
    expect(within(confirmation).getByText(/La suppression est journalisée/)).toBeInTheDocument();
    fireEvent.click(within(confirmation).getByRole('button', { name: 'Supprimer' }));
    expect(onDelete).toHaveBeenCalledWith(ph);
  });

  it('Modifier ouvre la correction (nom, catégorie, notes, achat) ; Enregistrer rend l’appareil corrigé', () => {
    const { onChange } = rendre(ph);
    menu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Modifier' }));
    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'pH-mètre de poche' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer', exact: true }));
    expect(onChange.mock.calls[0][0].name).toBe('pH-mètre de poche');
    expect(onChange.mock.calls[0][0].history).toEqual(ph.history);
  });
});

describe('Fiche d’un appareil — dépenses reliées', () => {
  it('l’achat inconnu se dit, jamais 0 CHF', () => {
    rendre({ ...ph, purchaseDate: undefined, purchasePrice: undefined });
    expect(screen.getByText('aucun prix connu')).toBeInTheDocument();
    expect(screen.getByText('date et prix inconnus')).toBeInTheDocument();
  });

  it('un achat connu : date courte et prix au centime', () => {
    rendre({ ...ph, purchaseDate: '2025-02-01', purchasePrice: 24.9 });
    expect(screen.getByText(/24,90 CHF · 1 prix connu$/)).toBeInTheDocument();
    expect(screen.getByText('01.02')).toBeInTheDocument();
  });
});

describe('Fiche d’un appareil — panneau 1280', () => {
  it('le fil de l’appareil montre le passé, aujourd’hui et le prochain', () => {
    rendre(ph, { layout: 'pane' });
    const fil = screen.getByLabelText('Le fil de l\'appareil');
    expect(within(fil).getByText('11.10')).toBeInTheDocument();
    expect(within(fil).getByText('prévu')).toBeInTheDocument();
    expect(within(fil).getByText('14.12')).toBeInTheDocument();
    expect(within(fil).getByText('prochain, si étalonné')).toBeInTheDocument();
  });

  it('dans le panneau, « Étalonné » enregistre sans fermer', () => {
    const { onChange, onClose } = rendre(ph, { layout: 'pane' });
    fireEvent.click(screen.getByRole('button', { name: 'Étalonné' }));
    expect(onChange).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('P4 — décimales : un pH-mètre se juge au centième, même avec une tolérance posée à ±0,1', () => {
  const phLarge: EquipmentItem = { ...ph, calibration: { unit: 'pH', tolerance: 0.1, points: [{ label: 'pH 7,00', expected: 7 }, { label: 'pH 4,00', expected: 4 }] } };

  it('lu 7,01 avec tolérance 0,1 → « +0,01 » (pas « +0,0 ») et « tolérance ±0,10 »', () => {
    rendre(phLarge);
    fireEvent.change(screen.getByLabelText('Valeur lue pour pH 7,00'), { target: { value: '7,01' } });
    expect(screen.getByLabelText('écart +0,01, dans la tolérance')).toHaveTextContent('+0,01');
  });

  it('l’historique garde les centièmes lus : « 4,03 · 7,02 », jamais « 4,0 · 7,0 »', () => {
    rendre(phLarge);
    expect(screen.getByText('4,03 · 7,02')).toBeInTheDocument();
    expect(screen.queryByText('4,0 · 7,0')).toBeNull();
  });

  it('le fil du panneau à 1280 dit « étalonné 4,03 · 7,02 »', () => {
    rendre(phLarge, { layout: 'pane' });
    const fil = screen.getByLabelText('Le fil de l\'appareil');
    expect(within(fil).getByText('étalonné 4,03 · 7,02')).toBeInTheDocument();
  });

  it('tolérance au centième et deux lectures ; densité au millième (valeurs lues gardées)', async () => {
    const { decimalesLecture } = await import('../../src/ui/equipment/DetailModel');
    expect(decimalesLecture({ unit: 'pH', tolerance: 0.1 }, [])).toBe(2);
    expect(decimalesLecture({ unit: 'pH', tolerance: 0.05 }, [7.01])).toBe(2);
    expect(decimalesLecture({ tolerance: 0.002 }, [1.0005])).toBe(3);
    expect(decimalesLecture({ unit: '°Bx', tolerance: 0.2 }, [0.1])).toBe(1);
  });

  it('les lignes de dépenses reliées ne retirent pas « Achat · date et prix inconnus » (P9) en panneau comme en feuille', () => {
    const tx = { id: 'T1', date: '2026-10-08', description: 'T1', category: 'materiel', amountHT: 0, tvaRate: 0, tvaAmount: 0, amountTTC: 0, proofFileName: '', proofType: '',
      finance: { version: 1, kind: 'expense', amountCents: 0, lines: [{ id: 'l1', description: 'Tampons', kind: 'service', amountCents: 2490, equipmentRef: 'EQ-ph' }] } };
    rendre({ ...ph, purchaseDate: undefined }, { layout: 'pane', transactions: [tx] as never });
    expect(screen.getByText('Achat')).toBeInTheDocument();
    expect(screen.getByText('date et prix inconnus')).toBeInTheDocument();
  });
});
