/**
 * D451, voie domaine, commit 1 « passe-plat » (PLAN § Risques 1) : le lecteur tolérant garde les clés qu'il ne connaît pas. Un appareil resté
 * sur l'ancienne version relit un carnet écrit par la nouvelle, le réécrit par une intention, et n'efface rien. Données : exemples « ZZ TEST — ».
 */
import { describe, expect, it } from 'vitest';
import type { CreativeItem } from '../../src/types';
import { lireCarnet, lireDonneesCarnet, lireMessage } from '../../src/domain/carnets/modele';
import { appliquerEcritures, garderAPart, poserDomaine, renommer, choisir, modifierLigne, supprimerLigne } from '../../src/domain/carnets/operations';

const avenir = (v: unknown): unknown => ({ futur: true, n: 3, liste: [1, 'deux'], imbrique: { a: { b: v } } });

function carnetFutur(): CreativeItem {
  return {
    id: 'ZZ-PP-1', type: 'carnet', title: 'ZZ TEST — Passe-plat', status: 'research',
    carnet: {
      version: 1, creeLe: '2026-11-20T08:00:00.000Z', phrase: 'exemple', cleCarnet: avenir('carnet'),
      criteres: [{ id: 'K1', texte: 'tient 80 °C', origine: 'vous', cleCritere: avenir('critere'), caracteristique: { nom: 'température', unite: '°C', sens: 'plus', cleCarac: 1 } }],
      facons: [{ id: 'F1', nom: 'Façon A', etat: 'ouverte', origine: 'vous', cleFacon: avenir('facon') }, { id: 'F2', nom: 'Façon B', etat: 'ouverte', origine: 'vous' }],
      articles: [{ id: 'A1', nom: 'Article A', prixCentimes: 1000, devise: 'CHF', lecture: 'lue', valeurs: { poids: { valeur: 3, unite: 'kg', origine: 'exemple', cleValeur: avenir('valeur') } }, veille: { active: true, depuis: '2026-11-21T08:00:00.000Z', cleVeille: 1 }, cleArticle: avenir('article') },
        { id: 'A2', nom: 'Article B', prixCentimes: 1200, devise: 'CHF', lecture: 'lue', valeurs: {} }],
      notes: [{ id: 'N1', texte: 'une note', genre: 'note', cleNote: avenir('note') }],
      photos: [{ id: 'P1', jpeg: 'data:image/jpeg;base64,AAAA', clePhoto: avenir('photo') }],
      suiviFutur: { etat: 'cherche', evenements: [{ id: 'E1', le: '2026-11-22T08:00:00.000Z' }] }
    }
  } as unknown as CreativeItem;
}

function messageFutur(): CreativeItem {
  return {
    id: 'ZZ-PP-M1', type: 'carnet-message', title: 'exemple', status: 'done',
    carnetMessage: {
      texte: 'exemple', le: '2026-11-22T09:00:00.000Z', depuis: 'ZZ-PP-1', rangement: 'simulee', cleMessage: avenir('message'),
      effets: [{ carnetId: 'ZZ-PP-1', cible: 'note', id: 'N1', cleEffet: avenir('effet') }],
      titrePropose: { carnetId: 'ZZ-PP-1', titre: 'ZZ TEST — Autre', cleTitre: 1 },
      propositions: [{ carnetId: 'ZZ-PP-1', texte: 'le débit', origine: 'ia', cleProposition: avenir('proposition') }],
      etiquettesFutures: [{ sorte: 'cout', carnetId: 'ZZ-PP-1' }]
    }
  } as unknown as CreativeItem;
}

/** Le document tel que Firestore le rendrait après un aller-retour JSON. */
const apresJson = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

type Brut = Record<string, unknown>;

