// @vitest-environment node
import { readFileSync } from 'node:fs';
import { afterAll, describe, expect, it, vi } from 'vitest';

// B3 : aucun appel à la passerelle IA dans ce lot (espion à 0).
const passerelle = vi.hoisted(() => ({ call: vi.fn() }));
vi.mock('firebase/functions', () => ({ httpsCallable: () => passerelle.call }));
vi.mock('../../src/services/firebase', () => ({ functions: {} }));
import { AiClient } from '../../src/services/aiClient';
import { lirePage, lireLien, robotsPermet, urlLisible, prixLocalise, LIEN_TAILLE_MAX } from '../../functions/src/lireLien';
import { DELAI_LECTURE_BANC, LIEN_ILLISIBLE_BANC, lireLienSimule, nomDeLienTest, pageSimulee } from '../../src/domain/carnets/iaSimulee';

const espion = vi.spyOn(AiClient, 'run');
afterAll(() => { expect(espion).toHaveBeenCalledTimes(0); expect(passerelle.call).toHaveBeenCalledTimes(0); });

const fixture = (nom: string) => readFileSync(new URL(`../fixtures/carnets/${nom}`, import.meta.url), 'utf8');
const html = (corps: string, statut = 200, entetes: Record<string, string> = {}) =>
  new Response(corps, { status: statut, headers: { 'content-type': 'text/html; charset=utf-8', ...entetes } });
const texte = (corps: string, statut = 200) => new Response(corps, { status: statut, headers: { 'content-type': 'text/plain' } });

/** Un faux réseau : robots.txt et pages par adresse ; chaque demande est notée. */
function reseau(routes: Record<string, () => Response>) {
  const demandes: string[] = [];
  const fetchPage = vi.fn(async (entree: RequestInfo | URL) => {
    const url = String(entree);
    demandes.push(url);
    const r = routes[url];
    if (!r) throw new Error(`réseau interdit dans les tests : ${url}`);
    return r();
  }) as unknown as typeof fetch;
  return { fetchPage, demandes };
}

describe('lirePage (B4)', () => {
  it('ld+json : nom, prix, devise, disponibilité, vendeur, photo et valeurs ; rien des produits voisins', () => {
    const p = lirePage(fixture('produit-ldjson.html'), new URL('https://boutique-exemple.ch/pompe-inox'), 1);
    expect(p).toMatchObject({ statut: 'lue', nom: 'Pompe de transfert inox', prix: 690, devise: 'CHF', dispo: 'en-stock', vendeur: 'Boutique Exemple', domaine: 'boutique-exemple.ch' });
    expect(p.photo).toBe('https://boutique-exemple.ch/img/pompe-inox.jpg');
    expect(p.valeurs).toEqual([{ nom: 'débit', valeur: '40', unite: 'L/min' }, { nom: 'température max', valeur: '90', unite: '°C' }]);
    expect(JSON.stringify(p)).not.toContain('245');
  });

  it('Open Graph seul : nom et photo, sans prix ni disponibilité', () => {
    const p = lirePage(fixture('produit-og.html'), new URL('https://exemple-sanitaire.ch/evier-inox-2-bacs'), 1);
    expect(p).toMatchObject({ statut: 'lue', nom: 'Évier inox 2 bacs sur pieds', photo: 'https://exemple-sanitaire.ch/media/evier-2-bacs.jpg' });
    expect(p.prix).toBeUndefined();
    expect(p.devise).toBeUndefined();
    expect(p.dispo).toBeUndefined();
  });

  it('sans métadonnées : illisible, et rien d\'inventé (ni nom, ni prix, ni photo, ni valeur)', () => {
    const p = lirePage(fixture('page-sans-meta.html'), new URL('https://hottes-exemple.ch/'), 1);
    expect(p).toEqual({ url: 'https://hottes-exemple.ch/', domaine: 'hottes-exemple.ch', statut: 'illisible', luLe: 1 });
  });

  // « AggregateOffer ou offres de prix différents » : le plus bas, dit « dès » (Chasse Carnet V1, tests plus bas).

  it('Open Graph product:price : un prix seulement avec sa devise', () => {
    const p = lirePage(fixture('robots-refuse.html'), new URL('https://extracteur-exemple.ch/mural'));
    expect(p).toMatchObject({ statut: 'lue', nom: 'Extracteur mural 300 m³/h', prix: 389, devise: 'CHF' });
  });
});

