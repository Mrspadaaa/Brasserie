/**
 * Lot A du test en ligne du 18.11 (work/missions/2026-11-18-choix-calendrier/en-ligne-axe/RAPPORT.md), un point par bloc :
 * 1. CAL-JALON-UN-JOUR : un achat d'un jour posé par le « + » de la rangée Achats est un jalon à son jour, comme la vente, jusqu'à ce qui est écrit ;
 * 2. D386 : lier un achat ou une vente à une fête depuis sa fiche et depuis Modifier (groupe « Fêtes et activités », `evenementId`) ;
 * 3. « Plus de détails › » garde le nom et le montant déjà tapés ;
 * 4. CAL-BARRE-HAUTE : un brassin pas brassé tient au format de la Stout (une ligne de texte, puis le pied d'étapes), jamais sa phrase sur une 2e ligne.
 */
import React from 'react';
import { etirerDuree, joursActifs, poserHorizon } from '../helpers/dureeFeuille';
import { choseFrise } from '../helpers/choseFrise';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

const etat = vi.hoisted(() => ({
  savePlan: vi.fn(), plans: [] as unknown[],
  profile: { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', vatRegistered: false, accounting: 'simplified', openingCash: { date: '2026-01-01', amountCents: 400_000, confirmed: true } } as unknown
}));
vi.mock('../../src/services/financeService', () => {
  const FinanceService = {
    getPayments: () => [], getPlans: () => etat.plans, getProfile: () => etat.profile, getAssets: () => [], getClosings: () => [],
    snapshot: () => ({ profile: etat.profile, plans: etat.plans, payments: [], assets: [], closings: [] }),
    savePlan: (...a: unknown[]) => etat.savePlan(...a)
  };
  return { FinanceService };
});
import { BancCalendrier } from '../../src/design/CalendrierPreview';
import { PlanSheet } from '../../src/ui/finance/FinanceForms';
import { TodoTimeline } from '../../src/ui/atelier/TodoTimeline';
import { StorageService } from '../../src/services/storage';
import { ajouterJours, etiquetteS, lundiDe, type ChoseCalendrier } from '../../src/domain/calendrier';
import { brouillonVide, versEnregistrement, versModification, type ContexteAjout } from '../../src/domain/calendrierAjout';
import { disposer, type Colonne } from '../../src/ui/calendrier/frise/Rangee';

const JOUR = '2026-11-16';
const L = lundiDe(JOUR);
const S49 = ajouterJours(L, 14);
/** D404 : l'horizon « 1 mois » au banc (16 nov.) pose S51, lundi 14 déc. */
const S51 = ajouterJours(L, 28);
type Appel = { op: string; collection: string; id: string; patch?: Record<string, unknown> };

beforeEach(() => {
  localStorage.clear();
  etat.plans = []; etat.savePlan.mockReset();
  for (const cle of ['calendrier_epingles', 'calendrier_etoiles', 'calendrier_masquees', 'calendrier_ordre']) StorageService.setUiState(cle, []);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

const monter = (props: React.ComponentProps<typeof BancCalendrier> = {}) => {
  const appels: Appel[] = [];
  render(<BancCalendrier aujourdhui={JOUR} sansChrome onAppel={a => appels.push(a as Appel)} {...props} />);
  return { appels };
};
const bouton = choseFrise;
const toucher = (el: Element) => {
  fireEvent.pointerDown(el, { clientX: 10, clientY: 10, pointerId: 1, button: 0 });
  fireEvent.pointerUp(el, { clientX: 10, clientY: 10, pointerId: 1 });
};
/** La feuille rapide d'une rangée, ouverte par son « + », un horizon (D404 : il pose le lundi), un nom et un montant tapés. */
const feuilleRapide = (rangee: string, titre: string, horizon: string, nom: string, chf: string) => {
  fireEvent.click(document.querySelector(`button[data-plus="${rangee}"]`)!);
  const d = within(screen.getByRole('dialog', { name: titre }));
  poserHorizon(horizon);
  fireEvent.change(d.getAllByRole('textbox').find(e => e.getAttribute('aria-label') !== 'Montant en CHF')!, { target: { value: nom } });
  const montant = d.getByLabelText('Montant en CHF');
  fireEvent.change(montant, { target: { value: chf } });
  fireEvent.blur(montant);
  return d;
};

describe('1. CAL-JALON-UN-JOUR : un achat d’un jour, posé par le + de la rangée Achats, est un jalon à son jour', () => {
  const ctx: ContexteAjout = { aujourdhui: JOUR, recettes: [], clients: [], plans: [], choses: [], nouvelId: p => `${p}-1`, maintenant: `${JOUR}T12:00:00.000Z` };

  it('ce qui est écrit : un achat d’une semaine sans fin est une date (comme la vente), même avec « 1 j » touché ; aucune fenêtre', () => {
    const b = { ...brouillonVide('achats', S49), titre: 'Tireuse', centimes: 15000, debutChoisi: true, joursActifs: 1 };
    const r = versEnregistrement(b, ctx);
    expect(r.ok).toBe(true);
    const doc = (r as Extract<typeof r, { ok: true }>).enregistrement.document as unknown as Record<string, unknown>;
    expect(doc.fenetre).toBeUndefined();
    expect(doc.date).toBe(S49);
    /* la vente faite de la même façon : déjà juste */
    const v = versEnregistrement({ ...brouillonVide('ventes', S49), titre: 'Dédé, 1 fût', centimes: 13000, debutChoisi: true }, ctx);
    expect(((v as Extract<typeof v, { ok: true }>).enregistrement.document as unknown as Record<string, unknown>).fenetre).toBeUndefined();
    /* Modifier écrit pareil : la fenêtre part */
    const chose = { id: 'argent-P-T', rangee: 'achats', titre: 'Tireuse', debut: S49, fin: S49, centimes: -15000, source: { genre: 'plan', id: 'P-T', origine: 'manual', statut: 'active' }, ouvre: { ecran: 'plan', id: 'P-T' }, deplacable: true } as ChoseCalendrier;
    const m = versModification(b, chose);
    expect(m.ok).toBe(true);
    const patch = (m as Extract<typeof m, { ok: true }>).ecritures[0] as { patch: Record<string, unknown> };
    expect(patch.patch.fenetre).toBeUndefined();
    expect(patch.patch.date).toBe(S49);
  });

  it('un achat sur plusieurs semaines (mettre de côté) reste une fenêtre : une barre', () => {
    const b = { ...brouillonVide('achats', S49), titre: 'Cuve', centimes: 300000, debutChoisi: true, fin: ajouterJours(S49, 21) };
    const r = versEnregistrement(b, ctx);
    const doc = (r as Extract<typeof r, { ok: true }>).enregistrement.document as unknown as { fenetre?: { du: string; au: string } };
    expect(doc.fenetre).toMatchObject({ du: S49, au: ajouterJours(S49, 27) });
  });

  it('au banc : « + » d’Achats, 1 mois (S51), Tireuse ZZ −150 (et « 1 j » s’il est proposé) : écrit sans fenêtre, posé en jalon le 14 déc.', async () => {
    const { appels } = monter();
    const d = feuilleRapide('achats', 'Achats', '1 mois', 'ZZ TEST — Tireuse', '150');
    const unJour = d.queryByRole('button', { name: '1 j' });
    if (unJour) fireEvent.click(unJour);
    fireEvent.click(d.getByRole('button', { name: /^Ajouter/ }));
    await waitFor(() => expect(appels.some(a => a.op === 'creer' && a.collection === 'financialPlans')).toBe(true));
    const ecrit = appels.find(a => a.op === 'creer')!.patch!;
    expect(ecrit.fenetre).toBeUndefined();
    expect(ecrit.date).toBe(S51);
    await waitFor(() => expect(bouton(/^ZZ TEST — Tireuse/)).toHaveAttribute('data-ponctuel', S51));
    expect(bouton(/^ZZ TEST — Tireuse/)).not.toHaveAttribute('data-barre');
  });
});

describe('2. D386 : lier un achat ou une vente à une fête depuis sa fiche et depuis Modifier', () => {
  it('fiche de Dédé › Lier › Fêtes et activités › Foire du Valais : la source reçoit { evenementId } et Dédé se relie à la foire', async () => {
    const { appels } = monter();
    toucher(bouton(/^Dédé, 1 fût/));
    const fiche = within(await screen.findByRole('region', { name: /^Détail : Dédé/ }));
    fireEvent.click(fiche.getByRole('button', { name: /^Lier/ }));
    const groupe = within(fiche.getByRole('group', { name: 'Fêtes et activités' }));
    const noms = groupe.getAllByRole('button').map(b => b.textContent);
    expect(noms).toContain('Foire du Valais');
    /* le Marché de Noël arrive un jour : un jalon, pas une barre à laquelle se lier */
    expect(noms).not.toContain('Marché de Noël');
    fireEvent.click(groupe.getByRole('button', { name: 'Foire du Valais' }));
    await waitFor(() => expect(appels.some(a => a.collection === 'financialPlans' && a.id === 'P-DEDE')).toBe(true));
    expect(appels.find(a => a.id === 'P-DEDE')!.patch).toEqual({ evenementId: 'CR-FOIRE' });
    await waitFor(() => expect(bouton(/^Dédé, 1 fût/)).toHaveAttribute('data-lie-a', 'creatif-CR-FOIRE'));
    /* au toucher de la foire, Dédé s'allume désormais */
    toucher(bouton(/^Foire du Valais/));
    await waitFor(() => expect(bouton(/^Dédé, 1 fût/)).toHaveAttribute('data-ton', 'allume'));
  });

  it('Modifier de la tireuse : le lien à la foire est montré ; Dédé › Modifier › Foire du Valais › Enregistrer écrit evenementId', async () => {
    const { appels } = monter();
    toucher(bouton(/^Dédé, 1 fût/));
    fireEvent.click(within(await screen.findByRole('region', { name: /^Détail : Dédé/ })).getByRole('button', { name: 'Modifier' }));
    const d = within(screen.getByRole('dialog', { name: 'Ventes' }));
    const groupe = within(d.getByRole('group', { name: 'Fêtes et activités' }));
    const foire = groupe.getByRole('button', { name: 'Foire du Valais' });
    expect(foire).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(foire);
    expect(foire).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(d.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(appels.some(a => a.collection === 'financialPlans' && a.id === 'P-DEDE')).toBe(true));
    expect(appels.find(a => a.id === 'P-DEDE')!.patch).toMatchObject({ evenementId: 'CR-FOIRE' });
    await waitFor(() => expect(bouton(/^Dédé, 1 fût/)).toHaveAttribute('data-lie-a', 'creatif-CR-FOIRE'));
  });

  it('Modifier de la tireuse (déjà liée) : la foire est choisie ; la retoucher défait le lien à l’enregistrement', async () => {
    const { appels } = monter();
    toucher(bouton(/^Tireuse/));
    fireEvent.click(within(await screen.findByRole('region', { name: /^Détail : Tireuse/ })).getByRole('button', { name: 'Modifier' }));
    const d = within(screen.getByRole('dialog', { name: 'Achats' }));
    const foire = within(d.getByRole('group', { name: 'Fêtes et activités' })).getByRole('button', { name: 'Foire du Valais' });
    expect(foire).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(foire);
    fireEvent.click(d.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(appels.some(a => a.id === 'P-TIREUSE')).toBe(true));
    const patch = appels.find(a => a.id === 'P-TIREUSE')!.patch!;
    expect('evenementId' in patch && patch.evenementId === undefined).toBe(true);
  });
});

describe('3. « Plus de détails › » garde le nom et le montant déjà tapés', () => {
  it('Achats 1 mois (S51), « ZZ TEST — Tireuse » 150 : Prévoir une dépense s’ouvre avec ce libellé et 150 CHF, datée du lundi posé, en Brassage', () => {
    function Harnais() {
      type P = { date: string; categorie?: string; saisie?: { titre?: string; centimes?: number; direction?: 'in' | 'out' } };
      const [p, setP] = React.useState<P | null>(null);
      return <><BancCalendrier aujourdhui={JOUR} sansChrome callbacks={{ onPoserDepense: (date, _r, categorie, saisie) => setP({ date, ...(categorie ? { categorie } : {}), ...(saisie ? { saisie } : {}) }) }} />
        {p && <PlanSheet date={p.date} {...(p.categorie ? { categorie: p.categorie as never } : {})} {...(p.saisie ? { saisie: p.saisie } : {})} onClose={() => setP(null)} />}</>;
    }
    render(<Harnais />);
    const d = feuilleRapide('achats', 'Achats', '1 mois', 'ZZ TEST — Tireuse', '150');
    fireEvent.click(d.getByRole('button', { name: 'Plus de détails ›' }));
    const plan = within(screen.getByRole('dialog', { name: 'Prévoir une dépense' }));
    expect(plan.getByPlaceholderText(/Loyer, commande de malt/)).toHaveValue('ZZ TEST — Tireuse');
    expect((plan.getByLabelText('Montant (CHF)') as HTMLInputElement).value).toMatch(/^150([.,]00?)?$/);
    expect(plan.getByLabelText('Date de paiement prévue')).toHaveValue(S51);
    expect((plan.getByLabelText('Catégorie') as HTMLSelectElement).value).toBe('brassage');
  });

  it('Fêtes 1 mois, « ZZ TEST — Fête » +2400 : la fête part avec son nom et son montant ; « Nouvelle tâche » s’ouvre avec « Quoi » rempli et le montant rappelé', () => {
    const fete = vi.fn();
    render(<BancCalendrier aujourdhui={JOUR} sansChrome callbacks={{ onPoserFete: fete }} />);
    const d = feuilleRapide('fetes', 'Fêtes', '1 mois', 'ZZ TEST — Fête', '2400');
    /* k1 (21.11) : une fête n'a pas d'autre écran que sa feuille ; la donnée d'agenda reste au Calendrier, plus de « Plus de détails › » */
    expect(d.queryByRole('button', { name: 'Plus de détails ›' })).toBeNull();
    expect(fete).not.toHaveBeenCalled();
    cleanup();
    render(<TodoTimeline items={[]} adding onAdding={() => undefined} onCreate={() => undefined} onToggle={() => undefined} onEdit={() => undefined} dateDepart={S49} titreDepart="ZZ TEST — Fête" montantDepart="+2 400 CHF" />);
    const pose = within(screen.getByRole('dialog', { name: 'Poser sur le fil' }));
    expect(pose.getByLabelText('Quoi')).toHaveValue('ZZ TEST — Fête');
    expect(pose.getByText(/Montant repris du calendrier : \+2 400 CHF/)).toBeTruthy();
  });

  it('Brassins : la recette touchée dans la feuille rapide part à la quick action ; rien de touché, l’appel sans argument d’avant', () => {
    const brassin = vi.fn();
    render(<BancCalendrier aujourdhui={JOUR} sansChrome callbacks={{ onPoserBrassin: brassin }} />);
    fireEvent.click(document.querySelector('button[data-plus="brassins"]')!);
    let d = within(screen.getByRole('dialog', { name: 'Brassins' }));
    fireEvent.click(within(d.getByRole('group', { name: 'Recettes' })).getAllByRole('button')[0]!);
    fireEvent.click(d.getByRole('button', { name: 'Plus de détails ›' }));
    expect(brassin).toHaveBeenCalledTimes(1);
    expect(typeof brassin.mock.calls[0]![0]).toBe('string');
    fireEvent.click(document.querySelector('button[data-plus="brassins"]')!);
    d = within(screen.getByRole('dialog', { name: 'Brassins' }));
    fireEvent.click(d.getByRole('button', { name: 'Plus de détails ›' }));
    expect(brassin.mock.calls[1]).toEqual([]);
  });
});

describe('5. D386 : le fil au repos et le fil pâle se peignent (couleur d’un jeton qui existe)', () => {
  it('chaque rgb(var(--cave-N)) des feuilles de la frise est défini dans les deux thèmes', () => {
    const lire = (p: string) => readFileSync(resolve(__dirname, '../../', p), 'utf8');
    const themes = lire('src/theme/themes.css');
    const defini = (jeton: string, theme: string) => {
      const bloc = themes.slice(themes.indexOf(`[data-theme='${theme}']`));
      return new RegExp(`--${jeton}:`).test(bloc.slice(0, bloc.indexOf('}')));
    };
    for (const css of ['src/ui/calendrier/frise/frise.css', 'src/ui/calendrier/frise/feuille.css']) {
      const jetons = [...new Set([...lire(css).matchAll(/var\(--(cave-\d+)\)/g)].map(m => m[1]!))];
      for (const j of jetons) for (const t of ['clair', 'cave']) expect(defini(j, t), `${css} : --${j} absent du thème ${t}`).toBe(true);
    }
    expect(lire('src/ui/calendrier/frise/frise.css')).toMatch(/path\.cal-fil \{ stroke: rgb\(var\(--cave-400\)\)/);
  });
});

describe('4. CAL-BARRE-HAUTE : un brassin pas brassé tient au format de la Stout', () => {
  const COLS: Colonne[] = Array.from({ length: 6 }, (_, i) => ({ debut: ajouterJours(L, i * 7), fin: ajouterJours(L, i * 7 + 6), etiquette: etiquetteS(ajouterJours(L, i * 7)) }));
  const brassin = (id: string, titre: string, cols: number, prete: string, centimes: number, pasBrassee = true): ChoseCalendrier => ({
    id: `brassin-${id}`, rangee: 'brassins', titre, debut: L, fin: ajouterJours(L, cols * 7 - 1), centimes,
    duree: pasBrassee ? `pas brassée · prête le ${prete}` : `J7 / 28 · prête ${prete}`, ...(pasBrassee ? { pasBrassee: true } : {}),
    source: { genre: 'batch', id, statut: 'planifie' }, ouvre: { ecran: 'brassin', id }, deplacable: true
  } as ChoseCalendrier);

  it('Ttt, Fruty, Hefe pas brassés (6 sem., 390) : nom, montant et durée sur une ligne, jamais la durée sur une 2e ligne ni sous la barre', () => {
    const choses = [
      brassin('STOUT', 'Stout maison', 4, '7 déc.', -16000, false),
      brassin('TTT', 'Ttt', 3, '3 déc.', -14800), brassin('FRUTY', 'Fruty', 2, '28 nov.', -9900), brassin('HEFE', 'Hefe', 4, '12 déc.', -12000)
    ];
    for (const reserve of [0, 60]) {
      const { items } = disposer(choses, COLS, 56, 366, { reserveDroite: reserve });
      for (const d of items) {
        expect(d.deuxLignes, `${d.chose.titre} (réserve ${reserve})`).toBe(false);
        expect(d.phraseBas, d.chose.titre).toBeUndefined();
      }
    }
  });

  it('au banc : aucune barre de brassin ne porte sa durée sur une 2e ligne (cal-lbl-2n)', () => {
    monter();
    const brassins = [...document.querySelectorAll('[data-barre][data-rangee="brassins"]')];
    expect(brassins.length).toBeGreaterThan(0);
    for (const b of brassins) {
      const lbl = b.nextElementSibling;
      if (lbl?.classList.contains('cal-lbl')) expect(lbl.className, b.getAttribute('data-titre') ?? '').not.toMatch(/cal-lbl-2n/);
    }
    act(() => undefined);
  });
});
