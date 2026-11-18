// @vitest-environment node
import { readFileSync } from 'node:fs';
import { afterAll, describe, expect, it, vi } from 'vitest';

// B3 : aucun appel à la passerelle IA dans ce lot (espion à 0).
const passerelle = vi.hoisted(() => ({ call: vi.fn() }));
vi.mock('firebase/functions', () => ({ httpsCallable: () => passerelle.call }));
vi.mock('../../src/services/firebase', () => ({ functions: {} }));
import { AiClient } from '../../src/services/aiClient';
import { lirePage, lireLien, robotsPermet, urlLisible, LIEN_TAILLE_MAX } from '../../functions/src/lireLien';
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

  it('AggregateOffer ou offres de prix différents : aucun prix choisi à sa place', () => {
    const page = (offers: unknown) => `<html><head><script type="application/ld+json">${JSON.stringify({ '@type': 'Product', name: 'Hotte', offers })}</script></head><body><h1>Hotte</h1></body></html>`;
    const agg = lirePage(page({ '@type': 'AggregateOffer', lowPrice: 300, highPrice: 900, priceCurrency: 'CHF' }), new URL('https://x-exemple.ch/h'));
    expect(agg.nom).toBe('Hotte');
    expect(agg.prix).toBeUndefined();
    const deux = lirePage(page([{ '@type': 'Offer', price: 300, priceCurrency: 'CHF' }, { '@type': 'Offer', price: 450, priceCurrency: 'CHF' }]), new URL('https://x-exemple.ch/h'));
    expect(deux.prix).toBeUndefined();
  });

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

  it('robots indisponible (5xx ou panne) : refus prudent, aucun fetch de la page', async () => {
    const r5 = reseau({ [robots]: () => texte('erreur', 503) });
    expect((await lireLien(page, { fetchPage: r5.fetchPage })).statut).toBe('robots');
    expect(r5.demandes).toEqual([robots]);
    const panne = reseau({});
    expect((await lireLien(page, { fetchPage: panne.fetchPage })).statut).toBe('robots');
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
