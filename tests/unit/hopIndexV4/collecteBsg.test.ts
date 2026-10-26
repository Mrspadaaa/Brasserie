// Voie c3c (#180) : lecteur BSG / RahrBSG sur un état JSON synthétique (structure VTEX imitée, rien copié).
import { describe, expect, it } from 'vitest';
import { lireProduitBsg, lireSpecs } from '../../../scripts/collecte-hop/bsg.mjs';

const spec = (n: number, nom: string, valeurs: string[]) =>
  `"Product:x.specificationGroups.1.specifications.${n}":{"name":"${nom}","originalName":"${nom}","values":{"type":"json","json":[${valeurs.map(v => JSON.stringify(v)).join(',')}]},"__typename":"X"}`;
const apercu = '\\u003Cp\\u003EUne phrase.\\u003C\\u002Fp\\u003E\\n\\u003Cp\\u003E\\u003Cstrong\\u003EMaturity:\\u003C\\u002Fstrong\\u003E Middle\\u003C\\u002Fp\\u003E\\n\\u003Cp\\u003E\\u003Cstrong\\u003EYield:\\u003C\\u002Fstrong\\u003E 1500 &ndash; 1750 lbs\\u002Facre\\u003C\\u002Fp\\u003E';
const html = (extra: string[] = []) => `<html><title>Exemplum T-90 Hop Pellets</title><script>{${[
  spec(0, 'Product Family', ['HOP']), `"p.d":{"name":"Overview Description","originalName":"Overview Description","values":{"type":"json","json":["${apercu}"]}}`,
  spec(1, 'Alpha Acid', ['9.5 - 11.5%']), spec(2, 'Co-Humulone as % of Alpha', ['29 - 30%']), spec(3, 'Beta Acid Range', ['3.5 - 4.5%']),
  spec(4, 'Total Oil', ['1.5 - 2.3 mL/100g']), spec(5, 'Hop Aroma Category', ['Citrus', 'Pine/Resin']), spec(6, 'Hop Aroma Specification', ['Pine needle, citrus']),
  spec(7, 'Hop Variety', ['Exemplum']), spec(8, 'Country Of Origin', ['United States']), ...extra].join(',')}}</script></html>`;

describe('lecteur BSG', () => {
  it('lit les spécifications d’une page produit', () => {
    const s = lireSpecs(html());
    expect(s['Alpha Acid']).toEqual(['9.5 - 11.5%']);
    expect(s['Hop Aroma Category']).toEqual(['Citrus', 'Pine/Resin']);
  });
  it('rend les champs chiffrés, la maturité, le rendement et les listes', () => {
    const p = lireProduitBsg(html())!;
    expect(p.nom).toBe('Exemplum');
    expect(p.champs.alpha).toMatchObject({ min: 9.5, max: 11.5, unite: '%' });
    expect(p.champs.cohumulone).toMatchObject({ min: 29, max: 30, base: '% des α' });
    expect(p.champs.huileTotale).toMatchObject({ min: 1.5, max: 2.3, unite: 'mL/100 g' });
    expect(p.champs.maturite.brut).toBe('Middle');
    expect(p.champs.rendement).toMatchObject({ min: 1500, max: 1750, unite: 'lb/acre' });
    expect(p.listes.categoriesArome).toEqual(['Citrus', 'Pine/Resin']);
    expect(p.listes.aromes).toEqual(['Pine needle', 'citrus']);
    expect(p.listes.forme).toEqual(['T-90']);
  });
  it('ignore un produit qui n’est pas un houblon avec α publié', () => {
    expect(lireProduitBsg('<html><script>{' + spec(0, 'Product Family', ['EQUIPMENT']) + '}</script></html>')).toBeNull();
  });
});
