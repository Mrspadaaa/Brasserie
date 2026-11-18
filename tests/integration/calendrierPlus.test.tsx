import React from 'react';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

/* « Prévoir une dépense » (PlanSheet) lit Finances : un service simulé, comme les tests de la feuille (previsionAjout). Aucune donnée réelle. */
const etat = vi.hoisted(() => ({ savePlan: vi.fn(), profile: null as unknown, plans: [] as unknown[] }));
vi.mock('../../src/services/financeService', () => {
  const FinanceService = {
    getPayments: () => [], getPlans: () => etat.plans, getProfile: () => etat.profile, getAssets: () => [], getClosings: () => [],
    snapshot: () => ({ profile: etat.profile, plans: etat.plans, payments: [], assets: [], closings: [] }),
    savePlan: (...a: unknown[]) => etat.savePlan(...a)
  };
  return { FinanceService };
});
import { BancCalendrier } from '../../src/design/CalendrierPreview';
import { resumeSansSemaine } from '../../src/components/tabs/CalendrierTab';
import { PlanSheet } from '../../src/ui/finance/FinanceForms';
import { StorageService } from '../../src/services/storage';
import { usePlusPageActions } from '../../src/ui/plusPage';
import type { FinancialProfile } from '../../src/domain/finance/types';
import type { FinanceCategory } from '../../src/types';
import { construireModele } from '../../src/ui/calendrier/useDonneesCalendrier';
import { REGLAGES_VIDES } from '../../src/domain/fournisseurs';

