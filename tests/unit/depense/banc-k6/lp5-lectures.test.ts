// LP-5 (lecture en ligne du 08.11, doc5 et doc8) : « Devise : une lecture sur trois diffère » était affiché à côté de « Lectures 2/2 ». Le nombre « trois » était écrit en dur
// dans la phrase ; elle ne dit plus de nombre qu'elle ne sait pas : « une lecture diffère des autres ». Gemini n'est jamais appelé : lectures imitées (piece.ts).
import { describe, expect, it } from 'vitest';
import { reconcileInvoiceVision } from '../../../../functions/src/invoiceVisionReview';
import { lecture, lire } from './piece';

describe('LP-5 — la phrase d’une lecture divergente ne cite pas un nombre de lectures', () => {
  it('trois lectures, la devise de l’une diffère : le point le dit sans « sur trois »', () => {
    const r = reconcileInvoiceVision([lire(lecture()), lire(lecture({ currency: 'EUR' })), lire(lecture())]);
    const messages = ((r.result as any).points as any[]).map(p => p.message as string);
    const devise = messages.filter(m => /^Devise/.test(m));
    expect(devise).toHaveLength(1);
    expect(devise[0]).toMatch(/une lecture diffère des autres/);
    expect(messages.join(' ')).not.toMatch(/sur trois/);
  });
});
