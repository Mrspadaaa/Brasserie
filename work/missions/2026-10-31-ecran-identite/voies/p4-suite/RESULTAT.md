ECHEC — monkey graine 3 (assistant) : règle d'Identité sans borne, corrigée ; npm test encore bloqué par un 2e OOM, dans src/ui/fermentescibles/Plateau.tsx (voie Malts)

## Où on en est (mis à jour après l'ouverture du Possède)
- **G1** COMPRIS OK. **G2 tenu** (`MONKEY OK`, 6 graines, 103 s). **G3 tenu** (NOTE OK). **G4 tenu** (68 fichiers, 425 tests, EXIT 0, 634 s). **G5 tenu** (TYPES OK). **G6 tenu** (`built in 23.87s`).
- **G7 non tenu** : la suite entière meurt encore (FATAL), mais plus à cause du singe. Deuxième cause, hors de ma voie : voir « Deuxième OOM ». Plus 6 à 9 tests rouges de la voie Malts.
- **G8** : voir la fin.

## Le geste fautif (inchangé)
Le FATAL n'était PAS la graine 42 de l'atelier de l'eau (elle passe seule : 9 s, 450 Mo). C'était le singe de l'**assistant, graine 3, tour 249**
(`clic Retour`, étape Fermentescibles vers Identité). Tas 556 Mo au tour 248, 4 083 Mo une minute plus tard, FATAL. Vitest n'imprime un test qu'à sa fin :
le dernier test vert affiché (graine 7) a fait croire à la graine 42.
Avant, tour 213 : `champ Ébullition ← 999999999999` dans la cellule « Ébullition » de la fiche (`BrewSheet.tsx`, `min={0}`, sans `max`). La durée passait à 10^12 min.

## Cause et corrections appliquées
1. `src/ui/identite/regles.ts` — `graduations()` bouclait de 0 à `max` par `etiquette`, sans borne : 1,7 × 10^10 `<span>` pour une règle de 10^12 min.
   Correction : `GRADUATIONS_MAX = 200` ; au-delà de 200 chiffres, l'étiquette grandit (multiple de l'étiquette d'origine), le « dernier » reste unique. Règles ordinaires
   inchangées (`graduations(150,30)` → 0…150 ; `graduations(65,10)` → 0…60).
