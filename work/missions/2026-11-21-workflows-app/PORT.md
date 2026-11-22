# Mission 2026-11-21-workflows-app — plan de port des workflows choisis

Plan seulement : rien n'est codé ici. Le code vit dans `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet`
(branche `claude/port-carnet-1711`). Tous les chemins `src/…` et `scripts/…` ci-dessous sont relatifs à ce worktree,
les lignes lues le 21.11 sur HEAD `4ec506332`. Les chemins `work/…` sont relatifs au dépôt Brasserie.

## Objectif

Porter dans l'app le lot de workflows qu'il a tranché le 21.11 : 11 gains tranchés seuls, 7 choix (D393 : A2, B1, C1, D2 ;
D396 : E2, F2, G3) et les deux corrections de principe (VUE-SAUTE, NOM-OBLIGE).

Ses mots, qui cadrent le port :
- « Très bien fait le portage du système, du mécanisme, pas du visuel » ;
- « on doit bien être au clair que c'est des actions, workflow et autres que on modélise mais pas le "visuel" » ;
- « des vrais gain et pas juste des gimmick » ;
- sur G : « J'aime bien g1 et g3 » (D396 : créé d'abord, nommé après, avec un nom posé par défaut).

Règle n° 1 : chaque écran garde la maquette qu'il a choisie (`work/refonte-frontend/v4/choix/ecrans.json` et `ecrans-app.json` :
étape Houblons base v4.10, Ma bière, Ma levure r3 v05 et r4 v02, identité r4-a, fermentescibles s1, levure l5b, barre-plus b1,
menu m3, recherche r3p2, simplicité pa1 à pl2). Seul le comportement change. Un mécanisme qui n'a pas de place dans la maquette
choisie ne crée pas d'élément : il devient « à dessiner » (L24) et la voie le rend en DÉCISION À PRENDRE.

Fini veut dire, pour chaque élément : branché, atteint par son entrée dans Chrome à 390 tactile, étape de parcours rouge sur
`en-ligne/2026-11-21-tour7` puis verte sur l'arbre, captures avant et après ouvertes, vitest des règles, `npm run build` vert.
Chaque suite posée seule est dite, avec Annuler (R1). Une valeur inconnue n'est jamais 0.

## Éléments à porter

Gains : **mesuré** (banc Chrome 390 tactile), **compté** (gestes relevés sur capture ou au code), **estimé** (ni joué ni compté).
Sources : `SYNTHESE.md` § 2, 7, 8 ; `ANALYSE-passe2.md` § 1 à 3 ; `ANALYSE-principes2.md` § 1 à 4 ; les deux pages de choix.

### Les 11 gains tranchés (versions Moins de gestes fusionnées)

