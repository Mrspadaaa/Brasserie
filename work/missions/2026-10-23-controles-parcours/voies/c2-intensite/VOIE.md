# Voie c2-intensite — Le contrôle de l'intensité et de l'usage, sur la maquette jouable

- Mission : 2026-10-23-controles-parcours (lire `../../MISSION.md` d'abord)
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 80 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote (option prudente, écrite dans la NOTE ; aucune question bloquante)

## Objectif
Un mode `--parcours` de `controle-usage-intensite.mjs` (D80) qui compare ce que montrent les écrans de la maquette
jouable au moteur en direct (`window.__parcours`) :
- U1, l'usage de chaque houblon, sur toute route ;
- I1, l'intensité en crans de chaque famille qu'une voie fait bouger, sur Ma bière et Suggérer.

Il a ses témoins, et il est joué sur le parcours construit ; ses échecs y deviennent des défauts nommés pour les
écrans.

## Entrées
- `work/refonte-frontend/v4/tournoi/outils/controle-usage-intensite.mjs` : le contrôle actuel (cas figés, `data-cas`,
  `donnees/<cas>.json`), ses règles U1 et I1, et les mots du brasseur en tête.
- `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md`, ligne D80 (et D90 pour l'usage en mot).
- `prototypes/houblons-v4/parcours/ARCHITECTURE.md`, « Contrat d'un écran » : `window.__parcours` (`moteur`,
  `regles.cransOf`, `regles.hopRole`, `biere()`, `brouillonLu()`, `etat`).
- `prototypes/houblons-v4/parcours/src/ecrans/ma-biere/jeu.mjs` et `…/suggerer/jeu.mjs` : leurs vérifications D80 en
  direct. On y voit comment calculer l'attendu (Ma bière : le profil de la bière avec et sans l'ajout ; Suggérer : les
  candidats du moteur pour la visée). Reprends cette logique dans le contrôle, par route ; n'importe pas ces fichiers,
  ils appartiennent à une autre session.
- Les pages construites `prototypes/houblons-v4/maquettes/parcours/{ma-biere,suggerer,comparer}/etat.html`. Marqueurs
  relevés le 23.10 :
  - Ma bière : `[data-voie]` porte l'id de l'ajout (`data-voie="a1"`, `data-ajout`, `data-houblon-ligne="<clé>"`) ;
  - Suggérer : `[data-voie]` porte un numéro et `data-candidat="<clé>"` ;
  - partout : `[data-famille][data-crans]` et `[data-role="usage"]` (`data-usage`, `data-source`).

  Ne pas reconstruire : ce dossier appartient à la session de la maquette. S'il manque, s'arrêter et le dire dans
  RESULTAT.md.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/v4/tournoi/outils/controle-usage-intensite.mjs`
- `work/refonte-frontend/v4/tournoi/outils/temoins/usage-parcours-*/` (pages témoins `etat.html`)
- `work/missions/2026-10-23-controles-parcours/voies/c2-intensite/` (NOTE.md, RESULTAT.md)
- Fichiers de travail : `os.tmpdir()`, jamais à la racine du dépôt (L17).

## Consignes
1. **Le mode actuel ne change pas.** Il doit toujours rendre `USAGE-INTENSITE OK` sur
   `work/refonte-frontend/v4/ecran-1/fils15-s5-complexe q2b --page=etat-b.html`. Le nouveau mode s'ajoute derrière
   `--parcours`.
2. **Appel** : `node controle-usage-intensite.mjs <dossier> <id…> --page=etat.html --parcours`.
   - Par page, une ligne `<id> · <n> voie(s), <m> usage(s)`. À la fin, `USAGE-INTENSITE OK`, ou
     `USAGE-INTENSITE ECHEC` suivi de la liste.
   - Une page où rien n'est lu (ni voie ni usage) est un problème, jamais un OK.
3. **U1, partout** : chaque `[data-role="usage"]` visible appartient à un houblon. Sa clé est le plus proche
   `data-houblon`, `data-candidat` ou `data-houblon-ligne`, sur lui ou sur un parent ; garde la liste des attributs
   dans l'en-tête du contrôle.
   - `data-usage` vaut `regles.hopRole(clé).value`, ou `inconnu`.
   - `data-source` vaut `fournisseur` ou `règle`, comme le dit D80, selon la source de `hopRole`.
   - Chaque ligne de houblon visible (`[data-role="ligne-houblon"]`) montre son usage.
   - Lignes de problème : `U1 usage : …` (usage faux ou absent), `U1 source : …` (source fausse ou de forme longue).
4. **I1, sur les routes qui ont des `[data-voie]`** (Ma bière, Suggérer) : chaque famille que la voie fait bouger
   d'au moins 0,5 point montre son intensité (`[data-famille][data-crans]`), à 0,6 cran au plus de celle du moteur.
   - L'attendu se calcule dans la page, avec `window.__parcours`, par une petite table par route.
   - Une route qui a des voies, mais pas d'entrée dans la table, est un problème, jamais un passage.
   - Lignes de problème : `I1 absente : …` et `I1 écart : …`.
5. **Témoins** (`temoins/usage-parcours-<nom>/etat.html`) : des pages courtes et autonomes, avec un petit
   `window.__parcours` écrit à la main (`regles.hopRole`, et ce dont la table d'I1 a besoin pour la route que le témoin
   déclare). Un défaut à la fois. Il en faut au moins :
   - `usage-parcours-ok`, qui passe ;
   - `usage-parcours-usage-faux` (U1 usage) ;
   - `usage-parcours-source-longue` (U1 source) ;
   - `usage-parcours-sans-intensite` (I1 absente) ;
   - `usage-parcours-ecart` (I1 écart).
   Chaque témoin négatif échoue par son défaut, et non par un autre.
6. **Joué sur le parcours** : `node scripts/agents/systeme.mjs verdict -- node
   work/refonte-frontend/v4/tournoi/outils/controle-usage-intensite.mjs prototypes/houblons-v4/maquettes/parcours
   ma-biere suggerer comparer --page=etat.html --parcours`. Chaque échec va dans RESULTAT.md, section
   `## Défauts du parcours` : l'écran, le défaut, la mesure, et ce que l'écran doit changer. Le 23.10, Ma bière écrivait
   `data-source="règle : règle rôle-α v1…"` et Suggérer `data-source="règle"`. Les écrans appartiennent à une autre
   session : ne les touche pas.
7. `NOTE.md` : la table des routes, et pour chacune ce qui est comparé et à quoi. Y écrire aussi ce qui reste hors du
   contrôle, par exemple Comparer, qui montre l'intensité en barres et non en crans.
8. Avant de rendre : `node scripts/agents/systeme.mjs cablage` → CABLAGE OK.

## Exigences transversales (recopiées, leçons L05, L13)
- Une plainte devient une règle qui échoue sur la version rejetée : chaque témoin négatif reproduit une faute réelle.
- Comparer à la vérité du moteur, jamais à une valeur que l'écran déclare lui-même.
- Pas d'« OK 0/0 » ; pas de caractère de contrôle dans le script (M10) ; aucun `String.replace` avec `$` (L26).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent, avec la section `## Défauts du parcours`. Réponse finale au pilote : une ligne.
