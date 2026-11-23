import type { TaskDef } from './prompts.js';

/**
 * Carnet d'idées (port du 17.11, lot B) : la tâche `rangerCarnet`. Le brasseur écrit dans un seul champ, comme dans un chat ; l'IA met
 * en forme, trie et range dans ses idées (« En gros, un chat, et ça met en forme, c'est tout et ça permet de comparer les idée », D-142).
 *
 * État de l'art (MISSION.md) : extraction d'entités dans un texte court, sortie imposée (`responseSchema`), puis garde déterministe côté
 * client (`src/domain/carnets/ia.ts`, `lireReponse`), sur le patron testé de `rangerNote.ts`. Rien n'est inventé : une URL, un prix, une
 * quantité, un vendeur ne passent que s'ils sont écrits dans le message ou lus sur la page (`lireLien.ts`).
 *
 * Écrite et testée ici, déployée par le lot G seulement (accord du 17.11 au soir, D-144). Ce fichier n'a aucune dépendance d'exécution :
 * le client en réutilise les constantes et les types (une seule écriture du contrat).
 */

export const SORTES_CARNET = ['idee', 'critere', 'facon', 'article', 'note'] as const;
export const GENRES_CARNET = ['a-acheter', 'a-faire', 'question', 'conseil', 'note'] as const;
export const SENS_CARNET = ['plus', 'moins', 'oui-non', 'texte'] as const;
export type SorteCarnet = typeof SORTES_CARNET[number];
export type GenreCarnet = typeof GENRES_CARNET[number];
export type SensCarnet = typeof SENS_CARNET[number];

/** Au plus 12 lignes rendues par message ; au plus 30 carnets dans le contexte (les plus récents). */
export const LIGNES_MAX = 12;
export const CARNETS_MAX = 30;
export const TEXTE_MAX = 4000;
export const PAGES_MAX = 3;
const NOTES_MAX = 20;
const ARTICLES_MAX = 12;
const COURT = 160;

/** Une page produit lue par `lireLien` (sans modèle). Ce qui n'est pas lu est absent, jamais 0. */
export interface PageLue {
  /** Adresse finale lue (après redirections), ou l'adresse demandée si rien n'a été lu. */
  url: string;
  domaine: string;
  /**
   * `lue` : au moins un nom, un prix ou une photo lus dans les métadonnées ; tout autre statut = « lien · page non lue ». L-4 (23.11) :
   * `bloquee` = le site refuse le robot (401, 403, 429, défi Cloudflare) ; `introuvable` = le domaine n'existe pas (DNS).
   */
  statut: 'lue' | 'illisible' | 'robots' | 'refusee' | 'indisponible' | 'bloquee' | 'introuvable';
  nom?: string;
  /** Prix en unités de la devise (690, 1450.5), lu dans schema.org `Offer` ou Open Graph `product:price`. */
  prix?: number;
  devise?: string;
  /** « dès » : plusieurs prix sont publiés, le plus bas est donné. */
  prixDes?: boolean;
  dispo?: 'en-stock' | 'rupture';
  vendeur?: string;
  photo?: string;
  /** Caractéristiques publiées (`additionalProperty`), telles quelles. */
  valeurs?: Array<{ nom: string; valeur: string; unite?: string }>;
  luLe: number;
}

export interface CaracteristiqueCompacte { nom: string; unite?: string; sens: SensCarnet }
export interface CarnetCompact {
  id: string;
  titre: string;
  criteres: Array<{ texte: string; caracteristique?: CaracteristiqueCompacte }>;
  facons: string[];
  articles: Array<{ nom: string; valeurs?: Record<string, string> }>;
  notes: Array<{ id: string; texte: string }>;
}
export interface ContexteRangerCarnet {
  texte: string;
  /** Date de saisie AAAA-MM-JJ. */
  saisie: string;
  /** Le carnet ouvert quand il a écrit ; `null` depuis la liste. */
  depuis: string | null;
  carnets: CarnetCompact[];
  /** Pages lues des liens du message, s'il y en a (prix, vendeur, valeurs). */
  pages?: Array<Pick<PageLue, 'url' | 'domaine' | 'nom' | 'prix' | 'devise' | 'vendeur' | 'valeurs'>>;
}

