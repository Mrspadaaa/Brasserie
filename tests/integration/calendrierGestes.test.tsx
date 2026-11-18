import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BancCalendrier, etatBanc, type EtatBanc } from '../../src/design/CalendrierPreview';
import { StorageService } from '../../src/services/storage';
import type { Batch } from '../../src/types';
import { HAUTEUR_REPLI_PAYSAGE_PX, HAUTEUR_REPLI_PX, MenuAppuiLong } from '../../src/ui/calendrier/frise/MenuAppuiLong';
import type { ChoseCalendrier } from '../../src/domain/calendrier';

const JOUR = '2026-11-16';
type Appel = { op: string; collection: string; id: string; patch?: Record<string, unknown> };

beforeEach(() => {
  localStorage.clear();
  for (const cle of ['calendrier_epingles', 'calendrier_etoiles', 'calendrier_masquees', 'calendrier_ordre']) StorageService.setUiState(cle, []);
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

const down = (el: Element, x = 100) => fireEvent.pointerDown(el, { clientX: x, clientY: 10, pointerId: 1, button: 0 });
const move = (el: Element, x: number) => fireEvent.pointerMove(el, { clientX: x, clientY: 10, pointerId: 1 });
const up = (el: Element, x = 100) => fireEvent.pointerUp(el, { clientX: x, clientY: 10, pointerId: 1 });
const toucher = (el: Element) => { down(el); up(el); };
const glisser = (el: Element, dx: number) => { down(el, 100); move(el, 100 + dx); up(el, 100 + dx); };
const appuiLong = (el: Element) => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  down(el);
  act(() => { vi.advanceTimersByTime(500); });
  vi.useRealTimers();
  up(el);
};
const colonne = () => Number(document.querySelector('[data-frise]')!.getAttribute('data-largeur-colonne'));
const barre = (nom: RegExp) => screen.getByRole('button', { name: nom });
const messages = () => [...document.querySelectorAll('[role="status"], [role="alert"]')];
const monter = (props: React.ComponentProps<typeof BancCalendrier> = {}) => {
  const appels: Appel[] = [];
  const r = render(<BancCalendrier aujourdhui={JOUR} sansChrome onAppel={a => appels.push(a as Appel)} {...props} />);
  return { appels, ...r };
};

describe('C3 : glisser une barre l’écrit dans sa source, avec son message et son inverse', () => {
  it('deux colonnes : deplacer +2 semaines ; « S… : a → b · Annuler » ; Annuler appelle l’inverse', async () => {
    const { appels } = monter();
    glisser(barre(/^Hotte/), 2 * colonne());
    await waitFor(() => expect(appels).toHaveLength(1));
    expect(appels[0]).toMatchObject({ op: 'patch', collection: 'financialPlans', id: 'P-HOTTE', patch: { date: '2026-12-14' } });
    const m = await screen.findByRole('status');
    expect(m.textContent).toMatch(/S\d+ : [\d −]+ → [\d −]+ ?· ?Annuler/);
    fireEvent.click(within(m).getByRole('button', { name: /Annuler/ }));
    await waitFor(() => expect(appels).toHaveLength(2));
    expect(appels[1]).toMatchObject({ op: 'patch', collection: 'financialPlans', id: 'P-HOTTE', patch: { date: '2026-11-30' } });
    expect(messages()).toHaveLength(0);
  });

  it('un geste de moins de 8 px ne bouge rien ; un glisser annulé (pointercancel) non plus', async () => {
    const { appels } = monter();
    const b = barre(/^Hotte/);
    glisser(b, 4);
    down(b); move(b, 100 + 2 * colonne()); fireEvent.pointerCancel(b, { clientX: 100, clientY: 10, pointerId: 1 });
    await new Promise(r => setTimeout(r, 30));
    expect(appels).toHaveLength(0);
  });

  it('une charge fixe ne bouge pas : le message dit où la régler et renvoie à Finances', async () => {
    const onOpenFinances = vi.fn();
    const { appels } = monter({ callbacks: { onOpenFinances } });
    /* CRITIQUE-5 n° 21 : une échéance récurrente se nomme « à payer » (lot 2) */
    glisser(barre(/^Loyer du local, (?:à payer|proposé), 26 nov/), 2 * colonne());
    const m = await screen.findByRole('status');
    expect(m.textContent).toMatch(/Finances/);
    fireEvent.click(within(m).getByRole('button', { name: /Finances ›/ }));
    expect(onOpenFinances).toHaveBeenCalledTimes(1);
    expect(appels).toHaveLength(0);
  });
});

describe('C4 : appui long, le menu (f5-a)', () => {
  it('500 ms ouvrent le menu : Épingler, Étoile, « Fêtes seules », Dupliquer, Lier et Retirer ; Retirer enlève la date, jamais une suppression', async () => {
    const { appels } = monter();
    appuiLong(barre(/^Marché de Noël/));
    const menu = within(await screen.findByRole('menu'));
    const noms = [...screen.getByRole('menu').querySelectorAll('[role^="menuitem"]')].map(i => i.textContent ?? '');
    expect(noms.join('|')).toMatch(/Épingler.*Étoile.*Fêtes seules.*Dupliquer en S\d+.*Lier à un brassin, un client.*Retirer/);
    fireEvent.click(menu.getByRole('menuitem', { name: /Retirer/ }));
    await waitFor(() => expect(appels).toHaveLength(1));
    expect(appels[0]).toMatchObject({ op: 'patch', collection: 'creativeItems', id: 'CR-NOEL', patch: { date: '' } });
    expect(appels.some(a => a.op === 'supprimer')).toBe(false);
  });

  it('un appui bref n’ouvre pas le menu mais le détail', () => {
    monter();
    toucher(barre(/^Marché de Noël/));
    expect(screen.queryByRole('menu')).toBeNull();
    expect(screen.getByRole('region', { name: /Détail : Marché de Noël/ })).toBeInTheDocument();
  });
});

describe('C5 (BRUIT) : un seul message à la fois', () => {
  it('après f1-a puis f6-b : un seul role="status" ou "alert", sur deux lignes au plus, qui parle de la promesse', async () => {
    const { appels } = monter();
    glisser(barre(/^Hotte/), colonne());
    await screen.findByRole('status');
    glisser(barre(/^Blonde d’automne, 23 nov/), colonne());
    const alerte = await screen.findByRole('alert');
    expect(messages()).toHaveLength(1);
    /* CRITIQUE-3 n° 20 (lot t3-d) : « 3 fûts promis à La Cigogne le … » ; sans client connu, la phrase du domaine */
    expect(alerte.textContent).toMatch(/3 fûts (La Cigogne promis|promis à La Cigogne) le 23 déc\. · prête le 28 déc\./);
    expect(within(alerte).getByRole('button', { name: /Livrer le 29 déc\./ })).toBeInTheDocument();
    expect(alerte.querySelectorAll('.cal-msg-ligne')).toHaveLength(1);
    fireEvent.click(within(alerte).getByRole('button', { name: /Livrer le/ }));
    await waitFor(() => expect(appels.some(a => a.collection === 'financialPlans' && a.id === 'P-CIGOGNE' && a.patch?.date === '2026-12-29')).toBe(true));
    await waitFor(() => expect(messages().map(m => m.getAttribute('role'))).toEqual(['status']));
  });
});

describe('C12 (D-103) : glisser un brassin planifié, son jalon de fin, un jalon intermédiaire', () => {
  const mini: Batch = {
    id: 'LOT-MINI', name: 'Mini', style: 'Saison', volumeL: 10, brewDate: '', plannedBrewDate: '30.11.2026', status: 'planifie', gravityLog: [],
    recipeSnapshot: { fermentation: [{ kind: 'primaire', name: 'P', tempC: 19, days: 3 }], hops: [{ name: 'Citra', stage: 'dryHop', dayOffset: 2, grams: 10 }] }
  } as unknown as Batch;
  const etat = (): EtatBanc => ({ ...etatBanc(JOUR), batches: [mini], plans: [], items: [], transactions: [] });

  it('la barre de 1 colonne : +1 semaine ; ses jalons bougent avec elle ; Annuler la rend à sa place', async () => {
    const { appels } = monter({ etat: etat() });
    const b = barre(/^Mini/);
    const avant = parseFloat((b as HTMLElement).style.left);
    expect(b.querySelectorAll('[data-jalon]').length).toBeGreaterThanOrEqual(3);
    glisser(b, colonne());
    await waitFor(() => expect(appels).toHaveLength(1));
    expect(appels[0]).toMatchObject({ op: 'patch', collection: 'batches', id: 'LOT-MINI' });
    expect(JSON.stringify(appels[0].patch)).toMatch(/2026-12-07|07\.12\.2026/);
    await waitFor(() => expect(parseFloat((barre(/^Mini/) as HTMLElement).style.left)).toBeCloseTo(avant + colonne(), 0));
    expect(barre(/^Mini/).querySelectorAll('[data-jalon]').length).toBeGreaterThanOrEqual(3);
    fireEvent.click(within(await screen.findByRole('status')).getByRole('button', { name: /Annuler/ }));
    await waitFor(() => expect(parseFloat((barre(/^Mini/) as HTMLElement).style.left)).toBeCloseTo(avant, 0));
  });

  it('le jalon de fin glissé écrit finPrevue', async () => {
    const { appels } = monter({ etat: etat() });
    const fin = barre(/^Mini/).querySelector('[data-jalon="conditionnement"]')!;
    glisser(fin, colonne());
    await waitFor(() => expect(appels).toHaveLength(1));
    expect(appels[0]).toMatchObject({ collection: 'batches', id: 'LOT-MINI', patch: { finPrevue: '2026-12-10' } });
  });

  it('un jalon intermédiaire ne déplace rien : « … suit la recette du brassin · Ouvrir le brassin › », un seul message', async () => {
    const onOpenBatch = vi.fn();
    const { appels } = monter({ etat: etat(), callbacks: { onOpenBatch } });
    const dry = barre(/^Mini/).querySelector('[data-jalon="dry-hop"]')!;
    glisser(dry, 30);
    const m = await screen.findByRole('status');
    expect(m.textContent).toMatch(/suit la recette du brassin ?· ?Ouvrir le brassin ›/);
    expect(messages()).toHaveLength(1);
    expect(appels).toHaveLength(0);
    fireEvent.click(within(m).getByRole('button', { name: /Ouvrir le brassin ›/ }));
    expect(onOpenBatch).toHaveBeenCalledWith('LOT-MINI');
  });
});

describe('C16 (D-67, D-93, E46) : Retirer, la poche « Sans date », Poser, Fait', () => {
  it('Retirer une fête : « Sans date › » ; un toucher ouvre la Liste sur la poche ; « Poser » rouvre la feuille et la remet sur la frise', async () => {
    const { appels } = monter();
    appuiLong(barre(/^Marché de Noël/));
    fireEvent.click(await screen.findByRole('menuitem', { name: /Retirer/ }));
    const m = await screen.findByRole('status');
    expect(m.textContent).toContain('Sans date ›');
    fireEvent.click(within(m).getByRole('button', { name: 'Sans date ›' }));
    const poche = await waitFor(() => { const p = document.querySelector('[data-poche]'); if (!p) throw new Error('pas de poche'); return p as HTMLElement; });
    expect(within(poche).getByText('Marché de Noël')).toBeInTheDocument();
    fireEvent.click(within(poche).getByRole('button', { name: /Marché de Noël/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Poser' }));
    const feuille = screen.getByRole('dialog', { name: 'Fêtes' });
    fireEvent.click(within(feuille).getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(appels.some(a => a.id === 'CR-NOEL' && typeof a.patch?.date === 'string' && a.patch.date !== '')).toBe(true));
    await waitFor(() => expect(document.querySelector('[data-calendrier]')!.getAttribute('data-vue')).toBe('semaines'));
    expect(await screen.findByRole('button', { name: /^Marché de Noël/ })).toHaveAttribute('data-barre');
  });

  it('une tâche sans date « Fait » d’un toucher quitte la poche', async () => {
    const { appels } = monter();
    fireEvent.click(document.querySelector('[data-ent-periode]')!);
    const menu = within(screen.getByRole('dialog', { name: 'Période et vue' }));
    fireEvent.click(menu.getByRole('button', { name: /Sans date · 1/ }));
    const poche = await waitFor(() => { const p = document.querySelector('[data-poche]'); if (!p) throw new Error('pas de poche'); return p as HTMLElement; });
    fireEvent.click(within(poche).getByRole('button', { name: /Appeler l’assurance/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Fait/ }));
    await waitFor(() => expect(appels.some(a => a.id === 'CR-SANS' && a.patch?.status === 'done')).toBe(true));
    await waitFor(() => expect(document.querySelector('[data-poche]')).toBeNull());
  });

  it('poche vide : aucun texte « Sans date » dans l’onglet', () => {
    monter({ etat: { ...etatBanc(JOUR), items: etatBanc(JOUR).items.filter(i => i.id !== 'CR-SANS') } });
    fireEvent.click(document.querySelector('[data-ent-periode]')!);
    expect(document.body.textContent).not.toMatch(/Sans date/);
  });
});

describe('CRITIQUE-2 (corr. 2, L2) : glisser au vrai toucher, menu borné, effets visibles, promesse, rotation', () => {
  it('n° 1 : 12 px en 100 ms puis 2 colonnes : deplacer +2, « lâcher ici » sous le doigt, aucun menu ; l’id reste le même', async () => {
    const { appels } = monter();
    const b = barre(/^Hotte/);
    const id = b.getAttribute('data-chose');
    const lc = colonne();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    down(b, 100);
    act(() => { vi.advanceTimersByTime(100); });
    move(b, 112);
    act(() => { vi.advanceTimersByTime(600); });
    expect(screen.queryByRole('menu')).toBeNull();
    move(b, 100 + 2 * lc);
    expect(document.querySelector('[data-ici]')?.textContent).toMatch(/^S\d+ · .+ · lâcher ici$/);
    expect(document.querySelector('[data-fantome]')).not.toBeNull();
    up(b, 100 + 2 * lc);
    vi.useRealTimers();
    await waitFor(() => expect(appels).toHaveLength(1));
    expect(appels[0]).toMatchObject({ collection: 'financialPlans', id: 'P-HOTTE', patch: { date: '2026-12-14' } });
    expect(screen.queryByRole('menu')).toBeNull();
    expect((await screen.findByRole('status')).textContent).toMatch(/S\d+ : [\d  −]+ → [\d  −]+/);
    expect(id).toBe('argent-P-HOTTE');
    await waitFor(() => expect(barre(/^Hotte, 14 déc/).getAttribute('data-chose')).toBe(id));
  });

  it('n° 1 a : un doigt qui a tenu 500 ms puis glisse ferme le menu et déplace la barre', async () => {
    const { appels } = monter();
    const b = barre(/^Hotte/);
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    down(b, 100);
    act(() => { vi.advanceTimersByTime(500); });
    vi.useRealTimers();
    expect(screen.getByRole('menu')).toBeInTheDocument();
    move(b, 100 + colonne());
    expect(screen.queryByRole('menu')).toBeNull();
    up(b, 100 + colonne());
    await waitFor(() => expect(appels).toHaveLength(1));
    expect(appels[0]).toMatchObject({ id: 'P-HOTTE', patch: { date: '2026-12-07' } });
  });

  it('n° 3 : un menu ancré en bas d’écran s’ouvre au-dessus de la barre ; Retirer reste dans l’écran', async () => {
    monter();
    const b = barre(/^Marché de Noël/);
    const h = window.innerHeight;
    vi.spyOn(b, 'getBoundingClientRect').mockReturnValue({ top: h - 40, bottom: h - 14, left: 120, right: 200, width: 80, height: 26, x: 120, y: h - 40, toJSON: () => ({}) } as DOMRect);
    appuiLong(b);
    const menu = await screen.findByRole('menu');
    expect(menu).toHaveAttribute('data-cote', 'haut');
    const top = parseFloat(menu.style.top);
    expect(top).toBeGreaterThanOrEqual(8);
    expect(top + HAUTEUR_REPLI_PX).toBeLessThanOrEqual(h - 40);
    expect(within(menu).getByRole('menuitem', { name: /Retirer/ })).toBeInTheDocument();
  });

  it('n° 32 : Lier pose « lié à La Cigogne » ; Étoile marque la courbe ; Retirer fait voir « Retirée de S… · Sans date › »', async () => {
    const { appels } = monter();
    appuiLong(barre(/^Marché de Noël/));
    fireEvent.click(within(await screen.findByRole('menu')).getByRole('menuitem', { name: /Lier/ }));
    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: /La Cigogne/ }));
    await waitFor(() => expect(appels.some(a => a.collection === 'creativeItems' && a.id === 'CR-NOEL')).toBe(true));
    /* la pastille est celle du Marché de Noël (une autre chose de la fixture peut déjà être liée à La Cigogne) */
    await waitFor(() => expect(barre(/^Marché de Noël/).getAttribute('aria-label')).toMatch(/lié à La Cigogne/));
    expect(within(document.querySelector('section[data-rangee="fetes"]') as HTMLElement).getByRole('button', { name: 'lié à La Cigogne : aperçu' })).toBeInTheDocument();
    appuiLong(barre(/^Marché de Noël/));
    fireEvent.click(within(await screen.findByRole('menu')).getByRole('menuitemcheckbox', { name: /Étoile/ }));
    await waitFor(() => expect(barre(/^Marché de Noël/).querySelector('.cal-etoile, .lucide-star')).not.toBeNull());
    appuiLong(barre(/^Marché de Noël/));
    fireEvent.click(within(await screen.findByRole('menu')).getByRole('menuitem', { name: /Retirer/ }));
    await waitFor(() => expect(messages().map(m => m.textContent).join(' ')).toMatch(/Retirée de S\d+ · Sans date ›/));
  });

  it('n° 30 f2-a : tirer le bord de la Blonde fait voir « J0 / 35 » pendant et après, écrit finPrevue et ouvre l’alerte de la promesse', async () => {
    const { appels } = monter();
    const b = barre(/^Blonde d’automne, 23 nov/);
    const grip = b.querySelector('[data-grip]')!;
    const lc = colonne();
    fireEvent.pointerDown(grip, { clientX: 100, clientY: 10, pointerId: 1, button: 0 });
    fireEvent.pointerMove(b, { clientX: 100 + lc, clientY: 10, pointerId: 1 });
    expect(b.textContent).toMatch(/J0 \/ 35 · prête/);
    fireEvent.pointerUp(b, { clientX: 100 + lc, clientY: 10, pointerId: 1 });
    await waitFor(() => expect(appels.some(a => a.collection === 'batches' && a.id === 'LOT-BLONDE' && typeof a.patch?.finPrevue === 'string')).toBe(true));
    expect(await screen.findByRole('alert')).toHaveTextContent(/promis (à .+ )?le .+ · prête le/);
    /* CRITIQUE-4 n° 21 (E29) : après f2-a, la barre dit aussi « prête » (forme courte permise « J0/35 · prête … ») */
    /* CRITIQUE-5 n° 23 (lot 2) : faute de place (jsdom ne mesure rien), « · prête … » cède sur la barre ; le nom accessible le garde entier */
    await waitFor(() => expect(barre(/^Blonde d’automne/).textContent).toMatch(/J0 \/ 35/));
    expect(barre(/^Blonde d’automne/).getAttribute('aria-label')).toMatch(/J0 \/ 35 · prête \d/);
  });

  it('n° 33 f6-b : décaler la Blonde ouvre « Livrer le … » ; Livrer écrit la date de la vente ; hors de la vue, « Livraison La Cigogne · S53 › »', async () => {
    const { appels } = monter();
    glisser(barre(/^Blonde d’automne, 23 nov/), colonne());
    const alerte = await screen.findByRole('alert');
    fireEvent.click(within(alerte).getByRole('button', { name: /Livrer le/ }));
    await waitFor(() => expect(appels.some(a => a.id === 'P-CIGOGNE' && a.patch?.date === '2026-12-29')).toBe(true));
    const renvoi = await screen.findByRole('button', { name: /Livraison La Cigogne · S53/ });
    fireEvent.click(renvoi);
    await waitFor(() => expect(document.querySelector('[data-chose="argent-P-CIGOGNE"]')).not.toBeNull());
  });

  it('n° 26 : la feuille ouverte et la chose ajoutée survivent au passage portrait ↔ paysage (matchMedia simulé)', async () => {
    let paysage = false;
    const ecouteurs = new Set<() => void>();
    const vrai = window.matchMedia;
    window.matchMedia = ((q: string) => ({
      get matches() { return paysage && /landscape/.test(q); }, media: q, onchange: null,
      addEventListener: (_: string, f: () => void) => ecouteurs.add(f), removeEventListener: (_: string, f: () => void) => ecouteurs.delete(f),
      addListener: () => undefined, removeListener: () => undefined, dispatchEvent: () => false
    })) as unknown as typeof window.matchMedia;
    try {
      const { appels } = monter();
      const tourner = (p: boolean) => act(() => { paysage = p; ecouteurs.forEach(f => f()); });
      fireEvent.click(screen.getByRole('button', { name: 'Ajouter dans Fêtes' }));
      await screen.findByRole('dialog');
      tourner(true);
      expect(document.querySelector('[data-calendrier]')).toHaveAttribute('data-orientation', 'paysage');
      const d = within(screen.getByRole('dialog'));
      fireEvent.click(d.getByRole('button', { name: 'Marché de Noël' }));
      fireEvent.click(d.getByRole('button', { name: /^Ajouter/ }));
      await waitFor(() => expect(appels.some(a => a.op === 'creer')).toBe(true));
      const cree = appels.find(a => a.op === 'creer')!;
      await waitFor(() => expect(document.querySelector(`[data-chose="creatif-${cree.id}"]`)).not.toBeNull());
      tourner(false);
      expect(document.querySelector('[data-calendrier]')).toHaveAttribute('data-orientation', 'portrait');
      expect(document.querySelector(`[data-chose="creatif-${cree.id}"]`)).not.toBeNull();
    } finally { window.matchMedia = vrai; }
  });
});

describe('C19 (D-71) : « Budget › » d’un brassin', () => {
  it('toucher un brassin, puis « Budget › », appelle onOuvrirBudget une fois avec l’id du brassin', () => {
    const onOuvrirBudget = vi.fn();
    monter({ callbacks: { onOuvrirBudget } });
    toucher(barre(/^Blonde d’automne, 23 nov/));
    const d = within(screen.getByRole('region', { name: /Détail : Blonde d’automne/ }));
    expect(d.getByRole('button', { name: /Ouvrir le brassin/ })).toBeInTheDocument();
    fireEvent.click(d.getByRole('button', { name: 'Budget ›' }));
    expect(onOuvrirBudget).toHaveBeenCalledTimes(1);
    expect(onOuvrirBudget).toHaveBeenCalledWith('LOT-BLONDE');
  });
});

describe('CRITIQUE-3 (lot t3-c-frise) : le menu de l’appui long', () => {
  const CHOSE: ChoseCalendrier = {
    id: 'CR-NOEL', rangee: 'fetes', titre: 'Marché de Noël', debut: '2026-12-21', fin: '2026-12-21', centimes: 118000,
    source: { genre: 'creative', id: 'CR-NOEL', type: 'event' } as ChoseCalendrier['source'], ouvre: { ecran: 'agenda', id: 'CR-NOEL' }, deplacable: true
  };
  const espions = () => ({ onEpingler: vi.fn(), onEtoile: vi.fn(), onSeules: vi.fn(), onDupliquer: vi.fn(), onLier: vi.fn(), onRetirer: vi.fn(), onFermer: vi.fn() });
  const ancre = (r: { top: number; bottom: number; left: number; width: number }) => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({ ...r, right: r.left + r.width, height: r.bottom - r.top, x: r.left, y: r.top, toJSON: () => ({}) } as DOMRect);
    return el;
  };
  const menu = (cb: ReturnType<typeof espions>, a: HTMLElement) => render(
    <MenuAppuiLong
      chose={CHOSE} nomRangee="Fêtes seules" ancre={a} epinglee={false} etoilee={false} autresRangees={6}
      dupliquer={{ libelle: 'S52' }} retirer={{}} liens={{ brassins: [{ id: 'LOT-BLONDE', nom: 'Blonde d’automne' }], clients: [{ id: 'CL-CIGOGNE', nom: 'La Cigogne' }] }}
      {...cb}
    />
  );
  const taille = (w: number, h: number) => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: w });
    Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: h });
  };
  const [W0, H0] = [window.innerWidth, window.innerHeight];
  afterEach(() => taille(W0, H0));
  const tape = (el: Element) => { fireEvent.pointerDown(el, { pointerId: 2, button: 0 }); fireEvent.pointerUp(el, { pointerId: 2, button: 0 }); };

  it('c1 (n° 3) : l’appui long de 500 ms puis le lâcher au même point ouvrent le menu sans rien choisir ; un toucher sur « Étoile » l’exécute une fois', async () => {
    monter();
    const b = barre(/^Marché de Noël/);
    appuiLong(b);
    const m = await screen.findByRole('menu');
    /* le navigateur envoie le `click` du lâcher sur l'action qui se trouve sous le doigt : il ne fait rien */
    const etoile = within(m).getByRole('menuitemcheckbox', { name: /Étoile/ });
    fireEvent.pointerUp(etoile, { pointerId: 1, button: 0 });
    fireEvent.click(etoile, { detail: 1 });
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(StorageService.getUiState<string[]>('calendrier_etoiles', [])).toEqual([]);
    expect(StorageService.getUiState<string[]>('calendrier_epingles', [])).toEqual([]);
    expect(barre(/^Marché de Noël/)).toBeInTheDocument();
    /* un appui puis un lâcher sur « Étoile », après l'ouverture : une fois, et le click qui suit ne la rejoue pas */
    tape(etoile);
    fireEvent.click(etoile, { detail: 1 });
    await waitFor(() => expect(StorageService.getUiState<string[]>('calendrier_etoiles', [])).toHaveLength(1));

    const cb = espions();
    cleanup();
    menu(cb, ancre({ top: 300, bottom: 326, left: 100, width: 120 }));
    const e = screen.getByRole('menuitemcheckbox', { name: /Étoile/ });
    fireEvent.pointerUp(e, { pointerId: 1, button: 0 });
    fireEvent.click(e, { detail: 1 });
    expect(cb.onEtoile).not.toHaveBeenCalled();
    expect(cb.onEpingler).not.toHaveBeenCalled();
    expect(cb.onRetirer).not.toHaveBeenCalled();
    tape(e);
    fireEvent.click(e, { detail: 1 });
    expect(cb.onEtoile).toHaveBeenCalledTimes(1);
  });

  it('c2 (n° 4) : en paysage (844 × 390), deux colonnes, sous ou sur la barre, les six actions dans l’écran sans défiler', () => {
    taille(844, 390);
    const cb = espions();
    menu(cb, ancre({ top: 250, bottom: 270, left: 600, width: 120 }));
    const m = screen.getByRole('menu');
    expect(m).toHaveAttribute('data-colonnes', '2');
    const actions = [...m.querySelectorAll('[role^="menuitem"]')].map(x => x.textContent ?? '');
    expect(actions).toHaveLength(6);
    expect(actions.join('|')).toMatch(/Épingler.*Étoile.*Fêtes seules.*Dupliquer en S52.*Lier à un brassin, un client.*Retirer/);
    expect(m.querySelectorAll('.cal-m2c')).toHaveLength(2);
    const top = parseFloat(m.style.top);
    expect(top).toBeGreaterThanOrEqual(8);
    expect(top + HAUTEUR_REPLI_PAYSAGE_PX).toBeLessThanOrEqual(390 - 64);
    /* CRITIQUE-6 n° 5 : dessous, il passerait sous les onglets ; à côté de la barre (à gauche : 584 px libres), avant « au-dessus » en
       paysage ; jamais sur elle */
    expect(m).toHaveAttribute('data-cote', 'cote');
    const left = parseFloat(m.style.left), width = parseFloat(m.style.width);
    expect(left + width).toBeLessThanOrEqual(600 - 6);
    expect(left).toBeGreaterThanOrEqual(8);
  });

  it('c5 (n° 13) : « Lier » ouvre la liste des brassins et des clients ; « La Cigogne » appelle onLier({ clientId })', () => {
    const cb = espions();
    menu(cb, ancre({ top: 200, bottom: 226, left: 100, width: 120 }));
    tape(screen.getByRole('menuitem', { name: /Lier/ }));
    expect(screen.getByRole('menuitem', { name: /Blonde d’automne/ })).toBeInTheDocument();
    tape(screen.getByRole('menuitem', { name: /La Cigogne/ }));
    expect(cb.onLier).toHaveBeenCalledTimes(1);
    expect(cb.onLier).toHaveBeenCalledWith({ clientId: 'CL-CIGOGNE' }, 'La Cigogne');
  });

  it('CRITIQUE-4 n° 12 (E31) : en paysage, ni dessous ni dessus ne tiennent hors de l’en-tête : la page défile, le menu s’ouvre sous la barre, jamais sur l’en-tête ni sur elle', () => {
    taille(844, 390);
    const entete = document.createElement('div');
    entete.setAttribute('data-entete-zone', '');
    document.body.appendChild(entete);
    vi.spyOn(entete, 'getBoundingClientRect').mockReturnValue({ top: 0, bottom: 120, left: 0, right: 844, width: 844, height: 120, x: 0, y: 0, toJSON: () => ({}) } as DOMRect);
    let defile = 0;
    const page = { scrollHeight: 900, clientHeight: 390, get scrollTop() { return defile; }, set scrollTop(v: number) { defile = Math.max(0, Math.min(510, v)); } };
    Object.defineProperty(document, 'scrollingElement', { configurable: true, get: () => page });
    try {
      const a = document.createElement('div');
      document.body.appendChild(a);
      vi.spyOn(a, 'getBoundingClientRect').mockImplementation(() => ({ top: 250 - defile, bottom: 269 - defile, left: 600, right: 720, width: 120, height: 19, x: 600, y: 250 - defile, toJSON: () => ({}) }) as DOMRect);
      menu(espions(), a);
      const m = screen.getByRole('menu');
      const top = parseFloat(m.style.top);
      const barre = a.getBoundingClientRect();
      expect(defile).toBeGreaterThan(0);
      expect(m).toHaveAttribute('data-cote', 'bas');
      expect(top).toBeGreaterThanOrEqual(barre.bottom + 6);
      expect(barre.top).toBeGreaterThanOrEqual(120);
      expect(top + HAUTEUR_REPLI_PAYSAGE_PX).toBeLessThanOrEqual(390 - 64);
    } finally {
      delete (document as unknown as Record<string, unknown>).scrollingElement;
      entete.remove();
    }
  });

  /* CRITIQUE-6 n° 5 (E31 « un menu sous elle », D-192) : le rectangle du menu n'intersecte jamais celui de la chose tenue, sa barre et son nom */
  const rectMenu = (m: HTMLElement) => {
    const top = parseFloat(m.style.top), left = parseFloat(m.style.left), width = parseFloat(m.style.width);
    const repli = m.getAttribute('data-colonnes') === '2' ? HAUTEUR_REPLI_PAYSAGE_PX : HAUTEUR_REPLI_PX;
    const hauteur = Math.min(repli, m.style.maxHeight ? parseFloat(m.style.maxHeight) : repli);
    return { top, left, right: left + width, bottom: top + hauteur };
  };
  const recouvre = (a: { top: number; bottom: number; left: number; right: number }, b: { top: number; bottom: number; left: number; right: number }) =>
    a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  /** Une barre et son nom posé à droite (« Hotte −900 »), comme Barre.tsx les rend : la barre, puis l'étiquette sœur `.cal-lbl`. */
  const barreEtNom = (b: { top: number; left: number; width: number; height: number }, nomLargeur: number, defile: () => number = () => 0) => {
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    const barre = document.createElement('div');
    const nom = document.createElement('span');
    nom.className = 'cal-lbl';
    parent.append(barre, nom);
    const rect = (top: number, left: number, width: number, height: number) => ({ top, bottom: top + height, left, right: left + width, width, height, x: left, y: top, toJSON: () => ({}) }) as DOMRect;
    vi.spyOn(barre, 'getBoundingClientRect').mockImplementation(() => rect(b.top - defile(), b.left, b.width, b.height));
    vi.spyOn(nom, 'getBoundingClientRect').mockImplementation(() => rect(b.top - defile(), b.left + b.width + 6, nomLargeur, b.height));
    const tenue = () => ({ top: b.top - defile(), bottom: b.top - defile() + b.height, left: b.left, right: b.left + b.width + 6 + nomLargeur });
    return { barre, tenue, retirer: () => parent.remove() };
  };

  it('CRITIQUE-6 n° 5 : paysage 844 × 390, Hotte au milieu de la frise, la page au bout : le menu à côté, ni sur la barre ni sur « Hotte −900 »', () => {
    taille(844, 390);
    const entete = document.createElement('div');
    entete.setAttribute('data-entete-zone', '');
    document.body.appendChild(entete);
    vi.spyOn(entete, 'getBoundingClientRect').mockReturnValue({ top: 0, bottom: 119, left: 12, right: 832, width: 820, height: 119, x: 12, y: 0, toJSON: () => ({}) } as DOMRect);
    /* la mesure du banc (vision-7, paysage-11) : Hotte 140–199 × 186–204, son nom à droite ; la page ne défile plus */
    const { barre, tenue, retirer } = barreEtNom({ top: 186, left: 140, width: 59, height: 18 }, 80);
    try {
      menu(espions(), barre);
      const m = screen.getByRole('menu');
      expect(m).toHaveAttribute('data-cote', 'cote');
      const r = rectMenu(m);
      expect(recouvre(r, tenue())).toBe(false);
      expect(r.top).toBeGreaterThanOrEqual(125);
      expect(r.bottom).toBeLessThanOrEqual(390 - 64);
      /* deux colonnes : les six actions sans défiler (D-192) */
      expect(m).toHaveAttribute('data-colonnes', '2');
      expect(m.querySelectorAll('[role^="menuitem"]')).toHaveLength(6);
    } finally { retirer(); entete.remove(); }
  });

  it('CRITIQUE-6 n° 5 : paysage, sans la place de deux colonnes à côté : une colonne qui défile en elle-même, toujours hors de la chose tenue', () => {
    taille(844, 390);
    const { barre, tenue, retirer } = barreEtNom({ top: 200, left: 300, width: 120, height: 18 }, 140);
    try {
      menu(espions(), barre);
      const m = screen.getByRole('menu');
      expect(m).toHaveAttribute('data-cote', 'cote');
      expect(m).toHaveAttribute('data-colonnes', '1');
      expect(m.style.maxHeight).not.toBe('');
      expect(recouvre(rectMenu(m), tenue())).toBe(false);
    } finally { retirer(); }
  });

  it('CRITIQUE-6 n° 5 : 390 × 844, Hotte en bas, `body { overflow-x: hidden }` : la page défile (pas le body), le menu sous la chose tenue', () => {
    taille(390, 844);
    const entete = document.createElement('div');
    entete.setAttribute('data-entete-zone', '');
    document.body.appendChild(entete);
    vi.spyOn(entete, 'getBoundingClientRect').mockReturnValue({ top: 36, bottom: 215, left: 12, right: 378, width: 366, height: 179, x: 12, y: 36, toJSON: () => ({}) } as DOMRect);
    let defile = 0;
    const page = { scrollHeight: 1273, clientHeight: 844, get scrollTop() { return defile; }, set scrollTop(v: number) { defile = Math.max(0, Math.min(429, v)); } };
    Object.defineProperty(document, 'scrollingElement', { configurable: true, get: () => page });
    /* le body se dit « auto » et plus haut que l'écran, mais ne défile pas (son débordement passe à la fenêtre) */
    const corps = document.body;
    const avant = corps.style.overflowY;
    corps.style.overflowY = 'auto';
    Object.defineProperty(corps, 'scrollHeight', { configurable: true, get: () => 1273 });
    Object.defineProperty(corps, 'clientHeight', { configurable: true, get: () => 844 });
    const { barre, tenue, retirer } = barreEtNom({ top: 719, left: 136, width: 57, height: 26 }, 70, () => defile);
    try {
      menu(espions(), barre);
      const m = screen.getByRole('menu');
      expect(defile).toBeGreaterThan(0);
      expect(m).toHaveAttribute('data-cote', 'bas');
      const r = rectMenu(m);
      expect(recouvre(r, tenue())).toBe(false);
      expect(tenue().top).toBeGreaterThanOrEqual(215);
      expect(r.bottom).toBeLessThanOrEqual(844 - 64);
    } finally {
      retirer(); entete.remove();
      corps.style.overflowY = avant;
      delete (corps as unknown as Record<string, unknown>).scrollHeight;
      delete (corps as unknown as Record<string, unknown>).clientHeight;
      delete (document as unknown as Record<string, unknown>).scrollingElement;
    }
  });

  it('CRITIQUE-6 n° 5 : 390 × 844 sans défilement possible : au-dessus ou au-dessous, jamais sur la barre ni sur son nom', () => {
    taille(390, 844);
    const { barre, tenue, retirer } = barreEtNom({ top: 700, left: 136, width: 57, height: 26 }, 70);
    try {
      menu(espions(), barre);
      expect(recouvre(rectMenu(screen.getByRole('menu')), tenue())).toBe(false);
    } finally { retirer(); }
  });
});