describe('urlLisible et robotsPermet', () => {
  it('refuse http, IP, hôte local, port, identifiants et pages de panier', () => {
    for (const u of ['http://boutique.ch/a', 'https://192.168.1.10/a', 'https://[::1]/a', 'https://localhost/a', 'https://serveur.internal/a',
      'https://metadata.google.internal/x', 'https://boutique.ch:8443/a', 'https://moi:secret@boutique.ch/a', 'https://boutique.ch/cart/add', 'pas une adresse'])
      expect(urlLisible(u), u).toBeNull();
    expect(urlLisible('https://www.boutique-exemple.ch/pompe#avis')?.href).toBe('https://www.boutique-exemple.ch/pompe');
  });

  it('RFC 9309 : règle la plus longue, Allow à égalité, groupe le plus précis', () => {
    const u = (c: string) => new URL(`https://b.ch${c}`);
    expect(robotsPermet('User-agent: *\nDisallow: /', u('/p'))).toBe(false);
    expect(robotsPermet('User-agent: *\nDisallow: /shop\nAllow: /shop/produit', u('/shop/produit/1'))).toBe(true);
    expect(robotsPermet('User-agent: *\nDisallow: /\n\nUser-agent: LaffineeCarnet\nAllow: /', u('/p'))).toBe(true);
    expect(robotsPermet('User-agent: *\nDisallow: /*.json$', u('/a.json'))).toBe(false);
    expect(robotsPermet('User-agent: *\nContent-Signal: ai-input=no', u('/p'))).toBe(false);
    expect(robotsPermet('', u('/p'))).toBe(true);
  });
});

describe('lireLien (B4) : réseau simulé, jamais réel', () => {
  const page = 'https://extracteur-exemple.ch/mural';
  const robots = 'https://extracteur-exemple.ch/robots.txt';

  it('robots refusé : aucun fetch de la page', async () => {
    const { fetchPage, demandes } = reseau({ [robots]: () => texte('User-agent: *\nDisallow: /'), [page]: () => html(fixture('robots-refuse.html')) });
    const p = await lireLien(page, { fetchPage, maintenant: 5 });
    expect(p).toEqual({ url: page, domaine: 'extracteur-exemple.ch', statut: 'robots', luLe: 5 });
    expect(demandes).toEqual([robots]);
  });

  it('robots en 5xx : refus prudent ; panne du réseau : indisponible (L-4) ; aucun fetch de la page', async () => {
    const r5 = reseau({ [robots]: () => texte('erreur', 503) });
    expect((await lireLien(page, { fetchPage: r5.fetchPage })).statut).toBe('robots');
    expect(r5.demandes).toEqual([robots]);
    const panne = reseau({});
    expect((await lireLien(page, { fetchPage: panne.fetchPage })).statut).toBe('indisponible');
    expect(panne.demandes).toEqual([robots]);
  });

  it('robots absent (404) : la page est lue', async () => {
    const { fetchPage, demandes } = reseau({ [robots]: () => texte('', 404), [page]: () => html(fixture('robots-refuse.html')) });
    const p = await lireLien(page, { fetchPage });
    expect(p).toMatchObject({ statut: 'lue', prix: 389, devise: 'CHF' });
    expect(demandes).toEqual([robots, page]);
  });

  it('adresse refusée : aucun appel réseau', async () => {
    const { fetchPage, demandes } = reseau({});
    expect((await lireLien('https://127.0.0.1/admin', { fetchPage })).statut).toBe('refusee');
    expect(demandes).toEqual([]);
  });

  it('page trop grosse ou non HTML : indisponible, rien d\'inventé', async () => {
    const gros = reseau({ [robots]: () => texte('', 404), [page]: () => html('<html></html>', 200, { 'content-length': String(LIEN_TAILLE_MAX + 1) }) });
    expect(await lireLien(page, { fetchPage: gros.fetchPage, maintenant: 1 })).toEqual({ url: page, domaine: 'extracteur-exemple.ch', statut: 'indisponible', luLe: 1 });
    const pdf = reseau({ [robots]: () => texte('', 404), [page]: () => new Response('%PDF', { headers: { 'content-type': 'application/pdf' } }) });
    expect((await lireLien(page, { fetchPage: pdf.fetchPage })).statut).toBe('indisponible');
  });

  it('redirection vers une adresse interdite : refusée, non suivie', async () => {
    const { fetchPage, demandes } = reseau({ [robots]: () => texte('', 404), [page]: () => new Response(null, { status: 302, headers: { location: 'https://10.0.0.1/x' } }) });
    expect((await lireLien(page, { fetchPage })).statut).toBe('refusee');
    expect(demandes).toEqual([robots, page]);
  });

  it('redirection vers un autre site : son robots est relu avant la page', async () => {
    const autre = 'https://autre-exemple.ch/p';
    const { fetchPage, demandes } = reseau({
      [robots]: () => texte('', 404), [page]: () => new Response(null, { status: 301, headers: { location: autre } }),
      'https://autre-exemple.ch/robots.txt': () => texte('User-agent: *\nDisallow: /p')
    });
    expect((await lireLien(page, { fetchPage })).statut).toBe('robots');
    expect(demandes).toEqual([robots, page, 'https://autre-exemple.ch/robots.txt']);
  });
});

