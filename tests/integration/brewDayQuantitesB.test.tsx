import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BrewDayPage } from '../../src/pages/BrewDayPage';
import { defaultConfig } from '../../src/services/storage';
import type { Batch, BrewDayState } from '../../src/types';
import { recipe, brewState } from '../fixtures/brewCompanion';
import { brewAlarms } from '../../src/domain/brewCompanion';
import { formatAmount } from '../../functions/src/brewAmount';
import { actualQuantityProblem } from '../../src/domain/brewQuantityBounds';

vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
vi.mock('../../src/services/brewAlarms', () => ({ enableBrewAlerts: vi.fn(), syncBrewAlerts: vi.fn() }));
vi.mock('../../src/services/brewTimer', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/services/brewTimer')>()),
  armAudio: () => false
}));
afterEach(() => { cleanup(); vi.clearAllMocks(); localStorage.clear(); });

function mount(over: Parameters<typeof recipe>[0] = {}) {
  const r = recipe(over);
  const save = vi.fn();
  const batch = { id: 'LOT-TEST', name: r.name, recipeSnapshot: r, brewDay: brewState(r, {}) } as Batch;
  render(<BrewDayPage batch={batch} config={defaultConfig} stockItems={[]} onClose={() => {}} onFinish={() => {}} onSave={save} />);
  return { latest: () => save.mock.calls.at(-1)?.[0].brewDay as BrewDayState | undefined };
}

