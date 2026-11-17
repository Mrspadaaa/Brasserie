// @vitest-environment node
import { readFileSync } from 'node:fs';
import { afterAll, describe, expect, it, vi } from 'vitest';

const passerelle = vi.hoisted(() => ({ call: vi.fn() }));
vi.mock('firebase/functions', () => ({ httpsCallable: () => passerelle.call }));
vi.mock('../../src/services/firebase', () => ({ functions: {} }));
import { AiClient } from '../../src/services/aiClient';
import {
  CARNETS_MAX, LIGNES_MAX, RANGER_CARNET, RANGER_CARNET_SCHEMA, SORTES_CARNET, assainirRangerCarnet, contexteRangerCarnet
} from '../../functions/src/carnetIA';

const espion = vi.spyOn(AiClient, 'run');
afterAll(() => { expect(espion).toHaveBeenCalledTimes(0); expect(passerelle.call).toHaveBeenCalledTimes(0); });

describe('rangerCarnet : schéma et consigne', () => {
  it('le schéma impose les sortes, les genres, le sens et les champs des aides', () => {
    const items = (RANGER_CARNET_SCHEMA as any).properties.lignes.items;
    expect(items.required).toEqual(['sorte', 'texte']);
    expect(items.properties.sorte.enum).toEqual([...SORTES_CARNET]);
    expect(items.properties.genre.enum).toEqual(['a-acheter', 'a-faire', 'question', 'conseil', 'note']);
    expect(items.properties.caracteristique.properties.sens.enum).toEqual(['plus', 'moins', 'oui-non', 'texte']);
    for (const c of ['doublonDe', 'commeCritere', 'regrouperAvec', 'consequence', 'titrePropose', 'vendeur', 'carnetNeuf', 'raisonCarnet'])
      expect(items.properties, c).toHaveProperty(c);
    expect(RANGER_CARNET.defaultTier).toBe('fast');
    expect(RANGER_CARNET.acceptsFile).toBe(false);
  });

  it('la consigne dit : 12 lignes, achats en tête, rien d\'inventé ; aucun gabarit par objet (C2)', () => {
    expect(RANGER_CARNET.system).toContain(`au plus ${LIGNES_MAX}`);
    expect(RANGER_CARNET.system).toContain("d'abord ce qu'il faut acheter");
    expect(RANGER_CARNET.system).toContain('jamais 0');
    expect(RANGER_CARNET.system).not.toMatch(/frigo|évier|evier|ventil|hotte|pompe|embouteill/i);
  });
});

describe('assainirRangerCarnet : la forme seulement', () => {
  it('une forme fausse rend des lignes vides', () => {
    for (const d of [null, undefined, 'x', { effets: [] }, { lignes: 'non' }]) expect(assainirRangerCarnet(d)).toEqual({ lignes: [] });
  });

  it('coupe à 12, retire sorte inconnue, texte vide, genre faux, nombre nul et caractéristique sans sens', () => {
    const lignes = Array.from({ length: 15 }, (_, i) => ({ sorte: 'note', texte: `n${i}` }));
    expect(assainirRangerCarnet({ lignes }).lignes).toHaveLength(12);
    const r = assainirRangerCarnet({ lignes: [
      { sorte: 'tache', texte: 'x' },
      { sorte: 'note', texte: '   ' },
      { sorte: 'article', texte: ' Pompe ', genre: 'urgent', prix: 0, quantite: -2, url: ' https://a.ch/p ', caracteristique: { nom: 'débit', sens: 'beaucoup' }, commeCritere: 'oui', regrouperAvec: ['n1', 3, ''] },
      { sorte: 'critere', texte: 'Débit', prix: 690, caracteristique: { nom: 'débit', unite: 'm³/h', sens: 'plus' }, commeCritere: true }
    ] });
    expect(r.lignes).toEqual([
      { sorte: 'article', texte: 'Pompe', url: 'https://a.ch/p', regrouperAvec: ['n1'] },
      { sorte: 'critere', texte: 'Débit', prix: 690, caracteristique: { nom: 'débit', unite: 'm³/h', sens: 'plus' }, commeCritere: true }
    ]);
  });
});

describe('contexteRangerCarnet : le contexte compact', () => {
  const ok = { texte: 'pompe 40 L/min', saisie: '2026-11-17', depuis: null, carnets: [] };
  it('refuse un texte vide ou trop long, une date mal formée, un depuis non texte', () => {
    expect(contexteRangerCarnet(ok)).toEqual({ texte: 'pompe 40 L/min', saisie: '2026-11-17', depuis: null, carnets: [] });
    expect(contexteRangerCarnet({ ...ok, texte: ' ' })).toBeNull();
    expect(contexteRangerCarnet({ ...ok, texte: 'x'.repeat(4001) })).toBeNull();
    expect(contexteRangerCarnet({ ...ok, saisie: '17.11.2026' })).toBeNull();
    expect(contexteRangerCarnet({ ...ok, depuis: 3 })).toBeNull();
    expect(contexteRangerCarnet(null)).toBeNull();
  });

  it('30 carnets au plus, champs rognés, formes inconnues ignorées', () => {
    const carnets = Array.from({ length: 40 }, (_, i) => ({
      id: `c${i}`, titre: `ZZ TEST — idée ${i}`, criteres: [{ texte: 'débit', caracteristique: { nom: 'débit', unite: 'm³/h', sens: 'plus' } }, { texte: '' }],
      facons: [{ nom: 'Hotte' }, 'Mural'], articles: [{ nom: 'A', valeurs: { débit: 300, objet: { x: 1 } } }, { prix: 3 }],
      notes: [{ id: 'n1', texte: 'note' }, { texte: 'sans id' }], inconnu: 'ignoré'
    }));
    const c = contexteRangerCarnet({ ...ok, carnets, pages: [{ url: 'https://a.ch/p', domaine: 'a.ch', prix: 0, nom: 'P' }] })!;
    expect(c.carnets).toHaveLength(CARNETS_MAX);
    expect(c.carnets[0]).toEqual({
      id: 'c0', titre: 'ZZ TEST — idée 0', criteres: [{ texte: 'débit', caracteristique: { nom: 'débit', unite: 'm³/h', sens: 'plus' } }],
      facons: ['Hotte', 'Mural'], articles: [{ nom: 'A', valeurs: { débit: '300' } }], notes: [{ id: 'n1', texte: 'note' }]
    });
    expect(c.pages).toEqual([{ url: 'https://a.ch/p', domaine: 'a.ch', nom: 'P' }]);
  });
});

describe('branchement dans aiTask (B8)', () => {
  const ai = readFileSync(new URL('../../functions/src/ai.ts', import.meta.url), 'utf8');
  it('les deux tâches passent par aiTask, comme rangerNote', () => {
    expect(ai).toContain("from './carnetIA.js'");
    expect(ai).toContain("from './lireLien.js'");
    expect(ai).toMatch(/\(task as string\) === 'lireLien'/);
    expect(ai).toMatch(/\(task as string\) === 'rangerCarnet'/);
    expect(ai).toContain('if (rangerCarnet) data = assainirRangerCarnet(data);');
    expect(ai).toMatch(/export const aiTask = onCall/);
  });
});
