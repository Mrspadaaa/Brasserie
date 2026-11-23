// @vitest-environment jsdom
/**
 * D446, D447 (23.11) : ce que le serveur rend pour un lien (toutes les photos, TTC ou HT, port vers la Suisse, devise d'origine et prix converti
 * au cours de la BCE, « plus disponible », « introuvable ») arrive dans l'article du Carnet et s'affiche aux places existantes. Gemini
 * n'est jamais appelé : la page lue est celle que `lireLien` rend (copie de la forme réelle), la réponse du modèle est écrite ici.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { PageLue } from '../../functions/src/carnetIA';
import { fixtureCarnets, ID_VENTILATION } from '../../src/domain/carnets/fixture';
import { lireReponse } from '../../src/domain/carnets/ia';
import { dispoDe, lireCarnet, type CarnetDoc } from '../../src/domain/carnets/modele';
import { poserPrixArticle, ranger, type LigneARanger } from '../../src/domain/carnets/operations';
import { convertiChf, estEtranger, mentionFrais, portCentimes, renduArticle, tauxVersChf } from '../../src/domain/carnets/prixRendu';
import { magasinMemoire } from '../../src/services/carnetsStore';
import { depuisIA } from '../../src/ui/carnets/lignesRegles';
import { PrixPastille, PrixRenduDetail } from '../../src/ui/carnets/PrixPastille';
import { CarteArticle } from '../../src/ui/carnets/CarteArticle';
import { FicheArticle } from '../../src/ui/carnets/FicheArticle';
import type { ArticleV } from '../../src/ui/carnets/EtatIA';

const LE = '2026-11-23T10:00:00.000Z';
/** Le format de l'app écrit les milliers avec une espace insécable : le test lit des espaces ordinaires. */
const texte = (html: string) => html.replace(/[  ]/g, ' ');
const LIEN = 'https://boutique-exemple.invalid/produit/cuve-45';
const PHOTOS = ['https://boutique-exemple.invalid/img/1.jpg', 'https://boutique-exemple.invalid/img/2.jpg', 'https://boutique-exemple.invalid/img/3.jpg'];

/** La page telle que `lireLien` la rend pour une boutique américaine : USD, HT, port vers la Suisse lu, trois photos, cours du jour. */
const pageUsd: PageLue = {
  url: LIEN, domaine: 'boutique-exemple.invalid', statut: 'lue', nom: 'Cuve conique 45 L', prix: 1450, devise: 'USD', taxe: 'ht',
  dispo: 'en-stock', vendeur: 'Boutique Exemple', photo: PHOTOS[0], photos: PHOTOS,
  livraison: { prix: 49, devise: 'USD' }, change: { taux: 0.8, date: '2026-11-23', source: 'BCE' }, luLe: 1
};

/** La ligne rangée par l'IA (réponse simulée), puis l'article écrit dans le carnet, relu comme le fait l'app. */
function articleDe(page: PageLue, ligneIA: Record<string, unknown> = {}): { ligne: LigneARanger; article: ArticleV } {
  const carnets = [{ id: ID_VENTILATION, titre: 'Ventilation de la salle' }];
  const texte = `cuve ${LIEN}`;
  const lignes = lireReponse({ lignes: [{ sorte: 'article', texte: 'Cuve conique 45 L', url: LIEN, carnetId: ID_VENTILATION, ...ligneIA }] }, { texte, carnets, depuis: ID_VENTILATION, pages: [page], origine: 'exemple' });
  expect(lignes).not.toBeNull();
  const ligne = depuisIA(lignes![0], { carnetId: ID_VENTILATION });
  const etat = fixtureCarnets();
  const r = ranger(etat, { message: { id: 'MSG-T', texte, le: LE, depuis: ID_VENTILATION, rangement: 'simulee' }, lignes: [ligne] });
  if (!r.ok) throw new Error(r.raison);
  const m = magasinMemoire(etat);
  m.appliquer(r.ecritures);
  const doc = m.lire().map(i => lireCarnet(i)).find((d): d is CarnetDoc => !!d && d.id === ID_VENTILATION)!;
  return { ligne, article: doc.carnet.articles.find(a => a.url === LIEN) as unknown as ArticleV };
}

