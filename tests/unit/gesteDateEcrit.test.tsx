// @vitest-environment jsdom
// GESTE-DATE-PARTOUT (22.11) : une date glissée à la frise doit être ÉCRITE. Test commun : glisser → onChange → valeur relue.
// GESTE-MATERIEL-UNDEFINED : la fiche matériel gardait « 18.10 » après Enregistrer ; l'écriture partait sous la clé « undefined » (matériel sans `ref`).
import React, { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { poserDate, zoneDate } from '../helpers/poserDate';

const state = vi.hoisted(() => ({ rows: new Map<string, any>() }));
vi.mock('../../src/services/firestoreRepo', () => ({ FirestoreRepo: {
  all: (name: string) => [...state.rows.entries()].filter(([path]) => path.startsWith(`${name}/`)).map(([path, value]) => ({ ...structuredClone(value), __docId: path.slice(name.length + 1) })),
  put: (name: string, id: string, value: any) => { state.rows.set(`${name}/${id}`, structuredClone(value)); },
  remove: (name: string, id: string) => { state.rows.delete(`${name}/${id}`); },
  startSync: () => {}, isReady: () => true, subscribe: () => () => {}, clearMemoryCache: () => state.rows.clear()
} }));

import { StorageService } from '../../src/services/storage';
import { DateField } from '../../src/ui/DateField';
import { ChoixDate } from '../../src/ui/ChoixDate';
import { EquipmentEditSheet } from '../../src/ui/equipment/DetailEdit';
import type { EquipmentItem } from '../../src/types';

beforeEach(() => { state.rows.clear(); });

const appareil = (extra: Partial<EquipmentItem> = {}): EquipmentItem => ({ id: 'E-T', ref: 'E-T', name: 'Fermenteur test', category: 'Brassage', state: 'Bon', purchaseDate: '2025-10-18', ...extra });

describe('un jour glissé à la frise est écrit', () => {
  it('ChoixDate : le jour posé sort en AAAA-MM-JJ', () => {
    const onChange = vi.fn();
    const Cadre = () => { const [v, setV] = useState('2025-10-18'); return <ChoixDate label="Jour test" valeur={v} onChange={(d) => { onChange(d); setV(d); }} />; };
    render(<Cadre />);
    poserDate('Jour test', '2025-10-14');
    expect(onChange).toHaveBeenLastCalledWith('2025-10-14');
    expect(zoneDate('Jour test').getAttribute('data-valeur')).toBe('2025-10-14');
  });

  it('DateField : le jour posé sort au format suisse JJ.MM.AAAA', () => {
    const onChange = vi.fn();
    const Cadre = () => { const [v, setV] = useState('18.10.2025'); return <DateField label="Date test" value={v} shortcuts={[]} onChange={(d) => { onChange(d); setV(d); }} />; };
    render(<Cadre />);
    poserDate('Date test', '2025-10-14');
    expect(onChange).toHaveBeenLastCalledWith('14.10.2025');
    expect(zoneDate('Date test').getAttribute('data-valeur')).toBe('2025-10-14');
  });

  it('fiche matériel : glisser « Date d’achat » puis Enregistrer remet l’appareil avec le jour posé', () => {
    const onSave = vi.fn();
    render(<EquipmentEditSheet item={appareil()} onClose={() => {}} onSave={onSave} />);
    poserDate('Date d’achat', '2025-10-14');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0]).toMatchObject({ ref: 'E-T', purchaseDate: '14.10.2025' });
  });

  it('matériel sans `ref` (document gardé sous son id) : la lecture rend la ref, l’écriture retombe sur le même document', () => {
    state.rows.set('equipment/E-ZZ', { id: 'E-ZZ', name: 'Sans ref', category: 'Fermentation', purchaseDate: '2025-10-18' });
    const [lu] = StorageService.getStocks().equipment;
    expect(lu.ref).toBe('E-ZZ');
    StorageService.updateEquipment({ ...lu, purchaseDate: '14.10.2025' });
    expect([...state.rows.keys()].filter(k => k.startsWith('equipment/'))).toEqual(['equipment/E-ZZ']);
    expect(state.rows.get('equipment/E-ZZ').purchaseDate).toBe('14.10.2025');
  });
});
