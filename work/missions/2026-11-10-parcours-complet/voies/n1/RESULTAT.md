OK — EN-1 : α du catalogue sur le houblon lié ; EN-2 et EN-3 : champs vides dits « à saisir » (branche n1/enrichissement, ffbcca63)

Base : tag `en-ligne/2026-11-10-mesures` (f4d11200). Worktree `C:/Users/mrspa/AppData/Local/Temp/n1-wt`, branche `n1/enrichissement`, un commit : `ffbcca63`. GATES.md n'existait pas pour cette voie : les critères sont ceux de la section « Contrôles » de VOIE.md.

## Fichiers écrits (tous dans « Possède »)
- `src/services/enrichissementTravail.ts` : `alphaDuCatalogue` (α de la variété liée), écriture de `alphaPct` avec sa trace `fiche.remplis.alphaPct`, `direLeManque` (champs encore vides + ligne au journal), `CHAMPS_ATTENDUS`.
- `src/services/enrichissementStore.ts` : types `ChampEcrit` (liste blanche + `alphaPct`) et `TravailFiche.manque`.
- `src/services/enrichissement.ts` : `champsASaisir(ref)` et `MOT_A_SAISIR = 'à saisir'`.
- `tests/unit/depense/enrichir/n1-fiches.test.ts` : 13 tests (EN-1 : 6, EN-2 : 3, EN-3 : 4).
- Dans cette voie : `tests.txt`, `tests-rejeu-des-rouges.txt`, `build.txt`.
Aucun changement de `functions/`. Aucun appel Gemini (réponses rejouées ; le garde `ia.run` lève s'il est appelé).

## Causes lues (L13 : tests rouges sur le tag avant correction)
Sur le tag, `n1-fiches.test.ts` : 11 rouges sur 13 (les 2 verts sont des gardes : « approchée » et « Maris Otter pareil »).
- **EN-1** : dans `traiterTravail`, la branche houblon appelait `ecrire(t, tour, [], { lien })` : un lien, aucune valeur. `alphaPct` est hors liste blanche de `patchDeTrous` (choix de la voie f4 : « une valeur typique n'est pas l'α du lot »). La fiche était liée, l'α jamais lu au catalogue.
- **EN-2, le « ZZ »** : ce n'est pas un défaut de la reconnaissance. « ZZ » est lu par le houblon comme un **code d'origine** de 2 ou 3 majuscules (`origineDuNom`, c7 : « Cascade CHE ») : « Nelson Sauvin ZZ » devient « Nelson Sauvin » avant la recherche dans le catalogue. Le malt n'a pas de code d'origine : `slugBeerAnalytics` compare le nom entier, « Maris Otter ZZ » n'est donc pas dans la table (« Maris Otter » l'est). Je n'ai pas fait avaler un suffixe inconnu aux malts : on devinerait un produit. Et même « Maris Otter » seul ressort `nonIdentifiable` (malt générique sans fabricant, PLAN § 3.5 : pas de recherche en ligne), donc sans EBC ni PPG : par conception. La table des fermentescibles du dépôt n'a aucune valeur d'EBC.
- **EN-3** : `US-05 ZZ` n'est pas reconnue par le catalogue des levures (jeton « ZZ » en trop : `aucun`), donc Gemini. Même la fiche du catalogue de US-05 ne publie l'atténuation qu'en **plage** (78–82 %, vérifié sur les 1 734 levures : 4 seulement ont un point). Règle en place de `sanitizeFacts` : « une plage, une borne ou une moyenne ne devient jamais un point ». Donc le champ restait vide, sans qu'on le dise.