describe('D447 : un prix hors franc, converti, avec son original', () => {
  it('USD : le prix d’origine reste, HT, le port lu et le cours du jour suivent l’article jusqu’au document relu', () => {
    const { article: a } = articleDe(pageUsd, { prix: 1450, devise: 'USD' });
    expect(a).toMatchObject({ prixCentimes: 145000, devise: 'USD', taxe: 'ht', livraison: { prixCentimes: 4900, devise: 'USD' }, change: { taux: 0.8, date: '2026-11-23', source: 'BCE' }, dispo: 'en stock' });
    expect(a.photos).toEqual(PHOTOS);
    expect(a.photo).toBe(PHOTOS[0]);
  });

  it('le calcul : converti 1 160 CHF, rendu avec le port lu (TVA d’import 8,1 %), mention des frais, jamais un cours inventé', () => {
    const { article: a } = articleDe(pageUsd);
    expect(estEtranger(a)).toBe(true);
    expect(tauxVersChf(a)).toEqual({ taux: 0.8, source: 'BCE' });
    expect(convertiChf(a)).toBe(116000);
    expect(portCentimes(a)).toBe(4900);
    const r = renduArticle(a)!;
    expect(r.baseChf).toBe(116000);
    expect(r.portChf).toBe(3920);
    expect(r.totalChf).toBe(Math.round((145000 + 4900) * 0.8 * 1.081));
    expect(r.manque).toEqual(['frais']);
    expect(mentionFrais(a)).toBe('douane et envoi non comptés');
    // sans cours lu : le prix reste en USD, aucun rendu
    const sansCours = { ...a, change: undefined };
    expect(convertiChf(sansCours)).toBeUndefined();
    expect(renduArticle(sansCours)!.totalChf).toBeUndefined();
  });

  it('port inconnu : la mention complète « douane, port et envoi non comptés » ; port refusé : la page ne livre pas en Suisse', () => {
    const { article: a } = articleDe({ ...pageUsd, livraison: undefined });
    expect(a.livraison).toBeUndefined();
    expect(portCentimes(a)).toBeUndefined();
    expect(mentionFrais(a)).toBe('douane, port et envoi non comptés');
    expect(renduArticle(a)!.manque).toEqual(['port', 'frais']);
    expect(mentionFrais({ ...a, livraison: { refusee: true } })).toBe('la page ne livre pas en Suisse');
    expect(portCentimes({ ...a, livraison: { gratuite: true } })).toBe(0);
  });

  it('l’euro garde le taux de la facture ; une autre devise n’emprunte jamais le taux de l’euro', () => {
    const { article: usd } = articleDe(pageUsd);
    expect(tauxVersChf(usd, 0.94)).toEqual({ taux: 0.8, source: 'BCE' });
    const eur = { ...usd, devise: 'EUR', change: { taux: 0.93, date: '2026-11-23', source: 'BCE' as const } };
    expect(tauxVersChf(eur, 0.94)).toEqual({ taux: 0.94, source: 'facture' });
    expect(tauxVersChf(eur)).toEqual({ taux: 0.93, source: 'BCE' });
  });

  it('un prix écrit par le brasseur garde le sien : ni le HT, ni le cours de la page ne s’y accrochent', () => {
    const lignes = lireReponse({ lignes: [{ sorte: 'article', texte: 'Cuve 45 L, 900 CHF', url: LIEN, carnetId: ID_VENTILATION, prix: 900, devise: 'CHF' }] },
      { texte: `cuve 45 L 900 CHF ${LIEN}`, carnets: [{ id: ID_VENTILATION, titre: 'Ventilation' }], depuis: ID_VENTILATION, pages: [pageUsd], origine: 'exemple' })!;
    const l = depuisIA(lignes[0], { carnetId: ID_VENTILATION }) as Record<string, unknown>;
    expect(l).toMatchObject({ prixCentimes: 90000, devise: 'CHF' });
    expect(l.taxe).toBeUndefined();
    expect(l.change).toBeUndefined();
    expect(l.livraison).toMatchObject({ prixCentimes: 4900, devise: 'USD' });
  });

  it('poser son propre prix en francs retire la taxe, le TTC et le cours du prix lu d’avant', () => {
    const etat = fixtureCarnets();
    const { ligne } = articleDe(pageUsd);
    const r = ranger(etat, { message: { id: 'MSG-U', texte: LIEN, le: LE, depuis: ID_VENTILATION, rangement: 'simulee' }, lignes: [ligne] });
    if (!r.ok) throw new Error(r.raison);
    const m = magasinMemoire(etat);
    m.appliquer(r.ecritures);
    const avant = m.lire().map(i => lireCarnet(i)).find((d): d is CarnetDoc => !!d && d.id === ID_VENTILATION)!.carnet.articles.find(x => x.url === LIEN)!;
    const p = poserPrixArticle(m.lire(), { carnetId: ID_VENTILATION, articleId: avant.id, centimes: 100000 });
    if (!p.ok) throw new Error(p.raison);
    m.appliquer(p.ecritures);
    const apres = m.lire().map(i => lireCarnet(i)).find((d): d is CarnetDoc => !!d && d.id === ID_VENTILATION)!.carnet.articles.find(x => x.id === avant.id)!;
    expect(apres).toMatchObject({ prixCentimes: 100000, devise: 'CHF' });
    expect(apres.taxe).toBeUndefined();
    expect(apres.change).toBeUndefined();
  });
});

