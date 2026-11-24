/**
 * Voie prix-houblon (24.11) : tests ROUGES écrits depuis les règles R39 à R42 du DOSSIER (work/missions/2026-11-24-carnet-personas/prix-houblon/DOSSIER.md),
 * avant tout correctif. Données : les DEUX PAGES RÉELLES du banc (capturées au serveur, agent LaffineeCarnet/1.0 : pages/64.html.gz MotlerHops, pages/65.html.gz
 * Brau- und Rauchshop). Aucun réseau, aucun Gemini : l'IA est une fonction simulée qui rejoue les réponses RÉELLES du 24.11 (ia-reponses du banc, journal
 * `prix-houblon`).
 *
 *  - R39 : un prix lu porte sa quantité (« 50 g · 3,72 € ») ou son unité (« 0,1044 CHF/g ») ; jamais un nombre nu.
 *  - R40 : un prix au gramme se convertit (au kilo) ; jamais comparé à un prix de sachet.
 *  - R41 : sans choix, le plus petit conditionnement avec sa quantité ; tous les conditionnements publiés sont lus.
 *  - D450 : l'IA lit TOUJOURS la page entière ; deux sources qui se contredisent : étape « douteux » visible, jamais une valeur silencieuse.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { completerParIA, iaUtile, markdownProduit, type ReponseIA } from '../../functions/src/lienIA';
import { lirePage } from '../../functions/src/lireLien';

const PAGES = path.resolve('work/missions/2026-11-23-carnet-en-ligne/banc-liens/pages');
const page = (n: number) => zlib.gunzipSync(fs.readFileSync(path.join(PAGES, `${n}.html.gz`))).toString('utf8');
const MOTLER = 'https://www.motlerhops.fr/collections/tous-nos-houblons/products/citra-us';
const BRAU = 'https://www.brauundrauchshop.ch/citra-136-2';
const lu = (n: number, url: string) => lirePage(page(n), new URL(url), 0) as any;

describe('R39 et R41 : MotlerHops (Shopify) — le prix lu est celui d\'un conditionnement, dit', () => {
  const p = lu(64, MOTLER);
  it('le prix 3,72 EUR est celui de 50 g', () => {
    expect(p.prix).toBe(3.72);
    expect(p.devise).toBe('EUR');
    expect(p.conditionnement).toEqual({ valeur: 50, unite: 'g' });
  });
  it('« dès » ne reste pas : la quantité dit tout', () => { expect(p.prixDes).toBeUndefined(); });
  it('les quatre conditionnements publiés sont lus (50 g, 250 g, 500 g, 1 kg) avec leur prix', () => {
    const o = (p.offres ?? []).map((x: any) => `${x.valeur} ${x.unite} ${x.prix}`);
    expect(o).toEqual(['50 g 3.72', '250 g 14.06', '500 g 24.97', '1 kg 40.69']);
  });
  it('compat C59 : une valeur « Conditionnement » dit aussi la quantité', () => {
    expect((p.valeurs ?? []).some((v: any) => /^conditionnement$/i.test(v.nom) && String(v.valeur).replace(',', '.') === '50' && v.unite === 'g')).toBe(true);
  });
});

describe('R39, R40, R41 : Brau- und Rauchshop (prix au gramme, paliers) — jamais « 0,10 »', () => {
  const p = lu(65, BRAU);
  it('le prix lu est celui du kilo converti du gramme : 104,40 CHF, jamais 0,10', () => {
    expect(p.prix).toBeCloseTo(104.4, 2);
    expect(p.devise).toBe('CHF');
    expect(p.conditionnement).toEqual({ valeur: 1, unite: 'kg' });
  });
  it('le prix à l\'unité de la page est gardé tel quel avec son unité et ses paliers (0,1044 CHF/g ; 0,08 dès 1 000 g)', () => {
    expect(p.prixUnite).toEqual({ prix: 0.1044, unite: 'g', paliers: [{ des: 1000, prix: 0.08 }] });
  });
  it('les conditionnements en sac sont lus aussi (5 kg 245,70 ; 20 kg 782,15)', () => {
    const o = (p.offres ?? []).map((x: any) => `${x.valeur} ${x.unite} ${x.prix}`);
    expect(o).toEqual(['5 kg 245.7', '20 kg 782.15']);
  });
  it('plus de prix « douteux » : la fiche et la page s\'accordent', () => {
    const prix = (p.etapes ?? []).find((e: any) => e.nom === 'prix');
    expect(prix?.statut, prix?.detail).toBe('trouve');
    expect(p.prixDes).toBeUndefined();
  });
});

describe('R40 : un prix par unité de référence schema.org (Grundpreis) n\'est jamais le prix du produit — banc, lien 62 (Fischer-Lahr : 2,98 € pro 1 l à côté de 179 €)', () => {
  const html = (offre: string) => `<html><head><title>Houblon Mosaic T90 | Boutique</title><script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Product', name: 'Mosaic T90', offers: JSON.parse(offre)
  })}</script></head><body><main><h1>Mosaic T90</h1><p>Houblon en pellets, origine USA, alpha 12 %. Prix au gramme, dégressif.</p></main></body></html>`;
  it('0,09 EUR le gramme (referenceQuantity 1 GRM) seul : aucun prix retenu (jamais « 0,09 » pour le produit), le doute est dit', () => {
    const o = '{"@type":"Offer","priceCurrency":"EUR","priceSpecification":{"@type":"UnitPriceSpecification","price":"0.09","priceCurrency":"EUR","referenceQuantity":{"@type":"QuantitativeValue","value":1,"unitCode":"GRM"}}}';
    const p = lirePage(html(o), new URL('https://boutique-exemple.test/mosaic-t90'), 0) as any;
    expect(p.prix).toBeUndefined();
    const controle = (p.etapes ?? []).find((e: any) => e.nom === 'controle');
    expect(controle?.statut).toBe('douteux');
    expect(controle?.detail).toMatch(/poids|unit/i);
  });
  it('le prix du produit écrit à côté d\'un Grundpreis reste le prix du produit', () => {
    const o = '[{"@type":"Offer","priceCurrency":"EUR","price":"179.00"},{"@type":"Offer","priceCurrency":"EUR","priceSpecification":{"@type":"UnitPriceSpecification","price":"2.98","priceCurrency":"EUR","referenceQuantity":{"@type":"QuantitativeValue","value":1,"unitCode":"LTR"}}}]';
    const p = lirePage(html(o), new URL('https://boutique-exemple.test/mosaic-t90'), 0) as any;
    expect(p.prix).toBe(179);
  });
});

describe('D450 : l\'IA lit toujours la page entière ; deux sources qui se contredisent se disent', () => {
  it('iaUtile : une page lue complète (nom, prix, mesures) est quand même relue par l\'IA', () => {
    const complete = { url: 'https://x.test/a', domaine: 'x.test', statut: 'lue', luLe: 0, nom: 'Frigo A', prix: 100, devise: 'CHF', valeurs: [1, 2, 3, 4, 5].map((i) => ({ nom: `Mesure ${i}`, valeur: `${i}0`, unite: 'cm' })), etapes: [{ nom: 'prix', statut: 'trouve' }] } as any;
    expect(iaUtile(complete)).toBe(true);
  });
  it('le texte envoyé à l\'IA porte les conditionnements publiés par la page (MotlerHops : 50 g 3,72 € … 1 kg 40,69 €), absents du HTML visible', () => {
    const md = markdownProduit(page(64), 'CITRA® (US)');
    for (const k of ['50 g', '250 g', '500 g', '1 kg', '40,69']) expect(md, k).toContain(k);
  });
  it('Brau : l\'IA répond 245,70 (le sac de 5 kg) sur une page lue à 104,40/kg : l\'étape ia est « douteuse » et le dit, le contrôle aussi', async () => {
    const p = lu(65, BRAU);
    const appel = async (): Promise<ReponseIA> => ({ nom: 'Citra 13.6%', prix: 245.7, devise: 'CHF', taxe: null, prixDes: null, portSuisse: null, portGratuit: null, caracteristiques: [] } as any);
    const r = await completerParIA({ ...p, statut: 'lue', luLe: 0 } as any, page(65), appel as any);
    const ia = (r.etapes ?? []).find((e) => e.nom === 'ia');
    expect(ia?.statut, ia?.detail).toBe('douteux');
    expect((r.etapes ?? []).find((e) => e.nom === 'controle')?.statut).toBe('douteux');
  });
  it('Brau : l\'IA répond « 0,1044 CHF le gramme » (prix à l\'unité écrit) : accord avec la page, étape « trouvé », aucun doute', async () => {
    const p = lu(65, BRAU);
    const appel = async (): Promise<ReponseIA> => ({ nom: 'Citra 13.6%', prix: 0.1044, devise: 'CHF', quantite: 1, unite: 'g', parUnite: true, taxe: null, prixDes: null, portSuisse: null, portGratuit: null, caracteristiques: [] } as any);
    const r = await completerParIA({ ...p, statut: 'lue', luLe: 0 } as any, page(65), appel as any);
    expect((r.etapes ?? []).find((e) => e.nom === 'ia')?.statut).not.toBe('douteux');
    expect((r.etapes ?? []).find((e) => e.nom === 'controle')?.statut).not.toBe('douteux');
    expect(r.prix).toBeCloseTo(104.4, 2);
  });
  it('MotlerHops : l\'IA répond 3,72 EUR pour 50 g : accord, le prix reste 3,72 pour 50 g', async () => {
    const p = lu(64, MOTLER);
    const appel = async (): Promise<ReponseIA> => ({ nom: 'CITRA® (US)', prix: 3.72, devise: 'EUR', quantite: 50, unite: 'g', parUnite: false, taxe: 'ttc', prixDes: null, portSuisse: null, portGratuit: null, caracteristiques: [] } as any);
    const r = await completerParIA({ ...p, statut: 'lue', luLe: 0 } as any, page(64), appel as any);
    expect(r.prix).toBe(3.72);
    expect((r as any).conditionnement).toEqual({ valeur: 50, unite: 'g' });
    expect((r.etapes ?? []).find((e) => e.nom === 'ia')?.statut).not.toBe('douteux');
  });
});
