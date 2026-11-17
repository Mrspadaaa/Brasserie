import { describe, expect, it } from 'vitest';
import { fixtureCarnets, ID_EMBOUTEILLAGE, ID_EVIER, ID_FRIGO, ID_VENTILATION } from '../../src/domain/carnets/fixture';
import { estDocCarnet, filDe, lireCarnet, lireCarnets, lireMessage, statutDe, titreDePhrase } from '../../src/domain/carnets/modele';
import type { CreativeItem } from '../../src/types';

const F = fixtureCarnets();
const doc = (id: string) => F.find(i => i.id === id)!;

describe('modèle : lecture tolérante', () => {
  it('la fixture se relit telle quelle (4 idées, 8 messages), titres « ZZ TEST — … »', () => {
    expect(lireCarnets(F).map(c => c.title)).toEqual([
      'ZZ TEST — Ventilation de la salle de brassage', 'ZZ TEST — Évier inox', 'ZZ TEST — Embouteillage', 'ZZ TEST — Frigo de garde pour fûts'
    ]);
    for (const c of lireCarnets(F)) expect(c).toEqual(doc(c.id));
    expect(F.filter(i => lireMessage(i))).toHaveLength(8);
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
    expect(fil).toHaveLength(8);
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