describe('BR-50 / BR-53 / BE-31 / BE-34 : quantités réelles bornées, et le refus se dit', () => {
  it('« -1 » et « 99999 » ne s’enregistrent pas et affichent un message ; 15 passe', () => {
    const v = mount();
    fireEvent.click(screen.getByRole('button', { name: /Modifier la quantité de Sel d’Epsom/ }));
    const dose = screen.getByLabelText(/Quantité réelle de Sel d’Epsom/);
    fireEvent.change(dose, { target: { value: '-1' } });
    expect(screen.getByRole('alert')).toHaveTextContent(/ne peut pas être négative/);
    expect(v.latest()?.additions?.['salt-mash-epsom']?.amount).toBeUndefined();
    fireEvent.change(dose, { target: { value: '99999' } });
    expect(screen.getByRole('alert')).toHaveTextContent(/erreur de saisie probable/);
    expect(v.latest()?.additions?.['salt-mash-epsom']?.amount).toBeUndefined();
    fireEvent.change(dose, { target: { value: '15' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(v.latest()!.additions!['salt-mash-epsom'].amount).toBe(15);
  });
});

describe('VI-9 (rejeu b47cd90b n° 9) : « 99999 » tapé chiffre par chiffre garde vraiment la valeur précédente', () => {
  it('le message dit « conservée » : après 9, 99, 999… 99999 la recette garde 1 g, la ligne n’affiche ni 99 g ni écart', () => {
    const v = mount();
    fireEvent.click(screen.getByRole('button', { name: /Modifier la quantité de Sel d’Epsom/ }));
    const dose = screen.getByLabelText(/Quantité réelle de Sel d’Epsom/) as HTMLInputElement;
    dose.focus();
    for (const frappe of ['9', '99', '999', '9999', '99999']) fireEvent.change(dose, { target: { value: frappe } });
    const alerte = screen.getByRole('alert');
    expect(alerte).toHaveTextContent(/erreur de saisie probable/);
    expect(alerte).toHaveTextContent(/La valeur précédente \(1 g\) est conservée/);
    // Ce que le message annonce : rien de « 99 » n'est resté dans la séance.
    expect(v.latest()?.additions?.['salt-mash-epsom']?.amount).toBeUndefined();
    expect(screen.queryByText(/Écart/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Modifier la quantité de Sel d’Epsom/ })).toHaveTextContent(/^1\s*g/);
    // À la sortie du champ, il relit la valeur retenue, pas le « 99999 » tapé.
    fireEvent.blur(dose);
    expect(dose.value).toBe('1');
  });
  it('une valeur déjà consignée est restaurée, pas effacée', () => {
    const v = mount();
    fireEvent.click(screen.getByRole('button', { name: /Modifier la quantité de Sel d’Epsom/ }));
    const dose = screen.getByLabelText(/Quantité réelle de Sel d’Epsom/) as HTMLInputElement;
    dose.focus();
    fireEvent.change(dose, { target: { value: '4' } });
    fireEvent.blur(dose);
    expect(v.latest()!.additions!['salt-mash-epsom'].amount).toBe(4);
    for (const frappe of ['9', '99', '999', '9999', '99999']) fireEvent.change(dose, { target: { value: frappe } });
    expect(screen.getByRole('alert')).toHaveTextContent(/La valeur précédente \(4 g\) est conservée/);
    expect(v.latest()!.additions!['salt-mash-epsom'].amount).toBe(4);
    fireEvent.change(dose, { target: { value: '5' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(v.latest()!.additions!['salt-mash-epsom'].amount).toBe(5);
  });
});

describe('VI-8 (rejeu b47cd90b n° 8) : le panneau d’ajustement se lit', () => {
  it('« Consigner à cette heure » éteint porte la classe d’action ; la date valide l’allume ; « Maintenant » consigne en un geste, sans phrase d’aide (p3, n° 6)', () => {
    const v = mount();
    fireEvent.click(screen.getByRole('button', { name: /Modifier la quantité de Sel d’Epsom/ }));
    const bouton = screen.getByRole('button', { name: 'Consigner à cette heure' });
    expect(bouton).toBeDisabled();
    expect(bouton).toHaveClass('brew-consign');
    expect(screen.queryByText(/Choisis d’abord la date/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Date et heure réelles d’ajout de Sel d’Epsom/), { target: { value: '2020-01-02T10:30' } });
    expect(bouton).toBeEnabled();
    expect(screen.queryByText(/Choisis d’abord la date/)).not.toBeInTheDocument();
    expect(v.latest()?.additions?.['salt-mash-epsom']?.doneAt).toBeUndefined();
    fireEvent.click(screen.getByRole('button', { name: 'Maintenant' }));
    expect(v.latest()!.additions!['salt-mash-epsom'].doneAt).toBeGreaterThan(0);
    expect(screen.getByRole('checkbox', { name: /Ajouté : Sel d’Epsom/ })).toBeChecked();
  });
  it('la valeur tapée est centrée sur l’axe du « g » : hauteur de ligne = hauteur du champ (le champ tactile est un textarea)', async () => {
    const { readFileSync } = await import('node:fs');
    const css = readFileSync(`${process.cwd()}/src/pages/brew-day.css`, 'utf8');
    const champ = css.match(/\.brew-dose-value :is\(input, textarea:where\(\[data-single-line\]\)\) \{([^}]*)\}/g) ?? [];
    const hauteur = champ.join(' ').match(/(?<![-\w])height:\s*(\d+)px/)?.[1];
    const ligne = champ.join(' ').match(/line-height:\s*(\d+)px/)?.[1];
    expect(hauteur).toBeDefined();
    expect(ligne).toBe(hauteur);
  });
});

describe('BR-52 / BE-33 : pas de sélecteur vide', () => {
  it('sans plan d’eau, le « + » de l’eau n’ouvre pas une liste vide : il n’est pas proposé', () => {
    mount({ waterPlan: undefined });
    expect(screen.queryByRole('button', { name: /Ajouter un produit/ })).not.toBeInTheDocument();
  });
  it('avec un plan d’eau, le sélecteur reste', () => {
    mount();
    expect(screen.getAllByRole('button', { name: /Ajouter un produit/ }).length).toBeGreaterThan(0);
  });
});

describe('BR-55 / BE-36 : le bandeau d’alarme écrit la quantité lisible', () => {
  it('« Ajout en cuve » dit « 123 g Lactose », pas « 0.12345 kg »', () => {
    const base = recipe();
    const r = { ...base, fermentables: [...(base.fermentables ?? []), { name: 'Lactose', kind: 'sugar', weightKg: 0.12345, use: 'ebullition', colorEbc: 0 }] } as typeof base;
    const alarm = brewAlarms(brewState(r, { boilStartedAt: Date.now() }), r).find((a) => a.title === 'Ajout en cuve' && /Lactose/.test(a.body));
    expect(alarm?.body).toContain('123 g Lactose');
    expect(alarm?.body).not.toMatch(/\d\.\d/);
  });
});

describe('bornes et écriture des quantités (pur)', () => {
  it('plancher par unité et cinq fois le prévu', () => {
    expect(actualQuantityProblem(99999, 3, 'g')).toMatch(/au-delà de 500 g/);
    expect(actualQuantityProblem(400, 3, 'g')).toBeNull();
    expect(actualQuantityProblem(99999, 16, 'L')).toMatch(/au-delà de 200 L/);
    expect(actualQuantityProblem(250, 100, 'g')).toBeNull();
    expect(actualQuantityProblem(0, 100, 'g')).toBeNull();
    expect(actualQuantityProblem(-1, 100, 'g')).toMatch(/négative/);
  });
  it('BR-55 / BR-56 : 0.12345 kg s’écrit « 123 g », jamais de point ni 5 décimales', () => {
    expect(formatAmount(0.12345, 'kg')).toBe('123 g');
    expect(formatAmount(2.5, 'kg')).toBe('2,5 kg');
    expect(formatAmount(16.494, 'L')).toBe('16,5 L');
    expect(formatAmount(1.2371, 'g')).toBe('1,24 g');
    expect(formatAmount(Number.NaN, 'g')).toBe('— g');
  });
});