## Ce qui change
1. **EN-1** : houblon lié au catalogue, champ α vide, fiche non approchée → α écrit avec sa trace (`par: catalogue`, `niveau: repris`, source « Catalogue des houblons du dépôt — Nelson Sauvin NZ (Beer Maverick) », URL de la page). Plage [10 ; 13] → **11,5** avec `deduit: « milieu de la plage publiée 10 à 13 % »` ; point publié [9,8 ; 9,8] → 9,8 sans « milieu » ; Hopsteiner en repli si Beer Maverick n'a pas d'α. Jamais écrasé : α lu sur la facture (« 12% ») et α tapé entre-temps. Jamais écrit sur une fiche approchée (autre origine), ni sans plage (pas de 0). Le niveau D277 est jaune (`motif: deduit`) tant qu'il n'est pas « Vu ».
2. **EN-2, EN-3** : à la fin de chaque travail (fait, à contrôler, introuvable, à saisir), `travail.manque` liste les champs utiles encore vides (houblon : α ; malt : EBC, PPG ; levure : atténuation, températures, laboratoire) et une ligne du journal le dit : « À saisir : couleur EBC, potentiel PPG — produit non reconnu (« Maris Otter ZZ »), rien trouvé » ; « À saisir : atténuation — atténuation publiée en plage (78 à 82 %), pas en valeur unique : non reprise ». Un point publié par la réponse est repris comme avant (test : 81 → 81, source citée). `champsASaisir(ref)` rend les champs encore vides (un champ saisi depuis n'y est plus).

## Critères (VOIE.md, « Contrôles »)
- `npx tsc --noEmit -p .` : sortie vide, code 0 (avec `functions/node_modules` joint par jonction).
- `npx vitest run tests/unit tests/integration --reporter=dot` → `tests.txt` : 12 942 verts, 12 tests rouges, 58 fichiers rouges. 46 fichiers « rouges » = `Cannot find module firebase-functions` dans le worktree (pas de `functions/node_modules`) : rejoués après la jonction (`tests-rejeu-des-rouges.txt`), 53 des 58 fichiers passent. Restent **11 tests rouges** (fuzzSaisie eau, recipeAiWorkflow ×2, recipeEditing ×6, designTokens, virgule-transversale), **les mêmes sur le tag** : rejoués avec les trois fichiers remis à `en-ligne/2026-11-10-mesures`, « 11 failed | 75 passed » sur ces cinq fichiers. Le 12e rouge du premier passage (fuzzSaisie « assistant de recette ») n'est pas revenu au rejeu : fuzz, instable. **Zéro nouveau rouge.** La liste de c1 n'était pas écrite (son `tests.txt` était vide) : la comparaison est faite contre le tag.
- `VITE_HOP_V4=on npx vite build` : « ✓ built in 31.84s », code 0 (`build.txt`).
- Tests des deux familles voisines : `tests/unit/depense` entier (2 691 verts), dont les fichiers `enrichir/`, `yeast*Enrichment`, `banc-enrichissement`.
- Chrome : aucune capture. Je n'ai pas changé l'apparence d'un écran (voir la décision 2) : rien à comparer.

## Essais
Un essai par critère, hors un test de ma fixture (le Nelson Sauvin de la fixture existait déjà : mon doublon le rendait ambigu, corrigé dans le test). Pas de rustine sur un module : ni algorithme d'image, d'OCR ou de dates ; l'état de l'art ne s'applique pas.

## DÉCISION À PRENDRE
1. **α d'une plage = son milieu, marqué « déduit » (jaune).** C'est mon choix pour EN-1, fondé sur D302 (malt : valeur déduite, trace et règle dites). Il contredit la phrase de `ficheValeurs.ts` et de `valeursDeReponse` (« jamais `alphaPct` : une valeur typique n'est pas l'α du lot »), que l'accord du 10.11 lève. Options : (a) milieu déduit, comme livré ; (b) ne rien écrire et seulement dire « à saisir » ; (c) la borne basse. Recommandation : (a), tant que l'écran montre le jaune et la plage. Ajuster ce commentaire dans `src/domain/stock/ficheValeurs.ts` (hors de ma voie) : « Les seuls champs qu'f4 peut écrire (… jamais `alphaPct`) » reste vrai pour `patchDeTrous`, mais l'α est écrit à côté par `enrichissementTravail` ; mettre `alphaPct` dans `ChampFiche` et `CHAMPS_ECRIVABLES` serait plus propre.
2. **Le mot « à saisir » n'est pas encore sur l'écran.** `niveauxDeFiche` n'est lu par aucun écran (grep : seul le domaine et les services l'utilisent) ; `StockDetailSheet.tsx` (`src/ui`, hors de ma voie, voie c1 ou suivante) affiche des champs nus. Ce que j'ai livré : la donnée (`travail.manque`, `champsASaisir(ref)`, `MOT_A_SAISIR`) et la ligne du journal des modifications. Pour le brasseur : lire `champsASaisir(item.ref)` à l'ouverture de la fiche et écrire « à saisir » en `text-attention` à côté du champ concerné (Acide alpha, Couleur, Potentiel, Atténuation), puis une capture 390 avant/après (L12). Recommandation : à faire par la voie qui possède `StockDetailSheet`, avant le déploiement (sinon EN-2 et EN-3 ne se voient qu'au journal).
3. **Atténuation en plage (78–82 %) : rien dans le champ.** Je garde la règle de `sanitizeFacts` (pas de point inventé) ; la plage reste dans `yeastTechnicalFacts` et au journal. Option : reprendre le milieu (80 %) comme pour l'α et le malt. Recommandation : non pour l'instant ; l'atténuation pilote la densité finale, une plage de 4 points vaut mieux affichée que moyennée en silence ; à confirmer par le brasseur.
4. **Malt générique sans fabricant (« Maris Otter ») : toujours aucune valeur.** Option : autoriser la recherche pour les noms de la table (`generique`). Recommandation : non (un malt générique varie selon la malterie) ; EN-2 se règle en le disant.

## Doutes et limites
- Non rejoué en ligne : à jouer par le pilote après déploiement (les trois lignes ZZ de e5 ; la fiche relue). Le déploiement des fonctions n'est pas nécessaire.
- Le journal écrit une ligne de plus par travail laissé incomplet ; un travail relancé plus tard (« introuvable » après 30 jours) en écrit une autre.
- `champsASaisir` lit `travail.manque` (Dexie, par appareil) : sur un autre téléphone, la file de fiches n'existe pas.
- Les anciens articles (créés avant ce commit) n'ont pas de `manque` : rien « à saisir » pour eux tant qu'aucun travail ne les repasse.
- Worktree : `src/data/seedData.ts` et les jonctions `node_modules`, `functions/node_modules` sont copiés/ajoutés hors Git (ignorés).

CONNAISSANCE : « ZZ » dans un nom de houblon est lu comme un code d'origine (`origineDuNom`, 2 à 3 majuscules, c7) ; le malt n'a pas ce code, donc un malt « ZZ » ne s'apparie pas. Le catalogue des levures (1 734 fiches) ne donne l'atténuation en point que pour 4 ; les autres, comme US-05, en plage.
LEÇON PROPOSÉE : aucune.
