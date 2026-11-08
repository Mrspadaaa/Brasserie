import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BATCH_STATUS } from '../../src/domain/batchStatus';

// Voie b du 08.11 : défauts visuels gardés par leur cause (les captures prouvent le rendu, ces tests gardent la règle).
const css = readFileSync('src/pages/brew-day.css', 'utf8');
const mesures = readFileSync('src/ui/BrewDayMeasurements.tsx', 'utf8');
const bloc = (ouverture: string): string => {
  const i = css.indexOf(ouverture);
  if (i < 0) throw new Error(`bloc absent : ${ouverture}`);
  return css.slice(i, css.indexOf('}', i));
};

describe('contrastes et cibles du jour de brassage', () => {
  it('BR-57 : l’étiquette neutre prend le texte courant en clair (≥ 9:1), plus #666 sur #ddd', () => {
    expect(bloc(":root:not([data-theme='cave']) .brew-tag.is-neutral {")).toMatch(/color:\s*rgb\(var\(--cave-texte-200\)\)/);
  });
  it('BR-120 : la pastille « Terminé » n’est plus en text-cave-400 sur cave-800', () => {
    expect(BATCH_STATUS.termine.chip).not.toMatch(/text-cave-400/);
  });
  it('BR-59 : un lien du jour de brassage fait au moins 24 px de haut', () => {
    const r = bloc('.brew-page a:not(.brew-primary) {');
    expect(r).toMatch(/min-height:\s*24px/);
  });
  it('BR-58 : l’onglet de mesure choisi porte une marque qui ne dépend pas de la teinte (bordure pleine, gras, souligné)', () => {
    expect(mesures).toMatch(/border-2 border-ebc-straw[^']*font-semibold[^']*underline/);
  });
});
