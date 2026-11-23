import { beforeAll, describe, expect, it } from 'vitest';
/**
 * Voie f4-enrichir, E2 : le rapprochement d'un libellé de levure au catalogue du dépôt (PLAN § 3.4 bis, table des 11 cas), et les valeurs du
 * catalogue pour les 4 levures de la facture 372765 (même attendu que le témoin T1 : 4 trouvées, contre 1 par `resolveFermentationYeast`).
 */
import { ficheLevureDe, jetonsLevure } from '../../../../src/domain/stock/ficheLevure';
import { referencesLevures, valeursDeCatalogueLevure } from '../../../../src/services/enrichissementCatalogues';

import type { ReferenceLevure } from '../../../../src/domain/stock/ficheLevure';

let refs: ReferenceLevure[] = [];
beforeAll(async () => { refs = await referencesLevures(); });
const verdict = (libelle: string, r = refs) => { const f = ficheLevureDe(libelle, r); return { cas: f.cas, id: f.reference?.id, n: f.candidats.length }; };

describe('La table des 11 cas', () => {
  const table: Array<[string, string, string | undefined]> = [
    ['LALLEMAND Windsor 11g', 'sur', 'lalbrew-windsor'],
    ['Safale BE-256 (Abbaye) 11.5 g', 'sur', 'yeast-fermentis-safale-be-e2-80-91256'],
    ['Safale US-05 11,5g', 'sur', 'fermentis-us05'],
    ['LALLEMAND Verdant IPA 11g', 'sur', 'lalbrew-verdant-ipa'],
    ['Wyeast 3711 French Saison', 'sur', 'wyeast-3711'],
    ['Windsor', 'aControler', 'lalbrew-windsor'],
    ['Nottingham', 'aControler', 'lalbrew-nottingham'],
    ['S-04', 'aControler', 'yeast-fermentis-safale-s-e2-80-9104'],
    ['Fermentis Windsor', 'aucun', undefined],
    ['Levure Maison 42', 'aucun', undefined],
  ];
  for (const [libelle, cas, id] of table) it(`${libelle} → ${cas}${id ? ` ${id}` : ''}`, () => {
    expect(verdict(libelle)).toMatchObject({ cas, id });
  });
  it('un alias porté par deux références construites → ambigu, 2 candidats (« House Ale » en touche déjà une réelle : 3)', () => {
    const construites = [{ id: 'banc-a', name: 'Banc A', aliases: ['Ferment Commun du Banc'] }, { id: 'banc-b', name: 'Banc B', aliases: ['Ferment Commun du Banc'] }];
    expect(verdict('Ferment Commun du Banc', [...refs, ...construites])).toEqual({ cas: 'ambigu', id: undefined, n: 2 });
    expect(verdict('House Ale', [...refs, { id: 'banc-a', name: 'Banc A', aliases: ['House Ale'] }, { id: 'banc-b', name: 'Banc B', aliases: ['House Ale'] }]).cas).toBe('ambigu');
  });
});

describe('La normalisation, la même des deux côtés', () => {
  it('™ et ® retirés avant NFKD (jamais « windsortm »), poids d’emballage retirés, tirets Unicode ramenés', () => {
    expect(jetonsLevure('LalBrew Windsor™ 11 g').jetons).toEqual(['windsor']);
    expect(jetonsLevure('SafAle® S‑04 500g')).toMatchObject({ fabricant: 'fermentis', jetons: ['s-04'] });
    expect(jetonsLevure('Safale BE-256 (Abbaye) 11.5 g').codes).toContain('be256');
  });
});

describe('Les valeurs du catalogue pour les 4 levures de 372765', () => {
  for (const libelle of ['LALLEMAND Windsor 11g', 'Safale BE-256 (Abbaye) 11.5 g', 'Safale US-05 11,5g', 'LALLEMAND Verdant IPA 11g']) it(libelle, async () => {
    const f = ficheLevureDe(libelle, refs);
    expect(f.cas).toBe('sur');
    const v = (await valeursDeCatalogueLevure(f.reference!))!;
    expect(v).toBeDefined();
    expect(v.valeurs.yeastLab).toBeTruthy();
    expect(v.valeurs.technicalSource).toMatch(/^Catalogue des levures du dépôt — /);
    expect(v.source.trim()).not.toBe('');
    expect(Object.keys(v.valeurs)).not.toContain('yeastLot');
    expect(Object.keys(v.valeurs)).not.toContain('yeastNotes');
    expect(v.valeurs.yeastTempMinC !== undefined || v.valeurs.yeastTechnicalFacts !== undefined).toBe(true);
  });
});