/*
 * `propertyOrdering` (23.11, lien gastro-held.ch) : sans lui, Gemini sort les champs requis puis les autres par ordre alphabétique
 * (`sorte`, `texte`, puis `caracteristique`, `carnetId`… `url`, `vendeur`). `carnetId`, `prix` et `devise` venaient avant `url` ; il les
 * sautait, et ce qu'il voulait encore dire bouclait dans le dernier champ libre (`vendeur`, 3 985 jetons, coupé au plafond, 9 rejeux sur 9).
 * Les clés sortent dans l'ordre écrit ici : rangement et prix avant le vendeur.
 */
const S = (properties: Record<string, unknown>, required: string[]) => ({ type: 'OBJECT', properties, required, propertyOrdering: Object.keys(properties) });
const str = { type: 'STRING', nullable: true };
const num = { type: 'NUMBER', nullable: true };

export const RANGER_CARNET_SCHEMA = S({
  lignes: {
    type: 'ARRAY',
    items: S({
      sorte: { type: 'STRING', enum: [...SORTES_CARNET] },
      genre: { type: 'STRING', enum: [...GENRES_CARNET], nullable: true },
      texte: { type: 'STRING' },
      titre: str,
      carnetId: str,
      carnetNeuf: str,
      raisonCarnet: str,
      url: str,
      prix: num,
      devise: str,
      quantite: num,
      unite: str,
      vendeur: str,
      caracteristique: { ...S({ nom: { type: 'STRING' }, unite: str, sens: { type: 'STRING', enum: [...SENS_CARNET] } }, ['nom', 'sens']), nullable: true },
      consequence: str,
      doublonDe: str,
      commeCritere: { type: 'BOOLEAN', nullable: true },
      regrouperAvec: { type: 'ARRAY', items: { type: 'STRING' }, nullable: true },
      titrePropose: str,
      propose: { type: 'BOOLEAN', nullable: true }
    }, ['sorte', 'texte'])
  }
}, ['lignes']);

