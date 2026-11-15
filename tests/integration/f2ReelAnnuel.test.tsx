/* Voie f2 (CP-1) : l'Annuel dans les états de la vraie app (`?finance-demo=reel`) : une vente unique, aucun solde de départ, une pièce de travaux à classer.
   Depuis a1/r1 (14.11) le résultat attend (« ? », renvoi vers l'étape 4) au lieu d'une perte ferme ; la brasserie complète garde le trou de g6. */
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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

describe('Annuel g6, état « réel » : vente unique, travaux à classer (résultat en attente)', () => {
  it('l’échelle donne un écart sous le seuil du texte (l’état est bien reproduit)', () => {
    expect(echelle(569500, 576540, 286).hEcart).toBeLessThan(ECART_MIN_TEXTE_PERTE);
  });
  /* a1/r1 (14.11) : la pièce de travaux sans classement n'est plus une perte ferme. La tête dit « ? » (résultat en attente), jamais « CHF perdus » ni un trou à l'échelle ;
     la part à classer s'écrit hachurée à part ; « À classer › » et le « ? » mènent à l'étape 4 ; le stock se compte par la piste (étape 3) et à l'étape 8. */
  it('une pièce à classer : « ? » en attente dans l’Entré, ni perte ni liseré, « À classer › » mène à l’étape 4, la légende de la vente est entière', () => {
    semer('reel');
    const { container } = render(<Banc/>);
    expect(container.querySelector('.ann-trou')).toBeNull();
    expect(container.querySelector('.ann-trou-mince')).toBeNull();
    expect(container.textContent).not.toMatch(/CHF perdus/);
    const entree = container.querySelector('.ann-pile-entree') as HTMLElement;
    const attente = (entree.querySelector('.ann-attente') ?? container.querySelector('.ann-trou-txt')) as HTMLElement;
    expect(attente.textContent).toContain('?');
    expect(attente.textContent).toMatch(/résultat en attente/);
    expect(attente.textContent).toMatch(/À classer\s*5\s?500,00/);
    expect(container.textContent).toMatch(/à classer\s*5\s?500,00/);
    expect(screen.getByText('Vente 10 × Bière · 75 cl — Restaurant du Lac')).toBeInTheDocument();
    expect(screen.getByText('Local et travaux')).toBeInTheDocument();
  });
  it('le « ? » et « À classer › » sont des renvois vers l’étape 4 (le matériel à classer)', () => {
    semer('reel');
    const { container } = render(<Banc/>);
    const renvois = Array.from(container.querySelectorAll('.ann-attente button, .ann-trou-txt button')) as HTMLButtonElement[];
    expect(renvois.length).toBe(2);
    expect(renvois[0].textContent).toContain('?');
    fireEvent.click(renvois[1]);
    expect(screen.getByRole('button', { name: 'Matériel' })).toBeVisible();
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
