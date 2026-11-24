# PLAN — port D451 (Carnet : suivi d'un problème, de l'idée à la résolution)

Portée (L01) : Stocks › Matériel › Carnets, tous les genres de carnet ; plus, à part et en dernier, la rangée d'onglets de
Stocks › Matériel (hors Carnet). Base : maquettes3/v01 (passe 3) ; greffes : maquettes2/v01 (passe 2, genres et comparatifs),
maquettes3/v05 (avant/après, tuiles des résolus), maquettes3/v03 (question « pourquoi » honnête). Verdict :
work/missions/2026-11-24-carnet-workflow/D451/VERDICT.md. Port conditionnel (D451) : il se défait si son classement diffère.
Donc rien de ce port n'entre au registre `ecrans.json` avant son classement (D123) ; chaque voie fait un commit isolé, révocable.

Prérequis : c64-fix commité (il modifie src/ui/carnets et src/domain/carnets en ce moment) et ses tests verts. Aucune voie de
port ne démarre avant.

## État de l'art (L29)

- Problème type : suivi d'incident à état libre + journal de décision (ADR) + veille, sur un schéma Firestore à faire
  évoluer sans perte (machine à états, chemin matérialisé, fil d'activité, changement parallèle avec lecteur tolérant).
- Examiné : XState, Kanban (Trello), timeline GitHub, Things « Un jour », Keepa (veille), ADR, expand/contract ;
  bibliothèques du package.json (fuse.js, motion, vaul, d3-time) ; ETAT-DE-L-ART.md de la mission carnet-workflow.
- Décision : fonctions pures dans src/domain/carnets, aucune bibliothèque neuve ; détail ci-dessous.

| Problème type | Méthode standard retenue | Bibliothèque |
|---|---|---|
| Cycle de vie d'un problème (4 états libres, dans les deux sens, Rouvrir) | Machine à états **à graphe complet** : un type somme `EtatSuivi` et une fonction pure `changerEtat(suivi, vers, le)` qui ajoute un événement. Pas de garde de transition : CADRAGE « libres dans les deux sens », K4 (pas d'« étape n sur m »). | Aucune. XState (absent du package.json) apporterait gardes et hiérarchie dont on n'a pas besoin : refusé. |
| Options d'un problème (piste, veille, écartée + raison, retenue ; « écarté, 2e fois ») | Même patron : état courant + historique daté par option. Le « 2e fois » se compte dans l'historique, jamais stocké. | Aucune. |
| Arbre domaine › sous-domaine | **Chemin matérialisé** (materialized path) : `domaine` (5 valeurs, existant, D437) + `chemin: string[]` (1 à 2 niveaux). L'arbre est un regroupement à la lecture. Vocabulaire contrôlé qui grandit : un chemin proposé est comparé, plié (sans accent, minuscule, `plier` de domaines.ts), aux chemins déjà employés ; le plus proche est repris (égalité pliée d'abord, sinon distance d'édition ≤ 2). | Aucune pour l'arbre. `fuse.js` (déjà là) pour la recherche des résolus si `recherche.ts` ne suffit pas. |
| Fil d'un problème (messages, notes, changements d'état, veille) | **Fil d'activité** (activity stream, comme la timeline GitHub : commentaires et événements entrelacés). Journal **en ajout seul** d'événements dans le carnet (`suivi.evenements`), plus les messages existants (`carnet-message`, déjà un journal). Le fil est une **projection** pure (tri par date, regroupement par jour, plus anciens repliés). Pas d'event sourcing complet : l'état courant reste écrit (lecture simple, hors ligne). | Aucune. |
| Propositions de l'IA annulables | Deux régimes, déjà présents dans le code : (1) **appliquer + Annuler** (patron Gmail « Annuler ») pour le rangement : titre, catégorie, nouveau ou rattaché depuis la liste, étiquettes, état initial — `operations.ts` rend les écritures et leur inverse ; (2) **proposer sans écrire** (carte « OK · Non ») pour ce qui reste au brasseur : retenir, dater, résoudre, veiller, tâche, écrire dans un autre carnet (MESSAGE-RESTE-DANS-SON-CARNET). | Aucune. |
| Évolution du schéma Firestore sans perte (22 carnets réels, plusieurs appareils) | **Changement parallèle** (expand/contract) + **lecteur tolérant** : (a) le lecteur garde les champs qu'il ne connaît pas (passe-plat) et part en ligne d'abord ; (b) tous les champs neufs sont facultatifs, `VERSION_CARNET` reste 1 (une version 2 rendrait `null` sur un vieux client : carnet caché) ; (c) un champ ancien garde sa sémantique (`facon.etat`, `status`, `archive`) et le neuf vit à côté ; (d) aucune réécriture en masse : l'état d'un carnet existant se **dérive à la lecture** tant qu'il n'a pas de `suivi`. | Aucune. |
| Dates relatives (cette semaine, fin du mois, un jour) | Échéance = lundi ISO + précision `semaine` / `mois`, le patron déjà employé par les dates d'intention (`lundiDe`, `CreativeItem.precision`, `planAuCalendrier`). Groupes calculés à la lecture. | Aucune (helpers de `src/domain/calendrier`). |