describe('CRITIQUE-4 (lot q2-frise) : jalon et milieu, marque en paysage, Livrer, « prête », noms', () => {
  it('n° 17 : saisie par son milieu (la barre, pas un jalon), la Blonde planifiée se déplace d’une semaine, sans message « recette »', async () => {
    const { appels } = monter();
    const b = barre(/^Blonde d’automne, 23 nov/);
    glisser(b, colonne());
    await waitFor(() => expect(appels.some(a => a.collection === 'batches' && a.id === 'LOT-BLONDE')).toBe(true));
    expect(appels.filter(a => a.collection === 'batches' && a.id === 'LOT-BLONDE')).toHaveLength(1);
    expect(messages().some(m => /recette/.test(m.textContent ?? ''))).toBe(false);
  });

  it('n° 17 : saisi sur l’élément jalon « garde », le refus « suit la recette » et aucune écriture', async () => {
    const { appels } = monter();
    const garde = barre(/^Blonde d’automne, 23 nov/).querySelector('[data-jalon="garde"]') ?? barre(/^Blonde d’automne, 23 nov/).querySelector('[data-jalon][data-glissable="false"]');
    expect(garde).not.toBeNull();
    glisser(garde!, colonne());
    const m = await screen.findByRole('status');
    expect(m.textContent).toMatch(/suit la recette/);
    await new Promise(r => setTimeout(r, 30));
    expect(appels).toHaveLength(0);
  });

  it('n° 4 (D-199) : en paysage (13 semaines), l’appui long sur une marque ouvre les 6 semaines centrées sur elle, jamais le menu', async () => {
    const vrai = window.matchMedia;
    window.matchMedia = ((q: string) => ({
      matches: /landscape/.test(q), media: q, onchange: null, addEventListener: () => undefined, removeEventListener: () => undefined,
      addListener: () => undefined, removeListener: () => undefined, dispatchEvent: () => false
    })) as unknown as typeof window.matchMedia;
    try {
      const onPeriode = vi.fn();
      monter({ callbacks: { onPeriode } });
      expect(document.querySelector('[data-calendrier]')).toHaveAttribute('data-orientation', 'paysage');
      await waitFor(() => expect(document.querySelector('[data-frise]')).toHaveAttribute('data-nb-colonnes', '13'));
      const marque = document.querySelector<HTMLElement>('[data-marque][data-rangee="ventes"]');
      expect(marque).not.toBeNull();
      const id = marque!.getAttribute('data-chose');
      onPeriode.mockClear();
      appuiLong(marque!);
      expect(screen.queryByRole('menu')).toBeNull();
      await waitFor(() => expect(document.querySelector('[data-frise]')).toHaveAttribute('data-nb-colonnes', '6'));
      expect(onPeriode).toHaveBeenCalledTimes(1);
      const p = onPeriode.mock.calls[0][0] as { genre: string; du: string; au: string };
      expect(p.genre).toBe('dates');
      expect((Date.parse(p.au) - Date.parse(p.du)) / 86400000).toBe(41);
      expect(document.querySelector(`[data-chose="${id}"]`)).not.toBeNull();
    } finally { window.matchMedia = vrai; }
  });

  it('n° 20 (E32) : un clic sur « Livrer le … » écrit la date de la vente une fois ; le renvoi suit hors de la vue', async () => {
    const { appels } = monter();
    glisser(barre(/^Blonde d’automne, 23 nov/), colonne());
    const alerte = await screen.findByRole('alert');
    fireEvent.click(within(alerte).getByRole('button', { name: /Livrer le/ }));
    await waitFor(() => expect(appels.some(a => a.id === 'P-CIGOGNE' && typeof a.patch?.date === 'string')).toBe(true));
    await new Promise(r => setTimeout(r, 30));
    expect(appels.filter(a => a.id === 'P-CIGOGNE' && typeof a.patch?.date === 'string')).toHaveLength(1);
    expect(await screen.findByRole('button', { name: /^Livraison La Cigogne · S\d+/ })).toBeInTheDocument();
  });

  it('n° 15 et n° 22 : au téléphone, la pastille « lié à » dit le nom court sans « lié … » ; chaque caddie des 6 semaines porte son nom', () => {
    monter();
    const lies = [...document.querySelectorAll('[data-lie]')];
    expect(lies.length).toBeGreaterThan(0);
    for (const l of lies) {
      expect(l.textContent).not.toMatch(/^lié/);
      expect(l.textContent!.length).toBeGreaterThan(2);
      expect(l.getAttribute('aria-label')).toMatch(/^lié à .+ : aperçu$/);
    }
    const caddies = document.querySelectorAll('[data-caddie]');
    expect(caddies.length).toBeGreaterThan(0);
    expect(document.querySelectorAll('.cal-lbl-caddie')).toHaveLength(caddies.length);
  });
});

