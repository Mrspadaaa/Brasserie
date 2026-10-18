# Lot 10 · Échelles, classements et vraies comparaisons de houblons (brief auteur, une page)

Fils de fer statiques, 20 min par variante, puis tu livres ce que tu as. Écris en français.
Répertoire : C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie (chemins absolus).
Texte avec barres obliques inverses ou accents graves : outil Write, jamais Bash. Pas de git.

## Ce que le brasseur a dit (18.10, soir)

« Plusieurs versions de radar graph. […] Fait des fils de fere, et un ladder de comparaison et un
ranking ect... » ; « Aussi des vrais comparaison... ». Avant : Beer Maverick est le plancher de
Comparer (« il faut faire mieux, pas moins bien ou la même chose ») ; « il faut des intervalles de
confiance » ; « il manque quelque info, notamment la relation avec le style ». Ordre de lecture
d'un brasseur : α, rôle, arômes, moment, puis IBU ; le stock en icône.

## Les données

`prototypes/houblons-v4/data/pack-fiches.json` : 32 houblons (α, β, huiles et composants avec
sources et années, `aromes` 12 familles en citations 0–2 avec N/M, `descripteurs`, `usage[].styles`,
`ibuParGramme`, stock). `pack-mini-protos.json` : `styles.16D`, la recette S1 (Nugget 46 g à 60′),
`stock`. Extrais avec node. Rien d'inventé ; une plage reste une plage (trait de centre = milieu
moyen des sources) ; « non renseigné » quand la fiche n'a rien.

## Ta variante (ton message te donne tes numéros)

- **e1 · Échelle d'une mesure** : les 32 houblons rangés sur une échelle verticale par un critère
  choisi (α par défaut ; puis une famille d'arôme, huiles totales), chaque houblon en plage, ceux
  de ma recette et de mon stock repérés ; un toucher en ajoute deux ou trois à comparer.
- **e2 · Échelles croisées** : les mêmes houblons sur plusieurs critères à la fois (lignes qui
  relient le rang d'un houblon d'un critère à l'autre), pour voir qui garde son rang.
- **r1 · Classement pour un objectif** : « plus floral, sans résineux, en 16D » : les houblons
  classés, chacun avec la raison (familles citées, N/M), l'IBU à la dose de la recette et le
  stock en icône ; la règle de classement écrite en une ligne.
- **r2 · Duel** : deux houblons à la fois, « lequel je prends ? », gagnant par critère, puis le
  suivant ; le classement se construit par duels.
- **c1 · Vraie comparaison, houblons riches** : Citra cryo, Galaxy, Idaho 7 (fiches complètes),
  sur la grammaire de Comparer p3 choisie par le brasseur (bandes par houblon, rangées compactes
  par mesure, sources en traits fins, centre, plages d'IBU et de dose, arômes en Barres, relation
  au 16D, radar D3 `ecran-1/fils7-radar/p04` en lentille).
- **c2 · Vraie comparaison, mon stock** : les houblons du stock entre eux, même grammaire.

## Règles

Largeur 390 ; gris et une couleur par houblon comparé (Okabe et Ito : #0072B2, #009E73,
#CC79A7, #56B4E9), jamais l'orangé d'alerte ; le nom du houblon sur chaque barre ; texte de
12 px au moins ; 90 mots au plus au premier écran.

## Livrable et contrôles

`fils10-echelles/<numéro>/vue.html` et `NOTE.md` (3 lignes : le parti, ce que ça apporte face à
Beer Maverick, ce qui manque).
1. `node work/refonte-frontend/v4/tournoi/outils/capture-page.mjs <num>/vue.html work/refonte-frontend/v4/ecran-1/fils10-echelles/captures/<num>-vue-390.png 1688` ; **regarde**.
2. `node work/refonte-frontend/v4/tournoi/outils/controle-fil6.mjs work/refonte-frontend/v4/ecran-1/fils10-echelles <num> --objet=libre` : `FIL6 OK`.
3. `node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/ecran-1/fils10-echelles <num> --max=90 --page=vue.html` : `MOTS OK`.
Réponse finale : une ligne par variante.
