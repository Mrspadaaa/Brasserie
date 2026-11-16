// @vitest-environment jsdom
/**
 * fix-materiel, passe 2 (critique 16.11) : Atelier › Matériel.
 * - la pastille du héros dit l'ÉTAPE du projet (« D’abord · devis reçu »), pas un mot de code (« à poser ») ;
 * - cibles de 44 px dans la feuille du projet (étapes, Bientôt · Ensuite · Plus tard, Noter un devis, Noter l’achat, mois, interrupteur) ;
 * - nom du prochain achat gras et grand (kyh1) ; boutons des confirmations centrés pareil ; cadre de focus au clavier seulement ;
 * - « Enregistrer le projet » tient sur une ligne.
 * jsdom ne charge pas les feuilles de style : les règles se lisent dans le texte du CSS (contrôle statique, mesures réelles au banc Chrome).
 * Données : fixtures simulées (ids ZZ).
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children, footer }: any) => open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null, ConfirmSheet: ({ open, title }: any) => open ? <div role="dialog" aria-label={title} /> : null }));
vi.mock('recharts', () => ({ ResponsiveContainer: () => null, AreaChart: () => null, Area: () => null, XAxis: () => null, YAxis: () => null, Tooltip: () => null, CartesianGrid: () => null }));
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { FinanceService } from '../../src/services/financeService';
import { UpgradeWorkspace } from '../../src/ui/finance/UpgradeWorkspace';
import { etapeHero } from '../../src/domain/finance/upgradeForecast';
import type { FinancialPlan } from '../../src/domain/finance/types';

const plan = (id: string, title: string, cents: number | null, status: FinancialPlan['status'], o: { stage?: 'idea' | 'research' | 'quote' | 'ready'; source?: 'estimate' | 'quote'; vendor?: string } = {}): FinancialPlan => ({
  id, title, date: '', amountCents: cents ?? 0, direction: 'out', category: 'materiel', source: 'equipment', status, createdAt: '2026-01-01T10:00:00.000Z', ...(o.vendor ? { vendor: o.vendor } : {}),
  upgrade: { version: 1, timing: 'soon', stage: o.stage ?? 'idea', budgetKnown: cents != null, datePrecision: 'month', estimateSource: o.source ?? 'estimate', ...(cents != null ? { purchaseCents: cents } : {}) } });

const css = (f: string) => readFileSync(`src/ui/finance/${f}`, 'utf8').replace(/\r\n/g, '\n');
/** Le corps de la première règle dont le sélecteur est exactement `sel`. */
const regle = (source: string, sel: string): string => {
  const echappe = sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`(?:^|\\n)${echappe}\\s*\\{([^}]*)\\}`).exec(source);
  if (!m) throw new Error(`règle absente : ${sel}`);
  return m[1];
};
const px = (corps: string, propriete: string): number | null => { const m = new RegExp(`(?:^|[;\\s])${propriete}:\\s*(\\d+(?:\\.\\d+)?)px`).exec(corps); return m ? Number(m[1]) : null; };

beforeEach(() => { window.history.replaceState({}, '', '/?dev-local'); FirestoreRepo.startSync(); });
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.restoreAllMocks(); });

describe('la pastille du héros dit l’étape', () => {
  it('etapeHero : devis reçu, prix trouvé, devis demandé, à chercher (jamais « à poser »)', () => {
    expect(etapeHero(plan('ZZ-1', 'ZZ A', 90000, 'draft', { stage: 'ready', source: 'quote' }))).toBe('devis reçu');
    expect(etapeHero(plan('ZZ-2', 'ZZ B', 90000, 'draft', { stage: 'ready' }))).toBe('prix trouvé');
    expect(etapeHero(plan('ZZ-3', 'ZZ C', null, 'draft', { stage: 'quote', vendor: 'ZZ Fournisseur' }))).toBe('devis demandé');
    expect(etapeHero(plan('ZZ-4', 'ZZ D', null, 'draft', { stage: 'research' }))).toBe('à chercher');
  });
  it('un projet sans prix ni mois : « D’abord · à chercher », pas « à poser »', () => {
    FinanceService.savePlan(plan('ZZ-E', 'ZZ 2e évier', null, 'draft', { stage: 'research' }));
    render(<UpgradeWorkspace/>);
    const hero = screen.getByRole('region', { name: 'Prochain achat' });
    expect(within(hero).getByText('D’abord · à chercher')).toBeVisible();
    expect(within(hero).queryByText(/à poser/)).not.toBeInTheDocument();
  });
  it('un projet à devis reçu : « D’abord · devis reçu » (maquette kyh1)', () => {
    FinanceService.savePlan(plan('ZZ-H', 'ZZ Hotte', 90000, 'draft', { stage: 'ready', source: 'quote' }));
    render(<UpgradeWorkspace/>);
    expect(within(screen.getByRole('region', { name: 'Prochain achat' })).getByText('D’abord · devis reçu')).toBeVisible();
  });
});

