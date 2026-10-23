# g1 passe 2 — « La courbe du compromis » (voie r7g2-passe2, 23.10)

Page : `g1/etat.html` (générée par `generer.mjs`, qui importe le socle de la série `../socle-g.mjs` sans le
modifier). La v0 (`../g1/etat.html`) est intacte. Chaleur : chaude. Descripteurs : A (Idaho 7 n'a aucun mot
sans famille). Levure : **pont** vers l'outil Levure (la forme de g1), lien réel vers
`fils22-carte/levure-outil/etat.html`.

## Passe 2

Le concept reste : trois courbes (floral, baies, résineux ajoutés à ta stout) sur tout le brassin, l'IBU de
toute la stout dessous face à la 16D, « meilleur » marqué ; la réponse et le piège en trois secondes.

Greffes reçues (tri/SYNTHESE.md) :
- **dock sous le pouce avec loupe** (a1, b1) : la frise de y1b fixée en bas, 60′ … 10′ par 5′, WP, actif,
  après ; doigt posé, la loupe montre les crans voisins à 90 px contre 13,4 px sur le rail (**×6,7**). Le
  doigt sur le graphique reste possible (deux curseurs du même moment) ;
- **jours de contact au bout de la frise** (x3b réduit) : 1, 2, 3, 5, 7 j à droite du rail, grisés pendant
  l'ébullition ; 3 à 7 j hachurés, comme le plateau du graphique ;
- **« sans gain »** sur le plateau des jours (e2) : au-delà de 2 j, colonnes hachurées (la grille sature,
  `cerveau/metier/dryhop-moment.md`) ;
- **la mesure qui suit le moment** (c7) et **marques « mesuré »** sous l'axe (c2) : ébullition → Sharp 2014
  (cuit, herbe à 60′, 1,5 g/L) ; actif → McCabe 2023 (au pitch, linalol 38 ± 13 µg/L, à vérifier, ligne
  Idaho-7) ; après 1–2 j → Schmidt 2019 (tout passe en 2 j, 2,5 g/L) ; après 3–7 j → Titus 2021 (1 h = 96 h au
  nez, 1,43 g/L). Whirlpool : **« jamais mesuré au whirlpool »** hachuré (c5) ; aucune mesure inventée ;
- **« trop amer »** en orangé au-dessus des barres d'ébullition (a8) ; « à cru ? » sur les barres hachurées ;
- **les 12 barres l5b à un toucher** (b1) : « 12 familles » ouvre les barres au style sous le graphique ;
- **« meilleur : actif · 2 j »** rappelé dès qu'on s'en écarte (g4), un toucher y ramène.

Retouches du critique : (1) α du lot puis plage des fiches dans la ligne de contexte : « α 12,7 % 9,5–14,9 »
(D87) ; (2) la clé « floral · baies · résineux · IBU · meilleur » du repos est retirée : les pictos sont au
bout des courbes, la clé et la convention du « meilleur » derrière le « ? » (D89) ; (3) le dock de y1b sous le
pouce avec la loupe (D63, D67). Retouches communes : 77 mots au premier écran (98 au premier essai : les « · »
et « › » comptaient, remplacés par des espaces CSS) ; « épicé » = cannelle et clou croisés (symbole `p-spice`
de la planche standard, repris tel quel) ; le texte du pont suit le moment (« Pomona, agrumes ~+13 » en actif,
« levure sans effet ici » ou « … après » ailleurs : l'écart est calculé, M07).

## Baseline

Repris : la question en titre ; contexte Idaho 7, α du lot et plage, « mixte », 4 g/L, US-05, Stout 16D ;
« face à ta stout » (les courbes partent de ta stout, les barres l5b gardent le rond creux de l'avant) ; la
jauge d'amertume (IBU de toute la stout, bande 16D 50–70) ; le moment glissé par 5′ ; le dock sous le pouce et
sa loupe ; x3b réduit (jours en bout de frise) ; levure en pont ; au style par défaut ; pictos au trait ;
légende derrière « ? » ; appui long ou survol long sur Idaho 7 → la vraie fiche ; « ~ » simulé, « ≈ »
interpolé entre 60′ et 10′ (trait pâle), hachuré inconnu (pépins, melon ; IBU à cru), jamais 0.

Écarts, et pourquoi :
- **second houblon et « puis » de y1b** : absents, un second houblon serait un second facteur libre (D98) ;
- **x3b « ma bière → 1 dry hop → 2 dry hop »** : réduit aux jours de contact, pour la même raison ;
- **stock en icône** : absent, la série n'a pas de stock pour Idaho 7 (pas de chiffre inventé) ;
- **barres l5b** à un toucher et non au repos : les courbes répondent au repos, et 80 mots au plus ;
- **teneur du lot (CoA) dans la fiche** (greffe d5) : non reprise, la donnée n'est pas dans les entrées de la
  série et n'a pas été vérifiée ici ;
- **thumb label du dock** retiré au repos : le moment est écrit une fois, dans la réponse, et la loupe le
  grossit au toucher.

## Contrôles (depuis la racine)

- COMMUN (`--sans=mots`) : **COMMUN OK** (couleurs, au-style, survol, blocs, contraste, fiche, standard,
  trait, legende, parlant, brutes).
- MOTS `--max=80` : **g1 77 mots, MOTS OK**.
- D98 `--edition` : « libres : moment · 7 contrôle(s) · contexte : houblon, dose, levure, base » ;
  **UNE-QUESTION OK (1 groupe libre : moment)**.
- Acquis `--outil=dryhopper` : « 4/4 : geste, frise, valeurs, levure (au repos) » ; **ACQUIS OK**.
- `verifier-page.mjs` : **PAGE OK** (390 px, sans erreur).
- Geste au doigt (`generer.mjs --captures`) : actif → 15′, loupe ×6,7 ; 0 erreur de script.

Captures : `captures/g1-390.png` (page entière), `captures/g1-premier-ecran.png`, `captures/g1-toucher-390.png`
(doigt gardé à 15′, loupe ouverte) ; `captures/travail/` : après le geste, 12 familles ouvertes à après 5 j,
whirlpool « jamais mesuré ».
