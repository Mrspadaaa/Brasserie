RESULTAT maquettes2 : 6 versions, page OK, part de donnée 77–82 %
OK — 6 versions greffées, 11 écrans dont mémo, problème, récolte, idée ; PAGE OK

Tests : sans objet (maquettes statiques). Aucun fichier de src/ touché, rien publié. Chrome 9222 : un seul onglet ouvert, en lecture seule, puis page.close() et disconnect.

## Méthode
- Skill maquettes chargé, en mode greffe. Ni l'outil Workflow ni le lancement de sous-agents ne sont disponibles ici : j'ai donc joué la méthode seul (base, inventaire, versions, contrôle, critique au portrait, une correction, contrôle rejoué, page).
- Greffes communes, tirées de son classement (CLASSEMENT-1) :
  - liste en arbre de v03, avec icône (v01, v04), photo (v03, v06) ou les deux (v02, v05) ;
  - Articles de v02, retiré à droite ;
  - fiche de v02, avec la photo en petit à la place de l'icône ;
  - tableau du carnet de v01, 2 ou 3 caractéristiques par ligne ;
  - Comparer avec critère : v01 (v01, v04), v03 (v02, v05), v08 avec les valeurs d'abord (v03, v06) ;
  - Comparer sans critère : v01 avec barres en plus (v01, v05), v02 en face à face (v03, v06), v08 avec les valeurs (v02, v04).
- Axe propre à chaque version : comment un carnet SANS comparaison est servi.
  - v01 : fil de messages ;
  - v02 : en-tête du genre, 4 cases ;
  - v03 : à retenir ;
  - v04 : frise datée ;
  - v05 : reste à faire ;
  - v06 : photos d'abord.
- Le chat est gardé : le champ « Ajouter à <carnet>… », avec photo et micro, reste visible au repos dans chacun des 10 écrans de carnet. Le + reste volant, la barre du bas est gardée.
- 11 écrans par version : liste, mémo (son vrai carnet « Sol, murs & évacuation »), problème en brassage, récolte, idée, comparatif de houblons, comparatif de matériel, articles, fiche, Comparer, Comparer sans critère.

## Fichiers (tous dans maquettes2/)
- Versions : v01.html à v06.html, assemblées par outil.mjs depuis src/vNN.html et src/commun.css, eux-mêmes écrits par src/construire.mjs (données des 4 genres, 6 traitements, recettes dans versions.json).
- Scripts :
  - outil.mjs et planche.mjs, repris de ../maquettes ;
  - actuel.mjs : capture en ligne, lecture seule, des carnets réels sans comparaison.
- Captures :
  - cap/vNN-<écran>.png (66 au total) ;
  - cap/actuel-*.png (10 au total) ;
  - planches : cap/planches/vNN.png ;
  - page : cap/page-haut.png, page-page.png, page-ordinateur.png.
- Page : page.html, écrite à la main. Elle a 11 rangées ; chacune montre l'actuel (fond jaune), puis v01 à v06. Chaque vignette porte sa part de donnée, son rang de 1 à 5 et une note ; un bouton Copier est en bas. La seule rangée sans équivalent en ligne est la récolte : elle prend pour référence le même gabarit, et la page le dit.
- Contrôles : controle-vNN.txt, critique.md.

## Sorties décisives
- controle-base carnet --dures --statique, rejoué après la correction : les 6 versions sortent BASE OK (4 non vérifiables : C7, C8, K5, CR-VOIX), DURES OK (thème clair, 14 accents, + centré à 350 px et 8 px au-dessus des onglets) et STATIQUE OK.
- verifier-page.mjs page.html --page-lot : PAGE OK (77 images chargées, lisible à 390 et 1280 px, sans erreur). Premier essai ÉCHEC, corrigé : un bloc de 55 mots.
- controle-page-choix.mjs --min=6 : PAGE-CHOIX OK (11 choix, 7 vignettes par rangée à 1280 px, 2 à 390 px). Premier essai ÉCHEC, corrigé : la rangée récolte n'avait pas de référence.
- Part de donnée, mesurée comme à la passe 1 (hauteur laissée au carnet hors barres, sur 844 px) :
  - liste : 65 → 77 % ;
  - tous les écrans de carnet : 49 à 57 % → 82 % ;
  - rempli réel : 51 à 82 % selon le genre et la version (mesures.json).
- Critique au portrait : critique.md. Avant correction, 9 problèmes, tous corrigés en une passe. Après, 3 défauts mineurs. Notes : v01, v02 et v03 à 7 ; v04, v05 et v06 à 6,5.
- Données :
  - réelles : titres de ses carnets, budget du sol 3 500 CHF fait du 08.12.2025 au 21.12.2025 (capture en ligne), prix des houblons et de la chambre froide de la passe 1 ;
  - inventées et marquées « exemple » sur l'écran : notes du sol, vanne, récolte, NEIPA, place au local, écarté.

