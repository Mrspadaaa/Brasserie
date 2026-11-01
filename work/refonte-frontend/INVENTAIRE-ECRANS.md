# Inventaire des écrans de L'Affinée

Voie e2-inventaire, mission 2026-10-31-systeme-ecrans (31.10). Après houblons, on refait tous les écrans un à un. Ce document dit ce qui existe,
écran par écran, tiré du code ; il ne dit pas ce que le brasseur a choisi (cela reste dans `work/refonte-frontend/v4/choix/ecrans.json`, règle n° 1, D123).

- Données complètes : `work/refonte-frontend/inventaire-ecrans.json` (85 entrées, une par écran, avec accès, fichiers, données, états, tests, taille, lien avec houblons, usage, risque).
- Script : `node scripts/agents/inventaire-ecrans.mjs` régénère le JSON, le tableau ci-dessous et la fiche Identité ; `--verifier` rend `INVENTAIRE OK` ou la liste des écarts.
- Fiche détaillée de l'écran Identité : `work/missions/2026-10-31-ecran-identite/inventaire-identite.md`.

## Comment lire

- **Un écran** est ce que le brasseur voit comme une chose à part : un onglet, une vue d'onglet, une page plein écran, une étape de l'assistant, une couche d'outil houblons, une feuille ou une modale. Les cinq onglets et les vues d'un même onglet sont des entrées séparées ; leur coque (titre, sous-navigation) est l'entrée « onglet-… ».
- **lignes** : la zone de l'écran dans son fichier racine (quand le fichier en porte plusieurs), plus ses composants et feuilles de style propres. Un composant partagé est compté dans chaque écran qui le cite : les totaux ne s'additionnent pas.
- **tests** : fichiers de `tests/` qui importent un des fichiers de l'écran, ou qui contiennent un de ses libellés. Un 0 veut dire « aucun repéré par ces deux moyens », pas « aucun test d'aucune sorte ».
- **états (code)** : motifs trouvés dans le source (`chargement` : Suspense, « Chargement » ; `vide` : liste à zéro, « Aucun » ; `erreur` : `role="alert"`, `catch`… ; `hors ligne` : mention explicite ; `formulaire rempli` : champs de saisie). C'est la présence du code, pas une preuve que l'état se voit : les captures l'ont confirmé pour trois écrans (voir plus bas).
- **hors ligne** n'apparaît presque nulle part : l'app tient hors ligne par le cache Firestore/IndexedDB, globalement (`statut-persistance`), pas écran par écran.
- **houblons** : `refait` = un écran choisi par le brasseur (registre) ; `en partie` = touche aux houblons sans être refait, ou choix ouvert ; `pas du tout`.
- **usage** (1 à 5) : 5 = ce que le brasseur utilise le plus, d'après PRODUCT.md (cuverie : assistant de recette, jour de brassage, atelier de l'eau ; bureau : finances, clients, stocks). **risque** : ce qu'une erreur de refonte coûterait en données.

## Tableau

<!-- TABLEAU -->
85 écrans. Familles : session 3, transverse 7, modale 17, onglet 5, vue-onglet 16, page 2, assistant 1, etape-assistant 7, couche-houblons 7, feuille 20. Lien avec houblons : pas du tout 68, en partie 10, refait 7. Non branchés : `hop-fiche`, `modale-brassin-modifier`, `modale-article-modifier`, `modale-article-ajouter`, `modale-confirmation`.

