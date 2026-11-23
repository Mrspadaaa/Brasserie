import type { EtapeLien, PageLue } from './carnetIA.js';
import { couper } from './lienProduit.js';

/**
 * Marche « page bloquée » de la lecture des liens (23.11, `banc-liens/bloquees/RESULTATS.md`) : quand le site refuse le robot (401, 403, 429, défi
 * Cloudflare), `lireLien` demande à Gemini 3.5 Flash-Lite de lire la copie que GOOGLE a de la page (outil `url_context`). Jamais pour robots.txt
 * (le brasseur a voulu le respecter), jamais pour une page introuvable. Le défi du site n'est pas contourné : c'est Google qui a lu la page.
 *
 * État de l'art (MISSION.md) : « grounding » d'un modèle sur une adresse = l'outil `url_context` de l'API Gemini, qui rend aussi la trace de sa
 * lecture (`urlContextMetadata`). `google_search` est exclu : sur 5 essais il n'a exécuté aucune recherche et a répondu de mémoire, avec de faux
 * prix. Chrome sans écran est exclu (`lienNavigateur.ts`, non branché) : 1 page de plus sur 63, 1 à 2 Gio de mémoire.
 *
 * Garde (rien n'est inventé). Le texte lu par Google ne nous revient pas : on ne peut pas y retrouver chaque valeur comme `lienIA.garder`. On
 * se fie donc à la TRACE de l'outil, jamais à la vraisemblance de la réponse :
 *  1. l'outil dit `URL_RETRIEVAL_STATUS_SUCCESS` pour l'adresse demandée, avec des jetons de page lus (`toolUsePromptTokenCount` > 0) ;
 *  2. le modèle dit lui-même `type: 'fiche'` (une catégorie, un lien mort ou une page illisible ne rend rien) ;
 *  3. le nom partage un mot avec l'adresse (un nom sans rapport = réponse de mémoire) ; un prix sans devise, nul ou à plus de deux
 *     décimales est retiré ; une caractéristique sans chiffre est retirée ;
 *  4. aucune photo : l'outil rend le texte, pas le HTML, donc jamais d'adresse de photo (mesuré) ; le champ reste vide ;
 *  5. tout est marqué « lue par Google » à l'étape `bloquee`, que l'écran montre : trouvé, absent ou douteux.
 */

export const LIEN_BLOQUEE_SORTIE_MAX = 1800;
const SUCCES = 'URL_RETRIEVAL_STATUS_SUCCESS';

export const LIEN_BLOQUEE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    type: { type: 'STRING', enum: ['fiche', 'categorie', 'introuvable', 'illisible'] },
    nom: { type: 'STRING', nullable: true },
    prix: { type: 'NUMBER', nullable: true },
    devise: { type: 'STRING', nullable: true },
    taxe: { type: 'STRING', enum: ['ht', 'ttc'], nullable: true },
    prixDes: { type: 'BOOLEAN', nullable: true },
    caracteristiques: { type: 'ARRAY', items: { type: 'OBJECT', properties: { nom: { type: 'STRING' }, valeur: { type: 'STRING' } }, required: ['nom', 'valeur'], propertyOrdering: ['nom', 'valeur'] } }
  },
  required: ['type', 'caracteristiques'],
  propertyOrdering: ['type', 'nom', 'prix', 'devise', 'taxe', 'prixDes', 'caracteristiques']
} as const;

export const LIEN_BLOQUEE_CONSIGNE = [
  'Tu lis une page produit d\'une boutique en ligne et tu rends UNIQUEMENT ce qui y est écrit, copié tel quel. N\'invente rien, ne convertis rien, ne calcule rien, ne réponds jamais de mémoire.',
  '- type : « fiche » si la page est la fiche d\'UN produit ; « categorie » si c\'est une liste, une recherche ou une page d\'accueil ; « introuvable » si le produit n\'existe plus ; « illisible » si tu n\'as pas pu lire la page.',
  '- nom : le nom du produit. prix : le prix de vente du produit principal pour 1 pièce (pas un prix barré, pas un accessoire) ; devise : code ISO. taxe : « ht » ou « ttc » seulement si la page le dit. prixDes : true si le prix est « dès / ab / from ».',
  '- caracteristiques : au plus 12 mesures techniques écrites (volume, dimensions, matière, puissance…), nom court et valeur avec unité.',
  'Un champ absent de la page est null (ou une liste vide).'
].join('\n');