describe('D447 : les états de la page', () => {
  it('« plus disponible » se dit, et n’est pas une rupture', () => {
    const { article } = articleDe({ ...pageUsd, dispo: 'retire' });
    expect(article.dispo).toBe('plus disponible');
    expect(dispoDe(article)).toBe('plus disponible');
  });

  it('« introuvable » : le lien ne mène plus à la fiche ; ni prix, ni photo, ni valeur inventés', () => {
    const morte: PageLue = { url: LIEN, domaine: 'boutique-exemple.invalid', statut: 'introuvable', luLe: 1, etapes: [{ nom: 'page', statut: 'absent', detail: 'introuvable' }] };
    const { article: a } = articleDe(morte, { titre: undefined });
    expect(a.lecture).toBe('introuvable');
    expect(a.prixCentimes).toBeUndefined();
    expect(a.photo).toBeUndefined();
    expect(a.photos).toBeUndefined();
    expect(a.taxe).toBeUndefined();
    expect(a.livraison).toBeUndefined();
    expect(dispoDe(a)).toBe('lien introuvable');
    const html = texte(renderToStaticMarkup(<CarteArticle article={{ ...a, nom: undefined }} />));
    expect(html).toContain('Lien introuvable');
    expect(html).toContain('rien n’a été lu');
  });

  it('une page illisible reste « illisible » (pas « introuvable »)', () => {
    const { article: a } = articleDe({ url: LIEN, domaine: 'boutique-exemple.invalid', statut: 'bloquee', luLe: 1 });
    expect(a.lecture).toBe('illisible');
  });
});

describe('D447 : l’affichage, aux places existantes', () => {
  const art = (): ArticleV => articleDe(pageUsd).article;

  it('la pastille : le rendu estimé en CHF, l’original et sa devise, HT', () => {
    const html = texte(renderToStaticMarkup(<PrixPastille article={art()} />));
    expect(html).toContain('≈');
    expect(html).toContain('CHF rendu');
    expect(html).toContain('1 450 USD HT');
    expect(html).toContain('data-eur');
  });

  it('la pastille sans cours : le prix en USD, « cours ? », jamais converti', () => {
    const html = texte(renderToStaticMarkup(<PrixPastille article={{ ...art(), change: undefined }} />));
    expect(html).toContain('1 450 USD HT');
    expect(html).toContain('cours ?');
    expect(html).not.toContain('CHF rendu');
  });

  it('le détail : le cours BCE daté, le port lu, la mention des frais', () => {
    const html = texte(renderToStaticMarkup(<PrixRenduDetail article={art()} />));
    expect(html).toContain('cours BCE du 23 nov.');
    expect(html).toContain('port 49 USD');
    expect(html).toContain('douane et envoi non comptés');
    expect(html).not.toContain('Changer le taux');
  });

  it('la pastille en francs : « HT » dit, le port lu dit, rien d’autre', () => {
    const chf: ArticleV = { ...art(), devise: 'CHF', change: undefined, livraison: { prixCentimes: 490, devise: 'CHF' }, prixCentimes: 129000 };
    const html = texte(renderToStaticMarkup(<PrixPastille article={chf} />));
    expect(html).toContain('CHF HT');
    expect(html).toContain('port 4,90 CHF');
    expect(html).not.toContain('douane');
  });

  it('la carte : le prix converti, l’original, la mention, et « plus disponible » en pastille d’attente', () => {
    const html = texte(renderToStaticMarkup(<CarteArticle article={{ ...art(), dispo: 'plus disponible' }} variante="complete" />));
    expect(html).toContain('≈1 160');
    expect(html).toContain('1 450 USD HT');
    expect(html).toContain('douane et envoi non comptés');
    expect(html).toContain('cn-pastille-att');
    expect(html).toContain('plus disponible');
  });

  it('la fiche : toutes les photos, une à la fois, ‹ › et leur rang', () => {
    render(<FicheArticle article={art()} titreCarnet="Fermentation" onRetour={() => undefined} onVeille={() => undefined} />);
    expect(screen.getByText('1/3')).toBeTruthy();
    expect((screen.getByRole('img', { name: /photo 1 sur 3/ }) as HTMLImageElement).src).toBe(PHOTOS[0]);
    expect((screen.getByLabelText('Photo précédente') as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByLabelText('Photo suivante'));
    expect(screen.getByText('2/3')).toBeTruthy();
    expect((screen.getByRole('img', { name: /photo 2 sur 3/ }) as HTMLImageElement).src).toBe(PHOTOS[1]);
    fireEvent.click(screen.getByLabelText('Photo suivante'));
    expect((screen.getByLabelText('Photo suivante') as HTMLButtonElement).disabled).toBe(true);
  });

  it('la fiche d’une seule photo : aucune flèche, aucun rang', () => {
    render(<FicheArticle article={{ ...art(), photos: undefined }} titreCarnet="Fermentation" onRetour={() => undefined} onVeille={() => undefined} />);
    expect(screen.queryByLabelText('Photo suivante')).toBeNull();
    expect(screen.queryByText(/\d\/\d/)).toBeNull();
  });
});
