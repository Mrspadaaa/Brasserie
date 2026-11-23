# Voie r4c-picto-epice-2 — « épicé », changer de genre de solution

- Mission : 2026-10-22-reprise-lot21
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Plafond : 60 tours ; 3 essais par critère
- Dépend de : r4-picto-epice (refusée)
- Décideur en cas de doute : brasseur (il choisit) ; pilote pour la forme de la planche

## Contrat réécrit (22.10, relance 1 après le rejet du critique)
La première passe (six genres) est rejetée : `voies/r4cr-critique-picto/RESULTAT.md`. La planche est
resserrée : le piment en 2 ou 3 dessins, à côté d'Herbacé et de Végétal, sur Columbus, Cascade et
Saaz ; le mot « épicé » en repli (12 px au moins) ; le É en dernier recours. Le critère G2 de
`GATES.md` fait foi (3 à 5 propositions, deux genres au moins). Le texte ci-dessous est celui de la
première passe.

## Objectif
Une nouvelle planche de **6 à 8 propositions** pour la famille Épicé, rendue et capturée à 390 px. Ce
n'est pas une variante de plus de la même idée : chaque proposition est d'un **genre de solution
différent**, et la planche en compte au moins cinq.

## Pourquoi
Le picto a été refusé trois fois :
- lot 15 : « pico épice très étrange, plutôt vanille, canelle ? » ;
- lot 21 : les grains de poivre, « épicé l'icone est toujours pas bon.. » ;
- 22.10 : les sept pictos de r4, « Aucun me convient... », avec une croix rouge sur toute la planche
  (`fils22-picto-epice/captures/planche-refusee-22-10.jpg`).

Les sept refusés étaient tous du même genre : une épice dessinée comme un petit objet brun.
Badiane, girofle et coriandre ne se lisent plus à 16 px ; la cannelle y devient une gélule, la vanille
un haricot. Changer d'épice ne suffit donc pas : il faut changer de genre.

## Entrées
- `work/refonte-frontend/v4/SPEC-BRASSEUR.md` — ses trois refus, mot pour mot.
- `work/refonte-frontend/v4/ecran-1/fils22-picto-epice/NOTE.md` et `captures/planche-390.png`, `captures/planche-refusee-22-10.jpg` — ce qui a été refusé et pourquoi ça ne se lisait pas (à ouvrir en image).
- `cerveau/produit/pictos-familles.md` — symboles déjà pris par d'autres familles : feuille, brins, sapin, monticule, roue, fleur, flamme d'ébullition.
- `work/refonte-frontend/v4/ecran-1/fils17-standard/v3/planche.html` et `fils17-standard/jetons-familles.json` — les 11 autres pictos et les tons (Épicé : `#7a4e3a`).
- `work/refonte-frontend/v4/ecran-1/fils22-picto-epice/generer-planche.mjs` — la mise en page de la planche précédente (à reprendre si utile).
- `work/refonte-frontend/v4/tournoi/outils/controle-planche-picto.mjs` — le critère, avec `--refuses` et `--genres=5` : lis l'en-tête.
- `node_modules/lucide-react/dist/esm/icons/` — les icônes d'action de l'app (licence ISC) : `flame`, `sparkles`, `zap`, `wind`, `asterisk`… à prendre comme point de départ si un genre s'y prête.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-2/**` (`generer-planche.mjs`, `planche/etat.html`, `NOTE.md`, `captures/`)
- `work/missions/2026-10-22-reprise-lot21/voies/r4c-picto-epice-2/RESULTAT.md`

## Consignes
- **Genres à couvrir, cinq au moins** (`data-genre` sur chaque bloc `data-variante`). Ce sont des
  pistes ; tu peux en trouver d'autres :
  - **la sensation** : ce que l'épicé fait au nez ou en bouche (étincelles, picotement, chaleur
    montante), en abstrait ;
  - **l'icône universelle** : ce que la plupart des applis montrent pour « épicé ». Si c'est un
    piment, dis dans la NOTE que l'épicé du houblon n'est pas le piquant, et laisse le brasseur
    juger ;
  - **la lettre ou le monogramme** au trait ;
  - **le mot seul**, sans picto (`data-nature="mot"`), si les 11 autres pictos s'en accommodent en
    contexte ;
  - **le composé** : un signe d'une autre famille, ou le cône de houblon, avec une marque épicée ;
  - **la forme géométrique** propre à la famille, sans figuratif.
- **Aucune idée déjà refusée** : poivre, cannelle, vanille, badiane, girofle, mortier et pilon,
  coriandre, saupoudreur. Aucun dessin repris de la planche refusée. Le critère le vérifie (`--refuses`).
- **Dessin** : viewBox 24, au trait, ton `#7a4e3a`, épaisseur 2.571, sans halo (D88). Il doit se lire
  à 12 et 16 px. Juge sur capture, pas sur le code.
- **En contexte** : chaque proposition à 16 px sur une ligne de houblon, parmi 3 pictos réels d'autres
  familles au moins. Montre aussi un **« avant / après »** : la ligne avec le picto rejeté, puis avec
  la proposition.
- **Captures** à 390 px : `captures/planche-390.png` et `captures/contexte-390.png`. **Ouvre-les en
  image** et juge-les (L12).
- `NOTE.md` : pour chaque proposition, son genre, ce qu'elle dit à un brasseur, son risque de
  confusion, et ta recommandation (sans classement imposé : il choisit).

## Exigences transversales et acquis
Code couleur des arômes (le ton de la famille) ; pictos au trait (D88) ; peu de texte ; le brasseur
choisit.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent, avec la liste des captures ouvertes et `DÉCISION À PRENDRE`.
Réponse finale au pilote : une ligne.