Écarté : un tableau Kanban (v02 passe 3), une ligne de métro (v04), un plan du local (v06) : non choisis par le critique ;
ils restent ouverts à son classement.

## Modèle de données (V1 l'écrit ; les autres voies le lisent)

Tout est facultatif dans `DonneesCarnet` et `DonneesMessage` (src/domain/carnets/modele.ts). Absent = dérivé à la lecture,
jamais 0, jamais inventé. Rien n'est réécrit à l'ouverture : un champ neuf naît d'un geste ou d'un rangement.

### Carnet (`CreativeItem` type `carnet`, `creativeItems/{id}`)

| Champ | Type | Absent : lu comme | Écrit par |
|---|---|---|---|
| *(passe-plat)* | toute clé inconnue de `carnet` et de ses lignes | gardée telle quelle à la lecture et à la réécriture | — (V1, d'abord) |
| `genre` | `{ valeur: 'probleme' \| 'memo' \| 'recolte' \| 'idee' \| 'achat'; origine: 'vous' \| 'ia' }` | `achat` s'il a un article ou un choix ; `idee` sinon (carnets du Planning compris) | l'IA au rangement d'un carnet neuf ; lui (menu ⋯) |
| `categorie` | `{ chemin: string[] /* 1–2 niveaux sous le domaine, ≤ 30 car. */; origine: 'vous' \| 'ia' }` | aucun chemin : rangé sous son domaine ; sans domaine ni chemin : « À ranger » | idem |
| `suivi.etat` | `'note' \| 'cherche' \| 'decide' \| 'resolu'` | `resolu` si `archive` ; `decide` si `choix` ou option retenue ; `cherche` si façon ou article ; `note` sinon | lui (barre d'état) ; l'IA pour l'état initial d'un problème neuf (annulable) |
| `suivi.evenements[]` | `{ id; le; sorte: 'etat' \| 'option' \| 'veille' \| 'tache' \| 'resolu' \| 'rouvert' \| 'pourquoi' \| 'relu'; de?; vers?; optionId?; tacheId?; messageId?; raison?; origine: Origine }` — en ajout seul, 200 au plus (au-delà, les plus anciens `etat` consécutifs se fusionnent) | `[]` | chaque intention de V1 |
| `suivi.resolu` | `{ le; par?: { sorte: 'achat' \| 'reparation' \| 'texte'; optionId?; articleId?; planId?; texte? } }` | `{ le: archive.le }` si archivé | « Résolu », ou « Fermer grâce à l'achat ? Oui » |
| `suivi.avantApres` | `{ avantPhotoId?; apresPhotoId? }` | avant = 1re photo du fil ; après = dernière photo après la décision ; aucune : picto de catégorie | lui, s'il change la paire |
| `suivi.relu` | `{ le; reponse: 'oui' \| 'pas-sur' }` | rien | « Toujours le bon choix ? » |
| `facons[].suivi` | `{ etat: 'piste' \| 'veille' \| 'ecartee' \| 'retenue'; historique: { etat; le; raison?; origine }[] }` | depuis `facon.etat` : ouverte → piste, retenue, ecartee | intentions d'option. **`facon.etat` reste écrit** (veille → `ouverte`) pour les vieux clients |
| `taches[]` | `{ id; texte; echeance?: 'AAAA-MM-JJ' /* lundi */; precision?: 'semaine' \| 'mois'; coutCentimes?; devise?; coutEstime?: true; faiteLe?; optionId?; planId?; messageId?; origine: Origine; creeeLe }` | `[]` ; sans échéance = « Un jour » | lui (« À faire », « Plus tard », case cochée) ; jamais l'IA seule |
| `photos` | existant, 12 au plus | — | inchangé (limite de 1 Mio par document : voir Risques) |

Inchangés et toujours écrits comme avant : `status` (idea/research/validated), `choix`, `sortie`, `archive`, `domaine`,
`articles` (+ `veille` existante), `notes`, `criteres`. Une note du Planning (« À faire du … au … (Planning, …) ») devient à
la lecture une bulle du fil et une tâche dérivée, sans réécriture.

### Message (`carnet-message`)

| Champ | Type | Rôle |
|---|---|---|
| `etiquettes[]` | `{ carnetId; sorte: 'constat' \| 'piste' \| 'ecart' \| 'retenu' \| 'trouve' \| 'pas-trouve' \| 'contact' \| 'devis' \| 'cout' \| 'achat' \| 'cause' \| 'veille' \| 'pourquoi'; texte?; montantCentimes?; devise?; estime?: true; optionId?; origine }` | les jetons sous chaque bulle ; posés par l'IA ou le repli local, annulables d'un toucher |
| `rattache` | `{ carnetId; citation: string /* sous-chaîne exacte du message */ }` | « rattaché : « … » » de la carte « rangé pour toi » |
| `propositions` (existant) étendu | `+ { sorte: 'tache', texte, echeance?, precision?, coutCentimes? }`, `{ sorte: 'retenir' \| 'dater' \| 'resoudre' \| 'veiller' \| 'deplacer', … }` | proposé, jamais écrit sans son geste |

### Ce que l'IA de rangement lit et écrit

- Lit (contexte compact, `CARNETS_MAX` 30) : le message ; le carnet ouvert (`depuis`) ; pour chaque carnet : id, titre,
  genre, état, domaine et chemin, options (nom, état), tâches ouvertes (texte), 3 derniers messages tronqués à 160 car. ;
  la liste des chemins déjà employés. Aucune photo (accord du port 17.11 : photo « non lue par l'IA »).
- Rend, par ligne (schéma `RANGER_CARNET_SCHEMA` étendu, champs nullables) : `etiquette`, `option` (nom de l'option visée),
  `genreCarnet`, `chemin`, `etatPropose`, `tachePropose { texte, quand: semaine|mois|un-jour, prix }`, `citation`.
- Garde client (`lireReponse`) : `citation` gardée seulement si sous-chaîne du message ; montant seulement s'il est écrit
  (règle existante des nombres) ; chemin ≤ 2 niveaux, rapproché du vocabulaire ; étiquette dans l'énumération.
- **MESSAGE-RESTE-DANS-SON-CARNET** : depuis un carnet ouvert, toutes les lignes vont dans ce carnet ; un autre carnet visé
  par l'IA devient une proposition « Rattacher à … ? », jamais une écriture. Depuis la liste, l'IA rattache en citant ou
  crée un problème (appliqué + Annuler).
- Sans IA (hors ligne, panne) : repli local (`analyseLocale`) : étiquettes `cout`/`devis` sur un montant écrit, `pas-trouve`
  sur « pas trouvé », `contact` sur « contacté », rien d'autre ; le message est gardé tel quel.

## Voies, ordre et dépendances

| # | Voie | Possède (écriture) | Dépend de | Parallèle avec |
|---|---|---|---|---|
| 1 | `domaine` | src/domain/carnets/{modele,operations,domaines,fixture}.ts, neufs `suivi.ts`, `fil.ts`, `taches.ts`, `arbre.ts` ; tests `carnetsSuivi*.test.ts` | c64-fix commité | aucune |
| 2 | `ia` | functions/src/carnetIA.ts ; src/domain/carnets/{ia,iaSimulee,analyseLocale}.ts ; src/ui/carnets/{rangement,rangementCarnets,envoiRegles}.ts ; tests `carnetsIASuivi*.test.ts` | 1 | 4, 5, 6 |
| 6 | `greffe-p2` | src/ui/carnets/{TableauCarnet,ArticlesCarnet,CarteArticle,FicheArticle,FeuilleCartes,Comparer,Choisir,PrixPastille}.tsx, carnets-decider.css, neuf `tableauRegles.ts` ; tests `carnetsGreffeP2*.test.ts` | 1 | 2, 5 (pas 4 : mêmes tests c-séries possibles) |
| 4 | `probleme` | src/ui/carnets/{CarnetOuvert,RubriqueQuand,CriteresCarnet,FeuilleNote,RenommerCarnet,Photos}.tsx, {ouvertCalculs,carnetOuvertTypes,histoireCarnet,photo}.ts, carnets-fil.css ; neufs `EnTeteGenre.tsx`, `FilCarnet.tsx`, `BarreEtat.tsx`, `OptionsProbleme.tsx`, `ResoluProbleme.tsx`, `RelectureResolus.tsx`, `QuestionPourquoi.tsx`, `filRegles.ts` ; tests `carnetsProbleme*.test.ts` | 1 (6 si commité, sinon interface actuelle de TableauCarnet et ArticlesCarnet) | 2, 5 |
| 5 | `afaire` | neufs src/ui/carnets/{AFaire,CarteARanger}.tsx, `afaire.css`, `afaireRegles.ts` ; tests `carnetsAFaire*.test.ts` | 1 | 2, 4, 6 |
| 3 | `liste` | src/ui/carnets/{ListeCarnets,Domaines,LigneRangee,ChampCarnet,Bandeau,CadreArrivee,NoteEnVrac,AnciennesNotes,pictos}.tsx, carnets-liste.css, carnets.css ; neufs `ArbreCarnets.tsx`, `CoupDOeil.tsx`, `FeuilleRangement.tsx`, `listeRegles.ts` ; **branchement** : {CarnetsVue,ecransCarnet,apercuCarnet,bandeauxCarnet}.tsx, {carnetsTypes,useNavigationCarnet,actionsCarnet,useDonneesCarnets,lectureRegles,lignesRegles,retourCarnet}.ts ; tests `carnetsListe*.test.ts` | 1, 2, 4, 5, 6 commités | aucune |
| 7 | `onglets` | src/components/tabs/StocksTab.tsx (la rangée de Matériel seulement) | 3 en ligne et regardé | aucune |

Ordre conseillé (L18, peu de chantiers à la fois) : 1 → (6 ∥ 2) → (4 ∥ 5) → 3 → pilote : build, vision complète, critique,
mise en ligne (accord) → 7 → en ligne. Les fichiers de src/ui/carnets non listés (EtatIA, titre, insecable, domaineMots,
LectureLien, lecture-lien.css, AtelierPorte, SupprimerCarnet…) ne bougent pas ; une voie qui en a besoin le dit
dans RESULTAT (`DÉCISION À PRENDRE`) au lieu d'y écrire.

Interfaces figées entre voies (une voie qui les change casse les autres) :
- V1 exporte les types ci-dessus et : `suiviDe(c)`, `changerEtat`, `changerOption`, `retenirOption`, `fermerParAchat`,
  `rouvrir`, `poserCategorie`, `poserGenre`, `ajouterTache`, `cocherTache`, `poserEcheance`, `repondreRelu`,
  `poserAvantApres`, `etiqueter` / `retirerEtiquette` (toutes `(etat, args) => Resultat`, avec inverse) ; projections
  `filDe(c, messages)`, `coupDOeil(carnets, annee)`, `arbreDe(carnets)`, `aFaireDe(carnets, maintenant)`,
  `pourquoiDe(c, messages)` (citations mot pour mot, ou `null`), `dureeDe(c)`, `avantApresDe(c)`.
- V6 garde les signatures exportées de `TableauCarnet` et `rubriqueArticles` (props neuves facultatives seulement).
- V4 exporte `RelectureResolus` et `ResoluProbleme` (props : carnets, messages, rappels) ; V5 exporte `AFaire` et
  `CarteARanger` ; V3 les branche (routes `afaire`, `relecture`).

## Ce qui disparaît (VERDICT), vérifié dans le code le 24.11

| n° | Élément | Où, dans le code actuel | Voie | Hors Carnet ? |
|---|---|---|---|---|
| 1 | Double rangée d'onglets | StocksTab.tsx : `tabs` (Articles, Recompter, Courses, Fûts, Matériel, l. 531-537) puis `SEGMENTS_MATERIEL` (Parc, À venir, Carnets, Réalisés, l. 101 et 815-830) | 7 | **Oui** : tout Stocks. Voie à part, en dernier, un commit révocable ; une seule rangée « Matériel ▾ · Parc · À venir · Carnets · Réalisés » **dans Matériel seulement** (lecture étroite, L01) ; ▾ ouvre Articles, Recompter, Courses, Fûts. Les autres sous-onglets gardent leur rangée. |
| 2 | Liste groupée par état (À comparer, Idée, Choisi, En veille) et puces Tous / Local / Brasserie | ListeCarnets.tsx l. 315-391 (`puceDomaines`, `groupes`, `STATUT_LIBELLE`) ; Domaines.tsx | 3 | non |
| 3 | « dès » et prix à droite de chaque carnet | ListeCarnets.tsx l. 112-140 et 296 | 3 | non |
| 4 | Gabarit unique du carnet (Critère, Articles « collez un lien », Notes n en cartes, Quand) | CarnetOuvert.tsx l. 190-310, RubriqueQuand.tsx, CriteresCarnet.tsx | 4 (Critère, Articles, Quand ne paraissent que s'ils servent) | non |
| 5 | « votre lien : « https://… » » | Bandeau.tsx l. 217-218 (3), LigneRangee.tsx l. 46-47 (3), CarnetOuvert.tsx l. 145 (4) | 3, 4 | non |
| 6 | Crayon du titre ; pastille « Archivé le … » | crayon : CarnetOuvert.tsx l. 186 (le « Renommer » du menu ⋯, l. 176, **reste** : aucun geste perdu) ; « Archivé le » **introuvable tel quel** dans src/ : l'archivage se dit « Plan archivé dans À venir » (EtatIA.tsx l. 52) et par le groupe « Faits » (ListeCarnets l. 59). V4 et V3 comparent à `maquettes3/cap/actuel-*.png` et retirent ce qui le montre. | 4, 3 | non |
| 7 | Tableau « rang · article · CHF » au prix seul | TableauCarnet.tsx (colonnes `rangColonne`, en-tête CHF) | 6 (α, récolte, CHF/kg rendu pour les houblons ; volume, température, prix pour le matériel) | non |
| 8 | Carte de note « À faire du … au … (Planning, …) fait » | CarnetOuvert.tsx l. 122-125 (`notePlanning`, `aFaire`) ; domaines.ts `categoriePlanning` la lit (à garder) | 1 (projection en bulle et tâche) ; 4 (rendu) | non |

Gardé de l'app, sans changement : barre de lecture d'un lien et ses 5 états (CHOIX.md), Escalader (D449), accord champs/IA
(D450), Relire, prix HT, CHF et frais (D447), barre du bas, + volant.

## Risques

1. **Données réelles (ses 22 carnets)** : aucune réécriture en masse ; dérivation à la lecture ; champs neufs facultatifs ;
   `VERSION_CARNET` inchangé. Risque résiduel : un appareil resté sur l'ancienne version (PWA non rechargée) qui réécrit un
   carnet efface ses champs neufs (l'ancien lecteur les jette, `lireDonneesCarnet` l. 392-400). Parade : V1 (passe-plat)
   part en ligne **seul et d'abord** ; les voies qui écrivent des champs neufs partent au moins un rechargement plus tard.
   Avant la mise en ligne de V3 : un export JSON des `creativeItems` de type `carnet*` (lecture seule ; geste sur données
   réelles, donc avec son accord, regroupé). Tests : seulement sur fixtures et « ZZ TEST — … », retirés après.
2. **Taille d'un document** : photos en ligne dans le carnet (≤ 150 ko, 12 au plus) ; un fil photographié approche la limite
   Firestore de 1 Mio. V1 refuse la 13e photo (règle existante) et l'écran le dit ; `evenements` plafonné à 200. Un
   stockage des photos hors document est hors port (`DÉCISION À PRENDRE` si la mesure sur ZZ TEST dépasse 700 ko).
3. **Hors ligne** : le magasin est Firestore avec cache persistant (carnetsStore.ts), écriture document par document. Tout le
   suivi (états, options, tâches, étiquettes locales) marche sans réseau ; seule l'IA attend. Contrôle : chaque voie joue
   un geste hors ligne au banc (`?preview=carnets`) et en ligne (mode avion).
4. **Coût IA** : un rangement mesuré 0,012 CHF (ia-journal.jsonl, 24.11). Budget 0,10 CHF par test réel, soit 8 rangements
   au plus ; chaque appel réel journalisé dans work/missions/2026-11-23-carnet-en-ligne/ia-journal.jsonl (date, tâche, texte,
   coût, voie). Jamais dans `npm test` (IA simulée, `iaSimulee.ts`). Le schéma étendu allonge la sortie : V2 mesure les
   jetons sur 5 messages simulés et sur 3 réels au plus.
5. **Déploiement des functions** (V2) : geste externe, avec son accord. Client et serveur restent compatibles dans les deux
   ordres (champs nullables ; le client sans les champs neufs se rabat sur le local).
6. **Veille qui « sonne »** : la relève réelle d'un prix ou d'un stock n'existe pas (`Veille.releveLe` jamais écrit, accord
   requis). Le port montre « veille demandée · pas encore relevée » ; la bulle « de nouveau en stock » n'apparaît qu'en
   fixture marquée « exemple ».
7. **Photo seule « On dirait un tuyau qui goutte »** (écran Imprévus) : demanderait que l'IA lise la photo, contraire à
   l'accord du 17.11. Voir la décision ci-dessous ; d'ici là, la carte propose sans deviner.
8. **Tests existants** : des tests c48…c64 et carnets* affirment des éléments qui disparaissent (n° 2 à 8). Une voie ne
   modifie une assertion existante que si elle porte sur un élément de « Ce qui disparaît », avec le commentaire
   `// D451 disparaît n° k`, et la liste dans RESULTAT ; tout autre test rouge se corrige dans le code.
9. **Port conditionnel** : son classement peut défaire le port. Chaque voie = un commit par chemins ; V3 garde l'ancienne
   liste joignable par `?carnet=v0` jusqu'à son classement (révocable sans revert).

DÉCISION À PRENDRE (pilote → brasseur, en mini maquette si besoin) : la photo seule sans texte. Options : (A) l'IA lit la
photo pour proposer un rattachement (lève l'accord du 17.11, coût image) ; (B) la carte propose le problème ouvert touché en
dernier, sans lire la photo (« Rattacher à Écoulement qui fuit ? », raison : « ouvert hier ») ; (C) aucune proposition :
Oui / Nouveau problème / Laisser seulement. Recommandation : B (garde l'accord, garde la carte de la maquette, rien d'inventé).

## Contrôles du pilote après chaque voie

`git status --short` (rien hors Possède) ; tsc racine et functions (aucune erreur neuve, 2 connues) ; tests de la voie et
c48…c64Regles, carnets* verts ; `npm run build` vert ; vision au banc puis en ligne sur ZZ TEST, 390 en défilant d'abord,
clair et sombre, côte à côte avec la maquette (L03, L12) ; constat → work/missions/BUGS.md.
