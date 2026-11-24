/**
 * Voie e47 (24.11) : lecture des liens et Comparer (E47-1 à E47-5), centimes dans À venir et la frise (C46-5).
 * Écrits ROUGES sur le code d'avant (RESULTAT.md garde la sortie), puis verts.
 * Aucun réseau, aucun appel Gemini : des pages écrites à la main qui reprennent la forme des pages du banc (brewstore.ch, galaxus.ch).
 */
import { describe, expect, it } from 'vitest';
import { lirePage } from '../../functions/src/lireLien';
import { libelleFrancais, prioriserValeurs, traduireValeurs } from '../../functions/src/lienLibelles';
import { valeursEmbarquees } from '../../functions/src/lienPlateforme';
import { tableau } from '../../src/domain/carnets/comparer';
import { ID_VENTILATION, fixtureCarnets } from '../../src/domain/carnets/fixture';
import { lireCarnet, type Article, type CarnetDoc } from '../../src/domain/carnets/modele';
import { colonnesComparer, texteCellule } from '../../src/ui/carnets/Comparer';
import { texteSelonNom } from '../../src/ui/carnets/EtatIA';
import { depuisIA } from '../../src/ui/carnets/lignesRegles';
import { francsExacts } from '../../src/domain/calendrier';
import { chf0 as montantAVenir } from '../../src/ui/finance/UpgradeWorkspace';

const page = (jsonld: unknown, corps: string) => `<!doctype html><html lang="de"><head><title>Kessel</title>
<script type="application/ld+json">${JSON.stringify(jsonld)}</script></head><body><main><h1>Motorisierter Edelstahl-Maischekessel 50 L</h1>${corps}</main></body></html>`;
const produit = (availability: string) => ({
  '@context': 'https://schema.org', '@type': 'Product', name: 'Motorisierter Edelstahl-Maischekessel 50 L',
  offers: { '@type': 'Offer', price: '520.00', priceCurrency: 'CHF', availability }
});
const URL_BREW = new URL('https://brewstore.ch/materiel/casseroles-et-cuves/casserole-de-brassage-motorisee-50l/');

describe('E47-1 : « sur commande » n\'est pas une rupture', () => {
  const corps = '<p>Auf Bestellung</p><p>Dieses Produkt wird in 28 Tagen versendet.</p>';
  it('schema.org PreOrder : l\'état est « sur commande », avec son délai dit par la page', () => {
    const p = lirePage(page(produit('https://schema.org/PreOrder'), corps), URL_BREW, 1);
    expect(p.dispo).toBe('sur-commande');
    expect(p.dispoDelai).toBe('expédié sous 28 jours');
  });
  it('sans délai écrit : « sur commande » seul, jamais un délai inventé', () => {
    const p = lirePage(page(produit('https://schema.org/PreOrder'), '<p>Auf Bestellung</p>'), URL_BREW, 1);
    expect(p.dispo).toBe('sur-commande');
    expect(p.dispoDelai).toBeUndefined();
  });
  it('OutOfStock reste une rupture, InStock reste « en stock »', () => {
    expect(lirePage(page(produit('https://schema.org/OutOfStock'), '<p>Ausverkauft</p>'), URL_BREW, 1).dispo).toBe('rupture');
    expect(lirePage(page(produit('https://schema.org/InStock'), '<p>Auf Lager</p>'), URL_BREW, 1).dispo).toBe('en-stock');
  });
  it('la ligne rangée dit « sur commande · expédié sous 28 jours », jamais « rupture »', () => {
    const p = lirePage(page(produit('https://schema.org/PreOrder'), corps), URL_BREW, 1);
    const l = depuisIA({ id: 'L1', sorte: 'article', url: URL_BREW.href, page: p } as never, { carnetId: 'C1' } as never) as { dispo?: string };
    expect(l.dispo).toBe('sur commande · expédié sous 28 jours');
  });
});

