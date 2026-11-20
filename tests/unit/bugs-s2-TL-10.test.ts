import { describe, expect, it } from 'vitest';
import type { StockItem } from '../../src/types';
import { fichePubliee, valeursDeCatalogueMalt } from '../../src/domain/fermentables/fichesMalts';
import { infoLigne } from '../../src/domain/stock/liste';
import { repereLigne } from '../../src/domain/stock/ligne';
import type { ArticleACommander } from '../../src/domain/stockLevel';

// TL-10 (07.11) : les malts courants n'avaient ni couleur ni potentiel (OG « — », EBC « — »). Les fiches du malteur (Weyermann, catalogue
// « Brewery », récolte 2026) donnent la plage d'EBC, l'extrait sur sec et l'humidité : le PPG et l'EBC unique en sont déduits par la règle du dépôt.
const art = (o: Partial<StockItem>): StockItem => ({ id: 'x', ref: 'x', name: 'A', category: 'Malt', unit: 'kg', currentStock: 1, reorder: false, ...o });
const vide = new Map<string, ArticleACommander>();
const clair = () => '#F2C14E';
const repere = (i: StockItem) => repereLigne(i, infoLigne(i, vide, '2026-11-14'), clair);

describe('TL-10 : la fiche publiée d\'un malt courant', () => {
  it('Pilsner Malz : plage 2,5 à 4,5 EBC, EBC 3,5, PPG 35,2 (80,5 % × 0,46 × (1 − 5 %))', () => {
    const f = fichePubliee('Pilsner Malz');
    expect(f).toMatchObject({ ebcMin: 2.5, ebcMax: 4.5, colorEbc: 3.5, potentialPpg: 35.2 });
    expect(f?.source).toMatch(/Weyermann/);
    expect(f?.url).toMatch(/^https:\/\/www\.weyermann\.de\//);
  });
  it('un alias courant (« pils », « Vienna ») trouve la même fiche', () => {
    expect(fichePubliee('pils')?.colorEbc).toBe(3.5);
    expect(fichePubliee('Wiener Malz')).toMatchObject({ ebcMin: 6, ebcMax: 9 });
  });
  it('un malt hors table, ou ambigu, reste inconnu : jamais deviné, jamais 0', () => {
    expect(fichePubliee('Castle Chateau Pilsen')).toBeNull();
    expect(fichePubliee('Münchner Malz')).toBeNull(); // type 1 ou type 2 : la fiche ne tranche pas
    expect(fichePubliee('Cascade')).toBeNull();
    expect(fichePubliee('')).toBeNull();
  });
  it('un malt sans extrait publié (acidulé) donne sa couleur, pas de PPG', () => {
    const f = fichePubliee('Sauermalz');
    expect(f?.colorEbc).toBe(3.3);
    expect(f?.potentialPpg).toBeUndefined();
  });
  it('les couleurs et potentiels restent dans des bornes de brasseur', () => {
    for (const nom of ['Pilsner Malz', 'Caramünch II', 'Carahell', 'Carafa III', 'Röstgerste', 'Weizenmalz hell', 'Roggenmalz']) {
      const f = fichePubliee(nom)!;
      expect(f.ebcMin).toBeLessThanOrEqual(f.ebcMax);
      expect(f.ebcMin).toBeGreaterThan(0);
      expect(f.potentialPpg!).toBeGreaterThan(20);
      expect(f.potentialPpg!).toBeLessThan(40);
    }
  });
  it('valeursDeCatalogueMalt : les champs de la fiche de stock, avec la source et la règle de déduction', () => {
    const v = valeursDeCatalogueMalt('Pilsner Malz');
    expect(v?.valeurs).toEqual({ colorEbc: 3.5, potentialPpg: 35.2 });
    expect(v?.source).toMatch(/Weyermann/);
    expect(v?.deduit.potentialPpg).toMatch(/80,5 %/);
    expect(v?.deduit.colorEbc).toMatch(/2,5 à 4,5/);
    expect(valeursDeCatalogueMalt('Cascade')).toBeUndefined();
  });
});

describe('TL-10 : la ligne du Stock', () => {
  it('un malt sans EBC saisi, que la fiche du malteur connaît, montre la plage publiée (et dit d\'où elle vient)', () => {
    const r = repere(art({ name: 'Pilsner Malz' }));
    expect(r).toMatchObject({ texte: 'EBC 2,5–4,5', inconnu: false });
    expect(r?.titre).toMatch(/Weyermann/);
  });
  it('l\'EBC saisi par le brasseur prime toujours sur la fiche', () => {
    expect(repere(art({ name: 'Pilsner Malz', colorEbc: 3.8 }))).toMatchObject({ texte: 'EBC 3,8' });
  });
  it('un malt inconnu de la table reste « EBC non connu »', () => {
    expect(repere(art({ name: 'Castle Chateau Pilsen' }))).toMatchObject({ texte: 'EBC non connu', inconnu: true });
    expect(repere(art({}))).toMatchObject({ texte: 'EBC non connu', inconnu: true });
  });
});
