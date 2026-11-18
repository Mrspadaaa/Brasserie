# Voie r2 — Chercher : toute la ligne, alignements ; recherche avancée générique, puis houblons (mission 2026-11-09-levure-retours)

- Agent : auteur · Modèle : opus · Plafond : 120 tours · Décideur : pilote
- Lis :
  - `CLAUDE.md`, `cerveau/LECONS.md` (L03, L04, L11, L12, L17, L29) ;
  - `.claude/rules/affinee-frontend.md`, `DESIGN.md`, `docs/ui-compacte.md`, le skill `boosters-ux` ;
  - `../../MISSION.md` (ses mots, la lecture, l'état de l'art) ;
  - ses captures `../../captures-brasseur/2-chercher-ligne-ouverte.jpg` et `3-chercher.jpg`, ouvertes ;
  - la maquette Chercher qu'il a choisie : `work/missions/2026-11-09-ecran-levure/p2/c6b/` (etat.html, NOTE.md) ;
  - le moteur `src/domain/levure/*` (contrat, filtres, recherche, axes, disponibilité) et la vue `src/ui/etapeLevure/Chercher.tsx` ;
  - pour les houblons :
    - `cerveau/brasseur/penser-brasseur.md` et `cerveau/produit/outils-houblons.md` ;
    - l'étape `src/ui/hopIndex/maBiere/` (`Ajouter.tsx` est la recherche de base sur place, `hote.tsx` la navigation, `ouvrirCouche.ts`
      la pile des outils) ;
    - les données `src/ui/hopIndex/parcours/adaptateur.ts` ;
    - les douze mini maquettes « recherche avancée » qu'il a vues le 24.10 (`work/refonte-frontend/v4/ecran-1/fils24-recherche/`,
      #151). Ce sont des repères d'axes ; la forme suivie est c6b.

## Objectif
Trois livrables, dans cet ordre. Chacun est fini avant le suivant.

1. **Chercher (levure), ses deux plaintes.**
   - « clicker sur une levure n'importe où pas que son nom ouvre son sous menu » : toute la ligne d'une levure ouvre son détail
     (« Choisir pour ma recette · + Comparer »), au clic comme au toucher. Les boutons internes (« ⌕ houblon ? », « Comparer »…)
     gardent leur geste propre (`stopPropagation`). Le clavier marche aussi : la ligne est focalisable, Entrée et Espace l'ouvrent.
   - Alignements, relevés sur ses captures 2 et 3 et sur les tiennes (liste n°, constat, correction dans RESULTAT.md). Au moins :
     - l'en-tête de colonnes « 10 · 19 · 30 · 65 · % · 90 » doit tomber sur les barres de dessous ;
     - les pastilles qui passent à la ligne doivent rester dans leur colonne ;
     - le nom tronqué (« LalBrew NovaLager Br… ») : tout le nom doit se lire, au besoin sur deux lignes ;
     - les barres de chaque ligne doivent commencer à la même abscisse.
2. **Recherche avancée générique.**
   - Le moteur de facettes de la levure et sa vue Chercher deviennent génériques. Un catalogue fournit ses fiches, axes, filtres,
     comptes, disponibilité et ligne.
   - La levure en devient une instance, au comportement inchangé : tous les tests `tests/integration/etapeLevure/vues*` et
     `tests/unit/levure/**` restent verts.
   - Garde l'export `Chercher` et ses props tels que `EtapeLevure.tsx` l'appelle. Ce fichier est à la voie r1 : tu ne le touches pas.
   - Pas de copie parallèle (L11). Le nouveau code générique va dans `src/domain/rechercheAvancee/` et `src/ui/rechercheAvancee/`.
