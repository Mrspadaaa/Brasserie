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

/*
 * D451 (port du suivi) : les champs neufs de chaque ligne. Les listes reprennent celles de `src/domain/carnets/modele.ts` (SORTES_ETIQUETTE,
 * GenreCarnet, EtatSuivi) : ce fichier n'a aucune dépendance, le test `carnetsIASuivi` compare les deux.
 */
export const ETIQUETTES_CARNET = ['constat', 'piste', 'ecart', 'retenu', 'trouve', 'pas-trouve', 'contact', 'devis', 'cout', 'achat', 'cause', 'veille', 'pourquoi'] as const;
export const GENRES_SUIVI = ['probleme', 'memo', 'recolte', 'idee', 'achat'] as const;
export const ETATS_SUIVI_IA = ['note', 'cherche', 'decide', 'resolu'] as const;
export const QUAND_TACHE = ['semaine', 'mois', 'un-jour'] as const;
export const ETATS_OPTION_IA = ['piste', 'veille', 'ecartee', 'retenue'] as const;
export type EtiquetteCarnet = typeof ETIQUETTES_CARNET[number];
export type GenreSuivi = typeof GENRES_SUIVI[number];
export type EtatSuiviIA = typeof ETATS_SUIVI_IA[number];
export type QuandTache = typeof QUAND_TACHE[number];
/** Un chemin : 1 à 2 niveaux, 30 caractères au plus chacun. */
export const CHEMIN_NIVEAUX_MAX = 2;
export const CHEMIN_CAR_MAX = 30;
/** Le contexte compact d'un carnet : 3 derniers messages de 160 caractères au plus ; 12 options, 8 tâches ; 40 chemins employés. */
export const DERNIERS_MAX = 3;
const OPTIONS_MAX = 12;
const TACHES_MAX = 8;
const CHEMINS_MAX = 40;

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
  /** PX (R39 à R41) : la quantité à laquelle `prix` se rapporte (50 g ; 1 kg pour un prix donné au gramme, converti), le prix à l'unité tel que la page l'écrit (0,1044 CHF/g, paliers) et les conditionnements publiés. */
  conditionnement?: { valeur: number; unite: 'g' | 'kg' | 'ml' | 'cl' | 'dl' | 'l' };
  prixUnite?: { prix: number; unite: 'g' | 'kg' | 'ml' | 'cl' | 'dl' | 'l'; paliers?: Array<{ des: number; prix: number }> };
  offres?: Array<{ valeur: number; unite: 'g' | 'kg' | 'ml' | 'cl' | 'dl' | 'l'; prix: number }>;
  /** `retire` : la page dit le produit plus disponible (BL-15). */
  dispo?: 'en-stock' | 'rupture' | 'retire' | 'sur-commande';
  /** Le délai d'un article sur commande (« expédié sous 28 jours »), tel que la page le dit. */
  dispoDelai?: string;
  vendeur?: string;
  /** La première photo (compatibilité) ; `photos` les garde toutes (D446). */
  photo?: string;
  photos?: string[];
  /** `ht` : prix publié hors taxe (net) ; `ttc` : taxe comprise, dite par la page. Absent : la page ne le dit pas. */
  taxe?: 'ht' | 'ttc';
  /** Le prix taxe comprise quand la page publie aussi le HT. */
  prixTTC?: number;
  /** Port vers la Suisse lu sur la page (D447) ; absent : la page ne le dit pas, jamais inventé. */
  livraison?: { prix?: number; devise?: string; gratuite?: true; refusee?: true };
  /** Cours du jour vers le franc (BCE, par Frankfurter) quand le prix n'est pas en CHF ; le prix d'origine reste `prix`. */
  change?: { taux: number; date: string; source: 'BCE' };
  /** Caractéristiques publiées (`additionalProperty`, tableaux de la page), telles quelles. */
  valeurs?: Array<{ nom: string; valeur: string; unite?: string }>;
  /** Les étapes de la lecture (D446) : chacune trouvée, absente ou douteuse, écrites au fil de l'eau. */
  etapes?: EtapeLien[];
  luLe: number;
}

export const ETAPES_LIEN = ['page', 'donnees', 'prix', 'devise-frais', 'photos', 'caract', 'controle', 'ia', 'bloquee'] as const;
export interface EtapeLien { nom: typeof ETAPES_LIEN[number]; statut: 'trouve' | 'absent' | 'douteux'; detail?: string }

