import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BancCalendrier } from '../../src/design/CalendrierPreview';
import { StorageService } from '../../src/services/storage';
import { ajouterMois } from '../../src/ui/calendrier/echelle';

/*
 * Paquet E du calendrier (19.11, test en ligne du paquet D : PC-136, PC-NOTE-11, en-tête paysage, glisser en Mois), par le vrai onglet
 * (banc `?preview=calendrier`). Lundi 16 nov. 2026 ; Dédé (vente d'un jour) au sam. 5 déc., la Tireuse (achat d'un jour, liée à la foire) au
 * ven. 4 déc., la Foire du Valais du 4 au 6 déc.
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
  const r = render(<BancCalendrier aujourdhui={JOUR} sansChrome onAppel={a => appels.push(a as Appel)} />);
  return { appels, ...r };
};
const frise = () => document.querySelector<HTMLElement>('[data-frise]')!;
const largeurColonne = () => Number(frise().getAttribute('data-largeur-colonne'));
const echelle = () => frise().getAttribute('data-echelle');
const boutonPeriode = () => document.querySelector<HTMLButtonElement>('[data-ent-periode]')!;
const choisirEchelle = (e: 'jour' | 'semaine' | 'mois') => {
  fireEvent.click(boutonPeriode());
  fireEvent.click(document.querySelector<HTMLButtonElement>(`[data-menu-echelle] [data-echelle="${e}"]`)!);
};
const semaineBande = (n: number) => document.querySelector<HTMLElement>(`[data-bande-semaines] [data-semaine="${n}"]`)!;
const chose = (nom: RegExp) => screen.getAllByRole('button', { name: nom })[0];
/** Un glisser d'un seul saut, comme un doigt rapide (ou le glisser CDP du test en ligne) : appui, un mouvement, lâcher. */
const glisserSaut = (el: Element, dx: number) => {
  fireEvent.pointerDown(el, { clientX: 100, clientY: 10, pointerId: 1, button: 0, pointerType: 'touch' });
  fireEvent.pointerMove(el, { clientX: 100 + dx, clientY: 10, pointerId: 1, pointerType: 'touch' });
  fireEvent.pointerUp(el, { clientX: 100 + dx, clientY: 10, pointerId: 1, pointerType: 'touch' });
};
const dates = (appels: Appel[], id: string) => appels.filter(a => a.id === id && a.patch && 'date' in a.patch).map(a => String(a.patch!.date).slice(0, 10));

describe('paquet E n° 1 (PC-136) : une vente ou un achat d’un jour se glisse, et sa date en base suit', () => {
  it('vue Semaine : Dédé (vente, sam. 5 déc.) glissé d’une colonne d’un seul saut va au sam. 12 déc.', async () => {
    const { appels } = monter();
    expect(echelle()).toBe('semaine');
    glisserSaut(chose(/^Dédé, 1 fût/), largeurColonne());
    await waitFor(() => expect(dates(appels, 'P-DEDE')).toEqual(['2026-12-12']));
  });

  it('vue Semaine : la Tireuse (achat, ven. 4 déc.) glissée de deux colonnes en arrière va au ven. 20 nov.', async () => {
    const { appels } = monter();
    glisserSaut(chose(/^Tireuse/), -2 * largeurColonne());
    await waitFor(() => expect(dates(appels, 'P-TIREUSE')).toEqual(['2026-11-20']));
  });

  it('semaine S49 dépliée : Dédé glissé de deux jours va au lun. 7 déc.', async () => {
    const { appels } = monter();
    fireEvent.click(semaineBande(49));
    glisserSaut(chose(/^Dédé, 1 fût/), 2 * largeurColonne());
    await waitFor(() => expect(dates(appels, 'P-DEDE')).toEqual(['2026-12-07']));
  });

  it('vue Jour : Dédé glissé d’un jour en arrière va au ven. 4 déc.', async () => {
    const { appels } = monter();
    choisirEchelle('jour');
    /* la vue Jour montre deux semaines (S47, S48) : la poignée de début, au clavier, amène la fenêtre sur S49 */
    for (let i = 0; i < 3 && !screen.queryAllByRole('button', { name: /^Dédé, 1 fût/ }).length; i++) {
      fireEvent.keyDown(screen.getByRole('button', { name: /^Poignée de début/ }), { key: 'ArrowRight' });
    }
    expect(echelle()).toBe('jour');
    glisserSaut(chose(/^Dédé, 1 fût/), -largeurColonne());
    await waitFor(() => expect(dates(appels, 'P-DEDE')).toEqual(['2026-12-04']));
  });

  it('vue Semaine, un vrai doigt pas à pas : la Tireuse glissée d’une colonne garde son vendredi (11 déc.)', async () => {
    const { appels } = monter();
    const t = chose(/^Tireuse/);
    const lc = largeurColonne();
    fireEvent.pointerDown(t, { clientX: 100, clientY: 10, pointerId: 2, button: 0, pointerType: 'touch' });
    for (let i = 1; i <= 10; i++) fireEvent.pointerMove(t, { clientX: 100 + (lc * 1.2 * i) / 10, clientY: 10, pointerId: 2, pointerType: 'touch' });
    fireEvent.pointerUp(t, { clientX: 100 + lc * 1.2, clientY: 10, pointerId: 2, pointerType: 'touch' });
    await waitFor(() => expect(dates(appels, 'P-TIREUSE')).toEqual(['2026-12-11']));
  });

  it('à la souris, la marque capture le pointeur dès l’appui : un glisser rapide qui sort aussitôt de ses 28 px reste à elle', () => {
    monter();
    const capt = vi.fn();
    const proto = HTMLElement.prototype as unknown as { setPointerCapture?: unknown };
    const avant = proto.setPointerCapture;
    proto.setPointerCapture = capt;
    try {
      const dede = chose(/^Dédé, 1 fût/);
      fireEvent.pointerDown(dede, { clientX: 100, clientY: 10, pointerId: 7, button: 0, pointerType: 'mouse' });
      expect(capt).toHaveBeenCalledWith(7);
      expect(capt.mock.contexts[0]).toBe(dede);
      fireEvent.pointerUp(dede, { clientX: 100, clientY: 10, pointerId: 7, pointerType: 'mouse' });
    } finally {
      proto.setPointerCapture = avant;
    }
  });
});

