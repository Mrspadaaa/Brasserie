OK — 7 problèmes, 4 bloquants (les retouches p2 tiennent à l'écran : total entier, lignes retirées et total changé en rouge, plus d'icône hors brassage ; mais le rejeu du cache détruit la dépense, le payé reste un faux vert, les montants des lignes retirées n'existent pas sur le ticket, et BAUHAUS recule : lecture en échec puis 23 lignes décalées)

Version : 46c7a569 (`claude/refonte-houblons-v4`), bundle servi `index-CZaQhj0K.js`, aiTask redéployé, https://brasserie-l-affinee.web.app, compte connecté, 10.11.
Quatre passages, script `critique/en-ligne/jouer6.mjs` (dérivé de `jouer5.mjs` : dossier de pièces, débordements, journal des réponses aiTask) :
e) Sun Store 1 + 2 en deux fichiers par « Documents », copies de 8 octets de plus pour forcer une lecture neuve, 390 cave ; f) idem 1280 clair (cache) ;
g) BAUHAUS tachée 390 cave ; h) même BAUHAUS, rejouée après l'échec de g. Lectures Gemini lancées : 3 (e 14 s, g en échec après 240 s, h 30 s) ; f servie
du cache en 3 s. 50 captures dans `critique/en-ligne-5/`, 14 planches `planches/p01` à `p14` (`en-ligne/planches4.mjs`), toutes ouvertes (L12).
Sorties : `en-ligne-5/sortie-*.txt`. « Confirmer » jamais touché ; tout fermé par × › Abandonner (`preuveEncore:false`). Aucune erreur de page.

## Les problèmes 1 à 4 du jeu 4, rejoués

| jeu 4 | vu au jeu 5 | verdict |
|---|---|---|
| 1 · page 1 perdue sous des coches vertes | e : la relecture a gardé la page 1 cette fois (Paracétamol, Ibuprofène, 14,60) et retiré la page 2 ; les 7 lignes barrées sont dites : « ! 7 lignes lues puis retirées 348,50 › Les garder », « ! Total changé 163,85 → 14,60 › Remettre 163,85 », drapeau rouge « À vérifier · 7 lignes retirées · 348,50 CHF », « Articles lus » et « Somme des lignes » en gris neutre | **dit en rouge** ; mais voir 2 et 3 (les montants sont faux, le rejeu du cache efface tout) |
| 2 · terminal ≠ total sans rouge | e : « ✓ Payé = imprimé · TWINT 14,60 » vert, note « Le terminal affiche 163,85, plus que le total » ; après « Remettre 163,85 » : « ! Payé · TWINT ≠ imprimé 14,60 / 163,85 −149,25 » rouge | **pas tenu** (problème 3) |
| 3 · total coupé « 149,; » à 390 | e : « 14,60 » entier, « lu ~~163,85~~ CHF » sur sa ligne ; `debordements: []` ; après « Remettre » : « 163,85 » entier | **tient** |
| 4 · icônes de stock hors brassage | e : 0 pictogramme sur les 7 lignes barrées (Vaxigrip, Rabais, Comirnaty, Total brut, H21) ; « SUN STORE · Autre » | **tient** (sauf f, problème 1) |
| BAUHAUS en non-recul | g : « Le justificatif ne peut pas être lu. » ; h : rouge Articles / Somme, drapeau une ligne, « Comparer à la photo » (−4), Payé vert 352,05, aucun champ focalisé ; mais 23 lignes au lieu de 29, noms et montants décalés | **recul** (problème 4) |

## Sa question : « combien et quels problèmes il y a ? »