describe('geste « + mois » d’une ligne sans prix : la fiche du projet montre le mois posé', () => {
  it('la fiche d’un projet sans prix offre le choix du mois (plus de « rien à poser ») et le pose, sans l’inclure dans les prévisions', async () => {
    FinanceService.savePlan(plan('ZZ-A', 'ZZ Armoire', 45000, 'draft', { stage: 'quote' }));
    FinanceService.savePlan({ ...plan('ZZ-B', 'ZZ TEST - Matériel', null, 'draft'), date: '2026-12-01' });
    render(<UpgradeWorkspace/>);
    fireEvent.click(screen.getByRole('button', { name: 'ZZ TEST - Matériel' }));
    const fiche = within(screen.getByRole('dialog', { name: 'ZZ TEST - Matériel' }));
    expect(fiche.queryByText(/rien à poser/)).not.toBeInTheDocument();
    const choix = fiche.getByRole('group', { name: 'Poser ZZ TEST - Matériel sur un mois' });
    expect(within(choix).getAllByRole('button').find(b => b.getAttribute('aria-pressed') === 'true')).toBeTruthy(); // le mois de la ligne est celui de la fiche
    expect(fiche.getByText(/le mois se pose mais rien n’entre dans tes prévisions/)).toBeVisible();
    fireEvent.click(within(choix).getAllByRole('button')[0]); // « pas encore »
    await waitFor(() => expect(FinanceService.getPlans().find(p => p.id === 'ZZ-B')?.date).toBe(''));
    expect(FinanceService.getPlans().find(p => p.id === 'ZZ-B')).toMatchObject({ status: 'draft', amountCents: 0 });
  });
});

describe('cibles de 44 px dans la feuille du projet (projet.css)', () => {
  const source = css('projet/projet.css');
  it('le pli « Avancement et notes » est une cible de 44 px, plus forte que la règle générale des feuilles (min-height 28 px)', () => {
    const corps = regle(source, '.pjd .pjd-plus > summary');
    expect(px(corps, 'min-height')).toBeGreaterThanOrEqual(44);
    expect(corps).toMatch(/padding:\s*0;/);
  });
  it('Bientôt · Ensuite · Plus tard : 44 px de bouton, cadre compris (le groupe fait 46 px)', () => {
    expect(px(regle(source, '.pjd-seg'), 'height')).toBeGreaterThanOrEqual(46);
  });
  it.each(['.pjd-o', '.pjd-hl', '.pjd-ent', '.pjd-a', '.pjd-mois', '.pjd-seg', '.pjd-sw', '.pjd-btn', '.pjd-lien', '.pjd-x', '.pjd-titre'])('%s : hauteur d’au moins 44 px', sel => {
    const corps = regle(source, sel);
    expect(Math.max(px(corps, 'height') ?? 0, px(corps, 'min-height') ?? 0)).toBeGreaterThanOrEqual(44);
  });
  it('le cercle d’étape est un bouton de 44 × 44 px (le cercle dessiné de 28 px est dans son ::after)', () => {
    const corps = regle(source, '.pjd-o');
    expect(px(corps, 'width')).toBe(44);
    expect(px(regle(source, '.pjd-o::after'), 'width')).toBe(28);
    expect(regle(source, '.pjd-s')).toContain('grid-template-columns: 44px 1fr');
  });
  it('aucun raccourci « zone de toucher » en pseudo-élément ne remplace une vraie cible (la taille se mesure)', () => {
    expect(source).not.toMatch(/button\.pjd-o::before|\.pjd-a::before|\.pjd-ent::before|\.pjd-seg button::before/);
  });
  it('« Enregistrer le projet » ne se casse pas : boutons sans retour à la ligne, qui s’étirent quand le pied passe à la ligne', () => {
    const corps = regle(source, '.pjd-btn');
    expect(corps).toContain('white-space: nowrap');
    expect(corps).toMatch(/flex:\s*1 1 auto/);
  });
});

describe('héros et confirmations (upgrade-plan.css)', () => {
  const source = css('upgrade-plan.css');
  it('le nom du prochain achat est gras et grand, comme kyh1 (20 px, 700)', () => {
    const corps = regle(source, '.kh-hm h2 .kh-hbtn');
    expect(px(corps, 'font-size')).toBe(20);
    expect(corps).toMatch(/font-weight:\s*700/);
  });
  it('la fiche : « à estimer » d’une ligne de coût se cale sur sa ligne (il n’hérite pas des 44 px de la ligne de liste)', () => {
    const corps = regle(source, '.kh-cost .kh-u');
    expect(corps).toMatch(/min-height:\s*0/);
  });
  it('les boutons des deux confirmations (Archiver, Supprimer) sont centrés pareil, dans la fiche comme dans la feuille', () => {
    const corps = regle(source, '.fm .fm-b button');
    expect(corps).toMatch(/justify-content:\s*center/);
    expect(corps).toMatch(/text-align:\s*center/);
  });
  it('le cadre de focus ne vient qu’au clavier : aucune règle :focus nue sur les confirmations', () => {
    expect(source).toMatch(/\.fm-b button:focus-visible/);
    expect(source).not.toMatch(/\.fm[^{]*button:focus\s*[,{]/);
    expect(source).not.toMatch(/\.fm-[a-z]+:focus\s*[,{]/);
  });
});