export const RANGER_CARNET: TaskDef = {
  defaultTier: 'fast',
  // 12 lignes courtes : 4 000 jetons laissent la place à la réflexion basse (même plafond que `rangerNote`).
  // L-3 (23.11, L20) : 2 réponses coupées sur 25 au journal du 23.11 (02:47 et 02:55), à 32 s contre 3 à 25 s pour les autres. Les jetons
  // n'étaient pas journalisés : non mesuré. Estimé : 4 000 jetons à ce débit font 3 à 10 fois une réponse ordinaire, donc une boucle
  // plutôt qu'une réponse longue ; 8 000 la couperaient vers 64 s, au-delà des 45 s du client. Le plafond reste ; `aiTask` journalise
  // désormais les jetons (sortie, réflexion) de chaque rangement, et le client garde la page lue quand la réponse est coupée (L-1).
  maxOutputTokens: 4000,
  acceptsFile: false,
  system: `Tu assistes une micro-brasserie suisse. Le brasseur note ses idées dans un carnet, comme dans un chat : une phrase, un lien
collé, ou une note en vrac copiée de son téléphone. Mets en forme, trie et range, sans rien inventer.

Tu reçois : « texte » (son message, tel quel), « saisie » (AAAA-MM-JJ), « depuis » (l'id du carnet ouvert, ou null depuis la
liste), « carnets » (ses idées : id, titre, critères, façons, articles, notes avec leur id) et parfois « pages » (ce qui a été lu sur
la page de chaque lien : nom, prix, devise, vendeur, valeurs).

Deux règles d'abord :
  • une exigence, un seuil ou une contrainte est un "critere", jamais une "note" : « doit tenir <température> », « <débit> au
    moins », « <contenant> de <volume> couché » (il doit entrer quelque part) ; si le carnet a déjà un critère de même unité, reprends
    son « nom » : le seuil s'y ajoute ;
  • une ligne qui parle d'un AUTRE objet que celui du carnet ouvert (un autre équipement, une autre partie du local) ne lui appartient
    pas : « carnetId » d'un carnet qui en parle, sinon « carnetNeuf » titré par cet objet. Un objet d'une autre phrase n'est jamais un
    critère du carnet ouvert. Une pièce ou un réglage de l'objet du carnet reste dans ce carnet.

Rends « lignes », une par chose, au plus ${LIGNES_MAX}, dans l'ordre : d'abord ce qu'il faut acheter, puis le reste.
  • "idee" : une envie nouvelle (le carnet lui-même). « titre » court, sa phrase gardée en « texte ».
  • "critere" : ce qui compte pour choisir (une exigence, une contrainte). Si le critère se mesure, « caracteristique » = la
    grandeur qui servira à comparer les articles : « nom » court en minuscules, « unite » si elle existe, « sens » : "plus" (plus
    c'est mieux), "moins", "oui-non" ou "texte". Choisis la grandeur selon la catégorie de l'objet, pas selon un modèle fixe.
  • "facon" : une manière de faire (une solution), sans produit précis.
  • "article" : un produit précis, souvent un lien. « url » telle qu'écrite dans le texte ; « titre » = nom du produit.
    Un lien dont la page lue n'a ni prix ni offre (une page de référence : encyclopédie, article, fiche technique) est une "note"
    de genre "note" : « texte » = le nom lu de la page, « url » = le lien ; jamais l'adresse seule en « texte ».
  • "note" : le reste. « genre » de chaque ligne, "note" seulement en dernier recours : "a-acheter" (une chose à acheter,
    même sans le mot acheter : « filtre à air G4, 2 pièces »), "a-faire" (un geste), "question" (un doute, un « ? »), "conseil".
« texte » reprend ses mots, mis en forme (orthographe, une ligne claire, majuscule), jamais une idée qu'il n'a pas écrite :
  • sans le préfixe « ZZ TEST — » ni un libellé de carnet en tête (« cave : robinet à pédale » → « Robinet à pédale ») ;
  • un geste commence par son verbe à l'infinitif (« faut appeler le ferblantier » → « Appeler le ferblantier ») ;
  • un critère garde seulement ce qui se mesure ou se vérifie, sans le titre de l'idée (« Moulin à malt : 2 cylindres, 150 kg/h
    minimum » → « 2 cylindres, 150 kg/h minimum ») et avec chacun de ses nombres et unités (« Un fût de 30 L couché entre dans le
    bac (38 cm) ») ; une valeur se dit avec son sens (« 1 200 m³/h au moins ») ;
  • « plus de X » qui dit une gêne (condensation, bruit, odeur, fuite) veut dire « n'en plus avoir » : reformule « Moins de X » ou
    « Pas de X », jamais « Plus de X » ;
  • aucune phrase recopiée telle quelle quand elle se met en forme.

Rangement : « carnetId » = l'id d'un des « carnets » si la ligne en parle clairement ; sinon « carnetNeuf » = un titre court pour
une idée nouvelle, et « raisonCarnet » dit en quelques mots pourquoi (« aucun carnet n'en parle »). Depuis un carnet ouvert, une
ligne qui n'en sort pas va dans « depuis ».

Rien d'inventé : « url », « prix », « quantite » et « vendeur » seulement s'ils sont écrits dans le texte ou lus dans « pages ».
« prix » en unités (690, 1450.5), « devise » ISO (CHF, EUR). Un champ inconnu est nul, jamais 0.

Aides (seulement quand c'est sûr, sinon nul) :
  • « doublonDe » (sur une note) : l'id d'une note des « carnets » qui dit la même chose.
  • « commeCritere » (sur une note) : true si la note est en fait une exigence pour choisir.
  • « regrouperAvec » (sur une note) : les ids des notes qui parlent de la même visite ou du même sujet.
  • « consequence » (sur un critère, un article ou une note) : ce que ce dépôt change pour comparer, en une phrase, avec seulement
    des noms et des nombres présents dans le texte ou dans le carnet.
  • « titrePropose » (sur une ligne "idee" avec « carnetId ») : un meilleur titre pour ce carnet, 60 caractères au plus, si le
    message le précise ; jamais le titre actuel.
  • « propose » (sur un "critere" avec « carnetId » et « caracteristique ») : true quand ce carnet n'a encore aucun critère et que
    l'article du message est au moins son 2e : propose la caractéristique lue sur ces articles (dans « pages » et « articles »),
    avec la même unité, qui les départage le mieux (« débit », « m³/h », "plus"). Elle n'est pas rangée : il l'accepte d'un toucher.`,
  schema: RANGER_CARNET_SCHEMA
};

