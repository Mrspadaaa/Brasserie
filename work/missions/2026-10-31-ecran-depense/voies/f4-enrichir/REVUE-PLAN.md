# Revue du plan f4-enrichir, triée par le pilote (01.11)

Deux relecteurs neufs (Sonnet) en parallèle. Leurs revues complètes, avec les preuves : `REVUE-conception.md`, `REVUE-pret.md`.
Le constat est résumé ici, la preuve est là-bas. Les deux revues trouvent le même bloquant (conception n° 1 = prêt n° 1).

## Décisions du pilote (réversibles), à écrire au plan corrigé
- **P1. Une valeur trouvée en ligne n'est jamais une donnée lue.** Pour le rapprochement des lignes (`donneesDArticle`, `porteDonneeS6`,
  `connuesUnSeulCote`, D215), une valeur dont `fiche.remplis[champ].par === 'en-ligne'` compte comme absente ; une fiche posée par f4
  (levure comprise) ne fait pas passer `porteDonneeS6` à vrai. f4 écrit pour cela une fonction pure (`valeurLueDe(item, champ)` ou de même
  forme) dans un de ses fichiers ; **le pilote la branche** dans `src/services/stockLineMatching.ts` (fichier que l'écran f3 peut aussi
  toucher : un seul écrivain). Tests rouges d'abord : (a) EBC trouvé 24, 2ᵉ facture imprime 25 → même article, pas de « bis » ;
  (b) ligne sans EBC → pas d'« incertain » neuf ; (c) levure enrichie, 2ᵉ dépense → même article.
