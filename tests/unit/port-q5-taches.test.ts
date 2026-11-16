import { describe, expect, it } from 'vitest';
import type { Batch } from '../../src/types';
import { avecTacheFaite, modeleFiche, sansTacheFaite, tacheFaite, texteTache } from '../../src/ui/production/fermentation/modele';
import { lireBlocs } from '../../src/ui/production/carnet/carnetModel';

// q5 (gfc n° 2) : cocher une tâche l'écrit dans `notesBrewDay` (champ existant, entrée « Cuve » datée) ; la décocher la retire ; rien d'autre ne bouge.
const NOW = Date.UTC(2026, 10, 14, 11, 0, 0);
const lot = (notesBrewDay = ''): Batch => ({
  id: 'ZZ-Q5', name: 'ZZ NEIPA', status: 'fermentation', volumeL: 24, brewDate: '09.11.2026', og: '1,062', notesBrewDay,
  brewDay: { pitchedAt: Date.UTC(2026, 10, 9, 11, 0, 0), steps: [], currentIndex: 0 },
  recipeSnapshot: { fgTarget: 1.012, hops: [], fermentation: [{ kind: 'primaire', days: 5, tempC: 19 }, { kind: 'reposDiacetyle', days: 3, tempC: 21 }, { kind: 'garde', days: 7, tempC: 2 }] }
} as unknown as Batch);

describe('q5 : cases des tâches de la fiche (gfc n° 2)', () => {
  const t = { titre: 'Repos diacétyle 21 °C', jour: 5 };

  it('cocher écrit « Fait : … (J+n) » en entrée datée ; décocher la retire ; le reste des notes est intact', () => {
    const base = 'Brassé tard.\n09.11.2026 · Brassage : trub clair';
    const coche = avecTacheFaite(base, t, NOW);
    expect(tacheFaite(coche, t)).toBe(true);
    expect(coche).toContain(texteTache(t));
    expect(lireBlocs(coche).some(b => b.kind === 'entree' && b.type === 'cuve' && b.texte.includes(texteTache(t)))).toBe(true);
    const decoche = sansTacheFaite(coche, t);
    expect(tacheFaite(decoche, t)).toBe(false);
    expect(decoche).toBe(base);
  });

  it('cocher deux fois n\'écrit qu\'une entrée', () => {
    const une = avecTacheFaite('', t, NOW);
    const deux = avecTacheFaite(une, t, NOW);
    expect(deux.split(texteTache(t)).length).toBe(2);
  });

  it('la fiche relit les cases depuis les notes', () => {
    const t0 = modeleFiche(lot(), NOW)!.taches[0];
    expect(t0.faite).toBe(false);
    const m = modeleFiche(lot(avecTacheFaite('', t0, NOW)), NOW)!;
    expect(m.taches[0].faite).toBe(true);
    expect(m.taches.filter(x => x.faite)).toHaveLength(1);
    expect(modeleFiche(lot(), NOW)!.taches.every(x => !x.faite)).toBe(true);
  });
});
