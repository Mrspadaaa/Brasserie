/**
 * Carnet d'idées (lot B) : la réponse SIMULÉE de `rangerCarnet` et de `lireLien`, pour le banc (`?preview=carnets`, `?dev-local`) et
 * les tests. Déterministe, marquée « exemple » (`exemple: true` ; le garde pose `origine: 'exemple'`). Aucun appel réseau.
 *
 * Ce fichier est le seul (avec la fixture du lot A) où des objets sont nommés : il joue le rôle du modèle sur les cas du banc
 * (embouteillage, frigo, ventilation, évier, les trois notes de son téléphone `ref/`, les liens de la fixture, les aides G11, G25 à
 * G27 et G29). Le code de l'app n'a aucun gabarit par objet (C2) : les caractéristiques viennent de la réponse, réelle ou simulée.
 * Les pages simulées portent des domaines fictifs, et leurs prix sont des exemples.
 */
import type { ContexteRangerCarnet, PageLue } from '../../../functions/src/carnetIA';
import { liensDuTexte, sansAccents } from './ia';
import { fixtureCarnets } from './fixture';

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
 * - `evier-riviera` : G19, dans Évier (« fond de bac 38 cm ») ;
 * - `plaque-froid/echangeur-30` : la puce « Coller : … » (R15).
 */
export const PAGES_BANC: Readonly<Record<string, Omit<PageLue, 'url' | 'luLe' | 'domaine'>>> = {
  'exemple.invalid/hotte-140': {
    statut: 'lue', nom: 'Hotte inox 140 cm + extracteur', prix: 1980, devise: 'CHF', dispo: 'en-stock', vendeur: 'Inox Exemple',
    valeurs: [{ nom: 'débit', valeur: '2000', unite: 'm³/h' }, { nom: 'tient 80 °C', valeur: 'oui' }]
  },
  'exemple.invalid/pompe-inox': {
    statut: 'lue', nom: 'Pompe de transfert inox', prix: 690, devise: 'CHF', dispo: 'en-stock', vendeur: 'Pompe Exemple',
    valeurs: [{ nom: 'débit', valeur: '40', unite: 'L/min' }, { nom: 'température max', valeur: '90', unite: '°C' }, { nom: 'tient 80 °C', valeur: 'oui' }]
  },
  'exemple.invalid/pompe-magnetique': {
    statut: 'lue', nom: 'Pompe magnétique 12 V', prix: 245, devise: 'CHF', dispo: 'en-stock',
    valeurs: [{ nom: 'débit', valeur: '25', unite: 'L/min' }, { nom: 'température max', valeur: '100', unite: '°C' }, { nom: 'tient 80 °C', valeur: 'oui' }]
  },
  'exemple.invalid/evier-riviera': {
    statut: 'lue', nom: 'Évier inox Riviera 2 bacs', prix: 1450, devise: 'CHF', dispo: 'rupture', vendeur: 'Évier Exemple',
    valeurs: [{ nom: 'fond de bac', valeur: '38', unite: 'cm' }, { nom: 'bacs', valeur: '2' }]
  },
  'exemple.invalid/plaque-froid/echangeur-30': { statut: 'lue', nom: 'Échangeur à plaques 30 plaques', prix: 320, devise: 'CHF', vendeur: 'Froid Exemple' }
};

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
 * La page d'un lien au banc : une adresse de `PAGES_BANC` ou de la fixture → lue (exemple) ; un domaine de `PAGES_SIMULEES` → lue ;
 * tout le reste → `illisible`, jamais inventée.
 */
export function pageSimulee(url: string, luLe = 0): PageLue {
  let domaine = '';
  try { domaine = new URL(url).hostname.replace(/^www\./, ''); } catch { return { url, domaine, statut: 'refusee', luLe }; }
  const cle = cleUrl(url);
  pagesFixture ??= pagesDeLaFixture();
  const parUrl = cle ? PAGES_BANC[cle] ?? pagesFixture[cle] : undefined;
  if (parUrl) return { ...parUrl, url, domaine, luLe };
  const p = PAGES_SIMULEES[domaine];
  return p ? { ...p, url, luLe } : { url, domaine, statut: 'illisible', luLe };
}

/** Durée de lecture d'une page au banc : assez pour voir le squelette « ✻ lecture de la page… » (g5:v03-10). */
export const DELAI_LECTURE_BANC = 1500;

/**
 * `lireLien` simulé : la page de `pageSimulee`, après `delaiMs` (défaut : 1,5 s, `DELAI_LECTURE_BANC` ; 0 dans les tests). S'interrompt
 * au ✕ (`signal`). Aucun réseau.
 */