1. **BLOQUANT — Le rejeu du cache détruit la dépense (f, 1280 clair, 3 s).** Mêmes deux photos que e, servies du cache : fournisseur « Fournisseur » (« — »), total « — », une seule ligne « Ligne sans libellé ? × — = — » avec « unité à remplir » rouge et pictogramme paquet, catégorie « Fournisseur facultatif · Brassage », « Articles lus ≠ annoncés 0 / 2 », « Total non imprimé · lignes 0,00 », « Payé · TWINT ≠ imprimé 14,60 / 0,00 », TVA « — », « Pour quoi ? à décrire ». Les 9 lignes lues, 163,85, SUN STORE : disparus. En brasseur : « j'ai mis mes deux tickets et j'ai une dépense vide ». Valeur fausse, éléments absents, stock proposé sur une pharmacie. Cause probable : `finLecture` rejoue la fusion (`provisoireDeRetirees`) sur un final du cache qui porte `retirees` (p2 § 4) et perd le reste du résultat. Attendu : un final du cache rendu comme un final neuf (e), à l'identique.
2. **BLOQUANT — « 7 lignes retirées · 348,50 CHF » : un montant qui n'existe pas sur le ticket (e).** Les lignes barrées additionnées : Vaxigrip 26,68, Rabais −0,68, Comirnaty 75,15, Rabais −1,90, « Total brut CHF » 151,83 (un sous-total pris pour une ligne), « Rabais » −2,58 (le rabais total), H21 « 2 ? × 50,00 = 100,00 » (le ticket dit 50,00 pour 2). Le ticket 2 fait 149,25. « Les garder » rend 9 lignes et « Somme ≠ imprimé 363,10 / 14,60 +348,50 », drapeau « 348,50 CHF en trop » ; « Remettre 163,85 » : « 363,10 / 163,85 +199,25 », « TVA recalculée 0,37 / 4,15 », « Lignes hors articles 1 ligne : « Total brut CHF » › retirer cette ligne ». Le chemin de réparation promis par p2 (7 lignes, 163,85, Payé = imprimé) ne se produit pas en ligne. En brasseur : « 348 francs ? j'ai payé 163,85 ». Attendu : une ligne retirée qui est un sous-total ou un rabais total n'entre ni dans le compte ni dans la somme ; une ligne dont la quantité est « ? » ne multiplie pas ; le montant du drapeau est celui qui manque face au règlement (163,85 − 14,60 = 149,25).
3. **BLOQUANT — « Payé = imprimé · TWINT 14,60 » vert sous un terminal à 163,85 (e, 390 cave).** Le payé a suivi le total changé (163,85 → 14,60) : la rangée coche vert et la note dessous la contredit. Après « Remettre 163,85 », la rangée devient « Payé 14,60 / 163,85 −149,25 » : le payé lu par le terminal est 163,85, pas 14,60. Sa plainte du 09.11 (« quand 2 totaux sont incorrectes, ça le marque pas en rouge ») reste vraie sur cette rangée. Attendu : le montant payé est celui du terminal (163,85), jamais recopié du total ; « Payé ≠ imprimé 163,85 / 14,60 +149,25 » rouge, geste « Les garder · 149,25 retirés ».
4. **BLOQUANT — BAUHAUS recule.** g : après le redéploiement, la première lecture rend « Le justificatif ne peut pas être lu. » (240 s, aucune erreur console, repli sur le formulaire vide « Total TTC 0,00 · Enregistrer »). h, lecture neuve 30 s : 23 lignes (jeu 4 : 29, « 29/29 justes »), « Articles lus ≠ comptés 23 / 27 −4 », « 34 corrigées », pied « BNOSEE NEY. ORANCR · pas retrouvée · 1/32 ». Les corrections décalent les lignes : « GANTS DE TRAVAIL » sur « ~~METRE AUGA · 1 pièce × 7,90~~ » à 4,25 ; « TAETS TANTBEE BEAKUX » sur « ~~TURBINE RELARMOOS~~ » ; « BAC A 82733587 BIXT6 » sur « ~~BAUHAUS BUT NAAKU · 1,20~~ » à 5,20 ; « ROBAN DE MASQUAGE SON » sur « ~~PINCEAU PLAT 40MM · 3,40~~ » à 4,50. « Les garder » (10 lignes) : 33 lignes avec ROBAN DE MASQUAGE SON et COLLE DE CONTACT 120G en double, 291,35. Mots bruts « (other / equipment) » ×3 dans le bloc. Valeurs fausses (nom ≠ montant) et un geste sans effet au premier essai. Attendu : la lecture d'avant (29 lignes) ou mieux ; une correction de nom ne change pas le montant de la ligne ; « ne peut pas être lu » n'arrive pas sur un ticket lu la veille.
5. **Mots bruts de retour dans le bloc.** « NoVatTax - 0% — code tva : lectures divergentes (0 / absent) » (Sun Store, 390 et 1280) ; « nature : lectures divergentes (other / equipment) » (BAUHAUS ×3). Jeu 4 : aucun. Non bloquant.
6. **Deux rangées rouges pour un même fait (h).** « Vues par une seule lecture 10 · +56,95 › Les garder · il resterait 60,70 » et « 10 lignes lues puis retirées 56,95 › Les garder » : même geste, un toucher sur l'une fait disparaître l'autre. p2 l'avait noté. Non bloquant.
7. **Le pied « pas retrouvée » mange toujours l'écran à 390** : « Vaxigrip … pas retrouvée · 1/7 » (e), « BNOSEE NEY. ORANCR · 1/32 » (h), quatre lignes fixes sur toutes les vues, et « Tout valider » tranche 32 corrections en un toucher. Jeu 4, problème 5 ; hors contrat de p2. Non bloquant.

