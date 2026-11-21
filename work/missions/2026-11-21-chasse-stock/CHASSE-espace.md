# Chasse Stock — regard « espace » (STE), 21.11

Version : tag `en-ligne/2026-11-21-tour8`, build de test (fixture « ZZ TEST » de `chaines.mjs`, rayons + garde + manques + cuve, plus 3 articles ajoutés : Cryo Hops Citra 25g en Pck sans seuil, Sel de cuisine, Désinfectant). 390 tactile (puppeteer, touchscreen) puis 1280 souris, clair ; cave : 390, Étagère lue. Captures : `%TEMP%/ste-cap/` (ouvertes : 01 à 04, 06a, 06b, 08, 10, 11, 13 Fûts/Courses/Matériel/Houblons, 14, 14b, 20, 23, 30, 31). Aucun code touché.
Pas de défaut bloquant. Les défauts déjà connus (STOCK-ESPACE, STOCK-ETAGERE-AUTRES, BR-69, BR-70) ne sont pas recopiés ; STE-3 et STE-8 les mesurent.

## Ses annotations de la capture 01, lues comme propositions

| Annotation | Lecture | Mesure | Verdict |
|---|---|---|---|
| « Houblons » barré | l'onglet est le catalogue de 136 références (Variétés / Dégustations / Sources), pas le stock ; le stock houblon est déjà dans Articles (rayon du mur + groupe de la liste) | 5e onglet ; ouvre un 2e niveau d'onglets (y 90, h 30) | À retirer de la rangée : le mot « Houblons » désigne 3 choses. Deux entrées du code y mènent (`App.tsx:777` « houblon » nouvelle variété, `App.tsx:968` « houblons ») : les rediriger (lien depuis le rayon Houblons ou la fiche d'un houblon). Le catalogue ne doit pas disparaître, seulement sa place d'onglet. |
| Bascule « Étagère » rayée | Étagère devient l'état normal d'Articles, sans bouton | bande de bascule : y 121 → 172 = 51 px, 1146 px de large à 1280, pour deux mots | À retirer. Gain 51 px : 1re rangée y 593 → 542. |
| Flèche de « Recompter » vers l'onglet barré | Recompter prend la place de l'onglet Houblons | la recherche et les pastilles (`blocOutils`) sont déjà communes à Étagère et Recompter | Bonne idée, à condition que pastilles et recherche restent sous Articles ET Recompter (même bloc), sinon on perd le filtre partagé. Ordre conseillé : Articles · Recompter · Courses · Fûts · Matériel. |
| Rond à droite des filtres (après « DDM 0 ») | hypothèse (non prouvée sur son téléphone) : place vide à droite de la dernière pastille, la pastille « ★ épinglés » passant à la ligne | voir STE-7 | À corriger avec STE-7. |

## Défauts

**STE-1 · gênant · bascule Étagère | Recompter**
- Geste : Stocks > Articles, 390 puis 1280.
- Attendu : un seul geste d'entrée vers Recompter, sans rangée dédiée.
- Constaté : rangée de 51 px (y 121→172), un des deux boutons toujours actif.
- Mesure : 51 px = 6 % de 844 ; 1146 × 32 px à 1280.

**STE-2 · gênant · onglet Houblons : trois sens du mot, tab dans tab**
- Geste : toucher Houblons (390 et 1280).
- Constaté : Variétés et lots | Dégustations | Sources et modèles ; « Houblons » = onglet, rayon du mur, groupe de la liste.
- Mesure : 1re variété à y 273 (390). À 1280 : 5 blocs avant elle (ligne « 136 références aucun lot », champ, phrase de 21 mots « Compare les sources… », select « Source du référentiel », bouton « Nouvelle variété », accordéon « Import, export et archives »), 1re carte à y 402/800 = 50 %. La phrase explicative est du texte en trop.

**STE-3 · gênant · hauteur perdue au premier écran de l'Étagère**
- Geste : Stocks > Articles > Ingrédients, 390 (clair et cave).
- Attendu : au moins 3 rangées d'articles au premier écran.
- Constaté : 1re rangée à y 593/844 (70 %) ; sur un vrai téléphone (390×660, L12) y 593/660 = 90 % : 1 seule rangée entamée (calcul sur les positions mesurées, la fenêtre 660 n'a pas été rejouée).
- Mesure (px, y) : barre d'app + onglets 0→82 · « Comparer une recette » 93→120 · bascule 121→172 (STE-1) · recherche 172→212 · pastilles 218→252 · Ingrédients/Autres 255→295 · mur 304→474 (170) · « Trié par… » 476→515 (39) · en-tête « Malts 5 » 528→552 · échelle 563→585 · rangée 593→638. Retirer la bascule (STE-1) et replier STE-4 rend ≈ 90 à 130 px.

**STE-4 · gênant · mur et liste montrent les mêmes articles, « Trié par » répète le sous-titre**
- Constaté : « Malts 5 » écrit au mur (y 305) et à l'en-tête du groupe (y 528) ; « Houblons 4 » et « Levures 1 » de même. « Trié par couleur (malts), amertume (houblons), date (levures) ▾ » : 2 lignes, 39 px, redit le sous-titre du groupe « par couleur, du plus clair au plus f… » (tronqué par « … » à 390).
- Mesure : mur 170 px + « Trié par » 39 px = 209 px (25 % de l'écran) avant le premier nom.

**STE-5 · mineur · une bande d'échelle par groupe**
- Constaté : chaque groupe rouvre « à l'échelle … resserrée au-delà de 5 kg 0 1 2,5 5 kg 20 60 200 » + bouton « Lire l'échelle » : ≈ 22 px de graduations + 32 px de bouton par groupe, 3 groupes.

**STE-6 · gênant · pastille « EBC non connu » sur 5 rangées sur 5**
- Geste : Étagère puis Recompter, 390.
- Constaté : la pastille (≈ 106 × 22 px) prend le tiers de la rangée et tronque le nom : « ZZ TEST Caramü… », « ZZ TEST Malt pils… ». Dépend des données (EBC manquant), mais 100 % des malts de la fixture.
- Attendu : rien (ou un tiret) quand la valeur manque, nom en pleine largeur.

**STE-7 · gênant · pastille « épinglés » : la rangée saute**
- Geste : toucher l'étoile d'un article pour la première fois (390).
- Constaté : « ★ épinglés 1 » (≈ 80 px) ne tient pas à droite de « DDM 0 » (reste ≈ 24 px) : elle passe seule à la 2e ligne ; segment Ingrédients/Autres y 255 → 293, mur et liste décalés. Sans épingle, la place à droite de DDM reste vide.
- Mesure : +38 px de saut (position relevée avant/après, CLS non mesuré) ; même saut en Recompter (capture 31).

**STE-8 · gênant · Autres stocks : 4 cartes qui doublonnent**
- Geste : Autres stocks, 390 et 1280.
- Constaté : 4 cartes (122 px à 390 ; 4 × 563 × 57 à 1280). « Fûts 8 › » et « Matériel 1 › » reprennent les onglets Fûts et Matériel visibles 250 px plus haut ; « Additifs 5 » et « Emballage 2 » reprennent les en-têtes « Sels et additifs 5 » / « Emballage 2 » juste dessous. « rien à signaler » ×2.
- Mesure : 1re rangée y 470 (390), y 500 (1280) ; 176 mots.
- Attendu : le filtre utile seulement, ou les cartes en pastilles sur une rangée (≈ 40 px).

**STE-9 · mineur · Recompter : tuiles et en-têtes redisent le même compte, une tuile vide**
- Constaté : 6 tuiles (3 × 2, y 258→370) « 0/5 comptés », puis chaque groupe répète « 0/5 comptés » ; tuile « Nettoyage 0 · 0/0 comptés » (carte vide), alors qu'Autres stocks de l'Étagère n'affiche pas Nettoyage vide : incohérent.
- Mesure : 1re rangée y 508/844 (60 %) ; 237 mots.

**STE-10 · gênant · Recompter > Compter : noms écrasés**
- Geste : « Compter » sur le rayon Malts (390).
- Constaté : rangée avec case ronde, champ « il en reste » (≈ 62 px), unité, rond ✓ (48 px) : le nom passe sur 2 à 3 lignes (« ZZ TEST / Caramünch… »), rangée ≈ 58 px au lieu de 48.
- Mesure : nom ≈ 100 px sur 366.

**STE-11 · gênant · Courses : contenu à 79 % de la largeur**
- Geste : Courses (390 et 1280).
- Constaté : ligne « 1 à commander avant S49 · 2 manquent › » et carte fournisseur s'arrêtent à x 302 sur 378 (390) et x 1184 sur 1260 (1280) : 76 px morts à droite ; « Tout voir » seul sur sa rangée (34 px) sous la ligne chevron déjà cliquable.
- Mesure : conteneur 366 px, ligne et carte à 290 px.

**STE-12 · gênant · Matériel : liste à moitié de largeur, trois niveaux de commandes**
- Constaté (390) : sous les onglets, un 2e niveau Parc | À venir 1 | Carnets 0 | Réalisés 0 (2 onglets à zéro), puis Tout 1 / À traiter 0 (vide) / recherche / Achat, puis « aujourd'hui 21.11 », puis « sans échéance 1 » ; l'article tient 190 px sur 390 et son nom passe sur 2 lignes (« Fermenteur 120 / L »). 1280 : liste 530 px, frise vide au milieu (≈ 250 px), volet de détail à droite vide sous les pastilles d'état (y 420→630).
- Mesure : 1er article y ≈ 245/844 ; 55 mots.

**STE-13 · mineur · Fûts : pastilles de filtre et en-têtes redisent les comptes**
- Constaté : « À laver 2 · Propres 2 · Pleins 3 · Livré 1 » puis « Livrés · 1 / Pleins · 3 / À laver · 2 / Propres · 2 » ; 4 rangées d'outils avant le 1er fût (y 217/844 = 26 %).

**STE-14 · gênant · fiche d'un article (390) : tête de 194 px, trois fois la même chose**
- Geste : ouvrir Cryo Hops Citra 25g.
- Constaté : tête y 8→202 ; fournisseur 3 × (tête, ligne « Fiche > Fournisseur · changer », select de « Modifier la fiche ») ; α 3 × (pastille, titre « Caractéristiques techniques · α 24,8 % », champ) ; « sans seuil » 3 × (sous la barre, placeholder, phrase « sans seuil : aucune alerte inventée »). « Besoin » 88 px et « Ce qui a bougé » 88 px pour « aucun » et une phrase d'absence.
- Mesure : fiche 1042 px de haut (viewport utile 731) = 1,4 écran ; 263 mots.

**STE-15 · gênant · « l'autre vue de modification » enterrée et éclatée**
- Geste : fiche > descendre > « Modifier la fiche ».
- Constaté : 4 surfaces d'édition pour une fiche : Corriger le stock (quantité), Seuil (champ), « changer » le fournisseur, Modifier la fiche (nom, catégorie, unité, fournisseur, α) ; un seul Enregistrer. « Modifier la fiche » est la dernière carte, à y 1000/1042 (3e écran) ; « Caractéristiques techniques » s'y replie en 3e niveau ; le select Fournisseur ne fait que 168 px sur 346 (nom coupé, comme sur sa capture 02 : « Brau- und Rauchshop G »). Ouverte : fiche 1111 px.
- Attendu : un seul formulaire d'identité (nom, catégorie, unité, fournisseur, α) ; les gestes de stock (corriger, seuil) à part.

**STE-16 · mineur · « Corriger le stock » : bande vide quand il est replié ; ouvert d'office**
- Constaté : replié, la carte fait 73 px pour un titre de 40 px : ≈ 33 px d'air sous le titre (même vide sur sa capture 02) ; ouvert par défaut il prend 172 px alors que c'est un geste rare.

**STE-17 · gênant · fiche à 1280 : colonne de gauche vide, page derrière écrasée**
- Constaté : volet de 760 px sur 1280 ; colonne gauche (Besoin + Ce qui a bougé) s'arrête à y 420 pendant que la colonne droite descend à 1111 : bloc vide ≈ 363 × 320 px (≈ 410 px une fois défilé, capture 14b). Derrière, la page Articles est ramenée à ≈ 420 px : l'onglet « Houblons » est coupé (« Houblo ») et le mur s'étire sur 400 px.

**STE-18 · mineur · Étagère à 1280 : mur large, rangées vides**
- Constaté : mur de 1146 px ; Malts occupe ≈ 600 px, Houblons et Levures ≈ 90 px chacun (un seul groupe), le reste de la rangée est vide ; colonne « Dernier mouvement » : « — » sur 5 rangées sur 5 (fixture sans mouvement : dépend des données), 300 px de blanc.

## Limites

- Un seul tour complet + vérifications ciblées ; pas de deuxième tour « à sec ». Fixture : 14 articles ZZ, pas de mouvements ni de DDM ; ses vrais volumes (21 manques, 23 épuisés) feront jouer plus fort STE-3, STE-6 et STE-7.
- Cave : seule l'Étagère 390 est lue, sans défaut propre au thème ; 21 et 22 prises, non lues.
- Non joué : défilement de Recompter (bloc collant), Enregistrer d'une fiche, Commander, Seuil saisi. Fenêtre 390×660 calculée, non rejouée.
