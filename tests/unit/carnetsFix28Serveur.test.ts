// @vitest-environment node
/*
 * Tour 28 (23.11 soir, voie fix28-serveur) : les défauts du test en ligne côté lecture des pages, rejoués sur les VRAIES pages du banc
 * (work/missions/2026-11-23-carnet-en-ligne/banc-liens/pages, capture du serveur du 23.11). Aucun réseau, aucun Gemini.
 *   T28-5  lien mort : « la page n’existe plus (erreur 404) » quand le site répond ; « le site n’existe plus » seulement si le domaine se tait
 *   T28-7  gastro-held ECO 400 : « Poids net en kg 82 » devient Poids 82 kg
 *   T28-8  landi Schwerlastregal 180 × 160 × 60 cm : hauteur, largeur, profondeur, matériau en français
 *   T28-9  étapes de lecture en mots du brasseur (jamais schema.org, microdata, JSON-LD, données embarquées)
 *   T28-12 libellés français (anglais, allemand) ; T28-13 valeurs françaises, virgule décimale
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { lireLien } from '../../functions/src/lireLien';
import { garder } from '../../functions/src/lienIA';
import { traduireValeurs } from '../../functions/src/lienLibelles';

const BANC = path.join(__dirname, '../../work/missions/2026-11-23-carnet-en-ligne/banc-liens/pages');
const page = (n: number) => zlib.gunzipSync(fs.readFileSync(path.join(BANC, `${String(n).padStart(2, '0')}.html.gz`))).toString('utf8');
const URLS: Record<number, string> = {
  22: 'https://www.landi.ch/shop/lagergestelle_170307/schwerlastregal-180-160-60-cm_105447',
  27: 'https://www.sios.ch/Citra-USA-1-kg-Hopfenpellets-Typ-90',
  34: 'https://hopfenmarkt.ch/produkt/hopfen/mosaic',
  59: 'https://www.galaxus.ch/de/s2/product/kibernetik-ks240l-242-l-kuehlschrank-freistehend-49548562',
  61: 'https://www.gastro-held.ch/fr/products/armoire-refrigeree-professionnelle-eco-400-gn-11-snackh400tn',
  63: 'https://www.gastro-held.ch/products/barkuehlschrank-eco-350-mit-klapptueren-schwarz-led-beleuchtung-unterbauba'
};
const reseauDe = (html: string): typeof fetch => (async (input: string | URL | Request) => {
  const u = String(input instanceof Request ? input.url : input);
  if (u.endsWith('/robots.txt')) return new Response('', { status: 404 });
  return new Response(html, { status: 200, headers: { 'content-type': 'text/html' } });
}) as typeof fetch;
const lire = (n: number) => lireLien(URLS[n], { fetchPage: reseauDe(page(n)), maintenant: 1, cours: null });
const V = (p: { valeurs?: Array<{ nom: string; valeur: string; unite?: string }> }, nom: string) => (p.valeurs ?? []).find((v) => v.nom === nom);
const dit = (v?: { valeur: string; unite?: string }) => v ? `${v.valeur}${v.unite ? ' ' + v.unite : ''}` : undefined;
const JARGON = /schema\.org|microdata|json-ld|rdfa|open graph|embarqu|valueAddedTax|undefined|NaN/i;

describe('T28-5 : une page absente n’est pas un site absent', () => {
  const LIEN = 'https://www.brewtools.com/brewing-system-accessories/7712213/steam-hat-b40pro';
  const reseau = (reponse: () => Response): typeof fetch => (async (input: string | URL | Request) => {
    const u = String(input instanceof Request ? input.url : input);
    return u.endsWith('/robots.txt') ? new Response('', { status: 404 }) : reponse();
  }) as typeof fetch;
  it('le site répond 404 : « la page n’existe plus (erreur 404) »', async () => {
    const p = await lireLien(LIEN, { fetchPage: reseau(() => new Response('<html></html>', { status: 404, headers: { 'content-type': 'text/html' } })), maintenant: 1, cours: null });
    expect(p.statut).toBe('introuvable');
    expect(p.etapes?.find((e) => e.nom === 'page')?.detail).toMatch(/la page n.existe plus \(erreur 404\)/);
  });
  it('le site répond 410 : l’erreur dite est 410', async () => {
    const p = await lireLien(LIEN, { fetchPage: reseau(() => new Response('', { status: 410, headers: { 'content-type': 'text/html' } })), maintenant: 1, cours: null });
    expect(p.etapes?.find((e) => e.nom === 'page')?.detail).toMatch(/erreur 410/);
  });
  it('la fiche redirigée vers la recherche (brewtools, HTTP 200 sur la recherche) : la page n’existe plus', async () => {
    const p = await lireLien(LIEN, { fetchPage: reseau(() => new Response(null, { status: 301, headers: { location: 'https://www.brewtools.com/Search.aspx?q=steam' } })), maintenant: 1, cours: null });
    expect(p.statut).toBe('introuvable');
    expect(p.etapes?.find((e) => e.nom === 'page')?.detail).toMatch(/la page n.existe plus \(erreur 404\)/);
  });
  it('le domaine ne répond pas (DNS) : le détail reste « introuvable » (« le site n’existe plus »)', async () => {
    const dns = (async (input: string | URL | Request) => { throw Object.assign(new TypeError('fetch failed'), { cause: { code: 'ENOTFOUND' }, input }); }) as typeof fetch;
    const p = await lireLien('https://pompe-zz-test.invalid/p', { fetchPage: dns, maintenant: 1, cours: null });
    expect(p.statut).toBe('introuvable');
    expect(p.etapes?.find((e) => e.nom === 'page')?.detail).toBe('introuvable');
  });
});

describe('T28-7 : gastro-held ECO 400, le poids est repris', () => {
  it('« Poids net en kg 82 » : Poids, 82 kg (et plus de nom portant l’unité)', async () => {
    const p = await lire(61);
    expect(dit(V(p, 'Poids'))).toBe('82 kg');
    expect((p.valeurs ?? []).filter((v) => / en (?:mm|kg|volt)$/i.test(v.nom))).toEqual([]);
    expect(dit(V(p, 'Hauteur'))).toBe('2010 mm');
    expect(dit(V(p, 'Largeur'))).toBe('680 mm');
  });
  it('un poids brut reste un poids brut ; un poids net seul devient « Poids »', () => {
    const t = traduireValeurs([{ nom: 'Poids net en kg', valeur: '82' }, { nom: 'Bruttogewicht', valeur: '90 kg' }]);
    expect(t?.map((v) => `${v.nom}=${v.valeur}${v.unite ? ' ' + v.unite : ''}`)).toEqual(['Poids=82 kg', 'Poids brut=90 kg']);
    const deux = traduireValeurs([{ nom: 'Poids', valeur: '80 kg' }, { nom: 'Poids net en kg', valeur: '82' }]);
    expect(deux?.map((v) => v.nom)).toEqual(['Poids', 'Poids net']);
  });
});

describe('T28-8 : landi Schwerlastregal 180 × 160 × 60 cm', () => {
  it('hauteur 180, largeur 160, profondeur 60 (un rayonnage s’écrit H × L × P), matériau en français', async () => {
    const p = await lire(22);
    expect(dit(V(p, 'Hauteur'))).toBe('180 cm');
    expect(dit(V(p, 'Largeur'))).toBe('160 cm');
    expect(dit(V(p, 'Profondeur'))).toBe('60 cm');
    expect(V(p, 'Longueur')).toBeUndefined();
    expect(V(p, 'Matériau')?.valeur).toBe('Acier, MDF');
    expect(JSON.stringify(p.valeurs)).not.toMatch(/Stahl/);
  });
  it('la garde de l’IA refuse une dimension dont le nombre n’est pas écrit avec son unité (61, 162, 6 : « Largeur 61 cm · Longueur 162 cm · Hauteur 6 cm »)', () => {
    const texte = 'Schwerlastregal 180 × 160 × 60 cm. Mit 5 Tablaren. Max. Tragkraft pro Regalboden: 250 kg. Artikel 105447. Filiale 61, 162 Kunden, 6 Stück.';
    const { gardee } = garder({ caracteristiques: [{ nom: 'Largeur', valeur: '61 cm' }, { nom: 'Longueur', valeur: '162 cm' }, { nom: 'Hauteur', valeur: '6 cm' }] }, texte);
    expect(gardee.caracteristiques).toEqual([]);
  });
  it('la garde garde une dimension écrite (180 × 160 × 60 cm, 60 cm)', () => {
    const texte = 'Schwerlastregal 180 × 160 × 60 cm. Tiefe 60 cm.';
    const { gardee } = garder({ caracteristiques: [{ nom: 'Profondeur', valeur: '60 cm' }, { nom: 'Hauteur', valeur: '180 cm' }] }, texte);
    expect(gardee.caracteristiques.map((c) => c.nom)).toEqual(['Profondeur', 'Hauteur']);
  });
});

describe('T28-9 : les étapes parlent brasseur', () => {
  it('sios Citra : « prix 72,50 CHF », jamais schema.org', async () => {
    const p = await lire(27);
    const t = (p.etapes ?? []).map((e) => `${e.nom}: ${e.detail ?? ''}`).join('\n');
    expect(t).toMatch(/prix 72,50 CHF/);
    expect(t).not.toMatch(JARGON);
  });
  it('hopfenmarkt : « frais de port 4,90 CHF »', async () => {
    const p = await lire(34);
    const t = (p.etapes ?? []).map((e) => `${e.nom}: ${e.detail ?? ''}`).join('\n');
    expect(t).toMatch(/frais de port 4,90 CHF/);
    expect(t).not.toMatch(JARGON);
  });
  it('landi, gastro-held (port gratuit, port douteux), galaxus : aucun jargon', async () => {
    for (const n of [22, 61, 63, 59]) {
      const p = await lire(n);
      const t = (p.etapes ?? []).map((e) => `${e.nom}: ${e.detail ?? ''}`).join('\n');
      expect(t, String(n)).not.toMatch(JARGON);
      expect(t, String(n)).not.toMatch(/\d\.\d/);
    }
  });
  it('gastro-held ECO 400 : prix 913,90 CHF', async () => {
    const t = ((await lire(61)).etapes ?? []).map((e) => e.detail ?? '').join('\n');
    expect(t).toMatch(/prix 913,90 CHF/);
  });
});

describe('T28-12 : libellés en français', () => {
  it('fermenteur brouwland : anglais rendu en français', () => {
    const noms = ['Full volume', 'Height with extension legs', 'Top opening', 'Dump valve size', 'Fermentable volume', 'Size of valve', 'Diameter at the top'];
    const t = traduireValeurs(noms.map((nom) => ({ nom, valeur: '30 l' })))!.map((v) => v.nom);
    expect(t).toEqual(['Volume total', 'Hauteur avec pieds d’extension', 'Ouverture supérieure', 'Taille de la vanne de vidange', 'Volume de fermentation', 'Taille de la vanne', 'Diamètre en haut']);
  });
  it('houblon hopfenmarkt Mosaic : huiles, farnésène, caryophyllène, myrcène, humulène, bêta', async () => {
    const p = await lire(34);
    const noms = (p.valeurs ?? []).map((v) => v.nom);
    for (const n of ['Huiles totales', 'Farnésène', 'Caryophyllène', 'Myrcène', 'Humulène', 'Bêta', 'Alpha']) expect(noms, n).toContain(n);
    expect(noms.filter((n) => /Total oil|Farnesene|Caryophyllene|Myrcene|Humulene|^Beta$/.test(n))).toEqual([]);
  });
  it('idempotent : repasser sur du français ne change rien', async () => {
    const p = await lire(34);
    expect(traduireValeurs(p.valeurs)).toEqual(p.valeurs);
  });
});

describe('T28-13 : valeurs en français, virgule décimale', () => {
  it('galaxus KS240L : « Kühlschrank ohne Gefrierfach », « Fresh Zone Fach », 143.50 cm', async () => {
    const p = await lire(59);
    const t = (p.valeurs ?? []).map((v) => `${v.nom}=${dit(v)}`).join(' | ');
    expect(t).toContain('Type de réfrigérateur=Réfrigérateur sans compartiment congélateur');
    expect(t).toContain('Compartiment Fresh Zone');
    expect(dit(V(p, 'Hauteur'))).toBe('143,5 cm');
    expect(t).not.toMatch(/Kühlschrank|Gefrierfach|Fach\b|\d\.\d/);
  });
  it('hopfenmarkt : Mehrzweckhopfen, 11,4 %, huiles totales en ml/100 g', async () => {
    const p = await lire(34);
    expect(V(p, 'Type de houblon')?.valeur).toBe('Houblon mixte');
    expect(V(p, 'Alpha')?.valeur).toBe('11,4 %');
    expect(dit(V(p, 'Huiles totales'))).toBe('0,8 ml/100 g');
    expect(V(p, 'Myrcène')?.valeur).toBe('47,9 %');
  });
  it('gastro-held ECO 350 : plage de température et milliers à la suisse', async () => {
    const p = await lire(63);
    expect(V(p, 'Plage de température')?.valeur).toBe('+2 à +8 °C');
    expect(dit(V(p, 'Largeur'))).toBe('1350 mm');
    expect(V(p, 'Verrouillable')?.valeur).toBe('oui');
    expect(V(p, 'Couleur')?.valeur).toBe('noir');
  });
  it('virgule décimale, zéros inutiles retirés, unité séparée', () => {
    const t = traduireValeurs([{ nom: 'Breite', valeur: '68.5 cm' }, { nom: 'Leistung', valeur: '0.36kW' }, { nom: 'Gewicht', valeur: '12.50 kg' }, { nom: 'Volumen', valeur: '0.125 l' }]);
    expect(t?.map((v) => v.valeur)).toEqual(['68,5 cm', '0,36 kW', '12,5 kg', '0,125 l']);
  });
  it('un nombre ambigu (1.500 kg, 9.500 Artikel) n’est ni multiplié ni divisé : la page l’écrit, on le garde ; une dimension en mm perd son point de milliers', () => {
    const t = traduireValeurs([{ nom: 'Gewicht', valeur: '1.500 kg' }, { nom: 'Top Preise', valeur: 'Über 9.500 Artikel' }, { nom: 'Höhe in mm', valeur: '2.010' }]);
    expect(t?.map((v) => `${v.valeur}${v.unite ? ' ' + v.unite : ''}`)).toEqual(['1.500 kg', 'Über 9.500 Artikel', '2010 mm']);
  });
});