## Table des captures

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| sunstore e 01 à 03 | cave | 390 | Finances ; entrée « Documents » ambre ; 2 pages jointes, « Lire 2 pages » | — | — |
| sunstore e 04, 05 | cave | 390 | lecture neuve 14 s : « 14,60 » entier, « lu ~~163,85~~ », drapeau « 7 lignes retirées · 348,50 CHF », retirées et total changé rouges, Payé vert 14,60 + note terminal, TVA 0,37, « 8 corrigées », NoVatTax | 2, 3, 5, 7 | 2, 3 |
| sunstore e 06, 07 | cave | 390 | 2 lignes vives, 7 barrées sans icône (dont « Total brut CHF », « Rabais −2,58 », H21 100,00) ; pied « 1/7 » | 2, 7 | 2 |
| sunstore e 08 | cave | 390 | « Les garder » → 9 lignes, « Somme ≠ imprimé 363,10 / 14,60 +348,50 », « 348,50 CHF en trop », « Lignes hors articles 1 ligne » | 2 | 2 |
| sunstore e 09, 10 | cave | 390 | « Remettre 163,85 » → 163,85 entier, « 363,10 / 163,85 +199,25 », « Payé 14,60 / 163,85 −149,25 », TVA 0,37 / 4,15 | 2, 3 | 2, 3 |
| sunstore e 11, 12 | cave | 390 | × › Abandonner, retour Finances | — | — |
| sunstore f 01 à 03 | clair | 1280 | Finances ; entrée noire ; 2 pages jointes | — | — |
| sunstore f 04 à 07 | clair | 1280 | cache 3 s : « Fournisseur — », 1 « Ligne sans libellé », Brassage, « Articles 0 / 2 », « Payé 14,60 / 0,00 », NoVatTax | 1, 5 | 1 |
| sunstore f 08, 09, 10 | clair | 1280 | Articles → photo ouverte (2 vignettes) ; Payé → panneau règlement ouvert ; bloc inchangé | 1 | 1 |
| sunstore f 11, 12 | clair | 1280 | × › Abandonner, retour Finances | — | — |
| bauhaus g 01 à 03 | cave | 390 | Finances ; entrée ; « Le justificatif ne peut pas être lu. » formulaire vide | 4 | 4 |
| bauhaus h 01 à 04 | cave | 390 | lecture neuve 30 s : 352,05, 23 lignes, drapeau « 117,65 CHF manquants », Articles / Somme rouges, une-lecture et retirées rouges, Payé vert, « 8 à contrôler · 34 corrigées », other / equipment | 4, 5, 6 | 4 |
| bauhaus h 05, 06 | cave | 390 | lignes avec noms barrés décalés (GANTS / METRE AUGA, BAC A / BAUHAUS BUT NAAKU…) ; pied « 1/32 » | 4, 7 | 4 |
| bauhaus h 07, 08 | cave | 390 | Articles, Somme → photo ouverte, focus bouton | — | — |
| bauhaus h 09 | cave | 390 | « Les garder » → 33 lignes, « 60,70 CHF manquants », « Ajouter la ligne manquante » | 4 | 4 |
| bauhaus h 10, 11 | cave | 390 | Lectures → VITRIFIC ouverte ; bloc fin (doublons ROBAN, COLLE) | 4 | 4 |
| bauhaus h 12, 13 | cave | 390 | × › Abandonner, retour Finances | — | — |

## Doutes (non comptés)
- La relecture (3.8) ne rend qu'un des deux tickets, et pas le même d'une fois à l'autre : page 2 au jeu 4, page 1 au jeu 5. p2 l'a écrit « comportement du modèle » : tant que la note multi-pages dit « captures successives d'un même document », deux tickets d'un même règlement ne seront pas lus entiers ; à mesurer au banc réel avant un troisième jeu.
- g : l'échec de lecture n'a laissé ni erreur console ni réponse aiTask en erreur dans mon journal (ajouté pour h seulement) ; 1 échec sur 2 lectures BAUHAUS, à surveiller plutôt qu'à conclure.
- « Pour quoi ? SUN STORE · proposé » / « Fournisseur et catégorie SUN STORE · Autre » (e) : deux catégories, déjà noté.
- 1280 : non rejoué pour BAUHAUS (budget de lectures) ; Sun Store 390 clair non joué.

LEÇON PROPOSÉE : un correctif de lecture ou de cache se juge en ligne sur une lecture neuve ET sur son rejeu du cache, à deux largeurs, avant de dire « tient » : au jeu 5, la lecture neuve montre les rouges voulus et le rejeu du cache efface la dépense.
