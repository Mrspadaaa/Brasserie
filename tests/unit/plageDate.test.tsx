// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ajouterAnnees, plageDate } from '../../src/ui/plageDate';
import { ChoixDate } from '../../src/ui/ChoixDate';
import { poserDate } from '../helpers/poserDate';

/** D425 (22.11) : plage de la frise = [min(valeur, aujourd'hui − 5 ans), aujourd'hui + 5 ans], jamais bornée en dur. */
describe('plage de la frise de date (D425)', () => {
  it('sans valeur ancienne : cinq ans de part et d\'autre d\'aujourd\'hui, en lundis', () => {
    const p = plageDate('2026-11-22', '2026-11-22');
    expect(p.epoque).toBe('2021-11-22'); // lundi de la semaine du 22 nov. 2021 (un lundi)
    expect(p.dernier).toBe('2031-11-17'); // lundi de la semaine du 22 nov. 2031 (un samedi)
    expect(new Date(`${p.epoque}T00:00:00Z`).getUTCDay()).toBe(1);
    expect(new Date(`${p.dernier}T00:00:00Z`).getUTCDay()).toBe(1);
  });

  it('une pièce de 2019 élargit le bas ; une valeur vide laisse la plage par défaut', () => {
    expect(plageDate('2019-03-05', '2026-11-22').epoque).toBe('2019-03-04');
    expect(plageDate('', '2026-11-22')).toEqual(plageDate('2026-11-22', '2026-11-22'));
  });

  it('une valeur lointaine dans le futur élargit le haut', () => {
    expect(plageDate('2040-06-15', '2026-11-22').dernier).toBe('2040-06-11');
  });

  it('le 29 février d\'une année bissextile devient le 28 quatre ans sur cinq', () => {
    expect(ajouterAnnees('2028-02-29', -5)).toBe('2023-02-28');
    expect(ajouterAnnees('2028-02-29', 4)).toBe('2032-02-29');
  });

  it('au rendu : une pièce de 2024 se corrige d\'un jour au clavier de la frise, sans retomber en janv. 2025', () => {
    const onChange = vi.fn();
    render(<ChoixDate label="Date de l'achat" valeur="2024-06-12" onChange={onChange} />);
    poserDate('Date de l\'achat', '2024-06-13');
    expect(onChange).toHaveBeenCalledWith('2024-06-13');
  });

  it('au rendu : une date de 2031 (dans les cinq ans) se pose', () => {
    const onChange = vi.fn();
    render(<ChoixDate label="Date d'échéance" valeur="2026-11-22" onChange={onChange} />);
    poserDate('Date d\'échéance', '2030-02-01');
    expect(onChange).toHaveBeenCalledWith('2030-02-01');
  });
});
