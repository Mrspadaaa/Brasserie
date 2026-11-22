# Voie r1 — Ma levure : recherche sur place, conduite de base, alignements (mission 2026-11-09-levure-retours)

- Agent : auteur · Modèle : sonnet · Plafond : 120 tours · Décideur : pilote
- Lis :
  - `CLAUDE.md`, `cerveau/LECONS.md` (L02, L03, L11, L12, L17) ;
  - `.claude/rules/affinee-frontend.md`, `DESIGN.md`, `docs/ui-compacte.md`, le skill `boosters-ux` ;
  - `../../MISSION.md` (ses mots, la lecture des cinq points) ;
  - ses captures dans `../../captures-brasseur/`, à ouvrir toutes : 1 = Ma levure en ligne, 4 = conduite de base, 5 = conduite
    nouvelle.

## Objectif
L'étape Levure, vue « Ma levure » (`src/ui/etapeLevure/MaLevure.tsx`, coque `EtapeLevure.tsx`).

1. **La recherche de base se fait sur place, sans renvoi.**
   - Aujourd'hui, « Changer de levure » appelle `onChanger`, qui bascule sur Chercher (`EtapeLevure.tsx`, `onChanger={() => onVue('chercher')}`).
   - Ce bouton devient un vrai champ de saisie, sur le modèle du champ d'ajout de Malts/sucres
     (`src/ui/fermentescibles/Ajout.tsx` : saisie, résultats en tuiles juste dessous, flèches, Entrée choisit, Échap vide) :
     - au repos, les puces proposées restent (`proposees`) ;
     - en tapant, la liste des levures du catalogue qui correspondent (nom, fabricant, code) remplace les puces : `apiLevure.chercher(texte, {}, reperes)`
       de `src/domain/levure`, sans filtre imposé ;
     - les levures du stock viennent en premier, avec l'icône stock ;
     - toucher un résultat choisit la levure (`onProposee` / `props.onChoisir`) ; on reste sur Ma levure ;
     - sans résultat : « Mon stock ou saisie libre » s'ouvre (`onHorsCatalogue`), avec le texte tapé.
   - L'onglet « Chercher » du segment reste la recherche avancée : il l'ouvre lui-même. Rien dans Ma levure n'y renvoie.
2. **La conduite de base revient.**
   - Remplace `<Conduite …/>` (nouvelle, `Conduite.tsx`) dans Ma levure par la station de conduite de base : `YeastRecipePlan` de
     `src/ui/YeastRecipePlan.tsx`, montée comme dans `YeastRecipeChoice.tsx` (vers la ligne 745), sans objectifs (`goalSlot={null}`).
   - Elle doit garder exactement ce que montre sa capture 4 :
     - la carte « Conduite · température × jours », paliers, fin J ;
     - « Brouillon », « n points à vérifier » ;
     - « <levure> · conduite actuelle » ;
     - la consigne du palier touché ;
     - les poignées ↕ et ↔ ;
     - l'éditeur du palier sélectionné ;
     - « Jours de bascule et légende » ;
     - l'essai, puis « Relire et appliquer ».
   - Branche ses rappels sur la porte du wizard (`p.onChange(next, 'conduct')` ou l'intention que `YeastRecipeChoice` utilise).
     Ne réécris pas sa logique : si une prop manque, lis comment `YeastRecipeChoice` la fournit.
   - `Conduite.tsx` reste dans le dépôt, non monté. Liste-le dans RESULTAT.md.
   - Le repli « Atelier complet » ne doit pas montrer une seconde conduite en double au même moment, si c'est évitable sans perte.
     Sinon, dis-le.
3. **Alignements de Ma levure** : relève sur la capture 1 et sur tes captures chaque défaut d'alignement, puis corrige-le. Liste-les
   dans RESULTAT.md (n°, constat, correction). Au moins :
   - les « + » et × de la nouvelle conduite posés par-dessus le pied « Retour · Suivant » : ils disparaissent avec elle, vérifie
     qu'aucun contrôle ne déborde sur le pied ;
   - la rangée de puces coupée net au bord droit ;
   - l'en-tête de la carte : « 1,0 sachet », ×, « 10–20 g » et la jauge sur une ligne propre ;
   - les colonnes FG · fiche · conduite · floculation, et les jauges des effets, alignées sur une même grille.

## Contrôles
- Un test d'intégration qui échoue avant ta correction (L13), dans `tests/integration/etapeLevure/etapeRetours.test.tsx` :
  - taper dans le champ montre les résultats sur Ma levure, sans changer de vue ;
  - toucher un résultat choisit la levure ;
  - la conduite de base est montée (« conduite actuelle », « Jours de bascule et légende »), la nouvelle ne l'est plus.
- `npx tsc --noEmit -p .`
- `npx vitest run tests/integration/etapeLevure tests/unit/levure tests/integration/YeastRecipeChoice.test.tsx --reporter=dot > work/missions/2026-11-09-levure-retours/voies/r1/tests.txt`,
  puis la ligne « Tests » recopiée dans RESULTAT.md. Les rouges hors zone sont dits, pas laissés.
- Captures dans Chrome sans écran (skill `webapp-testing`), sur le banc `?dev-local&etape=levure`, à 390 tactile et 1280, thème
  clair et thème cave. Chaque capture est ouverte et regardée (L12), côte à côte avec sa capture de référence :
  - Ma levure au repos ;
  - champ tapé avec ses résultats ;
  - conduite, palier touché ;
  - recette sans levure.
  Mets-les dans `voies/r1/captures/`.

## Possède
- `src/ui/etapeLevure/MaLevure.tsx`, `EtapeLevure.tsx`, `Conduite.tsx`, `etapeLevure.css` (classes `lv-`) ;
- `tests/integration/etapeLevure/etape*.test.tsx` ;
- `work/missions/2026-11-09-levure-retours/voies/r1/**`.

Pas `Chercher.tsx`, `vues.css`, `props.ts`, `src/domain/levure/**` : ils sont à la voie r2, qui travaille en même temps. Garde
l'appel `<Chercher {...props} stockIds={stockIds} />` tel quel. Ni commit ni stash.

## Exigences transversales et acquis
- Sa maquette Ma levure l5b (`work/missions/2026-11-09-ecran-levure/p2/l5b/etat.html`) reste la base (règle n° 1). Ses deux
  demandes ci-dessus la modifient. Rien d'autre ne change.
- Au style de l'app, dans les deux thèmes. Peu de texte au premier plan. Inconnu ≠ 0. Jamais `type="number"`
  ([[saisie-mobile]]).
- Rien ne se perd : chaque fonction de Ma levure et des replis reste joignable.

## Rendre (exigé par `.claude/hooks/garde-jetons.mjs`, L18)
- `RESULTAT.md` tenu au fil, mis à jour tous les 5 éléments : une limite de tours ne perd rien.
- La ligne « Tests » écrite dans un fichier (`--reporter=dot > …/r1/tests.txt`), avec la suite entière visée pour les fichiers touchés.
- Les captures 390 tactile et 1280, clair et cave, côte à côte avec ses captures, toutes ouvertes.

Réponse finale au pilote : une ligne. RESULTAT.md contient aussi `LEÇON PROPOSÉE :` si besoin.
