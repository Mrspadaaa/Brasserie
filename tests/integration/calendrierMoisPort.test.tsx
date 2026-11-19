import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BancCalendrier } from '../../src/design/CalendrierPreview';
import { StorageService } from '../../src/services/storage';
import { effetCaisse, type CourbeCaisse } from '../../src/domain/calendrierCaisse';
import { texteEffetCreux } from '../../src/domain/calendrierGestes';

/*
 * Test en ligne du paquet E (19.11), bloquant : en vue Mois, une vente ou un achat d'un jour (une petite marque, E27) ne se glissait pas, à la
 * souris comme au doigt (le geste arrivait, la marque le refusait en silence). Banc `?preview=calendrier`, lundi 16 nov. 2026 : Dédé (vente)
 * au sam. 5 déc., la Tireuse (achat) au ven. 4 déc.
 */
const JOUR = '2026-11-16';
type Appel = { op: string; collection: string; id: string; patch?: Record<string, unknown> };

beforeEach(() => {
  localStorage.clear();
  for (const cle of ['calendrier_epingles', 'calendrier_etoiles', 'calendrier_masquees', 'calendrier_ordre']) StorageService.setUiState(cle, []);
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

const monter = () => {
  const appels: Appel[] = [];
  render(<BancCalendrier aujourdhui={JOUR} sansChrome onAppel={a => appels.push(a as Appel)} />);
  return appels;
};
const frise = () => document.querySelector<HTMLElement>('[data-frise]')!;
const largeurColonne = () => Number(frise().getAttribute('data-largeur-colonne'));
const versMois = () => {
  fireEvent.click(document.querySelector<HTMLButtonElement>('[data-ent-periode]')!);
  fireEvent.click(document.querySelector<HTMLButtonElement>('[data-menu-echelle] [data-echelle="mois"]')!);
  expect(frise().getAttribute('data-echelle')).toBe('mois');
};
const marque = (nom: RegExp) => screen.getAllByRole('button', { name: nom }).find(b => b.hasAttribute('data-marque'))!;
const dates = (appels: Appel[], id: string) => appels.filter(a => a.id === id && a.patch && 'date' in a.patch).map(a => String(a.patch!.date).slice(0, 10));

describe('vue Mois : une vente ou un achat d’un jour se glisse d’un mois par colonne', () => {
  it('à la souris, comme en ligne (appui, deux mouvements, lâcher) : Dédé (5 déc.) va au 5 janv. ; la bulle le dit pendant le geste', async () => {
    const appels = monter();
    versMois();
    const d = marque(/^Dédé, 1 fût/);
    const lc = largeurColonne();
    fireEvent.pointerDown(d, { clientX: 100, clientY: 10, pointerId: 3, button: 0, pointerType: 'mouse' });
    fireEvent.pointerMove(d, { clientX: 100 + lc * 0.55, clientY: 10, pointerId: 3, pointerType: 'mouse' });
    fireEvent.pointerMove(d, { clientX: 100 + lc * 1.1, clientY: 10, pointerId: 3, pointerType: 'mouse' });
    expect(document.body.textContent).toContain('5 janv. · lâcher ici');
    fireEvent.pointerUp(d, { clientX: 100 + lc * 1.1, clientY: 10, pointerId: 3, pointerType: 'mouse' });
    await waitFor(() => expect(dates(appels, 'P-DEDE')).toEqual(['2027-01-05']));
  });

  it('au doigt, d’un saut : la Tireuse (achat, 4 déc.) glissée de deux colonnes va au 4 févr.', async () => {
    const appels = monter();
    versMois();
    const t = marque(/^Tireuse/);
    const lc = largeurColonne();
    fireEvent.pointerDown(t, { clientX: 100, clientY: 10, pointerId: 4, button: 0, pointerType: 'touch' });
    fireEvent.pointerMove(t, { clientX: 100 + 2 * lc, clientY: 10, pointerId: 4, pointerType: 'touch' });
    fireEvent.pointerUp(t, { clientX: 100 + 2 * lc, clientY: 10, pointerId: 4, pointerType: 'touch' });
    await waitFor(() => expect(dates(appels, 'P-TIREUSE')).toEqual(['2027-02-04']));
  });

  it('garde-fou (vert avant comme après) : la petite marque n’ouvre jamais le menu f5-a à l’appui long (E27), et rien ne s’écrit', () => {
    vi.useFakeTimers();
    const appels = monter();
    versMois();
    const d = marque(/^Dédé, 1 fût/);
    expect(d.getAttribute('aria-haspopup')).toBeNull();
    fireEvent.pointerDown(d, { clientX: 100, clientY: 10, pointerId: 5, button: 0, pointerType: 'touch' });
    vi.advanceTimersByTime(600);
    fireEvent.pointerUp(d, { clientX: 100, clientY: 10, pointerId: 5, pointerType: 'touch' });
    expect(document.querySelector('[role="menu"]')).toBeNull();
    expect(appels).toEqual([]);
  });
});

describe('message d’un glissé : le chiffre clé qui ne bouge pas est nommé, jamais « inchangé » à côté d’un chiffre qui bouge', () => {
  const courbe = (libres: number[]): CourbeCaisse => ({
    semaines: libres.map((libre, index) => ({ index, lundi: `2026-12-${String(1 + 7 * index).padStart(2, '0')}`, numero: 47 + index, caisse: libre, libre, reserve: 0, variation: 0, mouvements: [], tendance: 0 }))
  }) as unknown as CourbeCaisse;

  it('le creux reste −660 en S47 et la S50 passe de −660 à −659 : le message donne la valeur inchangée, à côté du solde qui bouge', () => {
    const avant = courbe([-66000, -65000, -65000, -66000, -66000]);
    const apres = courbe([-66000, -65000, -65000, -65900, -66000]);
    const texte = texteEffetCreux(avant, apres, effetCaisse(avant, apres))!;
    expect(texte).toBe('S50 : −660 → −659 · à dépenser reste −660');
    expect(texte).not.toContain('inchangé');
  });

  it('le chiffre clé bouge : jamais « inchangé »', () => {
    const avant = courbe([-65000, -66000, -65000]);
    const apres = courbe([-65000, -65900, -65000]);
    const texte = texteEffetCreux(avant, apres, effetCaisse(avant, apres))!;
    expect(texte).not.toContain('inchangé');
    expect(texte).toBe('À dépenser : −660 → −659 · S48');
  });
});
