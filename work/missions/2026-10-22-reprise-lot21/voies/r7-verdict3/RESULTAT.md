OK — verdict : satisfaisant

Avis indicatif (L27, étalonnage non fait) : aucun REJET, les quatre ont progressé en densité (médiane du panel 0,64,
aucune sous 0,55, 0 paire presque identique, `controle-panel` PANEL OK ; r6n2 à 0,70) et la phrase prédite reste
positive pour chacune, avec son « mais ». Trois défauts vérifiables sont à corriger en micro-correctif avant de lui
montrer (section « Avant publication ») ; aucun n'est de l'ordre d'une passe 4.
Captures ouvertes : `serie-a/passe3/captures/a1-premier-ecran.png`, `a1-toucher-390.png`, `serie-b/passe3/captures/b4-premier-ecran.png`,
`b4-toucher-390.png`, `travail/b4-pendant.png`, `serie-d/passe3/captures/d8-premier-ecran.png`, `d8-toucher-390.png`,
`serie-e/passe3/captures/e5-premier-ecran.png`, `e5-toucher-390.png`, les quatre `passe2/captures/<id>-premier-ecran.png`
et `fils22-comparer/captures/r6n2-premier-ecran.png`.

- **b4** (podium des moments) — ACCEPTÉ : la passe 3 est au niveau de r6n2 : fond blanc, filets, la réponse en gros
  (« Dry hop actif, 2 j »), la ligne « ta stout » en tête, floral / résineux en l5b et jauge d'IBU par moment, les 12
  familles en mini-barres par ligne avec un seul axe de pictos, la mesure du moment (« 38 µg/L McCabe 2023 », « ? »
  hachuré au whirlpool et à 10′, « cuit » à 60′), loupe à mini-barres chiffrées vue sur `b4-pendant.png` (45′ ≈+5 … 25′
  ≈+10), ligne du doigt rangée à son solde (« à 35′ contre ★ : floral ≈−14 · résineux ≈−9 · trop amer », ≈142 IBU), 80 mots.
  Phrase prédite : « Vachement bien celui-là, je lis la réponse direct et chaque ligne me dit pourquoi ; à 35′ je vois
  tout de suite que c'est trop amer. Mais la tour résineux elle est pareille partout, et 8,1/15 c'est quoi ? »
  Correction attendue : la mini-barre résineux est bornée à 40 px (`Math.min(40, v*40)`, échelle de la bande) donc 83,
  97 et 103 ont la même hauteur alors que la barre l5b à côté bouge — mettre les mini-barres sur la même échelle
  ×1,12 que la l5b, ou faire déborder le chapeau orangé à proportion ; « 8,1/15 » suivi d'un mot (« 8,1/15 au panel »)
  comme « cuit » l'a (D66, « Pourquoi il y a cité ? »).
- **e5** (on gagne / on paie) — ACCEPTÉ : la pile par famille remplit le haut de la figure (floral, baies, tropicaux,
  agrumes, noyau, pictos en tête dans l'ordre), le spectre des 12 familles au moment touché (« ta stout → avec Idaho 7 »,
  Pépins et Melon hachurés, résineux orangé au-delà de la zone), « contre ★ floral ≈−18 » et le bouton « ★ actif · 2 j »
  dès qu'on quitte le meilleur, « trop amer ≈157 IBU » en rouge dans la figure, jours sans gain en pâle et pointillé, 77 mots.
  Phrase prédite : « Très bien, je vois ce que je gagne et ce que je paie, et le spectre en bas c'est ce que je voulais.
  Mais pourquoi la zone rose s'arrête au whirlpool ?? Et "à vérifier" ça veut dire quoi ? »
  Correction attendue : la bande 16D du floral est dessinée par curseur (`.e5-pl` ébullition, `.e5-jo` jours, rien sur
  actif et après) : en passe 2 elle courait de 60′ à après, en passe 3 elle s'arrête à WP, et les colonnes actif, après,
  1–7 j sont sur blanc ou gris (D57, « Pourquoi il y a parfois le truc noir pas toujours ?? » ; régression visible entre
  `passe2/captures/e5-premier-ecran.png` et la passe 3). Étendre la bande sur toute la largeur de la figure (une seule
  `data-role="zone"` derrière les trois segments). « à vérifier » après la mesure : le retirer ou dire « 1 mesure ».
