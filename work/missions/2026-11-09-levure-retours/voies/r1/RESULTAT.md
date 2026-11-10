OK — Ma levure : recherche sur place, conduite de base revenue, 7 alignements ; captures 390/1280 à finir (DEMANDE EXECUTANT)

## Fichiers écrits
- `src/ui/etapeLevure/MaLevure.tsx` : champ de recherche sur place (`ChampLevure`), conduite de base (`YeastRecipePlan`), alignements (structure de l'en-tête et de la bande).
- `src/ui/etapeLevure/EtapeLevure.tsx` : plus de renvoi vers Chercher ; passe repères, stock, liens (comparer, fiche, objectifs) et l'état de l'atelier à Ma levure.
- `src/ui/etapeLevure/etapeLevure.css` : classes `lv-` (champ, tuiles, puces entières, grille de la bande, jauges, noms longs, pastilles de la conduite de base).
- `tests/integration/etapeLevure/etapeRetours.test.tsx` (neuf, 13 tests) ; `etapeCoque.test.tsx` (les tests de la nouvelle conduite jouent `Conduite` seule ; le champ de « recette sans levure » est un combobox).
- `voies/r1/` : `capturer.mjs`, `sonde-choix.mjs`, `tests.txt`, `avant-correction.txt`, `captures/` (390-clair, 390-cave, 1280-cave faites ; journal.json).
- **`Conduite.tsx` reste dans le dépôt, non monté** (ses tests le jouent seul, `BancConduite`). Non touché.

## Ce qui est fait
1. **Recherche sur place.** « Changer de levure » est un vrai champ (`Input`, rôle combobox ; au repos les puces ; en tapant, les résultats remplacent les puces en tuiles juste dessous, 8 au plus + « 8 sur 35 · précise la saisie »).
   - Flèches, Entrée choisit, Échap vide, × efface. Toucher une tuile : `onProposee` → `props.onChoisir` ; on reste sur Ma levure.
   - Stock d'abord : articles du stock qui correspondent (nom ou fournisseur), puis les levures du catalogue dont l'id est en stock, avec l'icône colis.
   - Sans résultat : tuile « Mon stock ou saisie libre : « texte » » → ouvre le repli « Mon stock ou saisie libre ».
   - L'onglet « Chercher » est la seule route vers la recherche avancée. Test : le mock de Chercher n'est monté qu'au clic sur l'onglet.
2. **Conduite de base.** `YeastRecipePlan` monté comme dans `YeastRecipeChoice` : même clé, `goalSlot={null}`, `onChange` = porte du wizard (`onChange(next, 'conduct')`). Capture 3 = capture 4 du brasseur : « Conduite · température × jours », Brouillon, « 2 points à vérifier », « <levure> · conduite actuelle », consigne du palier, poignées ↕ ↔, éditeur du palier, « Jours de bascule et légende », Supprimer, « Relire et appliquer » plus bas.
   - Ouverte à l'arrivée (maquette l5b) ; elle s'ouvre de nouveau après un autre choix de levure.
   - Liens branchés : comparer les souches → onglet Comparer ; corriger la fiche → repli Fiche ; objectifs → repli Objectifs (ouverts et amenés à l'écran).
   - **« Atelier complet » ouvert : la conduite de base est masquée** (`hidden`, jamais démontée : l'essai en cours n'est pas perdu), l'atelier porte la sienne. Aucune perte : pas deux conduites à la fois.
3. **Alignements relevés (capture 1 du brasseur et les miennes), corrigés.**

| n° | Constat | Correction |
|---|---|---|
| 1 | « + » et × de la nouvelle conduite posés sur le pied « Retour · Suivant » | Disparaissent avec elle. Mesuré sur le banc (390, repos et palier touché) : aucun contrôle de Ma levure ne recoupe le pied (`debordeSurLePied: []`). |
| 2 | Rangée de puces coupée net au bord droit (« ⬚ » de la 3e puce) | Une seule rangée de puces entières ; celles qui ne tiennent pas passent sous la rangée, masquées et hors tabulation ; « Hors catalogue » fixé à droite, toujours visible. Mesuré : 0 puce coupée. |
| 3 | En-tête de carte : « 1,0 sachet », ×, « 10–20 g » + jauge flottaient | Grammes et jauge : un bloc calé sur le bord droit de la dose, jauge de largeur fixe (56 px) ; texte « forme · fabricant » à gauche. |
| 4 | Colonnes FG · fiche/conduite · floculation : pistes à des hauteurs différentes (FG plus bas à cause de la ligne ABV) | Chaque cellule a ses lignes (titre, valeur, sous-ligne) ; piste et jauge toujours en bas. Mesuré : bas des pistes identiques (212, 212, 212 ; 301, 301). |
| 5 | Jauges des effets décalées (762, 741, 765 px) selon la largeur du mot (faible, moyen, élevé) | Mot à largeur fixe : jauges toutes à gauche = 241 px, mots calés à 372 px (Verdant IPA, 3 jauges). |
| 6 | (trouvé à ma capture) nom long coupé : « LalBrew Verdant … », « Lallemand Br… » | Nom et ligne « forme · fabricant » sur deux lignes au plus. |
| 7 | (trouvé à ma capture) tuile « Lallemand Brewing · LalBrew NovaLager™ … » : le fabricant dit deux fois | Nom sans fabricant en tête ni parenthèse finale ; le fabricant reste dessous. |

## Critères
- **Test qui échoue avant** (L13) : `etapeRetours.test.tsx` sur les fichiers HEAD : 8 rouges sur 11 à l'époque (`avant-correction.txt`). Après : 13 verts.
- `npx tsc --noEmit -p .` : sans erreur (une erreur transitoire dans `src/domain/levure/` de r2 a disparu).
- **Tests** : `Test Files 15 passed (15) · Tests 219 passed (219)` (`tests.txt` : `tests/integration/etapeLevure`, `tests/unit/levure`, `YeastRecipeChoice.test.tsx`, plus `bAssistantSept.test.tsx` qui monte l'étape). Aucun rouge hors zone.
- **Captures** : prises ET ouvertes (L12) : 390-clair (version intermédiaire : la conduite était repliée, le nom coupé, déjà corrigés), 390-cave (finale), 1280-cave (version intermédiaire). Ce que j'y vois : carte, bande, jauges alignées ; champ « lal » en 8 tuiles + « 8 sur 35 » ; « zzqxjw » → tuile libre ; Verdant choisie par tuile ; conduite de base identique à la capture 4 ; recette sans levure : « Levure · choisir », champ « Chercher une levure », conduite « Sans levure · conduite actuelle ». Pas d'erreur console, aucune requête bloquée.

## Essais utilisés
Un essai par critère, sauf : 3 relances de captures (délai de navigation du premier chargement de Vite, un tour de sélecteur de saisie, ma correction de la conduite repliée).

## DEMANDE EXECUTANT
Les captures finales manquantes sont une série mécanique ; je juge ensuite.
1. Depuis la racine, une ligne par format (le script prend `--seulement=`) :
   `node scripts/with_server.mjs --server "npm run dev -- --port 5657 --strictPort" --port 5657 --env VITE_HOP_V4=on --env VITE_FIREBASE_API_KEY=fake -- node work/missions/2026-11-09-levure-retours/voies/r1/capturer.mjs --sortie=work/missions/2026-11-09-levure-retours/voies/r1/captures --seulement=390-clair,1280-clair,1280-cave`
   Attendu : 30 lignes `CAPTURE …` (10 par format) et `JOURNAL erreurs=0 bloques=0` ; le premier chargement de Vite dépasse 30 s (délais déjà allongés). Port occupé : prendre 5658.
2. Faire une planche côte à côte pour chaque état, avec la capture de référence du brasseur (`../../captures-brasseur/`), dans `voies/r1/captures/cote-a-cote/` :
   - Ma levure au repos : `1-repos-<fmt>` ↔ `1-ma-levure.jpg` ;
   - conduite, palier touché : `3-palier-touche-<fmt>` ↔ `4-conduite-de-base.jpg` ;
   - champ tapé : `2-champ-lal-<fmt>` ↔ `1-ma-levure.jpg` (zone « Changer de levure ») ;
   - recette sans levure : `4-sans-levure-<fmt>` seule.
3. Ouvrir toutes les captures et planches ; dire pour chacune ce qu'on y voit. Rendre à r1 : le journal (`captures/journal.json`, clé `repos.coupees`, `jauges`, `pistes`, `debordeSurLePied`) et tout écart.

## Doutes et limites
- **Saisie libre** : la tuile transmet le texte à `onHorsCatalogue(texte)`, mais le repli « Mon stock ou saisie libre » est l'éditeur du wizard (`identityEditor`), sans propriété de pré-remplissage : il s'ouvre, le texte n'y est pas recopié. Pour le pré-remplir, il faut une prop dans `YeastIngredientPicker` (hors de ma voie).
- **Ouvrir la conduite à l'arrivée** : `YeastRecipePlan` s'ouvre replié et n'a pas de prop « ouvert d'emblée » (sa demande `conductRequest` fait défiler et prend le focus). Je clique donc une fois sur l'en-tête de la station (une fois par levure montée, gardé contre le mode strict). Propre : une prop `initialConductOpen` dans `YeastRecipePlan.tsx`.
- **Pastilles « 1 » et « 2 »** des stations de `YeastRecipePlan` (numéros d'étapes de l'ancien parcours) : masquées dans Ma levure par CSS (`.lv-base .yc-step-number`) ; seule station de l'écran, « 1 » n'avait rien à numéroter. La capture 4 du brasseur montrait « 4 ».
- Pas de conduite dans une recette sans levure ni palier (comme `YeastRecipeChoice`) ; la nouvelle permettait d'y ajouter une primaire. Avec des paliers déjà là, la conduite s'affiche.
- Dans les replis « Objectifs » et « Atelier complet », rien de changé.
- Mesure : première recherche à froid ~350 ms (index construit), ensuite ~10 ms ; la saisie est différée (`useDeferredValue`).
- `YeastRecipePlan` n'a aucun repère `onGoal` utile ici : `() => undefined` (objectifs dans leur repli, sans profil partagé).

DÉCISION À PRENDRE : les pastilles « 1 » (ci-dessus). Options : masquées (fait) ; visibles. Recommandation : masquées. Réversible : retirer la ligne CSS `.lv-base .yc-step-number`.

CONNAISSANCE : `apiLevure.chercher(texte)` ne filtre pas quand le texte désigne une levure précise (« verdant », « nottingham ») : elle rend tout le catalogue (1 308) rangé par proximité, la levure désignée à part dans `tapee` (`ResultatRecherche & { tapee? }`, comme le fait Chercher). Un champ de saisie doit ajouter `tapee` et filtrer par `catalogueMatches(levure, texte)` (`yeastCatalogue.ts`).

LEÇON PROPOSÉE : aucune (barres inverses perdues par un script Bash, deux fois, rattrapées par un test et par Edit : déjà dans les consignes).

## Pilote, après la voie (09.11)
- `YeastRecipePlan` : prop `initialConductOpen` ; le clic simulé sur l'en-tête de la station est retiré de `MaLevure.tsx`.
- Saisie libre : le texte tapé sans résultat pré-remplit la saisie hors catalogue (`src/ui/nomLibreLevure.ts`, contexte lu par `YeastIngredientPicker`, qui reste chargé à la demande) ; test ajouté dans `etapeRetours.test.tsx`.
- Pastilles « 1 » masquées : tranché, gardé (réversible).
- Captures finales : faites avec celles de r2 et du critique, sur la base commune.
