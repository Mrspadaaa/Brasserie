# Voie c1-rail — Le contrôle du rail, sur la maquette jouable

- Mission : 2026-10-23-controles-parcours (lire `../../MISSION.md` d'abord)
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote (option prudente, écrite dans la NOTE ; aucune question bloquante)

## Objectif
Un mode `--parcours` de `controle-rail.mjs` qui rejoue, sur le rail de la maquette jouable, chaque plainte du brasseur
sur le rail qui s'applique à ce format. Le rail est la poignée de chaque ligne de Ma bière et la frise de Dryhopper.
Chaque règle a ses témoins, et le contrôle est joué sur le parcours construit. Ses échecs y deviennent des défauts
nommés pour les écrans.

## Entrées
- `work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs` : à lire en entier. Ses conventions, ses règles, et les
  mots du brasseur en tête.
- `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md`, lignes D27, D28, D34, D35, D36, D37, D37 révisé, D41 à D47, D55,
  D56, D61, D61 bis, D63, D64, D67, D68 et D69 : ses mots, la règle, et la version rejetée.
- `work/missions/2026-10-22-systeme-agents/voies/a1-audit-defauts/AUDIT.md`, § 2 : pourquoi il ne tourne plus, et la
  piste (le modèle de `controle-acquis --outil=dryhopper`).
- `work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs` : comment il joue le curseur de Dryhopper.
- `prototypes/houblons-v4/parcours/ARCHITECTURE.md`, « Contrat d'un écran » : marqueurs, `window.__parcours`.
- `prototypes/houblons-v4/parcours/src/ecrans/dryhopper/jeu.mjs` et `…/ma-biere/jeu.mjs` : comment les écrans jouent
  leurs gestes. On y trouve la frise `.pq-outil-dryhopper [data-role="frise"]` (le dock vit hors de `[data-ecran]`), les
  graduations `[data-cran]` (montrées seulement pendant le geste), `[role="slider"]` et son `aria-valuetext`, les
  jours `[data-jour]`, l'IBU `[data-role="ibu-dry"]` et `[data-role="ibu"]` (`data-valeur`), et la poignée
  `[data-role="glisser-moment"][role="slider"]` de chaque `[data-role="ligne-houblon"]` de Ma bière.
- `prototypes/houblons-v4/parcours/outils/jouer-parcours.mjs` : la façon d'envoyer un vrai geste de doigt (pointeur
  et toucher) et de le maintenir. À imiter, pas à importer.
- Les pages construites `prototypes/houblons-v4/maquettes/parcours/ma-biere/etat.html` et `…/dryhopper/etat.html`. Ne
  pas reconstruire : ce dossier appartient à la session de la maquette. S'il manque, s'arrêter et le dire dans
  RESULTAT.md.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs`
- `work/refonte-frontend/v4/tournoi/outils/temoins/rail-parcours-*/` (pages témoins `etat.html`)
- `work/missions/2026-10-23-controles-parcours/voies/c1-rail/` (NOTE.md, RESULTAT.md)
- Fichiers de travail : `os.tmpdir()`, jamais à la racine du dépôt (L17).

## Consignes
1. **Le mode actuel ne change pas.** Il doit toujours rendre `RAIL OK 1/1` sur `work/refonte-frontend/v4/ecran-1/base
   consolide`. Le nouveau mode s'ajoute à côté, derrière `--parcours`.
2. **Appel** : `node controle-rail.mjs <dossier> <id…> --page=etat.html --parcours`.
   - Les `id` sont des sous-dossiers (`ma-biere`, `dryhopper`, ou un témoin).
   - Par page, une ligne `<id> · <n> règles jouées`. À la fin, `RAIL OK <ok>/<total>`, ou `RAIL ECHEC` suivi de la
     liste.
   - Chaque ligne de problème commence par l'identifiant du défaut (`D47 : …`) et donne la mesure.
   - Une page sans rail repérable est un problème, jamais un « OK 0/0 » (garde de `systeme.mjs cablage`).
3. **Chaque plainte, classée** dans `NOTE.md`, section `## Règles`, une ligne par défaut (les 22) :
   - soit la règle telle qu'elle se joue sur ce format, avec son seuil ;
   - soit « sans objet : <raison> » (par exemple, un seul houblon sur la frise de Dryhopper : D45, D56, D61 bis, D64) ;
   - soit « à brancher : <ce qui manque> », par exemple une ébullition de 90′ ou 120′ que la maquette ne propose pas
     encore (D36, D37 révisé) ; dis alors quoi demander à la session de la maquette (une route ou un état d'essai).
   - Attendues au moins :
     - D27, le moment se glisse ;
     - D34, des tranches de 5′ dans l'ébullition, sans repère imposé ; deux lâchers entre 60′ et 10′ donnent deux
       minutes multiples de 5 et deux IBU différents ;
     - D35, pendant le geste, aucun texte n'en chevauche un autre ;
     - D41, au repos, aucune minute écrite sur le rail qui ne soit ni la durée, ni 0′, ni le moment d'un ajout ;
     - D42, aucune ombre au repos, et un geste interrompu rend le repos ;
     - D44, deux lâchers dans le whirlpool donnent deux réglages, et deux lâchers en fermentation deux jours ;
     - D46, sur 10 pas de 6 px, la poignée bouge au moins 9 fois et reste à 4 px au plus du doigt ;
     - D47, aucune graduation au repos, et seulement celles du segment sous le doigt pendant le geste ;
     - D63, D67 et la leçon L12, la loupe : sous le doigt, l'écart entre deux crans voisins vaut au moins trois fois
       l'écart au loin ;
     - D68, le rail ne se déplace pas de plus de 40 px pendant le geste ;
     - D69, les deux bouts se rejoignent au doigt sur des écrans de 620 et de 844 px de haut.
4. **Témoins** (`temoins/rail-parcours-<nom>/etat.html`) : des pages courtes et autonomes, aux marqueurs du parcours,
   un défaut à la fois. Il en faut au moins :
   - `rail-parcours-ok`, qui passe toutes les règles jouées ;
   - `rail-parcours-gradue`, graduations visibles au repos (D47) ;
   - `rail-parcours-pas10`, des pas de 10′ (D34) ;
   - `rail-parcours-sans-loupe`, des crans à écart constant (D63) ;
   - `rail-parcours-ombre`, une ombre au repos (D42) ;
   - `rail-parcours-extreme`, un bout hors d'atteinte à 620 px (D69) ;
   - `rail-parcours-saccade`, une poignée qui saute par paquets (D46).
   Chaque témoin négatif échoue par son défaut, et non par un autre.
5. **Joué sur le parcours** : `node scripts/agents/systeme.mjs verdict -- node
   work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs prototypes/houblons-v4/maquettes/parcours ma-biere
   dryhopper --page=etat.html --parcours`. Chaque échec va dans RESULTAT.md, section `## Défauts du parcours` :
   l'écran, le défaut, la mesure, et ce que l'écran doit changer. Les écrans appartiennent à une autre session : ne
   les touche pas.
6. Avant de rendre : `node scripts/agents/systeme.mjs cablage` → CABLAGE OK.

## Exigences transversales (recopiées, leçons L05, L12, L13)
- Une plainte devient une règle qui échoue sur la version rejetée : chaque témoin négatif reproduit une plainte.
- Un effet doit se voir : mesurer des positions rendues, pendant un vrai geste de doigt, pas lire le code.
- Pas d'« OK 0/0 » ; pas de caractère de contrôle dans le script (M10) ; aucun `String.replace` avec `$` (L26).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent, avec la section `## Défauts du parcours`. Réponse finale au pilote : une ligne.
