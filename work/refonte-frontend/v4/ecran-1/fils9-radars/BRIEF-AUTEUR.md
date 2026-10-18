# Lot 9 · Des radars qui ont du sens, par objet (brief auteur, une page)

Fils de fer statiques, 20 min par variante, puis tu livres ce que tu as. Écris en français.
Répertoire : C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie (chemins absolus).
Texte avec barres obliques inverses ou accents graves : outil Write, jamais Bash. Pas de git.

## Ce que le brasseur a dit (18.10, soir)

- « Les spidergraph/radar graph resemble a rien, c'est une vrai régression... » ; « Celui-ci est
  encore pire ??? » (Ma bière).
- Sur la planche des 10 technologies : « P3,4,6,7 semble pas mal ». Base radar retenue :
  **D3, `ecran-1/fils7-radar/p04/radar.html`** (polygones fermés sur 12 axes, non situé au centre
  marqué, libellés entiers, toucher en mots). C'est ton plancher de dessin.
- Sur p08 : « Seul le premier est ok... » (Comparer oui ; Ma bière et Suggestions non).
- « Parcontre ça manque pas que certaines données sont manquantes.. » : oui. La dégustation ne
  note que le résineux (« ma stout est trop résineuses, je la veux plus floral ») ; la prévision
  du moteur est « confiance faible », plages 0 à ~50 sur 100 (`scenarios.S1.before` :
  min, central, max) ; 5 familles non situées ; pas d'intensités dans les fiches (#131).
- Pour la nuit : « Plusieurs versions de radar graph. De suggestions Aussi de ma bière et de mon
  houblons. Fait des fils de fere ».

## Les données

`ecran-1/fils7-radar/donnees.json` (axes, noms, zone du style, ma bière, Suggestions avant/après),
`prototypes/houblons-v4/data/pack-mini-protos.json` (`scenarios.S1.before`, `.tasting`,
`.tolerance`, `.voies`, `styles.16D`) et `pack-fiches.json` (fiche de Nugget : `aromes` avec
niveau, N/M et auteurs, `alpha`, `huiles`). Extrais avec node. **Rien d'inventé** : une valeur
absente se dit ; une prévision incertaine se montre comme une plage, pas comme un point sûr ; le
dégusté et le prévu ne se mélangent pas sans être distingués.

## Ta variante (ton message te donne tes numéros)

- **Ma bière** : m1 dégusté séparé du prévu (le point goûté à part, la prévision en bande min–max) ;
  m2 prévision en bande seule, « non goûté » écrit ; m3 échelle au style (le style en disque,
  ce qui en sort se lit) avec la bande ; m4 grille de dégustation : 12 familles notées 0–3 d'un
  toucher (état vide « à goûter », puis un **exemple marqué « exemple »**), le radar se remplit.
- **Suggestions** : s1 avant / après en bandes (pas en points sûrs) ; s2 seulement ce qui change
  (axes touchés en avant, flèches avant → après) ; s3 petits multiples, un mini-radar par voie, mêmes
  échelles ; s4 libre.
- **Mon houblon** (fiche de Nugget) : h1 radar simple façon Beer Maverick, N/M au toucher ; h2 un
  polygone par source (Beer Maverick, Hopsteiner…), translucides, pour voir où elles divergent ;
  h3 le houblon face au style 16D (familles attendues repérées, sans zone du style dessinée sur les
  citations) ; h4 libre.

## Plancher pour chaque radar

Chaque série est un polygone fermé sur les 12 axes (non situé au centre, marque creuse, secteur
hachuré, légende) ; aucune série en tirets ou pointillés ; les 12 libellés entiers à 390 px ;
anneaux nommés jamais sous un point ; texte de 12 px au moins ; au toucher, la famille et la valeur
en mots. Contrat : `svg[data-radar][data-objet][data-axes]`, séries `[data-serie][data-valeurs]`
sans valeur vide (non situé = 0). Une bande min–max se dessine comme une série
`data-serie="bande"` (anneau plein entre deux polygones fermés).

## Livrable et contrôles

`fils9-radars/<numéro>/vue.html` (ex. `m1/vue.html`) : la vue Ma bière, Suggestions ou fiche à
390 px avec son radar, et une ligne qui dit ce que la variante change. `NOTE.md` de 3 lignes.
1. `node work/refonte-frontend/v4/tournoi/outils/capture-page.mjs <num>/vue.html work/refonte-frontend/v4/ecran-1/fils9-radars/captures/<num>-vue-390.png 1300` ; **regarde**.
2. `node work/refonte-frontend/v4/tournoi/outils/controle-fil6.mjs work/refonte-frontend/v4/ecran-1/fils9-radars <num> --objet=libre` : `FIL6 OK`.
Réponse finale : une ligne par variante.