2. `src/ui/BrewSheet.tsx` — cellules « Volume » (`max={VOLUME_SAISIE_MAX}` = 2 000 L) et « Ébullition » (`max={EBULLITION_SAISIE_MAX}` = 1 440 min) : **les mêmes constantes que les champs de l'étape
   Identité**, importées de `regles.ts`, par le mécanisme que la cellule avait déjà (`max` passé à `NumberInput`, borne appliquée à la sortie du champ, la valeur ramenée s'affiche dans le champ,
   comme l'alpha à 30 % ou les durées à 100). Je n'ai pas pris 240 min : le dépôt a déjà deux sources, 1 440 (Identité) et 480 (simulateur d'ébullition de `BrewAssist`) ; 240 refuserait dans la fiche
   ce que l'Identité accepte. Si le pilote veut 240, c'est la constante `EBULLITION_SAISIE_MAX` qu'il faut changer, pour les deux écrans à la fois.
   Limite : la borne s'applique à la sortie du champ (comportement de `useNumericDraft`, voulu : « appliquer à la frappe rendait des valeurs inatteignables »). Pendant la frappe, l'état reçoit la valeur
   brute ; c'est pourquoi le plafond de `graduations` reste la garde qui compte (un geste qui change sans quitter le champ, comme le singe).
3. `tests/integration/monkey.test.tsx` (harnais seulement) — un `await rendreLaMain()` (un tour de boucle, `setTimeout 0`) avant chaque graine. Cause : une fois la mémoire guérie, les 6 tests passaient
   mais Vitest sortait en code 1 avec « Timeout calling "onTaskUpdate" » : 80 à 100 s de calcul synchrone d'affilée, sans tour de boucle, privaient le worker de répondre à Vitest. Aucune graine, aucun geste,
   aucune assertion ni plafond n'a changé (G3 : NOTE OK). Avant : exit 1 trois fois de suite ; après : exit 0, `MONKEY OK`.

## TEMOIN AVANT
- `tests/unit/regleBornee.test.ts` (3 tests), sur l'ancien code : `× garde un nombre borné de chiffres… → expected 166668 to be less than or equal to 250` (2 autres verts). Après : 3 verts.
- `tests/unit/identite/saisieDemesuree.test.tsx` (3 tests, neuf). Avec les deux `max` de `BrewSheet.tsx` retirés : `× Ébullition 999999999999 … expected '999999999999' to be '1440'` et
  `× Volume 999999999999 … expected 999999999999 to be 2000` ; avec les `max` : 3 verts. Le 3e test (règle d'ébullition et de volume rendues avec 999 999 999 999 sans passer par le champ, ≤ 250 chiffres,
  pas de NaN) emporterait le processus sur l'ancien `graduations` : il ne peut pas être « rouge » sans épuiser le tas, c'est le même cas que le singe.
- Le singe lui-même est le témoin d'intégration : FATAL avant, 6 graines vertes après.
- Tests voisins rejoués : `tests/unit/identite` (7 fichiers), `recipeRecapReview` (BrewSheet) : 133 tests verts.

## Les autres appelants de `graduations` et les cellules sans borne (point 3 du coordinateur)
- Seul appelant : `Regle.tsx:7`, lui-même utilisé par `CarteVolume.tsx:137` (volume) et `CarteEbullition.tsx` (ébullition). Les entrées de `etendreVolume` : volume (corrigé), `capaciteL` (champ d'Identité borné à 2 000, réglages
  `BrewhouseSettings.tsx:114` borné 1–10 000), `cuveL` (`kettleWorkingL`, réglages bornés à 10 000). Avec le plafond de `graduations`, même 10 000 L donne 200 chiffres.
- Autres chemins qui posent `volumeL` / `boilMin` sans borne, **non corrigés** (ils n'alimentent `graduations` que par le plafond désormais en place) : l'import d'une recette collée
  (`BrewWizard.tsx:1357`, `setBoilMin(r.boilMin)`), la restauration d'un brouillon. À borner à l'entrée de l'import si le pilote le veut.
- Bornes déjà présentes ailleurs : `BrewAssist` « Ébullition totale » 1–480, alpha 0–30 (BrewSheet), `NumberField` du simulateur.

## Deuxième OOM (hors de ma voie) : `fuzzSaisie.test.tsx`, voie Malts
En rejouant la suite entière après G2, un 2e FATAL est apparu. Sonde (reporter `reporter-debut.mjs` : fichiers démarrés mais non finis, puis un fichier seul en `--reporter=verbose`) :
`tests/integration/fuzzSaisie.test.tsx`, test « Fuzz — l'assistant de recette » (HOSTILES contient `999999999999`).
Cause prouvée (mock de `pmax`, pile capturée) : `pmax(999999999999)` appelé par `echelleDe`, `EtapeFermentescibles.tsx:87` (rendu ligne 200). Puis `Plateau.tsx:48` boucle
`for (v = 0; v <= M; v += pasG)` sans borne : avec M = 1,5 × 10^12 kg et un pas de 1 kg, 10^12 `<i>` — le même défaut que `graduations`, dans le fichier non suivi `src/ui/fermentescibles/` de la voie Malts.
Correctif proposé à cette voie (je n'y touche pas : hors Possède, en cours d'écriture par un autre agent) : plafonner la masse saisie au champ (`ChampLigne` de « Masse de … en kg » : max réaliste, par exemple
la borne que `setKg` accepte) ET plafonner la boucle de `Plateau.tsx` (`pasG` agrandi pour ne pas dépasser ~200 graduations, comme `GRADUATIONS_MAX`). Preuve de la cause : `sonde` supprimée, `pmax.log` conservé dans ce dossier.
Rejoué sans correctif : le test meurt en 74 s, FATAL.

## Les 6 tests rouges de G7, sur HEAD (point demandé)
Copie de HEAD (`git archive` des fichiers `src`, `functions/src`, `tests/{setup,helpers,fixtures}`, vitest.config, 4 fichiers de test) dans le dossier de travail de la session, node_modules par jonction, arbre jamais touché :
`recipeEditing`, `dataEntry`, `brewWizardDraftFreshness`, `recipeWizardSafety` — **4 fichiers, 116 tests, tous verts sur HEAD**. Les rouges viennent donc du port Malts en cours
(le champ « Ajouter un fermentescible » a changé), pas de HEAD. Liste actuelle sur l'arbre (dernier passage) : `recipeEditing` 2, `dataEntry` 2, `brewWizardDraftFreshness` 2, `recipeWizardSafety` 1,
et `hopV55RecipeColdContactWorkbench` 3 (REV-WIZ M1, M2 et un test sur les écarts de source : même cause supposée, non rejoué sur HEAD).

## hopV55 (inchangé)
68 fichiers, 425 tests, vert : en séquence (1 192 s), à deux workers (612 s, puis 634 s après mes changements). Aucun n'épuise le tas. Cinq fichiers sont lourds par nature (catalogue entier) :
`hopV55PageAssistedAdvice` 2 681 Mo, `…PageQualifiedProductStudy` 2 184, `…PageQualifiedAdviceFullCatalogue` 1 934, `…PageQualifiedAdviceStudy` 1 922, `…PageQualifiedAdviceSemanticV4` 1 891 ; plafond Node 4,1 Go. Pas de hausse du tas.

## Fichiers touchés
Fichiers touchés : `src/ui/identite/regles.ts`, `src/ui/BrewSheet.tsx`, `tests/integration/monkey.test.tsx` (harnais : un `await` avant chaque graine), `tests/unit/regleBornee.test.ts` (neuf),
`tests/unit/identite/saisieDemesuree.test.tsx` (neuf), ce dossier (COMPRIS.md, RESULTAT.md, `reporter-debut.mjs`, `debuts.log`, `pmax.log`, journaux `sonde-42.log*`, `hop-seq.log`, `g4*.log`, `g7*.log`).
Non touchés : `SaltSolver.tsx`, `vitest.config.ts`, `BrewWizard.tsx`, `src/ui/fermentescibles/`, tout `hopV55*`. Copies jetables supprimées (`sondep4.test.tsx`, `sondefz.test.tsx`).

## Essais utilisés
G2 : 4 passages après correction (3 avec « Timeout onTaskUpdate », puis exit 0 après le `await`). Le correctif du tas a tenu du premier coup.

## DÉCISION À PRENDRE
Le plafond de la masse dans l'étape Fermentescibles (voie Malts, `Plateau.tsx:48`, `EtapeFermentescibles.tsx:87`) : à faire par cette voie ou à m'ouvrir (`src/ui/fermentescibles/Plateau.tsx`). Recommandation : la voie Malts, en
même temps que ses tests rouges ; `fuzzSaisie.test.tsx` est son témoin. Tant que ce n'est pas fait, `npm test` entier ne se termine pas.

## Doutes et limites
- `npm test` entier n'a pas pu être rejoué jusqu'au bout : il s'arrête au FATAL de `fuzzSaisie`. Les fichiers qui passent après lui n'ont donc pas été comptés (le hasard de l'ordre en fait environ 250 sur 780 vus).
- 240 min / 1 440 min : voir point 2 ; le choix est dans une constante.
- La borne de `BrewSheet` ne vaut qu'à la sortie du champ ; un import ou un brouillon peut encore poser une durée démesurée, que `graduations` absorbe désormais.

CONNAISSANCE : toute règle graduée dessinée en JSX par une boucle `for (v = 0; v <= max; …)` doit plafonner son nombre d'éléments ; un champ numérique borné à la sortie (`useNumericDraft.settle`) laisse passer la valeur brute pendant la frappe. Deux fichiers ont eu le même défaut en un jour (`regles.ts`, `Plateau.tsx`).
LEÇON PROPOSÉE : (1) attribuer un FATAL au test en cours, pas au dernier test vert imprimé : une sonde (reporter qui écrit début/fin de fichier en synchrone) le désigne en un passage. (2) Après avoir guéri un OOM, rejouer la suite entière avant de dire « fini » : un 2e défaut du même genre peut se cacher derrière le 1er.
