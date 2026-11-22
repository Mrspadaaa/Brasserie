# Passe 2 par principes (21.11) : actions instantanées, nom obligé, vue qui saute, trop de texte

Ses mots (SPEC-BRASSEUR, fin) : « proposer des actions instantané aussi, certains gest commun en demandant plusieurs » ; « Taper un
nom pour valider, ensuite sortir du mode clavier ect... C'est des actions en plus » ; « facilité le renomage et un entré (retour à la
ligne( du clavier sur mobile confirme) » ; « trop de text et pas assez de visuel » ; « certaines actions … fait bouger toute la vue ».
Lus comme des règles, pas comme des exemples : R9 (vue qui saute), R11 et R12 (neuves, ajoutées à `REGLES.md`), R6 (texte).
La passe 2 des chaînes et de Moins de gestes (v01 à v14 : recette, rebrasser, article, jour J, fûts, vente, planifier) appartient à
l'autre agent : rien de ce qu'elle couvre n'est repris ici.

Banc : `scripts/parcours/principes.mjs` (port-carnet), build de test d'une copie de HEAD (cf945eaec) et du tag
en-ligne/2026-11-21-tour7 dans os.tmpdir() ; fixture « ZZ TEST » chaines.mjs (plus un lot en fermentation pour la mesure de densité) ;
390×844 tactile ; gestes au doigt (`touchscreen.tap`). 7 écrans et l'assistant, 61 actions mesurées, 11 créations ouvertes deux fois,
5 chaînes jouées pour les actions instantanées. Constats : `BUGS-principes2.md` (WX2-1 à WX2-12).

## 1. Vue qui saute (R9), du pire au moins grave

Mesure : haut du premier bloc sous l'en-tête et élément touché, suivis image par image ; somme des `layout-shift` (après geste comprises).
Plafond : 1 px, CLS 0,02 par action et par session. Le premier bloc ne bouge nulle part (0 px) : ce qui saute est à l'intérieur.

| Rang | Écran | Pire action | CLS de session | Constat |
|---|---|---|---|---|
| 1 | Assistant recette | « Suivant » : le bouton saute de 490 puis 655 px ; Houblons 0,144 | 0,318 | WX2-3, WX2-4 |
| 2 | Stocks › Articles | Autres stocks 0,071 ; Épingler : tuile −38 px sous le doigt | 0,264 | WX2-2 |
| 3 | Calendrier | Cacher la courbe 0,047 ; 8 actions sur 11 au-dessus du plafond | 0,248 | WX2-1 (sa plainte) |
| 4 | Brassins | Filtre « Tous » 0,032 | 0,039 | WX2-5 |
| – | Finances | 0,007 au plus | 0,014 | tenu |
| – | Bord, Clients | 0 | 0 | tenus |

## 2. Nom obligé (R12) : inventaire

Dans l'app (jouées) :

| Création | Ouvrir | Nom par défaut | Valider sans taper | enterkeyhint | Entrée | Avant → après (gestes) |
|---|---|---|---|---|---|---|
| Événement, Calendrier (Travaux, Activités, Papiers) — `FeuilleAjout.tsx:333-340` | 2 | aucun (puces de noms récents si elles existent) | refusé « Choisis un nom. » | done | ferme le clavier seulement | 6 → 3 |
| Recette, assistant — `BrewWizard.tsx` `recipe_title_label` | 2 | placeholder seul | bloqué | done | champ suivant (style) | 6 → 3 |
| Achat de matériel « Pour quoi ? » — `NewEquipment.tsx` | 3 | aucun | refusé | done | ferme le clavier seulement | 7 → 4 |
| Idée de l'Atelier — `Ecrire.tsx` | 2 | le texte est l'idée | – | send | crée le carnet, avec Annuler | tenu |
| Nouveau client — `EditClientModal.tsx` | 3 | le nom est le client | refusé | next | confirme | tenu |
| Nouveau tarif | 3 | nom de bière proposé | – | done | champ suivant | tenu |
| Brassin (depuis une recette) | 3 | nom de la recette | oui | – | – | tenu |