export interface ReponseBloquee {
  type?: unknown; nom?: unknown; prix?: unknown; devise?: unknown; taxe?: unknown; prixDes?: unknown; caracteristiques?: unknown;
}

/** Ce que Google dit avoir lu : la réponse du modèle (NON fiable en soi) et la trace de l'outil. */
export interface LectureGoogle {
  reponse: unknown;
  /** Les adresses que l'outil dit avoir demandées, avec leur statut (`urlContextMetadata.urlMetadata`). */
  lectures: Array<{ adresse: string; statut: string }>;
  /** Les jetons de page lus par l'outil (`toolUsePromptTokenCount`) : 0 = rien n'a été lu. */
  jetonsPage: number;
}
/** L'appel à Gemini, injecté : `aiTask` le lie à Flash-Lite (budget, journal) ; les tests le simulent. Lève en cas de panne. */
export type AppelPageBloquee = (adresse: string, signal?: AbortSignal) => Promise<LectureGoogle>;

/** La trace de l'outil dans une réponse `generateContent` complète (camelCase de l'API ou snake_case du banc). */
export function lectureDeReponse(brut: any, reponse: unknown): LectureGoogle {
  const cand = brut?.candidates?.[0];
  const meta: any[] = cand?.urlContextMetadata?.urlMetadata ?? cand?.url_context_metadata?.url_metadata ?? [];
  const jetons = brut?.usageMetadata?.toolUsePromptTokenCount;
  return {
    reponse,
    lectures: (Array.isArray(meta) ? meta : []).map((m) => ({ adresse: String(m?.retrievedUrl ?? m?.retrieved_url ?? ''), statut: String(m?.urlRetrievalStatus ?? m?.url_retrieval_status ?? '') })),
    jetonsPage: Number.isSafeInteger(jetons) && jetons > 0 ? jetons : 0
  };
}

const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ß/g, 'ss').replace(/(?<=[aou])e/g, '');
/** Le même site et la même page, `www`, barre finale et ancre mis à part. */
function memeAdresse(a: string, b: URL): boolean {
  try {
    const u = new URL(a);
    const h = (x: URL) => x.hostname.toLowerCase().replace(/^www\./, '');
    const chemin = (x: URL) => x.pathname.replace(/\/+$/, '') + x.search;
    return h(u) === h(b) && chemin(u) === chemin(b);
  } catch { return false; }
}

/** Le nom lu partage-t-il un mot avec l'adresse ? Sans mot de plus de 3 lettres dans l'adresse (« /p/5866824 »), le contrôle ne s'applique pas. */
export function nomCoherent(nom: string, adresse: URL): boolean {
  const mots = (t: string) => norm(t).split(/[^a-z0-9]+/).filter((m) => m.length >= 3);
  let brut = adresse.hostname + adresse.pathname;
  try { brut = decodeURIComponent(brut); } catch { /* adresse mal encodée : lue telle quelle */ }
  const chemin = norm(brut);
  const enAdresse = mots(adresse.pathname).filter((m) => /[a-z]{4}/.test(m));
  if (!enAdresse.length) return true;
  return mots(nom).some((m) => chemin.includes(m));
}

const texte = (v: unknown, max: number): string | undefined => typeof v === 'string' && v.trim() ? couper(v.trim().replace(/\s+/g, ' '), max) : undefined;
const domaineDe = (u: URL) => u.hostname.replace(/^www\./, '');

/**
 * Applique la garde à ce que Google a lu. `page` : la fiche lue (statut `lue`) ou `null` ; `etape` : l'étape `bloquee`, dite à l'écran.
 * absent = Google n'a rien lu de sûr ; douteux = lu, mais au moins un champ retiré par la garde ; trouvé = lu, rien retiré.
 */
