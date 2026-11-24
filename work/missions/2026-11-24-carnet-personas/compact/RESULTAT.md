RESULTAT compact : 29 problèmes (B 4, m 25, D 3) — 10 propositions

Tests : sans objet (test d'écran)

- Paquet servi : index-BoCN8sbd.js (curl ?nocache, 24.11). Chrome de débug, onglet propre, 390 × 844, dpr 2. Onglet fermé (page.close, disconnect).
- Carnets regardés : liste (+ défilement, recherche « citra »), Houblons citra (Articles, menu Articles, Comparer, fiche 1, Choisir, Quand), Chambre froide (Articles, Comparer sur 3 écrans, fiche 1 sur 3 écrans), Sol — matières premières (Local, notes, menu ···), Frigo + congel (Brasserie, Dans À venir). Rien validé, aucun appel IA ; feuilles fermées par Échap, rien d'autre tapé que la recherche.
- Captures : `cap/` (toutes ouvertes avant verdict). Scripts : `e1.mjs` à `e6.mjs`, `mesure.mjs` ; journal : `journal.txt`.

## Mesure : part de l'écran laissée à la donnée (390 × 844, premier écran)

Chrome fixe, présent partout : en-tête 40 + onglets Stocks 43 + sous-onglets Parc/À venir/Carnets/Réalisés 42 = **125 px en haut** ; champ « Ajouter à… » + bouton + 86 + barre du bas 40 = **126 px en bas**. Total **251 px = 30 %**. Le plafond de 70 % est donc atteint avant le moindre en-tête de carnet : aucune vue ne peut passer CARNET-DONNEE-PREMIER-PLAN sans toucher à ce chrome.

| Vue (capture) | Chrome fixe | Chrome du carnet (au-dessus de la donnée) | Donnée visible | Part donnée | ≥ 70 % |
|---|---|---|---|---|---|
| Liste (01) | 251 | recherche + puces de domaine 48 | 545 | 65 % | non |
| Carnet ouvert, Articles (02, 20) | 251 | ‹ Carnets ··· 44, titre 44, « 2 articles à comparer » + domaine 32, onglets 44 = 178 | 413 (dont 190 remplis, le reste vide) | 49 % | non |
| Fiche d'article (06, 25) | 251 | fil 52 + bandeau photo 104 = 156 | 437 | 52 % | non (sa capture : « à peine 50 % ») |
| Comparer (03, 21) | 251 | ‹ retour + « À comparer » 52, « Comparer · Classé par » 59 = 111 ; en-tête de colonnes 107 à 147 | 482 (lignes : 335) | 57 % (lignes 40 %) | non |
| Choisir (15) | 251 | ‹ retour 52 | 541 | 64 % | non |
| Quand déplié (11) | 251 | 178 (comme le carnet) | 413 | 49 % | non |
| Carnet avec notes, Sol (30) | 251 | titre sur 2 lignes + domaine + critère = 178 | 413 | 49 % | non |
| Recherche (41) | 251 | champ + puces 48 | 545 | 65 % | non |

## Combien et quels problèmes ?

B = bloquant (valeur fausse, geste sans effet, élément absent, illisible, contrôle de sa plainte en échec) ; m = mineur.

1. **B** — Toutes les vues — CARNET-DONNEE-PREMIER-PLAN échoue : donnée 49 à 65 % de l'écran (tableau ci-dessus). Fiche et carnet ouvert autour de 50 %, comme il l'a dit. (02, 06, 21)
2. **B** — Houblons citra — prix Citra de Brau- und Rauchshop « 0,10 CHF » faux (LIEN-PRIX-JUSTE) ; il fait le rang 1 au carnet et dans Comparer, le « dès 0,10 » de la liste et la jauge de Choisir (« ‹ moins cher · 0 »). (01, 02, 03, 06, 15)
3. **B** — Houblons citra — le même article CITRA® (US) vaut « ≈3 » au carnet et à la fiche, « ≈4 » dans Comparer : deux prix pour une offre. (02, 03 ; sa capture 2)
4. **B** — Comparer — aucune ligne ne marque qui gagne (COMPARER-QUI-GAGNE) : seule la colonne du 1er au prix est teintée ; Volume 2,6 contre 4,06 m³ sans aucune marque. (03, 21, 22)
5. m — Comparer Chambre froide — l'encart « Compromis » dit « aucun critère ne les départage » alors que volume et dimensions diffèrent de 56 % : lu comme faux. (23)
6. m — Comparer Chambre froide — 22 lignes dont 18 identiques ; tableau de 1 236 px (1,5 écran) pour 4 différences (prix, volume, dimensions, dimensions intérieures). (21, 22, 23)
7. m — Comparer Houblons — ni α ni arômes en ligne : les clés des deux vendeurs ne sont pas rapprochées (« Citra » contre « Taux d'acides alpha ») ; reste « Origine » où « USA » et « États-Unis » passent pour une différence. (03)
8. m — Fiche Houblons — α étiqueté « Citra : 13,6 % » (le libellé est le nom du houblon) ; arômes laissés en allemand (« tropische Früchte »). (06)
9. m — Comparer Houblons — vendeur répété (sous le nom en tête de colonne, puis ligne « vendeur ») ; nom coupé « Brau- und Rauchs… » dans l'en-tête. (03)
10. m — Comparer — en-tête de colonne de 107 à 147 px (photo 36 + titre sur 3 lignes) ; libellés sur 2 lignes dans une colonne de 80 à 100 px, lignes de 52 px. (21, 22)
11. m — Comparer — dans une même colonne, texte à gauche et nombres à droite (zigzag) ; chasse fixe espacée sur des valeurs qui portent des mots (« 0 à 8 °C », « 550 Watt ») ; unité tantôt dans le libellé (« Hauteur de la porte mm » → « 1 845 »), tantôt dans la valeur (« 1850 mm »), « mm » en bleu dans un libellé ; dimensions en mono sur 3 lignes. (21, 22, 23)
12. m — Fiche — barre de défilement horizontale visible en bas (contenu 372 px pour 366) : défilement horizontal parasite. (06, 25, 27 ; ses captures 2 à 4)
13. m — Fiche — bandeau photo pleine largeur de 104 px, image de 104 px au centre, gris de chaque côté, étiquette « photo de la page collée » posée dessus. (06, 25)
14. m — Fiche — carte « Offre » de 86 à 134 px pour trois faits (vendeur, état, prix) : crayon et « Ouvrir » sur une ligne à eux, vide au milieu ; titre « Offre » en plus. (06, 25)
15. m — Carnet ouvert — quatre lignes d'en-tête (178 px) avant la première donnée ; « 2 articles à comparer » redit le compteur « Articles 2 ». (02, 20)
16. m — Carnet Houblons — « votre lien : « https://www.motlerhops.fr/collections/… » » : URL brute en italique, sur 2 lignes, dans le carnet. (02)
17. m — Champ de saisie — nom du carnet coupé (« Ajouter à Chambre… », « Ajouter à Houblons… ») dans un champ de 176 px, coincé entre Photo, Dicter et le + ; deux entrées de création (champ et +) dans 86 px. (02, 20)
18. m — Liste — prix sur trois lignes (« budget / 500 / CHF », « dès / 2 697,74 / CHF ») : cartes de 70 px pour une ligne de titre. (01, 42)
19. m — Liste — ligne « Dans À venir depuis le 20 nov. · Voir » de 28 px répétée sous 9 cartes, même texte partout. (42, 43)
20. m — Liste, classement — la section « Idée 16 » mêle des carnets « passé · S21 », des carnets déjà « Dans À venir » et deux jalons (« Jalon — Peut brasser au local… ») qui ne sont pas des carnets ; « Faits » contient « Refaire évier — bloqué ». Pas de sous-catégorie dans une section. (42, 43, 44)
21. m — Liste — compteurs discordants : sous-onglet « Carnets 20 », puce « Tous 25 » ; pendant la recherche « citra » (1 résultat), « Tous 25 » ne bouge pas et « Anciennes notes · 3 » reste affiché. (01, 41)
22. m — Liste — quatre carnets « ZZ TEST » restés parmi ses carnets (À comparer et Idée). (01)
23. m — Carnets Sol et Frigo — même pastille « Idée · 3 sept. » sur les deux, alors que Frigo est « Dans À venir » juste dessous : état contradictoire. (30, 35)
24. m — Carnet Sol — « Quand · passé · S21 · prix ? » alors que « Budget du Planning : 500 CHF » est affiché deux lignes plus haut ; Frigo dit, lui, « 400 CHF estimé » : même cas, deux rendus. (30, 35)
25. m — Avis « Enregistrement sur le serveur… » posé sur les onglets Stocks : il couvre la navigation (même règle qu'AVIS-VERSION-RECOUVRE). (20 ; sa capture 5)
26. m — Choisir — « Pourquoi » prérempli « Brau- und Rauchshop. » (le nom du vendeur, pas une raison) ; bouton « Choisir chez Brau- und Rauchshop » sur 2 lignes ; cadre pointillé autour de toute la feuille. (15)
27. m — Quand — puces de période de 40 px de haut (DESIGN : jetons de 24 à 32 px). (11)
28. m — Carnet Sol — titre sur 2 lignes et pastille d'état, domaine et critère sur trois lignes de plus : 178 px avant « Articles · collez un lien ». (30)
29. m — Carnet Frigo — ligne « Dans À venir · Voir » de 44 px, puis « Articles · collez un lien », « Notes 1 », « Quand » : 280 px de contenu, et 180 px de vide au-dessus du champ. (35)

Doutes (non comptés) :
- D1 — « Enregistrement sur le serveur… » est apparu à l'ouverture de Chambre froide sans aucune validation (sur sa capture 5 aussi) : l'app écrit-elle quelque chose quand on regarde un carnet ? À vérifier dans PersistenceStatus et la file d'attente de firestoreRepo.
- D2 — L'encart « Compromis » (5) parle peut-être des seuls critères posés (aucun ici) : la phrase serait alors juste, mais trompeuse.
- D3 — Note de Sol « En cours au 20.11.2026 » dont le contenu affiché est « note » : note vide, ou titre par défaut ?

## Propositions (gain estimé à 390 × 844)

1. **Mode carnet ouvert sans onglets Stocks** : dès qu'un carnet, une fiche ou Comparer est ouvert, les deux rangées Articles/Recompter… et Parc/À venir/Carnets… se replient dans la ligne « ‹ Carnets ». Gain 85 px (+10 points). Écart à ses choix : à lui montrer en variantes (le chrome Stocks n'a pas été choisi pour le carnet, mais la navigation change).
2. **En-tête de carnet sur une ligne** : « ‹ Houblons citra ✎ [Brasserie] ··· », puis Articles 2 | Comparer en segmenté de 28 px ; « 2 articles à comparer » disparaît (le compteur le dit). De 178 à environ 76 px : gain 100 px (+12 points). Dans ses choix (D437 garde la pastille de domaine, un toucher la change).
3. **Saisie fondue avec le +** : dans un carnet, une barre de 44 px où le + est au bout du champ ; nom du carnet dans le titre, pas dans le texte d'invite (« Ajouter… »). De 86 à 52 px : gain 34 px (+4 points) et plus de nom coupé. Écart à ses choix : à lui montrer en variantes.
4. **Fiche : photo en vignette** de 56 px à gauche du titre, à la place du bandeau de 104 px ; fil « ‹ Articles · 1re sur 2 › » gardé. Gain environ 100 px (+12 points). Écart (le bandeau vient du port) : à lui montrer en variantes.
5. **Fiche : Offre sur une ligne** : « ggmgastro.com · en stock · TTC · port offert … 2 697,74 CHF [✎][↗] », 44 à 48 px, sans titre « Offre ». Gain de 50 à 86 px (+6 à 10 points). Dans ses choix (Q-1 A : un seul chiffre de prix).
   Avec 1, 2, 4 et 5, la fiche passe d'environ 52 % à environ 80 % de donnée, et le carnet ouvert d'environ 49 % à environ 72 %.
6. **Comparer : qui gagne, par ligne** : la meilleure cellule de chaque ligne différente reçoit une coche verte et le gras, selon le sens du critère (prix bas, volume haut, α selon l'usage) ; les lignes égales restent grises. Une rangée de score en tête « 1er : 3 lignes gagnées · 2e : 2 » (scorecard). Coût 0 px. Dans ses choix (COMPARER-QUI-GAGNE, sa plainte).
7. **Comparer : lignes identiques repliées** : « 18 caractéristiques identiques ▸ » en une ligne de 32 px ; les différences d'abord. Chambre froide : tableau de 1 236 à environ 420 px. En-tête de colonne : vignette 24 px et nom sur une ligne (vendeur en dessous), de 147 à environ 56 px ; ligne « vendeur » supprimée. Dans ses choix (densité, plainte du 24.11).
8. **Caractéristiques classées par sous-catégories communes** : clés rapprochées entre vendeurs et traduites, rangées en groupes (Houblon : α, arômes, récolte ; Prix et dispo ; Dimensions ; Froid ; Électricité), avec sous-titres de 20 px dans la fiche et dans Comparer. Le houblon montre α et arômes en premières lignes ; « USA » et « États-Unis » ne font qu'une valeur. Dans ses choix (sa plainte : « classification ou de sous catégories » ; penser-brasseur : α avant le reste).
9. **Liste plus dense** : prix sur une ligne (« budget 500 CHF », « dès 2 697,74 CHF »), carte de 70 à 48 px ; « Dans À venir » en petite icône calendrier sur la carte, pas une ligne de 28 px ; jalons sortis vers le Planning ; dans chaque section, un sous-classement par domaine (petits titres Local, Brasserie, Meuble, Papiers). Environ 11 carnets par écran au lieu de 6. Dans ses choix (D437 : puces de domaine, l'état reste l'ordre des sections) ; le sous-classement par domaine est un écart : à lui montrer en variantes.
10. **Chiffres et alignement** : chasse fixe sur les seuls chiffres (« 0–8 °C » : chiffres en mono, unité et mots en police normale), nombres alignés à droite et textes à gauche par ligne, pas par colonne ; unité dans la valeur, jamais dans le libellé ; avis « Enregistrement… » déplacé au-dessus de la barre du bas. Dans ses choix (DESIGN : mono pour les mesures seulement).