export interface CaracteristiqueCompacte { nom: string; unite?: string; sens: SensCarnet }
export interface CarnetCompact {
  id: string;
  titre: string;
  criteres: Array<{ texte: string; caracteristique?: CaracteristiqueCompacte }>;
  facons: string[];
  /** N1 (25.11) : `id`, `domaine` et `vendeur` : de quoi désigner l'article qu'une note concerne (sans eux, l'IA ne pouvait que deviner). */
  articles: Array<{ nom: string; id?: string; domaine?: string; vendeur?: string; valeurs?: Record<string, string> }>;
  notes: Array<{ id: string; texte: string }>;
  /** D451, tout facultatif (un client ancien ne les envoie pas) : genre, état, domaine, chemin ; les options qui ne sont pas de simples pistes ; tâches ouvertes ; derniers messages. */
  genre?: GenreSuivi;
  etat?: EtatSuiviIA;
  domaine?: typeof DOMAINES_CARNET[number];
  chemin?: string[];
  options?: Array<{ nom: string; etat: typeof ETATS_OPTION_IA[number] }>;
  taches?: string[];
  derniers?: string[];
}
export interface ContexteRangerCarnet {
  texte: string;
  /** Date de saisie AAAA-MM-JJ. */
  saisie: string;
  /** Le carnet ouvert quand il a écrit ; `null` depuis la liste. */
  depuis: string | null;
  carnets: CarnetCompact[];
  /** D451 : les chemins déjà employés (vocabulaire qui grandit). */
  chemins?: string[][];
  /** Pages lues des liens du message, s'il y en a (prix, vendeur, valeurs). */
  pages?: Array<Pick<PageLue, 'url' | 'domaine' | 'nom' | 'prix' | 'devise' | 'vendeur' | 'valeurs'>>;
}

/*
 * `propertyOrdering` (23.11, lien gastro-held.ch) : sans lui, Gemini sort les champs requis puis les autres par ordre alphabétique
 * (`sorte`, `texte`, puis `caracteristique`, `carnetId`… `url`, `vendeur`). `carnetId`, `prix` et `devise` venaient avant `url` ; il les
 * sautait, et ce qu'il voulait encore dire bouclait dans le dernier champ libre (`vendeur`, 3 985 jetons, coupé au plafond, 9 rejeux sur 9).
 * Les clés sortent dans l'ordre écrit ici : rangement et prix avant le vendeur.
 */
/** D437 : les domaines d'un carnet (src/domain/carnets/domaines.ts, même liste). */
export const DOMAINES_CARNET = ['local', 'brasserie', 'meuble', 'outils', 'papiers'] as const;
const S = (properties: Record<string, unknown>, required: string[]) => ({ type: 'OBJECT', properties, required, propertyOrdering: Object.keys(properties) });
const str = { type: 'STRING', nullable: true };
const num = { type: 'NUMBER', nullable: true };

/**
 * C70-3 (banc réel c70-ia, 25.11) : le rangement de la phrase elle-même, en tête et OBLIGATOIRE (nul seulement depuis un carnet ouvert ou
 * pour une note de plusieurs sujets). Les mêmes champs par ligne restaient vides dès que l'IA désignait un carnet existant (« Rattacher ? »),
 * consigne précisée comprise (r4, avant et après) : « Garder à part » créait alors une « Idée » sous le domaine seul. Méthode standard d'une
 * classification à sortie structurée : champs requis, énumérations, critères écrits, post-validation (`sujetAssaini`, puis `sujetLu` au client).
 */
export const SUJET_SCHEMA = {
  ...S({
    titre: { type: 'STRING' },
    domaine: { type: 'STRING', enum: [...DOMAINES_CARNET] },
    genreCarnet: { type: 'STRING', enum: [...GENRES_SUIVI] },
    chemin: { type: 'ARRAY', items: { type: 'STRING' } },
    etatPropose: { type: 'STRING', enum: [...ETATS_SUIVI_IA], nullable: true }
  }, ['titre', 'domaine', 'genreCarnet', 'chemin']),
  nullable: true
};

