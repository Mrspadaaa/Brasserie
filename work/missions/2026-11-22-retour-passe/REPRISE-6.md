# REPRISE-6 — Frise du temps du Calendrier (22.11, Opus, arrêt à 150 k)

Worktree `port-carnet`, partagé : commit par index temporaire (GIT_INDEX_FILE=$(git rev-parse --git-dir)/idx-x, read-tree HEAD, git add de ses
chemins, commit, puis `git reset -q HEAD -- <chemins>`). Règle de test : clair seul, 390×660 et 844×340 tactiles d'abord, 1280 en simple contrôle.

## Fait
- **4ce895e88** — T9-2. Cause sur tour9 : le passé s'arrêtait au solde d'ouverture (ses données : S47 → « bute sur S47 »), levé depuis par
  c32e6491d (CAL-RETOUR-PASSE). Sur l'arbre, deux défauts vus au doigt immobile : (a) l'étiquette lisait l'année contre la 1re semaine de la
  courbe (un an avant) : « S47 – S52 2026 » après un recul d'un an, identique à l'étiquette d'avant ; `etiquetteCadre` prend `aujourdhui`
  (EnTete le passe) : « S47 2025 – S46 2026 » ; (b) la fenêtre montait à 58 sem. sous « An » (frise de 12 mois, cadre plus long) : un bout
  tiré ne dépasse plus 52 sem., l'autre suit. Contrôle `sectionT9` « T9-2 immobile » (aucun touchMove 3 s) : rouge sur tour9 (13 sem.,
  S34), vert sur l'arbre (46 sem., 52 pts). Capture ouverte : C:/tmp/rp/t92-arbre/calendrier-390-clair-t9-2-debut-immobile.png (cohérente).
- **Point 2 (T9-1 tremblant), NON COMMITÉ au moment de l'arrêt** : chemins `src/ui/geste/moteur.ts` (`armerSens`, hystérésis 6 px),
  `src/ui/geste/useGlisse.ts`, `src/ui/calendrier/frise/usePointeur.ts` (armerSens ; champ `R` : un doigt au-delà de la dernière colonne la vise
  encore, jamais une colonne hors fenêtre — la chose tombait une semaine après la fenêtre au doigt à x = 389), `scripts/parcours/geste.mjs`
  (variantes « T9-1 tremblant bande » 8 ms et « écran » x = largeur − 1, 16 ms, chacune rendue par « Annuler » ; T9-2 recul en semaines
  absolues avec l'année de l'étiquette ; regex d'étiquette avec les deux années). Banc : tour9 rouge (fenêtre 6 → 6 sem. aux deux variantes),
  arbre vert (C:/tmp/rp/t91-arbre.log, PARCOURS GESTE OK, sectionT9). Vitest complet lancé (tâche de fond bn5ngiscd / b3lnu99c8) : LIRE son
  résultat (unit + integration), puis committer ces 4 chemins (message : « T9-1 : doigt tremblant au bord… », Co-Authored-By Opus 5.5).
  À faire avant : un test vitest de `armerSens` (tremblement ±1 px ne retourne pas le sens ; retour de 7 px le retourne).

## Point 3 : calPasseG3 rouge — attribué, pas corrigé
`tests/integration/calPasseG3.test.tsx` « en 6 semaines, au banc » : `bornes(...)` undefined dans `fenetreDePeriode` via CalendrierTab l. 259
(`periodeEnTete`, fenêtre locale de CAL-PERIODE-APP-FIXE, 4bfa47018 / 85b4cb6f0). Le test passe `callbacks={{ periode: () => ({…}) }}` : une
FONCTION, lue comme une période sans `genre`. Hors de la frise : cause dans l'interface banc/test (ou CalendrierTab doit refuser une période
sans genre). Garde simple possible : `fenetreDePeriode` rend `null` si `bornes(periode)` est indéfini. À trancher par la voie du banc.

## Reste dans l'ordre
1. Committer le point 2 (après vitest). 2. Épreuve au doigt complète avec `C:/tmp/rp/ep/ep.mjs` (build C:/tmp/rp/b-arbre est À JOUR du point 2),
390×660 puis 844×340 : glisser le cadre, tirer chaque bord, 1 sem./7 sem./30 sem./An, reculer loin et revenir, avancer loin, recharger,
annuler, barre hors cadre, date dans la fiche, menu du + ; une capture ouverte par geste, côte à côte avec
Brasserie work/missions/2026-11-20-frise/frise-interactive.html → Brasserie work/missions/2026-11-22-frise-epreuve/EPREUVE.md. `lire()` de
ep.mjs lit maintenant la bulle de tirage (`tir`) et l'aria du cadre. 3. Bancs complets en arrière-plan sans timeout :
`node scripts/parcours/calendrier.mjs …` et `node scripts/parcours/geste.mjs C:/tmp/rp/gfull --build C:/tmp/rp/b-arbre --endroits calendrier`
(sortie filtrée KO|PARCOURS). 4. BUGS.md Brasserie (T9-1, T9-2, T9-3, CAL-FRISE-ETIQUETTES, CAL-AN-390 rangées) puis `controle-bugs`.

LEÇON PROPOSÉE : un doigt de banc « tenu » se joue immobile (aucun touchMove) ET tremblant (±1 px à 8-16 ms) ; le toucher régulier toutes les
100 ms a masqué T9-1 et T9-2 deux passes durant. Une étiquette qui ne change pas après un geste qui a changé la fenêtre est un défaut.
