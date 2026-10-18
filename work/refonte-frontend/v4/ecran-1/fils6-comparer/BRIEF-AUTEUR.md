# Lot 6 · Comparer sur p03, en fils de fer (brief auteur, une page)

Tu fais **des fils de fer statiques**, pas un prototype : 15 min par variante, puis tu livres ce
que tu as. Pas de générateur, pas d'autres pages, pas de geste à coder. Écris en français.
Répertoire : C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie (chemins absolus).
Texte avec barres obliques inverses ou accents graves : outil Write, jamais Bash. Pas de git.

## Ce que le brasseur a dit (18.10, soir, planche du lot 5a)

- « J'aime beaucoup la variante 3 mais ça manque d'intervalle de confiance, pourquoi il y a pas
  la partie arôme saveur aussi en comparaison ? » (il entoure la rangée d'arômes de p10 :
  `fils5-comparer/captures/p10-comparer-390.png`, le bloc Floral → Végétal en bas).
- « C'est pas trop mal globalement... Mais il manque quelque info, notamment la relation avec le
  style. » ; « C'est mieux mais pas encore meilleur que le site original » (Beer Maverick).
- Sur le trait noir de p03 : « Pourquoi il y a parfois le truc noir pas toujours ?? » (c'était
  l'α de son lot, seulement sur α ; il le lit comme le trait de centre de Beer Maverick).

## Point de départ

`work/refonte-frontend/v4/ecran-1/fils6-comparer/_depart/comparer.html` (Barres) et
`comparer-radar.html` (Radar) : p03 figé, HTML statique. Copie-les dans `fils6-comparer/pNN/` et
modifie-les à la main. Garde le parti de p03 : une bande par houblon, puis des rangées compactes
par mesure, chaque source en trait fin, le détail en ligne. Référence Beer Maverick :
`work/refonte-frontend/v3/reference/beer-maverick/telephone/t1` à `t7` et `constats.md`.

## Ce que tu ajoutes (le composant étudié)

1. **Intervalles partout.** Sur chaque barre, un **trait de centre** fin (comme Beer Maverick) :
   centre = moyenne des milieux des sources de la fiche. **Mon lot** est une autre marque (point,
   triangle…), nommée sur place (« mon lot 13 ») ; East Kent 5,5 est lu sur l'article : « article
   5,5 ». Jamais une même marque pour deux sens. IBU et dose avec leur plage (60′, 20 L,
   DI 1,066 ; IBU = g × 0,1 × α) :
   Nugget 60 IBU avec mon lot (autre lot : 44–74), 46 g (autre lot : 37–63 g) ;
   East Kent 25 IBU (18–32), remplace Nugget à 109 g (86–150 g) ;
   Fuggle 21 IBU (11–28), 133 g (98–250 g).
2. **Arôme et saveur en comparaison, aussi en Barres** : les 12 familles × 3 houblons (citations
   0 non décrit, 1 cité, 2 marqué, avec N sources sur M), et les descripteurs de chaque houblon
   (« Flavor & Aroma » de Beer Maverick). Données : `prototypes/houblons-v4/data/pack-fiches.json`
   (`aromes`, `descripteurs.beerMaverick`), extrais avec node.
3. **La relation avec le style 16D** (Foreign Extra Stout, BJCP ; `pack-mini-protos.json`,
   `styles.16D`) : familles **attendues** floral, herbacé, terreux (« Low earthy, herbal, or floral
   hop aroma optional ») ; les 9 autres ne sont pas nommées par le style ; IBU du style 50–70 ;
   les styles où chaque houblon est employé (`usage[].styles` : Nugget West Coast IPA, NEIPA,
   Session IPA ; East Kent et Fuggle English IPA). **Jamais** de zone du style dessinée sur les
   citations d'un houblon ni dans le radar des houblons : la relation passe par le repérage des
   familles, la bande d'IBU et une lecture courte (« East Kent : floral et herbacé attendus en 16D,
   sans résineux »).
4. **Mieux que Beer Maverick, au complet** : composants des huiles (myrcène, humulène,
   caryophyllène, linalol, en plages, à un toucher ou sous le pli) ; cohumulone et farnésène :
   « non importés » (ticket #131), sans valeur inventée.

## Températures (ton message te donne tes numéros)

- **Froid** p01 : p03 + le bloc de p10 entouré, tel quel, sous les rangées. p02 : p03 + les
  rangées à points de p11 (cité / marqué) et une ligne de descripteurs par houblon.
- **Tiède** p03 : les familles en rangées dans le tableau de p03, une cellule par houblon (N/M) ;
  les 3 attendues en 16D d'abord, les 9 autres sous un pli. p04 : la bande de chaque houblon dit
  « en 16D » ce qu'il apporte (attendues, non nommées), descripteurs en puces. p05 : la réponse
  d'abord, une ligne par houblon face au style, puis le tableau. p06 : une matrice 12 × 3
  (cellule teintée par le niveau, N/M), colonnes attendues repérées.
- **Chaud** p07 à p11 : aucune contrainte de forme, mêmes exigences.

## Règles du fil de fer

- Largeur 390. Barres : 2 écrans au plus (1688 px) ; le premier (844) montre les houblons, les
  intervalles et le début des arômes face au style. 80 mots au plus au premier écran.
- Gris, et les couleurs des houblons (Nugget #0072B2, East Kent #009E73, Fuggle #CC79A7) ; pas
  d'orangé d'alerte (il appartient à ma bière). Texte de 12 px au moins.
- Contrat DOM : garde tous les `data-*` du point de départ, et ajoute :
  `[data-role="central"][data-valeur]` visible dans chaque `[data-plage]` ;
  `[data-role="lot"][data-valeur][data-origine="stock|article"]` ;
  `data-min` et `data-max` sur `[data-role="ibu-recette"]` et `[data-role="dose-equivalente"]`,
  la plage écrite dedans ; `[data-role="arome"][data-houblon][data-famille][data-niveau]
  [data-sources][data-de]` pour 12 familles × 3 houblons dans comparer.html (clés du pack :
  citrus, tropical, stoneFruit, pomeFruit, berries, melon, floral, herbal, resin, spice, green,
  earthy) ; `[data-role="descripteurs"][data-houblon]` ; `[data-role="style"][data-code="16D"]` ;
  `[data-statut-style="attendue|neutre"]` sur chaque famille ; `[data-role="bande-style"]
  [data-mesure="ibu"][data-min="50"][data-max="70"]` ; `[data-role="styles-usage"][data-houblon]`.

## Contrôles, une fois chacun

1. `node work/refonte-frontend/v4/tournoi/outils/capture-page.mjs <pNN>/comparer.html
   work/refonte-frontend/v4/ecran-1/fils6-comparer/captures/pNN-comparer-390.png 1688`, idem
   `comparer-radar` ; **regarde** les deux captures.
2. `node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs
   work/refonte-frontend/v4/ecran-1/fils6-comparer pNN --max=80 --page=comparer.html` (et
   `comparer-radar.html`) : `MOTS OK`.

Corrige, recapture une fois, arrête-toi. `NOTE.md` de 3 lignes : le parti, ce que tu as ajouté,
ce qui manque. Réponse finale : une ligne par variante.
