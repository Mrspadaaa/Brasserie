// @vitest-environment jsdom
/* Voie g2 (CT4C-5, CT4C-6) : Clients › Prix.
   5 : le graphe suit le thème (aucune couleur fixe, aucun panneau blanc en cave), la colonne de droite à 1280 garde « Fût 20 L » sur une ligne.
   6 : coût du brassin inconnu : « Il manque ces données » (et son geste) passe avant le graphe de « ? », qui se réduit à 390. */
import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { GraphePrix } from '../../src/ui/prix/GraphePrix';
import { GrapheInconnu } from '../../src/ui/prix/GrapheInconnu';
import { PrixEcran } from '../../src/ui/prix/PrixEcran';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FinanceService } from '../../src/services/financeService';
import { financeDemoEntries } from '../../src/dev/financeDemo';
import type { Batch, PricingItem } from '../../src/types';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
vi.mock('../../src/ui/finance/BrewBudgetDialog', () => ({ BrewBudgetDialog: () => null }));

const css = readFileSync('src/ui/prix/prix.css', 'utf8');
const sansUrl = (html: string) => html.replace(/url\(#[^)]*\)/g, '');
const HEX = /#[0-9a-fA-F]{3,8}\b/;
const regle = (sel: string): string => { const i = css.indexOf(`${sel} {`); return i < 0 ? '' : css.slice(i, css.indexOf('}', i)); };

describe('CT4C-5 : le graphe suit le thème', () => {
  it('GraphePrix : aucune couleur fixe dans le dessin (tout passe par les jetons --pg-*)', () => {
    const { container } = render(<GraphePrix cout={2.48} coutExact prix={5} unites={3636} an={false} reels={[4.5]} libelleUnite="bouteille" />);
    expect(sansUrl(container.innerHTML)).not.toMatch(HEX);
    expect(container.innerHTML).toContain('var(--pg-');
  });
  it('GrapheInconnu : aucune couleur fixe dans le dessin', () => {
    const { container } = render(<GrapheInconnu prix={5} libelleUnite="bouteille" an={false} />);
    expect(sansUrl(container.innerHTML)).not.toMatch(HEX);
  });
  it('le cadre du graphe n’est plus blanc en dur ; la cave a ses propres jetons', () => {
    expect(regle('.prx-g')).not.toMatch(/background:\s*#fff/i);
    expect(css).toMatch(/\[data-theme='cave'\]\s+\.prx\s*\{[^}]*--pg-fond/);
  });
  it('1280 : la colonne de droite a au moins 260 px et « Fût 20 L » ne se coupe pas', () => {
    const m = css.match(/@media \(min-width: 1000px\)\s*\{[\s\S]*?grid-template-columns:\s*([^;]+);/);
    expect(m).not.toBeNull();
    expect(m![1]).toMatch(/minmax\((2[6-9]\d|3\d\d)px,/);
    expect(regle('.prx-fmt button')).toMatch(/white-space:\s*nowrap/);
  });
});

describe('CT4C-6 : coût du brassin inconnu, le manque avant le graphe', () => {
  const donnees = (name: string) => financeDemoEntries('reel').entries.filter(e => e.name === name).map(e => e.data);
  let batches: Batch[] = []; let tarifs: PricingItem[] = [];
  beforeEach(() => {
    batches = donnees('batches') as Batch[]; tarifs = donnees('tarifs') as PricingItem[];
    vi.spyOn(FinanceService, 'snapshot').mockImplementation(() => ({ profile: {}, plans: [], payments: [], assets: [], closings: [] }) as never);
    vi.spyOn(StorageService, 'getConfig').mockImplementation(() => defaultConfig as never);
    vi.spyOn(StorageService, 'getBatches').mockImplementation(() => batches);
    vi.spyOn(StorageService, 'getTarifs').mockImplementation(() => tarifs);
    vi.spyOn(StorageService, 'getTransactions').mockImplementation(() => []);
    vi.spyOn(StorageService, 'getStocks').mockImplementation(() => ({ rawMaterials: [], cleaning: [], kegs: [] }) as never);
  });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it('dans l’ordre du document, la liste « Il manque ces données » précède le graphe de « ? »', () => {
    const { container } = render(<PrixEcran config={defaultConfig} tarifs={tarifs} batches={batches} />);
    const manque = container.querySelector('#prx-manque') as HTMLElement;
    const graphe = container.querySelector('svg.prx-g-inconnu') as SVGElement;
    expect(manque).not.toBeNull(); expect(graphe).not.toBeNull();
    expect(manque.compareDocumentPosition(graphe) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(manque.textContent).toMatch(/Coût du brassin/);
  });
  it('à 390 le graphe de « ? » se réduit (largeur plafonnée)', () => {
    expect(css).toMatch(/\.prx\[data-inconnu\]\s+\.prx-g\s*\{[^}]*max-width:\s*2\d\dpx/);
  });
});
