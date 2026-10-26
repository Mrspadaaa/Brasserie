# Voie p6-ma-biere-app : porter dans l'app son onglet « Ma bière », à la place de l'écran provisoire

Agent : auteur (Sonnet). Le port se fait dans l'app et il est visible. Le critique (Fable) jugera ensuite les captures.

## Pourquoi (D171, voie u1)
Le brasseur, en production : « Clicker ici ne fait plus rien et il y a plus le bouton pour ouvrir la vue. »

La cause est décrite dans `voies/u1-au-style-mort/RESULTAT.md`, à lire :
- la couche `hopBeer` (l'analyse de ma bière) n'a pas d'écran dans l'app ;
- `HopToolLayer.tsx` la rend par `CoucheProvisoire` (« Écran provisoire… données du prototype, non réelles ») ;
- a2 (D84) a donc caché l'entrée en production : `src/ui/hopIndex/maBiere/index.tsx`, l. 75 et 76, `analyse = !enApp || DEV`.

## Son choix (règle n° 1 : reprendre son écran tel quel)
- Registre : `work/refonte-frontend/v4/choix/ecrans.json`, entrée `ma-biere`, route `biere`. Son choix : « base v4.10, onglet Ma bière ».
  Ses mots : « Ça aussi ».
- Sa capture : `work/refonte-frontend/v4/ecran-1/base/captures/consolide-biere-390.png`. Ouvre-la.
- L'écran de la maquette jouable : `prototypes/houblons-v4/parcours/src/ecrans/biere/`. C'est la base du port (L03) ; la mini maquette ne
  l'est pas.
- Ses états relevés : `work/refonte-frontend/v4/choix/etats/biere.json` (e3).
- Le radar commun est déjà dans l'app : `src/ui/hopIndex/maBiere/RadarBiere.tsx` et `src/ui/hopIndex/commun/`.

## À faire
1. **Inventaire** de l'écran de la maquette (L03, M16) : chaque bloc, chaque geste, chaque état (repos, pendant, après) de `biere.json`.
   Écris-le dans `inventaire.md`.
2. **Le port**, sur le modèle des outils déjà portés : Substituer, Dryhopper et Levure ont `outilApp.tsx`, `CadreApp.tsx`,
   `EcranApp.tsx`, un hôte, et le client des calculs hors fil.
   - L'écran se branche sur la couche `hopBeer` de `HopToolLayer.tsx`, à la place de `CoucheProvisoire`.
   - Les données sont les vraies : la recette en cours, le catalogue et les compléments. Aucune donnée du prototype.
   - Le hors ligne doit tenir.
   - Le premier rendu reste sous les budgets de fluidité de l'épopée #159 (toucher 100 ms ; écran utilisable en 2,5 s à froid,
     processeur ×4).
3. **Rebrancher l'entrée** en dernier : `analyse = true` dans `maBiere/index.tsx`, l. 75 et 76, avec le commentaire mis à jour.
   La voie s2 travaille dans ce fichier. Avant d'y toucher, lance `git status` : si s2 n'a pas commité, écris seulement la ligne exacte
   dans RESULTAT.md, et le pilote l'appliquera.
4. **La fidélité.**
   - Prends en 390 × 844 la capture de l'app et celle de la maquette, côte à côte. Les données diffèrent (la vraie recette contre la
     fixture), donc compare les blocs et la mise en page, pas les nombres.
   - Lance `node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs --url=<l'app> --ecran=ma-biere` si le contrôle s'y prête.
     Sinon, écris un contrôle `tests/integration/controle-ma-biere-app.mjs` qui échoue sur HEAD (écran provisoire) puis passe : les
     blocs de l'inventaire sont présents, et le bouton « Ouvrir l'analyse de ma bière » ouvre l'écran.
   - Ouvre les captures.

## Critères
- `npx vitest run tests/unit/hopIndexV4` : vert.
- `npm run build` : vert.
- `node scripts/check-no-dev-auth.mjs`.
- `node scripts/check-hop-budget.mjs --dist dist --chunk-outils profil-simule`, build fait avec `VITE_HOP_V4=on` : B5 à 160 ko au plus.
  Si le nouvel écran le fait dépasser, dis de combien et pourquoi.
- Le contrôle de l'écran : rouge sur HEAD, puis OK.
- Captures ouvertes.
- La suite mécanique (maquette, `controle-etats`) sera rejouée par une voie à part : ne la fais pas.

## Possède
- `src/ui/hopIndex/biere/` (nouveau), `src/ui/hopIndex/HopToolLayer.tsx` (la couche `hopBeer`), les tests neufs,
  `work/missions/2026-10-25-integration-houblons/voies/p6-ma-biere-app/`.
- `maBiere/index.tsx` : les lignes 75 et 76 seulement, sous la condition de l'étape 3.

Ne touche ni à `src/domain/` (la voie g2d est en cours), ni à `fiche/`, ni à `commun/` (la voie s2). N'écris aucun code par heredoc ni par
`node -e`. Pas de `git mv`, pas de `git stash`. Écris RESULTAT.md tôt. Retour en une ligne.
