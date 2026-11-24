/**
 * Chasse Carnet, voie V3 (21.11) : Comparer, correctifs seulement (la mise en cartes, D1, attend le brasseur).
 * CRB-2 la rangée prix existe toujours (« prix ? », jamais 0) ; CRB-5 aucun rang tant que rien ne classe ; CRB-13 dispo, vendeur, pays ;
 * CRB-14 l'ordre des lignes ; CRU-6 mono pour les mesures seulement. Fixture « ZZ TEST — Chambre froide » : deux articles sans prix,
 * dix valeurs lues en texte (cf. scripts/parcours/fixtures/carnet.mjs). Rouge sur le code du tag tour8, vert sur l'arbre.
 */
import { describe, expect, it } from 'vitest';
import { groupeDeLigne, rangVisible, tableau } from '../../src/domain/carnets/comparer';
import { ID_VENTILATION, fixtureCarnets } from '../../src/domain/carnets/fixture';
import { lireCarnet, type Article, type CarnetDoc } from '../../src/domain/carnets/modele';
import { colonnesComparer, estMesure, genreCellule, texteCellule } from '../../src/ui/carnets/Comparer';

const base = lireCarnet(fixtureCarnets().find(i => i.id === ID_VENTILATION))!;
const ex = (valeur: string) => ({ valeur, origine: 'exemple' as const });
const VALEURS = (dims: string, volume: string): Article['valeurs'] => ({
  'Dimensions du produit': ex(dims), 'Dimensions intérieures (L x P x H)': ex('1700 x 1400 x 2000 mm'), 'Exécution/équipement': ex('groupe frigorifique inclus'),
  'Couleur': ex('blanc RAL 9010'), 'Performance': ex('A+'), 'Épaisseur du matériel': ex('80 mm'), 'Largeur de la porte': ex('800 mm'),
  'Hauteur de la porte': ex('1900 mm'), 'Volume utile': ex(volume)
});
const chambre = (o: Partial<Article> = {}, o2: Partial<Article> = {}): CarnetDoc => ({
  ...base, carnet: {
    ...base.carnet, criteres: [], facons: [], notes: [],
    articles: [
      { id: 'A1', nom: 'Chambre froide - 1800 x 1500', lecture: 'lue', vendeur: 'Froid Exemple', pays: 'CH', dispo: 'en stock', valeurs: VALEURS('1800 x 1500 x 2100 mm', '4,06 m³'), ...o },
      { id: 'A2', nom: 'Chambre froide - 1500 x 1200', lecture: 'lue', vendeur: 'Froid Exemple', pays: 'CH', dispo: 'en stock', valeurs: VALEURS('1500 x 1200 x 2100 mm', '2,6 m³'), ...o2 }
    ]
  }
});

