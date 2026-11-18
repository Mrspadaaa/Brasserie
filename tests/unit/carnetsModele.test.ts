import { describe, expect, it } from 'vitest';
import { fixtureCarnets, fixturePlanRealise, ID_DENSIMETRE, ID_EMBOUTEILLAGE, ID_EVIER, ID_FRIGO, ID_VENTILATION, TITRES_BANC } from '../../src/domain/carnets/fixture';
import { carnetDepuisPhrase, domaineDuLienSeul, estDocCarnet, estLienSeul, filDe, lireCarnet, lireCarnets, lireMessage, prixLus, sansLiensNiPrix, statutDe, titreDePhrase } from '../../src/domain/carnets/modele';
import { creerCarnet } from '../../src/domain/carnets/operations';
import type { CreativeItem } from '../../src/types';

const F = fixtureCarnets();
const doc = (id: string) => F.find(i => i.id === id)!;

describe('modèle : lecture tolérante', () => {
  /* 11 messages : ZZ-MSG-V3 (G29, correction 1), puis ZZ-MSG-D1 et D2 du Densimètre (choix revu, état 29, correction 3). */
  it('la fixture se relit telle quelle (5 idées, 11 messages), titres « ZZ TEST — … »', () => {
    expect(lireCarnets(F).map(c => c.title)).toEqual([
      'ZZ TEST — Ventilation de la salle de brassage', 'ZZ TEST — Évier inox', 'ZZ TEST — Embouteillage', 'ZZ TEST — Frigo de garde pour fûts',
      'ZZ TEST — Densimètre de paillasse'
    ]);
    for (const c of lireCarnets(F)) expect(c).toEqual(doc(c.id));
    expect(F.filter(i => lireMessage(i))).toHaveLength(11);
    expect(lireCarnets(F).map(c => c.status)).toEqual(['research', 'idea', 'validated', 'validated', 'validated']);
  });

  it('état 29 (R34) : un carnet « ZZ TEST » au choix revu, l’ancien choix lisible ; titres stables du rejeu (TITRES_BANC)', () => {
    const titres = lireCarnets(F).map(c => c.title);
    for (const t of Object.values(TITRES_BANC)) expect(titres).toContain(t);
    const d = lireCarnets(F).find(c => c.title === TITRES_BANC.choixRevu)!;
    expect(d.id).toBe(ID_DENSIMETRE);
    const ch = d.carnet.choix!;
    expect(ch.remplaces).toHaveLength(1);
    const avant = ch.remplaces[0];
    expect(d.carnet.articles.find(a => a.id === avant.articleId)?.nom).toBe('Densimètre numérique portable');
    expect(avant.pourquoi).not.toBe('');
    expect(avant.le < ch.le).toBe(true);
    expect(d.carnet.sortie).toBeUndefined();
    /* le lien À venir du Frigo et le plan réalisé de l'Embouteillage restent */
    expect(lireCarnets(F).find(c => c.title === TITRES_BANC.lienAVenir)!.carnet.sortie?.planId).toBe('ZZ-PLAN-FRIGO');
    expect(lireCarnets(fixturePlanRealise().items).find(c => c.title === TITRES_BANC.planRealise)!.carnet.sortie?.planId).toBe('ZZ-PLAN-EMBOUTEILLAGE');
  });

  it('une forme inconnue rend null, sans casser', () => {
    const v = doc(ID_VENTILATION);
    expect(lireCarnet({ ...v, carnet: undefined })).toBeNull();
    expect(lireCarnet({ ...v, carnet: { ...v.carnet!, version: 2 as never } })).toBeNull();
    expect(lireCarnet({ ...v, carnet: { ...v.carnet!, articles: 'x' as never } })).toBeNull();
    expect(lireCarnet({ ...v, type: 'equipment' })).toBeNull();
    expect(lireMessage({ id: 'M', type: 'carnet-message', title: 'x', status: 'done' })).toBeNull();
    expect(lireCarnet(null)).toBeNull();
  });

  it('une entrée mal formée est retirée ; une valeur inconnue reste absente, jamais 0', () => {
    const v = doc(ID_VENTILATION);
    const brut = JSON.parse(JSON.stringify(v));
    brut.carnet.criteres.push({ id: '', texte: 'sans id' });
    brut.carnet.articles[0].valeurs.bruit = { valeur: null, origine: 'page' };
    brut.carnet.articles[0].valeurs.poids = { valeur: Number.NaN, origine: 'page' };
    brut.carnet.articles[0].prixCentimes = null;
    const c = lireCarnet(brut as CreativeItem)!;
    expect(c.carnet.criteres).toHaveLength(3);
    expect(c.carnet.articles[0].valeurs).not.toHaveProperty('bruit');
    expect(c.carnet.articles[0].valeurs).not.toHaveProperty('poids');
    expect(c.carnet.articles[0]).not.toHaveProperty('prixCentimes');
    /* listes absentes : vides (autre appareil, version plus ancienne) */
    const court = lireCarnet({ id: 'C', type: 'carnet', title: 'x', status: 'idea', carnet: { version: 1, creeLe: 'x', phrase: 'x' } as never })!;
    expect(court.carnet).toMatchObject({ criteres: [], facons: [], articles: [], notes: [], photos: [] });
  });

  it('estDocCarnet ; statut d’après le contenu ; titre tiré de la phrase', () => {
    expect(estDocCarnet(doc(ID_EVIER))).toBe(true);
    expect(estDocCarnet(doc('ZZ-MSG-V1'))).toBe(true);
    expect(estDocCarnet({ type: 'recipe-idea' })).toBe(false);
    expect(statutDe({ articles: [], choix: undefined })).toBe('idea');
    expect(statutDe(lireCarnet(doc(ID_VENTILATION))!.carnet)).toBe('research');
    expect(statutDe(lireCarnet(doc(ID_FRIGO))!.carnet)).toBe('validated');
    expect(titreDePhrase('\n  frigo de garde\npour fûts')).toBe('frigo de garde');
  });
});

