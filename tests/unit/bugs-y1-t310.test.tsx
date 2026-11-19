// @vitest-environment jsdom
// Voie y1, T3-10 (en ligne, 19.11) : le + flottant ne doit cacher ni les quantités de Stocks › Courses ni « Suivant » de l'éditeur de recette.
// Le recouvrement réel se mesure au navigateur (voies/y1/banc/mesurer-*.mjs, 390×660 et 844×340) ; ici, la règle qui le garantit :
// le + flottant prend 12 px du bord + 56 px (nav) ou 64 px (page) ; la liste et la rangée de fin gardent au moins 76 px à droite.
import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';
import { StocksTab } from '../../src/components/tabs/StocksTab';
import { StorageService } from '../../src/services/storage';
import { useStorageValue } from '../../src/hooks/useLiveData';
import { seedQa } from '../qa/hop-recipe/repo';
import type { StockItem } from '../../src/types';

vi.mock('../../src/services/firestoreRepo', () => import('../qa/hop-recipe/repo'));
vi.mock('../../src/ui/hopIndex/HopIndexWorkspace', () => ({ HopIndexWorkspace: () => null }));

const REM = 16;
const css = (nom: string) => fs.readFileSync(path.resolve(__dirname, '..', '..', 'src', nom), 'utf8');
/** Le padding-right (en px) du premier bloc de `source` dont le sélecteur contient `selecteur`. */
function paddingDroit(source: string, selecteur: string): number | null {
  const i = source.indexOf(selecteur);
  if (i < 0) return null;
  const bloc = source.slice(i, source.indexOf('}', i));
  const m = /padding-right:\s*([\d.]+)(rem|px)/.exec(bloc);
  return m ? Number(m[1]) * (m[2] === 'rem' ? REM : 1) : null;
}
/** + de la page plein écran : 64 px de large, à 12 px du bord (`floating-actions.css`) ; + des onglets : 56 px à 12 px. */
const RESERVE_DU_PLUS = 12 + 64;

const art = (ref: string, name: string, stock: number, min: number, unit = 'kg'): StockItem =>
  ({ id: ref, ref, name, currentStock: stock, minStock: min, unit, category: 'Malt', reorder: false, kind: 'rawMaterials', supplier: 'ZZ TEST — Fournisseur' } as StockItem);
const readStocks = () => StorageService.getStocks();
function Catalogue() {
  const stocks = useStorageValue(readStocks);
  return <VirtuosoMockContext.Provider value={{ viewportHeight: 1000, itemHeight: 54 }}><StocksTab stocks={stocks} batches={[]} onOpenQuickAction={() => {}} /></VirtuosoMockContext.Provider>;
}

beforeEach(() => {
  localStorage.clear(); StorageService.clearMemoryCache();
  seedQa({ stockItems: [art('zz1', 'ZZ TEST — Maris Otter', 2, 25), art('zz2', 'ZZ TEST — Acide', 0, 2, 'L')] });
});
afterEach(cleanup);

describe('T3-10 : le + flottant ne cache rien', () => {
  it('Courses : la liste porte sa gouttière et la feuille de style lui garde 76 px à droite sous 1024 px', async () => {
    render(<Catalogue />);
    fireEvent.click(await screen.findByRole('button', { name: 'Courses' }));
    const repli = await screen.findByTestId('commande-repliee');
    // Le bloc Courses (parent de la ligne repliée) est un enfant direct de .stocks-screen : la règle du CSS le vise par `:has(> [data-testid="commande-repliee"])`.
    expect(repli.parentElement!.matches('.stocks-screen > *'), 'le bloc Courses est un enfant direct de .stocks-screen').toBe(true);
    const regle = css('ui/floating-actions.css');
    const media = regle.slice(regle.indexOf('@media (max-width: 1023px)', regle.indexOf('T3-10')));
    const SELECTEUR = '.stocks-screen > :has(> [data-testid="commande-repliee"])';
    expect(paddingDroit(media, SELECTEUR)).toBeGreaterThanOrEqual(76);
  });

  it('Recette : la rangée « Retour · Suivant » garde, à droite, toute la largeur du + de la page (12 + 64 px)', () => {
    const px = paddingDroit(css('pages/page-shell.css'), '[data-page-end-actions]');
    expect(px, 'règle page-shell.css sur [data-page-end-actions]').not.toBeNull();
    expect(px!).toBeGreaterThanOrEqual(RESERVE_DU_PLUS);
  });
});
