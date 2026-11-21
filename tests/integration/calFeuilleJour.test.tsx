/**
 * CAL-PASSE (21.11, critique de vision n° 2) : « Modifier › semaine › Enregistrer » garde le JOUR (mardi 22 déc. → S51 : mardi 15 déc., pas le 14),
 * et la feuille laisse choisir le jour (rangée « Jour »). Le chemin joué est celui de la feuille montée dans le banc : détail › Modifier › semaine
 * › Enregistrer, jusqu'à l'écriture reçue par le port (calDate couvrait `versModification` seul, sans la feuille).
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BancCalendrier } from '../../src/design/CalendrierPreview';
import { StorageService } from '../../src/services/storage';
import { lundiDe, type ChoseCalendrier } from '../../src/domain/calendrier';
import { brouillonDepuisChose, choisirJour, toucherSemaine, versModification } from '../../src/domain/calendrierAjout';

/* lundi 16 nov. 2026 ; Dédé, 1 fût : samedi 5 déc. (le banc le pose à S+2, jour 5) */
const JOUR = '2026-11-16';
const L = lundiDe(JOUR);
type Appel = { op: string; collection: string; id: string; patch?: Record<string, unknown> };

beforeEach(() => {
  localStorage.clear();
  for (const cle of ['calendrier_epingles', 'calendrier_etoiles', 'calendrier_masquees', 'calendrier_ordre']) StorageService.setUiState(cle, []);
});
afterEach(() => cleanup());

const toucher = (el: Element) => {
  fireEvent.pointerDown(el, { clientX: 10, clientY: 10, pointerId: 1, button: 0 });
  fireEvent.pointerUp(el, { clientX: 10, clientY: 10, pointerId: 1 });
};

async function ouvrirModifierDede() {
  const appels: Appel[] = [];
  render(<BancCalendrier aujourdhui={JOUR} sansChrome onAppel={a => appels.push(a as Appel)} />);
  toucher(screen.getByRole('button', { name: /^Dédé, 1 fût/ }));
  fireEvent.click(within(await screen.findByRole('region', { name: /^Détail : Dédé/ })).getByRole('button', { name: 'Modifier' }));
  return { appels, d: within(screen.getByRole('dialog', { name: 'Ventes' })) };
}

describe('CAL-PASSE n° 2 : Modifier garde le jour et le laisse choisir', () => {
  it('la feuille ouverte sur Dédé (samedi 5 déc.) montre la rangée des jours, le samedi choisi', async () => {
    const { d } = await ouvrirModifierDede();
    const jours = within(d.getByRole('group', { name: 'Jour' }));
    expect(jours.getAllByRole('button')).toHaveLength(7);
    expect(jours.getByRole('button', { name: /^samedi 5 déc\./ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('une autre semaine (S50) : le samedi suit (12 déc.), écrit tel quel à « Enregistrer »', async () => {
    const { appels, d } = await ouvrirModifierDede();
    // CAL-MODIFIER (21.11) : plus de carrousel ; la semaine se règle sur la frise de la date (un repère), ici au clavier
    expect(d.queryByRole('group', { name: 'Semaine' })).toBeNull();
    fireEvent.keyDown(d.getByRole('slider', { name: 'Date' }), { key: 'ArrowRight' });
    expect(within(d.getByRole('group', { name: 'Jour' })).getByRole('button', { name: /^samedi 12 déc\./ })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(d.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(appels.some(a => a.id === 'P-DEDE')).toBe(true));
    expect(appels.find(a => a.id === 'P-DEDE')!.patch).toMatchObject({ date: '2026-12-12' });
  });

  it('un autre jour touché dans la rangée (le mardi de la semaine) est celui qui s’écrit', async () => {
    const { appels, d } = await ouvrirModifierDede();
    fireEvent.click(within(d.getByRole('group', { name: 'Jour' })).getByRole('button', { name: /^mardi 1 déc\./ }));
    fireEvent.click(d.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(appels.some(a => a.id === 'P-DEDE')).toBe(true));
    expect(appels.find(a => a.id === 'P-DEDE')!.patch).toMatchObject({ date: '2026-12-01' });
  });
});

describe('CAL-PASSE n° 2 : le domaine garde le rang du jour', () => {
  const chose = (rangee: ChoseCalendrier['rangee'], debut: string): ChoseCalendrier => ({
    id: `x-${rangee}`, rangee, titre: 'ZZ TEST', debut, fin: debut, centimes: rangee === 'ventes' ? 1000 : -1000,
    source: { genre: 'creative', id: 'ZZ-1', type: 'event' }, ouvre: { ecran: 'plan', id: 'ZZ-1' }, deplacable: true
  } as unknown as ChoseCalendrier);
  const ecrite = (c: ChoseCalendrier, b = brouillonDepuisChose(c), auj = JOUR) => {
    const m = versModification(b, c, auj);
    if (m.ok === false) throw new Error(m.raison);
    return (m.ecritures[0] as { patch: { date: string } }).patch.date;
  };

  it('mardi 22 déc. → S51 (lundi 14 déc.) : mardi 15 déc., pas le 14', () => {
    const c = chose('fetes', '2026-12-22');
    expect(ecrite(c, toucherSemaine(brouillonDepuisChose(c), '2026-12-14'))).toBe('2026-12-15');
  });
  it('sans toucher à la semaine : le jour d’origine reste', () => {
    expect(ecrite(chose('fetes', '2026-12-22'))).toBe('2026-12-22');
  });
  it('un jour choisi dans la semaine (dimanche) s’écrit tel quel', () => {
    const c = chose('fetes', '2026-12-22');
    expect(ecrite(c, choisirJour(brouillonDepuisChose(c), '2026-12-27'))).toBe('2026-12-27');
  });
  it('deux semaines touchées de suite : le rang du jour est gardé', () => {
    const c = chose('ventes', '2026-12-22'); /* une vente : une date seule, un second toucher ne tire pas de fenêtre */
    expect(ecrite(c, toucherSemaine(toucherSemaine(brouillonDepuisChose(c), '2026-12-14'), '2027-01-04'))).toBe('2027-01-05');
  });
  it('vers la semaine en cours, un jour déduit déjà passé devient aujourd’hui (jamais un retard inventé)', () => {
    const c = chose('fetes', '2026-12-14'); /* un lundi */
    expect(ecrite(c, toucherSemaine(brouillonDepuisChose(c), L), '2026-11-19')).toBe('2026-11-19');
  });
});
