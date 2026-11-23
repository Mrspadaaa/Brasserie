// Voie c3c (#180) : lecteur NZ Hops sur du HTML synthétique.
// Voie c3e : transcriptions des fiches PDF (lecture visuelle), sur des entrées synthétiques et sur le fichier versionné.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TRANSCRIPTIONS, champsDeTranscription, fichesDesPdf, lireProduitNz, valeurTranscrite } from '../../../scripts/collecte-hop/nzhops.mjs';

const page = (corps: string[]) => `<html><body>${corps.map(x => `<div>${x}</div>`).join('')}<a href="https://cdn.shopify.com/s/files/x/Exemplum_Variety_Sheet_English.pdf?v=1">fiche</a></body></html>`;

describe('lecteur NZ Hops', () => {
  it('lit le nom, l’α en plage, l’accroche courte et les années de récolte', () => {
    const p = lireProduitNz(page(['Exemplum™', '(5.5-10% AA)', 'Un houblon d’arôme citronné.', 'Crop Year', '2019', '2020', '2019', 'Pack', '1 kg']))!;
    expect(p.nom).toBe('Exemplum');
    expect(p.alpha).toMatchObject({ min: 5.5, max: 10, unite: '%' });
    expect(p.accroche).toBe('Un houblon d’arôme citronné.');
    expect(p.recoltes).toEqual(['2019', '2020']);
    expect(p.pdfs).toHaveLength(1);
  });
  it('un produit sans « % AA » (levure, etc.) rend null', () => {
    expect(lireProduitNz(page(['Levure sèche', 'Fermentis']))).toBeNull();
  });
});

describe('transcriptions des fiches PDF (lecture visuelle)', () => {
  it('une plage « Tech Specs » : min, max, unité, base implicite, mention de lecture et page', () => {
    const { cle, valeur } = valeurTranscrite({ libelle: 'Linalool', plage: '0.6-1.2%', page: 1 });
    expect(cle).toBe('linalol');
    expect(valeur).toMatchObject({ champ: 'Linalool', brut: '0.6-1.2%', min: 0.6, max: 1.2, unite: '%', base: null, baseImplicite: "% de l'huile", transcrit: 'lecture visuelle', page: 1 });
  });
  it('l’huile totale garde mL/100 g ; une valeur seule reste une valeur (pas une plage)', () => {
    expect(valeurTranscrite({ libelle: 'Total Oil', plage: '1.25-2 mL/100g', page: 1 }).valeur).toMatchObject({ min: 1.25, max: 2, unite: 'mL/100 g' });
    expect(valeurTranscrite({ libelle: 'Farnesene', plage: '5.8%', page: 1 }).valeur).toMatchObject({ valeur: 5.8, min: null, max: null });
  });
  it('colonnes Mean / Range : moyenne à part, plage en min/max, « .35-.6 » lu 0,35-0,6', () => {
    const { valeur } = valeurTranscrite({ libelle: 'Linalool', plage: '.35-.6', moyenne: '0.4', page: 2 });
    expect(valeur).toMatchObject({ min: 0.35, max: 0.6, valeur: null, moyenne: 0.4, brut: 'Mean 0.4 ; Range .35-.6' });
    expect(valeur.incoherence).toBeUndefined();
  });
  it('une moyenne hors plage est signalée, jamais corrigée', () => {
    const { valeur } = valeurTranscrite({ libelle: 'Linalool', plage: '0.4-0.7', moyenne: '0.8', page: 2 });
    expect(valeur).toMatchObject({ moyenne: 0.8, min: 0.4, max: 0.7, incoherence: 'moyenne hors de la plage imprimée' });
  });
  it('un rapport n’a pas d’unité ; les groupes de composés ont leur clé', () => {
    expect(valeurTranscrite({ libelle: 'Alpha Ratio', plage: '.6-.68', moyenne: '.66', page: 2 })).toMatchObject({ cle: 'rapportAlpha', valeur: { unite: null, min: 0.6, max: 0.68 } });
    expect(valeurTranscrite({ libelle: 'Citrus-piney products', plage: '6-10.0', moyenne: '8.3', page: 2 }).cle).toBe('produitsAgrumesResineux');
    expect(valeurTranscrite({ libelle: 'Total oils (mls/100g)', plage: '1.2-2', moyenne: '1.3', page: 2 }).valeur.unite).toBe('mL/100 g');
  });
  it('une entrée complète rend ses champs et ses listes (accroche courte comprise)', () => {
    const e = { nom: 'Exemplum', pdf: 'https://cdn.shopify.com/x.pdf', page: 1, format: 'tech', profilCourt: 'Un houblon.', tech: { 'Alpha Acids': '5-6%', Geraniol: '1-1.2%' }, listes: { lignee: ['Fuggle'] } };
    const { champs, listes } = champsDeTranscription(e);
    expect(Object.keys(champs)).toEqual(['alpha', 'geraniol']);
    expect(listes).toEqual({ profilCourt: ['Un houblon.'], lignee: ['Fuggle'] });
  });
  it('une fiche-pdf par entrée, avec le reçu du cache ; deux PDF « identiques » qui diffèrent font échouer', async () => {
    const doc = { fiches: [{ nom: 'Exemplum', pdf: 'https://cdn.shopify.com/a.pdf', pdfIdentiques: ['https://cdn.shopify.com/b.pdf'], page: 1, format: 'tech', tech: { 'Alpha Acids': '5-6%' } }] };
    const fiches = await fichesDesPdf(doc, async () => ({ releve: '2026-10-26', sha256: 'abc' }));
    expect(fiches).toHaveLength(1);
    expect(fiches[0]).toMatchObject({ page: 'fiche-pdf', transcrit: 'lecture visuelle', releve: '2026-10-26', sha256Pdf: 'abc', url: 'https://cdn.shopify.com/a.pdf' });
    await expect(fichesDesPdf(doc, async u => ({ releve: '2026-10-26', sha256: u.endsWith('b.pdf') ? 'autre' : 'abc' }))).rejects.toThrow(/identique/);
  });
  it('le fichier versionné : 20 fiches, chaque valeur lue porte sa page et jamais un 0 à la place d’un inconnu', () => {
    const doc = JSON.parse(readFileSync(TRANSCRIPTIONS, 'utf8'));
    expect(doc.fiches).toHaveLength(20);
    for (const e of doc.fiches) {
      const { champs } = champsDeTranscription(e);
      expect(Object.keys(champs).length).toBeGreaterThanOrEqual(10);
      for (const v of Object.values(champs) as any[]) {
        expect(v.transcrit).toBe('lecture visuelle');
        expect([1, 2]).toContain(v.page);
        if (v.min != null && v.max != null) expect(v.min).toBeLessThanOrEqual(v.max);
        expect([v.valeur, v.min, v.max].some(x => x != null && x > 0)).toBe(true);
      }
    }
    const riwaka = champsDeTranscription(doc.fiches.find((e: any) => e.nom === 'Riwaka')).champs as any;
    expect(riwaka.geraniol).toMatchObject({ min: 1.5, max: 2.5 });
    expect(riwaka.linalol).toMatchObject({ min: 0.6, max: 1.2 });
    const nelson = champsDeTranscription(doc.fiches.find((e: any) => e.nom === 'Nelson Sauvin')).champs as any;
    expect(nelson.betaPinene).toBeUndefined();   // non publié sur cette fiche : absent, pas 0
  });
});
