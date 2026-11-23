/**
 * TL-26 (07.11) : « barre « 0 % ferm. » qui ne règle rien ». Sur la ligne d'un sucre non fermentescible (lactose), « 0 % ferm. » se lisait
 * comme un réglage ; la barre de la ligne règle la masse. Le mot dit la propriété : « ne fermente pas ». Un autre pourcentage reste un chiffre.
 * Rouge avant : `etiquetteFermentescibilite` n'existait pas.
 */
import { describe, expect, it } from 'vitest';
import { etiquetteFermentescibilite } from '../../src/ui/fermentescibles/modele';

describe('TL-26 : l’étiquette de fermentescibilité d’une ligne', () => {
  it('0 % se dit « ne fermente pas », jamais « 0 % ferm. »', () => {
    expect(etiquetteFermentescibilite(0)).toBe('ne fermente pas');
  });
  it('les autres valeurs restent un pourcentage à la virgule', () => {
    expect(etiquetteFermentescibilite(100)).toBe('100 % ferm.');
    expect(etiquetteFermentescibilite(90)).toBe('90 % ferm.');
    expect(etiquetteFermentescibilite(62.5)).toBe('62,5 % ferm.');
  });
  it('l’inconnu vaut 100 % comme avant (défaut du moteur), pas 0', () => {
    expect(etiquetteFermentescibilite(undefined)).toBe('100 % ferm.');
  });
});
