// D271 (01.11, ses mots) : « Langue utilisée pour les factures, allemand, anglais, français, italien. Ça traduits en français et fait le bon lien ».
// Une bande par famille quelle que soit la langue de la désignation ; la bande s'affiche en français ; la désignation imprimée n'est jamais traduite (D261a).
// Priorité : allemand, anglais, français ; l'italien par ses mots de base, un seul cas (« beaucoup plus rare »).
import { describe, expect, it } from 'vitest';
import { NOMS_GROUPES, type GroupeCle } from '../../../../src/ui/depense/groupes';
import { famille } from './aide';

type Jeu = Array<[string, GroupeCle]>;
const joue = (jeu: Jeu) => jeu.map(([nom, attendu]) => `${nom} → ${famille(nom)} (attendu ${attendu})`).filter((ligne, i) => famille(jeu[i][0]) !== jeu[i][1]);

describe('D271 — le nom imprimé dans la langue de la facture, la bande en français', () => {
  it('allemand : Hefe, Malz, Hopfen, Zucker, Gärtank, Kronkorken, Reinigung, Handschuhe, Zusätze', () => {
    expect(joue([
      ['Trockenhefe 11 g', 'levure'], ['Weizenmalz hell 25 kg', 'malt'], ['Pilsner Malz 25 kg', 'malt'], ['Haferflocken 5 kg', 'malt'], ['Hopfenpellets Cascade 100 g', 'houblon'],
      ['Brauzucker 1 kg', 'sucre'], ['Kandiszucker dunkel', 'sucre'], ['Gärtank 50 L', 'materiel'], ['Maischekessel 30 L', 'materiel'], ['Kronkorken 26 mm', 'emballage'],
      ['Flaschen 0,33 l', 'emballage'], ['Reinigungsmittel 5 kg', 'nettoyage'], ['Desinfektionsmittel', 'nettoyage'], ['Handschuhe Nitril', 'consommable'],
      ['Hefenährsalz', 'additif'], ['Milchsäure 80 %', 'additif'], ['Bittersalz', 'additif'],
    ])).toEqual([]);
  });

  it('anglais : yeast, malt, hop, sugar, fermenter, bottle caps, sanitizer, gloves, finings', () => {
    expect(joue([
      ['Dry Yeast 11 g', 'levure'], ['Pale Malt 25 kg', 'malt'], ['Wheat flakes 1 kg', 'malt'], ['Cascade Hop Pellets 100 g', 'houblon'], ['Candi Sugar dark', 'sucre'],
      ['Fermenter 30 L', 'materiel'], ['Airlock', 'materiel'], ['Bottle caps 26 mm', 'emballage'], ['Sanitizer 1 L', 'nettoyage'], ['Latex gloves', 'consommable'],
      ['Whirlfloc tablets', 'additif'], ['Irish moss', 'additif'], ['Yeast nutrient', 'additif'],
    ])).toEqual([]);
  });

  it('français : levure, malt, houblon, sucre candi, fermenteur, bouchons, nettoyant, gants, chlorure de calcium', () => {
    expect(joue([
      ['Levure sèche 11 g', 'levure'], ['Malt Pilsner 25 kg', 'malt'], ['Flocons d’orge 1 kg', 'malt'], ['Houblon Saaz 100 g', 'houblon'], ['Sucre candi foncé', 'sucre'],
      ['Fermenteur 30 L', 'materiel'], ['Bouchons 29 mm', 'emballage'], ['Étiquettes adhésives', 'emballage'], ['Nettoyant alcalin 5 kg', 'nettoyage'], ['Gants nitrile', 'consommable'],
      ['Chlorure de calcium 500 g', 'additif'], ['Acide lactique 80 %', 'additif'],
    ])).toEqual([]);
  });

  it('italien (mots de base seulement) : lievito, malto, luppolo, zucchero, fermentatore', () => {
    expect(joue([['Lievito secco 11 g', 'levure'], ['Malto Pilsner 25 kg', 'malt'], ['Luppolo Cascade 100 g', 'houblon'], ['Zucchero candito', 'sucre'], ['Fermentatore 30 L', 'materiel']])).toEqual([]);
  });

  it('la catégorie écrite par la lecture dans la langue de la facture est normalisée en français (appel de canonicalStockCategory, rien de dupliqué)', () => {
    const jeu: Array<[string, GroupeCle]> = [
      ['Yeast', 'levure'], ['Hefe', 'levure'], ['Hopfen', 'houblon'], ['Malz', 'malt'], ['Zucker', 'sucre'], ['Zusatzstoff', 'additif'], ['Verpackung', 'emballage'],
      ['Reinigungsmittel', 'nettoyage'], ['Hops', 'houblon'], ['Packaging', 'emballage'], ['Sugar', 'sucre'], ['Lievito', 'levure'], ['Houblons', 'houblon'],
    ];
    expect(jeu.map(([cat]) => famille('Article sans mot de famille XJ-17', 'stock', cat)).filter((f, i) => f !== jeu[i][1])).toEqual([]);
  });

  it('les noms des bandes sont français, jamais ceux de la facture', () => {
    expect(Object.values(NOMS_GROUPES).join('|')).toBe('Malts|Houblons|Levures|Sucres|Additifs|Matériel de brassage|Emballage|Nettoyage|Consommables|Rénovation|Services|Autres');
  });
});
