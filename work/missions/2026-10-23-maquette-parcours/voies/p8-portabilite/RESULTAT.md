OK — maquette portable : moteur relatif sans process.env, données injectées, conversion testée, navigation en pile

## Bloquants, un par un

- **B1 (navigation)** — fait. `parcours/src/coquille/useFullScreenRoute.ts` : l'extension en pile de
  `src/pages/useFullScreenRoute.ts`, même API (`route`, `open`, `close`) plus `pile`, `closeTo`, `replaceTop`.
  `popstate` dépile un niveau (la route est dans l'entrée d'historique) ; une entrée sans route (fiche posée sur
  Dryhopper) garde la pile. `navigation.tsx` n'est plus qu'une couche : `aller/retour/revenirMaBiere` = `open/close/
  closeTo`, et le hash des pages construites à part (`adresse`, `hashchange`). Écrans inchangés. Reste : remplacer le
  crochet de l'app au portage et rejouer ses retours existants (recette, brassage, assistant, `hopV55`).
- **B2 (données en singleton)** — fait à l'entrée de l'adaptateur. `parcours/src/moteur/donnees.ts` :
  `DonneesParcours { catalogue, stock, degustation, alphaDuLot }`, `configurerDonnees()` (vide les caches de
  l'adaptateur), défauts = fixtures actuelles. L'adaptateur lit le stock injecté (Suggérer, stock libre, α du lot),
  la dégustation injectée (ou aucune : profil tout simulé), filtre Suggérer et Substituer par le catalogue injecté.
  Reste en singleton dans le moteur : `CATALOGUE`, `STOCK`, `ENGINE_DATA`, `hopRef` et leurs caches ; le chemin pour
  l'enlever (fabrique `creerMoteur(donnees)`, ~90 sites) est dans ARCHITECTURE.md « ## Données injectées ».
- **B3 (process.env)** — fait. `src/engine/temoin.ts` (variable de module) ; `tests/temoin.ts` la pose depuis
  `V4_TEMOIN_NEGATIF`, importé en tête des 10 fichiers de test. Les trois témoins mordent encore :
  `bande` → ENGINE-V4 FAIL (5 tests), `substitution` → FAIL (10), `tolerance` → FAIL (4). `scripts/check-engine.mjs`
  inchangé (hors de mon périmètre ; il transmet déjà l'environnement à Vitest).
- **B4 (alias)** — fait. Les 6 fichiers du moteur (`data.ts`, `families.ts`, `hops.ts`, `recipe.ts`, `voies.ts`,
  `pack/buildPack.ts`) importent `../../../../src/…` et `../../../../functions/src/…`. Les configurations (prototype
  et racine) n'ont pas changé ; les alias de `parcours/` (Cadres, index des communs, écran biere) restent pour l'UI
  de l'app, hors du contrôle `--alias`.
- **B5 (conversion, deux IBU)** — fait. `parcours/src/integration/conversion.ts` : `toHopRecipe` (id `a1…`, α du lot,
  moments, DI d'ébullition, suppositions écrites) et `versPatch` (patch de `hops` et `yeast` seulement, ajout inchangé
  rendu tel quel), `appliquerPatch`. L'adaptateur prend l'α du lot (`alphaLot`), la durée et la température de
  whirlpool de la recette, et rend l'IBU inconnu quand le moment ou la DI manquent (comme `hotBitterness`). Tests :
  `tests/conversion-recette.test.ts`, 13 tests, sur 5 recettes de fixture de l'app (monSuperStout, companionRecipe,
  yeastFlowRecipe, fullRecipe, fruty).
- **B8 (work/)** — fait. `data/jetons-familles.json`, `data/comparatifs-dryhop.json` (copies octet pour octet),
  `data/pictos-familles.svg` (le jeu de symboles extrait tel quel de la planche ; `Pictos.tsx` l'importe, plus de
  découpage de chaîne). Copiés par `data/copies-de-work.mjs --ecrire` ; `tests/copies-de-work.test.ts` échoue si une
  copie s'écarte de sa source. Seules les lignes d'import de `comparer/valeurs.ts` et `dryhopper/mesures.ts` ont
  changé dans les écrans.
- **Crochet de test** — `parcours/src/integration/crochetTest.ts` (`useCrochetTest`, type `VueParcours`, forme
  inchangée) ; constante `MAQUETTE` pour la maquette, `import.meta.env.DEV` dans l'app. Forme dans ARCHITECTURE.md.
- **Performance** — préchauffage au repos (`moteur/prechauffage.ts`, appelé par `Coquille.tsx` sur Ma bière : voies de
  Suggérer et remplaçants, mêmes appels que les écrans, journalisés `prechauffage:<nom>`), formateurs `Intl` mis en
  cache (`engine/pouvoir.ts`, `commun/nombres.ts`). Mesuré (`mesure-performance.mjs … ma-biere --cpu=4`) : toucher
  froid → Suggérer **798 → 288 ms** (moteur 497 → 0), → Substituer **728 → 184 ms** (moteur 546 → 13). Le budget
  « toucher ≤ 100 ms » reste dépassé (PERF ECHEC, 1 dépassement : le rendu de l'écran, 93 à 118 ms à chaud). Ce qui
  part en worker dans l'app : ARCHITECTURE.md « ## Performance ».
- **ARCHITECTURE.md** — réécrit : vrais dossiers (`src/ui/hopIndex/`, `src/domain/hopIndex/`, `src/domain/hopIndex/v4/`
  neuf et justifié), navigation réelle, `## Données injectées`, `## Conversion de recette`, `## Crochet de test`,
  `## Performance`, ordre d'intégration avec ce qui reste au brasseur (thème B7, atelier V5.5 B6, Dryhopper,
  Substituer, Levure). ENGINE.md : témoin et imports relatifs.

## Écart d'IBU entre la conversion et l'app
- Même DI d'ébullition (celle de RecipePage, `yeastRecipeBoilOg`) : écart **0** (≤ 1e-9 IBU, ajout par ajout) sur les
  quatre recettes de fixture ; dry hop : 0 dans l'app, `null` (« à froid : non modélisé ») dans le moteur.
- Sans elle (DI de recette) : session NEIPA + 1,5 kg de mangue en fermentation, moteur **15,86** (DI 1,034) contre page
  **16,59** (DI d'ébullition 1,029) : **−0,73 IBU**. Raison : la DI plus haute isomérise moins (Tinseth) ; la conversion
  l'écrit en supposition et accepte `boilOg`.
- α inconnu (α ≤ 0) : IBU `null`, raison « α du lot inconnu », listé dans `ibu.inconnus` ; jamais 0. DI inconnue : IBU à
  chaud `null`, jamais calculé sur 1,050.

## Sorties des critères (rejouées à la fin)
- G1 `SANS PROCESS OK` · G2 `IMPORTS RELATIFS OK` · G3 `SANS WORK OK` — 1 essai chacun (G1 : 2, mon commentaire citait
  « process.env »).
- G4 `ENGINE-V4 OK (127 tests)` (113 avant + copies + conversion) — 1 essai.
- G5 `CONVERSION OK` (13 passed) — 2 essais (attente du `dayOffset` corrigée : l'outil pose J+2 en actif).
- G6 `TYPES OK` · G7 `CONSTRUIT OK (9 pages)` · G8 `PONTS OK (19 gestes, recalcul médian 0,3 ms)` — 1 essai.
- G9 `CHOIX OK (5 écran(s) conforme(s) à son choix ; 3 ouvert(s) …)` · G10 `APP INTACTE OK` — 1 essai.
- G11 `NOTE OK` · G12 : ce fichier.
- En plus : `TEINTE OK 5/5`, `PARCOURS OK (31 gestes à 390, 31 à 1280)`, `ROUTES OK (8/8)`, `ETAPE OK` pour les 8
  écrans, `COPIES OK (3)`.
- Rien ne bouge à l'écran : instantané du DOM (`body.outerHTML` et `innerText`) des 14 pages construites à 390 et
  1280 px, avant et après chaque étape (B3/B4/B8, B1, B2, performance) : **identique** octet pour octet (script
  dans le scratchpad de la session, hors dépôt). Aucune capture regardée : rien de visible n'a changé, la preuve est
  le DOM identique.

## Fichiers écrits
- Moteur : `prototypes/houblons-v4/src/engine/temoin.ts` (neuf), `data.ts`, `families.ts`, `hops.ts`, `recipe.ts`,
  `voies.ts`, `substitution.ts`, `tolerance.ts`, `pouvoir.ts`, `src/style/scale.ts`, `src/pack/buildPack.ts`.
- Données : `prototypes/houblons-v4/data/copies-de-work.mjs`, `jetons-familles.json`, `pictos-familles.svg`,
  `comparatifs-dryhop.json`.
- Tests : `tests/temoin.ts`, `tests/conversion-recette.test.ts`, `tests/copies-de-work.test.ts`, une ligne d'import
  dans les 8 fichiers existants.
- Maquette : `parcours/src/coquille/useFullScreenRoute.ts` (neuf), `navigation.tsx`, `Coquille.tsx` ;
  `parcours/src/moteur/donnees.ts`, `prechauffage.ts` (neufs), `index.ts`, `mesure.ts` ; `parcours/src/etat/types.ts`,
  `quand.ts`, `operations.ts`, `EtatParcours.tsx` ; `parcours/src/commun/familles.ts`, `Pictos.tsx`, `nombres.ts` ;
  `parcours/src/integration/conversion.ts`, `crochetTest.ts` (neufs) ; lignes d'import de
  `ecrans/comparer/valeurs.ts` et `ecrans/dryhopper/mesures.ts`.
- `parcours/ARCHITECTURE.md`, `prototypes/houblons-v4/ENGINE.md`, ce RESULTAT.md.

## Doutes et limites
- B2 n'est fait qu'à l'entrée de l'adaptateur : `substitutes` et `proposeVoies` classent encore « en stock d'abord »
  avec le stock du moteur ; un stock injecté différent donne un classement sur l'ancien stock (le filtre et les
  grammes, eux, suivent le stock injecté). Non testé avec un stock injecté différent dans Chrome.
- Le préchauffage tourne sur le fil principal (une tâche de 100 à 150 ms à ×4 par moment de repos) : un toucher qui
  tombe pendant une tâche l'attend. Dans l'app : un worker.
- Le patch d'un houblon neuf sans α de lot au stock écrit `alpha: 0` (la convention « inconnu » de l'app, que
  `hotBitterness` traite comme manquant) : voir la décision.
- `placer` pose le jour de début de l'outil (actif J+2, après J+7) : un dry hop déplacé dans Dryhopper écrase le
  `dayOffset` de l'app. C'est ce qui a été simulé ; à confirmer au portage.
- Correspondance de houblon par nom exact plié (« Nuget » du rapport n'est relié à rien : arôme non simulé, IBU calculé
  par l'α du lot) ; aucune correspondance de levure par souche.
- `npm run typecheck` du prototype (moteur + tests) n'a pas été rejoué ; `verifier-types.mjs` (parcours) est vert.

DÉCISION À PRENDRE : un ajout neuf (Idaho 7 placé par un outil) dont le lot n'a pas d'α connu : que porte
`HopIngredient.alpha` (type `number` obligatoire) ? Options : (a) 0, convention actuelle de l'app pour « inconnu »
(fait ici, dit dans `notes`) ; (b) rendre `alpha` facultatif dans l'app (`alpha?: number`), l'inconnu devient absent ;
(c) le milieu de la plage variétale, marqué estimé. Recommandation : (b) au portage (inconnu ≠ 0), (a) d'ici là.
Décideur : pilote (type de l'app, porte B).

CONNAISSANCE : la maquette se porte par déplacement : moteur v4 sans alias ni `process.env`, données injectées par
`configurerDonnees`, conversion `toHopRecipe`/`versPatch` qui rend l'IBU de `hotBitterness` à 1e-9 avec la même DI
d'ébullition, navigation en pile sur l'API de `useFullScreenRoute` ; préchauffer au repos fait passer les touchers
froids Suggérer et Substituer de 798/728 ms à 288/184 ms (×4) (`parcours/ARCHITECTURE.md`).

LEÇON PROPOSÉE : prouver « rien ne bouge à l'écran » par un instantané du DOM (outerHTML de chaque page construite,
deux largeurs) pris avant toute modification et comparé après chaque étape : un contrôle de choix vert ne voit pas un
nombre changé dans un texte, le diff si. Rôles : auteur, relecteur.
