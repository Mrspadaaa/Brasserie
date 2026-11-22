# En-têtes l1 à l5 sur cd1-paysage (16.11)

Ses mots : « Plus de place au graph et plus d'info sur ces mouvements, moins d'info sur le reste. »
Base : `cd/cd1-paysage.html`, sa base paysage. Seul l'en-tête change : tout le code à partir de `<div class="cd-frw">` est
repris octet pour octet, et les boîtes de la frise et du + sont mesurées identiques à la base (contrôle). Le style ajouté
est préfixé `en-` et `lN-`.

| version | idée | en-tête | courbe |
|---|---|---|---|
| base | 113 et « ensuite » sur une ligne, hypothèses, courbe, segments, 7 pastilles, bande de 3 lignes | 174 px (44,6 %) | 45 px |
| **l1 Rives** | Au-dessus de la courbe, ce qui entre (vert : `+2 140 fête`) ; dessous, ce qui sort (rouge : `−2 800 embouteilleuse`). Chaque étiquette descend en pointillé jusqu'à sa marche (▲ ou ▼). La caisse grise et le hachuré du mis de côté restent visibles. | 143 px (36,7 %) | 60 px |
| **l2 Flux** | Sous la courbe, une barre par semaine sur toute l'année : le mouvement net de la caisse libre (le « temps et argent » de fb, perdu n° 1). Les plus fortes sont chiffrées (+988, +1 780, +720, +2 490). Une accolade rouge couvre S6 → S24 : `−4 385 · 4 achats`. | 137 px (35,1 %) | 50 + 24 px |
| **l3 Le creux raconté** | La courbe prend toute la largeur (820 px). Au-dessus du creux, sa cause en une ligne : « S24 · 113 au plus serré / payés : hotte, fûts, embouteilleuse −4 780 », avec un trait jusqu'au point S24 et une flèche rouge sur la descente. Seules les remontées sont chiffrées (fête, festival). | 152 px (39,0 %) | 70 px |
| **l4 Genres** | Chaque mouvement porte le picto rond et la couleur de sa rangée : étoile rose pour les fêtes, bouteille verte pour les ventes, chariot, fût et froid bleus pour les achats, outil pour les travaux. Le montant est à côté. Le chiffre à dépenser passe à droite. La courbe est la plus haute. | 140 px (35,9 %) | 96 px |
| **l5 Loupe** | L'année en haut, avec 3 mouvements nommés. La fenêtre s'évase en loupe vers la frise, et sous chaque colonne de semaine s'affiche son mouvement : `+988`, `−460`, avec sa barre. | 140 px (35,9 %) | 54 px |

## Ce qui reste, ce qui recule (les cinq versions)
- **Gardé** : `113 CHF à dépenser` (32 px). Au plus serré : `S24 ⌄` à un toucher, et le point bleu du creux sur la courbe, au ras de la ligne 0 : c'est le sens de « sans passer sous 0 ». `2 en retard ›`. La courbe de l'année et sa fenêtre de 12 semaines à poignées. Les dates des 12 semaines, alignées sur les colonnes de la frise (aujourd'hui en bleu). Le tri ⇅ et le bouton quitter le plein écran.
- **Réduit** :
  - Période : une seule pastille, « 3 mois ⌄ », et les autres durées à un toucher. La pastille dit « 3 mois » et non « 6 sem. », parce que la frise de la base affiche 12 semaines.
  - Filtres : les 7 pastilles nommées deviennent 7 carrés de couleur dans un seul bouton. Les rangées gardent leur nom en dessous.
  - Hypothèses (caisse 4 180, +120 / sem., 2 j) : une icône ⚙, à un toucher.
  - Supprimés de l'en-tête : « ensuite 1 782 / 4 359 » (les remontées se lisent sur la courbe) et la ligne « libre en fin ». Le solde et le mouvement de chaque semaine sont dans l'`aria-label` de sa date, et à l'écran dans l2 et l5.
- **Mots à l'écran dans l'en-tête** : 19 à 28, contre 78 dans la base.

## Honnêteté des chiffres
- **Courbe** : les séries sont relevées sur la courbe de la base (ligne bleue = libre, ligne grise = caisse). Les 12 premières semaines reprennent la bande de la base (4 032 … 4 498), et S24 vaut 113.
- **Mouvements nommés** : ils viennent des données du proto sources2 (a, b, m), à la semaine où ils touchent la caisse :
  - Marché de Noël +1 180 (S50), Marché de printemps +910 (S16), Fête de village +2 140 (S26), mariage +1 100 (S31), Festival +2 450 (S33) ;
  - hotte −900 (S13), six fûts −1 080 (S18), embouteilleuse −2 800 (S22), frigo −1 800 (S35).
- **Les achats** font tomber la ligne grise (caisse) à la semaine où ils sont payés. La ligne bleue (libre) a déjà baissé avant, au fil du mis de côté. l1 et l4 posent donc les sorties sur la marche grise. l3 dit « payés », pour la même raison.
- **l2 et l5** montrent le mouvement net de la semaine, qui n'est pas le montant d'une chose : en S50, la barre vaut +988, quand le Marché de Noël rapporte +1 180. C'est pourquoi l2 ne met aucun nom sous ses chiffres ; le détail s'ouvre à un toucher (`aria-label`). L'accolade S6 → S24 vaut −4 385, soit 113 − 4 498.

## Contrôles (`node en/l/build.mjs && node en/l/cap.mjs`, sortie dans `cap/l-controle.txt`)
- Chaque version : en-tête plus bas que la base (174 px). Aucun texte sur un texte ou sur un bouton, aucun bord, aucune coupe, rien sous 14 px, rien qui déborde sur la frise. Frise, + et code de la frise identiques. Sortie : **CONTROLE OK**.
- **Témoin** `cap/l-temoin.html` (une étiquette à 13 px posée sur une autre) : il échoue, comme attendu.
- Le contrôle ne voit pas le texte qui passe sur une ligne SVG. Ce défaut a été jugé à l'œil sur les captures en plein format :
  - l2, première passe : chiffres sur les barres ; corrigé avec une rangée d'étiquettes au-dessus des barres ;
  - l3 : « printemps » sur la flèche ; l'étiquette est retirée ;
  - l4 : montants sur le hachuré ; corrigé par un placement qui évite les deux lignes.
- **Captures** 844 × 390, DPR 2, en clair et en cave : `cap/l-base.png`, `cap/l1.png` à `cap/l5.png`, `cap/l1-cave.png` à `cap/l5-cave.png`.

## Écarts voulus
- **Chiffres** dans la police de la base (Source Sans / Segoe, `tabular-nums`) et non en IBM Plex Mono : le reste de l'écran, identique à la base, est déjà dans cette police.
- **Le +** est celui de la base : en paysage plein écran, il n'y a pas d'onglets. Il est mesuré au même endroit.
- **l3** a l'en-tête le plus haut (152 px). C'est le prix d'une courbe sur toute la largeur, avec la phrase du creux au-dessus.
- **Fichiers partagés** : un autre agent écrit dans `en/` (`build-p`, `cap-p`, `q*`). Mon `build.mjs` et mon `cap.mjs` d'origine ont été écrasés ou déplacés par lui. Les miens vivent maintenant dans `en/l/`, et le contrôle sort dans `cap/l-controle.txt`.
