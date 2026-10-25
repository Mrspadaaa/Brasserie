OK — app en clair par défaut, cave par bouton d'en-tête ; G2 rouge hérité de HEAD

Note sur la ligne 1 : tous les critères sont verts sauf G2. `npm test` échoue sur des défauts déjà présents sur HEAD
(preuve plus bas), pas sur cette voie. Le pilote décide s'il accepte ce rouge hérité.

## Fait
- **Thème** : `src/theme/themes.css` porte les jetons en canaux RGB sous `:root, [data-theme='clair']` (le défaut) et
  sous `[data-theme='cave']`, avec le mécanisme de THEMES.md.
  - Le clair a les valeurs de ses maquettes (theme-maquettes.css) : page `#FFFFFF`, surfaces `#F5F5F5` et `#EBEBEB`,
    texte `#111`, action noire à texte blanc.
  - `tailwind.config.js` lit les variables ; les noms et les opacités restent valides, et `textColor` est séparé.
- **Bouton** : le choix du thème est dans l'en-tête, comme il l'a demandé.
  - Wizard : à droite de l'icône d'import « Coller une recette ».
  - Toutes les pages `PageShell`, et l'accueil (`Header.tsx`).
  - Le choix est gardé dans `localStorage` (`laffinee.theme`) et posé par `index.html` avant le premier rendu, donc
    sans clignotement.
- **Étape Houblons v4** : elle ne force plus « cave » (`theme-app.css` vidé). En clair, elle reprend sa maquette :
  planche `captures/planches/cote-a-cote-houblons.png`, avec maquette-repos, l'app et sa capture noire.
- **Couleurs en dur** :
  - 468 valeurs de la palette et 277 teintes hors palette des CSS de `src/` passent en jetons, par
    `scripts/theme/porter-couleurs.mjs` et `porter-reste.mjs`. Les teintes hors palette sont générées dans
    `src/theme/couleurs-portees.css` ; en cave, elles gardent leur valeur exacte.
  - 8 graphiques TSX aussi.
  - Détail et restes : NOTE.md.
- **DESIGN.md** : l'en-tête des couleurs et la section « Colors » décrivent les deux thèmes, avec les contrastes
  mesurés. La règle « `cave-600` ne porte jamais de texte » est réécrite pour le clair.
- **Cave** : trois textes colorés s'éclaircissent pour tenir 4,5:1 (`text-alert`, `text-water`, `text-ebc-copper`) ;
  les aplats ne changent pas.

## Fichiers écrits
- Nouveaux :
  - `src/theme/themes.css`, `src/theme/couleurs-portees.css`, `src/theme/theme.ts`, `src/theme/ThemeToggle.tsx`
  - `scripts/theme/verifier-theme.mjs`, `contraste.mjs`, `captures-ecrans.mjs`, `planche.mjs`,
    `porter-couleurs.mjs`, `porter-reste.mjs`
  - dans le dossier de la voie : NOTE.md, RESULTAT.md, `capture-houblons.mjs`, `captures/**`, `journal-*.txt`
- Modifiés :
  - `tailwind.config.js`, `src/index.css`, `src/main.tsx`, `DESIGN.md`
  - `src/pages/PageShell.tsx`, `src/pages/BrewWizard.tsx`, `src/components/Header.tsx`
  - les CSS et TSX listés dans NOTE.md, « Couleurs en dur »
- **Hors OWNS, à valider par le pilote** :
  - `index.html` : couleurs en dur du document (`bg-[#12100E]`) et script anti-clignotement. Sans ce script, l'app
    restait noire avant React et clignotait.
  - `tests/unit/dashboardPalette.test.ts` : le test lisait des hex dans `tailwind.config.js`, qui porte maintenant des
    variables. Il lit désormais le bloc cave de `themes.css`. Mêmes assertions, vertes.

## Critères (rejoués à la fin)
- G1 `npm run build` : `✓ built in 19.28s`.
- G2 `npm test` : **ECHEC, hérité**. Deux causes, toutes deux rouges sur HEAD, contrôlées dans une copie de travail
  temporaire de HEAD :
  - `scripts/audit_inputs.mjs` s'arrête avant vitest : `ui/hopIndex/maBiere/Ajouter.tsx:114: Use Input or
    NumberInput…`. C'est l'`<input>` brut de T12, partagé avec sa maquette, non touché ici (règle n° 1).
  - Dans vitest seul (`Test Files 13 failed | 628 passed (641)`) :
    - `designTokens.test.ts` : `text-cave-300` dans `Ajouter.tsx:155` et `text-cave-600` dans `briques.tsx:35`, venus
      de T12 et rouges sur HEAD ;
    - `dashboardPalette.test.ts` : cassé par cette voie, puis adapté, 3/3 verts ;
    - les autres (`hopV55*`, `monkey`, `YeastRecipeChoice`) : « Test timed out in 15000ms ». Ces fichiers expirent
      aussi sur HEAD, sur ce poste chargé.
- G3 `verifier-theme.mjs` : `THEME OK`. Six points sont vérifiés :
  - clair par défaut, posé dès le premier rendu ;
  - le toucher passe en cave et le garde, barre `#12100E` ;
  - le rechargement redonne cave dès le premier rendu ;
  - dans le wizard, le bouton suit « Coller une recette » ;
  - retour au clair.
