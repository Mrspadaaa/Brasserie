ECHEC — critères non tenus : arrêt demandé par le pilote (quota 79 %) ; diagnostic fait, aucune correction écrite

## Fichiers écrits
- Ce RESULTAT.md seulement. Aucun fichier de `src/` ni de `tests/` modifié (rien de non commité de ma part).
- Fichiers de travail hors dépôt : dossier `r177prof` dans `%TEMP%` (profils CPU et petit script `an.mjs`), `/tmp/r177-a.log` (journal complet du rejeu).

## 1. Rejeu sur HEAD (commande de la voie)
`npx vitest run hopV55Page hopV55PropertyAdviceDecision monkey YeastRecipeChoice hopV55QualifiedAdviceController hopV55QualifiedStudyController --maxWorkers=2`
- Résultat : 182 réussis, **15 échecs** sur 197 (10 fichiers sur 25), plus 1 erreur non gérée (`[vitest-worker] Timeout calling "onTaskUpdate"`). Durée 568 s. Le compte a changé : 15 et non 14.
- Les 15 échecs sont tous des « Test timed out » (15 000 ms pour 8 d'entre eux, 60 000 ms pour 2, 120 000 ms pour 1, le reste étant des dépassements du délai propre du test). Aucun n'est une assertion fausse :
  - YeastRecipeChoice : 1 (« garde le nom réel de la référence stock/libre… »)
  - hopV55PageAssistedAdvice : 2
  - hopV55PageExplorationTrial : 1
  - hopV55PageQualifiedAdviceFullCatalogue : 1
  - hopV55PageQualifiedAdviceSemanticV4 : 1
  - hopV55PageQualifiedAdviceStudy : 1
  - hopV55PageQualifiedProductStudy : 1
  - hopV55PropertyAdviceDecision : 4 (1 de plus que dans l'issue)
  - hopV55QualifiedAdviceController : 1 (« ne persiste pas une préférence… »)
  - monkey : 2 (graines 11 et 99, « survit à 250 gestes au hasard », timeout, pas d'action fautive relevée)

## 2. Classement (preuve seulement pour le contrôleur ; les autres non rejoués seuls, faute de temps)
- `hopV55QualifiedAdviceController` « ne persiste pas une préférence » : **coût de calcul réel, pas un simple délai**.
  - Seul, avec `--testTimeout=120000` : passe en ~20 s (limite : 15 s). En suite avec les 6 autres tests du fichier : 18 s en échec, les autres tests du fichier prennent 6 à 12 s chacun.
  - Profil CPU du worker (22,9 s) : `structuredClone` 3,3 s ; SHA-256 `@noble/hashes/sha2.js` 3,1 s ; `canonical` + `sameCanonicalData` + `isPlainCanonicalData` dans `src/services/hopV55/operationScopedQualifiedValidation.ts` (lignes ~89, 123, 150) environ 6,5 s en temps propre ; GC 2,6 s ; `hopAdviceContentReference` (`src/domain/hopDecision/adviceContentReference.ts`) ~1,4 s. Le travail est donc dominé par la comparaison canonique profonde et le hachage répétés sur de gros objets (catalogue complet), pas par une attente.
  - Hypothèse (non prouvée) : les 14 autres échecs ont la même cause, car ils passent tous par la préparation d'étude qualifiée de V5.5 (Q03/Q09, catalogue). YeastRecipeChoice (le test le plus lent du lot : 68 tests, 137 s) et monkey sont probablement du même ordre (volume de jsdom + rendus), à vérifier un par un.
- Aucun test classé « périmé » pour l'instant : aucun ne montre d'assertion obsolète.

## 3. Ce qui reste (rien de corrigé)
1. Rejouer chaque fichier seul avec `--testTimeout=120000` pour confirmer « passe seul / échoue en suite » et séparer les cas.
2. Voie principale suggérée : réduire le coût dans `operationScopedQualifiedValidation.ts` (mémoïser `canonical` et le hachage par référence d'objet, éviter `structuredClone` répétés) avec un test qui borne la durée ; c'est un défaut de performance du code V5.5, dans le périmètre « Possède ».
3. Sinon (moins bien) : fixer une durée explicite par test lourd (3e argument de `it`), ce qui allonge le délai au lieu de le rendre déterministe — contraire à la consigne de la voie.
4. Monkey graines 11 et 99 : cause non trouvée (timeout 250 gestes). À rejouer seul avec un délai large pour voir si une action précise bloque.
5. Critères non lancés : `npm test -- --maxWorkers=2` en entier (deux fois), `verifier.mjs` de T3, `npm run build`. Rien n'est tenu.

## Machine
La suite tourne à 20 cœurs mais la commande dure ~9,5 min ; la charge d'autres voies a pu gonfler les durées (non mesurée).

DÉCISION À PRENDRE : traiter ces 15 timeouts par une optimisation du code V5.5 (recommandé : mémoïsation de la comparaison canonique/hachage, gain attendu important, fichier dans le périmètre) ou par des délais plus longs par test (rapide, mais ne rend pas la suite déterministe et ne règle pas le fait que la suite dure ~10 min). Aucun test à retirer.
CONNAISSANCE : le coût des tests V5.5 vient de `operationScopedQualifiedValidation.ts` (canonique + SHA-256 + structuredClone), mesuré par profil CPU du worker le 26.10 ; `NODE_OPTIONS=--cpu-prof` avec `--pool=threads --poolOptions.threads.singleThread=true` livre le profil du worker (en `forks`, il n'est pas écrit).
LEÇON PROPOSÉE : aucune