Renommer : seuls les carnets ont un crayon au titre (`CarnetsVue.tsx:980`). Un événement : 7 gestes par Modifier ; une recette :
l'assistant entier. Lecture du code (`statique.mjs`, toute `src/`) : 527 champs texte, 34 avec `enterKeyHint`, 16 où Entrée agit ;
74 champs de nom, 70 sans `enterKeyHint` ; 29 boutons ou gardes bloqués par un nom vide, dont `StocksTab.tsx:930`,
`TodoTimeline.tsx:179-180` (tâche), `LigneOuverte.tsx:226` (idée), `PageFournisseurs.tsx:188`, `CreativeLabTab.tsx:139`,
`UpgradeSheet.tsx:53`, `BrewIngredients.tsx:570`. Une partie est du code non atteint (`hopV55`) : à trier avant d'en faire des tickets.

## 3. Actions instantanées (R11) : chaînes jouées

| Chaîne | Jouée | Avant | Après (estimé) | Fréquence |
|---|---|---|---|---|
| Relever la densité d'un lot en cuve | Brassins, Ouvrir le brassin, Mesurer densité, régler (± 1 millième par toucher, ou Taper et clavier), Enregistrer | 5 à 7 | 3 : bouton Mesurer sur la carte du lot, densité proposée par la courbe d'atténuation, Enregistrer | 2 à 4 par lot en cuve et par semaine |
| Recompter le stock | Stocks, Recompter, Compter, par article : champ, taper, puis Enregistrer | 10 articles : 25 | 14 : « ✓ comme prévu » d'un toucher par article, chiffre tapé seulement pour l'écart | mensuel |
| Renommer un événement | Calendrier, l'événement, Modifier, champ, taper, fermer le clavier, Enregistrer | 7 | 4 : toucher le titre dans la fiche, taper, Entrée | mensuel (estimé) |
| Créer un événement | Calendrier, Ajouter dans…, champ, taper, fermer le clavier, Ajouter | 6 | 3 : nom proposé « Travaux · S47 », Ajouter | hebdomadaire |
| Créer une recette (identité) | Actions rapides, Recette, champ, taper, fermer le clavier, Suivant | 6 | 3 : nom proposé (style et numéro), Suivant | mensuel |

## 4. Propositions passées au filtre GAIN

| Id | Règle | Proposition | Avant → après | Fréquence | Gain | Coût honnête |
|---|---|---|---|---|---|---|
| PI-1 | R12 | **Un nom se propose** : événement (rangée et semaine), recette (style et numéro), achat de matériel (catégorie ou projet du carnet) ; valider sans clavier | 6 → 3 ; 7 → 4 | hebdomadaire (événements) | −50 % | une règle de nom par objet ; le champ reste là, prérempli et sélectionné au toucher |
| PI-2 | R12 | **Entrée confirme** dans tout champ d'une ligne : la création se valide (ou le champ suivant se prend), le clavier se ferme | −2 gestes par création (fermer le clavier, toucher Ajouter) : 6 → 4 | hebdomadaire | −33 % | `enterKeyHint` et un `onKeyDown` par champ ; aucun bouton ajouté |
| PI-3 | R11, R8 | **Recompter d'un toucher** : « ✓ comme prévu » par article, chiffre tapé seulement pour l'écart | 25 → 14 (10 articles) | mensuel | −44 % ; ressaisie de la quantité attendue supprimée | un bouton par ligne de comptage |
| PI-4 | R11, R3, R4 | **Mesurer depuis la carte du lot**, densité proposée par la courbe, réglée au doigt | 5 à 7 → 3 | hebdomadaire par lot en cuve | −50 % | un bouton sur la carte ; la courbe existe (curseur de densité) |
| PI-5 | R12 | **Renommer sur place** : le titre d'une fiche se touche et s'édite (le crayon des carnets, porté, R7) | 7 → 4 | mensuel (estimé, à mesurer) | −43 % | le crayon des carnets réemployé ; retire le passage par Modifier |

