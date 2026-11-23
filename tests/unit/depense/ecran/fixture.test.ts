// La fixture de développement de l'écran (T3) n'est jamais écrite à la main : c'est la sortie du VRAI rapprochement du serveur
// (`reconcileInvoiceVision`) appliqué aux deux lectures simulées de d1 (A, B ; B lit 4,15 comme TVA). SIMULÉ : l'unité de Sabro,
// illisible dans cette lecture (sa facture imprime « g »). `ECRIRE_FIXTURE=1 npx vitest run …/fixture.test.ts` la réécrit.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { describe, expect, it } from 'vitest';
import { reconcileInvoiceVision } from '../../../../functions/src/invoiceVisionReview';
import { lectureA, lectureB, lire } from '../rapprochement/aide';

const CHEMIN = fileURLToPath(new URL('../../../../src/ui/depense/apercu/lecture-372765.reconciliee.json', import.meta.url));
const sansUnite = (raw: any) => ({ ...raw, items: raw.items.map((item: any) => (item.name.startsWith('Sabro') ? { ...item, unit: '' } : item)) });
const fabriquer = () => (reconcileInvoiceVision([sansUnite(lectureA()), sansUnite(lectureB())].map(lire)).result as any);

describe('fixture de développement : la sortie du vrai rapprochement', () => {
  it('se réécrit à la demande, puis reste identique à ce que le serveur rend', () => {
    if (process.env.ECRIRE_FIXTURE) { mkdirSync(dirname(CHEMIN), { recursive: true }); writeFileSync(CHEMIN, JSON.stringify(fabriquer(), null, 1) + '\n'); }
    expect(existsSync(CHEMIN)).toBe(true);
    expect(JSON.parse(readFileSync(CHEMIN, 'utf8'))).toEqual(JSON.parse(JSON.stringify(fabriquer())));
  });
  it('porte les points de la facture 372765 : TVA, unité de Sabro, aucun nom ni adresse du brasseur', () => {
    const f = JSON.parse(readFileSync(CHEMIN, 'utf8'));
    expect(f.items).toHaveLength(23);
    const codes = f.points.map((p: any) => `${p.code}:${p.champ}`);
    expect(codes.some((c: string) => c.startsWith('lectures-divergentes:tvaAmount'))).toBe(true);
    expect(f.points.some((p: any) => p.code === 'unite-absente' && p.ligne === 20)).toBe(true);
    expect(JSON.stringify(f)).not.toMatch(/straße|strasse|\b\d{4} [A-Z][a-z]+\b/);
  });
});
