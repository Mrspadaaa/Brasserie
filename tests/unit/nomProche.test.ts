import { describe, expect, it } from 'vitest';
import { CATALOGUE } from '../../src/domain/hopIndex/v4/data';
import { varieteProche } from '../../src/domain/hopIndex/v4/nomProche';

// Test en ligne n° 9 (07.11) : « Nuget » et « Hallertauer Mittelfruh » ne retrouvaient pas leur fiche catalogue.
describe('rapprochement d’un nom de houblon (n° 9)', () => {
  const nom = (saisi: string) => {
    const r = varieteProche(saisi, CATALOGUE);
    return r ? CATALOGUE.find((v) => v.id === r.id)?.name : null;
  };

  it('relie une lettre de moins ou une forme adjective, avec la variété seule', () => {
    expect(nom('Nuget')).toBe('Nugget');
    expect(nom('Hallertauer Mittelfruh')).toBe('Hallertau Mittelfrüh');
    expect(nom('Galaxi')).toBe('Galaxy');
  });

  it('ne devine ni un nom court, ni un nom très différent, ni un nom partiel', () => {
    expect(nom('Saz')).toBeNull();
    expect(nom('Houblon maison')).toBeNull();
    expect(nom('Hallertau')).toBeNull(); // partiel : plusieurs variétés commencent par ce mot
    expect(nom('')).toBeNull();
  });

  it('une faute d’une lettre dans un nom du catalogue ne désigne jamais une AUTRE variété', () => {
    let autres = 0, essais = 0;
    for (const v of CATALOGUE) {
      if (v.name.length < 7) continue;
      const faute = v.name.slice(0, 3) + v.name.slice(4); // une lettre manquante
      const r = varieteProche(faute, CATALOGUE);
      essais++;
      if (r && r.id !== v.id) autres++;
    }
    expect(essais).toBeGreaterThan(100);
    expect(autres).toBeLessThanOrEqual(Math.floor(essais * 0.02));
  });
});
