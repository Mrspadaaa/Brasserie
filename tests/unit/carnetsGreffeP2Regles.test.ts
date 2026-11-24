/**
 * Voie greffe-p2 (port D451) : règles du tableau du carnet, du prix selon la quantité et de « ce qui diffère » (maquettes2/v01, B7 à B12).
 * Règles seulement (Vitest) ; l'écran se prouve par la vision. Cas neufs aussi (fûts, assurance, fête, photo seule), jamais les seuls
 * exemples de la maquette (B23).
 */
import { describe, expect, it } from 'vitest';
import {
  aDesPaliers, alphaDe, aromesCommuns, aromesDe, choisirMesures, colonnesMatiere, departager, ditDiffèrent, ditIdentiques, estCarnetDeMatiere,
  largeursBarres, ligneIdentique, lignesSelonLaQuantite, meilleursPrixAuKilo, paliersDe, phraseSelonLaQuantite, plusBasDe, prixAuKilo, prixParMesure,
  recolteDe, texteChfKg, uniteExtensive, type ArticleRegle, type CandidatMesure
} from '../../src/ui/carnets/tableauRegles';

const v = (valeur: string | number, unite?: string) => ({ valeur, ...(unite ? { unite } : {}), origine: 'page' as const });
const CHANGE = { taux: 0.93, date: '2026-11-24', source: 'BCE' as const };

/** Deux vendeurs de la même matière : un en euros (offres 50 g à 1 kg), un en francs (prix au gramme, paliers à 1, 5 et 20 kg). */
const EN_EUROS: ArticleRegle & { id: string } = {
  id: 'E', nom: 'Pellets T90 (US)', prixCentimes: 372, devise: 'EUR', taxe: 'ttc', change: CHANGE, conditionnement: { valeur: 50, unite: 'g' },
  offres: [{ valeur: 50, unite: 'g', prixCentimes: 372 }, { valeur: 250, unite: 'g', prixCentimes: 1406 }, { valeur: 500, unite: 'g', prixCentimes: 2497 }, { valeur: 1, unite: 'kg', prixCentimes: 4069 }],
  valeurs: { "Taux d'acides alpha": v('13,2', '%'), Récolte: v(2025), Arômes: v('agrumes, citron vert, mangue') }
};
const EN_FRANCS: ArticleRegle & { id: string } = {
  id: 'F', nom: 'Pellets T90 (CH)', prixCentimes: 8000, devise: 'CHF', taxe: 'ht', conditionnement: { valeur: 1, unite: 'kg' },
  prixUnite: { prix: 0.1044, unite: 'g', paliers: [{ des: 1000, prix: 0.08 }, { des: 5000, prix: 0.04914 }, { des: 20000, prix: 0.0391075 }] },
  valeurs: { Alpha: v('13,6', '%'), Arômes: v('citron vert, mangue, fruits tropicaux') }
};

describe('greffe-p2 : colonnes du tableau', () => {
  const cand = (nom: string, sens: string, distingue: boolean, rang = 5): CandidatMesure => ({ cle: nom, nom, sens, distingue, rang });

  it('un carnet de matière pesée : α, puis récolte seulement si un article la dit', () => {
    expect(estCarnetDeMatiere([EN_EUROS, EN_FRANCS])).toBe(true);
    expect(colonnesMatiere([EN_EUROS, EN_FRANCS])).toEqual(['alpha', 'recolte']);
    const sansRecolte = { ...EN_EUROS, valeurs: { "Taux d'acides alpha": v('13,2', '%') } };
    expect(colonnesMatiere([sansRecolte, EN_FRANCS])).toEqual(['alpha']);
    expect(estCarnetDeMatiere([{ id: 'X', nom: 'Chambre froide 2,6 m³', valeurs: { Volume: v(2.6, 'm³') } }])).toBe(false);
    expect(estCarnetDeMatiere([])).toBe(false);
  });

  it('lit α sous ses trois noms, la récolte seulement si elle est écrite (jamais une année par défaut)', () => {
    expect(alphaDe(EN_EUROS)).toBe('13,2');
    expect(alphaDe(EN_FRANCS)).toBe('13,6');
    expect(alphaDe({ id: 'Z', nom: 'Citra 13.6%', valeurs: { Citra: v('13,6', '%') } })).toBe('13,6');
    expect(recolteDe(EN_EUROS)).toBe('2025');
    expect(recolteDe(EN_FRANCS)).toBeNull();
    expect(alphaDe({ id: 'Y', nom: 'Hopfen', valeurs: {} })).toBeNull();
  });

  it('deux mesures au plus, celles qui classent d\'abord, puis celles qui distinguent (volume, raccord, prix pour des fûts)', () => {
    const fut = [cand('Volume', 'texte', true, 2), cand('Raccord', 'texte', true, 6), cand('Matière', 'texte', false, 9)];
    expect(choisirMesures(fut).map(c => c.nom)).toEqual(['Volume', 'Raccord']);
    const froid = [cand('Tension', 'texte', false, 3), cand('Volume', 'plus', true, 2), cand('Surface au sol', 'texte', true, 4), cand('Puissance', 'texte', true, 5)];
    expect(choisirMesures(froid).map(c => c.nom)).toEqual(['Volume', 'Surface au sol']);
  });

  it('aucune mesure ne distingue : la première seulement ; aucune candidate : rien', () => {
    expect(choisirMesures([cand('Tension', 'texte', false, 3), cand('Puissance', 'texte', false, 5)]).map(c => c.nom)).toEqual(['Tension']);
    expect(choisirMesures([])).toEqual([]);
  });

  it('les arômes se lisent mot à mot et se réunissent sans doublon', () => {
    expect(aromesDe(EN_EUROS)).toEqual(['agrumes', 'citron vert', 'mangue']);
    expect(aromesCommuns([EN_EUROS, EN_FRANCS])).toEqual(['agrumes', 'citron vert', 'mangue', 'fruits tropicaux']);
    expect(aromesDe({ id: 'N', nom: 'Hopfen', valeurs: {} })).toEqual([]);
  });
});