Prédiction : « Là ça répond, je peux mettre un mémo et retrouver mon sol ; v01 pour le chat, v02 pour la vanne et la récolte, mais les photos de v06 sont sympa. »

DÉCISION À PRENDRE : aucune nouvelle. Restent ouvertes celles de la passe 1 :
- (1) la barre du bas, qu'il avait barrée, est gardée par la règle dure ;
- (3) la note qui rétrograde un article.

CONNAISSANCE :
- « mon sol » est le carnet réel « Sol, murs & évacuation », un chantier du local (Planning, fait du 08.12.2025 au 21.12.2025, budget 3 500 CHF), pas une matière.
- En ligne, l'app sert un carnet de notes avec le même gabarit qu'un comparatif : titre, Critère, Articles « collez un lien », Notes 1, Quand. Elle n'a ni en-tête propre au genre ni fil de notes visible.

LEÇON PROPOSÉE : avant de dessiner un exemple tiré de ses mots, ouvrir son vrai carnet du même nom. Ici, des dates inventées en septembre contredisaient son chantier fait en décembre 2025.

## Usages réels du Carnet (avant de dessiner)
Sources : ses carnets en ligne (titres et domaines, relevés par les personas : brasseur/cap/01-liste-entiere.txt, 25 carnets dont 4 ZZ TEST), PRODUCT.md (Brassins, cuverie/bureau, installation), écrans Matériel et Stocks. « mon sol » = son carnet réel « Sol, murs & évacuation (béton, revêtement, peinture food-safe) », rangé dans « Faits du Planning », budget 3 500 CHF.

| # | Usage | Carnet réel ou exemple | Son besoin (retrouver, décider, suivre) |
|---|---|---|---|
| 1 | Mémo de chantier fini | « Sol, murs & évacuation » (Local › Sol, fait) | Retrouver comment c'était fait (produits, temps de séchage), ce que ça a coûté contre le budget, ce qui reste à reprendre |
| 2 | Problème de matériel pendant un brassage | exemple : vanne de cuve qui fuit au rinçage | Symptôme et moment, brassin touché, photo, cause, réparation provisoire, pièce à commander, à régler avant le prochain brassin |
| 3 | Récolte de houblons | exemple : Cascade du jardin | Date, variété, poids frais puis sec, état des cônes, séchage, rangement, α non mesuré donc usage aroma, mise en stock |
| 4 | Comparatif d'achat de houblons | « Houblons citra » (MotlerHops, Brau) | Qui gagne au kilo rendu selon la quantité, α, récolte, dispo douteuse (sa note), choisir |
| 5 | Comparatif d'achat de matériel | « Chambre froide » (2,6 et 4,06 m³) | Volume, température, prix, place au sol, compromis, choisir |
| 6 | Idée de recette | exemple : NEIPA de mars | Houblons et doses, levure, eau, liens vers les carnets d'achat et la récolte, créer la recette |
| 7 | À-faire bloqué | « Refaire évier — bloqué (attendre vis pieds) » | Ce qui bloque, ce qu'on attend, la relance |
| 8 | Question à un fournisseur | note « Semble difficile à obtenir sur le site français » (MotlerHops) | La question, à qui, la réponse attendue, relire la page sans facturer seul |
| 9 | Papiers et conformité | « Conformité — dossiers SAAV + SEn + assurances » (vers déc. 2027, 850 CHF) | Pièces à fournir, échéances, état de chaque dossier |
| 10 | Jalon | « Peut brasser au local (sans autorisation vente) » | Conditions remplies et restantes |
| 11 | Achat budgété planifié | « Frigo + congel » (S17, 400 CHF, dans À venir) | Budget, semaine, lien, passage dans À venir |
| 12 | Travaux électriques | « Installation électrique 27A (2027) » (vers avr., 1 500 CHF) | Devis, électricien, date, ce que ça débloque |
| 13 | Rangement, meuble | « Armoire de rangement malte / toxique / extérieur » | Dimensions, place, budget |
| 14 | Notes libres en vrac | « Anciennes notes de l'Atelier · 3 » | Retrouver une note, la ranger dans le bon carnet |

Chaque version se montre sur 6 de ces usages : 1 (mémo), 2 (problème en brassage), 3 (récolte), 6 (idée avec notes), 4 et 5 (comparatifs), plus 8 (question) dans le carnet des houblons et 7, 9 à 13 dans la liste.
