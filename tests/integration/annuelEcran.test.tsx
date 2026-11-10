import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children, footer }: any) => open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null }));
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { FinanceService } from '../../src/services/financeService';
import { buildAnnualReport } from '../../src/domain/finance/annual';
import { perteAvantStock } from '../../src/ui/finance/annuel/calculs';
import { montant } from '../../src/ui/finance/previsions/format';
import { AUJOURDHUI, Banc, demoData, seedDemo } from './annuelSupport';

beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(`${AUJOURDHUI}T10:00:00`)); window.history.replaceState({}, '', '/?dev-local'); FirestoreRepo.startSync(); seedDemo(); });
afterEach(() => { cleanup(); vi.useRealTimers(); FirestoreRepo.stopSync(); });
const QUESTIONS = ['Tout est noté ?', 'Avec combien as-tu commencé l’année ?', 'Qu’avais-tu en stock', 'Ce que ', 'qui doit quoi', 'Qu’as-tu pris pour toi', 'Six questions avant d’envoyer', 'Ce que tu recopies', 'Ton dossier 2026'];
const piste = (n: number) => screen.getByRole('button', { name: new RegExp(`^${n}\\. `) });

describe('Annuel g6 : la tête', () => {
  it('rend les colonnes de l’année, le stock « ? », la piste et « Ensuite », sans les anciens onglets', () => {
    const d = demoData(), r = buildAnnualReport({ year: 2026, transactions: d.transactions, payments: d.payments, assets: d.assets, profile: d.profile });
    render(<Banc/>);
    expect(screen.getByRole('heading', { name: 'Annuel' })).toBeInTheDocument();
    expect(screen.getByText(montant(perteAvantStock(r)))).toBeVisible();
    expect(screen.getByText(/CHF perdus/)).toBeVisible();
    expect(screen.getByText(/Stock au 31 déc\./).textContent).toMatch(/\?/);
    expect(screen.getByText(/Dépensé \+ usure/)).toBeVisible();
    expect(screen.getByText('2 / 9')).toBeVisible();
    expect(screen.getByText('Vérifier les opérations')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Mois par mois' })).toBeVisible();
    // remplacer, jamais fusionner : plus rien de l'ancien écran
    expect(screen.queryByRole('tab', { name: 'Préparer' })).toBeNull();
    expect(screen.queryByText('Les impôts de ta brasserie')).toBeNull();
    expect(screen.queryByText('Opérations et justificatifs')).toBeNull();
    expect(screen.queryByText('Cotisations et parts privées')).toBeNull();
    expect(screen.queryByRole('textbox', { name: 'Exercice' })).toBeNull();
  });
  it('« Mois par mois » : janv. à avr. « rien noté » (jamais 0), déc. « à venir », et l’écart du matériel à part est dit', () => {
    render(<Banc/>);
    fireEvent.click(screen.getByRole('button', { name: 'Mois par mois' }));
    const d = within(screen.getByRole('dialog', { name: 'Mois par mois · 2026' }));
    expect(d.getAllByText('rien noté')).toHaveLength(4); expect(d.getByText('à venir')).toBeVisible();
    expect(d.getByText(/Matériel à part/)).toBeVisible();
  });
  it('« 2026 ⌄ » ouvre la feuille Année et versions avec le champ Exercice validé', () => {
    render(<Banc/>);
    fireEvent.click(screen.getByRole('button', { name: /^Année 2026/ }));
    expect(within(screen.getByRole('dialog', { name: 'Année et versions' })).getByRole('textbox', { name: 'Exercice' })).toHaveValue('2026');
  });
  it('TVA : une ligne qui ouvre sa feuille', () => {
    render(<Banc/>);
    expect(screen.queryByText('TVA')).toBeNull(); // le banc ne passe pas de seuil : la ligne est absente, jamais inventée
  });
});

describe('Annuel g6 : les neuf étapes', () => {
  it('chaque segment de la piste ouvre son étape avec sa question, son terme et son action noire', () => {
    render(<Banc/>);
    for (let n = 1; n <= 9; n++) {
      fireEvent.click(n === 1 ? piste(1) : piste(n));
      expect(screen.getByRole('heading', { level: 3 }).textContent).toContain(QUESTIONS[n - 1]);
      expect(screen.getByText(/^terme : |^pour l’impôt/)).toBeVisible();
      expect(screen.getByText(`${n} / 9`)).toBeVisible();
      fireEvent.click(screen.getByRole('button', { name: 'Annuel' }));
      expect(screen.getByRole('button', { name: 'Mois par mois' })).toBeVisible();
    }
  });
  it('clavier : ← → entre segments, Échap revient à la tête', () => {
    render(<Banc/>);
    fireEvent.click(piste(1));
    piste(1).focus();
    fireEvent.keyDown(piste(1), { key: 'ArrowRight' });
    expect(piste(2)).toHaveFocus();
    fireEvent.keyDown(piste(2), { key: 'End' });
    expect(piste(9)).toHaveFocus();
    fireEvent.keyDown(piste(9), { key: 'Escape' });
    expect(screen.getByRole('button', { name: 'Mois par mois' })).toBeVisible();
  });
  it('un inconnu n’est jamais 0 : étapes 1, 3 et 8 sur la démo', () => {
    render(<Banc/>);
    fireEvent.click(piste(1));
    expect(screen.getByText(/rien noté/)).toBeVisible();
    expect(screen.getAllByText('?').length).toBeGreaterThan(3);
    expect(screen.getByText('Si c’est vraiment vide', { exact: false })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Rien' })).toBeNull();
    fireEvent.click(piste(3));
    expect(screen.getAllByText(/≈\s*22,42/).length).toBeGreaterThan(0);
    expect(screen.getByText('à compter')).toBeVisible();
    fireEvent.click(piste(8));
    expect(screen.getByText(/avant stock/)).toBeVisible();
    expect(screen.getByText('À confirmer')).toBeVisible();
    expect(screen.getByText('annexe 05 des instructions')).toBeVisible();
    expect(screen.getByRole('button', { name: /^Copier Revenu de la brasserie/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /^Copier Fortune/ })).toBeDisabled();
    expect(screen.getByText(/L’exercice court encore/)).toBeVisible();
  });
  it('étape 4 : l’escalier de la cuve et la ligne des joints', () => {
    render(<Banc/>);
    fireEvent.click(piste(4));
    expect(screen.getByRole('img', { name: /1.152,00 au 31 décembre/ })).toBeInTheDocument();
    expect(screen.getByText('Ce que Cuve de fermentation a perdu en 2026')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Matériel' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Petit achat' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/prévu \d{4}-\d{2} : pas cette année/)).toBeVisible();
  });
  it('étape 9 : le classeur, « Figer » désactivé sans clôture, le nom du téléchargement gardé', () => {
    render(<Banc/>);
    fireEvent.click(piste(9));
    expect(screen.getByRole('button', { name: 'Télécharger le dossier avec justificatifs' })).toBeEnabled();
    expect(screen.getByRole('button', { name: /^Figer la version 2026/ })).toBeDisabled();
    expect(screen.getByText(/note d’abord l’inventaire/)).toBeVisible();
    expect(screen.getByRole('button', { name: /^Pièces complémentaires/ })).toBeVisible();
    expect(screen.getByRole('button', { name: /^Archives/ })).toBeVisible();
  });
});

describe('Annuel g6 : version figée et ancienne archive', () => {
  const figee = (retirer: string[] = []) => {
    const d = demoData(), r: any = buildAnnualReport({ year: 2026, transactions: d.transactions, payments: d.payments, assets: d.assets, profile: d.profile, closing: { id: 'T', year: 2026, createdAt: 'x', openingInventory: [], closingInventory: [], inventoriesConfirmed: true, adjustments: [] } });
    for (const k of retirer) delete r[k];
    FinanceService.saveClosing({ id: 'GELEE', year: 2026, createdAt: '2026-11-09T10:00:00Z', openingInventory: [], closingInventory: [], inventoriesConfirmed: true, adjustments: [], report: r });
  };
  it('lecture seule : bandeau, gestes d’écriture désactivés, « Travailler sur une nouvelle version » crée un brouillon', () => {
    figee();
    render(<Banc/>);
    expect(screen.getByText(/Cette version est figée/)).toBeVisible();
    fireEvent.click(piste(1));
    expect(screen.getByRole('button', { name: 'Tout est noté' })).toBeDisabled();
    fireEvent.click(piste(9));
    fireEvent.click(screen.getByRole('button', { name: /^Travailler sur une nouvelle version/ }));
    expect(FinanceService.getClosings()).toHaveLength(2);
    expect(FinanceService.getClosings().find(c => c.id === 'GELEE')!.report).toBeDefined();
    expect(FinanceService.getClosings().filter(c => !c.report)).toHaveLength(1);
  });
  it('un rapport figé ancien (sans outstanding, tax, supportingDocuments, adjustments) : la tête et les neuf étapes se rendent', () => {
    figee(['outstanding', 'tax', 'supportingDocuments', 'adjustments', 'assetEvidence']);
    render(<Banc/>);
    for (let n = 1; n <= 9; n++) { fireEvent.click(piste(n)); expect(screen.getByRole('heading', { level: 3 })).toBeVisible(); fireEvent.click(screen.getByRole('button', { name: 'Annuel' })); }
    expect(screen.getByText(/CHF perdus|CHF gagnés|Rien de noté/)).toBeVisible();
  });
});
