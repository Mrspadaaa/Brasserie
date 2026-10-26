// Voie c3e (#180) : liste variétale slovène (IHPS), lecteur sur une ligne synthétique et sur le fichier versionné.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TRANSCRIPTIONS, fichesIhps, ligneDeSorte } from '../../../scripts/collecte-hop/ihps.mjs';

const colonnes = ['sorta', 'registrska', 'zlahtnitelj', 'datumVpisa', 'razvrstitev', 'casRezi', 'casZrelosti', 'zacetek', 'trajanje', 'alfa', 'olje', 'pridelek', 'pageImprimee'];
const ligne = ['Exemplum *', 'HUL999', '120', '1. 2. 2017', 'aroma', '1. 4. - 5. 4. ***', 'srednje pozna', '28. 8. - 2. 9.', '/', '4,0–6,0', '/', '2000–2500', 21];

describe('liste variétale IHPS', () => {
  it('lit une ligne : plages à virgule décimale, base matière sèche, étoiles, inconnu absent (jamais 0)', () => {
    const r = ligneDeSorte(colonnes, ligne, ['nizka', 'srednja', 'visoka', '/', '/', 'srednja', 'visoka (a)']);
    expect(r.nom).toBe('Exemplum');
    expect(r.champs.alpha).toMatchObject({ min: 4, max: 6, unite: '%', transcrit: 'lecture visuelle', page: 21 });
    expect(r.champs.alpha.base).toMatch(/Matière sèche/);
    expect(r.champs.rendement).toMatchObject({ min: 2000, max: 2500, unite: 'kg/ha' });
    expect(r.champs.huileTotale).toBeUndefined();   // « / » = pas de donnée
    expect(r.extra).toMatchObject({ horsProduction: true, periodeTailleIndicative: true });
    expect(r.extra.resistances).toMatchObject({ peronosporaPrimaire: 'nizka', verticilijaBlaga: '/', cbcvd: 'visoka (a)', page: 22 });
    expect(r.listes.periodeTaille).toEqual(['1. 4. - 5. 4.']);
    expect(r.listes.maturite).toEqual(['srednje pozna', 'début 28. 8. - 2. 9.']);
  });
  it('une fiche par sorte avec le reçu du cache', async () => {
    const doc = { pdf: 'https://www.gov.si/x.pdf', page_ihps: 'https://www.ihps.si/x/', publie: '2021', colonnes, lignes: [ligne], resistance: {} };
    const f = await fichesIhps(doc, async () => ({ releve: '2026-10-26', sha256: 'abc' }));
    expect(f).toHaveLength(1);
    expect(f[0]).toMatchObject({ nom: 'Exemplum', publie: '2021', releve: '2026-10-26', sha256Pdf: 'abc' });
  });
  it('le fichier versionné : 23 sorties, 23 lignes de résistance, plages ordonnées', () => {
    const doc = JSON.parse(readFileSync(TRANSCRIPTIONS, 'utf8'));
    expect(doc.lignes).toHaveLength(23);
    expect(Object.keys(doc.resistance)).toHaveLength(23);
    for (const l of doc.lignes) {
      const { champs } = ligneDeSorte(doc.colonnes, l, null);
      for (const v of Object.values(champs) as any[]) { expect(v.min).toBeLessThanOrEqual(v.max); expect(v.min).toBeGreaterThan(0); }
      expect(champs.alpha).toBeDefined();
    }
  });
});
