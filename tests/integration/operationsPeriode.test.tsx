import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
const recordPayment = vi.fn();
vi.mock('../../src/services/financeService', async (importOriginal) => {
  const reel = await importOriginal<typeof import('../../src/services/financeService')>();
  return { ...reel, FinanceService: { ...reel.FinanceService, recordPayment: (p: unknown) => recordPayment(p) } };
});
import { TransactionJournal, createJournalState } from '../../src/ui/finance/TransactionJournal';
import { TransactionRow } from '../../src/ui/finance/TransactionRow';
import { todayISO } from '../../src/domain/finance/ledger';
import type { Transaction } from '../../src/types';
import type { FinancialPayment } from '../../src/domain/finance/types';

/**
 * CP-12 (10.11) : « Toujours pas la bonne vue et je peux pas filtrer pour un intervalle de temps précis ».
 * Une seule vue (v6b : bande, graphe des piles, groupes par catégorie, « Annulées » en fin) pour toute période ; « Par date » ne change
 * que l'ordre des lignes ; la frise des jours et les champs du … au … (s2ap2, 14.11) bornent la plage ; « Annuler » ne paraît que juste après « ✓ Payé ».
 */
const today = todayISO();
const annee = today.slice(0, 4);
const tx = (id: string, date: string, category: Transaction['category'] = 'brassage', extra: Partial<Transaction> = {}): Transaction => ({
  id, description: `Op ${id}`, date, category, subcategory: '', amountHT: 100, amountTTC: 100, tvaAmount: 0, tvaRate: 0,
  finance: { version: 1, kind: category === 'recettes' ? 'income' : 'expense', amountCents: 10000, paymentStatus: 'unpaid', recordedAt: `${today}T12:00:00Z`, lines: [] },
  ...extra,
});
const pay = (t: Transaction, date = t.date): FinancialPayment => ({ id: `PAY-${t.id}`, transactionId: t.id, date, amountCents: 10000,
  direction: t.category === 'recettes' ? 'in' : 'out', method: 'bank', recordedAt: `${today}T12:00:00Z` });
const defaults = {
  archives: [], renderRow: (t: Transaction) => <button>{t.description}</button>,
  onManageArchives: () => {}, onPrivateMovement: () => {},
};
const juin = tx('JUIN', `${annee}-06-10`, 'brassage');
const aout = tx('AOUT', `${annee}-08-12`, 'nettoyage');
const sept = tx('SEPT', `${annee}-09-03`, 'chargesFixes');
const mars = tx('MARS', `${annee}-03-05`, 'brassage');
const toutes = [juin, aout, sept, mars];
const paiements = toutes.map(t => pay(t));
const montre = (name: string) => !!screen.queryByRole('button', { name });
const Hote = ({ initial = {}, transactions = toutes }: { initial?: Parameters<typeof createJournalState>[0]; transactions?: Transaction[] }) => {
  const [etat, setEtat] = React.useState(() => createJournalState(initial));
  return <TransactionJournal {...defaults} transactions={transactions} payments={transactions.map(t => pay(t))} state={etat} onStateChange={setEtat}/>;
};
afterEach(() => { cleanup(); recordPayment.mockClear(); });

