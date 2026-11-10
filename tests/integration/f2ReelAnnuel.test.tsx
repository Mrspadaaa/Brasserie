/* Voie f2 (CP-1) : l'Annuel dans les états de la vraie app (`?finance-demo=reel`) : une vente unique, aucun solde de départ, perte minuscule face aux dépenses.
   Le trou de g6 reste à l'échelle (un liseré hachuré) et son texte se pose au-dessus : jamais un texte qui en recouvre un autre. */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children, footer }: any) => open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null }));
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { financeDemoEntries } from '../../src/dev/financeDemo';
import { ECART_MIN_TEXTE_PERTE } from '../../src/ui/finance/annuel/Tete';
import { echelle } from '../../src/domain/finance/periodeSynthese';
import { AUJOURDHUI, Banc } from './annuelSupport';

const semer = (jeu: string) => { for (const e of financeDemoEntries(jeu).entries) FirestoreRepo.put(e.name, e.id, e.data); };
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(`${AUJOURDHUI}T10:00:00`)); window.history.replaceState({}, '', '/?dev-local'); FirestoreRepo.startSync(); });
afterEach(() => { cleanup(); vi.useRealTimers(); FirestoreRepo.stopSync(); });

describe('Annuel g6, état « réel » : vente unique, perte de 70,40 sur 5 765,40', () => {
  it('l’échelle donne un écart sous le seuil du texte (l’état est bien reproduit)', () => {
    expect(echelle(569500, 576540, 286).hEcart).toBeLessThan(ECART_MIN_TEXTE_PERTE);
  });
  it('le trou est un liseré hachuré vide ; le résultat, « CHF perdus » et le stock « ? » sont au-dessus, la légende de la vente est entière', () => {
    semer('reel');
    const { container } = render(<Banc/>);
    const liseré = container.querySelector('.ann-trou-mince') as HTMLElement;
    expect(liseré).not.toBeNull();
    expect(liseré.textContent).toBe('');
    expect(container.querySelector('.ann-trou:not(.ann-trou-mince)')).toBeNull();
    const texte = container.querySelector('.ann-trou-txt') as HTMLElement;
    expect(texte.textContent).toMatch(/70,40/);
    expect(texte.textContent).toMatch(/CHF perdus/);
    expect(texte.querySelector('.ann-stock')?.textContent).toMatch(/Stock au 31 déc\.\s*\?/);
    // le texte précède le liseré, le liseré précède la pile d'entrée : la forme de g6 de haut en bas
    expect(texte.compareDocumentPosition(liseré) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(liseré.compareDocumentPosition(container.querySelector('.ann-pile-entree')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText('Vente 10 × Bière · 75 cl — Restaurant du Lac')).toBeInTheDocument();
    expect(screen.getByText('Local et travaux')).toBeInTheDocument();
  });
  it('la brasserie complète garde le trou de g6 avec son texte dedans (rien ne change quand l’écart est grand)', () => {
    semer('plein');
    const { container } = render(<Banc/>);
    const trou = container.querySelector('.ann-trou:not(.ann-trou-mince)') as HTMLElement;
    expect(trou).not.toBeNull();
    expect(trou.textContent).toMatch(/CHF perdus/);
    expect(container.querySelector('.ann-trou-txt')).toBeNull();
  });
});
