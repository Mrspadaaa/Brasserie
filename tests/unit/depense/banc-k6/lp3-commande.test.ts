// LP-3 (lecture en ligne du 08.11, doc12) : le numéro de commande 647304, imprimé en titre de la page web de commande (trois captures d'écran), n'était pas repris.
// La consigne de lecture dit désormais où le chercher (titre ou en-tête de page, bandeau de capture, plusieurs captures d'une même commande).
// Gemini n'est pas appelé : ce test lit la consigne, la reprise réelle se rejoue sur la pièce (banc, Gemini autorisé le 08.11) ; et le code assemble les captures en gardant le premier numéro lu.
import { describe, expect, it } from 'vitest';
import { TASKS } from '../../../../functions/src/prompts';
import { normalizeInvoiceScan } from '../../../../functions/src/invoiceScanCore';
import { lecture } from './piece';

describe('LP-3 — le numéro de commande d’une page web est demandé et gardé', () => {
  it('la consigne de lecture cite le titre d’une page web de commande et les captures multiples', () => {
    const consigne = (TASKS as any).scanInvoice.system as string;
    expect(consigne).toMatch(/titre ou en-tête d’une page web de commande/);
    expect(consigne).toMatch(/Commande 647304/);
    expect(consigne).toMatch(/plusieurs captures d’une même commande/);
  });
  it('un numéro de commande lu est gardé tel quel par la normalisation, séparément du numéro de facture', () => {
    const lu = normalizeInvoiceScan(lecture({ orderNumber: 'Commande 647304', invoiceNumber: '' })) as any;
    expect(lu.orderNumber).toBe('Commande 647304');
    expect(lu.invoiceNumber).toBe('');
  });
});