| # | Élément | Règle | Gain | Fichiers touchés (port-carnet) | Dépend de | Voie |
|---|---|---|---|---|---|---|
| T1 | **N1** : l'ingrédient proposé par le contexte se pose juste d'un toucher. Houblon du style, ton stock d'abord, dose qui tient l'IBU, α du lot (v03, son 1er) ; sels du profil sur ton eau (v06) ; une puce « pour ce style » par ingrédient, jamais l'étape entière (v02) ; levure du style en stock, dose écrite (v05) ; malt avec une quantité sensée (v04) ; α du lot et styles déjà brassés en tête (K8) | R8, R1, R2 | recette ≈ 34 → ≈ 14 gestes (estimé, −59 %) ; houblon 7 → 1, sels 6 → 1, levure 4 → 1 (comptés 20.11) ; malt entré à 0 kg qui bloque le lancement : rendu impossible (joué, WFR-3) ; style ≈ 60 entrées → 1 (estimé) | `src/pages/BrewWizard.tsx:3092` (champ d'ajout de houblon), `:1322` (levure homonyme = suggestion), `:309-336` (pastilles) ; `src/domain/hopIndex/styleSelection.ts:83` (usage pour le style) ; `src/ui/hopIndex/HopRecipeWorkbench.tsx:144` (repères pour ce style, lecture) ; neuf `src/domain/recette/propositions.ts` | F-NOM (nom de recette), W0b ; maquettes choisies étape Houblons, Ma levure, fermentescibles s1 | V-RECETTE |
| T2 | **N3** : rebrasser relie la recette au stock d'un toucher, dose recalculée à l'α du lot ; une ligne douteuse reste à lui (v07) | R8 | 12 → 2 (compté 20.11, −83 %) ; dose fausse à α changé rendue visible | `src/ui/production/recettes/CarnetRecettes.tsx:239` (« Pour la rebrasser, il manque ») ; `src/components/tabs/ProductionTab.tsx:140-144, 254` et `src/ui/BatchDetailSheet.tsx:447` (« Rebrasser cette … », lecture) ; neuf `src/domain/recette/relierAuStock.ts` | T1 (même module de propositions), W0b | V-RECETTE |
| T3 | **N4** : les fûts reviennent depuis le client, tous d'un coup, date du jour, un fût absent se décoche (v11, repêche P5 vendre) | R1 | 3 par fût → 3 pour tous (4 pour un fût, mesuré passe 1) ; −75 % à 3 fûts | `src/domain/stock/futsFiche.ts:142` (`retourVide`, un fût) ; `src/ui/lot/QuiARecuLot.tsx:103` ; `src/ui/KegFiche.tsx:60` ; fiche client (`src/components/tabs/ClientsTab.tsx`, ligne à situer) | W0b (fixture : `F-004` livré, client `CL-CIGOGNE`) | V-FUTS |
| T4 | **K2 + K3 (v14)** : une chose datée née ailleurs (projet, idée, recette) arrive au Calendrier et on la suit ; poser un brassin propose sa suite (cuve libre, fin, garde, mise en fût) en « proposé » ; ses manques vont dans Courses jusqu'au prochain brassin ; son coût estimé entre dans la caisse. Sa vue du Calendrier reste la sienne (« Mais pas vraiment pas bone vue du calendrier ? ») | R1, R4, R8 | projet au Calendrier : impossible (joué) → 0 ; recette : 3 gestes pour la retrouver (compté) → 0 ; brassin : ≈ 4 + 1 par étape → 1 (compté 20.11) ; Courses : 3 gestes, 1,5 s / 2,8 s (mesuré) → 2, liste « rien cette semaine » fausse rendue impossible | Calendrier : `src/domain/calendrier.ts:532-587` (estimations), `:895` (idée datée), `src/domain/calendrierGestes.ts:413`, `src/domain/fermenterPlanning.ts:24-27` (lecture) ; Carnet : `src/ui/carnets/CarnetOuvert.tsx:209` (« Au calendrier » à poser) ; Courses : `src/domain/stock/horizon.ts:46, 89`, `src/domain/stockLevel.ts:449`, `src/App.tsx:1364-1366` (lecture) ; recette : `src/pages/BrewWizard.tsx:759` (date du 1er écran) | T7 (C1), session frise finie | V-CAL (arrivée, suites du brassin), F-HORIZON (« Au calendrier » du Carnet), V-RECETTE (horizon du 1er écran), V-COUT (Courses, coût) |
| T5 | **N2** : le jour J pose ce qu'il sait : commencer d'office, pesée d'un toucher (« Tout pesé »), eau d'empâtage à la température calculée pour 67 °C (v09) | R1, R8 | 5 → 3 (compté 20.11 ; joué : 4 jusqu'au compagnon) ; eau proposée à 55 °C sans calcul (joué) : température fausse évitée | `src/domain/brewLaunch.ts:85` (pastilles kg de l'empâtage) ; `src/domain/brewDayCalculs.ts:12-17, 77` (Palmer, `CHALEUR_GRAIN`) ; `src/pages/BrewDayPage.tsx:1978, 2701` | WF2-1 corrigé (`6a1ca2ff9`), W0b | V-JOUR |
| T6 | **K7 + v10** : mettre en fûts propose les fûts qui tiennent le volume, lavage compris (« 4 à laver · marquer propres ») | R1, R8 | 6 gestes pour 2 fûts (joué) → 3, −50 % ; lot à moitié tiré évité | `src/ui/KegFillSheet.tsx:50` (seuls les fûts propres) ; `src/domain/stock/futsFiche.ts:160-209` (`remplirFut`, remplir depuis un lot) ; `src/ui/production/fiche/PostFiche.tsx:157-171` (« Conditionner », lecture) | W0b | V-FUTS |
| T7 | **N6** : le coût du brassin se chiffre au prix du stock, coût du litre et marge par 33 cl au même endroit ; la facture le remplace (B5) | R1, R8 | 4 gestes pour lire « ? CHF/L » (joué) → 0 ; WF2-8 (`aa260ccff`) a déjà ramené le chiffrage à 1 geste « Reprendre les N prix du stock » ; reste la marge, impossible aujourd'hui | `src/domain/finance/prixDuStock.ts:14` ; `src/ui/finance/BrewBudgetSheet.tsx:194-195` ; `src/domain/finance/swissBeerTax.ts:75` (impôt par 33 cl, lecture) | D2 (prix), session bugs finie | V-COUT |
| T8 | **K4** : une seule caisse : Bord, Finances et Calendrier lisent un calcul ; le Bord montre le point le plus bas à venir | R4 | 3 chiffres pour une même situation (mesuré : 421,57 · 421,57 à payer · −570) → 1 ; lire le solde au Bord : 1 geste, 1,5 s → 0 | `src/domain/finance/forecast.ts:87` (`buildForecast`) ; `src/domain/calendrierCaisse.ts:11` (contrôle croisé) ; `src/ui/finance/FinanceForecastSummary.tsx:17` ; `src/ui/finance/prevision/PlanSheetC.tsx:43` ; `src/domain/finance/assistantContext.ts:141` ; `src/components/tabs/DashboardTab.tsx:344` ; `src/domain/finance/materielFutur.ts:130, 196` (`pointBas`, à réemployer) ; `src/ui/calendrier/useDonneesCalendrier.ts:158` (lecture : le Calendrier garde son appel) | session bugs finie (WFA-15 touche `forecast.ts` l.143, WFA-12 `upgradeForecast.ts`) | V-COUT |
| T9 | **PI-4** : mesurer depuis la carte du lot ; la valeur de départ est le choix E (E2) | R11, R3, R4 | 5 à 7 → 3 (joué, −50 %) ; 2 à 4 relevés par lot et par semaine | `src/ui/production/liste/CarteBrassin.tsx:62` (action de la carte) ; `src/ui/production/fermentation/FicheFermentation.tsx:313-355` (`PanneauMesure`) | E2 | V-LOT |
| T10 | **PI-2** : Entrée valide la création et ferme le clavier, partout ; dans un champ d'une ligne, Entrée prend le champ suivant | R12 | 6 → 4 par création (joué) ; 70 champs de nom sur 74 sans `enterKeyHint` (compté au code, `statique.mjs`) | `src/ui/Input.tsx:31` (composant partagé) ; `src/components/EditClientModal.tsx:94-112` ; `src/ui/calendrier/frise/FeuilleAjout.tsx:337` ; `src/pages/BrewWizard.tsx:2654-2658` ; `src/ui/equipment/NewEquipment.tsx:57` ; gardes de nom vide : `StocksTab.tsx:930`, `TodoTimeline.tsx:179-180`, `LigneOuverte.tsx:226`, `PageFournisseurs.tsx:188`, `CreativeLabTab.tsx:139`, `UpgradeSheet.tsx:53`, `BrewIngredients.tsx:570` (une partie non atteinte, `hopV55` : à trier) | W0a | F-ENTREE, puis chaque voie dans ses fichiers |
| T11 | **PI-5** : un titre se renomme en le touchant (le crayon des carnets, porté) | R12, R7 | 7 → 4 (joué sur un événement ; fréquence estimée, à mesurer) | source du mécanisme : `src/ui/carnets/CarnetsVue.tsx:973-980, 1194-1196` et `src/ui/carnets/RenommerCarnet.tsx` (lecture) ; consommateurs : `src/ui/calendrier/frise/DetailChose.tsx:328-338` (événement, par Modifier), `src/ui/equipment/Detail.tsx:291-296` (matériel), `src/ui/YeastRecipeDossier.tsx:541-543` (exemple existant) | W0a | F-NOM, puis V-CAL |