3. **Houblons : « Faire la même chose que levure pour la recherche ».**
   - La recherche de base reste sur place : le champ « Ajouter — houblon… » d'`Ajouter.tsx`, inchangé au repos.
   - À côté du champ, un bouton « Recherche avancée », discret, qu'il touche lui-même. Il ouvre la recherche avancée des houblons
     dans la pile de l'app, comme Suggérer et Comparer (`ouvrirCouche`, route à ajouter si besoin). Elle prend la forme c6b de la
     levure.
   - Facettes houblon tirées des données existantes, sans rien inventer (inconnu ≠ 0, « non documenté » compté à part) :
     - α en plage ;
     - rôle (amérisant, aromatique, mixte) ;
     - familles d'arômes avec leurs pictos et couleurs de l'app (`familyTokens.ts`, `Pictos.tsx`) ;
     - origine ;
     - huiles si la donnée existe ;
     - « en stock chez moi » ;
     - disponibilité.
   - L'ordre d'une ligne suit L04 : nom, α, rôle, arômes en couleur ; le stock en icône seulement.
   - Toucher une ligne ouvre son détail (même geste qu'au point 1) avec « Ajouter à ma recette ». Ce bouton ajoute le houblon par
     la même porte que le champ (`ajouter` de `parcours/operations`, au moment proposé), puis referme la couche sur l'étape.
     « Fiche » ouvre la fiche existante (FicheApp).

## Contrôles
- Tests qui échouent avant ta correction (L13) :
  - la ligne entière ouvre le détail ;
  - le moteur générique rend la levure à l'identique (même liste, mêmes comptes sur un jeu de requêtes) ;
  - facettes houblon sur données réelles du catalogue : comptes disjonctifs justes et « non documenté » à part ;
  - « Ajouter à ma recette » ajoute le houblon.
  Mesure le temps d'une recherche houblon à chaud (cible < 20 ms, L20).
- `npx tsc --noEmit -p .`
- `npx vitest run tests/integration/etapeLevure tests/unit/levure tests/integration/hopIndex tests/unit/hopIndexV4 <tes tests> --reporter=dot > work/missions/2026-11-09-levure-retours/voies/r2/tests.txt`,
  puis la ligne « Tests » recopiée dans RESULTAT.md. Les rouges hors zone sont dits, pas laissés.
- Captures dans Chrome sans écran (skill `webapp-testing`), sur les bancs `?dev-local&etape=levure` et `?dev-local&etape=houblons`,
  à 390 tactile et 1280, thème clair et thème cave. Chaque capture est ouverte et regardée (L12), côte à côte avec c6b et ses
  captures :
  - Chercher levure au repos ;
  - ligne ouverte par un toucher hors du nom ;
  - houblons : le bouton près du champ ;
  - la recherche avancée houblon au repos, puis filtrée ;
  - une ligne houblon ouverte ;
  - après « Ajouter à ma recette ».
  Mets-les dans `voies/r2/captures/`.

## Possède
- `src/ui/etapeLevure/Chercher.tsx`, `src/ui/etapeLevure/vues.css` ;
- `src/domain/levure/**`, `src/domain/rechercheAvancee/**`, `src/ui/rechercheAvancee/**`, `src/ui/hopIndex/rechercheAvancee/**` ;
- `src/ui/hopIndex/maBiere/Ajouter.tsx`, `src/ui/hopIndex/ouvrirCouche.ts` et le fichier de routes de la pile, pour la seule route
  ajoutée ;
- `tests/integration/etapeLevure/vues*.test.tsx`, `tests/unit/levure/**`, tes nouveaux tests `tests/**/rechercheAvancee*` ;
- `work/missions/2026-11-09-levure-retours/voies/r2/**`.

La voie r1 travaille en même temps sur `MaLevure.tsx`, `EtapeLevure.tsx`, `Conduite.tsx` et `etapeLevure.css` : tu n'y touches
pas. Ni commit ni stash. Classes préfixées (`ra-` pour le générique, `lv-` et `hx-` selon l'existant).

## Exigences transversales et acquis
- c6b reste la base de Chercher (règle n° 1). Seuls ses deux retours la modifient.
- Au style de l'app, dans les deux thèmes. Peu de texte au premier plan. Inconnu ≠ 0. Jamais `type="number"`.
- Houblons : penser brasseur (α, rôle, arômes, moment avant l'IBU), stock en icône seulement. L'étape au repos ne change pas : c'est
  le choix « base v4.10 » (`work/refonte-frontend/v4/choix/ecrans.json`).

## Rendre (exigé par `.claude/hooks/garde-jetons.mjs`, L18)
- `RESULTAT.md` tenu au fil, mis à jour tous les 5 éléments : une limite de tours ne perd rien.
- La ligne « Tests » écrite dans un fichier (`--reporter=dot > …/r2/tests.txt`), avec la suite entière visée pour les fichiers touchés.
- Les captures 390 tactile et 1280, clair et cave, côte à côte avec la maquette et ses captures, toutes ouvertes.

Réponse finale au pilote : une ligne. RESULTAT.md contient aussi `LEÇON PROPOSÉE :` si besoin.
