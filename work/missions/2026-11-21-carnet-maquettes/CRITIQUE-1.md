OK — tour 1 : garder 0, améliorer A1 A3 B3 B1 C1 C3, écarter A2 B2 C2 ; tour 2 oui, axe C seul (caisse dans le carnet)

# Critique 1 — Carnet : Comparer, prix, Choisir → À venir (21.11, tour 1 sur 3)

Juge : Opus (Fable interdit), regard brasseur (PORTRAIT v2, SPEC fin, maquettes.json « carnet ») et regard UX mobile (boosters-ux).
Captures ouvertes : les 27 `cmp-captures/*.jpg` (390, clair), plus les références `04-comparer.jpg`, `g01-8`, `g05-9`, `h06-5`.
Règles appliquées : sa base choisie (articles h06-5, Comparer g01-8 figé, Choisir g05-9 choisi), acquis **C4** « Sortie vers
À venir, pas de caisse dans le carnet », refus **K5** (« Fiche prix + caisse », « Ça correspond pas du tout à mes besoins ?? »),
**CR-AVENIR-CAL**, sa plainte du jour « il ya même pas le prix de la chambre froide ?? », et ses mots du 21.11 : « plus de
couleur et icône », « beaucoup plus petit et compacte », « espace gâché ».

Sens métier vérifié : volumes, empreintes et portes sont cohérents (2,6 m³ sur 150 × 120 extérieur, environ 2 m sous plafond).
TVA d'import 8,1 % juste. 2 513 € + port 380 € → environ 3 000 CHF rendu : plausible. Une seule valeur fausse, en A1 (point A1-1).

## A · Comparer

### A1 Colonnes-cartes (base g01-8) — AMÉLIORER
Phrase prédite : « A1 pas mal, enfin un vrai tableau avec les prix. Mais ≤915 ?? »
Défauts :
1. **Valeur fausse.** Bösch : « dès 5 400 » donne un CHF/m³ **d'au moins** 915, pas d'au plus. Il faut écrire « ≥915 » ou « dès 915 ». En vert, la valeur se fait passer pour la meilleure alors que ce n'est qu'une borne (repos et EUR).
2. Six épingles grises identiques, une par ligne, plus la phrase « Touche une ligne : elle classe » au repos. Un geste qu'il faut expliquer n'est pas découvert, et c'est une légende écrite au repos (refus du portrait § 4).
3. Sans prix, la puce « Prix ? » en pointillé côtoie une cellule « devis » qui n'existe pas dans les deux autres colonnes. Le sens de « devis » (demandé ? reçu ?) ne se lit pas.
4. Le compromis de g01-8 a disparu (« Compromis : la 1re… »). On peut s'en passer pour alléger le texte, mais il faut alors une marque visuelle du gagnant au-delà du fond vert de colonne, par exemple un « 1 » plein, qui existe déjà.
5. Avis UX : la chaîne « Classé par Prix › Volume › Dispo » est un bon booster. La colonne de libellés (76 px) mange la largeur, mais tout tient à 390 sans coupe : c'est mieux que la capture 04 en ligne.
Bon, à greffer : l'ordre de décision en chaîne de puces ; la barre ∝ volume sous la valeur ; la ligne dérivée CHF/m³ ; le « ≈ rendu » avec l'euro dessous.
Correction : ≥915 ; supprimer la phrase d'aide, et rendre l'épingle de la ligne active seule pleine, les autres au toucher ; remplacer « devis » par la pastille B3 pointillée ; greffer de A3 le **plan au sol à l'échelle** dans la ligne « Au sol » et les **barres hachurées** pour les prix inconnus.