### Les 7 choix

| # | Élément | Règle | Gain | Fichiers touchés (port-carnet) | Dépend de | Voie |
|---|---|---|---|---|---|---|
| A2 | **K5, quantité par appui long** : appui long sur la tuile 33 cl → 6 · 12 · 24 ; le toucher simple garde +1 | R3, R4, R11 (geste caché admis là où il l'a choisi) | 6 × 33 cl : 10 gestes, 7,3 s (mesuré) → 6 ; 24 bouteilles : 28 → 6 | `src/ui/vente/Caisse.tsx:383-388` (tuile de format, « Retirer un ») ; `src/ui/depense/Plateau.tsx:43` (`TuilesQuantite`, réemploi) ; mécanisme : `src/ui/calendrier/frise/usePointeur.ts:14` (`APPUI_LONG_MS = 500`, lecture) ; neuf `src/ui/gestes/useAppuiLong.ts` | session bugs finie (Caisse : B5, B6 faits, WFV-14 ouvert), W0b | F-APPUI |
| B1 | **K6, reste à vendre sur la carte du brassin** : « Pale Ale · 114 × 33 cl · 2 fûts » ; chaque vente baisse le reste ; toucher le reste ouvre la vente | R6, R1 | impossible (V6 jouée : aucun écran) → 1 regard | `src/ui/production/liste/CarteBrassin.tsx:13-84` ; `src/ui/vente/brassinsVendables.ts:6, 29` (`brassinsVendables`, `jaugeBrassin`, `litresVendus`) ; `src/ui/production/liste/listeModel.ts:122` (B11, lecture) | session bugs finie (captures B11 à 390), W0b | V-LOT |
| C1 | **K1, date en horizons au glisser** : aujourd'hui, 1 mois, 3 mois, 6 mois, 1 an (« vers févr. ») ; glisser sur la frise donne la semaine ; Brasser donne le jour ; Calendrier, Courses et coût suivent l'horizon. Retire le carrousel de 60 puces | R2, R3, R7 | recette : ≈ 7 gestes au jour près (compté) ; idée à 3 mois : 3, à 6 mois ≈ 5 (comptés) → 1 (+ 1 s'il veut la semaine) ; date passée par mégarde impossible | neufs `src/domain/horizons.ts` et `src/ui/saisie/Horizons.tsx` (amorces lues : remplir un fût `futsFiche.ts:160-209`, rythme d'Étalonner `NewEquipment.tsx:57`, `src/ui/equipment/Detail.tsx:291-296`, puces de semaine `FeuilleAjout.tsx:16, 30`) ; consommateurs : `src/ui/carnets/CarnetOuvert.tsx:209`, `src/pages/BrewWizard.tsx:759, 1447, 1753`, `src/ui/calendrier/frise/FeuilleAjout.tsx` et `src/ui/calendrier/frise/feuille.css:11-12` (carrousel `.cal-f-semaines`) | W0a (contrôle HORIZON) ; session frise finie pour le Calendrier | F-HORIZON, puis V-RECETTE et V-CAL |
| D2 | **K1, prix estimé = dernier achat semblable** : « Pompe 2025 : 420 », toucher garder ; rien de semblable : ordre de grandeur (D1) ; marqué « estimé » ; la facture le remplace. IA écartée | R2, R8 | aucun gain mesuré (chaîne du prix jamais jouée, dit tel quel, critique n° 3) ; → 1 geste | `src/components/recherche/apercu.ts:38-60` (`dernierAchat`, réemploi) ; `src/domain/calendrierAjout.ts:202` (`montantsRecents`) ; `src/ui/calendrier/frise/FeuilleAjout.tsx:236` (montant) ; projet du Carnet `src/ui/carnets/CarnetOuvert.tsx:102, 209` ; matériel `src/ui/equipment/NewEquipment.tsx` | W0a ; fixture : un achat « ZZ TEST Pompe » de 420 | F-HORIZON (projet), F-NOM (matériel), V-CAL (Calendrier) |
| E2 | **N5, densité « Comme prévu » d'un toucher** : « 1,013 prévu : ton densimètre dit pareil ? » ✓ enregistré ; sinon Autre, +1, Enregistrer. « Prévu » vient de la courbe du lot, jamais enregistré sans son toucher | R11, R8, R3 | 12 → 3 si pile, 5 sinon (joué : 1,022 → 1,014 = 8 crans) | `src/ui/production/fermentation/FicheFermentation.tsx:313-355` ; `src/components/charts/FermentationCurveChart.tsx:16-20` et `src/ui/production/fiche/ficheModel.ts` (`releves`, lecture) ; neuf `src/domain/fermentation/prevision.ts` | T9, W0b (fixture : lot en cuve avec courbe) | V-LOT |
| F2 | **N7 + PI-3, recompte rayon par rayon** : l'écart se tape (chiffre, Entrée) ; « ✓ le reste du rayon » d'un toucher. Non compté reste « non compté », jamais 0. Inventaire de clôture et recompte du mois prennent le même geste | R11, R2, R5 | 38 → 14 gestes (12 articles, 6 rayons, 2 écarts ; compté) ; recompte de 10 articles 25 → ≈ 14 | `src/ui/stock/RecompterStock.tsx:1-184` ; `src/domain/stock/listeFiltres.ts` (`comptesRecompter`, `lireQuantite`) ; `src/components/tabs/StocksTab.tsx:48-51, 425-429` | W0b ; propriétaire de `StocksTab.tsx` à vérifier | V-STOCK |
| G3 | **PI-1, créé d'abord, nommé après** (avec le nom posé de G1) : toucher la case S47 de Travaux crée « Travaux · S47 » ; renommer en touchant le titre ; recette « IPA n° 3 » ; matériel au nom du projet du carnet. Un client ou une idée se tape : Entrée valide. Un toucher de trop crée une chose : Annuler la retire | R12, R1 | événement 6 → 2 (joué : « Choisis un nom. ») ; recette 6 → 3 ; matériel 7 → 4 | `src/domain/calendrierAjout.ts:106, 333` (`brouillonVide`, refus « Choisis un nom. ») ; `src/ui/calendrier/frise/Rangee.tsx:856` (« Ajouter dans … ») ; `src/ui/calendrier/frise/FeuilleAjout.tsx:168, 337` ; `src/pages/BrewWizard.tsx:2654-2658` ; `src/ui/equipment/NewEquipment.tsx:57-61` ; neuf `src/domain/nomParDefaut.ts` | W0a (NOM-OBLIGE), T10, T11 | F-NOM (règle, matériel), V-CAL (événements), V-RECETTE (recette) |

### Les 2 corrections de principe (contrôle `scripts/parcours/principes.mjs`)

| # | Élément | Règle | Mesure sur tour7 | Fichiers touchés (port-carnet) | Dépend de | Voie |
|---|---|---|---|---|---|---|
| P1 | **VUE-SAUTE** : un geste ne déplace pas le reste de l'écran ; zones à contenu changeant à taille fixe ; « Suivant » de l'assistant à place fixe | R9 | 22 KO (18 actions, 4 sessions) ; CLS de session : assistant 0,318, Stocks 0,264, Calendrier 0,248, Brassins 0,039 (plafond 1 px, 0,02) ; « Suivant » saute de 490 puis 655 px | assistant : `src/pages/BrewWizard.tsx:2337-2364` ; Stocks : `src/components/tabs/StocksTab.tsx:200-429` (Étagère, Autres stocks, Ingrédients, Épingler, Articles) ; Calendrier : `src/components/tabs/CalendrierTab.tsx:909`, `src/ui/calendrier/**` (7 actions) ; Brassins : `src/ui/production/liste/ListeBrassins.tsx:172-180` (« Tous ») | W0a | V-RECETTE, V-STOCK, V-CAL, V-LOT |
| P2 | **NOM-OBLIGE** : une création a un nom par défaut, se valide sans clavier, Entrée confirme | R12 | 5 KO : recette, Calendrier Travaux, Activités, Papiers, matériel | corrigé par G3, T10, T11 (fichiers ci-dessus) | W0a | F-NOM (matériel), V-CAL (trois rangées), V-RECETTE (recette) |

**Compte : 20 éléments** (11 tranchés, 7 choix, 2 corrections).

## État de l'art

- Problème type : saisie de dates floues (date d'intention à précision variable : horizon relatif, semaine, jour).
- Examiné : ISO 8601-2 / EDTF (dates incertaines ou approximatives, `2027-02~`) ; préréglages relatifs des agendas et gestionnaires de tâches (« plus tard », « semaine prochaine », « un jour ») ; `date-fns` (MIT, `addMonths` borne la fin de mois) et Temporal (proposition TC39, polyfill lourd) ; `chrono-node` (MIT, analyse de texte libre : hors sujet, aucune saisie au clavier). Le dépôt n'a pas `date-fns` ; il a déjà `lundiDe`, `ajouterJours`, `etiquetteS` (`src/domain/calendrier`) et la semaine ISO de la frise.
- Décision : pas de chaîne EDTF ni de bibliothèque neuve. Une date d'intention se stocke comme le lundi ISO de sa semaine plus un champ `precision` (`semaine`, `mois`) ; l'horizon (1, 3, 6, 12 mois) s'ajoute en mois civils bornés à la fin de mois (règle d'`addMonths`, écrite et testée dans `src/domain/horizons.ts` avec les cas 31 janv. + 1 mois, 29 févr., passage d'année), puis se ramène au lundi par `lundiDe`. Affichage « vers févr. ». Une date passée se refuse à la saisie. Le jour exact reste à Brasser (R2).

- Problème type : valeurs par défaut sensées et nom par défaut d'une chose créée (« sans titre 2 »).
- Examiné : motif des éditeurs et systèmes de fichiers (« Document sans titre », « nouveau dossier 2 » : base + numéro libre suivant) ; « smart defaults » (valeur la plus probable, toujours modifiable, jamais posée sans le geste de l'utilisateur) ; `fuse.js` (Apache-2.0, déjà dans `package.json`, employé par `src/domain/carnets/doublons.ts`) pour « semblable ».
- Décision : fonction pure `nomParDefaut(genre, contexte, nomsExistants)` : base tirée de la rangée et de la semaine (« Travaux · S47 »), du style (« IPA n° k », k = plus grand numéro existant + 1, comparé après la normalisation déjà employée), du projet du carnet ou de la catégorie (matériel). Exception R12 : un client, une idée n'ont pas de nom par défaut. Prix D2 : « semblable » = même référence de stock, sinon même catégorie et nom proche par `fuse.js` (seuil fixé sur une moitié des achats de la fixture, jugé sur l'autre, L20) ; rien au-dessus du seuil : D1, jamais 0.

- Problème type : édition en place d'un titre (click-to-edit, inline edit).
- Examiné : motif standard : le titre est un bouton, le toucher le remplace par un champ texte focalisé et sélectionné ; Entrée valide, Échap annule, la sortie du champ valide ; le focus revient au titre ; un vide se refuse et rend l'ancien nom. Composants publiés : `@atlaskit/inline-edit` (Apache-2.0, dépend du design system Atlassian), `react-easy-edit` (MIT). Dans l'app : `RenommerCarnet` et le crayon des carnets (`CarnetsVue.tsx:973-980`), qui marchent.
- Décision : porter le mécanisme des carnets (R7) dans un composant partagé `src/ui/saisie/RenommerSurPlace.tsx`, sans bibliothèque, avec le motif standard ci-dessus ; `RenommerCarnet` n'est pas modifié dans ce lot.

- Problème type : appui long sur écran tactile (long press), et la touche Entrée des claviers virtuels.
- Examiné : délai standard ≈ 500 ms (Android `ViewConfiguration.getLongPressTimeout`, iOS `UILongPressGestureRecognizer.minimumPressDuration` 0,5 s), annulé au-delà d'un déplacement d'environ 10 px ; supprimer le menu contextuel et la sélection de texte (`contextmenu`, `-webkit-touch-callout`) ; `use-long-press` (MIT, ≈ 2 ko) et `@use-gesture/react` (MIT, ≈ 10 ko) ; dans l'app : `usePointeur.ts` (`APPUI_LONG_MS = 500`) de la frise, éprouvé par `calendrier.mjs`. Entrée : attribut HTML `enterkeyhint` (`done`, `next`, `send`) et `keydown` Enter hors composition IME (`isComposing`).
- Décision : un crochet neuf `src/ui/gestes/useAppuiLong.ts` qui reprend les constantes et la logique de `usePointeur.ts` (500 ms, tolérance de déplacement, menu contextuel coupé) sans modifier la frise ; l'unification des deux se fait dans V-CAL, une fois la session frise close. Pas de bibliothèque : le mécanisme existe et est éprouvé. Entrée : `Input.tsx` gagne une prop `onEntree` et un `enterKeyHint` par défaut seulement quand elle est donnée (aucun champ existant ne change seul) ; Entrée ignorée pendant une composition IME.

- Problème type : densité attendue d'une fermentation à un jour donné (courbe d'atténuation), et température d'eau d'empâtage (infusion).
- Examiné : courbes de fermentation par décroissance exponentielle ou logistique de la densité vers la FG ; la courbe du lot déjà dessinée par `FermentationCurveChart.tsx` ; formule d'infusion de Palmer (How to Brew, « Infusion Mash Calculations »), déjà dans `src/domain/brewDayCalculs.ts:12-17` (`CHALEUR_GRAIN = 0,41`).
- Décision : E2 lit la valeur « prévu » sur la courbe que l'app dessine déjà pour ce lot, sans nouveau modèle ; sans courbe ni FG visée, pas de « prévu » : le curseur part du dernier relevé (l'inconnu n'est jamais inventé). N2 emploie la formule de Palmer existante pour 67 °C, aucune autre.

- Problème type : comptage d'inventaire tournant (cycle counting) par emplacement.
- Examiné : comptage par zone (rayon) avec confirmation des lignes justes et saisie des écarts seuls ; un article non compté reste « non compté ».
- Décision : F2 suit ce motif sur les rayons existants de `RecompterStock.tsx` ; chaque écart devient un mouvement daté (règle actuelle de `lireQuantite`) ; aucune bibliothèque.

## Décisions

| Décision | Options | Décideur | État |
|---|---|---|---|
| G : nom par défaut | G1 seul ; G3 seul ; G3 avec le nom de G1 | brasseur | tranchée : G3 avec le nom posé (D396, « J'aime bien g1 et g3 ») ; là où rien ne se touche pour créer (recette, matériel), G1 |
| Gel du 20.11 : coder avant le passage de l'écran ? | fondations et chaînes dans l'ordre du gel (Calendrier, Carnet, Recette, Brassins, Stocks, Finances) ; tout en parallèle | pilote | ouverte ; recommandation : fondations (modules purs, composant, premier branchement hors écran gelé) dès maintenant ; chaque voie de chaîne au passage de son écran, dans l'ordre du gel |
| Appui long : un crochet partagé ou celui de la frise déplacé | crochet neuf qui reprend `usePointeur.ts` ; déplacer `usePointeur.ts` maintenant | pilote | tranchée : crochet neuf (la frise appartient à une session ouverte) ; unification dans V-CAL |
| Un mécanisme sans place dans la maquette choisie (puce N1 sur une étape choisie, point bas K4 au Bord) | greffer un élément ; « à dessiner » | brasseur | tranchée par la règle n° 1 et L24 : la voie le rend en DÉCISION À PRENDRE, « à dessiner » en mini maquettes, sans bloquer le reste |
| E2 sans courbe du lot | prévu inventé ; départ du dernier relevé | pilote | tranchée : départ du dernier relevé, « prévu » absent (honnêteté des données) |
| D2 « semblable » | même référence ; même catégorie et nom proche (`fuse.js`) ; IA | pilote | tranchée : référence, puis catégorie et nom proche ; IA écartée (D393, chiffre inventé et facturé) |
| `Input.tsx` : Entrée par défaut partout ou à la demande | comportement par défaut changé ; prop `onEntree` | pilote | tranchée : à la demande (aucun champ existant, dont ceux de la frise, ne change seul) |

## Voies

Ordre : W0a d'abord (contrôles rouges sur tour7, L13), puis les quatre fondations, puis les chaînes dans l'ordre du gel.
Chaque voie commit par chemins sur `claude/port-carnet-1711`, sans push. Contrôles communs à toute voie de code : `npx vitest run <ses tests>`,
`npm run build`, `git status --short` lu (L17), captures 390 tactile et 1280 ouvertes, deux thèmes ; une voie qui touche un écran
choisi joue `controle-choix.mjs`. Possède disjoints : un fichier n'appartient qu'à une voie.

| Voie | Objectif | Niveau | Agent | Modèle | Plafond | Possède | Dépend de | Contrôles | Décideur | Étape |
|---|---|---|---|---|---|---|---|---|---|---|
| W0a | Étapes rouges dans principes.mjs : NOM-OBLIGE étendu (nom posé par défaut, validation sans clavier), ENTREE (Entrée valide et ferme le clavier : client, tarif, fournisseur, tâche), RENOMMER (titre touché, taper, Entrée : 4 gestes ; matériel, événement), HORIZON (date d'un projet à 3 mois d'un toucher) | jugement | auteur | sonnet | 60 | scripts/parcours/principes.mjs, scripts/parcours/fixtures/principes.mjs | — | `node scripts/parcours/principes.mjs <cap> --ref en-ligne/2026-11-21-tour7` : PRINCIPES ECHEC sur chaque étape neuve ; sur l'arbre : les étapes existantes inchangées | pilote | — |
| W0b | Étapes rouges dans chaines.mjs : A2, B1, E2, N1, N3, N4, K7, N2, N6, K3-COURSES, K4, F2, C1-RECETTE ; fixture complétée (lot en cuve avec courbe, achat « ZZ TEST Pompe » 420, fûts livrés, rayons à recompter) | jugement | auteur | sonnet | 80 | scripts/parcours/chaines.mjs, scripts/parcours/chaines-outils.mjs, scripts/parcours/fixtures/chaines.mjs | session bugs close | `node scripts/parcours/chaines.mjs <cap> --ref en-ligne/2026-11-21-tour7 --etape <neuves>` : ECHEC sur chacune ; les étapes B1 à WFA-15 restent vertes sur l'arbre | pilote | — |
| W0c | Étapes rouges dans calendrier.mjs : G3 (case touchée crée « Travaux · S47 »), RENOMMER-EVT, C1-GLISSER (horizon puis semaine au glisser, sans carrousel), D2-CAL, K2 (projet daté arrive, bascule centrée), K3-SUITES (brassin posé propose cuve, fin, garde, fûts) ; option `--etape` | jugement | auteur | sonnet | 60 | scripts/parcours/calendrier.mjs, scripts/parcours/fixtures/calendrier.mjs | session frise close | `node scripts/parcours/calendrier.mjs <cap> --ref en-ligne/2026-11-21-tour7` : ECHEC sur chaque étape neuve ; PARCOURS CALENDRIER OK hors elles sur l'arbre | pilote | — |
| F-NOM | Fondation : nom par défaut (G3 et G1) et renommer sur place (PI-5) ; premier branchement : achat de matériel au nom du projet ou de la catégorie, fiche matériel renommée au titre ; prix D2 du matériel | jugement | auteur | sonnet | 90 | src/domain/nomParDefaut.ts, src/ui/saisie/RenommerSurPlace.tsx, src/ui/equipment/NewEquipment.tsx, src/ui/equipment/Detail.tsx, tests/unit/nomParDefaut.test.ts, tests/unit/renommerSurPlace.test.tsx | W0a | `principes.mjs --controle NOM-OBLIGE --seul materiel` et `--seul RENOMMER` : rouges tour7, verts arbre ; vitest ; build | pilote | — |
| F-ENTREE | Fondation : Entrée valide ou prend le champ suivant (PI-2) ; `Input.tsx` gagne `onEntree` ; branchée sur client, tarif, fournisseur, tâche | jugement | auteur | sonnet | 70 | src/ui/Input.tsx, src/components/EditClientModal.tsx, PageFournisseurs.tsx, TodoTimeline.tsx, formulaire du tarif (chemins exacts relevés par grep au départ, hors fichiers des autres voies), tests/unit/inputEntree.test.tsx | W0a | `principes.mjs --seul ENTREE` rouge tour7, vert arbre ; NOM-OBLIGE client, tarif, fournisseur restent OK ; vitest ; build | pilote | — |
| F-HORIZON | Fondation : date en horizons (C1) et chaîne Carnet : horizon du projet, « Au calendrier » sur la fiche (K2, côté Carnet), prix du projet au dernier achat semblable (D2) | jugement | auteur | sonnet | 100 | src/domain/horizons.ts, src/ui/saisie/Horizons.tsx, src/ui/carnets/CarnetOuvert.tsx, src/ui/carnets/AtelierPorte.tsx, tests/unit/horizons.test.ts | W0a | `principes.mjs --seul HORIZON` rouge tour7, vert arbre ; `carnet.mjs` reste OK ; vitest (fin de mois, année, passé refusé) ; build ; controle-choix.mjs | pilote | — |
| F-APPUI | Fondation : appui long (crochet) et chaîne Vente : A2 sur la tuile 33 cl, 6 · 12 · 24 en `TuilesQuantite`, +1 au toucher simple | jugement | auteur | sonnet | 70 | src/ui/gestes/useAppuiLong.ts, src/ui/vente/Caisse.tsx, tests/unit/useAppuiLong.test.ts | W0b, session bugs close | `chaines.mjs --etape A2` rouge tour7, vert arbre (6 gestes, 24 bt : 6) ; vitest ; build | pilote | — |
| V-CAL | Calendrier : G3 et NOM-OBLIGE des trois rangées, renommer un événement, C1 au glisser et retrait du carrousel, D2 du montant, K2 arrivée centrée, K3 suites du brassin posé, VUE-SAUTE calendrier ; `usePointeur` lit le crochet partagé | jugement | auteur | sonnet | 120 | src/ui/calendrier/, src/components/tabs/CalendrierTab.tsx, src/domain/calendrier.ts, src/domain/calendrierAjout.ts, src/domain/calendrierGestes.ts, src/domain/fermenterPlanning.ts | W0a, W0c, F-NOM, F-ENTREE, F-HORIZON, session frise close | `calendrier.mjs` (G3, RENOMMER-EVT, C1-GLISSER, D2-CAL, K2, K3-SUITES) rouge tour7, PARCOURS CALENDRIER OK arbre ; `principes.mjs --seul cal-travaux,cal-activites,cal-papiers,calendrier` vert ; vitest ; build ; controle-choix.mjs | pilote | — |
| V-RECETTE | Recette : N1 (puces avec quantité, α du lot, styles en tête), N3 rebrasser relié au stock, nom « IPA n° k » (G1), horizon du 1er écran (C1, K2), Entrée, « Suivant » à place fixe (VUE-SAUTE assistant) | jugement | auteur | sonnet | 120 | src/pages/BrewWizard.tsx, src/domain/recette/, src/ui/production/recettes/CarnetRecettes.tsx | W0a, W0b, F-NOM, F-ENTREE, F-HORIZON | `chaines.mjs --etape N1,N3,C1-RECETTE` et `principes.mjs --seul recette,assistant-recette` rouges tour7, verts arbre ; vitest ; build ; controle-choix.mjs (étape Houblons, Ma levure, identité r4-a, fermentescibles s1) | pilote | — |
| V-LOT | Brassins : reste à vendre sur la carte (B1), Mesurer depuis la carte (PI-4), « Comme prévu » (E2), VUE-SAUTE brassins | jugement | auteur | sonnet | 100 | src/ui/production/liste/, src/ui/production/fermentation/FicheFermentation.tsx, src/ui/vente/brassinsVendables.ts, src/domain/fermentation/ | W0a, W0b, session bugs close | `chaines.mjs --etape B1,E2` et `principes.mjs --seul brassins` rouges tour7, verts arbre ; vitest ; build | pilote | — |
| V-JOUR | Jour J : commencer d'office, « Tout pesé », eau d'empâtage calculée pour 67 °C (N2) | jugement | auteur | sonnet | 80 | src/pages/BrewDayPage.tsx, src/domain/brewLaunch.ts, src/domain/brewDayCalculs.ts | W0b | `chaines.mjs --etape N2` rouge tour7, vert arbre ; WF2-1 reste vert ; vitest (Palmer) ; build | pilote | — |
| V-FUTS | Fûts : remplir avec les fûts qui tiennent le volume, lavage compris (K7) ; retour de tous les fûts depuis le client (N4) | jugement | auteur | sonnet | 90 | src/domain/stock/futsFiche.ts, src/ui/KegFillSheet.tsx, src/ui/KegFiche.tsx, src/ui/KegBoard.tsx, src/ui/lot/QuiARecuLot.tsx, src/components/tabs/ClientsTab.tsx | W0b | `chaines.mjs --etape K7,N4` rouge tour7, vert arbre ; B6 reste vert ; vitest ; build | pilote | — |
| V-STOCK | Stocks : recompte rayon par rayon (F2), VUE-SAUTE stocks | jugement | auteur | sonnet | 90 | src/ui/stock/RecompterStock.tsx, src/ui/stock/recompter.css, src/domain/stock/listeFiltres.ts, src/components/tabs/StocksTab.tsx | W0a, W0b ; aucune session sur StocksTab.tsx | `chaines.mjs --etape F2` et `principes.mjs --seul stocks` rouges tour7, verts arbre ; vitest ; build ; controle-choix.mjs | pilote | — |
| V-COUT | Finances : une seule caisse et point le plus bas au Bord (K4), coût et marge par 33 cl (N6), coût estimé dans la caisse et Courses jusqu'au prochain brassin (K3) | jugement | auteur | sonnet | 110 | src/domain/finance/forecast.ts, src/domain/finance/brewForecast.ts, src/domain/finance/prixDuStock.ts, src/domain/calendrierCaisse.ts, src/domain/stock/horizon.ts, src/ui/finance/BrewBudgetSheet.tsx, src/ui/finance/FinanceForecastSummary.tsx, src/ui/finance/prevision/PlanSheetC.tsx, src/components/tabs/DashboardTab.tsx | W0b, session bugs close | `chaines.mjs --etape K4,N6,K3-COURSES` rouge tour7, vert arbre ; WF2-8, WFA-15, B5 restent verts ; vitest (contrôle croisé `soldeAuJour` = `buildForecast`) ; build | pilote | — |

**14 voies.** `src/App.tsx`, `src/ui/calendrier/frise/usePointeur.ts` hors V-CAL, `RenommerCarnet.tsx` et `seedData.ts` ne sont à aucune voie :
une voie qui en aurait besoin le rend en DÉCISION À PRENDRE.

## Conflits avec les sessions en cours (port-carnet)

**Session bugs des chaînes** (`work/missions/2026-11-21-workflows-app/REPRISE-bugs.md`, mise à jour 5) : B1, B2, B4, D394, B5, B6, B10,
B11, WF2-1, WF2-8, DOSE faits ; restent l'étape WFA-15, WFA-12 (`UpgradeWorkspace.tsx`, `upgrades.ts`, `upgradeForecast.ts`), WFA-13
(texte de la fiche), WFV-14 (« Facturer » depuis la chose du plan, geste dans le Calendrier, correctif côté vente), les captures 390 de
« + en cours, en vente » et les finitions (`chaines.mjs` entier, vitest, build, `BUGS.md`). Elle tient `chaines.mjs` et ses fixtures.
Doit attendre sa fin :
1. **W0b** : même fichier `chaines.mjs` et `fixtures/chaines.mjs`.
2. **V-COUT** : `forecast.ts` (WFA-15, l.143), `BrewBudgetSheet.tsx` et `prixDuStock.ts` (WF2-8), `upgradeForecast.ts` lu par la caisse (WFA-12).
3. **F-APPUI** : `Caisse.tsx` (B5, B6 commités ; WFV-14 peut y revenir).
4. **V-LOT** : `listeModel.ts`, `ListeBrassins.tsx` (B11 ; captures 390 encore à faire, un débordement se corrigerait là).
La session a aussi déclaré interdits `StocksTab.tsx`, `principes.mjs`, `lenteur.mjs` : `principes.mjs` est commité et sans session
(`1755f7c14`) ; **V-STOCK** vérifie au départ, par `git status` et la dernière REPRISE, qu'aucune session ne tient `StocksTab.tsx`.

**Session Calendrier** (`work/missions/2026-11-20-frise/REPRISE.md` de port-carnet, session 8) : B3, B8, B9, B11 commités ; B9 à finir,
test B11 de `bugsWorkflowsCalendrier.test.ts`, suite entière. Arbre sale : `src/ui/calendrier/entete/EnTete.tsx`,
`src/ui/calendrier/frise/frise.css`. Elle tient `src/ui/calendrier/**`, `CalendrierTab.tsx`, `calendrier.ts`, `useDonneesCalendrier.ts`,
`calendrier.mjs`. Doit attendre sa fin :
5. **W0c** : `calendrier.mjs` et sa fixture.
6. **V-CAL** : tout son périmètre ; et WFV-14 de la session bugs, qui passe par le même geste.

**Aucune attente** : W0a, F-NOM, F-ENTREE, F-HORIZON (sauf le gel, décision ouverte), V-JOUR et V-FUTS (WF2-1 et B6 sont commités),
V-RECETTE (B4 et D394 commités ; elle attend W0b pour ses étapes de chaîne).
`source4-portable-bundle-manifest-01.json` est modifié dans l'arbre et n'appartient à personne ici : jamais commité.

**Compte : 6 attentes** (W0b, W0c, F-APPUI, V-CAL, V-COUT, V-LOT), plus une vérification (V-STOCK).

## Agents

Une voie = un agent `auteur` (Sonnet) ; le même agent reprend sa voie si un critère échoue. Les rejeux de parcours et séries de captures
partent chez un exécutant Haiku par `DEMANDE EXECUTANT` (consigne de l'agent auteur). La vision finale de chaque écran porté : critique
(Opus, Fable interdit depuis le 10.11), puis pilote, question « combien et quels problèmes ? » (D343, D344).

## Pages

Aucune page : le lot ne montre rien de neuf au brasseur. Un mécanisme sans place dans sa maquette devient une page de choix neuve,
datée (`work/refonte-frontend/v4/outils/pages/PUBLIER.md`), seulement après la décision du pilote.

## Boucle de retour

- Une étape qui ne rougit pas sur tour7 : le défaut n'est pas prouvé ; la voie W0 la réécrit avant toute correction (L13).
- Un critère échoue : la voie corrige, trois essais au plus, puis rend `ECHEC — <critère, cause>` ; le pilote relance le même agent.
- `controle-choix.mjs` échoue ou une capture s'écarte de sa maquette choisie : la voie retire ce que la maquette n'a pas (L03) ; un
  mécanisme sans place y devient « à dessiner ».
- Un constat neuf pendant le port : versé à `work/missions/BUGS.md` (L05), pas corrigé hors périmètre.
- Une plainte du brasseur après mise en ligne : mot pour mot dans SPEC-BRASSEUR, ligne à DEFAUTS-RECURRENTS, étape qui échoue sur la
  version rejetée, puis correction (L13).
- Leçon possible : une seconde rustine sur `horizons.ts` ou `useAppuiLong.ts` renvoie à l'état de l'art (L29).

## Budget

Estimé, non mesuré : 3 voies W0 (≈ 200 tours en tout) et 11 voies de code (≈ 1 060 tours au plafond). Chaque agent s'arrête à 200 k
jetons et rend « REPRISE : <fichier> ». Usage avant et après : `node scripts/agents/jetons.mjs`, à relever par le pilote au lancement.

## Sources

- `work/missions/2026-11-21-workflows-app/SYNTHESE.md` (§ 2, 3, 7, 8)
- `work/missions/2026-11-21-workflows-app/REGLES.md` (R1 à R12)
- `work/missions/2026-11-21-workflows-app/GAIN.md`
- `work/missions/2026-11-21-workflows-app/ANALYSE-passe2.md`, `ANALYSE-principes2.md`
- `work/missions/2026-11-21-workflows-app/choix-workflows.html`, `choix-workflows-2.html`
- `work/missions/2026-11-21-workflows-app/REPRISE-bugs.md`
- `work/refonte-frontend/decisions.md` (D393, D394, D395, D396)
- `work/refonte-frontend/v4/choix/ecrans.json`, `ecrans-app.json`
- `../port-carnet/work/missions/2026-11-20-frise/REPRISE.md` (worktree voisin)
- `../port-carnet/scripts/parcours/principes.mjs` (et `chaines.mjs`, `calendrier.mjs` du même dossier)

## Signature

Plan écrit le 21.11, aucun code touché. Contrôle : sortie de `node scripts/agents/systeme.mjs mission` relevée au commit.
Ouvert : le gel du 20.11 (pilote). À l'utilisateur : rien dans ce plan (pas de push, pas de déploiement).
