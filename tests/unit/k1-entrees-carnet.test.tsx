// @vitest-environment jsdom
import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

/* k1 (21.11, mission carnet-tour3) : les entrées du Carnet qui restaient après h1.
   - ⌘K : taper « atelier », « carnet » ou « idée » propose le Carnet (h1w : « atelier » ne rendait que deux écritures, « Atelier R&D »
     « 0 résultat ») ; une destination absente quand on tape est un défaut.
   - Calendrier : une fête et un événement d'agenda restent au Calendrier (leur feuille), jamais le Carnet ni l'ancien « À faire ».
   Aucune donnée réelle, aucune IA. */

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));

import { destinationsPourRequete } from '../../src/components/recherche/modele';
import { CommandPalette, type CommandGroup } from '../../src/ui/CommandPalette';
import { BancCalendrier, etatBrasseur } from '../../src/design/CalendrierPreview';
import type { CreativeItem } from '../../src/types';
import { plusMenuFor } from '../../src/domain/plusEcran';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('k1 · ⌘K propose le Carnet quand on tape', () => {
  it('« atelier », « carnet », « idée », « Atelier R&D » : la destination atelier ; une lettre : rien', () => {
    for (const q of ['atelier', 'carnet', 'Carnets', 'idée', 'idee', 'Atelier R&D', 'projets', 'r&d']) expect(destinationsPourRequete(q)[0]?.id, q).toBe('atelier');
    expect(destinationsPourRequete('a')).toEqual([]);
    expect(destinationsPourRequete('zzqq')).toEqual([]);
  });

  const LOYER: CommandGroup[] = [{ heading: 'Écritures', items: [
    { id: 'ecriture:loyer', label: 'Loyer de l’atelier', detail: '20.11', valeur: '400,00 CHF', onSelect: vi.fn() }
  ] }];
  const MENU = plusMenuFor('dashboard');
  function Harness({ onAllerA, groups = LOYER }: { onAllerA: (id: string) => void; groups?: CommandGroup[] }) {
    const [open, setOpen] = useState(true);
    return <CommandPalette open={open} onOpenChange={setOpen} groups={groups} menu={MENU} onAllerA={onAllerA as never} />;
  }

  it('téléphone, « atelier » : « Aller à · Carnet · Atelier R&D » avant « Loyer de l’atelier » ; le toucher mène à l’atelier', () => {
    const aller = vi.fn();
    render(<Harness onAllerA={aller} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'atelier' } });
    const dest = screen.getByRole('option', { name: /Aller à · Carnet · Atelier R&D/ });
    expect(screen.getByRole('option', { name: /Loyer de l’atelier/ })).toBeTruthy();
    fireEvent.click(dest);
    expect(aller).toHaveBeenCalledWith('atelier');
  });

  it('téléphone, « carnet » sans aucune donnée : la destination, pas « Rien pour »', () => {
    const aller = vi.fn();
    render(<Harness onAllerA={aller} groups={[]} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'carnet' } });
    expect(screen.queryByText(/Rien pour/)).toBeNull();
    fireEvent.click(screen.getByRole('option', { name: /Aller à · Carnet/ }));
    expect(aller).toHaveBeenCalledWith('atelier');
  });

  it('1280, « Atelier R&D » : la destination est choisie d’office, Entrée y va', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((q: string) => ({ matches: q.includes('min-width: 1024px'), media: q, onchange: null,
      addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false }) as MediaQueryList);
    const aller = vi.fn();
    render(<Harness onAllerA={aller} />);
    const champ = screen.getByRole('combobox');
    fireEvent.change(champ, { target: { value: 'Atelier R&D' } });
    const dest = screen.getByRole('option', { name: /Aller à · Carnet · Atelier R&D/ });
    expect(dest.getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(champ, { key: 'Enter' });
    expect(aller).toHaveBeenCalledWith('atelier');
  });
});

describe('k1 · Calendrier : la fête et l’agenda restent au Calendrier', () => {
  const JOUR = '2026-11-16';

  it('feuille d’une fête : pas de « Plus de détails › » (elle n’a pas d’autre écran ; le nom et le montant restent dans la feuille)', () => {
    const fete = vi.fn();
    render(<BancCalendrier aujourdhui={JOUR} sansChrome callbacks={{ onPoserFete: fete }} />);
    fireEvent.click(document.querySelector('button[data-plus="fetes"]')!);
    const d = within(screen.getByRole('dialog', { name: 'Fêtes' }));
    // D404 : à l'ajout, plus de carrousel de semaines ; l'horizon (« Quand ») pose le début.
    fireEvent.click(within(d.getByRole('group', { name: 'Quand' })).getAllByRole('button')[1]);
    expect(d.queryByRole('button', { name: 'Plus de détails ›' })).toBeNull();
    expect(fete).not.toHaveBeenCalled();
  });

  it('un événement d’agenda en retard, touché dans « En retard » : sa feuille s’ouvre au Calendrier, onOpenAgenda n’est pas appelé', () => {
    const agenda = vi.fn();
    const marche = { id: 'ZZ-K1-MARCHE', type: 'event', title: 'ZZ TEST — Marché', date: '2026-11-09', status: 'idea', createdAt: '2026-11-01T08:00:00.000Z' } as unknown as CreativeItem;
    render(<BancCalendrier aujourdhui={JOUR} sansChrome etat={{ ...etatBrasseur(JOUR), items: [marche] }} callbacks={{ onOpenAgenda: agenda }} />);
    fireEvent.click(document.querySelector('button.ent-ret-b')!);
    fireEvent.click(screen.getByRole('button', { name: /ZZ TEST — Marché/ }));
    expect(agenda).not.toHaveBeenCalled();
    const feuille = screen.getByRole('dialog', { name: /Fêtes|Activités/ });
    expect(within(feuille).getByDisplayValue('ZZ TEST — Marché')).toBeTruthy();
  });
});