describe('P2 (vision 3, m390-18) : au banc, un lien « ZZ TEST » est lu (page simulée, exemple) ; une adresse inconnue reste illisible', () => {
  it('famille connue : la page du banc ; variante par la fin de l’adresse ; sinon le nom écrit dans l’adresse, sans prix inventé', () => {
    expect(pageSimulee('https://exemple.test/zz-test-hotte-3')).toMatchObject({ statut: 'lue', nom: 'Hotte inox 140 cm + extracteur', domaine: 'exemple.test' });
    expect(pageSimulee('https://exemple.test/zz-test-pompe-magnetique')).toMatchObject({ statut: 'lue', nom: 'Pompe magnétique 12 V' });
    expect(pageSimulee('https://exemple.test/ZZ-TEST-pompe')).toMatchObject({ statut: 'lue', nom: 'Pompe de transfert inox' });
    expect(pageSimulee('https://exemple.test/zz-test-evier-a').nom).toBe('Évier inox Riviera 2 bacs');
    expect(pageSimulee('https://exemple.test/zz-test-evier-b').nom).toBe('Évier inox sur pieds 1 bac');
    const ventilo = pageSimulee('https://exemple.test/ZZ-TEST-ventilo', 7);
    expect(ventilo).toEqual({ url: 'https://exemple.test/ZZ-TEST-ventilo', domaine: 'exemple.test', statut: 'lue', nom: 'ZZ TEST — Ventilo', luLe: 7 });
    expect(pageSimulee('https://exemple.test/zz-test-frigo-300l')).not.toHaveProperty('prix');
  });
  it('honnête : « illisible » dans l’adresse, ou une adresse sans marque ZZ TEST, reste illisible (R17, D-27, état 21)', () => {
    expect(pageSimulee('https://exemple.test/zz-test-illisible').statut).toBe('illisible');
    expect(pageSimulee(LIEN_ILLISIBLE_BANC).statut).toBe('illisible');
    expect(pageSimulee('https://exemple.test/ventilation').statut).toBe('illisible');
    expect(pageSimulee('https://inconnu.invalid/x').statut).toBe('illisible');
    expect(nomDeLienTest('https://exemple.test/a/ZZ-TEST-frigo-300l?x=1')).toBe('frigo-300l');
    expect(nomDeLienTest('https://exemple.test/frigo')).toBeNull();
  });
  it('délai du banc : 1,5 s au plus, aucun réseau', async () => {
    expect(DELAI_LECTURE_BANC).toBeLessThanOrEqual(1500);
    vi.useFakeTimers();
    try {
      const p = lireLienSimule('https://exemple.test/zz-test-hotte-3');
      await vi.advanceTimersByTimeAsync(1500);
      expect((await p).statut).toBe('lue');
    } finally { vi.useRealTimers(); }
  });
});

// ───────────── Chasse Carnet (21.11), V1 : CRP-1 maillon 1 (le prix lu), CRP-2 / CRB-4 (entités, libellé) ─────────────
// Écrits avant le code : rouges sur le `lireLien.ts` du tag en-ligne/2026-11-21-tour8, verts après. Aucun réseau, aucun modèle.
const pageJson = (produit: unknown, entete = '') => `<html><head>${entete}<script type="application/ld+json">${JSON.stringify(produit)}</script></head><body><h1>Chambre froide</h1></body></html>`;
const lire = (produit: unknown, entete = '') => lirePage(pageJson({ '@type': 'Product', name: 'Chambre froide', ...(produit as object) }, entete), new URL('https://froid-exemple.ch/chambre'), 1);