describe('filDe (A12)', () => {
  it('ordre chronologique, tout le fil', () => {
    const fil = filDe(F, null);
    expect(fil).toHaveLength(11);
    const dates = fil.map(e => e.message.carnetMessage.le);
    expect([...dates].sort()).toEqual(dates);
    expect(fil[0].message.id).toBe('ZZ-MSG-F1');
    expect(fil.every(e => !e.carnetSupprime)).toBe(true);
  });
  it('filtre par carnet : écrits depuis lui ou rangés chez lui', () => {
    expect(filDe(F, ID_EMBOUTEILLAGE).map(e => e.message.id)).toEqual(['ZZ-MSG-B1', 'ZZ-MSG-B2', 'ZZ-MSG-B3']);
    expect(filDe(F, ID_EVIER).map(e => e.message.title)).toEqual(['2 bacs pour laver les fûts']);
  });
  it('les messages d’un carnet supprimé sont gardés et marqués', () => {
    const sansFrigo = F.filter(i => i.id !== ID_FRIGO);
    const fil = filDe(sansFrigo, ID_FRIGO, sansFrigo);
    expect(fil.map(e => [e.message.id, e.carnetSupprime])).toEqual([['ZZ-MSG-F1', true], ['ZZ-MSG-F2', true]]);
    const marque = F.map(i => (i.id === 'ZZ-MSG-V2' ? { ...i, carnetMessage: { ...i.carnetMessage!, effets: [{ ...i.carnetMessage!.effets[0], carnetSupprime: true as const }] } } : i));
    expect(filDe(marque, null).find(e => e.message.id === 'ZZ-MSG-V2')!.carnetSupprime).toBe(true);
  });
});

describe('P3 : un lien seul ne devient jamais le titre (g5:v03-10)', () => {
  it('le domaine remplace l’URL brute ; www., ponctuation finale, domaine nu à « / »', () => {
    expect(domaineDuLienSeul('https://www.exemple.invalid/hotte-inox-120?ref=1')).toBe('exemple.invalid');
    expect(domaineDuLienSeul('  http://brewshop.ch/hotte.  ')).toBe('brewshop.ch');
    expect(domaineDuLienSeul('www.inox-riviera.ch/evier-2-bacs')).toBe('inox-riviera.ch');
    expect(domaineDuLienSeul('inox-riviera.ch/evier-2-bacs')).toBe('inox-riviera.ch');
    expect(titreDePhrase('https://www.exemple.invalid/hotte-inox-120')).toBe('exemple.invalid');
    expect(titreDePhrase('https://exemple.invalid/a\nà comparer')).toBe('exemple.invalid');
  });
  it('une phrase, un mot, un lien entouré de texte : le titre reste la phrase', () => {
    for (const t of ['embouteillage', 'frigo de garde 2.5 °C', 'voir https://exemple.invalid/a', 'St.Gallen', 'v1.2', 'e.g.']) {
      expect(estLienSeul(t)).toBe(false);
    }
    /* P1 (vision 3) : un lien entouré de texte sort du titre ; la phrase reste */
    expect(titreDePhrase('voir https://exemple.invalid/a pour la hotte')).toBe('voir pour la hotte');
    expect(estLienSeul('https://exemple.invalid/a')).toBe(true);
  });
  it('carnetDepuisPhrase (R48) : la phrase reste gardée telle quelle, le titre est le domaine si ce n’est qu’un lien', () => {
    const c = carnetDepuisPhrase('https://www.exemple.invalid/doseur', { id: 'C-L', le: '2026-11-17T10:00:00.000Z' })!;
    expect(c.title).toBe('exemple.invalid');
    expect(c.carnet.phrase).toBe('https://www.exemple.invalid/doseur');
    expect(carnetDepuisPhrase('ZZ TEST — doseur de sucre', { id: 'C-T' })!.title).toBe('ZZ TEST — doseur de sucre');
  });
});

