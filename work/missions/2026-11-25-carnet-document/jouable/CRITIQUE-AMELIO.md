ECHEC — 6,5/10 : 5 bloquants, 31 mineurs (Comparer pas encore son choix h04-7, dates et phrases fausses)

# Test d'écran du jouable v7 amélioré (26.11)

- Version : `jouable/m4b-v7.html` (commit 1339697ef), critique en Opus, mode « Test d'écran ».
- Contrat : `work/missions/2026-11-26-liens/AMELIORER-JOUABLES.md`. Rapport de l'auteur : `RESULTAT-AMELIO.md`.
- Captures : les 46 de `cap-amelio/` ont été ouvertes une par une, sans exception (9 avant, 37 après). Ont aussi été ouverts :
  - les deux écrans qu'il a choisis le 17.11 : `h04-7.webp` et `v03-4.webp` ;
  - la mini p5 `O-organise-b.png`, qu'il cite comme étant « dans le thème ».
- Banc rejoué : une copie du banc, dont seul le dossier de sortie change, a tourné dans le scratchpad sur Chrome 9222 (onglet fermé, puis déconnexion).
  - Résultat : 27 gestes sur 27 « ok », 0 erreur de console, 6 offres sur 6 colonnes, dernier appel en `modelTier` complex.
  - Mots au repos dans Organisé : eco 49, cave 45, co2 53, frigo 54, vap 70, citra 83, bt 85. Liste 141, Comparer 92 à 115.
  - Les « ok » du banc disent seulement que chaque geste a tourné sans erreur. Ils ne disent pas que l'effet est juste : les points 11, 17, 18 et 32 ont tous passé le banc.

## Ce qui progresse (à garder)
- Plus d'emoji 3D géants, de grosses bulles ni de hachures. Les icônes sont au trait, et l'habit est celui de l'app : barre d'onglets, Source Sans, jaune `#F2C14E` pour l'action principale, violet pour l'IA.
- La liste en arbre tient 13 carnets à 390 px. Les dates sont comptées depuis aujourd'hui, avec le bon jour de la semaine (je 26.11, lu 30.11, di 6.12, sa 1.5.27 et lu 1.3.27 vérifiés).
- « samedi 6 déc. au matin : le 6.12 est un dimanche » : c'est exactement la précision demandée.
- « ≈ 150 CHF estimé · exemple » apparaît sur l'écoulement. Pour l'écoulement et pour les caractéristiques proposées, « trouvé », « pas trouvé », « à vérifier » et « pas noté » sont distingués, et aucune valeur n'est inventée.
- Comparer a enfin une vue à part : critère classé, Côte à côte avec le meilleur en vert, Compromis, Écartés avec Reprendre, « + Ajouter une caractéristique », « ✦ Proposer ».
  - Les calculs à quantité égale sont justes :
    - Fournisseur B : 0,55 × 600 + 80 = 410 ;
    - Verallia : ≥ 504 pour 1200 ;
    - Brouwland : 0,58 × 600 + 45 = 393 ;
    - Bouteilles33 : 372.
- Citra montre maintenant une comparaison (« Comparer 2 offres » au pouce), ce qui répond à sa plainte « Aucune comparaison ?? ».
- Relire et « Escalader à l'IA forte » sont branchés, et la barre du pouce ne pose aucune question (PAS-DE-HARCELEMENT tenu).

## Problèmes, écran par écran (B = bloquant, m = mineur)

### Liste et À faire (01 à 05)
1. m — À côté de chaque carnet, une jauge de 4 tirets (gris, bleus ou jaunes). La légende du haut ne donne que la couleur, pas ce que compte le nombre de tirets : c'est un symbole muet (point 5).
2. m — La barre rouge à gauche (priorité haute) n'a plus de légende ; la version d'avant en avait une.
3. m — Dans la ligne des résolus, les noms sont coupés sans « … » (« Pompe qui »).
4. m — À faire : « Réserver le stand · Fête de la bière » apparaît deux fois, à la même date. La prochaine étape et la tâche ne sont pas fusionnées.
5. m — À faire : « Ranger la cave / Ranger la cave » répète le titre. « Contacter entreprise X » n'est pas un nom réel.