describe('E47-2 : une colonne de Comparer, une grandeur, une unité', () => {
  const base = lireCarnet(fixtureCarnets().find(i => i.id === ID_VENTILATION))!;
  const art = (id: string, valeurs: Article['valeurs']): Article => ({ id, nom: `Article ${id}`, lecture: 'lue', valeurs });
  const doc = (articles: Article[]): CarnetDoc => ({ ...base, carnet: { ...base.carnet, criteres: [], facons: [], notes: [], articles } });
  const lu = (valeur: string | number, unite?: string) => ({ valeur, ...(unite ? { unite } : {}), origine: 'page' as const });
  const cellules = (articles: Article[], nom: string) => {
    const t = tableau(doc(articles))!;
    const col = colonnesComparer(t).find(c => c.nom === nom)!;
    return { cellules: t.lignes.map(l => texteCellule(l, col)), unite: col.unite };
  };
  it('143,5 cm et 370 mm (unité écrite dans le texte) se lisent tous deux en cm', () => {
    const c = cellules([art('A', { Hauteur: lu('143,5 cm'), Volume: lu('242 l') }), art('B', { Hauteur: lu('370 mm'), Volume: lu('50 L') })], 'Hauteur');
    expect(c.unite).toBe('cm');
    expect(c.cellules).toEqual(['143,5', '37']);
  });
  it('même chose quand l\'unité est dans son champ', () => {
    const c = cellules([art('A', { Hauteur: lu(143.5, 'cm') }), art('B', { Hauteur: lu(370, 'mm') })], 'Hauteur');
    expect(c.unite).toBe('cm');
    expect(c.cellules).toEqual(['143,5', '37']);
  });
  it('trois articles : l\'ordre des colonnes ne change pas quand un article change l\'ordre de ses valeurs', () => {
    const a = art('A', { Volume: lu('242 l'), Hauteur: lu('143,5 cm') });
    const b = art('B', { Volume: lu('50 L'), Hauteur: lu('370 mm') });
    const b2 = art('B', { Hauteur: lu('370 mm'), Volume: lu('50 L') });
    const noms = (xs: Article[]) => colonnesComparer(tableau(doc(xs))!).map(c => c.nom);
    expect(noms([a, b])).toEqual(noms([a, b2]));
    expect(noms([b2, a])).toEqual(noms([a, b]));
  });
});

describe('E47-3 : un libellé allemand se traduit', () => {
  it('« Gesamtabmessungen mit Motor » devient « Dimensions avec moteur »', () => {
    expect(libelleFrancais('Gesamtabmessungen mit Motor')).toBe('Dimensions avec moteur');
    expect(traduireValeurs([{ nom: 'Gesamtabmessungen mit Motor', valeur: 'ca. 525 × 550 mm (H)' }])![0].nom).toBe('Dimensions avec moteur');
  });
});

describe('E47-4 : une référence est un texte, jamais une quantité', () => {
  it('le serveur ne groupe pas les chiffres d\'une référence', () => {
    const l = traduireValeurs([{ nom: 'Herstellernummer', valeur: '109971' }, { nom: 'Artikelnummer', valeur: '49548562' }, { nom: 'GTIN', valeur: '9470109971005' }])!;
    expect(l.map(v => v.valeur)).toEqual(['109971', '49548562', '9470109971005']);
  });
  it('l\'écran recopie la référence telle quelle', () => {
    expect(texteSelonNom('Réf. du fabricant', '109 971')).toBe('109971');
    expect(texteSelonNom('Numéro d\'article', '49 548 562')).toBe('49548562');
    expect(texteSelonNom('Volume', '1 200')).toBe('1 200');
  });
});

