// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { lirePage } from '../../functions/src/lireLien';
import { RANGER_CARNET_SCHEMA, assainirRangerCarnet } from '../../functions/src/carnetIA';
import { lireReponse } from '../../src/domain/carnets/ia';

/*
 * Lien gastro-held.ch collé le 23.11 vers 12:40 dans Chambre froide : « Ça m'a fait n'importe quoi ».
 * Journal : `lireLien` lue en 1,3 s, puis `rangerCarnet` coupé au plafond (MAX_TOKENS, 3 985 jetons de sortie, 34 s). Rejoué 9 fois en
 * direct (journal ia-journal.jsonl) : le modèle écrit `sorte`, `texte`, `titre`, `url`, puis boucle dans `vendeur` (« GastroHeld GastroHeld… »).
 * Cause : le schéma n'a pas de `propertyOrdering` ; Gemini sort alors les champs requis puis les autres par ordre alphabétique : `carnetId`,
 * `prix`, `devise` viennent avant `url`, il les saute ; ce qu'il voulait encore dire tombe dans le dernier champ libre (`vendeur`, ou `url` sans `vendeur` :
 * « …&vendeur=GastroHeld&prix=1228.9&devise=CHF »). Avec l'ordre du schéma : réponse complète en 5 s, 508 jetons (STOP).
 */
const URL_COLLEE = 'https://www.gastro-held.ch/products/gastronomie-kuehlschrank-eco-1300-gn-21-monoblock-1350-liter-kuehlraumvolumen-6-verstellbare-einlegeboeden-robuste-bauweise-edelstahl-gnh1410tnm?gclsrc=aw.ds&gad_source=1&gad_campaignid=21268371086&gclid=CjwKCAiA5Y_YBhBbEiwAK5Dl7acLXIXCs076S_WqnMYrfNQ__wg8Qa38mWH9HbK9cmeBFiGKpM5RZRoCgfIQAvD_BwE';
const NOM = 'Gastronomie Kühlschrank ECO 1400 GN 2/1 Monoblock, 1350 Liter Kühlraumvolumen, 6 verstellbare Einlegeböden, Robuste Bauweise, Edelstahl';
const page = () => lirePage(readFileSync(new URL('../fixtures/carnets/gastro-held-kuehlschrank.html', import.meta.url), 'utf8'), new URL(URL_COLLEE), 0);

describe('gastro-held.ch (lien du 23.11)', () => {
  it('lit nom, prix CHF, stock, vendeur et la photo (ImageObject du JSON-LD, og:image en http refusé)', () => {
    const p = page();
    expect(p).toMatchObject({ statut: 'lue', nom: `GastroHero ${NOM}`, prix: 1228.9, devise: 'CHF', dispo: 'en-stock', vendeur: 'GastroHeld', domaine: 'gastro-held.ch' });
    expect(p.photo).toBe('https://www.gastro-held.ch/cdn/shop/files/224809-gnh1410tnm_2.webp?v=1769340166&width=1200');
  });

  it('impose au modèle l’ordre des champs du schéma, le rangement et le prix avant le vendeur', () => {
    const items = (RANGER_CARNET_SCHEMA.properties.lignes as { items: { properties: Record<string, unknown>; propertyOrdering?: string[] } }).items;
    expect(items.propertyOrdering).toEqual(Object.keys(items.properties));
    const ordre = items.propertyOrdering!;
    expect(ordre[0]).toBe('sorte');
    for (const [a, b] of [['carnetId', 'url'], ['url', 'prix'], ['prix', 'devise'], ['devise', 'vendeur']]) expect(ordre.indexOf(a)).toBeLessThan(ordre.indexOf(b));
  });

  it('la réponse réelle obtenue avec cet ordre donne l’article complet', () => {
    const brut = JSON.parse(readFileSync(new URL('../fixtures/carnets/gastro-held-reponse-ordonnee.json', import.meta.url), 'utf8'));
    const ouvert = { id: 'CARNET-a803e02f-e8c4-4119-8ef2-d3ff0ae803af', titre: 'Chambre froide' };
    const lignes = lireReponse(brut, { texte: URL_COLLEE, carnets: [ouvert, { id: 'CARNET-PLANNING-T-13', titre: 'Frigo + congel' }], depuis: ouvert.id, pages: [page()] });
    expect(lignes).toHaveLength(1);
    expect(lignes![0]).toMatchObject({ sorte: 'article', url: URL_COLLEE, prixCentimes: 122890, devise: 'CHF', vendeur: 'GastroHeld', carnetId: ouvert.id });
    expect(lignes![0].page?.photo).toMatch(/^https:\/\/www\.gastro-held\.ch\/cdn\/shop\/files\/224809-gnh1410tnm_2\.webp/);
  });

  /* Rejeu en ligne après 24099a754 : la garde serveur coupait toute chaîne à 300 caractères ; le lien collé en a 331, l'URL rendue ne
     se retrouvait plus dans le message, la page lue se détachait : ni photo, ni stock, nom coupé à 120 (« Robuste Bauw »). */
  it('la garde serveur rend le lien entier (331 caractères)', () => {
    const brut = JSON.parse(readFileSync(new URL('../fixtures/carnets/gastro-held-reponse-ordonnee.json', import.meta.url), 'utf8'));
    expect(URL_COLLEE.length).toBeGreaterThan(300);
    expect(assainirRangerCarnet(brut).lignes[0].url).toBe(URL_COLLEE);
  });
});
