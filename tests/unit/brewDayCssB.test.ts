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
  it('RJ-13 / PD-12 : le panneau de confirmation est borné et centré au bureau', () => {
    expect(readFileSync('src/ui/Sheet.tsx', 'utf8')).toMatch(/className=\{`lg:max-w-xl lg:mx-auto/);
  });
  it('BR-119 : la rangée des filtres de la liste passe à la ligne au bureau au lieu d’être coupée', () => {
    expect(readFileSync('src/ui/production/CatalogToolbar.tsx', 'utf8')).toMatch(/scrollbar-none lg:flex-wrap lg:overflow-visible/);
  });
  it('PD-11 : le guillemet fermant ne passe pas seul à la ligne', () => {
    expect(readFileSync('src/ui/BatchDetailSheet.tsx', 'utf8')).toContain('actuellement « ${style.label} »');
  });
  it('BR-58 : l’onglet de mesure choisi porte une marque qui ne dépend pas de la teinte (m2 : fond de pastille, gras, contour)', () => {
    const regle = bloc(".bz-seg button[aria-pressed='true']");
    expect(regle).toMatch(/background:/);
    expect(regle).toMatch(/font-weight: 600/);
    expect(regle).toMatch(/box-shadow: 0 0 0 1px/);
  });
});