### A2 Lignes et puces (base h04-7 + h06-5) — ÉCARTER (garder ses puces numérotées)
Phrase prédite : « La barre elle dit quoi ? Et le volume trois fois… »
Défauts :
1. La barre change de sens selon l'épingle : au repos elle suit le prix (la plus longue est la plus chère, donc la pire) ; sans prix elle suit le volume (la plus longue est la meilleure). Aucun axe ni libellé : on ne comprend pas en 3 s.
2. Le volume revient deux ou trois fois par carte (titre, puce, gros chiffre à droite dans l'état sans prix). C'est le défaut « espace gâché » du 21.11.
3. Les cinq puces passent sur deux lignes : « Porte » reste seule à la ligne 2.
4. La puce barrée « 1 Prix ? » en gris est la puce la plus importante, mais elle paraît désactivée.
Bon, à greffer : **les puces numérotées 1 · 2 · 3 de l'ordre de décision** (vers A1, à la place de la chaîne « › » si elle est plus lisible) ; le lien replié « Isolation, couleur, groupe… 6 lignes › » (vers A1, sous le tableau).

### A3 Bandes par attribut — AMÉLIORER
Phrase prédite : « Le plan au sol c'est top, ça j'aime. Mais je dois chercher quelle couleur c'est. »
Défauts :
1. L'article ne se reconnaît qu'à sa couleur : les barres sont retriées dans chaque bande et ne portent aucun nom. Il faut un aller-retour vers l'en-tête pour chaque barre (UX : l'identité tient à la seule couleur, WCAG 1.4.1). C'est aussi mon erreur d'étalonnage connue, être trop clément devant le multicolore, que je corrige ici.
2. L'en-tête est rangé 2, 1, 3, et non dans l'ordre du classement. Ses nombres (« 4,06 », « 2,6 ») n'ont pas d'unité.
3. **Dispo fausse** : Frigo-Plus « en stock » est posé vers 1 semaine au lieu de « auj. », et Kälte « 3–4 sem. » est un point à 4 au lieu d'un segment de 3 à 4. Les décalages verticaux des points ne veulent rien dire.
4. La porte (70, 80 ou 90 cm, déterminante pour une chambre froide) a disparu.
5. « moins = mieux », « plus = mieux », « m, à l'échelle » : trois légendes au repos.
Bon, à greffer : **plan au sol à l'échelle** (le meilleur booster de la série) ; **barre hachurée pointillée pour un prix inconnu** (« l'inconnu jamais à zéro ») ; **barre € segmentée** (article, port, TVA) en EUR ; dégradé « dès » sur 5 400.
Correction : garder un ordre fixe d'articles dans toutes les bandes (celui du classement) et écrire le nom court au bout de chaque barre ; mettre l'en-tête dans l'ordre du classement, avec l'unité ; poser la dispo en segments depuis « auj. » ; ajouter la porte en icône et cm sous chaque rectangle au sol ; supprimer les légendes « mieux ».

## B · Le prix dans le carnet

Commun aux trois : en h06-5, sa base choisie, le titre est le nom de l'article, et la puce verte porte la valeur du critère **et son rang** (« 30–50 ppb · 1re »). Ici le titre est devenu le volume : la puce verte le répète et a perdu le rang. Correction commune : titre = modèle, puce = « 4,06 m³ · 2e ».

