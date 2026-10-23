import './temoin'; // témoin négatif de check:engine (B3)
// Les données copiées de work/ (B8) restent identiques à leur source : la source est la maison du fait, la copie
// en est l'instantané livré. Un écart veut dire « relancer data/copies-de-work.mjs --ecrire », pas retaper.
import { describe, expect, it } from 'vitest';
import { COPIES, verifier } from '../data/copies-de-work.mjs';

describe('Données copiées de work/ (B8)', () => {
  it('chaque copie est identique à sa source (ou la source est absente et la copie fait foi)', () => {
    const r = verifier() as { copie: string; ok: boolean; raison: string }[];
    expect(r.length).toBe((COPIES as unknown[]).length);
    for (const x of r) expect(x.ok, `${x.copie} : ${x.raison}`).toBe(true);
  });
});
