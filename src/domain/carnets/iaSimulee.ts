/**
 * Carnet d'idées (lot B) : la réponse SIMULÉE de `rangerCarnet` et de `lireLien`, pour le banc (`?preview=carnets`, `?dev-local`) et
 * les tests. Déterministe, marquée « exemple » (`exemple: true` ; le garde pose `origine: 'exemple'`). Aucun appel réseau.
 *
 * Ce fichier est le seul (avec la fixture du lot A) où des objets sont nommés : il joue le rôle du modèle sur les cas du banc
 * (embouteillage, frigo, ventilation, évier, les trois notes de son téléphone `ref/`, les liens de la fixture, les aides G11, G25 à
 * G27 et G29). Le code de l'app n'a aucun gabarit par objet (C2) : les caractéristiques viennent de la réponse, réelle ou simulée.
 * Les pages simulées portent des domaines fictifs, et leurs prix sont des exemples.
 */
import { nombreFr } from '../nombreAffiche';
import type { ContexteRangerCarnet, EtapeLien, PageLue } from '../../../functions/src/carnetIA';
import { liensDuTexte, sansAccents } from './ia';
import { fixtureCarnets } from './fixture';
import { prixLus, sansLiensNiPrix, titreNeufDe, type CarnetDoc } from './modele';
import { extraireCriteres, genreDEtiquette, genreLocal, jetons as jetonsLocaux, mettreEnForme, objetDe, parleDuBrassin, phrasesEtiquetees, quantitesDe, sansPrefixeBanc, TITRE_BRASSIN, urlsDe } from './analyseLocale';
import { aucunCarnetNEnParle, rattacher } from './rattacher';

type Brut = Record<string, unknown>;
export interface ReponseSimulee { lignes: Brut[]; exemple: true }
type Carnet = ContexteRangerCarnet['carnets'][number];

/** Réponses de panne, pour le banc (`&ia=echec`) et les tests (B2) : hors schéma, vide. */
export const REPONSE_HORS_SCHEMA: unknown = { effets: [{ sorte: 'tache', titre: 'pas la bonne forme' }] };
export const REPONSE_VIDE: unknown = { lignes: [] };

/** Pages produits simulées (domaines fictifs). Le prix et la disponibilité sont des exemples. */
export const PAGES_SIMULEES: Readonly<Record<string, Omit<PageLue, 'url' | 'luLe'>>> = {
  'pompe-inox.ch': {
    domaine: 'pompe-inox.ch', statut: 'lue', nom: 'Pompe de transfert inox', prix: 690, devise: 'CHF', dispo: 'en-stock', vendeur: 'Pompe Inox',
    valeurs: [{ nom: 'débit', valeur: '40', unite: 'L/min' }, { nom: 'température max', valeur: '90', unite: '°C' }]
  },
  'pompe-magnetique.ch': {
    domaine: 'pompe-magnetique.ch', statut: 'lue', nom: 'Pompe magnétique 12 V', prix: 245, devise: 'CHF', dispo: 'en-stock',
    valeurs: [{ nom: 'débit', valeur: '25', unite: 'L/min' }, { nom: 'température max', valeur: '100', unite: '°C' }]
  },
  'evier-pro.ch': {
    domaine: 'evier-pro.ch', statut: 'lue', nom: 'Évier inox Riviera 2 bacs', prix: 1450, devise: 'CHF', dispo: 'rupture', vendeur: 'Evier Pro',
    valeurs: [{ nom: 'fond de bac', valeur: '38', unite: 'cm' }, { nom: 'bacs', valeur: '2' }]
  },
  'plaque-froid.ch': { domaine: 'plaque-froid.ch', statut: 'lue', nom: 'Échangeur à plaques 30 plaques', photo: 'https://plaque-froid.ch/img/echangeur.jpg' }
};

/* ───── Banc : pages simulées sur `exemple.invalid` (P4, CRITIQUE-1 ; R15, R17, g5:v06-10) ───── */

/** La puce « Coller : … » (R15, g5:v07-10) : le lien d'exemple que le banc propose de coller. */
export const LIEN_COLLER_BANC = 'https://exemple.invalid/plaque-froid/echangeur-30';
/** La seule adresse volontairement illisible (état 21 : « lien · page non lue ») : l'article ZZ-V-A5 de la fixture. */
export const LIEN_ILLISIBLE_BANC = 'https://exemple.invalid/v5';

/**
 * Pages simulées, par adresse (domaine fictif `exemple.invalid`, sans `www.`, chemin sans `/` final). Tout y est **exemple** : noms,
 * vendeurs, prix, valeurs. Aucune page ne pose de veille (R31 : éteinte à la naissance, il l'allume dans la fiche).
 * - `hotte-140` : la carte complète de g5:v06-10, dans Ventilation (« tient 80 °C : oui », débit) ;
 * - `pompe-inox`, `pompe-magnetique` : g5:v06-10 et g5:v06-11 (le 2e lien fait naître le tableau), collés depuis la liste ;
 * - `evier-riviera` : G19, dans Évier (« fond de bac 38 cm ») ; `evier-sur-pieds` : le 2e évier d'un lien « ZZ TEST » (`…-evier-b`) ;
 * - `plaque-froid/echangeur-30` : la puce « Coller : … » (R15).
 */
export const PAGES_BANC: Readonly<Record<string, Omit<PageLue, 'url' | 'luLe' | 'domaine'>>> = {
  'exemple.invalid/hotte-140': {
    statut: 'lue', nom: 'Hotte inox 140 cm + extracteur', prix: 1980, devise: 'CHF', dispo: 'en-stock', vendeur: 'Inox Exemple',
    valeurs: [{ nom: 'débit', valeur: '2000', unite: 'm³/h' }, { nom: 'tient 80 °C', valeur: 'oui' }]
  },
  /* critique 6, n° 11 (G20) : la 2e hotte du banc, pour que le 2e lien collé fasse naître le tableau */
  'exemple.invalid/hotte-murale-100': {
    statut: 'lue', nom: 'Hotte murale 100 cm', prix: 1450, devise: 'CHF', dispo: 'en-stock', vendeur: 'Murale Exemple',
    valeurs: [{ nom: 'débit', valeur: '1200', unite: 'm³/h' }, { nom: 'tient 80 °C', valeur: 'oui' }]
  },
  'exemple.invalid/pompe-inox': {
    statut: 'lue', nom: 'Pompe de transfert inox', prix: 690, devise: 'CHF', dispo: 'en-stock', vendeur: 'Pompe Exemple',
    valeurs: [{ nom: 'débit', valeur: '40', unite: 'L/min' }, { nom: 'température max', valeur: '90', unite: '°C' }, { nom: 'tient 80 °C', valeur: 'oui' }]
  },
  'exemple.invalid/pompe-magnetique': {
    statut: 'lue', nom: 'Pompe magnétique 12 V', prix: 245, devise: 'CHF', dispo: 'en-stock', vendeur: 'Aimant Exemple',
    valeurs: [{ nom: 'débit', valeur: '25', unite: 'L/min' }, { nom: 'température max', valeur: '100', unite: '°C' }, { nom: 'tient 80 °C', valeur: 'oui' }]
  },
  'exemple.invalid/evier-riviera': {
    statut: 'lue', nom: 'Évier inox Riviera 2 bacs', prix: 1450, devise: 'CHF', dispo: 'rupture', vendeur: 'Évier Exemple',
    valeurs: [{ nom: 'fond de bac', valeur: '38', unite: 'cm' }, { nom: 'bacs', valeur: '2' }]
  },
  'exemple.invalid/evier-sur-pieds': {
    statut: 'lue', nom: 'Évier inox sur pieds 1 bac', prix: 890, devise: 'CHF', dispo: 'en-stock', vendeur: 'Gastro Exemple',
    valeurs: [{ nom: 'fond de bac', valeur: '32', unite: 'cm' }, { nom: 'bacs', valeur: '1' }]
  },
  'exemple.invalid/plaque-froid/echangeur-30': {
    statut: 'lue', nom: 'Échangeur à plaques 30 plaques', prix: 320, devise: 'CHF', dispo: 'en-stock', vendeur: 'Froid Exemple',
    valeurs: [{ nom: 'plaques', valeur: '30' }, { nom: 'débit', valeur: '20', unite: 'L/min' }]
  }
};

