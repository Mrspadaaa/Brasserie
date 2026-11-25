ECHEC — banc réel : 0,08 CHF couvre 8 appels sur 32, tenues non mesurées (IA –/8 → –/8)

Commit 83a0aae71 (par chemins). Pas de déploiement. Cause trouvée et correctif écrit ; il manque la mesure sur les 8 phrases tenues à part.

## État de l'art
- Problème type : classification d'un texte court par un LLM, avec une sortie structurée (genre, chemin hiérarchique, titre court).
- Examiné : un schéma JSON strict (champs requis, enum), une consigne qui définit chaque genre par des critères, puis une post-validation ; le banc fermé à vérité écrite avant les passes, avec réglage et jeu tenu à part (L20, D77).
- Décision : un objet `sujet`, requis et placé en tête du schéma (`titre`, `domaine`, `genreCarnet`, `chemin` requis et énumérés, `etatPropose`). Les genres sont définis par critères dans la consigne. La post-validation se fait en deux temps : `sujetAssaini` au serveur, puis `sujetLu` au client.

## Cause (mesurée sur l'IA réelle, gemini-3.8-flash, réflexion basse, même corps que `aiTask`)
- Sans carnet du même sujet, la consigne actuelle range juste. Sur 3 phrases de réglage sur 3 : r1 « la pompe de transfert claque… » donne problème, Brasserie › Brassage › Pompe, « Pompe de transfert » ; r2 donne un mémo ; r5 donne un mémo, Brassage › Refroidissement, avec sa tâche.
- Avec un carnet du même sujet (comme le « ZZ vapeur » du test 70), l'IA le désigne par `carnetId`. Elle ne rend alors ni `genreCarnet`, ni `chemin`, ni `titre`, ni `domaine`. Exemple r4 avant : `{"sorte":"note","genre":"a-acheter","carnetId":"zz-densimetres",…}`. L'écran pose alors « Rattacher ? », et « Garder à part » crée une « Idée » sous le domaine seul. C'est C70-3.
- Préciser la consigne seule n'a pas suffi : r4 après rend le domaine, mais toujours ni genre, ni chemin, ni titre. D'où le passage au `sujet` requis du schéma (méthode standard).

## Fichiers écrits
- `functions/src/carnetIA.ts` : `SUJET_SCHEMA`, requis en tête de `RANGER_CARNET_SCHEMA`. Consigne : « sujet » toujours rempli depuis la liste, même si une ligne va dans un carnet existant ; genres définis par critères ; domaine toujours présent. Nouvelles fonctions `sujetAssaini` et `assainirRangerCarnet` (qui rend `sujet`).
- `src/domain/carnets/ia.ts` : `sujetLu` (titre de 6 mots au plus, jamais la phrase ; chemin rapproché du vocabulaire ; rien depuis un carnet ouvert). `lireReponse` complète avec le sujet les lignes sans carnet existant ; ce que la ligne dit elle-même prime. Elle garde aussi le `domaine` d'une ligne « Rattacher ? ».
- `scripts/banc-rangement.ts` (neuf) : 16 phrases fictives (8 de réglage, 8 tenues à part, avec leur attendu ; ni vapeur, ni Citra, ni sol) et 10 carnets « ZZ » fictifs, dont 2 du même sujet (r4, t8). Il fait les mêmes appels que `aiTask` et juge genre, domaine, chemin, titre, tâche et carnet désigné. Options : `--rejouer` sans appel, `--consigne <hash>` pour la passe « avant » sur l'ancienne consigne, `--fixtures`. Chaque réponse est gardée dès son arrivée, et le budget de la voie est cumulé depuis le journal.
- `tests/fixtures/c70-ia/avant.json` et `apres.json` : les réponses réelles, toutes fictives. `tests/unit/c70RangementIA.test.ts` : 11 tests. Ce qui est SIMULÉ y est marqué : le `sujet` de r4, faute de budget.

