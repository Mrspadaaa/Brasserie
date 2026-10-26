ECHEC — 197/197 tests verts mais exit 1 (erreur non gérée « Timeout calling onTaskUpdate ») ; suite complète non verte (6 fichiers hors voie)

## Ce qui est tenu
- Commande de l'issue : **197 sur 197, 0 échec** (essais verts : 26.10 après corrections, 2 passages, 10 min chacun, 2 workers). Au départ 15 échecs sur 197 (pas 14), 10 fichiers.
- `npm run build` : vert (exit 0, 1 min).
- Gemini : jamais appelé (aucun changement là).
- Aucun test supprimé, `skip` ou `todo`. Aucune assertion modifiée.

## Ce qui n'est pas tenu
1. **La commande sort avec le code 1** malgré 0 échec : « Unhandled Error — [vitest-worker]: Timeout calling "onTaskUpdate" », deux fois de suite. Cause : deux tests de `hopV55PageAssistedAdvice` (« tour froid ») bloquent le worker plus de 60 s en calcul synchrone (95 s et 127 s mesurés), donc l'échange avec le processus principal expire. Pour le lever : (a) réduire le calcul de ces deux tests (voir « Reste »), ou (b) toucher `vitest.config.ts` (`teardownTimeout`/RPC), fichier hors Possède : non fait.
2. **`npm test -- --maxWorkers=2` complet** : 1 seul passage (25 min, 1487 s) : 7864 réussis, **8 échecs**, hors du périmètre des 10 fichiers sauf un :
   - `tests/integration/hopStudy.test.ts` (« Collection invalide : hopBeerMaverickFiches ») et les 6 tests de `prototypes/houblons-v4/tests/` (client-async ×3, donnees, pack, worker-calculs : empreintes du moteur) : portent sur les données hop v4 / Beer Maverick, périmètre de la voie **d2-import-bm** (fichiers de données en cours de modification). Non vérifiés sur HEAD nu (pas de `git stash` autorisé) : je ne les ai pas causés (aucun fichier de `src/domain/hopIndex`, `src/data` touché par moi).
   - `hopV55PageQualifiedAdviceStudy` (le test à 60 s explicite, 59 s mesurés) : corrigé ensuite (plafond 240 s, délais d'attente 60 s) ; passe dans les deux passages de la commande.
   Le deuxième passage complet n'est pas fait (25 min, et la suite ne peut pas être verte tant que d2 n'a pas fini).
3. **`verifier.mjs` de T3** : lancé une fois en parallèle de ma commande (donc sous charge) : « pile et retours 13/13 verts », puis `PILE ECHEC (1)` car il rejoue la suite complète (7 tests, 10 fichiers en échec, dont les fichiers de d2 et des délais par contention). À relancer seul une fois d2 terminé.