export const RANGER_CARNET_SCHEMA = S({
  sujet: SUJET_SCHEMA,
  lignes: {
    type: 'ARRAY',
    items: S({
      sorte: { type: 'STRING', enum: [...SORTES_CARNET] },
      genre: { type: 'STRING', enum: [...GENRES_CARNET], nullable: true },
      texte: { type: 'STRING' },
      titre: str,
      carnetId: str,
      carnetNeuf: str,
      domaine: { type: 'STRING', enum: [...DOMAINES_CARNET], nullable: true },
      /* D451 : le suivi. Champs courts et énumérés d'abord, avant les champs libres (même raison que `propertyOrdering` plus haut). */
      etiquette: { type: 'STRING', enum: [...ETIQUETTES_CARNET], nullable: true },
      option: str,
      genreCarnet: { type: 'STRING', enum: [...GENRES_SUIVI], nullable: true },
      chemin: { type: 'ARRAY', items: { type: 'STRING' }, nullable: true },
      etatPropose: { type: 'STRING', enum: [...ETATS_SUIVI_IA], nullable: true },
      tachePropose: { ...S({ texte: str, quand: { type: 'STRING', enum: [...QUAND_TACHE] }, prix: num }, ['quand']), nullable: true },
      citation: str,
      articleId: str,
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
}, ['sujet', 'lignes']);

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
liste), « carnets » (ses idées : id, titre, critères, façons, articles, notes avec leur id ; parfois genre, état, domaine, chemin,
« options » dont l'état n'est pas « piste », « taches » ouvertes, « derniers » messages), « chemins » (les catégories déjà
employées) et parfois « pages » (ce qui a été lu sur la page de chaque lien : nom, prix, devise, vendeur, valeurs).

Deux règles d'abord :
  • une exigence, un seuil ou une contrainte est un "critere", jamais une "note" : « doit tenir <température> », « <débit> au
    moins », « <contenant> de <volume> couché » (il doit entrer quelque part) ; si le carnet a déjà un critère de même unité, reprends
    son « nom » : le seuil s'y ajoute ;
  • une ligne qui parle d'un AUTRE objet que celui du carnet ouvert (un autre équipement, une autre partie du local) ne lui appartient
    pas : « carnetId » d'un carnet qui en parle, sinon « carnetNeuf » titré par cet objet. Un objet d'une autre phrase n'est jamais un
    critère du carnet ouvert. Une pièce ou un réglage de l'objet du carnet reste dans ce carnet.

Rends « sujet » (voir Suivi plus bas), puis « lignes », une par chose, au plus ${LIGNES_MAX}, dans l'ordre : d'abord ce qu'il faut acheter, puis le reste.
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
une idée nouvelle, et « raisonCarnet » dit en quelques mots pourquoi (« aucun carnet n'en parle »). Avec « carnetNeuf », « domaine »
range l'idée : "local" (le bâtiment : sol, murs, eau, électricité, sécurité), "brasserie" (le matériel qui fait la bière :
moulin, froid, cuves, pompes, embouteillage), "meuble" (étagères, armoires), "outils" (ce qui se tient en main) ou "papiers"
(dossiers, autorisations, assurances, douane) ; nul si rien ne le dit. Une phrase écrite depuis la liste a toujours son « domaine »,
même rangée dans un carnet existant. Une panne ou un souci qui se voit pendant le brassage
(ébullition, empâtage, transfert du moût) et touche son matériel, même un élément du bâtiment qui le sert (l'air, le plafond ou le sol de la
salle de brassage), est « brasserie » : « local » seulement quand le souci n'a rien à voir avec la bière. Depuis un carnet ouvert, une
ligne qui n'en sort pas va dans « depuis ».

Un MÉMO est un fait accompli ou un constat (« ça a bien tenu », « c'est réglé », « on a changé… », « ça marche ») : ce n'est pas une envie,
donc jamais une "idee" neuve quand un carnet de « carnets » parle du MÊME SUJET. Cherche ce carnet par le sens, pas par les mots exacts : le
même objet, équipement ou partie du local que son titre, son chemin, ses critères, façons, articles, notes ou « derniers » (un synonyme, une
partie pour le tout, une autre formulation comptent). S'il existe : une ligne "note" (genre "note") avec « carnetId » = ce carnet et
« citation » = les mots du message qui le désignent ; « carnetNeuf » seulement quand aucun carnet ne parle de ce sujet. Une envie, un besoin,
un souci à suivre ou une question gardent leur chemin d'avant.

Un besoin ou un manque que le message dit (une chose à racheter, à commander, à prévoir ; « il faut… », « besoin de… », « penser à… ») est un
geste : propose toujours « tachePropose » sur la ligne qui le range (« texte » à l'infinitif, « quand » "un-jour" quand aucune date n'est dite,
« prix » seulement s'il est écrit) ; une tâche se propose, elle ne s'écrit jamais seule.

Une solution envisagée pour un problème (une « piste », une « option », un produit ou une méthode comparés) tapée dans le carnet d'un problème est
une "facon" nommée par son objet (« texte » = le nom court de la solution, sans le mot « piste » ni le prix ni le vendeur) ; ce qu'il en dit (montant,
vendeur, raison) reste dans une ligne "note" de ce carnet, avec « etiquette » "cout" ou "devis" et « prix » quand un montant est écrit.
Un "article" est un produit précis lu sur une page : sans lien, une phrase ne devient pas un article.

Rien d'inventé : « url », « prix », « quantite » et « vendeur » seulement s'ils sont écrits dans le texte ou lus dans « pages ».
« prix » en unités (690, 1450.5), « devise » ISO (CHF, EUR). Un champ inconnu est nul, jamais 0.

Suivi d'un problème (champs facultatifs : nuls quand le message ne le dit pas ; jamais inventés) :
  • « etiquette » : ce que ce message apporte au fil du carnet : "constat" (ce qu'il observe), "cause", "piste" (une solution
    envisagée), "ecart" (une piste écartée), "retenu" (la solution choisie), "trouve" ou "pas-trouve" (une chose cherchée),
    "contact" (quelqu'un contacté), "devis", "cout" (un montant écrit), "achat", "veille" (à surveiller), "pourquoi" (la raison d'un
    choix). Le montant d'un devis ou d'un coût va dans « prix », seulement s'il est écrit. « option » = la solution visée, avec
    son nom tel qu'il figure dans les façons ou « options » du carnet.
  • « citation » : des mots copiés tels quels du message (jamais reformulés) qui justifient le carnet choisi.
  • « sujet » (en tête de la réponse) : le rangement de la phrase elle-même, rempli TOUJOURS quand « depuis » est null et que le
    message parle d'un seul sujet, MÊME quand une ligne va dans un carnet de « carnets » (il peut refuser et la garder à part : son
    carnet naît alors de « sujet », jamais de sa phrase) ; nul depuis un carnet ouvert ou pour une note de plusieurs sujets.
    « titre » : 2 à 6 mots qui nomment l'objet et ce qui lui arrive, jamais la phrase entière ; « domaine » ; « genreCarnet » ;
    « chemin » ; « etatPropose ». Une idée neuve porte aussi ces champs sur sa ligne.
  • « genreCarnet » se choisit par ces critères, dans cet ordre : "probleme" si quelque chose ne marche pas ou gêne (panne, fuite,
    bruit, défaut, valeur hors consigne, réclamation) et se suit jusqu'à sa résolution ; "memo" pour un fait accompli ou une
    information à garder (c'est fait, ça marche, reçu, réglé, valable jusqu'à…) ; "achat" pour une chose à acquérir (« il faut
    un… », « commander », « besoin de… ») ; "idee" pour une envie ou un projet (« et si… », « ce serait bien… ») ; "recolte" pour
    des trouvailles à rassembler. « chemin » : 1 ou 2 mots courts (30 caractères au plus chacun) qui rangent le sujet sous son
    domaine, repris tels quels dans « chemins » quand l'un convient ; jamais vide. « etatPropose » ("note", "cherche", "decide",
    "resolu") : où en est le sujet d'après ses mots. Sous « brasserie », le premier mot dit la partie du matériel : « Brassage » (cuve
    d'ébullition, empâtage, moût, malt, pompe de transfert), « Fermentation » (fermenteurs, froid, levure) ou « Conditionnement »
    (fûts, embouteillage) ; le second, s'il y en a un, l'objet.
  • « tachePropose » : un geste à faire, « texte » à l'infinitif, « quand » ("semaine", "mois" ou "un-jour" quand aucune date n'est
    dite), « prix » seulement s'il est écrit. Sans « texte » et avec « option » : la date de cette solution.