describe('prixLocalise : « 4\'890.00 », « 4 890,00 », « 4,890.00 » (CRP-1)', () => {
  it.each([
    ['4\'890.00', 4890], ['4’890.00', 4890], ['4 890,00', 4890], ['4 890,00', 4890], ['4 890,00', 4890], ['4,890.00', 4890], ['4.890,00', 4890],
    ['1\'250.5', 1250.5], ['690', 690], ['690.5', 690.5], ['199,90', 199.9], ['4,890', 4890], ['4.890', 4890], ['1,234,567', 1234567],
    ['4 890 000,50', 4890000.5], ['0.89', 0.89], [4890, 4890], [690.5, 690.5]
  ])('%j → %d', (entree, attendu) => { expect(prixLocalise(entree)?.montant).toBe(attendu); });

  it('la devise écrite avec le prix est lue : « CHF 4\'890.00 », « 4 890,00 € », « Fr. 1\'250.– »', () => {
    expect(prixLocalise('CHF 4\'890.00')).toEqual({ montant: 4890, devise: 'CHF' });
    expect(prixLocalise('4 890,00 €')).toEqual({ montant: 4890, devise: 'EUR' });
    expect(prixLocalise('Fr. 1\'250.–')).toEqual({ montant: 1250, devise: 'CHF' });
  });

  it('l\'inconnu n\'est jamais 0 ni un nombre deviné : rien, zéro, deux nombres, groupes faux, texte', () => {
    for (const v of ['', '  ', 'sur demande', '0', '0.00', '-12', '12 x 3', '4\'89.00', '1,2345', '1.234,567', '4 89', null, undefined, {}, Number.NaN, 0])
      expect(prixLocalise(v), String(v)).toBeUndefined();
  });
});

describe('lirePage : le prix d\'une page de vendeur (CRP-1, maillon 1)', () => {
  it('offre simple avec « 4\'890.00 » (apostrophe suisse) : 4890 CHF', () => {
    expect(lire({ offers: { '@type': 'Offer', price: '4\'890.00', priceCurrency: 'CHF' } })).toMatchObject({ prix: 4890, devise: 'CHF' });
  });
  it('« 4 890,00 » et « 4,890.00 » : 4890 CHF', () => {
    expect(lire({ offers: { '@type': 'Offer', price: '4 890,00', priceCurrency: 'CHF' } })).toMatchObject({ prix: 4890, devise: 'CHF' });
    expect(lire({ offers: { '@type': 'Offer', price: '4,890.00', priceCurrency: 'CHF' } })).toMatchObject({ prix: 4890, devise: 'CHF' });
  });
  it('AggregateOffer : le prix le plus bas, dit « dès » ; jamais la variante choisie à sa place', () => {
    const p = lire({ offers: { '@type': 'AggregateOffer', lowPrice: '2\'400.00', highPrice: '3100', priceCurrency: 'CHF', offerCount: 3 } });
    expect(p).toMatchObject({ prix: 2400, devise: 'CHF', prixDes: true });
  });
  it('AggregateOffer à prix unique : ce prix, sans « dès »', () => {
    const p = lire({ offers: { '@type': 'AggregateOffer', lowPrice: 890, highPrice: 890, priceCurrency: 'CHF' } });
    expect(p).toMatchObject({ prix: 890, devise: 'CHF' });
    expect(p.prixDes).toBeUndefined();
  });
  it('deux offres de prix différents : le plus bas, « dès » ; deux offres au même prix : ce prix', () => {
    const deux = lire({ offers: [{ '@type': 'Offer', price: 450, priceCurrency: 'CHF' }, { '@type': 'Offer', price: 300, priceCurrency: 'CHF' }] });
    expect(deux).toMatchObject({ prix: 300, devise: 'CHF', prixDes: true });
    const memes = lire({ offers: [{ '@type': 'Offer', price: 300, priceCurrency: 'CHF' }, { '@type': 'Offer', price: '300.00', priceCurrency: 'CHF' }] });
    expect(memes).toMatchObject({ prix: 300, devise: 'CHF' });
    expect(memes.prixDes).toBeUndefined();
  });
  it('variantes d\'un ProductGroup (hasVariant) : le plus bas, « dès »', () => {
    const p = lire({ '@type': 'ProductGroup', hasVariant: [{ '@type': 'Product', offers: { '@type': 'Offer', price: 1800, priceCurrency: 'CHF' } }, { '@type': 'Product', offers: { '@type': 'Offer', price: 2400, priceCurrency: 'CHF' } }] });
    expect(p).toMatchObject({ prix: 1800, devise: 'CHF', prixDes: true });
  });
  it('priceSpecification : le prix et la devise y sont lus', () => {
    expect(lire({ offers: { '@type': 'Offer', priceSpecification: { '@type': 'UnitPriceSpecification', price: '1 250,00', priceCurrency: 'CHF' } } })).toMatchObject({ prix: 1250, devise: 'CHF' });
  });
  it('devise absente de l\'offre : celle de l\'en-tête Open Graph, sinon celle écrite avec le prix ; sinon aucun prix (jamais une devise devinée)', () => {
    const og = '<meta property="product:price:currency" content="CHF">';
    expect(lire({ offers: { '@type': 'Offer', price: '4\'890.00' } }, og)).toMatchObject({ prix: 4890, devise: 'CHF' });
    expect(lire({ offers: { '@type': 'Offer', price: 'CHF 4\'890.00' } })).toMatchObject({ prix: 4890, devise: 'CHF' });
    const sans = lire({ offers: { '@type': 'Offer', price: '4\'890.00' } });
    expect(sans.statut).toBe('lue');
    expect(sans.prix).toBeUndefined();
    expect(sans.devise).toBeUndefined();
  });
  it('deux devises différentes : aucun prix ; prix à zéro ou absent : aucun prix, jamais 0', () => {
    expect(lire({ offers: [{ '@type': 'Offer', price: 300, priceCurrency: 'CHF' }, { '@type': 'Offer', price: 310, priceCurrency: 'EUR' }] }).prix).toBeUndefined();
    expect(lire({ offers: { '@type': 'Offer', price: '0.00', priceCurrency: 'CHF' } }).prix).toBeUndefined();
    expect(lire({ offers: { '@type': 'Offer', priceCurrency: 'CHF' } }).prix).toBeUndefined();
  });
  it('Open Graph : « 4\'890.00 » lu aussi, avec sa devise', () => {
    const p = lirePage('<html><head><meta property="og:title" content="Chambre froide"><meta property="product:price:amount" content="4\'890.00"><meta property="product:price:currency" content="CHF"></head></html>', new URL('https://froid-exemple.ch/c'), 1);
    expect(p).toMatchObject({ prix: 4890, devise: 'CHF' });
  });
});