- G4 : `ECHOUE OK (par défaut, code 1)`.
- G5 `contraste.mjs` : `CONTRASTE OK` (48 mesures, 95 textes portés du clair). Témoin `--temoin` : `CONTRASTE ECHEC 1`.
- G6 : `ROUTES OK (8/8)`, sur la maquette reconstruite dans `maquettes/parcours-theme`.
- G7 : `NOTE OK`. G8 : `NOTE OK`.
- G9 : `NOTE OK`.
- G10 : `CHOIX OK (7 écran(s) conforme(s) à son choix ; 1 ouvert(s) : levure …)`.
- G11 : `PARCOURS OK (29 gestes à 390, 29 à 1280, recalcul médian 0,7 ms)`. Rejoué sur la maquette reconstruite en dernier : même verdict.
- G12 : `TEINTE OK 7/7`.
- webapp-testing (`scripts/with_server.mjs`, `?dev-local`, `VITE_HOP_V4=on`) : `HOUBLONS CLAIR OK`, avec
  `{"theme":"clair","ecran":"ma-biere","voisin":"Coller une recette","fond":"rgb(255, 255, 255)"}`.

## Captures regardées
Dossier `work/missions/2026-10-23-theme-performance/voies/t1-theme/captures/`.
- **Écrans** : accueil, finances, brassins, stocks, clients, menu, réglages, recherche, actions rapides, wizard 1 à 7,
  Houblons v4 avec Citra, couche « analyse ma bière », bancs `?preview=brew`, `stock`, `design`.
- **Formats et thèmes** :
  - 390 × clair : racine du dossier, plus `d/` pour w3-analyse et w7-recap ;
  - 390 × cave : `a/`, plus `d/` pour w3-analyse ;
  - 1280 × clair : `b/`, plus `e/` pour w2, w3-analyse, w6 et w7 ;
  - 1280 × cave : `c/`, plus `e/` pour les mêmes écrans.
- **Parcours du thème** : `theme-01-defaut.png`, `theme-02-cave-accueil.png`, `theme-03-wizard-cave.png`,
  `theme-04-wizard-clair.png`, et `houblons-v4-390-clair-with-server.png`.
- **Planches regardées** (`captures/planches/`) :
  - `p1-390-clair.png` à `p4-390-clair.png` : clair au téléphone ;
  - `p5-1280-clair-a.png`, `p8-1280.png` : ordinateur, clair et cave ;
  - `p6-390-cave.png` : cave au téléphone ;
  - `p7-reprises.png` : écrans repris en `d/` ;
  - `cote-a-cote-houblons.png` : sa maquette, l'app en clair et sa capture noire.

Ce qu'on y voit :
- En clair, partout : page blanche, panneaux gris neutres, texte presque noir, action principale noire à texte blanc.
  Les repères de rubrique sont gardés et foncés (cuivre, vert, bleu, violet).
- En cave, le rendu est identique à avant.
- Aucun débordement horizontal (journal.json). Aucun écran sombre resté en clair parmi ceux atteints.
- L'étape Houblons en clair a la même allure que sa maquette : carte grise, « + » noirs, segment « Au style » noir.

## Restes
- Non atteints en vrai, faute de données en `?dev-local` : le jour de brassage (`brew-day.css`), le compagnon
  (`brewer-chat.css`, Gemini) et les détails de finances. Ils sont portés mécaniquement, mais pas regardés.
- `hopV55` (déjà clair, drapeau éteint), le nuancier `?preview=design` (dev) et les couleurs de marque Google et des
  catégories ne sont pas portés.
- Focus visible noir en clair : un cadre noir apparaît sur le conteneur de `?preview=brew`, comportement existant.
- `OG NaN` et `IBU 0` sur une recette neuve (#170) : hors de cette voie.
- Une métadonnée `.git/worktrees/head` est restée (« Permission denied » à la suppression) après la copie de HEAD
  dans le scratchpad. `git worktree list` ne la montre plus ; un `git worktree prune` plus tard la retirera.

Prédiction : « Enfin en blanc comme mes maquettes ; et le petit soleil/lune à côté de l'import, c'est ce que je voulais. »

DÉCISION À PRENDRE :
- G2 est rouge pour des défauts hérités de T12 (`Ajouter.tsx` : input brut et `text-cave-300` ; `briques.tsx` :
  `text-cave-600`), dans un code partagé avec sa maquette. Il faut une voie T12 pour les corriger, ou un critère G2
  rejoué hors ces deux défauts.
- Accepter les deux écritures hors OWNS (`index.html`, `dashboardPalette.test.ts`).

CONNAISSANCE : l'app a deux thèmes par `data-theme` sur `<html>` (`src/theme/themes.css`), clair par défaut. Une
teinte CSS propre à un composant passe par `scripts/theme/porter-reste.mjs`, jamais en hex direct ; contraste :
`scripts/theme/contraste.mjs`.

LEÇON PROPOSÉE : un critère `npm test` d'une voie se rejoue sur HEAD avant le lancement (L13). Ici, l'audit des champs
et designTokens étaient déjà rouges, à cause de T12.