describe('Opérations : une seule vue, quelle que soit la période', () => {
  it('(a) « Par date » : la bande et le graphe restent, les lignes se rangent par jour', () => {
    const { container } = render(<Hote initial={{ scope: 'all', allDates: true }}/>);
    fireEvent.click(screen.getByRole('button', { name: 'Par date' }));
    expect(screen.getByRole('group', { name: /par catégorie/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/Payé, à payer et dépensé/)).toBeInTheDocument();
    expect(container.querySelector('.ops-bande')).not.toBeNull();
    const groupes = [...container.querySelectorAll('[data-groupe]')].map(g => g.getAttribute('data-groupe'));
    expect(groupes.length).toBe(4);
    expect(new Set(groupes)).toEqual(new Set(['jour']));
    // « Par date » ne change pas la période : la pastille dit toujours la même chose.
    expect(screen.getByRole('button', { name: /Choisir le mois, Toutes les dates/ })).toBeInTheDocument();
  });

  it('(a bis) « Par date » se défait : retour aux groupes par catégorie, sans toucher la période', () => {
    const { container } = render(<Hote initial={{ scope: 'all', allDates: true }}/>);
    const puce = screen.getByRole('button', { name: 'Par date' });
    fireEvent.click(puce);
    expect(puce).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(puce);
    expect(puce).toHaveAttribute('aria-pressed', 'false');
    const groupes = new Set([...container.querySelectorAll('[data-groupe]')].map(g => g.getAttribute('data-groupe')));
    expect(groupes.has('jour')).toBe(false);
    expect(groupes.has('brassage')).toBe(true);
  });

  it('(b) « Tout », archives comprises : groupes par catégorie ET graphe', () => {
    const { container } = render(<Hote initial={{ scope: 'all', allDates: true }}/>);
    expect(screen.getByRole('group', { name: /par catégorie/ })).toBeInTheDocument();
    const groupes = [...container.querySelectorAll('[data-groupe]')].map(g => g.getAttribute('data-groupe'));
    expect(groupes).not.toContain('jour');
    expect(groupes).toContain('brassage');
    expect(groupes).toContain('nettoyage');
    expect(screen.getByText('Archives comprises')).toBeVisible();
    // Le graphe de « tout » additionne tout l'historique : 4 pièces à 100,00, soit 400,00 dépensés.
    expect(screen.getByLabelText(/Payé, à payer et dépensé/).textContent).toMatch(/dépensé\s*400,00/);
  });

  it('(b bis) « Tout » depuis les archives : l\'année archivée garde la vue (bande + graphe)', () => {
    const vieux = tx('VIEUX', `${Number(annee) - 1}-05-05`, 'brassage');
    const archive = { id: `ARCHIVE-${Number(annee) - 1}`, year: Number(annee) - 1, status: 'archived', operationId: 'ARCHIVE-OP', archivedAt: `${today}T13:00:00Z`, updatedAt: `${today}T13:00:00Z` } as const;
    render(<TransactionJournal {...defaults} archives={[archive]} transactions={[vieux, juin]} payments={[pay(vieux), pay(juin)]}
      state={createJournalState({ scope: 'archives' })} onStateChange={() => {}}/>);
    expect(montre('Op VIEUX')).toBe(true);
    expect(montre('Op JUIN')).toBe(false);
    expect(screen.getByRole('group', { name: /par catégorie/ })).toBeInTheDocument();
  });

  it('(c) champs « du » / « au » (ordinateur) : du 1er juin au 30 sept., seules ces pièces, titre « 1er juin → 30 sept. », piles de la plage', () => {
    const { container } = render(<Hote initial={{ scope: 'all' }}/>);
    // s2ap2 (14.11) remplace « Autre période » : deux champs date posent la plage du jour au jour, la frise la montre.
    const champs = screen.getByRole('group', { name: 'Plage du … au …' });
    fireEvent.change(within(champs).getByLabelText('Du'), { target: { value: `${annee}-06-01` } });
    fireEvent.change(within(champs).getByLabelText('Au'), { target: { value: `${annee}-09-30` } });
    expect(montre('Op JUIN') && montre('Op AOUT') && montre('Op SEPT')).toBe(true);
    expect(montre('Op MARS')).toBe(false);
    expect(screen.getByLabelText(/Plage du 1er juin → 30 sept\./)).toBeInTheDocument();
    expect(screen.getByTestId('frise')).toBeInTheDocument();
    expect(screen.getAllByRole('slider').map(h => h.getAttribute('aria-label'))).toEqual(['Début', 'Fin']);
    // Les piles : 3 pièces à 100,00.
    expect(screen.getByLabelText(/Payé, à payer et dépensé/).textContent).toMatch(/dépensé\s*300,00/);
    expect(container.querySelector('[data-groupe="jour"]')).toBeNull();
  });

  it('(c bis) ‹ › glissent la plage de sa durée (122 jours) ; « × mois entier » la défait', () => {
    render(<Hote initial={{ scope: 'all', du: `${annee}-06-01`, au: `${annee}-09-30` }}/>);
    expect(montre('Op MARS')).toBe(false);
    expect(montre('Op JUIN')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: '122 jours plus tôt' }));
    // 1er juin − 122 jours = 30 janv. ; 30 sept. − 122 jours = 31 mai : la plage garde sa durée.
    expect(screen.getByLabelText(/Plage du 30 janv\. → 31 mai/)).toBeInTheDocument();
    expect(montre('Op MARS')).toBe(true);
    expect(montre('Op JUIN')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: '122 jours plus tard' }));
    expect(montre('Op JUIN')).toBe(true);
    expect(montre('Op MARS')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Revenir au mois entier' }));
    expect(screen.queryByLabelText(/^Plage du \d/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Replier les jours de/ })).toBeInTheDocument();
  });

  it('(c ter) une poignée au clavier resserre la plage (Page ± 7 jours) : la pièce du jour écarté sort de la liste', () => {
    render(<Hote initial={{ scope: 'all', du: `${annee}-06-01`, au: `${annee}-09-30` }}/>);
    const fin = screen.getByRole('slider', { name: 'Fin' });
    fireEvent.keyDown(fin, { key: 'PageDown' });
    fireEvent.keyDown(fin, { key: 'PageDown' });
    const debut = screen.getByRole('slider', { name: 'Début' });
    fireEvent.keyDown(debut, { key: 'PageUp' });
    fireEvent.keyDown(debut, { key: 'PageUp' });
    // 30 sept. − 14 jours = 16 sept. ; 1er juin + 14 jours = 15 juin : la pièce du 10 juin sort, celles d'août et de septembre restent.
    expect(screen.getByLabelText(/^Plage du 15 juin → 16 sept\./)).toBeInTheDocument();
    expect(montre('Op JUIN')).toBe(false);
    expect(montre('Op AOUT') && montre('Op SEPT')).toBe(true);
  });
});