describe('greffe-p2 : prix au kilo selon la quantité', () => {
  it('lit les conditionnements publiés, du plus petit au plus gros', () => {
    expect(paliersDe(EN_EUROS).map(p => p.kg)).toEqual([0.05, 0.25, 0.5, 1]);
    expect(paliersDe(EN_FRANCS).map(p => p.kg)).toEqual([0.001, 1, 5, 20]);
    expect(aDesPaliers([EN_EUROS, EN_FRANCS])).toBe(true);
  });

  it('1 kg : l\'euro au rendu (cours, TVA d\'import), le franc tel quel', () => {
    const e = prixAuKilo(EN_EUROS, 1)!;
    expect(Math.round(e.chf)).toBe(41);
    expect(e.estime).toBe(true);
    expect(e.plancher).toBe(true); /* port non lu : un plancher */
    expect(texteChfKg(e)).toBe('≈41');
    const f = prixAuKilo(EN_FRANCS, 1)!;
    expect(f.chf).toBeCloseTo(80, 5);
    expect(texteChfKg(f)).toBe('80');
  });

  it('5 et 20 kg : le palier du fournisseur au franc ; l\'autre achète son plus gros conditionnement autant de fois', () => {
    expect(Math.round(prixAuKilo(EN_FRANCS, 5)!.chf)).toBe(49);
    expect(Math.round(prixAuKilo(EN_FRANCS, 20)!.chf)).toBe(39);
    expect(Math.round(prixAuKilo(EN_EUROS, 5)!.chf)).toBe(41);
    expect(Math.round(prixAuKilo(EN_EUROS, 20)!.chf)).toBe(41);
  });

  it('une quantité plus petite que le plus petit conditionnement n\'a pas de prix (absent, jamais 0)', () => {
    const gros: ArticleRegle = { nom: 'Pellets 5 kg', prixCentimes: 20000, devise: 'CHF', valeurs: {}, offres: [{ valeur: 5, unite: 'kg', prixCentimes: 20000 }] };
    expect(prixAuKilo(gros, 1)).toBeNull();
    expect(prixAuKilo(gros, 5)!.chf).toBeCloseTo(40, 5);
  });

  it('inconnus : sans prix, sans quantité lisible, sans cours, quantité nulle', () => {
    expect(prixAuKilo({ nom: 'Pellets', valeurs: {} }, 1)).toBeNull();
    expect(prixAuKilo({ nom: 'Pellets', prixCentimes: 500, devise: 'CHF', valeurs: {} }, 1)).toBeNull();
    expect(prixAuKilo({ ...EN_EUROS, change: undefined }, 1)).toBeNull();
    expect(prixAuKilo(EN_FRANCS, 0)).toBeNull();
    expect(paliersDe({ nom: 'Pellets', prixCentimes: 500, valeurs: {} })).toEqual([]);
  });

  it('un seul conditionnement lu dans le nom donne un seul palier, et un prix « dès » sans quantité aucun', () => {
    const nomme: ArticleRegle = { nom: 'Levure sèche 500 g', prixCentimes: 2500, devise: 'CHF', valeurs: {} };
    expect(paliersDe(nomme)).toEqual([{ kg: 0.5, centimes: 2500 }]);
    expect(prixAuKilo(nomme, 0.25)).toBeNull(); /* moins qu'un sachet : pas de prix */
    expect(prixAuKilo(nomme, 1)!.chf).toBeCloseTo(50, 5); /* deux sachets de 500 g */
    expect(prixAuKilo(nomme, 0.5)!.chf).toBeCloseTo(50, 5);
    expect(paliersDe({ nom: 'Houblon', prixCentimes: 10, prixDes: true, devise: 'CHF', valeurs: {} })).toEqual([]);
  });

  it('un franc sous 10 CHF/kg se dit avec une décimale', () => {
    expect(texteChfKg({ chf: 4.24, estime: false, plancher: false, palier: 25 })).toBe('4,2');
    expect(texteChfKg({ chf: 40.9, estime: true, plancher: true, palier: 1 })).toBe('≈41');
  });

  it('Selon la quantité : qui gagne à 1, 5 et 20 kg, et la phrase de Comparer', () => {
    const lignes = lignesSelonLaQuantite([EN_EUROS, EN_FRANCS]);
    expect(lignes.map(l => l.kg)).toEqual([1, 5, 20]);
    expect(lignes.map(l => [...l.gagnants])).toEqual([['E'], ['E'], ['F']]);
    const nom = (id: string) => (id === 'E' ? 'MotlerHops' : 'Brau');
    expect(phraseSelonLaQuantite(lignes, nom)).toBe('1 et 5 kg, MotlerHops ; 20 kg, Brau (39 CHF/kg).');
  });

  it('même gagnant partout : pas de phrase ; égalité : personne ne gagne', () => {
    const seul = lignesSelonLaQuantite([EN_EUROS, { ...EN_FRANCS, prixUnite: { prix: 0.2, unite: 'g' }, prixCentimes: 20000 }]);
    expect(phraseSelonLaQuantite(seul, () => 'x')).toBeNull();
    expect(meilleursPrixAuKilo(new Map([['a', { chf: 40.2, estime: false, plancher: false, palier: 1 }], ['b', { chf: 40.4, estime: false, plancher: false, palier: 1 }]])).size).toBe(2);
    expect(meilleursPrixAuKilo(new Map([['a', { chf: 40, estime: false, plancher: false, palier: 1 }]])).size).toBe(0);
  });
});