### Organisé, commun à tous les carnets
6. m — Le titre est tronqué par la puce de sous-catégorie, plus large que lui : « 600 bouteilles 3… », « CO2 qui baisse v… », « Trop de vapeur au bra… », « 600 bouteilles, 6… ».
7. m — Trois bandes s'empilent au pouce (action, champ, onglets) sous l'en-tête et Mes notes | Organisé. Le chrome prend environ 45 % de la hauteur à 844 px.
8. m — Les toasts se posent sur la barre d'action juste après le geste et la masquent : captures 11, 13, 27, 28, 41 et 43. En 13, la barre paraît vide.
9. **B — Des dates estimées sont affichées comme sûres, et l'une est fausse.**
   - Frigo : sa note dit « avant décembre » (`reponses-v7/frigo.json`, `quand`). L'écran affiche « dans 5 j · ma 1.12 », c'est-à-dire déjà en décembre.
   - Vapeur : « fin du mois » devient « lu 30.11 ». CO2 : « dans une semaine » devient « ma 1.12 ». Aucun « ≈ » ni « estimé », alors que la version d'avant marquait « ≈ 30 nov. » et « ≈ 1 déc. ».
   - Le défaut se retrouve dans la liste (5 j, 4 j). Il enfreint le point 6 : « trouvé / pas trouvé / estimé distingués ».