Une étiquette se pose et s'annule d'un toucher ; une tâche, un choix, une date, une résolution ne s'écrivent jamais seuls : tu les proposes.
Exemple neutre (inventé) : « devis reçu de la menuiserie, 480 CHF » → etiquette "devis", prix 480, citation absente.

Une NOTE qui parle d'UN article de « articles » du carnet (« le site français semble ne plus avoir de stock », « les pellets suisses étaient
éventés », « MotlerHops met trois semaines à livrer ») garde sa ligne "note" et désigne cet article : « articleId » = son « id », « citation » = les
mots EXACTS du message qui le désignent (le vendeur, le site, son pays). Seulement quand un seul article correspond à ce passage ; sinon « articleId » nul.
Ta mise en forme de « texte » ne change pas ce qu'il a dit : « semble » reste un doute, jamais une certitude, et tu ne donnes aucun score.
Une page de référence dont « pages » ne donne ni prix ni produit (frais d'envoi, conditions de vente, guide) est une "note", jamais un "article".

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
const CHAINES = ['genre', 'titre', 'carnetId', 'articleId', 'carnetNeuf', 'raisonCarnet', 'url', 'devise', 'unite', 'vendeur', 'consequence', 'doublonDe', 'titrePropose'] as const;
const chaine = (v: unknown, max = 300): string | undefined => typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined;

/** Un chemin lu : 1 à 2 niveaux (le reste est coupé) ; un niveau de plus de 30 caractères refuse tout le chemin. `undefined` : rien. */
export function cheminLu(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const niveaux = v.filter((x): x is string => typeof x === 'string').map((x) => x.replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, CHEMIN_NIVEAUX_MAX);
  if (!niveaux.length || niveaux.some((x) => x.length > CHEMIN_CAR_MAX)) return undefined;
  return niveaux;
}

/** D451 : les champs du suivi d'une ligne, ramenés à la forme du schéma (énumérations, longueurs). Le sens (citation, montant) est revérifié par le client. */
function suiviAssaini(r: Record<string, unknown>, out: Record<string, unknown>): void {
  if ((ETIQUETTES_CARNET as readonly string[]).includes(r.etiquette as string)) out.etiquette = r.etiquette;
  const option = chaine(r.option, 80);
  if (option) out.option = option;
  if ((GENRES_SUIVI as readonly string[]).includes(r.genreCarnet as string)) out.genreCarnet = r.genreCarnet;
  const chemin = cheminLu(r.chemin);
  if (chemin) out.chemin = chemin;
  if ((ETATS_SUIVI_IA as readonly string[]).includes(r.etatPropose as string)) out.etatPropose = r.etatPropose;
  // La citation n'est ni réécrite ni resserrée : une sous-chaîne exacte du message ou rien (le client la compare telle quelle).
  if (typeof r.citation === 'string' && r.citation.trim()) out.citation = r.citation.trim().slice(0, 300);
  const t = r.tachePropose as Record<string, unknown> | null | undefined;
  if (t && typeof t === 'object' && (QUAND_TACHE as readonly string[]).includes(t.quand as string)) {
    const texte = chaine(t.texte, 120);
    const prix = typeof t.prix === 'number' && Number.isFinite(t.prix) && t.prix > 0 ? t.prix : undefined;
    out.tachePropose = { quand: t.quand, ...(texte ? { texte } : {}), ...(prix !== undefined ? { prix } : {}) };
  }
}

/**
 * Garde serveur : ne laisse passer que la forme du schéma (le client revérifie le sens : ids connus, URL, prix, vendeur…).
 * Une forme fausse rend `{ lignes: [] }` ; au-delà de 12 lignes, les suivantes sont coupées.
 */
export interface SujetCarnet { titre: string; domaine: typeof DOMAINES_CARNET[number]; genreCarnet: GenreSuivi; chemin: string[]; etatPropose?: EtatSuiviIA }

/** C70-3 : le « sujet » ramené au schéma ; un champ requis manquant ou hors liste le retire entier (le client garde alors ses lignes). */
export function sujetAssaini(v: unknown): SujetCarnet | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const r = v as Record<string, unknown>;
  const titre = chaine(r.titre, 120), chemin = cheminLu(r.chemin);
  if (!titre || !chemin || !(DOMAINES_CARNET as readonly string[]).includes(r.domaine as string) || !(GENRES_SUIVI as readonly string[]).includes(r.genreCarnet as string)) return undefined;
  const etat = (ETATS_SUIVI_IA as readonly string[]).includes(r.etatPropose as string) ? { etatPropose: r.etatPropose as EtatSuiviIA } : {};
  return { titre, domaine: r.domaine as SujetCarnet['domaine'], genreCarnet: r.genreCarnet as GenreSuivi, chemin, ...etat };
}