export function pageLueParGoogle(url: URL, l: LectureGoogle, luLe: number): { page: PageLue | null; etape: EtapeLien } {
  const absent = (detail: string) => ({ page: null, etape: { nom: 'bloquee' as const, statut: 'absent' as const, detail } });
  const lue = l.lectures.find((x) => memeAdresse(x.adresse, url));
  if (!lue) return absent('Google n\'a pas lu cette adresse');
  if (lue.statut !== SUCCES) return absent('Google n\'a pas pu lire la page');
  if (l.jetonsPage <= 0) return absent('aucune page lue par Google');
  const r = (l.reponse && typeof l.reponse === 'object' && !Array.isArray(l.reponse) ? l.reponse : null) as ReponseBloquee | null;
  if (!r) return absent('réponse illisible');
  if (r.type !== 'fiche') return absent(`Google lit ${r.type === 'categorie' ? 'une page de liste, pas une fiche' : r.type === 'introuvable' ? 'un produit introuvable' : 'une page illisible'}`);

  const retire: string[] = [];
  let nom = texte(r.nom, 180);
  if (nom && !nomCoherent(nom, url)) { retire.push('nom sans rapport avec l\'adresse'); nom = undefined; }
  let prix: number | undefined, devise: string | undefined, taxe: 'ht' | 'ttc' | undefined, prixDes: true | undefined;
  if (r.prix !== undefined && r.prix !== null) {
    const p = r.prix, d = typeof r.devise === 'string' ? r.devise.trim().toUpperCase() : '';
    if (typeof p === 'number' && Number.isFinite(p) && p > 0 && p < 10_000_000 && Math.abs(p * 100 - Math.round(p * 100)) < 1e-6 && /^[A-Z]{3}$/.test(d)) {
      prix = p; devise = d;
      if (r.taxe === 'ht' || r.taxe === 'ttc') taxe = r.taxe;
      if (r.prixDes === true) prixDes = true;
    } else retire.push('prix');
  }
  const valeurs: Array<{ nom: string; valeur: string }> = [];
  for (const c of (Array.isArray(r.caracteristiques) ? r.caracteristiques : []).slice(0, 12)) {
    const n = texte((c as { nom?: unknown })?.nom, 60), v = texte((c as { valeur?: unknown })?.valeur, 100);
    if (!n || !v) continue;
    if (!/\d/.test(v)) { retire.push(`caract ${n}`); continue; }
    if (!valeurs.some((x) => norm(x.nom) === norm(n))) valeurs.push({ nom: n, valeur: v });
  }

  const dit = [nom ? 'nom' : '', prix !== undefined ? `prix ${prix} ${devise}${taxe ? ` ${taxe}` : ''}` : '', valeurs.length ? `${valeurs.length} caract.` : ''].filter(Boolean);
  if (!nom && prix === undefined) return { page: null, etape: { nom: 'bloquee', statut: retire.length ? 'douteux' : 'absent', detail: retire.length ? `Google a lu la page, rien de sûr : ${retire.join(', ')}` : 'Google a lu la page : ni nom ni prix' } };
  const etape: EtapeLien = { nom: 'bloquee', statut: retire.length ? 'douteux' : 'trouve', detail: `lue par Google : ${dit.join(', ')}${retire.length ? ` ; retiré : ${retire.join(', ')}` : ''}` };
  const etapes: EtapeLien[] = [
    { nom: 'page', statut: 'absent', detail: 'bloquee' }, etape,
    prix !== undefined ? { nom: 'prix', statut: 'trouve', detail: `${prix} ${devise}${taxe ? ` ${taxe}` : ''} (lu par Google)` } : { nom: 'prix', statut: 'absent' },
    { nom: 'photos', statut: 'absent', detail: 'Google ne rend pas la photo' },
    valeurs.length ? { nom: 'caract', statut: 'trouve', detail: `${valeurs.length} (lues par Google)` } : { nom: 'caract', statut: 'absent' }
  ];
  return {
    etape,
    page: {
      url: url.href, domaine: domaineDe(url), statut: 'lue', luLe,
      ...(nom ? { nom } : {}),
      ...(prix !== undefined && devise ? { prix, devise, ...(taxe ? { taxe } : {}), ...(prixDes ? { prixDes } : {}) } : {}),
      ...(valeurs.length ? { valeurs } : {}),
      etapes
    }
  };
}
