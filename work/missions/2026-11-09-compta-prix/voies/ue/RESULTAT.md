OK en partie — c7c (Prix) et e3a (Argent) portés, tests et build verts ; captures 390 clair ouvertes, série complète et vue Argent à confier à un exécutant

## Fichiers écrits (Possède)
- **Neufs** : `src/ui/prix/{calculPrix.ts, donneesPrix.ts, geometrie.ts, GraphePrix.tsx, PrixEcran.tsx, ChaineArgent.tsx, prix.css}` ; `tests/unit/prixCalcul.test.ts` (12), `tests/unit/prixGeometrie.test.ts` (5), `tests/integration/prixEcran.test.tsx` (11).
- **Modifiés** : `src/types/index.ts` (`PricingItem` : `biere?`, `format?`, `emballageUnite?`, champs de coût hérités devenus optionnels), `src/ui/TarifSheet.tsx` (refait : « Changer le prix »), `src/components/tabs/ClientsTab.tsx` (rail Carnet · Prix · Impôt bière ; Prix = `PrixEcran` ; Impôt bière de l'année refait), `src/ui/BatchDetailSheet.tsx` (rubrique Argent ; `BrewBudgetButton` et `ImpotBiereLien` retirés du Dossier), `src/components/CreativeLabTab.tsx` (le calculateur « Essais de tarifs » sort ; la liste des idées de tarif reste).
- **Tests réécrits** (ils décrivaient l'ancien écran) : `compactClients`, `bDiversClients`, `bDiversImpot`, `impotBiereClients`, `impotBiereLien`, `batchStockFollowUp` (une assertion), `rxPrixInconnu`, `rejeu-73db`. BE-98 (plafond 10 000, vide ≠ 0, raison du refus) est **déplacé sur le champ prix sans être affaibli** : `rejeu-649b` et `rejeu-ff0f` passent tels quels.
- `voies/ue/` : `PLAN.md` (§ 12 : sort de chaque constat des deux revues), `tests-head.txt`, `tests-rouge.txt`, `tests.txt`, `build.txt`, `capturer-prix.mjs`, `captures/`.
- `CreativePricing.tsx` : **retiré du parcours, non supprimé** (plus aucun import ; son test BE-26 reste vert) : à supprimer sur ton accord.

## Sorties décisives
- **HEAD d'abord** (`tests-head.txt`) : 46 fichiers, 465 tests verts.
- **Rouge réel** (`tests-rouge.txt`) : `prixCalcul` contre un module qui rend `null` : 12 tests en échec **sur les valeurs** (2,52 ; 3 636 ; 41 ; ≤ 5,03…), pas sur l'import.
- **Vert** : `prixCalcul` 12/12, `prixGeometrie` 5/5, `prixEcran` 11/11, `compactClients`, `bDiversImpot`, `impotBiereClients/Lien`, `rxPrixInconnu`, `rejeu-*`, `batch*` verts (dernier rejeu groupé : `tests.txt`, 497 tests : 483 verts, 14 en échec, **aucun de mon périmètre** : voir ci-dessous).
- **Les 14 échecs viennent d'autres voies du même arbre** : `financeWorkspace` (6), `financeArchives` (3), `equipmentProjects` (3, verts quand rejoués seuls), `mobileDailyViews` (1) : `Failed to resolve import "./operations.css"` (voie uo en cours) et boutons en double de la synthèse ; `brewBudgetSheet` (1) : `BrewBudgetSheet.tsx` modifié par une autre voie (« Found multiple elements with the role status », `cbf-raison`). **À rejouer quand ces voies ont fini.**
- `npx tsc --noEmit` : 2 erreurs `firebase-admin/firestore` (poste) + 1 dans `src/ui/finance/synthese/Lignes.tsx` (autre voie) ; **aucune dans mes fichiers**.
- `npx vite build` (sortie dans `%TEMP%`) : `built in 15.05s`, 0 erreur.

## Ce que le code fait (règles du pilote)
- **Les nombres viennent du domaine** : `coutFormat`/`troisNotions`/`coutLitre` (d1), `baseImpot` (up, même réduction et même taux que p2b), `estimerBrassinsPlanifies` (d2, encart Prévisions). `calculPrix.ts` ne fait que lire un prix contre ce coût ; le reste se soustrait au coût **affiché** ; l'annuel = reste affiché × unités (9 162,72 comme la maquette).
- **Emballage de l'unité** : champ du tarif (« Emballage d'une unité », vide = à compléter) ; vide → coût « ≥ », reste « ≤ », jamais exact ni 0 (testé). Le repli « poste du brassin ÷ unités » est écarté.
- **La bière = le nom de la recette**, pas du lot ; le brassin du coût = celui d'où l'on vient (Argent), sinon le plus récent chiffré (testé sur deux lots).
- **Tarif ancien sans format** : lisible (format lu du libellé, comme la caisse), signalé « À compléter » sous les tuiles, la feuille l'invite à choisir bière et format ; ses champs de coût hérités ne sont jamais effacés (testé).
- **Journal** : mes enregistrements passent par `saveTarifs` + `logAction` sans « marge » : plus de « marge  % » dans le journal immuable (testé).
- **Échelles** : deux jeux de crans 1-2-5 sur un axe commun (0 · 5 k · 10 k · 15 k à 5 000 ÷ 3 636 de haut), `graduations` de pv importée, pas de copie.

## Écarts à c7c / e3a, à lister pour le pilote et le brasseur
1. **Rangement (D1)** : e3a dit « Clients ne garde que ses clients » ; Clients garde ici Prix et Impôt bière (c7c dessinée dans Clients), Argent est la 2e porte. Rien n'est retiré (réversible).
2. **Fiche du brassin** : la maquette montre « Recette · Déroulé · Argent » ; la fiche réelle a « Mesures · Carnet · Dossier » : **Argent est une 4e rubrique**.
3. **Chiffres** : fût ≤ **27,58** (et ≤ 1 654,80 par an), pas 27,54 de la maquette (elle arrondit le litre avant de multiplier ; d1 ne le fait jamais) ; 75 cl ≤ 5,03 et 8 048,00 identiques. Mince « ⅓ ex. » est une constante marquée exemple.
4. **Séparateur** : espaces fines comme la maquette (« 9 162,72 »), via `montantChf` (fr-FR), pas l'apostrophe de fr-CH.
5. **Ajouts hors maquette** : menu de bière (≥ 2 bières), ligne « À compléter » (tarifs sans format), pli « Comprendre le calcul », ligne sous la barre « 81 bouteilles · vendu · reste », texte « Il te manque » si le reste est négatif, « volume annuel à renseigner », « coût ? » + explication si le coût du litre est incomplet. « N formats sans marge » **supprimée** (fonction listée : elle pointait vers une vue disparue).
6. **Fonctions de l'ancien listées** : recherche par produit et filtre « Sans marge » (disparus : un tarif = bière × format) ; coût saisi à la main (Ingrédients, Charges fixes) disparu (problèmes 3, 4, 18) ; essais de tarifs (problème 19) ; tableau des tarifs.
7. **Argent** : les marches ③ et ⑤ ne s'ouvrent pas (elles portent le segment de format et la bascule) ; ①, ②, ④, ⑥ ouvrent c3a, p2b et le Prix en feuille.
8. **Rail de Clients** : « Carnet · Prix · Impôt bière » (libellés et ordre de la maquette ; la valeur mémorisée `clients_subtab` est inchangée).
9. **Clients › Impôt bière de l'année (D2, « à dessiner » pour le brasseur)** : total = somme des feuilles p2b (« ≥ » si une densité manque, « ~ » si visée), liste par brassin, plis gardés ; l'ancienne « Réserve » (fourchette) n'est plus affichée. Aucune forme inventée.
10. **Crans de la règle** : prix de vente réels (lignes `vente:`, ≤ 2), jamais 4,50 / 6,00 en dur ; sans vente (démo) : aucun cran, comme le disent les revues.

## Captures (clair 390, ouvertes)
`captures/clair-390-prix-repos.png` et `clair-390-prix-an.png` ouvertes : très proches de `c7c-page.png` (tête 2,52 / 9 162,72, bascule, deux échelles, bulle +363,60, règle, ligne brassin 41 / 40, tuiles). Défauts vus : (a) le lien « 7,51 CHF/L › » recouvrait « coût 2,48 » et le « 7,28 » de l'axe → **corrigé** dans le code (position 37 %, 20 px) ; (b) le haut de l'axe tombait sur 7,28 (pv a changé `graduations`) → **corrigé** (`hautNice`). **Ces deux corrections ne sont pas revues en capture : à rejouer.** Constaté sans lien avec la voie : la bulle « Compagnon hors connexion · mode local » recouvre un instant les boutons du bas.

## DEMANDE EXECUTANT
Serveur : `http://localhost:3000` doit servir ce worktree (200 sur `/src/ui/prix/PrixEcran.tsx` à l'instant).
1. `node work/missions/2026-11-09-compta-prix/voies/ue/capturer-prix.mjs clair-390 cave-390 clair-1280 cave-1280` → attendu `{"manques":[],"erreurs":[],...}` et 28 fichiers `captures/<thème>-<largeur>-{prix-repos,prix-repos-bas,prix-an,prix-feuille,impot-annee,argent,argent-bas}.png`. **Au premier essai, `manques` = « Pale Ale de septembre » et « Argent »** : la navigation Brassins › fiche du script n'a pas trouvé la carte du brassin. Adapter `cliquer(...)` à l'écran Brassins réel (la carte du lot « Pale Ale de septembre », posée par le script en mémoire), puis relancer.
2. Ouvrir chaque capture : débordement, texte coupé, contraste (cave surtout : colonnes pâles du graphe sur fond sombre, étiquettes blanches, bande « à perte »), recouvrement (lien 7,51 CHF/L, bulle +363,60), cibles ≥ 44 px (format, tuiles, marches d'Argent). Comparer côte à côte avec `p4/c7c/c7c-page.png` (Prix) et `p4/e3a/e3a-page.png` (Argent). Lister « combien et quels problèmes ? » en liste numérotée, ne rien corriger.
3. Rejouer `npx vitest run $(cat %TEMP%/ue-files.txt) tests/unit/prixCalcul.test.ts tests/unit/prixGeometrie.test.ts tests/integration/prixEcran.test.tsx --reporter=dot --maxWorkers=3 > voies/ue/tests.txt` une fois les voies uo et pv terminées : attendu 0 échec.

## Doutes et limites
- **Vu seulement** : Prix en clair 390 (repos et par an). Cave, 1280, feuille « Changer le prix », Impôt bière de l'année et Argent ne sont **pas ouverts en image** : validation visuelle **non effectuée** pour eux.
- Les cibles tactiles des marches d'Argent (≥ 56 px) et du segment de format (28 px dans la marche ③, plus petit que les 44 px voulus) sont à juger.
- `formatDepuisTarif` / `tarifDuFormat` (uv) ne lisent pas encore le champ `format` : le nom d'un tarif **porté** se recompose de (bière, format), donc la caisse le retrouve ; un test croisé Prix → Caisse n'est pas écrit.
- Encart « Dans Prévisions » : calculé par `estimerBrassinsPlanifies` dans la fiche ; couvert par le rendu planifié « ? », pas par un test dont la valeur est calculée à la main (D4 de la revue A : **non fait**).
- Prix → Caisse, démo (`financeDemo.ts` écrit des tarifs à coûts 0 et deux « Pale Ale Fût 20 L » en double) : hors Possède.
- `scripts/test_deep_interactive_buttons.mjs:627`, `scripts/agents/inventaire-ecrans.mjs` (marqueurs « Essais de tarifs », « Prix et marges ») : non rejoués, non modifiés.

DÉCISION À PRENDRE : (1) `storage.ts:1205` (journal « marge … % ») : omettre « · marge … % » quand `marginPercent` est absent (une ligne) : par le pilote ; mon écran n'appelle plus `updateTarif`, mais Caisse/Facturer d'autres écrans pourraient. (2) `functions/src/brewerAppContext.ts:13` (champs de `clients-tarifs`) : y ajouter `biere format emballageUnite` (déployable : irréversible, au pilote) ; en attendant, « Proposer » écrit le coût, le prix et le reste dans la question. (3) `formatsVente.ts` (uv) : faire lire `tarif.format` et exporter `biereDuTarif` (ma copie dans `calculPrix.ts` disparaît). (4) Supprimer `CreativePricing.tsx` (orphelin). (5) Mini maquette « Clients › Impôt bière de l'année » à demander au brasseur (L24).

CONNAISSANCE : `Intl.NumberFormat('fr-CH')` écrit l'apostrophe (« 9'162,72 ») sur ce poste ; la maquette et l'app (`montantChf`, fr-FR) écrivent l'espace fine. `graduations` de pv laisse le haut de l'axe juste au-dessus de la donnée (pas sur un cran) : un autre écran qui veut un axe « rond » doit prendre le cran suivant (`hautNice`, `src/ui/prix/geometrie.ts`). Un fichier temporaire partagé (`%TEMP%/ed2.mjs`) a été écrasé par une autre voie : nommer ses scripts avec le nom de la voie.

LEÇON PROPOSÉE : un test qui compare un texte rendu doit lire les nœuds texte un à un (`TreeWalker`) et normaliser les espaces fines, pas `textContent` ; un script écrit par heredoc a perdu `\s` et ` ` (le Bash de ce poste) : écrire le script avec l'outil Write.
