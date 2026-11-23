import { describe, expect, it } from 'vitest';
import { LITE_SCAN_MAX_OUTPUT, SCAN_MAX_OUTPUT } from '../../../../functions/src/invoiceScanCore';

// En ligne le 02.11 : une commande de 31 lignes sur 3 pages, coupée par la 3.8 à 5 085 jetons (MAX_TOKENS) sous l'ancien plafond de 5 100,
// d'où « Lecture coupée ». La réflexion compte dans `maxOutputTokens`, pour la 3.8 comme pour la Flash-Lite.
describe('le plafond de sortie de la 3.8', () => {
  it('couvre la coupe vue en ligne avec de la marge, au moins le plafond de la Flash-Lite', () => {
    expect(SCAN_MAX_OUTPUT).toBeGreaterThanOrEqual(LITE_SCAN_MAX_OUTPUT);
    expect(SCAN_MAX_OUTPUT).toBeGreaterThan(5085 * 1.5);
  });
});
