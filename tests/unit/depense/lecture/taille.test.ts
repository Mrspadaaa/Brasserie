// Le plafond de sortie du modèle (4 500 jetons, réflexion comprise) tient-il pour 35 lignes ?
// Estimation de d1 : 3,2 caractères par jeton. Aucun appel : les réponses sont fabriquées (fixture réelle de sa facture, ou schéma).
import { describe, expect, it } from 'vitest';
import { SCAN_MAX_OUTPUT } from '../../../../functions/src/invoiceScanCore';
import { TASKS } from '../../../../functions/src/prompts';
import { lecture372765 } from './aide';

const jetons = (valeur: unknown) => Math.ceil(JSON.stringify(valeur).length / 3.2);

const longueur: Record<string, number> = { name: 40, evidence: 80, reference: 10, variant: 10, ambiguity: 0, stockCategory: 0, message: 60, description: 60, code: 1, vatCode: 1 };
function remplir(schema: any, nom = ''): unknown {
  if (schema.enum) return schema.enum[0];
  switch (schema.type) {
    case 'OBJECT': return Object.fromEntries(Object.entries(schema.properties).map(([cle, s]) => [cle, remplir(s, cle)]));
    case 'ARRAY': return Array.from({ length: nom === 'items' ? 35 : nom === 'vat' ? 6 : 3 }, () => remplir(schema.items, nom));
    case 'STRING': return 'x'.repeat(longueur[nom] ?? (nom === 'unit' ? 3 : 12));
    case 'BOOLEAN': return false;
    default: return 12.34;
  }
}

describe('Plafond de sortie de la lecture', () => {
  it('une facture de 35 lignes comme la sienne (23 lignes de sa fixture, étendues à 35) tient sous 3 800 jetons estimés', () => {
    const lecture = lecture372765();
    lecture.items = Array.from({ length: 35 }, (_, i) => lecture.items[i % lecture.items.length]);
    const estimation = jetons(lecture);
    console.info(`35 lignes typiques : ${estimation} jetons pour un plafond de ${SCAN_MAX_OUTPUT}`);
    expect(estimation).toBeLessThanOrEqual(3800);
  });

  it('pire cas du schéma (35 lignes, tous les champs remplis, 6 rangées de TVA) : tient sous le plafond, sans la marge de 20 % — mesure à décider', () => {
    const estimation = jetons(remplir((TASKS.scanInvoice as any).schema));
    console.info(`pire cas : ${estimation} jetons pour un plafond de ${SCAN_MAX_OUTPUT} (marge ${Math.round((1 - estimation / SCAN_MAX_OUTPUT) * 100)} %)`);
    expect(estimation).toBeLessThan(SCAN_MAX_OUTPUT);
  });
});
