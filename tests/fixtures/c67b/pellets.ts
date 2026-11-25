/**
 * Voie c67b-tests (25.11) : le carnet de houblons du test en ligne du tour 67 (Citra : MotlerHops en euros, Hopfenmarkt en francs), tiré de la fixture
 * du tour 66 (tests/fixtures/c66/carnets.json) ; Brau n'y est pas (une page sans prix). Données de test (« ZZ TEST — »), aucune donnée réelle.
 */
import { readFileSync } from 'node:fs';
import { ID_VENTILATION, fixtureCarnets } from '../../../src/domain/carnets/fixture';
import { lireCarnet, type Article, type CarnetDoc, type Valeur } from '../../../src/domain/carnets/modele';

type Ligne = { nom: string; valeur: string; unite?: string };
interface ArticleFix { id: string; nom: string; vendeur: string; pays: string; dispo: string; lignes: Ligne[]; prixCentimes?: number; devise?: string; taxe?: 'ht' | 'ttc'; change?: { taux: number; date: string; source: 'BCE' }; conditionnement?: { valeur: number; unite: string }; offres?: unknown[] }
const F66 = JSON.parse(readFileSync('tests/fixtures/c66/carnets.json', 'utf8')) as { pellets: { titre: string; articles: ArticleFix[] } };

export const TITRE_PELLETS = F66.pellets.titre;
export const ID_PELLETS = 'ZZ-C67B-PELLETS';

const valeursDe = (liste: Ligne[]): Article['valeurs'] => {
  const sortie: Article['valeurs'] = {};
  for (const e of liste) {
    const numerique = !!e.unite && /^[\d,.]+$/.test(e.valeur);
    sortie[e.nom] = (numerique ? { valeur: Number(e.valeur.replace(',', '.')), unite: e.unite, origine: 'page' } : { valeur: e.valeur, ...(e.unite ? { unite: e.unite } : {}), origine: 'page' }) as Valeur;
  }
  return sortie;
};

/** Le carnet de pellets : MotlerHops (3,72 € les 50 g, 40,69 € le kilo) et Hopfenmarkt (6,70 CHF les 100 g, 62,20 CHF le kilo). */
export function pelletsC67b(): CarnetDoc {
  const b = lireCarnet(fixtureCarnets().find(i => i.id === ID_VENTILATION)!)!;
  return {
    ...b, id: ID_PELLETS, title: TITRE_PELLETS,
    carnet: {
      ...b.carnet, criteres: [], facons: [], notes: [], photos: [], choix: undefined, sortie: undefined, archive: undefined,
      articles: F66.pellets.articles.filter(a => a.id !== 'B1').map(a => ({
        id: a.id, nom: a.nom, domaine: 'boutique-exemple.test', url: `https://www.boutique-exemple.test/${a.id}`, lecture: 'lue', dispo: a.dispo, vendeur: a.vendeur, pays: a.pays, valeurs: valeursDe(a.lignes),
        ...(a.prixCentimes !== undefined ? { prixCentimes: a.prixCentimes, devise: a.devise ?? 'CHF', taxe: a.taxe ?? 'ttc' } : {}),
        ...(a.change ? { change: a.change } : {}), ...(a.conditionnement ? { conditionnement: a.conditionnement } : {}), ...(a.offres ? { offres: a.offres } : {})
      }) as Article)
    }
  } as CarnetDoc;
}

/* ------------------------------------------------------------------------------------------------ avec Brau (la vraie page lue le 23.11, tirée par `relireArticle` comme l'app) */
import { gunzipSync } from 'node:zlib';
import { appliquerEcritures, relireArticle } from '../../../src/domain/carnets/operations';
import { lireCarnets } from '../../../src/domain/carnets/modele';
import { lirePage } from '../../../functions/src/lireLien';

const HTML_BRAU = gunzipSync(readFileSync('tests/fixtures/c64/brau-citra-136.html.gz')).toString('utf8');
const URL_BRAU = 'https://www.brauundrauchshop.ch/citra-136-2';

/** Brau tel que « Relire » l'a gardé : prix à l'unité, paliers, quantité. */
function brauGarde(): Article {
  const b = lireCarnet(fixtureCarnets().find(i => i.id === ID_VENTILATION)!)!;
  const page = { ...(lirePage(HTML_BRAU, new URL(URL_BRAU), 1) as object), statut: 'lue', luLe: 0 };
  const doc = { ...b, carnet: { ...b.carnet, articles: [{ id: 'B1', nom: 'Citra 13.6%', url: URL_BRAU, lecture: 'lue', valeurs: {} }] } } as unknown as CarnetDoc;
  const etat = [doc as never];
  const r = relireArticle(etat, { carnetId: doc.id, articleId: 'B1', page: page as never, le: '2026-11-24T10:00:00.000Z' });
  if (!r.ok) throw new Error(`relire refusé : ${r.raison}`);
  return lireCarnets(appliquerEcritures(etat, r.ecritures))[0].carnet.articles[0] as Article;
}

/** Les trois vendeurs du test en ligne : Hopfenmarkt, MotlerHops et Brau (tel que Relire l'a gardé). */
export function pelletsTrois(): CarnetDoc {
  const c = pelletsC67b();
  const fixe = F66.pellets.articles.find(a => a.id === 'B1')!;
  const brau = brauGarde();
  const valeurs = { ...valeursDe(fixe.lignes), ...brau.valeurs };
  const article = { ...brau, id: 'B1', nom: 'Citra 13.6%', vendeur: fixe.vendeur, pays: fixe.pays, dispo: fixe.dispo, domaine: 'brauundrauchshop.ch', valeurs } as Article;
  return { ...c, carnet: { ...c.carnet, articles: [...c.carnet.articles, article] } } as CarnetDoc;
}