## Critères
- `npx vitest run tests/unit/c70RangementIA.test.ts` : 11 passed (tests.log, ignoré par Git).
- functions : `npx tsc -p . --noEmit`, sortie 0.
- `npx tsc --noEmit` : 2 erreurs, les 2 connues (GanttTask, virtual:pwa-register).
- carnets*, c48 à c69Regles et c70RangementIA : 75 fichiers, 1 867 tests passés, 3 ignorés.
- Banc réel : passe avant, réglage 3 justes sur 4 appelées (r4 rouge), tenues 0 appelée sur 8 ; passe après (consigne seule) : r4 rouge. **Score des tenues à part : non mesuré.**
- Coût : 8 appels, 0,0745 CHF au journal `work/missions/2026-11-23-carnet-en-ligne/ia-journal.jsonl` (voie c70-ia ; non commité, journal partagé). 3 réponses payées ont été perdues au premier lancement (arrêt au budget avant l'écriture du fichier ; corrigé).

## Doutes et limites
- Un appel coûte 0,0094 CHF observé : 3 500 jetons en entrée, environ 560 en sortie avec la réflexion. Le journal du test en ligne notait 0,002 par rangement, une estimation. Les 32 appels prévus coûtent environ 0,30 CHF.
- r1, r2 et r5 « avant » ont été mesurées avec 8 carnets, avant l'ajout des 2 voisins du même sujet.
- Partie app, hors de mon périmètre (rouge chez c70-tests, R83) : « Garder à part » (`garderMessageAPart`, `CarnetsVue.tsx:443`) crée le carnet avec `titreCourt(phrase)`, sans genre ni chemin. Il doit prendre `sujetLu(...)` ou le `genreCarnet`, le `chemin`, le `domaine` des lignes « Rattacher ? », que la lecture rend désormais. Le `Rattache` de `modele.ts` doit les porter.

DÉCISION À PRENDRE : budget du banc réel. Options : (A) porter la voie à 0,40 CHF cumulés (12 phrases « avant » manquantes sur l'ancienne consigne, environ 0,11 ; 16 phrases « sujet », environ 0,16), puis mesure sur les tenues ; (B) tenues seulement : 0,25 CHF cumulés (8 avant et 8 après, sans fixtures de réglage) ; (C) déployer sans mesure. Recommandation : A, réversible et dans les 3,3 CHF restants de la mission.

DEMANDE EXECUTANT : (après accord du budget, depuis la racine, dans l'ordre)
1. `npx tsx scripts/banc-rangement.ts --passe avant --ia reel --confirm-paid-ai --budget 0.40 --consigne ce2aa8b64`. Il complète les 12 phrases manquantes et écrit `voies/c70-ia/passe-avant.json`. Attendu : la ligne `PASSE avant : réglage x/8 ; TENUES À PART y/8`, sans ligne `ARRÊT`.
2. `npx tsx scripts/banc-rangement.ts --passe sujet --ia reel --confirm-paid-ai --budget 0.40 --fixtures`. Il écrit `voies/c70-ia/passe-sujet.json` et `tests/fixtures/c70-ia/r1.json` à `t8.json`. Attendu : `PASSE sujet : … TENUES À PART z/8`.
3. `npx vitest run tests/unit/c70RangementIA.test.ts --reporter=dot` : attendu 27 passed (11 + 16 rejouées).
4. Rendre les deux sorties entières des étapes 1 et 2. Je juge et je règle sur les phrases de réglage seulement ; le score se lit sur les tenues. Pas de capture : la voie est sans écran.

CONNAISSANCE : un rangement `rangerCarnet` coûte 0,0094 CHF observé (gemini-3.8-flash, réflexion basse, environ 3 500 jetons en entrée), et non 0,002. Sur une sortie structurée, un champ facultatif par ligne reste vide quand le modèle choisit une autre branche (carnet existant). Un champ requis en tête du schéma est la parade standard.

LEÇON PROPOSÉE : un budget de banc IA se chiffre sur le coût observé d'un appel réel, avant d'écrire le contrat. Ici, 0,08 CHF pour 32 appels supposait 0,002 par appel, alors que l'observé est de 0,0094. Le banc écrit chaque réponse payée dès son arrivée.