const JOUR = '2026-11-16';
const profilConnu: FinancialProfile = { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', vatRegistered: false, accounting: 'simplified', openingCash: { date: '2026-01-01', amountCents: 400_000, confirmed: true } } as FinancialProfile;
type Appel = { op: string; collection: string; id: string; patch?: Record<string, unknown> };

beforeEach(() => {
  localStorage.clear();
  etat.profile = profilConnu; etat.plans = []; etat.savePlan.mockReset();
  for (const cle of ['calendrier_epingles', 'calendrier_etoiles', 'calendrier_masquees', 'calendrier_ordre']) StorageService.setUiState(cle, []);
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

const monter = (props: React.ComponentProps<typeof BancCalendrier> = {}) => {
  const appels: Appel[] = [];
  const r = render(<BancCalendrier aujourdhui={JOUR} sansChrome onAppel={a => appels.push(a as Appel)} {...props} />);
  return { appels, ...r };
};
const dialogue = (nom: string) => within(screen.getByRole('dialog', { name: nom }));
function Lecteur() {
  const decl = usePlusPageActions();
  return <ul data-lecteur>{decl?.actions.map(a => <li key={a.id}><button type="button" onClick={a.lancer}>{a.label}</button></li>)}</ul>;
}

describe('C6 : le + volant porte les gestes du calendrier, dans l’ordre de la frise', () => {
  const ATTENDU: Array<[string, string]> = [
    ['Poser un brassin', 'Brassins'], ['Poser une fête', 'Fêtes'], ['Poser une vente', 'Ventes'], ['Prévoir un achat', 'Achats'],
    ['Prévoir des travaux', 'Travaux'], ['Noter une activité', 'Activités'], ['Prévoir un papier', 'Papiers'], ['Noter une idée', 'Noter une idée']
  ];
  it('usePlusPageActions rend les huit lignes dans l’ordre ; chacune ouvre la feuille sur sa rangée ; aucun « S\\d+ » sur le +', () => {
    render(<><BancCalendrier aujourdhui={JOUR} /><Lecteur /></>);
    const lecteur = within(document.querySelector('[data-lecteur]') as HTMLElement);
    expect(lecteur.getAllByRole('button').map(b => b.textContent)).toEqual(ATTENDU.map(a => a[0]));
    for (const [ligne, titre] of ATTENDU) {
      fireEvent.click(lecteur.getByRole('button', { name: ligne }));
      const d = screen.getByRole('dialog', { name: titre });
      if (titre !== 'Noter une idée') expect(d.querySelector(`[data-feuille-rangee]`)).not.toBeNull();
      fireEvent.keyDown(d, { key: 'Escape' });
    }
    const plus = screen.getByRole('button', { name: /Actions rapides/ });
    expect(plus.getAttribute('aria-label')).not.toMatch(/S\d+/);
    for (const [ligne] of ATTENDU) expect(ligne).not.toMatch(/S\d+/);
  });

  it('le + de l’app ouvre la pile : « Sur Calendrier » en tête (huit lignes), « Partout » au-dessus', () => {
    render(<BancCalendrier aujourdhui={JOUR} />);
    fireEvent.click(screen.getByRole('button', { name: /Actions rapides/ }));
    const menu = screen.getByRole('menu');
    const textes = [...menu.querySelectorAll('[role="menuitem"]')].map(i => i.textContent ?? '');
    for (const [ligne] of ATTENDU) expect(textes.some(t => t.includes(ligne)), ligne).toBe(true);
    expect(menu.textContent).toMatch(/Sur\s*le calendrier/);
    expect(menu.textContent).toMatch(/Partout/);
    /* aucun « S47 » sur le + ni dans le nom d'une ligne (D-162) ; la précision du plein dit la semaine et « prête le … », comme la passe 10 */
    const noms = [...menu.querySelectorAll('[role="menuitem"] b, [role="menuitem"] .plus-pp-t')].map(e => e.textContent ?? '').join(' | ');
    expect(noms).not.toMatch(/\bS\d{1,2}\b/);
  });
});

describe('C7 (CAL-CLAV) : une fête, une vente probable et un brassin s’ajoutent sans clavier, en 2 touchers', () => {
  const ouvrir = (id: string) => fireEvent.click(document.querySelector(`button[data-plus="${id}"]`)!);

  it('fête : une puce, « Ajouter » ; aucun champ numérique', async () => {
    const { appels } = monter();
    ouvrir('fetes');
    const d = dialogue('Fêtes');
    let touchers = 0;
    fireEvent.click(d.getByRole('button', { name: 'Fête de village' })); touchers += 1;
    fireEvent.click(d.getByRole('button', { name: /^Ajouter/ })); touchers += 1;
    expect(touchers).toBeLessThanOrEqual(2);
    await waitFor(() => expect(appels.filter(a => a.op === 'creer')).toHaveLength(1));
    expect(appels[0]).toMatchObject({ collection: 'creativeItems', patch: { type: 'event', title: 'Fête de village', date: '2026-11-16' } });
    expect(document.querySelectorAll('input[type="number"]')).toHaveLength(0);
  });

  it('vente probable : la puce porte le client et le montant, « Ajouter »', async () => {
    const { appels } = monter();
    ouvrir('ventes');
    const d = dialogue('Ventes');
    fireEvent.click(d.getByRole('button', { name: /Café du Pont, 1 fût/ }));
    fireEvent.click(d.getByRole('button', { name: /^Ajouter/ }));
    await waitFor(() => expect(appels.filter(a => a.op === 'creer')).toHaveLength(1));
    expect(appels[0]).toMatchObject({ collection: 'financialPlans', patch: { title: 'Café du Pont, 1 fût', amountCents: 13000, direction: 'in', status: 'active' } });
    expect(document.querySelectorAll('input[type="number"]')).toHaveLength(0);
  });

  it('brassin : la puce de la recette, « Ajouter » : un brassin planifié avec sa recette', async () => {
    const { appels } = monter();
    ouvrir('brassins');
    const d = dialogue('Brassins');
    fireEvent.click(d.getByRole('button', { name: 'Porter d’hiver' }));
    fireEvent.click(d.getByRole('button', { name: /^Ajouter/ }));
    await waitFor(() => expect(appels.filter(a => a.op === 'creer')).toHaveLength(1));
    expect(appels[0]).toMatchObject({ collection: 'batches', patch: { recipeRef: 'R-PORTER', status: 'planifie', plannedBrewDate: '2026-11-16' } });
  });

  it('CRITIQUE-7 (A6) : le message d’une pose dit la semaine une seule fois (« Café du Pont, 1 fût · S47 : a → b », jamais « S47 · S47 : »)', async () => {
    const { appels } = monter();
    const messages: string[] = [];
    for (const [rangee, puce] of [['ventes', /Café du Pont, 1 fût/], ['ventes', /^La Cigogne/], ['fetes', /^Fête de village$/]] as const) {
      ouvrir(rangee);
      const d = dialogue(rangee === 'ventes' ? 'Ventes' : 'Fêtes');
      fireEvent.click(d.getAllByRole('button', { name: puce })[0]);
      const n = appels.filter(a => a.op === 'creer').length;
      fireEvent.click(d.getByRole('button', { name: /^Ajouter/ }));
      await waitFor(() => expect(appels.filter(a => a.op === 'creer').length).toBe(n + 1));
      const statut = await screen.findByText(/Annuler/, { selector: '[role="status"] *, [role="status"]' }).catch(() => null);
      messages.push((statut?.closest('[role="status"]') ?? document.querySelector('[role="status"]'))?.textContent ?? '');
    }
    /* au moins une pose avec effet sur la caisse (la vente probable) : sinon le test ne prouverait rien */
    expect(messages.some(m => /S\d+ : [−\d\s’']+ → [−\d\s’']+/.test(m))).toBe(true);
    for (const m of messages) {
      const semaines = m.match(/\bS\d{1,2}\b/g) ?? [];
      expect(new Set(semaines).size, `message « ${m} »`).toBe(semaines.length);
    }
  });

  it('resumeSansSemaine : la semaine du résumé part quand l’effet la dit ; le reste (« vente confirmée ») reste', () => {
    expect(resumeSansSemaine('3 fûts La Cigogne · S47', 'S47 : 3 268 → 4 168')).toBe('3 fûts La Cigogne');
    expect(resumeSansSemaine('Café du Pont · S2 ’27 · vente confirmée', 'S2 : 100 → 230')).toBe('Café du Pont · vente confirmée');
    expect(resumeSansSemaine('Hotte · S49', 'S50 : 1 → 2')).toBe('Hotte · S49');
    expect(resumeSansSemaine('S47 · S47', 'S47 : 1 → 2')).toBe('S47');
  });

  it('une somme au-delà de 10 fois la plus grosse de la rangée demande confirmation', async () => {
    const { appels } = monter();
    ouvrir('achats');
    const d = dialogue('Achats');
    fireEvent.click(d.getByRole('button', { name: 'Hotte' }));
    const champ = d.getByLabelText('Montant en CHF');
    fireEvent.focus(champ); fireEvent.change(champ, { target: { value: '90000' } }); fireEvent.blur(champ);
    fireEvent.click(d.getByRole('button', { name: /^Ajouter/ }));
    expect(await screen.findByText(/plus de 10 fois/)).toBeInTheDocument();
    expect(appels).toHaveLength(0);
    fireEvent.click(d.getByRole('button', { name: /^Oui, 90 000 CHF/ }));
    await waitFor(() => expect(appels.filter(a => a.op === 'creer')).toHaveLength(1));
  });
});

describe('C13 (D-117) : « Mettre de côté » ne crée aucun plan dans Finances', () => {
  it('Activités avec fenêtre et montant : « Mettre de côté » s’active ; la chose porte fenetre.miseDeCote ; 0 écriture de FinancialPlan', async () => {
    const { appels } = monter({ callbacks: { periode: { genre: 'dates', du: '2026-11-16', au: '2027-11-14' } } });
    fireEvent.click(document.querySelector('button[data-plus="activites"]')!);
    const d = dialogue('Activités');
    expect(d.queryByRole('button', { name: /Mettre de côté/ })).toBeNull();
    fireEvent.click(d.getByRole('button', { name: 'Inventaire du stock' }));
    const semaines = within(d.getByRole('group', { name: 'Semaine' }));
    fireEvent.click(semaines.getByRole('button', { name: /^S20/ }));
    fireEvent.click(semaines.getByRole('button', { name: /^S40/ }));
    const champ = d.getByLabelText('Montant en CHF');
    fireEvent.focus(champ); fireEvent.change(champ, { target: { value: '600' } }); fireEvent.blur(champ);
    const mise = d.getByRole('button', { name: /Mettre de côté/ });
    fireEvent.click(mise);
    expect(mise).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(d.getByRole('button', { name: /^Ajouter/ }));
    await waitFor(() => expect(appels.filter(a => a.op === 'creer')).toHaveLength(1));
    expect(appels[0]).toMatchObject({ collection: 'creativeItems', patch: { fenetre: { du: '2027-05-17', au: '2027-10-10', miseDeCote: true } } });
    expect(appels.filter(a => a.collection === 'financialPlans')).toHaveLength(0);
    expect(etat.savePlan).not.toHaveBeenCalled();
  });

  it('Achats avec fenêtre et montant : « Mettre de côté » est proposé', () => {
    monter();
    fireEvent.click(document.querySelector('button[data-plus="achats"]')!);
    const d = dialogue('Achats');
    const semaines = within(d.getByRole('group', { name: 'Semaine' }));
    fireEvent.click(semaines.getByRole('button', { name: /^S49/ }));
    fireEvent.click(semaines.getByRole('button', { name: /^S52/ }));
    const champ = d.getByLabelText('Montant en CHF');
    fireEvent.focus(champ); fireEvent.change(champ, { target: { value: '300' } }); fireEvent.blur(champ);
    expect(d.getByRole('button', { name: /Mettre de côté/ })).toBeInTheDocument();
  });
});

describe('C17 (D-68) : « Plus de détails › » ouvre Prévoir une dépense, datée du lundi de la semaine choisie', () => {
  it('sur la feuille Achats, S50 choisie : PlanSheet titrée « Prévoir une dépense », date = lundi de S50 (prop existante `date`)', () => {
    function Harnais() {
      const [date, setDate] = React.useState<string | null>(null);
      return <><BancCalendrier aujourdhui={JOUR} sansChrome callbacks={{ onPoserDepense: setDate }} />{date && <PlanSheet date={date} onClose={() => setDate(null)} />}</>;
    }
    render(<Harnais />);
    fireEvent.click(document.querySelector('button[data-plus="achats"]')!);
    const d = dialogue('Achats');
    fireEvent.click(within(d.getByRole('group', { name: 'Semaine' })).getByRole('button', { name: /^S50/ }));
    fireEvent.click(d.getByRole('button', { name: 'Plus de détails ›' }));
    const plan = within(screen.getByRole('dialog', { name: 'Prévoir une dépense' }));
    expect(plan.getByLabelText('Date de paiement prévue')).toHaveValue('2026-12-07');
  });

  it('CRITIQUE-5 n° 3 (D-68, E34) : depuis Achats S50, « Plus de détails › » rend le lundi de S50 ET la rangée Achats (la catégorie en vient)', () => {
    const onPoserDepense = vi.fn();
    monter({ callbacks: { onPoserDepense } });
    fireEvent.click(document.querySelector('button[data-plus="achats"]')!);
    const d = dialogue('Achats');
    fireEvent.click(within(d.getByRole('group', { name: 'Semaine' })).getByRole('button', { name: /^S50/ }));
    fireEvent.click(d.getByRole('button', { name: 'Plus de détails ›' }));
    expect(onPoserDepense).toHaveBeenCalledTimes(1);
    expect(onPoserDepense).toHaveBeenCalledWith('2026-12-07', 'achats', 'brassage');
  });

  it('CRITIQUE-6 n° 3 (D-68, E34, E38) : Achats S50 › Plus de détails › Enregistrer : le service des plans reçoit « brassage » et le lundi de S50, jamais « Charges fixes »', async () => {
    /* le fil exact du bloc calendrier d'App.tsx : `onPoserDepense={(lundi, _rangee, categorie) => setPrevoirDepense({ date: lundi, categorie })}` */
    function Harnais() {
      const [p, setP] = React.useState<{ date: string; categorie?: FinanceCategory } | null>(null);
      return <><BancCalendrier aujourdhui={JOUR} sansChrome callbacks={{ onPoserDepense: (date, _r, categorie) => setP({ date, ...(categorie ? { categorie } : {}) }) }} />
        {p && <PlanSheet date={p.date} {...(p.categorie ? { categorie: p.categorie } : {})} onClose={() => setP(null)} />}</>;
    }
    render(<Harnais />);
    fireEvent.click(document.querySelector('button[data-plus="achats"]')!);
    const d = dialogue('Achats');
    fireEvent.click(within(d.getByRole('group', { name: 'Semaine' })).getByRole('button', { name: /^S50/ }));
    fireEvent.click(d.getByRole('button', { name: 'Plus de détails ›' }));
    const plan = within(screen.getByRole('dialog', { name: 'Prévoir une dépense' }));
    /* la pastille de catégorie le dit avant l'enregistrement : « Brassage » */
    expect((plan.getByLabelText('Catégorie') as HTMLSelectElement).value).toBe('brassage');
    fireEvent.change(plan.getByPlaceholderText(/Loyer, commande de malt/), { target: { value: 'ZZ TEST — houblon Citra' } });
    const montant = plan.getByLabelText('Montant (CHF)');
    fireEvent.change(montant, { target: { value: '240' } });
    fireEvent.blur(montant);
    fireEvent.click(plan.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(etat.savePlan).toHaveBeenCalledTimes(1));
    const ecrit = etat.savePlan.mock.calls[0][0] as { category: string; date: string; amountCents: number; source: string };
    expect(ecrit).toMatchObject({ category: 'brassage', date: '2026-12-07', amountCents: 24000, source: 'manual' });
    /* relu par le calendrier : il tombe dans Achats */
    const m = construireModele({
      aujourdhui: JOUR, transactions: [], payments: [], plans: [ecrit] as never, profile: profilConnu, assets: [], batches: [],
      stockItems: [], items: [], recettes: [], reglages: REGLAGES_VIDES, lignesCourses: []
    });
    expect(m.choses.find(c => c.titre === 'ZZ TEST — houblon Citra')?.rangee).toBe('achats');
  });

  it('CRITIQUE-6 n° 3 : ouverte depuis Finances (sans date ni catégorie), la prévision neuve reste « Charges fixes », datée du jour (C17 tenu)', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-15T10:00:00Z'));
    render(<PlanSheet onClose={() => undefined} />);
    const plan = within(screen.getByRole('dialog', { name: 'Prévoir une dépense' }));
    expect((plan.getByLabelText('Catégorie') as HTMLSelectElement).value).toBe('chargesFixes');
    expect(plan.getByLabelText('Date de paiement prévue')).toHaveValue('2026-11-15');
  });

  it('CRITIQUE-5 n° 3 : une prévision manuelle « Brassage » tombe dans Achats, jamais dans Papiers ; « Charges fixes » tombe dans Papiers (le défaut d’avant)', () => {
    const p = (id: string, category: string) => ({ id, title: `ZZ TEST — ${id}`, date: '2026-12-07', amountCents: 24000, direction: 'out', category, source: 'manual', status: 'active', createdAt: '2026-11-16T08:00:00.000Z' });
    const m = construireModele({
      aujourdhui: JOUR, transactions: [], payments: [], plans: [p('houblon', 'brassage'), p('loyer', 'chargesFixes')] as never, profile: profilConnu, assets: [], batches: [],
      stockItems: [], items: [], recettes: [], reglages: REGLAGES_VIDES, lignesCourses: []
    });
    const rangeeDe = (titre: string) => m.choses.find(c => c.titre === titre)?.rangee;
    expect(rangeeDe('ZZ TEST — houblon')).toBe('achats');
    expect(rangeeDe('ZZ TEST — loyer')).toBe('papiers');
  });

  it('ouverte depuis Finances sans date, elle garde la date du jour', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-15T10:00:00Z'));
    render(<PlanSheet onClose={() => undefined} />);
    expect(within(screen.getByRole('dialog', { name: 'Prévoir une dépense' })).getByLabelText('Date de paiement prévue')).toHaveValue('2026-11-15');
  });

  it('aucune prop dateInitiale n’existe dans le code', () => {
    const racine = join(process.cwd(), 'src');
    const fichiers = (readdirSync(racine, { recursive: true }) as string[]).filter(f => /\.(ts|tsx)$/.test(f));
    const trouves = fichiers.filter(f => readFileSync(join(racine, f), 'utf8').includes('dateInitiale'));
    expect(trouves).toEqual([]);
  });
});

describe('CRITIQUE-2 n° 4 et 12 (D-206, E35) : le + volant en paysage, deux blocs, rien coupé ; la précision garde sa date', () => {
  const vraiMatchMedia = window.matchMedia;
  const couche = (actif: boolean) => {
    window.matchMedia = ((q: string) => ({
      matches: actif && /landscape|max-height/.test(q), media: q, onchange: null,
      addEventListener: () => undefined, removeEventListener: () => undefined, addListener: () => undefined, removeListener: () => undefined, dispatchEvent: () => false
    })) as unknown as typeof window.matchMedia;
  };
  afterEach(() => { window.matchMedia = vraiMatchMedia; });
  const LIGNES = ['Poser un brassin', 'Poser une fête', 'Poser une vente', 'Prévoir un achat', 'Prévoir des travaux', 'Noter une activité', 'Prévoir un papier', 'Noter une idée'];

  it('844 × 390 (matchMedia simulé) : deux blocs côte à côte, « Sur le calendrier » et « Partout » ; ses lignes toutes dans le document, noms courts', () => {
    couche(true);
    render(<BancCalendrier aujourdhui={JOUR} />);
    fireEvent.click(screen.getByRole('button', { name: /Actions rapides/ }));
    const menu = screen.getByRole('menu');
    expect(menu).toHaveAttribute('data-plus-disposition', 'deux-blocs');
    const blocs = [...menu.querySelectorAll(':scope > [data-bloc]')].map(b => b.getAttribute('data-bloc'));
    expect(blocs).toEqual(['ecran', 'partout']);
    const ecran = within(menu.querySelector('[data-bloc="ecran"]') as HTMLElement);
    for (const ligne of LIGNES) expect(ecran.getByRole('menuitem', { name: new RegExp(`^${ligne}`) })).toBeInTheDocument();
    expect(ecran.getByText('Fête')).toBeInTheDocument();
    expect(ecran.getByText('Idée')).toBeInTheDocument();
    expect(menu.querySelector('[data-bloc="ecran"]')!.textContent).toMatch(/Sur\s*le calendrier/);
    const partout = within(menu.querySelector('[data-bloc="partout"]') as HTMLElement);
    expect(partout.getByText('Partout')).toBeInTheDocument();
    expect(partout.getAllByRole('menuitem').length).toBeGreaterThanOrEqual(2);
    /* le plein est la première ligne du menu (focus à l'ouverture, contre le +) */
    expect(menu.querySelector('[role="menuitem"]')!.textContent).toMatch(/^Poser un brassin/);
    /* chaque ligne ouvre toujours la feuille de sa rangée */
    fireEvent.click(ecran.getByRole('menuitem', { name: 'Prévoir des travaux' }));
    expect(screen.getByRole('dialog', { name: 'Travaux' })).toBeInTheDocument();
  });

  it('CRITIQUE-6 n° 19 (E36) : en paysage, la case « Idée » garde « en S47, dans le carnet » sous son nom court, comme en portrait ; les autres cases n’ont que leur nom', () => {
    couche(true);
    render(<BancCalendrier aujourdhui={JOUR} />);
    fireEvent.click(screen.getByRole('button', { name: /Actions rapides/ }));
    const ecran = screen.getByRole('menu').querySelector('[data-bloc="ecran"]') as HTMLElement;
    const idee = ecran.querySelector('[data-page-action="idee"]') as HTMLElement;
    expect(idee.textContent).toMatch(/^Idée/);
    expect(idee.querySelector('[data-plus-precision]')!.textContent).toMatch(/^en S47, dans le carnet$/);
    expect(idee.getAttribute('aria-label')).toBe('Noter une idée en S47, dans le carnet');
    for (const id of ['fete', 'vente', 'achat', 'travaux', 'activite', 'papier']) {
      expect(ecran.querySelector(`[data-page-action="${id}"] [data-plus-precision]`)).toBeNull();
    }
  });

  it('portrait : la pile d’origine, sans deux blocs', () => {
    couche(false);
    render(<BancCalendrier aujourdhui={JOUR} />);
    fireEvent.click(screen.getByRole('button', { name: /Actions rapides/ }));
    const menu = screen.getByRole('menu');
    expect(menu).not.toHaveAttribute('data-plus-disposition');
    expect(menu.querySelector('[data-bloc]')).toBeNull();
  });

  it('CRITIQUE-7 n° 4 : le 18 nov., « Poser un brassin S47 · prête le 16 déc. » (brassé au plus tôt aujourd’hui + 28 j), plus le 14 déc. compté depuis le lundi', () => {
    render(<BancCalendrier aujourdhui="2026-11-18" />);
    fireEvent.click(screen.getByRole('button', { name: /Actions rapides/ }));
    const precision = screen.getByRole('menu').querySelector('[data-page-action="brassin"] [data-plus-precision]') as HTMLElement;
    expect(precision.textContent).toMatch(/^S47 · prête le 16 déc\.?$/);
    expect(precision.textContent).not.toMatch(/14 déc/);
  });

  it('« Poser un brassin » : sa précision est sous le libellé, entière, avec la date de « prête le »', () => {
    render(<BancCalendrier aujourdhui={JOUR} />);
    fireEvent.click(screen.getByRole('button', { name: /Actions rapides/ }));
    const precision = screen.getByRole('menu').querySelector('[data-page-action="brassin"] [data-plus-precision]') as HTMLElement;
    expect(precision.textContent).toMatch(/prête le \d{1,2} \S+/);
    expect(precision.className).toContain('!whitespace-normal');
  });
});

describe('CRITIQUE-2 n° 40 (E34, D-68, C17) : les feuilles Ventes, Achats, Travaux, Activités et Papiers, sans clavier, en 2 touchers', () => {
  const CAS: Array<{ rangee: string; titre: string; puce: string; attendu: Record<string, unknown> }> = [
    { rangee: 'ventes', titre: 'Ventes', puce: 'La Cigogne', attendu: { collection: 'financialPlans', patch: { title: expect.stringMatching(/La Cigogne$/), amountCents: 90000, direction: 'in', clientId: 'CL-CIGOGNE' } } },
    { rangee: 'achats', titre: 'Achats', puce: 'Hotte', attendu: { collection: 'financialPlans', patch: { title: 'Hotte', amountCents: 90000, direction: 'out' } } },
    { rangee: 'travaux', titre: 'Travaux', puce: 'Sols : colle et joints', attendu: { collection: 'financialPlans', patch: { title: 'Sols : colle et joints', amountCents: 32000, category: 'renovation' } } },
    { rangee: 'activites', titre: 'Activités', puce: 'Inventaire du stock', attendu: { collection: 'creativeItems', patch: { title: 'Inventaire du stock', activite: true } } },
    { rangee: 'papiers', titre: 'Papiers', puce: 'TVA T4', attendu: { collection: 'financialPlans', patch: { title: 'TVA T4', amountCents: 30000, direction: 'out' } } }
  ];
  for (const cas of CAS) {
    it(`${cas.titre} : la puce « ${cas.puce} » (nom et montant), puis « Ajouter »`, async () => {
      const { appels } = monter();
      fireEvent.click(document.querySelector(`button[data-plus="${cas.rangee}"]`)!);
      const d = dialogue(cas.titre);
      let touchers = 0;
      fireEvent.click(d.getByRole('button', { name: cas.puce })); touchers += 1;
      fireEvent.click(d.getByRole('button', { name: /^Ajouter/ })); touchers += 1;
      expect(touchers).toBeLessThanOrEqual(2);
      await waitFor(() => expect(appels.filter(a => a.op === 'creer')).toHaveLength(1));
      expect(appels[0]).toMatchObject(cas.attendu);
      expect(document.querySelectorAll('input[type="number"]')).toHaveLength(0);
    });
  }

  it('Achats : « Plus de détails › » ouvre Prévoir une dépense datée du lundi de la semaine choisie', () => {
    function Harnais() {
      const [date, setDate] = React.useState<string | null>(null);
      return <><BancCalendrier aujourdhui={JOUR} sansChrome callbacks={{ onPoserDepense: setDate }} />{date && <PlanSheet date={date} onClose={() => setDate(null)} />}</>;
    }
    render(<Harnais />);
    fireEvent.click(document.querySelector('button[data-plus="travaux"]')!);
    const d = dialogue('Travaux');
    fireEvent.click(within(d.getByRole('group', { name: 'Semaine' })).getByRole('button', { name: /^S49/ }));
    fireEvent.click(d.getByRole('button', { name: 'Plus de détails ›' }));
    expect(within(screen.getByRole('dialog', { name: 'Prévoir une dépense' })).getByLabelText('Date de paiement prévue')).toHaveValue('2026-11-30');
  });
});
