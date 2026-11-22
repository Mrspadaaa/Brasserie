OK — tri : d1a, d2a, d3b (mobile) + d3a (1280), d4b, d5a, d6b, d7a, d8a Matériel + d8b Fûts ; tour 2 oui, ciblé (7 retouches)

# Critique, tour 1 des mini maquettes du Stock (21.11, D416)

Juge : Opus (Fable interdit). Les 37 captures ont été ouvertes une fois chacune (st1 : 20 ; st2 : 17), ainsi que ses captures 01
et 02 (`../2026-11-21-chasse-stock/`). Grille : PORTRAIT v2, fin de SPEC (21.11), VOIES-CORRECTION (D1 à D8), boosters-ux.
Ses mots, base du jugement : « La vue type étagère est incroyablement, mais il y a un ou deux souci, et dans autre stock, j'ai
pas cette vue.. » ; « des vues et de l'espace gâché » (STOCK-ESPACE) ; « Notamment l'autre vue de modification ».
Base : aucune clé « stock » dans `ecrans.json`. La référence est donc son écran en ligne (tour 8) et ses annotations de la capture 01.
Règle n° 1 : son dessin de la capture 01 (Houblons barré, bascule Étagère rayée, Recompter à la place de l'onglet, rond après DDM)
n'est reproduit tel quel que par d1a. Toutes les variantes de D2, D3 et D7 en partent : c'est juste.

Deux regards : **B** = le brasseur (portrait), **UX** = expert UX mobile (boosters-ux : B1 geste et effet dans le même bloc,
retour de geste, cibles, coup d'œil, trois tailles de texte, états).

## 0. Les trois points de dessin signalés dans st1

1. **Totaux en 12 px** (« 39,2 kg », « 720 g » sous chaque groupe ; environ 11 px à 1280). C'est trop petit. Le total est la
   donnée qu'il lit en premier par groupe ; dans sa capture 01, « 25 kg » est au corps des données. Or DESIGN.md met les
   données à 13–14 px et réserve 12 px aux libellés. À faire : 13 px partout, 1280 compris, en IBM Plex Mono tabulaire, avec une
   espace fine entre le nombre et l'unité (aujourd'hui « 1,5␣␣kg », avec un trou de deux chasses). Pas un défaut de choix,
   mais un défaut de finition qu'il verrait (« hyper lisible »).
2. **Pastille Légende déplacée** (d1a, d1b, d1c, d2c : de la colonne du nom, sous « Levures 0/10 », vers le bout de la rangée,
   sous « ○ Saison »). C'est un écart à son écran, et il nuit : posée sous « ○ Lager » et « ○ Saison », qui sont des filtres de
   style, elle a la même forme et se lit comme un filtre de plus. En d2a et d2b elle a disparu ; en d3a elle devient une bande au
   repos ; en d3b, un rond « ? ».
   Verdict : prendre le rond « ? » de d3b comme forme commune, mais ailleurs, car il couvre aujourd'hui « ○ Fumé » (d3b, 390 et
   1280). Deux places possibles : à sa place d'origine (colonne du nom, sous le compte des Levures), ou en coin haut droit après
   avoir décalé « Fumé ». Aucune version ne doit la perdre (d2a, d2b).
3. **Bulle de d2c posée par-dessus** : elle masque toute la rangée Levures, et le cadre de sélection mord sur « Houblons ».
   C'est STG-2, déjà relevé (« la bulle ne recouvre pas la rangée voisine », contrôle de la voie V2) : il le verrait tout de suite.
   À faire : ouvrir la bulle sous le mur, entre le mur et « À faire » (le contenu descend), avec une pointe vers le pot touché ; le
   cadre de sélection reste dans la colonne du groupe.

## 1. Défauts communs (à corriger dans toutes les versions concernées)

- C1. « Houblons » chevauche « Hazy » dans toutes les captures st1, à 390 comme à 1280, et dans st2 d4c, d7a et d7b ; on voit
  aussi « Emballage » sur « pièces » et « Nettoyage » sur « L » (d4c). La colonne du nom est trop étroite pour le mot en gras.
  Correction : colonne du nom à la largeur de « Houblons » plus 6 px, ou décalage des libellés de groupe. Sa capture 01 ne
  chevauche pas.