- **d8** (ruban de la stout) — ACCEPTÉ : fond blanc, la table d'IBU chiffrée par étape (162 et 75 en orangé, « 60+? »
  à cru, la minute du doigt suit : 45′ → 150), le profil du floral et le trait orangé sous le rail, la loupe chiffrée
  (55′ ~+3 … 35′ ~+8), « contre ★ actif 2 j · trop amer » avec six familles en barres, emporté en contour, hachure à
  l'inconnu seul, « linalol 38 ± 13 µg/L McCabe 2023, au levurage », 79 mots.
  Phrase prédite : « Pas mal, on voit la bière changer de couleur et maintenant je vois le piège de l'IBU d'un coup.
  Mais "★ ici" à 3 j alors qu'au doigt le meilleur c'est actif 2 j ??? Et le "o actif" dans la table, c'est le même
  que l'étoile ? »
  Correction attendue : `contreApres = !ecart && p.seg !== 3` affiche « ★ ici » dès qu'aucune famille ne s'écarte de
  0,5 du meilleur, donc sur tout le plateau 2–7 j ; écrire « ★ actif 2 j, pareil à 3 j » (ou poser le dock sur 2 j au
  repos, comme a1, b4, e5) ; un seul marqueur du meilleur, l'étoile, dans la table comme dans le bloc « contre » ;
  « au levurage » ne tient que pour actif, pas pour la ligne mesurée à 45′ (vérifier que le texte suit le moment).
- **a1** (y1b affiné) — ACCEPTÉ : le vide est comblé (0,41 → 0,64) sans un mot de plus (77), l'amertume devient une
  ligne de la figure avec son ruban d'IBU (orangé de 60′ au whirlpool, « 60+? » à cru, ≈119 à 20′), pastilles d'étape
  trop amères soulignées, loupe à mini-barres chiffrées (30′ ≈+9 … 10′ ~+13), « contre ★ actif · 2 j : floral ≈−11 ·
  résineux ≈−7 · trop amer », courbe de la levure sur le dock, certificat du lot dans la fiche, « sans gain » en
  pointillé pâle, plus de code de source au premier plan.
  Phrase prédite : « C'est y1b en mieux et c'est plus rempli, le dock en bas est bien. Mais c'est quoi toutes ces
  petites cases ? À part résineux et amertume je vois rien bouger dedans, ça fait tableau. »
  Correction attendue : les rubans de 24 cases par famille (240 cases) ne montrent leur dégradé que sur résineux
  (hors style partout) et amertume ; sur floral, herbacé, terreux, végétal les cases sont quasi uniformes au premier
  écran, l'effet promis (« où elle monte avant de glisser ») ne se voit pas (L12 : un effet doit se voir). Étirer le
  contraste du ruban entre le minimum et le maximum de la famille (pas entre 0 et le maximum du style), ou ne garder
  le ruban que sur la famille « par » choisie et la ligne Amertume, et rendre l'air aux autres barres. Ce que je lui
  prête sans pouvoir le citer : l'écran lui paraîtra chargé ; signalé, pas sanctionné.

## Classement après la passe 3

1. **b4** — la seule au niveau de r6n2 en trois secondes et en habillage ; monte de la 2e place.
2. **e5** — la figure la plus brasseur (gagne / paie, spectre des 12), un seul défaut vérifiable, la bande coupée ;
   descend de la 1re place à cause de cette régression.
3. **d8** — la plus belle représentation et la table d'IBU la plus parlante ; la réponse « quand ? » reste à lire
   (« ★ ici » petit, à droite).
