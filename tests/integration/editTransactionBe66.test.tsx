// @vitest-environment jsdom
// BE-66, BE-67, BE-69, BE-73 : « Modifier l'écriture comptable » : une date ISO (2026-11-05) s'écrit JJ.MM.AAAA comme partout ; les montants du résumé ont la virgule ;
// le dossier Drive (bleu eau 3,36 à 4,39:1 au thème cave) prend les couleurs de texte courant du thème, assez contrastées.
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
import { EditTransactionModal } from '../../src/components/EditTransactionModal';
import { dateAffichee } from '../../src/domain/finance/ledger';
afterEach(cleanup);

describe('BE-67 : un seul format de date', () => {
  it('dateAffichee : ISO réécrite, le reste intact', () => {
    expect(dateAffichee('2026-11-05')).toBe('05.11.2026');
    expect(dateAffichee('05.11.2026')).toBe('05.11.2026');
    expect(dateAffichee('5.11')).toBe('5.11');
    expect(dateAffichee(undefined)).toBe('');
  });
  it('la fenêtre montre « 05.11.2026 » pour une écriture datée 2026-11-05, TVA et total à la virgule', () => {
    const tx = { id: 'T-iso', date: '2026-11-05', description: 'Vente 2 fûts', category: 'recettes' as const, subcategory: 'Vente', amountHT: 23.8, tvaRate: 0, tvaAmount: 0, amountTTC: 23.8 };
    render(<EditTransactionModal isOpen transaction={tx} onClose={() => {}} onSave={() => {}} />);
    expect(document.querySelector('[name="tx_edit_entry_date"]')).toHaveValue('05.11.2026');
    expect(screen.getByText('0,00 CHF')).toBeInTheDocument();
    expect(screen.getByText('23,80 CHF')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/\d\.\d{2} CHF/);
  });
  it('BE-69/73 : le libellé et le chemin du dossier Drive n’utilisent plus le bleu eau texte', () => {
    const tx = { id: 'T-drive', date: '05.11.2026', description: 'Vente', category: 'recettes' as const, subcategory: 'Vente', amountHT: 10, tvaRate: 0, tvaAmount: 0, amountTTC: 10 };
    render(<EditTransactionModal isOpen transaction={tx} onClose={() => {}} onSave={() => {}} />);
    const bloc = screen.getByText(/Dossier Google Drive/).closest('div')!.parentElement!;
    expect(bloc.querySelector('.text-water')).toBeNull();
  });
});
