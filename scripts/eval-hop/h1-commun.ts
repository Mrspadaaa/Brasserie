// Voie h1 : ce que les bancs h1-* partagent (la neipa saturée du brasseur, 22A : Lotus 78 g à 15′ + 144 g au dry hop actif ; même recette que t3-neipa.ts).
import type { Recipe } from '../../src/domain/hopIndex/v4/recipe';

export const SATUREE: Recipe = { name: 'neipa v3 saturée', styleCode: '22A', volumeL: 24, og: 1.081, boilMin: 60, yeastId: 'lalbrew-verdant-ipa', ebc: 7,
  additions: [{ id: 'a1', hopKey: 'beermaverick-lotus', moment: 'b15', grams: 78 }, { id: 'a2', hopKey: 'beermaverick-lotus', moment: 'dryActive', grams: 144 }] };