/* ---------- CRITIQUE-5 n° 6 (D-126, E31, E37) et n° 12 (E31, D-192) ---------- */

describe('CRITIQUE-5 n° 6 : Lier à un brassin, atteint par l’appui long, se voit et s’annule', () => {
  const CHOSE: ChoseCalendrier = {
    id: 'CR-NOEL', rangee: 'fetes', titre: 'Marché de Noël', debut: '2026-12-21', fin: '2026-12-21', centimes: 118000,
    source: { genre: 'creative', id: 'CR-NOEL', type: 'event' } as ChoseCalendrier['source'], ouvre: { ecran: 'agenda', id: 'CR-NOEL' }, deplacable: true
  };
  const tape = (el: Element) => { fireEvent.pointerDown(el, { pointerId: 2, button: 0 }); fireEvent.pointerUp(el, { pointerId: 2, button: 0 }); };

  it('le menu : « Lier à un brassin, un client » ouvre des puces (Brassins, Clients) ; « Stout maison » appelle onLier({ batchId })', () => {
    const onLier = vi.fn();
    const a = document.createElement('div'); document.body.appendChild(a);
    render(
      <MenuAppuiLong
        chose={CHOSE} nomRangee="Fêtes seules" ancre={a} epinglee={false} etoilee={false} autresRangees={6} dupliquer={null} retirer={{}}
        liens={{ brassins: [{ id: 'LOT-STOUT-1', nom: 'Stout maison' }, { id: 'LOT-STOUT-4', nom: 'Stout maison' }, { id: 'LOT-BLONDE', nom: 'Blonde d’automne' }], clients: [{ id: 'CL-CIGOGNE', nom: 'La Cigogne' }] }}
        onEpingler={vi.fn()} onEtoile={vi.fn()} onSeules={vi.fn()} onDupliquer={vi.fn()} onLier={onLier} onRetirer={vi.fn()} onFermer={vi.fn()}
      />
    );
    tape(screen.getByRole('menuitem', { name: /Lier à un brassin, un client/ }));
    const brassins = screen.getByRole('group', { name: 'Brassins' });
    /* deux « Stout maison » : un seul bouton, le plus récent */
    expect(within(brassins).getAllByRole('menuitem').map(b => b.textContent)).toEqual(['Stout maison', 'Blonde d’automne']);
    expect(within(screen.getByRole('group', { name: 'Clients' })).getByRole('menuitem', { name: 'La Cigogne' })).toBeInTheDocument();
    expect(document.querySelectorAll('[role="menu"] input')).toHaveLength(0);
    tape(within(brassins).getByRole('menuitem', { name: 'Stout maison' }));
    expect(onLier).toHaveBeenCalledTimes(1);
    expect(onLier).toHaveBeenCalledWith({ batchId: 'LOT-STOUT-4' }, 'Stout maison');
  });

  it('le parcours au banc : appui long, Lier, Stout maison : la source reçoit { batchId }, la barre porte « lié à Stout maison », le message dit « Liée à Stout maison · Annuler » ; Annuler écrit l’inverse', async () => {
    const { appels } = monter();
    appuiLong(barre(/^Marché de Noël/));
    fireEvent.click(within(await screen.findByRole('menu')).getByRole('menuitem', { name: /Lier/ }));
    const puce = within(screen.getByRole('group', { name: 'Brassins' })).getByRole('menuitem', { name: 'Stout maison' });
    fireEvent.click(puce);
    await waitFor(() => expect(appels.some(a => a.collection === 'creativeItems' && a.id === 'CR-NOEL')).toBe(true));
    const pose = appels.find(a => a.collection === 'creativeItems' && a.id === 'CR-NOEL')!;
    const liens = (pose.patch as { liens?: { batchId?: string } }).liens;
    expect(liens?.batchId).toMatch(/^LOT-STOUT/);
    await waitFor(() => expect(barre(/^Marché de Noël/).getAttribute('aria-label')).toMatch(/lié à Stout maison/));
    const m = await screen.findByRole('status');
    expect(m.textContent).toMatch(/Liée à Stout maison · Annuler/);
    /* Annuler n'écoute qu'après 400 ms (le doigt du menu) */
    await new Promise(r => setTimeout(r, 450));
    fireEvent.click(within(m).getByRole('button', { name: /Annuler/ }));
    await waitFor(() => expect(appels.filter(a => a.collection === 'creativeItems' && a.id === 'CR-NOEL')).toHaveLength(2));
    const inverse = appels.filter(a => a.collection === 'creativeItems' && a.id === 'CR-NOEL')[1];
    expect((inverse.patch as { liens?: { batchId?: string } }).liens?.batchId).toBeUndefined();
    await waitFor(() => expect(barre(/^Marché de Noël/).getAttribute('aria-label') ?? '').not.toMatch(/lié à Stout/));
  });
});