export function assainirRangerCarnet(data: unknown): { sujet?: SujetCarnet; lignes: Array<Record<string, unknown>> } {
  const lignes = (data as { lignes?: unknown } | null)?.lignes;
  if (!Array.isArray(lignes)) return { lignes: [] };
  const sujet = sujetAssaini((data as { sujet?: unknown }).sujet);
  return {
    ...(sujet ? { sujet } : {}),
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
      if (typeof r.domaine === 'string' && (DOMAINES_CARNET as readonly string[]).includes(r.domaine)) out.domaine = r.domaine;
      for (const c of ['prix', 'quantite'] as const) if (typeof r[c] === 'number' && Number.isFinite(r[c]) && (r[c] as number) > 0) out[c] = r[c];
      const k = r.caracteristique as Record<string, unknown> | null | undefined;
      if (k && typeof k === 'object' && chaine(k.nom, 60) && SENS.has(k.sens as string))
        out.caracteristique = { nom: chaine(k.nom, 60), sens: k.sens, ...(chaine(k.unite, 12) ? { unite: chaine(k.unite, 12) } : {}) };
      if (r.commeCritere === true) out.commeCritere = true;
      if (r.propose === true) out.propose = true;
      suiviAssaini(r, out);
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
    const id = chaine(o?.id, 120), domaine = chaine(o?.domaine, 120), vendeur = chaine(o?.vendeur, 80);
    return [sansVide({ nom, id, domaine, vendeur, valeurs: v.length ? Object.fromEntries(v) : undefined })];
  });
  const notes = liste(r.notes, NOTES_MAX).flatMap((x) => {
    const o = x as Record<string, unknown> | null;
    const nid = chaine(o?.id, 120), texte = chaine(o?.texte, COURT);
    return nid && texte ? [{ id: nid, texte }] : [];
  });
  const options = liste(r.options, OPTIONS_MAX).flatMap((x) => {
    const o = x as Record<string, unknown> | null;
    const nom = chaine(o?.nom, COURT);
    return nom && (ETATS_OPTION_IA as readonly string[]).includes(o?.etat as string) ? [{ nom, etat: o!.etat as typeof ETATS_OPTION_IA[number] }] : [];
  });
  const taches = liste(r.taches, TACHES_MAX).flatMap((x) => { const t = chaine(x, COURT); return t ? [t] : []; });
  const derniers = liste(r.derniers, DERNIERS_MAX).flatMap((x) => { const t = chaine(x, COURT); return t ? [t] : []; });
  const chemin = cheminLu(r.chemin);
  return sansVide({
    id, titre, criteres, facons, articles, notes,
    genre: (GENRES_SUIVI as readonly string[]).includes(r.genre as string) ? r.genre as GenreSuivi : undefined,
    etat: (ETATS_SUIVI_IA as readonly string[]).includes(r.etat as string) ? r.etat as EtatSuiviIA : undefined,
    domaine: (DOMAINES_CARNET as readonly string[]).includes(r.domaine as string) ? r.domaine as typeof DOMAINES_CARNET[number] : undefined,
    chemin,
    options: options.length ? options : undefined,
    taches: taches.length ? taches : undefined,
    derniers: derniers.length ? derniers : undefined
  }) as CarnetCompact;
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
  const chemins = Array.isArray(c.chemins) ? c.chemins.slice(0, CHEMINS_MAX).flatMap((x) => { const ch = cheminLu(x); return ch ? [ch] : []; }) : [];
  return sansVide({ texte: c.texte.trim(), saisie: c.saisie, depuis: typeof c.depuis === 'string' ? c.depuis : null, carnets, chemins: chemins.length ? chemins : undefined, pages: pages.length ? pages : undefined }) as ContexteRangerCarnet;
}