describe('P1 (vision 3, m390 07, 08, 18) : « votre phrase en titre » sans URL ni prix (R11, g5:v04-4)', () => {
  const PHRASE = 'https://exemple.test/ZZ-TEST-ventilo ZZ TEST — ventilateur 189,90 CHF';
  it('la phrase du banc : le titre garde ses mots, l’URL et le prix vont à l’article', () => {
    expect(titreDePhrase(PHRASE)).toBe('ZZ TEST — ventilateur');
  });
  it('les phrases de A4 : aucun titre ne garde un lien ni un prix ; les mots restent', () => {
    const cas: [string, string][] = [
      ['https://exemple.invalid/iso-4 Isobarique 4 becs 11\'700.–', 'Isobarique 4 becs'],
      ['Isobarique 2 becs de table CHF 1\'850.- chez Enotecnica', 'Isobarique 2 becs de table chez Enotecnica'],
      ['monobloc 6 becs vu à 21 500 CHF, trop cher', 'monobloc 6 becs vu, trop cher'],
      ['remplisseuse manuelle 190 € sur brauladen.de/remplisseuse', 'remplisseuse manuelle'],
      ['chambre froide 2 m³ à 4\'900.– chez Froid Léman', 'chambre froide 2 m³ chez Froid Léman'],
      ['vitrine 700 L d’occasion Fr. 650.-', 'vitrine 700 L d’occasion'],
      ['extracteur mural https://exemple.invalid/v3.', 'extracteur mural'],
      ['évier sur pieds (gastro-inox.de/spuele) 890 €', 'évier sur pieds'],
      ['douchette à 45.50 CHF', 'douchette'],
      ['commander 2 fûts de 20 L à 85 CHF pièce', 'commander 2 fûts de 20 L'],
      ['lien : https://exemple.invalid/f1?ref=12, prix 4 900 CHF', 'lien'],
      ['hotte inox 120 cm, 1800 m³/h, 2\'600 CHF', 'hotte inox 120 cm, 1800 m³/h'],
      ['frigo de garde 2.5 °C', 'frigo de garde 2.5 °C'],
      ['tient 80 °C ?', 'tient 80 °C ?']
    ];
    for (const [phrase, titre] of cas) expect([phrase, titreDePhrase(phrase)]).toEqual([phrase, titre]);
  });
  it('prixLus : une devise collée à la fin d’un mot (« ventilat-eur ») n’est pas lue ; le prix est le nombre et sa devise qui suit', () => {
    expect(prixLus('ventilateur 189,90 CHF').map(p => [p.centimes, p.devise])).toEqual([[18990, 'CHF']]);
    expect(prixLus('moteur 190')).toEqual([]);
    expect(prixLus('remplisseuse 190 €').map(p => [p.centimes, p.devise])).toEqual([[19000, 'EUR']]);
    expect(prixLus('CHF 690.- la pompe').map(p => [p.centimes, p.devise])).toEqual([[69000, 'CHF']]);
  });
  it('rien qu’un lien et un prix : le domaine (préfixe « ZZ TEST — » gardé) ; rien qu’un prix : la ligne telle quelle', () => {
    expect(titreDePhrase('https://exemple.test/zz-test-pompe 690 CHF')).toBe('exemple.test');
    expect(titreDePhrase('ZZ TEST — https://exemple.test/zz-test-pompe 690 CHF')).toBe('ZZ TEST — exemple.test');
    expect(titreDePhrase('190 CHF')).toBe('190 CHF');
    expect(titreDePhrase('inox-riviera.ch')).toBe('inox-riviera.ch');
    expect(sansLiensNiPrix('')).toBe('');
  });
  it('le carnet neuf (operations) : titre propre, `carnet.phrase` entière et citée, même avec un titre proposé qui porte l’URL', () => {
    const message = { id: 'M-P1', texte: PHRASE, le: '2026-11-18T08:00:00.000Z', depuis: 'liste' as const, rangement: 'locale' as const };
    for (const titre of [undefined, PHRASE]) {
      const r = creerCarnet([], { id: 'C-P1', ...(titre ? { titre } : {}), message });
      if (!r.ok) throw new Error(r.raison);
      const c = lireCarnets(r.ecritures.flatMap(e => (e.op === 'put' ? [e.doc] : [])))[0];
      expect(c.title).toBe('ZZ TEST — ventilateur');
      expect(c.carnet.phrase).toBe(PHRASE);
    }
  });
});