describe('CRB-2 : la rangée prix existe toujours, « prix ? » quand il est inconnu', () => {
  it('sans aucun prix, la colonne prix est quand même la première ligne', () => {
    const t = tableau(chambre())!;
    const cols = colonnesComparer(t);
    expect(cols[0].cle).toBe('__prix');
    expect(cols.map(c => c.cle).filter(c => c === '__prix')).toHaveLength(1);
  });
  it('la cellule d\'un prix inconnu est vide pour le domaine (jamais 0) : l\'écran dit « prix ? »', () => {
    const t = tableau(chambre())!;
    const prix = colonnesComparer(t)[0];
    expect(t.lignes.map(l => texteCellule(l, prix))).toEqual([null, null]);
    expect(JSON.stringify(t.lignes)).not.toMatch(/prixCentimes":0/);
  });
  it('un prix connu et un inconnu : l\'un en nombre, l\'autre vide', () => {
    const t = tableau(chambre({ prixCentimes: 310000, devise: 'CHF' }))!;
    const prix = colonnesComparer(t)[0];
    expect(t.lignes.map(l => texteCellule(l, prix)?.replace(/\s/g, ' ') ?? null)).toEqual(['3 100', null]);
  });
});

describe('CRB-5 : pas de rang tant que rien ne classe', () => {
  it('sans critère ni prix, aucun rang ne se montre ; le rang de la ligne (en lice) reste', () => {
    const t = tableau(chambre())!;
    expect(t.rangePar).toBeNull();
    expect(t.lignes.map(l => l.rang)).toEqual([1, 2]);
    expect(t.lignes.map(l => rangVisible(t, l))).toEqual([null, null]);
  });
  it('le prix de deux articles classe : les rangs se montrent', () => {
    const t = tableau(chambre({ prixCentimes: 310000, devise: 'CHF' }, { prixCentimes: 240000, devise: 'CHF' }))!;
    expect(t.rangePar).toBe('le prix');
    expect(t.lignes.map(l => rangVisible(t, l))).toEqual([1, 2]);
    expect(t.lignes[0].articleId).toBe('A2');
  });
  it('un critère qui classe : les rangs se montrent ; un écarté n\'en a jamais', () => {
    const t = tableau(base)!;
    expect(t.rangePar).not.toBeNull();
    const vus = t.lignes.map(l => rangVisible(t, l));
    expect(vus.filter(x => x !== null).length).toBeGreaterThan(1);
    for (const l of t.lignes.filter(x => x.ecarte)) expect(rangVisible(t, l)).toBeNull();
  });
});

describe('CRB-13 et CRB-14 : dispo, vendeur, pays en lignes, dans l\'ordre de sa décision', () => {
  /* C55-4 (R26, 24.11) : l'offre (prix, dispo, vendeur, pays) reste ensemble, en tête ; puis l'ordre de la FICHE (volume, énergie, dimensions,
     porte, le reste, construction, couleur). Avant : dispo, vendeur, pays au milieu des caractéristiques (plainte du tour 55). */
  it('l\'ordre : l\'offre ensemble en tête, puis les caractéristiques dans l\'ordre de la fiche, la couleur en bas', () => {
    const t = tableau(chambre())!;
    const noms = colonnesComparer(t).map(c => c.nom);
    expect(noms).toEqual([
      'prix', 'dispo', 'vendeur', 'pays', 'Volume utile', 'Performance', 'Dimensions du produit', 'Dimensions intérieures (L x P x H)',
      'Hauteur de la porte', 'Largeur de la porte', 'Exécution/équipement', 'Épaisseur du matériel', 'Couleur'
    ]);
  });
  it('les lignes de livraison reprennent ce que l\'article porte ; sans valeur chez personne, pas de ligne', () => {
    const t = tableau(chambre())!;
    const cols = colonnesComparer(t);
    const dispo = cols.find(c => c.cle === '__dispo')!;
    expect(t.lignes.map(l => texteCellule(l, dispo))).toEqual(['en stock', 'en stock']);
    const sans = tableau(chambre({ dispo: undefined, vendeur: undefined, pays: undefined }, { dispo: undefined, vendeur: undefined, pays: undefined }))!;
    expect(colonnesComparer(sans).map(c => c.cle).filter(c => c.startsWith('__') && c !== '__prix')).toEqual([]);
  });
  it('un critère qui classe passe avant le volume et les dimensions, après le prix', () => {
    const t = tableau(base)!;
    const cols = colonnesComparer(t);
    expect(cols[0].cle).toBe('__prix');
    expect(cols[1].critere || t.colonnes.find(c => c.nom === cols[1].nom)?.critereId).toBeTruthy();
  });
  it('groupeDeLigne : la porte n\'est pas une dimension, la couleur est la dernière', () => {
    expect(groupeDeLigne('Hauteur de la porte')).toBeLessThan(groupeDeLigne('Exécution/équipement'));
    expect(groupeDeLigne('Hauteur de la porte')).toBeGreaterThan(groupeDeLigne('Dimensions du produit'));
    expect(groupeDeLigne('Couleur :')).toBeGreaterThan(groupeDeLigne('Performance'));
    expect(groupeDeLigne('Volume utile')).toBeLessThan(groupeDeLigne('Largeur'));
  });
});

describe('CRU-6 : une mesure en mono, un mot en police du texte', () => {
  it.each(['4,06 m³', '80 mm', '1800 x 1500 x 2100 mm', '+2 à +8 °C', '2 400', '2 400', '1 500 m³/h', '3 semaines', '62 dB'])('« %s » est une mesure', s => {
    expect(estMesure(s)).toBe(true);
  });
  it.each(['blanc RAL 9010', 'A+', 'groupe frigorifique inclus', 'Panneaux sandwich, groupe frigorifique monobloc', 'en stock', 'oui', 'Froid Exemple'])('« %s » est un mot', s => {
    expect(estMesure(s)).toBe(false);
  });
  it('un nombre de la page est une mesure ; le prix aussi ; le texte « blanc » non', () => {
    const t = tableau(chambre())!;
    const cols = colonnesComparer(t);
    const couleur = cols.find(c => c.nom === 'Couleur')!;
    expect(genreCellule(couleur, t.lignes[0].cellules['Couleur'], 'blanc RAL 9010')).toBe('texte');
    expect(genreCellule(cols[0], undefined, '2 400')).toBe('mesure');
    expect(genreCellule(couleur, { valeur: 42, origine: 'exemple' }, '42')).toBe('mesure');
  });
});
