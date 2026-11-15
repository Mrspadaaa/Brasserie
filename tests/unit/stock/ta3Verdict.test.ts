// Voie ta, tour 3 : cinq problèmes du verdict 2b6a4970 (critique du 14.11). Un test par problème, écrit pour échouer avant le correctif.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { StockItem } from '../../../src/types';
import { construireMur } from '../../../src/domain/stock/murDonnees';
import { sourcesDeLApp } from '../../../src/domain/stock/murSources';
import { Units } from '../../../src/services/units';

const art = (o: Partial<StockItem>): StockItem => ({ id: o.ref ?? 'x', ref: 'x', name: 'x', category: 'Houblon', unit: 'g', currentStock: 250, reorder: false, ...o } as StockItem);
const rayon = (items: StockItem[], nom: 'Houblons' | 'Levures') => construireMur(items, sourcesDeLApp).rayons.find((r) => r.nom === nom)!;
const marques = (items: StockItem[], nom: 'Houblons' | 'Levures') => rayon(items, nom).groupes.flatMap((g) => g.marques);
const levure = (name: string, extra: Partial<StockItem> = {}) => art({ ref: name, name, category: 'Levure', unit: 'sachet', currentStock: 2, ...extra });

describe('n° 1 : « par défaut » est dit dans la bulle du houblon', () => {
  it('Motueka, rangé par défaut (parts de style minuscules), le dit ; Citra, rangé par ses styles, non', () => {
    const m = marques([art({ ref: 'mo', name: 'Motueka', alphaPct: 7, origin: 'NZ' }), art({ ref: 'ci', name: 'Citra', alphaPct: 12, origin: 'US' })], 'Houblons');
    const motueka = m.find((a) => a.nom === 'Motueka')!; const citra = m.find((a) => a.nom === 'Citra')!;
    expect(motueka.parDefaut).toBe(true);
    expect(motueka.titre).toContain('classé par défaut');
    expect(citra.parDefaut).toBeFalsy();
    expect(citra.titre).not.toContain('par défaut');
  });
});

describe('n° 2 : une levure de style connu, rangée en Autres, ne se dit pas « type non connu »', () => {
  it('French Saison M29 : sa bulle dit Saison, sa place (Autres) et sa couleur (grise) ne bougent pas', () => {
    const l = rayon([levure('Mangrove Jack’s M29 10gr')], 'Levures');
    expect(l.groupes.map((g) => g.id)).toEqual(['autres']);
    const a = l.groupes[0].marques[0];
    expect(a.titre).toContain('style Saison');
    expect(a.titre).not.toContain('type non connu');
    expect(a.inconnue).toBe(true);
  });
  it('Kölsch et Belge sont dits ; une levure sans style reconnu garde « type non connu »', () => {
    expect(marques([levure('Wyeast 2565 Kölsch')], 'Levures')[0].titre).toContain('style Kölsch');
    expect(marques([levure('Wyeast 1214 Belgian Abbey')], 'Levures')[0].titre).toContain('style Belge');
    const inconnu = marques([levure('Mystère X1')], 'Levures')[0];
    expect(inconnu.titre).toContain('type non connu');
    expect(inconnu.titre).not.toContain('style ');
  });
  it('une levure rangée dans une vraie colonne ne reçoit ni style ni « type non connu »', () => {
    const t = marques([levure('Safale US-05')], 'Levures')[0].titre;
    expect(t).not.toContain('type non connu');
    expect(t).not.toContain('style ');
  });
});

describe('n° 3 : la bulle passe à la ligne et reste dans la largeur de l’écran', () => {
  const css = readFileSync(join(process.cwd(), 'src/ui/stock/mur.css'), 'utf8');
  const regle = /\.l1x-bul\{[^}]*\}/.exec(css)![0];
  it('plus de white-space:nowrap, une largeur maximale et le retour à la ligne des noms longs', () => {
    expect(regle).not.toMatch(/white-space:\s*nowrap/);
    expect(regle).toMatch(/max-width:\s*calc\(100vw/);
    expect(regle).toMatch(/overflow-wrap:\s*anywhere/);
  });
});

describe('n° 5 : l’unité « sachet » s’accorde (1 sachet, 2 sachets)', () => {
  it('Units.format met le pluriel au-delà de 1', () => {
    expect(Units.format(1, 'sachet')).toBe('1 sachet');
    expect(Units.format(2, 'sachet')).toBe('2 sachets');
    expect(Units.format(5, 'sachet')).toBe('5 sachets');
    expect(Units.format(0, 'sachet')).toBe('0 sachet');
    expect(Units.format(2, 'sachets')).toBe('2 sachets');
    expect(Units.format(2, 'kg')).toBe('2 kg');
  });
});
