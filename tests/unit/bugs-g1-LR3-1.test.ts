// LR3-1 (g1, 20.11) — ÉCARTÉ, conforme au contrat LT-3 / B1 : « jamais une quantité qui n'est pas imprimée » (functions/src/invoiceScanCore.ts, prompts.ts : « Ne transforme jamais une quantité absente en 1 »).
// Une 1re version de cette voie déduisait « quantité 1 » sur un ticket qui n'imprime que le montant (commit fc0d78b32) : retirée. Ce test garde le contrat sur la vraie lecture de doc25 (réponses brutes du modèle, anonymisées) :
// une lecture qui ne donne aucune quantité la laisse VIDE (null), sans marque « déduit » ; le prix n'est pas recopié du montant.
import { describe, expect, it } from 'vitest';
import { normaliser } from './depense/g1/lire';

describe('LR3-1 : la quantité non imprimée reste vide (contrat LT-3)', () => {
  it('doc25, lecture 1 : aucune quantité inventée, aucun prix recopié du montant, aucune marque « déduit »', () => {
    const [premiere] = normaliser('doc25-ticket-t1');
    expect(premiere.items.length).toBeGreaterThan(20);
    for (const ligne of premiere.items) {
      expect(ligne.quantity, ligne.name).toBeNull();
      expect(ligne.price, ligne.name).toBeNull();
      expect((ligne as any).quantityDeduced, ligne.name).toBeUndefined();
    }
  });
});