4. **a1** — fidèle à y1b (D104) et dense, mais la passe 3 a troqué l'air contre du bruit.

La passe a progressé : densité sur les quatre, fond blanc comme r6n2 sur b4, d8, e5, un seul sens par trait partout
(hachure = inconnu, contour = emporté, pointillé pâle = sans gain, orangé = hors style), codes de source retirés du
premier plan, « au levurage », « 1 fiche » une fois. Aucune n'est restée sur les exemples du brasseur.

## Greffes

- « linalol 38 ± 13 µg/L », l'intervalle de la mesure — d8 → a1, b4, e5 (« il faut des intervalles de confiance »).
- Ligne « ta stout » en tête, avec ses 12 familles — b4 → d8 (le ruban « Ma bière » n'a que le résineux lisible : y
  poser les 12 mini-barres) ; a1 (le trait noir de la stout dans chaque barre l5b, comme r6n2).
- Pile par famille sur le rail (ce qu'on gagne, toutes familles) — e5 → d8 (le profil du floral seul sur le rail), b4
  (dock : les marches d'ébullition en floral seul).
- Table d'IBU par étape avec la minute du doigt — d8 → e5 (la jauge « amertume » d'une ligne ne dit pas 75 au WP ni
  97 à 10′ sans glisser).
- « contre ★ » en six barres de famille — d8 → b4 et e5 (leur « contre ★ » est une ligne de texte).
- Pastilles d'étape soulignées en orangé quand c'est trop amer — a1 → d8 (chips 60′, WP), e5 (étiquettes 60′, WP).
- Mesure traduite en famille avant le composé (picto puis « linalol ») — d8, e5 → b4 (« 38 µg/L » nu), a1.

## Avant publication (micro-correctifs, pas de passe 4)

1. **e5** : la bande 16D sur toute la figure (D57 ; régression de la passe 2). C'est le seul défaut qui lui fera
   dire « ?? » sur la meilleure idée du lot.
2. **d8** : « ★ ici » seulement au meilleur nommé, ou « pareil à 3 j » ; un seul marqueur.
3. **b4** : mini-barres résineux à la même échelle que la l5b ; « 8,1/15 au panel ».
4. **a1** : contraste des rubans étiré min–max, ou rubans limités à la famille « par » et à l'amertume.
5. Tous : « ± 13 » après la mesure ; vérifier que le texte de la mesure suit le moment du doigt (d8 : « au levurage »
   affiché à 45′ dans `d8-toucher-390.png` ? la ligne du bas y est masquée par la loupe, à capturer sans loupe).

Phrase prédite : « b4 est le plus clair, vachement bien ; e5 très bien aussi mais la zone rose s'arrête au whirlpool
?? ; d8 joli, et le piège IBU se voit, mais ★ ici à 3 j alors que c'est 2 j ? ; a1 c'est y1b en mieux mais c'est quoi
toutes ces petites cases. Un mélange b4 + e5 serait bien. »

LEÇON PROPOSÉE : une passe de densité se vérifie aussi en régression de codes. Le 23.10, la passe 3 de e5 a réduit
la bande 16D du floral de « 60′ → après » à « 60′ → WP » (zone dessinée par curseur), et celle de a1 a ajouté 240
cases dont le dégradé ne se voit pas ; six contrôles verts sur chaque passe (COMMUN, MOTS, UNE-QUESTION, ACQUIS,
PAGE, PANEL) n'en ont rien vu, seules les captures côte à côte l'ont montré. Faire : avant d'accepter une passe,
poser la capture de la passe précédente à côté et vérifier, code par code (zone du style, hachure, orangé, contour),
qu'il couvre la même étendue et que chaque code ajouté montre un contraste visible (L12) ; un contrôle
`controle-regression-codes.mjs` peut mesurer l'étendue d'un `data-role="zone"` entre deux pages.
