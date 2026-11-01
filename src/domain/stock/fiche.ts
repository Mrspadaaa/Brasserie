import type { CatalogueHop } from '../hopIndex/v4/data';
import { plier, varieteDe } from '../hopIndex/v4/donneesApp';
import { NOMS, normaliser, slugBeerAnalytics } from '../fermentables/noms';
import type { Contexte } from './donnees';

/**
 * La fiche la plus proche d'un article neuf, dans les catalogues DU DÉPÔT seulement (voie s6-fiche, D215, T8) : les variétés de l'index des houblons et la table
 * des fermentescibles de a1. Jamais Gemini, jamais le réseau : les catalogues sont passés en argument (le catalogue plein des houblons, ou rien).
 * Une recherche sans réponse sûre rend `undefined` : aucune fiche devinée. Les levures n'ont pas de fiche (T11 : le risque est une fausse fiche de souche).
 */
export interface Catalogues { houblons?: readonly CatalogueHop[] }
export interface FicheTrouvee { id: string; nom: string; approchee: boolean }

/** Pays du catalogue (en français) d'un code d'origine. `UK` et `GB` sont le même pays. Un code absent de la table n'a pas de pays connu. */
const PAYS_DU_CODE: Readonly<Record<string, string>> = {
  US: 'États-Unis', DE: 'Allemagne', UK: 'Royaume-Uni', GB: 'Royaume-Uni', NZ: 'Nouvelle-Zélande', AU: 'Australie', CZ: 'Tchéquie', SI: 'Slovénie', FR: 'France', PL: 'Pologne',
};
const CODE_DU_PAYS: Readonly<Record<string, string>> = Object.fromEntries(Object.entries(PAYS_DU_CODE).reverse().map(([code, pays]) => [pays, code]));
const sansRecolte = (nom: string) => nom.replace(/\s+20[0-3]\d$/, '').trim();

function nomDeVariete(h: CatalogueHop): string {
  if (/\([A-Z]{2}\)/.test(h.name)) return h.name.replace(/[()]/g, '');
  const code = h.origin ? CODE_DU_PAYS[h.origin] : undefined;
  return code ? `${h.name} ${code}` : h.name;
}

function ficheHoublon(nom: string, origine: string | undefined, alpha: number | undefined, catalogue: readonly CatalogueHop[]): FicheTrouvee | undefined {
  const cat = catalogue as CatalogueHop[];
  // D215 : une fiche dédiée d'abord (« Saaz US » → « Saaz (US) »), puis la variété de ce nom.
  let h: CatalogueHop | undefined, dediee = false;
  if (origine) {
    const r = varieteDe(`${nom} ${origine}`, cat);
    if ('h' in r && plier(r.h.name) === plier(`${nom} ${origine}`)) { h = r.h; dediee = true; }
  }
  if (!h) { const r = varieteDe(nom, cat); if ('h' in r) h = r.h; }
  if (!h) return undefined;
  const pays = origine ? PAYS_DU_CODE[origine] : undefined;
  const autreOrigine = !dediee && origine !== undefined && (pays === undefined || h.origin == null || pays !== h.origin);
  const horsPlage = alpha !== undefined && !!h.alpha && (alpha < h.alpha[0] - 1e-9 || alpha > h.alpha[1] + 1e-9);
  return { id: h.id, nom: nomDeVariete(h), approchee: autreOrigine || horsPlage };
}

function ficheFermentable(nom: string): FicheTrouvee | undefined {
  const slug = slugBeerAnalytics(nom);
  const entree = slug ? NOMS.find(n => n.slug === slug) : undefined;
  if (!slug || !entree) return undefined;
  // « Exacte » seulement pour le nom canonique (ou le nom anglais) de la fiche ; un alias court (« pale », « golden ») est approché.
  // Aucune plage d'EBC dans les catalogues du dépôt : la teinte lue ne peut pas encore sortir de la plage d'une fiche.
  const exacte = [entree.canonique, entree.ba].some(n => normaliser(n) === normaliser(nom));
  return { id: slug, nom: entree.canonique, approchee: !exacte };
}

/**
 * La fiche la plus proche de `nom` (nom propre du produit), selon `contexte` : houblon → variété de l'index (origine et α lus rendent la fiche « approchée »),
 * malt ou autre ingrédient → table des fermentescibles, levure → rien. `ebc` est accepté pour le jour où un catalogue en donnera la plage.
 */
export function ficheLaPlusProche(nom: string, contexte: Contexte, origine: string | undefined, alpha: number | undefined, _ebc: number | undefined, cat: Catalogues): FicheTrouvee | undefined {
  const propre = sansRecolte(nom);
  if (!propre) return undefined;
  if (contexte === 'Houblon') return cat.houblons?.length ? ficheHoublon(propre, origine, alpha, cat.houblons) : undefined;
  if (contexte === 'Levure') return undefined;
  return ficheFermentable(propre);
}

/** Le nom affiché d'une fiche (« Cascade US »), lu dans le catalogue à partir de son identifiant ; `undefined` si le catalogue n'est pas là. */
export function nomDeFiche(id: string, cat: Catalogues): string | undefined {
  const h = cat.houblons?.find(x => x.id === id);
  if (h) return nomDeVariete(h);
  return NOMS.find(n => n.slug === id)?.canonique;
}
