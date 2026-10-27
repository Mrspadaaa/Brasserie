# Voie f9-intensite-typicite — sa Double IPA : l'intensité par variété et la typicité du style

Agent : auteur (Sonnet). Le moteur et ses données, pas l'écran. La voie s'arrête au code, aux tests, au build et aux mesures. Pour la suite
mécanique (séries de mesures, rejeux), écris une `DEMANDE EXECUTANT :`.

## Ses mots (27.10, D191)
« pour la double IPA, les houblons d'agrume sont pas vraiment ceux attendu. Je m'attendais à des houblon plus typé IPA El dorado, mosaic.
Mandarina Bavaria, calypso, Pacifique jade ou même idao7 », avec le radar Beer Maverick d'Idaho 7 en référence.
Sa réponse à « mini maquettes d'abord, ou directement ? » : « Les deux ». Cette voie fait le « directement ». Une page de mini maquettes
suivra, faite à partir de tes listes.

Ses mots plus anciens sur le même moteur, à tenir :
- « elle récompense même surtout l'α c'est pas la bonne métrique. Surtout en fonction du style... Elle doit compter mais pas que » ;
- « Il faudrait pas que l'algo trie trop ou exclue trop tôt » ;
- « Citra cryo semble toujours être en tête pour beaucoup de choses » (D174).

## Base, à lire en entier
- `voies/f8-dipa-et-formes/RESULTAT.md` : D191 non tenu, 1 sur 6. Ses deux causes, et sa recommandation (b).
- D118 et D119 dans `work/refonte-frontend/decisions.md`.
- Sa **vraie** recette : `voies/f9-intensite-typicite/recette-neipa-v3.txt`. Double IPA (BJCP 22A), 24 L, OG 1,081, IBU visé 80, Lotus
  84 g à 15 % α, 40 min d'ébullition, levure Verdant IPA. f8 avait supposé des ajouts : prends celle-ci.
- Beer Analytics, collecte **complète** (435 fiches, 97 % avec tous leurs graphiques) : `src/data/hopSources/beeranalytics*.json`.
  Ces fichiers ne sont pas suivis par git, et tu ne les modifies pas. La part du houblon dans les recettes de chaque style y est, ainsi que
  les recettes par moment d'ajout (Dry Hop compris). Licence CC BY-SA 4.0 : à citer dans tout fichier dérivé. Lis
  `voies/c3h-beer-analytics/RESULTAT.md` et `couverture.md` (5 rattachements ambigus : Saaz, Magnum, Perle, Northern Brewer, Brewer's Gold).

## Ce qui est demandé
Deux mécanismes, chacun une option de `proposeVoies`, sans changer l'écran.
1. **Intensité par variété dans l'effet (A3).** Aujourd'hui, deux variétés qui citent les mêmes familles reçoivent presque le même effet.
   L'intensité de la variété sur l'axe pèse dans l'effet simulé lui-même, et pas seulement au départage. Sources : le radar Beer Maverick
   et ce que tu trouves de mieux dans les données (huile, faits cités).
   - Une variété sans intensité connue reste neutre, et le dit (drapeau).
   - Ça change les barres : c'est voulu. Écris de combien, sur sa recette.
2. **Typicité du style (b de f8).** Ses mots : « typé IPA ». La part du houblon dans les recettes du style visé (et des styles voisins :
   21A, 21C, 22A), lue chez Beer Analytics.
   - Elle **compte, mais pas seule** : un terme du classement, jamais un filtre ni une exclusion.
   - Elle ne doit pas ramener Citra et Citra cryo en tête de tout.
   - Elle tire une table compacte et dérivée (`src/data/hopV4/typicite-styles.json`), générée par un script rejouable, avec la source et
     la licence dans son en-tête.
3. Les quatre combinaisons restent des options : actuel, A3, typicité, A3 + typicité. La page suivante les montrera toutes.

## Méthode (L20)
- Écris d'abord, dans RESULTAT.md, sur quelle moitié des cas tu règles et sur laquelle tu juges. Ses six houblons sont la moitié jugée,
  jamais celle du réglage. Pour le réglage, prends par exemple les autres styles et les phares.
- Mesure « plus d'agrumes » et « plus de tropicaux », au dry hop et au whirlpool, sur sa recette. Prends la liste que l'écran lit
  aujourd'hui (l'adaptateur de Suggérer, liste principale), pas seulement les groupes `dryHop` de g2b.
- Pour chaque combinaison : les 10 premiers et le rang de ses six (El Dorado, Mosaic, Mandarina Bavaria, Calypso, Pacific Jade, Idaho 7).

## Critères
- **D191** (critère, D191 dans `DEFAUTS-RECURRENTS.md`) : sur sa recette, avec la combinaison retenue, au moins 4 de ses 6 dans les 10
  premiers, en agrumes et en tropicaux, au dry hop. Témoin négatif : be15e480, ou la combinaison « actuel ». Le contrôle est un script
  (`scripts/eval-hop/f9-d191.ts`) qui imprime `D191 OK` seulement si c'est tenu.
- **Défaut** : si D191 est tenu et que les non-régressions passent, la combinaison retenue devient le défaut. Sinon, le défaut ne change
  pas, et tu dis pourquoi.
- **Non-régressions** :
  - phares (L14 : `f2-phares.ts`, `f5-phares.ts`, `f2-borne.ts`), sur 21C, 16D et 22A ;
  - Citra cryo n'est pas premier partout (D174) ;
  - les acquis du stout S1 (D105 : Goldings ou Celeia) ;
  - le recul de l'usage « arôme » à 60′ (D106).
  Tableau avant/après.
- `npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests` : vert ; un test adapté porte sa raison (« D120 »).
- `npm run build` : vert, avec `VITE_HOP_V4=on`. `node scripts/check-hop-budget.mjs --dist dist --chunk-outils profil-simule` : B5 ≤ 164 ko.
  Il est à 163,5 ko : la table ne va pas dans ce chunk, mais dans le worker ou dans un chargement à part.
- `npm run check:hop-perf` et `scripts/eval-hop/f2-perf.ts` : pas de régression au-delà du bruit (± 10 %). Tableau au ms près.
- **Pour la page** : `voies/f9-intensite-typicite/listes.json`. Pour chacune des 4 combinaisons et chaque question (agrumes, tropicaux ;
  dry hop, whirlpool) : les 10 premiers (nom, α, apport par famille, raison), et les barres au style de sa bière après l'ajout du premier.

## Possède
- `src/domain/hopIndex/v4/` : `voies.ts`, `departage.ts`, `pouvoir.ts`, `profil-simule.ts`, et des modules neufs.
- `src/ui/hopIndex/parcours/donneesWorker.ts`, seulement pour charger la table.
- `src/data/hopV4/typicite-styles.json` (neuf).
- `scripts/eval-hop/f9-*`, `scripts/collecte-hop/typicite-*.mjs` (neufs).
- `tests/unit/hopIndexV4/f9*.test.ts` (neufs), et les tests du moteur qu'une empreinte oblige à adapter.
- `prototypes/houblons-v4/data/pack-*.json`, seulement s'ils sont régénérés par `build-pack.ts` (comme f8).
- `work/missions/2026-10-25-integration-houblons/voies/f9-intensite-typicite/`.

Rien d'autre dans `src/ui`. Ne touche ni à `.codex/`, ni à `source4-portable-bundle-manifest-01.json`, ni à `functions/.env`. Aucun appel
Gemini. N'écris aucun code par heredoc ni par `node -e`. Pas de `git stash`, aucun commit. Écris RESULTAT.md tôt et tiens-le à jour.
Rends une ligne.
