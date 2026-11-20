// @vitest-environment jsdom
/**
 * CT4C-11 (critique tour 3, n° 5) : à 390, « Malt et houblons · Pale Ale · Comptoir du bra… » coupait le FOURNISSEUR.
 * La maquette choisie (v6a, « toutes les opérations à la même hauteur », une ligne, coupée par « … ») interdit le retour à la ligne
 * (f2ReelOperations l'exige encore). Remède dans la maquette : sur la ligne du titre, c'est le NOM qui cède la place (« Malt et houblons · P… »),
 * le fournisseur garde son texte entier (jusqu'à 60 % de la ligne) ; le nom complet reste dans le nom accessible et le survol.
 * jsdom ne mesure pas la mise en page : les règles se lisent dans la feuille, la mesure réelle est au banc (`voies/g4/banc.mjs`).
 */
import fs from 'node:fs';
import path from 'node:path';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { TransactionRow } from '../../src/ui/finance/TransactionRow';
import type { Transaction } from '../../src/types';

const css = fs.readFileSync(path.resolve(__dirname, '../../src/ui/finance/operations.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
/** Corps de la première règle dont le sélecteur (liste comprise) est exactement `sel`. */
const corps = (sel: string): string => {
  const re = /([^{}]+)\{([^{}]*)\}/g;
  for (let m = re.exec(css); m; m = re.exec(css)) if (m[1].split(',').map((s) => s.trim()).includes(sel)) return m[2];
  return '';
};

describe('CT4C-11 : le fournisseur de la ligne se lit entier, le nom cède', () => {
  afterEach(cleanup);

  it('la ligne du titre est une rangée : le nom se coupe par « … », le fournisseur ne rétrécit pas', () => {
    const q = corps('.ops-q');
    expect(q).toMatch(/display:\s*flex/);
    expect(q).toMatch(/white-space:\s*nowrap/); // une ligne, comme v6a (f2ReelOperations)
    const nom = corps('.ops-q .ops-nom');
    expect(nom).toMatch(/min-width:\s*0/);
    expect(nom).toMatch(/overflow:\s*hidden/);
    expect(nom).toMatch(/text-overflow:\s*ellipsis/);
    const tiers = corps('.ops-q small');
    expect(tiers).toMatch(/flex:\s*0\s+0\s+auto/);
    expect(tiers).toMatch(/max-width:\s*\d+%/); // un fournisseur démesuré ne mange pas tout le titre
    expect(tiers).toMatch(/white-space:\s*pre/); // « · » garde son espace d'avant dans une rangée
  });

  it('aucun texte de la ligne sous 12 px', () => {
    for (const sel of ['.ops-q', '.ops-q small', '.ops-tg', '.ops-meta', '.ops-btn', '.ops-mini']) {
      const t = corps(sel).match(/font-size:\s*([\d.]+)px/);
      if (t) expect(Number(t[1])).toBeGreaterThanOrEqual(12);
    }
  });

  it('le DOM garde nom puis fournisseur ; le nom complet est dans le nom accessible et le survol', () => {
    const t: Transaction = {
      id: 'T1', date: '2026-11-20', description: 'Malt et houblons · Pale Ale', amountHT: 186.8, amountTTC: 186.8, tvaAmount: 0, tvaRate: 0, category: 'brassage', subcategory: '',
      finance: { version: 1, kind: 'expense', amountCents: 18680, vendor: 'Comptoir du brasseur', lines: [], paymentStatus: 'unpaid', dueDate: '2026-11-25', recordedAt: '2026-11-20T08:00:00.000Z' },
    } as Transaction;
    const { container } = render(<TransactionRow transaction={t} transactions={[t]} payments={[]} onOpen={() => {}} />);
    const q = container.querySelector('.ops-q')!;
    expect(q.querySelector('.ops-nom')?.textContent).toBe('Malt et houblons · Pale Ale');
    expect(q.querySelector('small')?.textContent).toBe(' · Comptoir du brasseur');
    expect(q.getAttribute('title')).toBe('Malt et houblons · Pale Ale · Comptoir du brasseur');
    expect(container.querySelector('.ops-main')!.getAttribute('aria-label')).toContain('Comptoir du brasseur');
  });
});
