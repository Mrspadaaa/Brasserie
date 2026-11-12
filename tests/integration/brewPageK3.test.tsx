import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { pasDe } from '../../src/ui/BrewAppel';

/** Lot K3 (test d'écran c6 sur p2c) : règles de texte et de dessin vérifiées sans écran ; le rendu est capturé dans voies/port-K/K3. */
const css = readFileSync('src/pages/brew-day.css', 'utf8');
const regle = (selecteur: string) => {
  const debut = css.indexOf(`${selecteur} {`);
  return debut < 0 ? '' : css.slice(debut, css.indexOf('}', debut) + 1);
};

describe('n° 20 : « Pas d’Amarillo ? »', () => {
  it('élision devant une voyelle, pas devant une consonne', () => {
    expect(pasDe('Amarillo')).toBe('Pas d’Amarillo ?');
    expect(pasDe('Ekuanot')).toBe('Pas d’Ekuanot ?');
    expect(pasDe('Citra')).toBe('Pas de Citra ?');
    expect(pasDe(' Mosaic ')).toBe('Pas de Mosaic ?');
  });
});

describe('n° 15 : l’horloge de p2c (chiffres à 32 px, cinq boutons de 44 px sur leur ligne)', () => {
  it('chiffres à 32 px', () => expect(regle('.brew-page.bz .bz-temps')).toMatch(/font-size:\s*32px/));
  it('boutons à 44 px, en ligne pleine largeur', () => {
    expect(regle('.brew-page.bz .bz-ctl')).toMatch(/flex:\s*1 1 100%/);
    expect(css).toMatch(/\.bz-ctl button\s*\{[^}]*height:\s*44px/);
  });
});

describe('n° 17 : Ensuite en police du texte', () => {
  it('plus de chasse fixe dans la sous-ligne, heures sans coupure', () => {
    expect(regle('.brew-page.bz .bz-ensuite-etape small.bz-m')).toMatch(/font-family:\s*inherit/);
    expect(regle('.brew-page.bz .bz-ensuite-etape small .bz-m')).toMatch(/white-space:\s*nowrap/);
  });
});
