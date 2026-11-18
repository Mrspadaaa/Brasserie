# f9 · Lisibilité du carnet (dc, da) : pourquoi « difficile à lire, voir », règles pour 9/10

Mesures : `node f9/mesure-lisibilite.mjs` (puppeteer, 390 × 844 tactile, premier écran, clair et cave, texte visible).
Il rend **ECHEC sur les 38 états de dc et da** (témoin L13). Captures regardées : dc repos, journal, articles, comparer ; da repos, carnet, comparer (cave).

| Premier écran | dc : mots · mots < 14 px · sous 4,5:1 (clair/cave) | da : mots · < 14 px · sous 4,5:1 · titres ≥ 18 px |
| --- | --- | --- |
| Liste | 134 · 94 · 2/0 · titre de page de 18 px seulement | 137 · 40 · 0/4 · 5 (24 px + quatre à 18 px) |
| Carnet | journal 160 · 98 · 11/18 | 123 · 35 · 4/1 · 4 (26 px + trois chiffres à 22 px) |
| Articles / dispo | 148 · 117 · 1/0 | dispo 238 · 49 · 6/1 · 6 |
| Comparer | 166 · 160 · 1/0 | 106 · 32 · 0/0 · 1 |
| Pourquoi / décisions | 363 · 225 · 11/18 | 171 · 18 · 0/0 · 1 |

Chaque écran a 3 à 9 fois trop de mots. dc écrit surtout en 11–13 px, da surtout en 14–15 px. On compte 6 à 10 tailles par écran (DESIGN.md en veut 3), 4 à 9 couleurs de texte, et jusqu'à 15 (dc carac) ou 16 (da note) pastilles.

## Pourquoi c'est difficile à lire
- **Liste.** dc : quatre étages gris de 13 px par carnet (titre, « → choix », « parce que… » sur 2 lignes, compte). Le bandeau Caisse et « CARNETS 4 · idées, recherches, choix » font du bruit. Le titre de page (18 px) dépasse à peine les noms (15 px gras).
  da : avant le premier carnet viennent un champ, une phrase d'aide et un sous-titre. Le statut est dit trois fois (bord de couleur, ●●●● et le mot), dans trois couleurs.
- **Tête du carnet.** dc : la carte verte empile 9 choses (étiquette, nom, fournisseur, pays et prix, pourquoi, écartés, « revoir si », vignettes, puce, 2 boutons), puis « CE QUI TRANCHE » cerclé de noir. C'est un cockpit. Le gris y tombe à 4,2:1 sur le vert.
  da : la bannière « Choisi · Pourquoi » est nette. Mais 4 tuiles chiffrées en 22 px lui disputent le regard, et le titre de 26 px n'est plus seul. Suivent le champ et 3 puces pointillées « à jouer ».
- **Articles (dc).** Chaque carte porte une bascule et le mot « Surveiller », un drapeau en pastille, 2 à 3 boutons contour de même poids, et une phrase en pastille (« moins bien partout que… »). C'est un mur de boutons.
- **Comparer.** dc : chaque rangée aligne rang, drapeau, nom long, valeur et barre fine, soit 30 éléments pour 6 lignes, tout en 13 px.
  da : barres épaisses, noms courts, valeurs alignées à droite, c'est le meilleur écran. Mais un sous-titre de 2 lignes et 10 puces (8 « × », Ajouter, Proposer) passent avant le premier tableau.
- **Partout.** On lit jusqu'à 4 « · » par ligne. Les sur-titres sont en MAJUSCULES espacées. La pastille « exemple » se répète.
  Le bleu IA, l'ambre, le violet, l'ocre et le vert se mêlent : aucune couleur ne dit « regarde ici ».

## Ce que je garde, de l'un ou de l'autre (tranché)
- **De da** : la bannière « Choisi · pourquoi » en tête, Comparer en barres épaisses avec noms courts et valeur à droite, le corps de 15–16 px, le fil daté dans la marge.
- **De dc** : les segments Journal · Articles · Comparer (à la place des 4 tuiles), la liste à vignettes avec « → choix », « 3 écartés › » sur une ligne, la rangée de puces de caractéristiques qui défile.
- **Je n'en garde pas** : la carte cockpit de dc, les tuiles chiffrées de da, le champ de saisie permanent, les drapeaux en pastille, les phrases en pastille.

## Règles visuelles pour 9/10
1. **Trois tailles.** Titre d'écran de 24 px gras, seul au-dessus de 18 px. Noms et corps à 16 px. Secondaire à 14 px (date, pays, unité). Les valeurs en Plex Mono tnum à 16 px. Rien sous 14 px : CARNET-LIS prime ici sur les 12–13 px de DESIGN.md, écart voulu.
2. **Un seul titre dominant.** Le nom d'un carnet est en 16 px gras, un compte jamais au-dessus de 16 px. Au flou de 6 px, une seule masse.
3. **Au plus 40 mots au repos à 390**, barre du bas comprise (6 mots). Un carnet de la liste tient en 2 lignes : le nom, puis « → choix » ou « ? question ». Le pourquoi, les comptes, les aides et la dominance sont à un toucher.
4. **Espacements.** 16 px de marge. 8 px dans un groupe, 24 px entre groupes. Les rangées font au moins 56 px et se séparent par un filet. Aucune carte dans une carte. Un seul cadre par écran : la bannière du choix.
5. **Une couleur d'accent.** Le vert dit « retenu ou meilleur » : bannière, barre du meilleur, coche, « −600 » près du prix. Le reste est en encre et en gris d'au moins 4,5:1 sur leur fond réel, en clair comme en cave. Plus de couleur par statut, plus de bleu IA, d'ambre, de violet ni d'ocre.
6. **Des icônes au lieu des mots.** Statut : ○ idée, ◐ compare, ✓ choisi, sans le mot. Veille : un œil, plein s'il surveille, sans bascule ni libellé. IA : ✦. Critère : ★. Retirer : ×. Le pays est un code gris, sans pastille. Une carte a au plus un bouton : la carte entière ouvre la fiche.
7. **Ce qui disparaît au repos** : le champ de saisie (le + l'ouvre), les aides (« Une ligne suffit… », « barre longue = meilleur »), « à revoir si », le détail des écartés (reste « 3 écartés › »), la Caisse dans À venir, les puces de caractéristiques éditables (derrière « Caractéristiques ⌄ »). « exemple » ne paraît qu'une fois, en pied.
8. **Pastilles et ponctuation.** 3 pastilles au plus par écran, seulement pour un état actif (segment ou filtre). Un « · » au plus par ligne, sinon deux lignes. Pas de MAJUSCULES espacées.
9. **Contrôle.** `mesure-lisibilite.mjs` doit dire OK sur la liste, le carnet, les articles, Comparer et Pourquoi, en clair et en cave : mots ≤ 40, aucun mot < 14 px, contraste à 0 échec, un seul titre. Puis le juge visuel donne au moins 9.
