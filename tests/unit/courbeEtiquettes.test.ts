/**
 * Les noms de la courbe de l'en-tête du Calendrier (liste du tour 10, L-3 et L-4 ; DEFAUTS-RECURRENTS CAL-FRISE-ETIQUETTES, CAL-AN-390).
 *  - L-4 (T10-4) : « Vêtements et s… −132 » : un nom qui ne tient pas se tait, il ne se coupe jamais par « … » (CAL-AN-390 : aucun texte rogné).
 *  - L-3 (T10-3, et les 4 rouges du paysage 844×340) : l'étiquette du cadre (« S44 – S49 ») est un obstacle des noms à la place où le navigateur
 *    la DESSINE : fond de 3 px de chaque côté, posée 1 px au-dessus du bord bas du cadre, lui-même 2 px au-dessus du bas de la courbe (mesuré à
 *    390×844 et 844×340 : bas de l'étiquette = bas − 5). L'obstacle était 3 px trop bas : « Loyer du local −400 » mordait sur « S44 – S49 ».
 */
import { describe, expect, it } from 'vitest';
import { HAUT_RENDU, BAS_RENDU, geometrie, obstaclesCourbe, placeEtiquette, raccourcir } from '../../src/ui/calendrier/entete/Courbe';

describe('L-4 : un nom de la courbe ne se coupe jamais par « … »', () => {
  for (const nom of ['Vêtements et serviettes de travail', 'consomable ( masque gant)', 'Brouwland · malt de base et houblons']) {
    it(`« ${nom} » : aucune forme raccourcie ne finit par « … »`, () => {
      expect(raccourcir(nom).filter(f => /…|\.\.\.$/.test(f))).toEqual([]);
    });
  }
  it('la forme « avant · » reste (un nom plus court, entier)', () => {
    expect(raccourcir('Brouwland · malt de base et houblons')).toEqual(['Brouwland']);
  });
});

describe('L-3 : l\'étiquette du cadre écarte les noms à sa place dessinée', () => {
  for (const [nom, largeur, hauteur] of [['téléphone 390', 366, 88], ['paysage 844×340', 606, 60]] as const) {
    it(`${nom} : l'obstacle couvre la boîte rendue de l'étiquette, marge de lecture comprise`, () => {
      const g = geometrie([-50000, 20000], 12, largeur, hauteur, 4, hauteur);
      const cadre = { index: 2, nombre: 6, etiquette: 'S44 – S49' };
      const l = g.x(cadre.index), r = g.x(cadre.index + cadre.nombre);
      const p = placeEtiquette(cadre.etiquette, l, r - l, g.largeur);
      const bas = g.bas - 5, rendu = { l: p.l - 3, r: p.l + p.w + 3, t: bas - 16 * p.lignes.length, b: bas };
      const obs = obstaclesCourbe(g, cadre, null);
      // un nom posé à la ligne de base y : encre de y − 11 à y + 3, boîte rendue de y − HAUT_RENDU à y + BAS_RENDU ; il est refusé dès que son encre
      // croise un obstacle à 2 px près. Aucune ligne de base acceptée ne laisse sa boîte rendue mordre sur l'étiquette dessinée.
      const croise = (a: { l: number; r: number; t: number; b: number }, b: typeof a, m: number) => !(a.r + m <= b.l || a.l >= b.r + m || a.b + m <= b.t || a.t >= b.b + m);
      for (let y = 12; y <= hauteur; y++) {
        const encre = { l: rendu.l + 4, r: rendu.l + 40, t: y - 11, b: y + 3 };
        if (obs.some(o => croise(encre, o, 2))) continue;
        const boite = { ...encre, t: y - HAUT_RENDU, b: y + BAS_RENDU };
        expect(croise(boite, rendu, -1), `ligne de base ${y} : boîte ${boite.t}–${boite.b} contre l'étiquette ${rendu.t}–${rendu.b}`).toBe(false);
      }
    });
  }
});