describe('D451 passe-plat : le lecteur garde les clés inconnues', () => {
  it('lireDonneesCarnet garde les clés du carnet et de ses lignes (critère, façon, article, note, photo, valeur, veille)', () => {
    const d = lireDonneesCarnet(carnetFutur().carnet) as unknown as Brut & { criteres: Brut[]; facons: Brut[]; articles: Brut[]; notes: Brut[]; photos: Brut[] };
    expect(d.cleCarnet).toEqual(avenir('carnet'));
    expect(d.suiviFutur).toEqual({ etat: 'cherche', evenements: [{ id: 'E1', le: '2026-11-22T08:00:00.000Z' }] });
    expect(d.criteres[0].cleCritere).toEqual(avenir('critere'));
    expect((d.criteres[0].caracteristique as Brut).cleCarac).toBe(1);
    expect(d.facons[0].cleFacon).toEqual(avenir('facon'));
    expect(d.articles[0].cleArticle).toEqual(avenir('article'));
    expect(((d.articles[0].valeurs as Record<string, Brut>).poids).cleValeur).toEqual(avenir('valeur'));
    expect((d.articles[0].veille as Brut).cleVeille).toBe(1);
    expect(d.notes[0].cleNote).toEqual(avenir('note'));
    expect(d.photos[0].clePhoto).toEqual(avenir('photo'));
  });

  it('lireMessage garde les clés du message, de son effet, de son titre proposé et de sa proposition', () => {
    const m = lireMessage(messageFutur())!.carnetMessage as unknown as Brut & { effets: Brut[]; titrePropose: Brut; propositions: Brut[] };
    expect(m.cleMessage).toEqual(avenir('message'));
    expect(m.etiquettesFutures).toEqual([{ sorte: 'cout', carnetId: 'ZZ-PP-1' }]);
    expect(m.effets[0].cleEffet).toEqual(avenir('effet'));
    expect(m.titrePropose.cleTitre).toBe(1);
    expect(m.propositions[0].cleProposition).toEqual(avenir('proposition'));
  });

  it('lire → intention → écriture : un champ inconnu survit à une intention qui réécrit le carnet', () => {
    const etat = [apresJson(carnetFutur()), apresJson(messageFutur())];
    const intentions = [
      poserDomaine(etat, { carnetId: 'ZZ-PP-1', domaine: 'local' }),
      renommer(etat, { carnetId: 'ZZ-PP-1', titre: 'ZZ TEST — Renommé' }),
      choisir(etat, { carnetId: 'ZZ-PP-1', articleId: 'A1', faconId: 'F1', pourquoi: 'exemple', le: '2026-11-23T08:00:00.000Z' }),
      modifierLigne(etat, { carnetId: 'ZZ-PP-1', cible: 'note', id: 'N1', texte: 'une note, précisée', le: '2026-11-23T08:00:00.000Z' }),
      supprimerLigne(etat, { carnetId: 'ZZ-PP-1', cible: 'critere', id: 'K1' })
    ];
    for (const r of intentions) {
      expect(r.ok).toBe(true);
      if (!r.ok) continue;
      const apres = appliquerEcritures(etat, r.ecritures).find(d => d.id === 'ZZ-PP-1') as unknown as { carnet: Brut & { articles: Brut[]; facons: Brut[]; notes: Brut[]; photos: Brut[] } };
      const relu = apresJson(apres).carnet;
      expect(relu.cleCarnet).toEqual(avenir('carnet'));
      expect(relu.suiviFutur).toBeDefined();
      expect(relu.articles[0].cleArticle).toEqual(avenir('article'));
      expect(relu.facons[0].cleFacon).toEqual(avenir('facon'));
      expect(relu.notes[0].cleNote).toEqual(avenir('note'));
      expect(relu.photos[0].clePhoto).toEqual(avenir('photo'));
    }
  });

  it('lire → intention → écriture : un champ inconnu du message survit à « Garder à part »', () => {
    const etat = [apresJson(carnetFutur()), apresJson(messageFutur())];
    const r = garderAPart(etat, { messageId: 'ZZ-PP-M1' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const m = lireMessage(apresJson(appliquerEcritures(etat, r.ecritures).find(d => d.id === 'ZZ-PP-M1')!))!.carnetMessage as unknown as Brut & { effets: Brut[] };
    expect(m.gardeAPart).toBe(true);
    expect(m.cleMessage).toEqual(avenir('message'));
    expect(m.etiquettesFutures).toBeDefined();
    expect(m.effets[0].cleEffet).toEqual(avenir('effet'));
  });

  it('le comportement d’avant tient : une valeur mal formée d’une clé connue est écartée, une clé undefined n’est pas gardée', () => {
    const brut = { ...(carnetFutur().carnet as unknown as Brut), sortie: { planId: 3 }, archive: 'x', inconnueVide: undefined };
    const d = lireDonneesCarnet(brut) as unknown as Brut;
    expect(d.sortie).toBeUndefined();
    expect(d.archive).toBeUndefined();
    expect('inconnueVide' in d).toBe(false);
    expect(lireDonneesCarnet({ ...brut, version: 2 })).toBeNull();
  });

  it('lireCarnet : une idée sans clé inconnue se relit identique (aucune clé ajoutée)', () => {
    const item = { id: 'ZZ-PP-2', type: 'carnet', title: 'ZZ TEST — Simple', status: 'idea', carnet: { version: 1, creeLe: '2026-11-20T08:00:00.000Z', phrase: 'exemple', criteres: [], facons: [], articles: [], notes: [], photos: [] } } as unknown as CreativeItem;
    expect(lireCarnet(item)).toEqual(item);
  });
});