/**
 * D446, D447 (23.11) : les états que `lireLien` rend désormais, au banc (exemple), à part de `PAGES_BANC` (dont les tests exigent des prix en
 * CHF) : hors franc converti au cours simulé, HT, port lu, trois photos ; « plus disponible » ; lien mort. Les cours et les photos sont
 * simulés : ils ne servent qu'à voir l'écran.
 */
export const PAGES_BANC_ETATS: Readonly<Record<string, Omit<PageLue, 'url' | 'luLe' | 'domaine'>>> = {
  'exemple.invalid/cuve-usd': {
    statut: 'lue', nom: 'Cuve conique 45 L (exemple)', prix: 1450, devise: 'USD', taxe: 'ht', dispo: 'en-stock', vendeur: 'Brewgear Exemple',
    photo: "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'320'%20height%3D'200'%3E%3Crect%20width%3D'320'%20height%3D'200'%20fill%3D'%234a6b8a'%2F%3E%3Ctext%20x%3D'160'%20y%3D'108'%20font-size%3D'28'%20text-anchor%3D'middle'%20fill%3D'white'%20font-family%3D'sans-serif'%3Ecuve%201%3C%2Ftext%3E%3C%2Fsvg%3E",
    photos: ["data:image/svg+xml;utf8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'320'%20height%3D'200'%3E%3Crect%20width%3D'320'%20height%3D'200'%20fill%3D'%234a6b8a'%2F%3E%3Ctext%20x%3D'160'%20y%3D'108'%20font-size%3D'28'%20text-anchor%3D'middle'%20fill%3D'white'%20font-family%3D'sans-serif'%3Ecuve%201%3C%2Ftext%3E%3C%2Fsvg%3E", "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'320'%20height%3D'200'%3E%3Crect%20width%3D'320'%20height%3D'200'%20fill%3D'%237a5a3a'%2F%3E%3Ctext%20x%3D'160'%20y%3D'108'%20font-size%3D'28'%20text-anchor%3D'middle'%20fill%3D'white'%20font-family%3D'sans-serif'%3Ecuve%202%3C%2Ftext%3E%3C%2Fsvg%3E", "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'320'%20height%3D'200'%3E%3Crect%20width%3D'320'%20height%3D'200'%20fill%3D'%234f7a4f'%2F%3E%3Ctext%20x%3D'160'%20y%3D'108'%20font-size%3D'28'%20text-anchor%3D'middle'%20fill%3D'white'%20font-family%3D'sans-serif'%3Ecuve%203%3C%2Ftext%3E%3C%2Fsvg%3E"],
    livraison: { prix: 49, devise: 'USD' }, change: { taux: 0.8, date: '2026-11-23', source: 'BCE' },
    valeurs: [{ nom: 'volume', valeur: '45', unite: 'L' }]
  },
  'exemple.invalid/cuve-retiree': {
    statut: 'lue', nom: 'Cuve inox 30 L (exemple)', prix: 980, devise: 'CHF', dispo: 'retire', vendeur: 'Inox Exemple',
    valeurs: [{ nom: 'volume', valeur: '30', unite: 'L' }]
  },
  'exemple.invalid/cuve-morte': { statut: 'introuvable', etapes: [{ nom: 'page', statut: 'absent', detail: 'introuvable' }] },
  /* D448 (étapes visibles, banc) : un prix étranger sans douane ni TVA d'import (étape douteuse, v03-2) ; une page que le site refuse au
     robot, lue par Google (« page bloquée, lue par Google »). */
  'exemple.invalid/hotte-douteuse': {
    statut: 'lue', nom: 'Hotte murale inox 140 cm + moteur (exemple)', prix: 1690, devise: 'EUR', vendeur: 'Lüftung Nord', dispo: 'en-stock',
    livraison: { prix: 95, devise: 'EUR' }, change: { taux: 0.93, date: '2026-11-23', source: 'BCE' },
    valeurs: [{ nom: 'débit', valeur: '1200', unite: 'm³/h' }, { nom: 'bruit', valeur: '58', unite: 'dB' }, { nom: 'gaine', valeur: '200', unite: 'mm' }]
  },
  'exemple.invalid/hotte-bloquee': {
    statut: 'lue', nom: 'Hotte inox 120 cm (exemple)', prix: 1450, devise: 'CHF', vendeur: 'Gastro Exemple',
    valeurs: [{ nom: 'débit', valeur: '1000', unite: 'm³/h' }],
    etapes: [{ nom: 'page', statut: 'absent', detail: 'bloquee' }, { nom: 'bloquee', statut: 'trouve', detail: 'lue par Google : nom, prix' },
      { nom: 'prix', statut: 'trouve', detail: '1450 CHF (lu par Google)' }, { nom: 'photos', statut: 'absent', detail: 'photo non lue : Google ne rend pas la photo' },
      { nom: 'caract', statut: 'trouve', detail: '1 (lues par Google)' }]
  },
};

/**
 * P8 : ce qu'une page simulée dit lu. Chaque caractéristique a sa valeur (et son unité quand elle en a une) ; aucune caractéristique
 * sans valeur ; chaque nom une seule fois. Sert au banc et aux tests (une page qui manquerait à ces règles est une faute du banc).
 */
export function caracteristiquesLues(page: Pick<PageLue, 'valeurs'>): Array<{ nom: string; valeur: string; unite?: string }> {
  const vus = new Set<string>();
  return (page.valeurs ?? []).filter((v) => {
    const cle = sansAccents(v.nom);
    if (!v.valeur.trim() || vus.has(cle)) return false;
    vus.add(cle);
    return true;
  });
}