const SORTES = new Set<string>(SORTES_CARNET);
const GENRES = new Set<string>(GENRES_CARNET);
const SENS = new Set<string>(SENS_CARNET);
const CHAINES = ['genre', 'titre', 'carnetId', 'carnetNeuf', 'raisonCarnet', 'url', 'devise', 'unite', 'vendeur', 'consequence', 'doublonDe', 'titrePropose'] as const;
const chaine = (v: unknown, max = 300): string | undefined => typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined;

/**
 * Garde serveur : ne laisse passer que la forme du schéma (le client revérifie le sens : ids connus, URL, prix, vendeur…).
 * Une forme fausse rend `{ lignes: [] }` ; au-delà de 12 lignes, les suivantes sont coupées.
 */
export function assainirRangerCarnet(data: unknown): { lignes: Array<Record<string, unknown>> } {
  const lignes = (data as { lignes?: unknown } | null)?.lignes;
  if (!Array.isArray(lignes)) return { lignes: [] };
  return {
    lignes: lignes.slice(0, LIGNES_MAX).flatMap((l) => {
      if (!l || typeof l !== 'object') return [];
      const r = l as Record<string, unknown>;
      const texte = chaine(r.texte);
      if (!SORTES.has(r.sorte as string) || !texte) return [];
      const out: Record<string, unknown> = { sorte: r.sorte, texte };
      // Un lien collé dépasse souvent 300 caractères (gastro-held.ch, 331 avec gclid) : coupé, il ne se retrouve plus dans le message
      // et la page lue se détache (ni photo, ni stock). Même borne que les pages lues : 2 000.
      for (const c of CHAINES) { const v = chaine(r[c], c === 'url' ? 2000 : 300); if (v) out[c] = v; }
      if (out.genre !== undefined && !GENRES.has(out.genre as string)) delete out.genre;
      for (const c of ['prix', 'quantite'] as const) if (typeof r[c] === 'number' && Number.isFinite(r[c]) && (r[c] as number) > 0) out[c] = r[c];
      const k = r.caracteristique as Record<string, unknown> | null | undefined;
      if (k && typeof k === 'object' && chaine(k.nom, 60) && SENS.has(k.sens as string))
        out.caracteristique = { nom: chaine(k.nom, 60), sens: k.sens, ...(chaine(k.unite, 12) ? { unite: chaine(k.unite, 12) } : {}) };
      if (r.commeCritere === true) out.commeCritere = true;
      if (r.propose === true) out.propose = true;
      if (Array.isArray(r.regrouperAvec)) {
        const ids = r.regrouperAvec.filter((x): x is string => typeof x === 'string' && x.trim() !== '').map((x) => x.trim()).slice(0, 12);
        if (ids.length) out.regrouperAvec = ids;
      }
      return [out];
    })
  };
}

const iso = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const sansVide = <T extends Record<string, unknown>>(o: T): T => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;

