// RF-14 (08.11, LP-2) : la TVA lue en somme du bloc imprimé par taux ne doit pas compter deux fois une ligne « Total TVA » que le modèle a rangée dans ce bloc
// (taux inconnu, montant égal à la somme des autres rangées). Rien n'est inventé : sans total dans le bloc la somme reste celle des rangées ; une TVA absente reste inconnue, jamais 0.
import { describe, expect, it } from 'vitest';
import { tvaImprimee } from '../../../src/ui/depense/tva';

const base = { tvaAmount: null, amountTTC: 120, controls: undefined } as const;

describe('RF-14 — la somme du bloc de TVA ne compte pas un total déjà dedans', () => {
  it('deux taux, chacun son montant : la somme (cas doc2)', () => {
    const t = tvaImprimee({ ...base, vat: [{ rate: 0.026, amount: 0.5 }, { rate: 0.081, amount: 56.11 }] } as any);
    expect(t).toMatchObject({ montant: 56.61, source: 'bloc' });
  });
  it('une rangée « Total » (taux inconnu, montant = somme des autres) n’est pas additionnée une seconde fois', () => {
    const t = tvaImprimee({ ...base, vat: [{ rate: 0.026, amount: 0.5 }, { rate: 0.081, amount: 56.11 }, { rate: null, amount: 56.61 }] } as any);
    expect(t).toMatchObject({ montant: 56.61, source: 'bloc' });
  });
  it('une rangée à taux inconnu qui n’égale pas la somme des autres reste une vraie rangée', () => {
    const t = tvaImprimee({ ...base, vat: [{ rate: 0.081, amount: 10 }, { rate: null, amount: 3 }] } as any);
    expect(t?.montant).toBe(13);
  });
  it('un bloc sans montant lu laisse la TVA inconnue (jamais 0)', () => {
    expect(tvaImprimee({ ...base, vat: [{ rate: 0.081, amount: null }] } as any)).toBeUndefined();
  });
  it('une rangée seule à taux inconnu est la TVA, pas un total à retirer', () => {
    expect(tvaImprimee({ ...base, vat: [{ rate: null, amount: 8 }] } as any)?.montant).toBe(8);
  });
});
