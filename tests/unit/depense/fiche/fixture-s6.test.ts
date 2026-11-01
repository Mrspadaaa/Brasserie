// La fixture du banc de la voie s6-fiche (T7) n'est jamais écrite à la main : c'est la sortie du VRAI rapprochement du serveur (`reconcileInvoiceVision`) appliqué à une lecture
// SIMULÉE de quatre lignes (Target 11.3%, Cascade CH, Münchner Malz 15 EBC, Sabro® 13.4%), et le stock SIMULÉ qui va avec. Aucun nom ni adresse du brasseur, aucun Gemini.
// `ECRIRE_FIXTURE=1 npx vitest run tests/unit/depense/fiche/fixture-s6.test.ts` la réécrit ; `fixture.test.ts` (e-port) n'est pas touché.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { describe, expect, it } from 'vitest';
import { reconcileInvoiceVision } from '../../../../functions/src/invoiceVisionReview';
import { entete, ligne } from '../lecture/aide';
import { lire } from '../rapprochement/aide';

const DOSSIER = fileURLToPath(new URL('../../../../src/ui/depense/apercu/', import.meta.url));
const LECTURE = DOSSIER + 'lecture-s6.reconciliee.json', STOCK = DOSSIER + 'stock-s6.json';

const lectureS6 = () => entete({
  vendor: 'Fournisseur fictif', invoiceNumber: 'S6-1', date: '09.09.2026', amountTTC: 7.2, tvaRate: null, tvaAmount: null, amountHT: null,
  items: [
    ligne({ name: 'Target 11.3%', reference: 'HO0102', quantity: 40, unit: 'g', price: 0.04, amountTTC: 1.6, alphaPct: 11.3, evidence: 'HO0102 Target 11.3% 40 g' }),
    ligne({ name: 'Cascade CH', reference: 'HO0200', quantity: 30, unit: 'g', price: 0.05, amountTTC: 1.5, evidence: 'HO0200 Cascade CH 30 g' }),
    ligne({ name: 'Münchner Malz 15 EBC', reference: 'MA0300', quantity: 2, unit: 'Kg', price: 1.6, amountTTC: 3.2, evidence: 'MA0300 Münchner Malz 15 EBC 2 Kg' }),
    ligne({ name: 'Sabro® 13.4%', reference: 'HO0400', quantity: 30, unit: 'g', price: 0.03, amountTTC: 0.9, alphaPct: 13.4, evidence: 'HO0400 Sabro 13.4% 30 g' }),
  ],
});
const fabriquer = () => (reconcileInvoiceVision([lectureS6(), lectureS6()].map(lire)).result as any);
/** Le stock SIMULÉ : Target (α 11,8), Cascade US (l'article existant dont la fiche est « approchée » pour Cascade CH), Münchner Malz (EBC 20). Aucun Sabro. */
const stockS6 = () => ({
  _avertissement: 'Stock SIMULÉ de la voie s6-fiche : aucune donnée réelle. Écrit par fixture-s6.test.ts.',
  articles: [
    { id: 'Target', ref: 'MP-Target', name: 'Target', unit: 'g', category: 'Houblon', alphaPct: 11.8, currentStock: 100, minStock: 0, reorder: false },
    { id: 'Cascade US', ref: 'MP-Cascade-US', name: 'Cascade US', unit: 'g', category: 'Houblon', alphaPct: 6, currentStock: 200, minStock: 0, reorder: false },
    { id: 'Münchner Malz', ref: 'MP-Muenchner', name: 'Münchner Malz', unit: 'kg', category: 'Malt', colorEbc: 20, currentStock: 5, minStock: 0, reorder: false },
  ],
});

describe('fixture du banc s6 : la sortie du vrai rapprochement', () => {
  it('se réécrit à la demande, puis reste identique à ce que le serveur rend', () => {
    if (process.env.ECRIRE_FIXTURE) {
      mkdirSync(dirname(LECTURE), { recursive: true });
      writeFileSync(LECTURE, JSON.stringify(fabriquer(), null, 1) + '\n');
      writeFileSync(STOCK, JSON.stringify(stockS6(), null, 1) + '\n');
    }
    expect(existsSync(LECTURE) && existsSync(STOCK)).toBe(true);
    expect(JSON.parse(readFileSync(LECTURE, 'utf8'))).toEqual(JSON.parse(JSON.stringify(fabriquer())));
    expect(JSON.parse(readFileSync(STOCK, 'utf8'))).toEqual(JSON.parse(JSON.stringify(stockS6())));
  });
  it('porte les quatre lignes, sans nom ni adresse du brasseur', () => {
    const f = JSON.parse(readFileSync(LECTURE, 'utf8'));
    expect(f.items.map((i: any) => i.name)).toEqual(['Target 11.3%', 'Cascade CH', 'Münchner Malz 15 EBC', 'Sabro® 13.4%']);
    expect(JSON.stringify(f)).not.toMatch(/straße|strasse|\b\d{4} [A-Z][a-z]+\b/);
  });
});