// Le lien « Matériel à part » de la Synthèse (r1, 14.11) pose le filtre `apart` : tout ce qu'Opérations range sous « Matériel · à part », jamais « Aucune opération ».
describe('Opérations : filtre « Matériel · à part » posé par la Synthèse', () => {
  const mois = today.slice(0, 7);
  const ligne = (kind: string, traitement?: string) => ({ id: `L-${kind}-${traitement ?? 'x'}`, kind, description: 'Ligne', amountCents: 10000, ...(traitement ? { capitalTreatment: traitement } : {}) });
  const avecLignes = (id: string, category: Transaction['category'], lignes: unknown[]) => tx(id, `${mois}-05`, category, {
    finance: { version: 1, kind: 'expense', amountCents: 10000, paymentStatus: 'paid', recordedAt: `${today}T12:00:00Z`, lines: lignes } as never,
  });
  const jeu = [
    tx('MAT', `${mois}-05`, 'materiel'), tx('REN', `${mois}-06`, 'renovation'),
    avecLignes('JOI', 'divers', [ligne('equipment', 'capital')]),
    avecLignes('JOIX', 'divers', [ligne('equipment', 'expense')]),
    tx('BRA', `${mois}-07`, 'brassage'),
  ];

  it('montre le matériel, le local et travaux ET la ligne equipment passée au capital, rien d\'autre', () => {
    render(<Hote transactions={jeu} initial={{ month: mois, category: 'apart' }}/>);
    expect(montre('Op MAT') && montre('Op REN') && montre('Op JOI')).toBe(true);
    expect(montre('Op JOIX')).toBe(false);
    expect(montre('Op BRA')).toBe(false);
    expect(screen.queryByText(/Aucune opération/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retirer le filtre : Matériel · à part' })).toBeInTheDocument();
  });

  it('le matériel seul et le local et travaux seul s\'affichent aussi (les deux coexistent ou non)', () => {
    render(<Hote transactions={[tx('MAT', `${mois}-05`, 'materiel'), tx('BRA', `${mois}-07`, 'brassage')]} initial={{ month: mois, category: 'apart' }}/>);
    expect(montre('Op MAT')).toBe(true);
    cleanup();
    render(<Hote transactions={[tx('REN', `${mois}-06`, 'renovation'), tx('BRA', `${mois}-07`, 'brassage')]} initial={{ month: mois, category: 'apart' }}/>);
    expect(montre('Op REN')).toBe(true);
    expect(montre('Op BRA')).toBe(false);
  });
});

describe('Opérations : « Annuler » seulement juste après « ✓ Payé »', () => {
  const ligne = (t: Transaction, payments: FinancialPayment[]) =>
    <TransactionRow transaction={t} transactions={[t]} payments={payments} onOpen={() => {}}/>;

  it('(d) une ligne payée aujourd\'hui, sans geste de cette session : « + pièce », pas « Annuler »', () => {
    const payee = tx('PAYEE', today, 'brassage');
    render(ligne(payee, [pay(payee, today)]));
    expect(screen.queryByRole('button', { name: 'Annuler le paiement du jour' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Joindre une pièce' })).toHaveTextContent('+ pièce');
  });

  it('(d bis) juste après le geste « ✓ Payé » de cette session : « Annuler » apparaît', () => {
    const due = tx('DUE', today, 'brassage');
    const { rerender } = render(ligne(due, []));
    fireEvent.click(screen.getByRole('button', { name: /^Payer/ }));
    expect(recordPayment).toHaveBeenCalledTimes(1);
    const ecrit = recordPayment.mock.calls[0][0] as FinancialPayment;
    rerender(ligne(due, [ecrit]));
    expect(screen.getByRole('button', { name: 'Annuler le paiement du jour' })).toHaveTextContent('Annuler');
  });
});

// CP-15 (10.11, « Pourquoi négatif sur un apport ? ») : l'en-tête du groupe des apports est signé comme l'argent qui entre.
describe('CP-15 : apports signés', () => {
  it('deux apports de 100,00 : « +200,00 » en tête du groupe, et la pile « Apports » sur le graphe', () => {
    const mois = today.slice(0, 7);
    const apport = (id: string) => tx(id, `${mois}-05`, 'apports', { finance: { version: 1, kind: 'contribution', amountCents: 10000, paymentStatus: 'paid', recordedAt: `${today}T12:00:00Z`, lines: [] } as never });
    const a = [apport('AP1'), apport('AP2')];
    const { container } = render(<Hote transactions={a} initial={{ month: mois }} />);
    expect(container.textContent).toMatch(/Apports et prélèvements\s*\+200,00/);
    expect(container.querySelector('[data-pile="apports"]')).not.toBeNull();
  });
});