## Classement des 15 échecs de départ
Tous étaient des « Test timed out » ou des attentes (`findBy`) de 1000 ms ; aucun n'était une assertion fausse, aucun test périmé.
Preuve : rejoués avec `--testTimeout=120000`, 11 passent seuls ; les 4 autres (ProductStudy 1, FullCatalogue 1, AssistedAdvice 2) échouaient sur des attentes `findBy` de 1 s par défaut ou de 15 s explicites, ou sur des plafonds de 60 s/120 s dépassés.
- **Trop de calcul, même seul** (pas un simple délai de suite) : `hopV55QualifiedAdviceController` (20 s seul pour 15 s), YeastRecipeChoice (21 s), monkey graines 11 et 99 (17 s chacune ; **aucune action ne bloque** : 250 gestes en jsdom, la graine 3 prend 14,6 s ; cause = volume de calcul, pas une panne de l'app), PropertyAdviceDecision ×4, ExplorationTrial, SemanticV4, QualifiedAdviceStudy, AssistedAdvice (1).
- **Attente de 1 s trop courte** : ProductStudy (2 tests : « Étude préparée »), AssistedAdvice (`rereadArchivedQuestion`), FullCatalogue (retry préparation à 53 s).
- **Défaut réel de code** : aucun trouvé. Un coût de performance mesuré (profil CPU du worker) : validation canonique + SHA-256 + `structuredClone` répétés sur de gros dossiers (`operationScopedQualifiedValidation.ts`, `workspaceRepository.ts` parse, `assistedAdviceController.ts` `validateTicket`/`ticketReference`, `domain/hopDecision/adviceContentReference.ts`).

## Corrections faites (non commitées)
Source (1 fichier) :
- `src/services/hopV55/operationScopedQualifiedValidation.ts` : `hopV55QualifiedContentReference` garde 8 clones gelés + leur référence ; une entrée n'obtient un résultat que si `sameCanonicalData` la prouve égale à un clone (jamais l'identité), les échecs ne sont jamais mémorisés, la voie d'origine reste en secours. Les références restent octet pour octet celles de `hopAdviceContentReference` (test ajouté). Gain mesuré : test contrôleur Q09 de 63 s à 41 s en suite. Insuffisant seul pour les tests « tour froid ».
Tests (attentes d'un état, plafonds explicites, aucune assertion changée) :
- `configure({ asyncUtilTimeout: 30_000 })` + `vi.setConfig({ testTimeout: 60_000 })` dans AssistedAdvice, FullCatalogue, ProductStudy ; délais explicites 15 s à 60 s dans ces fichiers, SemanticV4, QualifiedAdviceStudy, PropertyAdviceV4 ; plafonds par test relevés à 240 s ou 300 s là où ils existaient (AssistedAdvice tours froids 300 s, FullCatalogue, ProductStudy, SemanticV4, QualifiedAdviceStudy).
- `vi.setConfig({ testTimeout: 120_000 })` dans YeastRecipeChoice, monkey (+ import de `vi`), hopV55QualifiedAdviceController, hopV55PropertyAdviceDecision, ExplorationTrial, SemanticV4, QualifiedAdviceStudy. Ce sont des plafonds sur du calcul pur (aucun état à attendre) : c'est allonger le délai, ce que la voie préfère éviter ; assumé faute de mieux, motif ci-dessus.
- Test ajouté : `tests/unit/hopV55ReferenceMemo.test.ts` (4 tests : même référence que la voie d'origine, jamais l'identité crue, préfixe et refus des non finis, durée d'une relecture à contenu égal sur un catalogue de 318 fiches : coût hors copie < 1/3 du premier calcul).
- `tests/unit/hopV55QualifiedStudyPerformance.test.ts` (30 tests, ils comptent les validations) reste vert.

## Essayé et abandonné
- Mémoïser `verifyCreateCommand` (qualifiedStudyWorkspace.ts) : gain de 63 s à 34 s sur le contrôleur, mais **casse 4 tests existants** qui comptent les validations strictes (et le module déclare « pas de cache à l'échelle du processus ») : retiré.
- Mémoïser `hopAdviceContentReference` côté domaine : plus lent (le clonage à chaque défaut coûtait 32 s) : retiré ; domaine inchangé.

## Reste (par ordre)
1. Faire sauter l'erreur « Timeout calling onTaskUpdate » : réduire le calcul synchrone des deux tests « tour froid » de `hopV55PageAssistedAdvice` (95 s et 127 s). Profil : `hopAdviceContentReference` 48 s sur ~100 s, via `readHopV55AssistedAdviceTicketV1` → `validateTicket`/`ticketReference` et `readHopV55DecisionReadingArchive` rejoués à chaque lecture du workspace. Piste : certificat par ligne lue dans une même passe (comme `qualifiedPreparationRowCertificates`), sans cache de processus.
2. Deuxième passage de la commande et deux passages de `npm test` complet, une fois d2 fini (ses 7 échecs de données).
3. `verifier.mjs` de T3 seul, hors charge.

DÉCISION À PRENDRE : l'erreur de worker (exit 1) se règle soit en réduisant le calcul des tests « tour froid » (long, dans `assistedAdviceController.ts`, recommandé), soit en relevant le délai RPC de vitest dans `vitest.config.ts` (hors de ma voie ; une ligne, mais cache le coût). Recommandation : la première, voie dédiée.
CONNAISSANCE : sur ces tests, 1 s de `findBy` par défaut est trop court dès que la préparation Q09/Q03 passe par la validation canonique de gros dossiers ; le profil du worker s'obtient avec `NODE_OPTIONS=--cpu-prof --cpu-prof-dir=…` et `--pool=threads --poolOptions.threads.singleThread=true`.
LEÇON PROPOSÉE : aucune
