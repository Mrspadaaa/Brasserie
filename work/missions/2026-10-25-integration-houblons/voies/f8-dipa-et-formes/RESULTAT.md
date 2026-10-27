ECHEC — D191 : 1/6 de ses houblons dans les 10 premiers (radar trop grossier) ; D190, départage k3k1, empreintes, vitest 980/980 et build OK

## Fichiers écrits
- `src/domain/hopIndex/v4/departage.ts` : mode `k3k1` (famille citée, radar Beer Maverick, puis les 5 étapes de k1 ; l'inconnu après le connu) et `DEPARTAGE_DEFAUT = 'k3k1'`.
- `src/domain/hopIndex/v4/voies.ts` : défaut `k3k1` (option absente) ; `'aucun'` rend l'ordre d'avant sans clé ; voie d'amertume (60′) : clé inconnue ; dans les groupes du vrai dry hop (`dryHop`, g2b), la clé passe AVANT le débordement de style.
- `src/domain/hopIndex/v4/pouvoir.ts`, `profil-simule.ts` : forme produit (Citra cryo) = huile totale et α propres, composition de l'huile de la variété, marquée « de la variété » (hypothèse, drapeau `cryo` statut « de la variété », ligne de confiance, champ `deLaVariete`).
- Tests neufs : `tests/unit/hopIndexV4/f8Formes.test.ts` (5), `f8Intensite.test.ts` (10). Tests adaptés, raison « D118 » écrite : `departage.test.ts`, `palierDryhop.test.ts`, `pouvoir.test.ts`, `engine.test.ts`, `donnees.test.ts`, `client-async.test.ts`, `worker-calculs.test.ts`.
- Hors Possède mais imposés par le test du pack (comme g2c) : `prototypes/houblons-v4/data/pack-mini-protos.json` et `pack-fiches.json` régénérés par `build-pack.ts` (553 ko ; HEAD dépassait déjà 500 ko).
- Scripts : `scripts/eval-hop/f8-d191.ts` (contrôle), `f8-sonde.ts` (D190), `f8-diag.ts`, `f8-s1.ts`, `f8-radar.mjs`.

## Critères
- `npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests` : 104 fichiers, 980 tests verts (dernier rejeu, après toutes les modifications).
- `npm run build` : vert (22 s). B5, perf, `f2-borne`, phares : voir DEMANDE EXECUTANT.
- Empreintes (raison « D118 ») : `proposer` 3b946ac8a4ff → 3c7fcd571305 (champ `departage` dans chaque voie ; ordre à distance égale par le radar) ; `suggerer` af7f2ecc1069 → 45120c1bc857 (D190 : Citra cryo simulé n'est plus à 0). `substitutes`, `remplacants`, `moteurInchange` : inchangés.
- D190 (rouge sur HEAD, vert) : sur HEAD (mesuré avant ma modif, `f8-sonde.ts`), Citra cryo à 4 g/L au dry hop : apports 0 sur les 12 familles ; Citra : agrumes 36, tropical 47, noyau 31, baies 44, floral 41, résineux 27. Après : cryo agrumes 41, tropical 48, noyau 36, baies 45, floral 48, résineux 34 ; mots, familles citées, niveaux et fiches identiques à Citra (déjà le cas sur HEAD, verrouillé par le test). Le test neuf n'a pas été rejoué dans une copie de HEAD (faute de tours) ; sa preuve de rouge est la mesure ci-dessus.
- D191 (`npx vite-node scripts/eval-hop/f8-d191.ts --source=dryhop`, 22A, groupes du vrai dry hop, pool entier) : **ECHEC, 1/6 en agrumes, 0/6 en tropicaux**.
  - Avant (HEAD, `--mode=aucun`, liste principale) : 0/6 ; agrumes, rangs sur 235 : El Dorado 223, Mosaic 136, Mandarina 28, Calypso 203, Pacific Jade 52, Idaho 7 141 ; les 10 premiers : Hallertau Mittelfrüh, Huell Melon, Mount Hood, Phoenix, Saaz…
  - Après : El Dorado 57, Mosaic 50, Mandarina 9, Calypso 118, Pacific Jade 89, Idaho 7 55 ; tropicaux (sur 124) : Idaho 7 15, El Dorado 21, Mosaic 35.
  - Cause 1, corrigée : le débordement de style (clé avant le départage) rangeait les nobles (une seule famille citée, aucun débordement) devant El Dorado (pomme/poire +0,81 cran, famille neutre en 22A). Placer la clé avant lui fait gagner 80 à 170 rangs.
  - Cause 2, non corrigeable sans forcer : le radar est un entier de 0 à 5. Sur l'axe agrumes, 23 variétés ont 4 ou 5 et une seule de ses six (Mandarina, 4) ; ses cinq autres ont 3 ou 2. Sur l'axe tropical, 32 variétés ont 4 ou 5 (`f8-radar.mjs`). Aucune clé par axe ne place 4 de ses 6 dans les 10 premiers ; le haut de la liste est tenu par Citra, Centennial, Waimea, Amarillo, mais aussi Tango, HORT9909, NZH-107 (radar fort, peu connus).
- Essais : plusieurs par critère (clé avant le débordement dans la liste principale : abandonné, voir doutes).

## Doutes et limites
- **Placement de la clé** : avant le débordement dans la LISTE PRINCIPALE, elle chasse les voies neutres (S1 : 12 des 14 voies deviennent « Remplacer Nugget »), et un « ordre » avec des clés absentes n'est pas total. Elle y reste donc après la distance. Conséquence : l'écran actuel (adaptateur, liste principale) ne montre pas encore le gain de D191 ; il vient avec les groupes du vrai dry hop (`dryHop: true`, g2b), que l'adaptateur n'appelle pas. Le câblage de ces groupes dans Suggérer (m6/m7) reste à faire. « À chaud » (10′, whirlpool) : seulement l'ordre à distance égale, k3k1 après la distance.
- En stout S1 « plus floral », les ajouts à 10′ rangent par le radar floral : Loral, Pekko, Barbe Rouge, Pacifica (4) devant East Kent Goldings (1) et Celeia (2), qui quittent les 4 places d'achat. Deux tests d'acquis (D105 « Goldings ou Celeia devant Citra cryo », voie East Kent Goldings) sont donc lus avec `departage: 'aucun'`. À confirmer par le brasseur.
- Le stock passe après le départage : un houblon à acheter peut passer devant un houblon du stock à distance égale (S1 : Motueka du stock, radar floral 0, derrière quatre achats à 4).
- Recette 22A du contrôle : ajouts SUPPOSÉS (Columbus 60′ et 10′, Lotus au dry hop) ; sa vraie recette n'est pas dans les captures.
- Cryo : huile totale 2–6 mL/100 g (source H1 « ≈ 2 fois l'huile du T-90 ») ; le simulé monte donc d'environ 15 % (agrumes 36 → 41) sous saturation. Thiols et précurseurs du cryo : ceux de la variété pour les thiols du fichier ; les précurseurs de biotransformation restent ceux de la clé `…:cryo` (absents). Le sélecteur pellets/cryo n'est pas dans cette voie.
- Non fait (voir DEMANDE EXECUTANT) : B5 (164 ko), `check:hop-perf` (le champ `departage` alourdit chaque voie envoyée au worker), `f2-borne`, phares L14 sur les autres styles, états de la maquette.
- Aucun commit. `git status` montre des fichiers d'autres voies (radar.tsx, vue-radar.tsx, controle-radar-echelles.mjs, beeranalytics-*).

DEMANDE EXECUTANT :
1. `npm run build` puis lire la taille B5 (script ou ligne du build qui la donne ; 164 ko au plus). Sortie attendue : B5 ≤ 164 ko.
2. `npm run check:hop-perf` ; comparer au dernier relevé de f4/f6 (bruit : ± 10 %). Sortie attendue : aucun budget nouveau dépassé.
3. `npx vite-node scripts/eval-hop/f2-borne.ts` : aucun phare nouveau manquant (comparer à HEAD en rejouant avec `departage: 'aucun'` dans OUVERT si besoin).
4. `npx vite-node scripts/eval-hop/f2-phares.ts` (et `f5-phares.ts`) : Citra, Nelson Sauvin, Galaxy, Mosaic, Motueka, Idaho 7 sur 21C, 16D et 22A, aux moments 10′ et dry hop ; consigner les rangs avant/après (`--mode=aucun` n'existe pas : passer `departage: 'aucun'`).
5. `npx vite-node scripts/eval-hop/f8-d191.ts --source=dryhop --liste` et `--mode=aucun --source=principale --liste` : coller les 10 premiers ; sortie attendue : `D191 ECHEC` (1/6), voir cause.
6. États de la maquette : `node work/refonte-frontend/v4/choix/controle-etats.mjs` après reconstruction ; ouvrir les captures de Suggérer (stout S1 : liste des 14 voies) et de Comparer (Citra cryo) ; les états dont la liste S1 a changé (4 achats : Loral, Pekko, Barbe Rouge, Pacifica) sont attendus.

DÉCISION À PRENDRE : D191 n'est pas atteignable par le radar d'un seul axe (cause 2). Options : (a) garder k3k1 tel quel (Citra, Centennial, Waimea, Amarillo, Mandarina en tête ; ses six entre le 9e et le 57e rang) ; (b) ajouter, entre le radar et k1, une clé « typé pour le style » (usage du houblon en Double IPA : Beer Analytics, collecté par c3h dans `src/data/hopSources/beeranalytics*.json`, non intégré) : c'est ce qui sépare El Dorado ou Mosaic d'un houblon expérimental au même radar ; (c) abaisser le critère à « dans les 30 premiers ». Recommandation : (b), puis câbler les groupes `dryHop` dans Suggérer pour que le gain se voie à l'écran.

CONNAISSANCE : le radar Beer Maverick est un entier de 0 à 5 ; sur l'axe agrumes seules 23 variétés sur 181 ont 4 ou 5, et ses El Dorado, Mosaic, Idaho 7 ont 3. En 22A, El Dorado est pénalisé par le débordement de style (poire, famille neutre) : le rang « débordement avant distance » favorise les houblons à une seule famille citée.

LEÇON PROPOSÉE : un critère chiffré tiré d'une attente du brasseur (« 4 de ses 6 dans les 10 premiers ») se confronte à la résolution de la donnée qui doit le tenir (radar entier 0 à 5) avant d'être posé en porte ; sinon la voie échoue sur une limite connue d'avance.