- **P2. Dans une recette, une valeur trouvée en ligne sert, mais jamais sous l'origine `personal`.** Elle remplit le trou (c'est le but de
  sa demande du 31.10 : « remplir la fiche du nouveau produit »), avec l'origine `ai` qui existe déjà (`src/domain/ingredientFacts.ts:120,
  156, 273`) tant qu'il ne l'a pas vue. f4 reçoit `src/domain/ingredientFacts.ts`, **la seule fonction `factsFromStock`** (≈ l. 640), avec
  un test ; rien d'autre de ce fichier ni du moteur.
- **P3. Une fiche par produit ; la clé de fiche n'a ni EBC ni origine.** `cle = famille|fabricant|mots`. L'EBC lu, l'α et l'origine sont des
  données de l'article (D215 les garde : elles font le « bis »), pas de la fiche. Un « bis » partage la fiche de son produit (COMMUN.md :
  « lié à la fiche du produit […] Une seule fiche par produit »), donc aucune seconde recherche. Un trou d'un « bis » rempli depuis la fiche
  est `repris` ; une valeur lue de l'article n'est jamais remplacée. Comparaison de deux libellés composante par composante (fabricant,
  mots) : inconnu d'un côté = `proche` (jaune) ; connu des deux côtés et différent = `autre`. Un nom générique (sans fabricant des deux
  côtés) ne reçoit aucune valeur d'un autre article. Tests : « Cascade US » puis « Cascade CH » (une fiche de variété, 0 appel) ;
  « Münchner Malz » 20 EBC puis son « bis » 15 EBC (une fiche, un appel au plus, l'EBC lu de chacun gardé) ; « Carahell » contre
  « Weyermann Carahell » (proche, jaune) ; « Pilsner Malz » contre « Pilsner Malz Castle » (proche, aucune valeur recopiée).
- **P4. Interrupteur.** L'exécutant réel n'est construit que si `VITE_ENRICHISSEMENT_IA` vaut `emulateur` (et les émulateurs sont la cible)
  ou `production` (valeur distincte, son accord). Toute autre valeur, ou absente : `ia-eteinte`. Lu à l'appel, avec une injection
  `setEnrichissementIA()` pour les tests. Test : allumé sans exécutant injecté en test → échec du test, aucun appel.
- **P5. Branchements.** Le pilote pose les points d'appel (`purchaseEntry.ts`, `ExpenseSheet.tsx`, `App.tsx`, `stockLineMatching.ts`,
  `storage.ts` `learnIngredient`) ; f4 donne pour chacun la ligne exacte et le code d'une ligne. `planifierEnrichissement` ne lève jamais.
  Le branchement attend l'accord de schéma (aucune clé neuve n'est écrite sur ses données sans lui) ; le code et ses tests se font tout de
  suite.
- **P6. Le parcours émulateurs.** f4 reçoit les **ajouts** à `scripts/check-invoice-journey-emulator.mjs` pour un cas neuf `enrichir`
  seulement (réponse `lookupIngredient` fixée pour un malt et une levure, compteur d'appels, `VITE_ENRICHISSEMENT_IA=emulateur` pour ce
  cas) ; les cas existants (doc14 et les autres) ne changent pas d'un octet de comportement, et le pilote les rejoue.

## Conception

| n | Gravité | Constat (preuve) | Correction attendue | Sort | Raison |
|---|---|---|---|---|---|
| 1 | bloquant | Une valeur trouvée écrite dans `colorEbc` / `potentialPpg` est lue comme lue par `donneesDArticle` (`stockLineMatching.ts:399`), `ecartsEntre`, `connuesUnSeulCote`, `porteDonneeS6` (`:180`) : « bis » forcé ou « incertain » neuf ; `factsFromStock` la range `personal`. § 5 « aucune règle ne change » est faux. | Auditer les lecteurs ; une valeur trouvée n'est jamais une donnée lue ; tests rouges ; décider l'usage en recette ; corriger § 5. | corrigée | P1 et P2 ; le plan corrigé liste chaque lecteur de `colorEbc`, `potentialPpg`, `yeast*`, `fiche` (grep) et ce qu'il fait d'une valeur `en-ligne`. |
| 2 | majeur | `learnIngredient` (`storage.ts:730-763`, nom exact) crée `FICHE-<cat:nom>` à côté d'un article f4 : deux fiches du même produit ; le cache `reponses` n'est pas lu par « Compléter avec l'IA ». | `ficheRetenueDe(nom, catégorie, stock)` pure, branchée par le pilote dans `learnIngredient`, test ; sinon réécrire E4. | corrigée | Première option : c'est « Attention au mapping ». Test « article f4 + `learnIngredient('Carahell')` → aucun `FICHE-…` ». |
| 3 | majeur | `cleProduit` mêle fabricant, origine et EBC, `memeProduitDeFiche` ne compare que les mots : cas d'un seul côté connus non dits. | Comparaison composante par composante ; nom générique sans recopie ; tests. | corrigée | P3 (la clé perd EBC et origine ; restent fabricant et mots). |
| 4 | majeur | `fiche` : sort d'une fiche s6 approchée, espace d'identifiants (levure), `nomDeFiche`, fusion Firestore (`aControler` jamais retiré, `deleteField()`). | Ne jamais écraser `fiche.id`/`approchee` posés ; préfixe de famille ; `aControler` booléen ; `nomDeFiche` apprend la levure ou « fiche liée » dit. | corrigée | Comme demandé ; `fiche.ts` est à f4 (`src/domain/stock/fiche*.ts`). |
| 5 | majeur | PPG et EBC peuvent être **calculés** par le modèle (`prompts.ts` ~900 : « PPG ≈ rendement × 46 ») et présentés « trouvés ». | Indicateur `deduit` avec sa règle ; reste `repris` jusqu'à « Vu » ; sans rendement publié, rien. | corrigée | COMMUN.md : « déduite avec sa règle ; jamais présentée comme lue ». |
| 6 | majeur | Hors ligne : `documentWriteState` en mémoire (`firestoreRepo.ts:92`), `unknown` après rechargement lu comme sûr ; échec réseau compté ; quota lu par le texte (`aiClient.ts:153`). | Attendre `waitForDocument` (comme `proofQueue.ts:205`) ; échec réseau non compté ; texte verrouillé par un test ou code stable. | corrigée | `unknown` n'est jamais « prêt ». Le texte du quota est verrouillé par un test (pas de code d'erreur neuf côté serveur dans f4). |
| 7 | majeur | Plafond compté avant l'appel, local ; aucun état « plafond » au résumé ; coûts non mesurés. | `plafond` au résumé ; seuls les appels arrivés au serveur comptent ; constantes `ESTIMATION`, jamais montrées comme un coût. | corrigée | Comme demandé. |
| 8 | majeur | Variable de build allumée sans émulateur → `aiTask` de production ; le parcours n'intercepte que `127.0.0.1:5001`. | Exécutant réel seulement avec la cible voulue ; test ; bloquer tout `aiTask` non intercepté. | corrigée | P4 et P6. |
| 9 | majeur | Le travail ne capture pas les champs de la ligne (fournisseur, référence, α, origine, EBC lus) ; rapprochement sur l'article relu. | Liste des champs capturés ; rapprochement sur eux ; test « article renommé → même fiche ». | corrigée | Comme demandé. |
| 10 | majeur | La 2ᵉ dépense relie d'ordinaire l'article existant ; le vrai second travail vient d'un « bis » ou d'un libellé non reconnu ; une clé avec EBC paie une seconde recherche. | Dire si deux « bis » partagent la fiche ; tests « Cascade US puis CH », « Münchner 20 puis bis 15 ». | corrigée | P3 : ils la partagent. |
| 11 | détail | Un travail `abandonne` par rejet doit se réarmer au rejeu réussi (`purchaseEntry.ts:505`). | Ligne au plan, test. | corrigée | Comme demandé. |
| 12 | détail | `vu` unique : une valeur trouvée après « Vu » serait comptée vue. | Comparer `remplis[champ].le` à `vu`. | corrigée | Comme demandé ; T4 l'ajoute. |
| 13 | détail | `put` merge sur un article supprimé entre lecture et écriture : fantôme possible. | Relire dans la même tâche, ou `waitForDocument` ; R3 avec suppression entre les deux. | corrigée | Comme demandé. |
| 14 | détail | « Autres » (sels, acides, clarifiants…) écartés sans le dire comme choix. | Le mettre en § 7 ou l'écrire choix prudent. | acceptée | Choix prudent et réversible : aucun champ de `StockItem` ne les porte aujourd'hui ; écrit au § 7 comme portée, une voie suivante s'il le demande. |
| 15 | détail | Houblon hors catalogue : le rouge doit être une donnée d'état codée, pas un texte. | `niveauxDeFiche` rend un motif codé (`horsCatalogue`, `alphaAbsent`). | corrigée | Comme demandé. |

## Prêt à coder

| n | Gravité | Constat (preuve) | Correction attendue | Sort | Raison |
|---|---|---|---|---|---|
| 1 | bloquant | Même mécanisme que conception n° 1 : EBC trouvé 24, facture suivante 25 → écart `ebc` (`donnees.ts:13,107`) → « bis » ; `porteDonneeS6` (`stockLineMatching.ts:180`). | Décision au plan ; la valeur trouvée hors de la comparaison D215 ; tests (a) et (b) ; § 5 corrigé. | corrigée | P1 ; la fonction pure est à f4, le branchement dans `stockLineMatching.ts` au pilote. |
| 2 | majeur | Le parcours émulateurs ne rejoue que `scanInvoice` (`check-invoice-journey-emulator.mjs:307`), `viteEnv` (`:1806-1812`) sans la variable, script sans propriétaire. | Modifications exactes ; qui possède ; comment « un seul appel » et « une fiche » se vérifient. | corrigée | P6. |
| 3 | majeur | `tests/unit/depense/fiche/fiche.test.ts:81-85` refuse `firebase`, `functions/`, `fetch(`… dans `src/domain/stock/`. | Contrainte écrite, ou déplacer `ficheRemplir.ts`. | corrigée | Le plan choisit et le dit ; le test de garde reste vert sans être modifié. |
| 4 | majeur | `localYeastFacts` tire `yeastReferences` et `yeastCatalogueLibrary.json` (1,4 Mo) en statique. | Imports dynamiques nommés ; taille du morceau App avant et après dans RESULTAT. | corrigée | Comme demandé. |
| 5 | majeur | `localYeastFacts(YeastSpec, knowledge)` re-résout par `resolveFermentationYeast` et refuse `localDocumentary`. | Appel exact écrit, testé sur les 4 levures de 372765. | corrigée | Comme demandé. |
| 6 | majeur | `ficheLevureDe` : normalisation non spécifiée (™, marques, U+2011, `productCode` nul pour Windsor et Verdant). | Fonction de normalisation des deux côtés, jetons entiers, tableau de 10 cas. | corrigée | Comme demandé. |
| 7 | majeur | Formes de données absentes : `Travail` et ses transitions (aucun `fait`), contrat du magasin, `RechercheFiche`, `kind` du sucre, `manquant` en libellés français, compteur du résumé. | Interfaces TypeScript et automate au plan. | corrigée | Comme demandé ; `manquant` réutilise les libellés existants (`ingredientFacts.ts:681-720`). |
| 8 | majeur | Interrupteur évalué au chargement du module : T5 ne peut tester éteint et allumé. | Lecture à l'appel ou `setEnrichissementIA()`. | corrigée | P4. |
| 9 | majeur | Branchements sans lignes exactes (`purchaseEntry.ts:514` dans un `try` qui efface la preuve, `:530` à scinder ; `ExpenseSheet.tsx` monté à 3 endroits ; `App.tsx:328`). | Emplacements exacts ; `planifierEnrichissement` ne lève jamais. | corrigée | P5. |
| 10 | majeur | Fiche s6 `approchee` non traitée ; id de levure → `nomDeFiche` `undefined` (`fiche.ts:67-70`). | Sort de la fiche approchée ; `approchee` et `aControler` ensemble ; test `phraseFiche` avec un id de levure. | corrigée | Même correction que conception n° 4 : une fiche approchée posée est gardée, f4 ne comble que ses trous et marque `aControler` s'il trouve mieux. |
| 11 | majeur | Décompte faux (24 fichiers `tests/unit/depense/` + `purchaseEntry.test.ts` + 3 d'intégration dont `jus0Journey`) ; mocks complets de `purchaseEntry`. | Décompte et noms ; test feuille montée avec `purchaseEntry` mocké ; liste des fichiers rouges de la base. | corrigée | Comme demandé. |
| 12 | détail | T2 importe `enrichissement.ts` absent : échec au chargement. | Partie « avant » sur le seul `savePurchase`, import dans un fichier à part. | corrigée | Comme demandé. |
| 13 | détail | Redémarrage hors ligne : état `unknown`. | Cas écrit et testé. | corrigée | Même correction que conception n° 6. |
| 14 | détail | T3 : la 2ᵉ ligne est d'ordinaire reliée ; construction du cas non dite. | `stockAction: 'new'` forcé, plus le cas D215 réel. | corrigée | Avec P3. |
| 15 | détail | Chemins sans préfixe, lignes décalées (`fiche.ts:61`, `adaptYeastLookupResult` à `ingredientFacts.ts:116`). | Chemins complets, lignes corrigées. | corrigée | Comme demandé. |

## Suite
f4 corrige `PLAN.md` (rien d'autre) et rend `PLAN CORRIGÉ — <n> défauts`. Un relecteur neuf relit le plan corrigé sur les deux bloquants
seulement ; puis f4 code (temps 2). Possède du temps 2 : celui du plan, plus `src/domain/ingredientFacts.ts` (`factsFromStock` seul, P2),
`src/domain/stock/fiche.ts` (déjà à f4), les ajouts du cas `enrichir` de `scripts/check-invoice-journey-emulator.mjs` (P6).