### B1 Pastille de prix — AMÉLIORER (repli derrière B3)
Phrase prédite : « Ok le prix est là. Mais 4,06 m³ deux fois, et le calcul en EUR c'est une ligne de texte. »
Défauts :
1. Volume en double (voir le point commun).
2. En EUR, la décomposition « 2 513 € + port 380 € + TVA 8,1 % + frais 60 = ≈3 000 CHF » prend deux lignes au repos. Elle additionne des euros, un pourcentage et des frais sans devise : c'est du texte, et ça ne se lit pas d'un coup d'œil.
3. « 3–4 sem. » passe à la ligne (EUR).
4. « on compare », « Ce qui compte prix · volume » et « lu sur la page · saisi » ajoutent trois lignes de méta.
Bon, à greffer : la pastille **pointillée « CHF ? saisir »** et la pastille **brune pointillée « ≈ rendu »** (estimé visible) ; l'icône de source (lien ou crayon) dans la pastille.
Correction : décomposition repliée, ouverte au toucher sur la pastille ; une seule devise par opérande (convertir avant d'additionner).

### B2 Règle CHF commune — ÉCARTER (garder l'état sans prix)
Phrase prédite : « Trop gros pour juste un prix, c'est le travail de Comparer ça. »
Défauts :
1. Une barre pleine largeur, gris anthracite, ajoute environ 50 px par carte : le contraire de « beaucoup plus petit et compacte ».
2. La barre de Frigo-Plus (4 900 CHF, lu sur la page) a au repos un petit segment clair que rien n'explique : il « sort de nulle part ».
3. Une barre longue et sombre se lit comme un progrès, alors qu'elle veut dire plus cher. Cette comparaison doublonne avec l'axe A.
Bon, à greffer : **l'état sans prix** (« prix ? » hachuré, bouton **Saisir**, « sur demande » avec bouton **Devis ») est l'appel à l'action le plus clair de la série, à reprendre dans B3 ; la légende EUR « ■ 2 513 € ■ port ■ TVA + frais » pour la décomposition repliée.

### B3 Étiquette accrochée — AMÉLIORER (tête de l'axe B)
Phrase prédite : « L'étiquette c'est parlant, on voit direct que c'est le prix. Le clavier aussi. »
Défauts :
1. Volume en double (voir le point commun).
2. EUR : l'étiquette € cachée derrière se lit mal (« 2 513 € » est coupé par le bord), et le port et la TVA ne se voient nulle part.
3. Deux légendes au repos : « Toucher l'étiquette : saisir le prix » et « Derrière, le prix en euros ; devant… ».
4. Clavier : la touche « ' » oblige à taper soi-même le séparateur des milliers. Le formatage doit être automatique (UX saisie mobile) ; la place libérée peut accueillir « , » ou « Devis ».
5. « 3–4 sem. » passe à la ligne.
Bon, à greffer : **l'étiquette comme picto du prix** (« une forme qui représente vraiment ce que c'est »), à reprendre aussi dans C ; **le clavier en ligne avec la bascule CHF/€** (jamais type=number) ; l'étiquette pointillée « ? » ou « devis » quand le prix manque.
Correction : supprimer les deux phrases ; mettre l'étiquette € décalée au-dessus, entière, et, au toucher, la décomposition de B2 ; formatage automatique des milliers ; boutons Saisir et Devis de B2 sur les étiquettes vides.

## C · Choisir → À venir

Commun aux trois : **« déc. trop juste », « janv. payable » et la rangée de mois payable/trop juste sont un verdict de caisse dans le carnet.** Ils enfreignent l'acquis **C4** « Sortie vers À venir, pas de caisse dans le carnet » et rejouent **K5** (« Fiche prix + caisse »). L'absence de montant de caisse n'y change rien : « trop juste » est la caisse. Base g05-9 : Choisir chez X, Écarter, Ouvrir et la carte pointillée sont repris. Ont disparu : les ronds de rang 2 et 3 des autres articles et le « Ses autres valeurs · place parmi ».

### C1 Prix › livré › payé — AMÉLIORER
Phrase prédite : « Choisir et les 3 cases c'est clair. Mais trop juste/payable, pas de caisse dans le carnet !!! »
Défauts :
1. Puces « déc. trop juste » et « janv. payable » (C4, K5).
2. Sans prix : « À venir, par défaut » et « Effet : dès le prix connu » sont du texte en plus.
3. Les autres articles ont perdu leur rang (ronds 2 et 3 de g05-9) et leur pictogramme de rang.
4. Le prix apparaît deux fois : « 4 900 » en titre et dans la première case.
Bon, à greffer : **les trois cases à icône prix › livraison › À venir** (porte-monnaie, camion, calendrier), lisibles en 3 s ; le bouton « Choisir chez <vendeur> ».
Correction : retirer les deux puces de caisse ; le mois d'À venir reste choisi par le brasseur (toucher sur la case bleue), jamais justifié par la caisse ; rendre les ronds 2 et 3 ; la première case porte l'étiquette B3.

