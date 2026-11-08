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

---

# Dernier lot (27, 28, 45, 48)

Bilan : 45 corrigé (Chrome rouge → vert) ; 27 corrigé au domaine (message), non reproduit en Chrome ; 28 non fait (DÉCISION) ; 48 non reproduit (noms présents).
Builds : `vite.ferm.config.mjs` + `VITE_HOP_V4=on` (`$TEMP/gen-apres2`), manifeste `21dd75b3…` avant et après.

| n° | Fichiers | Contrôle avant → après | Capture ouverte |
|---|---|---|---|
| 45 | `src/ui/finance/journal.css` : le rail des filtres passe à la ligne au lieu de défiler sans repère (`flex-wrap`, `max-width:100%`) ; le compte « 0 » des puces est masqué ; `summary` « Autres filtres » garde son `padding-right` (le chevron global recouvrait le mot) | `genants/controle-45.mjs` : avant FILTRES ECHEC (« À compléter » coupée à 500 px, chevron sur « filtres ») → après FILTRES OK (clair 500, cave 500, clair 1280) | `g45-avant/c45-clair-500.png` (« À com », chevron sur le mot) ; `g45-apres/c45-cave-500.png` (puces entières, chevron dégagé) |
| 27 | `src/domain/hopBitterness.ts` : une donnée de la recette (volume, densité, durée d'ébullition) manque **une fois** (« durée d'ébullition de la recette »), plus une fois par houblon ; `tests/unit/hopBitterness.test.ts` (+1) | Vitest vert (3 fichiers, 37 tests). `controle-27.mjs` : **non reproduit** : l'assistant réécrit la durée d'ébullition de la recette à l'enregistrement (60 par défaut), la fiche calcule 55,4 IBU, que `boilMin` soit absent ou le texte « 60 ». Le message n'apparaît donc qu'avec une recette dont `boilMin` est invalide dans les données enregistrées. Hypothèse : donnée importée ou ancienne (à lire en lecture seule sur « NEIPA Test multi-houblons » : `boilMin`). Le message a au moins cessé d'accuser chaque houblon | `g27-avant/c27-clair-390.png` (cas calculable) |
| 28 | rien | `controle-28.mjs` lit l'ordre réel des suggestions : sans stock en dev-local, une seule suggestion (« Fantasia Blend, 10 g, 10′ ») | — |
| 48 | rien | `controle-48.mjs` (arbre d'accessibilité de Chrome, `page.accessibility.snapshot`) : la barre du bas porte Bord, Finances, Brassins, Stocks, Clients ; les 6 `menuitem` du « + » portent leur nom (« Nouvelle écriture Dépense saisie à la main », « Créer une recette »…) : NOMS OK à 390 clair et 1280 cave | `g48-avant/c48-clair-390.png` |

## DÉCISION À PRENDRE (n° 28, suggestions hors style)
Le classement d'« Ajouter » est une règle écrite et décidée (D107, `QUICK_ADD_RULE` dans `src/domain/hopIndex/v4/quickAdd.ts`) : usage attesté, cohérent, peu documenté, non documenté, hors style ; le stock informe sans limiter. Elle n'est pas un bogue de code : sans usage attesté ni stock, des variétés « non documenté » passent devant. Les corrections possibles changent une décision du brasseur : (A) ne montrer en tête que les usages attestés et cohérents, le reste derrière « autres » ; (B) garder le classement et dire « non documenté pour ce style » sur la pastille ; (C) ne rien changer. Recommandation : B (rien ne se cache, l'écran dit pourquoi) ; l'affichage est dans `src/ui/hopIndex/maBiere/Ajouter.tsx` (à l'autre auteur). À montrer en mini maquettes si le brasseur doit choisir. Non fait ici.

## Réserves du dernier lot
- n° 45 : la ligne de filtres peut prendre deux rangées à 500 px (l'ancien commentaire de `journal.css` préférait une glissière pour ne pas repousser la première écriture) : arbitrage densité contre lisibilité, à valider ; la glissière revient en remettant `flex-wrap:nowrap`, `overflow-x:auto`.
- `financeArchives.test.tsx` ne se charge pas (import `zxing-wasm/reader`, paquet non installé) : fichier non compté dans le vert. 11 fichiers Journal/Houblons lancés : 105 tests verts, 1 fichier non chargé. `tsc` : seules erreurs `pdfjs-dist` et `zxing-wasm`.
CONNAISSANCE : un `summary` de l'app reçoit un chevron global en fond (`src/index.css`, `padding-right: 1.75rem`) : une règle locale qui remet `padding` à 0 fait recouvrir le mot ; garder le `padding-right`.

## Pilote, 07.11 : n° 45 repris
Le passage à la ligne contredisait la décision de densité du journal (« deux rangées de puces repoussaient la première écriture », 5fad4fa2) :
à 390, deux rangées. Repris : une seule glissière, fondu de 20 px au bord droit (repère de suite), compte « 0 » masqué, chevron dégagé.
`controle-45.mjs` accepte une puce coupée seulement si le rail défile avec ce fondu : ECHEC sur le build d'avant (« À compléter » coupée,
sans repère) → OK clair 500, cave 390, clair 1280 ; capture c45-clair-500 regardée. n° 28 : option B (« non documenté pour ce style »)
confiée à l'auteur de maBiere.

## Pilote, 08.11 : preuves Chrome des n° 13, 15 (NOLO) et 49

Fixtures SIMULÉES, de même forme que les cas du test en ligne, par les vrais gestes de l'app (`?dev-local`) : brouillon de l'assistant avec la levure
`lallemand-munich-classic` (n° 13) ; brouillon à 24,012 L avec la configuration NOLO de `fixture-nolo.ts` (tirée de la fixture `fruty`, n° 15) ; article
créé par « Nouvel article » (stock 0, seuil vide, n° 49). Builds `VITE_HOP_V4=on` ; avant = `22a89d5f` (n° 13, 49) et `5cf2f99d` (n° 15).

| Contrôle | Avant | HEAD corrigé (clair 390 et cave 1280) | Capture regardée |
|---|---|---|---|
| `controle-13` | LEVURE ECHEC : « Levure de la recette : lallemand-munich-classic » | LEVURE OK : « LalBrew Munich Classic » | `c13-houblons-clair-390.png` |
| `controle-15-nolo` | NOLO ECHEC : 24,012 L, 30,012 L, en-tête « 24.012 L » | NOLO OK : « 24 L », « 30 L », en-tête « · 24 L » | `c15n-clair-390-fiche.png`, `avant5/c15n-apercu-clair-390.png` |
| `controle-49` | BADGE ECHEC : badge 1 ≠ « À commander » 0 | BADGE OK : badge 0, pastille 0, « À commander · 0 » | `head3/c49-stocks-cave-1280.png` |

Deux défauts neufs trouvés par ces preuves, rouges sur `605a3bc3` puis corrigés : l'en-tête de fiche « Foreign Extra Stout · 24.012 L » (volume brut ;
`formatLitres` dans `recipeMetrics.ts`, aussi recherche, liste de Stocks et fiche de brassin) et la pastille « Stock (1) » qui comptait les ruptures
au-dessus de « À commander · 0 » (`articlesACommander`, le même compte que le badge). Vitest : `recipeMetrics`, `recetteMemeChiffre`, `compactProduction`,
`brewWortPair`, `compactStocks`, `stockLineMatching`, `dashboardNavigation`, `articlesACommander`, `stockLevel`, `dashboard*`, `fix114*` verts ; `tsc` sans erreur
sur les fichiers touchés. Restent sans Chrome : n° 33, 34, 50 (brassin planifié ou en fermentation).
