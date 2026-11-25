/**
 * Voie note-tests (25.11) : le carnet de houblons du test en ligne du tour 73 (« Houblons citra »), ses notes, les réponses SIMULÉES de l'IA et les pages lues.
 *
 * DONNÉES DE TEST : carnet « ZZ TEST — », vendeurs et sites inventés (« -exemple.fr », « -exemple.ch »), aucune donnée réelle.
 *
 * SIMULÉ (et marqué ainsi) : les réponses de l'IA ci-dessous ont la FORME de functions/src/carnetIA.ts (`sujet`, `lignes` : sorte, genre, texte, carnetId,
 * citation, url...), plus le champ `articleId` que la règle N1 demande (le contrat à créer). Aucune réponse réelle n'a été relevée pour ces cas :
 * DEMANDE RELEVE (voir RESULTAT.md). La lecture de la page « frais d'envoi » est simulée de la même façon : lirePage (réelle) sur la page HTML
 * anonyme, puis le port lu à la main (livraison 7,50 €).
 */
import { readFileSync } from 'node:fs';
import { lirePage } from '../../../functions/src/lireLien';
import type { PageLue } from '../../../functions/src/carnetIA';
import type { Article, CarnetDoc } from '../../../src/domain/carnets/modele';
import { ID_PELLETS, pelletsC67b } from '../c67b/pellets';

export const ID_HOUBLONS = ID_PELLETS;
export const ID_MOTLER = 'M1';
export const ID_HOPFEN = 'HM';
export const DOMAINE_MOTLER = 'motlerhops-exemple.fr';
export const DOMAINE_HOPFEN = 'hopfenmarkt-exemple.ch';

/** Le carnet de houblons : MotlerHops (site .fr, 3,72 € les 50 g, en stock, 1er au prix) et Hopfenmarkt (site .ch, 6,70 CHF les 100 g, en stock). */
export function houblonsZZ(): CarnetDoc {
  const c = pelletsC67b();
  const sites: Record<string, string> = { M1: DOMAINE_MOTLER, HM: DOMAINE_HOPFEN };
  return {
    ...c, title: 'ZZ TEST — Houblons citra',
    carnet: { ...c.carnet, articles: c.carnet.articles.map((a): Article => ({ ...a, domaine: sites[a.id], url: `https://www.${sites[a.id]}/citra-pellets` })) }
  } as CarnetDoc;
}

/** Le même carnet, mais les DEUX sites sont français : « le site français » désigne alors deux articles (aucun rattachement permis). */
export function houblonsDeuxSitesFr(): CarnetDoc {
  const c = houblonsZZ();
  return {
    ...c,
    carnet: { ...c.carnet, articles: c.carnet.articles.map((a): Article => a.id === ID_HOPFEN
      ? { ...a, domaine: 'houblonsdebretagne-exemple.fr', url: 'https://www.houblonsdebretagne-exemple.fr/citra-pellets', vendeur: 'Houblons de Bretagne', pays: 'FR' } : a) }
  } as CarnetDoc;
}

export type FormeNote = 'dispo' | 'qualite' | 'delai';
export interface CasNote {
  forme: FormeNote;
  /** La phrase tapée par le brasseur, telle quelle. */
  texte: string;
  /** Le passage qui désigne l'article (sous-chaîne exacte du texte). */
  citation: string;
  /** L'article que la note concerne. */
  articleId: string;
  /** Le vendeur de cet article, dit sur l'écran. */
  vendeur: string;
  /** Les mots du brasseur que l'écran doit citer tels quels (N3). */
  motsDits: string;
  /** Ce qu'une réécriture SIMULÉE de l'IA dirait en plus sûr (« semble » devenu certitude) : ne doit jamais s'afficher. */
  reecriture: string;
  /** Le sujet du fait. */
  sujet: RegExp;
}