Corrections sans proposition (R9 et R5, au passage de chaque écran, dans l'ordre du gel) : WX2-1 (Calendrier, sa plainte), WX2-3 et
WX2-4 (« Suivant » à place fixe, ajouts sans décalage), WX2-2, WX2-5 ; WX2-11 (phrases en double, Finances).

## 5. Trop de texte (R6) : phrases relevées au premier écran

Mots au premier écran (390 × 844) : Bord 289, Stocks 200, Finances 102, Calendrier 88, Brassins 62, Clients 45. Le texte qui
pourrait devenir un visuel actionnable :
- Finances : « 1 paiement à confirmer … sans eux, le solde n'est pas connu » (écrit deux fois) → une pastille « ? » sur le solde,
  qui ouvre la confirmation : le doute se voit là où on lit le chiffre (R4), un toucher au lieu d'une ligne à lire.
- Stocks : trois phrases qui décrivent l'ordre de l'épicerie → un picto d'ordre par étagère (dégradé de couleur, flèche
  d'amertume, sablier de date), déjà la grammaire de la vue qu'il aime.
- Bord : « rien de posé · voir les six semaines » → la bande de semaines vide, touchable, dit la même chose sans phrase.
Ce sont des corrections (aucun geste gagné) : elles entrent au passage de l'écran, pas comme candidates.

## Annexe : gimmicks écartés

- **Appui long partout, menu des actions de l'objet** : aucune chaîne mesurée n'y gagne plus qu'un bouton visible (PI-4) ; geste caché,
  qu'il faut deviner. Gardé seulement là où il a choisi l'appui long (quantité de vente, A2).
- **« Comme la dernière fois » à la vente et aux fûts** : couvert par Moins de gestes v12 et v13 (autre agent).
- **Glisser une ligne pour la marquer faite** (`SwipeRow.tsx` existe, non branché) : la coche du Bord fait déjà 1 geste.
- **Épingler en un geste** : il l'est déjà ; seule la vue qui saute après (WX2-2) est un défaut.
- **Nom par défaut pour un client ou une idée** : le texte est la chose créée ; seule l'Entrée compte (tenue).

## Compte final

Banc : `node scripts/parcours/principes.mjs <dossier> --ref <ref>` lancé depuis port-carnet. Chaque ref est construite dans
`os.tmpdir()` (copie `git worktree` détachée, `node_modules` en jonction), jamais depuis l'arbre de travail. Mêmes fixtures
« ZZ TEST », 390×844 tactile. Deux passages :
- **tour7** : `--ref en-ligne/2026-11-21-tour7` (d73f47040).
- **HEAD** : `--ref HEAD` = port-carnet `92f9d870e` (branche claude/port-carnet-1711). L'analyse ci-dessus citait `cf945eaec`,
  HEAD d'alors ; non remesuré.

| Grille | tour7 | HEAD |
|---|---|---|
| VUE-SAUTE (R9) : actions KO | 18 | 18 |
| VUE-SAUTE (R9) : sessions KO (plafond 0,02) | 4 (calendrier, brassins, stocks, assistant) | 4 (mêmes) |
| VUE-SAUTE, total | 22 | 22 |
| NOM-OBLIGE (R12) : créations KO | 5 (recette, Calendrier travaux / activités / papiers, matériel) | 5 (mêmes) |
| **Total** | **27 (PRINCIPES ECHEC)** | **27 (PRINCIPES ECHEC)** |

Détail VUE-SAUTE, tour7 : calendrier 7 actions KO (S48, S49, Cacher la courbe, ZZ TEST Commande de malt, Fermer, Période suivante et
précédente) ; brassins « Tous » ; stocks 5 (Étagère, Autres stocks, Ingrédients, Épingler, Articles) ; assistant 5 (Changer de
fermenteur, « Suivant » 490 et 655 px, ZZ TEST Caramünch, ZZ TEST Munich). Mêmes actions dans HEAD. Écarts de mesure seulement :
CLS de session assistant 0,318 (tour7) contre 0,32 (HEAD) ; « Suivant » 0,041 contre 0,043.

Lecture : le tag tour7 ne réduit aucune grille ; ses 27 KO sont ceux de HEAD. NOM-OBLIGE KO sur carnet et client : aucun (le
script les relève « tenus » pour ces écrans). Journaux : scratchpad de la session (`log-tour7.txt`, `log-head.txt`).
