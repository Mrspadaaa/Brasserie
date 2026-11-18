import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BancCalendrier } from '../../src/design/CalendrierPreview';
import { StorageService } from '../../src/services/storage';
import { ajouterJours, lundiDe } from '../../src/domain/calendrier';

/*
 * CRITIQUE-5 n° 9 (D-8, D-9, E45) et n° 19 (E34, D-22) : la feuille d'ajout, jouée depuis la frise du banc, sans clavier.
 * - Travaux : puce de nom récent, S20, S40 de l'an prochain, « 5 j » : « S20 → S40 · 21 sem. » et l'écriture reçoit la fenêtre ;
 *   une puce plus grande que la fenêtre est grisée.
 * - Ventes : une puce client pose le nom ; « Ajouter » écrit une fois, jamais « Choisis un nom. ».
 * - Activités : une activité de 3 j se pose et se lit en jours sur la frise.
 */

const JOUR = '2026-11-16';
const L = lundiDe(JOUR);
const plage = (semaines: number, du = L) => ({ genre: 'dates' as const, du, au: ajouterJours(du, semaines * 7 - 1) });
type Appel = { op: string; collection: string; id: string; patch?: Record<string, unknown> };

beforeEach(() => {
  localStorage.clear();
  for (const cle of ['calendrier_epingles', 'calendrier_etoiles', 'calendrier_masquees', 'calendrier_ordre']) StorageService.setUiState(cle, []);
});
afterEach(() => cleanup());

const monter = () => {
  const appels: Appel[] = [];
  render(<BancCalendrier aujourdhui={JOUR} sansChrome onAppel={a => appels.push(a as Appel)} callbacks={{ periode: plage(52) }} />);
  return appels;
};
const dialogue = (nom: string) => within(screen.getByRole('dialog', { name: nom }));
/** Le carré + de la rangée (le geste du brasseur, D-155). */
const plusDe = (rangee: string) => fireEvent.click(document.querySelector(`button[data-plus="${rangee}"]`)!);
const semaine = (d: ReturnType<typeof dialogue>, nom: RegExp) => fireEvent.click(within(d.getByRole('group', { name: 'Semaine' })).getByRole('button', { name: nom }));
/** Aucune saisie au clavier : le test ne tape jamais (aucun `change` ni `keyDown`) ; aucun champ n'a le focus. */
const sansClavier = () => !(document.activeElement instanceof HTMLInputElement);

describe('n° 9 (E45) : la feuille Travaux, depuis le carré +, pose une fenêtre et des jours actifs sans clavier', () => {
  it('nom récent, S20, S40, « 5 j » : « S20 → S40 · 21 sem. », puis l’écriture reçoit fenetre { du, au, joursActifs: 5 }', async () => {
    const appels = monter();
    plusDe('travaux');
    const d = dialogue('Travaux');
    /* les 52 semaines de la courbe défilent dans la feuille, celles de l'an prochain comprises */
    const semaines = within(d.getByRole('group', { name: 'Semaine' })).getAllByRole('button');
    expect(semaines.length).toBeGreaterThanOrEqual(52);
    const puce = within(d.getByRole('group', { name: 'Noms récents' })).getAllByRole('button')[0];
    fireEvent.click(puce);
    expect(puce).toHaveAttribute('aria-pressed', 'true');
    semaine(d, /^S20, /);
    /* une seule semaine : 7 jours, « 10 j » est grisée */
    const jours = () => within(d.getByRole('group', { name: 'Jours actifs' }));
    expect(jours().getAllByRole('button').map(b => b.textContent)).toEqual(['1 j', '2 j', '3 j', '5 j', '10 j']);
    expect(jours().getByRole('button', { name: '10 j' })).toBeDisabled();
    semaine(d, /^S40, /);
    expect(jours().getByRole('button', { name: '10 j' })).not.toBeDisabled();
    fireEvent.click(jours().getByRole('button', { name: '5 j' }));
    expect(d.getByText('S20 → S40 · 21 sem.')).toBeInTheDocument();
    expect(d.getByText(/5 j actifs/)).toBeInTheDocument();
    expect(sansClavier()).toBe(true);
    fireEvent.click(d.getByRole('button', { name: /^Ajouter/ }));
    await waitFor(() => expect(appels.filter(a => a.op === 'creer')).toHaveLength(1));
    const ecrit = appels.find(a => a.op === 'creer')!.patch as { fenetre?: { du: string; au: string; joursActifs?: number } };
    /* S20 et S40 de 2027 : du lundi de S20 au dimanche de S40 */
    expect(ecrit.fenetre).toEqual({ du: '2027-05-17', au: '2027-10-10', joursActifs: 5 });
    expect(screen.queryByText('Choisis un nom.')).toBeNull();
  });
});