/** Trois notes de formes différentes (dispo, qualité, délai), pas seulement celle de l'exemple du brasseur. */
export const NOTES: CasNote[] = [
  { forme: 'dispo', texte: 'ZZ TEST — le site français semble ne plus avoir de stock', citation: 'site français', articleId: ID_MOTLER, vendeur: 'MotlerHops',
    motsDits: 'semble ne plus avoir de stock', reecriture: 'Le site français n’a plus de stock.', sujet: /dispo/i },
  { forme: 'qualite', texte: 'ZZ TEST — sur le site suisse les pellets étaient un peu éventés la dernière fois', citation: 'site suisse', articleId: ID_HOPFEN, vendeur: 'Hopfenmarkt',
    motsDits: 'un peu éventés', reecriture: 'Les pellets du site suisse sont éventés.', sujet: /qualit/i },
  { forme: 'delai', texte: 'ZZ TEST — MotlerHops met trois semaines à livrer en ce moment', citation: 'MotlerHops', articleId: ID_MOTLER, vendeur: 'MotlerHops',
    motsDits: 'trois semaines à livrer', reecriture: 'MotlerHops livre en 21 jours.', sujet: /d[ée]lai|livraison/i }
];

/**
 * SIMULÉE : la réponse de l'IA (forme de carnetIA.ts) pour une note tapée dans le carnet ouvert : une ligne « note » rangée dans le carnet, qui désigne
 * l'article (`articleId`) en citant le passage. Son `texte` est une réécriture (l'IA « met en forme ») : l'écran doit montrer les mots du brasseur, pas ce texte.
 */
export const reponseNote = (cas: CasNote, o: { articleId?: string; citation?: string } = {}) => ({
  sujet: null,
  lignes: [{
    sorte: 'note', genre: 'note', texte: cas.reecriture, carnetId: ID_HOUBLONS,
    articleId: o.articleId ?? cas.articleId, citation: o.citation ?? cas.citation
  }]
});

/** Une page d'information (aucun produit) : sa fixture HTML, son adresse (le site du vendeur de l'article M1), et ce que l'IA simulée en fait. */
export interface PageInfo { forme: 'frais' | 'conditions' | 'guide'; fichier: string; url: string; message: string; nom: string }
export const PAGES_INFO: PageInfo[] = [
  { forme: 'frais', fichier: 'frais-envoi.html', url: `https://www.${DOMAINE_MOTLER}/frais-d-envoi`, nom: 'Frais d’envoi et livraison',
    message: `ZZ TEST — frais d'envoi de MotlerHops https://www.${DOMAINE_MOTLER}/frais-d-envoi` },
  { forme: 'conditions', fichier: 'conditions-vente.html', url: `https://www.${DOMAINE_MOTLER}/conditions-de-vente`, nom: 'Conditions générales de vente',
    message: `ZZ TEST — leurs conditions de vente https://www.${DOMAINE_MOTLER}/conditions-de-vente` },
  { forme: 'guide', fichier: 'guide-stockage.html', url: 'https://www.guide-houblon-exemple.org/conserver-ses-houblons', nom: 'Conserver ses houblons : le guide',
    message: 'ZZ TEST — un guide de conservation https://www.guide-houblon-exemple.org/conserver-ses-houblons' }
];

/** SIMULÉE : la page lue d'un lien d'information (lirePage réelle sur la fixture ; pour les frais d'envoi, le port lu à la main : 7,50 € vers la Suisse). */
export function pageInfoLue(p: PageInfo): PageLue {
  const html = readFileSync(`tests/fixtures/note/${p.fichier}`, 'utf8');
  const brut = lirePage(html, new URL(p.url), 1);
  return { ...brut, statut: 'lue', nom: p.nom, luLe: 1, ...(p.forme === 'frais' ? { livraison: { prix: 7.5, devise: 'EUR' }, vendeur: 'MotlerHops' } : {}) } as PageLue;
}

/** SIMULÉE : l'IA range le lien comme la consigne actuelle le dit d'une page sans prix (une note portant le lien) ; ou, mal, comme un ARTICLE (le défaut du brasseur). */
export const reponseLien = (p: PageInfo, comme: 'note' | 'article') => ({
  sujet: null,
  lignes: [comme === 'note'
    ? { sorte: 'note', genre: 'note', texte: p.nom, carnetId: ID_HOUBLONS, url: p.url }
    : { sorte: 'article', texte: p.nom, titre: p.nom, carnetId: ID_HOUBLONS, url: p.url }]
});