- C2. **Murs st2 (d4a, d4c, d7a, d7b)** : des tirets de seuil flottent sous la ligne de base et barrent les totaux (« 1̶,6 kg »,
  « 38 kg », « jusqu'à 850 » illisible). Les malts sont tous de la même terre cuite, alors que son étagère colore chaque pot
  selon l'EBC (Base paille, Caramel ambre, Torréfiés noir) ; les levures perdent leurs piles de sachets. **Ce n'est pas son
  étagère**, et il ne la reconnaîtrait pas : « dans autre stock, j'ai pas cette vue » demande *cette* vue. Correction : rebâtir
  ces murs sur celui de st1 (couleurs EBC, sachets, tirets posés sur le pot, totaux à 13 px).
- C3. Le bouton + volant masque la quantité de la dernière rangée visible (d2a, d2b, d2c, d4a). UX : réserver en bas de liste
  une marge égale à la hauteur du bouton, plus 8 px.
- C4. En-tête de st1 : logo « A » et icônes grises. Son application (capture 01) a la chope et des icônes de zone en couleur ;
  st2 les a. À aligner sur st2 : il compare à son écran.
- C5. Onglets à 390 (toutes les versions avec Recompter en onglet) : la pastille « Articles » touche « Recompter », et
  « Recompter », une fois actif, touche les bords de sa pastille (d1a-recompter, d6a à d6c). C'est son dessin, à tenir : texte à
  15 px et marges internes réduites, sans abréger son mot.
- C6. Textes d'instruction au repos (refus « la légende écrite au repos », « énormément d'information pour rien ») : d3a (bande),
  d4a (légende), d4c (« le nom d'un rayon filtre »), d5b (deux lignes), d5c (deux lignes), d6c (« peu / plein »), d8b
  (« plein · vide · 20 L · 30 L »).

## 2. Par version

### D1 — Articles : l'entrée

**d1a** (Recompter en onglet, ★ dans le rond)
- Défauts : 1. C5, onglets serrés ; 2. C1 ; 3. « Comparer une recette » garde sa rangée pleine largeur (50 px), qui va contre
  STOCK-ESPACE et contre son « replié, et pas très visible, elle apporte peu » (19.11, vue de commande) ; 4. Recompter montre
  8 malts sur 17, puis un blanc : la liste a l'air finie (doute, maquette).
- À greffer : le rond ⚖ « Comparer » de d1c, à droite de la recherche (d2a l'a déjà fait).
- Verdict : **garder**, en premier. C'est son dessin, rendu tel quel.
- B : « Oui c'est ce que j'ai dessiné, par contre les onglets sont collés. »

**d1b** (Recompter dans le rond, badge 1)
- Défauts : 1. il n'a pas demandé que Recompter devienne le rond : sa flèche va de Recompter vers l'onglet, et le rond est une
   marque à part ; 2. le badge « 1 » redit « à compter 1 » ; 3. en état Recompter, l'onglet reste « Articles » et rien ne dit où
   on est, sinon le rond noir.
- Verdict : **garder comme alternative**, sans retouche propre (C1, C4).
- B : « pas mal, mais je préfère Recompter en onglet. »

**d1c** (une rangée : recherche, ⚖, Recompter)
- Défauts : 1. la pastille fusionnée « DDM · ★ » est illisible : on ne sait pas si l'étoile filtre les DDM ; 2. même écart que
   d1b sur Recompter ; 3. la recherche devient « Rechercher… », sans le « nom, fournisseur ».
- Ce qui est bien : elle gagne une rangée (5 articles visibles contre 4).
- Verdict : **améliorer** : ★ seule dans son rond, DDM seule.
- B : « Ça gagne de la place, mais DDM étoile ??? »

### D2 — Étagère compacte (390 × 660)

**d2a** (le mur est l'en-tête, un rayon touché montre sa liste)
- Défauts : 1. la pointe du cadre de sélection mange la virgule de « 1,5 kg », qui se lit « 1 5 kg », et barre « Lager »
   (houblons) ; 2. la Légende a disparu ; 3. C3, le + couvre « 25 kg » et « Galaxy » ; 4. trois rangées visibles, la
   quatrième coupée (le contrôle visait au moins 3 : tenu de justesse).
- Ce qui est bien (UX, B1) : le geste et son effet sont dans le même bloc (on touche un rayon, la liste suit) ; le tri et
   l'échelle tiennent sur une ligne (« ⇅ couleur · 0 · 1 · 5 kg // 200 »), et le doublon mur et liste de STE-3 disparaît. La liste
   des houblons met l'α en pastille, comme il pense (L04).
- À greffer : l'état replié de d2b (en défilant, le mur se réduit à trois lignes collantes) ; « manque 0,8 kg · IPA S49 » de
   d2c en sous-titre des articles en manque.
- Verdict : **garder + améliorer** (pointe sous le cadre, sans toucher au texte ; rond « ? » ; C3).
- B : « Vachement bien, l'étagère sert enfin à quelque chose quand je touche. »

**d2b** (mur mince à pictos, une bande tri + échelle)
- Défauts : 1. le mur perd les noms de groupes (Base, Caramel, Hazy…) et les totaux : les rangées ne se reconnaissent plus
   que par trois pictos de 16 px (refus « icônes pas parlantes ») ; 2. le houblon est une feuille, pas un cône (« un forme qui
   représente vraiment ce que c'est ») ; 3. la levure est un erlenmeyer.
- Ce qui est bien : replié, il laisse voir 6 à 7 rangées (UX : le meilleur rendement d'espace).
- Verdict : **écarter comme écran de repos** (il perd ce qui fait l'étagère « incroyable ») ; **greffer** son état replié sur d2a.
- B : « C'est compact mais je sais plus ce que je regarde. »

**d2c** (mur seul + « À faire », bulle au toucher)
- Défauts : 1. la bulle couvre Levures (STG-2, point 0.3) ; 2. « Cryo Citra · à compter » porte un caddie : l'action attendue
   est compter, pas acheter ; 3. Galaxy épuisé a un pot gris, alors que l'épuisé est rouge partout ailleurs ; 4. « Tout lister ·
   40 articles » est coupé par la barre d'onglets ; 5. la liste complète est à un toucher (« un écran qui demande un toucher pour
   voir l'essentiel perd »).
- Ce qui est bien : « À faire » répond à « qu'est-ce que je dois faire ? » en brasseur (« manque 0,8 kg · IPA S49 », pour quel
   brassin) ; la bulle donne α, seuil, style et quantité, puis › vers la fiche.
- Verdict : **améliorer** (bulle sous le mur ; icône de compte pour « à compter » ; pot rouge ; C3).
- B : « J'aime bien le à faire, mais la bulle cache les levures. »

### D3 — Légende et 1280

**d3a** (bande de légende ; 1280 : trois rayons côte à côte, une table par rayon)
- 390 : 1. une légende écrite au repos (C6), et 70 px de plus contre STOCK-ESPACE.
- 1280 : 1. les barres des houblons sont couleur malt, pas vert houblon ; 2. la moitié basse de l'écran est vide pendant que les
   tables s'arrêtent à 9 lignes (Munich, Mosaic) ; 3. « Pils bio 0 g », un malt compté en g alors que les autres sont en kg ;
   4. totaux à 11 px (point 0.1) ; 5. C1.
- Ce qui est bien (1280) : tout le stock d'ingrédients d'un coup d'œil, trois rayons en parallèle, α et EBC en colonne, DDM
   des levures. C'est la meilleure 1280.
- Verdict : **390 écartée** (légende au repos), **1280 gardée**, à améliorer : tables à hauteur pleine, barres de houblon
   vertes, unité cohérente.
- B : « Le 1280 est top, tout est là. Sur le téléphone, la légende en dur, non. »

**d3b** (rond « ? » et bulle près de lui ; 1280 : mur collant à gauche, table à droite)
- 390 : 1. le rond couvre « ○ Fumé » ; 2. la bulle couvre la moitié droite de Houblons et Levures, ce qui est acceptable pour
   une aide qui se ferme (rien n'est masqué au repos).
- 1280 : 1. la colonne de gauche est vide sous le mur (environ 60 % de sa hauteur) ; 2. la pastille « Brau- und Rauchshop »
   sort de nulle part (filtre ? fournisseur par défaut ?) ; 3. C1.
- Ce qui est bien : la légende à un toucher, avec « échelle resserrée » en plus (le // était inexpliqué).
- Verdict : **390 gardée** (le rond ailleurs, point 0.2) ; **1280 améliorer**, ou laisser derrière d3a.
- B : « Le point d'interrogation c'est bien, pas besoin de plus. »
- Fusion proposée pour la page : légende de d3b avec 1280 de d3a. **La page doit séparer les deux sous-choix**
  (légende 390, mise en page 1280), sinon il ne peut pas prendre l'un sans l'autre.

### D4 — Autres stocks

**d4b** (objets sur la planche, tiède)
- Défauts : 1. des noms collés, illisibles : « Sel d'Epsomd'Irlande », « lactiquephospho. », « peracét.Détergent »,
   « ÉtiquetteCarton 6 » ; 2. la capsule est un dôme orange qui ressemble à un pain, pas à une capsule couronne dentée ;
   3. le carton est un pentagone, une maison ; 4. la rangée de filtres (manque, épuisés…) a disparu, alors que D1 la veut commune ;
   5. la rangée Matériel a disparu ; 6. dans la bulle, « Commander » touche le bord de son bouton.
- Ce qui est bien : c'est exactement « la vue sur le stock type épicerie, ça c'est du grand art » (SPEC, l. 2462), appliquée
   aux autres stocks : chaque objet est reconnu sans lire (flacon, bidon, seau, gant, bouteille), il est rempli à l'échelle, le
   seuil est en tiret, l'épuisé en rouge, et le compte d'alerte en tête de rayon (« 1 épuisé · 0 bas »). La bulle a Commander
   et Fiche.
- À greffer : la rangée Fûts de d4a (10 fûts colorés et « 3 pleins · 2 à laver ») et « Matériel · rien à signaler ».
- Verdict : **garder + améliorer** (noms sur deux lignes à largeur fixe, sans collage ; capsule couronne ; caisse à
   séparations ; filtres ; Matériel).
- B : « Ça c'est l'étagère dans autre stock, j'adore. Mais les noms sont collés. »

**d4a** (rayons comme Malts, colonnes par unité, froide)
- Défauts : 1. C2 (tirets flottants, « jusqu'à 850 » barré) ; 2. les barres sont anonymes, il faut toucher pour savoir laquelle
   est l'acide lactique ; 3. légende au repos (C6) ; 4. C3.
- Ce qui est bien : la rangée Fûts (un fût par objet) et « Matériel · rien à signaler » ; une colonne par unité (g, ml, L,
   pièces).
- Verdict : **améliorer** (C2, C6), en second.
- B : « Bien mais je sais pas ce que c'est sans toucher. »

**d4c** (un seul mur, plus de bascule, chaude)
- Défauts : 1. C2, en pire : les malts sont aplatis en terre cuite et les levures perdent leurs sachets, ce n'est plus son étagère ;
   2. C1, trois chevauchements ; 3. une instruction au repos ; 4. une seule rangée de liste visible.
- Ce qui est bien : retirer la bascule Ingrédients / Autres gagne une rangée (STOCK-ESPACE), et le rayon touché qui
   estompe les autres est un bon retour de geste (UX).
- Verdict : **améliorer**, en la rebâtissant sur le mur de st1. Le choix de structure (une bascule ou un seul mur) mérite
   d'être vu.
- B : « L'idée de tout avoir sur un mur oui, mais là c'est plus mon étagère. »

### D5 — La fiche d'un article (sa capture 02)

**d5a** (pastilles chiffrées v02, Stock et Seuil en un pavé, Modifier replié)
- Défauts : 1. la courbe « Ce qui a bougé » a disparu, or c'est un acquis à garder (VOIES-CORRECTION, « à garder intact ») ;
   2. le stock et le seuil sont dits deux fois (pastilles « 1 Pck » et « — seuil », puis les deux compteurs) ; 3. la moitié basse
   est vide (500 px) ; 4. en mode modification, le panneau remplace tout le haut de la fiche et laisse 700 px vides : on perd le
   contexte.
- Ce qui est bien : c'est le modèle « Pastilles chiffrées » qu'il a pris le 21.11 pour la fiche du Calendrier ; « 1 Pck ·
   25 g » répond à STC-2 ; le besoin, le prix et la date sont lus d'un coup ; Enregistrer est grisé tant que rien ne change
   (STM-5) ; les compteurs − et + évitent la saisie (aucun champ numérique) ; l'α est dans la rangée de l'identité.
- À greffer : la courbe de d5b ; la feuille Modifier de d5c ; le bouton « Enregistrer · +2, seuil 2 » de d5b, qui redit le
   geste.
- Verdict : **garder + améliorer** (courbe ; Modifier en feuille ; pastilles = besoin et prix seulement, le stock et le seuil
   restant dans le pavé).
- B : « Très bien, c'est court. Mais il manque le graphe. »

**d5b** (règle à tirer, frise)
- Défauts : 1. au repos, le curseur cache « tire depuis ici » ; 2. deux lignes d'instruction (C6) ; 3. le tiret « seuil 2 » est
   posé vers 2,2, pas sous la graduation 2 : une valeur fausse à l'œil ; 4. « +1+1 » collés sur la frise ; 5. le besoin a
   disparu ; 6. « Enregistrer · +2, seuil 2 » touche les bords de son bouton. Doute UX : tirer pour 485 g de Citra ou 25 kg de
   Pilsner manque de précision, il faut que le nombre touché ouvre aussi un compteur.
- Ce qui est bien (UX, B1) : le geste et l'effet sont au même endroit, « +2 » et le seuil apparaissent, le motif (« Pourquoi :
   Compté ») s'active, et le bouton dit ce qui sera écrit. La courbe est gardée.
- Verdict : **améliorer**, en second ; d5a et d5b sont proches, et la courbe fait la différence aujourd'hui.
- B : « Le slider c'est cool. Mais le texte partout, non. »

**d5c** (paquets, Modifier en feuille)
- Défauts : 1. la métaphore ne tient que pour les articles comptés en paquets ou en pièces : 485 g de Citra ou 25 kg de Pilsner
   ne se dessinent pas en paquets (or c'est l'essentiel de son stock) ; 2. toucher un paquet le retire (−1) sans annulation :
   un geste destructif au moindre effleurement (UX) ; 3. deux lignes d'instruction (C6) ; 4. pas de courbe.
- Ce qui est bien : la feuille Modifier (le contexte reste visible, tout tient à l'écran) ; le paquet dessiné « 25g ».
- Verdict : **écarter comme fiche générale** (raison métier : elle ne vaut que pour les unités comptées) ; **greffer** la
   feuille sur d5a.
- B : « Marrant, mais pour mes malts en kilo ça marche pas. »

### D6 — Lignes : l'inconnu (Recompter)

- **d6b** (pastille couleur, « ? » pour l'inconnu, pot de l'étagère) : on comprend en 3 s ; l'inconnu est honnête et jamais
  à 0 ; l'EBC est dit une fois, en sous-titre ; le pot reprend le vocabulaire de l'étagère. Défaut : la mention « le pot comme sur
  l'étagère » est un texte inutile. À greffer : le bandeau « EBC inconnu sur 3 malts · Compléter › » de d6c. **Garder**, en
  premier. B : « Le pot c'est bien, on retrouve l'étagère. »
- **d6a** (EBC en colonne, inconnu hachuré) : l'EBC en chiffre est lu d'abord, et un brasseur le veut ; le hachuré « — » est
  honnête. Mais le chiffre et le carré prennent 120 px de largeur. **Garder** comme alternative.
- **d6c** (bandeau groupé, barres ▂▄▆ gardées) : le bandeau « Compléter › » est une bonne action ; les barres avec leur légende
  « peu / plein » au repos sont celles que STC-13 mettait en cause, et la légende est un refus (C6). **Améliorer** : garder le
  bandeau, retirer les barres ou les remplacer par le pot.
- Doute : la Recompter de D6 (tuiles de rayon, champ à cadre, coche carrée) n'est pas celle de d1a-recompter (bandeau de rayon,
  coche ronde verte). Les deux pages montrent deux Recompter différentes ; l'acquis « il en reste et la coche » doit rester le
  sien. Le dire dans la page.

### D7 — Sucres

- **d7a** (colonne « Sucres » au bout du rang Malts) : ne coûte aucune rangée ; dit le métier juste, puisque le dextrose est un
  fermentescible « compté dans la densité » et le resucrage sert à la « mise en bouteille ». Défauts : C1, C2 (mur aplati).
  **Garder**, rebâtie sur le mur de st1.
- **d7b** (rang « Sucres » à part) : environ 95 px de plus (STOCK-ESPACE) ; la rangée est écrite en texte (« Dextrose 5 kg ·
  Resucrage 1 kg ») au lieu de pots, ce qui casse le mur ; mêmes C1 et C2. **Améliorer** (des pots) ou laisser derrière d7a.
- B : « a, logique, le dextrose c'est un fermentescible. »

### D8 — Matériel et Fûts

- **d8a Matériel** (liste, segment Parc · À venir · Carnets · Réalisés gardé, conforme à p2:g05-1) : **valeur fausse**, le total
  « Parc 2 515 CHF » vaut 900 + 1 450 + 160 = 2 510, et le refroidisseur au prix inconnu (« ? ») n'y est pas signalé. Il faut
  « 2 510 CHF + 1 ? ». « 2 projets » est identique sur les quatre lignes et fait faux. Pour le reste, c'est complet et lisible.
  **Garder + corriger**. B : « Ok, mais le total est faux. »
- **d8b Matériel** (tuiles) : « Cuve de brassage 70 / L » se coupe entre le nombre et l'unité, ce qui rejoue STC-16 (la voie V5
  le corrige ailleurs) ; elle a moins d'information (plus de projets) ; « à venir » est en mono alors que ce n'est pas une mesure
  (DESIGN) ; la tuile « Achat » ne se comprend pas. **Écarter** (moins d'information que d8a, sans gain).
- **d8a Fûts** (4 tuiles-filtres, lignes bordées) : actions par état claires (Livrer, Retour, Lavé, Remplir) ; mais la tuile
  « Pleins » est sélectionnée alors que la liste montre les 8 fûts, un état incohérent. **Améliorer** (la liste suit la tuile)
  ou céder la place à d8b.
- **d8b Fûts** (râtelier) : l'étagère appliquée aux fûts, son vocabulaire, une réponse directe à « j'ai pas cette vue » ; la
  liste commence par la bière (« IPA · 20 L »), comme il pense. Défauts : K7 de 30 L est dessiné à la taille des 20 L, si bien que
  la légende « 20 L · 30 L » ne correspond à rien de visible ; légende au repos (C6) ; la moitié basse est vide. **Garder +
  améliorer** (30 L plus haut ; retirer la ligne de légende). À greffer depuis d8a : les boutons d'action de chaque état.
- B : « Le râtelier de fûts j'adore. »

## 3. Classement par axe

| Axe | 1 | 2 | 3 | Note |
|---|---|---|---|---|
| D1 Entrée | d1a | d1c | d1b | d1a = son dessin ; greffe ⚖ de d1c |
| D2 Compacte | d2a | d2c | d2b | d2a + état replié de d2b + sous-titre « manque · brassin » de d2c |
| D3 Légende 390 | d3b | d3a | — | rond « ? » sans couvrir Fumé |
| D3 1280 | d3a | d3b | — | séparer les deux sous-choix dans la page |
| D4 Autres stocks | d4b | d4a | d4c | Fûts et Matériel de d4a greffés sur d4b |
| D5 Fiche | d5a | d5b | d5c | d5a + courbe (d5b) + feuille (d5c) |
| D6 Inconnu | d6b | d6a | d6c | bandeau Compléter de d6c sur d6b |
| D7 Sucres | d7a | d7b | — | page courte, à montrer seulement s'il veut la voir |
| D8 Matériel | d8a | d8b | — | total à corriger |
| D8 Fûts | d8b | d8a | — | 30 L visible |

Panel : chaque axe a des variantes de genres différents (froide, tiède, chaude ; tableau, objets, geste), et aucune série n'est
restée sur ses seuls exemples. Je n'écarte rien de la page : le brasseur voit tout, et ce classement n'est qu'une proposition (L27).

## 4. Tour 2 : oui, ciblé

Oui, car trois retouches changent ce qu'il choisirait :
- **C2, les murs st2 qui ne sont pas son étagère** (d4a, d4c, d7a, d7b). Montrés tels quels, D7 peut tourner en « aucun me
  convient » et d4c perd d'avance, pour un défaut de rendu et non pour son idée. Les deux variantes de D7 l'ont en commun.
- **La courbe absente de d5a.** C'est le seul avantage net de d5b ; remise, le choix entre d5a et d5b porte vraiment sur le geste
  (compteurs ou règle).
- **La bulle de d2c sur Levures** (STG-2) : il écarterait d2c pour un défaut déjà relevé, alors que son « À faire » est une
  vraie idée.

Les quatre autres sont des corrections qui ne changent pas le choix, mais qu'il verrait (« pas fini ») : C1 (Houblons sur Hazy),
le total faux de d8a, les noms collés et les pictos de d4b (capsule, carton), et C5 (onglets de d1a). Le point 0.1 (totaux à
13 px) et le point 0.2 (rond « ? » sans couvrir Fumé) vont dans la même passe.
Pas de version neuve. Le dessin reste au concepteur (Opus), dans `st1-build.mjs` et `st2-build.mjs`, puis captures rejouées et
ouvertes. Les retouches de second ordre (d1c, d6c, d7b, d8a Fûts, d3b 1280) attendent son choix.

LEÇON PROPOSÉE : une série de mini maquettes qui reprend un acquis (ici l'étagère) part du même module de dessin que la série
sœur, et non d'une copie redessinée. st2 a refait le mur et perdu les couleurs EBC, les sachets et la place des tirets, tandis
que st1 les gardait.