10. m — L'écran est moins visuel que la mini p5 qu'il cite comme étant « dans le thème » (`O-organise-b`).
    - La mini p5 avait des tuiles depuis, dernier pas, coût et prochaine, des pistes reliées à leurs options, et le chemin du carnet.
    - La v7 n'a que des pilules de texte et des icônes grises identiques (la même clé pour « Sanitaire » et « Changer le joint »).
    - Risque de rejouer PRO-MAIS-PAS-CLAIR (« C'est plus pro mais moins claire ») ; le point 11 n'est fait qu'en partie.
11. m — Organisé reste textuel : bt 85 mots, citra 83, vap 70. On y trouve aussi des redites :
    - la date 2 fois (héros et Échéance) ;
    - « 2 offres » 2 fois (citra) ;
    - le titre 2 fois (cave) ;
    - le domaine 2 fois (« motlerhops.fr / motlerhops.fr »).

### Écoulement (org-eco, 10 à 14, notes-eco)
12. m — Après « Fait », le héros est barré et le pouce n'offre plus que « Pas fait ». La suite (« Devis attendu ») n'est pas proposée.
13. m — Mes notes : en bas, 4 icônes sans mot (crayon ✦, image, lien, case), différentes de la barre d'Organisé (champ, ✦, +). Le titre « ZZ TEST — écoulement qui fuit » est répété sous l'en-tête.

### 600 bouteilles et Comparer (org-bt, 20 à 28)
14. **B — Le Compromis est faux.** « B : 600 pile, mais le plus cher. » contredit le héros, « Fournisseur B gagne · moins cher pour 600 livrées · 410 CHF ».
    - B n'est « plus cher » qu'au prix par bouteille affiché.
    - Son choix h04-7 chiffre le compromis : « 70 ppb pour 9 600 CHF, soit 1 800 CHF de moins… ».
    - Le texte ne bouge pas non plus après qu'on a écarté Verallia.
15. **B — Les barres classées sont à l'inverse de son choix h04-7** (COMPARER-PAS-SON-CHOIX, règle n° 1).
    - Chez lui, le n° 1 a la barre pleine, et les barres décroissent ensuite.
    - Ici, la longueur suit la valeur. Le gagnant (410) a donc une barre plus courte que le 2e (≥ 504), et Occasion (80, qui ne couvre pas le besoin) a la plus courte.
    - En Prix/bt, le gagnant (0.20) a la barre la plus courte.
    - Au coup d'œil, on lit le classement à l'envers.
16. m — Les en-têtes de colonne ne restent pas collés. Après défilement (22 à 26), on ne sait plus quelle colonne est quelle offre.
17. m — Les 3 colonnes ont la même icône de bouteille. Son choix dessine l'objet de chaque offre : ici, rien ne les distingue (CARNET-CARTE-MUETTE léger).
18. m — Le nombre de caractéristiques diffère : « 3 offres · 5 caractéristiques » dans Organisé, 6 dans Comparer (de même pour 6 offres).
19. m — « ✦ Proposer » ajoute « Délai de livraison » juste sous le « Délai » ajouté à la main : doublon.
20. m — Prix/bt met « Occasion » 1re en vert sans avertir qu'elle ne couvre pas 600 (l'avertissement n'existe que dans Total).
21. m — Après Prendre (27), le bouton « Commandé chez Fournisseur B » déborde : la coche est coupée à gauche. Le bouton ↻ n'a pas de mot.

### Six offres (30 à 34)
22. **B — Le gagnant est hors écran** (COMPARER-BEAUCOUP-D-OPTIONS).
    - Les colonnes suivent l'ordre de saisie, pas le classement.
    - Bouteilles33, en vert, n'apparaît qu'après défilement horizontal ; on voit 3,5 colonnes à 390 px.
    - La colonne des libellés (« Total 600 livrées CHF » sur 3 lignes) prend 30 % de la largeur.
    - h04-7 tient 5 colonnes, rangées dans l'ordre du classement.
23. m — Défilement horizontal : la première colonne n'est pas opaque. On y voit des restes de texte (« ur ») et un liseré vert à « Quantité », et des cellules coupées (« :asion », « ment », « 0 seul. »).
24. m — Organisé à 6 offres : « Options » ne montre que « Occasion sur annonce ». Le « Compromis » (« Bouteilles33… ; Brouwland suit à 393 ») est un classement, pas un compromis.

### Citra (org-citra, 40 à 43)
25. m — Relire a été joué sur un lien déjà « en lecture » : seule l'icône change (🔗 → ↻), l'effet se voit à peine (L12). Le contrat demandait « 🔗 en lecture ».
26. m — Chaque lien porte en permanence Relire et « IA forte » (deux boutons de 44 px). Le texte se replie alors sur 3 lignes (« 245.70 CHF / 5 kg · 66 am Lager »). « IA forte » n'a pas de verbe.
27. m — « Qui gagne quoi » n'a pas de gagnant, et les titres des tuiles ne sont pas de même nature (« prix » / « 5 kg »).
28. m — L'image simulée est un cône dessiné, pas l'objet : à rejouer avec une vraie `liens/<id>.image`.

### Vapeur (org-vap)
29. **B — Dans « Qui gagne quoi », Brewtools « gagne » le stock alors qu'il est « pas en stock ».**
    - La tuile est « Stock · Brewtools · pas en stock » : c'est un non-sens.
    - « Raccord · KegLand · 2 inch tri-clover » n'est pas un avantage non plus.
30. m — Les liens kegland et brewtools ont l'icône de la catégorie (une chope), et leur domaine est écrit deux fois.

### Frigo (org-frigo)
31. m — Le héros dit « Comparer les devis », mais le pouce propose « Fait ». Pour 600 bouteilles, le pouce propose Comparer.
32. m — « Qui gagne quoi » ne montre que « Réparer 480 CHF ». Le 1 200 CHF du frigo neuf disparaît du premier plan, alors que la version d'avant les opposait côte à côte.
33. m — « 14 °C · visé 2 °C » n'a pas de couleur d'alerte, alors que CO2 met 0,4 bar en rouge.

### CO2 et cave (org-co2, 50, org-cave, 51)
34. m — La capture 50 est identique à org-co2 : l'en-tête n'apporte rien de plus à voir.
35. m — Cave : les filets de la liste ne vont qu'à mi-largeur (défaut de rendu).
36. m — Dans le menu ⋯ (42), « Changé par l'IA · voir et annuler » apparaît, mais aucune capture ne montre ce qu'il ouvre.

Bilan : 5 bloquants (9, 14, 15, 22, 29) et 31 mineurs.

## Doutes, non comptés
- Le thème « cave » est forcé en sombre. DESIGN.md fait du thème clair le défaut, et ses choix h04-7 et v03-4 sont clairs ; mais les mini p5, qu'il dit « dans le thème », sont sombres.
- La barre d'onglets marque « Stocks » comme actif pour Carnets.
- La puce de catégorie (30 px) et les onglets Mes notes | Organisé (34 px) ont une zone de toucher étendue par un pseudo-élément, non mesurée ici.
- La mini frise « comparé › choisi › à commander » (27, 28) est propre à l'achat, mais elle est proche de FRISE-GENERIQUE.
- Les noms réels Vetropack, Brouwland et Bouteilles33 portent des prix de banc sans la marque « exemple », alors que l'écoulement la porte.
- Le badge ✦ passe de « 1 » à « 4 » après l'ajout d'une note (14) : c'est peut-être la relecture.

## Trois personas
- **Brasseur TDAH, visuel — 6/10.** « C'est moins gamin, ça ressemble à l'app, mais c'est devenu gris et plein de petites pilules à lire. Les mini maquettes étaient plus parlantes. » Ce qui le gêne : 10, 11, 15, 1, 17.
- **Brasseur pressé, au téléphone — 7/10.** « Fait et Prendre sous le pouce, c'est bien. Mais le toast cache le bouton, le titre est coupé, et avec 6 offres je ne vois pas le gagnant. » Ce qui le gêne : 8, 6, 22, 7, 16.
- **Gérante achats et échéances — 6/10.** « Les jours comptés, c'est top. Mais "avant décembre" devenu le 1er décembre, un compromis qui dit "le plus cher" pour le moins cher, et deux fois la même tâche : je ne peux pas m'y fier. » Ce qui la gêne : 9, 14, 29, 4, 18.

Phrase prédite du brasseur : « Mieux, plus pro, et enfin une vraie comparaison. Mais la comparaison n'est pas celle que j'ai choisie, les barres sont à l'envers, et il y a des infos fausses. Toujours 7/10. »

## À corriger
1. (B9) Garder « ≈ » ou « estimé » sur toute date déduite (« fin du mois », « dans une semaine »). « avant décembre » doit donner au plus tard le lu 30.11, marqué ≈. Même règle dans la liste et dans À faire.
2. (B14) Calculer le Compromis à quantité égale, chiffré comme dans h04-7 (« B : 410 pour 600, 94 de moins que Verallia ; Occasion moins chère à la bouteille mais 400 seulement »). Le recalculer après Écarter.
3. (B15) Barres classées comme dans h04-7 : le n° 1 a la barre pleine, puis décroissance selon le rang. Une offre qui ne couvre pas le besoin est marquée à part, sans barre courte trompeuse.
4. (B22) Ranger les colonnes du Côte à côte dans l'ordre du classement, le n° 1 à gauche. Libellés de ligne courts (« Total CHF », « /unité ») et colonnes étroites en chiffres alignés, pour tenir 5 colonnes à 390 px comme h04-7.
5. (B29) Une tuile de « Qui gagne quoi » ne montre qu'un avantage réel. Sinon, écrire « rien ne départage encore » et proposer Comparer.
6. (m16, m23) En-têtes de colonne collants et première colonne opaque pendant le défilement.
7. (m8) Toasts au-dessus de la barre d'action, jamais dessus.
8. (m6) Puce de sous-catégorie réduite à l'icône quand le titre ne tient pas ; le titre passe d'abord.
9. (m10, m11) Reprendre de `O-organise-b` les tuiles (depuis, dernier pas, coût, prochaine) et le lien pistes → options. Supprimer les redites (date en double, domaine en double, titre en double). Viser ≤ 50 mots au repos.
10. (m1, m2) Donner un sens lisible à la jauge de tirets (étape écrite au toucher, ou légende), et légender la barre de priorité.
11. (m17, m28) Une image ou un dessin par offre dans Comparer, comme dans son choix. Rejouer Citra avec une vraie image.
12. (m4, m5) Dédoublonner À faire (prochaine étape et tâche) ; ne pas répéter le titre comme sous-titre.
13. (m12, m31) Après « Fait », proposer l'étape suivante. Sur une étape « Comparer », mettre Comparer au pouce.
14. (m18, m19, m20, m21, m24) Compter les caractéristiques de la même façon partout. Ne pas proposer un doublon de caractéristique. Avertir « ne couvre pas » sur chaque critère. Bouton « Commandé » sans débordement. Options cohérentes avec le nombre d'offres.
15. (m25, m26) Relire : un effet visible (état et heure). Regrouper Relire et IA forte dans un menu ⋯ du lien, avec des verbes (« Relire », « Relire avec l'IA forte »).
16. (m13, m32, m33, m35) Mes notes : la même barre que dans Organisé, sans titre répété. Frigo : les deux devis visibles au premier plan, 14 °C en alerte. Filets de la liste en pleine largeur.

LEÇON PROPOSÉE : un banc qui rend « 27/27 ok » vérifie que les gestes tournent, pas que l'écran dit vrai. Chaque phrase de l'IA (compromis, qui gagne quoi) et chaque date déduite doit se recalculer contre la donnée source, dans un contrôle qui échoue sur « B : 600 pile, mais le plus cher » et sur « avant décembre → 1.12 ».