describe('E47-5 : les caractéristiques dites en premier sont l\'essentiel', () => {
  const marmite = [
    { nom: 'Fassungsvermögen', valeur: '50 L' }, { nom: 'Motor', valeur: '220 V – 0,09 kW' }, { nom: 'Drehzahl', valeur: '28 U/min' },
    { nom: 'Innendurchmesser', valeur: '455 mm' }, { nom: 'Höhe', valeur: '370 mm' }, { nom: 'Wandstärke', valeur: '1 mm' }, { nom: 'Volumen', valeur: '50 L' },
    { nom: 'Artikelnummer', valeur: '40.003' }, { nom: 'Est probablement équipé d\'un adaptateur secteur', valeur: 'Oui' },
    { nom: 'Matière', valeur: 'Edelstahl AISI 304' }, { nom: 'Induction', valeur: 'non' }
  ];
  it('Capacité et Volume (50 L deux fois) ne font qu\'une ligne', () => {
    const noms = prioriserValeurs(traduireValeurs(marmite)!).map(v => v.nom);
    expect(noms.filter(n => n === 'Volume' || n === 'Capacité')).toHaveLength(1);
  });
  it('matière et induction passent avant l\'adaptateur secteur et le numéro d\'article', () => {
    const noms = prioriserValeurs(traduireValeurs(marmite)!).map(v => v.nom);
    const i = (n: string) => noms.indexOf(n);
    expect(i('Matière')).toBeGreaterThanOrEqual(0);
    expect(i('Induction')).toBeGreaterThanOrEqual(0);
    /* TEST ADAPTÉ par c48-fix (24.11), ajout du pilote sur E47-5 rouvert (tour 49, FK-0) : « Est probablement équipé d'un adaptateur secteur : Oui »
       est une supposition de la page : elle n'est plus gardée du tout (avant : gardée, en dernier). Le numéro d'article reste, en dernier. */
    for (const essentiel of ['Matière', 'Induction']) expect(i(essentiel)).toBeLessThan(i('Numéro d\'article'));
    expect(noms.some(n => /probablement/i.test(n))).toBe(false);
    expect(noms.slice(-1)).toEqual(['Numéro d\'article']);
  });
  it('frigo : consommation et classe énergétique avant les numéros', () => {
    const noms = prioriserValeurs(traduireValeurs([
      { nom: 'Artikelnummer', valeur: '49548562' }, { nom: 'Herstellernummer', valeur: '109971' }, { nom: 'Nutzvolumen Gesamt', valeur: '242 l' },
      { nom: 'Energieeffizienzklasse', valeur: 'E' }, { nom: 'Energieverbrauch pro Jahr', valeur: '104 kWh' }, { nom: 'Breite', valeur: '54 cm' }
    ])!).map(v => v.nom);
    for (const e of noms.filter(n => /énergétique|nergie|Consommation/.test(n))) for (const num of noms.filter(n => /Numéro|Réf/.test(n))) expect(noms.indexOf(e)).toBeLessThan(noms.indexOf(num));
    expect(noms.some(n => /Consommation/.test(n))).toBe(true);
  });
  it('galaxus : un groupe « Energiedeklaration » d\'une seule caractéristique est lu (il était écarté sous 3 lignes)', () => {
    const groupe = (nom: string, specs: Array<[string, string]>) => ({ node: { name: nom, specifications: specs.map(([title, text]) => ({ title, value: { __typename: 'ProductSpecificationTextValue', text } })) } });
    const etat = { props: { pageProps: { data: { product: { specificationGroups: { edges: [
      groupe('Allgemein', [['Kühlschranktyp', 'Kühlschrank ohne Gefrierfach'], ['Nutzvolumen Gesamt', '242 l'], ['Breite', '54 cm']]),
      groupe('Leistung', [['Leistungsaufnahme', '90 W'], ['Energieverbrauch pro Jahr', '104 kWh']]),
      groupe('Energiedeklaration', [['Energieeffizienzklasse', 'E']])
    ] } } } } } };
    const noms = valeursEmbarquees(etat).map(v => v.nom);
    expect(noms).toContain('Energieverbrauch pro Jahr');
    expect(noms).toContain('Energieeffizienzklasse');
  });
  it('page brewstore : la matière et l\'induction écrites dans les puces sont lues, rien n\'est inventé', () => {
    const corps = '<h2>Eigenschaften:</h2><ul><li>Fassungsvermögen: 50 L</li><li>Edelstahl AISI 304</li><li>Motor: 220 V – 0,09 kW</li></ul><p>Nicht für Induktion geeignet</p>';
    const p = lirePage(page(produit('https://schema.org/PreOrder'), corps), URL_BREW, 1);
    const v = Object.fromEntries((p.valeurs ?? []).map(x => [x.nom, x.valeur]));
    expect(v['Matière'] ?? v['Material']).toMatch(/Acier inox AISI 304/);
    expect(JSON.stringify(p.valeurs)).toMatch(/Induktion|induction/i);
    const sans = lirePage(page(produit('https://schema.org/InStock'), '<ul><li>Fassungsvermögen: 50 L</li></ul>'), URL_BREW, 1);
    expect(JSON.stringify(sans.valeurs ?? [])).not.toMatch(/Induktion|induction|Matière/i);
  });
});

describe('C46-5 : un montant à centimes se dit avec ses centimes, partout pareil', () => {
  it('À venir : 79,95 CHF reste 79,95 ; 80 CHF reste 80 ; 4 900 garde son espace', () => {
    expect(montantAVenir(7995)).toBe('79,95');
    expect(montantAVenir(8000)).toBe('80');
    expect(montantAVenir(490000)).toBe(francsExacts(490000));
    expect(montantAVenir(490000).replace(/\s/g, '')).toBe('4900');
  });
  it('la frise écrit le même montant que la carte', async () => {
    const { sgExact: sg } = await import('../../src/ui/calendrier/entete/Courbe');
    expect(sg(-7995)).toBe('−79,95');
    expect(sg(-8000)).toBe('−80');
  });
});
