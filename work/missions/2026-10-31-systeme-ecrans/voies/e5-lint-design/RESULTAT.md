OK — `npm run lint:design` tourne (outil Google 0.4.0 isolé + 2 contrôles maison), 0 erreur, sortie gardée.

## Fichiers écrits
- `tools/design-lint/package.json` (`@google/design.md` épinglé `0.4.0`), `tools/design-lint/package-lock.json` (93 paquets, gardé).
- `tools/design-lint/lancer.mjs` : lance l'outil Google, puis `verifier-extra.mjs`, code de sortie 1 si erreur de l'outil ou chemin cité absent.
- `tools/design-lint/verifier-extra.mjs` : (1) chemins de fichiers cités dans DESIGN.md (accents graves, liens `.md`) ; (2) contraste WCAG des composants du YAML, y compris le texte posé sur la surface quand le fond est transparent (l'outil Google saute ce cas).
- `.gitignore` : ligne `tools/design-lint/node_modules/` (déjà couvert par `node_modules/`, `git check-ignore` le confirme).
- `package.json` : une ligne, `"lint:design": "node tools/design-lint/lancer.mjs DESIGN.md"`.
- `DESIGN.md` : une correction mécanique, ligne 429 : « `index.css` » devenu « `src/index.css` » (seul fichier de ce nom, `git ls-files`). Aucune règle touchée.
- Voie : `sortie-lint-design.txt` (sortie complète de `npm run lint:design`, code 0).

## Critères
- `npm run lint:design` : exit 0, sortie lisible (voir `sortie-lint-design.txt`). Dernières lignes : `OUTIL GOOGLE : 0 erreur(s), 18 avertissement(s), 1 info(s)` ; `EXTRA OK` ; `LINT DESIGN OK`.
- Le contrôle de chemins échoue bien sur une version cassée (copie temporaire avec `src/inexistant.css` : `CHEMIN ABSENT`, exit 1).
- node_modules racine : `node_modules/@google` n'existe ni avant ni après ; `ls node_modules | md5sum` identique (6cab2559…, 704 entrées).
- `git status` pour mes chemins : `.gitignore`, `DESIGN.md`, `package.json`, `tools/` (package.json, lock, 2 scripts), la voie. Rien d'autre touché (les autres modifications de l'arbre ne sont pas les miennes).
- Licence : fichier `LICENSE` du paquet installé = Apache 2.0 (le `package.json` du paquet n'a pas de champ `license`).
- Essais : 1 par critère.

## Lecture de l'outil
`lint` ne lit que le YAML d'en-tête (jetons) : 7 règles (références cassées, `primary` absent, contraste des composants, jetons orphelins, ordre de sections, etc.). Sortie JSON ou texte ; exit 1 seulement sur erreur. Appliqué à `docs/ui-compacte.md` : il l'accepte mais avertit « No YAML content found » (ce guide n'a pas de jetons) : sans valeur, je ne l'ai pas branché au script. Les titres de sections non reconnus (les nôtres, en français, plus « Concevoir pour comprendre ») sont acceptés sans avertissement `section-order`.

## Tri des signalements
**Erreurs réelles** : 0 pour l'outil. Une trouvée par mon contrôle de chemins : `index.css` sans dossier (corrigé, `src/index.css`). Les 11 autres chemins cités et les 2 liens `docs/ui-compacte.md` existent.

**Désaccords de format** (ni correction ni contournement) :
- `missing-primary` : nos jetons s'appellent `cave-*`, `ebc-*`, `area-*`, pas `primary`.
- `orphaned-tokens` x17 : cave-800, 700, 600, 400 ; ebc-gold, amber, copper, brown, stout ; area-production, finances, stocks, agenda ; attention ; alert-strong ; hop ; water. Seulement 5 composants déclarés dans le YAML, 7 couleurs référencées sur 24. Les vrais usages sont dans la prose et le code.

**Questions de fond pour le pilote** (rien changé) :
1. `button-danger` : le YAML donne `textColor: {colors.alert}` = `#D6453D`, 4,09:1 sur la surface `cave-900` en cave (sous 4,5:1). La prose (l. 195) dit pourtant que le texte d'alerte en cave est `#DC5F58` pour tenir 4,5:1 : le YAML contredit la prose. Piste : un jeton `alert-text` à `#DC5F58`, ou lire le YAML comme l'aplat seulement.
2. Le YAML porte les valeurs du thème cave, mais le thème par défaut est le clair (note l. 90 à 111). Un agent qui lit seulement les jetons voit le sombre. Les valeurs du clair sont dans un tableau de prose, hors de portée du lint.
3. Seuls 5 composants au YAML, alors que la section Components en liste 8 (`QuantityStepper`, `SliderField`, `CycleTag`, `PresetChips`, `NumberInput`…) : le lint ne peut rien dire du reste.
4. Les contrastes du clair ne sont contrôlés que par `scripts/theme/contraste.mjs`, jamais par ce lint.

## Comment le brancher (proposition, rien écrit)
- À la main : `npm run lint:design` après toute édition de DESIGN.md (déjà possible).
- `scripts/agents/systeme.mjs` : ajouter une vérification `design` qui lance `node tools/design-lint/lancer.mjs` quand `DESIGN.md` apparaît dans `git status`, et échoue sur le code 1. Peu coûteux (moins d'une seconde) ; recommandé.
- GATES d'une voie d'interface : une ligne `CHECK: npm run lint:design` / `EXPECT: LINT DESIGN OK`, seulement pour les voies qui modifient DESIGN.md ou ses jetons. Pas pour les voies d'écran : le lint ne voit pas le rendu.
- Je ne l'ajouterais pas à `npm test` : l'outil vit dans un dossier à part, absent d'un clone neuf tant que `npm install --prefix tools/design-lint` n'a pas été lancé (le script le dit en cas d'absence, exit 2).

## Doutes et limites
- Le paquet est en `alpha` (README) ; les règles peuvent changer à la montée de version, d'où l'épinglage exact.
- `tools/design-lint/node_modules` doit être réinstallé dans chaque worktree.
- Le contrôle de chemins ne couvre pas les noms nus autres que `index.css/html` et `MAJUSCULES.md`.

DÉCISION À PRENDRE : question de fond 1 (alert en texte, 4,09:1). Options : (a) ajouter un jeton `alert-text` `#DC5F58` au YAML et pointer `button-danger` dessus ; (b) laisser tel quel et accepter l'avertissement. Recommandation : (a), c'est ce que dit déjà la prose ; mais c'est une règle de DESIGN.md, donc au pilote.
CONNAISSANCE : l'outil Google 0.4.0 ne lit que le YAML ; il ne vérifie ni la prose ni les contrastes du thème clair, ni un fond transparent.
LEÇON PROPOSÉE : aucune