describe('lirePage : entités et libellés des caractéristiques (CRP-2, CRB-4)', () => {
  const valeurs = (additionalProperty: unknown[]) => lire({ additionalProperty }).valeurs;

  it('« l&apos;isolation » du JSON-LD ressort « l\'isolation » (nom, valeur, unité)', () => {
    expect(valeurs([{ '@type': 'PropertyValue', name: 'Épaisseur de l&apos;isolation', value: 'panneau PIR de l&apos;usine', unitText: 'mm' }]))
      .toEqual([{ nom: 'Épaisseur de l\'isolation', valeur: 'panneau PIR de l\'usine', unite: 'mm' }]);
  });
  it('autres entités : &amp; &quot; &#39; &#x27; &eacute; ; une entité inconnue ou un « & » seul restent tels quels', () => {
    expect(valeurs([{ name: 'Groupe &amp; évaporateur', value: '&quot;A+&quot; &#39;e&#x27; caf&eacute;' }, { name: 'R&D', value: 'AT&T &inconnue;' }]))
      .toEqual([{ nom: 'Groupe & évaporateur', valeur: '"A+" \'e\' café' }, { nom: 'R&D', valeur: 'AT&T &inconnue;' }]);
  });
  it('le nom du produit et le vendeur du JSON-LD sont décodés aussi', () => {
    const p = lire({ name: 'Chambre froide 1800 x 1500 mm &amp; groupe', offers: { '@type': 'Offer', price: 100, priceCurrency: 'CHF', seller: { name: 'L&apos;Atelier du froid' } } });
    expect(p.nom).toBe('Chambre froide 1800 x 1500 mm & groupe');
    expect(p.vendeur).toBe('L\'Atelier du froid');
  });
  it('« Couleur : » perd ses deux-points ; ceux du milieu restent', () => {
    expect(valeurs([{ name: 'Couleur :', value: 'blanc' }, { name: 'Poids :', value: '12', unitText: 'kg' }, { name: 'Ratio 1:2', value: 'x' }]))
      .toEqual([{ nom: 'Couleur', valeur: 'blanc' }, { nom: 'Poids', valeur: '12', unite: 'kg' }, { nom: 'Ratio 1:2', valeur: 'x' }]);
  });
  it('un libellé vide après nettoyage n\'est pas gardé', () => {
    expect(valeurs([{ name: ' : ', value: 'x' }, { name: 'Débit', value: '40' }])).toEqual([{ nom: 'Débit', valeur: '40' }]);
  });
});
