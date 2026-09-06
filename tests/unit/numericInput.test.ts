import { describe, it, expect } from 'vitest';
import { parseDecimal, formatDecimal } from '../../src/ui/numericInput';

/**
 * La lecture d'un nombre tapé à la main.
 *
 * Le cas qui motive tout le fichier : sur un téléphone configuré en français,
 * la touche décimale envoie une VIRGULE. L'ancien `<input type="number">` la
 * refusait en renvoyant une chaîne vide, que les gestionnaires
 * `parseFloat(v) || 0` transformaient en zéro. Un montant de 12,50 CHF
 * s'enregistrait à 0.00 sans le moindre signal.
 */
describe('parseDecimal', () => {
  it('accepte la virgule, celle du clavier français', () => {
    expect(parseDecimal('12,50')).toBe(12.5);
    expect(parseDecimal('0,5')).toBe(0.5);
  });

  it('accepte le point, celui du clavier suisse alémanique et du pavé', () => {
    expect(parseDecimal('12.50')).toBe(12.5);
  });

  it('tolère les espaces de milliers, y compris insécables', () => {
    expect(parseDecimal('1 250')).toBe(1250);
    expect(parseDecimal('1 250,75')).toBe(1250.75);
    expect(parseDecimal("1'250")).toBe(1250);
  });

  it('lit les nombres négatifs — une correction d\'inventaire peut être en moins', () => {
    expect(parseDecimal('-3,5')).toBe(-3.5);
  });

  it('rend null sur une frappe incomplète plutôt que zéro', () => {
    // Le point clé : « 12, » est un état de passage, pas la valeur 12 ni 0.
    // Renvoyer un nombre ici réécrivait le champ et mangeait les décimales.
    expect(parseDecimal('')).toBeNull();
    expect(parseDecimal(',')).toBeNull();
    expect(parseDecimal('-')).toBeNull();
    expect(parseDecimal('.')).toBeNull();
  });

  it('refuse ce qui n\'est pas un nombre au lieu de deviner', () => {
    expect(parseDecimal('abc')).toBeNull();
    expect(parseDecimal('12kg')).toBeNull();
    expect(parseDecimal('1,2,3')).toBeNull();
  });

  it('garde « 12, » lisible comme 12 une fois la virgule suivie d\'un chiffre', () => {
    expect(parseDecimal('12,')).toBe(12);
    expect(parseDecimal('12,7')).toBe(12.7);
  });
});

describe('formatDecimal', () => {
  it('affiche la virgule, pas le point', () => {
    expect(formatDecimal(12.5)).toBe('12,5');
    expect(formatDecimal(30)).toBe('30');
  });

  it('rend une chaîne vide pour une absence de valeur', () => {
    expect(formatDecimal(null)).toBe('');
    expect(formatDecimal(undefined)).toBe('');
    expect(formatDecimal(NaN)).toBe('');
  });

  it('fait l\'aller-retour sans perte', () => {
    for (const n of [0, 0.5, 12.5, 1250.75, -3.5, 25]) {
      expect(parseDecimal(formatDecimal(n))).toBe(n);
    }
  });
});
