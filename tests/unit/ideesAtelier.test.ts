import { describe, expect, it } from 'vitest';
import type { CreativeItem } from '../../src/types';
import { avecChamp, nouvelleIdee, recetteDeLIdee, repartir, type IdeeBiere } from '../../src/domain/atelier/ideesBieres';
import { auLitre, avecPrix, formatDe, FORMATS_PRIX, nouvelleIdeePrix, pousser, titreIdee } from '../../src/domain/atelier/ideesPrix';

const idee = (id: string, title: string): CreativeItem => ({ id, type: 'recipe-idea', title, status: 'idea' });
const fut = FORMATS_PRIX.find((f) => f.id === 'fut')!;

describe('idées de bière (kb3)', () => {
  it('une idée est « En recette » quand une recette porte son nom (accents, casse et espaces ignorés), sinon « À essayer »', () => {
    const recettes = [{ id: 'R1', name: "Bière d'hiver  pain d'épices" }];
    const p = repartir([idee('a', "biere d'hiver pain d'epices"), idee('b', 'NEIPA Motueka'), idee('c', '  ')], recettes);
    expect(p.recette.map((i) => i.id)).toEqual(['a']);
    expect(p.essayer.map((i) => i.id)).toEqual(['b', 'c']);
    expect(recetteDeLIdee(idee('c', ''), recettes)).toBeUndefined();
  });
  it('une idée neuve exige un titre ; style et couleur absents restent absents (ni texte vide, ni valeur par défaut)', () => {
    expect(nouvelleIdee('   ', 'IPA', 'brun', 'CR-1')).toBeNull();
    const i = nouvelleIdee(' Pils fumée ', '', undefined, 'CR-1') as IdeeBiere;
    expect(i).toEqual({ id: 'CR-1', type: 'recipe-idea', title: 'Pils fumée', status: 'idea' });
    expect('style' in i || 'couleur' in i).toBe(false);
  });
  it('un champ vidé est retiré de l’idée ; un champ choisi est écrit sans toucher aux autres', () => {
    const base = { ...idee('a', 'X'), style: 'Dubbel', couleur: 'brun' } as IdeeBiere;
    expect(avecChamp(base, 'couleur', '')).toEqual({ id: 'a', type: 'recipe-idea', title: 'X', status: 'idea', style: 'Dubbel' });
    expect((avecChamp(base, 'saison', 'automne') as IdeeBiere)).toMatchObject({ style: 'Dubbel', couleur: 'brun', saison: 'automne' });
    expect('style' in avecChamp(base, 'style', '   ')).toBe(false);
  });
});

describe('idées de prix (kb3)', () => {
  it('le litre : 140 CHF le fût de 20 L = 7,00 ; sans prix ou sans format, il n’existe pas (jamais 0)', () => {
    expect(auLitre(140, fut)).toBe(7);
    expect(auLitre(undefined, fut)).toBeNull();
    expect(auLitre(140, undefined)).toBeNull();
    expect(auLitre(0, fut)).toBeNull();
    expect(auLitre(48, FORMATS_PRIX.find((f) => f.id === 'carton'))).toBe(12.12);
  });
  it('le − et le + vont de 5 CHF pour un fût, ne descendent pas sous un pas, et un prix absent n’est jamais 0', () => {
    expect(pousser(140, fut, 1)).toBe(145);
    expect(pousser(140, fut, -1)).toBe(135);
    expect(pousser(3, fut, -1)).toBe(5);
    expect(pousser(undefined, fut, -1)).toBeUndefined();
    expect(pousser(undefined, fut, 1)).toBe(5);
    expect(pousser(6, FORMATS_PRIX.find((f) => f.id === 'verre'), 1)).toBe(6.5);
  });
  it('une idée neuve : le format suffit ; le titre suit le format et le client tant qu’il en vient', () => {
    expect(nouvelleIdeePrix(undefined, undefined, '', 'CR-2')).toBeNull();
    const i = nouvelleIdeePrix('fut', 140, 'Bistrot Démo', 'CR-2')!;
    expect(i).toMatchObject({ type: 'pricing-test', title: 'Fût 20 L pour Bistrot Démo', targetPrice: 140, contactName: 'Bistrot Démo' });
    expect(formatDe(i)?.id).toBe('fut');
    const j = avecPrix(i, { format: 'carton' });
    expect(titreIdee(j)).toBe('Carton 12 × 33 cl pour Bistrot Démo');
    expect(j.title).toBe('Carton 12 × 33 cl pour Bistrot Démo');
    const sans = avecPrix(i, { targetPrice: undefined, contactName: '' });
    expect('targetPrice' in sans || 'contactName' in sans).toBe(false);
  });
  it('un titre écrit à la main n’est pas réécrit ; une ancienne idée sans format garde son titre', () => {
    const vieux: CreativeItem = { id: 'v', type: 'pricing-test', title: 'Tarif de Noël', status: 'idea', targetPrice: 6 };
    expect(titreIdee(vieux)).toBe('Tarif de Noël');
    expect(avecPrix(vieux, { format: 'verre' }).title).toBe('Tarif de Noël');
    expect(auLitre(vieux.targetPrice, formatDe(vieux))).toBeNull();
  });
});