| id | écran | famille | lignes | tests | données lues | états (code) | houblons | usage | risque |
|---|---|---|---:|---:|---|---|---|---:|---|
| `chargement-session` | Vérification de la session | session | 11 | 0 | props | chargé, chargement | pas du tout | 2 | faible |
| `connexion` | Connexion Google | session | 132 | 3 | Firebase Authentication | chargé, chargement, erreur | pas du tout | 1 | moyen |
| `synchronisation` | Synchronisation des données de la brasserie | session | 35 | 2 | Firestore via FinanceService / archives financières | chargé, chargement, erreur | pas du tout | 2 | moyen |
| `bandeau-erreur-ecriture` | Bandeau « erreur de sauvegarde » | transverse | 14 | 0 | props | chargé, erreur | pas du tout | 3 | moyen |
| `notification-toast` | Message de confirmation (toast) | transverse | 8 | 0 | props | chargé | pas du tout | 4 | faible |
| `en-tete` | En-tête de l'app (menu, période, recherche) | transverse | 317 | 2 | Firestore via StorageService | chargé, formulaire rempli | pas du tout | 5 | faible |
| `barre-navigation` | Barre du bas : Bord · Finances · Brassins · Stocks · Clients | transverse | 115 | 2 | props | chargé | pas du tout | 5 | faible |
| `bouton-actions` | Bouton « + » (actions rapides) et menu du compagnon | transverse | 429 | 3 | props | chargé, vide, chargement | en partie | 5 | moyen |
| `compagnon-brasseur` | Compagnon brasseur (pastille, conversations, discussion) | transverse | 3328 | 16 | localStorage : brouillon de recette ou préférences | chargé, vide, chargement, erreur, hors ligne, formulaire rempli | en partie | 3 | élevé |
| `statut-persistance` | Indicateur d'état de la synchronisation | transverse | 17 | 6 | props | chargé, chargement | pas du tout | 3 | moyen |
| `recherche-universelle` | Recherche universelle (⌘K) | modale | 191 | 8 | props | chargé, formulaire rempli | pas du tout | 3 | faible |
| `onglet-bord` | Bord (tableau de bord) | onglet | 366 | 3 | Firestore via StorageService ; lecture réactive ; Firestore via FinanceService / archives financières ; localStorage : état d'interface | chargé, vide, erreur, formulaire rempli | pas du tout | 5 | faible |
| `onglet-finances` | Finances (coque : titre, sous-navigation, feuilles) | onglet | 604 | 8 | lecture réactive ; Firestore via FinanceService / archives financières ; localStorage : état d'interface | chargé, vide, chargement, formulaire rempli | pas du tout | 3 | élevé |
| `finances-synthese` | Finances · Synthèse (situation, coûts) | vue-onglet | 394 | 1 | props | chargé, vide | pas du tout | 3 | moyen |
| `finances-operations` | Finances · Mes opérations (journal) | vue-onglet | 493 | 2 | props | chargé, vide, formulaire rempli | pas du tout | 3 | élevé |
| `finances-previsions` | Finances · Anticiper les dépenses (échéancier, projets de matériel) | vue-onglet | 199 | 1 | Firestore via StorageService ; lecture réactive ; Firestore via FinanceService / archives financières | chargé, vide, chargement, erreur, formulaire rempli | pas du tout | 2 | moyen |
| `finances-annuel` | Finances · Bilan et impôts (annuel) | vue-onglet | 183 | 1 | Firestore via FinanceService / archives financières | chargé, vide, chargement, erreur, formulaire rempli | pas du tout | 2 | élevé |
| `onglet-brassins` | Brassins (coque : sous-navigation, bouton Atelier Houblons V5.5) | onglet | 386 | 6 | localStorage : état d'interface | chargé, vide, chargement, erreur, formulaire rempli | pas du tout | 5 | moyen |
| `brassins-liste` | Brassins · liste des brassins | vue-onglet | 1934 | 2 | localStorage : état d'interface | chargé, vide, erreur, formulaire rempli | pas du tout | 5 | moyen |
| `brassins-recettes` | Brassins · carnet de recettes | vue-onglet | 1033 | 1 | localStorage : état d'interface | chargé, vide, erreur | en partie | 5 | moyen |
| `brassins-atelier-rd` | Brassins · Atelier R&D (idées, tâches, agenda créatif) | vue-onglet | 794 | 3 | Firestore via StorageService ; lecture réactive | chargé, vide, erreur, formulaire rempli | pas du tout | 2 | faible |
| `brassins-volumes` | Brassins · Adapter les volumes | vue-onglet | 345 | 4 | props | chargé, vide, erreur, formulaire rempli | pas du tout | 2 | faible |
| `onglet-stocks` | Stocks (coque : sous-navigation, filtre, création d'article) | onglet | 1001 | 5 | Firestore via StorageService ; lecture réactive ; localStorage : état d'interface ; catalogue embarqué | chargé, vide, chargement, erreur, formulaire rempli | en partie | 4 | élevé |
| `stocks-stock` | Stocks · inventaire | vue-onglet | 553 | 2 | props | chargé, vide, erreur, formulaire rempli | pas du tout | 4 | élevé |
| `stocks-courses` | Stocks · liste de courses | vue-onglet | 48 | 1 | props | chargé | pas du tout | 3 | moyen |
| `stocks-futs` | Stocks · fûts | vue-onglet | 426 | 1 | props | chargé, vide, erreur, formulaire rempli | pas du tout | 3 | moyen |
| `stocks-materiel` | Stocks · matériel | vue-onglet | 498 | 1 | props | chargé, vide, erreur, formulaire rempli | pas du tout | 2 | moyen |
| `stocks-houblons` | Stocks · Houblons (index des variétés et des lots) | vue-onglet | 627 | 5 | Firestore via StorageService ; lecture réactive ; catalogue embarqué ; Gemini | chargé, vide, chargement, erreur, formulaire rempli | en partie | 3 | moyen |
| `onglet-clients` | Clients (coque : sous-navigation) | onglet | 559 | 3 | Firestore via StorageService ; lecture réactive ; localStorage : état d'interface | chargé, vide, chargement, erreur, formulaire rempli | pas du tout | 2 | moyen |
| `clients-carnet` | Clients · carnet clients | vue-onglet | 251 | 3 | props | chargé, vide, erreur, formulaire rempli | pas du tout | 2 | élevé |
| `clients-impot-biere` | Clients · impôt sur la bière (OFDF) | vue-onglet | 36 | 0 | props | chargé, formulaire rempli | pas du tout | 2 | élevé |
| `clients-tarifs` | Clients · prix et marges (tarifs) | vue-onglet | 230 | 2 | Firestore via StorageService ; lecture réactive | chargé, vide, chargement, erreur, formulaire rempli | pas du tout | 2 | moyen |
| `page-recette` | Fiche de recette | page | 1785 | 19 | Firestore via StorageService ; lecture réactive ; catalogue embarqué | chargé, vide, chargement, erreur | en partie | 5 | moyen |
| `page-brassin-du-jour` | Brassin du jour (déroulé minuté) | page | 6281 | 14 | Firestore via StorageService ; localStorage : brouillon de recette ou préférences ; Gemini | chargé, vide, erreur, hors ligne, formulaire rempli | en partie | 5 | élevé |
| `assistant-recette` | Assistant de recette (coque : en-tête, fil d'étapes, brouillon, validation) | assistant | 5211 | 55 | Firestore via StorageService ; lecture réactive ; localStorage : brouillon de recette ou préférences ; catalogue embarqué | chargé, vide, chargement, erreur, formulaire rempli | en partie | 5 | élevé |
| `etape-identite` | Assistant · étape 1/7 « Identité » | etape-assistant | 1542 | 25 | Firestore via StorageService ; lecture réactive ; catalogue embarqué ; Gemini | chargé, vide, chargement, erreur, formulaire rempli | pas du tout | 5 | moyen |
| `etape-fermentescibles` | Assistant · étape 2/7 « Fermentescibles » (Malts/sucres) | etape-assistant | 1484 | 14 | Firestore via StorageService ; lecture réactive ; catalogue embarqué ; Gemini | chargé, vide, chargement, erreur, formulaire rempli | pas du tout | 5 | moyen |
| `etape-houblons` | Assistant · étape 3/7 « Houblons » | etape-assistant | 657 | 5 | catalogue embarqué | chargé, vide, chargement, erreur, formulaire rempli | refait | 5 | moyen |
| `etape-levure` | Assistant · étape 4/7 « Levure » | etape-assistant | 3574 | 18 | Firestore via StorageService ; lecture réactive ; catalogue embarqué | chargé, vide, chargement, erreur, hors ligne, formulaire rempli | en partie | 5 | moyen |
| `etape-paliers` | Assistant · étape 5/7 « Paliers » (empâtage et fermentation) | etape-assistant | 526 | 13 | Firestore via StorageService ; lecture réactive ; catalogue embarqué | chargé, vide, chargement, erreur, formulaire rempli | pas du tout | 4 | moyen |
| `etape-eau` | Assistant · étape 6/7 « Eau et sels » | etape-assistant | 1622 | 24 | catalogue embarqué | chargé, vide, chargement, erreur, hors ligne, formulaire rempli | pas du tout | 5 | élevé |
| `etape-recap` | Assistant · étape 7/7 « Récapitulatif » | etape-assistant | 1344 | 31 | catalogue embarqué ; Gemini | chargé, vide, chargement, erreur, formulaire rempli | pas du tout | 5 | élevé |
| `atelier-houblons-v55` | Atelier Houblons V5.5 (exploration, décision, journal) | couche-houblons | 8295 | 37 | Firestore via StorageService ; Dexie ; catalogue embarqué ; Firebase Authentication | chargé, vide, chargement, erreur, hors ligne, formulaire rempli | pas du tout | 1 | élevé |
| `hop-ma-biere` | Ma bière (outil houblons) | couche-houblons | 345 | 8 | catalogue embarqué | chargé, chargement, erreur | refait | 4 | moyen |
| `hop-suggerer` | Suggérer (outil houblons) | couche-houblons | 310 | 4 | catalogue embarqué | chargé, erreur | refait | 3 | moyen |
| `hop-comparer` | Comparer (outil houblons) | couche-houblons | 935 | 4 | catalogue embarqué | chargé, chargement, erreur, hors ligne | refait | 3 | faible |
| `hop-dryhopper` | Dryhopper (outil houblons : moment du houblon) | couche-houblons | 217 | 2 | props | chargé | refait | 4 | moyen |
| `hop-levure` | Levure (outil houblons, dans Dryhopper) | couche-houblons | 252 | 0 | props | chargé | en partie | 3 | moyen |
| `hop-substituer` | Substituer (outil houblons) | couche-houblons | 288 | 4 | props | chargé | refait | 3 | moyen |
| `hop-fiche` | Fiche de variété de houblon (feuille) **(non branché)** | feuille | 316 | 1 | catalogue embarqué | chargé | refait | 3 | faible |
| `rapide-menu` | Nouvelle action (menu des saisies rapides) | modale | 33 | 8 | props | chargé, chargement | pas du tout | 4 | faible |
| `rapide-scan` | Lire un justificatif (achat par scan) | modale | 413 | 0 | Firestore via StorageService ; Firestore via FinanceService / archives financières ; Gemini | chargé, vide, chargement, erreur, formulaire rempli | pas du tout | 3 | élevé |
| `rapide-depense` | Saisie d'un achat (feuille de dépense) | modale | 285 | 3 | Firestore via StorageService ; Firestore via FinanceService / archives financières ; Gemini | chargé, vide, chargement, erreur, formulaire rempli | pas du tout | 3 | élevé |
| `rapide-matching` | Matching et contrôle des stocks (ancien flux de scan) | modale | 167 | 0 | props | chargé, vide, formulaire rempli | pas du tout | 1 | élevé |
| `modale-saisie-ancienne` | Saisie dépense du modal (ancien écran quick-expense) | modale | 322 | 0 | Firestore via StorageService | chargé, vide, formulaire rempli | pas du tout | 1 | élevé |
| `rapide-vente` | Enregistrer une vente | modale | 37 | 2 | Firestore via StorageService ; Gemini | chargé, erreur, formulaire rempli | pas du tout | 3 | élevé |
| `rapide-brassin` | Préparer un brassin (lancer depuis une recette) | modale | 303 | 3 | props | chargé, vide, erreur, formulaire rempli | pas du tout | 5 | élevé |
| `reglages` | Paramètres & Évolutions (réglages) | modale | 839 | 3 | Firestore via StorageService ; lecture réactive ; Google Drive ; Firebase Authentication | chargé, vide, chargement, erreur, formulaire rempli | pas du tout | 2 | élevé |
| `journal-audit` | Journal d'audit | modale | 242 | 1 | props | chargé, vide, chargement, erreur | pas du tout | 1 | faible |
| `config-cloud` | Cloud et IA (clé Gemini, Drive) | modale | 222 | 1 | localStorage : état d'interface ; localStorage : brouillon de recette ou préférences ; Gemini | chargé, chargement | pas du tout | 1 | élevé |
| `feuille-brassin` | Fiche d'un brassin (feuille : mesures, historique) | feuille | 613 | 3 | Firestore via StorageService | chargé, vide, erreur, formulaire rempli | pas du tout | 4 | élevé |
| `feuille-article-stock` | Fiche d'un article de stock | feuille | 182 | 1 | props | chargé, erreur, formulaire rempli | pas du tout | 4 | élevé |
| `feuille-nouvel-article` | Nouvel article (stock) | feuille | 70 | 0 | props | chargé, formulaire rempli | pas du tout | 3 | moyen |
| `feuille-correction-inventaire` | Corriger l'inventaire | feuille | 149 | 1 | props | chargé, vide, formulaire rempli | pas du tout | 3 | élevé |
| `feuille-fut` | Fût (fiche et création) | feuille | 234 | 1 | props | chargé, vide, erreur, formulaire rempli | pas du tout | 3 | moyen |
| `feuille-materiel` | Matériel (fiche et création) | feuille | 194 | 1 | props | chargé, vide, erreur, formulaire rempli | pas du tout | 2 | moyen |
| `feuille-idee` | Idée ou tâche de l'atelier R&D | feuille | 250 | 0 | props | chargé, formulaire rempli | pas du tout | 2 | faible |
| `feuille-tarif` | Tarif (nouveau, modifier) | feuille | 141 | 1 | props | chargé, erreur, formulaire rempli | pas du tout | 2 | moyen |
| `feuille-facture` | Facturer un client (feuille) | feuille | 61 | 1 | props | chargé, erreur, formulaire rempli | pas du tout | 2 | élevé |
| `feuille-client` | Client (modale : nouveau, modifier) | modale | 113 | 2 | props | chargé, erreur, formulaire rempli | pas du tout | 2 | moyen |
| `feuille-ecriture-detail` | Écriture (détail, modification) | modale | 463 | 2 | Firestore via StorageService ; Firestore via FinanceService / archives financières ; Google Drive | chargé, vide, erreur, formulaire rempli | pas du tout | 3 | élevé |
| `feuille-mouvement` | Avoir, remboursement, apport ou prélèvement privé | feuille | 54 | 2 | Firestore via StorageService ; Firestore via FinanceService / archives financières | chargé, vide, erreur, formulaire rempli | pas du tout | 2 | élevé |
| `feuille-projet-materiel` | Projet de matériel (feuille) | feuille | 90 | 0 | Firestore via StorageService ; lecture réactive ; Firestore via FinanceService / archives financières | chargé, erreur, formulaire rempli | pas du tout | 2 | moyen |
| `feuille-archives` | Les archives de la brasserie | feuille | 86 | 0 | Firestore via FinanceService / archives financières | chargé, erreur | pas du tout | 1 | élevé |
| `feuille-impots` | Préparer les impôts (clôture) | feuille | 168 | 1 | Firestore via FinanceService / archives financières | chargé, vide, chargement, erreur, formulaire rempli | pas du tout | 1 | élevé |
| `feuille-budget-brassin` | Budget du brassin (estimation) | feuille | 348 | 3 | Firestore via StorageService ; lecture réactive ; Firestore via FinanceService / archives financières | chargé, vide, erreur, formulaire rempli | pas du tout | 3 | moyen |
| `feuille-import-recette` | Coller une recette trouvée (feuille d'import) | feuille | 551 | 2 | Firestore via StorageService ; lecture réactive ; catalogue embarqué ; Gemini | chargé, vide, chargement, erreur, formulaire rempli | pas du tout | 4 | élevé |
| `feuille-cible-eau` | Cible d'eau de la recette | feuille | 235 | 0 | catalogue embarqué | chargé, vide, hors ligne, formulaire rempli | pas du tout | 4 | élevé |
| `feuille-recherche-fermentation` | Recherche sur la fermentation (synthèse et sources) | feuille | 50 | 1 | props | chargé, chargement, erreur | pas du tout | 1 | faible |
| `feuille-ranger-recette` | Ranger une recette / un brassin (menu de carte) | feuille | 61 | 0 | props | chargé | pas du tout | 3 | moyen |
| `feuille-comparer-recettes` | Comparer les recettes | feuille | 196 | 0 | props | chargé, vide | pas du tout | 2 | faible |
| `modale-brassin-modifier` | Modale « modifier un brassin » (EditBatchModal) **(non branché)** | modale | 457 | 0 | props | chargé, formulaire rempli | pas du tout | 1 | faible |
| `modale-article-modifier` | Modale « modifier un article » (EditStockItemModal) **(non branché)** | modale | 283 | 0 | props | chargé, formulaire rempli | pas du tout | 1 | faible |
| `modale-article-ajouter` | Modale « ajouter un article » (AddStockItemModal) **(non branché)** | modale | 263 | 0 | Firestore via StorageService | chargé, formulaire rempli | pas du tout | 1 | faible |
| `modale-confirmation` | Modale de confirmation générique (ConfirmModal) **(non branché)** | modale | 77 | 0 | props | chargé | pas du tout | 1 | faible |
<!-- /TABLEAU -->

## Ce que l'inventaire fait remarquer

- **Quatre modales ne sont importées par personne** : `modale-brassin-modifier` (457 lignes), `modale-article-modifier` (283), `modale-article-ajouter` (263), `modale-confirmation` (77), 1 080 lignes au total. À classer fini, inachevé récupérable ou inutilisable (CLAUDE.md) ; on ne supprime rien sans accord.
- **Un flux de saisie de dépense probablement mort dans `QuickActionModal.tsx`** : `rapide-matching` et `modale-saisie-ancienne` (l'ancien scan dans le modal). Le menu actuel ouvre `ExpenseSheet` avant que ce JSX ne soit atteint (ligne 604). Marqué « à confirmer en Chrome » : ce n'est pas vérifié par un parcours.
- **L'atelier Houblons V5.5 pèse plus de 8 000 lignes** (90 fichiers dans `src/ui/hopV55/`), reste atteignable depuis la fiche de recette, le brassin du jour et l'onglet Brassins, et n'est pas refait. Décision à prendre : le garder, le masquer ou le retirer du programme.
- **Le jour de brassage est le plus gros écran** (`page-brassin-du-jour`, plus de 6 000 lignes avec sa feuille de style de 2 600 lignes) et il est de cuverie, donc de haut usage et de haut risque : il demande de le découper par phases.
- **Écran « levure »** : son choix est ouvert dans le registre ; l'étape 4 de l'assistant et `hop-levure` n'y reçoivent rien tant qu'il n'a pas choisi (D123).
- **Données du dev local** : `?dev-local` initialise une graine locale (« Base initialisée avec 11 enregistrements »), jamais les données réelles. Les captures ci-dessous en viennent.

## Proposition d'ordre pour le programme

C'est une proposition ; le brasseur choisira. Critères : ce qu'il utilise le plus (PRODUCT.md), les dépendances entre écrans, la taille, le risque sur les données. Les vagues vont de ce qui est de cuverie et petit vers ce qui est de bureau et lourd en données ; un écran de lecture seule sert de contrepoint à un écran de saisie.

<!-- ORDRE -->
| Vague | Écrans | Pourquoi |
|---|---|---|
| 0, déjà fait | `etape-houblons`, `hop-ma-biere`, `hop-suggerer`, `hop-comparer`, `hop-dryhopper`, `hop-substituer`, `hop-fiche` | écrans choisis du registre ; `hop-levure` attend son choix |
| 1, l'assistant de recette, en commençant par l'écran que le brasseur veut refaire en premier | `etape-identite`, puis `assistant-recette` (coque : en-tête, fil, brouillon), `etape-fermentescibles`, `etape-paliers`, `etape-recap`, `etape-eau` | usage 5 et cuverie ; Identité est l'entrée la plus petite (75 lignes de zone), sans lien avec houblons, et sert d'essai au système ; la coque suit parce que tout le reste en dépend ; `etape-eau` en dernier parce qu'elle est lourde (1 622 lignes) et à risque élevé (doses de sels, analyse d'eau) ; `etape-levure` quand son choix sera fait |
| 2, un écran de lecture seule | `onglet-bord`, `notification-toast`, `bandeau-erreur-ecriture` | 366 lignes, risque faible, la première chose vue à l'ouverture : un second essai du système sur un écran sans saisie |
| 3, le cœur du métier | `brassins-recettes`, `page-recette`, `brassins-liste`, `feuille-brassin`, `rapide-brassin`, `page-brassin-du-jour` | usage 5 ; la fiche de recette dépend de l'assistant ; le jour de brassage en dernier, découpé par phases (plus de 6 000 lignes, risque élevé : minuteurs, relevés, déduction des stocks) |
| 4, le stock | `onglet-stocks`, `stocks-stock`, `feuille-article-stock`, `stocks-courses`, `feuille-nouvel-article`, `feuille-correction-inventaire`, `stocks-futs`, `stocks-materiel`, `stocks-houblons` | usage 4 ; risque élevé sur les quantités ; la sous-vue houblons est liée à la fiche déjà refaite |
| 5, les clients | `onglet-clients`, `clients-carnet`, `clients-tarifs`, `clients-impot-biere`, `feuille-client`, `feuille-tarif`, `feuille-facture` | usage 2, petits écrans ; la facture QR est à risque élevé |
| 6, la comptabilité | `onglet-finances`, `finances-synthese`, `finances-operations`, `finances-previsions`, `finances-annuel` et leurs feuilles | usage 3, volumineux, risque élevé (écritures, TVA, archives) : en dernier des écrans de saisie, quand le système est rodé |
| 7, la coque et les modales | `en-tete`, `barre-navigation`, `bouton-actions`, `recherche-universelle`, `rapide-menu`, `rapide-scan`, `rapide-depense`, `rapide-vente`, `reglages`, `config-cloud`, `journal-audit`, `compagnon-brasseur` | usage 5 mais partagés par tous les écrans : à reprendre quand les écrans qu'ils portent sont refaits, pour ne pas les redessiner deux fois ; `compagnon-brasseur` et `config-cloud` touchent Gemini facturé |
| Hors programme, à trancher | `atelier-houblons-v55`, `modale-brassin-modifier`, `modale-article-modifier`, `modale-article-ajouter`, `modale-confirmation`, `rapide-matching`, `modale-saisie-ancienne` | ancien ou non branché ; décider de garder, masquer ou retirer avant de refaire |
<!-- /ORDRE -->

Les deux écrans de la vague 1 et 2 forment un essai de deux genres (saisie et lecture) avant de s'engager sur les gros écrans.

## Captures de vérification (L12)

Prises à 390 × 844 dans l'app de production (commit `ae7c7a8d`, copie `atelier-ecrans`, `?dev-local`, drapeau `VITE_HOP_V4=on`), puis ouvertes en image. Trois écrans tirés au hasard (`finances-synthese`, `onglet-bord`, `brassins-volumes`) et l'étape Identité en plus. Dossier : `work/missions/2026-10-31-systeme-ecrans/voies/e2-inventaire/captures/`. Le script : `capturer.mjs`, dans le même dossier ; la procédure et les constats sont dans `RESULTAT.md` de la voie.
