// Voie f5c-noms-prod : la clé d'une base est la forme canonique du banc (`scripts/banc-noms-fr.ts`), reprise dans un module pur de `src/`.
import { describe, expect, it } from 'vitest';
import { cleBase as cleBanc } from '../../../../scripts/banc-noms-fr';
import { canonMot as canonBanc } from '../../../../scripts/banc-lecture-facture';
import { canonMot, cleBase } from '../../../../src/domain/nomsBase';

const BASES = [
  'Hopfensack fein', 'Sac à houblon', 'sac  A   houblon', 'CARABELGE®', 'Gärtank 30 Liter rund mit Deckel', 'MALTEX® Edel 7', 'Flaschenbürste Neo-7',
  'Crème brûlée ÉCLAT', 'Çà et là', 'Ångström 5x8mm', '  espaces   autour  ', 'Tab\tet\nretour', '', 'ÀÉÎÕÜ àéîõü', 'Œuf ß ñ', 'Joint torique 12x2mm', 'Pale Ale Malz™ 25kg'
];

describe('f5c — cleBase de src égal à celui du banc', () => {
  it.each(BASES)('même clé pour « %s »', base => {
    expect(cleBase(base)).toBe(cleBanc(base));
    expect(canonMot(base)).toBe(canonBanc(base));
  });
  it('accents, casse et espaces ne séparent pas deux bases ; deux désignations différentes restent deux clés', () => {
    expect(cleBase('Sac à Houblon')).toBe(cleBase('sac  a houblon'));
    expect(cleBase('Hopfensack fein')).not.toBe(cleBase('Hopfensack grob'));
    expect(cleBase('  ')).toBe('');
  });
});