describe('paquet E n° 3 : en vue Mois, le glisser compte en mois (le jour du mois gardé si possible)', () => {
  /* en Mois (6 mois, 26 semaines), une chose d'un jour est une petite marque (E27 : son appui long ouvre 6 semaines) ; une barre se glisse */
  it('la Blonde (brassée le 23 nov.) glissée d’une colonne-mois va au 23 déc., pas une semaine plus loin ; la bulle dit la date', async () => {
    const { appels } = monter();
    choisirEchelle('mois');
    expect(echelle()).toBe('mois');
    const b = chose(/^Blonde d’automne/);
    const lc = largeurColonne();
    fireEvent.pointerDown(b, { clientX: 100, clientY: 10, pointerId: 1, button: 0, pointerType: 'touch' });
    fireEvent.pointerMove(b, { clientX: 100 + lc, clientY: 10, pointerId: 1, pointerType: 'touch' });
    expect(document.body.textContent).toContain('23 déc. · lâcher ici');
    fireEvent.pointerUp(b, { clientX: 100 + lc, clientY: 10, pointerId: 1, pointerType: 'touch' });
    await waitFor(() => expect(appels.filter(a => a.id === 'LOT-BLONDE')).toHaveLength(1));
    expect(JSON.stringify(appels.find(a => a.id === 'LOT-BLONDE')!.patch)).toContain('23.12.2026');
  });

  it('la Blonde glissée de trois colonnes-mois va au 23 févr.', async () => {
    const { appels } = monter();
    choisirEchelle('mois');
    glisserSaut(chose(/^Blonde d’automne/), 3 * largeurColonne());
    await waitFor(() => expect(appels.filter(a => a.id === 'LOT-BLONDE')).toHaveLength(1));
    expect(JSON.stringify(appels.find(a => a.id === 'LOT-BLONDE')!.patch)).toContain('23.02.2027');
  });

  it('ajouterMois garde le jour du mois, ou prend le dernier jour quand il manque', () => {
    expect(ajouterMois('2026-11-30', 1)).toBe('2026-12-30');
    expect(ajouterMois('2026-11-30', 3)).toBe('2027-02-28');
    expect(ajouterMois('2027-01-31', 1)).toBe('2027-02-28');
    expect(ajouterMois('2028-01-31', 1)).toBe('2028-02-29');
    expect(ajouterMois('2026-03-31', -1)).toBe('2026-02-28');
    expect(ajouterMois('2026-12-15', 2)).toBe('2027-02-15');
  });
});

describe('paquet E n° 4 (PC-NOTE-11) : l’achat lié ne suit pas seul la fête glissée ; le message propose de le déplacer aussi', () => {
  it('la Foire glissée d’une semaine : « 1 achat lié reste au 4 déc. », la Tireuse n’est pas écrite ; « Le déplacer aussi » la met au 11 déc.', async () => {
    const { appels } = monter();
    glisserSaut(chose(/^Foire du Valais/), largeurColonne());
    await waitFor(() => expect(appels.some(a => a.collection === 'creativeItems' || a.id === 'CR-FOIRE')).toBe(true));
    expect(dates(appels, 'P-TIREUSE')).toEqual([]);
    const msg = await screen.findByRole('status');
    await waitFor(() => expect(msg.textContent).toContain('1 achat lié reste au 4 déc.'));
    fireEvent.click(screen.getByRole('button', { name: 'Le déplacer aussi' }));
    await waitFor(() => expect(dates(appels, 'P-TIREUSE')).toEqual(['2026-12-11']));
  });
});
