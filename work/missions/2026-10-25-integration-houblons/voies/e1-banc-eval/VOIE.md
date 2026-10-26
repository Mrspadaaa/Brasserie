# Voie e1-banc-eval — un banc d'évaluation hors ligne pour Substituer et Suggérer (#181, première étape)

Agent : auteur (Sonnet), pour un banc de mesure et une analyse. **Cette étape mesure, elle ne règle rien** : aucun changement dans
`src/domain/hopIndex/v4/` (substitution.ts, voies.ts, moteur.ts…). Le réglage viendra à l'étape suivante, sur les chiffres de ce
banc.

## Ses mots
- 25.10 : « Faudra aussi voir pour rien tuné l'algo de suggestions et celui de substitution » ; « Fine tuné* ».
- 25.10 : « SI c'est trop complexe, j'autorise de faire quelque teste d'appel IA pour l'ajouter à Lago si ça augmente la qualité,
  sans être trop lent et réduit la complexité. »

Lis l'issue #181 (`gh issue view 181 --repo Mrspadaaa/Brasserie`) et ces deux notes :
- `cerveau/metier/substitution-moteur.md` : le score selon le moment, et pourquoi « arôme 100 » n'est pas une ressemblance ;
- `cerveau/metier/descripteurs-hors-familles.md` : Nelson Sauvin et Motueka, et les mots sans famille.

## Les données de référence (depuis le 26.10, D75)
`src/data/hopV4/proto-data.json` porte pour chaque variété un bloc `bm`, lu sur sa page Beer Maverick :
- `substituts` : 217 variétés en ont, reliés à l'id du catalogue quand le nom se résout ; 101 pages disent n'en avoir aucun ;
- `accords` : les houblons qu'on lui associe ;
- `styles` ;
- `arome` : un profil à 9 axes, de 0 à 5, sur 57 % des variétés.

Le moteur ne lit aucun de ces champs : ils peuvent servir de vérité de terrain sans fuite.

Lis le type dans `src/domain/hopIndex/v4/data.ts` (`CatalogueHop`, `bm`).

## À faire
1. **Substituer** : pour chaque variété qui a des substituts Beer Maverick reliés, appelle `substitutes()` du moteur (par la
   fabrique, comme `scripts/bench-hop-v4.ts`) sur tout le catalogue, à trois moments (60′, 10′ ou whirlpool, dry hop).
   - Mesure :
     - le rappel à 5 et à 10 : la part des substituts BM présents dans les 5 ou 10 premiers ;
     - le rang médian du premier substitut BM ;
     - le MRR.
   - Donne les résultats par moment et par usage (aroma, bittering, dual).
   - Les substituts BM sont une référence imparfaite : souvent un substitut d'amérisant, ou un mot du marché. Écris où ils
     semblent faux, avec 5 exemples.
2. **Les houblons phares** du brasseur (L14) : Nelson Sauvin, Citra, Motueka, Mosaic, Galaxy, Simcoe, Saaz, Cascade, Idaho 7.
   - Pour chacun, au dry hop et à 60′ : les 10 premiers de `substitutes()` avec leur score, et les substituts BM.
   - Dis en une phrase si la liste paraît juste à un brasseur : par exemple, Nelson Sauvin ne doit pas donner un houblon neutre.
3. **Suggérer** : il n'y a pas de vérité de terrain directe. Évalue en aller-retour : pour une variété X, prends son profil comme
   visée, et mesure le rang de X et de ses substituts BM dans le classement de Suggérer (`proposeVoies` ou la fonction qu'emploie
   `src/ui/hopIndex/suggerer/`).
   - Sur un échantillon fixe et déterministe d'au moins 60 variétés, avec la graine écrite.
   - Ajoute 5 cas « recette et attente » tirés des mots du brasseur, dans `work/refonte-frontend/v4/SPEC-BRASSEUR.md` (« ultra
     fruité », « vin blanc », « moins résineuse » sur la stout, etc.), avec la bonne réponse attendue, écrite d'après ses mots.
4. **Où l'algorithme se trompe** : classe les erreurs par cause, avec les chiffres :
   - les inconnus traités comme des zéros ;
   - les mots sans famille ;
   - le poids de l'amertume au mauvais moment ;
   - la levure ;
   - les données manquantes.
5. **Options de réglage**, en DÉCISION À PRENDRE, chacune avec son gain attendu mesuré sur le banc, et son coût en temps :
   - des poids par moment ;
   - la prise en compte des mots sans famille ;
   - l'usage de `bm.arome` ;
   - un appel IA en re-classement.

   Pour l'IA, **ne fais aucun appel réel** dans cette étape : décris le protocole d'un essai journalisé, limité, hors
   `npm test`, et ce qu'il devrait battre.

## Règles
- Le banc est déterministe : même entrée, même sortie. Il tourne hors ligne, sans Gemini, sans Firestore, en moins de 2 minutes.
- Script : `scripts/eval-hop/banc-eval.ts`, lancé par `npx vite-node`. Sortie : JSON et Markdown dans cette voie.
- Aucun test Vitest n'appelle ce banc. Un test unitaire léger peut vérifier ses métriques sur un mini jeu.

## Critères
- `npx vite-node scripts/eval-hop/banc-eval.ts -- --sortie=<voie>/resultats` : sort 0, et deux passes donnent le même JSON
  (sha256 égal).
- `resultats/rapport.md` : les métriques par moment et par usage, les houblons phares et les erreurs classées.
- `npx vitest run tests/unit/hopIndexV4` vert ; `npm run build` vert ; `git diff --stat -- src/domain` vide.

## Possède
`scripts/eval-hop/`, `tests/unit/hopIndexV4/` (le test des métriques seulement),
`work/missions/2026-10-25-integration-houblons/voies/e1-banc-eval/`.

D'autres voies sont en vol :
- c2-comparer-valeurs (`src/ui/hopIndex/comparer/` sauf index.tsx, et `fiches.ts`) ;
- p2-rendu (`comparer/index.tsx`, `PageShell.tsx`) ;
- r177-tests-rouges (l'atelier V5.5).

Rien de leurs fichiers. Pas de `git mv`. Fichiers de travail dans `os.tmpdir()`.

Retour en une ligne ; RESULTAT.md avec les chiffres, les exemples et les options.