describe('CRITIQUE-5 n° 12 : le menu ne recouvre jamais la chose tenue', () => {
  const CHOSE: ChoseCalendrier = {
    id: 'P-HOTTE', rangee: 'achats', titre: 'Hotte', debut: '2026-11-30', fin: '2026-11-30', centimes: -90000,
    source: { genre: 'plan', id: 'P-HOTTE', origine: 'manual' } as ChoseCalendrier['source'], ouvre: { ecran: 'plan', id: 'P-HOTTE' }, deplacable: true
  };
  const taille = (w: number, h: number) => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: w });
    Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: h });
  };
  const [W0, H0] = [window.innerWidth, window.innerHeight];
  afterEach(() => { taille(W0, H0); document.body.innerHTML = ''; });
  const boite = (el: Element, r: { top: number; left: number; width: number; height: number }) =>
    vi.spyOn(el, 'getBoundingClientRect').mockImplementation(() => ({ ...r, bottom: r.top + r.height, right: r.left + r.width, x: r.left, y: r.top, toJSON: () => ({}) } as DOMRect));
  /** L'en-tête collé (courbe et bande) : le menu ne s'y pose jamais. */
  const entete = (bas: number) => { const e = document.createElement('div'); e.setAttribute('data-entete-zone', ''); document.body.appendChild(e); boite(e, { top: 0, left: 0, width: window.innerWidth, height: bas }); };
  /** La barre tenue, dans un conteneur qui défile (ou non) : son rectangle suit le défilement. */
  const barreTenue = (r: { top: number; left: number; width: number; height: number }, defile: number) => {
    const conteneur = document.createElement('div');
    conteneur.style.overflowY = 'auto';
    let haut = 0;
    Object.defineProperty(conteneur, 'scrollTop', { configurable: true, get: () => haut, set: (v: number) => { haut = v; } });
    Object.defineProperty(conteneur, 'scrollHeight', { configurable: true, value: 2000 });
    Object.defineProperty(conteneur, 'clientHeight', { configurable: true, value: 2000 - defile });
    const el = document.createElement('div');
    conteneur.appendChild(el); document.body.appendChild(conteneur);
    vi.spyOn(el, 'getBoundingClientRect').mockImplementation(() => {
      const top = r.top - conteneur.scrollTop;
      return { top, bottom: top + r.height, left: r.left, right: r.left + r.width, width: r.width, height: r.height, x: r.left, y: top, toJSON: () => ({}) } as DOMRect;
    });
    return el;
  };
  const ouvrir = (a: HTMLElement) => render(
    <MenuAppuiLong
      chose={CHOSE} nomRangee="Achats seules" ancre={a} epinglee={false} etoilee={false} autresRangees={6} dupliquer={{ libelle: 'S50', effet: 'S50 : 1 154 → 254' }} retirer={{ effet: 'S49 : 1 088 → 1 988' }}
      liens={{ brassins: [], clients: [] }}
      onEpingler={vi.fn()} onEtoile={vi.fn()} onSeules={vi.fn()} onDupliquer={vi.fn()} onLier={vi.fn()} onRetirer={vi.fn()} onFermer={vi.fn()}
    />
  );
  const rectMenu = () => {
    const m = screen.getByRole('menu') as HTMLElement;
    const top = parseFloat(m.style.top), left = parseFloat(m.style.left), w = parseFloat(m.style.width);
    const h = Math.min(m.style.maxHeight ? parseFloat(m.style.maxHeight) : Infinity, m.getAttribute('data-colonnes') === '2' ? HAUTEUR_REPLI_PAYSAGE_PX : HAUTEUR_REPLI_PX);
    return { top, bottom: top + h, left, right: left + w };
  };
  const croise = (a: { top: number; bottom: number; left: number; right: number }, b: DOMRect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

  it('390 × 844, Hotte bas dans la frise, la page défile : la barre vient sous l’en-tête, le menu dessous, sans la recouvrir', () => {
    taille(390, 844); entete(430);
    const a = barreTenue({ top: 620, left: 136, width: 120, height: 40 }, 600);
    ouvrir(a);
    const m = screen.getByRole('menu');
    expect(m).toHaveAttribute('data-cote', 'bas');
    expect(croise(rectMenu(), a.getBoundingClientRect())).toBe(false);
    expect(rectMenu().top).toBeGreaterThanOrEqual(430);
    expect(rectMenu().bottom).toBeLessThanOrEqual(844 - 64);
  });

  it('390 × 844, rien ne défile : jamais sur la barre (au-dessus ou au-dessous, borné à la place libre)', () => {
    taille(390, 844); entete(430);
    const a = barreTenue({ top: 600, left: 136, width: 120, height: 40 }, 0);
    ouvrir(a);
    expect(croise(rectMenu(), a.getBoundingClientRect())).toBe(false);
    expect(rectMenu().top).toBeGreaterThanOrEqual(430);
  });

  it('844 × 390 (paysage) : à côté de la barre, à droite, sans la recouvrir', () => {
    taille(844, 390); entete(120);
    const a = barreTenue({ top: 200, left: 210, width: 110, height: 30 }, 0);
    ouvrir(a);
    const m = screen.getByRole('menu');
    expect(m).toHaveAttribute('data-cote', 'cote');
    expect(croise(rectMenu(), a.getBoundingClientRect())).toBe(false);
    expect(rectMenu().left).toBeGreaterThanOrEqual(a.getBoundingClientRect().right);
  });
});
