import { describe, expect, it } from 'vitest';
import { etiquettesBande, reperesReguliers, type SemaineBande } from '../../src/ui/calendrier/entete/BandeSemaines';

/** Les lundis ISO consécutifs à partir de `debut`, avec leur numéro de semaine ISO 8601. */
function semaines(debut: string, n: number): SemaineBande[] {
  const sortie: SemaineBande[] = [];
  for (let k = 0; k < n; k++) {
    const lundi = new Date(Date.parse(`${debut}T00:00:00Z`) + k * 7 * 86400000);
    const jeudi = new Date(lundi.getTime() + 3 * 86400000);
    const an = jeudi.getUTCFullYear();
    const premierJeudi = new Date(Date.UTC(an, 0, 4));
    const lundi1 = new Date(premierJeudi.getTime() - ((premierJeudi.getUTCDay() + 6) % 7) * 86400000);
    sortie.push({ debut: lundi.toISOString().slice(0, 10), numero: Math.round((lundi.getTime() - lundi1.getTime()) / (7 * 86400000)) + 1 });
  }
  return sortie;
}
const ecarts = (rep: Array<[number, string]>) => rep.slice(1).map(([k], i) => k - rep[i][0]);

describe('CHV-13 : les repères de la bande des semaines ont un pas régulier', () => {
  it('6 mois depuis S44 2026 (53 semaines) : S53 et S1 comptés, aucun écart de 3 (« S50 S52 · S2 S4 » avant)', () => {
    const s = semaines('2026-10-26', 26);
    expect(s.map(x => x.numero).slice(8, 12)).toEqual([52, 53, 1, 2]);
    const rep = reperesReguliers(s, 2);
    expect(new Set(ecarts(rep))).toEqual(new Set([2]));
    // l'ancre est le nouvel an : S1 porte un repère ; avant lui S52, S50… (numéros pairs)
    expect(rep.map(([, t]) => t).slice(0, 8)).toEqual(['S44', 'S46', 'S48', 'S50', 'S52', 'S1', 'S3', 'S5']);
  });

  it('un pas de 4 passe aussi le nouvel an, sans écart différent', () => {
    const rep = reperesReguliers(semaines('2026-10-26', 26), 4);
    expect(new Set(ecarts(rep))).toEqual(new Set([4]));
    expect(rep.some(([, t]) => t === 'S1')).toBe(true);
  });

  it('une année de 52 semaines garde le même rythme (2027 → 2028)', () => {
    const s = semaines('2027-11-01', 26);
    const rep = reperesReguliers(s, 2);
    expect(new Set(ecarts(rep))).toEqual(new Set([2]));
    expect(rep.length).toBeGreaterThan(8);
  });

  it('sans changement d\'année : la première semaine multiple du pas ouvre la série (S44, S46…)', () => {
    const rep = reperesReguliers(semaines('2026-10-26', 10), 2);
    expect(rep.map(([, t]) => t)).toEqual(['S44', 'S46', 'S48', 'S50', 'S52']);
    const rep4 = reperesReguliers(semaines('2026-10-26', 10), 4);
    expect(rep4.map(([, t]) => t)).toEqual(['S44', 'S48', 'S52']);
  });

  it('étiquettesBande garde la série régulière quand la largeur suffit (pas 2, colonnes de 14 px)', () => {
    const s = semaines('2026-10-26', 26);
    const map = etiquettesBande(s, 2, 14, 23);
    const ks = [...map.keys()];
    expect(new Set(ks.slice(1).map((k, i) => k - ks[i]))).toEqual(new Set([2]));
  });
});
