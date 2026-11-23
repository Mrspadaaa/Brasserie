// Voie g1 (bugs-ecrans, 20.11) : rejoue la lecture de PRODUCTION (`lireCsv8`, normalisation N comprise) sur les VRAIES réponses enregistrées du modèle
// (`brut/*.json`, anonymisées par `work/missions/2026-11-19-bugs-ecrans/voies/g1/fixtures-brut.mjs`). Aucun appel réel : les trois « lectures » sont rendues par le disque.
// Une 3e lecture absente (la 3.8 était tombée au délai de 45 s) est rejouée comme un délai.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { lireCsv8 } from '../../../../functions/src/invoiceScanVote';
import { normalizeInvoiceScan } from '../../../../functions/src/invoiceScanCore';

export const brut = (nom: string): { lectures: any[] } => JSON.parse(readFileSync(fileURLToPath(new URL(`./brut/${nom}.json`, import.meta.url)), 'utf8'));
export const normaliser = (nom: string): any[] => brut(nom).lectures.map(l => normalizeInvoiceScan(structuredClone(l)));

export async function lireFixture(nom: string): Promise<any> {
  const lectures = normaliser(nom);
  const delai = () => Object.assign(new Error('délai'), { name: 'TimeoutError' });
  return lireCsv8({
    readLite: async n => lectures[n - 1],
    readStrong: async () => { if (!lectures[2]) throw delai(); return lectures[2]; },
    causeOf: reason => (reason as any)?.name === 'TimeoutError' ? 'delai' : null,
    deadlineReached: () => false,
  });
}
export const montants = (r: any): number[] => (r.items as any[]).map(i => i.amountTTC);