/** `exemple.invalid/hotte-140` : la clé d'une adresse (sans schéma, sans `www.`, sans `/` final, sans requête). `null` si illisible. */
export function cleUrl(url: string): string | null {
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^www\./, '')}${u.pathname.replace(/\/+$/, '')}`;
  } catch { return null; }
}

/** Les pages des articles de la fixture (les liens `exemple.invalid/v1`…), telles qu'elles auraient été lues : ce que l'article porte, rien de plus. */
function pagesDeLaFixture(): Record<string, Omit<PageLue, 'url' | 'luLe' | 'domaine'>> {
  const pages: Record<string, Omit<PageLue, 'url' | 'luLe' | 'domaine'>> = {};
  for (const d of fixtureCarnets()) {
    for (const a of d.carnet?.articles ?? []) {
      const cle = a.url ? cleUrl(a.url) : null;
      if (!cle || !a.nom) continue; // sans nom : page non lue (ZZ-V-A5, état 21)
      pages[cle] = {
        statut: 'lue', nom: a.nom,
        ...(a.prixCentimes !== undefined ? { prix: a.prixCentimes / 100, devise: a.devise ?? 'CHF' } : {}),
        ...(a.vendeur ? { vendeur: a.vendeur } : {}),
        ...(a.dispo === 'en stock' ? { dispo: 'en-stock' as const } : a.dispo === 'rupture' ? { dispo: 'rupture' as const } : {}),
        valeurs: Object.entries(a.valeurs).map(([nom, v]) => ({
          nom, valeur: typeof v.valeur === 'boolean' ? (v.valeur ? 'oui' : 'non') : String(v.valeur), ...(v.unite ? { unite: v.unite } : {})
        }))
      };
    }
  }
  return pages;
}
let pagesFixture: Record<string, Omit<PageLue, 'url' | 'luLe' | 'domaine'>> | null = null;

/**
 * Les liens « ZZ TEST » (P2, vision 3) : un lien de test porte la marque des données de test (L05) dans son adresse
 * (`https://exemple.test/zz-test-hotte-3`). Au banc, il rend une page simulée « exemple » : la page du banc de sa famille
 * (`hotte`, `pompe`, `evier`, `echangeur`), la variante choisie par la fin de l'adresse (`-a`, `-b`, `-2`…, ou le nom complet de la
 * clé : `pompe-magnetique`) ; sans famille, une page qui ne porte que le nom écrit dans l'adresse (« ZZ TEST — Frigo 300l »), ni prix ni
 * valeur inventés. Une adresse qui dit `illisible` reste illisible (état 21). Toute autre adresse inconnue : illisible (rien d'inventé).
 */
const MARQUE_TEST = /zz[-_ ]?test[-_ ]*/i;
const FAMILLES_BANC: readonly { motif: RegExp; cles: readonly string[] }[] = [
  { motif: /hotte/, cles: ['exemple.invalid/hotte-140', 'exemple.invalid/hotte-murale-100'] },
  { motif: /pompe/, cles: ['exemple.invalid/pompe-inox', 'exemple.invalid/pompe-magnetique'] },
  { motif: /evier/, cles: ['exemple.invalid/evier-riviera', 'exemple.invalid/evier-sur-pieds'] },
  { motif: /echangeur|plaque/, cles: ['exemple.invalid/plaque-froid/echangeur-30'] }
];

/** Le nom écrit dans une adresse de test, sans sa marque (« zz-test-frigo-300l » → « frigo-300l ») ; `null` si l'adresse n'est pas de test. */
export function nomDeLienTest(url: string): string | null {
  let chemin = '';
  try { chemin = decodeURIComponent(new URL(url).pathname); } catch { return null; }
  if (!MARQUE_TEST.test(chemin)) return null;
  const segment = chemin.split('/').filter(Boolean).find(s => MARQUE_TEST.test(s)) ?? '';
  return sansAccents(segment.replace(MARQUE_TEST, '')).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function pageDeLienTest(nom: string): Omit<PageLue, 'url' | 'luLe' | 'domaine'> {
  if (!nom || /illisible/.test(nom)) return { statut: 'illisible' };
  const famille = FAMILLES_BANC.find(f => f.motif.test(nom));
  if (famille) {
    const exacte = famille.cles.find(c => nom.includes(c.split('/').pop()!));
    const fin = nom.split('-').pop() ?? '';
    const rang = /^[a-z]$/.test(fin) ? fin.charCodeAt(0) - 97 : /^\d+$/.test(fin) ? Math.max(0, Number(fin) - 1) : 0;
    return PAGES_BANC[exacte ?? famille.cles[rang % famille.cles.length]];
  }
  const mots = nom.split('-').filter(Boolean).join(' ');
  return { statut: 'lue', nom: `ZZ TEST — ${mots.charAt(0).toUpperCase()}${mots.slice(1)}` };
}

/**
 * La page d'un lien au banc : une adresse de `PAGES_BANC` ou de la fixture → lue (exemple) ; un domaine de `PAGES_SIMULEES` → lue ;
 * un lien « ZZ TEST » (`nomDeLienTest`) → sa page simulée ; tout le reste → `illisible`, jamais inventée.
 */
export function pageSimulee(url: string, luLe = 0): PageLue {
  let domaine = '';
  try { domaine = new URL(url).hostname.replace(/^www\./, ''); } catch { return { url, domaine, statut: 'refusee', luLe }; }
  const cle = cleUrl(url);
  pagesFixture ??= pagesDeLaFixture();
  const parUrl = cle ? PAGES_BANC[cle] ?? PAGES_BANC_ETATS[cle] ?? pagesFixture[cle] : undefined;
  if (parUrl) return { ...parUrl, url, domaine, luLe };
  const p = PAGES_SIMULEES[domaine];
  if (p) return { ...p, url, luLe };
  /* critique 6, n° 11 (G20) : une autre adresse du banc (`exemple.invalid/hotte-2`) se lit comme un lien de test : la page de sa famille,
     la variante par sa fin ; sans famille (`/v5`), illisible */
  if (domaine === 'exemple.invalid' && cle) {
    const chemin = sansAccents(cle.split('/').slice(1).join('-'));
    if (FAMILLES_BANC.some((f) => f.motif.test(chemin))) return { ...pageDeLienTest(chemin), url, domaine, luLe };
  }
  const test = nomDeLienTest(url);
  return test !== null ? { ...pageDeLienTest(test), url, domaine, luLe } : { url, domaine, statut: 'illisible', luLe };
}

/**
 * Critique 5, n° 6 : le lien que le banc propose de coller dans un carnet ouvert (puce « Coller : … », R15), de la famille de son titre :
 * une hotte dans Ventilation (débit, « tient 80 °C »), un évier dans Évier, une pompe ; sinon `LIEN_COLLER_BANC`. Page simulée, « exemple ».
 */
export function lienACollerPour(titre: string | null | undefined): string {
  const t = sansAccents(titre ?? '');
  if (/ventil|hotte|extract|buee/.test(t)) return 'https://exemple.invalid/hotte-140';
  if (/evier|\bbacs?\b/.test(t)) return 'https://exemple.invalid/evier-riviera';
  if (/pompe|transfert/.test(t)) return 'https://exemple.invalid/pompe-inox';
  return LIEN_COLLER_BANC;
}

/** Durée de lecture d'une page au banc : assez pour voir le squelette « ✻ lecture de la page… » (g5:v03-10). */
export const DELAI_LECTURE_BANC = 1500;

/**
 * Les étapes qu'une page simulée rend, dans l'ordre du serveur (`lienProduit.ts`) : page, données, prix, devise et frais, photos,
 * caractéristiques, contrôle. Une page qui porte ses étapes (lien mort, page bloquée) les garde. `lent` : la sous-tâche lente que le serveur
 * annonce avant l'étape `avant` (Google pour une page bloquée). Rien n'est inventé : chaque étape dit ce que la page simulée contient.
 */
export function etapesSimulees(p: PageLue): { etapes: EtapeLien[]; lent?: { avant: number; nom: 'bloquee' | 'ia' } } {
  if (p.etapes?.length) {
    const i = p.etapes.findIndex((e) => e.nom === 'bloquee');
    return { etapes: [...p.etapes], ...(i >= 0 ? { lent: { avant: i, nom: 'bloquee' as const } } : {}) };
  }
  if (p.statut !== 'lue') return { etapes: [{ nom: 'page', statut: 'absent', detail: p.statut }] };
  const etranger = !!p.devise && p.devise !== 'CHF';
  const photos = p.photos?.length ?? (p.photo ? 1 : 0);
  const n = p.valeurs?.length ?? 0;
  const etapes: EtapeLien[] = [
    { nom: 'page', statut: 'trouve', detail: p.domaine },
    p.nom ? { nom: 'donnees', statut: 'trouve', detail: [p.nom.replace(/\s*\(exemple\)$/, ''), p.vendeur].filter(Boolean).join(' · ') } : { nom: 'donnees', statut: 'absent', detail: 'aucune donnée produit' },
    p.prix !== undefined ? { nom: 'prix', statut: p.prixDes ? 'douteux' : 'trouve', detail: `${p.prixDes ? 'dès ' : ''}${p.prix} ${p.devise ?? ''}`.trim() } : { nom: 'prix', statut: 'absent' },
    p.devise ? { nom: 'devise-frais', statut: etranger ? 'douteux' : 'trouve',
      detail: [p.livraison?.prix !== undefined ? `port ${p.livraison.prix} ${p.livraison.devise ?? p.devise}` : '', etranger ? 'douane et TVA d’import non indiquées' : p.devise].filter(Boolean).join(' · ') }
      : { nom: 'devise-frais', statut: 'absent' },
    photos ? { nom: 'photos', statut: 'trouve', detail: String(photos) } : { nom: 'photos', statut: 'absent' },
    n ? { nom: 'caract', statut: 'trouve', detail: String(n) } : { nom: 'caract', statut: 'absent' },
    etranger || p.prixDes ? { nom: 'controle', statut: 'douteux', detail: 'prix à recouper : frais d’import' } : { nom: 'controle', statut: 'trouve', detail: 'prix, nom et photo recoupés' }
  ];
  return { etapes };
}

/**
 * Le serveur simulé du banc (`lecturesLiens/{jeton}`) : le début et la durée de chaque lecture, gardés dans `localStorage` pour qu'une page
 * rechargée (« l'app fermée puis rouverte ») retrouve la lecture où le temps l'a menée. Hors navigateur (tests) : en mémoire.
 */
const CLE_SERVEUR_BANC = 'affinee.banc.lecturesLiens';
interface LectureBanc { url: string; debut: number; duree: number }
const memoireBanc = new Map<string, LectureBanc>();
function serveurBanc() {
  const ls = (globalThis as { localStorage?: Storage }).localStorage;
  const tout = (): Record<string, LectureBanc> => { try { return JSON.parse(ls?.getItem(CLE_SERVEUR_BANC) ?? '{}') as Record<string, LectureBanc>; } catch { return {}; } };
  return {
    lire: (j: string): LectureBanc | undefined => memoireBanc.get(j) ?? tout()[j],
    ecrire: (j: string, v: LectureBanc) => { memoireBanc.set(j, v); try { ls?.setItem(CLE_SERVEUR_BANC, JSON.stringify({ ...tout(), [j]: v })); } catch { /* en mémoire seulement */ } }
  };
}

/** Banc (`&reouverture=…`) : une lecture lancée avant « la fermeture de l'app », posée dans le serveur simulé. */
export function poserLectureBanc(jeton: string, url: string, debut: number, duree: number): void { serveurBanc().ecrire(jeton, { url, debut, duree }); }

/** Les étapes dites à l'instant `ecoule` d'une lecture de `duree` : la k-ième tombe à k/(n+1) de la durée. */
function etapesA(plan: ReturnType<typeof etapesSimulees>, ecoule: number, duree: number): { etapes: EtapeLien[]; enCours?: 'ia' | 'bloquee' } {
  const n = plan.etapes.length;
  const k = duree <= 0 ? n : Math.min(n, Math.floor((ecoule / duree) * (n + 1)));
  return { etapes: plan.etapes.slice(0, k), ...(plan.lent && k === plan.lent.avant ? { enCours: plan.lent.nom } : {}) };
}

/**
 * `lireLien` simulé : la page de `pageSimulee`, après `delaiMs` (défaut : 1,5 s, `DELAI_LECTURE_BANC` ; 0 dans les tests). S'interrompt
 * au ✕ (`signal`). Aucun réseau. Avec `surEtapes`, les étapes sont dites une à une pendant la lecture, comme le flux du serveur ; avec un
 * `jeton` déjà connu du serveur simulé, la lecture reprend où le temps l'a menée (réouverture), ou rend la page tout de suite si elle est finie.
 */
export function lireLienSimule(url: string, o: {
  delaiMs?: number; signal?: AbortSignal; luLe?: number; jeton?: string;
  surEtapes?: (e: { etapes: readonly EtapeLien[]; enCours?: 'ia' | 'bloquee' }) => void; maintenant?: () => number;
} = {}): Promise<PageLue> {
  const now = o.maintenant ?? Date.now;
  const plan = etapesSimulees(pageSimulee(url, 0));
  const page = (): PageLue => ({ ...pageSimulee(url, o.luLe ?? now()), etapes: plan.etapes });
  const serveur = o.jeton ? serveurBanc() : null;
  const deja = o.jeton ? serveur!.lire(o.jeton) : undefined;
  const suivie = deja && deja.url === url ? deja : undefined;
  const debut = suivie?.debut ?? now();
  const duree = suivie?.duree ?? o.delaiMs ?? DELAI_LECTURE_BANC;
  if (o.jeton && !suivie) serveur!.ecrire(o.jeton, { url, debut, duree });
  return new Promise<PageLue>((resolve, reject) => {
    if (o.signal?.aborted) { reject(o.signal.reason); return; }
    if (duree <= 0 || now() - debut >= duree) { resolve(page()); return; }
    const minuteurs: ReturnType<typeof setTimeout>[] = [];
    let dites = -1;
    const dire = () => {
      const e = etapesA(plan, now() - debut, duree);
      const cle = e.etapes.length * 2 + (e.enCours ? 1 : 0);
      if (cle === dites) return;
      dites = cle;
      try { o.surEtapes?.(e); } catch { /* l'écran ne fait jamais échouer la lecture */ }
    };
    if (o.surEtapes) {
      dire();
      const pas = duree / (plan.etapes.length + 1);
      for (let k = 1; k <= plan.etapes.length; k++) {
        const t = debut + k * pas - now();
        if (t > 0) minuteurs.push(setTimeout(dire, t + 1));
      }
    }
    minuteurs.push(setTimeout(() => resolve(page()), Math.max(0, debut + duree - now())));
    o.signal?.addEventListener('abort', () => { minuteurs.forEach(clearTimeout); reject(o.signal!.reason); }, { once: true });
  });
}

const MOTS_VIDES = new Set(['pour', 'sous', 'dans', 'avec', 'les', 'des', 'une', 'qui', 'que', 'est', 'sur', 'pas', 'plus', 'mais', 'aussi', 'tout', 'faire', 'garder', 'dessous']);
const jetons = (t: string) => new Set(sansAccents(t).split(/[^a-z0-9]+/).filter((m) => m.length >= 4 && !MOTS_VIDES.has(m)).map((m) => m.replace(/s$/, '')));
/** Recouvrement de jetons : au moins 2 en commun et 60 % du plus court. */
const proche = (a: string, b: string) => {
  const x = jetons(a), y = jetons(b);
  const communs = [...x].filter((m) => y.has(m)).length;
  return communs >= 2 && communs / Math.max(1, Math.min(x.size, y.size)) >= 0.6;
};

const par = (ctx: ContexteRangerCarnet, motif: RegExp): Carnet | undefined =>
  ctx.carnets.find((c) => c.id === ctx.depuis && motif.test(sansAccents(c.titre))) ?? ctx.carnets.find((c) => motif.test(sansAccents(c.titre)));
const ouvert = (ctx: ContexteRangerCarnet) => ctx.carnets.find((c) => c.id === ctx.depuis);

/** Le préfixe des données de test (L05) : « ZZ TEST — ». Une phrase qui le porte le garde dans tout titre proposé (vision 2, L4-7). */
const PREFIXE_BANC = /^ZZ TEST\s*[—–-]\s*/i;
const sansBanc = (t: string) => t.replace(PREFIXE_BANC, '');
const avecPrefixe = (prefixe: string, titre: unknown): unknown =>
  typeof titre === 'string' && prefixe && !PREFIXE_BANC.test(titre) ? `${prefixe}${titre}` : titre;

/**
 * Où va une ligne : un carnet connu, ou un carnet neuf. Depuis la liste, un carnet connu porte sa raison (G21, g5:v06-14 : « la page parle
 * d'extraction de buée : comme Ventilation ») ; `mot` est le mot du message qui l'a désigné, jamais un mot inventé.
 */
const rangement = (ctx: ContexteRangerCarnet, c: Carnet | undefined, neuf: string, mot?: string, lien?: boolean): Brut =>
  c
    ? { carnetId: c.id, ...(!ctx.depuis && mot ? { raisonCarnet: `${lien ? 'la page' : 'votre message'} parle de « ${mot} » : comme ${sansBanc(c.titre)}` } : {}) }
    : { carnetNeuf: neuf, raisonCarnet: aucunCarnetNEnParle(ctx.carnets.length).replace(/^./, (x) => x.toLowerCase()) };
const reponse = (lignes: Brut[]): ReponseSimulee => ({ lignes, exemple: true });

/** Le mot du message qui a désigné la catégorie, tel qu'il l'a écrit (accents gardés quand la forme NFC le permet). */
function motDe(texte: string, motif: RegExp): string | undefined {
  const t = sansAccents(texte);
  const m = motif.exec(t);
  if (!m) return undefined;
  return t.length === texte.length ? texte.slice(m.index, m.index + m[0].length).toLowerCase() : m[0];
}

/** Les lignes d'un message : retours à la ligne, « ; », puces. */
const morceauxDe = (texte: string): string[] => texte.split(/\n|;|•/).map((l) => l.replace(/^[-*\s]+/, '').trim()).filter(Boolean).flatMap(phrasesEtiquetees).slice(0, 12);

/**
 * Un critère du banc. `texte` : fixe, ou tiré de la phrase. La valeur que la phrase écrit dans l'unité de la caractéristique est gardée
 * (P7, P44) : « … : 1 200 m³/h au moins » (sens), ou « … (38 cm) » (`valeur: 'entre-parentheses'`). Jamais un nombre absent de la phrase.
 */
interface CritereBanc {
  quand: RegExp;
  sauf?: RegExp;
  texte: string | ((phrase: string) => string);
  valeur?: 'sens' | 'entre-parentheses';
  caracteristique: { nom: string; unite?: string; sens: 'plus' | 'moins' | 'oui-non' };
}

/** Le morceau de la phrase (entre virgules) qui contient `motif`, avec son article : « buées au-dessus de la cuve » → « les buées au-dessus de la cuve ». */
function segmentDe(phrase: string, motif: RegExp, defaut: string): string {
  const seg = sansPrefixeBanc(phrase).split(/[,;:]/).map((s) => s.trim()).find((s) => motif.test(s));
  if (!seg) return defaut;
  const nu = seg.replace(/^(?:les|la|le|des|de la|du)\s+/i, '');
  return `${/^\S+s\b/.test(nu) ? 'les' : 'la'} ${nu.charAt(0).toLowerCase()}${nu.slice(1)}`;
}

/** Le texte d'un critère du banc, avec la valeur que la phrase donne dans son unité. */
function texteCritere(k: CritereBanc, phrase: string): string {
  const base = typeof k.texte === 'string' ? k.texte : k.texte(phrase);
  const u = k.caracteristique.unite;
  const q = u ? quantitesDe(phrase).find((x) => x.unite === u) : undefined;
  if (!q) return base;
  if (k.valeur === 'entre-parentheses') return `${base} (${q.texte} ${u})`;
  return `${base}${base.includes(':') ? ',' : ' :'} ${q.texte} ${u} ${k.caracteristique.sens === 'moins' ? 'au plus' : 'au moins'}`;
}

/**
 * Les catégories du banc : chacune a ses caractéristiques (R30 : générique côté app, la variété vient de la réponse). Critique 5, n° 4 :
 * un critère de catégorie ne paraît que si la phrase en dit les mots, et ne porte que les nombres de la phrase (aucun exemple de maquette,
 * ni « 30 L », ni « 80 °C » qu'elle n'écrit pas) ; les mesures écrites passent par `extraireCriteres` (`criteresDeLaPhrase`).
 */
type CaracBanc = CritereBanc['caracteristique'];
/**
 * Critique 6 : `proposees` (n° 9, D-35, p2:i06-4, g5:v08-3) : les caractéristiques de la catégorie, proposées en puces dans un carnet neuf
 * (jamais rangées sans son toucher) ; `besoin` et `critereLien` (n° 13, D-7, D-13, R17, g5:v06-10) : un lien collé depuis la liste ouvre
 * le carnet du besoin (« Pompe pour le moût »), avec un critère proposé, et non au nom du produit.
 */
const CATEGORIES: Array<{ motif: RegExp; carnet: RegExp; neuf: string; criteres: CritereBanc[]; besoin?: string; proposees?: CaracBanc[]; critereLien?: { texte: string; caracteristique: CaracBanc } }> = [
  {
    motif: /frigo|chambre froide|refroidi|garder au froid/, carnet: /frigo|froid/, neuf: 'Frigo pour les fûts',
    proposees: [{ nom: 'température mini', unite: '°C', sens: 'moins' }, { nom: 'volume', unite: 'L', sens: 'plus' }, { nom: 'bruit', unite: 'dB', sens: 'moins' }],
    criteres: [
      { quand: /°c|degre|froid/, texte: (phrase) => (/fut/.test(sansAccents(phrase)) ? 'Garder les fûts au froid' : 'Garder au froid'), caracteristique: { nom: 'température mini', unite: '°C', sens: 'moins' } }
    ]
  },
  {
    motif: /ventil|hotte|extract|condensation|buee|gaine/, carnet: /ventil|hotte/, neuf: 'Ventilation de la salle de brassage',
    besoin: 'Ventilation de la salle de brassage',
    proposees: [{ nom: 'débit', unite: 'm³/h', sens: 'plus' }, { nom: 'bruit', unite: 'dB', sens: 'moins' }],
    critereLien: { texte: 'Capter la buée au-dessus de la cuve', caracteristique: { nom: 'débit', unite: 'm³/h', sens: 'plus' } },
    criteres: [
      /* P15 : « plus de condensation au plafond » dit une gêne ; il n'en veut plus. Le critère dit l'inverse, et ce qui le mesure (débit). */
      { quand: /condensation|plafond/, texte: 'Moins de condensation au plafond : capter la buée', caracteristique: { nom: 'débit', unite: 'm³/h', sens: 'plus' } },
      /* P7 : « buées au-dessus de la cuve, 1 200 m³/h » → « Capter les buées au-dessus de la cuve : 1 200 m³/h au moins » */
      { quand: /buee/, sauf: /condensation|plafond/, texte: (phrase) => `Capter ${segmentDe(phrase, /bu[ée]es?/i, 'la buée')}`, caracteristique: { nom: 'débit', unite: 'm³/h', sens: 'plus' } },
      { quand: /bruit|calme/, texte: 'Pas trop de bruit', caracteristique: { nom: 'bruit', unite: 'dB', sens: 'moins' } }
    ]
  },
  /* critique 5, n° 4 : le besoin G13 seulement s'il le dit (« un fût couché entre dans le bac »), avec ses nombres à lui ; jamais le « 30 L »
     de la maquette. « fond de bac 38 cm minimum » se lit dans la phrase (`extraireCriteres`). */
  {
    motif: /evier|bac\b|bacs\b|laver/, carnet: /evier/, neuf: 'Évier inox',
    besoin: 'Évier pour laver les fûts',
    proposees: [{ nom: 'fond de bac', unite: 'cm', sens: 'plus' }, { nom: 'bacs', sens: 'plus' }],
    critereLien: { texte: 'Un fût couché entre dans le bac', caracteristique: { nom: 'fond de bac', unite: 'cm', sens: 'plus' } },
    criteres: [{
      quand: /fut[^,;]*couche|couche[^,;]*fut|entre dans le bac/, valeur: 'entre-parentheses',
      texte: (phrase) => { const l = /(\d+(?:[.,]\d+)?)\s?l\b/.exec(sansAccents(phrase)); return `Un fût${l ? ` de ${nombreFr(Number(l[1].replace(',', '.')), 2)} L` : ''} couché entre dans le bac`; },
      caracteristique: { nom: 'fond de bac', unite: 'cm', sens: 'plus' }
    }]
  },
  {
    motif: /embouteill|bouteille|oxygene|isobar/, carnet: /embouteill/, neuf: 'Embouteillage',
    proposees: [{ nom: 'oxygène dissous', unite: 'ppb', sens: 'moins' }],
    criteres: [{ quand: /oxygene/, texte: "Minimiser l'oxygène", caracteristique: { nom: 'oxygène dissous', unite: 'ppb', sens: 'moins' } }]
  },
  /* « tient 80 °C » seulement s'il l'écrit (`extraireCriteres`) */
  {
    motif: /pompe|transfert/, carnet: /pompe|transfert/, neuf: 'Pompe de transfert', criteres: [],
    besoin: 'Pompe pour le moût',
    proposees: [{ nom: 'débit', unite: 'L/min', sens: 'plus' }, { nom: 'température max', unite: '°C', sens: 'plus' }],
    /* le moût se transfère chaud : la pompe doit le supporter. Aucun nombre qu'il n'a pas écrit (critique 5, n° 4) : la caractéristique
       seule ; la page lue dit sa valeur (« température max 90 °C ») */
    critereLien: { texte: 'Supporter le moût chaud', caracteristique: { nom: 'température max', unite: '°C', sens: 'plus' } }
  }
];

/** Le texte sans ses adresses (mêmes positions) : une catégorie se lit dans ses mots, jamais dans une URL (critique 5, n° 6). */
function sansLiens(texte: string): string {
  let s = texte;
  for (const u of urlsDe(texte)) s = s.slice(0, u.debut) + ' '.repeat(u.fin - u.debut) + s.slice(u.fin);
  return s;
}

type CritereSimule = { texte: string; caracteristique?: Brut };
const cleValeur = (valeur: number | string, unite: string) => `${String(valeur).replace(',', '.')}|${unite}`;
const normal = (t: string) => sansAccents(sansPrefixeBanc(t)).replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * Les critères d'une phrase, tirés de ses mots (critique 5, n° 2, 4, 24) : ceux que ses catégories reformulent (P7, P15 ; le nombre de
 * la phrase gardé), puis ceux d'`extraireCriteres` dont la valeur n'est pas déjà dite. Aucun en double ; jamais le titre de l'idée. Une
 * phrase sans mesure ni besoin reconnu : aucun.
 */
function criteresDeLaPhrase(texte: string, categories: typeof CATEGORIES, titre?: string): CritereSimule[] {
  const t = sansAccents(texte);
  const sortie: CritereSimule[] = [];
  const vus = new Set<string>(titre ? [normal(titre)] : []);
  const valeurs = new Set<string>();
  const ajouter = (k: CritereSimule, cle?: string) => {
    const n = normal(k.texte);
    if (!n || vus.has(n) || (cle && valeurs.has(cle))) return;
    vus.add(n);
    if (cle) valeurs.add(cle);
    sortie.push(k);
  };
  for (const cat of categories) for (const k of cat.criteres) {
    if (!k.quand.test(t) || k.sauf?.test(t)) continue;
    const u = k.caracteristique.unite;
    const q = u ? quantitesDe(texte).find((x) => x.unite === u) : undefined;
    ajouter({ texte: texteCritere(k, texte), caracteristique: k.caracteristique }, q ? cleValeur(q.valeur, q.unite) : undefined);
  }
  for (const k of extraireCriteres(texte).criteres) {
    const tient = /^Tient (\d+(?:[.,]\d+)?) °C$/.exec(k.texte);
    ajouter({ texte: k.texte, ...(k.caracteristique ? { caracteristique: k.caracteristique } : {}) },
      k.quantite ? cleValeur(k.quantite.valeur, k.quantite.unite) : tient ? cleValeur(tient[1], '°C') : undefined);
  }
  return sortie;
}

/** Les carnets du contexte sous la forme que lit `rattacher` (même règle que la découpe annoncée, `planVrac`). */
function docsDuContexte(ctx: ContexteRangerCarnet): CarnetDoc[] {
  return ctx.carnets.map((c) => ({
    id: c.id, type: 'carnet', title: c.titre, status: 'idea',
    carnet: {
      version: 1, creeLe: '', phrase: '',
      criteres: c.criteres.map((k, i) => ({ id: `k${i}`, texte: k.texte, origine: 'ia' as const })),
      facons: c.facons.map((nom, i) => ({ id: `f${i}`, nom, etat: 'ouverte' as const, origine: 'ia' as const })),
      articles: c.articles.map((a, i) => ({ id: `a${i}`, nom: a.nom, valeurs: {}, lecture: 'lue' as const })),
      notes: c.notes.map((n) => ({ id: n.id, texte: n.texte, genre: 'note' as const })),
      photos: []
    }
  })) as unknown as CarnetDoc[];
}

/** Les trois notes de son téléphone (ref/, D-123, D-124, D-126), transcrites des images et rangées comme le ferait le modèle. */
function notesRef(t: string, ctx: ContexteRangerCarnet): ReponseSimulee | null {
  if (/rouleau qui pousse/.test(t)) {
    const c = rangement(ctx, par(ctx, /sol/), 'Sol du local');
    return reponse([
      { sorte: 'note', genre: 'a-acheter', texte: "Un rouleau qui pousse plutôt qu'un qui absorbe", ...c },
      { sorte: 'note', genre: 'a-acheter', texte: 'Un petit récipient pour transférer', ...c },
      { sorte: 'note', genre: 'conseil', texte: 'Deux couches, au petit pinceau ou plus facile ; tout jeter après', ...c },
      { sorte: 'note', genre: 'question', texte: 'Un plus gros seau ?', ...c }
    ]);
  }
  if (/prevision prix/.test(t)) {
    const c = rangement(ctx, par(ctx, /tableau de bord|dashboard/), 'Tableau de bord');
    return reponse([
      { sorte: 'note', genre: 'a-faire', texte: 'Prévoir le prix des prochains brassins', ...c },
      { sorte: 'note', genre: 'a-faire', texte: "Ajouter l'estimation des améliorations au tableau de bord principal", ...c }
    ]);
  }
  if (/predictions de couts/.test(t)) {
    const c = rangement(ctx, par(ctx, /prochain brass/), 'Prochain brassage');
    return reponse([
      { sorte: 'note', genre: 'a-acheter', texte: 'Houblon', ...c },
      { sorte: 'note', genre: 'a-acheter', texte: 'Levures', ...c },
      { sorte: 'note', genre: 'a-faire', texte: 'Prédire les coûts', ...c },
      { sorte: 'note', genre: 'note', texte: 'Coûts et visu : tout est déjà payé', ...c },
      { sorte: 'note', genre: 'a-faire', texte: 'Vérifier le volume', ...c }
    ]);
  }
  return null;
}

/** Les aides (G11, G25, G26, G27, G29), chacune sur un cas reconnaissable du banc. */
function aides(texte: string, t: string, ctx: ContexteRangerCarnet): ReponseSimulee | null {
  const ici = ouvert(ctx);
  // G29 : « 2 bacs pour laver les fûts » sur le carnet de l'évier → titre proposé.
  if (/2 bacs pour laver les futs/.test(t)) {
    const c = par(ctx, /evier/);
    const lignes: Brut[] = [{ sorte: 'critere', texte: '2 bacs, pour laver les fûts', caracteristique: { nom: 'bacs', sens: 'plus' }, ...rangement(ctx, c, 'Évier 2 bacs') }];
    if (c) lignes.push({ sorte: 'idee', texte: '2 bacs pour laver les fûts', carnetId: c.id, titrePropose: `${c.titre} 2 bacs`.slice(0, 60) });
    return reponse(lignes);
  }
  // G27 : « même visite » → regrouper avec les notes voisines du carnet.
  if (/meme visite/.test(t) && ici) {
    const voisines = ici.notes.filter((n) => [...jetons(n.texte)].some((m) => jetons(texte).has(m)) || /passe|visite|vient/.test(sansAccents(n.texte))).map((n) => n.id);
    if (voisines.length) return reponse([{ sorte: 'note', genre: 'note', texte: texte.trim(), carnetId: ici.id, regrouperAvec: voisines }]);
  }
  // G25 : une note qui exprime une exigence → « Ressemble à un critère ».
  if (/\bil faut que\b|\bdoit (?:tenir|entrer|passer|faire)\b/.test(t)) {
    return reponse([{ sorte: 'note', genre: 'note', texte: texte.trim(), commeCritere: true, ...rangement(ctx, ici, texte.trim().slice(0, 60)) }]);
  }
  // G26 : une valeur changée sur une caractéristique du carnet → sa conséquence, avec le seul nombre écrit.
  if (ici) {
    for (const k of ici.criteres) {
      const u = k.caracteristique?.unite;
      if (!u || !/plutot|maintenant|finalement|passe a/.test(t)) continue;
      const m = texte.match(new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*${u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
      if (m) {
        const sens = k.caracteristique!.sens === 'moins' ? 'au-dessus de' : 'sous';
        return reponse([{ sorte: 'critere', texte: texte.trim(), carnetId: ici.id, caracteristique: k.caracteristique, consequence: `les articles ${sens} ${m[1]} ${u} ne passeraient plus` }]);
      }
    }
  }
  // G11 : la phrase répète une note → doublon.
  const notes = ctx.carnets.flatMap((c) => c.notes.map((n) => ({ ...n, carnet: c })));
  const double = notes.find((n) => proche(n.texte, texte));
  if (double && !texte.includes('\n')) return reponse([{ sorte: 'note', genre: 'note', texte: texte.trim(), carnetId: double.carnet.id, doublonDe: double.id }]);
  return null;
}

/** Les objets que le modèle reconnaît comme des achats quand la ligne les nomme en tête (« robinet à pédale », « 2 bacs inox »). */
const OBJETS = /^(?:(?:un|une|des|le|la|les|deux|trois|\d+e?)\s+)*(?:robinet|gaine|filtre|bac|bacs|hotte|seau|rouleau|pinceau|tuyau|vanne|joint|raccord|ventilateur|extracteur|moteur|pompe|fut|futs|cuve|douchette|evier|houblon|levures?|recipient)\b/;

/**
 * Une ligne d'une note en vrac, mise en forme comme le ferait le modèle (P11, D-123) : sans préfixe de test, sans libellé de carnet ni de
 * genre en tête (« évier : robinet à pédale » → « Robinet à pédale »), l'infinitif en tête, une majuscule ; son genre, « note » en dernier.
 */
function formerLigne(ligne: string): { texte: string; genre: string } {
  let t = sansPrefixeBanc(ligne).trim();
  /* critique 6, n° 2 : l'étiquette de genre se lit comme dans l'aperçu local (`genreDEtiquette`) : le même type pendant et après */
  const indice: string | undefined = genreDEtiquette(t);
  const lib = /^([^:]{2,30}?)\s*:\s*(.+)$/.exec(t);
  if (lib) {
    const l = sansAccents(lib[1]).trim();
    if (indice || CATEGORIES.some((c) => c.motif.test(l))) t = lib[2].trim();
  }
  const forme = mettreEnForme(t);
  const texte = forme.charAt(0).toLocaleUpperCase('fr-CH') + forme.slice(1);
  const local = genreLocal(texte);
  const genre = local === 'question' ? 'question' : indice ?? (local === 'note' && OBJETS.test(sansAccents(texte)) ? 'a-acheter' : local);
  return { texte, genre };
}
const ACHAT_D_ABORD = (a: Brut, b: Brut) => Number(b.genre === 'a-acheter') - Number(a.genre === 'a-acheter');

/**
 * La réponse simulée, telle que le modèle la rendrait (forme du schéma). Ordre : notes `ref/`, aides, liens, catégories, puis
 * découpe générique (une ligne par ligne du message). `null` seulement pour un message vide.
 */
export function reponseSimulee(ctx: ContexteRangerCarnet): ReponseSimulee | null {
  const texte = ctx.texte ?? '';
  if (!texte.trim()) return null;
  const r = reponseBrute(ctx, texte);
  // L4-7 (vision 2) : les titres proposés (carnet neuf, titre d'idée, titre proposé G29) gardent le préfixe « ZZ TEST — » de la phrase.
  const prefixe = PREFIXE_BANC.test(texte.trim()) ? 'ZZ TEST — ' : '';
  if (!r || !prefixe) return r;
  return reponse(r.lignes.map((l) => ({
    ...l,
    ...(l.carnetNeuf !== undefined ? { carnetNeuf: avecPrefixe(prefixe, l.carnetNeuf) } : {}),
    ...(l.sorte === 'idee' && l.titre !== undefined ? { titre: avecPrefixe(prefixe, l.titre) } : {}),
    ...(l.titrePropose !== undefined ? { titrePropose: avecPrefixe(prefixe, l.titrePropose) } : {})
  })));
}

function reponseBrute(ctx: ContexteRangerCarnet, texte: string): ReponseSimulee | null {
  const t = sansAccents(texte);
  const ref = notesRef(t, ctx);
  if (ref) return ref;
  const morceaux = morceauxDe(texte);
  const liens = liensDuTexte(texte).slice(0, 3);
  // Une note de plusieurs lignes n'est jamais prise par une aide d'une seule phrase (m390-2 : G29 rangeait les 3 lignes dans Évier).
  if (morceaux.length > 1 && !liens.length) return decoupe(ctx, morceaux);
  const aide = aides(texte, t, ctx);
  if (aide) return aide;

  const lignes: Brut[] = [];
  // Critique 5, n° 6 : la catégorie se lit dans les mots du message, jamais dans une adresse (« …/pompe-magnetique » n'est pas une pompe dite).
  const mots = sansLiens(texte);
  const tm = sansAccents(mots);
  const ici = ouvert(ctx);
  // Depuis la liste, l'adresse aide à trouver le carnet (G21 : « la page parle de « hotte » : comme … ») ; dans un carnet ouvert, non.
  const categorie = CATEGORIES.find((c) => c.motif.test(ici ? tm : t));
  const mot = categorie ? motDe(ici ? mots : texte, categorie.motif) : undefined;
  // Un lien collé dans un carnet ouvert devient un article de CE carnet, jamais un carnet neuf (n° 6). Sans lien, une catégorie reconnue
  // (frigo, ventilation, évier) va dans son carnet, ou dans une idée neuve : jamais dans un autre carnet resté ouvert.
  const cible = liens.length && ici ? ici : categorie ? par(ctx, categorie.carnet) : ici;
  // Un lien seul qui n'a pas de carnet ouvre un carnet au nom lu sur sa page, sinon à son domaine (R16, R17 ; g5:v06-10).
  const premiere = liens.length ? (ctx.pages ?? []).find((p) => p.url === liens[0]) ?? pageSimulee(liens[0]) : null;
  const lienSeul = !!premiere && texte.trim().replace(/[.,;:!?)\]]+$/, '') === liens[0];
  /* critique 6, n° 13 (D-7, D-13, R17, g5:v06-10) : un lien seul qui ouvre un carnet le titre par le besoin (« Pompe pour le moût »), pas
     par le nom du produit ; faute de besoin connu, le nom lu sur la page, puis le domaine */
  const neuf = lienSeul ? categorie?.besoin ?? premiere!.nom ?? premiere!.domaine : categorie?.neuf;

  // Liens : un article par lien, avec ce que la page (simulée) a lu ; le prix de la page, sinon (un seul lien, un seul prix écrit) celui
  // que le message donne à côté du lien (P1, vision 3 : « … 189,90 CHF » va à l'article, pas au titre). Jamais un prix inventé.
  const prixEcrits = prixLus(texte);
  for (const url of liens) {
    const page = (ctx.pages ?? []).find((p) => p.url === url) ?? pageSimulee(url);
    const ecrit = page.prix === undefined && liens.length === 1 && prixEcrits.length === 1 ? prixEcrits[0] : null;
    lignes.push({
      sorte: 'article', texte: page.nom ?? `Lien ${page.domaine}`, url,
      ...(page.nom ? { titre: page.nom } : {}),
      ...(page.prix !== undefined ? { prix: page.prix, devise: page.devise } : ecrit ? { prix: ecrit.centimes / 100, devise: ecrit.devise } : {}),
      ...(page.vendeur ? { vendeur: page.vendeur } : {}),
      ...rangement(ctx, cible, neuf ?? page.nom ?? page.domaine, mot, true)
    });
  }
  // Un prix écrit sans lien (« Ventilateur moteur EC 189,90 CHF ») : un article au nom de la phrase sans son prix ; le prix lu dans la
  // phrase par `prixTousDe` (décision du pilote : « 189,90 CHF » en CHF ; EUR seulement s'il est écrit). Pas de critère : c'est un objet.
  const ligneSeule = morceaux.length === 1 ? morceaux[0] : '';
  if (!liens.length && ligneSeule && prixEcrits.length === 1 && genreLocal(ligneSeule) !== 'question') {
    const brut = sansLiensNiPrix(sansPrefixeBanc(ligneSeule));
    const nom = brut.charAt(0).toLocaleUpperCase('fr-CH') + brut.slice(1);
    if (nom) lignes.push({ sorte: 'article', texte: nom, titre: nom, prix: prixEcrits[0].centimes / 100, devise: prixEcrits[0].devise, ...rangement(ctx, cible, categorie?.neuf ?? nom, mot) });
  }
  const article = lignes.some((l) => l.sorte === 'article');
  // P10, P23 (D-35, D-24) : un carnet sans critère reçoit son 2e article lu → la caractéristique commune lue, proposée (pas rangée).
  const proposee = cible && !cible.criteres.length && cible.articles.length >= 1 && liens.length
    ? communeLue(liens.map((u) => (ctx.pages ?? []).find((p) => p.url === u) ?? pageSimulee(u)), cible.articles) : null;
  if (proposee) lignes.push({ sorte: 'critere', propose: true, carnetId: cible!.id, ...proposee });
  if (categorie) {
    const titre = neuf ?? categorie.neuf;
    const ou = rangement(ctx, cible, titre, mot, !!liens.length);
    if (!cible && !article) lignes.push({ sorte: 'idee', texte: texte.trim().split('\n')[0].slice(0, 120), titre, ...ou });
    /* « Ce qui compte, tiré de votre phrase » : seulement ce que la phrase dit, toutes catégories nommées comprises (« rangement du
       frigo, plus de condensation au plafond » → la condensation, pas « garder au froid ») ; jamais pour un article */
    const deLaPhrase: CritereSimule[] = [];
    if (!article && !liens.length) {
      for (const k of criteresDeLaPhrase(mots, CATEGORIES.filter((c) => c.motif.test(tm)), cible ? cible.titre : titre)) { deLaPhrase.push(k); lignes.push({ sorte: 'critere', ...k, ...ou }); }
    }
    /* n° 13 : le carnet né d'un lien seul porte le critère de son besoin, proposé par l'IA (« Tient 80 °C » pour le moût) */
    const duLien = lienSeul && !cible && categorie.critereLien ? categorie.critereLien : null;
    if (duLien) lignes.push({ sorte: 'critere', texte: duLien.texte, caracteristique: duLien.caracteristique, ...ou });
    /* n° 9 (D-35) : dans un carnet neuf, les caractéristiques de la catégorie, en puces d'un toucher (proposées, pas rangées), sauf
       celles qu'un critère dit déjà */
    if (!cible && (!article || lienSeul)) {
      const dits = new Set([...deLaPhrase, ...(duLien ? [duLien] : [])].map((k) => sansAccents(String((k.caracteristique as { nom?: string } | undefined)?.nom ?? ''))));
      for (const k of categorie.proposees ?? []) {
        if (dits.has(sansAccents(k.nom))) continue;
        lignes.push({ sorte: 'critere', propose: true, texte: `Comparer sur ${k.nom}`, caracteristique: k, ...ou });
      }
    }
    if (lignes.length) return reponse(lignes.slice(0, 12));
  }
  if (lignes.length) return reponse(lignes);
  // P4 (G5), critique 5 n° 2 : une phrase qui mesure (« Moulin à malt : 2 cylindres, 150 kg/h ») → l'idée à son titre (le libellé), le
  // critère tiré de la mesure (« Débit : 150 kg/h au moins »), le compte sans unité en façon (« 2 cylindres ») ; jamais le titre en critère.
  if (ligneSeule && genreLocal(ligneSeule) !== 'question') {
    const lib = /^([^:]{2,60}?)\s*:/.exec(sansPrefixeBanc(ligneSeule).trim())?.[1]?.trim();
    const titre = lib ?? sansPrefixeBanc(titreNeufDe(ligneSeule));
    const criteres = criteresDeLaPhrase(ligneSeule, [], titre);
    if (criteres.length) {
      const ou = rangement(ctx, ici, titre);
      const sortie: Brut[] = [
        ...criteres.map((k) => ({ sorte: 'critere', ...k, ...ou })),
        ...extraireCriteres(ligneSeule).facons.map((f) => ({ sorte: 'facon', texte: f, titre: f, ...ou }))
      ];
      return reponse(ici ? sortie : [{ sorte: 'idee', texte: ligneSeule, titre, ...ou }, ...sortie]);
    }
  }
  return decoupe(ctx, morceaux);
}

/** Ce qui se dit « le moins possible » (le reste : le plus possible). */
const MOINS_EST_MIEUX = /bruit|prix|poids|consommation|oxygene|delai|encombrement|precision/;

/**
 * La caractéristique numérique lue à la fois sur une page du message et sur un article déjà dans le carnet, même nom et même unité ;
 * la première de la page. `null` s'il n'y en a pas (rien d'inventé).
 */
function communeLue(pages: ReadonlyArray<Pick<PageLue, 'valeurs'> & { statut?: PageLue['statut'] }>, articles: Carnet['articles']): { texte: string; caracteristique: Brut } | null {
  const lues = articles.flatMap((a) => Object.entries(a.valeurs ?? {}).map(([nom, v]) => ({ nom: sansAccents(nom), unite: /^\s*[\d'’   .,]+\s*(.*)$/.exec(v)?.[1]?.trim() ?? '' })));
  for (const p of pages) {
    // les pages du contexte sont déjà les pages lues (sans statut) ; une page simulée dit son statut
    if (p.statut !== undefined && p.statut !== 'lue') continue;
    for (const v of p.valeurs ?? []) {
      if (!v.unite || !/^\s*\d/.test(v.valeur)) continue;
      if (!lues.some((x) => x.nom === sansAccents(v.nom) && x.unite === v.unite)) continue;
      const sens = MOINS_EST_MIEUX.test(sansAccents(v.nom)) ? 'moins' : 'plus';
      const nom = v.nom.charAt(0).toLocaleUpperCase('fr-CH') + v.nom.slice(1);
      return { texte: `${nom} : le plus ${sens === 'plus' ? 'haut' : 'bas'} (${v.unite})`, caracteristique: { nom: v.nom, unite: v.unite, sens } };
    }
  }
  return null;
}

/**
 * Découpe générique : chaque ligne du message devient une note typée (achat, à faire, conseil, question, note). Dans un carnet ouvert,
 * toutes y vont (« ↓ va atterrir ici »). Depuis la liste (critique 5, n° 7 et 30), chaque ligne va dans le carnet que sa catégorie nomme,
 * sinon dans le carnet que `rattacher` trouve (même règle que `planVrac`) ; les autres, ensemble, dans UN carnet neuf au titre mis en forme
 * (`titreNeufDe` : nom d'objet, majuscule ; G23, g5:v02-19).
 */
function decoupe(ctx: ContexteRangerCarnet, morceaux: string[]): ReponseSimulee {
  const ici = ouvert(ctx);
  // Achats en tête (R35, D-128), dans les deux cas ; tri stable.
  if (ici || morceaux.length <= 1) {
    const ou = rangement(ctx, ici, titreNeufDe(morceaux[0]));
    return reponse(morceaux.map((m) => ({ sorte: 'note', ...formerLigne(m), ...ou })).sort(ACHAT_D_ABORD));
  }
  const docs = docsDuContexte(ctx);
  /* comme `planVrac` : deux lignes du même objet (un mot en commun) partagent leur carnet neuf */
  const groupes: { titre: string; mots: Set<string> }[] = [];
  const titreNeufDeLigne = (m: string): string => {
    if (parleDuBrassin(m)) return TITRE_BRASSIN;
    const objet = objetDe(m);
    const mots = new Set(jetonsLocaux(objet));
    const g = groupes.find((x) => [...mots].some((w) => x.mots.has(w)));
    if (g) return g.titre;
    groupes.push({ titre: objet, mots });
    return objet;
  };
  return reponse(morceaux.map((m) => {
    const tm = sansAccents(m);
    const categorie = CATEGORIES.find((c) => c.motif.test(tm));
    const parCategorie = categorie ? par(ctx, categorie.carnet) : undefined;
    const proche = parCategorie ? null : rattacher(m, docs);
    const c = parCategorie ?? (proche ? ctx.carnets.find((x) => x.id === proche.carnetId) : undefined);
    const f = formerLigne(m);
    /* critique 6, n° 1 : comme `planVrac`, un carnet neuf par objet (« Sol local »), le brassin ensemble (« Prochain brassin ») */
    const neuf = c ? '' : titreNeufDeLigne(m);
    return { sorte: 'note', ...f, ...rangement(ctx, c, neuf, parCategorie ? motDe(m, categorie!.motif) : undefined) };
  }).sort(ACHAT_D_ABORD));
}
