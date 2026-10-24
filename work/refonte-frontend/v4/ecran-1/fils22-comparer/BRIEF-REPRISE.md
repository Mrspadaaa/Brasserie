# Brief commun : lot 22 bis, la reprise de r6a (r6n1, r6n2)

Écrit par le pilote le 22.10, soir. Lis-le en entier avant ton VOIE.md.

## Ce qu'il a dit
- « r6a est le meilleur mais reprendre trop peu d'éléments que j'avais noté bon ou intéressant des autres
  variante, notamment la meilleure. » (22.10, lot 22)
- La « meilleure » est y1b : « y1b est de mon point de vue semble meilleur. » (20.10, lot 21)
- « d1, tout ouvert était aussi interessant mais trop bordélique. » (20.10)
D104 dans `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md`.

## Le plancher : r6a, telle qu'il l'aime
`r6a/etat.html`, `r6a/generer.mjs` et `r6a/NOTE.md`, avec ses captures `captures/r6a-*.png` : ouvre-les.
Garde ce qui l'a fait choisir : les trois colonnes côte à côte (une par houblon, de la tête au pied), la colonne
« Ta stout », le radar r2 au-dessus, les barres de l5b par famille comparées en travers, la tête de colonne
dans l'ordre du brasseur (nom, α, rôle en mot, familles en couleur, stock en icône), les vraies valeurs et la
chimie à un toucher, le panel OSU, le pont vers Dryhopper. Pars d'une copie de `r6a/generer.mjs` dans ton
dossier ; ne modifie pas r6a. La baseline est un plancher à enrichir (L07).

## Ce que tu ajoutes : l'inventaire
`donnees/elements-notes.json` liste tout ce qu'il a noté bon ou intéressant, avec ses mots, la variante et une
capture. **Ouvre chaque capture citée** avant de dessiner, en commençant par y1b
(`work/refonte-frontend/v4/ecran-1/fils21-choisir/captures/y1b-*.png`). Pour chaque élément, choisis :
- **repris** : il est sur l'écran, adapté à Comparer ;
- **en contexte** : c'est un facteur fixé ; il se montre dans la ligne de contexte (`data-role="contexte"`),
  sans contrôle ;
- **en pont** : il appartient à un autre outil (Dryhopper, Levure, Suggérer, la fiche) ; un lien ou un bouton
  y mène, avec un aperçu qui donne envie d'y aller ;
- **écarté** : seulement si le reprendre casserait une règle (un seul facteur libre, la variété ; 80 mots au
  premier écran…). La raison, en une phrase d'au moins six mots, nomme la règle. Un quart au plus.
Balisage : chaque élément repris, en contexte ou en pont porte `data-element="<id>"` (plusieurs `id` séparés
par des espaces si un même objet en porte plusieurs). Un élément à un toucher a un déclencheur visible au
repos qui porte `aria-controls` vers son conteneur, ou `data-ouvre-element="<id> …"`. Un seul toucher, jamais
deux. Lis l'en-tête de `tournoi/outils/controle-reprise.mjs`.
Dans ta NOTE, section `## Reprise` : une ligne par élément, `- <id> : repris — <où>` (ou `en contexte — …`,
`en pont — …`, `écarté — <raison>`).

## Règles qui ne bougent pas
- **Un seul facteur libre : la variété** (D98). Le sélecteur de houblon est le seul groupe libre. La levure
  (a2b), le moment et le dry hop (x3b) appartiennent à Levure et Dryhopper : en contexte ou en pont.
- **80 mots au plus au premier écran.** r6a en a déjà 79 : remplace des mots par des formes, enlève les
  redites. Pas de cockpit ([[pas-de-cockpit]]) ; pas de légende au premier plan, un « ? » la donne.
- **Les quatre acquis** (D99) : radar avec intervalles, chimie rattachée aux familles, panel OSU sans molette,
  vraies valeurs sourcées ; au repos ou à un toucher.
- **Le radar saturé** (D103, prédit sur r6a) : la bande d'Idaho 7 touche le bord sur presque tous les axes et
  fait « une grande étoile pâle ». Corrige-le : un haut hors domaine se marque d'un signe au bout de l'axe (il
  ne pousse pas la bande au bord), ou la bande n'apparaît qu'au toucher. Dis ta règle dans la NOTE.
- Code couleur des arômes, pictos au trait, au style par défaut, α en tête puis rôle en mot, stock en icône,
  appui long sur un houblon → la vraie fiche. Honnêteté : source citée, simulé marqué « ~ », inconnu hachuré,
  jamais 0.
- **L26** : préfixe tes classes (`r6n1-…`, `r6n2-…`), assemble le code client par `split/join` ou une
  fonction de remplacement, jamais par `String.replace` avec une chaîne qui contient `$`.
- Données : `donnees/comparer-stout.json` seulement (déjà vérifiées par D102). Ne les modifie pas.

## Choix portés (les mêmes que r6a ; à recopier dans ta NOTE, section « Choix portés »)
- Radar : r2
- Base : dose égale
- Porte : non
- Descripteurs : A

## Captures (dans `captures/`, préfixe de ta variante)
`<id>-390.png` (page entière), `<id>-premier-ecran.png` (390 × 844), `<id>-toucher-390.png` (après un
toucher qui ouvre des éléments), `<id>-fiche-390.png` (appui long). Ouvre chacune en image avant de dire OK,
et juge-la avec `fils21-choisir/critique/PORTRAIT.md` : « Je comprends ou pas ? », en trois secondes.
