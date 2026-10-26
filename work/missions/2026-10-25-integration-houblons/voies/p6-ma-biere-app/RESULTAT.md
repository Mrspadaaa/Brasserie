OK — Onglet « Ma bière » (base v4.10) porté dans l'app sur la couche hopBeer ; entrée à rebrancher par le pilote (ligne dans ce fichier)

## À faire par le pilote : rebrancher l'entrée (je n'ai pas touché `maBiere/index.tsx`, consigne du coordinateur)

`src/ui/hopIndex/maBiere/index.tsx` (HEAD 6e368cbd, s2 a commité) : remplacer les lignes 71 à 77 (le commentaire a2 et les deux lignes) par :

```
  // p6 : l'écran d'analyse de ma bière (l'onglet « Ma bière » de sa base v4.10) est dans l'app (couche `hopBeer`, biere/EcranApp.tsx) :
  // l'entrée « Ouvrir l'analyse de ma bière » (variante B de D121) et le toucher du profil (A et C) s'affichent en production.
  const analyse = true;
```

soit, pour les deux lignes exactes (l. 76 et 77 sur HEAD) : `const enApp = !!useHote().allerWizard;` et `const analyse = !enApp || import.meta.env.DEV;` → `const analyse = true;`.
Ensuite, `useHote` n'est plus lu dans ce fichier : l. 18 `import { useBiere, useHote, useRecette } from './hote';` → `import { useBiere, useRecette } from './hote';`.
Deux tests à aligner, car ils exigent l'ancien comportement : `tests/unit/hopIndexV4/demandeReelle.test.tsx` l. 159 à 166 (« Ouvrir l'analyse » caché en production : devient « présent ») et l. 169 à 173 (garder), plus la ligne ~208 (`vi.stubEnv('DEV', false)` : relire ce qu'elle attend du bouton). Le sens de ce test change avec D84 (voir DÉCISION).
Le HopToolLayer ne tombe plus sur « Écran provisoire » que drapeau hopV4 éteint (alors l'entrée n'existe pas non plus : l'étape rend V5.5).

## Fichiers écrits
- Neufs, `src/ui/hopIndex/biere/` : `index.tsx` (l'écran), `hote.tsx` (l'hôte), `EcranApp.tsx` (porte du brouillon, données du brasseur, visée, pile), `CadreApp.tsx` (tête à onglets, Ma bière active), `Degustation.tsx` (grille m4), `biere.css`.
- Modifié : `src/ui/hopIndex/HopToolLayer.tsx` (cas `hopBeer` chargé à la demande, comme Comparer ; commentaire de `CoucheProvisoire` mis à jour).
- Tests : `tests/unit/hopIndexV4/biereApp.test.tsx` (8), `tests/unit/hopIndexV4/biereAppDegustee.test.tsx` (1), contrôle `tests/integration/controle-ma-biere-app.mjs`.
- Voie : `inventaire.md`, `cote-a-cote.mjs`, `fluidite.mjs`, `captures/` (app-*, maquette-*, cote-a-cote-*, head/app-echec.png).
- Rien d'écrit dans `src/domain/`, `fiche/`, `commun/`, `maBiere/`, ni dans la maquette.

## Critères
- `npx vitest run tests/unit/hopIndexV4` : **pas vert, et pas de mon fait**. Mes 9 tests et les 4 fichiers voisins que j'ai rejoués (etapeHoublons, suggererViseePosee, outilsApp) : 38/38 verts. Suite entière : 8 à 10 fichiers en échec selon la charge (3 passes : 18, 14 tests) : coherenceCatalogue, couvertureCatalogue, complements (« 317 au lieu de 318 »), moteurInchange (empreintes), traductionMots, froid, froidDryhopper, useHopData. Aucun n'importe `HopToolLayer` ni `biere/` (grep : 0). `git status` montre d'autres voies en vol sur `src/domain/hopIndex/v4/data.ts`, `src/data/hopV4/*`, `fusion.mjs`, `minoritaire.ts` : leurs données changent le catalogue (317/318) et les empreintes. Je ne peux pas rejouer HEAD seul (pas de stash) : à rejouer par le pilote quand g2d/c5 auront commité.
- `npm run build` (`VITE_HOP_V4=on`) : vert (tsc, vite, check-private-research).
- `node scripts/check-no-dev-auth.mjs` : « Bundle de production propre ».
- B5 : `check-hop-budget.mjs --dist dist --chunk-outils profil-simule` : **159,0 ko gzip, tenu (≤ 160)**. Mon écran n'y entre pas : chunk à part chargé à la demande (EcranApp-CHc6cvS4.js : 7,1 ko gzip + 1 feuille CSS). Marge de B5 : 1,0 ko, consommée par d'autres voies, pas par la mienne. B1 (921 ko) et B2 (773 ko) sortent « DÉPASSÉ » avec les arguments par défaut du script (`--boot index,App,firebase` compte App en entier) : hors critère, non causé par un chunk lazy ; non investigué.
- Contrôle de l'écran : `node scripts/with_server.mjs --server "npm run dev -- --port 5271 --strictPort" --port 5271 --env VITE_HOP_V4=on -- node tests/integration/controle-ma-biere-app.mjs`
  - **sur HEAD 6e368cbd** (worktree temporaire hors du dépôt, supprimé ensuite) : `MA-BIERE-APP ECHEC` : « la couche montre encore « Écran provisoire… » » et « l'écran Ma bière n'apparaît pas après le toucher du bouton » (capture `captures/head/app-echec.png`, ouverte : « Écran provisoire : l'outil v4 viendra ici »).
  - **sur le code livré** : `MA-BIERE-APP OK`. Il joue : bouton « Ouvrir l'analyse de ma bière » → les 9 blocs de l'inventaire, 12 barres, onglets, croix, bandeau, Barres/Radar, Au style/Absolu → famille ouverte, « + » (losange, puce pleine, ×), « × », « bannir » (barrée) → Absolu → Radar (grille, décompte replié) → onglet Suggestions (pile `hopBeer > hopSuggest`) → « Ma bière » y ramène → la croix ferme. Aucune erreur de page.
  - `controle-choix.mjs --url` ne s'y prête pas : ses contrôles lisent des pages `<dossier>/<route>/etat.html` de la maquette, pas une app à couche. Remplacé par le contrôle ci-dessus (autorisé par la voie).
- Captures ouvertes et regardées : `app-repos`, `app-visee`, `app-absolu`, `app-radar`, `cote-a-cote-repos`, `cote-a-cote-visee`, `cote-a-cote-radar`, `head/app-echec`. Non rejouées : `app-bannir` regardée par le contrôle (sélecteur `data-bannie`), pas en image.

## Fidélité (390 × 844, maquette `#/biere` à gauche, app à droite)
Mêmes blocs, même ordre, mêmes composants (Bandeau, Alerte, PisteBase, Lentille, RadarBiere, GrilleDegustation : le code de la maquette, imports seuls changés). La seule différence visible vient des données : la recette du banc n'a **pas de dégustation** (aucune donnée réelle), donc « Au style » vert au lieu de « Boisé et résineux trop marqué », pas de pastille « dégusté 18.10 », pas de Résineux ouvert « ×2,8 », pas de rayon orangé au radar, pas de puces « + floral · − résineux ». Un test (`biereAppDegustee`) prouve que, avec une vraie dégustation de la recette (mockée), l'app écrit « dégusté 18.10 », ouvre Résineux avec son facteur « ×… », montre l'alerte, et le radar noté « Résineux : marqué ». Écart de mise en page non voulu, mineur : l'écran de l'app commence ~9 px CSS plus haut que celui de la maquette (marge supérieure du PageShell).
Ce que le fichier `inventaire.md` détaille : 17 états, 6 écarts voulus, tous de données.

## Fluidité (`fluidite.mjs`, dev, processeur ×4 ; pessimiste et bruité, comme T15c)
- Ouverture à froid, chunk compris : 2 304 ms puis 2 915 ms (budget 2,5 s) : **limite, non prouvé**. En production le chunk est de 7 ko gzip, déjà préchargé avec les outils ; le serveur de dev transforme les modules à la demande. Aucune mesure sur un build (le banc `?dev-local` et `__hopPile` n'existent qu'en développement).
- Toucher (retour à la première image) : famille 126 à 145 ms, visée « + » 264 ms, Radar 222 ms (budget 100 ms) : **au-dessus du budget en dev ×4**, non prouvé en production. Profil d'un « + » (×1) : JS ≈ 100 ms dont `proposeVoies` 3 ms, le reste est React en mode dev et le style/mise en page du navigateur. Pour que les voies ne retardent pas le retour : la ligne « Plus floral : n voies › » suit la visée en second (`useDeferredValue`).
- Je ne les déclare pas tenus. Piste si le pilote veut les tenir : mesurer sur un build de production avec un banc (hook de test), et alléger la mise en page de 12 lignes à chaque toucher (`contain` sur les lignes).

## Essais
Contrôle : 3 passes (2 échecs de sélecteurs : `[data-e="absolu"]` de l'étape Houblons, montée dessous, prise pour celle de l'écran ; onglet « Ma bière » de la couche du dessous). Tests : 3 passes (radar : radios du SegmentedControl comptés avec la grille ; couche : `resetModules` sépare la porte). Deux vrais défauts trouvés par les tests et corrigés : les notes de départ et la famille ouverte étaient figées au premier rendu, avant l'arrivée de la dégustation (`useHopData` est asynchrone).

## Doutes et limites
- La maquette garde sa propre copie de l'écran (`prototypes/.../ecrans/biere/`) : hors de mon périmètre, donc deux copies divergentes possibles. Comme Suggérer l'a fait (T13), la maquette peut devenir un hôte mince de `src/ui/hopIndex/biere/` (`hote.tsx` est prêt pour ça).
- Les notes de dégustation posées sur la grille m4 vivent dans l'écran seulement (comme la maquette) : elles ne sont pas enregistrées dans Dexie/Firestore. La visée vit en mémoire (`parcours/visee.ts`) ; je l'ai liée au brouillon (changer de brouillon la remet à zéro).
- Navigation : depuis Ma bière, « Suggestions » empile Suggérer par-dessus ; la croix de Suggérer ramène à Ma bière (pas directement à l'étape Houblons, contrairement à D118 « retour au menu »). C'est le comportement de la pile des couches ; à trancher si D118 doit primer.
- La « Légende » (?) reprend le texte de la maquette tel quel ; je n'ai pas relu ses mots pour l'app (« la ligne dessous ouvre Suggestions » vaut même sans voies).

DÉCISION À PRENDRE : sans visée posée, l'app n'écrit aucune puce « + floral · − résineux » (la maquette les tire de sa dégustation S1, une fixture). C'est la règle t12d/D158 (aucune demande inventée), mais l'écran choisi les montre au repos. Options : (A) garder ainsi : honnête, mais l'écran perd ses puces tant qu'il n'a pas touché une famille ; (B) tirer la demande de sa vraie dégustation quand elle dit « trop X / plus Y » (il n'y a aujourd'hui aucun champ structuré : `tasting.quote` est du texte) ; (C) montrer « + … » seul avec une phrase d'aide au repos. Recommandation : A tout de suite, B en ticket si le brasseur le réclame. Autre point lié : appliquer `analyse = true` fait passer D84 (entrée cachée en production) à « entrée visible, vers un vrai écran » : à journaliser.

CONNAISSANCE : une couche de la pile reste montée sous la suivante (étape Houblons, puis Ma bière, puis Suggérer) : tout sélecteur de contrôle doit être borné à `[data-ecran="…"]`, sinon il touche l'écran du dessous (`data-e`, `data-onglet`, `data-role="retour"`). Et dans un écran porté, tout état initial tiré des données du brasseur doit se relire quand les données arrivent (`useHopData` est asynchrone) : pas de `useState(() => …données…)`.

LEÇON PROPOSÉE : un état initial calculé dans `useState(() => …)` à partir de données asynchrones est figé vide ; le test d'un écran porté doit monter avec une dégustation réelle (mockée), pas seulement sans (rôles : auteur, relecteur ; contrôle : test `biereAppDegustee`).

## Pilote, mesure en production

Passe pilote du 26.10 (exécutant Haiku). Entrée rebranchée : `src/ui/hopIndex/maBiere/index.tsx`, `const analyse = true;` (`enApp` et l'import `useHote` retirés, plus aucun usage). `tests/unit/hopIndexV4/demandeReelle.test.tsx` : titre l. 159 et l. 166 (« Ouvrir l'analyse » présent), l. 165 (`pont-biere` présent) ; le `vi.stubEnv('DEV', false)` de l. 208 gardé, il ne touche pas le bouton.

- Vitest (4 fichiers : demandeReelle, biereApp, biereAppDegustee, cartesOuvertes) : 29/29 verts.
- `npx tsc --noEmit -p .` : code 0.
- Build de production `VITE_HOP_V4=on npm run build` : code 0 (30,22 s).

Mesure en production (`npx vite preview --port 4174`, processeur ×4) : NON RÉALISÉE. Le preview demande une connexion : `?dev-local` ne contourne que `import.meta.env.DEV` (`src/App.tsx` l. 109, éliminé au build), si bien que `[data-role="pont-biere"]` n'apparaît jamais (timeout 120 s). Pas de vérification visuelle de cette page non plus.

Mesure en dev (`npm run dev -- --port 5291`, `VITE_HOP_V4=on`, processeur ×4, `fluidite.mjs` réemployé tel quel, port via `WITH_SERVER_PORTS`) : une seule passe, chunk compris, en pire cas (le chunk transformé à la demande).
- Ouverture à froid de Ma bière, du clic à l'écran peint : 1556 ms (budget 2500 : passe).
- Toucher « famille » (ouvrir une ligne) : retour visuel médiane 129 ms, max 153 ms ; posé médiane 143 ms (budget 100 : dépasse).
- Toucher « visée » (+) : retour visuel médiane 237 ms, max 282 ms ; posé médiane 453 ms (budget 100 : dépasse).
- Toucher « radar » (bascule de vue) : retour visuel médiane 195 ms, max 307 ms ; posé médiane 222 ms (budget 100 : dépasse).

Doute : ce sont des mesures dev, pas production ; la production devrait être plus rapide, mais ce n'est pas mesuré. Les trois touchers dépassent 100 ms en dev ; le budget du toucher n'est donc pas tenu avec ce rendu, à traiter avant d'annoncer la voie comme fluide. Rien n'est commité.

CONNAISSANCE : en preview production, `?dev-local` ne contourne pas la connexion (seulement en dev) ; une mesure de production d'un écran connecté demande un vrai compte ou un émulateur.

LEÇON PROPOSÉE : aucune