function carnetCompact(c: unknown): CarnetCompact | null {
  if (!c || typeof c !== 'object') return null;
  const r = c as Record<string, unknown>;
  const id = chaine(r.id, 120), titre = chaine(r.titre, COURT);
  if (!id || !titre) return null;
  const liste = (v: unknown, max: number): unknown[] => Array.isArray(v) ? v.slice(0, max) : [];
  const criteres = liste(r.criteres, 12).flatMap((x) => {
    const o = x as Record<string, unknown> | null;
    const texte = chaine(o?.texte, COURT);
    if (!texte) return [];
    const k = o?.caracteristique as Record<string, unknown> | undefined;
    const caracteristique = k && chaine(k.nom, 60) && SENS.has(k.sens as string)
      ? sansVide({ nom: chaine(k.nom, 60)!, unite: chaine(k.unite, 12), sens: k.sens as SensCarnet }) : undefined;
    return [sansVide({ texte, caracteristique })];
  });
  const facons = liste(r.facons, 12).flatMap((x) => { const t = chaine(typeof x === 'string' ? x : (x as { nom?: unknown } | null)?.nom, COURT); return t ? [t] : []; });
  const articles = liste(r.articles, ARTICLES_MAX).flatMap((x) => {
    const o = x as Record<string, unknown> | null;
    const nom = chaine(o?.nom, COURT);
    if (!nom) return [];
    const v = o?.valeurs && typeof o.valeurs === 'object' ? Object.entries(o.valeurs as Record<string, unknown>).slice(0, 8)
      .flatMap(([k, val]) => typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean' ? [[k.slice(0, 60), String(val).slice(0, 60)]] : []) : [];
    return [v.length ? { nom, valeurs: Object.fromEntries(v) } : { nom }];
  });
  const notes = liste(r.notes, NOTES_MAX).flatMap((x) => {
    const o = x as Record<string, unknown> | null;
    const nid = chaine(o?.id, 120), texte = chaine(o?.texte, COURT);
    return nid && texte ? [{ id: nid, texte }] : [];
  });
  return { id, titre, criteres, facons, articles, notes };
}

/** Le contexte envoyé au modèle : le message et ses idées, compacts ; `null` si la forme est fausse (refusé avant tout appel). */
export function contexteRangerCarnet(context: unknown): ContexteRangerCarnet | null {
  const c = context as Record<string, unknown> | null;
  if (!c || typeof c !== 'object') return null;
  if (typeof c.texte !== 'string' || !c.texte.trim() || c.texte.length > TEXTE_MAX) return null;
  if (!iso(c.saisie)) return null;
  if (c.depuis !== null && c.depuis !== undefined && typeof c.depuis !== 'string') return null;
  if (c.carnets !== undefined && !Array.isArray(c.carnets)) return null;
  const carnets = ((c.carnets as unknown[] | undefined) ?? []).slice(0, CARNETS_MAX).flatMap((x) => { const k = carnetCompact(x); return k ? [k] : []; });
  const pages = Array.isArray(c.pages) ? c.pages.slice(0, PAGES_MAX).flatMap((p) => {
    const o = p as Record<string, unknown> | null;
    const url = chaine(o?.url, 2000), domaine = chaine(o?.domaine, 120);
    if (!url || !domaine) return [];
    const valeurs = Array.isArray(o?.valeurs) ? (o!.valeurs as unknown[]).slice(0, 12).flatMap((v) => {
      const w = v as Record<string, unknown> | null;
      const nom = chaine(w?.nom, 60), valeur = chaine(w?.valeur, 60);
      return nom && valeur ? [sansVide({ nom, valeur, unite: chaine(w?.unite, 12) })] : [];
    }) : [];
    return [sansVide({
      url, domaine, nom: chaine(o?.nom, COURT), vendeur: chaine(o?.vendeur, 80), devise: chaine(o?.devise, 3),
      prix: typeof o?.prix === 'number' && Number.isFinite(o.prix) && o.prix > 0 ? o.prix : undefined,
      valeurs: valeurs.length ? valeurs : undefined
    })];
  }) : [];
  return sansVide({ texte: c.texte.trim(), saisie: c.saisie, depuis: typeof c.depuis === 'string' ? c.depuis : null, carnets, pages: pages.length ? pages : undefined }) as ContexteRangerCarnet;
}
