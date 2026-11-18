import { describe, expect, it } from 'vitest';
import { aAdopter, alertesDeMateriel, genreAlerte, lignePremierPlan, phraseRincage, resumeVolumes } from '../../../src/ui/identite/alertes';

// Les trois phrases du verdict n° 1, telles que `recipeInstallationIssues` les écrit.
const FERMENTEUR = 'Le volume prévu atteint ou dépasse la capacité physique du fermenteur.';
const CUVE = 'Le volume avant ébullition dépasse la limite utile de la cuve.';
const RINCAGE = 'Le rinçage dépasse les 24 L exceptionnels disponibles à chaud.';
const ADOPTION = 'Le matériel de cette recette n’est pas figé. Ouvre « Modifier la recette », puis choisis « Adapter à mon matériel actuel » avant de lancer un nouveau brassin.';
const DESSINE = { fermenteur: true, cuve: true };

describe('genreAlerte', () => {
  it('reconnaît les phrases du moteur', () => {
    expect(genreAlerte(FERMENTEUR)).toBe('fermenteur');
    expect(genreAlerte('Le volume final atteint ou dépasse la capacité totale du fermenteur.')).toBe('fermenteur');
    expect(genreAlerte(CUVE)).toBe('cuve');
    expect(genreAlerte(RINCAGE)).toBe('rincage');
    expect(genreAlerte(ADOPTION)).toBe('adoption');
    expect(genreAlerte('Les capacités du matériel de cette recette ne sont pas figées. Ouvre…')).toBe('adoption');
    expect(genreAlerte('Le total d’eau saisi ne correspond pas au volume final et aux pertes du plan.')).toBe('autre');
  });
});

describe('lignePremierPlan : jamais plus d\'une ligne entre les deux tuiles', () => {
  it('les trois phrases du verdict : une seule reste, le rinçage', () => {
    const l = lignePremierPlan([FERMENTEUR, CUVE, RINCAGE], DESSINE, { chaudL: 28, maxL: 24 });
    expect(l).toEqual({ texte: 'Rinçage : 28 L pour 24 L à chaud', autres: 0 });
  });
  it('fermenteur et cuve seuls : rien, le dessin le dit', () => {
    expect(lignePremierPlan([FERMENTEUR, CUVE], DESSINE)).toEqual({ texte: null, autres: 0 });
  });
  it('le dessin se tait : la phrase revient (rien ne se perd)', () => {
    expect(lignePremierPlan([CUVE], { fermenteur: true, cuve: false }).texte).toBe(CUVE);
    expect(lignePremierPlan([FERMENTEUR], { fermenteur: false, cuve: true }).texte).toBe(FERMENTEUR);
  });
  it('à adopter : pas de ligne, le sous-titre de Matériel le dit', () => {
    expect(lignePremierPlan([ADOPTION], DESSINE)).toEqual({ texte: null, autres: 0 });
    expect(aAdopter([ADOPTION])).toBe(true);
    expect(aAdopter([RINCAGE])).toBe(false);
  });
  it('plusieurs autres phrases : la première, les autres comptées', () => {
    const a = 'Un rinçage est saisi alors que le programme est prévu sans rinçage.';
    const b = 'Le total d’eau saisi ne correspond pas au volume final et aux pertes du plan.';
    expect(lignePremierPlan([a, b], DESSINE)).toEqual({ texte: a, autres: 1 });
  });
  it('le rinçage passe avant les autres, quel que soit l\'ordre du moteur', () => {
    const a = 'Un rinçage est saisi alors que le programme est prévu sans rinçage.';
    expect(lignePremierPlan([a, RINCAGE], DESSINE, { chaudL: 28, maxL: 24 })).toEqual({ texte: 'Rinçage : 28 L pour 24 L à chaud', autres: 1 });
  });
  it('aucune alerte : rien', () => {
    expect(lignePremierPlan([], DESSINE)).toEqual({ texte: null, autres: 0 });
  });
});

describe('phraseRincage : l\'inconnu n\'est jamais 0', () => {
  it('lit le maximum dans la phrase du moteur quand le contrôle manque', () => {
    expect(phraseRincage(RINCAGE, { chaudL: 28.4 })).toBe('Rinçage : 28,4 L pour 24 L à chaud');
    expect(phraseRincage(RINCAGE)).toBe('Rinçage au-delà des 24 L à chaud');
    expect(phraseRincage(RINCAGE, { chaudL: Number.NaN })).toBe('Rinçage au-delà des 24 L à chaud');
  });
  it('un maximum illisible ne devient pas un zéro', () => {
    expect(phraseRincage('Le rinçage dépasse', undefined)).toBe('Rinçage au-delà du maximum à chaud');
  });
});

describe('alertesDeMateriel', () => {
  it('garde les phrases que le résumé ne redit pas', () => {
    const a = 'Un rinçage est saisi alors que le programme est prévu sans rinçage.';
    expect(alertesDeMateriel([FERMENTEUR, CUVE, RINCAGE, ADOPTION, a])).toEqual([a]);
  });
});

describe('resumeVolumes', () => {
  it('« Volumes · 34,7 / 35 L à chaud avant ébullition »', () => {
    expect(resumeVolumes({ avantL: 34.7, cuveL: 35 })).toBe('Volumes · 34,7 / 35 L à chaud avant ébullition');
  });
  it('sans moût d\'avant ébullition : le fermenteur, jamais un 0', () => {
    expect(resumeVolumes({ avantL: null, cuveL: 35, volumeL: 20, capaciteL: 30 })).toBe('Volumes · 20 / 30 L au fermenteur');
    expect(resumeVolumes({ avantL: 0, cuveL: 35 })).toBe('Volumes');
  });
});
