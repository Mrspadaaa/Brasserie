import { describe, expect, it } from 'vitest';
import { fixtureCarnets, ID_EMBOUTEILLAGE, ID_EVIER, ID_FRIGO, ID_VENTILATION } from '../../src/domain/carnets/fixture';
import { carnetDepuisPhrase, domaineDuLienSeul, estDocCarnet, estLienSeul, filDe, lireCarnet, lireCarnets, lireMessage, statutDe, titreDePhrase } from '../../src/domain/carnets/modele';
import type { CreativeItem } from '../../src/types';

const F = fixtureCarnets();
const doc = (id: string) => F.find(i => i.id === id)!;

describe('modèle : lecture tolérante', () => {
  /* 9 messages : la fixture a reçu ZZ-MSG-V3 (G29, titre proposé pour Ventilation), ajouté par un autre lot de la correction 1. */
  it('la fixture se relit telle quelle (4 idées, 9 messages), titres « ZZ TEST — … »', () => {
    expect(lireCarnets(F).map(c => c.title)).toEqual([
      'ZZ TEST — Ventilation de la salle de brassage', 'ZZ TEST — Évier inox', 'ZZ TEST — Embouteillage', 'ZZ TEST — Frigo de garde pour fûts'
    ]);
    for (const c of lireCarnets(F)) expect(c).toEqual(doc(c.id));
    expect(F.filter(i => lireMessage(i))).toHaveLength(9);
    expect(lireCarnets(F).map(c => c.status)).toEqual(['research', 'idea', 'validated', 'validated']);
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
    expect(fil).toHaveLength(9);
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
    expect(titreDePhrase('voir https://exemple.invalid/a pour la hotte')).toBe('voir https://exemple.invalid/a pour la hotte');
    expect(estLienSeul('https://exemple.invalid/a')).toBe(true);
  });
  it('carnetDepuisPhrase (R48) : la phrase reste gardée telle quelle, le titre est le domaine si ce n’est qu’un lien', () => {
    const c = carnetDepuisPhrase('https://www.exemple.invalid/doseur', { id: 'C-L', le: '2026-11-17T10:00:00.000Z' })!;
    expect(c.title).toBe('exemple.invalid');
    expect(c.carnet.phrase).toBe('https://www.exemple.invalid/doseur');
    expect(carnetDepuisPhrase('ZZ TEST — doseur de sucre', { id: 'C-T' })!.title).toBe('ZZ TEST — doseur de sucre');
  });
});