describe('n° 19 (E34, D-22) : poser une vente et une activité au banc', () => {
  it('Ventes : la puce « Café du Pont · 1 fût +130 » puis Ajouter : une écriture, jamais « Choisis un nom. »', async () => {
    const appels = monter();
    plusDe('ventes');
    const d = dialogue('Ventes');
    const groupe = within(d.getByRole('group', { name: 'Clients et ventes probables' }));
    const puce = groupe.getAllByRole('button').find(b => b.getAttribute('data-puce') === 'client' && /Café du Pont/.test(b.textContent ?? ''))!;
    expect(puce.textContent).toMatch(/Café du Pont\s*· 1 fût\s*\+130/);
    fireEvent.click(puce);
    expect(puce).toHaveAttribute('aria-pressed', 'true');
    expect(sansClavier()).toBe(true);
    fireEvent.click(d.getByRole('button', { name: /^Ajouter/ }));
    await waitFor(() => expect(appels.filter(a => a.op === 'creer')).toHaveLength(1));
    expect(screen.queryByText('Choisis un nom.')).toBeNull();
    const vente = appels.find(a => a.op === 'creer')!.patch as { title?: string; amountCents?: number; direction?: string; clientId?: string };
    expect(vente).toMatchObject({ amountCents: 13000, direction: 'in', clientId: 'CL-PONT' });
    expect(vente.title).toMatch(/1 fût/);
  });

  it('Ventes : la vente probable du Café du Pont, touchée puis Ajouter, ne demande pas non plus de nom', async () => {
    const appels = monter();
    plusDe('ventes');
    const d = dialogue('Ventes');
    fireEvent.click(d.getByRole('button', { name: /^Vente probable : Café du Pont/ }));
    fireEvent.click(d.getByRole('button', { name: /^Ajouter/ }));
    await waitFor(() => expect(appels.length).toBeGreaterThan(0));
    expect(screen.queryByText('Choisis un nom.')).toBeNull();
  });

  it('Activités : nom récent, une semaine, « 3 j » : l’activité est écrite avec 3 jours actifs et se lit « 3 j » sur la frise', async () => {
    const appels = monter();
    plusDe('activites');
    const d = dialogue('Activités');
    const puce = within(d.getByRole('group', { name: 'Noms récents' })).getAllByRole('button')[0];
    /* la rangée dit ses jours actifs confirmés (« 3 j ») : la nouvelle activité les augmente de 3 */
    const joursRangee = () => Number(/(\d+) j/.exec(document.querySelector('section[data-rangee="activites"]')?.textContent ?? '')?.[1] ?? 0);
    const avant = joursRangee();
    fireEvent.click(puce);
    semaine(d, /^S50, /);
    fireEvent.click(within(d.getByRole('group', { name: 'Jours actifs' })).getByRole('button', { name: '3 j' }));
    fireEvent.click(d.getByRole('button', { name: /^Ajouter/ }));
    await waitFor(() => expect(appels.filter(a => a.op === 'creer')).toHaveLength(1));
    const ecrit = appels.find(a => a.op === 'creer')!.patch as { fenetre?: { joursActifs?: number } };
    expect(ecrit.fenetre?.joursActifs).toBe(3);
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Activités' })).toBeNull());
    const activites = document.querySelector('section[data-rangee="activites"]') as HTMLElement;
    /* posée en S50 (7 déc.), visible dans sa rangée, et comptée en jours : « avant + 3 j » */
    expect(within(activites).getAllByRole('button', { name: /, 7 déc\., S50$/ }).length).toBeGreaterThan(0);
    await waitFor(() => expect(joursRangee()).toBe(avant + 3));
  });
});

describe('CRITIQUE-6 n° 3, part frise (D-68, E34) : « Plus de détails › » garde la rangée d’où il part', () => {
  it('depuis Achats, Travaux et Papiers, la feuille de l’app reçoit sa rangée (achats, travaux, papiers), jamais « papiers » par défaut', () => {
    for (const [rangee, titre] of [['achats', 'Achats'], ['travaux', 'Travaux'], ['papiers', 'Papiers']] as const) {
      const onPoserDepense = vi.fn();
      render(<BancCalendrier aujourdhui={JOUR} sansChrome callbacks={{ periode: plage(52), onPoserDepense }} />);
      plusDe(rangee);
      fireEvent.click(dialogue(titre).getByRole('button', { name: /^Plus de détails/ }));
      expect(onPoserDepense, rangee).toHaveBeenCalledTimes(1);
      const [lundi, recue] = onPoserDepense.mock.calls[0];
      expect(recue, rangee).toBe(rangee);
      expect(lundi).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      cleanup();
    }
  });
});

describe('CRITIQUE-7 n° 4 (E34, D-22) : la feuille Brassins compte « prête le » depuis le jour de pose, jamais depuis un lundi passé', () => {
  it('le mercredi 18 nov., S47 : « S47, 18 nov. » et « prête le 16 déc. » (28 j) ; S48 garde son lundi', () => {
    const appels: Appel[] = [];
    render(<BancCalendrier aujourdhui="2026-11-18" sansChrome onAppel={a => appels.push(a as Appel)} callbacks={{ periode: plage(52) }} />);
    plusDe('brassins');
    const d = dialogue('Brassins');
    semaine(d, /^S47, /);
    expect(d.getByText('S47, 18 nov.')).toBeInTheDocument();
    expect(d.queryByText(/S47, 16 nov\./)).toBeNull();
    const prete = document.querySelector('[data-prete]');
    expect(prete?.textContent).toBe('prête le 16 déc.');
    /* une semaine à venir garde son lundi : S48, 23 nov., prête le 21 déc. */
    semaine(d, /^S48, /);
    expect(d.getByText('S48, 23 nov.')).toBeInTheDocument();
    expect(document.querySelector('[data-prete]')?.textContent).toBe('prête le 21 déc.');
  });
});