export function lireLienSimule(url: string, o: { delaiMs?: number; signal?: AbortSignal; luLe?: number } = {}): Promise<PageLue> {
  const delai = o.delaiMs ?? DELAI_LECTURE_BANC;
  const page = () => pageSimulee(url, o.luLe ?? Date.now());
  return new Promise<PageLue>((resolve, reject) => {
    if (o.signal?.aborted) { reject(o.signal.reason); return; }
    if (delai <= 0) { resolve(page()); return; }
    const t = setTimeout(() => resolve(page()), delai);
    o.signal?.addEventListener('abort', () => { clearTimeout(t); reject(o.signal!.reason); }, { once: true });
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
const rangement = (ctx: ContexteRangerCarnet, c: Carnet | undefined, neuf: string): Brut =>
  c ? { carnetId: c.id } : { carnetNeuf: neuf, raisonCarnet: `aucun de vos ${ctx.carnets.length} carnets n'en parle` };
const reponse = (lignes: Brut[]): ReponseSimulee => ({ lignes, exemple: true });

/** Les catégories du banc : chacune a ses caractéristiques (R30 : générique côté app, la variété vient de la réponse). */
const CATEGORIES: Array<{ motif: RegExp; carnet: RegExp; neuf: string; criteres: Array<{ quand: RegExp; texte: string; caracteristique: Brut }> }> = [
  {
    motif: /frigo|chambre froide|refroidi|garder au froid/, carnet: /frigo|froid/, neuf: 'Frigo pour les fûts',
    criteres: [
      { quand: /°c|degre|froid|frigo/, texte: 'Garder les fûts au froid', caracteristique: { nom: 'température mini', unite: '°C', sens: 'moins' } },
      { quand: /fut|litre|\bl\b|volume/, texte: 'Assez de place pour les fûts', caracteristique: { nom: 'volume utile', unite: 'L', sens: 'plus' } }
    ]
  },
  {
    motif: /ventil|hotte|extract|condensation|buee/, carnet: /ventil|hotte/, neuf: 'Ventilation de la salle de brassage',
    criteres: [
      { quand: /condensation|buee|plafond/, texte: 'Plus de condensation au plafond', caracteristique: { nom: 'débit', unite: 'm³/h', sens: 'plus' } },
      { quand: /bruit|calme/, texte: 'Pas trop de bruit', caracteristique: { nom: 'bruit', unite: 'dB', sens: 'moins' } }
    ]
  },
  {
    motif: /evier|bac\b|bacs\b|laver/, carnet: /evier/, neuf: 'Évier inox',
    criteres: [{ quand: /fut|fond|bac|couche/, texte: 'Un fût de 30 L couché entre dans le bac', caracteristique: { nom: 'fond de bac', unite: 'cm', sens: 'plus' } }]
  },
  {
    motif: /embouteill|bouteille|oxygene|isobar/, carnet: /embouteill/, neuf: 'Embouteillage',
    criteres: [{ quand: /oxygene|isobar/, texte: "Minimiser l'oxygène", caracteristique: { nom: 'oxygène dissous', unite: 'ppb', sens: 'moins' } }]
  },
  {
    motif: /pompe|transfert/, carnet: /pompe|transfert/, neuf: 'Pompe de transfert',
    criteres: [{ quand: /80|chaud|temperature/, texte: 'Tient 80 °C', caracteristique: { nom: 'tient 80 °C', sens: 'oui-non' } }]
  }
];

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

const genreDe = (ligne: string): string => {
  const t = sansAccents(ligne);
  if (/\?\s*$/.test(ligne)) return 'question';
  if (/acheter|commander|\bprix\b|chf|fr\.|€/.test(t)) return 'a-acheter';
  if (/penser a|conseil|astuce|plutot/.test(t)) return 'conseil';
  if (/^(appeler|demander|verifier|mesurer|nettoyer|monter|poser|prevoir|faire|ajouter|regarder|changer)\b/.test(t)) return 'a-faire';
  return 'note';
};

/**
 * La réponse simulée, telle que le modèle la rendrait (forme du schéma). Ordre : notes `ref/`, aides, liens, catégories, puis
 * découpe générique (une ligne par ligne du message). `null` seulement pour un message vide.
 */
export function reponseSimulee(ctx: ContexteRangerCarnet): ReponseSimulee | null {
  const texte = ctx.texte ?? '';
  if (!texte.trim()) return null;
  const t = sansAccents(texte);
  const ref = notesRef(t, ctx);
  if (ref) return ref;
  const aide = aides(texte, t, ctx);
  if (aide) return aide;

  const lignes: Brut[] = [];
  const categorie = CATEGORIES.find((c) => c.motif.test(t));
  // Une catégorie reconnue (frigo, ventilation, évier) va dans son carnet, ou dans une idée neuve : jamais dans un autre carnet resté ouvert.
  const cible = categorie ? par(ctx, categorie.carnet) : ouvert(ctx);

  // Liens : un article par lien, avec ce que la page (simulée) a lu ; le prix de la page, jamais un autre.
  for (const url of liensDuTexte(texte).slice(0, 3)) {
    const page = (ctx.pages ?? []).find((p) => p.url === url) ?? pageSimulee(url);
    lignes.push({
      sorte: 'article', texte: page.nom ?? `Lien ${page.domaine}`, url,
      ...(page.nom ? { titre: page.nom } : {}),
      ...(page.prix !== undefined ? { prix: page.prix, devise: page.devise } : {}),
      ...(page.vendeur ? { vendeur: page.vendeur } : {}),
      ...rangement(ctx, cible, categorie?.neuf ?? page.nom ?? page.domaine)
    });
  }
  if (categorie) {
    const ou = rangement(ctx, cible, categorie.neuf);
    if (!cible) lignes.push({ sorte: 'idee', texte: texte.trim().split('\n')[0].slice(0, 120), titre: categorie.neuf, ...ou });
    for (const k of categorie.criteres) if (k.quand.test(t)) lignes.push({ sorte: 'critere', texte: k.texte, caracteristique: k.caracteristique, ...ou });
    if (lignes.length) return reponse(lignes.slice(0, 12));
  }
  if (lignes.length) return reponse(lignes);

  // Découpe générique : chaque ligne du message devient une note typée, dans le carnet ouvert ou une idée neuve.
  const morceaux = texte.split(/\n|;|•/).map((l) => l.replace(/^[-*\s]+/, '').trim()).filter(Boolean).slice(0, 12);
  const ou = rangement(ctx, ouvert(ctx), morceaux[0].slice(0, 60));
  return reponse(morceaux.map((m) => ({ sorte: 'note', genre: genreDe(m), texte: m, ...ou })));
}
