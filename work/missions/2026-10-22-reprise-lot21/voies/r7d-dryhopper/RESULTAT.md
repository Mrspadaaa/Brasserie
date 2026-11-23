OK — huit simulateurs Dryhopper (4 tièdes, 4 chauds), un seul facteur libre : le moment

## Fichiers écrits (dans Possède)
- `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/socle.mjs` : données, baseline commune, dock,
  fiche, honnêteté.
- `…/serie-d/generer.mjs` et `…/serie-d/concepts/d1.mjs` à `d8.mjs` (classes préfixées, L26).
- `…/serie-d/captures.mjs` (captures et preuve du geste).
- `…/serie-d/d1/etat.html` à `…/serie-d/d8/etat.html`.
- `…/serie-d/NOTE.md`.
- `…/serie-d/captures/` : 6 captures par concept, plus `geste-dN.json`.
- Ce RESULTAT.md.

Rien à la racine (`git status` vérifié ; `pistes-l5f.png` était déjà là).

## Concepts
| id | chaleur | ce qu'il montre | geste | vraie valeur | levure |
|---|---|---|---|---|---|
| d1 | tiède | radar m4/h4 de la stout qui se déforme ; un trait pâle pour Idaho 7 « à froid », l'écart est ce qui est emporté | dock par 5′, loupe ×3 | change avec le moment : H13 (4MMP −91 % en 60′ ; −23 % à 90 °C), E03 (Idaho-7, linalol 38 ± 13 µg/L), E10 (1 h ≈ 96 h) | pont vers l'outil (« Levure › Pomona ~+13 agrumes ») |
| d2 | tiède | barres l5b en deux couches : le plein reste, la queue hachurée est emportée ; jauge d'amertume de la stout | dock | idem | dernière étape (« 1 Quand · 2 Levure ») |
| d3 | tiède | verre de stout : filets d'arôme au-dessus de la mousse, bulles de CO₂ ou vapeur ; IBU écrit dans la bière | dock | idem | dernière étape |
| d4 | tiède | trois cadrans de ta demande (floral plus, résineux moins, amertume tenue) ; meilleur moment nommé : actif · 2 j ~ | dock | idem | pont vers l'outil |
| d5 | chaude | fioles de composés (linalol, géraniol, myrcène, 4MMP) qui se vident vers 60′, en échelle log, avec plage sourcée ; teneur du lot | dock | parts retrouvées H30, H13, H31, H33, H11 ; CoA ID7-2573 (0,4 / 0,6 / 45,4 % de l'huile) ; E03 | pont (« Pomona : géraniol → citronellol ~50 % ») |
| d6 | chaude | trajectoire amertume × floral, un point par moment ; bande 16D 50–70 ; couloir « à cru, IBU ? » hachuré | le pouce glisse le long de la courbe | idem | dernière étape |
| d7 | chaude | bouton rond de four : la couronne porte le moment, la roue de barres radiales est face à l'anneau du style | rotation sur la couronne | idem | pont vers l'outil |
| d8 | chaude | ruban de couleurs de la stout : avant, puis avec Idaho 7, avec en hachuré ce qui est emporté ; quatre mini-rubans 60′ / WP / actif / après | dock | idem | dernière étape |

## Sorties décisives
- G1 : `COMMUN OK`, avec couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende,
  parlant et brutes OK.
- G2 : `UNE-QUESTION OK (1 groupe libre : moment)`, sur 8 pages, contexte houblon, dose, levure, base.
- G3 : `EXISTENT OK 17`.
- G4 : `NOTE OK`.
- Joués une fois, recopiés dans la NOTE :
  - D99 : `ACQUIS ECHEC 32 problème(s)`. C'est l'acquis de Comparer (radar, chimie, OSU, valeurs balisés
    `data-acquis`), qui ne vise pas Dryhopper ; rien n'est balisé ;
  - MOTS `--max=80` : `MOTS ECHEC 4/8 au-dessus de 80` (d2 100, d4 94, d5 109, d8 82 ; les autres de 57 à
    77). Hors données : de 30 à 58 mots, `MOTS OK`.
- Geste : 0 erreur de console sur les 8 pages. D'après `geste-d1.json`, actif · 3 j → 30′ fait passer le
  floral de ~+22,1 à ~+8,9 et l'IBU de « à cru » à ≈ 138.

## Captures ouvertes
`serie-d/captures/`, ouvertes et regardées :
- d1 : d1-390.png, d1-wp-390.png, d1-toucher-390.png ;
- d2 : d2-390.png, d2-60-390.png, d2-fiche-390.png ;
- d3 : d3-390.png, d3-60-390.png ;
- d4 : d4-390.png, d4-60-390.png ;
- d5 : d5-390.png, d5-60-390.png ;
- d6 : d6-390.png, d6-toucher-390.png ;
- d7 : d7-390.png, d7-toucher-390.png ;
- d8 : d8-390.png, d8-60-390.png.

## Prédiction
« Le d2 et le d8 à 60′, on voit direct ce que je perds, vachement bien. d6, la courbe amer contre floral,
c'est l'idée, mais les radars restent tout petits au centre, Idaho 7 paraît timide dans la stout. »

DÉCISION À PRENDRE : D99 doit-il s'appliquer à Dryhopper (baliser le radar de d1 et la chimie de d5 en
`data-acquis` en passe 2), ou rester propre à Comparer ?

CONNAISSANCE : avec le moteur, pour ta demande (« plus floral, moins résineux ») et Idaho 7 à 4 g/L dans la
stout 16D, le meilleur moment simulé est le dry hop actif (2 à 3 j) :
- floral ~+22, contre ~+23 après fermentation ;
- résineux ~+14, contre ~+20, parce que le CO₂ emporte la moitié des hydrocarbures (convention H33) ;
- le whirlpool fait déjà ≈ 75 IBU, hors des 50–70 de la 16D.

Pour le seul résineux, l'écart actif / après vient d'une convention, pas d'une mesure.

LEÇON PROPOSÉE : un débordement horizontal d’un seul élément sort le dock fixe de l’écran, et aucun contrôle
de controle-commun ne le voit. Au lot 23, une règle `.d4-g svg { width:100% }` a grossi les pictos de
famille de d4, et les mini-rubans de d8 étaient trop longs. Seule la capture l’a montré. Il faut cibler
l’enfant direct (`.x > svg`), borner les largeurs calculées par celle du conteneur, et mesurer
`scrollWidth ≤ 390` dans le script de captures.
