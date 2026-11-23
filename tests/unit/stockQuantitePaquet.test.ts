import { describe, expect, it } from 'vitest';
import type { StockItem } from '../../src/types';
import type { ArticleACommander } from '../../src/domain/stockLevel';
import { infoLigne, quantiteBarre } from '../../src/domain/stock/liste';
import { barreLigne, etatDit, texteSousLeNom } from '../../src/domain/stock/ligne';

// STC-2 / STC-17 (chasse du Stock, 21.11) : « ZZ TEST Cryo Hops Citra 25g », 1 Pck, α 24,8 %, sans seuil.
const art = (o: Partial<StockItem>): StockItem => ({ id: 'x', ref: 'x', name: 'A', category: 'Houblon', unit: 'g', currentStock: 1, reorder: false, ...o });
const cryo = art({ ref: 'cryo', name: 'ZZ TEST Cryo Hops Citra 25g', unit: 'Pck', currentStock: 1, alphaPct: 24.8 });
const vide = new Map<string, ArticleACommander>();
const J = '2026-11-21';

describe('un houblon compté en paquets garde sa quantité (STC-2)', () => {
  it('1 Pck de 25 g : 25 g sur la règle, une barre, pas « à compter »', () => {
    expect(quantiteBarre(cryo)).toBe(25);
    expect(barreLigne(cryo)).not.toBeNull();
    const info = infoLigne(cryo, vide, J);
    expect(info.classe).not.toBe('compter');
    expect(info.etats).not.toContain('compter');
  });
  it('trois paquets de 100 g : 300 g ; le poids se lit au nom, jamais deviné', () => {
    expect(quantiteBarre(art({ name: 'Idaho 7 pellets 100 g', unit: 'Pck', currentStock: 3 }))).toBe(300);
    expect(quantiteBarre(art({ name: 'Citra pellets', unit: 'Pck', currentStock: 3 }))).toBeNull(); // pas de poids dans le nom : inconnu, pas 0
    expect(quantiteBarre(art({ name: 'Citra 10 x 100 g', unit: 'Pck', currentStock: 1 }))).toBeNull(); // deux mesures : dans le doute, rien
  });
  it('un houblon en g ou en kg ne change pas', () => {
    expect(quantiteBarre(art({ unit: 'g', currentStock: 100 }))).toBe(100);
    expect(quantiteBarre(art({ unit: 'kg', currentStock: 0.45 }))).toBe(450);
  });
});

describe('« à compter » se dit une fois par ligne (STC-17)', () => {
  const ligne = (i: StockItem, cmd?: ArticleACommander) => { const info = infoLigne(i, cmd ? new Map([[i.ref, cmd]]) : vide, J); return etatDit(i, info, cmd, J); };
  it('inconnu : la colonne de droite dit « à compter », sous le nom jamais', () => {
    const inconnu = art({ ref: 'q', name: 'Saaz', currentStock: Number.NaN });
    const dit = ligne(inconnu);
    expect(dit.classe).toBe('compter');
    expect(texteSousLeNom(dit)).not.toMatch(/à compter/);
    expect(texteSousLeNom(dit)).toBe('quantité inconnue');
  });
  it('inconnu avec un besoin : « manque inconnu »', () => {
    const inconnu = art({ ref: 'q', name: 'Saaz', currentStock: Number.NaN });
    const cmd: ArticleACommander = { item: inconnu, missing: 0, rupture: false, auMoins: false, sources: [] };
    expect(texteSousLeNom(ligne(inconnu, cmd))).toBe('manque inconnu');
  });
  it('Cryo : jamais « à compter », ni sous le nom ni dans l\'état', () => {
    const dit = ligne(cryo);
    expect(dit.texte).not.toMatch(/à compter/);
    expect(texteSousLeNom(dit)).not.toMatch(/à compter/);
  });
  it('les autres états sont dits tels quels', () => {
    expect(texteSousLeNom({ texte: 'bas · seuil 2 kg', classe: 'bas' })).toBe('bas · seuil 2 kg');
  });
});
