OK (partiel) — corrigés 9, 11, 13 (partie), 15 (partie NOLO), 20, 21, 33, 34, 49 (Stocks + Bord), 50 ; AILLEURS : badge n° 49, nom de levure n° 13, texte « lu comme » n° 9 ; non faits : 27, 28, 45, 48

Build figé : `vite.ferm.config.mjs` (+ `VITE_HOP_V4=on` pour n° 9 : l'étape Houblons « Ma bière » n'existe que sous ce drapeau). `md5sum source4-portable-bundle-manifest-01.json` = 21dd75b3… avant et après chaque build. Aucun commit, déploiement, serveur de dev, appel Gemini.

## État de l'art (n° 9, rapprochement de nom)
`MISSION.md` n'existe pas dans ce dossier. Problème type : correspondance approximative de chaînes. Décision : Fuse.js (bitap, déjà dépendance, `services/search.ts`), pas d'algorithme maison ; garde-fous (une seule variété, même première lettre, longueur voisine, ≥ 5 lettres) ; le rapprochement est marqué `relie: 'nom proche'` avec une supposition « lu comme X ». Le pilote peut contester ce choix : il remplace une règle « nom exact seulement ».

## Tableau
| n° | Fichiers | Contrôle avant → après | Captures (ouvertes) |
|---|---|---|---|
| 9 | `src/domain/hopIndex/v4/nomProche.ts` (neuf), `v4/recipeConversion.ts` (`cleDe`, `LienAjout.relie`), `tests/unit/nomProche.test.ts` | `genants/controle-9.mjs` : avant NOM ECHEC (« Nuget » et « Hallertauer Mittelfruh » : `α ? usage ? arôme ?`) → après NOM OK, 4 cas (clair/cave × 390/1280) ; un houblon inconnu (« Zorglub Gold ») reste « α ? » ; Vitest 3 verts (une faute d'une lettre ne désigne jamais une autre variété) | `g9-gen-apres-v4/c9-clair-390.png` (Nugget α 9,5–16 %, Hallertau Mittelfrüh α 3–5,5 %, Zorglub inconnu) |
| 11 | `src/pages/RecipePage.tsx` (`Metric` : « — » + `sr-only` ; `raisonsDeTete` : une ligne sous la carte ; note ABV « cible ») | `controle-11.mjs` : avant CARTE ECHEC (consignes dans 5 cellules) → après CARTE OK ×4 | `g11-avant/…haut.png`, `g11-apres/c11-clair-390-haut.png`, `c11-cave-1280-haut.png` |
| 13 | `src/components/tabs/DashboardTab.tsx` (« Densité non relevée »), `src/ui/BatchDetailSheet.tsx` (« densité cible » ×2), `src/ui/production/CatalogCards.tsx` (« Densité … »), `src/ui/YeastChoiceComparison.tsx`, `src/ui/BrewSheet.tsx` + `src/ui/water/WaterAcidity.tsx` (« estimation de l'empâtage »), tests `dashboard`, `YeastSupplyComparison` | RTL (`dashboard`, `YeastSupplyComparison`) verts ; **pas de rendu Chrome** : un brassin en fermentation avec relevé ne se fabrique pas dans le banc | — |
| 15 | `src/ui/NoloRecipeOverview.tsx` (volumes au décilitre : « 24 L »), `src/ui/NoloRecipeSimulator.tsx` (retrait d'alcool à 1 décimale) | `controle-15.mjs` vert avant et après : la précision absurde de la fiche non-NOLO **n'a pas été reproduite** (mash 2,70213 écrit « 2,70 »). NOLO : pas de Chrome (fabriquer un NOLO complet dépasse le banc) | — |
| 20 | `src/ui/BeerStyleTag.tsx` (texte au jeton du thème `text-cave-50`, fond teinté conservé) | `controle-20-21.mjs` : avant contraste 1,1:1 → après 12,3:1, ×4 | `g20-gen-apres-v4/c20-clair-390-liste.png`, `g20-21-apres/c20-cave-1280-liste.png` |
| 21 | `src/ui/production/CatalogCards.tsx` (`avecUnite` : « — » seul, plus de « — % » ni « — IBU »), `src/domain/productionCatalog.ts` (abv 0 d'une bière non NOLO = inconnu) ; tests `batchMissingTargets`, `compactProduction` mis à jour (« — % » → « — ») | même contrôle : avant « — % », après « — » | idem |
| 33 | `src/domain/batchSchedule.ts` (`plannedDateIsPast`), `DashboardTab.tsx` et `CatalogCards.tsx` (« Prévu le 08.09.2026 · date dépassée »), `tests/unit/plannedDateIsPast.test.ts` | Vitest 2 verts ; pas de Chrome (pas de brassin planifié dans le banc) | — |
| 34 | `CatalogCards.tsx` : « Volume en cuve à renseigner » au lieu de « — L en cuve » | RTL seulement | — |
| 49 | `src/domain/stockLevel.ts` (`articlesACommander`), `StocksTab.tsx` (« À commander » et listes, « à définir » si quantité 0), `DashboardTab.tsx` (compte et ruptures), `tests/unit/articlesACommander.test.ts` | Vitest 4 verts ; `dashboard` et `fix114` verts. Règle : manque pour les brassins planifiés, ou stock ≤ seuil **renseigné** (minStock > 0) ; un article sans seuil n'est plus compté. Badge de la barre : AILLEURS (ci-dessous) | — |
| 50 | `src/ui/StockDetailSheet.tsx` : bouton « Niveau inconnu : fixer le seuil minimum » (focus sur le champ « Seuil minimum ») | non rendu | — |

## AILLEURS (patch exact, non appliqué)
- **n° 49, badge** (`src/App.tsx` l. 429) : remplacer le bloc `const criticalStockCount = [...].length` par `const criticalStockCount = articlesACommander([...stocks.rawMaterials, ...stocks.cleaning], batches).length;` et importer `articlesACommander` de `./domain/stockLevel`. Sans cela le badge garde l'ancien compte (26) ; le Bord et Stocks sont déjà alignés.
- **n° 13, nom de levure** (`src/ui/hopIndex/maBiere/Base.tsx` l. 15) : `nomLevureBase` renvoie `LEVURES[id] ?? id`. Patch : `id ? LEVURES[id] ?? yeastReferences(StorageService.getHopKnowledge()).find((y) => y.id === id)?.name ?? 'levure inconnue' : 'levure ?'` (imports `yeastReferences`, `StorageService`).
- **n° 9, dire la lecture** (`maBiere/Carte.tsx`) : afficher sous le nom `conversion.ajouts[id].suppositions[0]` (« « Nuget » lu comme « Nugget » … : à confirmer ») ; pour un houblon sans variété, la supposition existe déjà (« n'est relié à aucune variété du moteur… ») et n'est affichée nulle part : à brancher pour que l'écran dise pourquoi « α ? ».
- **n° 15, Récap de l'assistant** (`BrewWizard.tsx`) : « 2,7021 L/kg » : formater en `formatDecimal(x, 2)`.
- **n° 13, « Non calculable » / « Non comparable »** : non traités (badges de `BrewWizard`).

## Non faits
- 27 (potentiel aromatique « durée d'ébullition »), 28 (suggestions hors style) : domaine hopIndex, non diagnostiqué.
- 45 (filtres du journal à 500 px) : la glissière `journal-rail` défile volontairement ; chevron de « Autres filtres » non vu dans un rendu (Finances sans données dans le banc).
- 48 : non reproduit par lecture : les boutons de la barre du bas portent un texte visible, et la sonde Chrome liste les entrées du menu « + » avec leur texte (« Nouvelle écriture… », « Créer une recette »). L'arbre d'accessibilité du test en ligne n'a pas été rejoué.

## Contrôles à rejouer (build figé après mon diff)
`controle-9`, `controle-11`, `controle-20-21` (déjà verts ×4 sur `$TEMP/gen-apres-v4`, ce build n'est pas conservé) ; Vitest : `articlesACommander`, `nomProche`, `plannedDateIsPast`, `stockLevel`, `recipeMetrics`, `recetteMemeChiffre`, `dashboard`, `batchMissingTargets`, `compactProduction`, `noloRecipeSolver`, `YeastSupplyComparison` : 11 fichiers, 92 tests verts.

## Doutes et limites
- `tsc --noEmit` : seules erreurs `pdfjs-dist` et `zxing-wasm/reader` (paquets non installés, étrangers à ma voie).
- Fichiers de test non chargés (L11) : `compactStocks`, `dashboardNavigation`, `mobileDailyViews`, `stockLineMatching` (import `zxing-wasm/reader`). `brewLegacyInstallationApp` : 2 tests échouent (« Créer le brassin à brasser » introuvable) : non diagnostiqué, `App`/`BrewWizard` ; non rejoué à HEAD.
- `YeastPitchingPanel.tsx` et `NoloRecipeSimulator.tsx` : j'y ai touché avant le message du pilote (« SG » → « densité », `digits={1}`) ; l'auteur de l'assistant a lui aussi modifié ces fichiers : vérifier le diff pour une collision.
- Changement de comportement voulu mais à valider : un article au seuil exact figure dans « À commander » avec « à définir » ; un article sans seuil n'y figure plus ni au Bord.
- Mes contrôles `genants/amorce.mjs` fabriquent la recette en réécrivant le brouillon localStorage du banc (clé `…:new`) puis « + → Créer une recette » : fixture de banc, pas une donnée réelle. Le nom de la recette porte un artefact de frappe (« Stout exRecette de banc »), sans effet sur les contrôles.

CONNAISSANCE : le « Ma bière » v4 (`EtapeHoublons`) n'est monté que si `VITE_HOP_V4=on` au build ; le banc `?dev-local` par défaut montre l'atelier V5.5. Les entrées de houblon se relient par `cleDe` (v4/recipeConversion), pas par `findRecipeHopMatches` (index exact de recipeGuide.ts).
LEÇON PROPOSÉE : aucune.