### C2 Frise des mois — ÉCARTER
Phrase prédite : « C'est quoi toutes ces cases vertes ? C'est la caisse ça. »
Défauts :
1. Six cases payable/trop juste avec leur légende : un graphe de caisse en petit, dans le carnet (C4, K5). C'est le défaut central.
2. Sans prix : six cases « ? » vides, une rangée entière qui n'apprend rien.
3. Légende « payable · trop juste · prix ? » au repos.
4. La frise (commande, puis livraison, puis paiement) est le seul apport, et C3 le montre mieux, dans le vrai Calendrier.
Bon, à greffer : le trait commande → camion (délai visible en longueur), à mettre en mini-frise sous les cases de C1 si l'on veut, sans la rangée de caisse.

### C3 Après Choisir — AMÉLIORER (tête de l'axe C)
Phrase prédite : « Bien de voir où ça tombe dans le calendrier, et Annuler. Mais encore trop juste. »
Défauts :
1. « déc. trop juste » en rouge, plus le point rouge sur D (C4, K5).
2. La barre « Chambre froide » s'étend sur deux mois (janv. à mars, ou janv. à févr. en EUR) alors qu'un achat tombe à une date. La longueur ne dit rien.
3. « + Achats 👁 » : deux icônes muettes à côté du nom de la rangée.
4. Doute (non compté) : l'aperçu de la rangée Achats du Calendrier dans le carnet est-il « À venir déplacé dans le Calendrier » (CR-AVENIR-CAL) ? Ici À venir reste la sortie et le Calendrier n'est qu'un lien : à mon sens conforme, à vérifier par le pilote.
5. Sans prix : « date par défaut » est du texte brun à côté du bouton.
Bon, à greffer : **l'état après Choisir** (coche, bleu d'Achats, « À venir · janv. », **Annuler**), retour de geste et réversibilité exemplaires ; le lien « Calendrier › ».
Correction : retirer « trop juste » et le point rouge ; poser l'achat comme un jalon (point ou étiquette B3) au mois d'À venir ; retirer « + » et l'œil de la rangée ; montants en encre normale, pas en rouge ; « date par défaut » remplacé par la case bleue en pointillé.

## Classement (pour lui)

1. **A1**, avec les greffes de A3 (au sol à l'échelle, prix inconnu hachuré) : la base figée g01-8, tenue, et lisible.
2. **B3**, avec les greffes de B2 (Saisir, Devis, décomposition au toucher) : la réponse la plus directe à « même pas le prix ».
3. **C3**, sans la caisse : le geste Choisir avec son effet et Annuler.
4. **C1**, sans la caisse : les trois cases sont le meilleur résumé avant Choisir.
5. **A3** : le plus visuel, mais l'identité par la couleur seule plafonne sa lisibilité.
6. **B1** : correct, mais plus textuel que B3.
7. **A2** : le sens de la barre est ambigu.
8. **B2** : trop haut pour un prix.
9. **C2** : la caisse dans le carnet.

Par axe : A1 > A3 > A2 · B3 > B1 > B2 · C3 > C1 > C2. Combinaison probable : **A1 + B3 + C3**, avec les cases de C1 avant Choisir.

## Tour 2 ?

**Oui, sur l'axe C seulement.** Ses trois versions portent un verdict de caisse contraire à C4. Montrées telles quelles, il risque de les écarter toutes (« pas de caisse dans le carnet ») au lieu d'en choisir une : cette correction change son choix.
Tour 2 : C1 et C3 sans « trop juste/payable », avec les ronds de rang de g05-9, l'achat en jalon et l'étiquette B3 ; C2 retirée.
A et B : leurs défauts (A1 ≥915, phrases d'aide, volume en double, rang dans la puce) ne changent pas son choix entre versions. On les corrige quand même avant de lui montrer, sans nouveau tour de critique. **Exception : A1-1 (≥915) est une valeur fausse visible, à corriger avant toute présentation.**

LEÇON PROPOSÉE : un verdict qualitatif dérivé d'une donnée interdite (« trop juste », « payable ») est cette donnée. Le contrôle C4 doit chercher ces mots, pas seulement un montant de caisse.
