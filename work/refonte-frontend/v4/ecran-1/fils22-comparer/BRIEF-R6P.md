# Brief commun : variantes de r6n2 avec les meilleures idées retenues (r6p1 à r6p4)

Écrit par le pilote le 23.10. Lis-le en entier avant ton VOIE.md.

## Ce qu'il a dit
« Fais mois quelques variantes de r6n2, avec les meilleures idées retenu. Et ensuite on sera bon » (23.10).
r6n2, c'est le premier écran de r6a (qu'il a choisie le 22.10), plus les 37 éléments qu'il avait notés, rangés sous un
dock à un toucher. Le critique l'a jugée satisfaisante après sa passe 2. C'est la dernière ronde de Comparer :
chaque variante doit pouvoir être celle qu'il garde.

## Le plancher : r6n2, telle qu'elle est
`r6n2/etat.html`, `r6n2/generer.mjs`, `r6n2/NOTE.md` et `captures/r6n2-*.png` : ouvre les captures (premier écran, dock
ouvert, Valeurs, Frise, Souche, fiche). Pars d'une copie de `r6n2/generer.mjs` dans ton dossier ; ne modifie pas r6n2.
Garde ce qui fait r6n2 : trois colonnes de la tête au pied, la colonne « Ta stout », le radar r2 au-dessus, les barres
de l5b, la réponse de y1b sous le contexte, le dock sous le pouce, le picto « épicé » qu'il a choisi (cannelle et clou
croisés). La baseline est un plancher à enrichir (L07).

## Les meilleures idées retenues (sources, à lire)
- Les restes des critiques : `work/missions/2026-10-22-reprise-lot21/voies/r6nc2-critique/RESULTAT.md` (le radar
  encore très rose ; le pont de la Frise qui nomme Citra, absent du cas ; la grille des 20 bières dense).
- Ce que r6n1 montre au premier écran et que r6n2 range : `r6n1/NOTE.md`, `captures/r6n1-premier-ecran.png` (pistes
  d'objectif Floral ↑ et Résineux ↓, défi, panel OSU près du radar).
- Les greffes jugées les meilleures sur Dryhopper, à transposer quand elles ont un sens dans Comparer :
  `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/tri/SYNTHESE.md` (section « Greffes ») et
  `work/missions/2026-10-22-reprise-lot21/voies/r7-verdict/RESULTAT.md` (section « Greffes ») : loupe à mini-barres
  chiffrées, ligne du doigt rangée à son solde (« contre ★ »), pictos au bout des courbes, « emporté » en contour (la
  hachure reste réservée à l'inconnu), table d'IBU avec la barre orangée « trop amer », teneur du lot (CoA) dans la fiche.
- L'inventaire : `donnees/elements-notes.json` (37 éléments), tous déjà dans r6n2 : aucun ne doit disparaître.

## Règles qui ne bougent pas
- **Un seul facteur libre : la variété** (D98). 80 mots au plus au premier écran (r6n2 en a 79 : ce que tu ajoutes au
  premier plan, tu le payes ailleurs).
- **Les quatre acquis** (D99), **la reprise** (D104 : chaque élément de l'inventaire classé dans ta NOTE, `## Reprise`,
  et balisé `data-element`), **le radar sans saturation** (D103).
- Honnêteté : simulé « ~ », source citée, inconnu hachuré (la hachure ne veut dire que ça), jamais 0.
- **L26, revenu quatre fois en deux jours** : une classe par rôle, préfixée par ta variante et par composant
  (`r6p1-dock-…`, `r6p1-col-…`) ; avant de rendre, cherche dans ton CSS généré une classe qui sert à deux rôles ; script
  client dans une fonction immédiate ; pas de `String.replace` avec une chaîne qui contient `$`.
- Choix portés (les mêmes que r6a et r6n2 ; à recopier dans ta NOTE, section « Choix portés ») :
  - Radar : r2
  - Base : dose égale
  - Porte : non
  - Descripteurs : A

## Captures (dans `captures/`, préfixe de ta variante)
`<id>-390.png`, `<id>-premier-ecran.png`, `<id>-toucher-390.png` (le dock ouvert, ou ton geste propre),
`<id>-fiche-390.png`. Ouvre chacune en image (L12) et juge-la avec `fils21-choisir/critique/PORTRAIT.md`.

## NOTE
`## Choix portés`, `## Idées reprises` (chaque idée, d'où elle vient, où elle est), `## Reprise` (les 37), et ta règle de
radar (D103). Dis aussi ce que tu as retiré du premier écran pour rester sous 80 mots.
