OK — 8 problèmes, 5 bloquants (les deux bloquants du jeu 6 tiennent : BAUHAUS 29 lignes, chacune au montant du ticket, « Rénovation 29 », 0 icône de stock, 0 mot brut ; le cache rend les mêmes valeurs que le flux ; mais Sun Store affiche un payé 14,60 faux sans geste pour le remettre et un « 13 articles » faux en rouge, et BAUHAUS propose 7 doublons « à garder », perd la quantité « 1 » des 29 lignes et montre des corrections qui n'ont pas eu lieu)

Version : afb30756 (`claude/refonte-houblons-v4`), bundle servi `index-D3rdKX0B.js`, aiTask redéployé, https://brasserie-l-affinee.web.app, compte connecté, 10.11.
Script `critique/en-ligne/jouer8.mjs` (= `jouer7.mjs`, sortie `critique/en-ligne-7/`). Pièces : copies de 8 octets de plus dans le scratchpad (`pieces7/`,
`bauhaus-tache.jpg`, `sunstore-1.jpg`, `sunstore-2.jpg`), le dossier passé en `--dossier` contient bien les trois fichiers (piège du jeu 6 évité ;
`erreurEntree` null). Passages : m) BAUHAUS tâché, 390 cave, lecture neuve (32 s, 6 réponses aiTask) ; n) Sun Store 1 + 2 par « Documents », 390 cave,
lecture neuve (9 s, 4 réponses aiTask) ; o) Sun Store, 1280 clair, cache (3 s), ordre inverse lectures › payé › somme › articles ; p) BAUHAUS, 1280 clair,
cache (2 s). Lectures Gemini lancées : 2 (m, n). 53 captures, 20 planches (`en-ligne-7/planches/p01` à `p20`) ; ouvertes : p01 à p06, p09 à p12, p15, p16,
p18, p19 ; non ouvertes : p07, p08, p13, p14, p17, p20 (Finances, entrée, × › Abandonner, même état qu'à 390 ; `preuveEncore:false` lu en sortie).
« Confirmer » jamais touché ; × › Abandonner à chaque passage. `pageErreurs []` sur les quatre.

## Les bloquants du jeu 6, rejoués

| jeu 6 | vu au jeu 7 | verdict |
|---|---|---|
| 1 · nom d'une ligne, montant d'une autre | m, p : 29 lignes ; les 29 noms et montants comparés au ticket (photo ouverte) : 29/29 justes (VITRIFIC 86,85 … BROSSE RADIATEUR 4,95, SERRE-JOINT 14,90, CRATTE-VTTRES 8,90, JEU DE CLES 8,90, METRE 7,90, CHANTLLES 6,50) ; somme 277,60, « 74,45 CHF manquants › Comparer à la photo » (le ticket imprime 352,05 : l'écart est réel) | **tient** |
| 2 · 16 outils au stock | m, p : « Rénovation 29 » (Peinture et sols 5, Outillage 5, Divers travaux 20), « Pour quoi ? BAUHAUS · matériel, travaux », 0 icône de stock, « article — · hors stock » sur la ligne ouverte | **tient** |
| 3 · retirées 199,25 pour 149,25 | n, o : plus de rangée « retirées » ; 7 lignes, total 163,85 gardé, « Somme ≠ imprimé 213,85 / 163,85 +50,00 › Voir la ligne en trop » ouvre H21 | **mieux** (H21 100,00 reste la lecture, problème 6) |
| 4 · mots bruts | n, o, m, p : `motsBruts []` ; pied « désignation : lectures divergentes (H21 A vaccinaton … / H21 A vaccination …) » en clair | **tient** |
| cache = flux (jeu 5 n° 1) | o = n (mêmes 7 lignes, mêmes rangées) ; p = m pour les 29 lignes et montants ; seules les traces de correction diffèrent (problème 5) | **tient** |

## Sa question : « combien et quels problèmes il y a ? »

1. **BLOQUANT — Sun Store : « Payé · TWINT ≠ imprimé 14,60 / 163,85 −149,25 › Voir le règlement », et le règlement n'a pas de montant.** n-04, o-04 : le ticket imprime TWINT 163,85 (le jeu 6 le disait : « Le terminal affiche 163,85 ») ; l'écran retient le 14,60 de la seconde page comme payé. Touché, « Voir le règlement » (n-10, o-09) ouvre le bloc « payé le · supposée 09.11 / facture 09.11 · Déjà payé · Moyen TWINT · C'est la date » : aucune case montant, rien pour remettre 163,85. Le jeu 6 offrait « Remettre 163,85 » ; la règle p3 (`payeCopieDuTotal`) ne joue que si le total a changé, et ici le total est juste. En brasseur : « j'ai payé 163,85, c'est écrit TWINT 163,85 sur le ticket, et il me dit que j'ai payé 14,60 et me montre des dates ». Valeur fausse + geste sans effet utile (SPEC 09.11 : « le renvoie est très étrange »). Attendu : terminal lu = total → payé = 163,85 (« Payé = imprimé · TWINT 163,85 ») ; sinon la rangée porte « Remettre 163,85 ».
2. **BLOQUANT — Sun Store : « Articles lus ≠ comptés 7 / 13 −6 › Comparer à la photo » en rouge.** n-04, o-04 : les deux tickets ont 7 lignes, l'écran en montre 7 ; « 13 comptés » n'est écrit nulle part sur les pièces. Première rangée du bloc, rouge, pour une chose juste (08.11 : « On a l'impression que c'est faux alors que c'est juste »). Toucher : la photo s'ouvre, rien à comparer. Attendu : pas de rangée quand le compte lu n'est pas imprimé, ou compte par page.
3. **BLOQUANT — BAUHAUS : « Vues par une seule lecture 7 · +64,90 › Les garder · il resterait 9,55 » et « 7 lignes lues puis retirées 64,90 › Les garder » : les 7 sont des doublons.** m-08, p-08, p-09, p-10 : après « Les garder », 36 lignes, « ROBAN DE MASQUAGE SON 1 pièce × 4,50 » et « ROBAN DE MASQUAGE SON ? × — 4,50 », « APPRET ORTXESSEL 1L 18,90 » et « APPRET ORTXESSEL 18,90 », « ROULEUR 3,50 » deux fois, « ETERE NO LS100 11,50 » et « ETERE S000966661389 11,50 », « OPSHGE CHANTIER 3,10 » deux fois ; total 342,50, « 9,55 CHF manquants › Ajouter la ligne manquante », « Articles lus 36 · dont 7 gardées ». Le ticket a chacun une fois. « Il resterait 9,55 » pousse à garder des doubles parce que 64,90 approche les 74,45 qui manquent vraiment. Deux rangées pour le même fait (doute du jeu 6). Attendu : une ligne vue par une seule lecture, de nom proche et de montant égal à une ligne présente, est un doublon : ni proposée ni comptée ; une seule rangée.
4. **BLOQUANT — BAUHAUS : 29 lignes « ? × — », « Qté × prix 0/29 », badge rouge « 29 à remplir », ligne ouverte « unité à remplir » en rouge.** m-05, m-06, p-05, p-06 : le ticket imprime « 1 » à droite de chaque montant ; le jeu 6 affichait « 1 pièce × 3,10 » ; la pastille barrée sous VITRIFIC (« ~~1 pièce × 86,85~~ ») et le pied après « Les garder » (« VITRIFIC.P.SGL 5.8KG 86,85 · 2 valeurs corrigées ») montrent que la fusion a effacé la quantité et le prix lus et compte la perte comme une correction. Régression ; 29 gestes demandés en rouge sur une dépense Rénovation hors stock (09.11 : « pas besoin d'avoir tout mes outils … juste ce qui concerne vraiment le brassage »). Attendu : la quantité et le prix d'accord restent (le redressement « ramène le montant, le prix, la quantité » selon p3 : ici ils partent) ; aucun « à remplir » sur une ligne hors stock.
5. **BLOQUANT — BAUHAUS, lecture neuve (m) : des corrections qui n'ont pas eu lieu.** m-05, m-06, m-09 : sous « ROBAN DE MASQUAGE SON » barré « PINCEAU PLAT 40MM · 1 pièce × 3,40 · 3,40 » ; sous « COLLE DE CONTACT 120G » barré « VIS PEITURE BOIS 4440 · 5,20 » ; « APPRET » sur « ~~CUTTER 18MM 2,40~~ » ; « TURBINE » sur « ~~BAC A~~ » ; « BROSSE LATT0B » sur « ~~BNOSEE~~ » ; « BAC A » sur « ~~BAUHAUS BUT NAAKU~~ » ; « OPSHGE » sur « ~~METRE AUGAR ON · 7,90~~ » : seize lignes environ, chacune « corrigée » depuis sa voisine du ticket. Pied « ROULEUR 650065565255 3,50 · pas retrouvée · 1/37 › Garder / Retirer » alors que ROULEUR 3,50 est dans la liste et sur le ticket ; « 37 corrigées › Tout valider ». Au cache (p) : 0 barré, « 7 corrigées », « 1/8 ». Les 29 montants finaux sont justes : c'est l'appariement provisoire → final de l'écran qui est décalé d'un rang, pas la lecture. En brasseur : « il a transformé mon pinceau en ruban ? » ; « Retirer » enlèverait une ligne juste. Attendu : l'écran apparie comme la fonction (ancres, ressemblance du nom), jamais par le rang ; rien à « valider » quand nom et montant finaux sont ceux d'une ligne provisoire.
6. **Sun Store : H21 « 2 × 50,00 = 100,00 » pour 50,00 imprimés** (jeu 6 n° 3) : lecture ; dit en rouge « +50,00 › Voir la ligne en trop », qui ouvre la bonne ligne. Non bloquant, inchangé.
7. **Pied fixe à 390 sur toutes les vues** : « H21 … — désignation… désaccord · Garder / Voir » (n), « ROULEUR … pas retrouvée · 1/37 · Tout valider · Garder / Retirer » (m) : quatre lignes mangées en défilant. Jeux 4 à 6, hors contrat. Non bloquant.
8. **« Lectures 3/3 · 46 désaccords › Voir le désaccord »** (m-09, p-09) ouvre « BAUHAUS BUT NAAMU » avec quantité vide et « unité à remplir » rouge : le désaccord (NAAKU / BAC A BIXT6, dans le pied) ne se voit pas dans la ligne ouverte ; 46 désaccords pour 29 lignes ne dit rien d'actionnable. Non bloquant.

## Table des captures

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| bauhaus m 01, 02 | cave | 390 | Finances ; entrée : un bouton « Documents » + « Photographier le ticket » + « Saisir sans justificatif », note « Un fichier, ou plusieurs photos du même ticket · PDF ou image · 4 Mo max. » | — | — |
| bauhaus m 03, 04 | cave | 390 | neuf 32 s : 352,05, 29 lignes, « 74,45 CHF manquants », Somme rouge, « Vues par une seule lecture 7 », « 7 retirées 64,90 », Payé vert 352,05, Qté × prix 0/29, « 29 à remplir », « 37 corrigées » | 3, 4 | 3, 4 |
| bauhaus m 05, 06 | cave | 390 | lignes : Rénovation 29 (Peinture 5, Outillage 5), 0 icône de stock, montants = ticket ; « ? × — » partout ; noms barrés d'une voisine ; pied « ROULEUR pas retrouvée 1/37 » | 4, 5, 7 | 4, 5 |
| bauhaus m 07 | cave | 390 | Somme → photo ouverte, focus sur la pastille | — | — |
| bauhaus m 08 | cave | 390 | « Les garder » → 36 lignes, 342,50, « 9,55 manquants › Ajouter la ligne manquante », « 7/7 · 29 sans prix unitaire », pied « VITRIFIC 86,85 · 2 valeurs corrigées · 1/30 » | 3, 4 | 3, 4 |
| bauhaus m 09, 10 | cave | 390 | Lectures → BAUHAUS BUT NAAMU ouverte (unité à remplir rouge) ; bloc fin | 4, 8 | 4 |
| bauhaus m 11, 12 | cave | 390 | × › Abandonner, retour Finances | — | — |
| sunstore n 01 à 03 | cave | 390 | Finances ; entrée ; pages 1, 2, « + page », « Lire 2 pages · ajoute la suivante, puis Lire » | — | — |
| sunstore n 04, 05 | cave | 390 | neuf 9 s : 163,85, 7 lignes, « 50,00 CHF en trop », Articles 7/13 rouge, Somme +50,00 rouge, Payé 14,60/163,85 rouge, TVA 0,37 et « 2 taux » verts, Qté × prix 5/5 | 1, 2, 6 | 1, 2 |
| sunstore n 06, 07 | cave | 390 | Services 1 (H21 2 × 50,00 100,00), Autres 6 ; pied « désaccord · Garder / Voir » | 6, 7 | — |
| sunstore n 08 | cave | 390 | Articles → les deux photos ouvertes | 2 | 2 |
| sunstore n 09 | cave | 390 | Somme → H21 ouverte (2 · pièce · 50,00 = 100,00) | 6 | — |
| sunstore n 10 | cave | 390 | Payé → bloc règlement (dates, Déjà payé, TWINT), sans montant | 1 | 1 |
| sunstore n 11, 12 | cave | 390 | Lectures → H21 ouverte ; bloc fin | — | — |
| sunstore n 13, 14 | cave | 390 | × › Abandonner, retour Finances | — | — |
| bauhaus p 01, 02 | clair | 1280 | Finances ; entrée (non ouvertes, sortie lue) | — | — |
| bauhaus p 03 à 06 | clair | 1280 | cache 2 s : mêmes 29 lignes et montants que m, 0 barré, « 7 corrigées », pied « ROULEUR pas retrouvée 1/8 », « ? × — » partout, « 29 à remplir » | 3, 4, 5 | 3, 4, 5 |
| bauhaus p 07, 08 | clair | 1280 | Somme → photo ; « Les garder » → doublons visibles côte à côte (ROBAN, APPRET), « Protection 2 » | 3 | 3 |
| bauhaus p 09, 10 | clair | 1280 | Lectures → BAUHAUS BUT NAAMU ouverte ; ROULEUR deux fois, ETERE deux fois, OPSHGE deux fois | 3, 8 | 3 |
| bauhaus p 11, 12 | clair | 1280 | × › Abandonner (non ouvertes, `preuveEncore:false`) | — | — |
| sunstore o 01, 02 | clair | 1280 | Finances ; entrée (non ouvertes) | — | — |
| sunstore o 03 à 06 | clair | 1280 | pages jointes ; cache 3 s : identique à n (7 lignes, 163,85, Articles 7/13, Somme +50,00, Payé 14,60) | 1, 2, 6 | 1, 2 |
| sunstore o 08 à 11 | clair | 1280 | Lectures → H21 ; Payé → bloc règlement sans montant ; Somme → H21 ; Articles → photos | 1, 2 | 1, 2 |
| sunstore o 12 à 14 | clair | 1280 | bloc fin ; × › Abandonner (13, 14 non ouvertes) | — | — |

## Doutes (non comptés)
- Note d'entrée « plusieurs photos du même ticket » : Sun Store, ce sont deux tickets d'un même règlement ; la note ne dit pas que c'est permis.
- En-tête « BAUHAUS ~~BAUHAUS Fachcentren AG~~ » : le fournisseur imprimé est barré comme une correction.
- Le 74,45 qui manque est réel (29 lignes imprimées = 277,60, total 352,05) : une ligne sous la tache, ou le ticket « piège » ; l'écran le dit honnêtement, mais « Ajouter la ligne manquante » après les doublons mène à une ligne fausse.
- « 29 lignes » lues d'un coup : au jeu 6, 28 ; la variance de la 3.8 n'est pas mesurée (p3 § 5).
- 390 clair et 1280 cave non joués (budget : 2 lectures Gemini).

LEÇON PROPOSÉE : une correction du modèle de lecture se rejoue aussi à l'écran côté flux (lecture neuve), pas seulement au cache : le jeu 7 montre les mêmes 29 montants justes dans les deux, mais seule la lecture neuve affiche des « corrections » décalées et un « 1/37 » ; la vue du banc p3 (lectures fictives, final seul) ne pouvait pas le voir.