describe('greffe-p2 : prix par unité de la mesure (froid, fête, assurance)', () => {
  it('prix au m³ d\'une chambre froide, au franc près', () => {
    expect(Math.round(prixParMesure(298751, 4.06)!)).toBe(736);
    expect(Math.round(prixParMesure(269774, 2.6)!)).toBe(1038);
  });
  it('inconnu ou nul : absent, jamais une division par zéro', () => {
    expect(prixParMesure(undefined, 4)).toBeNull();
    expect(prixParMesure(1000, null)).toBeNull();
    expect(prixParMesure(1000, 0)).toBeNull();
    expect(prixParMesure(Number.NaN, 2)).toBeNull();
  });
  it('seule une mesure qui s\'additionne a un prix à l\'unité (pas une température)', () => {
    expect(['m³', 'm²', 'L', 'kg', 'places'].every(uniteExtensive)).toBe(true);
    expect(['°C', 'V', 'W', 'bar', undefined].some(u => uniteExtensive(u as string))).toBe(false);
  });
  it('le plus bas gagne, ex æquo compris ; les barres : la plus grande pleine, l\'autre proportionnelle', () => {
    const val = new Map<string, number | null>([['a', 736], ['b', 1038], ['c', null]]);
    expect([...plusBasDe(val)]).toEqual(['a']);
    const l = largeursBarres(val);
    expect(l.get('b')).toBe(100);
    expect(l.get('a')).toBe(71);
    expect(l.has('c')).toBe(false);
  });
});

describe('greffe-p2 : Comparer, ce qui diffère d\'abord', () => {
  const ligne = (cle: string, ...cellules: Array<string | null>) => ({ cle, cellules });

  it('identique : même texte partout, espaces et casse près ; une cellule inconnue fait toujours diffèrer', () => {
    expect(ligneIdentique(ligne('forme', 'pellets T90', 'Pellets  T90'))).toBe(true);
    expect(ligneIdentique(ligne('origine', 'États-Unis', null))).toBe(false);
    expect(ligneIdentique(ligne('dispo', 'en stock', 'sur commande'))).toBe(false);
    expect(ligneIdentique(ligne('seule', 'x'))).toBe(false);
  });

  it('sépare les lignes qui diffèrent, garde en vue ce qui classe même identique', () => {
    const lignes = [ligne('prix', '41', '80'), ligne('forme', 'pellets', 'pellets'), ligne('classe', 'oui', 'oui'), ligne('tension', '230 V', '230 V')];
    const r = departager(lignes, new Set(['classe']));
    expect(r.diffèrent.map(l => l.cle)).toEqual(['prix', 'classe']);
    expect(r.identiques.map(l => l.cle)).toEqual(['forme', 'tension']);
    expect(ditDiffèrent(5)).toBe('5 diffèrent');
    expect(ditDiffèrent(1)).toBe('1 diffère');
    expect(ditIdentiques(18)).toBe('18 identiques');
    expect(ditIdentiques(1)).toBe('1 identique');
  });

  it('une assurance ou une fête (cas neufs) : rien de propre à la maquette', () => {
    const r = departager([ligne('franchise', '500', '500'), ligne('prime', '1 200', '980'), ligne('couverture', 'RC', null)]);
    expect(r.identiques.map(l => l.cle)).toEqual(['franchise']);
    expect(r.diffèrent.map(l => l.cle)).toEqual(['prime', 'couverture']);
  });
});
