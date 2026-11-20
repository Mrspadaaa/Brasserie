/**
 * Critique tour 4 (c), voie g3, tour 2, n° 5 : le + flottant couvrait du contenu hors Finances.
 * Tour 3 (critique Opus du tour 2, n° 2, 3, 5, 7) : la gouttière droite de 76 px posée au tour 2 rognait les listes ; elle est retirée au profit de la marge basse seule
 * (voir `ct4c-g3-t3-marge-basse.test.ts`, qui garde l'absence de gouttière). Ne reste ici que l'acquis du tour 2 : le + ne bouge pas.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('CT4C n° 5 (tour 2, repris au tour 3) : le + reste en bas à droite', () => {
  it('rien ne passe par un style en ligne ni par une position : le + reste en bas à droite (acquis)', () => {
    const base = fs.readFileSync(path.resolve(__dirname, '../../src/ui/floating-actions.css'), 'utf8');
    expect(base).toMatch(/\.floating-actions\s*\{[^}]*right:\s*var\(--floating-actions-right, 0\.75rem\)/);
    expect(base).toMatch(/bottom:\s*var\(--floating-actions-bottom, 1rem\)/);
  });
});
