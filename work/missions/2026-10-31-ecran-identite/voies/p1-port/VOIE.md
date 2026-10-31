# Voie p1-port — porter r4-a dans l'étape Identité de l'app (D205, D206)

Agent : auteur (Sonnet). C'est le code de l'app. Écris RESULTAT.md tôt. Charge les skills `boosters-ux`, `senior-frontend` et
`a11y-audit` avant de coder ; lis `.claude/rules/affinee-frontend.md`, DESIGN.md (rayons 10, 16 et 24 px) et `docs/ui-compacte.md`.

## Son choix (règle n° 1)
- Sur le tri, le 31.10 : « 7 · r4 · Chaque nombre est un curseur Est le meilleur, mais limite peut être un peu trop, au je veux plus
  d'ébullition, SI je change de fermenteur... Quelques adaptations mais si non c'est bien ! »
- Puis : « Aussi il faut que 7 · r4 · Chaque nombre est un curseur soit accessible en mode ordinateur, donc pouvoir modifier aussi les
  chiffre directement ».
- Sur r4-a : « ça semble vraiment bien ».

**La base est `work/missions/2026-10-31-ecran-identite/v1/r4-a/etat.html`, reprise telle quelle.** Lis NOTE.md (ses 24 éléments),
CRITIQUE.md et les captures du même dossier. L'écran de l'app reprend r4-a : ce n'est pas une interprétation libre.

## Ce qui est demandé
1. **L'étape Identité** : `src/pages/BrewWizard.tsx`, vers la ligne 2384 (`wz-volume`), et ses styles (`src/pages/recipe-wizard.css`).
   Le bloc actuel est : nom, style, Repères du style, volume, ébullition, phrase des litres évaporés, Objectif NOLO, « Choix pour ce
   brassin », matériel du plan. Il devient r4-a.
   **Rien ne se perd** : chaque fonction actuelle se retrouve dans r4-a, ou reste ailleurs avec sa raison. Fais-en la liste dans RESULTAT.md.
2. **Chaque nombre est un curseur, et se tape.**
   - La saisie suit les conventions de l'app : jamais `type="number"` ([[saisie-mobile]]), mais `inputmode`. Au clavier : Tab, ↑ ↓ pour
     ±1 L ou ±5′, Entrée pour valider, Échap pour annuler.
   - Le pointillé sous les nombres et le « › » au bout des règles se voient au repos.
   - Les règles s'étendent comme dans la maquette :
     - l'ébullition s'étend d'une demi-heure au-delà de la valeur (à 240, la règle va de 0 à 270) ;
     - le volume suit le fermenteur, la cuve et la valeur.
     Écris cette extension en fonctions pures, testées.
3. **Le fermenteur se change depuis l'écran.** La puce « fermenteur 30 L » ouvre la tuile Matériel.
   - Cherche comment l'app range aujourd'hui la capacité du fermenteur : profil d'équipement, ou choix pour ce brassin. Utilise l'existant ;
     ne crée de champ que si rien n'existe, et dis-le.
   - « ↺ profil » rend la valeur du profil. Cet écran ne modifie pas le profil d'équipement, sauf si l'app le fait déjà.
4. **Les nombres viennent du moteur.**
   - Le volume avant ébullition vient de `brewingMath.ts` (vers la ligne 557 : pertes, houblons, contraction), et non de l'addition de la
     maquette.
   - L'évaporation vient de `boilOffLPerHour` du profil.
   - Tout ce qui est simulé porte « ~ ».
5. **Ajout du pilote (D205)**, vu en jouant la maquette le 31.10 : la cuve déborde sans le dire. Avec 55 L dans un fermenteur de 60 L
   et 240 min d'ébullition, il faut ~67 L dans une cuve de 45 L. La barre de la cuve doit le dire comme le fermenteur : « +22 L de trop »
   en rouge, et une zone rouge.
6. **Toujours** :
   - le hors ligne ;
   - jamais de données réelles : des fixtures seulement ;
   - le premier plan léger, pas de cockpit ;
   - aucun texte sous 12 px ;
   - rien n'est retiré ailleurs dans l'app.

## Le registre des choix de l'app (D206)
Le registre `ecrans.json` ne couvre que la maquette houblons : y inscrire Identité casserait son contrôle, qui veut une page par écran
dans le dossier construit. Crée donc `work/refonte-frontend/v4/choix/ecrans-app.json`, au même format (`maj`, `regle`, `usage`, `ecrans`), avec
l'écran `identite` :
- `statut` : `choisi` ;
- `choix` : `r4-a` ;
- `mots` : sa phrase mot pour mot, telle qu'elle est dans SPEC-BRASSEUR.md ;
- `capture` : `…/v1/r4-a/r4-et-r4a-repos.png` ;
- `route` : `r4-a`, pour que `controle-choix.mjs work/missions/2026-10-31-ecran-identite/v1 --registre=…` lise `v1/r4-a/etat.html` ;
- `inventaire` : `…/v1/r4-a/inventaire-r4a.json`, au format de `controle-reprise.mjs` (voir
  `work/refonte-frontend/v4/ecran-1/fils15-s5-complexe/donnees/inventaire-q2b.json`).
L'inventaire porte les 24 éléments de NOTE.md, avec leurs marqueurs `data-element`. Pose ces marqueurs dans la maquette et dans l'app.

## Critères (GATES.md)
- `npm run build` : vert.
- Tes tests unitaires (extension des règles, débordement de la cuve, valeurs tapées hors règle) : verts. `npx tsc --noEmit` : sans sortie.
- `npm run lint:design` : lancé ; note sa sortie dans RESULTAT.md.
- `controle-choix.mjs --registre=work/refonte-frontend/v4/choix/ecrans-app.json` : REGISTRE OK.
- Dans RESULTAT.md, une `DEMANDE EXECUTANT :` pour Chrome, sur l'app servie en local avec des fixtures (`?dev-local`) :
  - à 390 et à 1280 px : le repos ; l'ébullition tapée à 240 ; le fermenteur à 60 L ; 55 L dans 60 L, cuve qui déborde ;
  - le parcours au clavier ;
  - les captures côte à côte, maquette et app ;
  - `scripts/agents/baseline-visuelle.mjs` sur les autres étapes de l'assistant, qui ne changent pas.

## Possède
- `src/pages/BrewWizard.tsx` (l'étape Identité seulement) et `src/pages/recipe-wizard.css` ;
- de nouveaux composants dans `src/ui/identite/`, et leurs tests dans `tests/unit/identite/` ;
- `work/refonte-frontend/v4/choix/ecrans-app.json` ;
- `work/missions/2026-10-31-ecran-identite/v1/r4-a/inventaire-r4a.json` et les marqueurs `data-element` de `v1/r4-a/etat.html` ;
- `work/missions/2026-10-31-ecran-identite/voies/p1-port/`.

Interdits : `ecrans.json`, `functions/`, `.codex/` et `source4-portable-bundle-manifest-01.json`. Pas de serveur dans l'arbre principal :
Chrome passe par l'exécutant. N'écris aucun code par heredoc ni par `node -e`. Pas de `git stash`, aucun commit. Rends une ligne.
